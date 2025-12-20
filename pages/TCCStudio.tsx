import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Activity, Plus, Trash2, AlertTriangle, CheckCircle, Search, 
    ZoomIn, ZoomOut, Maximize, RotateCcw, Save, Settings, 
    MousePointer2, ChevronDown, ChevronUp, Layers, Eye, EyeOff,
    Download, PlayCircle, Lock, Unlock, Move, BookOpen, Lightbulb, 
    GraduationCap, X, Zap, Clock, Shield, Info, FileText, CheckCircle2, 
    AlertOctagon, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
    Maximize2, Minimize2
} from 'lucide-react';

// --- 1. TYPES & CONSTANTS ---

const CurveType = {
    IEC_STANDARD_INVERSE: 'IEC_SI',
    IEC_VERY_INVERSE: 'IEC_VI',
    IEC_EXTREMELY_INVERSE: 'IEC_EI',
    ANSI_MODERATELY_INVERSE: 'ANSI_MI',
    ANSI_VERY_INVERSE: 'ANSI_VI',
    ANSI_EXTREMELY_INVERSE: 'ANSI_EI',
    DT_DEFINITE_TIME: 'DT',
    FUSE_FAST: 'FUSE_FAST'
};

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const CURVE_LIB = [
    { label: "IEC Standard Inverse (SI)", value: CurveType.IEC_STANDARD_INVERSE },
    { label: "IEC Very Inverse (VI)", value: CurveType.IEC_VERY_INVERSE },
    { label: "IEC Extremely Inverse (EI)", value: CurveType.IEC_EXTREMELY_INVERSE },
    { label: "ANSI Moderately Inverse", value: CurveType.ANSI_MODERATELY_INVERSE },
    { label: "ANSI Very Inverse", value: CurveType.ANSI_VERY_INVERSE },
    { label: "ANSI Extremely Inverse", value: CurveType.ANSI_EXTREMELY_INVERSE },
    { label: "Definite Time (50)", value: CurveType.DT_DEFINITE_TIME },
];

const SCENARIOS = [
    {
        id: 'dist_feeder',
        name: 'Distribution Feeder Grading',
        description: 'Classic source-to-load coordination (Blue feeder below Red incomer).',
        devices: [
            { id: 'dev_up', name: 'Substation Incomer', type: 'Relay', curve: CurveType.IEC_VERY_INVERSE, pickup: 600, tds: 0.40, instantaneous: 12000, ctRatio: 1200, color: '#ef4444', visible: true, locked: false, showBand: false },
            { id: 'dev_down', name: 'Feeder Relay', type: 'Relay', curve: CurveType.IEC_STANDARD_INVERSE, pickup: 200, tds: 0.15, instantaneous: 3000, ctRatio: 400, color: '#3b82f6', visible: true, locked: false, showBand: true }
        ]
    },
    {
        id: 'motor_start',
        name: 'Motor Protection',
        description: 'Ensuring relay allows motor starting current (Inrush) without tripping.',
        devices: [
            { id: 'dev_mot', name: 'Motor Protection', type: 'Relay', curve: CurveType.IEC_EXTREMELY_INVERSE, pickup: 100, tds: 0.8, instantaneous: 1200, ctRatio: 150, color: '#10b981', visible: true, locked: false, showBand: true }
        ]
    }
];

// --- 2. MATH ENGINE (IEC 60255 / IEEE C37.112) ---

