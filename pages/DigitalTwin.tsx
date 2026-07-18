import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity, Zap, Power, AlertTriangle, RotateCcw, Play, Pause, 
  ShieldAlert, Settings, Share2, Download, Cpu, ZapOff, Check, 
  BookOpen, GitMerge, FileText, Info, BarChart2, Radio, Compass, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageSEO } from "../components/SEO/PageSEO";

const twinSchema: Record<string, any> = {
    "@type": "WebApplication",
    "name": "IEC 61850 Substation Digital Twin — GridMaster Pro",
    "description": "Real-time substation digital twin simulator. Visualize load flow, fault propagation, symmetrical components, and GOOSE logic.",
    "applicationCategory": "EngineeringApplication",
    "operatingSystem": "WebBrowser",
};

// ==============================
// UTILS & EXPORT
// ==============================
const downloadTextFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ==============================
// TOPOLOGY & DATA MODELS
// ==============================
const NODE_TYPES = {
  GRID: 'GRID', BUS: 'BUS', BREAKER: 'BREAKER', TRANSFORMER: 'TRANSFORMER', LOAD: 'LOAD', TIE: 'TIE'
};

interface Node {
  id: string;
  type: string;
  x: number;
  y: number;
  label: string;
  voltagekV: number;
  status?: string;
  ratingAmps?: number;
  ansi?: string[];
  settings?: {
    pickup51Mult: number;
    td51: number;
    pickup50Mult: number;
  };
  vector?: string;
  width?: number;
  loadMW?: number;
  faulted?: boolean;
  faultType?: string;
  stress?: number;
}

const DEFAULT_SETTINGS = { pickup51Mult: 1.05, td51: 0.5, pickup50Mult: 5.0 };

const INITIAL_NODES = [
  // --- SUBSTATION A (LEFT) ---
  { id: 'grid_a', type: NODE_TYPES.GRID, x: 250, y: 80, label: 'GETCO Line-1 (132kV)', voltagekV: 132 },
  { id: 'cb_m1', type: NODE_TYPES.BREAKER, x: 250, y: 160, label: 'Incomer 52-M1', voltagekV: 132, status: 'CLOSED', ratingAmps: 2000, ansi: ['50', '51', '50N'], settings: { ...DEFAULT_SETTINGS } },
  { id: 'tx1', type: NODE_TYPES.TRANSFORMER, x: 250, y: 240, label: 'TX-01 (50MVA)', voltagekV: 132, vector: 'Dyn11', ansi: ['87T'] },
  { id: 'bus_a', type: NODE_TYPES.BUS, x: 250, y: 320, label: '33kV Bus A', voltagekV: 33, width: 350 },
  
  // --- SUBSTATION B (RIGHT) ---
  { id: 'grid_b', type: NODE_TYPES.GRID, x: 750, y: 80, label: 'GETCO Line-2 (132kV)', voltagekV: 132 },
  { id: 'cb_m2', type: NODE_TYPES.BREAKER, x: 750, y: 160, label: 'Incomer 52-M2', voltagekV: 132, status: 'CLOSED', ratingAmps: 2000, ansi: ['50', '51', '50N'], settings: { ...DEFAULT_SETTINGS } },
  { id: 'tx2', type: NODE_TYPES.TRANSFORMER, x: 750, y: 240, label: 'TX-02 (50MVA)', voltagekV: 132, vector: 'Dyn11', ansi: ['87T'] },
  { id: 'bus_b', type: NODE_TYPES.BUS, x: 750, y: 320, label: '33kV Bus B', voltagekV: 33, width: 350 },

  // --- TIE BREAKERS ---
  { id: 'cb_tie', type: NODE_TYPES.TIE, x: 500, y: 320, label: 'Bus Tie 52-T', voltagekV: 33, status: 'OPEN', ratingAmps: 2500, ansi: ['50', '51'], settings: { ...DEFAULT_SETTINGS } },
  { id: 'cb_ring', type: NODE_TYPES.TIE, x: 500, y: 560, label: 'Ring Tie 52-R', voltagekV: 33, status: 'OPEN', ratingAmps: 1200, ansi: ['50', '51', '67'], settings: { ...DEFAULT_SETTINGS } },

  // --- FEEDERS FROM BUS A ---
  { id: 'cb_f1', type: NODE_TYPES.BREAKER, x: 150, y: 440, label: 'Feeder F1', voltagekV: 33, status: 'CLOSED', ratingAmps: 800, ansi: ['50', '51'], settings: { ...DEFAULT_SETTINGS } },
  { id: 'load1', type: NODE_TYPES.LOAD, x: 150, y: 560, label: 'Bharuch City', voltagekV: 33, loadMW: 10, ratingAmps: 600, faultType: 'LLL' },

  { id: 'cb_f2', type: NODE_TYPES.BREAKER, x: 350, y: 440, label: 'Feeder F2', voltagekV: 33, status: 'CLOSED', ratingAmps: 1200, ansi: ['50', '51'], settings: { ...DEFAULT_SETTINGS } },
  { id: 'load2', type: NODE_TYPES.LOAD, x: 350, y: 560, label: 'Ankleshwar GIDC', voltagekV: 33, loadMW: 22, ratingAmps: 1000, faultType: 'LLL' },

  // --- FEEDERS FROM BUS B ---
  { id: 'cb_f3', type: NODE_TYPES.BREAKER, x: 650, y: 440, label: 'Feeder F3', voltagekV: 33, status: 'CLOSED', ratingAmps: 1200, ansi: ['50', '51'], settings: { ...DEFAULT_SETTINGS } },
  { id: 'load3', type: NODE_TYPES.LOAD, x: 650, y: 560, label: 'Jhagadia Zone', voltagekV: 33, loadMW: 18, ratingAmps: 1000, faultType: 'LLL' },

  { id: 'cb_f4', type: NODE_TYPES.BREAKER, x: 850, y: 440, label: 'Feeder F4', voltagekV: 33, status: 'CLOSED', ratingAmps: 800, ansi: ['50', '51'], settings: { ...DEFAULT_SETTINGS } },
  { id: 'load4', type: NODE_TYPES.LOAD, x: 850, y: 560, label: 'Palej Industrial', voltagekV: 33, loadMW: 8, ratingAmps: 600, faultType: 'LLL' },
];

