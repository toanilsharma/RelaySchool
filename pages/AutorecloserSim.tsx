import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    RotateCcw, AlertCircle, CheckCircle2, Activity, Zap, Timer,
    Book, AlertTriangle, Settings, MonitorPlay, GraduationCap,
    ShieldCheck, Lock, Power, Cpu, Radio, Hash, LineChart, BarChart
} from 'lucide-react';

// ========================= HOOKS =========================
const useThemeObserver = () => {
    const [isDark, setIsDark] = useState(true);
    // Locked to dark mode for SCADA realism, but kept hook for structure
    useEffect(() => {
        document.body.style.backgroundColor = '#020617'; 
        document.title = "GridGuard | ANSI 79 SCADA Interface";
    }, []);
    return isDark;
};

// ========================= CONSTANTS & DATA =========================
const SHOT_CONFIGS = {
    '1F': { label: '1 Fast (1-Shot)', shots: [{ type: 'FAST', delay: 50 }] },
    '1F1S': { label: '1 Fast + 1 Slow (2-Shot)', shots: [{ type: 'FAST', delay: 50 }, { type: 'SLOW', delay: 400 }] },
    '1F2S': { label: '1 Fast + 2 Slow (3-Shot)', shots: [{ type: 'FAST', delay: 50 }, { type: 'SLOW', delay: 400 }, { type: 'SLOW', delay: 400 }] },
    '2F2S': { label: '2 Fast + 2 Slow (4-Shot)', shots: [{ type: 'FAST', delay: 50 }, { type: 'FAST', delay: 50 }, { type: 'SLOW', delay: 400 }, { type: 'SLOW', delay: 400 }] },
};

const FAULT_TYPES = [
    { id: 'transient', label: 'Transient (Lightning)', color: 'text-blue-400', clearAfter: 1, desc: 'Clears after 1st trip' },
    { id: 'semi', label: 'Semi-Permanent (Tree Branch)', color: 'text-amber-400', clearAfter: 3, desc: 'Clears after 3rd trip' },
    { id: 'permanent', label: 'Permanent (Cable Fault)', color: 'text-red-500', clearAfter: 99, desc: 'Never clears → Lockout' },
];

const THEORY_DATA = [
    {
        id: 'intro',
        title: "1. Autoreclosing (ANSI 79) Principles",
        icon: <RotateCcw className="w-5 h-5 text-emerald-500" />,
        content: (
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                <p>Approximately <strong className="text-white">80% to 90% of faults on overhead distribution and transmission lines are transient</strong> in nature. These are caused by lightning strikes, wind blowing conductors together, or birds/branches temporarily bridging insulators.</p>
                <div className="p-5 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-xl shadow-inner">
                    <p className="font-bold text-emerald-400 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> The Goal</p>
                    <p>Instead of dispatching a crew to manually close a tripped breaker for a fault that no longer exists, an Autorecloser (ANSI 79) automatically opens the circuit to extinguish the arc, waits a brief moment (Dead Time), and recloses.</p>
                </div>
            </div>
        )
    },
    {
        id: 'timing',
        title: "2. The Operating Cycle",
        icon: <Timer className="w-5 h-5 text-blue-500" />,
        content: (
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                <ul className="space-y-4">
                    <li className="flex gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <Timer className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-blue-400 block mb-1">Dead Time (Open Time)</strong> 
                            The time the breaker remains open before reclosing. It must be long enough for the fault arc plasma to deionize and disperse, but short enough to minimize customer outage time. Typical fast dead time: 0.3s - 0.5s.
                        </div>
                    </li>
                    <li className="flex gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <RotateCcw className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-emerald-400 block mb-1">Reclaim Time</strong> 
                            If a reclose is successful (breaker stays closed), the relay starts a Reclaim Timer (e.g., 15-60s). Once expired, the sequence counter resets to zero. If a fault occurs <i>before</i> it expires, it proceeds to the next shot.
                        </div>
                    </li>
                    <li className="flex gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-red-400 block mb-1">Lockout (ANSI 86)</strong> 
                            If all programmed shots are exhausted and the fault is still present (Permanent fault), the recloser trips and locks open. It requires manual or SCADA intervention to reset.
                        </div>
                    </li>
                </ul>
            </div>
        )
    },
    {
        id: 'fuse',
        title: "3. Fuse Saving vs. Fuse Blowing",
        icon: <Zap className="w-5 h-5 text-amber-500" />,
        content: (
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                <p>Autoreclosers are heavily coordinated with downstream lateral fuses to optimize system reliability indices (SAIDI/SAIFI).</p>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50"></div>
                        <strong className="text-amber-400 flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4"/> Fuse Saving Scheme</strong>
                        <p className="text-xs opacity-90">The recloser uses a "Fast" curve that is faster than the fuse's minimum melting time. The recloser trips first, saving the fuse from blowing on transient faults. If the fault persists, the recloser waits on slow shots, allowing the fuse to blow and isolate the lateral.</p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
                        <strong className="text-red-400 flex items-center gap-2 mb-3"><Activity className="w-4 h-4"/> Fuse Blowing Scheme</strong>
                        <p className="text-xs opacity-90">Used in dense urban areas. The recloser is deliberately slower than the fuse. Fuses blow immediately for any fault on their branch, protecting the main feeder from experiencing momentary voltage sags (blinks) that annoy commercial customers.</p>
                    </div>
                </div>
            </div>
        )
    }
];

