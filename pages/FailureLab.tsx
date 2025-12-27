import React, { useState, useEffect, useRef } from 'react';
import {
    Microscope,
    Activity,
    Settings,
    Zap,
    FileText,
    TrendingUp,
    BarChart2,
    Compass,
    AlertTriangle,
    Info,
    CheckCircle2,
    BookOpen,
    HelpCircle,
    X,
    GraduationCap,
    Sliders
} from 'lucide-react';

// --- TYPES ---
interface MathEngineParams {
    magnitude: number;    // I_fault (RMS Secondary)
    xOverR: number;       // System X/R Ratio
    burden: number;       // Total Loop Impedance
    kneePoint: number;    // Saturation Voltage
    remFlux: number;      // Remanence (%)
    cycles?: number;
    samplesPerCycle?: number;
}

interface DataPoint {
    t: number;
    iIdeal: number;
    iActual: number;
    flux: number;
    fluxLimit: number;
}

interface Harmonic {
    order: number;
    magnitude: number;
}

interface MathEngineResult {
    data: DataPoint[];
    harmonics: Harmonic[];
    maxFlux: number;
}

interface Metrics {
    ks: number | string;
    ktd: number | string;
    severity: number | string;
    status: 'PASS' | 'FAIL' | 'WARN';
}

interface TooltipProps {
    children: React.ReactNode;
    text: string;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

/**
 * --- IEEE/IEC MATH ENGINE ---
 * Implements physics based on IEEE C37.110 and IEC 61869-2
 * * Core Physics:
 * 1. Generates primary fault current with DC offset (exponential decay).
 * 2. Integrates voltage (I*R) to determine Flux (Volts-Seconds).
 * 3. Applies a non-linear magnetization curve to simulate saturation.
 */
const MathEngine = {
    OMEGA: 2 * Math.PI * 50, // 50Hz

    simulateCT: (params: MathEngineParams): MathEngineResult => {
        const {
            magnitude,    // I_fault (RMS Secondary)
            xOverR,       // System X/R Ratio
            burden,       // Total Loop Impedance (Rb + Rct + Rleads)
            kneePoint,    // Saturation Voltage (Vk or Vsat)
            remFlux,      // Remanence (%)
            cycles = 4,
            samplesPerCycle = 120
        } = params;

        const totalSamples = cycles * samplesPerCycle;
        const dt = (1 / 50) / samplesPerCycle;
        const timeConstant = xOverR / (2 * Math.PI * 50);

        // FLUX LIMIT CALCULATION (IEC 61869)
        // Flux (Weber) = V / (4.44 * f * N). Simplified to V-sec equivalent.
        // Limit is proportional to Vk.
        const FLUX_LIMIT = kneePoint / (Math.PI * 2 * 50); // Peak Flux Linkage limit
        const currentRemanence = (remFlux / 100) * FLUX_LIMIT;

        let flux = currentRemanence;
        const data = [];
        const dcPeak = magnitude * Math.sqrt(2);

        for (let i = 0; i < totalSamples; i++) {
            const t = i * dt;

            // 1. PRIMARY CURRENT GENERATION
            const acComponent = magnitude * Math.sqrt(2) * Math.sin(2 * Math.PI * 50 * t);
            const dcComponent = dcPeak * Math.exp(-t / timeConstant);
            const iPrimary = acComponent + dcComponent; // Referred to secondary

            // 2. EXCITATION VOLTAGE & FLUX INTEGRATION
            // V_ex = I_sec * R_burden (ignoring L_burden for simplified view)
            // d(Flux)/dt = V_ex
            const iIdeal = iPrimary;
            const vExcitationRequired = iIdeal * burden;
            flux = flux + (vExcitationRequired * dt);

            // 3. SATURATION LOGIC (Non-linear Inductance)
            let iExcitation = 0;
            const absFlux = Math.abs(flux);

            // Piecewise linear saturation curve simulation
            if (absFlux > FLUX_LIMIT) {
                // Deep saturation region (Air core inductance)
                const overFlux = absFlux - FLUX_LIMIT;
                iExcitation = (overFlux * 80) * Math.sign(flux); // High magnetizing current
            } else {
                // Linear region (High permeability)
                iExcitation = (absFlux / FLUX_LIMIT) * 0.1 * Math.sign(flux); // Low leakage
            }

            // 4. SECONDARY CURRENT
            let iActual = iIdeal - iExcitation;

            data.push({
                t: t * 1000,
                iIdeal,
                iActual,
                flux,
                fluxLimit: FLUX_LIMIT
            });
        }

        // FFT CALCULATION
        const lastCycleStart = totalSamples - samplesPerCycle;
        const lastCycleData = data.slice(lastCycleStart);
        const harmonics = [1, 2, 3, 5].map(h => {
            let sumCos = 0, sumSin = 0;
            lastCycleData.forEach(pt => {
                const angle = 2 * Math.PI * h * (pt.t / 20);
                sumCos += pt.iActual * Math.cos(angle);
                sumSin += pt.iActual * Math.sin(angle);
            });
            const mag = (2 / samplesPerCycle) * Math.sqrt(sumCos ** 2 + sumSin ** 2);
            return { order: h, magnitude: mag };
        });

        return { data, harmonics, maxFlux: FLUX_LIMIT };
    }
};

/**
 * --- UI COMPONENTS ---
 */
const Tooltip: React.FC<TooltipProps> = ({ children, text }) => (
    <div className="group relative flex items-center">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700">
            {text}
        </div>
    </div>
);

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-500" /> {title}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar text-slate-300 space-y-4">
                    {children}
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                        Understood
                    </button>
                </div>
            </div>
        </div>
    );
};

