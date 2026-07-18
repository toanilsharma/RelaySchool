import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
const toRad = (deg: number) => deg * DEG_TO_RAD;

// --- Teaching Explanations Database ---
const TEACH_DB: Record<string, { title: string; body: string; why: string; standard: string }> = {
    NORMAL: {
        title: "System Operating Normally",
        body: "The impedance locus (purple dot) is outside all protection zones. The relay sees normal load impedance — large magnitude, small angle. No trip is initiated.",
        why: "During healthy operation, load impedance = V/I is several times larger than fault impedance. The impedance point sits far from the origin in the R-X plane.",
        standard: "IEEE C37.113 / IEC 60255-21"
    },
    Z1: {
        title: "Zone 1 — Instantaneous Trip (0 ms)",
        body: "The fault impedance has fallen inside Zone 1 boundary. Zone 1 is an underreaching element (80% of line) set to trip INSTANTLY with zero intentional delay.",
        why: "Zone 1 is deliberately set to only 80% of the line impedance to guard against measurement errors from CT/VT inaccuracies and fault resistance. If set to 100%, errors could cause Zone 1 to 'see' beyond the remote busbar and trip for external faults.",
        standard: "IEEE C37.113 Sec 5.2.1"
    },
    Z2: {
        title: "Zone 2 — Time-Delayed Trip (300 ms)",
        body: "The fault lies beyond Zone 1 reach but within the Zone 2 overreaching boundary. Zone 2 picks up and starts its 300 ms timer.",
        why: "The 300 ms delay provides coordination time. A fault in the final 20% of the protected line could also be seen by the remote Zone 1. The delay allows the remote relay to clear it first. If the remote relay fails, our Zone 2 clears it as a backup.",
        standard: "IEEE C37.113 Sec 5.2.2"
    },
    Z3: {
        title: "Zone 3 — Remote Backup Trip (1000 ms)",
        body: "The fault lies beyond Zone 2 but within the Zone 3 remote backup zone. Trip is initiated after 1000 ms intentional time delay.",
        why: "Zone 3 provides backup protection for the adjacent line section. The 1000 ms delay allows both remote Zone 1 (0ms) and Zone 2 (300ms) protections to operate first. Zone 3 only acts if all upstream protections have failed.",
        standard: "IEEE C37.113 Sec 5.2.3"
    },
    ARC: {
        title: "Arc Resistance — Underreach Warning",
        body: "Significant arc resistance detected. The fault impedance has shifted horizontally (rightward) in the R-X plane due to arc resistance, pushing it outside the narrow Mho circle.",
        why: "Arc resistance adds a real (resistive) component to the fault impedance. Mho circles have limited resistive coverage. High arc resistance + infeed effect causes the relay to underreach and MISS the fault entirely.",
        standard: "Warrington Formula: Ra = 28707 × L / I^1.4"
    },
    PSB: {
        title: "Power Swing Blocking Active",
        body: "The PSB logic has detected a gradual encroachment — characteristic of a power swing — and is blocking the trip command to prevent a false blackout.",
        why: "During power swings (system oscillations), the impedance locus sweeps slowly through zones. A real fault causes an instantaneous jump. PSB monitors dZ/dt: slow = swing (block), fast = fault (allow trip).",
        standard: "IEEE C37.113 Sec 6.8"
    }
};

// --- QUESTION BANK ---
const QUESTION_BANK = [
    { id: 1, difficulty: 'easy', q: "What is the primary input required for a distance relay to calculate impedance?", options: ["Current only", "Voltage only", "Voltage and Current", "Frequency"], a: 2, explanation: "Z = V/I. Both voltage and current quantities are needed." },
    { id: 2, difficulty: 'easy', q: "Why is Zone 1 typically set to less than 100% of the line length?", options: ["To save energy", "To allow for Zone 2 backup", "To prevent overreaching due to measurement errors", "Because the relay cannot see further"], a: 2, explanation: "CT/VT errors and line parameter inaccuracies can cause the relay to 'see' further than reality, risking overtrip of external faults." },
    { id: 3, difficulty: 'easy', q: "Which characteristic is inherently directional?", options: ["Impedance (Plain)", "Reactance", "Mho", "Offset Mho"], a: 2, explanation: "The Mho characteristic passes through the origin, providing inherent directionality — it cannot trip for reverse faults." },
    { id: 4, difficulty: 'easy', q: "What is the typical time delay for Zone 1?", options: ["Instantaneous (0ms)", "300ms", "500ms", "1000ms"], a: 0, explanation: "Zone 1 is the primary protection for the local line and must operate immediately to clear internal faults." },
    { id: 5, difficulty: 'easy', q: "What does SIR stand for in protection engineering?", options: ["System Integrity Report", "Source Impedance Ratio", "Signal Input Range", "Series Inductance Reactance"], a: 1, explanation: "Source Impedance Ratio = Zsource / Zline. A high SIR means weak source — relay accuracy degrades." },
    { id: 6, difficulty: 'medium', q: "Which fault type typically has the highest arc resistance?", options: ["3-Phase", "Phase-to-Phase", "Single Line to Ground", "Bolted Fault"], a: 2, explanation: "Ground faults often involve trees or high-resistance soil paths, resulting in significant arc resistance per the Warrington formula." },
    { id: 7, difficulty: 'medium', q: "How does the Infeed Effect influence a distance relay?", options: ["Causes Overreach", "Causes Underreach", "No Effect", "Causes instant trip"], a: 1, explanation: "Infeed from another source increases the voltage at the relay for the same current, making the measured impedance appear larger — Underreach." },
    { id: 8, difficulty: 'medium', q: "What is the purpose of Load Encroachment logic?", options: ["To trip on high load", "To prevent tripping on high load conditions", "To monitor power quality", "To measure line length"], a: 1, explanation: "Prevents Zone 3 false trips during heavy load when impedance Z = V/I drops significantly into the Zone 3 boundary." },
    { id: 9, difficulty: 'medium', q: "Ideally, the MTA (Maximum Torque Angle) should match:", options: ["The Load Angle", "The Source Angle", "The Line Impedance Angle", "90 Degrees"], a: 2, explanation: "Matching the line angle ensures maximum sensitivity along the fault locus direction in the R-X plane." },
    { id: 10, difficulty: 'medium', q: "What is K0 factor used for?", options: ["Phase Faults", "Ground Fault Zero-Sequence Compensation", "Power Swing Blocking", "Load Shedding"], a: 1, explanation: "K0 = (Z0-Z1)/3Z1 compensates for the difference between positive and zero sequence impedance in ground distance calculations." },
    { id: 11, difficulty: 'hard', q: "In a Quadrilateral characteristic, the resistive reach is set independently to cover:", options: ["Line Reactance", "Arc Resistance", "Source Impedance", "Mutual Coupling"], a: 1, explanation: "Quad relays allow expanding the R-axis coverage for arc resistance without affecting the X-axis (reach) setting." },
    { id: 12, difficulty: 'hard', q: "Zero-sequence mutual coupling typically affects which protection element?", options: ["Zone 1 Phase", "Ground Distance Elements", "Overvoltage", "Negative Sequence Overcurrent"], a: 1, explanation: "Mutual coupling induces zero-sequence voltage on parallel lines, distorting the Z0 measurement and causing over/underreach." },
    { id: 13, difficulty: 'hard', q: "Power Swing Blocking (PSB) logic differentiates a swing from a fault by monitoring:", options: ["Rate of change of Impedance (dZ/dt)", "Voltage Magnitude", "Current Magnitude", "Frequency"], a: 0, explanation: "Faults cause an instantaneous Z jump. Swings cause gradual change. PSB measures dZ/dt to detect this speed difference." },
    { id: 14, difficulty: 'hard', q: "A Weak Infeed logic is typically associated with:", options: ["Zone 1", "POTT / PUTT Communication Schemes", "Differential Protection", "Overcurrent"], a: 1, explanation: "In communication schemes (POTT/PUTT), weak infeed logic allows a trip echo even if one end cannot supply enough fault current." },
    { id: 15, difficulty: 'hard', q: "What happens to the reach of a Mho relay if it is Cross-Polarized?", options: ["It decreases", "It expands for resistive faults", "It becomes non-directional", "It oscillates"], a: 1, explanation: "Cross-polarization uses healthy phase voltage to maintain directionality and expand the Mho characteristic during close-in faults." },
];

