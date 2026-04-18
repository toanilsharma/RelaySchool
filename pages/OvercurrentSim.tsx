import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Zap, Settings, Share2, Activity, ShieldCheck,
  RotateCcw, AlertTriangle, TrendingUp, Book, MonitorPlay,
  GraduationCap, Award, PlayCircle, CheckCircle2, Power, CircuitBoard,
  Info, Shield, Sliders, Timer, History, Trophy
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
  'IEC_SI': { group: 'IEC 60255', A: 0.14, B: 0, P: 0.02, label: 'Standard Inverse (SI)' },
  'IEC_VI': { group: 'IEC 60255', A: 13.5, B: 0, P: 1.0, label: 'Very Inverse (VI)' },
  'IEC_EI': { group: 'IEC 60255', A: 80.0, B: 0, P: 2.0, label: 'Extremely Inverse (EI)' },
  'IEC_LTI': { group: 'IEC 60255', A: 120, B: 0, P: 1.0, label: 'Long-Time Inverse (LTI)' },
  'IEEE_MI': { group: 'IEEE C37.112', A: 0.0515, B: 0.114, P: 0.02, label: 'Moderately Inverse (MI)' },
  'IEEE_VI': { group: 'IEEE C37.112', A: 19.61, B: 0.491, P: 2.0, label: 'Very Inverse (VI)' },
  'IEEE_EI': { group: 'IEEE C37.112', A: 28.2, B: 0.1217, P: 2.0, label: 'Extremely Inverse (EI)' },
};

const calcTripTime = (I: number, Ip: number, tms: number, curveKey: string) => {
  if (I <= Ip) return null;
  const c = (RELAY_CURVES as any)[curveKey];
  if (!c) return null;
  const M = I / Ip;
  const time = tms * (c.A / (Math.pow(M, c.P) - 1) + c.B);
  return Math.max(0.02, time); // 20ms mechanical minimum limit
};

