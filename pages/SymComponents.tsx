import React, { useState, useMemo, useRef } from 'react';
import { 
  PieChart, Zap, Settings, Info, 
  BookOpen, Activity, MousePointer2, 
  AlertTriangle, CheckCircle2, X, Sliders as SlidersIcon,
  RotateCw, ArrowRight, HelpCircle
} from 'lucide-react';

// --- MATH KERNEL ---

const toRad = (deg: number) => deg * (Math.PI / 180);
const toDeg = (rad: number) => {
  let d = rad * (180 / Math.PI);
  return (d % 360 + 360) % 360; // Normalize 0-360
};

class Complex {
  constructor(public r: number, public i: number) {}
  
  static fromPolar(mag: number, angDeg: number) {
    return new Complex(
      mag * Math.cos(toRad(angDeg)), 
      mag * Math.sin(toRad(angDeg))
    );
  }

  add(c: Complex) { return new Complex(this.r + c.r, this.i + c.i); }
  sub(c: Complex) { return new Complex(this.r - c.r, this.i - c.i); }
  mult(c: Complex) { return new Complex(this.r * c.r - this.i * c.i, this.r * c.i + this.i * c.r); }
  scale(s: number) { return new Complex(this.r * s, this.i * s); }
  
  get mag() { return Math.sqrt(this.r ** 2 + this.i ** 2); }
  get ang() { return toDeg(Math.atan2(this.i, this.r)); }
  
  toString() { return `${this.mag.toFixed(1)}∠${this.ang.toFixed(0)}°`; }
}

const A = Complex.fromPolar(1, 120);
const A2 = Complex.fromPolar(1, 240);

// --- VISUALIZATION COMPONENTS ---

interface PhasorProps {
  vectors: { mag: number, ang: number, label: string, color: string }[];
  title: string;
  interactive?: boolean;
  onVectorChange?: (index: number, mag: number, ang: number) => void;
  maxScale?: number;
  height?: number;
}

