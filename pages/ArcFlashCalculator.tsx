import React, { useState, useMemo } from 'react';
import { Flame, AlertTriangle, Shield, Download, RotateCcw, Info, Zap, HardHat } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import SEO from '../components/SEO';

// ─── IEEE 1584-2018 SIMPLIFIED EQUATIONS ───
// Reference: IEEE Std 1584-2018, "Guide for Performing Arc Flash Hazard Calculations"
// These are the simplified regression-based equations for incident energy calculation.

interface EquipmentType {
    id: string;
    label: string;
    gap: number;      // typical gap in mm
    distExp: number;  // distance exponent
    kFactor: number;  // enclosure correction factor
}

const EQUIPMENT_TYPES: EquipmentType[] = [
    { id: 'open-air', label: 'Open Air', gap: 152, distExp: 2.000, kFactor: 1.000 },
    { id: 'switchgear', label: 'Switchgear (MV)', gap: 152, distExp: 1.473, kFactor: 1.641 },
    { id: 'mcc', label: 'MCC / Panelboard (LV)', gap: 25, distExp: 1.641, kFactor: 1.330 },
    { id: 'cable-jn', label: 'Cable Junction Box', gap: 13, distExp: 2.000, kFactor: 1.000 },
    { id: 'lv-panel', label: 'LV Switchboard', gap: 32, distExp: 1.641, kFactor: 1.330 },
];

// PPE Category lookup per NFPA 70E Table 130.7(C)(15)(a)
interface PPECategory {
    level: number;
    label: string;
    maxCal: number;
    color: string;
    bgColor: string;
    clothing: string;
}

