import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, RotateCcw, Activity, HelpCircle, Book, Settings, MonitorPlay,
  GraduationCap, ShieldCheck, Award, Gauge, Power, CheckCircle2, XCircle,
  Zap, AlertTriangle, TrendingUp, Cpu, Network, BookOpen, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ========================= STANDARDS & CONSTANTS =========================
// IEEE C50.12/C50.13 & ANSI 25 Standard Limits
const SCENARIOS = [
  { id: 'gen_parallel', label: 'Generator Paralleling (IEEE C50.13)', dvMax: 5, dfMax: 0.067, daMax: 10, desc: "Strict limits for turbo-generators to prevent shaft torque damage." },
  { id: 'line_reclose', label: 'Line Reclosing (IEEE C37.104)', dvMax: 10, dfMax: 0.200, daMax: 20, desc: "Wider limits for restoring transmission lines with existing load angles." },
  { id: 'bus_tie', label: 'Bus Coupler / Tie', dvMax: 5, dfMax: 0.100, daMax: 15, desc: "Medium limits for tying two solidly interconnected network sections." },
];

const QUIZ_DATA = {
  questions: [
    { q: "Per IEEE C50.13, the typical maximum permissible phase angle difference (Δθ) for turbo-generator synchronization is:", opts: ["±5°", "±10°", "±25°", "±45°"], ans: 1, exp: "IEEE C50.13 recommends ±10° to limit transient shaft torques during closure." },
    { q: "What is the purpose of calculating the 'Advance Angle' in a modern digital synchrocheck relay?", opts: ["To correct CT phase shifts", "To account for the mechanical closing time of the circuit breaker", "To compensate for line impedance", "To adjust the generator governor"], ans: 1, exp: "Breakers take 40-100ms to physically close. The relay must send the close command slightly early (advance angle) so contacts mate exactly at 0°." },
    { q: "When the synchroscope pointer is rotating counter-clockwise (anti-clockwise), it indicates:", opts: ["Generator frequency is higher than Bus frequency", "Generator frequency is lower than Bus frequency", "Voltages are out of phase by 180°", "The breaker is closed"], ans: 1, exp: "Counter-clockwise rotation means negative slip; the incoming generator is running slower than the running bus." },
    { q: "Ideally, when paralleling a generator, the incoming generator voltage should be:", opts: ["Slightly lower than the bus (to absorb VARs)", "Exactly equal to the bus", "Slightly higher than the bus (to export VARs)", "10% higher to prevent reverse power"], ans: 2, exp: "It is preferable for the incoming generator voltage to be slightly higher (0 to +5%) so it immediately supplies lagging reactive power (VARs) rather than drawing them, preventing a potential reverse power trip." },
    { q: "What ANSI device number designates a Synchrocheck Relay?", opts: ["50/51", "87", "21", "25"], ans: 3, exp: "ANSI 25 is the standard designation for a Synchronizing or Synchronism-Check device." }
  ]
};

// ========================= REUSABLE UI COMPONENTS =========================
const Slider = ({ label, unit, min, max, step, value, onChange, colorClass }) => (
  <div className="flex flex-col space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <span className={`font-mono font-bold text-sm ${colorClass}`}>{value.toFixed(step < 0.1 ? 3 : 1)}{unit}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value} onChange={onChange}
      className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700/50 accent-${colorClass.split('-')[1]}-500`}
    />
  </div>
);

const DigitalMeter = ({ label, value, unit, ok, limitStr, digits = 1 }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl border ${ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
    <div className="flex items-center gap-3">
      {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
      <span className="font-bold text-slate-200">{label}</span>
    </div>
    <div className="text-right">
      <span className={`font-mono font-bold text-lg ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
        {value.toFixed(digits)}{unit}
      </span>
      <div className="text-[10px] text-slate-500 font-medium">Limit: {limitStr}</div>
    </div>
  </div>
);

