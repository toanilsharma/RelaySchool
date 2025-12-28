import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Zap, Power, AlertTriangle,
  RotateCcw, Play, Pause, Info,
  ShieldAlert, CheckCircle2,
  MousePointer2, BookOpen, GraduationCap,
  X, List, HelpCircle, ChevronRight, Settings,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---

const NODE_TYPES = {
  GRID: 'GRID',
  BUS: 'BUS',
  BREAKER: 'BREAKER',
  TRANSFORMER: 'TRANSFORMER',
  LOAD: 'LOAD'
} as const;

type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES];

interface BaseNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  voltagekV: number;
  faulted?: boolean;
  ratingAmps?: number;
  status?: string;
}

interface GridNode extends BaseNode {
  type: typeof NODE_TYPES.GRID;
}

interface BusNode extends BaseNode {
  type: typeof NODE_TYPES.BUS;
}

interface BreakerNode extends BaseNode {
  type: typeof NODE_TYPES.BREAKER;
  status: 'CLOSED' | 'OPEN' | 'TRIPPED';
  ratingAmps: number;
  ansi: string[];
  ctRatio: string;
}

interface TransformerNode extends BaseNode {
  type: typeof NODE_TYPES.TRANSFORMER;
  vectorGroup: string;
  ansi: string[];
}

interface LoadNode extends BaseNode {
  type: typeof NODE_TYPES.LOAD;
  loadMW: number;
  ratingAmps?: number; // Added to satisfy potential checks or optional usage
}

type Node = GridNode | BusNode | BreakerNode | TransformerNode | LoadNode;

// --- DATA & SCENARIOS ---

const SCENARIOS = {
  normal: {
    id: 'normal',
    name: "Normal Operations",
    desc: "Nominal system state. All feeders are balanced. Ideal for learning breaker switching sequences.",
    setup: (nodes) => nodes.map(n => ({
      ...n,
      status: n.type === NODE_TYPES.BREAKER ? 'CLOSED' : undefined,
      faulted: false,
      loadMW: n.type === NODE_TYPES.LOAD ? (n.id === 'load2' ? 15 : 5) : undefined
    }))
  },
  overload: {
    id: 'overload',
    name: "Scenario: ANSI 51 (Overload)",
    desc: "Industrial Feeder 2 is drawing excessive current. Watch the Inverse Time Overcurrent relay trip after a delay.",
    setup: (nodes) => nodes.map(n => {
      if (n.id === 'load2') return { ...n, loadMW: 38 }; // High load (Over rating)
      if (n.id.startsWith('cb_')) return { ...n, status: 'CLOSED', faulted: false };
      return { ...n, faulted: false };
    })
  },
  fault: {
    id: 'fault',
    name: "Scenario: ANSI 50 (Short Circuit)",
    desc: "A bolted fault on the Main 33kV Bus. This tests the Instantaneous Overcurrent protection (fast trip).",
    setup: (nodes) => nodes.map(n => {
      if (n.id === 'bus_mv') return { ...n, faulted: true };
      if (n.id === 'cb_f1') return { ...n, status: 'OPEN' }; // Isolate downstream
      return { ...n, status: n.type === NODE_TYPES.BREAKER ? 'CLOSED' : undefined };
    })
  }
};

const INITIAL_NODES: Node[] = [
  { id: 'grid', type: NODE_TYPES.GRID, x: 400, y: 60, label: 'Utility Grid', voltagekV: 132 },
  {
    id: 'cb_main', type: NODE_TYPES.BREAKER, x: 400, y: 150, label: 'Main Breaker 52-M', voltagekV: 132,
    status: 'CLOSED', ratingAmps: 2000,
    ansi: ['50', '51', '50N'], ctRatio: '2000:5'
  },
  {
    id: 'tx1', type: NODE_TYPES.TRANSFORMER, x: 400, y: 240, label: 'TX-01 (132/33kV)', voltagekV: 132,
    vectorGroup: 'Dyn11', ansi: ['87T', '63', '49']
  },
  { id: 'bus_mv', type: NODE_TYPES.BUS, x: 400, y: 320, label: '33kV Main Bus', voltagekV: 33 },

  // Feeder 1
  {
    id: 'cb_f1', type: NODE_TYPES.BREAKER, x: 150, y: 400, label: 'Feeder 52-F1', voltagekV: 33,
    status: 'CLOSED', ratingAmps: 800,
    ansi: ['50', '51'], ctRatio: '800:5'
  },
  { id: 'load1', type: NODE_TYPES.LOAD, x: 150, y: 520, label: 'Residential Area', voltagekV: 33, loadMW: 5 },

  // Feeder 2
  {
    id: 'cb_f2', type: NODE_TYPES.BREAKER, x: 400, y: 400, label: 'Feeder 52-F2', voltagekV: 33,
    status: 'CLOSED', ratingAmps: 800,
    ansi: ['50', '51'], ctRatio: '800:5'
  },
  { id: 'load2', type: NODE_TYPES.LOAD, x: 400, y: 520, label: 'Industrial Zone', voltagekV: 33, loadMW: 15 },

  // Feeder 3
  {
    id: 'cb_f3', type: NODE_TYPES.BREAKER, x: 650, y: 400, label: 'Feeder 52-F3', voltagekV: 33,
    status: 'CLOSED', ratingAmps: 800,
    ansi: ['50', '51'], ctRatio: '800:5'
  },
  { id: 'load3', type: NODE_TYPES.LOAD, x: 650, y: 520, label: 'Hospital Critical', voltagekV: 33, loadMW: 8 },
];

