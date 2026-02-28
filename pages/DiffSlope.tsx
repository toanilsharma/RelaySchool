import React, { useState, useEffect, useRef } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import {
    GitMerge, Sliders, Zap, CheckCircle2, AlertTriangle,
    Activity, BookOpen, ShieldCheck, TrendingUp, Info,
    Sun, Moon, RotateCcw, MonitorPlay, Terminal,
    AlertOctagon, MousePointer2, Book, GraduationCap,
    ArrowRight, FileText, Menu, RefreshCw, Share2
} from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { useSmoothedValues } from '../hooks/useSmoothedValues';
import Slider from '../components/Slider';
import SEO from "../components/SEO";

// --- 1. ENGINEERING CONSTANTS ---
const IEEE_C37_91 = "IEEE Guide for Protective Relay Applications to Power Transformers";
const IEC_60255 = "IEC Standard for Measuring Relays and Protection Equipment";

// --- 2. THEORY & MANUAL DATA ---

// Helper for Info Boxes (Moved up to avoid TDZ ReferenceError)
const BoxInfo = ({ title, color, children }: { title: string, color: string, children: React.ReactNode }) => {
    // Maps for dynamic classes (tailored for specific colors used)
    const colorClasses: Record<string, string> = {
        blue: "border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100",
        emerald: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100",
        purple: "border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-900 dark:text-purple-100",
        pink: "border-pink-500 bg-pink-50 dark:bg-pink-900/10 text-pink-900 dark:text-pink-100",
        amber: "border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-100",
    };
    const defaultClass = colorClasses['blue'];
    const activeClass = colorClasses[color] || defaultClass;

    return (
        <div className={`p-4 rounded-xl border-l-4 shadow-sm ${activeClass}`}>
            <h5 className="font-bold flex items-center gap-2 mb-2">{title}</h5>
            <div className="text-sm opacity-90">{children}</div>
        </div>
    );
};
const THEORY_DATA = [
    {
        id: 'fundamentals',
        title: "1. Fundamentals of Unit Protection",
        icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <div className="p-5 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm">
                    <h3 className="text-lg font-bold mb-2 text-emerald-900 dark:text-emerald-100">Kirchhoff's Current Law (KCL) Applied</h3>
                    <p className="text-slate-800 dark:text-slate-200">
                        Differential protection (ANSI 87) is the gold standard for protecting critical assets like Transformers, Generators, and Motors. 
                        It is based on the principle of <strong>Unit Protection</strong>: checking if the current entering a zone equals the current leaving it.
                    </p>
                    <div className="mt-4 font-mono text-center bg-white dark:bg-black/30 p-2 rounded border border-emerald-200 dark:border-emerald-800">
                        <InlineMath math={'\\sum I_{in} + \\sum I_{out} = 0'} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="space-y-2">
                        <strong className="block text-slate-900 dark:text-white border-b pb-1">External Fault (Through Fault)</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Current flows IN from the source and OUT to the fault location. The relay sees equal and opposite currents.
                            <br/><strong>Result:</strong> <InlineMath math={'I_{diff} \\approx 0'} />. Relay is STABLE.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <strong className="block text-slate-900 dark:text-white border-b pb-1">Internal Fault</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Current flows IN from all sources towards the fault inside the zone.
                            <br/><strong>Result:</strong> <InlineMath math={'I_{diff} = \\sum I_{feeders}'} />. Relay TRIPS.
                        </p>
                    </div>
                </div>

                <p className="text-slate-700 dark:text-slate-300">
                    <strong>Selectivity vs. Sensitivity:</strong> Unlike Overcurrent (51) relays which must coordinate with downstream devices, Differential (87) relays are essentially "selfish". They only care about their defined zone (bounded by CTs). This allows them to trip instantaneously (<strong>&lt;30ms</strong>) without waiting for downstream breakers.
                </p>
            </div>
        )
    },
    {
        id: 'dualslope',
        title: "2. The Dual Slope Characteristic",
        icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        In an ideal world, <InlineMath math={'I_{diff}'} /> would be exactly zero for all external faults. In reality, CT errors, tap changer positions, and relay measurement inaccuracies creating a "False Differential" current.
                        To prevent nuisance tripping, we use a <strong>Biased Differential</strong> characteristic.
                    </p>

                    <BoxInfo title="The Bias Equation" color="blue">
                        <p>We define two quantities:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Operate Current (Idiff):</strong> <InlineMath math={'|\\vec{I}_1 + \\vec{I}_2|'} /></li>
                            <li><strong>Restraint Current (Ibias):</strong> <InlineMath math={'(|\\vec{I}_1| + |\\vec{I}_2|) / 2'} /> (Average) or sometimes <InlineMath math={'max(|\\vec{I}_1|, |\\vec{I}_2|)'} /></li>
                        </ul>
                        <p className="mt-2 text-xs">The relay trips if: <InlineMath math={'I_{diff} > K \\times I_{bias} + I_{pickup}'} /></p>
                    </BoxInfo>

                    <h4 className="font-bold text-slate-900 dark:text-white mt-4 border-b pb-2">Why Two Slopes?</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                            <strong className="text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider">Slope 1 (20-30%)</strong>
                            <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                                Handles linear errors during normal load or mild faults.
                                <br/>- CT Ratio Mismatch (up to 5%)
                                <br/>- On-Load Tap Changer (OLTC) range (maybe <InlineMath math={'\\pm 10\\%'} />)
                                <br/>- Relay ADC drift
                            </p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                            <strong className="text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">Slope 2 (60-80%)</strong>
                            <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                                Handles <strong>CT Saturation</strong> during massive through-faults.
                                When one CT saturates, it stops producing secondary current, causing a huge false Idiff.
                                By increasing the required trip ratio (Slope 2) at high currents, we ensure stability.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'harmonics',
        title: "3. Inrush & Harmonic Blocking",
        icon: <Activity className="w-5 h-5 text-purple-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Magnetizing Inrush</h4>
                <p className="text-slate-600 dark:text-slate-400">
                    When energizing a transformer, the core may be driven deep into saturation for a few seconds. This draws a large asymmetric current (up to 10-12x FLA) from the source.
                    Since there is no load connected yet, current enters but doesn't leave.
                    To the 87 relay, this looks purely <strong>Unknown</strong> (Internal Fault).
                </p>

                <div className="p-4 rounded-xl border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/10">
                    <h5 className="font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Physics of Inrush
                    </h5>
                    <p className="mt-2 text-xs text-purple-800 dark:text-purple-200">
                        Inrush waveforms are non-sinusoidal. A Fourier Transform reveals they are rich in <strong>Even Harmonics</strong>, specifically the <strong>2nd Harmonic (100Hz/120Hz)</strong>.
                        <br/><br/>
                        <strong>Identification:</strong> If <InlineMath math={'I_{2nd}/I_{1st} > 15\\%'} />, it's Inrush. Block the trip!
                        <br/>
                        <strong>Faults:</strong> Internal faults are sinusoidal (Odd Harmonics only). <InlineMath math={'I_{2nd} \\approx 0'} />. Trip allowed.
                    </p>
                </div>

                <div className="mt-6">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Other Harmonics</h4>
                    <ul className="space-y-2 text-xs">
                        <li className="flex gap-2">
                            <span className="font-bold bg-amber-100 text-amber-800 px-1 rounded">5th Harmonic</span>
                            <span className="text-slate-600 dark:text-slate-400">
                                Caused by <strong>Overexcitation (V/Hz)</strong>. The core is saturated due to high voltage or low frequency.
                                The relay should trip (or alarm) but usually on a separate "Volts/Hz" (24) element. Some 87 relays block on 5th harmonic to prevent misoperation.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        id: 'ct_reqs',
        title: "4. CT Selection & Knee Point",
        icon: <Sliders className="w-5 h-5 text-pink-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <p className="text-slate-600 dark:text-slate-400">
                    Differential protection puts the highest demand on Current Transformers. They must not saturate for external faults (to ensure stability) and must perform reasonably well for internal faults (to ensure speed).
                </p>

                <BoxInfo title="Dimensioning Class X (IEC 60044-1 / 61869-2)" color="pink">
                    <p>For high-impedance differential schemes or strict low-impedance requirements, we calculate the required Knee Point Voltage <InlineMath math={'(V_k)'} />.</p>
                    <div className="font-mono text-center my-2 p-2 bg-white dark:bg-black/20 rounded">
                        <InlineMath math={'V_k \\ge K \\times I_{f,max} (R_{ct} + 2 R_{lead})'} />
                    </div>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                        <li><strong>K:</strong> Transient dimensioning factor. Typically 2.0 to account for DC offset.</li>
                        <li><strong>If,max:</strong> Maximum through-fault current (external fault).</li>
                        <li><strong>Rct:</strong> Internal resistance of the CT secondary winding.</li>
                    </ul>
                </BoxInfo>

                <div className="mt-4">
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">Common Pitfalls</h5>
                    <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-xs">
                        <li>• <strong>Lead Burden:</strong> Using 2.5mm² wire instead of 4mm² or 6mm² can double <InlineMath math={'R_{lead}'} />, causing saturation.</li>
                        <li>• <strong>Remanence:</strong> If a fault is cleared at zero-crossing (max flux), the CT core retains magnetic flux ("memory"). The next fault might saturate it instantly. Solution: Gapped cores (class TPZ/PR).</li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        id: 'standards',
        title: "5. Testing & Commissioning",
        icon: <BookOpen className="w-5 h-5 text-amber-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">The Stability Test</h4>
                <p className="text-slate-600 dark:text-slate-400">
                    The most critical test for any differential scheme. You must prove that for an external fault (load current), the relay sees ZERO differential current.
                </p>

                <div className="space-y-4 my-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        <strong className="block text-slate-900 dark:text-white mb-1">Step 1: Primary Injection</strong>
                        <p className="text-xs text-slate-500">
                            Apply low voltage (415V) to the HV side of the transformer with LV shorted. This circulates typically 5-10% of nominal current.
                        </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        <strong className="block text-slate-900 dark:text-white mb-1">Step 2: Measure Spill Current</strong>
                        <p className="text-xs text-slate-500">
                            Connect an ammeter in the diff circuit. It should read nearly 0mA.
                            <br/>
                            <strong>If it reads <InlineMath math={'2 \\times I_{load}'} />:</strong> One CT polarity is reversed! This is a classic commissioning error.
                        </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        <strong className="block text-slate-900 dark:text-white mb-1">Step 3: Slope Verification</strong>
                        <p className="text-xs text-slate-500">
                            Using a secondary injection kit (Omicron/Doble), inject I1 and I2 at various angles to trace the Slope 1 and Slope 2 characteristic.
                            <br/>
                            Reference <strong>IEEE C37.91 Clause 8</strong> for specific test points.
                        </p>
                    </div>
                </div>
            </div>
        )
    }
];



