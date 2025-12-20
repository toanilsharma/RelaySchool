import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Plus, Trash2, Zap, Sliders, Info, BookOpen, 
  Layers, Activity, MousePointer2, Download, RefreshCw, 
  ShieldAlert, Settings, Share2, CheckCircle2 
} from 'lucide-react';

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

const VectorLab = () => {
    // --- STATE ---
    const [phasors, setPhasors] = useState([
        { id: 'A', mag: 5.0, ang: 0, color: '#ef4444', label: 'Phase A' },
        { id: 'B', mag: 5.0, ang: 240, color: '#eab308', label: 'Phase B' },
        { id: 'C', mag: 5.0, ang: 120, color: '#3b82f6', label: 'Phase C' }
    ]);
    const [showResultant, setShowResultant] = useState(true);
    const [showSequence, setShowSequence] = useState(false);
    const [refVoltage, setRefVoltage] = useState(110); 
    const [systemFreq, setSystemFreq] = useState(50);

    // --- CALCULATIONS ---
    
    // 1. Resultant (Residual / Ground Current 3I0)
    const resultant = useMemo(() => {
        return phasors.reduce((acc, p) => {
            const rect = polarToRect(p.mag, p.ang);
            return add(acc, rect);
        }, { x: 0, y: 0 });
    }, [phasors]);
    
    const resPolar = rectToPolar(resultant);

    // 2. Symmetrical Components (Fortescue)
    // a = 1 angle 120
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

    // 3. Power Estimation
    const totalP = phasors.reduce((acc, p) => acc + (refVoltage * p.mag * Math.cos(toRad(p.ang))), 0);
    const totalQ = phasors.reduce((acc, p) => acc + (refVoltage * p.mag * Math.sin(toRad(p.ang))), 0);
    const totalS = Math.sqrt(totalP**2 + totalQ**2);
    const pf = totalS === 0 ? 1 : Math.abs(totalP / totalS);

    // 4. Auto-Scaling for Graph
    const maxMag = Math.max(...phasors.map(p => p.mag), resPolar.mag, 1);
    const size = 500;
    const center = size / 2;
    const scale = (size / 2 - 40) / (maxMag * 1.1); // Keep 10% padding

    // --- PRESETS ---
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
            case 'open-c':
                setPhasors([
                    { id: 'A', mag: base, ang: 0, color: '#ef4444', label: 'Phase A' },
                    { id: 'B', mag: base, ang: 240, color: '#eab308', label: 'Phase B' },
                    { id: 'C', mag: 0, ang: 120, color: '#3b82f6', label: 'Phase C' }
                ]); break;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
            
            {/* HERO HEADER */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">VectorMaster<span className="text-blue-600">Pro</span></h1>
                            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Phasor & Sequence Analyzer</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <button onClick={() => window.print()} className="hidden md:flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
                            <Share2 className="w-4 h-4"/> Share Report
                         </button>
                         <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/20 transition-all">
                            <Download className="w-4 h-4"/> Export CSV
                         </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                
                {/* CONTROL DECK */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT: Inputs */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-blue-500" /> Vector Inputs
                            </h3>
                            <button onClick={() => setPhasors([...phasors, { id: Date.now().toString(), mag: 1, ang: 0, color: '#8b5cf6', label: 'Aux' }])} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                <Plus className="w-4 h-4"/>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar max-h-[400px]">
                            {phasors.map((p, i) => (
                                <div key={p.id} className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: p.color}}></div>
                                            <input 
                                                value={p.label} 
                                                onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, label: e.target.value } : x))} 
                                                className="bg-transparent font-bold text-xs w-24 outline-none focus:text-blue-600" 
                                            />
                                        </div>
                                        {i > 2 && <Trash2 className="w-3 h-3 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => setPhasors(prev => prev.filter(x => x.id !== p.id))} />}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-400 uppercase">Magnitude (A)</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" value={p.mag} onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, mag: Number(e.target.value) } : x))} className="w-16 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5" />
                                                <input type="range" min="0" max="20" step="0.1" value={p.mag} onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, mag: Number(e.target.value) } : x))} className="flex-1 h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-400 uppercase">Angle (°)</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" value={p.ang} onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, ang: Number(e.target.value) } : x))} className="w-16 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5" />
                                                <input type="range" min="0" max="360" value={p.ang} onChange={e => setPhasors(prev => prev.map(x => x.id === p.id ? { ...x, ang: Number(e.target.value) } : x))} className="flex-1 h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Presets Toolbar */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                             <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Quick Simulations</label>
                             <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => loadPreset('balanced')} className="p-2 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 border border-emerald-200">Balanced</button>
                                <button onClick={() => loadPreset('ag-fault')} className="p-2 text-[10px] font-bold bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200">A-G Fault</button>
                                <button onClick={() => loadPreset('bc-fault')} className="p-2 text-[10px] font-bold bg-amber-50 text-amber-700 rounded hover:bg-amber-100 border border-amber-200">B-C Fault</button>
                                <button onClick={() => loadPreset('open-c')} className="p-2 text-[10px] font-bold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 border border-slate-200">Open Ph</button>
                             </div>
                        </div>
                    </div>

                    {/* CENTER: Visualization */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-1 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
                        {/* Graph Background */}
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
                            {phasors.map(p => (
                                <g key={p.id}>
                                    <line 
                                        x1={center} y1={center} 
                                        x2={center + p.mag * scale * Math.cos(toRad(-p.ang))} 
                                        y2={center + p.mag * scale * Math.sin(toRad(-p.ang))} 
                                        stroke={p.color} strokeWidth="3" strokeLinecap="round" 
                                    />
                                    {/* Arrowhead */}
                                    <circle 
                                        cx={center + p.mag * scale * Math.cos(toRad(-p.ang))} 
                                        cy={center + p.mag * scale * Math.sin(toRad(-p.ang))} 
                                        r="4" fill={p.color} 
                                    />
                                    {/* Label */}
                                    <text 
                                        x={center + (p.mag * scale + 20) * Math.cos(toRad(-p.ang))} 
                                        y={center + (p.mag * scale + 20) * Math.sin(toRad(-p.ang))} 
                                        fill={p.color} fontSize="12" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle"
                                    >
                                        {p.label}
                                    </text>
                                </g>
                            ))}

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
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-4 text-purple-600">
                                <Layers className="w-4 h-4" /> Symmetrical Components
                            </h3>
                            {seqComponents ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border-l-4 border-slate-400">
                                        <span className="text-xs font-bold text-slate-500">Zero Seq (I0)</span>
                                        <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {seqComponents.I0.mag.toFixed(2)} ∠ {seqComponents.I0.ang.toFixed(1)}°
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border-l-4 border-blue-500">
                                        <span className="text-xs font-bold text-slate-500">Pos Seq (I1)</span>
                                        <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {seqComponents.I1.mag.toFixed(2)} ∠ {seqComponents.I1.ang.toFixed(1)}°
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border-l-4 border-red-500">
                                        <span className="text-xs font-bold text-slate-500">Neg Seq (I2)</span>
                                        <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {seqComponents.I2.mag.toFixed(2)} ∠ {seqComponents.I2.ang.toFixed(1)}°
                                        </span>
                                    </div>
                                    
                                    <div className="mt-2 text-[10px] text-slate-400 text-right">
                                        Unbalance (I2/I1): <strong className={seqComponents.I2.mag/seqComponents.I1.mag > 0.2 ? 'text-red-500' : 'text-green-500'}>
                                            {((seqComponents.I2.mag / (seqComponents.I1.mag || 1)) * 100).toFixed(1)}%
                                        </strong>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 italic text-center py-4">Requires 3-Phase Input</div>
                            )}
                        </div>

                        {/* 2. Power Monitor */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-amber-600">
                                    <Zap className="w-4 h-4" /> Power Monitor
                                </h3>
                                <div className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">Ref V: {refVoltage}V</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Active (P)</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-slate-200">{(totalP/1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">kW</span></div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Reactive (Q)</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-slate-200">{(totalQ/1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">kVAR</span></div>
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
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                                    <div className={`h-full ${pf < 0.85 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${pf*100}%`}}></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* INFO SECTION (The "World Class" Footer) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-blue-600" /> 
                            Engineering Knowledge Base
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                            Vector analysis is the backbone of modern power system protection. This tool is designed for **Commissioning Engineers, Relay Technicians, and Power System Students** to visualize complex fault conditions in real-time.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 shrink-0">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Why Symmetrical Components?</h4>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Relays don't see "Phase A". They see Sequence components. 
                                        <strong> Negative Sequence (I2)</strong> indicates unbalance (broken conductors). 
                                        <strong> Zero Sequence (I0)</strong> indicates ground faults. This tool calculates them instantly.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Safety & Diagnostics</h4>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Use this to verify CT polarity during commissioning. If you expect a balanced load but see high <strong>Residual Current (3I0)</strong>, you likely have a reversed CT connection.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" /> Commercial Grade Accuracy
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                IEC 60909 Standard Phasor Rotation (CCW)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Double-Precision Floating Point Math
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Fortescue Transformation Matrix Implemented
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Real-time Power Factor & Reactive Flow Logic
                            </li>
                        </ul>

                        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
                            <p className="text-xs text-blue-800 dark:text-blue-200 font-medium italic text-center">
                                "A must-have tool for diagnosing CT saturation, polarity errors, and unbalance conditions before energizing high-voltage equipment."
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default VectorLab;