import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Zap,
  Layers,
  BookOpen,
  Clock,
  Cpu,
  RefreshCw,
  AlertCircle,
  ClipboardCheck,
  Network,
  Trophy,
  Target,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  Calculator,
  Gauge,
  Scale,
  GitMerge,
  PieChart,
  Radar,
  GraduationCap,
  Award,
  Play,
  Star,
  ShieldCheck,
  Microscope,
  Terminal,
  Battery,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Server,
  Wifi,
  Database,
  Power,
  MousePointer2,
  ToggleRight,
  ToggleLeft,
  Waves,
  Globe,
  Eye,
  FastForward,
  Settings,
  Search,
  Timer,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Slider from "../components/Slider";
import SEO from "../components/SEO";

// --- CONSTANTS ---

const KNOWLEDGE_SNIPPETS = [
  {
    id: "coord",
    tag: "CORE CONCEPTS",
    title: "Protection Coordination",
    icon: Scale,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-100 dark:border-blue-800",
    description:
      "Coordination is the art of isolating faults while keeping the rest of the grid alive. It requires balancing sensitivity with stability.",
    bullets: [
      "**Selectivity:** Only the closest breaker should trip.",
      "**Speed:** Clear faults fast to minimize I²t damage.",
      "**Stability:** Ride through motor starting currents.",
    ],
    link: "/tcc",
    linkText: "Open TCC Studio",
  },
  {
    id: "iec61850",
    tag: "MODERN GRID",
    title: "Digital Substations",
    icon: Network,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-100 dark:border-purple-800",
    description:
      "The shift from copper to fiber. IEC 61850 replaces physical wires with Ethernet packets, introducing new engineering challenges.",
    bullets: [
      "**GOOSE:** Replaces hardwired trip signals (<4ms latency).",
      "**Sampled Values:** CTs/VTs digitized at source.",
      "**PTP:** Microsecond time sync is critical.",
    ],
    link: "/comms",
    linkText: "Analyze Packets",
  },
  {
    id: "forensics",
    tag: "ROOT CAUSE",
    title: "Forensic Analysis",
    icon: Microscope,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-100 dark:border-red-800",
    description:
      "When protection fails, physics is usually the culprit. Understanding magnetic flux and harmonic distortion is key to prevention.",
    bullets: [
      "**CT Saturation:** DC offset blinds relays.",
      "**Harmonics:** Inrush looks like a fault.",
      "**Distortion:** Waveform clipping reduces RMS.",
    ],
    link: "/failure",
    linkText: "Reconstruct Failure",
  },
];

const VALUE_PROPS = [
  {
    title: "Browser Native",
    desc: "No installs. No dongles. Runs on any device.",
    icon: Globe,
  },
  {
    title: "Physics Engine",
    desc: "Real-time vector math & thermal integrals.",
    icon: Cpu,
  },
  {
    title: "Offline First",
    desc: "PWA enabled. Works in the field without signal.",
    icon: Wifi,
  },
  {
    title: "Visual Learning",
    desc: "See the invisible flux, waves, and packets.",
    icon: Eye,
  },
];

const FAQ_DATA = [
  {
    q: "What is RelaySchool?",
    a: "RelaySchool is an advanced, browser-based simulation suite for Power System Protection engineering. It provides interactive labs for TCC coordination, IEC 61850 protocol analysis, and forensic fault reconstruction without requiring expensive desktop software.",
  },
  {
    q: "Is this tool suitable for professional coordination studies?",
    a: "RelaySchool is an educational platform designed for training and concept verification. While it uses physics-accurate formulas (IEC 60255/IEEE C37.112), it should not be used as the sole tool for safety-critical settings on live equipment. Always verify with licensed professional software.",
  },
  {
    q: "How does the Digital Twin simulation work?",
    a: "The Digital Twin module uses a real-time topology processor. It analyzes the connectivity of nodes (Breakers, Busbars, Transformers) 60 times per second to calculate load flow, energization status, and fault current propagation based on your switching actions.",
  },
  {
    q: "Can I analyze IEC 61850 GOOSE packets?",
    a: "Yes. The Comms Hub module features a packet generator and inspector. You can simulate GOOSE storms, check VLAN priority tagging, and visualize the impact of network latency on protection clearing times.",
  },
  {
    q: "What is the difference between ANSI and IEC curves?",
    a: "ANSI (IEEE) and IEC standards define different mathematical formulas for Time-Overcurrent protection. IEC curves (Standard, Very, Extremely Inverse) are asymptotic at M=1, whereas ANSI curves have a different slope characteristic. Our TCC Studio allows you to compare both.",
  },
  {
    q: "How do I calculate CT Saturation?",
    a: "The Failure Lab and Engineer Toolkit provide calculators for CT Burden and Saturation voltage. You can input the CT Class (e.g., 5P20), rated burden, and lead resistance to verify if the CT will saturate during a maximum fault.",
  },
  {
    q: "Does the application work offline?",
    a: "Yes. RelaySchool is a Progressive Web App (PWA) built with offline-first architecture. Once loaded, all calculations, simulations, and interactive graphs run entirely in your browser's local JavaScript engine.",
  },
  {
    q: "Can I export simulation data?",
    a: "Yes. The Event Analyzer allows you to export fault records in a simulated COMTRADE format (CFG/DAT), and the Comms Hub allows PCAP export for Wireshark analysis.",
  },
  {
    q: "What is 'Differential Slope' protection?",
    a: "Differential protection (ANSI 87) operates on the principle that current entering a zone must equal current leaving. The 'Slope' characteristic increases the restraint setting as through-current increases, preventing false trips due to CT errors during heavy external faults.",
  },
  {
    q: "Do I need an account to save projects?",
    a: "Currently, RelaySchool uses your browser's Local Storage to persist your settings, relay curves, and logic diagrams. No login is required, and your data never leaves your device.",
  },
];

// --- INTERACTIVE WIDGETS ---

const MiniTCCWidget = () => {
  const [amps, setAmps] = useState(500);
  // IEC SI: t = TMS * 0.14 / ((I/Is)^0.02 - 1)
  // Settings: Is=100A, TMS=0.1
  const t = (0.1 * 0.14) / (Math.pow(amps / 100, 0.02) - 1);
  const yPos = Math.max(10, Math.min(90, 90 - t * 20)); // Approx scale
  const xPos = Math.min(90, (amps / 1000) * 100);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          <Activity className="w-3 h-3" /> Quick TCC Check
        </div>
        <div className="text-xs font-mono font-bold text-blue-600">
          {t.toFixed(2)}s
        </div>
      </div>
      <div className="flex-1 relative border-l border-b border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg mb-3 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path
            d="M 10 10 Q 30 80 90 90"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        </svg>
        <div
          className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg transition-all duration-75"
          style={{
            left: `${xPos}%`,
            bottom: `${100 - yPos}%`,
            transform: "translate(-50%, 50%)",
          }}
        ></div>
      </div>
      <Slider 
        label="Inject Current" 
        unit="A" 
        min={150} 
        max={1000} 
        step={10} 
        value={amps} 
        onChange={e => setAmps(Number(e.target.value))} 
        color="blue" 
      />
    </div>
  );
};

const MiniTwinWidget = () => {
  const [breaker, setBreaker] = useState(true);
  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          <Server className="w-3 h-3" /> Topology Sim
        </div>
        <div
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${breaker ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}
        >
          {breaker ? "POWER ON" : "DE-ENERGIZED"}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center relative bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`h-1 w-full transition-colors duration-300 ${breaker ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-slate-300 dark:bg-slate-700"}`}
          ></div>
        </div>
        <div className="absolute left-4 w-8 h-8 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded flex items-center justify-center z-10 text-[8px] font-bold">
          GRID
        </div>
        <button
          onClick={() => setBreaker(!breaker)}
          className={`relative z-10 w-8 h-8 rounded border-2 flex items-center justify-center transition-all hover:scale-110 ${breaker ? "bg-red-500 border-red-600 text-white" : "bg-green-500 border-green-600 text-white"}`}
        >
          <Power className="w-4 h-4" />
        </button>
        <div className="absolute right-4 w-8 h-8 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center z-10 text-[8px] font-bold">
          LOAD
        </div>
      </div>
      <div className="mt-3 text-[10px] text-center text-slate-400">
        Click the breaker to toggle state.
      </div>
    </div>
  );
};

