import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    RotateCcw, Book, MonitorPlay, GraduationCap, 
    Award, Layers, Zap, AlertTriangle, Activity, 
    ShieldCheck, Share2, Settings, Power, Maximize2, 
    PlayCircle, CheckCircle2, Info, ArrowRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';
import PageSEO from '../components/SEO/PageSEO';

// ============================== ENGINEERING CONSTANTS & STANDARDS ==============================

const IEEE_STANDARDS = {
    slope1: 0.3,      // 30% slope for minor CT mismatch
    slope2: 0.7,      // 70% slope for severe CT saturation
    breakpoint: 2000, // Amps (where Slope 2 begins)
    minOp: 200        // Amps (minimum pickup)
};

// ============================== SCENARIO DEFINITIONS ==============================
// Covers 100% of standard testing scenarios for 87B commissioning

const SCENARIOS = {
    normal: {
        id: 'normal',
        name: 'Steady State (Normal Load)',
        icon: <Activity className="w-4 h-4 text-emerald-500"/>,
        steps: [
            {
                state: 'NORMAL', duration: 0,
                what: "System is operating under normal load conditions.",
                why: "Kirchhoff's Current Law (KCL) is balanced. The sum of currents entering the bus exactly matches the currents leaving. I_diff is ~0A. The relay remains in standby."
            }
        ]
    },
    internal: {
        id: 'internal',
        name: 'Solid Internal Bus Fault',
        icon: <Zap className="w-4 h-4 text-red-500"/>,
        steps: [
            { state: 'NORMAL', duration: 1500, what: "Normal load conditions.", why: "Pre-fault steady state." },
            { state: 'INTERNAL', duration: 1000, what: "A phase-to-ground fault occurs directly on the busbar.", why: "All local sources feed into the fault. Current leaving the bus drops to zero. I_diff spikes massively, equaling I_restraint." },
            { state: 'TRIPPED', duration: 0, what: "Relay trips all bus breakers (< 1 cycle).", why: "The operating point vertically bypassed the characteristic curve. Fast tripping isolates the bus, preventing catastrophic equipment destruction." }
        ]
    },
    external: {
        id: 'external',
        name: 'External Through-Fault',
        icon: <ShieldCheck className="w-4 h-4 text-amber-500"/>,
        steps: [
            { state: 'NORMAL', duration: 1500, what: "Normal load conditions.", why: "Pre-fault steady state." },
            { state: 'EXTERNAL', duration: 3000, what: "A severe fault occurs down the line on Feeder 2.", why: "Massive fault current flows THROUGH the busbar. Because it enters and leaves, KCL remains balanced (I_diff ≈ 0A). I_restraint moves far to the right." },
            { state: 'EXTERNAL_CLEARED', duration: 0, what: "Feeder 2's distance relay clears the fault.", why: "The 87B relay successfully restrained. This proves the security of the differential scheme." }
        ]
    },
    saturation: {
        id: 'saturation',
        name: 'External Fault with CT Saturation',
        icon: <AlertTriangle className="w-4 h-4 text-orange-500"/>,
        steps: [
            { state: 'NORMAL', duration: 1500, what: "Normal load conditions.", why: "Pre-fault steady state." },
            { state: 'EXTERNAL', duration: 1000, what: "Heavy external fault on Feeder 2 with high DC offset.", why: "The DC offset pushes the magnetic flux of Feeder 2's CT into saturation." },
            { state: 'SATURATION', duration: 2500, what: "Feeder 2 CT saturates, creating false differential current.", why: "The saturated CT fails to reproduce the full secondary current. The relay 'sees' an imbalance (I_diff rises). However, because I_restraint is massive, the operating point falls into the highly secure 'Slope 2' region. The relay correctly restrains!" },
            { state: 'EXTERNAL_CLEARED', duration: 0, what: "External fault cleared by downstream relay.", why: "System returns to normal. Dual-slope characteristic successfully prevented a false bus trip." }
        ]
    },
    evolving: {
        id: 'evolving',
        name: 'Evolving Fault (Ext → Int)',
        icon: <Layers className="w-4 h-4 text-purple-500"/>,
        steps: [
            { state: 'NORMAL', duration: 1500, what: "Normal load conditions.", why: "Pre-fault steady state." },
            { state: 'EXTERNAL', duration: 1500, what: "Fault starts outside the zone on a feeder.", why: "Relay restrains properly as through-current is balanced." },
            { state: 'INTERNAL', duration: 1000, what: "The high fault current causes the feeder breaker bushing to flash over, moving the fault INSIDE the bus zone.", why: "Current leaving the zone vanishes. I_diff spikes instantly. The relay detects the evolution from restraint to operate." },
            { state: 'TRIPPED', duration: 0, what: "87B issues an immediate trip.", why: "Dynamic zone evaluation ensures that even if a fault begins externally, an evolution into the bus zone is cleared instantly." }
        ]
    },
    ct_open: {
        id: 'ct_open',
        name: 'CT Open Circuit (Wire Break)',
        icon: <X className="w-4 h-4 text-slate-500"/>,
        steps: [
            { state: 'NORMAL', duration: 1500, what: "Normal load conditions.", why: "Pre-fault steady state." },
            { state: 'CT_OPEN', duration: 2500, what: "A secondary wire to Incomer 1's CT accidentally breaks or is disconnected.", why: "The relay reads 0A from Incomer 1, but load current is still physically flowing. This creates a false I_diff." },
            { state: 'CT_OPEN_TRIP', duration: 0, what: "Relay trips (or blocks, depending on settings).", why: "Because I_restraint is low (normal load), the false I_diff easily crosses the minimum pickup and Slope 1. Modern relays often use a 'CT Supervision' algorithm to block this trip and alarm instead, but a raw 87B element will trip." }
        ]
    }
};

