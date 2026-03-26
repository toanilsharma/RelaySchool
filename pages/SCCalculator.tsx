import React, { useState, useMemo, useEffect } from 'react';
import { 
    Zap, Settings, BookOpen, HelpCircle, ArrowRight, RefreshCw, Award, 
    Calculator, Share2, Activity, CheckCircle, XCircle, ChevronDown, LineChart as LineChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { PageSEO } from "../components/SEO/PageSEO";

const scSchema: Record<string, any> = {
    "@type": "WebApplication",
    "name": "IEC 60909 Short Circuit Calculator",
    "description": "Calculate 3-phase, 2-phase, and 1-phase short circuit currents according to IEC 60909. Analyze peak currents and asymmetric waveforms.",
    "applicationCategory": "EngineeringApplication",
    "operatingSystem": "WebBrowser",
};

// --- TYPE DEFINITIONS ---

type TabType = 'simulator' | 'theory' | 'quiz';

interface SystemParams {
    Un: number;
    calcType: 'MAX' | 'MIN';
    SkQ: number;
    RQ_XQ: number;
    lineLength: number;
    R1line: number;
    X1line: number;
    R0line: number;
    X0line: number;
}

// --- MATH TYPOGRAPHY COMPONENTS ---

const InlineMath = ({ children }: { children: React.ReactNode }) => (
    <span className="font-serif italic text-indigo-700 dark:text-indigo-300 mx-0.5 text-[1.05em] tracking-wide">{children}</span>
);

const BlockMath = ({ children }: { children: React.ReactNode }) => (
    <div className="py-4 px-6 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl text-center font-serif text-lg overflow-x-auto my-4 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center gap-2">
        {children}
    </div>
);

const Fraction = ({ num, den }: { num: React.ReactNode, den: React.ReactNode }) => (
    <span className="inline-flex flex-col items-center align-middle mx-1.5">
        <span className="border-b border-slate-800 dark:border-slate-200 px-1 pb-0.5 leading-none">{num}</span>
        <span className="px-1 pt-1 leading-none">{den}</span>
    </span>
);

// --- THEORY DATA ---

const THEORY_SECTIONS = [
    {
        title: 'IEC 60909 Fundamentals',
        content: (
            <div className="space-y-4">
                <p>IEC 60909 is the internationally recognized standard for calculating short-circuit currents in three-phase AC systems. It utilizes the <strong>Equivalent Voltage Source Method</strong>.</p>
                <p>Instead of calculating complex pre-fault load flows, the standard introduces an equivalent voltage source directly at the short-circuit location, whilst reducing all other active voltage sources to zero. The magnitude of this source is defined as:</p>
                
                <BlockMath>
                    <InlineMath>V<sub>eq</sub></InlineMath> = <Fraction num={<><InlineMath>c</InlineMath> &times; <InlineMath>U<sub>n</sub></InlineMath></>} den={<>&radic;3</>} />
                </BlockMath>

                <p>Where:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                    <li><InlineMath>U<sub>n</sub></InlineMath> : Nominal system line-to-line voltage.</li>
                    <li><InlineMath>c</InlineMath> : Voltage factor. Accounts for maximum operating voltages, tap changer positions, and spatial variations. For <InlineMath>U<sub>n</sub> &gt; 1kV</InlineMath>, <InlineMath>c<sub>max</sub> = 1.10</InlineMath> and <InlineMath>c<sub>min</sub> = 1.00</InlineMath>.</li>
                </ul>
            </div>
        )
    },
    {
        title: 'Initial Symmetrical Fault Current (I"k)',
        content: (
            <div className="space-y-4">
                <p>The initial symmetrical short-circuit current (<InlineMath>I&quot;<sub>k</sub></InlineMath>) is the RMS value of the AC symmetrical component at the exact instant the fault occurs (<InlineMath>t=0</InlineMath>).</p>
                
                <p>For a severe, balanced three-phase fault, only the positive sequence network is involved. The equation is straightforward:</p>
                
                <BlockMath>
                    <InlineMath>I&quot;<sub>k3</sub></InlineMath> = <Fraction num={<><InlineMath>c</InlineMath> &times; <InlineMath>U<sub>n</sub></InlineMath></>} den={<>&radic;3 &times; |<InlineMath>Z<sub>1</sub></InlineMath>|</>} />
                </BlockMath>

                <p>For a single-line-to-ground fault, the positive (<InlineMath>Z<sub>1</sub></InlineMath>), negative (<InlineMath>Z<sub>2</sub></InlineMath>), and zero (<InlineMath>Z<sub>0</sub></InlineMath>) sequence networks are connected in series:</p>

                <BlockMath>
                    <InlineMath>I&quot;<sub>k1</sub></InlineMath> = <Fraction num={<>&radic;3 &times; <InlineMath>c</InlineMath> &times; <InlineMath>U<sub>n</sub></InlineMath></>} den={<>|<InlineMath>Z<sub>1</sub></InlineMath> + <InlineMath>Z<sub>2</sub></InlineMath> + <InlineMath>Z<sub>0</sub></InlineMath>|</>} />
                </BlockMath>
            </div>
        )
    },
    {
        title: 'Peak Asymmetric Current (ip)',
        content: (
            <div className="space-y-4">
                <p>Power systems are inherently highly inductive. When a fault occurs, the current cannot change instantaneously. If the fault strikes when the voltage waveform is crossing zero, a massive <strong>DC offset component</strong> is generated to maintain magnetic continuity.</p>
                <p>This DC offset pushes the total current wave fully asymmetrical. The absolute maximum instantaneous peak (<InlineMath>i<sub>p</sub></InlineMath>) occurs roughly a half-cycle (10ms at 50Hz) after the fault inception. This value dictates the extreme mechanical forces (electrodynamic stresses) that busbars and breaker contacts must withstand.</p>
                
                <BlockMath>
                    <InlineMath>i<sub>p</sub></InlineMath> = <InlineMath>&kappa;</InlineMath> &times; &radic;2 &times; <InlineMath>I&quot;<sub>k</sub></InlineMath>
                </BlockMath>

                <p>The peak factor <InlineMath>&kappa;</InlineMath> mathematically depends strictly on the system <InlineMath>R/X</InlineMath> ratio (which dictates the DC decay rate, <InlineMath>&tau; = L/R</InlineMath>):</p>

                <BlockMath>
                    <InlineMath>&kappa;</InlineMath> = 1.02 + 0.98 &times; <InlineMath>e<sup>&minus;3 &times; (R/X)</sup></InlineMath>
                </BlockMath>
                
                <p>If <InlineMath>R=0</InlineMath> (purely inductive), <InlineMath>&kappa; &approx; 2.0</InlineMath>, resulting in a peak current nearly 2.82 times the RMS value.</p>
            </div>
        )
    }
];

// --- QUIZ DATA ---
const QUIZ_QUESTIONS = [
    {
        question: "In IEC 60909, what does the voltage factor (c_max) represent for a High Voltage (>1kV) calculation?",
        options: [
            "1.00",
            "1.05",
            "1.10",
            "1.20"
        ],
        correctAnswer: 2,
        explanation: "According to Table 1 of IEC 60909, c_max is set to 1.10 for systems > 1kV. This accounts for the highest possible operating voltage before a fault, ensuring switchgear ratings are conservative."
    },
    {
        question: "Which fault type almost universally dictates the maximum breaking capacity rating (Icu) required for a circuit breaker?",
        options: [
            "Three-Phase Fault (I\"k3)",
            "Line-to-Line Fault (I\"k2)",
            "Single-Line-to-Ground Fault (I\"k1)",
            "Line-to-Line-to-Ground Fault"
        ],
        correctAnswer: 0,
        explanation: "Three-phase faults represent the maximum balanced symmetrical energy release. Except in systems with highly engineered solid grounding where I\"k1 might slightly exceed I\"k3, the three-phase fault is the gold standard for equipment duty."
    },
    {
        question: "The peak short-circuit current (ip) is primarily calculated to verify what equipment characteristic?",
        options: [
            "Long-term thermal degradation of cables",
            "Mechanical and dynamic electrodynamic withstand capability",
            "Time-overcurrent relay coordination",
            "Transformer core saturation limits"
        ],
        correctAnswer: 1,
        explanation: "The peak current (ip) dictates the absolute maximum instantaneous force. Because magnetic repulsion forces between busbars are proportional to the square of the current (i^2), ip is critical to ensure busbars don't violently bend or break."
    },
    {
        question: "A power system has zero resistance (purely inductive, R=0). What is the theoretical maximum value of the peak factor (κ)?",
        options: [
            "1.0",
            "1.414",
            "2.0",
            "2.82"
        ],
        correctAnswer: 2,
        explanation: "The formula is κ = 1.02 + 0.98*e^(-3*R/X). If R=0, the exponent is 0, and e^0 = 1. Thus κ = 1.02 + 0.98 = 2.0. The actual peak current is κ * √2 * I\"k (which is 2.82 times the RMS), but the factor κ itself maxes at 2.0."
    },
    {
        question: "When sizing a protection relay to catch a minimum fault at the end of a long line, which parameters should be used?",
        options: [
            "c_max and a 3-phase fault scenario",
            "c_max and a 1-phase fault scenario",
            "c_min and a 2-phase or 1-phase fault scenario",
            "c_min and a 3-phase fault scenario"
        ],
        correctAnswer: 2,
        explanation: "Minimum fault calculations dictate sensitivity. We use c_min (1.00 for >1kV, 0.95 for <1kV) and typically a Line-to-Line (2-phase) or high-impedance Line-to-Ground fault at the very end of the line under minimum generation dispatch."
    }
];

// --- UI COMPONENTS ---

const InputField = ({ label, value, onChange, type = "number", step = "1", min, max, suffix = "" }: any) => (
    <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {label}
        </label>
        <div className="relative">
            <input
                type={type}
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={e => {
                    let val = Number(e.target.value);
                    if (min !== undefined && val < min) val = min;
                    if (max !== undefined && val > max) val = max;
                    onChange(val);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 
                           bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm font-medium
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            />
            {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                    {suffix}
                </span>
            )}
        </div>
    </div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-indigo-500/10 pb-2">
        {title}
    </h3>
);

// --- MAIN APP COMPONENT ---

export default function ShortCircuitCalc() {
    const [isDark, setIsDark] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('simulator');

    // System State
    const [params, setParams] = useState<SystemParams>({
        Un: 11.0,
        calcType: 'MAX',
        SkQ: 500,
        RQ_XQ: 0.1,
        lineLength: 5.0,
        R1line: 0.15,
        X1line: 0.35,
        R0line: 0.45,
        X0line: 1.05,
    });

    // Quiz State
    const [quizStep, setQuizStep] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);

    useEffect(() => {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

    const update = (key: keyof SystemParams, value: any) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    // --- ENGINE: IEC 60909 Calculations ---
    const results = useMemo(() => {
        const { Un, calcType, SkQ, RQ_XQ, lineLength, R1line, X1line, R0line, X0line } = params;
        const voltageLevel = Un <= 1.0 ? 'LV' : 'MV';
        
        // Voltage factor c
        let c = 1.0;
        if (voltageLevel === 'LV') c = calcType === 'MAX' ? 1.05 : 0.95;
        else c = calcType === 'MAX' ? 1.10 : 1.00;

        // 1. Grid Equivalents (Ohms)
        const ZQ = (c * Un * Un) / SkQ;
        const XQ = ZQ / Math.sqrt(1 + Math.pow(RQ_XQ, 2));
        const RQ = RQ_XQ * XQ;

        // 2. Line Equivalents (Ohms)
        const RL = R1line * lineLength;
        const XL = X1line * lineLength;
        const RL0 = R0line * lineLength;
        const XL0 = X0line * lineLength;

        // 3. Positive Sequence Path
        const Rk1 = RQ + RL;
        const Xk1 = XQ + XL;
        const Zk1 = Math.sqrt(Rk1*Rk1 + Xk1*Xk1);

        // 4. Zero Sequence Path (Assuming Grid Z0 ≈ Z1 for solid ground upstream)
        const Rk0 = RQ + RL0;
        const Xk0 = XQ + XL0;

        // ================= CURRENTS =================

        // 3-Phase
        const Ik3 = (c * Un * 1000) / (Math.sqrt(3) * Zk1);

        // Peak factor (kappa)
        const Rx_ratio = Rk1 / Xk1;
        const kappa = 1.02 + 0.98 * Math.exp(-3 * Rx_ratio);
        const ip3 = kappa * Math.sqrt(2) * Ik3;

        // 2-Phase (Assuming Z2 = Z1)
        const Ik2 = (c * Un * 1000) / (2 * Zk1);

        // 1-Phase-to-Ground
        const Rsum1 = 2 * Rk1 + Rk0;
        const Xsum1 = 2 * Xk1 + Xk0;
        const Zsum1 = Math.sqrt(Rsum1*Rsum1 + Xsum1*Xsum1);
        const Ik1 = (Math.sqrt(3) * c * Un * 1000) / Zsum1;

        return {
            c, ZQ, RQ, XQ, RL, XL, Zk1, Rk1, Xk1, kappa,
            Ik3: Ik3 / 1000, 
            ip3: ip3 / 1000,
            Ik2: Ik2 / 1000,
            Ik1: Ik1 / 1000
        };
    }, [params]);

    // --- CHART: Asymmetrical Fault Waveform ---
    const waveformData = useMemo(() => {
        const data = [];
        const f = 50; // Hz
        const omega = 2 * Math.PI * f;
        
        // Time constant tau = L/R = X / (omega * R)
        const tau = results.Xk1 / (omega * results.Rk1);
        const sqrt2 = Math.sqrt(2);
        
        // Generate points for 4 cycles (80ms)
        for (let t = 0; t <= 0.08; t += 0.001) {
            // Symmetrical AC Component: -sqrt(2)*Ik * cos(wt)  [Assuming fault occurs at voltage zero]
            const sym = -sqrt2 * results.Ik3 * Math.cos(omega * t);
            
            // DC Offset Component: sqrt(2)*Ik * e^(-t/tau)
            const dc = sqrt2 * results.Ik3 * Math.exp(-t / tau);
            
            // Total Asymmetrical Current
            const asym = sym + dc;
            
            data.push({
                time: Number((t * 1000).toFixed(1)), // ms
                asym: Number(asym.toFixed(2)),
                sym: Number(sym.toFixed(2)),
                dc: Number(dc.toFixed(2))
            });
        }
        return data;
    }, [results]);

    // --- QUIZ LOGIC ---
    const handleAnswer = (index: number) => {
        if (showExplanation) return;
        setSelectedAnswer(index);
        setShowExplanation(true);
        if (index === QUIZ_QUESTIONS[quizStep].correctAnswer) {
            setQuizScore(s => s + 1);
        }
    };

    const nextQuestion = () => {
        if (quizStep < QUIZ_QUESTIONS.length - 1) {
            setQuizStep(s => s + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else {
            setQuizFinished(true);
        }
    };

    const resetQuiz = () => {
        setQuizStep(0);
        setQuizScore(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setQuizFinished(false);
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1121] text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
            <PageSEO 
                title="Short Circuit Calculator (IEC 60909)"
                description="Professional IEC 60909 short circuit analysis tool. Calculate Ik', ip, and sequence impedances for MV/LV power systems."
                url="/sc-calc"
                schema={scSchema}
                keywords={["short circuit calculator", "IEC 60909", "fault current analysis", "power system protection"]}
            />
            
            {/* Header */}
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">IEC60909<span className="text-indigo-500">Calc</span></h1>
                            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-1">Short Circuit Engineering Suite</p>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        {isDark ? '☀️' : '🌙'}
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'simulator', icon: Activity, label: 'Calculator & Simulator' },
                        { id: 'theory', icon: BookOpen, label: 'Theory Library' },
                        { id: 'quiz', icon: Award, label: 'Knowledge Quiz' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <AnimatePresence mode="wait">
                    
                    {/* ========================================================= */}
                    {/* TAB: CALCULATOR & SIMULATOR */}
                    {/* ========================================================= */}
                    {activeTab === 'simulator' && (
                        <motion.div 
                            key="simulator"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12"
                        >
                            {/* --- LEFT PANEL: INPUTS --- */}
                            <div className="xl:col-span-4 space-y-6">
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                                    
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-indigo-500" /> Parameters
                                        </h2>
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        {/* Setup */}
                                        <div>
                                            <SectionHeader title="Voltage & Duty" />
                                            <div className="flex gap-2 mb-3 p-1.5 bg-slate-100 dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl">
                                                <button onClick={() => update('calcType', 'MAX')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${params.calcType === 'MAX' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>MAX Duty (c={params.Un <= 1 ? '1.05' : '1.10'})</button>
                                                <button onClick={() => update('calcType', 'MIN')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${params.calcType === 'MIN' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>MIN Duty (c={params.Un <= 1 ? '0.95' : '1.00'})</button>
                                            </div>
                                            <InputField label="Nominal Voltage (Un)" type="number" step="0.1" min={0.4} value={params.Un} onChange={(v: number) => update('Un', v)} suffix="kV" />
                                        </div>

                                        {/* Grid Equivalents */}
                                        <div>
                                            <SectionHeader title="Upstream Grid (Infinite Bus)" />
                                            <div className="flex gap-3 mb-3">
                                                <InputField label="Short Circuit Power (Sk&quot;)" type="number" step="10" min={10} value={params.SkQ} onChange={(v: number) => update('SkQ', v)} suffix="MVA" />
                                                <InputField label="Grid R/X Ratio" type="number" step="0.01" min={0.01} max={1.0} value={params.RQ_XQ} onChange={(v: number) => update('RQ_XQ', v)} />
                                            </div>
                                        </div>

                                        {/* Line Properties */}
                                        <div>
                                            <SectionHeader title="Feeder / Cable Data" />
                                            <div className="mb-3">
                                                <InputField label="Line Length" type="number" step="0.1" min={0.1} value={params.lineLength} onChange={(v: number) => update('lineLength', v)} suffix="km" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <InputField label="Positive R1" step="0.01" min={0} value={params.R1line} onChange={(v: number) => update('R1line', v)} suffix="Ω/km" />
                                                <InputField label="Positive X1" step="0.01" min={0} value={params.X1line} onChange={(v: number) => update('X1line', v)} suffix="Ω/km" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <InputField label="Zero R0" step="0.01" min={0} value={params.R0line} onChange={(v: number) => update('R0line', v)} suffix="Ω/km" />
                                                <InputField label="Zero X0" step="0.01" min={0} value={params.X0line} onChange={(v: number) => update('X0line', v)} suffix="Ω/km" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- RIGHT PANEL: RESULTS & SIMULATOR --- */}
                            <div className="xl:col-span-8 space-y-6">
                                
                                {/* Current Dashboard */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full -z-10 group-hover:bg-red-500/10 transition-colors" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">3-Phase (I"k3)</div>
                                        <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{results.Ik3.toFixed(2)}<span className="text-base text-slate-500 font-sans ml-1">kA</span></div>
                                        <div className="text-[11px] font-medium text-slate-500 mt-1">Initial Symmetrical</div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-sm p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full -z-10 group-hover:bg-orange-500/10 transition-colors" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-2">Peak Asym (ip)</div>
                                        <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{results.ip3.toFixed(2)}<span className="text-base text-slate-500 font-sans ml-1">kA</span></div>
                                        <div className="text-[11px] font-medium text-slate-500 mt-1">&kappa; = {results.kappa.toFixed(2)}</div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full -z-10 group-hover:bg-amber-500/10 transition-colors" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">2-Phase (I"k2)</div>
                                        <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{results.Ik2.toFixed(2)}<span className="text-base text-slate-500 font-sans ml-1">kA</span></div>
                                        <div className="text-[11px] font-medium text-slate-500 mt-1">Line-to-Line</div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full -z-10 group-hover:bg-emerald-500/10 transition-colors" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">1-Phase (I"k1)</div>
                                        <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{results.Ik1.toFixed(2)}<span className="text-base text-slate-500 font-sans ml-1">kA</span></div>
                                        <div className="text-[11px] font-medium text-slate-500 mt-1">Line-to-Ground</div>
                                    </div>
                                </div>

                                {/* Graph & Detailed Impedances */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    
                                    {/* Waveform Graph */}
                                    <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <LineChartIcon className="w-5 h-5 text-indigo-500" />
                                            <h3 className="font-bold uppercase tracking-widest text-sm text-slate-800 dark:text-slate-200">Asymmetric Fault Waveform</h3>
                                        </div>
                                        
                                        <div className="w-full h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={waveformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                                                    <XAxis 
                                                        dataKey="time" 
                                                        type="number" 
                                                        stroke={isDark ? '#94a3b8' : '#64748b'}
                                                        tickFormatter={(val) => `${val}ms`}
                                                    />
                                                    <YAxis 
                                                        stroke={isDark ? '#94a3b8' : '#64748b'}
                                                        tickFormatter={(val) => `${val}kA`}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                        labelFormatter={(val) => `Time: ${val} ms`}
                                                        formatter={(value, name) => [`${value} kA`, name === 'asym' ? 'Total Asymmetric' : name === 'sym' ? 'Symmetrical AC' : 'DC Offset']}
                                                    />
                                                    <ReferenceLine y={0} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={2} />
                                                    <Line type="monotone" dataKey="asym" name="Total Asymmetric" stroke="#ef4444" strokeWidth={3} dot={false} isAnimationActive={false} />
                                                    <Line type="monotone" dataKey="sym" name="Symmetrical AC" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                                                    <Line type="monotone" dataKey="dc" name="DC Offset" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <p className="text-[11px] text-center text-slate-500 mt-4 font-medium uppercase tracking-widest">Decay driven by System R/X ratio.</p>
                                    </div>

                                    {/* Impedance Table */}
                                    <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <h3 className="font-bold uppercase tracking-widest text-sm text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                                            <Calculator className="w-4 h-4 text-indigo-500" /> System Data
                                        </h3>

                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">Factors</div>
                                                <div className="flex justify-between py-1"><span className="text-slate-600 dark:text-slate-400">c factor</span> <span className="font-mono font-bold text-slate-900 dark:text-white">{results.c.toFixed(2)}</span></div>
                                                <div className="flex justify-between py-1"><span className="text-slate-600 dark:text-slate-400">&kappa; peak</span> <span className="font-mono font-bold text-slate-900 dark:text-white">{results.kappa.toFixed(3)}</span></div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1 mt-2">Grid Equivalents</div>
                                                <div className="flex justify-between py-1"><span className="text-slate-600 dark:text-slate-400">|Z_grid|</span> <span className="font-mono text-slate-900 dark:text-white">{results.ZQ.toFixed(4)} &Omega;</span></div>
                                                <div className="flex justify-between py-1"><span className="text-slate-600 dark:text-slate-400">R + jX</span> <span className="font-mono text-slate-900 dark:text-white">{results.RQ.toFixed(4)} + j{results.XQ.toFixed(4)}</span></div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1 mt-2">Total Z1 to Fault</div>
                                                <div className="flex justify-between py-1"><span className="text-slate-600 dark:text-slate-400">|Zk1|</span> <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{results.Zk1.toFixed(4)} &Omega;</span></div>
                                                <div className="flex justify-between py-1"><span className="text-slate-600 dark:text-slate-400">R + jX</span> <span className="font-mono text-slate-900 dark:text-white">{results.Rk1.toFixed(4)} + j{results.Xk1.toFixed(4)}</span></div>
                                                <div className="flex justify-between py-1"><span className="text-slate-600 dark:text-slate-400">Total X/R</span> <span className="font-mono font-bold text-orange-500">{(results.Xk1 / results.Rk1).toFixed(2)}</span></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB: THEORY LIBRARY */}
                    {/* ========================================================= */}
                    {activeTab === 'theory' && (
                        <motion.div key="theory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-8">
                            <div className="text-center mb-10 pt-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-6">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-black mb-4">Short Circuit Theory Library</h2>
                                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                                    Comprehensive engineering reference material derived from IEC 60909 standards, utilizing pure mathematical typography.
                                </p>
                            </div>

                            {THEORY_SECTIONS.map((section, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-bl-[100px] -z-10 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors duration-500" />
                                    
                                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-black shadow-inner shrink-0">
                                            {idx + 1}
                                        </div>
                                        {section.title}
                                    </h3>
                                    <div className="text-[15.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {section.content}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB: KNOWLEDGE QUIZ */}
                    {/* ========================================================= */}
                    {activeTab === 'quiz' && (
                        <motion.div key="quiz" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-3xl mx-auto">
                            
                            {!quizFinished ? (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                                    {/* Progress Bar */}
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2">
                                        <div 
                                            className="bg-indigo-500 h-full transition-all duration-500"
                                            style={{ width: `${((quizStep) / QUIZ_QUESTIONS.length) * 100}%` }}
                                        />
                                    </div>

                                    <div className="p-8 md:p-12">
                                        <div className="flex justify-between items-center mb-8">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Question {quizStep + 1} of {QUIZ_QUESTIONS.length}</span>
                                            <span className="text-xs font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">Score: {quizScore}</span>
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-bold mb-8 leading-tight">
                                            {QUIZ_QUESTIONS[quizStep].question}
                                        </h3>

                                        <div className="space-y-4 mb-8">
                                            {QUIZ_QUESTIONS[quizStep].options.map((option, idx) => {
                                                const isSelected = selectedAnswer === idx;
                                                const isCorrect = idx === QUIZ_QUESTIONS[quizStep].correctAnswer;
                                                
                                                let stateClass = "border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/5";
                                                
                                                if (showExplanation) {
                                                    if (isCorrect) stateClass = "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/50 dark:text-emerald-100";
                                                    else if (isSelected) stateClass = "bg-rose-50 border-rose-500 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/50 dark:text-rose-100";
                                                    else stateClass = "opacity-50 border-slate-200 dark:border-slate-800";
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        disabled={showExplanation}
                                                        onClick={() => handleAnswer(idx)}
                                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${stateClass} flex items-start gap-4`}
                                                    >
                                                        <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${showExplanation && isCorrect ? 'border-emerald-500 text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50' : showExplanation && isSelected ? 'border-rose-500 text-rose-600 bg-rose-100 dark:bg-rose-900/50' : 'border-slate-300 dark:border-slate-600'}`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <span className="leading-snug">{option}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <AnimatePresence>
                                            {showExplanation && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8">
                                                    <div className={`p-5 rounded-2xl ${selectedAnswer === QUIZ_QUESTIONS[quizStep].correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                                                        <h4 className={`text-sm font-bold uppercase mb-2 ${selectedAnswer === QUIZ_QUESTIONS[quizStep].correctAnswer ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                            {selectedAnswer === QUIZ_QUESTIONS[quizStep].correctAnswer ? 'Correct!' : 'Incorrect'}
                                                        </h4>
                                                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                                            {QUIZ_QUESTIONS[quizStep].explanation}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {showExplanation && (
                                            <button onClick={nextQuestion} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                                {quizStep === QUIZ_QUESTIONS.length - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRight className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-12 text-center">
                                    <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Award className="w-12 h-12" />
                                    </div>
                                    <h2 className="text-3xl font-black mb-2">Quiz Complete!</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8">You scored {quizScore} out of {QUIZ_QUESTIONS.length}.</p>
                                    
                                    <div className="flex justify-center gap-4">
                                        <button onClick={resetQuiz} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> Retake Quiz
                                        </button>
                                        <button onClick={() => setActiveTab('simulator')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
                                            Back to Simulator
                                        </button>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}