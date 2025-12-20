
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Zap, DollarSign, Timer, ArrowLeft, AlertCircle, XCircle, Flame, HelpCircle, CheckCircle, ChevronDown, ChevronUp, Play, RefreshCw, Eye, BookOpen, Skull, Search, Microscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- VISUALIZATIONS ---

const PolarityVisual = () => {
    return (
        <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Diagram Background */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1),transparent_70%)]"></div>
            
            <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Primary Circuit */}
                <line x1="20" y1="50" x2="180" y2="50" stroke="#475569" strokeWidth="2" />
                <rect x="90" y="40" width="20" height="20" fill="#1e293b" stroke="#94a3b8" rx="2" />
                <text x="100" y="35" textAnchor="middle" fontSize="8" fill="#64748b">Protected Object</text>

                {/* CTs */}
                <circle cx="50" cy="50" r="8" fill="none" stroke="#64748b" strokeWidth="2" />
                <circle cx="150" cy="50" r="8" fill="none" stroke="#64748b" strokeWidth="2" />

                {/* Differential Path */}
                <path d="M 50 58 L 50 80 L 150 80 L 150 58" fill="none" stroke="#334155" strokeWidth="2" />
                
                {/* Relay */}
                <rect x="90" y="70" width="20" height="20" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x="100" y="83" textAnchor="middle" fontSize="6" fill="#ef4444" fontWeight="bold">87</text>

                {/* Current Flow Animations - COLLISION */}
                <motion.circle 
                    r="3" fill="#3b82f6"
                    animate={{ cx: [50, 50, 90], cy: [58, 80, 80] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                {/* Reverse Polarity Current Flowing TOWARDS relay instead of circulating */}
                <motion.circle 
                    r="3" fill="#ef4444"
                    animate={{ cx: [150, 150, 110], cy: [58, 80, 80] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />

                {/* Explosion/Trip Effect at Relay */}
                <motion.circle 
                    cx="100" cy="80" r="15" 
                    fill="rgba(239,68,68,0.5)"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                <text x="100" y="95" textAnchor="middle" fontSize="8" fill="#ef4444" fontWeight="bold">Idiff = 2 • Iload!</text>
            </svg>
        </div>
    );
};

const CurveVisual = () => {
    return (
        <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 p-4">
            <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
                 {/* Axes */}
                 <line x1="10" y1="50" x2="90" y2="50" stroke="#475569" strokeWidth="1" />
                 <line x1="10" y1="10" x2="10" y2="50" stroke="#475569" strokeWidth="1" />
                 <text x="90" y="55" fontSize="4" fill="#64748b">Current (I)</text>
                 <text x="5" y="10" fontSize="4" fill="#64748b">Time (t)</text>

                 {/* Curves */}
                 {/* Upstream - Standard Inverse (Blue) - Should be SLOWER */}
                 <path d="M 15 10 Q 40 40 90 45" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                 {/* Downstream - Very Inverse (Red) - Should be FASTER */}
                 <path d="M 15 20 Q 40 30 90 35" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2" />

                 {/* Intersection Point Alert */}
                 <motion.circle 
                    cx="65" cy="38" r="3" 
                    fill="none" stroke="#f59e0b" strokeWidth="1"
                    animate={{ r: [2, 6], opacity: [1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                 />
                 
                 {/* Fault Line Moving */}
                 <motion.line
                    x1="65" y1="10" x2="65" y2="50"
                    stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="1"
                    initial={{ x1: 20, x2: 20 }}
                    animate={{ x1: 80, x2: 80 }}
                    transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                 />
                 
                 <text x="65" y="30" fontSize="4" fill="#f59e0b" fontWeight="bold">Cross-over!</text>
            </svg>
        </div>
    );
};

const HeatVisual = () => {
    return (
        <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center p-4">
            {/* Cable Graphic */}
            <div className="relative w-full h-4 bg-slate-700 rounded-full mb-8 overflow-hidden">
                <motion.div 
                    className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Timeline */}
            <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -z-10"></div>
                
                {/* Points */}
                <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-slate-500 rounded-full mb-1"></div>
                    <span>Fault</span>
                </div>

                <div className="flex flex-col items-center">
                    <motion.div 
                        className="w-2 h-2 bg-green-500 rounded-full mb-1"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    ></motion.div>
                    <span className="text-green-500 font-bold">Ideal</span>
                </div>

                <div className="flex flex-col items-center relative">
                    <motion.div 
                        className="w-4 h-4 bg-red-500 rounded-full mb-1 flex items-center justify-center z-10 shadow-[0_0_10px_red]"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <Flame className="w-3 h-3 text-white" />
                    </motion.div>
                    <span className="text-red-500 font-bold">Actual</span>
                    
                    {/* Delay Arrow */}
                    <div className="absolute right-full top-1 w-20 h-4 border-b border-red-500 flex items-center justify-center text-[8px] text-red-400">
                        +1.5s Delay
                    </div>
                </div>
            </div>
        </div>
    );
};

const GooseVisual = () => {
    return (
        <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 p-4 flex flex-col justify-between">
            {/* Network Nodes */}
            <div className="flex justify-between items-center px-4">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">IED1</div>
                    <span className="text-[8px] text-slate-400">Sender</span>
                </div>
                <div className="flex-1 h-1 bg-slate-700 mx-2 relative">
                    {/* Slow Packet */}
                    <motion.div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-3 bg-purple-500 rounded-sm shadow-[0_0_8px_purple]"
                        animate={{ left: ["0%", "80%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} // Slow transit
                    />
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded bg-green-600 flex items-center justify-center text-white text-xs font-bold">IED2</div>
                    <span className="text-[8px] text-slate-400">Receiver</span>
                </div>
            </div>

            {/* Timeline Logic */}
            <div className="bg-slate-950 rounded p-2 border border-slate-800 mt-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>Sent: T+0ms</span>
                    <span className="text-red-500 font-bold">Arrived: T+25ms</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="w-[10%] h-full bg-green-500"></div> {/* Allowed */}
                    <div className="w-[30%] h-full bg-red-500 ml-[10%]"></div> {/* Late */}
                </div>
                <div className="text-[8px] text-red-400 mt-1 text-center font-bold">
                    ⚠️ TIMEOUT (Max 4ms)
                </div>
            </div>
        </div>
    );
};

// --- DATA ---

interface CaseStudy {
    id: string;
    title: string;
    subtitle: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    visual: React.ReactNode;
    scenario: string;
    mistake: string;
    physics: string;
    fix: React.ReactNode;
    stats: { cost: string, time: string, risk: string };
}

const CASE_STUDIES: CaseStudy[] = [
    {
        id: '001',
        title: 'The Differential Disaster',
        subtitle: 'Wrong CT Polarity causing Trip on Load',
        severity: 'CRITICAL',
        visual: <PolarityVisual />,
        scenario: "You commissioned a transformer differential relay. Everything looked fine at 0A. As soon as you energized the loaded transformer, it tripped instantaneously.",
        mistake: "One set of Current Transformers (CTs) was wired with incorrect polarity (P1/P2 swapped or software setting inverted).",
        physics: "Differential protection works on Idiff = |I1 + I2|. Ideally, currents cancel out (I1 = -I2, so Sum = 0). With swapped polarity, they ADD up (Sum = 2 × Iload), appearing as a massive internal fault.",
        fix: <>Perform a <strong>Stability Test</strong> before loading. Inject low voltage 3-phase current and measure Idiff at the relay. It should be near zero.</>,
        stats: { cost: '$150k', time: 'Instant', risk: 'Outage' }
    },
    {
        id: '002',
        title: 'The Race Condition',
        subtitle: 'Poor Curve Selection (IEC vs ANSI)',
        severity: 'HIGH',
        visual: <CurveVisual />,
        scenario: "A fault occurred at the remote end of a feeder. Instead of the feeder breaker tripping, the main incomer tripped, blacking out the whole substation.",
        mistake: "Mixing curve types carelessly. The upstream relay used 'Standard Inverse' while downstream used 'Very Inverse'.",
        physics: "Inverse curves have different slopes. Even if coordinated at low currents, 'Very Inverse' becomes much faster at high currents. The curves physically crossed on the TCC graph at high fault levels.",
        fix: <>Always check for <strong>Curve Intersection</strong>. Use the same curve family (e.g., all IEC-VI) throughout a radial network or ensure a minimum grading margin exists at maximum fault current.</>,
        stats: { cost: '$500k', time: '-200ms', risk: 'Blackout' }
    },
    {
        id: '003',
        title: 'The Meltdown',
        subtitle: 'Excessive Grading Margins',
        severity: 'MEDIUM',
        visual: <HeatVisual />,
        scenario: "A short circuit occurred on a sub-distribution board. The protection eventually tripped, but the feeding cable insulation melted and caught fire.",
        mistake: "Engineers added too much 'safety margin' (0.5s or 0.6s) at each hop. By the time it reached the source, the trip time was >2.0s.",
        physics: "Cable thermal limits follow I²t = K²S². If the fault duration t exceeds the cable's withstand capability for that current I, the insulation degrades instantly.",
        fix: <>Keep grading margins tight (typically <strong>0.2s - 0.3s</strong> for numerical relays). Use 'Zone Interlocking' or 'Differential' logic to eliminate time delays entirely.</>,
        stats: { cost: '$250k', time: '+1.5s', risk: 'Fire' }
    },
    {
        id: '004',
        title: 'The Phantom Signal',
        subtitle: 'Ignoring Network Latency (GOOSE)',
        severity: 'HIGH',
        visual: <GooseVisual />,
        scenario: "Breaker Failure Protection (50BF) failed to initiate a back-trip during a stuck breaker event, leading to busbar destruction.",
        mistake: "The engineer assumed GOOSE messages travel instantly. They didn't account for switch hops and VLAN priority processing.",
        physics: "Protection schemes requiring <100ms total clearing time rely on GOOSE transmission taking <4ms. If the network is flooded (broadcast storm) or misconfigured, latency spikes.",
        fix: <>Use separate <strong>VLANs</strong> for GOOSE traffic. Enable <strong>QoS (Quality of Service)</strong> to prioritize EtherType 0x88B8. Test network latency under load.</>,
        stats: { cost: '$85k', time: '+20ms', risk: 'Damage' }
    }
];

const MistakeLearning = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8 text-amber-500" /> Mistake-First Learning
                        </h1>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
                        Elite engineers don't just learn "correct" design; they study failures. 
                        We've reconstructed high-consequence errors so you can experience them safely.
                    </p>
                </div>
            </div>

            {/* Introduction Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden border border-slate-700 shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Flame className="w-48 h-48 animate-pulse" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-red-400" /> Why simulate accidents?
                    </h2>
                    <p className="text-slate-300 leading-relaxed mb-6">
                        In power systems, a "small" setting error isn't just a bug—it's a fire, a blackout, or a million-dollar loss. 
                        This library dissects real-world engineering disasters to teach you the <strong>physics</strong> behind the standards.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2 border border-white/10 backdrop-blur-sm">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-bold">Financial Impact</span>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2 border border-white/10 backdrop-blur-sm">
                            <Timer className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-bold">Clearing Times</span>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2 border border-white/10 backdrop-blur-sm">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-bold">Safety Risks</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Case Studies */}
            <div className="grid grid-cols-1 gap-8">
                {CASE_STUDIES.map((study) => (
                    <motion.div 
                        key={study.id} 
                        layout
                        className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 overflow-hidden ${
                            expandedId === study.id 
                            ? 'border-blue-500 dark:border-blue-500 shadow-2xl ring-1 ring-blue-500' 
                            : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                    >
                        <div 
                            className="p-6 cursor-pointer"
                            onClick={() => setExpandedId(expandedId === study.id ? null : study.id)}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl shrink-0 ${
                                        study.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                        study.severity === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                    }`}>
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-slate-400">CASE #{study.id}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                                                study.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600' :
                                                study.severity === 'HIGH' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600' :
                                                'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600'
                                            }`}>
                                                {study.severity}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{study.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{study.subtitle}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Delay</span>
                                        <span className="font-mono font-bold text-red-500">{study.stats.time}</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Cost</span>
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{study.stats.cost}</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Risk</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{study.stats.risk}</span>
                                    </div>
                                </div>
                                <div className="text-slate-400">
                                    {expandedId === study.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedId === study.id && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                                >
                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        
                                        {/* Left: Visualization */}
                                        <div className="lg:col-span-1">
                                            <div className="h-48 w-full shadow-lg rounded-xl overflow-hidden mb-3 ring-1 ring-slate-900/5 dark:ring-white/10">
                                                {study.visual}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Failure Simulation</p>
                                            </div>
                                        </div>

                                        {/* Right: Educational Content */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase mb-2 flex items-center gap-2">
                                                    <Eye className="w-4 h-4 text-blue-500" /> The Scenario
                                                </h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {study.scenario}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r">
                                                    <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase mb-1 flex items-center gap-2">
                                                        <XCircle className="w-3 h-3" /> The Mistake
                                                    </h4>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                                        {study.mistake}
                                                    </p>
                                                </div>
                                                <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 rounded-r">
                                                    <h4 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase mb-1 flex items-center gap-2">
                                                        <CheckCircle className="w-3 h-3" /> The Fix
                                                    </h4>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                                        {study.fix}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase mb-2 flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-purple-500" /> Engineering Physics
                                                </h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
                                                    {study.physics}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            <div className="bg-blue-600 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-900/20 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold flex items-center gap-2 mb-2">
                        <HelpCircle className="w-6 h-6" /> Ready to test yourself?
                    </h3>
                    <p className="text-blue-100 max-w-xl">
                        Apply these lessons in the <strong>Failure Lab</strong>. Reconstruct these scenarios with adjustable parameters to see the exact tipping point of failure.
                    </p>
                </div>
                <Link to="/failure" className="relative z-10 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2 whitespace-nowrap group">
                    Open Failure Lab <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* --- RICH CONTENT SECTION --- */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Skull className="w-5 h-5 text-red-600" /> Hierarchy of Controls
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        In safety engineering, personal protection (PPE) is the last line of defense. The priority is always <strong>Elimination</strong> (remove the hazard), followed by <strong>Substitution</strong> (lower voltage), and then <strong>Engineering Controls</strong> (Relays & Breakers).
                    </p>
                    <div className="h-2 w-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"></div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 uppercase font-bold">
                        <span>Most Effective</span>
                        <span>Least Effective</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Microscope className="w-5 h-5 text-purple-500" /> Root Cause Analysis (RCA)
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                        When a protection system fails, we use the "5 Whys" method. 
                        Example: Breaker failed {'->'} Why? {'->'} Coil burned out {'->'} Why? {'->'} Trip contact stuck closed {'->'} Why? {'->'} Relay watchdog failed.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500">
                        Lesson: Redundancy is not just doubling components; it's eliminating common-mode failures.
                    </div>
                </div>
            </section>
        </div>
    );
};

export default MistakeLearning;
