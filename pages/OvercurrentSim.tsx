import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Zap, Settings, Activity, ShieldCheck,
  RotateCcw, AlertTriangle, TrendingUp, Book, MonitorPlay,
  Award, Power, CircuitBoard, Check, Play, RefreshCw, Layers,
  History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { Card } from '../components/UI/Card';
import { Slider } from '../components/UI/Slider';
import { LaTeX } from '../components/UI/LaTeX';
import { JargonTooltip } from '../components/UI/JargonTooltip';
import { PageSEO } from "../components/SEO/PageSEO";
import { usePersistentState } from "../hooks/usePersistentState";
import { useTripFeedback } from "../hooks/useTripFeedback";
import { AICopyButton } from "../components/UI/AICopyButton";
import Odometer from '../components/Odometer';

// ============================== IEEE & IEC MATH & CONSTANTS ==============================
const RELAY_CURVES = {
  'IEC_SI': { group: 'IEC 60255', A: 0.14, B: 0, P: 0.02, type: 'inverse', label: 'Standard Inverse (SI)' },
  'IEC_VI': { group: 'IEC 60255', A: 13.5, B: 0, P: 1.0, type: 'inverse', label: 'Very Inverse (VI)' },
  'IEC_EI': { group: 'IEC 60255', A: 80.0, B: 0, P: 2.0, type: 'inverse', label: 'Extremely Inverse (EI)' },
  'IEC_LTI': { group: 'IEC 60255', A: 120, B: 0, P: 1.0, type: 'inverse', label: 'Long-Time Inverse (LTI)' },
  'IEEE_MI': { group: 'IEEE C37.112', A: 0.0515, B: 0.114, P: 0.02, type: 'inverse', label: 'Moderately Inverse (MI)' },
  'IEEE_VI': { group: 'IEEE C37.112', A: 19.61, B: 0.491, P: 2.0, type: 'inverse', label: 'Very Inverse (VI)' },
  'IEEE_EI': { group: 'IEEE C37.112', A: 28.2, B: 0.1217, P: 2.0, type: 'inverse', label: 'Extremely Inverse (EI)' },
  'IEC_DT': { group: 'Definite Time', A: 0, B: 1, P: 0, type: 'definite', label: 'Definite Time (DT)' }
};

const calcTripTime = (I: number, Ip: number, tms: number, curveKey: string) => {
  if (I <= Ip) return null;
  const c = (RELAY_CURVES as any)[curveKey];
  if (!c) return null;
  if (c.type === 'definite') {
    return tms;
  }
  const M = I / Ip;
  const time = tms * (c.A / (Math.pow(M, c.P) - 1) + c.B);
  return Math.max(0.02, time); // 20ms mechanical minimum limit
};

// ============================== COMPLEX VECTOR MATH ==============================
interface Complex { re: number; im: number; }
const addC = (x: Complex, y: Complex): Complex => ({ re: x.re + y.re, im: x.im + y.im });
const mulC = (x: Complex, y: Complex): Complex => ({
  re: x.re * y.re - x.im * y.im,
  im: x.re * y.im + x.im * y.re
});
const magC = (x: Complex) => Math.sqrt(x.re * x.re + x.im * x.im);
const polarC = (mag: number, deg: number): Complex => {
  const rad = (deg * Math.PI) / 180;
  return { re: mag * Math.cos(rad), im: mag * Math.sin(rad) };
};

const aOperator = polarC(1, 120);
const a2Operator = polarC(1, 240);

const calcSymComponents = (Ia: Complex, Ib: Complex, Ic: Complex) => {
  const I0 = {
    re: (Ia.re + Ib.re + Ic.re) / 3,
    im: (Ia.im + Ib.im + Ic.im) / 3
  };
  const a_Ib = mulC(aOperator, Ib);
  const a2_Ic = mulC(a2Operator, Ic);
  const I1 = {
    re: (Ia.re + a_Ib.re + a2_Ic.re) / 3,
    im: (Ia.im + a_Ib.im + a2_Ic.im) / 3
  };
  const a2_Ib = mulC(a2Operator, Ib);
  const a_Ic = mulC(aOperator, Ic);
  const I2 = {
    re: (Ia.re + a2_Ib.re + a_Ic.re) / 3,
    im: (Ia.im + a2_Ib.im + a_Ic.im) / 3
  };
  return { I0: magC(I0), I1: magC(I1), I2: magC(I2) };
};

