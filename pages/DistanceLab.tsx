import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Zap, Activity, Shield, Target, Layers, BookOpen,
    Settings, Info, Check, X, MousePointer2, AlertOctagon,
    Trophy, RefreshCw, Sliders, Move, Printer,
    Volume2, VolumeX, GraduationCap, Microscope,
    ArrowRight, FileText, Share2, HelpCircle, Triangle,
    ShieldCheck, BrainCircuit, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Engineering Constants ---
const SCALE = 12; // Pixels per Ohm
const CANVAS_SIZE = 500;
const CENTER = CANVAS_SIZE / 2;
const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

// --- Technical Data & Standards ---
const INFO_DB = {
    default: {
        title: "Ready for Simulation",
        desc: "Hover over any element to view technical specifications, IEEE/IEC standards, and operational logic.",
        std: "IEEE C37.113 / IEC 60255"
    },
    chart: {
        title: "R-X Impedance Plane",
        desc: "A complex plane diagram representing the impedance phasor seen by the relay. The horizontal axis represents Resistance (R) and the vertical axis represents Reactance (jX).",
        std: "ANSI 21 Distance"
    },
    fault_point: {
        title: "Fault Impedance Locus",
        desc: "The calculated impedance vector Z = V/I. If this point falls within a characteristic zone, the relay logic initiates a trip timer.",
        std: "V = I x Z"
    },
    zone1: {
        title: "Zone 1 (Underreaching)",
        desc: "Instantaneous protection covering 80-85% of the protected line. Set to underreach to prevent overtripping for external faults due to CT/VT errors.",
        std: "IEEE C37.113 Sec 5.2.1"
    },
    zone2: {
        title: "Zone 2 (Overreaching)",
        desc: "Time-delayed protection (typically 15-30 cycles). Covers 100% of the line plus a safety margin (usually 120% total reach) to handle end-zone faults.",
        std: "IEEE C37.113 Sec 5.2.2"
    },
    zone3: {
        title: "Zone 3 (Remote Backup)",
        desc: "Remote backup protection with the longest time delay. Designed to detect faults on adjacent lines if primary protection fails.",
        std: "IEEE C37.113 Sec 5.2.3"
    },
    mho: {
        title: "Mho Characteristic",
        desc: "A circular impedance characteristic passing through the origin. Inherently directional but has limited resistive reach (arc resistance coverage).",
        std: "Self-Polarized / Cross-Polarized"
    },
    quad: {
        title: "Quadrilateral Characteristic",
        desc: "A polygonal characteristic defined by independent reactance and resistance settings. Superior for ground faults with high arc resistance.",
        std: "Polygonal Earth Fault Element"
    },
    mta: {
        title: "Max Torque Angle (MTA/RCA)",
        desc: "The angle of maximum sensitivity, typically set to match the transmission line's impedance angle to ensure optimal reach accuracy.",
        std: "Range: 75-85 deg typical"
    },
    sir: {
        title: "Source Impedance Ratio (SIR)",
        desc: "Ratio of source impedance to line impedance. High SIR (>30) indicates a weak source, leading to slow voltage recovery and challenging measurement conditions.",
        std: "ZS / ZL"
    }
};

