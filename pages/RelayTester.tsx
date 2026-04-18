import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Card } from '../components/UI/Card';
import { Slider } from '../components/UI/Slider';
import { LaTeX } from '../components/UI/LaTeX';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { RELAY_TESTER_THEORY_CONTENT } from '../data/learning-modules/relay-tester';
import { PageSEO } from "../components/SEO/PageSEO";
import { usePersistentState } from "../hooks/usePersistentState";
import { useTripFeedback } from "../hooks/useTripFeedback";
import { AICopyButton } from "../components/UI/AICopyButton";

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
        const gridColor = isDark ? '#1e293b' : '#e2e8f0';
        const axisColor = isDark ? '#64748b' : '#94a3b8';
        const curveColor = '#3b82f6';

        ctx.clearRect(0, 0, w, h);

        // 1. GRID
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20].forEach(m => {
            const x = getX(m);
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            if ([1, 2, 5, 10, 20].includes(m)) {
                ctx.fillStyle = axisColor;
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillText(m + 'x', x + 2, h - 5);
            }
        });
        [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100].forEach(t => {
            const y = getY(t);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            if ([0.1, 1, 10, 100].includes(t)) {
                ctx.fillStyle = axisColor;
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillText(t + 's', 2, y - 2);
            }
        });

        // 2. CURVE
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        let started = false;
        for (let m = 1.05; m <= 20; m += 0.1) {
            let k = 0.14, alpha = 0.02;
            if (curve === 'VERY') { k = 13.5; alpha = 1.0; }
            if (curve === 'EXTREME') { k = 80.0; alpha = 2.0; }
            if (curve === 'LONG') { k = 120.0; alpha = 1.0; } 

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
        const M_live = liveCurrent / pickup;
        if (M_live > 1) {
            const xLive = getX(Math.min(M_live, 20));
            const expectedT = calculateTripTime(liveCurrent, pickup, tms, curve);

            if (expectedT && expectedT >= minT && expectedT <= maxT) {
                const yLive = getY(expectedT);
                ctx.fillStyle = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ef4444';
                ctx.beginPath(); ctx.arc(xLive, yLive, 6, 0, 2 * Math.PI); ctx.fill();
                ctx.shadowBlur = 0;

                ctx.strokeStyle = '#ef4444';
                ctx.setLineDash([4, 4]);
                ctx.beginPath(); ctx.moveTo(xLive, h); ctx.lineTo(xLive, yLive); ctx.stroke();
                ctx.setLineDash([]);
            }
        }

    }, [pickup, tms, curve, liveCurrent, isDark]);

    return (
        <div ref={containerRef} className="w-full relative bg-slate-950/20 rounded-xl border border-slate-800/50 p-2 shadow-inner">
            <canvas ref={canvasRef} className="rounded-lg" />
            <div className="absolute bottom-4 right-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 backdrop-blur-sm">
                IEC 60255 Log-Log TCC
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
            
            ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
            ctx.stroke();
            
            if (liveCurrent <= 0) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }
            
            ctx.beginPath();
            ctx.strokeStyle = '#6366f1'; 
            ctx.lineWidth = 3;
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
            
            const amplitude = Math.min((liveCurrent / 50) * (h/2) * 0.8, (h/2) * 0.95);
            const frequency = 0.05; 
            
            for (let x = 0; x < w; x++) {
                let y = Math.sin(x * frequency + phase) * amplitude;
                if (harmonicLevel > 0) {
                    const h2Amp = amplitude * (harmonicLevel / 100);
                    y += Math.sin(x * frequency * 2 + phase * 2) * h2Amp;
                }
                if (x === 0) ctx.moveTo(x, h/2 - y);
                else ctx.lineTo(x, h/2 - y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            phase += 0.15; 
            animationFrameId = requestAnimationFrame(render);
        };
        
        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [liveCurrent, harmonicLevel, isDark]);
    
    return (
        <div ref={containerRef} className="w-full relative shadow-inner overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            <canvas ref={canvasRef} className="w-full" />
            <div className="absolute top-4 left-4 text-[9px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 backdrop-blur-sm">
                Fundamental + 2nd Harmonic
            </div>
            {liveCurrent > 0 && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{liveCurrent.toFixed(1)}A</span>
                    {harmonicLevel > 0 && <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">{harmonicLevel}% THD</span>}
                </div>
            )}
        </div>
    );
};

