import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, HelpCircle, Book, AlertTriangle, Settings, MonitorPlay, GraduationCap, Award, Compass, Activity, Zap, CheckCircle2, XCircle, Play, ShieldCheck, Info , Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import Slider from '../components/Slider';
import TheoryLibrary from '../components/TheoryLibrary';
import { GROUND_FAULT_THEORY_CONTENT } from '../data/learning-modules/ground-fault';
import SEO from "../components/SEO";

// ============================== CONSTANTS ==============================
const FAULT_TYPES = [
    { id: 'slg', label: 'Single Line-to-Ground (SLG)', phases: [1,0,0], color: '#ef4444', desc: 'Most common (65-80% of faults)' },
    { id: 'dlg', label: 'Double Line-to-Ground (DLG)', phases: [1,1,0], color: '#f59e0b', desc: 'Two phases to ground' },
    { id: 'lll', label: 'Three Phase to Ground', phases: [1,1,1], color: '#8b5cf6', desc: 'Symmetric, no residual' },
];
const GROUNDING = [
    { id: 'solid', label: 'Solidly Grounded', zg: 0 },
    { id: 'low_z', label: 'Low-Z Grounded (R=5Ω)', zg: 5 },
    { id: 'high_z', label: 'High-Z Grounded (R=100Ω)', zg: 100 },
    { id: 'ungrounded', label: 'Ungrounded (Isolated)', zg: 100000 },
];
const QUIZ_DATA = {
    easy: [
        { q: "Which fault type is most common on overhead lines?", opts: ["Three-phase", "Line-to-line", "Single line-to-ground", "Open circuit"], ans: 2, why: "SLG faults account for 65-80% of all faults due to tree contact, lightning, and insulator flashover." },
        { q: "Residual current (3I₀) is measured using:", opts: ["One CT", "Two CTs", "Sum of 3 phase CTs", "VT"], ans: 2, why: "3I₀ = Ia + Ib + Ic. Under normal balanced load, the sum is zero. During a ground fault, the residual appears." },
        { q: "ANSI 50N designates:", opts: ["Time overcurrent", "Instantaneous ground OC", "Directional ground", "Differential"], ans: 1, why: "50N = Instantaneous overcurrent, ground. 51N = Time overcurrent, ground. 67N = Directional ground." },
        { q: "In a solidly grounded system, ground fault current is:", opts: ["Very low", "Comparable to phase fault current", "Zero", "DC only"], ans: 1, why: "Solidly grounded systems provide a low-impedance return path, so ground fault current is high, enabling reliable relay operation." },
        { q: "Zero sequence current exists only during:", opts: ["Balanced load", "Power swings", "Ground faults", "Motor starting"], ans: 2, why: "Zero sequence components appear only when the three-phase system is asymmetric with respect to ground." },
    ],
    medium: [
        { q: "Directional ground element (67N) uses which polarizing quantity?", opts: ["Positive sequence V", "Zero sequence V (3V₀)", "Phase current", "Frequency"], ans: 1, why: "The 67N element uses 3V₀ as the polarizing quantity and 3I₀ as the operating quantity. The angle between them determines direction." },
        { q: "In a high-impedance grounded system, ground fault current is typically:", opts: ["10-25kA", "1-10A", "Above phase fault level", "Same as load current"], ans: 1, why: "High-Z grounding limits ground fault current to a few amps, requiring sensitive detection but allowing continued operation." },
        { q: "The 'watt-metric' method for ground fault direction measures:", opts: ["Voltage magnitude", "Active power component of 3I₀ × 3V₀", "Reactive power only", "Impedance"], ans: 1, why: "The watt-metric method measures the real component of zero-sequence power. Forward fault = positive watts, reverse = negative." },
        { q: "Sensitive earth fault (SEF) relays typically have pickup as low as:", opts: ["100A", "1-5% of CT primary", "50% of load", "Equal to phase pickup"], ans: 1, why: "SEF relays can pick up at 1-5% of CT primary, enabling detection of high-impedance faults that produce very small currents." },
        { q: "Per IEEE C37.112, the ground fault relay must coordinate with:", opts: ["Only upstream relays", "Fuses, reclosers, and downstream relays", "Only breakers", "Transformers"], ans: 1, why: "Ground fault coordination requires studying the entire path from source to fault, including fuses, reclosers, and sectionalizers." },
    ],
    expert: [
        { q: "Cross-country faults involve:", opts: ["Faults on same phase", "SLG faults on different phases at different locations", "Three-phase faults", "Open conductors"], ans: 1, why: "Cross-country faults are simultaneous SLG faults on different phases at different locations, creating a complex zero-sequence current circulation that can confuse directional elements." },
        { q: "In an ungrounded system, the first ground fault causes:", opts: ["High current", "Zero current flow but VLL on healthy phases to ground", "System trip", "Neutral shift"], ans: 1, why: "The first ground fault on an ungrounded system causes zero fault current but shifts the neutral, raising the healthy phase voltages to √3× normal." },
        { q: "Sympathetic ground fault tripping occurs when:", opts: ["CT saturates", "Zero-sequence mutual coupling causes false 67N operation", "Voltage is low", "Frequency drops"], ans: 1, why: "Mutual coupling between parallel lines can inject zero-sequence current into the unfaulted line, causing its 67N relay to see an apparent forward fault." },
        { q: "The break-point current for coordination between a fuse and 51N relay is:", opts: ["Maximum load current", "The intersection of fuse TCC and relay TCC", "Nominal current", "CT saturation current"], ans: 1, why: "The fuse minimum-melt curve must clear before the 51N relay operates at the breakpoint current for proper coordination." },
        { q: "Restricted earth fault (REF) protection is a form of:", opts: ["Overcurrent protection", "Differential protection limited to a zone defined by CTs", "Distance protection", "Frequency protection"], ans: 1, why: "REF uses differential principle (I in = I out) but is restricted to detecting ground faults within a specific zone (e.g., transformer winding)." },
    ],
};

