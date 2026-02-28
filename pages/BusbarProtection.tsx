import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, Award, Layers, Zap, AlertTriangle, CheckCircle2, Activity, ShieldCheck , Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import TheoryLibrary from '../components/TheoryLibrary';
import { BUSBAR_PROTECTION_THEORY_CONTENT } from '../data/learning-modules/busbar-protection';
import SEO from "../components/SEO";

// ============================== QUIZ ==============================
const QUIZ_DATA = {
    easy: [
        { q: "Bus differential (87B) compares:", opts: ["Voltage levels", "Sum of all currents entering/leaving the bus", "Frequency", "Impedance"], ans: 1, why: "87B checks Kirchhoff's current law: ΣI_in = ΣI_out. If the sum ≠ 0, there's an internal fault." },
        { q: "What ANSI code is bus differential?", opts: ["50", "87T", "87B", "21"], ans: 2, why: "87B = Bus differential. 87T = Transformer differential. Both use the same principle but applied to different zones." },
        { q: "A bus fault is considered:", opts: ["Common and harmless", "Rare but extremely severe", "Only in cables", "Self-clearing"], ans: 1, why: "Bus faults are rare (<6% of faults) but cause the widest outage since all circuits connected to the bus are affected." },
        { q: "CT saturation during external faults can cause:", opts: ["Faster tripping", "False differential current (security risk)", "No effect", "Voltage rise"], ans: 1, why: "CT saturation during a through-fault reduces the CT output on the saturated side, creating a false differential current that may cause misoperation." },
        { q: "The restraint current in a bus diff scheme uses:", opts: ["Only one CT", "The largest current magnitude", "Average of all currents", "Voltage"], ans: 1, why: "The restraint is typically based on the magnitude of the largest current entering/leaving the zone, providing security against CT errors." },
    ],
    medium: [
        { q: "High-impedance bus differential works by:", opts: ["Low burden CTs", "Forcing saturated CT current through a high-impedance relay", "Using distance elements", "Measuring frequency"], ans: 1, why: "In high-Z schemes, a stabilizing resistor forces CT saturation current to flow through the CT, not the relay. Only internal faults produce enough voltage to operate the relay." },
        { q: "In low-impedance 87B, the operate/restrain characteristic has:", opts: ["Fixed threshold", "Dual slope (steep above breakpoint)", "No restraint", "Only time delay"], ans: 1, why: "Modern low-impedance 87B uses dual-slope characteristics. The steeper second slope above the breakpoint provides additional security during severe CT saturation." },
        { q: "Check zone concept in bus protection means:", opts: ["Double-checking voltage", "Two overlapping diff zones that must both agree", "Redundant CTs", "Backup timing"], ans: 1, why: "Check zone = an overall differential zone covering the entire bus. It must agree with the discriminating zone to prevent tripping on CT wiring errors." },
        { q: "Breaker-and-a-half configuration has CTs:", opts: ["Only on bus side", "On each breaker, each counted in two diff zones", "Only on line side", "No CTs needed"], ans: 1, why: "In breaker-and-a-half, the middle breaker's CTs must be shared between two bus zones, making zone allocation critical." },
        { q: "Dynamic bus replica in modern relays allows:", opts: ["Faster cooling", "Automatic zone reconfiguration when breaker status changes", "Voltage balancing", "Harmonic filtering"], ans: 1, why: "As breakers open/close, the bus topology changes. Dynamic bus replica ensures CTs are correctly allocated to zones in real-time." },
    ],
    expert: [
        { q: "Per IEEE C37.234, the minimum bus diff operate time is:", opts: ["100ms", "Less than 1 cycle (15-20ms)", "500ms", "2 seconds"], ans: 1, why: "Bus faults are the most damaging; 87B must operate in less than 1 cycle. Modern numerical relays achieve 10-15ms." },
        { q: "The Vset formula for high-impedance bus diff is:", opts: ["Vset = If × Rct", "Vset = If_max × (Rct + Rlead)", "Vset = Vprimary / N", "Vset = IL × Xct"], ans: 1, why: "Vset must exceed the voltage developed across the relay by the maximum through-fault current flowing through the worst-case CT secondary loop impedance." },
        { q: "CT ratio mismatch in low-impedance 87B is handled by:", opts: ["Ignoring it", "Software ratio correction (adjustable weights)", "External autotransformer", "Fuses"], ans: 1, why: "Modern numerical 87B relays apply individual CT ratio correction factors in software, eliminating the need for auxiliary CTs." },
        { q: "Evolving bus faults (external → internal) require:", opts: ["Slower tripping", "Zone extension logic with retrip capability", "No action", "Manual reset"], ans: 1, why: "An evolving fault starts external but spreads to the bus. The relay must detect the change from restrained to operated state and trip, even after initial restraint." },
        { q: "Stub bus protection covers:", opts: ["Main bus", "The dead section between bus CT and open breaker", "Transformer", "Generator"], ans: 1, why: "When a breaker is open, the CTs on the far side create a blind spot. Stub bus protection covers this dead section using local overcurrent." },
    ],
};

