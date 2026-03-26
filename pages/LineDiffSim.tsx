import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  RotateCcw, HelpCircle, BookOpen, Settings, MonitorPlay, 
  GraduationCap, Award, Zap, AlertTriangle, Activity, 
  ShieldCheck, Share2, Cable, ChevronRight, CheckCircle2,
  XCircle, Info, Cpu, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceDot, Area, AreaChart 
} from 'recharts';

// ============================== CORE 87L ENGINE ==============================
// Perfect IEEE C37.243 / IEC 60255 compliant mathematical engine
const RELAY_MATH = {
  degToRad: (deg) => (deg * Math.PI) / 180,
  radToDeg: (rad) => (rad * 180) / Math.PI,
  
  polarToRect: (mag, angleDeg) => ({
    x: mag * Math.cos(RELAY_MATH.degToRad(angleDeg)),
    y: mag * Math.sin(RELAY_MATH.degToRad(angleDeg))
  }),

  calculateDifferential: (IL, IR, angleL, angleR) => {
    const L = RELAY_MATH.polarToRect(IL, angleL);
    const R = RELAY_MATH.polarToRect(IR, angleR);
    
    // Idiff = | I_L + I_R | (Phasor sum)
    const diffX = L.x + R.x;
    const diffY = L.y + R.y;
    const Idiff = Math.sqrt(diffX ** 2 + diffY ** 2);
    
    // Irestraint = (|I_L| + |I_R|) / 2 (Average restraint method)
    const Irestraint = (IL + IR) / 2;
    
    return { Idiff, Irestraint, diffX, diffY };
  },

  calculateThreshold: (Irestraint, slope1, slope2, breakpoint, minPickup) => {
    let threshold = 0;
    if (Irestraint <= breakpoint) {
      threshold = (slope1 / 100) * Irestraint;
    } else {
      const yAtBreakpoint = (slope1 / 100) * breakpoint;
      threshold = yAtBreakpoint + (slope2 / 100) * (Irestraint - breakpoint);
    }
    return Math.max(minPickup, threshold);
  }
};

// ============================== DATA CONSTANTS ==============================
const THEORY_CONTENT = [
  { 
    id: 'ld-principle', 
    title: 'Kirchhoff & The Differential Principle', 
    icon: Network, 
    content: [
      { type: 'text', value: 'Line differential protection (87L) relies on Kirchhoff\'s Current Law (KCL). The core principle states that the phasor sum of currents entering and leaving a healthy line section must be zero (excluding charging currents).' },
      { type: 'formula', value: '\\vec{I}_{diff} = |\\vec{I}_{Local} + \\vec{I}_{Remote}|' },
      { type: 'text', value: 'Under normal load or external through-fault conditions, currents entering the line equal currents leaving. Therefore, the differential current is theoretically zero. However, when an internal fault occurs, currents feed into the fault from both ends, resulting in a large differential current.' },
      { type: 'formula', value: 'I_{restraint} = \\frac{|\\vec{I}_{Local}| + |\\vec{I}_{Remote}|}{2}' },
      { type: 'text', value: 'The restraint current is calculated to stabilize the relay against measurement errors, CT saturation, and channel asymmetry. It acts as a dynamic biasing signal.' }
    ]
  },
  { 
    id: 'ld-characteristic', 
    title: 'Dual-Slope Percentage Restraint', 
    icon: Activity, 
    content: [
      { type: 'text', value: 'To accommodate practical imperfections like Current Transformer (CT) mismatch and communication channel asymmetry, 87L relays employ a dual-slope percentage restraint characteristic.' },
      { type: 'list', items: [
        'Minimum Pickup (I> min): Prevents operation on line charging current and steady-state noise.',
        'Slope 1 (Typically 20-30%): Applies at lower current levels. Provides sensitive protection for internal faults while tolerating normal CT steady-state errors.',
        'Breakpoint (Typically 2-3 pu): The transition point where CT saturation becomes a risk during heavy external faults.',
        'Slope 2 (Typically 60-80%): Applies at high through-fault currents. Heavily desensitizes the relay to prevent false tripping caused by unequal CT saturation at the local and remote terminals.'
      ]},
      { type: 'text', value: 'The relay issues a TRIP command only when the differential current lies in the operating region above this dual-slope boundary.' }
    ]
  },
  { 
    id: 'ld-comms', 
    title: 'Digital Communication Channel (IEEE C37.243)', 
    icon: Cable, 
    content: [
      { type: 'text', value: 'Unlike distance protection, 87L requires a high-bandwidth, continuous communication link between terminals to exchange sampled analog values (phasing data).' },
      { type: 'text', value: 'According to IEEE C37.243, channel delay compensation is vital. The relay must time-align local and remote samples. If a channel experiences asymmetric delay (transmit time ≠ receive time) greater than what the relay algorithm can handle (often >2-5ms), it can manifest as false differential current.' },
      { type: 'text', value: 'Modern relays use ping-pong algorithms or GPS (IRIG-B/PTP/IEEE 1588) to establish absolute time synchronization, completely eliminating asymmetric delay errors.' }
    ]
  }
];

