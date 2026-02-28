import { MathBlock, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryFlowDiagram, TheoryTimeline } from '../../components/TheoryDiagrams';
import { ShieldCheck, Activity, BookOpen, Layers, Zap, AlertTriangle } from 'lucide-react';

export const BUSBAR_PROTECTION_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Busbar Differential Protection (87B)",
        subtitle: "The Most Critical Zone",
        icon: ShieldCheck,
        content: (
            <>
                <p>The busbar is the electrical hub where multiple circuits connect. A bus fault affects <strong>every circuit connected to it</strong>, making fast clearance essential. A bus fault not cleared in 100ms can cause widespread system instability.</p>
                <MathBlock formula="I_{diff} = |\\sum_{k=1}^{n} I_k| \\approx 0 \\quad \\text{(normal)}" legend={[["I_k", "Current at each circuit connected to the bus"], ["n", "Number of circuits (feeders, generators, transformers)"]]} />
                <Hazard><strong>Critical:</strong> CT saturation on one circuit creates a false differential current. Bus differential relays must be extremely secure against CT saturation to prevent false tripping — which would blackout the entire bus.</Hazard>
            </>
        )
    },
    {
        id: 'low-impedance',
        title: "2. Low-Impedance vs High-Impedance 87B",
        subtitle: "Two Philosophies",
        icon: Layers,
        content: (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Low-Impedance (Numerical)</h4>
                        <p className="text-xs text-slate-500">Uses advanced algorithms (e.g., percent restraint). Flexible: zones can be dynamically reconfigured. Requires matched CTs per circuit. Used in modern substations.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-2">High-Impedance</h4>
                        <p className="text-xs text-slate-500">Simple, proven, extremely fast (&lt;1 cycle). All CTs must have identical ratio and class. The relay is connected as a high-impedance voltage element across the CT paralleled secondaries.</p>
                    </div>
                </div>
                <ProTip><strong>Check Zone Flexibility:</strong> Low-impedance 87B allows dynamic zone reconfiguration (adding/removing circuits) via settings. High-impedance schemes require wiring changes. Modern substations overwhelmingly use low-impedance numerical bus protection.</ProTip>
            </>
        )
    },
    {
        id: 'standards',
        title: "3. Standards & References",
        icon: BookOpen,
        content: (
            <>
                <StandardRef code="IEEE C37.234" title="Guide for Protective Relay Applications to Power System Buses" />
                <StandardRef code="IEC 60255-121" title="Distance and Bus Differential Protection Functions" />
                <StandardRef code="IEEE C37.110" title="Guide for CT Application (Critical for 87B)" />
            </>
        )
    }
];
