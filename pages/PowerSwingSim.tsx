import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Play, RotateCcw, AlertCircle, CheckCircle2, Activity, Zap,
    HelpCircle, Book, Flag, AlertTriangle, MonitorPlay, GraduationCap, Award, Settings,
    Info, StopCircle, RefreshCw, Share2, Radar, ShieldAlert, Award as TrophyIcon, Sparkles, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import Slider from '../components/Slider';
import TheoryLibrary from '../components/TheoryLibrary';
import { POWER_SWING_THEORY_CONTENT } from '../data/learning-modules/power-swing';
import SEO from "../components/SEO";
import { LaTeX } from '../components/UI/LaTeX';

// ========================= TYPES & CONSTANTS =========================
const QUIZ_DATA = {
    easy: [
        { q: "What ANSI standard code designates Out-of-Step / Power Swing protection?", opts: ["ANSI 21", "ANSI 50/51", "ANSI 78", "ANSI 87"], ans: 2, explanation: "ANSI 78 is Out-of-Step (OOS) protection. ANSI 21 is distance protection, which uses PSB (Power Swing Blocking) to override its operation." },
        { q: "A power swing is fundamentally caused by:", opts: ["High harmonic currents", "Rotor angle oscillations in generators", "CT saturation during faults", "Low system frequency"], ans: 1, explanation: "Power swings occur when generator rotors swing or oscillate relative to the rest of the grid due to mechanical-electrical power imbalances." },
        { q: "What does the PSB acronym stand for in distance protection?", opts: ["Power System Backup", "Power Swing Blocking", "Phase Sequence Balance", "Peak Signal Booster"], ans: 1, explanation: "PSB stands for Power Swing Blocking, which blocks distance relay elements (like Zone 1/2) from false tripping during stable swings." },
        { q: "During a stable power swing, the relay should:", opts: ["Trip the breaker instantly", "Block distance trip outputs to prevent blackout", "Increase the Zone 1 reach", "Alarm and trip after 100ms"], ans: 1, explanation: "For stable power swings, the system will recover synchronism. Tripping the line is undesirable and can cause cascading blackouts." },
        { q: "What happens when a generator goes Out-of-Step (OOS)?", opts: ["It generates reactive power only", "It loses synchronism with the power grid", "Its frequency drops to zero", "Its voltage turns negative"], ans: 1, explanation: "OOS means the generator's rotor angle drifts continuously relative to the grid, losing synchronism (pole slipping)." },
    ],
    medium: [
        { q: "The double blinder method detects power swings by measuring:", opts: ["The magnitude of line voltage", "The transit time between outer and inner impedance boundaries", "The phase angle of negative sequence current", "The grid frequency deviation"], ans: 1, explanation: "Since power swings are mechanical events, the apparent impedance moves slowly. A fault jumps instantly. The blinder method measures this transit time." },
        { q: "A transmission line fault causes the apparent impedance to jump in:", opts: ["Several seconds", "A few milliseconds (near-instantly)", "Hundreds of milliseconds", "Minutes"], ans: 1, explanation: "Faults are electromagnetic events that shift the voltage and current waveforms instantly (typically < 10ms)." },
        { q: "Where should Out-of-Step (OOS) tripping ideally be executed?", opts: ["At any random breaker on the line", "At pre-selected separation boundaries (islands)", "At the largest load center", "Directly at the substation transformer"], ans: 1, explanation: "Controlled separation boundaries are pre-planned to ensure each isolated island has a stable balance of generation and load." },
        { q: "In a two-machine system, the apparent impedance locus during a swing is a straight line when:", opts: ["The internal voltages of both machines are equal (E1 = E2)", "One machine acts as an infinite bus", "The line reactance is zero", "The power factor is exactly 1.0"], ans: 0, explanation: "If E1 = E2, the locus of apparent impedance during a swing is a straight line perpendicular to the total impedance, crossing exactly at the midpoint." },
        { q: "A typical PSB transit time threshold setting is:", opts: ["1-5 ms", "30-60 ms", "1-2 seconds", "10-20 seconds"], ans: 1, explanation: "Typical settings range from 30ms to 60ms, which is long enough to ride through CT transient errors but short enough to detect fast swings." },
    ],
    expert: [
        { q: "What does NERC PRC-026 require regarding distance relay settings?", opts: ["Relays must trip on all swings", "Relays must not trip during stable power swings", "Relays must ignore out-of-step conditions", "Relays must disable Zone 3 entirely"], ans: 1, explanation: "PRC-026 is a reliability standard ensuring protection relays do not trip prematurely during stable power system oscillations." },
        { q: "During out-of-step conditions, the rotor angle δ between machines:", opts: ["Oscillates within 30 degrees", "Exceeds 180 degrees and continues to slip poles", "Stabilizes at exactly 90 degrees", "Drops instantly to zero"], ans: 1, explanation: "OOS implies a continuous loss of synchronism where the rotor angle keeps increasing ($> 180^\circ$, $360^\circ$, $720^\circ$, etc.), representing a pole slip." },
        { q: "What is the 'Electrical Center' of a transmission network?", opts: ["The geographical center of the substation yard", "The point where voltage amplitude collapses to zero during a 180° swing", "The location of the primary slack bus", "The terminal of the largest synchronous condenser"], ans: 1, explanation: "The electrical center is the virtual point in the impedance network where the voltage magnitude reaches zero when the phase angle difference between the ends is exactly 180°." },
        { q: "Why is continuous rate-of-change of impedance (dZ/dt) detection preferred over simple blinders?", opts: ["It requires no memory storage", "It is immune to static load encroachment and handles fast swings better", "It is easier to calculate manually", "It eliminates the need for PTs"], ans: 1, explanation: "dZ/dt method continuously calculates the velocity of the impedance vector, offering better discrimination under varying grid conditions and high load scenarios." },
        { q: "What is the primary objective of controlled islanding during OOS?", opts: ["To force all grid generation offline", "To prevent a total system blackout by creating self-sustaining electrical islands", "To maximize line capacity usage", "To reduce reactive power support"], ans: 1, explanation: "Controlled islanding splits the collapsing grid into stable regions with balanced load/generation to prevent cascading system-wide blackouts." },
    ],
};

