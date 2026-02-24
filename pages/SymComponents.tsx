import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Zap, Activity, Hexagon, ArrowRight, RefreshCw, Triangle, Download, CheckCircle2, AlertTriangle, BookOpen, Calculator, Beaker, Menu, Divide, Share2, PieChart, Settings, Info, MousePointer2, X, Sliders as SlidersIcon, RotateCw, HelpCircle, Book, GraduationCap, Layers, MoreVertical } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from "../components/SEO";

// --- MATH KERNEL ---

const toRad = (deg: number) => deg * (Math.PI / 180);
const toDeg = (rad: number) => {
  let d = rad * (180 / Math.PI);
  return (d % 360 + 360) % 360; // Normalize 0-360
};

class Complex {
  constructor(public r: number, public i: number) {}
  
  static fromPolar(mag: number, angDeg: number) {
    return new Complex(
      mag * Math.cos(toRad(angDeg)), 
      mag * Math.sin(toRad(angDeg))
    );
  }

  add(c: Complex) { return new Complex(this.r + c.r, this.i + c.i); }
  sub(c: Complex) { return new Complex(this.r - c.r, this.i - c.i); }
  mult(c: Complex) { return new Complex(this.r * c.r - this.i * c.i, this.r * c.i + this.i * c.r); }
  scale(s: number) { return new Complex(this.r * s, this.i * s); }
  
  get mag() { return Math.sqrt(this.r ** 2 + this.i ** 2); }
  get ang() { return toDeg(Math.atan2(this.i, this.r)); }
  
  toString() { return `${this.mag.toFixed(1)}∠${this.ang.toFixed(0)}°`; }
}

const A = Complex.fromPolar(1, 120);
const A2 = Complex.fromPolar(1, 240);

// Helper for Info Boxes
const BoxInfo = ({ title, color, children }: { title: string, color: string, children: React.ReactNode }) => {
    const colorClasses: Record<string, string> = {
        blue: "border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100",
        purple: "border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-900 dark:text-purple-100",
        amber: "border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-100",
        emerald: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100",
    };
    const defaultClass = colorClasses['blue'];
    const activeClass = colorClasses[color] || defaultClass;

    return (
        <div className={`p-4 rounded-xl border-l-4 shadow-sm ${activeClass}`}>
            <h5 className="font-bold flex items-center gap-2 mb-2">{title}</h5>
            <div className="text-sm opacity-90">{children}</div>
        </div>
    );
};

