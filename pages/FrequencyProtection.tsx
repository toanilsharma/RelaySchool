import React, { useState, useEffect, useRef } from 'react';
import {
    Play, RotateCcw, AlertCircle, CheckCircle2, Activity, Zap,
    HelpCircle, Book, AlertTriangle, Settings, MonitorPlay, GraduationCap,
    Award, BarChart3, TrendingUp, Power, Minus, Plus
, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import Slider from '../components/Slider';
import TheoryLibrary from '../components/TheoryLibrary';
import { FREQUENCY_PROTECTION_THEORY_CONTENT } from '../data/learning-modules/frequency-protection';
import SEO from "../components/SEO";

// ========================= CONSTANTS =========================
const UFLS_STAGES = [
    { id: 1, threshold: 49.0, delay: 0.3, loadPercent: 10, label: 'Stage 1', color: '#f59e0b' },
    { id: 2, threshold: 48.7, delay: 0.3, loadPercent: 10, label: 'Stage 2', color: '#f59e0b' },
    { id: 3, threshold: 48.4, delay: 0.3, loadPercent: 15, label: 'Stage 3', color: '#ef4444' },
    { id: 4, threshold: 48.0, delay: 0.3, loadPercent: 10, label: 'Stage 4', color: '#ef4444' },
    { id: 5, threshold: 47.5, delay: 0.1, loadPercent: 5, label: 'Stage 5', color: '#dc2626' },
];

const QUIZ_DATA = {
    easy: [
        { q: "When system load exceeds generation, frequency:", opts: ["Rises", "Drops", "Stays the same", "Oscillates"], ans: 1 },
        { q: "What ANSI code designates frequency protection?", opts: ["50", "67", "81", "87"], ans: 2 },
        { q: "UFLS stands for:", opts: ["Under-Frequency Load Shedding", "Ultra-Fast Line Switching", "Under-Frequency Loss of Supply", "Unified Frequency Logic System"], ans: 0 },
        { q: "The normal frequency in a 50Hz system is:", opts: ["48 Hz", "50 Hz", "55 Hz", "60 Hz"], ans: 1 },
        { q: "ROCOF measures:", opts: ["Voltage change rate", "Frequency change rate", "Current change rate", "Power change rate"], ans: 1 },
    ],
    medium: [
        { q: "Per IEEE C37.117, total UFLS capacity should be at least:", opts: ["20%", "35%", "50%", "75%"], ans: 2 },
        { q: "ROCOF is primarily used for:", opts: ["Fault detection", "Islanding detection", "CT saturation", "Harmonic measurement"], ans: 1 },
        { q: "In a 50Hz system, UFLS Stage 1 typically trips at:", opts: ["50.5 Hz", "49.0 Hz", "47.0 Hz", "45.0 Hz"], ans: 1 },
        { q: "Low system inertia (e.g., high solar penetration) causes:", opts: ["Slower frequency decay", "Faster frequency decay (higher ROCOF)", "No change", "Higher voltage"], ans: 1 },
        { q: "Frequency protection time delay prevents:", opts: ["CT saturation", "Nuisance trips from transient frequency dips", "Voltage sags", "Harmonic resonance"], ans: 1 },
    ],
    expert: [
        { q: "The swing equation relates df/dt to:", opts: ["V/I ratio", "Power imbalance and inertia constant H", "Transformer turns ratio", "CT burden"], ans: 1 },
        { q: "NERC PRC-006 addresses:", opts: ["Overcurrent coordination", "Automatic UFLS requirements", "Distance protection", "Transformer protection"], ans: 1 },
        { q: "With increasing renewable penetration, the main concern for frequency stability is:", opts: ["Higher harmonics", "Reduced system inertia", "CT saturation", "Voltage regulation"], ans: 1 },
        { q: "An islanded system with 60% renewable generation and 40% load deficit will experience:", opts: ["Frequency rise", "Rapid frequency decline", "Stable operation", "Voltage swell"], ans: 1 },
        { q: "Over-frequency protection (81O) is critical for:", opts: ["Motor protection", "Generator speed control failure / load rejection", "Cable overheating", "Busbar faults"], ans: 1 },
    ],
};

// ========================= SIMULATOR =========================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [running, setRunning] = useState(false);
    const [frequency, setFrequency] = useState(50.0);
    const [rocof, setRocof] = useState(0);
    const [genLoss, setGenLoss] = useState(20); // % of generation lost
    const [inertia, setInertia] = useState(5); // seconds
    const [trippedStages, setTrippedStages] = useState<number[]>([]);
    const [totalShed, setTotalShed] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [freqHistory, setFreqHistory] = useState<{ t: number; f: number }[]>([]);
    const [events, setEvents] = useState<string[]>([]);
    const [stageTimers, setStageTimers] = useState<Record<number, number>>({});

    const timerRef = useRef<any>(null);
    const freqRef = useRef(50.0);
    const shedRef = useRef(0);
    const trippedRef = useRef<number[]>([]);
    const stageTimerRef = useRef<Record<number, number>>({});

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setRunning(false);
        setFrequency(50.0);
        setRocof(0);
        setTrippedStages([]);
        setTotalShed(0);
        setElapsed(0);
        setFreqHistory([]);
        setEvents([]);
        setStageTimers({});
        freqRef.current = 50.0;
        shedRef.current = 0;
        trippedRef.current = [];
        stageTimerRef.current = {};
    };

    const start = () => {
        reset();
        setRunning(true);
        const dt = 0.05; // 50ms tick
        let t = 0;

        timerRef.current = setInterval(() => {
            t += dt;
            const powerDeficit = genLoss - shedRef.current;
            const currentRocof = powerDeficit > 0 ? -(powerDeficit / 100) * (50 / (2 * inertia)) : 0;
            freqRef.current += currentRocof * dt;

            // Clamp
            if (freqRef.current < 45) freqRef.current = 45;
            if (freqRef.current > 52) freqRef.current = 52;

            // Check UFLS stages
            UFLS_STAGES.forEach(stage => {
                if (trippedRef.current.includes(stage.id)) return;
                if (freqRef.current <= stage.threshold) {
                    // Start or increment timer for this stage
                    const currentTimer = (stageTimerRef.current[stage.id] || 0) + dt;
                    stageTimerRef.current[stage.id] = currentTimer;

                    if (currentTimer >= stage.delay) {
                        trippedRef.current = [...trippedRef.current, stage.id];
                        shedRef.current += stage.loadPercent;
                        setTrippedStages([...trippedRef.current]);
                        setTotalShed(shedRef.current);
                        setEvents(prev => [`[${t.toFixed(1)}s] ${stage.label} TRIPPED at ${freqRef.current.toFixed(2)} Hz — Shed ${stage.loadPercent}%`, ...prev].slice(0, 20));
                    }
                    setStageTimers({ ...stageTimerRef.current });
                }
            });

            setFrequency(freqRef.current);
            setRocof(currentRocof);
            setElapsed(t);
            setFreqHistory(prev => [...prev, { t: parseFloat(t.toFixed(2)), f: parseFloat(freqRef.current.toFixed(2)) }].slice(-200));

            // Stop if stabilized or collapsed
            if (freqRef.current <= 45 || (Math.abs(currentRocof) < 0.001 && t > 2)) {
                clearInterval(timerRef.current);
                setRunning(false);
                if (freqRef.current <= 45) {
                    setEvents(prev => [`[${t.toFixed(1)}s] ⚠️ SYSTEM COLLAPSE — Frequency below 45 Hz`, ...prev]);
                } else {
                    setEvents(prev => [`[${t.toFixed(1)}s] ✅ Frequency STABILIZED at ${freqRef.current.toFixed(2)} Hz`, ...prev]);
                }
            }
        }, 50);
    };

    // Canvas for frequency chart
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        const w = cvs.width, h = cvs.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, w, h);

        // Grid
        const fMin = 46, fMax = 51;
        const tMax = Math.max(10, elapsed + 2);
        const xScale = w / tMax;
        const yScale = h / (fMax - fMin);
        const getX = (t: number) => t * xScale;
        const getY = (f: number) => h - (f - fMin) * yScale;

        // Horizontal gridlines
        ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.lineWidth = 0.5;
        for (let f = fMin; f <= fMax; f += 0.5) {
            ctx.beginPath(); ctx.moveTo(0, getY(f)); ctx.lineTo(w, getY(f)); ctx.stroke();
        }

        // UFLS threshold lines
        UFLS_STAGES.forEach(stage => {
            ctx.strokeStyle = stage.color + '60';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(0, getY(stage.threshold)); ctx.lineTo(w, getY(stage.threshold)); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = stage.color;
            ctx.font = '10px sans-serif';
            ctx.fillText(`${stage.label} (${stage.threshold} Hz)`, 4, getY(stage.threshold) - 3);
        });

        // Nominal line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 3]);
        ctx.beginPath(); ctx.moveTo(0, getY(50)); ctx.lineTo(w, getY(50)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#10b981';
        ctx.fillText('50.0 Hz (Nominal)', 4, getY(50) - 3);

        // Freq plot
        if (freqHistory.length > 1) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            freqHistory.forEach((pt, i) => {
                const x = getX(pt.t), y = getY(pt.f);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }

        // Axes labels
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('Time (s)', w / 2 - 20, h - 4);
    }, [freqHistory, elapsed, isDark]);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Controls */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500" /> Disturbance Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Slider 
                        label="Generation Loss" 
                        unit="%" 
                        min={5} 
                        max={60} 
                        step={5} 
                        value={genLoss} 
                        onChange={e => setGenLoss(parseInt(e.target.value))} 
                        color="red" 
                        disabled={running}
                    />
                    <Slider 
                        label="System Inertia H" 
                        unit="s" 
                        min={1} 
                        max={10} 
                        step={0.5} 
                        value={inertia} 
                        onChange={e => setInertia(parseFloat(e.target.value))} 
                        color="blue" 
                        disabled={running}
                    />
                    <div className="flex items-end gap-3 pb-6">
                        <button onClick={start} disabled={running}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-all shadow-lg shadow-red-500/20">
                            <Zap className="w-4 h-4" /> Trip Generator
                        </button>
                        <button onClick={reset}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Frequency Chart */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500" /> Frequency vs Time</h3>
                <canvas ref={canvasRef} width={700} height={250} className="w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Gauges */}
                <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" /> Live Readings</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="opacity-60">Frequency</span>
                            <span className={`font-bold font-mono text-xl ${frequency >= 49.5 ? 'text-emerald-500' : frequency >= 48.0 ? 'text-amber-500' : 'text-red-500'}`}>{frequency.toFixed(2)} Hz</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="opacity-60">ROCOF (df/dt)</span>
                            <span className={`font-bold font-mono ${Math.abs(rocof) > 1 ? 'text-red-500' : 'text-amber-500'}`}>{rocof.toFixed(3)} Hz/s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="opacity-60">Elapsed Time</span>
                            <span className="font-mono">{elapsed.toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="opacity-60">Total Load Shed</span>
                            <span className="font-bold text-amber-500">{totalShed}%</span>
                        </div>
                    </div>

                    {/* UFLS Stage Status */}
                    <h4 className="font-bold mt-6 mb-3 text-sm">UFLS Stage Status</h4>
                    <div className="space-y-2">
                        {UFLS_STAGES.map(stage => {
                            const tripped = trippedStages.includes(stage.id);
                            return (
                                <div key={stage.id} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${tripped ? 'border-red-500/30 bg-red-500/5' : isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="flex items-center gap-2">
                                        {tripped ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                        <span className="font-bold">{stage.label}</span>
                                        <span className="opacity-50">({stage.threshold} Hz)</span>
                                    </div>
                                    <span className={`font-bold ${tripped ? 'text-red-500' : 'text-emerald-500'}`}>{tripped ? `TRIPPED (−${stage.loadPercent}%)` : 'ARMED'}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Event Log */}
                <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Event Log</h3>
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                        {events.length === 0 && <p className="text-sm opacity-40 italic">No events yet. Trip a generator to begin.</p>}
                        <AnimatePresence>
                            {events.map((e, i) => (
                            <motion.div 
                                key={e + i}
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 6 }}
                                className={`text-xs font-mono p-2.5 rounded-lg ${e.includes('TRIPPED') ? 'bg-red-500/10 border border-red-500/20' : e.includes('STABILIZED') ? 'bg-emerald-500/10 border border-emerald-500/20' : e.includes('COLLAPSE') ? 'bg-red-500/20 border border-red-500/30' : 'bg-slate-800/50'}`}>
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

// ========================= GUIDE =========================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div>
            <div><h2 className="text-2xl font-black text-slate-900 dark:text-white">User Guide</h2><p className="text-sm opacity-60">Frequency & Load Shedding Simulator</p></div>
        </div>
        {[
            { step: '1', title: 'Set Generation Loss', desc: 'Use the slider to set the percentage of generation that is suddenly lost (5-60%). Higher values simulate larger disturbances like losing a major power plant.' },
            { step: '2', title: 'Set System Inertia', desc: 'Low inertia (1-3s) represents grids with high renewable penetration (fast frequency decay). High inertia (6-10s) represents thermal-heavy grids (slow decay).' },
            { step: '3', title: 'Trip Generator', desc: 'Click "Trip Generator" to simulate the sudden loss of generation. Watch the frequency decline in real-time on the chart.' },
            { step: '4', title: 'Observe UFLS Action', desc: 'As frequency drops through each threshold, UFLS stages trip automatically after their delay time, shedding load to arrest the decline.' },
            { step: '5', title: 'Analyze Results', desc: 'If enough load is shed, frequency stabilizes. If not, the system collapses. Try different inertia and loss combinations to understand the dynamics.' },
        ].map(item => (
            <div key={item.step} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0">{item.step}</div>
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
    const questions = QUIZ_DATA[level]; const q = questions[current];
    const handleSelect = (idx: number) => { if (selected !== null) return; setSelected(idx); if (idx === q.ans) setScore(prev => prev + 1); setTimeout(() => { if (current + 1 >= questions.length) setFinished(true); else { setCurrent(prev => prev + 1); setSelected(null); } }, 1200); };
    const resetQuiz = () => { setCurrent(0); setScore(0); setSelected(null); setFinished(false); };
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div><div><h2 className="text-2xl font-black text-slate-900 dark:text-white">Knowledge Quiz</h2><p className="text-sm opacity-60">Frequency protection</p></div></div>
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
export default function FrequencyProtection() {
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
            <SEO title="Frequency & Load Shedding (81)" description="Interactive under-frequency load shedding (UFLS) simulator with multi-stage trip logic, ROCOF visualization, and IEEE C37.117 compliance for frequency protection." url="/frequency" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-red-600 to-orange-600 p-2 rounded-lg text-white shadow-lg shadow-red-500/20"><Activity className="w-5 h-5" /></div>
                    <div><h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Freq<span className="text-red-500">Guard</span></h1>
                    <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold uppercase tracking-widest opacity-50">UFLS / OFLS Simulator</span><span className="w-1 h-1 bg-slate-400 rounded-full opacity-50" /><span className="text-[10px] font-bold uppercase tracking-widest text-red-500/80">✅ IEEE C37.117 / IEC 60255-181</span></div></div>
                </div>
                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id ? (isDark ? 'bg-slate-800 text-red-400 shadow-sm' : 'bg-white text-red-600 shadow-sm') : 'opacity-60 hover:opacity-100'}`}>{tab.icon} <span>{tab.label}</span></button>))}
                </div>
                <div />
            <button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button></header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold ${activeTab === tab.id ? (isDark ? 'text-red-400' : 'text-red-600') : 'opacity-50'}`}>{tab.icon} <span>{tab.label}</span></button>))}
            </div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <TheoryLibrary title="Frequency Protection Handbook" description="Under-frequency load shedding, ROCOF, and frequency stability in modern power systems." sections={FREQUENCY_PROTECTION_THEORY_CONTENT} />}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}><SimulatorModule isDark={isDark} /></div>
                {activeTab === 'guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
