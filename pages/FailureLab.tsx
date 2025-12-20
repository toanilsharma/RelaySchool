import React, { useState, useEffect, useRef } from 'react';
import { generateWaveform } from '../services/mathEngine';
import { Microscope, Activity, Sliders, Zap, FileSearch, TrendingUp, BarChart2, Compass } from 'lucide-react';

const FailureLab = () => {
  const [activeTab, setActiveTab] = useState<'CT_SAT' | 'SIR'>('CT_SAT');
  
  // Simulation State
  const [magnitude, setMagnitude] = useState(100);
  const [dcOffset, setDcOffset] = useState(0); // Percent
  const [saturation, setSaturation] = useState(0); // Percent 0-1
  const [phase, setPhase] = useState(0);

  // Generate Data
  const pointsIdeal = generateWaveform(3, 50, magnitude, phase, 0);
  const pointsActual = generateWaveform(3, 50, magnitude + (magnitude * (dcOffset/100)), phase, saturation / 100);

  const renderWaveform = () => {
      // SVG Scaling
      const height = 300;
      const width = 600;
      const midY = height / 2;
      const scaleX = width / pointsIdeal.length;
      const scaleY = 1; // Arbitrary scale factor

      const toPath = (pts: {x:number, y:number}[]) => {
          return pts.map((p, i) => 
              `${i === 0 ? 'M' : 'L'} ${i * scaleX} ${midY - (p.y * scaleY)}`
          ).join(' ');
      };

      return (
          <div className="w-full h-[300px] bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 shadow-inner">
              {/* Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              <div className="absolute top-1/2 left-0 w-full h-px bg-slate-600"></div>

              <svg className="w-full h-full relative z-10" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                  <path d={toPath(pointsIdeal)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />
                  <path d={toPath(pointsActual)} fill="none" stroke="#ef4444" strokeWidth="3" />
              </svg>

              <div className="absolute top-4 right-4 flex flex-col gap-2 bg-slate-900/80 p-2 rounded border border-slate-700">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                      <div className="w-3 h-0.5 bg-blue-400 border-t border-dashed"></div> Ideal Secondary
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-red-500">
                      <div className="w-3 h-1 bg-red-500 rounded-full"></div> Actual (Distorted)
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Microscope className="w-8 h-8 text-purple-500" /> Failure Analysis Lab
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Forensic reconstruction of protection failures.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-500" /> Simulation Parameters
                  </h3>

                  <div className="space-y-6">
                      <div>
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                              <span>Fault Magnitude</span>
                              <span className="text-slate-900 dark:text-white">{magnitude} A</span>
                          </div>
                          <input type="range" min="10" max="140" value={magnitude} onChange={(e) => setMagnitude(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      </div>

                      <div>
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                              <span>DC Offset (Asymmetry)</span>
                              <span className="text-slate-900 dark:text-white">{dcOffset}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={dcOffset} onChange={(e) => setDcOffset(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                          <p className="text-[10px] text-slate-400 mt-1">Shifts the waveform vertically, consuming core flux.</p>
                      </div>

                      <div>
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                              <span>Core Saturation</span>
                              <span className="text-slate-900 dark:text-white">{saturation}%</span>
                          </div>
                          <input type="range" min="0" max="80" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500" />
                          <p className="text-[10px] text-slate-400 mt-1">Simulates 'clipping' when flux density {'>'} Tesla limit.</p>
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex gap-4">
                      <button 
                        onClick={() => { setMagnitude(100); setDcOffset(0); setSaturation(0); }}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                      >
                          Normal Load
                      </button>
                      <button 
                        onClick={() => { setMagnitude(120); setDcOffset(80); setSaturation(40); }}
                        className="flex-1 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors"
                      >
                          Severe Fault
                      </button>
                  </div>
              </div>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-8">
               <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1 shadow-xl">
                   {renderWaveform()}
               </div>
               
               <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                           <Activity className="w-4 h-4 text-emerald-500" /> RMS Reading
                       </h4>
                       <div className="flex items-end gap-2">
                           <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white">
                               {(magnitude * (1 - saturation/200)).toFixed(1)}
                           </span>
                           <span className="text-sm text-slate-500 mb-1">Amps</span>
                       </div>
                       <p className="text-xs text-red-500 mt-1">
                           {saturation > 10 ? `Error: -${(saturation * 0.8).toFixed(1)}% due to clipping` : 'Accuracy within limits'}
                       </p>
                   </div>

                   <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                           <Zap className="w-4 h-4 text-amber-500" /> Harmonic Distortion
                       </h4>
                       <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                           <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${saturation}%` }}></div>
                       </div>
                       <p className="text-xs text-slate-500 mt-2 flex justify-between">
                           <span>THD Level</span>
                           <span className="font-mono font-bold">{saturation.toFixed(1)}%</span>
                       </p>
                   </div>
               </div>
          </div>
      </div>

      {/* --- RICH CONTENT SECTION --- */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 mt-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileSearch className="w-6 h-6 text-red-500" /> Forensic Engineering 101
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Protection relays don't fail randomly; they fail due to physics. This lab allows you to reconstruct common failure modes to understand the root cause. 
                  By visualizing the invisible—magnetic flux and DC offset—you can design more robust systems.
              </p>
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase mb-1">CT Saturation</div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                          When fault current is high and DC offset is present, the CT core runs out of magnetic headroom. The secondary waveform gets "clipped".
                      </p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">DC Offset</div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                          Faults happening near voltage zero create maximum DC offset. This exponential decay pushes the flux limits of the CT.
                      </p>
                  </div>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-500" /> Analyzing the Data
              </h3>
              <ul className="space-y-4">
                  <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Harmonic Analysis</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Saturated waveforms are rich in odd harmonics (3rd, 5th) and even harmonics (2nd). Modern relays use <strong>2nd Harmonic Blocking</strong>.
                          </p>
                      </div>
                  </li>
                  <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                          <Compass className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Vector Collapse</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              In differential schemes, saturation causes a phase shift and magnitude reduction in the secondary current.
                          </p>
                      </div>
                  </li>
              </ul>
          </div>
      </section>
    </div>
  );
};

export default FailureLab;