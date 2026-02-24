import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PieChart, Plus, Trash2, Zap, Sliders, Info, BookOpen, 
  Layers, Activity, MousePointer2, Download, RefreshCw, 
  ShieldAlert, Settings, Share2, CheckCircle2, RotateCcw,
  Book, GraduationCap, MonitorPlay, Terminal, ArrowRight
} from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';

// --- MATH HELPERS ---
const toRad = (deg) => deg * (Math.PI / 180);
const toDeg = (rad) => rad * (180 / Math.PI);

// Complex Number Logic for Symmetrical Components
const add = (c1, c2) => ({ x: c1.x + c2.x, y: c1.y + c2.y });
const polarToRect = (mag, angDeg) => ({ x: mag * Math.cos(toRad(angDeg)), y: mag * Math.sin(toRad(angDeg)) });
const rectToPolar = (c) => {
    const mag = Math.sqrt(c.x ** 2 + c.y ** 2);
    let ang = toDeg(Math.atan2(c.y, c.x));
    if (ang < 0) ang += 360;
    return { mag, ang };
};
// Rotate complex number by degrees
const rotate = (c, deg) => {
    const p = rectToPolar(c);
    return polarToRect(p.mag, p.ang + deg);
};

// Helper for Info Boxes
const BoxInfo = ({ title, color, children }: { title: string, color: string, children: React.ReactNode }) => {
    const colorClasses: Record<string, string> = {
        blue: "border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100",
        purple: "border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-900 dark:text-purple-100",
        amber: "border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-100",
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

// --- 1. THEORY DATA ---
const THEORY_DATA = [
    {
        id: 'phasors',
        title: "1. Phasor Fundamentals",
        icon: <Activity className="w-5 h-5 text-blue-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <div className="p-5 rounded-xl border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
                    <h3 className="text-lg font-bold mb-2 text-blue-900 dark:text-blue-100">The Rotating Vector</h3>
                    <p className="text-slate-800 dark:text-slate-200">
                        In AC power systems, voltages and currents are sinusoidal functions of time: {"$v(t) = V_{max} \\cos(\\omega t + \\phi)$"}.
                        Analyzing these using trigonometry is tedious. Instead, we use <strong>Phasors</strong> (Phase Vectors).
                    </p>
                    <div className="mt-4 font-mono text-center bg-white dark:bg-black/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                         Euler's Identity: {"$e^{j\\phi} = \\cos(\\phi) + j\\sin(\\phi)$"}
                    </div>
                </div>

                <p className="text-slate-700 dark:text-slate-300">
                    A phasor freezes the rotating vector at {"$t=0$"}. It represents the magnitude (RMS) and the phase angle relative to a reference.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="space-y-2">
                        <strong className="block text-slate-900 dark:text-white border-b pb-1">The Reference Phase</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Usually, Phase A Voltage is taken as the reference at 0°.
                            <br/>{"$V_A = 1\\angle 0^\\circ$"}
                            <br/>All other vectors are measured relative to this.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <strong className="block text-slate-900 dark:text-white border-b pb-1">Lag vs. Lead</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            in an Inductive load, Current <strong>Lags</strong> Voltage (CCW rotation).
                            <br/>{"$I = I_{mag}\\angle -30^\\circ$"} (Lagging PF)
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'sym_components',
        title: "2. Symmetrical Components",
        icon: <Layers className="w-5 h-5 text-purple-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Fortescue's Theorem (1918)</h4>
                <p className="text-slate-600 dark:text-slate-400">
                    Charles Legeyt Fortescue proved that any set of N unbalanced phasors can be decomposed into N sets of balanced phasors. For 3-phase systems, these are:
                </p>

                <div className="grid grid-cols-1 gap-4 my-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border-l-4 border-blue-500">
                        <strong className="text-blue-700 dark:text-blue-300">Positive Sequence (I1)</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Balanced, A-B-C rotation (same as source). Represents normal load power transfer.
                        </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border-l-4 border-red-500">
                        <strong className="text-red-700 dark:text-red-300">Negative Sequence (I2)</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Balanced, A-C-B rotation (reverse). Produced by unbalance (e.g., open conductor, L-L fault).
                            <strong>Significance:</strong> Creates reverse torque in motors (overheating).
                        </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border-l-4 border-slate-500">
                        <strong className="text-slate-700 dark:text-slate-300">Zero Sequence (I0)</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Three vectors in phase (no rotation). Produced by ground faults.
                            <br/>{"$I_A = I_B = I_C$"}
                            <br/><strong>Note:</strong> Creates current in the neutral wire. {"$I_N = 3I_0$"}.
                        </p>
                    </div>
                </div>

                <BoxInfo title="The Transformation Matrix" color="purple">
                     <div className="font-mono text-xs overflow-x-auto whitespace-pre">
{`|I0|   |1  1    1   | |Ia|
|I1| = |1  a    a^2 | |Ib|  x (1/3)
|I2|   |1  a^2  a   | |Ic|`}
                     </div>
                     <p className="mt-2 text-xs">
                        Where {"$a = 1\\angle 120^\\circ$"} and {"$a^2 = 1\\angle 240^\\circ$"}.
                     </p>
                </BoxInfo>
            </div>
        )
    },
    {
        id: 'faults',
        title: "3. Fault Signatures",
        icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <p className="text-slate-700 dark:text-slate-300">
                    By looking at the phasor diagram defined by Sequence Components, we can identify the fault type immediately.
                </p>

                <ul className="space-y-4">
                    <li className="p-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                             <strong className="text-slate-900 dark:text-white">Single Line to Ground (L-G)</strong>
                             <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold">Most Common (70%)</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            - High current in one phase only.
                            - I1, I2, and I0 are usually equal in magnitude and phase.
                            <br/>{"$I_1 = I_2 = I_0$"}
                        </p>
                    </li>
                    <li className="p-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                             <strong className="text-slate-900 dark:text-white">Line to Line (L-L)</strong>
                             <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">Unbalanced</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            - High current in two phases, 180° apart.
                            - Zero Sequence is ZERO (No ground path).
                            <br/>{"$I_1 = -I_2, I_0 = 0$"}
                        </p>
                    </li>
                    <li className="p-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                             <strong className="text-slate-900 dark:text-white">Three Phase (L-L-L)</strong>
                             <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">Severe</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            - High currents in all three phases, balanced.
                            - Only Positive Sequence exists.
                            <br/>{"$I_1 = Large, I_2 = 0, I_0 = 0$"}
                        </p>
                    </li>
                </ul>
            </div>
        )
    },
    {
        id: 'power',
        title: "4. Power Calculations",
        icon: <Zap className="w-5 h-5 text-amber-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <BoxInfo title="Complex Power (S)" color="amber">
                    <p>Power is calculated using the voltage phasor and the <strong>Complex Conjugate</strong> of the current phasor.</p>
                    <div className="font-mono text-center my-2 bg-white dark:bg-black/20 p-2 rounded">
                        {"$S = V \\times I^*$"}
                    </div>
                </BoxInfo>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                        <strong className="block text-slate-900 dark:text-white text-xs uppercase opacity-70">Real Power (P)</strong>
                        <div className="text-lg font-bold">{"$P = VI \\cos(\\phi)$"}</div>
                        <div className="text-xs text-slate-500">Watts (W). Does the work.</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                        <strong className="block text-slate-900 dark:text-white text-xs uppercase opacity-70">Reactive Power (Q)</strong>
                        <div className="text-lg font-bold">{"$Q = VI \\sin(\\phi)$"}</div>
                        <div className="text-xs text-slate-500">VARs. Magnetizing field.</div>
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

const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    // --- STATE ---
    const [phasors, setPhasors] = useState([
        { id: 'A', mag: 5.0, ang: 0, color: '#ef4444', label: 'Phase A' },
        { id: 'B', mag: 5.0, ang: 240, color: '#eab308', label: 'Phase B' },
        { id: 'C', mag: 5.0, ang: 120, color: '#3b82f6', label: 'Phase C' }
    ]);
    const [showResultant, setShowResultant] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const [hoveredPhasor, setHoveredPhasor] = useState<{label:string,mag:number,ang:number,x:number,y:number}|null>(null);
    const rotationRef = useRef<number>(0);
    const animIdRef = useRef<number>(0);
    const [rotOffset, setRotOffset] = useState(0);

    // Animated rotation effect
    useEffect(() => {
        if (!isRotating) { cancelAnimationFrame(animIdRef.current); return; }
        let lastT = 0;
        const animate = (t: number) => {
            if (lastT) { const dt = (t - lastT) / 1000; setRotOffset(prev => (prev + dt * 360 * (systemFreq / 60)) % 360); }
            lastT = t;
            animIdRef.current = requestAnimationFrame(animate);
        };
        animIdRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animIdRef.current);
    }, [isRotating]);
    const [refVoltage, setRefVoltage] = useState(110); 
    const [systemFreq, setSystemFreq] = useState(50);

    // --- CALCULATIONS ---
    const resultant = useMemo(() => {
        return phasors.reduce((acc, p) => {
            const rect = polarToRect(p.mag, p.ang);
            return add(acc, rect);
        }, { x: 0, y: 0 });
    }, [phasors]);
    
    const resPolar = rectToPolar(resultant);

    const seqComponents = useMemo(() => {
        if (phasors.length < 3) return null;
        const Va = polarToRect(phasors[0].mag, phasors[0].ang);
        const Vb = polarToRect(phasors[1].mag, phasors[1].ang);
        const Vc = polarToRect(phasors[2].mag, phasors[2].ang);

        // Zero Seq: 1/3 (Va + Vb + Vc)
        const sum0 = add(add(Va, Vb), Vc);
        const I0 = rectToPolar({ x: sum0.x / 3, y: sum0.y / 3 });

        // Pos Seq: 1/3 (Va + a*Vb + a^2*Vc)
        const aVb = rotate(Vb, 120);
        const a2Vc = rotate(Vc, 240);
        const sum1 = add(add(Va, aVb), a2Vc);
        const I1 = rectToPolar({ x: sum1.x / 3, y: sum1.y / 3 });

        // Neg Seq: 1/3 (Va + a^2*Vb + a*Vc)
        const a2Vb = rotate(Vb, 240);
        const aVc = rotate(Vc, 120);
        const sum2 = add(add(Va, a2Vb), aVc);
        const I2 = rectToPolar({ x: sum2.x / 3, y: sum2.y / 3 });

        return { I0, I1, I2 };
    }, [phasors]);

    const totalP = phasors.reduce((acc, p) => acc + (refVoltage * p.mag * Math.cos(toRad(p.ang))), 0);
    const totalQ = phasors.reduce((acc, p) => acc + (refVoltage * p.mag * Math.sin(toRad(p.ang))), 0);
    const totalS = Math.sqrt(totalP**2 + totalQ**2);
    const pf = totalS === 0 ? 1 : Math.abs(totalP / totalS);

    const maxMag = Math.max(...phasors.map(p => p.mag), resPolar.mag, 1);
    const size = 500;
    const center = size / 2;
    const scale = (size / 2 - 40) / (maxMag * 1.1); 

    const loadPreset = (type) => {
        const base = 5.0;
        switch(type) {
            case 'balanced':
                setPhasors([
                    { id: 'A', mag: base, ang: 0, color: '#ef4444', label: 'Phase A' },
                    { id: 'B', mag: base, ang: 240, color: '#eab308', label: 'Phase B' },
                    { id: 'C', mag: base, ang: 120, color: '#3b82f6', label: 'Phase C' }
                ]); break;
            case 'ag-fault':
                setPhasors([
                    { id: 'A', mag: base * 3, ang: -10, color: '#ef4444', label: 'Phase A' },
                    { id: 'B', mag: base, ang: 240, color: '#eab308', label: 'Phase B' },
                    { id: 'C', mag: base, ang: 120, color: '#3b82f6', label: 'Phase C' }
                ]); break;
            case 'bc-fault':
                setPhasors([
                    { id: 'A', mag: base, ang: 0, color: '#ef4444', label: 'Phase A' },
                    { id: 'B', mag: base * 2.5, ang: 180, color: '#eab308', label: 'Phase B' },
                    { id: 'C', mag: base * 2.5, ang: 0, color: '#3b82f6', label: 'Phase C' }
                ]); break;
            case 'llg-fault':
                setPhasors([
                    { id: 'A', mag: base * 3, ang: -5, color: '#ef4444', label: 'Phase A' },
                    { id: 'B', mag: base * 2, ang: 200, color: '#eab308', label: 'Phase B' },
                    { id: 'C', mag: base * 2, ang: 100, color: '#3b82f6', label: 'Phase C' }
                ]); break;
            case 'open-c':
                setPhasors([
                    { id: 'A', mag: base, ang: 0, color: '#ef4444', label: 'Phase A' },
                    { id: 'B', mag: base, ang: 240, color: '#eab308', label: 'Phase B' },
                    { id: 'C', mag: 0, ang: 120, color: '#3b82f6', label: 'Phase C' }
                ]); break;
        }
    };

    const copyShareLink = () => {
        const params = phasors.map(p => `${p.id}=${p.mag.toFixed(1)},${p.ang.toFixed(0)}`).join('&');
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?${params}`);
    };

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
            {/* CONTROL DECK */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: Inputs */}
                <div className={`rounded-2xl p-6 border shadow-sm flex flex-col h-full ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            <Sliders className="w-4 h-4 text-blue-500" /> Vector Inputs
                        </h3>
                        <button onClick={() => setPhasors([...phasors, { id: Date.now().toString(), mag: 1, ang: 0, color: '#8b5cf6', label: 'Aux' }])} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                            <Plus className="w-4 h-4"/>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar max-h-[400px]">
                        {phasors.map((p, i) => (
                            <div key={p.id} className={`group p-3 rounded-xl border transition-colors ${isDark ? 'bg-slate-950 border-slate-800 hover:border-blue-700' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: p.color}}></div>
                                        <input 
                                            value={p.label} 
                                            onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, label: e.target.value } : x))} 
                                            className={`bg-transparent font-bold text-xs w-24 outline-none focus:text-blue-600 ${isDark ? 'text-white' : 'text-slate-900'}`}
                                        />
                                    </div>
                                    {i > 2 && <Trash2 className="w-3 h-3 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => setPhasors(prev => prev.filter(x => x.id !== p.id))} />}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Magnitude (A)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" min="0" value={p.mag} onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, mag: Number(e.target.value) } : x))} className={`w-16 text-sm font-mono border rounded px-1 py-0.5 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-black'}`} />
                                            <input type="range" min="0" max="20" step="0.1" value={p.mag} onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, mag: Number(e.target.value) } : x))} className="flex-1 h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Angle (°)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" min="0" value={p.ang} onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, ang: Number(e.target.value) } : x))} className={`w-16 text-sm font-mono border rounded px-1 py-0.5 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-black'}`} />
                                            <input type="range" min="0" max="360" value={p.ang} onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, ang: Number(e.target.value) } : x))} className="flex-1 h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Presets Toolbar */}
                    <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Quick Simulations</label>
                            <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => loadPreset('balanced')} className="p-2 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 border border-emerald-200">Balanced</button>
                            <button onClick={() => loadPreset('ag-fault')} className="p-2 text-[10px] font-bold bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200">A-G Fault</button>
                            <button onClick={() => loadPreset('bc-fault')} className="p-2 text-[10px] font-bold bg-amber-50 text-amber-700 rounded hover:bg-amber-100 border border-amber-200">B-C Fault</button>
                            <button onClick={() => loadPreset('llg-fault')} className="p-2 text-[10px] font-bold bg-orange-50 text-orange-700 rounded hover:bg-orange-100 border border-orange-200">LLG Fault</button>
                            <button onClick={() => loadPreset('open-c')} className="p-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">Open Ph</button>
                            </div>
                    </div>

                    {/* Play/Stop Rotation */}
                    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="flex gap-2">
                            <button onClick={() => setIsRotating(!isRotating)} className={`flex-1 p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${isRotating ? 'bg-red-500 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'}`}>
                                {isRotating ? <><RefreshCw className="w-3 h-3 animate-spin" /> Stop Rotation</> : <><RotateCcw className="w-3 h-3" /> Animate {systemFreq}Hz</>}
                            </button>
                            <button onClick={copyShareLink} className="p-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700" title="Copy share link">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* CENTER: Visualization */}
                <div className={`rounded-2xl border p-1 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[500px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-800'}`}>
                    {/* Graph Background always dark or specialized graphic */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[1px] h-full bg-slate-800"></div>
                            <div className="h-[1px] w-full bg-slate-800 absolute"></div>
                    </div>

                    {/* SVG Graph */}
                    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full relative z-10 p-4">
                        {/* Grid Circles */}
                        <circle cx={center} cy={center} r={maxMag*0.25*scale} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                        <circle cx={center} cy={center} r={maxMag*0.5*scale} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                        <circle cx={center} cy={center} r={maxMag*0.75*scale} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                        <circle cx={center} cy={center} r={maxMag*1.0*scale} fill="none" stroke="#475569" strokeWidth="1" />
                        
                        {/* Phasors */}
                        {phasors.map(p => {
                            const drawAng = p.ang + (isRotating ? rotOffset : 0);
                            const tipX = center + p.mag * scale * Math.cos(toRad(-drawAng));
                            const tipY = center + p.mag * scale * Math.sin(toRad(-drawAng));
                            return (
                            <g key={p.id}
                                onMouseEnter={() => setHoveredPhasor({label: p.label, mag: p.mag, ang: p.ang, x: tipX, y: tipY})}
                                onMouseLeave={() => setHoveredPhasor(null)}
                            >
                                <line 
                                    x1={center} y1={center} 
                                    x2={tipX} 
                                    y2={tipY} 
                                    stroke={p.color} strokeWidth="3" strokeLinecap="round" 
                                />
                                {/* Arrowhead */}
                                <circle 
                                    cx={tipX} 
                                    cy={tipY} 
                                    r="5" fill={p.color} className="cursor-pointer"
                                />
                                {/* Label */}
                                <text 
                                    x={center + (p.mag * scale + 20) * Math.cos(toRad(-drawAng))} 
                                    y={center + (p.mag * scale + 20) * Math.sin(toRad(-drawAng))} 
                                    fill={p.color} fontSize="12" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle"
                                >
                                    {p.label}
                                </text>
                            </g>);
                        })}

                        {/* Resultant (Residual) */}
                        {showResultant && (
                            <g>
                                <line 
                                    x1={center} y1={center} 
                                    x2={center + resultant.x * scale} 
                                    y2={center - resultant.y * scale} 
                                    stroke="#10b981" strokeWidth="2" strokeDasharray="6,4" 
                                />
                                <text 
                                    x={center + resultant.x * scale + 10} 
                                    y={center - resultant.y * scale} 
                                    fill="#10b981" fontSize="10" fontWeight="bold"
                                >3I0</text>
                            </g>
                        )}

                        {/* Hover Tooltip */}
                        {hoveredPhasor && (
                            <g>
                                <rect x={hoveredPhasor.x + 8} y={hoveredPhasor.y - 30} width="100" height="28" rx="4" fill="#0f172a" fillOpacity="0.9" />
                                <text x={hoveredPhasor.x + 14} y={hoveredPhasor.y - 14} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                                    {hoveredPhasor.mag.toFixed(2)}A ∠ {hoveredPhasor.ang.toFixed(1)}°
                                </text>
                            </g>
                        )}
                    </svg>

                    {/* Graph Controls overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-2 text-xs text-slate-400">
                            <div>Scale: 1.0 pu = {(1/scale*50).toFixed(1)} px</div>
                            <div>Ref: {refVoltage}V / {systemFreq}Hz</div>
                        </div>
                        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                <input type="checkbox" checked={showResultant} onChange={e => setShowResultant(e.target.checked)} className="accent-emerald-500"/>
                                Show Residual (Ground)
                            </label>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Analysis Panel */}
                <div className="flex flex-col gap-6">
                    
                    {/* 1. Sequence Components (The "Pro" feature) */}
                    <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-4 text-purple-600">
                            <Layers className="w-4 h-4" /> Symmetrical Components
                        </h3>
                        {seqComponents ? (
                            <div className="space-y-3">
                                <div className={`flex justify-between items-center p-2 rounded-lg border-l-4 border-slate-400 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                                    <span className="text-xs font-bold text-slate-500">Zero Seq (I0)</span>
                                    <span className={`font-mono text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {seqComponents.I0.mag.toFixed(2)} ∠ {seqComponents.I0.ang.toFixed(1)}°
                                    </span>
                                </div>
                                <div className={`flex justify-between items-center p-2 rounded-lg border-l-4 border-blue-500 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                                    <span className="text-xs font-bold text-slate-500">Pos Seq (I1)</span>
                                    <span className={`font-mono text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {seqComponents.I1.mag.toFixed(2)} ∠ {seqComponents.I1.ang.toFixed(1)}°
                                    </span>
                                </div>
                                <div className={`flex justify-between items-center p-2 rounded-lg border-l-4 border-red-500 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                                    <span className="text-xs font-bold text-slate-500">Neg Seq (I2)</span>
                                    <span className={`font-mono text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {seqComponents.I2.mag.toFixed(2)} ∠ {seqComponents.I2.ang.toFixed(1)}°
                                    </span>
                                </div>
                                
                                <div className="mt-2 text-[10px] text-slate-400 text-right">
                                    Unbalance (I2/I1): <strong className={seqComponents.I2.mag/seqComponents.I1.mag > 0.2 ? 'text-red-500' : 'text-green-500'}>
                                        {((seqComponents.I2.mag / (seqComponents.I1.mag || 1)) * 100).toFixed(1)}%
                                    </strong>
                                </div>

                                {/* Sequence Bar Chart */}
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Visual Magnitude Compare</div>
                                    {[{label:'I0 (Zero)', mag: seqComponents.I0.mag, color:'#64748b'}, {label:'I1 (Positive)', mag: seqComponents.I1.mag, color:'#3b82f6'}, {label:'I2 (Negative)', mag: seqComponents.I2.mag, color:'#ef4444'}].map(s => {
                                        const maxBar = Math.max(seqComponents.I0.mag, seqComponents.I1.mag, seqComponents.I2.mag, 0.01);
                                        return (
                                            <div key={s.label} className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono w-20 text-slate-500 shrink-0">{s.label}</span>
                                                <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                    <div className="h-full rounded-full transition-all duration-500" style={{width: `${(s.mag / maxBar) * 100}%`, backgroundColor: s.color}} />
                                                </div>
                                                <span className="text-[9px] font-mono w-12 text-right text-slate-500">{s.mag.toFixed(1)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic text-center py-4">Requires 3-Phase Input</div>
                        )}
                    </div>

                    {/* 2. Power Monitor */}
                    <div className={`rounded-2xl border p-6 shadow-sm flex-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-amber-600">
                                <Zap className="w-4 h-4" /> Power Monitor
                            </h3>
                            <div className={`text-[10px] px-2 py-1 rounded text-slate-500 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>Ref V: {refVoltage}V</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Active (P)</div>
                                <div className={`text-xl font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{(totalP/1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">kW</span></div>
                            </div>
                            <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Reactive (Q)</div>
                                <div className={`text-xl font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{(totalQ/1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">kVAR</span></div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-slate-500">Apparent Power (S)</span>
                                <span className="font-mono font-bold">{(totalS/1000).toFixed(2)} kVA</span>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-slate-500">Power Factor</span>
                                <span className={`font-mono font-bold ${pf < 0.85 ? 'text-red-500' : 'text-green-500'}`}>{pf.toFixed(3)} {totalQ >= 0 ? 'Lag' : 'Lead'}</span>
                            </div>
                            {/* PF Bar */}
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                                <div className={`h-full ${pf < 0.85 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${pf*100}%`}}></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const UserGuideModule = ({ isDark }: { isDark: boolean }) => {
    return (
        <div className={`max-w-3xl mx-auto p-8 animate-fade-in ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <MousePointer2 className="w-6 h-6 text-blue-500" /> User Guide
            </h2>
            <div className="space-y-8">
                <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-lg mb-2">How to Simulate Faults</h3>
                    <ul className="list-decimal pl-5 space-y-2 text-sm opacity-80">
                        <li><strong>Balanced Load:</strong> all magnitudes equal, angles separated by 120° (0, -120, 120).</li>
                        <li><strong>L-G Fault:</strong> Increase magnitude of one phase (e.g., Phase A) to 3-4x others. Watch 3I0 rise.</li>
                        <li><strong>L-L Fault:</strong> Set two phases to be 180° apart with high magnitude. Watch I2 rise while I0 stays low.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

// --- 3. MAIN LAYOUT ---

export default function VectorLab() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            
            {/* Header */}
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>VectorMaster <span className="text-blue-500">PRO</span></h1>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Phasor Analysis Suite</span>
                    </div>
                </div>

                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {[
                        { id: 'theory', label: 'Handbook', icon: <Book className="w-4 h-4" /> },
                        { id: 'simulator', label: 'Laboratory', icon: <MonitorPlay className="w-4 h-4" /> },
                        { id: 'guide', label: 'User Guide', icon: <GraduationCap className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
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
                    { id: 'theory', label: 'Theory', icon: <Book className="w-5 h-5" /> },
                    { id: 'simulator', label: 'Sim', icon: <MonitorPlay className="w-5 h-5" /> },
                    { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-5 h-5" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
                {activeTab === 'theory' && <TheoryModule isDark={isDark} />}

                {/* Simulator: Wrapped in overflow-y-auto for vertical scrolling */}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}>
                    <SimulatorModule isDark={isDark} />
                </div>

                {activeTab === 'guide' && (
                    <div className="h-full overflow-y-auto">
                        <UserGuideModule isDark={isDark} />
                    </div>
                )}
            </div>
        </div>
    );
}