import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, Award, TrendingUp, Sliders, Zap, Activity, Play, AlertTriangle, CheckCircle2, ShieldCheck , Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import Slider from '../components/Slider';
import TheoryLibrary from '../components/TheoryLibrary';
import { VOLTAGE_REGULATOR_THEORY_CONTENT } from '../data/learning-modules/voltage-regulator';
import SEO from "../components/SEO";

const QUIZ_DATA={easy:[
{q:"OLTC stands for:",opts:["Online Transformer Controller","On-Load Tap Changer","Offline Test Circuit","Open-Loop Timer Control"],ans:1,why:"OLTC (On-Load Tap Changer) adjusts the transformer turns ratio while the transformer is energized and carrying load."},
{q:"The deadband in a voltage regulator prevents:",opts:["Overloading","Excessive tap hunting (constant tap changes)","Short circuits","Voltage collapse"],ans:1,why:"Without deadband, even tiny voltage fluctuations would trigger tap changes. The deadband provides a window of acceptable voltage to prevent hunting."},
{q:"A typical voltage regulation target is:",opts:["100V","120V ± 5% (ANSI C84.1)","240V exactly","50Hz"],ans:1,why:"ANSI C84.1 defines the Range A service voltage at 120V ± 5% (114V to 126V). The regulator maintains voltage within this band."},
{q:"Raising the tap position:",opts:["Lowers voltage","Raises secondary voltage","Changes frequency","Has no effect"],ans:1,why:"Raising the tap increases the effective turns ratio, boosting the secondary (load-side) voltage to compensate for drops."},
{q:"Time delay before tap change is needed to:",opts:["Save energy","Avoid reacting to transient voltage dips (motor starts, etc.)","Protect CTs","Reduce noise"],ans:1,why:"Without time delay, every motor start or switching transient would trigger unnecessary tap changes. The delay filters out transients."}
],medium:[
{q:"Line drop compensation (LDC) allows the regulator to:",opts:["Measure line current","Maintain voltage at a remote load point, not just at the regulator","Reduce losses","Bypass the tap changer"],ans:1,why:"LDC uses measured current and configured R/X settings to calculate the estimated voltage at a downstream load center, regulating to that point."},
{q:"A 32-step regulator with ±10% range has step size of:",opts:["5%","0.625% per step","1% per step","10%"],ans:1,why:"20% total range ÷ 32 steps = 0.625% per step. Each tap change adjusts voltage by 0.625% of rated."},
{q:"Reverse power flow (DER) affects voltage regulation by:",opts:["No effect","Causing voltage rise instead of drop along the feeder","Reducing frequency","Increasing losses"],ans:1,why:"When DER (solar/wind) injects power, current flows toward the substation, causing voltage to RISE along the feeder instead of dropping."},
{q:"Gang operation vs independent phase:",opts:["Gang = all phases together","Gang = single phase only","Independent = all together","No difference"],ans:0,why:"Gang operation changes all three phases simultaneously. Independent phase operation adjusts each phase separately, better for unbalanced loads."},
{q:"The runback feature:",opts:["Speeds up regulation","Limits tap position during reverse power flow or abnormal conditions","Disables the regulator","Increases deadband"],ans:1,why:"Runback forces the tap back toward neutral during abnormal conditions (reverse power, loss of PT, low current) to prevent overvoltage."}
],expert:[
{q:"ANSI C84.1 Range B voltage limits are:",opts:["Same as Range A","Wider than Range A (emergency conditions, limited duration)","Tighter than Range A","Not defined"],ans:1,why:"Range B (extreme conditions) allows 5.8% above and 8.3% below nominal. Equipment should operate under Range B but not continuously."},
{q:"Voltage regulator coordination with LTC and capacitor banks requires:",opts:["All to be fastest","Staggered time delays (source side faster)","Only one device","No coordination"],ans:1,why:"The substation LTC should operate first, then line regulators, then capacitor banks. Time delay staggering prevents device hunting."},
{q:"Capacitor switching vs tap changing voltage regulation difference:",opts:["Same","Capacitors provide reactive var support (step change), tap changers adjust turns ratio (gradual)","Capacitors are slower","Tap changers use reactive power"],ans:1,why:"Capacitors inject vars (step function), while regulators adjust ratio continuously. Both improve voltage but through different mechanisms."},
{q:"The effect of tap changer on fault level:",opts:["No change","Tap position changes effective impedance, affecting fault current slightly","Doubles fault current","Halves fault current"],ans:1,why:"Changing the tap ratio changes the referred impedance. Higher tap = higher referred impedance = slightly lower fault current on the LV side."},
{q:"Per IEC 60214, the OLTC must be capable of:",opts:["5 operations","10,000+ operations between maintenance","100 operations","1 operation per day"],ans:1,why:"Modern OLTCs are designed for 10,000-30,000 operations between overhauls. Vacuum-type OLTCs have even higher operation counts."}
]};