// ============================== MATH & WAVEFORM ENGINE ==============================

const generateWaveforms = (state, timeWindow = 0.05, sampleRate = 1000) => {
    const data = [];
    const omega = 2 * Math.PI * 60; // 60Hz
    const dt = timeWindow / sampleRate;

    for (let t = 0; t <= timeWindow; t += dt) {
        let pt = { time: (t * 1000).toFixed(1) };
        const dcOffset = Math.exp(-t / 0.015);
        
        switch(state) {
            case 'NORMAL':
            case 'EXTERNAL_CLEARED':
                pt.i1 = 800 * Math.sin(omega * t);
                pt.i2 = -800 * Math.sin(omega * t);
                break;
            case 'EXTERNAL':
                pt.i1 = 4000 * Math.sin(omega * t - Math.PI/4) + 4000 * dcOffset;
                pt.i2 = -4000 * Math.sin(omega * t - Math.PI/4) - 4000 * dcOffset;
                break;
            case 'SATURATION':
                pt.i1 = 4000 * Math.sin(omega * t - Math.PI/4) + 4000 * dcOffset;
                // Saturated waveform: chops off the peak
                let rawI2 = -4000 * Math.sin(omega * t - Math.PI/4) - 4000 * dcOffset;
                pt.i2 = Math.abs(rawI2) > 1500 ? Math.sign(rawI2) * 1500 : rawI2; 
                break;
            case 'INTERNAL':
                pt.i1 = 3000 * Math.sin(omega * t - Math.PI/4) + 3000 * dcOffset;
                pt.i2 = 2500 * Math.sin(omega * t - Math.PI/4) + 2500 * dcOffset;
                break;
            case 'CT_OPEN':
                pt.i1 = 0; // Wire broken
                pt.i2 = -800 * Math.sin(omega * t);
                break;
            case 'TRIPPED':
            case 'CT_OPEN_TRIP':
                pt.i1 = 0; pt.i2 = 0;
                break;
            default:
                pt.i1 = 0; pt.i2 = 0;
        }
        pt.idiff = Math.abs(pt.i1 + pt.i2);
        data.push(pt);
    }
    return data;
};

