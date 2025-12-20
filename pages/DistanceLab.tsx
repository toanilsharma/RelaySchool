import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Radar, Sliders, Target, Map, Shield, Activity, RefreshCcw, 
    CheckCircle, AlertTriangle, EyeOff, Layers, BookOpen, 
    MousePointer2, ZoomIn, X, ChevronUp, PanelLeftClose, 
    PanelLeftOpen, PanelRightClose, PanelRightOpen, GraduationCap,
    Zap, Settings, Info, AlertOctagon, Maximize2
} from 'lucide-react';

// --- 1. TYPES & CONSTANTS ---

const ProtectionZone = {
    Z1: 'Zone 1',
    Z2: 'Zone 2',
    Z3: 'Zone 3 (Reverse/Offset)'
};

const DEFAULT_SETTINGS = {
    z1Reach: 8,    // Ohms
    z2Reach: 12,   // Ohms
    z3Reach: 15,   // Ohms
    mta: 75,       // Degrees (Max Torque Angle)
    loadAngle: 30, // Degrees
    enableBlinder: false
};

// --- 2. MATH ENGINE ---

// Check if a point (r, x) is inside a Mho circle defined by Reach and MTA
// Self-polarized Mho characteristic passing through origin
const checkMho = (reach, r, x, mtaAngle) => {
    // Convert MTA to radians
    const angRad = mtaAngle * Math.PI / 180;
    
    // Mho Circle Geometry
    // Diameter is the Reach vector at MTA.
    // Center is at (Reach/2 * cos(MTA), Reach/2 * sin(MTA))
    // Radius is Reach / 2
    
    const radius = reach / 2;
    const centerX = radius * Math.cos(angRad); // R-axis coordinate
    const centerY = radius * Math.sin(angRad); // X-axis coordinate
    
    // Distance from fault point to center
    const dist = Math.sqrt(Math.pow(r - centerX, 2) + Math.pow(x - centerY, 2));
    
    return dist <= radius;
};

// --- 3. SUB-COMPONENTS ---

const HelpModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <BookOpen className="w-6 h-6 text-blue-600"/> User Guide
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                <section>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><MousePointer2 className="w-4 h-4"/> 1. Simulating Faults</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Fault Impedance:</strong> Use the sliders in the right panel to adjust the Fault Resistance (R) and Reactance (X).</li>
                        <li><strong>Visual Feedback:</strong> The white dot on the graph represents the calculated impedance vector ($Z_f = R + jX$).</li>
                        <li><strong>Trip Zones:</strong> Watch the "Protection Status" indicator to see if the fault falls within Zone 1, 2, or 3.</li>
                    </ul>
                </section>
                <section>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Shield className="w-4 h-4"/> 2. Relay Settings</h3>
                    <p>Configure the Mho characteristics in the left panel:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>Reach (Ω):</strong> Sets the diameter of the Mho circle for each zone.</li>
                        <li><strong>MTA (Max Torque Angle):</strong> Rotates the characteristic to match the line angle (typically 75°-85°).</li>
                        <li><strong>Load Blinder:</strong> Enable this to prevent tripping on heavy load current (resistive region).</li>
                    </ul>
                </section>
                <section>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><ZoomIn className="w-4 h-4"/> 3. Analysis</h3>
                    <p>Use the "Impedance Plane" to visualize coordination. Ensure Zone 1 covers 80% of the line, while Zone 2 overreaches to 120%.</p>
                </section>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-b-2xl flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">Got it</button>
            </div>
        </div>
    </div>
);

// --- 4. MAIN COMPONENT ---

