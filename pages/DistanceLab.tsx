import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Zap, Activity, Shield, Target, Layers, BookOpen,
    Settings, Info, Check, X, MousePointer2, AlertOctagon,
    Trophy, RefreshCw, Sliders, Move, Printer,
    Volume2, VolumeX, GraduationCap, Microscope,
    ArrowRight, FileText, Share2, Maximize, Minimize, Navigation,
    TrendingUp, Radio, BrainCircuit, ShieldCheck
} from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import TheoryLibrary from '../components/TheoryLibrary';
import { DISTANCE_THEORY_CONTENT } from '../data/learning-modules/distance';
import { Card } from '../components/UI/Card';
import { Slider } from '../components/UI/Slider';
import { LaTeX } from '../components/UI/LaTeX';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { PageSEO } from "../components/SEO/PageSEO";
import { usePersistentState } from "../hooks/usePersistentState";
import { useTripFeedback } from "../hooks/useTripFeedback";
import { AICopyButton } from "../components/UI/AICopyButton";
import Odometer from '../components/Odometer';

const distanceSchema: Record<string, any> = {
    "@type": "WebApplication",
    "name": "Distance Lab — Relay Simulation Ultra",
    "description": "Professional distance protection (ANSI 21) simulator. Explore R-X diagrams, Mho and Quadrilateral characteristics, and zone coordination.",
    "applicationCategory": "EngineeringApplication",
    "operatingSystem": "WebBrowser",
};

// --- Engineering Constants ---
const SCALE = 12; // Pixels per Ohm
const CANVAS_SIZE = 500;
const CENTER = CANVAS_SIZE / 2;
const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

