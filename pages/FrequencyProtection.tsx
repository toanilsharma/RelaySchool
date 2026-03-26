import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RotateCcw, HelpCircle, BookOpen, Settings, MonitorPlay, 
  Award, Zap, AlertTriangle, Activity, Play, ShieldCheck, 
  Share2, Info, Cpu, BarChart3, TrendingDown, Target, CheckCircle2, 
  XCircle, Timer, FileText, BatteryWarning, ServerCrash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================== CONSTANTS & DATA ==============================
const UFLS_STAGES = [
  { id: 1, threshold: 49.2, delay: 0.2, loadPercent: 10, label: 'Stage 1', color: '#fbbf24' },
  { id: 2, threshold: 49.0, delay: 0.2, loadPercent: 10, label: 'Stage 2', color: '#f59e0b' },
  { id: 3, threshold: 48.8, delay: 0.2, loadPercent: 15, label: 'Stage 3', color: '#ea580c' },
  { id: 4, threshold: 48.4, delay: 0.3, loadPercent: 10, label: 'Stage 4', color: '#ef4444' },
  { id: 5, threshold: 48.0, delay: 0.2, loadPercent: 5,  label: 'Stage 5', color: '#dc2626' },
];

const THEORY_CONTENT = [
  { 
    id: 'swing-equation', 
    title: 'The Swing Equation & ROCOF', 
    icon: Activity, 
    content: [
      { type: 'text', value: 'System frequency is the heartbeat of the power grid, representing the balance between mechanical power generation and electrical load. When generation is suddenly lost, the frequency drops.' },
      { type: 'formula', value: 'ROCOF \\; (\\frac{df}{dt}) = \\frac{\\Delta P}{2H} \\cdot f_0' },
      { type: 'text', value: 'The Rate of Change of Frequency (ROCOF) is directly proportional to the size of the power deficit (ΔP) and inversely proportional to the system inertia (H). Modern grids with high solar/wind penetration have lower inertia, causing dangerously fast frequency drops.' }
    ]
  },
  { 
    id: 'ufls-logic', 
    title: 'Under-Frequency Load Shedding (UFLS)', 
    icon: TrendingDown, 
    content: [
      { type: 'text', value: 'UFLS (ANSI 81U) is the ultimate safety net for a power system. If frequency drops dangerously low, the system automatically disconnects pre-selected blocks of load to restore the generation-load balance.' },
      { type: 'list', items: [
        'Stage Thresholds: Relays are set at cascading frequency levels (e.g., 49.2Hz, 49.0Hz).',
        'Time Delays: Brief delays (e.g., 0.2s) prevent nuisance tripping during transient electrical faults that temporarily distort the voltage waveform.',
        'Overshedding: Shedding too much load can cause an over-frequency condition, which trips generators and causes further instability. Stages must be carefully coordinated.'
      ]}
    ]
  },
  { 
    id: 'islanding', 
    title: 'System Collapse & Islanding', 
    icon: ServerCrash, 
    content: [
      { type: 'text', value: 'If the UFLS scheme exhausts all its stages and the frequency continues to drop below a critical threshold (typically 47.0 - 47.5 Hz), the system will collapse.' },
      { type: 'text', value: 'At this point, power plants automatically trip themselves offline to protect their turbines from damaging vibrations caused by low-speed operation (blade resonance). This results in a total blackout.' }
    ]
  }
];