// --- 4. SUB-COMPONENTS ---

const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [mode, setMode] = usePersistentState<'PULSE' | 'RAMP'>('rt_mode', 'PULSE');
    const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'TRIPPED' | 'REST'>('IDLE');

    const [pickup, setPickup] = usePersistentState('rt_pickup', 5.0); 
    const [tms, setTms] = usePersistentState('rt_tms', 0.5); 
    const [curve, setCurve] = usePersistentState('rt_curve', 'STANDARD'); 

    const [injectCurrent, setInjectCurrent] = usePersistentState('rt_inject', 10.0);
    const [rampStart, setRampStart] = usePersistentState('rt_ramp_start', 0.0);
    const [rampRate, setRampRate] = usePersistentState('rt_ramp_rate', 1.0);
    const [harmonicLevel, setHarmonicLevel] = usePersistentState('rt_harmonic', 0);

    const [liveCurrent, setLiveCurrent] = useState(0);
    const [timer, setTimer] = useState(0);
    const [tripTime, setTripTime] = useState<number | null>(null);
    const [pickupResult, setPickupResult] = useState<number | null>(null);
    const [testHistory, setTestHistory] = useState<{mode: string, result: string, error: string}[]>([]);
    const { isTripping, triggerTrip } = useTripFeedback();

    const [diskAngle, setDiskAngle] = useState(0);
    const requestRef = useRef<number>();
    const intervalRef = useRef<number>();

    // Legacy share logic removed for Phase 2 AICopyButton.

    const calculateExpectedTime = (I: number) => calculateTripTime(I, pickup, tms, curve);

    const animate = useCallback(() => {
        setDiskAngle(prev => {
            const multiple = liveCurrent / pickup;
            let speed = 0;
            if (liveCurrent > pickup && status !== 'REST') {
                speed = multiple * 2.5;
            }
            return (prev + speed) % 360;
        });
        requestRef.current = requestAnimationFrame(animate);
    }, [liveCurrent, pickup, status]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate]);

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

    const startPulseTest = () => {
        triggerTrip();
        setStatus('RUNNING');
        setTimer(0);
        setTripTime(null);
        setLiveCurrent(injectCurrent);
        const startTime = Date.now();
        const expected = calculateExpectedTime(injectCurrent);
        intervalRef.current = window.setInterval(() => {
            const now = Date.now();
            const elapsed = (now - startTime) / 1000;
            setTimer(elapsed);
            if (harmonicLevel > 15) { setStatus('REST'); } 
            else {
                if (expected && elapsed >= expected) {
                    finishTest('TRIPPED');
                    setTripTime(elapsed);
                }
            }
            if (elapsed > 100) finishTest('IDLE');
        }, 10);
    };

    const startRampTest = () => {
        triggerTrip();
        setStatus('RUNNING');
        setPickupResult(null);
        setLiveCurrent(rampStart);
        const tickRate = 50; 
        const stepPerTick = rampRate * (tickRate / 1000);
        intervalRef.current = window.setInterval(() => {
            setLiveCurrent(prev => {
                const next = prev + stepPerTick;
                if (next > pickup) {
                    if (harmonicLevel > 15) { setStatus('REST'); } 
                    else {
                        finishTest('TRIPPED');
                        setPickupResult(next);
                    }
                }
                if (next > 100) finishTest('IDLE'); 
                return next;
            });
        }, tickRate);
    };

    const stopTest = () => {
        clearInterval(intervalRef.current);
        setStatus('IDLE');
        setLiveCurrent(0);
        setTimer(0);
    };

    useEffect(() => { return () => clearInterval(intervalRef.current); }, []);

    const getExpectedText = () => {
        if (mode === 'RAMP') return "N/A";
        const t = calculateExpectedTime(injectCurrent);
        return t ? `${t.toFixed(3)}s` : "No Trip";
    };

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 max-w-[1600px] mx-auto pb-20 h-full lg:h-auto overflow-y-auto ${isTripping ? 'animate-trip' : ''}`}>
            {/* LEFT: SETTINGS & CONTROL */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <Card isDark={isDark} noPadding>
                    <div className="p-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-indigo-500" /> <JargonTooltip text="Relay Settings" explanation="Configurable parameters that define the relay's protection logic and characteristics." /> (ANSI 51)
                        </h3>
                        <div className="space-y-6">
                            <Slider label="Pickup Current (Is)" unit=" A" min={1} max={10} step={0.5} value={pickup} onChange={(e) => setPickup(Number(e.target.value))} color="blue" disabled={status === 'RUNNING'} />
                            <Slider label="Time Multiplier (TMS)" unit="" min={0.05} max={1.0} step={0.05} value={tms} onChange={(e) => setTms(Number(e.target.value))} color="blue" disabled={status === 'RUNNING'} />
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">IEC 60255 Curve Characteristic</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['STANDARD', 'VERY', 'EXTREME', 'LONG'].map(c => (
                                        <button key={c} onClick={() => setCurve(c)} disabled={status === 'RUNNING'}
                                            className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${curve === c ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card isDark={isDark} noPadding>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-emerald-500" /> <JargonTooltip text="Injection Control" explanation="Controls for generating test currents to verify relay operation." />
                            </h3>
                            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                                <button onClick={() => { setMode('PULSE'); stopTest(); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${mode === 'PULSE' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>PULSE</button>
                                <button onClick={() => { setMode('RAMP'); stopTest(); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${mode === 'RAMP' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>RAMP</button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {mode === 'PULSE' ? (
                                <Slider label="Current Step" unit=" A" min={1} max={50} step={0.5} value={injectCurrent} onChange={(e) => setInjectCurrent(Number(e.target.value))} color="emerald" disabled={status === 'RUNNING'} />
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Start (A)</label>
                                        <input type="number" min="0" max="100" value={rampStart} onChange={(e) => setRampStart(Math.min(100, Math.max(0, Number(e.target.value))))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Rate (A/s)</label>
                                        <input type="number" min="0" max="100" step="0.1" value={rampRate} onChange={(e) => setRampRate(Math.min(100, Math.max(0, Number(e.target.value))))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none focus:border-emerald-500" />
                                    </div>
                                </div>
                            )}

                            <Slider label="2nd Harmonic Content" unit="%" min={0} max={40} step={1} value={harmonicLevel} onChange={(e) => setHarmonicLevel(Number(e.target.value))} color="amber" disabled={status === 'RUNNING'} />

                            <div className="flex gap-3">
                                <button onClick={mode === 'PULSE' ? startPulseTest : startRampTest} disabled={status === 'RUNNING'}
                                    className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white rounded-2xl font-black text-xs tracking-widest flex justify-center items-center gap-2 shadow-lg transition-all active:translate-y-0.5">
                                    <Play className="w-4 h-4 fill-current" /> START TEST
                                </button>
                                <button onClick={stopTest}
                                    className="px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl font-black text-xs tracking-widest flex justify-center items-center gap-2 transition-all active:translate-y-0.5">
                                    <Square className="w-4 h-4 fill-current" /> STOP
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* RIGHT: VISUALIZATION */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                {/* RELAY FACEPLATE */}
                <div className={`rounded-3xl p-10 border-[6px] shadow-[20px_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col items-center justify-between min-h-[450px] transition-colors duration-500 ${isDark ? 'bg-[#020617] border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-transparent pointer-events-none" />
                    <div className="w-full flex justify-between items-start z-10">
                        <div className="flex flex-col gap-1">
                            <div className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg border shadow-inner ${isDark ? 'text-slate-400 bg-slate-950 border-slate-800' : 'text-slate-600 bg-white border-slate-200'}`}>GRIDGUARD PRO-51</div>
                            <div className="text-[8px] font-bold text-slate-600 tracking-[0.3em] pl-1">IEC 60255 COMPLIANT</div>
                        </div>
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border-2 transition-all ${status === 'TRIPPED' ? 'bg-red-950/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' :
                            status === 'RUNNING' ? 'bg-emerald-950/20 border-emerald-500 text-emerald-500' :
                                status === 'REST' ? 'bg-amber-950/20 border-amber-500 text-amber-500' :
                                    'bg-slate-900 border-slate-800 text-slate-600'
                            }`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${status === 'RUNNING' ? 'bg-emerald-500 animate-ping' : status === 'TRIPPED' ? 'bg-red-500' : status === 'REST' ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                            {status === 'REST' ? 'BLOCKED (87)' : status}
                        </div>
                    </div>

                    <div className="relative w-72 h-72 flex items-center justify-center my-6 group">
                        <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                        <div className="absolute w-full h-full rounded-full border-[24px] border-slate-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] bg-[conic-gradient(from_0deg,#1e293b_0deg,#0f172a_180deg,#1e293b_360deg)] overflow-hidden" style={{ transform: `rotate(${diskAngle}deg)` }}>
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-600 rounded-full shadow-inner" /> 
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-800/20" />
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800/20" />
                        </div>
                        <div className={`absolute w-24 h-24 rounded-full shadow-[0_0_50px_rgba(0,0,0,1)] border-2 flex items-center justify-center transition-colors duration-500 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}>
                            <Zap className={`w-10 h-10 transition-all duration-300 ${liveCurrent > pickup ? 'text-amber-500 drop-shadow-[0_0_15px_#f59e0b] scale-110' : 'text-slate-800'}`} />
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-3 gap-6 z-10">
                        <div className={`border p-4 rounded-2xl shadow-inner text-center group transition-colors ${isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1 group-hover:text-slate-400">INJECTION</div>
                            <div className="text-3xl font-mono font-black text-adaptive">{liveCurrent.toFixed(2)}<span className="text-sm text-slate-700 ml-1">A</span></div>
                        </div>
                        <div className={`border p-4 rounded-2xl shadow-inner text-center group transition-colors ${isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1 group-hover:text-slate-400">ELAPSED</div>
                            <div className="text-3xl font-mono font-black text-adaptive">{timer.toFixed(3)}<span className="text-sm text-slate-700 ml-1">s</span></div>
                        </div>
                        <div className={`border p-4 rounded-2xl shadow-inner text-center group transition-colors ${isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1 group-hover:text-slate-400">TARGET</div>
                            <div className="text-2xl font-mono font-black text-slate-500">{getExpectedText()}</div>
                        </div>
                    </div>

                    {status === 'TRIPPED' && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-fade-in p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-5xl font-black mb-2 tracking-tighter uppercase italic text-adaptive">RELAY TRIP</h2>
                            <div className="text-3xl font-mono font-bold text-red-500 mb-6 bg-red-500/10 px-6 py-2 rounded-2xl border border-red-500/20">
                                {mode === 'PULSE' ? `${tripTime?.toFixed(3)} s` : `${pickupResult?.toFixed(2)} A`}
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 max-w-sm">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Error Margin Analysis</div>
                                <div className="text-xs text-slate-300 font-mono">
                                    {mode === 'PULSE'
                                        ? `Δt: ${(Math.abs((tripTime || 0) - (calculateExpectedTime(injectCurrent) || 0))).toFixed(3)}s (±5% IEC Tolerance)`
                                        : `ΔI: ${(Math.abs((pickupResult || 0) - pickup)).toFixed(2)}A (±5% Pick-up Error)`
                                    }
                                </div>
                            </div>
                            <button onClick={() => { setStatus('IDLE'); setLiveCurrent(0); }} 
                                className="mt-8 px-10 py-3.5 bg-white text-black rounded-2xl text-[10px] font-black tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95 shadow-xl uppercase">
                                Acknowledge Fault
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card isDark={isDark} noPadding>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4 text-indigo-500" /> SEQUENCE LOG
                                </h4>
                                <div className="flex gap-2">
                                    <AICopyButton state={{ pickup, tms, curve, injectCurrent, rampStart, rampRate, harmonicLevel, mode, status }} toolName="Relay Tester / ANSI 51" />
                                </div>
                            </div>
                            <div className="space-y-1.5 min-h-[140px] max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                                {testHistory.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                                        <Database className="w-8 h-8 mb-2" />
                                        <span className="text-[10px] font-bold">Awaiting test data...</span>
                                    </div>
                                ) : (
                                    testHistory.map((t, i) => (
                                        <div key={i} className={`flex justify-between items-center p-3 rounded-xl border border-dashed transition-all ${t.result === 'PASS' ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400' : 'bg-red-500/5 border-red-500/30 text-red-400'}`}>
                                            <span className="text-[9px] font-black tracking-widest">#{testHistory.length - i} {t.mode}</span>
                                            <span className="font-mono text-[10px] font-bold">{t.result} [Δ{t.error}]</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card isDark={isDark} noPadding>
                        <div className="p-6">
                            <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" /> WAVEFORM ANALYZER
                            </h4>
                            <WaveformViewer liveCurrent={liveCurrent} harmonicLevel={harmonicLevel} isDark={isDark} />
                        </div>
                    </Card>
                </div>

                <Card isDark={isDark} noPadding>
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <h4 className="font-black text-xl tracking-tighter text-white flex items-center gap-3">
                                <LineChart className="w-6 h-6 text-indigo-500" /> <span className="text-adaptive">IEC 60255 TCC VISUALIZER</span>
                            </h4>
                            <div className="flex gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Trip Equation</span>
                                    <LaTeX math="t = TMS \times \frac{k}{M^{\alpha} - 1}" />
                                </div>
                            </div>
                        </div>
                        <TCCGraph pickup={pickup} tms={tms} curve={curve} liveCurrent={liveCurrent} tripTime={tripTime} isDark={isDark} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

const UserGuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-5xl mx-auto p-12 text-slate-200">
        <h2 className="text-4xl font-black mb-12 tracking-tight flex items-center gap-4">
            <GraduationCap className="w-10 h-10 text-indigo-500" /> Operational Lab Manual
        </h2>
        <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 opacity-50"></div>
                <div className="text-3xl font-black text-indigo-500/20 absolute top-6 right-8">01</div>
                <h4 className="text-lg font-bold mb-4 text-adaptive">SET CONFIG</h4>
                <p className="text-sm text-adaptive-muted leading-relaxed font-medium">Define your target <strong>Pickup (Is)</strong> and <strong>TMS</strong>. These represent the relay's programmed settings in a real-world substation environment.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-50"></div>
                <div className="text-3xl font-black text-emerald-500/20 absolute top-6 right-8">02</div>
                <h4 className="text-lg font-bold mb-4 text-adaptive">CHOOSE MODE</h4>
                <p className="text-sm text-adaptive-muted leading-relaxed font-medium">Use <strong>PULSE</strong> to verify specific timing points on the TCC curve. Use <strong>RAMP</strong> to precisely identify the electrical pick-up threshold.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-50"></div>
                <div className="text-3xl font-black text-red-500/20 absolute top-6 right-8">03</div>
                <h4 className="text-lg font-bold mb-4 text-adaptive">AUDIT TRIP</h4>
                <p className="text-sm text-adaptive-muted leading-relaxed font-medium">Inject current and audit the performance. The "Δ Error" compares actual trip speeds against mathematical perfection defined by <strong>IEC 60255</strong>.</p>
            </div>
        </div>
        <div className="p-10 rounded-[3rem] bg-indigo-600/5 dark:bg-indigo-600/10 border border-indigo-500/20">
            <h3 className="text-2xl font-black mb-6 text-adaptive tracking-tight flex items-center gap-3"><ShieldCheck className="w-8 h-8 text-indigo-500" /> Advanced Logic Verification</h3>
            <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <strong className="text-adaptive text-lg block font-bold">2nd Harmonic Inrush Blocking</strong>
                    <p className="text-sm text-adaptive-muted leading-relaxed font-medium italic">"When a transformer is energized, it can draw high current without a fault existing."</p>
                    <p className="text-sm text-adaptive-muted">Simulation: Increase harmonic level &gt;15%. The relay will sense 'Inrush' and enter <strong>BLOCKED</strong> state, preventing a nuisance trip. This verifies the differential stability logic.</p>
                </div>
                <div className="space-y-4">
                    <strong className="text-white text-lg block font-bold">TCC Curve Alignment</strong>
                    <p className="text-sm opacity-60 leading-relaxed font-medium">Watch the live red point on the log-log plot. It should follow the blue characteristic curve exactly. Deviation indicates setting errors or relay calibration issues in a field environment.</p>
                </div>
            </div>
        </div>
    </div>
);

export default function RelayTesterApp() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();

    useEffect(() => {
        document.body.style.backgroundColor = isDark ? '#020617' : '#f8fafc';
    }, [isDark]);

    const tabs = [
        { id: 'theory', label: 'Reference DB', icon: <Book className="w-4 h-4" /> },
        { id: 'simulator', label: 'Testing Lab', icon: <MonitorPlay className="w-4 h-4" /> },
        { id: 'guide', label: 'Lab Manual', icon: <GraduationCap className="w-4 h-4" /> },
    ];

    return (
        <div className={`min-h-[100dvh] flex flex-col font-sans transition-all duration-500 selection:bg-indigo-500/30 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <PageSEO 
                title="Relay Tester (ANSI 51)" 
                description="Professional relay testing simulator (IEC 60255 / IEEE C37.90). Test pickup, timing, and harmonic blocking for protective relays." 
                url="/relaytester"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "RelaySchool Relay Tester",
                    "applicationCategory": "EducationalApplication",
                    "description": "Interactive relay commissioning and testing laboratory for power system engineers."
                }}
            />

            <header className={`h-20 border-b shrink-0 flex items-center justify-between px-8 z-30 sticky top-0 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800/80 backdrop-blur-xl' : 'bg-white/80 border-slate-200/80 backdrop-blur-xl shadow-sm'}`}>
                <div className="flex items-center gap-5">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-3 rounded-2xl text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-white/10">
                        <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-black text-2xl tracking-tighter text-adaptive">GridGuard <span className="text-indigo-400">PRO</span></h1>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">ANSI 51 LOGIC</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">IEC 60255-151</span>
                        </div>
                    </div>
                </div>

                <div className={`hidden md:flex items-center p-1.5 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-900/50 border-slate-800 shadow-inner backdrop-blur-md' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all duration-300 ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-4">
                    <div className="px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">COMMS: OK</span>
                    </div>
                </div>
            </header>

            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-4 bg-slate-950/90 backdrop-blur-xl border-slate-800">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1.5 text-[9px] font-black tracking-widest transition-all ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-600'}`}>
                        {tab.icon} <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <main className={`flex-1 overflow-hidden relative pb-16 md:pb-0 transition-colors duration-500 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
                {activeTab === 'theory' && (
                    <div className="h-full overflow-y-auto bg-slate-950 scroll-smooth">
                        <TheoryLibrary title="Relay Theory" description="Operational standards for time-overcurrent protection." sections={RELAY_TESTER_THEORY_CONTENT} />
                    </div>
                )}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}>
                    <SimulatorModule isDark={isDark} />
                </div>
                {activeTab === 'guide' && (
                    <div className="h-full overflow-y-auto scroll-smooth">
                        <UserGuideModule isDark={isDark} />
                    </div>
                )}
            </main>
        </div>
    );
}