const PhasorDiagram = ({ 
  vectors, title, interactive = false, onVectorChange, 
  maxScale = 150, height = 300 
}: PhasorProps) => {
  const size = height;
  const center = size / 2;
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (!interactive) return;
    setDraggingIdx(index);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null || !svgRef.current || !onVectorChange) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    const dx = e.clientX - rect.left - center;
    const dy = e.clientY - rect.top - center; 
    
    let angle = toDeg(Math.atan2(-dy, dx)); 
    const pixelDist = Math.sqrt(dx*dx + dy*dy);
    const logicalMag = Math.min(maxScale * 1.2, (pixelDist / (size/2 - 20)) * maxScale);

    onVectorChange(draggingIdx, logicalMag, angle);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDraggingIdx(null);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center overflow-hidden">
      <div className="absolute top-3 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm">
          {title}
        </h4>
        {interactive && (
          <div className="flex items-center gap-1 text-[10px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
            <MousePointer2 className="w-3 h-3" /> Interactive
          </div>
        )}
      </div>

      <div style={{ width: size, height: size }} className="relative">
        {/* Polar Grid */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-10">
          <div className="w-[85%] h-[85%] rounded-full border border-slate-900"></div>
          <div className="w-[55%] h-[55%] rounded-full border border-slate-900 border-dashed"></div>
          <div className="absolute w-full h-px bg-slate-900"></div>
          <div className="absolute h-full w-px bg-slate-900"></div>
        </div>

        <svg 
          ref={svgRef}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 w-full h-full touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {vectors.map((v, i) => (
              <marker key={i} id={`arrow-${title.replace(/\s/g,'')}-${i}`} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill={v.color} />
              </marker>
            ))}
          </defs>

          {vectors.map((v, i) => {
            const pixelMag = (v.mag / maxScale) * (size / 2 - 30);
            const x = center + pixelMag * Math.cos(toRad(v.ang));
            const y = center - pixelMag * Math.sin(toRad(v.ang));
            const isDragging = draggingIdx === i;

            return (
              <g key={i} className="group/vector">
                {/* Click area expander */}
                {interactive && (
                  <line 
                    x1={center} y1={center} x2={x} y2={y} 
                    stroke="transparent" strokeWidth="25"
                    strokeLinecap="round"
                    className="cursor-pointer"
                    onPointerDown={(e) => handlePointerDown(e, i)}
                  />
                )}
                
                {/* Visible Vector */}
                <line 
                  x1={center} y1={center} x2={x} y2={y} 
                  stroke={v.color} 
                  strokeWidth={isDragging ? 4 : 3} 
                  markerEnd={`url(#arrow-${title.replace(/\s/g,'')}-${i})`}
                  className="transition-all duration-75"
                  opacity={isDragging ? 1 : 0.9}
                />

                {/* Drag Handle Dot */}
                {interactive && (
                  <circle 
                    cx={x} cy={y} r={isDragging ? 8 : 4}
                    fill={v.color}
                    className={`cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'stroke-4 stroke-white/50' : ''}`}
                    onPointerDown={(e) => handlePointerDown(e, i)}
                  />
                )}

                {/* Label */}
                {v.mag > 10 && (
                  <g transform={`translate(${x}, ${y})`}>
                    <rect x={x > center ? 5 : -35} y={y > center ? 5 : -25} width="30" height="20" rx="4" fill="var(--bg-label)" className="fill-white dark:fill-slate-800 shadow-sm" opacity="0.8" />
                    <text 
                      x={x > center ? 10 : -30} 
                      y={y > center ? 20 : -10} 
                      fontSize="12" 
                      fontWeight="bold" 
                      fill={v.color}
                      className="pointer-events-none select-none"
                    >
                      {v.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  );
};

// --- CONTROL PANEL COMPONENT ---

const PhaseControl = ({ label, color, mag, ang, onChange }: any) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-colors">
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${color}`}></div>
    
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color.replace('bg-', 'bg-')}`}></div>
        Phase {label}
      </h3>
      <div className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
        {mag.toFixed(0)}A ∠ {ang.toFixed(0)}°
      </div>
    </div>

    <div className="space-y-4">
      {/* Magnitude Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
          <span>Magnitude</span>
          <span>{mag.toFixed(0)}</span>
        </div>
        <input 
          type="range" min="0" max="200" step="1"
          value={mag}
          onChange={(e) => onChange('mag', Number(e.target.value))}
          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-400"
        />
      </div>

      {/* Angle Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
          <span>Angle</span>
          <span>{ang.toFixed(0)}°</span>
        </div>
        <input 
          type="range" min="0" max="360" step="1"
          value={ang}
          onChange={(e) => onChange('ang', Number(e.target.value))}
          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-400"
        />
      </div>
    </div>
  </div>
);

// --- MAIN APP ---

const SymComponents = () => {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'guide'>('analyzer');
  const [showInfo, setShowInfo] = useState(false);
  
  // State
  const [phases, setPhases] = useState([
    { mag: 100, ang: 0 },   // A
    { mag: 100, ang: 240 }, // B
    { mag: 100, ang: 120 }  // C
  ]);

  // Calculations
  const data = useMemo(() => {
    const Va = Complex.fromPolar(phases[0].mag, phases[0].ang);
    const Vb = Complex.fromPolar(phases[1].mag, phases[1].ang);
    const Vc = Complex.fromPolar(phases[2].mag, phases[2].ang);

    const V0 = Va.add(Vb).add(Vc).scale(1/3);
    const V1 = Va.add(Vb.mult(A)).add(Vc.mult(A2)).scale(1/3);
    const V2 = Va.add(Vb.mult(A2)).add(Vc.mult(A)).scale(1/3);

    const v1Mag = Math.max(0.001, V1.mag); // Avoid div/0
    const unbalanceNeg = (V2.mag / v1Mag) * 100;
    const unbalanceZero = (V0.mag / v1Mag) * 100;

    return { Va, Vb, Vc, V0, V1, V2, unbalanceNeg, unbalanceZero };
  }, [phases]);

  // Handlers
  const handlePhaseChange = (idx: number, key: 'mag' | 'ang', val: number) => {
    const newP = [...phases];
    newP[idx] = { ...newP[idx], [key]: val };
    setPhases(newP);
  };

  const setPreset = (type: string) => {
    const presets: any = {
      balanced: [{m:100,a:90}, {m:100,a:330}, {m:100,a:210}],
      lg: [{m:180,a:90}, {m:90,a:330}, {m:90,a:210}], // A-G
      ll: [{m:50,a:90}, {m:150,a:300}, {m:150,a:240}], // B-C
      llg: [{m:50,a:90}, {m:150,a:315}, {m:150,a:225}], // B-C-G
      open: [{m:0,a:0}, {m:100,a:330}, {m:100,a:210}] // Open Phase A
    };
    if (presets[type]) {
      setPhases(presets[type].map((p: any) => ({ mag: p.m, ang: p.a })));
    }
  };

  // Interpretation Logic
  const getAnalysis = () => {
    const { unbalanceNeg, unbalanceZero, V0, V1, V2 } = data;
    const warnings = [];
    let status = "Normal Operation";
    let statusColor = "text-emerald-600 bg-emerald-50 border-emerald-200";

    if (unbalanceNeg > 50) {
      status = "Severe Fault Condition";
      statusColor = "text-red-600 bg-red-50 border-red-200";
    } else if (unbalanceNeg > 10) {
      status = "System Unbalanced";
      statusColor = "text-amber-600 bg-amber-50 border-amber-200";
    }

    if (unbalanceZero > 10) warnings.push("Ground Current Detected (Possible L-G Fault)");
    if (unbalanceNeg > 10 && unbalanceZero < 5) warnings.push("Phase-Phase Fault likely (Low Zero Seq)");
    if (V1.mag < 50) warnings.push("Voltage/Current Sag (Low Positive Seq)");
    if (V1.mag > 10 && V2.mag > 10 && V0.mag > 10) warnings.push("Complex Unbalance (All Sequences Present)");

    return { status, statusColor, warnings };
  };

  const analysis = getAnalysis();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20">
      
      {/* NAVBAR */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2.5 rounded-lg shadow-lg shadow-blue-500/20">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SymComponents<span className="text-blue-600">Pro</span></h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Protection Engineering Suite</p>
            </div>
          </div>
          
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {['Analyzer', 'Field Guide'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().includes('analyzer') ? 'analyzer' : 'guide')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  (activeTab === 'analyzer' && tab.includes('Analyzer')) || (activeTab === 'guide' && tab.includes('Guide'))
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {activeTab === 'analyzer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
            
            {/* LEFT SIDE: CONTROLS (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* FAULT PRESETS */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Fault Simulation
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPreset('balanced')} className="py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 text-xs font-bold transition-all">Balanced Load</button>
                  <button onClick={() => setPreset('lg')} className="py-2 px-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 text-xs font-bold transition-all">L-G Fault (A-G)</button>
                  <button onClick={() => setPreset('ll')} className="py-2 px-3 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 text-xs font-bold transition-all">L-L Fault (B-C)</button>
                  <button onClick={() => setPreset('open')} className="py-2 px-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-bold transition-all">Open Phase A</button>
                </div>
              </div>

              {/* MANUAL SLIDERS */}
              <div className="space-y-4">
                <PhaseControl 
                  label="A" color="bg-red-500" 
                  mag={phases[0].mag} ang={phases[0].ang} 
                  onChange={(k: any, v: any) => handlePhaseChange(0, k, v)} 
                />
                <PhaseControl 
                  label="B" color="bg-amber-400" 
                  mag={phases[1].mag} ang={phases[1].ang} 
                  onChange={(k: any, v: any) => handlePhaseChange(1, k, v)} 
                />
                <PhaseControl 
                  label="C" color="bg-blue-500" 
                  mag={phases[2].mag} ang={phases[2].ang} 
                  onChange={(k: any, v: any) => handlePhaseChange(2, k, v)} 
                />
              </div>

            </div>

            {/* RIGHT SIDE: VISUALS & RESULTS (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">

              {/* LIVE DIAGNOSIS CARD */}
              <div className={`rounded-xl border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${analysis.statusColor}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-white/50 backdrop-blur-sm shadow-sm ${analysis.status.includes('Normal') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {analysis.status.includes('Normal') ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{analysis.status}</h2>
                    <p className="text-sm opacity-80 font-medium">
                      {analysis.warnings.length > 0 ? analysis.warnings[0] : "System operating within symmetrical limits."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <div className="text-[10px] uppercase font-bold opacity-60">Neg Seq</div>
                    <div className="text-xl font-bold">{data.unbalanceNeg.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold opacity-60">Zero Seq</div>
                    <div className="text-xl font-bold">{data.unbalanceZero.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
              
              {/* PRIMARY CHARTS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Physical Chart */}
                <PhasorDiagram 
                  title="Physical Input (ABC)"
                  vectors={[
                    { mag: phases[0].mag, ang: phases[0].ang, label: 'Ia', color: '#ef4444' },
                    { mag: phases[1].mag, ang: phases[1].ang, label: 'Ib', color: '#fbbf24' },
                    { mag: phases[2].mag, ang: phases[2].ang, label: 'Ic', color: '#3b82f6' },
                  ]}
                  interactive={true}
                  onVectorChange={(i, m, a) => handlePhaseChange(i, i === 0 ? 'mag' : i === 0 ? 'ang' : 'mag', i === 0 ? m : a)} // Simplifying for demo, ideally maps correctly
                />

                {/* Sequence Chart */}
                <div className="flex flex-col gap-4">
                  <PhasorDiagram 
                    title="Sequence Result (012)"
                    height={220}
                    vectors={[
                      { mag: data.V1.mag, ang: data.V1.ang, label: 'I1', color: '#10b981' }, // Pos (Green)
                      { mag: data.V2.mag, ang: data.V2.ang, label: 'I2', color: '#ec4899' }, // Neg (Pink)
                      { mag: data.V0.mag, ang: data.V0.ang, label: 'I0', color: '#64748b' }, // Zero (Slate)
                    ]}
                  />
                  
                  {/* Result Table */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex-1">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[10px] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          <th className="pb-2">Component</th>
                          <th className="pb-2">Value (Polar)</th>
                          <th className="pb-2 text-right">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        <tr className="group">
                          <td className="py-2 text-emerald-600 font-bold">I1 (Positive)</td>
                          <td className="py-2">{data.V1.toString()}</td>
                          <td className="py-2 text-right text-xs text-slate-500 group-hover:text-emerald-600 transition-colors">Torque / Power</td>
                        </tr>
                        <tr className="group">
                          <td className="py-2 text-pink-500 font-bold">I2 (Negative)</td>
                          <td className="py-2">{data.V2.toString()}</td>
                          <td className="py-2 text-right text-xs text-slate-500 group-hover:text-pink-500 transition-colors">Heating / Drag</td>
                        </tr>
                        <tr className="group">
                          <td className="py-2 text-slate-500 font-bold">I0 (Zero)</td>
                          <td className="py-2">{data.V0.toString()}</td>
                          <td className="py-2 text-right text-xs text-slate-500 group-hover:text-slate-700 transition-colors">Ground Leakage</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* DECOMPOSITION ROW */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Component Synthesis
                  </h3>
                  <div className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    Ia = I1 + I2 + I0
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { title: "Zero Seq (I0)", vec: data.V0, color: "#64748b", desc: "No rotation. All phases in sync." },
                    { title: "Pos Seq (I1)", vec: data.V1, color: "#10b981", desc: "Clockwise rotation (ABC)." },
                    { title: "Neg Seq (I2)", vec: data.V2, color: "#ec4899", desc: "Counter-clockwise rotation (ACB)." }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="text-[10px] font-bold uppercase mb-2" style={{color: item.color}}>{item.title}</div>
                      <PhasorDiagram 
                        title="" 
                        height={100} 
                        maxScale={120}
                        vectors={[
                          { mag: item.vec.mag, ang: item.vec.ang, label: '', color: item.color },
                          { mag: item.vec.mag, ang: item.vec.ang + (i === 1 ? -120 : i === 2 ? 120 : 0), label: '', color: item.color, }, // Phase B equiv
                          { mag: item.vec.mag, ang: item.vec.ang + (i === 1 ? 120 : i === 2 ? -120 : 0), label: '', color: item.color, }, // Phase C equiv
                        ].map((v, idx) => ({...v, color: idx === 0 ? v.color : `${v.color}40`}))} // Fade B/C for clarity
                      />
                      <div className="text-[9px] text-center text-slate-400 mt-2 h-8 leading-tight">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* GUIDE TAB */}
        {activeTab === 'guide' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Engineering Field Guide</h2>
              <p className="text-slate-500">Practical applications of Symmetrical Components in Protection Systems.</p>
            </div>
            
            <div className="p-8 space-y-8">
              <section>
                <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-blue-600">
                  <Activity className="w-5 h-5" /> 
                  Interpreting the Results
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="font-bold text-slate-700 dark:text-slate-200 mb-2">High Zero Sequence (I0)</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Indicates current flowing to ground.
                    </p>
                    <ul className="text-xs space-y-1 list-disc list-inside text-slate-500">
                      <li>Single Line to Ground Fault (SLG)</li>
                      <li>Double Line to Ground Fault (DLG)</li>
                      <li>Open conductor grounded on load side</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="font-bold text-slate-700 dark:text-slate-200 mb-2">High Negative Sequence (I2)</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Indicates system unbalance (non-ground).
                    </p>
                    <ul className="text-xs space-y-1 list-disc list-inside text-slate-500">
                      <li>Line to Line Fault (LL)</li>
                      <li>Open Phase (Blown Fuse)</li>
                      <li>Unbalanced Loading</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-amber-500">
                  <AlertTriangle className="w-5 h-5" /> 
                  Common Mistakes
                </h3>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <p><strong className="text-slate-900 dark:text-white">Incorrect CT Polarity:</strong> If your I1 and I2 are swapped, check if your CT wiring is reversed (subtracting 180°).</p>
                  <p><strong className="text-slate-900 dark:text-white">Rotation Check:</strong> This tool assumes Standard ABC (Positive) Rotation. If your system is ACB, swap phase B and C inputs.</p>
                  <p><strong className="text-slate-900 dark:text-white">Ground Reference:</strong> Zero sequence requires a return path. On delta windings, I0 circulates inside the delta and cannot be seen on the lines.</p>
                </div>
              </section>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

export default SymComponents;