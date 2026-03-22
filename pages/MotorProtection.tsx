import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    RotateCcw, HelpCircle, Book, AlertTriangle, Settings,
    MonitorPlay, GraduationCap, Award, Zap, Activity,
    Timer, TrendingUp, Play, ShieldCheck, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { useSmoothedValues } from '../hooks/useSmoothedValues';
import TheoryLibrary from '../components/TheoryLibrary';
import { MOTOR_PROTECTION_THEORY_CONTENT } from '../data/learning-modules/motor-protection';
import SEO from "../components/SEO";

const QUIZ_DATA = {
    easy: [
        { q: "ANSI 49 designates:", opts: ["Overcurrent", "Thermal overload", "Ground fault", "Differential"], ans: 1, why: "49 = Machine thermal protection. It uses a mathematical thermal replica model to track estimated winding temperature based on measured current." },
        { q: "A locked rotor typically draws:", opts: ["0.5× FLA", "1× FLA", "5-8× FLA", "20× FLA"], ans: 2, why: "A locked rotor draws starting current (5-8× FLA) continuously without the cooling benefit of rotation, causing rapid thermal damage." },
        { q: "ANSI 66 protects against:", opts: ["Overcurrent", "Excessive motor starts", "Undervoltage", "Ground fault"], ans: 1, why: "66 = Starts per hour. Each start subjects the rotor to high thermal stress. Too many starts without cooling causes cumulative rotor heating." },
        { q: "Motor service factor 1.15 means:", opts: ["15% oversize", "Can run at 115% rated continuously", "15% thermal margin", "1.15 Hz"], ans: 1, why: "SF 1.15 means the motor can operate at 115% of rated load continuously without exceeding thermal limits, per NEMA MG-1." },
        { q: "The thermal time constant τ of a large motor is typically:", opts: ["1 second", "5-30 minutes", "1 hour", "1 day"], ans: 1, why: "τ depends on motor mass and cooling. Large motors have τ of 5-30 minutes. The thermal replica uses this to calculate temperature rise." },
    ],
    medium: [
        { q: "The thermal replica equation uses:", opts: ["V²/R", "I²t model based on FLA ratio", "Power factor", "Frequency"], ans: 1, why: "θ(t) = θ_amb + (θ_max - θ_amb) × (1 - e^(-t/τ)) × (I/I_FLA)². The I² relationship models resistive heating." },
        { q: "Cold safe stall time vs hot safe stall time:", opts: ["Equal", "Cold > Hot (more thermal margin)", "Hot > Cold", "Not comparable"], ans: 1, why: "A cold motor has more thermal margin. Hot safe stall time is typically 50-60% of cold safe stall time because the winding is already at operating temperature." },
        { q: "Incomplete sequence protection (48) detects:", opts: ["CT errors", "Motor failing to accelerate within allowed time", "Cable faults", "VT errors"], ans: 1, why: "48 detects when the motor doesn't reach running speed within the starting time limit, indicating a mechanical or electrical problem." },
        { q: "Phase unbalance causes motor damage because:", opts: ["Lower output", "Negative sequence creates counter-rotating field with 2× freq rotor currents", "Higher voltage", "CT saturation"], ans: 1, why: "Unbalanced supply creates negative-sequence fields that induce 2× frequency currents in the rotor, causing rapid localized heating." },
        { q: "RTD (resistance temp detector) protection is:", opts: ["Indirect measurement", "Direct measurement of winding temperature", "Only for generators", "Voltage based"], ans: 1, why: "RTDs embedded in the stator winding provide direct temperature measurement, supplementing the thermal replica model for critical motors." },
    ],
    expert: [
        { q: "Per IEEE C37.96, the locked rotor protection (14) timer must be set:", opts: ["Equal to safe stall time", "Below safe stall time with margin", "Above safe stall time", "To infinity"], ans: 1, why: "The relay must trip BEFORE the motor reaches its thermal limit. The trip time must be set below the safe stall time with adequate margin." },
        { q: "Slip-dependent overcurrent element advantage:", opts: ["Simpler math", "Tracks motor speed curve for optimized protection during start", "No CTs needed", "Voltage based"], ans: 1, why: "Slip-dependent OC follows the motor starting current curve precisely, allowing longer starts without nuisance tripping while still protecting against stall." },
        { q: "Motor differential (87M) is applied when:", opts: ["Always", "Motor > 1500 HP with 6 leads accessible", "Only for LV motors", "For variable speed drives"], ans: 1, why: "87M requires access to both ends of each winding (6 leads). It's typically applied to motors >1500 HP where individual CT sets can be installed." },
        { q: "The equivalent time on cooldown for thermal replica is:", opts: ["Same as heating", "Longer, because τ_cooling > τ_heating (no I²R)", "Shorter", "Zero"], ans: 1, why: "Motor cooling is slower than heating because heat is only dissipated by convection/conduction, not added by I²R. The cooling τ is 2-3× the heating τ." },
        { q: "Reacceleration protection during bus transfer must consider:", opts: ["Only voltage", "Motor contribution to bus fault current during reacceleration", "Frequency only", "Cable length"], ans: 1, why: "During reacceleration, the motor draws starting-level current. If multiple motors start simultaneously, the combined inrush may exceed the bus capacity." },
    ],
};

