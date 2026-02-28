import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, Award, Timer, Zap, AlertTriangle, CheckCircle2, Play, Activity, ShieldCheck , Share2 } from 'lucide-react';
import Slider from '../components/Slider';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeObserver } from '../hooks/useThemeObserver';
import TheoryLibrary from '../components/TheoryLibrary';
import { BREAKER_FAILURE_THEORY_CONTENT } from '../data/learning-modules/breaker-failure';
import SEO from "../components/SEO";

const QUIZ_DATA={easy:[
{q:"ANSI 50BF designates:",opts:["Bus fault","Breaker failure","Backup overcurrent","Differential"],ans:1,why:"50BF = Breaker Failure Protection. It detects when a breaker fails to interrupt fault current after receiving a trip command."},
{q:"BF protection is needed because:",opts:["Breakers never fail","A stuck breaker means the fault persists, requiring backup tripping","Relays are slow","CTs saturate"],ans:1,why:"If the primary breaker fails, the fault continues. 50BF trips all adjacent breakers to isolate the fault, preventing equipment damage."},
{q:"The BF timer typically starts when:",opts:["Fault is detected","Trip command is sent to the breaker","Breaker opens","Fault clears"],ans:1,why:"The BF timer starts at the instant the trip command is issued (trip coil energized). If current persists after the timer expires, it triggers BF."},
{q:"Typical BF timer setting is:",opts:["1-5ms","100-250ms","5 seconds","60 seconds"],ans:1,why:"BF timer = breaker interrupt time + margin. For a 5-cycle breaker (83ms) + 50ms margin, the BF timer is ~130-150ms."},
{q:"BF trips which breakers?",opts:["Only the failed breaker","All adjacent breakers that can isolate the fault","All breakers in the station","Remote breakers"],ans:1,why:"BF trips all breakers that, when opened, will remove all sources of fault current feeding through the failed breaker."}
],medium:[
{q:"Current detector (50) in the BF scheme ensures:",opts:["Timer accuracy","Trip only if current is still flowing (breaker didn't open)","Voltage check","CT check"],ans:1,why:"The current detector prevents BF tripping if the breaker actually opened successfully but the trip indication was lost. No current = breaker worked."},
{q:"Retrip functionality means:",opts:["Manual reclose","BF scheme sends a second trip to the same breaker before escalating","Transfer trip","Backup relay"],ans:1,why:"Retrip gives the breaker a second chance to open. If the first trip failed due to a transient issue (low battery, sticky mechanism), retrip may succeed."},
{q:"BF timer duration formula is:",opts:["Random","T_BF \u2265 T_breaker + T_margin + T_current_detector_dropout","T_BF = 0","T_BF = T_relay \u00d7 2"],ans:1,why:"The timer must be longer than the breaker interrupt time to avoid false BF trips, plus margin for CT dropout time and current detector reset."},
{q:"In a ring bus, BF trips:",opts:["One breaker","Two adjacent breakers to isolate the bay","All breakers","No breakers"],ans:1,why:"In a ring bus, opening the two breakers adjacent to the failed breaker isolates that bay while keeping the rest of the ring energized."},
{q:"Direct transfer trip (DTT) in BF scheme sends:",opts:["Alarm","Trip signal to remote end via communication channel","Reset signal","Test signal"],ans:1,why:"DTT sends a trip command to the remote end to clear the fault contribution from that terminal when the local breaker fails."}
],expert:[
{q:"Per IEEE C37.119, the total BF clearing time target is:",opts:["1 second","Within the critical clearing time for system stability","10 seconds","Unlimited"],ans:1,why:"BF clearing must be faster than the critical clearing time to prevent cascading instability. Typically <250ms total from fault inception."},
{q:"Delayed current zero (DC offset) can fool the BF scheme by:",opts:["Resetting the timer","Keeping current detector picked up even after breaker opens","Tripping too fast","Blinding the relay"],ans:1,why:"DC offset in the fault current can keep the current detector picked up briefly after the breaker opens, causing a false BF trip if not accounted for."},
{q:"BF for stub bus faults requires:",opts:["No BF","Special BF timer with no retrip (direct to backup trip)","Longer timer","Distance backup"],ans:1,why:"Stub bus faults (between bus CT and open breaker) require direct BF backup tripping since the breaker being tested doesn't carry the fault current."},
{q:"Modern BF schemes use:",opts:["Single timer only","Dual-timer (retrip timer + backup timer)","No timer","Impedance measurement"],ans:1,why:"Timer 1 = retrip timer (faster, gives breaker a second chance). Timer 2 = backup trip timer (longer, trips adjacent breakers if retrip fails)."},
{q:"IEC 62271-100 specifies breaker rated interrupting time as:",opts:["1 cycle","3-5 cycles (50-100ms at 50Hz)","1 second","10 cycles"],ans:1,why:"Standard breaker interrupt time is 3 cycles (60ms at 50Hz) for modern SF6 breakers, up to 5 cycles for older designs. The BF timer must exceed this."}
]};

