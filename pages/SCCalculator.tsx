import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, Award, Zap, AlertTriangle, Activity, ShieldCheck, Share2, Calculator } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import Slider from '../components/Slider';
import TheoryLibrary from '../components/TheoryLibrary';
import SEO from "../components/SEO";

// ============================== THEORY ==============================
const SC_THEORY = [
    { id: 'sc-fundamentals', title: 'IEC 60909 Principles', icon: '⚡', content: [
        { type: 'text' as const, value: 'IEC 60909 is the international standard for calculating short-circuit currents in three-phase AC systems. It uses the "equivalent voltage source at the short-circuit location" method.' },
        { type: 'text' as const, value: 'The standard assumes the system is in normal operation before the fault. A voltage source c × Un / √3 is introduced at the fault location, and all other driving voltages are reduced to zero.' },
        { type: 'text' as const, value: 'This method calculates maximum short-circuit currents (for equipment rating) and minimum short-circuit currents (for relay sensitivity and settings).' },
    ]},
    { id: 'sc-factors', title: 'Voltage Factor (c)', icon: '📉', content: [
        { type: 'text' as const, value: 'The voltage factor "c" accounts for voltage variations in space and time, sudden load changes, and tap changer positions.' },
        { type: 'text' as const, value: 'For maximum short-circuit current (cmax): 1.05 for <1kV, 1.10 for >1kV.\nFor minimum short-circuit current (cmin): 0.95 for <1kV, 1.00 for >1kV.' },
    ]},
    { id: 'sc-components', title: 'Fault Types and Sequences', icon: '🔄', content: [
        { type: 'text' as const, value: '1. Three-Phase Fault (I"k3): The most severe fault type for max current. Uses only positive sequence impedance (Z1).' },
        { type: 'text' as const, value: '2. Line-to-Line Fault (I"k2): Uses positive and negative sequence (Z1, Z2). Typically I"k2 = (√3/2) * I"k3.' },
        { type: 'text' as const, value: '3. Single-Line-to-Ground Fault (I"k1): Uses positive, negative, and zero sequence (Z1, Z2, Z0). Often the highest magnitude if Z0 < Z1 (e.g., solid grounding).' },
    ]},
    { id: 'sc-currents', title: 'Calculated Quantities', icon: '📊', content: [
        { type: 'text' as const, value: '• Initial Symmetrical Short-Circuit Current (I"k): RMS value of the AC symmetrical component at the instant of the fault (t=0).' },
        { type: 'text' as const, value: '• Peak Short-Circuit Current (ip): Maximum possible instantaneous value, critical for dynamic/mechanical stress on busbars. ip = k * √2 * I"k.' },
        { type: 'text' as const, value: 'The factor k depends on the system R/X ratio. A higher X/R ratio means longer DC offset decay and a higher peak factor.' },
    ]},
];