const DistanceLab = () => {
    // --- STATE ---
    const [z1Reach, setZ1Reach] = useState(DEFAULT_SETTINGS.z1Reach);
    const [z2Reach, setZ2Reach] = useState(DEFAULT_SETTINGS.z2Reach);
    const [z3Reach, setZ3Reach] = useState(DEFAULT_SETTINGS.z3Reach);
    const [mta, setMta] = useState(DEFAULT_SETTINGS.mta);
    const [loadAngle, setLoadAngle] = useState(DEFAULT_SETTINGS.loadAngle);
    const [enableBlinder, setEnableBlinder] = useState(DEFAULT_SETTINGS.enableBlinder);
    
    const [faultR, setFaultR] = useState(4);
    const [faultX, setFaultX] = useState(6);
    const [showHelp, setShowHelp] = useState(false);

    // Layout State
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [footerOpen, setFooterOpen] = useState(false);

    // --- LOGIC ENGINE ---
    
    // Zone Checks
    const inZ1 = checkMho(z1Reach, faultR, faultX, mta);
    const inZ2 = checkMho(z2Reach, faultR, faultX, mta);
    const inZ3 = checkMho(z3Reach, faultR, faultX, mta); // Treated as fwd overreach for simplicity in this demo

    // Load Blinder Check
    // Angle of fault vector
    const faultAngRad = Math.atan2(faultX, faultR);
    const faultAngDeg = faultAngRad * 180 / Math.PI;
    const isLoad = enableBlinder && Math.abs(faultAngDeg) < loadAngle && Math.abs(faultAngDeg) > -loadAngle; // Simplified sector check +/- loadAngle around R axis

    // Trip Decision Logic
    let status = 'MONITOR';
    let zone = '';
    let delay = '';
    let statusColor = 'text-slate-500';
    let borderColor = 'border-slate-300';
    let bg = 'bg-slate-50 dark:bg-slate-800';

    if (isLoad) {
        status = 'BLOCKED';
        zone = 'Load Encroachment';
        delay = 'No Trip';
        statusColor = 'text-amber-600 dark:text-amber-400';
        borderColor = 'border-amber-500';
        bg = 'bg-amber-50 dark:bg-amber-900/20';
    } else if (inZ1) {
        status = 'TRIP';
        zone = 'ZONE 1';
        delay = 'Instantaneous';
        statusColor = 'text-red-600 dark:text-red-400';
        borderColor = 'border-red-500';
        bg = 'bg-red-50 dark:bg-red-900/20';
    } else if (inZ2) {
        status = 'TRIP';
        zone = 'ZONE 2';
        delay = '0.4s Delay'; // Standard Z2 delay
        statusColor = 'text-orange-600 dark:text-orange-400';
        borderColor = 'border-orange-500';
        bg = 'bg-orange-50 dark:bg-orange-900/20';
    } else if (inZ3) {
        status = 'TRIP';
        zone = 'ZONE 3';
        delay = '1.0s Delay'; // Standard Z3 delay
        statusColor = 'text-green-600 dark:text-green-400';
        borderColor = 'border-green-500';
        bg = 'bg-green-50 dark:bg-green-900/20';
    }

    // --- VISUALIZATION HELPERS ---
    const width = 600;
    const height = 600;
    const scale = 20; // pixels per Ohm
    const originX = 100;
    const originY = height - 100;

    const toPx = (r, x) => ({
        x: originX + (r * scale),
        y: originY - (x * scale)
    });

    const fp = toPx(faultR, faultX);

    // SVG Generator for Mho Circle
    const getMhoPath = (reach, mtaAngle) => {
        const radius = (reach * scale) / 2;
        const angRad = mtaAngle * Math.PI / 180;
        const cx = originX + radius * Math.cos(angRad);
        const cy = originY - radius * Math.sin(angRad);
        return { cx, cy, r: radius };
    };

    const z1 = getMhoPath(z1Reach, mta);
    const z2 = getMhoPath(z2Reach, mta);
    const z3 = getMhoPath(z3Reach, mta);

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden select-none font-sans">
            
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            {/* HEADER TOOLBAR */}
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shadow-sm z-20 print:hidden shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {/* Left Toggle */}
                        <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${!leftPanelOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                            {leftPanelOpen ? <PanelLeftClose className="w-4 h-4"/> : <PanelLeftOpen className="w-4 h-4"/>}
                        </button>
                        
                        <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/30"><Radar className="w-4 h-4"/></div>
                        <div>
                            <h1 className="font-bold text-sm leading-tight">DistanceLab <span className="text-blue-600">PRO</span></h1>
                        </div>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Activity className="w-4 h-4" />
                        <span>Impedance Protection Simulator (ANSI 21)</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => { setFaultR(4); setFaultX(6); }} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors text-slate-600 dark:text-slate-300">
                        <RefreshCcw className="w-3 h-3"/> Reset Fault
                    </button>
                    <button onClick={() => setShowHelp(true)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors" title="Guide">
                        <BookOpen className="w-4 h-4" />
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    {/* Right Toggle */}
                    <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${!rightPanelOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                        {rightPanelOpen ? <PanelRightClose className="w-4 h-4"/> : <PanelRightOpen className="w-4 h-4"/>}
                    </button>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex flex-1 overflow-hidden relative">
                
                {/* LEFT: SETTINGS PANEL */}
                <div className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shrink-0 transition-all duration-300 ease-in-out ${leftPanelOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                            <Layers className="w-4 h-4 text-slate-400"/> Relay Settings
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {/* Zone Reach Settings */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Zone 1 Reach</span>
                                    <span className="font-mono text-slate-900 dark:text-white">{z1Reach} Ω</span>
                                </div>
                                <input type="range" min="1" max="10" step="0.5" value={z1Reach} onChange={(e) => setZ1Reach(Number(e.target.value))} className="w-full h-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                <p className="text-[10px] text-slate-400 mt-1">Primary protection (typically 80% of line length).</p>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Zone 2 Reach</span>
                                    <span className="font-mono text-slate-900 dark:text-white">{z2Reach} Ω</span>
                                </div>
                                <input type="range" min={z1Reach} max="20" step="0.5" value={z2Reach} onChange={(e) => setZ2Reach(Number(e.target.value))} className="w-full h-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                                <p className="text-[10px] text-slate-400 mt-1">Overreaching backup (typically 120% of line length).</p>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Zone 3 Reach</span>
                                    <span className="font-mono text-slate-900 dark:text-white">{z3Reach} Ω</span>
                                </div>
                                <input type="range" min={z2Reach} max="30" step="0.5" value={z3Reach} onChange={(e) => setZ3Reach(Number(e.target.value))} className="w-full h-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg appearance-none cursor-pointer accent-green-500" />
                                <p className="text-[10px] text-slate-400 mt-1">Remote backup (covers adjacent line).</p>
                            </div>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800"/>

                        {/* Characteristic Settings */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                    <span>Max Torque Angle (MTA)</span>
                                    <span className="font-mono text-slate-900 dark:text-white">{mta}°</span>
                                </div>
                                <input type="range" min="30" max="85" step="1" value={mta} onChange={(e) => setMta(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200">Load Blinder</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={enableBlinder} onChange={(e) => setEnableBlinder(e.target.checked)} />
                                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                    </label>
                                </div>
                                {enableBlinder && (
                                    <div className="animate-fade-in">
                                        <div className="flex justify-between text-[10px] text-amber-600/70 dark:text-amber-400/70 mb-1">
                                            <span>Angle Limit</span>
                                            <span>+/- {loadAngle}°</span>
                                        </div>
                                        <input type="range" min="15" max="45" step="1" value={loadAngle} onChange={(e) => setLoadAngle(Number(e.target.value))} className="w-full h-1.5 bg-amber-200 dark:bg-amber-800 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER: R-X DIAGRAM */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex flex-col">
                    <div className="flex-1 relative m-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                            {/* Grid Pattern */}
                            <defs>
                                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="1"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />

                            {/* Axes */}
                            <line x1={originX} y1={0} x2={originX} y2={height} stroke="#475569" strokeWidth="2" />
                            <line x1={0} y1={originY} x2={width} y2={originY} stroke="#475569" strokeWidth="2" />
                            <text x={originX + 10} y={20} fill="#94a3b8" fontSize="12" fontWeight="bold">X (+jΩ)</text>
                            <text x={width - 40} y={originY - 10} fill="#94a3b8" fontSize="12" fontWeight="bold">R (Ω)</text>

                            {/* Load Blinder Wedge */}
                            {enableBlinder && (
                                <path 
                                    d={`M ${originX} ${originY} 
                                       L ${width} ${originY - (width-originX)*Math.tan(loadAngle*Math.PI/180)} 
                                       L ${width} ${originY + (width-originX)*Math.tan(loadAngle*Math.PI/180)} Z`}
                                    fill="#f59e0b" fillOpacity="0.15" stroke="none"
                                />
                            )}

                            {/* Zone Circles */}
                            {/* Z3 */}
                            <circle cx={z3.cx} cy={z3.cy} r={z3.r} fill="#22c55e" fillOpacity="0.1" stroke="#22c55e" strokeWidth="2" strokeDasharray="4,4" />
                            <text x={z3.cx + z3.r * 0.7} y={z3.cy - z3.r * 0.7} fill="#22c55e" fontSize="12" fontWeight="bold">Z3</text>
                            
                            {/* Z2 */}
                            <circle cx={z2.cx} cy={z2.cy} r={z2.r} fill="#f97316" fillOpacity="0.1" stroke="#f97316" strokeWidth="2" strokeDasharray="4,4" />
                            <text x={z2.cx + z2.r * 0.7} y={z2.cy - z2.r * 0.7} fill="#f97316" fontSize="12" fontWeight="bold">Z2</text>
                            
                            {/* Z1 */}
                            <circle cx={z1.cx} cy={z1.cy} r={z1.r} fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
                            <text x={z1.cx + z1.r * 0.7} y={z1.cy - z1.r * 0.7} fill="#ef4444" fontSize="12" fontWeight="bold">Z1</text>

                            {/* Fault Vector */}
                            <line x1={originX} y1={originY} x2={fp.x} y2={fp.y} stroke="white" strokeWidth="2" />
                            <circle cx={fp.x} cy={fp.y} r="6" fill={status.includes('TRIP') ? '#ef4444' : '#3b82f6'} stroke="white" strokeWidth="2" />
                            
                            {/* Live Value Tag */}
                            <rect x={fp.x + 10} y={fp.y - 25} width="80" height="40" rx="4" fill="rgba(15, 23, 42, 0.8)" />
                            <text x={fp.x + 15} y={fp.y - 10} fill="white" fontSize="10" fontWeight="bold">Zf = {Math.sqrt(faultR**2 + faultX**2).toFixed(1)}Ω</text>
                            <text x={fp.x + 15} y={fp.y + 5} fill="#94a3b8" fontSize="10">{faultR.toFixed(1)} + j{faultX.toFixed(1)}</text>
                        </svg>

                        {/* Status Overlay */}
                        <div className={`absolute bottom-6 right-6 p-4 rounded-xl border-2 shadow-2xl backdrop-blur-md min-w-[200px] flex items-center justify-between gap-4 ${bg} ${borderColor}`}>
                            <div>
                                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${statusColor}`}>Relay Status</div>
                                <div className={`text-2xl font-black ${statusColor}`}>{status}</div>
                                <div className="text-xs font-bold opacity-70 mt-1">{zone} {delay && `• ${delay}`}</div>
                            </div>
                            {status === 'TRIP' ? <Zap className={`w-8 h-8 ${statusColor} animate-pulse`} /> : status === 'BLOCKED' ? <Shield className={`w-8 h-8 ${statusColor}`} /> : <Activity className={`w-8 h-8 ${statusColor}`} />}
                        </div>
                    </div>
                </div>

                {/* RIGHT: FAULT SIMULATION */}
                <div className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${rightPanelOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`}>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                            <Target className="w-4 h-4 text-slate-400"/> Fault Simulation
                        </span>
                    </div>
                    
                    <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                            <div className="text-xs text-slate-500 font-bold uppercase mb-2">Impedance Vector (Z)</div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{Math.sqrt(faultR**2 + faultX**2).toFixed(2)} Ω</div>
                            <div className="text-xs text-slate-400 mt-1 font-mono">{Math.atan2(faultX, faultR).toFixed(2)} rad / {(Math.atan2(faultX, faultR) * 180 / Math.PI).toFixed(1)}°</div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Resistance (R)</label>
                                    <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">{faultR.toFixed(1)} Ω</span>
                                </div>
                                <input 
                                    type="range" min="0" max="25" step="0.1" value={faultR} 
                                    onChange={(e) => setFaultR(Number(e.target.value))}
                                    className="w-full h-2 bg-purple-200 dark:bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>0 Ω</span>
                                    <span>Arc Resistance</span>
                                    <span>25 Ω</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Reactance (X)</label>
                                    <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{faultX.toFixed(1)} Ω</span>
                                </div>
                                <input 
                                    type="range" min="0" max="25" step="0.1" value={faultX} 
                                    onChange={(e) => setFaultX(Number(e.target.value))}
                                    className="w-full h-2 bg-blue-200 dark:bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>0 Ω</span>
                                    <span>Line Length</span>
                                    <span>25 Ω</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    <strong>Tip:</strong> Moving the sliders effectively moves the fault location along the transmission line. High X means the fault is further away from the substation.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ENGINEERING FOOTER (COLLAPSIBLE) --- */}
            <div className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 ${footerOpen ? 'h-auto max-h-[40vh]' : 'h-8'} overflow-hidden flex flex-col`}>
                <button 
                    onClick={() => setFooterOpen(!footerOpen)} 
                    className="w-full h-8 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-slate-100 dark:border-slate-800 transition-colors shrink-0"
                >
                    <GraduationCap className="w-3 h-3"/> Knowledge Base <ChevronUp className={`w-3 h-3 transition-transform duration-300 ${footerOpen ? 'rotate-180' : ''}`}/>
                </button>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto">
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Map className="w-4 h-4"/> R-X Diagram</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Distance relays measure voltage and current to calculate Impedance ($Z=V/I$). Since the line impedance is proportional to length, this measures distance to the fault. The <strong>R-X Diagram</strong> plots this calculated Z in the complex plane.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Target className="w-4 h-4"/> Protection Zones</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong className="text-red-500">Zone 1:</strong> Instantaneous trip. Reaches 80-85% of the line to avoid overreaching the remote terminal.
                            <br/>
                            <strong className="text-orange-500">Zone 2:</strong> Time delayed (0.3-0.4s). Reaches 120% to cover the remaining line end and part of the next line.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Shield className="w-4 h-4"/> Mho Characteristic</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            The circular shape is called a "Mho" characteristic. It is inherently directional—it only trips for faults in the forward direction (quadrant 1) and does not operate for reverse faults (quadrant 3), providing security.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DistanceLab;