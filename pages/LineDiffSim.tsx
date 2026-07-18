import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCcw, BookOpen, Settings, MonitorPlay, 
  Award, Zap, AlertTriangle, Activity, 
  ShieldCheck, Share2, Cable, CheckCircle2,
  XCircle, Info, Cpu, Network, History, Gauge, ArrowRight, Play, RefreshCw, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceDot, Area, AreaChart 
} from 'recharts';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { Card } from '../components/UI/Card';
import { Slider } from '../components/UI/Slider';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { LaTeX } from '../components/UI/LaTeX';
import { PageSEO } from '../components/SEO/PageSEO';
import { usePersistentState } from "../hooks/usePersistentState";
import { useTripFeedback } from "../hooks/useTripFeedback";
import { AICopyButton } from "../components/UI/AICopyButton";
import Odometer from '../components/Odometer';

const DIFF_SCHEMA = {
  "@type": "WebApplication",
  "name": "DiffPro 87L: Line Differential Simulator",
  "description": "Professional simulator for ANSI 87L power line differential protection. Master dual-slope restraint, KCL, and communication channel delay compensation.",
  "applicationCategory": "EngineeringApplication"
};

const RELAY_MATH = {
  degToRad: (deg: number) => (deg * Math.PI) / 180,
  radToDeg: (rad: number) => (rad * 180) / Math.PI,
  polarToRect: (mag: number, angleDeg: number) => ({
    x: mag * Math.cos(RELAY_MATH.degToRad(angleDeg)),
    y: mag * Math.sin(RELAY_MATH.degToRad(angleDeg))
  }),
  rectToPolar: (x: number, y: number) => {
    const mag = Math.sqrt(x ** 2 + y ** 2);
    let angle = RELAY_MATH.radToDeg(Math.atan2(y, x));
    return { mag, angle };
  },
  calculateDifferential: (
    IL: number, IR: number, angleL: number, angleR: number,
    txDelay: number, rxDelay: number, syncMode: 'none' | 'pingpong' | 'gps',
    chargingCurrent: number, cccEnabled: boolean
  ) => {
    // 1 ms at 50Hz = 18 degrees phase shift (360 deg / 20 ms cycle)
    const phaseShiftPerMs = 18;
    
    // Transmit delay shifts remote signal when received at local end
    const rawTxShift = -txDelay * phaseShiftPerMs;
    
    // Synchronization compensation
    let syncComp = 0;
    if (syncMode === 'pingpong') {
      // Ping-pong assumes symmetrical delay, uses RTT/2 as compensation
      const rtt = txDelay + rxDelay;
      syncComp = (rtt / 2) * phaseShiftPerMs;
    } else if (syncMode === 'gps') {
      // GPS/PTP aligns absolute time, compensating for transmit delay perfectly
      syncComp = txDelay * phaseShiftPerMs;
    } // 'none' has 0 compensation
    
    const totalRemoteShift = rawTxShift + syncComp;
    const finalAngleR = angleR + totalRemoteShift;

    // Phasor conversion
    const L = RELAY_MATH.polarToRect(IL, angleL);
    const R = RELAY_MATH.polarToRect(IR, finalAngleR);
    
    // Charging current is purely capacitive (90 degrees ahead of local voltage/current reference)
    // Add capacitive charging phasor
    const chargingPhasor = RELAY_MATH.polarToRect(chargingCurrent, 90);
    
    // Summing vectors
    let diffX = L.x + R.x;
    let diffY = L.y + R.y;
    
    // Without compensation, charging current flows into the line as false differential current
    if (!cccEnabled) {
      diffX += chargingPhasor.x;
      diffY += chargingPhasor.y;
    }
    
    const Idiff = Math.sqrt(diffX ** 2 + diffY ** 2);
    const Irestraint = (IL + IR) / 2;
    
    return { 
      Idiff, 
      Irestraint, 
      diffX, 
      diffY, 
      remoteSyncAngle: finalAngleR,
      syncErrorAngle: totalRemoteShift - (angleR - angleR) // net synchronization offset
    };
  },
  calculateThreshold: (Ir: number, s1: number, s2: number, bp: number, min: number) => {
    let th = (Ir <= bp) ? (s1 / 100) * Ir : ((s1 / 100) * bp + (s2 / 100) * (Ir - bp));
    return Math.max(min, th);
  }
};

const PRESETS = [
  { id: 'normal', icon: '✅', label: 'Normal Load', IL: 800, IR: 800, aL: 0, aR: 180, txDelay: 1, rxDelay: 1, syncMode: 'gps', charging: 0, ccc: false, desc: 'Balanced power flow. Local & Remote currents out-of-phase. I_diff = 0.' },
  { id: 'internal', icon: '⚡', label: 'Internal Fault', IL: 5000, IR: 4000, aL: -30, aR: -30, txDelay: 1, rxDelay: 1, syncMode: 'gps', charging: 0, ccc: false, desc: 'Fault inside line. Both terminals feed fault in-phase. Massive I_diff.' },
  { id: 'ct_sat', icon: '🧲', label: 'CT Saturation', IL: 8000, IR: 6000, aL: -45, aR: 135, txDelay: 1, rxDelay: 1, syncMode: 'gps', charging: 0, ccc: false, desc: 'Heavy external fault where remote CT saturates. High restraint blocks trip.' },
  { id: 'delay_err', icon: '⏰', label: 'Asymmetric Delay', IL: 800, IR: 800, aL: 0, aR: 180, txDelay: 8, rxDelay: 2, syncMode: 'pingpong', charging: 0, ccc: false, desc: 'Unbalanced path delay with ping-pong sync. Creates false phase shift.' }
];

