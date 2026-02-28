import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, Award, Timer, Zap, AlertTriangle, CheckCircle2, Play, Activity, ShieldCheck, Share2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { useSmoothedValues } from '../hooks/useSmoothedValues';
import TheoryLibrary from '../components/TheoryLibrary';
import { TheoryLineChart } from '../components/TheoryDiagrams';
import Slider from '../components/Slider';
import SEO from "../components/SEO";
import Odometer from '../components/Odometer';

// ============================== IEC CURVES (IEC 60255-151) ==============================
const IEC_CURVES: Record<string, { A: number; B: number; P: number; label: string }> = {
    SI:  { A: 0.14, B: 0, P: 0.02, label: 'Standard Inverse (SI)' },
    VI:  { A: 13.5, B: 0, P: 1.0,  label: 'Very Inverse (VI)' },
    EI:  { A: 80.0, B: 0, P: 2.0,  label: 'Extremely Inverse (EI)' },
    LTI: { A: 120,  B: 0, P: 1.0,  label: 'Long-Time Inverse (LTI)' },
};

const calcTripTime = (I: number, Ip: number, tms: number, curve: string): number | null => {
    if (I <= Ip) return null;
    const c = IEC_CURVES[curve];
    if (!c) return null;
    const M = I / Ip;
    const time = tms * (c.A / (Math.pow(M, c.P) - 1) + c.B);
    return Math.max(0.02, time); // 20ms mechanical minimum limit
};

// ============================== THEORY ==============================
const OC_THEORY = [
    { id: 'oc-fundamentals', title: 'Overcurrent Protection Fundamentals', icon: Zap, content: [
        { type: 'text' as const, value: 'Overcurrent protection (ANSI 50/51) is the most widely used protection scheme. Element 50 provides instantaneous tripping above a set current threshold; Element 51 provides time-delayed tripping following an inverse-time curve per IEC 60255-151.' },
        { type: 'text' as const, value: 'The relay measures the RMS current flowing through the CT and compares it against configured pickup values. When current exceeds pickup, the relay starts a timing element.' },
    ]},
    { id: 'oc-curves', title: 'Time-Current Characteristics (IEC 60255)', icon: TrendingUp, content: [
        { type: 'text' as const, value: 'The IEC standard defines four characteristic curves: Standard Inverse (SI), Very Inverse (VI), Extremely Inverse (EI), and Long-Time Inverse (LTI). Each uses the formula: t = TMS × A / (M^P − 1), where M = I/Ip is the current multiple.' },
        { type: 'custom' as const, value: (
            <div className="my-6">
                <TheoryLineChart 
                    title="Live TCC Explorer (Current vs Time)"
                    liveTopic="live-state-overcurrent"
                    liveDot={{ liveKeyX: 'multiple', liveKeyY: 'tripTime', label: 'Measured Z', color: '#f59e0b' }}
                    data={[
                        { multiple: 1.1, SI: 2.97, VI: 135, EI: 800 },
                        { multiple: 2, SI: 1, VI: 13.5, EI: 26.6 },
                        { multiple: 4, SI: 0.5, VI: 4.5, EI: 5.3 },
                        { multiple: 10, SI: 0.29, VI: 1.5, EI: 0.8 },
                        { multiple: 20, SI: 0.23, VI: 0.71, EI: 0.2 }
                    ]}
                    xKey="multiple"
                    yKeys={[
                        { key: 'SI', name: 'SI (A=0.14, P=0.02)', color: '#3b82f6' },
                        { key: 'VI', name: 'VI (A=13.5, P=1.0)', color: '#10b981' },
                        { key: 'EI', name: 'EI (A=80, P=2.0)', color: '#ef4444' }
                    ]}
                    xAxisLabel="Current Multiple (I/Ip)"
                    yAxisLabel="Trip Time (Seconds)"
                    height={300}
                />
            </div>
        )},
        { type: 'text' as const, value: 'SI curve: A=0.14, P=0.02 — Used for general applications. VI curve: A=13.5, P=1.0 — Used where fault current varies significantly with distance. EI curve: A=80, P=2.0 — Used for transformer/motor protection where high I²t damage occurs rapidly.' },
    ]},
    { id: 'oc-coordination', title: 'Grading & Coordination', icon: Activity, content: [
        { type: 'text' as const, value: 'Adjacent overcurrent relays must be coordinated so that the device closest to the fault trips first. The minimum Coordination Time Interval (CTI) is typically 0.3–0.4 seconds, accounting for relay operating time tolerance, breaker clearing time, and CT error.' },
        { type: 'text' as const, value: 'Grading is performed starting from the load end and working towards the source. Each upstream relay TMS is selected to be CTI seconds slower than the downstream relay at the maximum fault current seen by both.' },
    ]},
    { id: 'oc-directional', title: 'Directional Overcurrent (67)', icon: ShieldCheck, content: [
        { type: 'text' as const, value: 'In looped or interconnected networks, directional overcurrent elements (ANSI 67) prevent misoperation by only allowing trip if fault current flows in the designated direction. The directional element compares the phase angle of current against a reference (polarizing) quantity — typically voltage or a derived signal.' },
        { type: 'text' as const, value: '67N (Directional Ground Overcurrent) uses zero-sequence voltage (3V0) as the polarizing signal and zero-sequence current (3I0) as the operating signal. The forward/reverse decision ensures selectivity in ring buses and parallel feeder configurations.' },
    ]},
];

