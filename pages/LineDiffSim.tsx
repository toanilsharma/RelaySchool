import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  RotateCcw, BookOpen, Settings, MonitorPlay, 
  Award, Zap, AlertTriangle, Activity, 
  ShieldCheck, Share2, Cable, CheckCircle2,
  XCircle, Info, Cpu, Network, History, Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceDot, Area, AreaChart 
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

const DIFF_SCHEMA = {
  "@type": "WebApplication",
  "name": "DiffPro 87L: Line Differential Simulator",
  "description": "Professional simulator for ANSI 87L power line differential protection. Master dual-slope restraint, KCL, and communication channel delay compensation.",
  "applicationCategory": "EngineeringApplication"
};

const RELAY_MATH = {
  degToRad: (deg: number) => (deg * Math.PI) / 180,
  radToDeg: (rad: number) => (rad * 180) / Math.PI,
  polarToRect: (mag: number, angleDeg: number) => ({
    x: mag * Math.cos(RELAY_MATH.degToRad(angleDeg)),
    y: mag * Math.sin(RELAY_MATH.degToRad(angleDeg))
  }),
  calculateDifferential: (IL: number, IR: number, angleL: number, angleR: number) => {
    const L = RELAY_MATH.polarToRect(IL, angleL);
    const R = RELAY_MATH.polarToRect(IR, angleR);
    const diffX = L.x + R.x, diffY = L.y + R.y;
    const Idiff = Math.sqrt(diffX ** 2 + diffY ** 2);
    const Irestraint = (IL + IR) / 2;
    return { Idiff, Irestraint, diffX, diffY };
  },
  calculateThreshold: (Ir: number, s1: number, s2: number, bp: number, min: number) => {
    let th = (Ir <= bp) ? (s1 / 100) * Ir : ((s1 / 100) * bp + (s2 / 100) * (Ir - bp));
    return Math.max(min, th);
  }
};

const PRESETS = [
    { id: 'normal', icon: '✅', label: 'Normal Load', IL: 500, IR: 500, aL: 0, aR: 180, desc: 'Balanced power flow. I_diff is near zero.' },
    { id: 'internal', icon: '⚡', label: 'Internal Fault', IL: 6000, IR: 4500, aL: -45, aR: -45, desc: 'Fault inside zone. Both ends feed fault. Huge I_diff.' },
    { id: 'ct_sat', icon: '🧲', label: 'CT Saturation', IL: 9000, IR: 6500, aL: -45, aR: 155, desc: 'External fault, but remote CT saturates. Slope 2 restrains!' },
];

