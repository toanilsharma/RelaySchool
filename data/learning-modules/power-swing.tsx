import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram, TheoryTimeline, TheoryWaveform } from '../../components/TheoryDiagrams';
import { ShieldCheck, TrendingUp, Activity, Sliders, Zap, AlertTriangle, BookOpen, Radar, Settings, BarChart3 } from 'lucide-react';

export const POWER_SWING_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Power Swing Fundamentals",
        subtitle: "When Generators Lose Synchronism (ANSI 78)",
        icon: ShieldCheck,
        content: (
            <>
                <p>A <strong>power swing</strong> occurs when the rotor angles of generators oscillate following a large disturbance (fault clearance, loss of generation, sudden load change). The apparent impedance measured by a distance relay <strong>swings across the R-X plane</strong>.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-5 rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">Stable Swing</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Generators oscillate but return to synchronism. The impedance locus swings <em>through</em> relay zones but moves slowly. The relay should <strong>NOT trip</strong> (power swing blocking).</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Out-of-Step (OOS)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Generators lose synchronism completely. The angle between systems exceeds 180° and keeps increasing. The relay <strong>MUST trip</strong> (controlled separation) to prevent equipment damage.</p>
                    </div>
                </div>
                <MathBlock
                    formula="Z_{apparent} = \\frac{V}{I} = Z_S + \\frac{Z_L}{1 - \\frac{E_R}{E_S} e^{j\\delta}}"
                    legend={[
                        ["Z_{apparent}", "Impedance seen by the relay during a swing"],
                        ["\\delta", "Angle between generator rotors (changes with time)"],
                        ["Z_S, Z_L", "Source and line impedances"],
                    ]}
                />
            </>
        )
    },
    {
        id: 'impedance-locus',
        title: "2. The Impedance Locus",
        subtitle: "What the Relay Sees on the R-X Plane",
        icon: Radar,
        content: (
            <>
                <p>As the rotor angle δ changes over time, the apparent impedance Z traces a path on the R-X plane. For equal source voltages (E_S = E_R), the locus is a <strong>straight vertical line</strong> (the electrical center). For unequal voltages, it becomes a <strong>circle</strong>.</p>
                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Key Observations</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300 my-4">
                    <li><strong>Speed of traverse:</strong> A fault clears in &lt;100ms. A power swing takes <strong>200ms to several seconds</strong> to cross the same zone. This time difference is the basis for PSB detection.</li>
                    <li><strong>Direction:</strong> During a fault, the impedance jumps instantly to the fault point. During a swing, it moves continuously along the locus.</li>
                    <li><strong>Blinder zones:</strong> Two parallel impedance boundaries (inner and outer) are placed on the R-X plane. The time it takes for the locus to cross from outer to inner determines if it's a swing or a fault.</li>
                </ul>
                <TheoryFlowDiagram
                    title="Power Swing Detection: Blinder Method"
                    blocks={[
                        { id: 'outer', label: 'Outer Blinder', sub: 'Z enters outer zone', color: '#3b82f6' },
                        { id: 'timer', label: 'Timer Start', sub: 'Count Δt', color: '#f59e0b' },
                        { id: 'inner', label: 'Inner Blinder', sub: 'Z enters inner zone', color: '#8b5cf6' },
                        { id: 'decide', label: 'Δt > Setting?', sub: 'Swing vs Fault', color: '#64748b' },
                        { id: 'psb', label: 'PSB (Block)', sub: 'Stable Swing', color: '#10b981' },
                        { id: 'oos', label: 'OOS Trip', sub: 'Lost Sync', color: '#ef4444' },
                    ]}
                    arrows={[
                        { from: 'outer', to: 'timer', label: 'Enter' },
                        { from: 'timer', to: 'inner', label: 'Wait' },
                        { from: 'inner', to: 'decide', label: 'Check' },
                        { from: 'decide', to: 'psb', label: 'Δt > Set' },
                        { from: 'decide', to: 'oos', label: 'δ > 180°' },
                    ]}
                />
            </>
        )
    },
    {
        id: 'psb-oos',
        title: "3. PSB vs. OOS Tripping",
        subtitle: "When to Block, When to Trip",
        icon: AlertTriangle,
        content: (
            <>
                <h4 className="font-bold text-lg mt-2 text-slate-800 dark:text-slate-200">Power Swing Blocking (PSB)</h4>
                <p className="mb-4">During a <strong>stable swing</strong>, the impedance locus enters and exits the relay zones slowly. PSB <strong>blocks the distance relay (21)</strong> from tripping to prevent unnecessary line disconnection. Without PSB, Zone 1 or Zone 2 could trip during every post-fault swing.</p>
                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Out-of-Step Tripping (OOS Trip)</h4>
                <p className="mb-4">If the angle δ exceeds 180° (half-slip), the generators are no longer synchronized. The system must be <strong>intentionally separated</strong> at predetermined points to prevent:</p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300 my-4">
                    <li>Generator shaft damage from torsional stress</li>
                    <li>Transformer core saturation from DC current flow</li>
                    <li>Uncontrolled cascading outages</li>
                </ul>
                <Hazard>
                    <strong>Critical Decision:</strong> OOS trip should be set at <strong>controlled separation points</strong> — typically at specific tie lines between regions, NOT at generator terminals. This ensures each island has adequate generation-load balance.
                </Hazard>
            </>
        )
    },
    {
        id: 'settings',
        title: "4. Settings & Blinder Configuration",
        subtitle: "Inner Zone, Outer Zone, Timer",
        icon: Sliders,
        content: (
            <>
                <div className="overflow-x-auto my-4">
                    <table className="w-full text-sm border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr><th className="p-3 text-left">Parameter</th><th className="p-3">Typical Value</th><th className="p-3 text-left">Notes</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr><td className="p-3 font-bold">Outer Blinder</td><td className="p-3 font-mono">120% of Zone 3</td><td className="p-3 text-xs">Must encompass all distance zones to be protected</td></tr>
                            <tr><td className="p-3 font-bold">Inner Blinder</td><td className="p-3 font-mono">110% of Zone 1</td><td className="p-3 text-xs">Just outside the fastest-tripping zone</td></tr>
                            <tr><td className="p-3 font-bold">PSB Timer</td><td className="p-3 font-mono">30 – 60 ms</td><td className="p-3 text-xs">Time for locus to cross from outer to inner. Faults: &lt;10ms. Swings: &gt;40ms.</td></tr>
                            <tr><td className="p-3 font-bold">OOS Trip Angle</td><td className="p-3 font-mono">90° – 120°</td><td className="p-3 text-xs">Trip when angle exceeds this on the way to 180°</td></tr>
                        </tbody>
                    </table>
                </div>
                <ProTip>
                    <strong>Modern Approach:</strong> Some advanced relays use <strong>continuous impedance tracking</strong> (rate-of-change of impedance) instead of simple blinders. This provides better discrimination between fast-clearing faults and slow-moving swings, especially when CT/VT errors are present.
                </ProTip>
            </>
        )
    },
    {
        id: 'standards',
        title: "5. Standards & References",
        subtitle: "Governing Documents",
        icon: BookOpen,
        content: (
            <>
                <StandardRef code="IEEE C37.104" title="Guide for Automatic Reclosing (Power Swing Considerations)" />
                <StandardRef code="IEEE PES TR-68" title="Power Swing and Out-of-Step Considerations on Transmission Lines" />
                <StandardRef code="IEC 60255-121" title="Distance Protection Functions (includes PSB)" />
                <StandardRef code="NERC PRC-026" title="Relay Performance During Stable Power Swings" />
            </>
        )
    }
];
