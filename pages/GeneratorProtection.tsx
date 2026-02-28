import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, Award, Zap, AlertTriangle, Activity, Play, ShieldCheck , Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { useSmoothedValues } from '../hooks/useSmoothedValues';
import TheoryLibrary from '../components/TheoryLibrary';
import { GENERATOR_PROTECTION_THEORY_CONTENT } from '../data/learning-modules/generator-protection';
import SEO from "../components/SEO";

// ============================== QUIZ ==============================
const QUIZ_DATA={easy:[
{q:"ANSI 87G designates:",opts:["Bus diff","Generator differential","Motor protection","Transformer diff"],ans:1,why:"87G is the ANSI code for generator differential protection, which compares current entering and leaving the stator windings."},
{q:"Loss of field is ANSI:",opts:["32","40","46","64"],ans:1,why:"ANSI 40 = Loss of Field. When excitation fails, the generator absorbs reactive power and operates as an induction generator."},
{q:"Reverse power (32) detects:",opts:["Overvoltage","Generator motoring","Overcurrent","Frequency change"],ans:1,why:"Function 32 detects when the prime mover fails and the generator starts absorbing real power from the grid, acting as a motor."},
{q:"IEEE C37.102 covers:",opts:["Motor protection","Generator protection","CT sizing","Busbar protection"],ans:1,why:"IEEE C37.102 is the comprehensive guide for AC generator protection, covering all ANSI functions from 87G to loss of field."},
{q:"How many ANSI functions does a large gen typically have?",opts:["3-5","10-15","20+","Just 1"],ans:2,why:"Large generators (>50MW) typically have 20+ protection functions including 87G, 40, 32, 46, 64, 78, 24, 81, 50/27, etc."}
],medium:[
{q:"Loss of field causes generator to operate as:",opts:["Capacitor","Induction generator (absorbs vars)","Open circuit","Short circuit"],ans:1,why:"Without field excitation, the generator loses synchronism and runs as an induction generator, drawing reactive power from the system."},
{q:"Negative sequence (46) damages the:",opts:["Stator","Rotor (heating at 2× frequency)","Transformer","Cable"],ans:1,why:"Negative sequence creates a field rotating opposite to the rotor, inducing 2× frequency currents in the rotor body, causing rapid heating."},
{q:"V/Hz overexcitation (24) occurs when:",opts:["Load is high","V/f ratio exceeds design limit","Current is low","Frequency is normal"],ans:1,why:"Overexcitation (V/Hz > 1.05 pu) saturates the core, causing excessive heating in the stator and transformer connected to the generator."},
{q:"100% stator ground fault protection requires:",opts:["One relay","Third-harmonic + fundamental method","Only overcurrent","Voltage relay only"],ans:1,why:"Traditional 64G covers ~95% of stator winding. For 100% coverage, a third-harmonic voltage injection method detects faults near the neutral."},
{q:"Reverse power threshold is typically:",opts:["50% rated","1-2% rated power","25%","100%"],ans:1,why:"Reverse power pickup is very sensitive (1-2% of rated MW) to detect turbine trip conditions early and prevent damage to the prime mover."}
],expert:[
{q:"The two loss-of-field mho circles are centered on:",opts:["Positive R axis","Negative X axis","Positive X axis","Origin"],ans:1,why:"The LOF mho elements are offset on the negative X axis. Zone 1 (small circle) is set to Xd'/2 and Zone 2 (large circle) to Xd for backup."},
{q:"Generator islanding with load causes:",opts:["Frequency rise","Frequency drop if load > gen capacity","No change","Voltage rise"],ans:1,why:"If a generator islands with more load than it can supply, frequency drops because the mechanical power is insufficient to maintain speed."},
{q:"Inadvertent energization (ANSI 50/27) protects against:",opts:["Normal startup","Breaker closing on a stopped generator","Overload","Power swing"],ans:1,why:"50/27 detects breaker closure while the generator is at standstill (no voltage). Without field, the generator acts as a short circuit."},
{q:"Generator capability curve is bounded by:",opts:["Only MVA rating","Armature limit, field limit, and stability limit","Current only","Voltage only"],ans:1,why:"The P-Q capability curve has three boundaries: armature current limit (semicircle), field current limit (arc), and steady-state stability limit."},
{q:"Out-of-step protection at generator (78) uses:",opts:["Overcurrent","Single blinder scheme on R-X plane","Temperature","Frequency"],ans:1,why:"Generator OOS protection uses impedance-based blinder schemes to detect when the apparent impedance trajectory crosses through the generator."}
]};

