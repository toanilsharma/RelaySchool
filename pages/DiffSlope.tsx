
import React, { useState, useEffect, useRef } from 'react';
import { GitMerge, HelpCircle, X, Sliders, Zap, CheckCircle, AlertTriangle, Activity, BookOpen, ShieldCheck, TrendingUp, Info } from 'lucide-react';

// --- COMPONENTS ---

const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 m-4 p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <GitMerge className="w-6 h-6 text-pink-500"/> Differential Protection Guide
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-500"/></button>
                </div>
                <div className="overflow-y-auto pr-2 space-y-6">
                    <section>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">1. The Concept (87)</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Differential protection is a "Unit Protection" scheme. It relies on Kirchhoff's Current Law: 
                            <em> The sum of currents entering and leaving a healthy zone must be zero.</em>
                        </p>
                        <ul className="list-disc pl-5 mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <li><strong>Internal Fault:</strong> Current flows IN from both sides (or IN from one, nothing from other). Sum is high.</li>
                            <li><strong>External Fault:</strong> Current flows IN one side and OUT the other. Sum is zero (ideally).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">2. The Slopes</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                            Real CTs are not perfect. During heavy through-faults, one CT might saturate, creating a false "Differential" current. 
                            To prevent false trips, we increase the trip threshold as the through-current increases. This is the <strong>Percentage Restraint</strong> or "Slope".
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="text-xs font-bold text-blue-600 uppercase">Slope 1</span>
                                <p className="text-xs text-slate-500 mt-1">Handles steady-state errors (CT mismatch, tap changer limits).</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="text-xs font-bold text-amber-600 uppercase">Slope 2</span>
                                <p className="text-xs text-slate-500 mt-1">Handles AC saturation during massive external faults. Steep slope = High stability.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">3. How to Use Simulator</h3>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex gap-2"><div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0">1</div> Adjust Relay Settings (Pickup, Slopes) to define the protected zone.</li>
                            <li className="flex gap-2"><div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0">2</div> Use the "Simulations" buttons to instantly set Internal/External fault scenarios.</li>
                            <li className="flex gap-2"><div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0">3</div> Manually drag sliders to see how Phase Angle shifts move the operating point.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
};

const VectorPreview = ({ i1, i2, ang }: { i1: number, i2: number, ang: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        
        const w = cvs.width;
        const h = cvs.height;
        const cx = w/2;
        const cy = h/2;
        const scale = 25; // Compact vector scale

        ctx.clearRect(0,0,w,h);
        
        // Grid
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

        // I1 (Reference at 0 deg)
        // Draw I1 (Blue)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + i1 * scale, cy);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Arrowhead
        ctx.beginPath(); ctx.arc(cx + i1*scale, cy, 2, 0, 2*Math.PI); ctx.fill();

        // I2 (Rotated by ang)
        const angRad = ang * (Math.PI/180);
        // I2 is typically "flowing in" for logic, but represented vectorially.
        const i2x = cx + i2 * scale * Math.cos(angRad);
        const i2y = cy - i2 * scale * Math.sin(angRad); // Negative sin for canvas Y-up logic

        // Draw I2 (Amber)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(i2x, i2y);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath(); ctx.arc(i2x, i2y, 2, 0, 2*Math.PI); ctx.fill();

        // Idiff (Vector Sum I1 + I2)
        // Vector addition geometry: (I1 + I2)
        const diffX = i1 * scale + i2 * scale * Math.cos(angRad);
        const diffY = - (i2 * scale * Math.sin(angRad));

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + diffX, cy + diffY);
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

    }, [i1, i2, ang]);

    return <canvas ref={canvasRef} width={200} height={150} className="bg-slate-950 rounded-lg border border-slate-800 w-full" />;
};