// --- Theory Modules Data ---
const THEORY_MODULES = [
    {
        id: 'fundamentals',
        title: "Protection Philosophy",
        icon: <Shield className="w-5 h-5 text-blue-600" />,
        content: (
            <div className="space-y-3">
                <p>Distance protection is the most common method for protecting high-voltage transmission lines. It measures the impedance (Z = V/I) from the relay location to the fault point. Since impedance is proportional to line length, the relay can pinpoint the fault location.</p>
                <div className="bg-slate-100 p-3 rounded-lg border-l-4 border-blue-500 text-xs">
                    <strong>Key Standard:</strong> IEEE C37.113 Guide for Protective Relay Applications to Transmission Lines.
                </div>
            </div>
        )
    },
    {
        id: 'calculations',
        title: "Setting Calculations & Zones",
        icon: <Target className="w-5 h-5 text-emerald-600" />,
        content: (
            <ul className="list-disc pl-4 space-y-2">
                <li><strong>Zone 1:</strong> Set to 80-85% of line impedance (ZL1). Instantaneous trip. Never set to 100% to avoid overreach due to CT/VT errors (approx 10%) and line parameter inaccuracies (approx 5%).</li>
                <li><strong>Zone 2:</strong> Set to 120% of ZL1. Time delayed (typically 300-400ms). Ensures coverage of the end of the line (arc resistance, errors).</li>
                <li><strong>Zone 3:</strong> Remote backup. Set to cover ZL1 + (Longest Adjacent Line x 1.2). Longest delay (800ms-1s).</li>
            </ul>
        )
    },
    {
        id: 'realworld',
        title: "Real-Life Study Considerations",
        icon: <AlertOctagon className="w-5 h-5 text-amber-600" />,
        content: (
            <div className="space-y-4">
                <div>
                    <strong className="text-slate-900 block">1. Load Encroachment</strong>
                    <span className="block mt-1">Heavy loading reduces the measured impedance, potentially moving the load point into Zone 3. Blinders or shaped characteristics (like Peanut or Lens) must be used to discriminate load from faults.</span>
                </div>
                <div>
                    <strong className="text-slate-900 block">2. Infeed Effect</strong>
                    <span className="block mt-1">Current injection from an intermediate source makes the fault appear further away (impedance increase). This causes Zone 2 to underreach.</span>
                </div>
                <div>
                    <strong className="text-slate-900 block">3. Mutual Coupling</strong>
                    <span className="block mt-1">On parallel lines, zero-sequence mutual coupling (Z0M) affects ground fault measurement, causing overreach or underreach depending on current direction.</span>
                </div>
            </div>
        )
    }
];

