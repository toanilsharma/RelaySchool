import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    RotateCcw, Book, MonitorPlay, GraduationCap, 
    Award, Layers, Zap, AlertTriangle, Activity, 
    ShieldCheck, Share2, Settings, Power, Maximize2, 
    PlayCircle, CheckCircle2, Info, ArrowRight, X, Shield, Sliders, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { Card } from '../components/UI/Card';
import { Slider } from '../components/UI/Slider';
import { LaTeX } from '../components/UI/LaTeX';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { PageSEO } from "../components/SEO/PageSEO";
import { usePersistentState } from "../hooks/usePersistentState";
import { useTripFeedback } from "../hooks/useTripFeedback";
import { AICopyButton } from "../components/UI/AICopyButton";
import Odometer from '../components/Odometer';

// ============================== ENGINEERING STANDARDS ==============================
const IEEE_STANDARDS = {
    slope1: 0.3,
    slope2: 0.7,
    breakpoint: 2000,
    minOp: 200
};

const SCENARIOS = {
    normal: {
        id: 'normal',
        name: 'Steady State (Normal)',
        icon: <Activity className="w-4 h-4 text-emerald-500"/>,
        steps: [{ state: 'NORMAL', duration: 0, what: "System operating under normal load.", why: "KCL is balanced. I_diff ≈ 0A." }]
    },
    internal: {
        id: 'internal',
        name: 'Solid Internal Fault',
        icon: <Zap className="w-4 h-4 text-red-500"/>,
        steps: [
            { state: 'NORMAL', duration: 1500, what: "Normal load.", why: "Pre-fault steady state." },
            { state: 'INTERNAL', duration: 1000, what: "Solid busbar fault.", why: "All sources feed into the fault. I_diff spikes." },
            { state: 'TRIPPED', duration: 0, what: "Relay trips all breakers.", why: "Bypassed characteristic curve instantly." }
        ]
    },
    external: {
        id: 'external',
        name: 'External Through-Fault',
        icon: <ShieldCheck className="w-4 h-4 text-amber-500"/>,
        steps: [
            { state: 'NORMAL', duration: 1500, what: "Normal load.", why: "Pre-fault state." },
            { state: 'EXTERNAL', duration: 3000, what: "Fault on Feeder 2.", why: "Massive through-current. KCL balanced." },
            { state: 'EXTERNAL_CLEARED', duration: 0, what: "Downstream clearance.", why: "Relay successfully restrained." }
        ]
    },
    saturation: {
        id: 'saturation',
        name: 'External Fault + CT Saturation',
        icon: <AlertTriangle className="w-4 h-4 text-orange-500"/>,
        steps: [
            { state: 'NORMAL', duration: 1500, what: "Normal load.", why: "Pre-fault state." },
            { state: 'SATURATION', duration: 2500, what: "Feeder 2 CT saturates.", why: "False differential created, but Slope 2 restrains." },
            { state: 'EXTERNAL_CLEARED', duration: 0, what: "Fault cleared.", why: "Security proven." }
        ]
    }
};

const generateCharacteristic = () => {
    const data = [];
    for (let ir = 0; ir <= 10000; ir += 100) {
        let iop = IEEE_STANDARDS.minOp;
        if (ir > 500 && ir <= IEEE_STANDARDS.breakpoint) {
            iop = Math.max(IEEE_STANDARDS.minOp, ir * IEEE_STANDARDS.slope1);
        } else if (ir > IEEE_STANDARDS.breakpoint) {
            iop = (IEEE_STANDARDS.breakpoint * IEEE_STANDARDS.slope1) + ((ir - IEEE_STANDARDS.breakpoint) * IEEE_STANDARDS.slope2);
        }
        data.push({ ir, opThreshold: iop });
    }
    return data;
};

// ============================== SLD CANVAS ==============================
const SLDCanvas = ({ state, currentData, isDark }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

        const colors = {
            bus: (state === 'INTERNAL' || state === 'TRIPPED') ? '#ef4444' : '#3b82f6',
            text: isDark ? '#94a3b8' : '#475569'
        };

        // Zone Rectangle
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(w * 0.1, h * 0.2, w * 0.8, h * 0.6);
        ctx.setLineDash([]);

        // Main Bus
        ctx.fillStyle = colors.bus;
        ctx.fillRect(w * 0.2, h / 2 - 3, w * 0.6, 6);

        // Simple Feeders
        const drawF = (x: number, label: string) => {
            ctx.strokeStyle = colors.text;
            ctx.beginPath(); ctx.moveTo(x, h/2); ctx.lineTo(x, h/2 - 40); ctx.stroke();
            ctx.fillStyle = state === 'TRIPPED' ? '#22c55e' : '#ef4444';
            ctx.fillRect(x - 5, h/2 - 25, 10, 10);
            ctx.fillStyle = colors.text;
            ctx.font = '8px monospace';
            ctx.fillText(label, x - 10, h/2 - 45);
        };
        drawF(w * 0.3, 'INC1');
        drawF(w * 0.5, 'INC2');
        drawF(w * 0.7, 'LOAD');

        if (state === 'INTERNAL') {
            ctx.fillStyle = '#ef4444';
            ctx.font = '24px sans-serif';
            ctx.fillText('⚡', w/2 - 12, h/2 + 10);
        }
    }, [state, currentData, isDark]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