// ========================= MAIN APPLICATION =========================
export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col selection:bg-purple-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-lg text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl leading-none tracking-tight text-white">Synchro<span className="text-purple-400">Master</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ANSI 25 Simulator</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">IEEE Compliant</span>
            </div>
          </div>
        </div>
        
        <nav className="hidden md:flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          {[
            { id: 'simulator', icon: MonitorPlay, label: 'Simulator' },
            { id: 'waveforms', icon: Activity, label: 'Waveforms & Phasors' },
            { id: 'theory', icon: BookOpen, label: 'Theory & Standards' },
            { id: 'quiz', icon: Award, label: 'Knowledge Check' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-800 text-purple-400 shadow-sm ring-1 ring-white/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 z-50 flex justify-around p-2 pb-safe">
        {[
            { id: 'simulator', icon: MonitorPlay, label: 'Sim' },
            { id: 'waveforms', icon: Activity, label: 'Waves' },
            { id: 'theory', icon: BookOpen, label: 'Theory' },
            { id: 'quiz', icon: Award, label: 'Quiz' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-lg text-[10px] font-bold gap-1 ${
              activeTab === tab.id ? 'text-purple-400 bg-slate-800' : 'text-slate-500'
            }`}
          >
            <tab.icon className="w-5 h-5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto h-full"
          >
            {activeTab === 'simulator' && <SimulatorTab />}
            {activeTab === 'waveforms' && <WaveformsTab />}
            {activeTab === 'theory' && <TheoryTab />}
            {activeTab === 'quiz' && <QuizTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ========================= GLOBAL STATE CONTEXT (Simulated via localized vars for single-file) =========================
// To keep waveforms and simulator synced without complex Context in a single file, 
// we normally lift state. Since they are rendered in separate tabs here, we'll keep 
// the state local to each tab to prevent massive re-renders, but in a real app, 
// this would be in a Zustand store. For educational value, local state per tab is fine 
// as users interact with one tool at a time.

// ========================= SIMULATOR TAB =========================
const SimulatorTab = () => {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [busV, setBusV] = useState(1.0);     // pu
  const [genV, setGenV] = useState(1.02);    // pu (slightly higher is preferred)
  const [busF, setBusF] = useState(50.0);    // Hz
  const [genF, setGenF] = useState(50.04);   // Hz
  const [breakerTimeMs, setBreakerTimeMs] = useState(80); // ms
  
  const [angle, setAngle] = useState(0);     // degrees
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [breakerStatus, setBreakerStatus] = useState('OPEN'); // OPEN, CLOSING, CLOSED
  
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Derived values
  const deltaV = Math.abs((busV - genV) / busV * 100);
  const slipFreq = genF - busF; 
  const deltaF = Math.abs(slipFreq);
  
  // Advance Angle = Slip (degrees/sec) * Breaker Time (sec)
  // Slip in degrees/sec = slipFreq * 360
  const advanceAngle = (slipFreq * 360) * (breakerTimeMs / 1000); 
  
  // Checks
  const dvOk = deltaV <= scenario.dvMax;
  const dfOk = deltaF <= scenario.dfMax;
  const daOk = Math.abs(angle) <= scenario.daMax;
  
  // Predict if the breaker WILL close at a safe angle based on current trajectory
  const predictedAngleAtClose = angle + advanceAngle;
  const predictedDaOk = Math.abs(predictedAngleAtClose) <= scenario.daMax;
  
  const allOkNow = dvOk && dfOk && daOk;
  const closeCommandPermitted = dvOk && dfOk && predictedDaOk;

  const logEvent = (msg, type = 'info') => {
    setEvents(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 15));
  };

  // Main Simulation Loop
  useEffect(() => {
    if (!running || breakerStatus === 'CLOSED') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const loop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = timestamp;

      // Update angle: slipFreq * 360 degrees per second
      angleRef.current = (angleRef.current + slipFreq * 360 * dt) % 360;
      
      // Normalize to -180 to +180
      let displayAngle = angleRef.current;
      if (displayAngle > 180) displayAngle -= 360;
      if (displayAngle < -180) displayAngle += 360;
      
      setAngle(displayAngle);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, slipFreq, breakerStatus]);

  // Synchroscope Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 20;

    ctx.clearRect(0, 0, size, size);

    // Instrument Background
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 10);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.fill();
    
    // Bezel
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.stroke();

    // Safe Zone (Green Arc) - IEEE Limit
    const safeRad = (scenario.daMax * Math.PI) / 180;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)'; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.arc(cx, cy, r - 15, -Math.PI/2 - safeRad, -Math.PI/2 + safeRad); ctx.stroke();
    
    // Danger Zone (Red Arc)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.1)'; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.arc(cx, cy, r - 15, Math.PI/2 - Math.PI/4, Math.PI/2 + Math.PI/4); ctx.stroke();

    // Tick marks
    for (let i = 0; i < 72; i++) {
      const a = (i * 5 - 90) * Math.PI / 180;
      const isMajor = i % 6 === 0; // Every 30 deg
      ctx.strokeStyle = isMajor ? '#94a3b8' : '#475569';
      ctx.lineWidth = isMajor ? 2 : 1;
      const innerR = isMajor ? r - 25 : r - 10;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }

    // Text labels
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('0°', cx, cy - r + 40);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('180°', cx, cy + r - 35);
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif';
    ctx.fillText('SLOW', cx - r + 35, cy);
    ctx.fillText('FAST', cx + r - 35, cy);

    // ADVANCE ANGLE MARKER (Where to issue close command)
    if (Math.abs(advanceAngle) > 0.5) {
      const advRad = (-90 - advanceAngle) * Math.PI / 180;
      ctx.strokeStyle = '#a855f7'; // Purple
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(advRad) * (r - 5), cy + Math.sin(advRad) * (r - 5));
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw advance angle arc
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const startA = -Math.PI/2;
      const endA = advRad;
      if (advanceAngle > 0) ctx.arc(cx, cy, r - 35, startA, endA, true);
      else ctx.arc(cx, cy, r - 35, endA, startA, true);
      ctx.stroke();
    }

    // POINTER
    const pointerAngle = (angle - 90) * Math.PI / 180;
    const pointerLen = r - 15;
    
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    
    ctx.strokeStyle = (breakerStatus === 'CLOSED' ? '#10b981' : (dvOk && dfOk ? '#f8fafc' : '#ef4444'));
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(pointerAngle) * pointerLen, cy + Math.sin(pointerAngle) * pointerLen);
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Center hub
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

  }, [angle, scenario, advanceAngle, dvOk, dfOk, breakerStatus]);

  const handleManualClose = () => {
    if (breakerStatus !== 'OPEN') return;
    
    logEvent(`Manual close command initiated at ${angle.toFixed(1)}°`, 'info');
    
    if (!dvOk) { logEvent(`BLOCKED: Voltage Diff ${deltaV.toFixed(1)}% > ${scenario.dvMax}%`, 'error'); return; }
    if (!dfOk) { logEvent(`BLOCKED: Slip Freq ${deltaF.toFixed(3)}Hz > ${scenario.dfMax}Hz`, 'error'); return; }
    if (!predictedDaOk) { 
      logEvent(`BLOCKED: Projected Angle ${Math.abs(predictedAngleAtClose).toFixed(1)}° > ${scenario.daMax}°`, 'error'); 
      logEvent(`(Current: ${angle.toFixed(1)}°, Advance: ${advanceAngle.toFixed(1)}°)`, 'warning');
      return; 
    }

    // Accepted! Simulate breaker mechanism delay
    setBreakerStatus('CLOSING');
    logEvent(`Command Accepted. Breaker closing in ${breakerTimeMs}ms...`, 'success');
    
    setTimeout(() => {
      // Calculate exact angle at physical closure
      const finalAngle = angleRef.current;
      let dispFinal = finalAngle;
      if (dispFinal > 180) dispFinal -= 360;
      if (dispFinal < -180) dispFinal += 360;
      
      const Vacross = Math.sqrt(busV**2 + genV**2 - 2*busV*genV*Math.cos(dispFinal * Math.PI / 180));
      
      setBreakerStatus('CLOSED');
      setRunning(false);
      
      if (Math.abs(dispFinal) <= scenario.daMax) {
        logEvent(`BREAKER CLOSED at ${dispFinal.toFixed(1)}°. V_across = ${Vacross.toFixed(3)} pu`, 'success');
      } else {
        logEvent(`BREAKER CLOSED OUT OF PHASE at ${dispFinal.toFixed(1)}°! High transient torque!`, 'error');
      }
    }, breakerTimeMs);
  };

  const handleAutoSync = () => {
    // Demonstrates perfect timing
    if (!dvOk || !dfOk || breakerStatus !== 'OPEN' || !running) {
      logEvent("Auto-Sync requires simulation running and V/f within limits.", 'warning');
      return;
    }
    logEvent("Auto-Sync armed. Waiting for optimal phase angle...", 'info');
    
    // Poll to find exact moment to fire
    const interval = setInterval(() => {
      // We want to fire when (angle + advanceAngle) approaches 0
      // Due to rotation direction, we check if we are crossing the firing line
      let currentA = angleRef.current;
      if (currentA > 180) currentA -= 360;
      
      const projected = currentA + advanceAngle;
      
      // Fire if projected angle is within 1 degree of 0
      if (Math.abs(projected) < 1.0) {
        clearInterval(interval);
        handleManualClose();
      }
    }, 10); // 10ms polling for high precision
    
    // Fallback clear
    setTimeout(() => clearInterval(interval), 10000);
  };

  const reset = () => {
    setBreakerStatus('OPEN');
    setRunning(false);
    setAngle(0);
    angleRef.current = 0;
    lastTimeRef.current = 0;
    setEvents([]);
    logEvent("Simulation reset to initial state.", 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Controls & Config */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-blue-400" /> Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">Scenario (IEEE Std)</label>
              <select 
                value={scenario.id} 
                onChange={e => {
                  const s = SCENARIOS.find(x => x.id === e.target.value);
                  setScenario(s);
                  logEvent(`Scenario changed to: ${s.label}`, 'info');
                }}
                className="w-full p-2.5 rounded-lg border bg-slate-950 border-slate-700 text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">{scenario.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-4">
              <Slider label="Bus Voltage (Running)" unit=" pu" min={0.8} max={1.2} step={0.01} value={busV} onChange={e => setBusV(parseFloat(e.target.value))} colorClass="text-blue-400" />
              <Slider label="Gen Voltage (Incoming)" unit=" pu" min={0.8} max={1.2} step={0.01} value={genV} onChange={e => setGenV(parseFloat(e.target.value))} colorClass="text-purple-400" />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-4">
              <Slider label="Gen Frequency" unit=" Hz" min={49.0} max={51.0} step={0.01} value={genF} onChange={e => setGenF(parseFloat(e.target.value))} colorClass="text-amber-400" />
              <Slider label="Breaker Close Time" unit=" ms" min={20} max={150} step={5} value={breakerTimeMs} onChange={e => setBreakerTimeMs(parseInt(e.target.value))} colorClass="text-slate-300" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-white">
            <Activity className="w-4 h-4 text-emerald-400" /> Event Logger
          </h3>
          <div className="h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {events.length === 0 && <p className="text-sm text-slate-500 italic text-center mt-10">No events logged.</p>}
            <AnimatePresence>
              {events.map((e, i) => (
                <motion.div 
                  key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className={`text-xs p-2 rounded border-l-2 bg-slate-950 font-mono ${
                    e.type === 'error' ? 'border-red-500 text-red-200' : 
                    e.type === 'success' ? 'border-emerald-500 text-emerald-200' : 
                    e.type === 'warning' ? 'border-amber-500 text-amber-200' : 
                    'border-blue-500 text-slate-300'
                  }`}
                >
                  <span className="opacity-50 mr-2">[{e.time}]</span>{e.msg}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Visualization & Execution */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Top Data Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DigitalMeter label="ΔV Check" value={deltaV} unit="%" ok={dvOk} limitStr={`≤${scenario.dvMax}%`} />
          <DigitalMeter label="Δf Check" value={deltaF} unit=" Hz" ok={dfOk} limitStr={`≤${scenario.dfMax}Hz`} digits={3} />
          <DigitalMeter label="Δθ Check" value={Math.abs(angle)} unit="°" ok={daOk} limitStr={`≤${scenario.daMax}°`} digits={1} />
          <div className={`flex flex-col justify-center items-center p-3 rounded-xl border ${
            breakerStatus === 'CLOSED' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' :
            breakerStatus === 'CLOSING' ? 'border-amber-500 bg-amber-500/20 text-amber-400 animate-pulse' :
            'border-slate-700 bg-slate-800/50 text-slate-400'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Breaker Status</span>
            <span className="text-xl font-black mt-1">{breakerStatus}</span>
          </div>
        </div>

        {/* Synchroscope Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-[300px]">
            <div className="absolute top-0 right-0 p-2 bg-slate-950 rounded-lg border border-slate-800 shadow-md">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Advance Angle</div>
              <div className="text-sm font-mono font-bold text-purple-400">{advanceAngle.toFixed(1)}°</div>
            </div>
            
            <canvas ref={canvasRef} width={280} height={280} className="rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)]" />
            
            <div className="mt-6 flex flex-col items-center">
              <span className="text-xs font-bold uppercase text-slate-500">Live Phase Angle (Δθ)</span>
              <span className={`text-4xl font-black font-mono ${daOk ? 'text-emerald-400' : 'text-slate-200'}`}>
                {angle > 0 ? '+' : ''}{angle.toFixed(1)}°
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 w-full">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="font-bold text-sm text-slate-300 mb-2 border-b border-slate-800 pb-2">ANSI 25 Relay Logic (AND)</h4>
              <ul className="space-y-2 text-sm font-mono">
                <li className="flex items-center justify-between"><span>27/59 Voltage Ok:</span> {dvOk ? <span className="text-emerald-400">TRUE</span> : <span className="text-red-400">FALSE</span>}</li>
                <li className="flex items-center justify-between"><span>81 Slip Freq Ok:</span> {dfOk ? <span className="text-emerald-400">TRUE</span> : <span className="text-red-400">FALSE</span>}</li>
                <li className="flex items-center justify-between border-t border-slate-800 pt-2">
                  <span>Projected Δθ Ok:</span> 
                  {predictedDaOk ? <span className="text-emerald-400">TRUE</span> : <span className="text-red-400">FALSE</span>}
                </li>
                <li className="text-[10px] text-slate-500 text-right">Proj = Current + Advance</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {breakerStatus === 'OPEN' && !running ? (
                <button onClick={() => setRunning(true)} className="col-span-2 flex justify-center items-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-all">
                  <Play className="w-5 h-5" /> Start Generator / Sync
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleManualClose} 
                    disabled={breakerStatus !== 'OPEN'}
                    className={`col-span-2 flex justify-center items-center gap-2 py-4 rounded-xl font-black text-lg transition-all shadow-lg ${
                      breakerStatus !== 'OPEN' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                      closeCommandPermitted ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50' : 
                      'bg-red-600/50 hover:bg-red-500/50 text-white/80 cursor-not-allowed'
                    }`}
                  >
                    <Power className="w-6 h-6" /> {breakerStatus === 'OPEN' ? 'ISSUE CLOSE COMMAND' : breakerStatus}
                  </button>
                  
                  <button 
                    onClick={handleAutoSync}
                    disabled={breakerStatus !== 'OPEN' || !dvOk || !dfOk}
                    className="flex justify-center items-center gap-2 py-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 rounded-xl font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4" /> Auto-Sync
                  </button>
                  
                  <button onClick={reset} className="flex justify-center items-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-all">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ========================= WAVEFORMS & PHASORS TAB =========================
const WaveformsTab = () => {
  const canvasRef = useRef(null);
  const phasorRef = useRef(null);
  const animRef = useRef(null);
  
  // Local state for interactive sliders in this tab
  const [vBus, setVBus] = useState(1.0);
  const [vGen, setVGen] = useState(0.8);
  const [phaseDiff, setPhaseDiff] = useState(45); // Static angle for demonstration

  useEffect(() => {
    // Render Waveforms
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const cy = h / 2;
    const amp = (h / 2) * 0.8; // 80% height

    const drawWaves = () => {
      ctx.clearRect(0, 0, w, h);
      
      // Grid
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
      
      const drawSine = (volts, phaseDeg, color) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        for (let x = 0; x <= w; x++) {
          // 2 complete cycles fit in width
          const theta = (x / w) * Math.PI * 4; 
          const phaseRad = phaseDeg * Math.PI / 180;
          const y = cy - Math.sin(theta - phaseRad) * (volts * amp);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      drawSine(vBus, 0, '#3b82f6'); // Bus (Blue)
      drawSine(vGen, phaseDiff, '#a855f7'); // Gen (Purple)

      // Draw Voltage Across Breaker (Difference)
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444'; // Red
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      for (let x = 0; x <= w; x++) {
        const theta = (x / w) * Math.PI * 4;
        const phaseRad = phaseDiff * Math.PI / 180;
        const yBus = Math.sin(theta) * (vBus * amp);
        const yGen = Math.sin(theta - phaseRad) * (vGen * amp);
        const yDiff = cy - (yBus - yGen);
        if (x === 0) ctx.moveTo(x, yDiff);
        else ctx.lineTo(x, yDiff);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };
    drawWaves();

    // Render Phasors
    const pCtx = phasorRef.current?.getContext('2d');
    if (!pCtx) return;
    const pw = phasorRef.current.width;
    const ph = phasorRef.current.height;
    const pcx = pw / 2, pcy = ph / 2;
    const pr = (pw / 2) * 0.8;

    const drawPhasors = () => {
      pCtx.clearRect(0, 0, pw, ph);
      
      // Polar Grid
      pCtx.strokeStyle = '#334155'; pCtx.lineWidth = 1;
      pCtx.beginPath(); pCtx.arc(pcx, pcy, pr, 0, Math.PI*2); pCtx.stroke();
      pCtx.beginPath(); pCtx.arc(pcx, pcy, pr/2, 0, Math.PI*2); pCtx.stroke();
      pCtx.beginPath(); pCtx.moveTo(pcx-pr, pcy); pCtx.lineTo(pcx+pr, pcy); pCtx.stroke();
      pCtx.beginPath(); pCtx.moveTo(pcx, pcy-pr); pCtx.lineTo(pcx, pcy+pr); pCtx.stroke();

      const drawVector = (mag, angleDeg, color, label) => {
        const rad = -angleDeg * Math.PI / 180; // Negative because Y is down in canvas
        const ex = pcx + Math.cos(rad) * (mag * pr);
        const ey = pcy + Math.sin(rad) * (mag * pr);
        
        // Line
        pCtx.beginPath();
        pCtx.strokeStyle = color;
        pCtx.lineWidth = 4;
        pCtx.lineCap = 'round';
        pCtx.moveTo(pcx, pcy);
        pCtx.lineTo(ex, ey);
        pCtx.stroke();
        
        // Arrow head
        const arrowL = 10;
        pCtx.beginPath();
        pCtx.moveTo(ex, ey);
        pCtx.lineTo(ex - arrowL * Math.cos(rad - Math.PI/6), ey - arrowL * Math.sin(rad - Math.PI/6));
        pCtx.lineTo(ex - arrowL * Math.cos(rad + Math.PI/6), ey - arrowL * Math.sin(rad + Math.PI/6));
        pCtx.fillStyle = color;
        pCtx.fill();
        
        // Label
        pCtx.fillStyle = color;
        pCtx.font = 'bold 12px sans-serif';
        pCtx.fillText(label, ex + 10, ey + 10);
      };

      drawVector(vBus, 0, '#3b82f6', 'V_Bus');
      drawVector(vGen, -phaseDiff, '#a855f7', 'V_Gen'); // -phaseDiff to match wave logic
    };
    drawPhasors();

  }, [vBus, vGen, phaseDiff]);

  // Calculate RMS difference
  const vAcross = Math.sqrt(vBus**2 + vGen**2 - 2*vBus*vGen*Math.cos(phaseDiff * Math.PI/180));

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2"><Activity className="text-purple-400"/> Waveform & Phasor Analysis</h2>
        <p className="text-slate-400 text-sm mb-6">Visualize how Voltage Magnitude and Phase Angle affect the voltage across the open circuit breaker contacts. If this voltage is too high during closure, massive transient currents will flow.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
            <h3 className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time Domain (Oscilloscope)</h3>
            <div className="absolute top-4 right-4 flex gap-3 text-[10px] font-bold">
              <span className="text-blue-400 flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 inline-block rounded-sm"></span> V_Bus</span>
              <span className="text-purple-400 flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 inline-block rounded-sm"></span> V_Gen</span>
              <span className="text-red-400 flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-red-500 inline-block"></span> V_Breaker</span>
            </div>
            <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto mt-6" />
          </div>
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative">
            <h3 className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phasor Domain</h3>
            <canvas ref={phasorRef} width={250} height={250} className="mt-6" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="space-y-4">
            <Slider label="V_Bus (pu)" unit="" min={0.5} max={1.5} step={0.05} value={vBus} onChange={e => setVBus(parseFloat(e.target.value))} colorClass="text-blue-400" />
            <Slider label="V_Gen (pu)" unit="" min={0.5} max={1.5} step={0.05} value={vGen} onChange={e => setVGen(parseFloat(e.target.value))} colorClass="text-purple-400" />
          </div>
          <div className="space-y-4 md:col-span-2 flex flex-col justify-center">
            <Slider label="Phase Difference (Δθ)" unit="°" min={-180} max={180} step={1} value={phaseDiff} onChange={e => setPhaseDiff(parseFloat(e.target.value))} colorClass="text-amber-400" />
            
            <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex justify-between items-center">
              <div>
                <div className="text-xs text-red-300 font-bold uppercase tracking-wider">Voltage Across Breaker Contacts</div>
                <div className="text-[10px] text-red-400/70 font-mono mt-1">V_cb = √(V_b² + V_g² - 2*V_b*V_g*cos(Δθ))</div>
              </div>
              <div className="text-3xl font-black text-red-400 font-mono">{vAcross.toFixed(2)} pu</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================= THEORY & STANDARDS TAB =========================
const TheoryTab = () => (
  <div className="space-y-8">
    <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-slate-800 rounded-2xl p-8">
      <h2 className="text-3xl font-black text-white mb-4">IEEE Synchrocheck Standards Reference</h2>
      <p className="text-slate-300 max-w-3xl leading-relaxed">
        Synchronizing a generator to a power grid requires exact matching of voltage, frequency, and phase angle. 
        Failure to synchronize properly results in immense electro-mechanical transient torques that can twist generator shafts, damage windings, and cause severe voltage dips on the power system.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2"><Cpu className="w-5 h-5"/> IEEE C50.12 / C50.13</h3>
        <p className="text-sm text-slate-400 mb-4">Requirements for Cylindrical-Rotor Synchronous Generators.</p>
        <ul className="space-y-3">
          <li className="flex gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="font-bold text-white min-w-[60px]">Δθ</div>
            <div className="text-sm text-slate-400"><strong className="text-emerald-400">±10 Degrees.</strong> Maximum permissible phase angle limit to prevent excessive shaft fatigue.</div>
          </li>
          <li className="flex gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="font-bold text-white min-w-[60px]">ΔV</div>
            <div className="text-sm text-slate-400"><strong className="text-emerald-400">0 to +5%.</strong> Generator voltage should be slightly higher than the bus to ensure it immediately exports VARs, avoiding a motoring trip.</div>
          </li>
          <li className="flex gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="font-bold text-white min-w-[60px]">Δf</div>
            <div className="text-sm text-slate-400"><strong className="text-emerald-400">±0.067 Hz.</strong> Slip frequency must be very low. Positive slip (generator slightly faster) is preferred so it picks up MW load immediately.</div>
          </li>
        </ul>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2"><Network className="w-5 h-5"/> Line Reclosing (IEEE C37.104)</h3>
        <p className="text-sm text-slate-400 mb-4">Guide for Automatic Reclosing of Line Circuit Breakers.</p>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          When reclosing a transmission line that ties two parts of a grid together, the limits are relaxed because the inertia of the systems is much higher, and there is usually an existing load angle across the open tie.
        </p>
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm space-y-2">
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Phase Angle (Δθ) Limit</span> <span className="font-bold text-white">Up to ±20° - 40°</span></div>
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Voltage (ΔV) Limit</span> <span className="font-bold text-white">±10%</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Slip Frequency (Δf)</span> <span className="font-bold text-white">±0.1 to ±0.2 Hz</span></div>
        </div>
      </div>
    </div>

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
       <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Advance Angle Calculation</h3>
       <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 text-sm text-slate-300 space-y-4">
            <p>Modern digital relays (ANSI 25) do not issue the close command when the phase angle is exactly 0°. Circuit breakers are massive mechanical devices that take time to close their contacts—typically 40ms to 100ms.</p>
            <p>If the relay waits until 0° to issue the command, the phase angle will have drifted by the time the contacts actually touch, potentially causing damage.</p>
            <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl text-purple-200 font-mono">
              Advance Angle (deg) = 360 × Δf (Hz) × T_breaker (sec)
            </div>
          </div>
          <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm font-mono text-slate-400">
            <div>Example:</div>
            <div className="mt-2 text-white">Δf = 0.1 Hz (Slip speed)</div>
            <div className="text-white">Breaker Time = 80 ms (0.08 s)</div>
            <div className="mt-2 border-t border-slate-700 pt-2 text-emerald-400">Advance = 360 × 0.1 × 0.08 = 2.88°</div>
            <div className="mt-2 text-xs">The relay sends the close command when the synchroscope reaches -2.88° (approaching 12 o'clock).</div>
          </div>
       </div>
    </div>
  </div>
);

// ========================= QUIZ TAB =========================
const QuizTab = () => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  const q = QUIZ_DATA.questions[current];

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.ans) setScore(prev => prev + 1);
  };

  const nextQuestion = () => {
    if (current + 1 >= QUIZ_DATA.questions.length) {
      setFinished(true);
    } else {
      setCurrent(prev => prev + 1);
      setSelected(null);
    }
  };

  const resetQuiz = () => {
    setCurrent(0); setScore(0); setSelected(null); setFinished(false);
  };

  if (finished) {
    const percent = Math.round((score / QUIZ_DATA.questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center shadow-2xl">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <Award className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-2">{percent}% Score</h2>
          <p className="text-slate-400 mb-8 text-lg">You got {score} out of {QUIZ_DATA.questions.length} correct.</p>
          
          <button onClick={resetQuiz} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 mx-auto">
            <RotateCcw className="w-5 h-5" /> Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-4">
      <div className="mb-6 flex justify-between items-center text-sm font-bold text-slate-500 uppercase tracking-wider">
        <span>Question {current + 1} of {QUIZ_DATA.questions.length}</span>
        <span className="text-emerald-500">Score: {score}</span>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-xl">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-tight">{q.q}</h3>
        
        <div className="space-y-4 mb-8">
          {q.opts.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.ans;
            const showStatus = selected !== null;
            
            let btnClass = "bg-slate-950 border-slate-800 text-slate-300 hover:border-purple-500 hover:bg-slate-800";
            if (showStatus) {
              if (isCorrect) btnClass = "bg-emerald-900/30 border-emerald-500 text-emerald-400";
              else if (isSelected) btnClass = "bg-red-900/30 border-red-500 text-red-400";
              else btnClass = "bg-slate-950 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed";
            }

            return (
              <button 
                key={i} 
                disabled={showStatus}
                onClick={() => handleSelect(i)}
                className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${btnClass}`}
              >
                <span><span className="opacity-50 mr-3">{String.fromCharCode(65 + i)}.</span> {opt}</span>
                {showStatus && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                {showStatus && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {selected !== null && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 mb-8"
            >
              <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2"><HelpCircle className="w-4 h-4"/> Explanation</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{q.exp}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <button 
            onClick={nextQuestion}
            disabled={selected === null}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              selected !== null ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {current + 1 === QUIZ_DATA.questions.length ? 'Finish Quiz' : 'Next Question'} <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};