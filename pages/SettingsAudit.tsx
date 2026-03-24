import React, { useState, useMemo, useEffect } from 'react';
import { 
    CheckCircle, XCircle, Zap, FileText, 
    Shield, Info, GraduationCap, ChevronDown, Activity, AlertCircle, Settings,
    BookOpen, HelpCircle, ArrowRight, PlayCircle, RefreshCw, Award, LineChart as LineChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, ReferenceLine 
} from 'recharts';

// --- TYPE DEFINITIONS ---

type TabType = 'audit' | 'theory' | 'quiz';

interface RelaySettings {
    feederName: string;
    ctRatio: number;        
    ctClass: string;
    cableRating: number;    
    maxLoadCurrent: number; 
    boltedFault: number;    
    minFaultCurrent: number;
    burstRating: number;    
    pickupCurrent: number;  
    tms: number;            
    gradingMargin: number;  
    earthFaultPickup: number; 
    highSetPickup: number;
    cbOperatingTime: number; 
    breakerFailTime: number; 
    zone1Reach: number;     
}

// --- MATH TYPOGRAPHY COMPONENTS ---

const InlineMath = ({ children }: { children: React.ReactNode }) => (
    <span className="font-serif italic text-indigo-700 dark:text-indigo-300 mx-0.5 text-[1.05em]">{children}</span>
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

// --- IEC & IEEE ALIGNED ENGINEERING ENGINE ---

interface AuditCheck {
    id: string;
    category: string;
    name: string;
    standard: string;
    formula: React.ReactNode;
    learningText: React.ReactNode;
    check: (s: RelaySettings) => { pass: boolean; detail: string; value: string };
}

const AUDIT_CHECKS: AuditCheck[] = [
    {
        id: 'pickup-above-load',
        category: 'Time-Overcurrent (51)',
        name: 'Load Encroachment Margin',
        standard: 'IEC 60255-151 / IEEE C37.112',
        formula: <><InlineMath>I<sub>pickup</sub></InlineMath> &ge; 1.1 &times; <InlineMath>I<sub>load(max)</sub></InlineMath></>,
        learningText: <>The pickup setting must be higher than the maximum anticipated load (usually by 110% to 125%) to prevent nuisance tripping during temporary permissible overloads or cold-load pickup.</>,
        check: (s) => {
            const ratio = s.pickupCurrent / s.maxLoadCurrent;
            const pass = ratio >= 1.1;
            return {
                pass,
                value: `${(ratio * 100).toFixed(0)}%`,
                detail: pass
                    ? `Pickup is ${(ratio * 100).toFixed(0)}% of max load (≥ 110%). Adequate margin.`
                    : `Pickup is only ${(ratio * 100).toFixed(0)}% of max load. Must be ≥ 110% to avoid nuisance trips.`
            };
        }
    },
    {
        id: 'sensitivity-factor',
        category: 'Time-Overcurrent (51)',
        name: 'Fault Sensitivity Factor',
        standard: 'IEEE C37.113',
        formula: <>Sensitivity Factor = <Fraction num={<InlineMath>I<sub>fault(min)</sub></InlineMath>} den={<InlineMath>I<sub>pickup</sub></InlineMath>} /> &ge; 2.0</>,
        learningText: <>To ensure positive operation under minimum fault conditions (e.g., end-of-line phase-to-phase fault), the relay should see at least twice its pickup setting. This ensures adequate torque and overcomes internal measurement tolerances.</>,
        check: (s) => {
            const faultPrimary = s.minFaultCurrent * s.ctRatio;
            const factor = faultPrimary / s.pickupCurrent;
            const pass = factor >= 2.0;
            return {
                pass,
                value: `${factor.toFixed(1)}x`,
                detail: pass
                    ? `Sensitivity factor is ${factor.toFixed(1)} (≥ 2.0). Relay will reliably detect remote faults.`
                    : `Sensitivity factor is ${factor.toFixed(1)} (< 2.0). Relay may fail to operate for minimum faults.`
            };
        }
    },
    {
        id: 'tms-limits',
        category: 'Time-Overcurrent (51)',
        name: 'TMS Operational Limits',
        standard: 'IEC 60255-151',
        formula: <>0.05 &le; <InlineMath>TMS</InlineMath> &le; 1.2</>,
        learningText: <>Setting TMS below 0.05 forces the relay to operate within its lowest mechanical or algorithmic tolerance error band, leading to unpredictable, uncoordinated fast tripping. Extremely high TMS indicates a poor grading strategy and slow fault clearance.</>,
        check: (s) => {
            const pass = s.tms >= 0.05 && s.tms <= 1.2;
            return {
                pass,
                value: s.tms.toString(),
                detail: pass
                    ? `TMS of ${s.tms} is within the reliable operating range (0.05 - 1.2).`
                    : `TMS of ${s.tms} is out of bounds. Numerical relays risk unpredictable operation below 0.05.`
            };
        }
    },
    {
        id: 'high-set-margin',
        category: 'Instantaneous (50)',
        name: 'High-Set Transient Margin',
        standard: 'IEEE 242 (Buff Book)',
        formula: <><InlineMath>I<sub>inst</sub></InlineMath> &ge; 1.3 &times; <InlineMath>I<sub>through-fault</sub></InlineMath></>,
        learningText: <>Instantaneous elements (ANSI 50) must not overreach for faults outside their intended zone. A transient DC offset margin of 1.2 to 1.3 is required to prevent nuisance tripping during highly asymmetric external faults.</>,
        check: (s) => {
            const minRequired = s.maxLoadCurrent * 5; 
            const pass = s.highSetPickup >= minRequired;
            return {
                pass,
                value: `${s.highSetPickup}A`,
                detail: pass
                    ? `High-set (${s.highSetPickup}A) is adequately margined above typical inrush/through-load transients.`
                    : `High-set (${s.highSetPickup}A) is too low (< 5x Load). High risk of tripping on transformer inrush or motor starting.`
            };
        }
    },
    {
        id: 'lbb-timer',
        category: 'Breaker Failure (50BF)',
        name: 'Local Breaker Backup (LBB) Margin',
        standard: 'IEEE C37.119',
        formula: <><InlineMath>t<sub>LBB</sub></InlineMath> &ge; <InlineMath>t<sub>CB_open</sub></InlineMath> + <InlineMath>t<sub>relay_reset</sub></InlineMath> + <InlineMath>t<sub>margin</sub></InlineMath></>,
        learningText: <>The LBB timer must allow the primary breaker time to open, arc to extinguish, and the protection relay element to fully reset. Setting it too fast causes catastrophic sympathetic tripping of the entire upstream busbar.</>,
        check: (s) => {
            const minTime = s.cbOperatingTime + 30 + 50; 
            const pass = s.breakerFailTime >= minTime;
            return {
                pass,
                value: `${s.breakerFailTime}ms`,
                detail: pass
                    ? `LBB timer (${s.breakerFailTime}ms) safely exceeds the minimum required ${minTime}ms.`
                    : `LBB timer (${s.breakerFailTime}ms) is too aggressive! Requires minimum ${minTime}ms (CB open + reset + margin).`
            };
        }
    },
    {
        id: 'cable-thermal',
        category: 'Thermal & Equipment',
        name: 'Cable Thermal Protection',
        standard: 'IEC 60364-4-43',
        formula: <><InlineMath>I<sub>pickup</sub></InlineMath> &le; 1.45 &times; <InlineMath>I<sub>z</sub></InlineMath></>,
        learningText: <>Per IEC 60364, the current ensuring effective operation of the protective device (<InlineMath>I<sub>2</sub></InlineMath>) must not exceed 1.45 times the continuous current-carrying capacity of the cable (<InlineMath>I<sub>z</sub></InlineMath>) to prevent long-term insulation degradation and melting.</>,
        check: (s) => {
            const limit = s.cableRating * 1.45;
            const pass = s.pickupCurrent <= limit;
            return {
                pass,
                value: `${s.pickupCurrent}A / ${limit.toFixed(0)}A`,
                detail: pass
                    ? `Pickup ${s.pickupCurrent}A is within the 1.45x cable thermal limit (${limit.toFixed(0)}A).`
                    : `Pickup ${s.pickupCurrent}A exceeds thermal limit (${limit.toFixed(0)}A). Cable insulation degradation risk.`
            };
        }
    },
    {
        id: 'grading-margin',
        category: 'Time-Overcurrent (51)',
        name: 'Coordination Time Interval (CTI)',
        standard: 'IEEE 242 (Buff Book)',
        formula: <>&Delta;<InlineMath>t</InlineMath> &ge; 0.25s</>,
        learningText: <>The CTI accounts for downstream breaker operating time (usually 50-80ms), relay overshoot, and CT errors. For modern numerical relays, a margin of 0.2s to 0.25s is the standard realistic requirement for strict selectivity.</>,
        check: (s) => {
            const pass = s.gradingMargin >= 0.25;
            return {
                pass,
                value: `${s.gradingMargin}s`,
                detail: pass
                    ? `CTI of ${s.gradingMargin}s provides adequate discrimination for numerical relays.`
                    : `CTI of ${s.gradingMargin}s is dangerously low (< 0.25s). Risk of uncoordinated tripping.`
            };
        }
    },
    {
        id: 'fault-withstand',
        category: 'Thermal & Equipment',
        name: 'Equipment Short-Circuit Rating',
        standard: 'IEC 62271-200',
        formula: <><InlineMath>I<sub>withstand</sub></InlineMath> &ge; <InlineMath>I<sub>fault(bolted)</sub></InlineMath></>,
        learningText: <>Switchgear, busbars, and associated equipment must be capable of withstanding the extreme mechanical forces (peak making current) and thermal stresses ($I^2t$) of the maximum prospective short-circuit current until the fault is fully cleared. Failure results in catastrophic explosions.</>,
        check: (s) => {
            const pass = s.burstRating >= s.boltedFault;
            return {
                pass,
                value: `${s.burstRating}kA ≥ ${s.boltedFault}kA`,
                detail: pass
                    ? `Equipment withstand (${s.burstRating}kA) safely exceeds bolted fault level (${s.boltedFault}kA).`
                    : `CATASTROPHIC RISK: Available fault (${s.boltedFault}kA) exceeds equipment rating (${s.burstRating}kA)!`
            };
        }
    },
    {
        id: 'earth-fault',
        category: 'Time-Overcurrent (51)',
        name: 'Earth Fault Sensitivity',
        standard: 'IEEE 142 (Green Book)',
        formula: <><InlineMath>I<sub>ef_pickup</sub></InlineMath> &le; 20% &times; <InlineMath>CT<sub>nom</sub></InlineMath></>,
        learningText: <>Earth faults often involve high-impedance paths (e.g., fallen tree branches, dry soil), drastically limiting the fault current magnitude. Setting EF pickup below 10% to 20% of the CT nominal rating ensures reliable detection of these highly restrictive faults.</>,
        check: (s) => {
            const pass = s.earthFaultPickup <= 20;
            return {
                pass,
                value: `${s.earthFaultPickup}%`,
                detail: pass
                    ? `EF pickup at ${s.earthFaultPickup}% allows detection of high-impedance ground faults.`
                    : `EF pickup at ${s.earthFaultPickup}% is too insensitive (>20%). Risk of undetected ground faults.`
            };
        }
    },
    {
        id: 'zone1-reach',
        category: 'Distance (21)',
        name: 'Distance Protection Zone 1 Reach',
        standard: 'IEEE C37.113',
        formula: <><InlineMath>Z<sub>1_reach</sub></InlineMath> = 80% to 85% of <InlineMath>Z<sub>line</sub></InlineMath></>,
        learningText: <>Zone 1 operates instantaneously. It is intentionally set under 100% (typically 80% to 85%) to avoid "overreaching" into the adjacent line section. Overreach occurs due to cumulative transient errors in CTs and VTs, relay algorithm inaccuracies, and mutual coupling effects.</>,
        check: (s) => {
            const pass = s.zone1Reach >= 80 && s.zone1Reach <= 85;
            return {
                pass,
                value: `${s.zone1Reach}%`,
                detail: pass
                    ? `Z1 reach is optimal at ${s.zone1Reach}%, mitigating both underreach and overreach risks.`
                    : `Z1 reach of ${s.zone1Reach}% violates the 80-85% standard, risking miscoordination.`
            };
        }
    },
    {
        id: 'ct-class',
        category: 'Instrument Transformers',
        name: 'CT Protection Class Appropriateness',
        standard: 'IEC 61869-2',
        formula: <>Class &isin; &#123;5P, 10P, PX, TPX&#125;</>,
        learningText: <>Metering CTs (e.g., Class 0.2) saturate rapidly during faults to protect delicate measuring instruments. Protection relays require P-class (Protection) or PX-class (Knee-point defined) CTs to accurately and linearly reproduce massive fault currents without saturation.</>,
        check: (s) => {
            const validClasses = ['5P', '10P', 'PX', 'TPX', 'TPY', 'TPZ'];
            const pass = validClasses.some(c => s.ctClass.toUpperCase().includes(c));
            return {
                pass,
                value: s.ctClass,
                detail: pass
                    ? `CT Class "${s.ctClass}" is appropriately specified for protection applications.`
                    : `CT Class "${s.ctClass}" is invalid or indicates a metering CT. Must use 5P/10P/PX.`
            };
        }
    }
];

// --- THEORY DATA STRUCTURE ---
const THEORY_SECTIONS = [
    {
        title: 'Overcurrent Protection (ANSI 50/51)',
        content: (
            <div className="space-y-4">
                <p>Overcurrent protection serves as the backbone of medium and low voltage distribution networks. It utilizes two distinct but complementary elements:</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                    <li><strong className="text-slate-900 dark:text-slate-100">Time-Overcurrent (ANSI 51):</strong> Utilizes an inverse time characteristic curve. The fundamental principle is: the higher the fault current magnitude, the faster the relay operates.</li>
                    <li><strong className="text-slate-900 dark:text-slate-100">Instantaneous (ANSI 50):</strong> Operates with zero intentional time delay for extremely high-magnitude faults located close to the source.</li>
                </ul>
                <p>The operating time for an IEC standard characteristic curve is governed by the following mathematical relationship:</p>
                
                <BlockMath>
                    <InlineMath>t</InlineMath> = <Fraction 
                        num={<><InlineMath>k</InlineMath> &times; <InlineMath>TMS</InlineMath></>} 
                        den={<>(<InlineMath>I</InlineMath> / <InlineMath>I<sub>s</sub></InlineMath>)<sup><InlineMath>&alpha;</InlineMath></sup> &minus; 1</>} 
                    />
                </BlockMath>

                <p>Where:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><InlineMath>t</InlineMath> : Operating time in seconds.</li>
                    <li><InlineMath>TMS</InlineMath> : Time Multiplier Setting (shifts the curve vertically).</li>
                    <li><InlineMath>I</InlineMath> : Measured fault current.</li>
                    <li><InlineMath>I<sub>s</sub></InlineMath> : Relay pickup current setting.</li>
                </ul>
                <p>For an <strong>IEC Standard Inverse (SI)</strong> curve, the constants are defined as <InlineMath>k = 0.14</InlineMath> and <InlineMath>&alpha; = 0.02</InlineMath>.</p>
            </div>
        )
    },
    {
        title: 'Local Breaker Backup (LBB / 50BF)',
        content: (
            <div className="space-y-4">
                <p>If a protection relay accurately detects a fault and issues a trip command, but the primary circuit breaker mechanically or electrically fails to open, the fault remains energized. This risks catastrophic equipment failure and widespread instability.</p>
                <p>LBB protection mitigates this by initiating a timer the moment a trip command is issued. If current continues to flow after the timer expires, the LBB element issues an emergency trip command to the upstream breaker (or clears the entire busbar).</p>
                <p>The mathematical formulation for a safe LBB timer is:</p>
                
                <BlockMath>
                    <InlineMath>t<sub>LBB</sub></InlineMath> &ge; <InlineMath>t<sub>CB_open</sub></InlineMath> + <InlineMath>t<sub>relay_reset</sub></InlineMath> + <InlineMath>t<sub>margin</sub></InlineMath>
                </BlockMath>

                <p>A typical implementation using modern numerical relays assumes <InlineMath>t<sub>CB_open</sub></InlineMath> &approx; 50ms, <InlineMath>t<sub>relay_reset</sub></InlineMath> &approx; 30ms, and a safety margin of 50ms to 70ms, yielding a standard LBB time of 150ms.</p>
            </div>
        )
    },
    {
        title: 'Distance Protection (ANSI 21)',
        content: (
            <div className="space-y-4">
                <p>Distance protection is primarily deployed on high-voltage transmission lines. Unlike overcurrent relays, distance relays continually measure voltage and current to calculate the electrical impedance to the fault location:</p>
                
                <BlockMath>
                    <InlineMath>Z<sub>measured</sub></InlineMath> = <Fraction num={<InlineMath>V</InlineMath>} den={<InlineMath>I</InlineMath>} />
                </BlockMath>

                <p>Because transmission lines possess a known uniform impedance per kilometer, calculating <InlineMath>Z</InlineMath> effectively calculates the distance to the fault. Protection is divided into spatial "Zones":</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-slate-900 dark:text-slate-100">Zone 1 (Instantaneous):</strong> Strictly set to 80% to 85% of the total line impedance. It is deliberately set under 100% to ensure that transient errors in Voltage/Current Transformers do not cause the relay to "overreach" and instantaneously trip for faults located in the adjacent downstream line.</li>
                    <li><strong className="text-slate-900 dark:text-slate-100">Zone 2 (Delayed):</strong> Set to 120% of the line impedance with a delay (e.g., 0.3s) to cover the remaining 15-20% of the line and provide backup protection to the adjacent busbar.</li>
                </ul>
            </div>
        )
    }
];

// --- UI COMPONENTS ---

const InputField = ({ label, value, onChange, type = "number", step = "1", suffix = "" }: any) => (
    <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {label}
        </label>
        <div className="relative">
            <input
                type={type}
                step={step}
                value={value}
                onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 
                           bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm font-medium
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            />
            {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    {suffix}
                </span>
            )}
        </div>
    </div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-indigo-500/10 pb-2">
        {title}
    </h3>
);