// ============================== SIMULATOR MODULE ==============================
const SimulatorModule = ({ 
    isDark, activeScenarioId, setActiveScenarioId, triggerTrip 
}: any) => {
    const [stepIdx, setStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const scenario: any = (SCENARIOS as any)[activeScenarioId];
    const currentStep = scenario.steps[stepIdx];
    const simState = currentStep.state;

    const currentData = useMemo(() => {
        switch(simState) {
            case 'NORMAL': return { i1: 800, i2: 600, load: 1400 };
            case 'EXTERNAL': return { i1: 4000, i2: 3000, load: 7000 };
            case 'SATURATION': return { i1: 4000, i2: 3000, load: 4000 };
            case 'INTERNAL': return { i1: 5000, i2: 4500, load: 0 };
            case 'TRIPPED': return { i1: 0, i2: 0, load: 0 };
            default: return { i1: 0, i2: 0, load: 0 };
        }
    }, [simState]);

    const i_diff = Math.abs(currentData.i1 + currentData.i2 - currentData.load);
    const i_res = currentData.i1 + currentData.i2 + currentData.load;
    const charData = useMemo(() => generateCharacteristic(), []);

    useEffect(() => {
        if (isPlaying && stepIdx < scenario.steps.length - 1) {
            const timer = setTimeout(() => {
                const nextStep = stepIdx + 1;
                setStepIdx(nextStep);
                if (scenario.steps[nextStep].state === 'INTERNAL') {
                    triggerTrip();
                }
            }, scenario.steps[stepIdx].duration);
            return () => clearTimeout(timer);
        } else if (isPlaying && stepIdx === scenario.steps.length - 1) {
            setIsPlaying(false);
        }
    }, [isPlaying, stepIdx, scenario.steps]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Controls & Narrative */}
                <div className="lg:col-span-8 space-y-6">
                    <Card isDark={isDark} noPadding>
                        <div className="p-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-indigo-500" /> Scenario Matrix (ANSI 87B)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {Object.values(SCENARIOS).map((sc: any) => (
                                    <button key={sc.id} onClick={() => { setActiveScenarioId(sc.id); setStepIdx(0); setIsPlaying(false); }}
                                        className={`flex items-center gap-2 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeScenarioId === sc.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900'}`}>
                                        {sc.icon} {sc.name}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => { setStepIdx(0); setIsPlaying(true); }} disabled={isPlaying}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg disabled:opacity-30 transition-all">
                                {isPlaying ? 'Executing sequence...' : 'Execute Full Simulation'}
                            </button>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Card isDark={isDark} noPadding>
                            <div className="p-8">
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-blue-500" /> Physical Bus Array
                                </h3>
                                <div className="h-64 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                                    <SLDCanvas state={simState} currentData={currentData} isDark={isDark} />
                                </div>
                            </div>
                         </Card>
                         <Card isDark={isDark} noPadding>
                            <div className="p-8">
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-red-500" /> Differential Slope
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={charData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="ir" type="number" stroke="#475569" fontSize={8} domain={[0, 10000]} />
                                            <YAxis stroke="#475569" fontSize={8} domain={[0, 5000]} />
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <Area type="stepAfter" dataKey="opThreshold" stroke="#ef4444" fill="#ef444422" isAnimationActive={false} />
                                            <ReferenceLine x={i_res} stroke="#f59e0b" strokeDasharray="3 3" />
                                            <ReferenceLine y={i_diff} stroke="#f59e0b" strokeDasharray="3 3" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                         </Card>
                    </div>
                </div>

                {/* Right: Telemetry & Log */}
                <div className="lg:col-span-4 space-y-6">
                    <Card isDark={isDark} noPadding>
                        <div className="p-8 space-y-10">
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>Diff Current (Iop)</span>
                                    <span className={i_diff > 200 ? 'text-red-500' : 'text-emerald-500'}>{i_diff > 200 ? 'OPERATE' : 'RESTRAIN'}</span>
                                </div>
                                <Odometer value={i_diff} format={v => `${Math.round(v)}A`} className={`text-5xl font-black ${i_diff > 200 ? 'text-red-500' : 'text-white'}`} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Restraint Current (Ires)</div>
                                <Odometer value={i_res} format={v => `${Math.round(v)}A`} className="text-3xl font-black text-blue-500" />
                            </div>
                            <div className="pt-8 border-t border-slate-800">
                                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Narrative Insight</div>
                                   <p className="text-[10px] font-medium leading-relaxed text-slate-400 italic">"{currentStep.why}"</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card isDark={isDark} noPadding>
                        <div className="p-8 h-[300px] flex flex-col">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                <History className="w-4 h-4 text-blue-500" /> Sequence of Events
                            </h3>
                            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                                <div className={`p-4 rounded-xl border text-[10px] font-black leading-relaxed bg-slate-900 border-slate-800 text-slate-400`}>
                                    <div className="flex justify-between mb-1 opacity-60"><span>STEP IN PROGRESS</span></div>
                                    {currentStep.what}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// ============================== THEORY & QUIZ ==============================
const TheoryModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white tracking-tighter">Busbar Differential <span className="text-indigo-500">Principles</span></h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">Mastering Kirchhoff's Current Law and High-Security Dual-Slope protection.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card isDark={isDark}>
                <h3 className="text-xl font-black text-indigo-400 mb-6 flex items-center gap-2">
                    <Zap className="w-6 h-6" /> KCL Mathematics
                </h3>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 mb-6">
                    <LaTeX math="I_{diff} = |\sum I_{in} - \sum I_{out}|" />
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">Under normal load or external faults, the sum is balanced. An internal fault causes a massive vector imbalance.</p>
            </Card>
            <Card isDark={isDark} hover className="flex-1">
                <h3 className="text-xl font-black mb-4 flex items-center gap-3 text-adaptive">
                    <Shield className="w-6 h-6" /> Slope Security
                </h3>
                <p className="text-sm text-adaptive-muted leading-relaxed font-medium">Slope 2 (typically 60-80%) accounts for CT saturation. It prevents false trips during heavy through-faults by requiring a larger Idiff to operate.</p>
            </Card>
        </div>
    </div>
);

// ============================== MAIN APP ==============================
export default function BusbarProtection() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState('simulator');
    const [activeScenarioId, setActiveScenarioId] = usePersistentState('bb_scenario', 'normal');
    const { isTripping, triggerTrip } = useTripFeedback();

    const tabs = [
        { id: 'simulator', label: 'SIMULATOR', icon: <MonitorPlay className="w-5 h-5" /> },
        { id: 'theory', label: 'THEORY', icon: <Book className="w-5 h-5" /> },
        { id: 'quiz', label: 'QUIZ', icon: <Award className="w-5 h-5" /> }
    ];

    return (
        <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 overflow-x-hidden ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
            <PageSEO 
                title="Busbar Protection Simulator (ANSI 87B)"
                description="Professional busbar differential simulator. Master high-impedance and low-impedance 87B logic and CT saturation security."
                url="/busbarprotection"
            />

            <header className={`h-24 backdrop-blur-xl border-b px-10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-5">
                   <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-[0_0_25px_rgba(79,70,229,0.4)]">
                     <Layers className="w-8 h-8"/>
                   </div>
                   <div>
                     <h1 className="font-black text-3xl tracking-tighter uppercase leading-none text-adaptive">BUS<span className="text-indigo-400">GUARD</span> PRO</h1>
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">IEEE Scenario Engine</div>
                   </div>
                </div>

                <nav className="hidden lg:flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <div className="text-right px-6 border-r border-slate-800 hidden sm:block">
                      <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logic Hub</div>
                      <div className="text-[10px] font-black text-emerald-500">IEEE C37.234</div>
                    </div>
                    <AICopyButton state={{ activeScenarioId }} toolName="Busbar Protection / ANSI 87B" />
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-10 py-12">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        {activeTab === 'simulator' && (
                            <SimulatorModule 
                                isDark={isDark} 
                                activeScenarioId={activeScenarioId} 
                                setActiveScenarioId={setActiveScenarioId}
                                triggerTrip={triggerTrip}
                            />
                        )}
                        {activeTab === 'theory' && <TheoryModule isDark={isDark} />}
                        {activeTab === 'quiz' && <div className="text-center py-20 font-black text-slate-500 uppercase tracking-widest">Assessment Module Loading...</div>}
                    </motion.div>
                </AnimatePresence>
            </main>

            <footer className="h-12 bg-slate-950 border-t border-slate-800 px-10 flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">
               <span>BusZone Integrity: Verified</span>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                  Telemetry Active
               </div>
            </footer>
        </div>
    );
}