const PRESETS = [
  { id: 'normal', icon: '✅', label: 'Normal Load', IL: 500, IR: 500, aL: 0, aR: 180, desc: 'Balanced power flow. I_diff is near zero.' },
  { id: 'internal', icon: '⚡', label: 'Internal Fault', IL: 6000, IR: 4500, aL: -45, aR: -45, desc: 'Fault inside zone. Both ends feed fault. Huge I_diff.' },
  { id: 'external', icon: '🔗', label: 'External Fault', IL: 8000, IR: 8000, aL: -60, aR: 120, desc: 'Fault outside zone. Massive through-current, zero I_diff.' },
  { id: 'ct_sat', icon: '🧲', label: 'CT Saturation', IL: 9000, IR: 6500, aL: -45, aR: 155, desc: 'External fault, but remote CT saturates, causing false I_diff. Slope 2 restrains!' },
];

const QUIZ_DATA = [
  { q: "What is the primary ANSI device number for Line Differential Protection?", opts: ["21", "87L", "67", "51"], ans: 1, why: "87 designates Differential Protection, and L specifies it is for a Line." },
  { q: "Why is a dual-slope characteristic used instead of a single slope?", opts: ["To save processing power", "To handle severe CT saturation at high fault currents", "To measure line voltage", "To compensate for line charging current"], ans: 1, why: "Slope 2 (higher slope) provides heavy restraint during massive external faults where unequal CT saturation is likely." },
  { q: "Under ideal normal load conditions, the differential current (Idiff) should be:", opts: ["Equal to the load current", "Double the load current", "Zero", "Equal to the charging current"], ans: 2, why: "Current entering equals current leaving. Their vector sum (Idiff) is zero." },
  { q: "According to IEEE C37.243, what is a major challenge for 87L communication channels?", opts: ["High voltage interference", "Asymmetric channel delay", "Data encryption", "Frequency matching"], ans: 1, why: "Asymmetric delays (Tx time ≠ Rx time) misalign current phasors, creating false differential currents." },
  { q: "If the communication channel fails completely, an 87L relay typically:", opts: ["Trips immediately to be safe", "Switches to backup protection (e.g., Distance/Zone 2)", "Increases Slope 1 to 100%", "Sends an overvoltage trip"], ans: 1, why: "87L is disabled on channel failure. The relay relies on fallback elements like Step Distance (21) or Overcurrent (51)." }
];

// ============================== REUSABLE UI COMPONENTS ==============================
const Card = ({ children, className = "", title, icon: Icon, action }) => (
  <div className={`bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-800/20">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-cyan-400" />}
          <h3 className="font-bold text-slate-100 tracking-wide">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const ProSlider = ({ label, unit, min, max, step, value, onChange, color = "cyan" }) => {
  const accentMap = {
    cyan: "accent-cyan-500",
    emerald: "accent-emerald-500",
    amber: "accent-amber-500",
    red: "accent-red-500",
    purple: "accent-purple-500"
  };
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-slate-100 font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
          {value} <span className="text-slate-500 text-xs">{unit}</span>
        </span>
      </div>
      <input 
        type="range" 
        min={min} max={max} step={step} value={value} onChange={onChange}
        className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${accentMap[color]}`}
      />
    </div>
  );
};