const DiffSlope = () => {
    // --- STATE ---
    // Settings
    const [pickup, setPickup] = useState(0.2); // pu
    const [slope1, setSlope1] = useState(30); // %
    const [slope2, setSlope2] = useState(80); // %
    const [breakPoint, setBreakPoint] = useState(2.0); // pu
    const [harmonicBlock, setHarmonicBlock] = useState(15); // % threshold

    // Injection
    const [i1Mag, setI1Mag] = useState(1.0);
    const [i2Mag, setI2Mag] = useState(1.0);
    const [angleDiff, setAngleDiff] = useState(180);
    const [injectedHarmonic, setInjectedHarmonic] = useState(0); // % 2nd harmonic

    const [showHelp, setShowHelp] = useState(false);

    // --- MATH ---
    const angRad = angleDiff * (Math.PI / 180);
    const diffReal = i1Mag + (i2Mag * Math.cos(angRad));
    const diffImag = i2Mag * Math.sin(angRad);
    const idiff = Math.sqrt(diffReal*diffReal + diffImag*diffImag);
    const ibias = (i1Mag + i2Mag) / 2; // Average bias

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

    // --- PRESETS ---
    const setInternalFault = () => { setI1Mag(2.0); setI2Mag(0.0); setAngleDiff(0); setInjectedHarmonic(2); };
    const setExternalFault = () => { setI1Mag(4.0); setI2Mag(3.8); setAngleDiff(180); setInjectedHarmonic(2); };
    const setSaturation = () => { setI1Mag(4.0); setI2Mag(2.5); setAngleDiff(160); setInjectedHarmonic(5); };
    const setInrush = () => { setI1Mag(3.0); setI2Mag(0.0); setAngleDiff(0); setInjectedHarmonic(30); };

    // --- RENDER GRAPH ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const cvs = canvasRef.current;
        if(!cvs) return;
        const ctx = cvs.getContext('2d');
        if(!ctx) return;

        const w = cvs.width;
        const h = cvs.height;
        const scale = 50; // px per unit
        const ox = 50;
        const oy = h - 40; // Adjusted origin

        ctx.clearRect(0, 0, w, h);

        // 1. Draw Safe/Trip Regions (Fill)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)'; // Red Tint
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; // Green Tint
        ctx.beginPath();
        ctx.moveTo(ox, oy); // Origin
        
        const maxX_pu = (w - ox) / scale;
        // Trace the characteristic curve
        for(let xb = 0; xb <= maxX_pu; xb += 0.1) {
            let y_val = 0;
            if (xb < breakPoint) {
                y_val = Math.max(pickup, s1 * xb);
            } else {
                const yAtBreak = Math.max(pickup, s1 * breakPoint);
                y_val = yAtBreak + s2 * (xb - breakPoint);
            }
            ctx.lineTo(ox + xb * scale, oy - y_val * scale);
        }
        ctx.lineTo(w, oy); // Down to X axis at max
        ctx.lineTo(ox, oy); // Back to origin
        ctx.fill();

        // 2. Grid & Axes
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;
        // Vertical grid
        for(let i=0; i<12; i++) {
            const x = ox + i * scale;
            if (x > w) break;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            // Label X
            if(i % 2 === 0) {
                ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.fillText(i.toString(), x - 3, oy + 15);
            }
        }
        // Horizontal grid
        for(let i=0; i<10; i++) {
            const y = oy - i * scale;
            if (y < 0) break;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            // Label Y
            if(i % 2 === 0) {
                ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.fillText(i.toString(), ox - 15, y + 3);
            }
        }

        // Axis Titles
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText("Ibias [pu]", w - 60, h - 10);
        ctx.save();
        ctx.translate(15, 60);
        ctx.rotate(-Math.PI/2);
        ctx.fillText("Idiff [pu]", 0, 0);
        ctx.restore();

        // 3. Characteristic Line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ox, oy - (pickup * scale));
        for(let xb = 0; xb <= maxX_pu; xb += 0.1) {
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

        // 4. Operating Point
        const ptX = ox + ibias * scale;
        const ptY = oy - idiff * scale;

        // Draw 'ghost' line to origin
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ptX, ptY); ctx.stroke();
        ctx.setLineDash([]);

        // The Dot
        ctx.fillStyle = isTrip ? '#ef4444' : isHarmonicBlocked ? '#f59e0b' : '#10b981';
        ctx.beginPath();
        ctx.arc(ptX, ptY, 8, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 5. Annotations
        // Show Slope 1 text
        ctx.fillStyle = '#3b82f6';
        ctx.font = '12px sans-serif';
        // Rough position for Slope 1
        const s1X = ox + (breakPoint/2)*scale;
        const s1Y = oy - (Math.max(pickup, s1*(breakPoint/2))*scale) - 10;
        ctx.fillText(`K1: ${slope1}%`, s1X, s1Y);

        // Show Slope 2 text
        const s2X = ox + (breakPoint + 1)*scale;
        const s2Y = oy - ((Math.max(pickup, s1*breakPoint) + s2)*scale) - 10;
        ctx.fillText(`K2: ${slope2}%`, s2X, s2Y);

    }, [pickup, slope1, slope2, breakPoint, ibias, idiff, isTrip, s1, s2, isHarmonicBlocked]);

    return (
        <div className="space-y-4 animate-fade-in max-w-7xl mx-auto pb-4">
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <GitMerge className="w-6 h-6 text-pink-600" /> Differential Slope Lab
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Unit Protection Stability Analysis & Dual Slope Logic.</p>
                </div>
                <div className="flex gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <span>Idiff = |I1 + I2|</span>
                    </div>
                    <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">
                        <HelpCircle className="w-4 h-4" /> Guide
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* SETTINGS PANEL (Left) */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <Sliders className="w-4 h-4 text-blue-500" /> Relay Settings (87)
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                    <span>Pickup (Is1)</span>
                                    <span className="text-slate-900 dark:text-white">{pickup} pu</span>
                                </div>
                                <input type="range" min="0.1" max="1.0" step="0.05" value={pickup} onChange={(e) => setPickup(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                    <span>Slope 1 (K1)</span>
                                    <span className="text-slate-900 dark:text-white">{slope1} %</span>
                                </div>
                                <input type="range" min="10" max="60" step="5" value={slope1} onChange={(e) => setSlope1(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                    <span>Break Point (Is2)</span>
                                    <span className="text-slate-900 dark:text-white">{breakPoint} pu</span>
                                </div>
                                <input type="range" min="1.0" max="5.0" step="0.5" value={breakPoint} onChange={(e) => setBreakPoint(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                    <span>Slope 2 (K2)</span>
                                    <span className="text-slate-900 dark:text-white">{slope2} %</span>
                                </div>
                                <input type="range" min="50" max="150" step="5" value={slope2} onChange={(e) => setSlope2(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                    <span>2nd Harmonic Block</span>
                                    <span className="text-amber-500">{harmonicBlock} %</span>
                                </div>
                                <input type="range" min="5" max="30" step="1" value={harmonicBlock} onChange={(e) => setHarmonicBlock(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                            </div>
                        </div>
                    </div>

                    {/* Scenarios */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <Zap className="w-4 h-4 text-amber-500" /> Quick Tests
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={setInternalFault} className="py-2 px-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-200 dark:border-red-900/50">
                                Internal Fault
                            </button>
                            <button onClick={setExternalFault} className="py-2 px-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors border border-green-200 dark:border-green-900/50">
                                Through Fault
                            </button>
                            <button onClick={setSaturation} className="py-2 px-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg text-[10px] font-bold hover:bg-orange-100 transition-colors border border-orange-200 dark:border-orange-900/50">
                                CT Saturation
                            </button>
                            <button onClick={setInrush} className="py-2 px-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold hover:bg-purple-100 transition-colors border border-purple-200 dark:border-purple-900/50">
                                Inrush
                            </button>
                        </div>
                    </div>
                </div>

                {/* GRAPH PANEL (Center) */}
                <div className="lg:col-span-6 bg-slate-900 rounded-xl border border-slate-800 p-1 flex flex-col shadow-inner relative overflow-hidden h-[400px]">
                    <canvas ref={canvasRef} width={600} height={400} className="w-full h-full rounded-lg bg-slate-950" />
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <div className="bg-slate-900/80 backdrop-blur px-2 py-1 rounded border border-slate-700 text-[10px] font-mono text-emerald-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Restraint
                        </div>
                        <div className="bg-slate-900/80 backdrop-blur px-2 py-1 rounded border border-slate-700 text-[10px] font-mono text-red-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Trip
                        </div>
                    </div>
                </div>

                {/* CONTROLS & STATUS PANEL (Right) */}
                <div className="lg:col-span-3 space-y-4">
                    
                    {/* Status Card */}
                    <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                        isTrip 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : isHarmonicBlocked
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-200'
                    }`}>
                        <div>
                            <div className="text-[10px] font-bold uppercase opacity-70 mb-1 tracking-widest">Relay Decision</div>
                            <div className="text-2xl font-black mb-1">{isTrip ? 'TRIP' : isHarmonicBlocked ? 'BLOCKED' : 'STABLE'}</div>
                            {isHarmonicBlocked && <div className="text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded">2nd Harmonic &gt; {harmonicBlock}%</div>}
                        </div>
                        <div className="mt-2 flex gap-4">
                            {isTrip ? <AlertTriangle className="w-6 h-6 animate-bounce" /> : isHarmonicBlocked ? <Activity className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                        </div>
                    </div>

                    {/* Math Inspector */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <Activity className="w-4 h-4 text-purple-500" /> Current Injection
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">I1 Mag</label>
                                    <input type="number" step="0.1" value={i1Mag} onChange={(e) => setI1Mag(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs font-mono" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">I2 Mag</label>
                                    <input type="number" step="0.1" value={i2Mag} onChange={(e) => setI2Mag(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Phase Angle (Deg)</label>
                                <input type="range" min="0" max="360" value={angleDiff} onChange={(e) => setAngleDiff(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600 mb-1" />
                                <div className="text-right text-[10px] font-mono">{angleDiff}°</div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Injected Harmonic</label>
                                <input type="range" min="0" max="50" value={injectedHarmonic} onChange={(e) => setInjectedHarmonic(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-1" />
                                <div className="text-right text-[10px] font-mono">{injectedHarmonic}% (2nd)</div>
                            </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                                <div className="text-slate-500 text-[10px]">Idiff</div>
                                <div className="font-mono font-bold text-slate-900 dark:text-white">{idiff.toFixed(2)} pu</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                                <div className="text-slate-500 text-[10px]">Ibias</div>
                                <div className="font-mono font-bold text-slate-900 dark:text-white">{ibias.toFixed(2)} pu</div>
                            </div>
                        </div>
                    </div>

                    {/* Vector View */}
                    <div className="hidden lg:block">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Vector Summation</h4>
                        <VectorPreview i1={i1Mag} i2={i2Mag} ang={angleDiff} />
                    </div>
                </div>

            </div>

            {/* --- EDUCATIONAL CONTENT --- */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" /> The Bias Principle
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Why not just trip if Idiff &gt; 0? Because CTs have errors. As load increases, the error increases proportionally. 
                        By making the trip threshold a <strong>percentage</strong> of the bias current (Ibias), we ensure stability for external faults while maintaining sensitivity for internal ones.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-500" /> Harmonic Restraint
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        When energizing a transformer, "Inrush Current" flows into one side only, creating a huge Idiff. 
                        However, this current is rich in <strong>2nd Harmonics</strong> (100Hz/120Hz). Relays measure this ratio; if &gt;15%, they block the trip to prevent nuisance outages.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-purple-500" /> Protection Physics
                    </h3>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <li><strong>Equation:</strong> I<sub>diff</sub> &gt; K × I<sub>bias</sub> + I<sub>pickup</sub></li>
                        <li><strong>Standard:</strong> IEC 60255-187-1 defines characteristic testing.</li>
                        <li><strong>Note:</strong> Phase shift (e.g., Delta-Star 30°) must be compensated either by CT wiring or numerically in the relay.</li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default DiffSlope;