const QUIZ_DATA = [
  { q: "When system load exceeds generation, frequency:", opts: ["Rises", "Drops", "Stays the same", "Oscillates"], ans: 1, why: "Generators must tap into their stored kinetic energy to supply the extra load, causing them to slow down and system frequency to drop." },
  { q: "What ANSI code designates under/over frequency protection?", opts: ["50", "67", "81", "87"], ans: 2, why: "ANSI 81 designates Frequency Relays. 81U is Under-frequency, 81O is Over-frequency, and 81R is Rate-of-Change of Frequency (ROCOF)." },
  { q: "The 'H' constant in the swing equation represents:", opts: ["Harmonics", "System Inertia", "Heat generation", "Hertz"], ans: 1, why: "Inertia (H), measured in seconds, represents the kinetic energy stored in the heavy spinning rotors of synchronous generators." },
  { q: "Why is low system inertia (e.g., high solar/wind penetration) a concern?", opts: ["It causes higher voltage", "It causes slower frequency decay", "It causes faster frequency decay (high ROCOF)", "It stops current flow"], ans: 2, why: "Inverter-based resources don't provide natural physical inertia. A disturbance results in a much steeper frequency drop, giving UFLS relays less time to react." },
  { q: "Why do UFLS stages have intentional time delays (e.g., 200ms)?", opts: ["To let the grid crash", "To avoid nuisance tripping from transient voltage phase shifts", "To wait for human operators", "To measure current"], ans: 1, why: "During a nearby short-circuit, the voltage phase angle shifts rapidly. Relays calculate frequency from voltage zero-crossings, so this shift looks like a false frequency spike/dip. A small time delay filters this out." }
];

// ============================== REUSABLE UI COMPONENTS ==============================
const Card = ({ children, className = "", title, icon: Icon, action }) => (
  <div className={`bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-800/20">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-red-400" />}
          <h3 className="font-bold text-slate-100 tracking-wide">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const ProSlider = ({ label, unit, min, max, step, value, onChange, color = "red" }) => {
  const accentMap = {
    red: "accent-red-500",
    blue: "accent-blue-500",
    amber: "accent-amber-500",
  };
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-end">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-slate-100 font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
          {value} <span className="text-slate-500 text-xs">{unit}</span>
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${accentMap[color]}`} />
    </div>
  );
};

