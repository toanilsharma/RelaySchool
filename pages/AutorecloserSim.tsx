import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Play, Square, RotateCcw, AlertCircle, CheckCircle2, XCircle, Activity, Zap, Timer,
    HelpCircle, Book, AlertTriangle, Settings, Sliders, TrendingUp, MonitorPlay, GraduationCap,
    ShieldCheck, Info, Award, ChevronRight, SkipForward, Lock, Unlock, Power
, Share2 } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import TheoryLibrary from '../components/TheoryLibrary';
import Slider from '../components/Slider';
import { AUTORECLOSER_THEORY_CONTENT } from '../data/learning-modules/autorecloser';
import SEO from "../components/SEO";

// ========================= CONSTANTS =========================
const SHOT_CONFIGS = {
    '1F': { label: '1 Fast', shots: [{ type: 'FAST', delay: 50 }] },
    '1F1S': { label: '1 Fast + 1 Slow', shots: [{ type: 'FAST', delay: 50 }, { type: 'SLOW', delay: 400 }] },
    '1F2S': { label: '1 Fast + 2 Slow', shots: [{ type: 'FAST', delay: 50 }, { type: 'SLOW', delay: 400 }, { type: 'SLOW', delay: 400 }] },
    '2F2S': { label: '2 Fast + 2 Slow', shots: [{ type: 'FAST', delay: 50 }, { type: 'FAST', delay: 50 }, { type: 'SLOW', delay: 400 }, { type: 'SLOW', delay: 400 }] },
};

const FAULT_TYPES = [
    { id: 'transient', label: 'Transient (Lightning)', color: 'text-blue-500', clearAfter: 1, desc: 'Clears after 1st trip' },
    { id: 'semi', label: 'Semi-Permanent (Tree)', color: 'text-amber-500', clearAfter: 3, desc: 'Clears after 3rd trip' },
    { id: 'permanent', label: 'Permanent (Cable)', color: 'text-red-500', clearAfter: 99, desc: 'Never clears → Lockout' },
];

const QUIZ_DATA = {
    easy: [
        { q: "What percentage of overhead line faults are transient?", opts: ["30%", "50%", "80%", "95%"], ans: 2 },
        { q: "What happens after the autorecloser exhausts all shots on a permanent fault?", opts: ["Keeps reclosing", "Lockout", "Alarm only", "Transfer trip"], ans: 1 },
        { q: "Dead time is the period when the breaker is:", opts: ["Closed", "Open (waiting)", "Tripping", "Being tested"], ans: 1 },
        { q: "Autoreclosing is typically DISABLED for:", opts: ["Overhead lines", "Underground cables", "Transformers", "Busbars"], ans: 1 },
        { q: "What does 'reclaim time' mean?", opts: ["Time to repair", "Time to reset shot counter after success", "Fault clearing time", "Breaker operating time"], ans: 1 },
    ],
    medium: [
        { q: "In fuse-saving mode, the autorecloser fast curve must be:", opts: ["Above the fuse curve", "Below the fuse minimum-melt curve", "Equal to the fuse curve", "Disabled"], ans: 1 },
        { q: "For a 138kV line, the minimum dead time should account for:", opts: ["Motor re-acceleration", "Arc deionization time", "CT saturation", "VT accuracy"], ans: 1 },
        { q: "Which ANSI code designates autoreclosing?", opts: ["25", "50", "79", "81"], ans: 2 },
        { q: "On distribution feeders, a typical fast shot dead time is:", opts: ["5 seconds", "0.3-0.5 seconds", "60 seconds", "0.01 seconds"], ans: 1 },
        { q: "If the reclaim timer expires after a successful reclose, the shot counter:", opts: ["Increments", "Resets to zero", "Stays the same", "Doubles"], ans: 1 },
    ],
    expert: [
        { q: "Per IEEE C37.104, the deionization time formula depends primarily on:", opts: ["Fault current magnitude", "System voltage level", "CT ratio", "Relay type"], ans: 1 },
        { q: "Fuse-clearing philosophy is preferred in urban areas because:", opts: ["It saves fuses", "It minimizes momentary outages on the main feeder", "It's cheaper", "It's faster"], ans: 1 },
        { q: "With DER (solar/wind) on a feeder, autoreclosing requires additional:", opts: ["CT accuracy check", "Anti-islanding / DER trip verification", "VT calibration", "Harmonic filtering"], ans: 1 },
        { q: "Single-shot autoreclosing on transmission lines is preferred because:", opts: ["Multi-shot causes more damage", "Single-shot has higher success rate", "System stability limits allow only one attempt", "Equipment cost"], ans: 2 },
        { q: "The 'lockout relay' (86) in an autorecloser scheme ensures:", opts: ["Faster tripping", "Breaker cannot reclose until manually reset", "CT protection", "Voltage restoration"], ans: 1 },
    ],
};

