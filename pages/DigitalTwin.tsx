import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, Zap, Power, AlertTriangle, 
  RotateCcw, Play, Pause, Info, 
  ShieldAlert, CheckCircle2, 
  MousePointer2, BookOpen, GraduationCap,
  ArrowRight, X, Menu, ChevronDown, List, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---

type NodeType = 'GRID' | 'BUS' | 'BREAKER' | 'TRANSFORMER' | 'LOAD' | 'GEN';

interface NodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  voltagekV: number;
  // State
  status?: 'CLOSED' | 'OPEN' | 'TRIPPED'; 
  loadMW?: number; 
  ratingAmps?: number; 
  faulted?: boolean;
  // Engineering Data
  ansi?: string[]; // e.g. ['50', '51']
  ctRatio?: string; // e.g. "2000:5"
  vectorGroup?: string; // e.g. "Dyn11"
}

interface LinkData {
  id: string;
  source: string;
  target: string;
  ratingAmps: number;
}

interface LogEntry {
  id: number;
  time: string;
  device: string;
  event: string;
  details: string;
  type: 'INFO' | 'TRIP' | 'ALARM';
}

// --- SCENARIOS ---

const SCENARIOS = {
  normal: { 
    name: "Normal Operations", 
    desc: "System nominal. Verify CT ratios and breaker status.",
    setup: (nodes: NodeData[]) => nodes.map(n => ({ ...n, status: n.type === 'BREAKER' ? 'CLOSED' : undefined, faulted: false, loadMW: n.type === 'LOAD' ? 10 : undefined }))
  },
  overload: {
    name: "Scenario: ANSI 51 (Overload)", 
    desc: "Feeder 2 is overloaded. Monitor Inverse Time Overcurrent (51) element.",
    setup: (nodes: NodeData[]) => nodes.map(n => {
      if (n.id === 'load2') return { ...n, loadMW: 35 }; // High load
      if (n.id.startsWith('cb_')) return { ...n, status: 'CLOSED', faulted: false };
      return { ...n, faulted: false };
    })
  },
  fault: {
    name: "Scenario: ANSI 50 (Short Circuit)", 
    desc: "Fault on Main Bus. Testing Instantaneous Overcurrent (50) element.",
    setup: (nodes: NodeData[]) => nodes.map(n => {
      if (n.id === 'bus_mv') return { ...n, faulted: true };
      if (n.id === 'cb_lv') return { ...n, status: 'OPEN' }; // Upstream open
      return { ...n, status: n.type === 'BREAKER' ? 'CLOSED' : undefined };
    })
  }
};

// --- INITIAL DATA ---

const INITIAL_NODES: NodeData[] = [
  { id: 'grid', type: 'GRID', x: 400, y: 60, label: 'Utility Grid', voltagekV: 132 },
  { 
    id: 'cb_main', type: 'BREAKER', x: 400, y: 140, label: 'Main Breaker 52-M', voltagekV: 132, 
    status: 'CLOSED', ratingAmps: 2000, 
    ansi: ['50', '51', '50N', '51N'], ctRatio: '2000:5'
  },
  { 
    id: 'tx1', type: 'TRANSFORMER', x: 400, y: 220, label: 'TX-01', voltagekV: 132,
    vectorGroup: 'Dyn11', ansi: ['87T', '63', '49']
  },
  { id: 'bus_mv', type: 'BUS', x: 400, y: 300, label: '33kV Bus', voltagekV: 33 },

  // Feeder 1
  { 
    id: 'cb_f1', type: 'BREAKER', x: 150, y: 380, label: 'Feeder 52-F1', voltagekV: 33, 
    status: 'CLOSED', ratingAmps: 800,
    ansi: ['50', '51'], ctRatio: '800:5'
  },
  { id: 'load1', type: 'LOAD', x: 150, y: 500, label: 'Residential', voltagekV: 33, loadMW: 5 },

  // Feeder 2
  { 
    id: 'cb_f2', type: 'BREAKER', x: 400, y: 380, label: 'Feeder 52-F2', voltagekV: 33, 
    status: 'CLOSED', ratingAmps: 800,
    ansi: ['50', '51'], ctRatio: '800:5'
  },
  { id: 'load2', type: 'LOAD', x: 400, y: 500, label: 'Industrial', voltagekV: 33, loadMW: 15 },

  // Feeder 3
  { 
    id: 'cb_f3', type: 'BREAKER', x: 650, y: 380, label: 'Feeder 52-F3', voltagekV: 33, 
    status: 'CLOSED', ratingAmps: 800,
    ansi: ['50', '51'], ctRatio: '800:5'
  },
  { id: 'load3', type: 'LOAD', x: 650, y: 500, label: 'Hospital', voltagekV: 33, loadMW: 8 },
];

