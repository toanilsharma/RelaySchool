import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
    RotateCcw, Book, MonitorPlay, GraduationCap, 
    Award, Layers, Zap, AlertTriangle, Activity, 
    ShieldCheck, Share2, Settings, Power, PlayCircle, 
    CheckCircle2, Info, ArrowRight, X, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';
import PageSEO from '../components/SEO/PageSEO';

// ============================== THEORY & QUIZ CONTENT ==============================

const THEORY_CONTENT = [
    {
        title: "1. The Need for Breaker Failure Protection (50BF)",
        content: "When a protective relay detects a fault, it issues a trip command to the primary circuit breaker. However, breakers are mechanical devices and can fail (e.g., stuck trip coil, loss of SF6 gas, jammed mechanism). If the primary breaker fails to interrupt the fault, the fault will persist, potentially destroying equipment and destabilizing the grid. 50BF provides local backup protection to clear the fault by tripping all adjacent breakers."
    },
    {
        title: "2. The Core Logic (IEEE C37.119)",
        content: "The 50BF scheme relies on two primary elements:\n1. Breaker Failure Initiate (BFI): The trip command from the primary relay starts the BF timer.\n2. Current Detector (50): A fast-resetting overcurrent element confirms fault current is still flowing.\n\nIf the timer expires AND the current detector is still active, the relay declares a breaker failure and issues a backup trip to isolate the entire bus zone."
    },
    {
        title: "3. Timer Coordination & Margin",
        content: "Setting the BF timer is a delicate balance between security and dependability.\nTimer (T_BF) ≥ T_breaker + T_reset + T_margin\n• T_breaker: ~50ms (3 cycles) for the breaker to mechanically open and extinguish the arc.\n• T_reset: ~16ms (1 cycle) for the relay's current detector to drop out.\n• T_margin: ~25ms-50ms safety margin to prevent false trips during DC subsidence."
    },
    {
        title: "4. DC Subsidence & False Trips",
        content: "Even after the primary breaker successfully interrupts the AC current, energy trapped in the CT secondary circuit can circulate as a decaying DC current (subsidence current). If the relay's current detector is too sensitive or slow to reset, this DC tail can keep the detector 'picked up' past the timer expiration, causing a catastrophic false backup trip. Modern relays use specialized filtering to reject this DC component."
    }
];

const QUIZ_DATA = {
    expert: [
        { q: "Per IEEE C37.119, what is the primary purpose of the 'Current Detector (50)' in a BF scheme?", opts: ["To measure load current", "To confirm the breaker actually failed by sensing persistent fault current", "To start the BF timer", "To detect voltage sags"], ans: 1, why: "The BFI signal starts the timer, but the current detector is the 'condition' that must be true when the timer expires to prove the breaker physically failed to interrupt." },
        { q: "What is 'DC Subsidence' in the context of breaker failure?", opts: ["A drop in battery voltage", "Decaying DC current in the CT secondary after the primary current is interrupted", "A substation grounding issue", "Loss of DC control power"], ans: 1, why: "Trapped magnetic energy in the CT core decays as an exponential DC current. This can keep the BF current detector active even after the breaker opens, requiring careful timer margins." },
        { q: "If a feeder breaker fails to clear a fault, the 50BF scheme must trip:", opts: ["Only the failed breaker again", "All adjacent breakers connected to the same bus to remove fault sources", "The remote end only", "The entire substation"], ans: 1, why: "To isolate the fault, the 50BF relay must trip every breaker that can supply fault current through the failed breaker, which typically means tripping the entire bus zone." }
    ]
};

// ============================== SCENARIO ENGINE ==============================

