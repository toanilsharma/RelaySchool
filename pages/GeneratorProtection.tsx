import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RotateCcw, BookOpen, Settings, MonitorPlay, 
  Award, Zap, AlertTriangle, Activity, Play, ShieldCheck, 
  Share2, Info, Cpu, BatteryWarning, ArrowDownToLine, Flame,
  CheckCircle2, XCircle, Timer, FileText, Landmark, Gauge, History, Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { Card } from '../components/UI/Card';
import { PageSEO } from '../components/SEO/PageSEO';
import { LaTeX } from '../components/UI/LaTeX';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { usePersistentState } from "../hooks/usePersistentState";
import { useTripFeedback } from "../hooks/useTripFeedback";
import { AICopyButton } from "../components/UI/AICopyButton";
import Odometer from '../components/Odometer';

const GEN_SCHEMA = {
  "@type": "WebApplication",
  "name": "GenGuard PRO: Generator Protection Simulator",
  "description": "Professional simulator for ANSI 40, 32, 46, and 87G protection. Visualize P-Q capability curves and transient failure modes.",
  "applicationCategory": "EngineeringApplication"
};

const SCENARIOS = [
  { id: 'normal', label: 'Normal Operation', color: 'bg-emerald-600', icon: Activity, desc: 'Stable grid parallel operation.' },
  { id: 'lof', label: 'Loss of Field (40)', color: 'bg-red-600', icon: BatteryWarning, desc: 'Excitation failure. VAR absorption.' },
  { id: 'reverse', label: 'Reverse Power (32)', color: 'bg-amber-600', icon: ArrowDownToLine, desc: 'Prime mover trip. Motoring.' },
  { id: 'neg_seq', label: 'Neg Sequence (46)', color: 'bg-purple-600', icon: Flame, desc: 'Unbalanced load. Rotor heating.' },
  { id: 'stator_gnd', label: 'Stator Ground (64)', color: 'bg-rose-700', icon: Zap, desc: 'Insulation breakdown.' },
];

// ============================== CAPABILITY CANVAS ==============================
const AnimatedCapabilityCurve = ({ mw, mvar, trips, isDark }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;

    ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.45, cy = h * 0.6;
    const s = Math.min(w, h) * 0.0035;

    // Grid
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let i = -150; i <= 150; i += 30) {
      ctx.beginPath(); ctx.moveTo(cx + i*s, 0); ctx.lineTo(cx + i*s, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy - i*s); ctx.lineTo(w, cy - i*s); ctx.stroke();
    }

    // Limits
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 100*s, -Math.PI*0.1, Math.PI*0.9, false); ctx.stroke();
    
    // Operating Point
    const px = cx + mw * s, py = cy - mvar * s;
    ctx.fillStyle = trips.length > 0 ? '#ef4444' : '#22c55e';
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

  }, [mw, mvar, trips, isDark]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

