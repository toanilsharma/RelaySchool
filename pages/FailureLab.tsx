import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  RotateCcw, HelpCircle, BookOpen, Settings, MonitorPlay, 
  Award, Zap, AlertTriangle, Activity, ShieldCheck, 
  Share2, Info, Cpu, BarChart2, TrendingUp, Compass, 
  CheckCircle2, XCircle, FileText, Magnet, Flame, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================== CORE MATH ENGINE (IEEE C37.110 / IEC 61869-2) ==============================
const MathEngine = {
  simulateCT: (params) => {
    const {
      magnitude,    // I_fault (RMS Secondary)
      xOverR,       // System X/R Ratio
      burden,       // Total Loop Impedance (Rb + Rct + Rleads)
      kneePoint,    // Saturation Voltage (Vk or Vsat)
      remFlux,      // Remanence (%)
      cycles = 5,
      samplesPerCycle = 150
    } = params;

    const freq = 50; // Hz
    const omega = 2 * Math.PI * freq;
    const totalSamples = cycles * samplesPerCycle;
    const dt = (1 / freq) / samplesPerCycle;
    const timeConstant = xOverR / omega;

    const FLUX_LIMIT = kneePoint / omega;
    const currentRemanence = (remFlux / 100) * FLUX_LIMIT;

    let flux = currentRemanence;
    const data = [];
    const dcPeak = magnitude * Math.sqrt(2);

    for (let i = 0; i < totalSamples; i++) {
      const t = i * dt;
      // Primary current: AC component + decaying DC offset (worst case full offset)
      const acComponent = magnitude * Math.sqrt(2) * -Math.cos(omega * t);
      const dcComponent = dcPeak * Math.exp(-t / timeConstant);
      const iIdeal = acComponent + dcComponent;

      // Flux integration: dΦ/dt = V = I * R
      const vExcitationRequired = iIdeal * burden;
      flux = flux + (vExcitationRequired * dt);

      let iExcitation = 0;
      const absFlux = Math.abs(flux);

      // Non-linear Magnetization Curve (Simplified piecewise for real-time Web)
      if (absFlux > FLUX_LIMIT) {
        const overFlux = absFlux - FLUX_LIMIT;
        // Sharp knee saturation (high permeability drops rapidly)
        iExcitation = (overFlux * 150) * Math.sign(flux) + (Math.sign(flux) * 0.1); 
      } else {
        // Linear region (very small magnetizing current)
        iExcitation = (absFlux / FLUX_LIMIT) * 0.05 * Math.sign(flux);
      }

      let iActual = iIdeal - iExcitation;

      data.push({
        t: t * 1000, // ms
        iIdeal,
        iActual,
        iExcitation,
        flux,
        fluxLimit: FLUX_LIMIT
      });
    }

    // FFT for Harmonics on the last cycle (steady state saturation)
    const lastCycleStart = totalSamples - samplesPerCycle;
    const lastCycleData = data.slice(lastCycleStart);
    const harmonics = [1, 2, 3, 5, 7].map(h => {
      let sumCos = 0, sumSin = 0;
      lastCycleData.forEach(pt => {
        const angle = omega * h * (pt.t / 1000);
        sumCos += pt.iActual * Math.cos(angle);
        sumSin += pt.iActual * Math.sin(angle);
      });
      const mag = (2 / samplesPerCycle) * Math.sqrt(sumCos ** 2 + sumSin ** 2);
      return { order: h, magnitude: mag };
    });

    return { data, harmonics, maxFlux: FLUX_LIMIT };
  }
};