const INITIAL_LINKS = [
  { id: 'l1', source: 'grid', target: 'cb_main', ratingAmps: 3000 },
  { id: 'l2', source: 'cb_main', target: 'tx1', ratingAmps: 3000 },
  { id: 'l3', source: 'tx1', target: 'bus_mv', ratingAmps: 3000 },
  { id: 'l4', source: 'bus_mv', target: 'cb_f1', ratingAmps: 1000 },
  { id: 'l5', source: 'cb_f1', target: 'load1', ratingAmps: 1000 },
  { id: 'l6', source: 'bus_mv', target: 'cb_f2', ratingAmps: 1000 },
  { id: 'l7', source: 'cb_f2', target: 'load2', ratingAmps: 1000 },
  { id: 'l8', source: 'bus_mv', target: 'cb_f3', ratingAmps: 1000 },
  { id: 'l9', source: 'cb_f3', target: 'load3', ratingAmps: 1000 },
];

// --- PHYSICS ENGINE ---

const calculatePhysics = (nodes: Node[], links: typeof INITIAL_LINKS) => {
  const energized = new Set();
  const currents: Record<string, number> = {};

  // 1. Energization Trace (BFS)
  const queue = ['grid'];
  const gridNode = nodes.find(n => n.id === 'grid');
  if (gridNode) energized.add('grid');

  while (queue.length > 0) {
    const currId = queue.shift();
    const node = nodes.find(n => n.id === currId);

    if (node?.type === NODE_TYPES.BREAKER && node.status !== 'CLOSED') continue;

    links.forEach(link => {
      if (link.source === currId && !energized.has(link.target)) {
        energized.add(link.target);
        queue.push(link.target);
      }
      if (link.target === currId && !energized.has(link.source)) {
        energized.add(link.source);
        queue.push(link.source);
      }
    });
  }

  // 2. Current Calculation
  nodes.forEach(n => currents[n.id] = 0);

  nodes.forEach(n => {
    if (n.type === NODE_TYPES.LOAD) {
      if (energized.has(n.id)) {
        currents[n.id] = (n.loadMW * 1000) / n.voltagekV;
      }
      if (n.faulted && energized.has(n.id)) currents[n.id] += 15000;
    }
  });

  ['cb_f1', 'cb_f2', 'cb_f3'].forEach((cbId, i) => {
    const loadId = `load${i + 1}`;
    currents[cbId] = currents[loadId];
    const cb = nodes.find(n => n.id === cbId);
    if (cb && cb.faulted && energized.has(cbId)) currents[cbId] += 15000;
  });

  const busFault = nodes.find(n => n.id === 'bus_mv')?.faulted ? 25000 : 0;
  const totalFeederLoad = currents['cb_f1'] + currents['cb_f2'] + currents['cb_f3'];
  currents['bus_mv'] = totalFeederLoad + (energized.has('bus_mv') ? busFault : 0);

  currents['tx1'] = currents['bus_mv'];
  if (nodes.find(n => n.id === 'tx1')?.faulted && energized.has('tx1')) currents['tx1'] += 20000;

  currents['cb_main'] = currents['tx1'];
  currents['grid'] = currents['cb_main'];

  return { energized, currents };
};


// --- COMPONENTS ---

