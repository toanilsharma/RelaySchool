import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  RotateCcw, HelpCircle, BookOpen, Settings, MonitorPlay, 
  GraduationCap, Award, Zap, AlertTriangle, Activity, 
  ShieldCheck, Share2, Crosshair, CheckCircle2, XCircle, 
  Play, Info, Cpu, Network, Target, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================== CORE MATH ENGINE ==============================
const TESTER_MATH = {
  degToRad: (deg) => (deg * Math.PI) / 180,
  radToDeg: (rad) => (rad * 180) / Math.PI,
  
  // Check if an impedance point (R, X) is inside a Mho circle
  checkMhoZone: (r, x, reach, mta) => {
    const mtaRad = TESTER_MATH.degToRad(mta);
    const radius = reach / 2;
    const centerR = radius * Math.cos(mtaRad);
    const centerX = radius * Math.sin(mtaRad);
    
    const distance = Math.sqrt(Math.pow(r - centerR, 2) + Math.pow(x - centerX, 2));
    return distance <= radius; // True if inside or exactly on the boundary
  },

  // Generate test points along the boundary of a zone for auto-testing
  generateBoundaryPoints: (reach, mta, tolerancePercent = 5, pointsPerRing = 24) => {
    const mtaRad = TESTER_MATH.degToRad(mta);
    const radius = reach / 2;
    const centerR = radius * Math.cos(mtaRad);
    const centerX = radius * Math.sin(mtaRad);
    
    const points = [];
    const tolerances = [1 - (tolerancePercent/100), 1 + (tolerancePercent/100)]; // Inside and Outside rings

    tolerances.forEach(tol => {
      const testRadius = radius * tol;
      for (let i = 0; i < pointsPerRing; i++) {
        const angle = (i / pointsPerRing) * Math.PI * 2;
        const r = centerR + testRadius * Math.cos(angle);
        const x = centerX + testRadius * Math.sin(angle);
        
        // Only keep realistic forward/slightly reverse fault impedances
        if (r > -reach*0.2 && x > -reach*0.2) {
          points.push({ r, x });
        }
      }
    });
    return points;
  }
};

// ============================== DATA CONSTANTS ==============================
const RELAY_MODELS = [
  { id: 'sel_421', name: 'SEL-421', type: 'Distance', zones: 4, manufacturer: 'SEL' },
  { id: 'abb_red670', name: 'ABB RED670', type: 'Distance', zones: 4, manufacturer: 'ABB' },
  { id: 'ge_d60', name: 'GE D60', type: 'Distance', zones: 4, manufacturer: 'GE' },
  { id: 'siemens_7sa', name: 'Siemens 7SA87', type: 'Distance', zones: 5, manufacturer: 'Siemens' },
];

const THEORY_CONTENT = [
  { 
    id: 'distance-principle', 
    title: 'Distance Protection (21) Principle', 
    icon: Target, 
    content: [
      { type: 'text', value: 'Distance relays operate by measuring the voltage and current at the relay location to calculate the apparent impedance of the line.' },
      { type: 'formula', value: '\\vec{Z}_{measured} = \\frac{\\vec{V}_{relay}}{\\vec{I}_{relay}}' },
      { type: 'text', value: 'Since the impedance of a transmission line is proportional to its length, the relay can determine if a fault is within its protected "zone". If the measured impedance falls below the set threshold (reach), the relay issues a trip command.' }
    ]
  },
  { 
    id: 'mho-characteristic', 
    title: 'The Mho Characteristic', 
    icon: Activity, 
    content: [
      { type: 'text', value: 'The most common operating characteristic for transmission lines is the Mho circle. On an R-X (Resistance-Reactance) diagram, it appears as a circle passing through the origin.' },
      { type: 'list', items: [
        'Reach (Z): The diameter of the circle, representing the maximum impedance the relay will trip for.',
        'MTA (Maximum Torque Angle): The angle of the line impedance. The Mho circle is tilted at this angle to provide maximum sensitivity for faults on that specific line.',
        'Zone 1: Typically set to 80-90% of the line length. Trips instantaneously.',
        'Zone 2: Typically set to 120% of the line length to cover the entire line and back up the next bus. Trips with a time delay (e.g., 300ms).'
      ]}
    ]
  },
  { 
    id: 'testing-methodology', 
    title: 'Automated Relay Testing', 
    icon: Cpu, 
    content: [
      { type: 'text', value: 'Modern relay test sets (like OMICRON CMC or Doble F6150) verify distance relays by injecting precise AC voltages and currents to simulate specific fault impedances.' },
      { type: 'text', value: 'Zone Boundary Search: The tester injects impedances just inside (e.g., 95%) and just outside (e.g., 105%) the calculated Mho circle boundary. This proves the relay\'s measurement algorithm is accurate and its settings are correctly applied.' }
    ]
  }
];

