import React, { useState, useEffect, useRef } from 'react';
import {
    Play, RotateCcw, AlertCircle, CheckCircle2, XCircle, Activity, Zap,
    HelpCircle, Book, AlertTriangle, Settings, MonitorPlay, GraduationCap,
    ShieldCheck, Award, GitMerge, Power, Sliders, Share2, Info, ChevronRight, Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { useSmoothedValues } from '../hooks/useSmoothedValues';
import TheoryLibrary from '../components/TheoryLibrary';
import Slider from '../components/Slider';
import { TRANSFORMER_PROTECTION_THEORY_CONTENT } from '../data/learning-modules/transformer-protection';
import SEO from "../components/SEO";

// ========================= CONSTANTS =========================
const VECTOR_GROUPS = [
    { id: 'Dyn11', label: 'Dyn11', shift: -30, desc: 'Most common distribution transformer' },
    { id: 'Dyn1', label: 'Dyn1', shift: 30, desc: 'Common in some European networks' },
    { id: 'YNyn0', label: 'YNyn0', shift: 0, desc: 'Auto-transformer, no phase shift' },
    { id: 'Yd5', label: 'Yd5', shift: -150, desc: 'Used in some industrial applications' },
    { id: 'Yd11', label: 'Yd11', shift: -330, desc: 'Common in generator step-up' },
];

const QUIZ_DATA = {
    easy: [
        { q: "What ANSI code designates transformer differential protection?", opts: ["50", "51", "87T", "21"], ans: 2 },
        { q: "Magnetizing inrush current is rich in which harmonic?", opts: ["3rd", "2nd", "5th", "7th"], ans: 1 },
        { q: "A Dyn11 transformer introduces a phase shift of:", opts: ["0°", "-30°", "60°", "90°"], ans: 1 },
        { q: "The restraint current in differential protection is used to:", opts: ["Trip faster", "Prevent false tripping from CT errors", "Measure voltage", "Calculate power"], ans: 1 },
        { q: "Overexcitation (V/Hz) protection uses which harmonic for blocking?", opts: ["2nd", "3rd", "5th", "7th"], ans: 2 },
    ],
    medium: [
        { q: "Modern relays perform vector group compensation using:", opts: ["External interposing CTs", "Digital software matrix", "Voltage transformers", "Resistance matching"], ans: 1 },
        { q: "The 2nd harmonic ratio threshold for inrush blocking is typically:", opts: ["5%", "15%", "30%", "50%"], ans: 1 },
        { q: "On-Load Tap Changers (OLTC) affect 87T by:", opts: ["Changing the turns ratio (CT mismatch)", "Changing the frequency", "Producing harmonics", "Reducing voltage"], ans: 0 },
        { q: "Per IEEE C57.12, a transformer can continuously operate at V/Hz up to:", opts: ["100%", "105%", "110%", "120%"], ans: 2 },
        { q: "The differential current (Id) is calculated as:", opts: ["I₁ + I₂", "|I₁ - I₂|", "I₁ × I₂", "I₁ / I₂"], ans: 1 },
    ],
    expert: [
        { q: "Sympathetic inrush affects parallel transformers because:", opts: ["They share the same CT", "Core flux disturbance spreads", "Voltage collapses", "Frequency changes"], ans: 1 },
        { q: "For a Yd5 transformer, the relay must apply a phase compensation of:", opts: ["-30°", "-150°", "+150°", "0°"], ans: 1 },
        { q: "Cross-blocking between parallel transformer 87T relays prevents:", opts: ["Overexcitation", "Sympathetic inrush maloperation", "CT saturation", "Voltage swells"], ans: 1 },
        { q: "The 5th harmonic blocking threshold for overexcitation is typically:", opts: ["10%", "25%", "50%", "5%"], ans: 1 },
        { q: "During a transformer internal fault with CT saturation on one side:", opts: ["The relay speeds up", "The 87T may fail to trip (security vs dependability)", "The relay blocks", "Harmonics increase"], ans: 1 },
    ],
};

// ========================= SIMULATOR =========================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [vectorGroup, setVectorGroup] = useState(VECTOR_GROUPS[0]);
    const [hvCurrent, setHvCurrent] = useState(1.0);
    const [lvCurrent, setLvCurrent] = useState(1.0);
    const [tapPosition, setTapPosition] = useState(0);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('s');
        if (s) { try { const st = JSON.parse(atob(s)); if (st.vectorGroup) setVectorGroup(VECTOR_GROUPS.find(v => v.id === st.vectorGroup.id) || VECTOR_GROUPS[0]); if (st.hvCurrent) setHvCurrent(st.hvCurrent); if (st.lvCurrent) setLvCurrent(st.lvCurrent); if (st.tapPosition) setTapPosition(st.tapPosition); } catch (e) {} }
    }, []);

    const [inrushActive, setInrushActive] = useState(false);
    const [faultActive, setFaultActive] = useState(false);
    const [harmonic2nd, setHarmonic2nd] = useState(0);
    const [harmonic5th, setHarmonic5th] = useState(0);
    const [slopeK1] = useState(0.3);
    const [slopeK2] = useState(0.7);
    const [events, setEvents] = useState<string[]>([]);

    const smoothed = useSmoothedValues({ hvCurrent, tapPosition, lvCurrent, harmonic2nd, harmonic5th });

    // Vector group compensation
    const phaseShiftRad = (vectorGroup.shift * Math.PI) / 180;
    const compensatedHV = smoothed.hvCurrent; // Magnitude stays same, phase shifts
    const tapFactor = 1 + (smoothed.tapPosition * 0.025); // ±2.5% per tap
    const effectiveLV = smoothed.lvCurrent * tapFactor;

    // Differential & restraint calculations
    const Id = Math.abs(compensatedHV - effectiveLV);
    const Ir = (compensatedHV + effectiveLV) / 2;

    // Slope check
    const slopeThreshold = Ir <= 1.0 ? slopeK1 * Ir : slopeK1 * 1.0 + slopeK2 * (Ir - 1.0);
    const wouldTrip = Id > Math.max(0.2, slopeThreshold);

    // Harmonic blocking
    const blocked2nd = smoothed.harmonic2nd > 15;
    const blocked5th = smoothed.harmonic5th > 25;
    const blocked = blocked2nd || blocked5th;
    const tripResult = wouldTrip && !blocked;

    // Dispatch live state for theory diagrams
    useEffect(() => {
        const event = new CustomEvent('live-state-transformer', {
            detail: { 
                Id, 
                Ir,
                hvCurrent: compensatedHV,
                lvCurrent: effectiveLV,
                harmonic2nd: smoothed.harmonic2nd,
                harmonic5th: smoothed.harmonic5th
            }
        });
        window.dispatchEvent(event);
    }, [Id, Ir, compensatedHV, effectiveLV, smoothed.harmonic2nd, smoothed.harmonic5th]);

    const injectInrush = () => {
        setInrushActive(true);
        setHvCurrent(6.0);
        setLvCurrent(0.1);
        setHarmonic2nd(35);
        setHarmonic5th(5);
        setEvents(prev => ['⚡ Inrush: 6× rated on HV, 2nd harmonic = 35%', ...prev].slice(0, 15));
        setTimeout(() => { setInrushActive(false); setHvCurrent(1.0); setLvCurrent(1.0); setHarmonic2nd(0); setHarmonic5th(0); }, 3000);
    };

    const injectFault = () => {
        setFaultActive(true);
        setHvCurrent(8.0);
        setLvCurrent(0.5);
        setHarmonic2nd(5);
        setHarmonic5th(3);
        setEvents(prev => ['🔴 Internal Fault: Id = high, No harmonics → TRIP expected', ...prev].slice(0, 15));
    };

    const reset = () => {
        setFaultActive(false); setInrushActive(false);
        setHvCurrent(1.0); setLvCurrent(1.0);
        setHarmonic2nd(0); setHarmonic5th(0);
        setTapPosition(0); setEvents([]);
    };

    // Phasor canvas
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        const w = cvs.width, h = cvs.height;
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 30;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

        // Draw phasors for 3 phases (HV side)
        const phaseColors = ['#ef4444', '#eab308', '#3b82f6'];
        const phaseLabels = ['A', 'B', 'C'];
        const phaseAngles = [0, -120, 120];

        phaseAngles.forEach((baseAngle, i) => {
            // HV phasor
            const hvAngle = ((baseAngle - 90) * Math.PI) / 180;
            const hvLen = (smoothed.hvCurrent / 10) * r;
            ctx.strokeStyle = phaseColors[i];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(hvAngle) * hvLen, cy + Math.sin(hvAngle) * hvLen);
            ctx.stroke();

            // Arrow
            const ax = cx + Math.cos(hvAngle) * hvLen;
            const ay = cy + Math.sin(hvAngle) * hvLen;
            ctx.fillStyle = phaseColors[i];
            ctx.beginPath();
            ctx.arc(ax, ay, 4, 0, Math.PI * 2);
            ctx.fill();

            // LV phasor (with vector group shift)
            const lvAngle = ((baseAngle + vectorGroup.shift - 90) * Math.PI) / 180;
            const lvLen = (effectiveLV / 10) * r;
            ctx.strokeStyle = phaseColors[i] + '80';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(lvAngle) * lvLen, cy + Math.sin(lvAngle) * lvLen);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Labels
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Vector: ${vectorGroup.id} (${vectorGroup.shift}°)`, cx, h - 10);
        ctx.fillText('— HV (solid)  --- LV (dashed)', cx, h - 25);
    }, [smoothed, effectiveLV, vectorGroup, isDark]);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500" /> Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Vector Group</label>
                        <select value={vectorGroup.id} onChange={e => setVectorGroup(VECTOR_GROUPS.find(v => v.id === e.target.value) || VECTOR_GROUPS[0])}
                            className={`w-full p-2.5 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            {VECTOR_GROUPS.map(v => <option key={v.id} value={v.id}>{v.label} ({v.shift}°)</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 mt-4">
                    <Slider label="HV Phase Current" unit=" pu" min={0} max={10} step={0.1} value={hvCurrent} onChange={e => setHvCurrent(parseFloat(e.target.value))} color="red" />
                    <Slider label="LV Phase Current" unit=" pu" min={0} max={10} step={0.1} value={lvCurrent} onChange={e => setLvCurrent(parseFloat(e.target.value))} color="blue" />
                    <Slider label="OLTC Tap Position" min={-5} max={5} step={1} value={tapPosition} onChange={e => setTapPosition(parseInt(e.target.value))} color="amber" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                    <Slider label="2nd Harmonic (Inrush)" unit="%" min={0} max={50} step={1} value={harmonic2nd} onChange={e => setHarmonic2nd(parseFloat(e.target.value))} color="amber" />
                    <Slider label="5th Harmonic (V/Hz)" unit="%" min={0} max={50} step={1} value={harmonic5th} onChange={e => setHarmonic5th(parseFloat(e.target.value))} color="emerald" />
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                    <button onClick={injectFault} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20">
                        <Zap className="w-4 h-4" /> Inject Fault
                    </button>
                    <button onClick={injectInrush} className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-all">
                        <Activity className="w-4 h-4" /> Simulate Inrush
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phasor Diagram */}
                <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-4">Phasor Diagram (Vector Group)</h3>
                    <canvas ref={canvasRef} width={300} height={300} className="mx-auto" />
                </div>

                {/* Differential Analysis */}
                <div className={`rounded-2xl border p-6 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> 87T Analysis</h3>
                    {[
                        { label: 'Differential Current (Id)', value: Id.toFixed(3), unit: 'pu', color: Id > 0.2 ? 'text-red-500' : 'text-emerald-500' },
                        { label: 'Restraint Current (Ir)', value: Ir.toFixed(3), unit: 'pu', color: 'text-blue-500' },
                        { label: 'Slope Threshold', value: Math.max(0.2, slopeThreshold).toFixed(3), unit: 'pu', color: 'text-amber-500' },
                        { label: '2nd Harmonic', value: `${harmonic2nd}%`, unit: blocked2nd ? 'BLOCKING' : 'OK', color: blocked2nd ? 'text-amber-500' : 'text-emerald-500' },
                        { label: '5th Harmonic', value: `${harmonic5th}%`, unit: blocked5th ? 'BLOCKING' : 'OK', color: blocked5th ? 'text-amber-500' : 'text-emerald-500' },
                    ].map(item => (
                        <div key={item.label} className="flex justify-between text-sm">
                            <span className="opacity-60">{item.label}</span>
                            <span className={`font-bold font-mono ${item.color}`}>{item.value} {item.unit}</span>
                        </div>
                    ))}

                    <div className={`mt-4 p-4 rounded-xl text-center font-bold text-lg border ${
                        faultActive || inrushActive
                            ? tripResult
                                ? 'bg-red-500/10 text-red-500 border-red-500/30'
                                : blocked
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                        {!faultActive && !inrushActive ? '⏸ STANDBY' :
                         tripResult ? '🔴 87T TRIP' :
                         blocked ? `🟡 BLOCKED (${blocked2nd ? '2nd' : '5th'} Harmonic)` :
                         '🟢 STABLE'}
                    </div>
                </div>
            </div>

            {/* Event Log */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3"><AlertCircle className="w-4 h-4 text-amber-500 inline mr-2" />Event Log</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {events.length === 0 && <p className="text-sm opacity-40 italic">No events.</p>}
                    <AnimatePresence>
                        {events.map((e, i) => (
                            <motion.div 
                                key={e + i}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-xs font-mono p-2 rounded bg-slate-800/50 mb-1"
                            >
                                {e}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ========================= GUIDE & QUIZ =========================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div>
            <div><h2 className="text-2xl font-black text-slate-900 dark:text-white">User Guide</h2><p className="text-sm opacity-60">How to use the Transformer Protection Simulator</p></div>
        </div>
        {[
            { step: '1', title: 'Select Vector Group', desc: 'Choose the transformer\'s vector group (e.g., Dyn11, Yd5). The phasor diagram updates to show the phase shift between HV and LV sides.' },
            { step: '2', title: 'Adjust Currents', desc: 'Use sliders to set HV and LV currents. Under normal load, both should be ~1.0 pu with minimal differential.' },
            { step: '3', title: 'Adjust Tap Changer', desc: 'Move the tap position to see how OLTC affects the restraint current and differential sensitivity.' },
            { step: '4', title: 'Inject Fault or Inrush', desc: '"Inject Fault" creates a high Id with low harmonics → relay trips. "Simulate Inrush" creates high Id WITH 2nd harmonic → relay blocks.' },
            { step: '5', title: 'Analyze Results', desc: 'The 87T Analysis panel shows Id, Ir, harmonic levels, and the trip/block decision.' },
        ].map(item => (
            <div key={item.step} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0">{item.step}</div>
                <div><h4 className="font-bold">{item.title}</h4><p className="text-sm opacity-70 mt-1">{item.desc}</p></div>
            </div>
        ))}
    </div>
);

const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy' | 'medium' | 'expert'>('easy');
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [finished, setFinished] = useState(false);
    const questions = QUIZ_DATA[level]; const q = questions[current];
    const handleSelect = (idx: number) => { if (selected !== null) return; setSelected(idx); if (idx === q.ans) setScore(prev => prev + 1); setTimeout(() => { if (current + 1 >= questions.length) setFinished(true); else { setCurrent(prev => prev + 1); setSelected(null); } }, 1200); };
    const resetQuiz = () => { setCurrent(0); setScore(0); setSelected(null); setFinished(false); };
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div><div><h2 className="text-2xl font-black text-slate-900 dark:text-white">Knowledge Quiz</h2><p className="text-sm opacity-60">Transformer protection</p></div></div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>{(['easy', 'medium', 'expert'] as const).map(l => (<button key={l} onClick={() => { setLevel(l); resetQuiz(); }} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${level === l ? (l === 'easy' ? 'bg-emerald-600 text-white' : l === 'medium' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white') : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>{l}</button>))}</div>
            {finished ? (
                <div className={`text-center p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="text-5xl mb-4">{score >= 4 ? '🏆' : score >= 3 ? '✅' : '📚'}</div><div className="text-3xl font-black mb-2">{score}/{questions.length}</div><button onClick={resetQuiz} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button></div>
            ) : (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold opacity-40">Q{current + 1}/{questions.length}</span><span className="text-xs font-bold text-emerald-500">Score: {score}</span></div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">{q.opts.map((opt, i) => (<button key={i} onClick={() => handleSelect(i)} className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all ${selected === null ? isDark ? 'border-slate-700 hover:border-blue-500' : 'border-slate-200 hover:border-blue-500' : i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : selected === i ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40'}`}><span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}</button>))}</div>
                </div>
            )}
        </div>
    );
};

// ========================= MAIN LAYOUT =========================
export default function TransformerProtection() {
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
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="Transformer Protection (87T)" description="Interactive transformer differential protection simulator with vector group compensation, harmonic restraint, inrush blocking, and V/Hz overexcitation per IEEE C37.91." url="/transformer-protection" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-2 rounded-lg text-white shadow-lg shadow-amber-500/20"><GitMerge className="w-5 h-5" /></div>
                    <div><h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Transformer <span className="text-amber-500">87T</span></h1>
                    <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Differential + Harmonic</span><span className="w-1 h-1 bg-slate-400 rounded-full opacity-50" /><span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">✅ IEEE C37.91 / IEC 60076</span></div></div>
                </div>
                <div className={`hidden md:flex items-center p-1 rounded-xl border shadow-sm mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id ? (isDark ? 'bg-slate-800 text-amber-400 shadow-sm' : 'bg-white text-amber-600 shadow-sm') : 'opacity-60 hover:opacity-100'}`}>{tab.icon} <span>{tab.label}</span></button>))}
                </div>
                <div />
            <button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button></header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center px-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold ${activeTab === tab.id ? (isDark ? 'text-amber-400' : 'text-amber-600') : 'opacity-50'}`}>{tab.icon} <span>{tab.label}</span></button>))}
            </div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <TheoryLibrary title="Transformer Protection Handbook" description="Complete guide to 87T differential protection, vector groups, harmonic blocking, and V/Hz protection." sections={TRANSFORMER_PROTECTION_THEORY_CONTENT} />}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}><SimulatorModule isDark={isDark} /></div>
                {activeTab === 'guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