// ============================== BUS ZONE CANVAS ==============================
const BusZoneDiagram = ({ isDark, feeders, busFault, externalFault, trips }: { isDark: boolean; feeders: { name: string; current: number; dir: 'in' | 'out' }[]; busFault: boolean; externalFault: number; trips: boolean }) => {
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

        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, cw, ch);

        // Bus bar (horizontal thick bar)
        const busY = ch * 0.4;
        const busX1 = cw * 0.1, busX2 = cw * 0.9;
        ctx.fillStyle = busFault && trips ? '#ef4444' : busFault ? '#f59e0b' : '#3b82f6';
        ctx.fillRect(busX1, busY - 4, busX2 - busX1, 8);
        if (busFault) {
            ctx.fillStyle = 'rgba(239,68,68,0.15)';
            ctx.fillRect(busX1 - 10, busY - 30, busX2 - busX1 + 20, 60);
        }

        // Bus label
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText('BUS', busX1 - 2, busY - 12);

        // 87B zone dashed border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(busX1 - 15, busY - 35, busX2 - busX1 + 30, 70);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(59,130,246,0.4)';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText('87B ZONE', busX2 - 50, busY - 38);

        // Feeders
        const spacing = (busX2 - busX1) / (feeders.length + 1);
        feeders.forEach((f, i) => {
            const fx = busX1 + spacing * (i + 1);
            const fy = f.dir === 'in' ? busY - 35 : busY + 35;
            const endY = f.dir === 'in' ? 15 : ch - 15;

            // Feeder line
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx, endY);
            ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
            ctx.lineWidth = 2;
            ctx.stroke();

            // CB symbol (square)
            const cbY = f.dir === 'in' ? busY - 55 : busY + 55;
            ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
            ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.rect(fx - 8, cbY - 8, 16, 16);
            ctx.fill();
            ctx.stroke();

            // CT symbol (two semicircles)
            const ctY = f.dir === 'in' ? busY - 25 : busY + 25;
            ctx.beginPath();
            ctx.arc(fx - 4, ctY, 5, 0, Math.PI, false);
            ctx.arc(fx + 4, ctY, 5, Math.PI, 0, false);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Current arrow
            const arrowY = f.dir === 'in' ? busY - 70 : busY + 70;
            const arrowDir = f.dir === 'in' ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(fx, arrowY);
            ctx.lineTo(fx, arrowY + arrowDir * 15);
            ctx.strokeStyle = f.current > 0 ? '#22c55e' : '#ef4444';
            ctx.lineWidth = Math.min(3, Math.abs(f.current) / 500 + 1);
            ctx.stroke();
            // arrowhead
            ctx.beginPath();
            ctx.moveTo(fx - 4, arrowY + arrowDir * 10);
            ctx.lineTo(fx, arrowY + arrowDir * 15);
            ctx.lineTo(fx + 4, arrowY + arrowDir * 10);
            ctx.strokeStyle = f.current > 0 ? '#22c55e' : '#ef4444';
            ctx.stroke();

            // Label
            ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(f.name, fx, endY + (f.dir === 'in' ? -2 : 12));
            ctx.fillStyle = f.current > 500 ? '#ef4444' : isDark ? '#94a3b8' : '#64748b';
            ctx.font = '9px Inter, sans-serif';
            ctx.fillText(`${f.current}A`, fx, endY + (f.dir === 'in' ? -14 : 24));
            ctx.textAlign = 'start';

            // External fault indicator
            if (externalFault === i) {
                ctx.fillStyle = 'rgba(239,68,68,0.2)';
                ctx.beginPath();
                ctx.arc(fx, endY + (f.dir === 'in' ? -30 : 30), 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⚡', fx, endY + (f.dir === 'in' ? -26 : 34));
                ctx.textAlign = 'start';
            }
        });

        // Bus fault symbol
        if (busFault) {
            const bfx = (busX1 + busX2) / 2;
            ctx.beginPath();
            ctx.arc(bfx, busY, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239,68,68,0.3)';
            ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', bfx, busY + 5);
            ctx.textAlign = 'start';
        }

        // Differential readings at bottom
        const sumIn = feeders.filter(f => f.dir === 'in').reduce((s, f) => s + f.current, 0);
        const sumOut = feeders.filter(f => f.dir === 'out').reduce((s, f) => s + f.current, 0);
        const iDiff = Math.abs(sumIn - sumOut);
        const iRestraint = Math.max(sumIn, sumOut);
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText(`ΣI_in = ${sumIn}A   ΣI_out = ${sumOut}A`, 10, ch - 24);
        ctx.fillStyle = iDiff > 100 ? '#ef4444' : '#22c55e';
        ctx.fillText(`I_diff = ${iDiff}A   I_restrain = ${iRestraint}A`, 10, ch - 10);

        if (trips) {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.fillText('🔴 87B TRIP', cw - 80, ch - 10);
        }
    }, [isDark, feeders, busFault, externalFault, trips]);

    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{ height: 340, border: isDark ? '1px solid rgb(30,41,59)' : '1px solid rgb(226,232,240)' }} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [feeders, setFeeders] = useState([
        { name: 'Line 1', current: 800, dir: 'in' as const },
        { name: 'Line 2', current: 600, dir: 'in' as const },
        { name: 'Xfmr', current: 500, dir: 'out' as const },
        { name: 'Fdr 1', current: 400, dir: 'out' as const },
        { name: 'Fdr 2', current: 500, dir: 'out' as const },
    ]);
    const [busFault, setBusFault] = useState(false);
    const [externalFault, setExternalFault] = useState(-1);
    const [trips, setTrips] = useState(false);
    const [events, setEvents] = useState<{ time: number; msg: string; type: string }[]>([]);
    const [animating, setAnimating] = useState(false);
    const timerRef = useRef<any>(null);

    const injectBusFault = () => {
        setTrips(false); setEvents([]); setExternalFault(-1); setAnimating(true);
        setBusFault(true);
        const faulted = [
            { name: 'Line 1', current: 3200, dir: 'in' as const },
            { name: 'Line 2', current: 2800, dir: 'in' as const },
            { name: 'Xfmr', current: 0, dir: 'out' as const },
            { name: 'Fdr 1', current: 0, dir: 'out' as const },
            { name: 'Fdr 2', current: 0, dir: 'out' as const },
        ];
        setFeeders(faulted);
        setEvents([{ time: 0, msg: '⚡ BUS FAULT — All sources feed into fault, loads disconnected', type: 'fault' }]);
        setTimeout(() => {
            setEvents(prev => [{ time: 0.015, msg: '🔴 87B TRIP — I_diff = 6000A >> threshold. Trip all bus breakers.', type: 'trip' }, ...prev]);
            setTrips(true);
            setAnimating(false);
        }, 800);
    };

    const injectExternalFault = () => {
        setTrips(false); setEvents([]); setBusFault(false); setAnimating(true);
        setExternalFault(4); // Fdr 2
        const ext = [
            { name: 'Line 1', current: 2500, dir: 'in' as const },
            { name: 'Line 2', current: 2000, dir: 'in' as const },
            { name: 'Xfmr', current: 500, dir: 'out' as const },
            { name: 'Fdr 1', current: 400, dir: 'out' as const },
            { name: 'Fdr 2', current: 3600, dir: 'out' as const },
        ];
        setFeeders(ext);
        setEvents([{ time: 0, msg: '⚡ EXTERNAL FAULT on Feeder 2 — Through-fault. ΣI_in ≈ ΣI_out.', type: 'fault' }]);
        setTimeout(() => {
            setEvents(prev => [{ time: 0.020, msg: '✅ 87B RESTRAINED — I_diff ≈ 0A (through-fault correctly identified). No trip.', type: 'success' }, ...prev]);
            setAnimating(false);
        }, 800);
    };

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setFeeders([
            { name: 'Line 1', current: 800, dir: 'in' as const },
            { name: 'Line 2', current: 600, dir: 'in' as const },
            { name: 'Xfmr', current: 500, dir: 'out' as const },
            { name: 'Fdr 1', current: 400, dir: 'out' as const },
            { name: 'Fdr 2', current: 500, dir: 'out' as const },
        ]);
        setBusFault(false); setExternalFault(-1); setTrips(false); setEvents([]); setAnimating(false);
    };

    const sumIn = feeders.filter(f => f.dir === 'in').reduce((s, f) => s + f.current, 0);
    const sumOut = feeders.filter(f => f.dir === 'out').reduce((s, f) => s + f.current, 0);
    const iDiff = Math.abs(sumIn - sumOut);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4"><Settings className="w-5 h-5 text-blue-500 inline mr-2" />Inject Scenario</h3>
                <div className="flex flex-wrap gap-3">
                    <button onClick={injectBusFault} disabled={animating} className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 shadow-lg shadow-red-500/20 flex items-center gap-2"><Zap className="w-4 h-4" /> Bus Fault</button>
                    <button onClick={injectExternalFault} disabled={animating} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2"><Activity className="w-4 h-4" /> External Fault (Feeder 2)</button>
                    <button onClick={reset} className={`px-6 py-2.5 rounded-xl font-bold text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200'}`}><RotateCcw className="w-4 h-4 inline mr-1" /> Reset</button>
                </div>
                {animating && <p className="text-amber-500 text-sm font-bold mt-3 animate-pulse">⏳ Fault analysis in progress...</p>}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 rounded-2xl border p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3 text-sm"><Layers className="w-4 h-4 text-blue-500 inline mr-2" />Bus Zone Diagram</h3>
                    <BusZoneDiagram isDark={isDark} feeders={feeders} busFault={busFault} externalFault={externalFault} trips={trips} />
                </div>
                <div className="space-y-4">
                    <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-3"><Activity className="w-4 h-4 text-emerald-500 inline mr-2" />Differential Readings</h3>
                        {[
                            { l: 'ΣI_in', v: `${sumIn} A`, c: '' },
                            { l: 'ΣI_out', v: `${sumOut} A`, c: '' },
                            { l: 'I_differential', v: `${iDiff} A`, c: iDiff > 100 ? 'text-red-500' : 'text-emerald-500' },
                            { l: 'I_restraint', v: `${Math.max(sumIn, sumOut)} A`, c: '' },
                            { l: 'Ratio (Id/Ir)', v: `${Math.max(sumIn, sumOut) > 0 ? (iDiff / Math.max(sumIn, sumOut) * 100).toFixed(1) : 0}%`, c: iDiff / Math.max(sumIn, sumOut, 1) > 0.3 ? 'text-red-500' : 'text-emerald-500' },
                        ].map(r => (
                            <div key={r.l} className="flex justify-between text-sm py-0.5">
                                <span className="opacity-60">{r.l}</span>
                                <span className={`font-mono font-bold ${r.c}`}>{r.v}</span>
                            </div>
                        ))}
                    </div>
                    <div className={`rounded-2xl border p-5 text-center ${trips ? 'bg-red-500/10 border-red-500/30' : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        {trips ? <div className="text-red-500 font-black text-xl flex items-center justify-center gap-2"><AlertTriangle className="w-5 h-5" />87B TRIP</div>
                            : busFault ? <div className="text-amber-500 font-bold animate-pulse">Analyzing...</div>
                            : externalFault >= 0 ? <div className="text-emerald-500 font-black text-lg flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" />RESTRAINED ✅</div>
                            : <div className="opacity-40 font-bold">Normal Operation</div>}
                    </div>
                </div>
            </div>
            {/* Event Log */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3"><ShieldCheck className="w-4 h-4 text-blue-500 inline mr-2" />Event Log</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {events.length === 0 && <p className="text-sm opacity-40 italic">Inject a bus fault or external fault to begin.</p>}
                    <AnimatePresence>
                            {events.map((e, i) => (
                        <motion.div 
                                key={e.msg + i}
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 6 }}
                                className={`text-xs p-2.5 rounded-lg border ${e.type === 'trip' ? 'border-red-500/30 bg-red-500/10' : e.type === 'fault' ? 'border-red-500/20 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                            <span className="font-mono opacity-60">[{e.time.toFixed(3)}s]</span> <span className="font-bold">{e.msg}</span>
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
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">Busbar Differential Protection (87B)</p></div></div>
        {[
            { s: '1', t: 'Understand the Bus Zone', d: 'The dashed blue boundary is the 87B zone. All CTs at the zone boundary measure current. Under normal conditions, ΣI_in = ΣI_out (differential = 0).' },
            { s: '2', t: 'Inject a Bus Fault', d: 'When a fault occurs inside the zone, all sources feed into the fault and loads are disconnected. The differential current spikes — the relay trips all bus breakers in <1 cycle.' },
            { s: '3', t: 'Test External Fault', d: 'For faults outside the zone, through-fault current flows in and out equally. The differential remains near zero. The relay restrains correctly — this is the security test.' },
            { s: '4', t: 'Read Differential Values', d: 'I_diff = |ΣI_in - ΣI_out|. The ratio Id/Ir must exceed the slope setting to trip. High ratio = internal fault. Low ratio = normal or external fault.' },
        ].map(i => (
            <div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div>
                <div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div>
            </div>
        ))}
        <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-2 text-amber-500"><AlertTriangle className="w-4 h-4 inline mr-1" /> Standards</h4>
            <p className="text-sm opacity-80">Modeled per <strong>IEEE C37.234</strong> (Bus Differential Protection) and <strong>IEC 61850-9-2</strong> for process bus applications.</p>
        </div>
    </div>
);

// ============================== QUIZ ==============================
const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy'|'medium'|'expert'>('easy');
    const [cur, setCur] = useState(0); const [score, setScore] = useState(0);
    const [sel, setSel] = useState<number|null>(null); const [fin, setFin] = useState(false);
    const qs = QUIZ_DATA[level]; const q = qs[cur];
    const pick = (i: number) => { if (sel !== null) return; setSel(i); if (i === q.ans) setScore(p => p + 1); setTimeout(() => { if (cur + 1 >= qs.length) setFin(true); else { setCur(p => p + 1); setSel(null); } }, 2500); };
    const rst = () => { setCur(0); setScore(0); setSel(null); setFin(false); };
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div><div><h2 className="text-2xl font-black">Quiz</h2><p className="text-sm opacity-60">Busbar protection mastery</p></div></div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>{(['easy','medium','expert'] as const).map(l => (<button key={l} onClick={() => { setLevel(l); rst(); }} className={`flex-1 py-3 text-sm font-bold uppercase ${level === l ? (l==='easy'?'bg-emerald-600 text-white':l==='medium'?'bg-amber-600 text-white':'bg-red-600 text-white'):isDark?'bg-slate-900 text-slate-400':'bg-slate-50 text-slate-600'}`}>{l}</button>))}</div>
            {fin ? (
                <div className={`text-center p-8 rounded-2xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><div className="text-5xl mb-4">{score>=4?'🏆':'📚'}</div><div className="text-3xl font-black mb-2">{score}/{qs.length}</div><button onClick={rst} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button></div>
            ) : (
                <div className={`p-6 rounded-2xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <div className="flex justify-between mb-4"><span className="text-xs opacity-40">Q{cur+1}/{qs.length}</span><span className="text-xs text-emerald-500">Score: {score}</span></div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">{q.opts.map((o,i) => (<button key={i} onClick={() => pick(i)} className={`w-full text-left p-4 rounded-xl border text-sm ${sel===null?isDark?'border-slate-700 hover:border-blue-500':'border-slate-200 hover:border-blue-500':i===q.ans?'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold':sel===i?'border-red-500 bg-red-500/10 text-red-500':'opacity-40'}`}><span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{o}</button>))}</div>
                    {sel !== null && <div className={`mt-4 p-4 rounded-xl text-sm ${sel===q.ans?'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400':'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'}`}><strong>{sel===q.ans?'✅ Correct!':'❌ Incorrect.'}</strong> {q.why}</div>}
                </div>
            )}
        </div>
    );
};

