import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Zap, Activity, Shield, Target, Layers, BookOpen,
    Settings, Info, Check, X, MousePointer2, AlertOctagon,
    Trophy, RefreshCw, Sliders, Move, Printer,
    Volume2, VolumeX, GraduationCap, Microscope,
    ArrowRight, FileText, Share2, Maximize, Minimize, Navigation,
    TrendingUp, Radio, BrainCircuit, ShieldCheck, Flame, GitBranch, Play, Square
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
import { calculateArcResistance, calculateApparentImpedance, calculateMutualCoupling } from '../services/mathEngine';

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

    // Advanced Engineering: Arc Resistance & Mutual Coupling
    const [arcSettings, setArcSettings] = usePersistentState('dist_arc', {
        enabled: false,
        gapLength: 2.0,       // meters
        faultCurrent: 5000,   // Amps
        infeedRatio: 1.0,     // >=1
        faultLocation: 0.5,   // per-unit on line
        lineR: 1.5,           // Ohms
        lineX: 10.0,          // Ohms
    });
    const [mutualCoupling, setMutualCoupling] = usePersistentState('dist_mutual', {
        enabled: false,
        z0R: 3.0,
        z0X: 15.0,
        couplingFactor: 0.6,
    });

    // Dynamic Sequence Test (IEC 60255-121)
    const [dynamicTest, setDynamicTest] = useState({
        running: false,
        phase: 'idle' as 'idle' | 'prefault' | 'fault' | 'postfault',
        trajectory: [] as { r: number; x: number }[],
        timer: null as ReturnType<typeof setTimeout> | null,
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

    // Computed Arc Resistance values
    const arcResistanceOhms = arcSettings.enabled
        ? calculateArcResistance(arcSettings.gapLength, arcSettings.faultCurrent)
        : 0;
    const apparentZ = arcSettings.enabled
        ? calculateApparentImpedance(arcSettings.lineR, arcSettings.lineX, arcSettings.faultLocation, arcResistanceOhms, arcSettings.infeedRatio)
        : null;
    const mutualZ = mutualCoupling.enabled
        ? calculateMutualCoupling(mutualCoupling.z0R, mutualCoupling.z0X, mutualCoupling.couplingFactor)
        : null;

    // Dynamic Sequence Test Runner (IEC 60255-121)
    const startDynamicTest = () => {
        if (dynamicTest.running) return;
        const loadR = 15, loadX = 3; // Load impedance (outside zones)
        const faultR = arcSettings.enabled && apparentZ ? apparentZ.r : 3;
        const faultX = arcSettings.enabled && apparentZ ? apparentZ.x : 6;
        const postR = 20, postX = 2; // Post-fault (load returns)

        const trajectory: { r: number; x: number }[] = [];
        // Pre-fault: 20 points at load
        for (let i = 0; i < 20; i++) trajectory.push({ r: loadR, x: loadX });
        // Transition: 10 points from load to fault
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            trajectory.push({ r: loadR + (faultR - loadR) * t, x: loadX + (faultX - loadX) * t });
        }
        // Fault: 30 points at fault
        for (let i = 0; i < 30; i++) trajectory.push({ r: faultR, x: faultX });
        // Post-fault: transition back
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            trajectory.push({ r: faultR + (postR - faultR) * t, x: faultX + (postX - faultX) * t });
        }
        for (let i = 0; i < 20; i++) trajectory.push({ r: postR, x: postX });

        setDynamicTest({ running: true, phase: 'prefault', trajectory, timer: null });

        let step = 0;
        const run = () => {
            if (step >= trajectory.length) {
                setDynamicTest(prev => ({ ...prev, running: false, phase: 'idle' }));
                return;
            }
            const pt = trajectory[step];
            setFault({ r: pt.r, x: pt.x });
            const phase = step < 20 ? 'prefault' : step < 31 ? 'fault' : step < 61 ? 'fault' : 'postfault';
            setDynamicTest(prev => ({ ...prev, phase }));
            step++;
            setTimeout(run, 80);
        };
        run();
    };

    const stopDynamicTest = () => {
        setDynamicTest({ running: false, phase: 'idle', trajectory: [], timer: null });
    };

    const handleSvgInteraction = useCallback((clientX: number, clientY: number) => {
        if (dynamicTest.running) return;
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        // Map screen coordinates to SVG viewBox coordinates
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        const svgX = (clientX - rect.left) * scaleX;
        const svgY = (clientY - rect.top) * scaleY;
        const r = (svgX - CENTER) / SCALE;
        const x = -(svgY - CENTER) / SCALE;
        setFault({ r, x });
    }, [dynamicTest.running, setFault]);

    const handleSvgClick = (e: React.MouseEvent) => {
        handleSvgInteraction(e.clientX, e.clientY);
    };

    const handleSvgTouch = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent scroll/zoom on touch
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            handleSvgInteraction(touch.clientX, touch.clientY);
        }
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
        <div className={`min-h-screen h-screen font-sans flex flex-col overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
            <PageSEO 
                title="Distance Lab (ANSI 21)" 
                description="Professional distance protection simulator. Master R-X diagrams, Mho and Quadrilateral characteristics." 
                url="/distancelab" 
            />

            {/* HEADER */}
            <header className={`h-14 shrink-0 backdrop-blur-xl border-b px-3 lg:px-6 flex items-center justify-between z-30 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-1.5 lg:p-2 rounded-lg lg:rounded-xl text-white shadow-lg">
                        <Target className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-black text-sm lg:text-lg tracking-tighter">DISTANCE <span className="text-indigo-400">LAB</span></h1>
                        <div className="flex items-center gap-1 text-[7px] lg:text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            <span>v2.5</span>
                            <span className="w-0.5 h-0.5 bg-slate-600 rounded-full" />
                            <span className="hidden sm:inline">IEEE C37.113</span>
                        </div>
                    </div>
                </div>

                {/* TAB BAR - placed in center of header */}
                <div className={`flex rounded-lg border p-0.5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                    {['sim', 'theory', 'quiz', 'missions'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-md' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                            {t === 'sim' ? <Sliders className="w-3.5 h-3.5" /> : t === 'theory' ? <BookOpen className="w-3.5 h-3.5" /> : t === 'quiz' ? <BrainCircuit className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{t}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden lg:block">
                        <AICopyButton state={{ settings, fault, status }} toolName="Distance Protection Lab / ANSI 21" />
                    </div>
                    <button onClick={() => setSettings({ ...settings, charType: 'MHO', z1Reach: 8.0, z2Reach: 12.0, z3Reach: 18.0, mta: 75 })} 
                            className={`p-1.5 lg:px-3 lg:py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all flex items-center shrink-0 border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'}`}>
                        <RefreshCw className="w-3.5 h-3.5 lg:mr-1.5" /> <span className="hidden lg:inline">RESET</span>
                    </button>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 transition-all text-[9px] font-black tracking-widest uppercase ${status.trip ? 'bg-red-950/30 border-red-500 text-red-400 animate-pulse' : 'bg-emerald-950/30 border-emerald-600 text-emerald-400'}`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${status.trip ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <span>{status.trip ? `TRIP: ${status.zone}` : <span className="hidden sm:inline">OK</span>}</span>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA - fills remaining viewport height */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)' }}>

                {/* === SIM TAB: Side-by-side R-X + Controls === */}
                {activeTab === 'sim' && (
                    <>
                        {/* R-X DIAGRAM AREA */}
                        <div className={`w-full lg:flex-1 relative flex items-center justify-center overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#020617]' : 'bg-slate-100'}`} style={{ minHeight: '40vh' }}>
                            <div className={`absolute top-3 left-1/2 -translate-x-1/2 font-mono text-[8px] lg:text-[9px] font-bold tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>+ jX (REACTANCE Ω)</div>
                            <div className={`absolute top-1/2 right-1 lg:right-4 -translate-y-1/2 font-mono text-[8px] lg:text-[9px] font-bold tracking-[0.15em] rotate-90 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>+ R (RESISTANCE Ω)</div>
                            
                            <div className={`relative group p-1 lg:p-3 rounded-2xl lg:rounded-[2rem] border backdrop-blur-sm shadow-2xl transition-colors duration-500 ${isDark ? 'bg-slate-900/20 border-slate-800/50' : 'bg-white border-slate-200'} max-w-[90%] lg:max-w-[min(80%,420px)] flex items-center justify-center mx-auto`}>
                                <svg 
                                    ref={svgRef}
                                    viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
                                    onClick={handleSvgClick}
                                    onTouchStart={handleSvgTouch}
                                    onTouchMove={handleSvgTouch}
                                    className="w-full h-auto cursor-crosshair rounded-full overflow-hidden touch-none"
                                >
                                    <defs>
                                        <pattern id="subgrid" width="10" height="10" patternUnits="userSpaceOnUse">
                                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeWidth="0.5" />
                                        </pattern>
                                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                            <rect width="50" height="50" fill="url(#subgrid)" />
                                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke={isDark ? '#334155' : '#94a3b8'} strokeWidth="1" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                    <line x1="0" y1={CENTER} x2={CANVAS_SIZE} y2={CENTER} stroke={isDark ? '#475569' : '#64748b'} strokeWidth="2" />
                                    <line x1={CENTER} y1="0" x2={CENTER} y2={CANVAS_SIZE} stroke={isDark ? '#475569' : '#64748b'} strokeWidth="2" />

                                    <g className="text-emerald-500/30 group-hover:text-emerald-500/40 transition-colors">
                                        {settings.charType === 'MHO' ? getMhoPath(settings.z3Reach, settings.mta) : getQuadPath(settings.z3Reach, settings.quadResReach * 1.2, settings.mta, settings.tilt)}
                                    </g>
                                    <g className="text-amber-500/40 group-hover:text-amber-500/50 transition-colors">
                                        {settings.charType === 'MHO' ? getMhoPath(settings.z2Reach, settings.mta) : getQuadPath(settings.z2Reach, settings.quadResReach, settings.mta, settings.tilt)}
                                    </g>
                                    <g className="text-red-500/50 group-hover:text-red-500/60 transition-colors">
                                        {settings.charType === 'MHO' ? getMhoPath(settings.z1Reach, settings.mta) : getQuadPath(settings.z1Reach, settings.quadResReach * 0.8, settings.mta, settings.tilt)}
                                    </g>

                                    {/* Arc Resistance Vector (orange dashed) */}
                                    {arcSettings.enabled && apparentZ && (
                                        <g>
                                            <line
                                                x1={CENTER} y1={CENTER}
                                                x2={CENTER + arcSettings.faultLocation * arcSettings.lineR * SCALE}
                                                y2={CENTER - arcSettings.faultLocation * arcSettings.lineX * SCALE}
                                                stroke="#22d3ee" strokeWidth="2" strokeDasharray="4,3" opacity={0.6}
                                            />
                                            <line
                                                x1={CENTER + arcSettings.faultLocation * arcSettings.lineR * SCALE}
                                                y1={CENTER - arcSettings.faultLocation * arcSettings.lineX * SCALE}
                                                x2={CENTER + apparentZ.r * SCALE}
                                                y2={CENTER - apparentZ.x * SCALE}
                                                stroke="#f97316" strokeWidth="2.5" strokeDasharray="6,3"
                                            />
                                            <text
                                                x={CENTER + (arcSettings.faultLocation * arcSettings.lineR + apparentZ.r) / 2 * SCALE}
                                                y={CENTER - apparentZ.x * SCALE - 8}
                                                fill="#f97316" fontSize="9" fontWeight="bold" textAnchor="middle"
                                            >R_arc = {arcResistanceOhms.toFixed(2)}Ω</text>
                                            <circle cx={CENTER + apparentZ.r * SCALE} cy={CENTER - apparentZ.x * SCALE} r="6" fill="#f97316" stroke="white" strokeWidth="2" />
                                        </g>
                                    )}

                                    {/* Mutual Coupling Z0m indicator */}
                                    {mutualCoupling.enabled && mutualZ && (
                                        <g opacity={0.5}>
                                            <line x1={CENTER} y1={CENTER} x2={CENTER + mutualZ.r * SCALE} y2={CENTER - mutualZ.x * SCALE} stroke="#a855f7" strokeWidth="2" strokeDasharray="3,3" />
                                            <text x={CENTER + mutualZ.r * SCALE + 5} y={CENTER - mutualZ.x * SCALE} fill="#a855f7" fontSize="8" fontWeight="bold">Z0m</text>
                                        </g>
                                    )}

                                    {/* Dynamic Test Trajectory Trail */}
                                    {dynamicTest.running && dynamicTest.trajectory.length > 0 && (
                                        <polyline
                                            points={dynamicTest.trajectory.map(p => `${CENTER + p.r * SCALE},${CENTER - p.x * SCALE}`).join(' ')}
                                            fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="2,2" opacity={0.4}
                                        />
                                    )}

                                    <motion.line x1={CENTER} y1={CENTER} x2={CENTER + fault.r * SCALE} y2={CENTER - fault.x * SCALE} stroke="#6366f1" strokeWidth="3" strokeDasharray="6,4" animate={{ x2: CENTER + fault.r * SCALE, y2: CENTER - fault.x * SCALE }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                                    <motion.circle cx={CENTER + fault.r * SCALE} cy={CENTER - fault.x * SCALE} r="8" className={`${status.trip ? 'fill-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'fill-indigo-500 shadow-lg'}`} animate={{ cx: CENTER + fault.r * SCALE, cy: CENTER - fault.x * SCALE }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                                </svg>

                                {/* Dynamic Test Phase Badge */}
                                {dynamicTest.running && (
                                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border animate-pulse ${
                                        dynamicTest.phase === 'prefault' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' :
                                        dynamicTest.phase === 'fault' ? 'bg-red-950/80 border-red-500 text-red-400' :
                                        'bg-blue-950/80 border-blue-500 text-blue-400'
                                    }`}>
                                        ⚡ {dynamicTest.phase === 'prefault' ? 'Pre-Fault' : dynamicTest.phase === 'fault' ? 'FAULT' : 'Recovery'}
                                    </div>
                                )}

                                {/* Impedance readout overlay */}
                                <div className={`absolute bottom-2 left-2 lg:bottom-4 lg:left-4 p-2 lg:p-3 border rounded-lg backdrop-blur-xl shadow-lg space-y-1 pointer-events-none transition-colors duration-500 ${isDark ? 'bg-slate-950/90 border-slate-700' : 'bg-white/90 border-slate-300'}`}>
                                    <div className="flex justify-between gap-3"><span className={`text-[7px] lg:text-[9px] font-black uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>R:</span> <Odometer value={fault.r} format={v => `${v.toFixed(2)} Ω`} className="font-mono text-[9px] lg:text-[11px] font-bold" /></div>
                                    <div className="flex justify-between gap-3"><span className={`text-[7px] lg:text-[9px] font-black uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>jX:</span> <Odometer value={fault.x} format={v => `${v.toFixed(2)} Ω`} className="font-mono text-[9px] lg:text-[11px] font-bold" /></div>
                                    <div className={`h-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                                    <div className="flex justify-between gap-3"><span className="text-[7px] lg:text-[9px] font-black text-indigo-400 uppercase">|Z|:</span> <Odometer value={Math.sqrt(fault.r**2 + fault.x**2)} format={v => `${v.toFixed(2)} Ω`} className="font-mono text-[10px] lg:text-xs font-black text-indigo-400" /></div>
                                    <div className="flex justify-between gap-3"><span className="text-[7px] lg:text-[9px] font-black text-indigo-400 uppercase">∠Z:</span> <Odometer value={Math.atan2(fault.x, fault.r) * RAD_TO_DEG} format={v => `${v.toFixed(1)}°`} className="font-mono text-[10px] lg:text-xs font-black text-indigo-400" /></div>
                                    {arcSettings.enabled && <>
                                        <div className={`h-px ${isDark ? 'bg-orange-800/30' : 'bg-orange-200'}`} />
                                        <div className="flex justify-between gap-3"><span className="text-[7px] lg:text-[9px] font-black text-orange-400 uppercase">R_arc:</span> <span className="font-mono text-[9px] lg:text-[11px] font-black text-orange-400">{arcResistanceOhms.toFixed(2)} Ω</span></div>
                                    </>}
                                </div>
                            </div>
                        </div>

                        {/* SIM CONTROLS PANEL (right side on desktop, below on mobile) */}
                        <div className={`w-full lg:w-[340px] xl:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col overflow-y-auto z-20 transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
                                <Card isDark={isDark} noPadding>
                                    <div className="p-3 lg:p-4">
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            <Shield className="w-4 h-4 text-indigo-500" /> <JargonTooltip text="Protection Reach" explanation="The distance along the line that a relay zone is programmed to protect based on calculated impedance." />
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => setSettings({...settings, charType: 'MHO'})} className={`py-2.5 rounded-xl text-[10px] font-black border transition-all ${settings.charType === 'MHO' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>MHO CIRCLE</button>
                                                <button onClick={() => setSettings({...settings, charType: 'QUAD'})} className={`py-2.5 rounded-xl text-[10px] font-black border transition-all ${settings.charType === 'QUAD' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>QUADRILATERAL</button>
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

                                {/* ARC RESISTANCE & ADVANCED MODELING */}
                                <Card isDark={isDark} noPadding>
                                    <div className="p-3 lg:p-4">
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            <Flame className="w-4 h-4 text-orange-500" /> Arc Resistance & Infeed
                                        </h3>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => setArcSettings(prev => ({...prev, enabled: !prev.enabled}))}
                                                className={`w-full py-2 rounded-lg text-[10px] font-black border transition-all ${arcSettings.enabled ? 'bg-orange-600 border-orange-500 text-white' : isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                                            >
                                                {arcSettings.enabled ? '● ARC RESISTANCE ON' : '○ ENABLE ARC MODELING'}
                                            </button>
                                            {arcSettings.enabled && (
                                                <div className="space-y-2 animate-in fade-in">
                                                    <Slider label="Arc Gap" unit=" m" min={0.5} max={5} step={0.1} value={arcSettings.gapLength} onChange={e => setArcSettings(s => ({...s, gapLength: Number(e.target.value)}))} color="orange" />
                                                    <Slider label="Fault Current" unit=" A" min={500} max={20000} step={100} value={arcSettings.faultCurrent} onChange={e => setArcSettings(s => ({...s, faultCurrent: Number(e.target.value)}))} color="orange" />
                                                    <Slider label="Infeed Ratio" unit="" min={1} max={5} step={0.1} value={arcSettings.infeedRatio} onChange={e => setArcSettings(s => ({...s, infeedRatio: Number(e.target.value)}))} color="orange" />
                                                    <Slider label="Fault Location" unit=" p.u." min={0} max={1} step={0.05} value={arcSettings.faultLocation} onChange={e => setArcSettings(s => ({...s, faultLocation: Number(e.target.value)}))} color="orange" />
                                                    <div className={`p-2 rounded-lg border ${isDark ? 'bg-orange-950/30 border-orange-800/30' : 'bg-orange-50 border-orange-200'}`}>
                                                        <div className={`text-[9px] font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Warrington: R_arc = 28710 × gap / I^1.4</div>
                                                        <div className={`text-[10px] font-mono font-black mt-1 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>R_arc = {arcResistanceOhms.toFixed(3)} Ω</div>
                                                        {apparentZ && <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>Z_app = {apparentZ.r.toFixed(2)} + j{apparentZ.x.toFixed(2)} Ω</div>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                {/* MUTUAL COUPLING */}
                                <Card isDark={isDark} noPadding>
                                    <div className="p-3 lg:p-4">
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            <GitBranch className="w-4 h-4 text-purple-500" /> Mutual Coupling (Z0m)
                                        </h3>
                                        <button
                                            onClick={() => setMutualCoupling(prev => ({...prev, enabled: !prev.enabled}))}
                                            className={`w-full py-2 rounded-lg text-[10px] font-black border transition-all ${mutualCoupling.enabled ? 'bg-purple-600 border-purple-500 text-white' : isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                                        >
                                            {mutualCoupling.enabled ? '● PARALLEL LINE COUPLED' : '○ ENABLE MUTUAL COUPLING'}
                                        </button>
                                        {mutualCoupling.enabled && (
                                            <div className="space-y-2 mt-3 animate-in fade-in">
                                                <Slider label="Z0 Self R" unit=" Ω" min={0.5} max={10} step={0.1} value={mutualCoupling.z0R} onChange={e => setMutualCoupling(s => ({...s, z0R: Number(e.target.value)}))} color="purple" />
                                                <Slider label="Z0 Self X" unit=" Ω" min={1} max={30} step={0.5} value={mutualCoupling.z0X} onChange={e => setMutualCoupling(s => ({...s, z0X: Number(e.target.value)}))} color="purple" />
                                                <Slider label="Coupling Factor" unit="" min={0.3} max={0.9} step={0.05} value={mutualCoupling.couplingFactor} onChange={e => setMutualCoupling(s => ({...s, couplingFactor: Number(e.target.value)}))} color="purple" />
                                                {mutualZ && <div className={`p-2 rounded-lg border text-[10px] font-mono ${isDark ? 'bg-purple-950/30 border-purple-800/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>Z0m = {mutualZ.r.toFixed(2)} + j{mutualZ.x.toFixed(2)} Ω</div>}
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* DYNAMIC SEQUENCE TEST (IEC 60255-121) */}
                                <Card isDark={isDark} noPadding>
                                    <div className="p-3 lg:p-4">
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            <Activity className="w-4 h-4 text-yellow-500" /> IEC 60255-121 Dynamic Test
                                        </h3>
                                        <p className={`text-[10px] mb-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Simulates Pre-Fault → Fault → Post-Fault trajectory on the R-X plane.</p>
                                        {!dynamicTest.running ? (
                                            <button onClick={startDynamicTest} className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg text-[10px] font-black tracking-widest flex items-center justify-center gap-2">
                                                <Play className="w-3 h-3" /> START DYNAMIC TEST
                                            </button>
                                        ) : (
                                            <button onClick={stopDynamicTest} className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-black tracking-widest flex items-center justify-center gap-2">
                                                <Square className="w-3 h-3" /> ABORT TEST
                                            </button>
                                        )}
                                    </div>
                                </Card>

                                {/* Compact Engineering Reference */}
                                <Card isDark={isDark} noPadding>
                                    <div className={`p-3 lg:p-4 ${isDark ? 'bg-slate-950/30' : 'bg-slate-50'}`}>
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            <Info className="w-4 h-4 text-indigo-400" /> <JargonTooltip text="Engineering Reference" explanation="Key mathematical and theoretical principles for distance protection configuration." />
                                        </h3>
                                        <div className={`p-2 rounded-lg border mb-2 ${isDark ? 'bg-slate-900 border-indigo-500/20' : 'bg-white border-indigo-200'}`}>
                                            <div className="text-[9px] font-black text-indigo-400 uppercase mb-1">Impedance Formula</div>
                                            <LaTeX math="Z = \frac{\overline{V}}{\overline{I} } = R + jX" />
                                        </div>
                                        <p className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            Click on the R-X diagram to simulate a fault. If the impedance phasor falls inside the characteristic, the relay will trip.
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </>
                )}

                {/* === THEORY TAB: Full width content === */}
                {activeTab === 'theory' && (
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-4xl mx-auto p-4 lg:p-8 animate-in fade-in">
                            <TheoryLibrary 
                                title="Distance Protection (21)" 
                                description="Understanding the impedance principle and coordination zones." 
                                sections={DISTANCE_THEORY_CONTENT} 
                            />
                        </div>
                    </div>
                )}

                {/* === QUIZ TAB: Full width content === */}
                {activeTab === 'quiz' && (
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-2xl mx-auto p-4 lg:p-8">
                            <div className="space-y-6">
                                {!quizState.active ? (
                                    <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
                                        <div className="bg-indigo-600/10 p-6 rounded-full border-4 border-indigo-600/20">
                                            <BrainCircuit className="w-12 h-12 text-indigo-500" />
                                        </div>
                                        <h3 className="text-2xl font-black">Knowledge Check</h3>
                                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Select difficulty to begin assessment. 5 questions per session.</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 w-full max-w-lg gap-3">
                                            {['easy', 'medium', 'hard'].map(d => (
                                                <button key={d} onClick={() => startQuiz(d)} className={`py-4 border rounded-2xl font-black text-xs tracking-widest uppercase transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'}`}>{d} Mode</button>
                                            ))}
                                        </div>
                                    </div>
                                ) : quizState.showResult ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                                        <Trophy className="w-16 h-16 text-yellow-500" />
                                        <h3 className="text-3xl font-black">Score: {quizState.score}/5</h3>
                                        <button onClick={() => setQuizState({...quizState, active: false})} className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg hover:bg-indigo-500 transition-all">Try Again</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className={`flex justify-between items-center p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                                            <span className={`text-[10px] font-black uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Q {quizState.currentIdx + 1} of 5</span>
                                            <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">{quizState.difficulty} Mode</span>
                                        </div>
                                        <Card isDark={isDark}>
                                            <p className={`text-sm font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>{quizState.questions[quizState.currentIdx].q}</p>
                                            <div className="space-y-3">
                                                {quizState.questions[quizState.currentIdx].options.map((opt: string, i: number) => (
                                                    <button key={i} onClick={() => handleQuizAnswer(i)} disabled={!!quizState.feedback} 
                                                        className={`w-full p-4 rounded-xl text-xs font-bold text-left transition-all border ${quizState.feedback ? (i === quizState.questions[quizState.currentIdx].a ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : (quizState.feedback.correct === false && i === quizState.questions[quizState.currentIdx].a ? 'bg-emerald-500/10 border-emerald-500/50' : `${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} opacity-50`)) : `${isDark ? 'bg-slate-800/50 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-500 shadow-sm'}`}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </Card>
                                        {quizState.feedback && (
                                            <div className={`p-4 rounded-2xl border ${quizState.feedback.correct ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400' : 'bg-red-950/20 border-red-500 text-red-400'}`}>
                                                <p className="text-xs font-black uppercase mb-2">{quizState.feedback.text}</p>
                                                <p className="text-xs opacity-80 mb-4">{quizState.feedback.explanation}</p>
                                                <button onClick={nextQuestion} className={`w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>Continue</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* === MISSIONS TAB: Full width content === */}
                {activeTab === 'missions' && (
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-3xl mx-auto p-4 lg:p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {MISSIONS.map(m => (
                                    <Card key={m.id} isDark={isDark} noPadding>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className={`text-xs font-black uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>{m.title}</h4>
                                                <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                                            </div>
                                            <p className={`text-[10px] mb-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{m.desc}</p>
                                            <button onClick={() => { setActiveMission(m); setActiveTab('sim'); }} className={`w-full py-2.5 border rounded-xl text-[10px] font-black tracking-widest transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'}`}>START MISSION</button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}