const calculateTripTime = (current, pickup, tds, curveType, instantaneous) => {
    // 1. Instantaneous Check (50)
    if (instantaneous && current >= instantaneous) {
        return 0.01; // 10ms mechanical clearing time
    }

    // 2. Pickup Check
    if (current < pickup) return null; // No trip

    const M = current / pickup; // Multiple of pickup
    if (M <= 1.0) return null; // Asymptotic

    let time = 0;

    switch (curveType) {
        case CurveType.IEC_STANDARD_INVERSE:
            time = tds * (0.14 / (Math.pow(M, 0.02) - 1));
            break;
        case CurveType.IEC_VERY_INVERSE:
            time = tds * (13.5 / (M - 1));
            break;
        case CurveType.IEC_EXTREMELY_INVERSE:
            time = tds * (80 / (Math.pow(M, 2) - 1));
            break;
        case CurveType.ANSI_MODERATELY_INVERSE:
            time = tds * (0.0515 / (Math.pow(M, 0.02) - 1) + 0.1140);
            break;
        case CurveType.ANSI_VERY_INVERSE:
            time = tds * (19.61 / (Math.pow(M, 2) - 1) + 0.491);
            break;
        case CurveType.ANSI_EXTREMELY_INVERSE:
            time = tds * (28.2 / (Math.pow(M, 2) - 1) + 0.1217);
            break;
        case CurveType.DT_DEFINITE_TIME:
            time = tds; // Used as time delay
            break;
        default:
            return null;
    }

    return Math.max(0.01, time); // Minimum physical time
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
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><MousePointer2 className="w-4 h-4"/> 1. Interacting with Curves</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Select:</strong> Click any curve to select it. The settings panel on the right will activate.</li>
                        <li><strong>Drag Pickup (Horizontal):</strong> Drag the square handle at the bottom of a curve to adjust Pickup Current (Amps).</li>
                        <li><strong>Drag Time Dial (Vertical):</strong> Drag the circular handle on the curve to adjust the Time Dial Setting (TDS/TMS).</li>
                        <li><strong>Fault Slider:</strong> Drag the red vertical dashed line to simulate a specific fault current magnitude.</li>
                    </ul>
                </section>
                <section>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Shield className="w-4 h-4"/> 2. Achieving Coordination</h3>
                    <p>The goal is to ensure the <strong>Downstream</strong> device (closer to fault) trips before the <strong>Upstream</strong> device (source).</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>CTI (Coordination Time Interval):</strong> Maintain a margin of at least <strong>0.2s - 0.3s</strong> between curves.</li>
                        <li><strong>Check the Report:</strong> The left sidebar analyzes the trip sequence at the simulated fault current. Look for <span className="text-red-500 font-bold">Red Alerts</span> indicating a violation.</li>
                    </ul>
                </section>
                <section>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><ZoomIn className="w-4 h-4"/> 3. Navigation</h3>
                    <p>Use the Zoom buttons in the bottom right corner or the Reset button to fit all curves to the screen.</p>
                </section>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-b-2xl flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">Got it</button>
            </div>
        </div>
    </div>
);

// --- 4. MAIN COMPONENT ---

