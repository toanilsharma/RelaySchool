import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    RotateCcw, Book, MonitorPlay, GraduationCap, 
    Award, Zap, AlertTriangle, Activity, 
    ShieldCheck, Share2, Settings, PlayCircle, 
    CheckCircle2, Info, Timer, History, Gauge, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { Card } from '../components/UI/Card';
import { Slider } from '../components/UI/Slider';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { LaTeX } from '../components/UI/LaTeX';
import { PageSEO } from '../components/SEO/PageSEO';
import { usePersistentState } from "../hooks/usePersistentState";
import { useTripFeedback } from "../hooks/useTripFeedback";
import { AICopyButton } from "../components/UI/AICopyButton";
import Odometer from '../components/Odometer';

const BF_SCHEMA = {
    "@type": "WebApplication",
    "name": "BFGuard PRO: Breaker Failure Simulator",
    "description": "Interactive IEEE C37.119 compliant breaker failure protection simulator. Analyze BFI, retrip logic, and DC subsidence.",
    "applicationCategory": "EngineeringApplication"
};

const SCENARIOS = {
    normal: {
        id: 'normal', name: 'Normal Clearing', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500"/>,
        duration: 300,
        timeline: [
            { t: 0, m: "Fault occurs. Primary BFI issued.", why: "Current detector picks up. Timers start." },
            { t: 50, m: "Primary breaker (CB1) opens.", why: "Arc extinguished. Current drops to zero." },
            { t: 65, m: "Current detector resets.", why: "Sequence aborted at 65ms < 150ms BF timer." }
        ]
    },
    bf_trip: {
        id: 'bf_trip', name: 'Breaker Failure (Trip)', icon: <AlertTriangle className="w-4 h-4 text-red-500"/>,
        duration: 400,
        timeline: [
            { t: 0, m: "Primary BFI issued. Mechanism jammed.", why: "CB1 fails to open. Current continues." },
            { t: 150, m: "50BF TIMER EXPIRES.", why: "Current confirmed. Issuing BACKUP TRIP." },
            { t: 200, m: "Bus cleared via backup breakers.", why: "Fault isolated by adjacent breakers." }
        ]
    }
};

const generateSimData = (sid: string, bf: number, rt: number) => {
    const data = [];
    let cb1 = false, cbB = false;
    let bfi = 1, retrip = 0, bft = 0, cd = 1;

    for (let t = 0; t <= 400; t += 2) {
        if (sid === 'normal' && t >= 50) cb1 = true;
        if (sid === 'bf_trip' && t >= 200) cbB = true;

        if (t >= rt && !cb1) retrip = 1;
        if (t >= bf && !cb1) bft = 1;

        const i = (cb1 || cbB) ? 0 : 5000 * Math.sin(0.4 * t) + 2000 * Math.exp(-t/50);
        cd = Math.abs(i) > 500 ? 1 : 0;

        data.push({ time: t, current: i, cd, bfi, retrip, bft, cb1, cbB });
    }
    return data;
};