// ========================= UI COMPONENTS =========================
const Slider = ({ label, unit, min, max, step, value, onChange, disabled, color = "blue" }) => {
    const colorMap = {
        blue: 'accent-blue-500 bg-blue-500', emerald: 'accent-emerald-500 bg-emerald-500', 
        amber: 'accent-amber-500 bg-amber-500', purple: 'accent-purple-500 bg-purple-500'
    };
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={`mb-5 group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold uppercase opacity-70 tracking-widest text-slate-300">{label}</label>
                <div className="relative">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 shadow-inner block min-w-[60px] text-center">
                        {Number(value).toFixed(step < 1 ? 1 : 0)} <span className="opacity-50">{unit}</span>
                    </span>
                </div>
            </div>
            <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                 <div className={`absolute top-0 left-0 h-full ${colorMap[color].split(' ')[1]} opacity-50`} style={{ width: `${percentage}%` }}></div>
                 <input
                    type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled}
                    className={`absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer`}
                />
                <div className={`absolute top-1/2 -mt-2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] border-2 border-slate-900 pointer-events-none transition-transform ${disabled ? 'scale-0' : 'scale-100 group-hover:scale-125'}`} style={{ left: `calc(${percentage}% - 8px)` }}></div>
            </div>
        </div>
    );
};

// ========================= SVG THEORY GRAPHS =========================

const TCCGraph = () => (
    <div className="w-full bg-[#0a0f1c] rounded-xl border border-slate-800 p-4 shadow-inner">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-500" /> Recloser-Fuse Coordination (TCC)
        </h4>
        <svg viewBox="0 0 500 300" className="w-full h-auto max-h-[300px]">
            {/* Grid & Axes */}
            <g stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4">
                {[50, 100, 150, 200, 250].map(y => <line key={y} x1="40" y1={y} x2="480" y2={y} />)}
                {[100, 200, 300, 400].map(x => <line key={x} x1={x} y1="20" x2={x} y2="280" />)}
            </g>
            <line x1="40" y1="280" x2="480" y2="280" stroke="#475569" strokeWidth="2" />
            <line x1="40" y1="20" x2="40" y2="280" stroke="#475569" strokeWidth="2" />
            
            {/* Labels */}
            <text x="260" y="295" fill="#64748b" fontSize="10" textAnchor="middle" fontWeight="bold">Current (Amps) - Log Scale</text>
            <text x="15" y="150" fill="#64748b" fontSize="10" textAnchor="middle" transform="rotate(-90 15 150)" fontWeight="bold">Time (Seconds)</text>

            {/* Recloser Fast Curve (A) */}
            <path d="M 60 20 Q 80 200, 450 270" fill="none" stroke="#3b82f6" strokeWidth="3" filter="drop-shadow(0 0 4px rgba(59,130,246,0.5))" />
            <text x="70" y="40" fill="#3b82f6" fontSize="12" fontWeight="bold">Recloser Fast (A)</text>
            
            {/* Fuse Curve */}
            <path d="M 120 20 Q 140 180, 470 240" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 4" filter="drop-shadow(0 0 4px rgba(245,158,11,0.5))" />
            <text x="135" y="60" fill="#f59e0b" fontSize="12" fontWeight="bold">Lateral Fuse (100T)</text>

            {/* Recloser Slow Curve (C/D) */}
            <path d="M 180 20 Q 220 150, 480 210" fill="none" stroke="#ef4444" strokeWidth="3" filter="drop-shadow(0 0 4px rgba(239,68,68,0.5))" />
            <text x="195" y="80" fill="#ef4444" fontSize="12" fontWeight="bold">Recloser Slow (C/D)</text>

            {/* Analysis Box */}
            <rect x="250" y="30" width="220" height="90" rx="4" fill="#0f172a" stroke="#334155" opacity="0.9" />
            <text x="260" y="45" fill="#cbd5e1" fontSize="10" fontWeight="bold">Fuse Saving Principle:</text>
            <text x="260" y="60" fill="#94a3b8" fontSize="9">1. Fast Curve (A) clears before fuse melts.</text>
            <text x="260" y="75" fill="#94a3b8" fontSize="9">2. Recloser performs dead-time wait.</text>
            <text x="260" y="90" fill="#94a3b8" fontSize="9">3. If fault persists, shifts to Slow Curve (C).</text>
            <text x="260" y="105" fill="#94a3b8" fontSize="9">4. Fuse blows before C curve trips.</text>
        </svg>
    </div>
);

const TimelineGraph = () => (
    <div className="w-full bg-[#0a0f1c] rounded-xl border border-slate-800 p-4 shadow-inner">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-500" /> ANSI 79 Operating Sequence Timeline
        </h4>
        <svg viewBox="0 0 600 150" className="w-full h-auto">
            {/* Base line */}
            <line x1="20" y1="100" x2="580" y2="100" stroke="#334155" strokeWidth="2" />
            
            {/* Breaker State Line (Digital High/Low) */}
            <path d="M 20 40 L 100 40 L 100 100 L 250 100 L 250 40 L 350 40 L 350 100 L 500 100" fill="none" stroke="#10b981" strokeWidth="3" filter="drop-shadow(0 0 5px rgba(16,185,129,0.4))" />
            
            <text x="10" y="45" fill="#10b981" fontSize="10" fontWeight="bold">CLOSED</text>
            <text x="10" y="105" fill="#ef4444" fontSize="10" fontWeight="bold">OPEN</text>

            {/* Zones */}
            {/* Normal */}
            <rect x="20" y="110" width="60" height="8" fill="#1e293b" />
            <text x="50" y="130" fill="#64748b" fontSize="9" textAnchor="middle">Normal</text>
            
            {/* Fault & Trip */}
            <line x1="80" y1="20" x2="80" y2="110" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" />
            <text x="80" y="15" fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="bold">FAULT</text>
            <rect x="80" y="110" width="20" height="8" fill="#ef4444" opacity="0.3" />
            
            {/* Dead Time 1 */}
            <rect x="100" y="110" width="150" height="8" fill="#3b82f6" opacity="0.5" />
            <text x="175" y="130" fill="#60a5fa" fontSize="10" textAnchor="middle" fontWeight="bold">DEAD TIME 1</text>
            <text x="175" y="145" fill="#64748b" fontSize="8" textAnchor="middle">(Arc Deionization)</text>
            
            {/* Reclose & Fault again */}
            <line x1="250" y1="20" x2="250" y2="110" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" />
            <text x="250" y="15" fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold">RECLOSE</text>
            
            {/* Reclaim Time (Assume Success here for illustration) */}
            <rect x="250" y="110" width="100" height="8" fill="#10b981" opacity="0.3" />
            <text x="300" y="130" fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">RECLAIM TIME</text>
            <line x1="350" y1="20" x2="350" y2="110" stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" />
            <text x="350" y="15" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">RESET</text>
        </svg>
    </div>
);

// ========================= SVG REAL-TIME OSCILLOSCOPE =========================
const Oscilloscope = ({ state, phaseTimer, faultActive }) => {
    const canvasRef = useRef(null);
    const historyRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let frameId;
        let timeOffset = 0;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;
            const cy = height / 2;

            let amplitude = 0;
            if (state === 'IDLE' || state === 'SUCCESS' || state === 'RECLAIM') amplitude = 20; 
            else if (faultActive) amplitude = 80; 
            else if (state === 'DEAD_TIME' || state === 'LOCKOUT') amplitude = 0; 

            let currentVal = Math.sin(timeOffset * 0.15) * amplitude;
            if (faultActive) {
                currentVal += Math.sin(timeOffset * 0.45) * (amplitude * 0.15) + ((Math.random() - 0.5) * 8);
                if (phaseTimer < 0.08) currentVal += 40 * Math.exp(-timeOffset * 0.05); // DC Offset
            } else if (amplitude > 0) {
                currentVal += (Math.random() - 0.5) * 1.5;
            }

            historyRef.current.push(currentVal);
            if (historyRef.current.length > width) historyRef.current.shift();

            ctx.fillStyle = 'rgba(2, 6, 23, 0.3)'; 
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let i=1; i<4; i++) { ctx.moveTo(0, i*(height/4)); ctx.lineTo(width, i*(height/4)); }
            const gridOffset = timeOffset % 40;
            for(let i=0; i<width/40 + 1; i++) { ctx.moveTo(i*40 - gridOffset, 0); ctx.lineTo(i*40 - gridOffset, height); }
            ctx.stroke();

            // Trip Threshold Line (Visual indicator)
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.beginPath(); 
            ctx.moveTo(0, cy - 40); ctx.lineTo(width, cy - 40);
            ctx.moveTo(0, cy + 40); ctx.lineTo(width, cy + 40);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(71, 85, 105, 0.8)';
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();

            ctx.beginPath();
            const traceColor = faultActive ? '#ef4444' : amplitude === 0 ? '#475569' : '#10b981';
            ctx.strokeStyle = traceColor;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = traceColor;
            
            for (let i = 0; i < historyRef.current.length; i++) {
                const x = width - historyRef.current.length + i;
                const y = cy - historyRef.current[i];
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            timeOffset += 1.5; 
            frameId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(frameId);
    }, [state, faultActive, phaseTimer]);

    return (
        <div className="w-full h-40 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 backdrop-blur-sm">
                <Activity className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Phase A Current</span>
            </div>
            <div className="absolute top-10 left-4 z-10">
                <span className="text-[8px] text-red-500/80 font-bold uppercase">50/51 Pickup Threshold</span>
            </div>
            <canvas ref={canvasRef} width={800} height={160} className="w-full h-full" />
            <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 backdrop-blur-sm">
                <span className={`w-2 h-2 rounded-full ${faultActive ? 'bg-red-500 animate-ping' : state==='DEAD_TIME' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                <span className="text-[10px] font-mono font-bold text-slate-300">{faultActive ? 'FAULT (10kA)' : state==='DEAD_TIME'||state==='LOCKOUT' ? 'OPEN (0A)' : 'LOAD (400A)'}</span>
            </div>
        </div>
    );
};

