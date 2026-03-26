import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RotateCcw, HelpCircle, BookOpen, Settings, MonitorPlay, 
  GraduationCap, Award, Zap, AlertTriangle, Activity, 
  ShieldCheck, Share2, Compass, CheckCircle2, XCircle, 
  Play, Info, Cpu, Network, Target, Timer, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================== CORE MATH & CONSTANTS ==============================
const SYS_KV = 69;
const V_LN = (SYS_KV * 1000) / Math.sqrt(3);
const Z1 = 2.0; // Positive sequence impedance
const Z2 = 2.0; // Negative sequence impedance
const Z0_LINE = 6.0; // Zero sequence line impedance

const FAULT_TYPES = [
  { id: 'slg', label: 'Single Line-to-Ground (SLG)', phases: [1,0,0], color: '#ef4444', desc: 'Most common (65-80% of faults). Huge 3I₀.' },
  { id: 'dlg', label: 'Double Line-to-Ground (DLG)', phases: [1,1,0], color: '#f59e0b', desc: 'Two phases to ground. Moderate 3I₀.' },
  { id: 'lll', label: 'Three Phase to Ground (LLL)', phases: [1,1,1], color: '#8b5cf6', desc: 'Symmetric fault. Zero 3I₀.' },
];

const GROUNDING_METHODS = [
  { id: 'solid', label: 'Solidly Grounded (Zg = 0Ω)', zg: 0, desc: 'High fault current, easy detection.' },
  { id: 'low_z', label: 'Low-Z Grounded (Zg = 5Ω)', zg: 5, desc: 'Limits fault damage, detectable by 51N.' },
  { id: 'high_z', label: 'High-Z Grounded (Zg = 100Ω)', zg: 100, desc: 'Very low fault current (~10A). Needs SEF.' },
  { id: 'ungrounded', label: 'Ungrounded (Zg = ∞)', zg: 999999, desc: 'No fault current on first fault. Relies on 3V₀.' },
];

const THEORY_CONTENT = [
  { 
    id: 'symmetrical-components', 
    title: 'Symmetrical Components & 3I₀', 
    icon: Network, 
    content: [
      { type: 'text', value: 'Ground faults are unbalanced conditions. To analyze them, engineers use Symmetrical Components, breaking the unbalanced system into Positive, Negative, and Zero sequence networks.' },
      { type: 'formula', value: '3I_0 = I_a + I_b + I_c' },
      { type: 'text', value: 'Under normal, perfectly balanced conditions, the sum of the three phase currents is zero. When a fault to ground occurs, a return path is created through the earth or neutral wire, resulting in a measurable residual current (3I₀).' },
      { type: 'formula', value: 'I_0 = \\frac{V_{LN}}{Z_1 + Z_2 + Z_0}' },
      { type: 'text', value: 'This is the fundamental equation for a Single Line-to-Ground (SLG) fault. Notice that the zero-sequence impedance (Z₀) critically determines the magnitude of the ground fault current.' }
    ]
  },
  { 
    id: 'grounding-impact', 
    title: 'Impact of System Grounding', 
    icon: Activity, 
    content: [
      { type: 'text', value: 'The method used to ground the system neutral (solid, low-resistance, high-resistance, or ungrounded) dictates the protection strategy.' },
      { type: 'formula', value: 'Z_0 = Z_{0(line)} + 3Z_g' },
      { type: 'text', value: 'The grounding impedance (Zg) is multiplied by 3 in the zero-sequence network. Therefore, inserting even a small neutral grounding resistor dramatically reduces the ground fault current, protecting equipment from severe thermal and mechanical stress, but requiring more sensitive relay settings.' }
    ]
  },
  { 
    id: 'directional-67n', 
    title: 'Directional Ground Element (67N)', 
    icon: Compass, 
    content: [
      { type: 'text', value: 'In meshed networks, ground fault current can flow from multiple directions. To prevent relays from tripping for faults behind them (reverse faults), directional elements are used.' },
      { type: 'text', value: 'The 67N element compares the phase angle of the operating current (3I₀) against a polarizing reference. Because zero-sequence voltage (3V₀) peaks during a ground fault and provides a reliable reference angle, it is commonly used for polarization.' },
      { type: 'text', value: 'If the angle between 3I₀ and 3V₀ falls within the forward operating characteristic, the relay is allowed to trip. If it falls in the reverse zone, the trip is blocked.' }
    ]
  }
];

