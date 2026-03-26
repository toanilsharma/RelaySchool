import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, RotateCcw, Activity, Book, Settings, MonitorPlay,
  ShieldCheck, Award, Power, CheckCircle2, XCircle,
  Zap, AlertTriangle, Cpu, Network, BookOpen, ChevronRight,
  TrendingUp, Gauge, History, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { Card } from '../components/UI/Card';
import { Slider } from '../components/UI/Slider';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { LaTeX } from '../components/UI/LaTeX';
import { PageSEO } from '../components/SEO/PageSEO';
import Odometer from '../components/Odometer';

const SYNC_SCHEMA = {
  "@type": "WebApplication",
  "name": "SynchroMaster 25: Industrial Synchrocheck Simulator",
  "description": "Professional simulator for ANSI 25 synchronizing relays. Master advance angle, slip frequency, and IEEE C50.13 compliance.",
  "applicationCategory": "EngineeringApplication"
};

const SCENARIOS = [
  { id: 'gen_parallel', label: 'Gen Parallel (C50.13)', dvMax: 5, dfMax: 0.067, daMax: 10, desc: "Strict limits for turbo-generators (±10°)." },
  { id: 'line_reclose', label: 'Line Reclose (C37.104)', dvMax: 10, dfMax: 0.200, daMax: 20, desc: "Wider limits for transmission ties." },
];

