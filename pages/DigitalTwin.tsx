import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Zap, Power, AlertTriangle, RotateCcw, Play, Pause, 
  ShieldAlert, Settings, Share2, Download, Cpu, ZapOff, Check, 
  BookOpen, GitMerge, FileText, Info, BarChart2, Radio, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { PageSEO } from "../components/SEO/PageSEO";

const twinSchema: Record<string, any> = {
    "@type": "WebApplication",
    "name": "Digital Twin — GridMaster Pro",
    "description": "Real-time substation digital twin simulator. Visualize load flow, fault propagation, and IED logic across a 132/33kV mesh network.",
    "applicationCategory": "EngineeringApplication",
    "operatingSystem": "WebBrowser",
};

// ==============================
// UTILS & EXPORT
// ==============================

const downloadTextFile = (content, filename) => {
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
  fault: { id: 'fault', name: "ANSI 50 Bolted Fault", load: [10, 22, 18, 8], fault: 'bus_b' }
};

// ==============================
// ADVANCED DETERMINISTIC PHYSICS
// ==============================

const calculateThermalTripTime = (current, pickup, td) => {
  const M = current / pickup;
  if (M <= 1.0) return 9999;
  // IEEE Extremely Inverse: t = TD * ( (28.2 / (M^2 - 1)) + 0.1217 )
  return td * ((28.2 / (Math.pow(M, 2) - 1)) + 0.1217);
};

const calculateMeshPhysics = (nodes) => {
  const c = {}; // Currents
  const e = new Set(); // Energized nodes
  const n = (id) => nodes.find(x => x.id === id);
  const isC = (id) => n(id)?.status === 'CLOSED';

  // Base Loads (1 MW ≈ 17.5 Amps at 33kV, PF=0.9)
  const getL = (id) => { 
    const node = n(id); 
    if (node.faulted) {
      // Different fault types draw different short-circuit currents
      if (node.faultType === 'LG') return 7000;  // Line-to-Ground
      if (node.faultType === 'LL') return 10400; // Line-to-Line (~0.866 of LLL)
      return 12000; // LLL Bolted
    }
    return (node.loadMW * 17.5); 
  };
  const L1 = getL('load1'), L2 = getL('load2'), L3 = getL('load3'), L4 = getL('load4');

  // Topology State
  const srcA = isC('cb_m1'), srcB = isC('cb_m2'), tie = isC('cb_tie'), ring = isC('cb_ring');
  const f1 = isC('cb_f1'), f2 = isC('cb_f2'), f3 = isC('cb_f3'), f4 = isC('cb_f4');

  // Ring Main Load Sharing
  let iF2 = 0, iF3 = 0, iRing = 0; 
  if (ring) {
    if (f2 && f3) { iF2 = (L2 + L3) / 2; iF3 = (L2 + L3) / 2; iRing = iF2 - L2; } 
    else if (f2) { iF2 = L2 + L3; iF3 = 0; iRing = L3; } 
    else if (f3) { iF2 = 0; iF3 = L2 + L3; iRing = -L2; }
  } else { iF2 = f2 ? L2 : 0; iF3 = f3 ? L3 : 0; }

  const iF1 = f1 ? L1 : 0;
  const iF4 = f4 ? L4 : 0;

  // Bus Aggregation
  const busAFault = n('bus_a').faulted ? 25000 : 0;
  const busBFault = n('bus_b').faulted ? 25000 : 0;
  const reqA = iF1 + iF2 + busAFault;
  const reqB = iF3 + iF4 + busBFault;

  // Main Tie Sharing
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
  c['cb_m1'] = iT1 * (33/132); c['cb_m2'] = iT2 * (33/132); // 132kV primary mapping
  c['grid_a'] = c['cb_m1']; c['grid_b'] = c['cb_m2'];

  // Energization Tracing
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
// SVG VISUAL COMPONENTS
// ==============================

const BreakerSymbol = ({ x, y, status, stress, isEnergized, horizontal = false }) => {
  const isOpen = status === 'OPEN' || status === 'TRIPPED';
  const color = isOpen ? (status === 'TRIPPED' ? '#ef4444' : '#64748b') : (isEnergized ? '#10b981' : '#64748b');
  
  return (
    <g transform={`translate(${x}, ${y}) ${horizontal ? 'rotate(90)' : ''}`}>
      {/* Thermal Glow Aura */}
      {stress > 0 && status === 'CLOSED' && (
        <circle r={28} fill={`rgba(239, 68, 68, ${stress / 100})`} filter="blur(6px)" />
      )}
      <rect x={-16} y={-16} width={32} height={32} rx={4} fill="#030712" stroke={color} strokeWidth={2} />
      
      {/* Mechanical Contact Animation */}
      <motion.line x1={-8} y1={isOpen ? -10 : 0} x2={8} y2={isOpen ? -10 : 0} stroke={color} strokeWidth={3} strokeLinecap="round" animate={{ y1: isOpen ? -10 : 0, y2: isOpen ? -10 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 25 }} />
      <motion.line x1={-8} y1={isOpen ? 10 : 0} x2={8} y2={isOpen ? 10 : 0} stroke={color} strokeWidth={3} strokeLinecap="round" animate={{ y1: isOpen ? 10 : 0, y2: isOpen ? 10 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 25 }} />
      
      {status === 'TRIPPED' && <text x={22} y={4} fill="#ef4444" fontSize="10" fontWeight="bold" transform={horizontal ? 'rotate(-90 22 4)' : ''}>TRIP</text>}
    </g>
  );
};

const TransformerSymbol = ({ x, y, isEnergized }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle r={14} cy={-8} fill="#030712" stroke={isEnergized ? '#f59e0b' : '#64748b'} strokeWidth={2} />
    <circle r={14} cy={8} fill="none" stroke={isEnergized ? '#f59e0b' : '#64748b'} strokeWidth={2} />
  </g>
);

const ArcFlash = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <motion.circle r={60} fill="url(#arc-flash)" animate={{ opacity: [0.2, 1, 0.2], scale: [0.5, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 0.15 }} />
    <motion.path d="M-15,-25 L10,-5 L-10,5 L20,30" fill="none" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.1 }} />
    <motion.path d="M15,-15 L-5,-5 L10,5 L-20,20" fill="none" stroke="#fcd34d" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px #f59e0b)' }} animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.12 }} />
  </g>
);