// ============================== MAIN ==============================
export default function BusbarProtection() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };
    const tabs = [{ id:'theory',label:'Reference',icon:<Book className="w-4 h-4"/>},{id:'simulator',label:'Simulator',icon:<MonitorPlay className="w-4 h-4"/>},{id:'guide',label:'Guide',icon:<GraduationCap className="w-4 h-4"/>},{id:'quiz',label:'Quiz',icon:<Award className="w-4 h-4"/>}];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark?'bg-slate-950 text-slate-200':'bg-slate-50 text-slate-800'}`}>
            <SEO title="Busbar Protection (87B)" description="Interactive bus differential simulator with zone diagram, internal/external fault discrimination, and IEEE C37.234 compliance." url="/busbar-protection" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-amber-600 to-red-600 p-2 rounded-lg text-white shadow-lg shadow-amber-500/20"><Layers className="w-5 h-5"/></div><div><h1 className={`font-black text-lg ${isDark?'text-white':'text-slate-900'}`}>Bus<span className="text-amber-500">Guard</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">✅ IEEE C37.234</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark?'bg-slate-950 border-slate-800':'bg-slate-100 border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab===t.id?(isDark?'bg-slate-800 text-amber-400':'bg-white text-amber-600'):'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div><button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab===t.id?(isDark?'text-amber-400':'text-amber-600'):'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab==='theory' && <TheoryLibrary title="Bus Differential Handbook" description="Bus differential protection principles including high/low impedance schemes, CT saturation, check zones, and IEEE C37.234." sections={BUSBAR_PROTECTION_THEORY_CONTENT}/>}
                <div className={activeTab==='simulator'?'block h-full overflow-y-auto':'hidden'}><SimulatorModule isDark={isDark}/></div>
                {activeTab==='guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark}/></div>}
                {activeTab==='quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark}/></div>}
            </div>
        </div>
    );
}