// --- Quiz Question Bank ---
const QUESTION_BANK = [
    // EASY
    { id: 1, difficulty: 'easy', q: "What is the primary input required for a distance relay to calculate impedance?", options: ["Current only", "Voltage only", "Voltage and Current", "Frequency"], a: 2, explanation: "Z = V/I. Both voltage and current quantities are needed." },
    { id: 2, difficulty: 'easy', q: "Why is Zone 1 typically set to less than 100% of the line length?", options: ["To save energy", "To allow for Zone 2 backup", "To prevent overreaching due to errors", "Because the relay cannot see further"], a: 2, explanation: "CT/VT errors and line parameter inaccuracies can cause the relay to 'see' further than reality." },
    { id: 3, difficulty: 'easy', q: "Which characteristic is inherently directional?", options: ["Impedance (Plain)", "Reactance", "Mho", "Offset Mho"], a: 2, explanation: "The Mho characteristic passes through the origin, providing inherent directionality." },
    { id: 4, difficulty: 'easy', q: "What is the typical time delay for Zone 1?", options: ["Instantaneous (0s)", "300ms", "500ms", "1000ms"], a: 0, explanation: "Zone 1 is the primary protection for the line itself and must operate immediately." },
    { id: 5, difficulty: 'easy', q: "What does SIR stand for in protection engineering?", options: ["System Integrity Report", "Source Impedance Ratio", "Signal Input Range", "Series Inductance Reactance"], a: 1, explanation: "Source Impedance Ratio = Z_source / Z_line." },

    // MEDIUM
    { id: 6, difficulty: 'medium', q: "Which fault type typically has the highest arc resistance?", options: ["3-Phase", "Phase-to-Phase", "Single Line to Ground", "Bolted Fault"], a: 2, explanation: "Ground faults often involve trees or high-resistance soil paths, resulting in significant arc resistance." },
    { id: 7, difficulty: 'medium', q: "How does the 'Infeed Effect' influence a distance relay?", options: ["Causes Overreach", "Causes Underreach", "No Effect", "Causes instant trip"], a: 1, explanation: "Infeed from another source increases the voltage at the relay point for the same current, making impedance appear larger (Underreach)." },
    { id: 8, difficulty: 'medium', q: "What is the purpose of 'Load Encroachment' logic?", options: ["To trip on high load", "To prevent tripping on high load", "To monitor power quality", "To measure line length"], a: 1, explanation: "It prevents Zone 3 tripping during heavy load conditions when impedance Z = V/I drops significantly." },
    { id: 9, difficulty: 'medium', q: "Ideally, the MTA (Maximum Torque Angle) should match:", options: ["The Load Angle", "The Source Angle", "The Line Impedance Angle", "90 Degrees"], a: 2, explanation: "Matching the line angle ensures the characteristic aligns with the fault locus." },
    { id: 10, difficulty: 'medium', q: "What is K0 factor used for?", options: ["Phase Faults", "Ground Fault Compensation", "Power Swing Blocking", "Load Shedding"], a: 1, explanation: "K0 compensates for the difference between positive and zero sequence impedance in ground distance calculations." },

    // HARD
    { id: 11, difficulty: 'hard', q: "In a Quadrilateral characteristic, the resistive reach is set independently to cover:", options: ["Line Reactance", "Arc Resistance", "Source Impedance", "Mutual Coupling"], a: 1, explanation: "Quad relays allow expanding the R-axis coverage for arc resistance without affecting the X-axis reach." },
    { id: 12, difficulty: 'hard', q: "Zero-sequence mutual coupling typically affects which protection element?", options: ["Zone 1 Phase", "Ground Distance Elements", "Overvoltage", "Negative Sequence Overcurrent"], a: 1, explanation: "Mutual coupling induces zero-sequence voltage on parallel lines, distorting the Z0 measurement." },
    { id: 13, difficulty: 'hard', q: "Power Swing Blocking (PSB) logic differentiates a swing from a fault by monitoring:", options: ["Rate of change of Impedance (dZ/dt)", "Voltage Magnitude", "Current Magnitude", "Frequency"], a: 0, explanation: "Faults cause an instant jump in Z, while power swings cause a gradual change. dZ/dt detects this speed." },
    { id: 14, difficulty: 'hard', q: "A 'Weak Infeed' logic is typically associated with:", options: ["Zone 1", "POTT / PUTT Schemes", "Differential Protection", "Overcurrent"], a: 1, explanation: "In communication schemes, weak infeed logic ensures a trip even if one end cannot supply enough current to pick up." },
    { id: 15, difficulty: 'hard', q: "What happens to the reach of a Mho relay if it is Cross-Polarized?", options: ["It decreases", "It expands for resistive faults", "It becomes non-directional", "It oscillates"], a: 1, explanation: "Cross-polarization uses healthy phase voltage to maintain directionality and expand the characteristic during unbalanced faults." },
];

// --- Helper Functions ---

const toRad = (deg) => deg * DEG_TO_RAD;

// Check if point (r, x) is inside a Mho circle
const checkMho = (reach, r, x, mta) => {
    const mtaRad = toRad(mta);
    const radius = reach / 2;
    const centerX = radius * Math.cos(mtaRad);
    const centerY = radius * Math.sin(mtaRad);
    const distance = Math.sqrt(Math.pow(r - centerX, 2) + Math.pow(x - centerY, 2));
    return distance <= radius;
};

// Check if point (r, x) is inside a Quad
const checkQuad = (reachX, reachR, r, x, mta, tilt = 0) => {
    const isForward = x > -0.2 * reachX; // Directional element
    const topBoundary = x <= (reachX + (r * Math.tan(toRad(tilt)))); // Reactance Line
    const rightBoundary = r <= reachR; // Resistive Blinder
    const leftBoundary = r >= -0.3 * reachR; // Reverse Reach (Close-in faults)
    return isForward && topBoundary && rightBoundary && leftBoundary;
};

// --- Components ---

