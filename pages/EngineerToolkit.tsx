import React, { useState, useMemo } from 'react';
import { 
    Calculator, ArrowRight, Zap, Settings, Activity, Gauge, Cable, Scale, 
    ArrowLeftRight, Search, Clock, Database, Lightbulb, PenTool, CheckCircle, 
    AlertTriangle, Battery, ChevronDown, ChevronUp, Box, ArrowDownToLine, Waves,
    Plug, Fan, Triangle, Magnet
} from 'lucide-react';
import PageSEO from '../components/SEO/PageSEO';

// --- INLINED COMPONENTS ---


const Slider = ({ label, unit, min, max, step, value, onChange, color }) => {
    const colorMap = {
        amber: 'accent-amber-500',
        red: 'accent-red-500',
        indigo: 'accent-indigo-500',
        cyan: 'accent-cyan-500',
        emerald: 'accent-emerald-500',
        blue: 'accent-blue-500',
        purple: 'accent-purple-500',
        rose: 'accent-rose-500',
        orange: 'accent-orange-500',
        teal: 'accent-teal-500',
        pink: 'accent-pink-500',
        default: 'accent-blue-500'
    };
    const accentClass = colorMap[color] || colorMap.default;

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{value}{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className={`w-full ${accentClass} transition-all`}
            />
        </div>
    );
};