const SCENARIOS = {
    normal: {
        id: 'normal', name: 'Normal Fault Clearing', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500"/>,
        duration: 300,
        timeline: [
            { time: 0, what: "Fault occurs. Primary relay issues Trip Cmd (BFI).", why: "Current detector picks up. BF and Retrip timers start." },
            { time: 50, what: "Primary breaker mechanically opens.", why: "Arc is extinguished at the next current zero. Current drops to 0." },
            { time: 65, what: "Current detector drops out.", why: "Relay logic sees I < pickup. BF sequence is safely aborted." }
        ]
    },
    retrip_success: {
        id: 'retrip_success', name: 'Breaker Slow / Retrip Succeeds', icon: <RotateCcw className="w-4 h-4 text-amber-500"/>,
        duration: 350,
        timeline: [
            { time: 0, what: "Primary trip issued.", why: "Timers start. Breaker mechanism is sluggish." },
            { time: 60, what: "Retrip Timer expires.", why: "A second trip command is blasted to a secondary trip coil." },
            { time: 100, what: "Breaker finally opens on retrip.", why: "Current clears. Sequence aborted just before BF timer expires." }
        ]
    },
    bf_trip: {
        id: 'bf_trip', name: 'Total Breaker Failure (50BF Trip)', icon: <AlertTriangle className="w-4 h-4 text-red-500"/>,
        duration: 400,
        timeline: [
            { time: 0, what: "Primary trip issued.", why: "Breaker mechanism is totally jammed." },
            { time: 60, what: "Retrip issued.", why: "Breaker remains stuck. Fault current persists." },
            { time: 150, what: "BF Timer Expires!", why: "Current is still flowing. Relay issues massive BACKUP TRIP to all bus breakers." },
            { time: 200, what: "Backup breakers open.", why: "Bus is de-energized, isolating the fault. Cascading failure prevented." }
        ]
    },
    dc_subsidence: {
        id: 'dc_subsidence', name: 'DC Subsidence (Margin Test)', icon: <Activity className="w-4 h-4 text-purple-500"/>,
        duration: 400,
        timeline: [
            { time: 0, what: "Primary trip issued on highly inductive fault.", why: "Large DC offset exists in primary current." },
            { time: 50, what: "Breaker interrupts primary AC current.", why: "However, trapped flux in the CT core begins decaying as a secondary DC tail." },
            { time: 130, what: "Subsidence current drops below pickup.", why: "The relay's current detector finally resets. Because T_BF (150ms) > 130ms, a false trip was successfully avoided." }
        ]
    }
};

// ============================== MATH & PHYSICS ==============================

// Generates perfectly synced AC waveforms and digital logic traces
const generateSimData = (scenarioId, bfTimerVal, retripTimerVal) => {
    const data = [];
    const dt = 2; // 2ms resolution
    const omega = 2 * Math.PI * 60; // 60Hz

    let cb1_open = false;
    let cb_backup_open = false;
    
    // Physics parameters based on scenario
    let primaryOpenTime = 999;
    let dcDecayTau = 5; // fast decay normally

    if (scenarioId === 'normal') primaryOpenTime = 50;
    if (scenarioId === 'retrip_success') primaryOpenTime = retripTimerVal + 40;
    if (scenarioId === 'dc_subsidence') {
        primaryOpenTime = 50;
        dcDecayTau = 40; // slow decay of trapped flux
    }

    let i_inst = 0;
    let current_detector = 0;
    let bfi_signal = 0;
    let retrip_signal = 0;
    let bf_trip_signal = 0;

    for (let t = 0; t <= 400; t += dt) {
        // 1. Digital Logic State Machine
        if (t >= 0) bfi_signal = 1; // Trip initiated at t=0
        
        if (t >= retripTimerVal && !cb1_open) retrip_signal = 1;

        if (t >= primaryOpenTime) cb1_open = true;

        if (t >= bfTimerVal && current_detector === 1) {
            bf_trip_signal = 1;
        }

        if (bf_trip_signal === 1 && t >= bfTimerVal + 50) {
            cb_backup_open = true; // Backup breakers take 50ms to open
        }

        // 2. Analog Current Generation
        if (!cb1_open && !cb_backup_open) {
            // Fault is active (AC + DC offset)
            i_inst = 5000 * Math.sin(omega * (t/1000) - Math.PI/4) + 3000 * Math.exp(-t/20);
        } else if (cb1_open && !cb_backup_open) {
            // Primary open. AC is gone, but DC subsidence remains in CT secondary
            const timeSinceOpen = t - primaryOpenTime;
            // The magnitude at the moment of opening determines the starting DC tail
            i_inst = 2000 * Math.exp(-timeSinceOpen / dcDecayTau);
        } else {
            // Everything dead
            i_inst = 0;
        }

        // 3. Current Detector Logic (Threshold = 500A)
        // Includes a slight 10ms filtering delay to drop out
        if (Math.abs(i_inst) > 500) {
            current_detector = 1;
        } else if (Math.abs(i_inst) < 50) {
            current_detector = 0; 
        }

        data.push({
            time: t,
            current: i_inst,
            cd: current_detector * 1000, // scaled for chart overlay
            bfi: bfi_signal * 1000,
            retrip: retrip_signal * 1000,
            bf_trip: bf_trip_signal * 1000,
            cb1_open,
            cb_backup_open
        });
    }
    return data;
};

