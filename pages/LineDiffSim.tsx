import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, Award, Zap, AlertTriangle, Activity, ShieldCheck, Share2, Cable } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import TheoryLibrary from '../components/TheoryLibrary';
import { TheoryLineChart } from '../components/TheoryDiagrams';
import Slider from '../components/Slider';
import SEO from "../components/SEO";
import { motion, AnimatePresence } from 'framer-motion';

// ============================== 87L ENGINE ==============================
const calcDiffRestraint = (IL: number, IR: number, angleL: number, angleR: number) => {
    // Phasor subtraction for differential current
    const ILx = IL * Math.cos(angleL * Math.PI / 180);
    const ILy = IL * Math.sin(angleL * Math.PI / 180);
    const IRx = IR * Math.cos(angleR * Math.PI / 180);
    const IRy = IR * Math.sin(angleR * Math.PI / 180);
    const Idiff = Math.sqrt((ILx + IRx) ** 2 + (ILy + IRy) ** 2);
    const Irestraint = (IL + IR) / 2; // Average restraint
    return { Idiff, Irestraint };
};

// ============================== THEORY ==============================
const LINE_DIFF_THEORY = [
    { id: 'ld-principle', title: 'Line Differential Principle', icon: Zap, content: [
        { type: 'text' as const, value: 'Line differential protection (87L) compares the current entering one end of a line with the current leaving the other end. Under normal load or external fault conditions, these currents are equal (Kirchhoff\'s Current Law). For an internal fault, the currents are unequal — their phasor sum (differential current) is non-zero.' },
        { type: 'text' as const, value: 'The operating signal is I_diff = |I_local + I_remote| and the restraint signal is I_restraint = (|I_local| + |I_remote|) / 2. The relay trips when I_diff exceeds the restraint characteristic.' },
    ]},
    { id: 'ld-comms', title: 'Communication Channel Requirements', icon: Activity, content: [
        { type: 'text' as const, value: '87L requires a high-bandwidth, low-latency communication channel between the line terminals. Typical options include: direct fiber optic (preferred, <1ms latency), multiplexed telecom networks (5-10ms), or pilot wire. The channel must transmit sampled current phasors at sufficient rates (typically 50/60 samples per cycle).' },
        { type: 'text' as const, value: 'Channel delay compensation is critical: the relay must time-align the local and remote current samples. IEEE C37.243 specifies requirements for current differential via digital communication channels.' },
    ]},
    { id: 'ld-slope', title: 'Dual-Slope Characteristic', icon: Activity, content: [
        { type: 'text' as const, value: 'The 87L uses a dual-slope percentage restraint characteristic identical in concept to transformer differential (87T). Slope 1 (typically 30%) applies at lower restraint currents for sensitive internal fault detection. Slope 2 (typically 60-80%) applies at higher restraint currents to prevent misoperation due to CT saturation or channel errors.' },
        { type: 'custom' as const, value: (
            <div className="my-6">
                <TheoryLineChart 
                    title="Live 87L Characteristic (Restraint vs Differential)"
                    liveTopic="live-state-linediff"
                    liveDot={{ liveKeyX: 'Irestraint', liveKeyY: 'Idiff', label: 'Measured Z', color: '#ef4444' }}
                    data={[
                        { Ir: 0, Id: 0.2 },
                        { Ir: 1, Id: 0.3 },
                        { Ir: 2, Id: 0.6 },
                        { Ir: 4, Id: 1.8 },
                        { Ir: 6, Id: 3.4 },
                        { Ir: 10, Id: 6.6 }
                    ]}
                    xKey="Ir"
                    yKeys={[
                        { key: 'Id', name: 'Tripping Curve (30%/60%)', color: '#3b82f6' }
                    ]}
                    xAxisLabel="Restraint Current (I_restraint)"
                    yAxisLabel="Differential Current (I_diff)"
                    height={280}
                />
            </div>
        )},
        { type: 'text' as const, value: 'The breakpoint between slopes is typically set at 2-5× rated current. A minimum pickup threshold (typically 0.2-0.3 pu) prevents operation on noise or measurement errors.' },
    ]},
    { id: 'ld-advantages', title: '87L vs Distance Protection', icon: ShieldCheck, content: [
        { type: 'text' as const, value: 'Advantages of 87L: (1) No zone reach limitations — protects 100% of the line, (2) immune to load encroachment and power swings, (3) works perfectly on short lines where distance relays struggle with arc resistance, (4) not affected by mutual coupling or infeed effects.' },
        { type: 'text' as const, value: 'Limitations: (1) Requires communication channel — if channel fails, 87L is disabled, (2) affected by CT saturation at both ends, (3) more complex commissioning than distance protection.' },
    ]},
];