// ============================== THEORY CONTENT & DIAGRAMS ==============================
const TheorySatDiagram = () => (
  <div className="w-full h-32 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden relative mb-4 flex justify-center items-center">
    <svg viewBox="0 0 400 100" className="w-full h-full opacity-80">
      <path d="M 0 50 Q 50 -20 100 50 T 200 50 T 300 50 T 400 50" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M 0 50 Q 25 10 40 10 L 60 10 Q 75 10 100 50 Q 125 90 140 90 L 160 90 Q 175 90 200 50 Q 225 10 240 10 L 260 10 Q 275 10 300 50 Q 325 90 340 90 L 360 90 Q 375 90 400 50" fill="none" stroke="#ef4444" strokeWidth="3" />
      <line x1="0" y1="50" x2="400" y2="50" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
    <div className="absolute top-2 right-2 text-[10px] font-bold text-red-400 bg-red-950/50 px-2 py-1 rounded">Clipped Waveform</div>
  </div>
);

const TheoryOffsetDiagram = () => (
  <div className="w-full h-32 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden relative mb-4 flex justify-center items-center">
    <svg viewBox="0 0 400 100" className="w-full h-full opacity-80">
      <path d="M 0 90 Q 100 10 400 45" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M 0 90 Q 20 20 40 40 T 100 30 T 160 40 T 220 45 T 280 48 T 340 50 T 400 50" fill="none" stroke="#3b82f6" strokeWidth="3" />
      <line x1="0" y1="80" x2="400" y2="80" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
    <div className="absolute top-2 right-2 text-[10px] font-bold text-amber-400 bg-amber-950/50 px-2 py-1 rounded">DC Offset Decay</div>
  </div>
);

const THEORY_CONTENT = [
  { 
    id: 'ct-saturation', 
    title: 'CT Saturation Fundamentals', 
    icon: Magnet, 
    visual: TheorySatDiagram,
    content: [
      { type: 'text', value: 'A Current Transformer (CT) relies on a magnetic core to transfer current from primary to secondary. When the magnetic flux (Φ) in the core exceeds its physical design limit (the Knee Point), the core saturates.' },
      { type: 'text', value: 'During saturation, the core\'s permeability drops drastically. Instead of transferring power to the secondary circuit, the primary current is entirely consumed as "exciting current" to magnetize the saturated core. The secondary current waveform collapses to zero during portions of the cycle, severely distorting the signal sent to protection relays.' }
    ]
  },
  { 
    id: 'transient-dimensioning', 
    title: 'Transient Dimensioning (IEEE C37.110)', 
    icon: TrendingUp, 
    visual: TheoryOffsetDiagram,
    content: [
      { type: 'text', value: 'Fault currents are not purely AC; they contain a decaying DC offset. This DC component does not alternate, so it continuously drives flux into the core in one direction, vastly accelerating saturation.' },
      { type: 'formula', value: 'K_{td} = 1 + \\frac{X}{R}' },
      { type: 'text', value: 'The Transient Dimensioning Factor (K_td) represents the multiple of AC flux required to accommodate the DC offset without saturating. A system with an X/R ratio of 20 requires a CT 21 times larger than one designed purely for steady-state AC current.' }
    ]
  },
  { 
    id: 'remanence', 
    title: 'The Remanence Effect (K_r)', 
    icon: RotateCcw, 
    content: [
      { type: 'text', value: 'When a fault is cleared, the magnetic flux does not return to zero. Residual flux (Remanence) remains in the core. If a subsequent fault occurs in the same polarity, the core starts partially saturated.' },
      { type: 'formula', value: 'K_r = \\frac{1}{1 - Rem}' },
      { type: 'text', value: 'If a CT has 80% remanence (0.8), the Remanence Factor K_r is 1 / (1 - 0.8) = 5. The CT must be 5 times larger to guarantee it will not saturate on the next fault.' },
      { type: 'text', value: 'Modern solutions include gapped cores (TPY/TPZ class) which force remanence to near zero, heavily used in generator and EHV line differential schemes.' }
    ]
  }
];

