import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, HelpCircle, Book, Settings, MonitorPlay, GraduationCap, Award, Calculator, CheckCircle2, Activity, Zap, AlertTriangle , Share2 } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import Slider from '../components/Slider';
import TheoryLibrary from '../components/TheoryLibrary';
import { PER_UNIT_THEORY_CONTENT } from '../data/learning-modules/per-unit';
import SEO from "../components/SEO";

const QUIZ_DATA={easy:[
{q:"Per-unit values are quantities expressed as:",opts:["Percentages only","Fractions of a chosen base value","Absolute values in SI","Logarithmic scale"],ans:1,why:"Per-unit normalizes quantities by dividing the actual value by the base value. A 1.0 pu voltage means 100% of the nominal base."},
{q:"If base voltage is 230kV and actual is 242kV, per-unit is:",opts:["0.95","1.00","1.052","242"],ans:2,why:"V_pu = V_actual / V_base = 242 / 230 = 1.052 pu (5.2% above nominal)."},
{q:"In per-unit, transformer turns ratio becomes:",opts:["Complex","1:1 (unity) when using transformer's rated voltages as bases on each side","Doubled","Unchanged"],ans:1,why:"This is the key advantage of per-unit. By choosing base voltages equal to the transformer rated voltages, the ideal transformer disappears from the circuit model."},
{q:"How many independent base quantities do we choose?",opts:["4","2 (typically S_base and V_base)","1","All are fixed"],ans:1,why:"We choose 2 bases: S_base (MVA) and V_base (kV). The other two (I_base and Z_base) are calculated from these."},
{q:"Standard system S_base is commonly:",opts:["1 MVA","10 MVA","100 MVA","1000 MVA"],ans:2,why:"100 MVA is the standard system base. All equipment impedances are converted to this common base for system studies."}
],medium:[
{q:"To convert impedance from one base to another:",opts:["Multiply by voltage ratio","Z_new = Z_old × (MVA_new/MVA_old) × (kV_old/kV_new)²","Add bases","Cannot be done"],ans:1,why:"The conversion formula accounts for both the power base change (linear) and voltage base change (squared, because Z_base = V²/S)."},
{q:"Z_base in per-unit is calculated as:",opts:["V_base / I_base","V_base² / S_base","S_base / V_base","V_base × I_base"],ans:1,why:"Z_base = V_base² / S_base. For example, at 230kV and 100MVA: Z_base = 230² / 100 = 529Ω."},
{q:"A generator rated 50MVA, X''d = 0.2 pu on 100MVA base becomes:",opts:["0.2 pu","0.4 pu","0.1 pu","1.0 pu"],ans:1,why:"Z_pu(new) = 0.2 × (100/50) = 0.4 pu. Higher MVA base → higher per-unit impedance."},
{q:"Per-unit system advantage for parallel analysis:",opts:["Faster computation only","Transformers disappear, voltages similar magnitude across system","Better graphics","None"],ans:1,why:"All voltages are near 1.0 pu, all impedances are directly comparable, and transformer turns ratios become unity. This simplifies the math enormously."},
{q:"I_base is derived from S_base and V_base as:",opts:["S_base × V_base","S_base / (√3 × V_base) for 3-phase","V_base / S_base","S_base²"],ans:1,why:"I_base = S_base / (√3 × V_base) for three-phase systems. For single-phase, omit the √3."}
],expert:[
{q:"In a 3-winding transformer, how many per-unit impedances?",opts:["1","2","3 (Z_PS, Z_PT, Z_ST)","6"],ans:2,why:"A 3-winding transformer has 3 independent impedances between each pair of windings: primary-secondary, primary-tertiary, and secondary-tertiary."},
{q:"Negative per-unit impedance in a 3-winding transformer means:",opts:["Error","The impedance between one pair includes a mutual coupling effect","Short circuit","Open circuit"],ans:1,why:"When the star-equivalent impedance is calculated, one leg can be negative. This is physically valid — it represents the mutual coupling dominance."},
{q:"Per-unit fault current in a radial system with Z_total=0.1 pu is:",opts:["0.1 pu","10 pu","1 pu","100 pu"],ans:1,why:"I_fault(pu) = V/Z = 1.0/0.1 = 10 pu. Then I_actual = I_fault(pu) × I_base. This is why low impedance = high fault current."},
{q:"Generator short circuit ratio (SCR) is the reciprocal of:",opts:["X'q","X_d(saturated) in per-unit","Armature resistance","Voltage"],ans:1,why:"SCR = 1/X_d(sat). A higher SCR means a stiffer machine (lower synchronous reactance, better voltage regulation)."},
{q:"Per-unit impedance of a cable depends on:",opts:["Only voltage","Length, cross-section, and spacing (then normalized to system base)","Color","Manufacturer only"],ans:1,why:"Cable impedance is first calculated in Ω/km from physical properties, then converted to per-unit using the system base: Z_pu = Z(Ω) / Z_base."}
]};

