import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, Settings, Share2, Activity, ShieldCheck, 
  RotateCcw, AlertTriangle, TrendingUp, Book, MonitorPlay, 
  GraduationCap, Award, PlayCircle, CheckCircle2, Power, CircuitBoard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================== IEEE & IEC MATH & CONSTANTS ==============================
// Commercial-grade IEEE C37.112 & IEC 60255-151 standard curves
const RELAY_CURVES = {
  'IEC_SI':  { group: 'IEC 60255', A: 0.14, B: 0, P: 0.02, label: 'Standard Inverse (SI)' },
  'IEC_VI':  { group: 'IEC 60255', A: 13.5, B: 0, P: 1.0,  label: 'Very Inverse (VI)' },
  'IEC_EI':  { group: 'IEC 60255', A: 80.0, B: 0, P: 2.0,  label: 'Extremely Inverse (EI)' },
  'IEC_LTI': { group: 'IEC 60255', A: 120,  B: 0, P: 1.0,  label: 'Long-Time Inverse (LTI)' },
  'IEEE_MI': { group: 'IEEE C37.112', A: 0.0515, B: 0.114, P: 0.02, label: 'Moderately Inverse (MI)' },
  'IEEE_VI': { group: 'IEEE C37.112', A: 19.61,  B: 0.491, P: 2.0,  label: 'Very Inverse (VI)' },
  'IEEE_EI': { group: 'IEEE C37.112', A: 28.2,   B: 0.1217,P: 2.0,  label: 'Extremely Inverse (EI)' },
};

const calcTripTime = (I, Ip, tms, curveKey) => {
  if (I <= Ip) return null;
  const c = RELAY_CURVES[curveKey];
  if (!c) return null;
  const M = I / Ip;
  const time = tms * (c.A / (Math.pow(M, c.P) - 1) + c.B);
  return Math.max(0.02, time); // 20ms mechanical minimum limit
};

