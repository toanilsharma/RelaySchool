import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    RotateCcw, HelpCircle, Book, AlertTriangle, Settings,
    MonitorPlay, GraduationCap, Award, Zap, Activity,
    Timer, TrendingUp, Play, ShieldCheck, Share2, History, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { useSmoothedValues } from '../hooks/useSmoothedValues';
import { Card } from '../components/UI/Card';
import { Slider } from '../components/UI/Slider';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { PageSEO } from "../components/SEO/PageSEO";
import { usePersistentState } from "../hooks/usePersistentState";
import { useTripFeedback } from "../hooks/useTripFeedback";
import { AICopyButton } from "../components/UI/AICopyButton";
import Odometer from '../components/Odometer';

const MOTOR_SCHEMA = {
    "@type": "WebApplication",
    "name": "MachineGuard PRO: Motor Protection Simulator",
    "description": "Interactive simulator for ANSI 49/50/66 motor protection. Visualize thermal replica models, safe stall times, and locked rotor conditions.",
    "applicationCategory": "EngineeringApplication"
};

const QUIZ_DATA = {
    easy: [
        { q: "ANSI 49 designates:", opts: ["Overcurrent", "Thermal overload", "Ground fault", "Differential"], ans: 1, why: "49 = Machine thermal protection. It uses a mathematical thermal replica model to track winding temperature." },
        { q: "A locked rotor typically draws:", opts: ["0.5× FLA", "1× FLA", "5-8× FLA", "20× FLA"], ans: 2, why: "A locked rotor draws starting current (5-8× FLA) without cooling benefits, causing rapid damage." }
    ],
    medium: [
        { q: "Phase unbalance causes motor damage because:", opts: ["Lower output", "Negative sequence creates 2× freq rotor currents", "Higher voltage", "CT saturation"], ans: 1, why: "Unbalanced supply creates negative-sequence fields inducing 2× frequency currents in the rotor." }
    ]
};