// ============================== QUIZ ==============================
const QUIZ_DATA = { easy: [
    { q: "ANSI device number for line differential is:", opts: ["21", "50", "87L", "67"], ans: 2, why: "87L = Line Differential Protection. '87' indicates differential, 'L' specifies line application." },
    { q: "87L compares:", opts: ["Voltage at both ends", "Current at both ends", "Impedance at both ends", "Frequency at both ends"], ans: 1, why: "Line differential compares the current phasors entering and leaving the protected line section." },
    { q: "Under normal load, the differential current is:", opts: ["Maximum", "Zero (or near zero)", "Equal to load current", "Equal to rated current"], ans: 1, why: "By KCL, current entering equals current leaving, so their phasor sum (I_diff) is approximately zero." },
    { q: "87L requires which infrastructure between terminals?", opts: ["No infrastructure", "Communication channel", "Pilot wire only", "GPS only"], ans: 1, why: "87L must exchange current phasor data between terminals, requiring fiber optic, telecom, or pilot wire channels." },
    { q: "The restraint signal prevents:", opts: ["Internal fault detection", "False tripping due to CT errors and load", "Communication", "All tripping"], ans: 1, why: "Restraint ensures the relay only trips when differential current is genuinely high relative to through-current, filtering out measurement errors." },
], medium: [
    { q: "Typical Slope 1 setting for 87L is:", opts: ["5%", "30%", "90%", "100%"], ans: 1, why: "Slope 1 ≈ 30% provides sensitive fault detection at lower current levels while accommodating normal CT mismatch." },
    { q: "Channel delay compensation in 87L ensures:", opts: ["Faster tripping", "Time-alignment of local and remote current samples", "CT accuracy", "VT synchronization"], ans: 1, why: "Without delay compensation, the phase difference due to channel latency would appear as false differential current." },
    { q: "Compared to distance protection, 87L is superior for:", opts: ["Long lines", "Short lines with high arc resistance", "Unmanned substations", "Load monitoring"], ans: 1, why: "Distance relays on short lines have limited resistive reach. 87L has no reach limitation — it protects 100% of the line regardless of fault resistance." },
    { q: "If the communication channel fails, 87L typically:", opts: ["Trips immediately", "Switches to backup (distance) protection", "Continues operating", "Locks out"], ans: 1, why: "On channel failure, 87L is disabled and the relay falls back to distance or overcurrent backup protection." },
    { q: "Slope 2 is higher than Slope 1 to handle:", opts: ["Voltage variations", "CT saturation at high fault currents", "Load changes", "Temperature effects"], ans: 1, why: "At high currents, CTs may saturate differently at each end, creating false differential current. Higher Slope 2 prevents misoperation." },
], expert: [
    { q: "Per IEEE C37.243, the maximum acceptable channel asymmetry for 87L is:", opts: ["0", "1ms", "Depends on relay algorithm (typically <10ms)", "Unlimited"], ans: 2, why: "IEEE C37.243 recommends <10ms channel asymmetry. The relay's alpha-plane or phasor comparison algorithm must tolerate this asymmetry." },
    { q: "Alpha-plane 87L works by plotting:", opts: ["V/I ratio", "I_remote / I_local complex ratio", "Real vs imaginary power", "R vs X impedance"], ans: 1, why: "The alpha plane plots the ratio of remote to local current as a complex number. Internal faults cluster near -1+j0 (currents 180° opposed)." },
    { q: "The charging current of a long cable affects 87L because:", opts: ["It reduces voltage", "It creates standing differential current even without a fault", "It saturates CTs", "It slows communication"], ans: 1, why: "Cable capacitive charging current flows into the cable at both ends, producing a continuous differential signal. 87L must be set above this level." },
    { q: "For a 3-terminal 87L application, the restraint formula becomes:", opts: ["Same as 2-terminal", "I_restraint = max(|I1|, |I2|, |I3|)", "I_restraint = (|I1| + |I2| + |I3|) / 2", "Not possible"], ans: 2, why: "Three-terminal 87L sums all three terminal currents for differential and uses half the sum of magnitudes for restraint." },
    { q: "Current reversal on parallel lines can cause 87L misoperation because:", opts: ["CT fails", "Sequential clearing creates temporary false differential", "Voltage collapses", "Comms fail"], ans: 1, why: "When one parallel line clears a fault, the current distribution changes, briefly creating differential current on the healthy line before the new steady state." },
]};

