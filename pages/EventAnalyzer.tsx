import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Activity, AlertTriangle, Zap, Power, RotateCcw,
    Settings, Download, FileText, Database, ShieldCheck,
    Cpu, BookOpen, AlertOctagon, CheckCircle2, X,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Share2, Upload,
    Maximize2, Sliders, LineChart as ChartIcon, Navigation,
    PlayCircle, StopCircle, Info, BookText, TrendingUp, Wrench, FileUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import PageSEO from '../components/SEO/PageSEO';
import { parseCOMTRADEConfig } from '../services/mathEngine';

// --- INDUSTRIAL STANDARDS & CONSTANTS ---
const ANSI_CODES = {
    '50P': { name: 'Phase Instantaneous Overcurrent', desc: 'No intentional delay. Operates for high magnitude short circuits.' },
    '51P': { name: 'Phase Time Overcurrent', desc: 'Inverse time delay. Coordinates with downstream fuses/breakers.' },
    '50G': { name: 'Ground Instantaneous', desc: 'Fast ground fault protection using zero-sequence current.' },
    '51G': { name: 'Ground Time Overcurrent', desc: 'Sensitive, delayed ground fault protection.' },
    '52':  { name: 'AC Circuit Breaker', desc: 'The physical switching device.' },
    '86':  { name: 'Lockout Relay', desc: 'Prevents automatic reclosing until manual inspection.' }
};

// IEEE C37.112 Standard Inverse Curve Constants
const CURVES = {
    'IEEE Moderately Inverse': { A: 0.0515, B: 0.1140, P: 0.02 },
    'IEEE Very Inverse':       { A: 19.61,  B: 0.491,  P: 2.0 },
    'IEEE Extremely Inverse':  { A: 28.2,   B: 0.1217, P: 2.0 }
};

// --- SIMULATION ENGINE ---
// Helper to calculate trip time based on IEEE curves
const calculateTripTime = (M, curveName, timeDial) => {
    if (M <= 1.0) return Infinity; // Below pickup
    const curve = CURVES[curveName] || CURVES['IEEE Extremely Inverse'];
    return timeDial * ((curve.A / (Math.pow(M, curve.P) - 1)) + curve.B);
};

// Complex Math for Phasors
const toRad = (deg) => deg * (Math.PI / 180);

