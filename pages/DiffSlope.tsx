import React, { useState, useEffect, useRef } from 'react';
import {
    GitMerge, Sliders, Zap, CheckCircle2, AlertTriangle,
    Activity, BookOpen, ShieldCheck, TrendingUp,
    RotateCcw, MonitorPlay, Terminal, AlertOctagon,
    MousePointer2, Book, GraduationCap, Share2
} from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import PageSEO from '../components/SEO/PageSEO';

// --- 1. CUSTOM HOOKS ---

// Hook for system dark mode detection
const useThemeObserver = () => {
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(matchMedia.matches);
        const handler = (e) => setIsDark(e.matches);
        matchMedia.addEventListener('change', handler);
        return () => matchMedia.removeEventListener('change', handler);
    }, []);
    return isDark;
};

// Hook for spring-like physics interpolation
const useSmoothedValues = (targetValues, speed = 0.15) => {
    const [smoothed, setSmoothed] = useState(targetValues);
    const targetRef = useRef(targetValues);
    targetRef.current = targetValues;

    useEffect(() => {
        let frame;
        const update = () => {
            setSmoothed(prev => {
                let hasChanges = false;
                const next = { ...prev };
                for (const key in targetRef.current) {
                    const diff = targetRef.current[key] - prev[key];
                    if (Math.abs(diff) > 0.001) {
                        next[key] = prev[key] + diff * speed;
                        hasChanges = true;
                    } else {
                        next[key] = targetRef.current[key];
                    }
                }
                return hasChanges ? next : prev;
            });
            frame = requestAnimationFrame(update);
        };
        frame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frame);
    }, [speed]);
    return smoothed;
};

// --- 2. REUSABLE UI COMPONENTS ---