// ========================= SIMULATOR =========================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    type SimState = 'IDLE' | 'FAULT' | 'TRIPPED' | 'DEAD_TIME' | 'RECLOSING' | 'SUCCESS' | 'LOCKOUT';
    
    const [simState, setSimState] = useState<SimState>('IDLE');
    const [shotConfig, setShotConfig] = useState<keyof typeof SHOT_CONFIGS>('2F2S');
    const [faultType, setFaultType] = useState(FAULT_TYPES[0]);
    const [deadTimeFast, setDeadTimeFast] = useState(0.3);
    const [deadTimeSlow, setDeadTimeSlow] = useState(15);
    const [reclaimTime, setReclaimTime] = useState(60);
    const [currentShot, setCurrentShot] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [events, setEvents] = useState<{ time: number; msg: string; type: string }[]>([]);
    const [breakerClosed, setBreakerClosed] = useState(true);
    const [faultActive, setFaultActive] = useState(false);
    const [phaseTimer, setPhaseTimer] = useState(0);
    const [currentPhaseTarget, setCurrentPhaseTarget] = useState(0);

    const timerRef = useRef<any>(null);
    const addEvent = useCallback((msg: string, type: string = 'info') => {
        setEvents(prev => [{ time: elapsed, msg, type }, ...prev].slice(0, 20));
    }, [elapsed]);

    const reset = () => {
        setSimState('IDLE');
        setCurrentShot(0);
        setElapsed(0);
        setEvents([]);
        setBreakerClosed(true);
        setFaultActive(false);
        setPhaseTimer(0);
        setCurrentPhaseTarget(0);
        lastTimeRef.current = undefined;
    };

    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>();

    const updatePhysics = useCallback((timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const dt = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        if (simState !== 'IDLE' && simState !== 'SUCCESS' && simState !== 'LOCKOUT') {
            setElapsed(prev => prev + dt);
            setPhaseTimer(prev => prev + dt);
        }
        requestRef.current = requestAnimationFrame(updatePhysics);
    }, [simState]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => {
             if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [updatePhysics]);

    // State machine
    useEffect(() => {
        const shots = SHOT_CONFIGS[shotConfig].shots;

        if (simState === 'FAULT') {
            if (phaseTimer >= 0.05) { // 50ms fault detection time
                const shot = shots[currentShot];
                const tripDelay = shot ? shot.delay / 1000 : 0.05;
                if (phaseTimer >= tripDelay / 10 + 0.05) {
                    setBreakerClosed(false);
                    setFaultActive(false);
                    addEvent(`TRIP #${currentShot + 1} (${shots[currentShot]?.type || 'FAST'}) — Breaker OPEN`, 'trip');
                    setSimState('TRIPPED');
                    setPhaseTimer(0);
                    const dt = shots[currentShot]?.type === 'SLOW' ? deadTimeSlow : deadTimeFast;
                    setCurrentPhaseTarget(dt);
                }
            }
        }

        if (simState === 'TRIPPED') {
            // After short processing, enter dead time
            if (phaseTimer >= 0.2) {
                setSimState('DEAD_TIME');
                setPhaseTimer(0);
                addEvent(`Dead Time started (${currentPhaseTarget.toFixed(1)}s)`, 'wait');
            }
        }

        if (simState === 'DEAD_TIME') {
            if (phaseTimer >= currentPhaseTarget) {
                setSimState('RECLOSING');
                setPhaseTimer(0);
                addEvent('AUTO RECLOSE — Breaker CLOSING', 'reclose');
            }
        }

        if (simState === 'RECLOSING') {
            if (phaseTimer >= 0.1) {
                setBreakerClosed(true);
                const nextShot = currentShot + 1;
                // Check if fault has cleared
                if (nextShot >= faultType.clearAfter) {
                    setFaultActive(false);
                    addEvent('✅ Fault CLEARED — Line restored!', 'success');
                    setSimState('SUCCESS');
                } else if (nextShot >= shots.length) {
                    setFaultActive(true);
                    addEvent('🔒 LOCKOUT — All shots exhausted. Manual reset required.', 'lockout');
                    setBreakerClosed(false);
                    setSimState('LOCKOUT');
                } else {
                    setFaultActive(true);
                    setCurrentShot(nextShot);
                    addEvent(`Fault still present after reclose #${nextShot}`, 'fault');
                    setSimState('FAULT');
                    setPhaseTimer(0);
                }
            }
        }
    }, [simState, phaseTimer, currentShot, shotConfig, faultType, deadTimeFast, deadTimeSlow, currentPhaseTarget, addEvent]);

    const startFault = () => {
        reset();
        setFaultActive(true);
        setSimState('FAULT');
        setPhaseTimer(0);
        setElapsed(0);
        setEvents([{ time: 0, msg: `⚡ FAULT: ${faultType.label} on feeder`, type: 'fault' }]);
    };

    const shots = SHOT_CONFIGS[shotConfig].shots;
    const progress = simState === 'LOCKOUT' ? 100 : simState === 'SUCCESS' ? 100 : shots.length > 0 ? (currentShot / shots.length) * 100 : 0;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Controls */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-500" /> Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Shot Sequence</label>
                        <select value={shotConfig} onChange={e => setShotConfig(e.target.value as keyof typeof SHOT_CONFIGS)}
                            className={`w-full p-2.5 rounded-lg border text-sm font-mono ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                            disabled={simState !== 'IDLE'}
                        >
                            {Object.entries(SHOT_CONFIGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Fault Type</label>
                        <select value={faultType.id} onChange={e => setFaultType(FAULT_TYPES.find(f => f.id === e.target.value) || FAULT_TYPES[0])}
                            className={`w-full p-2.5 rounded-lg border text-sm font-mono ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                            disabled={simState !== 'IDLE'}
                        >
                            {FAULT_TYPES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                    </div>
                    <Slider 
                        label="Dead Time Fast" 
                        unit="s" 
                        min={0.1} 
                        max={2} 
                        step={0.1} 
                        value={deadTimeFast} 
                        onChange={e => setDeadTimeFast(parseFloat(e.target.value))} 
                        color="blue" 
                        disabled={simState !== 'IDLE'}
                    />
                    <Slider 
                        label="Dead Time Slow" 
                        unit="s" 
                        min={1} 
                        max={30} 
                        step={1} 
                        value={deadTimeSlow} 
                        onChange={e => setDeadTimeSlow(parseFloat(e.target.value))} 
                        color="amber" 
                        disabled={simState !== 'IDLE'}
                    />
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={startFault} disabled={simState !== 'IDLE'}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-all shadow-lg shadow-red-500/20">
                        <Zap className="w-4 h-4" /> Inject Fault
                    </button>
                    <button onClick={reset}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                </div>
            </div>

            {/* Single Line Diagram */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4">Single Line Diagram</h3>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    {/* Source */}
                    <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${isDark ? 'border-emerald-500 bg-emerald-900/30' : 'border-emerald-600 bg-emerald-50'}`}>
                            <Zap className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-bold mt-1 uppercase tracking-wider opacity-60">Source</span>
                    </div>

                    {/* Line */}
                    <div className={`w-12 h-1 ${breakerClosed && !faultActive ? 'bg-emerald-500' : 'bg-slate-500'} rounded`} />

                    {/* Autorecloser */}
                    <div className="flex flex-col items-center relative">
                        <div className={`w-20 h-20 rounded-xl border-4 flex flex-col items-center justify-center transition-all duration-300 ${
                            breakerClosed 
                                ? (faultActive ? 'border-red-500 bg-red-900/30 animate-pulse' : 'border-emerald-500 bg-emerald-900/20')
                                : (simState === 'LOCKOUT' ? 'border-red-600 bg-red-900/40' : 'border-amber-500 bg-amber-900/20')
                        }`}>
                            {breakerClosed ? <Unlock className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-red-400" />}
                            <span className="text-[9px] font-bold mt-1">{breakerClosed ? 'CLOSED' : 'OPEN'}</span>
                        </div>
                        <span className="text-[10px] font-bold mt-1 uppercase tracking-wider opacity-60">79 Recloser</span>
                        {simState === 'LOCKOUT' && <span className="absolute -bottom-5 text-[10px] font-bold text-red-500 animate-pulse">🔒 LOCKOUT</span>}
                    </div>

                    {/* Line to load */}
                    <div className={`w-12 h-1 ${breakerClosed && !faultActive ? 'bg-emerald-500' : 'bg-slate-500'} rounded`} />

                    {/* Fuse / Lateral */}
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-16 rounded border-2 flex items-center justify-center ${isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-slate-100'}`}>
                            <div className="w-1 h-10 bg-amber-500 rounded" />
                        </div>
                        <span className="text-[10px] font-bold mt-1 uppercase tracking-wider opacity-60">Fuse</span>
                    </div>

                    <div className={`w-12 h-1 ${breakerClosed && !faultActive ? 'bg-emerald-500' : 'bg-slate-500'} rounded`} />

                    {/* Fault indicator */}
                    {faultActive && (
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-red-500" />
                            </div>
                            <span className="text-[10px] font-bold mt-1 text-red-500">FAULT</span>
                        </div>
                    )}

                    {/* Load */}
                    <div className={`w-12 h-1 ${breakerClosed && !faultActive ? 'bg-emerald-500' : 'bg-slate-500'} rounded`} />
                    <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center ${isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-slate-100'}`}>
                            <Power className="w-6 h-6 opacity-60" />
                        </div>
                        <span className="text-[10px] font-bold mt-1 uppercase tracking-wider opacity-60">Load</span>
                    </div>
                </div>

                {/* Shot Progress */}
                <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span>Shot Progress</span>
                        <span>{currentShot}/{shots.length} shots used</span>
                    </div>
                    <div className="flex gap-1.5">
                        {shots.map((shot, i) => (
                            <div key={i} className={`flex-1 h-3 rounded-full transition-all duration-500 ${
                                i < currentShot 
                                    ? (simState === 'LOCKOUT' ? 'bg-red-500' : 'bg-emerald-500')
                                    : i === currentShot && simState !== 'IDLE' && simState !== 'SUCCESS' && simState !== 'LOCKOUT'
                                        ? 'bg-amber-500 animate-pulse'
                                        : isDark ? 'bg-slate-800' : 'bg-slate-200'
                            }`}>
                                <div className="text-[8px] font-bold text-center leading-3 text-white">
                                    {shot.type === 'FAST' ? 'F' : 'S'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status & Event Log */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Panel */}
                <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" /> Status
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="opacity-60">State</span>
                            <span className={`font-bold ${
                                simState === 'SUCCESS' ? 'text-emerald-500' : simState === 'LOCKOUT' ? 'text-red-500' : simState === 'IDLE' ? 'opacity-60' : 'text-amber-500'
                            }`}>{simState}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="opacity-60">Elapsed</span>
                            <span className="font-mono">{elapsed.toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="opacity-60">Fault Type</span>
                            <span className={`font-bold ${faultType.color}`}>{faultType.label}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="opacity-60">Breaker</span>
                            <span className={`font-bold ${breakerClosed ? 'text-emerald-500' : 'text-red-500'}`}>{breakerClosed ? 'CLOSED' : 'OPEN'}</span>
                        </div>
                        {simState === 'DEAD_TIME' && (
                            <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <div className="text-xs font-bold text-amber-500 mb-1">Dead Time Countdown</div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 transition-all duration-100 rounded-full"
                                        style={{ width: `${(phaseTimer / currentPhaseTarget) * 100}%` }} />
                                </div>
                                <span className="text-xs font-mono mt-1 block">{phaseTimer.toFixed(1)}s / {currentPhaseTarget.toFixed(1)}s</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Event Log */}
                <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Event Log
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {events.length === 0 && <p className="text-sm opacity-40 italic">No events yet. Inject a fault to begin.</p>}
                        {events.map((e, i) => (
                            <div key={i} className={`text-xs p-2.5 rounded-lg border ${
                                e.type === 'fault' ? 'border-red-500/20 bg-red-500/5' :
                                e.type === 'trip' ? 'border-amber-500/20 bg-amber-500/5' :
                                e.type === 'reclose' ? 'border-blue-500/20 bg-blue-500/5' :
                                e.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/5' :
                                e.type === 'lockout' ? 'border-red-500/30 bg-red-500/10' :
                                'border-slate-500/20 bg-slate-500/5'
                            }`}>
                                <span className="font-mono opacity-60">[{e.time.toFixed(1)}s]</span>{' '}
                                <span className="font-bold">{e.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================= GUIDE =========================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">User Guide</h2>
                <p className="text-sm opacity-60">How to use the Autoreclosing Simulator</p>
            </div>
        </div>
        <div className="space-y-6">
            {[
                { step: '1', title: 'Select Shot Sequence', desc: 'Choose the number of fast and slow shots (e.g., "2 Fast + 2 Slow"). This determines how many reclosing attempts the autorecloser will make before locking out.' },
                { step: '2', title: 'Select Fault Type', desc: 'Choose between Transient (clears after 1st trip), Semi-Permanent (clears after 3rd trip), or Permanent (never clears). This determines the simulation outcome.' },
                { step: '3', title: 'Adjust Dead Times', desc: 'Set the dead time for fast shots (0.1–2s) and slow shots (1–30s). Fast dead time allows the arc to deionize; slow dead time gives semi-permanent faults time to clear.' },
                { step: '4', title: 'Inject Fault', desc: 'Click "Inject Fault" to start the simulation. Watch the SLD update in real-time as the autorecloser trips, waits, and recloses.' },
                { step: '5', title: 'Observe Results', desc: 'The event log shows every action. The shot progress bar fills with each attempt. Green = success, Red = lockout. Use Reset to try again with different settings.' },
            ].map(item => (
                <div key={item.step} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0">{item.step}</div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-sm opacity-70 mt-1">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
        <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-2 flex items-center gap-2 text-amber-500"><AlertTriangle className="w-4 h-4" /> Standards Compliance</h4>
            <p className="text-sm opacity-80">
                This simulator models the autoreclosing logic per <strong>IEEE C37.104</strong> and <strong>IEEE C37.60</strong>. 
                The shot sequence, dead times, and lockout behavior follow standard industry practice for overhead distribution and transmission protection.
            </p>
        </div>
    </div>
);

// ========================= QUIZ =========================
const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy' | 'medium' | 'expert'>('easy');
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [finished, setFinished] = useState(false);

    const questions = QUIZ_DATA[level];
    const q = questions[current];

    const handleSelect = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        if (idx === q.ans) setScore(prev => prev + 1);
        setTimeout(() => {
            if (current + 1 >= questions.length) {
                setFinished(true);
            } else {
                setCurrent(prev => prev + 1);
                setSelected(null);
            }
        }, 1200);
    };

    const resetQuiz = () => {
        setCurrent(0); setScore(0); setSelected(null); setFinished(false);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Knowledge Quiz</h2>
                    <p className="text-sm opacity-60">Test your autoreclosing knowledge</p>
                </div>
            </div>

            {/* Level Selector */}
            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                {(['easy', 'medium', 'expert'] as const).map(l => (
                    <button key={l} onClick={() => { setLevel(l); resetQuiz(); }}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
                            level === l 
                                ? (l === 'easy' ? 'bg-emerald-600 text-white' : l === 'medium' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white')
                                : isDark ? 'bg-slate-900 text-slate-400 hover:bg-slate-800' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}>
                        {l}
                    </button>
                ))}
            </div>

            {finished ? (
                <div className={`text-center p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="text-5xl mb-4">{score >= 4 ? '🏆' : score >= 3 ? '✅' : '📚'}</div>
                    <div className="text-3xl font-black mb-2">{score}/{questions.length}</div>
                    <p className="opacity-60 mb-6">{score >= 4 ? 'Excellent! You know your autoreclosers!' : score >= 3 ? 'Good work. Review the theory for perfection.' : 'Study the theory section and try again!'}</p>
                    <button onClick={resetQuiz} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm">Retry</button>
                </div>
            ) : (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold opacity-40">Question {current + 1} / {questions.length}</span>
                        <span className="text-xs font-bold text-emerald-500">Score: {score}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">
                        {q.opts.map((opt, i) => (
                            <button key={i} onClick={() => handleSelect(i)}
                                className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all ${
                                    selected === null
                                        ? isDark ? 'border-slate-700 hover:border-blue-500 hover:bg-blue-900/20' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
                                        : i === q.ans
                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold'
                                            : selected === i
                                                ? 'border-red-500 bg-red-500/10 text-red-500'
                                                : 'opacity-40'
                                }`}>
                                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ========================= MAIN LAYOUT =========================
export default function AutorecloserSim() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };

    const tabs = [
        { id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4" /> },
        { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-4 h-4" /> },
        { id: 'guide', label: 'User Guide', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4" /> },
    ];

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="Autorecloser Simulator" description="Interactive autoreclosing logic simulator (ANSI 79) with shot sequences, fuse coordination, and IEEE C37.60/C37.104 compliance. Learn dead time, reclaim time, and lockout logic." url="/autorecloser" />

            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg text-white shadow-lg shadow-emerald-500/20">
                        <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>AutoReclose <span className="text-emerald-500">SIM</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Shot Sequence Logic</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">✅ IEEE C37.60 / C37.104</span>
                        </div>
                    </div>
                </div>

                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                activeTab === tab.id
                                    ? (isDark ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm')
                                    : 'opacity-60 hover:opacity-100'
                            }`}>
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>
            </header>

            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold ${
                            activeTab === tab.id ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'opacity-50'
                        }`}>
                        {tab.icon} <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && (
                    <TheoryLibrary title="Autoreclosing Handbook" description="Theory, standards, and best practices for automatic reclosing on AC distribution and transmission lines." sections={AUTORECLOSER_THEORY_CONTENT} />
                )}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}>
                    <SimulatorModule isDark={isDark} />
                </div>
                {activeTab === 'guide' && (
                    <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>
                )}
                {activeTab === 'quiz' && (
                    <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>
                )}
            </div>
        </div>
    );
}
