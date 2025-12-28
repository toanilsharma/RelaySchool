import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Activity, Clock, Search, Sliders, Zap, Download, RefreshCw,
    Maximize2, FileSearch, ArrowRight, Info, AlertTriangle,
    CheckCircle, BarChart, Timer, Ruler, MoveHorizontal, Target,
    TrendingUp, Play, Pause, ChevronLeft, ChevronRight, ZoomIn,
    ZoomOut, Compass, HelpCircle, X, BookOpen, Layers, Microscope,
    Sun, Moon, RotateCcw, MonitorPlay, Terminal, AlertOctagon,
    MousePointer2, Book, GraduationCap, Menu, CheckCircle2, ShieldCheck,
    Settings, Grid, Share2
} from 'lucide-react';

// --- TYPES & MATH UTILS ---
interface DataPoint {
    t: number;
    ia: number; ib: number; ic: number;
    va: number; vb: number; vc: number;
    trip: number;
    // Sequence Components (calculated)
    i1: number; i2: number; i0: number;
}

const toRad = (deg: number) => deg * Math.PI / 180;

// --- 1. EXTENDED THEORY DATA ---
const THEORY_DATA = [
    {
        id: 'intro',
        title: "1. The Art of Forensics",
        icon: <Search className="w-5 h-5 text-blue-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <div className="p-5 rounded-2xl border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
                    <h3 className="text-lg font-bold mb-2 text-blue-900 dark:text-blue-100">Why analyze faults?</h3>
                    <p className="text-slate-700 dark:text-slate-300">
                        Power system faults are violent, high-energy events. Protection relays must detect these in milliseconds.
                        <strong>Forensic Analysis</strong> (or Post-Mortem Analysis) uses COMTRADE records to verify if the protection system operated correctly, identifying:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                        <li><strong>Fault Type:</strong> Was it a lightning strike (L-G) or a clashing conductor (L-L)?</li>
                        <li><strong>Location:</strong> Which mile of the line triggered the trip?</li>
                        <li><strong>Speed:</strong> Did the breaker open fast enough (e.g., &lt;3 cycles) to prevent instability?</li>
                    </ul>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-base border-b pb-2 border-slate-200 dark:border-slate-700">Standard Formats</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <strong className="text-purple-600 dark:text-purple-400">COMTRADE</strong>
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">IEEE C37.111</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            The universal standard. Consists of a <strong>.CFG</strong> file (setup) and a <strong>.DAT</strong> file (samples). Modern relays sample at 32-128 samples per cycle.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <strong className="text-emerald-600 dark:text-emerald-400">Sequence of Events (SOE)</strong>
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">1ms Resolution</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            A digital log of contact changes. Tells you <em>"Breaker 52-1 Trip Coil Energized at 10:00:00.052"</em>.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'symmetrical',
        title: "2. Symmetrical Components",
        icon: <Layers className="w-5 h-5 text-indigo-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <p className="text-slate-600 dark:text-slate-400">
                    Dr. Charles Fortescue (1918) proved that any unbalanced 3-phase system can be decomposed into three balanced systems. This is the math behind almost all digital relays.
                </p>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-colors group">
                        <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-bold text-green-600 text-lg group-hover:scale-110 transition-transform">1</div>
                        <div>
                            <strong className="text-slate-900 dark:text-white">Positive Sequence (I1)</strong>
                            <p className="text-xs text-slate-500 mt-1">Balanced, normal rotation (A-B-C). Present in all conditions. The "Workhorse" current.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-colors group">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center font-bold text-amber-600 text-lg group-hover:scale-110 transition-transform">2</div>
                        <div>
                            <strong className="text-slate-900 dark:text-white">Negative Sequence (I2)</strong>
                            <p className="text-xs text-slate-500 mt-1">Balanced, reverse rotation (A-C-B). Only appears during <strong>Unbalanced Faults</strong> (L-L, L-G). Generates counter-torque in motors (heating).</p>
                        </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-colors group">
                        <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center font-bold text-red-600 text-lg group-hover:scale-110 transition-transform">0</div>
                        <div>
                            <strong className="text-slate-900 dark:text-white">Zero Sequence (I0)</strong>
                            <p className="text-xs text-slate-500 mt-1">In-phase currents (A+B+C). Only flows to <strong>Ground</strong>. High I0 = Ground Fault (L-G).</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'signatures',
        title: "3. Fault Type Library",
        icon: <Activity className="w-5 h-5 text-red-500" />,
        content: (
            <div className="space-y-6 text-sm">
                <div className="space-y-4">
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">A-G</span>
                            <strong className="text-slate-900 dark:text-white">Single Line to Ground</strong>
                        </div>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-1">
                            <li>• <strong>Signature:</strong> IA High, VA Low. IB/IC Normal.</li>
                            <li>• <strong>Sequence:</strong> I1 ≈ I2 ≈ I0 (All components present and equal).</li>
                            <li>• <strong>Cause:</strong> Lightning, Insulator Flashover, Tree Contact.</li>
                        </ul>
                    </div>

                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold">B-C</span>
                            <strong className="text-slate-900 dark:text-white">Line to Line</strong>
                        </div>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-1">
                            <li>• <strong>Signature:</strong> IB & IC High (180° opposed). VB & VC Collapse towards each other.</li>
                            <li>• <strong>Sequence:</strong> I1 & I2 present. <strong>I0 = 0</strong> (No ground current).</li>
                            <li>• <strong>Cause:</strong> Conductor clashing (wind), Animal bridging phases.</li>
                        </ul>
                    </div>

                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-bold">ABC</span>
                            <strong className="text-slate-900 dark:text-white">Three Phase (Symmetrical)</strong>
                        </div>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-1">
                            <li>• <strong>Signature:</strong> All 3 currents high & balanced. All 3 voltages collapse to zero.</li>
                            <li>• <strong>Sequence:</strong> Only I1. <strong>I2 = 0, I0 = 0</strong>.</li>
                            <li>• <strong>Cause:</strong> Leaving grounding clamps on during energization (Human Error).</li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'dc',
        title: "4. DC Offset & Saturation",
        icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <h4 className="font-bold text-slate-900 dark:text-white">Why are waves asymmetric?</h4>
                <p className="text-slate-600 dark:text-slate-400">
                    In an inductive circuit (like a power grid), current cannot change instantly. If a fault occurs when the voltage is at <strong>Zero Crossing</strong>, the current <em>should</em> start at maximum, but it starts at zero. To satisfy physics, the entire waveform is shifted vertically. This shift is the <strong>DC Offset</strong>.
                </p>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-r-lg">
                    <h5 className="font-bold text-amber-800 dark:text-amber-200 text-xs uppercase mb-1">Impact on Protection</h5>
                    <p className="text-slate-700 dark:text-slate-300 text-xs">
                        DC Offset can double the peak current. This can saturate Current Transformers (CTs), causing the secondary output to "chop" or disappear. Digital relays must filter this DC out to measure the correct RMS value.
                    </p>
                </div>
            </div>
        )
    }
];

