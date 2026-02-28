import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram, TheoryTimeline } from '../../components/TheoryDiagrams';
import { ShieldCheck, Activity, Sliders, AlertTriangle, BookOpen, Cpu, Settings, Zap } from 'lucide-react';

export const CT_VT_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. CT & VT Fundamentals",
        subtitle: "The Eyes of the Protection System",
        icon: ShieldCheck,
        content: (
            <>
                <p>Current Transformers (CTs) and Voltage Transformers (VTs) are the <strong>sensing elements</strong> of every protection scheme. They translate primary high-voltage/high-current quantities into safe secondary values for relay measurement.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Current Transformer (CT)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Steps down primary current to secondary (typically 1A or 5A). Connected in <strong>series</strong> with the power circuit. Must NEVER be open-circuited while energized.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-2">Voltage Transformer (VT/PT)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Steps down primary voltage to secondary (typically 110V or 120V). Connected in <strong>parallel</strong>. Must NEVER be short-circuited on secondary.</p>
                    </div>
                </div>
                <MathBlock
                    formula="n = \\frac{I_{primary}}{I_{secondary}} = \\frac{N_2}{N_1}"
                    legend={[["n", "CT ratio (e.g., 800/5 = 160)"], ["N_1, N_2", "Primary and secondary turns"]]}
                />
                <Hazard><strong>DANGER:</strong> Never open-circuit a live CT secondary. The full magnetizing flux produces lethal voltages (thousands of volts) at the secondary terminals. Always use test blocks with shorting links.</Hazard>
            </>
        )
    },
    {
        id: 'burden',
        title: "2. Burden Calculation",
        subtitle: "Can This CT Drive the Relay?",
        icon: Cpu,
        content: (
            <>
                <p>The <strong>burden</strong> is the total impedance connected to the CT secondary: relay + lead resistance + CT winding resistance. If the burden is too high, the CT saturates and produces distorted output.</p>
                <MathBlock
                    formula="Z_{burden} = Z_{relay} + Z_{leads} + Z_{CT\\_winding}"
                    legend={[
                        ["Z_{relay}", "Relay burden (VA/I² or ohms)"],
                        ["Z_{leads}", "2 × ρ × L / A (cable impedance, two-way)"],
                        ["Z_{CT\\_winding}", "CT secondary winding resistance"],
                    ]}
                />
                <MathBlock
                    formula="V_K \\geq I_F \\times \\frac{Z_{burden}}{\\text{CT Ratio}} \\times K_{safety}"
                    legend={[
                        ["V_K", "Required knee-point voltage"],
                        ["I_F", "Maximum fault current (primary)"],
                        ["K_{safety}", "Safety factor (typically 1.5 – 2.0)"],
                    ]}
                />
                <ProTip><strong>Rule of Thumb:</strong> For protection CTs, the knee-point voltage should be at least <strong>2× the voltage developed across the burden at maximum fault current</strong>. For differential CTs (87T/87B), use a safety factor of 3–4× to prevent sympathetic CT saturation.</ProTip>
            </>
        )
    },
    {
        id: 'accuracy',
        title: "3. Accuracy Classes",
        subtitle: "Metering vs Protection",
        icon: Activity,
        content: (
            <>
                <div className="overflow-x-auto my-4">
                    <table className="w-full text-sm text-center border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold"><tr><th className="p-3 text-left">Standard</th><th className="p-3">Class</th><th className="p-3">Application</th><th className="p-3 text-left">Key Feature</th></tr></thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr><td className="p-3 text-left font-bold">IEEE C57.13</td><td className="p-3">C200, C400, C800</td><td className="p-3">Protection</td><td className="p-3 text-left text-xs">C-class. Number = max burden voltage at 20× rated current without exceeding 10% error.</td></tr>
                            <tr><td className="p-3 text-left font-bold">IEEE C57.13</td><td className="p-3">0.3, 0.6, 1.2</td><td className="p-3">Metering</td><td className="p-3 text-left text-xs">Accuracy at 100% rated current. NOT for protection.</td></tr>
                            <tr><td className="p-3 text-left font-bold">IEC 61869-2</td><td className="p-3">5P, 10P</td><td className="p-3">Protection</td><td className="p-3 text-left text-xs">P = protection. 5P20 means 5% error at 20× rated current.</td></tr>
                            <tr><td className="p-3 text-left font-bold">IEC 61869-2</td><td className="p-3">PX, TPX</td><td className="p-3">Differential</td><td className="p-3 text-left text-xs">Defines knee-point voltage and magnetizing current directly.</td></tr>
                        </tbody>
                    </table>
                </div>
            </>
        )
    },
    {
        id: 'standards',
        title: "4. Standards & References",
        subtitle: "Governing Documents",
        icon: BookOpen,
        content: (
            <>
                <StandardRef code="IEEE C57.13" title="Standard Requirements for Instrument Transformers" />
                <StandardRef code="IEC 61869-2" title="Instrument Transformers — Current Transformers" />
                <StandardRef code="IEC 61869-3" title="Instrument Transformers — Voltage Transformers" />
                <StandardRef code="IEEE C37.110" title="Guide for the Application of CTs Used for Protective Relaying" />
            </>
        )
    }
];
