import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RotateCcw, HelpCircle, BookOpen, Settings, MonitorPlay, 
  Award, Zap, AlertTriangle, Activity, Play, ShieldCheck, 
  Share2, Info, Cpu, BatteryWarning, ArrowDownToLine, Flame,
  CheckCircle2, XCircle, Timer, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================== CONSTANTS & DATA ==============================
const SCENARIOS = [
  { id: 'normal', label: 'Normal Operation', color: 'bg-emerald-600 hover:bg-emerald-500', icon: Activity, desc: 'Stable grid parallel operation.' },
  { id: 'lof', label: 'Loss of Field (ANSI 40)', color: 'bg-red-600 hover:bg-red-500', icon: BatteryWarning, desc: 'Excitation failure. Absorbs massive VARs.' },
  { id: 'reverse', label: 'Reverse Power (ANSI 32)', color: 'bg-amber-600 hover:bg-amber-500', icon: ArrowDownToLine, desc: 'Prime mover trip. Generator motors.' },
  { id: 'neg_seq', label: 'Negative Sequence (ANSI 46)', color: 'bg-purple-600 hover:bg-purple-500', icon: Flame, desc: 'Unbalanced load. Rotor overheating.' },
  { id: 'stator_gnd', label: 'Stator Ground Fault (ANSI 64)', color: 'bg-rose-700 hover:bg-rose-600', icon: Zap, desc: 'Internal insulation breakdown.' },
];

const THEORY_CONTENT = [
  { 
    id: 'capability-curve', 
    title: 'The P-Q Capability Curve', 
    icon: Activity, 
    content: [
      { type: 'text', value: 'The capability curve defines the safe operating limits of a synchronous generator in terms of Active Power (MW, P) and Reactive Power (MVAR, Q).' },
      { type: 'list', items: [
        'Armature Current Limit (Stator Heating): Represented by the large outer semicircle. Operating beyond this overheats the stator windings.',
        'Field Current Limit (Rotor Heating): Represented by the arc on the upper right (lagging/overexcited). Operating beyond this overheats the rotor field windings.',
        'Steady-State Stability Limit (Under-excited): Represented by the boundary on the lower left. Operating too far into the leading region causes the generator to lose synchronism and slip poles.'
      ]}
    ]
  },
  { 
    id: 'loss-of-field', 
    title: 'Loss of Field / Excitation (ANSI 40)', 
    icon: BatteryWarning, 
    content: [
      { type: 'text', value: 'If the DC excitation to the rotor fails, the generator loses its magnetic coupling with the stator. To maintain power output, it begins to draw massive amounts of reactive power (VARs) from the grid, acting as an induction generator.' },
      { type: 'text', value: 'This condition is highly dangerous. It causes severe rotor heating due to induced slip-frequency currents and can depress the local grid voltage. Protection is typically provided by dual-zone mho distance relays looking into the generator.' }
    ]
  },
  { 
    id: 'reverse-power', 
    title: 'Reverse Power / Motoring (ANSI 32)', 
    icon: ArrowDownToLine, 
    content: [
      { type: 'text', value: 'If the prime mover (turbine, engine) fails or is tripped while the generator breaker remains closed, the generator will draw active power (MW) from the grid to maintain synchronous speed. It becomes a synchronous motor.' },
      { type: 'text', value: 'While this doesn\'t immediately harm the generator, it causes severe damage to the prime mover (e.g., turbine blade overheating due to lack of steam flow). The ANSI 32 relay is set very sensitively, often at 1-3% of rated MW.' }
    ]
  },
  { 
    id: 'negative-sequence', 
    title: 'Negative Sequence / Unbalance (ANSI 46)', 
    icon: Flame, 
    content: [
      { type: 'text', value: 'Unbalanced grid loads or open phases create negative-sequence currents in the stator. These currents produce a magnetic field rotating at synchronous speed in the opposite direction of the rotor.' },
      { type: 'formula', value: 'I_2^2 t = K' },
      { type: 'text', value: 'This induces double-frequency (120Hz/100Hz) currents in the rotor body and retaining rings, causing rapid and severe overheating. ANSI 46 relays use an inverse-time characteristic matching the thermal I²t damage curve of the specific machine.' }
    ]
  }
];

