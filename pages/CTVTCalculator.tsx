import React, { useState, useEffect, useMemo } from 'react';
import { 
    RotateCcw, HelpCircle, Book, AlertTriangle, Settings, MonitorPlay, 
    GraduationCap, Award, Cpu, Activity, Zap, Calculator, CheckCircle2, 
    ShieldCheck, Share2, ArrowRight, BookOpen, ChevronDown, ChevronUp, Scale,
    TrendingUp, Radio
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    ReferenceDot, ReferenceLine, Label, Legend, Area, AreaChart 
} from 'recharts';

// ============================== UTILITIES & HOOKS ==============================

const SEO = ({ title }) => {
    useEffect(() => { document.title = title; }, [title]);
    return null;
};

const useThemeObserver = () => {
    const [isDark, setIsDark] = useState(true);
    useEffect(() => {
        const match = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(match.matches);
        const handler = (e) => setIsDark(e.matches);
        match.addEventListener('change', handler);
        return () => match.removeEventListener('change', handler);
    }, []);
    return isDark;
};

const Slider = ({ label, unit, min, max, step, value, onChange, color = 'blue' }) => {
    const colors = {
        amber: 'accent-amber-500',
        emerald: 'accent-emerald-500',
        red: 'accent-red-500',
        purple: 'accent-purple-500',
        blue: 'accent-blue-500',
        indigo: 'accent-indigo-500'
    };
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{value}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className={`w-full ${colors[color]} transition-all`} />
        </div>
    );
};