// ========================= ANIMATED SVG SLD =========================
const AnimatedSLD = ({ breakerClosed, faultActive, state }) => {
    return (
        <div className="w-full h-48 bg-slate-900 rounded-2xl border border-slate-800 relative flex items-center justify-center p-4 shadow-inner overflow-hidden group">
            <div className="absolute top-3 left-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                <Cpu className="w-3 h-3 text-blue-400" /> HMI Single Line Diagram
            </div>
            
            <svg viewBox="0 0 400 120" className="w-full h-full max-w-2xl drop-shadow-xl mt-4">
                <g transform="translate(10, 60)">
                    <circle cx="20" cy="0" r="12" fill="none" stroke="#10b981" strokeWidth="2.5" />
                    <circle cx="32" cy="0" r="12" fill="none" stroke="#10b981" strokeWidth="2.5" />
                    <text x="26" y="28" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">SUBSTATION</text>
                </g>
                
                <line x1="54" y1="60" x2="130" y2="60" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                
                <g transform="translate(130, 60)">
                    <rect x="-10" y="-20" width="20" height="40" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                    <text x="0" y="-26" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontWeight="bold">52/79</text>
                    
                    <line x1="0" y1="-8" x2="35" y2="-8" stroke={breakerClosed ? "#10b981" : "#64748b"} strokeWidth="3" strokeLinecap="round"
                        style={{ transformOrigin: '0px -8px', transform: breakerClosed ? 'rotate(0deg)' : 'rotate(-35deg)', transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.2s' }} 
                    />
                    <circle cx="38" cy="-8" r="3" fill="#94a3b8" />
                    <circle cx="0" cy="-8" r="3" fill="#94a3b8" />
                </g>

                <line x1="168" y1="52" x2="168" y2="60" stroke="#475569" strokeWidth="3" />
                <line x1="168" y1="60" x2="360" y2="60" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                
                {breakerClosed && (
                    <path d="M 54 60 L 120 60 M 170 60 L 360 60" fill="none" stroke={faultActive ? '#ef4444' : '#10b981'} strokeWidth="2" strokeDasharray="8 8" className="animate-[slideRight_1s_linear_infinite] opacity-70" />
                )}

                <g transform="translate(250, 60)">
                    <circle cx="0" cy="0" r="3" fill="#64748b" />
                    <line x1="0" y1="0" x2="0" y2="20" stroke="#475569" strokeWidth="3" />
                    <rect x="-6" y="20" width="12" height="16" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M 0 20 C 5 25, -5 30, 0 36" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="0" y1="36" x2="0" y2="50" stroke="#475569" strokeWidth="3" />
                    <text x="0" y="65" fill="#94a3b8" fontSize="8" textAnchor="middle" fontWeight="bold">LATERAL</text>
                </g>

                <g transform="translate(360, 60)">
                    <rect x="0" y="-12" width="24" height="24" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                    <path d="M 6 0 L 12 -6 L 18 0 L 12 6 Z" fill="none" stroke="#10b981" strokeWidth="1.5" className={breakerClosed && !faultActive ? 'opacity-100' : 'opacity-30'} />
                    <text x="12" y="24" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">LOAD</text>
                </g>

                <g transform="translate(280, 60)" style={{ opacity: faultActive ? 1 : 0, transition: 'opacity 0.1s' }}>
                    <path d="M -5 -25 L 5 -5 L -2 0 L 8 20 L -8 -5 L 2 -10 Z" fill="#ef4444" filter="drop-shadow(0 0 8px #ef4444)" className="animate-pulse" />
                    <circle cx="0" cy="0" r="18" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" className="animate-[spin_4s_linear_infinite]" />
                    <circle cx="0" cy="0" r="24" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 6" className="animate-[spin_3s_linear_infinite_reverse] opacity-50" />
                </g>
            </svg>
            <style dangerouslySetInnerHTML={{__html: `@keyframes slideRight { 0% { stroke-dashoffset: 16; } 100% { stroke-dashoffset: 0; } }`}} />
        </div>
    );
};

// ========================= SIMULATOR ENGINE MODULE =========================
const SimulatorModule = () => {
    const [simState, setSimState] = useState('IDLE'); // IDLE, FAULT, DEAD_TIME, RECLAIM, SUCCESS, LOCKOUT
    const [shotConfig, setShotConfig] = useState('2F2S');
    const [faultType, setFaultType] = useState(FAULT_TYPES[0]);
    
    // Relay Parameters
    const [deadTimeFast, setDeadTimeFast] = useState(0.3);
    const [deadTimeSlow, setDeadTimeSlow] = useState(15);
    const [reclaimTimeLimit, setReclaimTimeLimit] = useState(15);
    
    // Physics & Timers
    const [currentShot, setCurrentShot] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [phaseTimer, setPhaseTimer] = useState(0);
    const [currentPhaseTarget, setCurrentPhaseTarget] = useState(0);
    
    // Hardware states
    const [breakerClosed, setBreakerClosed] = useState(true);
    const [faultActive, setFaultActive] = useState(false);
    
    // Logs
    const [events, setEvents] = useState([]);

    const addEvent = useCallback((msg, type = 'info') => {
        setEvents(prev => [{ time: elapsed, msg, type }, ...prev].slice(0, 40));
    }, [elapsed]);

    const reset = () => {
        setSimState('IDLE');
        setCurrentShot(0);
        setElapsed(0);
        setPhaseTimer(0);
        setBreakerClosed(true);
        setFaultActive(false);
        setEvents([]);
        lastTimeRef.current = undefined;
    };

    const requestRef = useRef();
    const lastTimeRef = useRef();

    // The Master Engine Loop (60fps)
    const updatePhysics = useCallback((timestamp) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const dt = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        if (simState !== 'IDLE' && simState !== 'LOCKOUT' && simState !== 'SUCCESS') {
            setElapsed(prev => prev + dt);
            setPhaseTimer(prev => prev + dt);
        }
        requestRef.current = requestAnimationFrame(updatePhysics);
    }, [simState]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(requestRef.current);
    }, [updatePhysics]);

    // State Machine Logic (IEEE/IEC strict)
    useEffect(() => {
        const shots = SHOT_CONFIGS[shotConfig].shots;

        if (simState === 'FAULT') {
            if (phaseTimer >= 0.05) { // Relay processing time + breaker mech time (50ms)
                const shot = shots[currentShot];
                const tripDelay = shot ? shot.delay / 1000 : 0.05; 

                if (phaseTimer >= tripDelay + 0.05) {
                    setBreakerClosed(false);
                    setFaultActive(false); 
                    const shotType = shots[currentShot]?.type || 'FAST';
                    addEvent(`TRIP #${currentShot + 1} (${shotType} Curve) — Breaker OPEN`, 'trip');
                    
                    setSimState('DEAD_TIME');
                    setPhaseTimer(0);
                    const dtTgt = shotType === 'SLOW' ? deadTimeSlow : deadTimeFast;
                    setCurrentPhaseTarget(dtTgt);
                    addEvent(`Initiating Dead Time (${dtTgt.toFixed(1)}s)`, 'wait');
                }
            }
        }

        if (simState === 'DEAD_TIME') {
            if (phaseTimer >= currentPhaseTarget) {
                setBreakerClosed(true);
                addEvent(`RECLOSE #${currentShot + 1} Command Issued`, 'reclose');
                
                const nextShot = currentShot + 1;
                
                if (nextShot >= faultType.clearAfter) {
                    setFaultActive(false);
                    addEvent('System Stable — Fault Cleared', 'success');
                    addEvent(`Starting Reclaim Timer (${reclaimTimeLimit}s)`, 'wait');
                    setCurrentShot(nextShot);
                    setSimState('RECLAIM');
                    setPhaseTimer(0);
                    setCurrentPhaseTarget(reclaimTimeLimit);
                } else if (nextShot >= shots.length) {
                    setFaultActive(true); 
                    addEvent('ANSI 86 LOCKOUT — Shot Sequence Exhausted', 'lockout');
                    setBreakerClosed(false); 
                    setSimState('LOCKOUT');
                } else {
                    setFaultActive(true);
                    setCurrentShot(nextShot);
                    addEvent(`Fault persists on Reclose #${nextShot}`, 'fault');
                    setSimState('FAULT');
                    setPhaseTimer(0);
                }
            }
        }

        if (simState === 'RECLAIM') {
            if (phaseTimer >= currentPhaseTarget) {
                addEvent('Reclaim Timer Expired — Sequence Reset', 'success');
                setSimState('SUCCESS');
                setCurrentShot(0);
                setPhaseTimer(0);
            }
        }

    }, [simState, phaseTimer, currentShot, shotConfig, faultType, deadTimeFast, deadTimeSlow, currentPhaseTarget, reclaimTimeLimit, addEvent]);

    const startFault = () => {
        reset();
        setFaultActive(true);
        setSimState('FAULT');
        setPhaseTimer(0);
        setElapsed(0);
        addEvent(`ANSI 50/51 PICKUP: ${faultType.label}`, 'fault');
    };

    const shots = SHOT_CONFIGS[shotConfig].shots;
    const formatTime = (seconds) => {
        const s = Math.floor(seconds);
        const ms = Math.floor((seconds - s) * 100);
        return `${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Controls & Configurations */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    <div className="rounded-3xl border bg-slate-900 border-slate-800 p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                        
                        <h3 className="font-black text-lg mb-6 flex items-center gap-3 text-white tracking-wide">
                            <Settings className="w-5 h-5 text-blue-500" /> Relay Configuration (79)
                        </h3>
                        
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2 block text-slate-300">Shot Sequence Schema</label>
                                    <div className="relative">
                                        <select value={shotConfig} onChange={e => setShotConfig(e.target.value)} disabled={simState !== 'IDLE' && simState !== 'SUCCESS' && simState !== 'LOCKOUT'}
                                            className="w-full p-3 pl-4 rounded-xl border bg-slate-800 border-slate-700 text-white text-sm font-bold outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer disabled:opacity-50">
                                            {Object.entries(SHOT_CONFIGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none"><Hash className="w-4 h-4 text-slate-500" /></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2 block text-slate-300">Fault Injection Type</label>
                                    <div className="relative">
                                        <select value={faultType.id} onChange={e => setFaultType(FAULT_TYPES.find(f => f.id === e.target.value))} disabled={simState !== 'IDLE' && simState !== 'SUCCESS' && simState !== 'LOCKOUT'}
                                            className="w-full p-3 pl-4 rounded-xl border bg-slate-800 border-slate-700 text-white text-sm font-bold outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer disabled:opacity-50">
                                            {FAULT_TYPES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none"><Zap className="w-4 h-4 text-slate-500" /></div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 space-y-2">
                                <Slider label="Fast Curve Dead Time" unit="s" min={0.1} max={2.0} step={0.1} value={deadTimeFast} onChange={e => setDeadTimeFast(parseFloat(e.target.value))} color="blue" disabled={simState !== 'IDLE' && simState !== 'SUCCESS' && simState !== 'LOCKOUT'} />
                                <Slider label="Slow Curve Dead Time" unit="s" min={1} max={30} step={1} value={deadTimeSlow} onChange={e => setDeadTimeSlow(parseFloat(e.target.value))} color="amber" disabled={simState !== 'IDLE' && simState !== 'SUCCESS' && simState !== 'LOCKOUT'} />
                                <Slider label="Reclaim Timer Limit" unit="s" min={5} max={60} step={5} value={reclaimTimeLimit} onChange={e => setReclaimTimeLimit(parseFloat(e.target.value))} color="emerald" disabled={simState !== 'IDLE' && simState !== 'SUCCESS' && simState !== 'LOCKOUT'} />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={startFault} disabled={simState !== 'IDLE' && simState !== 'SUCCESS' && simState !== 'LOCKOUT'}
                                className="flex-2 w-2/3 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-black text-sm disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0">
                                <Zap className="w-5 h-5 fill-current" /> INJECT FAULT
                            </button>
                            <button onClick={reset}
                                className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* CENTER & RIGHT COLUMNS: Visualizations & Telemetry */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <AnimatedSLD breakerClosed={breakerClosed} faultActive={faultActive} state={simState} />
                        <Oscilloscope state={simState} phaseTimer={phaseTimer} faultActive={faultActive} />
                    </div>

                    <div className="grid md:grid-cols-12 gap-6 flex-1 min-h-[300px]">
                        
                        <div className="md:col-span-5 rounded-3xl border bg-slate-900 border-slate-800 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <div className={`absolute inset-0 opacity-15 blur-3xl transition-colors duration-1000 ${
                                simState === 'LOCKOUT' ? 'bg-red-600' : simState === 'SUCCESS' ? 'bg-emerald-600' : simState === 'FAULT' ? 'bg-amber-600' : 'bg-blue-600'
                            }`} />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="text-center mb-6">
                                    <div className="inline-block bg-slate-950 border border-slate-800 px-4 py-1 rounded-full mb-4 shadow-inner">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 text-slate-300 flex items-center gap-2"><Cpu className="w-3 h-3 text-emerald-500" /> ANSI 79 Logic Controller</span>
                                    </div>
                                    <div className={`text-4xl font-black tracking-tighter uppercase drop-shadow-md ${
                                        simState === 'LOCKOUT' ? 'text-red-500' : simState === 'SUCCESS' ? 'text-emerald-500' : 
                                        simState === 'RECLAIM' ? 'text-blue-400' : simState === 'FAULT' ? 'text-amber-500 animate-pulse' : 'text-white'
                                    }`}>
                                        {simState.replace('_', ' ')}
                                    </div>
                                    <div className="font-mono text-xl font-bold text-slate-400 mt-2 bg-slate-950 inline-block px-4 py-1 rounded-lg border border-slate-800 shadow-inner">
                                        <Timer className="inline w-4 h-4 mr-2 mb-1" />{formatTime(elapsed)}
                                    </div>
                                </div>

                                {/* Active Timers & Elements */}
                                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/50 shadow-inner flex-1 flex flex-col justify-end">
                                    
                                    <div className="mb-4">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Active Protection Elements</div>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${faultActive ? 'bg-red-900/50 border-red-500 text-red-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>50/51 OC Pickup</span>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${simState==='DEAD_TIME'||simState==='RECLAIM' ? 'bg-blue-900/50 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>79 Logic Active</span>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${simState==='LOCKOUT' ? 'bg-red-900/80 border-red-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>86 Lockout</span>
                                        </div>
                                    </div>

                                    <div className="mb-5 h-10">
                                        {(simState === 'DEAD_TIME' || simState === 'RECLAIM') ? (
                                            <div>
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                                                    <span className="text-blue-400">{simState === 'DEAD_TIME' ? 'Dead Time Count' : 'Reclaim Timer'}</span>
                                                    <span className="font-mono text-slate-300">{phaseTimer.toFixed(1)}s / {currentPhaseTarget.toFixed(1)}s</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all ease-linear" style={{ width: `${(phaseTimer / currentPhaseTarget) * 100}%` }} />
                                                </div>
                                            </div>
                                        ) : <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 text-center mt-3">Timers Idle</div>}
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                            <span>Sequence Progress</span>
                                            <span>Shot {currentShot} / {shots.length}</span>
                                        </div>
                                        <div className="flex gap-2 h-8">
                                            {shots.map((shot, i) => (
                                                <div key={i} className={`flex-1 rounded-lg flex items-center justify-center transition-all border ${
                                                    i < currentShot 
                                                        ? (simState === 'LOCKOUT' ? 'bg-red-900/50 border-red-500/50 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-500')
                                                        : i === currentShot && (simState === 'FAULT' || simState === 'DEAD_TIME' || simState === 'RECLAIM')
                                                            ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]'
                                                            : 'bg-slate-900 border-slate-800 text-slate-600'
                                                }`}>
                                                    <span className="text-[11px] font-black">{shot.type === 'FAST' ? 'FAST' : 'SLOW'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-7 rounded-3xl border bg-slate-900 border-slate-800 p-5 shadow-2xl flex flex-col">
                            <h3 className="font-bold text-[11px] uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 w-fit">
                                <Radio className="w-4 h-4 text-emerald-500" /> Sequence Event Log
                            </h3>
                            <div className="flex-1 bg-[#0a0f1c] rounded-2xl border border-slate-800/80 p-4 overflow-y-auto space-y-2.5 font-mono text-xs shadow-inner relative">
                                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '100% 32px' }}></div>
                                
                                {events.length === 0 && <p className="opacity-40 italic text-center mt-10">System armed. Awaiting fault injection...</p>}
                                
                                <div className="relative z-10 flex flex-col gap-2">
                                    {events.map((e, i) => (
                                        <div key={i} className={`px-3 py-2.5 rounded-lg flex items-start gap-4 border-l-4 transition-all hover:bg-slate-800/50 ${
                                            e.type === 'fault' ? 'border-red-500 text-red-200 bg-red-950/30' :
                                            e.type === 'trip' ? 'border-amber-500 text-amber-200 bg-amber-950/30' :
                                            e.type === 'reclose' ? 'border-blue-500 text-blue-200 bg-blue-950/30' :
                                            e.type === 'success' ? 'border-emerald-500 text-emerald-200 bg-emerald-950/30' :
                                            e.type === 'lockout' ? 'border-red-600 text-red-100 bg-red-600/30 font-bold shadow-[0_0_10px_rgba(220,38,38,0.2)]' :
                                            'border-slate-600 text-slate-300 bg-slate-900/50'
                                        }`}>
                                            <span className="opacity-60 min-w-[55px] font-bold text-[10px]">{(e.time).toFixed(3)}s</span>
                                            <span className="leading-tight">{e.msg}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================= THEORY DATABASE MODULE =========================
const TheoryModule = () => (
    <div className="max-w-5xl mx-auto p-8 animate-fade-in text-slate-200">
        <div className="mb-12 text-center">
            <h1 className="text-4xl font-black mb-3 text-white tracking-tight">Autoreclosing & Coordination (ANSI 79)</h1>
            <p className="opacity-60 text-sm tracking-widest uppercase font-bold text-emerald-400">IEEE C37.104 & IEC 60255 Standard Guidelines</p>
        </div>
        
        <div className="space-y-12">
            {/* Principles & Operating Cycle */}
            <div className="grid md:grid-cols-2 gap-8">
                {THEORY_DATA.slice(0, 2).map(sec => (
                    <div key={sec.id} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group h-full">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-emerald-500 opacity-50"></div>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-4 text-white">
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">{sec.icon}</div> {sec.title}
                        </h2>
                        <div className="pl-2">{sec.content}</div>
                    </div>
                ))}
            </div>

            {/* Timeline Diagram Component */}
            <TimelineGraph />

            {/* Fuse Saving / Coordination */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-red-500 opacity-50"></div>
                 <h2 className="text-2xl font-bold mb-6 flex items-center gap-4 text-white">
                     <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-inner"><Zap className="w-5 h-5 text-amber-500"/></div> {THEORY_DATA[2].title}
                 </h2>
                 <div className="pl-2 mb-8">{THEORY_DATA[2].content}</div>
                 
                 {/* TCC Graph Component */}
                 <TCCGraph />
            </div>

            {/* Protection Elements Guide */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
                 <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white"><ShieldCheck className="w-5 h-5 text-blue-500" /> ANSI Protection Elements</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-2xl font-black text-white mb-1">50/51</div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Overcurrent</div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-2xl font-black text-blue-400 mb-1">79</div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Auto Recloser</div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-2xl font-black text-emerald-400 mb-1">52</div>
                        <div className="text-xs text-slate-400 font-bold uppercase">AC Breaker</div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 border-b-2 border-b-red-500">
                        <div className="text-2xl font-black text-red-500 mb-1">86</div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Lockout Relay</div>
                    </div>
                 </div>
            </div>
        </div>
    </div>
);

// ========================= MAIN APP LAYOUT =========================
export default function App() {
    const [activeTab, setActiveTab] = useState('simulator');
    
    useEffect(() => {
        document.body.style.backgroundColor = '#020617'; 
        document.title = "GridGuard | ANSI 79 SCADA Interface";
    }, []);

    const tabs = [
        { id: 'theory', label: 'Theory DB', icon: <Book className="w-4 h-4" /> },
        { id: 'simulator', label: 'SCADA Sim', icon: <MonitorPlay className="w-4 h-4" /> }
    ];

    return (
        <div className="h-screen flex flex-col font-sans bg-[#020617] text-slate-200 selection:bg-blue-500/30">
            
            <header className="h-16 border-b shrink-0 flex items-center justify-between px-6 z-20 bg-slate-950/80 backdrop-blur-xl border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-blue-600 to-emerald-500 p-2.5 rounded-xl text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-white/10">
                        <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-black text-xl leading-none tracking-tight text-white mb-1">GridGuard <span className="text-emerald-500">PRO 6.0</span></h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">ANSI 79</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">IEEE C37.104</span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center p-1.5 rounded-2xl border shadow-inner bg-slate-900/80 border-slate-800 backdrop-blur-md">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                                activeTab === tab.id
                                    ? 'bg-slate-800 text-white shadow-md ring-1 ring-slate-700'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                            }`}>
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                
                <div className="hidden md:flex items-center gap-4">
                    <div className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">System Online</span>
                    </div>
                </div>
            </header>

            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-2 bg-slate-950/90 backdrop-blur-xl border-slate-800">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold transition-colors ${
                            activeTab === tab.id ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                        {tab.icon} <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <div className="h-full overflow-y-auto"><TheoryModule /></div>}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}>
                    <SimulatorModule />
                </div>
            </div>
        </div>
    );
}