// ============================== QUIZ ==============================
const QUIZ_DATA = { easy: [
    { q: "ANSI 50 designates:", opts: ["Time overcurrent", "Instantaneous overcurrent", "Directional relay", "Distance relay"], ans: 1, why: "ANSI 50 = Instantaneous Overcurrent. It trips immediately when current exceeds the threshold — no time delay." },
    { q: "The pickup current of a 51 relay should be set:", opts: ["Above maximum load current", "Below minimum fault current", "Both A and B", "At the CT ratio"], ans: 2, why: "Pickup must be above max load (to avoid nuisance tripping) and below min fault current (to ensure detection). Both conditions must be met." },
    { q: "TMS stands for:", opts: ["Time Multiplier Setting", "Total Maximum Seconds", "Trip Mode Selector", "Transient Monitor System"], ans: 0, why: "TMS (Time Multiplier Setting) adjusts the overall operating time of the inverse-time curve up or down." },
    { q: "Which IEC curve type is the fastest for high fault currents?", opts: ["Standard Inverse", "Very Inverse", "Extremely Inverse", "Long-Time Inverse"], ans: 2, why: "EI has P=2.0, meaning trip time drops as the square of the current multiple — the fastest response for high multiples." },
    { q: "The minimum fault current a relay must detect is called:", opts: ["Pickup current", "Reset current", "Holding current", "Breaking current"], ans: 0, why: "Pickup current is the minimum current that causes the relay to start its timing element." },
], medium: [
    { q: "The CTI between adjacent relays typically is:", opts: ["0.01s", "0.1s", "0.3–0.4s", "5s"], ans: 2, why: "CTI = breaker clearing (~5 cycles) + relay overshoot (~50ms) + safety margin (~100ms) ≈ 0.3–0.4s per IEEE/IEC." },
    { q: "For a motor starting at 6× FLA, the best curve type is:", opts: ["SI", "VI", "EI", "Definite Time"], ans: 2, why: "EI rides over the high inrush quickly (I²t proportional), preventing nuisance tripping during motor starting while still protecting against sustained faults." },
    { q: "51N uses which current component?", opts: ["Positive sequence", "Negative sequence", "Zero sequence (3I0)", "Phase current"], ans: 2, why: "51N = Time Overcurrent Neutral/Ground. It operates on zero-sequence current (3I0) to detect ground faults." },
    { q: "High-set instantaneous (50) is typically set at:", opts: ["1.2× FLA", "1.5× pickup", "120-130% of max through-fault at relay", "50% of rated current"], ans: 2, why: "50 is set above the maximum through-fault current for a fault at the remote bus, plus a safety margin, to ensure it only trips for faults within the protected zone." },
    { q: "Reset ratio of an overcurrent relay is typically:", opts: ["1.0", "0.95-0.97", "0.5", "0.1"], ans: 1, why: "Reset ratio = dropout current / pickup current ≈ 0.95–0.97. The relay drops out at slightly less current than pickup to provide hysteresis." },
], expert: [
    { q: "IEC 60255 SI curve formula is t = TMS ×:", opts: ["0.14/(M² − 1)", "0.14/(M^0.02 − 1)", "13.5/(M − 1)", "80/(M² − 1)"], ans: 1, why: "SI: t = TMS × 0.14 / (M^0.02 − 1) where M = I/Ip. The exponent 0.02 gives a nearly flat curve at high multiples." },
    { q: "For a solidly grounded system, the zero-sequence source impedance is:", opts: ["Equal to positive sequence", "Three times positive sequence", "Depends on transformer winding and grounding", "Infinite"], ans: 2, why: "Z0 source depends on the transformer configuration (Yg-Delta, Yg-Yg) and grounding impedance. It is NOT simply related to Z1." },
    { q: "Cold load pickup is a concern because:", opts: ["CT saturates", "Load current after prolonged outage exceeds normal demand", "Relays reset", "Voltage is high"], ans: 1, why: "After a long outage, all motors restart simultaneously with loss of diversity, creating current 2-3× normal load. 51 must not trip on this." },
    { q: "Thermal replica in 51 works by:", opts: ["Measuring temperature", "Integrating I²t to model conductor heating", "Monitoring CT burden", "Tracking voltage"], ans: 1, why: "Thermal replica accumulates I²t to estimate conductor temperature, providing protection against cumulative overloading." },
    { q: "Per IEEE C37.112, the 'reset characteristic' affects coordination when:", opts: ["Load is constant", "Fault current is interrupted before relay operates, then re-applied", "CT is oversized", "VTs fail"], ans: 1, why: "If a downstream device clears a fault but it re-strikes, the upstream 51 may have partially timed out. Slow reset means it trips faster on the re-application." },
]};