// ============================== EXAM DATA ==============================
const EXAM_DATA = [
  { q: "What defines the Knee Point Voltage (Vk) of a protective CT?", opts: ["The voltage where current drops to zero", "A 10% increase in voltage causes a 50% increase in exciting current", "The maximum voltage a relay can handle", "The point where core temperature exceeds limits"], ans: 1, why: "Per standard definitions, the knee point is where the core begins to deeply saturate, marked by a disproportionate (50%) increase in exciting current for a small (10%) voltage rise." },
  { q: "According to IEEE C37.110, the Transient Dimensioning Factor (Ktd) for a fully offset fault is:", opts: ["X/R", "1 + X/R", "(X/R)^2", "1 / (X/R)"], ans: 1, why: "Ktd = 1 + X/R. The '1' accounts for the AC flux, while the 'X/R' accounts for the maximum theoretically possible integrated DC flux." },
  { q: "How does CT saturation primarily affect Distance Relays (ANSI 21)?", opts: ["Causes false instantaneous trips", "Causes them to underreach (measure higher apparent impedance)", "Causes overreach (measure lower apparent impedance)", "It has no effect"], ans: 1, why: "Saturation clips the secondary current. Since Z = V/I, a lower measured 'I' results in a higher calculated 'Z', making the fault appear further away (underreaching)." },
  { q: "If a CT has a remanence of 75%, what is the Remanence Factor (Kr)?", opts: ["1.33", "4.0", "0.25", "7.5"], ans: 1, why: "Kr = 1 / (1 - Rem). So, Kr = 1 / (1 - 0.75) = 1 / 0.25 = 4.0." },
  { q: "What happens if a CT secondary circuit is opened while load current is flowing?", opts: ["Current drops to zero safely", "The relay trips", "Lethal high voltages develop across the secondary terminals", "The primary circuit trips"], ans: 2, why: "An open secondary forces all primary current to become exciting current. This drives the core into deep saturation, inducing massive, lethal voltage spikes (often thousands of volts) on the secondary." },
  { q: "Which harmonic is highly prevalent during severe CT saturation?", opts: ["3rd Harmonic", "5th Harmonic", "All Odd Harmonics (3rd, 5th, 7th)", "2nd Harmonic"], ans: 2, why: "Symmetrical clipping of the waveform generates a spectrum rich in odd harmonics, particularly the 3rd and 5th." },
  { q: "How do Transformer Differential Relays (ANSI 87T) typically prevent misoperation during saturation or inrush?", opts: ["Under-voltage blocking", "2nd Harmonic Restraint", "Timer delays", "Frequency tracking"], ans: 1, why: "Magnetizing inrush and severe offset saturation produce significant 2nd harmonic currents. The relay calculates the I2/I1 ratio to block tripping." },
  { q: "Which power system location typically has the highest X/R ratio?", opts: ["Distribution lines", "Near large generators and step-up transformers", "Long transmission lines", "Capacitor banks"], ans: 1, why: "Generators and massive transformers have extremely high reactance (X) and very low resistance (R), leading to X/R ratios of 40-120, making DC offset decay very slowly." },
  { q: "What is the primary advantage of a TPZ class current transformer?", opts: ["Higher accuracy for metering", "It has air gaps to enforce a remanence of practically zero", "It is cheaper to manufacture", "It outputs a digital signal"], ans: 1, why: "TPZ (and TPY) cores incorporate air gaps. These gaps break the residual magnetic path, ensuring that remanent flux drops to nearly zero when fault current clears." },
  { q: "Which of the following increases the likelihood of CT saturation?", opts: ["Decreasing the fault current", "Decreasing the secondary burden (Rb)", "Increasing the system X/R ratio", "Using a CT with a higher Knee Point"], ans: 2, why: "A higher X/R ratio means the DC offset takes longer to decay, forcing a much larger integrated flux into the core, driving it into saturation." }
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
  const accentMap = { red: "accent-red-500", blue: "accent-blue-500", amber: "accent-amber-500", purple: "accent-purple-500", pink: "accent-pink-500" };
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-end">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-slate-100 font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 shadow-inner">
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
      .replace(/_([0-9a-zA-Z{}]+)/g, '<sub class="text-xs text-slate-400">$1</sub>')
    }} />
  </div>
);

