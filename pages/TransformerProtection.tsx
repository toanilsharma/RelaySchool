import React, { useState, useEffect, useRef } from 'react';
import {
    RotateCcw, AlertCircle, CheckCircle2, Activity, Zap,
    HelpCircle, Book, AlertTriangle, Settings, MonitorPlay, GraduationCap,
    ShieldCheck, Award, GitMerge, Share2, ChevronRight, Scale, CheckCircle, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const useSmoothedValues = (targetValues, speed = 0.08) => {
    const [values, setValues] = useState(targetValues);
    useEffect(() => {
        let animationFrame;
        const update = () => {
            setValues(prev => {
                const next = { ...prev };
                let hasChanges = false;
                for (const key in targetValues) {
                    const diff = targetValues[key] - prev[key];
                    if (Math.abs(diff) > 0.005) {
                        next[key] = prev[key] + diff * speed;
                        hasChanges = true;
                    } else {
                        next[key] = targetValues[key];
                    }
                }
                if (hasChanges) animationFrame = requestAnimationFrame(update);
                return next;
            });
        };
        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [targetValues, speed]);
    return values;
};

// ============================== DATA ==============================
const TRANSFORMER_PROTECTION_THEORY_CONTENT = [
    { id: 'diff', title: '87T Differential Protection', content: 'The core principle of transformer protection. It compares the current entering the transformer to the current leaving it. If the difference (Id) exceeds a restraint threshold (Ir), an internal fault is detected, and the relay trips.' },
    { id: 'vector', title: 'Vector Group Compensation', content: 'Transformers often introduce a phase shift (e.g., Dyn11 shifts by -30°). The relay mathematically compensates for this shift to align the primary and secondary vectors before calculating the differential current.' },
    { id: 'inrush', title: 'Magnetizing Inrush & 2nd Harmonic', content: 'When energizing a transformer, a massive, asymmetrical inrush current occurs. This looks like a fault to the differential element. However, inrush is rich in 2nd harmonics. Relays use a 2nd harmonic ratio (typically >15%) to block the trip.' },
    { id: 'vhz', title: 'Overexcitation & 5th Harmonic', content: 'High voltage or low frequency (V/Hz) drives the transformer core into saturation, causing stray flux that severely overheats the unit. Overexcitation generates high 5th harmonics, which are used to block the 87T element from falsely tripping while a dedicated 24 (V/Hz) relay handles the condition.' }
];

const VECTOR_GROUPS = [
    { id: 'Dyn11', label: 'Dyn11', shift: -30, desc: 'Most common distribution transformer' },
    { id: 'Dyn1', label: 'Dyn1', shift: 30, desc: 'Common in some European networks' },
    { id: 'YNyn0', label: 'YNyn0', shift: 0, desc: 'Auto-transformer, no phase shift' },
    { id: 'Yd5', label: 'Yd5', shift: -150, desc: 'Used in some industrial applications' },
    { id: 'Yd11', label: 'Yd11', shift: -330, desc: 'Common in generator step-up' },
];

const QUIZ_DATA = {
    easy: [
        { q: "What ANSI code designates transformer differential protection?", opts: ["50", "51", "87T", "21"], ans: 2, why: "87 refers to differential protection, and the 'T' designates it specifically for a Transformer." },
        { q: "Magnetizing inrush current is rich in which harmonic?", opts: ["3rd", "2nd", "5th", "7th"], ans: 1, why: "Inrush current waveforms are highly asymmetrical and contain a dominant 2nd harmonic component." },
        { q: "A Dyn11 transformer introduces a phase shift of:", opts: ["0°", "-30°", "60°", "90°"], ans: 1, why: "The '11' on the clock face means the LV lags the HV by 30 degrees (-30°)." },
        { q: "The restraint current in differential protection is used to:", opts: ["Trip faster", "Prevent false tripping from CT errors", "Measure voltage", "Calculate power"], ans: 1, why: "Restraint current (Ir) desensitizes the relay during heavy through-faults to prevent false trips due to CT saturation/errors." },
        { q: "Overexcitation (V/Hz) protection uses which harmonic for blocking?", opts: ["2nd", "3rd", "5th", "7th"], ans: 2, why: "Core saturation from overexcitation generates significant 5th harmonic currents." },
    ],
    medium: [
        { q: "Modern relays perform vector group compensation using:", opts: ["External interposing CTs", "Digital software matrix", "Voltage transformers", "Resistance matching"], ans: 1, why: "Microprocessor relays mathematically correct phase shifts via internal software matrices, eliminating the need for complex external CT wiring." },
        { q: "The 2nd harmonic ratio threshold for inrush blocking is typically:", opts: ["5%", "15%", "30%", "50%"], ans: 1, why: "A typical setting is 15%. If the 2nd harmonic exceeds 15% of the fundamental, the relay assumes inrush and blocks tripping." },
        { q: "On-Load Tap Changers (OLTC) affect 87T by:", opts: ["Changing the turns ratio (CT mismatch)", "Changing the frequency", "Producing harmonics", "Reducing voltage"], ans: 0, why: "OLTCs alter the physical turns ratio, creating a mismatch in the measured currents even under normal load, which the differential slope must accommodate." },
        { q: "Per IEEE C57.12, a transformer can continuously operate at V/Hz up to:", opts: ["100%", "105%", "110%", "120%"], ans: 2, why: "Transformers are typically designed to withstand 110% V/Hz continuously at no-load." },
        { q: "The differential current (Id) is calculated as:", opts: ["I₁ + I₂", "|I₁ - I₂|", "I₁ × I₂", "I₁ / I₂"], ans: 1, why: "Id is the absolute phasor difference between the primary and secondary compensated currents." },
    ],
    expert: [
        { q: "Sympathetic inrush affects parallel transformers because:", opts: ["They share the same CT", "Core flux disturbance spreads", "Voltage collapses", "Frequency changes"], ans: 1, why: "Energizing one transformer creates a DC voltage drop across source impedance, shifting the flux in the parallel transformer and causing it to also draw inrush." },
        { q: "For a Yd5 transformer, the relay must apply a phase compensation of:", opts: ["-30°", "-150°", "+150°", "0°"], ans: 1, why: "'5' on the clock face represents 5 × 30° = 150° lag (-150°)." },
        { q: "Cross-blocking between parallel transformer 87T relays prevents:", opts: ["Overexcitation", "Sympathetic inrush maloperation", "CT saturation", "Voltage swells"], ans: 1, why: "Cross-blocking shares harmonic data between phases/relays to prevent trips during complex sympathetic inrush scenarios." },
        { q: "The 5th harmonic blocking threshold for overexcitation is typically:", opts: ["10%", "35%", "50%", "5%"], ans: 1, why: "While it varies, settings between 25% and 35% are common to securely block 87T during overexcitation." },
        { q: "During a transformer internal fault with CT saturation on one side:", opts: ["The relay speeds up", "The 87T may fail to trip (security vs dependability)", "The relay blocks", "Harmonics increase"], ans: 1, why: "Severe CT saturation reduces measured differential current and increases restraint, potentially delaying or preventing a trip." },
    ],
};

// ============================== ANIMATION VARIANTS ==============================
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ============================== UI COMPONENTS ==============================
const Card = ({ children, className = '', isDark, noPadding = false, hover = false }) => (
    <motion.div 
        variants={itemVariants}
        whileHover={hover ? { y: -4, transition: { duration: 0.2, ease: 'easeOut' } } : {}}
        className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300 ${noPadding ? '' : 'p-6 lg:p-8'} ${
        isDark 
            ? 'bg-slate-900/60 border-white/5 shadow-2xl shadow-black/40 hover:border-white/10 hover:shadow-amber-900/20' 
            : 'bg-white/70 border-slate-200/50 shadow-xl shadow-slate-200/50 hover:border-slate-300/50 hover:shadow-amber-500/10'
        } ${className}`}>
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
        <div className="relative z-10">{children}</div>
    </motion.div>
);

const Slider = ({ label, unit, min, max, step, value, onChange, color, disabled }) => {
    const colorMap = { 
        emerald: 'from-emerald-400 to-teal-500', 
        blue: 'from-blue-400 to-indigo-500', 
        amber: 'from-amber-400 to-orange-500',
        red: 'from-red-400 to-rose-500'
    };
    const progress = ((value - min) / (max - min)) * 100;

    return (
        <div className="flex flex-col gap-3 group">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">{label}</label>
                <motion.span 
                    key={value}
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-xs font-mono font-black bg-gradient-to-r ${colorMap[color]} text-white px-3 py-1.5 rounded-lg shadow-lg`}
                >
                    {value}{unit}
                </motion.span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden backdrop-blur-sm shadow-inner cursor-pointer">
                <div 
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colorMap[color]} transition-all duration-200 ease-out`}
                    style={{ width: `${progress}%` }}
                />
                <input 
                    type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
                    aria-label={label}
                />
            </div>
        </div>
    );
};

// ============================== ADVANCED PHASOR CANVAS ==============================
const PhasorCanvas = ({ isDark, smoothed, effectiveLV, vectorGroup, isTripped, isBlocked }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const phaseOffsetRef = useRef(0);
    
    useEffect(() => {
        const cvs = canvasRef.current; if (!cvs) return;
        const ctx = cvs.getContext('2d', { alpha: false }); if (!ctx) return;
        
        let width, height;

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
            // Pulse effect for background grid
            phaseOffsetRef.current += 0.015;
            const pulse = Math.sin(phaseOffsetRef.current) * 0.1 + 0.9;

            // Background Fill
            ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
            ctx.fillRect(0, 0, width, height);
            
            const cx = width / 2;
            const cy = height / 2;
            const r = Math.min(width, height) / 2 - 50;

            // Warning Overlays (Radar sweep style)
            if (isTripped) {
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, width);
                grad.addColorStop(0, isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(239, 68, 68, 0.1)');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            } else if (isBlocked) {
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, width);
                grad.addColorStop(0, isDark ? 'rgba(217, 119, 6, 0.15)' : 'rgba(245, 158, 11, 0.1)');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            }

            // --- Animated Background Radar Grid ---
            ctx.strokeStyle = isDark ? `rgba(255,255,255,${0.05 * pulse})` : `rgba(0,0,0,${0.05 * pulse})`;
            ctx.lineWidth = 1;
            
            // Concentric circles
            [1, 0.66, 0.33].forEach(scale => {
                ctx.beginPath(); 
                ctx.arc(cx, cy, r * scale, 0, Math.PI * 2); 
                ctx.stroke();
            });
            
            // Crosshairs
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(cx - r - 20, cy); ctx.lineTo(cx + r + 20, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - r - 20); ctx.lineTo(cx, cy + r + 20); ctx.stroke();
            ctx.setLineDash([]);

            // Draw Phasors
            const phaseColors = isDark ? ['#f87171', '#fbbf24', '#60a5fa'] : ['#ef4444', '#f59e0b', '#3b82f6'];
            const phaseAngles = [0, -120, 120];

            phaseAngles.forEach((baseAngle, i) => {
                // HV Phasor
                const hvAngle = ((baseAngle - 90) * Math.PI) / 180;
                const hvLen = Math.min((smoothed.hvCurrent / 10) * r, r * 1.3);
                
                ctx.strokeStyle = phaseColors[i];
                ctx.lineWidth = isTripped ? 6 : 4;
                ctx.lineCap = 'round';
                ctx.shadowBlur = isTripped ? 25 : 10;
                ctx.shadowColor = phaseColors[i];
                
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                const hx = cx + Math.cos(hvAngle) * hvLen;
                const hy = cy + Math.sin(hvAngle) * hvLen;
                ctx.lineTo(hx, hy);
                ctx.stroke();

                // HV Arrow Head
                ctx.fillStyle = isDark ? '#ffffff' : phaseColors[i];
                ctx.beginPath();
                ctx.arc(hx, hy, isTripped ? 5 : 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // Reset

                // LV Phasor (Compensated via Vector Group)
                const lvAngle = ((baseAngle + vectorGroup.shift - 90) * Math.PI) / 180;
                const lvLen = Math.min((effectiveLV / 10) * r, r * 1.3);
                
                ctx.strokeStyle = phaseColors[i];
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 8]);
                ctx.globalAlpha = 0.8;
                
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                const lx = cx + Math.cos(lvAngle) * lvLen;
                const ly = cy + Math.sin(lvAngle) * lvLen;
                ctx.lineTo(lx, ly);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1.0;

                // Labels
                if (i === 0) {
                    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
                    ctx.font = 'bold 13px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('HV Phase A', hx + Math.cos(hvAngle) * 25, hy + Math.sin(hvAngle) * 25);
                }
            });

            // Center Hub
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
            ctx.fill();
            
            // Inner Hub ring
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [isDark, smoothed, effectiveLV, vectorGroup, isTripped, isBlocked]);
    
    return (
        <div className="relative w-full h-full min-h-[350px] flex items-center justify-center rounded-b-3xl overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/10 dark:bg-white/10 text-xs font-black tracking-widest backdrop-blur-md shadow-sm border border-slate-900/5 dark:border-white/5">
                    <Activity className="w-3 h-3" />
                    VECTOR: {vectorGroup.id} ({vectorGroup.shift}°)
                </div>
            </div>
        </div>
    );
};

// ============================== SIMULATOR MODULE ==============================
const SimulatorModule = ({ isDark }) => {
    const [vectorGroup, setVectorGroup] = useState(VECTOR_GROUPS[0]);
    const [hvCurrent, setHvCurrent] = useState(1.0);
    const [lvCurrent, setLvCurrent] = useState(1.0);
    const [tapPosition, setTapPosition] = useState(0);
    const [harmonic2nd, setHarmonic2nd] = useState(0);
    const [harmonic5th, setHarmonic5th] = useState(0);
    const [events, setEvents] = useState([]);
    
    const [inrushActive, setInrushActive] = useState(false);
    const [faultActive, setFaultActive] = useState(false);
    const [shake, setShake] = useState(false);

    const slopeK1 = 0.3;
    const slopeK2 = 0.7;

    const smoothed = useSmoothedValues({ hvCurrent, tapPosition, lvCurrent, harmonic2nd, harmonic5th }, 0.12);

    // Math Engine
    const compensatedHV = smoothed.hvCurrent; 
    const tapFactor = 1 + (smoothed.tapPosition * 0.025); 
    const effectiveLV = smoothed.lvCurrent * tapFactor;

    const Id = Math.abs(compensatedHV - effectiveLV);
    const Ir = (compensatedHV + effectiveLV) / 2;

    const slopeThreshold = Ir <= 1.0 ? slopeK1 * Ir : slopeK1 * 1.0 + slopeK2 * (Ir - 1.0);
    const wouldTrip = Id > Math.max(0.2, slopeThreshold);

    const blocked2nd = smoothed.harmonic2nd > 15;
    const blocked5th = smoothed.harmonic5th > 25;
    const blocked = blocked2nd || blocked5th;
    const tripResult = wouldTrip && !blocked;

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const injectInrush = () => {
        triggerShake();
        setInrushActive(true);
        setHvCurrent(6.0); setLvCurrent(0.1);
        setHarmonic2nd(35); setHarmonic5th(5);
        setEvents(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: 'MAGNETIZING INRUSH DETECTED. High 2nd Harmonic.', type: 'warn' }, ...prev].slice(0, 15));
        setTimeout(() => { 
            setInrushActive(false); setHvCurrent(1.0); setLvCurrent(1.0); setHarmonic2nd(0); setHarmonic5th(0); 
            setEvents(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: 'Inrush subsided. System nominal.', type: 'info' }, ...prev].slice(0, 15));
        }, 3500);
    };

    const injectFault = () => {
        triggerShake();
        setFaultActive(true);
        setHvCurrent(8.0); setLvCurrent(0.5);
        setHarmonic2nd(5); setHarmonic5th(3);
        setEvents(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: 'INTERNAL FAULT DETECTED. Differential criteria met.', type: 'fault' }, ...prev].slice(0, 15));
    };

    const reset = () => {
        setFaultActive(false); setInrushActive(false);
        setHvCurrent(1.0); setLvCurrent(1.0);
        setHarmonic2nd(0); setHarmonic5th(0);
        setTapPosition(0); 
        setEvents(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: 'System reset to standby state.', type: 'info' }, ...prev].slice(0, 15));
    };

    // Styling based on state
    const isTripped = (faultActive || inrushActive) && tripResult;
    const isBlocked = (faultActive || inrushActive) && blocked;
    
    const statusColor = isTripped ? 'from-red-500 to-rose-600 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)]' 
                      : isBlocked ? 'from-amber-400 to-orange-500 text-white shadow-[0_0_40px_rgba(245,158,11,0.4)]' 
                      : (faultActive || inrushActive) ? 'from-slate-500 to-slate-600 text-white' 
                      : 'from-emerald-400 to-teal-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.2)]';

    return (
        <motion.div 
            animate={shake ? { x: [-10, 10, -8, 8, -5, 5, 0], transition: { duration: 0.5, ease: "easeInOut" } } : {}} 
            className="max-w-[90rem] mx-auto p-4 lg:p-8 space-y-8"
        >
            {/* Top Grid: Canvas & 87T Analysis */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                
                {/* Phasor Canvas */}
                <Card isDark={isDark} className="xl:col-span-2 flex flex-col min-h-[400px]" noPadding>
                    <div className="p-5 border-b border-white/5 bg-slate-100/50 dark:bg-slate-900/50 shrink-0 backdrop-blur-md flex justify-between items-center z-10 relative">
                        <h3 className="font-black text-lg tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400"><Activity className="w-5 h-5" /></div>
                            Phasor Telemetry
                        </h3>
                    </div>
                    <div className="flex-1 relative">
                        <PhasorCanvas isDark={isDark} smoothed={smoothed} effectiveLV={effectiveLV} vectorGroup={vectorGroup} isTripped={isTripped} isBlocked={isBlocked} />
                    </div>
                </Card>

                {/* 87T Differential Analysis Logic */}
                <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-6">
                    
                    {/* Status Banner (Spans full width) */}
                    <Card isDark={isDark} className={`sm:col-span-2 flex flex-col justify-center bg-gradient-to-br ${statusColor} border-none relative overflow-hidden transition-all duration-500`}>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <div className="text-xs font-black opacity-80 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> 87T Protection Node
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={isTripped ? 'trip' : isBlocked ? 'block' : 'standby'}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="text-3xl md:text-5xl font-black tracking-tighter"
                                    >
                                        {!faultActive && !inrushActive ? 'STANDBY / NOMINAL' :
                                         isTripped ? '🔴 TRIP EXECUTED' :
                                         isBlocked ? `🟡 BLOCKED (${blocked2nd ? '2nd' : '5th'} Harm)` :
                                         '🟢 STABLE'}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <ShieldAlert className={`w-16 h-16 opacity-30 drop-shadow-lg hidden sm:block ${isTripped ? 'animate-pulse' : ''}`} />
                        </div>
                    </Card>

                    {/* Telemetry Cards */}
                    <Card isDark={isDark} hover className="flex flex-col justify-center border-l-4 border-l-red-500 group">
                        <div className="text-xs font-black opacity-60 uppercase tracking-widest mb-2 flex items-center gap-2">
                            Differential <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">Id</span>
                        </div>
                        <div className="text-4xl lg:text-5xl font-black tracking-tighter text-red-500 group-hover:scale-105 transition-transform origin-left">
                            {Id.toFixed(3)}<span className="text-2xl opacity-50 ml-1">pu</span>
                        </div>
                        <div className="mt-3 text-sm opacity-60 font-medium">Trip Threshold: {Math.max(0.2, slopeThreshold).toFixed(3)} pu</div>
                    </Card>

                    <Card isDark={isDark} hover className="flex flex-col justify-center border-l-4 border-l-blue-500 group">
                        <div className="text-xs font-black opacity-60 uppercase tracking-widest mb-2 flex items-center gap-2">
                            Restraint <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">Ir</span>
                        </div>
                        <div className="text-4xl lg:text-5xl font-black tracking-tighter text-blue-500 group-hover:scale-105 transition-transform origin-left">
                            {Ir.toFixed(3)}<span className="text-2xl opacity-50 ml-1">pu</span>
                        </div>
                        <div className="mt-3 text-sm opacity-60 font-medium">Average (HV + LV) / 2</div>
                    </Card>

                    <Card isDark={isDark} hover className={`flex flex-col justify-center border-l-4 ${blocked2nd ? 'border-l-amber-500' : 'border-l-emerald-500'} group`}>
                        <div className="text-xs font-black opacity-60 uppercase tracking-widest mb-2">2nd Harmonic (Inrush)</div>
                        <div className="flex items-end gap-4">
                            <div className={`text-4xl lg:text-5xl font-black tracking-tighter group-hover:scale-105 transition-transform origin-left ${blocked2nd ? 'text-amber-500' : ''}`}>
                                {smoothed.harmonic2nd.toFixed(1)}<span className="text-2xl opacity-50 ml-1">%</span>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-md mb-2 transition-colors ${blocked2nd ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                {blocked2nd ? 'BLOCKING' : 'OK'}
                            </span>
                        </div>
                    </Card>

                    <Card isDark={isDark} hover className={`flex flex-col justify-center border-l-4 ${blocked5th ? 'border-l-amber-500' : 'border-l-emerald-500'} group`}>
                        <div className="text-xs font-black opacity-60 uppercase tracking-widest mb-2">5th Harmonic (V/Hz)</div>
                        <div className="flex items-end gap-4">
                            <div className={`text-4xl lg:text-5xl font-black tracking-tighter group-hover:scale-105 transition-transform origin-left ${blocked5th ? 'text-amber-500' : ''}`}>
                                {smoothed.harmonic5th.toFixed(1)}<span className="text-2xl opacity-50 ml-1">%</span>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-md mb-2 transition-colors ${blocked5th ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                {blocked5th ? 'BLOCKING' : 'OK'}
                            </span>
                        </div>
                    </Card>
                </div>
            </motion.div>

            {/* Bottom Grid: Controls & Logs */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-28 md:pb-0">
                
                {/* Control Matrix */}
                <Card isDark={isDark}>
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
                        <h3 className="font-black text-xl tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-500"><Settings className="w-5 h-5" /></div>
                            Control Matrix
                        </h3>
                        
                        <div className="relative">
                            <select 
                                value={vectorGroup.id} 
                                onChange={e => setVectorGroup(VECTOR_GROUPS.find(v => v.id === e.target.value) || VECTOR_GROUPS[0])}
                                aria-label="Vector Group"
                                className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                            >
                                {VECTOR_GROUPS.map(v => <option key={v.id} value={v.id}>{v.label} ({v.shift}°)</option>)}
                            </select>
                            <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 rotate-90" />
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Slider label="HV Current" unit="pu" min={0} max={10} step={0.1} value={hvCurrent} onChange={e => setHvCurrent(parseFloat(e.target.value))} color="red" disabled={faultActive || inrushActive} />
                            <Slider label="LV Current" unit="pu" min={0} max={10} step={0.1} value={lvCurrent} onChange={e => setLvCurrent(parseFloat(e.target.value))} color="blue" disabled={faultActive || inrushActive} />
                            <Slider label="Tap Pos" unit="" min={-10} max={10} step={1} value={tapPosition} onChange={e => setTapPosition(parseInt(e.target.value))} color="amber" disabled={faultActive || inrushActive} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Slider label="2nd Harmonic (Inrush)" unit="%" min={0} max={50} step={1} value={harmonic2nd} onChange={e => setHarmonic2nd(parseFloat(e.target.value))} color="amber" disabled={faultActive || inrushActive} />
                            <Slider label="5th Harmonic (V/Hz)" unit="%" min={0} max={50} step={1} value={harmonic5th} onChange={e => setHarmonic5th(parseFloat(e.target.value))} color="emerald" disabled={faultActive || inrushActive} />
                        </div>
                        
                        <div className={`h-px w-full ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></div>
                        
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">Injection Testing</div>
                            <div className="flex flex-wrap gap-4">
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={injectFault} disabled={faultActive || inrushActive} className="flex-1 md:flex-none px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/30 disabled:opacity-40 disabled:shadow-none transition-all flex items-center justify-center gap-2">
                                    <Zap className="w-4 h-4 fill-current"/> Inject Fault
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={injectInrush} disabled={faultActive || inrushActive} className="flex-1 md:flex-none px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:shadow-none transition-all flex items-center justify-center gap-2">
                                    <Activity className="w-4 h-4"/> Simulate Inrush
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={reset} className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${isDark ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-black/5 hover:bg-black/10 text-slate-900 border-black/5'}`}>
                                    <RotateCcw className="w-4 h-4" /> Reset Module
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Event Log */}
                <Card isDark={isDark} noPadding className="flex flex-col h-[500px] xl:h-auto">
                    <div className="p-5 lg:px-8 border-b border-white/5 bg-slate-100/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0 backdrop-blur-md z-10 relative">
                        <h3 className="font-black text-lg tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-slate-500/20 rounded-lg text-slate-600 dark:text-slate-400"><AlertCircle className="w-5 h-5" /></div>
                            Event Sequence Log
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 relative bg-gradient-to-b from-transparent to-black/5 dark:to-white/5">
                        {events.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                                <Activity className="w-12 h-12" />
                                <p className="text-sm font-bold tracking-wide uppercase">Awaiting transient events.<br/>Inject fault to record.</p>
                            </div>
                        )}
                        <AnimatePresence>
                            {events.map((e) => (
                                <motion.div 
                                    key={e.id} 
                                    initial={{ opacity: 0, x: 20, scale: 0.95 }} 
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className={`text-sm p-4 rounded-xl border flex items-center gap-4 backdrop-blur-sm shadow-sm ${
                                        e.type === 'fault' ? 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300' : 
                                        e.type === 'warn' ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300' : 
                                        'border-slate-500/20 bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    <div className={`px-2 py-1 rounded-md font-mono text-[11px] font-black shrink-0 ${isDark ? 'bg-black/30 text-white/70' : 'bg-black/5 text-black/60'}`}>
                                        {e.time}
                                    </div>
                                    <span className="font-bold tracking-wide leading-snug">{e.msg}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
};

// ============================== TEXT & GUIDE MODULES ==============================
const TheoryLibrary = ({ title, description, sections, isDark }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8 pb-32 md:pb-12">
        <motion.div variants={itemVariants} className="text-center space-y-6 mb-16 mt-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-br from-amber-500 to-orange-600 text-transparent bg-clip-text drop-shadow-sm">{title}</h2>
            <p className="opacity-70 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-medium">{description}</p>
        </motion.div>
        <div className="space-y-6">
            {sections.map((sec, idx) => (
                <Card key={sec.id} isDark={isDark} hover className="group">
                    <div className="flex gap-6 items-start">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform shadow-inner">
                            <span className="font-black text-2xl text-amber-600 dark:text-amber-500">{idx + 1}</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black mb-3 tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{sec.title}</h3>
                            <p className="opacity-70 leading-relaxed text-lg font-medium">{sec.content}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    </motion.div>
);

const GuideModule = ({ isDark }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12 pb-32 md:pb-12">
        <motion.div variants={itemVariants} className="text-center space-y-6 mb-16 mt-8">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-amber-500/30 transform rotate-3">
                <HelpCircle className="w-12 h-12 text-white -rotate-3" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Standard Operating Procedures</h2>
        </motion.div>

        <div className="space-y-6">
            {[
                { step: '1', title: 'Vector Group Configuration', desc: 'Select the physical transformer vector group (e.g., Dyn11). Observe how the LV phasor automatically shifts in the telemetry view to compensate mathematically.', icon: Scale },
                { step: '2', title: 'Steady-State Operation', desc: 'Adjust HV and LV load currents and tap position. Notice how the Restraint (Ir) increases while Differential (Id) remains low, keeping the protective relay STABLE.', icon: Activity },
                { step: '3', title: 'Magnetizing Inrush Simulation', desc: 'Click "Simulate Inrush". A massive current spike occurs, causing high Id. However, the presence of prominent 2nd Harmonics forces the relay logic to gracefully BLOCK.', icon: Zap },
                { step: '4', title: 'Internal Fault Injection', desc: 'Click "Inject Fault". A high Id occurs WITHOUT significant harmonics, bypassing the harmonic block and issuing an immediate, critical TRIP command.', icon: AlertTriangle },
            ].map((item, idx) => (
                <Card key={item.step} isDark={isDark} hover className="group">
                    <div className="flex items-start gap-6">
                        <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                            <item.icon className="w-8 h-8 text-amber-500"/>
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1.5">Phase 0{item.step}</div>
                            <h4 className="font-black text-2xl mb-2 tracking-tight">{item.title}</h4>
                            <p className="text-lg opacity-70 leading-relaxed font-medium">{item.desc}</p>
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
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto p-4 lg:p-12 space-y-10 min-h-[85vh] flex flex-col pb-32 md:pb-12">
            <motion.div variants={itemVariants} className="text-center space-y-6 mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-amber-500/30">
                    <Award className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Certification Exam</h2>
            </motion.div>

            <motion.div variants={itemVariants} className={`flex p-1.5 rounded-2xl border mx-auto max-w-md w-full backdrop-blur-md shadow-xl ${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
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
            </motion.div>

            <AnimatePresence mode="wait">
                {fin ? (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="flex justify-center mt-8">
                        <Card isDark={isDark} className="text-center p-12 max-w-lg w-full overflow-visible relative shadow-2xl">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full pointer-events-none"></div>
                            
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                                className="w-28 h-28 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(245,158,11,0.6)] mb-8 relative z-10"
                            >
                                {score >= qs.length-1 ? <Award className="w-14 h-14 text-white" /> : score >= qs.length/2 ? <CheckCircle className="w-14 h-14 text-white"/> : <Book className="w-14 h-14 text-white"/>}
                            </motion.div>
                            
                            <h3 className="text-3xl font-black mb-2 tracking-tight">Evaluation Complete</h3>
                            <p className="opacity-70 font-medium mb-6">Your technical proficiency score.</p>
                            
                            <div className="text-7xl font-black mb-10 bg-gradient-to-br from-amber-500 to-orange-600 text-transparent bg-clip-text inline-block drop-shadow-sm">
                                {score}<span className="text-3xl opacity-40 text-slate-500 drop-shadow-none">/{qs.length}</span>
                            </div>
                            
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={rst} className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_-10px_rgba(245,158,11,0.5)] transition-all flex justify-center items-center gap-2">
                                <RotateCcw className="w-5 h-5" /> Restart Sequence
                            </motion.button>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div key={cur} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="w-full max-w-3xl mx-auto">
                        <Card isDark={isDark} noPadding className="overflow-hidden shadow-2xl">
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800">
                                <motion.div className="h-full bg-gradient-to-r from-amber-500 to-orange-600" initial={{ width: `${(cur/qs.length)*100}%` }} animate={{ width: `${((cur+1)/qs.length)*100}%` }} transition={{ duration: 0.5, ease: "easeInOut" }} />
                            </div>
                            
                            <div className="p-8 lg:p-12">
                                <div className="flex justify-between items-center mb-10">
                                    <span className="text-xs font-black px-4 py-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 uppercase tracking-widest border border-amber-500/20">
                                        Query {cur + 1} // {qs.length}
                                    </span>
                                    <span className="text-sm font-black opacity-50 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">Score {score}</span>
                                </div>
                                
                                <h3 className="text-2xl md:text-3xl font-black mb-10 leading-tight tracking-tight">{q.q}</h3>
                                
                                <div className="space-y-4">
                                    {q.opts.map((o, i) => {
                                        const isCorrect = i === q.ans;
                                        const isSelected = sel === i;
                                        const showResult = sel !== null;
                                        
                                        let btnClass = `w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group relative overflow-hidden `;
                                        
                                        if (!showResult) {
                                            btnClass += isDark ? 'border-white/5 bg-white/5 hover:border-amber-500/50 hover:bg-amber-500/10' : 'border-slate-200 bg-slate-50 hover:border-amber-500/50 hover:bg-amber-50';
                                        } else {
                                            if (isCorrect) btnClass += 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
                                            else if (isSelected) btnClass += 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400';
                                            else btnClass += 'border-slate-200 dark:border-slate-800 opacity-30';
                                        }

                                        return (
                                            <button key={i} onClick={() => pick(i)} disabled={showResult} className={btnClass}>
                                                <div className="flex items-center gap-5 relative z-10">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition-all duration-300 ${showResult && isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : showResult && isSelected ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : isDark ? 'bg-white/10 text-white/80 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-lg' : 'bg-black/5 text-slate-600 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-lg'}`}>
                                                        {String.fromCharCode(65 + i)}
                                                    </div>
                                                    <span className="font-bold text-lg leading-snug">{o}</span>
                                                </div>
                                                {!showResult && <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 text-amber-500 relative z-10"/>}
                                                {showResult && isCorrect && <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-md relative z-10"/>}
                                            </button>
                                        );
                                    })}
                                </div>

                                <AnimatePresence>
                                    {sel !== null && (
                                        <motion.div initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="mt-8 overflow-hidden">
                                            <div className={`p-6 lg:p-8 rounded-2xl flex gap-6 backdrop-blur-md border ${sel === q.ans ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)]' : 'bg-red-500/10 border-red-500/30 shadow-[0_10px_30px_-10px_rgba(239,68,68,0.3)]'}`}>
                                                <div className="shrink-0 mt-1">
                                                    {sel === q.ans ? <CheckCircle2 className="w-8 h-8 text-emerald-500"/> : <AlertTriangle className="w-8 h-8 text-red-500"/>}
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
export default function TransformerProtection() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    
    useEffect(() => { document.title = "87T Pro | Protection Simulator"; }, []);

    const copyShareLink = () => { 
        navigator.clipboard.writeText(window.location.href); 
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
                <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] mix-blend-screen opacity-40 transition-colors duration-1000 ${isDark ? 'bg-amber-900/40' : 'bg-amber-300/40'}`}></div>
                <div className={`absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full blur-[150px] mix-blend-screen opacity-30 transition-colors duration-1000 ${isDark ? 'bg-red-900/30' : 'bg-rose-200/50'}`}></div>
                <div className={`absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] rounded-full blur-[100px] mix-blend-screen opacity-20 transition-colors duration-1000 ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-300/30'}`}></div>
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            </div>

            {/* Top Navigation */}
            <header className={`h-20 shrink-0 flex items-center justify-between px-6 md:px-10 z-20 border-b relative backdrop-blur-2xl transition-colors duration-500 ${isDark ? 'border-white/5 bg-slate-950/70' : 'border-slate-200/50 bg-white/70'}`}>
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-500 blur-lg opacity-40 group-hover:opacity-80 transition-opacity rounded-xl"></div>
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 rounded-xl text-white relative z-10 border border-white/20 shadow-lg group-hover:scale-105 transition-transform">
                            <GitMerge className="w-6 h-6"/>
                        </div>
                    </div>
                    <div>
                        <h1 className="font-black tracking-tighter text-2xl leading-none">
                            Trans<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">87T</span>
                        </h1>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Pro Edition</span>
                    </div>
                </div>
                
                <div className={`hidden md:flex p-1.5 rounded-2xl border relative z-10 transition-colors duration-500 ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100/70 border-slate-200/80 shadow-inner'}`}>
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
                    <Share2 className="w-4 h-4 text-amber-500"/> <span className="hidden md:inline">Share</span>
                </motion.button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative z-10">
                <style dangerouslySetInnerHTML={{__html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }
                `}} />
                
                <AnimatePresence mode="wait">
                    {activeTab === 'theory' && <motion.div key="theory" className="h-full overflow-y-auto custom-scrollbar" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><TheoryLibrary title="Theoretical Framework" description="Deep dive into the operational mechanics, standards, and advanced logic governing modern 87T Protection relays." sections={TRANSFORMER_PROTECTION_THEORY_CONTENT} isDark={isDark}/></motion.div>}
                    {activeTab === 'simulator' && <motion.div key="simulator" className="h-full overflow-y-auto custom-scrollbar" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}><SimulatorModule isDark={isDark}/></motion.div>}
                    {activeTab === 'guide' && <motion.div key="guide" className="h-full overflow-y-auto custom-scrollbar" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><GuideModule isDark={isDark}/></motion.div>}
                    {activeTab === 'quiz' && <motion.div key="quiz" className="h-full overflow-y-auto custom-scrollbar" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}><QuizModule isDark={isDark}/></motion.div>}
                </AnimatePresence>
            </main>

            {/* Mobile Bottom Navigation Dock */}
            <div className={`md:hidden fixed bottom-6 left-6 right-6 h-20 rounded-3xl border shadow-2xl z-50 flex justify-around items-center px-2 backdrop-blur-xl transition-colors duration-500 ${isDark ? 'bg-slate-900/85 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]' : 'bg-white/85 border-slate-200/50 shadow-[0_20px_40px_rgba(0,0,0,0.1)]'}`}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className="relative flex flex-col items-center justify-center w-full h-full gap-1.5 rounded-2xl z-10 group">
                        {activeTab === t.id && (
                            <motion.div layoutId="mobile-nav-pill" className={`absolute inset-2 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                        )}
                        <t.icon className={`w-5 h-5 relative z-10 transition-colors ${activeTab === t.id ? 'text-amber-500' : 'opacity-40 group-hover:opacity-100'}`}/>
                        <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${activeTab === t.id ? (isDark ? 'text-white' : 'text-slate-900') : 'opacity-40 group-hover:opacity-100'}`}>{t.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}