// ============================== TCC CANVAS ==============================
const TCCCanvas = ({ isDark, pickup51, tms, curveType, pickup50, faultCurrent, tripTime }: {
    isDark: boolean; pickup51: number; tms: number; curveType: string; pickup50: number; faultCurrent: number; tripTime: number | null;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothed = useSmoothedValues({ pickup51, tms, pickup50, faultCurrent });

    useEffect(() => {
        const cvs = canvasRef.current; if (!cvs) return;
        const ctx = cvs.getContext('2d'); if (!ctx) return;
        const w = cvs.width = cvs.offsetWidth * 2;
        const h = cvs.height = cvs.offsetHeight * 2;
        ctx.scale(2, 2);
        const cw = w / 2, ch = h / 2;

        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, cw, ch);

        // Log-Log axes
        const ox = 50, oy = ch - 35;
        const gw = cw - 70, gh = ch - 60;

        // Current range: 0.5 to 100 × Ip (log scale)
        const minI = 0.5, maxI = 100;
        // Time range: 0.01s to 100s
        const minT = 0.01, maxT = 100;

        const logX = (I: number) => ox + (Math.log10(I / minI) / Math.log10(maxI / minI)) * gw;
        const logY = (t: number) => oy - (Math.log10(t / minT) / Math.log10(maxT / minT)) * gh;

        // Grid
        ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.lineWidth = 0.5;
        [0.5, 1, 2, 5, 10, 20, 50, 100].forEach(v => {
            const x = logX(v);
            ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy - gh); ctx.stroke();
        });
        [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100].forEach(v => {
            const y = logY(v);
            ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + gw, y); ctx.stroke();
        });

        // Axes
        ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();

        // Labels
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = '9px Inter, sans-serif';
        [1, 2, 5, 10, 20, 50].forEach(v => {
            ctx.fillText(`${v}`, logX(v) - 4, oy + 14);
        });
        ctx.fillText('× Ip', cw - 30, oy + 14);
        [0.01, 0.1, 1, 10, 100].forEach(v => {
            ctx.fillText(`${v}s`, 5, logY(v) + 3);
        });

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        ctx.fillText('TIME-CURRENT CHARACTERISTIC', ox, 16);

        // Draw 51 curve
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        let first = true;
        for (let m = 1.01; m <= maxI; m += 0.1) {
            const t = calcTripTime(m * smoothed.pickup51, smoothed.pickup51, smoothed.tms, curveType);
            if (t === null || t > maxT || t < minT) continue;
            const x = logX(m);
            const y = logY(t);
            if (x < ox || x > ox + gw || y < oy - gh || y > oy) continue;
            if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Label curve
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(`51 (${IEC_CURVES[curveType]?.label || curveType})`, logX(3), logY(calcTripTime(3 * smoothed.pickup51, smoothed.pickup51, smoothed.tms, curveType) || 1) - 8);
        ctx.fillText(`TMS=${smoothed.tms.toFixed(2)}`, logX(5), logY(calcTripTime(5 * smoothed.pickup51, smoothed.pickup51, smoothed.tms, curveType) || 1) - 8);

        // Draw 50 line
        const x50 = logX(smoothed.pickup50 / smoothed.pickup51);
        if (x50 >= ox && x50 <= ox + gw) {
            ctx.beginPath();
            ctx.moveTo(x50, oy); ctx.lineTo(x50, oy - gh);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText(`50 (${smoothed.pickup50.toFixed(0)}A)`, x50 + 4, oy - gh + 14);
        }

        // Pickup line
        const xPU = logX(1);
        ctx.beginPath();
        ctx.moveTo(xPU, oy); ctx.lineTo(xPU, oy - gh);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`Pickup (${smoothed.pickup51.toFixed(0)}A)`, xPU + 4, oy - gh + 28);

        // Operating point
        if (smoothed.faultCurrent > smoothed.pickup51) {
            const m = smoothed.faultCurrent / smoothed.pickup51;
            const t = calcTripTime(smoothed.faultCurrent, smoothed.pickup51, smoothed.tms, curveType);
            if (t !== null && m <= maxI && t >= minT && t <= maxT) {
                const px = logX(m);
                const py = logY(t);
                // Operating point
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fillStyle = smoothed.faultCurrent >= smoothed.pickup50 ? '#ef4444' : '#f59e0b';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Dashed lines to axes
                ctx.setLineDash([3, 3]);
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, oy);
                ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ox, py);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }, [isDark, smoothed, curveType, tripTime]);

    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{ height: 320, border: isDark ? '1px solid rgb(30,41,59)' : '1px solid rgb(226,232,240)' }} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [pickup51, setPickup51] = useState(400);
    const [tms, setTms] = useState(0.3);
    const [curveType, setCurveType] = useState('SI');
    const [pickup50, setPickup50] = useState(4000);
    const [faultCurrent, setFaultCurrent] = useState(0);
    const [running, setRunning] = useState(false);
    const [phase, setPhase] = useState('');
    const [elapsed, setElapsed] = useState(0);
    const [events, setEvents] = useState<{ time: number; msg: string; type: string }[]>([]);
    const timerRef = useRef<any>(null);

    const tripTime = calcTripTime(faultCurrent, pickup51, tms, curveType);

    const startFault = () => {
        if (faultCurrent <= 0) return;
        setRunning(true); setElapsed(0); setPhase('DETECTING');
        setEvents([{ time: 0, msg: `⚡ Fault injected: ${faultCurrent}A`, type: 'fault' }]);

        if (faultCurrent < pickup51) {
            setPhase('NO_PICKUP');
            setEvents(prev => [{ time: 0, msg: `Current ${faultCurrent}A < Pickup ${pickup51}A — No operation`, type: 'info' }, ...prev]);
            setRunning(false);
            return;
        }

        const is50Trip = faultCurrent >= pickup50;
        const t51 = calcTripTime(faultCurrent, pickup51, tms, curveType) || 999;
        const opTime = is50Trip ? 0.05 : t51; // 50 trips in ~50ms

        let step = 0;
        timerRef.current = setInterval(() => {
            step++;
            const t = step * 0.01;
            setElapsed(t);

            if (is50Trip && step === 3) {
                setEvents(prev => [{ time: t, msg: `🔴 ELEMENT 50 INSTANTANEOUS TRIP at ${faultCurrent}A (> ${pickup50}A)`, type: 'trip' }, ...prev]);
            }

            if (!is50Trip && step === 5) {
                setPhase('51_TIMING');
                setEvents(prev => [{ time: t, msg: `⏱ Element 51 timing: ${curveType} curve, TMS=${tms}`, type: 'info' }, ...prev]);
            }

            if (t >= opTime) {
                setPhase(is50Trip ? '50_TRIP' : '51_TRIP');
                setEvents(prev => [{
                    time: t,
                    msg: is50Trip
                        ? `✅ 50 Trip in ${(opTime * 1000).toFixed(0)}ms (instantaneous)`
                        : `✅ 51 Trip in ${opTime.toFixed(3)}s (${IEC_CURVES[curveType]?.label})`,
                    type: 'success'
                }, ...prev]);
                setRunning(false);
                clearInterval(timerRef.current);
            }
        }, 10);
    };

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase(''); setElapsed(0); setRunning(false); setEvents([]);
    };

    const copyShareLink = () => {
        const state = { pickup51, tms, curveType, pickup50, faultCurrent };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert('Simulation link copied!');
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('s');
        if (s) { try { const st = JSON.parse(atob(s)); if (st.pickup51) setPickup51(st.pickup51); if (st.tms) setTms(st.tms); if (st.curveType) setCurveType(st.curveType); if (st.pickup50) setPickup50(st.pickup50); if (st.faultCurrent) setFaultCurrent(st.faultCurrent); } catch (e) {} }
    }, []);

    // Dispatch live state for theory diagrams
    useEffect(() => {
        const event = new CustomEvent('live-state-overcurrent', {
            detail: { 
                current: faultCurrent, 
                tripTime: tripTime,
                multiple: pickup51 > 0 ? faultCurrent / pickup51 : 0
            }
        });
        window.dispatchEvent(event);
    }, [faultCurrent, tripTime, pickup51]);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Config */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg"><Settings className="w-5 h-5 text-blue-500 inline mr-2" />Relay Settings</h3>
                    <button onClick={copyShareLink} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"><Share2 className="w-3 h-3" />Share</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Slider label="51 Pickup" unit="A" min={50} max={2000} step={10} value={pickup51} onChange={e => setPickup51(+e.target.value)} color="blue" disabled={running} />
                    <Slider label="TMS" min={0.05} max={1.5} step={0.01} value={tms} onChange={e => setTms(+e.target.value)} color="blue" disabled={running} />
                    <div><label className="text-xs font-bold uppercase opacity-60 mb-1 block">Curve Type</label><select value={curveType} onChange={e => setCurveType(e.target.value)} className={`w-full p-2 h-9 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} disabled={running}>{Object.entries(IEC_CURVES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                    <Slider label="50 Instantaneous" unit="A" min={500} max={20000} step={100} value={pickup50} onChange={e => setPickup50(+e.target.value)} color="red" disabled={running} />
                </div>
                <div className="mt-8 flex items-center gap-6">
                    <div className="flex-1">
                        <Slider label="Injected Fault Current" unit="A" min={0} max={25000} step={50} value={faultCurrent} onChange={e => setFaultCurrent(+e.target.value)} color="amber" disabled={running} />
                    </div>
                    <input type="number" min="0" max="50000" step="50" value={faultCurrent} onChange={e => setFaultCurrent(Math.min(50000, Math.max(0, +e.target.value)))} className={`w-28 p-2 rounded-lg border text-sm font-mono text-center ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} disabled={running} />
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={startFault} disabled={running || faultCurrent <= 0} className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2"><Zap className="w-4 h-4" />Inject Fault</button>
                    <button onClick={reset} className={`px-6 py-2.5 rounded-xl font-bold text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200'}`}><RotateCcw className="w-4 h-4 inline mr-1" />Reset</button>
                </div>
            </div>

            {/* TCC Canvas */}
            <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 text-sm"><TrendingUp className="w-4 h-4 text-blue-500 inline mr-2" />Time-Current Characteristic (Log-Log)</h3>
                <TCCCanvas isDark={isDark} pickup51={pickup51} tms={tms} curveType={curveType} pickup50={pickup50} faultCurrent={faultCurrent} tripTime={tripTime} />
            </div>

            {/* Status & Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3"><Activity className="w-4 h-4 text-blue-500 inline mr-2" />Relay Status</h3>
                    {[
                        { l: 'State', v: phase || 'IDLE', c: phase.includes('TRIP') ? 'text-red-500' : phase === 'NO_PICKUP' ? 'text-amber-500' : '' },
                        { l: 'Elapsed', v: `${(elapsed * 1000).toFixed(0)}ms` },
                        { l: '51 Pickup', v: `${pickup51}A` },
                        { l: '50 Pickup', v: `${pickup50}A` },
                        { l: 'Expected 51 Time', v: tripTime ? `${tripTime.toFixed(3)}s` : '—' },
                        { l: 'Current Multiple', v: faultCurrent > 0 ? `${(faultCurrent / pickup51).toFixed(2)}× Ip` : '—' },
                    ].map(r => (<div key={r.l} className="flex justify-between text-sm py-0.5"><span className="opacity-60">{r.l}</span><span className={`font-mono font-bold ${r.c || ''}`}>{r.v}</span></div>))}
                </div>
                <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3"><ShieldCheck className="w-4 h-4 text-blue-500 inline mr-2" />Event Log</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {events.length === 0 && <p className="text-sm opacity-40 italic">Set fault current and click Inject Fault.</p>}
                        <AnimatePresence>
                            {events.map((e, i) => (
                                <motion.div 
                                    key={e.msg + i}
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                                    className={`text-xs p-2.5 rounded-lg border ${e.type === 'trip' ? 'border-red-500/30 bg-red-500/10' : e.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/5' : e.type === 'fault' ? 'border-amber-500/20 bg-amber-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}
                                >
                                    <span className="font-mono opacity-60">[{(e.time * 1000).toFixed(0)}ms]</span> <span className="font-bold">{e.msg}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">Overcurrent Protection (50/51)</p></div></div>
        {[
            { s: '1', t: 'Set 51 Pickup & TMS', d: 'The pickup (Ip) should be set 1.2-1.3× the maximum load current. The TMS adjusts the curve vertically — higher TMS means slower operation.' },
            { s: '2', t: 'Choose Curve Type', d: 'SI for general use, VI for feeders with variable fault levels, EI for transformer/motor protection where fast clearance at high currents is critical.' },
            { s: '3', t: 'Set 50 Instantaneous', d: 'Set above the maximum through-fault current (120-130% of IF at remote bus) to ensure instantaneous operation only for close-in faults.' },
            { s: '4', t: 'Inject Fault Current', d: 'Use the slider or type a value. Watch the operating point on the TCC curve and observe whether 50 or 51 operates first.' },
            { s: '5', t: 'Evaluate Coordination', d: 'Adjust TMS and pickup to achieve proper grading (CTI ≥ 0.3s) between upstream and downstream devices.' },
        ].map(i => (<div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div><div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div></div>))}
        <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-2 text-amber-500"><AlertTriangle className="w-4 h-4 inline mr-1" />Standards</h4>
            <p className="text-sm opacity-80">Modeled per <strong>IEC 60255-151</strong> (Time-Current Characteristics) and <strong>IEEE C37.112</strong> (Inverse-Time Relay Standard).</p>
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
export default function OvercurrentSim() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    const tabs = [{ id: 'theory', label: 'Reference', icon: <Book className="w-4 h-4" /> }, { id: 'simulator', label: 'Simulator', icon: <MonitorPlay className="w-4 h-4" /> }, { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-4 h-4" /> }, { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4" /> }];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="Overcurrent Protection (50/51)" description="Interactive overcurrent relay simulator with IEC 60255 curves, TCC diagram, 50/51 elements, and grading analysis." url="/overcurrent" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-amber-600 to-orange-600 p-2 rounded-lg text-white shadow-lg shadow-amber-500/20"><Zap className="w-5 h-5" /></div><div><h1 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>OC<span className="text-amber-500">Guard</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">✅ IEC 60255-151 / IEEE C37.112</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-amber-400' : 'bg-white text-amber-600') : 'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
                <div />
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab === t.id ? (isDark ? 'text-amber-400' : 'text-amber-600') : 'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab === 'theory' && <TheoryLibrary title="Overcurrent Protection Handbook" description="Time overcurrent (51), instantaneous (50), directional (67), and IEC 60255 curve standards." sections={OC_THEORY as any} />}
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}><SimulatorModule isDark={isDark} /></div>
                {activeTab === 'guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