const SimulatorModule = ({ 
    isDark, triggerTrip,
    slope1, setSlope1,
    slope2, setSlope2,
    breakpoint, setBreakpoint,
    minPickup, setMinPickup
}: any) => {
    const [IL, setIL] = useState(500);
    const [IR, setIR] = useState(500);
    const [angleL, setAngleL] = useState(0);
    const [angleR, setAngleR] = useState(180);

    const { Idiff, Irestraint } = RELAY_MATH.calculateDifferential(IL, IR, angleL, angleR);
    const threshold = RELAY_MATH.calculateThreshold(Irestraint, slope1, slope2, breakpoint, minPickup);
    const trip = Idiff > threshold;

    useEffect(() => {
        if (trip) triggerTrip();
    }, [trip, triggerTrip]);

    const chartData = useMemo(() => {
        return Array.from({ length: 21 }, (_, i) => {
            const ir = i * 500;
            return { ir, th: RELAY_MATH.calculateThreshold(ir, slope1, slope2, breakpoint, minPickup) };
        });
    }, [slope1, slope2, breakpoint, minPickup]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-full">
                <div className="xl:col-span-8 space-y-4 flex flex-col min-h-0">
                    <Card isDark={isDark} noPadding className="shrink-0">
                        <div className="p-4 lg:p-5">
                            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                <Network className="w-4 h-4 text-cyan-500" /> Network Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                {PRESETS.map(p => (
                                    <button key={p.id} onClick={() => { setIL(p.IL); setIR(p.IR); setAngleL(p.aL); setAngleR(p.aR); }}
                                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left hover:bg-slate-900 transition-all">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-1">{p.label}</div>
                                        <div className="text-[9px] text-slate-600 leading-tight">{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Local Substation (A)</div>
                                    <Slider label="Magnitude" unit="A" min={0} max={10000} step={100} value={IL} onChange={(e) => setIL(Number(e.target.value))} color="blue" />
                                    <Slider label="Phase Angle" unit="°" min={-180} max={180} step={1} value={angleL} onChange={(e) => setAngleL(Number(e.target.value))} color="blue" />
                                </div>
                                <div className="space-y-4">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Remote Substation (B)</div>
                                    <Slider label="Magnitude" unit="A" min={0} max={10000} step={100} value={IR} onChange={(e) => setIR(Number(e.target.value))} color="emerald" />
                                    <Slider label="Phase Angle" unit="°" min={-180} max={180} step={1} value={angleR} onChange={(e) => setAngleR(Number(e.target.value))} color="emerald" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[250px] xl:min-h-0">
                        <Card isDark={isDark} noPadding className="flex flex-col h-full">
                            <div className="p-4 lg:p-5 flex flex-col h-full">
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-3 shrink-0">Characteristic Plane</h3>
                                <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-2 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="tripGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="ir" hide /> <YAxis hide domain={[0, 10000]} />
                                            <Area type="monotone" dataKey="th" stroke="#3b82f6" fill="url(#tripGrad)" strokeWidth={2} isAnimationActive={false}/>
                                            <ReferenceDot x={Irestraint} y={Idiff} r={5} fill={trip ? '#ef4444' : '#10b981'} stroke="#fff" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </Card>
                        <Card isDark={isDark} noPadding className={`border flex flex-col h-full ${trip ? 'border-red-500' : 'border-slate-800'}`}>
                             <div className="p-4 lg:p-5 flex flex-col justify-center h-full space-y-4">
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2 shrink-0">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Relay Assessment
                                </h3>
                                <div className={`p-4 rounded-xl border-2 text-center transition-all ${trip ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/10'}`}>
                                    <div className={`text-xl md:text-2xl font-black ${trip ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {trip ? 'RED: ACTIVE TRIP' : 'GRN: RESTRAIN'}
                                    </div>
                                    <div className="text-[9px] font-black uppercase tracking-widest mt-1 text-slate-500">
                                        Logic Status: {trip ? 'Differential Trigger' : 'Vector Equilibrium'}
                                    </div>
                                </div>
                                <div className="space-y-2 mt-auto">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest"><span className="text-slate-500">Slope 1 Setting</span><span className="text-white">{slope1}%</span></div>
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest"><span className="text-slate-500">Slope 2 Setting</span><span className="text-white">{slope2}%</span></div>
                                </div>
                             </div>
                        </Card>
                    </div>
                </div>

                <div className="xl:col-span-4 flex flex-col gap-4">
                    <Card isDark={isDark} noPadding className="flex-1 min-h-0">
                        <div className="p-4 lg:p-5 h-full flex flex-col justify-between">
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>Diff Current (Id)</span>
                                    {trip && <span className="text-red-500 animate-pulse font-black">OVER THRESHOLD</span>}
                                </div>
                                <Odometer value={Idiff} format={v => `${Math.round(v)}A`} className={`text-6xl font-black ${trip ? 'text-red-500' : 'text-adaptive'}`} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-slate-500">Restraint Current (Ir)</div>
                                <Odometer value={Irestraint} format={v => `${Math.round(v)}A`} className="text-4xl font-black text-cyan-400" />
                            </div>
                            <div className="pt-4 border-t border-slate-800 mt-auto">
                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Relay Sensitivity Tuning</div>
                                <div className="space-y-4">
                                    <Slider label="Slope 1" unit="%" min={10} max={50} step={1} value={slope1} onChange={(e) => setSlope1(Number(e.target.value))} color="amber" />
                                    <Slider label="Slope 2" unit="%" min={50} max={100} step={1} value={slope2} onChange={(e) => setSlope2(Number(e.target.value))} color="amber" />
                                    <Slider label="Breakpoint" unit="A" min={500} max={5000} step={100} value={breakpoint} onChange={(e) => setBreakpoint(Number(e.target.value))} color="blue" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card isDark={isDark} noPadding className="shrink-0">
                        <div className="p-4 lg:p-5">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                <Info className="w-4 h-4 text-orange-500" /> Engineering Note
                            </h3>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10px] font-black text-slate-400 leading-relaxed uppercase tracking-widest">
                                87L protection requires high-speed communication (Sync: PTP/GPS). Differential current arises from internal faults where <LaTeX math="I_{Local} + I_{Remote} \neq 0" />.
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default function LineDiffSim() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState('simulator');
    const { isTripping, triggerTrip } = useTripFeedback();

    const [slope1, setSlope1] = usePersistentState('ld_slope1', 30);
    const [slope2, setSlope2] = usePersistentState('ld_slope2', 70);
    const [breakpoint, setBreakpoint] = usePersistentState('ld_breakpoint', 2500);
    const [minPickup, setMinPickup] = usePersistentState('ld_minpickup', 200);

    return (
        <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-cyan-500/30 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
            <PageSEO title="DiffPro 87L: Line Differential Simulator" description="Industrial line differential protection simulator with dual-slope characteristic and KCL logic." url="/linediffsim" />
            
            <header className={`h-24 backdrop-blur-xl border-b px-10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-5">
                   <div className="bg-cyan-600 p-3 rounded-2xl text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)]"><Cpu className="w-8 h-8"/></div>
                   <div>
                     <h1 className="font-black text-3xl tracking-tighter uppercase leading-none text-adaptive">DIFF<span className="text-cyan-500">PRO</span> 87L</h1>
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">IEEE C37.243 | Phase Differential</div>
                   </div>
                </div>

                <nav className={`hidden lg:flex p-1.5 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-inner'}`}>
                    {['simulator', 'theory', 'lab'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t ? 'bg-cyan-600 text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-300 dark:hover:text-slate-300'}`}>
                            {t}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <AICopyButton state={{ slope1, slope2, breakpoint, minPickup }} toolName="Line Differential / ANSI 87L" />
                    <button className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 group"><Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
                </div>
            </header>

            <main className="w-full mx-auto p-4 lg:p-6 h-[calc(100vh-6rem)] overflow-y-auto overflow-x-clip max-w-[100vw]">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
                        {activeTab === 'simulator' && (
                            <div className="h-full">
                                <SimulatorModule 
                                    isDark={isDark} 
                                    triggerTrip={triggerTrip}
                                    slope1={slope1} setSlope1={setSlope1}
                                    slope2={slope2} setSlope2={setSlope2}
                                    breakpoint={breakpoint} setBreakpoint={setBreakpoint}
                                    minPickup={minPickup} setMinPickup={setMinPickup}
                                />
                            </div>
                        )}
                        {activeTab !== 'simulator' && <div className="text-center py-20 font-black text-slate-500 uppercase tracking-widest">RelaySchool Advanced Engineering Lab Module</div>}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}