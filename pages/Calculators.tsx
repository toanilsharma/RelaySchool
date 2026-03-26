import React, { useState } from 'react';
import { Calculator, ArrowRight, Zap, RefreshCw, Equal } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import PageSEO from "../components/SEO/PageSEO";

// Complex Number Helper
class Complex {
    constructor(public r: number, public i: number) {}
    add(c: Complex) { return new Complex(this.r + c.r, this.i + c.i); }
    sub(c: Complex) { return new Complex(this.r - c.r, this.i - c.i); }
    mul(c: Complex) { return new Complex(this.r * c.r - this.i * c.i, this.r * c.i + this.i * c.r); }
    div(c: Complex) {
        const den = c.r * c.r + c.i * c.i;
        return new Complex((this.r * c.r + this.i * c.i) / den, (this.i * c.r - this.r * c.i) / den);
    }
    scale(s: number) { return new Complex(this.r * s, this.i * s); }
    mag() { return Math.sqrt(this.r * this.r + this.i * this.i); }
    ang() { return Math.atan2(this.i, this.r) * 180 / Math.PI; }
    toPolStr() { return `${this.mag().toFixed(2)}\\angle ${this.ang().toFixed(2)}^\\circ`; }
    toRectStr() { return `${this.r.toFixed(2)}${this.i >= 0 ? '+' : ''}${this.i.toFixed(2)}j`; }
    static fromPolar(mag: number, angDeg: number) {
        const rad = angDeg * Math.PI / 180;
        return new Complex(mag * Math.cos(rad), mag * Math.sin(rad));
    }
}

const a = Complex.fromPolar(1, 120);
const a2 = Complex.fromPolar(1, 240);
const aStr = `1\\angle 120^\\circ`;
const a2Str = `1\\angle 240^\\circ`;

