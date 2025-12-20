import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Zap, Activity, RotateCcw, Play, Pause, Settings, 
  AlertTriangle, ShieldCheck, XCircle, Gauge, 
  ArrowDownToLine, Timer, Info, TrendingDown, BookOpen, X, List, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ADVANCED PHYSICS CONSTANTS ---
const NOMINAL_FREQ = 60; // Hz (Standard Industrial)
const SYSTEM_V = 1.0; // Per Unit
const MAX_HISTORY_POINTS = 200;

// --- UTILITY: POLYLINE GENERATOR FOR GRAPHS ---
const useTrendline = (data, width, height, minVal, maxVal) => {
  if (data.length < 2) return "";
  const range = maxVal - minVal;
  return data.map((val, i) => {
    const x = (i / (MAX_HISTORY_POINTS - 1)) * width;
    const y = height - ((val - minVal) / range) * height;
    return `${x},${y}`;
  }).join(' ');
};

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Engineering Standards & Operation Guide</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          
          {/* SECTION 1: HOW TO USE */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <List className="w-5 h-5" /> Operational Sequence
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Step 1</div>
                <h4 className="font-bold text-white mb-2">Trip Main Breaker</h4>
                <p className="text-sm text-slate-400">Click <span className="text-red-400 font-mono">TRIP MAIN</span> to disconnect the motor bus. The bus voltage will decay and the frequency will slip as motors coast down.</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Step 2</div>
                <h4 className="font-bold text-white mb-2">Monitor Vectors</h4>
                <p className="text-sm text-slate-400">Watch the <strong>Synchroscope</strong>. The rotating orange vector represents the Motor Bus. The blue vector is the Grid.</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Step 3</div>
                <h4 className="font-bold text-white mb-2">Execute Transfer</h4>
                <p className="text-sm text-slate-400">Click <span className="text-blue-400 font-mono">TRANSFER</span>. The logic will account for breaker latency. Ideally, transfer before the phase difference exceeds 20°.</p>
              </div>
            </div>
          </section>

          {/* SECTION 2: STANDARDS */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Governing Standards (ANSI C50.41)
            </h3>
            <div className="bg-slate-800/50 p-6 rounded-xl border border-amber-500/30">
              <h4 className="font-bold text-white mb-4">The 1.33 per unit V/Hz Rule</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong>ANSI C50.41-2012 (Polyphase Induction Motors)</strong> states that to prevent cumulative mechanical damage to the motor shaft and windings, the vector difference between the residual voltage and the system voltage at the instant of reconnection must not exceed <strong>1.33 per unit (pu)</strong>.
              </p>
              <div className="mt-6 bg-black/40 p-4 rounded-lg font-mono text-sm text-amber-200">
                ΔV = √[ V_sys² + V_res² - 2(V_sys)(V_res)cos(δ) ] &lt; 1.33
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></div> V_sys: System Voltage (usually 1.0 pu)</li>
                <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></div> V_res: Motor Residual Voltage (decays over time)</li>
                <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></div> δ: Phase angle difference</li>
              </ul>
            </div>
          </section>

          {/* SECTION 3: DOS AND DONTS */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <Info className="w-5 h-5" /> Dos and Don'ts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-emerald-400 border-b border-emerald-500/30 pb-2">DO</h4>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>Perform "Fast Transfer"</strong> rapidly while the phase angle is small (&lt;20°). This causes minimal torque shock.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>Wait for "Residual Transfer"</strong> (voltage &lt;25%) if you miss the fast window. It is safer to restart motors from zero field than to close out-of-phase.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>Account for Breaker Time.</strong> A 5-cycle breaker takes ~80ms to close. The phase continues to drift during this time!</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-red-400 border-b border-red-500/30 pb-2">DON'T</h4>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-slate-300">
                    <X className="w-4 h-4 text-red-500 shrink-0" />
                    <span><strong>Never close near 180° opposition.</strong> This doubles the voltage seen by the motor (2.0 pu), creating 4x starting torque (T ∝ V²), which can shear couplings.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <X className="w-4 h-4 text-red-500 shrink-0" />
                    <span><strong>Don't ignore Load Inertia.</strong> Low inertia loads (pumps) slow down much faster than high inertia loads (fans), narrowing your transfer window.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

        </div>
        <div className="p-6 border-t border-slate-700 bg-slate-800 flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">
             Understood
           </button>
        </div>
      </motion.div>
    </div>
  );
};

const FastBusTransfer = () => {
  // --- STATE ---
  const [showHelp, setShowHelp] = useState(false);
  const [simState, setSimState] = useState('CONNECTED'); // CONNECTED, COASTING, TRANSFER_INITIATED, COMPLETED
  const [source1, setSource1] = useState(true);
  const [source2, setSource2] = useState(false);
  
  // Physics Variables
  const [time, setTime] = useState(0);
  const [busV, setBusV] = useState(1.0);
  const [busFreq, setBusFreq] = useState(NOMINAL_FREQ);
  const [phaseAngle, setPhaseAngle] = useState(0); // Degrees relative to grid
  
  // Result Metrics
  const [transferResult, setTransferResult] = useState(null);
  const [closureAngle, setClosureAngle] = useState(0);
  const [closureVoltage, setClosureVoltage] = useState(0);
  const [vectorDeltaV, setVectorDeltaV] = useState(0);

  // Settings
  const [params, setParams] = useState({
    decayConstant: 1.5, // Voltage decay tau
    inertiaH: 0.8, // Inertia constant (affects freq decay)
    breakerDelay: 80, // ms
    fastTransferLimit: 25, // degrees
    residualLimit: 0.25, // pu
    loadType: 'motor'
  });

  // Oscillograph Data (History)
  const [historyV, setHistoryV] = useState(new Array(MAX_HISTORY_POINTS).fill(1.0));
  const [historyAngle, setHistoryAngle] = useState(new Array(MAX_HISTORY_POINTS).fill(0));

  const requestRef = useRef();
  const lastTimeRef = useRef();

  // --- PHYSICS ENGINE ---
  const updatePhysics = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = (timestamp - lastTimeRef.current) / 1000; // Seconds
    lastTimeRef.current = timestamp;

    if (simState === 'COASTING' || simState === 'TRANSFER_INITIATED') {
      setTime(prev => prev + dt);

      // 1. Voltage Decay Model (Exponential)
      const newV = Math.exp(-time / params.decayConstant);
      setBusV(newV);

      // 2. Frequency Decay Model
      const freqDecayRate = 1 / (2 * params.inertiaH); 
      const newFreq = NOMINAL_FREQ * Math.exp(-time * freqDecayRate * 0.15); 
      setBusFreq(newFreq);

      // 3. Phase Angle Integration
      const slipFreq = NOMINAL_FREQ - newFreq;
      // Angle grows negative as bus lags grid
      const angleChange = -(slipFreq * 360 * dt); 
      
      let newAngle = (phaseAngle + angleChange) % 360;
      if (newAngle < -180) newAngle += 360;
      setPhaseAngle(newAngle);

      // 4. Update History
      setHistoryV(prev => [...prev.slice(1), newV]);
      setHistoryAngle(prev => [...prev.slice(1), newAngle]);
    } else if (simState === 'CONNECTED') {
       setHistoryV(prev => [...prev.slice(1), 1.0]);
       setHistoryAngle(prev => [...prev.slice(1), 0]);
    }

    requestRef.current = requestAnimationFrame(updatePhysics);
  }, [simState, time, phaseAngle, params]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current);
  }, [updatePhysics]);


  // --- CONTROL LOGIC ---

  const tripMain = () => {
    setSource1(false);
    setSimState('COASTING');
    setTime(0);
    setTransferResult(null);
  };

  const initiateTransfer = () => {
    if (simState !== 'COASTING') return;
    setSimState('TRANSFER_INITIATED');
    
    // Simulate Breaker Mechanical Delay
    setTimeout(() => {
      executeClosure();
    }, params.breakerDelay);
  };

  const executeClosure = () => {
    setSimState('COMPLETED');
    setSource2(true);
    
    // Evaluate Technical Result
    const finalAngle = Math.abs(phaseAngle);
    const finalV = busV;
    const rad = finalAngle * (Math.PI / 180);
    
    // VECTOR DIFFERENCE CALCULATION (ANSI C50.41)
    // ΔV = sqrt(V_sys^2 + V_res^2 - 2*V_sys*V_res*cos(angle))
    const deltaV = Math.sqrt(
      Math.pow(SYSTEM_V, 2) + Math.pow(finalV, 2) - 2 * SYSTEM_V * finalV * Math.cos(rad)
    );
    
    setClosureAngle(finalAngle);
    setClosureVoltage(finalV);
    setVectorDeltaV(deltaV);

    let result = '';
    let message = '';
    let type = '';

    // Logic Tree
    if (finalAngle <= params.fastTransferLimit) {
      result = 'SUCCESS (FAST)';
      message = 'In-Phase Transfer. Minimal torque transient.';
      type = 'success';
    } else if (finalV <= params.residualLimit) {
      result = 'SUCCESS (RESIDUAL)';
      message = 'Voltage dropped to safe level (<25%). Motor restart safe.';
      type = 'success';
    } else if (deltaV > 1.33) {
      result = 'ANSI C50.41 VIOLATION';
      message = `Critical Stress! Vector ΔV (${deltaV.toFixed(2)} pu) exceeds 1.33 pu limit. Shaft damage likely.`;
      type = 'critical';
    } else {
      result = 'MARGINAL / DANGEROUS';
      message = `High Stress. Vector ΔV is ${deltaV.toFixed(2)} pu. Winding life reduced.`;
      type = 'warning';
    }

    setTransferResult({ status: result, msg: message, type });
  };

  const resetSystem = () => {
    setSimState('CONNECTED');
    setSource1(true);
    setSource2(false);
    setTime(0);
    setBusV(1.0);
    setBusFreq(NOMINAL_FREQ);
    setPhaseAngle(0);
    setHistoryV(new Array(MAX_HISTORY_POINTS).fill(1.0));
    setHistoryAngle(new Array(MAX_HISTORY_POINTS).fill(0));
    setTransferResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      <AnimatePresence>
        {showHelp && <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />}
      </AnimatePresence>

      {/* --- TOP BAR --- */}
      <header className="bg-[#1e293b] border-b border-slate-700 px-6 py-4 flex justify-between items-center shadow-lg z-10 relative">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Transient<span className="text-blue-400">Sim</span> Pro</h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Fast Bus Transfer Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <button 
             onClick={() => setShowHelp(true)}
             className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold text-white transition-colors border border-slate-600"
           >
             <BookOpen className="w-4 h-4" /> Help & Standards
           </button>
           
           <div className="hidden md:flex gap-6 text-sm font-mono border-l border-slate-700 pl-6">
             <div className="flex flex-col items-end">
               <span className="text-slate-500 text-[10px] uppercase">Bus Freq</span>
               <span className={`text-lg font-bold ${busFreq < 58 ? 'text-amber-500' : 'text-emerald-400'}`}>
                 {busFreq.toFixed(2)} <span className="text-xs text-slate-500">Hz</span>
               </span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-slate-500 text-[10px] uppercase">Bus Voltage</span>
               <span className={`text-lg font-bold ${busV < 0.8 ? 'text-amber-500' : 'text-emerald-400'}`}>
                 {(busV * 100).toFixed(1)} <span className="text-xs text-slate-500">%</span>
               </span>
             </div>
           </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto grid grid-cols-12 gap-6">

        {/* --- LEFT COL --- */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          
          {/* SLD VISUALIZER */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-8 shadow-2xl relative overflow-hidden min-h-[400px]">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.9),rgba(30,41,59,0.9)),url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-50 pointer-events-none"></div>
             
             {/* DIAGRAM */}
             <div className="relative z-10 flex flex-col items-center justify-between h-full">
                {/* Sources */}
                <div className="flex justify-between w-full px-4 md:px-12">
                   {/* Source 1 */}
                   <div className="flex flex-col items-center gap-2 group">
                      <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${source1 ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-slate-600 bg-slate-800'}`}>
                        <Zap className={`w-8 h-8 ${source1 ? 'text-emerald-400 fill-emerald-400' : 'text-slate-600'}`} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Main Feeder</span>
                      <div className={`h-12 w-1 transition-colors duration-300 ${source1 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                      {/* Breaker 1 */}
                      <div className={`w-8 h-8 border-2 rounded bg-[#0f172a] z-20 transition-colors duration-300 flex items-center justify-center ${source1 ? 'border-emerald-500' : 'border-red-500'}`}>
                         <div className={`w-3 h-3 rounded-sm ${source1 ? 'bg-emerald-500' : 'border border-red-500'}`}></div>
                      </div>
                   </div>

                   {/* Source 2 */}
                   <div className="flex flex-col items-center gap-2">
                      <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${source2 ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-slate-600 bg-slate-800'}`}>
                        <Zap className={`w-8 h-8 ${source2 ? 'text-blue-400 fill-blue-400' : 'text-slate-600'}`} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Standby Gen</span>
                      <div className={`h-12 w-1 transition-colors duration-300 ${source2 ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                      {/* Breaker 2 */}
                      <div className={`w-8 h-8 border-2 rounded bg-[#0f172a] z-20 transition-colors duration-300 flex items-center justify-center ${source2 ? 'border-blue-500' : 'border-emerald-500'}`}>
                         <div className={`w-3 h-3 rounded-sm ${source2 ? 'bg-blue-500' : 'border border-emerald-500'}`}></div>
                      </div>
                   </div>
                </div>

                {/* BUS BAR */}
                <div className="w-full px-8 my-4 relative">
                   <div className={`h-6 w-full rounded-sm transition-all duration-100 flex items-center justify-center shadow-lg relative overflow-hidden ${busV > 0.1 ? 'bg-amber-500/20 border-y-2 border-amber-500' : 'bg-slate-800 border-y-2 border-slate-700'}`}>
                      {(source1 || source2 || simState === 'COASTING') && (
                         <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(251,191,36,0.2)_50%,transparent_100%)] animate-shimmer" style={{animationDuration: `${1000/busFreq}ms`}}></div>
                      )}
                      <span className="relative z-10 text-xs font-black text-amber-500 tracking-[0.3em] shadow-black drop-shadow-md">CRITICAL LOAD BUS</span>
                   </div>
                </div>

                {/* LOAD */}
                <div className="flex flex-col items-center relative">
                   <div className={`h-12 w-1 transition-colors duration-300 ${busV > 0.1 ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                   <div className="w-24 h-24 rounded-full border-4 border-slate-600 bg-slate-800 flex items-center justify-center relative shadow-2xl">
                      <Gauge className={`w-12 h-12 transition-colors duration-500 ${busV > 0.8 ? 'text-amber-400' : busV > 0.3 ? 'text-amber-700' : 'text-slate-700'}`} />
                      <svg className="absolute inset-0 w-full h-full animate-spin-slow" style={{ animationDuration: `${(1/busFreq)*200}s`, animationPlayState: busV > 0.05 ? 'running' : 'paused' }}>
                         <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="2" fill="none" className="text-slate-700" strokeDasharray="10 10"/>
                      </svg>
                   </div>
                   <div className="mt-4 text-center">
                      <div className="text-sm font-bold text-slate-300">Induction Motor Group</div>
                   </div>
                </div>
             </div>
          </div>

          {/* CONTROL PANEL */}
          <div className="grid grid-cols-3 gap-4">
             <button 
                onClick={tripMain}
                disabled={!source1}
                className="bg-red-900/30 border border-red-500/50 hover:bg-red-900/50 hover:border-red-400 text-red-100 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed group">
                <div className="p-2 bg-red-500 rounded-full group-hover:scale-110 transition-transform"><ArrowDownToLine className="w-5 h-5" /></div>
                <span className="font-bold text-sm tracking-wide">TRIP MAIN</span>
             </button>

             <button 
                onClick={initiateTransfer}
                disabled={simState !== 'COASTING'}
                className="bg-blue-900/30 border border-blue-500/50 hover:bg-blue-900/50 hover:border-blue-400 text-blue-100 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden">
                {simState === 'TRANSFER_INITIATED' && <div className="absolute inset-0 bg-blue-500/20 animate-pulse"></div>}
                <div className="p-2 bg-blue-500 rounded-full group-hover:scale-110 transition-transform"><Zap className="w-5 h-5" /></div>
                <span className="font-bold text-sm tracking-wide">
                   {simState === 'TRANSFER_INITIATED' ? 'CLOSING...' : 'TRANSFER'}
                </span>
                <span className="text-[10px] text-blue-300 opacity-60">Delay: {params.breakerDelay}ms</span>
             </button>

             <button 
                onClick={resetSystem}
                className="bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group">
                <div className="p-2 bg-slate-600 rounded-full group-hover:rotate-180 transition-transform duration-500"><RotateCcw className="w-5 h-5" /></div>
                <span className="font-bold text-sm tracking-wide">RESET SIM</span>
             </button>
          </div>
          
          {/* RESULT READOUT */}
          <AnimatePresence>
            {transferResult && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 className={`p-6 rounded-xl border-l-4 shadow-lg flex items-start gap-4 ${
                   transferResult.type === 'success' ? 'bg-emerald-900/20 border-emerald-500' :
                   transferResult.type === 'warning' ? 'bg-amber-900/20 border-amber-500' :
                   'bg-red-900/20 border-red-500'
                 }`}
               >
                 <div className={`p-3 rounded-full ${
                    transferResult.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                    transferResult.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                 }`}>
                    {transferResult.type === 'success' ? <ShieldCheck /> : <AlertTriangle />}
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <h3 className={`text-lg font-black tracking-tight ${
                        transferResult.type === 'success' ? 'text-emerald-400' :
                        transferResult.type === 'warning' ? 'text-amber-400' :
                        'text-red-400'
                        }`}>{transferResult.status}</h3>
                        <span className="text-xs font-mono text-slate-500 border border-slate-700 px-2 py-1 rounded">ANSI C50.41</span>
                    </div>
                    <p className="text-slate-300 text-sm mt-1">{transferResult.msg}</p>
                    <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-700/50 pt-3">
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase">Phase Angle</div>
                         <div className="text-white font-mono">{closureAngle.toFixed(1)}°</div>
                       </div>
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase">Residual V</div>
                         <div className="text-white font-mono">{(closureVoltage*100).toFixed(1)}%</div>
                       </div>
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase">Vector ΔV</div>
                         <div className={`font-mono font-bold ${vectorDeltaV > 1.33 ? 'text-red-400' : 'text-emerald-400'}`}>{vectorDeltaV.toFixed(2)} pu</div>
                       </div>
                    </div>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- RIGHT COL --- */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
           
           {/* SYNCHROSCOPE */}
           <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6 shadow-xl flex flex-col items-center">
              <div className="flex justify-between w-full mb-4">
                 <h3 className="font-bold text-slate-300 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" /> Vector Analysis</h3>
                 <span className="text-xs text-slate-500 font-mono">REF: GRID (0°)</span>
              </div>
              
              <div className="relative w-64 h-64 my-4">
                 <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Background */}
                    <circle cx="100" cy="100" r="90" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="100" y1="10" x2="100" y2="190" stroke="#334155" strokeWidth="1" />
                    <line x1="10" y1="100" x2="190" y2="100" stroke="#334155" strokeWidth="1" />
                    
                    {/* ANSI C50.41 Warning Zone (>1.33 pu V/Hz approx boundary if V=1.0) 
                        Generally if Angle > 60-90 degrees it's dangerous at high voltage */}
                    <path d="M 100 100 L 190 100 A 90 90 0 0 1 10 100 L 100 100" fill="#ef4444" fillOpacity="0.1" />

                    {/* Safe Zone Arc */}
                    <path d="M 100 10 L 100 20 A 80 80 0 0 1 140 31" fill="none" stroke="#10b981" strokeWidth="4" opacity="0.6" />
                    <path d="M 100 10 L 100 20 A 80 80 0 0 0 60 31" fill="none" stroke="#10b981" strokeWidth="4" opacity="0.6" />
                    <text x="110" y="30" fill="#10b981" fontSize="8" fontWeight="bold">FAST ZONE</text>

                    {/* Vectors */}
                    <line x1="100" y1="100" x2="100" y2="20" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                    <text x="90" y="15" fill="#3b82f6" fontSize="8" fontWeight="bold">GRID</text>
                    
                    {/* Bus Vector */}
                    <g transform={`rotate(${phaseAngle}, 100, 100)`}>
                       <line 
                          x1="100" y1="100" 
                          x2="100" y2={100 - (busV * 80)} 
                          stroke="#f59e0b" 
                          strokeWidth="4" 
                          strokeLinecap="round" 
                       />
                       <circle cx="100" cy={100 - (busV * 80)} r="3" fill="#f59e0b" />
                    </g>
                 </svg>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-200 rounded-full border-4 border-slate-700 shadow-md"></div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 mt-4">
                 <div className="bg-slate-800/50 p-2 rounded border border-slate-700 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Phase Diff</div>
                    <div className={`text-xl font-mono font-bold ${Math.abs(phaseAngle) > params.fastTransferLimit ? 'text-red-400' : 'text-emerald-400'}`}>
                       {Math.abs(phaseAngle).toFixed(1)}°
                    </div>
                 </div>
                 <div className="bg-slate-800/50 p-2 rounded border border-slate-700 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Calc Vector ΔV</div>
                    <div className="text-xl font-mono font-bold text-slate-300">
                       {(Math.sqrt(1 + busV**2 - 2*1*busV*Math.cos(phaseAngle * Math.PI/180))).toFixed(2)} pu
                    </div>
                 </div>
              </div>
           </div>

           {/* LIVE TRENDS */}
           <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6 shadow-xl flex-grow flex flex-col gap-4">
              <h3 className="font-bold text-slate-300 flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-emerald-400" /> Live Trends</h3>
              
              {/* Voltage Graph */}
              <div className="relative h-24 bg-slate-900 rounded border border-slate-700 overflow-hidden">
                 <div className="absolute top-2 left-2 text-[10px] text-emerald-500 font-bold bg-slate-900/80 px-1 rounded">VOLTAGE (pu)</div>
                 <svg className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" /> 
                    <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" /> 
                    <polyline 
                       points={useTrendline(historyV, 400, 96, 0, 1.2)} 
                       fill="none" 
                       stroke="#10b981" 
                       strokeWidth="2" 
                    />
                 </svg>
              </div>

              {/* Angle Graph */}
              <div className="relative h-24 bg-slate-900 rounded border border-slate-700 overflow-hidden">
                 <div className="absolute top-2 left-2 text-[10px] text-amber-500 font-bold bg-slate-900/80 px-1 rounded">PHASE ANGLE (deg)</div>
                 <svg className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#334155" strokeWidth="1" />
                    <polyline 
                       points={useTrendline(historyAngle, 400, 96, -180, 180)} 
                       fill="none" 
                       stroke="#f59e0b" 
                       strokeWidth="2" 
                    />
                 </svg>
              </div>
           </div>

        </div>
        
        {/* --- SETTINGS --- */}
        <div className="col-span-12 border-t border-slate-800 pt-6">
           <div className="flex flex-wrap gap-8 items-center justify-center">
              <div className="flex items-center gap-3">
                 <label className="text-xs font-bold text-slate-500 uppercase">Load Inertia (H)</label>
                 <input 
                    type="range" min="0.5" max="5.0" step="0.1"
                    value={params.inertiaH}
                    onChange={(e) => setParams({...params, inertiaH: parseFloat(e.target.value)})}
                    className="w-32 accent-blue-500"
                 />
                 <span className="text-xs font-mono text-blue-400 w-8">{params.inertiaH}s</span>
              </div>

              <div className="flex items-center gap-3">
                 <label className="text-xs font-bold text-slate-500 uppercase">Breaker Delay</label>
                 <select 
                    value={params.breakerDelay}
                    onChange={(e) => setParams({...params, breakerDelay: parseInt(e.target.value)})}
                    className="bg-slate-800 border border-slate-600 text-xs rounded px-2 py-1 text-slate-200"
                 >
                    <option value="50">50ms (High Speed)</option>
                    <option value="80">80ms (Standard 5-Cycle)</option>
                    <option value="150">150ms (Slow)</option>
                 </select>
              </div>
           </div>
        </div>

      </main>
    </div>
  );
};

export default FastBusTransfer;