import React, { useState, useEffect, useRef } from 'react';
import {
    GitMerge, Sliders, Zap, CheckCircle2, AlertTriangle,
    Activity, BookOpen, ShieldCheck, TrendingUp, Info,
    Sun, Moon, RotateCcw, MonitorPlay, Terminal,
    AlertOctagon, MousePointer2, Book, GraduationCap,
    ArrowRight, FileText, Menu, RefreshCw
} from 'lucide-react';

// --- 1. ENGINEERING CONSTANTS ---
const IEEE_C37_91 = "IEEE Guide for Protective Relay Applications to Power Transformers";
const IEC_60255 = "IEC Standard for Measuring Relays and Protection Equipment";

// --- 2. THEORY & MANUAL DATA ---
const THEORY_DATA = [
    {
        id: 'fundamentals',
        title: "1. Fundamentals of Unit Protection",
        icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
        content: (
            <div className="space-y-4 text-sm leading-relaxed">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">The Core Principle (Kirchhoff's Law)</h3>
                    <p className="mt-2 text-slate-700 dark:text-slate-300">
                        Differential protection (ANSI 87) is the primary protection for critical assets like Transformers, Generators, and Busbars. It operates on the simple premise:
                        <br /><br />
                        <code className="bg-white dark:bg-black/30 px-2 py-1 rounded font-mono font-bold">Current IN = Current OUT</code>
                    </p>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                    If the sum of currents entering and leaving the protected zone is <strong>zero</strong>, the equipment is healthy (or the fault is external). If the sum is <strong>non-zero</strong>, the fault is internal, and the relay must trip instantaneously.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-3 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-white block mb-1">Selectivity</strong>
                        <span className="text-xs text-slate-500">Absolute. Does not coordinate with other relays. Only looks at its zone.</span>
                    </div>
                    <div className="p-3 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-white block mb-1">Speed</strong>
                        <span className="text-xs text-slate-500">Instantaneous (&lt;30ms). No intentional time delay required.</span>
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
            <div className="space-y-4 text-sm leading-relaxed">
                <p className="text-slate-600 dark:text-slate-400">
                    In the real world, CTs are not perfect. As fault current increases, CTs may saturate or have ratio errors. A simple "Idiff &gt; 0" setting would cause nuisance trips during heavy external faults.
                </p>
                <h4 className="font-bold text-slate-900 dark:text-white mt-4">The Percentage Restraint Solution</h4>
                <p className="text-slate-600 dark:text-slate-400">
                    We increase the trip threshold dynamically based on the "Through Current" (Bias).
                </p>
                <ul className="space-y-3 mt-2">
                    <li className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="font-bold text-blue-600 dark:text-blue-400 shrink-0">Slope 1</div>
                        <div>
                            <span className="block font-bold text-slate-900 dark:text-white text-xs">Linear Errors</span>
                            <span className="text-xs text-slate-500">Compensates for tap changer (OLTC) drift and small CT mismatches. Typically set at 20-30%.</span>
                        </div>
                    </li>
                    <li className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="font-bold text-amber-600 dark:text-amber-400 shrink-0">Slope 2</div>
                        <div>
                            <span className="block font-bold text-slate-900 dark:text-white text-xs">Saturation Region</span>
                            <span className="text-xs text-slate-500">During massive through-faults, CTs saturate. A steep Slope 2 (60-80%) prevents false tripping while the grid protection clears the external fault.</span>
                        </div>
                    </li>
                </ul>
            </div>
        )
    },
    {
        id: 'harmonics',
        title: "3. Inrush & Harmonic Blocking",
        icon: <Activity className="w-5 h-5 text-purple-500" />,
        content: (
            <div className="space-y-4 text-sm leading-relaxed">
                <h4 className="font-bold text-slate-900 dark:text-white">The Magnetizing Inrush Problem</h4>
                <p className="text-slate-600 dark:text-slate-400">
                    When a transformer is energized, it draws a massive current (Inrush) to magnetize the core. This current flows IN on the source side but is ZERO on the load side. To a differential relay, this looks exactly like an internal fault (High Idiff).
                </p>
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/10">
                    <h5 className="font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> The Solution: 2nd Harmonic
                    </h5>
                    <p className="mt-2 text-xs text-purple-800 dark:text-purple-200">
                        Inrush current is physically non-sinusoidal and rich in <strong>2nd Harmonic (100Hz/120Hz)</strong> components. Internal faults are pure 50/60Hz.
                        <br /><br />
                        Modern relays measure the ratio <code>I_2nd / I_fund</code>. If this ratio exceeds <strong>15-20%</strong>, the trip is blocked securely.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'standards',
        title: "4. IEEE/IEC Standards",
        icon: <BookOpen className="w-5 h-5 text-amber-500" />,
        content: (
            <div className="space-y-4 text-sm leading-relaxed">
                <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <strong className="text-slate-900 dark:text-white">IEEE C37.91</strong>
                            <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">USA</span>
                        </div>
                        <p className="text-xs text-slate-500">Guide for Protective Relay Applications to Power Transformers. Defines slope testing points and inrush criteria.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <strong className="text-slate-900 dark:text-white">IEC 60255-187-1</strong>
                            <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Global</span>
                        </div>
                        <p className="text-xs text-slate-500">Functional requirements for differential protection. Specifies "Operating Characteristic" verification methods.</p>
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

    // Math
    const angRad = angleDiff * (Math.PI / 180);
    const diffReal = i1Mag + (i2Mag * Math.cos(angRad));
    const diffImag = i2Mag * Math.sin(angRad);
    const idiff = Math.sqrt(diffReal * diffReal + diffImag * diffImag);
    const ibias = (i1Mag + i2Mag) / 2;

    const s1 = slope1 / 100;
    const s2 = slope2 / 100;

    let currentTripThreshold = 0;
    if (ibias < breakPoint) {
        currentTripThreshold = Math.max(pickup, s1 * ibias);
    } else {
        const yAtBreak = Math.max(pickup, s1 * breakPoint);
        currentTripThreshold = yAtBreak + s2 * (ibias - breakPoint);
    }

    const isAboveCurve = idiff > currentTripThreshold;
    const isHarmonicBlocked = injectedHarmonic > harmonicBlock;
    const isTrip = isAboveCurve && !isHarmonicBlocked;

    // Presets
    const setInternalFault = () => { setI1Mag(3.5); setI2Mag(0.5); setAngleDiff(20); setInjectedHarmonic(2); };
    const setExternalFault = () => { setI1Mag(4.0); setI2Mag(4.0); setAngleDiff(180); setInjectedHarmonic(2); };
    const setSaturation = () => { setI1Mag(5.0); setI2Mag(3.0); setAngleDiff(160); setInjectedHarmonic(5); };
    const setInrush = () => { setI1Mag(3.0); setI2Mag(0.0); setAngleDiff(0); setInjectedHarmonic(35); };

    // Reset function
    const resetValues = () => {
        setI1Mag(1.0); setI2Mag(1.0); setAngleDiff(180); setInjectedHarmonic(0);
        setPickup(0.3); setSlope1(30); setSlope2(70); setBreakPoint(2.0); setHarmonicBlock(15);
    };

    // Canvas Logic
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
            if (xb < breakPoint) {
                y_val = Math.max(pickup, s1 * xb);
            } else {
                const yAtBreak = Math.max(pickup, s1 * breakPoint);
                y_val = yAtBreak + s2 * (xb - breakPoint);
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
        ctx.moveTo(ox, oy - (pickup * scale));
        for (let xb = 0; xb <= maxX_pu; xb += 0.1) {
            let y_val = 0;
            if (xb < breakPoint) {
                y_val = Math.max(pickup, s1 * xb);
            } else {
                const yAtBreak = Math.max(pickup, s1 * breakPoint);
                y_val = yAtBreak + s2 * (xb - breakPoint);
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
        const s1X = ox + (breakPoint / 2) * scale;
        const s1Y = oy - (Math.max(pickup, s1 * (breakPoint / 2)) * scale) - 10;
        // Only draw text if it fits
        if (s1X < w) ctx.fillText(`K1: ${slope1}%`, s1X, s1Y);

        const s2X = ox + (breakPoint + 1) * scale;
        const s2Y = oy - ((Math.max(pickup, s1 * breakPoint) + s2) * scale) - 10;
        if (s2X < w && s2Y > 0) ctx.fillText(`K2: ${slope2}%`, s2X, s2Y);

    }, [pickup, slope1, slope2, breakPoint, ibias, idiff, isTrip, s1, s2, isHarmonicBlocked, isDark]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto p-4 md:p-6 pb-20">
            {/* SETTINGS PANEL */}
            <div className="lg:col-span-3 space-y-6">
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`font-bold flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Sliders className="w-4 h-4" /> Relay Settings (87)
                        </h3>
                        <button onClick={resetValues} title="Reset to Defaults" className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Setting Item */}
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5 opacity-80">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Pickup (Is1)</span>
                                <span className={`font-mono ${isDark ? 'text-white' : 'text-black'}`}>{pickup} pu</span>
                            </div>
                            <input type="range" min="0.1" max="1.0" step="0.05" value={pickup} onChange={(e) => setPickup(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5 opacity-80">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Slope 1 (K1)</span>
                                <span className={`font-mono ${isDark ? 'text-white' : 'text-black'}`}>{slope1} %</span>
                            </div>
                            <input type="range" min="10" max="60" step="5" value={slope1} onChange={(e) => setSlope1(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5 opacity-80">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Slope 2 (K2)</span>
                                <span className={`font-mono ${isDark ? 'text-white' : 'text-black'}`}>{slope2} %</span>
                            </div>
                            <input type="range" min="50" max="150" step="5" value={slope2} onChange={(e) => setSlope2(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5 opacity-80">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Break Point (Is2)</span>
                                <span className={`font-mono ${isDark ? 'text-white' : 'text-black'}`}>{breakPoint} pu</span>
                            </div>
                            <input type="range" min="1.0" max="5.0" step="0.5" value={breakPoint} onChange={(e) => setBreakPoint(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>

                        <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <div className="flex justify-between text-xs font-bold mb-1.5 opacity-80">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>2nd Harmonic Block</span>
                                <span className="font-mono text-amber-500">{harmonicBlock} %</span>
                            </div>
                            <input type="range" min="5" max="30" step="1" value={harmonicBlock} onChange={(e) => setHarmonicBlock(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
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
                                <input type="number" step="0.1" value={i1Mag} onChange={(e) => setI1Mag(Number(e.target.value))} className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm font-mono font-bold ${isDark ? 'bg-slate-950 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-black'}`} />
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold opacity-60 uppercase ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>I2 Mag (pu)</label>
                                <input type="number" step="0.1" value={i2Mag} onChange={(e) => setI2Mag(Number(e.target.value))} className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm font-mono font-bold ${isDark ? 'bg-slate-950 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-black'}`} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5 opacity-80">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Phase Angle</span>
                                <span className={`font-mono ${isDark ? 'text-white' : 'text-black'}`}>{angleDiff}°</span>
                            </div>
                            <input type="range" min="0" max="360" value={angleDiff} onChange={(e) => setAngleDiff(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5 opacity-80">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Injected Harmonic</span>
                                <span className="font-mono text-amber-500">{injectedHarmonic}%</span>
                            </div>
                            <input type="range" min="0" max="50" value={injectedHarmonic} onChange={(e) => setInjectedHarmonic(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                        </div>
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
    const [isDark, setIsDark] = useState(true);

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>

            {/* Header */}
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-pink-600 to-rose-600 p-2 rounded-lg text-white shadow-lg shadow-pink-500/20">
                        <GitMerge className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>GridGuard <span className="text-pink-500">PRO</span></h1>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Differential Analysis Suite</span>
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