// ============================== CUSTOM HOOKS ==============================
// Smooths out fast value changes for UI (like sliders dragging)
const useSmoothedValue = (value, speed = 0.15) => {
  const [smoothed, setSmoothed] = useState(value);
  useEffect(() => {
    let animationFrameId;
    const update = () => {
      setSmoothed(prev => {
        const diff = value - prev;
        if (Math.abs(diff) < 0.001) return value;
        return prev + diff * speed;
      });
      animationFrameId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, speed]);
  return smoothed;
};

// ============================== UI COMPONENTS ==============================
const Slider = ({ label, unit = '', min, max, step, value, onChange, color, disabled }) => {
  const colorClasses = {
    blue: 'accent-sky-500 focus:ring-sky-500',
    red: 'accent-red-500 focus:ring-red-500',
    amber: 'accent-amber-500 focus:ring-amber-500',
  };

  return (
    <div className={`flex flex-col space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
        <span className="font-mono text-sm font-bold text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md shadow-inner">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${colorClasses[color]}`}
      />
    </div>
  );
};

// ============================== SVG TCC CHART ==============================
const TCCChart = ({ pickup51, tms, curveType, pickup50, faultCurrent, tripTime }) => {
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

  const mapX = (I) => padding.left + ((Math.log10(I) - logMinI) / (logMaxI - logMinI)) * innerWidth;
  const mapY = (T) => padding.top + innerHeight - ((Math.log10(T) - logMinT) / (logMaxT - logMinT)) * innerHeight;

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
    <div className="w-full overflow-hidden bg-[#0a0f18] rounded-xl border border-slate-800 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-xl">
        {/* Minor Grid Lines */}
        <g className="text-slate-800/40" strokeWidth="0.5" stroke="currentColor">
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
          {/* Highlight multiples */}
          {[2, 5, 20, 50].map(v => (
            <text key={`lxm-${v}`} x={mapX(v)} y={padding.top + innerHeight + 15} fontSize="8" fill="#64748b">{v}</text>
          ))}
          <text x={width - 20} y={padding.top + innerHeight + 15} fontWeight="bold" fill="#0ea5e9">× Ip</text>
          
          <g textAnchor="end">
            {majorY.map(v => (
              <text key={`ly-${v}`} x={padding.left - 5} y={mapY(v) + 4}>{v}s</text>
            ))}
          </g>
        </g>

        {/* 51 Curve with Commercial Glow */}
        <motion.path
          d={curvePath}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(14, 165, 233, 0.8))' }}
        />

        {/* 50 Instantaneous Line */}
        {x50 >= padding.left && x50 <= padding.left + innerWidth && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <line x1={x50} y1={padding.top} x2={x50} y2={padding.top + innerHeight} stroke="#ef4444" strokeWidth="2" strokeDasharray="6,4" />
            <rect x={x50 - 28} y={padding.top + 8} width="56" height="18" rx="4" fill="#ef4444" opacity="0.9" />
            <text x={x50} y={padding.top + 20} fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="1">50 INST</text>
          </motion.g>
        )}

        {/* Operating Point & Crosshairs */}
        {xFault && xFault >= padding.left && xFault <= padding.left + innerWidth && (
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
          >
            {/* Guide lines to operating point */}
            {yFault && (
              <>
                <line x1={padding.left} y1={yFault} x2={xFault} y2={yFault} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.8" />
                <line x1={xFault} y1={padding.top + innerHeight} x2={xFault} y2={yFault} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.8" />
                
                {/* Glowing Dot - Commercial Style */}
                <circle cx={xFault} cy={yFault} r="5" fill="#0f172a" stroke={faultCurrent >= pickup50 ? "#ef4444" : "#f59e0b"} strokeWidth="3" />
                <circle cx={xFault} cy={yFault} r="14" fill={faultCurrent >= pickup50 ? "#ef4444" : "#f59e0b"} opacity="0.25" className="animate-ping" />
                
                {/* Tooltip near the point */}
                <rect x={xFault + 10} y={yFault - 35} width="85" height="30" rx="4" fill="#0f172a" stroke="#334155" opacity="0.9" />
                <text x={xFault + 15} y={yFault - 22} fill="#94a3b8" fontSize="9" fontFamily="monospace">t: <tspan fill="#fff" fontWeight="bold">{tripTime.toFixed(3)}s</tspan></text>
                <text x={xFault + 15} y={yFault - 10} fill="#94a3b8" fontSize="9" fontFamily="monospace">I: <tspan fill="#fff" fontWeight="bold">{mFault.toFixed(1)}x</tspan></text>
              </>
            )}
            {!yFault && (
              <circle cx={xFault} cy={padding.top + innerHeight} r="6" fill="#ef4444" />
            )}
          </motion.g>
        )}
      </svg>
      
      {/* Legend Overlay */}
      <div className="absolute top-4 left-16 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg pointer-events-none shadow-lg">
        <div className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Active Parameters</div>
        <div className="text-xs font-mono text-slate-200">Curve: <span className="text-sky-400 font-bold">{RELAY_CURVES[curveType]?.label || curveType}</span></div>
        <div className="text-xs font-mono text-slate-200 mt-1">TD/TMS: <span className="text-sky-400 font-bold">{tms.toFixed(2)}</span></div>
        <div className="text-xs font-mono text-slate-200 mt-1">51 P.U.: <span className="text-sky-400 font-bold">{pickup51.toFixed(1)} A</span></div>
      </div>
    </div>
  );
};


