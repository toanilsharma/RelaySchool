import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Play, Square, RotateCcw, AlertCircle, CheckCircle2, XCircle, Activity, Zap, Timer,
    HelpCircle, Book, AlertTriangle, Settings, Sliders, TrendingUp, MonitorPlay, GraduationCap,
    ShieldCheck, Info, Award, Gauge, Radio, Power, Lock, Unlock, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import TheoryLibrary from '../components/TheoryLibrary';
import { SYNCHROCHECK_THEORY_CONTENT } from '../data/learning-modules/synchrocheck';
import SEO from "../components/SEO";
import Odometer from '../components/Odometer';
import Slider from '../components/Slider';

// ========================= CONSTANTS =========================
const SCENARIOS = [
    { id: 'gen_parallel', label: 'Generator Paralleling', dvMax: 5, dfMax: 0.05, daMax: 10 },
    { id: 'line_reclose', label: 'Line Reclosing', dvMax: 10, dfMax: 0.2, daMax: 25 },
    { id: 'bus_transfer', label: 'Bus Coupler', dvMax: 5, dfMax: 0.1, daMax: 15 },
];

const QUIZ_DATA = {
    easy: [
        { q: "What are the three parameters checked by a synchrocheck relay?", opts: ["V, I, Z", "ΔV, Δf, Δφ", "P, Q, S", "R, X, Z"], ans: 1 },
        { q: "When the synchroscope pointer is at 12 o'clock, the two systems are:", opts: ["180° apart", "In phase (0°)", "90° apart", "Unknown"], ans: 1 },
        { q: "What ANSI code designates a synchrocheck relay?", opts: ["21", "25", "50", "79"], ans: 1 },
        { q: "Closing a breaker 180° out of phase can cause:", opts: ["Normal operation", "Shaft damage to generators", "Lower voltage", "Higher efficiency"], ans: 1 },
        { q: "The synchroscope pointer rotating clockwise means:", opts: ["Incoming is slower", "Incoming is faster", "Systems are in sync", "Voltage mismatch"], ans: 1 },
    ],
    medium: [
        { q: "For generator paralleling, the typical maximum phase angle difference is:", opts: ["±25°", "±45°", "±10°", "±90°"], ans: 2 },
        { q: "The advance angle for closing accounts for:", opts: ["CT ratio error", "Breaker operating time", "Transformer ratio", "Cable impedance"], ans: 1 },
        { q: "Dead-bus closing logic allows:", opts: ["Closing without synchrocheck when one side is dead", "Only manual closing", "Higher phase angle limits", "Faster breaker operation"], ans: 0 },
        { q: "A safe maximum slip frequency for manual synchronization is approximately:", opts: ["1.0 Hz", "0.5 Hz", "0.1 Hz", "5.0 Hz"], ans: 2 },
        { q: "The voltage across the breaker at closure depends on:", opts: ["Current only", "Both voltage magnitudes and phase angle difference", "Frequency only", "Impedance only"], ans: 1 },
    ],
    expert: [
        { q: "Per IEEE C50.13, the maximum permissible closing angle for hydro generators is typically:", opts: ["±5°", "±10°", "±30°", "±45°"], ans: 1 },
        { q: "Sympathetic tripping during synchro-close can be prevented by:", opts: ["Using faster breakers", "Adding synchrocheck to autorecloser", "Disabling protection", "Increasing CT ratio"], ans: 1 },
        { q: "For line reclosing, if the line connects two separate grid islands:", opts: ["Synchrocheck is not needed", "Synchrocheck must verify both sides", "Only frequency is checked", "Only voltage is checked"], ans: 1 },
        { q: "The formula V_across = √(V₁² + V₂² - 2V₁V₂cos(Δφ)) is maximum when Δφ equals:", opts: ["0°", "90°", "180°", "270°"], ans: 2 },
        { q: "In a black start scenario, synchrocheck is typically:", opts: ["Set to tighter limits", "Bypassed for dead-bus close", "Not available", "Set to Δf = 0"], ans: 1 },
    ],
};