// ============================== QUIZ ==============================
const QUIZ_DATA = { easy: [
    { q: "In IEC 60909, what does cmax represent for LV systems (<1kV)?", opts: ["1.0", "1.05", "1.10", "1.20"], ans: 1, why: "Table 1 of IEC 60909 specifies cmax = 1.05 for systems <= 1000V (except specific cases)." },
    { q: "Which fault type typically determines the maximum equipment breaking capacity rating in an ungrounded system?", opts: ["Three-Phase", "Line-to-Line", "Single-Line-to-Ground", "Line-to-Line-to-Ground"], ans: 0, why: "Three-phase faults (I\"k3) represent the maximum symmetrical current in systems where earth faults don't exceed three-phase faults." },
    { q: "The peak short-circuit current (ip) is used to verify:", opts: ["Thermal ratings of cables", "Mechanical/dynamic withstand capability of equipment", "Relay pickup settings", "Transformer losses"], ans: 1, why: "ip is the absolute maximum instantaneous force. Magnetic forces are proportional to i^2, so ip is critical for mechanical bracing." },
    { q: "Which impedance sequence is NOT required to calculate a 3-phase fault?", opts: ["Positive (Z1)", "Negative (Z2)", "Zero (Z0)", "Both negative and zero"], ans: 3, why: "A balanced 3-phase fault only involves positive sequence impedance." },
    { q: "A pure inductive fault (R=0) would have a DC offset decay time constant of:", opts: ["0", "Infinity", "1 cycle", "5 cycles"], ans: 1, why: "Time constant tau = L/R. If R=0, tau is infinite, meaning the DC offset never decays." },
], medium: [
    { q: "The relation between peak current (ip) and initial symmetrical current (I\"k) is ip = k * √2 * I\"k. What is the maximum possible theoretical value of kappa (k)?", opts: ["1.0", "1.414", "2.0", "2.5"], ans: 2, why: "Kappa max is 2.0. This happens when R=0 (pure inductance), resulting in a full 100% DC offset. Practical values are <2.0." },
    { q: "To calculate minimum short-circuit current (I\"kmin) for relay sensitivity, which voltage factor is used for HV systems?", opts: ["1.10", "1.05", "1.00", "0.95"], ans: 2, why: "Table 1 specifies cmin = 1.00 for systems > 1kV (except specific cases)." },
    { q: "What is the formula for calculating initial symmetrical 3-phase short circuit current?", opts: ["c * Un / Z1", "c * Un / (√3 * Z1)", "√3 * c * Un / Z1", "Un / (3 * Z1)"], ans: 1, why: "I\"k = c * Un / (√3 * |Z1|) where Un is the nominal line-to-line voltage." },
    { q: "When calculating single-phase-to-ground faults, the formula is I\"k1 = √3 * c * Un / X. What is X?", opts: ["|Z1|", "|Z1 + Z2 + Z0|", "|2*Z1 + Z0|", "3 * |Z0|"], ans: 2, why: "For a single line-to-ground fault, the sequence networks are in series: I1 = I2 = I0 = V / (Z1 + Z2 + Z0). Total fault current is 3*I0. Assuming Z1=Z2, this becomes √3 * c * Un / |2*Z1 + Z0|." },
    { q: "The equivalent voltage source method places the voltage source at:", opts: ["The generator terminals", "The utility connection point", "The fault location", "The load center"], ans: 2, why: "IEC 60909 introduces an equivalent voltage source (c*Un/√3) directly at the short-circuit location, making the calculation independent of pre-fault load flow." },
], expert: [
    { q: "For a near-to-generator fault, what characterizes the short-circuit current over time?", opts: ["Remains constant", "Decays from initial temporary value to a steady-state value", "Increases continuously", "Oscillates at harmonic frequencies"], ans: 1, why: "Near-to-generator faults have AC decay because the generator's internal reactance increases from subtransient (Xd\") to transient (Xd') to synchronous (Xd) over time." },
    { q: "What is the primary factor limiting the maximum theoretical peak current factor kappa (k) in an actual power system?", opts: ["Generator inertia", "System capacitance", "System resistance (Joule heating)", "Transformer core saturation"], ans: 2, why: "Resistance provides damping (tau = L/R). Without resistance, the DC component would never decay. Real systems always have some resistance." },
    { q: "In a system with multiple grounded transformers, how does this affect SLG faults?", opts: ["Increases Z0, decreases fault current", "Decreases Z0, increases fault current", "No effect on Z0", "Increases Z1"], ans: 1, why: "Multiple grounds provide parallel paths for zero-sequence current, lowering the equivalent Z0 impedance and resulting in higher 1-phase fault currents." },
    { q: "For checking overcurrent relay coordination, which short-circuit calculation result is most important?", opts: ["Max 3-phase fault", "Min single-phase fault at end of line", "Peak short-circuit ip", "DC time constant"], ans: 1, why: "Coordination requires ensuring the relay can 'see' the minimum possible fault at the end of its protection zone under minimum generation conditions." },
    { q: "According to IEC 60909, how are induction motors treated in short-circuit calculations?", opts: ["Ignored completely", "Modeled as constant impedance loads", "Modeled as subtransient voltage sources contributing to I\"k and ip", "Modeled as open circuits"], ans: 2, why: "Motors act as generators during the first few cycles of a fault due to trapped rotor flux, contributing significantly to initial and peak short circuit currents." },
]};

