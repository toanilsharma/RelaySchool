
import React, { useState, useEffect } from 'react';
import { Flame, AlertTriangle, Zap, Info, Printer, AlertOctagon } from 'lucide-react';

const ArcFlash = () => {
    // Inputs
    const [voltage, setVoltage] = useState(11); // kV
    const [boltedFault, setBoltedFault] = useState(20); // kA
    const [clearingTime, setClearingTime] = useState(0.2); // seconds
    const [distance, setDistance] = useState(910); // mm (Working distance)
    const [config, setConfig] = useState('VCB'); // Vertical Conductors in Box

    // Outputs
    const [arcingCurrent, setArcingCurrent] = useState(0);
    const [incidentEnergy, setIncidentEnergy] = useState(0);
    const [boundary, setBoundary] = useState(0);
    const [ppeCat, setPpeCat] = useState(0);

    // Physics Engine: Theoretical Maximum (Ralph Lee Method adapted) & IEEE 1584 Concepts
    useEffect(() => {
        // 1. Calculate Arcing Current (I_arc)
        // Physics: Arcs introduce resistance, reducing the current compared to a bolted fault.
        // MV (Medium Voltage) sustains arcs better than LV.
        let i_arc_est = 0;
        if (voltage < 1) {
            // LV: Significant reduction due to arc impedance
            i_arc_est = boltedFault * 0.5; 
        } else {
            // MV: Approx 95% of bolted fault current
            i_arc_est = boltedFault * 0.95; 
        }
        setArcingCurrent(i_arc_est);

        // 2. Calculate Incident Energy (E) in cal/cm²
        // Formula: E = (Power * Time) / SurfaceArea
        // Power (MW) = 1.732 * V * I_arc
        const power_mw = Math.sqrt(3) * voltage * i_arc_est; 
        const total_energy_joules = power_mw * 1000000 * clearingTime;
        const total_energy_cal = total_energy_joules * 0.2388; // 1 Joule = 0.2388 cal

        // Surface Area: Assumes energy radiates in a sphere (Open Air) or Hemisphere (Box)
        // Distance converted from mm to cm
        const dist_cm = distance / 10;
        
        let surface_area_cm2 = 0;
        if (config === 'VOA') {
            // Sphere (4 * pi * r^2) - Energy spreads in all directions
            surface_area_cm2 = 4 * Math.PI * (dist_cm * dist_cm);
        } else {
            // Box (VCB) - Energy is focused outwards (Hemisphere approx or typically 3x Open Air)
            // Using a simplified focusing factor common in estimation
            surface_area_cm2 = 2 * Math.PI * (dist_cm * dist_cm); // Hemisphere approximation
        }

        const e_val = total_energy_cal / surface_area_cm2;
        setIncidentEnergy(e_val);

        // 3. PPE Category (NFPA 70E Standard Levels)
        if (e_val < 1.2) setPpeCat(0); // CAT 0
        else if (e_val < 4) setPpeCat(1); // CAT 1
        else if (e_val < 8) setPpeCat(2); // CAT 2
        else if (e_val < 25) setPpeCat(3); // CAT 3
        else if (e_val < 40) setPpeCat(4); // CAT 4
        else setPpeCat(5); // DANGEROUS

        // 4. Arc Flash Boundary (Distance where E = 1.2 cal/cm²)
        // Inverse Square Law: Db = D * sqrt(E / 1.2)
        const bound = distance * Math.sqrt(e_val / 1.2);
        setBoundary(bound);

    }, [voltage, boltedFault, clearingTime, distance, config]);

    const getPpeColor = (cat: number) => {
        if (cat === 0) return 'bg-green-500';
        if (cat === 1) return 'bg-blue-500';
        if (cat === 2) return 'bg-yellow-500';
        if (cat === 3) return 'bg-orange-500';
        if (cat === 4) return 'bg-red-500';
        return 'bg-purple-900'; // Extreme
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Flame className="w-8 h-8 text-orange-600" /> Arc Flash Analyst
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Incident Energy Calculator & Label Generator (Based on Lee Method / IEEE 1584 Concepts).
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-bold text-orange-800 dark:text-orange-200">
                    <AlertTriangle className="w-4 h-4" /> Safety Critical
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* INPUTS */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-500" /> System Parameters
                        </h3>
                        
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Voltage (kV)</label>
                                    <input type="number" step="0.1" value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-mono" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fault (kA)</label>
                                    <input type="number" step="0.5" value={boltedFault} onChange={(e) => setBoltedFault(Number(e.target.value))} className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-mono" />
                                </div>
                            </div>

                            <div>
                                <label className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2">
                                    <span>Clearing Time (Relay + Breaker)</span>
                                    <span className={clearingTime > 0.5 ? "text-red-500" : "text-emerald-500"}>{clearingTime.toFixed(3)} s</span>
                                </label>
                                <input type="range" min="0.04" max="2.0" step="0.01" value={clearingTime} onChange={(e) => setClearingTime(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>Inst (0.04s)</span>
                                    <span>Slow (2.0s)</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Working Geometry</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs mb-1">Config</div>
                                        <select value={config} onChange={(e) => setConfig(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs">
                                            <option value="VCB">Box (Focused)</option>
                                            <option value="VOA">Open Air</option>
                                        </select>
                                    </div>
                                    <div>
                                        <div className="text-xs mb-1">Distance (mm)</div>
                                        <input type="number" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                        <h4 className="text-blue-800 dark:text-blue-300 font-bold text-sm mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Physics of the Arc
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
                            Incident Energy (E) is directly proportional to time (t).
                            <br/><br/>
                            <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">E ∝ V × I × t</span>
                            <br/><br/>
                            Reducing clearing time from 0.5s to 0.05s (using a Maintenance Mode switch) reduces the energy by 90%, typically dropping PPE requirements from a space suit to a standard lab coat.
                        </p>
                    </div>
                </div>

                {/* LABEL PREVIEW */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    
                    {/* The Label */}
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-100 dark:bg-black rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800">
                        <div className="w-full max-w-[500px] aspect-[1.6] bg-white text-black font-sans flex flex-col border-4 border-black relative shadow-2xl">
                            
                            {/* Header */}
                            <div className={`${ppeCat === 5 ? 'bg-red-600' : 'bg-orange-500'} text-white p-4 text-center border-b-4 border-black`}>
                                <div className="text-5xl font-black tracking-tighter uppercase flex items-center justify-center gap-4">
                                    <AlertOctagon className="w-12 h-12 fill-white text-orange-500" />
                                    {ppeCat === 5 ? 'DANGER' : 'WARNING'}
                                </div>
                                <div className="text-xl font-bold tracking-widest mt-1">ARC FLASH & SHOCK HAZARD</div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 p-6 grid grid-cols-2 gap-x-8 gap-y-4 text-left">
                                {/* Left Col: Arc Flash */}
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase border-b border-black mb-1">Arc Flash Boundary</div>
                                    <div className="text-3xl font-black mb-4">{(boundary / 1000).toFixed(1)} m</div>

                                    <div className="text-xs font-bold text-slate-500 uppercase border-b border-black mb-1">Incident Energy @ {distance}mm</div>
                                    <div className="text-4xl font-black flex items-baseline gap-1">
                                        {incidentEnergy.toFixed(1)} <span className="text-lg font-bold text-slate-600">cal/cm²</span>
                                    </div>
                                </div>

                                {/* Right Col: PPE */}
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase border-b border-black mb-1">Hazard Risk Category</div>
                                    <div className={`text-4xl font-black mb-4 ${ppeCat === 5 ? 'text-red-600' : 'text-black'}`}>
                                        {ppeCat === 5 ? 'EXTREME' : `CAT ${ppeCat}`}
                                    </div>

                                    <div className="text-xs font-bold text-slate-500 uppercase border-b border-black mb-1">Shock Protection</div>
                                    <div className="text-sm font-bold mt-1">
                                        Limited Appr: 1.0 m<br/>
                                        Restricted Appr: 0.3 m<br/>
                                        Glove Class: {voltage > 15 ? '2' : voltage > 1 ? '0' : '00'}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-black text-white p-2 text-[10px] flex justify-between font-mono">
                                <span>Eq: SUB-MV-SWGR-01</span>
                                <span>Date: {new Date().toLocaleDateString()}</span>
                                <span>Std: IEEE 1584</span>
                            </div>
                        </div>
                        
                        <div className="mt-4 text-xs text-slate-400 font-mono">
                            Preview: Standard 4x6" Vinyl Label
                        </div>
                    </div>

                    {/* METRICS DASHBOARD */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Arcing Current</div>
                            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{arcingCurrent.toFixed(1)} kA</div>
                            <div className="text-[9px] text-slate-400 mt-1">~{((arcingCurrent/boltedFault)*100).toFixed(0)}% of Ibf</div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Arc Power</div>
                            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{(Math.sqrt(3)*voltage*arcingCurrent).toFixed(1)} MW</div>
                            <div className="text-[9px] text-slate-400 mt-1">Instantaneous Release</div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-1 ${getPpeColor(ppeCat)}`}></div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">PPE Level</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">
                                {ppeCat > 4 ? 'XX' : ppeCat}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-1">
                                {ppeCat === 0 ? 'Natural Fiber' : ppeCat === 4 ? '40 cal Suit' : 'Arc Rated'}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center cursor-pointer hover:border-blue-500 transition-colors" onClick={() => window.print()}>
                            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-blue-600">
                                <Printer className="w-6 h-6" />
                                <span className="text-xs font-bold">Print Label</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ArcFlash;