const SimulatorModule = ({ 
    isDark, triggerTrip,
    bfTimer, setBfTimer,
    retripTimer, setRetripTimer,
    sid, setSid
}: any) => {
    const [currentT, setCurrentT] = useState(0);
    const [playing, setPlaying] = useState(false);

    const simData = useMemo(() => generateSimData(sid, bfTimer, retripTimer), [sid, bfTimer, retripTimer]);
    const frame = useMemo(() => simData.find(d => d.time >= currentT) || simData[0], [simData, currentT]);

    useEffect(() => {
        let req: any;
        if (playing) {
            let start = performance.now();
            const animate = (time: number) => {
                const elapsed = (time - start) * 0.5;
                if (elapsed >= 400) { 
                    setPlaying(false); 
                    setCurrentT(400); 
                    if (frame.bft) triggerTrip();
                }
                else { setCurrentT(elapsed); req = requestAnimationFrame(animate); }
            };
            req = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(req);
    }, [playing, frame.bft, triggerTrip]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    <Card isDark={isDark} noPadding>
                        <div className="p-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-red-500" /> 50BF Simulation Engine
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                                {Object.values(SCENARIOS).map(s => (
                                    <button key={s.id} onClick={() => { setSid(s.id); setCurrentT(0); }}
                                        className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${sid === s.id ? 'bg-red-600 border-red-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900'}`}>
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4 mb-8">
                                <button onClick={() => { setCurrentT(0); setPlaying(true); }} disabled={playing} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg disabled:opacity-30">
                                    Execute Sequence
                                </button>
                                <button onClick={() => { setPlaying(false); setCurrentT(0); }} className="px-8 py-4 bg-slate-900 text-slate-400 border border-slate-800 rounded-2xl font-black text-xs tracking-widest uppercase">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="h-64 bg-slate-950 rounded-2xl border border-slate-800 p-2 overflow-hidden shadow-inner relative">
                                <div className="absolute top-4 left-4 z-10 text-[9px] font-black tracking-widest text-slate-600">Transient Oscilloscope</div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={simData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="time" hide domain={[0,400]} />
                                        <YAxis hide domain={[-8000, 8000]} />
                                        <ReferenceLine x={currentT} stroke="#ef4444" strokeWidth={2} />
                                        <Line type="monotone" dataKey="current" stroke="#3b82f6" dot={false} strokeWidth={2} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card isDark={isDark} noPadding>
                            <div className="p-8">
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6">Relay Logic Trace</h3>
                                <div className="space-y-4">
                                    {[
                                        { l: 'BFI (Device Trip)', v: frame.bfi, c: 'text-white' },
                                        { l: '50 (Current Det)', v: frame.cd, c: frame.cd ? 'text-amber-500' : 'text-slate-600' },
                                        { l: 'Retrip Timer', v: frame.retrip, c: frame.retrip ? 'text-purple-400' : 'text-slate-600' },
                                        { l: '50BF TRIP', v: frame.bft, c: frame.bft ? 'text-red-500' : 'text-slate-600' }
                                    ].map(z => (
                                        <div key={z.l} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{z.l}</span>
                                            <div className={`w-3 h-3 rounded-full ${z.v ? z.c.replace('text-', 'bg-') : 'bg-slate-800'}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                        <Card isDark={isDark} noPadding className={`border ${frame.bft ? 'border-red-500 animate-pulse' : 'border-slate-800'}`}>
                            <div className="p-8 space-y-8">
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">System Integrity</h3>
                                <div className="text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
                                    <div className={`text-4xl font-black tracking-tighter ${frame.bft ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {frame.bft ? 'BF TRIP' : 'HEALTHY'}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 leading-none">
                                        Substation Zone Status
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">BF Coordinator Time</div>
                                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(currentT/bfTimer)*100}%` }} />
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
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fault Current (I)</div>
                                <Odometer value={frame.current} format={v => `${Math.abs(Math.round(v))}A`} className={`text-6xl font-black ${Math.abs(frame.current) > 500 ? 'text-red-500' : 'text-white'}`} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Relay Sequence Time</div>
                                <Odometer value={currentT} format={v => `${Math.round(v)}ms`} className="text-4xl font-black text-amber-500" />
                            </div>
                            <div className="pt-4 border-t border-slate-800 space-y-6">
                                <Slider label="BF Timer (62BF)" unit="ms" min={100} max={300} step={10} value={bfTimer} onChange={(e) => setBfTimer(Number(e.target.value))} color="red" />
                                <Slider label="Retrip Timer" unit="ms" min={40} max={100} step={10} value={retripTimer} onChange={(e) => setRetripTimer(Number(e.target.value))} color="amber" />
                            </div>
                        </div>
                    </Card>

                    <Card isDark={isDark} noPadding>
                        <div className="p-8 h-[250px] flex flex-col">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><History className="w-4 h-4 text-orange-500" /> Timeline Analysis</h3>
                            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                                {SCENARIOS[sid as keyof typeof SCENARIOS].timeline.map((e,i) => (
                                    <div key={i} className={`text-[10px] font-black leading-tight border-l-2 pl-3 py-1 ${currentT >= e.t ? 'border-indigo-500 text-slate-300' : 'border-slate-800 text-slate-700'}`}>
                                        <span className="text-[8px] opacity-40 block">{e.t}ms</span>{e.m}
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
export default function BreakerFailure() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState('simulator');
    const { isTripping, triggerTrip } = useTripFeedback();

    const [bfTimer, setBfTimer] = usePersistentState('bf_timer', 150);
    const [retripTimer, setRetripTimer] = usePersistentState('bf_retrip', 60);
    const [sid, setSid] = usePersistentState('bf_scenario', 'normal');

    return (
        <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-red-500/30 max-w-[100vw] overflow-x-clip md:overflow-visible ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
            <PageSEO title="BFGuard PRO: Breaker Failure Protection" description="Industrial IEEE C37.119 simulator. Analyze breaker failure timing, retrip logic, and fault clearing sequences." url="/breakerfailure" />
            
            <header className={`h-24 border-b px-10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800 backdrop-blur-xl' : 'bg-white/80 border-slate-200 backdrop-blur-xl shadow-sm'}`}>
                <div className="flex items-center gap-5">
                   <div className="bg-red-600 p-3 rounded-2xl text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] md:block hidden text-slate-950"><Timer className="w-8 h-8"/></div>
                   <div>
                     <h1 className="font-black text-3xl tracking-tighter uppercase leading-none text-adaptive">BF<span className="text-red-600">GUARD</span> PRO</h1>
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">IEEE C37.119 Timing Core</div>
                   </div>
                </div>

                <nav className={`hidden lg:flex p-1.5 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {['simulator', 'theory', 'lab'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300 dark:hover:text-slate-300'}`}>
                            {t}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <AICopyButton state={{ bfTimer, retripTimer, sid }} toolName="Breaker Failure / ANSI 50BF" />
                    <button className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400"><Share2 className="w-5 h-5" /></button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-10 py-12 pb-32 md:pb-12">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        {activeTab === 'simulator' && (
                            <SimulatorModule 
                                isDark={isDark} 
                                triggerTrip={triggerTrip}
                                bfTimer={bfTimer} setBfTimer={setBfTimer}
                                retripTimer={retripTimer} setRetripTimer={setRetripTimer}
                                sid={sid} setSid={setSid}
                            />
                        )}
                        {activeTab !== 'simulator' && <div className="text-center py-20 font-black text-slate-500 uppercase tracking-widest">RelaySchool Mission Critical Systems Lab Loading...</div>}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile Nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50 flex justify-around items-center px-6">
                {['simulator', 'theory', 'lab'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === t ? 'text-red-500' : 'text-slate-600'}`}>
                        <div className="text-[10px] font-black uppercase tracking-widest">{t[0]}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}