const Slider = ({ label, unit, min, max, step, value, onChange, color = "blue" }) => {
    const colorMap = {
        blue: 'accent-blue-500',
        emerald: 'accent-emerald-500',
        purple: 'accent-purple-500',
        pink: 'accent-pink-500',
        amber: 'accent-amber-500',
    };

    return (
        <div className="mb-4 group">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold uppercase opacity-60 group-hover:opacity-100 transition-opacity">{label}</label>
                <span className={`text-xs font-mono font-bold ${value > (max - min) * 0.8 + min ? 'text-red-500' : ''}`}>
                    {value.toFixed(step < 1 ? 2 : 0)} {unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 ${colorMap[color] || 'accent-blue-500'}`}
            />
        </div>
    );
};

const BoxInfo = ({ title, color, children }) => {
    const colorClasses = {
        blue: "border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100",
        emerald: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100",
        purple: "border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-900 dark:text-purple-100",
        pink: "border-pink-500 bg-pink-50 dark:bg-pink-900/10 text-pink-900 dark:text-pink-100",
        amber: "border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-100",
    };
    const activeClass = colorClasses[color] || colorClasses['blue'];

    return (
        <div className={`p-4 rounded-xl border-l-4 shadow-sm ${activeClass}`}>
            <h5 className="font-bold flex items-center gap-2 mb-2">{title}</h5>
            <div className="text-sm opacity-90">{children}</div>
        </div>
    );
};

const MathEq = ({ eq }) => (
    <span className="text-blue-600 dark:text-blue-400 font-semibold"><InlineMath math={eq} /></span>
);

// --- 3. THEORY CONTENT WITH INLINE SVGS ---

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
                        It is based on <strong>Unit Protection</strong>: ensuring the current entering a zone equals the current leaving it.
                    </p>
                    <div className="mt-4 text-center bg-white dark:bg-black/30 p-2 rounded border border-emerald-200 dark:border-emerald-800 text-lg">
                        <BlockMath math="\Sigma I_{in} + \Sigma I_{out} = 0" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="space-y-3">
                        <strong className="block text-slate-900 dark:text-white border-b pb-1">External Fault (Through Fault)</strong>
                        <svg viewBox="0 0 200 100" className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800">
                            <line x1="20" y1="50" x2="180" y2="50" stroke="#64748b" strokeWidth="4" />
                            <circle cx="100" cy="50" r="30" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
                            <path d="M 30,30 L 70,50 L 30,70 Z" fill="#3b82f6" opacity="0.8" />
                            <path d="M 130,30 L 170,50 L 130,70 Z" fill="#3b82f6" opacity="0.8" />
                            <text x="100" y="20" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">Protected Zone</text>
                            <text x="180" y="40" fill="#ef4444" fontSize="14" fontWeight="bold">⚡ Fault</text>
                        </svg>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Current flows IN from source and OUT to fault. Relay sees equal/opposite currents. <br /><strong>Result:</strong> <MathEq eq="I_{diff} \approx 0" />. STABLE.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <strong className="block text-slate-900 dark:text-white border-b pb-1">Internal Fault</strong>
                        <svg viewBox="0 0 200 100" className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800">
                            <line x1="20" y1="50" x2="180" y2="50" stroke="#64748b" strokeWidth="4" />
                            <circle cx="100" cy="50" r="30" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
                            <path d="M 30,30 L 70,50 L 30,70 Z" fill="#3b82f6" opacity="0.8" />
                            <path d="M 170,30 L 130,50 L 170,70 Z" fill="#3b82f6" opacity="0.8" />
                            <text x="100" y="40" fill="#ef4444" fontSize="14" fontWeight="bold" textAnchor="middle">⚡ Fault</text>
                        </svg>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Current flows IN from all sources towards the fault inside the zone. <br /><strong>Result:</strong> <MathEq eq="I_{diff} = \Sigma I_{feeders}" />. TRIPS.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'dualslope',
        title: "2. The Dual Slope Characteristic",
        icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <p className="text-slate-600 dark:text-slate-400">
                    In reality, CT errors, tap changer positions, and relay measurement inaccuracies create a "False Differential" current.
                    To prevent nuisance tripping, we use a <strong>Biased Differential</strong> characteristic.
                </p>

                <BoxInfo title="The Bias Equation (IEC Standard)" color="blue">
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Operate Current (<InlineMath math="I_{diff}"/>):</strong> <InlineMath math="|\vec{I}_1 + \vec{I}_2|" /></li>
                        <li><strong>Restraint Current (<InlineMath math="I_{bias}"/>):</strong> <InlineMath math="(|\vec{I}_1| + |\vec{I}_2|) / 2" /></li>
                    </ul>
                    <p className="mt-2 text-xs">Trip condition: <InlineMath math="I_{diff} > K \times I_{bias} + I_{pickup}" /></p>
                </BoxInfo>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        <strong className="text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider">Slope 1 (Typically 20-30%)</strong>
                        <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                            Handles linear errors during normal load or mild faults:
                            <br />• CT Ratio Mismatch (up to 5%)
                            <br />• On-Load Tap Changer (OLTC) range (&plusmn;10-15%)
                            <br />• ADC & Measurement drift
                        </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        <strong className="text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">Slope 2 (Typically 60-80%)</strong>
                        <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                            Handles <strong>CT Saturation</strong> during massive through-faults.
                            When a CT saturates, it produces zero secondary current, causing huge false <InlineMath math="I_{diff}"/>. Slope 2 drastically increases restraint to maintain stability.
                        </p>
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
                    Energizing a transformer drives the core deep into saturation. It draws a huge asymmetric current (up to 12x FLA) from the source. Since there is no load, it looks identical to an Internal Fault.
                </p>

                <svg viewBox="0 0 400 120" className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 my-4">
                    <polyline fill="none" stroke="#334155" strokeWidth="1" points="0,60 400,60" />
                    <path fill="none" stroke="#a855f7" strokeWidth="2"
                        d="M0,60 Q10,10 20,60 Q30,60 40,60 Q50,20 60,60 Q70,60 80,60 Q90,30 100,60 Q110,60 120,60 Q130,40 140,60"
                        transform="scale(2, 1) translate(0, 0)" />
                    <text x="20" y="20" fill="#a855f7" fontSize="12" fontWeight="bold">Asymmetric Inrush Waveform (Rich in 2nd Harmonic)</text>
                </svg>

                <div className="p-4 rounded-xl border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/10">
                    <h5 className="font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Harmonic Fingerprints
                    </h5>
                    <p className="mt-2 text-xs text-purple-800 dark:text-purple-200">
                        Inrush waveforms are heavily distorted. A Fourier Transform reveals high <strong>Even Harmonics</strong>, specifically the <strong>2nd Harmonic (100Hz/120Hz)</strong>.
                        <br /><br />
                        <strong>Identification:</strong> If <InlineMath math="I_{2nd} / I_{1st} > 15\%"/>, it's Inrush. <strong>Block the trip!</strong>
                        <br />
                        <strong>Faults:</strong> True faults are sinusoidal (Odd Harmonics only). <InlineMath math="I_{2nd} \approx 0"/>. Trip allowed.
                    </p>
                </div>
            </div>
        )
    }
];

// --- 4. SUB-MODULES ---

const TheoryModule = ({ isDark }) => {
    const [activeSection, setActiveSection] = useState(THEORY_DATA[0].id);
    const content = THEORY_DATA.find(d => d.id === activeSection);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
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

const VectorPreview = ({ i1, i2, ang, isDark }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const cvs = canvasRef.current;
        const container = containerRef.current;
        if (!cvs || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const w = container.clientWidth;
        const h = 150;

        cvs.width = w * dpr;
        cvs.height = h * dpr;
        cvs.style.width = `${w}px`;
        cvs.style.height = `${h}px`;

        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        const cx = w / 2;
        const cy = h / 2;
        const scale = Math.min(w, h) / 12;

        const gridColor = isDark ? '#334155' : '#e2e8f0';
        const i1Color = '#3b82f6';
        const i2Color = '#f59e0b';
        const diffColor = '#ef4444';

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

        const drawArrow = (fromX, fromY, toX, toY, color, isDashed = false) => {
            const headlen = 8;
            const angle = Math.atan2(toY - fromY, toX - fromX);
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.setLineDash(isDashed ? [5, 5] : []);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
            ctx.lineTo(toX, toY);
            ctx.fillStyle = color;
            ctx.fill();
        };

        drawArrow(cx, cy, cx + i1 * scale, cy, i1Color);
        const angRad = ang * (Math.PI / 180);
        const i2x = cx + i2 * scale * Math.cos(angRad);
        const i2y = cy - i2 * scale * Math.sin(angRad);
        drawArrow(cx, cy, i2x, i2y, i2Color);

        const diffX = i1 * scale + i2 * scale * Math.cos(angRad);
        const diffY = - (i2 * scale * Math.sin(angRad));
        drawArrow(cx, cy, cx + diffX, cy + diffY, diffColor, true);

        // Labels
        ctx.font = '10px monospace';
        ctx.fillStyle = i1Color; ctx.fillText('I1', cx + i1 * scale + 5, cy - 5);
        ctx.fillStyle = i2Color; ctx.fillText('I2', i2x + 5, i2y - 5);
        ctx.fillStyle = diffColor; ctx.fillText('Idiff', cx + diffX + 5, cy + diffY - 5);

    }, [i1, i2, ang, isDark]);

    return (
        <div ref={containerRef} className="w-full">
            <canvas ref={canvasRef} className={`rounded-lg border w-full ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`} />
        </div>
    );
};

const SimulatorModule = ({ isDark }) => {
    // Settings state
    const [pickup, setPickup] = useState(0.3);
    const [slope1, setSlope1] = useState(30);
    const [slope2, setSlope2] = useState(70);
    const [breakPoint, setBreakPoint] = useState(2.0);
    const [harmonicBlock, setHarmonicBlock] = useState(15);

    // Injection state
    const [i1Mag, setI1Mag] = useState(1.0);
    const [i2Mag, setI2Mag] = useState(1.0);
    const [angleDiff, setAngleDiff] = useState(180);
    const [injectedHarmonic, setInjectedHarmonic] = useState(0);

    // Smooth animation loop values
    const smoothed = useSmoothedValues({ pickup, slope1, slope2, breakPoint, harmonicBlock, i1Mag, i2Mag, angleDiff, injectedHarmonic }, 0.12);

    // Physics calculations
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

    // Fast Preset Scenarios
    const setInternalFault = () => { setI1Mag(3.5); setI2Mag(0.5); setAngleDiff(20); setInjectedHarmonic(2); };
    const setExternalFault = () => { setI1Mag(4.0); setI2Mag(4.0); setAngleDiff(180); setInjectedHarmonic(2); };
    const setSaturation = () => { setI1Mag(5.0); setI2Mag(3.0); setAngleDiff(160); setInjectedHarmonic(5); };
    const setInrush = () => { setI1Mag(3.0); setI2Mag(0.0); setAngleDiff(0); setInjectedHarmonic(35); };
    const setCTMismatch = () => { setI1Mag(2.0); setI2Mag(1.8); setAngleDiff(175); setInjectedHarmonic(0); };
    const setOverexcitation = () => { setI1Mag(1.5); setI2Mag(0.5); setAngleDiff(40); setInjectedHarmonic(10); };
    const resetValues = () => {
        setI1Mag(1.0); setI2Mag(1.0); setAngleDiff(180); setInjectedHarmonic(0);
        setPickup(0.3); setSlope1(30); setSlope2(70); setBreakPoint(2.0); setHarmonicBlock(15);
    };

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Share link processing
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
                console.error("Failed to parse state", e);
            }
        }
    }, []);

    const copyShareLink = () => {
        const state = { pickup, slope1, slope2, breakPoint, harmonicBlock, i1Mag, i2Mag, angleDiff, injectedHarmonic };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert("State URL copied! You can share this to load exact parameters.");
    };

    // Advanced Canvas Renderer (Retina Ready)
    useEffect(() => {
        const cvs = canvasRef.current;
        const container = containerRef.current;
        if (!cvs || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const w = container.clientWidth;
        const h = container.clientHeight;

        cvs.width = w * dpr;
        cvs.height = h * dpr;
        cvs.style.width = `${w}px`;
        cvs.style.height = `${h}px`;

        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        const scale = w > 500 ? 50 : 35;
        const ox = 50;
        const oy = h - 40;

        const bgColor = isDark ? '#0f172a' : '#ffffff';
        const gridColor = isDark ? '#334155' : '#cbd5e1';
        const axisColor = isDark ? '#94a3b8' : '#64748b';
        const curveColor = '#3b82f6';

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);

        // Trip Zone Red Background
        ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.05)';
        ctx.fillRect(0, 0, w, h);

        // Restraint Zone Green Background
        ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)';
        ctx.beginPath();
        ctx.moveTo(ox, oy);

        const maxX_pu = (w - ox) / scale;
        for (let xb = 0; xb <= maxX_pu; xb += 0.05) {
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

        // Grid Lines
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 20; i++) {
            const x = ox + i * scale;
            if (x > w) break;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            if (i % 2 === 0) {
                ctx.fillStyle = axisColor; ctx.font = '10px sans-serif'; ctx.fillText(i.toString(), x - 3, oy + 15);
            }
        }
        for (let i = 0; i < 20; i++) {
            const y = oy - i * scale;
            if (y < 0) break;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            if (i % 2 === 0) {
                ctx.fillStyle = axisColor; ctx.font = '10px sans-serif'; ctx.fillText(i.toString(), ox - 15, y + 3);
            }
        }

        // Axis Labels
        ctx.fillStyle = axisColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText("Ibias [pu]", w - 60, h - 10);
        ctx.save();
        ctx.translate(15, 60);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Idiff [pu]", 0, 0);
        ctx.restore();

        // Characteristic Line (The Curve)
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ox, oy - (smoothed.pickup * scale));
        for (let xb = 0; xb <= maxX_pu; xb += 0.05) {
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

        // Operating Point logic
        const ptX = ox + ibias * scale;
        const ptY = oy - idiff * scale;

        // Ghost Path tracking origin to dot
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ptX, ptY); ctx.stroke();
        ctx.setLineDash([]);

        // The Dot (Pulsing Effect)
        ctx.fillStyle = isTrip ? '#ef4444' : isHarmonicBlocked ? '#f59e0b' : '#10b981';
        ctx.beginPath();
        ctx.arc(ptX, ptY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#fff' : '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Curve Annotation Text
        ctx.fillStyle = curveColor;
        ctx.font = '12px sans-serif';
        const s1X = ox + (smoothed.breakPoint / 2) * scale;
        const s1Y = oy - (Math.max(smoothed.pickup, s1 * (smoothed.breakPoint / 2)) * scale) - 10;
        if (s1X < w) ctx.fillText(`K1: ${Math.round(smoothed.slope1)}%`, s1X, s1Y);

        const s2X = ox + (smoothed.breakPoint + 1) * scale;
        const s2Y = oy - ((Math.max(smoothed.pickup, s1 * smoothed.breakPoint) + s2) * scale) - 10;
        if (s2X < w && s2Y > 0) ctx.fillText(`K2: ${Math.round(smoothed.slope2)}%`, s2X, s2Y);

    }, [smoothed, ibias, idiff, isTrip, s1, s2, isHarmonicBlocked, isDark]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto p-4 md:p-6 pb-20">
            {/* RELAY SETTINGS PANEL */}
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
                            <button onClick={resetValues} title="Reset Settings" className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <Slider label="Pickup (Is1)" unit="pu" min={0.1} max={1.0} step={0.05} value={pickup} onChange={(e) => setPickup(Number(e.target.value))} color="blue" />
                        <Slider label="Slope 1 (K1)" unit="%" min={10} max={60} step={5} value={slope1} onChange={(e) => setSlope1(Number(e.target.value))} color="blue" />
                        <Slider label="Slope 2 (K2)" unit="%" min={50} max={150} step={5} value={slope2} onChange={(e) => setSlope2(Number(e.target.value))} color="blue" />
                        <Slider label="Break Point (Is2)" unit="pu" min={1.0} max={5.0} step={0.5} value={breakPoint} onChange={(e) => setBreakPoint(Number(e.target.value))} color="blue" />
                        
                        <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <Slider label="2nd Harmonic Block" unit="%" min={5} max={30} step={1} value={harmonicBlock} onChange={(e) => setHarmonicBlock(Number(e.target.value))} color="amber" />
                        </div>
                    </div>
                </div>

                {/* QUICK SCENARIOS */}
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Zap className="w-4 h-4" /> Lab Scenarios
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
                            <TrendingUp className="w-4 h-4" /> Magnetizing Inrush
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN GRAPH CANVAS */}
            <div ref={containerRef} className={`lg:col-span-6 rounded-2xl border p-1 flex flex-col shadow-inner relative overflow-hidden h-[450px] lg:h-[650px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <canvas ref={canvasRef} className={`w-full h-full rounded-xl ${isDark ? 'bg-slate-950' : 'bg-white'}`} />

                <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                    <div className={`backdrop-blur-md px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-700 text-emerald-400' : 'bg-white/80 border-slate-200 text-emerald-600'}`}>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Restraint Zone
                    </div>
                    <div className={`backdrop-blur-md px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-700 text-red-400' : 'bg-white/80 border-slate-200 text-red-600'}`}>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Trip Zone
                    </div>
                </div>
            </div>

            {/* STATUS & INJECTION PANEL */}
            <div className="lg:col-span-3 space-y-6">

                {/* Dynamic Relay Decision Card */}
                <div className={`p-6 rounded-2xl border-l-4 flex flex-col items-center justify-center text-center transition-all duration-500 shadow-lg ${isTrip
                    ? isDark ? 'bg-red-900/10 border-red-500 text-red-400' : 'bg-red-50 border-red-500 text-red-700'
                    : isHarmonicBlocked
                        ? isDark ? 'bg-amber-900/10 border-amber-500 text-amber-400' : 'bg-amber-50 border-amber-500 text-amber-700'
                        : isDark ? 'bg-emerald-900/10 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    }`}>
                    <div>
                        <div className="text-[10px] font-bold uppercase opacity-60 mb-2 tracking-widest">Relay Target Output</div>
                        <div className="text-3xl font-black mb-2 tracking-tight">{isTrip ? 'TRIP' : isHarmonicBlocked ? 'BLOCKED' : 'STABLE'}</div>
                        {isHarmonicBlocked && <div className="text-[10px] font-bold bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">2nd Harmonic &gt; {harmonicBlock}%</div>}
                    </div>
                    <div className="mt-4 p-3 bg-white/10 rounded-full">
                        {isTrip ? <AlertTriangle className="w-8 h-8 animate-bounce" /> : isHarmonicBlocked ? <Activity className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                    </div>
                    <div className={`mt-3 text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Margin: {isAboveCurve ? '-' : '+'}{Math.abs(((currentTripThreshold - idiff) / currentTripThreshold) * 100).toFixed(1)}% to characteristic
                    </div>
                </div>

                {/* Test Injection Inputs */}
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Terminal className="w-4 h-4" /> Current Injection
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={`text-[10px] font-bold opacity-60 uppercase ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>I1 Mag (pu)</label>
                                <input type="number" min="0" max="100" step="0.1" value={i1Mag} onChange={(e) => setI1Mag(Math.min(100, Math.max(0, Number(e.target.value))))} className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm font-mono font-bold outline-none transition-colors ${isDark ? 'bg-slate-950 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-black'}`} />
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold opacity-60 uppercase ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>I2 Mag (pu)</label>
                                <input type="number" min="0" max="100" step="0.1" value={i2Mag} onChange={(e) => setI2Mag(Math.min(100, Math.max(0, Number(e.target.value))))} className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm font-mono font-bold outline-none transition-colors ${isDark ? 'bg-slate-950 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-black'}`} />
                            </div>
                        </div>
                        <Slider label="Phase Angle" unit="°" min={0} max={360} step={1} value={angleDiff} onChange={(e) => setAngleDiff(Number(e.target.value))} color="purple" />
                        <Slider label="Injected Harmonic" unit="%" min={0} max={50} step={1} value={injectedHarmonic} onChange={(e) => setInjectedHarmonic(Number(e.target.value))} color="amber" />
                    </div>

                    <div className={`mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-xs ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className={`p-2 rounded border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="opacity-50 text-[9px] uppercase font-bold">Idiff Output</div>
                            <div className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{idiff.toFixed(2)}</div>
                        </div>
                        <div className={`p-2 rounded border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="opacity-50 text-[9px] uppercase font-bold">Ibias Output</div>
                            <div className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{ibias.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Responsive Vector Preview */}
                <div className="hidden lg:block">
                    <h4 className={`text-[10px] font-bold uppercase mb-2 opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time Phasor View</h4>
                    <VectorPreview i1={i1Mag} i2={i2Mag} ang={angleDiff} isDark={isDark} />
                </div>
            </div>
        </div>
    );
};

const UserGuideModule = ({ isDark }) => (
    <div className={`max-w-3xl mx-auto p-8 animate-fade-in ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <MousePointer2 className="w-6 h-6 text-blue-500" /> Operating Instructions
        </h2>

        <div className="space-y-8">
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                {[
                    { title: "Define Characteristic", desc: "Use the Relay Settings panel to sculpt your protection zone. Keep Slope 1 tight (30%) for sensitivity and Slope 2 loose (70%) for heavy faults." },
                    { title: "Inject Values", desc: "Use the Current Injection panel to emulate field measurements. Modulate magnitudes and phase angle to shift the operational dot." },
                    { title: "Analyze Response", desc: "Monitor the Canvas. If the dot breaches the blue line into the Red Zone, a Trip is asserted (unless Harmonic Blocking intervenes)." }
                ].map((step, idx) => (
                    <div className="flex gap-4 mb-5 last:mb-0" key={idx}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>{idx + 1}</div>
                        <div>
                            <h3 className="font-bold text-lg">{step.title}</h3>
                            <p className="text-sm opacity-80 mt-1">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h4 className="font-bold mb-2 flex items-center gap-2 text-emerald-500"><CheckCircle2 className="w-4 h-4" /> Lab Objective</h4>
                    <p className="text-sm opacity-80">
                        Find the <strong>Stability Limit</strong>. Set an external fault (180&deg;) and increase currents until CT mismatch forces the operational dot towards the trip zone. Observe how Slope 2 corrects this.
                    </p>
                </div>
                <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h4 className="font-bold mb-2 flex items-center gap-2 text-amber-500"><AlertOctagon className="w-4 h-4" /> Safety Notice</h4>
                    <p className="text-sm opacity-80">
                        In live substations, open-circuiting a Current Transformer secondary generates lethal peak voltages. Always apply shorting links before interaction.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

// --- 5. MAIN ENTRY COMPONENT ---

export default function DifferentialProtectionApp() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();

    useEffect(() => {
        document.title = "GridGuard Pro | Diff Slope";
    }, []);

    return (
        <div className={`min-h-[100dvh] flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <PageSEO 
                title="Transformer Differential (87T) Dual-Slope Simulator | RelaySchool"
                description="Master differential protection slopes. Visualize restrained vs. unrestrained regions, CT saturation effects, and inrush logic."
                url="/diffslope"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "RelaySchool SlopeMaster",
                    "applicationCategory": "EducationalApplication",
                    "description": "Interactive dual-slope differential relay characteristic simulator."
                }}
            />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-pink-600 to-rose-600 p-2 rounded-lg text-white shadow-lg shadow-pink-500/20">
                        <GitMerge className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>GridGuard <span className="text-pink-500">PRO</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Differential Analysis</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full opacity-50"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500/80">IEC 60255 Standard</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Tabs */}
                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {[
                        { id: 'theory', label: 'Theory & Specs', icon: <Book className="w-4 h-4" /> },
                        { id: 'simulator', label: 'Laboratory', icon: <MonitorPlay className="w-4 h-4" /> },
                        { id: 'guide', label: 'Operator Guide', icon: <GraduationCap className="w-4 h-4" /> },
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
                    { id: 'simulator', label: 'Simulate', icon: <MonitorPlay className="w-5 h-5" /> },
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

            {/* Application Area */}
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <TheoryModule isDark={isDark} />}
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