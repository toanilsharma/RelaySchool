
import React, { useState, useEffect, useRef } from 'react';
import {
    Microscope, Activity, Settings, Zap, FileText, TrendingUp,
    BarChart2, Compass, AlertTriangle, Info, CheckCircle2,
    BookOpen, HelpCircle, X, GraduationCap, Sliders, MonitorPlay,
    Book, Sun, Moon, Share2
} from 'lucide-react';
import TheoryLibrary from '../components/TheoryLibrary';
import { FAILURE_THEORY_CONTENT } from '../data/learning-modules/failure';

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

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

/**
 * --- MATH ENGINE & COMPONENTS ---
 * Reuse existing MathEngine and Components
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

        const FLUX_LIMIT = kneePoint / (Math.PI * 2 * 50);
        const currentRemanence = (remFlux / 100) * FLUX_LIMIT;

        let flux = currentRemanence;
        const data = [];
        const dcPeak = magnitude * Math.sqrt(2);

        for (let i = 0; i < totalSamples; i++) {
            const t = i * dt;
            const acComponent = magnitude * Math.sqrt(2) * Math.sin(2 * Math.PI * 50 * t);
            const dcComponent = dcPeak * Math.exp(-t / timeConstant);
            const iPrimary = acComponent + dcComponent;

            const iIdeal = iPrimary;
            const vExcitationRequired = iIdeal * burden;
            flux = flux + (vExcitationRequired * dt);

            let iExcitation = 0;
            const absFlux = Math.abs(flux);

            if (absFlux > FLUX_LIMIT) {
                const overFlux = absFlux - FLUX_LIMIT;
                iExcitation = (overFlux * 80) * Math.sign(flux);
            } else {
                iExcitation = (absFlux / FLUX_LIMIT) * 0.1 * Math.sign(flux);
            }

            let iActual = iIdeal - iExcitation;

            data.push({
                t: t * 1000,
                iIdeal,
                iActual,
                flux,
                fluxLimit: FLUX_LIMIT
            });
        }

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

const FailureLab = () => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'simulator' | 'theory'>('simulator');
    const [activeView, setActiveView] = useState('WAVEFORM');
    // const [showGuide, setShowGuide] = useState(false); // Deprecated in favor of theory tab
    const [isDark, setIsDark] = useState(true);

    const [magnitude, setMagnitude] = useState(20);
    const [burden, setBurden] = useState(2.0);
    const [kneePoint, setKneePoint] = useState(100);
    const [xOverR, setXOverR] = useState(20);
    const [remFlux, setRemFlux] = useState(0);

    const [simData, setSimData] = useState<MathEngineResult>({ data: [], harmonics: [], maxFlux: 1 });
    const [stats, setStats] = useState<Metrics>({ ks: 0, ktd: 0, severity: 0, status: 'PASS' });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const stateParam = params.get('s');
        if (stateParam) {
            try {
                const state = JSON.parse(atob(stateParam));
                if (state.activeTab) setActiveTab(state.activeTab);
                if (state.activeView) setActiveView(state.activeView);
                if (state.magnitude !== undefined) setMagnitude(state.magnitude);
                if (state.burden !== undefined) setBurden(state.burden);
                if (state.kneePoint !== undefined) setKneePoint(state.kneePoint);
                if (state.xOverR !== undefined) setXOverR(state.xOverR);
                if (state.remFlux !== undefined) setRemFlux(state.remFlux);
            } catch (e) {
                console.error("Failed to parse share link", e);
            }
        }
    }, []);

    const copyShareLink = () => {
        const state = { activeTab, activeView, magnitude, burden, kneePoint, xOverR, remFlux };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert("Simulation link copied! You can share this URL to load the exact state.");
    };

    // --- EFFECT: SIMULATION ---
    useEffect(() => {
        const result = MathEngine.simulateCT({ magnitude, burden, kneePoint, xOverR, remFlux });
        setSimData(result);

        const V_sat = kneePoint;
        const V_burden = magnitude * burden;
        const Ks = V_sat / V_burden;
        const Ktd = 1 + (xOverR);
        const isSaturated = Ks < Ktd;
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
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>

            {/* HEADER */}
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-red-600 to-orange-600 p-2 rounded-lg text-white shadow-lg shadow-red-500/20">
                        <Microscope className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>GridGuard <span className="text-red-500">LAB</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">CT Failure Analysis</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full opacity-50"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/80">IEEE C57.13 / IEC 61869-2</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Tabs */}
                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {[
                        { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-4 h-4" /> },
                        { id: 'theory', label: 'Theory', icon: <Book className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                                ? (isDark ? 'bg-slate-800 text-red-400 shadow-sm' : 'bg-white text-red-600 shadow-sm')
                                : 'opacity-60 hover:opacity-100'
                                }`}
                        >
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setIsDark(!isDark)} className={`p-2.5 rounded-lg transition-all border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm'}`}>
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'theory' ? (
                    <TheoryLibrary
                        title="IEC/IEEE CT Theory"
                        description="Understanding Saturation, Remanence, and Transient Dimensioning."
                        sections={FAILURE_THEORY_CONTENT}
                    />
                ) : (
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
                                    <div className="flex gap-2">
                                        <button onClick={() => { setMagnitude(80); setBurden(5); setXOverR(40); setKneePoint(100); setRemFlux(50); }} className="text-[10px] font-bold text-red-400 hover:text-red-300">
                                            WORST CASE
                                        </button>
                                        <button onClick={() => { setMagnitude(20); setBurden(1); setXOverR(5); setKneePoint(200); setRemFlux(0); }} className="text-[10px] font-bold text-slate-400 hover:text-white underline">
                                            DEFAULTS
                                        </button>
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

                                    {/* V-burden Readout */}
                                    <div className="mt-3 p-2 rounded-lg bg-slate-800 border border-slate-700 flex justify-between text-xs">
                                        <span className="text-slate-400">V_burden = I × R</span>
                                        <span className="font-mono font-bold text-white">{(magnitude * burden).toFixed(1)} V</span>
                                    </div>

                                    {/* Copy Results */}
                                    <button onClick={copyShareLink} className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors flex justify-center items-center gap-1">
                                        <Share2 className="w-4 h-4" /> Share Simulation
                                    </button>
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

                        </div>
                    </main>
                )}
            </div>
        </div>
    );
};

export default FailureLab;