import { MathBlock, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryFlowDiagram, TheoryTimeline } from '../../components/TheoryDiagrams';
import { ShieldCheck, Activity, BookOpen, Zap, AlertTriangle, Settings } from 'lucide-react';

export const GENERATOR_PROTECTION_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Generator Protection Suite",
        subtitle: "The Most Protected Asset (IEEE C37.102)",
        icon: ShieldCheck,
        content: (
            <>
                <p>A large generator is the single most expensive asset in a power system and has the most comprehensive protection suite — up to <strong>20+ ANSI functions</strong>.</p>
                <div className="overflow-x-auto my-4">
                    <table className="w-full text-sm border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold"><tr><th className="p-3 text-left">ANSI</th><th className="p-3 text-left">Function</th><th className="p-3 text-left">Protects Against</th></tr></thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr><td className="p-3 font-bold">87G</td><td className="p-3">Generator Differential</td><td className="p-3 text-xs">Internal stator faults</td></tr>
                            <tr><td className="p-3 font-bold">40</td><td className="p-3">Loss of Field</td><td className="p-3 text-xs">Excitation system failure</td></tr>
                            <tr><td className="p-3 font-bold">32</td><td className="p-3">Reverse Power</td><td className="p-3 text-xs">Turbine failure — gen motoring</td></tr>
                            <tr><td className="p-3 font-bold">46</td><td className="p-3">Negative Sequence</td><td className="p-3 text-xs">Unbalanced load / open phase</td></tr>
                            <tr><td className="p-3 font-bold">64</td><td className="p-3">Stator Ground Fault</td><td className="p-3 text-xs">Insulation breakdown</td></tr>
                            <tr><td className="p-3 font-bold">24</td><td className="p-3">V/Hz Overexcitation</td><td className="p-3 text-xs">Core saturation</td></tr>
                            <tr><td className="p-3 font-bold">21</td><td className="p-3">Backup Distance</td><td className="p-3 text-xs">External fault backup</td></tr>
                        </tbody>
                    </table>
                </div>
                <Hazard><strong>Loss of Field (40):</strong> If excitation is lost, the generator absorbs reactive power from the grid, operating as an induction generator. This causes <strong>rapid rotor overheating</strong> and risks damage to the prime mover coupling.</Hazard>
            </>
        )
    },
    {
        id: 'loss-of-field',
        title: "2. Loss of Field (40)",
        subtitle: "The R-X Admittance Circle",
        icon: Activity,
        content: (
            <>
                <p>Loss of excitation causes the apparent impedance (as seen by the relay at gen terminals) to enter a specific region of the R-X plane. The relay uses <strong>two offset mho circles</strong> centered on the negative X-axis.</p>
                <MathBlock formula="\\text{Circle 1: diameter} = X_d' \\quad \\text{(transient reactance)}" legend={[["X_d'", "Generator transient reactance (fast detection)"]]} />
                <MathBlock formula="\\text{Circle 2: diameter} = X_d \\quad \\text{(synchronous reactance)}" legend={[["X_d", "Generator synchronous reactance (secure detection)"]]} />
                <ProTip><strong>Coordination:</strong> Circle 1 (smaller, faster) provides fast tripping. Circle 2 (larger, slower — typically 1-2s delay) provides security against stable power swings entering the loss-of-field zone.</ProTip>
            </>
        )
    },
    {
        id: 'standards',
        title: "3. Standards & References",
        icon: BookOpen,
        content: (
            <>
                <StandardRef code="IEEE C37.102" title="Guide for AC Generator Protection" />
                <StandardRef code="IEEE C50.13" title="Cylindrical-Rotor Synchronous Generators" />
                <StandardRef code="IEC 60034-1" title="Rotating Electrical Machines — Rating" />
                <StandardRef code="IEEE C37.106" title="Guide for Abnormal Frequency Protection of Power Generating Plants" />
            </>
        )
    }
];