// ============================== SVG TCC CHART ==============================
const TCCChart = ({ pickup51, tms, curveType, pickup50, faultCurrent, tripTime }: any) => {
  const width = 600;
  const height = 400;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const minI = 0.5, maxI = 100;
  const minT = 0.01, maxT = 100;

  const logMinI = Math.log10(minI), logMaxI = Math.log10(maxI);
  const logMinT = Math.log10(minT), logMaxT = Math.log10(maxT);

  const mapX = (I: number) => padding.left + ((Math.log10(I) - logMinI) / (logMaxI - logMinI)) * innerWidth;
  const mapY = (T: number) => padding.top + innerHeight - ((Math.log10(T) - logMinT) / (logMaxT - logMinT)) * innerHeight;

  const minorX = [0.6, 0.7, 0.8, 0.9, 2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90];
  const majorX = [1, 10, 100];
  const minorY = [0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90];
  const majorY = [0.01, 0.1, 1, 10, 100];

  const curvePath = useMemo(() => {
    let path = '';
    let first = true;
    for (let m = 1.01; m <= maxI; m += 0.1) {
      const t = calcTripTime(m * pickup51, pickup51, tms, curveType);
      if (t === null || t > maxT * 2 || t < minT / 2) continue;
      const x = mapX(m);
      const y = Math.min(Math.max(mapY(t), padding.top), padding.top + innerHeight);
      if (first) { path += `M ${x} ${y} `; first = false; } else { path += `L ${x} ${y} `; }
    }
    return path;
  }, [pickup51, tms, curveType]);

  const downstreamPath = useMemo(() => {
    let path = '';
    let first = true;
    for (let m = minI; m <= maxI; m += 0.1) {
      const I = m * pickup51;
      const t = calcTripTime(I, 200, 0.15, 'IEC_VI');
      if (t === null || t > maxT * 2 || t < minT / 2) continue;
      const x = mapX(m);
      const y = Math.min(Math.max(mapY(t), padding.top), padding.top + innerHeight);
      if (first) { path += `M ${x} ${y} `; first = false; } else { path += `L ${x} ${y} `; }
    }
    return path;
  }, [pickup51]);

  const damagePath = useMemo(() => {
    let path = '';
    let first = true;
    for (let m = minI; m <= maxI; m += 0.1) {
      const I = m * pickup51;
      const t = 4e7 / (I ** 2);
      if (t > maxT * 2 || t < minT / 2) continue;
      const x = mapX(m);
      const y = Math.min(Math.max(mapY(t), padding.top), padding.top + innerHeight);
      if (first) { path += `M ${x} ${y} `; first = false; } else { path += `L ${x} ${y} `; }
    }
    return path;
  }, [pickup51]);

  const x50 = mapX(pickup50 / pickup51);
  const x50_down = mapX(1500 / pickup51);
  const mFault = faultCurrent > 0 ? faultCurrent / pickup51 : 0;
  const xFault = mFault > 0 ? mapX(mFault) : null;
  const yFault = tripTime ? mapY(tripTime) : null;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 relative shadow-[inset_0_0_40px_rgba(0,0,0,0.7)]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-full object-contain p-2">
        <g className="text-slate-900 dark:text-slate-850" strokeWidth="0.5" stroke="currentColor">
          {minorX.map(v => <line key={`mx-${v}`} x1={mapX(v)} y1={padding.top} x2={mapX(v)} y2={padding.top + innerHeight} />)}
          {minorY.map(v => <line key={`my-${v}`} x1={padding.left} y1={mapY(v)} x2={padding.left + innerWidth} y2={mapY(v)} />)}
        </g>
        <g className="text-slate-800 dark:text-slate-700" strokeWidth="1" stroke="currentColor">
          {majorX.map(v => <line key={`vx-${v}`} x1={mapX(v)} y1={padding.top} x2={mapX(v)} y2={padding.top + innerHeight} strokeDasharray={v === 1 ? "4,4" : "none"} strokeOpacity={v === 1 ? 1 : 0.6} />)}
          {majorY.map(v => <line key={`vy-${v}`} x1={padding.left} y1={mapY(v)} x2={padding.left + innerWidth} y2={mapY(v)} strokeOpacity="0.6" />)}
        </g>
        <g stroke="#475569" strokeWidth="2">
          <line x1={padding.left} y1={padding.top + innerHeight} x2={padding.left + innerWidth} y2={padding.top + innerHeight} />
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} />
        </g>
        <g fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
          {majorX.map(v => <text key={`lx-${v}`} x={mapX(v)} y={padding.top + innerHeight + 15}>{v}</text>)}
          <text x={width - 25} y={padding.top + innerHeight + 15} fontWeight="bold" fill="#6366f1">× Ip ({pickup51}A)</text>
          <g textAnchor="end">
            {majorY.map(v => <text key={`ly-${v}`} x={padding.left - 5} y={mapY(v) + 4}>{v}s</text>)}
          </g>
        </g>
        <path d={downstreamPath} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="4,4" strokeOpacity="0.7" />
        {x50_down >= padding.left && x50_down <= padding.left + innerWidth && (
          <line x1={x50_down} y1={padding.top} x2={x50_down} y2={padding.top + innerHeight} stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="3,6" strokeOpacity="0.6" />
        )}
        <path d={damagePath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,3" style={{ filter: 'drop-shadow(0 0 2px rgba(245, 158, 11, 0.4))' }} />
        <motion.path
          d={curvePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.6))' }}
        />
        {x50 >= padding.left && x50 <= padding.left + innerWidth && (
          <g>
            <line x1={x50} y1={padding.top} x2={x50} y2={padding.top + innerHeight} stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" />
            <rect x={x50 - 25} y={padding.top + 8} width="50" height="15" rx="4" fill="#ef4444" />
            <text x={x50} y={padding.top + 18} fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">50 INST</text>
          </g>
        )}
        {xFault && xFault >= padding.left && xFault <= padding.left + innerWidth && yFault && yFault >= padding.top && yFault <= padding.top + innerHeight && (
          <g>
            <line x1={padding.left} y1={yFault} x2={xFault} y2={yFault} stroke="#6366f1" strokeWidth="1" strokeDasharray="4,4" />
            <line x1={xFault} y1={padding.top + innerHeight} x2={xFault} y2={yFault} stroke="#6366f1" strokeWidth="1" strokeDasharray="4,4" />
            <circle cx={xFault} cy={yFault} r="6" fill={faultCurrent >= pickup50 ? "#ef4444" : "#6366f1"} stroke="#fff" strokeWidth="2" />
            <circle cx={xFault} cy={yFault} r="14" fill={faultCurrent >= pickup50 ? "#ef4444" : "#6366f1"} fillOpacity="0.25" className="animate-ping" />
          </g>
        )}
        <g transform="translate(380, 20)" fontSize="8" fontFamily="sans-serif" fill="#94a3b8">
          <rect width="160" height="65" fill="rgba(15, 23, 42, 0.95)" stroke="#334155" rx="6" />
          <line x1="10" y1="15" x2="30" y2="15" stroke="#6366f1" strokeWidth="2.5" />
          <text x="35" y="18">Primary Relay (51)</text>
          <line x1="10" y1="30" x2="30" y2="30" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="3,3" />
          <text x="35" y="33">Downstream Relay (Coordinated)</text>
          <line x1="10" y1="45" x2="30" y2="45" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />
          <text x="35" y="48">Transformer Damage Limit</text>
        </g>
      </svg>
    </div>
  );
};