const TEACH_DB: Record<string, { title: string; desc: string; cause: string; effect: string; action: string; std: string }> = {
    IDLE: {
        title: "System in Steady State",
        desc: "The grid is operating under nominal load conditions. Apparent impedance is high and stable.",
        cause: "Balanced load flow. Mechanical input power matching electrical output power (Pm = Pe).",
        effect: "Rotor angle remains small (typically 15° - 35°). Measured impedance is far from protection zones.",
        action: "No relay action. Distance elements fully active.",
        std: "IEEE C37.104 Sec 4.1"
    },
    SWINGING: {
        title: "Power Swing Active",
        desc: "Generator rotor is oscillating relative to the grid. Apparent impedance is moving in the R-X plane.",
        cause: "A sudden grid disturbance (e.g., cleared short-circuit, line switching, or generator trip).",
        effect: "Rotor velocity oscillates around synchronous speed. Voltage and current levels fluctuate.",
        action: "Relay tracks impedance trajectory speed (dZ/dt).",
        std: "IEEE C37.104 Sec 5.2"
    },
    OUTER_ENTRY: {
        title: "Outer Blinder Crossed",
        desc: "The impedance locus has crossed the outer detection boundary. Swing detection timer starts.",
        cause: "Generator rotor oscillation has pushed the apparent Z close to the protection zones.",
        effect: "Transit timer starts accumulating elapsed time to determine velocity (dZ/dt).",
        action: "Prepare to block distance elements if inner blinder crossing is slow.",
        std: "IEEE C37.104 Sec 5.3.1"
    },
    PSB_ACTIVE: {
        title: "Power Swing Blocking Activated",
        desc: "Relay has blocked Zone 1 & 2 distance tripping. Slow blinder crossing indicates a stable mechanical swing.",
        cause: "Transit time exceeded the PSB Timer setting, confirming a slow power swing rather than a line fault.",
        effect: "Breaker trip output from distance elements is temporarily blocked, preventing a false blackout trip.",
        action: "Keep distance protection blocked. Raise alarm for grid dispatch.",
        std: "NERC PRC-026-1 R1"
    },
    OOS_TRIP: {
        title: "Out-of-Step Separation (ANSI 78)",
        desc: "Generator has slipped poles. Controlled separation executed to split the grid.",
        cause: "Severe transient instability (unstable swing). Kinetic energy is too high for the generator to recover.",
        effect: "Rotor angle exceeded 180° (out of phase). Electrical center voltage collapsed to zero.",
        action: "Breaker trips instantly to isolate the unstable generator and protect transmission assets.",
        std: "IEEE C37.104 Sec 6.2"
    },
    FAULT: {
        title: "Transmission Line Fault Detected",
        desc: "Relay has detected an instantaneous impedance jump inside the protection boundaries. Trip command sent.",
        cause: "Physical short-circuit on the line (e.g. lightning strike, tree contact).",
        effect: "Impedance transit time between blinders was near-zero, bypassing PSB logic.",
        action: "Trip breaker immediately (within 20ms) to clear the dangerous short-circuit.",
        std: "IEEE C37.113 / ANSI 21"
    },
    STABLE: {
        title: "Swing Damped — Grid Recovered",
        desc: "Oscillation successfully decayed. Generator has returned to steady-state synchronism.",
        cause: "Inherent generator damping, governor action, and excitation system voltage support.",
        effect: "Impedance locus returns to the normal high-impedance load region.",
        action: "Reset PSB block. Return distance relay to normal standby monitoring.",
        std: "IEEE C37.104 Sec 7.1"
    }
};

