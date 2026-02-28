import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryFlowDiagram, TheoryTimeline, TheoryWaveform } from '../../components/TheoryDiagrams';
import { ShieldCheck, Activity, Sliders, AlertTriangle, BookOpen, Compass, Settings, Zap } from 'lucide-react';

export const GROUND_FAULT_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Ground Fault Protection",
        subtitle: "Detecting Earth Faults (50N/51N/67N/87N)",
        icon: ShieldCheck,
        content: (
            <>
                <p>Ground faults (earth faults) are the most common type of fault in power systems, accounting for <strong>70-80% of all faults</strong>. They occur when one or more phase conductors make contact with ground.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Non-Directional (50N/51N)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Measures residual current (3I₀). Trips regardless of fault direction. Used on radial feeders.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">Directional (67N)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Uses zero-sequence voltage (3V₀) as polarizing reference. Required for parallel feeders and ring networks.</p>
                    </div>
                </div>
                <MathBlock
                    formula="3I_0 = I_A + I_B + I_C \\quad (\\text{Zero Sequence = Residual Current})"
                    legend={[["3I_0", "Residual (earth fault) current measured by CT summation or core-balance CT"]]}
                />
                <Hazard><strong>High-Impedance Faults:</strong> Faults through tree contacts, dry soil, or concrete may produce very low fault currents (&lt;5A). Standard overcurrent relays cannot detect them. Sensitive earth fault (SEF) settings or specialized detectors are required.</Hazard>
            </>
        )
    },
    {
        id: 'directional',
        title: "2. Directional Earth Fault (67N)",
        subtitle: "Cos/Sin Mode & Polarization",
        icon: Compass,
        content: (
            <>
                <p>The directional element uses zero-sequence voltage (<InlineMath math="3V_0 = V_A + V_B + V_C" />) as the polarizing reference. The relay compares the angle between <InlineMath math="3I_0" /> and <InlineMath math="3V_0" /> to determine fault direction.</p>
                <div className="overflow-x-auto my-6">
                    <table className="w-full text-sm text-center border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold"><tr><th className="p-3 text-left">Mode</th><th className="p-3">Torque Equation</th><th className="p-3 text-left">Best For</th></tr></thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr><td className="p-3 text-left font-bold text-blue-600">Cos Mode</td><td className="p-3 font-mono">T ∝ |3V₀| × |3I₀| × cos(θ)</td><td className="p-3 text-left text-xs">Solidly grounded systems. Forward = 0° characteristic angle.</td></tr>
                            <tr><td className="p-3 text-left font-bold text-emerald-600">Sin Mode</td><td className="p-3 font-mono">T ∝ |3V₀| × |3I₀| × sin(θ)</td><td className="p-3 text-left text-xs">Resistance grounded systems. Forward = 90° characteristic angle.</td></tr>
                        </tbody>
                    </table>
                </div>
                <TheoryWaveform title="Zero-Sequence Voltage and Current During Ground Fault" waves={[
                    { label: '3V₀ (Polarizing)', color: '#64748b', amplitude: 1.0, phase: 0 },
                    { label: '3I₀ Forward', color: '#3b82f6', amplitude: 1.5, phase: -10 },
                    { label: '3I₀ Reverse', color: '#ef4444', amplitude: 1.5, phase: 170 },
                ]} duration={0.06} />
            </>
        )
    },
    {
        id: 'ref',
        title: "3. Restricted Earth Fault (87N/64)",
        subtitle: "High-Speed Zone Protection",
        icon: Activity,
        content: (
            <>
                <p>REF is a <strong>differential protection element</strong> that compares the neutral current with the residual current of the phase CTs. It provides very fast, sensitive protection for ground faults within a defined zone (transformer winding, generator stator).</p>
                <MathBlock formula="I_{diff} = |I_N - (I_A + I_B + I_C)|" legend={[["I_N", "Neutral CT current"], ["I_A+I_B+I_C", "Residual from phase CTs"]]} />
                <ProTip><strong>Key Advantage:</strong> REF can detect faults very close to the transformer neutral — where the fault current is so low that the 87T differential element may not detect it. REF provides coverage for <strong>95%+ of the winding</strong>.</ProTip>
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
                <StandardRef code="IEEE C37.112" title="Standard Inverse-Time Characteristic Equations for Overcurrent Relays" />
                <StandardRef code="IEC 60255-151" title="Overcurrent Protection Functions (includes Ground Fault)" />
                <StandardRef code="IEEE C62.92" title="Guide for the Application of Neutral Grounding" />
                <StandardRef code="IEC 60255-121" title="Distance Protection Functions (includes Ground Distance)" />
            </>
        )
    }
];