const MiniVectorWidget = () => {
  const [angle, setAngle] = useState(0);
  const [unbalance, setUnbalance] = useState(0); // 0 to 100% loss of B&C

  useEffect(() => {
    const interval = setInterval(
      () => setAngle((prev) => (prev + 2) % 360),
      50,
    );
    return () => clearInterval(interval);
  }, []);

  // Mag starts at 35.
  // Unbalance reduces B & C magnitudes.
  const magA = 35;
  const magB = 35 * (1 - unbalance / 100);
  const magC = 35 * (1 - unbalance / 100);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          <Radar className="w-3 h-3" /> Phasor Monitor
        </div>
        <div className="text-[10px] font-mono text-purple-500 animate-pulse">
          Live
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e2e8f0"
            className="dark:stroke-slate-800"
          />
          {/* Grid lines */}
          <line
            x1="50"
            y1="50"
            x2="90"
            y2="50"
            stroke="#e2e8f0"
            className="dark:stroke-slate-800"
            strokeWidth="1"
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="10"
            stroke="#e2e8f0"
            className="dark:stroke-slate-800"
            strokeWidth="1"
          />

          {/* Phase A */}
          <line
            x1="50"
            y1="50"
            x2={50 + magA * Math.cos((angle * Math.PI) / 180)}
            y2={50 + magA * Math.sin((angle * Math.PI) / 180)}
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Phase B */}
          <line
            x1="50"
            y1="50"
            x2={50 + magB * Math.cos(((angle + 120) * Math.PI) / 180)}
            y2={50 + magB * Math.sin(((angle + 120) * Math.PI) / 180)}
            stroke="#eab308"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Phase C */}
          <line
            x1="50"
            y1="50"
            x2={50 + magC * Math.cos(((angle + 240) * Math.PI) / 180)}
            y2={50 + magC * Math.sin(((angle + 240) * Math.PI) / 180)}
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {/* Center dot */}
        <div className="absolute w-1 h-1 bg-slate-900 dark:bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <Slider 
        label="Unbalance" 
        unit="%" 
        min={0} 
        max={100} 
        step={1} 
        value={unbalance} 
        onChange={e => setUnbalance(Number(e.target.value))} 
        color="purple" 
      />

      <div className="mt-1 flex justify-between text-[8px] font-mono text-slate-400">
        <span>IA: 100%</span>
        <span>IB: {(100 - unbalance).toFixed(0)}%</span>
        <span>IC: {(100 - unbalance).toFixed(0)}%</span>
      </div>
    </div>
  );
};

const MiniLogicWidget = () => {
  const [inA, setInA] = useState(false);
  const [inB, setInB] = useState(false);
  const out = inA && inB;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          <Cpu className="w-3 h-3" /> Logic Interlock
        </div>
        <div
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${out ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}
        >
          {out ? "CLOSED" : "OPEN"}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 gap-2 relative overflow-hidden">
        <div className="flex flex-col gap-4 z-10">
          <button
            onClick={() => setInA(!inA)}
            className={`w-8 h-6 rounded border-2 flex items-center justify-center transition-colors ${inA ? "border-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:border-blue-400" : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"}`}
          >
            A
          </button>
          <button
            onClick={() => setInB(!inB)}
            className={`w-8 h-6 rounded border-2 flex items-center justify-center transition-colors ${inB ? "border-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:border-blue-400" : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"}`}
          >
            B
          </button>
        </div>
        <div className="h-full w-px bg-slate-200 dark:bg-slate-800"></div>
        <div className="z-10 flex items-center gap-1">
          <div className="w-8 h-8 border-2 border-slate-700 dark:border-slate-400 rounded-l-md rounded-r-full flex items-center justify-center text-[10px] font-bold">
            &
          </div>
          <div
            className={`w-4 h-4 rounded-full ${out ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-slate-300 dark:bg-slate-700"} transition-all`}
          ></div>
        </div>
        {/* Wires */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <path
            d="M 40 30 L 60 50 M 40 70 L 60 50"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="mt-3 text-[10px] text-center text-slate-400">
        Activate both inputs to close contact.
      </div>
    </div>
  );
};

const MiniHarmonicWidget = () => {
  const [distortion, setDistortion] = useState(0);

  // Draw simple wave path
  const points = 40;
  const w = 100;
  const h = 50;
  const path =
    `M 0 ${h / 2} ` +
    Array.from({ length: points + 1 }, (_, i) => {
      const x = (i / points) * w;
      const rad = (i / points) * Math.PI * 2;
      const y =
        h / 2 + Math.sin(rad) * 15 + Math.sin(rad * 3) * (distortion * 0.5);
      return `L ${x} ${y}`;
    }).join(" ");

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          <Waves className="w-3 h-3" /> Harmonic Inj.
        </div>
        <div className="text-[10px] font-mono font-bold text-amber-500">
          {distortion}% THD
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden flex items-center justify-center">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-full p-2"
          preserveAspectRatio="none"
        >
          <path
            d={path}
            fill="none"
            stroke={distortion > 20 ? "#ef4444" : "#3b82f6"}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <Slider 
        label="Noise Level" 
        unit="%" 
        min={0} 
        max={50} 
        step={1} 
        value={distortion} 
        onChange={e => setDistortion(Number(e.target.value))} 
        color="amber" 
      />
    </div>
  );
};

const MiniDistanceWidget = () => {
  const [dist, setDist] = useState(80);
  const trip = dist < 50;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          <Target className="w-3 h-3" /> Zone Reach
        </div>
        <div
          className={`text-[10px] font-bold ${trip ? "text-red-500" : "text-green-500"}`}
        >
          {trip ? "TRIP Z1" : "NORMAL"}
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 relative flex items-center justify-center overflow-hidden">
        <div
          className={`w-24 h-24 rounded-full border-2 border-dashed ${trip ? "border-red-500 bg-red-500/10" : "border-slate-300 dark:border-slate-700"} flex items-center justify-center relative transition-all`}
        >
          <div className="w-full h-px bg-slate-200 dark:bg-slate-800 absolute"></div>
          <div className="h-full w-px bg-slate-200 dark:bg-slate-800 absolute"></div>
          {/* Impedance Dot */}
          <div
            className={`w-3 h-3 rounded-full absolute transition-all duration-300 shadow-md ${trip ? "bg-red-600" : "bg-blue-500"}`}
            style={{ top: "30%", left: `${dist}%` }}
          ></div>
        </div>
      </div>
      <Slider 
        label="Fault Distance" 
        unit="%" 
        min={20} 
        max={100} 
        step={1} 
        value={dist} 
        onChange={e => setDist(Number(e.target.value))} 
        color="purple" 
      />
    </div>
  );
};

// --- JARGON TOOLTIP ---
const JargonTooltip = ({ text, explanation }: { text: string, explanation: string }) => {
   return (
      <span className="relative group/tooltip inline-block cursor-help border-b-2 border-dotted border-blue-400 dark:border-blue-600">
         {text}
         <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none shadow-2xl z-50 scale-95 group-hover/tooltip:scale-100">
            <span className="font-bold text-blue-400 block mb-1">{text}</span>
            {explanation}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-slate-700 rotate-45"></span>
         </span>
      </span>
   );
};

// --- CORE DASHBOARD COMPONENTS ---