// ============================== THERMAL CANVAS ==============================
const ThermalCanvas = ({ isDark, thermalPct, currentMult, speed, tripped }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothed = useSmoothedValues({ thermalPct, currentMult, speed });

    useEffect(() => {
        const cvs = canvasRef.current; if (!cvs) return;
        const ctx = cvs.getContext('2d'); if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = cvs.getBoundingClientRect();
        cvs.width = rect.width * dpr; cvs.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const w = rect.width, h = rect.height;

        ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
        ctx.fillRect(0, 0, w, h);

        // Core motor drawing (simplified circular)
        const cx = w / 2, cy = h / 2;
        const r = Math.min(w, h) / 3;

        // Outer Stator
        ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

        // Thermal Glow
        const glowR = r * (smoothed.thermalPct / 100);
        if (glowR > 0) {
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, smoothed.thermalPct > 80 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.2)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        }

        // Inner Rotor (Rotating)
        ctx.save();
        ctx.translate(cx, cy);
        if (speed > 0) ctx.rotate((Date.now() / 1000) * (speed / 20));
        ctx.fillStyle = isDark ? '#334155' : '#94a3b8';
        ctx.fillRect(-r*0.6, -5, r*1.2, 10);
        ctx.fillRect(-5, -r*0.6, 10, r*1.2);
        ctx.restore();

        if (tripped) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🔴 PHASE OPEN / TRIP', cx, cy + r + 25);
        }
    }, [isDark, smoothed, tripped, speed]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ 
    isDark, triggerTrip 
}: any) => {
    const [thermalPct, setThermalPct] = useState(15);
    const [currentMult, setCurrentMult] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [running, setRunning] = useState(false);
    const [locked, setLocked] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [tripped, setTripped] = useState(false);
    const [events, setEvents] = useState<any[]>([]);

    const stateRef = useRef({ running, locked, tripped, currentMult, speed, thermalPct });

    useEffect(() => {
        stateRef.current = { running, locked, tripped, currentMult, speed, thermalPct };
    }, [running, locked, tripped, currentMult, speed, thermalPct]);

    const startMotor = () => {
        if (running || tripped) return;
        setRunning(true); setLocked(false); setElapsed(0); setTripped(false);
        setCurrentMult(6.5); setSpeed(0);
        setEvents([{ t: '0.0s', m: 'Motor START sequence initiated (ANSI 50/51/49).', type: 'info' }]);
    };

    const reset = () => {
        setRunning(false); setLocked(false); setElapsed(0); setTripped(false);
        setThermalPct(15); setCurrentMult(0); setSpeed(0); setEvents([]);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const { running: r, locked: l, tripped: t, speed: s, currentMult: c, thermalPct: tp } = stateRef.current;
            if (r && !t) setElapsed(p => p + 0.2);

            if (r && !t) {
                if (!l) {
                    setSpeed(p => Math.min(100, p + 4));
                    setCurrentMult(p => Math.max(1.0, p - 0.22));
                } else {
                    setSpeed(0); setCurrentMult(6.5);
                }
            } else {
                setSpeed(p => Math.max(0, p - 5)); setCurrentMult(0);
            }

            setThermalPct(p => {
                let I = (!r || t) ? 0 : c;
                const target = Math.pow(I / 1.05, 2) * 100;
                const tau = (target > p) ? 400 : (s > 50 ? 600 : 1200);
                return Math.max(0, Math.min(120, target + (p - target) * Math.exp(-0.2 / tau)));
            });
        }, 200);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (thermalPct >= 100 && !tripped) {
            setTripped(true); setRunning(false);
            triggerTrip();
            setEvents(prev => [{ t: elapsed.toFixed(1) + 's', m: '49 THERMAL TRIP: Limit reached.', type: 'trip' }, ...prev]);
        }
    }, [thermalPct, tripped, running, elapsed, triggerTrip]);

    const statusBorder = tripped ? 'border-red-500' : running ? 'border-indigo-500' : 'border-slate-800';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    <Card isDark={isDark} noPadding>
                        <div className="p-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-indigo-500" /> Motor Control Station
                            </h3>
                            <div className="flex flex-wrap gap-4 mb-8">
                                <button onClick={startMotor} disabled={running || tripped} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg disabled:opacity-30 transition-all">
                                    <Play className="w-4 h-4 inline mr-2" /> Start Drive
                                </button>
                                <button onClick={() => setLocked(true)} disabled={!running || locked || tripped} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg disabled:opacity-30 transition-all">
                                    <AlertTriangle className="w-4 h-4 inline mr-2" /> Simulate Stall
                                </button>
                                <button onClick={reset} className="px-8 py-4 bg-slate-900 text-slate-400 border border-slate-800 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-slate-800 transition-all">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card isDark={isDark} noPadding>
                             <div className="p-8">
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6">Thermal Distribution</h3>
                                <div className="h-64 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                                    <ThermalCanvas isDark={isDark} thermalPct={thermalPct} currentMult={currentMult} speed={speed} tripped={tripped} />
                                </div>
                             </div>
                        </Card>
                        <Card isDark={isDark} noPadding className={`border ${statusBorder}`}>
                             <div className="p-8 space-y-8">
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Protection Insight</h3>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active State</div>
                                    <div className={`text-2xl font-black tracking-tighter ${tripped ? 'text-red-500' : 'text-white'}`}>
                                        {tripped ? 'LOCKOUT / TRIP' : running ? (speed < 95 ? 'ACCELERATING' : 'FULL SPEED') : 'OFFLINE'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cooling Thermal Constant (τ)</div>
                                    <div className="grid grid-cols-5 gap-1 h-2">
                                        {[...Array(5)].map((_,i) => <div key={i} className={`rounded-full ${i < (thermalPct/20) ? (thermalPct > 80 ? 'bg-red-500' : 'bg-indigo-500') : 'bg-slate-800'}`}></div>)}
                                    </div>
                                </div>
                             </div>
                        </Card>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card isDark={isDark} noPadding>
                        <div className="p-8 space-y-10">
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Phase Current (FLA)</div>
                                <Odometer value={currentMult} format={v => `${v.toFixed(1)}x`} className={`text-6xl font-black ${currentMult > 1.1 ? 'text-red-500' : 'text-adaptive'}`} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rotor Angular Speed</div>
                                <Odometer value={speed} format={v => `${Math.round(v)}%`} className="text-4xl font-black text-indigo-400" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Thermal Capacity Used</div>
                                <Odometer value={thermalPct} format={v => `${Math.round(v)}%`} className={`text-4xl font-black ${thermalPct > 80 ? 'text-red-500' : 'text-emerald-500'}`} />
                            </div>
                        </div>
                    </Card>

                    <Card isDark={isDark} noPadding>
                        <div className="p-8 h-[250px] flex flex-col">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                <History className="w-4 h-4 text-orange-500" /> Protection Events
                            </h3>
                            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                                {events.map((e,i) => (
                                    <div key={i} className="text-[10px] font-black leading-tight border-l-2 border-indigo-500 pl-3 py-1 text-slate-400">
                                        <span className="text-[8px] opacity-40 block">{e.t}</span>{e.m}
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

// ============================== MAIN ==============================
export default function MotorProtection() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState('simulator');
    const { isTripping, triggerTrip } = useTripFeedback();

    return (
        <div className={`min-h-screen transition-colors duration-500 font-sans ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
            <PageSEO title="MotorGuard PRO: Protection Simulator" description="Master ANSI 49/50/66 motor protection with precision thermal replica models." url="/motorprotection" />
            
            <header className={`h-24 border-b px-10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'border-slate-800 bg-slate-950/90 backdrop-blur-xl' : 'border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm'}`}>
                <div className="flex items-center gap-5">
                   <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]"><Zap className="w-8 h-8"/></div>
                   <div>
                     <h1 className="font-black text-3xl tracking-tighter uppercase leading-none text-adaptive">MOTOR<span className="text-orange-500">GUARD</span> PRO</h1>
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">IEEE Machine Protection Core</div>
                   </div>
                </div>

                <nav className={`hidden lg:flex p-1.5 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {['simulator', 'theory', 'quiz'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                            {t}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <AICopyButton state={{ activeTab }} toolName="Motor Protection / ANSI 49" />
                    <button className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400"><Share2 className="w-5 h-5" /></button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-10 py-12">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        {activeTab === 'simulator' && <SimulatorModule isDark={isDark} triggerTrip={triggerTrip} />}
                        {activeTab === 'theory' && <div className="text-center py-20 font-black text-slate-500">Theory Library Available in Documentation</div>}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}