// ============================== MAIN APP ==============================
export default function OvercurrentSim() {
  const isDark = useThemeObserver();
  const [activeTab, setActiveTab] = useState('simulator');
  
  // Dashboard navigation sub-tabs
  const [activeChartTab, setActiveChartTab] = useState<'tcc' | 'faceplate' | 'oscilloscope' | 'phasor' | 'sld'>('tcc');
  const [activeControlTab, setActiveControlTab] = useState<'faults' | 'relay' | 'labs'>('faults');

  // Relay Configuration States
  const [pickup51, setPickup51] = usePersistentState('oc_pickup51', 400);
  const [tms, setTms] = usePersistentState('oc_tms', 0.3);
  const [curveType, setCurveType] = usePersistentState('oc_curve', 'IEC_SI');
  const [pickup50, setPickup50] = usePersistentState('oc_pickup50', 4000);
  const [faultCurrent, setFaultCurrent] = usePersistentState('oc_fault', 0);
  const [faultPhaseMode, setFaultPhaseMode] = useState<'A-G' | 'B-C' | 'A-B-C'>('A-G');
  
  // Simulation Loop States
  const [running, setRunning] = useState(false);
  const [breakerOpen, setBreakerOpen] = useState(false);
  const [downstreamBreakerOpen, setDownstreamBreakerOpen] = useState(false);
  const [phase, setPhase] = useState('MONITORING');
  const [elapsed, setElapsed] = useState(0);
  const [relayAccumulator, setRelayAccumulator] = useState(0);
  const [downstreamAccumulator, setDownstreamAccumulator] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [faultType, setFaultType] = useState<'normal' | 'overload' | 'short_circuit' | 'inrush' | 'ct_sat'>('normal');

  // Hardware faceplate latching flags
  const [ledEN, setLedEN] = useState(true);
  const [led51P, setLed51P] = useState(false);
  const [led50P, setLed50P] = useState(false);
  const [ledTRIP, setLedTRIP] = useState(false);
  const [ledIA, setLedIA] = useState(false);
  const [ledIB, setLedIB] = useState(false);
  const [ledIC, setLedIC] = useState(false);
  const [ledIG, setLedIG] = useState(false);
  const [lcdMsg, setLcdMsg] = useState('SYSTEM NORMAL\nMONITORING ACTIVE');

  const { isTripping, triggerTrip } = useTripFeedback();
  const timerRef = useRef<any>(null);

  // Guided Labs State
  const [currentLab, setCurrentLab] = useState<number | null>(null);
  const [labStatus, setLabStatus] = useState<('not_started' | 'passed' | 'failed')[]>([
    'not_started', 'not_started', 'not_started', 'not_started'
  ]);
  const [labMessage, setLabMessage] = useState<string | null>(null);

  // Calculate dynamic physical phase currents based on fault selection
  const phaseCurrents = useMemo(() => {
    if (breakerOpen || downstreamBreakerOpen) {
      return { Ia: polarC(0, 0), Ib: polarC(0, 0), Ic: polarC(0, 0) };
    }
    
    let baseLoad = 120;
    if (faultType === 'normal') {
      return { Ia: polarC(300, 0), Ib: polarC(300, -120), Ic: polarC(300, 120) };
    }

    if (faultType === 'inrush') {
      const iaPeak = 1500 * Math.exp(-elapsed / 0.08) + 120;
      return { Ia: polarC(iaPeak, 0), Ib: polarC(baseLoad, -120), Ic: polarC(baseLoad, 120) };
    }

    let faultI = faultCurrent;
    if (faultType === 'ct_sat') {
      const saturationStart = 0.02;
      if (elapsed > saturationStart) {
        faultI = faultCurrent * (0.60 + 0.40 * Math.exp(-(elapsed - saturationStart) / 0.15));
      }
    }

    if (faultPhaseMode === 'A-G') {
      return { Ia: polarC(faultI, 0), Ib: polarC(baseLoad, -120), Ic: polarC(baseLoad, 120) };
    } else if (faultPhaseMode === 'B-C') {
      return { Ia: polarC(baseLoad, 0), Ib: polarC(faultI, -150), Ic: polarC(faultI, 30) };
    } else {
      // 3-Phase balanced fault
      return { Ia: polarC(faultI, 0), Ib: polarC(faultI, -120), Ic: polarC(faultI, 120) };
    }
  }, [faultCurrent, faultType, faultPhaseMode, breakerOpen, downstreamBreakerOpen, elapsed]);

  // Compute symmetrical sequence components (I0, I1, I2)
  const symComponents = useMemo(() => {
    return calcSymComponents(phaseCurrents.Ia, phaseCurrents.Ib, phaseCurrents.Ic);
  }, [phaseCurrents]);

  const tripTime = useMemo(() => calcTripTime(faultCurrent, pickup51, tms, curveType), [faultCurrent, pickup51, tms, curveType]);

  const groupedCurves = useMemo(() => {
    const groups: Record<string, any[]> = {};
    Object.entries(RELAY_CURVES).forEach(([k, v]) => {
      if (!groups[v.group]) groups[v.group] = [];
      groups[v.group].push({ id: k, ...v });
    });
    return groups;
  }, []);

  const addEvent = (msg: string, type: 'info' | 'success' | 'trip' | 'warning') => {
    setEvents(prev => [{ id: Math.random(), time: elapsed, msg, type }, ...prev].slice(0, 15));
  };

  const clearTargets = () => {
    setLedTRIP(false);
    setLedIA(false);
    setLedIB(false);
    setLedIC(false);
    setLedIG(false);
    setLcdMsg(breakerOpen ? 'TRIP LATCHED\nSYSTEM TRIPPED' : 'SYSTEM NORMAL\nMONITORING ACTIVE');
    addEvent('ℹ️ Relay targets reset successfully.', 'info');
  };

  const startFault = (type: 'normal' | 'overload' | 'short_circuit' | 'inrush' | 'ct_sat') => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    
    setRunning(true);
    setBreakerOpen(false);
    setDownstreamBreakerOpen(false);
    setElapsed(0);
    setRelayAccumulator(0);
    setDownstreamAccumulator(0);
    setPhase(type === 'normal' ? 'MONITORING' : 'FAULT');
    setFaultType(type);
    
    let faultCurrentVal = faultCurrent;
    if (type === 'overload') {
      faultCurrentVal = Math.max(faultCurrent, pickup51 * 1.6);
      setFaultCurrent(faultCurrentVal);
    } else if (type === 'short_circuit') {
      faultCurrentVal = Math.max(faultCurrent, pickup50 * 1.1);
      setFaultCurrent(faultCurrentVal);
    } else if (type === 'inrush') {
      faultCurrentVal = 1800;
      setFaultCurrent(faultCurrentVal);
    } else if (type === 'ct_sat') {
      faultCurrentVal = 6000;
      setFaultCurrent(faultCurrentVal);
    } else if (type === 'normal') {
      faultCurrentVal = 300;
      setFaultCurrent(faultCurrentVal);
    }

    setEvents([]);
    addEvent(`⚡ Injection initiated: ${type.toUpperCase()} mode. Current = ${faultCurrentVal}A`, 'info');

    const startTimestamp = performance.now();
    let prevTime = startTimestamp;
    let localRelayAccum = 0;
    let localDownstreamAccum = 0;
    let localBreakerOpen = false;
    let localDownstreamBreakerOpen = false;

    const update = (now: number) => {
      const dt = (now - prevTime) / 1000;
      prevTime = now;
      const stepDt = Math.min(dt, 0.05);
      
      setElapsed(prev => {
        const next = prev + stepDt;
        
        let I_instant = faultCurrentVal;
        if (type === 'inrush') {
          I_instant = 1500 * Math.exp(-next / 0.08) + 300;
        } else if (type === 'ct_sat') {
          const saturationStart = 0.02; 
          if (next > saturationStart) {
            I_instant = faultCurrentVal * (0.60 + 0.40 * Math.exp(-(next - saturationStart) / 0.15));
          }
        } else if (type === 'normal') {
          I_instant = 300;
        }

        // Target flags calculation during loop
        if (I_instant > pickup51) setLed51P(true);
        else setLed51P(false);

        if (I_instant >= pickup50) setLed50P(true);
        else setLed50P(false);

        // Update LCD screen text dynamically
        setLcdMsg(`MONITORING: ${type.toUpperCase()}\nI_MEASURED: ${Math.round(I_instant)}A\n51P CHARGE: ${Math.round(localRelayAccum * 100)}%`);

        // Downstream Breaker Logic
        const isDownstreamFault = (type === 'short_circuit' || type === 'overload' || type === 'ct_sat');
        if (isDownstreamFault && !localDownstreamBreakerOpen && !localBreakerOpen) {
          if (I_instant >= 1500) {
            if (next >= 0.03) {
              localDownstreamBreakerOpen = true;
              setDownstreamBreakerOpen(true);
              addEvent(`✅ Downstream Breaker 52D cleared fault in 0.030s (ANSI 50)`, 'success');
              addEvent(`ℹ️ Upstream relay resets safely. Coordination intact.`, 'info');
              setLcdMsg(`FAULT CLEARED\nBY FEEDER 52D`);
            }
          } else if (I_instant > 200) {
            const t_down = calcTripTime(I_instant, 200, 0.15, 'IEC_VI');
            if (t_down) {
              localDownstreamAccum += stepDt / t_down;
              setDownstreamAccumulator(Math.min(1.0, localDownstreamAccum));
              if (localDownstreamAccum >= 1.0) {
                localDownstreamBreakerOpen = true;
                setDownstreamBreakerOpen(true);
                addEvent(`✅ Downstream Breaker 52D cleared fault in ${next.toFixed(3)}s (ANSI 51)`, 'success');
                addEvent(`ℹ️ Upstream relay resets safely. Coordination intact.`, 'info');
                setLcdMsg(`FAULT CLEARED\nBY FEEDER 52D`);
              }
            }
          }
        }

        // Upstream Relay Logic (Our Relay)
        if (!localBreakerOpen && !localDownstreamBreakerOpen) {
          // Check ANSI 50
          if (I_instant >= pickup50) {
            if (next >= 0.03) {
              localBreakerOpen = true;
              setBreakerOpen(true);
              setRunning(false);
              setPhase('TRIPPED');
              triggerTrip();
              
              setLedTRIP(true);
              if (faultPhaseMode === 'A-G' || type === 'inrush' || type === 'ct_sat') { setLedIA(true); setLedIG(true); }
              else if (faultPhaseMode === 'B-C') { setLedIB(true); setLedIC(true); }
              else { setLedIA(true); setLedIB(true); setLedIC(true); }

              setLcdMsg(`🚨 TRIP: ANSI 50\nI_TRIP: ${Math.round(I_instant)}A`);
              addEvent(`🚨 Upstream Breaker 52 TRIPPED in 0.030s (ANSI 50)`, 'trip');
              if (isDownstreamFault) {
                addEvent(`⚠️ COORDINATION BREACH: Upstream relay tripped before downstream feeder cleared!`, 'warning');
              }
              return next;
            }
          }

          // Check ANSI 51
          if (I_instant > pickup51) {
            const t_up = calcTripTime(I_instant, pickup51, tms, curveType);
            if (t_up) {
              localRelayAccum += stepDt / t_up;
              setRelayAccumulator(Math.min(1.0, localRelayAccum));
              if (localRelayAccum >= 1.0) {
                localBreakerOpen = true;
                setBreakerOpen(true);
                setRunning(false);
                setPhase('TRIPPED');
                triggerTrip();
                
                setLedTRIP(true);
                if (faultPhaseMode === 'A-G' || type === 'inrush' || type === 'ct_sat') { setLedIA(true); setLedIG(true); }
                else if (faultPhaseMode === 'B-C') { setLedIB(true); setLedIC(true); }
                else { setLedIA(true); setLedIB(true); setLedIC(true); }

                setLcdMsg(`🚨 TRIP: ANSI 51\nTIME: ${next.toFixed(3)}s`);
                addEvent(`🚨 Upstream Breaker 52 TRIPPED in ${next.toFixed(3)}s (ANSI 51)`, 'trip');
                
                const damageLimit = 4e7 / (I_instant ** 2);
                if (next > damageLimit) {
                  addEvent(`🔥 DAMAGE COLLATERAL: Transformer damage limit of ${damageLimit.toFixed(2)}s exceeded!`, 'warning');
                }
                if (isDownstreamFault) {
                  addEvent(`⚠️ COORDINATION BREACH: Upstream relay tripped before downstream feeder cleared!`, 'warning');
                }
                return next;
              }
            }
          } else {
            localRelayAccum = Math.max(0, localRelayAccum - stepDt / 0.5);
            setRelayAccumulator(localRelayAccum);
          }
        }

        if (localDownstreamBreakerOpen) {
          setRunning(false);
          setPhase('MONITORING');
          addEvent(`ℹ️ Injected current collapsed to 0A. System healthy.`, 'info');
          return next;
        }

        if (next >= 3.5) {
          setRunning(false);
          setPhase('MONITORING');
          setLed51P(false);
          setLed50P(false);
          addEvent(`ℹ️ Fault cleared by backup / timeout at 3.500s. No trip.`, 'info');
          setLcdMsg(`SYSTEM CLEAR\nBACKUP TIMEOUT`);
          return 3.5;
        }

        timerRef.current = requestAnimationFrame(update);
        return next;
      });
    };
    
    timerRef.current = requestAnimationFrame(update);
  };

  const reset = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setPhase('MONITORING');
    setElapsed(0);
    setRunning(false);
    setBreakerOpen(false);
    setDownstreamBreakerOpen(false);
    setRelayAccumulator(0);
    setDownstreamAccumulator(0);
    setEvents([]);
    setFaultCurrent(0);
    setFaultType('normal');
    setLed51P(false);
    setLed50P(false);
    setLcdMsg('SYSTEM NORMAL\nMONITORING ACTIVE');
  };

  // Graded Labs Configuration
  const labs = useMemo(() => [
    {
      id: 0,
      name: "Lab 1: Transformer Thermal Protection",
      objective: "Coordinate relay to trip before a 3000A through-fault damages the transformer.",
      description: "A downstream transformer is subjected to a massive 3000A through-fault. The transformer's thermal damage limit at 3000A is exactly 0.75s. If the relay doesn't trip in less than 0.75s, a catastrophic fire occurs. Graded settings must trip in under 0.75s.",
      setup: () => {
        setPickup51(400);
        setTms(0.5);
        setCurveType('IEC_SI');
        setPickup50(10000);
        setFaultCurrent(3000);
        setFaultPhaseMode('A-G');
        reset();
      },
      check: () => {
        const t = calcTripTime(3000, pickup51, tms, curveType);
        return t !== null && t < 0.75;
      },
      hint: "Select a faster curve like IEC Extremely Inverse (IEC_EI) or lower the TMS setting below 0.35."
    },
    {
      id: 1,
      name: "Lab 2: Upstream Feeder Coordination Grading",
      objective: "Achieve grading selectivity above downstream feeder breaker.",
      description: "A downstream short circuit occurs. The downstream breaker 52D clears the fault in 0.25s. To avoid blinding upstream sections, the local relay must act as backup and grade at least 0.30s CTI above the downstream breaker (total upstream trip time between 0.55s and 0.85s at 2500A). Ensure the upstream relay does not false-trip before 52D clears.",
      setup: () => {
        setPickup51(400);
        setTms(0.15);
        setCurveType('IEC_VI');
        setPickup50(10000);
        setFaultCurrent(2500);
        setFaultPhaseMode('A-G');
        reset();
      },
      check: () => {
        const t = calcTripTime(2500, pickup51, tms, curveType);
        return t !== null && t >= 0.55 && t <= 0.85;
      },
      hint: "Set pickup (Ip) around 500-600A and adjust TMS to ~0.45 under IEC Very Inverse (IEC_VI)."
    },
    {
      id: 2,
      name: "Lab 3: Inrush Magnetizing Ride-Through",
      objective: "Prevent false-trips during transformer magnetic energization.",
      description: "Transformer energization produces a massive transient inrush current peaking at 1500A. The relay must ride through this peak without tripping, yet retain sensitivity to clear a sustained 900A overload. Overload protection requires pickup Ip <= 800A.",
      setup: () => {
        setPickup51(200);
        setTms(0.05);
        setCurveType('IEC_SI');
        setPickup50(8000);
        setFaultCurrent(1500);
        setFaultPhaseMode('A-G');
        reset();
      },
      check: () => {
        if (pickup51 > 800) return false;
        let accum = 0;
        const dt = 0.01;
        for (let t = 0; t < 2.0; t += dt) {
          const I = 1500 * Math.exp(-t / 0.08) + 300;
          if (I > pickup51) {
            const tripT = calcTripTime(I, pickup51, tms, curveType);
            if (tripT) accum += dt / tripT;
          }
        }
        return accum < 1.0;
      },
      hint: "Raise pickup (Ip) to 600A (retaining Ip <= 800A overload protection) and increase TMS to 0.25 to damp out the inrush integration energy."
    },
    {
      id: 3,
      name: "Lab 4: Definite Time Backup Protection",
      objective: "Configure a Definite Time (DT) element for weak grid fault backup.",
      description: "Under minimum generation conditions, fault current falls to 1200A. An inverse curve is too slow under this level. Select a Definite Time curve, set the pickup below 1000A, and program the time dial to clear the fault in exactly 200ms.",
      setup: () => {
        setPickup51(400);
        setTms(0.5);
        setCurveType('IEC_SI');
        setFaultCurrent(1200);
        setFaultPhaseMode('A-G');
        reset();
      },
      check: () => {
        return curveType === 'IEC_DT' && pickup51 <= 1000 && tms === 0.20;
      },
      hint: "Select Definite Time (IEC_DT) from the dropdown, set Ip <= 1000A, and set the TMS dial to exactly 0.20."
    }
  ], [pickup51, tms, curveType, pickup50]);

  const startLab = (idx: number) => {
    setCurrentLab(idx);
    labs[idx].setup();
    setLabMessage("Lab parameters loaded successfully! Adjust parameters in the settings panel and test.");
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
      setLabMessage("🎉 Success! Graded criteria fully met. You cleared the compliance check.");
    } else {
      setLabMessage(`❌ Verification Failed. Hint: ${labs[currentLab].hint}`);
    }
  };

  const tabs = [
    { id: 'simulator', label: 'SIMULATOR', icon: <MonitorPlay className="w-4 h-4" /> },
    { id: 'theory', label: 'THEORY', icon: <Book className="w-4 h-4" /> },
    { id: 'quiz', label: 'QUIZ', icon: <Award className="w-4 h-4" /> }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
      <PageSEO 
        title="OCGUARD PRO: World-Class Protective Relay Simulator"
        description="Premium interactive ANSI 50/51 coordination platform. Plots 3-phase waveforms, vector phasors, symmetrical sequence components, and faceplate consoles."
        url="/overcurrentsim"
      />

      {/* HEADER */}
      <header className={`h-24 backdrop-blur-xl border-b px-6 lg:px-10 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-5">
           <div className="bg-indigo-650 p-3 rounded-2xl text-white shadow-[0_0_25px_rgba(99,102,241,0.5)]"><CircuitBoard className="w-8 h-8"/></div>
           <div>
             <h1 className="font-black text-2xl lg:text-3xl tracking-tighter uppercase leading-none text-adaptive">OC<span className="text-indigo-500">GUARD</span> PRO</h1>
             <div className="text-[10px] font-black text-slate-550 uppercase tracking-[0.3em] mt-1">Virtual Test Bench | Coordination Labs</div>
           </div>
        </div>

        <nav className={`hidden md:flex p-1.5 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-250 shadow-inner'}`}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-350'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <AICopyButton state={{ pickup51, tms, curveType, pickup50, faultCurrent, faultType }} toolName="OCGuard Pro Hardware Simulation" />
        </div>
      </header>

      {/* MOBILE NAV */}
      <div className="md:hidden flex justify-around p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955/40">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${activeTab === t.id ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-500'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <main className="w-full mx-auto p-4 lg:p-6 min-h-[calc(100vh-6rem)] max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            
            {/* 1. SIMULATOR TAB */}
            {activeTab === 'simulator' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Visualizers Grid */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* MULTI-TAB GRAPHICS PANEL */}
                  <Card isDark={isDark} noPadding className="overflow-hidden flex flex-col h-[460px]">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 flex-wrap gap-2">
                      <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" /> Visualization Matrix
                      </h3>
                      
                      <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850 flex-wrap">
                        {[
                          { id: 'tcc', label: 'TCC coordination' },
                          { id: 'oscilloscope', label: 'Oscilloscope' },
                          { id: 'phasor', label: 'Vector Phasor' },
                          { id: 'faceplate', label: 'Relay Console' },
                          { id: 'sld', label: 'Feeder SLD' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveChartTab(tab.id as any)}
                            className={`px-2.5 py-1.5 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all ${
                              activeChartTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-md font-bold'
                                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-350'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 relative bg-slate-950">
                      
                      {/* SUB-PANEL 1: TCC */}
                      {activeChartTab === 'tcc' && (
                        <TCCChart pickup51={pickup51} tms={tms} curveType={curveType} pickup50={pickup50} faultCurrent={faultCurrent} tripTime={tripTime} />
                      )}

                      {/* SUB-PANEL 2: OSCILLOSCOPE */}
                      {activeChartTab === 'oscilloscope' && (
                        <div className="w-full h-full bg-[#050b14] p-4 flex flex-col justify-between">
                          <div className="text-[8px] font-mono text-emerald-500 flex justify-between border-b border-emerald-950 pb-1">
                            <span>CH1: IA (YELLOW) | CH2: IB (BLUE) | CH3: IC (RED)</span>
                            <span>TIMEBASE: 5ms/div | 60Hz TRG</span>
                          </div>
                          
                          <div className="flex-1 min-h-0 relative">
                            <svg className="w-full h-full" viewBox="0 0 500 200">
                              {/* Grid dividers */}
                              <g stroke="#0f2619" strokeWidth="0.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <line key={`gx-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="200" />)}
                                {[1, 2, 3].map(i => <line key={`gy-${i}`} x1="0" y1={i * 50} x2="500" y2={i * 50} />)}
                                <line x1="0" y1="100" x2="500" y2="100" stroke="#1f4c33" strokeWidth="1.5" />
                              </g>
                              
                              {/* Draw moving wave lines */}
                              {(() => {
                                const pointsA: string[] = [];
                                const pointsB: string[] = [];
                                const pointsC: string[] = [];
                                const w = 2 * Math.PI * 60;
                                const scaleY = 40; // visual scaling
                                
                                for (let x = 0; x <= 500; x += 2) {
                                  const t = (x / 500) * 0.04; // 40ms window
                                  
                                  // Compute magnitudes representing phase load
                                  let ampA = phaseCurrents.Ia.re;
                                  let ampB = phaseCurrents.Ib.re;
                                  let ampC = phaseCurrents.Ic.re;

                                  // Apply instantaneous CT saturation clipping
                                  if (faultType === 'ct_sat' && !breakerOpen) {
                                    const limit = pickup51 * 1.7;
                                    ampA = Math.sign(ampA) * Math.min(Math.abs(ampA), limit);
                                  }

                                  const radA = w * (t + elapsed) + (0 * Math.PI) / 180;
                                  const radB = w * (t + elapsed) + (-120 * Math.PI) / 180;
                                  const radC = w * (t + elapsed) + (120 * Math.PI) / 180;

                                  let vA = ampA * Math.sin(radA);
                                  let vB = ampB * Math.sin(radB);
                                  let vC = ampC * Math.sin(radC);

                                  // Add decay DC offsets for inrush
                                  if (faultType === 'inrush' && !breakerOpen) {
                                    const offset = 1200 * Math.exp(-(elapsed + t) / 0.08);
                                    vA += offset;
                                  }

                                  const yA = 100 - (vA / 3000) * scaleY;
                                  const yB = 100 - (vB / 3000) * scaleY;
                                  const yC = 100 - (vC / 3000) * scaleY;

                                  pointsA.push(`${x},${Math.min(200, Math.max(0, yA))}`);
                                  pointsB.push(`${x},${Math.min(200, Math.max(0, yB))}`);
                                  pointsC.push(`${x},${Math.min(200, Math.max(0, yC))}`);
                                }

                                return (
                                  <g fill="none" strokeWidth="2">
                                    <path d={`M ${pointsB.join(' L ')}`} stroke="#06b6d4" />
                                    <path d={`M ${pointsC.join(' L ')}`} stroke="#ef4444" />
                                    <path d={`M ${pointsA.join(' L ')}`} stroke="#eab308" />
                                  </g>
                                );
                              })()}
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* SUB-PANEL 3: PHASORS & SEQUENCE BARS */}
                      {activeChartTab === 'phasor' && (
                        <div className="w-full h-full p-4 flex flex-col md:flex-row gap-4 items-center justify-around bg-[#070b13]">
                          {/* Polar Phasor Grid */}
                          <div className="w-48 h-48 relative border border-slate-800 rounded-full flex items-center justify-center bg-slate-950">
                            <svg className="w-full h-full" viewBox="0 0 200 200">
                              <circle cx="100" cy="100" r="80" stroke="#1e293b" strokeWidth="1" fill="none" />
                              <circle cx="100" cy="100" r="50" stroke="#1e293b" strokeWidth="1" fill="none" strokeDasharray="3,3" />
                              <line x1="20" y1="100" x2="180" y2="100" stroke="#334155" strokeWidth="1" />
                              <line x1="100" y1="20" x2="100" y2="180" stroke="#334155" strokeWidth="1" />
                              
                              {/* Draw vector lines */}
                              {(() => {
                                const drawVector = (c: Complex, color: string) => {
                                  const mag = magC(c);
                                  const r = Math.min(80, (mag / 5000) * 80);
                                  const rad = Math.atan2(c.im, c.re);
                                  const dx = r * Math.cos(rad);
                                  const dy = r * Math.sin(rad);
                                  return (
                                    <g key={color}>
                                      <line x1="100" y1="100" x2={100 + dx} y2={100 - dy} stroke={color} strokeWidth="3" markerEnd="url(#arrow)" strokeLinecap="round" />
                                      <circle cx={100 + dx} cy={100 - dy} r="3" fill="#ffffff" />
                                    </g>
                                  );
                                };

                                return (
                                  <>
                                    <defs>
                                      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                        <path d="M 0 2 L 10 5 L 0 8 z" fill="#fff" />
                                      </marker>
                                    </defs>
                                    {drawVector(phaseCurrents.Ia, '#eab308')}
                                    {drawVector(phaseCurrents.Ib, '#06b6d4')}
                                    {drawVector(phaseCurrents.Ic, '#ef4444')}
                                  </>
                                );
                              })()}
                            </svg>
                            <span className="absolute bottom-2 text-[8px] font-mono text-slate-500">Phasor Plane: I_A, I_B, I_C</span>
                          </div>

                          {/* Symmetrical Sequence components bars */}
                          <div className="flex-1 w-full max-w-[200px] flex flex-col justify-center space-y-4">
                            <span className="text-[8px] font-black tracking-widest text-slate-550 uppercase">Symmetrical Components</span>
                            <div className="space-y-3">
                              {[
                                { label: 'I1 Positive Sequence', val: symComponents.I1, color: 'bg-emerald-500 text-emerald-400' },
                                { label: 'I2 Negative Sequence', val: symComponents.I2, color: 'bg-rose-500 text-rose-400' },
                                { label: 'I0 Zero Sequence (Ground)', val: symComponents.I0, color: 'bg-amber-500 text-amber-400' }
                              ].map(comp => (
                                <div key={comp.label} className="space-y-1">
                                  <div className="flex justify-between text-[8px] font-mono">
                                    <span className="text-slate-400">{comp.label}</span>
                                    <span className={comp.color.split(' ')[1]}>{Math.round(comp.val)} A</span>
                                  </div>
                                  <div className="h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${comp.color.split(' ')[0]} transition-all duration-150`} style={{ width: `${Math.min(100, (comp.val / 5000) * 100)}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-PANEL 4: PHYSICAL HARDWARE FACEPLATE */}
                      {activeChartTab === 'faceplate' && (
                        <div className="w-full h-full bg-[#1b222d] border border-slate-700 flex flex-col justify-between p-5 relative shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
                          {/* Faceplate Header */}
                          <div className="flex justify-between items-center border-b border-slate-600 pb-3">
                            <span className="text-[10px] font-black text-slate-350 tracking-[0.2em]">OCGUARD PRO - ANSI 50/51</span>
                            <span className="text-[8px] font-mono text-indigo-400">MICROPROCESSOR PROTECTION UNIT</span>
                          </div>

                          {/* LCD Screen Display */}
                          <div className="flex-1 my-4 bg-[#0a200f] border-2 border-slate-650 rounded-lg p-3 font-mono text-[10px] text-green-400 font-bold leading-relaxed relative overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] select-none">
                            {/* Cathode screen scan lines */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%]" />
                            <pre className="h-full flex flex-col justify-between uppercase">{lcdMsg}</pre>
                          </div>

                          {/* LED Targets Grid */}
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 items-center border-t border-slate-600 pt-3">
                            {[
                              { label: 'EN', lit: ledEN, color: 'bg-green-500 shadow-green-500/80 border-green-300' },
                              { label: '51P', lit: led51P, color: 'bg-amber-500 shadow-amber-500/80 border-amber-300' },
                              { label: '50P', lit: led50P, color: 'bg-amber-500 shadow-amber-500/80 border-amber-300' },
                              { label: 'TRIP', lit: ledTRIP, color: 'bg-red-500 shadow-red-500/80 border-red-300' },
                              { label: 'IA', lit: ledIA, color: 'bg-red-500 shadow-red-500/80 border-red-300' },
                              { label: 'IB', lit: ledIB, color: 'bg-red-500 shadow-red-500/80 border-red-300' },
                              { label: 'IC', lit: ledIC, color: 'bg-red-500 shadow-red-500/80 border-red-300' },
                              { label: 'IG', lit: ledIG, color: 'bg-red-500 shadow-red-500/80 border-red-300' }
                            ].map(led => (
                              <div key={led.label} className="flex flex-col items-center space-y-1">
                                <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${led.lit ? `${led.color} shadow-[0_0_8px_4px]` : 'bg-slate-900 border-slate-800'}`} />
                                <span className="text-[7.5px] font-black font-mono text-slate-400">{led.label}</span>
                              </div>
                            ))}
                          </div>

                          {/* Tactile Push Buttons */}
                          <div className="absolute right-6 top-16 flex flex-col space-y-2">
                            <button onClick={clearTargets} className="px-3 py-1.5 bg-[#402a2a] hover:bg-[#593939] border border-[#6b4747] text-red-300 rounded font-black text-[8px] tracking-wider uppercase transition-all shadow active:translate-y-0.5">
                              RESET targets
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SUB-PANEL 5: FEEDER SLD */}
                      {activeChartTab === 'sld' && (
                        <div className="w-full h-full bg-[#0a0f18] p-6 flex flex-col justify-between overflow-hidden relative">
                          <div className="flex-1 flex items-center justify-center">
                            <svg className="w-full max-w-2xl h-32" viewBox="0 0 600 120">
                              <line x1="40" y1="20" x2="40" y2="100" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
                              <text x="40" y="15" textAnchor="middle" fill="#64748b" className="text-[8px] font-mono font-bold">11kV BUS</text>
                              <line x1="40" y1="60" x2="560" y2="60" stroke="#1e293b" strokeWidth="4" />
                              {running && !breakerOpen && (
                                <path d="M 40,60 L 560,60" fill="none" 
                                  stroke={faultType === 'inrush' ? '#c084fc' : faultType === 'normal' ? '#38bdf8' : '#f87171'} 
                                  strokeWidth={faultType === 'normal' ? '2.5' : '4'}
                                  className={`flow-line ${faultType === 'inrush' ? 'flow-inrush' : faultType === 'normal' ? 'flow-normal' : 'flow-fault'}`} 
                                  style={{
                                    strokeDasharray: '6,6',
                                    animation: `flowR ${faultType === 'normal' ? '2.5s' : faultType === 'inrush' ? '1.4s' : '0.8s'} linear infinite`
                                  }}
                                />
                              )}
                              <g transform="translate(100, 45)">
                                <rect width="40" height="30" fill="none" stroke="#475569" strokeWidth="1" rx="4" />
                                <circle cx="10" cy="15" r="3" fill="#64748b" />
                                <circle cx="30" cy="15" r="3" fill="#64748b" />
                                <line x1="10" y1="15" x2={breakerOpen ? "25" : "30"} y2={breakerOpen ? "0" : "15"} stroke={breakerOpen ? "#f87171" : "#34d399"} strokeWidth="2.5" className="transition-all duration-300" />
                                <text x="20" y="-4" textAnchor="middle" fill="#64748b" className="text-[7px] font-bold font-mono">52_U</text>
                              </g>
                              <g transform="translate(190, 45)">
                                <circle cx="15" cy="15" r="12" fill="none" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.8" />
                                <circle cx="25" cy="15" r="12" fill="none" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.8" />
                                <text x="20" y="-4" textAnchor="middle" fill="#6366f1" className="text-[7px] font-bold font-mono">CT_51</text>
                              </g>
                              <g transform="translate(360, 45)">
                                <rect width="40" height="30" fill="none" stroke="#475569" strokeWidth="1" rx="4" />
                                <circle cx="10" cy="15" r="3" fill="#64748b" />
                                <circle cx="30" cy="15" r="3" fill="#64748b" />
                                <line x1="10" y1="15" x2={downstreamBreakerOpen ? "25" : "30"} y2={downstreamBreakerOpen ? "0" : "15"} stroke={downstreamBreakerOpen ? "#f87171" : "#34d399"} strokeWidth="2.5" className="transition-all duration-300" />
                                <text x="20" y="-4" textAnchor="middle" fill="#64748b" className="text-[7px] font-bold font-mono">52_D</text>
                              </g>
                              {running && faultType !== 'normal' && !breakerOpen && !downstreamBreakerOpen && (
                                <g transform="translate(480, 60)">
                                  <circle cx="0" cy="0" r="18" fill="rgba(239,68,68,0.2)" className="animate-ping" />
                                  <circle cx="0" cy="0" r="8" fill="#ef4444" />
                                  <path d="M -5,-15 L 5,-3 L -2,-1 L 8,15 L -2,3 L 3,1 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
                                  <text x="0" y="-20" textAnchor="middle" fill="#ef4444" className="text-[8px] font-bold font-mono animate-pulse">FAULT POINT</text>
                                </g>
                              )}
                              {!running && !breakerOpen && (
                                <g transform="translate(510, 48)">
                                  <rect width="35" height="24" fill="#1e293b" stroke="#334155" rx="4" />
                                  <text x="17.5" y="15" textAnchor="middle" fill="#94a3b8" className="text-[8px] font-bold">LOAD</text>
                                </g>
                              )}
                            </svg>
                          </div>
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-3.5 h-3.5 rounded-full ${breakerOpen ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                              <div>
                                <span className="text-[8px] font-black text-slate-555 uppercase tracking-widest block">Relay Measurement Status</span>
                                <span className="text-xs font-black text-adaptive-muted uppercase">ANSI 51 Charge: {Math.round(relayAccumulator * 100)}%</span>
                              </div>
                            </div>
                            <div className="flex-1 max-w-[200px] h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-100 ease-out" style={{ width: `${relayAccumulator * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-center text-[9px] font-black uppercase text-slate-550 dark:text-slate-450 tracking-wider">
                      {activeChartTab === 'tcc' ? 'Logarithmic TCC grading curves (ANSI 50/51)' : activeChartTab === 'oscilloscope' ? 'Real-time three-phase waveform analysis' : activeChartTab === 'phasor' ? 'Phase vectors and symmetrical sequence component mapping' : activeChartTab === 'faceplate' ? 'tactile microprocessor relay targets console' : 'Substation single-line transmission grid'}
                    </div>
                  </Card>

                  {/* COMPACT TRIP ASSESSMENT BANNER */}
                  <Card isDark={isDark} className={`border p-4 ${breakerOpen ? 'border-red-500/70 bg-red-950/10 shadow-lg shadow-red-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${breakerOpen ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Relay Assessment</div>
                          <div className={`text-base font-black uppercase tracking-tight ${breakerOpen ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                            {breakerOpen ? '52 BREAKER TRIPPED' : 'MONITORING / HEALTHY'}
                          </div>
                        </div>
                      </div>

                      <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-850 pt-2 sm:pt-0 sm:pl-6">
                        <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Injected Current</div>
                        <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
                          <span className={`text-xl font-black ${running ? 'text-amber-500 animate-pulse' : 'text-adaptive'}`}>{Math.round(faultCurrent)} A</span>
                          <span className="text-[9px] text-slate-550 dark:text-slate-450 font-mono">Ip: {pickup51}A</span>
                        </div>
                      </div>

                      <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-850 pt-2 sm:pt-0 sm:pl-6">
                        <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Calculated Trip Time</div>
                        <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
                          <span className="text-xl font-black text-indigo-500">{tripTime ? `${tripTime.toFixed(3)}s` : '∞'}</span>
                          <span className="text-[9px] text-slate-550 dark:text-slate-450 font-mono">Timer: {elapsed.toFixed(3)}s</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Column: Controller accordion */}
                <div className="lg:col-span-5 space-y-6">
                  <Card isDark={isDark} className="h-full flex flex-col">
                    
                    {/* Controller tabs */}
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center flex-wrap gap-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-indigo-500 animate-spin-slow" /> Simulator Controller
                      </h3>
                      
                      <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                        {[
                          { id: 'faults', label: 'Faults' },
                          { id: 'relay', label: 'Settings' },
                          { id: 'labs', label: 'Labs' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveControlTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                              activeControlTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-md font-bold'
                                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-350'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Controller content */}
                    <div className="mt-4 flex-1 min-h-[400px]">
                      
                      {/* TAB 1: Fault Injector */}
                      {activeControlTab === 'faults' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">Fault Type Selection</span>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'normal', label: 'Nominal Load', desc: 'Balanced load values' },
                                { id: 'overload', label: 'Thermal Overload', desc: 'ANSI 51 Inverse Time trip' },
                                { id: 'short_circuit', label: 'Short Circuit', desc: 'ANSI 50 Instantaneous trip' },
                                { id: 'inrush', label: 'Tx Magnetizing Inrush', desc: 'Exponential transient' },
                                { id: 'ct_sat', label: 'CT Saturation', desc: 'RMS clipping harmonics' }
                              ].map(f => (
                                <button
                                  key={f.id}
                                  onClick={() => startFault(f.id as any)}
                                  disabled={running}
                                  className={`p-3 text-left border rounded-xl transition-all ${
                                    faultType === f.id
                                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 font-bold'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                  }`}
                                >
                                  <div className="text-[9px] uppercase tracking-wider mb-1">{f.label}</div>
                                  <div className="text-[8px] opacity-75 font-normal lowercase tracking-normal leading-normal">{f.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Phase Imbalance Selector */}
                          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">Phase Coupling Mode</span>
                            <div className="flex gap-2">
                              {[
                                { id: 'A-G', label: 'A-G (Single Line-to-Ground)' },
                                { id: 'B-C', label: 'B-C (Line-to-Line Fault)' },
                                { id: 'A-B-C', label: 'A-B-C (Three-Phase Fault)' }
                              ].map(phaseM => (
                                <button
                                  key={phaseM.id}
                                  onClick={() => setFaultPhaseMode(phaseM.id as any)}
                                  disabled={running || faultType === 'normal'}
                                  className={`flex-1 py-2 text-[8px] font-black tracking-wider uppercase border rounded-xl transition-all ${
                                    faultPhaseMode === phaseM.id
                                      ? 'bg-indigo-600 border-indigo-650 text-white font-bold'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                  }`}
                                >
                                  {phaseM.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                            <Slider label="Adjust Current Amplitude" unit=" A" min={0} max={25000} step={100} value={faultCurrent} onChange={e => setFaultCurrent(+e.target.value)} color="amber" disabled={running || breakerOpen} />
                            
                            <div className="flex gap-3 mt-5">
                              <button onClick={() => startFault(faultType)} disabled={running || breakerOpen} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-lg disabled:opacity-30 flex justify-center items-center gap-2">
                                <Play className="w-3.5 h-3.5" /> {running ? 'Timing...' : 'Inject Current'}
                              </button>
                              <button onClick={reset} className="px-5 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-2">
                                <RotateCcw className="w-3.5 h-3.5" /> Reset
                              </button>
                            </div>
                          </div>

                          {/* Events List */}
                          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5"><HistoryIcon className="w-3.5 h-3.5 text-indigo-500" /> Sequence of Events</span>
                            <div className="h-28 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-100 dark:bg-slate-950 p-2 overflow-y-auto space-y-1.5 custom-scrollbar text-[8px] font-mono leading-relaxed">
                              {events.length === 0 && <div className="h-full flex items-center justify-center text-slate-550 uppercase italic tracking-widest">Feeder state healthy. Inject current to test.</div>}
                              {events.map(e => (
                                <div key={e.id} className={`p-1.5 rounded border ${e.type === 'trip' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : e.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : e.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                  <div className="flex justify-between mb-0.5 opacity-60"><span>T+{e.time.toFixed(3)}s</span> <span className="uppercase">{e.type}</span></div>
                                  {e.msg}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: Relay Settings */}
                      {activeControlTab === 'relay' && (
                        <div className="space-y-6">
                          <div>
                            <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-1 mb-4">ANSI 51 Settings (Time OC)</h5>
                            <div className="space-y-4">
                              <Slider label="Pickup Current (Ip)" unit=" A" min={50} max={2000} step={10} value={pickup51} onChange={e => setPickup51(+e.target.value)} color="blue" disabled={running} />
                              <Slider label="Time Dial Setting (Tms)" min={0.05} max={1.5} step={0.01} unit="" value={tms} onChange={e => setTms(+e.target.value)} color="blue" disabled={running} />
                              
                              <div className="flex flex-col space-y-2 pt-2">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Curve Characteristic</label>
                                <select
                                  value={curveType}
                                  onChange={e => setCurveType(e.target.value)}
                                  className={`rounded-lg p-2 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-indigo-550 transition-all border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-250 text-slate-900'}`}
                                  disabled={running}
                                >
                                  {Object.entries(groupedCurves).map(([group, curves]) => (
                                    <optgroup key={group} label={group}>
                                      {curves.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </optgroup>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                            <h5 className="text-[10px] font-bold text-red-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-1 mb-4">ANSI 50 Settings (Instantaneous)</h5>
                            <Slider label="Instantaneous Pickup" unit=" A" min={500} max={20000} step={100} value={pickup50} onChange={e => setPickup50(+e.target.value)} color="red" disabled={running} />
                          </div>
                        </div>
                      )}

                      {/* TAB 3: Laboratories */}
                      {activeControlTab === 'labs' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-2">
                            {labs.map((l, idx) => (
                              <button key={l.id} onClick={() => startLab(idx)}
                                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                                  currentLab === idx 
                                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 font-bold' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                                }`}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Feeder Lab {idx + 1}</span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${labStatus[idx] === 'passed' ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400' : labStatus[idx] === 'failed' ? 'bg-red-500/25 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                    {labStatus[idx] === 'passed' ? 'Passed' : labStatus[idx] === 'failed' ? 'Failed' : 'Not Started'}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold leading-tight mb-1">{l.name}</h4>
                                <p className="text-[9px] text-slate-550 dark:text-slate-450 uppercase tracking-wider">{l.objective}</p>
                              </button>
                            ))}
                          </div>

                          {currentLab !== null && (
                            <Card isDark={isDark} className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 space-y-4">
                              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Lab Workspace Settings</h4>
                                <button onClick={verifyLab} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all">
                                  <Check className="w-3.5 h-3.5" /> Verify Setup
                                </button>
                              </div>

                              <p className="text-[10px] text-slate-655 dark:text-slate-350 leading-relaxed uppercase tracking-wider">{labs[currentLab].description}</p>
                              
                              {labMessage && (
                                <div className={`p-3 rounded-lg border text-[9px] font-bold leading-relaxed uppercase tracking-wider ${labMessage.startsWith('🎉') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}>
                                  {labMessage}
                                </div>
                              )}
                            </Card>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* 2. THEORY TAB */}
            {activeTab === 'theory' && (
              <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <Card isDark={isDark} className="space-y-6">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-adaptive">Overcurrent Feeder Coordination Mechanics</h2>
                    <p className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mt-1">IEEE C37.112 & IEC 60255 Standards Guide</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed uppercase tracking-wider text-slate-700 dark:text-slate-350">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">1. Time-Overcurrent (ANSI 51)</h4>
                        <p>
                          Protects lines against moderate overloads by integrating thermal damage over time. The trip duration is inverse to fault current magnitude:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-center text-slate-100 space-y-2 text-[10px]">
                          <div>IEC 60255 Inverse Curve:</div>
                          <LaTeX math="t = TMS \times \left[ \frac{A}{(I/I_p)^P - 1} \right]" />
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                          Where Ip is pickup threshold and TMS is the time multiplier setting representing curve translation.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">2. Instantaneous elements (ANSI 50)</h4>
                        <p>
                          Acts immediately for severe short-circuits. Operates without intentional delay, typically clearing in 30ms (breaker physical transition limit) once current breaches threshold.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">3. Feeder Selectivity & CTI</h4>
                        <p>
                          Coordination ensures downstream breakers clear faults locally before upstream breakers act, avoiding wide blackouts. This is maintained by establishing a CTI (Coordination Time Interval) margin:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-center text-slate-100 text-[10px]">
                          <LaTeX math="CTI = t_{upstream} - t_{downstream} \ge 0.3s" />
                        </div>
                        <p className="text-[10px] text-slate-650 dark:text-slate-400 mt-1">
                          0.3s accommodates breaker contacts separation delay, relay timing tolerance, and mechanical safety factor.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">4. Symmetrical Components</h4>
                        <p>
                          Allows relays to analyze complex unbalanced faults by converting phase currents ($I_a, I_b, I_c$) into positive ($I_1$), negative ($I_2$), and zero sequence ($I_0$) symmetrical vectors:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-center text-slate-100 text-[9px] space-y-1">
                          <LaTeX math="I_0 = \frac{1}{3}(I_a + I_b + I_c)" />
                          <LaTeX math="I_1 = \frac{1}{3}(I_a + aI_b + a^2I_c)" />
                          <LaTeX math="I_2 = \frac{1}{3}(I_a + a^2I_b + aI_c)" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* 3. QUIZ TAB */}
            {activeTab === 'quiz' && (
              <QuizModule isDark={isDark} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Industrial Footer/Status */}
      <footer className="h-10 bg-slate-950 border-t border-slate-800 px-6 lg:px-8 flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
         <div className="flex items-center gap-6">
           <span>Engine Status: Active</span>
           <span>Safety Interlock: Engaged</span>
           <span>Coordination Check: Compliant</span>
         </div>
         <div className="animate-pulse flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            Live Telemetry Enabled
         </div>
      </footer>
    </div>
  );
}

// ============================== QUIZ DATA & MODULE ==============================
const QUIZ_DATA = [
  { q: "Which IEC curve provides the fastest trip for very high short-circuit currents?", opts: ["Standard Inverse", "Very Inverse", "Extremely Inverse", "Definite Time"], ans: 2, why: "Extremely Inverse has the steepest slope (P=2.0), reacting most aggressively to high current multiples." },
  { q: "What is the primary function of ANSI 50?", opts: ["Definite delay trip", "Instantaneous overcurrent clearance", "Earth leakage monitoring", "Differential current balance"], ans: 1, why: "ANSI 50 is the Instantaneous overcurrent element, operating without intentional time delay." },
  { q: "The standard CTI (Coordination Time Interval) is typically budgeted at:", opts: ["0.05s", "0.30s", "1.50s", "5.00s"], ans: 1, why: "0.30s accommodates breaker contact separation time, relay timing tolerances, and safety margin." },
  { q: "Why is a slower curve setting useful when protective coordination is grade-selective?", opts: ["Avoids CT saturation", "Rides through temporary transformer inrush current", "Improves sensitivity", "Reduces relay heat"], ans: 1, why: "Magnetic inrush decays exponentially in 100ms. Slower characteristics prevent false tripping on inrush." }
];

const QuizModule = ({ isDark }: { isDark: boolean }) => {
  const [cur, setCur] = useState(0);
  const [score, setScore] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [fin, setFin] = useState(false);

  const q = QUIZ_DATA[cur];

  const pick = (i: number) => {
    if (sel !== null) return;
    setSel(i);
    if (i === q.ans) setScore(p => p + 1);
    setTimeout(() => {
      if (cur + 1 >= QUIZ_DATA.length) setFin(true);
      else { setCur(p => p + 1); setSel(null); }
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Card isDark={isDark}>
        {fin ? (
          <div className="text-center py-10 space-y-6">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-500 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-adaptive uppercase">Assessment Final Score</h3>
              <p className="text-5xl font-black text-indigo-500">{score} / {QUIZ_DATA.length}</p>
            </div>
            <button onClick={() => { setCur(0); setScore(0); setSel(null); setFin(false); }} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-md">
              Restart Test
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-[9px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest">Question {cur + 1} of {QUIZ_DATA.length}</span>
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Feeder Assessment</span>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-black text-adaptive uppercase tracking-tight leading-relaxed">{q.q}</h3>
              <div className="grid grid-cols-1 gap-3">
                {q.opts.map((o, i) => (
                  <button key={i} onClick={() => pick(i)} disabled={sel !== null}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-wider ${
                      sel === null 
                        ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500' 
                        : (i === q.ans 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' 
                            : (sel === i 
                                ? 'bg-red-500/20 border-red-500 text-red-600 dark:text-red-400' 
                                : 'bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-900 opacity-30 text-slate-400'))
                    }`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {sel !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl border text-[10px] leading-relaxed font-bold uppercase tracking-wider ${sel === q.ans ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}>
                <div className="font-black mb-1">{sel === q.ans ? '✓ Correct!' : '✗ Incorrect.'}</div>
                <p className="font-normal tracking-normal normal-case italic opacity-85">{q.why}</p>
              </motion.div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// Simple retro trophy icon placeholder for import fallback
function Trophy(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a6 6 0 0 0-6 6v3.5c0 1.6 1.2 3 2.8 3.4a6.1 6.1 0 0 0 6.4 0C16.8 14.5 18 13.1 18 11.5V8a6 6 0 0 0-6-6z" />
    </svg>
  );
}