// ============================== SVG VISUALIZERS ==============================
const WaveformVisualizer = ({ data }) => {
  if (!data || data.length === 0) return null;
  const width = 800; const height = 350;
  const padding = 40; const innerH = height - padding * 2; const midY = height / 2;
  const maxCurrent = Math.max(...data.map(d => Math.abs(d.iIdeal))) * 1.1;
  const scaleY = (innerH / 2) / (maxCurrent || 1);
  const scaleX = (width - padding * 2) / data[data.length - 1].t;

  const buildPath = (key) => data.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${padding + pt.t * scaleX} ${midY - (pt[key] * scaleY)}`).join(' ');

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full relative z-10" preserveAspectRatio="none">
        <line x1={padding} y1={midY} x2={width - padding} y2={midY} stroke="#334155" strokeWidth="1" strokeDasharray="5,5" />
        <path d={buildPath('iIdeal')} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" opacity="0.4" strokeDasharray="4,4" />
        <path d={buildPath('iActual')} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))' }} />
      </svg>
      <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-xl text-xs shadow-2xl">
        <div className="flex items-center gap-2 mb-2"><div className="w-4 h-0.5 border-t-2 border-dashed border-blue-500"></div><span className="text-slate-300 font-bold">Primary (Scaled)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-1 bg-red-500 rounded-full shadow-[0_0_5px_#ef4444]"></div><span className="text-white font-bold">Secondary Output</span></div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono tracking-widest uppercase">Time (ms)</div>
    </div>
  );
};

const HarmonicsVisualizer = ({ harmonics }) => {
  if (!harmonics || harmonics.length === 0) return null;
  const maxMag = Math.max(...harmonics.map(h => h.magnitude), 1);
  const fundamental = harmonics.find(h => h.order === 1)?.magnitude || 1;

  return (
    <div className="h-full w-full flex flex-col justify-center items-center p-6 bg-slate-950 rounded-xl border border-slate-800 shadow-inner relative">
      <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">FFT Spectrum Analysis</div>
      <div className="flex items-end justify-center gap-4 sm:gap-8 h-64 w-full max-w-2xl border-b border-slate-700 pb-0 mt-8">
        {harmonics.map((h, idx) => {
          const heightPct = Math.max((h.magnitude / maxMag) * 100, 1);
          const thdPct = (h.magnitude / fundamental) * 100;
          return (
            <div key={h.order} className="flex-1 flex flex-col items-center group relative max-w-[60px]">
              <div className="mb-2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12">
                <span className="text-xs font-mono font-bold text-white">{h.magnitude.toFixed(1)}A</span>
                {h.order !== 1 && <span className="text-[10px] text-amber-400 font-bold">{thdPct.toFixed(1)}%</span>}
              </div>
              <motion.div initial={{ height: 0 }} animate={{ height: `${heightPct}%` }} transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`w-full rounded-t-lg shadow-lg ${h.order === 1 ? 'bg-blue-500 shadow-blue-500/20' : h.order % 2 === 0 ? 'bg-rose-500 shadow-rose-500/20' : 'bg-amber-500 shadow-amber-500/20'}`} />
              <div className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">{h.order === 1 ? 'Fund' : `${h.order}th`}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BHLoopVisualizer = ({ data, fluxLimit }) => {
  if (!data || data.length === 0) return null;
  const size = 300; const padding = 20; const mid = size / 2;
  const maxIexc = Math.max(...data.map(d => Math.abs(d.iExcitation)), 1);
  const scaleI = (mid - padding) / maxIexc;
  const scaleFlux = (mid - padding) / (fluxLimit * 1.5);
  const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${mid + (d.iExcitation * scaleI)} ${mid - (d.flux * scaleFlux)}`).join(' ');

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-950 rounded-xl border border-slate-800 shadow-inner relative p-4">
      <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Magnetic Hysteresis (B-H)</div>
      <div className="relative w-full max-w-[300px] aspect-square bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-700"></div>
        <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-700"></div>
        <div className="absolute left-0 right-0 h-px border-t border-dashed border-red-500/30" style={{ top: mid - (fluxLimit * scaleFlux) }}></div>
        <div className="absolute left-0 right-0 h-px border-t border-dashed border-red-500/30" style={{ top: mid + (fluxLimit * scaleFlux) }}></div>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible absolute inset-0 z-10">
          <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))' }} />
          <text x={size - 30} y={mid - 10} fill="#64748b" fontSize="12" fontWeight="bold">I_exc</text>
          <text x={mid + 10} y={20} fill="#64748b" fontSize="12" fontWeight="bold">Flux (Φ)</text>
        </svg>
      </div>
    </div>
  );
};