const QUIZ_DATA = [
  { q: "ANSI 87G designates which protection function?", opts: ["Bus differential", "Generator differential", "Motor protection", "Transformer differential"], ans: 1, why: "87G is the ANSI code for generator differential protection, which precisely compares current entering and leaving the stator windings." },
  { q: "What happens to the generator during a Loss of Field (ANSI 40) condition?", opts: ["It acts as a capacitor", "It operates as an induction generator (absorbs massive VARs)", "It creates an open circuit", "It creates a short circuit"], ans: 1, why: "Without field excitation, the generator loses synchronism, slips poles, and runs as an induction generator, drawing huge amounts of reactive power from the grid." },
  { q: "Reverse power (ANSI 32) primarily protects the:", opts: ["Stator windings", "Prime Mover (Turbine/Engine)", "Step-up transformer", "Rotor field"], ans: 1, why: "Motoring doesn't inherently harm the generator, but spinning a steam turbine without steam flow causes massive frictional heating and blade damage." },
  { q: "Negative sequence currents (ANSI 46) cause damage primarily to the:", opts: ["Stator core", "Rotor (heating at 2× frequency)", "Grid transformers", "Exciter"], ans: 1, why: "Negative sequence creates a reverse-rotating magnetic field, inducing 120Hz (or 100Hz) currents in the rotor body, causing rapid melting of retaining rings." },
  { q: "The Steady-State Stability Limit on a capability curve represents:", opts: ["Maximum MW output", "Maximum lagging MVAR limit", "The boundary where the generator loses synchronism (under-excited)", "Maximum stator current"], ans: 2, why: "If a generator is severely under-excited (absorbing VARs), its magnetic bond weakens until it can no longer hold the rotor in synchronism with the grid." }
];