// ========================= SIMULATOR =========================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [scenario, setScenario] = useState(SCENARIOS[0]);
    const [busV, setBusV] = useState(1.0);
    const [genV, setGenV] = useState(0.95);
    const [busF, setBusF] = useState(50.0);
    const [genF, setGenF] = useState(50.03);
    const [angle, setAngle] = useState(0);
    const [running, setRunning] = useState(false);
    const [closeResult, setCloseResult] = useState<null | { ok: boolean; msg: string }>(null);
    const [events, setEvents] = useState<string[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const angleRef = useRef(0);

    const deltaV = Math.abs((busV - genV) / busV * 100);
    const deltaF = Math.abs(busF - genF);
    const dvOk = deltaV <= scenario.dvMax;
    const dfOk = deltaF <= scenario.dfMax;
    const daOk = Math.abs(angle) <= scenario.daMax;
    const allOk = dvOk && dfOk && daOk;

    // Dispatch live state for theory diagrams
    useEffect(() => {
        const event = new CustomEvent('live-state-synchrocheck', {
            detail: { busV, genV, deltaAngle: angle }
        });
        window.dispatchEvent(event);
    }, [busV, genV, angle]);

    // Animation loop for synchroscope
    useEffect(() => {
        if (!running) return;
        const slip = genF - busF;
        const tick = () => {
            angleRef.current = (angleRef.current + slip * 360 * 0.016) % 360;
            setAngle(parseFloat(angleRef.current.toFixed(1)));
            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animRef.current);
    }, [running, genF, busF]);

    // Draw synchroscope
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        const size = cvs.width;
        const cx = size / 2, cy = size / 2, r = size / 2 - 20;

        ctx.clearRect(0, 0, size, size);

        // Background
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.fill();

        // Dial face
        ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

        // Safe zone (green arc)
        const safeAngle = (scenario.daMax * Math.PI) / 180;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(cx, cy, r - 10, -Math.PI / 2 - safeAngle, -Math.PI / 2 + safeAngle); ctx.stroke();

        // Danger zone (red arc)
        ctx.strokeStyle = '#ef444480';
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(cx, cy, r - 10, Math.PI / 2 - safeAngle, Math.PI / 2 + safeAngle); ctx.stroke();

        // Tick marks
        for (let i = 0; i < 12; i++) {
            const a = (i * 30 - 90) * Math.PI / 180;
            const inner = i % 3 === 0 ? r - 25 : r - 18;
            ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
            ctx.lineWidth = i % 3 === 0 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
            ctx.lineTo(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5));
            ctx.stroke();
        }

        // "12 o'clock" label
        ctx.fillStyle = isDark ? '#10b981' : '#059669';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SYNC', cx, cy - r + 35);

        // "6 o'clock" label
        ctx.fillStyle = '#ef4444';
        ctx.fillText('180°', cx, cy + r - 20);

        // Pointer
        const pointerAngle = (angle - 90) * Math.PI / 180;
        const pointerLen = r - 30;
        ctx.strokeStyle = allOk ? '#10b981' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(pointerAngle) * pointerLen, cy + Math.sin(pointerAngle) * pointerLen);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

    }, [angle, isDark, scenario, allOk]);

    const handleClose = () => {
        if (allOk) {
            const Vacross = Math.sqrt(busV ** 2 + genV ** 2 - 2 * busV * genV * Math.cos(angle * Math.PI / 180));
            setCloseResult({ ok: true, msg: `✅ SUCCESS: Breaker closed at Δφ=${angle.toFixed(1)}°, V_across=${Vacross.toFixed(3)} pu` });
            setEvents(prev => [`[SUCCESS] Closed at ${angle.toFixed(1)}°`, ...prev].slice(0, 10));
            setRunning(false);
        } else {
            const reasons = [];
            if (!dvOk) reasons.push(`ΔV=${deltaV.toFixed(1)}% > ${scenario.dvMax}%`);
            if (!dfOk) reasons.push(`Δf=${deltaF.toFixed(3)}Hz > ${scenario.dfMax}Hz`);
            if (!daOk) reasons.push(`Δφ=${Math.abs(angle).toFixed(1)}° > ${scenario.daMax}°`);
            setCloseResult({ ok: false, msg: `❌ BLOCKED: ${reasons.join(', ')}` });
            setEvents(prev => [`[BLOCKED] ${reasons.join('; ')}`, ...prev].slice(0, 10));
        }
    };

    const reset = () => {
        setRunning(false);
        angleRef.current = 0;
        setAngle(0);
        setCloseResult(null);
        cancelAnimationFrame(animRef.current);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Controls */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500" /> Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Scenario</label>
                        <select value={scenario.id} onChange={e => setScenario(SCENARIOS.find(s => s.id === e.target.value) || SCENARIOS[0])}
                            className={`w-full p-2.5 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <Slider label="Bus Voltage" unit=" pu" min={0.85} max={1.15} step={0.01} value={busV} onChange={e => setBusV(parseFloat(e.target.value))} color="blue" />
                    </div>
                    <div>
                        <Slider label="Gen Voltage" unit=" pu" min={0.85} max={1.15} step={0.01} value={genV} onChange={e => setGenV(parseFloat(e.target.value))} color="emerald" />
                    </div>
                    <div>
                        <Slider label="Gen Frequency" unit=" Hz" min={49.5} max={50.5} step={0.01} value={genF} onChange={e => setGenF(parseFloat(e.target.value))} color="purple" />
                    </div>
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={() => { setRunning(true); setCloseResult(null); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-all" disabled={running}>
                        <Play className="w-4 h-4" /> Start
                    </button>
                    <button onClick={handleClose}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${allOk ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
                        <Power className="w-4 h-4" /> Close Breaker
                    </button>
                    <button onClick={reset}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Synchroscope */}
                <div className={`rounded-2xl border p-6 flex flex-col items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Gauge className="w-5 h-5 text-purple-500" /> Synchroscope</h3>
                    <canvas ref={canvasRef} width={280} height={280} className="mb-4" />
                    <div className="text-center">
                        <div className="text-3xl font-black font-mono">{angle.toFixed(1)}°</div>
                        <div className="text-xs opacity-60">Phase Angle Difference</div>
                    </div>
                </div>

                {/* Status Gauges */}
                <div className={`rounded-2xl border p-6 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Check Status</h3>
                    {[
                        { label: 'ΔV', value: deltaV, limit: `≤${scenario.dvMax}%`, ok: dvOk, unit: '%' },
                        { label: 'Δf', value: deltaF, limit: `≤${scenario.dfMax} Hz`, ok: dfOk, unit: ' Hz', digits: 3 },
                    ].map(item => (
                        <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl border ${item.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                            <div className="flex items-center gap-3">
                                {item.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                                <span className="font-bold text-lg">{item.label}</span>
                            </div>
                            <div className="text-right">
                                <Odometer value={item.value as number} format={v => `${v.toFixed(item.digits || 1)}${item.unit}`} className={`font-mono font-bold ${item.ok ? 'text-emerald-500' : 'text-red-500'}`} />
                                <div className="text-[10px] opacity-50">Limit: {item.limit}</div>
                            </div>
                        </div>
                    ))}
                    <div key="Δφ" className={`flex items-center justify-between p-3 rounded-xl border ${daOk ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                        <div className="flex items-center gap-3">
                            {daOk ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                            <span className="font-bold text-lg">Δφ</span>
                        </div>
                        <div className="text-right">
                            <span className={`font-mono font-bold ${daOk ? 'text-emerald-500' : 'text-red-500'}`}>{Math.abs(angle).toFixed(1)}°</span>
                            <div className="text-[10px] opacity-50">Limit: ≤{scenario.daMax}°</div>
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl text-center font-bold text-lg ${allOk ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
                        {allOk ? '✅ CLOSE PERMITTED' : '⛔ CLOSE BLOCKED'}
                    </div>

                    {closeResult && (
                        <div className={`p-4 rounded-xl border text-sm font-bold ${closeResult.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                            {closeResult.msg}
                        </div>
                    )}
                </div>
            </div>

            {/* Event Log */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Event Log</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {events.length === 0 && <p className="text-sm opacity-40 italic">No events yet.</p>}
                    <AnimatePresence>
                        {events.map((e, i) => (
                            <motion.div 
                                key={e + i}
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 4 }}
                                className="text-xs font-mono p-2 rounded bg-slate-800/50"
                            >
                                {e}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ========================= GUIDE =========================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">User Guide</h2>
                <p className="text-sm opacity-60">How to use the Synchrocheck Simulator</p>
            </div>
        </div>
        {[
            { step: '1', title: 'Select Scenario', desc: 'Choose between Generator Paralleling (tightest limits), Line Reclosing, or Bus Coupler. Each has different ΔV, Δf, and Δφ thresholds.' },
            { step: '2', title: 'Adjust Voltages', desc: 'Use the sliders to set Bus and Generator voltages. Try to match them within the ΔV limit.' },
            { step: '3', title: 'Adjust Gen Frequency', desc: 'Set the generator frequency. A small positive slip (gen slightly faster) makes the synchroscope rotate clockwise slowly — ideal for paralleling.' },
            { step: '4', title: 'Start & Watch Synchroscope', desc: 'Click Start to begin the simulation. The synchroscope pointer rotates based on Δf. Wait for the green zone.' },
            { step: '5', title: 'Close Breaker', desc: 'Click "Close Breaker" when the pointer approaches 12 o\'clock. If all checks pass, the breaker closes successfully. If not, the relay BLOCKS.' },
        ].map(item => (
            <div key={item.step} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-lg shrink-0">{item.step}</div>
                <div><h4 className="font-bold">{item.title}</h4><p className="text-sm opacity-70 mt-1">{item.desc}</p></div>
            </div>
        ))}
    </div>
);

// ========================= QUIZ =========================
const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy' | 'medium' | 'expert'>('easy');
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [finished, setFinished] = useState(false);

    const questions = QUIZ_DATA[level];
    const q = questions[current];

    const handleSelect = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        if (idx === q.ans) setScore(prev => prev + 1);
        setTimeout(() => {
            if (current + 1 >= questions.length) setFinished(true);
            else { setCurrent(prev => prev + 1); setSelected(null); }
        }, 1200);
    };

    const resetQuiz = () => { setCurrent(0); setScore(0); setSelected(null); setFinished(false); };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Knowledge Quiz</h2>
                    <p className="text-sm opacity-60">Test your synchronization knowledge</p>
                </div>
            </div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                {(['easy', 'medium', 'expert'] as const).map(l => (
                    <button key={l} onClick={() => { setLevel(l); resetQuiz(); }}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${level === l ? (l === 'easy' ? 'bg-emerald-600 text-white' : l === 'medium' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white') : isDark ? 'bg-slate-900 text-slate-400 hover:bg-slate-800' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        {l}
                    </button>
                ))}
            </div>
            {finished ? (
                <div className={`text-center p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="text-5xl mb-4">{score >= 4 ? '🏆' : score >= 3 ? '✅' : '📚'}</div>
                    <div className="text-3xl font-black mb-2">{score}/{questions.length}</div>
                    <p className="opacity-60 mb-6">{score >= 4 ? 'Excellent!' : score >= 3 ? 'Good work.' : 'Review theory and try again!'}</p>
                    <button onClick={resetQuiz} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm">Retry</button>
                </div>
            ) : (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold opacity-40">Q {current + 1}/{questions.length}</span>
                        <span className="text-xs font-bold text-emerald-500">Score: {score}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">
                        {q.opts.map((opt, i) => (
                            <button key={i} onClick={() => handleSelect(i)}
                                className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all ${selected === null ? isDark ? 'border-slate-700 hover:border-blue-500 hover:bg-blue-900/20' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50' : i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : selected === i ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40'}`}>
                                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ========================= MAIN LAYOUT =========================
export default function SynchrocheckSim() {
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
            <SEO title="Synchrocheck Simulator" description="Interactive synchrocheck relay simulator (ANSI 25) with synchroscope visualization, ΔV/Δf/Δφ monitoring for generator paralleling and line reclosing per IEEE C37.2." url="/synchrocheck" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-purple-500/20"><Gauge className="w-5 h-5" /></div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Synchro<span className="text-purple-500">Check</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Synchronization Relay</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500/80">✅ IEEE C37.2 / IEC 60034</span>
                        </div>
                    </div>
                </div>
                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id ? (isDark ? 'bg-slate-800 text-purple-400 shadow-sm' : 'bg-white text-purple-600 shadow-sm') : 'opacity-60 hover:opacity-100'}`}>
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold ${activeTab === tab.id ? (isDark ? 'text-purple-400' : 'text-purple-600') : 'opacity-50'}`}>
                        {tab.icon} <span>{tab.label}</span>
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <TheoryLibrary title="Synchronization Handbook" description="Theory and standards for synchrocheck relays, generator paralleling, and line reclosing." sections={SYNCHROCHECK_THEORY_CONTENT} />}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}><SimulatorModule isDark={isDark} /></div>
                {activeTab === 'guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