const MathFormula = ({ latex }) => (
  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 my-4 flex justify-center font-serif text-xl tracking-wider text-cyan-100 shadow-inner">
    <span dangerouslySetInnerHTML={{ __html: latex
      .replace(/\\vec{I}/g, '<i>I&#770;</i>')
      .replace(/_{diff}/g, '<sub class="text-xs text-slate-400">diff</sub>')
      .replace(/_{Local}/g, '<sub class="text-xs text-slate-400">Local</sub>')
      .replace(/_{Remote}/g, '<sub class="text-xs text-slate-400">Remote</sub>')
      .replace(/_{restraint}/g, '<sub class="text-xs text-slate-400">restraint</sub>')
      .replace(/\\frac{(.*?)}{(.*?)}/g, '<span class="inline-flex flex-col items-center align-middle mx-2 text-lg"><span class="border-b border-slate-500 pb-1 px-1">$1</span><span class="pt-1 px-1">$2</span></span>')
    }} />
  </div>
);

// --- NEW UI COMPONENT FOR GUIDED STEPS ---
const StepBadge = ({ step, title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-black shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
      {step}
    </div>
    <h3 className="text-xl font-bold text-slate-100 tracking-wide">{title}</h3>
  </div>
);

// ============================== CANVAS PHASOR DIAGRAM ==============================
const PhasorDiagram = ({ IL, IR, angleL, angleR, Idiff, diffX, diffY, tripState }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let currentRenderState = { IL: 0, IR: 0, aL: 0, aR: 0 };
    
    // Smooth animation loop
    const render = () => {
      // Interpolate towards target values for smoothness
      currentRenderState.IL += (IL - currentRenderState.IL) * 0.15;
      currentRenderState.IR += (IR - currentRenderState.IR) * 0.15;
      
      const mathMod = (n, m) => ((n % m) + m) % m;
      const dL = mathMod(angleL - currentRenderState.aL + 180, 360) - 180;
      currentRenderState.aL += dL * 0.15;
      
      const dR = mathMod(angleR - currentRenderState.aR + 180, 360) - 180;
      currentRenderState.aR += dR * 0.15;

      const dpxRatio = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpxRatio;
      canvas.height = 320 * dpxRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `320px`;
      
      ctx.save();
      ctx.scale(dpxRatio, dpxRatio);
      
      const w = rect.width;
      const h = 320;
      const cx = w / 2;
      const cy = h / 2;
      
      // Clear
      ctx.clearRect(0, 0, w, h);
      
      // Draw Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.stroke();

      // Polar Rings
      const maxVal = Math.max(1000, currentRenderState.IL, currentRenderState.IR, Idiff);
      const scale = Math.max(0, Math.min(cx, cy) - 40) / maxVal;

      [0.33, 0.66, 1].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0, maxVal * r * scale), 0, Math.PI * 2);
        ctx.strokeStyle = '#334155';
        ctx.setLineDash(r === 1 ? [] : [4, 4]);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Draw Vector Helper
      const drawVector = (mag, angleDeg, color, label, isResultant = false) => {
        if (mag < 10) return;
        const rad = RELAY_MATH.degToRad(angleDeg);
        const ex = cx + mag * scale * Math.cos(rad);
        const ey = cy - mag * scale * Math.sin(rad); // y axis is inverted in canvas
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = color;
        ctx.lineWidth = isResultant ? 3 : 2;
        if (isResultant && tripState === 'TRIP') {
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Arrow head
        const arrowLen = 12;
        const arrowAngle = 0.4;
        const aRad = Math.atan2(cy - ey, ex - cx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - arrowLen * Math.cos(aRad - arrowAngle), ey + arrowLen * Math.sin(aRad - arrowAngle));
        ctx.lineTo(ex - arrowLen * Math.cos(aRad + arrowAngle), ey + arrowLen * Math.sin(aRad + arrowAngle));
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 12px monospace';
        const lblX = ex + (ex > cx ? 10 : -60);
        const lblY = ey + (ey > cy ? 20 : -10);
        ctx.fillText(`${label}`, lblX, lblY);
        ctx.font = '10px monospace';
        ctx.fillText(`${mag.toFixed(0)}A`, lblX, lblY + 12);
      };

      // Draw Local and Remote Vectors
      drawVector(currentRenderState.IL, currentRenderState.aL, '#06b6d4', 'I_L'); // Cyan
      drawVector(currentRenderState.IR, currentRenderState.aR, '#10b981', 'I_R'); // Emerald
      
      // Draw Differential Vector
      const cL = RELAY_MATH.polarToRect(currentRenderState.IL, currentRenderState.aL);
      const cR = RELAY_MATH.polarToRect(currentRenderState.IR, currentRenderState.aR);
      const cDiffX = cL.x + cR.x;
      const cDiffY = cL.y + cR.y;
      const cDiffMag = Math.sqrt(cDiffX**2 + cDiffY**2);
      const cDiffAngle = RELAY_MATH.radToDeg(Math.atan2(cDiffY, cDiffX));
      
      if (cDiffMag > 100) {
        drawVector(cDiffMag, cDiffAngle, tripState === 'TRIP' ? '#ef4444' : '#f59e0b', 'I_diff', true); // Red or Amber
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [IL, IR, angleL, angleR, Idiff, tripState]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
      <div className="absolute top-3 left-3 z-10 text-xs font-bold tracking-widest text-slate-500 uppercase">
        Live Phasor Plane
      </div>
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
};

// ============================== OPERATING CHARACTERISTIC CHART ==============================
const CharacteristicChart = ({ Irestraint, Idiff, slope1, slope2, breakpoint, minPickup, tripState }) => {
  const chartData = useMemo(() => {
    const data = [];
    const MAX_IR = 10000;
    const STEP = 250;
    
    for (let ir = 0; ir <= MAX_IR; ir += STEP) {
      const threshold = RELAY_MATH.calculateThreshold(ir, slope1, slope2, breakpoint, minPickup);
      data.push({
        Ir: ir,
        Threshold: threshold,
        SafeRegion: threshold // Used for the green fill
      });
    }
    return data;
  }, [slope1, slope2, breakpoint, minPickup]);

  return (
    <div className="w-full h-[320px] bg-slate-950 rounded-xl border border-slate-800 p-2 pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="Ir" 
            stroke="#64748b" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            tickFormatter={(val) => `${val}A`}
            label={{ value: "Restraint Current (I_r)", position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            domain={[0, 10000]}
            label={{ value: "Diff Current (I_d)", angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
            formatter={(value, name) => [`${value.toFixed(0)} A`, name === 'Threshold' ? 'Trip Boundary' : name]}
          />
          
          {/* Trip Region Background Concept: Area chart below the curve is safe, everything above is trip */}
          <Area 
            type="monotone" 
            dataKey="SafeRegion" 
            stroke="none" 
            fill="url(#colorSafe)" 
            isAnimationActive={false}
          />
          
          <Line 
            type="monotone" 
            dataKey="Threshold" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={false}
            isAnimationActive={true}
            animationDuration={300}
          />
          
          {/* Live Operating Point */}
          <ReferenceDot 
            x={Irestraint} 
            y={Idiff} 
            r={6} 
            fill={tripState === 'TRIP' ? '#ef4444' : '#10b981'} 
            stroke="#ffffff"
            strokeWidth={2}
            isFront={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};


// ============================== MAIN VIEWS ==============================

const SimulationView = () => {
  // Line conditions
  const [IL, setIL] = useState(PRESETS[0].IL);
  const [IR, setIR] = useState(PRESETS[0].IR);
  const [angleL, setAngleL] = useState(PRESETS[0].aL);
  const [angleR, setAngleR] = useState(PRESETS[0].aR);
  
  // Relay Settings
  const [slope1, setSlope1] = useState(30);
  const [slope2, setSlope2] = useState(70);
  const [breakpoint, setBreakpoint] = useState(2000);
  const [minPickup, setMinPickup] = useState(200);

  // Math Engine Output
  const { Idiff, Irestraint, diffX, diffY } = RELAY_MATH.calculateDifferential(IL, IR, angleL, angleR);
  const threshold = RELAY_MATH.calculateThreshold(Irestraint, slope1, slope2, breakpoint, minPickup);
  const tripState = Idiff > threshold ? 'TRIP' : 'RESTRAIN';

  const applyPreset = (p) => {
    setIL(p.IL); setIR(p.IR); setAngleL(p.aL); setAngleR(p.aR);
  };

  // Dynamic Expert Analysis Logic
  let analysisText = "";
  if (tripState === 'TRIP') {
    analysisText = `TRIP COMMAND ISSUED: The measured differential current (${Idiff.toFixed(1)}A) exceeds the relay's calculated restraint threshold (${threshold.toFixed(1)}A). The current vectors indicate both ends are feeding a fault inside the protected zone.`;
  } else if (Idiff < minPickup) {
    analysisText = `RESTRAINING (NORMAL): The differential current (${Idiff.toFixed(1)}A) is very low and below the Minimum Pickup setting (${minPickup}A). This indicates normal load flow or an external fault with perfect CTs.`;
  } else {
    const activeSlope = Irestraint > breakpoint ? 'Slope 2' : 'Slope 1';
    analysisText = `RESTRAINING (BLOCKED BY SLOPE): A high differential current of ${Idiff.toFixed(1)}A exists (likely due to CT errors or saturation). However, the high restraint current (${Irestraint.toFixed(1)}A) pushes the trip threshold up to ${threshold.toFixed(1)}A via ${activeSlope}. The relay correctly restrains from a false trip.`;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-6 max-w-[1600px] mx-auto"
    >
      {/* LEFT COLUMN: Guided Controls */}
      <div className="lg:col-span-5 space-y-8">
        
        {/* STEP 1: Scenarios & Line Conditions */}
        <section>
          <StepBadge step="1" title="Set Network Conditions" />
          <Card className="border-cyan-900/50">
            <p className="text-sm text-slate-400 mb-4">Choose a real-world scenario to simulate, or manually adjust the currents entering (Local) and leaving (Remote) the line.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {PRESETS.map(p => (
                <button 
                  key={p.id} onClick={() => applyPreset(p)}
                  className="p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all hover:border-cyan-500 group"
                >
                  <div className="font-bold text-slate-200 text-sm mb-1">{p.icon} {p.label}</div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-300 leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">Local Terminal (Substation A)</h4>
                <ProSlider label="Current Mag" unit="A" min={0} max={10000} step={50} value={IL} onChange={e => setIL(+e.target.value)} color="cyan" />
                <ProSlider label="Phase Angle" unit="°" min={-180} max={180} step={1} value={angleL} onChange={e => setAngleL(+e.target.value)} color="cyan" />
              </div>
              
              <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">Remote Terminal (Substation B)</h4>
                <ProSlider label="Current Mag" unit="A" min={0} max={10000} step={50} value={IR} onChange={e => setIR(+e.target.value)} color="emerald" />
                <ProSlider label="Phase Angle" unit="°" min={-180} max={180} step={1} value={angleR} onChange={e => setAngleR(+e.target.value)} color="emerald" />
              </div>
            </div>
          </Card>
        </section>

        {/* STEP 2: Relay Settings */}
        <section>
          <StepBadge step="2" title="Adjust 87L Relay Settings" />
          <Card className="border-purple-900/30">
            <p className="text-sm text-slate-400 mb-5">Tune the relay's sensitivity. Higher slopes provide more security against false trips during external faults where CTs might struggle.</p>
            <div className="space-y-5">
              <ProSlider label="Min Pickup (I>)" unit="A" min={50} max={1000} step={10} value={minPickup} onChange={e => setMinPickup(+e.target.value)} color="purple" />
              <ProSlider label="Slope 1 (Sensitivity)" unit="%" min={10} max={50} step={1} value={slope1} onChange={e => setSlope1(+e.target.value)} color="amber" />
              <ProSlider label="Slope 2 (Security)" unit="%" min={40} max={100} step={1} value={slope2} onChange={e => setSlope2(+e.target.value)} color="amber" />
              <ProSlider label="Breakpoint" unit="A" min={1000} max={5000} step={100} value={breakpoint} onChange={e => setBreakpoint(+e.target.value)} color="purple" />
            </div>
          </Card>
        </section>

      </div>

      {/* RIGHT COLUMN: Results & Visualizations */}
      <div className="lg:col-span-7 space-y-8">
        
        {/* STEP 3: Live Results */}
        <section>
          <StepBadge step="3" title="Live Results & Analysis" />
          
          <div className="space-y-4">
            {/* Top Status Bar */}
            <motion.div 
              animate={{
                borderColor: tripState === 'TRIP' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)',
                backgroundColor: tripState === 'TRIP' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'
              }}
              className="p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl"
            >
              {tripState === 'TRIP' && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />}
              
              <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg shrink-0 ${tripState === 'TRIP' ? 'bg-red-500 shadow-red-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`}>
                  {tripState === 'TRIP' ? <AlertTriangle className="text-white w-7 h-7" /> : <ShieldCheck className="text-white w-7 h-7" />}
                </div>
                <div>
                  <h2 className={`text-2xl font-black tracking-tight ${tripState === 'TRIP' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {tripState === 'TRIP' ? '87L TRIP OP' : '87L RESTRAIN'}
                  </h2>
                  <p className="text-slate-400 font-mono mt-0.5 text-xs">
                    Current Threshold Limit: {threshold.toFixed(1)}A
                  </p>
                </div>
              </div>

              <div className="flex gap-3 z-10 w-full sm:w-auto justify-between">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 text-center flex-1 sm:min-w-[100px]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Diff Current</div>
                  <div className={`text-xl font-mono font-bold ${tripState === 'TRIP' ? 'text-red-400' : 'text-amber-400'}`}>{Idiff.toFixed(0)}<span className="text-sm text-slate-500">A</span></div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 text-center flex-1 sm:min-w-[100px]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Restraint</div>
                  <div className="text-xl font-mono font-bold text-blue-400">{Irestraint.toFixed(0)}<span className="text-sm text-slate-500">A</span></div>
                </div>
              </div>
            </motion.div>

            {/* Dynamic Expert Analysis Box */}
            <div className={`p-4 rounded-xl border flex gap-3 shadow-lg ${tripState === 'TRIP' ? 'bg-red-950/30 border-red-900/50' : 'bg-emerald-950/30 border-emerald-900/50'}`}>
              <Info className={`w-6 h-6 shrink-0 mt-0.5 ${tripState === 'TRIP' ? 'text-red-400' : 'text-emerald-400'}`} />
              <div>
                <h4 className={`text-sm font-bold mb-1 ${tripState === 'TRIP' ? 'text-red-400' : 'text-emerald-400'}`}>Relay Analysis Engine</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{analysisText}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Diagrams Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card title="Live Phasor Plane" icon={Activity} className="border-slate-700/50">
            <p className="text-xs text-slate-400 mb-4">Visualizes the magnitude and angle of Local (Cyan) and Remote (Green) currents. The Resultant vector (Red/Amber) is the Differential current.</p>
            <PhasorDiagram IL={IL} IR={IR} angleL={angleL} angleR={angleR} Idiff={Idiff} diffX={diffX} diffY={diffY} tripState={tripState} />
          </Card>
          
          <Card title="Operating Characteristic" icon={MonitorPlay} className="border-slate-700/50">
            <p className="text-xs text-slate-400 mb-4">The Live Operating Point (Dot) must cross above the blue threshold boundary (determined by your Slope settings) to issue a TRIP.</p>
            <CharacteristicChart Irestraint={Irestraint} Idiff={Idiff} slope1={slope1} slope2={slope2} breakpoint={breakpoint} minPickup={minPickup} tripState={tripState} />
          </Card>
        </div>

      </div>
    </motion.div>
  );
};

const TheoryView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
    <div className="text-center space-y-4 mb-12">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
        87L Theory Library
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto">Master the principles of line differential protection, compliant with IEEE C37.243 and modern utility standards.</p>
    </div>

    {THEORY_CONTENT.map((section, idx) => (
      <Card key={section.id} className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-colors duration-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            <section.icon className="w-8 h-8" />
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
                    <CheckCircle2 className="w-6 h-6 text-cyan-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
            return null;
          })}
        </div>
      </Card>
    ))}
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
    if (idx === QUIZ_DATA[current].ans) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      if (current === QUIZ_DATA.length - 1) {
        setIsFinished(true);
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
      }
    }, 2500);
  };

  const restart = () => {
    setCurrent(0); setScore(0); setSelected(null); setIsFinished(false);
  };

  if (isFinished) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto mt-20 p-8 text-center bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <Award className="w-20 h-20 text-cyan-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-100 mb-2">Quiz Complete!</h2>
        <p className="text-slate-400 mb-8 text-lg">You scored {score} out of {QUIZ_DATA.length}</p>
        <button onClick={restart} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20">
          Try Again
        </button>
      </motion.div>
    );
  }

  const q = QUIZ_DATA[current];

  return (
    <motion.div key={current} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="max-w-2xl mx-auto mt-12 p-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {QUIZ_DATA.map((_, i) => (
            <div key={i} className={`h-2 w-8 rounded-full ${i < current ? 'bg-cyan-500' : i === current ? 'bg-slate-400 animate-pulse' : 'bg-slate-800'}`} />
          ))}
        </div>
        <span className="text-cyan-500 font-bold font-mono">Score: {score}</span>
      </div>

      <Card>
        <h3 className="text-2xl font-bold text-slate-100 mb-8 leading-tight">{q.q}</h3>
        <div className="space-y-3">
          {q.opts.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.ans;
            
            let btnClass = "bg-slate-800 border-slate-700 hover:border-cyan-500 hover:bg-slate-800/80 text-slate-300";
            if (selected !== null) {
              if (isCorrect) btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
              else if (isSelected) btnClass = "bg-red-500/20 border-red-500 text-red-400";
              else btnClass = "bg-slate-900 border-slate-800 text-slate-600 opacity-50";
            }

            return (
              <button 
                key={i} 
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className={`w-full text-left p-5 rounded-xl border-2 font-semibold transition-all duration-300 ${btnClass} flex justify-between items-center`}
              >
                <span>{opt}</span>
                {selected !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {selected !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            )
          })}
        </div>

        <AnimatePresence>
          {selected !== null && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mt: 0 }} 
              animate={{ opacity: 1, height: 'auto', mt: 24 }}
              className={`p-4 rounded-xl border ${selected === q.ans ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}
            >
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
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'quiz', label: 'Knowledge Check', icon: Award }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-200 selection:bg-cyan-500/30">
      
      {/* HEADER */}
      <header className="h-16 md:h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-cyan-500/20">
            <Cpu className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="font-black text-xl md:text-2xl tracking-tight text-white flex items-center gap-2">
              Diff<span className="text-cyan-500">Pro</span> <span className="text-slate-600 font-normal">|</span> <span className="text-slate-400 text-lg">87L Simulator</span>
            </h1>
            <div className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-emerald-500">
              IEEE C37.243 Compliant Educational Engine
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
                key={t.id} 
                onClick={() => setActiveTab(t.id)} 
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
              key={t.id} 
              onClick={() => setActiveTab(t.id)} 
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-cyan-400/20' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
            </button>
          )
        })}
      </div>

    </div>
  );
}