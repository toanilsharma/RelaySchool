import React, { useState, useMemo, useEffect } from 'react';
import { 
    Flame, AlertTriangle, Shield, RotateCcw, Info, Zap, 
    HardHat, Book, Award, Calculator, Power, Activity, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, ReferenceLine, ReferenceDot 
} from 'recharts';
import { PageSEO } from "../components/SEO/PageSEO";

const arcFlashSchema = {
    "@type": "WebApplication",
    "name": "IEEE 1584 Arc Flash Calculator",
    "description": "Calculate incident energy and flash boundaries using IEEE 1584-2018 standards. Determine required PPE categories for electrical safety.",
    "applicationCategory": "EngineeringApplication",
    "operatingSystem": "WebBrowser",
};

// ============================== ENGINEERING DATA & STANDARDS ==============================

const EQUIPMENT_TYPES = [
    { id: 'open-air', label: 'Open Air', gap: 152, distExp: 2.000, kFactor: 1.000 },
    { id: 'switchgear', label: 'Switchgear (MV)', gap: 152, distExp: 1.473, kFactor: 1.641 },
    { id: 'mcc', label: 'MCC / Panelboard (LV)', gap: 25, distExp: 1.641, kFactor: 1.330 },
    { id: 'cable-jn', label: 'Cable Junction Box', gap: 13, distExp: 2.000, kFactor: 1.000 },
    { id: 'lv-panel', label: 'LV Switchboard', gap: 32, distExp: 1.641, kFactor: 1.330 },
];