// ============================== MAIN SIMULATOR VIEW ==============================
const SimulationView = () => {
  const [magnitude, setMagnitude] = useState(30); 
  const [burden, setBurden] = useState(2.0); 
  const [kneePoint, setKneePoint] = useState(150); 
  const [xOverR, setXOverR] = useState(15);
  const [remFlux, setRemFlux] = useState(0); 

  const [simData, setSimData] = useState({ data: [], harmonics: [], maxFlux: 1 });
  const [stats, setStats] = useState({ ks: 0, ktd: 0, required: 0, status: 'PASS' });
  const [activeView, setActiveView] = useState('WAVEFORM');

  const handleReset = () => {
    setMagnitude(20); setBurden(1.0); setKneePoint(400); setXOverR(10); setRemFlux(0);
  };

  useEffect(() => {
    const result = MathEngine.simulateCT({ magnitude, burden, kneePoint, xOverR, remFlux });
    setSimData(result);

    const V_burden = magnitude * burden;
    const Ks = kneePoint / V_burden; 
    
    const Kr = remFlux >= 95 ? 20 : 1 / (1 - (remFlux / 100));
    const Ktd_offset = 1 + xOverR;
    const DimensioningRequired = Ktd_offset * Kr;

    const isSaturated = Ks < DimensioningRequired;
    const isMarginal = Ks >= DimensioningRequired && Ks < (DimensioningRequired * 1.5);

    setStats({
      ks: Ks.toFixed(1), ktd: Ktd_offset.toFixed(1), kr: Kr.toFixed(1), required: DimensioningRequired.toFixed(1),
      status: isSaturated ? 'FAIL' : isMarginal ? 'WARN' : 'PASS'
    });
  }, [magnitude, burden, kneePoint, xOverR, remFlux]);

  let analysisText = [];
  if (stats.status === 'PASS') {
    analysisText = [
      "CT is operating in the linear region. The secondary waveform perfectly replicates the primary fault current.",
      "Protection Relays (Distance 21, Differential 87) will operate securely and accurately.",
      `Margin is excellent. Required multiple is ${stats.required}, and the CT provides ${stats.ks}.`
    ];
  } else {
    analysisText = [
      "Deep CT Saturation detected. The core flux has exceeded the knee point, causing the magnetic permeability to collapse.",
      "The secondary current is severely clipped. Distance Relays (21) will see a false high impedance and may underreach (fail to trip for a remote fault).",
      "Differential Relays (87) may see false differential current and misoperate. However, the presence of high 2nd Harmonic current (see FFT tab) can be used to block the false trip."
    ];
    if (remFlux > 0) analysisText.push(`Note: The remanence flux of ${remFlux}% heavily contributed to early saturation by reducing the available flux swing margin.`);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="lg:col-span-4 space-y-6">
        <section>
          <StepBadge step="1" title="CT & Grid Parameters" />
          <Card className="border-blue-900/40">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Presets</span>
              <div className="flex gap-2">
                <button onClick={() => { setMagnitude(100); setBurden(5); setXOverR(30); setKneePoint(200); setRemFlux(60); }} className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-[10px] font-bold transition-colors">WORST CASE</button>
                <button onClick={handleReset} className="px-3 py-1 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded text-[10px] font-bold transition-colors flex items-center gap-1"><RotateCcw className="w-3 h-3"/> RESET</button>
              </div>
            </div>
            <div className="space-y-6">
              <ProSlider label="CT Knee Point (Vk)" unit="V" min={50} max={1000} step={10} value={kneePoint} onChange={e => setKneePoint(+e.target.value)} color="blue" />
              <ProSlider label="Fault Current (I_sec)" unit="A" min={5} max={150} step={1} value={magnitude} onChange={e => setMagnitude(+e.target.value)} color="red" />
              <ProSlider label="Total Burden (Rb)" unit="Ω" min={0.1} max={10} step={0.1} value={burden} onChange={e => setBurden(+e.target.value)} color="amber" />
              <ProSlider label="System X/R Ratio" unit="" min={1} max={100} step={1} value={xOverR} onChange={e => setXOverR(+e.target.value)} color="purple" />
              <ProSlider label="Remanence Flux" unit="%" min={0} max={90} step={5} value={remFlux} onChange={e => setRemFlux(+e.target.value)} color="pink" />
            </div>
          </Card>
        </section>

        <section>
          <StepBadge step="2" title="IEEE C37.110 Compliance" />
          <Card className="border-slate-700/50">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Supplied Capability (Ks)</div>
                <div className="text-2xl font-mono font-bold text-blue-400">{stats.ks}</div>
                <div className="text-[10px] text-slate-500 mt-1">Vk / (I_fault × Rb)</div>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Required Margin</div>
                <div className="text-2xl font-mono font-bold text-purple-400">{stats.required}</div>
                <div className="text-[10px] text-slate-500 mt-1">(1 + X/R) × Kr</div>
              </div>
            </div>
            <motion.div layout className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-colors ${stats.status === 'PASS' ? 'bg-emerald-500/10 border-emerald-500/30' : stats.status === 'WARN' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/50'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stats.status === 'PASS' ? 'bg-emerald-500 text-white' : stats.status === 'WARN' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}>
                {stats.status === 'PASS' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <div className={`text-lg font-black tracking-widest uppercase ${stats.status === 'PASS' ? 'text-emerald-400' : stats.status === 'WARN' ? 'text-amber-400' : 'text-red-400'}`}>
                  {stats.status === 'PASS' ? 'COMPLIANT' : stats.status === 'WARN' ? 'MARGINAL' : 'SATURATION'}
                </div>
                <div className="text-xs text-slate-400 font-medium leading-tight">
                  {stats.status === 'PASS' ? 'CT will not saturate under full DC offset.' : 'CT lacks dimensioning margin. Distortion expected.'}
                </div>
              </div>
            </motion.div>
          </Card>
        </section>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <section>
          <StepBadge step="3" title="Advanced Visual Analytics" />
          <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-1.5 shadow-2xl flex flex-col h-[500px] mb-6">
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-t-xl mx-1 mt-1">
              {[
                { id: 'WAVEFORM', label: 'Time Domain', icon: TrendingUp },
                { id: 'HARMONICS', label: 'FFT Spectrum', icon: BarChart2 },
                { id: 'BH_LOOP', label: 'B-H Curve', icon: Compass },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveView(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeView === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                  <tab.icon className="w-4 h-4 hidden sm:block" /> {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 bg-slate-950 rounded-b-xl rounded-t-sm m-1 relative overflow-hidden border border-slate-800">
              <AnimatePresence mode="wait">
                <motion.div key={activeView} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full h-full">
                  {activeView === 'WAVEFORM' && <WaveformVisualizer data={simData.data} />}
                  {activeView === 'HARMONICS' && <HarmonicsVisualizer harmonics={simData.harmonics} />}
                  {activeView === 'BH_LOOP' && <BHLoopVisualizer data={simData.data} fluxLimit={simData.maxFlux} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <Card title="Expert Protection Diagnostics" icon={Cpu} className="border-indigo-900/30 bg-indigo-950/10">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0 mt-1 shadow-[0_0_15px_rgba(99,102,241,0.2)]"><ShieldCheck className="w-8 h-8" /></div>
              <div className="space-y-3 w-full">
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest border-b border-indigo-500/20 pb-2">Impact on Relay Algorithms</h4>
                <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
                  <AnimatePresence>
                    {analysisText.map((txt, i) => (
                      <motion.li key={txt} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={txt.includes('Deep CT Saturation') ? 'text-rose-400 font-bold' : ''}>{txt}</motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </motion.div>
  );
};

// ============================== THEORY VIEW ==============================
const TheoryView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
    <div className="text-center space-y-4 mb-12">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-500">
        CT Failure Analysis
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto">Master the physics of magnetic core saturation, transient DC offset, and their disastrous effects on power system protection.</p>
    </div>

    {THEORY_CONTENT.map((section) => {
      const SectionIcon = section.icon;
      const Visual = section.visual;
      return (
        <Card key={section.id} className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-colors duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400"><SectionIcon className="w-8 h-8" /></div>
            <h2 className="text-2xl font-bold text-slate-100">{section.title}</h2>
          </div>
          {Visual && <Visual />}
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

// ============================== EXAM VIEW ==============================
const ExamView = () => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === EXAM_DATA[current].ans) setScore(s => s + 1);
    setTimeout(() => {
      if (current === EXAM_DATA.length - 1) setIsFinished(true);
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 3000);
  };

  const restart = () => { setCurrent(0); setScore(0); setSelected(null); setIsFinished(false); };

  if (isFinished) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto mt-20 p-8 text-center bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <Award className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-100 mb-2">Exam Complete!</h2>
        <p className="text-slate-400 mb-8 text-lg">You scored {score} out of {EXAM_DATA.length}</p>
        <button onClick={restart} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-red-500/20">Retake Exam</button>
      </motion.div>
    );
  }

  const q = EXAM_DATA[current];

  return (
    <motion.div key={current} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="max-w-2xl mx-auto mt-12 p-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {EXAM_DATA.map((_, i) => <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i < current ? 'bg-red-500' : i === current ? 'bg-slate-400 animate-pulse' : 'bg-slate-800'}`} />)}
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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-200 selection:bg-red-500/30">
      <header className="h-16 md:h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-red-600 to-orange-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-red-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl md:text-2xl tracking-tight text-white flex items-center gap-2">
              GridGuard <span className="text-red-500">LAB</span>
            </h1>
            <div className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-orange-400">
              IEEE C37.110 / CT Transient Simulation
            </div>
          </div>
        </div>

        <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
          {[
            { id: 'simulator', label: 'Failure Lab', icon: MonitorPlay },
            { id: 'theory', label: 'Theory & Physics', icon: BookOpen },
            { id: 'exam', label: 'Certification Exam', icon: Award }
          ].map(t => {
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

      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' && <motion.div key="sim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SimulationView /></motion.div>}
          {activeTab === 'theory' && <motion.div key="theory" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><TheoryView /></motion.div>}
          {activeTab === 'exam' && <motion.div key="exam" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ExamView /></motion.div>}
        </AnimatePresence>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-950 border-t border-slate-800 z-50 flex justify-around items-center px-2 pb-safe">
        {[
          { id: 'simulator', label: 'Lab', icon: MonitorPlay },
          { id: 'theory', label: 'Theory', icon: BookOpen },
          { id: 'exam', label: 'Exam', icon: Award }
        ].map(t => {
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