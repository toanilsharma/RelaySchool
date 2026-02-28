import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, HelpCircle, Book, AlertTriangle, Settings, MonitorPlay, GraduationCap, Award, Cpu, Activity, Zap, Calculator, CheckCircle2, ShieldCheck , Share2 } from 'lucide-react';
import Slider from '../components/Slider';
import { useThemeObserver } from '../hooks/useThemeObserver';
import TheoryLibrary from '../components/TheoryLibrary';
import { CT_VT_THEORY_CONTENT } from '../data/learning-modules/ct-vt-sizing';
import SEO from "../components/SEO";

const QUIZ_DATA = {
    easy: [
        { q: "A CT is connected in ___ with the power circuit.", opts: ["Parallel", "Series", "Delta", "Open"], ans: 1, why: "CTs are connected in series so the primary current flows through them. Opening a CT secondary while primary is energized creates dangerous voltages." },
        { q: "A VT is connected in ___ with the power circuit.", opts: ["Series", "Parallel", "Delta", "Open"], ans: 1, why: "VTs are connected in parallel to measure voltage. They step down the high voltage to a safe secondary level (typically 110V or 120V)." },
        { q: "Standard CT secondary rating is:", opts: ["10A", "5A or 1A", "100A", "50A"], ans: 1, why: "Standard CT secondary is 5A (IEEE) or 1A (IEC). All relays and meters are calibrated for these standard values." },
        { q: "CT accuracy class C800 means:", opts: ["800A rating", "Maintains accuracy at up to 800V secondary at rated burden", "800Hz operation", "800 turns ratio"], ans: 1, why: "C800 means the CT maintains its accuracy (ratio error ≤10%) up to 800V secondary voltage at its rated burden and 20× rated current." },
        { q: "If a CT secondary is accidentally opened:", opts: ["Nothing happens", "Dangerous high voltage appears on secondary", "Current flows backward", "Frequency changes"], ans: 1, why: "An open CT secondary forces all flux into the core (saturating it), generating potentially lethal secondary voltages (thousands of volts)." },
    ],
    medium: [
        { q: "CT knee point is defined as:", opts: ["Maximum current", "Voltage where 10% increase requires 50% more exciting current", "Point of zero error", "Thermal limit"], ans: 1, why: "The knee point on the V-I excitation curve marks the onset of saturation. Above it, accuracy degrades rapidly. IEEE defines it as the 10%/50% point." },
        { q: "CT burden includes:", opts: ["Only relay", "Relay + CT lead resistance + connections", "Only cable", "Primary impedance"], ans: 1, why: "Total burden = relay burden (VA) + lead wire resistance (2×length×R/1000ft) + contact and wiring resistance. All add to the required CT voltage." },
        { q: "For differential CTs, the safety factor should be:", opts: ["1.0", "1.5", "3-4×", "0.5"], ans: 2, why: "Differential CTs need higher safety factors (3-4×) because both CTs must track accurately under through-fault conditions to prevent misoperation." },
        { q: "VT ferro-resonance occurs when:", opts: ["Load is high", "Cable capacitance resonates with VT inductance after switching", "Frequency drops", "CT saturates"], ans: 1, why: "Ferro-resonance is an oscillation between the nonlinear VT inductance and system capacitance, typically triggered by switching operations." },
        { q: "ISF (Instrument Security Factor) limits:", opts: ["Voltage", "Secondary current during faults to protect meters", "Frequency", "Power factor"], ans: 1, why: "ISF (or FS) limits the secondary fault current by saturating the CT, protecting meters and instruments from excessive current." },
    ],
    expert: [
        { q: "CT saturation during an asymmetric fault is caused by:", opts: ["Low frequency", "DC offset in fault current", "High voltage", "Cable capacitance"], ans: 1, why: "The DC component of fault current creates a unidirectional flux that, when added to the AC flux, pushes the core beyond the saturation flux density." },
        { q: "The dimensioning factor (Ktd) for CT sizing considers:", opts: ["Only fault current", "DC offset duration (X/R ratio), remanence, and required accuracy", "Voltage only", "Temperature"], ans: 1, why: "Ktd = Ks × Kn where Ks accounts for DC transient (depends on X/R) and Kn accounts for remanence. Higher X/R = more DC offset = larger CT needed." },
        { q: "LPCT (Low-Power Current Transformer) advantage:", opts: ["Cheaper", "No saturation, no burden concerns, digital output per IEC 61850-9-2", "Higher current", "More accuracy classes"], ans: 1, why: "LPCTs (Rogowski coils) are linear (no iron core), produce a voltage proportional to di/dt, and feed directly into IEC 61850 merging units." },
        { q: "VT ferro-resonance can be prevented by:", opts: ["Adding burden resistor", "Increasing cable length", "Removing grounding", "Adding capacitors"], ans: 0, why: "A damping resistor on the VT secondary open-delta winding dissipates the oscillation energy, preventing sustained ferro-resonance." },
        { q: "Per IEEE C57.13, class 0.3 metering CT has max error of:", opts: ["3%", "0.3% at rated current", "30%", "0.03%"], ans: 1, why: "Class 0.3 means the ratio correction factor is within 0.3% of unity (1.000 ± 0.003) at 100% rated current and rated burden." },
    ],
};