// ============================== SVG TCC CHART ==============================
const TCCChart = ({ pickup51, tms, curveType, pickup50, faultCurrent, tripTime }: any) => {
  const width = 600;
  const height = 400;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Log Scale Bounds
  const minI = 0.5, maxI = 100; // Multiples of Ip
  const minT = 0.01, maxT = 100; // Seconds

  const logMinI = Math.log10(minI), logMaxI = Math.log10(maxI);
  const logMinT = Math.log10(minT), logMaxT = Math.log10(maxT);

  const mapX = (I: number) => padding.left + ((Math.log10(I) - logMinI) / (logMaxI - logMinI)) * innerWidth;
  const mapY = (T: number) => padding.top + innerHeight - ((Math.log10(T) - logMinT) / (logMaxT - logMinT)) * innerHeight;

  // Minor and Major Grid arrays for professional TCC paper look
  const minorX = [0.6, 0.7, 0.8, 0.9, 2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90];
  const majorX = [1, 10, 100];
  const minorY = [0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90];
  const majorY = [0.01, 0.1, 1, 10, 100];

  // Generate path for 51 Curve
  const curvePath = useMemo(() => {
    let path = '';
    let first = true;
    for (let m = 1.01; m <= maxI; m += 0.1) {
      const t = calcTripTime(m * pickup51, pickup51, tms, curveType);
      if (t === null || t > maxT * 2 || t < minT / 2) continue;

      const x = mapX(m);
      const y = Math.min(Math.max(mapY(t), padding.top), padding.top + innerHeight);

      if (first) {
        path += `M ${x} ${y} `;
        first = false;
      } else {
        path += `L ${x} ${y} `;
      }
    }
    return path;
  }, [pickup51, tms, curveType]);

  const x50 = mapX(pickup50 / pickup51);
  const mFault = faultCurrent > 0 ? faultCurrent / pickup51 : 0;
  const xFault = mFault > 0 ? mapX(mFault) : null;
  const yFault = tripTime ? mapY(tripTime) : null;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-[#0a0f18] rounded-2xl border border-slate-800 relative shadow-[inset_0_0_40px_rgba(0,0,0,0.7)]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-full object-contain">
        {/* Minor Grid Lines */}
        <g className="text-slate-800/60" strokeWidth="0.5" stroke="currentColor">
          {minorX.map(v => (
            <line key={`mx-${v}`} x1={mapX(v)} y1={padding.top} x2={mapX(v)} y2={padding.top + innerHeight} />
          ))}
          {minorY.map(v => (
            <line key={`my-${v}`} x1={padding.left} y1={mapY(v)} x2={padding.left + innerWidth} y2={mapY(v)} />
          ))}
        </g>

        {/* Major Grid Lines */}
        <g className="text-slate-700" strokeWidth="1" stroke="currentColor">
          {majorX.map(v => (
            <line key={`vx-${v}`} x1={mapX(v)} y1={padding.top} x2={mapX(v)} y2={padding.top + innerHeight} strokeDasharray={v === 1 ? "4,4" : "none"} strokeOpacity={v === 1 ? 1 : 0.6} />
          ))}
          {majorY.map(v => (
            <line key={`vy-${v}`} x1={padding.left} y1={mapY(v)} x2={padding.left + innerWidth} y2={mapY(v)} strokeOpacity="0.6" />
          ))}
        </g>

        {/* Axes */}
        <g stroke="#475569" strokeWidth="2">
          <line x1={padding.left} y1={padding.top + innerHeight} x2={padding.left + innerWidth} y2={padding.top + innerHeight} />
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} />
        </g>

        {/* Labels */}
        <g fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
          {majorX.map(v => (
            <text key={`lx-${v}`} x={mapX(v)} y={padding.top + innerHeight + 15}>{v}</text>
          ))}
          <text x={width - 20} y={padding.top + innerHeight + 15} fontWeight="bold" fill="#0ea5e9">× Ip</text>
          <g textAnchor="end">
            {majorY.map(v => (
              <text key={`ly-${v}`} x={padding.left - 5} y={mapY(v) + 4}>{v}s</text>
            ))}
          </g>
        </g>

        {/* 51 Curve */}
        <motion.path
          d={curvePath}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.6))' }}
        />

        {/* 50 Instantaneous Line */}
        {x50 >= padding.left && x50 <= padding.left + innerWidth && (
          <g>
            <line x1={x50} y1={padding.top} x2={x50} y2={padding.top + innerHeight} stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6,4" />
            <rect x={x50 - 30} y={padding.top + 10} width="60" height="20" rx="6" fill="#ef4444" />
            <text x={x50} y={padding.top + 24} fill="currentColor" fontSize="9" fontWeight="900" textAnchor="middle" className="text-white">50 INST</text>
          </g>
        )}

        {/* Operating Point */}
        {xFault && xFault >= padding.left && xFault <= padding.left + innerWidth && yFault && (
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <line x1={padding.left} y1={yFault} x2={xFault} y2={yFault} stroke="#6366f1" strokeWidth="1" strokeDasharray="4,4" />
            <line x1={xFault} y1={padding.top + innerHeight} x2={xFault} y2={yFault} stroke="#6366f1" strokeWidth="1" strokeDasharray="4,4" />
            <circle cx={xFault} cy={yFault} r="6" fill={faultCurrent >= pickup50 ? "#ef4444" : "#0ea5e9"} stroke="#fff" strokeWidth="2" />
            <circle cx={xFault} cy={yFault} r="15" fill={faultCurrent >= pickup50 ? "#ef4444" : "#0ea5e9"} fillOpacity="0.2" className="animate-ping" />
          </motion.g>
        )}
      </svg>
    </div>
  );
};