const TCCStudio = () => {
    // State
    const [devices, setDevices] = useState(JSON.parse(JSON.stringify(SCENARIOS[0].devices)));
    const [selectedId, setSelectedId] = useState(SCENARIOS[0].devices[0].id);
    const [faultAmps, setFaultAmps] = useState(2000);
    const [showHelp, setShowHelp] = useState(false);
    
    // Layout State
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [footerOpen, setFooterOpen] = useState(false); // Collapsed by default
    
    // Viewport (Log Scale Logic)
    const [view, setView] = useState({ minX: 10, maxX: 100000, minY: 0.01, maxY: 1000 });
    const [dims, setDims] = useState({ w: 800, h: 600 });
    const [cursor, setCursor] = useState(null); 
    
    const graphRef = useRef(null);
    const [draggingId, setDraggingId] = useState(null);
    const [dragType, setDragType] = useState(null); // 'PICKUP' | 'TDS' | 'FAULT'

    // Resize Observer
    useEffect(() => {
        if (!graphRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
        });
        ro.observe(graphRef.current);
        return () => ro.disconnect();
    }, [leftPanelOpen, rightPanelOpen, footerOpen]); // Re-observe when layout changes

    // --- ACTIONS ---
    const addDevice = () => {
        const id = `dev_${Date.now()}`;
        const newDev = {
            id, 
            name: `New Relay`, 
            type: 'Relay',
            curve: CurveType.IEC_STANDARD_INVERSE, 
            pickup: 100, 
            tds: 0.1,
            ctRatio: 100,
            color: COLORS[devices.length % COLORS.length], 
            visible: true, 
            locked: false,
            showBand: false
        };
        setDevices([...devices, newDev]);
        setSelectedId(id);
        if (!rightPanelOpen) setRightPanelOpen(true); // Open panel to edit
    };

    const updateDevice = (id, patch) => {
        setDevices(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    };

    const removeDevice = (id) => {
        setDevices(prev => prev.filter(d => d.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const loadScenario = (idx) => {
        const s = SCENARIOS[idx];
        setDevices(JSON.parse(JSON.stringify(s.devices))); 
        setSelectedId(s.devices[0].id);
        setFaultAmps(2000);
        setLeftPanelOpen(true);
        setRightPanelOpen(true);
    };

    // --- MATH HELPERS (Log-Log) ---
    const logMinX = Math.log10(view.minX);
    const logMaxX = Math.log10(view.maxX);
    const logMinY = Math.log10(view.minY);
    const logMaxY = Math.log10(view.maxY);

    const toPxX = (val) => ((Math.log10(val) - logMinX) / (logMaxX - logMinX)) * dims.w;
    const toPxY = (val) => dims.h - ((Math.log10(val) - logMinY) / (logMaxY - logMinY)) * dims.h;
    
    const fromPxX = (px) => Math.pow(10, logMinX + (px / dims.w) * (logMaxX - logMinX));
    const fromPxY = (py) => Math.pow(10, logMinY + ((dims.h - py) / dims.h) * (logMaxY - logMinY));

    // --- RENDERERS ---
    
    const GridLines = useMemo(() => {
        const lines = [];
        // Vertical (Current)
        for (let i = Math.ceil(logMinX); i <= Math.floor(logMaxX); i++) {
            const x = toPxX(Math.pow(10, i));
            lines.push(<line key={`maj-x-${i}`} x1={x} y1={0} x2={x} y2={dims.h} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />);
            lines.push(<text key={`lbl-x-${i}`} x={x + 4} y={dims.h - 5} className="text-[10px] fill-slate-400 font-bold select-none">{Math.pow(10, i) >= 1000 ? `${Math.pow(10,i)/1000}k` : Math.pow(10,i)}</text>);
            for (let j = 2; j < 10; j++) {
                const val = j * Math.pow(10, i);
                if (val > view.minX && val < view.maxX) {
                    const xm = toPxX(val);
                    lines.push(<line key={`min-x-${val}`} x1={xm} y1={0} x2={xm} y2={dims.h} stroke="currentColor" strokeOpacity={0.03} strokeWidth={1} />);
                }
            }
        }
        // Horizontal (Time)
        for (let i = Math.ceil(logMinY); i <= Math.floor(logMaxY); i++) {
            const y = toPxY(Math.pow(10, i));
            lines.push(<line key={`maj-y-${i}`} x1={0} y1={y} x2={dims.w} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />);
            lines.push(<text key={`lbl-y-${i}`} x={5} y={y - 4} className="text-[10px] fill-slate-400 font-bold select-none">{Math.pow(10, i)}s</text>);
            for (let j = 2; j < 10; j++) {
                const val = j * Math.pow(10, i);
                if (val > view.minY && val < view.maxY) {
                    const ym = toPxY(val);
                    lines.push(<line key={`min-y-${val}`} x1={0} y1={ym} x2={dims.w} y2={ym} stroke="currentColor" strokeOpacity={0.03} strokeWidth={1} />);
                }
            }
        }
        return <g className="text-slate-500 pointer-events-none">{lines}</g>;
    }, [view, dims]);

    // Added explicit type for dev prop to resolve TS errors
    const CurvePath = ({ dev }: { dev: any }) => {
        if (!dev.visible) return null;
        let d = "";
        let dMin = "", dMax = ""; // Band paths

        const startI = Math.max(dev.pickup, view.minX);
        const endI = dev.instantaneous ? Math.min(dev.instantaneous, view.maxX) : view.maxX;
        
        // Vertical Pickup Line
        if (dev.pickup >= view.minX && dev.pickup <= view.maxX) {
            const x = toPxX(dev.pickup);
            // Fix: Expected 5 arguments, but got 4.
            const topT = calculateTripTime(dev.pickup * 1.01, dev.pickup, dev.tds, dev.curve, dev.instantaneous);
            const yTop = topT ? Math.max(0, toPxY(topT)) : 0;
            d += `M ${x} ${dims.h} L ${x} ${yTop} `;
        }

        // Curve Calculation
        const points = [];
        // Adaptive sampling for smoother curves
        for (let i = startI * 1.01; i <= endI; i *= 1.05) {
            // Fix: Expected 5 arguments, but got 4.
            const t = calculateTripTime(i, dev.pickup, dev.tds, dev.curve, dev.instantaneous);
            if (t && t >= view.minY && t <= view.maxY) {
                points.push({ x: toPxX(i), y: toPxY(t), t });
            }
        }
        points.forEach((p, i) => d += `${i === 0 && d === "" ? 'M' : 'L'} ${p.x} ${p.y} `);

        // Instantaneous Line
        if (dev.instantaneous && dev.instantaneous <= view.maxX) {
            const instX = toPxX(dev.instantaneous);
            const lastY = points.length > 0 ? points[points.length-1].y : toPxY(100);
            d += `L ${instX} ${lastY} L ${instX} ${toPxY(0.01)}`;
        }

        // Tolerance Band (+/- 10% Time)
        if (dev.showBand && points.length > 0) {
            const minPoints = points.map(p => ({ x: p.x, y: toPxY(p.t * 0.9) }));
            const maxPoints = points.map(p => ({ x: p.x, y: toPxY(p.t * 1.1) }));
            dMin = maxPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            dMax = [...minPoints].reverse().map((p, i) => `L ${p.x} ${p.y}`).join(' ');
        }

        const isSelected = selectedId === dev.id;
        const handlePickX = toPxX(dev.pickup);
        const handleTDSX = toPxX(dev.pickup * 5); 
        // Fix: Expected 5 arguments, but got 4.
        const handleTDSY = toPxY(calculateTripTime(dev.pickup*5, dev.pickup, dev.tds, dev.curve, dev.instantaneous) || 10);

        return (
            <g className="group">
                {dev.showBand && <path d={`${dMin} ${dMax} Z`} fill={dev.color} fillOpacity="0.1" stroke="none" />}
                <path 
                    d={d} fill="none" stroke={dev.color} 
                    strokeWidth={isSelected ? 3 : 2} 
                    strokeDasharray={dev.locked ? "5,5" : ""}
                    className={`transition-all duration-200 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-80'} hover:stroke-[4px] hover:opacity-100 shadow-xl`}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(dev.id); if(!rightPanelOpen) setRightPanelOpen(true); }}
                />
                
                {/* Curve Label */}
                {points.length > 10 && (
                    <text 
                        x={points[Math.floor(points.length/2)].x + 8} 
                        y={points[Math.floor(points.length/2)].y - 8} 
                        fill={dev.color} fontSize="11" fontWeight="bold" 
                        className="pointer-events-none select-none shadow-sm bg-white/50"
                    >
                        {dev.name}
                    </text>
                )}

                {/* Interactive Handles */}
                {isSelected && !dev.locked && (
                    <g>
                        {/* Pickup Handle */}
                        <rect 
                            x={handlePickX - 5} y={dims.h - 12} width={10} height={12} 
                            fill={dev.color} stroke="white" strokeWidth="1"
                            className="cursor-ew-resize hover:scale-125 transition-transform"
                            onMouseDown={(e) => { e.stopPropagation(); setDraggingId(dev.id); setDragType('PICKUP'); }}
                        />
                        {/* TDS Handle */}
                        <circle 
                            cx={handleTDSX} cy={handleTDSY} r={5}
                            fill={dev.color} stroke="white" strokeWidth="2"
                            className="cursor-ns-resize hover:scale-125 transition-transform"
                            onMouseDown={(e) => { e.stopPropagation(); setDraggingId(dev.id); setDragType('TDS'); }}
                        />
                    </g>
                )}
            </g>
        );
    };

    const FaultLine = () => {
        const x = toPxX(faultAmps);
        if (x < 0 || x > dims.w) return null;
        return (
            <g className="group cursor-ew-resize" onMouseDown={(e) => { e.stopPropagation(); setDraggingId('FAULT'); setDragType('FAULT'); }}>
                <line x1={x} y1={0} x2={x} y2={dims.h} stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" className="opacity-70 group-hover:opacity-100 transition-opacity" />
                <polygon points={`${x},0 ${x-6},10 ${x+6},10`} fill="#ef4444" className="drop-shadow-md group-hover:scale-125 transition-transform origin-top" />
                <text x={x + 8} y={20} fill="#ef4444" fontSize="11" fontWeight="bold" className="pointer-events-none select-none">Fault: {faultAmps.toFixed(0)}A</text>
            </g>
        );
    };

    // --- INTERACTION HANDLERS ---
    const handleMouseMove = (e) => {
        if (!graphRef.current) return;
        const rect = graphRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Log-Log Cursor
        const curAmps = fromPxX(mx);
        const curTime = fromPxY(my);
        setCursor({ x: curAmps, y: curTime });

        if (!draggingId) return;

        if (dragType === 'FAULT') {
            setFaultAmps(Math.max(view.minX, Math.min(curAmps, view.maxX)));
        } 
        else if (dragType === 'PICKUP') {
            updateDevice(draggingId, { pickup: Math.round(Math.max(10, curAmps)) });
        }
        else if (dragType === 'TDS') {
            const dev = devices.find(d => d.id === draggingId);
            if (dev) {
                // Approximate new TDS by checking time at current MouseX
                // T = TDS * (CurveMath) => TDS = T / CurveMath
                // Need to use the device's specific curve formula inverse
                // Fix: Expected 5 arguments, but got 4.
                const k = calculateTripTime(curAmps, dev.pickup, 1.0, dev.curve, dev.instantaneous); // Time at TDS=1
                if (k) updateDevice(draggingId, { tds: Number(Math.max(0.01, curTime / k).toFixed(2)) });
            }
        }
    };

    // --- SMART ANALYSIS ENGINE ---
    const coordinationReport = useMemo(() => {
        const active = devices.filter(d => d.visible);
        // Calculate trip time for each device at fault current
        const trips = active.map(d => ({
            id: d.id, name: d.name, color: d.color,
            time: calculateTripTime(faultAmps, d.pickup, d.tds, d.curve, d.instantaneous)
        })).filter(t => t.time !== null).sort((a,b) => a.time - b.time);

        // Analyze margins
        const report = [];
        for (let i = 0; i < trips.length; i++) {
            const trip = trips[i];
            report.push({ type: 'TRIP', ...trip });
            
            // Check margin to next slower device
            if (i < trips.length - 1) {
                const nextTrip = trips[i+1];
                const margin = nextTrip.time - trip.time;
                const isViolation = margin < 0.2; // CTI Standard
                report.push({ 
                    type: 'MARGIN', 
                    val: margin, 
                    violation: isViolation,
                    msg: isViolation ? `Critical: Increase Time Dial on ${nextTrip.name}` : 'Coordinated'
                });
            }
        }
        return report;
    }, [devices, faultAmps]);

    const selectedDevice = devices.find(d => d.id === selectedId);

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden select-none font-sans"
             onMouseMove={handleMouseMove} onMouseUp={() => setDraggingId(null)} onMouseLeave={() => { setDraggingId(null); setCursor(null); }}>
            
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            {/* HEADER TOOLBAR */}
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shadow-sm z-20 print:hidden shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {/* Left Toggle */}
                        <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${!leftPanelOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                            {leftPanelOpen ? <PanelLeftClose className="w-4 h-4"/> : <PanelLeftOpen className="w-4 h-4"/>}
                        </button>
                        
                        <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/30"><Activity className="w-4 h-4"/></div>
                        <div>
                            <h1 className="font-bold text-sm leading-tight">TCC Studio <span className="text-blue-600">PRO</span></h1>
                        </div>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">
                            <Layers className="w-3 h-3 text-blue-500"/> Scenarios <ChevronDown className="w-3 h-3"/>
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hidden group-hover:block z-50 p-2">
                            {SCENARIOS.map((s, i) => (
                                <button key={s.id} onClick={() => loadScenario(i)} className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{s.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{s.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                        <Zap className="w-3 h-3 text-amber-500 fill-current animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Simulated Fault:</span>
                        <input 
                            type="number" value={faultAmps} onChange={(e) => setFaultAmps(Number(e.target.value))} 
                            className="w-16 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white outline-none text-right border-b border-slate-300 dark:border-slate-600 focus:border-blue-500"
                        />
                        <span className="text-[10px] text-slate-500 font-bold">A</span>
                    </div>
                    <button onClick={addDevice} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                        <Plus className="w-3 h-3"/> Add Relay
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
                
                {/* LEFT: INTELLIGENT REPORT */}
                <div className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shrink-0 transition-all duration-300 ease-in-out ${leftPanelOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}>
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                            <Clock className="w-3 h-3 text-slate-400"/> Coordination Check
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
                        {/* Timeline Spine */}
                        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800"></div>

                        {coordinationReport.length > 0 ? coordinationReport.map((item, i) => (
                            <div key={i} className="relative pl-10 animate-fade-in-up" style={{animationDelay: `${i*50}ms`}}>
                                {item.type === 'TRIP' ? (
                                    <div className="relative group">
                                        <div className="absolute -left-[30px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-sm z-10" style={{backgroundColor: item.color}}></div>
                                        <div className="p-2 rounded-lg border bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer" style={{borderColor: item.color}} onClick={() => setSelectedId(item.id)}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Trip Initiated</span>
                                                </div>
                                                <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">{item.time.toFixed(3)}s</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="my-1 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm flex items-center gap-1.5 ${item.violation ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'}`}>
                                                {item.violation ? <AlertOctagon className="w-3 h-3"/> : <CheckCircle2 className="w-3 h-3"/>}
                                                Margin: {item.val.toFixed(3)}s
                                            </div>
                                        </div>
                                        {item.violation && (
                                            <div className="text-[10px] text-red-600 italic bg-red-50/50 p-1 rounded border-l-2 border-red-400">
                                                {item.msg}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs text-center px-6">
                                <AlertTriangle className="w-8 h-8 mb-2 opacity-20"/>
                                No devices operate at {faultAmps}A. <br/>Drag the Red Fault Line to test.
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Visible Devices</div>
                        <div className="flex flex-wrap gap-2">
                            {devices.map(d => (
                                <button key={d.id} onClick={() => updateDevice(d.id, {visible: !d.visible})} 
                                        className={`w-3 h-3 rounded-full transition-all border ${d.visible ? 'opacity-100 scale-100' : 'opacity-30 scale-75 grayscale'}`} 
                                        style={{backgroundColor: d.color, borderColor: d.color}} 
                                        title={d.name} 
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER: INTERACTIVE GRAPH */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden cursor-crosshair flex flex-col">
                    <div ref={graphRef} className="flex-1 relative m-2 bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                        <svg width={dims.w} height={dims.h} className="absolute inset-0 block">
                            {GridLines}
                            {/* Fix: Type '{ key: any; dev: any; }' is not assignable to type '{ dev: any; }'. */}
                            {devices.map(dev => <CurvePath key={dev.id} dev={dev} />)}
                            <FaultLine />
                        </svg>
                        
                        {/* Cursor Tooltip */}
                        {cursor && (
                            <div className="absolute top-4 right-4 bg-slate-900/90 text-white p-2 rounded-lg text-[10px] font-mono backdrop-blur-md pointer-events-none border border-slate-700 shadow-2xl z-30 flex flex-col gap-1 min-w-[120px]">
                                <div className="flex justify-between gap-4"><span className="text-slate-400">Current:</span> <span className="font-bold text-amber-400">{cursor.x.toFixed(1)} A</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-400">Time:</span> <span className="font-bold text-blue-400">{cursor.y.toFixed(3)} s</span></div>
                            </div>
                        )}

                        {/* View Controls */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                            <button onClick={() => setView(v => ({...v, minX: v.minX*0.8, maxX: v.maxX*1.2}))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg hover:bg-slate-50 transition-transform active:scale-95"><ZoomOut className="w-4 h-4 text-slate-500"/></button>
                            <button onClick={() => setView({ minX: 10, maxX: 100000, minY: 0.01, maxY: 1000 })} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg hover:bg-slate-50 transition-transform active:scale-95"><RotateCcw className="w-4 h-4 text-slate-500"/></button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: SETTINGS PANEL */}
                <div className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${rightPanelOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`}>
                    {selectedDevice ? (
                        <>
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: selectedDevice.color}}></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parameters</span>
                                </div>
                                <button onClick={() => removeDevice(selectedDevice.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                            
                            <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                                {/* Device Identity */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Relay Name</label>
                                        <input 
                                            type="text" value={selectedDevice.name} 
                                            onChange={(e) => updateDevice(selectedDevice.id, { name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">CT Ratio</label>
                                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2">
                                                <input 
                                                    type="number" value={selectedDevice.ctRatio} 
                                                    onChange={(e) => updateDevice(selectedDevice.id, { ctRatio: Number(e.target.value) })}
                                                    className="w-full bg-transparent border-none py-1.5 text-xs font-mono font-bold outline-none"
                                                />
                                                <span className="text-[10px] text-slate-400 font-bold">:1</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Color</label>
                                            <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                {COLORS.slice(0,4).map(c => (
                                                    <button key={c} onClick={() => updateDevice(selectedDevice.id, { color: c })} className={`w-4 h-4 rounded-full border-2 transition-transform ${selectedDevice.color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`} style={{backgroundColor: c}} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100 dark:border-slate-800"/>

                                {/* Curve Characteristic */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Characteristic Curve</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedDevice.curve}
                                            onChange={(e) => updateDevice(selectedDevice.id, { curve: e.target.value })}
                                            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-8 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
                                        >
                                            {CURVE_LIB.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-3 w-3 h-3 text-slate-400 pointer-events-none"/>
                                    </div>
                                </div>

                                {/* Settings Sliders */}
                                <div className="space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase">Pickup (Is)</label>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono leading-none">{selectedDevice.pickup} A</div>
                                            </div>
                                        </div>
                                        <input 
                                            type="range" min="10" max="2000" step="10" value={selectedDevice.pickup} 
                                            onChange={(e) => updateDevice(selectedDevice.id, { pickup: Number(e.target.value) })}
                                            className="w-full h-1.5 bg-blue-200 dark:bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase">Time Dial (TMS)</label>
                                            <div className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono leading-none">{selectedDevice.tds}</div>
                                        </div>
                                        <input 
                                            type="range" min="0.01" max="1.5" step="0.01" value={selectedDevice.tds} 
                                            onChange={(e) => updateDevice(selectedDevice.id, { tds: Number(e.target.value) })}
                                            className="w-full h-1.5 bg-purple-200 dark:bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                    </div>
                                </div>

                                {/* Instantaneous Toggle */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Instantaneous (50)</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={!!selectedDevice.instantaneous} onChange={(e) => updateDevice(selectedDevice.id, { instantaneous: e.target.checked ? selectedDevice.pickup * 10 : undefined })} />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                
                                {selectedDevice.instantaneous && (
                                    <div className="animate-fade-in -mt-4 p-3 pt-0 bg-slate-50 dark:bg-slate-800 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-700">
                                        <input 
                                            type="number" value={selectedDevice.instantaneous} 
                                            onChange={(e) => updateDevice(selectedDevice.id, { instantaneous: Number(e.target.value) })}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1.5 text-xs font-mono font-bold"
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-8 text-center">
                            <MousePointer2 className="w-10 h-10 mb-4 opacity-20" />
                            <p>Select a curve to edit settings</p>
                        </div>
                    )}
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
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4"/> Time Dial (TMS)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            The <strong>Time Multiplier Setting (TMS)</strong>, also known as Time Dial (TDS), vertically shifts the curve. It acts as a global multiplier for the trip time. 
                            <br/><br/>
                            <em className="text-slate-500">Formula (IEC):</em> t = TMS × [k / ((I/Is)^α - 1)]
                        </p>
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Shield className="w-4 h-4"/> Coordination Time Interval (CTI)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            The CTI is the safety margin required between two devices to ensure selectivity. 
                            <br/>
                            <strong>Standard: 0.2s - 0.4s</strong>. This accounts for:
                        </p>
                        <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                            <li>Breaker opening time (0.05s - 0.1s)</li>
                            <li>Relay overshoot (0.05s)</li>
                            <li>CT errors & Safety margin (0.1s)</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4"/> Instantaneous (50)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            The ANSI 50 element trips with no intentional delay (typically &lt;30ms). It is used for high-current faults close to the source. 
                            <br/><br/>
                            <strong>Warning:</strong> Ensure the 50 pickup is set <em>above</em> the maximum through-fault current of the downstream transformer to avoid "over-reaching."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TCCStudio;