// --- WRAPPER FOR UNIFORMITY & ANIMATIONS ---
const CalcCard = ({ title, icon: Icon, colorClass, children, formula, calculationSteps, delayIndex }) => {
    const [showMath, setShowMath] = useState(false);

    // Animation classes with staggered delays
    const delays = ['delay-0', 'delay-75', 'delay-150', 'delay-200', 'delay-300', 'delay-500', 'delay-700'];
    const delayClass = delays[delayIndex % delays.length];

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8 ${delayClass}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                </div>
            </div>

            <div className="flex-1 flex flex-col space-y-4">
                {children}
            </div>

            {/* Explanation / Math Breakdown Section */}
            {formula && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={() => setShowMath(!showMath)}
                        className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                    >
                        <span>Calculation Details</span>
                        {showMath ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    
                    {showMath && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs font-mono animate-in fade-in slide-in-from-top-2 border border-slate-200 dark:border-slate-800">
                            <div className="text-blue-600 dark:text-blue-400 font-bold mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                Formula: {formula}
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 space-y-1">
                                {calculationSteps.map((step, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <span className="opacity-50">↳</span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// --- UTILITY 1: CURVE MATCHER ---
const CurveMatcher = ({ idx }) => {
    const [source, setSource] = useState('IEC');
    const [curve, setCurve] = useState('SI');

    const IEC_OPTS = [
        { id: 'SI', label: 'Standard Inverse', match: 'ANSI Moderately Inverse', k: '0.14', a: '0.02' },
        { id: 'VI', label: 'Very Inverse', match: 'ANSI Very Inverse', k: '13.5', a: '1.0' },
        { id: 'EI', label: 'Extremely Inverse', match: 'ANSI Extremely Inverse', k: '80', a: '2.0' }
    ];
    const ANSI_OPTS = [
        { id: 'MI', label: 'Moderately Inverse', match: 'IEC Standard Inverse', A: '0.0515', B: '0.114', P: '0.02' },
        { id: 'VI', label: 'Very Inverse', match: 'IEC Very Inverse', A: '19.61', B: '0.491', P: '2.0' },
        { id: 'EI', label: 'Extremely Inverse', match: 'IEC Extremely Inverse', A: '28.2', B: '0.1217', P: '2.0' }
    ];

    const selected = source === 'IEC' ? IEC_OPTS.find(o => o.id === curve) : ANSI_OPTS.find(o => o.id === curve);

    const steps = source === 'IEC' 
        ? [`k = ${(selected as any).k}`, `α = ${(selected as any).a}`, `Note: IEC limits are based on cold curves.`]
        : [`A = ${(selected as any).A}`, `B = ${(selected as any).B}`, `P = ${(selected as any).P}`, `Matches IEEE C37.112 specification.`];

    return (
        <CalcCard title="Curve Matcher" icon={ArrowLeftRight} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600" delayIndex={idx}
            formula={source === 'IEC' ? 't = TMS × (k / ((I/Is)^α - 1))' : 't = TD × (A / ((I/Is)^P - 1) + B)'}
            calculationSteps={steps}>
            
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => {setSource('IEC'); setCurve('SI');}} className={`flex-1 py-1.5 text-xs font-bold rounded ${source === 'IEC' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}>IEC</button>
                <button onClick={() => {setSource('ANSI'); setCurve('MI');}} className={`flex-1 py-1.5 text-xs font-bold rounded ${source === 'ANSI' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}>ANSI</button>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Select {source} Curve</label>
                <select value={curve} onChange={(e) => setCurve(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {(source === 'IEC' ? IEC_OPTS : ANSI_OPTS).map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Closest Equivalent</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{(selected as any)?.match}</div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 2: CABLE CALCULATOR ---
const CableCalc = ({ idx }) => {
    const [csa, setCsa] = useState(120);
    const [fault, setFault] = useState(15);
    const [material, setMaterial] = useState('Cu');
    const [insulation, setInsulation] = useState('XLPE');

    const K_FACTORS = { 'Cu_XLPE': 143, 'Cu_PVC': 115, 'Al_XLPE': 94, 'Al_PVC': 76 };
    const k = K_FACTORS[`${material}_${insulation}`];
    const timeLimit = Math.pow((k * csa) / (fault * 1000), 2);

    return (
        <CalcCard title="Cable Damage" icon={Cable} colorClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600" delayIndex={idx}
            formula="t = (k² × S²) / I²"
            calculationSteps={[
                `k (Material factor) = ${k}`,
                `S (Cross-section) = ${csa} mm²`,
                `I (Fault current) = ${fault * 1000} A`,
                `t = (${k}² × ${csa}²) / ${fault*1000}²`,
                `t = ${(k*k*csa*csa).toExponential(2)} / ${(fault*1000*fault*1000).toExponential(2)} = ${timeLimit.toFixed(3)}s`
            ]}>
            
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Material</label>
                    <select value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm">
                        <option value="Cu">Copper</option>
                        <option value="Al">Aluminum</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Insulation</label>
                    <select value={insulation} onChange={(e) => setInsulation(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm">
                        <option value="XLPE">XLPE</option>
                        <option value="PVC">PVC</option>
                    </select>
                </div>
            </div>

            <Slider label="Size (CSA)" unit=" mm²" min={1.5} max={630} step={0.5} value={csa} onChange={e => setCsa(Number(e.target.value))} color="amber" />
            <Slider label="Fault Current" unit=" kA" min={1} max={50} step={0.5} value={fault} onChange={e => setFault(Number(e.target.value))} color="red" />

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Max Clearing Time (IEC 60364)</div>
                <div className={`text-2xl font-mono font-bold ${timeLimit < 0.2 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                    {timeLimit < 0.01 ? '< 0.01' : timeLimit.toFixed(3)} s
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 3: FAULT CHECKER ---
const FaultChecker = ({ idx }) => {
    const [mode, setMode] = useState('MVA'); 
    const [kv, setKv] = useState(11);
    const [val, setVal] = useState(250);

    const result = mode === 'MVA' ? val / (Math.sqrt(3) * kv) : val * Math.sqrt(3) * kv;

    return (
        <CalcCard title="Fault Levels" icon={Zap} colorClass="bg-red-100 dark:bg-red-900/30 text-red-600" delayIndex={idx}
            formula={mode === 'MVA' ? 'Isc = MVA / (√3 × kV)' : 'MVA = √3 × kV × Isc'}
            calculationSteps={[
                `kV = ${kv} kV`,
                mode === 'MVA' ? `MVAsc = ${val} MVA` : `Isc = ${val} kA`,
                mode === 'MVA' 
                    ? `Isc = ${val} / (1.732 × ${kv})` 
                    : `MVA = 1.732 × ${kv} × ${val}`,
                `Result = ${result.toFixed(2)} ${mode === 'MVA' ? 'kA' : 'MVA'}`
            ]}>
            
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => { setMode('MVA'); setVal(250); }} className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'MVA' ? 'bg-white dark:bg-slate-700 shadow text-red-600 dark:text-white' : 'text-slate-500'}`}>MVA &rarr; kA</button>
                <button onClick={() => { setMode('kA'); setVal(13.1); }} className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'kA' ? 'bg-white dark:bg-slate-700 shadow text-red-600 dark:text-white' : 'text-slate-500'}`}>kA &rarr; MVA</button>
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">System Voltage (kV)</label>
                <input type="number" min="0" value={kv} onChange={(e) => setKv(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm"/>
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Short Circuit {mode}</label>
                <input type="number" min="0" value={val} onChange={(e) => setVal(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm"/>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Result ({mode === 'MVA' ? 'kA' : 'MVA'})</div>
                <div className="text-2xl font-mono font-bold text-red-600 dark:text-red-400">
                    {result.toFixed(2)} {mode === 'MVA' ? 'kA' : 'MVA'}
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 4: CT BURDEN CHECK ---
const CTCheck = ({ idx }) => {
    const [ctClass, setCtClass] = useState('5P20');
    const [ratedBurden, setRatedBurden] = useState(15);
    const [ratedAmps, setRatedAmps] = useState(1);
    const [actualBurden, setActualBurden] = useState(5);

    const Rct = ratedAmps === 1 ? 0.5 : 0.1;
    const Rb_rated = ratedBurden / (ratedAmps * ratedAmps);
    const alfRated = parseInt(ctClass.split('P')[1]) || 20;
    const alfActual = alfRated * (Rct + Rb_rated) / (Rct + actualBurden);

    return (
        <CalcCard title="CT Saturation" icon={Scale} colorClass="bg-green-100 dark:bg-green-900/30 text-green-600" delayIndex={idx}
            formula="ALF' = ALF_rated × (Rct + Rbn) / (Rct + Rb_act)"
            calculationSteps={[
                `Rct (Internal) ≈ ${Rct} Ω (estimated for ${ratedAmps}A)`,
                `Rbn (Rated Burden) = VA / I² = ${ratedBurden} / ${ratedAmps}² = ${Rb_rated} Ω`,
                `Rb_act (Connected Loop) = ${actualBurden} Ω`,
                `ALF' = ${alfRated} × (${Rct} + ${Rb_rated}) / (${Rct} + ${actualBurden})`,
                `ALF' = ${alfRated} × ${(Rct+Rb_rated).toFixed(2)} / ${(Rct+actualBurden).toFixed(2)} = ${alfActual.toFixed(1)}`
            ]}>
            
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Class (e.g. 5P20)</label>
                    <input type="text" value={ctClass} onChange={(e) => setCtClass(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm uppercase"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Secondary</label>
                    <select value={ratedAmps} onChange={(e) => setRatedAmps(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm">
                        <option value="1">1 Amp</option>
                        <option value="5">5 Amp</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Rated VA</label>
                    <input type="number" min="0" value={ratedBurden} onChange={(e) => setRatedBurden(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Loop &Omega;</label>
                    <input type="number" min="0" step="0.1" value={actualBurden} onChange={(e) => setActualBurden(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">True Accuracy Limit Factor (ALF')</div>
                <div className={`text-2xl font-mono font-bold ${alfActual < 20 ? 'text-amber-500' : 'text-green-500'}`}>
                    {alfActual.toFixed(1)}x
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 5: PER UNIT CONVERTER ---
const PerUnitCalc = ({ idx }) => {
    const [baseMva, setBaseMva] = useState(100);
    const [baseKv, setBaseKv] = useState(132);
    const [val, setVal] = useState(10); 
    const [mode, setMode] = useState('OHM_TO_PU');

    const zBase = (baseKv * baseKv) / baseMva;
    const result = mode === 'OHM_TO_PU' ? val / zBase : val * zBase;

    return (
        <CalcCard title="Per Unit (p.u.)" icon={Gauge} colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600" delayIndex={idx}
            formula={mode === 'OHM_TO_PU' ? 'Z(pu) = Z(Ω) / Z_base' : 'Z(Ω) = Z(pu) × Z_base'}
            calculationSteps={[
                `Z_base = kV² / MVA`,
                `Z_base = ${baseKv}² / ${baseMva} = ${zBase.toFixed(2)} Ω`,
                mode === 'OHM_TO_PU' 
                    ? `Z(pu) = ${val} / ${zBase.toFixed(2)} = ${result.toFixed(4)} p.u.`
                    : `Z(Ω) = ${val} × ${zBase.toFixed(2)} = ${result.toFixed(4)} Ω`
            ]}>
            
            <div className="flex gap-2 mb-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setMode('OHM_TO_PU')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${mode === 'OHM_TO_PU' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}>Ω &rarr; p.u.</button>
                <button onClick={() => setMode('PU_TO_OHM')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${mode === 'PU_TO_OHM' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}>p.u. &rarr; Ω</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Base MVA</label>
                    <input type="number" min="0" value={baseMva} onChange={(e) => setBaseMva(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Base kV</label>
                    <input type="number" min="0" value={baseKv} onChange={(e) => setBaseKv(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">{mode === 'OHM_TO_PU' ? 'Impedance (Ω)' : 'Value (p.u.)'}</label>
                <input type="number" min="0" step="0.01" value={val} onChange={(e) => setVal(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm"/>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Result</div>
                <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
                    {result.toFixed(4)} <span className="text-sm text-slate-400">{mode === 'OHM_TO_PU' ? 'p.u.' : 'Ω'}</span>
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 6: POWER CALCULATOR ---
const PowerCalc = ({ idx }) => {
    const [kv, setKv] = useState(33);
    const [amps, setAmps] = useState(100);
    const [pf, setPf] = useState(0.85);

    const s = Math.sqrt(3) * kv * amps / 1000; 
    const p = s * pf; 
    const q = s * Math.sin(Math.acos(pf)); 

    return (
        <CalcCard title="Power Triangle" icon={Lightbulb} colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" delayIndex={idx}
            formula="S = √3 × V × I"
            calculationSteps={[
                `S (Apparent) = √3 × ${kv}kV × ${amps}A = ${s.toFixed(2)} MVA`,
                `P (Real) = S × cos(θ) = ${s.toFixed(2)} × ${pf} = ${p.toFixed(2)} MW`,
                `Q (Reactive) = S × sin(cos⁻¹(${pf})) = ${s.toFixed(2)} × ${Math.sin(Math.acos(pf)).toFixed(2)} = ${q.toFixed(2)} MVAR`
            ]}>
            
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Voltage (kV)</label>
                    <input type="number" min="0" value={kv} onChange={(e) => setKv(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Current (A)</label>
                    <input type="number" min="0" value={amps} onChange={(e) => setAmps(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
            </div>
            <Slider label="Power Factor" unit="" min={0.1} max={1.0} step={0.01} value={pf} onChange={e => setPf(Number(e.target.value))} color="indigo" />

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
        </CalcCard>
    );
};

// --- UTILITY 7: TRANSFORMER S/C CALC (NEW) ---
const TransformerCalc = ({ idx }) => {
    const [kva, setKva] = useState(1000);
    const [z, setZ] = useState(5.75); // %
    const [secKv, setSecKv] = useState(0.433);

    const fla = kva / (Math.sqrt(3) * secKv);
    const isc = fla / (z / 100);

    return (
        <CalcCard title="Transformer S/C" icon={Box} colorClass="bg-rose-100 dark:bg-rose-900/30 text-rose-600" delayIndex={idx}
            formula="I_sc = I_FLA / Z_pu"
            calculationSteps={[
                `FLA = ${kva}kVA / (√3 × ${secKv}kV) = ${fla.toFixed(0)} A`,
                `Z_pu = ${z}% / 100 = ${(z/100).toFixed(4)}`,
                `Max Sec. Fault (Isc) = ${fla.toFixed(0)}A / ${(z/100).toFixed(4)} = ${isc.toFixed(0)} A`
            ]}>
            
            <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Rating (kVA)</label>
                    <input type="number" min="0" value={kva} onChange={(e) => setKva(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Impedance (%Z)</label>
                    <input type="number" min="0" step="0.1" value={z} onChange={(e) => setZ(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
            </div>
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Secondary (kV L-L)</label>
                <input type="number" min="0" step="0.001" value={secKv} onChange={(e) => setSecKv(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm"/>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 mt-auto">
                <div className="text-center border-r border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-bold">Sec. Full Load</div>
                    <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">{fla.toFixed(0)} A</div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-slate-500 font-bold">Max S/C Current</div>
                    <div className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400">{(isc/1000).toFixed(2)} kA</div>
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 8: VOLTAGE DROP (NEW) ---
const VoltageDrop = ({ idx }) => {
    const [length, setLength] = useState(100);
    const [current, setCurrent] = useState(50);
    const [csa, setCsa] = useState(35);
    const [mat, setMat] = useState('Cu');
    const [sysV, setSysV] = useState(400);

    const rho = mat === 'Cu' ? 0.0175 : 0.0282; // ohm.mm2/m
    const vd = (Math.sqrt(3) * current * length * rho) / csa;
    const perc = (vd / sysV) * 100;

    return (
        <CalcCard title="Voltage Drop (3Φ)" icon={ArrowDownToLine} colorClass="bg-pink-100 dark:bg-pink-900/30 text-pink-600" delayIndex={idx}
            formula="Vd = (√3 × I × L × ρ) / A"
            calculationSteps={[
                `ρ (${mat}) = ${rho} Ω·mm²/m`,
                `Vd = (1.732 × ${current}A × ${length}m × ${rho}) / ${csa}mm²`,
                `Vd = ${vd.toFixed(2)} V`,
                `% Drop = (${vd.toFixed(2)} / ${sysV}V) × 100 = ${perc.toFixed(2)}%`
            ]}>
            
            <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Length (m)</label>
                    <input type="number" min="0" value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-sm"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Load (A)</label>
                    <input type="number" min="0" value={current} onChange={(e) => setCurrent(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-sm"/>
                </div>
            </div>
            
            <div className="flex gap-2 mb-2">
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cable</label>
                    <select value={mat} onChange={(e) => setMat(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm">
                        <option value="Cu">Copper</option>
                        <option value="Al">Aluminum</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Size (mm²)</label>
                    <select value={csa} onChange={(e) => setCsa(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm">
                        {[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 mt-auto">
                <div className="text-center border-r border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-bold">Vd Absolute</div>
                    <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">{vd.toFixed(2)} V</div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-slate-500 font-bold">% Drop</div>
                    <div className={`text-sm font-mono font-bold ${perc > 5 ? 'text-red-500' : 'text-pink-600 dark:text-pink-400'}`}>{perc.toFixed(2)} %</div>
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 9: GROUNDING ROD (NEW) ---
const GroundRodCalc = ({ idx }) => {
    const [rho, setRho] = useState(100); 
    const [L, setL] = useState(3); 
    const [d, setD] = useState(16); // mm

    const radiusMeters = (d / 1000) / 2;
    const logTerm = Math.log((4 * L) / radiusMeters);
    const R = (rho / (2 * Math.PI * L)) * (logTerm - 1);

    return (
        <CalcCard title="Ground Rod (IEEE 80)" icon={Waves} colorClass="bg-teal-100 dark:bg-teal-900/30 text-teal-600" delayIndex={idx}
            formula="R = (ρ / 2πL) × [ln(4L/a) - 1]"
            calculationSteps={[
                `a (Radius) = ${d}mm / 2 = ${radiusMeters} m`,
                `ln(4L/a) = ln(${12} / ${radiusMeters}) = ${logTerm.toFixed(3)}`,
                `R = (${rho} / ${2 * Math.PI * L}) × [${logTerm.toFixed(3)} - 1]`,
                `R = ${(rho / (2 * Math.PI * L)).toFixed(3)} × ${(logTerm - 1).toFixed(3)} = ${R.toFixed(2)} Ω`
            ]}>
            
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Soil Resistivity (ρ)</label>
                <div className="flex items-center gap-2">
                    <input type="number" min="0" value={rho} onChange={(e) => setRho(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm"/>
                    <span className="text-xs text-slate-500">Ω·m</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Length (m)</label>
                    <input type="number" min="0" step="0.5" value={L} onChange={(e) => setL(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Diameter (mm)</label>
                    <input type="number" min="0" step="1" value={d} onChange={(e) => setD(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Single Rod Resistance</div>
                <div className={`text-2xl font-mono font-bold ${R > 5 ? 'text-amber-500' : 'text-teal-600 dark:text-teal-400'}`}>
                    {R.toFixed(2)} <span className="text-sm text-slate-400">Ω</span>
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 10: FREQUENCY CONVERTER ---
const TimeConverter = ({ idx }) => {
    const [freq, setFreq] = useState(60);
    const [cycles, setCycles] = useState(5);
    const ms = (cycles / freq) * 1000;

    return (
        <CalcCard title="Time & Cycles" icon={Clock} colorClass="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600" delayIndex={idx}
            formula="t(ms) = (Cycles / Frequency) × 1000"
            calculationSteps={[
                `Frequency = ${freq} Hz`,
                `t = (${cycles} / ${freq}) × 1000`,
                `t = ${(cycles/freq).toFixed(4)} × 1000 = ${ms.toFixed(1)} ms`
            ]}>
            
            <div className="flex justify-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
                <button onClick={() => setFreq(50)} className={`flex-1 py-1 text-xs font-bold rounded ${freq === 50 ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-white' : 'text-slate-500'}`}>50 Hz</button>
                <button onClick={() => setFreq(60)} className={`flex-1 py-1 text-xs font-bold rounded ${freq === 60 ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-white' : 'text-slate-500'}`}>60 Hz</button>
            </div>

            <Slider label="Cycles" unit=" cyc" min={0.5} max={60} step={0.5} value={cycles} onChange={e => setCycles(Number(e.target.value))} color="cyan" />

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Duration</div>
                <div className="text-3xl font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {ms.toFixed(1)} <span className="text-sm text-slate-400">ms</span>
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 11: BATTERY SIZING ---
const BatterySizer = ({ idx }) => {
    const [loadA, setLoadA] = useState(10);
    const [durationH, setDurationH] = useState(8);
    const [tripA, setTripA] = useState(50);
    
    // Total Ah = (Continuous Load * Hours + Trip Load * (1min/60)) * 1.25 * 1.1
    const tripHours = 1/60;
    const baseAh = (loadA * durationH) + (tripA * tripHours);
    const ah = baseAh * 1.25 * 1.1;

    return (
        <CalcCard title="Battery Sizer (IEEE 485)" icon={Battery} colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" delayIndex={idx}
            formula="Ah = [ (L1×T1) + (L2×T2) ] × K_age × K_margin"
            calculationSteps={[
                `Base Ah = (${loadA}A × ${durationH}h) + (${tripA}A × 1min)`,
                `Base Ah = ${loadA * durationH} + ${(tripA * tripHours).toFixed(2)} = ${baseAh.toFixed(2)} Ah`,
                `K_age (Aging Factor) = 1.25 (25% buffer)`,
                `K_margin (Design Margin) = 1.10 (10% buffer)`,
                `Total = ${baseAh.toFixed(2)} × 1.25 × 1.1 = ${ah.toFixed(2)} Ah`
            ]}>
            
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Standing Load (A)</label>
                <input type="number" min="0" value={loadA} onChange={(e) => setLoadA(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
            </div>
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Backup Time (Hours)</label>
                <input type="number" min="0" value={durationH} onChange={(e) => setDurationH(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
            </div>
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Trip Current (A) - 1 Min Duration</label>
                <input type="number" min="0" value={tripA} onChange={(e) => setTripA(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Required Capacity</div>
                <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.ceil(ah)} <span className="text-sm text-slate-400">Ah</span>
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 12: ANSI SEARCH (No math steps needed) ---
const AnsiSearch = ({ idx }) => {
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
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8 max-h-[460px] delay-${idx*100}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                    <Database className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">ANSI Codes</h3>
            </div>
            <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search code..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filtered.map(c => (
                    <div key={c.c} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm w-8 text-center">{c.c}</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.n}</span>
                                <span className="text-[10px] text-slate-400">{c.d}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- UTILITY 13: PF CORRECTION (NEW) ---
const PFCorrection = ({ idx }) => {
    const [kw, setKw] = useState(500);
    const [pf1, setPf1] = useState(0.75);
    const [pf2, setPf2] = useState(0.95);

    const angle1 = Math.acos(pf1);
    const angle2 = Math.acos(pf2);
    const kvar1 = kw * Math.tan(angle1);
    const kvar2 = kw * Math.tan(angle2);
    const kvarReq = kvar1 - kvar2;

    return (
        <CalcCard title="Capacitor Sizing (PF)" icon={Plug} colorClass="bg-teal-100 dark:bg-teal-900/30 text-teal-600" delayIndex={idx}
            formula="Q_c = P × (tan(cos⁻¹(PF1)) - tan(cos⁻¹(PF2)))"
            calculationSteps={[
                `P = ${kw} kW`,
                `Initial θ1 = cos⁻¹(${pf1}) = ${(angle1 * 180 / Math.PI).toFixed(1)}°`,
                `Target θ2 = cos⁻¹(${pf2}) = ${(angle2 * 180 / Math.PI).toFixed(1)}°`,
                `Initial Q1 = ${kw} × tan(${angle1.toFixed(3)}) = ${kvar1.toFixed(1)} kVAR`,
                `Target Q2 = ${kw} × tan(${angle2.toFixed(3)}) = ${kvar2.toFixed(1)} kVAR`,
                `Required Qc = ${kvar1.toFixed(1)} - ${kvar2.toFixed(1)} = ${kvarReq.toFixed(1)} kVAR`
            ]}>
            
            <Slider label="Real Power Load" unit=" kW" min={10} max={5000} step={10} value={kw} onChange={e => setKw(Number(e.target.value))} color="teal" />
            
            <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Current PF</label>
                    <input type="number" min="0.1" max="0.99" step="0.01" value={pf1} onChange={(e) => setPf1(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target PF</label>
                    <input type="number" min="0.5" max="1.0" step="0.01" value={pf2} onChange={(e) => setPf2(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Capacitor Bank Required</div>
                <div className="text-2xl font-mono font-bold text-teal-600 dark:text-teal-400">
                    {kvarReq > 0 ? kvarReq.toFixed(1) : "0.0"} <span className="text-sm text-slate-400">kVAR</span>
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 14: MOTOR FLA (NEW) ---
const MotorFLA = ({ idx }) => {
    const [rating, setRating] = useState(100);
    const [unit, setUnit] = useState('HP');
    const [volts, setVolts] = useState(480);
    const [eff, setEff] = useState(92);
    const [pf, setPf] = useState(0.85);

    const kw = unit === 'HP' ? rating * 0.746 : rating;
    const fla = (kw * 1000) / (Math.sqrt(3) * volts * pf * (eff / 100));

    return (
        <CalcCard title="Motor FLA (3Φ)" icon={Fan} colorClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600" delayIndex={idx}
            formula="I = (P_kw × 1000) / (√3 × V × PF × η)"
            calculationSteps={[
                unit === 'HP' ? `P = ${rating} HP × 0.746 = ${kw.toFixed(2)} kW` : `P = ${kw.toFixed(2)} kW`,
                `V = ${volts} V`,
                `Denominator = √3 × ${volts} × ${pf} × ${(eff/100).toFixed(2)} = ${(Math.sqrt(3) * volts * pf * (eff/100)).toFixed(2)}`,
                `FLA = ${(kw * 1000).toFixed(1)} / ${(Math.sqrt(3) * volts * pf * (eff/100)).toFixed(2)} = ${fla.toFixed(1)} A`
            ]}>
            
            <div className="flex gap-2 mb-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setUnit('HP')} className={`flex-1 py-1.5 text-xs font-bold rounded ${unit === 'HP' ? 'bg-white dark:bg-slate-700 shadow text-orange-600' : 'text-slate-500'}`}>Horsepower</button>
                <button onClick={() => setUnit('kW')} className={`flex-1 py-1.5 text-xs font-bold rounded ${unit === 'kW' ? 'bg-white dark:bg-slate-700 shadow text-orange-600' : 'text-slate-500'}`}>Kilowatts</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Rating ({unit})</label>
                    <input type="number" min="0.5" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Voltage (V L-L)</label>
                    <input type="number" min="100" value={volts} onChange={(e) => setVolts(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm"/>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Slider label="Efficiency" unit="%" min={50} max={100} step={1} value={eff} onChange={e => setEff(Number(e.target.value))} color="orange" />
                <Slider label="Power Factor" unit="" min={0.5} max={1.0} step={0.01} value={pf} onChange={e => setPf(Number(e.target.value))} color="orange" />
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Full Load Amps</div>
                <div className="text-2xl font-mono font-bold text-orange-600 dark:text-orange-400">
                    {fla.toFixed(1)} <span className="text-sm text-slate-400">A</span>
                </div>
            </div>
        </CalcCard>
    );
};

// --- UTILITY 15: VOLTAGE UNBALANCE (NEW) ---
const VoltageUnbalance = ({ idx }) => {
    const [vab, setVab] = useState(482);
    const [vbc, setVbc] = useState(470);
    const [vca, setVca] = useState(475);

    const avg = (vab + vbc + vca) / 3;
    const d1 = Math.abs(vab - avg);
    const d2 = Math.abs(vbc - avg);
    const d3 = Math.abs(vca - avg);
    const maxDev = Math.max(d1, d2, d3);
    const unbalance = (maxDev / avg) * 100;

    return (
        <CalcCard title="Voltage Unbalance" icon={Triangle} colorClass="bg-pink-100 dark:bg-pink-900/30 text-pink-600" delayIndex={idx}
            formula="% Unbalance = 100 × (Max Deviation / Average)"
            calculationSteps={[
                `Average = (${vab} + ${vbc} + ${vca}) / 3 = ${avg.toFixed(1)} V`,
                `Dev AB = |${vab} - ${avg.toFixed(1)}| = ${d1.toFixed(1)} V`,
                `Dev BC = |${vbc} - ${avg.toFixed(1)}| = ${d2.toFixed(1)} V`,
                `Dev CA = |${vca} - ${avg.toFixed(1)}| = ${d3.toFixed(1)} V`,
                `Max Deviation = ${maxDev.toFixed(1)} V`,
                `% = 100 × (${maxDev.toFixed(1)} / ${avg.toFixed(1)}) = ${unbalance.toFixed(2)}%`
            ]}>
            
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 w-8">V_ab</label>
                    <input type="number" value={vab} onChange={(e) => setVab(Number(e.target.value))} className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm font-mono"/>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 w-8">V_bc</label>
                    <input type="number" value={vbc} onChange={(e) => setVbc(Number(e.target.value))} className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm font-mono"/>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 w-8">V_ca</label>
                    <input type="number" value={vca} onChange={(e) => setVca(Number(e.target.value))} className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-sm font-mono"/>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">NEMA Unbalance</div>
                <div className={`text-2xl font-mono font-bold ${unbalance > 2.0 ? 'text-red-500' : 'text-pink-600 dark:text-pink-400'}`}>
                    {unbalance.toFixed(2)} <span className="text-sm text-slate-400">%</span>
                </div>
                {unbalance > 2.0 && <div className="text-[10px] text-red-500 mt-1 font-bold">Motor derating required! ({'>'}2%)</div>}
            </div>
        </CalcCard>
    );
};

// --- UTILITY 16: BUSBAR SHORT CIRCUIT FORCE (NEW) ---
const BusbarForce = ({ idx }) => {
    const [ik, setIk] = useState(25); // kA rms
    const [spacing, setSpacing] = useState(150); // mm

    // Assume peak factor kappa = 1.8 (typical for standard X/R)
    // ip = ik * sqrt(2) * 1.8
    const kappa = 1.8;
    const ip = ik * 1.414 * kappa;
    const d_meters = spacing / 1000;
    
    // Fm = 0.2 * ip^2 / d (N/m)
    const fm = 0.2 * (ip * ip) / d_meters;

    return (
        <CalcCard title="Busbar S/C Force" icon={Magnet} colorClass="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300" delayIndex={idx}
            formula="Fm = 0.2 × ip² / a"
            calculationSteps={[
                `I_rms = ${ik} kA`,
                `Phase spacing (a) = ${spacing} mm = ${d_meters} m`,
                `Peak factor (κ) assumed = 1.8`,
                `ip = ${ik} × √2 × 1.8 = ${ip.toFixed(1)} kA peak`,
                `Fm = 0.2 × (${ip.toFixed(1)})² / ${d_meters}`,
                `Fm = 0.2 × ${(ip*ip).toFixed(1)} / ${d_meters} = ${fm.toFixed(0)} N/m`
            ]}>
            
            <Slider label="S/C Current (I_rms)" unit=" kA" min={1} max={100} step={1} value={ik} onChange={e => setIk(Number(e.target.value))} color="default" />
            <Slider label="Phase Spacing" unit=" mm" min={50} max={1000} step={10} value={spacing} onChange={e => setSpacing(Number(e.target.value))} color="default" />

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center mt-auto">
                <div className="text-xs text-slate-500 uppercase mb-1">Peak Electrodynamic Force</div>
                <div className="text-2xl font-mono font-bold text-slate-700 dark:text-slate-300">
                    {fm.toFixed(0)} <span className="text-sm text-slate-400">N/m</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                    Equivalent to {(fm / 9.81).toFixed(1)} kg/m impact
                </div>
            </div>
        </CalcCard>
    );
};

// --- MAIN APP ---
export default function App() {
    const isDark = useThemeObserver();
    return (
        <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            <PageSEO 
                title="Power Engineer's Digital Toolkit | RelaySchool"
                description="Comprehensive calculation suite for protection engineers. CT burden, fault levels, voltage drop, and cable sizing tools."
                url="/engineertoolkit"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "RelaySchool Engineer Toolkit",
                    "applicationCategory": "EducationalApplication",
                    "description": "Multi-function calculator suite for substation and protection engineering."
                }}
            />
            <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
                
                {/* Header with entrance animation */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                            <Calculator className="w-8 h-8 text-blue-600" /> Engineer Toolkit Pro
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">
                            Industrial-grade calculators mapping strictly to IEEE / IEC guidelines.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 shadow-sm">
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> Live Calculations Enabled
                    </div>
                </div>

                {/* Calculators Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <TransformerCalc idx={1} />
                    <VoltageDrop idx={2} />
                    <FaultChecker idx={3} />
                    <CableCalc idx={4} />
                    <CTCheck idx={5} />
                    <CurveMatcher idx={6} />
                    <PerUnitCalc idx={7} />
                    <PowerCalc idx={8} />
                    <GroundRodCalc idx={9} />
                    <BatterySizer idx={10} />
                    <TimeConverter idx={11} />
                    <AnsiSearch idx={12} />
                    <PFCorrection idx={13} />
                    <MotorFLA idx={14} />
                    <VoltageUnbalance idx={15} />
                    <BusbarForce idx={16} />
                </div>

                {/* --- RICH CONTENT SECTION --- */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-slate-200 dark:border-slate-800 mt-12 animate-in fade-in duration-1000 delay-500">
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <PenTool className="w-5 h-5 text-blue-500" /> Transparent Math
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Every calculator includes a <strong>"Calculation Details"</strong> dropdown. This reveals the exact standard formula (e.g., IEEE 80, IEC 60364) and the step-by-step arithmetic used to reach the final answer. Never guess how a value was generated.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" /> Adiabatic Constraints
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Cables heat up instantly during short circuits. Using the $t = k^2S^2/I^2$ limitation validates that the protection relay operates before the insulation (XLPE/PVC) exceeds thermal breakdown limits.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" /> Regulatory Compliance
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Parameters calculated here strictly abide by industrial physics. For instance, Battery Sizing implements the IEEE 485 simplified load profile combining standing loads and momentary trip currents safely.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}