// ============================== SIMULATOR MODULE ==============================
const SimulatorModule = ({ 
  isDark, pickup51, setPickup51, tms, setTms, curveType, setCurveType, 
  pickup50, setPickup50, faultCurrent, setFaultCurrent, triggerTrip 
}: any) => {
  const [running, setRunning] = useState(false);
  const [breakerOpen, setBreakerOpen] = useState(false);
  const [phase, setPhase] = useState('MONITORING');
  const [elapsed, setElapsed] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const timerRef = useRef<any>(null);

  const tripTime = useMemo(() => calcTripTime(faultCurrent, pickup51, tms, curveType), [faultCurrent, pickup51, tms, curveType]);

  const groupedCurves = useMemo(() => {
    const groups: Record<string, any[]> = {};
    Object.entries(RELAY_CURVES).forEach(([k, v]) => {
      if (!groups[v.group]) groups[v.group] = [];
      groups[v.group].push({ id: k, ...v });
    });
    return groups;
  }, []);

  const addEvent = (msg: string, type: string) => {
    setEvents(prev => [{ id: Math.random(), time: elapsed, msg, type }, ...prev].slice(0, 15));
  };

  const startFault = () => {
    if (faultCurrent <= 0) return;
    setRunning(true);
    setBreakerOpen(false);
    setElapsed(0);
    setPhase('FAULT');
    setEvents([{ id: Math.random(), time: 0, msg: `⚡ Fault Injection: ${faultCurrent}A`, type: 'fault' }]);

    const is50Trip = faultCurrent >= pickup50;
    const t51 = calcTripTime(faultCurrent, pickup51, tms, curveType) || 999;
    const opTime = is50Trip ? 0.03 : t51;

    const startTime = performance.now();
    const update = () => {
      const now = performance.now();
      const curElapsed = (now - startTime) / 1000;
      setElapsed(curElapsed);

      if (curElapsed >= opTime) {
        setElapsed(opTime);
        setBreakerOpen(true);
        setRunning(false);
        setPhase('TRIPPED');
        triggerTrip();
        addEvent(`✅ ANSI ${is50Trip ? '50' : '51'} Trip at ${opTime.toFixed(3)}s`, 'success');
        cancelAnimationFrame(timerRef.current);
      } else {
        timerRef.current = requestAnimationFrame(update);
      }
    };
    timerRef.current = requestAnimationFrame(update);
  };

  const reset = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setPhase('MONITORING');
    setElapsed(0);
    setRunning(false);
    setBreakerOpen(false);
    setEvents([]);
    setFaultCurrent(0);
  };

  return (
    <div className="h-full flex flex-col xl:flex-row gap-4">
      {/* Settings Panel (Left) */}
      <div className="flex-1 xl:w-[320px] xl:max-w-[350px] flex flex-col gap-4">
        <Card isDark={isDark} noPadding className="flex-1 flex flex-col">
          <div className="p-4 lg:p-5 flex-1 flex flex-col">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2 shrink-0">
              <Settings className="w-3.5 h-3.5 text-indigo-500" /> <JargonTooltip text="Inverse Settings" explanation="Configurable parameters for the time-overcurrent characteristic." /> (ANSI 51/50)
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              <div className="space-y-4">
                <Slider label="51 Pickup (Ip)" unit=" A" min={50} max={2000} step={1} value={pickup51} onChange={e => setPickup51(+e.target.value)} color="blue" disabled={running} />
                <Slider label="Time Dial (TD/TMS)" min={0.05} max={1.5} step={0.01} unit="" value={tms} onChange={e => setTms(+e.target.value)} color="blue" disabled={running} />
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Curve Characteristic</label>
                  <select
                    value={curveType}
                    onChange={e => setCurveType(e.target.value)}
                    className={`rounded-lg p-2 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 transition-all border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    disabled={running}
                  >
                    {Object.entries(groupedCurves).map(([group, curves]) => (
                      <optgroup key={group} label={group}>
                        {curves.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <Slider label="50 Inst. Pickup" unit=" A" min={500} max={20000} step={100} value={pickup50} onChange={e => setPickup50(+e.target.value)} color="red" disabled={running} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 shrink-0">
              <Slider label="Inject Fault Current" unit=" A" min={0} max={25000} step={100} value={faultCurrent} onChange={e => setFaultCurrent(+e.target.value)} color="amber" disabled={running || breakerOpen} />
              <div className="flex gap-2 mt-4">
                <button onClick={startFault} disabled={running || faultCurrent <= 0 || breakerOpen} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-lg disabled:opacity-30">
                  {running ? 'Timing...' : 'Inject Fault'}
                </button>
                <button onClick={reset} className={`px-4 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-slate-200 border-slate-300 text-slate-900 hover:bg-slate-300'}`}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Visualization (Center) */}
      <div className="flex-none xl:flex-1 h-[400px] xl:h-auto">
        <Card isDark={isDark} noPadding className="h-full flex flex-col">
           <div className="p-4 lg:p-5 flex flex-col h-full">
             <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2 shrink-0">
               <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> TCC Visualization
             </h3>
             <div className="flex-1 flex items-center justify-center min-h-0">
               <div className="w-full max-w-2xl">
                 <TCCChart pickup51={pickup51} tms={tms} curveType={curveType} pickup50={pickup50} faultCurrent={faultCurrent} tripTime={tripTime} />
               </div>
             </div>
           </div>
        </Card>
      </div>

      {/* Telemetry & Log (Right) */}
      <div className="flex-1 xl:w-[280px] xl:max-w-[320px] flex flex-col gap-4">
        <Card isDark={isDark} noPadding>
          <div className="p-4 lg:p-5">
            <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${breakerOpen ? 'bg-red-950/30 border-red-500/50 text-red-500 animate-pulse' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500'}`}>
              <Power className={`w-6 h-6 shrink-0 ${breakerOpen ? 'text-red-500' : 'text-emerald-500'}`} />
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Breaker 52</div>
                <div className="text-sm font-black">{breakerOpen ? 'TRIPPED' : 'CLOSED'}</div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Relay Phase</span>
                <span className={`text-[10px] font-black tracking-widest ${running ? 'text-amber-400' : breakerOpen ? 'text-red-400' : 'text-emerald-400'}`}>{phase}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Relay Timer</span>
                <Odometer value={elapsed} format={v => `${v.toFixed(3)}s`} className="text-xl font-black text-adaptive" />
              </div>
            </div>
          </div>
        </Card>

        <Card isDark={isDark} noPadding className="flex-1 flex flex-col h-[300px] xl:h-auto">
          <div className="p-4 lg:p-5 flex flex-col h-full">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2 shrink-0">
              <History className="w-3.5 h-3.5 text-blue-500" /> Sequence of Events
            </h3>
            <div className={`flex-1 rounded-xl border p-3 overflow-y-auto min-h-0 space-y-2 custom-scrollbar ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              {events.length === 0 && <div className="h-full flex items-center justify-center text-[9px] font-black text-slate-700 tracking-widest uppercase italic">Monitoring System...</div>}
              {events.map(e => (
                <div key={e.id} className={`p-2 rounded-lg border text-[9px] font-black leading-relaxed ${e.type === 'trip' ? 'bg-red-950/20 border-red-500/30 text-red-400' : e.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <div className="flex justify-between mb-1 opacity-60"><span>T+{e.time.toFixed(3)}s</span> <span>{e.type.toUpperCase()}</span></div>
                  {e.msg}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================== THEORY MODULE ==============================
const TheoryGuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <Card isDark={isDark} noPadding>
        <div className="p-10">
          <h2 className="text-3xl font-black mb-4 tracking-tight text-adaptive">Overcurrent Protection <span className="text-indigo-500">Physics</span></h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">Standardized Inverse Curves (IEEE/IEC) and Coordination Logic.</p>
          
          <div className="space-y-10">
            <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800">
               <h3 className="text-xl font-black text-indigo-400 mb-6 flex items-center gap-3">
                 <Zap className="w-6 h-6" /> ANSI 51 (Time Overcurrent)
               </h3>
               <p className="text-slate-300 leading-relaxed mb-8 font-medium">
                 Protects against sustained overloads and low-magnitude faults. The trip time is calculated dynamically based on the current multiple (M = I / Ip).
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">IEC 60255 Formula</div>
                    <LaTeX math="t = TMS \times \left[ \frac{A}{(I/I_p)^P - 1} + B \right]" />
                 </div>
                 <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">IEEE C37.112 Formula</div>
                    <LaTeX math="t = TD \times \left[ \frac{A}{(I/I_p)^P - 1} + B \right]" />
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-8 bg-red-950/10 border border-red-500/20 rounded-3xl">
                  <h4 className="text-lg font-black text-red-500 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> ANSI 50 (Instant)</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium italic">"Trips immediately for very high fault currents, typically &lt; 30ms. Used for severe faults close to the source."</p>
               </div>
               <div className="p-8 bg-emerald-950/10 border border-emerald-500/20 rounded-3xl">
                  <h4 className="text-lg font-black text-emerald-500 mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Coordination (CTI)</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">Relays are graded such that the downstream unit clears before the upstream unit, maintaining a Coord. Time Interval (~0.3s).</p>
               </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
);

// ============================== QUIZ MODULE ==============================
const QUIZ_DATA = [
  { q: "Which IEC curve provides the fastest trip for very high fault currents?", opts: ["Standard Inverse", "Very Inverse", "Extremely Inverse", "Definite Time"], ans: 2, why: "Extremely Inverse has the steepest slope (P=2.0), reacting most aggressively to high currents." },
  { q: "What does ANSI 50 designate?", opts: ["Time overcurrent", "Instantaneous overcurrent", "Directional relay", "Undervoltage"], ans: 1, why: "ANSI 50 is the 'Instant' element, operating with no intentional time delay." },
  { q: "The standard Coordination Time Interval (CTI) is typically:", opts: ["0.05s", "0.3s", "1.5s", "5.0s"], ans: 1, why: "0.3s allows for breaker opening, relay reset, and safety margin." },
  { q: "The Pickup Current (Ip) should ideally be set:", opts: ["Below full load", "At full load", "1.2 - 1.3x Max Load", "At 10x Max Load"], ans: 2, why: "It must clear normal load fluctuations while remaining sensitive to real faults." }
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
    <div className="max-w-3xl mx-auto py-10">
      <Card isDark={isDark}>
        {fin ? (
          <div className="text-center py-12">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h3 className="text-4xl font-black text-white mb-2">SCORE: {score}/{QUIZ_DATA.length}</h3>
            <button onClick={() => { setCur(0); setScore(0); setSel(null); setFin(false); }} className="mt-10 px-10 py-4 bg-indigo-600 rounded-2xl font-black text-xs tracking-widest text-white uppercase shadow-lg">Try Again</button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Question {cur + 1} of {QUIZ_DATA.length}</span>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Relay Assessment</span>
            </div>
            
            <div>
              <h3 className="text-xl font-black mb-8 leading-tight uppercase tracking-tight text-adaptive">{q.q}</h3>
              <div className="grid grid-cols-1 gap-4">
                {q.opts.map((o, i) => (
                  <button key={i} onClick={() => pick(i)} disabled={sel !== null}
                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-black text-xs tracking-widest uppercase ${sel === null ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 text-slate-400' : (i === q.ans ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : (sel === i ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-950 border-slate-800 opacity-30 text-slate-600'))}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {sel !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl border ${sel === q.ans ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400' : 'bg-red-950/20 border-red-500 text-red-400'}`}>
                <div className="font-black uppercase mb-2">{sel === q.ans ? 'Correct!' : 'Incorrect.'}</div>
                <p className="text-xs font-medium italic opacity-80">{q.why}</p>
              </motion.div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// ============================== MAIN APP ==============================
export default function OvercurrentSim() {
  const isDark = useThemeObserver();
  const [activeTab, setActiveTab] = useState('simulator');

  const [pickup51, setPickup51] = usePersistentState('oc_pickup51', 400);
  const [tms, setTms] = usePersistentState('oc_tms', 0.3);
  const [curveType, setCurveType] = usePersistentState('oc_curve', 'IEC_SI');
  const [pickup50, setPickup50] = usePersistentState('oc_pickup50', 4000);
  const [faultCurrent, setFaultCurrent] = usePersistentState('oc_fault', 0);
  const { isTripping, triggerTrip } = useTripFeedback();

  const tabs = [
    { id: 'simulator', label: 'SIMULATOR', icon: <MonitorPlay className="w-5 h-5" /> },
    { id: 'theory', label: 'THEORY', icon: <Book className="w-5 h-5" /> },
    { id: 'quiz', label: 'QUIZ', icon: <Award className="w-5 h-5" /> }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isTripping ? 'animate-trip' : ''}`}>
      <PageSEO 
        title="Overcurrent Simulator (ANSI 50/51)"
        description="Professional IEEE C37.112 and IEC 60255 overcurrent relay simulator. Master TCC curves and protection coordination."
        url="/overcurrentsim"
      />

      <header className={`h-20 backdrop-blur-xl border-b px-8 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-5">
           <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-[0_0_20px_rgba(79,70,229,0.5)]">
             <Zap className="w-6 h-6" />
           </div>
           <div>
             <h1 className="font-black text-2xl tracking-tighter text-adaptive">OC<span className="text-indigo-400">GUARD</span> PRO</h1>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protection Intelligence Engine</div>
           </div>
        </div>

        <nav className={`flex p-1 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
           {tabs.map(t => (
             <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 dark:hover:text-slate-300'}`}>
               {t.icon} {t.label}
             </button>
           ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
           <div className="text-right px-4 border-r border-slate-800">
             <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logic Engine</div>
             <div className="text-[10px] font-black text-emerald-500">IEEE C37.112</div>
           </div>
           <AICopyButton state={{ pickup51, tms, curveType, pickup50, faultCurrent }} toolName="Overcurrent Simulator / ANSI 50/51" />
        </div>
      </header>

      <main className="w-full mx-auto p-4 lg:p-6 h-[calc(100vh-5rem-2.5rem)] overflow-y-auto overflow-x-clip max-w-[100vw]">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="h-full">
            {activeTab === 'simulator' && (
              <SimulatorModule 
                isDark={isDark} 
                pickup51={pickup51} setPickup51={setPickup51}
                tms={tms} setTms={setTms}
                curveType={curveType} setCurveType={setCurveType}
                pickup50={pickup50} setPickup50={setPickup50}
                faultCurrent={faultCurrent} setFaultCurrent={setFaultCurrent}
                triggerTrip={triggerTrip}
              />
            )}
            {activeTab === 'theory' && <TheoryGuideModule isDark={isDark} />}
            {activeTab === 'quiz' && <QuizModule isDark={isDark} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Industrial Footer/Status */}
      <footer className="h-10 bg-slate-950 border-t border-slate-800 px-8 flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
         <div className="flex items-center gap-6">
           <span>Engine Status: Active</span>
           <span>Safety Interlock: Engaged</span>
         </div>
         <div className="animate-pulse flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Live Telemetry Enabled
         </div>
      </footer>
    </div>
  );
}