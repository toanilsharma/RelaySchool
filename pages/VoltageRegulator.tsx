import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, 
    Award, TrendingUp, Zap, Activity, Play, AlertTriangle, CheckCircle2, 
    ShieldCheck, Share2, ChevronRight, BarChart3, Clock, Flame
} from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// ============================== HOOKS & UTILS ==============================
const useThemeObserver = () => {
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(mediaQuery.matches);
        const handler = (e) => setIsDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    return isDark;
};

// ============================== DATA ==============================
const VOLTAGE_REGULATOR_THEORY_CONTENT = [
    { id: 'basics', title: 'OLTC Fundamentals', content: 'An On-Load Tap Changer (OLTC) adjusts the transformer turns ratio while the transformer is energized. It compensates for varying load conditions to keep the output voltage within a specific band without interrupting the load current.' },
    { id: 'deadband', title: 'The Deadband Concept', content: 'The deadband prevents the tap changer from "hunting" (making excessive, continuous changes) due to minor, transient voltage variations. A typical deadband is ±2V to ±3V around the target voltage. If the voltage stays within this band, no tap changes occur.' },
    { id: 'ansi', title: 'ANSI C84.1 Standards', content: 'The ANSI C84.1 standard defines acceptable voltage ranges for electrical power systems. Range A specifies 120V ± 5% (114V to 126V) for normal service conditions. Range B allows for slightly wider tolerances during rare, extreme conditions.' },
    { id: 'delay', title: 'Time Delay Integration', content: 'To filter out temporary voltage sags (like a large motor starting), a time delay is used. The voltage must remain outside the deadband continuously for the duration of the time delay before a tap change command is issued.' }
];

const QUIZ_DATA = {
    easy: [
        { q: "OLTC stands for:", opts: ["Online Transformer Controller", "On-Load Tap Changer", "Offline Test Circuit", "Open-Loop Timer Control"], ans: 1, why: "OLTC (On-Load Tap Changer) adjusts the transformer turns ratio while the transformer is energized and carrying load." },
        { q: "The deadband in a voltage regulator prevents:", opts: ["Overloading", "Excessive tap hunting", "Short circuits", "Voltage collapse"], ans: 1, why: "Without deadband, even tiny voltage fluctuations would trigger tap changes. The deadband provides a window of acceptable voltage to prevent hunting." },
        { q: "A typical voltage regulation target is:", opts: ["100V", "120V ± 5% (ANSI C84.1)", "240V exactly", "50Hz"], ans: 1, why: "ANSI C84.1 defines the Range A service voltage at 120V ± 5% (114V to 126V). The regulator maintains voltage within this band." }
    ],
    medium: [
        { q: "Line drop compensation (LDC) allows the regulator to:", opts: ["Measure line current", "Maintain voltage at a remote load point", "Reduce losses", "Bypass the tap changer"], ans: 1, why: "LDC uses measured current and configured R/X settings to calculate the estimated voltage at a downstream load center, regulating to that point." },
        { q: "A 32-step regulator with ±10% range has step size of:", opts: ["5%", "0.625% per step", "1% per step", "10%"], ans: 1, why: "20% total range ÷ 32 steps = 0.625% per step. Each tap change adjusts voltage by 0.625% of rated." },
        { q: "Reverse power flow (DER) affects voltage regulation by:", opts: ["No effect", "Causing voltage rise instead of drop", "Reducing frequency", "Increasing losses"], ans: 1, why: "When DER (solar/wind) injects power, current flows toward the substation, causing voltage to RISE along the feeder instead of dropping." }
    ],
    expert: [
        { q: "ANSI C84.1 Range B voltage limits are:", opts: ["Same as Range A", "Wider than Range A (emergency conditions)", "Tighter than Range A", "Not defined"], ans: 1, why: "Range B (extreme conditions) allows 5.8% above and 8.3% below nominal. Equipment should operate under Range B but not continuously." },
        { q: "Voltage regulator coordination with LTC and capacitor banks requires:", opts: ["All to be fastest", "Staggered time delays (source side faster)", "Only one device", "No coordination"], ans: 1, why: "The substation LTC should operate first, then line regulators, then capacitor banks. Time delay staggering prevents device hunting." }
    ]
};