// --- Custom Math Visuals Engine ---
const MathBlock = ({ title, children }) => (
    <div className="my-6">
        {title && <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">{title}</div>}
        <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto">
            <div className="font-serif text-xl md:text-2xl text-slate-800 dark:text-slate-200 flex items-center whitespace-nowrap">
                {children}
            </div>
        </div>
    </div>
);

const Frac = ({ num, den }) => (
    <div className="inline-flex flex-col items-center justify-center align-middle mx-2 text-lg">
        <span className="border-b-2 border-slate-800 dark:border-slate-200 px-2 pb-1 leading-none">{num}</span>
        <span className="px-2 pt-1 leading-none">{den}</span>
    </div>
);

const Var = ({ base, sub, sup }) => (
    <span className="italic mx-0.5 relative inline-block">
        {base}
        {sub && <sub className="text-[0.6em] not-italic ml-0.5 -bottom-2 relative">{sub}</sub>}
        {sup && <sup className="text-[0.6em] not-italic ml-0.5 relative">{sup}</sup>}
    </span>
);

// ============================== DATA MODELS ==============================

const QUIZ_DATA = {
    easy: [
        { q: "A CT is connected in ___ with the power circuit.", opts: ["Parallel", "Series", "Delta", "Open"], ans: 1, why: "CTs are connected in series. Opening a CT secondary while energized forces all primary current to become exciting current, causing dangerous voltages." },
        { q: "Standard CT secondary rating is:", opts: ["10A", "5A or 1A", "100A", "50A"], ans: 1, why: "Standard secondary is 5A (IEEE) or 1A (IEC). 1A is increasingly popular to reduce lead wire burden (I²R losses)." },
        { q: "CT accuracy class C400 means:", opts: ["400A rating", "Maintains accuracy at up to 400V secondary at rated burden", "400Hz operation", "400 turns ratio"], ans: 1, why: "C400 guarantees ratio error ≤10% up to 400V secondary voltage at 20× rated current." },
    ],
    medium: [
        { q: "CT knee point is defined as:", opts: ["Maximum current", "Voltage where 10% increase requires 50% more exciting current", "Point of zero error", "Thermal limit"], ans: 1, why: "The knee point marks the onset of saturation per IEEE. Above it, magnetizing impedance drops drastically." },
        { q: "Total CT burden (Z_b) includes:", opts: ["Only relay", "Relay + 2×lead resistance + connections", "Only cable", "Primary impedance"], ans: 1, why: "Total external burden = relay burden + 2×lead resistance (loop out and back) + contact resistance." },
        { q: "What effect does a high X/R ratio have on a CT?", opts: ["None", "Reduces voltage", "Creates DC offset requiring severe CT overdimensioning", "Improves accuracy"], ans: 2, why: "High X/R ratios cause slowly decaying DC offset in fault currents, building up core flux and causing rapid transient saturation." },
    ],
    expert: [
        { q: "The transient dimensioning factor (K_td) for maximum DC offset is approximately:", opts: ["1.0", "1 + X/R", "X/R / 2", "0.5"], ans: 1, why: "K_td ≈ 1 + X/R (worst case, ignoring finite clearing times and remanence). A fault with X/R=15 requires a CT 16x larger than steady state." },
        { q: "Under IEC 61869-2, a 5P20 CT has an Accuracy Limit Factor (ALF) of:", opts: ["5", "20", "100", "25"], ans: 1, why: "5P20 means a Protection class (P) CT with a 5% composite error limit at 20 times the rated secondary current (ALF = 20)." },
        { q: "If the actual burden is half the rated burden on an IEC 5P20 CT, the true ALF:", opts: ["Decreases to 10", "Stays at 20", "Increases to nearly 40", "Becomes zero"], ans: 2, why: "ALF' = ALF_rated × (Rct + R_burden_rated) / (Rct + R_burden_actual). Less burden implies the CT can push proportionally higher current before hitting knee voltage." },
    ],
};

// ============================== THEORY MODULE ==============================

const TheoryLibrary = () => {
    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-8">
            
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                    <BookOpen className="w-96 h-96" />
                </div>
                <div className="relative z-10 max-w-3xl">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Protection Instrument Transformers</h2>
                    <p className="text-blue-200 text-lg leading-relaxed">
                        Master the physics and mathematics behind CT/VT sizing. Fully compliant with <strong>IEEE C57.13</strong> and <strong>IEC 61869-2</strong> standards for critical infrastructure protection.
                    </p>
                </div>
            </div>

            {/* Equivalent Circuit & Physics */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <Cpu className="w-8 h-8 text-blue-500" />
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">1. The Equivalent Circuit</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
                    <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-center">
                        <svg viewBox="0 0 500 250" className="w-full max-w-lg">
                            {/* Primary */}
                            <path d="M 30 125 L 120 125" stroke="currentColor" strokeWidth="2" fill="none" className="text-slate-800 dark:text-slate-300" markerEnd="url(#arrow)" />
                            <text x="75" y="115" fontSize="14" fill="currentColor" className="text-slate-600 dark:text-slate-400 font-bold" textAnchor="middle">Ip</text>
                            
                            {/* Ideal Transformer */}
                            <circle cx="140" cy="100" r="25" stroke="currentColor" strokeWidth="3" fill="none" className="text-blue-500" />
                            <circle cx="140" cy="150" r="25" stroke="currentColor" strokeWidth="3" fill="none" className="text-blue-500" />
                            <line x1="175" y1="60" x2="175" y2="190" stroke="currentColor" strokeWidth="3" className="text-blue-500" />
                            <line x1="185" y1="60" x2="185" y2="190" stroke="currentColor" strokeWidth="3" className="text-blue-500" />
                            
                            {/* Secondary Loop */}
                            <line x1="185" y1="80" x2="450" y2="80" stroke="currentColor" strokeWidth="2" className="text-slate-800 dark:text-slate-300" />
                            <line x1="185" y1="170" x2="450" y2="170" stroke="currentColor" strokeWidth="2" className="text-slate-800 dark:text-slate-300" />
                            
                            {/* Exciting Branch */}
                            <line x1="240" y1="80" x2="240" y2="105" stroke="currentColor" strokeWidth="2" className="text-slate-800 dark:text-slate-300" />
                            <path d="M 240 105 Q 265 115 240 125 Q 215 135 240 145" stroke="currentColor" strokeWidth="2" fill="none" className="text-amber-500" />
                            <line x1="240" y1="145" x2="240" y2="170" stroke="currentColor" strokeWidth="2" className="text-slate-800 dark:text-slate-300" />
                            <text x="265" y="130" fontSize="14" fill="currentColor" className="text-amber-500 font-bold">Xe (Ie)</text>
                            <path d="M 210 90 L 210 110" stroke="currentColor" strokeWidth="2" fill="none" className="text-amber-500" markerEnd="url(#arrow_amber)" />

                            {/* Internal Resistance */}
                            <rect x="290" y="70" width="40" height="20" stroke="currentColor" strokeWidth="2" fill="none" className="text-red-500" />
                            <text x="310" y="60" fontSize="14" fill="currentColor" className="text-red-500 font-bold" textAnchor="middle">Rct</text>

                            {/* Burden (External) */}
                            <rect x="430" y="105" width="40" height="40" stroke="currentColor" strokeWidth="2" fill="none" className="text-emerald-500" />
                            <text x="480" y="130" fontSize="14" fill="currentColor" className="text-emerald-500 font-bold">Zb</text>
                            <text x="450" y="160" fontSize="10" fill="currentColor" className="text-emerald-600">(Relay + Lead)</text>

                            {/* Secondary Current Arrow */}
                            <path d="M 360 80 L 400 80" stroke="currentColor" strokeWidth="2" fill="none" className="text-emerald-500" markerEnd="url(#arrow_green)" />
                            <text x="380" y="70" fontSize="14" fill="currentColor" className="text-emerald-500 font-bold" textAnchor="middle">Is</text>

                            <defs>
                                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="currentColor" className="text-slate-800 dark:text-slate-300" /></marker>
                                <marker id="arrow_amber" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="currentColor" className="text-amber-500" /></marker>
                                <marker id="arrow_green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="currentColor" className="text-emerald-500" /></marker>
                            </defs>
                        </svg>
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            A real Current Transformer isn't perfect. It consists of an ideal transformer, but a portion of the primary current is "stolen" to magnetize the iron core. This is the exciting current (<Var base="I" sub="e"/>).
                        </p>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2"><div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"/> <span className="text-slate-600 dark:text-slate-400">Total ideal secondary current is <Var base="I" sub="p"/> / Ratio.</span></li>
                            <li className="flex items-start gap-2"><div className="mt-1 w-2 h-2 rounded-full bg-amber-500 shrink-0"/> <span className="text-slate-600 dark:text-slate-400">Actual current reaching the relay is <Var base="I" sub="s"/> = <Var base="I" sub="ideal"/> - <Var base="I" sub="e"/>.</span></li>
                            <li className="flex items-start gap-2"><div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0"/> <span className="text-slate-600 dark:text-slate-400">The voltage required to push <Var base="I" sub="s"/> through the burden causes <Var base="I" sub="e"/> to rise. If voltage gets too high, <Var base="I" sub="e"/> skyrockets (Saturation).</span></li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Mathematics */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <Calculator className="w-8 h-8 text-emerald-500" />
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">2. Sizing Mathematics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* IEEE Math */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">IEEE C57.13 Approach</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            IEEE specifies a "C-Class" voltage rating (e.g., C400) which guarantees ≤10% error up to that voltage at 20x nominal current.
                        </p>
                        
                        <MathBlock title="Required Voltage">
                            <Var base="V" sub="req"/> = <Var base="I" sub="fault_sec"/> <span className="mx-2">×</span> ( <Var base="R" sub="ct"/> + 2<Var base="R" sub="lead"/> + <Var base="R" sub="relay"/> )
                        </MathBlock>

                        <div className="text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-4">
                            Condition for Success: <Var base="V" sub="req"/> &lt; <Var base="V" sub="class"/>
                        </div>
                    </div>

                    {/* IEC Math */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">IEC 61869-2 Approach</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            IEC utilizes Accuracy Limit Factor (ALF). A 5P20 CT is accurate up to 20x nominal current <em>only if</em> connected to its exact rated burden.
                        </p>
                        
                        <MathBlock title="True Accuracy Limit Factor">
                            <Var base="ALF" sup="'"/> = <Var base="ALF" sub="rated"/> <span className="mx-2">×</span>
                            <Frac 
                                num={<><Var base="R" sub="ct"/> + <Var base="R" sub="bn_rated"/></>} 
                                den={<><Var base="R" sub="ct"/> + <Var base="R" sub="bn_actual"/></>} 
                            />
                        </MathBlock>

                        <div className="text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-4">
                            Condition for Success: Fault Multiplier &lt; <Var base="ALF" sup="'"/>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transient Analysis */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <TrendingUp className="w-8 h-8 text-red-500" />
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">3. Transient Saturation & X/R Ratio</h3>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                        Steady-state calculations are often insufficient. When a fault occurs, inductive networks cause a <strong>DC offset</strong> in the current waveform. This non-alternating DC component acts like a continuous battery, rapidly pushing the CT core into deep magnetic saturation.
                    </p>

                    <MathBlock title="Transient Overdimensioning Factor (K_td)">
                        <Var base="K" sub="td"/> ≈ 1 + <Frac num="X" den="R" />
                    </MathBlock>

                    <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        <strong>Example:</strong> Near a generator, the X/R ratio might be 30. This means the DC offset requires the CT core to be <strong>31 times larger</strong> than steady-state math suggests to prevent saturation during the first few critical cycles. If unmitigated, high-speed differential relays will misoperate.
                    </div>
                </div>
            </section>

        </div>
    );
};

// ============================== SIMULATOR (RECHARTS INTEGRATION) ==============================

const SimulatorModule = ({ isDark }) => {
    const [standard, setStandard] = useState('IEEE'); 
    
    // Core Parameters
    const [ctRatioPrimary, setCtRatioPrimary] = useState(1200);
    const [ctSecondary, setCtSecondary] = useState(5); 
    const [faultI, setFaultI] = useState(25000);
    const [xrRatio, setXrRatio] = useState(15);
    
    // Burden Parameters
    const [rCt, setRct] = useState(0.4); 
    const [rLead, setRlead] = useState(0.8); 
    const [rRelay, setRrelay] = useState(0.1); 

    // Ratings
    const [ieeeClass, setIeeeClass] = useState(800); 
    const [iecVA, setIecVa] = useState(30);
    const [iecALF, setIecAlf] = useState(20);

    // --- DEFENSIVE PHYSICS ENGINE ---
    const safePrimary = Math.max(1, Number(ctRatioPrimary) || 1200);
    const safeSecondary = Math.max(1, Number(ctSecondary) || 5);
    const ratio = safePrimary / safeSecondary;
    const iFaultSec = (Number(faultI) || 0) / ratio;
    
    const safeRct = Number(rCt) || 0;
    const safeRlead = Number(rLead) || 0;
    const safeRrelay = Number(rRelay) || 0;
    const totalBurdenOhms = safeRrelay + (safeRlead * 2); 
    const totalLoopOhms = totalBurdenOhms + safeRct;
    
    const kTd = 1 + (Number(xrRatio) || 0); 
    
    let vReqSteady = iFaultSec * totalLoopOhms;
    let vReqTransient = vReqSteady * kTd;
    let kneeV = 0.001; // Avoid divide-by-zero
    
    if (standard === 'IEEE') {
        kneeV = Math.max(10, Number(ieeeClass) || 100); 
    } else {
        const safeVA = Number(iecVA) || 1;
        const safeALF = Number(iecALF) || 1;
        const rBurdenRated = safeVA / (safeSecondary * safeSecondary);
        const alfTrue = safeALF * (safeRct + rBurdenRated) / (safeRct + totalBurdenOhms);
        kneeV = Math.max(10, alfTrue * safeSecondary * (safeRct + totalBurdenOhms)); 
    }

    const marginSteady = vReqSteady > 0 ? (kneeV / vReqSteady) * 100 : 999;
    const marginTransient = vReqTransient > 0 ? (kneeV / vReqTransient) * 100 : 999;
    
    const isSatSteady = vReqSteady > kneeV;
    const isSatTransient = vReqTransient > kneeV;

    // --- RECHARTS DATA GENERATION ---
    const chartData = useMemo(() => {
        const data = [];
        const maxI = 100;
        const localKneeI = 0.5; // Represents approximate excitation current at knee
        
        for (let i = 0.001; i <= maxI; i *= 1.2) {
            let v = 0;
            if (i <= localKneeI) {
                // Linear / slightly curved magnetic region
                v = kneeV * Math.pow(i / localKneeI, 0.85);
            } else {
                // Deep saturation (flattening out logarithmically)
                v = kneeV + (kneeV * 0.15) * Math.log10(i / localKneeI);
            }
            data.push({
                excitingCurrent: i,
                voltage: v
            });
        }
        return data;
    }, [kneeV]);

    // Calculate actual operating points on the curve (clamped to prevent chart explosion)
    const MAX_VISUAL_I = 100;
    const KNEE_I_REF = 0.5;
    
    const opI_steady_raw = isSatSteady ? KNEE_I_REF * Math.pow(10, (vReqSteady - kneeV)/(kneeV*0.15)) : vReqSteady / (kneeV/KNEE_I_REF);
    const opI_transient_raw = isSatTransient ? KNEE_I_REF * Math.pow(10, (vReqTransient - kneeV)/(kneeV*0.15)) : vReqTransient / (kneeV/KNEE_I_REF);

    const safe_opI_steady = Math.max(0.001, Math.min(opI_steady_raw, MAX_VISUAL_I));
    const safe_opI_transient = Math.max(0.001, Math.min(opI_transient_raw, MAX_VISUAL_I));
    
    // Clamp visual dots so they don't break the Y-axis entirely if infinitely high
    const safe_vReqSteady = Math.min(vReqSteady, kneeV * 2.5);
    const safe_vReqTransient = Math.min(vReqTransient, kneeV * 2.5);

    // Custom Tooltip Component
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900/90 border border-slate-700 text-white p-3 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">V-I Curve Point</p>
                    <p className="font-mono"><span className="text-indigo-400">V:</span> {data.voltage.toFixed(1)} V</p>
                    <p className="font-mono"><span className="text-amber-400">I_e:</span> {data.excitingCurrent.toFixed(3)} A</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 pb-24 animate-in fade-in">
            
            {/* Standard Toggle Header */}
            <div className="flex flex-col items-center justify-center mb-6">
                <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-xl flex shadow-inner border border-slate-300 dark:border-slate-700 w-full max-w-md">
                    <button onClick={() => setStandard('IEEE')} className={`flex-1 py-2.5 text-sm font-black tracking-wide rounded-lg transition-all duration-300 ${standard === 'IEEE' ? 'bg-white dark:bg-slate-950 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>IEEE C57.13</button>
                    <button onClick={() => setStandard('IEC')} className={`flex-1 py-2.5 text-sm font-black tracking-wide rounded-lg transition-all duration-300 ${standard === 'IEC' ? 'bg-white dark:bg-slate-950 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>IEC 61869</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: PARAMETER CONTROLS */}
                <div className="lg:col-span-4 space-y-6">
                    <div className={`rounded-3xl border p-6 shadow-xl ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                        <h3 className="font-black text-xl mb-6 flex items-center gap-3 text-slate-800 dark:text-white">
                            <Settings className="w-6 h-6 text-indigo-500"/> System Setup
                        </h3>
                        
                        <div className="space-y-6">
                            {/* Core Rating */}
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">CT Core Rating</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Primary (A)</label>
                                        <input type="number" value={ctRatioPrimary} onChange={e=>setCtRatioPrimary(+e.target.value)} className={`w-full p-2.5 rounded-xl border text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${isDark?'bg-slate-900 border-slate-700':'bg-white border-slate-300'}`} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Secondary (A)</label>
                                        <select value={ctSecondary} onChange={e=>setCtSecondary(+e.target.value)} className={`w-full p-2.5 rounded-xl border text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${isDark?'bg-slate-900 border-slate-700':'bg-white border-slate-300'}`}>
                                            <option value={5}>5A</option>
                                            <option value={1}>1A</option>
                                        </select>
                                    </div>
                                </div>

                                {standard === 'IEEE' ? (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IEEE Voltage Class</label>
                                        <select value={ieeeClass} onChange={e=>setIeeeClass(+e.target.value)} className={`w-full p-2.5 rounded-xl border text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${isDark?'bg-slate-900 border-slate-700':'bg-white border-slate-300'}`}>
                                            {[100, 200, 400, 800].map(v => <option key={v} value={v}>C{v} ({v}V)</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rated VA</label>
                                            <input type="number" value={iecVA} onChange={e=>setIecVa(+e.target.value)} className={`w-full p-2.5 rounded-xl border text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${isDark?'bg-slate-900 border-slate-700':'bg-white border-slate-300'}`} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rated ALF</label>
                                            <input type="number" value={iecALF} onChange={e=>setIecAlf(+e.target.value)} className={`w-full p-2.5 rounded-xl border text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${isDark?'bg-slate-900 border-slate-700':'bg-white border-slate-300'}`} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Impedances */}
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Burden & Resistance</h4>
                                <Slider label="Internal Winding (R_ct)" unit=" Ω" min={0.01} max={2.0} step={0.01} value={rCt} onChange={e => setRct(Number(e.target.value))} color="purple" />
                                <Slider label="Lead Wire (One-Way)" unit=" Ω" min={0.1} max={5.0} step={0.1} value={rLead} onChange={e => setRlead(Number(e.target.value))} color="amber" />
                                <Slider label="Relay Element" unit=" Ω" min={0.01} max={2.0} step={0.01} value={rRelay} onChange={e => setRrelay(Number(e.target.value))} color="emerald" />
                            </div>
                            
                            {/* Fault Conditions */}
                            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-200 dark:border-red-900/30 space-y-6">
                                <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">Fault Conditions</h4>
                                <Slider label="Max Fault (Primary)" unit=" A" min={1000} max={50000} step={500} value={faultI} onChange={e => setFaultI(Number(e.target.value))} color="red" />
                                <Slider label="X/R Ratio (Transient)" unit="" min={1} max={100} step={1} value={xrRatio} onChange={e => setXrRatio(Number(e.target.value))} color="red" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: RESULTS & INTERACTIVE CHART */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Top KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Steady State KPI */}
                        <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-500 ${isSatSteady ? (isDark?'bg-red-900/30 border-red-600/50':'bg-red-50 border-red-300') : (isDark?'bg-emerald-900/20 border-emerald-600/40':'bg-emerald-50 border-emerald-300')}`}>
                            <div className="absolute -right-4 -top-4 opacity-10">
                                {isSatSteady ? <AlertTriangle className="w-32 h-32" /> : <CheckCircle2 className="w-32 h-32" />}
                            </div>
                            <div className="relative z-10">
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Steady-State Analysis</div>
                                <div className="flex items-end gap-3 mb-2">
                                    <div className={`text-4xl font-black font-mono ${isSatSteady ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {marginSteady > 998 ? "∞" : marginSteady.toFixed(0)}<span className="text-xl">%</span>
                                    </div>
                                    <div className={`text-sm font-bold pb-1 uppercase ${isSatSteady ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {isSatSteady ? 'Saturated' : 'Safe Margin'}
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Required: <strong>{vReqSteady.toFixed(0)}V</strong> vs Knee: <strong>{kneeV.toFixed(0)}V</strong>
                                </div>
                            </div>
                        </div>

                        {/* Transient KPI */}
                        <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-500 ${isSatTransient ? (isDark?'bg-orange-900/30 border-orange-600/50':'bg-orange-50 border-orange-300') : (isDark?'bg-emerald-900/20 border-emerald-600/40':'bg-emerald-50 border-emerald-300')}`}>
                            <div className="absolute -right-4 -top-4 opacity-10">
                                <Zap className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Transient (Worst-Case DC Offset)</div>
                                <div className="flex items-end gap-3 mb-2">
                                    <div className={`text-4xl font-black font-mono ${isSatTransient ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {marginTransient > 998 ? "∞" : marginTransient.toFixed(0)}<span className="text-xl">%</span>
                                    </div>
                                    <div className={`text-sm font-bold pb-1 uppercase ${isSatTransient ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {isSatTransient ? 'Saturates' : 'Fully Safe'}
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Req Transient: <strong>{vReqTransient.toFixed(0)}V</strong> (K_td = {kTd.toFixed(1)})
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Chart */}
                    <div className={`flex-1 min-h-[450px] rounded-3xl border p-6 shadow-xl flex flex-col ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="font-black text-xl flex items-center gap-2 text-slate-800 dark:text-white">
                                    <Activity className="w-6 h-6 text-indigo-500"/> Core Excitation Characteristics
                                </h3>
                                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Interactive Logarithmic V-I Curve</p>
                            </div>
                            
                            {/* Legend / Info */}
                            <div className="flex gap-4 text-xs font-bold bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"/> Steady State</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"/> Transient Peak</div>
                            </div>
                        </div>

                        <div className="flex-1 w-full h-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                    
                                    {/* X-Axis configured for pseudo-logarithmic display using custom ticks */}
                                    <XAxis 
                                        dataKey="excitingCurrent" 
                                        type="number" 
                                        scale="log" 
                                        domain={[0.001, 100]} 
                                        ticks={[0.001, 0.01, 0.1, 1, 10, 100]}
                                        tickFormatter={(v) => v.toString()}
                                        stroke={isDark ? '#64748b' : '#94a3b8'}
                                    >
                                        <Label value="Exciting Current (A)" offset={-15} position="insideBottom" fill={isDark ? '#94a3b8' : '#64748b'} fontSize={12} fontWeight="bold" />
                                    </XAxis>
                                    
                                    <YAxis 
                                        type="number" 
                                        domain={[0, 'dataMax']}
                                        stroke={isDark ? '#64748b' : '#94a3b8'}
                                    >
                                        <Label value="Secondary Voltage (V)" angle={-90} position="insideLeft" fill={isDark ? '#94a3b8' : '#64748b'} fontSize={12} fontWeight="bold" />
                                    </YAxis>
                                    
                                    <Tooltip content={CustomTooltip} />
                                    
                                    {/* The Excitation Curve */}
                                    <Line 
                                        type="monotone" 
                                        dataKey="voltage" 
                                        stroke="#6366f1" 
                                        strokeWidth={3} 
                                        dot={false} 
                                        activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                        isAnimationActive={false}
                                    />

                                    {/* Operating Points */}
                                    <ReferenceDot 
                                        x={safe_opI_steady} 
                                        y={safe_vReqSteady} 
                                        r={8} 
                                        fill={isSatSteady ? '#ef4444' : '#10b981'} 
                                        stroke="#fff" 
                                        strokeWidth={2} 
                                    />
                                    <ReferenceDot 
                                        x={safe_opI_transient} 
                                        y={safe_vReqTransient} 
                                        r={6} 
                                        fill={isSatTransient ? '#f97316' : '#10b981'} 
                                        stroke="#fff" 
                                        strokeWidth={2} 
                                    />
                                    
                                    {/* Knee Point Line */}
                                    <ReferenceLine y={kneeV} stroke="#ef4444" strokeDasharray="5 5">
                                        <Label value={`Knee Point (${kneeV.toFixed(0)}V)`} position="top" fill="#ef4444" fontSize={12} fontWeight="bold" />
                                    </ReferenceLine>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// ============================== QUIZ MODULE ==============================
const QuizModule = ({ isDark }) => {
    const [level, setLevel] = useState('easy');
    const [cur, setCur] = useState(0);
    const [score, setScore] = useState(0);
    const [sel, setSel] = useState(null);
    const [fin, setFin] = useState(false);
    
    const qs = QUIZ_DATA[level];
    const q = qs[cur];
    
    const pick = (i) => {
        if (sel !== null) return;
        setSel(i);
        if (i === q.ans) setScore(p => p + 1);
        setTimeout(() => {
            if (cur + 1 >= qs.length) setFin(true);
            else { setCur(p => p + 1); setSel(null); }
        }, 2500);
    };
    
    const rst = () => { setCur(0); setScore(0); setSel(null); setFin(false); };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-8">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-20 -translate-y-8 translate-x-8"><Award className="w-64 h-64"/></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-3">Protection Certification</h2>
                    <p className="text-purple-200 text-lg">Test your engineering knowledge against rigorous real-world standards.</p>
                </div>
            </div>
            
            <div className={`flex rounded-2xl border overflow-hidden shadow-md ${isDark?'border-slate-800':'border-slate-200'}`}>
                {['easy','medium','expert'].map(l => (
                    <button key={l} onClick={() => {setLevel(l);rst();}} className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all ${level===l?(l==='easy'?'bg-emerald-600 text-white':l==='medium'?'bg-amber-600 text-white':'bg-red-600 text-white'):isDark?'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300':'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>{l} Mode</button>
                ))}
            </div>
            
            {fin ? (
                <div className={`text-center p-16 rounded-3xl border shadow-xl animate-in zoom-in-95 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <div className="text-7xl mb-8 drop-shadow-lg">{score >= qs.length - 1 ? '🏆' : '📚'}</div>
                    <div className="text-5xl font-black mb-4 text-slate-800 dark:text-white">{score} <span className="text-3xl text-slate-400">/ {qs.length}</span></div>
                    <div className="text-lg text-slate-500 mb-10 font-medium">{score >= qs.length - 1 ? 'Excellent! You possess senior-level understanding.' : 'Good effort! Review the theoretical models and retry.'}</div>
                    <button onClick={rst} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black tracking-widest shadow-lg shadow-indigo-500/30 transition-transform active:scale-95">RETRY ASSESSMENT</button>
                </div>
            ) : (
                <div className={`p-8 md:p-10 rounded-3xl border shadow-xl ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-black text-slate-400 tracking-widest uppercase">Scenario {cur+1} <span className="opacity-50">/ {qs.length}</span></span>
                        <span className="text-sm font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl">Score: {score}</span>
                    </div>
                    <h3 className="text-2xl font-black mb-10 text-slate-800 dark:text-white leading-relaxed">{q.q}</h3>
                    <div className="space-y-4">
                        {q.opts.map((o,i) => (
                            <button key={i} onClick={()=>pick(i)} className={`w-full text-left p-5 rounded-2xl border text-base font-medium transition-all duration-300 ${sel===null?isDark?'border-slate-700 bg-slate-800 hover:border-indigo-500 hover:shadow-md':'border-slate-200 bg-slate-50 hover:border-indigo-500 hover:shadow-md':i===q.ans?'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold scale-[1.02] shadow-lg':sel===i?'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 scale-[0.98]':'opacity-30 scale-[0.98]'}`}>
                                <span className="font-black mr-4 opacity-40 text-lg">{String.fromCharCode(65+i)}</span>{o}
                            </button>
                        ))}
                    </div>
                    {sel !== null && (
                        <div className={`mt-8 p-6 rounded-2xl text-base animate-in fade-in slide-in-from-bottom-4 shadow-inner ${sel===q.ans?'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300':'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'}`}>
                            <strong className="block mb-2 text-lg">{sel===q.ans?'✅ Analysis Correct':'❌ Analysis Incorrect'}</strong> 
                            <span className="leading-relaxed">{q.why}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================== MAIN APP SHELL ==============================

export default function CTVTCalculator() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    
    const tabs = [
        { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-5 h-5"/> },
        { id: 'theory', label: 'Theory', icon: <Book className="w-5 h-5"/> },
        { id: 'quiz', label: 'Assessment', icon: <Award className="w-5 h-5"/> }
    ];

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="CT/VT Sizing Pro - Industrial Grade" />
            
            {/* Top Navbar */}
            <header className={`h-20 border-b shrink-0 flex items-center justify-between px-6 md:px-10 z-20 shadow-md ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-2.5 rounded-xl text-white shadow-xl shadow-indigo-500/30">
                        <Cpu className="w-6 h-6"/>
                    </div>
                    <div>
                        <h1 className={`font-black text-xl leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>CT/VT <span className="text-indigo-500">PRO</span></h1>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Industrial Grade</span>
                    </div>
                </div>
                
                {/* Desktop Tabs */}
                <div className={`hidden md:flex p-1.5 rounded-2xl border shadow-inner ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-indigo-400 shadow-md' : 'bg-white text-indigo-600 shadow-md') : 'opacity-60 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}>
                            {t.icon}<span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Mobile Bottom Tabs */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-20 border-t z-50 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1.5 justify-center text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === t.id ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : 'opacity-40'}`}>
                        {t.icon}<span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar pt-6">
                {activeTab === 'simulator' && <SimulatorModule isDark={isDark} />}
                {activeTab === 'theory' && <TheoryLibrary isDark={isDark} />}
                {activeTab === 'quiz' && <QuizModule isDark={isDark} />}
            </div>
        </div>
    );
}