const StepBadge = ({ step, title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 font-black shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
      {step}
    </div>
    <h3 className="text-xl font-bold text-slate-100 tracking-wide">{title}</h3>
  </div>
);

const MathFormula = ({ latex }) => (
  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 my-4 flex justify-center font-serif text-xl tracking-wider text-red-100 shadow-inner">
    <span dangerouslySetInnerHTML={{ __html: latex
      .replace(/\\frac{(.*?)}{(.*?)}/g, '<span class="inline-flex flex-col items-center align-middle mx-2 text-lg"><span class="border-b border-slate-500 pb-1 px-1">$1</span><span class="pt-1 px-1">$2</span></span>')
      .replace(/\\Delta P/g, '<i>ΔP</i>')
      .replace(/_([0-9a-zA-Z]+)/g, '<sub class="text-xs text-slate-400">$1</sub>')
    }} />
  </div>
);

// ============================== FREQUENCY CANVAS ==============================
const AnimatedFrequencyChart = ({ freqHistory, trips, isSimulating, elapsed }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;

    const render = () => {
      const dpxRatio = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpxRatio;
      canvas.height = 360 * dpxRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `360px`;
      
      ctx.save();
      ctx.scale(dpxRatio, dpxRatio);
      
      const w = rect.width, h = 360;
      const padLeft = 40, padBottom = 30, padTop = 20, padRight = 20;
      const plotW = w - padLeft - padRight;
      const plotH = h - padTop - padBottom;
      
      ctx.clearRect(0, 0, w, h);

      // Scale definitions
      const fMin = 47.0, fMax = 50.2;
      const tMax = Math.max(10, elapsed + 1); // Dynamic X axis, min 10s
      
      const getX = (t) => padLeft + (t / tMax) * plotW;
      const getY = (f) => padTop + plotH - ((f - fMin) / (fMax - fMin)) * plotH;

      // Grid & Background
      ctx.fillStyle = 'rgba(15,23,42,0.5)';
      ctx.fillRect(padLeft, padTop, plotW, plotH);

      ctx.strokeStyle = 'rgba(100,116,139,0.15)';
      ctx.lineWidth = 1;
      
      // Vertical Time Grid
      for (let t = 0; t <= tMax; t += 2) {
        ctx.beginPath(); ctx.moveTo(getX(t), padTop); ctx.lineTo(getX(t), padTop + plotH); ctx.stroke();
        ctx.fillStyle = '#64748b'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${t}s`, getX(t), h - 10);
      }

      // Horizontal Freq Grid & Thresholds
      ctx.textAlign = 'right';
      for (let f = fMin; f <= fMax; f += 0.5) {
        ctx.beginPath(); ctx.moveTo(padLeft, getY(f)); ctx.lineTo(w - padRight, getY(f)); ctx.stroke();
        ctx.fillStyle = '#64748b'; ctx.font = '10px monospace';
        ctx.fillText(`${f.toFixed(1)}`, padLeft - 5, getY(f) + 3);
      }

      // Nominal Line
      ctx.strokeStyle = 'rgba(16,185,129,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(padLeft, getY(50.0)); ctx.lineTo(w - padRight, getY(50.0)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#10b981'; ctx.textAlign = 'left';
      ctx.fillText('50.0 Hz (Nominal)', padLeft + 5, getY(50.0) - 5);

      // UFLS Stages lines
      UFLS_STAGES.forEach(stage => {
        ctx.strokeStyle = stage.color + '40'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(padLeft, getY(stage.threshold)); ctx.lineTo(w - padRight, getY(stage.threshold)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = stage.color + '80';
        ctx.fillText(`${stage.label}`, w - padRight - 45, getY(stage.threshold) - 3);
      });

      // Draw Frequency Trajectory
      if (freqHistory.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;

        freqHistory.forEach((pt, i) => {
          const x = getX(pt.t);
          const y = Math.min(Math.max(getY(pt.f), padTop), padTop + plotH); // Clamp to plotting area
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw current head point
        const head = freqHistory[freqHistory.length - 1];
        ctx.beginPath();
        ctx.arc(getX(head.t), Math.min(Math.max(getY(head.f), padTop), padTop + plotH), 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();
      }

      // Draw Trip Markers
      trips.forEach(trip => {
        if (!trip.t || !trip.f) return;
        const x = getX(trip.t);
        const y = Math.min(Math.max(getY(trip.f), padTop), padTop + plotH);
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = trip.color || '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`-${trip.shed}%`, x + 8, y - 8);
      });

      ctx.restore();
      if (isSimulating) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [freqHistory, trips, elapsed, isSimulating]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase bg-slate-900/80 px-2 py-1 rounded">Live Frequency Trajectory</span>
      </div>
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
};

// ============================== SIMULATOR VIEW ==============================
const SimulationView = () => {
  const [genLoss, setGenLoss] = useState(30); // % loss
  const [inertia, setInertia] = useState(4.0); // seconds
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [freq, setFreq] = useState(50.0);
  const [rocof, setRocof] = useState(0);
  const [totalShed, setTotalShed] = useState(0);
  
  const [freqHistory, setFreqHistory] = useState([]);
  const [trips, setTrips] = useState([]);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('STANDBY'); // STANDBY, RUNNING, STABILIZED, COLLAPSED
  
  const timerRef = useRef(null);

  // Math Refs to prevent closure stale states
  const stateRef = useRef({
    f: 50.0,
    shed: 0,
    trippedStages: [],
    stageTimers: {},
    t: 0
  });

  const executeDisturbance = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Initial reset
    stateRef.current = { f: 50.0, shed: 0, trippedStages: [], stageTimers: {}, t: 0 };
    setFreq(50.0); setRocof(0); setTotalShed(0); setElapsed(0);
    setFreqHistory([{ t: 0, f: 50.0 }]);
    setTrips([]);
    setEvents([{ time: 0, msg: `⚡ DISTURBANCE: Sudden loss of ${genLoss}% generation.`, type: 'fault' }]);
    setStatus('RUNNING');
    setIsSimulating(true);

    const dt = 0.05; // 50ms integration step
    const LOAD_DAMPING = 1.5; // 1.5% load reduction per 1% freq drop (natural response)

    timerRef.current = setInterval(() => {
      let { f, shed, trippedStages, stageTimers, t } = stateRef.current;
      t += dt;

      // 1. Calculate Power Imbalance (Swing Equation)
      // Natural damping: Load inherently decreases slightly as frequency drops
      const freqDeviationPercent = ((50.0 - f) / 50.0) * 100;
      const naturalLoadReduction = freqDeviationPercent * LOAD_DAMPING;
      
      const pDeficit = genLoss - shed - naturalLoadReduction;
      
      // 2. Calculate ROCOF (df/dt)
      const currentRocof = -(pDeficit / 100) * (50.0 / (2 * inertia));
      
      // 3. Update Frequency (Euler integration)
      f += currentRocof * dt;

      // Ensure we don't go wildly out of bounds
      if (f > 51) f = 51;
      if (f < 45) f = 45;

      // 4. Evaluate UFLS Relays
      UFLS_STAGES.forEach(stage => {
        if (!trippedStages.includes(stage.id)) {
          // If freq drops below threshold, accumulate time
          if (f <= stage.threshold) {
            stageTimers[stage.id] = (stageTimers[stage.id] || 0) + dt;
            
            // Trip condition met
            if (stageTimers[stage.id] >= stage.delay) {
              trippedStages.push(stage.id);
              shed += stage.loadPercent;
              
              setTrips(prev => [...prev, { stage: stage.id, t: parseFloat(t.toFixed(2)), f: parseFloat(f.toFixed(2)), shed: stage.loadPercent, color: stage.color }]);
              setEvents(prev => [{ time: t, msg: `🔴 ${stage.label} TRIPPED (Freq < ${stage.threshold}Hz for ${stage.delay}s). Shed ${stage.loadPercent}% load.`, type: 'trip' }, ...prev]);
            }
          } else {
            // Reset timer if freq recovers before delay expires
            stageTimers[stage.id] = 0;
          }
        }
      });

      // 5. Check Terminal Conditions
      let stopSim = false;
      if (f <= 47.0) {
        // System Collapse
        setStatus('COLLAPSED');
        setEvents(prev => [{ time: t, msg: `💥 SYSTEM COLLAPSE: Frequency dropped below critical 47.0Hz limit. Generators tripping offline to protect turbines.`, type: 'fatal' }, ...prev]);
        stopSim = true;
      } else if (Math.abs(currentRocof) < 0.005 && t > 3.0 && Math.abs(pDeficit) < 1.0) {
        // Stabilized (Zero ROCOF, deficit resolved)
        setStatus('STABILIZED');
        setEvents(prev => [{ time: t, msg: `✅ GRID STABILIZED at ${f.toFixed(2)}Hz. Imbalance resolved via load shedding and natural damping.`, type: 'info' }, ...prev]);
        stopSim = true;
      } else if (t >= 20.0) {
        // Timeout
        setStatus('STABILIZED');
        stopSim = true;
      }

      // 6. Update State
      stateRef.current = { f, shed, trippedStages, stageTimers, t };
      
      // Batch React updates to prevent excessive rendering lag
      setFreq(f);
      setRocof(currentRocof);
      setTotalShed(shed);
      setElapsed(t);
      setFreqHistory(prev => [...prev, { t, f }]);

      if (stopSim) {
        clearInterval(timerRef.current);
        setIsSimulating(false);
      }
    }, 50);
  };

  const clearSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSimulating(false);
    setStatus('STANDBY');
    setElapsed(0);
    setFreq(50.0);
    setRocof(0);
    setTotalShed(0);
    setFreqHistory([]);
    setTrips([]);
    setEvents([]);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-6 max-w-[1600px] mx-auto">
      
      {/* LEFT COLUMN: Controls & Readings */}
      <div className="lg:col-span-4 space-y-6">
        
        <section>
          <StepBadge step="1" title="Disturbance Setup" />
          <Card className="border-red-900/50">
            <p className="text-sm text-slate-400 mb-6">Define the severity of the generation loss and the physical inertia of the grid.</p>
            <div className="space-y-8">
              <div>
                <ProSlider label="Generation Loss" unit="%" min={5} max={50} step={1} value={genLoss} onChange={e => setGenLoss(+e.target.value)} color="red" />
                <p className="text-xs text-slate-500 mt-2">Defines the initial power deficit (ΔP). Larger deficit = steeper drop.</p>
              </div>
              
              <div>
                <ProSlider label="System Inertia (H)" unit="s" min={1} max={8} step={0.5} value={inertia} onChange={e => setInertia(+e.target.value)} color="blue" />
                <p className="text-xs text-slate-500 mt-2">Higher inertia (heavy turbines) slows the frequency drop. Low inertia (solar/wind) accelerates it.</p>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <StepBadge step="2" title="Live Telemetry" />
          <Card className="border-slate-700/50">
             <div className="space-y-4">
                <div className="flex justify-between items-center p-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400">Frequency (f)</span>
                  <span className={`font-mono text-2xl font-bold ${freq < 48.0 ? 'text-red-500' : freq < 49.5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {freq.toFixed(3)} <span className="text-xs text-slate-500">Hz</span>
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400">ROCOF (df/dt)</span>
                  <span className={`font-mono text-lg font-bold ${Math.abs(rocof) > 0.5 ? 'text-red-500' : 'text-amber-500'}`}>
                    {rocof.toFixed(3)} <span className="text-xs text-slate-500">Hz/s</span>
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400">Total Load Shed</span>
                  <span className="font-mono text-lg font-bold text-slate-100">
                    {totalShed} <span className="text-xs text-slate-500">%</span>
                  </span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-slate-400">Elapsed Time</span>
                  <span className="font-mono text-lg font-bold text-slate-400">
                    {elapsed.toFixed(2)} <span className="text-xs text-slate-500">s</span>
                  </span>
                </div>
             </div>
          </Card>
        </section>

      </div>

      {/* RIGHT COLUMN: Visuals & Analysis */}
      <div className="lg:col-span-8 space-y-6">
        
        <section>
          <StepBadge step="3" title="Protection Response & Analysis" />
          
          <div className="flex flex-wrap gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl mb-6">
            <button 
              onClick={executeDisturbance} 
              disabled={isSimulating} 
              className="flex-1 min-w-[200px] px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSimulating ? <Timer className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5" />}
              {isSimulating ? 'Disturbance Active...' : 'Trip Generator'}
            </button>
            <button onClick={clearSimulation} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-bold transition-all">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              <Card title="Frequency Trajectory" icon={BarChart3} className="border-slate-700/50 h-full">
                <AnimatedFrequencyChart freqHistory={freqHistory} trips={trips} isSimulating={isSimulating} elapsed={elapsed} />
              </Card>
            </div>

            <div className="space-y-6 flex flex-col h-full">
              <Card title="Grid Status" icon={ShieldCheck} className="border-slate-700/50 flex-shrink-0">
                <div className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                  status === 'COLLAPSED' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 
                  status === 'RUNNING' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 
                  status === 'STABILIZED' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' :
                  'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  {status === 'COLLAPSED' && <div className="font-black text-lg flex flex-col items-center gap-2"><ServerCrash className="w-8 h-8" /> SYSTEM COLLAPSE</div>}
                  {status === 'RUNNING' && <div className="font-black text-lg animate-pulse">⚠️ TRANSIENT DECAY</div>}
                  {status === 'STABILIZED' && <div className="font-black text-lg">🟢 STABILIZED</div>}
                  {status === 'STANDBY' && <div className="font-black text-lg">STANDBY</div>}
                </div>
              </Card>

              <Card title="UFLS Stage Relays" icon={Target} className="border-slate-700/50 flex-grow">
                <div className="space-y-2">
                  {UFLS_STAGES.map(stage => {
                    const isTripped = trips.some(t => t.stage === stage.id);
                    return (
                      <div key={stage.id} className={`flex justify-between items-center p-2 rounded border text-xs font-mono ${isTripped ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                        <div className="flex gap-2">
                          <span className="font-bold">{stage.label}</span>
                          <span>({stage.threshold}Hz)</span>
                        </div>
                        <div>{isTripped ? 'TRIPPED' : 'ARMED'}</div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {(status === 'STABILIZED' || status === 'COLLAPSED' || isSimulating) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Card title="Expert Physical Analysis" icon={Info} className="border-red-900/30 bg-red-950/10">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-red-500/20 rounded-xl text-red-400 shrink-0 mt-1">
                      <Cpu className="w-8 h-8" />
                    </div>
                    <div className="space-y-3 w-full">
                      <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest border-b border-red-500/20 pb-2">Swing Equation Diagnostics</h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <div className="text-xs text-slate-500 mb-1">Initial Power Deficit (ΔP)</div>
                          <div className="font-mono font-bold text-white">{genLoss}%</div>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <div className="text-xs text-slate-500 mb-1">Initial ROCOF</div>
                          <div className="font-mono font-bold text-white">{-((genLoss / 100) * (50.0 / (2 * inertia))).toFixed(3)} Hz/s</div>
                        </div>
                      </div>

                      <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
                        <li>The system experienced a sudden loss of <strong>{genLoss}%</strong> generation with an inertia constant of <strong>{inertia}s</strong>.</li>
                        <li>This created an initial plunging ROCOF of <strong>{-((genLoss / 100) * (50.0 / (2 * inertia))).toFixed(3)} Hz/s</strong>.</li>
                        
                        {totalShed > 0 && (
                          <li className="text-amber-400">
                            UFLS relays intercepted the drop, successfully shedding <strong>{totalShed}%</strong> of total system load.
                          </li>
                        )}

                        {status === 'STABILIZED' && (
                          <li className="text-emerald-400 font-bold">
                            By shedding {totalShed}% load (and aided by natural load damping), the deficit was resolved. Frequency settled at {freq.toFixed(2)}Hz.
                          </li>
                        )}
                        
                        {status === 'COLLAPSED' && (
                          <li className="text-red-400 font-bold">
                            UFLS was insufficient or too slow. The frequency breached the fatal 47.0Hz threshold, triggering generator under-speed mechanical protections and causing a total blackout.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

        </section>

      </div>
    </motion.div>
  );
};

// ============================== THEORY & QUIZ VIEWS ==============================
const TheoryView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
    <div className="text-center space-y-4 mb-12">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">
        Frequency Protection Theory
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto">Master the dynamics of grid inertia, ROCOF, and the life-saving logic behind Under-Frequency Load Shedding (UFLS).</p>
    </div>

    {THEORY_CONTENT.map((section) => {
      const SectionIcon = section.icon;
      return (
        <Card key={section.id} className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-colors duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
              <SectionIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">{section.title}</h2>
          </div>
          
          <div className="space-y-5 text-slate-300 leading-relaxed text-lg">
            {section.content.map((block, bIdx) => {
              if (block.type === 'text') return <p key={bIdx}>{block.value}</p>;
              if (block.type === 'formula') return <MathFormula key={bIdx} latex={block.value} />;
              if (block.type === 'list') return (
                <ul key={bIdx} className="space-y-3 pl-6">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <CheckCircle2 className="w-6 h-6 text-red-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
              return null;
            })}
          </div>
        </Card>
      );
    })}
  </motion.div>
);

const QuizView = () => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === QUIZ_DATA[current].ans) setScore(s => s + 1);
    setTimeout(() => {
      if (current === QUIZ_DATA.length - 1) setIsFinished(true);
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 3000);
  };

  const restart = () => { setCurrent(0); setScore(0); setSelected(null); setIsFinished(false); };

  if (isFinished) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto mt-20 p-8 text-center bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <Award className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-100 mb-2">Assessment Complete!</h2>
        <p className="text-slate-400 mb-8 text-lg">You scored {score} out of {QUIZ_DATA.length}</p>
        <button onClick={restart} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-red-500/20">Restart Assessment</button>
      </motion.div>
    );
  }

  const q = QUIZ_DATA[current];

  return (
    <motion.div key={current} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="max-w-2xl mx-auto mt-12 p-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {QUIZ_DATA.map((_, i) => <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i < current ? 'bg-red-500' : i === current ? 'bg-slate-400 animate-pulse' : 'bg-slate-800'}`} />)}
        </div>
        <span className="text-red-500 font-bold font-mono">Score: {score}</span>
      </div>

      <Card>
        <h3 className="text-2xl font-bold text-slate-100 mb-8 leading-tight">{q.q}</h3>
        <div className="space-y-3">
          {q.opts.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.ans;
            let btnClass = "bg-slate-800 border-slate-700 hover:border-red-500 hover:bg-slate-800/80 text-slate-300";
            if (selected !== null) {
              if (isCorrect) btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
              else if (isSelected) btnClass = "bg-red-500/20 border-red-500 text-red-400";
              else btnClass = "bg-slate-900 border-slate-800 text-slate-600 opacity-50";
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null} className={`w-full text-left p-5 rounded-xl border-2 font-semibold transition-all duration-300 ${btnClass} flex justify-between items-center`}>
                <span>{opt}</span>
                {selected !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {selected !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            )
          })}
        </div>

        <AnimatePresence>
          {selected !== null && (
            <motion.div key="explanation" initial={{ opacity: 0, height: 0, mt: 0 }} animate={{ opacity: 1, height: 'auto', mt: 24 }} className={`p-4 rounded-xl border ${selected === q.ans ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <div className="flex gap-3">
                <Info className={`w-5 h-5 shrink-0 ${selected === q.ans ? 'text-emerald-400' : 'text-amber-400'}`} />
                <p className="text-sm text-slate-300"><strong>Explanation:</strong> {q.why}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// ============================== MAIN APP COMPONENT ==============================
export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');

  const navItems = [
    { id: 'simulator', label: 'UFLS Simulator', icon: MonitorPlay },
    { id: 'theory', label: 'Swing Equation Theory', icon: BookOpen },
    { id: 'quiz', label: 'Knowledge Check', icon: Award }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-200 selection:bg-red-500/30">
      
      {/* HEADER */}
      <header className="h-16 md:h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-red-500 to-orange-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-red-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl md:text-2xl tracking-tight text-white flex items-center gap-2">
              Freq<span className="text-red-500">Guard</span> <span className="text-slate-600 font-normal">|</span> <span className="text-slate-400 text-lg">Protection Suite</span>
            </h1>
            <div className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-orange-400">
              IEEE C37.117 / ANSI 81U Load Shedding Engine
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
          {navItems.map(t => {
            const isActive = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button 
                key={t.id} onClick={() => setActiveTab(t.id)} 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 relative ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                {isActive && <motion.div layoutId="nav-pill" className="absolute inset-0 bg-slate-800 rounded-lg shadow-md border border-slate-700" />}
                <span className="relative z-10 flex items-center gap-2"><Icon className="w-4 h-4" /> {t.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' && <motion.div key="sim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SimulationView /></motion.div>}
          {activeTab === 'theory' && <motion.div key="theory" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><TheoryView /></motion.div>}
          {activeTab === 'quiz' && <motion.div key="quiz" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><QuizView /></motion.div>}
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-950 border-t border-slate-800 z-50 flex justify-around items-center px-2 pb-safe">
        {navItems.map(t => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button 
              key={t.id} onClick={() => setActiveTab(t.id)} 
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${isActive ? 'text-red-400' : 'text-slate-500'}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-red-400/20' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
            </button>
          )
        })}
      </div>

    </div>
  );
}