const QUIZ_DATA = [
  { q: "Which fault type produces the highest zero-sequence current in a solidly grounded system?", opts: ["Three-phase", "Line-to-line", "Single line-to-ground", "Open circuit"], ans: 2, why: "SLG faults force current through the zero-sequence network, producing the highest 3I₀ magnitude." },
  { q: "Why is the grounding impedance (Zg) multiplied by 3 in the zero-sequence network?", opts: ["Safety factor", "Because zero-sequence current (I₀) flows in all 3 phases and sums in the neutral (3I₀)", "To account for 3-phase power", "It is an empirical constant"], ans: 1, why: "I₀ flows equally and in-phase through all three conductors. They combine at the neutral, so the neutral impedance Zg experiences a current of 3I₀, making its effective impedance in the per-phase sequence network 3Zg." },
  { q: "ANSI 50N designates:", opts: ["Time overcurrent", "Instantaneous ground overcurrent", "Directional ground", "Differential"], ans: 1, why: "50 = Instantaneous, N = Neutral/Ground. It trips immediately when current exceeds a high threshold." },
  { q: "What happens to the fault current during an SLG fault on a perfectly UNGROUNDED system?", opts: ["It is massive", "It is extremely low (only charging current flows)", "It oscillates", "It trips the transformer"], ans: 1, why: "Without a physical return path to the source neutral, no direct fault current can flow. Only small capacitive charging currents from the healthy phases flow to ground." },
  { q: "The 67N directional element typically uses which quantity for polarization?", opts: ["Positive sequence V", "Zero sequence V (3V₀)", "Phase A current", "Frequency"], ans: 1, why: "3V₀ provides a reliable, universally available reference angle during unbalanced ground faults to determine fault direction." }
];

