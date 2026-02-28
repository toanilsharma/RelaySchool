import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, HelpCircle, Book, AlertTriangle, Settings, MonitorPlay, GraduationCap, Award, Zap, Activity, Timer, TrendingUp, Play, ShieldCheck , Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { useSmoothedValues } from '../hooks/useSmoothedValues';
import TheoryLibrary from '../components/TheoryLibrary';
import { MOTOR_PROTECTION_THEORY_CONTENT } from '../data/learning-modules/motor-protection';
import SEO from "../components/SEO";

const QUIZ_DATA = {
    easy: [
        { q: "ANSI 49 designates:", opts: ["Overcurrent", "Thermal overload", "Ground fault", "Differential"], ans: 1, why: "49 = Machine thermal protection. It uses a mathematical thermal replica model to track estimated winding temperature based on measured current." },
        { q: "A locked rotor typically draws:", opts: ["0.5× FLA", "1× FLA", "5-8× FLA", "20× FLA"], ans: 2, why: "A locked rotor draws starting current (5-8× FLA) continuously without the cooling benefit of rotation, causing rapid thermal damage." },
        { q: "ANSI 66 protects against:", opts: ["Overcurrent", "Excessive motor starts", "Undervoltage", "Ground fault"], ans: 1, why: "66 = Starts per hour. Each start subjects the rotor to high thermal stress. Too many starts without cooling causes cumulative rotor heating." },
        { q: "Motor service factor 1.15 means:", opts: ["15% oversize", "Can run at 115% rated continuously", "15% thermal margin", "1.15 Hz"], ans: 1, why: "SF 1.15 means the motor can operate at 115% of rated load continuously without exceeding thermal limits, per NEMA MG-1." },
        { q: "The thermal time constant τ of a large motor is typically:", opts: ["1 second", "5-30 minutes", "1 hour", "1 day"], ans: 1, why: "τ depends on motor mass and cooling. Large motors have τ of 5-30 minutes. The thermal replica uses this to calculate temperature rise." },
    ],
    medium: [
        { q: "The thermal replica equation uses:", opts: ["V²/R", "I²t model based on FLA ratio", "Power factor", "Frequency"], ans: 1, why: "θ(t) = θ_amb + (θ_max - θ_amb) × (1 - e^(-t/τ)) × (I/I_FLA)². The I² relationship models resistive heating." },
        { q: "Cold safe stall time vs hot safe stall time:", opts: ["Equal", "Cold > Hot (more thermal margin)", "Hot > Cold", "Not comparable"], ans: 1, why: "A cold motor has more thermal margin. Hot safe stall time is typically 50-60% of cold safe stall time because the winding is already at operating temperature." },
        { q: "Incomplete sequence protection (48) detects:", opts: ["CT errors", "Motor failing to accelerate within allowed time", "Cable faults", "VT errors"], ans: 1, why: "48 detects when the motor doesn't reach running speed within the starting time limit, indicating a mechanical or electrical problem." },
        { q: "Phase unbalance causes motor damage because:", opts: ["Lower output", "Negative sequence creates counter-rotating field with 2× freq rotor currents", "Higher voltage", "CT saturation"], ans: 1, why: "Unbalanced supply creates negative-sequence fields that induce 2× frequency currents in the rotor, causing rapid localized heating." },
        { q: "RTD (resistance temp detector) protection is:", opts: ["Indirect measurement", "Direct measurement of winding temperature", "Only for generators", "Voltage based"], ans: 1, why: "RTDs embedded in the stator winding provide direct temperature measurement, supplementing the thermal replica model for critical motors." },
    ],
    expert: [
        { q: "Per IEEE C37.96, the locked rotor protection (14) timer must be set:", opts: ["Equal to safe stall time", "Below safe stall time with margin", "Above safe stall time", "To infinity"], ans: 1, why: "The relay must trip BEFORE the motor reaches its thermal limit. The trip time must be set below the safe stall time with adequate margin." },
        { q: "Slip-dependent overcurrent element advantage:", opts: ["Simpler math", "Tracks motor speed curve for optimized protection during start", "No CTs needed", "Voltage based"], ans: 1, why: "Slip-dependent OC follows the motor starting current curve precisely, allowing longer starts without nuisance tripping while still protecting against stall." },
        { q: "Motor differential (87M) is applied when:", opts: ["Always", "Motor > 1500 HP with 6 leads accessible", "Only for LV motors", "For variable speed drives"], ans: 1, why: "87M requires access to both ends of each winding (6 leads). It's typically applied to motors >1500 HP where individual CT sets can be installed." },
        { q: "The equivalent time on cooldown for thermal replica is:", opts: ["Same as heating", "Longer, because τ_cooling > τ_heating (no I²R)", "Shorter", "Zero"], ans: 1, why: "Motor cooling is slower than heating because heat is only dissipated by convection/conduction, not added by I²R. The cooling τ is 2-3× the heating τ." },
        { q: "Reacceleration protection during bus transfer must consider:", opts: ["Only voltage", "Motor contribution to bus fault current during reacceleration", "Frequency only", "Cable length"], ans: 1, why: "During reacceleration, the motor draws starting-level current. If multiple motors start simultaneously, the combined inrush may exceed the bus capacity." },
    ],
};