// ============================== PHASOR CANVAS ==============================
const PhasorCanvas = ({ isDark, IL, IR, angleL, angleR, Idiff, Irestraint, tripState }: {
    isDark: boolean; IL: number; IR: number; angleL: number; angleR: number; Idiff: number; Irestraint: number; tripState: string;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const currentVals = useRef<{ IL?: number; IR?: number; angleL?: number; angleR?: number; Idiff?: number; Irestraint?: number; tripState?: string }>({});

    useEffect(() => {
        const cvs = canvasRef.current; if (!cvs) return;
        const ctx = cvs.getContext('2d'); if (!ctx) return;
        
        // Initialize if not set
        if (currentVals.current.IL === undefined) {
             currentVals.current = { IL, IR, angleL, angleR, Idiff, Irestraint, tripState };
        }
        
        let animationFrameId: number;
        let lastTime = performance.now();

        const renderLoop = (time: number) => {
            const dt = Math.min((time - lastTime) / 16.66, 3);
            lastTime = time;
            const speed = 0.1 * dt; // slightly slower for smoother damping

            const cur = currentVals.current as any;
            cur.IL += (IL - cur.IL) * speed;
            cur.IR += (IR - cur.IR) * speed;
            cur.Idiff += (Idiff - cur.Idiff) * speed;
            cur.Irestraint += (Irestraint - cur.Irestraint) * speed;
            
            const MathMod = (n: number, m: number) => ((n % m) + m) % m;
            const dL = MathMod(angleL - cur.angleL + 180, 360) - 180;
            cur.angleL += dL * speed;
            const dR = MathMod(angleR - cur.angleR + 180, 360) - 180;
            cur.angleR += dR * speed;

            cur.tripState = tripState;

            const w = cvs.width = cvs.offsetWidth * 2;
            const h = cvs.height = cvs.offsetHeight * 2;
            ctx.save();
            ctx.scale(2, 2);
            const cw = w / 2, ch = h / 2;
            ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
            ctx.fillRect(0, 0, cw, ch);

            const cx = cw / 2, cy = ch / 2;
            const scale = Math.min(cw, ch) * 0.3 / Math.max(cur.IL, cur.IR, 1);

            ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(cw, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, ch); ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(cur.IL, cur.IR) * scale, 0, Math.PI * 2);
            ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            const drawPhasor = (mag: number, angle: number, color: string, label: string) => {
                const rad = angle * Math.PI / 180;
                const ex = cx + mag * scale * Math.cos(rad);
                const ey = cy - mag * scale * Math.sin(rad);
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey);
                ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
                const arrowLen = 10, arrowAngle = 0.4;
                const aRad = Math.atan2(cy - ey, ex - cx);
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex - arrowLen * Math.cos(aRad - arrowAngle), ey + arrowLen * Math.sin(aRad - arrowAngle));
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex - arrowLen * Math.cos(aRad + arrowAngle), ey + arrowLen * Math.sin(aRad + arrowAngle));
                ctx.stroke();
                ctx.fillStyle = color;
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillText(label, ex + 8, ey - 5);
            };

            drawPhasor(cur.IL, cur.angleL, '#3b82f6', `I_L (${cur.IL.toFixed(1)}A)`);
            drawPhasor(cur.IR, cur.angleR, '#22c55e', `I_R (${cur.IR.toFixed(1)}A)`);

            const ILx = cur.IL * Math.cos(cur.angleL * Math.PI / 180);
            const ILy = cur.IL * Math.sin(cur.angleL * Math.PI / 180);
            const IRx = cur.IR * Math.cos(cur.angleR * Math.PI / 180);
            const IRy = cur.IR * Math.sin(cur.angleR * Math.PI / 180);
            const diffX = ILx + IRx, diffY = ILy + IRy;
            const diffMag = Math.sqrt(diffX ** 2 + diffY ** 2);
            const diffAngle = Math.atan2(diffY, diffX) * 180 / Math.PI;

            if (diffMag > 0.1) {
                if (cur.tripState === 'TRIP') { ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 15; }
                drawPhasor(diffMag, diffAngle, '#ef4444', `I_d (${diffMag.toFixed(1)}A)`);
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillText('PHASOR DIAGRAM', 8, 16);
            ctx.font = '9px Inter, sans-serif';
            ctx.fillText('Blue = Local, Green = Remote, Red = Differential', 8, 30);

            ctx.fillStyle = cur.tripState === 'TRIP' ? '#ef4444' : cur.tripState === 'RESTRAIN' ? '#22c55e' : isDark ? '#64748b' : '#94a3b8';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText(cur.tripState || 'IDLE', cw - 70, 18);

            ctx.restore();
            animationFrameId = requestAnimationFrame(renderLoop);
        };
        
        animationFrameId = requestAnimationFrame(renderLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isDark, IL, IR, angleL, angleR, Idiff, Irestraint, tripState]);

    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{ height: 280, border: isDark ? '1px solid rgb(30,41,59)' : '1px solid rgb(226,232,240)' }} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [IL, setIL] = useState(500);
    const [IR, setIR] = useState(500);
    const [angleL, setAngleL] = useState(0);
    const [angleR, setAngleR] = useState(180);
    const [slope1, setSlope1] = useState(30);
    const [slope2, setSlope2] = useState(60);
    const [minPickup, setMinPickup] = useState(200);
    const [faultLocation, setFaultLocation] = useState('none');

    const { Idiff, Irestraint } = calcDiffRestraint(IL, IR, angleL, angleR);
    const thresholdAtRestraint = Irestraint <= 2000 ? (slope1 / 100) * Irestraint : (slope2 / 100) * Irestraint;
    const effectiveThreshold = Math.max(thresholdAtRestraint, minPickup);
    const tripState = Idiff > effectiveThreshold ? 'TRIP' : Idiff > 0.1 ? 'RESTRAIN' : 'IDLE';

    const applyPreset = (preset: string) => {
        switch (preset) {
            case 'normal': setIL(500); setIR(500); setAngleL(0); setAngleR(180); setFaultLocation('none'); break;
            case 'internal': setIL(5000); setIR(3000); setAngleL(-30); setAngleR(-30); setFaultLocation('internal'); break;
            case 'external': setIL(5000); setIR(5000); setAngleL(-30); setAngleR(150); setFaultLocation('external'); break;
            case 'ct_sat': setIL(8000); setIR(6500); setAngleL(-20); setAngleR(155); setFaultLocation('external'); break;
        }
    };

    const copyShareLink = () => {
        const state = { IL, IR, angleL, angleR, slope1, slope2, minPickup };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert('Link copied!');
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('s');
        if (s) { try { const st = JSON.parse(atob(s)); Object.entries(st).forEach(([k, v]) => { if (k === 'IL') setIL(v as number); if (k === 'IR') setIR(v as number); if (k === 'angleL') setAngleL(v as number); if (k === 'angleR') setAngleR(v as number); if (k === 'slope1') setSlope1(v as number); if (k === 'slope2') setSlope2(v as number); if (k === 'minPickup') setMinPickup(v as number); }); } catch (e) {} }
    }, []);

    // Dispatch live state for theory diagrams
    useEffect(() => {
        const event = new CustomEvent('live-state-linediff', {
            detail: { Idiff, Irestraint }
        });
        window.dispatchEvent(event);
    }, [Idiff, Irestraint]);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg"><Settings className="w-5 h-5 text-blue-500 inline mr-2" />Configuration</h3>
                    <button onClick={copyShareLink} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"><Share2 className="w-3 h-3" />Share</button>
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs font-bold uppercase opacity-60 self-center mr-2">Presets:</span>
                    {[{ id: 'normal', label: '✅ Normal Load' }, { id: 'internal', label: '⚡ Internal Fault' }, { id: 'external', label: '🔗 External Fault' }, { id: 'ct_sat', label: '🧲 CT Saturation' }].map(p => (
                        <button key={p.id} onClick={() => applyPreset(p.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-slate-100 border-slate-200 hover:border-blue-500'}`}>{p.label}</button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Slider label="Local I" unit="A" min={0} max={10000} step={50} value={IL} onChange={e => setIL(+e.target.value)} color="blue" />
                    <Slider label="Remote I" unit="A" min={0} max={10000} step={50} value={IR} onChange={e => setIR(+e.target.value)} color="emerald" />
                    <Slider label="Local Angle" unit="°" min={-180} max={180} step={5} value={angleL} onChange={e => setAngleL(+e.target.value)} color="blue" />
                    <Slider label="Remote Angle" unit="°" min={-180} max={180} step={5} value={angleR} onChange={e => setAngleR(+e.target.value)} color="emerald" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <Slider label="Slope 1" unit="%" min={10} max={50} step={1} value={slope1} onChange={e => setSlope1(+e.target.value)} color="amber" />
                    <Slider label="Slope 2" unit="%" min={40} max={100} step={1} value={slope2} onChange={e => setSlope2(+e.target.value)} color="amber" />
                    <Slider label="Min Pickup" unit="A" min={50} max={1000} step={10} value={minPickup} onChange={e => setMinPickup(+e.target.value)} color="amber" />
                </div>
            </div>

            <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 text-sm"><Activity className="w-4 h-4 text-blue-500 inline mr-2" />Phasor Diagram</h3>
                <PhasorCanvas isDark={isDark} IL={IL} IR={IR} angleL={angleL} angleR={angleR} Idiff={Idiff} Irestraint={Irestraint} tripState={tripState} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3"><ShieldCheck className="w-4 h-4 text-blue-500 inline mr-2" />Relay Decision</h3>
                    {[
                        { l: 'I_differential', v: `${Idiff.toFixed(1)}A`, c: Idiff > effectiveThreshold ? 'text-red-500 font-bold' : '' },
                        { l: 'I_restraint', v: `${Irestraint.toFixed(1)}A` },
                        { l: 'Threshold', v: `${effectiveThreshold.toFixed(1)}A` },
                        { l: 'Decision', v: tripState, c: tripState === 'TRIP' ? 'text-red-500 font-bold text-lg' : 'text-emerald-500 font-bold text-lg' },
                        { l: 'Scenario', v: faultLocation === 'internal' ? '⚡ Internal Fault' : faultLocation === 'external' ? '🔗 External Fault' : '✅ Normal' },
                    ].map(r => (<div key={r.l} className="flex justify-between text-sm py-1"><span className="opacity-60">{r.l}</span><span className={`font-mono ${r.c || ''}`}>{r.v}</span></div>))}
                </div>
                <motion.div key={tripState} initial={{ scale: 0.95, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-2xl border p-5 text-center ${tripState === 'TRIP' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                    <motion.div animate={{ scale: tripState === 'TRIP' ? [1, 1.2, 1] : 1 }} transition={{ repeat: tripState === 'TRIP' ? Infinity : 0, duration: 2 }} className="text-5xl mb-3">{tripState === 'TRIP' ? '🔴' : '🟢'}</motion.div>
                    <div className={`font-black text-xl ${tripState === 'TRIP' ? 'text-red-500' : 'text-emerald-500'}`}>{tripState === 'TRIP' ? '87L TRIP' : '87L RESTRAINED'}</div>
                    <p className="text-sm opacity-60 mt-2">{tripState === 'TRIP' ? `I_diff (${Idiff.toFixed(0)}A) exceeds threshold (${effectiveThreshold.toFixed(0)}A)` : `I_diff (${Idiff.toFixed(0)}A) within restraint. Normal operation.`}</p>
                </motion.div>
            </div>
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">Line Differential Protection (87L)</p></div></div>
        {[
            { s: '1', t: 'Understand the Concept', d: 'Two current measurements (Local and Remote ends of the line) are compared. Under normal conditions, they are equal and opposite (sum ≈ 0). Under internal faults, they add up (sum >> 0).' },
            { s: '2', t: 'Use Presets', d: 'Click "Normal Load" to see balanced currents (I_diff ≈ 0). Click "Internal Fault" to see how currents from both ends feed the fault (high I_diff). Click "External Fault" to see through-fault conditions (I_diff ≈ 0).' },
            { s: '3', t: 'Adjust Slope Settings', d: 'Slope 1 determines sensitivity. Higher slope = more security against CT errors. Lower slope = more sensitive to internal faults. Slope 2 handles CT saturation at high currents.' },
            { s: '4', t: 'Observe the Phasor Diagram', d: 'Blue = Local current, Green = Remote current, Red = Differential (their vector sum). For internal faults, both contribute → large red phasor. For external faults, they cancel.' },
        ].map(i => (<div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div><div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div></div>))}
        <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-2 text-amber-500"><AlertTriangle className="w-4 h-4 inline mr-1" />Standards</h4>
            <p className="text-sm opacity-80">Modeled per <strong>IEEE C37.243</strong> (Line Current Differential Protection) and <strong>IEC 60255-121</strong> (Differential Protection Relays).</p>
        </div>
    </div>
);

// ============================== QUIZ MODULE ==============================
const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level, setLevel] = useState<'easy' | 'medium' | 'expert'>('easy');
    const [cur, setCur] = useState(0); const [score, setScore] = useState(0);
    const [sel, setSel] = useState<number | null>(null); const [fin, setFin] = useState(false);
    const qs = QUIZ_DATA[level]; const q = qs[cur];
    const pick = (i: number) => { if (sel !== null) return; setSel(i); if (i === q.ans) setScore(p => p + 1); setTimeout(() => { if (cur + 1 >= qs.length) setFin(true); else { setCur(p => p + 1); setSel(null); } }, 2500); };
    const rst = () => { setCur(0); setScore(0); setSel(null); setFin(false); };
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div><div><h2 className="text-2xl font-black">Quiz</h2></div></div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>{(['easy', 'medium', 'expert'] as const).map(l => (<button key={l} onClick={() => { setLevel(l); rst(); }} className={`flex-1 py-3 text-sm font-bold uppercase ${level === l ? (l === 'easy' ? 'bg-emerald-600 text-white' : l === 'medium' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white') : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>{l}</button>))}</div>
            {fin ? (<div className={`text-center p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="text-5xl mb-4">{score >= 4 ? '🏆' : '📚'}</div><div className="text-3xl font-black mb-2">{score}/{qs.length}</div><button onClick={rst} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button></div>) : (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between mb-4"><span className="text-xs opacity-40">Q{cur + 1}/{qs.length}</span><span className="text-xs text-emerald-500">Score: {score}</span></div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">{q.opts.map((o, i) => (<button key={i} onClick={() => pick(i)} className={`w-full text-left p-4 rounded-xl border text-sm ${sel === null ? isDark ? 'border-slate-700 hover:border-blue-500' : 'border-slate-200 hover:border-blue-500' : i === q.ans ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : sel === i ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40'}`}><span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{o}</button>))}</div>
                    {sel !== null && <div className={`mt-4 p-4 rounded-xl text-sm ${sel === q.ans ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'}`}><strong>{sel === q.ans ? '✅ Correct!' : '❌ Incorrect.'}</strong> {q.why}</div>}
                </div>
            )}
        </div>
    );
};

// ============================== MAIN ==============================
export default function LineDiffSim() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    const tabs = [{ id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4" /> }, { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-4 h-4" /> }, { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-4 h-4" /> }, { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4" /> }];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="Line Differential Protection (87L)" description="Interactive 87L line differential simulator with phasor diagrams, dual-slope restraint, and IEEE C37.243 compliance." url="/line-diff" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-cyan-600 to-blue-600 p-2 rounded-lg text-white shadow-lg shadow-cyan-500/20"><Cable className="w-5 h-5" /></div><div><h1 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Line<span className="text-cyan-500">Diff</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/80">✅ IEEE C37.243 / IEC 60255</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-cyan-400' : 'bg-white text-cyan-600') : 'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
                <div />
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab === t.id ? (isDark ? 'text-cyan-400' : 'text-cyan-600') : 'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <TheoryLibrary title="Line Differential Handbook" description="87L principles, communication requirements, dual-slope characteristics, and comparison with distance protection." sections={LINE_DIFF_THEORY as any} />}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}><SimulatorModule isDark={isDark} /></div>
                {activeTab === 'guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