// ============================== REUSABLE UI COMPONENTS ==============================
const Card = ({ children, className = "", title, icon: Icon, action }) => (
  <div className={`bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-800/20">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-blue-400" />}
          <h3 className="font-bold text-slate-100 tracking-wide">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const StepBadge = ({ step, title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 font-black shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
      {step}
    </div>
    <h3 className="text-xl font-bold text-slate-100 tracking-wide">{title}</h3>
  </div>
);

const MathFormula = ({ latex }) => (
  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 my-4 flex justify-center font-serif text-xl tracking-wider text-blue-100 shadow-inner">
    <span dangerouslySetInnerHTML={{ __html: latex
      .replace(/\\frac{(.*?)}{(.*?)}/g, '<span class="inline-flex flex-col items-center align-middle mx-2 text-lg"><span class="border-b border-slate-500 pb-1 px-1">$1</span><span class="pt-1 px-1">$2</span></span>')
      .replace(/\^([0-9a-zA-Z()]+)/g, '<sup class="text-xs">$1</sup>')
      .replace(/_([0-9a-zA-Z()]+)/g, '<sub class="text-xs text-slate-400">$1</sub>')
    }} />
  </div>
);

// ============================== P-Q CAPABILITY CANVAS ==============================
const AnimatedCapabilityCurve = ({ mw, mvar, trips, scenario }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let state = { mw: 80, mvar: 30 }; // Starting normal point

    const render = () => {
      // Smooth interpolation towards target
      state.mw += (mw - state.mw) * 0.08;
      state.mvar += (mvar - state.mvar) * 0.08;

      const dpxRatio = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpxRatio;
      canvas.height = 360 * dpxRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `360px`;
      
      ctx.save();
      ctx.scale(dpxRatio, dpxRatio);
      
      const w = rect.width, h = 360;
      const cx = w * 0.45, cy = h * 0.55;
      const scale = Math.min(w, h) * 0.0035;

      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(100,116,139,0.15)';
      ctx.lineWidth = 1;
      for (let p = -120; p <= 140; p += 20) {
        ctx.beginPath(); ctx.moveTo(cx + p * scale, 0); ctx.lineTo(cx + p * scale, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy - p * scale); ctx.lineTo(w, cy - p * scale); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(148,163,184,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('MW (P) →', w - 55, cy - 8);
      ctx.fillText('MVAR (Q) ↑', cx + 8, 16);
      ctx.fillText('Lagging (+)', cx + 8, 28);
      ctx.fillText('Leading (-)', cx + 8, h - 8);
      ctx.fillText('Motoring (-)', 8, cy - 8);

      // --- CAPABILITY LIMITS ---
      // Armature limit (semicircle)
      ctx.beginPath();
      ctx.arc(cx, cy, 100 * scale, -Math.PI * 0.15, Math.PI * 0.85, false);
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(59,130,246,0.05)'; ctx.fill();

      // Field limit (arc on right)
      ctx.beginPath();
      const fieldCx = cx - 30 * scale;
      ctx.arc(fieldCx, cy, 120 * scale, -Math.PI * 0.15, Math.PI * 0.35, false);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke();
      ctx.setLineDash([]);

      // Stability limit (vertical/curved line on left)
      ctx.beginPath();
      ctx.moveTo(cx + 10 * scale, cy - 80 * scale);
      ctx.lineTo(cx + 10 * scale, cy + 50 * scale);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.stroke();
      ctx.setLineDash([]);

      // --- OPERATING POINT ---
      const px = cx + state.mw * scale;
      const py = cy - state.mvar * scale; // Y inverted
      
      const isTripped = trips.length > 0;
      const pointColor = isTripped ? '#ef4444' : '#22c55e';

      // Crosshairs
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(px, cy); ctx.lineTo(px, py);
      ctx.moveTo(cx, py); ctx.lineTo(px, py);
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.setLineDash([]);

      // Point Glow
      ctx.shadowColor = pointColor;
      ctx.shadowBlur = isTripped ? 20 : 10;
      
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = pointColor; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      
      ctx.shadowBlur = 0;

      // Coordinate Label
      ctx.fillStyle = pointColor;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`(${state.mw.toFixed(0)} MW, ${state.mvar.toFixed(0)} MVAR)`, px + 12, py - 12);

      // Legend / Labels
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#3b82f6'; ctx.fillText('Stator/Armature Limit', cx + 60 * scale, cy - 75 * scale);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('Rotor/Field Limit', cx + 60 * scale, cy - 105 * scale);
      ctx.fillStyle = '#ef4444'; ctx.fillText('Stability Limit', cx + 15 * scale, cy - 85 * scale);

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [mw, mvar, trips, scenario]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
      <div className="absolute top-3 left-3 z-10">
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase bg-slate-900/80 px-2 py-1 rounded">Live Capability Scope</span>
      </div>
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
};

// ============================== SIMULATOR VIEW ==============================
const SimulationView = () => {
  const [scenario, setScenario] = useState('normal');
  const [mw, setMw] = useState(80);
  const [mvar, setMvar] = useState(30);
  const [vt, setVt] = useState(1.0);
  const [freq, setFreq] = useState(50);
  const [excitation, setExcitation] = useState(100);
  
  const [events, setEvents] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const applyScenario = useCallback((s) => {
    setScenario(s);
    setTrips([]);
    setEvents([]);
    setElapsed(0);
    setIsSimulating(true);

    // Reset to normal start
    setMw(80); setMvar(30); setVt(1.0); setFreq(50); setExcitation(100);

    if (s === 'normal') {
      setIsSimulating(false);
      setEvents([{ time: 0, msg: '✅ Normal steady-state grid parallel operation.', type: 'info' }]);
      return;
    }

    let step = 0;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      step++;
      const time = step * 0.2;
      setElapsed(time);

      if (s === 'lof') {
        setExcitation(prev => Math.max(0, prev - 12));
        setMvar(prev => Math.max(-70, prev - 12)); // Plummets into leading/absorbing
        setVt(prev => Math.max(0.75, prev - 0.03));
        
        if (step === 2) setEvents(prev => [{ time, msg: '⚠️ Exciter failure. Field current decaying rapidly.', type: 'warn' }, ...prev]);
        if (step >= 9) {
          clearInterval(timerRef.current);
          setIsSimulating(false);
          setTrips(['ANSI 40 - Loss of Field Trip']);
          setEvents(prev => [{ time, msg: '🔴 40 TRIP: Impedance entered Zone 2 Mho characteristic. Generator absorbing dangerous VARs.', type: 'trip' }, ...prev]);
        }
      }
      
      else if (s === 'reverse') {
        setMw(prev => Math.max(-10, prev - 12)); // Plummets into motoring
        if (step === 2) setEvents(prev => [{ time, msg: '⚠️ Turbine Trip (Valve Closed). Generator losing mechanical driving torque.', type: 'warn' }, ...prev]);
        if (step >= 8) {
          clearInterval(timerRef.current);
          setIsSimulating(false);
          setTrips(['ANSI 32 - Reverse Power Trip']);
          setEvents(prev => [{ time, msg: '🔴 32 TRIP: Reverse power exceeds 2% threshold. Generator is motoring, risking turbine damage.', type: 'trip' }, ...prev]);
        }
      }
      
      else if (s === 'neg_seq') {
        setMw(65); setMvar(20); setVt(0.94);
        if (step === 2) setEvents(prev => [{ time, msg: '⚠️ Transmission line open phase. High unbalanced currents detected.', type: 'warn' }, ...prev]);
        if (step === 5) setEvents(prev => [{ time, msg: '🔥 Rotor heating intensifying due to double-frequency induced currents.', type: 'warn' }, ...prev]);
        if (step >= 10) {
          clearInterval(timerRef.current);
          setIsSimulating(false);
          setTrips(['ANSI 46 - Negative Sequence Trip']);
          setEvents(prev => [{ time, msg: '🔴 46 TRIP: Thermal I²t accumulation limit reached. Tripping to prevent rotor melting.', type: 'trip' }, ...prev]);
        }
      }
      
      else if (s === 'stator_gnd') {
        setMw(prev => Math.max(0, prev - 15));
        setMvar(prev => Math.max(0, prev - 5));
        setVt(prev => Math.max(0.2, prev - 0.1));
        if (step === 1) setEvents(prev => [{ time, msg: '⚠️ Stator winding insulation breakdown detected.', type: 'warn' }, ...prev]);
        if (step >= 6) {
          clearInterval(timerRef.current);
          setIsSimulating(false);
          setTrips(['ANSI 87G - Differential Trip', 'ANSI 64 - Stator Ground Trip']);
          setEvents(prev => [{ time, msg: '🔴 87G & 64 TRIP: Massive internal fault current. Instantaneous shutdown initiated.', type: 'trip' }, ...prev]);
        }
      }
    }, 200);
  }, []);

  useEffect(() => {
    // Initial load
    applyScenario('normal');
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, [applyScenario]);

  // Expert Analysis Logic
  let analysisText = [];
  if (scenario === 'normal') {
    analysisText = [
      "Operating securely within limits.",
      "Armature current is safe. Rotor field current is nominal.",
      "Excitation is matching grid requirements."
    ];
  } else if (scenario === 'lof') {
    analysisText = [
      "DC field voltage to the rotor has collapsed.",
      "To maintain the air gap flux, the generator acts as an induction generator, drawing massive magnetization current (VARs) from the grid.",
      "This causes severe stator heating and induces slip-frequency currents in the rotor, leading to rapid thermal damage."
    ];
  } else if (scenario === 'reverse') {
    analysisText = [
      "The prime mover (steam/gas turbine) has failed or been tripped.",
      "Because the generator breaker is still closed, the grid forces the generator to spin at synchronous speed, turning it into a giant synchronous motor.",
      "While electrically fine, the lack of steam/gas flow causes catastrophic frictional overheating in the turbine blades."
    ];
  } else if (scenario === 'neg_seq') {
    analysisText = [
      "An unbalance in the grid (e.g., an open conductor) creates negative sequence currents.",
      "These currents produce a reverse-rotating magnetic field at synchronous speed.",
      "Relative to the spinning rotor, this field cuts the rotor at 2x synchronous speed (120Hz/100Hz), inducing massive eddy currents that can melt the rotor wedges."
    ];
  } else if (scenario === 'stator_gnd') {
    analysisText = [
      "Insulation inside the stator slots has broken down.",
      "Current is bypassing the normal winding path and flowing directly to the grounded core.",
      "The 87G (Differential) detects that Current In ≠ Current Out. The 64 (Ground Overvoltage) detects neutral shifts. Immediate trip is required to prevent an iron fire."
    ];
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-6 max-w-[1600px] mx-auto">
      
      {/* LEFT COLUMN: Controls & Readings */}
      <div className="lg:col-span-4 space-y-6">
        
        <section>
          <StepBadge step="1" title="Inject Fault Scenario" />
          <Card className="border-blue-900/50">
            <p className="text-sm text-slate-400 mb-4">Select a failure mode to observe the generator's dynamic response and protection logic.</p>
            <div className="flex flex-col gap-3">
              {SCENARIOS.map(s => {
                const Icon = s.icon;
                const isActive = scenario === s.id;
                return (
                  <button 
                    key={s.id} 
                    onClick={() => applyScenario(s.id)} 
                    disabled={isSimulating && !isActive}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${isActive ? `${s.color} border-white/20 shadow-lg text-white` : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-blue-500 hover:bg-slate-800'}`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <Icon className="w-5 h-5" /> {s.label}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{s.desc}</div>
                  </button>
                )
              })}
            </div>
          </Card>
        </section>

        <section>
          <StepBadge step="2" title="Live Telemetry" />
          <Card className="border-slate-700/50">
             <div className="space-y-4">
                {[
                  { label: 'Active Power (P)', value: mw.toFixed(1), unit: 'MW', alert: mw < 0 },
                  { label: 'Reactive Power (Q)', value: mvar.toFixed(1), unit: 'MVAR', alert: mvar < -20 },
                  { label: 'Terminal Voltage', value: vt.toFixed(2), unit: 'pu', alert: vt < 0.9 },
                  { label: 'Frequency', value: freq.toFixed(2), unit: 'Hz', alert: false },
                  { label: 'Excitation Field', value: excitation.toFixed(1), unit: '%', alert: excitation < 50 }
                ].map((metric, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 border-b border-slate-800 last:border-0">
                    <span className="text-sm text-slate-400">{metric.label}</span>
                    <span className={`font-mono text-lg font-bold ${metric.alert ? 'text-red-500' : 'text-slate-100'}`}>
                      {metric.value} <span className="text-xs text-slate-500">{metric.unit}</span>
                    </span>
                  </div>
                ))}
             </div>
          </Card>
        </section>

      </div>

      {/* RIGHT COLUMN: Visuals & Analysis */}
      <div className="lg:col-span-8 space-y-6">
        
        <section>
          <StepBadge step="3" title="Dynamic P-Q Capability & Protection Analysis" />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <Card title="P-Q Capability Curve" icon={Activity} className="border-slate-700/50 h-full">
              <AnimatedCapabilityCurve mw={mw} mvar={mvar} trips={trips} scenario={scenario} />
            </Card>

            <div className="space-y-6 flex flex-col h-full">
              <Card title="Relay Protection Status" icon={ShieldCheck} className="border-slate-700/50 flex-shrink-0">
                <div className={`p-5 rounded-xl border-2 text-center transition-all duration-300 ${
                  trips.length > 0 ? 'bg-red-500/10 border-red-500/50' : 
                  isSimulating ? 'bg-amber-500/10 border-amber-500/50' : 
                  'bg-emerald-500/10 border-emerald-500/50'
                }`}>
                  {trips.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-red-500 font-black text-xl flex justify-center items-center gap-2 mb-3">
                        <AlertTriangle className="w-6 h-6 animate-pulse" /> GENERATOR TRIPPED
                      </div>
                      {trips.map((t, i) => <div key={i} className="bg-red-950/50 p-2 rounded text-red-400 font-bold text-sm border border-red-900">{t}</div>)}
                    </div>
                  ) : isSimulating ? (
                    <div className="text-amber-500 font-black text-xl animate-pulse">⚠️ TRANSIENT FAULT EVOLVING</div>
                  ) : (
                    <div className="text-emerald-500 font-black text-xl">🟢 SYSTEM SECURE</div>
                  )}
                </div>
              </Card>

              <Card title="Event Log & Diagnostics" icon={FileText} className="border-slate-700/50 flex-grow">
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {events.map((e, i) => (
                      <motion.div 
                        key={e.msg + i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`text-xs p-3 rounded-lg border ${
                          e.type === 'trip' ? 'border-red-500/30 bg-red-500/10 text-red-100' : 
                          e.type === 'warn' ? 'border-amber-500/20 bg-amber-500/10 text-amber-100' : 
                          'border-blue-500/20 bg-blue-500/10 text-blue-100'
                        }`}
                      >
                        <span className="font-mono opacity-60 mr-2">[{e.time.toFixed(1)}s]</span>
                        <span className="font-bold">{e.msg}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={scenario} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <Card title="Expert Physical Analysis" icon={Info} className="border-indigo-900/30 bg-indigo-950/10">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0 mt-1">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">What is happening to the machine?</h4>
                    <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
                      {analysisText.map((txt, i) => <li key={i}>{txt}</li>)}
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
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
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">
        Generator Protection Theory
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto">Master the ANSI standards and physical phenomena governing synchronous generator safety and operational limits.</p>
    </div>

    {THEORY_CONTENT.map((section) => {
      const SectionIcon = section.icon;
      return (
        <Card key={section.id} className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-colors duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
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
                      <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" />
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
    }, 2500);
  };

  const restart = () => { setCurrent(0); setScore(0); setSelected(null); setIsFinished(false); };

  if (isFinished) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto mt-20 p-8 text-center bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <Award className="w-20 h-20 text-blue-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-100 mb-2">Knowledge Verified!</h2>
        <p className="text-slate-400 mb-8 text-lg">You scored {score} out of {QUIZ_DATA.length}</p>
        <button onClick={restart} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20">Restart Assessment</button>
      </motion.div>
    );
  }

  const q = QUIZ_DATA[current];

  return (
    <motion.div key={current} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="max-w-2xl mx-auto mt-12 p-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {QUIZ_DATA.map((_, i) => <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i < current ? 'bg-blue-500' : i === current ? 'bg-slate-400 animate-pulse' : 'bg-slate-800'}`} />)}
        </div>
        <span className="text-blue-500 font-bold font-mono">Score: {score}</span>
      </div>

      <Card>
        <h3 className="text-2xl font-bold text-slate-100 mb-8 leading-tight">{q.q}</h3>
        <div className="space-y-3">
          {q.opts.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.ans;
            let btnClass = "bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 text-slate-300";
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
    { id: 'simulator', label: 'Simulator', icon: MonitorPlay },
    { id: 'theory', label: 'Theory & Limits', icon: BookOpen },
    { id: 'quiz', label: 'Knowledge Check', icon: Award }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      
      {/* HEADER */}
      <header className="h-16 md:h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-violet-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl md:text-2xl tracking-tight text-white flex items-center gap-2">
              Gen<span className="text-blue-500">Guard</span> <span className="text-slate-600 font-normal">|</span> <span className="text-slate-400 text-lg">Protection Suite</span>
            </h1>
            <div className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-violet-400">
              IEEE C37.102 / ANSI 40, 32, 46, 87G
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
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500'}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-blue-400/20' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
            </button>
          )
        })}
      </div>

    </div>
  );
}