const TutorialOverlay = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row max-h-[85vh]">
      <div className="md:w-1/3 bg-blue-600 p-8 text-white flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Mastering Protection</h2>
          <p className="text-blue-100 leading-relaxed">
            Welcome to the Digital Substation Simulator. This tool is designed to bridge the gap between electrical theory and operational reality.
          </p>
        </div>
        <div className="mt-8">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">Developed For</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Protection Engineers</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> System Operators</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Electrical Students</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">What You Will Learn</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold">50</div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Instantaneous Trip</h4>
                <p className="text-sm text-slate-500 mt-1">Simulate short circuits to see relays trip instantly.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold">51</div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Time Overcurrent</h4>
                <p className="text-sm text-slate-500 mt-1">Overload a feeder and watch the "Inverse Time" curve.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">52</div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Breaker Control</h4>
                <p className="text-sm text-slate-500 mt-1">Manually operate breakers to restore power or isolate faults.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
          >
            Start Simulation <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

const AnimatedLink = ({ link, nodes, physics }: { link: any, nodes: Node[], physics: any }) => {
  const src = nodes.find(n => n.id === link.source);
  const tgt = nodes.find(n => n.id === link.target);

  if (!src || !tgt) return null;

  const isEnergized = physics.energized.has(link.source) && physics.energized.has(link.target);

  const amps = physics.currents[link.target] || physics.currents[link.source] || 0;
  const loadPct = amps / link.ratingAmps;

  let color = '#94a3b8';
  if (isEnergized) {
    if (loadPct > 1.2) color = '#ef4444';
    else if (loadPct > 0.9) color = '#f59e0b';
    else color = '#3b82f6';
  }

  const lineVariants = {
    energized: { strokeDashoffset: -20, transition: { repeat: Infinity, ease: "linear", duration: 1 } },
    static: { strokeDashoffset: 0 }
  };

  return (
    <g>
      <motion.line
        x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
        stroke={color}
        strokeWidth={isEnergized ? 4 : 2}
        strokeOpacity={isEnergized ? 0.3 : 0.2}
        initial={false}
        animate={{ stroke: color, strokeWidth: isEnergized ? 4 : 2 }}
      />
      {isEnergized && (
        <motion.line
          x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
          stroke={color}
          strokeWidth={2}
          strokeDasharray="8 8"
          variants={lineVariants}
          animate="energized"
        />
      )}
    </g>
  );
};