// ============================== P-Q CAPABILITY CANVAS ==============================
const CapabilityCurve = ({ isDark, mw, mvar, trips }: { isDark: boolean; mw: number; mvar: number; trips: string[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothed = useSmoothedValues({ mw, mvar });
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        const w = cvs.width = cvs.offsetWidth * 2;
        const h = cvs.height = cvs.offsetHeight * 2;
        ctx.scale(2, 2);
        const cw = w / 2, ch = h / 2;
        const cx = cw * 0.45, cy = ch * 0.55;
        const scale = Math.min(cw, ch) * 0.004;

        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, cw, ch);

        // Grid
        ctx.strokeStyle = isDark ? 'rgba(100,116,139,0.15)' : 'rgba(148,163,184,0.2)';
        ctx.lineWidth = 0.5;
        for (let p = -100; p <= 120; p += 20) {
            ctx.beginPath(); ctx.moveTo(cx + p * scale, 0); ctx.lineTo(cx + p * scale, ch); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, cy - p * scale); ctx.lineTo(cw, cy - p * scale); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(cw, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, ch); ctx.stroke();
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('MW →', cw - 35, cy - 5);
        ctx.fillText('MVAR ↑', cx + 5, 14);
        ctx.fillText('(lag)', cx + 5, 26);

        // Capability curve boundary (armature limit — semicircle)
        ctx.beginPath();
        ctx.arc(cx, cy, 100 * scale, -Math.PI * 0.15, Math.PI * 0.85, false);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(59,130,246,0.05)';
        ctx.fill();

        // Field limit (arc on right side)
        ctx.beginPath();
        const fieldCx = cx - 30 * scale;
        ctx.arc(fieldCx, cy, 120 * scale, -Math.PI * 0.15, Math.PI * 0.35, false);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Stability limit (vertical line)
        ctx.beginPath();
        ctx.moveTo(cx + 10 * scale, cy - 80 * scale);
        ctx.lineTo(cx + 10 * scale, cy + 40 * scale);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Operating point
        const px = cx + smoothed.mw * scale;
        const py = cy - smoothed.mvar * scale;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = trips.length > 0 ? '#ef4444' : '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Crosshair to operating point
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(px, cy); ctx.lineTo(px, py);
        ctx.moveTo(cx, py); ctx.lineTo(px, py);
        ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.3)' : 'rgba(100,116,139,0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('Armature limit', cx + 70 * scale, cy - 70 * scale);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('Field limit', cx + 50 * scale, cy - 90 * scale);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('Stability', cx + 12 * scale, cy - 82 * scale);

        // Operating point label
        ctx.fillStyle = trips.length > 0 ? '#ef4444' : '#22c55e';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(`(${smoothed.mw.toFixed(0)}, ${smoothed.mvar.toFixed(0)})`, px + 10, py - 8);

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.5)';
        ctx.fillText('P-Q CAPABILITY CURVE', 8, 16);
    }, [isDark, smoothed, trips]);

    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{ height: 340, border: isDark ? '1px solid rgb(30,41,59)' : '1px solid rgb(226,232,240)' }} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [mw, setMw] = useState(80);
    const [mvar, setMvar] = useState(30);
    const [vt, setVt] = useState(1.0);
    const [freq, setFreq] = useState(50);
    const [excitation, setExcitation] = useState(100);
    const [scenario, setScenario] = useState<'normal' | 'lof' | 'reverse' | 'neg_seq' | 'stator_gnd'>('normal');
    const [events, setEvents] = useState<{ time: number; msg: string; type: string }[]>([]);
    const [trips, setTrips] = useState<string[]>([]);
    const [animating, setAnimating] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<any>(null);

    const applyScenario = useCallback((s: typeof scenario) => {
        setScenario(s);
        setTrips([]);
        setEvents([]);
        setElapsed(0);
        setAnimating(true);

        // Start from normal, animate toward fault condition
        setMw(80); setMvar(30); setVt(1.0); setFreq(50); setExcitation(100);
        if (s === 'normal') {
            setAnimating(false);
            setEvents([{ time: 0, msg: '✅ Normal operating conditions — all parameters within limits', type: 'info' }]);
            return;
        }

        let step = 0;
        const interval = setInterval(() => {
            step++;
            setElapsed(step * 0.2);
            if (s === 'lof') {
                setExcitation(prev => Math.max(0, prev - 10));
                setMvar(prev => Math.max(-60, prev - 9));
                setVt(prev => Math.max(0.8, prev - 0.02));
                if (step === 2) setEvents(prev => [{ time: step * 0.2, msg: '⚠️ Excitation decaying — field current dropping', type: 'warn' }, ...prev]);
                if (step >= 10) {
                    clearInterval(interval);
                    setAnimating(false);
                    setTrips(['40 — Loss of Field (Operating as induction gen, absorbing -60 MVAR)']);
                    setEvents(prev => [{ time: step * 0.2, msg: '🔴 40 TRIP — LOF Zone 2 operated (impedance entered mho circle)', type: 'trip' }, ...prev]);
                }
            }
            if (s === 'reverse') {
                setMw(prev => Math.max(-8, prev - 9));
                if (step === 3) setEvents(prev => [{ time: step * 0.2, msg: '⚠️ Turbine tripped — generator decelerating', type: 'warn' }, ...prev]);
                if (step >= 10) {
                    clearInterval(interval);
                    setAnimating(false);
                    setMvar(10);
                    setTrips(['32 — Reverse Power (P = -8 MW < -1% threshold)']);
                    setEvents(prev => [{ time: step * 0.2, msg: '🔴 32 TRIP — Reverse power detected, generator motoring at -8 MW', type: 'trip' }, ...prev]);
                }
            }
            if (s === 'neg_seq') {
                setMw(60); setMvar(20); setVt(0.95);
                if (step === 2) setEvents(prev => [{ time: step * 0.2, msg: '⚠️ Transmission open phase detected — unbalanced load', type: 'warn' }, ...prev]);
                if (step >= 6) {
                    clearInterval(interval);
                    setAnimating(false);
                    setTrips(['46 — Negative Sequence (I₂ = 15% > 10% limit, rotor overheating)']);
                    setEvents(prev => [{ time: step * 0.2, msg: '🔴 46 TRIP — Rotor I²t limit exceeded at 2× frequency heating', type: 'trip' }, ...prev]);
                }
            }
            if (s === 'stator_gnd') {
                setMw(prev => Math.max(0, prev - 10));
                setMvar(prev => Math.max(0, prev - 4));
                setVt(prev => Math.max(0.4, prev - 0.06));
                if (step === 1) setEvents(prev => [{ time: step * 0.2, msg: '⚠️ Stator insulation breakdown — Phase A to ground!', type: 'warn' }, ...prev]);
                if (step >= 8) {
                    clearInterval(interval);
                    setAnimating(false);
                    setTrips(['64 — Stator Ground Fault (3V₀ = 0.48 pu > 0.05 pickup)', '87G — Generator Differential (I_diff = 3200 A)']);
                    setEvents(prev => [{ time: step * 0.2, msg: '🔴 64 + 87G TRIP — Dual protection operated for internal fault', type: 'trip' }, ...prev]);
                }
            }
        }, 200);
        timerRef.current = interval;
    }, []);

    const reset = () => { if (timerRef.current) clearInterval(timerRef.current); applyScenario('normal'); };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4"><Settings className="w-5 h-5 text-blue-500 inline mr-2" />Scenario Selection</h3>
                <div className="flex flex-wrap gap-3">
                    {[
                        { id: 'normal' as const, label: 'Normal', color: 'bg-emerald-600' },
                        { id: 'lof' as const, label: 'Loss of Field (40)', color: 'bg-red-600' },
                        { id: 'reverse' as const, label: 'Reverse Power (32)', color: 'bg-amber-600' },
                        { id: 'neg_seq' as const, label: 'Neg Sequence (46)', color: 'bg-purple-600' },
                        { id: 'stator_gnd' as const, label: 'Stator Gnd (64/87G)', color: 'bg-red-700' },
                    ].map(s => (
                        <button key={s.id} onClick={() => applyScenario(s.id)} disabled={animating}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 ${s.color} ${scenario === s.id ? 'ring-2 ring-white/50 scale-105' : ''}`}>{s.label}</button>
                    ))}
                    <button onClick={reset} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200'}`}><RotateCcw className="w-4 h-4 inline mr-1" />Reset</button>
                </div>
                {animating && <div className="mt-3 text-sm text-amber-500 font-bold animate-pulse">⏳ Simulating fault evolution...</div>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* P-Q Capability Curve */}
                <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> P-Q Capability Curve</h3>
                    <CapabilityCurve isDark={isDark} mw={mw} mvar={mvar} trips={trips} />
                    <div className="flex gap-4 mt-2 text-[10px] font-bold flex-wrap">
                        <span className="text-blue-500">— Armature</span>
                        <span className="text-amber-500">-- Field</span>
                        <span className="text-red-500">-- Stability</span>
                        <span className={trips.length > 0 ? 'text-red-500' : 'text-emerald-500'}>● Operating Point</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Readings */}
                    <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-3"><Activity className="w-4 h-4 text-blue-500 inline mr-2" />Generator Readings</h3>
                        {[
                            { l: 'Active Power', v: `${mw} MW`, c: mw < 0 ? 'text-red-500' : 'text-emerald-500' },
                            { l: 'Reactive Power', v: `${mvar} MVAR`, c: mvar < -10 ? 'text-red-500' : 'text-blue-500' },
                            { l: 'Terminal Voltage', v: `${vt.toFixed(2)} pu`, c: vt < 0.9 ? 'text-red-500' : 'text-emerald-500' },
                            { l: 'Frequency', v: `${freq} Hz` },
                            { l: 'Excitation', v: `${excitation}%`, c: excitation < 10 ? 'text-red-500' : 'text-emerald-500' },
                            { l: 'Elapsed', v: `${elapsed.toFixed(1)}s` },
                        ].map(r => (
                            <div key={r.l} className="flex justify-between text-sm py-0.5">
                                <span className="opacity-60">{r.l}</span>
                                <span className={`font-mono font-bold ${r.c || ''}`}>{r.v}</span>
                            </div>
                        ))}
                    </div>
                    {/* Protection Status */}
                    <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-3"><ShieldCheck className="w-4 h-4 text-emerald-500 inline mr-2" />Protection Status</h3>
                        {trips.length > 0 ? trips.map((t, i) => (
                            <div key={i} className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-sm flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" />{t}</div>
                        )) : (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-center">🟢 All protection elements — NORMAL</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Event Log */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500" /> Event Log</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {events.length === 0 && <p className="text-sm opacity-40 italic">Select a scenario to begin.</p>}
                    <AnimatePresence>
                            {events.map((e, i) => (
                        <motion.div 
                                key={e.msg + i}
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 6 }}
                                className={`text-xs p-2.5 rounded-lg border ${e.type === 'trip' ? 'border-red-500/30 bg-red-500/10' : e.type === 'warn' ? 'border-amber-500/20 bg-amber-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
                            <span className="font-mono opacity-60">[{e.time.toFixed(1)}s]</span> <span className="font-bold">{e.msg}</span>
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
            <div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">Generator Protection Suite</p></div>
        </div>
        {[
            { s: '1', t: 'Select Scenario', d: 'Choose from Normal, Loss of Field, Reverse Power, Negative Sequence, or Stator Ground Fault. Each scenario animates the fault evolution over time instead of snapping to a result.' },
            { s: '2', t: 'Watch the P-Q Curve', d: 'The operating point (green dot) moves on the capability curve as the fault evolves. When it exits the safe operating region, the protection trips. LOF pushes the point into negative MVAR territory.' },
            { s: '3', t: 'Observe Generator Readings', d: 'MW, MVAR, terminal voltage, excitation, and frequency update every 200ms during the scenario. Watch how each parameter degrades during different failure modes.' },
            { s: '4', t: 'Check Protection Events', d: 'The event log shows timestamped messages as the fault evolves. The protection status panel shows which ANSI functions have tripped and why.' },
            { s: '5', t: 'Compare Scenarios', d: 'Try all 5 scenarios to understand how different failure modes affect the generator differently. LOF (40) vs Reverse Power (32) have very different signatures.' },
        ].map(i => (
            <div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div>
                <div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div>
            </div>
        ))}
        <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-2 flex items-center gap-2 text-amber-500"><AlertTriangle className="w-4 h-4" /> Standards</h4>
            <p className="text-sm opacity-80">This simulator models generator protection per <strong>IEEE C37.102</strong> (AC Generator Protection), with LOF per <strong>IEEE C37.102 Appendix</strong> (dual mho scheme) and capability curves per <strong>IEEE C50.13</strong>.</p>
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
            <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div><div><h2 className="text-2xl font-black">Quiz</h2><p className="text-sm opacity-60">Generator protection mastery</p></div></div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                {(['easy', 'medium', 'expert'] as const).map(l => (<button key={l} onClick={() => { setLevel(l); rst(); }} className={`flex-1 py-3 text-sm font-bold uppercase ${level === l ? (l === 'easy' ? 'bg-emerald-600 text-white' : l === 'medium' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white') : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>{l}</button>))}
            </div>
            {fin ? (
                <div className={`text-center p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="text-5xl mb-4">{score >= 4 ? '🏆' : '📚'}</div>
                    <div className="text-3xl font-black mb-2">{score}/{qs.length}</div>
                    <button onClick={rst} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button>
                </div>
            ) : (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between mb-4"><span className="text-xs opacity-40">Q{cur + 1}/{qs.length}</span><span className="text-xs text-emerald-500">Score: {score}</span></div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">{q.opts.map((o, i) => (
                        <button key={i} onClick={() => pick(i)} className={`w-full text-left p-4 rounded-xl border text-sm ${sel === null ? isDark ? 'border-slate-700 hover:border-blue-500' : 'border-slate-200 hover:border-blue-500' : i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : sel === i ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40'}`}>
                            <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{o}
                        </button>
                    ))}</div>
                    {sel !== null && (
                        <div className={`mt-4 p-4 rounded-xl text-sm ${sel === q.ans ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                            <strong>{sel === q.ans ? '✅ Correct!' : '❌ Incorrect.'}</strong> {q.why}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================== MAIN LAYOUT ==============================
export default function GeneratorProtection() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };
    const tabs = [{ id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4" /> }, { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-4 h-4" /> }, { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-4 h-4" /> }, { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4" /> }];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="Generator Protection Suite" description="Interactive generator protection with P-Q capability curve, LOF (40), reverse power (32), negative sequence (46), stator ground (64) per IEEE C37.102." url="/generator-protection" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-blue-600 to-violet-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20"><Zap className="w-5 h-5" /></div><div><h1 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Gen<span className="text-blue-500">Guard</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80">✅ IEEE C37.102</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600') : 'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div><div />
            <button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button></header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab === t.id ? (isDark ? 'text-blue-400' : 'text-blue-600') : 'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <TheoryLibrary title="Generator Protection Handbook" description="Comprehensive guide to generator protection schemes including capability curves, loss of field, reverse power, and stator ground fault." sections={GENERATOR_PROTECTION_THEORY_CONTENT} />}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}><SimulatorModule isDark={isDark} /></div>
                {activeTab === 'guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