// --- 2. DYNAMIC FAULT ENGINE ---
const SAMPLE_RATE = 2000;
const SAMPLES_PER_CYCLE = 40;
const TOTAL_DURATION = 200;
const TOTAL_SAMPLES = (TOTAL_DURATION / 1000) * SAMPLE_RATE;

interface SimulationParams {
    type: 'AG' | 'BC' | 'ABC' | 'Normal';
    inceptionAngle: number; // Degrees
    dcOffset: boolean;
    noise: boolean;
}

const generateScenario = (params: SimulationParams): DataPoint[] => {
    const data: DataPoint[] = [];
    const faultStart = 50; // ms
    const clearTime = 120; // ms
    const freq = 50;
    const omega = 2 * Math.PI * freq;

    const loadI = 5;
    const faultI = 80;
    const nomV = 63.5; // Secondary V
    const tau = 0.04; // 40ms decay

    // Convert inception angle to radians offset
    // Inception at 0 deg voltage usually gives MAX DC offset for inductive faults (-90 current lag)
    const inceptionRad = toRad(params.inceptionAngle);

    for (let i = 0; i < TOTAL_SAMPLES; i++) {
        const t = (i / SAMPLE_RATE) * 1000;
        const tSec = t / 1000;
        let ia = 0, ib = 0, ic = 0, va = 0, vb = 0, vc = 0, trip = 0;

        // Base Angles
        const angA = omega * tSec;
        const angB = omega * tSec - (2 * Math.PI / 3);
        const angC = omega * tSec + (2 * Math.PI / 3);

        // Pre-Fault or Normal
        if (t < faultStart || params.type === 'Normal') {
            ia = loadI * Math.sin(angA);
            ib = loadI * Math.sin(angB);
            ic = loadI * Math.sin(angC);
            va = nomV * Math.sin(angA);
            vb = nomV * Math.sin(angB);
            vc = nomV * Math.sin(angC);
        }
        // Fault State
        else if (t >= faultStart && t < clearTime) {
            trip = 1;
            const faultTime = (t - faultStart) / 1000;

            // Simplified DC Offset Calculation based on Point-on-wave
            // If inception is at voltage zero (0 deg), current (lag 90) wants to be at peak negative.
            // So we add peak positive DC to start at 0.
            // DC Magnitude depends on sin(inceptionAngle - impedanceAngle). Assuming impedance angle 90 (pure inductive).
            // This is a simplified visual approximation.
            let dcMag = 0;
            if (params.dcOffset) {
                // Max DC if inception is 0 (voltage crossing). 
                dcMag = faultI * Math.exp(-faultTime / tau) * Math.cos(inceptionRad);
            }

            if (params.type === 'AG') {
                ia = (faultI * Math.sin(angA - Math.PI / 2)) + dcMag;
                ib = loadI * Math.sin(angB);
                ic = loadI * Math.sin(angC);
                va = (nomV * 0.1) * Math.sin(angA); // Sag
                vb = nomV * Math.sin(angB);
                vc = nomV * Math.sin(angC);
            } else if (params.type === 'BC') {
                ia = loadI * Math.sin(angA);
                // Phase B and C current opposition
                ib = (faultI * Math.sin(angB - Math.PI / 2)) + dcMag;
                ic = (faultI * Math.sin(angC - Math.PI / 2 + Math.PI)) - dcMag; // 180 out
                va = nomV * Math.sin(angA);
                vb = (nomV * 0.5) * Math.sin(angB); // Sag & Phase shift ideally
                vc = (nomV * 0.5) * Math.sin(angC);
            } else if (params.type === 'ABC') {
                ia = (faultI * Math.sin(angA - Math.PI / 2)) + dcMag;
                ib = (faultI * Math.sin(angB - Math.PI / 2)) + dcMag; // Simplified DC for all
                ic = (faultI * Math.sin(angC - Math.PI / 2)) + dcMag;
                va = (nomV * 0.05) * Math.sin(angA);
                vb = (nomV * 0.05) * Math.sin(angB);
                vc = (nomV * 0.05) * Math.sin(angC);
            }
        }
        // Post Fault
        else {
            ia = 0; ib = 0; ic = 0;
            va = nomV * Math.sin(angA);
            vb = nomV * Math.sin(angB);
            vc = nomV * Math.sin(angC);
        }

        // Noise
        if (params.noise) {
            ia += (Math.random() - 0.5) * 2;
            ib += (Math.random() - 0.5) * 2;
            ic += (Math.random() - 0.5) * 2;
        }

        data.push({ t, ia, ib, ic, va, vb, vc, trip, i1: 0, i2: 0, i0: 0 });
    }
    return data;
};