const NodeItem = ({ node, isSelected, isEnergized, onClick, currents }: { node: Node, isSelected: boolean, isEnergized: boolean, onClick: () => void, currents: any }) => {
  const isFaulted = node.faulted;
  const current = currents[node.id] || 0;

  let strokeColor = '#94a3b8';
  let fillColor = '#e2e8f0';

  if (isEnergized) {
    if (isFaulted) {
      strokeColor = '#ef4444';
      fillColor = '#fee2e2';
    } else {
      strokeColor = node.type === NODE_TYPES.GRID ? '#3b82f6' :
        node.type === NODE_TYPES.LOAD ? '#a855f7' :
          node.type === NODE_TYPES.BUS ? '#64748b' : '#3b82f6';
      fillColor = '#ffffff';
    }
  }

  // FIX: Using `initial={{ x, y }}` allows Framer Motion to handle positioning
  // correctly without conflicting with `whileHover` scales.
  // Using `transform` prop directly causes conflicts.
  return (
    <motion.g
      initial={{ x: node.x, y: node.y }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence>
        {isSelected && (
          <motion.circle
            r={40}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="4 4"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </AnimatePresence>

      {isFaulted && (
        <motion.circle
          r={45}
          fill="#ef4444"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}

      <circle
        r={node.type === NODE_TYPES.BUS ? 15 : 28}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={3}
      />

      <g transform="translate(-12, -12)">
        {node.type === NODE_TYPES.GRID && <Zap className="w-6 h-6 text-blue-600" />}
        {node.type === NODE_TYPES.BREAKER && (
          <Power className={`w-6 h-6 ${node.status === 'CLOSED' ? 'text-emerald-600' : 'text-slate-400'}`} />
        )}
        {node.type === NODE_TYPES.LOAD && <Activity className="w-6 h-6 text-purple-600" />}
        {node.type === NODE_TYPES.TRANSFORMER && <Zap className="w-6 h-6 text-amber-500" />}
        {node.type === NODE_TYPES.BUS && <Settings className="w-6 h-6 text-slate-500" />}
      </g>

      {node.type === NODE_TYPES.BREAKER && (
        <g transform="translate(0, -38)">
          <rect x="-24" width="48" height="16" rx="4" fill={node.status === 'CLOSED' ? '#10b981' : node.status === 'TRIPPED' ? '#ef4444' : '#64748b'} />
          <text x="0" y="11" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{node.status}</text>
        </g>
      )}

      <text y="45" textAnchor="middle" className="text-[10px] font-bold fill-slate-500 uppercase tracking-tight bg-white/80" style={{ textShadow: '0 0 4px white' }}>
        {node.label}
      </text>

      {isEnergized && current > 10 && (
        <text y="56" textAnchor="middle" className={`text-[10px] font-mono ${current > (node.type === NODE_TYPES.BREAKER ? node.ratingAmps : node.ratingAmps || 1000) ? 'fill-red-600 font-bold' : 'fill-slate-400'}`}>
          {current.toFixed(0)} A
        </text>
      )}

    </motion.g>
  );
};


const LogPanel = ({ logs }: { logs: any[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [logs]);

  return (
    <div className="flex flex-col h-48 bg-slate-900 text-slate-300 font-mono text-xs border-t border-slate-700">
      <div className="flex items-center px-4 py-2 bg-slate-800 border-b border-slate-700 gap-2 sticky top-0">
        <List className="w-3 h-3 text-blue-400" />
        <span className="uppercase font-bold text-slate-400 tracking-wider text-[10px]">Sequence of Events (SOE)</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 && <div className="text-slate-600 italic px-2">System ready. Waiting for events...</div>}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 hover:bg-slate-800 p-1 rounded transition-colors">
            <span className="text-slate-500 shrink-0">{log.time}</span>
            <span className={`shrink-0 font-bold ${log.type === 'TRIP' ? 'text-red-400' : 'text-blue-400'}`}>{log.device}</span>
            <span className="text-slate-300">{log.details}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const DigitalSubstationPro = () => {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [physics, setPhysics] = useState(calculatePhysics(INITIAL_NODES, INITIAL_LINKS));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [activeScenario, setActiveScenario] = useState('normal');

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const nextPhysics = calculatePhysics(nodes, INITIAL_LINKS);
      setPhysics(nextPhysics);

      let stateChanged = false;
      const newNodes = nodes.map(n => {
        if (n.type === NODE_TYPES.BREAKER && n.status === 'CLOSED') {
          const current = nextPhysics.currents[n.id];
          const limit = n.ratingAmps || 1000;

          if (current > limit * 5) {
            addLog(n.label, 'TRIP (ANSI 50)', `Detected ${current.toFixed(0)}A (>>${limit * 5}A)`, 'TRIP');
            stateChanged = true;
            return { ...n, status: 'TRIPPED' };
          }

          if (current > limit * 1.2) {
            if (Math.random() > 0.8) {
              addLog(n.label, 'TRIP (ANSI 51)', `Overload ${current.toFixed(0)}A (> ${limit}A)`, 'TRIP');
              stateChanged = true;
              return { ...n, status: 'TRIPPED' };
            }
          }
        }
        return n;
      });

      if (stateChanged) setNodes(newNodes as Node[]);

    }, 1000);
    return () => clearInterval(interval);
  }, [nodes, isRunning]);

  const addLog = (device: string, event: string, details: string, type = 'INFO') => {
    const entry = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      device, event, details, type
    };
    setLogs(prev => [entry, ...prev].slice(0, 50));
  };

  const loadScenario = (key) => {
    const scenario = SCENARIOS[key];
    setNodes(scenario.setup(INITIAL_NODES));
    setActiveScenario(key);
    addLog('SYSTEM', 'SCENARIO CHANGE', `Loaded: ${scenario.name}`);
    setSelectedId(null);
  };

  const selectedNode = nodes.find(n => n.id === selectedId);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-hidden">

      {/* --- HEADER --- */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Digital Substation <span className="text-blue-600">Pro</span></h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">System Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {Object.values(SCENARIOS).map(sc => (
              <button
                key={sc.id}
                onClick={() => loadScenario(sc.id)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeScenario === sc.id
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                {sc.name.split(':')[0]}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2"></div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-2 rounded-full border transition-colors ${isRunning
                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                }`}
              title={isRunning ? "Pause Simulation" : "Resume Simulation"}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => { setNodes(INITIAL_NODES); setLogs([]); setActiveScenario('normal'); }}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-transparent hover:border-slate-300 transition-colors"
              title="Reset System"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 transition-colors"
              title="Help / Instructions"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* CANVAS */}
        <div className="flex-1 relative bg-slate-100 dark:bg-slate-950/50" onClick={() => setSelectedId(null)}>

          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>

          <svg className="w-full h-full max-w-full max-h-full select-none" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
            {INITIAL_LINKS.map(link => (
              <AnimatedLink key={link.id} link={link} nodes={nodes} physics={physics} />
            ))}
            {nodes.map(node => (
              <NodeItem
                key={node.id}
                node={node}
                isSelected={selectedId === node.id}
                isEnergized={physics.energized.has(node.id)}
                currents={physics.currents}
                onClick={() => setSelectedId(node.id)}
              />
            ))}
          </svg>

          <AnimatePresence>
            {activeScenario !== 'normal' && (
              <motion.div
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-xl backdrop-blur-md border border-slate-700 flex items-center gap-3 z-10"
              >
                <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-sm font-medium">{SCENARIOS[activeScenario].desc}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SIDEBAR (Drawer) */}
        <motion.div
          className="absolute top-0 right-0 bottom-0 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-30 flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: selectedId ? 0 : '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {selectedNode ? (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Asset Configuration</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{selectedNode.label}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-slate-700">
                    ID: {selectedNode.id}
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-slate-700">
                    {selectedNode.voltagekV} kV
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Live Telemetry */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-blue-500" /> Real-time Telemetry
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-slate-500 uppercase font-bold">Current (RMS)</span>
                      <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
                        {physics.currents[selectedNode.id]?.toFixed(0)} <span className="text-sm text-slate-400">A</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500"
                        animate={{
                          width: `${Math.min(100, (physics.currents[selectedNode.id] / (selectedNode.ratingAmps || 2000)) * 100)}%`,
                          backgroundColor: physics.currents[selectedNode.id] > (selectedNode.ratingAmps || 2000) ? '#ef4444' : '#3b82f6'
                        }}
                        transition={{ type: "spring", stiffness: 50 }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                      <span>0 A</span>
                      <span>Rated: {selectedNode.ratingAmps || 'N/A'} A</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4 text-slate-500" /> Operations
                  </h3>

                  <div className="space-y-3">
                    {selectedNode.type === NODE_TYPES.BREAKER && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, status: 'CLOSED', faulted: false } : n))}
                          disabled={selectedNode.status === 'CLOSED'}
                          className="py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm shadow-sm transition-all"
                        >
                          CLOSE
                        </button>
                        <button
                          onClick={() => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, status: 'OPEN' } : n))}
                          disabled={selectedNode.status === 'OPEN'}
                          className="py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm shadow-sm transition-all"
                        >
                          TRIP
                        </button>
                      </div>
                    )}

                    {selectedNode.type === NODE_TYPES.LOAD && (
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Demand Setpoint (MW)</label>
                        <input
                          type="range" min="0" max="40" step="1"
                          value={selectedNode.loadMW}
                          onChange={(e) => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, loadMW: parseInt(e.target.value) } : n))}
                          className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-xs mt-1 font-mono">
                          <span>0 MW</span>
                          <span>{selectedNode.loadMW} MW</span>
                          <span>40 MW</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, faulted: !n.faulted } : n))}
                      className={`w-full py-3 rounded-lg font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${selectedNode.faulted
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                        : 'border-red-200 hover:border-red-400 text-red-600 bg-red-50'
                        }`}
                    >
                      {selectedNode.faulted ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {selectedNode.faulted ? 'CLEAR FAULT' : 'INJECT FAULT'}
                    </button>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl">
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm mb-1 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Engineering Note
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    {selectedNode.type === NODE_TYPES.BREAKER && "This breaker is protected by ANSI 50 (Instantaneous) and 51 (Time-Overcurrent) elements. Fault currents >5x rating will trip instantly."}
                    {selectedNode.type === NODE_TYPES.TRANSFORMER && "Transformers are vulnerable to internal faults. Differential protection (87T) compares current entry vs exit to detect issues."}
                    {selectedNode.type === NODE_TYPES.LOAD && "Loads determine the system current flow. Increasing demand beyond breaker ratings will trigger thermal overload protection."}
                    {selectedNode.type === NODE_TYPES.BUS && "The Busbar is the critical node. A fault here requires isolating all connected feeders (Bus Differential Protection)."}
                  </p>
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <MousePointer2 className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="font-bold text-lg text-slate-500">No Asset Selected</h3>
              <p className="text-sm">Click on any component in the single-line diagram to view telemetry and controls.</p>
            </div>
          )}

          {/* LOGS at bottom of sidebar */}
          <LogPanel logs={logs} />
        </motion.div>
      </div>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>

    </div>
  );
};

export default DigitalSubstationPro;