// ============================== TIMELINE CANVAS ==============================
const TimelineCanvas = ({ isDark, phase, elapsed, bfTimer, retripTimer, currentActive, breaker1, breaker2 }:
    {isDark:boolean;phase:string;elapsed:number;bfTimer:number;retripTimer:number;currentActive:boolean;breaker1:string;breaker2:string}) => {
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

        const timeScale = cw * 0.8 / Math.max(bfTimer + 100, 400);
        const ox = 40, oy = ch - 30;

        // Time axis
        ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cw - 10, oy); ctx.stroke();
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = '9px Inter, sans-serif';
        for(let t = 0; t <= Math.max(bfTimer+100, 400); t += 50) {
            const x = ox + t * timeScale;
            ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + 5); ctx.stroke();
            ctx.fillText(`${t}`, x - 6, oy + 15);
        }
        ctx.fillText('ms \u2192', cw - 28, oy + 15);
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('TIMER SEQUENCE DIAGRAM', 8, 16);

        // Rows
        const rows = [
            { label: 'Trip Cmd', y: 35, activeFrom: 0, color: '#3b82f6' },
            { label: 'Fault I', y: 65, activeFrom: 0, color: currentActive ? '#ef4444' : '#22c55e' },
            { label: 'Retrip', y: 95, activeFrom: retripTimer * 0.8, color: '#f59e0b' },
            { label: '50BF Trip', y: 125, activeFrom: bfTimer, color: '#ef4444' },
        ];

        rows.forEach(r => {
            ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText(r.label, 2, r.y + 4);

            // Signal line
            const startX = ox + r.activeFrom * timeScale;
            ctx.beginPath();
            ctx.moveTo(ox, r.y);
            ctx.lineTo(startX, r.y);
            if (elapsed * 1000 >= r.activeFrom) {
                ctx.lineTo(startX, r.y - 15);
                const endX = Math.min(ox + elapsed * 1000 * timeScale, cw - 20);
                ctx.lineTo(endX, r.y - 15);
            }
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Active indicator
            if (elapsed * 1000 >= r.activeFrom && elapsed > 0) {
                ctx.fillStyle = r.color;
                ctx.font = 'bold 8px Inter, sans-serif';
                ctx.fillText('\u25cf', startX - 3, r.y + 12);
            }
        });

        // Elapsed marker
        if (elapsed > 0) {
            const ex = ox + elapsed * 1000 * timeScale;
            ctx.beginPath();
            ctx.moveTo(ex, 25); ctx.lineTo(ex, oy);
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3,2]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#a855f7';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText(`${(elapsed*1000).toFixed(0)}ms`, ex - 10, 22);
        }

        // BF timer threshold
        const bfX = ox + bfTimer * timeScale;
        ctx.beginPath(); ctx.moveTo(bfX, 30); ctx.lineTo(bfX, oy);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([4,3]);
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText(`BF=${bfTimer}ms`, bfX - 15, oy - 5);

        // Phase label
        ctx.fillStyle = phase === 'BF_TRIP' ? '#ef4444' : phase === 'SUCCESS' ? '#22c55e' : isDark ? '#cbd5e1' : '#334155';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(phase || 'IDLE', cw - 80, 16);
    }, [isDark, phase, elapsed, bfTimer, retripTimer, currentActive, breaker1, breaker2]);
    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{height:200, border:isDark?'1px solid rgb(30,41,59)':'1px solid rgb(226,232,240)'}} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [bfTimer, setBfTimer] = useState(150);
    const [retripTimer, setRetripTimer] = useState(80);
    const [breakerFails, setBreakerFails] = useState(true);
    const [phase, setPhase] = useState('');
    const [elapsed, setElapsed] = useState(0);
    const [currentActive, setCurrentActive] = useState(false);
    const [events, setEvents] = useState<{time:number;msg:string;type:string}[]>([]);
    const [running, setRunning] = useState(false);
    const timerRef = useRef<any>(null);

    const start = () => {
        setPhase('TRIP_SENT'); setElapsed(0); setCurrentActive(true); setRunning(true);
        setEvents([{time:0,msg:'\u26a1 Fault detected \u2014 Trip command sent to breaker. BF timer started.',type:'info'}]);

        let step = 0;
        timerRef.current = setInterval(() => {
            step++;
            const t = step * 0.01;
            setElapsed(t);

            // Retrip point
            if (step === Math.round(retripTimer / 10)) {
                setEvents(prev => [{time:t,msg:`\ud83d\udd04 RETRIP at ${retripTimer}ms \u2014 Second trip command sent to breaker.`,type:'warn'},...prev]);
                if (!breakerFails) {
                    // Breaker succeeds on retrip
                    setTimeout(() => {
                        setCurrentActive(false);
                        setPhase('SUCCESS');
                        setEvents(prev => [{time:t+0.03,msg:'\u2705 Breaker opened on RETRIP \u2014 Current cleared. BF timer cancelled.',type:'success'},...prev]);
                        setRunning(false);
                        clearInterval(timerRef.current);
                    }, 300);
                }
            }

            // BF timer expiry
            if (step === Math.round(bfTimer / 10) && breakerFails) {
                setPhase('BF_TRIP');
                setEvents(prev => [{time:t,msg:`\ud83d\udd34 50BF TIMER EXPIRED at ${bfTimer}ms \u2014 Current still flowing! BACKUP TRIP all adjacent breakers.`,type:'trip'},...prev]);
                setTimeout(() => { setCurrentActive(false); setRunning(false); clearInterval(timerRef.current); }, 200);
            }
        }, 10);
    };

    const reset = () => { if(timerRef.current) clearInterval(timerRef.current); setPhase(''); setElapsed(0); setCurrentActive(false); setRunning(false); setEvents([]); };

    return (
        <div className="space-y-6">
            <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4"><Settings className="w-5 h-5 text-blue-500 inline mr-2"/>Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Slider 
                        label="BF Timer" 
                        unit=" ms" 
                        min={100} 
                        max={300} 
                        step={10} 
                        value={bfTimer} 
                        onChange={e => setBfTimer(Number(e.target.value))} 
                        color="red" 
                        disabled={running}
                    />
                    <Slider 
                        label="Retrip Timer" 
                        unit=" ms" 
                        min={40} 
                        max={120} 
                        step={10} 
                        value={retripTimer} 
                        onChange={e => setRetripTimer(Number(e.target.value))} 
                        color="amber" 
                        disabled={running}
                    />
                </div>
                <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={breakerFails} onChange={e=>setBreakerFails(e.target.checked)} className="accent-red-500" disabled={running}/>
                        <span className="text-sm font-bold">{breakerFails ? '\u274c Breaker FAILS to open' : '\u2705 Breaker opens on retrip'}</span>
                    </label>
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={start} disabled={running} className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2"><Zap className="w-4 h-4"/>Inject Fault + Trip</button>
                    <button onClick={reset} className={`px-6 py-2.5 rounded-xl font-bold text-sm ${isDark?'bg-slate-800 text-white':'bg-slate-200'}`}><RotateCcw className="w-4 h-4 inline mr-1"/>Reset</button>
                </div>
            </div>

            <div className={`rounded-2xl border p-4 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 text-sm"><Timer className="w-4 h-4 text-red-500 inline mr-2"/>Timer Sequence Diagram</h3>
                <TimelineCanvas isDark={isDark} phase={phase} elapsed={elapsed} bfTimer={bfTimer} retripTimer={retripTimer} currentActive={currentActive} breaker1="CB1" breaker2="CB2"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-3"><Activity className="w-4 h-4 text-blue-500 inline mr-2"/>Status</h3>
                    {[
                        {l:'Phase',v:phase||'IDLE',c:phase==='BF_TRIP'?'text-red-500':phase==='SUCCESS'?'text-emerald-500':''},
                        {l:'Elapsed',v:`${(elapsed*1000).toFixed(0)}ms`},
                        {l:'Current',v:currentActive?'FLOWING \u26a1':'CLEARED \u2705',c:currentActive?'text-red-500':'text-emerald-500'},
                        {l:'BF Timer',v:`${bfTimer}ms`},
                        {l:'Retrip',v:`${retripTimer}ms`},
                    ].map(r=>(<div key={r.l} className="flex justify-between text-sm py-0.5"><span className="opacity-60">{r.l}</span><span className={`font-mono font-bold ${r.c||''}`}>{r.v}</span></div>))}
                </div>
                <div className={`rounded-2xl border p-5 text-center ${phase==='BF_TRIP'?'bg-red-500/10 border-red-500/30':phase==='SUCCESS'?'bg-emerald-500/10 border-emerald-500/30':isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    {phase==='BF_TRIP'&&(
                        <div className="flex flex-col items-center gap-2">
                            <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse"/>
                            <div className="text-red-500 font-black text-xl uppercase tracking-tighter">50BF BACKUP TRIP</div>
                            <div className="text-[10px] uppercase font-bold opacity-60">Tripping all adjacent terminal breakers</div>
                        </div>
                    )}
                    {phase==='SUCCESS'&&(
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500"/>
                            <div className="text-emerald-500 font-black text-xl uppercase tracking-tighter">Breaker Opened</div>
                            <div className="text-[10px] uppercase font-bold opacity-60">BF Sequence Cancelled (Normal Clearing)</div>
                        </div>
                    )}
                    {!phase&&<div className="opacity-40 font-bold h-full flex items-center justify-center">Awaiting fault inception...</div>}
                    {phase==='TRIP_SENT'&&<div className="text-amber-500 font-bold animate-pulse h-full flex flex-col items-center justify-center gap-2">
                        <Timer className="w-8 h-8"/>
                        <div className="uppercase tracking-widest text-xs font-black">BF Timer Timing Out...</div>
                    </div>}
                </div>
            </div>
            <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3"><ShieldCheck className="w-4 h-4 text-blue-500 inline mr-2"/>Event Log</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {events.length===0&&<p className="text-sm opacity-40 italic">Inject a fault to start simulation.</p>}
                    <AnimatePresence>
                            {events.map((e,i)=>(<motion.div 
                                key={e.msg + i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`text-xs p-2.5 rounded-lg border ${e.type==='trip'?'border-red-500/30 bg-red-500/10':e.type==='warn'?'border-amber-500/20 bg-amber-500/5':e.type==='success'?'border-emerald-500/20 bg-emerald-500/5':'border-blue-500/20 bg-blue-500/5'}`}><span className="font-mono opacity-60">[{(e.time*1000).toFixed(0)}ms]</span> <span className="font-bold">{e.msg}</span></motion.div>))}
                        </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500"/></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">Breaker Failure Protection (50BF)</p></div></div>
        {[
            {s:'1',t:'Set Timer Values',d:'BF timer = breaker interrupt time + margin (typically 130-250ms). Retrip timer = a shorter timer to give the breaker a second trip command before escalating to backup trip.'},
            {s:'2',t:'Choose Breaker Behavior',d:'Toggle between breaker fails (stays closed) and breaker succeeds on retrip. This lets you see both outcomes \u2014 BF backup trip vs successful retrip.'},
            {s:'3',t:'Watch the Timeline',d:'The sequence diagram shows trip command, fault current, retrip, and BF trip signals in real-time. The vertical purple marker shows elapsed time. The red dashed line shows the BF threshold.'},
            {s:'4',t:'Understand the Logic',d:'If fault current persists past the BF timer, all adjacent breakers are tripped. If current clears before the timer, BF is cancelled. This is the core security/dependability tradeoff.'},
        ].map(i=>(<div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div><div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div></div>))}
        <div className={`p-5 rounded-xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-2 text-amber-500"><AlertTriangle className="w-4 h-4 inline mr-1"/>Standards</h4>
            <p className="text-sm opacity-80">Modeled per <strong>IEEE C37.119</strong> (Breaker Failure Protection) and <strong>IEC 62271-100</strong> (Circuit Breaker ratings).</p>
        </div>
    </div>
);

// ============================== QUIZ ==============================
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
            {fin?(<div className={`text-center p-8 rounded-2xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><div className="text-5xl mb-4">{score>=4?'\ud83c\udfc6':'\ud83d\udcc3'}</div><div className="text-3xl font-black mb-2">{score}/{qs.length}</div><button onClick={rst} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">Retry</button></div>):(
                <div className={`p-6 rounded-2xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <div className="flex justify-between mb-4"><span className="text-xs opacity-40">Q{cur+1}/{qs.length}</span><span className="text-xs text-emerald-500">Score: {score}</span></div>
                    <h3 className="text-lg font-bold mb-6">{q.q}</h3>
                    <div className="space-y-3">{q.opts.map((o,i)=>(<button key={i} onClick={()=>pick(i)} className={`w-full text-left p-4 rounded-xl border text-sm ${sel===null?isDark?'border-slate-700 hover:border-blue-500':'border-slate-200 hover:border-blue-500':i===q.ans?'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold':sel===i?'border-red-500 bg-red-500/10 text-red-500':'opacity-40'}`}><span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{o}</button>))}</div>
                    {sel!==null&&<div className={`mt-4 p-4 rounded-xl text-sm ${sel===q.ans?'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400':'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'}`}><strong>{sel===q.ans?'\u2705 Correct!':'\u274c Incorrect.'}</strong> {q.why}</div>}
                </div>
            )}
        </div>
    );
};

// ============================== MAIN ==============================
export default function BreakerFailure() {
    const [activeTab,setActiveTab]=useState('simulator');
    const isDark=useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };
    const tabs=[{id:'theory',label:'Reference',icon:<Book className="w-4 h-4"/>},{id:'simulator',label:'Simulator',icon:<MonitorPlay className="w-4 h-4"/>},{id:'guide',label:'Guide',icon:<GraduationCap className="w-4 h-4"/>},{id:'quiz',label:'Quiz',icon:<Award className="w-4 h-4"/>}];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark?'bg-slate-950 text-slate-200':'bg-slate-50 text-slate-800'}`}>
            <SEO title="Breaker Failure Protection (50BF)" description="Interactive breaker failure timer simulator with sequence diagram, retrip logic, and IEEE C37.119 compliance." url="/breaker-failure"/>
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-red-600 to-rose-600 p-2 rounded-lg text-white shadow-lg shadow-red-500/20"><Timer className="w-5 h-5"/></div><div><h1 className={`font-black text-lg ${isDark?'text-white':'text-slate-900'}`}>BF<span className="text-red-500">Guard</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-red-500/80">\u2705 IEEE C37.119</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark?'bg-slate-950 border-slate-800':'bg-slate-100 border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab===t.id?(isDark?'bg-slate-800 text-red-400':'bg-white text-red-600'):'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div><button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab===t.id?(isDark?'text-red-400':'text-red-600'):'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab==='theory'&&<TheoryLibrary title="Breaker Failure Handbook" description="Breaker failure protection (50BF) principles including timer coordination, retrip logic, current detection, and IEEE C37.119." sections={BREAKER_FAILURE_THEORY_CONTENT}/>}
                <div className={activeTab==='simulator'?'block h-full overflow-y-auto':'hidden'}><SimulatorModule isDark={isDark}/></div>
                {activeTab==='guide'&&<div className="h-full overflow-y-auto"><GuideModule isDark={isDark}/></div>}
                {activeTab==='quiz'&&<div className="h-full overflow-y-auto"><QuizModule isDark={isDark}/></div>}
            </div>
        </div>
    );
}