// ============================== SIMULATOR MODULE ==============================
const SimulatorModule = () => {
  const [pickup51, setPickup51] = useState(400);
  const sPickup51 = useSmoothedValue(pickup51);
  const [tms, setTms] = useState(0.3);
  const sTms = useSmoothedValue(tms);
  const [curveType, setCurveType] = useState('IEC_SI');
  const [pickup50, setPickup50] = useState(4000);
  const sPickup50 = useSmoothedValue(pickup50);
  const [faultCurrent, setFaultCurrent] = useState(0);
  
  const [running, setRunning] = useState(false);
  const [breakerOpen, setBreakerOpen] = useState(false);
  const [phase, setPhase] = useState('SYSTEM NORMAL');
  const [elapsed, setElapsed] = useState(0);
  const [events, setEvents] = useState([]);
  const timerRef = useRef(null);

  const tripTime = useMemo(() => calcTripTime(faultCurrent, pickup51, tms, curveType), [faultCurrent, pickup51, tms, curveType]);

  // Group curves for the dropdown
  const groupedCurves = useMemo(() => {
    const groups = {};
    Object.entries(RELAY_CURVES).forEach(([k, v]) => {
      if (!groups[v.group]) groups[v.group] = [];
      groups[v.group].push({ id: k, ...v });
    });
    return groups;
  }, []);

  const addEvent = (msg, type) => {
    setEvents(prev => [{ id: Math.random(), time: elapsed, msg, type }, ...prev].slice(0, 15));
  };

  const startFault = () => {
    if (faultCurrent <= 0) return;
    setRunning(true);
    setBreakerOpen(false);
    setElapsed(0);
    setPhase('FAULT DETECTED');
    setEvents([{ id: Math.random(), time: 0, msg: `⚡ Fault injected: ${faultCurrent}A`, type: 'fault' }]);

    if (faultCurrent < pickup51) {
      setPhase('BELOW PICKUP');
      addEvent(`Current ${faultCurrent}A < Pickup ${pickup51}A — No operation`, 'info');
      setRunning(false);
      return;
    }

    const is50Trip = faultCurrent >= pickup50;
    const t51 = calcTripTime(faultCurrent, pickup51, tms, curveType) || 999;
    const opTime = is50Trip ? 0.03 : t51; // 50 trips in ~30ms commercially

    const startTime = performance.now();
    
    const updateTimer = () => {
      const now = performance.now();
      const currentElapsed = (now - startTime) / 1000;
      setElapsed(currentElapsed);

      if (is50Trip && currentElapsed >= 0.015 && phase !== '50_TRIP') {
        setPhase('50_TRIP');
        addEvent(`🔴 ANSI 50 INSTANTANEOUS TRIP SIGNAL (> ${pickup50}A)`, 'trip');
      } else if (!is50Trip && currentElapsed >= 0.1 && phase !== '51_TIMING') {
        setPhase('51_TIMING');
        addEvent(`⏱ ANSI 51 timing: ${curveType.split('_')[1]} curve, Target: ${t51.toFixed(3)}s`, 'info');
      }

      if (currentElapsed >= opTime) {
        setElapsed(opTime);
        setPhase(is50Trip ? 'LOCKOUT (50)' : 'LOCKOUT (51)');
        setBreakerOpen(true);
        addEvent(`✅ Breaker 52 Open. Total clear time: ${opTime.toFixed(3)}s`, 'success');
        setRunning(false);
        cancelAnimationFrame(timerRef.current);
      } else {
        timerRef.current = requestAnimationFrame(updateTimer);
      }
    };

    timerRef.current = requestAnimationFrame(updateTimer);
  };

  const reset = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setPhase('SYSTEM NORMAL');
    setElapsed(0);
    setRunning(false);
    setBreakerOpen(false);
    setEvents([{ id: Math.random(), time: 0, msg: `System Reset. Breaker 52 Closed.`, type: 'info' }]);
    setFaultCurrent(0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Settings Panel */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <CircuitBoard size={160} />
          </div>
          
          <h3 className="font-bold text-lg mb-6 flex items-center text-slate-100">
            <Settings className="w-5 h-5 text-sky-500 mr-3" /> Relay Protection Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Slider label="51 Pickup Current (Ip)" unit="A" min={50} max={2000} step={10} value={pickup51} onChange={e => setPickup51(+e.target.value)} color="blue" disabled={running} />
            <Slider label="Time Setting (TD/TMS)" min={0.05} max={1.5} step={0.01} value={tms} onChange={e => setTms(+e.target.value)} color="blue" disabled={running} />
            
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Standard & Curve Type</label>
              <select 
                value={curveType} 
                onChange={e => setCurveType(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none transition-all font-medium text-sm"
                disabled={running}
              >
                {Object.entries(groupedCurves).map(([groupName, curves]) => (
                  <optgroup key={groupName} label={groupName} className="text-slate-400 bg-slate-900">
                    {curves.map(c => <option key={c.id} value={c.id} className="text-white">{c.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <Slider label="50 Instantaneous Pickup" unit="A" min={500} max={20000} step={100} value={pickup50} onChange={e => setPickup50(+e.target.value)} color="red" disabled={running} />
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
            <div className="flex flex-col md:flex-row items-end gap-6">
              <div className="flex-1 w-full">
                <Slider label="Fault Current Injection" unit="A" min={0} max={25000} step={50} value={faultCurrent} onChange={e => setFaultCurrent(+e.target.value)} color="amber" disabled={running || breakerOpen} />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={startFault} 
                  disabled={running || faultCurrent <= 0 || breakerOpen} 
                  className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4" /> {running ? 'Active...' : 'Inject Fault'}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={reset} 
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors border border-slate-700 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Industrial Status Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Breaker Status */}
          <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-lg transition-colors duration-500 ${breakerOpen ? 'bg-red-950/40 border-red-900/50' : 'bg-emerald-950/20 border-emerald-900/30'}`}>
            <motion.div 
              animate={{ rotate: breakerOpen ? 45 : 0 }}
              className={`p-3 rounded-full ${breakerOpen ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}
            >
              <Power size={28} />
            </motion.div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">52 Circuit Breaker</div>
              <div className={`text-2xl font-black tracking-tight ${breakerOpen ? 'text-red-500' : 'text-emerald-500'}`}>
                {breakerOpen ? 'OPEN (TRIPPED)' : 'CLOSED (NORMAL)'}
              </div>
            </div>
          </div>

          {/* Relay Status */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex-1 flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${phase.includes('LOCKOUT') ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)]' : running ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,1)] animate-pulse' : 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]'}`} />
            
            <h3 className="font-bold text-xs text-slate-400 mb-3 uppercase tracking-widest flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Real-Time Telemetry
            </h3>
            
            <div className="text-3xl font-black font-mono tracking-tight text-white mb-6 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center shadow-inner">
              {phase}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 text-sm font-medium">Primary Current</span>
                <span className={`font-mono text-xl font-bold ${faultCurrent >= pickup50 ? 'text-red-400' : faultCurrent >= pickup51 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {faultCurrent.toLocaleString()} <span className="text-sm">A</span>
                </span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 text-sm font-medium">Expected Op. Time</span>
                <span className="font-mono text-xl font-bold text-sky-400">
                  {tripTime ? `${tripTime.toFixed(3)}s` : '∞'}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-slate-400 text-sm font-medium">Relay Timer</span>
                <span className="font-mono text-2xl font-bold text-white">
                  {elapsed.toFixed(3)}s
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Grid: TCC Curve & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TCC Canvas */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-100 flex items-center">
              <TrendingUp className="w-5 h-5 text-sky-500 mr-3" /> Time-Current Characteristic (TCC)
            </h3>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="w-3 h-0.5 bg-sky-500 inline-block"></span> 51 Curve
              <span className="w-3 h-0.5 bg-red-500 inline-block ml-2 border-t border-dashed"></span> 50 Inst
            </div>
          </div>
          <TCCChart 
            pickup51={sPickup51} 
            tms={sTms} 
            curveType={curveType} 
            pickup50={sPickup50} 
            faultCurrent={faultCurrent} 
            tripTime={tripTime} 
          />
        </div>

        {/* Event Log */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col">
          <h3 className="font-bold mb-4 text-slate-100 flex items-center">
            <ShieldCheck className="w-5 h-5 text-sky-500 mr-3" /> Sequence of Events (SOE)
          </h3>
          <div className="flex-1 bg-[#0a0f18] rounded-xl border border-slate-800 p-4 overflow-hidden relative shadow-inner">
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:100%_4px] z-10 opacity-30"></div>
            
            <div className="h-full overflow-y-auto space-y-2 pr-2 relative z-20" style={{ maxHeight: '350px' }}>
              {events.length === 0 && (
                <div className="flex h-full items-center justify-center text-slate-600 font-mono text-sm animate-pulse">
                  &gt; SYSTEM IDLE. WAITING FOR TRIGGER...
                </div>
              )}
              <AnimatePresence>
                {events.map((e) => (
                  <motion.div 
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded bg-slate-900 border-l-2 shadow-sm ${
                      e.type === 'trip' ? 'border-red-500 text-red-200' : 
                      e.type === 'success' ? 'border-emerald-500 text-emerald-200' : 
                      e.type === 'fault' ? 'border-amber-500 text-amber-200' : 
                      'border-sky-500 text-sky-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-[10px] opacity-60">T + {e.time.toFixed(3)}s</span>
                      {e.type === 'trip' && <span className="font-mono text-[10px] bg-red-500/20 text-red-400 px-1 rounded">TRIP</span>}
                    </div>
                    <div className="font-mono text-xs leading-relaxed">{e.msg}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ============================== THEORY & GUIDE MODULE ==============================
const TheoryGuideModule = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Book size={200} />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 relative z-10">Overcurrent Protection Fundamentals</h2>
        <p className="text-slate-400 text-lg relative z-10">ANSI 50/51 Elements & IEEE / IEC Characteristics</p>

        <div className="mt-8 space-y-6 relative z-10">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-sky-400 mb-3 flex items-center"><Zap className="w-5 h-5 mr-2"/> Element 51 (Time Overcurrent)</h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              Provides time-delayed tripping. The delay is inversely proportional to the fault current magnitude. Commercial relays implement standards like <strong>IEEE C37.112</strong> and <strong>IEC 60255-151</strong> mathematically:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-950 p-4 rounded-lg font-mono text-center border border-slate-800 shadow-inner">
                <div className="text-xs text-slate-500 mb-1 tracking-widest">IEC FORMULA</div>
                <div className="text-amber-400 text-sm">t = TMS × [ A / ((I/I<sub className="text-[10px]">p</sub>)<sup>P</sup> - 1) + B ]</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg font-mono text-center border border-slate-800 shadow-inner">
                <div className="text-xs text-slate-500 mb-1 tracking-widest">IEEE FORMULA</div>
                <div className="text-amber-400 text-sm">t = TD × [ A / ((I/I<sub className="text-[10px]">p</sub>)<sup>P</sup> - 1) + B ]</div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
              <li><strong>Standard/Moderately Inverse:</strong> General applications, backup protection.</li>
              <li><strong>Very Inverse (VI):</strong> Networks with large fault current variations between near and far faults.</li>
              <li><strong>Extremely Inverse (EI):</strong> Steepest curve. Best for coordinating with fuses and protecting equipment with severe thermal limits (I²t) like motors and transformers.</li>
            </ul>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> Element 50 (Instantaneous)</h3>
            <p className="text-slate-300 leading-relaxed">
              Operates with no intentional time delay (typically &lt;30ms in modern digital relays) when the current exceeds a high setpoint. Usually set above the maximum asymmetrical through-fault current to ensure it only trips for close-in, severe faults inside the protected zone.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-emerald-400 mb-3 flex items-center"><Activity className="w-5 h-5 mr-2"/> Grading & Coordination</h3>
            <p className="text-slate-300 leading-relaxed">
              Relays in series must be coordinated. The downstream relay (closest to fault) must clear before the upstream relay. The <strong>Coordination Time Interval (CTI)</strong> is typically 0.2s to 0.4s for digital relays, accounting for breaker clearing time (approx 50ms) and safety margins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================== QUIZ MODULE ==============================
const QUIZ_DATA = [
  { q: "Which IEC curve provides the fastest trip for very high fault currents?", opts: ["Standard Inverse", "Very Inverse", "Extremely Inverse", "Definite Time"], ans: 2, why: "EI has an exponent of P=2.0, meaning trip time decreases dramatically with the square of the current multiple." },
  { q: "What does ANSI 50 designate?", opts: ["Time overcurrent", "Instantaneous overcurrent", "Directional relay", "Undervoltage"], ans: 1, why: "ANSI 50 is Instantaneous Overcurrent, operating with no intentional time delay." },
  { q: "The standard Coordination Time Interval (CTI) between two relays is typically:", opts: ["0.05s", "0.3s", "1.5s", "5.0s"], ans: 1, why: "0.3s to 0.4s is standard, allowing for breaker opening time and safety margins." },
  { q: "The Pickup Current (Ip) of a 51 element should ideally be set:", opts: ["Below normal load", "Exactly at normal load", "1.2 to 1.3x max normal load", "Above short circuit current"], ans: 2, why: "It must be above maximum load to prevent nuisance tripping, but sensitive enough to detect minimum faults." }
];

const QuizModule = () => {
  const [cur, setCur] = useState(0);
  const [score, setScore] = useState(0);
  const [sel, setSel] = useState(null);
  const [fin, setFin] = useState(false);
  
  const q = QUIZ_DATA[cur];

  const pick = (i) => {
    if (sel !== null) return;
    setSel(i);
    if (i === q.ans) setScore(p => p + 1);
    setTimeout(() => {
      if (cur + 1 >= QUIZ_DATA.length) setFin(true);
      else { setCur(p => p + 1); setSel(null); }
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Award size={32} /></div>
          <div>
            <h2 className="text-2xl font-black text-white">Knowledge Check</h2>
            <p className="text-slate-400">Test your understanding of protective relaying</p>
          </div>
        </div>

        {fin ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
            <div className="text-6xl mb-6">{score === QUIZ_DATA.length ? '🏆' : score > 1 ? '👍' : '📚'}</div>
            <h3 className="text-3xl font-black text-white mb-2">Score: {score}/{QUIZ_DATA.length}</h3>
            <button onClick={() => { setCur(0); setScore(0); setSel(null); setFin(false); }} className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">Retake Quiz</button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={cur} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex justify-between text-sm text-slate-400 mb-6 font-bold tracking-widest uppercase">
                <span>Question {cur + 1} of {QUIZ_DATA.length}</span>
                <span className="text-emerald-500">Score: {score}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-8 leading-relaxed">{q.q}</h3>
              <div className="space-y-4">
                {q.opts.map((o, i) => (
                  <button 
                    key={i} 
                    onClick={() => pick(i)} 
                    disabled={sel !== null}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      sel === null ? 'border-slate-700 bg-slate-800/50 hover:border-blue-500 hover:bg-slate-800 text-slate-200' :
                      i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                      sel === i ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-800 bg-slate-900 text-slate-600'
                    }`}
                  >
                    <span className="font-mono mr-4 opacity-50">{String.fromCharCode(65 + i)}</span> {o}
                  </button>
                ))}
              </div>
              
              <AnimatePresence>
                {sel !== null && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 p-5 rounded-xl border ${sel === q.ans ? 'bg-emerald-950/50 border-emerald-900 text-emerald-200' : 'bg-amber-950/50 border-amber-900 text-amber-200'}`}
                  >
                    <div className="font-bold flex items-center mb-1">
                      {sel === q.ans ? <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500"/> : <AlertTriangle className="w-5 h-5 mr-2 text-amber-500"/>}
                      {sel === q.ans ? 'Correct!' : 'Incorrect.'}
                    </div>
                    <div className="text-sm opacity-90 ml-7">{q.why}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// ============================== MAIN APP ==============================
export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');
  
  const tabs = [
    { id: 'simulator', label: 'Interactive Simulator', icon: <MonitorPlay className="w-4 h-4" /> },
    { id: 'theory', label: 'Theory & Reference', icon: <Book className="w-4 h-4" /> },
    { id: 'quiz', label: 'Knowledge Check', icon: <Award className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl text-white tracking-tight">
                OC<span className="text-amber-500">Guard</span> Pro
              </h1>
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                IEEE / IEC 60255 Compliant
              </div>
            </div>
          </div>

          <div className="hidden md:flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {tabs.map(t => (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id)} 
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === t.id ? 'bg-slate-800 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </div>

          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold border border-slate-700 transition-colors" onClick={() => alert("Share link copied!")}>
            <Share2 className="w-4 h-4" /> Share Config
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 z-50 flex justify-around items-center pb-safe">
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)} 
            className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold transition-colors ${
              activeTab === t.id ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'simulator' && <SimulatorModule />}
            {activeTab === 'theory' && <TheoryGuideModule />}
            {activeTab === 'quiz' && <QuizModule />}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}