// --- Impedance check functions (engineering accurate) ---
const checkMho = (reach: number, r: number, x: number, mta: number) => {
    const mtaRad = toRad(mta);
    const radius = reach / 2;
    const centerR = radius * Math.cos(mtaRad);
    const centerX = radius * Math.sin(mtaRad);
    const distance = Math.sqrt((r - centerR) ** 2 + (x - centerX) ** 2);
    return distance <= radius;
};

const checkQuad = (reachX: number, reachR: number, r: number, x: number, mta: number, tilt = 0) => {
    const revX = -0.2 * reachX;
    const revR = -0.2 * reachR;
    const isForward = x >= revX;
    const topBoundary = x <= (reachX + (r * Math.tan(toRad(tilt))));
    const rightBoundary = r <= reachR;
    const leftBoundary = r >= revR;
    return isForward && topBoundary && rightBoundary && leftBoundary;
};

export default function DistanceLab() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState<'sim' | 'theory' | 'quiz' | 'missions'>('sim');
    const [mobilePanel, setMobilePanel] = useState<'graph' | 'settings' | 'teach' | 'labs'>('graph');

    const [settings, setSettings] = usePersistentState('dist_settings_v3', {
        charType: 'MHO' as 'MHO' | 'QUAD',
        mta: 75,
        tilt: 5,
        z1Reach: 8.0,
        z2Reach: 12.0,
        z3Reach: 18.0,
        z1Time: 0,
        z2Time: 300,
        z3Time: 1000,
        quadResReach: 10.0,
        faultLoop: 'AG',
        psbEnabled: false,
        lineLength: 100.0,   // km
        lineAngle: 75.0,     // deg (actual line impedance angle)
        nomVoltage: 132.0,   // kV
        ctRatio: 1200,       // primary:1A
        vtRatio: 1100,       // primary:1V
    });

    const [arcSettings, setArcSettings] = usePersistentState('dist_arc_v3', {
        enabled: false,
        gapLength: 2.0,
        faultCurrent: 5000,
        infeedRatio: 1.0,
        faultLocation: 0.5,
        lineR: 1.5,
        lineX: 10.0,
    });

    const [dynamicTest, setDynamicTest] = useState({
        running: false,
        phase: 'idle' as 'idle' | 'swing',
        trajectory: [] as { r: number; x: number }[],
    });

    const [fault, setFault] = usePersistentState('dist_fault_v3', { r: 5.0, x: 7.0 });
    const [status, setStatus] = useState({ trip: false, zone: 'NONE', time: 0 });
    const { isTripping, triggerTrip } = useTripFeedback();
    const svgRef = useRef<SVGSVGElement>(null);

    const [quizState, setQuizState] = useState<any>({
        active: false, difficulty: null, questions: [],
        currentIdx: 0, score: 0, showResult: false, feedback: null
    });
    const [activeLab, setActiveLab] = useState<number | null>(null);
    const [labResult, setLabResult] = useState<string | null>(null);

    // ---- Trip Status Engine ----
    useEffect(() => {
        let activeZone = 'NONE';
        const { r, x } = fault;
        const { z1Reach, z2Reach, z3Reach, mta, tilt, charType, quadResReach, psbEnabled } = settings;
        const isBlockedByPSB = psbEnabled && dynamicTest.running && dynamicTest.phase === 'swing';

        if (!isBlockedByPSB) {
            const inZ1 = charType === 'MHO' ? checkMho(z1Reach, r, x, mta) : checkQuad(z1Reach, quadResReach * 0.8, r, x, mta, tilt);
            const inZ2 = charType === 'MHO' ? checkMho(z2Reach, r, x, mta) : checkQuad(z2Reach, quadResReach, r, x, mta, tilt);
            const inZ3 = charType === 'MHO' ? checkMho(z3Reach, r, x, mta) : checkQuad(z3Reach, quadResReach * 1.2, r, x, mta, tilt);
            if (inZ1) activeZone = 'Z1';
            else if (inZ2) activeZone = 'Z2';
            else if (inZ3) activeZone = 'Z3';
        }

        if (activeZone !== 'NONE' && activeZone !== status.zone) triggerTrip();
        setStatus({
            trip: activeZone !== 'NONE',
            zone: activeZone,
            time: activeZone === 'Z1' ? settings.z1Time : activeZone === 'Z2' ? settings.z2Time : activeZone === 'Z3' ? settings.z3Time : 0
        });
    }, [fault, settings, dynamicTest]);

    // ---- Arc & Mutual calculations ----
    const arcResistanceOhms = useMemo(() => {
        if (!arcSettings.enabled) return 0;
        return calculateArcResistance(arcSettings.gapLength, arcSettings.faultCurrent);
    }, [arcSettings.enabled, arcSettings.gapLength, arcSettings.faultCurrent]);

    const apparentZ = useMemo(() => {
        if (!arcSettings.enabled) return null;
        return calculateApparentImpedance(arcSettings.lineR, arcSettings.lineX, arcSettings.faultLocation, arcResistanceOhms, arcSettings.infeedRatio);
    }, [arcSettings.enabled, arcSettings.lineR, arcSettings.lineX, arcSettings.faultLocation, arcResistanceOhms, arcSettings.infeedRatio]);

    // ---- Derived Measurements ----
    const measurements = useMemo(() => {
        const mag = Math.sqrt(fault.r ** 2 + fault.x ** 2);
        const angle = Math.atan2(fault.x, fault.r) * RAD_TO_DEG;
        const lineZpu = settings.z1Reach / 0.8; // total line Z (Z1 = 80%)
        const faultPct = mag / lineZpu * 100;
        const faultKm = (mag / lineZpu) * settings.lineLength;
        return { mag, angle, faultPct, faultKm };
    }, [fault, settings.z1Reach, settings.lineLength]);

    // ---- Teaching Diagnostics Engine ----
    const teach = useMemo(() => {
        const { mag, angle, faultPct, faultKm } = measurements;
        let key = 'NORMAL';
        if (settings.psbEnabled && dynamicTest.running) key = 'PSB';
        else if (status.trip) key = status.zone;
        else if (arcSettings.enabled && apparentZ) {
            const wouldMissWithoutQuad = !checkMho(settings.z1Reach, apparentZ.r, apparentZ.x, settings.mta);
            if (wouldMissWithoutQuad) key = 'ARC';
        }

        const entry = TEACH_DB[key] || TEACH_DB.NORMAL;

        // Live computed context
        const tripDelayText = status.zone === 'Z1' ? 'Instantaneous (0 ms)' : status.zone === 'Z2' ? '300 ms (coordination delay)' : status.zone === 'Z3' ? '1000 ms (backup delay)' : 'No trip';

        const actionRequired = status.trip
            ? `Breaker ${status.zone === 'Z1' ? 'opens immediately' : 'will open after ' + status.time + ' ms'}.`
            : 'No action. Line continues feeding load.';

        return { ...entry, key, mag, angle, faultPct, faultKm, tripDelayText, actionRequired };
    }, [fault, status, settings, arcSettings, apparentZ, measurements, dynamicTest.running]);

    // ---- Labs ----
    const labs = useMemo(() => [
        {
            id: 0, name: "Lab 1: Warrington Arc Underreach",
            objective: "Understand how high arc resistance causes a Mho relay to miss a real fault.",
            description: "Arc modeling is pre-enabled (Gap: 2.0m, Current: 3000A, Infeed: 1.5×). A fault is placed at Z = 12.0 + j6.0 Ω. Observe the fault point is OUTSIDE Zone 1 Mho despite being on the protected line. Switch to QUAD characteristic and expand Resistive Reach to 15+ Ω to catch the fault.",
            setup: () => {
                setSettings((s: any) => ({ ...s, charType: 'MHO', z1Reach: 8.0 }));
                setArcSettings({ enabled: true, gapLength: 2.0, faultCurrent: 3000, infeedRatio: 1.5, faultLocation: 0.6, lineR: 1.5, lineX: 10.0 });
                setFault({ r: 12.0, x: 6.0 });
                setLabResult(null);
            },
            check: () => settings.charType === 'QUAD' && settings.quadResReach >= 15.0 && status.zone === 'Z1',
            hint: "Switch to QUAD, then drag Resistive Reach slider to 15.0 Ω.",
            lesson: "Mho circles are narrow in the resistive direction. High arc resistance + infeed effect shifts the locus right. Quadrilateral boundaries allow independent R-axis setting to catch these faults."
        },
        {
            id: 1, name: "Lab 2: Zone Coordination Calibration",
            objective: "Set Zone 1 and Zone 2 reaches correctly to achieve selective protection.",
            description: "A fault exists at Z = 3.0 + j9.5 Ω. Currently Zone 1 = 5.0 Ω, Zone 2 = 7.0 Ω (too small). Set Zone 1 = 8.0 Ω and Zone 2 = 12.0 Ω. After adjustment, explain why this fault trips in Zone 2 (not Z1).",
            setup: () => {
                setSettings((s: any) => ({ ...s, charType: 'MHO', z1Reach: 5.0, z2Reach: 7.0 }));
                setArcSettings((s: any) => ({ ...s, enabled: false }));
                setFault({ r: 3.0, x: 9.5 });
                setLabResult(null);
            },
            check: () => settings.charType === 'MHO' && settings.z1Reach === 8.0 && settings.z2Reach === 12.0 && status.zone === 'Z2',
            hint: "Drag Zone 1 to 8.0 Ω and Zone 2 to 12.0 Ω using the sliders.",
            lesson: "The fault magnitude is ~9.5 Ω which is between Z1 reach (8 Ω) and Z2 reach (12 Ω). Therefore it trips in Zone 2 with 300ms delay, allowing downstream devices to clear first."
        },
        {
            id: 2, name: "Lab 3: Power Swing Blocking",
            objective: "Prevent a false blackout trip from a grid power swing.",
            description: "Click 'Run Dynamic Swing' to animate a slow impedance swing into Zone 3. Without PSB, the relay false trips. Enable Power Swing Blocking (PSB) in settings, then run the test again. The relay should block the trip.",
            setup: () => {
                setSettings((s: any) => ({ ...s, psbEnabled: false, z3Reach: 18.0 }));
                setArcSettings((s: any) => ({ ...s, enabled: false }));
                setLabResult(null);
            },
            check: () => settings.psbEnabled && !status.trip,
            hint: "Find and enable 'PSB Element Override' toggle in IED Settings.",
            lesson: "Power swings cause gradual Z trajectory changes (dZ/dt is small). Real faults cause instantaneous Z jumps. PSB detects this rate difference and blocks trip for swings while allowing trips for faults."
        }
    ], [settings, arcSettings, status]);

    const startLab = (idx: number) => { setActiveLab(idx); labs[idx].setup(); };
    const verifyLab = () => { if (activeLab !== null) setLabResult(labs[activeLab].check() ? "passed" : "failed"); };

    // ---- Dynamic Swing ----
    const startDynamicTest = () => {
        if (dynamicTest.running) return;
        const traj: { r: number; x: number }[] = [];
        for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            traj.push({ r: 18 - t * 10, x: 5 + t * 12 });
        }
        setDynamicTest({ running: true, phase: 'swing', trajectory: traj });
        let step = 0;
        const interval = setInterval(() => {
            if (step >= traj.length) {
                clearInterval(interval);
                setDynamicTest({ running: false, phase: 'idle', trajectory: [] });
                return;
            }
            setFault(traj[step++]);
        }, 100);
    };

    // ---- SVG Interaction ----
    const handleSvgInteraction = useCallback((clientX: number, clientY: number) => {
        if (dynamicTest.running) return;
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        const svgX = (clientX - rect.left) * scaleX;
        const svgY = (clientY - rect.top) * scaleY;
        setFault({ r: (svgX - CENTER) / SCALE, x: -(svgY - CENTER) / SCALE });
    }, [dynamicTest.running]);

    const handleSvgClick = (e: React.MouseEvent) => handleSvgInteraction(e.clientX, e.clientY);
    const handleSvgTouch = (e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length > 0) handleSvgInteraction(e.touches[0].clientX, e.touches[0].clientY);
    };

    // ---- Phasors ----
    const phasors = useMemo(() => {
        const theta = Math.atan2(fault.x, fault.r) * RAD_TO_DEG;
        let vLen = [58, 58, 58], iLen = [14, 14, 14];
        let vAng = [0, -120, 120], iAng = [-30, -150, 90];
        if (status.trip) {
            if (settings.faultLoop === 'AG') { vLen[0] = 8; iLen[0] = 55; iAng[0] = -theta; }
            else if (settings.faultLoop === 'BC') { vLen[1] = 12; vLen[2] = 12; iLen[1] = 50; iLen[2] = 50; iAng[1] = -150 - theta; iAng[2] = 30 - theta; }
            else { vLen = [10, 10, 10]; iLen = [50, 50, 50]; iAng = [-theta, -120 - theta, 120 - theta]; }
        }
        const toXY = (len: number, ang: number) => ({ x: len * Math.cos(toRad(ang)), y: -len * Math.sin(toRad(ang)) });
        return {
            va: toXY(vLen[0], vAng[0]), vb: toXY(vLen[1], vAng[1]), vc: toXY(vLen[2], vAng[2]),
            ia: toXY(iLen[0], iAng[0]), ib: toXY(iLen[1], iAng[1]), ic: toXY(iLen[2], iAng[2])
        };
    }, [fault, status, settings.faultLoop]);

    // ---- SVG Boundary Renderers ----
    const getMhoPath = (reach: number, mta: number, color: string, label: string, zone: string) => {
        const r = reach / 2;
        const cx = CENTER + (r * Math.cos(toRad(mta))) * SCALE;
        const cy = CENTER - (r * Math.sin(toRad(mta))) * SCALE;
        const rPx = r * SCALE;
        const labelX = CENTER + (reach * Math.cos(toRad(mta))) * SCALE;
        const labelY = CENTER - (reach * Math.sin(toRad(mta))) * SCALE - 10;
        const isActive = status.zone === zone;
        return (
            <g key={label}>
                <circle cx={cx} cy={cy} r={rPx} fill={color} fillOpacity={isActive ? "0.22" : "0.08"} stroke={color} strokeWidth={isActive ? "3.5" : "2.5"} strokeDasharray={isActive ? "none" : "none"} />
                <text x={labelX} y={labelY} fill={color} fontSize="9" fontWeight="bold" textAnchor="middle" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontFamily: 'monospace' }}>{label}: {reach.toFixed(1)}Ω</text>
            </g>
        );
    };

    const getQuadPath = (reachX: number, reachR: number, mta: number, tilt: number, color: string, label: string, zone: string) => {
        const revX = -0.2 * reachX;
        const revR = -0.2 * reachR;
        const p1 = { r: revR, x: revX };
        const p2 = { r: revR, x: reachX + revR * Math.tan(toRad(tilt)) };
        const p3 = { r: reachR, x: reachX + reachR * Math.tan(toRad(tilt)) };
        const p4 = { r: reachR, x: revX };
        const toSVG = (pt: { r: number; x: number }) => `${CENTER + pt.r * SCALE},${CENTER - pt.x * SCALE}`;
        const isActive = status.zone === zone;
        return (
            <g key={label}>
                <polygon points={`${toSVG(p1)} ${toSVG(p2)} ${toSVG(p3)} ${toSVG(p4)}`} fill={color} fillOpacity={isActive ? "0.20" : "0.07"} stroke={color} strokeWidth={isActive ? "3.5" : "2.5"} />
                <text x={CENTER + reachR * SCALE - 5} y={CENTER - reachX * SCALE - 8} fill={color} fontSize="9" fontWeight="bold" textAnchor="end" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontFamily: 'monospace' }}>{label}: X={reachX}Ω R={reachR.toFixed(1)}Ω</text>
            </g>
        );
    };

    // ---- Quiz ----
    const startQuiz = (difficulty: string) => {
        const selected = [...QUESTION_BANK.filter(q => q.difficulty === difficulty)].sort(() => 0.5 - Math.random()).slice(0, 5);
        setQuizState({ active: true, difficulty, questions: selected, currentIdx: 0, score: 0, showResult: false, feedback: null });
    };
    const handleQuizAnswer = (idx: number) => {
        const q = quizState.questions[quizState.currentIdx];
        const correct = idx === q.a;
        setQuizState((p: any) => ({ ...p, feedback: { correct, text: correct ? "Correct!" : "Incorrect.", explanation: q.explanation }, score: correct ? p.score + 1 : p.score }));
    };
    const nextQuestion = () => {
        if (quizState.currentIdx < 4) setQuizState((p: any) => ({ ...p, currentIdx: p.currentIdx + 1, feedback: null }));
        else setQuizState((p: any) => ({ ...p, showResult: true }));
    };

    // ---- computed label positions for axis ----
    const axisLabels = useMemo(() => {
        const labels: { val: number; x: boolean }[] = [];
        for (let i = -20; i <= 20; i += 5) {
            if (i !== 0) labels.push({ val: i, x: true });
        }
        for (let i = -20; i <= 20; i += 5) {
            if (i !== 0) labels.push({ val: i, x: false });
        }
        return labels;
    }, []);

    const tripColor = status.zone === 'Z1' ? '#ef4444' : status.zone === 'Z2' ? '#f59e0b' : '#10b981';
    const faultDotX = CENTER + fault.r * SCALE;
    const faultDotY = CENTER - fault.x * SCALE;

    return (
        <div className={`min-h-screen h-screen font-sans flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#070b18] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <PageSEO
                title="Distance Lab | IEEE ANSI 21 Relay Simulator"
                description="World-class distance protection teaching simulator. Interactive Mho & Quadrilateral R-X diagrams, arc resistance, power swing blocking, graded labs."
                schema={distanceSchema}
            />

            {/* ════ HEADER ════ */}
            <header className={`shrink-0 flex items-center justify-between px-3 py-2 border-b ${isDark ? 'bg-[#0a0f1f] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-md shadow-indigo-900/30">
                        <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-widest text-indigo-400">Distance Lab</h1>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider hidden sm:block">ANSI 21 · IEEE C37.113 · IEC 60255</p>
                    </div>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {[
                        { id: 'sim', label: 'Simulator', icon: <Target className="w-3.5 h-3.5" /> },
                        { id: 'theory', label: 'Theory', icon: <BookOpen className="w-3.5 h-3.5" /> },
                        { id: 'quiz', label: 'Quiz', icon: <BrainCircuit className="w-3.5 h-3.5" /> },
                        { id: 'missions', label: 'Labs', icon: <Trophy className="w-3.5 h-3.5" /> }
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${status.trip ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse' : 'bg-emerald-500/10 border-emerald-700 text-emerald-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.trip ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        {status.trip ? `TRIP · ${status.zone} · ${status.time}ms` : 'NORMAL'}
                    </div>
                    <button onClick={() => setSettings((s: any) => ({ ...s, charType: 'MHO', z1Reach: 8.0, z2Reach: 12.0, z3Reach: 18.0, mta: 75, psbEnabled: false }))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </header>

            {/* ════ MOBILE NAV ════ */}
            <div className={`md:hidden flex border-b ${isDark ? 'bg-[#0a0f1f] border-slate-800' : 'bg-white border-slate-200'}`}>
                {[
                    { id: 'sim', label: 'Simulator', icon: <Target className="w-3.5 h-3.5" /> },
                    { id: 'theory', label: 'Theory', icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: 'quiz', label: 'Quiz', icon: <BrainCircuit className="w-3.5 h-3.5" /> },
                    { id: 'missions', label: 'Labs', icon: <Trophy className="w-3.5 h-3.5" /> }
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                        className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[8px] font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === t.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500'}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ════ BODY ════ */}
            <div className="flex-1 overflow-hidden flex flex-col">

                {/* === SIMULATOR TAB === */}
                {activeTab === 'sim' && (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                        {/* ── Mobile Panel Switcher ── */}
                        <div className={`md:hidden flex border-b ${isDark ? 'bg-[#0a0f1f] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            {[
                                { id: 'graph', label: 'R-X Graph', icon: <Target className="w-3 h-3" /> },
                                { id: 'settings', label: 'IED', icon: <Sliders className="w-3 h-3" /> },
                                { id: 'teach', label: 'Explain', icon: <GraduationCap className="w-3 h-3" /> },
                                { id: 'labs', label: 'Labs', icon: <Trophy className="w-3 h-3" /> },
                            ].map(t => (
                                <button key={t.id} onClick={() => setMobilePanel(t.id as any)}
                                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[8px] font-black uppercase border-b-2 transition-all ${mobilePanel === t.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500'}`}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        {/* ── LEFT: R-X Impedance Plane ── */}
                        <div className={`${mobilePanel === 'graph' ? 'flex' : 'hidden'} md:flex flex-col ${isDark ? 'bg-[#080c1a]' : 'bg-slate-100'} md:flex-1 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
                            style={{ minHeight: mobilePanel === 'graph' ? '60vw' : undefined }}>

                            {/* Graph header row */}
                            <div className={`shrink-0 flex items-center justify-between px-3 py-1.5 border-b ${isDark ? 'bg-[#0a0f1f] border-slate-800' : 'bg-white border-slate-200'}`}>
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    <MousePointer2 className="w-3 h-3 text-indigo-500" /> R-X Impedance Plane
                                    <span className="text-[8px] text-slate-600 normal-case font-mono">(tap/click to place fault)</span>
                                </div>
                                <span className="font-mono text-[10px] font-bold text-indigo-400">
                                    Z = {fault.r.toFixed(2)} + j{fault.x.toFixed(2)} Ω · |Z| = {measurements.mag.toFixed(2)} Ω ∠{measurements.angle.toFixed(1)}°
                                </span>
                            </div>

                            {/* SVG Canvas */}
                            <div className="flex-1 relative bg-[#030712] cursor-crosshair touch-none overflow-hidden" onClick={handleSvgClick}>
                                <svg ref={svgRef} viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
                                    onTouchStart={handleSvgTouch} onTouchMove={handleSvgTouch}
                                    className="w-full h-full" style={{ touchAction: 'none' }}>
                                    <defs>
                                        <pattern id="subgrid" width="12" height="12" patternUnits="userSpaceOnUse">
                                            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#0f172a" strokeWidth="0.5" />
                                        </pattern>
                                        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                            <rect width="60" height="60" fill="url(#subgrid)" />
                                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="1" />
                                        </pattern>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                        </filter>
                                        <filter id="glowFault">
                                            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                        </filter>
                                    </defs>

                                    {/* Grid */}
                                    <rect width="100%" height="100%" fill="url(#grid)" />

                                    {/* Axis labels */}
                                    {axisLabels.map(({ val, x }, i) => x ? (
                                        <text key={`ax${i}`} x={CENTER + val * SCALE} y={CENTER + 16} fill="#334155" fontSize="8" textAnchor="middle" fontFamily="monospace">{val}</text>
                                    ) : (
                                        <text key={`ay${i}`} x={CENTER - 16} y={CENTER - val * SCALE + 3} fill="#334155" fontSize="8" textAnchor="end" fontFamily="monospace">{val}</text>
                                    ))}

                                    {/* R-axis label */}
                                    <text x={CANVAS_SIZE - 8} y={CENTER - 8} fill="#475569" fontSize="9" textAnchor="end" fontFamily="monospace">R (Ω)</text>
                                    <text x={CENTER + 10} y={14} fill="#475569" fontSize="9" textAnchor="start" fontFamily="monospace">jX (Ω)</text>

                                    {/* Axes */}
                                    <line x1="0" y1={CENTER} x2={CANVAS_SIZE} y2={CENTER} stroke="#334155" strokeWidth="1.5" />
                                    <line x1={CENTER} y1="0" x2={CENTER} y2={CANVAS_SIZE} stroke="#334155" strokeWidth="1.5" />

                                    {/* MTA Reference Line */}
                                    <line
                                        x1={CENTER} y1={CENTER}
                                        x2={CENTER + (settings.z3Reach * Math.cos(toRad(settings.mta))) * SCALE}
                                        y2={CENTER - (settings.z3Reach * Math.sin(toRad(settings.mta))) * SCALE}
                                        stroke="#475569" strokeWidth="1" strokeDasharray="4,4" opacity="0.7"
                                    />
                                    <text
                                        x={CENTER + (settings.z3Reach * 0.5 * Math.cos(toRad(settings.mta))) * SCALE + 8}
                                        y={CENTER - (settings.z3Reach * 0.5 * Math.sin(toRad(settings.mta))) * SCALE}
                                        fill="#64748b" fontSize="8" fontFamily="monospace" fontStyle="italic"
                                    >MTA {settings.mta}°</text>

                                    {/* Zone Boundaries */}
                                    {settings.charType === 'MHO' ? (<>
                                        {getMhoPath(settings.z3Reach, settings.mta, '#10b981', 'Z3', 'Z3')}
                                        {getMhoPath(settings.z2Reach, settings.mta, '#f59e0b', 'Z2', 'Z2')}
                                        {getMhoPath(settings.z1Reach, settings.mta, '#ef4444', 'Z1', 'Z1')}
                                    </>) : (<>
                                        {getQuadPath(settings.z3Reach, settings.quadResReach * 1.2, settings.mta, settings.tilt, '#10b981', 'Z3', 'Z3')}
                                        {getQuadPath(settings.z2Reach, settings.quadResReach, settings.mta, settings.tilt, '#f59e0b', 'Z2', 'Z2')}
                                        {getQuadPath(settings.z1Reach, settings.quadResReach * 0.8, settings.mta, settings.tilt, '#ef4444', 'Z1', 'Z1')}
                                    </>)}

                                    {/* Arc offset vectors */}
                                    {arcSettings.enabled && apparentZ && (
                                        <g>
                                            <line x1={CENTER} y1={CENTER}
                                                x2={CENTER + arcSettings.faultLocation * arcSettings.lineR * SCALE}
                                                y2={CENTER - arcSettings.faultLocation * arcSettings.lineX * SCALE}
                                                stroke="#22d3ee" strokeWidth="2" strokeDasharray="5,4" />
                                            <line x1={CENTER + arcSettings.faultLocation * arcSettings.lineR * SCALE}
                                                y1={CENTER - arcSettings.faultLocation * arcSettings.lineX * SCALE}
                                                x2={CENTER + apparentZ.r * SCALE}
                                                y2={CENTER - apparentZ.x * SCALE}
                                                stroke="#f97316" strokeWidth="2.5" />
                                            <circle cx={CENTER + apparentZ.r * SCALE} cy={CENTER - apparentZ.x * SCALE} r="5" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
                                            <text x={CENTER + apparentZ.r * SCALE + 7} y={CENTER - apparentZ.x * SCALE - 6} fill="#f97316" fontSize="8" fontFamily="monospace">Arc: +{arcResistanceOhms.toFixed(2)}Ω</text>
                                        </g>
                                    )}

                                    {/* Impedance Phasor vector */}
                                    <line x1={CENTER} y1={CENTER} x2={faultDotX} y2={faultDotY} stroke="#6366f1" strokeWidth="2.5" opacity="0.8" />

                                    {/* Fault dot */}
                                    <circle cx={faultDotX} cy={faultDotY} r={status.trip ? 10 : 8}
                                        fill={status.trip ? tripColor : '#6366f1'}
                                        filter="url(#glowFault)"
                                        className={status.trip ? 'animate-pulse' : ''}
                                    />
                                    <circle cx={faultDotX} cy={faultDotY} r="4" fill="white" opacity="0.9" />

                                    {/* Live Z readout badge (keeps in frame) */}
                                    {(() => {
                                        const bx = Math.min(Math.max(faultDotX + 12, 8), CANVAS_SIZE - 110);
                                        const by = Math.min(Math.max(faultDotY - 24, 8), CANVAS_SIZE - 30);
                                        return (
                                            <g>
                                                <rect x={bx} y={by} width="100" height="18" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="0.8" opacity="0.95" />
                                                <text x={bx + 5} y={by + 12} fill="#c7d2fe" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                                                    {fault.r.toFixed(1)}+j{fault.x.toFixed(1)}Ω ∠{measurements.angle.toFixed(0)}°
                                                </text>
                                            </g>
                                        );
                                    })()}

                                    {/* Swing trajectory trail */}
                                    {dynamicTest.trajectory.length > 1 && dynamicTest.trajectory.map((pt, i) =>
                                        i < dynamicTest.trajectory.findIndex(p => p.r === fault.r && p.x === fault.x) ? (
                                            <circle key={i} cx={CENTER + pt.r * SCALE} cy={CENTER - pt.x * SCALE} r="2" fill="#a78bfa" opacity="0.35" />
                                        ) : null
                                    )}
                                </svg>
                            </div>

                            {/* Live Meters Strip */}
                            <div className={`shrink-0 flex items-center gap-0 border-t ${isDark ? 'border-slate-800 bg-[#0a0f1f]' : 'border-slate-200 bg-white'}`}>
                                {[
                                    { label: '|Z| Measured', val: `${measurements.mag.toFixed(3)} Ω`, color: status.trip ? tripColor : '#6366f1' },
                                    { label: 'Angle', val: `${measurements.angle.toFixed(1)}°`, color: '#94a3b8' },
                                    { label: 'Fault Location', val: `~${measurements.faultKm.toFixed(1)} km`, color: '#22d3ee' },
                                    { label: 'Line Coverage', val: `${Math.max(0, Math.min(measurements.faultPct, 200)).toFixed(0)}%`, color: '#f59e0b' },
                                    { label: 'Trip Delay', val: teach.tripDelayText, color: status.trip ? tripColor : '#64748b' },
                                ].map(m => (
                                    <div key={m.label} className={`flex-1 flex flex-col items-center justify-center py-1.5 border-r last:border-r-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                        <span className="text-[8px] text-slate-500 uppercase tracking-widest">{m.label}</span>
                                        <span className="text-[10px] font-black font-mono" style={{ color: m.color }}>{m.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── RIGHT: Control & Teaching Panel ── */}
                        <div className={`${mobilePanel !== 'graph' ? 'flex' : 'hidden'} md:flex flex-col md:w-[360px] xl:w-[400px] shrink-0 overflow-hidden ${isDark ? 'bg-[#0a0f1f]' : 'bg-white'}`}>
                            <div className="flex-1 overflow-y-auto">

                                {/* ─ IED SETTINGS ─ */}
                                <div className={mobilePanel === 'settings' || mobilePanel === 'graph' ? 'block' : 'md:block hidden'}>
                                    {/* Char type selector */}
                                    <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">IED Characteristic Type</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['MHO', 'QUAD'] as const).map(type => (
                                                <button key={type} onClick={() => setSettings((s: any) => ({ ...s, charType: type }))}
                                                    className={`py-2.5 rounded-xl text-[9px] font-black border transition-all ${settings.charType === type ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30' : `text-slate-500 border-slate-700 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}`}>
                                                    {type === 'MHO' ? '⬤ Mho Circle' : '▬ Quadrilateral'}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed">
                                            {settings.charType === 'MHO'
                                                ? "Mho: Inherently directional. Limited arc resistance coverage. Best for short lines."
                                                : "Quad: Independent X and R reach. Excellent arc resistance coverage. Preferred for ground faults."}
                                        </p>
                                    </div>

                                    {/* Zone Reach */}
                                    <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-2`}>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Zone Reach Settings</p>
                                        <Slider label="Zone 1 Reach (80% line)" unit=" Ω" min={1} max={20} step={0.5} value={settings.z1Reach} onChange={e => setSettings((s: any) => ({ ...s, z1Reach: Number(e.target.value) }))} color="red" />
                                        <Slider label="Zone 2 Reach (120% line)" unit=" Ω" min={1} max={25} step={0.5} value={settings.z2Reach} onChange={e => setSettings((s: any) => ({ ...s, z2Reach: Number(e.target.value) }))} color="amber" />
                                        <Slider label="Zone 3 Reach (Backup)" unit=" Ω" min={1} max={30} step={0.5} value={settings.z3Reach} onChange={e => setSettings((s: any) => ({ ...s, z3Reach: Number(e.target.value) }))} color="emerald" />
                                        {settings.charType === 'QUAD' && (
                                            <Slider label="Resistive Reach (R-axis)" unit=" Ω" min={1} max={30} step={0.5} value={settings.quadResReach} onChange={e => setSettings((s: any) => ({ ...s, quadResReach: Number(e.target.value) }))} color="blue" />
                                        )}
                                        <Slider label="MTA (Line Impedance Angle)" unit="°" min={30} max={90} step={1} value={settings.mta} onChange={e => setSettings((s: any) => ({ ...s, mta: Number(e.target.value) }))} color="blue" />
                                    </div>

                                    {/* Line Parameters */}
                                    <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-2`}>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Line Parameters</p>
                                        <Slider label="Line Length" unit=" km" min={10} max={500} step={10} value={settings.lineLength} onChange={e => setSettings((s: any) => ({ ...s, lineLength: Number(e.target.value) }))} color="purple" />
                                        <Slider label="Nominal Voltage" unit=" kV" min={33} max={765} step={1} value={settings.nomVoltage} onChange={e => setSettings((s: any) => ({ ...s, nomVoltage: Number(e.target.value) }))} color="purple" />
                                    </div>

                                    {/* PSB & Dynamic Test */}
                                    <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-3`}>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Power Swing & Dynamic</p>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>PSB Element Override</span>
                                                <span className="text-[9px] text-slate-500">Blocks trips during gradual swing encroachment</span>
                                            </div>
                                            <button onClick={() => setSettings((s: any) => ({ ...s, psbEnabled: !s.psbEnabled }))}
                                                className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 ${settings.psbEnabled ? 'bg-indigo-600' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}>
                                                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${settings.psbEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                        <button onClick={startDynamicTest} disabled={dynamicTest.running}
                                            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${dynamicTest.running ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'}`}>
                                            {dynamicTest.running ? <><Square className="w-3.5 h-3.5 animate-pulse" /> Swing Running...</> : <><Play className="w-3.5 h-3.5" /> Run Dynamic Swing Test</>}
                                        </button>
                                    </div>

                                    {/* Arc & Infeed */}
                                    <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-3`}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Arc & Infeed Modeling</p>
                                            <button onClick={() => setArcSettings((s: any) => ({ ...s, enabled: !s.enabled }))}
                                                className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border transition-all ${arcSettings.enabled ? 'bg-orange-600 border-orange-500 text-white' : `border-slate-600 text-slate-500 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}`}>
                                                {arcSettings.enabled ? '● ON' : '○ OFF'}
                                            </button>
                                        </div>
                                        {arcSettings.enabled && (<>
                                            <Slider label="Arc Gap Length" unit=" m" min={0.5} max={5} step={0.1} value={arcSettings.gapLength} onChange={e => setArcSettings((s: any) => ({ ...s, gapLength: Number(e.target.value) }))} color="orange" />
                                            <Slider label="Fault Current" unit=" A" min={1000} max={20000} step={500} value={arcSettings.faultCurrent} onChange={e => setArcSettings((s: any) => ({ ...s, faultCurrent: Number(e.target.value) }))} color="orange" />
                                            <Slider label="Infeed Ratio" unit="×" min={1.0} max={5.0} step={0.1} value={arcSettings.infeedRatio} onChange={e => setArcSettings((s: any) => ({ ...s, infeedRatio: Number(e.target.value) }))} color="orange" />
                                            <Slider label="Fault Location (p.u.)" unit="" min={0.1} max={1.0} step={0.05} value={arcSettings.faultLocation} onChange={e => setArcSettings((s: any) => ({ ...s, faultLocation: Number(e.target.value) }))} color="orange" />
                                            {arcResistanceOhms > 0 && (
                                                <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-950/30 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
                                                    <p className="text-[9px] font-mono text-orange-400">Ra (Warrington) = {arcResistanceOhms.toFixed(3)} Ω</p>
                                                    <p className="text-[9px] font-mono text-orange-500">Apparent Ra = {(arcResistanceOhms * arcSettings.infeedRatio).toFixed(3)} Ω (with infeed)</p>
                                                </div>
                                            )}
                                        </>)}
                                    </div>

                                    {/* Fault Loop Selector */}
                                    <div className={`p-3 ${isDark ? '' : ''} space-y-2`}>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fault Loop Selection</p>
                                        <select value={settings.faultLoop} onChange={e => setSettings((s: any) => ({ ...s, faultLoop: e.target.value }))}
                                            className={`w-full border rounded-xl p-2 text-xs font-bold outline-none transition-all ${isDark ? 'bg-[#070b18] border-slate-700 text-cyan-400' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                            <option value="AG">Phase A-to-Ground (AG) — ZA = VA / (IA + K0·IN)</option>
                                            <option value="BC">Phase B-to-C (BC) — ZBC = (VB−VC) / (IB−IC)</option>
                                            <option value="ABC">Three-Phase (ABC) — Z1 = VA / IA</option>
                                        </select>
                                    </div>
                                </div>

                                {/* ─ TEACHING SECTION ─ */}
                                <div className={mobilePanel === 'teach' ? 'block' : 'md:block hidden'}>
                                    {/* Live Result Explainer */}
                                    <div className={`m-3 rounded-2xl border overflow-hidden ${status.trip ? (status.zone === 'Z1' ? 'border-red-700 bg-red-950/20' : status.zone === 'Z2' ? 'border-amber-700 bg-amber-950/20' : 'border-emerald-700 bg-emerald-950/20') : isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
                                        <div className={`px-3 py-2 flex items-center gap-2 border-b ${status.trip ? (status.zone === 'Z1' ? 'border-red-800 bg-red-950/30' : status.zone === 'Z2' ? 'border-amber-800 bg-amber-950/30' : 'border-emerald-800 bg-emerald-950/30') : isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                            {status.trip ? <Zap className={`w-4 h-4 ${status.zone === 'Z1' ? 'text-red-400' : status.zone === 'Z2' ? 'text-amber-400' : 'text-emerald-400'}`} /> : <Activity className="w-4 h-4 text-indigo-400" />}
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${status.trip ? (status.zone === 'Z1' ? 'text-red-400' : status.zone === 'Z2' ? 'text-amber-400' : 'text-emerald-400') : 'text-indigo-400'}`}>
                                                {teach.title}
                                            </span>
                                        </div>
                                        <div className="p-3 space-y-2.5">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">What Happened</p>
                                                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{teach.body}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Why It Happened</p>
                                                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{teach.why}</p>
                                            </div>
                                            {status.trip && (
                                                <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Engineering Math</p>
                                                    <LaTeX math={`|Z_{meas}| = \\sqrt{(${fault.r.toFixed(2)})^2 + (${fault.x.toFixed(2)})^2} = ${measurements.mag.toFixed(3)}\\,\\Omega`} />
                                                    {status.zone === 'Z1' && <LaTeX math={`${measurements.mag.toFixed(3)}\\,\\Omega \\leq Z_{1reach} = ${settings.z1Reach}\\,\\Omega \\Rightarrow \\mathbf{TRIP\\;Z1}`} />}
                                                    {status.zone === 'Z2' && <LaTeX math={`Z_{1reach} < ${measurements.mag.toFixed(3)} \\leq ${settings.z2Reach}\\,\\Omega \\Rightarrow \\mathbf{TRIP\\;Z2\\;(300ms)}`} />}
                                                    {status.zone === 'Z3' && <LaTeX math={`Z_{2reach} < ${measurements.mag.toFixed(3)} \\leq ${settings.z3Reach}\\,\\Omega \\Rightarrow \\mathbf{TRIP\\;Z3\\;(1000ms)}`} />}
                                                </div>
                                            )}
                                            <div className={`flex items-center gap-2 p-2 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                                                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Relay Action</p>
                                                    <p className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{teach.actionRequired}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[8px] text-slate-600">
                                                <FileText className="w-3 h-3" />
                                                <span className="font-mono">{teach.standard}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Distance Protection Handbook */}
                                    <div className={`mx-3 mb-3 rounded-2xl border overflow-hidden ${isDark ? 'border-emerald-900 bg-emerald-950/10' : 'border-emerald-200 bg-emerald-50/50'}`}>
                                        <div className={`px-3 py-2 flex items-center gap-2 border-b ${isDark ? 'border-emerald-900' : 'border-emerald-200'}`}>
                                            <GraduationCap className="w-4 h-4 text-emerald-400" />
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Distance Protection — Quick Reference</span>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {[
                                                {
                                                    title: "What does Z = V/I mean?",
                                                    text: "The relay continuously divides the measured terminal voltage (V) by the measured current (I). This ratio is the apparent impedance. During normal load, Z is large. During a fault, V collapses and I surges, so Z drops dramatically and falls inside a protection zone."
                                                },
                                                {
                                                    title: "Zone 1: Why only 80%?",
                                                    text: "CT and VT measurement errors can make the relay see slightly further than reality. Setting Zone 1 at 80% ensures we never overreach past the remote busbar. The missing 20% at the end of the line is covered by Zone 2 with a 300ms delay."
                                                },
                                                {
                                                    title: "Zone 2: Why 120% reach + 300ms?",
                                                    text: "Zone 2 overreaches into adjacent lines. The 300ms delay allows the remote Zone 1 (which sees the same fault as a Zone 1 fault) to operate first. This gives selectivity — only the closest relay trips instantaneously."
                                                },
                                                {
                                                    title: "Zone 3: Remote backup with 1000ms",
                                                    text: "Zone 3 provides last-resort backup for the adjacent line section. If both remote Zone 1 and Zone 2 fail, our Zone 3 eventually clears the fault after 1 second. Zone 3 is vulnerable to false trips during heavy load (Load Encroachment)."
                                                },
                                                {
                                                    title: "Mho vs Quadrilateral",
                                                    text: "Mho circles are directional and simple but have limited resistive reach. Quadrilateral boundaries allow independent X (reach) and R (arc resistance) settings, making them superior for ground fault protection on long HV/EHV lines."
                                                },
                                                {
                                                    title: "Arc Resistance & Infeed Effect",
                                                    text: "A real fault arc adds resistive impedance to the fault path. Additionally, infeed current from other sources makes the relay see a higher apparent Z than the actual fault impedance. Combined, these effects cause Mho relays to underreach and miss faults."
                                                }
                                            ].map((item, i) => (
                                                <div key={i} className={`p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
                                                    <p className={`text-[9px] font-black uppercase tracking-wide mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{item.title}</p>
                                                    <p className={`text-[9.5px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Phasor Diagram */}
                                    <div className={`mx-3 mb-3 rounded-2xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                        <div className={`px-3 py-2 flex items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-indigo-400" />
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Phase Phasor Diagram</span>
                                            </div>
                                            <span className="text-[8px] font-mono text-slate-500">{settings.faultLoop}</span>
                                        </div>
                                        <div className={`p-3 flex gap-3 items-start ${isDark ? 'bg-[#070b18]' : 'bg-slate-50'}`}>
                                            <svg width="140" height="140" viewBox="0 0 150 150" className="shrink-0">
                                                <circle cx="75" cy="75" r="62" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,3" />
                                                <line x1="13" y1="75" x2="137" y2="75" stroke="#1e293b" strokeWidth="0.8" />
                                                <line x1="75" y1="13" x2="75" y2="137" stroke="#1e293b" strokeWidth="0.8" />
                                                {/* Voltage phasors */}
                                                <line x1="75" y1="75" x2={75 + phasors.va.x} y2={75 + phasors.va.y} stroke="#eab308" strokeWidth="2.5" markerEnd="url(#arrowY)" />
                                                <line x1="75" y1="75" x2={75 + phasors.vb.x} y2={75 + phasors.vb.y} stroke="#3b82f6" strokeWidth="2.5" />
                                                <line x1="75" y1="75" x2={75 + phasors.vc.x} y2={75 + phasors.vc.y} stroke="#ef4444" strokeWidth="2.5" />
                                                {/* Current phasors (dashed) */}
                                                <line x1="75" y1="75" x2={75 + phasors.ia.x} y2={75 + phasors.ia.y} stroke="#eab308" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
                                                <line x1="75" y1="75" x2={75 + phasors.ib.x} y2={75 + phasors.ib.y} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
                                                <line x1="75" y1="75" x2={75 + phasors.ic.x} y2={75 + phasors.ic.y} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
                                            </svg>
                                            <div className="text-[9px] space-y-1.5">
                                                {[
                                                    { color: '#eab308', label: 'Phase A Voltage' },
                                                    { color: '#3b82f6', label: 'Phase B Voltage' },
                                                    { color: '#ef4444', label: 'Phase C Voltage' },
                                                ].map(p => (
                                                    <div key={p.label} className="flex items-center gap-1.5">
                                                        <div className="w-5 h-0.5" style={{ backgroundColor: p.color }} />
                                                        <span className="text-slate-500">{p.label}</span>
                                                    </div>
                                                ))}
                                                {[
                                                    { color: '#eab308', label: 'Phase A Current' },
                                                    { color: '#3b82f6', label: 'Phase B Current' },
                                                    { color: '#ef4444', label: 'Phase C Current' },
                                                ].map(p => (
                                                    <div key={p.label} className="flex items-center gap-1.5">
                                                        <div className="w-5 border-t border-dashed" style={{ borderColor: p.color }} />
                                                        <span className="text-slate-500">{p.label}</span>
                                                    </div>
                                                ))}
                                                {status.trip && (
                                                    <p className="text-[8.5px] text-red-400 font-bold mt-2 border border-red-800 rounded p-1">
                                                        ⚡ Fault: V collapses, I surges
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ─ LABS SECTION ─ */}
                                <div className={mobilePanel === 'labs' ? 'block' : 'md:block hidden'}>
                                    <div className="p-3 space-y-3">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Graded Engineering Labs</p>
                                        {labs.map((lab, idx) => (
                                            <div key={lab.id} className={`rounded-2xl border overflow-hidden transition-all ${activeLab === idx ? (isDark ? 'border-indigo-700 bg-indigo-950/20' : 'border-indigo-300 bg-indigo-50') : (isDark ? 'border-slate-800' : 'border-slate-200')}`}>
                                                <button onClick={() => startLab(idx)} className="w-full text-left p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <span className="text-[8px] font-mono text-slate-500 block">LAB {idx + 1}</span>
                                                            <h4 className={`text-[10px] font-black uppercase leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{lab.name}</h4>
                                                            <p className="text-[9px] text-indigo-400 mt-0.5">{lab.objective}</p>
                                                        </div>
                                                        <ArrowRight className={`w-4 h-4 shrink-0 mt-1 transition-transform ${activeLab === idx ? 'rotate-90 text-indigo-400' : 'text-slate-600'}`} />
                                                    </div>
                                                </button>
                                                {activeLab === idx && (
                                                    <div className={`px-3 pb-3 space-y-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                                        <p className={`text-[9.5px] leading-relaxed pt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{lab.description}</p>
                                                        <button onClick={verifyLab}
                                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all">
                                                            <Check className="w-3.5 h-3.5" /> Validate My Calibration
                                                        </button>
                                                        {labResult && (
                                                            <div className={`p-3 rounded-xl border space-y-1.5 ${labResult === 'passed' ? (isDark ? 'bg-emerald-950/30 border-emerald-700' : 'bg-emerald-50 border-emerald-300') : (isDark ? 'bg-red-950/30 border-red-700' : 'bg-red-50 border-red-300')}`}>
                                                                <p className={`text-[10px] font-black uppercase ${labResult === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    {labResult === 'passed' ? '🎉 Verified! Lab Complete.' : '❌ Not yet correct.'}
                                                                </p>
                                                                {labResult === 'failed' && <p className="text-[9px] text-slate-400">Hint: {lab.hint}</p>}
                                                                {labResult === 'passed' && <p className={`text-[9.5px] leading-relaxed ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{lab.lesson}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {/* === THEORY TAB === */}
                {activeTab === 'theory' && (
                    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <div className="max-w-4xl mx-auto">
                            <TheoryLibrary title="Distance Impedance Protection" description="Comprehensive handbook on ANSI 21 distance relay configuration and coordination." sections={DISTANCE_THEORY_CONTENT} />
                        </div>
                    </div>
                )}

                {/* === QUIZ TAB === */}
                {activeTab === 'quiz' && (
                    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <div className="max-w-2xl mx-auto space-y-6">
                            {!quizState.active ? (
                                <div className="space-y-4">
                                    <div className={`p-5 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                                        <h2 className={`text-lg font-black uppercase mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Distance Protection Knowledge Test</h2>
                                        <p className="text-xs text-slate-500 mb-4">5 questions per session. Tests engineering depth from fundamentals to advanced protection coordination.</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['easy', 'medium', 'hard'].map(d => (
                                                <button key={d} onClick={() => startQuiz(d)}
                                                    className={`py-3 rounded-xl font-black uppercase text-[10px] transition-all border ${d === 'easy' ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white' : d === 'medium' ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white' : 'bg-red-600 hover:bg-red-500 border-red-500 text-white'}`}>
                                                    {d === 'easy' ? '🟢 Basics' : d === 'medium' ? '🟡 Intermediate' : '🔴 Advanced'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : quizState.showResult ? (
                                <div className={`p-6 rounded-2xl border text-center space-y-4 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                                    <Trophy className="w-14 h-14 text-yellow-500 mx-auto" />
                                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Score: {quizState.score} / 5</h3>
                                    <p className="text-slate-500 text-sm">{quizState.score === 5 ? "Perfect! You are relay-ready." : quizState.score >= 3 ? "Good understanding. Review the weak areas." : "Keep studying! Try the Theory tab."}</p>
                                    <button onClick={() => setQuizState({ ...quizState, active: false })}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl transition-all">
                                        Try Another Quiz
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                                        <div className="flex justify-between text-[9px] text-slate-500 mb-3">
                                            <span>Q {quizState.currentIdx + 1} / 5 · {quizState.difficulty}</span>
                                            <span>Score: {quizState.score}</span>
                                        </div>
                                        <p className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{quizState.questions[quizState.currentIdx]?.q}</p>
                                        <div className="space-y-2">
                                            {quizState.questions[quizState.currentIdx]?.options.map((opt: string, i: number) => (
                                                <button key={i} onClick={() => handleQuizAnswer(i)} disabled={!!quizState.feedback}
                                                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all ${quizState.feedback ? (i === quizState.questions[quizState.currentIdx].a ? 'bg-emerald-950/30 border-emerald-600 text-emerald-400' : 'opacity-40 border-slate-700') : (isDark ? 'border-slate-700 hover:border-indigo-500 text-slate-300 hover:bg-indigo-950/20' : 'border-slate-200 hover:border-indigo-400 text-slate-700 hover:bg-indigo-50')}`}>
                                                    <span className="font-mono text-slate-500 mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {quizState.feedback && (
                                        <div className={`p-4 rounded-2xl border space-y-2 ${quizState.feedback.correct ? (isDark ? 'bg-emerald-950/30 border-emerald-700' : 'bg-emerald-50 border-emerald-300') : (isDark ? 'bg-red-950/30 border-red-700' : 'bg-red-50 border-red-300')}`}>
                                            <p className={`font-black text-sm ${quizState.feedback.correct ? 'text-emerald-400' : 'text-red-400'}`}>{quizState.feedback.text}</p>
                                            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{quizState.feedback.explanation}</p>
                                            <button onClick={nextQuestion} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-black uppercase rounded-xl transition-all">
                                                {quizState.currentIdx < 4 ? 'Next Question →' : 'See Results'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* === MISSIONS TAB === */}
                {activeTab === 'missions' && (
                    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <div className="max-w-3xl mx-auto space-y-4">
                            <div className={`p-4 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                                <h2 className={`text-base font-black uppercase mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Engineering Lab Missions</h2>
                                <p className="text-xs text-slate-500">Graded real-world relay calibration challenges. Complete each lab to master distance protection.</p>
                            </div>
                            {labs.map((lab, idx) => (
                                <div key={lab.id} className={`rounded-2xl border overflow-hidden ${activeLab === idx ? (isDark ? 'border-indigo-700' : 'border-indigo-400') : (isDark ? 'border-slate-800' : 'border-slate-200')}`}>
                                    <button onClick={() => startLab(idx)} className={`w-full text-left p-4 ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition-all`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${activeLab === idx ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>{idx + 1}</div>
                                            <div className="flex-1">
                                                <h4 className={`text-xs font-black uppercase ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{lab.name}</h4>
                                                <p className="text-[10px] text-indigo-400 mt-0.5">{lab.objective}</p>
                                            </div>
                                            <ArrowRight className={`w-4 h-4 text-slate-500 transition-transform ${activeLab === idx ? 'rotate-90' : ''}`} />
                                        </div>
                                    </button>
                                    {activeLab === idx && (
                                        <div className={`px-4 pb-4 space-y-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                            <p className={`text-xs leading-relaxed pt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{lab.description}</p>
                                            <p className="text-[9px] text-slate-500">Go to the Simulator tab to apply changes, then return here to validate.</p>
                                            <button onClick={verifyLab} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl flex items-center justify-center gap-2 transition-all">
                                                <Check className="w-4 h-4" /> Validate My Calibration
                                            </button>
                                            {labResult && (
                                                <div className={`p-4 rounded-xl border space-y-2 ${labResult === 'passed' ? (isDark ? 'bg-emerald-950/30 border-emerald-700' : 'bg-emerald-50 border-emerald-300') : (isDark ? 'bg-red-950/30 border-red-700' : 'bg-red-50 border-red-300')}`}>
                                                    <p className={`text-sm font-black ${labResult === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {labResult === 'passed' ? '🎉 Lab Passed!' : '❌ Not Complete Yet'}
                                                    </p>
                                                    {labResult === 'failed' && <p className="text-xs text-slate-400">Hint: {lab.hint}</p>}
                                                    {labResult === 'passed' && (
                                                        <div className={`text-xs leading-relaxed p-3 rounded-lg border ${isDark ? 'bg-emerald-950/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200'}`}>
                                                            <p className="font-black text-emerald-400 mb-1">What You Learned:</p>
                                                            <p className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>{lab.lesson}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}