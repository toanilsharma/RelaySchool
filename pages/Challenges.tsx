import React, { useState } from 'react';
import { Trophy, ArrowRight, RefreshCcw, Check, XCircle, AlertTriangle, Target, Star, ChevronRight, Zap, ShieldAlert, Timer, HelpCircle, BookOpen, X, CheckCircle, Scale, PenTool } from 'lucide-react';
import { calculateTripTime } from '../services/mathEngine';
import { CurveType } from '../types';

// --- HELP MODAL ---
const ChallengesHelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 m-4 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-red-500" /> Challenges User Guide
                        </h2>
                        <p className="text-sm text-slate-500">Protection engineering scenario solver.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                <div className="p-8 space-y-8">
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-red-500" /> How to Use
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="font-bold text-slate-700 dark:text-slate-200 mb-2">1. Analyze the Brief</div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Read the scenario description carefully. Identify load current, fault current, and specific constraints (e.g., Inrush duration).
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="font-bold text-slate-700 dark:text-slate-200 mb-2">2. Calculate Settings</div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Determine the required Pickup (A) to clear load but protect cable. Select a Time Multiplier (TMS) to grade with downstream devices.
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="font-bold text-slate-700 dark:text-slate-200 mb-2">3. Configure Relay</div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Use the sliders to input your calculated values. Enable the "High-Set" (Instantaneous) element if the scenario requires fast clearing.
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="font-bold text-slate-700 dark:text-slate-200 mb-2">4. Test & Validate</div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Click <strong>Test Configuration</strong>. The system will verify if your settings trip for faults but hold for inrush/load.
                                </p>
                            </div>
                        </div>
                    </section>
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>
                    <section className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Educational Scope & Limitations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Capabilities
                                </h4>
                                <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-200 space-y-1">
                                    <li>Applying coordination principles to specific problems.</li>
                                    <li>Understanding trade-offs between sensitivity and stability.</li>
                                    <li>Learning special applications (Motor Start, Transformer Inrush).</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                                    <X className="w-4 h-4" /> Limitations
                                </h4>
                                <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-200 space-y-1">
                                    <li><strong>Simplified Math:</strong> Scenarios use ideal curves and do not account for CT errors or cable capacitance.</li>
                                    <li><strong>Single Solution Path:</strong> Success logic checks for specific ranges, whereas real engineering often has multiple valid solutions.</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