// SVG Polar Conversion for Alpha Plane
const polarToXY = (r: number, angleDeg: number, cx = 110, cy = 110, scale = 50) => {
  const rad = RELAY_MATH.degToRad(angleDeg);
  return {
    x: cx + r * scale * Math.cos(rad),
    y: cy - r * scale * Math.sin(rad) // invert y for screen coordinates
  };
};

export default function LineDiffSim() {
  const isDark = useThemeObserver();
  const [activeTab, setActiveTab] = useState('simulator');
  const [activeChartTab, setActiveChartTab] = useState<'slope' | 'alpha' | 'vector'>('slope');
  const [activeControlTab, setActiveControlTab] = useState<'currents' | 'comms' | 'relay'>('currents');
  const { isTripping, triggerTrip } = useTripFeedback();

  // Relay Configuration
  const [slope1, setSlope1] = usePersistentState('ld_slope1', 30);
  const [slope2, setSlope2] = usePersistentState('ld_slope2', 70);
  const [breakpoint, setBreakpoint] = usePersistentState('ld_breakpoint', 3000);
  const [minPickup, setMinPickup] = usePersistentState('ld_minpickup', 300);
  const [alphaRatioK, setAlphaRatioK] = usePersistentState('ld_alphak', 1.8);
  const [alphaBlockAngle, setAlphaBlockAngle] = usePersistentState('ld_alphablock', 40);

  // Simulation Sliders
  const [IL, setIL] = useState(800);
  const [IR, setIR] = useState(800);
  const [angleL, setAngleL] = useState(0);
  const [angleR, setAngleR] = useState(180);
  const [txDelay, setTxDelay] = useState(0);
  const [rxDelay, setRxDelay] = useState(0);
  const [syncMode, setSyncMode] = useState<'none' | 'pingpong' | 'gps'>('gps');
  const [chargingCurrent, setChargingCurrent] = useState(0);
  const [cccEnabled, setCccEnabled] = useState(false);

  // Guided Labs State
  const [currentLab, setCurrentLab] = useState<number | null>(null);
  const [labStatus, setLabStatus] = useState<('not_started' | 'passed' | 'failed')[]>([
    'not_started', 'not_started', 'not_started', 'not_started'
  ]);
  const [labMessage, setLabMessage] = useState<string | null>(null);

  // Calculations
  const { Idiff, Irestraint, diffX, diffY, remoteSyncAngle } = useMemo(() => {
    return RELAY_MATH.calculateDifferential(
      IL, IR, angleL, angleR,
      txDelay, rxDelay, syncMode,
      chargingCurrent, cccEnabled
    );
  }, [IL, IR, angleL, angleR, txDelay, rxDelay, syncMode, chargingCurrent, cccEnabled]);

  const threshold = useMemo(() => {
    return RELAY_MATH.calculateThreshold(Irestraint, slope1, slope2, breakpoint, minPickup);
  }, [Irestraint, slope1, slope2, breakpoint, minPickup]);

  // Trip Assessments
  const dualSlopeTrip = Idiff > threshold;

  // Alpha Plane calculations
  // Ratio W = I_Remote_Sync / I_Local
  const alphaRatio = useMemo(() => {
    if (IL === 0) return { r: 99, angle: 0 };
    const r = IR / IL;
    let angle = remoteSyncAngle - angleL;
    // Normalize to [-180, 180]
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return { r, angle };
  }, [IL, IR, remoteSyncAngle, angleL]);

  // Alpha restraint region checks:
  // Operating point is inside restraint if:
  // 1. 1/K <= r <= K
  // 2. |angle - 180| <= alphaBlockAngle OR |angle + 180| <= alphaBlockAngle
  const alphaRestrained = useMemo(() => {
    const minR = 1 / alphaRatioK;
    const maxR = alphaRatioK;
    const rOk = alphaRatio.r >= minR && alphaRatio.r <= maxR;
    
    const absDiff180 = Math.abs(Math.abs(alphaRatio.angle) - 180);
    const angleOk = absDiff180 <= alphaBlockAngle;
    
    return rOk && angleOk;
  }, [alphaRatio, alphaRatioK, alphaBlockAngle]);

  const alphaTrip = !alphaRestrained && IL > 50 && IR > 50;

  // Final Trip output (Trips if either algorithm detects fault)
  const isTripActive = dualSlopeTrip || alphaTrip;

  useEffect(() => {
    if (isTripActive) triggerTrip();
  }, [isTripActive, triggerTrip]);

  // Recharts dual slope curve dataset
  const chartData = useMemo(() => {
    return Array.from({ length: 41 }, (_, i) => {
      const ir = i * 250;
      return { ir, th: RELAY_MATH.calculateThreshold(ir, slope1, slope2, breakpoint, minPickup) };
    });
  }, [slope1, slope2, breakpoint, minPickup]);

  // Guided Labs Definition
  const labs = useMemo(() => [
    {
      id: 0,
      name: "Lab 1: The Charging Current Trap",
      objective: "Compensate for capacitive line charging current to avoid false tripping.",
      description: "An unloaded 400kV transmission line is energized. Due to high shunt capacitance, a charging current of 350A flows on the line. The local relay is measuring 350A, but remote current is 0A. The minimum pickup setting is 300A, causing a false trip on charging current.",
      setup: () => {
        setIL(350); setIR(0); setAngleL(90); setAngleR(0);
        setTxDelay(0); setRxDelay(0); setSyncMode('gps');
        setChargingCurrent(350); setCccEnabled(false);
        setMinPickup(300);
      },
      check: () => {
        return cccEnabled || minPickup >= 400;
      },
      hint: "Enable Charging Current Compensation (CCC) toggle or raise the Minimum Pickup setting above 350A."
    },
    {
      id: 1,
      name: "Lab 2: CT Saturation on External Fault",
      objective: "Adjust Slope 2 parameters to restrain the relay during heavy external fault CT saturation.",
      description: "A severe out-of-zone short circuit occurs. The through-current is 8000A. The local CT measures 8000A at -45°, but the remote CT saturates heavily, measuring only 5000A at 145° (instead of 180° phase shift). This creates a false differential current. Secure the relay.",
      setup: () => {
        setIL(8000); setIR(5000); setAngleL(-45); setAngleR(145);
        setTxDelay(0); setRxDelay(0); setSyncMode('gps');
        setChargingCurrent(0); setCccEnabled(false);
        setSlope2(50); setBreakpoint(4000);
      },
      check: () => {
        return !isTripActive && slope2 >= 70 && breakpoint <= 3000;
      },
      hint: "Increase Slope 2 to >= 70% and reduce the Breakpoint to <= 3000A to ensure the saturated operating point falls back into the Restrain zone."
    },
    {
      id: 2,
      name: "Lab 3: Asymmetrical Comm Routing",
      objective: "Mitigate synchronization phase errors caused by asymmetrical communication paths.",
      description: "Due to a network route switch, the transmit path delay is 7.5 ms, while the receive path delay is 1.5 ms. The line is carrying normal load (800A). Under traditional Round-Trip (Ping-Pong) synchronization, this asymmetry produces a 54° phase sync error, leading to a false trip. Fix the sync error.",
      setup: () => {
        setIL(800); setIR(800); setAngleL(0); setAngleR(180);
        setTxDelay(7.5); setRxDelay(1.5); setSyncMode('pingpong');
        setChargingCurrent(0); setCccEnabled(false);
      },
      check: () => {
        return syncMode === 'gps';
      },
      hint: "Switch the Time Sync Mode to GPS (PTP IEEE 1588) to establish absolute time synchronisation, bypassing path delay differences."
    },
    {
      id: 3,
      name: "Lab 4: High-Resistance Internal Fault",
      objective: "Calibrate sensitivity parameters to clear a high-resistance internal fault.",
      description: "A tree branch makes contact with the transmission line, initiating a high-resistance internal fault. The fault current is small: local measures 1500A at -30°, and remote measures 900A at -30°. Because the fault current is low, the default settings fail to trip the relay. Make the relay sensitive enough to trip.",
      setup: () => {
        setIL(1500); setIR(900); setAngleL(-30); setAngleR(-30);
        setTxDelay(0); setRxDelay(0); setSyncMode('gps');
        setChargingCurrent(0); setCccEnabled(false);
        setMinPickup(1500); setSlope1(45);
      },
      check: () => {
        return isTripActive && minPickup <= 400 && slope1 <= 35;
      },
      hint: "Lower the Minimum Pickup to <= 400A and adjust Slope 1 to <= 35% so that the small fault operating point rises above the tripping threshold."
    }
  ], [cccEnabled, minPickup, slope2, breakpoint, isTripActive, syncMode, slope1]);

  const selectPreset = (p: typeof PRESETS[0]) => {
    setIL(p.IL);
    setIR(p.IR);
    setAngleL(p.aL);
    setAngleR(p.aR);
    setTxDelay(p.txDelay);
    setRxDelay(p.rxDelay);
    setSyncMode(p.syncMode);
    setChargingCurrent(p.charging);
    setCccEnabled(p.ccc);
  };

  const startLab = (idx: number) => {
    setCurrentLab(idx);
    labs[idx].setup();
    setLabMessage("Lab parameters loaded. Adjust the sliders or relay settings to meet the objective!");
  };

  const verifyLab = () => {
    if (currentLab === null) return;
    const success = labs[currentLab].check();
    setLabStatus(prev => {
      const next = [...prev];
      next[currentLab] = success ? 'passed' : 'failed';
      return next;
    });
    if (success) {
      setLabMessage("🎉 Success! Objective met. You have successfully solved this engineering scenario.");
    } else {
      setLabMessage(`❌ Failed. Hint: ${labs[currentLab].hint}`);
    }
  };

  const labsCompletedCount = labStatus.filter(s => s === 'passed').length;

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-cyan-500/30 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
      <PageSEO title="DiffPro 87L: Line Differential Simulator" description="Industrial line current differential protection simulator featuring dual-slope, alpha-plane and delay compensations." url="/linediffsim" />
      
      {/* HEADER */}
      <header className={`h-24 backdrop-blur-xl border-b px-6 lg:px-10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-5">
           <div className="bg-cyan-600 p-3 rounded-2xl text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)]"><Cpu className="w-8 h-8"/></div>
           <div>
             <h1 className="font-black text-2xl lg:text-3xl tracking-tighter uppercase leading-none text-adaptive">DIFF<span className="text-cyan-500">PRO</span> 87L</h1>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">IEEE C37.243 | Phase Differential</div>
           </div>
        </div>

        <nav className={`hidden md:flex p-1.5 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-250 shadow-inner'}`}>
          {['simulator', 'theory', 'lab'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t ? 'bg-cyan-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-400 dark:hover:text-slate-350'}`}>
              {t}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <AICopyButton state={{ slope1, slope2, breakpoint, minPickup, alphaRatioK, alphaBlockAngle, syncMode, cccEnabled }} toolName="Line Differential / ANSI 87L" />
        </div>
      </header>

      {/* MOBILE NAV */}
      <div className="md:hidden flex justify-around p-3 border-b border-slate-800 bg-slate-950/40">
        {['simulator', 'theory', 'lab'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === t ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>

      <main className="w-full mx-auto p-4 lg:p-6 min-h-[calc(100vh-6rem)] max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'simulator' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Visualizations & Assessment Banner */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* INTERACTIVE SINGLE LINE DIAGRAM */}
                  <Card isDark={isDark} noPadding className="overflow-hidden">
                    <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center flex-wrap gap-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Network className="w-4 h-4 text-cyan-500" /> Interactive Transmission Line SLD
                      </h3>
                      <div className="flex gap-2">
                        {PRESETS.map(p => (
                          <button key={p.id} onClick={() => selectPreset(p)}
                            className="px-3 py-1.5 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold rounded-lg border border-slate-750 text-slate-300 transition-colors">
                            {p.icon} {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-slate-950/80 relative min-h-[220px] flex flex-col justify-center items-center">
                      {/* SVG Diagram */}
                      <svg className="w-full max-w-4xl h-36" viewBox="0 0 800 160">
                        <defs>
                          <style>{`
                            .flow-normal { stroke-dasharray: 6, 6; animation: flowR 3s linear infinite; }
                            .flow-fault-l { stroke-dasharray: 6, 6; animation: flowR 1.5s linear infinite; }
                            .flow-fault-r { stroke-dasharray: 6, 6; animation: flowL 1.5s linear infinite; }
                            .comm-pulse { stroke-dasharray: 4, 12; animation: flowR ${2 + txDelay*0.5}s linear infinite; }
                            @keyframes flowR { to { stroke-dashoffset: -24; } }
                            @keyframes flowL { to { stroke-dashoffset: 24; } }
                          `}</style>
                        </defs>

                        {/* Bus A (Local) */}
                        <rect x="50" y="30" width="12" height="100" fill="#475569" rx="4" />
                        <text x="56" y="20" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-bold">BUS LOCAL (A)</text>
                        <text x="56" y="145" textAnchor="middle" fill="#3b82f6" className="text-xs font-bold">{Math.round(IL)}A @ {angleL}°</text>

                        {/* Bus B (Remote) */}
                        <rect x="738" y="30" width="12" height="100" fill="#475569" rx="4" />
                        <text x="744" y="20" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-bold">BUS REMOTE (B)</text>
                        <text x="744" y="145" textAnchor="middle" fill="#10b981" className="text-xs font-bold">{Math.round(IR)}A @ {angleR}°</text>

                        {/* Transmission Line */}
                        <line x1="62" y1="80" x2="738" y2="80" stroke="#1e293b" strokeWidth="6" />

                        {/* Dynamic Current Flow animations */}
                        {IL > 50 && IR > 50 && Math.abs(angleL - angleR) > 130 && (
                          <line x1="62" y1="80" x2="738" y2="80" stroke="#0284c7" strokeWidth="3" className="flow-normal" />
                        )}
                        
                        {IL > 1000 && IR > 1000 && Math.abs(angleL - angleR) < 60 && (
                          <>
                            <line x1="62" y1="80" x2="400" y2="80" stroke="#ef4444" strokeWidth="4" className="flow-fault-l" />
                            <line x1="738" y1="80" x2="400" y2="80" stroke="#ef4444" strokeWidth="4" className="flow-fault-r" />
                            <g transform="translate(400, 80)">
                              <circle cx="0" cy="0" r="16" fill="rgba(239, 68, 68, 0.2)" className="animate-ping" />
                              <polygon points="0,-18 5,-5 18,-5 8,3 12,16 0,8 -12,16 -8,3 -18,-5 -5,-5" fill="#f59e0b" stroke="#ef4444" strokeWidth="1.5" />
                              <text x="0" y="-22" textAnchor="middle" fill="#f59e0b" className="text-[10px] font-bold">INTERNAL FAULT</text>
                            </g>
                          </>
                        )}

                        {/* Breaker A Box */}
                        <g transform="translate(110, 65)">
                          <rect width="30" height="30" fill={isTripActive ? "#fef2f2" : "#1e293b"} stroke={isTripActive ? "#ef4444" : "#475569"} strokeWidth="2" rx="6" />
                          <text x="15" y="18" textAnchor="middle" fill={isTripActive ? "#ef4444" : "#94a3b8"} className="text-[9px] font-bold">{isTripActive ? "TRIP" : "52A"}</text>
                        </g>

                        {/* Breaker B Box */}
                        <g transform="translate(660, 65)">
                          <rect width="30" height="30" fill={isTripActive ? "#fef2f2" : "#1e293b"} stroke={isTripActive ? "#ef4444" : "#475569"} strokeWidth="2" rx="6" />
                          <text x="15" y="18" textAnchor="middle" fill={isTripActive ? "#ef4444" : "#94a3b8"} className="text-[9px] font-bold">{isTripActive ? "TRIP" : "52B"}</text>
                        </g>

                        {/* CT local */}
                        <circle cx="180" cy="80" r="10" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                        <circle cx="185" cy="80" r="10" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                        <text x="182" y="62" textAnchor="middle" fill="#3b82f6" className="text-[8px] font-bold">CT_A</text>

                        {/* CT remote */}
                        <circle cx="620" cy="80" r="10" fill="none" stroke="#10b981" strokeWidth="2.5" />
                        <circle cx="615" cy="80" r="10" fill="none" stroke="#10b981" strokeWidth="2.5" />
                        <text x="618" y="62" textAnchor="middle" fill="#10b981" className="text-[8px] font-bold">CT_B</text>

                        {/* Communication link (Fiber optic channel) */}
                        <path d="M 195,105 Q 400,135 605,105" fill="none" stroke={syncMode === 'none' ? "#f59e0b" : "#0ea5e9"} strokeWidth="2" strokeDasharray="3, 3" />
                        {syncMode !== 'none' && (
                          <path d="M 195,105 Q 400,135 605,105" fill="none" stroke="#0ea5e9" strokeWidth="3" className="comm-pulse" />
                        )}
                        <text x="400" y="140" textAnchor="middle" fill="#0ea5e9" className="text-[9px] font-bold uppercase tracking-widest">
                          Fiber Link: {syncMode === 'none' ? "ASYNC UNALIGNED" : `Delay Tx: ${txDelay}ms / Rx: ${rxDelay}ms`}
                        </text>
                      </svg>

                      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-805 rounded-lg">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Sync:</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${syncMode === 'gps' ? 'bg-emerald-500/20 text-emerald-400' : syncMode === 'pingpong' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'}`}>
                          {syncMode === 'gps' ? 'GPS / PTP IEEE 1588' : syncMode === 'pingpong' ? 'RTT Ping-Pong' : 'Unaligned (None)'}
                        </span>
                      </div>

                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        {chargingCurrent > 0 && (
                          <div className="px-3 py-1 bg-purple-900/30 border border-purple-500/40 rounded-lg text-purple-400 text-[10px] font-bold animate-pulse">
                            ⚡ Shunt Charge: {chargingCurrent}A
                          </div>
                        )}
                        {cccEnabled && (
                          <div className="px-3 py-1 bg-emerald-900/30 border border-emerald-500/40 rounded-lg text-emerald-400 text-[10px] font-bold">
                            ✓ CCC ACTIVE
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* COMPACT TRIP ASSESSMENT PANEL BANNER */}
                  <Card isDark={isDark} className={`border p-4 ${isTripActive ? 'border-red-500/70 bg-red-950/10 shadow-lg shadow-red-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                      
                      {/* Status Check */}
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isTripActive ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Relay Assessment</div>
                          <div className={`text-base font-black uppercase tracking-tight ${isTripActive ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                            {isTripActive ? 'TRIP SIGNAL ACTIVE' : 'RESTRAINED / HEALTHY'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Calculated Idiff */}
                      <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-850 pt-2 sm:pt-0 sm:pl-6">
                        <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Diff Current (Id)</div>
                        <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
                          <span className={`text-xl font-black ${isTripActive ? 'text-red-500' : 'text-adaptive'}`}>{Math.round(Idiff)} A</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">Limit: {Math.round(threshold)}A</span>
                        </div>
                      </div>

                      {/* Calculated Irestraint */}
                      <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-850 pt-2 sm:pt-0 sm:pl-6">
                        <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Restraint (Ir)</div>
                        <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
                          <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">{Math.round(Irestraint)} A</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">Slope 1: {slope1}%</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* VISUALIZATION PANEL: TABBED CHARTS */}
                  <Card isDark={isDark} noPadding className="flex flex-col h-[360px] overflow-hidden">
                    
                    {/* Visualizer header tabs */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 flex-wrap gap-2">
                      <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-500" /> Vector Analysis Graphics
                      </h3>
                      
                      <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                        {[
                          { id: 'slope', label: 'Dual Slope' },
                          { id: 'alpha', label: 'Alpha Plane' },
                          { id: 'vector', label: 'Phasors' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveChartTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                              activeChartTab === tab.id
                                ? 'bg-cyan-600 text-slate-950 shadow-md font-bold'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="flex-1 min-h-0 relative">
                      
                      {/* Active Chart: Slope */}
                      {activeChartTab === 'slope' && (
                        <div className="w-full h-full flex flex-col">
                          <div className="flex-1 p-4 bg-slate-950/60 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData}>
                                <defs>
                                  <linearGradient id="restrainZone" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.08}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="ir" type="number" domain={[0, 10000]} stroke="#475569" style={{ fontSize: 9 }} />
                                <YAxis type="number" domain={[0, 10000]} stroke="#475569" style={{ fontSize: 9 }} />
                                <Area type="monotone" dataKey="th" stroke="#10b981" fill="url(#restrainZone)" strokeWidth={2.5} isAnimationActive={false} name="Threshold"/>
                                <ReferenceDot x={Irestraint} y={Idiff} r={6} fill={isTripActive ? '#ef4444' : '#10b981'} stroke="#fff" strokeWidth={2} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-center text-[9px] font-black uppercase text-slate-550 dark:text-slate-450 tracking-wider">
                            Operating point {isTripActive ? 'above boundary (TRIP)' : 'in green restraint region'}
                          </div>
                        </div>
                      )}

                      {/* Active Chart: Alpha Plane */}
                      {activeChartTab === 'alpha' && (
                        <div className="w-full h-full flex flex-col">
                          <div className="flex-1 p-2 bg-slate-950/60 flex items-center justify-center relative min-h-0">
                            <svg width="180" height="180" viewBox="0 0 220 220" className="overflow-visible">
                              <circle cx="110" cy="110" r="30" fill="none" stroke="#334155" strokeDasharray="2, 2" />
                              <circle cx="110" cy="110" r="60" fill="none" stroke="#475569" strokeWidth="1" />
                              <circle cx="110" cy="110" r="90" fill="none" stroke="#334155" strokeDasharray="2, 2" />
                              
                              <line x1="10" y1="110" x2="210" y2="110" stroke="#334155" strokeWidth="1" />
                              <line x1="110" y1="10" x2="110" y2="210" stroke="#334155" strokeWidth="1" />
                              
                              <line x1="40" y1="40" x2="180" y2="180" stroke="#1e293b" strokeWidth="1" strokeDasharray="1, 4" />
                              <line x1="40" y1="180" x2="180" y2="40" stroke="#1e293b" strokeWidth="1" strokeDasharray="1, 4" />

                              <text x="212" y="113" fill="#64748b" className="text-[8px] font-bold">0°</text>
                              <text x="110" y="8" textAnchor="middle" fill="#64748b" className="text-[8px] font-bold">90°</text>
                              <text x="8" y="113" fill="#64748b" className="text-[8px] font-bold">180°</text>
                              <text x="110" y="218" textAnchor="middle" fill="#64748b" className="text-[8px] font-bold">-90°</text>
                              <text x="175" y="105" fill="#475569" className="text-[7px]">K=1.0</text>
                              <text x="145" y="105" fill="#475569" className="text-[7px]">0.5</text>
                              <text x="202" y="105" fill="#475569" className="text-[7px]">1.5</text>

                              <path 
                                d={getAlphaPlaneRestraintPath(1 / alphaRatioK, alphaRatioK, alphaBlockAngle)} 
                                fill="rgba(16, 185, 129, 0.12)" 
                                stroke="rgba(16, 185, 129, 0.5)" 
                                strokeWidth="1.5" 
                              />
                              <text x="65" y="152" fill="#10b981" className="text-[8px] font-bold">RESTRAIN WEDGE</text>

                              {(() => {
                                const clampRatio = Math.min(1.8, alphaRatio.r);
                                const isClamped = alphaRatio.r > 1.8;
                                const pt = polarToXY(clampRatio, alphaRatio.angle);
                                return (
                                  <g>
                                    <circle cx={pt.x} cy={pt.y} r="5" fill={alphaTrip ? "#ef4444" : "#10b981"} stroke="#fff" strokeWidth="1.5" />
                                    {isClamped && (
                                      <path d={`M ${pt.x} ${pt.y} L ${pt.x + (pt.x - 110)*0.2} ${pt.y + (pt.y - 110)*0.2}`} stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
                                    )}
                                  </g>
                                );
                              })()}
                            </svg>
                            
                            <div className="absolute bottom-2 right-2 text-right bg-slate-900/90 p-1.5 rounded border border-slate-800 text-[8px] font-mono text-slate-400">
                              Ratio (R): {alphaRatio.r.toFixed(2)}<br />
                              Angle: {Math.round(alphaRatio.angle)}°
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-center text-[9px] font-black uppercase text-slate-550 dark:text-slate-450 tracking-wider">
                            Alpha Plane Status: {alphaTrip ? 'TRIP (Outside Wedge)' : 'RESTRAIN (Inside)'}
                          </div>
                        </div>
                      )}

                      {/* Active Chart: Vector space */}
                      {activeChartTab === 'vector' && (
                        <div className="w-full h-full flex flex-col">
                          <div className="flex-1 p-2 bg-slate-950/60 flex items-center justify-center relative min-h-0">
                            <svg width="180" height="180" viewBox="0 0 200 200" className="overflow-visible">
                              <defs>
                                <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                                </marker>
                                <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                                </marker>
                                <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                                </marker>
                              </defs>
                              
                              <circle cx="100" cy="100" r="80" fill="none" stroke="#1e293b" />
                              <line x1="20" y1="100" x2="180" y2="100" stroke="#1e293b" strokeWidth="0.5" />
                              <line x1="100" y1="20" x2="100" y2="180" stroke="#1e293b" strokeWidth="0.5" />
                              
                              {(() => {
                                const scale = 80 / 10000;
                                const x = 100 + IL * scale * Math.cos(RELAY_MATH.degToRad(angleL));
                                const y = 100 - IL * scale * Math.sin(RELAY_MATH.degToRad(angleL));
                                return <line x1="100" y1="100" x2={x} y2={y} stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arrow-blue)" />;
                              })()}

                              {(() => {
                                const scale = 80 / 10000;
                                const x = 100 + IR * scale * Math.cos(RELAY_MATH.degToRad(remoteSyncAngle));
                                const y = 100 - IR * scale * Math.sin(RELAY_MATH.degToRad(remoteSyncAngle));
                                return <line x1="100" y1="100" x2={x} y2={y} stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow-emerald)" />;
                              })()}

                              {(() => {
                                const scale = 80 / 10000;
                                const { diffX: dx, diffY: dy } = RELAY_MATH.calculateDifferential(
                                  IL, IR, angleL, angleR, txDelay, rxDelay, syncMode, chargingCurrent, cccEnabled
                                );
                                const x = 100 + dx * scale;
                                const y = 100 - dy * scale;
                                return <line x1="100" y1="100" x2={x} y2={y} stroke="#ef4444" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#arrow-red)" />;
                              })()}
                            </svg>
                            
                            <div className="absolute top-2 left-2 flex flex-col gap-1 text-[8px] font-bold bg-slate-100/90 dark:bg-slate-900/90 p-2 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
                              <span className="text-blue-500">■ I_Local</span>
                              <span className="text-emerald-500">■ I_Remote (Synced)</span>
                              <span className="text-red-500">■ I_Diff Vector</span>
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-center text-[9px] font-black uppercase text-slate-600 dark:text-slate-450 tracking-wider">
                            Vector Summation Model (KCL: Idiff = |IL + IR|)
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Right Column: Simulator Controls (Accordion/Tabs grouped to eliminate scrolling) */}
                <div className="lg:col-span-5 space-y-6">
                  <Card isDark={isDark} className="h-full flex flex-col">
                    
                    {/* Control panel header tabs */}
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center flex-wrap gap-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-cyan-500 animate-spin-slow" /> Simulation Controller
                      </h3>
                      
                      <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                        {[
                          { id: 'currents', label: 'Currents' },
                          { id: 'comms', label: 'Channel' },
                          { id: 'relay', label: 'Settings' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveControlTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                              activeControlTab === tab.id
                                ? 'bg-cyan-600 text-slate-950 shadow-md font-bold'
                                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active tab content block */}
                    <div className="mt-4 flex-1 min-h-[420px]">
                      
                      {/* TAB 1: Currents */}
                      {activeControlTab === 'currents' && (
                        <div className="space-y-6">
                          <div>
                            <h5 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-1 mb-4">Substation A (Local)</h5>
                            <div className="space-y-4">
                              <Slider label="Magnitude (IL)" unit="A" min={0} max={10000} step={100} value={IL} onChange={(e) => setIL(Number(e.target.value))} color="blue" />
                              <Slider label="Phase Angle" unit="°" min={-180} max={180} step={5} value={angleL} onChange={(e) => setAngleL(Number(e.target.value))} color="blue" />
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-900">
                            <h5 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-1 mb-4">Substation B (Remote)</h5>
                            <div className="space-y-4">
                              <Slider label="Magnitude (IR)" unit="A" min={0} max={10000} step={100} value={IR} onChange={(e) => setIR(Number(e.target.value))} color="emerald" />
                              <Slider label="Phase Angle" unit="°" min={-180} max={180} step={5} value={angleR} onChange={(e) => setAngleR(Number(e.target.value))} color="emerald" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: Communication Channel */}
                      {activeControlTab === 'comms' && (
                        <div className="space-y-5">
                          <div>
                            <h5 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-1 mb-4">Optical Fiber Latency</h5>
                            <div className="space-y-4">
                              <Slider label="Transmit Path Delay (Tx)" unit="ms" min={0} max={15} step={0.5} value={txDelay} onChange={(e) => setTxDelay(Number(e.target.value))} color="amber" />
                              <Slider label="Receive Path Delay (Rx)" unit="ms" min={0} max={15} step={0.5} value={rxDelay} onChange={(e) => setRxDelay(Number(e.target.value))} color="amber" />
                            </div>
                          </div>

                          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                            <div>
                              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">Time Sync Technology</span>
                              <div className="grid grid-cols-3 gap-2">
                                {(['none', 'pingpong', 'gps'] as const).map(mode => (
                                  <button key={mode} onClick={() => setSyncMode(mode)}
                                    className={`py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${syncMode === mode ? 'bg-cyan-600 border-cyan-500 text-slate-950' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                                    {mode === 'none' ? 'None' : mode === 'pingpong' ? 'Ping-Pong' : 'GPS PTP'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
                              <Slider label="Line Charging Current" unit="A" min={0} max={1000} step={50} value={chargingCurrent} onChange={(e) => setChargingCurrent(Number(e.target.value))} color="purple" />
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Charging Current Comp (CCC)</span>
                                <button onClick={() => setCccEnabled(prev => !prev)}
                                  className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${cccEnabled ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400'}`}>
                                  {cccEnabled ? 'ACTIVE' : 'DISABLED'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: Relay Settings (Dual-Slope & Alpha Plane) */}
                      {activeControlTab === 'relay' && (
                        <div className="space-y-6">
                          <div>
                            <h5 className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-1 mb-3">Dual-Slope Relay Curves</h5>
                            <div className="space-y-4">
                              <Slider label="Min Pickup (I_diff >)" unit="A" min={100} max={1500} step={50} value={minPickup} onChange={(e) => setMinPickup(Number(e.target.value))} color="cyan" />
                              <Slider label="Slope 1 (Initial)" unit="%" min={10} max={50} step={1} value={slope1} onChange={(e) => setSlope1(Number(e.target.value))} color="cyan" />
                              <Slider label="Breakpoint (Slope Transition)" unit="A" min={1000} max={5000} step={100} value={breakpoint} onChange={(e) => setBreakpoint(Number(e.target.value))} color="cyan" />
                              <Slider label="Slope 2 (Saturation/Heavy)" unit="%" min={50} max={100} step={1} value={slope2} onChange={(e) => setSlope2(Number(e.target.value))} color="cyan" />
                            </div>
                          </div>

                          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                            <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-1 mb-3">Alpha-Plane Restraints</h5>
                            <div className="space-y-4">
                              <Slider label="Radius restraint limit (K)" unit="x" min={1.2} max={3.0} step={0.1} value={alphaRatioK} onChange={(e) => setAlphaRatioK(Number(e.target.value))} color="emerald" />
                              <Slider label="Wedge Blocking Angle" unit="°" min={20} max={90} step={5} value={alphaBlockAngle} onChange={(e) => setAlphaBlockAngle(Number(e.target.value))} color="emerald" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* 2. LABS TAB */}
            {activeTab === 'lab' && (
              <div className="space-y-6">
                
                {/* LAB INTRO CARD */}
                <Card isDark={isDark}>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                        <Award className="w-6 h-6 text-amber-500 animate-bounce" /> IEEE C37.243 Compliance Laboratory
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed uppercase tracking-wider">
                        Power system protection demands absolute security and reliability. Run through our 4 certification challenge scenarios simulating physical system constraints. Clear them all to earn the IEEE compliance badge.
                      </p>
                    </div>
                    
                    {/* Badge and completion meter */}
                    <div className="text-center bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 w-full md:w-auto">
                      <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Labs Completed</div>
                      <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400">{labsCompletedCount} / 4</div>
                      {labsCompletedCount === 4 ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-black uppercase inline-block mt-2">✓ Certified Specialist</span>
                      ) : (
                        <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-black uppercase inline-block mt-2">Training In Progress</span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* LAB SELECTOR AND PANEL */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Lab List */}
                  <div className="lg:col-span-4 space-y-4">
                    {labs.map((l, idx) => (
                      <button key={l.id} onClick={() => startLab(idx)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                          currentLab === idx 
                            ? 'bg-cyan-500/10 dark:bg-cyan-950/20 border-cyan-500 text-cyan-700 dark:text-cyan-400 font-bold' 
                            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Lab {idx + 1}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${labStatus[idx] === 'passed' ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400' : labStatus[idx] === 'failed' ? 'bg-red-500/25 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {labStatus[idx] === 'passed' ? 'Passed' : labStatus[idx] === 'failed' ? 'Failed' : 'Not Started'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold">{l.name}</h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-normal uppercase tracking-wider">{l.objective}</p>
                      </button>
                    ))}
                  </div>

                  {/* Right Column: Lab Workspace */}
                  <div className="lg:col-span-8">
                    {currentLab !== null ? (
                      <Card isDark={isDark} className="h-full flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                            <h3 className="text-md font-bold text-adaptive">{labs[currentLab].name}</h3>
                            <button onClick={() => { startLab(currentLab); }} className="text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
                              <RefreshCw className="w-3.5 h-3.5" /> Reset Setup
                            </button>
                          </div>
                          
                          <div className="bg-slate-105 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">System Conditions / Problem</span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed uppercase tracking-wider">{labs[currentLab].description}</p>
                          </div>

                          {labMessage && (
                            <div className={`p-4 rounded-xl border text-xs leading-relaxed uppercase tracking-wider font-bold ${labMessage.startsWith('🎉') ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : labMessage.startsWith('❌') ? 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300'}`}>
                              {labMessage}
                            </div>
                          )}
                        </div>

                        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 flex justify-between items-center flex-wrap gap-3">
                          <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-widest">
                            Adjust Sliders in 'Simulator' Tab, then return here to test
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => setActiveTab('simulator')} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] font-bold rounded-xl uppercase tracking-widest text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2">
                              <Play className="w-4 h-4" /> Go to Simulator
                            </button>
                            <button onClick={verifyLab} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all flex items-center gap-2">
                              <Check className="w-4 h-4" /> Verify Settings
                            </button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card isDark={isDark} className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                        <Award className="w-16 h-16 text-slate-500 dark:text-slate-700 stroke-1" />
                        <h4 className="text-md font-bold text-slate-500 dark:text-slate-400">Workspace Idle</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-500 max-w-sm uppercase tracking-wider leading-relaxed">
                          Select one of the training laboratories on the left to initialize parameters and start your compliance challenge.
                        </p>
                      </Card>
                    )}
                  </div>
                </div>

                {/* COMPLIANCE BADGE POPUP */}
                {labsCompletedCount === 4 && (
                  <Card isDark={isDark} className="border-2 border-amber-500 bg-amber-500/5 py-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                      <Award className="w-12 h-12 text-slate-950" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-amber-500">IEEE C37.243 Compliance Certified</h3>
                      <p className="text-xs text-slate-605 dark:text-slate-400 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                        You have successfully resolved the capacitive charging current, external fault CT saturation, asymmetrical communications channel delay, and sensitive internal fault challenges.
                      </p>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                      Certificate ID: C37-L87-{Math.floor(Math.random() * 900000 + 100000)}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* 3. THEORY TAB */}
            {activeTab === 'theory' && (
              <div className="space-y-6">
                <Card isDark={isDark} className="space-y-6">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-adaptive">Current Differential Protection (87L) Mechanics</h2>
                    <p className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mt-1">IEEE C37.243 Standards Guide</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    
                    {/* Col 1 */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">1. Basic Current Differential (KCL)</h4>
                        <p>
                          ANSI 87L protection operates on the fundamental physical law of Kirchhoff's Current Law. Under normal healthy conditions:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-center text-slate-100">
                          <LaTeX math="\vec{I}_{Local} + \vec{I}_{Remote} = 0" />
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                          Current flowing into the line from local terminal equals current flowing out of the line from the remote terminal (with negative sign polarity alignment).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">2. Dual-Slope Restraint</h4>
                        <p>
                          In real power systems, errors arise from CT mismatch, CT saturation under high through-fault currents, line capacitive charging current, and line tap adjustments. Therefore, the relay restraint slope increases at higher currents:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-center space-y-2 text-[11px] text-slate-100">
                          <div>Restraint Current: <LaTeX math="I_{rest} = \frac{|I_L| + |I_R|}{2}" /></div>
                          <div>For <LaTeX math="I_{rest} \le Breakpoint" />: <LaTeX math="I_{thresh} = Pickup_{min} + Slope_1 \cdot I_{rest}" /></div>
                          <div>For <LaTeX math="I_{rest} > Breakpoint" />: <LaTeX math="I_{thresh} = Pickup_{min} + Slope_1 \cdot BP + Slope_2 \cdot (I_{rest} - BP)" /></div>
                        </div>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">3. Complex Alpha Plane Concept</h4>
                        <p>
                          Modern relays construct the complex ratio of currents to increase security under saturation and transient conditions:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-center text-slate-100">
                          <LaTeX math="\vec{W} = \frac{\vec{I}_{Remote\_sync}}{\vec{I}_{Local}} = R \cdot e^{j \alpha}" />
                        </div>
                        <p>
                          Normal load sits near <LaTeX math="-1" />. Internal faults sit in the right-half plane. The relay defines a blocking boundary centered around 180° with radius bounds <LaTeX math="[1/K, K]" />.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">4. Communication Delay & Synchronization</h4>
                        <p>
                          Line differential relies on transmitting sampled values over fiber paths. If path delays are asymmetrical (different route for transmit vs receive), standard round-trip synchronization assumes a symmetrical delay:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-center text-slate-100">
                          <LaTeX math="Delay_{Error} = \frac{T_{Tx} - T_{Rx}}{2}" />
                        </div>
                        <p>
                          At 50Hz, each 1 ms asymmetry translates into <LaTeX math="18^\circ" /> of phase shift error, generating false differential current. Relays require GPS/PTP precision synchronization to eliminate this timing error.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// Alpha plane restraint wedge generator helper
function getAlphaPlaneRestraintPath(rMin: number, rMax: number, blockAngle: number) {
  const startAngle = 180 - blockAngle;
  const endAngle = 180 + blockAngle;
  
  const p1 = polarToXY(rMax, startAngle);
  const p2 = polarToXY(rMax, endAngle);
  const p3 = polarToXY(rMin, endAngle);
  const p4 = polarToXY(rMin, startAngle);
  
  const rMaxPx = rMax * 50;
  const rMinPx = rMin * 50;
  
  // Sweep flag 1 sweeps clockwise in SVG coordinates
  return `M ${p1.x} ${p1.y} A ${rMaxPx} ${rMaxPx} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rMinPx} ${rMinPx} 0 0 0 ${p4.x} ${p4.y} Z`;
}