// ============================== PHASOR CANVAS ==============================
const PhasorDiagram = ({ isDark, faultPhases, groundFactor, tripStatus }: { isDark: boolean; faultPhases: number[]; groundFactor: number; tripStatus: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        const w = cvs.width = cvs.offsetWidth * 2;
        const h = cvs.height = cvs.offsetHeight * 2;
        ctx.scale(2, 2);
        const cw = w / 2, ch = h / 2;
        const cx = cw / 2, cy = ch / 2;
        const R = Math.min(cx, cy) * 0.7;

        // Background
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, cw, ch);

        // Grid circles
        for (let r = 0.25; r <= 1.0; r += 0.25) {
            ctx.beginPath();
            ctx.arc(cx, cy, R * r, 0, Math.PI * 2);
            ctx.strokeStyle = isDark ? 'rgba(100,116,139,0.2)' : 'rgba(148,163,184,0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        // Axes
        ctx.beginPath();
        ctx.moveTo(cx - R * 1.1, cy); ctx.lineTo(cx + R * 1.1, cy);
        ctx.moveTo(cx, cy - R * 1.1); ctx.lineTo(cx, cy + R * 1.1);
        ctx.strokeStyle = isDark ? 'rgba(100,116,139,0.3)' : 'rgba(148,163,184,0.4)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Phase angles: A=0°, B=-120°, C=+120°
        const phases = [
            { name: 'Ia', angle: 0, color: '#ef4444', faulted: faultPhases[0] },
            { name: 'Ib', angle: -120, color: '#22c55e', faulted: faultPhases[1] },
            { name: 'Ic', angle: 120, color: '#3b82f6', faulted: faultPhases[2] },
        ];

        // Draw phase phasors
        phases.forEach(p => {
            const mag = p.faulted ? 0.3 : 1.0; // Faulted phases collapse
            const rad = (p.angle * Math.PI) / 180;
            const ex = cx + Math.cos(rad) * R * mag;
            const ey = cy - Math.sin(rad) * R * mag;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.faulted ? 3 : 2;
            ctx.stroke();
            // Arrow
            const arrowSize = 8;
            const arrowAngle = Math.atan2(cy - ey, ex - cx);
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex - arrowSize * Math.cos(arrowAngle - 0.4), ey + arrowSize * Math.sin(arrowAngle - 0.4));
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex - arrowSize * Math.cos(arrowAngle + 0.4), ey + arrowSize * Math.sin(arrowAngle + 0.4));
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            // Label
            ctx.fillStyle = p.color;
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillText(p.name, ex + 6, ey - 6);
        });

        // Draw 3I₀ (residual) — only if ground fault exists
        const hasFault = faultPhases.some(p => p === 1) && !faultPhases.every(p => p === 1);
        if (hasFault) {
            const i0Mag = 0.8;
            const i0Angle = -90; // typically lags
            const rad = (i0Angle * Math.PI) / 180;
            const ex = cx + Math.cos(rad) * R * i0Mag;
            const ey = cy - Math.sin(rad) * R * i0Mag;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText(`3I₀`, ex + 8, ey);
        }

        // Draw 3V₀ polarizing quantity
        if (hasFault) {
            const v0Mag = 0.5;
            // 3V0 leads 3I0 by approx 90-110 deg for forward faults
            const v0Angle = tripStatus.includes('REVERSE') ? -90 : 90; 
            const rad = (v0Angle * Math.PI) / 180;
            const ex = cx + Math.cos(rad) * R * v0Mag;
            const ey = cy - Math.sin(rad) * R * v0Mag;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#a855f7';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillText(`3V₀`, ex + 8, ey - 4);
        }

        // Status label
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.6)';
        ctx.fillText('PHASOR DIAGRAM', 8, 16);
        if (tripStatus) {
            ctx.fillStyle = tripStatus === 'TRIP' ? '#ef4444' : '#22c55e';
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.fillText(tripStatus, cw / 2 - 20, ch - 10);
        }

    }, [isDark, faultPhases, tripStatus]);

    return <canvas ref={canvasRef} className="w-full rounded-xl border" style={{ height: 320, border: isDark ? '1px solid rgb(30,41,59)' : '1px solid rgb(226,232,240)' }} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [faultType, setFaultType] = useState(FAULT_TYPES[0]);
    const [grounding, setGrounding] = useState(GROUNDING[0]);
    const [pickup50N, setPickup50N] = useState(200);
    const [pickup51N, setPickup51N] = useState(50);
    const [directional, setDirectional] = useState(true);
    const [faultLocation, setFaultLocation] = useState<'forward' | 'reverse'>('forward');
    const [faultCurrent, setFaultCurrent] = useState(0);
    const [residualI, setResidualI] = useState(0);
    const [simRunning, setSimRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [tripStatus, setTripStatus] = useState('');
    const [events, setEvents] = useState<{ time: number; msg: string; type: string }[]>([]);
    const timerRef = useRef<any>(null);

    const addEvent = useCallback((msg: string, type: string = 'info') => {
        setEvents(prev => [{ time: elapsed, msg, type }, ...prev].slice(0, 20));
    }, [elapsed]);

    const injectFault = () => {
        setSimRunning(true);
        setElapsed(0);
        setTripStatus('');
        
        // Mathematical Derivation using Symmetrical Components (Sequence Networks)
        const Vln = 69000 / Math.sqrt(3); // 69kV system (L-N)
        const Z1 = 2.0; // Positive Sequence Impedance (Ohms)
        const Z2 = 2.0; // Negative Sequence Impedance (Ohms)
        const Z0_line = 6.0; // Zero Sequence Impedance of line
        const Zg = grounding.zg;
        const Z0 = Z0_line + 3 * Zg;
        
        let I1 = 0, I2 = 0, I0 = 0, faultI = 0;
        
        if (faultType.id === 'slg') { // Single Line to Ground
            I1 = Vln / (Z1 + Z2 + Z0);
            I2 = I1;
            I0 = I1;
            faultI = 3 * I0;
        } else if (faultType.id === 'dlg') { // Double Line to Ground
            I1 = Vln / (Z1 + (Z2 * Z0) / (Z2 + Z0));
            I0 = -I1 * (Z2 / (Z2 + Z0));
            I2 = -I1 * (Z0 / (Z2 + Z0));
            faultI = 3 * I0;
        } else if (faultType.id === 'lll') { // 3-Phase
            I1 = Vln / Z1;
            I0 = 0;
            faultI = I1;
        }
        
        const res = Math.abs(3 * I0);
        faultI = Math.abs(faultI);

        setFaultCurrent(faultI);
        setResidualI(res);
        setEvents([{ time: 0, msg: `⚡ ${faultType.label} fault injected — If = ${faultI.toFixed(0)}A, 3I₀ = ${res.toFixed(0)}A (via Sym. Components)`, type: 'fault' }]);
    };

    useEffect(() => {
        if (!simRunning) return;
        timerRef.current = setInterval(() => { setElapsed(prev => prev + 0.05); }, 50);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [simRunning]);

    useEffect(() => {
        if (!simRunning) return;
        
        // 67N Directional Math Check
        // MTA typically -45 to -90 deg. If faultLocation is reverse, angle = +90 (out of bounds)
        let isForward = faultLocation === 'forward';
        let isDirectionalBlocked = directional && !isForward;

        // 50N check (instantaneous)
        if (elapsed >= 0.05 && residualI >= pickup50N && !tripStatus) {
            if (isDirectionalBlocked) {
                setTripStatus('REVERSE BLOCK');
                setSimRunning(false);
                setEvents(prev => [{ time: elapsed, msg: `🛡️ 67N BLOCKED — Fault is REVERSE (Current angle out of MTA boundaries)`, type: 'warn' }, ...prev]);
            } else {
                setTripStatus('TRIP');
                setSimRunning(false);
                setEvents(prev => [{ time: elapsed, msg: `🔴 50N TRIP — 3I₀ = ${residualI.toFixed(0)}A ≥ pickup ${pickup50N}A (instantaneous)`, type: 'trip' }, ...prev]);
            }
        }
        // 51N check (time delayed ~0.5s)
        if (elapsed >= 0.5 && residualI >= pickup51N && residualI < pickup50N && !tripStatus) {
            if (isDirectionalBlocked) {
                setTripStatus('REVERSE BLOCK');
                setSimRunning(false);
                setEvents(prev => [{ time: elapsed, msg: `🛡️ 67N TIME BLOCKED — Fault is REVERSE`, type: 'warn' }, ...prev]);
            } else {
                setTripStatus('TRIP');
                setSimRunning(false);
                setEvents(prev => [{ time: elapsed, msg: `🟡 51N TIME TRIP — 3I₀ = ${residualI.toFixed(0)}A ≥ pickup ${pickup51N}A (delayed ${elapsed.toFixed(2)}s)`, type: 'trip' }, ...prev]);
            }
        }
        // Below pickup
        if (elapsed >= 0.1 && residualI < pickup51N && residualI > 0 && !tripStatus && !isDirectionalBlocked) {
            setTripStatus('NO TRIP');
            setSimRunning(false);
            setEvents(prev => [{ time: elapsed, msg: `⚠️ NO TRIP — 3I₀ = ${residualI.toFixed(0)}A < pickup ${pickup51N}A. Fault persists undetected!`, type: 'warn' }, ...prev]);
        }
        // Balanced fault — no residual
        if (elapsed >= 0.1 && residualI === 0 && faultCurrent > 0 && !tripStatus) {
            setTripStatus('NO 3I₀');
            setSimRunning(false);
            setEvents(prev => [{ time: elapsed, msg: `ℹ️ Balanced fault — 3I₀ = 0. Ground OC elements will NOT operate. Phase OC (50/51) must protect.`, type: 'info' }, ...prev]);
        }
    }, [elapsed, simRunning, residualI, pickup50N, pickup51N, tripStatus, faultCurrent]);

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSimRunning(false); setElapsed(0); setFaultCurrent(0); setResidualI(0); setTripStatus(''); setEvents([]);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Configuration */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500" /> Fault & System Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Fault Type</label>
                        <select value={faultType.id} onChange={e => setFaultType(FAULT_TYPES.find(f => f.id === e.target.value) || FAULT_TYPES[0])}
                            className={`w-full p-2.5 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} disabled={simRunning}>
                            {FAULT_TYPES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                        <span className="text-[10px] opacity-50 mt-0.5 block">{faultType.desc}</span>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Grounding Method</label>
                        <select value={grounding.id} onChange={e => setGrounding(GROUNDING.find(g => g.id === e.target.value) || GROUNDING[0])}
                            className={`w-full p-2.5 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} disabled={simRunning}>
                            {GROUNDING.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                        </select>
                    </div>
                    <Slider 
                        label="50N Pickup" 
                        unit="A" 
                        min={50} 
                        max={1000} 
                        step={50} 
                        value={pickup50N} 
                        onChange={e => setPickup50N(+e.target.value)} 
                        color="red" 
                        disabled={simRunning}
                    />
                    <Slider 
                        label="51N Pickup" 
                        unit="A" 
                        min={5} 
                        max={200} 
                        step={5} 
                        value={pickup51N} 
                        onChange={e => setPickup51N(+e.target.value)} 
                        color="amber" 
                        disabled={simRunning}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border bg-slate-50 dark:bg-slate-800 text-sm font-bold w-full">
                            <input type="checkbox" checked={directional} onChange={e => setDirectional(e.target.checked)} className="accent-blue-500 w-5 h-5" disabled={simRunning} />
                            Enable 67N Directional Element
                        </label>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                         <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Fault Location</label>
                         <div className="flex rounded-lg overflow-hidden border">
                              <button onClick={() => setFaultLocation('forward')} disabled={simRunning} className={`flex-1 py-2 text-sm font-bold transition-colors ${faultLocation === 'forward' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>Forward (Line)</button>
                              <button onClick={() => setFaultLocation('reverse')} disabled={simRunning} className={`flex-1 py-2 text-sm font-bold transition-colors ${faultLocation === 'reverse' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>Reverse (Bus)</button>
                         </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={injectFault} disabled={simRunning}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-all shadow-lg shadow-red-500/20">
                        <Zap className="w-4 h-4" /> Inject Ground Fault
                    </button>
                    <button onClick={reset}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                </div>
            </div>

            {/* Visualization + Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phasor Diagram */}
                <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-sm"><Compass className="w-4 h-4 text-blue-500" /> Phasor Diagram (Ia, Ib, Ic, 3I₀, 3V₀)</h3>
                    <PhasorDiagram isDark={isDark} faultPhases={faultType.phases} groundFactor={1.0} tripStatus={tripStatus} />
                    <div className="flex gap-3 mt-3 text-[10px] font-bold">
                        <span className="text-red-500">● Ia</span>
                        <span className="text-green-500">● Ib</span>
                        <span className="text-blue-500">● Ic</span>
                        <span className="text-amber-500">- - 3I₀</span>
                        <span className="text-purple-500">- - 3V₀</span>
                    </div>
                </div>

                {/* Readings & Status */}
                <div className="space-y-4">
                    <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500" /> Measurements</h3>
                        <div className="space-y-2">
                            {[
                                { l: 'Fault Current (If)', v: `${faultCurrent.toFixed(0)} A`, c: faultCurrent > 0 ? 'text-red-500' : '' },
                                { l: 'Residual (3I₀)', v: `${residualI.toFixed(0)} A`, c: residualI > pickup50N ? 'text-red-500' : residualI > pickup51N ? 'text-amber-500' : residualI > 0 ? 'text-blue-500' : '' },
                                { l: '50N Pickup', v: `${pickup50N} A`, c: '' },
                                { l: '51N Pickup', v: `${pickup51N} A`, c: '' },
                                { l: 'Elapsed', v: `${elapsed.toFixed(2)}s`, c: '' },
                                { l: 'Directional (67N)', v: directional ? 'ENABLED' : 'DISABLED', c: directional ? 'text-emerald-500' : 'text-slate-500' },
                                { l: 'MTA Location', v: faultLocation.toUpperCase(), c: faultLocation === 'forward' ? 'text-blue-500' : 'text-emerald-500' },
                            ].map(r => (
                                <div key={r.l} className="flex justify-between text-sm">
                                    <span className="opacity-60">{r.l}</span>
                                    <span className={`font-mono font-bold ${r.c}`}>{r.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Trip Status */}
                    <div className={`rounded-2xl border p-5 text-center transition-colors duration-300 ${
                        tripStatus === 'TRIP' ? 'bg-red-500/10 border-red-500/30' :
                        tripStatus === 'REVERSE BLOCK' ? 'bg-emerald-500/10 border-emerald-500/30' :
                        tripStatus === 'NO TRIP' ? 'bg-amber-500/10 border-amber-500/30' :
                        tripStatus === 'NO 3I₀' ? 'bg-blue-500/10 border-blue-500/30' :
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                        {tripStatus === 'TRIP' && <div className="text-red-500 font-black text-2xl flex items-center justify-center gap-2"><AlertTriangle className="w-6 h-6" /> GROUND FAULT TRIP</div>}
                        {tripStatus === 'REVERSE BLOCK' && <div className="text-emerald-500 font-black text-xl flex items-center justify-center gap-2"><ShieldCheck className="w-6 h-6" /> 67N BLOCKED (REVERSE)</div>}
                        {tripStatus === 'NO TRIP' && <div className="text-amber-500 font-black text-xl">⚠️ FAULT UNDETECTED — Below Pickup</div>}
                        {tripStatus === 'NO 3I₀' && <div className="text-blue-500 font-black text-xl">ℹ️ Balanced Fault — No Zero Sequence</div>}
                        {!tripStatus && <div className="opacity-40 font-bold">Awaiting fault injection...</div>}
                    </div>
                </div>
            </div>

            {/* Event Log */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-500" /> Protection Event Log</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {events.length === 0 && <p className="text-sm opacity-40 italic">No events. Inject a ground fault to begin.</p>}
                    <AnimatePresence>
                        {events.map((e, i) => (
                            <motion.div 
                                key={e.msg + i}
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                                className={`text-xs p-2.5 rounded-lg border ${
                                    e.type === 'fault' ? 'border-red-500/20 bg-red-500/5' :
                                    e.type === 'trip' ? 'border-red-500/30 bg-red-500/10' :
                                    e.type === 'warn' ? 'border-amber-500/20 bg-amber-500/5' :
                                    'border-blue-500/20 bg-blue-500/5'
                                }`}
                            >
                                <span className="font-mono opacity-60">[{e.time.toFixed(2)}s]</span>{' '}
                                <span className="font-bold">{e.msg}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">User Guide</h2>
                <p className="text-sm opacity-60">How to use the Ground Fault Simulator</p>
            </div>
        </div>
        <div className="space-y-6">
            {[
                { step: '1', title: 'Select Fault Type', desc: 'Choose SLG (most common), DLG, or 3-phase. SLG faults produce the largest zero-sequence current in solidly grounded systems. 3-phase faults produce NO zero-sequence current.' },
                { step: '2', title: 'Select Grounding Method', desc: 'Each grounding type dramatically affects fault current magnitude. Solidly grounded = high 3I₀. High-Z grounded = very low 3I₀. Ungrounded = essentially no fault current flow.' },
                { step: '3', title: 'Set Relay Pickups', desc: '50N is the instantaneous element — set it above maximum load unbalance. 51N is the time-delayed element — set it for sensitive detection with coordination margin.' },
                { step: '4', title: 'Enable/Disable 67N', desc: 'The directional element ensures the relay only trips for faults in the protected direction (forward). This prevents tripping for faults behind the relay (backfeed).' },
                { step: '5', title: 'Inject & Observe', desc: 'Watch the phasor diagram update in real-time. The faulted phase voltage collapses, 3I₀ (residual) appears, and 3V₀ (polarizing) shifts. Compare different fault types and grounding methods.' },
            ].map(item => (
                <div key={item.step} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0">{item.step}</div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-sm opacity-70 mt-1">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
        <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-2 flex items-center gap-2 text-amber-500"><AlertTriangle className="w-4 h-4" /> Standards Compliance</h4>
            <p className="text-sm opacity-80">
                This simulator models ground fault detection per <strong>IEEE C37.112</strong> (Inverse-Time OC Relays) and directional ground elements per <strong>IEEE C37.113</strong>.
                Grounding methods follow <strong>IEEE 142</strong> (Green Book) and <strong>IEC 60364</strong> practices.
            </p>
        </div>
    </div>
);

// ============================== QUIZ ==============================
const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy' | 'medium' | 'expert'>('easy');
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [finished, setFinished] = useState(false);
    const questions = QUIZ_DATA[level];
    const q = questions[current];

    const handleSelect = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        if (idx === q.ans) setScore(prev => prev + 1);
        setTimeout(() => {
            if (current + 1 >= questions.length) setFinished(true);
            else { setCurrent(prev => prev + 1); setSelected(null); }
        }, 2500);
    };
    const resetQuiz = () => { setCurrent(0); setScore(0); setSelected(null); setFinished(false); };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Knowledge Quiz</h2>
                    <p className="text-sm opacity-60">Ground fault protection mastery</p>
                </div>
            </div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                {(['easy', 'medium', 'expert'] as const).map(l => (
                    <button key={l} onClick={() => { setLevel(l); resetQuiz(); }}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider ${
                            level === l ? (l === 'easy' ? 'bg-emerald-600 text-white' : l === 'medium' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white')
                            : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'
                        }`}>{l}</button>
                ))}
            </div>
            {finished ? (
                <div className={`text-center p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="text-5xl mb-4">{score >= 4 ? '🏆' : score >= 3 ? '✅' : '📚'}</div>
                    <div className="text-3xl font-black mb-2">{score}/{questions.length}</div>
                    <button onClick={resetQuiz} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button>
                </div>
            ) : (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between mb-4">
                        <span className="text-xs opacity-40">Q{current + 1}/{questions.length}</span>
                        <span className="text-xs text-emerald-500">Score: {score}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">
                        {q.opts.map((opt, i) => (
                            <button key={i} onClick={() => handleSelect(i)}
                                className={`w-full text-left p-4 rounded-xl border text-sm ${
                                    selected === null ? isDark ? 'border-slate-700 hover:border-blue-500' : 'border-slate-200 hover:border-blue-500'
                                    : i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold'
                                    : selected === i ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40'
                                }`}>
                                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                            </button>
                        ))}
                    </div>
                    {selected !== null && (
                        <div className={`mt-4 p-4 rounded-xl text-sm ${selected === q.ans ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                            <strong>{selected === q.ans ? '✅ Correct!' : '❌ Incorrect.'}</strong> {q.why}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================== MAIN LAYOUT ==============================
export default function GroundFaultSim() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };
    const tabs = [
        { id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4" /> },
        { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-4 h-4" /> },
        { id: 'guide', label: 'User Guide', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4" /> },
    ];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="Ground Fault Simulator" description="Interactive ground fault simulator with phasor diagrams, 50N/51N/67N directional elements, and IEEE C37.112 compliance." url="/ground-fault" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-600 to-red-600 p-2 rounded-lg text-white shadow-lg shadow-amber-500/20"><Compass className="w-5 h-5" /></div>
                    <div>
                        <h1 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Ground<span className="text-amber-500">Fault</span></h1>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">✅ IEEE C37.112 / IEC 60364</span>
                    </div>
                </div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-amber-400' : 'bg-white text-amber-600') : 'opacity-60'}`}>
                            {t.icon}<span>{t.label}</span>
                        </button>
                    ))}
                </div><div />
            <button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button></header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab === t.id ? (isDark ? 'text-amber-400' : 'text-amber-600') : 'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}
            </div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <TheoryLibrary title="Ground Fault Protection Handbook" description="Theory and application of ground fault protection elements 50N, 51N, 67N including grounding methods and relay coordination." sections={GROUND_FAULT_THEORY_CONTENT} />}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}><SimulatorModule isDark={isDark} /></div>
                {activeTab === 'guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