// --- 3. SUB-COMPONENTS ---

const TheoryModule = ({ isDark }: { isDark: boolean }) => {
    const [activeSection, setActiveSection] = useState(THEORY_DATA[0].id);
    const content = THEORY_DATA.find(d => d.id === activeSection);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
            {/* Sidebar */}
            <div className={`md:col-span-4 lg:col-span-3 border-r overflow-y-auto ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                <div className="p-4">
                    <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Table of Contents</h2>
                    <div className="space-y-2">
                        {THEORY_DATA.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all text-sm font-medium ${activeSection === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`md:col-span-8 lg:col-span-9 overflow-y-auto p-6 md:p-10 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{content?.title}</h1>
                        <div className={`text-xs font-mono px-2 py-1 rounded inline-block ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            Ref: IEEE C37.91 / IEC 60255
                        </div>
                    </div>
                    <div className="animate-fade-in">
                        {content?.content}
                    </div>
                </div>
            </div>
        </div>
    );
};

const VectorPreview = ({ i1, i2, ang, isDark }: { i1: number, i2: number, ang: number, isDark: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cvs = canvasRef.current;
        const container = containerRef.current;
        if (!cvs || !container) return;

        // Responsive Sizing
        cvs.width = container.clientWidth;
        cvs.height = 150; // Fixed height for vector view

        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        const w = cvs.width;
        const h = cvs.height;
        const cx = w / 2;
        const cy = h / 2;
        const scale = Math.min(w, h) / 10; // Dynamic scale

        // Colors
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        const i1Color = '#3b82f6';
        const i2Color = '#f59e0b';
        const diffColor = '#ef4444';

        ctx.clearRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

        // I1 (Reference)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + i1 * scale, cy);
        ctx.strokeStyle = i1Color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = i1Color;
        ctx.beginPath(); ctx.arc(cx + i1 * scale, cy, 3, 0, 2 * Math.PI); ctx.fill();

        // I2 (Rotated)
        const angRad = ang * (Math.PI / 180);
        const i2x = cx + i2 * scale * Math.cos(angRad);
        const i2y = cy - i2 * scale * Math.sin(angRad);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(i2x, i2y);
        ctx.strokeStyle = i2Color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = i2Color;
        ctx.beginPath(); ctx.arc(i2x, i2y, 3, 0, 2 * Math.PI); ctx.fill();

        // Idiff (Vector Sum)
        const diffX = i1 * scale + i2 * scale * Math.cos(angRad);
        const diffY = - (i2 * scale * Math.sin(angRad));

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + diffX, cy + diffY);
        ctx.strokeStyle = diffColor;
        ctx.setLineDash([4, 2]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

    }, [i1, i2, ang, isDark]);

    return (
        <div ref={containerRef} className="w-full">
            <canvas ref={canvasRef} className={`rounded-lg border w-full ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`} />
        </div>
    );
};

const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    // Settings
    const [pickup, setPickup] = useState(0.3);
    const [slope1, setSlope1] = useState(30);
    const [slope2, setSlope2] = useState(70);
    const [breakPoint, setBreakPoint] = useState(2.0);
    const [harmonicBlock, setHarmonicBlock] = useState(15);

    // Injection
    const [i1Mag, setI1Mag] = useState(1.0);
    const [i2Mag, setI2Mag] = useState(1.0);
    const [angleDiff, setAngleDiff] = useState(180);
    const [injectedHarmonic, setInjectedHarmonic] = useState(0);

    // Smooth values for Canvas tweening and odometers
    const smoothed = useSmoothedValues({ pickup, slope1, slope2, breakPoint, harmonicBlock, i1Mag, i2Mag, angleDiff, injectedHarmonic });

    // Math
    const angRad = smoothed.angleDiff * (Math.PI / 180);
    const diffReal = smoothed.i1Mag + (smoothed.i2Mag * Math.cos(angRad));
    const diffImag = smoothed.i2Mag * Math.sin(angRad);
    const idiff = Math.sqrt(diffReal * diffReal + diffImag * diffImag);
    const ibias = (smoothed.i1Mag + smoothed.i2Mag) / 2;

    const s1 = smoothed.slope1 / 100;
    const s2 = smoothed.slope2 / 100;

    let currentTripThreshold = 0;
    if (ibias < smoothed.breakPoint) {
        currentTripThreshold = Math.max(smoothed.pickup, s1 * ibias);
    } else {
        const yAtBreak = Math.max(smoothed.pickup, s1 * smoothed.breakPoint);
        currentTripThreshold = yAtBreak + s2 * (ibias - smoothed.breakPoint);
    }

    const isAboveCurve = idiff > currentTripThreshold;
    const isHarmonicBlocked = smoothed.injectedHarmonic > smoothed.harmonicBlock;
    const isTrip = isAboveCurve && !isHarmonicBlocked;

    // Presets
    const setInternalFault = () => { setI1Mag(3.5); setI2Mag(0.5); setAngleDiff(20); setInjectedHarmonic(2); };
    const setExternalFault = () => { setI1Mag(4.0); setI2Mag(4.0); setAngleDiff(180); setInjectedHarmonic(2); };
    const setSaturation = () => { setI1Mag(5.0); setI2Mag(3.0); setAngleDiff(160); setInjectedHarmonic(5); };
    const setInrush = () => { setI1Mag(3.0); setI2Mag(0.0); setAngleDiff(0); setInjectedHarmonic(35); };
    const setCTMismatch = () => { setI1Mag(2.0); setI2Mag(1.8); setAngleDiff(175); setInjectedHarmonic(0); };
    const setOverexcitation = () => { setI1Mag(1.5); setI2Mag(0.5); setAngleDiff(40); setInjectedHarmonic(10); };

    // Reset function
    const resetValues = () => {
        setI1Mag(1.0); setI2Mag(1.0); setAngleDiff(180); setInjectedHarmonic(0);
        setPickup(0.3); setSlope1(30); setSlope2(70); setBreakPoint(2.0); setHarmonicBlock(15);
    };

    // Canvas Logic
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const stateParam = params.get('s');
        if (stateParam) {
            try {
                const state = JSON.parse(atob(stateParam));
                if (state.pickup !== undefined) setPickup(state.pickup);
                if (state.slope1 !== undefined) setSlope1(state.slope1);
                if (state.slope2 !== undefined) setSlope2(state.slope2);
                if (state.breakPoint !== undefined) setBreakPoint(state.breakPoint);
                if (state.harmonicBlock !== undefined) setHarmonicBlock(state.harmonicBlock);
                if (state.i1Mag !== undefined) setI1Mag(state.i1Mag);
                if (state.i2Mag !== undefined) setI2Mag(state.i2Mag);
                if (state.angleDiff !== undefined) setAngleDiff(state.angleDiff);
                if (state.injectedHarmonic !== undefined) setInjectedHarmonic(state.injectedHarmonic);
            } catch (e) {
                console.error("Failed to parse share link", e);
            }
        }
    }, []);

    const copyShareLink = () => {
        const state = { pickup, slope1, slope2, breakPoint, harmonicBlock, i1Mag, i2Mag, angleDiff, injectedHarmonic };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert("Simulation link copied! You can share this URL to load the exact state.");
    };

    useEffect(() => {
        const cvs = canvasRef.current;
        const container = containerRef.current;
        if (!cvs || !container) return;

        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        // Resize canvas to container width for responsiveness
        cvs.width = container.clientWidth;
        cvs.height = container.clientHeight;

        const w = cvs.width;
        const h = cvs.height;
        const scale = w > 500 ? 50 : 35; // Adjust scale for mobile/desktop
        const ox = 50;
        const oy = h - 40;

        // Colors
        const bgColor = isDark ? '#0f172a' : '#ffffff';
        const gridColor = isDark ? '#334155' : '#cbd5e1';
        const axisColor = isDark ? '#94a3b8' : '#64748b';
        const curveColor = '#3b82f6';

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);

        // Fill entire area red first (Trip Zone)
        ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.05)';
        ctx.fillRect(0, 0, w, h);

        // Fill under curve green (Restraint Zone)
        ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)';
        ctx.beginPath();
        ctx.moveTo(ox, oy);

        const maxX_pu = (w - ox) / scale;
        for (let xb = 0; xb <= maxX_pu; xb += 0.1) {
            let y_val = 0;
            if (xb < smoothed.breakPoint) {
                y_val = Math.max(smoothed.pickup, s1 * xb);
            } else {
                const yAtBreak = Math.max(smoothed.pickup, s1 * smoothed.breakPoint);
                y_val = yAtBreak + s2 * (xb - smoothed.breakPoint);
            }
            ctx.lineTo(ox + xb * scale, oy - y_val * scale);
        }
        ctx.lineTo(w, oy);
        ctx.lineTo(ox, oy);
        ctx.fill();

        // Grid & Axes
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        // Verticals
        for (let i = 0; i < 20; i++) {
            const x = ox + i * scale;
            if (x > w) break;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            if (i % 2 === 0) {
                ctx.fillStyle = axisColor; ctx.font = '10px sans-serif'; ctx.fillText(i.toString(), x - 3, oy + 15);
            }
        }
        // Horizontals
        for (let i = 0; i < 20; i++) {
            const y = oy - i * scale;
            if (y < 0) break;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            if (i % 2 === 0) {
                ctx.fillStyle = axisColor; ctx.font = '10px sans-serif'; ctx.fillText(i.toString(), ox - 15, y + 3);
            }
        }

        // Labels
        ctx.fillStyle = axisColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText("Ibias [pu]", w - 60, h - 10);
        ctx.save();
        ctx.translate(15, 60);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Idiff [pu]", 0, 0);
        ctx.restore();

        // Characteristic Line
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ox, oy - (smoothed.pickup * scale));
        for (let xb = 0; xb <= maxX_pu; xb += 0.1) {
            let y_val = 0;
            if (xb < smoothed.breakPoint) {
                y_val = Math.max(smoothed.pickup, s1 * xb);
            } else {
                const yAtBreak = Math.max(smoothed.pickup, s1 * smoothed.breakPoint);
                y_val = yAtBreak + s2 * (xb - smoothed.breakPoint);
            }
            ctx.lineTo(ox + xb * scale, oy - y_val * scale);
        }
        ctx.stroke();

        // Operating Point
        const ptX = ox + ibias * scale;
        const ptY = oy - idiff * scale;

        // Ghost line
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ptX, ptY); ctx.stroke();
        ctx.setLineDash([]);

        // The Dot
        ctx.fillStyle = isTrip ? '#ef4444' : isHarmonicBlocked ? '#f59e0b' : '#10b981';
        ctx.beginPath();
        ctx.arc(ptX, ptY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#fff' : '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Annotations
        ctx.fillStyle = curveColor;
        ctx.font = '12px sans-serif';
        const s1X = ox + (smoothed.breakPoint / 2) * scale;
        const s1Y = oy - (Math.max(smoothed.pickup, s1 * (smoothed.breakPoint / 2)) * scale) - 10;
        // Only draw text if it fits
        if (s1X < w) ctx.fillText(`K1: ${Math.round(smoothed.slope1)}%`, s1X, s1Y);

        const s2X = ox + (smoothed.breakPoint + 1) * scale;
        const s2Y = oy - ((Math.max(smoothed.pickup, s1 * smoothed.breakPoint) + s2) * scale) - 10;
        if (s2X < w && s2Y > 0) ctx.fillText(`K2: ${Math.round(smoothed.slope2)}%`, s2X, s2Y);

    }, [smoothed, ibias, idiff, isTrip, s1, s2, isHarmonicBlocked, isDark]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto p-4 md:p-6 pb-20">
            {/* SETTINGS PANEL */}
            <div className="lg:col-span-3 space-y-6">
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`font-bold flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Sliders className="w-4 h-4" /> Relay Settings (87)
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={copyShareLink} title="Share State" className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-indigo-900 text-indigo-400' : 'hover:bg-indigo-100 text-indigo-600'}`}>
                                <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={resetValues} title="Reset to Defaults" className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <Slider 
                            label="Pickup (Is1)" 
                            unit="pu" 
                            min={0.1} 
                            max={1.0} 
                            step={0.05} 
                            value={pickup} 
                            onChange={(e) => setPickup(Number(e.target.value))} 
                            color="blue"
                        />

                        <Slider 
                            label="Slope 1 (K1)" 
                            unit="%" 
                            min={10} 
                            max={60} 
                            step={5} 
                            value={slope1} 
                            onChange={(e) => setSlope1(Number(e.target.value))} 
                            color="blue"
                        />

                        <Slider 
                            label="Slope 2 (K2)" 
                            unit="%" 
                            min={50} 
                            max={150} 
                            step={5} 
                            value={slope2} 
                            onChange={(e) => setSlope2(Number(e.target.value))} 
                            color="blue"
                        />

                        <Slider 
                            label="Break Point (Is2)" 
                            unit="pu" 
                            min={1.0} 
                            max={5.0} 
                            step={0.5} 
                            value={breakPoint} 
                            onChange={(e) => setBreakPoint(Number(e.target.value))} 
                            color="blue"
                        />

                        <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <Slider 
                                label="2nd Harmonic Block" 
                                unit="%" 
                                min={5} 
                                max={30} 
                                step={1} 
                                value={harmonicBlock} 
                                onChange={(e) => setHarmonicBlock(Number(e.target.value))} 
                                color="amber"
                            />
                        </div>
                    </div>
                </div>

                {/* Scenarios */}
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Zap className="w-4 h-4" /> Quick Tests
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={setInternalFault} className={`py-3 px-2 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 ${isDark ? 'bg-red-900/20 text-red-300 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}>
                            <AlertOctagon className="w-4 h-4" /> Internal Fault
                        </button>
                        <button onClick={setExternalFault} className={`py-3 px-2 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 ${isDark ? 'bg-emerald-900/20 text-emerald-300 border-emerald-900/50 hover:bg-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                            <ShieldCheck className="w-4 h-4" /> Through Fault
                        </button>
                        <button onClick={setSaturation} className={`py-3 px-2 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 ${isDark ? 'bg-orange-900/20 text-orange-300 border-orange-900/50 hover:bg-orange-900/40' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'}`}>
                            <Activity className="w-4 h-4" /> CT Saturation
                        </button>
                        <button onClick={setInrush} className={`py-3 px-2 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 ${isDark ? 'bg-purple-900/20 text-purple-300 border-purple-900/50 hover:bg-purple-900/40' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}>
                            <TrendingUp className="w-4 h-4" /> Inrush
                        </button>
                        <button onClick={setCTMismatch} className={`py-3 px-2 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 ${isDark ? 'bg-blue-900/20 text-blue-300 border-blue-900/50 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}>
                            <RefreshCw className="w-4 h-4" /> CT Mismatch
                        </button>
                        <button onClick={setOverexcitation} className={`py-3 px-2 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 ${isDark ? 'bg-pink-900/20 text-pink-300 border-pink-900/50 hover:bg-pink-900/40' : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'}`}>
                            <Zap className="w-4 h-4" /> Overexcite
                        </button>
                    </div>
                </div>
            </div>

            {/* GRAPH PANEL */}
            <div ref={containerRef} className={`lg:col-span-6 rounded-2xl border p-1 flex flex-col shadow-inner relative overflow-hidden h-[400px] lg:h-[600px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <canvas ref={canvasRef} className={`w-full h-full rounded-xl ${isDark ? 'bg-slate-950' : 'bg-white'}`} />

                <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                    <div className={`backdrop-blur-md px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-700 text-emerald-400' : 'bg-white/80 border-slate-200 text-emerald-600'}`}>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Restraint Zone
                    </div>
                    <div className={`backdrop-blur-md px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-700 text-red-400' : 'bg-white/80 border-slate-200 text-red-600'}`}>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div> Trip Zone
                    </div>
                </div>
            </div>

            {/* STATUS PANEL */}
            <div className="lg:col-span-3 space-y-6">

                {/* Relay Decision Card */}
                <div className={`p-6 rounded-2xl border-l-4 flex flex-col items-center justify-center text-center transition-all duration-500 shadow-lg ${isTrip
                    ? isDark ? 'bg-red-900/10 border-red-500 text-red-400' : 'bg-red-50 border-red-500 text-red-700'
                    : isHarmonicBlocked
                        ? isDark ? 'bg-amber-900/10 border-amber-500 text-amber-400' : 'bg-amber-50 border-amber-500 text-amber-700'
                        : isDark ? 'bg-emerald-900/10 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    }`}>
                    <div>
                        <div className="text-[10px] font-bold uppercase opacity-60 mb-2 tracking-widest">Relay Status</div>
                        <div className="text-3xl font-black mb-2 tracking-tight">{isTrip ? 'TRIP' : isHarmonicBlocked ? 'BLOCKED' : 'STABLE'}</div>
                        {isHarmonicBlocked && <div className="text-[10px] font-bold bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">2nd Harmonic &gt; {harmonicBlock}%</div>}
                    </div>
                    <div className="mt-4 p-3 bg-white/5 rounded-full">
                        {isTrip ? <AlertTriangle className="w-8 h-8 animate-bounce" /> : isHarmonicBlocked ? <Activity className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                    </div>
                    {/* Margin to Trip */}
                    <div className={`mt-3 text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Margin: {isAboveCurve ? '-' : '+'}{Math.abs(((currentTripThreshold - idiff) / currentTripThreshold) * 100).toFixed(1)}% to characteristic
                    </div>
                </div>

                {/* Injection Controls */}
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Terminal className="w-4 h-4" /> Current Injection
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={`text-[10px] font-bold opacity-60 uppercase ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>I1 Mag (pu)</label>
                                <input type="number" min="0" max="100" step="0.1" value={i1Mag} onChange={(e) => setI1Mag(Math.min(100, Math.max(0, Number(e.target.value))))} className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm font-mono font-bold ${isDark ? 'bg-slate-950 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-black'}`} />
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold opacity-60 uppercase ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>I2 Mag (pu)</label>
                                <input type="number" min="0" max="100" step="0.1" value={i2Mag} onChange={(e) => setI2Mag(Math.min(100, Math.max(0, Number(e.target.value))))} className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm font-mono font-bold ${isDark ? 'bg-slate-950 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-black'}`} />
                            </div>
                        </div>
                        <Slider 
                            label="Phase Angle" 
                            unit="°" 
                            min={0} 
                            max={360} 
                            step={1} 
                            value={angleDiff} 
                            onChange={(e) => setAngleDiff(Number(e.target.value))} 
                            color="purple"
                        />
                        <Slider 
                            label="Injected Harmonic" 
                            unit="%" 
                            min={0} 
                            max={50} 
                            step={1} 
                            value={injectedHarmonic} 
                            onChange={(e) => setInjectedHarmonic(Number(e.target.value))} 
                            color="amber"
                        />
                    </div>

                    <div className={`mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-xs ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className={`p-2 rounded border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="opacity-50 text-[9px] uppercase font-bold">Idiff</div>
                            <div className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{idiff.toFixed(2)}</div>
                        </div>
                        <div className={`p-2 rounded border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="opacity-50 text-[9px] uppercase font-bold">Ibias</div>
                            <div className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{ibias.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Vector View */}
                <div className="hidden lg:block">
                    <h4 className={`text-[10px] font-bold uppercase mb-2 opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Vector Diagram</h4>
                    <VectorPreview i1={i1Mag} i2={i2Mag} ang={angleDiff} isDark={isDark} />
                </div>

                {/* Copy Analysis */}
                <button onClick={() => {
                    const txt = `DiffSlope Analysis\nIdiff: ${idiff.toFixed(3)} pu | Ibias: ${ibias.toFixed(3)} pu\nStatus: ${isTrip ? 'TRIP' : isHarmonicBlocked ? 'BLOCKED' : 'STABLE'}\nSettings: K1=${slope1}%, K2=${slope2}%, Pickup=${pickup}pu, BP=${breakPoint}pu\n2nd Harmonic: ${injectedHarmonic}% (Block at ${harmonicBlock}%)`;
                    navigator.clipboard.writeText(txt);
                }} className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center gap-2 transition-colors mt-4">
                    Copy Analysis
                </button>
            </div>
        </div>
    );
};

const UserGuideModule = ({ isDark }: { isDark: boolean }) => {
    return (
        <div className={`max-w-3xl mx-auto p-8 animate-fade-in ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <MousePointer2 className="w-6 h-6 text-blue-500" /> How to Use the Tool
            </h2>

            <div className="space-y-8">
                <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex gap-4 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>1</div>
                        <div>
                            <h3 className="font-bold text-lg">Set the Characteristic</h3>
                            <p className="text-sm opacity-80 mt-1">
                                Use the "Relay Settings" panel on the left to define your protection zone.
                                Typically, Slope 1 is 30% (for linear errors) and Slope 2 is 70% (for heavy saturation).
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>2</div>
                        <div>
                            <h3 className="font-bold text-lg">Inject Currents</h3>
                            <p className="text-sm opacity-80 mt-1">
                                Use the "Current Injection" panel on the right to simulate field conditions.
                                Adjust Magnitudes (I1, I2) and Phase Angle.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>3</div>
                        <div>
                            <h3 className="font-bold text-lg">Observe the Result</h3>
                            <p className="text-sm opacity-80 mt-1">
                                Watch the central graph. If the operating point (dot) crosses into the Red Zone, the relay trips.
                                Note how Inrush (2nd Harmonic) can block a trip even in the red zone.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h4 className="font-bold mb-2 flex items-center gap-2 text-emerald-500"><CheckCircle2 className="w-4 h-4" /> Simulation Goal</h4>
                        <p className="text-sm opacity-80">
                            Try to find the <strong>Stability Limit</strong>. Set an external fault (180° diff) and increase currents until CT saturation (Slope 2) is needed to prevent tripping.
                        </p>
                    </div>
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h4 className="font-bold mb-2 flex items-center gap-2 text-amber-500"><AlertOctagon className="w-4 h-4" /> Safety Note</h4>
                        <p className="text-sm opacity-80">
                            In real systems, open-circuiting a current transformer (CT) secondary can generate lethal voltages. Always short CTs before working!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 4. MAIN LAYOUT ---

export default function DifferentialProtectionApp() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
<SEO title="Diff Slope" description="Interactive Power System simulation and engineering tool: Diff Slope." url="/diffslope" />


            {/* Header */}
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-pink-600 to-rose-600 p-2 rounded-lg text-white shadow-lg shadow-pink-500/20">
                        <GitMerge className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>GridGuard <span className="text-pink-500">PRO</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Differential Analysis Suite</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full opacity-50"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500/80">✅ IEEE C37.91 / IEC 60255 Compliant</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Tabs */}
                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {[
                        { id: 'theory', label: 'Handbook', icon: <Book className="w-4 h-4" /> },
                        { id: 'simulator', label: 'Laboratory', icon: <MonitorPlay className="w-4 h-4" /> },
                        { id: 'guide', label: 'User Guide', icon: <GraduationCap className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                                ? (isDark ? 'bg-slate-800 text-pink-400 shadow-sm' : 'bg-white text-pink-600 shadow-sm')
                                : 'opacity-60 hover:opacity-100'
                                }`}
                        >
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Mobile Tab Navigation (Bottom Bar) */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {[
                    { id: 'theory', label: 'Theory', icon: <Book className="w-5 h-5" /> },
                    { id: 'simulator', label: 'Sim', icon: <MonitorPlay className="w-5 h-5" /> },
                    { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-5 h-5" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold ${activeTab === tab.id
                            ? (isDark ? 'text-pink-400' : 'text-pink-600')
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
                    <SimulatorModule isDark={isDark} />
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