// ==============================
// ACADEMY & THEORY HUB (MATH)
// ==============================

const TheoryHub = () => (
  <div className="w-full h-full overflow-y-auto bg-[#030712] p-8 space-y-8 custom-scrollbar">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-black text-white uppercase tracking-widest border-b border-slate-800 pb-4 mb-8">
        <BookOpen className="inline mr-3 w-8 h-8 text-cyan-500"/> Substation Protection Academy
      </h2>

      {/* VISUAL: DIRECTIONAL PROTECTION (ANSI 67) */}
      <div className="bg-[#0a0f1c] border border-slate-800 p-8 rounded-2xl mb-8 flex flex-col lg:flex-row-reverse gap-8 items-center shadow-xl">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2"><Compass className="w-5 h-5"/> ANSI 67 (Directional Overcurrent)</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            In ring networks (like the 52-Ring tie between Ankleshwar and Jhagadia), current can flow in either direction. ANSI 67 relays compare the phase angle between Current (I) and Voltage (V) to determine fault direction.
          </p>
          <div className="bg-[#040812] p-4 rounded-lg border border-slate-800 font-mono text-xs text-amber-400 overflow-x-auto">
            <div className="text-slate-500 mb-2">// Directional Operating Torque Calculation</div>
            <div><span className="text-emerald-400">Torque</span> = |V| &times; |I| &times; cos(&theta; - &tau;)</div>
            <div className="text-slate-400 mt-2">&theta; = Angle of Current relative to Voltage</div>
            <div className="text-slate-400">&tau; = Relay Characteristic Angle (RCA), typically 45&deg; or 60&deg;</div>
            <div className="text-purple-400 mt-2 font-bold">TRIP IF: Torque &gt; 0 AND <InlineMath math="|I| > I_{pickup}" /></div>
          </div>
        </div>
        <div className="w-full lg:w-96 bg-[#040812] border border-slate-800 rounded-xl p-4 flex justify-center items-center">
          <svg viewBox="0 0 200 200" className="w-full h-auto max-w-[250px]">
            {/* Axes */}
            <line x1="100" y1="20" x2="100" y2="180" stroke="#475569" strokeWidth="1" />
            <line x1="20" y1="100" x2="180" y2="100" stroke="#475569" strokeWidth="1" />
            <text x="100" y="15" fill="#94a3b8" fontSize="10" textAnchor="middle">+jX</text>
            <text x="185" y="103" fill="#94a3b8" fontSize="10">+R (V_ref)</text>

            {/* Operating Region */}
            <path d="M 100 100 L 170 30 A 100 100 0 0 1 30 170 Z" fill="rgba(168, 85, 246, 0.2)" />
            <line x1="30" y1="170" x2="170" y2="30" stroke="#a855f6" strokeWidth="2" strokeDasharray="4 4" />
            <text x="140" y="50" fill="#a855f6" fontSize="10" fontWeight="bold">TRIP REGION</text>

            {/* Restraint Region */}
            <text x="50" y="150" fill="#64748b" fontSize="10" fontWeight="bold">BLOCK REGION</text>

            {/* Vectors */}
            <line x1="100" y1="100" x2="150" y2="100" stroke="#38bdf8" strokeWidth="2" />
            <polygon points="150,100 145,97 145,103" fill="#38bdf8" />
            <text x="130" y="95" fill="#38bdf8" fontSize="10" fontWeight="bold">V_pol</text>

            <line x1="100" y1="100" x2="135" y2="65" stroke="#ef4444" strokeWidth="2" />
            <polygon points="135,65 130,68 132,73" fill="#ef4444" />
            <text x="140" y="65" fill="#ef4444" fontSize="10" fontWeight="bold">I_fault</text>
          </svg>
        </div>
      </div>

      {/* CALCULATION 1: ANSI 51 */}
      <div className="bg-[#0a0f1c] border border-slate-800 p-8 rounded-2xl mb-8 shadow-xl">
        <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2"><Activity className="w-5 h-5"/> Mathematical Example 1: ANSI 51 (Inverse Time Overcurrent)</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          The simulation uses the exact IEEE C37.112 Extremely Inverse formula. Let's calculate the trip time for a feeder during an overload.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#030712] p-6 rounded-lg border border-slate-800 font-mono text-sm space-y-4">
            <div className="text-slate-500 font-bold border-b border-slate-800 pb-2">Given Parameters:</div>
            <div>• <span className="text-pink-400"><InlineMath math="I_{pickup}" /></span> (Relay Setting) = 1,260 A <span className="text-slate-500 text-xs">(1.05 × 1200A Rating)</span></div>
            <div>• <span className="text-purple-400"><InlineMath math="I_{fault}" /></span> (Measured Load) = 2,500 A</div>
            <div>• <span className="text-cyan-400">TD</span> (Time Dial) = 0.5</div>
            
            <div className="text-slate-500 font-bold border-b border-slate-800 pb-2 mt-6">Step 1: Calculate Multiple (M)</div>
            <div className="overflow-x-auto my-2 text-center text-lg"><BlockMath math="M = \frac{I_{fault}}{I_{pickup}} = \frac{2500}{1260} = 1.984" /></div>
          </div>

          <div className="bg-[#030712] p-6 rounded-lg border border-slate-800 font-mono text-sm space-y-4 overflow-x-auto custom-scrollbar">
            <div className="text-slate-500 font-bold border-b border-slate-800 pb-2">Step 2: IEEE Extremely Inverse Formula</div>
            <div className="text-emerald-400"><BlockMath math="t = TD \times \left[ \frac{28.2}{M^{2.0} - 1} + 0.1217 \right]" /></div>
            
            <div className="text-slate-500 font-bold border-b border-slate-800 pb-2 mt-6">Step 3: Solve for Trip Time (t)</div>
            <div className="space-y-2 overflow-x-auto">
              <BlockMath math="t = 0.5 \times \left[ \frac{28.2}{1.984^2 - 1} + 0.1217 \right]" />
              <BlockMath math="t = 0.5 \times \left[ \frac{28.2}{3.936 - 1} + 0.1217 \right]" />
              <BlockMath math="t = 0.5 \times \left[ \frac{28.2}{2.936} + 0.1217 \right]" />
              <BlockMath math="t = 0.5 \times [ 9.605 + 0.1217 ]" />
            </div>
            <div className="text-lg text-emerald-400 font-bold bg-emerald-950/30 p-2 rounded inline-block mt-2">t = 4.86 seconds</div>
          </div>
        </div>
      </div>

      {/* CALCULATION 2: ANSI 87T */}
      <div className="bg-[#0a0f1c] border border-slate-800 p-8 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-2"><GitMerge className="w-5 h-5"/> Mathematical Example 2: ANSI 87T (Transformer Differential)</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Differential protection compares current entering and leaving. It uses a "Slope" to prevent false tripping from CT inaccuracies during heavy through-faults.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#030712] p-6 rounded-lg border border-slate-800 font-mono text-sm space-y-4">
            <div className="text-slate-500 font-bold border-b border-slate-800 pb-2">Transformer & CT Specs:</div>
            <div>• Capacity = 50 MVA, 132kV / 33kV</div>
            <div>• Primary CT Ratio = <span className="text-pink-400">300 : 5</span></div>
            <div>• Secondary CT Ratio = <span className="text-purple-400">1000 : 5</span></div>
            <div>• Slope Setting = <span className="text-amber-400">20% (0.2)</span></div>

            <div className="text-slate-500 font-bold border-b border-slate-800 pb-2 mt-6">Step 1: Calculate Rated Line Currents</div>
            <div className="overflow-x-auto"><InlineMath math="I_{L\_pri} = \frac{50,000}{\sqrt{3} \times 132} =" /> <strong className="text-white">218.7 A</strong></div>
            <div className="overflow-x-auto"><InlineMath math="I_{L\_sec} = \frac{50,000}{\sqrt{3} \times 33} =" /> <strong className="text-white">874.8 A</strong></div>
          </div>

          <div className="bg-[#030712] p-6 rounded-lg border border-slate-800 font-mono text-sm space-y-4">
            <div className="text-slate-500 font-bold border-b border-slate-800 pb-2">Step 2: Calculate CT Secondary Currents</div>
            <div className="overflow-x-auto"><InlineMath math="I_{pri\_sec} = 218.7 \times \left(\frac{5}{300}\right) =" /> <span className="text-pink-400">3.645 A</span></div>
            <div className="overflow-x-auto"><InlineMath math="I_{sec\_sec} = 874.8 \times \left(\frac{5}{1000}\right) =" /> <span className="text-purple-400">4.374 A</span></div>

            <div className="text-slate-500 font-bold border-b border-slate-800 pb-2 mt-6">Step 3: Restraint vs Operating</div>
            <div className="overflow-x-auto"><InlineMath math="I_{OP}" /> (Mismatch) = <InlineMath math="|3.645 - 4.374| =" /> <strong className="text-red-400">0.729 A</strong></div>
            <div className="overflow-x-auto"><InlineMath math="I_{RES}" /> (Average) = <InlineMath math="\frac{3.645 + 4.374}{2} =" /> <strong className="text-cyan-400">4.010 A</strong></div>
            
            <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded">
              <div className="text-xs text-slate-500 mb-1">Check Trip Condition: <InlineMath math="I_{OP} > \text{Slope} \times I_{RES}" /></div>
              <div>0.729 &gt; 0.2 &times; 4.010</div>
              <div>0.729 &gt; 0.802 &rarr; <span className="text-emerald-400 font-bold text-lg">FALSE (No Trip)</span></div>
              <div className="text-xs text-slate-400 mt-1">The relay successfully restrains under normal load despite CT mismatch.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ==============================
// GLOBAL OVERVIEW COMPONENT
// ==============================

interface Scenario {
  id: string;
  name: string;
  load: number[];
  fault: string | null;
}

const GlobalOverviewPanel = ({ nodes, scenarios, loadScenario, activeScenario }: { nodes: any[], scenarios: Record<string, Scenario>, loadScenario: (id: string) => void, activeScenario: string }) => {
  const totalLoad = nodes.filter(n => n.type === 'LOAD').reduce((s, n) => s + (n.loadMW || 0), 0);
  const activeFaults = nodes.filter(n => n.faulted).length;
  const trippedBreakers = nodes.filter(n => n.status === 'TRIPPED').length;

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[#0a0f1c]">
      <div className="text-center pb-4 border-b border-slate-800">
        <Activity className="w-12 h-12 text-cyan-500 mx-auto mb-3 opacity-50" />
        <h2 className="text-lg font-black text-white tracking-widest uppercase">Grid Overview</h2>
        <p className="text-[10px] text-slate-500 font-mono">SELECT A NODE ON THE SLD FOR IED CONTROLS</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#030712] border border-slate-800 p-4 rounded-lg text-center">
          <div className="text-[10px] font-bold text-slate-500 mb-1">TOTAL DEMAND</div>
          <div className="text-2xl font-mono font-bold text-cyan-400">{totalLoad} <span className="text-sm">MW</span></div>
        </div>
        <div className="bg-[#030712] border border-slate-800 p-4 rounded-lg text-center">
          <div className="text-[10px] font-bold text-slate-500 mb-1">GRID FREQ</div>
          <div className="text-2xl font-mono font-bold text-emerald-400">50.0 <span className="text-sm">Hz</span></div>
        </div>
        <div className={`col-span-2 border p-4 rounded-lg text-center transition-colors ${activeFaults > 0 || trippedBreakers > 0 ? 'bg-red-950/30 border-red-900/50' : 'bg-emerald-950/30 border-emerald-900/50'}`}>
          <div className="text-[10px] font-bold text-slate-500 mb-1">SYSTEM ALARMS</div>
          <div className={`text-xl font-mono font-bold ${activeFaults > 0 || trippedBreakers > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {activeFaults} FAULTS | {trippedBreakers} TRIPS
          </div>
        </div>
      </div>

      {/* Scenario Dispatcher */}
      <div>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3">Load Scenarios</h3>
        <div className="space-y-2">
          {Object.values(scenarios).map(sc => (
            <button 
              key={sc.id} 
              onClick={() => loadScenario(sc.id)} 
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between group ${activeScenario === sc.id ? 'bg-cyan-950/40 border-cyan-800/50' : 'bg-[#030712] border-slate-800 hover:border-cyan-900/50'}`}
            >
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${activeScenario === sc.id ? 'text-cyan-400' : 'text-slate-300'}`}>{sc.name}</div>
                <div className="text-[10px] font-mono text-slate-500">ID: {sc.id}</div>
              </div>
              <Play className={`w-4 h-4 ${activeScenario === sc.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-cyan-500'}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==============================
// MAIN APP & SIMULATION LOOP
// ==============================

export default function App() {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES as Node[]);
  const [physics, setPhysics] = useState<any>({ energized: new Set<string>(['grid_a', 'grid_b']), currents: {}, flows: {} });
  const [selectedId, setSelectedId] = useState(null);
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('sim'); 
  const [activeScenario, setActiveScenario] = useState('normal');

  const masterReset = () => {
    setNodes(INITIAL_NODES.map(n => ({ ...n, status: n.type === NODE_TYPES.BREAKER ? 'CLOSED' : n.status, faulted: false, stress: 0, settings: n.settings ? {...DEFAULT_SETTINGS} : undefined })));
    setLogs([{ id: 'reset', time: new Date().toISOString().substring(11,23), device: 'MASTER', event: 'SYSTEM RESET', details: 'All faults cleared. Relays reset.', type: 'INFO' }]);
    setActiveScenario('normal');
    setSelectedId(null);
  };

  const addLog = (device, event, details, type = 'INFO') => {
    setLogs(prev => [{ id: Math.random().toString(36).substr(2,9), time: new Date().toISOString().substring(11, 23), device, event, details, type }, ...prev].slice(0, 50));
  };

  // Update specific node setting
  const updateNodeSetting = (nodeId, settingKey, value) => {
    setNodes(nodes.map(n => n.id === nodeId && n.settings ? { ...n, settings: { ...n.settings, [settingKey]: parseFloat(value) } } : n));
  };

  // Nodal Physics Loop (10Hz)
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
            
            // Apply Dynamic Settings
            const pickup50 = limit * (n.settings?.pickup50Mult || 5.0);
            const pickup51 = limit * (n.settings?.pickup51Mult || 1.05);
            const td51 = n.settings?.td51 || 0.5;

            // ANSI 50 (Instantaneous)
            if (current > pickup50) {
              addLog(n.label, 'GOOSE TRIP', `ANSI 50 Fast Trip. Current=${current.toFixed(0)}A (> ${pickup50}A setpoint)`, 'TRIP');
              stateChanged = true; return { ...n, status: 'TRIPPED', stress: 0 };
            }

            // ANSI 51 (Thermal / I²t)
            let newStress = n.stress || 0;
            if (current > pickup51) {
              // Calculate exactly based on IEEE curve
              const M = current / pickup51;
              const tripTimeSeconds = calculateThermalTripTime(current, pickup51, td51);
              
              // 10Hz tick means we accumulate (100% / tripTime) / 10 per tick
              const accumulationPerTick = (100 / tripTimeSeconds) / 10;
              newStress += accumulationPerTick;

              if (newStress >= 100) {
                addLog(n.label, 'GOOSE TRIP', `ANSI 51 Thermal Overload Trip (IEEE Extremely Inverse).`, 'TRIP');
                stateChanged = true; return { ...n, status: 'TRIPPED', stress: 0 };
              }
              stateChanged = true;
            } else if (newStress > 0) {
              newStress = Math.max(0, newStress - 1.5); 
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

  const loadScenario = (key) => {
    const scen = SCENARIOS[key];
    setNodes(INITIAL_NODES.map(n => {
      let overrides: any = { status: n.type === NODE_TYPES.BREAKER ? 'CLOSED' : (n as any).status, faulted: false, stress: 0, faultType: (n as any).faultType || 'LLL' };
      if (n.id === 'load1') overrides.loadMW = scen.load[0];
      if (n.id === 'load2') overrides.loadMW = scen.load[1];
      if (n.id === 'load3') overrides.loadMW = scen.load[2];
      if (n.id === 'load4') overrides.loadMW = scen.load[3];
      if (n.id === scen.fault) overrides.faulted = true;
      return { ...n, ...overrides };
    }));
    setActiveScenario(key);
    addLog('SYSTEM', 'SCENARIO', `Loaded: ${scen.name}`);
    setSelectedId(null);
  };

  const selectedNode = nodes.find(n => n.id === selectedId);

  return (
    <div className="h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden flex flex-col selection:bg-cyan-500/30">
      <PageSEO 
        title="Digital Twin | Substation Automation & Mesh Network Simulator"
        description="Interact with a live digital twin of a 132/33kV substation. Simulate bus faults, ring network load sharing, and IEC 61850 GOOSE communications."
        url="/twin"
        schema={twinSchema}
        keywords={["digital twin", "substation automation", "load flow simulation", "IEC 61850", "GOOSE messages", "mesh network"]}
      />
      
      {/* HEADER */}
      <header className="h-16 shrink-0 bg-[#0a0f1c] border-b border-cyan-900/50 flex items-center justify-between px-6 z-40 relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-900 via-cyan-400 to-cyan-900 opacity-80"></div>
        
        <div className="flex items-center gap-4">
          <div className="bg-cyan-950/50 border border-cyan-800 p-2 rounded text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-widest uppercase text-white shadow-cyan-500 leading-none">GridMaster <span className="text-cyan-400">Pro</span></h1>
            <div className="text-[10px] font-mono text-cyan-500/80 tracking-widest flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> IEC 61850 MESH SIMULATOR
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={masterReset} className="px-4 py-2 bg-red-950/40 hover:bg-red-900/80 border border-red-900/50 text-red-400 font-bold text-xs uppercase tracking-widest rounded transition-all flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <RotateCcw className="w-4 h-4"/> Master Reset
          </button>
          
          <div className="w-px h-8 bg-slate-800 mx-2"></div>

          <div className="bg-[#0f172a] p-1 rounded-md border border-slate-800 flex">
            <button onClick={() => setActiveTab('sim')} className={`px-5 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'sim' ? 'bg-cyan-950/60 text-cyan-400 shadow-sm border border-cyan-800' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
              <Activity className="w-3 h-3" /> Grid View
            </button>
            <button onClick={() => setActiveTab('theory')} className={`px-5 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'theory' ? 'bg-cyan-950/60 text-cyan-400 shadow-sm border border-cyan-800' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
              <BookOpen className="w-3 h-3" /> Academy
            </button>
          </div>
        </div>
      </header>

      {/* STRICT PERSISTENT FLEXBOX LAYOUT */}
      <div className="flex-1 flex overflow-hidden w-full h-full min-h-0">
        
        {activeTab === 'sim' ? (
          <>
            {/* LEFT COLUMN: SLD + SOE LOG */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 bg-[#030712] relative overflow-hidden">
              
              {/* TOP: ENLARGED SVG SLD CANVAS */}
              <div className="flex-1 relative cursor-crosshair overflow-hidden" onClick={() => setSelectedId(null)}>
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L40 0 L40 40 L0 40 Z' fill='none' stroke='%2338bdf8' stroke-width='1'/%3E%3C/svg%3E")` }}></div>
                
                {/* Tighter viewBox to naturally enlarge the SLD elements */}
                <svg className="w-full h-full" viewBox="100 50 850 600" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <filter id="thermal-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                    <radialGradient id="arc-flash"><stop offset="0%" stopColor="#ffffff" stopOpacity="1"/><stop offset="30%" stopColor="#38bdf8" stopOpacity="0.8"/><stop offset="100%" stopColor="#0284c7" stopOpacity="0"/></radialGradient>
                  </defs>

                  {/* Draw Links (Cables) */}
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

                  {/* Draw Nodes */}
                  {nodes.map(node => {
                    const isE = physics.energized.has(node.id);
                    const isS = selectedId === node.id;
                    const cur = physics.currents[node.id] || 0;
                    
                    return (
                      <g key={node.id} onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }} className="cursor-pointer outline-none">
                        
                        {/* Selected Indicator */}
                        <AnimatePresence>
                          {isS && (
                            <motion.circle r={35} cx={node.x} cy={node.y} fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 4" initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: 360 }} exit={{opacity: 0}} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: `${node.x}px ${node.y}px` }} />
                          )}
                        </AnimatePresence>

                        {/* Intense Fault Animation */}
                        {node.faulted && <ArcFlash x={node.x} y={node.y} />}

                        {/* Actual Components */}
                        {node.type === NODE_TYPES.BUS && (
                          <rect x={node.x - node.width/2} y={node.y - 4} width={node.width} height={8} fill={node.faulted ? '#ef4444' : isE ? '#0ea5e9' : '#1e293b'} style={{ filter: isE && !node.faulted ? 'drop-shadow(0 0 6px rgba(14,165,233,0.5))' : 'none' }} />
                        )}
                        
                        {(node.type === NODE_TYPES.BREAKER || node.type === NODE_TYPES.TIE) && (
                          <BreakerSymbol x={node.x} y={node.y} status={node.status} stress={node.stress} isEnergized={isE} horizontal={node.type === NODE_TYPES.TIE} />
                        )}

                        {node.type === NODE_TYPES.TRANSFORMER && <TransformerSymbol x={node.x} y={node.y} isEnergized={isE} />}
                        
                        {node.type === NODE_TYPES.GRID && (
                          <g transform={`translate(${node.x}, ${node.y})`}>
                            <circle r={22} fill="#0a0f1c" stroke="#38bdf8" strokeWidth={2} />
                            <Activity className="w-6 h-6 text-[#38bdf8]" x={-12} y={-12} />
                          </g>
                        )}

                        {node.type === NODE_TYPES.LOAD && (
                          <g transform={`translate(${node.x}, ${node.y})`}>
                            <polygon points="0,-18 18,12 -18,12" fill="#0a0f1c" stroke={isE ? '#8b5cf6' : '#475569'} strokeWidth={2} style={{ filter: isE ? 'drop-shadow(0 0 5px rgba(139,92,246,0.6))' : 'none' }} />
                          </g>
                        )}

                        {/* Labels & Telemetry */}
                        {node.type !== NODE_TYPES.BUS && (
                          <text x={node.x} y={node.y + (node.type===NODE_TYPES.TIE && node.id==='cb_tie' ? -35 : 38)} textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace" fontWeight="bold">
                            {node.label}
                          </text>
                        )}
                        {isE && cur > 5 && node.type !== NODE_TYPES.BUS && (
                          <text x={node.x} y={node.y + (node.type===NODE_TYPES.TIE && node.id==='cb_tie' ? -22 : 52)} textAnchor="middle" fill={cur > (node.ratingAmps||9999) ? '#ef4444' : '#38bdf8'} fontSize="13" fontFamily="monospace" fontWeight="bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            {cur.toFixed(0)} A
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* BOTTOM: SOE LOG TERMINAL (Docked & Persistent) */}
              <div className="h-[180px] shrink-0 bg-[#0a0f1c] border-t border-slate-800 flex flex-col z-20">
                <div className="bg-[#040812] px-4 py-2 border-b border-slate-800 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-cyan-500" /> Station Bus IEC 61850 Log</span>
                  <div className="flex gap-4">
                    <button onClick={() => {
                        const txt = logs.map(l => `[${l.time}] ${l.type} | ${l.device} | ${l.event} | ${l.details}`).join('\n');
                        downloadTextFile(txt, 'Substation_SOE_Log.txt');
                    }} className="hover:text-cyan-400 flex items-center gap-1 transition-colors"><Download className="w-3 h-3"/> EXPORT</button>
                    <button onClick={() => setLogs([])} className="hover:text-white transition-colors">CLEAR</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[10px] custom-scrollbar">
                  {logs.length === 0 && <span className="text-slate-600 pl-2">Listening to Process Bus... System Normal.</span>}
                  <AnimatePresence>
                    {logs.map((log) => (
                      <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex gap-3 hover:bg-slate-800/40 p-1.5 rounded ${log.type === 'TRIP' ? 'text-red-400 border-l-2 border-red-500 bg-red-950/20' : 'text-cyan-400'}`}>
                        <span className="text-slate-600 shrink-0">[{log.time}]</span>
                        <span className="w-32 font-bold truncate shrink-0">{log.device}</span>
                        <span className="w-32 truncate text-slate-300 shrink-0">{log.event}</span>
                        <span className="flex-1 opacity-80">{log.details}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: PERSISTENT IED/OVERVIEW PANEL (Reduced Width) */}
            <div className="w-[340px] shrink-0 bg-[#0a0f1c] flex flex-col z-30 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
              {selectedNode ? (
                // IED Dashboard
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-start bg-[#040812]">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span className="bg-cyan-900/40 text-cyan-400 text-[9px] px-1.5 py-0.5 rounded font-mono border border-cyan-800/50">IED DASHBOARD</span><span className="text-slate-500 text-[10px] font-mono">{selectedNode.id}</span></div>
                      <h2 className="text-lg font-black text-white">{selectedNode.label}</h2>
                    </div>
                    <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-white transition-colors p-1"><ZapOff className="w-5 h-5" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#0a0f1c]">
                    {/* Live SV Stream */}
                    <div className="bg-[#030712] border border-slate-800 rounded-lg p-4 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none"><Cpu size={60} /></div>
                      <h3 className="text-[10px] font-mono text-slate-500 mb-2">SAMPLED VALUE (RMS)</h3>
                      <div className="flex items-end justify-between">
                        <span className="text-3xl font-mono font-bold text-cyan-400">{physics.currents[selectedNode.id]?.toFixed(0) || 0}</span>
                        <span className="text-xs font-mono text-slate-500 mb-1">AMPS</span>
                      </div>
                      {selectedNode.ratingAmps && (
                        <div className="mt-3 h-1 w-full bg-slate-900 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: `${Math.min(100, (selectedNode.ratingAmps / Math.max(selectedNode.ratingAmps * 1.5, physics.currents[selectedNode.id] || 0)) * 100)}%` }}></div>
                          <motion.div className="h-full bg-cyan-500" animate={{ width: `${Math.min(100, (physics.currents[selectedNode.id] / (selectedNode.ratingAmps * 1.5)) * 100)}%`, backgroundColor: physics.currents[selectedNode.id] > selectedNode.ratingAmps ? '#ef4444' : '#06b6d4' }} />
                        </div>
                      )}
                    </div>

                    {/* Interactive Breaker Settings & Controls */}
                    {(selectedNode.type === NODE_TYPES.BREAKER || selectedNode.type === NODE_TYPES.TIE) && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">Protection Settings</h3>
                        <div className="space-y-3 bg-[#030712] border border-slate-800 p-3 rounded text-xs font-mono">
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400"><label>ANSI 51 Pickup (x In)</label> <span className="text-cyan-400">{selectedNode.settings?.pickup51Mult?.toFixed(2) || '1.05'}</span></div>
                            <input type="range" min="1.0" max="1.5" step="0.05" value={selectedNode.settings?.pickup51Mult || 1.05} onChange={(e) => updateNodeSetting(selectedNode.id, 'pickup51Mult', e.target.value)} className="w-full h-1 bg-slate-800 rounded appearance-none accent-cyan-500" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400"><label>ANSI 51 Time Dial (TD)</label> <span className="text-cyan-400">{selectedNode.settings?.td51?.toFixed(2) || '0.50'}</span></div>
                            <input type="range" min="0.1" max="1.5" step="0.05" value={selectedNode.settings?.td51 || 0.5} onChange={(e) => updateNodeSetting(selectedNode.id, 'td51', e.target.value)} className="w-full h-1 bg-slate-800 rounded appearance-none accent-cyan-500" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400"><label>ANSI 50 Inst (x In)</label> <span className="text-cyan-400">{selectedNode.settings?.pickup50Mult?.toFixed(1) || '5.0'}</span></div>
                            <input type="range" min="2.0" max="10.0" step="0.5" value={selectedNode.settings?.pickup50Mult || 5.0} onChange={(e) => updateNodeSetting(selectedNode.id, 'pickup50Mult', e.target.value)} className="w-full h-1 bg-slate-800 rounded appearance-none accent-cyan-500" />
                          </div>

                        </div>

                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mt-4">Manual Operation</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => { setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, status: 'CLOSED', faulted: false, stress: 0 } : n)); addLog(selectedNode.label, 'CMD', 'CLOSE Executed'); }} disabled={selectedNode.status === 'CLOSED'} className="py-2.5 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/50 disabled:opacity-20 text-emerald-400 font-bold text-[10px] rounded transition-all">52-CLOSE</button>
                          <button onClick={() => { setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, status: 'OPEN' } : n)); addLog(selectedNode.label, 'CMD', 'TRIP Executed'); }} disabled={selectedNode.status === 'OPEN' || selectedNode.status === 'TRIPPED'} className="py-2.5 bg-red-950/40 hover:bg-red-900 border border-red-900/50 disabled:opacity-20 text-red-400 font-bold text-[10px] rounded transition-all">52-TRIP</button>
                        </div>
                        
                        {selectedNode.stress > 0 && selectedNode.status === 'CLOSED' && (
                          <div className="mt-3 bg-slate-900/50 p-2 rounded border border-red-900/30">
                            <div className="flex justify-between text-[10px] text-red-400 mb-1"><span>Thermal I²t Stress</span> <span>{selectedNode.stress.toFixed(1)}%</span></div>
                            <div className="w-full h-1 bg-slate-800 rounded overflow-hidden"><motion.div className="h-full bg-red-500" animate={{ width: `${selectedNode.stress}%` }} /></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Load & Fault Settings */}
                    {selectedNode.type === NODE_TYPES.LOAD && (
                      <div className="space-y-4">
                        <div className="bg-[#030712] border border-slate-800 p-4 rounded-lg">
                          <div className="flex justify-between text-[10px] font-mono mb-3 text-slate-400"><span>DEMAND SETPOINT</span> <span className="text-cyan-400 font-bold">{selectedNode.loadMW} MW</span></div>
                          <input type="range" min={0} max={100} step={1} value={selectedNode.loadMW} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, loadMW: parseInt(e.target.value) } : n))} className="w-full h-1 bg-slate-800 rounded appearance-none accent-cyan-500" />
                        </div>

                        <div className="bg-[#030712] border border-slate-800 p-4 rounded-lg space-y-3">
                           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">Fault Simulator</h3>
                           <div className="text-xs font-mono text-slate-400">Select Fault Type:</div>
                           <select value={selectedNode.faultType || 'LLL'} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, faultType: e.target.value } : n))} className="w-full bg-[#0a0f1c] border border-slate-700 text-cyan-400 rounded p-1 text-xs font-bold outline-none focus:border-cyan-500">
                             <option value="LLL">3-Phase Bolted (LLL)</option>
                             <option value="LL">Line-to-Line (LL)</option>
                             <option value="LG">Line-to-Ground (LG)</option>
                           </select>

                           <button onClick={() => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, faulted: !n.faulted } : n))} className={`mt-2 w-full py-2.5 rounded font-bold text-[10px] border transition-all flex items-center justify-center gap-2 ${selectedNode.faulted ? 'bg-amber-950/40 border-amber-900/50 text-amber-500 hover:bg-amber-900' : 'bg-red-950/20 border-red-900/30 text-red-400 hover:border-red-900/80 hover:bg-red-950/40'}`}>
                            {selectedNode.faulted ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {selectedNode.faulted ? 'CLEAR FAULT' : 'INJECT FAULT'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <GlobalOverviewPanel nodes={nodes} scenarios={SCENARIOS} loadScenario={loadScenario} activeScenario={activeScenario} />
              )}
            </div>

          </>
        ) : (
          <TheoryHub />
        )}
      </div>

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