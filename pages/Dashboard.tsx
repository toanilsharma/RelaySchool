
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Zap, Layers, BookOpen, Clock, Cpu, RefreshCw, AlertCircle, ClipboardCheck, Network, Trophy, Target, ArrowRight, HelpCircle, AlertTriangle, Calculator, Gauge, Scale, GitMerge, PieChart, Radar, GraduationCap, Star, ShieldCheck, Microscope, Terminal, Battery, Download, CheckCircle2, ChevronDown, ChevronUp, Server, Wifi, Database, Power, MousePointer2, ToggleRight, ToggleLeft, Waves, Globe, Eye, FastForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONSTANTS ---

const KNOWLEDGE_SNIPPETS = [
    {
        id: 'coord',
        tag: 'CORE CONCEPTS',
        title: "Protection Coordination",
        icon: Scale,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-100 dark:border-blue-800",
        description: "Coordination is the art of isolating faults while keeping the rest of the grid alive. It requires balancing sensitivity with stability.",
        bullets: [
            "**Selectivity:** Only the closest breaker should trip.",
            "**Speed:** Clear faults fast to minimize I²t damage.",
            "**Stability:** Ride through motor starting currents."
        ],
        link: "/tcc",
        linkText: "Open TCC Studio"
    },
    {
        id: 'iec61850',
        tag: 'MODERN GRID',
        title: "Digital Substations",
        icon: Network,
        color: "text-purple-500",
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-100 dark:border-purple-800",
        description: "The shift from copper to fiber. IEC 61850 replaces physical wires with Ethernet packets, introducing new engineering challenges.",
        bullets: [
            "**GOOSE:** Replaces hardwired trip signals (<4ms latency).",
            "**Sampled Values:** CTs/VTs digitized at source.",
            "**PTP:** Microsecond time sync is critical."
        ],
        link: "/comms",
        linkText: "Analyze Packets"
    },
    {
        id: 'forensics',
        tag: 'ROOT CAUSE',
        title: "Forensic Analysis",
        icon: Microscope,
        color: "text-red-500",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-100 dark:border-red-800",
        description: "When protection fails, physics is usually the culprit. Understanding magnetic flux and harmonic distortion is key to prevention.",
        bullets: [
            "**CT Saturation:** DC offset blinds relays.",
            "**Harmonics:** Inrush looks like a fault.",
            "**Distortion:** Waveform clipping reduces RMS."
        ],
        link: "/failure",
        linkText: "Reconstruct Failure"
    }
];

const VALUE_PROPS = [
    { title: "Browser Native", desc: "No installs. No dongles. Runs on any device.", icon: Globe },
    { title: "Physics Engine", desc: "Real-time vector math & thermal integrals.", icon: Cpu },
    { title: "Offline First", desc: "PWA enabled. Works in the field without signal.", icon: Wifi },
    { title: "Visual Learning", desc: "See the invisible flux, waves, and packets.", icon: Eye },
];

const FAQ_DATA = [
    { q: "What is RelaySchool?", a: "RelaySchool is an advanced, browser-based simulation suite for Power System Protection engineering. It provides interactive labs for TCC coordination, IEC 61850 protocol analysis, and forensic fault reconstruction without requiring expensive desktop software." },
    { q: "Is this tool suitable for professional coordination studies?", a: "RelaySchool is an educational platform designed for training and concept verification. While it uses physics-accurate formulas (IEC 60255/IEEE C37.112), it should not be used as the sole tool for safety-critical settings on live equipment. Always verify with licensed professional software." },
    { q: "How does the Digital Twin simulation work?", a: "The Digital Twin module uses a real-time topology processor. It analyzes the connectivity of nodes (Breakers, Busbars, Transformers) 60 times per second to calculate load flow, energization status, and fault current propagation based on your switching actions." },
    { q: "Can I analyze IEC 61850 GOOSE packets?", a: "Yes. The Comms Hub module features a packet generator and inspector. You can simulate GOOSE storms, check VLAN priority tagging, and visualize the impact of network latency on protection clearing times." },
    { q: "What is the difference between ANSI and IEC curves?", a: "ANSI (IEEE) and IEC standards define different mathematical formulas for Time-Overcurrent protection. IEC curves (Standard, Very, Extremely Inverse) are asymptotic at M=1, whereas ANSI curves have a different slope characteristic. Our TCC Studio allows you to compare both." },
    { q: "How do I calculate CT Saturation?", a: "The Failure Lab and Engineer Toolkit provide calculators for CT Burden and Saturation voltage. You can input the CT Class (e.g., 5P20), rated burden, and lead resistance to verify if the CT will saturate during a maximum fault." },
    { q: "Does the application work offline?", a: "Yes. RelaySchool is a Progressive Web App (PWA) built with offline-first architecture. Once loaded, all calculations, simulations, and interactive graphs run entirely in your browser's local JavaScript engine." },
    { q: "Can I export simulation data?", a: "Yes. The Event Analyzer allows you to export fault records in a simulated COMTRADE format (CFG/DAT), and the Comms Hub allows PCAP export for Wireshark analysis." },
    { q: "What is 'Differential Slope' protection?", a: "Differential protection (ANSI 87) operates on the principle that current entering a zone must equal current leaving. The 'Slope' characteristic increases the restraint setting as through-current increases, preventing false trips due to CT errors during heavy external faults." },
    { q: "Do I need an account to save projects?", a: "Currently, RelaySchool uses your browser's Local Storage to persist your settings, relay curves, and logic diagrams. No login is required, and your data never leaves your device." }
];