const generateCharacteristic = () => {
    const data = [];
    for (let ir = 0; ir <= 10000; ir += 100) {
        let iop = IEEE_STANDARDS.minOp;
        if (ir > 500 && ir <= IEEE_STANDARDS.breakpoint) {
            iop = Math.max(IEEE_STANDARDS.minOp, ir * IEEE_STANDARDS.slope1);
        } else if (ir > IEEE_STANDARDS.breakpoint) {
            iop = (IEEE_STANDARDS.breakpoint * IEEE_STANDARDS.slope1) + ((ir - IEEE_STANDARDS.breakpoint) * IEEE_STANDARDS.slope2);
        }
        data.push({ ir, opThreshold: iop });
    }
    return data;
};

// ============================== COMPONENTS ==============================

const SLDCanvas = ({ state, currentData, isDark }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        const w = cvs.width = cvs.offsetWidth * 2;
        const h = cvs.height = cvs.offsetHeight * 2;
        ctx.scale(2, 2);
        const cw = w / 2, ch = h / 2;

        const colors = {
            bg: isDark ? '#020617' : '#f8fafc',
            bus: (state === 'INTERNAL' || state === 'CT_OPEN_TRIP') && state !== 'TRIPPED' ? '#ef4444' : (state.includes('TRIP') ? '#64748b' : '#3b82f6'),
            text: isDark ? '#94a3b8' : '#475569',
            breakerClosed: '#ef4444', 
            breakerOpen: '#22c55e',   
            ct: '#f59e0b',
            ctBroken: '#ef4444'
        };

        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, cw, ch);

        // 87B Zone (Dashed)
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeRect(cw * 0.1, ch * 0.25, cw * 0.8, ch * 0.5);
        ctx.setLineDash([]);
        
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText('87B DIFFERENTIAL ZONE', cw * 0.12, ch * 0.25 + 15);

        // Busbar
        ctx.fillStyle = colors.bus;
        const busY = ch * 0.5;
        ctx.fillRect(cw * 0.15, busY - 4, cw * 0.7, 8);

        // Feeders Builder
        const drawFeeder = (x, dir, label, amps, isFaulted, isCTBroken) => {
            const startY = dir === 'up' ? ch * 0.1 : ch * 0.9;
            const isTripped = state.includes('TRIP');
            
            // Line
            ctx.strokeStyle = isTripped ? '#64748b' : colors.text;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, busY);
            ctx.stroke();

            // CB
            const cbY = dir === 'up' ? busY - 40 : busY + 40;
            ctx.fillStyle = isTripped ? colors.breakerOpen : colors.breakerClosed;
            ctx.fillRect(x - 8, cbY - 8, 16, 16);
            ctx.strokeStyle = colors.bg;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 8, cbY - 8, 16, 16);

            // CT
            const ctY = dir === 'up' ? busY - 20 : busY + 20;
            ctx.strokeStyle = isCTBroken ? colors.ctBroken : colors.ct;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x - 5, ctY, 5, 0, Math.PI, dir === 'up');
            ctx.arc(x + 5, ctY, 5, Math.PI, 0, dir === 'up');
            ctx.stroke();

            if (isCTBroken) {
                ctx.strokeStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(x - 10, ctY - 10); ctx.lineTo(x + 10, ctY + 10);
                ctx.moveTo(x + 10, ctY - 10); ctx.lineTo(x - 10, ctY + 10);
                ctx.stroke();
            }

            // Label & Amps
            ctx.fillStyle = colors.text;
            ctx.textAlign = 'center';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillText(label, x, startY + (dir === 'up' ? -10 : 20));
            
            ctx.fillStyle = isFaulted ? '#ef4444' : (isTripped ? colors.text : '#22c55e');
            ctx.fillText(`${amps} A`, x, startY + (dir === 'up' ? 5 : 35));

            // Ext Fault icon
            if (isFaulted && (state === 'EXTERNAL' || state === 'SATURATION')) {
                ctx.fillStyle = '#ef4444';
                ctx.font = '20px sans-serif';
                ctx.fillText('⚡', x + 15, startY + (dir === 'up' ? 0 : 20));
            }
        };

        drawFeeder(cw * 0.3, 'up', 'INC 1', currentData.i1, state === 'INTERNAL', state === 'CT_OPEN' || state === 'CT_OPEN_TRIP');
        drawFeeder(cw * 0.5, 'up', 'INC 2', currentData.i2, state === 'INTERNAL', false);
        drawFeeder(cw * 0.4, 'down', 'LOAD 1', currentData.load1, false, false);
        drawFeeder(cw * 0.7, 'down', 'LOAD 2', currentData.load2, state === 'EXTERNAL' || state === 'SATURATION', state === 'SATURATION');

        // Internal Fault indicator
        if (state === 'INTERNAL') {
            ctx.fillStyle = '#ef4444';
            ctx.font = '30px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', cw * 0.5, busY + 10);
            ctx.fillStyle = 'rgba(239,68,68,0.2)';
            ctx.beginPath();
            ctx.arc(cw * 0.5, busY, 25, 0, Math.PI * 2);
            ctx.fill();
        }

    }, [state, currentData, isDark]);

    return <canvas ref={canvasRef} className="w-full h-full rounded-xl" style={{ minHeight: '260px' }} />;
};

