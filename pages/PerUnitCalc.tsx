import React, { useState, useMemo, useEffect } from 'react';
import { 
    Settings, BookOpen, HelpCircle, ArrowRight, RefreshCw, Award, 
    Calculator, Share2, Activity, CheckCircle, XCircle, ChevronDown, Zap, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPE DEFINITIONS ---

type TabType = 'simulator' | 'theory' | 'quiz';

interface SystemParams {
    sBase: number;
    vBase: number;
    actualV: number;
    actualI: number;
    actualZ: number;
    equipMVA: number;
    equipV: number;
    equipZ: number;
}

// --- MATH TYPOGRAPHY COMPONENTS ---

const InlineMath = ({ children }: { children: React.ReactNode }) => (
    <span className="font-serif italic text-teal-700 dark:text-teal-300 mx-0.5 text-[1.05em] tracking-wide">{children}</span>
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
        title: 'The Per-Unit System',
        content: (
            <div className="space-y-4">
                <p>The per-unit (pu) system is universally utilized in power system engineering to normalize system variables (voltage, current, power, impedance) against chosen base values. It allows engineers to analyze massive interconnected grids containing multiple voltage levels as if they were a single, uniform circuit.</p>
                <p>A per-unit value is simply defined as the ratio of an actual quantity to a defined base quantity of the same dimension:</p>
                
                <BlockMath>
                    <InlineMath>Value<sub>pu</sub></InlineMath> = <Fraction num={<InlineMath>Value<sub>actual</sub></InlineMath>} den={<InlineMath>Value<sub>base</sub></InlineMath>} />
                </BlockMath>
            </div>
        )
    },
    {
        title: 'Selecting the Base Quantities',
        content: (
            <div className="space-y-4">
                <p>A complete power system requires four base quantities: Power (<InlineMath>S<sub>base</sub></InlineMath>), Voltage (<InlineMath>V<sub>base</sub></InlineMath>), Current (<InlineMath>I<sub>base</sub></InlineMath>), and Impedance (<InlineMath>Z<sub>base</sub></InlineMath>).</p>
                <p>By defining <strong>two</strong> independent base quantities (typically Power and Voltage), the remaining two are mathematically fixed by standard electrical laws. The system base power (<InlineMath>S<sub>base</sub></InlineMath>) is conventionally chosen as 100 MVA for transmission studies.</p>
                <p>For a three-phase system, the derived base current and base impedance are:</p>
                
                <BlockMath>
                    <InlineMath>I<sub>base</sub></InlineMath> = <Fraction num={<InlineMath>S<sub>base</sub></InlineMath>} den={<>&radic;3 &times; <InlineMath>V<sub>base</sub></InlineMath></>} />
                </BlockMath>

                <BlockMath>
                    <InlineMath>Z<sub>base</sub></InlineMath> = <Fraction num={<InlineMath>V<sub>base</sub><sup>2</sup></InlineMath>} den={<InlineMath>S<sub>base</sub></InlineMath>} />
                </BlockMath>

                <p className="text-sm opacity-80 mt-2">*Note: When <InlineMath>V<sub>base</sub></InlineMath> is in kV and <InlineMath>S<sub>base</sub></InlineMath> is in MVA, the formula <InlineMath>V<sup>2</sup>/S</InlineMath> correctly yields <InlineMath>Z<sub>base</sub></InlineMath> in Ohms (&Omega;) without further unit conversions.</p>
            </div>
        )
    },
    {
        title: 'The Magic of Transformers',
        content: (
            <div className="space-y-4">
                <p>The primary advantage of the per-unit system is the elimination of ideal transformers from the circuit model. By intentionally defining the voltage bases on either side of a transformer to exactly match its turns ratio, the transformer's per-unit turns ratio becomes 1:1.</p>
                <p>Consequently, all voltages across a healthy power grid will hover near 1.0 pu, regardless of whether they are physically at 400kV, 132kV, or 11kV. This makes identifying voltage sags or overvoltages instant and intuitive.</p>
            </div>
        )
    },
    {
        title: 'Change of Base (Equipment Conversion)',
        content: (
            <div className="space-y-4">
                <p>Manufacturers provide equipment impedances (like a generator's subtransient reactance <InlineMath>X&quot;<sub>d</sub></InlineMath> or a transformer's leakage reactance) in per-unit based on the equipment's <strong>own</strong> nameplate rating.</p>
                <p>To integrate this equipment into a system-wide study, its impedance must be converted to the common <strong>System Base</strong> using the Change of Base formula:</p>
                
                <BlockMath>
                    <InlineMath>Z<sub>pu,new</sub></InlineMath> = <InlineMath>Z<sub>pu,old</sub></InlineMath> &times; <Fraction num={<InlineMath>S<sub>base,new</sub></InlineMath>} den={<InlineMath>S<sub>base,old</sub></InlineMath>} /> &times; <Fraction num={<><InlineMath>V<sub>base,old</sub></InlineMath><sup>2</sup></>} den={<><InlineMath>V<sub>base,new</sub></InlineMath><sup>2</sup></>} />
                </BlockMath>
            </div>
        )
    }
];

