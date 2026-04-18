import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, 
    Award, TrendingUp, Zap, Activity, Play, AlertTriangle, CheckCircle2, 
    ShieldCheck, Share2, ChevronRight, BarChart3, Clock, Flame, Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { Card } from '../components/UI/Card';
import { Slider } from '../components/UI/Slider';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { PageSEO } from "../components/SEO/PageSEO";
import { usePersistentState } from "../hooks/usePersistentState";
import { useTripFeedback } from "../hooks/useTripFeedback";
import { AICopyButton } from "../components/UI/AICopyButton";
import Odometer from '../components/Odometer';

// ============================== DATA ==============================
const VOLTAGE_REGULATOR_THEORY_CONTENT = [
    { id: 'basics', title: 'OLTC Fundamentals', content: 'An On-Load Tap Changer (OLTC) adjusts the transformer turns ratio while the transformer is energized. It compensates for varying load conditions to keep the output voltage within a specific band without interrupting the load current.' },
    { id: 'deadband', title: 'The Deadband Concept', content: 'The deadband prevents the tap changer from "hunting" (making excessive, continuous changes) due to minor, transient voltage variations. A typical deadband is ±2V to ±3V around the target voltage.' },
    { id: 'ansi', title: 'ANSI C84.1 Standards', content: 'The ANSI C84.1 standard defines acceptable voltage ranges. Range A specifies 120V ± 5% (114V to 126V) for normal service conditions.' },
    { id: 'delay', title: 'Time Delay Integration', content: 'To filter out temporary voltage sags, a time delay is used. The voltage must remain outside the deadband continuously before a tap change command is issued.' }
];

const QUIZ_DATA = {
    easy: [
        { q: "OLTC stands for:", opts: ["Online Transformer Controller", "On-Load Tap Changer", "Offline Test Circuit", "Open-Loop Timer Control"], ans: 1, why: "OLTC (On-Load Tap Changer) adjusts the transformer turns ratio while the transformer is energized." },
        { q: "The deadband in a voltage regulator prevents:", opts: ["Overloading", "Excessive tap hunting", "Short circuits", "Voltage collapse"], ans: 1, why: "The deadband provides a window of acceptable voltage to prevent hunting." },
    ],
    medium: [
        { q: "Line drop compensation (LDC) allows the regulator to:", opts: ["Measure line current", "Maintain voltage at a remote load point", "Reduce losses", "Bypass the tap changer"], ans: 1, why: "LDC regulates voltage to a downstream load center." },
        { q: "A 32-step regulator with ±10% range has step size of:", opts: ["5%", "0.625% per step", "1% per step", "10%"], ans: 1, why: "20% total range ÷ 32 steps = 0.625% per step." }
    ],
    expert: [
        { q: "ANSI C84.1 Range B voltage limits are:", opts: ["Same as Range A", "Wider than Range A (emergency conditions)", "Tighter than Range A", "Not defined"], ans: 1, why: "Range B allows for wider tolerances during rare extreme conditions." }
    ]
};