// ============================== THERMAL CANVAS ==============================
const ThermalCanvas = ({
    isDark, thermalPct, currentMult, speed, elapsed, tripped
}: {
    isDark: boolean; thermalPct: number; currentMult: number; speed: number; elapsed: number; tripped: boolean
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothed = useSmoothedValues({ thermalPct, currentMult, speed });

    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        // High DPI Display support
        const dpr = window.devicePixelRatio || 1;
        const rect = cvs.getBoundingClientRect();
        cvs.width = rect.width * dpr;
        cvs.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const cw = rect.width;
        const ch = rect.height;

        // Background
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, cw, ch);

        // Subtle monitoring grid
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < cw; i += 20) { ctx.moveTo(i, 0); ctx.lineTo(i, ch); }
        for (let i = 0; i < ch; i += 20) { ctx.moveTo(0, i); ctx.lineTo(cw, i); }
        ctx.stroke();

        // Thermal bar (vertical)
        const barX = 35, barW = 45, barH = ch - 60, barY = 30;
        ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.fillRect(barX, barY, barW, barH);

        // Border for the bar
        ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        // Fill Logic (Clamped to bar height)
        const clampedPct = Math.min(100, Math.max(0, smoothed.thermalPct));
        const fillH = barH * (clampedPct / 100);

        if (fillH > 0) {
            const gradient = ctx.createLinearGradient(0, barY + barH - fillH, 0, barY + barH);
            gradient.addColorStop(0, smoothed.thermalPct > 100 ? '#ef4444' : smoothed.thermalPct > 80 ? '#f59e0b' : '#22c55e');
            gradient.addColorStop(1, smoothed.thermalPct > 100 ? '#dc2626' : smoothed.thermalPct > 80 ? '#d97706' : '#16a34a');
            ctx.fillStyle = gradient;
            ctx.fillRect(barX, barY + barH - fillH, barW, fillH);
        }

        // Trip line (100%)
        const tripY = barY;
        ctx.beginPath();
        ctx.moveTo(barX - 10, tripY);
        ctx.lineTo(barX + barW + 25, tripY);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('TRIP 100%', barX + barW + 8, tripY + 4);

        // Alarm line (80%)
        const alarmY = barY + barH * 0.2;
        ctx.beginPath();
        ctx.moveTo(barX - 10, alarmY);
        ctx.lineTo(barX + barW + 25, alarmY);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('ALARM 80%', barX + barW + 8, alarmY + 4);

        // Percentage label under bar
        ctx.fillStyle = smoothed.thermalPct >= 100 ? '#ef4444' : smoothed.thermalPct >= 80 ? '#f59e0b' : '#22c55e';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${smoothed.thermalPct.toFixed(0)}%`, barX + barW / 2, barY + barH + 22);
        ctx.textAlign = 'left'; // Reset

        // Right side: Data Display
        const gx = cw * 0.55;

        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('THERMAL REPLICA', barX, 18);

        // Current Indicator
        ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText('Line Current', gx, 50);
        ctx.fillStyle = smoothed.currentMult > 1.15 ? '#ef4444' : '#22c55e';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText(`${smoothed.currentMult.toFixed(1)}× FLA`, gx, 75);

        // Speed Indicator
        ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText('Rotor Speed', gx, 115);
        ctx.fillStyle = smoothed.speed < 10 && smoothed.currentMult > 3 ? '#ef4444' : '#3b82f6';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText(`${smoothed.speed.toFixed(0)}%`, gx, 140);

        // Time Elapsed
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`Elapsed Time: ${elapsed.toFixed(1)}s`, gx, 180);

        // State Indicator
        ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText('Thermal State', gx, 220);
        const stateColor = thermalPct >= 100 ? '#ef4444' : thermalPct >= 80 ? '#f59e0b' : thermalPct >= 50 ? '#3b82f6' : '#22c55e';
        const stateLabel = thermalPct >= 100 ? 'OVERLOAD TRIP' : thermalPct >= 80 ? 'HOT — ALARM' : thermalPct >= 50 ? 'WARM' : 'COLD';
        ctx.fillStyle = stateColor;
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText(stateLabel, gx, 242);

        // Trip Overlay
        if (tripped) {
            ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
            ctx.fillRect(0, 0, cw, ch);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔴 49 THERMAL TRIP', cw / 2, ch - 20);
            ctx.textAlign = 'left';
        }
    }, [isDark, smoothed, elapsed, tripped, thermalPct]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full rounded-xl transition-colors duration-300"
            style={{
                height: 300,
                border: isDark ? '1px solid rgb(30,41,59)' : '1px solid rgb(226,232,240)',
                boxShadow: isDark ? 'inset 0 2px 10px rgba(0,0,0,0.2)' : 'inset 0 2px 10px rgba(0,0,0,0.05)'
            }}
        />
    );
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [thermalPct, setThermalPct] = useState(15);
    const [currentMult, setCurrentMult] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [running, setRunning] = useState(false);
    const [locked, setLocked] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [tripped, setTripped] = useState(false);
    const [events, setEvents] = useState<{ time: number; msg: string; type: string }[]>([]);
    const [startsLeft, setStartsLeft] = useState(3);

    // Use a ref to store state for the interval to avoid teardown/recreation jitter
    const stateRef = useRef({ running, locked, tripped, currentMult, speed, thermalPct, elapsed });

    useEffect(() => {
        stateRef.current = { running, locked, tripped, currentMult, speed, thermalPct, elapsed };
    }, [running, locked, tripped, currentMult, speed, thermalPct, elapsed]);

    const startMotor = () => {
        if (startsLeft <= 0) {
            setEvents(prev => [{ time: elapsed, msg: '🔒 66 LOCKOUT — No starts remaining. Wait for cooldown.', type: 'lockout' }, ...prev]);
            return;
        }
        setRunning(true);
        setLocked(false);
        setElapsed(0);
        setTripped(false);
        setCurrentMult(6.5);
        setSpeed(0);
        setStartsLeft(p => p - 1);
        setEvents([{ time: 0, msg: `⚡ Motor START initiated — Drawing 6.5× FLA (starts remaining: ${startsLeft - 1})`, type: 'info' }]);
    };

    const lockRotor = () => {
        if (!running) return;
        setLocked(true);
        setSpeed(0);
        setCurrentMult(6.5);
        setEvents(prev => [{ time: elapsed, msg: '🔴 LOCKED ROTOR — Speed = 0%, current = 6.5× FLA, no cooling!', type: 'fault' }, ...prev]);
    };

    // Main Thermal and Kinematic Loop
    useEffect(() => {
        const timer = setInterval(() => {
            const { running: r, locked: l, tripped: t, speed: s, currentMult: c, thermalPct: tp } = stateRef.current;

            // Advance elapsed time only when running and not tripped
            if (r && !t) setElapsed(p => p + 0.2);

            // Speed and Current Dynamics (Kinematics)
            if (r && !t) {
                if (!l) {
                    setSpeed(p => Math.min(100, p + 4)); // Accelerate ~5s to full speed
                    setCurrentMult(p => Math.max(1.0, p - 0.22)); // Current decays as speed rises
                } else {
                    setSpeed(0);
                    setCurrentMult(6.5);
                }
            } else {
                setSpeed(p => Math.max(0, p - 5)); // Coast down rapidly
                setCurrentMult(0);
            }

            // IEEE C37.96 Thermal Replica (Exponential heating/cooling)
            setThermalPct(p => {
                let I_pu = (!r || t) ? 0 : c;

                // NEMA typically uses 1.15 SF. Assuming trip threshold = 1.05x FLA for 100% thermal capacity limit.
                const target = Math.pow(I_pu / 1.05, 2) * 100;
                const isHeating = target > p;

                // Realistic motor constants: 
                // Tau_heating = 400s 
                // Tau_cooling = 1200s (3x longer to cool down when stopped because no shaft fan)
                // Tau_running_cooling = 600s (better cooling when running at full speed without overload)
                const tau = isHeating ? 400 : (s > 50 ? 600 : 1200);

                const dt = 0.2; // 200ms step
                const p_new = target + (p - target) * Math.exp(-dt / tau);

                return Math.max(0, Math.min(120, p_new)); // Clamp at 120%
            });
        }, 200);

        return () => clearInterval(timer);
    }, []); // Empty dependency array ensures a stable interval

    // Event Triggers (Separated from physics loop for cleaner React state updates)
    useEffect(() => {
        if (!running) return;

        if (speed >= 100 && !locked) {
            setEvents(prev => {
                if (!prev.some(e => e.msg.includes('at full speed'))) {
                    return [{ time: elapsed, msg: '✅ Motor at full speed — Current stabilized at 1.0× FLA', type: 'success' }, ...prev];
                }
                return prev;
            });
        }

        if (thermalPct >= 100 && !tripped) {
            setTripped(true);
            setRunning(false);
            setEvents(prev => [{ time: elapsed, msg: `🔴 49 THERMAL TRIP — Capacity ${thermalPct.toFixed(0)}% ≥ 100%. Contactor opened.`, type: 'trip' }, ...prev]);
        }

        if (thermalPct >= 80 && thermalPct < 81 && !tripped) { // Narrow window to fire alarm once
            setEvents(prev => {
                if (!prev.some(e => e.msg.includes('ALARM'))) {
                    return [{ time: elapsed, msg: `⚠️ 49 THERMAL ALARM — Capacity exceeded 80%`, type: 'fault' }, ...prev];
                }
                return prev;
            });
        }
    }, [speed, thermalPct, running, locked, tripped, elapsed]);

    const reset = () => {
        setRunning(false);
        setLocked(false);
        setElapsed(0);
        setTripped(false);
        setThermalPct(15);
        setCurrentMult(0);
        setSpeed(0);
        setEvents([]);
        setStartsLeft(3);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Control Panel */}
            <div className={`rounded-2xl border p-6 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center">
                    <Settings className="w-5 h-5 text-blue-500 mr-2" />
                    Motor Control Panel
                </h3>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={startMotor}
                        disabled={running || tripped || startsLeft <= 0}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <Play className="w-4 h-4" />
                        Start Motor ({startsLeft} starts left)
                    </button>
                    <button
                        onClick={lockRotor}
                        disabled={!running || locked || tripped}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Simulate Locked Rotor
                    </button>
                    <button
                        onClick={reset}
                        className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center transition-all duration-200 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Master Reset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visualization */}
                <div className={`rounded-2xl border p-5 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-4 text-sm flex items-center">
                        <TrendingUp className="w-4 h-4 text-red-500 mr-2" />
                        Real-time Thermal Replica
                    </h3>
                    <ThermalCanvas
                        isDark={isDark}
                        thermalPct={thermalPct}
                        currentMult={currentMult}
                        speed={speed}
                        elapsed={elapsed}
                        tripped={tripped}
                    />
                </div>

                {/* Status & Telemetry */}
                <div className="space-y-6">
                    <div className={`rounded-2xl border p-6 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-4 flex items-center">
                            <Activity className="w-4 h-4 text-blue-500 mr-2" />
                            Live Telemetry
                        </h3>
                        <div className="space-y-3">
                            {[
                                { l: 'Phase Current', v: `${currentMult.toFixed(1)}× FLA`, c: currentMult > 6 ? 'text-red-500' : currentMult > 1.15 ? 'text-amber-500' : 'text-emerald-500' },
                                { l: 'Rotor Speed', v: `${speed.toFixed(0)}%`, c: speed < 50 && running ? 'text-amber-500' : 'text-emerald-500' },
                                { l: 'Thermal Capacity Used', v: `${thermalPct.toFixed(1)}%`, c: thermalPct >= 100 ? 'text-red-500' : thermalPct >= 80 ? 'text-amber-500' : 'text-emerald-500' },
                                { l: 'Operational State', v: tripped ? 'TRIPPED (49)' : locked ? 'LOCKED ROTOR' : running ? (speed >= 100 ? 'RUNNING' : 'STARTING') : 'STOPPED', c: tripped ? 'text-red-500' : locked ? 'text-red-500' : running ? 'text-blue-500' : 'text-slate-500' },
                                { l: 'Starts Remaining (66)', v: `${startsLeft}/3`, c: startsLeft === 0 ? 'text-red-500 font-bold' : '' },
                            ].map(r => (
                                <div key={r.l} className={`flex justify-between text-sm py-2 border-b last:border-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                    <span className="opacity-70">{r.l}</span>
                                    <span className={`font-mono font-bold ${r.c}`}>{r.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Banner Alerts */}
                    <div className={`rounded-2xl border p-5 text-center transition-all duration-300 ${tripped ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                        locked ? 'bg-amber-500/10 border-amber-500/40' :
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                        {tripped && <div className="text-red-500 font-black text-xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 mr-2" /> 49 THERMAL TRIP INITIATED</div>}
                        {!tripped && locked && <div className="text-amber-500 font-bold animate-pulse text-lg flex items-center justify-center"><AlertTriangle className="w-5 h-5 mr-2" /> LOCKED ROTOR DETECTED — Heating rapidly!</div>}
                        {!tripped && !locked && running && speed >= 100 && <div className="text-emerald-500 font-bold text-lg flex items-center justify-center"><Activity className="w-5 h-5 mr-2" /> Running — Normal Operation</div>}
                        {!tripped && !locked && running && speed < 100 && <div className="text-blue-500 font-bold animate-pulse text-lg flex items-center justify-center"><Timer className="w-5 h-5 mr-2" /> Acceleration Sequence...</div>}
                        {!running && !tripped && thermalPct > 20 && <div className="text-blue-400 font-bold flex items-center justify-center opacity-80"><Timer className="w-4 h-4 mr-2" /> Motor Stopped — Cooling Down</div>}
                        {!running && !tripped && thermalPct <= 20 && <div className="opacity-50 font-bold flex items-center justify-center">Motor Ready — Cold State</div>}
                    </div>
                </div>
            </div>

            {/* Event Log */}
            <div className={`rounded-2xl border p-6 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-4 flex items-center">
                    <ShieldCheck className="w-5 h-5 text-blue-500 mr-2" />
                    Protection Relay Event Log
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {events.length === 0 && <p className="text-sm opacity-50 italic py-4 text-center">System armed. Start the motor to begin recording events.</p>}
                    <AnimatePresence initial={false}>
                        {events.map((e, i) => (
                            <motion.div
                                key={e.msg + i}
                                initial={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto', marginBottom: 8 }}
                                className={`text-sm p-3 rounded-xl border transition-colors ${e.type === 'trip' ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400' :
                                    e.type === 'fault' ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                                        e.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                                            e.type === 'lockout' ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400' :
                                                'border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300'
                                    }`}
                            >
                                <span className="font-mono opacity-70 font-bold mr-2">[{e.time.toFixed(1)}s]</span>
                                <span className="font-medium">{e.msg}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
                <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <h2 className="text-3xl font-black">Simulation Guide</h2>
                <p className="text-sm opacity-70 mt-1">Understanding Motor Protection (ANSI 49/50/66)</p>
            </div>
        </div>
        <div className="grid gap-4">
            {[
                { s: '1', t: 'Normal Start Sequence', d: 'Click "Start Motor". Observe the current spike to 6.5× FLA and gradually decay to 1.0× FLA as the motor accelerates. The thermal replica tracks the localized heating caused by the high starting current.' },
                { s: '2', t: 'Locked Rotor Simulation', d: 'During a start, click "Lock Rotor" to simulate a mechanical jam. The motor speed stays at 0% while continuously drawing 6.5× FLA. Watch the thermal bar fill rapidly and trip at 100% to prevent winding damage.' },
                { s: '3', t: 'Starts-per-Hour Limit (66)', d: 'You are allocated 3 starts. Each start consumes one allowance. Depleting all starts activates the ANSI 66 lockout, simulating the necessary cooldown period before another start is safely permitted.' },
                { s: '4', t: 'Thermal Replica Monitoring', d: 'The bar graph visualizes the estimated winding temperature relative to the trip threshold. It transitions from Green (cold) → Amber (80% alarm) → Red (100% trip) based on the IEEE C37.96 model.' },
            ].map(i => (
                <div key={i.s} className={`flex gap-5 p-6 rounded-2xl border transition-colors ${isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800/50' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-blue-500/20">
                        {i.s}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">{i.t}</h4>
                        <p className="text-sm opacity-70 mt-2 leading-relaxed">{i.d}</p>
                    </div>
                </div>
            ))}
        </div>
        <div className={`p-6 rounded-2xl border flex items-start gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
            <div>
                <h4 className="font-bold mb-1 text-amber-600 dark:text-amber-500">Standards & Compliance</h4>
                <p className="text-sm opacity-80 leading-relaxed">
                    This simulation implements a thermal replica based on <strong>IEEE C37.96</strong> (Guide for AC Motor Protection).
                    Motor parameters and service factors assume standard adherence to <strong>NEMA MG-1</strong> and <strong>IEC 60034</strong>.
                </p>
            </div>
        </div>
    </div>
);

// ============================== QUIZ ==============================
const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy' | 'medium' | 'expert'>('easy');
    const [cur, setCur] = useState(0);
    const [score, setScore] = useState(0);
    const [sel, setSel] = useState<number | null>(null);
    const [fin, setFin] = useState(false);

    const qs = QUIZ_DATA[level];
    const q = qs[cur];

    const pick = (i: number) => {
        if (sel !== null) return;
        setSel(i);
        if (i === q.ans) setScore(p => p + 1);

        setTimeout(() => {
            if (cur + 1 >= qs.length) {
                setFin(true);
            } else {
                setCur(p => p + 1);
                setSel(null);
            }
        }, 2500);
    };

    const rst = () => {
        setCur(0);
        setScore(0);
        setSel(null);
        setFin(false);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                    <Award className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-black">Knowledge Assessment</h2>
                    <p className="text-sm opacity-70 mt-1">Test your understanding of motor protection</p>
                </div>
            </div>

            {/* Level Selector */}
            <div className={`flex rounded-xl border overflow-hidden p-1 gap-1 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
                {(['easy', 'medium', 'expert'] as const).map(l => (
                    <button
                        key={l}
                        onClick={() => { setLevel(l); rst(); }}
                        className={`flex-1 py-2.5 text-sm font-bold uppercase rounded-lg transition-all duration-200 ${level === l
                            ? (l === 'easy' ? 'bg-emerald-600 text-white shadow-md' : l === 'medium' ? 'bg-amber-600 text-white shadow-md' : 'bg-red-600 text-white shadow-md')
                            : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-white'
                            }`}
                    >
                        {l}
                    </button>
                ))}
            </div>

            {fin ? (
                <div className={`text-center p-10 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="text-6xl mb-6">{score >= 4 ? '🏆' : '📚'}</div>
                    <div className="text-4xl font-black mb-3">Score: {score}/{qs.length}</div>
                    <p className="opacity-70 mb-8">{score >= 4 ? 'Excellent understanding of motor protection principles!' : 'Review the Reference tab to strengthen your knowledge.'}</p>
                    <button
                        onClick={rst}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 transition-colors text-white rounded-xl font-bold text-sm shadow-md"
                    >
                        Retry {level} Quiz
                    </button>
                </div>
            ) : (
                <div className={`p-8 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold opacity-50 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            Question {cur + 1} of {qs.length}
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            Current Score: {score}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold mb-8 leading-relaxed">{q.q}</h3>

                    <div className="space-y-3">
                        {q.opts.map((o, i) => (
                            <button
                                key={i}
                                onClick={() => pick(i)}
                                disabled={sel !== null}
                                className={`w-full text-left p-5 rounded-xl border text-sm transition-all duration-200 flex items-center ${sel === null
                                    ? isDark ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/50'
                                    : i === q.ans
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                                        : sel === i
                                            ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400'
                                            : 'opacity-40 border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 font-bold ${sel === null ? 'bg-slate-100 dark:bg-slate-800' :
                                    i === q.ans ? 'bg-emerald-500 text-white' :
                                        sel === i ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800'
                                    }`}>
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex-1">{o}</span>
                            </button>
                        ))}
                    </div>

                    <AnimatePresence>
                        {sel !== null && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-6 p-5 rounded-xl text-sm leading-relaxed ${sel === q.ans
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300'
                                    }`}
                            >
                                <strong className="block mb-1 text-base">
                                    {sel === q.ans ? '✅ Correct!' : '❌ Incorrect'}
                                </strong>
                                {q.why}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

// ============================== MAIN ==============================
export default function MotorProtection() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();

    const copyShareLink = () => {
        const url = window.location.origin + window.location.pathname;
        navigator.clipboard.writeText(url);
        // We use a custom alert here or stick to the browser one as implemented previously
        alert('Simulation link copied to clipboard!');
    };

    const tabs = [
        { id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4" /> },
        { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-4 h-4" /> },
        { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4" /> }
    ];

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO
                title="Motor Protection Simulator"
                description="Interactive motor protection with thermal replica model, locked rotor detection, starts-per-hour limiting per IEEE C37.96."
                url="/motor-protection"
            />

            {/* Header */}
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl text-white shadow-lg shadow-orange-500/20">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Motor<span className="text-orange-500">Guard</span>
                        </h1>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500/80 mt-1 block">
                            ✅ IEEE C37.96
                        </span>
                    </div>
                </div>

                {/* Desktop Nav */}
                <div className={`hidden md:flex p-1.5 rounded-xl border mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === t.id
                                ? (isDark ? 'bg-slate-800 text-orange-400 shadow-sm' : 'bg-white text-orange-600 shadow-sm')
                                : 'opacity-60 hover:opacity-100'
                                }`}
                        >
                            {t.icon}
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={copyShareLink}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    title="Share Simulation"
                >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                </button>
            </header>

            {/* Mobile Nav */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center pb-safe ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold transition-colors ${activeTab === t.id ? (isDark ? 'text-orange-400' : 'text-orange-600') : 'opacity-50'
                            }`}
                    >
                        {t.icon}
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && (
                    <TheoryLibrary
                        title="Motor Protection Handbook"
                        description="Motor protection theory covering thermal models, locked rotor, starts-per-hour, phase unbalance, and IEEE C37.96 compliance."
                        sections={MOTOR_PROTECTION_THEORY_CONTENT}
                    />
                )}

                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto custom-scrollbar' : 'hidden'}>
                    <SimulatorModule isDark={isDark} />
                </div>

                {activeTab === 'guide' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <GuideModule isDark={isDark} />
                    </div>
                )}

                {activeTab === 'quiz' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <QuizModule isDark={isDark} />
                    </div>
                )}
            </div>
        </div>
    );
}