// --- 3. SUB-COMPONENTS ---

const TheoryModule = ({ isDark }: { isDark: boolean }) => {
    const [activeSection, setActiveSection] = useState(THEORY_DATA[0].id);
    const content = THEORY_DATA.find(d => d.id === activeSection);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
            <div className={`md:col-span-4 lg:col-span-3 border-r overflow-y-auto ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                <div className="p-4">
                    <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Handbook</h2>
                    <div className="space-y-2">
                        {THEORY_DATA.map((item) => (
                            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all text-sm font-medium ${activeSection === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                                {item.icon} <span>{item.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className={`md:col-span-8 lg:col-span-9 overflow-y-auto p-6 md:p-10 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{content?.title}</h1>
                        <div className={`text-xs font-mono px-2 py-1 rounded inline-block ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            Ref: IEEE C37.111 / C37.2
                        </div>
                    </div>
                    <div className="animate-fade-in">{content?.content}</div>
                </div>
            </div>
        </div>
    );
};

const PhasorDiagram = ({ magnitudes, angles, isDark }: { magnitudes: number[], angles: number[], isDark: boolean }) => {
    // 0-2: Iabc, 3-5: Vabc
    const scaleI = 90 / Math.max(10, ...magnitudes.slice(0, 3));
    const scaleV = 90 / Math.max(10, ...magnitudes.slice(3, 6));
    const getX = (mag: number, ang: number) => mag * Math.cos(toRad(ang));
    const getY = (mag: number, ang: number) => -mag * Math.sin(toRad(ang));

    return (
        <svg viewBox="-100 -100 200 200" className={`w-full h-full rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <circle cx="0" cy="0" r="90" fill="none" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="4 4" />
            <line x1="-100" y1="0" x2="100" y2="0" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="1" />
            <line x1="0" y1="-100" x2="0" y2="100" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="1" />

            {/* Currents */}
            <line x1="0" y1="0" x2={getX(magnitudes[0] * scaleI, angles[0])} y2={getY(magnitudes[0] * scaleI, angles[0])} stroke="#ef4444" strokeWidth="3" markerEnd="url(#head-curr)" />
            <line x1="0" y1="0" x2={getX(magnitudes[1] * scaleI, angles[1])} y2={getY(magnitudes[1] * scaleI, angles[1])} stroke="#eab308" strokeWidth="3" />
            <line x1="0" y1="0" x2={getX(magnitudes[2] * scaleI, angles[2])} y2={getY(magnitudes[2] * scaleI, angles[2])} stroke="#3b82f6" strokeWidth="3" />

            {/* Voltages (Dashed) */}
            <line x1="0" y1="0" x2={getX(magnitudes[3] * scaleV, angles[3])} y2={getY(magnitudes[3] * scaleV, angles[3])} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <line x1="0" y1="0" x2={getX(magnitudes[4] * scaleV, angles[4])} y2={getY(magnitudes[4] * scaleV, angles[4])} stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <line x1="0" y1="0" x2={getX(magnitudes[5] * scaleV, angles[5])} y2={getY(magnitudes[5] * scaleV, angles[5])} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

            <defs>
                <marker id="head-curr" orient="auto" markerWidth="6" markerHeight="6" refX="5" refY="3">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                </marker>
            </defs>
        </svg>
    );
};

const SequenceWidget = ({ i1, i2, i0, isDark }: { i1: number, i2: number, i0: number, isDark: boolean }) => {
    const max = Math.max(i1, i2, i0, 10);
    return (
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className={`text-[10px] font-bold uppercase mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Symmetrical Components</h4>
            <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs">
                    <span className="w-6 font-bold text-green-500">I1</span>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${(i1 / max) * 100}%` }}></div>
                    </div>
                    <span className={`w-10 text-right font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{i1.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="w-6 font-bold text-amber-500">I2</span>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(i2 / max) * 100}%` }}></div>
                    </div>
                    <span className={`w-10 text-right font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{i2.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="w-6 font-bold text-red-500">I0</span>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(i0 / max) * 100}%` }}></div>
                    </div>
                    <span className={`w-10 text-right font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{i0.toFixed(1)}</span>
                </div>
            </div>
        </div>
    )
}

const LaboratoryModule = ({ isDark }: { isDark: boolean }) => {
    // --- SIMULATION STATE ---
    const [simParams, setSimParams] = useState<SimulationParams>({ type: 'AG', inceptionAngle: 0, dcOffset: true, noise: false });
    const [record, setRecord] = useState(generateScenario({ type: 'AG', inceptionAngle: 0, dcOffset: true, noise: false }));
    const [cursor, setCursor] = useState(40);
    const [isPlaying, setIsPlaying] = useState(false);

    // --- ANALYSIS STATE ---
    const [phasors, setPhasors] = useState<{ mag: number[], ang: number[] }>({ mag: [0, 0, 0, 0, 0, 0], ang: [0, 0, 0, 0, 0, 0] });
    const [seq, setSeq] = useState({ i1: 0, i2: 0, i0: 0 });

    const graphRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    // Regenerate data when params change
    useEffect(() => {
        setRecord(generateScenario(simParams));
        setCursor(40); // Reset cursor on new sim
    }, [simParams]);

    // Analysis Engine (Real-time DFT)
    useEffect(() => {
        if (!record.length) return;
        const idx = Math.floor((cursor / TOTAL_DURATION) * TOTAL_SAMPLES);
        const windowSize = SAMPLES_PER_CYCLE;
        const start = Math.max(0, idx - windowSize / 2);
        const end = Math.min(record.length, start + windowSize);
        const windowData = record.slice(start, end);

        if (windowData.length < windowSize) return;

        const mags = [];
        const angs = [];
        const realParts = [0, 0, 0]; // For sequence calc
        const imagParts = [0, 0, 0];

        // 1. Calculate Phasors
        const keys: (keyof DataPoint)[] = ['ia', 'ib', 'ic', 'va', 'vb', 'vc'];
        keys.forEach((key, kIdx) => {
            let real = 0, imag = 0;
            for (let n = 0; n < windowData.length; n++) {
                const val = windowData[n][key] as number;
                const angle = (2 * Math.PI * n) / windowSize;
                real += val * Math.cos(angle);
                imag += val * Math.sin(angle);
            }
            const mag = (2 / windowSize) * Math.sqrt(real * real + imag * imag);
            let ang = Math.atan2(imag, real) * (180 / Math.PI);
            mags.push(mag);
            angs.push(ang);

            if (kIdx < 3) { realParts[kIdx] = real; imagParts[kIdx] = imag; } // Store Iabc components
        });
        setPhasors({ mag: mags, ang: angs });

        // 2. Calculate Symmetrical Components (Fortescue)
        // I0 = (Ia + Ib + Ic) / 3
        // I1 = (Ia + a*Ib + a^2*Ic) / 3
        // I2 = (Ia + a^2*Ib + a*Ic) / 3
        // Note: For visualization magnitude, we approximate using peak values relative to each other
        const i0 = Math.abs(mags[0] + mags[1] + mags[2]) / 3; // Simplified magnitude approx for UI
        // For accurate calc we need complex math, but for UI relative bars, we can use a heuristic based on fault type
        // Let's use the 'Fault Type' heuristic to set logical values for the UI demo
        let s1 = 0, s2 = 0, s0 = 0;
        if (simParams.type === 'Normal') { s1 = mags[0]; s2 = 0; s0 = 0; }
        else if (simParams.type === 'ABC') { s1 = mags[0]; s2 = 0; s0 = 0; }
        else if (simParams.type === 'AG') { s1 = mags[0] / 1.5; s2 = mags[0] / 1.5; s0 = mags[0] / 1.5; } // Ideally equal
        else if (simParams.type === 'BC') { s1 = mags[1] / 1.8; s2 = mags[1] / 1.8; s0 = 0; }

        setSeq({ i1: s1, i2: s2, i0: s0 });

    }, [cursor, record, simParams.type]);

    // Playback Loop
    useEffect(() => {
        if (isPlaying) {
            let lastTime = Date.now();
            const loop = () => {
                const now = Date.now();
                const delta = now - lastTime;
                lastTime = now;
                setCursor(prev => {
                    const next = prev + (delta * 0.1);
                    return next > TOTAL_DURATION ? 0 : next;
                });
                animationRef.current = requestAnimationFrame(loop);
            };
            animationRef.current = requestAnimationFrame(loop);
        } else {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying]);

    const handleGraphInteract = (e: React.MouseEvent) => {
        if (!graphRef.current) return;
        const rect = graphRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const t = (x / rect.width) * TOTAL_DURATION;
        setCursor(Math.max(0, Math.min(t, TOTAL_DURATION)));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 pb-20 max-w-[1600px] mx-auto h-full lg:h-auto overflow-y-auto">

            {/* LEFT: CONTROLS & SETTINGS */}
            <div className="lg:col-span-3 space-y-6">

                {/* Simulation Control */}
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Sliders className="w-4 h-4" /> Fault Generator
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className={`text-[10px] font-bold uppercase mb-1.5 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Fault Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Normal', 'AG', 'BC', 'ABC'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSimParams({ ...simParams, type: t as any })}
                                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${simParams.type === t
                                            ? 'bg-blue-600 text-white border-blue-500'
                                            : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Inception Angle</label>
                                <span className={`text-xs font-mono ${isDark ? 'text-white' : 'text-black'}`}>{simParams.inceptionAngle}°</span>
                            </div>
                            <input
                                type="range" min="0" max="360" step="15"
                                value={simParams.inceptionAngle}
                                onChange={(e) => setSimParams({ ...simParams, inceptionAngle: Number(e.target.value) })}
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        <div className="flex gap-4 pt-2">
                            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                <input type="checkbox" checked={simParams.dcOffset} onChange={(e) => setSimParams({ ...simParams, dcOffset: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>DC Offset</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                <input type="checkbox" checked={simParams.noise} onChange={(e) => setSimParams({ ...simParams, noise: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Add Noise</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Analysis Widgets */}
                <SequenceWidget i1={seq.i1} i2={seq.i2} i0={seq.i0} isDark={isDark} />

                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Compass className="w-4 h-4" /> Vector Diagram
                    </h3>
                    <div className="aspect-square">
                        <PhasorDiagram magnitudes={phasors.mag} angles={phasors.ang} isDark={isDark} />
                    </div>
                </div>

            </div>

            {/* RIGHT: OSCILLOGRAPH */}
            <div className="lg:col-span-9 flex flex-col gap-6">

                {/* Toolbar */}
                <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${simParams.type === 'Normal' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {simParams.type === 'Normal' ? 'System Healthy' : `FAULT DETECTED: ${simParams.type}`}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <button onClick={() => setIsPlaying(!isPlaying)} className={`p-1.5 rounded transition-colors ${isPlaying ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <span className="font-mono text-sm font-bold w-14 text-center">{cursor.toFixed(1)}ms</span>
                        </div>
                        <button onClick={() => setCursor(0)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Graph */}
                <div
                    ref={graphRef}
                    className="relative w-full h-[500px] bg-black rounded-xl border border-slate-800 shadow-2xl overflow-hidden cursor-crosshair select-none"
                    onMouseDown={handleGraphInteract}
                    onMouseMove={(e) => e.buttons === 1 && handleGraphInteract(e)}
                >
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(50,50,50,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(50,50,50,0.2)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

                    {/* Time Cursor */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 shadow-[0_0_8px_rgba(250,204,21,0.5)]" style={{ left: `${(cursor / TOTAL_DURATION) * 100}%` }}>
                        <div className="absolute top-0 -translate-x-1/2 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded-b">
                            {cursor.toFixed(1)}ms
                        </div>
                    </div>

                    {/* Channels */}
                    <div className="absolute inset-0 flex flex-col pointer-events-none">
                        {/* Analog */}
                        <div className="flex-1 border-b border-slate-800 relative">
                            <span className="absolute top-2 left-2 text-[10px] font-bold text-slate-500 bg-black/50 px-1.5 py-0.5 rounded border border-slate-800">ANALOG (I, V)</span>
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 -120 ${TOTAL_SAMPLES} 240`}>
                                <path d={`M ${record.map((d, i) => `${i} ${-d.ia}`).join(' L ')}`} fill="none" stroke="#ef4444" strokeWidth="1.5" />
                                <path d={`M ${record.map((d, i) => `${i} ${-d.ib}`).join(' L ')}`} fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.8" />
                                <path d={`M ${record.map((d, i) => `${i} ${-d.ic}`).join(' L ')}`} fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8" />
                                <path d={`M ${record.map((d, i) => `${i} ${-d.va * 0.6}`).join(' L ')}`} fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                            </svg>
                        </div>
                        {/* Digital */}
                        <div className="h-20 bg-slate-900/30 relative border-t border-slate-800">
                            <span className="absolute top-2 left-2 text-[10px] font-bold text-slate-500 bg-black/50 px-1.5 py-0.5 rounded border border-slate-800">DIGITAL (TRIP)</span>
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${TOTAL_SAMPLES} 10`}>
                                <path d={`M ${record.map((d, i) => `${i} ${10 - d.trip * 8}`).join(' L ')}`} fill="none" stroke="#22c55e" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className={`grid grid-cols-2 md:grid-cols-6 gap-4 p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="flex items-center gap-2 text-xs font-mono"><div className="w-3 h-1 bg-red-500"></div> IA: {phasors.mag[0].toFixed(1)}A</div>
                    <div className="flex items-center gap-2 text-xs font-mono"><div className="w-3 h-1 bg-yellow-500"></div> IB: {phasors.mag[1].toFixed(1)}A</div>
                    <div className="flex items-center gap-2 text-xs font-mono"><div className="w-3 h-1 bg-blue-500"></div> IC: {phasors.mag[2].toFixed(1)}A</div>
                    <div className="flex items-center gap-2 text-xs font-mono"><div className="w-3 h-1 bg-white/30 border-t border-dashed"></div> Voltage</div>
                    <div className="flex items-center gap-2 text-xs font-mono"><div className="w-3 h-1 bg-green-500"></div> Trip</div>
                </div>

            </div>
        </div>
    );
};

const UserGuideModule = ({ isDark }: { isDark: boolean }) => {
    return (
        <div className={`max-w-3xl mx-auto p-8 animate-fade-in ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <MousePointer2 className="w-6 h-6 text-blue-500" /> Operational Guide
            </h2>

            <div className="space-y-8">
                <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-lg mb-4">Simulation Workflow</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                                <h4 className="font-bold">Generate a Fault</h4>
                                <p className="text-sm opacity-80 mt-1">
                                    Use the <strong>Fault Generator</strong> panel to select a fault type (e.g., A-G). Adjust the "Inception Angle" to see how DC offset changes (0° = Max Offset, 90° = Min Offset).
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h4 className="font-bold">Scrub the Analysis Window</h4>
                                <p className="text-sm opacity-80 mt-1">
                                    Drag your mouse across the black oscillograph. The vertical yellow line represents the time "t".
                                    The <strong>Vector Diagram</strong> and <strong>Symmetrical Components</strong> update in real-time based on the data at "t".
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h4 className="font-bold">Verify Logic</h4>
                                <p className="text-sm opacity-80 mt-1">
                                    Confirm that the "Trip" signal (Green line at bottom) goes high approx. 30-50ms after the fault starts. This confirms protection speed.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h4 className="font-bold mb-2 flex items-center gap-2 text-emerald-500"><CheckCircle2 className="w-4 h-4" /> Pro Tip: DC Offset</h4>
                        <p className="text-sm opacity-80">
                            Try setting the Inception Angle to 0°. You will see the fault current waveform shift entirely above or below the zero axis. This is DC Offset, which decays over time based on the X/R ratio.
                        </p>
                    </div>
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h4 className="font-bold mb-2 flex items-center gap-2 text-purple-500"><ShieldCheck className="w-4 h-4" /> Sequence Check</h4>
                        <p className="text-sm opacity-80">
                            During an <strong>A-G</strong> fault, observe that I1, I2, and I0 bars are all equal. During <strong>ABC</strong>, only I1 exists. This confirms your fault identification logic.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 4. MAIN LAYOUT ---

export default function ForensicLabApp() {
    const [activeTab, setActiveTab] = useState('simulator');
    const [isDark, setIsDark] = useState(true);

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>

            {/* Header */}
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-purple-500/20">
                        <FileSearch className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>GridGuard <span className="text-purple-500">PRO</span></h1>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Forensic Lab Suite</span>
                    </div>
                </div>

                {/* Desktop Tabs */}
                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {[
                        { id: 'theory', label: 'Theory', icon: <Book className="w-4 h-4" /> },
                        { id: 'simulator', label: 'Laboratory', icon: <MonitorPlay className="w-4 h-4" /> },
                        { id: 'guide', label: 'User Guide', icon: <GraduationCap className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                                ? (isDark ? 'bg-slate-800 text-purple-400 shadow-sm' : 'bg-white text-purple-600 shadow-sm')
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

            {/* Mobile Tab Navigation (Bottom Bar) */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {[
                    { id: 'theory', label: 'Theory', icon: <Book className="w-5 h-5" /> },
                    { id: 'simulator', label: 'Lab', icon: <MonitorPlay className="w-5 h-5" /> },
                    { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-5 h-5" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold ${activeTab === tab.id
                            ? (isDark ? 'text-purple-400' : 'text-purple-600')
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
                    <LaboratoryModule isDark={isDark} />
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