const QUIZ_DATA = [
  { q: "What does a relay tester physically inject into the relay terminals?", opts: ["DC voltage", "AC voltage and current phasors", "Impedance directly", "Light signals"], ans: 1, why: "Test sets inject calibrated V and I phasors. The relay calculates impedance Z = V/I internally based on these signals." },
  { q: "Zone boundary testing verifies:", opts: ["CT accuracy", "That the relay trips/restrains at the correct impedance boundary", "VT calibration", "Communication speed"], ans: 1, why: "Zone reach testing confirms that the relay operates at points inside the Mho circle and strictly restrains at points just outside." },
  { q: "MTA stands for:", opts: ["Maximum Test Angle", "Maximum Torque Angle (Line Angle)", "Minimum Trip Angle", "Manual Test Approach"], ans: 1, why: "Maximum Torque Angle (or Relay Characteristic Angle) is the impedance angle of the protected line. The Mho circle is tilted to align with this angle." },
  { q: "Why test at 95% and 105% of the zone reach?", opts: ["To check three zones", "To verify the strict boundary tolerance of the characteristic", "To test CT ratio", "To measure breaker speed"], ans: 1, why: "Testing just inside and outside the boundary validates the mathematical accuracy of the relay and ensures no over-reaching or under-reaching." },
  { q: "A 'pass' result during a Zone 1 test means:", opts: ["The test set passed self-test", "The relay tripped instantaneously for inside faults and restrained for outside faults", "The relay failed", "The CT saturated"], ans: 1, why: "Pass = the relay's physical response (contact closure) perfectly matches the expected logical behavior based on the applied impedance." }
];

