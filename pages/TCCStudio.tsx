import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Activity, Plus, Trash2, AlertTriangle, CheckCircle, Search,
    ZoomIn, ZoomOut, Maximize, RotateCcw, Save, Settings,
    MousePointer2, ChevronDown, ChevronUp, Layers, Eye, EyeOff,
    Download, PlayCircle, Lock, Unlock, Move, BookOpen, Lightbulb,
    GraduationCap, X, Zap, Clock, Shield, Info, FileText, CheckCircle2,
    AlertOctagon, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
    Maximize2, Minimize2, BrainCircuit, School, Calculator, ArrowRight,
    Trophy, XCircle, RefreshCw, Flame, Factory, Gauge
} from 'lucide-react';

// --- 1. CONSTANTS & DATA BANKS ---

const CurveType = {
    IEC_STANDARD_INVERSE: 'IEC_SI',
    IEC_VERY_INVERSE: 'IEC_VI',
    IEC_EXTREMELY_INVERSE: 'IEC_EI',
    ANSI_MODERATELY_INVERSE: 'ANSI_MI',
    ANSI_VERY_INVERSE: 'ANSI_VI',
    ANSI_EXTREMELY_INVERSE: 'ANSI_EI',
    DT_DEFINITE_TIME: 'DT',
    // Special Types for Limits
    EQUIP_TRANSFORMER_DAMAGE: 'EQ_TX_DMG',
    EQUIP_MOTOR_START: 'EQ_MOT_START'
};

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const CURVE_LIB = [
    { label: "IEC Standard Inverse (SI)", value: CurveType.IEC_STANDARD_INVERSE },
    { label: "IEC Very Inverse (VI)", value: CurveType.IEC_VERY_INVERSE },
    { label: "IEC Extremely Inverse (EI)", value: CurveType.IEC_EXTREMELY_INVERSE },
    { label: "ANSI Moderately Inverse", value: CurveType.ANSI_MODERATELY_INVERSE },
    { label: "ANSI Very Inverse", value: CurveType.ANSI_VERY_INVERSE },
    { label: "ANSI Extremely Inverse", value: CurveType.ANSI_EXTREMELY_INVERSE },
    { label: "Definite Time (50)", value: CurveType.DT_DEFINITE_TIME },
];

const SCENARIOS = [
    {
        id: 'dist_feeder',
        name: 'Distribution Feeder Grading',
        description: 'Classic source-to-load coordination (Blue feeder below Red incomer).',
        devices: [
            { id: 'dev_up', name: 'Substation Incomer', type: 'Relay', curve: CurveType.IEC_VERY_INVERSE, pickup: 600, tds: 0.40, instantaneous: 12000, ctRatio: 1200, color: '#ef4444', visible: true, locked: false, showBand: false },
            { id: 'dev_down', name: 'Feeder Relay', type: 'Relay', curve: CurveType.IEC_STANDARD_INVERSE, pickup: 200, tds: 0.15, instantaneous: 3000, ctRatio: 400, color: '#3b82f6', visible: true, locked: false, showBand: true }
        ]
    },
    {
        id: 'tx_protection',
        name: 'Transformer Damage Protection',
        description: 'Coordinate relay to trip BEFORE the Transformer Damage Curve (ANSI C57.109).',
        devices: [
            { id: 'tx_limit', name: 'TX Damage Curve (Category II)', type: 'Limit', curve: CurveType.EQUIP_TRANSFORMER_DAMAGE, pickup: 1000, tds: 1, instantaneous: null, ctRatio: null, color: '#dc2626', visible: true, locked: true, showBand: false },
            { id: 'tx_relay', name: 'HV Side Relay', type: 'Relay', curve: CurveType.ANSI_EXTREMELY_INVERSE, pickup: 100, tds: 2.0, instantaneous: 2000, ctRatio: 200, color: '#3b82f6', visible: true, locked: false, showBand: true }
        ]
    },
    {
        id: 'motor_start',
        name: 'Motor Protection & Starting',
        description: 'Allow Motor Starting (Inrush) while protecting against stall.',
        devices: [
            { id: 'mot_start', name: 'Motor Starting Curve', type: 'Limit', curve: CurveType.EQUIP_MOTOR_START, pickup: 100, tds: 1, instantaneous: null, ctRatio: null, color: '#f59e0b', visible: true, locked: true, showBand: false },
            { id: 'dev_mot', name: 'Motor Protection Relay', type: 'Relay', curve: CurveType.IEC_EXTREMELY_INVERSE, pickup: 110, tds: 0.8, instantaneous: 1200, ctRatio: 150, color: '#10b981', visible: true, locked: false, showBand: true }
        ]
    }
];