// --- MAIN APP COMPONENT ---

export default function SettingsAudit() {
    const [isDark, setIsDark] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('audit');
    const [learnMode, setLearnMode] = useState(true);
    const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

    // Initial realistic state
    const [settings, setSettings] = useState<RelaySettings>({
        feederName: 'TR-1 Incomer 11kV',
        ctRatio: 400,
        ctClass: '5P20',
        cableRating: 350,
        maxLoadCurrent: 260,
        boltedFault: 21.5,
        minFaultCurrent: 2.0, // Secondary amps
        burstRating: 25,
        pickupCurrent: 300,
        tms: 0.15,
        gradingMargin: 0.25,
        earthFaultPickup: 15,
        highSetPickup: 2000,
        cbOperatingTime: 50,
        breakerFailTime: 150,
        zone1Reach: 80,
    });

    // Theme injection
    useEffect(() => {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

    const update = (key: keyof RelaySettings, value: string | number) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // --- AUDIT LOGIC ---
    const results = useMemo(() => {
        return AUDIT_CHECKS.map(check => ({
            ...check,
            result: check.check(settings),
        }));
    }, [settings]);

    const passCount = results.filter(r => r.result.pass).length;
    const auditScore = Math.round((passCount / results.length) * 100);
    const scoreColor = auditScore === 100 ? 'text-emerald-500' : auditScore >= 75 ? 'text-amber-500' : 'text-rose-500';

    // --- RECHARTS TCC GENERATOR ---
    // Generates the IEC Standard Inverse curve points based on current pickup and TMS
    const generateTCCData = useMemo(() => {
        const data = [];
        const startMulti = 1.1; // Standard curves start just above 1.0
        const endMulti = 30;    // Plot up to 30x pickup
        
        for (let multi = startMulti; multi <= endMulti; multi += (multi < 5 ? 0.2 : 1)) {
            const current = settings.pickupCurrent * multi;
            // IEC Standard Inverse formula: t = 0.14 * TMS / ((I/Is)^0.02 - 1)
            const time = (0.14 * settings.tms) / (Math.pow(multi, 0.02) - 1);
            
            // Cap time to a max display value to prevent infinite charts
            if (time > 1000) continue;

            data.push({
                current: Math.round(current),
                time: Number(time.toFixed(3)),
                multiplier: Number(multi.toFixed(1))
            });
        }
        return data;
    }, [settings.pickupCurrent, settings.tms]);

    // Graph domain formatting
    const maxChartTime = generateTCCData.length > 0 ? generateTCCData[0].time : 100;

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1121] text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
            
            {/* Header & Navigation */}
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">Protection<span className="text-indigo-500">Suite</span></h1>
                            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-1">IEC / IEEE Engineering Tool</p>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        {isDark ? '☀️' : '🌙'}
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'audit', icon: Shield, label: 'Audit & Simulator' },
                        { id: 'theory', icon: BookOpen, label: 'Theory Library' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
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
                    {/* TAB: AUDIT ENGINE & SIMULATOR */}
                    {/* ========================================================= */}
                    {activeTab === 'audit' && (
                        <motion.div 
                            key="audit"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12"
                        >
                            {/* --- LEFT PANEL: EXHAUSTIVE INPUTS --- */}
                            <div className="xl:col-span-4 space-y-6">
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                                    
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-indigo-500" /> Parameters
                                        </h2>
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        {/* Circuit Specs */}
                                        <div>
                                            <SectionHeader title="Circuit & Equipment" />
                                            <div className="space-y-3">
                                                <InputField label="Feeder Name" type="text" value={settings.feederName} onChange={(v: string) => update('feederName', v)} />
                                                <div className="flex gap-3">
                                                    <InputField label="Max Load" value={settings.maxLoadCurrent} onChange={(v: number) => update('maxLoadCurrent', v)} suffix="A" />
                                                    <InputField label="Cable Ampacity" value={settings.cableRating} onChange={(v: number) => update('cableRating', v)} suffix="A" />
                                                </div>
                                                <div className="flex gap-3">
                                                    <InputField label="Bolted Fault" value={settings.boltedFault} onChange={(v: number) => update('boltedFault', v)} suffix="kA" />
                                                    <InputField label="Eq. Withstand" value={settings.burstRating} onChange={(v: number) => update('burstRating', v)} suffix="kA" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Overcurrent (51) */}
                                        <div>
                                            <SectionHeader title="Time-Overcurrent (51)" />
                                            <div className="flex gap-3 mb-3">
                                                <InputField label="Pickup Current" value={settings.pickupCurrent} onChange={(v: number) => update('pickupCurrent', v)} suffix="A" />
                                                <InputField label="TMS" value={settings.tms} step="0.01" onChange={(v: number) => update('tms', v)} />
                                            </div>
                                            <div className="flex gap-3 mb-3">
                                                <InputField label="Min Fault (Sec)" value={settings.minFaultCurrent} step="0.1" onChange={(v: number) => update('minFaultCurrent', v)} suffix="A" />
                                                <InputField label="Earth Fault P.U." value={settings.earthFaultPickup} onChange={(v: number) => update('earthFaultPickup', v)} suffix="%" />
                                            </div>
                                            <InputField label="Grading Margin" value={settings.gradingMargin} step="0.05" onChange={(v: number) => update('gradingMargin', v)} suffix="s" />
                                        </div>

                                        {/* Instantaneous & LBB */}
                                        <div>
                                            <SectionHeader title="Instantaneous & Backup" />
                                            <div className="mb-3">
                                                <InputField label="High-Set Pickup (50)" value={settings.highSetPickup} onChange={(v: number) => update('highSetPickup', v)} suffix="A" />
                                            </div>
                                            <div className="flex gap-3">
                                                <InputField label="CB Open Time" value={settings.cbOperatingTime} onChange={(v: number) => update('cbOperatingTime', v)} suffix="ms" />
                                                <InputField label="LBB Timer (50BF)" value={settings.breakerFailTime} onChange={(v: number) => update('breakerFailTime', v)} suffix="ms" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- RIGHT PANEL: RESULTS & SIMULATOR --- */}
                            <div className="xl:col-span-8 space-y-6">
                                
                                {/* Scorecard */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    
                                    <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="8" fill="none" />
                                            <motion.circle cx="50" cy="50" r="40" className={auditScore === 100 ? 'stroke-emerald-500' : auditScore >= 75 ? 'stroke-amber-500' : 'stroke-rose-500'} strokeWidth="8" fill="none" strokeLinecap="round" initial={{ strokeDasharray: 251, strokeDashoffset: 251 }} animate={{ strokeDashoffset: 251 - (251 * auditScore) / 100 }} transition={{ duration: 1.5, ease: "easeOut" }} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-3xl font-black ${scoreColor}`}>{auditScore}</span>
                                            <span className="text-[10px] font-bold text-slate-400">SCORE</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full text-center sm:text-left z-10">
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-xl font-bold">Audit Status: {auditScore === 100 ? 'Commissioning Ready' : 'Review Required'}</h2>
                                            <button onClick={() => setLearnMode(!learnMode)} className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${learnMode ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                                                <GraduationCap className="w-3.5 h-3.5" /> Learn Mode {learnMode ? 'On' : 'Off'}
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            Exhaustive validation of 11 critical parameters against IEC 60255, 60364, and IEEE C37 standard engineering limits.
                                        </p>
                                        <div className="flex items-center justify-center sm:justify-start gap-4">
                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                                                <CheckCircle className="w-5 h-5" /> {passCount} Passed
                                            </div>
                                            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-sm font-bold">
                                                <XCircle className="w-5 h-5" /> {results.length - passCount} Failed
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live TCC Simulator Graph */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-6">
                                        <LineChartIcon className="w-5 h-5 text-indigo-500" />
                                        <h3 className="font-bold uppercase tracking-widest text-sm text-slate-800 dark:text-slate-200">Live TCC Simulator (IEC SI)</h3>
                                    </div>
                                    
                                    <div className="w-full h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={generateTCCData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                                <XAxis 
                                                    dataKey="current" 
                                                    scale="log" 
                                                    domain={['auto', 'auto']} 
                                                    type="number" 
                                                    stroke={isDark ? '#94a3b8' : '#64748b'}
                                                    tickFormatter={(val) => `${val}A`}
                                                />
                                                <YAxis 
                                                    scale="log" 
                                                    domain={[0.01, Math.max(10, maxChartTime)]} 
                                                    type="number" 
                                                    stroke={isDark ? '#94a3b8' : '#64748b'}
                                                    tickFormatter={(val) => `${val}s`}
                                                />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    labelFormatter={(val) => `Fault Current: ${val}A`}
                                                    formatter={(value, name, props) => [`${value} s`, `Trip Time (${props.payload.multiplier}x)`]}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="time" 
                                                    stroke="#6366f1" 
                                                    strokeWidth={3} 
                                                    dot={false}
                                                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                                />
                                                
                                                {/* Bolted Fault Reference */}
                                                {(settings.boltedFault * 1000) > settings.pickupCurrent && (
                                                    <ReferenceLine x={settings.boltedFault * 1000} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'top', value: 'Bolted Fault', fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }} />
                                                )}
                                                
                                                {/* High Set Reference */}
                                                {settings.highSetPickup > settings.pickupCurrent && (
                                                    <ReferenceLine x={settings.highSetPickup} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: 'Inst (50)', fill: '#f59e0b', fontSize: 12, fontWeight: 'bold' }} />
                                                )}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-xs text-center text-slate-500 mt-2 font-medium">Log-Log Scale. Curve shifts dynamically with TMS and Pickup settings.</p>
                                </div>

                                {/* Checklist */}
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {results.map((r, index) => {
                                            const isExpanded = expandedCheck === r.id;
                                            const isPass = r.result.pass;
                                            return (
                                                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`overflow-hidden rounded-2xl border transition-all duration-300 ${isPass ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/50' : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'}`}>
                                                    <div onClick={() => setExpandedCheck(isExpanded ? null : r.id)} className="p-4 sm:p-5 flex items-start sm:items-center gap-4 cursor-pointer select-none">
                                                        <div className={`p-2 rounded-full shrink-0 mt-1 sm:mt-0 ${isPass ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                                            {isPass ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                                                                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{r.category}</span>
                                                                <h3 className="font-bold text-[14px] leading-tight">{r.name}</h3>
                                                            </div>
                                                            <p className={`text-[13px] leading-snug pr-4 ${isPass ? 'text-slate-500 dark:text-slate-400' : 'text-rose-600 dark:text-rose-400 font-medium'}`}>
                                                                {r.result.detail}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end shrink-0 gap-2">
                                                            <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md ${isPass ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'}`}>
                                                                {r.result.value}
                                                            </span>
                                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {isExpanded && learnMode && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/10">
                                                                <div className="p-6 md:pl-[72px] space-y-5">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <div>
                                                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Standard Protocol</h4>
                                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">{r.standard}</p>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Engineering Formula</h4>
                                                                            <div className="text-[15px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 inline-block">
                                                                                {r.formula}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Engineering Principle</h4>
                                                                        <div className="text-[14.5px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl border-l-2 border-indigo-200 dark:border-indigo-500/30 pl-4">
                                                                            {r.learningText}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
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
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-6">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-black mb-4">Protection Theory Library</h2>
                                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                                    Comprehensive engineering reference material derived from IEEE Buff Book (C37 series) and IEC 60255 standards, utilizing proper mathematical typography.
                                </p>
                            </div>

                            {THEORY_SECTIONS.map((section, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-bl-[100px] -z-10 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors duration-500" />
                                    
                                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-black shadow-inner">
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

                </AnimatePresence>
            </main>
        </div>
    );
}