export default function App() {
    // --- SYSTEM STATE ---
    const [systemState, setSystemState] = useState('NORMAL'); // NORMAL, FAULT, TRIPPED
    const [isPowered, setIsPowered] = useState(true);
    const [time, setTime] = useState(0); // Simulation time in ms

    // --- RELAY SETTINGS ---
    const [settings, setSettings] = useState({
        ctRatio: 120, // 600/5 = 120
        ptRatio: 60,  // 7200/120 = 60
        pickup51P: 4.0, // Secondary Amps
        timeDial51P: 2.0,
        curve51P: 'IEEE Extremely Inverse',
        pickup50P: 30.0, // Secondary Amps
        enabled50: true,
        enabled51: true
    });

    // --- ELECTRICAL MODEL (Primary Values) ---
    const defaultLoad = {
        va: { mag: 7200, ang: 0 },   vb: { mag: 7200, ang: -120 }, vc: { mag: 7200, ang: 120 },
        ia: { mag: 200, ang: -15 },  ib: { mag: 200, ang: -135 },  ic: { mag: 200, ang: 105 }
    };
    
    const [electricalData, setElectricalData] = useState(defaultLoad);
    const [activeFault, setActiveFault] = useState(null);

    // --- RELAY HARDWARE STATE ---
    const [breakerClosed, setBreakerClosed] = useState(true);
    const [leds, setLeds] = useState({ 
        enabled: true, 
        trip: false, 
        pickup: false,
        inst50: false,
        time51: false,
        alarm: false 
    });
    const [eventLog, setEventLog] = useState([]);
    const [oscillography, setOscillography] = useState(null);

    // --- HMI (Front Panel) STATE ---
    const [hmiText, setHmiText] = useState([]);
    const [cursorRow, setCursorRow] = useState(0);
    const [currentMenu, setCurrentMenu] = useState('HOME');
    const [menuStack, setMenuStack] = useState([]);

    // --- UI VIEW STATE ---
    const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, SETTINGS, PHASORS, COMTRADE, THEORY
    const [showGuide, setShowGuide] = useState(true);

    // --- COMTRADE FILE UPLOAD STATE ---
    const [comtradeFile, setComtradeFile] = useState<{config: any; fileName: string} | null>(null);
    const comtradeInputRef = useRef<HTMLInputElement>(null);

    // --- AUTO TRAINING STATE ---
    const [autoState, setAutoState] = useState({ active: false, message: '' });
    const autoStepTimeout = useRef(null);

    // --- PROTECTION LOGIC ACCUMULATORS ---
    const accumulators = useRef({ phaseA: 0, phaseB: 0, phaseC: 0 });
    const simulationInterval = useRef(null);

    // Provide a ref to state for async functions
    const stateRefs = useRef({ breakerClosed, isPowered, leds });
    useEffect(() => {
        stateRefs.current = { breakerClosed, isPowered, leds };
    }, [breakerClosed, isPowered, leds]);

    // --- SIMULATION LOOP ---
    useEffect(() => {
        if (!isPowered) {
            setSystemState('OFF');
            clearInterval(simulationInterval.current);
            return;
        }

        const TICK_RATE_MS = 16; // ~60fps logic tick

        simulationInterval.current = setInterval(() => {
            if (systemState === 'FAULT') {
                setTime(t => t + TICK_RATE_MS);
                
                // Get maximum secondary phase current
                const iA_sec = electricalData.ia.mag / settings.ctRatio;
                const iB_sec = electricalData.ib.mag / settings.ctRatio;
                const iC_sec = electricalData.ic.mag / settings.ctRatio;
                const maxI = Math.max(iA_sec, iB_sec, iC_sec);

                // Check Pickup LED
                if (maxI > settings.pickup51P && !leds.pickup) {
                    setLeds(prev => ({ ...prev, pickup: true }));
                }

                // 50P Instantaneous Evaluation
                if (settings.enabled50 && maxI >= settings.pickup50P) {
                    executeTrip('50P - Instantaneous', maxI);
                    return;
                }

                // 51P Inverse Time Evaluation
                if (settings.enabled51) {
                    let tripped = false;
                    ['A', 'B', 'C'].forEach(phase => {
                        const iPhase = electricalData[`i${phase.toLowerCase()}`].mag / settings.ctRatio;
                        const M = iPhase / settings.pickup51P;
                        if (M > 1.0) {
                            const tTrip = calculateTripTime(M, settings.curve51P, settings.timeDial51P) * 1000; // in ms
                            accumulators.current[`phase${phase}`] += TICK_RATE_MS / tTrip;
                            if (accumulators.current[`phase${phase}`] >= 1.0) {
                                tripped = true;
                            }
                        } else {
                            // Reset accumulator slowly if fault cleared before trip
                            accumulators.current[`phase${phase}`] = Math.max(0, accumulators.current[`phase${phase}`] - 0.05);
                        }
                    });

                    if (tripped) {
                        executeTrip('51P - Time Overcurrent', maxI);
                    }
                }
            } else if (systemState === 'TRIPPED') {
                // Decay accumulators
                ['A', 'B', 'C'].forEach(p => accumulators.current[`phase${p}`] = 0);
            }
        }, TICK_RATE_MS);

        return () => clearInterval(simulationInterval.current);
    }, [systemState, electricalData, settings, leds]);

    // --- ACTIONS ---

    const executeTrip = (element, currentMagSec) => {
        setSystemState('TRIPPED');
        setBreakerClosed(false);
        setLeds(prev => ({
            ...prev,
            trip: true,
            inst50: element.includes('50P'),
            time51: element.includes('51P')
        }));

        const primaryAmps = (currentMagSec * settings.ctRatio).toFixed(0);
        
        // Zero out current (breaker opened)
        setElectricalData(prev => ({
            ...prev,
            ia: { ...prev.ia, mag: 0 },
            ib: { ...prev.ib, mag: 0 },
            ic: { ...prev.ic, mag: 0 },
        }));

        // Log Event
        const newEvent = {
            id: eventLog.length + 101,
            time: new Date().toISOString().slice(11, 23),
            element,
            mag: `${primaryAmps} A`,
            cycles: (time / 16.67).toFixed(1)
        };
        setEventLog([newEvent, ...eventLog]);

        // Generate Transient Oscillography
        generateOscillography(activeFault, currentMagSec * settings.ctRatio, time);
        setActiveFault(null);
    };

    const generateOscillography = (faultType, peakAmps, tripTimeMs) => {
        const data = [];
        const sampleRate = 32; // samples per cycle
        const freq = 60;
        const totalCycles = Math.ceil((tripTimeMs + 50) / 16.67) + 2; // Pre-fault + fault + post-fault
        
        for (let i = 0; i < totalCycles * sampleRate; i++) {
            const t = i / (sampleRate * freq);
            const ms = t * 1000;
            const isFaultActive = ms > 33 && ms < (33 + tripTimeMs); // 2 cycles pre-fault
            const isTripped = ms >= (33 + tripTimeMs);

            // Base load
            let ia = 200 * Math.sin(2 * Math.PI * freq * t - toRad(15));
            let ib = 200 * Math.sin(2 * Math.PI * freq * t - toRad(135));
            let ic = 200 * Math.sin(2 * Math.PI * freq * t - toRad(255));
            let va = 7200 * Math.sin(2 * Math.PI * freq * t);

            if (isFaultActive) {
                // Apply fault multipliers and DC offset (decaying exponential)
                const dcOffset = Math.exp(-(ms-33)/40); 
                if (faultType === 'A-G' || faultType === '3-Phase') ia = peakAmps * Math.sin(2 * Math.PI * freq * t - toRad(75)) + (peakAmps * dcOffset);
                if (faultType === 'B-C' || faultType === '3-Phase') ib = peakAmps * Math.sin(2 * Math.PI * freq * t - toRad(195)) + (peakAmps * 0.5 * dcOffset);
                if (faultType === 'B-C' || faultType === '3-Phase') ic = peakAmps * Math.sin(2 * Math.PI * freq * t - toRad(315));
                if (faultType === 'A-G') va = 1000 * Math.sin(2 * Math.PI * freq * t - toRad(10)); // Voltage sag
            }

            if (isTripped) {
                ia = 0; ib = 0; ic = 0;
            }

            data.push({
                time: ms.toFixed(1),
                IA: ia, IB: ib, IC: ic, VA: va,
                TripDigital: isTripped ? 1 : 0
            });
        }
        setOscillography(data);
    };

    const injectFault = (type) => {
        if (!stateRefs.current.isPowered) return alert("Relay is powered off.");
        if (!stateRefs.current.breakerClosed) return alert("Breaker is open. Cannot simulate fault. Reset and Close Breaker first.");
        if (stateRefs.current.leds.trip) return alert("Relay is in Lockout (86). Press Target Reset.");

        setTime(0);
        setSystemState('FAULT');
        setActiveFault(type);

        // Modify Electrical Data based on fault type
        let faultI = 0;
        const newEq = JSON.parse(JSON.stringify(defaultLoad)); // Deep copy

        switch(type) {
            case 'A-G':
                faultI = 3500; // Primary Amps
                newEq.ia = { mag: faultI, ang: -75 }; // Lagging highly due to line inductance
                newEq.va = { mag: 1500, ang: -10 };   // Voltage sag
                break;
            case 'B-C':
                faultI = 5200;
                newEq.ib = { mag: faultI, ang: -165 };
                newEq.ic = { mag: faultI, ang: 15 };
                newEq.vb = { mag: 3000, ang: -150 };
                newEq.vc = { mag: 3000, ang: 150 };
                break;
            case '3-Phase':
                faultI = 8000;
                newEq.ia = { mag: faultI, ang: -75 };
                newEq.ib = { mag: faultI, ang: -195 };
                newEq.ic = { mag: faultI, ang: 45 };
                newEq.va = { mag: 500, ang: 0 };
                newEq.vb = { mag: 500, ang: -120 };
                newEq.vc = { mag: 500, ang: 120 };
                break;
        }
        setElectricalData(newEq);
    };

    const resetTargets = () => {
        setLeds(prev => ({ ...prev, trip: false, pickup: false, inst50: false, time51: false }));
        accumulators.current = { phaseA: 0, phaseB: 0, phaseC: 0 };
    };

    const closeBreaker = () => {
        if (stateRefs.current.leds.trip) return alert("SAFETY INTERLOCK: Cannot close breaker while Trip Target is active. Reset targets first.");
        setBreakerClosed(true);
        setSystemState('NORMAL');
        setElectricalData(defaultLoad);
        setOscillography(null);
        setTime(0);
    };

    // --- AUTO TRAINING LOGIC ---
    const runAutoSequence = () => {
        if (!isPowered) return alert("Please turn on relay power first.");
        setAutoState({ active: true, message: 'Step 1/5: System Normal. Observe the balanced 200A load currents.' });
        setActiveTab('DASHBOARD');
        
        if (!breakerClosed) {
            resetTargets();
            closeBreaker();
        }

        autoStepTimeout.current = setTimeout(() => {
            setAutoState({ active: true, message: 'Step 2/5: Injecting Line-to-Ground (A-G) Fault. Notice Phase A current spike & voltage sag.' });
            injectFault('A-G');
            
            autoStepTimeout.current = setTimeout(() => {
                setAutoState({ active: true, message: 'Step 3/5: Fault cleared by 51P (Time Delay). Resetting and reclosing breaker automatically...' });
                resetTargets();
                closeBreaker();

                autoStepTimeout.current = setTimeout(() => {
                    setAutoState({ active: true, message: 'Step 4/5: Injecting massive 3-Phase Fault. 50P (Instantaneous) will trip immediately.' });
                    injectFault('3-Phase');

                    autoStepTimeout.current = setTimeout(() => {
                        setAutoState({ active: false, message: 'Sequence Complete. Switch to the COMTRADE tab to analyze the recorded waveform!' });
                    }, 4000);

                }, 4000);
            }, 5000);
        }, 4000);
    };

    const stopAutoSequence = () => {
        clearTimeout(autoStepTimeout.current);
        setAutoState({ active: false, message: 'Auto Training Stopped manually.' });
    };

    // Cleanup timeouts
    useEffect(() => {
        return () => clearTimeout(autoStepTimeout.current);
    }, []);

    // --- HMI MENU LOGIC ---
    useEffect(() => {
        if (!isPowered) {
            setHmiText(['', '      POWER OFF', '', '']);
            return;
        }

        let lines = [];
        const ia = (electricalData.ia.mag / settings.ctRatio).toFixed(2);
        const ib = (electricalData.ib.mag / settings.ctRatio).toFixed(2);
        const ic = (electricalData.ic.mag / settings.ctRatio).toFixed(2);
        const pt = (electricalData.va.mag / settings.ptRatio).toFixed(1);

        switch (currentMenu) {
            case 'HOME':
                lines = ['> METERING', '  EVENTS', '  SETTINGS', '  STATUS']; break;
            case 'METERING':
                lines = ['> SEC CURRENTS (A)', '  PRI CURRENTS (A)', '  VOLTAGES (V)']; break;
            case 'MET_SEC_I':
                lines = [`  IA: ${ia} A`, `  IB: ${ib} A`, `  IC: ${ic} A`, `  IN: 0.00 A`]; break;
            case 'MET_PRI_I':
                lines = [`  IA: ${electricalData.ia.mag.toFixed(0)} A`, `  IB: ${electricalData.ib.mag.toFixed(0)} A`, `  IC: ${electricalData.ic.mag.toFixed(0)} A`]; break;
            case 'MET_V':
                lines = [`  VA: ${pt} V`, `  VB: ${(electricalData.vb.mag/settings.ptRatio).toFixed(1)} V`, `  VC: ${(electricalData.vc.mag/settings.ptRatio).toFixed(1)} V`]; break;
            case 'EVENTS':
                if (eventLog.length === 0) lines = ['  NO EVENTS'];
                else lines = eventLog.slice(0,4).map((e, i) => `${i===0?'>':' '} EV${e.id}: ${e.element}`);
                break;
            default: lines = ['  MENU ERROR'];
        }

        if (!['MET_SEC_I', 'MET_PRI_I', 'MET_V'].includes(currentMenu) && cursorRow >= lines.length) {
            setCursorRow(Math.max(0, lines.length - 1));
        }
        setHmiText(lines);
    }, [currentMenu, cursorRow, isPowered, electricalData, settings, eventLog]);

    const handleHmiKey = (key) => {
        if (!isPowered) return;
        
        if (key === 'UP') setCursorRow(p => p > 0 ? p - 1 : hmiText.length - 1);
        if (key === 'DOWN') setCursorRow(p => p < hmiText.length - 1 ? p + 1 : 0);
        if (key === 'ESC') {
            if (menuStack.length > 0) {
                const prev = menuStack[menuStack.length - 1];
                setMenuStack(menuStack.slice(0, -1));
                setCurrentMenu(prev);
                setCursorRow(0);
            }
        }
        if (key === 'ENT') {
            const line = hmiText[cursorRow] || "";
            const item = line.replace('>', '').trim();
            
            const pushMenu = (newMenu) => {
                setMenuStack([...menuStack, currentMenu]);
                setCurrentMenu(newMenu);
                setCursorRow(0);
            };

            if (currentMenu === 'HOME') {
                if (item === 'METERING') pushMenu('METERING');
                if (item === 'EVENTS') pushMenu('EVENTS');
            } else if (currentMenu === 'METERING') {
                if (item === 'SEC CURRENTS (A)') pushMenu('MET_SEC_I');
                if (item === 'PRI CURRENTS (A)') pushMenu('MET_PRI_I');
                if (item === 'VOLTAGES (V)') pushMenu('MET_V');
            }
        }
    };

    // --- RENDER HELPERS ---
    const getPhasorLines = () => {
        const center = 150;
        const scaleI = 100 / Math.max(0.1, electricalData.ia.mag, electricalData.ib.mag, electricalData.ic.mag);
        const scaleV = 100 / Math.max(0.1, electricalData.va.mag);

        const buildPhasor = (data, scale, color, label) => {
            if (data.mag < 1) return null; // Don't draw near-zero
            const r = data.mag * scale;
            const endX = center + r * Math.cos(toRad(data.ang));
            const endY = center - r * Math.sin(toRad(data.ang)); // SVG Y is down
            return (
                <g key={label}>
                    <line x1={center} y1={center} x2={endX} y2={endY} stroke={color} strokeWidth="3" markerEnd={`url(#arrow-${color})`} />
                    <text x={endX + (endX>center?5:-15)} y={endY + (endY>center?15:-5)} fill={color} fontSize="12" fontWeight="bold">{label}</text>
                </g>
            );
        };

        return [
            buildPhasor(electricalData.va, scaleV, '#ef4444', 'VA'), // Red
            buildPhasor(electricalData.vb, scaleV, '#eab308', 'VB'), // Yellow
            buildPhasor(electricalData.vc, scaleV, '#3b82f6', 'VC'), // Blue
            buildPhasor(electricalData.ia, scaleI, '#fca5a5', 'IA'), // Light Red
            buildPhasor(electricalData.ib, scaleI, '#fde047', 'IB'), // Light Yellow
            buildPhasor(electricalData.ic, scaleI, '#93c5fd', 'IC'), // Light Blue
        ];
    };

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 font-sans flex flex-col selection:bg-blue-900 selection:text-white overflow-x-hidden">
            <PageSEO 
                title="COMTRADE Event Analyzer & Fault Recorder | RelaySchool"
                description="Professional fault record analysis tool. Visualize transient oscillography, phasors, and protection element performance."
                url="/eventanalyzer"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "RelaySchool EventPRO",
                    "applicationCategory": "EducationalApplication",
                    "description": "Diagnostic tool for power system fault record analysis and protection validation."
                }}
            />
            
            {/* --- TOP NAVBAR --- */}
            <header className="bg-slate-900 border-b border-slate-800 shadow-xl z-50">
                <div className="max-w-[1600px] mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/30">
                            <Cpu className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                RelaySim <span className="text-blue-500">PRO</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Generic Microprocessor Architecture</span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3"/> System Ready
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={() => setShowGuide(!showGuide)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-slate-500 text-slate-300">
                            <BookOpen className="w-4 h-4" /> QUICK START
                        </button>
                    </div>
                </div>
            </header>

            {/* --- AUTO MODE EDUCATIONAL BANNER --- */}
            {autoState.message && (
                <div className={`transition-all duration-500 flex justify-center py-3 px-4 font-bold text-sm shadow-md border-b z-40 ${autoState.active ? 'bg-blue-900/40 text-blue-200 border-blue-700/50' : 'bg-emerald-900/40 text-emerald-200 border-emerald-700/50'}`}>
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <Info className={`w-5 h-5 ${autoState.active ? 'animate-pulse text-blue-400' : 'text-emerald-400'}`}/>
                        {autoState.message}
                    </div>
                </div>
            )}

            <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* --- LEFT COLUMN: PHYSICAL RELAY (HMI) --- */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    
                    {/* The Hardware Faceplate */}
                    <div className="bg-[#1f2937] p-2 rounded-2xl shadow-2xl border border-slate-700 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800"></div>
                        <div className="bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] rounded-xl border border-black p-6 shadow-inner relative z-10">
                            
                            {/* Device Label */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-slate-500 uppercase">Universal Protection Relay</div>

                            <div className="grid grid-cols-12 gap-6 mt-4">
                                {/* LEDs */}
                                <div className="col-span-3 flex flex-col gap-5 py-4 px-2 bg-slate-300/50 rounded-lg border border-slate-400 shadow-inner">
                                    <StatusLED label="EN" color="green" active={isPowered && leds.enabled} />
                                    <StatusLED label="TRIP" color="red" active={isPowered && leds.trip} blink={true} />
                                    <StatusLED label="PICKUP" color="amber" active={isPowered && leds.pickup} />
                                    <StatusLED label="INST 50" color="red" active={isPowered && leds.inst50} />
                                    <StatusLED label="TIME 51" color="red" active={isPowered && leds.time51} />
                                    <StatusLED label="ALARM" color="amber" active={isPowered && leds.alarm} />
                                </div>

                                {/* LCD & Keypad */}
                                <div className="col-span-9 flex flex-col gap-4">
                                    {/* Screen */}
                                    <div className="bg-[#0f1a0f] h-40 rounded-lg border-4 border-slate-700 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] p-3 relative font-mono text-sm leading-6">
                                        {isPowered ? (
                                            <div className="text-[#33ff33] drop-shadow-[0_0_2px_rgba(51,255,51,0.5)]">
                                                {hmiText.map((line, i) => (
                                                    <div key={i} className={`whitespace-pre ${i === cursorRow ? 'bg-[#33ff33]/20' : ''}`}>{line}</div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-white/10 font-bold uppercase tracking-widest">Display Off</div>
                                        )}
                                        {/* Glare effect */}
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-sm"></div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex gap-4">
                                        <div className="grid grid-cols-3 gap-1.5 p-3 bg-slate-300 rounded-lg border border-slate-400 shadow-[inset_0_2px_5px_rgba(0,0,0,0.1)] flex-1">
                                            <div></div><KeyBtn label="UP" color="default" icon={<ChevronUp/>} onClick={()=>handleHmiKey('UP')} /><div></div>
                                            <KeyBtn label="ESC" color="default" icon={<ChevronLeft/>} onClick={()=>handleHmiKey('ESC')} /><KeyBtn label="ENT" color="blue" onClick={()=>handleHmiKey('ENT')} /><KeyBtn label="ENT" color="default" icon={<ChevronRight/>} onClick={()=>handleHmiKey('ENT')} />
                                            <div></div><KeyBtn label="DOWN" color="default" icon={<ChevronDown/>} onClick={()=>handleHmiKey('DOWN')} /><div></div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-16">
                                            <CmdBtn label="TARGET RESET" icon={<RotateCcw className="w-4 h-4"/>} onClick={resetTargets} disabled={autoState.active} />
                                            <CmdBtn label="PWR" icon={<Power className="w-4 h-4"/>} onClick={() => setIsPowered(!isPowered)} active={isPowered} color="red" disabled={autoState.active} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simulation Controls Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                        
                        {/* Auto Training Section */}
                        <div className="bg-slate-800/50 p-4 border-b border-slate-800">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Auto Training Sequence
                            </h3>
                            {autoState.active ? (
                                <button onClick={stopAutoSequence} className="w-full flex justify-center items-center gap-2 bg-red-900/80 hover:bg-red-800 border border-red-700 py-3 rounded-lg font-bold text-xs transition-all text-white shadow-md active:scale-95">
                                    <StopCircle className="w-4 h-4"/> STOP SEQUENCE
                                </button>
                            ) : (
                                <button onClick={runAutoSequence} className="w-full flex justify-center items-center gap-2 bg-blue-700 hover:bg-blue-600 border border-blue-600 py-3 rounded-lg font-bold text-xs transition-all text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] active:scale-95">
                                    <PlayCircle className="w-4 h-4"/> RUN EDU-SEQUENCE
                                </button>
                            )}
                        </div>

                        {/* Manual Injection Section */}
                        <div className="p-5">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" /> Manual Injection
                            </h3>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <button disabled={autoState.active} onClick={()=>injectFault('A-G')} className="disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 rounded-lg font-bold text-xs transition-all text-white shadow-md active:scale-95">A-G FAULT</button>
                                <button disabled={autoState.active} onClick={()=>injectFault('B-C')} className="disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 rounded-lg font-bold text-xs transition-all text-white shadow-md active:scale-95">B-C FAULT</button>
                                <button disabled={autoState.active} onClick={()=>injectFault('3-Phase')} className="disabled:opacity-50 disabled:cursor-not-allowed bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 py-3 rounded-lg font-bold text-xs transition-all text-red-200 shadow-md active:scale-95">3-PHASE</button>
                            </div>
                            
                            <div className="flex justify-between items-center p-4 bg-slate-950 rounded-xl border border-slate-800 mt-6">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Breaker Status (52)</div>
                                    <div className={`text-xl font-black ${breakerClosed ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {breakerClosed ? 'CLOSED (LIVE)' : 'OPEN (TRIPPED)'}
                                    </div>
                                </div>
                                <button 
                                    onClick={closeBreaker}
                                    disabled={breakerClosed || autoState.active}
                                    className={`px-6 py-3 rounded-lg font-bold text-xs transition-all shadow-lg ${(breakerClosed || autoState.active) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'}`}
                                >
                                    CLOSE 52
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: SOFTWARE DASHBOARD --- */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    
                    {/* Dashboard Nav */}
                    <div className="flex gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 overflow-x-auto custom-scrollbar">
                        {[
                            { id: 'DASHBOARD', icon: <Activity className="w-4 h-4"/>, label: 'Single Line & Meters' },
                            { id: 'PHASORS', icon: <Navigation className="w-4 h-4"/>, label: 'Phasor Vectors' },
                            { id: 'SETTINGS', icon: <Sliders className="w-4 h-4"/>, label: 'Protection Settings' },
                            { id: 'COMTRADE', icon: <ChartIcon className="w-4 h-4"/>, label: 'Oscillography' },
                            { id: 'THEORY', icon: <BookText className="w-4 h-4"/>, label: 'Theory & Guidelines' },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content Container */}
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 min-h-[500px] flex flex-col">
                        
                        {/* TAB: DASHBOARD (SLD & Live Values) */}
                        {activeTab === 'DASHBOARD' && (
                            <div className="flex flex-col h-full gap-8">
                                {/* Single Line Diagram */}
                                <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-6 relative flex flex-col items-center justify-center">
                                    <div className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Dynamic Single Line Diagram</div>
                                    
                                    <svg viewBox="0 0 400 200" className="w-full max-w-lg overflow-visible">
                                        <defs>
                                            <marker id="arrowHead" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                                                <path d="M0,0 L0,6 L9,3 z" fill={systemState === 'FAULT' ? '#ef4444' : '#3b82f6'} />
                                            </marker>
                                        </defs>

                                        {/* Source Bus */}
                                        <line x1="50" y1="20" x2="350" y2="20" stroke="#94a3b8" strokeWidth="4" />
                                        <text x="200" y="10" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="bold">12kV SOURCE BUS</text>

                                        {/* Main Feeder Line */}
                                        <line x1="200" y1="20" x2="200" y2="60" stroke="#94a3b8" strokeWidth="2" />
                                        
                                        {/* Breaker (52) */}
                                        <rect x="180" y="60" width="40" height="40" fill={breakerClosed ? '#ef4444' : '#10b981'} stroke="#cbd5e1" strokeWidth="2" rx="4" />
                                        <text x="200" y="84" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="bold">52</text>
                                        {breakerClosed && <line x1="200" y1="60" x2="200" y2="100" stroke="#cbd5e1" strokeWidth="2" />}
                                        {!breakerClosed && <line x1="200" y1="60" x2="220" y2="90" stroke="#cbd5e1" strokeWidth="2" />}

                                        {/* Line Below Breaker */}
                                        <line x1="200" y1="100" x2="200" y2="180" stroke="#94a3b8" strokeWidth="2" />

                                        {/* Current Flow Animation */}
                                        {breakerClosed && (
                                            <path d="M200 110 L200 170" stroke={systemState === 'FAULT' ? '#ef4444' : '#3b82f6'} strokeWidth="4" fill="none" markerEnd="url(#arrowHead)" className={systemState === 'FAULT' ? 'animate-pulse' : ''} />
                                        )}

                                        {/* CT (Current Transformer) */}
                                        <circle cx="200" cy="120" r="12" fill="none" stroke="#eab308" strokeWidth="2" />
                                        <circle cx="200" cy="130" r="12" fill="none" stroke="#eab308" strokeWidth="2" />
                                        <path d="M 212 125 L 260 125 L 260 100" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="4 2"/>
                                        <rect x="240" y="70" width="40" height="30" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
                                        <text x="260" y="88" fill="#eab308" fontSize="10" textAnchor="middle">RELAY</text>
                                        <text x="230" y="128" fill="#eab308" fontSize="10">CT</text>

                                        {/* Fault indicator */}
                                        {systemState === 'FAULT' && (
                                            <g transform="translate(200, 160)">
                                                <path d="M -10 -20 L 5 -5 L -5 0 L 15 20" fill="none" stroke="#ef4444" strokeWidth="3" />
                                                <text x="20" y="10" fill="#ef4444" fontSize="12" fontWeight="bold" className="animate-pulse">FAULT</text>
                                            </g>
                                        )}
                                    </svg>
                                </div>

                                {/* Live Telemetry */}
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    {['A', 'B', 'C'].map(phase => (
                                        <div key={`I${phase}`} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center relative overflow-hidden">
                                            {systemState === 'FAULT' && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>}
                                            <div className="text-[10px] text-slate-500 font-bold mb-1">I (PHASE {phase})</div>
                                            <div className={`text-xl font-mono font-black ${systemState === 'FAULT' ? 'text-red-400' : 'text-white'}`}>
                                                {electricalData[`i${phase.toLowerCase()}`].mag.toFixed(0)} <span className="text-xs text-slate-500">A</span>
                                            </div>
                                        </div>
                                    ))}
                                    {['A', 'B', 'C'].map(phase => (
                                        <div key={`V${phase}`} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                                            <div className="text-[10px] text-slate-500 font-bold mb-1">V (PHASE {phase})</div>
                                            <div className="text-xl font-mono font-black text-slate-300">
                                                {electricalData[`v${phase.toLowerCase()}`].mag.toFixed(0)} <span className="text-xs text-slate-500">V</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB: PHASORS */}
                        {activeTab === 'PHASORS' && (
                            <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center">
                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative w-full max-w-[400px] aspect-square flex items-center justify-center">
                                    <svg viewBox="0 0 300 300" className="w-full h-full">
                                        <defs>
                                            <marker id="arrow-#ef4444" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                                            <marker id="arrow-#eab308" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#eab308" /></marker>
                                            <marker id="arrow-#3b82f6" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
                                            <marker id="arrow-#fca5a5" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#fca5a5" /></marker>
                                            <marker id="arrow-#fde047" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#fde047" /></marker>
                                            <marker id="arrow-#93c5fd" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#93c5fd" /></marker>
                                        </defs>
                                        
                                        {/* Polar Grid */}
                                        <circle cx="150" cy="150" r="100" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                                        <circle cx="150" cy="150" r="50" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                                        <line x1="150" y1="20" x2="150" y2="280" stroke="#334155" strokeWidth="1" />
                                        <line x1="20" y1="150" x2="280" y2="150" stroke="#334155" strokeWidth="1" />
                                        
                                        {/* Phasor Lines */}
                                        {getPhasorLines()}
                                    </svg>
                                </div>

                                <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-6 w-full">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800 pb-2">Vector Data</h3>
                                    <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                                        <div className="space-y-2">
                                            <div className="text-red-400">VA: {electricalData.va.mag.toFixed(0)}V ∠{electricalData.va.ang}°</div>
                                            <div className="text-yellow-400">VB: {electricalData.vb.mag.toFixed(0)}V ∠{electricalData.vb.ang}°</div>
                                            <div className="text-blue-400">VC: {electricalData.vc.mag.toFixed(0)}V ∠{electricalData.vc.ang}°</div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-red-300 font-bold">IA: {electricalData.ia.mag.toFixed(0)}A ∠{electricalData.ia.ang}°</div>
                                            <div className="text-yellow-300 font-bold">IB: {electricalData.ib.mag.toFixed(0)}A ∠{electricalData.ib.ang}°</div>
                                            <div className="text-blue-300 font-bold">IC: {electricalData.ic.mag.toFixed(0)}A ∠{electricalData.ic.ang}°</div>
                                        </div>
                                    </div>
                                    <div className="mt-6 text-xs text-slate-500 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                        <strong>Diagnostic Note:</strong> During a fault, observe how the fault current lags the voltage significantly due to the highly inductive nature of power lines. Pre-fault, vectors are typically balanced 120° apart.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: SETTINGS */}
                        {activeTab === 'SETTINGS' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-6">
                                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm">
                                        <h3 className="text-sm font-bold uppercase text-slate-300 mb-4">Hardware Settings</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">CT Ratio (Primary/Secondary)</label>
                                                <select 
                                                    value={settings.ctRatio} 
                                                    onChange={e => setSettings({...settings, ctRatio: Number(e.target.value)})}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                                                    disabled={autoState.active}
                                                >
                                                    <option value={120}>600/5 (Ratio: 120)</option>
                                                    <option value={240}>1200/5 (Ratio: 240)</option>
                                                    <option value={400}>2000/5 (Ratio: 400)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-bold uppercase text-slate-300">Phase Time Overcurrent (51P)</h3>
                                            <input type="checkbox" checked={settings.enabled51} onChange={e => setSettings({...settings, enabled51: e.target.checked})} className="w-4 h-4 accent-blue-600" disabled={autoState.active} />
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>Pickup Current (Secondary Amps)</span>
                                                    <span className="text-blue-400 font-bold">{settings.pickup51P} A</span>
                                                </label>
                                                <input type="range" min="0.5" max="10" step="0.1" value={settings.pickup51P} onChange={e => setSettings({...settings, pickup51P: Number(e.target.value)})} className="w-full accent-blue-600" disabled={autoState.active} />
                                                <div className="text-[10px] text-slate-500 text-right mt-1">Primary: {(settings.pickup51P * settings.ctRatio).toFixed(0)} A</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Curve Type</label>
                                                <select 
                                                    value={settings.curve51P} 
                                                    onChange={e => setSettings({...settings, curve51P: e.target.value})}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                                                    disabled={autoState.active}
                                                >
                                                    {Object.keys(CURVES).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>Time Dial (TD)</span>
                                                    <span className="text-blue-400 font-bold">{settings.timeDial51P.toFixed(1)}</span>
                                                </label>
                                                <input type="range" min="0.5" max="15" step="0.5" value={settings.timeDial51P} onChange={e => setSettings({...settings, timeDial51P: Number(e.target.value)})} className="w-full accent-blue-600" disabled={autoState.active} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-bold uppercase text-slate-300">Instantaneous (50P)</h3>
                                            <input type="checkbox" checked={settings.enabled50} onChange={e => setSettings({...settings, enabled50: e.target.checked})} className="w-4 h-4 accent-blue-600" disabled={autoState.active} />
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>Pickup Current (Secondary Amps)</span>
                                                    <span className="text-blue-400 font-bold">{settings.pickup50P} A</span>
                                                </label>
                                                <input type="range" min="5" max="100" step="1" value={settings.pickup50P} onChange={e => setSettings({...settings, pickup50P: Number(e.target.value)})} className="w-full accent-blue-600" disabled={autoState.active} />
                                                <div className="text-[10px] text-slate-500 text-right mt-1">Primary: {(settings.pickup50P * settings.ctRatio).toFixed(0)} A</div>
                                            </div>
                                            <div className="text-xs text-slate-500 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                                Operates with zero intentional time delay. Must be coordinated with downstream devices to prevent nuisance tripping.
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-emerald-900/20 p-5 rounded-xl border border-emerald-900/50">
                                        <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Protection Engineer Tip</h4>
                                        <p className="text-xs text-emerald-200/70 leading-relaxed">
                                            The <strong>51P element</strong> provides backup protection and coordinates with fuses. Set the pickup above maximum load current but below minimum fault current. 
                                            The <strong>50P element</strong> clears high-magnitude, close-in faults instantly to minimize equipment damage.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: COMTRADE / WAVEFORMS */}
                        {activeTab === 'COMTRADE' && (
                            <div className="flex flex-col h-full">
                                {/* COMTRADE File Upload Banner */}
                                <div className="mb-4 p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <FileUp className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-300">IEEE C37.111 COMTRADE Support</div>
                                            <div className="text-[10px] text-slate-500">Upload .cfg configuration files to visualize channel metadata</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {comtradeFile && (
                                            <span className="text-[10px] font-mono bg-emerald-900/40 text-emerald-400 px-2 py-1 rounded border border-emerald-800">
                                                {comtradeFile.fileName} — {comtradeFile.config.analogCount}A + {comtradeFile.config.digitalCount}D ch
                                            </span>
                                        )}
                                        <input ref={comtradeInputRef} type="file" accept=".cfg,.cff" className="hidden" onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = ev => {
                                                try {
                                                    const config = parseCOMTRADEConfig(ev.target?.result as string);
                                                    setComtradeFile({ config, fileName: file.name });
                                                } catch (err) {
                                                    alert('Failed to parse COMTRADE file. Ensure it is a valid IEEE C37.111 .cfg file.');
                                                }
                                            };
                                            reader.readAsText(file);
                                        }} />
                                        <button onClick={() => comtradeInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all">
                                            <Upload className="w-3 h-3" /> UPLOAD .CFG
                                        </button>
                                    </div>
                                </div>

                                {/* COMTRADE Config Viewer */}
                                {comtradeFile && (
                                    <div className="mb-4 p-4 bg-blue-950/30 rounded-xl border border-blue-900/30 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><div className="text-[10px] text-slate-500 uppercase font-bold">Station</div><div className="text-sm font-bold text-white">{comtradeFile.config.stationName}</div></div>
                                        <div><div className="text-[10px] text-slate-500 uppercase font-bold">Device ID</div><div className="text-sm font-bold text-white">{comtradeFile.config.recDevId}</div></div>
                                        <div><div className="text-[10px] text-slate-500 uppercase font-bold">Analog Channels</div><div className="text-sm font-bold text-blue-400">{comtradeFile.config.analogCount}</div></div>
                                        <div><div className="text-[10px] text-slate-500 uppercase font-bold">Digital Channels</div><div className="text-sm font-bold text-emerald-400">{comtradeFile.config.digitalCount}</div></div>
                                    </div>
                                )}

                                {!oscillography ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                        <ChartIcon className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="font-bold">No Fault Data Recorded</p>
                                        <p className="text-sm">Inject a fault to generate oscillography, or upload a COMTRADE .cfg file above.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-slate-300">Transient Oscillography (Primary Values)</h3>
                                            <span className="text-xs bg-red-900/50 text-red-400 px-3 py-1 rounded-full border border-red-800/50">Post-Fault Record</span>
                                        </div>
                                        
                                        <div className="flex-1 min-h-[300px] w-full bg-slate-950 border border-slate-800 rounded-xl p-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={oscillography} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                    <XAxis dataKey="time" stroke="#64748b" tickFormatter={t => t+'ms'} />
                                                    <YAxis stroke="#64748b" />
                                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="IA" stroke="#fca5a5" dot={false} strokeWidth={2} isAnimationActive={false} />
                                                    <Line type="monotone" dataKey="IB" stroke="#fde047" dot={false} strokeWidth={2} isAnimationActive={false} />
                                                    <Line type="monotone" dataKey="IC" stroke="#93c5fd" dot={false} strokeWidth={2} isAnimationActive={false} />
                                                    
                                                    {/* Digital Trace for Trip Signal */}
                                                    <Line type="stepAfter" dataKey="TripDigital" name="52 TRIP CMD" stroke="#ef4444" dot={false} strokeWidth={2} yAxisId="digital" isAnimationActive={false} />
                                                    <YAxis yAxisId="digital" orientation="right" domain={[-1, 10]} hide />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-4 text-center">
                                            Note: Displays Primary Amperes. The sudden drop to zero indicates the circuit breaker opening.
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* TAB: THEORY & GUIDELINES (KNOWLEDGE BASE) */}
                        {activeTab === 'THEORY' && (
                            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar text-sm text-slate-300 space-y-8">
                                
                                <div className="bg-blue-900/20 border border-blue-900/50 p-6 rounded-xl">
                                    <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-3"><Settings className="w-5 h-5"/> 1. Importance of Relay Settings</h3>
                                    <p className="mb-3">Relay settings are the "brain" of power system protection. Proper settings ensure <strong>Selectivity, Sensitivity, and Speed</strong>. If a fault occurs, only the relay closest to the fault should trip. If it fails, upstream relays must provide backup protection. This is known as coordination.</p>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                            <strong className="text-red-400 block mb-1">Too Sensitive (Wrong Setup)</strong>
                                            Results in <em>Nuisance Tripping</em>. Large motor startups or minor inrush currents might trip the whole plant, causing massive financial losses in downtime.
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                            <strong className="text-red-400 block mb-1">Too Slow (Wrong Setup)</strong>
                                            Results in <em>Catastrophic Equipment Failure</em> or lethal <em>Arc Flash</em> incidents. Cables can melt, and transformers can explode if faults aren't cleared rapidly.
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2"><Sliders className="w-5 h-5 text-yellow-500"/> 2. Key Parameters</h3>
                                        <ul className="space-y-3 list-disc pl-5 text-slate-400">
                                            <li><strong className="text-slate-200">CT/PT Ratios:</strong> Relays only see "Secondary" values (usually 0-5A or 0-120V). Wrong ratios mean the relay calculates the primary fault magnitude completely wrong.</li>
                                            <li><strong className="text-slate-200">Pickup (51/50):</strong> The threshold where the relay starts "noticing" a fault. Must be above max load, but below min fault current.</li>
                                            <li><strong className="text-slate-200">Time Dial (TD):</strong> Shifts the inverse curve up/down on a Time-Current Characteristic (TCC) plot to coordinate with fuses.</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2"><BookOpen className="w-5 h-5 text-emerald-500"/> 3. OEM Guidelines & Testing</h3>
                                        <ul className="space-y-3 list-disc pl-5 text-slate-400">
                                            <li><strong>Short Circuit Analysis:</strong> Always base settings on a software model (like ETAP or SKM) before putting them in the relay.</li>
                                            <li><strong>Secondary Injection:</strong> Test settings by injecting fake current directly into the relay using test sets (like Omicron or Doble) before commissioning.</li>
                                            <li><strong>OEM Manuals:</strong> Modern generic microprocessor relays have hundreds of pages of logic capabilities. Never guess parameter meanings—check the specific OEM manual.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4"><Wrench className="w-5 h-5 text-slate-400"/> 4. Failures & Preventive Maintenance (PM)</h3>
                                    <div className="space-y-4 text-slate-400">
                                        <p><strong>What to do during a failure:</strong> If a relay displays a "Self-Test Failure" or "Watchdog Alarm", the protection is offline. The associated breaker must be opened, or upstream protection verified immediately. <em>Do not ignore relay alarms.</em></p>
                                        <div className="flex gap-4">
                                            <div className="flex-1 bg-slate-950 p-4 rounded border border-slate-800">
                                                <strong className="text-slate-200">Electromechanical Relays</strong><br/>
                                                Require physical testing every 1-2 years. Springs drift, contacts oxidize, and discs get stuck.
                                            </div>
                                            <div className="flex-1 bg-slate-950 p-4 rounded border border-slate-800">
                                                <strong className="text-slate-200">Microprocessor Relays</strong><br/>
                                                Perform continuous internal self-diagnostics. PM frequency is extended to 3-5 years, mostly verifying inputs/outputs and CT circuits.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 rounded-xl border border-slate-800">
                                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-indigo-400"/> 5. Industry Trends & Advanced Features</h3>
                                    <ul className="space-y-3 text-slate-400">
                                        <li><strong className="text-indigo-300">IEC 61850 & Digital Substations:</strong> Hardwiring is being replaced by Ethernet. Relays communicate trip signals in milliseconds via "GOOSE" messages over fiber optic networks.</li>
                                        <li><strong className="text-indigo-300">Traveling Wave Fault Location:</strong> High-end generic relays sample at MHz frequencies to locate line faults down to the exact meter using wave reflections.</li>
                                        <li><strong className="text-indigo-300">Arc Flash Mitigation:</strong> Relays now take inputs from optical light sensors. If they see a flash and high current simultaneously, they trip in under 2ms.</li>
                                    </ul>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* --- QUICK GUIDE OVERLAY --- */}
            {showGuide && (
                <div className="fixed bottom-6 right-6 z-50 w-96 bg-slate-800 border-2 border-blue-500 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-10">
                    <div className="bg-blue-600 px-4 py-3 flex justify-between items-center text-white">
                        <h4 className="font-bold flex items-center gap-2"><BookOpen className="w-4 h-4"/> Simulator Guide</h4>
                        <button onClick={() => setShowGuide(false)} className="hover:bg-blue-700 p-1 rounded transition-colors"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="p-5 text-sm text-slate-300 space-y-4">
                        <p>Welcome to <strong>RelaySim PRO</strong>. This simulates an industrial microprocessor protection relay.</p>
                        <ul className="space-y-3">
                            <li className="flex gap-3"><span className="bg-blue-500/20 text-blue-400 w-6 h-6 flex items-center justify-center rounded-full font-bold shrink-0">1</span> <span>Try the <strong>Auto Training Sequence</strong> for a guided walkthrough of fault responses.</span></li>
                            <li className="flex gap-3"><span className="bg-red-500/20 text-red-400 w-6 h-6 flex items-center justify-center rounded-full font-bold shrink-0">2</span> <span>Go to <strong>Settings</strong> to configure CT ratios and protection curves.</span></li>
                            <li className="flex gap-3"><span className="bg-yellow-500/20 text-yellow-400 w-6 h-6 flex items-center justify-center rounded-full font-bold shrink-0">3</span> <span>Check the <strong>Theory & Guidelines</strong> tab to learn engineering best practices.</span></li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUBCOMPONENTS ---

const StatusLED = ({ label, color, active, blink = false }) => {
    const colors = {
        red: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)] border-red-400',
        green: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)] border-emerald-400',
        amber: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,1)] border-amber-400',
        off: 'bg-[#2a2a2a] border-[#111] shadow-inner'
    };
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full border transition-all duration-200 ${active ? colors[color] : colors.off} ${active && blink ? 'animate-pulse' : ''}`}>
                {/* 3D reflection effect */}
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full ml-0.5 mt-0.5 blur-[1px]"></div>
            </div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center leading-none">{label}</span>
        </div>
    );
};

const KeyBtn = ({ icon, label, onClick, color = "default" }: { icon?: any; label?: string; onClick: any; color?: string }) => (
    <button 
        onClick={onClick} 
        className={`w-full h-10 rounded-md flex items-center justify-center shadow-[0_2px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all ${
            color === 'blue' ? 'bg-blue-600 text-white border border-blue-800 hover:bg-blue-500' 
            : 'bg-slate-200 text-slate-700 border border-slate-400 hover:bg-white'
        }`}
    >
        {icon || <span className="font-black text-xs">{label}</span>}
    </button>
);

const CmdBtn = ({ label, icon, onClick, active = false, color="default", disabled=false }: { label: string; icon?: any; onClick: any; active?: boolean; color?: string; disabled?: boolean }) => {
    let bgClass = active ? 'bg-emerald-500 text-white border-emerald-700' : 'bg-slate-700 text-slate-300 border-slate-900 hover:bg-slate-600';
    if (color === 'red' && active) bgClass = 'bg-red-600 text-white border-red-800';
    if (disabled) bgClass = 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed border-slate-900';
    
    return (
        <button 
            disabled={disabled}
            onClick={onClick} 
            className={`flex flex-col items-center justify-center h-full rounded shadow-[0_3px_0_rgba(0,0,0,0.5)] border ${disabled ? '' : 'active:translate-y-[3px] active:shadow-none'} transition-all p-2 ${bgClass}`}
        >
            {icon}
            <span className="text-[8px] font-black mt-1 text-center uppercase tracking-widest">{label}</span>
        </button>
    );
};