// ============================== REUSABLE UI COMPONENTS ==============================
const Card = ({ children, className = "", title, icon: Icon, action }: any) => (
  <div className={`bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-800/20">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-amber-500" />}
          <h3 className="font-bold text-slate-100 tracking-wide">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const ProSlider = ({ label, unit, min, max, step, value, onChange, color = "amber" }) => {
  const accentMap = {
    amber: "accent-amber-500",
    red: "accent-red-500",
    blue: "accent-blue-500",
    emerald: "accent-emerald-500",
  };
  return (
    <div className="flex flex-col gap-2">
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
  <div className="flex items-center gap-2 mb-2">
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-black shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
      {step}
    </div>
    <h3 className="text-sm font-bold text-slate-100 tracking-wide uppercase">{title}</h3>
  </div>
);

const MathFormula = ({ latex }) => (
  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 my-4 flex justify-center font-serif text-xl tracking-wider text-amber-100 shadow-inner">
    <span dangerouslySetInnerHTML={{ __html: latex
      .replace(/\\frac{(.*?)}{(.*?)}/g, '<span class="inline-flex flex-col items-center align-middle mx-2 text-lg"><span class="border-b border-slate-500 pb-1 px-1">$1</span><span class="pt-1 px-1">$2</span></span>')
      .replace(/_([0-9a-zA-Z()]+)/g, '<sub class="text-xs text-slate-400">$1</sub>')
    }} />
  </div>
);

// ============================== PHASOR CANVAS ==============================
const AnimatedPhasorCanvas = ({ faultPhases, tripStatus, isRunning }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    // Animation states to smoothly transition magnitudes and angles
    let state = {
      magA: 1.0, magB: 1.0, magC: 1.0,
      mag3I0: 0, mag3V0: 0, v0Angle: 90
    };

    const render = () => {
      // Determine targets based on fault
      const isFaulted = isRunning && faultPhases.some(p => p === 1);
      const isAsymmetric = isFaulted && !faultPhases.every(p => p === 1);
      
      const targetA = (isRunning && faultPhases[0]) ? 0.2 : 1.0;
      const targetB = (isRunning && faultPhases[1]) ? 0.2 : 1.0;
      const targetC = (isRunning && faultPhases[2]) ? 0.2 : 1.0;
      const target3I0 = isAsymmetric ? 0.8 : 0.0;
      const target3V0 = isAsymmetric ? 0.6 : 0.0;
      const targetV0Angle = tripStatus.includes('REVERSE') ? -90 : 90;

      // Smooth interpolation
      state.magA += (targetA - state.magA) * 0.1;
      state.magB += (targetB - state.magB) * 0.1;
      state.magC += (targetC - state.magC) * 0.1;
      state.mag3I0 += (target3I0 - state.mag3I0) * 0.1;
      state.mag3V0 += (target3V0 - state.mag3V0) * 0.1;
      state.v0Angle += (targetV0Angle - state.v0Angle) * 0.1;

      const dpxRatio = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpxRatio;
      canvas.height = 320 * dpxRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `320px`;
      
      ctx.save();
      ctx.scale(dpxRatio, dpxRatio);
      
      const w = rect.width, h = 320;
      const cx = w / 2, cy = h / 2;
      const R = Math.min(cx, cy) * 0.65;

      ctx.clearRect(0, 0, w, h);

      // Draw Polar Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      [0.33, 0.66, 1.0].forEach(r => {
        ctx.beginPath(); ctx.arc(cx, cy, R * r, 0, Math.PI * 2);
        ctx.setLineDash(r === 1.0 ? [] : [4, 4]); ctx.stroke();
      });
      ctx.setLineDash([]);
      
      // Axes
      ctx.beginPath();
      ctx.moveTo(cx - R * 1.2, cy); ctx.lineTo(cx + R * 1.2, cy);
      ctx.moveTo(cx, cy - R * 1.2); ctx.lineTo(cx, cy + R * 1.2);
      ctx.stroke();

      // Helper to draw vectors
      const drawVector = (mag, angleDeg, color, label, isDashed = false) => {
        if (mag < 0.05) return; // Don't draw near-zero vectors
        const rad = (angleDeg * Math.PI) / 180;
        const ex = cx + Math.cos(rad) * R * mag;
        const ey = cy - Math.sin(rad) * R * mag;

        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(ex, ey);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        if (isDashed) ctx.setLineDash([5, 5]);
        
        // Glow if tripping
        if (tripStatus.includes('TRIP') && isDashed) {
           ctx.shadowColor = color; ctx.shadowBlur = 10;
        }
        
        ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur = 0;

        // Arrowhead
        const arrSize = 8;
        const arrAngle = Math.atan2(cy - ey, ex - cx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - arrSize * Math.cos(arrAngle - 0.4), ey + arrSize * Math.sin(arrAngle - 0.4));
        ctx.lineTo(ex - arrSize * Math.cos(arrAngle + 0.4), ey + arrSize * Math.sin(arrAngle + 0.4));
        ctx.fillStyle = color; ctx.fill();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(label, ex + (ex > cx ? 8 : -20), ey + (ey > cy ? 15 : -8));
      };

      // Draw Phase Voltages (V = I * Z, simplifying to represent voltage collapse)
      drawVector(state.magA, 0, '#ef4444', 'Va');    // Red
      drawVector(state.magB, -120, '#22c55e', 'Vb'); // Green
      drawVector(state.magC, 120, '#3b82f6', 'Vc');  // Blue

      // Draw Zero Sequence Components (if present)
      if (state.mag3I0 > 0.1) {
        drawVector(state.mag3I0, -90, '#f59e0b', '3I₀', true); // Amber, lagging
      }
      if (state.mag3V0 > 0.1) {
        drawVector(state.mag3V0, state.v0Angle, '#a855f7', '3V₀', true); // Purple, polarizing
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [faultPhases, tripStatus, isRunning]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase bg-slate-900/80 px-2 py-1 rounded">Live Phasor Scope</span>
      </div>
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
};

// ============================== SIMULATOR VIEW ==============================
const SimulationView = () => {
  const [faultType, setFaultType] = useState(FAULT_TYPES[0]);
  const [grounding, setGrounding] = useState(GROUNDING_METHODS[0]);
  
  const [pickup50N, setPickup50N] = useState(2500); // Amps
  const [pickup51N, setPickup51N] = useState(400);  // Amps
  
  const [directional, setDirectional] = useState(true);
  const [faultLocation, setFaultLocation] = useState('forward');
  
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tripStatus, setTripStatus] = useState('');
  const [mathResults, setMathResults] = useState(null);
  const timerRef = useRef(null);

  // --- CORE MATHEMATICAL ENGINE & LOGIC ---
  const calculateFault = useCallback(() => {
    const Zg = grounding.zg;
    const Z0 = Z0_LINE + 3 * Zg;
    
    let I1 = 0, I2 = 0, I0 = 0, faultI = 0;
    
    // Symmetrical Components Calculation
    if (faultType.id === 'slg') {
        I1 = V_LN / (Z1 + Z2 + Z0);
        I2 = I1;
        I0 = I1;
        faultI = 3 * I0;
    } else if (faultType.id === 'dlg') {
        I1 = V_LN / (Z1 + (Z2 * Z0) / (Z2 + Z0));
        I0 = -I1 * (Z2 / (Z2 + Z0));
        I2 = -I1 * (Z0 / (Z2 + Z0));
        faultI = 3 * I0;
    } else if (faultType.id === 'lll') {
        I1 = V_LN / Z1;
        I0 = 0;
        faultI = I1; // Phase fault current
    }
    
    const residualI = Math.abs(3 * I0);
    const absFaultI = Math.abs(faultI);
    
    return { Z0, I0: Math.abs(I0), residualI, faultI: absFaultI };
  }, [faultType, grounding]);

  const executeTest = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    
    const results = calculateFault();
    setMathResults(results);
    setElapsed(0);
    setTripStatus('');
    setIsRunning(true);

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const nextTime = prev + 0.05;
        evaluateRelayLogic(nextTime, results.residualI);
        return nextTime;
      });
    }, 50);
  };

  const evaluateRelayLogic = (time, residualI) => {
    if (tripStatus) return; // Already tripped/blocked

    const isForward = faultLocation === 'forward';
    const isDirectionalBlocked = directional && !isForward;

    // LLL Fault - No Zero Sequence
    if (residualI < 1 && faultType.id === 'lll' && time > 0.1) {
      setTripStatus('NO 3I₀');
      setIsRunning(false);
      clearInterval(timerRef.current);
      return;
    }

    // 50N Instantaneous Overcurrent Evaluation
    if (time >= 0.05 && residualI >= pickup50N) {
      if (isDirectionalBlocked) setTripStatus('REVERSE BLOCK');
      else setTripStatus('50N TRIP');
      setIsRunning(false);
      clearInterval(timerRef.current);
      return;
    }

    // 51N Time Delayed Evaluation (Simulating 0.5s trip time for demonstration)
    if (time >= 0.5 && residualI >= pickup51N && residualI < pickup50N) {
      if (isDirectionalBlocked) setTripStatus('REVERSE BLOCK');
      else setTripStatus('51N TRIP');
      setIsRunning(false);
      clearInterval(timerRef.current);
      return;
    }

    // Below all pickups - No Trip
    if (time >= 1.0 && residualI < pickup51N) {
      setTripStatus('NO TRIP');
      setIsRunning(false);
      clearInterval(timerRef.current);
    }
  };

  const clearTest = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setElapsed(0);
    setTripStatus('');
    setMathResults(null);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 md:p-6 w-full h-full max-w-[1600px] mx-auto">
      
      {/* LEFT COLUMN: Guided Controls */}
      <div className="xl:col-span-5 flex flex-col gap-4 min-h-0">
        
        <section className="shrink-0 relative">
          <StepBadge step="1" title="Network Configuration" />
          <Card className="border-amber-900/50">
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">System Grounding (Neutral Path)</label>
                <select 
                  value={grounding.id} onChange={e => setGrounding(GROUNDING_METHODS.find(g => g.id === e.target.value) || GROUNDING_METHODS[0])}
                  className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={isRunning}
                >
                  {GROUNDING_METHODS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 pl-1 leading-tight">{grounding.desc}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fault Type</label>
                <select 
                  value={faultType.id} onChange={e => setFaultType(FAULT_TYPES.find(f => f.id === e.target.value) || FAULT_TYPES[0])}
                  className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={isRunning}
                >
                  {FAULT_TYPES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 pl-1 leading-tight">{faultType.desc}</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="flex-1 flex flex-col min-h-0 relative">
          <StepBadge step="2" title="Relay Settings (50N/51N/67N)" />
          <Card className="border-red-900/30 flex-1 overflow-y-auto">
            <div className="space-y-5">
              <ProSlider label="50N Pickup (Inst)" unit="A" min={500} max={10000} step={100} value={pickup50N} onChange={e => setPickup50N(+e.target.value)} color="red" />
              <ProSlider label="51N Pickup (Time)" unit="A" min={50} max={2000} step={50} value={pickup51N} onChange={e => setPickup51N(+e.target.value)} color="amber" />
              
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">67N Directional Control</label>
                  <button 
                    onClick={() => setDirectional(!directional)} disabled={isRunning}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors ${directional ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                  >
                    {directional ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
                
                <div className="flex rounded-lg overflow-hidden border border-slate-700">
                  <button onClick={() => setFaultLocation('forward')} disabled={isRunning} className={`flex-1 py-1.5 text-xs font-bold transition-colors ${faultLocation === 'forward' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>Forward</button>
                  <button onClick={() => setFaultLocation('reverse')} disabled={isRunning} className={`flex-1 py-1.5 text-xs font-bold transition-colors ${faultLocation === 'reverse' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>Reverse</button>
                </div>
              </div>
            </div>
          </Card>
        </section>

      </div>

      {/* RIGHT COLUMN: Execution & Analysis */}
      <div className="xl:col-span-7 flex flex-col gap-4 min-h-0">
        
        <section className="flex flex-col min-h-0 relative">
          <StepBadge step="3" title="Execution & Expert Analysis" />
          
          <div className="flex flex-wrap gap-2 md:gap-4 p-3 md:p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-xl mb-4 shrink-0">
            <button 
              onClick={executeTest} 
              disabled={isRunning} 
              className="flex-1 min-w-[150px] px-4 py-3 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isRunning ? <Timer className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4" />}
              {isRunning ? 'Analyzing Fault...' : 'Inject Fault Conditions'}
            </button>
            <button onClick={clearTest} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg font-bold transition-all">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 shrink-0">
            <Card title="Phasor Scope" icon={Activity} className="border-slate-700/50 min-h-[250px] flex flex-col justify-center">
               <AnimatedPhasorCanvas faultPhases={faultType.phases} tripStatus={tripStatus} isRunning={isRunning || tripStatus !== ''} />
            </Card>

            <Card title="Relay Status" icon={ShieldCheck} className="border-slate-700/50 flex flex-col justify-between">
              <div className="space-y-3 p-1">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Measured Residual (3I₀)</span>
                  <span className="font-mono text-lg font-bold text-amber-400">{mathResults ? mathResults.residualI.toFixed(1) : '0.0'} A</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Timer</span>
                  <span className="font-mono text-lg text-slate-300">{elapsed.toFixed(2)} s</span>
                </div>
                
                <div className={`mt-4 p-3 rounded-lg text-center border-2 transition-all duration-300 ${
                  tripStatus === '50N TRIP' ? 'bg-red-500/10 border-red-500 text-red-500' :
                  tripStatus === '51N TRIP' ? 'bg-amber-500/10 border-amber-500 text-amber-500' :
                  tripStatus === 'REVERSE BLOCK' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
                  tripStatus === 'NO TRIP' || tripStatus === 'NO 3I₀' ? 'bg-slate-800 border-slate-600 text-slate-400' :
                  'bg-slate-900 border-slate-800 text-slate-600'
                }`}>
                  <div className="text-xl font-black mb-1 flex justify-center items-center gap-1">
                    {tripStatus.includes('TRIP') && <AlertTriangle className="w-5 h-5" />}
                    {tripStatus || 'STANDBY'}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Relay Decision</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Expert Analysis Output */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
          <AnimatePresence>
            {mathResults && tripStatus && (
              <motion.div key="analysis" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Card title="Expert Mathematical Analysis" icon={FileText} className="border-blue-900/30 bg-blue-950/10">
                  <div className="space-y-4 text-sm text-slate-300">
                    
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">1. Sequence Network Derivation</h4>
                      <p className="mb-1">System Voltage: <span className="font-mono text-white">V_LN = 69,000 / √3 = 39,837 V</span></p>
                      <p className="mb-1">Zero-Sequence Impedance calculation includes 3x Grounding resistance:</p>
                      <p className="font-mono text-white bg-slate-950 p-2 rounded mt-1 border border-slate-800">
                        Z₀ = Z₀_line + 3(Z_g)<br/>
                        Z₀ = 6.0 + 3({grounding.zg}) = {mathResults.Z0.toFixed(1)} Ω
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">2. Fault Current Calculation ({faultType.id.toUpperCase()})</h4>
                      {faultType.id === 'slg' && (
                        <p className="font-mono text-white">I₀ = V_LN / (Z₁ + Z₂ + Z₀) = 39837 / (2 + 2 + {mathResults.Z0}) = {mathResults.I0.toFixed(1)} A</p>
                      )}
                      {faultType.id === 'lll' && (
                        <p className="font-mono text-white">Balanced Fault. I₀ = 0 A. Only Phase fault current exists ({mathResults.faultI.toFixed(0)}A).</p>
                      )}
                      {faultType.id === 'dlg' && (
                        <p className="font-mono text-white">I₀ derived from parallel sequence networks = {mathResults.I0.toFixed(1)} A</p>
                      )}
                      <p className="mt-2 text-amber-400 font-bold">Residual Current (3I₀) = 3 × {mathResults.I0.toFixed(1)} = {mathResults.residualI.toFixed(1)} A</p>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">3. Relay Logic Interpretation</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {directional && faultLocation === 'reverse' && mathResults.residualI > 0 ? (
                          <li className="text-emerald-400 font-bold">Directional element (67N) detected reverse power flow. ALL TRIPS BLOCKED.</li>
                        ) : (
                          <>
                            {directional && <li className="text-slate-400">Directional element (67N) confirmed forward fault. Proceeding to OC evaluation.</li>}
                            
                            {mathResults.residualI >= pickup50N ? (
                              <li className="text-red-400 font-bold">3I₀ ({mathResults.residualI.toFixed(0)}A) exceeds 50N pickup ({pickup50N}A). ISSUING INSTANTANEOUS TRIP.</li>
                            ) : mathResults.residualI >= pickup51N ? (
                              <li className="text-amber-400 font-bold">3I₀ ({mathResults.residualI.toFixed(0)}A) is below 50N but exceeds 51N pickup ({pickup51N}A). ISSUING TIME-DELAYED TRIP.</li>
                            ) : mathResults.residualI > 0 ? (
                              <li className="text-slate-400">3I₀ ({mathResults.residualI.toFixed(0)}A) is below all pickups. NO TRIP.</li>
                            ) : (
                              <li className="text-slate-400">No zero-sequence current detected. Ground elements bypassed.</li>
                            )}
                          </>
                        )}
                      </ul>
                    </div>

                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </section>

      </div>
    </motion.div>
  );
};

// ============================== THEORY & QUIZ VIEWS ==============================
const TheoryView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
    <div className="text-center space-y-4 mb-12">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500">
        Ground Fault Protection
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto">Master the principles of Symmetrical Components, System Grounding, and 50N/51N/67N protective elements.</p>
    </div>

    {THEORY_CONTENT.map((section) => {
      const SectionIcon = section.icon;
      return (
        <Card key={section.id} className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-colors duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <SectionIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">{section.title}</h2>
          </div>
          
          <div className="space-y-5 text-slate-300 leading-relaxed text-lg">
            {section.content.map((block, bIdx) => {
              if (block.type === 'text') return <p key={bIdx}>{block.value}</p>;
              if (block.type === 'formula') return <MathFormula key={bIdx} latex={block.value} />;
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
        <Award className="w-20 h-20 text-amber-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-100 mb-2">Quiz Complete!</h2>
        <p className="text-slate-400 mb-8 text-lg">You scored {score} out of {QUIZ_DATA.length}</p>
        <button onClick={restart} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-amber-500/20">Try Again</button>
      </motion.div>
    );
  }

  const q = QUIZ_DATA[current];

  return (
    <motion.div key={current} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="max-w-2xl mx-auto mt-12 p-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {QUIZ_DATA.map((_, i) => <div key={i} className={`h-2 w-8 rounded-full ${i < current ? 'bg-amber-500' : i === current ? 'bg-slate-400 animate-pulse' : 'bg-slate-800'}`} />)}
        </div>
        <span className="text-amber-500 font-bold font-mono">Score: {score}</span>
      </div>

      <Card>
        <h3 className="text-2xl font-bold text-slate-100 mb-8 leading-tight">{q.q}</h3>
        <div className="space-y-3">
          {q.opts.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.ans;
            let btnClass = "bg-slate-800 border-slate-700 hover:border-amber-500 hover:bg-slate-800/80 text-slate-300";
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
            <motion.div key="explanation" initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 24 }} className={`p-4 rounded-xl border ${selected === q.ans ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
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
    { id: 'simulator', label: 'Test Bench', icon: MonitorPlay },
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'quiz', label: 'Knowledge Check', icon: Award }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-200 selection:bg-amber-500/30">
      
      {/* HEADER */}
      <header className="h-16 md:h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-amber-400 to-red-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
            <Compass className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="font-black text-xl md:text-2xl tracking-tight text-white flex items-center gap-2">
              Ground<span className="text-amber-500">Fault</span> <span className="text-slate-600 font-normal">|</span> <span className="text-slate-400 text-lg">Simulator</span>
            </h1>
            <div className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-red-400">
              50N / 51N / 67N Relaying Education Engine
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
      <main className="flex-1 overflow-y-auto overflow-x-hidden h-[calc(100vh-5rem)] relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' && <motion.div key="sim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><SimulationView /></motion.div>}
          {activeTab === 'theory' && <motion.div key="theory" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><TheoryView /></motion.div>}
          {activeTab === 'quiz' && <motion.div key="quiz" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><QuizView /></motion.div>}
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
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-500'}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-amber-400/20' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
            </button>
          )
        })}
      </div>

    </div>
  );
}