// ============================== PER-UNIT DIAGRAM CANVAS ==============================
const PUDiagram = ({isDark, sBase, vBase, zBase, iBase, puV, puI, puZ}:
    {isDark:boolean;sBase:number;vBase:number;zBase:number;iBase:number;puV:number;puI:number;puZ:number}) => {
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

        const cx = cw/2, cy = ch/2;
        const r = Math.min(cx,cy)*0.55;

        // Central hub
        ctx.beginPath(); ctx.arc(cx,cy,30,0,Math.PI*2);
        ctx.fillStyle = isDark?'#1e40af':'#dbeafe';
        ctx.fill();
        ctx.fillStyle = isDark?'#93c5fd':'#1e40af';
        ctx.font = 'bold 10px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BASE', cx, cy-3);
        ctx.fillText('SYSTEM', cx, cy+9);

        // Four base quantities at compass points
        const items = [
            {angle:-90, label:`S_base`, value:`${sBase} MVA`, color:'#f59e0b', detail:'Chosen'},
            {angle:0, label:`V_base`, value:`${vBase} kV`, color:'#3b82f6', detail:'Chosen'},
            {angle:90, label:`Z_base`, value:`${zBase.toFixed(1)} Ω`, color:'#22c55e', detail:`V²/S`},
            {angle:180, label:`I_base`, value:`${iBase.toFixed(0)} A`, color:'#a855f7', detail:`S/(√3·V)`},
        ];

        items.forEach(item => {
            const rad = item.angle * Math.PI / 180;
            const ex = cx + Math.cos(rad) * r;
            const ey = cy + Math.sin(rad) * r;

            // Connecting line
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(rad)*32, cy + Math.sin(rad)*32);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Node circle
            ctx.beginPath(); ctx.arc(ex,ey,28,0,Math.PI*2);
            ctx.fillStyle = isDark ? `${item.color}22` : `${item.color}15`;
            ctx.fill();
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text
            ctx.fillStyle = item.color;
            ctx.font = 'bold 9px Inter,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, ex, ey-8);
            ctx.fillStyle = isDark?'#e2e8f0':'#1e293b';
            ctx.font = 'bold 11px Inter,sans-serif';
            ctx.fillText(item.value, ex, ey+5);
            ctx.fillStyle = isDark?'#64748b':'#94a3b8';
            ctx.font = '8px Inter,sans-serif';
            ctx.fillText(item.detail, ex, ey+17);
        });

        // Results box
        ctx.fillStyle = isDark?'rgba(30,41,59,0.8)':'rgba(241,245,249,0.9)';
        const bx = cw - 120, by = 8;
        ctx.fillRect(bx, by, 112, 55);
        ctx.strokeStyle = isDark?'#334155':'#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, 112, 55);
        ctx.fillStyle = isDark?'#94a3b8':'#64748b';
        ctx.font = 'bold 8px Inter,sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CONVERTED VALUES', bx+5, by+12);
        ctx.font = '9px Inter,sans-serif';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(`V = ${puV.toFixed(3)} pu`, bx+5, by+26);
        ctx.fillStyle = '#a855f7';
        ctx.fillText(`I = ${puI.toFixed(3)} pu`, bx+5, by+38);
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`Z = ${puZ.toFixed(4)} pu`, bx+5, by+50);

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = isDark?'#475569':'#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText('PER-UNIT BASE RELATIONSHIP', 8, 16);
    }, [isDark,sBase,vBase,zBase,iBase,puV,puI,puZ]);
    return <canvas ref={canvasRef} className="w-full rounded-xl" style={{height:260, border:isDark?'1px solid rgb(30,41,59)':'1px solid rgb(226,232,240)'}} />;
};