const THEORY_TOPICS = [
    {
        id: 'fundamentals',
        title: "Coordination Fundamentals",
        icon: <BookOpen className="w-5 h-5" />,
        content: (
            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">The Golden Rule of Selectivity</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                        "Isolate the faulted component as quickly as possible, while leaving the maximum amount of the remaining system operational."
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Key Engineering Metrics</h4>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex gap-3"><span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">CTI</span> <span><strong>Coordination Time Interval:</strong> Typically 0.2s - 0.4s. Includes breaker operating time (5 cycles), relay overshoot, and safety margin.</span></li>
                        <li className="flex gap-3"><span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">PSM</span> <span><strong>Plug Setting Multiplier:</strong> Ratio of Fault Current to Pickup Current (I_fault / I_pickup).</span></li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        id: 'transformer',
        title: "Transformer Protection (C57.109)",
        icon: <Zap className="w-5 h-5" />,
        content: (
            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-300">Protecting transformers requires balancing <strong>Inrush Current</strong> (which should NOT trip) and the <strong>Through-Fault Damage Curve</strong> (which MUST trip).</p>

                <div className="grid grid-cols-1 gap-4">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h5 className="font-bold text-red-600 mb-1 flex items-center gap-2"><Flame className="w-4 h-4" /> Damage Curves (ANSI C57.109)</h5>
                        <p className="text-xs text-slate-500 mb-2">Transformers have thermal and mechanical limits defined by categories (I, II, III, IV) based on kVA.</p>
                        <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            <li><strong>Thermal Limit:</strong> I²t characteristic (heating).</li>
                            <li><strong>Mechanical Limit:</strong> Withstand against magnetic forces during external faults.</li>
                        </ul>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h5 className="font-bold text-amber-600 mb-1 flex items-center gap-2"><Activity className="w-4 h-4" /> Magnetizing Inrush</h5>
                        <p className="text-xs text-slate-500 mb-2">Transient current when energizing. Relays must ignore this.</p>
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs font-mono">
                            Typical Point: 8x - 12x FLA @ 0.1s
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'motors',
        title: "Motor Thermal Models",
        icon: <Factory className="w-5 h-5" />,
        content: (
            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-300">Motor protection relays typically use thermal models to estimate rotor/stator heating.</p>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-2">Starting Curve</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            The relay must sit <strong>above</strong> the starting curve to allow the motor to accelerate without nuisance tripping.
                            <br />
                            <em>Typical LRA (Locked Rotor Amps): 600% of FLA.</em>
                        </p>
                    </div>
                    <div className="flex-1">
                        <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-2">Stall Limit</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            The relay must sit <strong>below</strong> the Safe Stall Time (Hot/Cold) to prevent insulation damage during a jam.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'ct_saturation',
        title: "CT Saturation & Burden",
        icon: <Gauge className="w-5 h-5" />,
        content: (
            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    If a Current Transformer (CT) saturates, the secondary current is distorted and reduced, leading to slow operation or failure to trip.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-2">ANSI C-Class Ratings (e.g., C100, C200)</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Indicates the secondary voltage the CT can deliver to a standard burden without exceeding 10% ratio error.
                    </p>
                    <div className="text-xs font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                        Vs = Ifault_sec × (R_ct + R_leads + R_relay)
                    </div>
                    <p className="text-xs text-slate-500 mt-2">If Vs &gt; Knee Point Voltage, saturation occurs.</p>
                </div>
            </div>
        )
    }
];

const QUIZ_BANK = [
    // Industry Level Questions
    { q: "According to IEEE C57.109, the Transformer Damage Curve is divided into which categories?", options: ["Thermal & Magnetic", "Category I, II, III, IV", "Phase & Ground", "Zones 1, 2, 3"], a: 1, level: 'easy' },
    { q: "What is the primary method to inhibit relay tripping during Transformer Inrush?", options: ["Time Delay", "2nd Harmonic Restraint", "Voltage Blocking", "Differential Bias"], a: 1, level: 'medium' },
    { q: "A CT with class 'C200' can deliver 200V at terminal assuming:", options: ["20A secondary", "100A secondary", "20x nominal current with <10% error", "Infinite burden"], a: 2, level: 'hard' },
    { q: "In a selective coordination study, the CTI usually accounts for:", options: ["Cable length", "Breaker opening + Relay overshoot + Safety", "Voltage drop", "Transformer impedance"], a: 1, level: 'easy' },
    { q: "Sympathetic Tripping occurs when:", options: ["Relays trip out of pity", "A relay trips for a fault on an adjacent feeder due to inrush/offset", "Ground fault current is too low", "CTs are open circuited"], a: 1, level: 'hard' },
    { q: "Locked Rotor Current (LRA) is typically how many times the Full Load Amps (FLA)?", options: ["1.5x", "6x", "12x", "20x"], a: 1, level: 'medium' },
    { q: "The 'Knee Point' voltage of a CT is defined where a 10% increase in voltage causes:", options: ["10% increase in excitation current", "50% increase in excitation current", "Saturation", "Explosion"], a: 1, level: 'hard' },
    { q: "Ground fault relays often require lower settings because:", options: ["Ground faults always have high current", "Ground return paths often have high impedance", "They are cheaper", "Phase relays don't work"], a: 1, level: 'medium' },
    { q: "Which curve is best suited for protecting fuses?", options: ["Definite Time", "Extremely Inverse", "Standard Inverse", "Linear"], a: 1, level: 'medium' },
    { q: "What is the typical clearing time of a 5-cycle breaker?", options: ["0.083s", "0.05s", "0.1s", "0.016s"], a: 0, level: 'hard' },
];


// --- 2. MATH ENGINE ---

const calculateTripTime = (current, pickup, tds, curveType, instantaneous) => {
    // Special Logic for Equipment Limits (Non-Relay Curves)
    if (curveType === CurveType.EQUIP_TRANSFORMER_DAMAGE) {
        // Approximate ANSI Damage Curve: t = k / I^2
        // We'll simulate a fixed logic for visual representation
        if (current < pickup) return null;
        return (tds * 2000000) / (current * current); // Simplified I2t
    }

    if (curveType === CurveType.EQUIP_MOTOR_START) {
        // Motor Start is a vertical line (Current limit) and horizontal line (Time limit)
        // Returning a simplified inverse curve for visual 'wall' effect in this prototype
        if (current < pickup) return 20; // Pre-start
        if (current > pickup * 6) return null; // Post start
        return Math.max(0.1, 1000 / current); // Arbitrary start curve
    }

    // Standard Relay Logic
    if (instantaneous && current >= instantaneous) return 0.01;
    if (current < pickup) return null;
    const M = current / pickup;
    if (M <= 1.0) return null;

    let time = 0;
    switch (curveType) {
        case CurveType.IEC_STANDARD_INVERSE: time = tds * (0.14 / (Math.pow(M, 0.02) - 1)); break;
        case CurveType.IEC_VERY_INVERSE: time = tds * (13.5 / (M - 1)); break;
        case CurveType.IEC_EXTREMELY_INVERSE: time = tds * (80 / (Math.pow(M, 2) - 1)); break;
        case CurveType.ANSI_MODERATELY_INVERSE: time = tds * (0.0515 / (Math.pow(M, 0.02) - 1) + 0.1140); break;
        case CurveType.ANSI_VERY_INVERSE: time = tds * (19.61 / (Math.pow(M, 2) - 1) + 0.491); break;
        case CurveType.ANSI_EXTREMELY_INVERSE: time = tds * (28.2 / (Math.pow(M, 2) - 1) + 0.1217); break;
        case CurveType.DT_DEFINITE_TIME: time = tds; break;
        default: return null;
    }
    return Math.max(0.01, time);
};

// --- 3. SUB-COMPONENTS ---

const TheoryModule = () => {
    const [activeTopic, setActiveTopic] = useState(THEORY_TOPICS[0]);

    return (
        <div className="flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-950 animate-fade-in">
            {/* Sidebar */}
            <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-y-auto">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Engineering Reference</h2>
                </div>
                <div className="p-2 space-y-1">
                    {THEORY_TOPICS.map(topic => (
                        <button
                            key={topic.id}
                            onClick={() => setActiveTopic(topic)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${activeTopic.id === topic.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            {topic.icon}
                            {topic.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                            {activeTopic.icon}
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">{activeTopic.title}</h1>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        {activeTopic.content}
                    </div>

                    <div className="mt-12 p-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl text-white shadow-xl border border-slate-700">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><Lightbulb className="w-5 h-5 text-yellow-400" /> Pro Tip</h4>
                        <p className="text-sm opacity-90">
                            Always cross-reference these guidelines with specific manufacturer datasheets (Siemens, ABB, SEL, GE) as curve algorithms can vary slightly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuizModule = () => {
    const [level, setLevel] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const startQuiz = (lvl) => {
        const pool = QUIZ_BANK; // Use full bank for pro version
        const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);
        setQuestions(shuffled);
        setLevel(lvl);
        setAnswers({});
        setSubmitted(false);
    };

    const reset = () => {
        setLevel(null);
        setQuestions([]);
        setAnswers({});
        setSubmitted(false);
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.a) score++;
        });
        return score;
    };

    if (!level) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in-up bg-slate-50 dark:bg-slate-950">
                <div className="text-center max-w-lg mb-12">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Competency Assessment</h2>
                    <p className="text-slate-500">Test your knowledge against industry-standard protection scenarios. Questions derived from IEEE and IEC standards.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    {[
                        { id: 'easy', label: 'Apprentice', color: 'bg-emerald-500', icon: <School className="w-8 h-8 text-white" />, desc: "Basic concepts & definitions" },
                        { id: 'medium', label: 'Engineer', color: 'bg-blue-600', icon: <Calculator className="w-8 h-8 text-white" />, desc: "Application & Calculations" },
                        { id: 'hard', label: 'Senior PE', color: 'bg-indigo-600', icon: <BrainCircuit className="w-8 h-8 text-white" />, desc: "Complex scenarios & Standards" },
                    ].map(l => (
                        <button key={l.id} onClick={() => startQuiz(l.id)}
                            className={`${l.color} hover:brightness-110 transition-all p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 text-white group relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-4 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                                {l.icon}
                            </div>
                            <div className="text-center">
                                <span className="text-xl font-bold uppercase tracking-widest block">{l.label}</span>
                                <span className="text-xs opacity-75 mt-1 block">{l.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const score = calculateScore();
    const passed = score >= 4; // Higher standard for pro tool

    return (
        <div className="max-w-3xl mx-auto p-6 pb-20 animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <button onClick={reset} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4 rotate-180" /> Exit Assessment
                </button>
                <div className="flex gap-2">
                    {questions.map((_, i) => (
                        <div key={i} className={`h-2 w-8 rounded-full ${answers[i] !== undefined ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                </div>
            </div>

            {submitted ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
                    {passed ? <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-bounce" /> : <RefreshCw className="w-24 h-24 text-slate-300 mx-auto mb-6" />}
                    <h2 className="text-5xl font-black text-slate-800 dark:text-white mb-2">{score} <span className="text-2xl text-slate-400 font-medium">/ 5</span></h2>
                    <p className={`text-lg font-medium mb-10 ${passed ? 'text-green-500' : 'text-slate-500'}`}>
                        {passed ? "Certification Ready Standard." : "Review IEEE standards and try again."}
                    </p>
                    <button onClick={reset} className="px-10 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">
                        New Assessment
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {questions.map((q, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-6 flex gap-4">
                                <span className="text-blue-500 opacity-50">0{idx + 1}</span> {q.q}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                {q.options.map((opt, oid) => (
                                    <label key={oid} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${answers[idx] === oid ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'}`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[idx] === oid ? 'border-blue-500' : 'border-slate-300'}`}>
                                            {answers[idx] === oid && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                        </div>
                                        <input type="radio" name={`q-${idx}`} className="hidden" onChange={() => setAnswers({ ...answers, [idx]: oid })} checked={answers[idx] === oid} />
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => setSubmitted(true)}
                            disabled={Object.keys(answers).length < 5}
                            className="px-12 py-4 bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl transition-all active:scale-95"
                        >
                            Finalize & Submit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SimulatorView = ({ isActive }) => {
    // Simulator State (Lifted or preserved via display style)
    const [devices, setDevices] = useState(JSON.parse(JSON.stringify(SCENARIOS[0].devices)));
    const [selectedId, setSelectedId] = useState(SCENARIOS[0].devices[0].id);
    const [faultAmps, setFaultAmps] = useState(2000);
    const [showHelp, setShowHelp] = useState(false);

    // Layout State
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [footerOpen, setFooterOpen] = useState(false);

    // Viewport
    const [view, setView] = useState({ minX: 10, maxX: 100000, minY: 0.01, maxY: 1000 });
    const [dims, setDims] = useState({ w: 800, h: 600 });
    const [cursor, setCursor] = useState(null);

    const graphRef = useRef(null);
    const [draggingId, setDraggingId] = useState(null);
    const [dragType, setDragType] = useState(null);

    // Resize Observer
    useEffect(() => {
        if (!graphRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
        });
        ro.observe(graphRef.current);
        return () => ro.disconnect();
    }, [leftPanelOpen, rightPanelOpen, footerOpen, isActive]);

    // Actions
    const addDevice = () => {
        const id = `dev_${Date.now()}`;
        const newDev = {
            id, name: `Relay ${devices.length + 1}`, type: 'Relay', curve: CurveType.IEC_STANDARD_INVERSE,
            pickup: 100, tds: 0.1, ctRatio: 100, color: COLORS[devices.length % COLORS.length],
            visible: true, locked: false, showBand: false
        };
        setDevices([...devices, newDev]);
        setSelectedId(id);
        setRightPanelOpen(true);
    };

    const updateDevice = (id, patch) => setDevices(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    const removeDevice = (id) => { setDevices(prev => prev.filter(d => d.id !== id)); if (selectedId === id) setSelectedId(null); };
    const loadScenario = (idx) => {
        const s = SCENARIOS[idx];
        setDevices(JSON.parse(JSON.stringify(s.devices)));
        setSelectedId(s.devices[0].id);
        setFaultAmps(2000);
        setLeftPanelOpen(true);
        setRightPanelOpen(true);
    };

    // Math Helpers
    const logMinX = Math.log10(view.minX); const logMaxX = Math.log10(view.maxX);
    const logMinY = Math.log10(view.minY); const logMaxY = Math.log10(view.maxY);
    const toPxX = (val) => ((Math.log10(val) - logMinX) / (logMaxX - logMinX)) * dims.w;
    const toPxY = (val) => dims.h - ((Math.log10(val) - logMinY) / (logMaxY - logMinY)) * dims.h;
    const fromPxX = (px) => Math.pow(10, logMinX + (px / dims.w) * (logMaxX - logMinX));
    const fromPxY = (py) => Math.pow(10, logMinY + ((dims.h - py) / dims.h) * (logMaxY - logMinY));

    // Renderers
    const GridLines = useMemo(() => {
        const lines = [];
        for (let i = Math.ceil(logMinX); i <= Math.floor(logMaxX); i++) {
            const x = toPxX(Math.pow(10, i));
            lines.push(<line key={`maj-x-${i}`} x1={x} y1={0} x2={x} y2={dims.h} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />);
            lines.push(<text key={`lbl-x-${i}`} x={x + 4} y={dims.h - 5} className="text-[10px] fill-slate-400 font-bold select-none">{Math.pow(10, i) >= 1000 ? `${Math.pow(10, i) / 1000}k` : Math.pow(10, i)}</text>);
            for (let j = 2; j < 10; j++) {
                const val = j * Math.pow(10, i);
                if (val > view.minX && val < view.maxX) {
                    const xm = toPxX(val);
                    lines.push(<line key={`min-x-${val}`} x1={xm} y1={0} x2={xm} y2={dims.h} stroke="currentColor" strokeOpacity={0.03} strokeWidth={1} />);
                }
            }
        }
        for (let i = Math.ceil(logMinY); i <= Math.floor(logMaxY); i++) {
            const y = toPxY(Math.pow(10, i));
            lines.push(<line key={`maj-y-${i}`} x1={0} y1={y} x2={dims.w} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />);
            lines.push(<text key={`lbl-y-${i}`} x={5} y={y - 4} className="text-[10px] fill-slate-400 font-bold select-none">{Math.pow(10, i)}s</text>);
            for (let j = 2; j < 10; j++) {
                const val = j * Math.pow(10, i);
                if (val > view.minY && val < view.maxY) {
                    const ym = toPxY(val);
                    lines.push(<line key={`min-y-${val}`} x1={0} y1={ym} x2={dims.w} y2={ym} stroke="currentColor" strokeOpacity={0.03} strokeWidth={1} />);
                }
            }
        }
        return <g className="text-slate-500 pointer-events-none">{lines}</g>;
    }, [view, dims]);

    const CurvePath = ({ dev }) => {
        if (!dev.visible) return null;
        let d = "";
        let dMin = "", dMax = "";
        const isEquipment = dev.type === 'Limit';
        const startI = Math.max(dev.pickup, view.minX);
        const endI = dev.instantaneous ? Math.min(dev.instantaneous, view.maxX) : view.maxX;

        // Visual distinction for equipment limits
        const strokeDash = isEquipment ? "4,4" : (dev.locked ? "5,5" : "");
        const strokeWidth = isEquipment ? 3 : (selectedId === dev.id ? 3 : 2);

        // Handle Equipment (e.g., Transformer Damage point or Motor Start) differently
        if (dev.curve === CurveType.EQUIP_TRANSFORMER_DAMAGE) {
            // Draw a simplified damage curve visual
            const points = [];
            for (let i = dev.pickup; i <= view.maxX; i *= 1.1) {
                const t = calculateTripTime(i, dev.pickup, dev.tds, dev.curve, null);
                if (t && t >= view.minY && t <= view.maxY) points.push({ x: toPxX(i), y: toPxY(t) });
            }
            points.forEach((p, i) => d += `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `);
        }
        else if (dev.curve === CurveType.EQUIP_MOTOR_START) {
            // Draw motor start "corner"
            const x = toPxX(dev.pickup);
            const y = toPxY(20); // 20s start time approx
            const xEnd = toPxX(dev.pickup * 6); // LRA
            d = `M ${x} ${dims.h} L ${x} ${y} L ${xEnd} ${y} L ${xEnd} ${dims.h}`;
        }
        else {
            // Standard Relay Drawing
            if (dev.pickup >= view.minX && dev.pickup <= view.maxX) {
                const x = toPxX(dev.pickup);
                const topT = calculateTripTime(dev.pickup * 1.01, dev.pickup, dev.tds, dev.curve, dev.instantaneous);
                const yTop = topT ? Math.max(0, toPxY(topT)) : 0;
                d += `M ${x} ${dims.h} L ${x} ${yTop} `;
            }
            const points = [];
            for (let i = startI * 1.01; i <= endI; i *= 1.05) {
                const t = calculateTripTime(i, dev.pickup, dev.tds, dev.curve, dev.instantaneous);
                if (t && t >= view.minY && t <= view.maxY) points.push({ x: toPxX(i), y: toPxY(t), t });
            }
            points.forEach((p, i) => d += `${i === 0 && d === "" ? 'M' : 'L'} ${p.x} ${p.y} `);
            if (dev.instantaneous && dev.instantaneous <= view.maxX) {
                const instX = toPxX(dev.instantaneous);
                const lastY = points.length > 0 ? points[points.length - 1].y : toPxY(100);
                d += `L ${instX} ${lastY} L ${instX} ${toPxY(0.01)}`;
            }
            if (dev.showBand && points.length > 0) {
                const minPoints = points.map(p => ({ x: p.x, y: toPxY(p.t * 0.9) }));
                const maxPoints = points.map(p => ({ x: p.x, y: toPxY(p.t * 1.1) }));
                dMin = maxPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                dMax = [...minPoints].reverse().map((p, i) => `L ${p.x} ${p.y}`).join(' ');
            }
        }

        const isSelected = selectedId === dev.id;
        const handlePickX = toPxX(dev.pickup);
        const handleTDSX = toPxX(dev.pickup * 5);
        const handleTDSY = toPxY(calculateTripTime(dev.pickup * 5, dev.pickup, dev.tds, dev.curve, dev.instantaneous) || 10);

        return (
            <g className="group">
                {dev.showBand && !isEquipment && <path d={`${dMin} ${dMax} Z`} fill={dev.color} fillOpacity="0.1" stroke="none" />}
                <path d={d} fill="none" stroke={dev.color} strokeWidth={strokeWidth} strokeDasharray={strokeDash}
                    className={`transition-all duration-200 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-80'} hover:stroke-[4px] hover:opacity-100 shadow-xl`}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(dev.id); if (!rightPanelOpen) setRightPanelOpen(true); }}
                />
                {!isEquipment && (
                    <text x={handlePickX + 5} y={dims.h - 20} fill={dev.color} fontSize="10" fontWeight="bold" className="pointer-events-none select-none shadow-sm">{dev.name}</text>
                )}
                {isSelected && !dev.locked && !isEquipment && (
                    <g>
                        <rect x={handlePickX - 5} y={dims.h - 12} width={10} height={12} fill={dev.color} stroke="white" strokeWidth="1" className="cursor-ew-resize hover:scale-125 transition-transform" onMouseDown={(e) => { e.stopPropagation(); setDraggingId(dev.id); setDragType('PICKUP'); }} />
                        <circle cx={handleTDSX} cy={handleTDSY} r={5} fill={dev.color} stroke="white" strokeWidth="2" className="cursor-ns-resize hover:scale-125 transition-transform" onMouseDown={(e) => { e.stopPropagation(); setDraggingId(dev.id); setDragType('TDS'); }} />
                    </g>
                )}
            </g>
        );
    };

    const FaultLine = () => {
        const x = toPxX(faultAmps);
        if (x < 0 || x > dims.w) return null;
        return (
            <g className="group cursor-ew-resize" onMouseDown={(e) => { e.stopPropagation(); setDraggingId('FAULT'); setDragType('FAULT'); }}>
                <line x1={x} y1={0} x2={x} y2={dims.h} stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" className="opacity-70 group-hover:opacity-100 transition-opacity" />
                <polygon points={`${x},0 ${x - 6},10 ${x + 6},10`} fill="#ef4444" className="drop-shadow-md group-hover:scale-125 transition-transform origin-top" />
                <text x={x + 8} y={20} fill="#ef4444" fontSize="11" fontWeight="bold" className="pointer-events-none select-none">Fault: {faultAmps.toFixed(0)}A</text>
            </g>
        );
    };

    const handleMouseMove = (e) => {
        if (!graphRef.current) return;
        const rect = graphRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const curAmps = fromPxX(mx);
        const curTime = fromPxY(my);
        setCursor({ x: curAmps, y: curTime });
        if (!draggingId) return;
        if (dragType === 'FAULT') { setFaultAmps(Math.max(view.minX, Math.min(curAmps, view.maxX))); }
        else if (dragType === 'PICKUP') { updateDevice(draggingId, { pickup: Math.round(Math.max(10, curAmps)) }); }
        else if (dragType === 'TDS') {
            const dev = devices.find(d => d.id === draggingId);
            if (dev) {
                const k = calculateTripTime(curAmps, dev.pickup, 1.0, dev.curve, dev.instantaneous);
                if (k) updateDevice(draggingId, { tds: Number(Math.max(0.01, curTime / k).toFixed(2)) });
            }
        }
    };

    const coordinationReport = useMemo(() => {
        const active = devices.filter(d => d.visible);
        // Separate relays from limits
        const relays = active.filter(d => d.type === 'Relay');
        const limits = active.filter(d => d.type === 'Limit');

        const trips = relays.map(d => ({
            id: d.id, name: d.name, color: d.color,
            time: calculateTripTime(faultAmps, d.pickup, d.tds, d.curve, d.instantaneous)
        })).filter(t => t.time !== null).sort((a, b) => a.time - b.time);

        const report = [];

        // Check against limits (Equipment Protection)
        limits.forEach(limit => {
            const limitTime = calculateTripTime(faultAmps, limit.pickup, limit.tds, limit.curve, null);
            if (limitTime) {
                // If a limit exists at this fault current, ALL relays must trip faster than it
                const slowerRelays = trips.filter(t => t.time > limitTime);
                if (slowerRelays.length > 0) {
                    report.push({
                        type: 'VIOLATION',
                        msg: `Equipment Damage! ${limit.name} exceeded by ${slowerRelays[0].name}`,
                        violation: true,
                        val: 0,
                        color: '#ef4444'
                    });
                }
            }
        });

        // Check Relay-Relay Coordination
        for (let i = 0; i < trips.length; i++) {
            const trip = trips[i];
            report.push({ type: 'TRIP', ...trip });
            if (i < trips.length - 1) {
                const nextTrip = trips[i + 1];
                const margin = nextTrip.time - trip.time;
                const isViolation = margin < 0.2;
                report.push({ type: 'MARGIN', val: margin, violation: isViolation, msg: isViolation ? `Critical: Increase Time Dial on ${nextTrip.name}` : 'Coordinated' });
            }
        }
        return report;
    }, [devices, faultAmps]);

    const selectedDevice = devices.find(d => d.id === selectedId);

    // Help Modal
    const HelpModal = ({ onClose }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white"><BookOpen className="w-6 h-6 text-blue-600" /> Quick Start</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    <section><h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> 1. Manipulation</h3><ul className="list-disc pl-5 space-y-1"><li><strong>Select:</strong> Click any curve.</li><li><strong>Drag Pickup:</strong> Adjust current (Square handle).</li><li><strong>Drag TDS:</strong> Adjust time delay (Circle handle).</li><li><strong>Fault Slider:</strong> Drag red line to test faults.</li></ul></section>
                    <section><h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Layers className="w-4 h-4" /> 2. Scenarios</h3><p>Use the "Scenarios" dropdown to load complex setups like Transformer Damage or Motor Starting.</p></section>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-800 dark:text-blue-300 text-center font-bold">Pro Feature: Transformer Damage & Motor Start Curves included.</div>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-b-2xl flex justify-end"><button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Got it</button></div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden select-none font-sans"
            style={{ display: isActive ? 'flex' : 'none' }}
            onMouseMove={handleMouseMove} onMouseUp={() => setDraggingId(null)} onMouseLeave={() => { setDraggingId(null); setCursor(null); }}>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            {/* HEADER TOOLBAR */}
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${!leftPanelOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                        {leftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </button>
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">
                            <Layers className="w-3 h-3 text-blue-500" /> Scenarios <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hidden group-hover:block z-50 p-2">
                            {SCENARIOS.map((s, i) => (
                                <button key={s.id} onClick={() => loadScenario(i)} className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{s.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{s.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-3 py-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-xs font-bold transition-colors">
                        <Info className="w-3 h-3" /> Help
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Zap className="w-3 h-3 text-amber-500 fill-current animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Sim Fault:</span>
                        <input type="number" value={faultAmps} onChange={(e) => setFaultAmps(Number(e.target.value))} className="w-16 bg-transparent text-xs font-mono font-bold outline-none text-right border-b border-slate-300 dark:border-slate-600 focus:border-blue-500" />
                        <span className="text-[10px] text-slate-500 font-bold">A</span>
                    </div>
                    <button onClick={addDevice} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                        <Plus className="w-3 h-3" /> Add Relay
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${!rightPanelOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                        {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* LEFT: INTELLIGENT REPORT */}
                <div className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shrink-0 transition-all duration-300 ease-in-out ${leftPanelOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}>
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider"><Clock className="w-3 h-3 text-slate-400" /> Coordination Check</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
                        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800"></div>
                        {coordinationReport.length > 0 ? coordinationReport.map((item, i) => (
                            <div key={i} className="relative pl-10 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                                {item.type === 'TRIP' ? (
                                    <div className="relative group">
                                        <div className="absolute -left-[30px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-sm z-10" style={{ backgroundColor: item.color }}></div>
                                        <div className="p-2 rounded-lg border bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: item.color }} onClick={() => setSelectedId(item.id)}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col"><span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.name}</span><span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Trip Initiated</span></div>
                                                <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">{item.time.toFixed(3)}s</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="my-1 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            {item.type === 'VIOLATION' ? (
                                                <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm flex items-center gap-1.5 bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200">
                                                    <Flame className="w-3 h-3" /> Violation
                                                </div>
                                            ) : (
                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm flex items-center gap-1.5 ${item.violation ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'}`}>
                                                    {item.violation ? <AlertOctagon className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />} Margin: {item.val.toFixed(3)}s
                                                </div>
                                            )}
                                        </div>
                                        {item.violation && <div className="text-[10px] text-red-600 italic bg-red-50/50 p-1 rounded border-l-2 border-red-400">{item.msg}</div>}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs text-center px-6"><AlertTriangle className="w-8 h-8 mb-2 opacity-20" />No devices operate at {faultAmps}A. <br />Drag the Red Fault Line to test.</div>
                        )}
                    </div>
                    <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Visible Devices</div>
                        <div className="flex flex-wrap gap-2">
                            {devices.map(d => (
                                <button key={d.id} onClick={() => updateDevice(d.id, { visible: !d.visible })} className={`w-3 h-3 rounded-full transition-all border ${d.visible ? 'opacity-100 scale-100' : 'opacity-30 scale-75 grayscale'}`} style={{ backgroundColor: d.color, borderColor: d.color }} title={d.name} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER: INTERACTIVE GRAPH */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden cursor-crosshair flex flex-col">
                    <div ref={graphRef} className="flex-1 relative m-2 bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                        <svg width={dims.w} height={dims.h} className="absolute inset-0 block">
                            {GridLines}
                            {devices.map(dev => <CurvePath key={dev.id} dev={dev} />)}
                            <FaultLine />
                        </svg>
                        {cursor && (
                            <div className="absolute top-4 right-4 bg-slate-900/90 text-white p-2 rounded-lg text-[10px] font-mono backdrop-blur-md pointer-events-none border border-slate-700 shadow-2xl z-30 flex flex-col gap-1 min-w-[120px]">
                                <div className="flex justify-between gap-4"><span className="text-slate-400">Current:</span> <span className="font-bold text-amber-400">{cursor.x.toFixed(1)} A</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-400">Time:</span> <span className="font-bold text-blue-400">{cursor.y.toFixed(3)} s</span></div>
                            </div>
                        )}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                            <button onClick={() => setView(v => ({ ...v, minX: v.minX * 0.8, maxX: v.maxX * 1.2 }))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg hover:bg-slate-50 transition-transform active:scale-95"><ZoomOut className="w-4 h-4 text-slate-500" /></button>
                            <button onClick={() => setView({ minX: 10, maxX: 100000, minY: 0.01, maxY: 1000 })} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg hover:bg-slate-50 transition-transform active:scale-95"><RotateCcw className="w-4 h-4 text-slate-500" /></button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: SETTINGS PANEL */}
                <div className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${rightPanelOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`}>
                    {selectedDevice ? (
                        <>
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: selectedDevice.color }}></div><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedDevice.type} Parameters</span></div>
                                {!selectedDevice.locked && <button onClick={() => removeDevice(selectedDevice.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                            <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                                {selectedDevice.locked ? (
                                    <div className="text-center p-6 text-slate-500 text-xs italic bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <Lock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        This is a protected system curve (Damage or Start Limit). It cannot be edited in this view.
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Relay Name</label><input type="text" value={selectedDevice.name} onChange={(e) => updateDevice(selectedDevice.id, { name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">CT Ratio</label><div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2"><input type="number" value={selectedDevice.ctRatio} onChange={(e) => updateDevice(selectedDevice.id, { ctRatio: Number(e.target.value) })} className="w-full bg-transparent border-none py-1.5 text-xs font-mono font-bold outline-none" /><span className="text-[10px] text-slate-400 font-bold">:1</span></div></div>
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Color</label><div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">{COLORS.slice(0, 4).map(c => (<button key={c} onClick={() => updateDevice(selectedDevice.id, { color: c })} className={`w-4 h-4 rounded-full border-2 transition-transform ${selectedDevice.color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />))}</div></div>
                                            </div>
                                        </div>
                                        <hr className="border-slate-100 dark:border-slate-800" />
                                        <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Characteristic Curve</label><div className="relative"><select value={selectedDevice.curve} onChange={(e) => updateDevice(selectedDevice.id, { curve: e.target.value })} className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-8 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate">{CURVE_LIB.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select><ChevronDown className="absolute right-2 top-3 w-3 h-3 text-slate-400 pointer-events-none" /></div></div>
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                                <div className="flex justify-between items-end mb-2"><label className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase">Pickup (Is)</label><div className="text-right"><div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono leading-none">{selectedDevice.pickup} A</div></div></div>
                                                <input type="range" min="10" max="2000" step="10" value={selectedDevice.pickup} onChange={(e) => updateDevice(selectedDevice.id, { pickup: Number(e.target.value) })} className="w-full h-1.5 bg-blue-200 dark:bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                                <div className="flex justify-between items-end mb-2"><label className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase">Time Dial (TMS)</label><div className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono leading-none">{selectedDevice.tds}</div></div>
                                                <input type="range" min="0.01" max="1.5" step="0.01" value={selectedDevice.tds} onChange={(e) => updateDevice(selectedDevice.id, { tds: Number(e.target.value) })} className="w-full h-1.5 bg-purple-200 dark:bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"><div><div className="text-xs font-bold text-slate-700 dark:text-slate-200">Instantaneous (50)</div></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={!!selectedDevice.instantaneous} onChange={(e) => updateDevice(selectedDevice.id, { instantaneous: e.target.checked ? selectedDevice.pickup * 10 : undefined })} /><div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div></label></div>
                                        {selectedDevice.instantaneous && (<div className="animate-fade-in -mt-4 p-3 pt-0 bg-slate-50 dark:bg-slate-800 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-700"><input type="number" value={selectedDevice.instantaneous} onChange={(e) => updateDevice(selectedDevice.id, { instantaneous: Number(e.target.value) })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1.5 text-xs font-mono font-bold" /></div>)}
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-8 text-center"><MousePointer2 className="w-10 h-10 mb-4 opacity-20" /><p>Select a curve to edit settings</p></div>
                    )}
                </div>
            </div>

            {/* ENGINEERING FOOTER */}
            <div className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 ${footerOpen ? 'h-auto max-h-[40vh]' : 'h-8'} overflow-hidden flex flex-col`}>
                <button onClick={() => setFooterOpen(!footerOpen)} className="w-full h-8 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-slate-100 dark:border-slate-800 transition-colors shrink-0">
                    <GraduationCap className="w-3 h-3" /> Knowledge Base <ChevronUp className={`w-3 h-3 transition-transform duration-300 ${footerOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto">
                    <div className="space-y-3"><h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4" /> Time Dial (TMS)</h4><p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">The <strong>Time Multiplier Setting (TMS)</strong>, also known as Time Dial (TDS), vertically shifts the curve.<br /><br /><em className="text-slate-500">Formula (IEC):</em> t = TMS × [k / ((I/Is)^α - 1)]</p></div>
                    <div className="space-y-3"><h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Shield className="w-4 h-4" /> Coordination Time Interval (CTI)</h4><p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Safety margin required between two devices.<br /><strong>Standard: 0.2s - 0.4s</strong>. This accounts for breaker time, relay overshoot, and errors.</p></div>
                    <div className="space-y-3"><h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4" /> Instantaneous (50)</h4><p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">ANSI 50 element trips with no intentional delay (typically &lt;30ms). <strong>Warning:</strong> Ensure pickup is set <em>above</em> the maximum through-fault current to avoid over-reaching.</p></div>
                </div>
            </div>
        </div>
    );
};

// --- 4. MAIN COMPONENT (DASHBOARD) ---

const TCCStudio = () => {
    const [mode, setMode] = useState('simulator'); // 'theory' | 'simulator' | 'quiz'

    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-black text-lg leading-none tracking-tight text-slate-900 dark:text-white">TCC Studio <span className="text-blue-600">PRO</span></h1>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protection Suite v2.0</span>
                    </div>
                </div>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[
                        { id: 'theory', label: 'Theory', icon: <BookOpen className="w-4 h-4" /> },
                        { id: 'simulator', label: 'Simulator', icon: <Activity className="w-4 h-4" /> },
                        { id: 'quiz', label: 'Quiz', icon: <Trophy className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMode(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === tab.id ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="w-32 hidden md:block">
                    {/* Spacer to balance title */}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {mode === 'theory' && (
                    <div className="h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                        <TheoryModule />
                    </div>
                )}

                {/* Simulator is kept mounted but hidden when not active to preserve state */}
                <SimulatorView isActive={mode === 'simulator'} />

                {mode === 'quiz' && (
                    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
                        <QuizModule />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TCCStudio;