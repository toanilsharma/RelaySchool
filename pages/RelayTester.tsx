
import React, { useState, useEffect, useRef } from 'react';
import {
    Play, Square, RotateCcw, ClipboardCheck, AlertCircle,
    CheckCircle2, XCircle, Activity, Zap, Timer, HelpCircle,
    Book, X, AlertTriangle, Settings, Sliders,
    Database, TrendingUp, Sun, Moon, MonitorPlay, GraduationCap,
    MousePointer2, ShieldCheck, Info, Ruler, LineChart, Cpu, Scale,
    Share2
} from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import TheoryLibrary from '../components/TheoryLibrary';
import Slider from '../components/Slider';
import { RELAY_TESTER_THEORY_CONTENT } from '../data/learning-modules/relay-tester';
import PageSEO from "../components/SEO/PageSEO";

// --- 1. MATH ENGINE (IEC 60255) ---
const calculateTripTime = (current: number, pickup: number, tms: number, curveType: string) => {
    const M = current / pickup; // Multiple of pickup

    // If current is below pickup, it never trips (infinite time)
    if (M <= 1.0) return null;

    // IEC Standard Inverse Formula
    // t = TMS * (k / (M^alpha - 1))

    let k = 0.14;
    let alpha = 0.02;

    if (curveType === 'VERY') { k = 13.5; alpha = 1.0; }
    if (curveType === 'EXTREME') { k = 80.0; alpha = 2.0; }
    // Long Inverse
    if (curveType === 'LONG') { k = 120; alpha = 1.0; }

    const time = tms * (k / (Math.pow(M, alpha) - 1));
    return time; // in seconds
};

// --- 3. TCC CURVE COMPONENT ---
const TCCGraph = ({ pickup, tms, curve, liveCurrent, tripTime, isDark }: { pickup: number, tms: number, curve: string, liveCurrent: number, tripTime: number | null, isDark: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cvs = canvasRef.current;
        const container = containerRef.current;
        if (!cvs || !container) return;

        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        // Auto-resize
        const w = container.clientWidth;
        const h = 300; // Fixed height
        cvs.width = w;
        cvs.height = h;

        // --- PLOT SETTINGS ---
        // Log-Log Scale
        // X-Axis: Current Multiple (M) from 1 to 20
        // Y-Axis: Time (t) from 0.1 to 10
        const minM = 1;
        const maxM = 20;
        const minT = 0.1;
        const maxT = 100;

        const logMinM = Math.log10(minM);
        const logMaxM = Math.log10(maxM);
        const logMinT = Math.log10(minT);
        const logMaxT = Math.log10(maxT);

        const xScale = w / (logMaxM - logMinM);
        const yScale = h / (logMaxT - logMinT);

        const getX = (m: number) => (Math.log10(m) - logMinM) * xScale;
        const getY = (t: number) => h - (Math.log10(t) - logMinT) * yScale;

        // Colors
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        const axisColor = isDark ? '#94a3b8' : '#64748b';
        const curveColor = '#3b82f6';

        ctx.clearRect(0, 0, w, h);

        // 1. GRID
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        // X-Grid (Multiples 1, 2, 5, 10, 20)
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20].forEach(m => {
            const x = getX(m);
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            if ([1, 2, 5, 10, 20].includes(m)) {
                ctx.fillStyle = axisColor;
                ctx.font = '10px sans-serif';
                ctx.fillText(m + 'x', x + 2, h - 5);
            }
        });
        // Y-Grid (Time 0.1, 1, 10, 100)
        [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100].forEach(t => {
            const y = getY(t);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            if ([0.1, 1, 10, 100].includes(t)) {
                ctx.fillStyle = axisColor;
                ctx.font = '10px sans-serif';
                ctx.fillText(t + 's', 2, y - 2);
            }
        });

        // 2. CURVE
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        // Plot from M=1.1 to 20
        for (let m = 1.05; m <= 20; m += 0.1) {
            // Calculate time using IEC formula locally to draw curve
            // Note: Reuse the math logic or duplicate simplified version for render speed
            let k = 0.14, alpha = 0.02;
            if (curve === 'VERY') { k = 13.5; alpha = 1.0; }
            if (curve === 'EXTREME') { k = 80.0; alpha = 2.0; }
            if (curve === 'LONG') { k = 120.0; alpha = 1.0; } // Long Inverse

            const t = tms * (k / (Math.pow(m, alpha) - 1));

            if (t >= minT && t <= maxT) {
                const x = getX(m);
                const y = getY(t);
                if (!started) { ctx.moveTo(x, y); started = true; }
                else { ctx.lineTo(x, y); }
            }
        }
        ctx.stroke();

        // 3. LIVE POINT
        // Calculate multiple
        const M_live = liveCurrent / pickup;
        if (M_live > 1) {
            const xLive = getX(Math.min(M_live, 20));
            // Show current position on curve (expected trip time)
            const expectedT = calculateTripTime(liveCurrent, pickup, tms, curve);

            if (expectedT && expectedT >= minT && expectedT <= maxT) {
                const yLive = getY(expectedT);

                // Draw Target Point
                ctx.fillStyle = '#ef4444';
                ctx.beginPath(); ctx.arc(xLive, yLive, 5, 0, 2 * Math.PI); ctx.fill();

                // Draw Progress Line if tripping
                if (tripTime !== null) {
                    // Logic: As timer increases, we could animate a point moving UP from t=0 to trip time? 
                    // Or just show the intersection point. Let's show intersection.
                } else {
                    // Draw vertical line indicating current level
                    ctx.strokeStyle = '#ef4444';
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath(); ctx.moveTo(xLive, h); ctx.lineTo(xLive, yLive); ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        }

    }, [pickup, tms, curve, liveCurrent, isDark]);

    return (
        <div ref={containerRef} className="w-full relative">
            <canvas ref={canvasRef} className="rounded-lg" />
            <div className="absolute bottom-2 right-2 text-[9px] text-slate-400 bg-slate-900/50 px-1 rounded backdrop-blur">
                Log-Log TCC Plot
            </div>
        </div>
    );
}