const INITIAL_LINKS = [
  { id: 'l1', source: 'grid_a', target: 'cb_m1', path: 'M 250 100 L 250 144' },
  { id: 'l2', source: 'cb_m1', target: 'tx1', path: 'M 250 176 L 250 220' },
  { id: 'l3', source: 'tx1', target: 'bus_a', path: 'M 250 260 L 250 316' },
  
  { id: 'l4', source: 'grid_b', target: 'cb_m2', path: 'M 750 100 L 750 144' },
  { id: 'l5', source: 'cb_m2', target: 'tx2', path: 'M 750 176 L 750 220' },
  { id: 'l6', source: 'tx2', target: 'bus_b', path: 'M 750 260 L 750 316' },

  { id: 'l_tie_a', source: 'bus_a', target: 'cb_tie', path: 'M 425 320 L 484 320' },
  { id: 'l_tie_b', source: 'cb_tie', target: 'bus_b', path: 'M 516 320 L 575 320' },

  { id: 'lf1', source: 'bus_a', target: 'cb_f1', path: 'M 150 324 L 150 424' },
  { id: 'lf1b', source: 'cb_f1', target: 'load1', path: 'M 150 456 L 150 540' },
  
  { id: 'lf2', source: 'bus_a', target: 'cb_f2', path: 'M 350 324 L 350 424' },
  { id: 'lf2b', source: 'cb_f2', target: 'load2', path: 'M 350 456 L 350 540' },

  { id: 'lf3', source: 'bus_b', target: 'cb_f3', path: 'M 650 324 L 650 424' },
  { id: 'lf3b', source: 'cb_f3', target: 'load3', path: 'M 650 456 L 650 540' },

  { id: 'lf4', source: 'bus_b', target: 'cb_f4', path: 'M 850 324 L 850 424' },
  { id: 'lf4b', source: 'cb_f4', target: 'load4', path: 'M 850 456 L 850 540' },

  { id: 'l_ring_a', source: 'load2', target: 'cb_ring', path: 'M 370 560 L 484 560' },
  { id: 'l_ring_b', source: 'cb_ring', target: 'load3', path: 'M 516 560 L 630 560' },
];

const SCENARIOS = {
  normal: { id: 'normal', name: "Standard Operation", load: [10, 22, 18, 8], fault: null },
  peak: { id: 'peak', name: "Peak Industrial Demand", load: [12, 45, 25, 10], fault: null },
  overload: { id: 'overload', name: "ANSI 51 Trip Simulation", load: [10, 85, 18, 8], fault: null }, 
  fault: { id: 'fault', name: "ANSI 50 Bolted Fault", load: [10, 22, 18, 8], fault: 'load2' }
};

// ==============================
// DET-PHYSICS & MESH LAWS
// ==============================
const calculateThermalTripTime = (current, pickup, td) => {
  const M = current / pickup;
  if (M <= 1.0) return 9999;
  return td * ((28.2 / (Math.pow(M, 2) - 1)) + 0.1217);
};

const calculateMeshPhysics = (nodes) => {
  const c = {}; 
  const e = new Set(); 
  const n = (id) => nodes.find(x => x.id === id);
  const isC = (id) => n(id)?.status === 'CLOSED';

  const getL = (id) => { 
    const node = n(id); 
    if (node.faulted) {
      if (node.faultType === 'LG') return 7000;  
      if (node.faultType === 'LL') return 10400; 
      return 12000; 
    }
    return (node.loadMW * 17.5); 
  };
  const L1 = getL('load1'), L2 = getL('load2'), L3 = getL('load3'), L4 = getL('load4');

  const srcA = isC('cb_m1'), srcB = isC('cb_m2'), tie = isC('cb_tie'), ring = isC('cb_ring');
  const f1 = isC('cb_f1'), f2 = isC('cb_f2'), f3 = isC('cb_f3'), f4 = isC('cb_f4');

  // Ring Main Sharing
  let iF2 = 0, iF3 = 0, iRing = 0; 
  if (ring) {
    if (f2 && f3) { iF2 = (L2 + L3) / 2; iF3 = (L2 + L3) / 2; iRing = iF2 - L2; } 
    else if (f2) { iF2 = L2 + L3; iF3 = 0; iRing = L3; } 
    else if (f3) { iF2 = 0; iF3 = L2 + L3; iRing = -L2; }
  } else { iF2 = f2 ? L2 : 0; iF3 = f3 ? L3 : 0; }

  const iF1 = f1 ? L1 : 0;
  const iF4 = f4 ? L4 : 0;

  const busAFault = n('bus_a').faulted ? 25000 : 0;
  const busBFault = n('bus_b').faulted ? 25000 : 0;
  const reqA = iF1 + iF2 + busAFault;
  const reqB = iF3 + iF4 + busBFault;

  let iT1 = 0, iT2 = 0, iTie = 0;
  if (tie) {
    if (srcA && srcB) { const total = reqA + reqB; iT1 = total / 2; iT2 = total / 2; iTie = iT1 - reqA; } 
    else if (srcA) { iT1 = reqA + reqB; iT2 = 0; iTie = reqB; } 
    else if (srcB) { iT1 = 0; iT2 = reqA + reqB; iTie = -reqA; }
  } else { iT1 = srcA ? reqA : 0; iT2 = srcB ? reqB : 0; }

  c['load1'] = iF1; c['load2'] = iF2 - iRing; c['load3'] = iF3 + iRing; c['load4'] = iF4;
  c['cb_f1'] = iF1; c['cb_f2'] = iF2; c['cb_f3'] = iF3; c['cb_f4'] = iF4;
  c['bus_a'] = iT1 - iTie; c['bus_b'] = iT2 + iTie;
  c['cb_tie'] = Math.abs(iTie); c['cb_ring'] = Math.abs(iRing);
  c['tx1'] = iT1; c['tx2'] = iT2;
  c['cb_m1'] = iT1 * (33/132); c['cb_m2'] = iT2 * (33/132); 
  c['grid_a'] = c['cb_m1']; c['grid_b'] = c['cb_m2'];

  if (srcA) { e.add('grid_a'); e.add('cb_m1'); e.add('tx1'); e.add('bus_a'); }
  if (srcB) { e.add('grid_b'); e.add('cb_m2'); e.add('tx2'); e.add('bus_b'); }
  if (tie && srcA) e.add('bus_b'); if (tie && srcB) e.add('bus_a');
  
  if (e.has('bus_a')) { if (f1) { e.add('cb_f1'); e.add('load1'); } if (f2) { e.add('cb_f2'); e.add('load2'); } }
  if (e.has('bus_b')) { if (f3) { e.add('cb_f3'); e.add('load3'); } if (f4) { e.add('cb_f4'); e.add('load4'); } }
  if (ring && e.has('load2')) { e.add('cb_ring'); e.add('load3'); }
  if (ring && e.has('load3')) { e.add('cb_ring'); e.add('load2'); }

  return { energized: e, currents: c, flows: { iTie, iRing } };
};

// ==============================
// COMPLEX CONVERT FOR PHASORS
// ==============================
interface ComplexVector { re: number; im: number; }
const polarToComplex = (mag: number, deg: number): ComplexVector => {
  const rad = (deg * Math.PI) / 180;
  return { re: mag * Math.cos(rad), im: mag * Math.sin(rad) };
};
const addComplex = (x: ComplexVector, y: ComplexVector): ComplexVector => ({ re: x.re + y.re, im: x.im + y.im });
const mulComplex = (x: ComplexVector, y: ComplexVector): ComplexVector => ({
  re: x.re * y.re - x.im * y.im,
  im: x.re * y.im + x.im * y.re
});
const getMag = (x: ComplexVector) => Math.sqrt(x.re * x.re + x.im * x.im);

const aComplex = polarToComplex(1, 120);
const a2Complex = polarToComplex(1, 240);