const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy' | 'medium' | 'expert'>('easy');
    const [cur, setCur] = useState(0); const [score, setScore] = useState(0);
    const [sel, setSel] = useState<number | null>(null); const [fin, setFin] = useState(false);
    const qs = QUIZ_DATA[level]; const q = qs[cur];
    const pick = (i: number) => { if (sel !== null) return; setSel(i); if (i === q.ans) setScore(p => p + 1); setTimeout(() => { if (cur + 1 >= qs.length) setFin(true); else { setCur(p => p + 1); setSel(null); } }, 2500); };
    const rst = () => { setCur(0); setScore(0); setSel(null); setFin(false); };
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div><div><h2 className="text-2xl font-black">Quiz</h2></div></div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>{(['easy', 'medium', 'expert'] as const).map(l => (<button key={l} onClick={() => { setLevel(l); rst(); }} className={`flex-1 py-3 text-sm font-bold uppercase ${level === l ? (l === 'easy' ? 'bg-emerald-600 text-white' : l === 'medium' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white') : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>{l}</button>))}</div>
            {fin ? (<div className={`text-center p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="text-5xl mb-4">{score >= 4 ? '🏆' : '📚'}</div><div className="text-3xl font-black mb-2">{score}/{qs.length}</div><button onClick={rst} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button></div>) : (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between mb-4"><span className="text-xs opacity-40">Q{cur + 1}/{qs.length}</span><span className="text-xs text-emerald-500">Score: {score}</span></div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">{q.opts.map((o, i) => (<button key={i} onClick={() => pick(i)} className={`w-full text-left p-4 rounded-xl border text-sm ${sel === null ? isDark ? 'border-slate-700 hover:border-blue-500' : 'border-slate-200 hover:border-blue-500' : i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : sel === i ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40'}`}><span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{o}</button>))}</div>
                    {sel !== null && <div className={`mt-4 p-4 rounded-xl text-sm ${sel === q.ans ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'}`}><strong>{sel === q.ans ? '✅ Correct!' : '❌ Incorrect.'}</strong> {q.why}</div>}
                </div>
            )}
        </div>
    );
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    // Inputs
    const [Un, setUn] = useState(11.0); // kV
    const [voltageLevel, setVoltageLevel] = useState<'MV' | 'LV'>('MV'); // >1kV or <1kV
    const [calcType, setCalcType] = useState<'MAX' | 'MIN'>('MAX');
    
    // Equivalent source/grid
    const [SkQ, setSkQ] = useState(500); // MVA
    const [RQ_XQ, setRQ_XQ] = useState(0.1); // R/X ratio of grid

    // Line
    const [lineLength, setLineLength] = useState(5.0); // km
    const [R1line, setR1line] = useState(0.15); // ohm/km
    const [X1line, setX1line] = useState(0.35); // ohm/km
    const [R0line, setR0line] = useState(0.45); // ohm/km
    const [X0line, setX0line] = useState(1.05); // ohm/km

    const calculate = () => {
        // Voltage factor c
        let c = 1.0;
        if (voltageLevel === 'LV') {
            c = calcType === 'MAX' ? 1.05 : 0.95;
        } else {
            c = calcType === 'MAX' ? 1.10 : 1.00;
        }

        // 1. Grid Impedance
        const ZQ = (c * Un * Un) / SkQ; // Ohms
        // XQ = ZQ / sqrt(1 + (R/X)^2)
        const XQ = ZQ / Math.sqrt(1 + Math.pow(RQ_XQ, 2));
        const RQ = RQ_XQ * XQ;

        // 2. Line Impedance
        const RL = R1line * lineLength;
        const XL = X1line * lineLength;
        const RL0 = R0line * lineLength;
        const XL0 = X0line * lineLength;

        // 3. Total Positive Sequence Impedance to Fault
        const Rk1 = RQ + RL;
        const Xk1 = XQ + XL;
        const Zk1 = Math.sqrt(Rk1*Rk1 + Xk1*Xk1);

        // 4. Total Zero Sequence Impedance to Fault (simplified: assuming grid Z0 = Z1 for solid ground)
        // In reality, grid Z0 depends on transformer grounding. We'll use a simplified factor or just line Z0 for demo.
        // Let's assume an upstream delta-wye solid grounded transformer dominates Z0.
        // We'll approximate grid Z0 = Z1.
        const Rk0 = RQ + RL0;
        const Xk0 = XQ + XL0;
        const Zk0 = Math.sqrt(Rk0*Rk0 + Xk0*Xk0);

        // ================= Calculations =================

        // 3-Phase Fault
        // I"k3 = c * Un / (sqrt(3) * Z1)
        const Ik3 = (c * Un * 1000) / (Math.sqrt(3) * Zk1);

        // Peak Short-Circuit Current (ip3)
        // kappa = 1.02 + 0.98 * e^(-3 * R/X)
        const Rx_ratio = Rk1 / Xk1;
        const kappa = 1.02 + 0.98 * Math.exp(-3 * Rx_ratio);
        const ip3 = kappa * Math.sqrt(2) * Ik3;

        // Line-to-Line Fault
        // I"k2 = sqrt(3) * c * Un / |Z1 + Z2| -> assuming Z2 = Z1 -> I"k2 = c * Un / (2 * Z1)
        const Ik2 = (c * Un * 1000) / (2 * Zk1);

        // Single-Line-to-Ground Fault
        // I"k1 = sqrt(3) * c * Un / |2*Z1 + Z0|  (assuming Z2 = Z1)
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
    };

    const res = calculate();

    const copyShareLink = () => {
        const state = { Un, voltageLevel, calcType, SkQ, RQ_XQ, lineLength, R1line, X1line, R0line, X0line };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert('Link copied!');
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('s');
        if (s) { try { const st = JSON.parse(atob(s)); if(st.Un) setUn(st.Un); if(st.SkQ) setSkQ(st.SkQ); if(st.lineLength) setLineLength(st.lineLength); } catch (e) {} }
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Inputs */}
                <div className="col-span-1 lg:col-span-4 space-y-6">
                    <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg"><Settings className="w-5 h-5 text-indigo-500 inline mr-2" />System Params</h3>
                            <button onClick={copyShareLink} className="flex items-center gap-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"><Share2 className="w-3 h-3" />Share</button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-2 mb-2 p-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                                <button onClick={() => setCalcType('MAX')} className={`flex-1 py-1 text-xs font-bold rounded shadow-sm ${calcType === 'MAX' ? 'bg-white text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'opacity-60'} transition-all`}>MAX SC</button>
                                <button onClick={() => setCalcType('MIN')} className={`flex-1 py-1 text-xs font-bold rounded shadow-sm ${calcType === 'MIN' ? 'bg-white text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'opacity-60'} transition-all`}>MIN SC</button>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">Nominal Voltage Un (kV)</label>
                                <input type="number" min="0.4" step="0.1" value={Un} onChange={e => { const val = Math.min(1000, Math.max(0.1, +e.target.value)); setUn(val); setVoltageLevel(val <= 1 ? 'LV' : 'MV'); }} className={`w-full p-2 rounded-lg border text-sm font-mono ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold text-sm mb-3">Upstream Grid Source</h3>
                        <div className="space-y-6">
                            <Slider 
                                label='Sk" (MVA)' 
                                unit="MVA" 
                                min={10} 
                                max={10000} 
                                step={10} 
                                value={SkQ} 
                                onChange={e => setSkQ(+e.target.value)} 
                                color="indigo"
                            />
                            <Slider 
                                label="R/X Ratio" 
                                unit="" 
                                min={0.01} 
                                max={1.0} 
                                step={0.01} 
                                value={RQ_XQ} 
                                onChange={e => setRQ_XQ(+e.target.value)} 
                                color="indigo"
                            />
                        </div>
                    </div>

                    <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold text-sm mb-3">Line Data</h3>
                        <div className="space-y-4">
                            <Slider 
                                label="Length" 
                                unit="km" 
                                min={0.1} 
                                max={100} 
                                step={0.1} 
                                value={lineLength} 
                                onChange={e => setLineLength(+e.target.value)} 
                                color="indigo"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-[10px] font-bold uppercase opacity-60 block">R1 (Ω/km)</label><input type="number" min="0" step="0.01" value={R1line} onChange={e => setR1line(Math.min(100, Math.max(0, +e.target.value)))} className={`w-full p-1.5 rounded border text-xs font-mono ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} /></div>
                                <div><label className="text-[10px] font-bold uppercase opacity-60 block">X1 (Ω/km)</label><input type="number" min="0" step="0.01" value={X1line} onChange={e => setX1line(Math.min(100, Math.max(0, +e.target.value)))} className={`w-full p-1.5 rounded border text-xs font-mono ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} /></div>
                                <div><label className="text-[10px] font-bold uppercase opacity-60 block">R0 (Ω/km)</label><input type="number" min="0" step="0.01" value={R0line} onChange={e => setR0line(Math.min(100, Math.max(0, +e.target.value)))} className={`w-full p-1.5 rounded border text-xs font-mono ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} /></div>
                                <div><label className="text-[10px] font-bold uppercase opacity-60 block">X0 (Ω/km)</label><input type="number" min="0" step="0.01" value={X0line} onChange={e => setX0line(Math.min(100, Math.max(0, +e.target.value)))} className={`w-full p-1.5 rounded border text-xs font-mono ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} /></div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Outputs */}
                <div className="col-span-1 lg:col-span-8 space-y-6">
                    
                    {/* Main Results Dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className={`rounded-2xl border p-4 border-red-500/30 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                            <div className="text-xs font-bold uppercase text-red-600 dark:text-red-400 mb-1">3-Phase Fault (I"k3)</div>
                            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{res.Ik3.toFixed(2)}<span className="text-lg text-slate-500">kA</span></div>
                            <div className="text-[10px] opacity-60 mt-1">Initial symmetrical RMS</div>
                        </div>
                        
                        <div className={`rounded-2xl border p-4 border-orange-500/30 ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                            <div className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400 mb-1">Peak Fault (ip)</div>
                            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{res.ip3.toFixed(2)}<span className="text-lg text-slate-500">kA</span></div>
                            <div className="text-[10px] opacity-60 mt-1">Max asymmetric inst (κ={res.kappa.toFixed(2)})</div>
                        </div>
                        
                        <div className={`rounded-2xl border p-4 border-amber-500/30 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                            <div className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 mb-1">2-Phase Fault (I"k2)</div>
                            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{res.Ik2.toFixed(2)}<span className="text-lg text-slate-500">kA</span></div>
                        </div>
                        
                        <div className={`rounded-2xl border p-4 border-emerald-500/30 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                            <div className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">1-Phase Fault (I"k1)</div>
                            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{res.Ik1.toFixed(2)}<span className="text-lg text-slate-500">kA</span></div>
                            <div className="text-[10px] opacity-60 mt-1">Line-to-Ground</div>
                        </div>
                    </div>

                    {/* Detailed Analysis Output */}
                    <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-indigo-500" /> Step-by-Step Impedance Results</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span className="opacity-60">Voltage Factor (c)</span> <span className="font-mono font-bold">{res.c.toFixed(2)}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span className="opacity-60">κ (Peak Factor)</span> <span className="font-mono font-bold">{res.kappa.toFixed(3)}</span></div>

                            <div className="col-span-1 md:col-span-2 mt-4 font-bold text-xs uppercase opacity-50 tracking-widest">Network Equivalents (Ohms)</div>
                            
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span className="opacity-60">Grid ZQ</span> <span className="font-mono">{res.ZQ.toFixed(4)} Ω</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span className="opacity-60">Grid RQ + jXQ</span> <span className="font-mono">{res.RQ.toFixed(4)} + j{res.XQ.toFixed(4)} Ω</span></div>
                            
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span className="opacity-60">Line Z1</span> <span className="font-mono">{Math.sqrt(res.RL**2 + res.XL**2).toFixed(4)} Ω</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span className="opacity-60">Line R1 + jX1</span> <span className="font-mono">{res.RL.toFixed(4)} + j{res.XL.toFixed(4)} Ω</span></div>

                            <div className="col-span-1 md:col-span-2 mt-4 font-bold text-xs uppercase opacity-50 tracking-widest">Total Fault Impedance (Zk)</div>
                            
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span className="opacity-60">Total Zk1</span> <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{res.Zk1.toFixed(4)} Ω</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span className="opacity-60">Total Rk1 + jXk1</span> <span className="font-mono">{res.Rk1.toFixed(4)} + j{res.Xk1.toFixed(4)} Ω</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span className="opacity-60">Total System X/R</span> <span className="font-mono">{(res.Xk1 / res.Rk1).toFixed(2)}</span></div>
                        </div>
                    </div>

                    <div className={`rounded-xl border p-4 flex gap-3 ${isDark ? 'bg-indigo-900/10 border-indigo-900/30' : 'bg-indigo-50 border-indigo-200'}`}>
                        <div className="p-2 bg-indigo-500 rounded-full text-white self-center"><Activity className="w-4 h-4" /></div>
                        <div>
                            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Engineering Check</h4>
                            <p className="text-xs text-indigo-800 dark:text-indigo-400 mt-1 leading-relaxed">Ensure breaker breaking capacity (Icu) &gt; {res.Ik3.toFixed(1)}kA. Break making capacity (Icm) / busbar withstand must exceed {res.ip3.toFixed(1)}kA peak. Protect downstream cables for minimum fault clearing times.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-indigo-500" /></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">IEC 60909 Short Circuit Calculator</p></div></div>
        {[
            { s: '1', t: 'Set System Voltage', d: 'Enter the nominal line-to-line voltage (Un). The calculator determines if this is LV (<1kV) or MV/HV (>1kV) to apply the correct voltage factor (c) per IEC 60909 Table 1.' },
            { s: '2', t: 'Select Calculation Duty (MAX/MIN)', d: 'MAX is used to specify breaker interrupting ratings and busbar bracing (c=1.05/1.10). MIN is used to check protective relay sensitivity at the end of the line (c=0.95/1.00).' },
            { s: '3', t: 'Enter Grid Equivalents', d: 'Input the upstream short-circuit power (Sk") in MVA and the assumed R/X ratio of the source. This represents the infinite bus strength behind the calculation point.' },
            { s: '4', t: 'Enter Line Parameters', d: 'Input the length of the feeder and its positive/zero sequence resistance and reactance per kilometer.' },
            { s: '5', t: 'Review Results', d: 'The dashboard instantly calculates initial symmetrical short-circuit current (I"k) and peak asymmetric current (ip) for 3-phase, phase-to-phase, and single-phase-to-ground faults.' },
        ].map(i => (<div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div><div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div></div>))}
    </div>
);

// ============================== MAIN ==============================
export default function ShortCircuitCalc() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    const tabs = [{ id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4" /> }, { id: 'simulator', label: 'Calculator', icon: <Calculator className="w-4 h-4" /> }, { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-4 h-4" /> }, { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4" /> }];
    
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="IEC 60909 Short Circuit Calculator" description="Calculate I''k, ip, I''k2, and I''k1 fault currents per IEC 60909 using equivalent voltage source method." url="/sc-calc" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-lg text-white shadow-lg"><Calculator className="w-5 h-5" /></div><div><h1 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>IEC60909<span className="text-indigo-500">Calc</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80">✅ Short Circuit Analysis</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-indigo-400' : 'bg-white text-indigo-600') : 'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
                <div />
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab === t.id ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : 'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <TheoryLibrary title="IEC 60909 Handbook" description="Reference guide for maximum/minimum short-circuit calculation methodologies." sections={SC_THEORY as any} />}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}><SimulatorModule isDark={isDark} /></div>
                {activeTab === 'guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