// ============================== SIMULATOR ==============================
const SimulatorModule = ({isDark}:{isDark:boolean}) => {
    const [sBase,setSBase]=useState(100);
    const [vBase,setVBase]=useState(230);
    const [actualV,setActualV]=useState(242);
    const [actualI,setActualI]=useState(280);
    const [actualZ,setActualZ]=useState(25);
    const [equipMVA,setEquipMVA]=useState(50);
    const [equipZ,setEquipZ]=useState(0.15);
    const [equipV,setEquipV]=useState(230);

    const zBase = (vBase*vBase)/sBase;
    const iBase = (sBase*1000)/(Math.sqrt(3)*vBase);
    const puV = actualV/vBase;
    const puI = actualI/iBase;
    const puZ = actualZ/zBase;
    const zConverted = equipZ*(sBase/equipMVA)*((equipV/vBase)**2);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div className={`rounded-2xl border p-4 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-3 text-sm"><Activity className="w-4 h-4 text-blue-500 inline mr-2"/>Per-Unit Base System</h3>
                <PUDiagram isDark={isDark} sBase={sBase} vBase={vBase} zBase={zBase} iBase={iBase} puV={puV} puI={puI} puZ={puZ}/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Base & Conversion */}
                <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                    <h3 className="font-bold text-lg mb-4"><Settings className="w-5 h-5 text-blue-500 inline mr-2"/>System Base & Actual Values</h3>
                    <div className="space-y-6">
                        <Slider 
                            label="System S_base" 
                            unit=" MVA" 
                            min={10} 
                            max={500} 
                            step={10} 
                            value={sBase} 
                            onChange={e => setSBase(Number(e.target.value))} 
                            color="amber" 
                        />
                        <Slider 
                            label="System V_base" 
                            unit=" kV" 
                            min={11} 
                            max={765} 
                            step={11} 
                            value={vBase} 
                            onChange={e => setVBase(Number(e.target.value))} 
                            color="blue" 
                        />
                        <hr className={isDark?'border-slate-800':'border-slate-200'}/>
                        <div><label className="text-xs font-bold uppercase opacity-60 block">Actual Voltage (kV)</label><input type="number" min="0" value={actualV} onChange={e=>setActualV(+e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDark?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}/></div>
                        <div><label className="text-xs font-bold uppercase opacity-60 block">Actual Current (A)</label><input type="number" min="0" value={actualI} onChange={e=>setActualI(+e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDark?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}/></div>
                        <div><label className="text-xs font-bold uppercase opacity-60 block">Actual Impedance (Ω)</label><input type="number" min="0" value={actualZ} onChange={e=>setActualZ(+e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDark?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}/></div>
                    </div>
                </div>
                {/* Results */}
                <div className="space-y-4">
                    <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-3"><Calculator className="w-4 h-4 text-emerald-500 inline mr-2"/>Derived Bases & Per-Unit Values</h3>
                        {[
                            {l:'Z_base = V²/S',v:`${zBase.toFixed(2)} Ω`,c:''},
                            {l:'I_base = S/(√3·V)',v:`${iBase.toFixed(1)} A`,c:''},
                            {l:'V (pu)',v:`${puV.toFixed(4)} pu`,c:Math.abs(puV-1)>0.05?'text-amber-500':'text-emerald-500'},
                            {l:'I (pu)',v:`${puI.toFixed(4)} pu`,c:puI>1?'text-red-500':'text-emerald-500'},
                            {l:'Z (pu)',v:`${puZ.toFixed(4)} pu`,c:''},
                        ].map(r=>(<div key={r.l} className="flex justify-between text-sm py-0.5"><span className="opacity-60">{r.l}</span><span className={`font-mono font-bold ${r.c}`}>{r.v}</span></div>))}
                    </div>
                    {/* Base Conversion */}
                    <div className={`rounded-2xl border p-6 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                        <h3 className="font-bold mb-3"><Zap className="w-4 h-4 text-purple-500 inline mr-2"/>Equipment Z_pu Conversion</h3>
                        <div className="space-y-2 mb-3">
                            <div><label className="text-xs font-bold uppercase opacity-60 block">Equipment MVA Rating</label><input type="number" min="0" value={equipMVA} onChange={e=>setEquipMVA(+e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDark?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}/></div>
                            <div><label className="text-xs font-bold uppercase opacity-60 block">Equipment Z_pu (on own base)</label><input type="number" min="0" value={equipZ} step={0.01} onChange={e=>setEquipZ(+e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDark?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}/></div>
                            <div><label className="text-xs font-bold uppercase opacity-60 block">Equipment Rated Voltage (kV)</label><input type="number" min="0" value={equipV} onChange={e=>setEquipV(+e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDark?'bg-slate-800 border-slate-700 text-white':'bg-slate-50 border-slate-200'}`}/></div>
                        </div>
                        <div className={`p-4 rounded-xl ${isDark?'bg-slate-800':'bg-slate-100'}`}>
                            <p className="text-xs opacity-60 mb-1">Z_new = Z_old × (S_new/S_old) × (V_old/V_new)²</p>
                            <p className="font-mono font-bold text-lg text-blue-500">{zConverted.toFixed(4)} pu</p>
                            <p className="text-xs opacity-60 mt-1">= {equipZ} × ({sBase}/{equipMVA}) × ({equipV}/{vBase})²</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================== GUIDE ==============================
const GuideModule = ({isDark}:{isDark:boolean}) => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><HelpCircle className="w-6 h-6 text-blue-500"/></div><div><h2 className="text-2xl font-black">User Guide</h2><p className="text-sm opacity-60">Per-Unit System Calculator</p></div></div>
        {[
            {s:'1',t:'Set System Base',d:'Choose S_base (typically 100 MVA for system studies) and V_base (the nominal voltage at the point of interest). Z_base and I_base are automatically calculated.'},
            {s:'2',t:'Enter Actual Values',d:'Input the actual voltage (kV), current (A), and impedance (Ω) you want to convert. The calculator shows the per-unit equivalent for each.'},
            {s:'3',t:'Equipment Conversion',d:'To convert a transformer or generator impedance from its own nameplate base to the system base, enter the equipment rating and its per-unit impedance. The formula Z_new = Z_old × (S_new/S_old) × (V_old/V_new)² is applied automatically.'},
            {s:'4',t:'Read the Diagram',d:'The diagram shows how the 4 base quantities relate. S_base and V_base are your chosen inputs (amber/blue). Z_base and I_base are derived quantities (green/purple).'},
        ].map(i=>(<div key={i.s} className={`flex gap-4 p-5 rounded-xl border ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">{i.s}</div><div><h4 className="font-bold">{i.t}</h4><p className="text-sm opacity-70 mt-1">{i.d}</p></div></div>))}
    </div>
);

// ============================== QUIZ ==============================
const QuizModule = ({isDark}:{isDark:boolean}) => {
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
export default function PerUnitCalc() {
    const [activeTab,setActiveTab]=useState('simulator');
    const isDark=useThemeObserver();
    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };
    const tabs=[{id:'theory',label:'Reference',icon:<Book className="w-4 h-4"/>},{id:'simulator',label:'Calculator',icon:<MonitorPlay className="w-4 h-4"/>},{id:'guide',label:'Guide',icon:<GraduationCap className="w-4 h-4"/>},{id:'quiz',label:'Quiz',icon:<Award className="w-4 h-4"/>}];
    return (
        <div className={`h-screen flex flex-col font-sans ${isDark?'bg-slate-950 text-slate-200':'bg-slate-50 text-slate-800'}`}>
            <SEO title="Per-Unit Calculator" description="Per-unit system calculator with base conversion, equipment impedance conversion, and interactive diagram." url="/per-unit"/>
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-2 rounded-lg text-white shadow-lg shadow-teal-500/20"><Calculator className="w-5 h-5"/></div><div><h1 className={`font-black text-lg ${isDark?'text-white':'text-slate-900'}`}>Per<span className="text-teal-500">Unit</span></h1><span className="text-[10px] font-bold uppercase tracking-widest text-teal-500/80">System Calculator</span></div></div>
                <div className={`hidden md:flex p-1 rounded-xl border mx-4 ${isDark?'bg-slate-950 border-slate-800':'bg-slate-100 border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold ${activeTab===t.id?(isDark?'bg-slate-800 text-teal-400':'bg-white text-teal-600'):'opacity-60'}`}>{t.icon}<span>{t.label}</span></button>))}</div><button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>
            </header>
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex justify-around items-center ${isDark?'bg-slate-900 border-slate-800':'bg-white border-slate-200'}`}>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex flex-col items-center w-full h-full gap-1 justify-center text-[10px] font-bold ${activeTab===t.id?(isDark?'text-teal-400':'text-teal-600'):'opacity-50'}`}>{t.icon}<span>{t.label}</span></button>))}</div>
            <div className="flex-1 overflow-hidden relative pb-16 md:pb-0">
                {activeTab==='theory'&&<TheoryLibrary title="Per-Unit System Handbook" description="Comprehensive guide to the per-unit system used in power system analysis, base conversions, and impedance normalization." sections={PER_UNIT_THEORY_CONTENT}/>}
                <div className={activeTab==='simulator'?'block h-full overflow-y-auto':'hidden'}><SimulatorModule isDark={isDark}/></div>
                {activeTab==='guide'&&<div className="h-full overflow-y-auto"><GuideModule isDark={isDark}/></div>}
                {activeTab==='quiz'&&<div className="h-full overflow-y-auto"><QuizModule isDark={isDark}/></div>}
            </div>
        </div>
    );
}
