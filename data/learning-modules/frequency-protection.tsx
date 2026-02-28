import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram, TheoryTimeline, TheoryWaveform } from '../../components/TheoryDiagrams';
import { ShieldCheck, TrendingUp, Activity, Sliders, Zap, AlertTriangle, BookOpen, Clock, Timer, BarChart3 } from 'lucide-react';

export const FREQUENCY_PROTECTION_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Frequency in Power Systems",
        subtitle: "Why Frequency = Balance (ANSI 81)",
        icon: Activity,
        content: (
            <>
                <p>System frequency is the ultimate indicator of <strong>generation-load balance</strong>. When load exceeds generation, kinetic energy is extracted from rotating generators, and frequency drops. When generation exceeds load, frequency rises.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-5 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <div className="text-2xl font-black text-red-600 dark:text-red-400 mb-1">f ↓</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Under-Frequency</div>
                        <p className="text-xs text-slate-500 mt-1">Load &gt; Generation. Generators decelerate. Risk: turbine blade damage, cascade tripping.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">f ↑</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Over-Frequency</div>
                        <p className="text-xs text-slate-500 mt-1">Generation &gt; Load. Generators accelerate. Risk: V/Hz issues, governor failure.</p>
                    </div>
                </div>
                <MathBlock
                    formula="\\frac{df}{dt} = \\frac{f_0}{2H} \\times \\frac{P_m - P_e}{S_{base}}"
                    legend={[
                        ["df/dt", "Rate of Change of Frequency (ROCOF)"],
                        ["H", "System inertia constant (seconds)"],
                        ["P_m", "Mechanical power input"],
                        ["P_e", "Electrical power output"],
                    ]}
                />
                <Hazard>
                    <strong>Cascading Failure:</strong> If frequency drops below ~47.5 Hz (50 Hz system), generators will trip on their own underfrequency protection, removing more generation and accelerating the collapse. This is how major blackouts occur.
                </Hazard>
            </>
        )
    },
    {
        id: 'ufls',
        title: "2. Under-Frequency Load Shedding (UFLS)",
        subtitle: "The Last Line of Defense",
        icon: Zap,
        content: (
            <>
                <p>UFLS is a <strong>system-wide automatic defense scheme</strong> that disconnects blocks of load in stages to arrest frequency decline and prevent total system collapse.</p>
                <div className="overflow-x-auto my-6">
                    <table className="w-full text-sm text-center border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr><th className="p-3 text-left">Stage</th><th className="p-3">Freq Threshold</th><th className="p-3">Time Delay</th><th className="p-3">Load Shed</th><th className="p-3 text-left">Typical Loads</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr><td className="p-3 text-left font-bold text-amber-600">Stage 1</td><td className="p-3 font-mono">49.0 Hz</td><td className="p-3 font-mono">0.3 sec</td><td className="p-3">10%</td><td className="p-3 text-left text-xs">Non-essential commercial, lighting</td></tr>
                            <tr><td className="p-3 text-left font-bold text-amber-600">Stage 2</td><td className="p-3 font-mono">48.7 Hz</td><td className="p-3 font-mono">0.3 sec</td><td className="p-3">10%</td><td className="p-3 text-left text-xs">Industrial non-critical loads</td></tr>
                            <tr><td className="p-3 text-left font-bold text-red-600">Stage 3</td><td className="p-3 font-mono">48.4 Hz</td><td className="p-3 font-mono">0.3 sec</td><td className="p-3">15%</td><td className="p-3 text-left text-xs">Residential blocks, HVAC</td></tr>
                            <tr><td className="p-3 text-left font-bold text-red-600">Stage 4</td><td className="p-3 font-mono">48.0 Hz</td><td className="p-3 font-mono">0.3 sec</td><td className="p-3">10%</td><td className="p-3 text-left text-xs">Remaining non-essential</td></tr>
                            <tr><td className="p-3 text-left font-bold text-red-600">Stage 5</td><td className="p-3 font-mono">47.5 Hz</td><td className="p-3 font-mono">0.1 sec</td><td className="p-3">5%</td><td className="p-3 text-left text-xs">Emergency — prevent collapse</td></tr>
                        </tbody>
                    </table>
                </div>
                <ProTip>
                    <strong>Design Rule:</strong> Total UFLS capacity must be at least <strong>50%</strong> of peak system load per IEEE C37.117. The stages must be separated by at least 0.2 Hz to avoid simultaneous tripping, and each stage needs sufficient time delay (≥0.3s) to avoid nuisance trips from transient frequency excursions.
                </ProTip>
            </>
        )
    },
    {
        id: 'rocof',
        title: "3. Rate of Change of Frequency (ROCOF)",
        subtitle: "Detecting Islanding (81R)",
        icon: TrendingUp,
        content: (
            <>
                <p>ROCOF relays (ANSI 81R) measure how <em>fast</em> the frequency is changing, not just its absolute value. This is critical for <strong>island detection</strong> — when a section of the grid with Distributed Energy Resources (DER) becomes electrically separated from the main grid.</p>
                <MathBlock
                    formula="\\text{ROCOF} = \\frac{\\Delta f}{\\Delta t} \\text{ (Hz/s)}"
                    legend={[
                        ["\\text{ROCOF}", "Rate of change of frequency"],
                        ["\\text{Typical Setting}", "0.5 – 1.0 Hz/s for islanding detection"],
                    ]}
                />
                <TheoryLineChart
                    title="Frequency Decay: High vs Low Inertia Systems"
                    data={[
                        { t: 0, highH: 50.0, lowH: 50.0 },
                        { t: 0.5, highH: 49.8, lowH: 49.2 },
                        { t: 1.0, highH: 49.6, lowH: 48.5 },
                        { t: 1.5, highH: 49.5, lowH: 48.0 },
                        { t: 2.0, highH: 49.4, lowH: 47.5 },
                        { t: 3.0, highH: 49.3, lowH: 47.0 },
                    ]}
                    xKey="t"
                    yKeys={[
                        { key: 'highH', name: 'High Inertia (H=6s)', color: '#3b82f6' },
                        { key: 'lowH', name: 'Low Inertia (H=2s, solar-heavy)', color: '#ef4444' },
                    ]}
                    xAxisLabel="Time (seconds)"
                    yAxisLabel="Frequency (Hz)"
                    referenceLines={[{ y: 49.0, label: 'UFLS Stage 1', color: '#f59e0b' }, { y: 47.5, label: 'UFLS Stage 5', color: '#ef4444' }]}
                    height={300}
                />
            </>
        )
    },
    {
        id: 'settings',
        title: "4. Relay Settings & Configuration",
        subtitle: "81U, 81O, 81R Element Settings",
        icon: Sliders,
        content: (
            <>
                <div className="overflow-x-auto my-4">
                    <table className="w-full text-sm border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr><th className="p-3 text-left">Element</th><th className="p-3">ANSI</th><th className="p-3">Typical Range</th><th className="p-3 text-left">Application</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr><td className="p-3 font-bold">Under-Frequency</td><td className="p-3">81U</td><td className="p-3 font-mono">47.0 – 49.5 Hz</td><td className="p-3 text-xs">Load shedding, generator protection</td></tr>
                            <tr><td className="p-3 font-bold">Over-Frequency</td><td className="p-3">81O</td><td className="p-3 font-mono">50.5 – 52.0 Hz</td><td className="p-3 text-xs">Generator governor failure, DER trip</td></tr>
                            <tr><td className="p-3 font-bold">ROCOF</td><td className="p-3">81R</td><td className="p-3 font-mono">0.5 – 2.0 Hz/s</td><td className="p-3 text-xs">Islanding detection, DER disconnection</td></tr>
                        </tbody>
                    </table>
                </div>
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
                <StandardRef code="IEEE C37.117" title="Guide for the Application of Protective Relays Used for Abnormal Frequency Load Shedding" />
                <StandardRef code="IEC 60255-181" title="Frequency Protection Functions" />
                <StandardRef code="IEEE 1547" title="Standard for Interconnection of DER (Frequency Ride-Through)" />
                <StandardRef code="NERC PRC-006" title="Automatic Underfrequency Load Shedding" />
            </>
        )
    }
];