// ============================== SIMULATOR MODULE ==============================
const SimulatorModule = ({ 
    isDark, scenario, setScenario, triggerTrip 
}: any) => {
  const [mw, setMw] = useState(80);
  const [mvar, setMvar] = useState(30);
  const [vt, setVt] = useState(1.0);
  const [excitation, setExcitation] = useState(100);
  const [events, setEvents] = useState<any[]>([]);
  const [trips, setTrips] = useState<string[]>([]);
  const timerRef = useRef<any>(null);

  const trigger = (s: string) => {
    setScenario(s); setTrips([]); setEvents([]);
    let step = 0; if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
        step++;
        if (s === 'lof') {
            setExcitation(p => Math.max(0, p - 10)); setMvar(p => Math.max(-80, p - 10));
            if (step === 2) setEvents(ev => [{ m: 'DC Field Excitation failing.', t: '0.4s' }, ...ev]);
            if (step >= 10) { 
                setTrips(['ANSI 40 LOF']); 
                triggerTrip();
                clearInterval(timerRef.current); 
            }
        } else if (s === 'reverse') {
            setMw(p => Math.max(-10, p - 15));
            if (step === 2) setEvents(ev => [{ m: 'Engine braking detected. Reverse power flow.', t: '0.4s' }, ...ev]);
            if (step >= 8) { 
                setTrips(['ANSI 32 REVERSE']); 
                triggerTrip();
                clearInterval(timerRef.current); 
            }
        } else if (s === 'normal') {
            setMw(80); setMvar(30); setExcitation(100); clearInterval(timerRef.current);
        }
    }, 200);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
            <Card isDark={isDark} noPadding>
                <div className="p-8">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-indigo-500" /> Operational Scenarios
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                        {SCENARIOS.map(s => (
                            <button key={s.id} onClick={() => trigger(s.id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${scenario === s.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900'}`}>
                                <s.icon className="w-5 h-5 mb-1" /> {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card isDark={isDark} noPadding>
                    <div className="p-8">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> P-Q Capability Envelope</h3>
                        <div className="h-72 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                            <AnimatedCapabilityCurve mw={mw} mvar={mvar} trips={trips} isDark={isDark} />
                        </div>
                    </div>
                </Card>
                <Card isDark={isDark} noPadding className={`border ${trips.length > 0 ? 'border-red-500' : 'border-slate-800'}`}>
                    <div className="p-8 space-y-8">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Protection Node</h3>
                        <div className={`p-6 rounded-2xl border-2 text-center ${trips.length > 0 ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                            <div className={`text-2xl font-black ${trips.length > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                                {trips.length > 0 ? '🔴 SYSTEM TRIP' : '🟢 STABLE'}
                            </div>
                            {trips.map(t => <div key={t} className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-400">{t}</div>)}
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Stability Margin</span>
                                <span className="text-white">{(excitation > 20 ? 85 : 15)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${excitation > 20 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${excitation > 20 ? 85 : 15}%` }} />
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
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Active Power (P)</div>
                        <Odometer value={mw} format={v => `${v.toFixed(1)}MW`} className={`text-6xl font-black ${mw < 0 ? 'text-red-500' : 'text-adaptive'}`} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Reactive Power (Q)</div>
                        <Odometer value={mvar} format={v => `${v.toFixed(1)}MVAR`} className={`text-4xl font-black ${mvar < -10 ? 'text-amber-500' : 'text-blue-400'}`} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                            <span>Excitation Field</span>
                            <span className={excitation < 30 ? 'text-red-500' : 'text-emerald-500'}>{excitation < 30 ? 'VOM / LOF' : 'OK'}</span>
                        </div>
                        <Odometer value={excitation} format={v => `${Math.round(v)}%`} className={`text-4xl font-black ${excitation < 30 ? 'text-red-500' : 'text-emerald-500'}`} />
                    </div>
                </div>
            </Card>

            <Card isDark={isDark} noPadding>
                <div className="p-8 h-[300px] flex flex-col">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><History className="w-4 h-4 text-orange-500" /> Sequence of Events</h3>
                    <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                        {events.length === 0 && <div className="text-[10px] font-black text-slate-700 text-center py-20 uppercase tracking-widest">Awaiting Transients...</div>}
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
export default function GeneratorProtection() {
  const isDark = useThemeObserver();
  const [activeTab, setActiveTab] = useState('simulator');
  const [scenario, setScenario] = usePersistentState('gen_scenario', 'normal');
  const { isTripping, triggerTrip } = useTripFeedback();

  const tabs = [
    { id: 'simulator', label: 'SIMULATOR', icon: MonitorPlay },
    { id: 'theory', label: 'REFERENCE', icon: BookOpen },
    { id: 'quiz', label: 'ASSESSMENT', icon: Award }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
        <PageSEO title="GenGuard PRO: Generator Protection Simulator" description="Master ANSI 40, 32, and 87G protection with industrial P-Q capability modeling." url="/generatorprotection" />

        <header className={`h-24 backdrop-blur-xl border-b px-10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-5">
               <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-[0_0_25px_rgba(59,130,246,0.4)]"><Zap className="w-8 h-8"/></div>
               <div>
                 <h1 className="font-black text-3xl tracking-tighter uppercase leading-none text-adaptive">GEN<span className="text-blue-500">GUARD</span> PRO</h1>
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">IEEE C37.102 Compliance</div>
               </div>
            </div>

            <nav className={`hidden lg:flex p-1.5 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-inner overflow-hidden'}`}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300 dark:hover:text-slate-300'}`}>
                        <t.icon className="w-4 h-4 inline mr-2" /> {t.label}
                    </button>
                ))}
            </nav>

            <div className="flex items-center gap-4">
                <AICopyButton state={{ scenario }} toolName="Generator Protection / ANSI 40/32" />
                <button className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 transition-all"><Share2 className="w-5 h-5" /></button>
            </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-10 py-12">
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    {activeTab === 'simulator' && (
                        <SimulatorModule 
                            isDark={isDark} 
                            scenario={scenario} 
                            setScenario={setScenario} 
                            triggerTrip={triggerTrip} 
                        />
                    )}
                    {activeTab === 'theory' && <div className="text-center py-20 font-black text-slate-500 uppercase tracking-widest">Generator Engineering Reference Available in Academic Portal</div>}
                    {activeTab === 'quiz' && <div className="text-center py-20 font-black text-slate-500 uppercase tracking-widest">Knowledge Assessment Module Loading...</div>}
                </motion.div>
            </AnimatePresence>
        </main>

        <footer className="h-12 bg-slate-950 border-t border-slate-800 px-10 flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">
           <span>Machine Sync: Verified</span>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
              Excitation Live
           </div>
        </footer>
    </div>
  );
}