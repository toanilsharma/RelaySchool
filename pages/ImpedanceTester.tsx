import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, Award, Zap, AlertTriangle, Activity, ShieldCheck, Share2, Crosshair, CheckCircle2, XCircle, Play } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import Slider from '../components/Slider';
import { useSmoothedValues } from '../hooks/useSmoothedValues';
import SEO from "../components/SEO";
import { motion, AnimatePresence } from 'framer-motion';

// ============================== TEST TYPES ==============================
const TEST_TYPES = [
    { id: 'pickup', label: 'Pickup Test', desc: 'Ramp current from 0 to find exact pickup value' },
    { id: 'timing', label: 'Trip Timing', desc: 'Inject fixed current and measure trip time' },
    { id: 'zone_reach', label: 'Zone Reach', desc: 'Inject impedance at zone boundary' },
    { id: 'directional', label: 'Directional', desc: 'Verify forward/reverse discrimination' },
];

const RELAY_MODELS = [
    { id: 'sel_421', name: 'SEL-421', type: 'Distance', zones: 4, manufacturer: 'SEL' },
    { id: 'abb_red670', name: 'ABB RED670', type: 'Distance', zones: 4, manufacturer: 'ABB' },
    { id: 'ge_d60', name: 'GE D60', type: 'Distance', zones: 4, manufacturer: 'GE' },
    { id: 'siemens_7sa', name: 'Siemens 7SA87', type: 'Distance', zones: 5, manufacturer: 'Siemens' },
];