const INITIAL_LINKS: LinkData[] = [
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

const calculatePhysics = (nodes: NodeData[], links: LinkData[]) => {
  const energized = new Set<string>();
  const currents: Record<string, number> = {};
  
  // 1. Energization Trace (BFS)
  const queue = ['grid'];
  if (nodes.find(n => n.id === 'grid')) energized.add('grid');

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const node = nodes.find(n => n.id === currId);
    
    // Power stops at Open/Tripped breakers
    if (node?.type === 'BREAKER' && node.status !== 'CLOSED') continue;

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

  // 2. Current Calculation (Bottom Up)
  nodes.forEach(n => {
    if (n.type === 'LOAD') {
      const mw = energized.has(n.id) ? (n.loadMW || 0) : 0;
      currents[n.id] = (mw * 1000) / n.voltagekV; 
      if (n.faulted && energized.has(n.id)) currents[n.id] = 10000; // Fault current
    } else {
      currents[n.id] = 0;
    }
  });

  // Aggregate currents (Simplified tree structure)
  ['cb_f1', 'cb_f2', 'cb_f3'].forEach((cbId, i) => {
    const loadId = `load${i+1}`;
    currents[cbId] = currents[loadId];
  });
  
  const i_feeders = currents['cb_f1'] + currents['cb_f2'] + currents['cb_f3'];
  currents['bus_mv'] = i_feeders;
  if (nodes.find(n => n.id === 'bus_mv')?.faulted && energized.has('bus_mv')) currents['bus_mv'] += 20000;

  currents['tx1'] = currents['bus_mv'];
  currents['cb_main'] = currents['bus_mv'];
  currents['grid'] = currents['bus_mv'];

  return { energized, currents };
};

// --- SUB-COMPONENTS ---

const ExplanationCard = ({ title, children, icon: Icon, ansi }: any) => (
  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex gap-3 relative overflow-hidden">
    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg h-fit shrink-0 z-10">
      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
    </div>
    <div className="z-10 flex-1">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1">{title}</h4>
        {ansi && <span className="text-[10px] font-mono bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded text-blue-800 dark:text-blue-200">ANSI {ansi}</span>}
      </div>
      <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">{children}</p>
    </div>
  </div>
);

const SoePanel = ({ logs }: { logs: LogEntry[] }) => (
  <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
    <div className="flex items-center gap-2 mb-2">
      <List className="w-4 h-4 text-slate-500" />
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sequence of Events (SOE)</span>
    </div>
    <div className="bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto p-2 font-mono text-[10px]">
      {logs.length === 0 && <div className="text-slate-400 text-center py-2">No events recorded.</div>}
      {logs.map(log => (
        <div key={log.id} className="grid grid-cols-[auto_1fr] gap-2 py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <span className="text-slate-400">{log.time}</span>
          <span className={`${log.type === 'TRIP' ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>
            <span className="font-bold">{log.device}</span> {log.event} - {log.details}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const InstructorContent = ({ selectedNode, physics, setNodes, logs }: any) => {
  if (!selectedNode) return (
    <div className="text-center py-12 text-slate-400">
      <MousePointer2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>Select a component to view Engineering Data.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      {/* 1. Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Asset ID: {selectedNode.id}</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedNode.label}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
             selectedNode.faulted ? 'bg-red-100 text-red-600' : 
             selectedNode.status === 'TRIPPED' ? 'bg-red-100 text-red-600' : 
             selectedNode.status === 'OPEN' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-600'
           }`}>
             {selectedNode.faulted ? 'FAULT' : selectedNode.status || 'ONLINE'}
        </div>
      </div>

      {/* 2. Engineering Data */}
      <div className="grid grid-cols-2 gap-2 text-xs">
         <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
           <span className="text-slate-500 block">Nominal Voltage</span>
           <span className="font-mono font-bold">{selectedNode.voltagekV} kV</span>
         </div>
         {selectedNode.ctRatio && (
           <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
             <span className="text-slate-500 block">CT Ratio</span>
             <span className="font-mono font-bold">{selectedNode.ctRatio}</span>
           </div>
         )}
         {selectedNode.vectorGroup && (
           <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
             <span className="text-slate-500 block">Vector Group</span>
             <span className="font-mono font-bold">{selectedNode.vectorGroup}</span>
           </div>
         )}
         {selectedNode.ansi && (
           <div className="col-span-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex gap-2 items-center">
             <span className="text-slate-500">Protection:</span>
             <div className="flex gap-1">
               {selectedNode.ansi.map((code: string) => (
                 <span key={code} className="bg-slate-200 dark:bg-slate-700 px-1.5 rounded text-[10px] font-mono font-bold">{code}</span>
               ))}
             </div>
           </div>
         )}
      </div>

      {/* 3. Live Metrics */}
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
         <div className="flex justify-between items-end mb-2">
           <span className="text-xs font-bold text-slate-500 uppercase">Primary Current (RMS)</span>
           <span className={`text-2xl font-mono font-bold ${physics.currents[selectedNode.id] > (selectedNode.ratingAmps || 9999) ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
             {physics.currents[selectedNode.id]?.toFixed(0)} <span className="text-sm">A</span>
           </span>
         </div>
         {selectedNode.ratingAmps && (
           <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
             <div 
                className={`h-full transition-all duration-500 ${physics.currents[selectedNode.id] > selectedNode.ratingAmps ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, (physics.currents[selectedNode.id] / selectedNode.ratingAmps) * 100)}%` }}
             />
           </div>
         )}
      </div>

      {/* 4. Controls */}
      <div className="space-y-3 pt-2">
        {selectedNode.type === 'BREAKER' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setNodes((prev: any) => prev.map((n: any) => n.id === selectedNode.id ? { ...n, status: 'CLOSED', faulted: false } : n))}
              disabled={selectedNode.status === 'CLOSED'}
              className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            >
              CLOSE (52)
            </button>
            <button
              onClick={() => setNodes((prev: any) => prev.map((n: any) => n.id === selectedNode.id ? { ...n, status: 'OPEN' } : n))}
              disabled={selectedNode.status === 'OPEN'}
              className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            >
              TRIP (52)
            </button>
          </div>
        )}

        {selectedNode.type === 'LOAD' && (
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
            <div className="flex justify-between mb-2">
               <span className="font-bold text-sm">Load Demand</span>
               <span className="font-mono text-sm">{selectedNode.loadMW} MW</span>
            </div>
            <input 
              type="range" min="0" max="40" step="1"
              value={selectedNode.loadMW}
              onChange={(e) => setNodes((prev: any) => prev.map((n: any) => n.id === selectedNode.id ? { ...n, loadMW: Number(e.target.value) } : n))}
              className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        )}

        <button
          onClick={() => setNodes((prev: any) => prev.map((n: any) => n.id === selectedNode.id ? { ...n, faulted: !n.faulted } : n))}
          className={`w-full py-3 font-bold rounded-lg border-2 flex items-center justify-center gap-2 transition-all text-sm ${
            selectedNode.faulted 
              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
              : 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
          }`}
        >
          {selectedNode.faulted ? <CheckCircle2 className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
          {selectedNode.faulted ? 'CLEAR FAULT' : 'INJECT SHORT CIRCUIT'}
        </button>
      </div>

      {/* 5. Educational Context */}
      <div className="space-y-2">
        {selectedNode.type === 'BREAKER' && (
          <ExplanationCard title="Circuit Breaker (52)" icon={ShieldAlert} ansi="50/51">
            Primary protection device. Controlled by relays monitoring ANSI 50 (Instantaneous) and 51 (Time-Overcurrent) elements.
          </ExplanationCard>
        )}
        {selectedNode.type === 'TRANSFORMER' && (
          <ExplanationCard title="Power Transformer" icon={Zap} ansi="87T">
            Protected by Differential Relay (87T) which compares current in vs current out. Vector group {selectedNode.vectorGroup} dictates phase shift.
          </ExplanationCard>
        )}
      </div>

      <SoePanel logs={logs} />
    </div>
  );
};

// --- MAIN APP ---

const DigitalSubstation = () => {
  const [nodes, setNodes] = useState<NodeData[]>(INITIAL_NODES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [physics, setPhysics] = useState(calculatePhysics(INITIAL_NODES, INITIAL_LINKS));
  const [isRunning, setIsRunning] = useState(true);
  const [alert, setAlert] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    if (selectedId) setIsPanelOpen(true);
  }, [selectedId]);

  const addLog = (device: string, event: string, details: string, type: 'INFO' | 'TRIP' | 'ALARM') => {
    const newLog = {
      // FIX: Added random component to avoid duplicate keys on simultaneous events in the simulation loop
      id: Date.now() + Math.random(), 
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
      device, event, details, type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 20));
  };

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const newState = calculatePhysics(nodes, INITIAL_LINKS);
      setPhysics(newState);

      // Protection Logic (Relay Simulation)
      let tripped = false;
      const newNodes = nodes.map(n => {
        if (n.type === 'BREAKER' && n.status === 'CLOSED') {
          const amps = newState.currents[n.id];
          const limit = n.ratingAmps || 1000;

          // ANSI 50: Instantaneous Overcurrent
          if (amps > limit * 5) { 
            tripped = true;
            const msg = `ANSI 50 Trip (I >> ${amps.toFixed(0)}A)`;
            setAlert(`${n.label}: ${msg}`);
            addLog(n.label, 'TRIP', msg, 'TRIP');
            return { ...n, status: 'TRIPPED' as const };
          }
          // ANSI 51: Time Inverse Overcurrent
          if (amps > limit * 1.2) { 
             if (Math.random() > 0.85) { 
                tripped = true;
                const msg = `ANSI 51 Trip (Overload ${amps.toFixed(0)}A)`;
                setAlert(`${n.label}: ${msg}`);
                addLog(n.label, 'TRIP', msg, 'TRIP');
                return { ...n, status: 'TRIPPED' as const };
             }
          }
        }
        return n;
      });
      if (tripped) setNodes(newNodes);

    }, 1000);
    return () => clearInterval(interval);
  }, [nodes, isRunning]);

  const handleScenario = (key: keyof typeof SCENARIOS) => {
    setNodes(SCENARIOS[key].setup(INITIAL_NODES));
    setAlert(null);
    setSelectedId(null);
    setIsPanelOpen(false);
    setLogs([]);
    addLog('System', 'SCENARIO LOAD', SCENARIOS[key].name, 'INFO');
  };

  const getLinkColor = (link: LinkData) => {
    const isEnergized = physics.energized.has(link.source) && physics.energized.has(link.target);
    if (!isEnergized) return '#94a3b8'; 
    
    const amps = physics.currents[link.target] || physics.currents[link.source] || 0;
    const load = amps / link.ratingAmps;

    if (load > 1.0) return '#ef4444'; 
    if (load > 0.8) return '#f59e0b'; 
    return '#3b82f6'; 
  };

  const selectedNode = nodes.find(n => n.id === selectedId);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans flex flex-col overflow-hidden">
      
      {/* 1. TOP NAVBAR */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-20">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-blue-600 p-2 rounded-lg text-white shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h1 className="font-bold text-base md:text-lg truncate">Protection Sim Pro</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider hidden md:block">Interactive Relay Training</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar ml-4">
             <div className="flex gap-2">
               {Object.entries(SCENARIOS).map(([key, data]) => (
                 <button
                   key={key}
                   onClick={() => handleScenario(key as any)}
                   className="whitespace-nowrap px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors"
                 >
                   {data.name.replace('Scenario: ', '')}
                 </button>
               ))}
             </div>
             <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>
             <div className="flex gap-2 shrink-0">
               <button 
                 onClick={() => setIsRunning(!isRunning)}
                 className={`p-2 rounded-full ${isRunning ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}
               >
                 {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
               </button>
               <button 
                 onClick={() => { setNodes(INITIAL_NODES); setLogs([]); }} 
                 className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
               >
                 <RotateCcw className="w-5 h-5" />
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 2. CANVAS AREA */}
        <div 
          className="flex-1 relative bg-slate-100 dark:bg-slate-950 cursor-move"
          onClick={() => { setSelectedId(null); setIsPanelOpen(false); }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <svg 
              viewBox="0 0 800 600" 
              className="w-full h-full max-w-[1000px] max-h-[800px] select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#94a3b8" fillOpacity="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* LINKS */}
              {INITIAL_LINKS.map(link => {
                const src = nodes.find(n => n.id === link.source)!;
                const tgt = nodes.find(n => n.id === link.target)!;
                const isEnergized = physics.energized.has(link.source) && physics.energized.has(link.target);
                const color = getLinkColor(link);

                return (
                  <g key={link.id}>
                    <line 
                      x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} 
                      stroke={color} 
                      strokeWidth="4" 
                      strokeLinecap="round"
                      opacity={isEnergized ? 1 : 0.3}
                    />
                    {isEnergized && (
                      <circle r="3" fill="white">
                        <animateMotion 
                          dur="2s" 
                          repeatCount="indefinite"
                          path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* NODES */}
              {nodes.map(node => {
                const isSelected = selectedId === node.id;
                const isEnergized = physics.energized.has(node.id);
                const color = node.type === 'GRID' ? '#3b82f6' : node.type === 'LOAD' ? '#a855f7' : '#64748b';

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(node.id);
                    }}
                    className="cursor-pointer hover:opacity-90"
                    style={{ touchAction: 'none' }}
                  >
                    <circle r="40" fill="transparent" />
                    {isSelected && (
                      <circle r="35" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 4" className="animate-spin-slow" />
                    )}
                    <circle r="26" fill={isEnergized ? 'white' : '#e2e8f0'} stroke={isEnergized ? color : '#94a3b8'} strokeWidth="3" />
                    {node.type === 'BREAKER' && (
                      <g transform="translate(0, -38)">
                        <rect x="-24" width="48" height="16" rx="4" fill={node.status === 'CLOSED' ? '#10b981' : node.status === 'TRIPPED' ? '#ef4444' : '#64748b'} />
                        <text x="0" y="11" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{node.status}</text>
                      </g>
                    )}
                    <g transform="translate(-12, -12)">
                      {node.type === 'GRID' && <Zap className="w-6 h-6 text-blue-600" />}
                      {node.type === 'BREAKER' && <Power className={`w-6 h-6 ${node.status === 'CLOSED' ? 'text-emerald-600' : 'text-slate-400'}`} />}
                      {node.type === 'LOAD' && <Activity className="w-6 h-6 text-purple-600" />}
                      {node.type === 'TRANSFORMER' && <Zap className="w-6 h-6 text-amber-500" />}
                      {node.type === 'BUS' && <CheckCircle2 className="w-6 h-6 text-slate-500" />}
                    </g>
                    {node.faulted && (
                       <circle r="30" fill="red" opacity="0.5" className="animate-ping pointer-events-none" />
                    )}
                    <text y="42" textAnchor="middle" className="text-[12px] font-bold fill-slate-600 uppercase tracking-tight bg-white/80" style={{ textShadow: '0 0 4px white' }}>
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          <AnimatePresence>
            {alert && (
              <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-4 left-4 right-4 md:left-auto md:right-auto md:w-auto md:min-w-[300px] z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center justify-between gap-3 font-bold text-sm"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {alert}
                </div>
                <button onClick={() => setAlert(null)}><X className="w-5 h-5 text-red-200" /></button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. INSTRUCTOR PANEL */}
        <div className="hidden md:flex w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col shadow-xl z-20">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Instructor Panel
            </h2>
            <p className="text-slate-500 text-sm mt-1">Engineering Data & Controls</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <InstructorContent selectedNode={selectedNode} physics={physics} setNodes={setNodes} logs={logs} />
          </div>
        </div>

        <AnimatePresence>
          {isPanelOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="md:hidden absolute inset-0 bg-black/40 z-30 backdrop-blur-sm"
                onClick={() => setIsPanelOpen(false)}
              />
              <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="md:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-40 max-h-[70vh] flex flex-col"
              >
                <div className="flex justify-center pt-3 pb-1" onClick={() => setIsPanelOpen(false)}>
                  <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>
                <div className="p-6 overflow-y-auto">
                   <InstructorContent selectedNode={selectedNode} physics={physics} setNodes={setNodes} logs={logs} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default DigitalSubstation;