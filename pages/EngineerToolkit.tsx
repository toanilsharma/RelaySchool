
import React, { useState, useMemo } from 'react';
import { Calculator, ArrowRight, Zap, Settings, Activity, Gauge, Cable, Scale, ArrowLeftRight, Search, Clock, Database, Lightbulb, PenTool, CheckCircle, AlertTriangle, Battery } from 'lucide-react';

// --- UTILITY 1: CURVE MATCHER ---
const CurveMatcher = () => {
    const [source, setSource] = useState<'IEC' | 'ANSI'>('IEC');
    const [curve, setCurve] = useState('SI');

    const IEC_OPTS = [
        { id: 'SI', label: 'Standard Inverse (A)', match: 'ANSI Moderately Inverse', desc: 'Similar slope at low currents.' },
        { id: 'VI', label: 'Very Inverse (B)', match: 'ANSI Very Inverse', desc: 'Good match. Both steep.' },
        { id: 'EI', label: 'Extremely Inverse (C)', match: 'ANSI Extremely Inverse', desc: 'Identical application (fuse grading).' },
        { id: 'LTI', label: 'Long Time Inverse', match: 'ANSI Long Time Inverse', desc: 'For motor overload protection.' }
    ];

    const ANSI_OPTS = [
        { id: 'MI', label: 'Moderately Inverse', match: 'IEC Standard Inverse', desc: 'General purpose distribution.' },
        { id: 'VI', label: 'Very Inverse', match: 'IEC Very Inverse', desc: 'Steep curve for grading.' },
        { id: 'EI', label: 'Extremely Inverse', match: 'IEC Extremely Inverse', desc: 'Fuse backup.' }
    ];

    const selected = source === 'IEC' ? IEC_OPTS.find(o => o.id === curve) : ANSI_OPTS.find(o => o.id === curve);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                    <ArrowLeftRight className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Curve Matcher</h3>
            </div>

            <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setSource('IEC')} className={`flex-1 py-1.5 text-xs font-bold rounded ${source === 'IEC' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}>IEC Input</button>
                <button onClick={() => setSource('ANSI')} className={`flex-1 py-1.5 text-xs font-bold rounded ${source === 'ANSI' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}>ANSI Input</button>
            </div>

            <div className="space-y-4 flex-1">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Select {source} Curve</label>
                    <select 
                        value={curve} 
                        onChange={(e) => setCurve(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {(source === 'IEC' ? IEC_OPTS : ANSI_OPTS).map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-xs text-slate-500 uppercase mb-1">Closest Equivalent</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {selected?.match}
                    </div>
                    <div className="text-xs text-slate-400 italic">
                        "{selected?.desc}"
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- UTILITY 2: CABLE CALCULATOR ---
const CableCalc = () => {
    const [csa, setCsa] = useState(120);
    const [fault, setFault] = useState(15); // kA
    const [material, setMaterial] = useState<'Cu' | 'Al'>('Cu');
    const [insulation, setInsulation] = useState<'XLPE' | 'PVC'>('XLPE');

    // K Factors (IEC 60364-5-54)
    const K_FACTORS = {
        'Cu_XLPE': 143,
        'Cu_PVC': 115,
        'Al_XLPE': 94,
        'Al_PVC': 76
    };

    const k = K_FACTORS[`${material}_${insulation}` as keyof typeof K_FACTORS];
    const timeLimit = Math.pow((k * csa) / (fault * 1000), 2);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                    <Cable className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Cable Damage</h3>
                    <p className="text-[10px] text-slate-500">Adiabatic Limit (t = k²S²/I²)</p>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Material</label>
                        <select value={material} onChange={(e) => setMaterial(e.target.value as any)} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200">
                            <option value="Cu">Copper</option>
                            <option value="Al">Aluminum</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Insulation</label>
                        <select value={insulation} onChange={(e) => setInsulation(e.target.value as any)} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200">
                            <option value="XLPE">XLPE</option>
                            <option value="PVC">PVC</option>
                        </select>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Size (CSA)</label>
                        <span className="text-xs font-mono text-slate-700 dark:text-slate-200">{csa} mm²</span>
                    </div>
                    <input type="range" min="1.5" max="630" step="0.5" value={csa} onChange={(e) => setCsa(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"/>
                </div>

                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Fault Current</label>
                        <span className="text-xs font-mono text-slate-700 dark:text-slate-200">{fault} kA</span>
                    </div>
                    <input type="range" min="1" max="50" step="0.5" value={fault} onChange={(e) => setFault(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                    <div className="text-xs text-slate-500 uppercase mb-1">Max Clearing Time</div>
                    <div className={`text-2xl font-mono font-bold ${timeLimit < 0.2 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                        {timeLimit < 0.01 ? '< 0.01' : timeLimit.toFixed(3)} s
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- UTILITY 3: FAULT CHECKER ---
const FaultChecker = () => {
    const [mode, setMode] = useState<'MVA' | 'kA'>('MVA'); // Input mode
    const [kv, setKv] = useState(11);
    const [val, setVal] = useState(250); // MVA or kA

    const result = mode === 'MVA' 
        ? val / (Math.sqrt(3) * kv) // MVA -> kA
        : val * Math.sqrt(3) * kv;  // kA -> MVA

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                    <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Fault Levels</h3>
            </div>

            <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => { setMode('MVA'); setVal(250); }} className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'MVA' ? 'bg-white dark:bg-slate-700 shadow text-red-600 dark:text-white' : 'text-slate-500'}`}>MVA &rarr; kA</button>
                <button onClick={() => { setMode('kA'); setVal(13.1); }} className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'kA' ? 'bg-white dark:bg-slate-700 shadow text-red-600 dark:text-white' : 'text-slate-500'}`}>kA &rarr; MVA</button>
            </div>

            <div className="space-y-4 flex-1">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">System Voltage (kV)</label>
                    <input type="number" value={kv} onChange={(e) => setKv(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-900 dark:text-white"/>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Short Circuit {mode}</label>
                    <input type="number" value={val} onChange={(e) => setVal(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-900 dark:text-white"/>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                    <div className="text-xs text-slate-500 uppercase mb-1">Result ({mode === 'MVA' ? 'kA' : 'MVA'})</div>
                    <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                        {result.toFixed(2)} {mode === 'MVA' ? 'kA' : 'MVA'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- UTILITY 4: CT BURDEN CHECK ---
const CTCheck = () => {
    const [ctClass, setCtClass] = useState('5P20');
    const [ratedBurden, setRatedBurden] = useState(15); // VA
    const [ratedAmps, setRatedAmps] = useState(1); // 1A or 5A
    const [actualBurden, setActualBurden] = useState(5); // Ohms

    // ALF' = ALF * (Rct + Rb_rated) / (Rct + Rb_actual)
    // Approx: Rct ~ 0.2 ohms for 1A, ~0.05 for 5A (Very rough, but okay for estimation)
    const Rct = ratedAmps === 1 ? 0.5 : 0.1;
    const Rb_rated = ratedBurden / (ratedAmps * ratedAmps);
    
    // Parse ALF from class (5P20 -> 20)
    const alfRated = parseInt(ctClass.split('P')[1]) || 20;
    
    const alfActual = alfRated * (Rct + Rb_rated) / (Rct + actualBurden);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                    <Scale className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">CT Saturation</h3>
            </div>

            <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Class</label>
                        <input type="text" value={ctClass} onChange={(e) => setCtClass(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm uppercase text-slate-900 dark:text-white"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Secondary</label>
                        <select value={ratedAmps} onChange={(e) => setRatedAmps(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200">
                            <option value="1">1 Amp</option>
                            <option value="5">5 Amp</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Rated VA</label>
                        <input type="number" value={ratedBurden} onChange={(e) => setRatedBurden(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Loop &Omega;</label>
                        <input type="number" step="0.1" value={actualBurden} onChange={(e) => setActualBurden(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"/>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                    <div className="text-xs text-slate-500 uppercase mb-1">True ALF Limit</div>
                    <div className={`text-2xl font-mono font-bold ${alfActual < 20 ? 'text-amber-500' : 'text-green-500'}`}>
                        {alfActual.toFixed(1)}x
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                        Rated: {alfRated}x | Burden: {Rb_rated.toFixed(2)}Ω
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- UTILITY 5: PER UNIT CONVERTER ---
const PerUnitCalc = () => {
    const [baseMva, setBaseMva] = useState(100);
    const [baseKv, setBaseKv] = useState(132);
    const [val, setVal] = useState(10); // Ohm or PU
    const [mode, setMode] = useState<'OHM_TO_PU' | 'PU_TO_OHM'>('OHM_TO_PU');

    const zBase = (baseKv * baseKv) / baseMva;
    const result = mode === 'OHM_TO_PU' ? val / zBase : val * zBase;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                    <Gauge className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Per Unit (p.u.)</h3>
            </div>

            <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setMode('OHM_TO_PU')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${mode === 'OHM_TO_PU' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-white' : 'text-slate-500'}`}>Ω &rarr; p.u.</button>
                <button onClick={() => setMode('PU_TO_OHM')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${mode === 'PU_TO_OHM' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-white' : 'text-slate-500'}`}>p.u. &rarr; Ω</button>
            </div>

            <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Base MVA</label>
                        <input type="number" value={baseMva} onChange={(e) => setBaseMva(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Base kV</label>
                        <input type="number" value={baseKv} onChange={(e) => setBaseKv(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"/>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{mode === 'OHM_TO_PU' ? 'Impedance (Ω)' : 'Value (p.u.)'}</label>
                    <input type="number" step="0.01" value={val} onChange={(e) => setVal(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-900 dark:text-white"/>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                    <div className="text-xs text-slate-500 uppercase mb-1">Result</div>
                    <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                        {result.toFixed(4)} <span className="text-sm text-slate-400">{mode === 'OHM_TO_PU' ? 'p.u.' : 'Ω'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Zbase = {zBase.toFixed(2)} Ω</div>
                </div>
            </div>
        </div>
    );
};

// --- UTILITY 6: POWER CALCULATOR ---
const PowerCalc = () => {
    const [kv, setKv] = useState(33);
    const [amps, setAmps] = useState(100);
    const [pf, setPf] = useState(0.85);

    const s = Math.sqrt(3) * kv * amps / 1000; // MVA
    const p = s * pf; // MW
    const q = s * Math.sin(Math.acos(pf)); // MVAR

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                    <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Power Triangle</h3>
            </div>

            <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Voltage (kV)</label>
                        <input type="number" value={kv} onChange={(e) => setKv(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Current (A)</label>
                        <input type="number" value={amps} onChange={(e) => setAmps(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"/>
                    </div>
                </div>
                <div>
                    <label className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                        <span>Power Factor</span>
                        <span>{pf}</span>
                    </label>
                    <input type="range" min="0.1" max="1.0" step="0.01" value={pf} onChange={(e) => setPf(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 mt-auto">
                    <div className="text-center">
                        <div className="text-[10px] text-slate-500 font-bold">Apparent</div>
                        <div className="text-sm font-mono font-bold text-indigo-500">{s.toFixed(2)}</div>
                        <div className="text-[8px] text-slate-400">MVA</div>
                    </div>
                    <div className="text-center border-x border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold">Real</div>
                        <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">{p.toFixed(2)}</div>
                        <div className="text-[8px] text-slate-400">MW</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-slate-500 font-bold">Reactive</div>
                        <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">{q.toFixed(2)}</div>
                        <div className="text-[8px] text-slate-400">MVAR</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- UTILITY 7: ANSI SEARCH ---
const AnsiSearch = () => {
    const [search, setSearch] = useState('');
    
    const CODES = [
        { c: '21', n: 'Distance', d: 'Impedance protection' },
        { c: '25', n: 'Sync Check', d: 'Paralleling device' },
        { c: '27', n: 'Undervoltage', d: 'Low V trip' },
        { c: '32', n: 'Directional Power', d: 'Anti-motoring' },
        { c: '46', n: 'Reverse Phase', d: 'Current unbalance' },
        { c: '49', n: 'Thermal', d: 'Cable/Transformer Overload' },
        { c: '50', n: 'Instantaneous OC', d: 'Short circuit' },
        { c: '51', n: 'Time OC', d: 'Overload / Grading' },
        { c: '59', n: 'Overvoltage', d: 'Generator protection' },
        { c: '67', n: 'Directional OC', d: 'Ring main protection' },
        { c: '79', n: 'Reclosing', d: 'Auto-recloser logic' },
        { c: '81', n: 'Frequency', d: 'U/O Frequency load shed' },
        { c: '86', n: 'Lockout', d: 'Master trip relay' },
        { c: '87', n: 'Differential', d: 'Unit protection' },
    ];

    const filtered = CODES.filter(c => c.c.includes(search) || c.n.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full max-h-[360px]">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                    <Database className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">ANSI Device Codes</h3>
            </div>

            <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search code or name..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filtered.map(c => (
                    <div key={c.c} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                        <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded text-sm">{c.c}</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.n}</span>
                                <span className="text-[10px] text-slate-400">{c.d}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <div className="text-center text-slate-400 text-sm mt-4">No codes found.</div>}
            </div>
        </div>
    );
};

// --- UTILITY 8: FREQUENCY CONVERTER ---
const TimeConverter = () => {
    const [freq, setFreq] = useState(60);
    const [cycles, setCycles] = useState(5);
    
    const ms = (cycles / freq) * 1000;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600">
                    <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Time & Cycles</h3>
            </div>

            <div className="space-y-6 flex-1">
                <div className="flex justify-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setFreq(50)} className={`flex-1 py-1 text-xs font-bold rounded ${freq === 50 ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-white' : 'text-slate-500'}`}>50 Hz</button>
                    <button onClick={() => setFreq(60)} className={`flex-1 py-1 text-xs font-bold rounded ${freq === 60 ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-white' : 'text-slate-500'}`}>60 Hz</button>
                </div>

                <div>
                    <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                        <span>Cycles</span>
                        <span className="text-slate-900 dark:text-white">{cycles}</span>
                    </label>
                    <input type="range" min="0.5" max="60" step="0.5" value={cycles} onChange={(e) => setCycles(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                    <div className="text-xs text-slate-500 uppercase mb-1">Duration</div>
                    <div className="text-3xl font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {ms.toFixed(1)} <span className="text-sm text-slate-400">ms</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                        {(ms/1000).toFixed(4)} Seconds
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- UTILITY 9: BATTERY SIZING (New) ---
const BatterySizer = () => {
    const [loadA, setLoadA] = useState(10);
    const [durationH, setDurationH] = useState(8);
    const [tripA, setTripA] = useState(50);
    
    // IEEE 485 Simplified: Ah = (Load * Duration) + (Trip * 1 minute factor)
    // Assuming 1 minute trip duration approx 0.016 hours, but aging factor 1.25 and design margin 1.1
    // Total Ah = (Continuous Load * Hours + Trip Load * 0.02) * 1.25 * 1.1
    const ah = ((loadA * durationH) + (tripA * 0.5/60)) * 1.25 * 1.1;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                    <Battery className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Battery Sizer</h3>
            </div>

            <div className="space-y-4 flex-1">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Standing Load (A)</label>
                    <input type="number" value={loadA} onChange={(e) => setLoadA(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Backup Time (Hours)</label>
                    <input type="number" value={durationH} onChange={(e) => setDurationH(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Trip Current (A)</label>
                    <input type="number" value={tripA} onChange={(e) => setTripA(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white"/>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                    <div className="text-xs text-slate-500 uppercase mb-1">Required Capacity</div>
                    <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.ceil(ah)} <span className="text-sm text-slate-400">Ah</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Incl. 25% Aging + 10% Margin</div>
                </div>
            </div>
        </div>
    );
};

const EngineerToolkit = () => {
    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Calculator className="w-8 h-8 text-blue-600" /> Engineer Toolkit
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Essential offline calculators for daily protection studies.
                    </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Tools run locally in browser
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <CurveMatcher />
                <CableCalc />
                <FaultChecker />
                <CTCheck />
                <PerUnitCalc />
                <PowerCalc />
                <AnsiSearch />
                <TimeConverter />
                <BatterySizer />
            </div>

            {/* --- RICH CONTENT SECTION --- */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800 mt-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-blue-500" /> Back-of-the-Envelope
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        In a digital world, manual verification is critical. Always double-check software results with these quick estimates. 
                        A <strong>5P20</strong> CT means it maintains accuracy up to 20x rated current, assuming the burden is within limits.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Adiabatic Heating
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Cables heat up instantly during faults. The $t = k^2 S^2 / I^2$ formula ensures the insulation (XLPE/PVC) doesn't melt before the breaker trips. If your clearing time exceeds this limit, you risk a fire.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" /> Per Unit System
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Why use 'p.u.'? It normalizes voltage levels across transformers. In a 132/33kV system, 1.0 pu voltage is 132kV on the primary and 33kV on the secondary, making calculations transformer-agnostic.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default EngineerToolkit;