// --- INTERACTIVE WIDGETS ---

const MiniTCCWidget = () => {
    const [amps, setAmps] = useState(500);
    // IEC SI: t = TMS * 0.14 / ((I/Is)^0.02 - 1)
    // Settings: Is=100A, TMS=0.1
    const t = (0.1 * 0.14) / (Math.pow(amps/100, 0.02) - 1);
    const yPos = Math.max(10, Math.min(90, 90 - (t * 20))); // Approx scale
    const xPos = Math.min(90, (amps / 1000) * 100);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Activity className="w-3 h-3"/> Quick TCC Check</div>
                <div className="text-xs font-mono font-bold text-blue-600">{t.toFixed(2)}s</div>
            </div>
            <div className="flex-1 relative border-l border-b border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg mb-3 overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M 10 10 Q 30 80 90 90" fill="none" stroke="#3b82f6" strokeWidth="2" />
                </svg>
                <div className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg transition-all duration-75" style={{ left: `${xPos}%`, bottom: `${100-yPos}%`, transform: 'translate(-50%, 50%)' }}></div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500">Inject:</span>
                <input type="range" min="150" max="1000" step="10" value={amps} onChange={(e) => setAmps(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <span className="text-[10px] font-mono w-10 text-right">{amps}A</span>
            </div>
        </div>
    );
};

const MiniTwinWidget = () => {
    const [breaker, setBreaker] = useState(true);
    return (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Server className="w-3 h-3"/> Topology Sim</div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${breaker ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {breaker ? 'POWER ON' : 'DE-ENERGIZED'}
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center relative bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`h-1 w-full transition-colors duration-300 ${breaker ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                </div>
                <div className="absolute left-4 w-8 h-8 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded flex items-center justify-center z-10 text-[8px] font-bold">GRID</div>
                <button onClick={() => setBreaker(!breaker)} className={`relative z-10 w-8 h-8 rounded border-2 flex items-center justify-center transition-all hover:scale-110 ${breaker ? 'bg-red-500 border-red-600 text-white' : 'bg-green-500 border-green-600 text-white'}`}>
                    <Power className="w-4 h-4" />
                </button>
                <div className="absolute right-4 w-8 h-8 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center z-10 text-[8px] font-bold">LOAD</div>
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
        const interval = setInterval(() => setAngle(prev => (prev + 2) % 360), 50);
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
                <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Radar className="w-3 h-3"/> Phasor Monitor</div>
                <div className="text-[10px] font-mono text-purple-500 animate-pulse">Live</div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    {/* Grid lines */}
                    <line x1="50" y1="50" x2="90" y2="50" stroke="#e2e8f0" className="dark:stroke-slate-800" strokeWidth="1" />
                    <line x1="50" y1="50" x2="50" y2="10" stroke="#e2e8f0" className="dark:stroke-slate-800" strokeWidth="1" />
                    
                    {/* Phase A */}
                    <line x1="50" y1="50" x2={50 + magA * Math.cos(angle * Math.PI/180)} y2={50 + magA * Math.sin(angle * Math.PI/180)} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                    {/* Phase B */}
                    <line x1="50" y1="50" x2={50 + magB * Math.cos((angle+120) * Math.PI/180)} y2={50 + magB * Math.sin((angle+120) * Math.PI/180)} stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
                    {/* Phase C */}
                    <line x1="50" y1="50" x2={50 + magC * Math.cos((angle+240) * Math.PI/180)} y2={50 + magC * Math.sin((angle+240) * Math.PI/180)} stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {/* Center dot */}
                <div className="absolute w-1 h-1 bg-slate-900 dark:bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] font-bold text-slate-500">Unbalance:</span>
                <input type="range" min="0" max="100" value={unbalance} onChange={(e) => setUnbalance(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            </div>
            
            <div className="mt-1 flex justify-between text-[8px] font-mono text-slate-400">
                <span>IA: 100%</span>
                <span>IB: {(100-unbalance).toFixed(0)}%</span>
                <span>IC: {(100-unbalance).toFixed(0)}%</span>
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
                <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Cpu className="w-3 h-3"/> Logic Interlock</div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${out ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {out ? 'CLOSED' : 'OPEN'}
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 gap-2 relative overflow-hidden">
                <div className="flex flex-col gap-4 z-10">
                    <button onClick={() => setInA(!inA)} className={`w-8 h-6 rounded border-2 flex items-center justify-center transition-colors ${inA ? 'border-blue-500 bg-blue-100' : 'border-slate-300 bg-slate-100'}`}>A</button>
                    <button onClick={() => setInB(!inB)} className={`w-8 h-6 rounded border-2 flex items-center justify-center transition-colors ${inB ? 'border-blue-500 bg-blue-100' : 'border-slate-300 bg-slate-100'}`}>B</button>
                </div>
                <div className="h-full w-px bg-slate-200 dark:bg-slate-800"></div>
                <div className="z-10 flex items-center gap-1">
                    <div className="w-8 h-8 border-2 border-slate-700 dark:border-slate-400 rounded-l-md rounded-r-full flex items-center justify-center text-[10px] font-bold">&</div>
                    <div className={`w-4 h-4 rounded-full ${out ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-300 dark:bg-slate-700'} transition-all`}></div>
                </div>
                {/* Wires */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <path d="M 40 30 L 60 50 M 40 70 L 60 50" stroke="currentColor" strokeWidth="2" />
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
    const path = `M 0 ${h/2} ` + Array.from({length: points+1}, (_, i) => {
        const x = (i/points) * w;
        const rad = (i/points) * Math.PI * 2;
        const y = h/2 + Math.sin(rad) * 15 + Math.sin(rad*3) * (distortion * 0.5);
        return `L ${x} ${y}`;
    }).join(' ');

    return (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Waves className="w-3 h-3"/> Harmonic Inj.</div>
                <div className="text-[10px] font-mono font-bold text-amber-500">{distortion}% THD</div>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden flex items-center justify-center">
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full p-2" preserveAspectRatio="none">
                    <path d={path} fill="none" stroke={distortion > 20 ? '#ef4444' : '#3b82f6'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
            </div>
            <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] font-bold text-slate-500">Noise:</span>
                <input type="range" min="0" max="50" value={distortion} onChange={(e) => setDistortion(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
            </div>
        </div>
    );
};

const MiniDistanceWidget = () => {
    const [dist, setDist] = useState(80);
    const trip = dist < 50;

    return (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Target className="w-3 h-3"/> Zone Reach</div>
                <div className={`text-[10px] font-bold ${trip ? 'text-red-500' : 'text-green-500'}`}>{trip ? 'TRIP Z1' : 'NORMAL'}</div>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 relative flex items-center justify-center overflow-hidden">
                <div className={`w-24 h-24 rounded-full border-2 border-dashed ${trip ? 'border-red-500 bg-red-500/10' : 'border-slate-300 dark:border-slate-700'} flex items-center justify-center relative transition-all`}>
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800 absolute"></div>
                    <div className="h-full w-px bg-slate-200 dark:bg-slate-800 absolute"></div>
                    {/* Impedance Dot */}
                    <div 
                        className={`w-3 h-3 rounded-full absolute transition-all duration-300 shadow-md ${trip ? 'bg-red-600' : 'bg-blue-500'}`}
                        style={{ top: '30%', left: `${dist}%` }}
                    ></div>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] font-bold text-slate-500">Fault Dist:</span>
                <input type="range" min="20" max="100" value={dist} onChange={(e) => setDist(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            </div>
        </div>
    );
};

// --- CORE DASHBOARD COMPONENTS ---

const LiveMetric = ({ label, value, unit, trend, color }: any) => (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
        <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</div>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {value} <span className="text-xs text-slate-400 font-normal">{unit}</span>
            </div>
        </div>
        {trend && (
            <div className={`text-xs font-bold px-2 py-1 rounded ${color}`}>
                {trend}
            </div>
        )}
    </div>
);

const GridPulseHero = () => {
    const [baseFreq, setBaseFreq] = useState(50);
    const [freq, setFreq] = useState(50.000);
    
    useEffect(() => {
        const i = setInterval(() => {
            setFreq(baseFreq + (Math.random() - 0.5) * 0.035);
        }, 800);
        return () => clearInterval(i);
    }, [baseFreq]);

    const points = 60;
    const width = 600;
    const height = 80;
    const pathData = `M 0 ${height/2} ` + Array.from({length: points}, (_, i) => {
        const x = (width / points) * i;
        const y = height/2 + Math.sin(i * 0.4 + Date.now()/400) * 25;
        return `L ${x} ${y}`;
    }).join(' ');

    return (
        <div className="w-full bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 relative text-white group">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>
            
            <div className="relative z-10 p-8 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="space-y-6 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        System Operational
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                        Advanced Simulation for <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Protection Engineers</span>
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Train on physics-accurate models of Power Systems, IEC 61850 Networks, and Relay Logic. 
                        No cloud latency. No license fees. Just pure engineering.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <Link to="/tcc" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                            <Activity className="w-4 h-4"/> Launch TCC Studio
                        </Link>
                        <Link to="/twin" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl font-bold transition-all flex items-center gap-2 backdrop-blur-sm">
                            <Server className="w-4 h-4"/> Digital Twin
                        </Link>
                    </div>
                </div>

                {/* Live Monitor Visual */}
                <div className="flex-1 w-full max-w-md bg-slate-950/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6 shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grid Interconnection</span>
                        <div className="flex items-center gap-2">
                            <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-emerald-500 font-mono font-bold">CONNECTED</span>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <span className="text-sm text-slate-400 font-medium">Frequency</span>
                            <div className="flex flex-col items-end">
                                <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 mb-1">
                                    <button onClick={() => setBaseFreq(50)} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${baseFreq === 50 ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>50Hz</button>
                                    <button onClick={() => setBaseFreq(60)} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${baseFreq === 60 ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>60Hz</button>
                                </div>
                                <div className="text-right">
                                    <span className="font-mono text-4xl font-black text-white tracking-tighter">{freq.toFixed(3)}</span>
                                    <span className="text-sm text-slate-500 ml-1 font-bold">Hz</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-20 w-full bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden relative">
                             <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
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
                                <div className="text-[10px] text-slate-500 uppercase font-bold">PTP Drift</div>
                                <div className="text-xs font-mono text-emerald-400 mt-1">0.002ms</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg text-center">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">GOOSE Latency</div>
                                <div className="text-xs font-mono text-blue-400 mt-1">3.4ms</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolWidget = ({ title, icon: Icon, link, desc, status }: any) => (
    <Link to={link} className="block group h-full">
        <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg hover:border-blue-500/30 hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {status}
                </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed line-clamp-2">
                {desc}
            </p>
            
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                    <span>Launch Module</span>
                    <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    </Link>
);

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-4 text-left flex justify-between items-center group"
            >
                <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors text-sm md:text-base pr-4">{q}</span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
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

// --- MAIN DASHBOARD ---

const Dashboard = () => {
  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-12">
        
        {/* 1. HERO SECTION */}
        <GridPulseHero />

        {/* 2. TELEMETRY STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <LiveMetric label="Processor Load" value="14" unit="%" trend="Stable" color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" />
            <LiveMetric label="Active Nodes" value="24" unit="IEDs" trend="Connected" color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
            <LiveMetric label="Fault History" value="8" unit="Events" trend="Archived" color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" />
            <LiveMetric label="Substation Temp" value="24.5" unit="°C" trend="Optimal" color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" />
        </div>

        {/* 3. INTERACTIVE WORKBENCH */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5 text-blue-600" /> Interactive Workbench
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">Live Preview</span>
            </div>
            {/* Grid of Mini Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <MiniTCCWidget />
                <MiniTwinWidget />
                <MiniVectorWidget />
                <MiniLogicWidget />
                <MiniHarmonicWidget />
                <MiniDistanceWidget />
            </div>
        </div>

        {/* 4. MODULES GRID */}
        <div>
            <div className="flex items-center gap-2 mb-6">
                <Layers className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Core Simulation Modules</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ToolWidget 
                    title="TCC Studio" 
                    icon={Activity} 
                    link="/tcc"
                    desc="Coordination Study & Grading Margins. IEC/ANSI Curve Plotter with Audit logic."
                    status="Active"
                />
                <ToolWidget 
                    title="Fast Bus (FBTS)" 
                    icon={FastForward} 
                    link="/fbts"
                    desc="Induction Motor Fast Transfer simulation. Phase-drift and Torque stress analysis."
                    status="New"
                />
                <ToolWidget 
                    title="Digital Twin" 
                    icon={Server} 
                    link="/twin"
                    desc="Real-time Substation Topology & Load Flow. Simulate breaker operations."
                    status="Active"
                />
                <ToolWidget 
                    title="Comms Hub" 
                    icon={Network} 
                    link="/comms"
                    desc="IEC 61850 GOOSE & SV Analyzer. Deep packet inspection and storm simulation."
                    status="Traffic OK"
                />
                <ToolWidget 
                    title="Forensic Lab" 
                    icon={Microscope} 
                    link="/forensic"
                    desc="COMTRADE Fault Analysis. Oscillography, Phasors, and Harmonic Spectrum."
                    status="Standby"
                />
                <ToolWidget 
                    title="Relay Tester" 
                    icon={ClipboardCheck} 
                    link="/tester"
                    desc="Secondary Injection Set. Pulse and Ramp testing for Pickup verification."
                    status="Injecting"
                />
                <ToolWidget 
                    title="Failure Lab" 
                    icon={AlertTriangle} 
                    link="/failure"
                    desc="Reconstruct catastrophic failures. Understand CT Saturation and DC Offset."
                    status="Education"
                />
                <ToolWidget 
                    title="Distance Lab" 
                    icon={Radar} 
                    link="/distance"
                    desc="Impedance Protection (ANSI 21). Mho circle visualization and Load Encroachment."
                    status="R-X Mode"
                />
                <ToolWidget 
                    title="Toolkit" 
                    icon={Calculator} 
                    link="/tools"
                    desc="Quick calcs: Battery Sizing, Cable Adiabatic Limits, and CT Burden checks."
                    status="Utils"
                />
            </div>
        </div>

        {/* 5. ENGINEERING FUNDAMENTALS */}
        <div className="space-y-8 pt-12 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-600" /> Engineering Fundamentals
                    </h2>
                    <p className="text-slate-500 mt-2 max-w-2xl text-lg">
                        Master the physics behind the protection. These concepts form the bedrock of every safe power system.
                    </p>
                </div>
                <Link to="/academy" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                    View Full Curriculum <ArrowRight className="w-4 h-4"/>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {KNOWLEDGE_SNIPPETS.map((item) => (
                    <div key={item.id} className="group relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${item.color}`}>
                            <item.icon className="w-32 h-32" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-6">
                                <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full ${item.bg} ${item.color}`}>
                                    {item.tag}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{item.title}</h3>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                {item.description}
                            </p>

                            <ul className="space-y-3 mb-8 flex-1">
                                {item.bullets.map((b, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${item.color.replace('text-', 'bg-')}`}></div>
                                        <span dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>') }} />
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

        {/* 6. MANIFESTO / WHY */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            {/* Abstract Background */}
            <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad1)" />
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{stopColor:'#3b82f6', stopOpacity:1}} />
                            <stop offset="100%" style={{stopColor:'#8b5cf6', stopOpacity:1}} />
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
                        Democratizing <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Power Engineering</span>
                    </h2>
                    <div className="space-y-6 text-lg text-slate-400 leading-relaxed">
                        <p>
                            Professional simulation software is expensive, clunky, and locked behind hardware keys. This creates a barrier for students and engineers who just want to learn.
                        </p>
                        <p>
                            RelaySchool breaks this barrier. We combine <strong>gaming-grade graphics</strong> with <strong>IEEE-standard math</strong> to create a learning sandbox that is accessible to everyone, everywhere.
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
                                <p className="text-slate-400 text-sm leading-relaxed">{prop.desc}</p>
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
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Technical FAQ</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Common queries about Protection Engineering, Simulation Physics, and Platform Capabilities.
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