const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [busV, setBusV] = useState(1.0);
    const [genV, setGenV] = useState(1.02);
    const [busF, setBusF] = useState(50.0);
    const [genF, setGenF] = useState(50.04);
    const [bt, setBt] = useState(80);
    const [scenario, setScenario] = useState(SCENARIOS[0]);
    const [angle, setAngle] = useState(0);
    const [running, setRunning] = useState(false);
    const [status, setStatus] = useState('OPEN');
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const angleRef = useRef(0);
    const lastTimeRef = useRef(0);

    const deltaV = Math.abs((busV - genV) / busV * 100);
    const slip = genF - busF;
    const advance = (slip * 360) * (bt / 1000);
    
    const dvOk = deltaV <= scenario.dvMax;
    const dfOk = Math.abs(slip) <= scenario.dfMax;
    const daOk = Math.abs(angle) <= scenario.daMax;

    useEffect(() => {
        if (!running || status === 'CLOSED') return;
        const loop = (t: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = t;
            const dt = (t - lastTimeRef.current) / 1000;
            lastTimeRef.current = t;
            angleRef.current = (angleRef.current + slip * 360 * dt) % 360;
            let disp = angleRef.current;
            if (disp > 180) disp -= 360;
            if (disp < -180) disp += 360;
            setAngle(disp);
            requestAnimationFrame(loop);
        };
        const id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, [running, slip, status]);

    useEffect(() => {
        const c = canvasRef.current; if (!c) return;
        const ctx = c.getContext('2d'); if (!ctx) return;
        const cx = 150, cy = 150, r = 130;
        ctx.clearRect(0,0,300,300);
        
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 4; ctx.stroke();
        
        // Target Zone
        ctx.strokeStyle = 'rgba(16,185,129,0.2)'; ctx.lineWidth = 15;
        const sRad = (scenario.daMax * Math.PI) / 180;
        ctx.beginPath(); ctx.arc(cx,cy,r-10, -Math.PI/2 - sRad, -Math.PI/2 + sRad); ctx.stroke();

        // Pointer
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate((angle - 90) * Math.PI/180);
        ctx.strokeStyle = status === 'CLOSED' ? '#10b981' : (dvOk && dfOk ? '#fff' : '#ef4444');
        ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(r-20, 0); ctx.stroke();
        ctx.restore();
    }, [angle, status, dvOk, dfOk, scenario]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    <Card isDark={isDark} noPadding>
                        <div className="p-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                                <Network className="w-4 h-4 text-purple-500" /> Synchronization Matrix
                            </h3>
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {SCENARIOS.map(s => (
                                    <button key={s.id} onClick={() => setScenario(s)}
                                        className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${scenario.id === s.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                                <div className="relative">
                                    <canvas ref={canvasRef} width={300} height={300} className="rounded-full shadow-2xl" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Angle</div>
                                        <div className="text-2xl font-black text-white">{Math.round(angle)}°</div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-6 w-full">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-2xl border ${dvOk ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                            <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Delta V</div>
                                            <div className={`text-xl font-black ${dvOk ? 'text-emerald-500' : 'text-red-500'}`}>{deltaV.toFixed(1)}%</div>
                                        </div>
                                        <div className={`p-4 rounded-2xl border ${dfOk ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                            <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Slip Freq</div>
                                            <div className={`text-xl font-black ${dfOk ? 'text-emerald-500' : 'text-red-500'}`}>{slip.toFixed(3)}Hz</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setRunning(!running)} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all ${running ? 'bg-red-600 text-white' : 'bg-purple-600 text-white'}`}>
                                        {running ? 'Halt Generator' : 'Energize Generator'}
                                    </button>
                                    <button disabled={!running || status !== 'OPEN'} onClick={() => { setStatus('CLOSED'); setRunning(false); }}
                                        className="w-full py-5 bg-slate-900 border border-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 disabled:opacity-20 transition-all">
                                        Issue Close Cmd
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card isDark={isDark} noPadding>
                            <div className="p-8">
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Advance Analysis</h3>
                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>Advance Angle</span><span className="text-white">{advance.toFixed(2)}°</span></div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>Breaker Closure Time</span><span className="text-white">{bt}ms</span></div>
                                    <div className="pt-4 border-t border-slate-900">
                                        <LaTeX math="Advance = 360 \times \Delta f \times T_{breaker}" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card isDark={isDark} noPadding className={`border ${status === 'CLOSED' ? 'border-emerald-500 animate-pulse' : 'border-slate-800'}`}>
                            <div className="p-8 space-y-8 text-center flex flex-col justify-center h-full">
                                <div className={`text-5xl font-black tracking-tighter ${status === 'CLOSED' ? 'text-emerald-500' : 'text-slate-700'}`}>
                                    {status}
                                </div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ANSI 25 Breaker Continuity</div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card isDark={isDark} noPadding>
                        <div className="p-8 space-y-10">
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Live Slip Speed</div>
                                <Odometer value={slip} format={v => `${v.toFixed(3)} Hz`} className="text-6xl font-black text-purple-400" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Gen Voltage</div>
                                <Odometer value={genV} format={v => `${v.toFixed(2)} pu`} className="text-4xl font-black text-white" />
                            </div>
                            <div className="pt-4 border-t border-slate-800 space-y-6">
                                <Slider label="Generator Freq" unit="Hz" min={49} max={51} step={0.01} value={genF} onChange={setGenF} color="purple" />
                                <Slider label="Generator Volt" unit="pu" min={0.8} max={1.2} step={0.01} value={genV} onChange={setGenV} color="purple" />
                                <Slider label="Breaker Time" unit="ms" min={40} max={150} step={5} value={bt} onChange={setBt} color="slate" />
                            </div>
                        </div>
                    </Card>

                    <Card isDark={isDark} noPadding>
                        <div className="p-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Info className="w-4 h-4 text-orange-500"/> Engineering Cap</h3>
                            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-[10px] font-black text-slate-500 leading-relaxed uppercase tracking-widest">
                                High Δθ during closure causes shaft torque transients proportional to <LaTeX math="\sin(\Delta \theta)" />. Synchronizing ±180° out of phase is equivalent to a dead short circuit.
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default function SynchrocheckSim() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState('simulator');

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
            <PageSEO title="SynchroMaster 25: ANSI 25 Simulator" description="Industrial synchrocheck simulator. Master advance angle and IEEE C50.13 compliance." url="/synchrocheck" />
            
            <header className="h-24 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-10 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-5">
                   <div className="bg-purple-600 p-3 rounded-2xl text-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.4)]"><ShieldCheck className="w-8 h-8"/></div>
                   <div>
                     <h1 className="font-black text-3xl tracking-tighter uppercase leading-none">SYNCHRO<span className="text-purple-500">MASTER</span> 25</h1>
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">IEEE Standard Synchrocheck</div>
                   </div>
                </div>

                <nav className="hidden lg:flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                    {['simulator', 'theory', 'lab'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-500'}`}>
                            {t}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <button className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400"><Gauge className="w-5 h-5" /></button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-10 py-12 pb-32">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        {activeTab === 'simulator' && <SimulatorModule isDark={isDark} />}
                        {activeTab !== 'simulator' && <div className="text-center py-20 font-black text-slate-500 uppercase tracking-widest">RelaySchool Grid Interconnection Lab Loading...</div>}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}