const SymmetricalComponents = () => {
    const [vaMag, setVaMag] = useState(1.0);
    const [vaAng, setVaAng] = useState(0);
    const [vbMag, setVbMag] = useState(1.0);
    const [vbAng, setVbAng] = useState(-120);
    const [vcMag, setVcMag] = useState(1.0);
    const [vcAng, setVcAng] = useState(120);

    const Va = Complex.fromPolar(vaMag, vaAng);
    const Vb = Complex.fromPolar(vbMag, vbAng);
    const Vc = Complex.fromPolar(vcMag, vcAng);

    const V0 = Va.add(Vb).add(Vc).scale(1 / 3);
    const V1 = Va.add(a.mul(Vb)).add(a2.mul(Vc)).scale(1 / 3);
    const V2 = Va.add(a2.mul(Vb)).add(a.mul(Vc)).scale(1 / 3);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-blue-500" /> Symmetrical Components Calculator
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* INPUTS */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">Phase Inputs</h4>
                    
                    <div className="flex gap-4 items-center">
                        <span className="w-8 font-bold text-slate-900 dark:text-white">Va = </span>
                        <input type="number" min="0" step="0.1" value={vaMag} onChange={e => setVaMag(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1 text-slate-900 dark:text-white" />
                        <span className="text-slate-500">&ang;</span>
                        <input type="number" min="0" step="1" value={vaAng} onChange={e => setVaAng(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1 text-slate-900 dark:text-white" />
                        <span className="text-slate-500">&deg;</span>
                    </div>

                    <div className="flex gap-4 items-center">
                        <span className="w-8 font-bold text-slate-900 dark:text-white">Vb = </span>
                        <input type="number" min="0" step="0.1" value={vbMag} onChange={e => setVbMag(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1 text-slate-900 dark:text-white" />
                        <span className="text-slate-500">&ang;</span>
                        <input type="number" min="0" step="1" value={vbAng} onChange={e => setVbAng(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1 text-slate-900 dark:text-white" />
                        <span className="text-slate-500">&deg;</span>
                    </div>

                    <div className="flex gap-4 items-center">
                        <span className="w-8 font-bold text-slate-900 dark:text-white">Vc = </span>
                        <input type="number" min="0" step="0.1" value={vcMag} onChange={e => setVcMag(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1 text-slate-900 dark:text-white" />
                        <span className="text-slate-500">&ang;</span>
                        <input type="number" min="0" step="1" value={vcAng} onChange={e => setVcAng(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1 text-slate-900 dark:text-white" />
                        <span className="text-slate-500">&deg;</span>
                    </div>
                </div>

                {/* OUTPUTS */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">Sequence Outputs</h4>
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
                        <div>
                            <span className="font-bold text-slate-500">Zero (V0): </span>
                            <span className="text-slate-900 dark:text-white font-bold">{V0.mag().toFixed(3)}&ang;{V0.ang().toFixed(1)}&deg;</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-500">Positive (V1): </span>
                            <span className="text-slate-900 dark:text-white font-bold">{V1.mag().toFixed(3)}&ang;{V1.ang().toFixed(1)}&deg;</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-500">Negative (V2): </span>
                            <span className="text-slate-900 dark:text-white font-bold">{V2.mag().toFixed(3)}&ang;{V2.ang().toFixed(1)}&deg;</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* STEP-BY-STEP MATH */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Step-by-Step Working Out</h4>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-sm sm:text-base">
                    <BlockMath math={`\\begin{bmatrix} V_0 \\\\ V_1 \\\\ V_2 \\end{bmatrix} = \\frac{1}{3} \\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & a & a^2 \\\\ 1 & a^2 & a \\end{bmatrix} \\begin{bmatrix} V_a \\\\ V_b \\\\ V_c \\end{bmatrix}`} />
                    
                    <div className="my-6 border-b border-slate-200 dark:border-slate-800 border-dashed" />

                    <BlockMath math={`V_1 = \\frac{1}{3} (V_a + a \\cdot V_b + a^2 \\cdot V_c)`} />
                    <BlockMath math={`V_1 = \\frac{1}{3} (${Va.toPolStr()} + (${aStr}) \\cdot (${Vb.toPolStr()}) + (${a2Str}) \\cdot (${Vc.toPolStr()}))`} />
                    <BlockMath math={`V_1 = \\frac{1}{3} (${Va.toPolStr()} + ${a.mul(Vb).toPolStr()} + ${a2.mul(Vc).toPolStr()})`} />
                    <BlockMath math={`V_1 = \\frac{1}{3} ((${Va.toRectStr()}) + (${a.mul(Vb).toRectStr()}) + (${a2.mul(Vc).toRectStr()}))`} />
                    <BlockMath math={`V_1 = \\frac{1}{3} (${Va.add(a.mul(Vb)).add(a2.mul(Vc)).toRectStr()})`} />
                    <BlockMath math={`V_1 = ${V1.toRectStr()} \\quad \\rightarrow \\quad V_1 = ${V1.toPolStr()}`} />
                </div>
            </div>
        </div>
    );
};

const ImpedanceBaseConversion = () => {
    const [zOldPu, setZOldPu] = useState(0.1);
    const [kvOld, setKvOld] = useState(132);
    const [mvaOld, setMvaOld] = useState(100);
    const [kvNew, setKvNew] = useState(132);
    const [mvaNew, setMvaNew] = useState(50);

    const Z_new = zOldPu * Math.pow(kvOld / kvNew, 2) * (mvaNew / mvaOld);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-purple-500" /> Impedance Base Conversion
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">Old Base</h4>
                    <div className="flex gap-4 items-center">
                        <span className="w-16 font-bold text-slate-900 dark:text-white">Z (p.u.)</span>
                        <input type="number" min="0" step="0.01" value={zOldPu} onChange={e => setZOldPu(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white" />
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="w-16 font-bold text-slate-900 dark:text-white">kV </span>
                        <input type="number" min="0" step="1" value={kvOld} onChange={e => setKvOld(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white" />
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="w-16 font-bold text-slate-900 dark:text-white">MVA </span>
                        <input type="number" min="0" step="1" value={mvaOld} onChange={e => setMvaOld(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">New Base</h4>
                    <div className="flex gap-4 items-center">
                        <span className="w-16 font-bold text-slate-900 dark:text-white">kV </span>
                        <input type="number" min="0" step="1" value={kvNew} onChange={e => setKvNew(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white" />
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="w-16 font-bold text-slate-900 dark:text-white">MVA </span>
                        <input type="number" min="0" step="1" value={mvaNew} onChange={e => setMvaNew(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white" />
                    </div>

                    <div className="mt-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-sm font-bold text-slate-500 uppercase block mb-1">New Impedance (p.u.)</span>
                        <span className="text-2xl text-purple-600 dark:text-purple-400 font-bold font-mono">{Z_new.toFixed(5)} p.u.</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Step-by-Step Working Out</h4>
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-sm sm:text-base">
                    <BlockMath math={`Z_{new} = Z_{old} \\times \\left( \\frac{kV_{old}}{kV_{new}} \\right)^2 \\times \\left( \\frac{MVA_{new}}{MVA_{old}} \\right)`} />
                    <div className="my-6 border-b border-slate-200 dark:border-slate-800 border-dashed" />
                    <BlockMath math={`Z_{new} = ${zOldPu} \\times \\left( \\frac{${kvOld}}{${kvNew}} \\right)^2 \\times \\left( \\frac{${mvaNew}}{${mvaOld}} \\right)`} />
                    <BlockMath math={`Z_{new} = ${zOldPu} \\times ${Math.pow(kvOld/kvNew, 2).toFixed(4)} \\times ${(mvaNew/mvaOld).toFixed(4)}`} />
                    <BlockMath math={`Z_{new} = ${Z_new.toFixed(5)} \\text{ p.u.}`} />
                </div>
            </div>
        </div>
    );
};

export default function Calculators() {
    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
            <PageSEO 
                title="Engineering Mathematical Solvers | RelaySchool"
                description="Interactive solvers for symmetrical components, impedance base conversion, and complex power system calculations."
                url="/calculators"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "RelaySchool Engineering Calculators",
                    "applicationCategory": "EngineeringApplication",
                    "description": "A suite of professional calculators for relay protection and power system engineering."
                }}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Calculator className="w-8 h-8 text-blue-600" /> Math Solvers
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Interactive, step-by-step calculators for complex power system mathematics.
                    </p>
                </div>
            </div>

            <SymmetricalComponents />
            
            <ImpedanceBaseConversion />
        </div>
    );
}