const FailureLab = () => {
    // --- STATE ---
    const [activeView, setActiveView] = useState('WAVEFORM');
    const [showGuide, setShowGuide] = useState(false);
    const [magnitude, setMagnitude] = useState(20);
    const [burden, setBurden] = useState(2.0);
    const [kneePoint, setKneePoint] = useState(100);
    const [xOverR, setXOverR] = useState(20);
    const [remFlux, setRemFlux] = useState(0);

    const [simData, setSimData] = useState<MathEngineResult>({ data: [], harmonics: [], maxFlux: 1 });
    const [stats, setStats] = useState<Metrics>({ ks: 0, ktd: 0, severity: 0, status: 'PASS' });

    // --- EFFECT: SIMULATION ---
    useEffect(() => {
        const result = MathEngine.simulateCT({ magnitude, burden, kneePoint, xOverR, remFlux });
        setSimData(result);

        // IEEE C37.110 CALCULATIONS
        const V_sat = kneePoint;
        const V_burden = magnitude * burden;

        // 1. Actual Saturation Factor (Ks)
        // The capability of the CT relative to the AC symmetrical burden
        const Ks = V_sat / V_burden;

        // 2. Transient Dimensioning Factor (Ktd)
        // The requirement to handle the DC offset without saturation
        // Ktd = (1 + X/R) for full offset containment
        const Ktd = 1 + (xOverR);

        // 3. Status
        // If Ks < Ktd, the CT will saturate during the transient
        const isSaturated = Ks < Ktd;
        // Severity: ratio of Requirement to Capability
        const severity = Ktd / Ks;

        setStats({
            ks: Ks.toFixed(1),
            ktd: Ktd.toFixed(1),
            severity: severity.toFixed(2),
            status: isSaturated ? 'FAIL' : 'PASS'
        });
    }, [magnitude, burden, kneePoint, xOverR, remFlux]);

    // --- RENDER HELPERS ---
    const renderMetric = (label: string, value: string | number, subtext: string, status: string) => (
        <div className={`p-4 rounded-xl border ${status === 'FAIL' ? 'bg-red-950/20 border-red-900/50' : status === 'WARN' ? 'bg-amber-950/20 border-amber-900/50' : 'bg-slate-900 border-slate-800'}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
            <div className={`text-2xl font-mono font-bold ${status === 'FAIL' ? 'text-red-400' : status === 'WARN' ? 'text-amber-400' : 'text-slate-200'}`}>
                {value}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{subtext}</div>
        </div>
    );

    const renderWaveform = () => {
        if (!simData.data.length) return null;
        const width = 800; const height = 350; const padding = 40; const innerH = height - padding * 2; const midY = height / 2;
        const maxCurrent = Math.max(...simData.data.map(d => Math.abs(d.iIdeal))) * 1.1;
        const scaleY = (innerH / 2) / (maxCurrent || 1);
        const scaleX = (width - padding * 2) / (simData.data[simData.data.length - 1].t);
        const makePath = (key: keyof DataPoint, color: string, width: number) => {
            const d = simData.data.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${padding + pt.t * scaleX} ${midY - (pt[key] * scaleY)}`).join(' ');
            return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" />;
        };

        return (
            <div className="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner">
                {/* Advanced Grid */}
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/50"></div>

                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full relative z-10">
                    {makePath('iIdeal', '#3b82f6', 2)}
                    {makePath('iActual', '#ef4444', 3)}
                </svg>

                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs shadow-xl">
                    <div className="flex items-center gap-2 mb-2"><div className="w-3 h-0.5 bg-blue-500"></div><span className="text-blue-200 font-medium">Ideal (Primary Replicated)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-1 bg-red-500 rounded-full"></div><span className="text-red-300 font-bold">Actual Secondary</span></div>
                </div>
            </div>
        );
    };

    const renderHarmonics = () => {
        if (!simData.harmonics.length) return null;
        const maxMag = Math.max(...simData.harmonics.map(h => h.magnitude));
        return (
            <div className="h-full flex flex-col justify-center items-center p-6 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-end gap-12 h-64 w-full max-w-2xl border-b border-slate-700 pb-2">
                    {simData.harmonics.map(h => {
                        const heightPct = (h.magnitude / maxMag) * 100;
                        return (
                            <div key={h.order} className="flex-1 flex flex-col items-center group relative">
                                <div className="mb-2 text-xs font-mono text-slate-300">{h.magnitude.toFixed(1)}A</div>
                                <div className={`w-16 rounded-t-md transition-all duration-500 ${h.order === 1 ? 'bg-blue-600' : 'bg-amber-500'}`} style={{ height: `${Math.max(heightPct, 1)}%`, opacity: 0.8 }}></div>
                                <div className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h.order === 1 ? 'Fundamental' : `${h.order}${h.order === 2 ? 'nd' : h.order === 3 ? 'rd' : 'th'} Harm`}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-800 max-w-2xl w-full">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> Engineering Insight</h4>
                    <p className="text-xs text-slate-400">
                        Saturated waveforms are rich in odd harmonics (3rd, 5th) and even harmonics (2nd).
                        <strong> Differential Protection (87)</strong> relays typically use the ratio of 2nd Harmonic to Fundamental (I2/I1) to detect saturation or magnetizing inrush and block tripping.
                    </p>
                </div>
            </div>
        );
    };

    const renderBHLoop = () => {
        const width = 300; const height = 300; const mid = 150; const scaleI = 5; const scaleFlux = 100;
        const pathData = simData.data.map((d, i) => {
            const iMag = d.iIdeal - d.iActual;
            const x = mid + (iMag * scaleI * 2);
            const y = mid - (d.flux * scaleFlux);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-950 rounded-lg border border-slate-800">
                <div className="relative w-[300px] h-[300px]">
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-800"></div>
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-800"></div>
                    <svg viewBox="0 0 300 300" className="w-full h-full p-4 overflow-visible">
                        <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        <text x="280" y="145" fill="#64748b" fontSize="10" fontFamily="monospace">I_exc</text>
                        <text x="160" y="20" fill="#64748b" fontSize="10" fontFamily="monospace">Flux(Φ)</text>
                    </svg>
                </div>
                <div className="mt-4 text-center">
                    <div className="text-xs text-slate-500">Hysteresis Loop Area ∝ Core Heating</div>
                    <div className="text-xs text-emerald-500 font-mono mt-1">Excursion: {(simData.maxFlux * 100).toFixed(1)}% of Vs</div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans selection:bg-blue-500/30">

            {/* GUIDE MODAL */}
            <Modal isOpen={showGuide} onClose={() => setShowGuide(false)} title="Simulator User Guide">
                <div className="space-y-6">
                    <section>
                        <h3 className="text-lg font-bold text-white mb-2">1. The Objective</h3>
                        <p className="text-sm text-slate-400">
                            This tool simulates <strong>Current Transformer (CT) Saturation</strong> during electrical faults.
                            Your goal is to adjust parameters to see pass/fail conditions based on IEEE C37.110 standards.
                        </p>
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-4 rounded-lg">
                            <h4 className="text-sm font-bold text-blue-400 mb-2">Inputs (Left Panel)</h4>
                            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                                <li><strong>Knee Point (Vk):</strong> The CT's voltage capability (Quality).</li>
                                <li><strong>Fault Mag (I):</strong> The severity of the short circuit.</li>
                                <li><strong>Burden (Rb):</strong> Resistance of wires + relay.</li>
                                <li><strong>X/R Ratio:</strong> Determines DC offset duration.</li>
                            </ul>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg">
                            <h4 className="text-sm font-bold text-emerald-400 mb-2">Outputs (Right Panel)</h4>
                            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                                <li><strong>Waveform:</strong> Visual distortion of current.</li>
                                <li><strong>Harmonics:</strong> FFT analysis for relay logic.</li>
                                <li><strong>Metrics:</strong> Pass/Fail based on saturation factors.</li>
                            </ul>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-2">2. Key Standard Formula</h3>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-center text-slate-300">
                            Is Saturated? IF <span className="text-blue-400">Ks</span> {'<'} <span className="text-red-400">(1 + X/R)</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Where Ks (Saturation Factor) = Vk / (I_fault × Burden)
                        </p>
                    </section>
                </div>
            </Modal>

            {/* HEADER */}
            <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                            <Microscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight font-display">CT Forensics Lab</h1>
                            <div className="flex items-center gap-3 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> IEEE C37.110</span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                <span>IEC 61869-2</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <HelpCircle className="w-4 h-4" /> How to Use
                        </button>
                        <div className="h-6 w-px bg-slate-800"></div>
                        <button onClick={() => { setMagnitude(100); setBurden(4); setXOverR(30); setKneePoint(100); }} className="px-4 py-2 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all shadow-lg shadow-red-900/10">
                            Load: Severe Fault
                        </button>
                        <button onClick={() => { setMagnitude(20); setBurden(1); setXOverR(5); setKneePoint(200); }} className="px-4 py-2 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all">
                            Load: Normal
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">

                {/* LEFT COLUMN: CONTROLS & METRICS */}
                <div className="col-span-12 lg:col-span-4 space-y-6">

                    {/* CONTROL PANEL */}
                    <div className="bg-[#1e293b]/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-blue-400" />
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Simulation Parameters</h2>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* CT Capability */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-blue-300 flex items-center gap-2">
                                        <Sliders className="w-3 h-3" /> Knee Point (Vk)
                                    </label>
                                    <span className="font-mono text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">{kneePoint} V</span>
                                </div>
                                <input type="range" min="50" max="800" step="10" value={kneePoint} onChange={e => setKneePoint(Number(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400" />
                            </div>

                            {/* Fault Magnitude */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-300">Fault Current (I_sec)</label>
                                    <span className="font-mono text-xs bg-slate-700 text-white px-2 py-0.5 rounded">{magnitude} A</span>
                                </div>
                                <input type="range" min="5" max="150" value={magnitude} onChange={e => setMagnitude(Number(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white" />
                            </div>

                            {/* Burden */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-amber-300">Total Burden (Rb)</label>
                                    <span className="font-mono text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">{burden} Ω</span>
                                </div>
                                <input type="range" min="0.1" max="10" step="0.1" value={burden} onChange={e => setBurden(Number(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400" />
                            </div>

                            {/* X/R Ratio */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-purple-300">System X/R Ratio</label>
                                    <span className="font-mono text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">{xOverR}</span>
                                </div>
                                <input type="range" min="1" max="100" value={xOverR} onChange={e => setXOverR(Number(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400" />
                            </div>
                        </div>
                    </div>

                    {/* STANDARDS ANALYSIS CARD */}
                    <div className="bg-[#1e293b]/50 backdrop-blur rounded-2xl border border-slate-700/50 p-1">
                        <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800/50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                                <Activity className="w-3 h-3" /> IEEE C37.110 Compliance
                            </h3>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {renderMetric("Capability (Ks)", stats.ks, "Vk / (I × Rb)", stats.status === 'FAIL' ? 'WARN' : 'PASS')}
                                {renderMetric("Requirement (Ktd)", stats.ktd, "1 + X/R", 'INFO')}
                            </div>

                            <div className={`flex items-center gap-3 p-3 rounded-lg border ${stats.status === 'FAIL' ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                <div className={`p-2 rounded-full ${stats.status === 'FAIL' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                    {stats.status === 'FAIL' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className={`font-bold text-sm ${stats.status === 'FAIL' ? 'text-red-400' : 'text-emerald-400'}`}>
                                        RESULT: {stats.status}
                                    </div>
                                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                                        {stats.status === 'FAIL' ? 'CT cannot support transient flux. Deep saturation expected.' : 'CT has sufficient margin for transient DC offset.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: VISUALIZATION */}
                <div className="col-span-12 lg:col-span-8 space-y-6">

                    {/* MAIN GRAPH CARD */}
                    <div className="bg-[#1e293b]/50 backdrop-blur rounded-2xl border border-slate-700/50 p-1 shadow-2xl flex flex-col h-[500px]">
                        <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-t-xl mx-1 mt-1">
                            {[
                                { id: 'WAVEFORM', label: 'Time Domain Analysis', icon: TrendingUp },
                                { id: 'HARMONICS', label: 'Harmonic Spectrum (FFT)', icon: BarChart2 },
                                { id: 'BH_LOOP', label: 'B-H Hysteresis Loop', icon: Compass },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveView(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wide rounded-lg transition-all
                    ${activeView === tab.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 bg-slate-950 rounded-b-xl m-1 relative overflow-hidden">
                            {activeView === 'WAVEFORM' && renderWaveform()}
                            {activeView === 'HARMONICS' && renderHarmonics()}
                            {activeView === 'BH_LOOP' && renderBHLoop()}
                        </div>
                    </div>

                    {/* EDUCATIONAL & BENEFITS SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-2xl border border-slate-800 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -mr-12 -mt-12"></div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4 relative z-10">
                                <GraduationCap className="w-5 h-5 text-blue-500" /> Learning Outcomes
                            </h4>
                            <ul className="space-y-3 relative z-10">
                                <li className="flex gap-3 text-xs text-slate-400">
                                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 text-blue-400 font-bold">1</span>
                                    <span><strong>Visual Intuition:</strong> Connect abstract math ($K_s$, $X/R$) to physical waveform distortion.</span>
                                </li>
                                <li className="flex gap-3 text-xs text-slate-400">
                                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 text-blue-400 font-bold">2</span>
                                    <span><strong>Relay Logic:</strong> Understand why differential relays use 2nd harmonic blocking during transients.</span>
                                </li>
                                <li className="flex gap-3 text-xs text-slate-400">
                                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 text-blue-400 font-bold">3</span>
                                    <span><strong>Design Safety:</strong> Learn to size CTs correctly using the <span className="font-mono text-blue-300">V_k &gt; I·Z·(1+X/R)</span> rule.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-2xl border border-slate-800 p-6 relative overflow-hidden">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-emerald-500" /> Forensic Insight
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                {stats.status === 'FAIL'
                                    ? "CRITICAL FAILURE DETECTED: The DC offset component has pushed the magnetic flux beyond the core's saturation limit. This results in 'missing' secondary current. A differential relay would see this mismatch as an internal fault and likely trip erroneously."
                                    : "OPTIMAL OPERATION: The CT has sufficient Knee Point Voltage to drive the fault current plus the DC offset without entering the saturation region. Protection relays will operate correctly."
                                }
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                                <Info className="w-3 h-3 text-emerald-500" />
                                Severity Index: {stats.severity} (Target: {'<'} 1.0)
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default FailureLab;