const calcPhasorComponents = (Ia: ComplexVector, Ib: ComplexVector, Ic: ComplexVector) => {
  const I0 = { re: (Ia.re + Ib.re + Ic.re) / 3, im: (Ia.im + Ib.im + Ic.im) / 3 };
  const a_Ib = mulComplex(aComplex, Ib);
  const a2_Ic = mulComplex(a2Complex, Ic);
  const I1 = { re: (Ia.re + a_Ib.re + a2_Ic.re) / 3, im: (Ia.im + a_Ib.im + a2_Ic.im) / 3 };
  const a2_Ib = mulComplex(a2Complex, Ib);
  const a_Ic = mulComplex(aComplex, Ic);
  const I2 = { re: (Ia.re + a2_Ib.re + a_Ic.re) / 3, im: (Ia.im + a2_Ib.im + a_Ic.im) / 3 };
  return { I0: getMag(I0), I1: getMag(I1), I2: getMag(I2) };
};

// ==============================
// SVG VISUAL SUB-COMPONENTS
// ==============================
const BreakerSymbol = ({ x, y, status, stress, isEnergized, horizontal = false }: any) => {
  const isOpen = status === 'OPEN' || status === 'TRIPPED';
  const color = isOpen ? (status === 'TRIPPED' ? '#ef4444' : '#64748b') : (isEnergized ? '#10b981' : '#64748b');
  
  return (
    <g transform={`translate(${x}, ${y}) ${horizontal ? 'rotate(90)' : ''}`}>
      {stress > 0 && status === 'CLOSED' && (
        <circle r={25} fill={`rgba(239, 68, 68, ${stress / 100})`} filter="blur(4px)" />
      )}
      <rect x={-14} y={-14} width={28} height={28} rx={4} fill="#030712" stroke={color} strokeWidth={2} />
      <motion.line x1={-6} y1={isOpen ? -8 : 0} x2={6} y2={isOpen ? -8 : 0} stroke={color} strokeWidth={2.5} strokeLinecap="round" animate={{ y1: isOpen ? -8 : 0, y2: isOpen ? -8 : 0 }} />
      <motion.line x1={-6} y1={isOpen ? 8 : 0} x2={6} y2={isOpen ? 8 : 0} stroke={color} strokeWidth={2.5} strokeLinecap="round" animate={{ y1: isOpen ? 8 : 0, y2: isOpen ? 8 : 0 }} />
      {status === 'TRIPPED' && <text x={20} y={4} fill="#ef4444" fontSize="9" fontWeight="black" transform={horizontal ? 'rotate(-90 20 4)' : ''}>TRIP</text>}
    </g>
  );
};

const TransformerSymbol = ({ x, y, isEnergized }: any) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle r={12} cy={-6} fill="#030712" stroke={isEnergized ? '#f59e0b' : '#64748b'} strokeWidth={2} />
    <circle r={12} cy={6} fill="none" stroke={isEnergized ? '#f59e0b' : '#64748b'} strokeWidth={2} />
  </g>
);

const ArcFlash = ({ x, y }: any) => (
  <g transform={`translate(${x}, ${y})`}>
    <motion.circle r={50} fill="url(#arc-flash)" animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.6, 1.1, 0.8] }} transition={{ repeat: Infinity, duration: 0.12 }} />
    <motion.path d="M-12,-20 L8,-4 L-8,4 L16,24" fill="none" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }} />
  </g>
);