// ============================== MAIN SIMULATOR MODULE ==============================

const SimulatorModule = ({ isDark }) => {
    const [activeScenarioId, setActiveScenarioId] = useState('normal');
    const [stepIdx, setStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const scenario = SCENARIOS[activeScenarioId];
    const currentStep = scenario.steps[stepIdx];
    const simState = currentStep.state;

    // Derived values mapped to physical states
    const currentData = useMemo(() => {
        switch(simState) {
            case 'NORMAL': 
            case 'EXTERNAL_CLEARED': return { i1: 800, i2: 600, load1: 900, load2: 500 };
            case 'EXTERNAL': return { i1: 4000, i2: 3000, load1: 500, load2: 6500 };
            case 'SATURATION': return { i1: 4000, i2: 3000, load1: 500, load2: 3000 }; // Saturated reading drops
            case 'INTERNAL': return { i1: 5000, i2: 4500, load1: 0, load2: 0 };
            case 'CT_OPEN': return { i1: 0, i2: 600, load1: 900, load2: 500 }; // Physical current flows, CT reads 0
            case 'TRIPPED': 
            case 'CT_OPEN_TRIP': return { i1: 0, i2: 0, load1: 0, load2: 0 };
            default: return { i1: 0, i2: 0, load1: 0, load2: 0 };
        }
    }, [simState]);

    const { i_in, i_out, i_diff, i_res } = useMemo(() => {
        const _in = currentData.i1 + currentData.i2;
        const _out = currentData.load1 + currentData.load2;
        return { i_in: _in, i_out: _out, i_diff: Math.abs(_in - _out), i_res: _in + _out };
    }, [currentData]);
    
    const waveformData = useMemo(() => generateWaveforms(simState), [simState]);
    const charData = useMemo(() => generateCharacteristic(), []);

    // Playback Engine
    useEffect(() => {
        if (isPlaying && stepIdx < scenario.steps.length - 1) {
            const timer = setTimeout(() => {
                setStepIdx(s => s + 1);
            }, scenario.steps[stepIdx].duration);
            return () => clearTimeout(timer);
        } else if (isPlaying && stepIdx === scenario.steps.length - 1) {
            setIsPlaying(false);
        }
    }, [isPlaying, stepIdx, scenario.steps]);

    const handleSelectScenario = (id) => {
        setIsPlaying(false);
        setActiveScenarioId(id);
        setStepIdx(0);
    };

    const runSimulation = () => {
        setStepIdx(0);
        setIsPlaying(true);
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-4 p-4 animate-fade-in overflow-y-auto">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-4 w-full lg:w-5/12">
                
                {/* Scenario Selector */}
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-blue-500" /> Scenario Matrix</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {Object.values(SCENARIOS).map(sc => (
                            <button 
                                key={sc.id} 
                                onClick={() => handleSelectScenario(sc.id)}
                                disabled={isPlaying}
                                className={`flex items-center gap-2 p-3 rounded-xl text-left text-xs font-bold transition-all border ${
                                    activeScenarioId === sc.id 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                                    : isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 opacity-70' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                                }`}
                            >
                                {sc.icon} {sc.name}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={runSimulation} 
                        disabled={isPlaying || scenario.steps.length === 1}
                        className="w-full p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                        {isPlaying ? <span className="animate-pulse">Running Simulation...</span> : <><PlayCircle className="w-5 h-5" /> Execute Simulation</>}
                    </button>
                </div>

                {/* Narrative Engine (What & Why) */}
                <div className={`p-6 rounded-2xl border relative overflow-hidden flex-1 ${isDark ? 'bg-[#0f172a] border-blue-900/30' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h3 className="font-black text-blue-500 mb-1 flex items-center gap-2"><Info className="w-5 h-5" /> Analytics Engine</h3>
                    <div className="text-xs opacity-60 font-bold mb-4 uppercase tracking-widest">{scenario.name} • Step {stepIdx + 1}/{scenario.steps.length}</div>
                    
                    <AnimatePresence mode="wait">
                        <motion.div key={stepIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <div className="mb-4">
                                <h4 className="font-bold text-sm mb-1 flex items-center gap-1"><ArrowRight className="w-3 h-3 text-amber-500"/> What is happening:</h4>
                                <p className="text-sm opacity-90 leading-relaxed">{currentStep.what}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm mb-1 flex items-center gap-1"><ArrowRight className="w-3 h-3 text-purple-500"/> Relay Physics (Why):</h4>
                                <p className="text-sm opacity-90 leading-relaxed">{currentStep.why}</p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Digital Meters */}
                <div className={`p-4 rounded-2xl border grid grid-cols-2 gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="text-center">
                        <div className="text-[10px] opacity-60 font-bold mb-1 uppercase tracking-widest">I_Operate (Idiff)</div>
                        <div className={`text-3xl font-mono font-black ${i_diff > 200 ? 'text-red-500' : 'text-emerald-500'}`}>{i_diff} <span className="text-sm">A</span></div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] opacity-60 font-bold mb-1 uppercase tracking-widest">I_Restraint (Ires)</div>
                        <div className="text-3xl font-mono font-black text-blue-500">{i_res} <span className="text-sm">A</span></div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-4 w-full lg:w-7/12">
                
                {/* SLD Canvas */}
                <div className={`h-64 rounded-2xl border relative overflow-hidden ${isDark ? 'bg-[#020617] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="absolute top-4 left-4 z-10 font-bold text-xs opacity-60 flex items-center gap-2"><Layers className="w-4 h-4"/> Single Line Diagram</div>
                    <SLDCanvas state={simState} currentData={currentData} isDark={isDark} />
                </div>

                <div className="flex gap-4 flex-col sm:flex-row h-64">
                    {/* Characteristic Curve */}
                    <div className={`flex-1 p-4 rounded-2xl border flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold text-xs mb-2 opacity-60 uppercase tracking-widest">Dual-Slope Characteristic</h3>
                        <div className="flex-1 min-h-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorOp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="ir" type="number" stroke={isDark ? '#475569' : '#cbd5e1'} fontSize={9} domain={[0, 10000]} tickCount={6} />
                                    <YAxis stroke={isDark ? '#475569' : '#cbd5e1'} fontSize={9} domain={[0, 4000]} tickCount={5} />
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                                    <Area type="monotone" dataKey="opThreshold" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOp)" isAnimationActive={false} />
                                    <ReferenceLine x={i_res} stroke="#f59e0b" strokeDasharray="3 3" />
                                    <ReferenceLine y={i_diff} stroke="#f59e0b" strokeDasharray="3 3" />
                                </AreaChart>
                            </ResponsiveContainer>
                            {/* Operating Point */}
                            {!simState.includes('TRIP') && (
                                <div className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,1)] z-10 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300" 
                                     style={{ 
                                        left: `calc(35px + (100% - 45px) * (${Math.min(i_res, 10000)} / 10000))`, 
                                        bottom: `calc(20px + (100% - 30px) * (${Math.min(i_diff, 4000)} / 4000))` 
                                     }} 
                                />
                            )}
                        </div>
                    </div>

                    {/* Waveform Oscilloscope */}
                    <div className={`flex-1 p-4 rounded-2xl border flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold text-xs mb-2 opacity-60 uppercase tracking-widest">Transient Oscilloscope</h3>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={waveformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                                    <XAxis dataKey="time" stroke={isDark ? '#475569' : '#cbd5e1'} fontSize={9} tickFormatter={(v) => `${v}ms`} />
                                    <YAxis stroke={isDark ? '#475569' : '#cbd5e1'} fontSize={9} />
                                    <Line type="monotone" dataKey="i1" stroke="#3b82f6" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="i2" stroke="#f59e0b" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="idiff" stroke="#ef4444" dot={false} strokeWidth={2} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================== THEORY & QUIZ MODULES ==============================

const TheoryModule = ({ isDark }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-500/10 rounded-2xl"><Book className="w-8 h-8 text-blue-500" /></div>
            <div><h2 className="text-3xl font-black">IEEE C37.234 Reference</h2><p className="text-sm opacity-60">Complete theoretical handbook for Busbar Differential Protection.</p></div>
        </div>
        <div className="grid gap-6">
            {[
                { title: "1. Introduction to Busbar Protection (87B)", content: "Busbars are the critical nodes of power systems. A fault here is rare but carries catastrophic consequences, leading to wide-scale blackouts and severe equipment damage. Per IEEE C37.234, bus differential protection must be extremely fast (< 1 cycle) and exceptionally secure against false tripping." },
                { title: "2. Kirchhoff's Current Law (The Core Principle)", content: "87B protection operates on a simple principle: the sum of all currents entering a bus must equal the sum of all currents leaving it. \n\n• I_operate = | Σ I_in - Σ I_out | (Phasor sum)\n• I_restraint = Σ | I_in | + Σ | I_out | (Scalar sum)\n\nUnder normal conditions, I_operate is near zero. During an internal bus fault, all sources feed the fault, and I_operate becomes massive." },
                { title: "3. The Dual-Slope Characteristic", content: "Current Transformers (CTs) are not perfect. During heavy external faults, DC offset can cause CT saturation, resulting in false differential current. Modern numerical relays use a dual-slope characteristic:\n\n• Minimum Pickup: Ensures sensitivity to low-level faults.\n• Slope 1: Accommodates normal CT ratio mismatches.\n• Slope 2 (Steeper): Provides immense security against false differential currents caused by severe CT saturation during heavy through-faults." },
                { title: "4. CT Saturation & Evolving Faults", content: "• CT Saturation: When a core saturates, secondary current drops. The 'Simulator' tab demonstrates how the relay's operating point shifts but remains restrained under Slope 2.\n• Evolving Faults: A fault starts outside the zone (restraint), but equipment failure causes it to flash over onto the bus (operate). The relay must detect this transition instantly." }
            ].map((section, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-4 text-blue-500">{section.title}</h3>
                    <p className="whitespace-pre-wrap leading-relaxed opacity-90">{section.content}</p>
                </div>
            ))}
        </div>
    </div>
);

const QuizModule = ({ isDark }) => {
    const [score, setScore] = useState(0); const [cur, setCur] = useState(0);
    const [sel, setSel] = useState(null); const [finished, setFinished] = useState(false);

    const questions = [
        { q: "A severe external fault causes a feeder CT to saturate. What prevents the 87B relay from issuing a false trip?", opts: ["Slope 1", "Slope 2 (High restraint region)", "Minimum Pickup", "Underfrequency element"], ans: 1, why: "Slope 2 requires a much higher differential current to trip when restraint currents are massive, securing against CT saturation." },
        { q: "An 'Evolving Fault' in busbar protection refers to:", opts: ["A fault whose frequency changes", "A fault that begins externally but flashes over into the bus zone", "A slowly developing overload", "A fault clearing itself"], ans: 1, why: "Evolving faults require the relay to transition from a highly restrained state to an immediate trip state." },
        { q: "If a CT secondary wire accidentally breaks during normal load (Open CT), what happens?", opts: ["The relay reads 0A differential", "A false differential current is created, potentially causing a trip", "The breaker physically opens automatically", "Voltage increases"], ans: 1, why: "The physical current still flows, but the relay reads 0 from that branch, breaking the KCL balance and generating I_diff." }
    ];
    const q = questions[cur];

    const handlePick = (i) => {
        if (sel !== null) return;
        setSel(i);
        if (i === q.ans) setScore(s => s + 1);
        setTimeout(() => {
            if (cur + 1 >= questions.length) setFinished(true);
            else { setCur(c => c + 1); setSel(null); }
        }, 3000);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-purple-500/10 rounded-2xl"><Award className="w-8 h-8 text-purple-500" /></div>
                <div><h2 className="text-3xl font-black">Knowledge Assessment</h2><p className="text-sm opacity-60">Test your understanding of complex protection scenarios.</p></div>
            </div>
            {finished ? (
                <div className={`text-center p-12 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="text-6xl mb-6">{score === questions.length ? '🏆' : '📚'}</div>
                    <h3 className="text-3xl font-black mb-2">Score: {score} / {questions.length}</h3>
                    <button onClick={() => { setCur(0); setScore(0); setSel(null); setFinished(false); }} className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold">Retry Quiz</button>
                </div>
            ) : (
                <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold opacity-50">Question {cur + 1} of {questions.length}</span>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-bold">Score: {score}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">
                        {q.opts.map((opt, i) => (
                            <button key={i} onClick={() => handlePick(i)} disabled={sel !== null}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    sel === null ? (isDark ? 'border-slate-800 hover:border-blue-500' : 'border-slate-200 hover:border-blue-500') :
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

// ============================== APP SHELL ==============================

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
                title="Busbar Protection Simulator (ANSI 87B) | RelaySchool"
                description="Professional IEEE C37.234 bus differential simulator. Test internal bus faults, external through-faults, and CT saturation security."
                url="/busbarprotection"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "RelaySchool BusGuard PRO",
                    "applicationCategory": "EducationalApplication",
                    "description": "Interactive busbar differential protection simulator with dual-slope characteristic and transient oscilloscope."
                }}
            />
            <style dangerouslySetInnerHTML={{__html: `
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}} />

            <header className={`h-16 shrink-0 flex items-center justify-between px-6 z-20 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20"><Layers className="w-6 h-6"/></div>
                    <div><h1 className="font-black text-xl tracking-tight leading-none">Bus<span className="text-blue-500">Guard</span> PRO</h1><span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">IEEE Scenario Engine</span></div>
                </div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark ? 'bg-[#020617] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600 shadow-sm') : 'opacity-50 hover:opacity-100'}`}>
                            {t.icon}<span>{t.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-lg border transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'}`}><Power className="w-5 h-5" /></button>
            </header>

            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab === t.id ? 'text-blue-500 bg-blue-500/5' : 'opacity-50'}`}>
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