// ============================== VOLTAGE CANVAS ==============================
const VoltageCanvas = ({ isDark, history, tapPosition, target, deadband }:
    {isDark:boolean;history:{t:number;v:number;tap:number}[];tapPosition:number;target:number;deadband:number}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const cvs = canvasRef.current; if(!cvs) return;
        const ctx = cvs.getContext('2d'); if(!ctx) return;
        const w = cvs.width = cvs.offsetWidth * 2;
        const h = cvs.height = cvs.offsetHeight * 2;
        ctx.scale(2,2);
        const cw = w/2, ch = h/2;
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0,0,cw,ch);

        const margin = {l:45,r:15,t:20,b:30};
        const gw = cw - margin.l - margin.r;
        const gh = ch - margin.t - margin.b;
        const vMin = 110, vMax = 130;

        // Grid
        ctx.strokeStyle = isDark ? 'rgba(100,116,139,0.15)' : 'rgba(148,163,184,0.2)';
        ctx.lineWidth = 0.5;
        for(let v = vMin; v <= vMax; v += 2) {
            const y = margin.t + gh * (1 - (v - vMin)/(vMax - vMin));
            ctx.beginPath(); ctx.moveTo(margin.l, y); ctx.lineTo(cw-margin.r, y); ctx.stroke();
            ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
            ctx.font = '8px Inter, sans-serif';
            ctx.fillText(`${v}V`, 5, y + 3);
        }

        // Target band
        const yHi = margin.t + gh * (1 - (target + deadband - vMin)/(vMax - vMin));
        const yLo = margin.t + gh * (1 - (target - deadband - vMin)/(vMax - vMin));
        ctx.fillStyle = 'rgba(34,197,94,0.08)';
        ctx.fillRect(margin.l, yHi, gw, yLo - yHi);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1;
        ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(margin.l, yHi); ctx.lineTo(cw-margin.r, yHi); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(margin.l, yLo); ctx.lineTo(cw-margin.r, yLo); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#22c55e';
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText('Target', cw-margin.r-30, (yHi+yLo)/2+3);

        // ANSI C84.1 limits
        const y126 = margin.t + gh * (1 - (126 - vMin)/(vMax - vMin));
        const y114 = margin.t + gh * (1 - (114 - vMin)/(vMax - vMin));
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.moveTo(margin.l, y126); ctx.lineTo(cw-margin.r, y126); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(margin.l, y114); ctx.lineTo(cw-margin.r, y114); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = '7px Inter, sans-serif';
        ctx.fillText('126V (+5%)', margin.l+2, y126-3);
        ctx.fillText('114V (-5%)', margin.l+2, y114+10);

        // Voltage line
        if (history.length > 1) {
            ctx.beginPath();
            history.forEach((p, i) => {
                const x = margin.l + (i / Math.max(history.length-1, 1)) * gw;
                const y = margin.t + gh * (1 - (p.v - vMin)/(vMax - vMin));
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Current voltage dot
        if (history.length > 0) {
            const last = history[history.length-1];
            const x = margin.l + ((history.length-1) / Math.max(history.length-1, 1)) * gw;
            const y = margin.t + gh * (1 - (last.v - vMin)/(vMax - vMin));
            ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2);
            ctx.fillStyle = last.v > 126 || last.v < 114 ? '#ef4444' : '#3b82f6';
            ctx.fill();
        }

        // Labels
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText('VOLTAGE vs TIME', margin.l, 14);
        ctx.fillText(`Tap: ${tapPosition > 0 ? '+' : ''}${tapPosition}`, cw - 60, 14);
    }, [isDark, history, tapPosition, target, deadband]);
    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{height:280, border:isDark?'1px solid rgb(30,41,59)':'1px solid rgb(226,232,240)'}} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [target, setTarget] = useState(120);
    const [deadband, setDeadband] = useState(2);
    const [timeDelay, setTimeDelay] = useState(30);
    const [tapPosition, setTapPosition] = useState(0);
    const [voltage, setVoltage] = useState(120);
    const [loadDisturbance, setLoadDisturbance] = useState(0);
    const [history, setHistory] = useState<{t:number;v:number;tap:number}[]>([{t:0,v:120,tap:0}]);
    const [running, setRunning] = useState(false);
    const [events, setEvents] = useState<{time:number;msg:string;type:string}[]>([]);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<any>(null);
    const delayCounter = useRef(0);

    const start = () => {
        setRunning(true); setElapsed(0); delayCounter.current = 0;
        setHistory([{t:0,v:voltage,tap:tapPosition}]);
        setEvents([{time:0,msg:'▶️ Voltage regulator simulation started.',type:'info'}]);
    };

    const applyLoad = (delta: number) => {
        setLoadDisturbance(delta);
        setVoltage(v => Math.max(105, Math.min(135, v + delta)));
        setEvents(prev => [{time:elapsed,msg:`⚡ Load change: ${delta > 0 ? '+' : ''}${delta}V disturbance applied`,type:'warn'},...prev]);
    };

    useEffect(() => {
        if (!running) return;
        timerRef.current = setInterval(() => {
            setElapsed(p => p + 1);
            setVoltage(v => {
                const newV = v + (Math.random() - 0.5) * 0.3; // small noise
                // Check if outside deadband
                if (Math.abs(newV - target) > deadband) {
                    delayCounter.current++;
                    if (delayCounter.current >= timeDelay) {
                        const tapDir = newV < target ? 1 : -1;
                        setTapPosition(p => Math.max(-16, Math.min(16, p + tapDir)));
                        const corrected = newV + tapDir * 0.75; // ~0.625% step
                        delayCounter.current = 0;
                        setEvents(prev => [{time: elapsed, msg: `🔧 TAP ${tapDir > 0 ? 'RAISE' : 'LOWER'} → Tap ${tapPosition + tapDir}. Voltage: ${corrected.toFixed(1)}V`, type: 'tap'}, ...prev].slice(0, 20));
                        const result = Math.max(105, Math.min(135, corrected));
                        setHistory(p => [...p, {t: elapsed, v: result, tap: tapPosition + tapDir}].slice(-100));
                        return result;
                    }
                } else {
                    delayCounter.current = 0;
                }
                setHistory(p => [...p, {t: elapsed, v: newV, tap: tapPosition}].slice(-100));
                return Math.max(105, Math.min(135, newV));
            });
        }, 1000);
        return () => { if(timerRef.current) clearInterval(timerRef.current); };
    }, [running, target, deadband, timeDelay, tapPosition, elapsed]);

    const reset = () => { if(timerRef.current) clearInterval(timerRef.current); setRunning(false); setElapsed(0); setTapPosition(0); setVoltage(120); setHistory([{t:0,v:120,tap:0}]); setEvents([]); setLoadDisturbance(0); delayCounter.current = 0; };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4"><Settings className="w-5 h-5 text-blue-500 inline mr-2"/>Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Slider 
                        label="Target Voltage" 
                        unit="V" 
                        min={115} 
                        max={125} 
                        step={1} 
                        value={target} 
                        onChange={e => setTarget(+e.target.value)} 
                        color="emerald" 
                        disabled={running}
                    />
                    <Slider 
                        label="Deadband (±V)" 
                        unit="V" 
                        min={1} 
                        max={5} 
                        step={0.5} 
                        value={deadband} 
                        onChange={e => setDeadband(+e.target.value)} 
                        color="blue" 
                        disabled={running}
                    />
                    <Slider 
                        label="Time Delay (s)" 
                        unit="s" 
                        min={10} 
                        max={60} 
                        step={5} 
                        value={timeDelay} 
                        onChange={e => setTimeDelay(+e.target.value)} 
                        color="amber" 
                        disabled={running}
                    />
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                    <button onClick={start} disabled={running} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2"><Play className="w-4 h-4"/>Start</button>
                    <button onClick={() => applyLoad(-6)} disabled={!running} className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-40">Heavy Load (-6V)</button>
                    <button onClick={() => applyLoad(-3)} disabled={!running} className="px-4 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm disabled:opacity-40">Load (-3V)</button>
                    <button onClick={() => applyLoad(+4)} disabled={!running} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-40">Load Reject (+4V)</button>
                    <button onClick={reset} className={`px-6 py-2.5 rounded-xl font-bold text-sm ${isDark?'bg-slate-800 text-white':'bg-slate-200'}`}><RotateCcw className="w-4 h-4 inline mr-1"/>Reset</button>
                </div>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 text-sm"><TrendingUp className="w-4 h-4 text-blue-500 inline mr-2"/>Voltage vs Time (with ANSI C84.1 limits)</h3>
                <VoltageCanvas isDark={isDark} history={history} tapPosition={tapPosition} target={target} deadband={deadband}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3"><Activity className="w-4 h-4 text-blue-500 inline mr-2"/>Readings</h3>
                    {[
                        {l:'Voltage',v:`${voltage.toFixed(1)}V`,c:voltage>126||voltage<114?'text-red-500':Math.abs(voltage-target)>deadband?'text-amber-500':'text-emerald-500'},
                        {l:'Tap Position',v:`${tapPosition>0?'+':''}${tapPosition}`,c:''},
                        {l:'Target',v:`${target}V ±${deadband}V`},
                        {l:'Time Delay',v:`${timeDelay}s`},
                        {l:'Delay Counter',v:`${delayCounter.current}/${timeDelay}s`,c:delayCounter.current>0?'text-amber-500':''},
                        {l:'Elapsed',v:`${elapsed}s`},
                    ].map(r=>(<div key={r.l} className="flex justify-between text-sm py-0.5"><span className="opacity-60">{r.l}</span><span className={`font-mono font-bold ${r.c||''}`}>{r.v}</span></div>))}
                </div>
                <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3"><ShieldCheck className="w-4 h-4 text-emerald-500 inline mr-2"/>Event Log</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {events.length===0&&<p className="text-sm opacity-40 italic">Start simulation and apply load changes.</p>}
                        <AnimatePresence>
                            {events.map((e,i)=>(
                                <motion.div 
                                    key={e.msg + i} 
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                                    className={`text-xs p-2 rounded-lg border ${e.type==='tap'?'border-blue-500/20 bg-blue-500/5':e.type==='warn'?'border-amber-500/20 bg-amber-500/5':'border-slate-500/20 bg-slate-500/5'}`}
                                >
                                    <span className="font-mono opacity-60">[{e.time}s]</span> <span className="font-bold">{e.msg}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
// ============================== GUIDE + QUIZ ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500"/></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">Voltage Regulator / OLTC Simulator</p></div></div>
        {[
            {s:'1',t:'Configure',d:'Set target voltage (120V nominal), deadband (±2V typical), and time delay (30s typical). These are the three key settings for any voltage regulator.'},
            {s:'2',t:'Start & Apply Loads',d:'Start the simulation, then click load disturbance buttons to simulate heavy load pickup (-6V), normal load changes, or load rejection (+4V overshoot).'},
            {s:'3',t:'Watch Tap Changes',d:'When voltage exits the deadband for longer than the time delay, the regulator raises or lowers the tap. Each step adjusts ~0.625%. Watch the chart update in real-time.'},
            {s:'4',t:'Observe ANSI Limits',d:'The red dashed lines at 126V and 114V are ANSI C84.1 Range A limits. The green band is your target ± deadband. The regulator should keep voltage within all bands.'},
        ].map(i=>(<div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div><div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div></div>))}
        <div className={`p-5 rounded-xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><h4 className="font-bold mb-2 text-amber-500"><AlertTriangle className="w-4 h-4 inline mr-1"/>Standards</h4><p className="text-sm opacity-80">Voltage regulation per <strong>ANSI C84.1</strong>, tap changer per <strong>IEEE C57.15</strong> and <strong>IEC 60214</strong>.</p></div>
    </div>
);
const QuizModule = ({ isDark }: { isDark: boolean }) => {
    const [level,setLevel]=useState<'easy'|'medium'|'expert'>('easy');
    const [cur,setCur]=useState(0);const [score,setScore]=useState(0);
    const [sel,setSel]=useState<number|null>(null);const [fin,setFin]=useState(false);
    const qs=QUIZ_DATA[level];const q=qs[cur];
    const pick=(i:number)=>{if(sel!==null)return;setSel(i);if(i===q.ans)setScore(p=>p+1);setTimeout(()=>{if(cur+1>=qs.length)setFin(true);else{setCur(p=>p+1);setSel(null);}},2500);};
    const rst=()=>{setCur(0);setScore(0);setSel(null);setFin(false);};
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Award className="w-6 h-6 text-purple-500"/></div><div><h2 className="text-2xl font-black">Quiz</h2></div></div>
            <div className={`flex rounded-xl border overflow-hidden ${isDark?'border-slate-800':'border-slate-200'}`}>{(['easy','medium','expert'] as const).map(l=>(<button key={l} onClick={()=>{setLevel(l);rst();}} className={`flex-1 py-3 text-sm font-bold uppercase ${level===l?(l==='easy'?'bg-emerald-600 text-white':l==='medium'?'bg-amber-600 text-white':'bg-red-600 text-white'):isDark?'bg-slate-900 text-slate-400':'bg-slate-50 text-slate-600'}`}>{l}</button>))}</div>
            {fin?(<div className={`text-center p-8 rounded-2xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><div className="text-5xl mb-4">{score>=4?'🏆':'📚'}</div><div className="text-3xl font-black mb-2">{score}/{qs.length}</div><button onClick={rst} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button></div>):(
                <div className={`p-6 rounded-2xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <div className="flex justify-between mb-4"><span className="text-xs opacity-40">Q{cur+1}/{qs.length}</span><span className="text-xs text-emerald-500">Score: {score}</span></div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">{q.opts.map((o,i)=>(<button key={i} onClick={()=>pick(i)} className={`w-full text-left p-4 rounded-xl border text-sm ${sel===null?isDark?'border-slate-700 hover:border-blue-500':'border-slate-200 hover:border-blue-500':i===q.ans?'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold':sel===i?'border-red-500 bg-red-500/10 text-red-500':'opacity-40'}`}><span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{o}</button>))}</div>
                    {sel!==null&&<div className={`mt-4 p-4 rounded-xl text-sm ${sel===q.ans?'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400':'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'}`}><strong>{sel===q.ans?'✅ Correct!':'❌ Incorrect.'}</strong> {q.why}</div>}
                </div>
            )}
        </div>
    );
};

// ============================== MAIN ==============================
export default function VoltageRegulator() {
    const [activeTab,setActiveTab]=useState('simulator');
    const isDark=useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };
    const tabs=[{id:'theory',label:'Reference',icon:<Book className="w-4 h-4"/>},{id:'simulator',label:'Simulator',icon:<MonitorPlay className="w-4 h-4"/>},{id:'guide',label:'Guide',icon:<GraduationCap className="w-4 h-4"/>},{id:'quiz',label:'Quiz',icon:<Award className="w-4 h-4"/>}];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark?'bg-slate-950 text-slate-200':'bg-slate-50 text-slate-800'}`}>
            <SEO title="Voltage Regulator Simulator" description="Interactive OLTC tap changer simulator with voltage vs time chart, deadband, time delay, and ANSI C84.1 compliance." url="/voltage-regulator"/>
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg text-white shadow-lg shadow-emerald-500/20"><TrendingUp className="w-5 h-5"/></div><div><h1 className={`font-black text-lg ${isDark?'text-white':'text-slate-900'}`}>Volt<span className="text-emerald-500">Reg</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">✅ ANSI C84.1</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark?'bg-slate-950 border-slate-800':'bg-slate-100 border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab===t.id?(isDark?'bg-slate-800 text-emerald-400':'bg-white text-emerald-600'):'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div><button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab===t.id?(isDark?'text-emerald-400':'text-emerald-600'):'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab==='theory'&&<TheoryLibrary title="Voltage Regulation Handbook" description="Voltage regulation theory covering OLTC tap changers, deadband settings, line drop compensation, and ANSI C84.1 standards." sections={VOLTAGE_REGULATOR_THEORY_CONTENT}/>}
                <div className={activeTab==='simulator'?'block h-full overflow-y-auto':'hidden'}><SimulatorModule isDark={isDark}/></div>
                {activeTab==='guide'&&<div className="h-full overflow-y-auto"><GuideModule isDark={isDark}/></div>}
                {activeTab==='quiz'&&<div className="h-full overflow-y-auto"><QuizModule isDark={isDark}/></div>}
            </div>
        </div>
    );
}
