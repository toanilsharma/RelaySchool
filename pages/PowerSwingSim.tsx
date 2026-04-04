import React, { useState, useEffect, useRef } from 'react';
import {
    Play, RotateCcw, AlertCircle, CheckCircle2, Activity, Zap,
    HelpCircle, Book, Flag, AlertTriangle, MonitorPlay, GraduationCap, Award, Settings,
    Info, StopCircle, RefreshCcw, Share2, Radar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import Slider from '../components/Slider';
import TheoryLibrary from '../components/TheoryLibrary';
import { POWER_SWING_THEORY_CONTENT } from '../data/learning-modules/power-swing';
import SEO from "../components/SEO";

// ========================= CONSTANTS =========================
const QUIZ_DATA = {
    easy: [
        { q: "What ANSI code designates power swing/out-of-step protection?", opts: ["21", "25", "78", "87"], ans: 2 },
        { q: "A power swing occurs when:", opts: ["Voltage drops", "Generator rotors oscillate", "CT saturates", "Frequency is normal"], ans: 1 },
        { q: "PSB stands for:", opts: ["Power System Backup", "Power Swing Blocking", "Protection Scheme Bypass", "Phase Sequence Balance"], ans: 1 },
        { q: "During a stable swing, the distance relay should:", opts: ["Trip immediately", "Be blocked from tripping", "Increase pickup", "Alarm only"], ans: 1 },
        { q: "Out-of-step means generators have:", opts: ["Low voltage", "Lost synchronism", "High frequency", "CT errors"], ans: 1 },
    ],
    medium: [
        { q: "The blinder method uses two impedance boundaries to measure:", opts: ["Current magnitude", "Time for impedance to cross from outer to inner zone", "Voltage angle", "Frequency"], ans: 1 },
        { q: "A fault causes impedance to jump in:", opts: ["Seconds", "Less than 100ms (instantly)", "Minutes", "Hours"], ans: 1 },
        { q: "OOS tripping should occur at:", opts: ["Generator terminals", "Predetermined tie lines (controlled separation)", "Load centers", "Random locations"], ans: 1 },
        { q: "The impedance locus during a swing is a straight line when:", opts: ["Sources have equal voltage", "Load is inductive", "CT ratio is wrong", "Relay is faulty"], ans: 0 },
        { q: "The PSB timer is typically set to:", opts: ["1-5 ms", "30-60 ms", "1-5 seconds", "30-60 seconds"], ans: 1 },
    ],
    expert: [
        { q: "Per NERC PRC-026, relays must:", opts: ["Trip during stable swings", "Not trip during stable swings", "Ignore power swings", "Use only Zone 1"], ans: 1 },
        { q: "During OOS, the angle δ between generators:", opts: ["Returns to zero", "Exceeds 180° and keeps increasing", "Oscillates around 90°", "Stays constant"], ans: 1 },
        { q: "The electrical center of a two-machine system is at:", opts: ["The generator terminal", "The midpoint of total impedance", "The load bus", "The CT location"], ans: 1 },
        { q: "Continuous impedance tracking (rate-of-change) is preferred over simple blinders because:", opts: ["It's cheaper", "It discriminates better with CT/VT errors", "It uses less memory", "It's easier to set"], ans: 1 },
        { q: "Controlled separation during OOS aims to:", opts: ["Maximize outage area", "Create islands with balanced generation and load", "Trip all generators", "Open all breakers"], ans: 1 },
    ],
};

// ========================= SIMULATOR =========================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [running, setRunning] = useState(false);
    const [swingType, setSwingType] = useState<'stable' | 'oos'>('stable');
    const [inertiaH, setInertiaH] = useState(3.0); // MWs/MVA
    const [outerRadius, setOuterRadius] = useState(1.5); // pu
    const [innerRadius, setInnerRadius] = useState(0.8); // pu
    const [psbTimer, setPsbTimer] = useState(40); // ms
    const [delta, setDelta] = useState(30);
    const [zReal, setZReal] = useState(0);
    const [zImag, setZImag] = useState(2);
    const [state, setState] = useState<'IDLE' | 'SWINGING' | 'PSB_ACTIVE' | 'OOS_TRIP' | 'STABLE'>('IDLE');
    const [events, setEvents] = useState<string[]>([]);
    const [outerEntry, setOuterEntry] = useState(false);
    const [innerEntry, setInnerEntry] = useState(false);
    const [entryTime, setEntryTime] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [trajectory, setTrajectory] = useState<{ r: number; x: number }[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timerRef = useRef<any>(null);

    const reset = () => {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        setRunning(false);
        setDelta(30);
        setZReal(0);
        setZImag(2);
        setState('IDLE');
        setEvents([]);
        setOuterEntry(false);
        setInnerEntry(false);
        setEntryTime(0);
        setElapsed(0);
        setTrajectory([]);
    };

    const start = () => {
        reset();
        setRunning(true);
        setState('SWINGING');
        setEvents(['⚡ Disturbance detected — Swing Equation active']);

        let t = 0;
        const w_s = 2 * Math.PI * 60; // 377 rad/s sync speed
        const Pm = 1.0;
        const Pe_max = 2.0;
        let currentDelta = Math.asin(Pm / Pe_max) * (180 / Math.PI);
        let omega = 0; // slip velocity rad/s

        let outerEntered = false;
        let innerEntered = false;
        let outerEntryTime = 0;

        let lastTime = performance.now();

        const loop = (currentTime: number) => {
            const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // dynamic dt, max 50ms
            lastTime = currentTime;
            t += dt;

            // Electrical power
            const Pe = Pe_max * Math.sin(currentDelta * Math.PI / 180);

            // Swing Equation: (2H / w_s) * d(omega)/dt = Pm - Pe
            let P_acc;
            if (swingType === 'oos') {
                // Fault persists, or generator accelerates out of step
                P_acc = (Pm * 2.2) - Pe - (0.01 * omega); // Force OOS
            } else {
                // Stable swing: temporary fault drops Pe to 0.2, then clears
                if (t < 0.15) P_acc = Pm - (Pe * 0.2);
                else P_acc = Pm - Pe - (0.08 * omega); // Cleared + some damping
            }

            const alpha_rad = (P_acc * w_s) / (2 * inertiaH);
            omega += alpha_rad * dt;
            currentDelta += (omega * dt) * (180 / Math.PI);

            const effectiveDelta = currentDelta;

            // Calculate apparent impedance (simplified two-machine model)
            const dRad = (effectiveDelta * Math.PI) / 180;
            const Zl = 1.0; // line impedance pu
            const Zs = 0.3; // source impedance pu

            // Z_apparent traces vertical line through electrical center
            const cosd = Math.cos(dRad);
            const sind = Math.sin(dRad);
            const denom = 2 * (1 - cosd) + 0.01;
            const zr = (Zl * sind) / denom;
            const zx = Zs + (Zl * (1 - cosd)) / denom;

            setZReal(zr);
            setZImag(zx);
            setDelta(effectiveDelta % 360);
            setElapsed(t);
            setTrajectory(prev => [...prev, { r: zr, x: zx }].slice(-500));

            // Check zones
            const zMag = Math.sqrt(zr * zr + zx * zx);

            if (!outerEntered && zMag <= outerRadius) {
                outerEntered = true;
                outerEntryTime = t;
                setOuterEntry(true);
                setEvents(prev => [`[${t.toFixed(2)}s] Locus entered OUTER blinder zone`, ...prev].slice(0, 20));
            }

            if (outerEntered && !innerEntered && zMag <= innerRadius) {
                innerEntered = true;
                setInnerEntry(true);
                const transitTime = (t - outerEntryTime) * 1000; // ms
                setEntryTime(transitTime);

                if (transitTime > psbTimer) {
                    // Slow crossing = power swing
                    setEvents(prev => [`[${t.toFixed(2)}s] Locus entered INNER zone — Transit time: ${transitTime.toFixed(0)}ms > ${psbTimer}ms → POWER SWING detected`, ...prev].slice(0, 20));

                    if (swingType === 'oos' && Math.abs(effectiveDelta) > 180) {
                        setState('OOS_TRIP');
                        setEvents(prev => ['🔴 OOS TRIP — δ > 180°. Controlled separation executed.', ...prev]);
                        cancelAnimationFrame(timerRef.current);
                        setRunning(false);
                    } else {
                        setState('PSB_ACTIVE');
                        setEvents(prev => ['🟡 PSB ACTIVE — Distance relay BLOCKED', ...prev].slice(0, 20));
                    }
                } else {
                    // Fast crossing = fault
                    setEvents(prev => [`[${t.toFixed(2)}s] Transit time: ${transitTime.toFixed(0)}ms < ${psbTimer}ms → Likely FAULT (not swing)`, ...prev].slice(0, 20));
                }
            }

            // Stable swing: stop after damping settled
            if (swingType === 'stable' && t > 5 && Math.abs(omega) < 0.1) {
                setState('STABLE');
                setEvents(prev => ['✅ Swing DAMPED — System returned to synchronism (Swing Eq. settled).', ...prev]);
                cancelAnimationFrame(timerRef.current);
                setRunning(false);
            }

            // OOS: check for >360 degrees
            if (swingType === 'oos' && Math.abs(effectiveDelta) > 360) {
                setState('OOS_TRIP');
                setEvents(prev => ['🔴 OOS TRIP — Full pole slip detected.', ...prev]);
                cancelAnimationFrame(timerRef.current);
                setRunning(false);
            }

            if (running) {
                timerRef.current = requestAnimationFrame(loop);
            }
        };
        timerRef.current = requestAnimationFrame(loop);
    };

    // Draw R-X diagram
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        const w = cvs.width, h = cvs.height;
        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) / 5; // pixels per pu

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.lineWidth = 0.5;
        for (let i = -2; i <= 2; i += 0.5) {
            ctx.beginPath(); ctx.moveTo(0, cy - i * scale); ctx.lineTo(w, cy - i * scale); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + i * scale, 0); ctx.lineTo(cx + i * scale, h); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('R (pu)', w - 40, cy - 5);
        ctx.fillText('X (pu)', cx + 5, 15);

        // Outer blinder circle
        ctx.strokeStyle = '#3b82f680';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.arc(cx, cy, outerRadius * scale, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#3b82f6';
        ctx.font = '10px sans-serif';
        ctx.fillText('Outer', cx + outerRadius * scale + 5, cy - 5);

        // Inner blinder circle
        ctx.strokeStyle = '#ef444480';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.arc(cx, cy, innerRadius * scale, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('Inner', cx + innerRadius * scale + 5, cy - 5);

        // Trajectory
        if (trajectory.length > 1) {
            ctx.strokeStyle = '#10b98180';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            trajectory.forEach((pt, i) => {
                const px = cx + pt.r * scale;
                const py = cy - pt.x * scale;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.stroke();
        }

        // Current position
        const curX = cx + zReal * scale;
        const curY = cy - zImag * scale;
        ctx.fillStyle = state === 'OOS_TRIP' ? '#ef4444' : state === 'PSB_ACTIVE' ? '#f59e0b' : '#10b981';
        ctx.beginPath(); ctx.arc(curX, curY, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`Z`, curX + 10, curY + 4);
    }, [zReal, zImag, trajectory, isDark, outerRadius, innerRadius, state]);

    return (
        <div className="w-full h-full max-w-[1600px] mx-auto p-4 space-y-4 flex flex-col">
            <div className={`shrink-0 rounded-2xl border p-4 lg:p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Settings className="w-4 h-4 text-blue-500" /> Configuration</h3>
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1 block">Swing Type</label>
                        <select value={swingType} onChange={e => setSwingType(e.target.value as 'stable' | 'oos')}
                            className={`w-full p-2.5 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} disabled={running}>
                            <option value="stable">Stable Power Swing</option>
                            <option value="oos">Out-of-Step (OOS)</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px] mb-[-4px]">
                        <Slider
                            label="Inertia Constant (H)"
                            unit="MWs/MVA"
                            min={1.0}
                            max={10.0}
                            step={0.5}
                            value={inertiaH}
                            onChange={e => setInertiaH(parseFloat(e.target.value))}
                            color="blue"
                            disabled={running}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px] mb-[-4px]">
                        <Slider
                            label="PSB Timer"
                            unit="ms"
                            min={10}
                            max={100}
                            step={5}
                            value={psbTimer}
                            onChange={e => setPsbTimer(parseInt(e.target.value))}
                            color="amber"
                            disabled={running}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={start} disabled={running}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-all">
                            <Play className="w-4 h-4" /> Start Swing
                        </button>
                        <button onClick={reset}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
                {/* R-X Diagram */}
                <div className={`xl:flex-1 rounded-2xl border p-4 lg:p-5 flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} min-h-[300px]`}>
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2 shrink-0"><Radar className="w-4 h-4 text-purple-500" /> R-X Impedance Plane</h3>
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <canvas ref={canvasRef} width={350} height={350} className="max-w-full max-h-full object-contain" />
                    </div>
                </div>

                {/* Status Column */}
                <div className={`xl:w-[350px] shrink-0 rounded-2xl border p-4 lg:p-5 flex flex-col gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-sm mb-1 flex items-center gap-2 shrink-0"><Activity className="w-4 h-4 text-blue-500" /> Status</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[
                            { label: 'State', value: state, color: state === 'OOS_TRIP' ? 'text-red-500' : state === 'PSB_ACTIVE' ? 'text-amber-500' : state === 'STABLE' ? 'text-emerald-500' : '' },
                            { label: 'Angle (δ)', value: `${delta.toFixed(1)}°`, color: Math.abs(delta) > 120 ? 'text-red-500' : 'text-blue-500' },
                            { label: 'Z Real', value: `${zReal.toFixed(2)}`, color: '' },
                            { label: 'Z Imag', value: `${zImag.toFixed(2)}`, color: '' },
                            { label: '|Z|', value: `${Math.sqrt(zReal ** 2 + zImag ** 2).toFixed(2)}`, color: '' },
                            { label: 'Time', value: `${elapsed.toFixed(2)}s`, color: '' },
                        ].map(item => (
                            <div key={item.label} className="col-span-2 sm:col-span-1 flex justify-between text-[11px]">
                                <span className="opacity-60">{item.label}</span>
                                <span className={`font-bold font-mono ${item.color}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2 mt-auto">
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${outerEntry ? 'border-blue-500/30 bg-blue-500/5' : isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            {outerEntry ? <AlertTriangle className="w-3.5 h-3.5 text-blue-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            <span className="font-bold">Outer Blinder</span>
                            <span className={`ml-auto ${outerEntry ? 'text-blue-500' : 'text-emerald-500'}`}>{outerEntry ? 'ENTERED' : 'CLEAR'}</span>
                        </div>
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${innerEntry ? 'border-red-500/30 bg-red-500/5' : isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            {innerEntry ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            <span className="font-bold">Inner Blinder</span>
                            <span className={`ml-auto ${innerEntry ? 'text-red-500' : 'text-emerald-500'}`}>{innerEntry ? `ENTERED (${entryTime.toFixed(0)}ms transit)` : 'CLEAR'}</span>
                        </div>
                    </div>

                    <div className={`mt-2 p-3 rounded-xl text-center font-bold text-sm border ${state === 'OOS_TRIP' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                        state === 'PSB_ACTIVE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                            state === 'STABLE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                        {state === 'OOS_TRIP' ? '🔴 OOS TRIP' :
                            state === 'PSB_ACTIVE' ? '🟡 PSB BLOCKED' :
                                state === 'STABLE' ? '🟢 SWING DAMPED' :
                                    state === 'SWINGING' ? '⏳ Swinging...' :
                                        '⏸ STANDBY'}
                    </div>
                </div>

                {/* Event Log */}
                <div className={`xl:w-[400px] shrink-0 rounded-2xl border p-4 lg:p-5 flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2 shrink-0"><AlertCircle className="w-4 h-4 text-amber-500" />Event Log</h3>
                    <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar min-h-[150px]">
                        {events.length === 0 && <p className="text-xs opacity-40 italic">No events yet.</p>}
                        <AnimatePresence>
                            {events.map((e, i) => (
                                <motion.div
                                    key={e + i}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-[11px] font-mono p-2 rounded bg-slate-800/50 mb-1"
                                >
                                    {e}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================= GUIDE & QUIZ =========================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div>
            <div><h2 className="text-2xl font-black text-slate-900 dark:text-white">User Guide</h2><p className="text-sm opacity-60">Power Swing & Out-of-Step Simulator</p></div>
        </div>
        {[
            { step: '1', title: 'Select Swing Type', desc: 'Choose "Stable Power Swing" (generators recover synchronism) or "Out-of-Step" (generators lose synchronism — angle continuously increases).' },
            { step: '2', title: 'Adjust Parameters', desc: 'Set Generator Inertia (H) to see how physics affects swing speed. Adjust PSB timer to set the threshold distinguishing swings (slow) from faults (fast).' },
            { step: '3', title: 'Start Swing', desc: 'Click "Start Swing" to begin. The R-X diagram shows the impedance locus trajectory in real-time, governed by the Swing Equation.' },
            { step: '4', title: 'Observe Blinder Zones', desc: 'Watch the green dot (Z) move on the R-X plane. When it crosses the outer blinder (blue circle) and then the inner blinder (red circle), the relay determines swing vs fault.' },
            { step: '5', title: 'Analyze Outcome', desc: 'Stable swing → PSB blocks Zone 1/2 tripping. OOS → relay executes controlled separation at δ > 180°.' },
        ].map(item => (
            <div key={item.step} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-lg shrink-0">{item.step}</div>
                <div><h4 className="font-bold">{item.title}</h4><p className="text-sm opacity-70 mt-1">{item.desc}</p></div>
            </div>
        ))}
    </div>
);

const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy' | 'medium' | 'expert'>('easy');
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [finished, setFinished] = useState(false);
    const questions = QUIZ_DATA[level]; const q = questions[current];
    const handleSelect = (idx: number) => { if (selected !== null) return; setSelected(idx); if (idx === q.ans) setScore(prev => prev + 1); setTimeout(() => { if (current + 1 >= questions.length) setFinished(true); else { setCurrent(prev => prev + 1); setSelected(null); } }, 1200); };
    const resetQuiz = () => { setCurrent(0); setScore(0); setSelected(null); setFinished(false); };
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div><div><h2 className="text-2xl font-black text-slate-900 dark:text-white">Knowledge Quiz</h2><p className="text-sm opacity-60">Power swing & OOS</p></div></div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>{(['easy', 'medium', 'expert'] as const).map(l => (<button key={l} onClick={() => { setLevel(l); resetQuiz(); }} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${level === l ? (l === 'easy' ? 'bg-emerald-600 text-white' : l === 'medium' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white') : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>{l}</button>))}</div>
            {finished ? (
                <div className={`text-center p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="text-5xl mb-4">{score >= 4 ? '🏆' : score >= 3 ? '✅' : '📚'}</div><div className="text-3xl font-black mb-2">{score}/{questions.length}</div><button onClick={resetQuiz} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button></div>
            ) : (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold opacity-40">Q{current + 1}/{questions.length}</span><span className="text-xs font-bold text-emerald-500">Score: {score}</span></div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">{q.opts.map((opt, i) => (<button key={i} onClick={() => handleSelect(i)} className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all ${selected === null ? isDark ? 'border-slate-700 hover:border-blue-500' : 'border-slate-200 hover:border-blue-500' : i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : selected === i ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40'}`}><span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}</button>))}</div>
                </div>
            )}
        </div>
    );
};

// ========================= MAIN LAYOUT =========================
export default function PowerSwingSim() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };
    const tabs = [
        { id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4" /> },
        { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-4 h-4" /> },
        { id: 'guide', label: 'User Guide', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4" /> },
    ];
    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="Power Swing & OOS Simulator (78)" description="Interactive power swing and out-of-step simulator with R-X impedance locus visualization, PSB/OOS logic, and blinder zone configuration per IEEE C37.104." url="/power-swing" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-violet-600 to-purple-600 p-2 rounded-lg text-white shadow-lg shadow-violet-500/20"><Radar className="w-5 h-5" /></div>
                    <div><h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Swing<span className="text-violet-500">Guard</span></h1>
                        <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold uppercase tracking-widest opacity-50">PSB / OOS Simulator</span><span className="w-1 h-1 bg-slate-400 rounded-full opacity-50" /><span className="text-[10px] font-bold uppercase tracking-widest text-violet-500/80">✅ IEEE C37.104 / NERC PRC-026</span></div></div>
                </div>
                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id ? (isDark ? 'bg-slate-800 text-violet-400 shadow-sm' : 'bg-white text-violet-600 shadow-sm') : 'opacity-60 hover:opacity-100'}`}>{tab.icon} <span>{tab.label}</span></button>))}
                </div>
                <div />
                <button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4" />Share</button></header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold ${activeTab === tab.id ? (isDark ? 'text-violet-400' : 'text-violet-600') : 'opacity-50'}`}>{tab.icon} <span>{tab.label}</span></button>))}
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative h-[calc(100vh-4rem)]">
                {activeTab === 'theory' && <TheoryLibrary title="Power Swing Handbook" description="Power swing blocking, out-of-step tripping, and impedance locus analysis." sections={POWER_SWING_THEORY_CONTENT} />}
                {activeTab === 'simulator' && <div className="h-full"><SimulatorModule isDark={isDark} /></div>}
                {activeTab === 'guide' && <div className="h-full"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