// Placeholder icon since ShieldCheck wasn't imported initially in the big list
const ShieldCheck = ({ className }: {  className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
);

// --- 1. THEORY DATA ---
const THEORY_DATA = [
    {
        id: 'intro',
        title: "1. The Mathematical Basis",
        icon: <BookOpen className="w-5 h-5 text-blue-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <div className="p-5 rounded-xl border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
                    <h3 className="text-lg font-bold mb-2 text-blue-900 dark:text-blue-100">Why Symmetrical Components?</h3>
                    <p className="text-slate-800 dark:text-slate-200">
                        Analyzing a 3-phase system under <strong>unbalanced conditions</strong> (like a single-line-to-ground fault) using standard Kirchhoff's laws is incredibly complex due to mutual coupling between phases.
                        <br/><br/>
                        <strong>Dr. C.L. Fortescue (1918)</strong> proposed a method to transform an unbalanced N-phase system into N sets of balanced phasors. This decouples the network into three independent "Sequence Networks": Positive, Negative, and Zero.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="p-4 border rounded-xl bg-white dark:bg-slate-900">
                        <strong className="block text-lg mb-2 text-slate-900 dark:text-white">Analysis Domain</strong>
                        <p className="text-xs text-slate-500 mb-2">The "Real" World</p>
                        <div className="font-mono bg-slate-100 dark:bg-black/50 p-2 rounded text-xs">
                             [Ia, Ib, Ic]
                        </div>
                        <p className="mt-2 text-xs">Coupled, difficult differential equations.</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                         <ArrowRight className="w-8 h-8 text-slate-400" />
                         <span className="text-[10px] uppercase font-bold text-slate-400">Transform</span>
                    </div>
                    <div className="p-4 border rounded-xl bg-white dark:bg-slate-900">
                        <strong className="block text-lg mb-2 text-slate-900 dark:text-white">Sequence Domain</strong>
                        <p className="text-xs text-slate-500 mb-2">The "Math" World</p>
                        <div className="font-mono bg-slate-100 dark:bg-black/50 p-2 rounded text-xs">
                             [I0, I1, I2]
                        </div>
                        <p className="mt-2 text-xs">Decoupled, simple Ohm's Law circuits.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'networks',
        title: "2. Sequence Networks",
        icon: <Activity className="w-5 h-5 text-purple-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <p className="text-slate-700 dark:text-slate-300">
                    Each component of the power system (Generator, Transformer, Line) has a specific impedance to each sequence current.
                </p>

                <div className="space-y-4">
                    <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">Z1</div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">Positive Sequence (Z1)</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                The impedance seen by balanced, normal rotation currents.
                                <br/>For static devices (lines, transformers), <InlineMath math={'Z_1 = Z_{actual}'} />.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold">Z2</div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">Negative Sequence (Z2)</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                The impedance seen by reverse rotation currents.
                                <br/>For generators, <InlineMath math={'Z_2 \\\\approx Z_1'} />. For motors, <InlineMath math={'Z_2 < Z_1'} /> (looks like locked rotor).
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">Z0</div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">Zero Sequence (Z0)</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                The impedance to earth/ground current.
                                <br/><strong>CRITICAL:</strong> <InlineMath math={'Z_0'} /> depends entirely on the grounding connection. If the neutral is excluded (Delta winding), <InlineMath math={'Z_0 = \\\\infty'} /> (Open Circuit).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'transformers',
        title: "3. Transformer Grounding",
        icon: <Divide className="w-5 h-5 text-amber-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <BoxInfo title="The Delta Trap" color="amber">
                    <p>
                        Zero Sequence current (I0) cannot flow in or out of a Delta connection because <InlineMath math={'I_A + I_B + I_C = 0'} /> must hold true for a 3-wire system.
                        <br/>
                        However, I0 <strong>CAN</strong> circulate <em>inside</em> the Delta delta winding.
                    </p>
                </BoxInfo>

                <div className="mt-4">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Common Transformer Codes</h4>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b dark:border-slate-800 text-left opacity-50">
                                <th className="py-2">Connection</th>
                                <th className="py-2">Zero Seq Circuit</th>
                                <th className="py-2">Interpretation</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b dark:border-slate-800">
                                <td className="py-2 font-mono">Yg - Yg</td>
                                <td className="py-2 text-green-500">Pass Through</td>
                                <td className="py-2 opacity-70">Ground faults pass to other side.</td>
                            </tr>
                            <tr className="border-b dark:border-slate-800">
                                <td className="py-2 font-mono">Delta - Yg</td>
                                <td className="py-2 text-amber-500">Source to Ground</td>
                                <td className="py-2 opacity-70">Blocks ground faults from passing, but creates a ground source on Y side.</td>
                            </tr>
                            <tr>
                                <td className="py-2 font-mono">Delta - Delta</td>
                                <td className="py-2 text-red-500">Blocked</td>
                                <td className="py-2 opacity-70">System is ungrounded. No Zero Seq current flows for L-G fault.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )
    },
    {
        id: 'protection',
        title: "4. Relay Applications",
        icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <p className="text-slate-700 dark:text-slate-300">
                    Modern numerical relays (SEL, GE, Siemens) calculate sequence components internally every cycle. This allows for sensitive protection elements that would be impossible with just phase currents.
                </p>

                <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 border rounded-xl bg-white dark:bg-slate-900">
                        <div className="flex justify-between mb-2">
                             <strong className="text-purple-600">46 Element (Neg Seq Overcurrent)</strong>
                             <span className="text-[10px] border border-purple-200 text-purple-600 px-2 py-0.5 rounded">Motor Protection</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Detects unbalance conditions like open phases or voltage asymmetry.
                            <br/><strong>Why?</strong> Negative sequence current induces double-frequency currents in the rotor, causing rapid heating (Rotor heating follows <InlineMath math={'I_2^2 t'} /> constant).
                        </p>
                    </div>

                    <div className="p-4 border rounded-xl bg-white dark:bg-slate-900">
                        <div className="flex justify-between mb-2">
                             <strong className="text-slate-600 dark:text-slate-300">50N/51N (Residual Ground)</strong>
                             <span className="text-[10px] border border-slate-200 text-slate-500 px-2 py-0.5 rounded">Feeder Protection</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Operates on <InlineMath math={'3I_0'} />. Since load current is purely Positive Sequence, the Neutral element sees ZERO current during normal operation.
                            <br/><strong>Benefit:</strong> Can be set very sensitively (e.g., 10% of CT) to detect high-impedance ground faults.
                        </p>
                    </div>
                </div>
            </div>
        )
    }
];