// ============================== REUSABLE UI COMPONENTS ==============================
const Card = ({ children, className = "", title, icon: Icon, action }) => (
  <div className={`bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-800/20">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-purple-400" />}
          <h3 className="font-bold text-slate-100 tracking-wide">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const ProSlider = ({ label, unit, min, max, step, value, onChange, color = "purple" }) => {
  const accentMap = {
    purple: "accent-purple-500",
    indigo: "accent-indigo-500",
    cyan: "accent-cyan-500",
    amber: "accent-amber-500",
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
  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 my-4 flex justify-center font-serif text-xl tracking-wider text-purple-100 shadow-inner">
    <span dangerouslySetInnerHTML={{ __html: latex
      .replace(/\\vec{Z}/g, '<i>Z&#770;</i>')
      .replace(/\\vec{V}/g, '<i>V&#770;</i>')
      .replace(/\\vec{I}/g, '<i>I&#770;</i>')
      .replace(/_{measured}/g, '<sub class="text-xs text-slate-400">measured</sub>')
      .replace(/_{relay}/g, '<sub class="text-xs text-slate-400">relay</sub>')
      .replace(/\\frac{(.*?)}{(.*?)}/g, '<span class="inline-flex flex-col items-center align-middle mx-2 text-lg"><span class="border-b border-slate-500 pb-1 px-1">$1</span><span class="pt-1 px-1">$2</span></span>')
    }} />
  </div>
);

const StepBadge = ({ step, title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-400 font-black shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
      {step}
    </div>
    <h3 className="text-xl font-bold text-slate-100 tracking-wide">{title}</h3>
  </div>
);

// ============================== IMPEDANCE CANVAS ==============================
const ImpedancePlaneCanvas = ({ testPoints, z1Reach, z2Reach, mta, currentTest, isRunning }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let renderState = { z1: z1Reach, z2: z2Reach, mta: mta };

    const render = () => {
      // Smooth interpolation for zone resizing
      renderState.z1 += (z1Reach - renderState.z1) * 0.1;
      renderState.z2 += (z2Reach - renderState.z2) * 0.1;
      renderState.mta += (mta - renderState.mta) * 0.1;

      const dpxRatio = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpxRatio;
      canvas.height = 360 * dpxRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `360px`;
      
      ctx.save();
      ctx.scale(dpxRatio, dpxRatio);
      
      const w = rect.width;
      const h = 360;
      const cx = w * 0.35; // Offset origin to the left to show more forward reach
      const cy = h * 0.75; // Offset origin down to show forward reach
      
      ctx.clearRect(0, 0, w, h);

      // Auto-scale based on Z2 reach
      const maxReach = Math.max(renderState.z2, 5);
      const scale = (Math.min(w, h) * 0.55) / maxReach;

      // Draw Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 2 * scale;
      
      // Vertical grid lines
      for (let i = cx % gridSize; i < w; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      // Horizontal grid lines
      for (let i = cy % gridSize; i < h; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }

      // Draw Axes
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke(); // R Axis
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke(); // X Axis
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('R (Ω) →', w - 50, cy + 16);
      ctx.fillText('jX (Ω) ↑', cx + 8, 16);

      // Helper to draw Mho Circles
      const drawMhoCircle = (reach, color, label, fillOpacity) => {
        const radius = (reach / 2) * scale;
        const mtaRad = TESTER_MATH.degToRad(renderState.mta);
        const centerR = cx + radius * Math.cos(mtaRad);
        const centerX = cy - radius * Math.sin(mtaRad); // Y is inverted

        ctx.beginPath();
        ctx.arc(centerR, centerX, radius, 0, Math.PI * 2);
        
        // Fill
        ctx.fillStyle = `${color}${fillOpacity}`;
        ctx.fill();
        
        // Stroke
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 12px monospace';
        const lblR = centerR + radius * 0.707;
        const lblX = centerX - radius * 0.707;
        ctx.fillText(label, lblR + 5, lblX - 5);
      };

      // Draw MTA Line
      const mtaRad = TESTER_MATH.degToRad(renderState.mta);
      const lineLen = maxReach * 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + lineLen * Math.cos(mtaRad), cy - lineLen * Math.sin(mtaRad));
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`MTA ${renderState.mta.toFixed(0)}°`, cx + lineLen * Math.cos(mtaRad) + 5, cy - lineLen * Math.sin(mtaRad));

      // Draw Zones
      drawMhoCircle(renderState.z2, '#f59e0b', `Z2 (${renderState.z2.toFixed(1)}Ω)`, '15'); // Amber
      drawMhoCircle(renderState.z1, '#8b5cf6', `Z1 (${renderState.z1.toFixed(1)}Ω)`, '20'); // Purple

      // Draw Test Points (History)
      testPoints.forEach(pt => {
        const px = cx + pt.r * scale;
        const py = cy - pt.x * scale;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = pt.result === 'TRIP' ? '#10b981' : '#ef4444'; // Emerald or Red
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw Current Manual Test Point / Crosshair
      if (currentTest && !isRunning) {
        const px = cx + currentTest.r * scale;
        const py = cy - currentTest.x * scale;
        
        // Glow effect
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.shadowBlur = 0; // Reset
        
        // Coordinates label
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`Inject: ${currentTest.r.toFixed(1)} + j${currentTest.x.toFixed(1)}Ω`, px + 12, py - 12);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [testPoints, z1Reach, z2Reach, mta, currentTest, isRunning]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase bg-slate-900/80 px-2 py-1 rounded">R-X Impedance Plane</span>
      </div>
      <div className="absolute bottom-3 right-3 z-10 flex gap-4 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 backdrop-blur-sm">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></div><span className="text-[10px] font-bold text-slate-300">TRIP</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white"></div><span className="text-[10px] font-bold text-slate-300">NO TRIP</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4] border border-white"></div><span className="text-[10px] font-bold text-slate-300">TARGET</span></div>
      </div>
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
};

// ============================== SIMULATOR VIEW ==============================
const SimulationView = () => {
  const [relay, setRelay] = useState(RELAY_MODELS[0]);
  const [z1Reach, setZ1Reach] = useState(8.0);
  const [z2Reach, setZ2Reach] = useState(12.0);
  const [mta, setMta] = useState(75);
  const [testR, setTestR] = useState(4.0);
  const [testX, setTestX] = useState(6.0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [testPoints, setTestPoints] = useState([]);
  const [resultsTable, setResultsTable] = useState([]);
  const [progress, setProgress] = useState(0);
  
  // Dynamic expert analysis based on current test coordinate
  const inZ1 = TESTER_MATH.checkMhoZone(testR, testX, z1Reach, mta);
  const inZ2 = TESTER_MATH.checkMhoZone(testR, testX, z2Reach, mta);
  
  let expectedBehavior = "";
  if (inZ1) expectedBehavior = "Inside Z1 Boundary. Relay should TRIP INSTANTANEOUSLY (Zone 1).";
  else if (inZ2) expectedBehavior = "Inside Z2 Boundary. Relay should TRIP WITH DELAY (Zone 2 timer).";
  else expectedBehavior = "Outside Protection Zones. Relay should RESTRAIN (No Trip).";

  const executeSingleTest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = inZ1 ? 'TRIP' : inZ2 ? 'TRIP' : 'NO_TRIP';
      const zone = inZ1 ? 'Z1' : inZ2 ? 'Z2' : 'N/A';
      const time = inZ1 ? '0.015s' : inZ2 ? '0.300s' : '—';
      
      setTestPoints(prev => [...prev, { r: testR, x: testX, result }]);
      setResultsTable(prev => [{
        id: Date.now(),
        point: `${testR.toFixed(1)} + j${testX.toFixed(1)} Ω`,
        expected: inZ1 ? 'Z1 Trip' : inZ2 ? 'Z2 Trip' : 'No Trip',
        actual: `${result} (${zone})`,
        pass: true,
        time: time
      }, ...prev]);
      
      setIsRunning(false);
    }, 600); // Simulate processing delay
  };

  const executeAutoZoneTest = () => {
    setIsRunning(true);
    setTestPoints([]);
    setResultsTable([]);
    setProgress(0);

    // Generate points around Z1
    const points = TESTER_MATH.generateBoundaryPoints(z1Reach, mta, 5, 24);
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex >= points.length) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }
      
      const pt = points[currentIndex];
      const ptInZ1 = TESTER_MATH.checkMhoZone(pt.r, pt.x, z1Reach, mta);
      const ptInZ2 = TESTER_MATH.checkMhoZone(pt.r, pt.x, z2Reach, mta);
      const result = ptInZ1 ? 'TRIP' : ptInZ2 ? 'TRIP' : 'NO_TRIP';
      
      setTestPoints(prev => [...prev, { r: pt.r, x: pt.x, result }]);
      setProgress(((currentIndex + 1) / points.length) * 100);
      
      // Add to table occasionally to prevent UI freeze
      if (currentIndex === points.length - 1) {
         setResultsTable([{
            id: 'batch',
            point: 'Auto Z1 Boundary Sequence',
            expected: 'Strict Boundary Adherence',
            actual: '48/48 Passed',
            pass: true,
            time: 'Batch'
         }]);
      }
      
      currentIndex++;
    }, 50); // Fast plotting for auto test
  };

  const clearTest = () => {
    setTestPoints([]);
    setResultsTable([]);
    setProgress(0);
    setIsRunning(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-6 max-w-[1600px] mx-auto">
      
      {/* LEFT COLUMN: Controls */}
      <div className="lg:col-span-5 space-y-8">
        
        {/* Step 1: Relay Definition */}
        <section>
          <StepBadge step="1" title="Device Under Test" />
          <Card className="border-indigo-900/50">
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Select Relay Profile</label>
              <select 
                value={relay.id} 
                onChange={e => setRelay(RELAY_MODELS.find(r => r.id === e.target.value))} 
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 font-bold focus:outline-none focus:border-purple-500 transition-colors"
                disabled={isRunning}
              >
                {RELAY_MODELS.map(r => <option key={r.id} value={r.id}>{r.name} ({r.manufacturer})</option>)}
              </select>
            </div>
            
            <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-5">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2"><Settings className="w-4 h-4"/> Zone Parameters</h4>
              <ProSlider label="Zone 1 Reach" unit="Ω" min={1} max={30} step={0.5} value={z1Reach} onChange={e => setZ1Reach(+e.target.value)} color="purple" />
              <ProSlider label="Zone 2 Reach" unit="Ω" min={1} max={40} step={0.5} value={z2Reach} onChange={e => setZ2Reach(+e.target.value)} color="amber" />
              <ProSlider label="Line MTA" unit="°" min={45} max={85} step={1} value={mta} onChange={e => setMta(+e.target.value)} color="indigo" />
            </div>
          </Card>
        </section>

        {/* Step 2: Test Injection */}
        <section>
          <StepBadge step="2" title="Manual Injection" />
          <Card className="border-cyan-900/50">
            <p className="text-sm text-slate-400 mb-5">Set the specific apparent impedance to inject into the relay terminals.</p>
            <div className="space-y-5 mb-6">
              <ProSlider label="Resistance (R)" unit="Ω" min={-5} max={25} step={0.1} value={testR} onChange={e => setTestR(+e.target.value)} color="cyan" />
              <ProSlider label="Reactance (jX)" unit="Ω" min={-5} max={25} step={0.1} value={testX} onChange={e => setTestX(+e.target.value)} color="cyan" />
            </div>

            <div className="p-4 rounded-xl border flex gap-3 shadow-lg bg-slate-900/80 border-slate-700">
              <Info className="w-6 h-6 shrink-0 mt-0.5 text-cyan-400" />
              <div>
                <h4 className="text-xs font-bold mb-1 text-cyan-400 uppercase tracking-widest">Expected Action</h4>
                <p className="text-sm text-slate-300 font-mono">{expectedBehavior}</p>
              </div>
            </div>
          </Card>
        </section>

      </div>

      {/* RIGHT COLUMN: Visuals & Results */}
      <div className="lg:col-span-7 space-y-8">
        
        {/* Actions Bar */}
        <section>
          <StepBadge step="3" title="Test Execution" />
          <div className="flex flex-wrap gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <button 
              onClick={executeSingleTest} 
              disabled={isRunning} 
              className="flex-1 min-w-[150px] px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isRunning ? <Timer className="w-5 h-5 animate-spin"/> : <Crosshair className="w-5 h-5" />}
              {isRunning ? 'Injecting...' : 'Single Shot'}
            </button>
            
            <button 
              onClick={executeAutoZoneTest} 
              disabled={isRunning} 
              className="flex-1 min-w-[150px] px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Auto Z1 Boundary
            </button>
            
            <button 
              onClick={clearTest} 
              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          
          {isRunning && progress > 0 && (
            <div className="mt-4 px-2">
              <div className="flex justify-between text-xs font-bold text-purple-400 mb-1 uppercase tracking-widest">
                <span>Sequence Progress</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-75" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </section>

        {/* Canvas */}
        <Card title="Virtual Relay Impedance Plane" icon={MonitorPlay} className="border-slate-700/50">
          <ImpedancePlaneCanvas testPoints={testPoints} z1Reach={z1Reach} z2Reach={z2Reach} mta={mta} currentTest={{ r: testR, x: testX }} isRunning={isRunning} />
        </Card>

        {/* Results Table */}
        <Card title="Test Protocol Log" icon={BookOpen} className="border-slate-700/50">
          {resultsTable.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-mono text-sm border-2 border-dashed border-slate-800 rounded-xl">
              No tests executed yet. Run a Single Shot or Auto Zone sequence.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-bold">Injected Z</th>
                    <th className="pb-3 font-bold">Expected</th>
                    <th className="pb-3 font-bold">Relay Action</th>
                    <th className="pb-3 font-bold">Trip Time</th>
                    <th className="pb-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <AnimatePresence>
                    {resultsTable.slice(0, 10).map((row) => (
                      <motion.tr 
                        key={row.id} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className="text-slate-200 font-mono"
                      >
                        <td className="py-3">{row.point}</td>
                        <td className="py-3 text-slate-400">{row.expected}</td>
                        <td className="py-3 font-bold">{row.actual}</td>
                        <td className="py-3 text-slate-400">{row.time}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${row.pass ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {row.pass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {row.pass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {resultsTable.length > 10 && (
                <div className="text-center mt-4 text-xs text-slate-500 uppercase tracking-widest font-bold">
                  Showing latest 10 records
                </div>
              )}
            </div>
          )}
        </Card>

      </div>
    </motion.div>
  );
};

const TheoryView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
    <div className="text-center space-y-4 mb-12">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
        Relay Testing Theory
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto">Master the principles of Distance Protection (21) and the standardized methodologies for verifying Mho characteristics.</p>
    </div>

    {THEORY_CONTENT.map((section) => (
      <Card key={section.id} className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-colors duration-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
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
                    <CheckCircle2 className="w-6 h-6 text-purple-500 shrink-0" />
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
        <Award className="w-20 h-20 text-purple-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-100 mb-2">Quiz Complete!</h2>
        <p className="text-slate-400 mb-8 text-lg">You scored {score} out of {QUIZ_DATA.length}</p>
        <button onClick={restart} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-purple-500/20">
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
            <div key={i} className={`h-2 w-8 rounded-full ${i < current ? 'bg-purple-500' : i === current ? 'bg-slate-400 animate-pulse' : 'bg-slate-800'}`} />
          ))}
        </div>
        <span className="text-purple-500 font-bold font-mono">Score: {score}</span>
      </div>

      <Card>
        <h3 className="text-2xl font-bold text-slate-100 mb-8 leading-tight">{q.q}</h3>
        <div className="space-y-3">
          {q.opts.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.ans;
            
            let btnClass = "bg-slate-800 border-slate-700 hover:border-purple-500 hover:bg-slate-800/80 text-slate-300";
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
    { id: 'simulator', label: 'Test Bench', icon: MonitorPlay },
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'quiz', label: 'Knowledge Check', icon: Award }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-200 selection:bg-purple-500/30">
      
      {/* HEADER */}
      <header className="h-16 md:h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-400 to-indigo-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-purple-500/20">
            <Cpu className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="font-black text-xl md:text-2xl tracking-tight text-white flex items-center gap-2">
              Relay<span className="text-purple-500">Tester</span> <span className="text-slate-600 font-normal">|</span> <span className="text-slate-400 text-lg">Virtual Doble/OMICRON</span>
            </h1>
            <div className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Impedance Distance Protection (21) Simulation Engine
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
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${isActive ? 'text-purple-400' : 'text-slate-500'}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-purple-400/20' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
            </button>
          )
        })}
      </div>

    </div>
  );
}