// ============================== CUSTOM COMPONENTS ==============================

// Inline Custom Slider to remove dependencies
const CustomSlider = ({ label, value, min, max, step, onChange, disabled, unit, colorClass }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs font-bold opacity-70">
            <span>{label}</span>
            <span className="font-mono">{value}{unit}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={onChange} disabled={disabled}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 disabled:opacity-40 accent-${colorClass}`}
            style={{ accentColor: colorClass === 'red' ? '#ef4444' : '#f59e0b' }}
        />
        <div className="flex justify-between text-[10px] opacity-40 font-mono">
            <span>{min}</span><span>{max}</span>
        </div>
    </div>
);

// High-fidelity SCADA Single Line Diagram
const SLDCanvas = ({ isDark, simData, currentT }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const cvs = canvasRef.current; if(!cvs) return;
        const ctx = cvs.getContext('2d');
        const w = cvs.width = cvs.offsetWidth * 2;
        const h = cvs.height = cvs.offsetHeight * 2;
        ctx.scale(2,2);
        const cw = w/2, ch = h/2;

        // Current state at time T
        const frame = simData.find(d => d.time >= currentT) || simData[simData.length - 1] || { cb1_open: false, cb_backup_open: false, current: 0, bf_trip: 0 };
        
        const colors = {
            bg: isDark ? '#020617' : '#f8fafc',
            bus: frame.cb_backup_open ? '#64748b' : '#3b82f6', // Bus dies if backup trips
            text: isDark ? '#94a3b8' : '#475569',
            brkClosed: '#ef4444', // Red = Live/Closed (IEC Standard)
            brkOpen: '#22c55e',   // Green = Safe/Open
            fault: '#ef4444'
        };

        ctx.fillStyle = colors.bg; ctx.fillRect(0,0,cw,ch);

        // Draw Main Busbar
        const busY = ch * 0.3;
        ctx.fillStyle = colors.bus;
        ctx.fillRect(cw*0.1, busY-4, cw*0.8, 8);
        ctx.fillStyle = colors.text; ctx.font = 'bold 12px Inter'; ctx.fillText('MAIN BUS', cw*0.1, busY - 15);

        // Draw Incomers (Backup Breakers)
        const drawIncomer = (x, label) => {
            ctx.strokeStyle = colors.bus; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, busY); ctx.stroke();
            
            // Breaker (CB2, CB3)
            ctx.fillStyle = frame.cb_backup_open ? colors.brkOpen : colors.brkClosed;
            ctx.fillRect(x-8, 25, 16, 16);
            ctx.strokeStyle = colors.bg; ctx.lineWidth = 2; ctx.strokeRect(x-8, 25, 16, 16);
            
            ctx.fillStyle = colors.text; ctx.font = '9px Inter'; ctx.textAlign='center';
            ctx.fillText(label, x, 20); ctx.textAlign='left';
        };
        drawIncomer(cw * 0.3, 'INC A (CB2)');
        drawIncomer(cw * 0.7, 'INC B (CB3)');

        // Draw Outgoing Feeder (Primary Breaker CB1) with Fault
        const fdrX = cw * 0.5;
        ctx.strokeStyle = frame.cb_backup_open || frame.cb1_open ? '#64748b' : colors.text; 
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(fdrX, busY); ctx.lineTo(fdrX, ch-20); ctx.stroke();

        // Primary Breaker (CB1)
        const cb1Y = ch * 0.6;
        ctx.fillStyle = frame.cb1_open ? colors.brkOpen : colors.brkClosed;
        ctx.fillRect(fdrX-10, cb1Y-10, 20, 20);
        ctx.strokeStyle = colors.bg; ctx.lineWidth = 2; ctx.strokeRect(fdrX-10, cb1Y-10, 20, 20);
        ctx.fillStyle = colors.text; ctx.font = 'bold 10px Inter'; ctx.fillText('CB1', fdrX + 15, cb1Y + 3);

        // CT
        const ctY = ch * 0.45;
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(fdrX-6, ctY, 6, 0, Math.PI, false); ctx.arc(fdrX+6, ctY, 6, Math.PI, 0, false); ctx.stroke();

        // Fault Indicator
        if (Math.abs(frame.current) > 100) {
            ctx.fillStyle = 'rgba(239,68,68,0.2)';
            ctx.beginPath(); ctx.arc(fdrX, ch-30, 15, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = colors.fault; ctx.font = '20px sans-serif'; ctx.textAlign='center';
            ctx.fillText('⚡', fdrX, ch-23); ctx.textAlign='left';
        }

        // 50BF Trip Animation
        if (frame.bf_trip > 0 && !frame.cb_backup_open) {
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([4,4]);
            ctx.beginPath(); ctx.moveTo(fdrX-15, cb1Y); ctx.lineTo(cw*0.3, 35); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(fdrX+15, cb1Y); ctx.lineTo(cw*0.7, 35); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px Inter'; ctx.textAlign='center';
            ctx.fillText('BACKUP TRIP', fdrX, cb1Y - 20); ctx.textAlign='left';
        }

    }, [isDark, simData, currentT]);

    return <canvas ref={canvasRef} className="w-full h-full" style={{ minHeight: '220px' }} />;
};

// ============================== SIMULATOR MODULE ==============================

const SimulatorModule = ({ isDark }) => {
    const [bfTimer, setBfTimer] = useState(150);
    const [retripTimer, setRetripTimer] = useState(60);
    const [activeScenarioId, setActiveScenarioId] = useState('normal');
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentT, setCurrentT] = useState(0);
    
    const scenario = SCENARIOS[activeScenarioId];
    
    // Generate full deterministic dataset upfront based on settings
    const simData = useMemo(() => generateSimData(activeScenarioId, bfTimer, retripTimer), [activeScenarioId, bfTimer, retripTimer]);

    // Find current narrative step
    const currentNarrative = useMemo(() => {
        let active = scenario.timeline[0];
        for (let step of scenario.timeline) {
            if (currentT >= step.time) active = step;
        }
        return active;
    }, [currentT, scenario]);

    // Playback loop
    useEffect(() => {
        let reqId;
        if (isPlaying) {
            let start = performance.now();
            let lastT = currentT;
            const animate = (time) => {
                const elapsed = time - start;
                const newT = lastT + elapsed * 0.5; // 0.5x speed for observability
                if (newT >= scenario.duration) {
                    setCurrentT(scenario.duration);
                    setIsPlaying(false);
                } else {
                    setCurrentT(newT);
                    reqId = requestAnimationFrame(animate);
                }
            };
            reqId = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(reqId);
    }, [isPlaying, currentT, scenario.duration]);

    const runSimulation = () => {
        setCurrentT(0);
        setIsPlaying(true);
    };

    const resetSimulation = () => {
        setIsPlaying(false);
        setCurrentT(0);
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-4 p-4 animate-fade-in overflow-y-auto">
            
            {/* LEFT COLUMN: Controls & Analytics */}
            <div className="flex flex-col gap-4 w-full lg:w-5/12">
                
                {/* Configuration Matrix */}
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-red-500" /> Scenario Matrix</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                        {Object.values(SCENARIOS).map(sc => (
                            <button 
                                key={sc.id} onClick={() => { setActiveScenarioId(sc.id); resetSimulation(); }} disabled={isPlaying}
                                className={`flex items-center gap-2 p-3 rounded-xl text-left text-xs font-bold transition-all border ${
                                    activeScenarioId === sc.id ? 'bg-red-600 border-red-500 text-white shadow-md' : 
                                    isDark ? 'bg-slate-800 border-slate-700 opacity-70 hover:opacity-100' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                                }`}
                            >
                                {sc.icon} {sc.name}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <CustomSlider label="50BF Timer" value={bfTimer} min={100} max={300} step={10} unit="ms" colorClass="red" disabled={isPlaying} onChange={(e) => setBfTimer(Number(e.target.value))} />
                        <CustomSlider label="Retrip Timer" value={retripTimer} min={40} max={100} step={10} unit="ms" colorClass="amber" disabled={isPlaying} onChange={(e) => setRetripTimer(Number(e.target.value))} />
                    </div>

                    <div className="flex gap-2">
                        <button onClick={runSimulation} disabled={isPlaying} className="flex-1 p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                            {isPlaying ? <span className="animate-pulse">Running...</span> : <><PlayCircle className="w-5 h-5" /> Execute</>}
                        </button>
                        <button onClick={resetSimulation} className={`p-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Narrative Engine */}
                <div className={`p-6 rounded-2xl border relative overflow-hidden flex-1 ${isDark ? 'bg-[#0f172a] border-red-900/30' : 'bg-red-50 border-red-200'}`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <h3 className="font-black text-red-500 mb-1 flex items-center gap-2"><Info className="w-5 h-5" /> Relay Analytics Engine</h3>
                    <div className="text-[10px] opacity-60 font-bold mb-4 uppercase tracking-widest flex justify-between">
                        <span>{scenario.name}</span>
                        <span className="font-mono text-red-500">T = {currentT.toFixed(0)} ms</span>
                    </div>
                    
                    <AnimatePresence mode="wait">
                        <motion.div key={currentNarrative.what} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <div className="mb-4">
                                <h4 className="font-bold text-sm mb-1 flex items-center gap-1"><ArrowRight className="w-3 h-3 text-red-500"/> Physical State (What):</h4>
                                <p className="text-sm opacity-90 leading-relaxed font-medium">{currentNarrative.what}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm mb-1 flex items-center gap-1"><ArrowRight className="w-3 h-3 text-blue-500"/> Logic Decision (Why):</h4>
                                <p className="text-sm opacity-90 leading-relaxed text-blue-400 dark:text-blue-300">{currentNarrative.why}</p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* RIGHT COLUMN: Scopes & SLD */}
            <div className="flex flex-col gap-4 w-full lg:w-7/12">
                
                {/* SLD Canvas */}
                <div className={`h-48 rounded-2xl border relative overflow-hidden flex flex-col ${isDark ? 'bg-[#020617] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="absolute top-4 left-4 z-10 font-bold text-xs opacity-60 flex items-center gap-2"><Layers className="w-4 h-4"/> Dynamic Single Line Diagram</div>
                    <div className="flex-1"><SLDCanvas isDark={isDark} simData={simData} currentT={currentT} /></div>
                </div>

                {/* Transient Oscilloscope */}
                <div className={`h-48 p-4 rounded-2xl border flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-xs mb-2 opacity-60 uppercase tracking-widest flex justify-between">
                        <span>Fault Current Oscilloscope</span>
                        <span className="text-amber-500 flex items-center gap-1"><Activity className="w-3 h-3"/> I_fault</span>
                    </h3>
                    <div className="flex-1 min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={simData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                                <XAxis dataKey="time" type="number" domain={[0, 400]} stroke={isDark ? '#475569' : '#cbd5e1'} fontSize={9} tickCount={9} tickFormatter={(v) => `${v}ms`} />
                                <YAxis stroke={isDark ? '#475569' : '#cbd5e1'} fontSize={9} domain={[-8000, 8000]} />
                                <ReferenceLine x={currentT} stroke="#ef4444" strokeWidth={2} />
                                <ReferenceLine y={500} stroke="#f59e0b" strokeDasharray="2 2" />
                                <ReferenceLine y={-500} stroke="#f59e0b" strokeDasharray="2 2" />
                                <Line type="monotone" dataKey="current" stroke="#3b82f6" dot={false} strokeWidth={2} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="absolute top-0 right-2 text-[9px] font-mono text-amber-500 opacity-80 border-b border-amber-500/30 border-dashed">±500A CD Pickup</div>
                    </div>
                </div>

                {/* Digital Logic Analyzer */}
                <div className={`flex-1 p-4 rounded-2xl border flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-xs mb-2 opacity-60 uppercase tracking-widest">Relay Logic Analyzer (IEEE Timing)</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={simData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                                <XAxis dataKey="time" type="number" domain={[0, 400]} stroke={isDark ? '#475569' : '#cbd5e1'} fontSize={9} tickCount={9} hide />
                                <YAxis stroke={isDark ? '#475569' : '#cbd5e1'} fontSize={9} domain={[0, 4000]} tickFormatter={(v) => {
                                    if(v===3000) return 'BFI'; if(v===2000) return '50 (I>500A)'; if(v===1000) return 'RETRIP'; if(v===0) return '50BF TRIP'; return '';
                                }} />
                                <ReferenceLine x={currentT} stroke="#ef4444" strokeWidth={2} />
                                
                                <ReferenceLine x={bfTimer} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: `T_BF=${bfTimer}ms`, fill: '#ef4444', fontSize: 9 }} />
                                <ReferenceLine x={retripTimer} stroke="#f59e0b" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: `Retrip`, fill: '#f59e0b', fontSize: 9 }} />

                                {/* Offset the digital signals vertically to stack them */}
                                <Line type="stepAfter" dataKey={(d) => d.bfi ? 3800 : 3000} stroke="#cbd5e1" dot={false} strokeWidth={2} isAnimationActive={false} />
                                <Line type="stepAfter" dataKey={(d) => d.cd ? 2800 : 2000} stroke="#f59e0b" dot={false} strokeWidth={2} isAnimationActive={false} />
                                <Line type="stepAfter" dataKey={(d) => d.retrip ? 1800 : 1000} stroke="#a855f7" dot={false} strokeWidth={2} isAnimationActive={false} />
                                <Line type="stepAfter" dataKey={(d) => d.bf_trip ? 800 : 0} stroke="#ef4444" dot={false} strokeWidth={3} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

// ============================== STANDARD MODULES ==============================

const TheoryModule = ({ isDark }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-red-500/10 rounded-2xl"><Book className="w-8 h-8 text-red-500" /></div>
            <div><h2 className="text-3xl font-black">IEEE C37.119 Reference</h2><p className="text-sm opacity-60">Complete theoretical handbook for Breaker Failure Protection (50BF).</p></div>
        </div>
        <div className="grid gap-6">
            {THEORY_CONTENT.map((section, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-4 text-red-500">{section.title}</h3>
                    <p className="whitespace-pre-wrap leading-relaxed opacity-90">{section.content}</p>
                </div>
            ))}
        </div>
    </div>
);

const QuizModule = ({ isDark }) => {
    const [score, setScore] = useState(0); const [cur, setCur] = useState(0);
    const [sel, setSel] = useState(null); const [finished, setFinished] = useState(false);
    const qs = QUIZ_DATA.expert; const q = qs[cur];

    const handlePick = (i) => {
        if (sel !== null) return;
        setSel(i); if (i === q.ans) setScore(s => s + 1);
        setTimeout(() => { if (cur + 1 >= qs.length) setFinished(true); else { setCur(c => c + 1); setSel(null); } }, 3000);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-purple-500/10 rounded-2xl"><Award className="w-8 h-8 text-purple-500" /></div>
                <div><h2 className="text-3xl font-black">Knowledge Assessment</h2><p className="text-sm opacity-60">Test your understanding of advanced BF concepts.</p></div>
            </div>
            {finished ? (
                <div className={`text-center p-12 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="text-6xl mb-6">{score === qs.length ? '🏆' : '📚'}</div>
                    <h3 className="text-3xl font-black mb-2">Score: {score} / {qs.length}</h3>
                    <button onClick={() => { setCur(0); setScore(0); setSel(null); setFinished(false); }} className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold">Retry Quiz</button>
                </div>
            ) : (
                <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold opacity-50">Question {cur + 1} of {qs.length}</span>
                        <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-sm font-bold">Score: {score}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">
                        {q.opts.map((opt, i) => (
                            <button key={i} onClick={() => handlePick(i)} disabled={sel !== null}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    sel === null ? (isDark ? 'border-slate-800 hover:border-red-500' : 'border-slate-200 hover:border-red-500') :
                                    i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' :
                                    sel === i ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40 border-transparent'
                                }`}><span className="font-mono mr-3 opacity-60">{String.fromCharCode(65 + i)}.</span>{opt}</button>
                        ))}
                    </div>
                    <AnimatePresence>
                        {sel !== null && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 p-4 rounded-xl text-sm leading-relaxed ${sel === q.ans ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                <strong className="block mb-1">{sel === q.ans ? '✅ Correct' : '❌ Incorrect'}</strong>{q.why}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

// ============================== MAIN APP SHELL ==============================

export default function App() {
    const [activeTab, setActiveTab] = useState('simulator');
    const [isDark, setIsDark] = useState(true);

    const tabs = [
        { id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4"/> },
        { id: 'simulator', label: 'Simulator Matrix', icon: <MonitorPlay className="w-4 h-4"/> },
        { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4"/> }
    ];

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#0f172a] text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
            <PageSEO 
                title="Breaker Failure Protection (ANSI 50BF) | RelaySchool"
                description="Interactive IEEE C37.119 simulator for breaker failure protection. Explore BFI, retrip logic, and DC subsidence effects."
                url="/breakerfailure"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "RelaySchool BFGuard PRO",
                    "applicationCategory": "EducationalApplication",
                    "description": "High-fidelity breaker failure protection simulator for substation engineers."
                }}
            />
            <style dangerouslySetInnerHTML={{__html: `
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}} />

            <header className={`h-16 shrink-0 flex items-center justify-between px-6 z-20 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-red-600 to-rose-600 p-2 rounded-xl text-white shadow-lg shadow-red-500/20"><Timer className="w-6 h-6"/></div>
                    <div><h1 className="font-black text-xl tracking-tight leading-none">BF<span className="text-red-500">Guard</span> PRO</h1><span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">IEEE C37.119 Simulator</span></div>
                </div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark ? 'bg-[#020617] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-red-400' : 'bg-white text-red-600 shadow-sm') : 'opacity-50 hover:opacity-100'}`}>
                            {t.icon}<span>{t.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-lg border transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'}`}><Power className="w-5 h-5" /></button>
            </header>

            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab === t.id ? 'text-red-500 bg-red-500/5' : 'opacity-50'}`}>
                        {t.icon}<span>{t.label}</span>
                    </button>
                ))}
            </div>

            <main className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <div className="h-full overflow-y-auto"><TheoryModule isDark={isDark} /></div>}
                {activeTab === 'simulator' && <SimulatorModule isDark={isDark} />}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </main>
        </div>
    );
}