// --- QUIZ DATA ---
const QUIZ_QUESTIONS = [
    {
        question: "How many independent base quantities must be chosen to fully define a per-unit system?",
        options: [
            "One (Usually Power)",
            "Two (Usually Power and Voltage)",
            "Three (Power, Voltage, and Current)",
            "Four (Power, Voltage, Current, and Impedance)"
        ],
        correctAnswer: 1,
        explanation: "You only need to define two base quantities—almost always S_base (MVA) and V_base (kV). The other two, I_base and Z_base, are derived using standard power equations (S = √3*V*I and V = I*Z)."
    },
    {
        question: "What is the industry standard System Base Power (S_base) typically chosen for transmission grid studies?",
        options: [
            "1 MVA",
            "10 MVA",
            "100 MVA",
            "1000 MVA"
        ],
        correctAnswer: 2,
        explanation: "100 MVA is the universally accepted standard base power for large system studies. It provides convenient, intuitive per-unit values for most transmission equipment."
    },
    {
        question: "A generator is rated at 50 MVA and has a subtransient reactance (X\"d) of 0.20 pu. If converted to a 100 MVA system base, what is its new per-unit reactance? (Assume voltage bases match).",
        options: [
            "0.10 pu",
            "0.20 pu",
            "0.40 pu",
            "1.00 pu"
        ],
        correctAnswer: 2,
        explanation: "Using the Change of Base formula: Z_new = Z_old * (S_new / S_old). Therefore, 0.20 * (100 / 50) = 0.40 pu. A larger power base results in a larger per-unit impedance."
    },
    {
        question: "How is the Base Impedance (Z_base) calculated for a three-phase system?",
        options: [
            "(V_base)² / S_base",
            "V_base / I_base",
            "S_base / (V_base)²",
            "Both A and B are correct"
        ],
        correctAnswer: 3,
        explanation: "Both formulas are correct. Z = V / I is Ohm's law. By substitution, Z_base = (V_base)² / S_base. Conveniently, if V_base is in kV (Line-to-Line) and S_base is in MVA (3-Phase), the formula (V_base)² / S_base directly yields Z_base in Ohms."
    },
    {
        question: "What is the primary advantage of analyzing a power system in per-unit rather than physical units (Volts, Amps, Ohms)?",
        options: [
            "It eliminates the need for complex numbers.",
            "It removes ideal transformers from the analytical model.",
            "It converts all AC circuits to DC circuits.",
            "It automatically calculates fault currents."
        ],
        correctAnswer: 1,
        explanation: "By defining the voltage bases across a transformer to equal its turns ratio, the transformer effectively becomes a 1:1 ideal transformer and drops out of the impedance diagram, vastly simplifying grid calculations."
    },
    {
        question: "A 132kV busbar has an actual measured voltage of 125kV. What is its per-unit voltage?",
        options: [
            "0.947 pu",
            "1.056 pu",
            "1.000 pu",
            "0.050 pu"
        ],
        correctAnswer: 0,
        explanation: "V_pu = Actual Voltage / Base Voltage = 125kV / 132kV = 0.9469 pu. This indicates the bus is operating approximately 5.3% below nominal voltage."
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 
                           bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm font-medium
                           focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
            />
            {suffix && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                    {suffix}
                </span>
            )}
        </div>
    </div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-4 border-b border-teal-100 dark:border-teal-500/10 pb-2">
        {title}
    </h3>
);