// --- 3.5. WAVEFORM COMPONENT ---
const WaveformViewer = ({ liveCurrent, harmonicLevel, isDark }: { liveCurrent: number, harmonicLevel: number, isDark: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const cvs = canvasRef.current;
        const container = containerRef.current;
        if (!cvs || !container) return;
        
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        
        let animationFrameId: number;
        let phase = 0;
        
        const render = () => {
            const w = container.clientWidth;
            const h = 200;
            cvs.width = w;
            cvs.height = h;
            
            ctx.clearRect(0, 0, w, h);
            
            // Draw Grid
            ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
            ctx.stroke();
            
            if (liveCurrent <= 0) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }
            
            // Draw Waveform
            ctx.beginPath();
            ctx.strokeStyle = '#6366f1'; // indigo-500
            ctx.lineWidth = 2;
            
            // Scale amplitude based on standard max of 50A
            const amplitude = Math.min((liveCurrent / 50) * (h/2) * 0.8, (h/2) * 0.95);
            const frequency = 0.05; // roughly 60Hz visual approx for width
            
            for (let x = 0; x < w; x++) {
                // Fundamental
                let y = Math.sin(x * frequency + phase) * amplitude;
                
                // Add 2nd Harmonic
                if (harmonicLevel > 0) {
                    const h2Amp = amplitude * (harmonicLevel / 100);
                    // 2nd harmonic is 2x frequency
                    y += Math.sin(x * frequency * 2 + phase * 2) * h2Amp;
                }
                
                if (x === 0) ctx.moveTo(x, h/2 - y);
                else ctx.lineTo(x, h/2 - y);
            }
            ctx.stroke();
            
            phase += 0.15; // Scroll speed
            animationFrameId = requestAnimationFrame(render);
        };
        
        render();
        
        return () => cancelAnimationFrame(animationFrameId);
    }, [liveCurrent, harmonicLevel, isDark]);
    
    return (
        <div ref={containerRef} className="w-full relative shadow-inner overflow-hidden rounded-lg">
            <canvas ref={canvasRef} className={`w-full ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`} />
            <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-500 bg-black/10 dark:bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                Fundamental + 2nd Harmonic
            </div>
            {liveCurrent > 0 && (
                <div className="absolute bottom-2 right-2 flex gap-2">
                    <span className="text-[10px] font-mono text-indigo-500 bg-indigo-500/10 px-1 rounded">{liveCurrent.toFixed(1)}A</span>
                    {harmonicLevel > 0 && <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1 rounded">{harmonicLevel}% THD</span>}
                </div>
            )}
        </div>
    );
};

// --- 4. SUB-COMPONENTS ---