// --- 2. SUB-COMPONENTS ---

const TheoryModule = ({ isDark }: { isDark: boolean }) => {
    const [activeSection, setActiveSection] = useState(THEORY_DATA[0].id);
    const content = THEORY_DATA.find(d => d.id === activeSection);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
            {/* Sidebar */}
            <div className={`md:col-span-4 lg:col-span-3 border-r overflow-y-auto ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                <div className="p-4">
                    <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Table of Contents</h2>
                    <div className="space-y-2">
                        {THEORY_DATA.map((item) => (
                            <button 
                                key={item.id} 
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all text-sm font-medium ${
                                    activeSection === item.id 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                    : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                                {item.icon}
                                <span>{item.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`md:col-span-8 lg:col-span-9 overflow-y-auto p-6 md:p-10 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{content?.title}</h1>
                        <div className={`text-xs font-mono px-2 py-1 rounded inline-block ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            Theory & Concepts
                        </div>
                    </div>
                    <div className="animate-fade-in">
                        {content?.content}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnalyzerModule = ({ isDark }: { isDark: boolean }) => {
  const [phases, setPhases] = useState([
    { mag: 100, ang: 0 },   // A
    { mag: 100, ang: 240 }, // B
    { mag: 100, ang: 120 }  // C
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get('s');
    if (stateParam) {
        try {
            const state = JSON.parse(atob(stateParam));
            if (state.phases) setPhases(state.phases);
        } catch (e) {
            console.error("Failed to parse share link", e);
        }
    }
  }, []);

  const copyShareLink = () => {
    const state = { phases };
    const str = btoa(JSON.stringify(state));
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
    alert("Simulation link copied! You can share this URL to load the exact state.");
  };

  // Calculations
  const data = useMemo(() => {
    const Va = Complex.fromPolar(phases[0].mag, phases[0].ang);
    const Vb = Complex.fromPolar(phases[1].mag, phases[1].ang);
    const Vc = Complex.fromPolar(phases[2].mag, phases[2].ang);

    const V0 = Va.add(Vb).add(Vc).scale(1/3);
    const V1 = Va.add(Vb.mult(A)).add(Vc.mult(A2)).scale(1/3);
    const V2 = Va.add(Vb.mult(A2)).add(Vc.mult(A)).scale(1/3);

    const v1Mag = Math.max(0.001, V1.mag); // Avoid div/0
    const unbalanceNeg = (V2.mag / v1Mag) * 100;
    const unbalanceZero = (V0.mag / v1Mag) * 100;

    return { Va, Vb, Vc, V0, V1, V2, unbalanceNeg, unbalanceZero };
  }, [phases]);

  const handlePhaseChange = (idx: number, key: 'mag' | 'ang', val: number) => {
    const newP = [...phases];
    newP[idx] = { ...newP[idx], [key]: val };
    setPhases(newP);
  };

  const setPreset = (type: string) => {
    const presets: any = {
      balanced: [{m:100,a:0}, {m:100,a:240}, {m:100,a:120}],
      lg: [{m:180,a:0}, {m:90,a:240}, {m:90,a:120}],
      ll: [{m:50,a:0}, {m:150,a:180}, {m:150,a:120}],
      llg: [{m:50,a:0}, {m:150,a:190}, {m:150,a:100}],
      open: [{m:0,a:0}, {m:100,a:240}, {m:100,a:120}]
    };
    if (presets[type]) {
      setPhases(presets[type].map((p: any) => ({ mag: p.m, ang: p.a })));
    }
  };

  const getAnalysis = () => {
    const { unbalanceNeg, unbalanceZero, V0, V1, V2 } = data;
    const warnings = [];
    let status = "Normal Operation";
    let statusColor = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400";

    if (unbalanceNeg > 50) {
      status = "Severe Fault Condition";
      statusColor = "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400";
    } else if (unbalanceNeg > 10) {
      status = "System Unbalanced";
      statusColor = "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400";
    }

    if (unbalanceZero > 10) warnings.push("Ground Current Detected (Possible L-G Fault)");
    if (unbalanceNeg > 10 && unbalanceZero < 5) warnings.push("Phase-Phase Fault likely (Low Zero Seq)");
    if (V1.mag < 50) warnings.push("Voltage/Current Sag (Low Positive Seq)");
    if (V1.mag > 10 && V2.mag > 10 && V0.mag > 10) warnings.push("Complex Unbalance (All Sequences Present)");

    return { status, statusColor, warnings };
  };

  const analysis = getAnalysis();

  return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500 pb-20">
            
            {/* LEFT SIDE: CONTROLS (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* FAULT PRESETS */}
              <div className={`rounded-2xl p-5 border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Fault Simulation
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPreset('balanced')} className="py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 text-xs font-bold transition-all">Balanced Load</button>
                  <button onClick={() => setPreset('lg')} className="py-2 px-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 text-xs font-bold transition-all">L-G Fault (A-G)</button>
                  <button onClick={() => setPreset('ll')} className="py-2 px-3 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 text-xs font-bold transition-all">L-L Fault (B-C)</button>
                  <button onClick={() => setPreset('llg')} className="py-2 px-3 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-100 text-xs font-bold transition-all">LL-G Fault</button>
                  <button onClick={() => setPreset('open')} className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all">Open Phase A</button>
                </div>
              </div>

              {/* MANUAL SLIDERS */}
              <div className="space-y-4">
                <PhaseControl 
                  label="A" color="bg-red-500" 
                  mag={phases[0].mag} ang={phases[0].ang} 
                  onChange={(k: any, v: any) => handlePhaseChange(0, k, v)} 
                  isDark={isDark}
                />
                <PhaseControl 
                  label="B" color="bg-amber-400" 
                  mag={phases[1].mag} ang={phases[1].ang} 
                  onChange={(k: any, v: any) => handlePhaseChange(1, k, v)} 
                  isDark={isDark}
                />
                <PhaseControl 
                  label="C" color="bg-blue-500" 
                  mag={phases[2].mag} ang={phases[2].ang} 
                  onChange={(k: any, v: any) => handlePhaseChange(2, k, v)} 
                  isDark={isDark}
                />
              </div>

              {/* Copy Results Button */}
              <div className={`rounded-2xl p-4 border shadow-sm flex gap-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <button onClick={() => {
                    const txt = `Symmetrical Components Analysis\nI0 (Zero):     ${data.V0.toString()}\nI1 (Positive): ${data.V1.toString()}\nI2 (Negative): ${data.V2.toString()}\nUnbalance (I2/I1): ${data.unbalanceNeg.toFixed(1)}%\nGround (I0/I1): ${data.unbalanceZero.toFixed(1)}%`;
                    navigator.clipboard.writeText(txt);
                }} className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                  <Download className="w-4 h-4" /> Copy Report
                </button>
                <button onClick={copyShareLink} className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                  <Share2 className="w-4 h-4" /> Share Link
                </button>
              </div>

            </div>

            {/* RIGHT SIDE: VISUALS & RESULTS (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">

              {/* LIVE DIAGNOSIS CARD */}
              <div className={`rounded-xl border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${analysis.statusColor}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-white/50 backdrop-blur-sm shadow-sm ${analysis.status.includes('Normal') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {analysis.status.includes('Normal') ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{analysis.status}</h2>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {analysis.warnings.length > 0 ? analysis.warnings[0] : "System operating within symmetrical limits."}
                    </p>
                  </div>
                </div>
                <div className={`flex gap-4 text-right ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
                  <div>
                    <div className="text-[10px] uppercase font-bold opacity-60">Neg Seq</div>
                    <div className="text-xl font-bold">{data.unbalanceNeg.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold opacity-60">Zero Seq</div>
                    <div className="text-xl font-bold">{data.unbalanceZero.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold opacity-60">IEC Limit</div>
                    <div className={`text-xl font-bold ${data.unbalanceNeg > 2 ? 'text-red-500' : 'text-emerald-500'}`}>{data.unbalanceNeg > 2 ? 'FAIL' : 'PASS'}</div>
                  </div>
                </div>
              </div>
              
              {/* PRIMARY CHARTS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Physical Chart */}
                <PhasorDiagram 
                  title="Physical Input (ABC)"
                  vectors={[
                    { mag: phases[0].mag, ang: phases[0].ang, label: 'Ia', color: '#ef4444' },
                    { mag: phases[1].mag, ang: phases[1].ang, label: 'Ib', color: '#fbbf24' },
                    { mag: phases[2].mag, ang: phases[2].ang, label: 'Ic', color: '#3b82f6' },
                  ]}
                  interactive={true}
                  onVectorChange={(i, m, a) => handlePhaseChange(i, i === 0 ? 'mag' : i === 0 ? 'ang' : 'mag', i === 0 ? m : a)}
                  isDark={isDark}
                />

                {/* Sequence Chart */}
                <div className="flex flex-col gap-4">
                  <PhasorDiagram 
                    title="Sequence Result (012)"
                    height={220}
                    vectors={[
                      { mag: data.V1.mag, ang: data.V1.ang, label: 'I1', color: '#10b981' }, // Pos (Green)
                      { mag: data.V2.mag, ang: data.V2.ang, label: 'I2', color: '#ec4899' }, // Neg (Pink)
                      { mag: data.V0.mag, ang: data.V0.ang, label: 'I0', color: '#64748b' }, // Zero (Slate)
                    ]}
                    isDark={isDark}
                  />
                  
                  {/* Result Table */}
                  <div className={`rounded-xl border p-4 shadow-sm flex-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[10px] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          <th className="pb-2">Component</th>
                          <th className="pb-2">Value (Polar)</th>
                          <th className="pb-2 text-right">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        <tr className="group">
                          <td className="py-2 text-emerald-600 font-bold">I1 (Positive)</td>
                          <td className={`py-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{data.V1.toString()}</td>
                          <td className="py-2 text-right text-xs text-slate-500 group-hover:text-emerald-600 transition-colors">Torque / Power</td>
                        </tr>
                        <tr className="group">
                          <td className="py-2 text-pink-500 font-bold">I2 (Negative)</td>
                          <td className={`py-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{data.V2.toString()}</td>
                          <td className="py-2 text-right text-xs text-slate-500 group-hover:text-pink-500 transition-colors">Heating / Drag</td>
                        </tr>
                        <tr className="group">
                          <td className="py-2 text-slate-500 font-bold">I0 (Zero)</td>
                          <td className={`py-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{data.V0.toString()}</td>
                          <td className="py-2 text-right text-xs text-slate-500 group-hover:text-slate-700 transition-colors">Ground Leakage</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* DECOMPOSITION ROW */}
              <div className={`rounded-xl border p-6 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    <Settings className="w-4 h-4" /> Component Synthesis
                  </h3>
                  <div className={`text-xs text-slate-400 px-2 py-1 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    Ia = I1 + I2 + I0
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { title: "Zero Seq (I0)", vec: data.V0, color: "#64748b", desc: "No rotation. All phases in sync." },
                    { title: "Pos Seq (I1)", vec: data.V1, color: "#10b981", desc: "Clockwise rotation (ABC)." },
                    { title: "Neg Seq (I2)", vec: data.V2, color: "#ec4899", desc: "Counter-clockwise rotation (ACB)." }
                  ].map((item, i) => (
                    <div key={i} className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <div className="text-[10px] font-bold uppercase mb-2" style={{color: item.color}}>{item.title}</div>
                      <PhasorDiagram 
                        title="" 
                        height={100} 
                        maxScale={120}
                        vectors={[
                          { mag: item.vec.mag, ang: item.vec.ang, label: '', color: item.color },
                          { mag: item.vec.mag, ang: item.vec.ang + (i === 1 ? -120 : i === 2 ? 120 : 0), label: '', color: item.color, }, // Phase B equiv
                          { mag: item.vec.mag, ang: item.vec.ang + (i === 1 ? 120 : i === 2 ? -120 : 0), label: '', color: item.color, }, // Phase C equiv
                        ].map((v, idx) => ({...v, color: idx === 0 ? v.color : `${v.color}40`}))} // Fade B/C for clarity
                        isDark={isDark}
                      />
                      <div className="text-[9px] text-center text-slate-400 mt-2 h-8 leading-tight">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
  );
};


// --- 3. HELPER COMPONENTS ---

interface PhasorProps {
  vectors: { mag: number, ang: number, label: string, color: string }[];
  title: string;
  interactive?: boolean;
  onVectorChange?: (index: number, mag: number, ang: number) => void;
  maxScale?: number;
  height?: number;
  isDark?: boolean;
}

const PhasorDiagram = ({ 
  vectors, title, interactive = false, onVectorChange, 
  maxScale = 150, height = 300, isDark = false
}: PhasorProps) => {
  const size = height;
  const center = size / 2;
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (!interactive) return;
    setDraggingIdx(index);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null || !svgRef.current || !onVectorChange) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    const dx = e.clientX - rect.left - center;
    const dy = e.clientY - rect.top - center; 
    
    let angle = toDeg(Math.atan2(-dy, dx)); 
    const pixelDist = Math.sqrt(dx*dx + dy*dy);
    const logicalMag = Math.min(maxScale * 1.2, (pixelDist / (size/2 - 20)) * maxScale);

    onVectorChange(draggingIdx, logicalMag, angle);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDraggingIdx(null);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div className={`relative rounded-xl border shadow-sm flex flex-col items-center overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="absolute top-3 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
        <h4 className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded backdrop-blur-sm ${isDark ? 'text-slate-400 bg-slate-900/80' : 'text-slate-500 bg-white/80'}`}>
          {title}
        </h4>
        {interactive && (
          <div className="flex items-center gap-1 text-[10px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
            <MousePointer2 className="w-3 h-3" /> Interactive
          </div>
        )}
      </div>

      <div style={{ width: size, height: size }} className="relative">
        {/* Polar Grid */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-10">
          <div className={`w-[85%] h-[85%] rounded-full border ${isDark ? 'border-slate-500' : 'border-slate-900'}`}></div>
          <div className={`w-[55%] h-[55%] rounded-full border border-dashed ${isDark ? 'border-slate-500' : 'border-slate-900'}`}></div>
          <div className={`absolute w-full h-px ${isDark ? 'bg-slate-500' : 'bg-slate-900'}`}></div>
          <div className={`absolute h-full w-px ${isDark ? 'bg-slate-500' : 'bg-slate-900'}`}></div>
        </div>

        <svg 
          ref={svgRef}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 w-full h-full touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {vectors.map((v, i) => (
              <marker key={i} id={`arrow-${title.replace(/\s/g,'')}-${i}`} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill={v.color} />
              </marker>
            ))}
          </defs>

          {vectors.map((v, i) => {
            const pixelMag = (v.mag / maxScale) * (size / 2 - 30);
            const x = center + pixelMag * Math.cos(toRad(v.ang));
            const y = center - pixelMag * Math.sin(toRad(v.ang));
            const isDragging = draggingIdx === i;

            return (
              <g key={i} className="group/vector">
                {/* Click area expander */}
                {interactive && (
                  <line 
                    x1={center} y1={center} x2={x} y2={y} 
                    stroke="transparent" strokeWidth="25"
                    strokeLinecap="round"
                    className="cursor-pointer"
                    onPointerDown={(e) => handlePointerDown(e, i)}
                  />
                )}
                
                {/* Visible Vector */}
                <line 
                  x1={center} y1={center} x2={x} y2={y} 
                  stroke={v.color} 
                  strokeWidth={isDragging ? 4 : 3} 
                  markerEnd={`url(#arrow-${title.replace(/\s/g,'')}-${i})`}
                  className="transition-all duration-75"
                  opacity={isDragging ? 1 : 0.9}
                />

                {/* Drag Handle Dot */}
                {interactive && (
                  <circle 
                    cx={x} cy={y} r={isDragging ? 8 : 4}
                    fill={v.color}
                    className={`cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'stroke-4 stroke-white/50' : ''}`}
                    onPointerDown={(e) => handlePointerDown(e, i)}
                  />
                )}

                {/* Label */}
                {v.mag > 10 && (
                  <g transform={`translate(${x}, ${y})`}>
                    <rect x={x > center ? 5 : -35} y={y > center ? 5 : -25} width="30" height="20" rx="4" fill="var(--bg-label)" className="fill-white dark:fill-slate-800 shadow-sm" opacity="0.8" />
                    <text 
                      x={x > center ? 10 : -30} 
                      y={y > center ? 20 : -10} 
                      fontSize="12" 
                      fontWeight="bold" 
                      fill={v.color}
                      className="pointer-events-none select-none"
                    >
                      {v.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  );
};

const PhaseControl = ({ label, color, mag, ang, onChange, isDark }: any) => (
  <div className={`p-4 rounded-xl border shadow-sm relative overflow-hidden group hover:border-blue-400 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${color}`}></div>
    
    <div className="flex justify-between items-center mb-4">
      <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        <div className={`w-3 h-3 rounded-full ${color.replace('bg-', 'bg-')}`}></div>
        Phase {label}
      </h3>
      <div className={`font-mono text-xs px-2 py-1 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
        {mag.toFixed(0)}A ∠ {ang.toFixed(0)}°
      </div>
    </div>

    <div className="space-y-4">
      {/* Magnitude Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
          <span>Magnitude</span>
          <span>{mag.toFixed(0)}</span>
        </div>
        <input 
          type="range" min="0" max="200" step="1"
          value={mag}
          onChange={(e) => onChange('mag', Number(e.target.value))}
          className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-400"
        />
      </div>

      {/* Angle Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
          <span>Angle</span>
          <span>{ang.toFixed(0)}°</span>
        </div>
        <input 
          type="range" min="0" max="360" step="1"
          value={ang}
          onChange={(e) => onChange('ang', Number(e.target.value))}
          className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-400"
        />
      </div>
    </div>
  </div>
);

// --- 4. MAIN LAYOUT ---

const SymComponents = () => {
  const [activeTab, setActiveTab] = useState<'handbook' | 'analyzer' | 'guide'>('analyzer');
  const isDark = useThemeObserver();

  return (
    <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
<SEO title="Sym Components" description="Interactive Power System simulation and engineering tool: Sym Components." url="/symcomponents" />

      
      {/* Header */}
      <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2.5 rounded-lg shadow-lg shadow-blue-500/20">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>SymComponents<span className="text-blue-500">Pro</span></h1>
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Protection Engineering Suite</span>
                 <span className="w-1 h-1 bg-slate-400 rounded-full opacity-50"></span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80">✅ 100% IEEE / IEC Compliant Math</span>
              </div>
            </div>
        </div>

        {/* Desktop Tabs */}
        <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            {[
                { id: 'handbook', label: 'Handbook', icon: <Book className="w-4 h-4" /> },
                { id: 'analyzer', label: 'Analyzer', icon: <Activity className="w-4 h-4" /> },
                { id: 'guide', label: 'Field Guide', icon: <GraduationCap className="w-4 h-4" /> },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                        ? (isDark ? 'bg-slate-800 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm')
                        : 'opacity-60 hover:opacity-100'
                        }`}
                >
                    {tab.icon} <span>{tab.label}</span>
                </button>
            ))}
        </div>
      </header>

      {/* Mobile Tab Navigation (Bottom Bar) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {[
              { id: 'handbook', label: 'Theory', icon: <Book className="w-5 h-5" /> },
              { id: 'analyzer', label: 'Analyzer', icon: <Activity className="w-5 h-5" /> },
              { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-5 h-5" /> },
          ].map(tab => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold ${activeTab === tab.id
                      ? (isDark ? 'text-blue-400' : 'text-blue-600')
                      : 'opacity-50'
                      }`}
              >
                  {tab.icon} <span>{tab.label}</span>
              </button>
          ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
          {activeTab === 'handbook' && <TheoryModule isDark={isDark} />}

          {/* Simulator: Wrapped in overflow-y-auto for vertical scrolling */}
          <div className={activeTab === 'analyzer' ? 'block h-full overflow-y-auto' : 'hidden'}>
             <div className="max-w-7xl mx-auto px-6 py-8">
                <AnalyzerModule isDark={isDark} />
             </div>
          </div>

          {activeTab === 'guide' && (
              <div className="h-full overflow-y-auto">
                 <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className={`p-8 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                      <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Engineering Field Guide</h2>
                      <p className="text-slate-500">Practical applications of Symmetrical Components in Protection Systems.</p>
                    </div>
                    
                    <div className="space-y-8">
                      <section>
                        <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-blue-600">
                          <Activity className="w-5 h-5" /> 
                          Interpreting the Results
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>High Zero Sequence (I0)</div>
                            <p className="text-sm text-slate-500 mb-2">
                              Indicates current flowing to ground.
                            </p>
                            <ul className="text-xs space-y-1 list-disc list-inside text-slate-500">
                              <li>Single Line to Ground Fault (SLG)</li>
                              <li>Double Line to Ground Fault (DLG)</li>
                              <li>Open conductor grounded on load side</li>
                            </ul>
                          </div>
                          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>High Negative Sequence (I2)</div>
                            <p className="text-sm text-slate-500 mb-2">
                              Indicates system unbalance (non-ground).
                            </p>
                            <ul className="text-xs space-y-1 list-disc list-inside text-slate-500">
                              <li>Line to Line Fault (LL)</li>
                              <li>Open Phase (Blown Fuse)</li>
                              <li>Unbalanced Loading</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-amber-500">
                          <AlertTriangle className="w-5 h-5" /> 
                          Common Mistakes
                        </h3>
                        <div className="space-y-3 text-sm text-slate-500">
                          <p><strong className={isDark ? 'text-white' : 'text-slate-900'}>Incorrect CT Polarity:</strong> If your I1 and I2 are swapped, check if your CT wiring is reversed (subtracting 180°).</p>
                          <p><strong className={isDark ? 'text-white' : 'text-slate-900'}>Rotation Check:</strong> This tool assumes Standard ABC (Positive) Rotation. If your system is ACB, swap phase B and C inputs.</p>
                          <p><strong className={isDark ? 'text-white' : 'text-slate-900'}>Ground Reference:</strong> Zero sequence requires a return path. On delta windings, I0 circulates inside the delta and cannot be seen on the lines.</p>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default SymComponents;