// --- SVG HUB DIAGRAM ---

const BaseHubDiagram = ({ isDark, sBase, vBase, zBase, iBase }: any) => {
    const strokeColor = isDark ? '#334155' : '#cbd5e1';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';

    return (
        <div className="relative w-full aspect-square max-w-[340px] mx-auto select-none">
            <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-sm">
                
                {/* Connecting Lines */}
                <path d="M 200 200 L 200 60" stroke={strokeColor} strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 200 200 L 340 200" stroke={strokeColor} strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 200 200 L 200 340" stroke={strokeColor} strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 200 200 L 60 200" stroke={strokeColor} strokeWidth="2" strokeDasharray="4 4" />

                {/* Central Hub */}
                <circle cx="200" cy="200" r="45" fill={isDark ? '#115e59' : '#ccfbf1'} stroke={isDark ? '#14b8a6' : '#0f766e'} strokeWidth="3" />
                <text x="200" y="196" textAnchor="middle" fill={isDark ? '#ccfbf1' : '#0f766e'} fontSize="14" fontWeight="bold" fontFamily="sans-serif">SYSTEM</text>
                <text x="200" y="212" textAnchor="middle" fill={isDark ? '#ccfbf1' : '#0f766e'} fontSize="14" fontWeight="bold" fontFamily="sans-serif">BASE</text>

                {/* Top Node: V_base */}
                <circle cx="200" cy="60" r="40" fill={isDark ? '#1e3a8a' : '#dbeafe'} stroke="#3b82f6" strokeWidth="2" />
                <text x="200" y="52" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold" fontFamily="sans-serif">V_base</text>
                <text x="200" y="70" textAnchor="middle" fill={textColor} fontSize="15" fontWeight="900" fontFamily="sans-serif">{vBase} kV</text>
                <text x="200" y="85" textAnchor="middle" fill={subTextColor} fontSize="10" fontFamily="sans-serif">(Defined)</text>

                {/* Right Node: S_base */}
                <circle cx="340" cy="200" r="40" fill={isDark ? '#78350f' : '#fef3c7'} stroke="#f59e0b" strokeWidth="2" />
                <text x="340" y="192" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="sans-serif">S_base</text>
                <text x="340" y="210" textAnchor="middle" fill={textColor} fontSize="15" fontWeight="900" fontFamily="sans-serif">{sBase} MVA</text>
                <text x="340" y="225" textAnchor="middle" fill={subTextColor} fontSize="10" fontFamily="sans-serif">(Defined)</text>

                {/* Bottom Node: Z_base */}
                <circle cx="200" cy="340" r="40" fill={isDark ? '#14532d' : '#dcfce3'} stroke="#22c55e" strokeWidth="2" />
                <text x="200" y="332" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Z_base</text>
                <text x="200" y="350" textAnchor="middle" fill={textColor} fontSize="15" fontWeight="900" fontFamily="sans-serif">{zBase.toFixed(2)} Ω</text>
                <text x="200" y="365" textAnchor="middle" fill={subTextColor} fontSize="10" fontFamily="sans-serif">V² / S</text>

                {/* Left Node: I_base */}
                <circle cx="60" cy="200" r="40" fill={isDark ? '#4c1d95' : '#f3e8ff'} stroke="#a855f7" strokeWidth="2" />
                <text x="60" y="192" textAnchor="middle" fill="#a855f7" fontSize="12" fontWeight="bold" fontFamily="sans-serif">I_base</text>
                <text x="60" y="210" textAnchor="middle" fill={textColor} fontSize="15" fontWeight="900" fontFamily="sans-serif">{iBase.toFixed(0)} A</text>
                <text x="60" y="225" textAnchor="middle" fill={subTextColor} fontSize="10" fontFamily="sans-serif">S / (√3·V)</text>

            </svg>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function PerUnitCalc() {
    const [isDark, setIsDark] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('simulator');

    // System State
    const [params, setParams] = useState<SystemParams>({
        sBase: 100,
        vBase: 132,
        actualV: 125,
        actualI: 350,
        actualZ: 50,
        equipMVA: 50,
        equipV: 132,
        equipZ: 0.12,
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

    // --- ENGINE: Calculations ---
    const results = useMemo(() => {
        const { sBase, vBase, actualV, actualI, actualZ, equipMVA, equipV, equipZ } = params;
        
        // 1. Derived Bases
        const zBase = (vBase * vBase) / sBase;
        const iBase = (sBase * 1000) / (Math.sqrt(3) * vBase);

        // 2. Per-Unit Actuals
        const puV = actualV / vBase;
        const puI = actualI / iBase;
        const puZ = actualZ / zBase;

        // 3. Equipment Conversion
        const sRatio = sBase / equipMVA;
        const vRatio = Math.pow(equipV / vBase, 2);
        const zConverted = equipZ * sRatio * vRatio;

        return {
            zBase, iBase,
            puV, puI, puZ,
            sRatio, vRatio, zConverted
        };
    }, [params]);

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
            
            {/* Header */}
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white p-2.5 rounded-xl shadow-lg shadow-teal-500/20">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">Per<span className="text-teal-500">Unit</span><span className="opacity-80">Calc</span></h1>
                            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-1">System Engineering Suite</p>
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
                                    ? 'border-teal-500 text-teal-600 dark:text-teal-400' 
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
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-teal-500" /> Parameters
                                        </h2>
                                    </div>

                                    <div className="space-y-8 relative z-10">
                                        {/* System Base */}
                                        <div>
                                            <SectionHeader title="1. System Base Quantities" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Base Power (S_base)" type="number" step="10" min={10} value={params.sBase} onChange={(v: number) => update('sBase', v)} suffix="MVA" />
                                                <InputField label="Base Volts (V_base)" type="number" step="11" min={0.4} value={params.vBase} onChange={(v: number) => update('vBase', v)} suffix="kV" />
                                            </div>
                                        </div>

                                        {/* Actual Physical Values */}
                                        <div>
                                            <SectionHeader title="2. Actual Measured Values" />
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputField label="Actual Voltage" step="1" min={0} value={params.actualV} onChange={(v: number) => update('actualV', v)} suffix="kV" />
                                                    <InputField label="Actual Current" step="1" min={0} value={params.actualI} onChange={(v: number) => update('actualI', v)} suffix="A" />
                                                </div>
                                                <InputField label="Actual Impedance" step="1" min={0} value={params.actualZ} onChange={(v: number) => update('actualZ', v)} suffix="Ω" />
                                            </div>
                                        </div>

                                        {/* Equipment Plate */}
                                        <div>
                                            <SectionHeader title="3. Equipment Conversion" />
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputField label="Nameplate MVA" step="1" min={1} value={params.equipMVA} onChange={(v: number) => update('equipMVA', v)} suffix="MVA" />
                                                    <InputField label="Nameplate kV" step="1" min={0.4} value={params.equipV} onChange={(v: number) => update('equipV', v)} suffix="kV" />
                                                </div>
                                                <InputField label="Nameplate Z_pu" step="0.01" min={0} value={params.equipZ} onChange={(v: number) => update('equipZ', v)} suffix="pu" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- RIGHT PANEL: RESULTS & SIMULATOR --- */}
                            <div className="xl:col-span-8 space-y-6 flex flex-col">
                                
                                {/* Dynamic SVG Hub */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
                                    <BaseHubDiagram isDark={isDark} sBase={params.sBase} vBase={params.vBase} zBase={results.zBase} iBase={results.iBase} />
                                </div>

                                {/* Results Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                    
                                    {/* PU Values */}
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-center">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-6 flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Normalized Quantities
                                        </h3>
                                        
                                        <div className="space-y-5">
                                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-slate-400">Voltage (pu)</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{params.actualV} kV / {params.vBase} kV</div>
                                                </div>
                                                <div className={`text-2xl font-black font-mono ${Math.abs(results.puV - 1) > 0.05 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                    {results.puV.toFixed(4)}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-slate-400">Current (pu)</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{params.actualI} A / {results.iBase.toFixed(0)} A</div>
                                                </div>
                                                <div className={`text-2xl font-black font-mono ${results.puI > 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {results.puI.toFixed(4)}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end pb-2">
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-slate-400">Impedance (pu)</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{params.actualZ} Ω / {results.zBase.toFixed(1)} Ω</div>
                                                </div>
                                                <div className="text-2xl font-black font-mono text-indigo-500 dark:text-indigo-400">
                                                    {results.puZ.toFixed(4)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Base Conversion */}
                                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-3xl p-6 md:p-8 border border-teal-200 dark:border-teal-800/50 shadow-sm relative overflow-hidden flex flex-col justify-center">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400 mb-6 flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> Equipment Base Conversion
                                        </h3>
                                        
                                        <div className="text-center mb-6">
                                            <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">New System Per-Unit Impedance</div>
                                            <div className="text-4xl md:text-5xl font-black font-mono text-teal-600 dark:text-teal-400 tracking-tight drop-shadow-sm">
                                                {results.zConverted.toFixed(4)}<span className="text-xl text-teal-500/50 ml-2">pu</span>
                                            </div>
                                        </div>

                                        <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 backdrop-blur-sm space-y-3 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Original Z_pu</span>
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{params.equipZ.toFixed(4)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Power Multiplier (S_sys / S_eq)</span>
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">× {results.sRatio.toFixed(3)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Voltage Multiplier (V_eq / V_sys)²</span>
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">× {results.vRatio.toFixed(3)}</span>
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
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 mb-6 shadow-inner">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-black mb-4">Per-Unit Theory Library</h2>
                                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                                    Comprehensive engineering reference material for power system normalization, derived from universally accepted power analysis principles.
                                </p>
                            </div>

                            {THEORY_SECTIONS.map((section, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-bl-[100px] -z-10 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-colors duration-500" />
                                    
                                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-lg font-black shadow-inner shrink-0">
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
                                            className="bg-teal-500 h-full transition-all duration-500"
                                            style={{ width: `${((quizStep) / QUIZ_QUESTIONS.length) * 100}%` }}
                                        />
                                    </div>

                                    <div className="p-8 md:p-12">
                                        <div className="flex justify-between items-center mb-8">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Question {quizStep + 1} of {QUIZ_QUESTIONS.length}</span>
                                            <span className="text-xs font-black uppercase tracking-widest text-teal-600 bg-teal-50 dark:bg-teal-500/10 px-3 py-1 rounded-full">Score: {quizScore}</span>
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-bold mb-8 leading-tight">
                                            {QUIZ_QUESTIONS[quizStep].question}
                                        </h3>

                                        <div className="space-y-4 mb-8">
                                            {QUIZ_QUESTIONS[quizStep].options.map((option, idx) => {
                                                const isSelected = selectedAnswer === idx;
                                                const isCorrect = idx === QUIZ_QUESTIONS[quizStep].correctAnswer;
                                                
                                                let stateClass = "border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/5";
                                                
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
                                            <button onClick={nextQuestion} className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                                {quizStep === QUIZ_QUESTIONS.length - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRight className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-12 text-center">
                                    <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Award className="w-12 h-12" />
                                    </div>
                                    <h2 className="text-3xl font-black mb-2">Quiz Complete!</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8">You scored {quizScore} out of {QUIZ_QUESTIONS.length}.</p>
                                    
                                    <div className="flex justify-center gap-4">
                                        <button onClick={resetQuiz} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> Retake Quiz
                                        </button>
                                        <button onClick={() => setActiveTab('simulator')} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors">
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