const PPE_CATEGORIES: PPECategory[] = [
    { level: 0, label: 'Cat 0 — No PPE Required', maxCal: 1.2, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800', clothing: 'Untreated cotton (long sleeve shirt, pants)' },
    { level: 1, label: 'Cat 1 — Arc-Rated FR Clothing', maxCal: 4, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800', clothing: 'Arc-rated FR shirt + pants, safety glasses, hearing protection' },
    { level: 2, label: 'Cat 2 — Flash Suit (8 cal)', maxCal: 8, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800', clothing: 'Cotton underwear plus FR shirt + pants, arc-rated face shield, balaclava' },
    { level: 3, label: 'Cat 3 — Flash Suit (25 cal)', maxCal: 25, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800', clothing: 'FR shirt + pants, arc flash suit hood, arc-rated gloves, leather footwear' },
    { level: 4, label: 'Cat 4 — Flash Suit (40 cal)', maxCal: 40, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800', clothing: 'Multi-layer arc flash suit, arc-rated face shield + hood, heavy-duty leather gloves' },
];

function getPPECategory(incidentEnergy: number): PPECategory {
    if (incidentEnergy <= 1.2) return PPE_CATEGORIES[0];
    if (incidentEnergy <= 4) return PPE_CATEGORIES[1];
    if (incidentEnergy <= 8) return PPE_CATEGORIES[2];
    if (incidentEnergy <= 25) return PPE_CATEGORIES[3];
    return PPE_CATEGORIES[4];
}

// IEEE 1584-2018 Simplified incident energy calculation
function calcIncidentEnergy(
    Ibf: number,        // bolted fault current in kA
    V: number,          // system voltage in V
    gap: number,        // conductor gap in mm
    distance: number,   // working distance in mm
    time: number,       // arc duration (clearing time) in seconds
    kFactor: number,    // enclosure correction factor
    distExp: number,    // distance exponent
): { E: number; Iarc: number; boundary: number } {

    // 1. Estimate arcing current (simplified Lee method for screening)
    // Iarc ≈ Ibf for voltages ≥ 1000V, else reduced
    let Iarc: number;
    if (V >= 1000) {
        Iarc = Ibf; // arcing current ≈ bolted for MV
    } else {
        // Simplified LV arcing current reduction (typical 50-60% for < 1kV)
        const lgIarc = 0.662 * Math.log10(Ibf) + 0.0966 * (V / 1000) + 0.000526 * gap + 0.5588 * (V / 1000) * Math.log10(Ibf) - 0.00304;
        Iarc = Math.pow(10, lgIarc);
    }

    // 2. Normalized incident energy at 610mm (reference)
    // En = 10^(K1 + K2 + 1.081*lg(Iarc) + 0.0011*gap)  [J/cm² at 610mm, 0.2s]
    const K1 = -0.792; // for open config = -0.792, box = -0.555
    const K2 = 0;      // ungrounded = -0.113, grounded = 0
    const lgEn = K1 + K2 + 1.081 * Math.log10(Iarc) + 0.0011 * gap;
    const En = Math.pow(10, lgEn);

    // 3. Scale to actual time, distance and enclosure
    // E = kFactor × En × (t / 0.2) × (610 / D)^distExp
    const E = kFactor * En * (time / 0.2) * Math.pow(610 / distance, distExp);

    // 4. Arc flash boundary (distance at which E = 1.2 cal/cm²)
    const boundary1_2 = distance * Math.pow(E / 1.2, 1 / distExp);

    return {
        E: E,                        // cal/cm²
        Iarc: Iarc,                  // kA
        boundary: boundary1_2 / 1000 // meters
    };
}


export default function ArcFlashCalculator() {
    const isDark = useThemeObserver();

    // Input state
    const [boltedFault, setBoltedFault] = useState(20);      // kA
    const [voltage, setVoltage] = useState(415);              // V
    const [equipmentIdx, setEquipmentIdx] = useState(2);      // MCC default
    const [workingDistance, setWorkingDistance] = useState(455); // mm
    const [clearingTime, setClearingTime] = useState(0.1);     // seconds

    const equipment = EQUIPMENT_TYPES[equipmentIdx];

    // Calculate results
    const results = useMemo(() => {
        if (boltedFault <= 0 || voltage <= 0 || clearingTime <= 0 || workingDistance <= 0) {
            return null;
        }
        return calcIncidentEnergy(
            boltedFault, voltage, equipment.gap, workingDistance, clearingTime,
            equipment.kFactor, equipment.distExp
        );
    }, [boltedFault, voltage, equipment, workingDistance, clearingTime]);

    const ppeCategory = results ? getPPECategory(results.E) : PPE_CATEGORIES[0];

    // Danger level for visual indicator
    const dangerLevel = results
        ? results.E > 40 ? 'extreme' : results.E > 25 ? 'very-high' : results.E > 8 ? 'high' : results.E > 4 ? 'medium' : results.E > 1.2 ? 'low' : 'safe'
        : 'safe';

    const dangerColors: Record<string, string> = {
        safe: 'from-emerald-500 to-green-600',
        low: 'from-blue-500 to-cyan-600',
        medium: 'from-amber-500 to-yellow-600',
        high: 'from-orange-500 to-red-500',
        'very-high': 'from-red-600 to-rose-700',
        extreme: 'from-red-700 to-red-900',
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
            <SEO
                title="Arc Flash Calculator — IEEE 1584-2018"
                description="Free Arc Flash incident energy calculator based on IEEE 1584-2018. Calculate PPE category, arc flash boundary, and incident energy for any equipment type."
                url="/arc-flash"
            />

            {/* Header */}
            <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-2.5 rounded-lg mr-4 shadow-lg shadow-orange-500/20">
                        <Flame className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Arc Flash Calculator</h1>
                        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">IEEE 1584-2018 / NFPA 70E</p>
                    </div>
                </div>
                <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-amber-900/30 text-amber-400 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Safety-Critical Calculation
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Warning Banner */}
                <div className={`mb-8 p-4 rounded-xl border-2 flex items-start gap-3 ${isDark ? 'bg-amber-950/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <strong>Engineering Disclaimer:</strong> This tool uses simplified IEEE 1584-2018 regression equations for educational screening purposes.
                        Final arc flash studies must be performed by a qualified professional using validated software and site-specific data.
                        Always verify results against your utility's fault study report.
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ─── INPUT PANEL ─── */}
                    <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> System Parameters
                        </h2>

                        <div className="space-y-6">
                            {/* Bolted Fault Current */}
                            <div>
                                <label className="flex items-center justify-between text-sm font-bold mb-2">
                                    <span>Bolted Fault Current (<InlineMath math="I_{bf}" />)</span>
                                    <span className="text-blue-500 font-mono">{boltedFault} kA</span>
                                </label>
                                <input
                                    type="range" min={1} max={100} step={0.5} value={boltedFault}
                                    onChange={e => setBoltedFault(Number(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>1 kA</span><span>100 kA</span></div>
                            </div>

                            {/* Voltage */}
                            <div>
                                <label className="flex items-center justify-between text-sm font-bold mb-2">
                                    <span>System Voltage</span>
                                    <span className="text-blue-500 font-mono">{voltage} V</span>
                                </label>
                                <input
                                    type="range" min={208} max={15000} step={1} value={voltage}
                                    onChange={e => setVoltage(Number(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>208 V</span><span>15,000 V</span></div>
                            </div>

                            {/* Equipment Type */}
                            <div>
                                <label className="text-sm font-bold mb-2 block">Equipment Type</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {EQUIPMENT_TYPES.map((eq, i) => (
                                        <button
                                            key={eq.id}
                                            onClick={() => setEquipmentIdx(i)}
                                            className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all border ${i === equipmentIdx
                                                    ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/30'
                                                    : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                                }`}
                                        >
                                            {eq.label}
                                            <span className="text-[10px] opacity-60 ml-2">(Gap: {eq.gap} mm)</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Working Distance */}
                            <div>
                                <label className="flex items-center justify-between text-sm font-bold mb-2">
                                    <span>Working Distance</span>
                                    <span className="text-blue-500 font-mono">{workingDistance} mm</span>
                                </label>
                                <input
                                    type="range" min={150} max={1000} step={5} value={workingDistance}
                                    onChange={e => setWorkingDistance(Number(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>150 mm</span><span>1000 mm</span></div>
                            </div>

                            {/* Arc Duration / Clearing Time */}
                            <div>
                                <label className="flex items-center justify-between text-sm font-bold mb-2">
                                    <span>Arc Duration (Clearing Time)</span>
                                    <span className="text-blue-500 font-mono">{(clearingTime * 1000).toFixed(0)} ms ({clearingTime.toFixed(3)} s)</span>
                                </label>
                                <input
                                    type="range" min={0.01} max={2} step={0.01} value={clearingTime}
                                    onChange={e => setClearingTime(Number(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>10 ms</span><span>2000 ms (2 s)</span></div>
                            </div>
                        </div>
                    </div>

                    {/* ─── RESULTS PANEL ─── */}
                    <div className="space-y-6">

                        {/* Incident Energy Result */}
                        <div className={`relative overflow-hidden p-6 rounded-2xl border shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${dangerColors[dangerLevel]}`} />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                <Flame className="w-4 h-4" /> Incident Energy
                            </h2>
                            {results && (
                                <div className="text-center py-4">
                                    <div className={`text-6xl font-black bg-gradient-to-r ${dangerColors[dangerLevel]} bg-clip-text text-transparent`}>
                                        {results.E.toFixed(2)}
                                    </div>
                                    <div className="text-sm font-bold text-slate-500 mt-1">cal/cm²</div>
                                </div>
                            )}

                            {/* Key metrics row */}
                            {results && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className={`p-3 rounded-lg border text-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="text-lg font-black text-purple-500">{results.Iarc.toFixed(1)} kA</div>
                                        <div className="text-[10px] font-bold uppercase text-slate-500">Arcing Current</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border text-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="text-lg font-black text-orange-500">{results.boundary.toFixed(2)} m</div>
                                        <div className="text-[10px] font-bold uppercase text-slate-500">Flash Boundary</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PPE Category */}
                        <div className={`p-6 rounded-2xl border-2 ${ppeCategory.bgColor}`}>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                <HardHat className="w-4 h-4" /> PPE Requirement
                            </h2>
                            <div className={`text-2xl font-black mb-2 ${ppeCategory.color}`}>
                                {ppeCategory.label}
                            </div>
                            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                {ppeCategory.clothing}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {PPE_CATEGORIES.map(cat => (
                                    <div
                                        key={cat.level}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${cat.level === ppeCategory.level
                                                ? `${cat.color} ring-2 ring-current`
                                                : isDark ? 'text-slate-600 border-slate-800' : 'text-slate-400 border-slate-200'
                                            }`}
                                    >
                                        Cat {cat.level} ≤ {cat.maxCal}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sensitivity Analysis */}
                        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5" /> What-if Analysis
                            </h3>
                            <div className="space-y-2 text-sm">
                                {results && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>If clearing time halved ({(clearingTime * 500).toFixed(0)} ms):</span>
                                            <span className="font-bold text-emerald-500">{(results.E / 2).toFixed(2)} cal/cm²</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>If clearing time doubled ({(clearingTime * 2000).toFixed(0)} ms):</span>
                                            <span className="font-bold text-red-500">{(results.E * 2).toFixed(2)} cal/cm²</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>If distance increased to 610 mm:</span>
                                            <span className="font-bold text-blue-500">
                                                {calcIncidentEnergy(boltedFault, voltage, equipment.gap, 610, clearingTime, equipment.kFactor, equipment.distExp).E.toFixed(2)} cal/cm²
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Reference Table */}
                        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" /> NFPA 70E PPE Categories
                            </h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        <th className="text-left py-2">Category</th>
                                        <th className="text-right py-2">Max Energy</th>
                                        <th className="text-right py-2">ATPV Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PPE_CATEGORIES.map(cat => (
                                        <tr key={cat.level} className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} ${cat.level === ppeCategory.level ? 'font-bold' : ''}`}>
                                            <td className={`py-2 ${cat.color}`}>Cat {cat.level}</td>
                                            <td className="py-2 text-right font-mono">{cat.maxCal} cal/cm²</td>
                                            <td className="py-2 text-right font-mono">{cat.maxCal} cal/cm²</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