// ============================== THERMAL CANVAS ==============================
const ThermalCanvas = ({ isDark, thermalPct, currentMult, speed, elapsed, tripped }: {isDark:boolean;thermalPct:number;currentMult:number;speed:number;elapsed:number;tripped:boolean}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothed = useSmoothedValues({ thermalPct, currentMult, speed });

    useEffect(() => {
        const cvs = canvasRef.current;
        if(!cvs) return;
        const ctx = cvs.getContext('2d');
        if(!ctx) return;
        const w = cvs.width = cvs.offsetWidth * 2;
        const h = cvs.height = cvs.offsetHeight * 2;
        ctx.scale(2,2);
        const cw = w/2, ch = h/2;

        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0,0,cw,ch);

        // Thermal bar (vertical)
        const barX = 30, barW = 40, barH = ch - 50, barY = 25;
        ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.fillRect(barX, barY, barW, barH);

        // Fill
        const fillH = barH * (smoothed.thermalPct / 100);
        const gradient = ctx.createLinearGradient(0, barY + barH - fillH, 0, barY + barH);
        gradient.addColorStop(0, smoothed.thermalPct > 100 ? '#ef4444' : smoothed.thermalPct > 80 ? '#f59e0b' : '#22c55e');
        gradient.addColorStop(1, smoothed.thermalPct > 100 ? '#dc2626' : smoothed.thermalPct > 80 ? '#d97706' : '#16a34a');
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY + barH - fillH, barW, Math.max(0, fillH));

        // Trip line
        const tripY = barY + barH * 0.05;
        ctx.beginPath();
        ctx.moveTo(barX - 5, tripY);
        ctx.lineTo(barX + barW + 20, tripY);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4,3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText('TRIP 100%', barX + barW + 5, tripY + 3);

        // Alarm line
        const alarmY = barY + barH * 0.2;
        ctx.beginPath();
        ctx.moveTo(barX - 5, alarmY);
        ctx.lineTo(barX + barW + 20, alarmY);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.setLineDash([3,3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText('ALARM 80%', barX + barW + 5, alarmY + 3);

        // Percentage label
        ctx.fillStyle = smoothed.thermalPct > 100 ? '#ef4444' : smoothed.thermalPct > 80 ? '#f59e0b' : '#22c55e';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText(`${smoothed.thermalPct.toFixed(0)}%`, barX + 2, barY + barH + 18);

        // Right side: Current and Speed gauges
        const gx = cw * 0.5;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText('THERMAL REPLICA', barX, 14);

        // Current indicator
        ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('Current', gx, 40);
        ctx.fillStyle = smoothed.currentMult > 1.15 ? '#ef4444' : '#22c55e';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(`${smoothed.currentMult.toFixed(1)}× FLA`, gx, 65);

        // Speed
        ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('Speed', gx, 100);
        ctx.fillStyle = smoothed.speed < 10 && smoothed.currentMult > 3 ? '#ef4444' : '#3b82f6';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(`${smoothed.speed.toFixed(0)}%`, gx, 125);

        // Time
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`Elapsed: ${elapsed.toFixed(1)}s`, gx, 160);

        // Starts remaining indicator
        ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('Thermal State', gx, 200);
        const stateColor = thermalPct > 100 ? '#ef4444' : thermalPct > 80 ? '#f59e0b' : thermalPct > 50 ? '#3b82f6' : '#22c55e';
        const stateLabel = thermalPct > 100 ? 'OVERLOAD TRIP' : thermalPct > 80 ? 'HOT — ALARM' : thermalPct > 50 ? 'WARM' : 'COLD';
        ctx.fillStyle = stateColor;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(stateLabel, gx, 222);

        if (tripped) {
            ctx.fillStyle = 'rgba(239,68,68,0.15)';
            ctx.fillRect(0,0,cw,ch);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.fillText('🔴 49 TRIP', gx, ch - 20);
        }
    }, [isDark, smoothed, elapsed, tripped, thermalPct]);
    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{height:300, border:isDark?'1px solid rgb(30,41,59)':'1px solid rgb(226,232,240)'}} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [thermalPct, setThermalPct] = useState(15);
    const [currentMult, setCurrentMult] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [running, setRunning] = useState(false);
    const [locked, setLocked] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [tripped, setTripped] = useState(false);
    const [events, setEvents] = useState<{time:number;msg:string;type:string}[]>([]);
    const [startsLeft, setStartsLeft] = useState(3);
    const timerRef = useRef<any>(null);

    const startMotor = () => {
        if(startsLeft <= 0) { setEvents(prev => [{time:elapsed,msg:'🔒 66 LOCKOUT — No starts remaining. Wait for cooldown.',type:'lockout'},...prev]); return; }
        setRunning(true); setLocked(false); setElapsed(0); setTripped(false);
        setCurrentMult(6.5); setSpeed(0);
        setStartsLeft(p => p - 1);
        setEvents([{time:0,msg:`⚡ Motor START initiated — Drawing 6.5× FLA (starts remaining: ${startsLeft-1})`,type:'info'}]);
    };

    const lockRotor = () => {
        if(!running) return;
        setLocked(true);
        setSpeed(0);
        setCurrentMult(6.5);
        setEvents(prev => [{time:elapsed,msg:'🔴 LOCKED ROTOR — Speed = 0%, current = 6.5× FLA, no cooling!',type:'fault'},...prev]);
    };

    // Main Thermal and Kinematic Loop
    useEffect(() => {
        // Run continuous loop to ensure cooling happens even when stopped or tripped
        timerRef.current = setInterval(() => {
            setElapsed(p => running ? p + 0.2 : p);
            
            // Speed and Current Dynamics (Kinematics)
            if (running && !tripped) {
                if (!locked) {
                    setSpeed(p => Math.min(100, p + 4));
                    setCurrentMult(p => Math.max(1.0, p - 0.22));
                } else {
                    setSpeed(0);
                    setCurrentMult(6.5);
                }
            } else {
                setSpeed(p => Math.max(0, p - 5)); // Coast down
                setCurrentMult(0);
            }

            // IEEE C37.96 Thermal Replica (Exponential heating/cooling)
            setThermalPct(p => {
                let I_pu = (!running || tripped) ? 0 : currentMult;
                
                // NEMA typically uses 1.15 SF. Assuming trip threshold = 1.05x FLA for 100% thermal capacity limit.
                const target = Math.pow(I_pu / 1.05, 2) * 100;
                const isHeating = target > p;
                
                // Typical motor constants: Tau_heating = 400s (allows ~10s safe stall cold at 6x FLA)
                // Tau_cooling = 1200s (3x longer to cool down when stopped)
                // When running at full speed without overload, cooling is aided by shaft fan (tau_running_cooling = 600s)
                const tau = isHeating ? 400 : (speed > 50 ? 600 : 1200);
                
                const dt = 0.2; // 200ms step
                const p_new = target + (p - target) * Math.exp(-dt / tau);
                
                // Prevent negative temperature and clamp at 120%
                return Math.max(0, Math.min(120, p_new));
            });
        }, 200);
        
        return () => { if(timerRef.current) clearInterval(timerRef.current); };
    }, [running, locked, tripped, currentMult, speed]);

    useEffect(() => {
        if(!running) return;
        if(speed >= 100 && !locked) {
            // Only add event once
            if(!events.some(e => e.msg.includes('at full speed'))) {
                setEvents(prev => [{time:elapsed,msg:'✅ Motor at full speed — Current = 1.0× FLA',type:'success'},...prev]);
            }
        }
        if(thermalPct >= 100 && !tripped) {
            setTripped(true); setRunning(false);
            setEvents(prev => [{time:elapsed,msg:`🔴 49 THERMAL TRIP — Temperature ${thermalPct.toFixed(0)}% ≥ 100%. Motor disconnected.`,type:'trip'},...prev]);
        }
        if(thermalPct >= 80 && thermalPct < 100 && !tripped) {
            // alarm only once (check events)
        }
    }, [speed, thermalPct, running, locked, tripped, elapsed]);

    const reset = () => {
        if(timerRef.current) clearInterval(timerRef.current);
        setRunning(false); setLocked(false); setElapsed(0); setTripped(false);
        setThermalPct(15); setCurrentMult(0); setSpeed(0);
        setEvents([]); setStartsLeft(3);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4"><Settings className="w-5 h-5 text-blue-500 inline mr-2"/>Motor Controls</h3>
                <div className="flex flex-wrap gap-3">
                    <button onClick={startMotor} disabled={running||tripped||startsLeft<=0} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2"><Play className="w-4 h-4"/>Start Motor ({startsLeft} starts left)</button>
                    <button onClick={lockRotor} disabled={!running||locked||tripped} className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>Lock Rotor</button>
                    <button onClick={reset} className={`px-6 py-2.5 rounded-xl font-bold text-sm ${isDark?'bg-slate-800 text-white':'bg-slate-200'}`}><RotateCcw className="w-4 h-4 inline mr-1"/>Reset</button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`rounded-2xl border p-4 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3 text-sm"><TrendingUp className="w-4 h-4 text-red-500 inline mr-2"/>Thermal Replica Model</h3>
                    <ThermalCanvas isDark={isDark} thermalPct={thermalPct} currentMult={currentMult} speed={speed} elapsed={elapsed} tripped={tripped}/>
                </div>
                <div className="space-y-4">
                    <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-3"><Activity className="w-4 h-4 text-blue-500 inline mr-2"/>Motor Status</h3>
                        {[
                            {l:'Current',v:`${currentMult.toFixed(1)}× FLA`,c:currentMult>6?'text-red-500':currentMult>1.15?'text-amber-500':'text-emerald-500'},
                            {l:'Speed',v:`${speed.toFixed(0)}%`,c:speed<50&&running?'text-amber-500':'text-emerald-500'},
                            {l:'Thermal Used',v:`${thermalPct.toFixed(0)}%`,c:thermalPct>100?'text-red-500':thermalPct>80?'text-amber-500':'text-emerald-500'},
                            {l:'State',v:tripped?'TRIPPED':locked?'LOCKED ROTOR':running?(speed>=100?'RUNNING':'STARTING'):'STOPPED',c:tripped?'text-red-500':locked?'text-red-500':'text-emerald-500'},
                            {l:'Starts Remaining',v:`${startsLeft}/3`,c:startsLeft===0?'text-red-500':''},
                        ].map(r => (<div key={r.l} className="flex justify-between text-sm py-0.5"><span className="opacity-60">{r.l}</span><span className={`font-mono font-bold ${r.c}`}>{r.v}</span></div>))}
                    </div>
                    <div className={`rounded-2xl border p-5 text-center ${tripped?'bg-red-500/10 border-red-500/30':locked?'bg-amber-500/10 border-amber-500/30':isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                        {tripped && <div className="text-red-500 font-black text-xl"><AlertTriangle className="w-5 h-5 inline mr-2"/>49 THERMAL TRIP</div>}
                        {!tripped && locked && <div className="text-amber-500 font-bold animate-pulse">⚠️ LOCKED ROTOR — Heating rapidly!</div>}
                        {!tripped && !locked && running && speed>=100 && <div className="text-emerald-500 font-bold">✅ Running — Normal Operation</div>}
                        {!tripped && !locked && running && speed<100 && <div className="text-blue-500 font-bold animate-pulse">⏳ Starting...</div>}
                        {!running && !tripped && <div className="opacity-40 font-bold">Motor stopped</div>}
                    </div>
                </div>
            </div>
            <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3"><ShieldCheck className="w-4 h-4 text-blue-500 inline mr-2"/>Event Log</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {events.length===0 && <p className="text-sm opacity-40 italic">Start the motor to begin simulation.</p>}
                    <AnimatePresence>
                        {events.map((e,i) => (
                            <motion.div 
                                key={e.msg + i}
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 4 }}
                                className={`text-xs p-2.5 rounded-lg border ${e.type==='trip'?'border-red-500/30 bg-red-500/10':e.type==='fault'?'border-red-500/20 bg-red-500/5':e.type==='success'?'border-emerald-500/20 bg-emerald-500/5':e.type==='lockout'?'border-red-500/30 bg-red-500/10':'border-blue-500/20 bg-blue-500/5'}`}
                            >
                                <span className="font-mono opacity-60">[{e.time.toFixed(1)}s]</span> <span className="font-bold">{e.msg}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500"/></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">Motor Protection Simulator (49/50/66)</p></div></div>
        {[
            {s:'1',t:'Start Motor',d:'Click "Start Motor" to begin the starting sequence. Watch the current start at 6.5× FLA (starting current) and decay to 1.0× FLA as the motor accelerates to full speed. The thermal replica tracks the temperature rise.'},
            {s:'2',t:'Lock Rotor',d:'During starting, click "Lock Rotor" to simulate a mechanical jam. The motor stays at 0% speed while drawing 6.5× FLA. Temperature rises rapidly — watch the thermal bar fill to 100% and trip.'},
            {s:'3',t:'Starts-per-Hour (66)',d:'You have 3 starts available. Each start consumes one. If you use all 3, the 66 element locks out further starts until you reset (simulating cooldown requirement).'},
            {s:'4',t:'Watch Thermal Replica',d:'The thermal bar shows the estimated temperature as a percentage of trip threshold. Green (cold) → Amber (hot alarm at 80%) → Red (trip at 100%). This models the IEEE C37.96 thermal replica.'},
        ].map(i => (
            <div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div>
                <div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div>
            </div>
        ))}
        <div className={`p-5 rounded-xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-2 text-amber-500"><AlertTriangle className="w-4 h-4 inline mr-1"/>Standards</h4>
            <p className="text-sm opacity-80">Thermal replica per <strong>IEEE C37.96</strong> (AC Motor Protection). Motor ratings per <strong>NEMA MG-1</strong> and <strong>IEC 60034</strong>.</p>
        </div>
    </div>
);

// ============================== QUIZ ==============================
const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level,setLevel]=useState<'easy'|'medium'|'expert'>('easy');
    const [cur,setCur]=useState(0);const [score,setScore]=useState(0);
    const [sel,setSel]=useState<number|null>(null);const [fin,setFin]=useState(false);
    const qs=QUIZ_DATA[level];const q=qs[cur];
    const pick=(i:number)=>{if(sel!==null)return;setSel(i);if(i===q.ans)setScore(p=>p+1);setTimeout(()=>{if(cur+1>=qs.length)setFin(true);else{setCur(p=>p+1);setSel(null);}},2500);};
    const rst=()=>{setCur(0);setScore(0);setSel(null);setFin(false);};
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500"/></div><div><h2 className="text-2xl font-black">Quiz</h2></div></div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark?'border-slate-800':'border-slate-200'}`}>{(['easy','medium','expert'] as const).map(l=>(<button key={l} onClick={()=>{setLevel(l);rst();}} className={`flex-1 py-3 text-sm font-bold uppercase ${level===l?(l==='easy'?'bg-emerald-600 text-white':l==='medium'?'bg-amber-600 text-white':'bg-red-600 text-white'):isDark?'bg-slate-900 text-slate-400':'bg-slate-50 text-slate-600'}`}>{l}</button>))}</div>
            {fin?(<div className={`text-center p-8 rounded-2xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><div className="text-5xl mb-4">{score>=4?'🏆':'📚'}</div><div className="text-3xl font-black mb-2">{score}/{qs.length}</div><button onClick={rst} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button></div>):(
                <div className={`p-6 rounded-2xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <div className="flex justify-between mb-4"><span className="text-xs opacity-40">Q{cur+1}/{qs.length}</span><span className="text-xs text-emerald-500">Score: {score}</span></div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">{q.opts.map((o,i)=>(<button key={i} onClick={()=>pick(i)} className={`w-full text-left p-4 rounded-xl border text-sm ${sel===null?isDark?'border-slate-700 hover:border-blue-500':'border-slate-200 hover:border-blue-500':i===q.ans?'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold':sel===i?'border-red-500 bg-red-500/10 text-red-500':'opacity-40'}`}><span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{o}</button>))}</div>
                    {sel!==null&&<div className={`mt-4 p-4 rounded-xl text-sm ${sel===q.ans?'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400':'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'}`}><strong>{sel===q.ans?'✅ Correct!':'❌ Incorrect.'}</strong> {q.why}</div>}
                </div>
            )}
        </div>
    );
};

// ============================== MAIN ==============================
export default function MotorProtection() {
    const [activeTab,setActiveTab]=useState('simulator');
    const isDark=useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };
    const tabs=[{id:'theory',label:'Reference',icon:<Book className="w-4 h-4"/>},{id:'simulator',label:'Simulator',icon:<MonitorPlay className="w-4 h-4"/>},{id:'guide',label:'Guide',icon:<GraduationCap className="w-4 h-4"/>},{id:'quiz',label:'Quiz',icon:<Award className="w-4 h-4"/>}];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark?'bg-slate-950 text-slate-200':'bg-slate-50 text-slate-800'}`}>
            <SEO title="Motor Protection Simulator" description="Interactive motor protection with thermal replica model, locked rotor detection, starts-per-hour limiting per IEEE C37.96." url="/motor-protection"/>
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-orange-600 to-red-600 p-2 rounded-lg text-white shadow-lg shadow-orange-500/20"><Zap className="w-5 h-5"/></div><div><h1 className={`font-black text-lg ${isDark?'text-white':'text-slate-900'}`}>Motor<span className="text-orange-500">Guard</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-orange-500/80">✅ IEEE C37.96</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark?'bg-slate-950 border-slate-800':'bg-slate-100 border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab===t.id?(isDark?'bg-slate-800 text-orange-400':'bg-white text-orange-600'):'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div><button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab===t.id?(isDark?'text-orange-400':'text-orange-600'):'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab==='theory'&&<TheoryLibrary title="Motor Protection Handbook" description="Motor protection theory covering thermal models, locked rotor, starts-per-hour, phase unbalance, and IEEE C37.96 compliance." sections={MOTOR_PROTECTION_THEORY_CONTENT}/>}
                <div className={activeTab==='simulator'?'block h-full overflow-y-auto':'hidden'}><SimulatorModule isDark={isDark}/></div>
                {activeTab==='guide'&&<div className="h-full overflow-y-auto"><GuideModule isDark={isDark}/></div>}
                {activeTab==='quiz'&&<div className="h-full overflow-y-auto"><QuizModule isDark={isDark}/></div>}
            </div>
        </div>
    );
}