const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    // --- STATE ---
    const [mode, setMode] = useState<'PULSE' | 'RAMP'>('PULSE');
    const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'TRIPPED' | 'REST'>('IDLE');

    // Relay Settings
    const [pickup, setPickup] = useState(5.0); // Amps
    const [tms, setTms] = useState(0.5); // Time Multiplier Setting
    const [curve, setCurve] = useState('STANDARD'); // STANDARD, VERY, EXTREME

    // Injection State
    const [injectCurrent, setInjectCurrent] = useState(10.0);
    const [rampStart, setRampStart] = useState(0.0);
    const [rampRate, setRampRate] = useState(1.0);
    const [harmonicLevel, setHarmonicLevel] = useState(0);

    // Runtime State
    const [liveCurrent, setLiveCurrent] = useState(0);
    const [timer, setTimer] = useState(0);
    const [tripTime, setTripTime] = useState<number | null>(null);
    const [pickupResult, setPickupResult] = useState<number | null>(null);
    const [testHistory, setTestHistory] = useState<{mode: string, result: string, error: string}[]>([]);

    // Disk Animation
    const [diskAngle, setDiskAngle] = useState(0);
    const requestRef = useRef<number>();
    const intervalRef = useRef<number>();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const stateParam = params.get('s');
        if (stateParam) {
            try {
                const state = JSON.parse(atob(stateParam));
                if (state.pickup !== undefined) setPickup(state.pickup);
                if (state.tms !== undefined) setTms(state.tms);
                if (state.curve) setCurve(state.curve);
                if (state.injectCurrent !== undefined) setInjectCurrent(state.injectCurrent);
                if (state.rampStart !== undefined) setRampStart(state.rampStart);
                if (state.rampRate !== undefined) setRampRate(state.rampRate);
                if (state.harmonicLevel !== undefined) setHarmonicLevel(state.harmonicLevel);
                if (state.mode) setMode(state.mode);
            } catch (e) {
                console.error("Failed to parse share link", e);
            }
        }
    }, []);

    const copyShareLink = () => {
        const state = { pickup, tms, curve, injectCurrent, rampStart, rampRate, harmonicLevel, mode };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert("Simulation link copied! You can share this URL to load the exact state.");
    };

    // --- MATH ---
    const calculateExpectedTime = (I: number) => calculateTripTime(I, pickup, tms, curve);

    // --- PHYSICS LOOP (Animation) ---
    const animate = () => {
        setDiskAngle(prev => {
            const multiple = liveCurrent / pickup;
            let speed = 0;
            // Only rotate if above pickup and not blocked
            if (liveCurrent > pickup && status !== 'REST') {
                speed = multiple * 2;
            }
            return (prev + speed) % 360;
        });
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [liveCurrent, pickup, status]);

    // --- TEST LOGIC ---
    const startPulseTest = () => {
        setStatus('RUNNING');
        setTimer(0);
        setTripTime(null);
        setLiveCurrent(injectCurrent); // Step change

        const startTime = Date.now();
        const expected = calculateExpectedTime(injectCurrent);

        intervalRef.current = window.setInterval(() => {
            const now = Date.now();
            const elapsed = (now - startTime) / 1000;
            setTimer(elapsed);

            // Harmonic Blocking Logic
            if (harmonicLevel > 15) {
                setStatus('REST');
                // Doesn't trip
            } else {
                if (expected && elapsed >= expected) {
                    finishTest('TRIPPED');
                    setTripTime(elapsed);
                }
            }

            // Safety timeout
            if (elapsed > 100) finishTest('IDLE');
        }, 10);
    };

    const startRampTest = () => {
        setStatus('RUNNING');
        setPickupResult(null);
        setLiveCurrent(rampStart);

        const tickRate = 50; // ms
        const stepPerTick = rampRate * (tickRate / 1000);

        intervalRef.current = window.setInterval(() => {
            setLiveCurrent(prev => {
                const next = prev + stepPerTick;

                // Check Pickup
                if (next > pickup) {
                    if (harmonicLevel > 15) {
                        setStatus('REST');
                    } else {
                        finishTest('TRIPPED');
                        setPickupResult(next);
                    }
                }

                if (next > 100) finishTest('IDLE'); // Safety
                return next;
            });
        }, tickRate);
    };

    const finishTest = (finalStatus: 'TRIPPED' | 'IDLE') => {
        clearInterval(intervalRef.current);
        setStatus(finalStatus);
        if (finalStatus === 'TRIPPED') {
            const expected = mode === 'PULSE' ? calculateExpectedTime(injectCurrent) : pickup;
            const actual = mode === 'PULSE' ? timer : liveCurrent;
            const err = Math.abs(actual - (expected || 0));
            const tolerance = mode === 'PULSE' ? Math.max(0.03, (expected || 0) * 0.05) : pickup * 0.05;
            setTestHistory(prev => [{ mode, result: err <= tolerance ? 'PASS' : 'FAIL', error: err.toFixed(3) }, ...prev].slice(0, 10));
        }
    };

    const stopTest = () => {
        clearInterval(intervalRef.current);
        setStatus('IDLE');
        setLiveCurrent(0);
        setTimer(0);
    };

    // Cleanup
    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    // Format helpers
    const getExpectedText = () => {
        if (mode === 'RAMP') return "N/A";
        const t = calculateExpectedTime(injectCurrent);
        return t ? `${t.toFixed(3)}s` : "No Trip";
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 max-w-[1600px] mx-auto pb-20 h-full lg:h-auto overflow-y-auto">

            {/* LEFT: SETTINGS & CONTROL */}
            <div className="lg:col-span-4 space-y-6">

                {/* 1. RELAY SETTINGS */}
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Settings className="w-4 h-4" /> Relay Settings (51)
                    </h3>
                    <div className="space-y-6">
                        <Slider 
                            label="Pickup Current (Is)" 
                            unit=" A" 
                            min={1} 
                            max={10} 
                            step={0.5} 
                            value={pickup} 
                            onChange={(e) => setPickup(Number(e.target.value))} 
                            color="blue" 
                        />
                        <Slider 
                            label="Time Multiplier (TMS)" 
                            min={0.05} 
                            max={1.0} 
                            step={0.05} 
                            value={tms} 
                            onChange={(e) => setTms(Number(e.target.value))} 
                            color="blue" 
                        />
                        <div>
                            <label className={`text-[10px] font-bold uppercase mb-2 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Curve Type (IEC 60255)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['STANDARD', 'VERY', 'EXTREME', 'LONG'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCurve(c)}
                                        className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${curve === c ? 'bg-indigo-600 text-white border-indigo-500' : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. TEST CONTROLS */}
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`font-bold flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Sliders className="w-4 h-4" /> Injection Control
                        </h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => { setMode('PULSE'); stopTest(); }} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${mode === 'PULSE' ? 'bg-white dark:bg-slate-600 shadow' : 'opacity-50'}`}>Pulse</button>
                            <button onClick={() => { setMode('RAMP'); stopTest(); }} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${mode === 'RAMP' ? 'bg-white dark:bg-slate-600 shadow' : 'opacity-50'}`}>Ramp</button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {mode === 'PULSE' ? (
                            <Slider 
                                label="Inject Amps" 
                                unit=" A" 
                                min={1} 
                                max={50} 
                                step={0.5} 
                                value={injectCurrent} 
                                onChange={(e) => setInjectCurrent(Number(e.target.value))} 
                                color="indigo" 
                            />
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Start (A)</label>
                                    <input type="number" min="0" max="100" value={rampStart} onChange={(e) => setRampStart(Math.min(100, Math.max(0, Number(e.target.value))))} className={`w-full mt-1 border rounded px-2 py-1 text-sm font-mono ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Rate (A/s)</label>
                                    <input type="number" min="0" max="100" step="0.1" value={rampRate} onChange={(e) => setRampRate(Math.min(100, Math.max(0, Number(e.target.value))))} className={`w-full mt-1 border rounded px-2 py-1 text-sm font-mono ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} />
                                </div>
                            </div>
                        )}

                        <Slider 
                            label="2nd Harmonic (Inrush)" 
                            unit="%" 
                            min={0} 
                            max={40} 
                            value={harmonicLevel} 
                            onChange={(e) => setHarmonicLevel(Number(e.target.value))} 
                            color="amber" 
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={mode === 'PULSE' ? startPulseTest : startRampTest}
                                disabled={status === 'RUNNING'}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg transition-all"
                            >
                                <Play className="w-4 h-4" /> Start
                            </button>
                            <button
                                onClick={stopTest}
                                className={`flex-1 py-3 border rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${isDark ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                            >
                                <Square className="w-4 h-4" /> Stop
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: VISUALIZATION */}
            <div className="lg:col-span-8 flex flex-col gap-6">

                {/* RELAY FACEPLATE */}
                <div className="flex-1 bg-black rounded-3xl p-8 border-4 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between min-h-[400px]">

                    {/* Top Status Bar */}
                    <div className="w-full flex justify-between items-start z-10">
                        <div className="text-slate-500 text-xs font-black tracking-[0.2em] bg-slate-900 px-2 py-1 rounded border border-slate-800">SEL-751 FE</div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${status === 'TRIPPED' ? 'bg-red-900/50 border-red-500 text-red-500' :
                            status === 'RUNNING' ? 'bg-green-900/50 border-green-500 text-green-500' :
                                status === 'REST' ? 'bg-amber-900/50 border-amber-500 text-amber-500' :
                                    'bg-slate-900 border-slate-700 text-slate-500'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${status === 'RUNNING' ? 'bg-green-500 animate-pulse' : status === 'TRIPPED' ? 'bg-red-500' : status === 'REST' ? 'bg-amber-500' : 'bg-slate-500'}`}></div>
                            {status === 'REST' ? 'BLOCKED' : status}
                        </div>
                    </div>

                    {/* Induction Disk Animation */}
                    <div className="relative w-64 h-64 flex items-center justify-center my-4">
                        {/* Disk */}
                        <div
                            className="absolute w-full h-full rounded-full border-[20px] border-slate-800 shadow-inner bg-[conic-gradient(from_0deg,#1e293b_0deg,#0f172a_180deg,#1e293b_360deg)]"
                            style={{ transform: `rotate(${diskAngle}deg)` }}
                        >
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-600 rounded-full"></div> {/* Slot mark */}
                        </div>
                        {/* Center Hub */}
                        <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-xl border border-slate-600 flex items-center justify-center">
                            <Zap className={`w-8 h-8 ${liveCurrent > pickup ? 'text-amber-500 animate-pulse' : 'text-slate-600'}`} />
                        </div>
                    </div>

                    {/* Digital Display */}
                    <div className="w-full grid grid-cols-3 gap-4 z-10">
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Injection</div>
                            <div className="text-2xl font-mono font-bold text-white">{liveCurrent.toFixed(2)} <span className="text-sm text-slate-600">A</span></div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Timer</div>
                            <div className="text-2xl font-mono font-bold text-white">{timer.toFixed(3)} <span className="text-sm text-slate-600">s</span></div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Expected</div>
                            <div className="text-xl font-mono font-bold text-slate-400">{getExpectedText()}</div>
                        </div>
                    </div>

                    {/* Result Overlay */}
                    {status === 'TRIPPED' && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4 shadow-[0_0_30px_red]">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-1">TRIP</h2>
                            <div className="text-xl font-mono text-red-400">
                                {mode === 'PULSE' ? `${tripTime?.toFixed(3)}s` : `${pickupResult?.toFixed(2)}A`}
                            </div>
                            <div className="mt-2 text-xs text-slate-400">
                                {mode === 'PULSE'
                                    ? `Error: ${(Math.abs((tripTime || 0) - (calculateExpectedTime(injectCurrent) || 0))).toFixed(3)}s`
                                    : `Error: ${(Math.abs((pickupResult || 0) - pickup)).toFixed(2)}A`
                                }
                            </div>
                            <button onClick={() => { setStatus('IDLE'); setLiveCurrent(0); }} className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors">
                                Acknowledge
                            </button>
                        </div>
                    )}
                </div>

                {/* Test History */}
                {testHistory.length > 0 && (
                    <div className={`p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className={`font-bold flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                <ClipboardCheck className="w-4 h-4 text-indigo-500" /> Test Log
                            </h4>
                            <div className="flex gap-4">
                                <button onClick={() => {
                                    const txt = testHistory.map((t, i) => `#${i + 1}: ${t.mode} | ${t.result} | Err: ${t.error}`).join('\n');
                                    navigator.clipboard.writeText(`Relay Test Report\nPickup: ${pickup}A | TMS: ${tms} | Curve: ${curve}\n${txt}`);
                                }} className="text-[10px] font-bold flex flex-row gap-1 items-center bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 p-1 px-2 rounded-md transition-colors text-blue-600 dark:text-blue-300">
                                    <ClipboardCheck className="w-3 h-3" /> REPORT
                                </button>
                                <button onClick={copyShareLink} className="text-[10px] font-bold flex flex-row gap-1 items-center bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/60 p-1 px-2 rounded-md transition-colors text-indigo-600 dark:text-indigo-300">
                                    <Share2 className="w-3 h-3" /> SHARE
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {testHistory.map((t, i) => (
                                <div key={i} className={`flex justify-between text-[10px] font-mono p-1.5 rounded ${t.result === 'PASS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    <span>#{i + 1} {t.mode}</span>
                                    <span className="font-bold">{t.result} (±{t.error})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* WAVEFORM VIEWER */}
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h4 className={`font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <Activity className="w-4 h-4 text-indigo-500" /> Live Waveform
                    </h4>
                    <WaveformViewer liveCurrent={liveCurrent} harmonicLevel={harmonicLevel} isDark={isDark} />
                </div>

                {/* TCC CURVE VIEWER */}
                <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h4 className={`font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <LineChart className="w-4 h-4 text-blue-500" /> TCC Visualizer
                    </h4>
                    <TCCGraph pickup={pickup} tms={tms} curve={curve} liveCurrent={liveCurrent} tripTime={tripTime} isDark={isDark} />
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
                    <h3 className="font-bold text-lg mb-4">Step-by-Step Testing</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                                <h4 className="font-bold">Configure Relay Settings</h4>
                                <p className="text-sm opacity-80 mt-1">
                                    Set the target <strong>Pickup (Is)</strong> and <strong>Time Multiplier (TMS)</strong> on the left panel. These represent the settings inside the relay you are testing.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h4 className="font-bold">Select Test Mode</h4>
                                <p className="text-sm opacity-80 mt-1">
                                    Choose <strong>Pulse</strong> to check timing speed (e.g., verifying a specific point on the curve like 2x Is). Choose <strong>Ramp</strong> to accurately find the Pickup threshold.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h4 className="font-bold">Inject & Observe</h4>
                                <p className="text-sm opacity-80 mt-1">
                                    Click <strong>Start</strong>. Watch the Induction Disk spin. Ensure the "Live Point" on the TCC Graph tracks towards the curve.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h4 className="font-bold mb-2 flex items-center gap-2 text-amber-500"><AlertTriangle className="w-4 h-4" /> Harmonic Blocking</h4>
                        <p className="text-sm opacity-80">
                            Increasing "2nd Harmonic" &gt;15% simulates transformer inrush. The relay will show <strong>BLOCKED</strong> status and refuse to trip, mimicking real-world stability logic.
                        </p>
                    </div>
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <h4 className="font-bold mb-2 flex items-center gap-2 text-green-500"><CheckCircle2 className="w-4 h-4" /> Pass Criteria</h4>
                        <p className="text-sm opacity-80">
                            <strong>Pickup:</strong> ±5% of setting.<br />
                            <strong>Timing:</strong> ±5% of calculated time (or ±30ms, whichever is greater).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 4. MAIN LAYOUT ---

export default function RelayTesterApp() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
<PageSEO 
    title="Relay Tester (ANSI 51) | RelaySchool" 
    description="Professional relay testing simulator (IEC 60255 / IEEE C37.90). Test pickup, timing, and harmonic blocking for protective relays." 
    url="/relaytester"
    schema={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "RelaySchool Relay Tester",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "description": "Interactive relay commissioning and testing laboratory for power system engineers."
    }}
/>


            {/* Header */}
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                        <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>GridGuard <span className="text-indigo-500">PRO</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Relay Commissioning Suite</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full opacity-50"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80">✅ IEC 60255 / IEEE C37.90 Compliant</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Tabs */}
                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {[
                        { id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4" /> },
                        { id: 'simulator', label: 'Laboratory', icon: <MonitorPlay className="w-4 h-4" /> },
                        { id: 'guide', label: 'User Guide', icon: <GraduationCap className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                                ? (isDark ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'bg-white text-indigo-600 shadow-sm')
                                : 'opacity-60 hover:opacity-100'
                                }`}
                        >
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
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
                            ? (isDark ? 'text-indigo-400' : 'text-indigo-600')
                            : 'opacity-50'
                            }`}
                    >
                        {tab.icon} <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && (
                    <TheoryLibrary
                        title="Relay Testing Handbook"
                        description="Standards and procedures for Overcurrent (50/51) Relay Commissioning."
                        sections={RELAY_TESTER_THEORY_CONTENT}
                    />
                )}

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