// ============================== UI COMPONENTS ==============================
const Card = ({ children, className = '', isDark, noPadding = false, hover = false }) => (
    <motion.div 
        whileHover={hover ? { y: -4, transition: { duration: 0.2, ease: 'easeOut' } } : {}}
        className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300 ${noPadding ? '' : 'p-6 lg:p-8'} ${
        isDark 
            ? 'bg-slate-900/60 border-white/5 shadow-2xl shadow-black/40 hover:border-white/10 hover:shadow-blue-900/20' 
            : 'bg-white/70 border-slate-200/50 shadow-xl shadow-slate-200/50 hover:border-slate-300/50 hover:shadow-blue-500/10'
        } ${className}`}>
        {/* Subtle noise texture overlay for premium feel */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
        <div className="relative z-10">{children}</div>
    </motion.div>
);

const Slider = ({ label, unit, min, max, step, value, onChange, color, disabled }) => {
    const colorMap = { 
        emerald: 'from-emerald-400 to-teal-500', 
        blue: 'from-blue-400 to-indigo-500', 
        amber: 'from-amber-400 to-orange-500' 
    };
    
    const progress = ((value - min) / (max - min)) * 100;

    return (
        <div className="flex flex-col gap-3 group">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">{label}</label>
                <motion.span 
                    key={value}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-xs font-mono font-black bg-gradient-to-r ${colorMap[color]} text-white px-3 py-1.5 rounded-lg shadow-lg`}
                >
                    {value}{unit}
                </motion.span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden backdrop-blur-sm shadow-inner">
                <div 
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colorMap[color]} transition-all duration-200 ease-out`}
                    style={{ width: `${progress}%` }}
                />
                <input 
                    type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
            </div>
        </div>
    );
};

// ============================== ADVANCED CANVAS ==============================
const VoltageCanvas = ({ isDark, history, tapPosition, target, deadband }) => {
    const canvasRef = useRef(null);
    const timeRef = useRef(0);
    const animationRef = useRef(null);
    
    useEffect(() => {
        const cvs = canvasRef.current; if (!cvs) return;
        const ctx = cvs.getContext('2d'); if (!ctx) return;
        
        let width, height;
        const margin = { l: 50, r: 20, t: 30, b: 30 };
        const vMin = 110, vMax = 130;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = cvs.getBoundingClientRect();
            width = rect.width; height = rect.height;
            cvs.width = width * dpr; cvs.height = height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            timeRef.current += 0.01;
            ctx.clearRect(0, 0, width, height);
            
            const gw = width - margin.l - margin.r;
            const gh = height - margin.t - margin.b;

            // --- Animated Background Grid ---
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
            ctx.lineWidth = 1;
            const gridOffset = (timeRef.current * 20) % 40;
            for (let x = margin.l - gridOffset; x <= width - margin.r; x += 40) {
                if (x < margin.l) continue;
                ctx.beginPath(); ctx.moveTo(x, margin.t); ctx.lineTo(x, height - margin.b); ctx.stroke();
            }

            // --- Y-Axis & Labels ---
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.font = '600 11px Inter, sans-serif';
            for (let v = vMin; v <= vMax; v += 2) {
                const y = margin.t + gh * (1 - (v - vMin) / (vMax - vMin));
                ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                ctx.beginPath(); ctx.moveTo(margin.l, y); ctx.lineTo(width - margin.r, y); ctx.stroke();
                
                ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
                if (v === 120) ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a'; // Highlight nominal
                ctx.fillText(`${v}V`, margin.l - 12, y);
            }

            // --- Target Band (Green Pulse) ---
            const yHi = margin.t + gh * (1 - (target + deadband - vMin) / (vMax - vMin));
            const yLo = margin.t + gh * (1 - (target - deadband - vMin) / (vMax - vMin));
            
            const pulse = Math.sin(timeRef.current * 3) * 0.02;
            const bandGradient = ctx.createLinearGradient(0, yHi, 0, yLo);
            bandGradient.addColorStop(0, `rgba(34,197,94,${0.02 + pulse})`);
            bandGradient.addColorStop(0.5, `rgba(34,197,94,${0.1 + pulse})`);
            bandGradient.addColorStop(1, `rgba(34,197,94,${0.02 + pulse})`);
            ctx.fillStyle = bandGradient;
            ctx.fillRect(margin.l, yHi, gw, yLo - yHi);
            
            // Band Borders
            ctx.strokeStyle = `rgba(34,197,94,${0.4 + pulse})`;
            ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(margin.l, yHi); ctx.lineTo(width - margin.r, yHi); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(margin.l, yLo); ctx.lineTo(width - margin.r, yLo); ctx.stroke();
            ctx.setLineDash([]);

            // --- ANSI Limits (Red) ---
            const y126 = margin.t + gh * (1 - (126 - vMin) / (vMax - vMin));
            const y114 = margin.t + gh * (1 - (114 - vMin) / (vMax - vMin));
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.lineWidth = 1.5; ctx.setLineDash([2, 4]);
            ctx.beginPath(); ctx.moveTo(margin.l, y126); ctx.lineTo(width - margin.r, y126); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(margin.l, y114); ctx.lineTo(width - margin.r, y114); ctx.stroke();
            ctx.setLineDash([]);

            // --- Data rendering (Smooth Cubic Bezier) ---
            if (history.length > 1) {
                const points = history.map((p, i) => ({
                    x: margin.l + (i / Math.max(history.length - 1, 1)) * gw,
                    y: margin.t + gh * (1 - (p.v - vMin) / (vMax - vMin))
                }));

                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);

                for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i];
                    const p1 = points[i + 1];
                    const xc = (p0.x + p1.x) / 2;
                    ctx.bezierCurveTo(xc, p0.y, xc, p1.y, p1.x, p1.y);
                }

                // Fill Gradient
                const fillPath = new Path2D();
                fillPath.moveTo(points[0].x, height - margin.b);
                fillPath.lineTo(points[0].x, points[0].y);
                for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i]; const p1 = points[i + 1]; const xc = (p0.x + p1.x) / 2;
                    fillPath.bezierCurveTo(xc, p0.y, xc, p1.y, p1.x, p1.y);
                }
                fillPath.lineTo(points[points.length-1].x, height - margin.b);
                
                const lastV = history[history.length-1].v;
                const isOut = lastV > 126 || lastV < 114;
                
                const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
                fillGradient.addColorStop(0, isOut ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.25)');
                fillGradient.addColorStop(1, isOut ? 'rgba(239, 68, 68, 0)' : 'rgba(56, 189, 248, 0)');
                ctx.fillStyle = fillGradient;
                ctx.fill(fillPath);

                // Stroke Line
                ctx.strokeStyle = isOut ? '#ef4444' : (isDark ? '#38bdf8' : '#3b82f6');
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                
                // Glow effect
                ctx.shadowBlur = 12;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Live Dot
                const last = points[points.length - 1];
                
                // Pulsing dot radius
                const dotRad = 4 + Math.sin(timeRef.current * 10) * 1.5;
                
                ctx.beginPath(); ctx.arc(last.x, last.y, dotRad + 2, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
                ctx.fill();
                
                ctx.beginPath(); ctx.arc(last.x, last.y, dotRad, 0, Math.PI * 2);
                ctx.fillStyle = ctx.strokeStyle;
                ctx.shadowBlur = 15;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [isDark, history, tapPosition, target, deadband]);
    
    return (
        <div className="relative w-full h-[360px]">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]"></div>
        </div>
    );
};

// ============================== SIMULATOR MODULE ==============================
const SimulatorModule = ({ isDark }) => {
    const [target, setTarget] = useState(120);
    const [deadband, setDeadband] = useState(2);
    const [timeDelay, setTimeDelay] = useState(30);
    const [tapPosition, setTapPosition] = useState(0);
    const [voltage, setVoltage] = useState(120);
    const [history, setHistory] = useState([{ t: 0, v: 120, tap: 0 }]);
    const [running, setRunning] = useState(false);
    const [events, setEvents] = useState([]);
    const [elapsed, setElapsed] = useState(0);
    const [shake, setShake] = useState(false);
    
    const timerRef = useRef(null);
    const delayCounter = useRef(0);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const start = () => {
        setRunning(true); setElapsed(0); delayCounter.current = 0;
        setHistory([{ t: 0, v: voltage, tap: tapPosition }]);
        setEvents([{ id: Date.now(), time: 0, msg: 'System initialized. Monitoring actively.', type: 'info' }]);
    };

    const applyLoad = (delta, type) => {
        if (!running) return;
        if (Math.abs(delta) > 3) triggerShake();
        setVoltage(v => Math.max(105, Math.min(135, v + delta)));
        setEvents(prev => [{ id: Date.now(), time: elapsed, msg: `Disturbance: ${type} (${delta > 0 ? '+' : ''}${delta}V)`, type: 'warn' }, ...prev]);
    };

    useEffect(() => {
        if (!running) return;
        timerRef.current = setInterval(() => {
            setElapsed(p => p + 1);
            setVoltage(v => {
                const noise = (Math.random() - 0.5) * 0.4;
                let newV = v + noise;
                
                if (Math.abs(newV - target) > deadband) {
                    delayCounter.current++;
                    if (delayCounter.current >= timeDelay) {
                        const tapDir = newV < target ? 1 : -1;
                        setTapPosition(p => Math.max(-16, Math.min(16, p + tapDir)));
                        const corrected = newV + tapDir * 0.75; 
                        delayCounter.current = 0;
                        setEvents(prev => [{ id: Date.now(), time: elapsed, msg: `Tap ${tapDir > 0 ? 'Raise' : 'Lower'} executed. Pos: ${tapPosition + tapDir}`, type: 'tap' }, ...prev].slice(0, 40));
                        newV = corrected;
                    }
                } else {
                    delayCounter.current = 0;
                }
                
                const boundedV = Math.max(105, Math.min(135, newV));
                setHistory(p => [...p, { t: elapsed, v: boundedV, tap: tapPosition }].slice(-60)); // Keep last 60 ticks for organic look
                return boundedV;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [running, target, deadband, timeDelay, tapPosition, elapsed]);

    const reset = () => {
        clearInterval(timerRef.current);
        setRunning(false); setElapsed(0); setTapPosition(0); setVoltage(120);
        setHistory([{ t: 0, v: 120, tap: 0 }]); setEvents([]); delayCounter.current = 0;
    };

    const isOutLimits = voltage > 126 || voltage < 114;
    const isOutDeadband = Math.abs(voltage - target) > deadband;
    const voltColor = isOutLimits ? 'text-red-500 bg-red-500/10 border-red-500/20' : isOutDeadband ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    const tapColor = tapPosition === 0 ? (isDark ? 'text-slate-400 bg-slate-800/50 border-slate-700/50' : 'text-slate-600 bg-slate-100 border-slate-200') : 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    const progressPercent = Math.min(100, (delayCounter.current / timeDelay) * 100);

    return (
        <motion.div 
            animate={shake ? { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } } : {}}
            className="max-w-[90rem] mx-auto p-4 lg:p-8 space-y-8"
        >
            {/* Top Grid: Canvas & Live Stats */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <Card isDark={isDark} className="xl:col-span-3 flex flex-col min-h-[460px]" noPadding>
                    <div className="p-6 lg:px-8 flex justify-between items-center border-b border-white/5 bg-black/5 dark:bg-white/5 shrink-0 backdrop-blur-md">
                        <h3 className="font-black text-xl tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500"><BarChart3 className="w-5 h-5" /></div>
                            Telemetry Array
                        </h3>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-60">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span> Target
                            </span>
                            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-60">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span> Limits
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 relative bg-gradient-to-b from-transparent to-black/[0.02] dark:to-white/[0.02]">
                        <VoltageCanvas isDark={isDark} history={history} tapPosition={tapPosition} target={target} deadband={deadband} />
                    </div>
                </Card>

                <div className="grid grid-cols-2 xl:grid-cols-1 gap-4 xl:gap-6">
                    <Card isDark={isDark} hover className={`flex flex-col justify-center border-2 transition-colors duration-500 ${voltColor}`}>
                        <div className="text-xs font-black opacity-60 uppercase tracking-widest mb-1 flex items-center gap-2"><Zap className="w-4 h-4"/> Live Voltage</div>
                        <motion.div key={voltage.toFixed(1)} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl lg:text-6xl font-black tracking-tighter">
                            {voltage.toFixed(1)}<span className="text-2xl opacity-50">V</span>
                        </motion.div>
                    </Card>
                    
                    <Card isDark={isDark} hover className={`flex flex-col justify-center border transition-colors duration-500 ${tapColor}`}>
                        <div className="text-xs font-black opacity-60 uppercase tracking-widest mb-1 flex items-center gap-2"><Activity className="w-4 h-4"/> Tap Position</div>
                        <div className="text-4xl lg:text-5xl font-black tracking-tighter">
                            {tapPosition > 0 ? '+' : ''}{tapPosition}
                        </div>
                    </Card>

                    <Card isDark={isDark} className="col-span-2 xl:col-span-1 flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-4">
                            <div className="text-xs font-black opacity-60 uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4"/> Delay Timer</div>
                            <div className="text-sm font-black font-mono bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">{delayCounter.current}s / {timeDelay}s</div>
                        </div>
                        <div className="relative h-4 w-full rounded-full bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden backdrop-blur-sm shadow-inner">
                            <motion.div 
                                className={`absolute top-0 left-0 h-full rounded-full ${delayCounter.current > 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`} 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bottom Grid: Controls & Event Log */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card isDark={isDark}>
                    <h3 className="font-black text-xl tracking-tight mb-8 flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-500"><Settings className="w-5 h-5" /></div>
                        Control Matrix
                    </h3>
                    
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Slider label="Target Voltage" unit="V" min={115} max={125} step={1} value={target} onChange={e => setTarget(+e.target.value)} color="emerald" disabled={running} />
                            <Slider label="Deadband (±V)" unit="V" min={1} max={5} step={0.5} value={deadband} onChange={e => setDeadband(+e.target.value)} color="blue" disabled={running} />
                            <Slider label="Time Delay" unit="s" min={10} max={60} step={5} value={timeDelay} onChange={e => setTimeDelay(+e.target.value)} color="amber" disabled={running} />
                        </div>
                        
                        <div className={`h-px w-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`}></div>
                        
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">Operations</div>
                            <div className="flex flex-wrap gap-4">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={start} disabled={running} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-[0_8px_16px_-4px_rgba(16,185,129,0.4)] disabled:opacity-40 disabled:shadow-none transition-all flex items-center gap-2">
                                    <Play className="w-4 h-4 fill-current"/> Initialize
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => applyLoad(-6, 'Heavy Drop')} disabled={!running} className="px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-sm shadow-[0_8px_16px_-4px_rgba(239,68,68,0.4)] disabled:opacity-40 disabled:shadow-none transition-all flex items-center gap-2">
                                    <Flame className="w-4 h-4"/> Heavy Load (-6V)
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => applyLoad(-3, 'Standard Drop')} disabled={!running} className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm shadow-[0_8px_16px_-4px_rgba(245,158,11,0.4)] disabled:opacity-40 disabled:shadow-none transition-all">
                                    Load (-3V)
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => applyLoad(+4, 'Rejection')} disabled={!running} className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-[0_8px_16px_-4px_rgba(168,85,247,0.4)] disabled:opacity-40 disabled:shadow-none transition-all">
                                    Reject (+4V)
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={reset} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-900'}`}>
                                    <RotateCcw className="w-4 h-4" /> Reset
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card isDark={isDark} noPadding className="flex flex-col h-[400px] xl:h-auto">
                    <div className="p-6 lg:px-8 border-b border-white/5 bg-black/5 dark:bg-white/5 flex justify-between items-center shrink-0 backdrop-blur-md">
                        <h3 className="font-black text-xl tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500"><ShieldCheck className="w-5 h-5" /></div>
                            Event Log
                        </h3>
                        <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 shadow-inner">
                            {elapsed}s Elapsed
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4 custom-scrollbar relative">
                        {events.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                                <Activity className="w-12 h-12" />
                                <p className="text-sm font-bold tracking-wide uppercase">Awaiting telemetry.<br/>Initialize sequence.</p>
                            </div>
                        )}
                        <AnimatePresence>
                            {events.map((e) => (
                                <motion.div 
                                    key={e.id} 
                                    initial={{ opacity: 0, scale: 0.95, y: -20 }} 
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className={`text-sm p-4 rounded-2xl border flex items-center gap-4 backdrop-blur-sm ${
                                        e.type === 'tap' ? 'border-blue-500/30 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 
                                        e.type === 'warn' ? 'border-amber-500/30 bg-amber-500/10' : 
                                        'border-slate-500/20 bg-slate-500/5'
                                    }`}
                                >
                                    <div className={`px-2 py-1 rounded font-mono text-xs font-bold ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-black/60'}`}>
                                        {String(e.time).padStart(3, '0')}s
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{e.msg}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

// ============================== TEXT & GUIDE MODULES ==============================
const TheoryLibrary = ({ title, description, sections, isDark }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8">
        <div className="text-center space-y-6 mb-16 mt-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-br from-blue-600 to-purple-600 text-transparent bg-clip-text drop-shadow-sm">{title}</h2>
            <p className="opacity-60 max-w-xl mx-auto text-lg leading-relaxed">{description}</p>
        </div>
        <div className="space-y-8">
            {sections.map((sec, idx) => (
                <Card key={sec.id} isDark={isDark} hover>
                    <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <span className="font-black text-xl text-blue-500">{idx + 1}</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black mb-3 tracking-tight">{sec.title}</h3>
                            <p className="opacity-70 leading-relaxed text-lg">{sec.content}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    </motion.div>
);

const GuideModule = ({ isDark }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12">
        <div className="text-center space-y-6 mb-16 mt-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/30 transform rotate-3">
                <HelpCircle className="w-10 h-10 text-white -rotate-3" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Operating Procedures</h2>
        </div>

        <div className="space-y-8">
            {[
                { step: '1', title: 'Parameter Config', desc: 'Set target voltage (120V nom), deadband (±2V), and time delay (30s).', icon: Settings },
                { step: '2', title: 'Initialize & Disturb', desc: 'Start simulation. Inject network disturbances to test the regulator\'s response logic.', icon: Zap },
                { step: '3', title: 'Observe Chronology', desc: 'Monitor the delay timer. It only progresses while voltage is persistently outside the deadband.', icon: Clock },
                { step: '4', title: 'Verify ANSI Compliance', desc: 'Ensure the system recovers without breaching Range A (114V - 126V) boundaries.', icon: ShieldCheck },
            ].map((item, idx) => (
                <Card key={item.step} isDark={isDark} hover className="group">
                    <div className="flex items-start gap-6">
                        <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <item.icon className="w-6 h-6 text-blue-500"/>
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-blue-500 mb-1">Phase 0{item.step}</div>
                            <h4 className="font-black text-2xl mb-2 tracking-tight">{item.title}</h4>
                            <p className="text-lg opacity-70 leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    </motion.div>
);

// ============================== QUIZ MODULE ==============================
const QuizModule = ({ isDark }) => {
    const [level, setLevel] = useState('easy');
    const [cur, setCur] = useState(0);
    const [score, setScore] = useState(0);
    const [sel, setSel] = useState(null);
    const [fin, setFin] = useState(false);
    
    const qs = QUIZ_DATA[level]; 
    const q = qs[cur];
    
    const pick = (i) => {
        if (sel !== null) return;
        setSel(i);
        if (i === q.ans) setScore(p => p + 1);
        setTimeout(() => {
            if (cur + 1 >= qs.length) setFin(true);
            else { setCur(p => p + 1); setSel(null); }
        }, 3000);
    };
    
    const rst = () => { setCur(0); setScore(0); setSel(null); setFin(false); };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-4 lg:p-12 space-y-12 min-h-[85vh] flex flex-col justify-center">
            <div className="text-center space-y-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-purple-500/30">
                    <Award className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Certification Test</h2>
            </div>

            <div className={`flex p-1.5 rounded-2xl border mx-auto max-w-md w-full backdrop-blur-md shadow-xl ${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                {['easy', 'medium', 'expert'].map(l => (
                    <button key={l} onClick={() => { setLevel(l); rst(); }} 
                        className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                            level === l 
                                ? (l === 'easy' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg' : l === 'medium' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg' : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg') 
                                : 'opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}>
                        {l}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {fin ? (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="flex justify-center">
                        <Card isDark={isDark} className="text-center p-12 max-w-lg w-full overflow-visible relative">
                            {/* Decorative Confetti Background Element */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/30 blur-3xl rounded-full"></div>
                            
                            <div className="text-8xl mb-8 drop-shadow-2xl relative z-10">{score >= qs.length-1 ? '🏆' : score >= qs.length/2 ? '👍' : '📚'}</div>
                            <h3 className="text-3xl font-black mb-3 tracking-tight">Evaluation Complete</h3>
                            <div className="text-6xl font-black my-8 bg-gradient-to-br from-purple-500 to-pink-600 text-transparent bg-clip-text">
                                {score}<span className="text-3xl opacity-40 text-slate-500">/{qs.length}</span>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={rst} className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_20px_-5px_rgba(168,85,247,0.5)] transition-all">
                                Restart Sequence
                            </motion.button>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div key={cur} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                        <Card isDark={isDark} noPadding className="overflow-hidden">
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800">
                                <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-600" initial={{ width: `${(cur/qs.length)*100}%` }} animate={{ width: `${((cur+1)/qs.length)*100}%` }} />
                            </div>
                            
                            <div className="p-8 lg:p-12">
                                <div className="flex justify-between items-center mb-10">
                                    <span className="text-xs font-black px-4 py-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400 uppercase tracking-widest border border-purple-500/20">
                                        Query {cur + 1} // {qs.length}
                                    </span>
                                    <span className="text-sm font-black opacity-50 uppercase tracking-widest">Score {score}</span>
                                </div>
                                
                                <h3 className="text-2xl md:text-3xl font-black mb-10 leading-tight tracking-tight">{q.q}</h3>
                                
                                <div className="space-y-4">
                                    {q.opts.map((o, i) => {
                                        const isCorrect = i === q.ans;
                                        const isSelected = sel === i;
                                        const showResult = sel !== null;
                                        
                                        let btnClass = `w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group relative overflow-hidden `;
                                        
                                        if (!showResult) {
                                            btnClass += isDark ? 'border-white/5 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/10' : 'border-slate-200 bg-slate-50 hover:border-purple-500/50 hover:bg-purple-50';
                                        } else {
                                            if (isCorrect) btnClass += 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
                                            else if (isSelected) btnClass += 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400';
                                            else btnClass += 'border-slate-200 dark:border-slate-800 opacity-30';
                                        }

                                        return (
                                            <button key={i} onClick={() => pick(i)} disabled={showResult} className={btnClass}>
                                                <div className="flex items-center gap-5 relative z-10">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition-colors ${showResult && isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : showResult && isSelected ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : isDark ? 'bg-white/10 text-white/80 group-hover:bg-purple-500/20 group-hover:text-purple-400' : 'bg-black/5 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-600'}`}>
                                                        {String.fromCharCode(65 + i)}
                                                    </div>
                                                    <span className="font-bold text-lg leading-snug">{o}</span>
                                                </div>
                                                {!showResult && <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 text-purple-500 relative z-10"/>}
                                                {showResult && isCorrect && <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-md relative z-10"/>}
                                            </button>
                                        );
                                    })}
                                </div>

                                <AnimatePresence>
                                    {sel !== null && (
                                        <motion.div initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} className="mt-8 overflow-hidden">
                                            <div className={`p-6 lg:p-8 rounded-2xl flex gap-6 backdrop-blur-md border ${sel === q.ans ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)]' : 'bg-red-500/10 border-red-500/30 shadow-[0_10px_30px_-10px_rgba(239,68,68,0.3)]'}`}>
                                                <div className="shrink-0">
                                                    {sel === q.ans ? <CheckCircle2 className="w-10 h-10 text-emerald-500"/> : <AlertTriangle className="w-10 h-10 text-red-500"/>}
                                                </div>
                                                <div>
                                                    <strong className={`block mb-2 text-xl font-black tracking-tight ${sel === q.ans ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {sel === q.ans ? 'Analysis Verified' : 'Correction Required'}
                                                    </strong>
                                                    <p className="text-lg opacity-90 leading-relaxed font-medium">{q.why}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ============================== MAIN ENTRY ==============================
export default function VoltageRegulator() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    
    useEffect(() => { document.title = "VoltReg Pro | Advanced Simulation"; }, []);

    const copyShareLink = () => { 
        navigator.clipboard.writeText(window.location.href); 
        // Could implement a custom toast here
    };
    
    const tabs = [
        { id: 'theory', label: 'Theory', icon: Book },
        { id: 'simulator', label: 'Simulation', icon: MonitorPlay },
        { id: 'guide', label: 'Guide', icon: GraduationCap },
        { id: 'quiz', label: 'Exam', icon: Award }
    ];

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-500 overflow-hidden relative ${isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            
            {/* World-Class Animated Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] mix-blend-screen opacity-50 ${isDark ? 'bg-indigo-900/40' : 'bg-blue-300/40'}`}></div>
                <div className={`absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full blur-[150px] mix-blend-screen opacity-40 ${isDark ? 'bg-emerald-900/30' : 'bg-teal-200/50'}`}></div>
                <div className={`absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] rounded-full blur-[100px] mix-blend-screen opacity-30 ${isDark ? 'bg-purple-900/30' : 'bg-purple-300/30'}`}></div>
                {/* Global Noise Grain */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            </div>

            {/* Top Navigation */}
            <header className={`h-20 shrink-0 flex items-center justify-between px-6 md:px-10 z-20 border-b relative backdrop-blur-2xl ${isDark ? 'border-white/5 bg-slate-950/50' : 'border-slate-200/50 bg-white/50'}`}>
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-80 transition-opacity rounded-xl"></div>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl text-white relative z-10 border border-white/20">
                            <Zap className="w-6 h-6"/>
                        </div>
                    </div>
                    <div>
                        <h1 className="font-black tracking-tighter text-2xl leading-none">
                            Volt<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Reg</span>
                        </h1>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Pro Edition</span>
                    </div>
                </div>
                
                <div className={`hidden md:flex p-1.5 rounded-2xl border relative z-10 ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-100/50 border-slate-200/80 shadow-inner'}`}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} 
                            className={`relative flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-colors z-10 ${
                                activeTab === t.id ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}>
                            {activeTab === t.id && (
                                <motion.div layoutId="nav-pill" className={`absolute inset-0 rounded-xl shadow-md ${isDark ? 'bg-white/10 border border-white/5' : 'bg-white border border-slate-200/50'}`} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                            )}
                            <t.icon className="w-4 h-4 relative z-10"/>
                            <span className="relative z-10">{t.label}</span>
                        </button>
                    ))}
                </div>
                
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={copyShareLink} className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`} title="Share Layout">
                    <Share2 className="w-4 h-4 text-blue-500"/> <span className="hidden md:inline">Share</span>
                </motion.button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative z-10">
                <AnimatePresence mode="wait">
                    {activeTab === 'theory' && <motion.div key="theory" className="h-full overflow-y-auto custom-scrollbar" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}><TheoryLibrary title="Theoretical Framework" description="Deep dive into the operational mechanics, standards, and advanced logic governing modern On-Load Tap Changers." sections={VOLTAGE_REGULATOR_THEORY_CONTENT} isDark={isDark}/></motion.div>}
                    {activeTab === 'simulator' && <motion.div key="simulator" className="h-full overflow-y-auto custom-scrollbar" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}><SimulatorModule isDark={isDark}/></motion.div>}
                    {activeTab === 'guide' && <motion.div key="guide" className="h-full overflow-y-auto custom-scrollbar" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}><GuideModule isDark={isDark}/></motion.div>}
                    {activeTab === 'quiz' && <motion.div key="quiz" className="h-full overflow-y-auto custom-scrollbar" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}><QuizModule isDark={isDark}/></motion.div>}
                </AnimatePresence>
            </main>

            {/* Mobile Bottom Navigation Dock */}
            <div className={`md:hidden fixed bottom-6 left-6 right-6 h-20 rounded-3xl border shadow-2xl z-50 flex justify-around items-center px-2 backdrop-blur-xl ${isDark ? 'bg-slate-900/80 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]' : 'bg-white/80 border-slate-200/50 shadow-[0_20px_40px_rgba(0,0,0,0.1)]'}`}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className="relative flex flex-col items-center justify-center w-full h-full gap-1.5 rounded-2xl z-10">
                        {activeTab === t.id && (
                            <motion.div layoutId="mobile-nav-pill" className={`absolute inset-2 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                        )}
                        <t.icon className={`w-5 h-5 relative z-10 transition-colors ${activeTab === t.id ? 'text-blue-500' : 'opacity-40'}`}/>
                        <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${activeTab === t.id ? (isDark ? 'text-white' : 'text-slate-900') : 'opacity-40'}`}>{t.label}</span>
                    </button>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.2); border-radius: 20px; border: 2px solid transparent; background-clip: padding-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.4); }
            `}} />
        </div>
    );
}