// ============================== ADVANCED CANVAS ==============================
const VoltageCanvas = ({ isDark, history, target, deadband }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timeRef = useRef(0);
    const animationRef = useRef<number | null>(null);
    
    useEffect(() => {
        const cvs = canvasRef.current; if (!cvs) return;
        const ctx = cvs.getContext('2d'); if (!ctx) return;
        
        let width: number, height: number;
        const margin = { l: 60, r: 20, t: 30, b: 30 };
        const vMin = 110, vMax = 130;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = cvs.getBoundingClientRect();
            width = rect.width; height = rect.height;
            cvs.width = width * dpr; cvs.height = height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            timeRef.current += 0.01;
            ctx.clearRect(0, 0, width, height);
            
            const gw = width - margin.l - margin.r;
            const gh = height - margin.t - margin.b;

            // Grid Lines
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
            ctx.lineWidth = 1;
            for (let v = vMin; v <= vMax; v += 2) {
                const y = margin.t + gh * (1 - (v - vMin) / (vMax - vMin));
                ctx.beginPath(); ctx.moveTo(margin.l, y); ctx.lineTo(width - margin.r, y); ctx.stroke();
                ctx.fillStyle = isDark ? '#475569' : '#94a3b8';
                ctx.font = '10px monospace';
                ctx.fillText(`${v}V`, 10, y + 4);
            }

            // Target Band
            const yHi = margin.t + gh * (1 - (target + deadband - vMin) / (vMax - vMin));
            const yLo = margin.t + gh * (1 - (target - deadband - vMin) / (vMax - vMin));
            ctx.fillStyle = isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)';
            ctx.fillRect(margin.l, yHi, gw, yLo - yHi);
            ctx.strokeStyle = 'rgba(16,185,129,0.3)';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(margin.l, yHi, gw, yLo - yHi);
            ctx.setLineDash([]);

            // ANSI Limits
            const y126 = margin.t + gh * (1 - (126 - vMin) / (vMax - vMin));
            const y114 = margin.t + gh * (1 - (114 - vMin) / (vMax - vMin));
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.beginPath(); ctx.moveTo(margin.l, y126); ctx.lineTo(width - margin.r, y126); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(margin.l, y114); ctx.lineTo(width - margin.r, y114); ctx.stroke();

            // History Line
            if (history.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                history.forEach((p: any, i: number) => {
                    const x = margin.l + (i / (history.length - 1)) * gw;
                    const y = margin.t + gh * (1 - (p.v - vMin) / (vMax - vMin));
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // Live Point
                const lp = history[history.length - 1];
                const lx = margin.l + gw;
                const ly = margin.t + gh * (1 - (lp.v - vMin) / (vMax - vMin));
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isDark, history, target, deadband]);
    
    return (
        <div className="relative w-full h-[360px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute top-4 right-4 flex flex-col gap-2">
               <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Deadband Active
               </div>
            </div>
        </div>
    );
};

// ============================== SIMULATOR MODULE ==============================
const SimulatorModule = ({ 
    isDark, target, setTarget, deadband, setDeadband, timeDelay, setTimeDelay, triggerTrip 
}: any) => {
    const [tapPosition, setTapPosition] = useState(0);
    const [voltage, setVoltage] = useState(120);
    const [history, setHistory] = useState([{ t: 0, v: 120, tap: 0 }]);
    const [running, setRunning] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [elapsed, setElapsed] = useState(0);
    
    const timerRef = useRef<any>(null);
    const delayCounter = useRef(0);

    const start = () => {
        setRunning(true); setElapsed(0); delayCounter.current = 0;
        setHistory([{ t: 0, v: voltage, tap: tapPosition }]);
        setEvents([{ id: Date.now(), time: 0, msg: 'Monitoring sequence initialized.', type: 'info' }]);
    };

    const applyLoad = (delta: number, type: string) => {
        if (!running) return;
        setVoltage(v => Math.max(105, Math.min(135, v + delta)));
        setEvents(prev => [{ id: Date.now(), time: elapsed, msg: `External Disturbance: ${type} (${delta > 0 ? '+' : ''}${delta}V)`, type: 'warn' }, ...prev]);
    };

    useEffect(() => {
        if (!running) return;
        timerRef.current = setInterval(() => {
            setElapsed(p => p + 1);
            setVoltage(v => {
                const noise = (Math.random() - 0.5) * 0.4;
                let newV = v + noise;
                
                if (Math.abs(newV - target) > deadband) {
                    delayCounter.current++;
                    if (delayCounter.current >= timeDelay) {
                        const tapDir = newV < target ? 1 : -1;
                        setTapPosition(p => Math.max(-16, Math.min(16, p + tapDir)));
                        const corrected = newV + tapDir * 0.75; 
                        delayCounter.current = 0;
                        triggerTrip(); // Pulse on tap change
                        setEvents(prev => [{ id: Date.now(), time: elapsed, msg: `Tap ${tapDir > 0 ? 'Raise' : 'Lower'} (Pos ${tapPosition + tapDir})`, type: 'tap' }, ...prev].slice(0, 15));
                        newV = corrected;
                    }
                } else {
                    delayCounter.current = 0;
                }
                
                const boundedV = Math.max(105, Math.min(135, newV));
                setHistory(p => [...p, { t: elapsed, v: boundedV, tap: tapPosition }].slice(-60));
                return boundedV;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [running, target, deadband, timeDelay, tapPosition, elapsed]);

    const reset = () => {
        clearInterval(timerRef.current);
        setRunning(false); setElapsed(0); setTapPosition(0); setVoltage(120);
        setHistory([{ t: 0, v: 120, tap: 0 }]); setEvents([]); delayCounter.current = 0;
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visuals & Controls */}
                <div className="lg:col-span-8 space-y-8">
                    <Card isDark={isDark} noPadding>
                        <div className="p-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-indigo-500" /> Control Matrix (IEEE C57.15)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <Slider label="Target Voltage" unit="V" min={115} max={125} step={1} value={target} onChange={e => setTarget(+e.target.value)} color="blue" disabled={running} />
                                <Slider label="Deadband (±V)" unit="V" min={1} max={5} step={0.5} value={deadband} onChange={e => setDeadband(+e.target.value)} color="blue" disabled={running} />
                                <Slider label="Time Delay" unit="s" min={10} max={60} step={5} value={timeDelay} onChange={e => setTimeDelay(+e.target.value)} color="amber" disabled={running} />
                            </div>
                            <div className="mt-10 pt-8 border-t border-slate-800 flex flex-wrap gap-4">
                                <button onClick={start} disabled={running} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg disabled:opacity-30 transition-all">Initialize Engine</button>
                                <button onClick={() => applyLoad(-6, 'Step Load')} disabled={!running} className="px-6 py-4 bg-slate-800 border border-slate-700 text-red-400 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-red-950/20 transition-all">Inject Drop (-6V)</button>
                                <button onClick={() => applyLoad(+4, 'Rejection')} disabled={!running} className="px-6 py-4 bg-slate-800 border border-slate-700 text-emerald-400 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-emerald-950/20 transition-all">Inject Rise (+4V)</button>
                                <button onClick={reset} className="px-6 py-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-slate-800 transition-all">Emergency Reset</button>
                            </div>
                        </div>
                    </Card>

                    <Card isDark={isDark} noPadding>
                        <div className="p-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" /> Voltage Stabilization Profile
                            </h3>
                            <VoltageCanvas isDark={isDark} history={history} target={target} deadband={deadband} />
                        </div>
                    </Card>
                </div>

                {/* Telemetry & Log */}
                <div className="lg:col-span-4 space-y-8">
                    <Card isDark={isDark} noPadding>
                        <div className="p-8 space-y-10">
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Measured Secondary</div>
                                <Odometer value={voltage} format={v => `${v.toFixed(1)}V`} className="text-5xl font-black text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
                                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Tap Position</div>
                                    <div className={`text-2xl font-black ${tapPosition === 0 ? 'text-slate-500' : 'text-blue-500'}`}>{tapPosition > 0 ? '+' : ''}{tapPosition}</div>
                                </div>
                                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
                                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Delay Logic</div>
                                    <div className="text-2xl font-black text-amber-500">{delayCounter.current}s</div>
                                </div>
                            </div>
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                               <ShieldCheck className="w-6 h-6 text-emerald-500" />
                               <div>
                                  <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Protection Status</div>
                                  <div className="text-[10px] font-black text-white">ANSI 90 REGULATOR ACTIVE</div>
                               </div>
                            </div>
                        </div>
                    </Card>

                    <Card isDark={isDark} noPadding>
                        <div className="p-8 h-[400px] flex flex-col">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" /> Historical Sequence
                            </h3>
                            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                                {events.map(e => (
                                    <div key={e.id} className={`p-4 rounded-xl border text-[10px] font-black leading-relaxed ${e.type === 'tap' ? 'bg-blue-950/20 border-blue-500/30 text-blue-400' : e.type === 'warn' ? 'bg-amber-950/20 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                                        <div className="flex justify-between mb-1 opacity-60"><span>T+{e.time}s</span> <span>{e.type.toUpperCase()}</span></div>
                                        {e.msg}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// ============================== TEXT & GUIDE MODULES ==============================
const TheoryModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white tracking-tighter">On-Load Tap Changing <span className="text-indigo-500">Physics</span></h2>
            <p className="text-adaptive-muted text-lg leading-relaxed max-w-2xl mx-auto">Master the mechanics of dynamic voltage regulation and ANSI C84.1 power quality standards.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {VOLTAGE_REGULATOR_THEORY_CONTENT.map((sec, idx) => (
                <Card key={idx} hover isDark={isDark} className="flex flex-col">
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Module 0{idx + 1}</div>
                    <h3 className="text-xl font-black text-adaptive mb-4">{sec.title}</h3>
                    <p className="text-adaptive-muted text-sm leading-relaxed">{sec.content}</p>
                </Card>
            ))}
        </div>
    </div>
);

// ============================== QUIZ MODULE ==============================
const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy'|'medium'|'expert'>('easy');
    const [cur, setCur] = useState(0);
    const [score, setScore] = useState(0);
    const [sel, setSel] = useState<number | null>(null);
    const [fin, setFin] = useState(false);
    
    const qs = (QUIZ_DATA as any)[level]; 
    const q = qs[cur];
    
    const pick = (i: number) => {
        if (sel !== null) return;
        setSel(i);
        if (i === q.ans) setScore(p => p + 1);
        setTimeout(() => {
            if (cur + 1 >= qs.length) setFin(true);
            else { setCur(p => p + 1); setSel(null); }
        }, 2000);
    };

    return (
        <div className="max-w-3xl mx-auto py-10">
            <Card isDark={isDark}>
                {fin ? (
                    <div className="text-center py-12">
                        <Award className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                        <h3 className="text-4xl font-black text-adaptive mb-2">EXAM COMPLETE</h3>
                        <div className="text-xl font-black text-slate-500 mb-10 uppercase tracking-widest">Final Grade: {Math.round((score/qs.length)*100)}%</div>
                        <button onClick={() => { setCur(0); setScore(0); setSel(null); setFin(false); }} className={`px-10 py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg transition-all ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>Begin New Evaluation</button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        <div className={`flex justify-between items-center p-4 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-inner'}`}>
                           <div className="flex gap-2">
                             {['easy', 'medium', 'expert'].map((l: any) => (
                               <button key={l} onClick={() => { setLevel(l); setCur(0); setScore(0); setSel(null); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${level === l ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300 dark:hover:text-slate-300'}`}>{l}</button>
                             ))}
                           </div>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Question {cur + 1}/{qs.length}</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-adaptive mb-8 leading-tight tracking-tight uppercase">{q.q}</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {q.opts.map((o: string, i: number) => (
                                    <button key={i} onClick={() => pick(i)} disabled={sel !== null}
                                        className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-black text-xs tracking-widest uppercase ${sel === null ? (isDark ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 text-slate-400' : 'bg-white border-slate-200 hover:border-indigo-500 text-slate-600 shadow-sm') : (i === q.ans ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : (sel === i ? 'bg-red-500/20 border-red-500 text-red-500' : (isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100') + ' opacity-30 text-slate-600'))}`}>
                                        {o}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

// ============================== MAIN ENTRY ==============================
export default function VoltageRegulator() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState('simulator');
    
    const [target, setTarget] = usePersistentState('vr_target', 120);
    const [deadband, setDeadband] = usePersistentState('vr_deadband', 2);
    const [timeDelay, setTimeDelay] = usePersistentState('vr_delay', 30);
    const { isTripping, triggerTrip } = useTripFeedback();
    
    const tabs = [
        { id: 'simulator', label: 'SIMULATOR', icon: <MonitorPlay className="w-5 h-5" /> },
        { id: 'theory', label: 'THEORY', icon: <Book className="w-5 h-5" /> },
        { id: 'quiz', label: 'EXAM', icon: <Award className="w-5 h-5" /> }
    ];

    return (
        <div className={`min-h-screen font-sans selection:bg-indigo-500/30 transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
            <PageSEO 
                title="Voltage Regulator Simulator (ANSI 90)"
                description="Professional OLTC and Voltage Regulator simulator. Master deadband logic, time delay integration, and ANSI C84.1 compliance."
                url="/voltageregulator"
            />

            <header className={`h-24 border-b px-10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800 backdrop-blur-xl' : 'bg-white/80 border-slate-200 backdrop-blur-xl shadow-sm'}`}>
                <div className="flex items-center gap-5">
                   <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-[0_0_25px_rgba(79,70,229,0.4)]">
                     <Zap className="w-8 h-8"/>
                   </div>
                    <div>
                     <h1 className="font-black text-3xl tracking-tighter text-adaptive">VOLT<span className="text-indigo-400">REG</span> PRO</h1>
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Grid Stabilization Engine</div>
                   </div>
                </div>

                <nav className={`hidden lg:flex p-1.5 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-inner'}`}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300 dark:hover:text-slate-100'}`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <div className="text-right px-6 border-r border-slate-800 hidden sm:block">
                      <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logic Framework</div>
                      <div className="text-[10px] font-black text-emerald-500">IEEE C57.15</div>
                    </div>
                    <AICopyButton state={{ target, deadband, timeDelay }} toolName="Voltage Regulator / ANSI 90" />
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-10 py-12">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
                        {activeTab === 'theory' && <TheoryModule isDark={isDark}/>}
                        {activeTab === 'simulator' && (
                            <SimulatorModule 
                                isDark={isDark}
                                target={target} setTarget={setTarget}
                                deadband={deadband} setDeadband={setDeadband}
                                timeDelay={timeDelay} setTimeDelay={setTimeDelay}
                                triggerTrip={triggerTrip}
                            />
                        )}
                        {activeTab === 'quiz' && <QuizModule isDark={isDark}/>}
                    </motion.div>
                </AnimatePresence>
            </main>

            <footer className={`h-12 border-t px-10 flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
               <div className="flex items-center gap-10">
                 <span>System: Stabilization Active</span>
                 <span>Telemetry: Lossless Fiber-Optic</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  Secure Real-Time Link
               </div>
            </footer>
        </div>
    );
}