const PPE_CATEGORIES = [
    { level: 0, label: 'Cat 0 — No PPE Required', maxCal: 1.2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10 border-emerald-500/30', clothing: 'Untreated cotton (long sleeve shirt, pants)' },
    { level: 1, label: 'Cat 1 — Arc-Rated FR Clothing', maxCal: 4, color: 'text-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/30', clothing: 'Arc-rated FR shirt + pants, safety glasses, hearing protection' },
    { level: 2, label: 'Cat 2 — Flash Suit (8 cal)', maxCal: 8, color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500/30', clothing: 'Cotton underwear plus FR shirt + pants, arc-rated face shield, balaclava' },
    { level: 3, label: 'Cat 3 — Flash Suit (25 cal)', maxCal: 25, color: 'text-orange-500', bgColor: 'bg-orange-500/10 border-orange-500/30', clothing: 'FR shirt + pants, arc flash suit hood, arc-rated gloves, leather footwear' },
    { level: 4, label: 'Cat 4 — Flash Suit (40 cal)', maxCal: 40, color: 'text-red-500', bgColor: 'bg-red-500/10 border-red-500/30', clothing: 'Multi-layer arc flash suit, arc-rated face shield + hood, heavy-duty leather gloves' },
];

const THEORY_CONTENT = [
    {
        title: "1. The Physics of an Arc Flash",
        content: "An arc flash is a violent electrical explosion caused by a sustained luminous discharge of electricity across a gap in a circuit. It converts electrical energy into intense heat (up to 35,000°F), light, and acoustic energy. The goal of IEEE 1584 is to mathematically predict the thermal incident energy reaching a worker to prescribe appropriate Personal Protective Equipment (PPE)."
    },
    {
        title: "2. Incident Energy (cal/cm²)",
        content: "Incident energy is the measure of thermal energy at a working distance from an arc fault. \n• 1.2 cal/cm² is the threshold for a second-degree burn (equivalent to holding a finger in the blue part of a lighter flame for 1 second).\n• Energy decays exponentially with distance. Doubling your distance significantly reduces the thermal hazard."
    },
    {
        title: "3. The Role of Clearing Time",
        content: "Incident energy is directly proportional to time. If a protective relay or breaker is slow to operate, the incident energy skyrockets. This is why fast-acting protection schemes (like Bus Differential 87B or Arc Flash Optical Sensors) are critical. Halving the clearing time cuts the incident energy exactly in half."
    },
    {
        title: "4. Enclosure Configuration (k-Factor)",
        content: "An arc in open air disperses energy in all directions (spherical radiation). However, an arc inside a switchgear cabinet (a box) focuses the thermal energy outwards toward the worker, acting like a directional explosive charge. The IEEE 1584 equations apply equipment-specific correction factors (k-Factors) to account for this focusing effect."
    }
];

const QUIZ_DATA = [
    { q: "What is the universally accepted threshold for a second-degree burn, which also defines the Arc Flash Boundary?", opts: ["0.5 cal/cm²", "1.2 cal/cm²", "4.0 cal/cm²", "8.0 cal/cm²"], ans: 1, why: "1.2 cal/cm² is the foundational metric in NFPA 70E. If the energy is below this, no special arc-rated PPE is required (Category 0)." },
    { q: "How does the equipment enclosure affect the incident energy compared to an open-air fault?", opts: ["It absorbs the heat, reducing the danger.", "It focuses the energy outward toward the worker, significantly increasing the danger.", "It has no effect.", "It only changes the acoustic blast."], ans: 1, why: "A box configuration (like a switchgear cabinet) prevents spherical dispersion, forcing the superheated plasma and radiation directly out the front door toward the worker." },
    { q: "If you cut the breaker clearing time in half, what happens to the incident energy?", opts: ["It decreases by a factor of 4", "It decreases by half", "It stays the same", "It drops to zero"], ans: 1, why: "Incident Energy (E) is directly proportional to time (t). E ∝ t. This makes protective relay speed the most critical variable in arc flash mitigation." },
    { q: "Which PPE Category is required for an incident energy of 15 cal/cm²?", opts: ["Cat 1", "Cat 2", "Cat 3", "Cat 4"], ans: 2, why: "Cat 1 ≤ 4 cal, Cat 2 ≤ 8 cal, Cat 3 ≤ 25 cal. Since 15 falls between 8 and 25, Category 3 PPE is required." }
];

// ============================== MATH ENGINE ==============================

function getPPECategory(incidentEnergy) {
    if (incidentEnergy <= 1.2) return PPE_CATEGORIES[0];
    if (incidentEnergy <= 4) return PPE_CATEGORIES[1];
    if (incidentEnergy <= 8) return PPE_CATEGORIES[2];
    if (incidentEnergy <= 25) return PPE_CATEGORIES[3];
    return PPE_CATEGORIES[4];
}

// IEEE 1584-2018 Simplified incident energy calculation
function calcIncidentEnergy(Ibf, V, gap, distance, time, kFactor, distExp) {
    let Iarc;
    if (V >= 1000) {
        Iarc = Ibf; // MV approximation
    } else {
        // Simplified LV arcing current reduction
        const lgIarc = 0.662 * Math.log10(Ibf) + 0.0966 * (V / 1000) + 0.000526 * gap + 0.5588 * (V / 1000) * Math.log10(Ibf) - 0.00304;
        Iarc = Math.pow(10, lgIarc);
    }

    // Normalized incident energy at 610mm
    const K1 = -0.792; // Box factor
    const K2 = 0;      // Grounded
    const lgEn = K1 + K2 + 1.081 * Math.log10(Iarc) + 0.0011 * gap;
    const En = Math.pow(10, lgEn);

    // Scale to actual time, distance
    const E = kFactor * En * (time / 0.2) * Math.pow(610 / distance, distExp);

    // Arc flash boundary (distance at which E = 1.2 cal/cm²)
    const boundary1_2 = distance * Math.pow(E / 1.2, 1 / distExp);

    return { E, Iarc, boundary: boundary1_2 };
}

// Generate curve data for charts
const generateCurveData = (Ibf, V, gap, time, kFactor, distExp, maxBoundary) => {
    const data = [];
    // Plot from 100mm out to 120% of the boundary
    const limit = Math.max(2000, maxBoundary * 1.2);
    for (let d = 150; d <= limit; d += 50) {
        const E = calcIncidentEnergy(Ibf, V, gap, d, time, kFactor, distExp).E;
        data.push({ distance: d, energy: Number(E.toFixed(2)) });
    }
    return data;
};

// ============================== CUSTOM COMPONENTS ==============================

const CustomSlider = ({ label, value, min, max, step, onChange, unit, symbol }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm font-bold opacity-80">
            <span dangerouslySetInnerHTML={{ __html: label }}></span>
            <span className="text-blue-500 font-mono">{value} {unit}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={onChange}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-blue-500"
            style={{ accentColor: '#3b82f6' }}
        />
        <div className="flex justify-between text-[10px] opacity-40 font-mono">
            <span>{min}</span><span>{max}</span>
        </div>
    </div>
);

// ============================== MAIN VIEWS ==============================

const CalculatorModule = ({ isDark }) => {
    const [boltedFault, setBoltedFault] = useState(25);
    const [voltage, setVoltage] = useState(480);
    const [equipmentIdx, setEquipmentIdx] = useState(2); // MCC default
    const [workingDistance, setWorkingDistance] = useState(455);
    const [clearingTime, setClearingTime] = useState(0.15);

    const equipment = EQUIPMENT_TYPES[equipmentIdx];

    const results = useMemo(() => {
        if (boltedFault <= 0 || voltage <= 0 || clearingTime <= 0 || workingDistance <= 0) return null;
        return calcIncidentEnergy(boltedFault, voltage, equipment.gap, workingDistance, clearingTime, equipment.kFactor, equipment.distExp);
    }, [boltedFault, voltage, equipment, workingDistance, clearingTime]);

    const curveData = useMemo(() => {
        if (!results) return [];
        return generateCurveData(boltedFault, voltage, equipment.gap, clearingTime, equipment.kFactor, equipment.distExp, results.boundary);
    }, [results, boltedFault, voltage, equipment, clearingTime]);

    const ppeCategory = results ? getPPECategory(results.E) : PPE_CATEGORIES[0];

    const dangerLevel = results
        ? results.E > 40 ? 'extreme' : results.E > 25 ? 'very-high' : results.E > 8 ? 'high' : results.E > 4 ? 'medium' : results.E > 1.2 ? 'low' : 'safe'
        : 'safe';

    const dangerColors = {
        safe: 'from-emerald-500 to-green-600',
        low: 'from-blue-500 to-cyan-600',
        medium: 'from-amber-500 to-yellow-600',
        high: 'from-orange-500 to-red-500',
        'very-high': 'from-red-600 to-rose-700',
        extreme: 'from-red-700 to-red-900',
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6 p-4 md:p-6 animate-fade-in overflow-y-auto">
            
            {/* LEFT COLUMN: Inputs */}
            <div className="w-full lg:w-5/12 space-y-6">
                
                {/* Warning Banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                        <strong>Engineering Disclaimer:</strong> Uses simplified IEEE 1584-2018 equations for screening. Final studies must be done by licensed engineers using validated software.
                    </div>
                </div>

                {/* Parameters Panel */}
                <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h2 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-6 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> System Parameters
                    </h2>

                    <div className="space-y-6">
                        <CustomSlider label="Bolted Fault Current (I<sub>bf</sub>)" value={boltedFault} min={1} max={100} step={0.5} unit="kA" onChange={e => setBoltedFault(Number(e.target.value))} />
                        <CustomSlider label="System Voltage" value={voltage} min={208} max={15000} step={1} unit="V" onChange={e => setVoltage(Number(e.target.value))} />
                        
                        <div>
                            <label className="text-sm font-bold mb-2 block opacity-80">Equipment Enclosure Type</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {EQUIPMENT_TYPES.map((eq, i) => (
                                    <button
                                        key={eq.id} onClick={() => setEquipmentIdx(i)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border ${
                                            i === equipmentIdx 
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                                            : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="truncate">{eq.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <CustomSlider label="Working Distance" value={workingDistance} min={150} max={1500} step={5} unit="mm" onChange={e => setWorkingDistance(Number(e.target.value))} />
                        <CustomSlider label="Arc Duration (Clearing Time)" value={clearingTime} min={0.01} max={2.0} step={0.01} unit="s" onChange={e => setClearingTime(Number(e.target.value))} />
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Results & Charts */}
            <div className="w-full lg:w-7/12 space-y-6 flex flex-col">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Primary Output */}
                    <div className={`relative overflow-hidden p-6 rounded-2xl border shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${dangerColors[dangerLevel]}`} />
                        <h2 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2">
                            <Flame className="w-4 h-4" /> Incident Energy
                        </h2>
                        {results && (
                            <div className="text-center py-2">
                                <div className={`text-6xl font-black bg-gradient-to-r ${dangerColors[dangerLevel]} bg-clip-text text-transparent drop-shadow-sm`}>
                                    {results.E.toFixed(2)}
                                </div>
                                <div className="text-sm font-bold opacity-60 mt-1 uppercase tracking-widest">cal/cm²</div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="text-center">
                                <div className="text-lg font-black text-purple-500">{results?.Iarc.toFixed(1)} kA</div>
                                <div className="text-[10px] font-bold uppercase opacity-50">Arcing Current</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-orange-500">{results?.boundary.toFixed(2)} m</div>
                                <div className="text-[10px] font-bold uppercase opacity-50">Flash Boundary</div>
                            </div>
                        </div>
                    </div>

                    {/* PPE Output */}
                    <div className={`p-6 rounded-2xl border flex flex-col justify-center ${ppeCategory.bgColor}`}>
                        <h2 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2">
                            <HardHat className="w-4 h-4" /> Required PPE
                        </h2>
                        <div className={`text-2xl font-black mb-3 ${ppeCategory.color} leading-tight`}>
                            {ppeCategory.label}
                        </div>
                        <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {ppeCategory.clothing}
                        </p>
                    </div>
                </div>

                {/* Energy vs Distance Graph */}
                <div className={`flex-1 p-5 rounded-2xl border flex flex-col min-h-[300px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Energy Decay Curve
                    </h3>
                    <div className="flex-1 w-full h-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={curveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                                <XAxis dataKey="distance" type="number" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} domain={['dataMin', 'dataMax']} tickFormatter={v => `${v}mm`} />
                                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} domain={[0, Math.min(100, Math.ceil(results?.E * 1.5 || 10))]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                                    formatter={(val) => [`${val} cal/cm²`, 'Energy']}
                                    labelFormatter={(val) => `Distance: ${val} mm`}
                                />
                                
                                {/* The Danger Zone Area */}
                                <Area type="monotone" dataKey="energy" stroke="#ef4444" strokeWidth={3} fill="url(#colorE)" isAnimationActive={false} />
                                
                                {/* Boundary Line */}
                                {results && <ReferenceLine y={1.2} stroke="#10b981" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: '1.2 cal Boundary', fill: '#10b981', fontSize: 10 }} />}
                                
                                {/* Worker Position Dot */}
                                {results && (
                                    <ReferenceDot x={workingDistance} y={results.E} r={6} fill="#3b82f6" stroke={isDark ? "#0f172a" : "#fff"} strokeWidth={2} />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                        {/* Legend / Overlay */}
                        <div className="absolute top-2 right-4 flex items-center gap-2 text-[10px] font-bold uppercase bg-slate-800/80 text-white px-2 py-1 rounded">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Worker Position
                        </div>
                    </div>
                </div>

                {/* Sensitivity Analysis Engine */}
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-blue-900/30' : 'bg-blue-50 border-blue-200'}`}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Interactive Analytics (What-If)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {results && (
                            <>
                                <div className={`p-3 rounded-lg border flex flex-col gap-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <span className="opacity-60 text-xs font-bold">If clearing time halved ({(clearingTime / 2).toFixed(3)}s):</span>
                                    <span className="font-mono text-lg font-black text-emerald-500">{(results.E / 2).toFixed(2)} cal/cm²</span>
                                </div>
                                <div className={`p-3 rounded-lg border flex flex-col gap-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <span className="opacity-60 text-xs font-bold">If distance pushed to 900mm:</span>
                                    <span className="font-mono text-lg font-black text-blue-500">
                                        {calcIncidentEnergy(boltedFault, voltage, equipment.gap, 900, clearingTime, equipment.kFactor, equipment.distExp).E.toFixed(2)} cal/cm²
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

// ============================== THEORY & QUIZ ==============================

const TheoryModule = ({ isDark }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-orange-500/10 rounded-2xl"><Book className="w-8 h-8 text-orange-500" /></div>
            <div><h2 className="text-3xl font-black">IEEE 1584 Reference</h2><p className="text-sm opacity-60">Complete theoretical handbook for Arc Flash Hazards.</p></div>
        </div>
        <div className="grid gap-6">
            {THEORY_CONTENT.map((section, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-4 text-orange-500">{section.title}</h3>
                    <p className="whitespace-pre-wrap leading-relaxed opacity-90">{section.content}</p>
                </div>
            ))}
        </div>
    </div>
);

const QuizModule = ({ isDark }) => {
    const [score, setScore] = useState(0); const [cur, setCur] = useState(0);
    const [sel, setSel] = useState(null); const [finished, setFinished] = useState(false);
    const qs = QUIZ_DATA; const q = qs[cur];

    const handlePick = (i) => {
        if (sel !== null) return;
        setSel(i); if (i === q.ans) setScore(s => s + 1);
        setTimeout(() => { if (cur + 1 >= qs.length) setFinished(true); else { setCur(c => c + 1); setSel(null); } }, 3000);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-purple-500/10 rounded-2xl"><Award className="w-8 h-8 text-purple-500" /></div>
                <div><h2 className="text-3xl font-black">Knowledge Assessment</h2><p className="text-sm opacity-60">Test your understanding of NFPA 70E and Arc Flash Mitigation.</p></div>
            </div>
            {finished ? (
                <div className={`text-center p-12 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="text-6xl mb-6">{score === qs.length ? '🏆' : '📚'}</div>
                    <h3 className="text-3xl font-black mb-2">Score: {score} / {qs.length}</h3>
                    <button onClick={() => { setCur(0); setScore(0); setSel(null); setFinished(false); }} className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold">Retry Quiz</button>
                </div>
            ) : (
                <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold opacity-50">Question {cur + 1} of {qs.length}</span>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-bold">Score: {score}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-6 leading-tight">{q.q}</h3>
                    <div className="space-y-3">
                        {q.opts.map((opt, i) => (
                            <button key={i} onClick={() => handlePick(i)} disabled={sel !== null}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    sel === null ? (isDark ? 'border-slate-800 hover:border-blue-500' : 'border-slate-200 hover:border-blue-500') :
                                    i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' :
                                    sel === i ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40 border-transparent'
                                }`}><span className="font-mono mr-3 opacity-60">{String.fromCharCode(65 + i)}.</span>{opt}</button>
                        ))}
                    </div>
                    <AnimatePresence>
                        {sel !== null && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 p-4 rounded-xl text-sm leading-relaxed ${sel === q.ans ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                <strong className="block mb-1">{sel === q.ans ? '✅ Correct' : '❌ Incorrect'}</strong>{q.why}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

// ============================== MAIN APP SHELL ==============================

export default function App() {
    const [activeTab, setActiveTab] = useState('calculator');
    const [isDark, setIsDark] = useState(true);

    const tabs = [
        { id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4"/> },
        { id: 'calculator', label: 'Analysis Tool', icon: <Calculator className="w-4 h-4"/> },
        { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4"/> }
    ];

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#0f172a] text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
            <PageSEO 
                title="Arc Flash Hazard Analysis (IEEE 1584) | RelaySchool"
                description="Interactive IEEE 1584 arc flash incident energy calculator. Determine safety boundaries and PPE categories for industrial power systems."
                url="/arc-flash"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "RelaySchool Arc Flash Calculator",
                    "applicationCategory": "SafetyApplication",
                    "description": "Professional-grade arc flash hazard analysis tool compliant with IEEE 1584-2018."
                }}
            />
            <style dangerouslySetInnerHTML={{__html: `
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}} />

            {/* Header */}
            <header className={`h-16 shrink-0 flex items-center justify-between px-4 md:px-6 z-20 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl text-white shadow-lg shadow-orange-500/20">
                        <Flame className="w-6 h-6"/>
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tight leading-none">Arc<span className="text-orange-500">Guard</span> PRO</h1>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">IEEE 1584 Calculator</span>
                    </div>
                </div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark ? 'bg-[#020617] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-orange-400' : 'bg-white text-orange-600 shadow-sm') : 'opacity-50 hover:opacity-100'}`}>
                            {t.icon}<span>{t.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-lg border transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'}`}>
                    <Power className="w-5 h-5" />
                </button>
            </header>

            {/* Mobile Nav */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab === t.id ? 'text-orange-500 bg-orange-500/5' : 'opacity-50'}`}>
                        {t.icon}<span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <main className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <div className="h-full overflow-y-auto"><TheoryModule isDark={isDark} /></div>}
                {activeTab === 'calculator' && <CalculatorModule isDark={isDark} />}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </main>
        </div>
    );
}