// --- Technical Data & Standards ---
const INFO_DB: Record<string, { title: string, desc: string, std: string }> = {
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

// --- Helper Functions ---
const toRad = (deg: number) => deg * DEG_TO_RAD;

// Check if point (r, x) is inside a Mho circle
const checkMho = (reach: number, r: number, x: number, mta: number) => {
    const mtaRad = toRad(mta);
    const radius = reach / 2;
    const centerX = radius * Math.cos(mtaRad);
    const centerY = radius * Math.sin(mtaRad);
    const distance = Math.sqrt(Math.pow(r - centerX, 2) + Math.pow(x - centerY, 2));
    return distance <= radius;
};

// Check if point (r, x) is inside a Quad
const checkQuad = (reachX: number, reachR: number, r: number, x: number, mta: number, tilt = 0) => {
    const revX = -0.2 * reachX;
    const revR = -0.2 * reachR;
    const isForward = x >= revX; 
    const topBoundary = x <= (reachX + (r * Math.tan(toRad(tilt)))); 
    const rightBoundary = r <= reachR; 
    const leftBoundary = r >= revR; 
    return isForward && topBoundary && rightBoundary && leftBoundary;
};

// --- QUESTION BANK ---
const QUESTION_BANK = [
    { id: 1, difficulty: 'easy', q: "What is the primary input required for a distance relay to calculate impedance?", options: ["Current only", "Voltage only", "Voltage and Current", "Frequency"], a: 2, explanation: "Z = V/I. Both voltage and current quantities are needed." },
    { id: 2, difficulty: 'easy', q: "Why is Zone 1 typically set to less than 100% of the line length?", options: ["To save energy", "To allow for Zone 2 backup", "To prevent overreaching due to errors", "Because the relay cannot see further"], a: 2, explanation: "CT/VT errors and line parameter inaccuracies can cause the relay to 'see' further than reality." },
    { id: 3, difficulty: 'easy', q: "Which characteristic is inherently directional?", options: ["Impedance (Plain)", "Reactance", "Mho", "Offset Mho"], a: 2, explanation: "The Mho characteristic passes through the origin, providing inherent directionality." },
    { id: 4, difficulty: 'easy', q: "What is the typical time delay for Zone 1?", options: ["Instantaneous (0s)", "300ms", "500ms", "1000ms"], a: 0, explanation: "Zone 1 is the primary protection for the line itself and must operate immediately." },
    { id: 5, difficulty: 'easy', q: "What does SIR stand for in protection engineering?", options: ["System Integrity Report", "Source Impedance Ratio", "Signal Input Range", "Series Inductance Reactance"], a: 1, explanation: "Source Impedance Ratio = Z_source / Z_line." },
    { id: 6, difficulty: 'medium', q: "Which fault type typically has the highest arc resistance?", options: ["3-Phase", "Phase-to-Phase", "Single Line to Ground", "Bolted Fault"], a: 2, explanation: "Ground faults often involve trees or high-resistance soil paths, resulting in significant arc resistance." },
    { id: 7, difficulty: 'medium', q: "How does the 'Infeed Effect' influence a distance relay?", options: ["Causes Overreach", "Causes Underreach", "No Effect", "Causes instant trip"], a: 1, explanation: "Infeed from another source increases the voltage at the relay point for the same current, making impedance appear larger (Underreach)." },
    { id: 8, difficulty: 'medium', q: "What is the purpose of 'Load Encroachment' logic?", options: ["To trip on high load", "To prevent tripping on high load", "To monitor power quality", "To measure line length"], a: 1, explanation: "It prevents Zone 3 tripping during heavy load conditions when impedance Z = V/I drops significantly." },
    { id: 9, difficulty: 'medium', q: "Ideally, the MTA (Maximum Torque Angle) should match:", options: ["The Load Angle", "The Source Angle", "The Line Impedance Angle", "90 Degrees"], a: 2, explanation: "Matching the line angle ensures the characteristic aligns with the fault locus." },
    { id: 10, difficulty: 'medium', q: "What is K0 factor used for?", options: ["Phase Faults", "Ground Fault Compensation", "Power Swing Blocking", "Load Shedding"], a: 1, explanation: "K0 compensates for the difference between positive and zero sequence impedance in ground distance calculations." },
    { id: 11, difficulty: 'hard', q: "In a Quadrilateral characteristic, the resistive reach is set independently to cover:", options: ["Line Reactance", "Arc Resistance", "Source Impedance", "Mutual Coupling"], a: 1, explanation: "Quad relays allow expanding the R-axis coverage for arc resistance without affecting the X-axis reach." },
    { id: 12, difficulty: 'hard', q: "Zero-sequence mutual coupling typically affects which protection element?", options: ["Zone 1 Phase", "Ground Distance Elements", "Overvoltage", "Negative Sequence Overcurrent"], a: 1, explanation: "Mutual coupling induces zero-sequence voltage on parallel lines, distorting the Z0 measurement." },
    { id: 13, difficulty: 'hard', q: "Power Swing Blocking (PSB) logic differentiates a swing from a fault by monitoring:", options: ["Rate of change of Impedance (dZ/dt)", "Voltage Magnitude", "Current Magnitude", "Frequency"], a: 0, explanation: "Faults cause an instant jump in Z, while power swings cause a gradual change. dZ/dt detects this speed." },
    { id: 14, difficulty: 'hard', q: "A 'Weak Infeed' logic is typically associated with:", options: ["Zone 1", "POTT / PUTT Schemes", "Differential Protection", "Overcurrent"], a: 1, explanation: "In communication schemes, weak infeed logic ensures a trip even if one end cannot supply enough current to pick up." },
    { id: 15, difficulty: 'hard', q: "What happens to the reach of a Mho relay if it is Cross-Polarized?", options: ["It decreases", "It expands for resistive faults", "It becomes non-directional", "It oscillates"], a: 1, explanation: "Cross-polarization uses healthy phase voltage to maintain directionality and expand the characteristic during unbalanced faults." },
];

// --- MISSIONS ---
const MISSIONS = [
    { id: 1, title: "Zone 1 Underreach", desc: "Set Zone 1 to protect exactly 80% of a 10 Ohm transmission line with an angle of 75 degrees. Use MHO characteristic.", target: { charType: 'MHO', z1Reach: 8.0, mta: 75 } },
    { id: 2, title: "Zone 2 Overreach", desc: "Set Zone 2 to 120% of a 10 Ohm line. Maintain the same MTA of 75 degrees.", target: { charType: 'MHO', z2Reach: 12.0, mta: 75 } },
    { id: 3, title: "Resistive Coverage", desc: "Switch to a Quadrilateral characteristic. Set Zone 1 reach to 8.0 Ohms and expand the resistive reach to 15.0 Ohms to cover high arc resistance.", target: { charType: 'QUAD', z1Reach: 8.0, quadResReach: 15.0 } }
];

export default function RelaySimUltra() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState('sim'); // sim, theory, quiz, missions
    const [context, setContext] = useState(INFO_DB.default);

    // Settings with Persistence
    const [settings, setSettings] = usePersistentState('dist_settings', {
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

    const [fault, setFault] = usePersistentState('dist_fault', { r: 5, x: 5 });
    const [status, setStatus] = useState({ trip: false, zone: 'NONE', time: 0 });
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const { isTripping, triggerTrip } = useTripFeedback();
    const svgRef = useRef<SVGSVGElement>(null);

    // Quiz State
    const [quizState, setQuizState] = useState<any>({
        active: false,
        difficulty: null,
        questions: [],
        currentIdx: 0,
        score: 0,
        showResult: false,
        feedback: null
    });

    // Mission State
    const [activeMission, setActiveMission] = useState<any>(null);
    const [missionStatus, setMissionStatus] = useState<'IDLE' | 'SUCCESS' | 'FAIL'>('IDLE');

    // Sync status and trip logic
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

        if (activeZone !== 'NONE' && activeZone !== status.zone) {
            triggerTrip();
        }

        setStatus({
            trip: activeZone !== 'NONE',
            zone: activeZone,
            time: activeZone === 'Z1' ? settings.z1Time : activeZone === 'Z2' ? settings.z2Time : activeZone === 'Z3' ? settings.z3Time : 0
        });
    }, [fault, settings, triggerTrip, status.zone]);

    const handleSvgClick = (e: React.MouseEvent) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const r = (clickX - CENTER) / SCALE;
        const x = -(clickY - CENTER) / SCALE;
        setFault({ r, x });
    };

    const startQuiz = (difficulty: string) => {
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

    const handleQuizAnswer = (optionIdx: number) => {
        const currentQ = quizState.questions[quizState.currentIdx];
        const isCorrect = optionIdx === currentQ.a;
        setQuizState((prev: any) => ({
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
            setQuizState((prev: any) => ({
                ...prev,
                currentIdx: prev.currentIdx + 1,
                feedback: null
            }));
        } else {
            setQuizState((prev: any) => ({ ...prev, showResult: true }));
        }
    };

    const getMhoPath = (reach: number, mta: number) => {
        const radiusVal = reach / 2;
        const cx = CENTER + (radiusVal * Math.cos(toRad(mta))) * SCALE;
        const cy = CENTER - (radiusVal * Math.sin(toRad(mta))) * SCALE;
        const rPixels = radiusVal * SCALE;
        return <circle cx={cx} cy={cy} r={rPixels} fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />;
    };

    const getQuadPath = (reachX: number, reachR: number, mta: number, tilt: number) => {
        const revX = -0.2 * reachX;
        const revR = -0.2 * reachR;
        const p1 = { r: revR, x: revX };
        const p2 = { r: revR, x: reachX + (revR * Math.tan(toRad(tilt))) };
        const p3 = { r: reachR, x: reachX + (reachR * Math.tan(toRad(tilt))) };
        const p4 = { r: reachR, x: revX };
        const toSVG = (pt: { r: number, x: number }) => `${CENTER + pt.r * SCALE},${CENTER - pt.x * SCALE}`;
        return <polygon points={`${toSVG(p1)} ${toSVG(p2)} ${toSVG(p3)} ${toSVG(p4)}`} fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />;
    };

    return (
        <div className={`min-h-screen font-sans flex flex-col overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
            <PageSEO 
                title="Distance Lab (ANSI 21)" 
                description="Professional distance protection simulator. Master R-X diagrams, Mho and Quadrilateral characteristics." 
                url="/distancelab" 
            />

            <header className={`h-20 backdrop-blur-xl border-b px-8 flex items-center justify-between z-30 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-5">
                    <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-black text-2xl tracking-tighter text-adaptive">DISTANCE <span className="text-indigo-400">LAB</span></h1>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            <span>RelaySim Ultra v2.5</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                            <span>IEEE C37.113 Compliant</span>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-4">
                    <AICopyButton state={{ settings, fault, status }} toolName="Distance Protection Lab / ANSI 21" />
                    <button onClick={() => setSettings({ ...settings, charType: 'MHO', z1Reach: 8.0, z2Reach: 12.0, z3Reach: 18.0, mta: 75 })} 
                            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-800 transition-all">
                        <RefreshCw className="w-4 h-4 inline mr-2" /> RESET
                    </button>
                    <div className="h-10 w-px bg-slate-800 mx-2" />
                    <div className={`flex items-center gap-3 px-5 py-2 rounded-xl border-2 transition-all ${status.trip ? 'bg-red-950/20 border-red-500 text-red-500 animate-pulse' : 'bg-emerald-950/20 border-emerald-500 text-emerald-500'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${status.trip ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                        <span className="text-[10px] font-black tracking-widest uppercase">{status.trip ? `TRIP: ${status.zone}` : 'MONITORING'}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* R-X DIAGRAM AREA */}
                <div className={`flex-1 relative p-8 flex items-center justify-center overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#020617]' : 'bg-slate-200/50'}`}>
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 font-mono text-[10px] text-slate-600 font-black tracking-[0.2em]">+ jX (REACTANCE Ω)</div>
                    <div className="absolute top-1/2 right-10 -translate-y-1/2 font-mono text-[10px] text-slate-600 font-black tracking-[0.2em] rotate-90">+ R (RESISTANCE Ω)</div>
                    
                    <div className={`relative group p-4 rounded-[3rem] border backdrop-blur-sm shadow-2xl transition-colors duration-500 ${isDark ? 'bg-slate-900/20 border-slate-800/50' : 'bg-white border-slate-200'}`}>
                        <svg 
                            ref={svgRef}
                            width={CANVAS_SIZE} 
                            height={CANVAS_SIZE} 
                            viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
                            onClick={handleSvgClick}
                            className="cursor-crosshair rounded-full overflow-hidden"
                        >
                            <defs>
                                <pattern id="subgrid" width="10" height="10" patternUnits="userSpaceOnUse">
                                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                                </pattern>
                                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                    <rect width="50" height="50" fill="url(#subgrid)" />
                                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            <line x1="0" y1={CENTER} x2={CANVAS_SIZE} y2={CENTER} stroke="#475569" strokeWidth="2" />
                            <line x1={CENTER} y1="0" x2={CENTER} y2={CANVAS_SIZE} stroke="#475569" strokeWidth="2" />

                            <g className="text-emerald-500/30 group-hover:text-emerald-500/40 transition-colors">
                                {settings.charType === 'MHO' ? getMhoPath(settings.z3Reach, settings.mta) : getQuadPath(settings.z3Reach, settings.quadResReach * 1.2, settings.mta, settings.tilt)}
                            </g>
                            <g className="text-amber-500/40 group-hover:text-amber-500/50 transition-colors">
                                {settings.charType === 'MHO' ? getMhoPath(settings.z2Reach, settings.mta) : getQuadPath(settings.z2Reach, settings.quadResReach, settings.mta, settings.tilt)}
                            </g>
                            <g className="text-red-500/50 group-hover:text-red-500/60 transition-colors">
                                {settings.charType === 'MHO' ? getMhoPath(settings.z1Reach, settings.mta) : getQuadPath(settings.z1Reach, settings.quadResReach * 0.8, settings.mta, settings.tilt)}
                            </g>

                            <motion.line x1={CENTER} y1={CENTER} x2={CENTER + fault.r * SCALE} y2={CENTER - fault.x * SCALE} stroke="#6366f1" strokeWidth="3" strokeDasharray="6,4" animate={{ x2: CENTER + fault.r * SCALE, y2: CENTER - fault.x * SCALE }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                            <motion.circle cx={CENTER + fault.r * SCALE} cy={CENTER - fault.x * SCALE} r="8" className={`${status.trip ? 'fill-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'fill-indigo-500 shadow-lg'}`} animate={{ cx: CENTER + fault.r * SCALE, cy: CENTER - fault.x * SCALE }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                        </svg>

                        <div className={`absolute bottom-10 left-10 p-5 border rounded-2xl backdrop-blur-xl shadow-2xl space-y-3 pointer-events-none transition-colors duration-500 ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                            <div className="flex justify-between gap-6"><span className="text-[10px] font-black text-slate-500 uppercase">Input R:</span> <Odometer value={fault.r} format={v => `${v.toFixed(2)} Ω`} className="font-mono text-xs font-bold text-adaptive" /></div>
                            <div className="flex justify-between gap-6"><span className="text-[10px] font-black text-slate-500 uppercase">Input jX:</span> <Odometer value={fault.x} format={v => `${v.toFixed(2)} Ω`} className="font-mono text-xs font-bold text-adaptive" /></div>
                            <div className="h-px bg-slate-800" />
                            <div className="flex justify-between gap-6"><span className="text-[10px] font-black text-indigo-400 uppercase">Magnitude |Z|:</span> <Odometer value={Math.sqrt(fault.r**2 + fault.x**2)} format={v => `${v.toFixed(2)} Ω`} className="font-mono text-sm font-black text-indigo-400" /></div>
                            <div className="flex justify-between gap-6"><span className="text-[10px] font-black text-indigo-400 uppercase">Angle ∠Z:</span> <Odometer value={Math.atan2(fault.x, fault.r) * RAD_TO_DEG} format={v => `${v.toFixed(1)}°`} className="font-mono text-sm font-black text-indigo-400" /></div>
                        </div>
                    </div>
                </div>

                {/* SIDEBAR CONTROLS */}
                <div className={`w-[420px] border-l flex flex-col z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`flex border-b p-1 transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                        {['sim', 'theory', 'quiz', 'missions'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)} 
                                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${activeTab === t ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
                                {t === 'sim' ? <Sliders className="w-5 h-5" /> : t === 'theory' ? <BookOpen className="w-5 h-5" /> : t === 'quiz' ? <BrainCircuit className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
                        {activeTab === 'sim' && (
                            <div className="space-y-6">
                                <Card isDark={isDark} noPadding>
                                    <div className="p-6">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-indigo-500" /> <JargonTooltip text="Protection Reach" explanation="The distance along the line that a relay zone is programmed to protect based on calculated impedance." />
                                        </h3>
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => setSettings({...settings, charType: 'MHO'})} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${settings.charType === 'MHO' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>MHO CIRCLE</button>
                                                <button onClick={() => setSettings({...settings, charType: 'QUAD'})} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${settings.charType === 'QUAD' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>QUADRILATERAL</button>
                                            </div>
                                            <Slider label="Line/Torque Angle (MTA)" unit="°" min={30} max={90} step={1} value={settings.mta} onChange={(e) => setSettings({...settings, mta: Number(e.target.value)})} color="blue" />
                                            <Slider label="Zone 1 Reach" unit=" Ω" min={1} max={25} step={0.5} value={settings.z1Reach} onChange={(e) => setSettings({...settings, z1Reach: Number(e.target.value)})} color="red" />
                                            <Slider label="Zone 2 Reach" unit=" Ω" min={1} max={25} step={0.5} value={settings.z2Reach} onChange={(e) => setSettings({...settings, z2Reach: Number(e.target.value)})} color="amber" />
                                            <Slider label="Zone 3 Reach" unit=" Ω" min={1} max={25} step={0.5} value={settings.z3Reach} onChange={(e) => setSettings({...settings, z3Reach: Number(e.target.value)})} color="emerald" />
                                            {settings.charType === 'QUAD' && (
                                                <Slider label="Resistive Reach (R)" unit=" Ω" min={1} max={30} step={0.5} value={settings.quadResReach} onChange={(e) => setSettings({...settings, quadResReach: Number(e.target.value)})} color="blue" />
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                <Card isDark={isDark} noPadding>
                                    <div className="p-6 bg-slate-950/30">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Info className="w-4 h-4 text-indigo-400" /> <JargonTooltip text="Engineering Reference" explanation="Key mathematical and theoretical principles for distance protection configuration." />
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-900 border border-indigo-500/20 rounded-2xl">
                                                <div className="text-[10px] font-black text-indigo-400 uppercase mb-2">Impedance Formula</div>
                                                <LaTeX math="Z = \frac{\overline{V}}{\overline{I} } = R + jX" />
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed italic">
                                                Click on the R-X diagram to simulate a fault. If the impedance phasor falls inside the characteristic, the relay will initiate a trip sequence according to the graded zones.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'theory' && (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <TheoryLibrary 
                                    title="Distance Protection (21)" 
                                    description="Understanding the impedance principle and coordination zones." 
                                    sections={DISTANCE_THEORY_CONTENT} 
                                />
                            </div>
                        )}
                        
                        {activeTab === 'quiz' && (
                            <div className="space-y-6">
                                {!quizState.active ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
                                        <div className="bg-indigo-600/10 p-6 rounded-full border-4 border-indigo-600/20">
                                            <BrainCircuit className="w-12 h-12 text-indigo-500" />
                                        </div>
                                        <h3 className="text-xl font-black">Knowledge Check</h3>
                                        <p className="text-sm text-slate-400">Select difficulty to begin assessment. 5 questions per session.</p>
                                        <div className="grid grid-cols-1 w-full gap-3">
                                            {['easy', 'medium', 'hard'].map(d => (
                                                <button key={d} onClick={() => startQuiz(d)} className="py-4 bg-slate-800 border border-slate-700 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-slate-700 transition-all">{d} Mode</button>
                                            ))}
                                        </div>
                                    </div>
                                ) : quizState.showResult ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                                        <Trophy className="w-16 h-16 text-yellow-500" />
                                        <h3 className="text-2xl font-black">Score: {quizState.score}/5</h3>
                                        <button onClick={() => setQuizState({...quizState, active: false})} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg">Try Again</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Q {quizState.currentIdx + 1} of 5</span>
                                            <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">{quizState.difficulty} Mode</span>
                                        </div>
                                        <Card isDark={isDark}>
                                            <p className="text-sm font-bold text-white mb-6 uppercase tracking-tight">{quizState.questions[quizState.currentIdx].q}</p>
                                            <div className="space-y-3">
                                                {quizState.questions[quizState.currentIdx].options.map((opt: string, i: number) => (
                                                    <button key={i} onClick={() => handleQuizAnswer(i)} disabled={!!quizState.feedback} 
                                                        className={`w-full p-4 rounded-xl text-xs font-bold text-left transition-all border ${quizState.feedback ? (i === quizState.questions[quizState.currentIdx].a ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : (quizState.feedback.correct === false && i === quizState.questions[quizState.currentIdx].a ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 opacity-50')) : 'bg-slate-800/50 border-slate-700 hover:border-indigo-500'}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </Card>
                                        {quizState.feedback && (
                                            <div className={`p-4 rounded-2xl border ${quizState.feedback.correct ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400' : 'bg-red-950/20 border-red-500 text-red-400'}`}>
                                                <p className="text-xs font-black uppercase mb-2">{quizState.feedback.text}</p>
                                                <p className="text-xs opacity-70 mb-4">{quizState.feedback.explanation}</p>
                                                <button onClick={nextQuestion} className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black tracking-widest uppercase">Continue</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'missions' && (
                            <div className="space-y-4">
                                {MISSIONS.map(m => (
                                    <Card key={m.id} isDark={isDark} noPadding>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-xs font-black text-white uppercase">{m.title}</h4>
                                                <Shield className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">{m.desc}</p>
                                            <button onClick={() => { setActiveMission(m); setActiveTab('sim'); }} className="w-full py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-700">START MISSION</button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-800 bg-slate-950/50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SYSTEM STABILITY</span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">HEALTHY</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}