export default function PowerSwingSim() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState<'simulator' | 'theory' | 'guide' | 'quiz' | 'labs'>('simulator');

    // --- Simulator State ---
    const [running, setRunning] = useState(false);
    const [swingType, setSwingType] = useState<'stable' | 'oos' | 'fault'>('stable');
    const [blinderMode, setBlinderMode] = useState<'CIRCLE' | 'LINE'>('CIRCLE');
    
    // Configurable Settings
    const [inertiaH, setInertiaH] = useState(3.0);      // MWs/MVA
    const [dampingD, setDampingD] = useState(0.5);      // damping factor
    const [outerBoundary, setOuterBoundary] = useState(1.6); // pu (radius or blinder width)
    const [innerBoundary, setInnerBoundary] = useState(0.8); // pu
    const [psbTimer, setPsbTimer] = useState(40);        // ms
    const [z1Reach, setZ1Reach] = useState(0.6);        // Zone 1 Reach (pu)
    const [oosTripAngle, setOosTripAngle] = useState(120); // deg (angle threshold for controlled separation)
    const [oosEnabled, setOosEnabled] = useState(true);

    // Live variables
    const [delta, setDelta] = useState(30);
    const [zReal, setZReal] = useState(0);
    const [zImag, setZImag] = useState(2.2);
    const [simState, setSimState] = useState<'IDLE' | 'SWINGING' | 'OUTER_ENTRY' | 'PSB_ACTIVE' | 'OOS_TRIP' | 'FAULT' | 'STABLE'>('IDLE');
    const [events, setEvents] = useState<string[]>([]);
    const [trajectory, setTrajectory] = useState<{ r: number; x: number }[]>([]);
    const [transitTime, setTransitTime] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);

    // Lab / Mission State
    const [activeLab, setActiveLab] = useState<number | null>(null);
    const [labResult, setLabResult] = useState<'passed' | 'failed' | null>(null);

    // Quiz State
    const [quizLevel, setQuizLevel] = useState<'easy' | 'medium' | 'expert'>('easy');
    const [quizIdx, setQuizIdx] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
    const [quizFinished, setQuizFinished] = useState(false);

    const timerRef = useRef<any>(null);

    // --- Graded Labs Definitions ---
    const labs = useMemo(() => [
        {
            id: 0,
            name: "Lab 1: Low Inertia & Fast Power Swing",
            objective: "Calibrate PSB timer for a high-speed stable power swing caused by low generator inertia.",
            description: "With generator inertia H set to a low value (H = 1.5 MWs/MVA), a stable swing is fast. Run the stable swing with default settings (PSB Timer: 40ms). The swing travels between blinders in only ~28ms. Because transit time (28ms) < PSB Timer (40ms), the relay mistakes the swing for a fault and triggers a false distance trip! Adjust the PSB timer to 20ms to correctly block the swing.",
            setup: () => {
                setSwingType('stable');
                setInertiaH(1.5);
                setDampingD(0.8);
                setBlinderMode('CIRCLE');
                setOuterBoundary(1.6);
                setInnerBoundary(0.8);
                setPsbTimer(40);
                setZ1Reach(0.6);
                resetSim();
            },
            check: () => {
                return psbTimer <= 22 && simState === 'STABLE' && transitTime !== null && transitTime > psbTimer;
            },
            hint: "Change the 'PSB Timer' setting to 20ms and click 'Start Swing' to verify.",
            lesson: "Low grid inertia means faster acceleration/deceleration. This increases the speed (dZ/dt) of stable power swings, requiring a shorter PSB blinder transit timer to distinguish them from direct short-circuits."
        },
        {
            id: 1,
            name: "Lab 2: Double Blinder Calibration",
            objective: "Set up parallel double blinders to block a power swing on a heavily loaded line.",
            description: "A stable swing is simulated. Switch to 'Double Blinders' (vertical blinder lines). The default outer/inner reach settings are too narrow, causing the swing to jump across them too fast. Set Outer Blinder width to 2.0 pu and Inner Blinder to 0.7 pu with a PSB Timer of 30ms to ensure reliable blocking.",
            setup: () => {
                setSwingType('stable');
                setInertiaH(3.0);
                setDampingD(0.6);
                setBlinderMode('LINE');
                setOuterBoundary(1.3);
                setInnerBoundary(0.9);
                setPsbTimer(30);
                resetSim();
            },
            check: () => {
                return blinderMode === 'LINE' && outerBoundary >= 1.9 && innerBoundary <= 0.85 && simState === 'STABLE';
            },
            hint: "Select 'Double Blinders', set Outer Blinder to 2.0 pu, Inner Blinder to 0.7 pu, and run the swing.",
            lesson: "Vertical blinders isolate the load area on the R-axis. Correct blinder spacing ensures a wide enough transit detection zone to verify slower impedance travel while avoiding load encroachment."
        },
        {
            id: 2,
            name: "Lab 3: Controlled separation (Out-of-Step)",
            objective: "Initiate controlled system splitting exactly when the generator out-of-step angle exceeds 120°.",
            description: "An unstable power swing is underway. If separation is delayed, the generator slips poles repeatedly, risking damage to shaft couplings. Select 'Out-of-Step', enable OOS separation, and calibrate the trip angle to exactly 120° to separate before a full pole slip occurs.",
            setup: () => {
                setSwingType('oos');
                setInertiaH(3.5);
                setBlinderMode('CIRCLE');
                setOuterBoundary(1.6);
                setInnerBoundary(0.8);
                setOosEnabled(true);
                setOosTripAngle(170);
                resetSim();
            },
            check: () => {
                return swingType === 'oos' && oosTripAngle === 120 && simState === 'OOS_TRIP' && Math.abs(delta) <= 125;
            },
            hint: "Set OOS separation angle threshold to 120° and start the Out-of-Step swing.",
            lesson: "Controlled separation must occur before the system reaches 180° out-of-phase to minimize mechanical strain on generators and maintain voltage support in the separated islands."
        }
    ], [psbTimer, simState, transitTime, blinderMode, outerBoundary, innerBoundary, swingType, oosTripAngle, delta]);

    const startLab = (idx: number) => {
        setActiveLab(idx);
        labs[idx].setup();
        setLabResult(null);
    };

    const verifyLab = () => {
        if (activeLab !== null) {
            setLabResult(labs[activeLab].check() ? 'passed' : 'failed');
        }
    };

    // --- Dynamic math values ---
    const derivedValues = useMemo(() => {
        const magnitude = Math.sqrt(zReal ** 2 + zImag ** 2);
        const angle = Math.atan2(zImag, zReal) * (180 / Math.PI);
        // Estimate slip frequency
        const slipFreq = Math.abs(delta - 30) / (elapsed * 360 || 1);
        return { magnitude, angle, slipFreq };
    }, [zReal, zImag, delta, elapsed]);

    // --- Reset and Start Integration ---
    const resetSim = () => {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        setRunning(false);
        setDelta(30);
        setZReal(0);
        setZImag(2.2);
        setSimState('IDLE');
        setEvents([]);
        setTrajectory([]);
        setTransitTime(null);
        setElapsed(0);
    };

    const startSim = () => {
        resetSim();
        setRunning(true);
        setSimState('SWINGING');
        setEvents(['⚡ Grid Disturbance Initiated — Swing Equation activated.']);

        let t = 0;
        const w_s = 2 * Math.PI * 60; // 377 rad/s sync speed
        const Pm = 1.0;
        const Pe_max = 2.0;
        let currentDelta = 30; // degrees
        let omega = 0; // slip speed rad/s

        let outerEntered = false;
        let innerEntered = false;
        let outerTime = 0;

        let lastTime = performance.now();

        const loop = (currentTime: number) => {
            const dt = Math.min((currentTime - lastTime) / 1000, 0.03); // cap dt at 30ms for stability
            lastTime = currentTime;
            t += dt;

            // Apparent resistance & reactance calculation (Two-machine system representation)
            const dRad = (currentDelta * Math.PI) / 180;
            const Zl = 1.2; // line impedance pu
            const Zs = 0.4; // sending source impedance pu
            const cosd = Math.cos(dRad);
            const sind = Math.sin(dRad);
            const denom = 2 * (1 - cosd) + 0.01;

            let zr = (Zl * sind) / denom;
            let zx = Zs + (Zl * (1 - cosd)) / denom;

            // Limit calculation spikes near delta = 0
            if (denom < 0.05) {
                zr = 0;
                zx = Zs + Zl / 2;
            }

            // Swing dynamics
            const Pe = Pe_max * Math.sin(dRad);
            let P_acc = 0;

            if (swingType === 'fault') {
                // Instantly jump inside Zone 1 and stop (direct line short-circuit)
                zr = 0.15;
                zx = 0.35;
                setZReal(zr);
                setZImag(zx);
                setSimState('FAULT');
                setEvents(prev => ['🔴 DIRECT LINE FAULT DETECTED', '⚡ Apparent Z jumped instantly to fault location.', ...prev]);
                setRunning(false);
                cancelAnimationFrame(timerRef.current);
                return;
            } else if (swingType === 'oos') {
                // Mechanical power exceeds electrical transmission threshold -> rotor accelerates out of step
                P_acc = Pm * 2.1 - Pe - dampingD * 0.05 * omega;
            } else {
                // Stable power swing: temporary transmission fault, then clear
                if (t < 0.2) {
                    P_acc = Pm - Pe * 0.1; // electrical output collapsed during fault
                } else {
                    P_acc = Pm - Pe - dampingD * 0.65 * omega; // fault cleared, governor damping active
                }
            }

            const acceleration = (P_acc * w_s) / (2 * inertiaH);
            omega += acceleration * dt;
            currentDelta += (omega * dt) * (180 / Math.PI);

            setZReal(zr);
            setZImag(zx);
            setDelta(currentDelta);
            setElapsed(t);
            setTrajectory(prev => [...prev, { r: zr, x: zx }].slice(-150));

            // Boundaries check
            const zMag = Math.sqrt(zr * zr + zx * zx);
            let insideOuter = false;
            let insideInner = false;

            if (blinderMode === 'CIRCLE') {
                insideOuter = zMag <= outerBoundary;
                insideInner = zMag <= innerBoundary;
            } else {
                insideOuter = Math.abs(zr) <= outerBoundary;
                insideInner = Math.abs(zr) <= innerBoundary;
            }

            // Detect outer crossing
            if (!outerEntered && insideOuter) {
                outerEntered = true;
                outerTime = t;
                setSimState('OUTER_ENTRY');
                setEvents(prev => [`[${t.toFixed(3)}s] Locus entered OUTER boundary. Transit timer started.`, ...prev]);
            }

            // Detect inner crossing
            if (outerEntered && !innerEntered && insideInner) {
                innerEntered = true;
                const transit = (t - outerTime) * 1000; // milliseconds
                setTransitTime(transit);

                if (transit > psbTimer) {
                    // Slow crossing = Power Swing detected
                    setSimState('PSB_ACTIVE');
                    setEvents(prev => [
                        `🟡 PSB ACTIVE — Apparent Z transit time: ${transit.toFixed(1)}ms > ${psbTimer}ms. Distance elements BLOCKED.`,
                        `[${t.toFixed(3)}s] Locus entered INNER boundary.`,
                        ...prev
                    ]);
                } else {
                    // Fast crossing = Fault
                    setSimState('FAULT');
                    setEvents(prev => [
                        `🔴 TRIP — Apparent Z transit time: ${transit.toFixed(1)}ms <= ${psbTimer}ms. Fast transit indicates FAULT.`,
                        ...prev
                    ]);
                    setRunning(false);
                    cancelAnimationFrame(timerRef.current);
                    return;
                }
            }

            // Zone 1 backup check (trip if swing enters Zone 1 and PSB is NOT active)
            const insideZ1 = zMag <= z1Reach;
            if (insideZ1 && !innerEntered && simState !== 'PSB_ACTIVE') {
                setSimState('FAULT');
                setEvents(prev => [`🔴 ZONE 1 UNBLOCKED TRIP — Apparent Z entered Zone 1 without swing block.`, ...prev]);
                setRunning(false);
                cancelAnimationFrame(timerRef.current);
                return;
            }

            // Out of Step separation trip check
            if (swingType === 'oos' && oosEnabled && Math.abs(currentDelta) >= oosTripAngle) {
                setSimState('OOS_TRIP');
                setEvents(prev => [
                    `🔴 ANSI 78 OOS TRIP — Separation executed at δ = ${currentDelta.toFixed(1)}°.`,
                    `⚡ Power network split at controlled separation boundary to prevent system collapse.`,
                    ...prev
                ]);
                setRunning(false);
                cancelAnimationFrame(timerRef.current);
                return;
            }

            // Stable swing convergence check
            if (swingType === 'stable' && t > 1.5 && Math.abs(omega) < 0.2) {
                setSimState('STABLE');
                setEvents(prev => [`✅ Swing DAMPED — Generator returned to synchronism.`, ...prev]);
                setRunning(false);
                cancelAnimationFrame(timerRef.current);
                return;
            }

            // Safety timeout
            if (t > 8.0) {
                setRunning(false);
                setEvents(prev => [`⏸ Simulation timeout after 8 seconds.`, ...prev]);
                cancelAnimationFrame(timerRef.current);
                return;
            }

            if (running) {
                timerRef.current = requestAnimationFrame(loop);
            }
        };

        timerRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
    }, []);

    // --- Computed Diagnostics ---
    const diagnostics = useMemo(() => {
        return TEACH_DB[simState] || TEACH_DB.IDLE;
    }, [simState]);

    // --- Quiz Handlers ---
    const handleQuizAnswer = (idx: number) => {
        if (quizAnswered !== null) return;
        setQuizAnswered(idx);
        const correct = idx === QUIZ_DATA[quizLevel][quizIdx].ans;
        if (correct) setQuizScore(p => p + 1);
    };

    const nextQuizQuestion = () => {
        setQuizAnswered(null);
        if (quizIdx + 1 < QUIZ_DATA[quizLevel].length) {
            setQuizIdx(p => p + 1);
        } else {
            setQuizFinished(true);
        }
    };

    const resetQuiz = () => {
        setQuizIdx(0);
        setQuizScore(0);
        setQuizAnswered(null);
        setQuizFinished(false);
    };

    // --- SVG coordinate mapping helper ---
    const SCALE = 70; // 70px per pu
    const CENTER = 200;

    const toSvgR = (r: number) => CENTER + r * SCALE;
    const toSvgX = (x: number) => CENTER - x * SCALE;

    const tripColor = simState === 'OOS_TRIP' || simState === 'FAULT' ? '#ef4444' : simState === 'PSB_ACTIVE' ? '#f59e0b' : '#10b981';

    return (
        <div className={`min-h-screen h-screen font-sans flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#060a17] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <SEO 
                title="SwingGuard | Power Swing & Out-of-Step ANSI 78 Simulator" 
                description="Interactive generator out-of-step and power swing blocking simulation with R-X trajectory plotting, dynamic swing equation physics, and graded labs."
                url="/power-swing" 
            />

            {/* ════ HEADER ════ */}
            <header className={`shrink-0 flex items-center justify-between px-3 py-2 border-b ${isDark ? 'bg-[#0a0f1f] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-md shadow-violet-900/30">
                        <Radar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-widest text-violet-400">SwingGuard Hub</h1>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider hidden sm:block">ANSI 78 · NERC PRC-026 · Power Swing Protection</p>
                    </div>
                </div>

                {/* Navigation tabs */}
                <nav className="flex items-center gap-1">
                    {[
                        { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-3.5 h-3.5" /> },
                        { id: 'labs', label: 'Labs', icon: <TrophyIcon className="w-3.5 h-3.5" /> },
                        { id: 'theory', label: 'Theory Reference', icon: <Book className="w-3.5 h-3.5" /> },
                        { id: 'quiz', label: 'Quiz', icon: <GraduationCap className="w-3.5 h-3.5" /> }
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === t.id ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${simState === 'OOS_TRIP' || simState === 'FAULT' ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse' : simState === 'PSB_ACTIVE' ? 'bg-amber-500/10 border-amber-600 text-amber-400' : 'bg-emerald-500/10 border-emerald-700 text-emerald-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${simState === 'OOS_TRIP' || simState === 'FAULT' ? 'bg-red-400' : simState === 'PSB_ACTIVE' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        {simState}
                    </div>
                    <button onClick={resetSim}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </header>

            {/* ════ MAIN WORKSPACE ════ */}
            <div className="flex-1 overflow-hidden flex flex-col">

                {/* === SIMULATOR TAB === */}
                {activeTab === 'simulator' && (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        
                        {/* ── LEFT: Graphs & Gauges ── */}
                        <div className={`flex flex-col flex-1 overflow-y-auto border-r ${isDark ? 'border-slate-800 bg-[#080c1a]' : 'border-slate-200 bg-slate-100'} p-3 space-y-3`}>
                            
                            {/* R-X Plot and Rotor Gauge Container */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                                
                                {/* R-X Impedance Plane SVG (7 cols) */}
                                <div className={`lg:col-span-8 rounded-2xl border ${isDark ? 'bg-[#030712] border-slate-800' : 'bg-white border-slate-200'} p-3 flex flex-col overflow-hidden`}>
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Radar className="w-3.5 h-3.5 text-violet-500 animate-pulse" /> Apparent R-X Impedance
                                        </span>
                                        <span className="text-[10px] font-mono font-bold text-violet-400">
                                            Z = {zReal.toFixed(3)} + j{zImag.toFixed(3)} pu · |Z| = {derivedValues.magnitude.toFixed(2)} pu
                                        </span>
                                    </div>

                                    {/* SVG Graphic */}
                                    <div className="relative aspect-square max-h-[350px] mx-auto w-full">
                                        <svg viewBox="0 0 400 400" className="w-full h-full">
                                            <defs>
                                                <pattern id="subgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke={isDark ? '#0f172a' : '#f1f5f9'} strokeWidth="0.5" />
                                                </pattern>
                                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                    <rect width="40" height="40" fill="url(#subgrid)" />
                                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" />
                                                </pattern>
                                            </defs>

                                            {/* Grid background */}
                                            <rect width="100%" height="100%" fill="url(#grid)" />

                                            {/* Axes */}
                                            <line x1="0" y1={CENTER} x2="400" y2={CENTER} stroke={isDark ? '#334155' : '#94a3b8'} strokeWidth="1.5" />
                                            <line x1={CENTER} y1="0" x2={CENTER} y2="400" stroke={isDark ? '#334155' : '#94a3b8'} strokeWidth="1.5" />

                                            {/* Axis ticks and labels */}
                                            {[-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2].map(val => (
                                                <g key={val}>
                                                    <text x={toSvgR(val)} y={CENTER + 15} fill="#475569" fontSize="8" textAnchor="middle" fontFamily="monospace">{val}pu</text>
                                                    <text x={CENTER - 8} y={toSvgX(val) + 3} fill="#475569" fontSize="8" textAnchor="end" fontFamily="monospace">{val}pu</text>
                                                    <line x1={toSvgR(val)} y1={CENTER - 3} x2={toSvgR(val)} y2={CENTER + 3} stroke="#475569" strokeWidth="1" />
                                                    <line x1={CENTER - 3} y1={toSvgX(val)} x2={CENTER + 3} y2={toSvgX(val)} stroke="#475569" strokeWidth="1" />
                                                </g>
                                            ))}

                                            <text x="390" y={CENTER - 8} fill="#64748b" fontSize="8" textAnchor="end" fontWeight="bold">R (pu)</text>
                                            <text x={CENTER + 8} y="15" fill="#64748b" fontSize="8" textAnchor="start" fontWeight="bold">jX (pu)</text>

                                            {/* Distance Zone 1 Reference Boundary (Mho) */}
                                            <circle cx={CENTER} cy={CENTER - (z1Reach / 2) * SCALE} r={(z1Reach / 2) * SCALE} fill="#ef4444" fillOpacity="0.06" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                                            <text x={CENTER} y={CENTER - z1Reach * SCALE - 5} fill="#ef4444" fontSize="8" textAnchor="middle" fontWeight="bold">Distance Z1 ({z1Reach}pu)</text>

                                            {/* Outer Boundary Characteristic */}
                                            {blinderMode === 'CIRCLE' ? (
                                                <circle cx={CENTER} cy={CENTER} r={outerBoundary * SCALE} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="4,4" />
                                            ) : (
                                                <g>
                                                    <line x1={toSvgR(-outerBoundary)} y1="0" x2={toSvgR(-outerBoundary)} y2="400" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,4" />
                                                    <line x1={toSvgR(outerBoundary)} y1="0" x2={toSvgR(outerBoundary)} y2="400" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,4" />
                                                </g>
                                            )}

                                            {/* Inner Boundary Characteristic */}
                                            {blinderMode === 'CIRCLE' ? (
                                                <circle cx={CENTER} cy={CENTER} r={innerBoundary * SCALE} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4,4" />
                                            ) : (
                                                <g>
                                                    <line x1={toSvgR(-innerBoundary)} y1="0" x2={toSvgR(-innerBoundary)} y2="400" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
                                                    <line x1={toSvgR(innerBoundary)} y1="0" x2={toSvgR(innerBoundary)} y2="400" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
                                                </g>
                                            )}

                                            {/* Electrical Center Line representation */}
                                            <line x1={toSvgR(-0.5)} y1={toSvgX(1.6)} x2={toSvgR(0.5)} y2={toSvgX(0.4)} stroke="#eab308" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                                            <text x={toSvgR(0.6)} y={toSvgX(0.6)} fill="#eab308" fontSize="7" fontStyle="italic">Electrical Center</text>

                                            {/* Trajectory */}
                                            {trajectory.length > 1 && (
                                                <path
                                                    d={`M ${trajectory.map(p => `${toSvgR(p.r)},${toSvgX(p.x)}`).join(' L ')}`}
                                                    fill="none" stroke="#a78bfa" strokeWidth="2.5" opacity="0.75"
                                                />
                                            )}

                                            {/* Current point */}
                                            <circle cx={toSvgR(zReal)} cy={toSvgX(zImag)} r="6.5" fill={tripColor} className={running ? 'animate-pulse' : ''} />
                                            <circle cx={toSvgR(zReal)} cy={toSvgX(zImag)} r="3" fill="#ffffff" />

                                            {/* Labels for blinders */}
                                            <text x={toSvgR(outerBoundary) + 5} y="45" fill="#3b82f6" fontSize="8" fontWeight="bold">Outer Blinder ({outerBoundary}pu)</text>
                                            <text x={toSvgR(innerBoundary) + 5} y="60" fill="#ef4444" fontSize="8" fontWeight="bold">Inner Blinder ({innerBoundary}pu)</text>
                                        </svg>
                                    </div>
                                </div>

                                {/* Generator Rotor Angle Gauge (4 cols) */}
                                <div className={`lg:col-span-4 rounded-2xl border ${isDark ? 'bg-[#030712] border-slate-800' : 'bg-white border-slate-200'} p-3 flex flex-col overflow-hidden`}>
                                    <div className="pb-2 border-b border-slate-800 mb-2 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Activity className="w-3.5 h-3.5 text-indigo-400" /> Rotor Angular Dial
                                        </span>
                                        <span className={`text-[10px] font-mono font-bold ${Math.abs(delta) > 120 ? 'text-red-400' : 'text-indigo-400'}`}>
                                            δ = {delta.toFixed(1)}°
                                        </span>
                                    </div>

                                    {/* SVG Dial Gauge */}
                                    <div className="relative aspect-square max-h-[220px] mx-auto w-full flex items-center justify-center mt-3">
                                        <svg viewBox="0 0 160 160" className="w-full h-full max-w-[170px]">
                                            <circle cx="80" cy="80" r="70" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" strokeDasharray="3,3" />
                                            <circle cx="80" cy="80" r="62" fill="none" stroke={isDark ? '#0f172a' : '#f8fafc'} strokeWidth="8" />

                                            {/* Safety boundaries overlay */}
                                            {/* Normal/Safe zone arc < 90 */}
                                            <path d="M 80 18 A 62 62 0 0 1 142 80" fill="none" stroke="#10b981" strokeWidth="5" opacity="0.4" />
                                            {/* Alert zone arc 90 - 120 */}
                                            <path d="M 142 80 A 62 62 0 0 1 133.6 111" fill="none" stroke="#f59e0b" strokeWidth="5" opacity="0.4" />
                                            {/* Unstable zone arc > 120 */}
                                            <path d="M 133.6 111 A 62 62 0 0 1 18 80" fill="none" stroke="#ef4444" strokeWidth="5" opacity="0.4" />

                                            {/* Tick Marks */}
                                            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
                                                const rad = (deg - 90) * Math.PI / 180;
                                                const x1 = 80 + 55 * Math.cos(rad);
                                                const y1 = 80 + 55 * Math.sin(rad);
                                                const x2 = 80 + 62 * Math.cos(rad);
                                                const y2 = 80 + 62 * Math.sin(rad);
                                                return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1" />
                                            })}

                                            {/* Reference grid vector (Sending end voltage E_S) */}
                                            <line x1="80" y1="80" x2="80" y2="25" stroke="#3b82f6" strokeWidth="2.5" />
                                            <polygon points="80,18 76,28 84,28" fill="#3b82f6" />
                                            <text x="80" y="14" fill="#3b82f6" fontSize="7" fontWeight="bold" textAnchor="middle">GRID (Es)</text>

                                            {/* Rotating rotor vector (Receiving end voltage E_R) */}
                                            {(() => {
                                                const rad = (delta - 90) * Math.PI / 180;
                                                const rx = 80 + 58 * Math.cos(rad);
                                                const ry = 80 + 58 * Math.sin(rad);
                                                const arrowTipX = 80 + 65 * Math.cos(rad);
                                                const arrowTipY = 80 + 65 * Math.sin(rad);
                                                return (
                                                    <g>
                                                        <line x1="80" y1="80" x2={rx} y2={ry} stroke="#a78bfa" strokeWidth="3" />
                                                        <circle cx={rx} cy={ry} r="3" fill="#a78bfa" />
                                                        <text x={arrowTipX * 1.05} y={arrowTipY * 1.05} fill="#a78bfa" fontSize="8" fontWeight="bold" textAnchor="middle">
                                                            GEN (Er)
                                                        </text>
                                                    </g>
                                                );
                                            })()}

                                            {/* Core center pivot */}
                                            <circle cx="80" cy="80" r="5" fill={isDark ? '#1e293b' : '#94a3b8'} />
                                            <circle cx="80" cy="80" r="2" fill="#ffffff" />
                                        </svg>
                                    </div>
                                    
                                    {/* Rotor status badge */}
                                    <div className={`mt-3 p-2.5 rounded-xl border text-center ${Math.abs(delta) > 120 ? 'bg-red-500/10 border-red-500 text-red-400' : Math.abs(delta) > 90 ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-emerald-500/10 border-emerald-700 text-emerald-400'}`}>
                                        <p className="text-[8px] font-black uppercase tracking-wider opacity-60">Transient Rotor State</p>
                                        <p className="text-[10px] font-black uppercase mt-0.5">
                                            {Math.abs(delta) > 180 ? '⚡ POLE SLIP IN PROGRESS' : Math.abs(delta) > 120 ? '⚠️ SEVERE SWING / INSTABILITY' : Math.abs(delta) > 90 ? '⚠️ TRANSIENT DEVIATION' : '✅ STABLE / SYNCHRONIZED'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Live measurement status bar */}
                            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 border-t pt-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                {[
                                    { label: 'Slip Velocity (dδ/dt)', val: `${derivedValues.slipFreq.toFixed(3)} Hz`, color: derivedValues.slipFreq > 0.4 ? '#ef4444' : '#10b981' },
                                    { label: 'Transit Time', val: transitTime ? `${transitTime.toFixed(1)} ms` : 'N/A', color: transitTime && transitTime < psbTimer ? '#ef4444' : '#f59e0b' },
                                    { label: 'Grid State', val: simState, color: tripColor },
                                    { label: 'Simulation Timer', val: `${elapsed.toFixed(3)} s`, color: '#64748b' }
                                ].map(m => (
                                    <div key={m.label} className={`flex flex-col p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-[#0a0f1f]' : 'border-slate-200 bg-white'}`}>
                                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">{m.label}</span>
                                        <span className="text-xs font-black font-mono mt-0.5" style={{ color: m.color }}>{m.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── RIGHT: Control Panel & Live Teaching Diagnostics ── */}
                        <div className={`flex flex-col md:w-[380px] xl:w-[420px] shrink-0 overflow-y-auto ${isDark ? 'bg-[#0a0f1f]' : 'bg-white'} border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            
                            {/* Simulator controls */}
                            <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-4`}>
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Configuration Panel</p>
                                    <span className="text-[8px] bg-violet-600/20 text-violet-400 font-bold px-2 py-0.5 rounded-lg border border-violet-800">ANSI 78 / 21</span>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Disturbance Swing Action</label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {(['stable', 'oos', 'fault'] as const).map(type => (
                                                <button key={type} onClick={() => setSwingType(type)} disabled={running}
                                                    className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${swingType === type ? 'bg-violet-600 border-violet-500 text-white shadow' : `text-slate-500 border-slate-700 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}`}>
                                                    {type === 'stable' ? 'Stable Swing' : type === 'oos' ? 'Out-of-Step' : 'Direct Fault'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Blinder Characteristic Style</label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {(['CIRCLE', 'LINE'] as const).map(mode => (
                                                <button key={mode} onClick={() => setBlinderMode(mode)} disabled={running}
                                                    className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${blinderMode === mode ? 'bg-indigo-600 border-indigo-500 text-white shadow' : `text-slate-500 border-slate-700 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}`}>
                                                    {mode === 'CIRCLE' ? 'Concentric Circles' : 'Double Blinders'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 pt-1.5 border-t border-slate-800">
                                        <Slider label="Generator Rotor Inertia (H)" unit=" MWs" min={1.0} max={10.0} step={0.5} value={inertiaH} onChange={e => setInertiaH(parseFloat(e.target.value))} color="purple" disabled={running} />
                                        <Slider label="Transmission Damping Factor (D)" unit="" min={0.1} max={2.0} step={0.1} value={dampingD} onChange={e => setDampingD(parseFloat(e.target.value))} color="purple" disabled={running} />
                                        <Slider label="Outer Boundary Reach" unit=" pu" min={1.2} max={2.5} step={0.1} value={outerBoundary} onChange={e => setOuterBoundary(parseFloat(e.target.value))} color="blue" disabled={running} />
                                        <Slider label="Inner Boundary Reach" unit=" pu" min={0.5} max={1.1} step={0.05} value={innerBoundary} onChange={e => setInnerBoundary(parseFloat(e.target.value))} color="red" disabled={running} />
                                        <Slider label="PSB Transit Timer Threshold" unit=" ms" min={10} max={100} step={5} value={psbTimer} onChange={e => setPsbTimer(parseInt(e.target.value))} color="amber" disabled={running} />
                                        
                                        {swingType === 'oos' && (
                                            <div className="p-3 bg-red-950/20 border border-red-800 rounded-xl space-y-2 mt-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-red-400 uppercase">Controlled Islanding settings</span>
                                                    <button onClick={() => setOosEnabled(prev => !prev)} className={`px-2 py-0.5 rounded text-[8px] font-bold ${oosEnabled ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                        {oosEnabled ? 'ENABLED' : 'DISABLED'}
                                                    </button>
                                                </div>
                                                <Slider label="Controlled separation Angle" unit="°" min={90} max={160} step={5} value={oosTripAngle} onChange={e => setOosTripAngle(parseInt(e.target.value))} color="red" disabled={running || !oosEnabled} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <button onClick={startSim} disabled={running}
                                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${running ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-900/30'}`}>
                                        <Play className="w-3.5 h-3.5" /> Start Simulation
                                    </button>
                                    <button onClick={resetSim}
                                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300'}`}>
                                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                                    </button>
                                </div>
                            </div>

                            {/* DYNAMIC TEACHING ENGINE */}
                            <div className="p-4 space-y-3.5">
                                <div className={`rounded-2xl border ${simState === 'OOS_TRIP' || simState === 'FAULT' ? 'border-red-800 bg-red-950/20' : simState === 'PSB_ACTIVE' ? 'border-amber-800 bg-amber-950/20' : isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'} overflow-hidden`}>
                                    
                                    {/* Header block status */}
                                    <div className={`px-3 py-2 flex items-center gap-2 border-b ${simState === 'OOS_TRIP' || simState === 'FAULT' ? 'border-red-950 bg-red-950/30' : simState === 'PSB_ACTIVE' ? 'border-amber-950 bg-amber-950/30' : isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">SwingGuard Diagnostics</span>
                                    </div>

                                    {/* Diagnostic Details */}
                                    <div className="p-3 space-y-3">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">What's Happening</p>
                                            <p className="text-xs mt-0.5 leading-relaxed font-semibold">{diagnostics.desc}</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-800">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">The Cause</p>
                                                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{diagnostics.cause}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">The Effect</p>
                                                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{diagnostics.effect}</p>
                                            </div>
                                        </div>

                                        <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'} space-y-1.5`}>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Physics Math: Swing Equation</p>
                                            <LaTeX math="\frac{2H}{\omega_s} \frac{d^2\delta}{dt^2} = P_m - P_e - D\omega" block />
                                            {transitTime && (
                                                <div className="pt-1.5 border-t border-slate-900 text-[10px] font-mono flex items-center justify-between text-indigo-400">
                                                    <span>Transit Time:</span>
                                                    <span>{transitTime.toFixed(1)}ms {transitTime > psbTimer ? '>' : '<='} {psbTimer}ms Threshold</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'}`}>
                                            <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Relay Command</p>
                                                <p className="text-[10px] font-bold text-slate-300">{diagnostics.action}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-mono">
                                            <Flag className="w-3 h-3" />
                                            <span>Reference Standard: {diagnostics.std}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic event logging stream */}
                                <div className={`rounded-2xl border ${isDark ? 'border-slate-800 bg-[#030712]' : 'border-slate-200 bg-white'} p-3`}>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2 block">IED Live Event Stream</span>
                                    <div className="space-y-1 h-[90px] overflow-y-auto font-mono text-[9.5px]">
                                        {events.length === 0 && <p className="text-slate-600 italic">Standby... Start simulation to stream records.</p>}
                                        {events.map((e, idx) => (
                                            <div key={idx} className={`p-1.5 rounded ${e.includes('TRIP') || e.includes('FAULT') ? 'bg-red-950/20 text-red-400 border border-red-900/30' : e.includes('PSB') ? 'bg-amber-950/20 text-amber-400 border border-amber-900/30' : 'bg-slate-900/40 text-slate-300'}`}>
                                                {e}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* === LABS TAB === */}
                {activeTab === 'labs' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="max-w-3xl mx-auto space-y-4">
                            <div className={`p-5 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                                <h2 className="text-base font-black uppercase text-violet-400 mb-1 flex items-center gap-2">
                                    <TrophyIcon className="w-5 h-5 text-violet-400" /> Graded Swing Protection Labs
                                </h2>
                                <p className="text-xs text-slate-500">Complete these structured laboratory scenarios to master the configuration and dynamics of ANSI 78 and PSB relays.</p>
                            </div>

                            {labs.map((lab, idx) => (
                                <div key={lab.id} className={`rounded-2xl border overflow-hidden transition-all ${activeLab === idx ? (isDark ? 'border-violet-700 bg-violet-950/10' : 'border-violet-300 bg-violet-50/50') : (isDark ? 'border-slate-800' : 'border-slate-200')}`}>
                                    <button onClick={() => startLab(idx)} className="w-full text-left p-4 flex items-center justify-between">
                                        <div>
                                            <span className="text-[8px] font-mono text-slate-500 block">SCENARIO {idx + 1}</span>
                                            <h4 className="text-xs font-black uppercase">{lab.name}</h4>
                                            <p className="text-[10px] text-violet-400 mt-0.5">{lab.objective}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded ${activeLab === idx ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                            {activeLab === idx ? 'ACTIVE' : 'SELECT'}
                                        </span>
                                    </button>

                                    {activeLab === idx && (
                                        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} space-y-3`}>
                                            <p className="text-xs leading-relaxed text-slate-400">{lab.description}</p>
                                            
                                            <div className="flex items-center gap-3">
                                                <button onClick={verifyLab} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Validate Calibration
                                                </button>
                                            </div>

                                            {labResult && (
                                                <div className={`p-3 rounded-xl border ${labResult === 'passed' ? 'bg-emerald-950/30 border-emerald-700 text-emerald-400' : 'bg-red-950/30 border-red-700 text-red-400'} space-y-1`}>
                                                    <p className="text-[10px] font-black uppercase tracking-wider">
                                                        {labResult === 'passed' ? '🎉 VERIFICATION PASSED' : '❌ VERIFICATION FAILED'}
                                                    </p>
                                                    <p className="text-[9.5px] leading-relaxed text-slate-300">
                                                        {labResult === 'passed' ? lab.lesson : `Hint: ${lab.hint}`}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === THEORY REFERENCE TAB === */}
                {activeTab === 'theory' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="max-w-4xl mx-auto">
                            <TheoryLibrary title="Power Swing & Out-of-Step Handbook" description="Comprehensive manual on transient stability, power swing blocking, and controlled separation." sections={POWER_SWING_THEORY_CONTENT} />
                        </div>
                    </div>
                )}

                {/* === KNOWLEDGE QUIZ TAB === */}
                {activeTab === 'quiz' && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="max-w-2xl mx-auto space-y-4">
                            {!quizFinished ? (
                                <div className="space-y-4">
                                    <div className={`p-5 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                                        <h2 className="text-base font-black uppercase text-violet-400">Power Swing Protection Quiz</h2>
                                        <p className="text-xs text-slate-500 mb-4">Validate your protection knowledge across easy, medium, and expert grading structures.</p>
                                        
                                        <div className="flex rounded-xl border overflow-hidden border-slate-700">
                                            {(['easy', 'medium', 'expert'] as const).map(l => (
                                                <button key={l} onClick={() => { setQuizLevel(l); resetQuiz(); }}
                                                    className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${quizLevel === l ? 'bg-violet-600 text-white' : 'text-slate-500'}`}>
                                                    {l === 'easy' ? '🟢 Easy' : l === 'medium' ? '🟡 Medium' : '🔴 Expert'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question Box */}
                                    {QUIZ_DATA[quizLevel][quizIdx] && (
                                        <div className={`p-5 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white'} space-y-4`}>
                                            <div className="flex justify-between text-[9px] text-slate-500">
                                                <span>QUESTION {quizIdx + 1} OF 5</span>
                                                <span>GRADE: {quizLevel.toUpperCase()}</span>
                                            </div>
                                            <h3 className="text-xs font-black uppercase leading-relaxed">
                                                {QUIZ_DATA[quizLevel][quizIdx].q}
                                            </h3>

                                            <div className="space-y-2">
                                                {QUIZ_DATA[quizLevel][quizIdx].opts.map((opt, i) => {
                                                    const isAnswered = quizAnswered !== null;
                                                    const isCorrect = i === QUIZ_DATA[quizLevel][quizIdx].ans;
                                                    const isChosen = i === quizAnswered;

                                                    let btnStyle = isDark ? 'border-slate-850 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300';
                                                    if (isAnswered) {
                                                        if (isCorrect) btnStyle = 'border-emerald-600 bg-emerald-950/20 text-emerald-400';
                                                        else if (isChosen) btnStyle = 'border-red-600 bg-red-950/20 text-red-400';
                                                        else btnStyle = 'opacity-40 border-slate-800';
                                                    }

                                                    return (
                                                        <button key={i} onClick={() => handleQuizAnswer(i)} disabled={isAnswered}
                                                            className={`w-full text-left p-3 rounded-xl border text-[11px] font-bold transition-all ${btnStyle}`}>
                                                            <span className="font-mono text-slate-500 mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {quizAnswered !== null && (
                                                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                                                    <p className={`text-[10px] font-black uppercase tracking-wider ${quizAnswered === QUIZ_DATA[quizLevel][quizIdx].ans ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {quizAnswered === QUIZ_DATA[quizLevel][quizIdx].ans ? '🎉 Correct Answer!' : '❌ Incorrect'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                                        {QUIZ_DATA[quizLevel][quizIdx].explanation}
                                                    </p>
                                                    <button onClick={nextQuizQuestion} className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-black uppercase rounded-xl transition-all">
                                                        {quizIdx < 4 ? 'Next Question' : 'Finish Quiz'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`p-6 rounded-2xl border text-center space-y-4 ${isDark ? 'border-slate-800 bg-[#030712]' : 'border-slate-200 bg-white'}`}>
                                    <TrophyIcon className="w-12 h-12 text-yellow-500 mx-auto" />
                                    <h3 className="text-xl font-black">Score: {quizScore} / 5</h3>
                                    <p className="text-slate-400 text-xs">
                                        {quizScore === 5 ? 'Excellent! You have mastered power swing dynamics.' : quizScore >= 3 ? 'Good job, review the theory reference to target missing topics.' : 'Study the Power Swing Handbook and try again.'}
                                    </p>
                                    <button onClick={resetQuiz} className="px-5 py-2 bg-violet-600 text-white text-[10px] font-black uppercase rounded-xl">
                                        Restart Quiz
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