const InfoPanel = ({ context }) => (
    <div className="bg-slate-50 border-t border-slate-200 p-4 min-h-[140px] transition-all duration-300">
        <div className="flex items-start gap-4">
            <div className="bg-blue-600 p-2 rounded-lg shrink-0 mt-1">
                <Microscope className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2 w-full">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        {context.title}
                    </h4>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded uppercase tracking-wider border border-slate-300">
                        {context.std}
                    </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {context.desc}
                </p>
            </div>
        </div>
    </div>
);

const Knob = ({ value, onChange, min, max, label, unit, step = 0.1, onHover, onLeave }) => (
    <div
        className="flex flex-col gap-2 p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-400 transition-colors shadow-sm"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
    >
        <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{value.toFixed(1)}{unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
        />
    </div>
);

const TabButton = ({ active, onClick, icon, label, onHover }) => (
    <button
        onClick={onClick}
        onMouseEnter={onHover}
        className={`flex items-center gap-2 px-4 lg:px-6 py-3 text-sm font-bold transition-all duration-200 border-b-2 ${active
            ? 'text-blue-600 border-blue-600 bg-blue-50'
            : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
            }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

// --- Main Application ---

export default function RelaySimUltra() {
    const [activeTab, setActiveTab] = useState('sim'); // sim, theory, quiz
    const [context, setContext] = useState(INFO_DB.default);

    // Settings
    const [settings, setSettings] = useState({
        charType: 'MHO', // MHO, QUAD
        mta: 75,
        tilt: 5,
        z1Reach: 8.0,
        z2Reach: 12.0,
        z3Reach: 18.0,
        z1Time: 0,
        z2Time: 300,
        z3Time: 1000,
        quadResReach: 10.0,
    });

    const [fault, setFault] = useState({ r: 5, x: 5 });
    const [status, setStatus] = useState({ trip: false, zone: 'NONE', time: 0 });
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const svgRef = useRef(null);

    // Quiz State
    const [quizState, setQuizState] = useState({
        active: false,
        difficulty: null,
        questions: [],
        currentIdx: 0,
        score: 0,
        showResult: false,
        feedback: null
    });

    // --- Handlers ---
    const handleHover = (key) => setContext(INFO_DB[key] || INFO_DB.default);
    const clearHover = () => setContext(INFO_DB.default);

    // Quiz Logic
    const startQuiz = (difficulty) => {
        // Select 5 random questions of the chosen difficulty
        const pool = QUESTION_BANK.filter(q => q.difficulty === difficulty);
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);

        setQuizState({
            active: true,
            difficulty,
            questions: selected,
            currentIdx: 0,
            score: 0,
            showResult: false,
            feedback: null
        });
    };

    const handleQuizAnswer = (optionIdx) => {
        const currentQ = quizState.questions[quizState.currentIdx];
        const isCorrect = optionIdx === currentQ.a;

        setQuizState(prev => ({
            ...prev,
            feedback: {
                correct: isCorrect,
                text: isCorrect ? "Correct!" : "Incorrect.",
                explanation: currentQ.explanation
            },
            score: isCorrect ? prev.score + 1 : prev.score
        }));
    };

    const nextQuestion = () => {
        if (quizState.currentIdx < 4) {
            setQuizState(prev => ({
                ...prev,
                currentIdx: prev.currentIdx + 1,
                feedback: null
            }));
        } else {
            setQuizState(prev => ({ ...prev, showResult: true }));
        }
    };

    // Trip Logic
    useEffect(() => {
        let activeZone = 'NONE';
        const { r, x } = fault;
        const { z1Reach, z2Reach, z3Reach, mta, tilt, charType, quadResReach } = settings;

        const inZ1 = charType === 'MHO' ? checkMho(z1Reach, r, x, mta) : checkQuad(z1Reach, quadResReach * 0.8, r, x, mta, tilt);
        const inZ2 = charType === 'MHO' ? checkMho(z2Reach, r, x, mta) : checkQuad(z2Reach, quadResReach, r, x, mta, tilt);
        const inZ3 = charType === 'MHO' ? checkMho(z3Reach, r, x, mta) : checkQuad(z3Reach, quadResReach * 1.2, r, x, mta, tilt);

        if (inZ1) activeZone = 'Z1';
        else if (inZ2) activeZone = 'Z2';
        else if (inZ3) activeZone = 'Z3';

        if (activeZone !== 'NONE') {
            setStatus({
                trip: true,
                zone: activeZone,
                time: activeZone === 'Z1' ? settings.z1Time : activeZone === 'Z2' ? settings.z2Time : settings.z3Time
            });
        } else {
            setStatus({ trip: false, zone: 'NONE', time: 0 });
        }
    }, [fault, settings]);

    const handleSvgClick = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Scale Logic
        const r = (clickX - CENTER) / SCALE;
        const x = -(clickY - CENTER) / SCALE;

        setFault({ r, x });
    };

    // --- Render Helpers ---
    const getMhoPath = (reach, mta) => {
        const radiusVal = reach / 2;
        const cx = CENTER + (radiusVal * Math.cos(toRad(mta))) * SCALE;
        const cy = CENTER - (radiusVal * Math.sin(toRad(mta))) * SCALE;
        const rPixels = radiusVal * SCALE;
        return <circle cx={cx} cy={cy} r={rPixels} fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />;
    };

    const getQuadPath = (reachX, reachR, mta, tilt) => {
        const p1 = { r: -0.2 * reachR, x: -0.2 * reachX };
        const p2 = { r: -0.2 * reachR, x: reachX - (0.2 * reachR * Math.tan(toRad(tilt))) };
        const p3 = { r: reachR, x: reachX + (reachR * Math.tan(toRad(tilt))) };
        const p4 = { r: reachR, x: -0.2 * reachX };
        const toSVG = (pt) => `${CENTER + pt.r * SCALE},${CENTER - pt.x * SCALE}`;
        return <polygon points={`${toSVG(p1)} ${toSVG(p2)} ${toSVG(p3)} ${toSVG(p4)}`} fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />;
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col overflow-hidden">

            {/* --- Professional Header --- */}
            <header className="bg-white border-b border-slate-300 px-6 py-4 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 text-white p-2 rounded-lg">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">RELAY SIM <span className="text-blue-600">ULTRA</span></h1>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                            <span>Ver 2.5.0</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>IEEE C37.113 Compliant</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={`p-2 rounded-md border transition-all ${voiceEnabled ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        title={voiceEnabled ? "Mute Voice Guide" : "Enable Voice Guide"}
                    >
                        {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                        <Printer className="w-4 h-4" /> EXPORT REPORT
                    </button>
                    <div className="h-8 w-px bg-slate-300 mx-2 hidden md:block" />
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded border border-slate-200">
                        <div className={`w-2 h-2 rounded-full ${status.trip ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-bold text-slate-700">{status.trip ? 'TRIP ACTIVE' : 'SYSTEM HEALTHY'}</span>
                    </div>
                </div>
            </header>

            {/* --- Main Workspace --- */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

                {/* --- Left Panel: R-X Diagram (Visible only in Sim & Theory modes) --- */}
                <div className={`flex-1 p-4 lg:p-8 overflow-y-auto flex flex-col items-center justify-center bg-slate-50 relative ${activeTab === 'quiz' ? 'hidden lg:flex' : ''} min-h-[400px] lg:min-h-auto border-b lg:border-b-0 lg:border-r border-slate-200`}>

                    {/* Axis Labels */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 font-mono text-xs text-slate-400 font-bold">+ jX (Reactance Ω)</div>
                    <div className="absolute top-1/2 right-8 -translate-y-1/2 font-mono text-xs text-slate-400 font-bold rotate-90">+ R (Resistance Ω)</div>

                    {/* Chart Container */}
                    <div
                        className="relative bg-white rounded-xl border border-slate-300 shadow-xl overflow-hidden cursor-crosshair group w-full max-w-[500px] aspect-square"
                        onMouseEnter={() => handleHover('chart')}
                        onMouseLeave={clearHover}
                    >
                        {/* SVG Layer */}
                        <div
                            className="absolute inset-0 z-10"
                            onClick={handleSvgClick}
                            ref={svgRef}
                        >
                            <svg width="100%" height="100%" viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
                                {/* Grid */}
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />

                                {/* Axes */}
                                <line x1="0" y1={CENTER} x2={CANVAS_SIZE} y2={CENTER} stroke="#94a3b8" strokeWidth="2" />
                                <line x1={CENTER} y1="0" x2={CENTER} y2={CANVAS_SIZE} stroke="#94a3b8" strokeWidth="2" />

                                {/* Zones (Interactive) */}
                                <g className="text-emerald-500 hover:text-emerald-600 transition-colors" onMouseEnter={(e) => { e.stopPropagation(); handleHover('zone3'); }}>
                                    {settings.charType === 'MHO'
                                        ? getMhoPath(settings.z3Reach, settings.mta)
                                        : getQuadPath(settings.z3Reach, settings.quadResReach * 1.2, settings.mta, settings.tilt)}
                                </g>
                                <g className="text-amber-500 hover:text-amber-600 transition-colors" onMouseEnter={(e) => { e.stopPropagation(); handleHover('zone2'); }}>
                                    {settings.charType === 'MHO'
                                        ? getMhoPath(settings.z2Reach, settings.mta)
                                        : getQuadPath(settings.z2Reach, settings.quadResReach, settings.mta, settings.tilt)}
                                </g>
                                <g className="text-red-500 hover:text-red-600 transition-colors" onMouseEnter={(e) => { e.stopPropagation(); handleHover('zone1'); }}>
                                    {settings.charType === 'MHO'
                                        ? getMhoPath(settings.z1Reach, settings.mta)
                                        : getQuadPath(settings.z1Reach, settings.quadResReach * 0.8, settings.mta, settings.tilt)}
                                </g>

                                {/* Vector & Fault */}
                                <line
                                    x1={CENTER} y1={CENTER}
                                    x2={CENTER + fault.r * SCALE} y2={CENTER - fault.x * SCALE}
                                    stroke={status.trip ? "#ef4444" : "#3b82f6"}
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                />
                                <circle
                                    cx={CENTER + fault.r * SCALE}
                                    cy={CENTER - fault.x * SCALE}
                                    r="6"
                                    className={`${status.trip ? 'fill-red-500 animate-pulse' : 'fill-blue-600'}`}
                                    onMouseEnter={(e) => { e.stopPropagation(); handleHover('fault_point'); }}
                                />
                            </svg>
                        </div>

                        {/* Live Measurements Overlay */}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-lg text-xs font-mono shadow-sm pointer-events-none">
                            <div className="flex justify-between gap-4"><span>Z_mag:</span> <span className="font-bold text-slate-900">{Math.sqrt(fault.r ** 2 + fault.x ** 2).toFixed(2)}Ω</span></div>
                            <div className="flex justify-between gap-4"><span>Angle:</span> <span className="font-bold text-slate-900">{(Math.atan2(fault.x, fault.r) * RAD_TO_DEG).toFixed(1)}°</span></div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 border border-red-500 rounded-sm"></div> Zone 1 (Inst.)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-100 border border-amber-500 rounded-sm"></div> Zone 2 (Delayed)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-100 border border-emerald-500 rounded-sm"></div> Zone 3 (Backup)</div>
                    </div>
                </div>

                {/* --- Right Panel: Controls, Theory & Quiz --- */}
                <div className={`w-full lg:w-[480px] bg-white flex flex-col shadow-xl z-10 ${activeTab === 'quiz' ? 'w-full lg:w-full' : ''}`}>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
                        <TabButton active={activeTab === 'sim'} onClick={() => setActiveTab('sim')} icon={<Sliders className="w-4 h-4" />} label="Parameters" onHover={() => handleHover('default')} />
                        <TabButton active={activeTab === 'theory'} onClick={() => setActiveTab('theory')} icon={<BookOpen className="w-4 h-4" />} label="Theory Hub" onHover={() => handleHover('default')} />
                        <TabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={<BrainCircuit className="w-4 h-4" />} label="Quiz" onHover={() => handleHover('default')} />
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                        {/* SIMULATION MODE */}
                        {activeTab === 'sim' && (
                            <div className="space-y-6">
                                {/* Trip Status Banner */}
                                <div className={`p-4 rounded-lg border-l-4 shadow-sm transition-all ${status.trip ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-300'}`}>
                                    <h3 className={`font-bold text-sm uppercase flex items-center gap-2 ${status.trip ? 'text-red-700' : 'text-slate-600'}`}>
                                        {status.trip ? <AlertOctagon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                        Relay Status: {status.trip ? 'TRIPPED' : 'MONITORING'}
                                    </h3>
                                    <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <span className="text-slate-500 block">Active Zone</span>
                                            <span className="font-mono font-bold text-slate-900 text-lg">{status.zone}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Operating Time</span>
                                            <span className="font-mono font-bold text-slate-900 text-lg">{status.time}ms</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Characteristic Selection */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Characteristic Shape</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, charType: 'MHO' }))}
                                            onMouseEnter={() => handleHover('mho')}
                                            onMouseLeave={clearHover}
                                            className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${settings.charType === 'MHO' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="w-4 h-4 rounded-full border-2 border-current" /> Mho Circle
                                        </button>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, charType: 'QUAD' }))}
                                            onMouseEnter={() => handleHover('quad')}
                                            onMouseLeave={clearHover}
                                            className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${settings.charType === 'QUAD' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="w-4 h-4 border-2 border-current" /> Quadrilateral
                                        </button>
                                    </div>
                                </div>

                                {/* Settings Sliders */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Reach Configuration</h4>

                                    <Knob
                                        label="Line Angle (MTA)" value={settings.mta} min={30} max={90} unit="°"
                                        onChange={v => setSettings(s => ({ ...s, mta: v }))}
                                        onHover={() => handleHover('mta')} onLeave={clearHover}
                                    />

                                    <Knob
                                        label="Zone 1 Reach (80%)" value={settings.z1Reach} min={1} max={25} unit="Ω"
                                        onChange={v => setSettings(s => ({ ...s, z1Reach: v }))}
                                        onHover={() => handleHover('zone1')} onLeave={clearHover}
                                    />

                                    <Knob
                                        label="Zone 2 Reach (120%)" value={settings.z2Reach} min={1} max={25} unit="Ω"
                                        onChange={v => setSettings(s => ({ ...s, z2Reach: v }))}
                                        onHover={() => handleHover('zone2')} onLeave={clearHover}
                                    />

                                    <Knob
                                        label="Zone 3 Reach (Backup)" value={settings.z3Reach} min={1} max={25} unit="Ω"
                                        onChange={v => setSettings(s => ({ ...s, z3Reach: v }))}
                                        onHover={() => handleHover('zone3')} onLeave={clearHover}
                                    />
                                </div>
                            </div>
                        )}

                        {/* THEORY MODE */}
                        {activeTab === 'theory' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-900">
                                    <h3 className="font-bold flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4" /> The Relay Engineer's Handbook</h3>
                                    <p>Comprehensive guide to Distance Protection as per IEEE C37.113. Understanding these concepts is critical for real-world application.</p>
                                </div>

                                <div className="space-y-4">
                                    {THEORY_MODULES.map((module) => (
                                        <div key={module.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-3">
                                                <div className="p-1.5 bg-white rounded-md border border-slate-200 shadow-sm">{module.icon}</div>
                                                <h4 className="font-bold text-slate-800">{module.title}</h4>
                                            </div>
                                            <div className="p-4 text-sm text-slate-600 leading-relaxed">
                                                {module.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* QUIZ MODE */}
                        {activeTab === 'quiz' && (
                            <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4">
                                {!quizState.active ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
                                        <div className="p-6 bg-blue-50 rounded-full border-4 border-blue-100">
                                            <BrainCircuit className="w-16 h-16 text-blue-600" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-bold text-slate-900">Protection Knowledge Check</h3>
                                            <p className="text-slate-500 max-w-xs mx-auto">Select your difficulty level. 5 questions will be randomly selected from the bank.</p>
                                        </div>
                                        <div className="grid grid-cols-1 w-full max-w-xs gap-3">
                                            <button onClick={() => startQuiz('easy')} className="p-4 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl font-bold text-slate-700 transition-all shadow-sm">
                                                Easy Mode
                                            </button>
                                            <button onClick={() => startQuiz('medium')} className="p-4 bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50 rounded-xl font-bold text-slate-700 transition-all shadow-sm">
                                                Medium Mode
                                            </button>
                                            <button onClick={() => startQuiz('hard')} className="p-4 bg-white border border-slate-200 hover:border-red-500 hover:bg-red-50 rounded-xl font-bold text-slate-700 transition-all shadow-sm">
                                                Specialist Mode
                                            </button>
                                        </div>
                                    </div>
                                ) : quizState.showResult ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
                                        <Trophy className={`w-20 h-20 ${quizState.score >= 4 ? 'text-yellow-500' : 'text-slate-300'}`} />
                                        <div className="text-center">
                                            <h3 className="text-3xl font-bold text-slate-900">{quizState.score} / 5</h3>
                                            <p className="text-slate-500 mt-2">
                                                {quizState.score === 5 ? "Perfect Score! You are a Protection Engineer." :
                                                    quizState.score >= 3 ? "Good job! Keep studying." : "Needs more practice."}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setQuizState(prev => ({ ...prev, active: false }))}
                                            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                        >
                                            Try Another Quiz
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {quizState.currentIdx + 1} of 5</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${quizState.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                                                quizState.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                }`}>{quizState.difficulty}</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 mb-6 leading-relaxed">
                                            {quizState.questions[quizState.currentIdx].q}
                                        </h3>

                                        <div className="space-y-3 mb-6">
                                            {quizState.questions[quizState.currentIdx].options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    disabled={!!quizState.feedback}
                                                    onClick={() => handleQuizAnswer(i)}
                                                    className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all ${quizState.feedback
                                                        ? i === quizState.questions[quizState.currentIdx].a
                                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                                            : quizState.feedback && i !== quizState.questions[quizState.currentIdx].a
                                                                ? 'opacity-50 bg-slate-50'
                                                                : ''
                                                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{opt}</span>
                                                        {quizState.feedback && i === quizState.questions[quizState.currentIdx].a && <Check className="w-5 h-5 text-emerald-600" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {quizState.feedback && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-4 rounded-lg mb-6 ${quizState.feedback.correct ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    {quizState.feedback.correct ? <Check className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-red-600" />}
                                                    <span className={`font-bold ${quizState.feedback.correct ? 'text-emerald-800' : 'text-red-800'}`}>{quizState.feedback.text}</span>
                                                </div>
                                                <p className="text-sm text-slate-700">{quizState.feedback.explanation}</p>
                                            </motion.div>
                                        )}

                                        {quizState.feedback && (
                                            <div className="mt-auto">
                                                <button
                                                    onClick={nextQuestion}
                                                    className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center justify-center gap-2"
                                                >
                                                    {quizState.currentIdx < 4 ? "Next Question" : "See Results"} <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* --- Live Context Panel (Bottom of Sidebar) - Only in Sim Mode --- */}
                    {activeTab === 'sim' && <InfoPanel context={context} />}

                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
        </div>
    );
}