// ============================== IMPEDANCE CANVAS ==============================
const ImpedancePlaneCanvas = ({ isDark, testPoints, z1Reach, z2Reach, mta, currentTest }: {
    isDark: boolean; testPoints: { r: number; x: number; result: string }[]; z1Reach: number; z2Reach: number; mta: number; currentTest: { r: number; x: number } | null;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothed = useSmoothedValues({ z1Reach, z2Reach, mta });

    useEffect(() => {
        const cvs = canvasRef.current; if (!cvs) return;
        const ctx = cvs.getContext('2d'); if (!ctx) return;
        const w = cvs.width = cvs.offsetWidth * 2;
        const h = cvs.height = cvs.offsetHeight * 2;
        ctx.scale(2, 2);
        const cw = w / 2, ch = h / 2;
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, cw, ch);

        const cx = cw / 2, cy = ch * 0.6;
        const scale = Math.min(cw, ch) * 0.4 / Math.max(smoothed.z2Reach, 10);

        // Grid
        ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.lineWidth = 0.5;
        for (let i = -20; i <= 20; i += 2) {
            ctx.beginPath(); ctx.moveTo(cx + i * scale, 0); ctx.lineTo(cx + i * scale, ch); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, cy - i * scale); ctx.lineTo(cw, cy - i * scale); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(cw, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, ch); ctx.stroke();
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('R (Ω) →', cw - 45, cy + 14);
        ctx.fillText('jX (Ω) ↑', cx + 5, 14);

        // Zone 2 Mho circle
        const drawMho = (reach: number, color: string, label: string) => {
            const rad = reach / 2;
            const mtaRad = smoothed.mta * Math.PI / 180;
            const ccx = cx + rad * scale * Math.cos(mtaRad);
            const ccy = cy - rad * scale * Math.sin(mtaRad);
            ctx.beginPath();
            ctx.arc(ccx, ccy, rad * scale, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText(label, ccx + rad * scale * 0.7, ccy - rad * scale * 0.7);
        };

        drawMho(smoothed.z2Reach, '#f59e0b', `Z2 (${smoothed.z2Reach.toFixed(1)}Ω)`);
        drawMho(smoothed.z1Reach, '#3b82f6', `Z1 (${smoothed.z1Reach.toFixed(1)}Ω)`);

        // Plot test points
        testPoints.forEach(pt => {
            const px = cx + pt.r * scale;
            const py = cy - pt.x * scale;
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = pt.result === 'TRIP' ? '#22c55e' : pt.result === 'NO_TRIP' ? '#ef4444' : '#64748b';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // Current test point
        if (currentTest) {
            const px = cx + currentTest.r * scale;
            const py = cy - currentTest.x * scale;
            ctx.beginPath();
            ctx.arc(px, py, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#a855f7';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#a855f7';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText(`(${currentTest.r.toFixed(1)}, ${currentTest.x.toFixed(1)})`, px + 10, py - 5);
        }

        // Legend
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        ctx.fillText('IMPEDANCE PLANE TEST RESULTS', 8, 16);

        ctx.font = '8px Inter, sans-serif';
        ctx.fillStyle = '#22c55e'; ctx.fillText('● TRIP', cw - 120, 16);
        ctx.fillStyle = '#ef4444'; ctx.fillText('● NO TRIP', cw - 70, 16);
        ctx.fillStyle = '#a855f7'; ctx.fillText('● CURRENT', cw - 120, 28);
    }, [isDark, testPoints, smoothed, currentTest]);

    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{ height: 320, border: isDark ? '1px solid rgb(30,41,59)' : '1px solid rgb(226,232,240)' }} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [relay, setRelay] = useState(RELAY_MODELS[0]);
    const [testType, setTestType] = useState('zone_reach');
    const [z1Reach, setZ1Reach] = useState(8.0);
    const [z2Reach, setZ2Reach] = useState(12.0);
    const [mta, setMta] = useState(75);
    const [testR, setTestR] = useState(6.0);
    const [testX, setTestX] = useState(6.0);
    const [testAngle, setTestAngle] = useState(75);
    const [injectionCurrent, setInjectionCurrent] = useState(5.0);
    const [running, setRunning] = useState(false);
    const [testPoints, setTestPoints] = useState<{ r: number; x: number; result: string }[]>([]);
    const [results, setResults] = useState<{ test: string; expected: string; actual: string; pass: boolean; time?: string }[]>([]);
    const [autoTestProgress, setAutoTestProgress] = useState(0);
    const timerRef = useRef<any>(null);

    const checkInZone = (r: number, x: number, reach: number): boolean => {
        const mtaRad = mta * Math.PI / 180;
        const radius = reach / 2;
        const centerR = radius * Math.cos(mtaRad);
        const centerX = radius * Math.sin(mtaRad);
        const dist = Math.sqrt((r - centerR) ** 2 + (x - centerX) ** 2);
        return dist <= radius;
    };

    const runSingleTest = () => {
        setRunning(true);
        const inZ1 = checkInZone(testR, testX, z1Reach);
        const inZ2 = checkInZone(testR, testX, z2Reach);
        const result = inZ1 ? 'TRIP' : inZ2 ? 'TRIP' : 'NO_TRIP';
        const zone = inZ1 ? 'Z1' : inZ2 ? 'Z2' : 'Outside';
        const tripTime = inZ1 ? '0ms (inst)' : inZ2 ? '300ms' : '—';

        setTimeout(() => {
            setTestPoints(prev => [...prev, { r: testR, x: testX, result }]);
            setResults(prev => [{
                test: `Z=(${testR.toFixed(1)}+j${testX.toFixed(1)})Ω`,
                expected: inZ1 ? 'Z1 Trip' : inZ2 ? 'Z2 Trip' : 'No Trip',
                actual: `${result} (${zone})`,
                pass: true,
                time: tripTime,
            }, ...prev]);
            setRunning(false);
        }, 500);
    };

    const runAutoTest = () => {
        setRunning(true);
        setTestPoints([]);
        setResults([]);
        setAutoTestProgress(0);

        const mtaRad = mta * Math.PI / 180;
        const points: { r: number; x: number }[] = [];

        // Generate test points around zone boundaries
        for (let angle = 0; angle < 360; angle += 15) {
            const rad = angle * Math.PI / 180;
            // Z1 boundary ± 5%
            [0.95, 1.0, 1.05].forEach(f => {
                const reach = z1Reach * f;
                const r = (reach / 2) * Math.cos(mtaRad) + (reach / 2) * Math.cos(rad);
                const x = (reach / 2) * Math.sin(mtaRad) + (reach / 2) * Math.sin(rad);
                if (r > -5 && x > -3) points.push({ r, x });
            });
        }

        let i = 0;
        let lastTime = performance.now();
        const loop = (time: number) => {
            if (time - lastTime < 30) {
                timerRef.current = requestAnimationFrame(loop);
                return;
            }
            lastTime = time;

            if (i >= points.length) {
                setRunning(false);
                return;
            }
            const pt = points[i];
            const inZ1 = checkInZone(pt.r, pt.x, z1Reach);
            const inZ2 = checkInZone(pt.r, pt.x, z2Reach);
            const result = inZ1 ? 'TRIP' : inZ2 ? 'TRIP' : 'NO_TRIP';
            setTestPoints(prev => [...prev, { r: pt.r, x: pt.x, result }]);
            setAutoTestProgress(((i + 1) / points.length) * 100);
            i++;
            timerRef.current = requestAnimationFrame(loop);
        };
        timerRef.current = requestAnimationFrame(loop);
    };

    const clear = () => {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        setTestPoints([]); setResults([]); setRunning(false); setAutoTestProgress(0);
    };

    const copyShareLink = () => {
        const state = { z1Reach, z2Reach, mta, testR, testX };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert('Link copied!');
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('s');
        if (s) { try { const st = JSON.parse(atob(s)); if (st.z1Reach) setZ1Reach(st.z1Reach); if (st.z2Reach) setZ2Reach(st.z2Reach); if (st.mta) setMta(st.mta); if (st.testR) setTestR(st.testR); if (st.testX) setTestX(st.testX); } catch (e) {} }
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg"><Settings className="w-5 h-5 text-blue-500 inline mr-2" />Test Configuration</h3>
                    <button onClick={copyShareLink} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"><Share2 className="w-3 h-3" />Share</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><label className="text-xs font-bold uppercase opacity-60 mb-1 block">Relay Under Test</label>
                        <select value={relay.id} onChange={e => setRelay(RELAY_MODELS.find(r => r.id === e.target.value) || RELAY_MODELS[0])} className={`w-full p-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} disabled={running}>
                            {RELAY_MODELS.map(r => <option key={r.id} value={r.id}>{r.name} ({r.manufacturer})</option>)}
                        </select>
                    </div>
                    <div><label className="text-xs font-bold uppercase opacity-60 mb-1 block">Test Type</label>
                        <select value={testType} onChange={e => setTestType(e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} disabled={running}>
                            {TEST_TYPES.map(t => <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Slider 
                        label="Z1 Reach" 
                        unit="Ω" 
                        min={1} 
                        max={30} 
                        step={0.5} 
                        value={z1Reach} 
                        onChange={e => setZ1Reach(+e.target.value)} 
                        color="blue" 
                        disabled={running}
                    />
                    <Slider 
                        label="Z2 Reach" 
                        unit="Ω" 
                        min={1} 
                        max={40} 
                        step={0.5} 
                        value={z2Reach} 
                        onChange={e => setZ2Reach(+e.target.value)} 
                        color="amber" 
                        disabled={running}
                    />
                    <Slider 
                        label="MTA" 
                        unit="°" 
                        min={30} 
                        max={90} 
                        step={1} 
                        value={mta} 
                        onChange={e => setMta(+e.target.value)} 
                        color="blue" 
                        disabled={running}
                    />
                    <Slider 
                        label="Test R" 
                        unit="Ω" 
                        min={-5} 
                        max={20} 
                        step={0.1} 
                        value={testR} 
                        onChange={e => setTestR(+e.target.value)} 
                        color="purple" 
                        disabled={running}
                    />
                    <Slider 
                        label="Test jX" 
                        unit="Ω" 
                        min={-3} 
                        max={20} 
                        step={0.1} 
                        value={testX} 
                        onChange={e => setTestX(+e.target.value)} 
                        color="purple" 
                        disabled={running}
                    />
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={runSingleTest} disabled={running} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2"><Crosshair className="w-4 h-4" />Single Shot</button>
                    <button onClick={runAutoTest} disabled={running} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2"><Play className="w-4 h-4" />Auto Zone Test</button>
                    <button onClick={clear} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200'}`}><RotateCcw className="w-4 h-4 inline mr-1" />Clear</button>
                </div>
                {running && autoTestProgress > 0 && (
                    <div className="mt-3"><div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${autoTestProgress}%` }} /></div><span className="text-xs font-mono opacity-60">{autoTestProgress.toFixed(0)}% complete</span></div>
                )}
            </div>

            <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 text-sm"><Activity className="w-4 h-4 text-blue-500 inline mr-2" />Impedance Plane — {testPoints.length} test points</h3>
                <ImpedancePlaneCanvas isDark={isDark} testPoints={testPoints} z1Reach={z1Reach} z2Reach={z2Reach} mta={mta} currentTest={running ? null : { r: testR, x: testX }} />
            </div>

            {results.length > 0 && (
                <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3"><ShieldCheck className="w-4 h-4 text-blue-500 inline mr-2" />Test Results ({results.length})</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto overflow-x-hidden p-1">
                        <AnimatePresence>
                            {results.slice(0, 20).map((r, i) => (
                                <motion.div key={r.test + i} initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} className={`flex items-center justify-between text-xs p-2.5 rounded-lg border mb-1.5 ${r.pass ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                    <span className="font-mono font-bold">{r.test}</span>
                                    <span>{r.actual}</span>
                                    {r.time && <span className="font-mono opacity-60">{r.time}</span>}
                                    {r.pass ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500" /></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">Virtual Relay Test Equipment</p></div></div>
        {[
            { s: '1', t: 'Select Relay Model', d: 'Choose the relay under test (SEL-421, ABB RED670, GE D60, or Siemens 7SA87). This configures the underlying model characteristics.' },
            { s: '2', t: 'Configure Zone Settings', d: 'Set Z1, Z2 reach values and MTA to match the relay\'s configured settings. These define the expected trip/no-trip boundaries.' },
            { s: '3', t: 'Single Shot Test', d: 'Set the test impedance (R + jX) and click Single Shot. The tester injects this impedance and checks whether the relay trips. Result is plotted on the impedance plane.' },
            { s: '4', t: 'Auto Zone Test', d: 'Automatically tests 72 points around the Z1 boundary at ±5% of the reach. Green dots = TRIP (inside zone), Red dots = NO TRIP (outside zone). The boundary should be clearly visible.' },
            { s: '5', t: 'Analyze Results', d: 'Review the test results table showing each injection point, expected vs actual result, and trip timing.' },
        ].map(i => (<div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div><div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div></div>))}
        <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-2 text-amber-500"><AlertTriangle className="w-4 h-4 inline mr-1" />Based On</h4>
            <p className="text-sm opacity-80">Simulates relay testing procedures per <strong>OMICRON CMC</strong>, <strong>Doble F6150</strong>, and <strong>Megger SMRT</strong> test equipment workflows.</p>
        </div>
    </div>
);

// ============================== QUIZ MODULE ==============================
const QUIZ_DATA = { easy: [
    { q: "What does a relay tester inject into the relay?", opts: ["DC voltage", "AC voltage and current phasors", "Impedance directly", "Light signals"], ans: 1, why: "Test sets inject calibrated V and I phasors. The relay calculates impedance Z = V/I internally." },
    { q: "Zone boundary testing verifies:", opts: ["CT accuracy", "That the relay trips/restrains at the correct impedance boundary", "VT calibration", "Communication speed"], ans: 1, why: "Zone reach testing confirms that the relay operates at points inside the zone and does not operate at points just outside." },
    { q: "MTA stands for:", opts: ["Maximum Test Angle", "Maximum Torque Angle", "Minimum Trip Angle", "Manual Test Approach"], ans: 1, why: "Maximum Torque Angle (or Relay Characteristic Angle) is the impedance angle at which the relay has maximum sensitivity." },
    { q: "Why test at 80%, 100%, and 120% of zone reach?", opts: ["To check three zones", "To verify the shape of the characteristic accurately", "To test CT ratio", "To measure breaker speed"], ans: 1, why: "Testing at, inside, and outside the boundary validates that the relay sets are correct and the characteristic shape matches design." },
    { q: "A 'pass' result means:", opts: ["The test equipment passed self-test", "The relay response matches the expected behavior", "The relay failed", "The CT saturated"], ans: 1, why: "Pass = relay tripped when it should (inside zone) or restrained when it should (outside zone). Any mismatch is a fail." },
], medium: [
    { q: "For an impedance test at Z = 6 + j6 Ω, the test set generates:", opts: ["V and I such that V/I = 6 + j6", "V = 6V, I = 6A", "Only current", "Only voltage"], ans: 0, why: "The test set calculates voltage and current magnitudes/angles such that when the relay divides V/I, it sees the desired impedance." },
    { q: "To test at 95% of Z1 reach (inside zone), the expected result is:", opts: ["No Trip", "Zone 1 Trip (instantaneous)", "Zone 2 Trip (delayed)", "Alarm only"], ans: 1, why: "95% of Z1 is inside Zone 1. The relay should trip instantaneously. Any delay or no-trip indicates a setting error." },
    { q: "Phase angle during testing must match:", opts: ["0 degrees always", "The line impedance angle (MTA)", "90 degrees", "Random angles"], ans: 1, why: "Testing along the MTA gives the most accurate reach verification. Testing at other angles checks the characteristic shape." },
    { q: "CT/VT correction factors account for:", opts: ["Temperature", "Ratio errors and phase angle errors of measurement transformers", "Line length", "Breaker speed"], ans: 1, why: "CT and VT introduce small magnitude and angle errors. The relay test must compensate for these to verify true relay accuracy." },
    { q: "In a 'ramp' test, the injection:", opts: ["Is constant", "Gradually increases until relay operates", "Pulses on/off", "Reverses polarity"], ans: 1, why: "Ramp tests slowly increase current or reduce impedance until the relay picks up, finding the exact pickup/reach threshold." },
], expert: [
    { q: "For a cross-polarized Mho relay, testing requires:", opts: ["Only faulted phase voltage", "Both faulted and healthy phase voltages", "No voltage", "DC only"], ans: 1, why: "Cross-polarized Mho uses healthy phase voltage for polarization. Test sets must provide balanced 3-phase voltages with only the test phase faulted." },
    { q: "Dynamic state estimation testing per IEC 60255-121 verifies:", opts: ["Static reach only", "Relay response to changing fault conditions (evolving faults)", "CT accuracy", "Breaker timing"], ans: 1, why: "Dynamic testing plays back realistic fault waveforms (including CT transients, decaying DC offset) to verify relay behavior under real conditions." },
    { q: "The 'point-on-wave' control in modern test sets determines:", opts: ["Sampling rate", "The exact instant when the fault is applied relative to the voltage waveform", "Breaker closing angle", "CT ratio"], ans: 1, why: "Point-on-wave control ensures repeatable tests. Faults applied at voltage zero produce maximum DC offset; at voltage peak, minimal offset." },
    { q: "GPS time-synchronized testing is needed for:", opts: ["Single-ended relays", "Line differential (87L) and POTT scheme end-to-end testing", "Overcurrent relays", "VT calibration"], ans: 1, why: "End-to-end testing of communication-based schemes requires synchronized injection at both line terminals simultaneously." },
    { q: "A 3% reach error at MTA is acceptable per:", opts: ["No standard allows this", "IEEE C37.113 (typical relay accuracy is 3-5%)", "Must be 0% always", "Only for backup zones"], ans: 1, why: "IEEE C37.113 acknowledges 3-5% reach accuracy for digital distance relays. Test methodology must account for this tolerance." },
]};

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
export default function ImpedanceTester() {
    const [activeTab, setActiveTab] = useState('simulator');
    const isDark = useThemeObserver();
    const tabs = [{ id: 'simulator', label: 'Test Bench', icon: <MonitorPlay className="w-4 h-4" /> }, { id: 'guide', label: 'Guide', icon: <GraduationCap className="w-4 h-4" /> }, { id: 'quiz', label: 'Quiz', icon: <Award className="w-4 h-4" /> }];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="Impedance Relay Tester" description="Virtual relay test equipment simulator for impedance reach verification, zone boundary testing, and trip timing analysis." url="/impedance-tester" />
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-purple-500/20"><Crosshair className="w-5 h-5" /></div><div><h1 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Relay<span className="text-purple-500">Tester</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-purple-500/80">OMICRON / Doble Virtual</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab === t.id ? (isDark ? 'bg-slate-800 text-purple-400' : 'bg-white text-purple-600') : 'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
                <div />
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab === t.id ? (isDark ? 'text-purple-400' : 'text-purple-600') : 'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                <div className={activeTab === 'simulator' ? 'block h-full overflow-y-auto' : 'hidden'}><SimulatorModule isDark={isDark} /></div>
                {activeTab === 'guide' && <div className="h-full overflow-y-auto"><GuideModule isDark={isDark} /></div>}
                {activeTab === 'quiz' && <div className="h-full overflow-y-auto"><QuizModule isDark={isDark} /></div>}
            </div>
        </div>
    );
}
