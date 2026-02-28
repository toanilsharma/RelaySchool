import { MathBlock, InlineMath, StandardRef, ProTip } from '../../components/TheoryComponents';
import { TheoryFlowDiagram } from '../../components/TheoryDiagrams';
import { ShieldCheck, Activity, BookOpen, Calculator, Settings } from 'lucide-react';

export const PER_UNIT_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. The Per-Unit System",
        subtitle: "Why Engineers Love Per-Unit",
        icon: ShieldCheck,
        content: (
            <>
                <p>The per-unit (pu) system normalizes power system quantities to a common base, eliminating the confusion of multiple voltage levels and transformer ratios. A quantity of <strong>1.0 pu = rated value</strong>.</p>
                <MathBlock
                    formula="X_{pu} = \\frac{X_{actual}}{X_{base}}"
                    legend={[["X_{pu}", "Per-unit value"], ["X_{actual}", "Actual value (Ω, A, V, VA)"], ["X_{base}", "Base value at the chosen MVA/kV base"]]}
                />
                <MathBlock
                    formula="Z_{base} = \\frac{kV_{base}^2}{MVA_{base}} \\quad (\\Omega)"
                    legend={[["Z_{base}", "Base impedance in ohms"], ["kV_{base}", "Base voltage (line-to-line)"], ["MVA_{base}", "Base power"]]}
                />
                <ProTip><strong>Key Insight:</strong> In per-unit, transformer turns ratios disappear. A 10% impedance transformer is 0.10 pu regardless of whether it's 11/132kV or 33/400kV. This simplifies fault calculations enormously.</ProTip>
            </>
        )
    },
    {
        id: 'conversion',
        title: "2. Base Conversion",
        subtitle: "Changing MVA and kV Bases",
        icon: Calculator,
        content: (
            <>
                <p>When combining equipment with different ratings on a common system base, impedances must be converted:</p>
                <MathBlock
                    formula="Z_{pu}^{new} = Z_{pu}^{old} \\times \\frac{MVA_{base}^{new}}{MVA_{base}^{old}} \\times \\left(\\frac{kV_{base}^{old}}{kV_{base}^{new}}\\right)^2"
                    legend={[["Z_{pu}^{new}", "Impedance on the new base"], ["MVA_{base}^{new}", "New base MVA"], ["kV_{base}^{new}", "New base voltage"]]}
                />
            </>
        )
    },
    {
        id: 'standards',
        title: "3. Standards & References",
        subtitle: "Governing Documents",
        icon: BookOpen,
        content: (
            <>
                <StandardRef code="IEEE 141 (Red Book)" title="Recommended Practice for Electric Power Distribution for Industrial Plants" />
                <StandardRef code="IEC 60909" title="Short-circuit Currents in Three-phase AC Systems" />
                <StandardRef code="IEEE 3002.2" title="Recommended Practice for Conducting Load-Flow Studies" />
            </>
        )
    }
];