const GridPulseHero = () => {
  const [baseFreq, setBaseFreq] = useState(50);
  const [freq, setFreq] = useState(50.0);
  const [breakerClosed, setBreakerClosed] = useState(true);
  const [particles, setParticles] = useState<{x: number, y: number, speed: number, id: number}[]>([]);

  // Frequency simulation
  useEffect(() => {
    const i = setInterval(() => {
      setFreq(baseFreq + (Math.random() - 0.5) * (breakerClosed ? 0.035 : 0.5));
    }, 800);
    return () => clearInterval(i);
  }, [baseFreq, breakerClosed]);

  // Particle load flow engine
  useEffect(() => {
    if (!breakerClosed) { setParticles([]); return; }
    let frame: number;
    let particleId = 0;
    
    const animate = () => {
      setParticles(prev => {
        const next = prev.map(p => ({ ...p, x: p.x + p.speed }))
             .filter(p => p.x < 100);
        
        // Spawn new particles
        if (Math.random() > 0.6) {
           next.push({ x: 0, y: Math.random() * 100, speed: 0.5 + Math.random() * 1, id: particleId++ });
        }
        return next;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [breakerClosed]);

  const pathData =
    `M 0 40 ` +
    Array.from({ length: 60 }, (_, i) => `L ${i * 10} ${40 + Math.sin(i * 0.4 + Date.now() / 400) * (breakerClosed ? 25 : 2)}`).join(" ");

  return (
    <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 text-white group bg-slate-900">
      
      {/* Real-time Particle Particle Flow Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      
      {breakerClosed && (
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
             {particles.map(p => (
                 <div key={p.id} className="absolute w-2 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa] blur-[0.5px]" style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: 1 - (p.x/100) }} />
             ))}
          </div>
      )}

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="space-y-6 max-w-xl">
          
          <div className="flex flex-wrap gap-3">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
               <span className="relative flex h-2 w-2">
                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${breakerClosed ? 'bg-blue-400' : 'bg-red-400'} opacity-75`}></span>
                 <span className={`relative inline-flex rounded-full h-2 w-2 ${breakerClosed ? 'bg-blue-500' : 'bg-red-500'}`}></span>
               </span>
               {breakerClosed ? 'Live Simulation Engine' : 'System Tripped'}
             </div>
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-bold tracking-widest uppercase shadow-sm">
                 <ShieldCheck className="w-3 h-3 text-emerald-400" /> IEEE C37.112 / IEC 60255 Verified
             </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Master Power System <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Engineering Through Real Simulations
            </span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-lg">
            Learn protection, fault studies, relay coordination, digital substations, and system analysis using simulations aligned with IEC/IEEE practices and real industrial scenarios.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 py-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> IEC-based simulations
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Industry case studies
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Interactive engineering tools
            </div>
          </div>
          
          {/* Guided Onboarding Paths */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              to="/academy"
              className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-between gap-4 group/btn"
            >
              <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 opacity-80" />
                  <div className="text-left">
                     <div className="text-xs text-blue-200 uppercase tracking-widest">Start Now</div>
                     <div className="text-sm">Start Simulation Lab</div>
                  </div>
              </div>
              <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/academy"
              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-between gap-4 group/btn"
            >
               <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 opacity-80 text-purple-400" />
                  <div className="text-left">
                     <div className="text-xs text-slate-400 uppercase tracking-widest">Curriculum</div>
                     <div className="text-sm">Explore Learning Paths</div>
                  </div>
              </div>
              <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Live Interactive Monitor Visual */}
        <div className="flex-1 w-full max-w-md bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative overflow-hidden group/monitor hover:border-slate-600 transition-colors">
          
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => setBreakerClosed(!breakerClosed)}
                  className={`relative z-10 w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg ${breakerClosed ? "bg-red-500 border-red-600 shadow-red-500/20 text-white" : "bg-emerald-500 border-emerald-600 shadow-emerald-500/20 text-white"}`}
                  title={breakerClosed ? "Trip Breaker" : "Close Breaker"}
               >
                  <Power className="w-5 h-5" />
               </button>
               <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Interactive Demo</div>
                  <div className={`text-xs font-bold uppercase tracking-wider ${breakerClosed ? 'text-red-400' : 'text-emerald-400'}`}>
                     CB-101 {breakerClosed ? 'CLOSED (LIVE)' : 'OPEN (TRIPPED)'}
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Wifi className={`w-3 h-3 ${breakerClosed ? 'text-emerald-500 animate-pulse' : 'text-slate-600'}`} />
              <span className={`text-[10px] font-mono font-bold ${breakerClosed ? 'text-emerald-500' : 'text-slate-500'}`}>
                {breakerClosed ? 'SYNCED' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-sm text-slate-400 font-medium">
                Frequency
              </span>
              <div className="flex flex-col items-end">
                <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 mb-1">
                  <button
                    onClick={() => setBaseFreq(50)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${baseFreq === 50 ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    50Hz
                  </button>
                  <button
                    onClick={() => setBaseFreq(60)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${baseFreq === 60 ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    60Hz
                  </button>
                </div>
                <div className="text-right">
                  <span className="font-mono text-4xl font-black text-white tracking-tighter">
                    {freq.toFixed(3)}
                  </span>
                  <span className="text-sm text-slate-500 ml-1 font-bold">
                    Hz
                  </span>
                </div>
              </div>
            </div>
            <div className="h-20 w-full bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden relative">
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  d={pathData}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold">
                  PTP Drift
                </div>
                <div className="text-xs font-mono text-emerald-400 mt-1">
                  0.002ms
                </div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold">
                  GOOSE Latency
                </div>
                <div className="text-xs font-mono text-blue-400 mt-1">
                  3.4ms
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ANIMATED COUNTER CONTROLLER ---
const AnimatedCounter = ({ value, label, icon: Icon, suffix = "" }: {value: number, label: string, icon: any, suffix?: string}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-2 text-blue-500">
         <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
         {count}{suffix}
      </div>
      <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1 text-center">
         {label}
      </div>
    </div>
  );
};

// --- GLOBAL ACTIVITY TICKER ---
const ActivityTicker = () => {
   const activities = [
      "Engineer from UK simulated a 50kA fault in Digital Twin",
      "Student from India graded an SEL-751 in Relay Tester",
      "Consultant from USA exported a TCC Coordination Report",
      "Trainee from Brazil analyzed a GOOSE packet storm",
      "Professor from Germany verified CT Saturation limits",
      "Engineer from Australia reconstructed a Phase-to-Phase Fault"
   ];

   return (
      <div className="w-full bg-slate-900 border-y border-slate-800 py-2.5 overflow-hidden flex items-center relative z-20">
         <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
         <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10"></div>
         
         <div className="flex items-center gap-2 px-4 border-r border-slate-700 bg-slate-900 z-10 shadow-lg">
            <Globe className="w-4 h-4 text-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Live Activity</span>
         </div>
         
         <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] group-hover:[animation-play-state:paused] opacity-80">
            {[...activities, ...activities].map((act, i) => (
               <div key={i} className="flex items-center gap-3 px-6 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {act}
               </div>
            ))}
         </div>
      </div>
   );
};


const TOOL_THEMES: Record<
  string,
  {
    bg: string;
    border: string;
    iconBg: string;
    iconText: string;
    tagBg: string;
    tagText: string;
    btnBg: string;
    btnHover: string;
    glow: string;
  }
> = {
  blue: {
    bg: "bg-blue-50/60 dark:bg-blue-950/30",
    border: "border-blue-200/60 dark:border-blue-800/40",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconText: "text-blue-600 dark:text-blue-400",
    tagBg: "bg-blue-100 dark:bg-blue-900/30",
    tagText: "text-blue-700 dark:text-blue-300",
    btnBg: "bg-blue-600",
    btnHover: "hover:bg-blue-500",
    glow: "hover:shadow-blue-500/20",
  },
  indigo: {
    bg: "bg-indigo-50/60 dark:bg-indigo-950/30",
    border: "border-indigo-200/60 dark:border-indigo-800/40",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    iconText: "text-indigo-600 dark:text-indigo-400",
    tagBg: "bg-indigo-100 dark:bg-indigo-900/30",
    tagText: "text-indigo-700 dark:text-indigo-300",
    btnBg: "bg-indigo-600",
    btnHover: "hover:bg-indigo-500",
    glow: "hover:shadow-indigo-500/20",
  },
  purple: {
    bg: "bg-purple-50/60 dark:bg-purple-950/30",
    border: "border-purple-200/60 dark:border-purple-800/40",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconText: "text-purple-600 dark:text-purple-400",
    tagBg: "bg-purple-100 dark:bg-purple-900/30",
    tagText: "text-purple-700 dark:text-purple-300",
    btnBg: "bg-purple-600",
    btnHover: "hover:bg-purple-500",
    glow: "hover:shadow-purple-500/20",
  },
  teal: {
    bg: "bg-teal-50/60 dark:bg-teal-950/30",
    border: "border-teal-200/60 dark:border-teal-800/40",
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    iconText: "text-teal-600 dark:text-teal-400",
    tagBg: "bg-teal-100 dark:bg-teal-900/30",
    tagText: "text-teal-700 dark:text-teal-300",
    btnBg: "bg-teal-600",
    btnHover: "hover:bg-teal-500",
    glow: "hover:shadow-teal-500/20",
  },
  red: {
    bg: "bg-red-50/60 dark:bg-red-950/30",
    border: "border-red-200/60 dark:border-red-800/40",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconText: "text-red-600 dark:text-red-400",
    tagBg: "bg-red-100 dark:bg-red-900/30",
    tagText: "text-red-700 dark:text-red-300",
    btnBg: "bg-red-600",
    btnHover: "hover:bg-red-500",
    glow: "hover:shadow-red-500/20",
  },
  amber: {
    bg: "bg-amber-50/60 dark:bg-amber-950/30",
    border: "border-amber-200/60 dark:border-amber-800/40",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconText: "text-amber-600 dark:text-amber-400",
    tagBg: "bg-amber-100 dark:bg-amber-900/30",
    tagText: "text-amber-700 dark:text-amber-300",
    btnBg: "bg-amber-600",
    btnHover: "hover:bg-amber-500",
    glow: "hover:shadow-amber-500/20",
  },
  emerald: {
    bg: "bg-emerald-50/60 dark:bg-emerald-950/30",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconText: "text-emerald-600 dark:text-emerald-400",
    tagBg: "bg-emerald-100 dark:bg-emerald-900/30",
    tagText: "text-emerald-700 dark:text-emerald-300",
    btnBg: "bg-emerald-600",
    btnHover: "hover:bg-emerald-500",
    glow: "hover:shadow-emerald-500/20",
  },
  cyan: {
    bg: "bg-cyan-50/60 dark:bg-cyan-950/30",
    border: "border-cyan-200/60 dark:border-cyan-800/40",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
    iconText: "text-cyan-600 dark:text-cyan-400",
    tagBg: "bg-cyan-100 dark:bg-cyan-900/30",
    tagText: "text-cyan-700 dark:text-cyan-300",
    btnBg: "bg-cyan-600",
    btnHover: "hover:bg-cyan-500",
    glow: "hover:shadow-cyan-500/20",
  },
  slate: {
    bg: "bg-slate-100/60 dark:bg-slate-900/50",
    border: "border-slate-200/60 dark:border-slate-700/40",
    iconBg: "bg-slate-200 dark:bg-slate-800",
    iconText: "text-slate-600 dark:text-slate-400",
    tagBg: "bg-slate-200 dark:bg-slate-800",
    tagText: "text-slate-600 dark:text-slate-300",
    btnBg: "bg-slate-700",
    btnHover: "hover:bg-slate-600",
    glow: "hover:shadow-slate-500/20",
  },
};

const ToolWidget = ({
  title,
  icon: Icon,
  link,
  desc,
  status,
  theme = "blue",
  difficulty = "Basic",
  useCase,
  standard,
  isHighlighted = true,
}: any) => {
  const t = TOOL_THEMES[theme] || TOOL_THEMES.blue;

  const [isCompleted, setIsCompleted] = useState(false);
  useEffect(() => {
     const check = () => {
         const stored = JSON.parse(localStorage.getItem('relayschool_progress') || '[]');
         setIsCompleted(stored.includes(link));
     };
     check();
     window.addEventListener('progress_updated', check);
     return () => window.removeEventListener('progress_updated', check);
  }, [link]);

  return (
    <Link to={link} className={`block group h-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl transition-opacity duration-300 ${isHighlighted ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}>
      <div
        className={`h-full ${t.bg} rounded-2xl border ${t.border} p-6 shadow-sm hover:shadow-2xl ${t.glow} hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex flex-col cursor-pointer`}
      >
        {/* Animated Hover Mesh Pattern Background */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5YzlhOWYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzR2LTE2aDJ2MTZoLTJ6bS0xNCAwaDJ2MTZoLTJWMzR6bTE0IDE2aC0ydjE2aDJWMzR6bS0xNCAwaDJ2MTZoLTJWNTB6bTMyIDM2djE2aDJ2LTE2aC0yem0tMTQgMGgydjE2aC0ydjE2em0xNCAwaC0ydjE2aDJ2LTE2em0tMTQgMGgydjE2aC0ydjE2em0tMTAtMzJoMTZWMzRoLTE2djI2em0wLTE2aDE2VjJoLTE2djI2em0wIDMySDJWMzRoMTZWMjZ6bTAtMTZIMlYyaDE2VjI2eiIvPjwvZz48L2c+PC9zdmc+')] [background-size:20px_20px] animate-[pulse_4s_ease-in-out_infinite]"></div>

        {/* Decorative background icon */}
        <div className="absolute -right-4 -top-4 opacity-[0.04] group-hover:opacity-[0.12] group-hover:-rotate-12 group-hover:scale-125 transition-all duration-700 ease-out">
          <Icon className="w-32 h-32" />
        </div>

        <div className="flex justify-between items-start mb-4 relative z-10">
           <div className="perspective-1000">
             <div
               className={`p-3 ${t.iconBg} rounded-xl ${t.iconText} transform-gpu group-hover:rotate-x-12 group-hover:rotate-y-12 transition-transform duration-500 border border-white/10 shadow-lg`}
               style={{ transformStyle: 'preserve-3d' }}
             >
               <Icon className="w-6 h-6 transform-gpu translate-z-10 drop-shadow-md" />
             </div>
           </div>
           
           <div className="flex flex-col items-end gap-1.5">
              <div className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${difficulty === 'Expert' ? 'bg-red-500/10 text-red-500' : difficulty === 'Design' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'} border border-current/20`}>
                {difficulty}
              </div>
              {standard && (
                <div className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-500/10 text-slate-500 border border-current/20`}>
                  {standard}
                </div>
              )}
           </div>
        </div>
        
        {/* Content container that slides up on hover */}
        <div className="flex-1 flex flex-col relative z-10">
           <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
             {title}
             {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-white/50 dark:bg-slate-900/50 rounded-full" />}
           </h3>
           {useCase && (
               <div className="text-[11px] text-slate-500 font-bold mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-700/50 tracking-wider uppercase">
                   Use Case: {useCase}
               </div>
           )}
           <div className="relative flex-1 overflow-hidden min-h-[6rem]">
              <p className="absolute inset-0 text-sm text-slate-600 dark:text-slate-400 leading-relaxed group-hover:opacity-0 group-hover:translate-y-4 transition-all duration-500">
                {desc}
              </p>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                 <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 shadow-xl">
                    <Play className="w-4 h-4" /> Start Simulation
                 </div>
              </div>
           </div>
        </div>

        <div
          className={`relative z-10 mt-auto flex items-center justify-between py-3 px-4 rounded-xl ${t.btnBg} ${t.btnHover} text-white text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] group-hover:shadow-[0_6px_20px_rgba(59,130,246,0.3)]`}
        >
          <span>Open Module</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 group-hover:scale-110 transition-all" />
        </div>
      </div>
    </Link>
  );
};

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 text-left flex justify-between items-center group"
      >
        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors text-sm md:text-base pr-4">
          {q}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-blue-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-2 border-l-2 border-blue-500 ml-1">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- EMBEDDABLE WIDGET WRAPPER ---
const EmbeddableWidget = ({ children }: { children: React.ReactNode }) => {
  const [copied, setCopied] = useState(false);
  const handleEmbed = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('<iframe src="https://relayschool.org/embed/widget" width="100%" height="400" frameborder="0"></iframe>');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative group/embed h-full rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col hover:border-blue-500/50">
      <div className="relative flex-1 p-0.5">
         {children}
         <button 
           onClick={handleEmbed}
           title="Copy Embed Code"
           className="absolute top-2 right-2 opacity-0 group-hover/embed:opacity-100 transition-all duration-300 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-2 z-20 hover:scale-105 active:scale-95 group/btn focus:opacity-100 focus:outline-none"
         >
           {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" /> : <Terminal className="w-3.5 h-3.5 inline group-hover/btn:text-blue-500 transition-colors" />}
           <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
              {copied ? "Copied HTML!" : "Embed"}
           </span>
         </button>
      </div>
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-auto">
         <span className="flex items-center gap-1.5"><Settings className="w-3 h-3 text-slate-400"/> Adjustable Parameters</span>
         <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500"/> IEC-Aligned Logic</span>
         <span className="flex items-center gap-1.5"><Download className="w-3 h-3 text-blue-500"/> Exportable Results</span>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---

const Dashboard = () => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedRoutes, setCompletedRoutes] = useState<string[]>([]);
  
  useEffect(() => {
     const parseProgress = () => {
         const stored = JSON.parse(localStorage.getItem('relayschool_progress') || '[]');
         setCompletedRoutes(stored);
     };
     parseProgress();
     window.addEventListener('progress_updated', parseProgress);
     return () => window.removeEventListener('progress_updated', parseProgress);
  }, []);
  
  const progressPct = Math.min(100, Math.round((completedRoutes.length / 30) * 100));

  const matchesSearch = (title: string, desc: string, useCase?: string, standard?: string) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return [title, desc, useCase || '', standard || ''].some(s => s.toLowerCase().includes(q));
  };

  const paths = [
    { id: 'grad', title: '🟢 New to Power Systems', desc: 'Learn fundamentals through guided visual simulations and structured modules.', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', scrollTo: 'section-fundamentals' },
    { id: 'working', title: '🔵 Working Engineer', desc: 'Jump directly into relay logic, system studies, and commissioning-level simulations.', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', scrollTo: 'section-protection' },
    { id: 'cases', title: '🟠 Explore Real Engineering Problems', desc: 'Practice diagnosing real faults, relay issues, and plant scenarios.', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', scrollTo: 'section-cases' }
  ];

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-12 overflow-hidden">
<SEO title="Dashboard" description="Interactive Power System simulation and engineering tool: Dashboard." url="/dashboard" />

      
      {/* 1. HERO SECTION & TICKER */}
      <div className="relative -mx-4 md:-mx-8 lg:-mx-10 mb-12">
         <div className="px-4 md:px-8 lg:px-10 pb-6">
            <GridPulseHero />
         </div>
         <ActivityTicker />
      </div>

      {/* 2. START YOUR ENGINEERING JOURNEY */}
      <div className="space-y-4">
        <div className="text-center mb-6">
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">Start Your Engineering Journey</h2>
           <p className="text-sm text-slate-500">Choose your starting point — modules will filter accordingly</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {paths.map(path => (
                <button
                   key={path.id}
                   onClick={() => {
                      setSelectedPath(selectedPath === path.id ? null : path.id);
                      const el = document.getElementById(path.scrollTo);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                   }}
                   className={`text-left p-6 rounded-2xl border transition-all duration-300 ${selectedPath === path.id ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg bg-white dark:bg-slate-800' : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:-translate-y-1 hover:shadow-lg'}`}
                >
                   <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-xl ${path.bg} ${path.color}`}>
                         <path.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{path.title}</h3>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{path.desc}</p>
                </button>
            ))}
        </div>
      </div>


      {/* GAMIFICATION & RETENTION WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
         {/* Gamification Progress Widget */}
         <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between shadow-xl relative overflow-hidden group/gamify">
            <div className="absolute -right-10 -top-10 bg-emerald-500/20 w-32 h-32 rounded-full blur-3xl group-hover/gamify:bg-emerald-500/30 transition-colors"></div>
            <div>
               <div className="flex items-center gap-2 mb-4 text-emerald-400">
                  <Award className="w-5 h-5" />
                  <span className="font-bold text-xs uppercase tracking-widest text-slate-300">Your Progress</span>
               </div>
               <div className="text-2xl font-black text-white mb-2 leading-tight">Protection Fundamentals</div>
               <p className="text-sm text-slate-400 mb-6">You've explored {completedRoutes.length} of 30 simulation modules. Keep going to earn your verified badge!</p>
               
               <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs text-slate-300 font-bold">
                     <span>Progress</span>
                     <span className="text-emerald-400">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full relative transition-all duration-1000" style={{ width: `${progressPct}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                     </div>
                  </div>
               </div>
            </div>
            <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors border border-slate-700 hover:border-slate-600">
               Share LinkedIn Badge
            </button>
         </div>

         {/* Daily Challenge Widget */}
         <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 border border-blue-500/50 flex flex-col justify-between shadow-xl relative overflow-hidden group/daily text-white">
            <div className="absolute right-0 top-0 opacity-10 group-hover/daily:scale-110 group-hover/daily:rotate-12 transition-transform duration-700">
               <Zap className="w-48 h-48" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-blue-200">
                     <Activity className="w-5 h-5 animate-pulse" />
                     <span className="font-bold text-xs uppercase tracking-widest">Daily Fault Challenge</span>
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded text-white tracking-widest uppercase">New</span>
               </div>
               <div className="text-2xl font-black mb-2 leading-tight">Grade a 33kV Substation</div>
               <p className="text-sm text-blue-100/80 mb-6">You have 3 relays in series. Achieve a 0.2s Coordination Time Interval without exceeding the transformer damage curve.</p>
            </div>
            <Link to="/tcc" className="relative z-10 w-full py-3 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-100 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-colors shadow-lg">
               <Play className="w-4 h-4" /> Start Challenge
            </Link>
         </div>

         {/* Quick Resume / Last Session */}
         <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xl relative overflow-hidden group/resume">
            <div className="absolute -left-10 -bottom-10 bg-purple-500/10 w-32 h-32 rounded-full blur-3xl group-hover/resume:bg-purple-500/20 transition-colors"></div>
            <div>
               <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
                  <Clock className="w-5 h-5" />
                  <span className="font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Pick up where you left off</span>
               </div>
               <div className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">Forensic Lab: GOOSE Storm</div>
               <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">You were analyzing a packet storm scenario with 4.2ms latency spikes. The simulation state was saved 2 hours ago.</p>
               
               <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-12 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between px-3">
                     <span className="text-xs font-bold text-slate-400">Last Action</span>
                     <span className="text-xs font-mono text-slate-600 dark:text-slate-300">Replay Attack</span>
                  </div>
               </div>
            </div>
            <Link to="/comms" className="w-full py-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
               Resume Session <ArrowRight className="w-4 h-4" />
            </Link>
         </div>
      </div>

      {/* 4. WHAT YOU'LL MASTER */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            What You'll Master
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Three pillars of modern protection engineering — all in your browser
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/tcc" className="group block">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl shadow-sm">
                  <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Protection Coordination
                </h3>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mt-0.5">
                  Selectivity · Grading · Speed
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
              Learn to grade relays, set pickup thresholds, and ensure only
              the nearest breaker trips during a <JargonTooltip text="symetrical fault" explanation="A fault involving all three phases effectively shorted together, producing the highest fault currents." /> — keeping the rest of
              the grid alive.
            </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Activity className="w-3 h-3" />
                  <span>TCC Studio · Relay Tester · Distance Lab</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
          <Link to="/comms" className="group block">
            <div className="bg-gradient-to-br from-purple-50 to-violet-50/50 dark:from-purple-950/40 dark:to-violet-950/20 rounded-2xl border border-purple-200/50 dark:border-purple-800/30 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-violet-500"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl shadow-sm">
                  <Network className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Digital Substations
                  </h3>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider mt-0.5">
                    GOOSE · Sampled Values · PTP
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                Explore <JargonTooltip text="IEC 61850 GOOSE" explanation="Generic Object Oriented Substation Event. A high-speed multicast protocol replacing hardwired trips between relays." /> messaging, Sampled Values, and real-time
                topology — the technologies replacing copper wiring in modern
                substations.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Server className="w-3 h-3" />
                  <span>Comms Hub · Digital Twin · Event Analyzer</span>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
          <Link to="/forensic" className="group block">
            <div className="bg-gradient-to-br from-red-50 to-orange-50/50 dark:from-red-950/40 dark:to-orange-950/20 rounded-2xl border border-red-200/50 dark:border-red-800/30 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl shadow-sm">
                  <Microscope className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Fault Analysis & Forensics
                  </h3>
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mt-0.5">
                    CT Saturation · Harmonics · DC Offset
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                Reconstruct protection failures, analyze <JargonTooltip text="CT Saturation" explanation="When a Current Transformer core saturates magnetically, failing to accurately reproduce primary fault current on the secondary." />, and
                study harmonic distortion — the investigative skills every
                protection engineer needs.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Forensic Lab · Failure Lab · Toolkit</span>
                </div>
                <ArrowRight className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. MODULES GRID */}
      <div className="space-y-16">
        {/* SEARCH BAR */}
        <div className="flex items-center gap-4">
           <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search simulation, relay topic, or standard…"
                className="w-full pl-11 pr-4 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold">✕</button>
              )}
           </div>
        </div>
        {/* ENGINEERING FUNDAMENTALS */}
        <div id="section-fundamentals">
          <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-3">
             <BookOpen className="w-6 h-6 text-blue-500" />
             <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Engineering Fundamentals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <ToolWidget title="Vector Lab" icon={Waves} link="/vectors" desc="Interactive phasor diagrams, symmetrical components visualization, and ABC sequence analysis." status="Phasors" theme="blue" difficulty="Basic" useCase="Visualizing unbalanced faults and phase shifts" standard="IEC 60044" isHighlighted={(!selectedPath || selectedPath === 'grad') && matchesSearch('Vector Lab', 'Interactive phasor diagrams symmetrical components', 'Visualizing unbalanced faults', 'IEC 60044')} />
             <ToolWidget title="Digital Twin" icon={Server} link="/twin" desc="Operate a real-time substation topology model, toggle breakers, and observe consequences." status="Topology" theme="teal" difficulty="Design" useCase="SCADA operation and switching sequence training" standard="IEC 61850" isHighlighted={(!selectedPath || ['grad', 'working'].includes(selectedPath)) && matchesSearch('Digital Twin', 'substation topology breakers', 'SCADA switching', 'IEC 61850')} />
          </div>
        </div>

        {/* PROTECTION & RELAY ENGINEERING */}
        <div id="section-protection">
          <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-3">
             <ShieldCheck className="w-6 h-6 text-emerald-500" />
             <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Protection & Relay Engineering</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <ToolWidget title="TCC Studio" icon={Activity} link="/tcc" desc="Plot IEC/IEEE time-overcurrent curves, set grading margins, and verify relay coordination." status="Coordination" theme="blue" difficulty="Expert" useCase="Overcurrent grading and protection selectivity" standard="IEEE C37.112 / IEC 60255" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('TCC Studio', 'overcurrent curves grading relay coordination', 'Overcurrent grading selectivity', 'IEEE C37.112 IEC 60255')} />
             <ToolWidget title="Distance Lab" icon={Radar} link="/distance" desc="Visualize impedance zones on the R-X plane. Study load encroachment and fault resistance." status="Impedance" theme="emerald" difficulty="Expert" useCase="Line protection and zone reach calculation" standard="IEEE C37.113" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('Distance Lab', 'impedance zones R-X plane encroachment fault resistance', 'Line protection zone reach', 'IEEE C37.113')} />
             <ToolWidget title="Differential Slope" icon={Waves} link="/diffslope" desc="Analyze dual-slope percentage differential characteristics and harmonic restraint." status="Differential" theme="purple" difficulty="Expert" useCase="Transformer and generator protection configuration" standard="IEEE C37.91" isHighlighted={(!selectedPath || ['working', 'cases'].includes(selectedPath)) && matchesSearch('Differential Slope', 'differential harmonic restraint transformer', 'Transformer generator protection', 'IEEE C37.91')} />
             <ToolWidget title="Symmetrical Components" icon={RefreshCw} link="/symcomp" desc="Calculate positive, negative, and zero sequence networks for unbalanced faults." status="Sequence Networks" theme="indigo" difficulty="Design" useCase="Fault current calculation and directional relaying" standard="IEC 60909" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('Symmetrical Components', 'sequence networks unbalanced faults', 'Fault current directional relaying', 'IEC 60909')} />
             <ToolWidget title="Relay Tester" icon={ClipboardCheck} link="/tester" desc="Perform simulated secondary injection tests. Generate ramp and pulse signals." status="Injection" theme="cyan" difficulty="Design" useCase="Commissioning and routine relay maintenance testing" standard="IEC 60255" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('Relay Tester', 'secondary injection ramp pulse', 'Commissioning relay maintenance', 'IEC 60255')} />
             <ToolWidget title="Overcurrent (50/51)" icon={Activity} link="/overcurrent" desc="Explore time-overcurrent and instantaneous protection principles with interactive TCC graphs." status="50/51" theme="red" difficulty="Basic" useCase="Feeder and transformer overcurrent protection" standard="IEEE C37.112" isHighlighted={(!selectedPath || ['working', 'grad'].includes(selectedPath)) && matchesSearch('Overcurrent', 'overcurrent instantaneous fault', 'Feeder protection', 'IEEE C37.112')} />
             <ToolWidget title="Line Diff (87L)" icon={GitMerge} link="/line-diff" desc="Analyze dual-slope percentage differential characteristics for transmission lines." status="87L" theme="purple" difficulty="Expert" useCase="Transmission line unit protection" standard="IEEE C37.113" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('Line Differential', 'line differential dual slope', 'Transmission protection', 'IEEE C37.113')} />
             <ToolWidget title="Impedance (21)" icon={Radar} link="/impedance-tester" desc="Test mho circles and understand impedance reach for line protection relays." status="21" theme="emerald" difficulty="Expert" useCase="Distance relay testing and reach visualization" standard="IEEE C37.113" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('Impedance Tester', 'mho circle distance relay reach', 'Distance testing', 'IEEE C37.113')} />
             <ToolWidget title="Logic Sandbox" icon={Cpu} link="/logic" desc="Build boolean protection logic with AND/OR/NOT gates and visualize live state changes." status="Boolean Logic" theme="amber" difficulty="Basic" useCase="Custom protection schemes and interlocking" standard="IEC 61131-3" isHighlighted={(!selectedPath || ['working', 'grad'].includes(selectedPath)) && matchesSearch('Logic Sandbox', 'boolean protection logic AND OR NOT gates', 'Custom protection interlocking', 'IEC 61131-3')} />
          </div>
        </div>

        {/* SYSTEM STUDIES & CALCULATIONS */}
        <div>
          <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-3">
             <Network className="w-6 h-6 text-purple-500" />
             <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">System Studies & Calculations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <ToolWidget title="Substation Builder" icon={Layers} link="/builder" desc="Drag-and-drop SLD editor with live breadth-first search load flow simulation." status="SLD Design" theme="blue" difficulty="Design" useCase="Substation layout planning and contingency analysis" standard="IEC 61936" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('Substation Builder', 'SLD drag-and-drop load flow', 'Substation layout contingency', 'IEC 61936')} />
             <ToolWidget title="Fast Bus Transfer" icon={FastForward} link="/fbts" desc="Analyze phase-angle drift, residual voltage decay, and torque transients." status="Motor Transfer" theme="indigo" difficulty="Expert" useCase="Industrial continuous process plant reliability" standard="IEEE C37.96" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('Fast Bus Transfer', 'phase-angle drift residual voltage motor', 'Industrial process plant', 'IEEE C37.96')} />
             <ToolWidget title="Power Calculators" icon={Calculator} link="/calculators" desc="Step-by-step impedance base conversions and per-unit math solvers." status="Calculators" theme="slate" difficulty="Basic" useCase="Daily engineering math and per-unit conversions" standard="IEEE 399 / 141" isHighlighted={(!selectedPath || ['working', 'grad'].includes(selectedPath)) && matchesSearch('Power Calculators', 'impedance base conversion per-unit math', 'Daily engineering math', 'IEEE 399 141')} />
             <ToolWidget title="SC Calculator" icon={Calculator} link="/sc-calc" desc="Perform standardized IEC 60909 fault calculations." status="Short-Circuit" theme="blue" difficulty="Expert" useCase="System level fault current calculations" standard="IEC 60909" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('SC Calculator', 'short circuit fault current', 'Network fault levels', 'IEC 60909')} />
             <ToolWidget title="Standards Index" icon={BookOpen} link="/standards" desc="Comprehensive search through key IEEE and IEC protection standards." status="References" theme="slate" difficulty="Basic" useCase="Literature review and compliance checks" standard="" isHighlighted={(!selectedPath || ['working', 'grad'].includes(selectedPath)) && matchesSearch('Standards Index', 'standards IEEE IEC compliance', 'Literature review', '')} />
             <ToolWidget title="Engineer Toolkit" icon={Calculator} link="/tools" desc="Quick engineering calculators for battery sizing, cable limits, and CT burden." status="Toolkit" theme="slate" difficulty="Design" useCase="Equipment sizing and specification checks" standard="IEEE 485 / IEC 60949" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('Engineer Toolkit', 'battery sizing cable CT burden', 'Equipment sizing specification', 'IEEE 485 IEC 60949')} />
          </div>
        </div>

        {/* DIGITAL & FORENSIC ENGINEERING */}
        <div>
          <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-3">
             <Microscope className="w-6 h-6 text-red-500" />
             <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Digital & Forensic Engineering</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <ToolWidget title="Comms Hub" icon={Network} link="/comms" desc="Inspect GOOSE and Sampled Values packets. Simulate network storms and latency gaps." status="IEC 61850" theme="purple" difficulty="Expert" useCase="Digital substation traffic analysis and troubleshooting" standard="IEC 61850-9-2" isHighlighted={(!selectedPath || selectedPath === 'working') && matchesSearch('Comms Hub', 'GOOSE Sampled Values network storms latency', 'Digital substation traffic', 'IEC 61850-9-2')} />
             <ToolWidget title="Forensic Lab" icon={Microscope} link="/forensic" desc="Analyze COMTRADE fault records with multi-user WebRTC synchronization." status="Analysis" theme="red" difficulty="Expert" useCase="Post-mortem fault data decoding and team review" standard="IEEE C37.111" isHighlighted={(!selectedPath || ['working', 'cases'].includes(selectedPath)) && matchesSearch('Forensic Lab', 'COMTRADE fault records WebRTC', 'Post-mortem fault data', 'IEEE C37.111')} />
             <ToolWidget title="Event Analyzer" icon={Activity} link="/events" desc="Parse ASCII and BINARY COMTRADE files to plot high-resolution oscillography." status="Oscillography" theme="amber" difficulty="Design" useCase="Waveform inspection and harmonic extraction" standard="IEEE C37.111" isHighlighted={(!selectedPath || ['working', 'cases'].includes(selectedPath)) && matchesSearch('Event Analyzer', 'ASCII BINARY COMTRADE oscillography', 'Waveform harmonic extraction', 'IEEE C37.111')} />
             <ToolWidget title="Failure Lab" icon={AlertTriangle} link="/failure" desc="Reconstruct CT saturation, DC offset, and harmonic restraint failures physics." status="Root Cause" theme="amber" difficulty="Design" useCase="Understanding relay misoperations and blinding" standard="IEEE C37.110" isHighlighted={(!selectedPath || ['cases', 'grad'].includes(selectedPath)) && matchesSearch('Failure Lab', 'CT saturation DC offset harmonic restraint', 'relay misoperations blinding', 'IEEE C37.110')} />
             <ToolWidget title="Case Studies" icon={BookOpen} link="/cases" desc="Interactive root-cause analysis of real-world grid blackouts based on SOE logs." status="Case Study" theme="slate" difficulty="Basic" useCase="Learning from historical industry failures" standard="NERC PRC" isHighlighted={(!selectedPath || ['cases', 'grad'].includes(selectedPath)) && matchesSearch('Case Studies', 'root-cause grid blackouts SOE logs', 'historical industry failures', 'NERC PRC')} />
          </div>
        </div>
      </div>

      {/* 4. TRY REAL ENGINEERING CASES */}
      <div id="section-cases" className="space-y-6 pt-12 border-t border-slate-200 dark:border-slate-800">
        <div className="mb-2">
           <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Try Real Engineering Cases</h2>
           <p className="text-slate-500 text-lg">Each case is a scenario, not a lesson. Diagnose faults like you would in the field.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Link to="/failure" className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm hover:shadow-xl transition-all h-full">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
              <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">Relay Didn't Trip on Time</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 leading-relaxed">Investigate CT saturation, pickup error, and coordination issues in a simulated fault scenario.</p>
              <div className="text-red-500 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">Start Diagnosis <ArrowRight className="w-4 h-4" /></div>
           </Link>
           
           <Link to="/diffslope" className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm hover:shadow-xl transition-all h-full">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Zap className="w-6 h-6 text-amber-500" /></div>
              <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">Transformer Energization Problem</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 leading-relaxed">Simulate inrush vs differential protection behaviour under various energization conditions.</p>
              <div className="text-amber-500 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">Analyze Differential <ArrowRight className="w-4 h-4" /></div>
           </Link>
           
           <Link to="/symcomp" className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm hover:shadow-xl transition-all h-full">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Calculator className="w-6 h-6 text-blue-500" /></div>
              <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">Perform a Short Circuit Study</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 leading-relaxed">Understand how real study tools calculate fault levels step-by-step using IEC 60909 logic.</p>
              <div className="text-blue-500 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">Calculate Faults <ArrowRight className="w-4 h-4" /></div>
           </Link>
        </div>
      </div>



      {/* 5. ENGINEERING FUNDAMENTALS */}
      <div className="space-y-8 pt-12 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" /> Engineering
              Fundamentals
            </h2>
            <p className="text-slate-500 mt-2 max-w-2xl text-lg">
              Master the physics behind the protection. These concepts form the
              bedrock of every safe power system.
            </p>
          </div>
          <Link
            to="/academy"
            className="text-blue-600 font-bold hover:underline flex items-center gap-1"
          >
            View Full Curriculum <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {KNOWLEDGE_SNIPPETS.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${item.color}`}
              >
                <item.icon className="w-32 h-32" />
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6">
                  <span
                    className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full ${item.bg} ${item.color}`}
                  >
                    {item.tag}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </h3>
                </div>

                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {item.description}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {item.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <div
                        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${item.color.replace("text-", "bg-")}`}
                      ></div>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: b.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="text-slate-900 dark:text-white">$1</strong>',
                          ),
                        }}
                      />
                    </li>
                  ))}
                </ul>

                <Link
                  to={item.link}
                  className={`w-full py-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all group-hover:bg-slate-50 dark:group-hover:bg-slate-800 ${item.border} ${item.color}`}
                >
                  {item.linkText} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. TRUST & CREDIBILITY STRIP */}
      <div className="bg-slate-900 dark:bg-slate-950 border-y border-slate-800 py-12 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] [background-size:20px_20px]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
           <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-wider">Built for Real Engineering Practice</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              <div className="flex items-start gap-3">
                 <span className="text-emerald-400 text-lg mt-0.5">✔</span>
                 <p className="text-slate-300 text-sm leading-relaxed">Concepts aligned with IEC engineering logic</p>
              </div>
              <div className="flex items-start gap-3">
                 <span className="text-emerald-400 text-lg mt-0.5">✔</span>
                 <p className="text-slate-300 text-sm leading-relaxed">Designed for plant engineers, consultants, and students</p>
              </div>
              <div className="flex items-start gap-3">
                 <span className="text-emerald-400 text-lg mt-0.5">✔</span>
                 <p className="text-slate-300 text-sm leading-relaxed">Helps in relay settings, audits, and commissioning understanding</p>
              </div>
              <div className="flex items-start gap-3">
                 <span className="text-emerald-400 text-lg mt-0.5">✔</span>
                 <p className="text-slate-300 text-sm leading-relaxed">Focus on practical simulations, not just theory</p>
              </div>
           </div>
        </div>

        {/* ADVANCED PROTECTION SIMULATORS */}
        <div>
          <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-3">
             <Zap className="w-6 h-6 text-rose-500" />
             <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Advanced Protection Simulators</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <ToolWidget title="Autorecloser (79)" icon={RefreshCw} link="/autorecloser" desc="Simulate multi-shot autoreclosing logic with dead time, lockout, and fuse coordination." status="Reclosing" theme="emerald" difficulty="Design" useCase="Feeder restoration and transient fault clearing" standard="IEEE C37.104" isHighlighted={matchesSearch('Autorecloser', 'reclosing dead time lockout', 'Feeder restoration', 'IEEE C37.104')} />
             <ToolWidget title="Synchrocheck (25)" icon={Gauge} link="/synchrocheck" desc="Visualize voltage, phase angle, and frequency slip for breaker closing." status="Synchronizing" theme="blue" difficulty="Expert" useCase="Generator and tie-line paralleling" standard="IEEE C37.118" isHighlighted={matchesSearch('Synchrocheck', 'voltage phase angle frequency slip', 'Generator paralleling', 'IEEE C37.118')} />
             <ToolWidget title="Transformer (87T)" icon={Zap} link="/transformer-protection" desc="Differential protection with inrush restraint, through-fault, and tap mismatch." status="87T" theme="amber" difficulty="Expert" useCase="Transformer commissioning and relay settings" standard="IEEE C37.91" isHighlighted={matchesSearch('Transformer Protection', 'differential inrush restraint', 'Transformer commissioning', 'IEEE C37.91')} />
             <ToolWidget title="Frequency (81)" icon={Activity} link="/frequency-protection" desc="UFLS schemes with multi-stage tripping, ROCOF, and frequency decay." status="UFLS" theme="red" difficulty="Expert" useCase="Load shedding and frequency stability" standard="IEEE C37.117" isHighlighted={matchesSearch('Frequency Protection', 'UFLS ROCOF frequency decay', 'Frequency stability', 'IEEE C37.117')} />
             <ToolWidget title="Power Swing (78)" icon={Waves} link="/power-swing" desc="R-X impedance trajectory with inner/outer blinders for PSB and OOS." status="PSB/OOS" theme="purple" difficulty="Expert" useCase="Stability protection and power swing blocking" standard="IEEE PSRC WG D6" isHighlighted={matchesSearch('Power Swing', 'impedance blinder PSB OOS', 'Power swing blocking', 'IEEE PSRC')} />
             <ToolWidget title="CT/VT Calculator" icon={Settings} link="/ct-vt" desc="CT burden, knee-point voltage, accuracy class, and VT ratio sizing." status="CT/VT" theme="teal" difficulty="Design" useCase="Instrument transformer specification" standard="IEEE C57.13 / IEC 61869" isHighlighted={matchesSearch('CT VT Calculator', 'burden knee-point accuracy', 'Instrument transformer', 'IEEE C57.13')} />
             <ToolWidget title="Ground Fault" icon={AlertTriangle} link="/ground-fault" desc="Phase fault injection, residual current analysis, and directional ground elements." status="50N/67N" theme="amber" difficulty="Design" useCase="Ground protection settings" standard="IEEE C37.112" isHighlighted={matchesSearch('Ground Fault', 'residual current directional ground', 'Ground protection', 'IEEE C37.112')} />
             <ToolWidget title="Motor Protection" icon={Cpu} link="/motor-protection" desc="Thermal replica model, locked rotor detection, and starts-per-hour limiting." status="49/66" theme="orange" difficulty="Design" useCase="Motor protection relay coordination" standard="IEEE C37.96" isHighlighted={matchesSearch('Motor Protection', 'thermal locked rotor starts', 'Motor protection', 'IEEE C37.96')} />
             <ToolWidget title="Per-Unit Calculator" icon={Calculator} link="/per-unit" desc="Convert impedance, voltage, current to per-unit with base change." status="Per-Unit" theme="indigo" difficulty="Basic" useCase="Short-circuit studies" standard="IEEE 141 / IEC 60909" isHighlighted={matchesSearch('Per-Unit', 'impedance base conversion', 'Short-circuit', 'IEEE 141')} />
             <ToolWidget title="Breaker Failure (50BF)" icon={Timer} link="/breaker-failure" desc="BF timer sequence with current detection and backup trip logic." status="50BF" theme="red" difficulty="Expert" useCase="Breaker failure scheme design" standard="IEEE C37.119" isHighlighted={matchesSearch('Breaker Failure', 'BF timer current detection', 'Breaker failure', 'IEEE C37.119')} />
             <ToolWidget title="Voltage Regulator" icon={TrendingUp} link="/voltage-regulator" desc="OLTC tap changer sequencing with deadband and voltage recovery." status="OLTC" theme="emerald" difficulty="Design" useCase="Voltage regulation and OLTC coordination" standard="ANSI C84.1" isHighlighted={matchesSearch('Voltage Regulator', 'OLTC tap changer deadband', 'Voltage regulation', 'ANSI C84.1')} />
             <ToolWidget title="Busbar Protection (87B)" icon={Layers} link="/busbar-protection" desc="Multi-circuit differential with bus fault vs external fault discrimination." status="87B" theme="amber" difficulty="Expert" useCase="Bus differential relay settings" standard="IEEE C37.234" isHighlighted={matchesSearch('Busbar Protection', 'bus differential fault', 'Bus relay settings', 'IEEE C37.234')} />
             <ToolWidget title="Generator Protection" icon={Zap} link="/generator-protection" desc="LOF (40), reverse power (32), negative sequence (46), and stator ground (64)." status="Gen Suite" theme="blue" difficulty="Expert" useCase="Generator protection commissioning" standard="IEEE C37.102" isHighlighted={matchesSearch('Generator Protection', 'LOF reverse power negative sequence', 'Generator commissioning', 'IEEE C37.102')} />
          </div>
        </div>
      </div>

      {/* 7. MANIFESTO / WHY */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl mt-12">
        {/* Abstract Background */}
        <div className="absolute inset-0 opacity-20">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad1)" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  style={{ stopColor: "#3b82f6", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "#8b5cf6", stopOpacity: 1 }}
                />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest w-fit mb-6">
              Our Mission
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
              Democratizing <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Power Engineering
              </span>
            </h2>
            <div className="space-y-6 text-lg text-slate-400 leading-relaxed">
              <p>
                Professional simulation software is expensive, clunky, and
                locked behind hardware keys. This creates a barrier for students
                and engineers who just want to learn.
              </p>
              <p>
                RelaySchool breaks this barrier. We combine{" "}
                <strong>gaming-grade graphics</strong> with{" "}
                <strong>IEEE-standard math</strong> to create a learning sandbox
                that is accessible to everyone, everywhere.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/50 backdrop-blur-sm p-8 md:p-12 lg:p-16 border-t lg:border-t-0 lg:border-l border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {VALUE_PROPS.map((prop, i) => (
                <div key={i} className="space-y-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 shadow-lg">
                    <prop.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white text-lg">{prop.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {prop.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7. FAQ SECTION */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl w-fit mb-4">
              <HelpCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Technical FAQ
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Common queries about Protection Engineering, Simulation Physics,
              and Platform Capabilities.
            </p>
          </div>

          <div className="md:w-2/3">
            <div className="space-y-2">
              {FAQ_DATA.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