// ==============================
// MAIN APP COMPONENT
// ==============================
export default function DigitalTwin() {
  const isDark = useThemeObserver();
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES as Node[]);
  const [physics, setPhysics] = useState<any>({ energized: new Set<string>(['grid_a', 'grid_b']), currents: {}, flows: {} });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [goosePackets, setGoosePackets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('sim'); 
  const [activeScenario, setActiveScenario] = useState('normal');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'soe' | 'goose' | 'interlocks'>('soe');
  const [activeControlTab, setActiveControlTab] = useState<'overview' | 'settings' | 'labs'>('overview');

  // GOOSE Animation Trigger
  const [gooseTrigger, setGooseTrigger] = useState(false);

  // Labs State
  const [currentLab, setCurrentLab] = useState<number | null>(null);
  const [labStatus, setLabStatus] = useState<('not_started' | 'passed' | 'failed')[]>([
    'not_started', 'not_started', 'not_started'
  ]);
  const [labMessage, setLabMessage] = useState<string | null>(null);

  const masterReset = () => {
    setNodes(INITIAL_NODES.map(n => ({ 
      ...n, 
      status: n.type === NODE_TYPES.BREAKER ? 'CLOSED' : n.status, 
      faulted: false, 
      stress: 0, 
      settings: n.settings ? {...DEFAULT_SETTINGS} : undefined,
      loadMW: n.loadMW
    })) as Node[]);
    setLogs([{ id: 'reset', time: new Date().toISOString().substring(11,23), device: 'SYS_ENG', event: 'RELOAD CONFIG', details: 'Digital Twin reset. All interlocks active.', type: 'INFO' }]);
    setGoosePackets([]);
    setActiveScenario('normal');
    setSelectedId(null);
    setCurrentLab(null);
    setLabMessage(null);
  };

  const addLog = (device: string, event: string, details: string, type: 'INFO' | 'TRIP' | 'WARN' = 'INFO') => {
    const time = new Date().toISOString().substring(11, 23);
    setLogs(prev => [{ id: Math.random().toString(), time, device, event, details, type }, ...prev].slice(0, 30));
  };

  const addGoosePacket = (src: string, dest: string, event: string, status: string) => {
    const time = new Date().toISOString().substring(11, 23);
    const packet = {
      id: Math.random().toString(),
      time,
      mac: `01:0c:cd:01:00:${Math.floor(Math.random() * 90 + 10)}`,
      goid: `GoID_${src.toUpperCase()}_LD0`,
      stNum: Math.floor(Math.random() * 5 + 1),
      sqNum: Math.floor(Math.random() * 20 + 1),
      src,
      dest,
      event,
      status
    };
    setGoosePackets(prev => [packet, ...prev].slice(0, 35));
    // Trigger flashing Ethernet animation
    setGooseTrigger(true);
    setTimeout(() => setGooseTrigger(false), 800);
  };

  // Dynamic Settings Update
  const updateNodeSetting = (nodeId: string, settingKey: string, value: any) => {
    setNodes(nodes.map(n => n.id === nodeId && n.settings ? { ...n, settings: { ...n.settings, [settingKey]: parseFloat(value) } } : n));
  };

  // Substation Loop (10Hz)
  useEffect(() => {
    if (!isRunning) return;
    let animationFrameId;
    let lastTime = performance.now();
    let accumulator = 0;

    const tick = (currentTime) => {
      accumulator += (currentTime - lastTime);
      lastTime = currentTime;

      if (accumulator >= 100) {
        accumulator -= 100;
        const nextPhysics = calculateMeshPhysics(nodes);
        setPhysics(nextPhysics);

        let stateChanged = false;
        const newNodes = nodes.map(n => {
          if (n.type === NODE_TYPES.BREAKER || n.type === NODE_TYPES.TIE) {
            if (n.status !== 'CLOSED') return n;
            
            const current = nextPhysics.currents[n.id] || 0;
            const limit = n.ratingAmps || 1000;
            
            // Dynamic Pickups
            const pickup50 = limit * (n.settings?.pickup50Mult || 5.0);
            const pickup51 = limit * (n.settings?.pickup51Mult || 1.05);
            const td51 = n.settings?.td51 || 0.5;

            // ANSI 50 Instantaneous
            if (current > pickup50) {
              addLog(n.label, 'TRIP (50)', `ANSI 50 Overcurrent Trip: ${current.toFixed(0)}A`, 'TRIP');
              addGoosePacket(n.id, 'BUS_SWITCH', 'ANSI 50 TRIP CMD', 'OPENED');
              stateChanged = true; 
              return { ...n, status: 'TRIPPED', stress: 0 };
            }

            // ANSI 51 Inverse Time Overcurrent
            let newStress = n.stress || 0;
            if (current > pickup51) {
              const tripTimeSec = calculateThermalTripTime(current, pickup51, td51);
              const accumulation = (100 / tripTimeSec) / 10;
              newStress += accumulation;

              if (newStress >= 100) {
                addLog(n.label, 'TRIP (51)', `ANSI 51 Thermal Trip (IEEE Extremely Inverse)`, 'TRIP');
                addGoosePacket(n.id, 'BUS_SWITCH', 'ANSI 51 TRIP CMD', 'OPENED');
                stateChanged = true; 
                return { ...n, status: 'TRIPPED', stress: 0 };
              }
              stateChanged = true;
            } else if (newStress > 0) {
              newStress = Math.max(0, newStress - 2.5); 
              stateChanged = true;
            }
            return { ...n, stress: newStress };
          }
          return n;
        });

        if (stateChanged) setNodes(newNodes);
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, isRunning]);

  const loadScenario = (key: string) => {
    const scen = SCENARIOS[key];
    setNodes(INITIAL_NODES.map(n => {
      let overrides: any = { status: n.type === NODE_TYPES.BREAKER ? 'CLOSED' : (n as any).status, faulted: false, stress: 0, faultType: (n as any).faultType || 'LLL' };
      if (n.id === 'load1') overrides.loadMW = scen.load[0];
      if (n.id === 'load2') overrides.loadMW = scen.load[1];
      if (n.id === 'load3') overrides.loadMW = scen.load[2];
      if (n.id === 'load4') overrides.loadMW = scen.load[3];
      if (n.id === scen.fault) overrides.faulted = true;
      return { ...n, ...overrides };
    }) as Node[]);
    setActiveScenario(key);
    addLog('SYS', 'SCENARIO', `Loaded preset scenario: ${scen.name}`);
    setSelectedId(null);
  };

  const selectedNode = nodes.find(n => n.id === selectedId);

  // Math components for specific selected node phasor displays
  const nodePhasorStats = useMemo(() => {
    if (!selectedNode) return null;
    const mag = physics.currents[selectedNode.id] || 0;
    
    // Balanced system phase offsets
    const phA = polarToComplex(mag, 0);
    const phB = polarToComplex(mag, -120);
    const phC = polarToComplex(mag, 120);

    // If unbalanced fault injected
    let fa = phA, fb = phB, fc = phC;
    if (selectedNode.faulted && selectedNode.type === NODE_TYPES.LOAD) {
      if (selectedNode.faultType === 'LG') {
        fa = polarToComplex(mag * 2.5, 0);
      } else if (selectedNode.faultType === 'LL') {
        fb = polarToComplex(mag * 2.0, -150);
        fc = polarToComplex(mag * 2.0, 30);
      } else {
        fa = polarToComplex(mag, 0);
        fb = polarToComplex(mag, -120);
        fc = polarToComplex(mag, 120);
      }
    }

    const comps = calcPhasorComponents(fa, fb, fc);
    return { fa, fb, fc, ...comps };
  }, [selectedNode, physics, nodes]);

  // Substation Graded Labs Definitions
  const labs = useMemo(() => [
    {
      id: 0,
      name: "Challenge 1: Ring Main Selectivity coordination",
      objective: "Isolate a fault on load 2 (Ankleshwar GIDC) while keeping Jhagadia powered.",
      description: "Ankleshwar GIDC (Load 2) is fed in a ring network. To enable ring feed, close Ring Tie breaker 'cb_ring' and inject a fault on Load 2. You must coordinate the protection settings such that Feeder F2 ('cb_f2') and Ring Tie ('cb_ring') trip first to isolate Ankleshwar, keeping Jhagadia Zone (Feeder F3) alive! Upstream incomers must NOT trip.",
      setup: () => {
        setNodes(INITIAL_NODES.map(n => {
          let overrides: any = { status: n.type === NODE_TYPES.BREAKER ? 'CLOSED' : n.status };
          if (n.id === 'cb_ring') overrides.status = 'CLOSED'; // Enable ring
          if (n.id === 'load2') overrides.faulted = true; // Injected fault
          return { ...n, ...overrides };
        }) as Node[]);
        reset();
      },
      check: () => {
        const isClosed = (id) => nodes.find(x => x.id === id)?.status === 'CLOSED';
        const isTripped = (id) => {
          const s = nodes.find(x => x.id === id)?.status;
          return s === 'OPEN' || s === 'TRIPPED';
        };
        // Ankleshwar isolated: cb_f2 and cb_ring tripped. Upstream incomers and load3 remain online.
        return isTripped('cb_f2') && isTripped('cb_ring') && isClosed('cb_m1') && isClosed('cb_m2') && isClosed('cb_f3');
      },
      hint: "Configure Feeder F2 and Ring Tie pickups and TD dial to lower values (e.g. TD=0.10) compared to your primary incomers (e.g. Incomer TD=0.8)."
    },
    {
      id: 1,
      name: "Challenge 2: Bus Transfer Logic (ATS)",
      objective: "Recover power on Bus A after incomer loss without overloading Transformer 2.",
      description: "Incomer 52-M1 ('cb_m1') trips due to line loss. Bus A goes dead, blacking out Bharuch and Ankleshwar. You must close the Bus Tie 'cb_tie' to restore power to Bus A. However, closing the tie places both buses under Transformer 2. If the total load exceeds Tx 2 rating (50MVA / 875A), Incomer 52-M2 will overload and trip! You must shed load (reduce Load 2 to <= 10MW) before closing cb_tie.",
      setup: () => {
        setNodes(INITIAL_NODES.map(n => {
          let overrides: any = { status: n.type === NODE_TYPES.BREAKER ? 'CLOSED' : n.status };
          if (n.id === 'cb_m1') overrides.status = 'OPEN'; // Lost incomer
          return { ...n, ...overrides };
        }) as Node[]);
        reset();
      },
      check: () => {
        const isClosed = (id) => nodes.find(x => x.id === id)?.status === 'CLOSED';
        const m2Current = physics.currents['cb_m2'] || 0;
        // Bus tie closed, incomer m2 remains closed and current stays below secondary rated limit (approx 875A)
        return isClosed('cb_tie') && isClosed('cb_m2') && m2Current < 875;
      },
      hint: "Select Load 2 on the diagram and slide the Demand Setpoint down to 10MW before closing Bus Tie 52-T."
    },
    {
      id: 2,
      name: "Challenge 3: Parallel Bus Coordination",
      objective: "Coordinate relays to handle parallel incomer grid synchronization.",
      description: "Both incomers cb_m1 and cb_m2 are CLOSED, and the Bus Tie cb_tie is CLOSED (parallel bus operation). This doubles the short-circuit rating on the bus. Trigger a LLL bolted fault on Bus B. The primary incomer cb_m2 and tie cb_tie must trip instantaneously (under 50ms) to protect the bus.",
      setup: () => {
        setNodes(INITIAL_NODES.map(n => {
          let overrides: any = { status: n.type === NODE_TYPES.BREAKER ? 'CLOSED' : n.status };
          if (n.id === 'cb_tie') overrides.status = 'CLOSED'; // Enable parallel
          if (n.id === 'bus_b') overrides.faulted = true; // Inject bus fault
          return { ...n, ...overrides };
        }) as Node[]);
        reset();
      },
      check: () => {
        const isTripped = (id) => nodes.find(x => x.id === id)?.status === 'TRIPPED';
        return isTripped('cb_m2') && isTripped('cb_tie');
      },
      hint: "Lower the ANSI 50 instantaneous pickup settings on cb_m2 and cb_tie to ensure fast coordinated tripping."
    }
  ], [nodes, physics]);

  const verifyLab = () => {
    if (currentLab === null) return;
    const success = labs[currentLab].check();
    setLabStatus(prev => {
      const next = [...prev];
      next[currentLab] = success ? 'passed' : 'failed';
      return next;
    });
    if (success) {
      setLabMessage("🎉 Success! Grid automation parameters are properly graded. Substation recovered.");
    } else {
      setLabMessage(`❌ Verification Failed. Hint: ${labs[currentLab].hint}`);
    }
  };

  const tabs = [
    { id: 'sim', label: 'GRID MONITOR', icon: <Activity className="w-4 h-4" /> },
    { id: 'theory', label: 'ACADEMY', icon: <BookOpen className="w-4 h-4" /> }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-cyan-500/30 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <PageSEO 
        title="Substation Digital Twin (IEC 61850 & GOOSE) | GridMaster Pro"
        description="Interact with a live digital twin of a 132/33kV substation. Simulate load flows, loop configurations, and fiber-optic communication packets."
        url="/twin"
        schema={twinSchema}
      />

      {/* HEADER */}
      <header className={`h-24 backdrop-blur-xl border-b px-6 lg:px-10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-5">
           <div className="bg-cyan-600 p-3 rounded-2xl text-white shadow-[0_0_25px_rgba(6,182,212,0.5)]"><Network className="w-8 h-8"/></div>
           <div>
             <h1 className="font-black text-2xl lg:text-3xl tracking-tighter uppercase leading-none text-adaptive">GRID<span className="text-cyan-500">MASTER</span> PRO</h1>
             <div className="text-[10px] font-black text-slate-550 uppercase tracking-[0.3em] mt-1">IEC 61850 | Substation Digital Twin</div>
           </div>
        </div>

        <nav className={`hidden md:flex p-1.5 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-250 shadow-inner'}`}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-350'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={masterReset} className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900 border border-red-900/40 text-red-400 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2">
            <RotateCcw className="w-4 h-4"/> System Reset
          </button>
        </div>
      </header>

      {/* MOBILE NAV */}
      <div className="md:hidden flex justify-around p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955/40">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${activeTab === t.id ? 'text-cyan-500 border-b-2 border-cyan-500' : 'text-slate-500'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <main className="w-full mx-auto p-4 lg:p-6 min-h-[calc(100vh-6rem)] max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            
            {activeTab === 'sim' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: SLD Map + SOE Terminal */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* SLD INTERACTIVE VIEW */}
                  <Card isDark={isDark} noPadding className="overflow-hidden flex flex-col h-[480px]">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                      <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-500" /> Substation mesh grid SLD
                      </h3>
                      <div className="flex items-center gap-4 text-[9px] font-mono">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Closed</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" /> Tripped</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-500 rounded-full" /> Open</span>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 relative bg-[#030712] cursor-crosshair overflow-hidden" onClick={() => setSelectedId(null)}>
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L40 0 L40 40 L0 40 Z' fill='none' stroke='%2322d3ee' stroke-width='1'/%3E%3C/svg%3E")` }}></div>

                      <svg className="w-full h-full" viewBox="100 50 850 550" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <filter id="thermal-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                          <radialGradient id="arc-flash"><stop offset="0%" stopColor="#ffffff" stopOpacity="1"/><stop offset="30%" stopColor="#38bdf8" stopOpacity="0.8"/><stop offset="100%" stopColor="#0284c7" stopOpacity="0"/></radialGradient>
                          
                          {/* Animated fiber optic dash pattern */}
                          <pattern id="fiber-active" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="10" cy="10" r="2" fill="#ec4899" className="animate-ping" />
                          </pattern>
                        </defs>

                        {/* IEC 61850 Process Bus Ethernet fiber Ring (Background Ring) */}
                        <path d="M 250,160 L 150,440 L 350,440 L 500,320 L 650,440 L 850,440 L 750,160 Z" fill="none" stroke={gooseTrigger ? "#ec4899" : "#64748b"} strokeWidth={gooseTrigger ? "3" : "1.5"} strokeDasharray={gooseTrigger ? "5,5" : "none"} strokeOpacity="0.35" className="transition-all duration-300" />
                        {gooseTrigger && (
                          <path d="M 250,160 L 150,440 L 350,440 L 500,320 L 650,440 L 850,440 L 750,160 Z" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="4 20" className="animate-pulse" style={{ animationDuration: '0.1s' }} />
                        )}

                        {/* Power Bus links */}
                        {INITIAL_LINKS.map(link => {
                          const isEnergized = physics.energized.has(link.source) && physics.energized.has(link.target);
                          let current = Math.max(physics.currents[link.target] || 0, physics.currents[link.source] || 0);
                          
                          let flowDirection = 1; 
                          if (link.id === 'l_tie_a' || link.id === 'l_tie_b') { current = Math.abs(physics.flows.iTie || 0); flowDirection = (physics.flows.iTie > 0) ? 1 : -1; }
                          if (link.id === 'l_ring_a' || link.id === 'l_ring_b') { current = Math.abs(physics.flows.iRing || 0); flowDirection = (physics.flows.iRing > 0) ? 1 : -1; }

                          const overload = current / ((link as any).ratingAmps || 1000);
                          let stroke = '#1e293b';
                          if (isEnergized) { stroke = overload > 1.2 ? '#ef4444' : overload > 0.9 ? '#f59e0b' : '#0ea5e9'; }

                          return (
                            <g key={link.id}>
                              <path d={link.path} fill="none" stroke={stroke} strokeWidth={isEnergized ? 4 : 2} style={{ filter: isEnergized && overload > 1 ? 'url(#thermal-glow)' : 'none', transition: 'stroke 0.3s' }} />
                              {isEnergized && current > 5 && (
                                <motion.path 
                                  d={link.path} fill="none" stroke="#ffffff" strokeWidth={2} strokeDasharray="4 24"
                                  animate={{ strokeDashoffset: flowDirection > 0 ? -28 : 28 }}
                                  transition={{ repeat: Infinity, ease: "linear", duration: Math.max(0.15, 1.5 - overload) }}
                                  style={{ filter: 'drop-shadow(0 0 4px #ffffff)', opacity: 0.9 }}
                                />
                              )}
                            </g>
                          );
                        })}

                        {/* Station Nodes */}
                        {nodes.map(node => {
                          const isE = physics.energized.has(node.id);
                          const isS = selectedId === node.id;
                          const cur = physics.currents[node.id] || 0;
                          
                          return (
                            <g key={node.id} onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }} className="cursor-pointer">
                              <AnimatePresence>
                                {isS && (
                                  <motion.circle r={28} cx={node.x} cy={node.y} fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 4" initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: 360 }} exit={{opacity: 0}} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: `${node.x}px ${node.y}px` }} />
                                )}
                              </AnimatePresence>

                              {node.faulted && <ArcFlash x={node.x} y={node.y} />}

                              {node.type === NODE_TYPES.BUS && (
                                <rect x={node.x - (node.width || 100)/2} y={node.y - 4} width={node.width} height={8} fill={node.faulted ? '#ef4444' : isE ? '#0ea5e9' : '#1e293b'} style={{ filter: isE && !node.faulted ? 'drop-shadow(0 0 6px rgba(14,165,233,0.5))' : 'none' }} />
                              )}
                              
                              {(node.type === NODE_TYPES.BREAKER || node.type === NODE_TYPES.TIE) && (
                                <BreakerSymbol x={node.x} y={node.y} status={node.status} stress={node.stress} isEnergized={isE} horizontal={node.type === NODE_TYPES.TIE} />
                              )}

                              {node.type === NODE_TYPES.TRANSFORMER && <TransformerSymbol x={node.x} y={node.y} isEnergized={isE} />}
                              
                              {node.type === NODE_TYPES.GRID && (
                                <g transform={`translate(${node.x}, ${node.y})`}>
                                  <circle r={18} fill="#0a0f1c" stroke="#38bdf8" strokeWidth={2} />
                                  <Activity className="w-5 h-5 text-[#38bdf8]" x={-10} y={-10} />
                                </g>
                              )}

                              {node.type === NODE_TYPES.LOAD && (
                                <g transform={`translate(${node.x}, ${node.y})`}>
                                  <polygon points="0,-15 15,10 -15,10" fill="#0a0f1c" stroke={isE ? '#8b5cf6' : '#475569'} strokeWidth={2} />
                                </g>
                              )}

                              {node.type !== NODE_TYPES.BUS && (
                                <text x={node.x} y={node.y + (node.type===NODE_TYPES.TIE && node.id==='cb_tie' ? -30 : 34)} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                  {node.label}
                                </text>
                              )}
                              {isE && cur > 5 && node.type !== NODE_TYPES.BUS && (
                                <text x={node.x} y={node.y + (node.type===NODE_TYPES.TIE && node.id==='cb_tie' ? -18 : 46)} textAnchor="middle" fill={cur > (node.ratingAmps||9999) ? '#ef4444' : '#38bdf8'} fontSize="11" fontFamily="monospace" fontWeight="bold">
                                  {cur.toFixed(0)} A
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </Card>

                  {/* BOTTOM TABS: IEC 61850 GOOSE MESSAGE STREAM & EVENTS LOG */}
                  <Card isDark={isDark} noPadding className="h-[200px] flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 flex-wrap gap-2">
                      
                      <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                        {[
                          { id: 'soe', label: 'Event Log (SOE)' },
                          { id: 'goose', label: 'IEC 61850 GOOSE Stream' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setActiveConsoleTab(t.id as any)}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                              activeConsoleTab === t.id
                                ? 'bg-cyan-600 text-white shadow-md font-bold'
                                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3 text-[9px] font-black uppercase text-slate-500">
                        <button onClick={() => {
                          const txt = logs.map(l => `[${l.time}] ${l.type} | ${l.device} | ${l.event} | ${l.details}`).join('\n');
                          downloadTextFile(txt, 'Substation_SOE_Log.txt');
                        }} className="hover:text-cyan-500 flex items-center gap-1.5"><Download className="w-3.5 h-3.5"/> Export</button>
                        <button onClick={() => { setLogs([]); setGoosePackets([]); }} className="hover:text-cyan-500">Clear</button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[9px] bg-[#020712] custom-scrollbar">
                      {activeConsoleTab === 'soe' ? (
                        <>
                          {logs.length === 0 && <span className="text-slate-650 italic pl-1 uppercase">Listening to station process bus... System Healthy.</span>}
                          {logs.map(log => (
                            <div key={log.id} className={`flex gap-3 leading-relaxed ${log.type === 'TRIP' ? 'text-red-400 border-l border-red-500 bg-red-950/15 px-2 py-0.5' : log.type === 'WARN' ? 'text-amber-400' : 'text-cyan-400'}`}>
                              <span className="text-slate-600">[{log.time}]</span>
                              <span className="w-28 font-bold truncate">{log.device}</span>
                              <span className="w-24 truncate text-slate-350">{log.event}</span>
                              <span className="flex-1 text-slate-300">{log.details}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          {goosePackets.length === 0 && <span className="text-slate-650 italic pl-1 uppercase">Waiting for dynamic multicast network frames...</span>}
                          {goosePackets.map(p => (
                            <div key={p.id} className="flex gap-2 text-pink-400 border-l border-pink-500 bg-pink-950/10 px-2 py-0.5 leading-relaxed">
                              <span className="text-slate-600">[{p.time}]</span>
                              <span className="text-slate-400 font-bold shrink-0">{p.mac}</span>
                              <span className="text-slate-300 shrink-0 font-bold">{p.goid}</span>
                              <span className="text-indigo-400 shrink-0">stNum:{p.stNum} sqNum:{p.sqNum}</span>
                              <span className="text-pink-300 font-bold truncate">{p.event}</span>
                              <span className="flex-1 text-slate-400 truncate">&rarr; dest:{p.dest} ({p.status})</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Right Column: Dynamic IED Dashboard & Station Controllers */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* DYNAMIC CONTROL CARD */}
                  <Card isDark={isDark} className="flex flex-col h-[700px] overflow-hidden">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 -mx-6 -mt-6 p-4">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-cyan-500 animate-spin-slow" /> Station Dashboard
                      </h3>
                      
                      <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                        {[
                          { id: 'overview', label: 'Grid' },
                          { id: 'settings', label: 'IEDs' },
                          { id: 'labs', label: 'Labs' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveControlTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                              activeControlTab === tab.id
                                ? 'bg-cyan-600 text-white shadow-md font-bold'
                                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto mt-4 space-y-6 custom-scrollbar pr-1">
                      
                      {/* TAB 1: Grid Overview */}
                      {activeControlTab === 'overview' && (
                        <div className="space-y-6">
                          
                          {/* Live Substation stats */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center">
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">MVA Active Capacity</span>
                              <span className="text-xl font-mono font-bold text-cyan-500">
                                {nodes.filter(n => n.type === 'LOAD').reduce((s, n) => s + (n.loadMW || 0), 0)} MW
                              </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center">
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Interlock state</span>
                              <span className="text-xl font-mono font-bold text-emerald-500">Active</span>
                            </div>
                          </div>

                          {/* Parallel Bus Overload Rating Check */}
                          {(() => {
                            const tieClosed = nodes.find(x => x.id === 'cb_tie')?.status === 'CLOSED';
                            const m1Closed = nodes.find(x => x.id === 'cb_m1')?.status === 'CLOSED';
                            const m2Closed = nodes.find(x => x.id === 'cb_m2')?.status === 'CLOSED';
                            if (tieClosed && m1Closed && m2Closed) {
                              return (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[9px] font-bold uppercase text-amber-500 leading-relaxed">
                                  ⚠️ Warning: Parallel Incomers Closed. Bus fault level increased to 40kA (Breaker Switchgear Limit: 31.5kA)!
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Scenario presets selection */}
                          <div className="space-y-3">
                            <span className="text-[9px] font-black text-slate-550 uppercase tracking-wider block">Grid Loading Scenarios</span>
                            <div className="space-y-2">
                              {Object.values(SCENARIOS).map(sc => (
                                <button
                                  key={sc.id}
                                  onClick={() => loadScenario(sc.id)}
                                  className={`w-full text-left p-3 border rounded-xl flex items-center justify-between transition-all ${
                                    activeScenario === sc.id
                                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
                                      : 'bg-white dark:bg-[#030712] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                  }`}
                                >
                                  <div>
                                    <div className="text-[9px] uppercase tracking-wider">{sc.name}</div>
                                    <div className="text-[8px] opacity-70 font-mono tracking-normal leading-normal mt-0.5">Preset {sc.id} configuration</div>
                                  </div>
                                  <Play className="w-3.5 h-3.5" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: Dynamic IED controllers */}
                      {activeControlTab === 'settings' && (
                        <div className="space-y-6">
                          {selectedNode ? (
                            <div className="space-y-5">
                              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                                <span className="text-[8px] font-mono text-slate-500 block mb-1">IED COMPONENT IDENTIFIER</span>
                                <h4 className="text-xs font-black uppercase text-adaptive">{selectedNode.label} ({selectedNode.voltagekV}kV)</h4>
                              </div>

                              {/* SV Current measurement */}
                              <div className="bg-[#030712] border border-slate-800 rounded-xl p-4 text-center space-y-1 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none"><Cpu size={60} /></div>
                                <span className="text-[8px] font-mono text-slate-500 block">SAMPLED VALUE (RMS CURRENT)</span>
                                <span className="text-4xl font-mono font-bold text-cyan-500 block">
                                  {physics.currents[selectedNode.id]?.toFixed(0) || 0} <span className="text-xs text-slate-500">AMPS</span>
                                </span>
                              </div>

                              {/* Interactive oscilloscope widget */}
                              {physics.currents[selectedNode.id] > 0 && nodePhasorStats && (
                                <div className="bg-[#040812] border border-slate-800 rounded-xl p-3 space-y-2">
                                  <span className="text-[8px] font-mono text-slate-500 block">LIVE IED OSCILLOSCOPE CHANNELS</span>
                                  <svg className="w-full h-24" viewBox="0 0 300 100">
                                    <line x1="0" y1="50" x2="300" y2="50" stroke="#0f2619" strokeWidth="1" />
                                    {(() => {
                                      const pathA: string[] = [];
                                      const pathB: string[] = [];
                                      const pathC: string[] = [];
                                      const mag = getMag(nodePhasorStats.fa);
                                      for (let x = 0; x <= 300; x += 3) {
                                        const angle = (x / 300) * Math.PI * 4; // 2 cycles
                                        const yA = 50 - (mag / 5000) * 35 * Math.sin(angle);
                                        const yB = 50 - (mag / 5000) * 35 * Math.sin(angle - (2*Math.PI/3));
                                        const yC = 50 - (mag / 5000) * 35 * Math.sin(angle + (2*Math.PI/3));
                                        pathA.push(`${x},${yA}`);
                                        pathB.push(`${x},${yB}`);
                                        pathC.push(`${x},${yC}`);
                                      }
                                      return (
                                        <g fill="none" strokeWidth="1.5">
                                          <path d={`M ${pathB.join(' L ')}`} stroke="#06b6d4" />
                                          <path d={`M ${pathC.join(' L ')}`} stroke="#ef4444" />
                                          <path d={`M ${pathA.join(' L ')}`} stroke="#eab308" />
                                        </g>
                                      );
                                    })()}
                                  </svg>
                                </div>
                              )}

                              {/* Slider controls for breaker relays */}
                              {(selectedNode.type === NODE_TYPES.BREAKER || selectedNode.type === NODE_TYPES.TIE) && (
                                <div className="space-y-4">
                                  <span className="text-[9px] font-black text-slate-550 uppercase tracking-wider block border-b border-slate-200 dark:border-slate-800 pb-1">ANSI Settings</span>
                                  <div className="space-y-3 bg-[#030712] border border-slate-800 p-3 rounded-xl">
                                    <Slider label="pickup multiplier (Ip)" min={1.0} max={1.8} step={0.05} value={selectedNode.settings?.pickup51Mult || 1.05} onChange={e => updateNodeSetting(selectedNode.id, 'pickup51Mult', e.target.value)} color="blue" />
                                    <Slider label="Time Dial Dial (TD)" min={0.05} max={1.5} step={0.05} value={selectedNode.settings?.td51 || 0.5} onChange={e => updateNodeSetting(selectedNode.id, 'td51', e.target.value)} color="blue" />
                                    <Slider label="Instantaneous Pickup (50)" min={2.0} max={10.0} step={0.5} value={selectedNode.settings?.pickup50Mult || 5.0} onChange={e => updateNodeSetting(selectedNode.id, 'pickup50Mult', e.target.value)} color="red" />
                                  </div>

                                  <span className="text-[9px] font-black text-slate-550 uppercase tracking-wider block border-b border-slate-200 dark:border-slate-800 pb-1 pt-2">Manual Control overrides</span>
                                  <div className="flex gap-2">
                                    <button onClick={() => {
                                      setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, status: 'CLOSED', faulted: false, stress: 0 } : n) as Node[]);
                                      addLog(selectedNode.label, 'CMD EXEC', 'Breaker contacts CLOSED', 'INFO');
                                      addGoosePacket(selectedNode.id, 'PROCESS_BUS', 'CMD CLOSE', 'CLOSED');
                                    }} disabled={selectedNode.status === 'CLOSED'} className="flex-1 py-2.5 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/50 disabled:opacity-20 text-emerald-400 font-bold text-[10px] rounded-xl transition-all">52-CLOSE</button>
                                    <button onClick={() => {
                                      setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, status: 'OPEN' } : n) as Node[]);
                                      addLog(selectedNode.label, 'CMD EXEC', 'Breaker contacts OPENED', 'WARN');
                                      addGoosePacket(selectedNode.id, 'PROCESS_BUS', 'CMD OPEN', 'OPENED');
                                    }} disabled={selectedNode.status === 'OPEN' || selectedNode.status === 'TRIPPED'} className="flex-1 py-2.5 bg-red-950/40 hover:bg-red-900 border border-red-900/50 disabled:opacity-20 text-red-400 font-bold text-[10px] rounded-xl transition-all">52-TRIP</button>
                                  </div>
                                </div>
                              )}

                              {/* Load setpoint sliders & Fault Injector */}
                              {selectedNode.type === NODE_TYPES.LOAD && (
                                <div className="space-y-4">
                                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                                    <Slider label="Feeder Demand Level (MW)" min={0} max={100} step={1} value={selectedNode.loadMW || 0} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, loadMW: parseInt(e.target.value) } : n) as Node[])} color="blue" />
                                  </div>

                                  <div className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
                                    <span className="text-[9px] font-black text-slate-550 uppercase tracking-wider block border-b border-slate-200 dark:border-slate-800 pb-1">Feeder Fault Simulation</span>
                                    <select value={selectedNode.faultType || 'LLL'} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, faultType: e.target.value } : n) as Node[])} className="w-full bg-[#0a0f1c] border border-slate-700 text-cyan-400 rounded-lg p-2 text-xs font-bold outline-none focus:border-cyan-500">
                                      <option value="LLL">3-Phase Bolted (LLL)</option>
                                      <option value="LL">Line-to-Line (LL)</option>
                                      <option value="LG">Line-to-Ground (LG)</option>
                                    </select>
                                    <button onClick={() => {
                                      const isFault = !selectedNode.faulted;
                                      setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, faulted: isFault } : n) as Node[]);
                                      addLog(selectedNode.label, isFault ? 'FAULT INJ' : 'FAULT CLR', isFault ? `${selectedNode.faultType} Fault Active!` : 'Fault cleared.', isFault ? 'WARN' : 'INFO');
                                      addGoosePacket(selectedNode.id, 'BUS_COUPLER', isFault ? 'FAULT INITIATED' : 'FAULT RESET', isFault ? 'ACTIVE' : 'NORMAL');
                                    }} className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${selectedNode.faulted ? 'bg-amber-950/40 border-amber-900/50 text-amber-500 hover:bg-amber-900' : 'bg-red-950/20 border-red-900/30 text-red-400 hover:border-red-900/80'}`}>
                                      <AlertTriangle className="w-3.5 h-3.5" /> {selectedNode.faulted ? 'Clear Fault' : 'Inject Fault'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-500 uppercase italic tracking-widest text-center py-20">
                              No Node Selected.<br/>Click any component on the SLD layout.
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 3: Labs & challenges */}
                      {activeControlTab === 'labs' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-2">
                            {labs.map((l, idx) => (
                              <button key={l.id} onClick={() => startLab(idx)}
                                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                                  currentLab === idx 
                                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-700 dark:text-cyan-400 font-bold' 
                                    : 'bg-white dark:bg-[#030712] border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-350'
                                }`}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">IED Lab {idx + 1}</span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${labStatus[idx] === 'passed' ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400' : labStatus[idx] === 'failed' ? 'bg-red-500/25 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400'}`}>
                                    {labStatus[idx] === 'passed' ? 'Passed' : labStatus[idx] === 'failed' ? 'Failed' : 'Not Started'}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold leading-tight mb-1">{l.name}</h4>
                                <p className="text-[9px] text-slate-550 dark:text-slate-450 uppercase tracking-wider">{l.objective}</p>
                              </button>
                            ))}
                          </div>

                          {currentLab !== null && (
                            <Card isDark={isDark} className="bg-slate-100 dark:bg-[#030712] border border-slate-200 dark:border-slate-850 p-4 space-y-4">
                              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                                <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Grading Workspace</h4>
                                <button onClick={verifyLab} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all">
                                  <Check className="w-3.5 h-3.5" /> Verify Setup
                                </button>
                              </div>

                              <p className="text-[10px] text-slate-650 dark:text-slate-350 leading-relaxed uppercase tracking-wider">{labs[currentLab].description}</p>
                              
                              {labMessage && (
                                <div className={`p-3 rounded-lg border text-[9px] font-bold leading-relaxed uppercase tracking-wider ${labMessage.startsWith('🎉') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}>
                                  {labMessage}
                                </div>
                              )}
                            </Card>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <TheoryHub />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        input[type=range] { -webkit-appearance: none; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #0ea5e9; cursor: pointer; }
      `}} />
    </div>
  );
}

// ==============================
// ACADEMY & THEORY GUIDE
// ==============================
const TheoryHub = () => (
  <div className="max-w-4xl mx-auto space-y-6 pb-20">
    <Card isDark={true} className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white">Substation Automation & Protection Academy</h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">IEC 61850 Design and System Gridding</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed uppercase tracking-wider text-slate-350">
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400 text-sm">1. IEC 61850 Architecture</h4>
            <p>
              Modern digital substations replace copper cables with high-speed fiber Ethernet. It defines two main buses:
            </p>
            <p className="text-[10px] text-slate-450 mt-1 pl-4 border-l border-slate-700">
              • <strong>Station Bus</strong>: Carries GOOSE and MMS messages for protection interlock signals between IEDs.<br/>
              • <strong>Process Bus</strong>: Transmits Sampled Values (SV) of currents and voltages from Merging Units to protective relays.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400 text-sm">2. GOOSE Multicast Messaging</h4>
            <p>
              Generic Object Oriented Substation Events (GOOSE) are high-priority Ethernet frames bypassed directly to Layer 2 MAC addresses to achieve trip delays under 4ms. They are repeatedly retransmitted in an exponential heartbeat decay to ensure absolute packet delivery during intense electromagnetic noise.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400 text-sm">3. Ring Main Loop coordination</h4>
            <p>
              Closed loop systems protect load supplies against loss of a single cable feeder. By routing current in both directions, direction-selective relays (ANSI 67) must coordinate their pickup angles so only the breakers directly bounding a faulty line segments trip, isolating the fault without dropping downstream loads.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400 text-sm">4. Parallel Bus Operations</h4>
            <p>
              Closing a Bus Tie breaker while both primary incomers are active runs the transformer in parallel. This halves the source impedance, thereby doubling the short circuit current during a fault. It requires careful overcurrent setpoint adjustment to prevent exceeding the breaker breaking rating.
            </p>
          </div>
        </div>
      </div>
    </Card>
  </div>
);