const LEVELS = [
    {
        id: 1,
        title: "The Motor Start",
        description: "A 100A motor has a starting inrush of 600A for 5 seconds. Configure the Overcurrent Relay to protect the cable (rated 120A) but ride through the startup without tripping.",
        constraints: {
            loadAmps: 100,
            inrushAmps: 600,
            inrushTime: 5,
            cableLimitAmps: 120, // Pickup must be around here
            faultAmps: 2000
        },
        successCriteria: (pickup: number, tms: number, curve: CurveType, inst?: number) => {
            // Check Inst trip
            if (inst && inst <= 600) return { passed: false, msg: "Instantaneous setting is too low! Will trip on motor start." };

            const tInrush = calculateTripTime(600, pickup, tms, curve, inst);
            const tFault = calculateTripTime(2000, pickup, tms, curve, inst);
            
            if (pickup < 105 || pickup > 140) return { passed: false, msg: "Pickup setting incorrect. Should be 105-140A (above load, near cable rating)." };
            if (tInrush && tInrush < 5.0) return { passed: false, msg: `Trips too fast during start! (${tInrush.toFixed(2)}s < 5.0s)` };
            if (!tFault || tFault > 1.0) return { passed: false, msg: `Fault clearing too slow! (${tFault?.toFixed(2)}s > 1.0s)` };
            
            return { passed: true, msg: "Excellent! Motor starts successfully and faults clear fast." };
        }
    },
    {
        id: 2,
        title: "Feeder Discrimination",
        description: "Coordinate a Main Relay (Upstream) with a Feeder Relay (Downstream). The Feeder trips in 0.2s at 5kA. Set the Main Relay to have at least 0.3s Grading Margin at 5kA.",
        constraints: {
            faultAmps: 5000,
            feederTripTime: 0.2,
            requiredMargin: 0.3
        },
        successCriteria: (pickup: number, tms: number, curve: CurveType, inst?: number) => {
            const tMain = calculateTripTime(5000, pickup, tms, curve, inst);
            
            if (!tMain) return { passed: false, msg: "Relay does not trip at fault current." };
            if (tMain < 0.5) return { passed: false, msg: `Too fast! Main trip (${tMain.toFixed(2)}s) < Feeder (0.2s) + Margin (0.3s).` };
            if (tMain > 0.8) return { passed: false, msg: `Too slow! Main trip (${tMain.toFixed(2)}s) is unnecessarily delayed.` };
            
            return { passed: true, msg: "Perfect coordination achieved!" };
        }
    },
    {
        id: 3,
        title: "Transformer Inrush (Magnetizing)",
        description: "Energizing a 2MVA 11kV Transformer (FLC ~105A). Inrush current hits 1050A for 0.1s. Protect against a 3kA fault (<0.5s) while avoiding nuisance tripping during energization.",
        constraints: {
            ratedLoad: 105,
            inrushPoint: "1050A @ 0.1s",
            maxFault: 3000
        },
        successCriteria: (pickup: number, tms: number, curve: CurveType, inst?: number) => {
             // Inst check
             if (inst && inst < 1200) return { passed: false, msg: "Instantaneous element will trip on Inrush!" };

             if (pickup < 125) return { passed: false, msg: "Pickup too low (<125A). Might trip on overload." };
             
             const tInrush = calculateTripTime(1050, pickup, tms, curve, inst);
             if (tInrush && tInrush < 0.1) return { passed: false, msg: "Tripped on Inrush point!" };
             
             const tFault = calculateTripTime(3000, pickup, tms, curve, inst);
             if (!tFault || tFault > 0.5) return { passed: false, msg: `Fault clearance too slow (${tFault?.toFixed(2)}s > 0.5s).` };

             return { passed: true, msg: "Transformer protected successfully! Inrush avoided." };
        }
    },
    {
        id: 4,
        title: "Instantaneous Reach (ANSI 50)",
        description: "Configure the High-Set (Instantaneous) element for a Feeder. It must trip instantly for a line fault (5000A) but MUST NOT trip for a fault on the LV side of the remote transformer (1200A).",
        constraints: {
            load: 200,
            throughFaultLV: 1200,
            internalFaultHV: 5000
        },
        successCriteria: (pickup: number, tms: number, curve: CurveType, inst?: number) => {
            if (!inst) return { passed: false, msg: "Enable the Instantaneous (50) element!" };
            
            // Safety margin usually 1.2x through fault
            if (inst <= 1200 * 1.1) return { passed: false, msg: "Inst setting too sensitive! Will trip on through-fault (LV side)." };
            if (inst >= 5000) return { passed: false, msg: "Inst setting too high! Won't see the line fault." };
            
            return { passed: true, msg: "Perfect High-Set discrimination." };
        }
    },
    {
        id: 5,
        title: "Arc Flash Reduction Mode",
        description: "An electrician is working on the switchgear. Configure a 'Maintenance Mode' setting to clear an Arc Flash (estimated at 3000A) in less than 60ms (0.06s) to reduce incident energy.",
        constraints: {
            load: 400,
            arcingFault: 3000,
            maxTime: "0.06s"
        },
        successCriteria: (pickup: number, tms: number, curve: CurveType, inst?: number) => {
            if (pickup < 400) return { passed: false, msg: "Pickup below load current!" };
            
            const tArc = calculateTripTime(3000, pickup, tms, curve, inst);
            
            if (!tArc) return { passed: false, msg: "Relay did not trip." };
            if (tArc > 0.06) return { passed: false, msg: `Too slow! ${tArc.toFixed(3)}s > 0.06s. Try Instantaneous or Definite Time.` };
            
            return { passed: true, msg: "Safety achieved! Incident energy minimized." };
        }
    }
];