// ============================== CT EXCITATION CURVE CANVAS ==============================
const ExcitationCurve = ({ isDark, kneeV, kneeI, burden, faultMult }:
    {isDark:boolean;kneeV:number;kneeI:number;burden:number;faultMult:number}) => {
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

        const margin = {l:50,r:15,t:20,b:35};
        const gw = cw-margin.l-margin.r, gh = ch-margin.t-margin.b;
        const iMax = 20, vMax = kneeV * 2;

        // Grid
        ctx.strokeStyle = isDark ? 'rgba(100,116,139,0.15)' : 'rgba(148,163,184,0.2)';
        ctx.lineWidth = 0.5;
        for(let i = 0; i <= iMax; i += 2) {
            const x = margin.l + (i/iMax)*gw;
            ctx.beginPath(); ctx.moveTo(x, margin.t); ctx.lineTo(x, ch-margin.b); ctx.stroke();
            ctx.fillStyle = isDark?'#64748b':'#94a3b8'; ctx.font='8px Inter, sans-serif'; ctx.fillText(`${i}A`, x-6, ch-margin.b+12);
        }
        for(let v = 0; v <= vMax; v += 100) {
            const y = margin.t + gh * (1 - v/vMax);
            ctx.beginPath(); ctx.moveTo(margin.l, y); ctx.lineTo(cw-margin.r, y); ctx.stroke();
            ctx.fillStyle = isDark?'#64748b':'#94a3b8'; ctx.font='8px Inter, sans-serif'; ctx.fillText(`${v}V`, 5, y+3);
        }

        // Draw excitation curve (S-shaped on log scale)
        ctx.beginPath();
        for(let i = 0.01; i <= iMax; i += 0.1) {
            let v;
            if (i <= kneeI) {
                v = (i / kneeI) * kneeV;
            } else {
                // Saturation region — logarithmic flattening
                const excess = (i - kneeI) / kneeI;
                v = kneeV + kneeV * 0.15 * Math.log(1 + excess * 5);
            }
            const x = margin.l + (i/iMax)*gw;
            const y = margin.t + gh * (1 - Math.min(v, vMax)/vMax);
            if(i <= 0.02) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Knee point marker
        const kx = margin.l + (kneeI/iMax)*gw;
        const ky = margin.t + gh * (1 - kneeV/vMax);
        ctx.beginPath(); ctx.arc(kx, ky, 5, 0, Math.PI*2);
        ctx.fillStyle = '#ef4444'; ctx.fill();
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(`Knee (${kneeI}A, ${kneeV}V)`, kx+8, ky-5);

        // Operating point (based on burden and fault current)
        const opI = burden * faultMult * 0.01;
        const opV = Math.min(opI < kneeI ? (opI/kneeI)*kneeV : kneeV * 1.1, vMax);
        const ox = margin.l + (Math.min(opI,iMax)/iMax)*gw;
        const oy = margin.t + gh * (1 - opV/vMax);
        ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI*2);
        ctx.fillStyle = opI > kneeI ? '#f59e0b' : '#22c55e'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = opI > kneeI ? '#f59e0b' : '#22c55e';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(opI > kneeI ? `SATURATED (${opI.toFixed(1)}A)` : `OK (${opI.toFixed(1)}A)`, ox+8, oy+4);

        // Labels
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = isDark?'#94a3b8':'#64748b';
        ctx.fillText('CT EXCITATION CURVE (V-I)', margin.l, 14);
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('Exciting Current (A) →', cw/2 - 40, ch - 5);
    }, [isDark, kneeV, kneeI, burden, faultMult]);
    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{height:300, border:isDark?'1px solid rgb(30,41,59)':'1px solid rgb(226,232,240)'}} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({ isDark }: { isDark: boolean }) => {
    const [ctRatio, setCtRatio] = useState(600);
    const [ctClass, setCtClass] = useState('C400');
    const [burden, setBurden] = useState(2.0);
    const [leadR, setLeadR] = useState(0.5);
    const [faultI, setFaultI] = useState(10000);
    const [vtRatio, setVtRatio] = useState(132);
    const [vtBurden, setVtBurden] = useState(100);

    const classVoltages: Record<string,number> = { 'C100':100, 'C200':200, 'C400':400, 'C800':800 };
    const kneeV = classVoltages[ctClass] || 400;
    const kneeI = 1.0;
    const iSecondary = faultI / (ctRatio / 5);
    const vRequired = iSecondary * (burden + leadR * 2);
    const isSaturated = vRequired > kneeV * 0.9;
    const totalBurden = burden + leadR * 2;
    const vtSecondary = vtRatio * 1000 / (vtRatio * 1000 / 110);
    const ALF = kneeV / (iSecondary > 0 ? vRequired / iSecondary : 1);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CT Calculator */}
                <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-blue-500"/>CT Sizing Calculator</h3>
                    <div className="space-y-3">
                        <div><label className="text-xs font-bold uppercase opacity-60 block">CT Ratio (Primary/5A)</label>
                            <select value={ctRatio} onChange={e=>setCtRatio(+e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDark?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}>
                                {[50,100,150,200,250,300,400,500,600,800,900,1000,1200,1500,2000,2500,3000,4000].map(r => <option key={r} value={r}>{r}/5A</option>)}
                            </select>
                        </div>
                        <div><label className="text-xs font-bold uppercase opacity-60 block">Accuracy Class</label>
                            <select value={ctClass} onChange={e=>setCtClass(e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDark?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}>
                                {Object.keys(classVoltages).map(c => <option key={c} value={c}>{c} ({classVoltages[c]}V)</option>)}
                            </select>
                        </div>
                        <Slider 
                            label="Relay Burden" 
                            unit=" Ω" 
                            min={0.5} 
                            max={8} 
                            step={0.5} 
                            value={burden} 
                            onChange={e => setBurden(Number(e.target.value))} 
                            color="amber" 
                        />
                        <Slider 
                            label="Lead Resistance" 
                            unit=" Ω (one-way)" 
                            min={0.1} 
                            max={3} 
                            step={0.1} 
                            value={leadR} 
                            onChange={e => setLeadR(Number(e.target.value))} 
                            color="emerald" 
                        />
                        <Slider 
                            label="Max Fault Current" 
                            unit=" A (primary)" 
                            min={1000} 
                            max={50000} 
                            step={1000} 
                            value={faultI} 
                            onChange={e => setFaultI(Number(e.target.value))} 
                            color="red" 
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                    <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-3"><Calculator className="w-4 h-4 text-emerald-500 inline mr-2"/>CT Calculation Results</h3>
                        {[
                            {l:'I_secondary',v:`${iSecondary.toFixed(1)}A`,c:iSecondary>100?'text-red-500':''},
                            {l:'Total Burden',v:`${totalBurden.toFixed(1)}Ω`},
                            {l:'V_required',v:`${vRequired.toFixed(0)}V`,c:vRequired>kneeV?'text-red-500':'text-emerald-500'},
                            {l:'V_knee (class)',v:`${kneeV}V`},
                            {l:'Safety Margin',v:`${((kneeV/Math.max(vRequired,1))*100).toFixed(0)}%`,c:kneeV/vRequired<1.2?'text-red-500':kneeV/vRequired<2?'text-amber-500':'text-emerald-500'},
                            {l:'ALF (approx)',v:`${ALF.toFixed(1)}×`},
                        ].map(r=>(<div key={r.l} className="flex justify-between text-sm py-0.5"><span className="opacity-60">{r.l}</span><span className={`font-mono font-bold ${r.c||''}`}>{r.v}</span></div>))}
                    </div>
                    <div className={`rounded-2xl border p-4 text-center ${isSaturated?'bg-red-500/10 border-red-500/30':'bg-emerald-500/10 border-emerald-500/30'}`}>
                        {isSaturated ? <div className="text-red-500 font-black text-lg"><AlertTriangle className="w-5 h-5 inline mr-2"/>CT WILL SATURATE — Upgrade class or reduce burden!</div>
                            : <div className="text-emerald-500 font-black text-lg"><CheckCircle2 className="w-5 h-5 inline mr-2"/>CT ADEQUATE — Sufficient margin</div>}
                    </div>
                </div>
            </div>

            {/* Excitation Curve */}
            <div className={`rounded-2xl border p-4 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 text-sm"><Activity className="w-4 h-4 text-blue-500 inline mr-2"/>CT Excitation Curve (Knee Point)</h3>
                <ExcitationCurve isDark={isDark} kneeV={kneeV} kneeI={kneeI} burden={totalBurden} faultMult={faultI/(ctRatio/5)}/>
                <div className="flex gap-4 mt-2 text-[10px] font-bold flex-wrap">
                    <span className="text-blue-500">— Excitation Curve</span>
                    <span className="text-red-500">● Knee Point</span>
                    <span className="text-emerald-500">● Operating (OK)</span>
                    <span className="text-amber-500">● Operating (Saturated)</span>
                </div>
            </div>

            {/* VT Calculator */}
            <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500"/>VT Quick Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div><label className="text-xs font-bold uppercase opacity-60 block">System Voltage (kV)</label>
                            <select value={vtRatio} onChange={e=>setVtRatio(+e.target.value)} className={`w-full p-2 mb-2 rounded-lg border text-sm ${isDark?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}>
                                {[3.3, 6.6, 11, 22, 33, 66, 132, 220, 275, 400, 500].map(v => <option key={v} value={v}>{v}kV</option>)}
                            </select>
                        </div>
                        <div className="mt-2">
                            <Slider 
                                label="VT Burden" 
                                unit=" VA" 
                                min={25} 
                                max={500} 
                                step={25} 
                                value={vtBurden} 
                                onChange={e => setVtBurden(Number(e.target.value))} 
                                color="purple" 
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        {[
                            {l:'Secondary',v:`${(110).toFixed(0)}V (standard)`},
                            {l:'Ratio',v:`${vtRatio}kV / 110V = ${(vtRatio*1000/110).toFixed(0)}:1`},
                            {l:'Primary VA',v:`${vtBurden}VA`},
                            {l:'Secondary I',v:`${(vtBurden/110).toFixed(2)}A`},
                        ].map(r=>(<div key={r.l} className="flex justify-between text-sm"><span className="opacity-60">{r.l}</span><span className="font-mono font-bold">{r.v}</span></div>))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({ isDark }: { isDark: boolean }) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500"/></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">CT/VT Sizing Calculator</p></div></div>
        {[
            {s:'1',t:'Set CT Parameters',d:'Enter the CT ratio (primary/5A), accuracy class (C100-C800), relay burden, and lead resistance. Lead resistance is doubled because current must travel to the relay and back.'},
            {s:'2',t:'Enter Fault Current',d:'Set the maximum expected fault current on the primary side. This determines the CT secondary current and the required knee-point voltage.'},
            {s:'3',t:'Check Excitation Curve',d:'The green dot on the excitation curve means the operating point is below the knee — CT is adequate. An amber dot means the CT will saturate — upgrade to a higher class or reduce burden.'},
            {s:'4',t:'Verify Safety Margin',d:'A margin >200% is good for protection CTs. For differential, aim for 300%+. Below 120% means the CT is undersized for the application.'},
        ].map(i=>(<div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div><div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div></div>))}
        <div className={`p-5 rounded-xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><h4 className="font-bold mb-2 text-amber-500"><AlertTriangle className="w-4 h-4 inline mr-1"/>Standards</h4><p className="text-sm opacity-80">CT sizing per <strong>IEEE C57.13</strong> and <strong>IEC 61869</strong>. VT ratings per <strong>IEEE C57.13.3</strong></p></div>
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
export default function CTVTCalculator() {
    const [activeTab,setActiveTab]=useState('simulator');
    const isDark=useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };
    const tabs=[{id:'theory',label:'Reference',icon:<Book className="w-4 h-4"/>},{id:'simulator',label:'Calculator',icon:<MonitorPlay className="w-4 h-4"/>},{id:'guide',label:'Guide',icon:<GraduationCap className="w-4 h-4"/>},{id:'quiz',label:'Quiz',icon:<Award className="w-4 h-4"/>}];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark?'bg-slate-950 text-slate-200':'bg-slate-50 text-slate-800'}`}>
            <SEO title="CT/VT Sizing Calculator" description="CT/VT sizing calculator with excitation curve visualization, burden calculation, knee point analysis per IEEE C57.13." url="/ct-vt-sizing"/>
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/20"><Cpu className="w-5 h-5"/></div><div><h1 className={`font-black text-lg ${isDark?'text-white':'text-slate-900'}`}>CT<span className="text-indigo-500">/VT</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80">✅ IEEE C57.13</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark?'bg-slate-950 border-slate-800':'bg-slate-100 border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab===t.id?(isDark?'bg-slate-800 text-indigo-400':'bg-white text-indigo-600'):'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div><button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab===t.id?(isDark?'text-indigo-400':'text-indigo-600'):'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab==='theory'&&<TheoryLibrary title="CT/VT Handbook" description="Current and voltage transformer theory covering sizing, excitation curves, burden calculations, saturation, and IEEE C57.13." sections={CT_VT_THEORY_CONTENT}/>}
                <div className={activeTab==='simulator'?'block h-full overflow-y-auto':'hidden'}><SimulatorModule isDark={isDark}/></div>
                {activeTab==='guide'&&<div className="h-full overflow-y-auto"><GuideModule isDark={isDark}/></div>}
                {activeTab==='quiz'&&<div className="h-full overflow-y-auto"><QuizModule isDark={isDark}/></div>}
            </div>
        </div>
    );
}