const Challenges = () => {
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [pickup, setPickup] = useState(100);
    const [tms, setTms] = useState(0.1);
    const [curve, setCurve] = useState<CurveType>(CurveType.IEC_STANDARD_INVERSE);
    const [inst, setInst] = useState<number | undefined>(undefined);
    const [useInst, setUseInst] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    
    const [result, setResult] = useState<{passed: boolean, msg: string} | null>(null);
    const [completed, setCompleted] = useState<number[]>([]);

    const level = LEVELS[currentLevelIdx];

    const checkSolution = () => {
        const finalInst = useInst ? inst : undefined;
        const res = level.successCriteria(pickup, tms, curve, finalInst);
        setResult(res);
        if (res.passed && !completed.includes(level.id)) {
            setCompleted([...completed, level.id]);
        }
    };

    const nextLevel = () => {
        if (currentLevelIdx < LEVELS.length - 1) {
            setCurrentLevelIdx(prev => prev + 1);
            setResult(null);
            // Reset defaults
            setPickup(100);
            setTms(0.1);
            setUseInst(false);
            setInst(undefined);
        }
    };

    const prevLevel = () => {
        if (currentLevelIdx > 0) {
            setCurrentLevelIdx(prev => prev - 1);
            setResult(null);
        }
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <ChallengesHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <Target className="w-8 h-8 text-red-500" /> Protection Challenges
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">Apply your knowledge to solve real-world engineering scenarios.</p>
                </div>
                
                <div className="flex gap-3 items-center">
                    <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors">
                        <HelpCircle className="w-4 h-4" /> Help
                    </button>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full shadow-inner border border-slate-200 dark:border-slate-700">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">{completed.length} / {LEVELS.length} Solved</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Scenario Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                             <Target className="w-48 h-48 text-slate-900 dark:text-white" />
                         </div>
                         
                         <div className="relative z-10">
                             <div className="flex justify-between items-center mb-4">
                                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-100 dark:border-blue-900/50">
                                    Level {level.id}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={prevLevel} 
                                        disabled={currentLevelIdx === 0} 
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    >
                                        <ChevronRight className="w-5 h-5 rotate-180"/>
                                    </button>
                                    <button 
                                        onClick={nextLevel} 
                                        disabled={currentLevelIdx === LEVELS.length - 1} 
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    >
                                        <ChevronRight className="w-5 h-5"/>
                                    </button>
                                </div>
                             </div>

                             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{level.title}</h2>
                             <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 border-l-4 border-blue-500 pl-4">
                                 {level.description}
                             </p>
                             
                             <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                                 <h3 className="font-bold text-xs text-slate-500 mb-4 uppercase flex items-center gap-2"><Zap className="w-3 h-3"/> System Constraints</h3>
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm font-mono">
                                     {Object.entries(level.constraints).map(([k, v]) => (
                                         <div key={k}>
                                             <div className="text-slate-500 text-xs mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                                             <div className="font-bold text-slate-900 dark:text-white text-base">{v}</div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* Feedback Area */}
                    {result && (
                        <div className={`p-6 rounded-2xl border flex items-center gap-4 animate-fade-in shadow-sm ${
                            result.passed 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                        }`}>
                            <div className={`p-3 rounded-full shrink-0 ${result.passed ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'}`}>
                                {result.passed ? <Check className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg">{result.passed ? "Challenge Complete!" : "Coordination Failed"}</h4>
                                <p className="text-sm opacity-90 mt-1">{result.msg}</p>
                            </div>
                            {result.passed && currentLevelIdx < LEVELS.length - 1 && (
                                <button onClick={nextLevel} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:translate-y-px transition-all">
                                    Next Level <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Control Panel */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-fit sticky top-24">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Relay Settings (50/51)
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                                <span>Pickup Current (51)</span>
                                <span className="text-slate-900 dark:text-white">{pickup} A</span>
                            </label>
                            <input 
                                type="range" min="50" max="800" step="5"
                                value={pickup}
                                onChange={(e) => setPickup(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div>
                            <label className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                                <span>Time Multiplier (TMS)</span>
                                <span className="text-slate-900 dark:text-white">{tms}</span>
                            </label>
                            <input 
                                type="range" min="0.05" max="1.0" step="0.05"
                                value={tms}
                                onChange={(e) => setTms(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-2">Curve Characteristic</label>
                            <select 
                                value={curve}
                                onChange={(e) => setCurve(e.target.value as CurveType)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white"
                            >
                                <option value={CurveType.IEC_STANDARD_INVERSE}>IEC Standard Inverse</option>
                                <option value={CurveType.IEC_VERY_INVERSE}>IEC Very Inverse</option>
                                <option value={CurveType.IEC_EXTREMELY_INVERSE}>IEC Extremely Inverse</option>
                                <option value={CurveType.ANSI_VERY_INVERSE}>ANSI Very Inverse</option>
                                <option value={CurveType.DT_DEFINITE_TIME}>Definite Time</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                             <div className="flex items-center justify-between mb-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input type="checkbox" checked={useInst} onChange={(e) => setUseInst(e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                                    Instantaneous (50)
                                </label>
                                {useInst && <span className="text-xs font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">High-Set</span>}
                             </div>
                             
                             {useInst && (
                                <div className="animate-fade-in">
                                    <input 
                                        type="number" 
                                        value={inst || ''} 
                                        onChange={(e) => setInst(Number(e.target.value))}
                                        placeholder="Amps (e.g. 2000)"
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">Trips in 0.02s if current exceeds this value.</p>
                                </div>
                             )}
                        </div>

                        <button 
                            onClick={checkSolution}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                        >
                            <ShieldAlert className="w-5 h-5" /> Test Configuration
                        </button>
                    </div>
                </div>
            </div>

            {/* --- RICH CONTENT SECTION --- */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-indigo-500" /> The Art of Compromise
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Protection is always a trade-off. <strong>Sensitivity</strong> (detecting low faults) battles against <strong>Stability</strong> (ignoring load/inrush). <strong>Speed</strong> battles against <strong>Selectivity</strong> (waiting for downstream breakers).
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" /> Managing Inrush
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Motors and Transformers draw 6x to 10x their rated current when starting. Relays must "ride through" this transient. You can achieve this by raising the pickup (dangerous for faults) or adding a time delay (safer).
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-green-500" /> Why 0.3s Margin?
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        A typical grading margin consists of: Breaker Opening Time (0.05s) + Relay Overshoot (0.05s) + CT Errors (0.1s) + Safety Factor (0.1s) = <strong>0.3s</strong>. Reducing this risks loss of selectivity (blackouts).
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Challenges;