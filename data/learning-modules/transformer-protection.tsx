import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram, TheoryTimeline, TheoryWaveform } from '../../components/TheoryDiagrams';
import { ShieldCheck, TrendingUp, Activity, Sliders, Zap, AlertTriangle, BookOpen, GitMerge, Settings, Layers } from 'lucide-react';

export const TRANSFORMER_PROTECTION_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Transformer Differential Protection",
        subtitle: "Why Transformers Need Special 87T Logic (ANSI 87T)",
        icon: ShieldCheck,
        content: (
            <>
                <p>
                    Transformer differential protection (87T) compares the current entering one winding with the current leaving the other. Under normal conditions, the difference should be zero (after accounting for turns ratio). During an internal fault, a large differential current appears, and the relay trips.
                </p>
                <p className="mt-3">
                    However, transformers introduce <strong>unique challenges</strong> that do not exist in bus or generator differential:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-5 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Challenge 1: Vector Group</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            A Dyn11 transformer introduces a <strong>30° phase shift</strong> between primary and secondary currents. If not compensated, this creates a false differential current that causes maloperation.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-2">Challenge 2: Magnetizing Inrush</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            When energized, the transformer draws a huge transient current (up to <strong>8–12× rated</strong>). This appears only on the primary side — creating a massive false differential signal.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Challenge 3: Tap Changer</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            On-Load Tap Changers (OLTC) vary the turns ratio by ±10-15%. The relay must tolerate this mismatch without false tripping.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                        <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-2">Challenge 4: Overexcitation</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            V/Hz overexcitation produces 5th harmonic currents. The relay must distinguish this from an internal fault.
                        </p>
                    </div>
                </div>

                <TheoryFlowDiagram
                    title="87T Decision Logic: Internal Fault vs. Sympathetic Events"
                    blocks={[
                        { id: 'ct', label: 'CT Inputs', sub: 'HV & LV sides', color: '#64748b' },
                        { id: 'comp', label: 'Vector Group\nCompensation', sub: 'Phase shift correction', color: '#3b82f6' },
                        { id: 'diff', label: 'Differential\nCalculation', sub: 'Id = |I₁ - I₂|', color: '#8b5cf6' },
                        { id: 'block', label: 'Harmonic\nBlocking', sub: '2nd & 5th check', color: '#f59e0b' },
                        { id: 'trip', label: 'TRIP', sub: 'If Id > threshold', color: '#ef4444' },
                    ]}
                    arrows={[
                        { from: 'ct', to: 'comp', label: 'Raw I' },
                        { from: 'comp', to: 'diff', label: 'Corrected' },
                        { from: 'diff', to: 'block', label: 'Check' },
                        { from: 'block', to: 'trip', label: 'No Block' },
                    ]}
                />

                <div className="my-8">
                    <TheoryLineChart 
                        title="Live 87T Operating Characteristic"
                        liveTopic="live-state-transformer"
                        liveDot={{ liveKeyX: 'Ir', liveKeyY: 'Id', label: 'Measured Z', color: '#ef4444' }}
                        data={[
                            { Ir: 0, Id: 0.2 },
                            { Ir: 0.5, Id: 0.2 },
                            { Ir: 1, Id: 0.3 },
                            { Ir: 2, Id: 1.0 },
                            { Ir: 4, Id: 2.4 },
                            { Ir: 5, Id: 3.1 }
                        ]}
                        xKey="Ir"
                        yKeys={[
                            { key: 'Id', name: 'Dual-Slope Threshold', color: '#3b82f6' }
                        ]}
                        xAxisLabel="Restraint Current (I_restraint)"
                        yAxisLabel="Differential Current (I_diff)"
                        height={300}
                    />
                </div>
            </>
        )
    },
    {
        id: 'vector-groups',
        title: "2. Vector Group Compensation",
        subtitle: "Understanding Dy11, Yd1, YNyn0",
        icon: GitMerge,
        content: (
            <>
                <p>
                    The vector group designation (e.g., <strong>Dyn11</strong>) describes the winding connections and the phase displacement between primary and secondary voltages. The number represents the phase shift as a clock face position.
                </p>

                <div className="overflow-x-auto my-6">
                    <table className="w-full text-sm text-center border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-3 text-left">Vector Group</th>
                                <th className="p-3">Phase Shift</th>
                                <th className="p-3">Clock</th>
                                <th className="p-3 text-left">Relay Compensation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="p-3 text-left font-bold">Dyn11</td>
                                <td className="p-3 font-mono">-30°</td>
                                <td className="p-3">11 o'clock</td>
                                <td className="p-3 text-left text-xs">Relay shifts HV currents by +30° (or applies Y→Δ matrix)</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold">Dyn1</td>
                                <td className="p-3 font-mono">+30°</td>
                                <td className="p-3">1 o'clock</td>
                                <td className="p-3 text-left text-xs">Relay shifts HV currents by -30°</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold">YNyn0</td>
                                <td className="p-3 font-mono">0°</td>
                                <td className="p-3">12 o'clock</td>
                                <td className="p-3 text-left text-xs">No phase compensation needed</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold">Yd5</td>
                                <td className="p-3 font-mono">-150°</td>
                                <td className="p-3">5 o'clock</td>
                                <td className="p-3 text-left text-xs">Relay applies 150° compensation matrix</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <MathBlock
                    formula="\\begin{bmatrix} i_a' \\\\ i_b' \\\\ i_c' \\end{bmatrix} = \\frac{1}{\\sqrt{3}} \\begin{bmatrix} 1 & -1 & 0 \\\\ 0 & 1 & -1 \\\\ -1 & 0 & 1 \\end{bmatrix} \\begin{bmatrix} i_A \\\\ i_B \\\\ i_C \\end{bmatrix}"
                    legend={[
                        ["i_a', i_b', i_c'", "Compensated currents (after matrix transformation)"],
                        ["i_A, i_B, i_C", "Raw CT currents from delta (HV) side"],
                    ]}
                />

                <ProTip>
                    Modern numerical relays (e.g., SEL-487E, ABB RET670, Siemens 7UT85) perform vector group compensation <strong>digitally in software</strong>. The engineer simply selects the vector group from a menu. The relay applies the correct phase-shift matrix automatically. No external interposing CTs are needed.
                </ProTip>
            </>
        )
    },
    {
        id: 'harmonic-blocking',
        title: "3. Harmonic Restraint & Blocking",
        subtitle: "Inrush vs. Fault Discrimination",
        icon: Activity,
        content: (
            <>
                <p>
                    The key to reliable 87T protection is distinguishing between a <strong>real internal fault</strong> and <strong>magnetizing inrush</strong>. Both produce large differential currents, but their harmonic content is different.
                </p>

                <div className="overflow-x-auto my-6">
                    <table className="w-full text-sm text-center border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-3 text-left">Condition</th>
                                <th className="p-3">Fundamental</th>
                                <th className="p-3">2nd Harmonic</th>
                                <th className="p-3">5th Harmonic</th>
                                <th className="p-3 text-left">Relay Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="p-3 text-left font-bold text-red-600">Internal Fault</td>
                                <td className="p-3">Very High</td>
                                <td className="p-3 text-emerald-500 font-bold">Low (&lt;15%)</td>
                                <td className="p-3 text-emerald-500 font-bold">Low (&lt;25%)</td>
                                <td className="p-3 text-left font-bold text-red-500">TRIP</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold text-amber-600">Inrush</td>
                                <td className="p-3">High</td>
                                <td className="p-3 text-red-500 font-bold">High (&gt;15%)</td>
                                <td className="p-3">Low</td>
                                <td className="p-3 text-left font-bold text-blue-500">BLOCK</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold text-purple-600">Overexcitation</td>
                                <td className="p-3">Moderate</td>
                                <td className="p-3">Low</td>
                                <td className="p-3 text-red-500 font-bold">High (&gt;25%)</td>
                                <td className="p-3 text-left font-bold text-blue-500">BLOCK</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <MathBlock
                    formula="\\text{2nd Harmonic Ratio} = \\frac{I_{d,2nd}}{I_{d,fund}} \\times 100\\%"
                    legend={[
                        ["I_{d,2nd}", "2nd harmonic component of differential current"],
                        ["I_{d,fund}", "Fundamental component of differential current"],
                    ]}
                />

                <TheoryWaveform
                    title="Magnetizing Inrush Current (Live Harmonics)"
                    liveTopic="live-state-transformer"
                    waves={[
                        { label: 'Fundamental (50Hz)', color: '#3b82f6', amplitude: 1.0, phase: 0 },
                        { label: '2nd Harmonic (100Hz)', color: '#ef4444', amplitude: 0.35, phase: 45, liveKeyAmp: 'harmonic2nd' },
                        { label: '5th Harmonic (250Hz)', color: '#8b5cf6', amplitude: 0.1, phase: 0, liveKeyAmp: 'harmonic5th' },
                    ]}
                    duration={0.06}
                />

                <Hazard>
                    <strong>Sympathetic Inrush:</strong> When energizing a transformer in parallel with an already-energized transformer, the existing transformer can also experience inrush due to core flux disturbance. This can cause <strong>both</strong> transformers' 87T relays to see differential current. Cross-blocking between parallel transformer relays may be needed.
                </Hazard>
            </>
        )
    },
    {
        id: 'overexcitation',
        title: "4. Overexcitation Protection (V/Hz, 24)",
        subtitle: "Protecting Against Core Saturation",
        icon: AlertTriangle,
        content: (
            <>
                <p>
                    Transformers and generators are designed to operate at a specific <strong>Volts/Hertz (V/Hz)</strong> ratio. If the voltage rises or the frequency drops, the magnetic flux density in the core increases beyond the design limit, causing <strong>core saturation, excessive heating, and eventual insulation failure</strong>.
                </p>

                <MathBlock
                    formula="\\frac{V}{Hz} = \\frac{V_{applied}}{f} \\leq \\frac{V_{rated}}{f_{rated}} \\times 1.10"
                    legend={[
                        ["V/Hz", "Volts-per-Hertz ratio (proportional to flux density)"],
                        ["1.10", "IEEE C57.12 allows 110% of rated V/Hz continuously"],
                    ]}
                />

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">When Does Overexcitation Occur?</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300 my-4">
                    <li><strong>Generator trip with full AVR output:</strong> Voltage rises rapidly while frequency drops.</li>
                    <li><strong>Load rejection on isolated generator:</strong> Speed rises, V/Hz may spike.</li>
                    <li><strong>Tap changer stuck at wrong position:</strong> Applied voltage exceeds intended level.</li>
                    <li><strong>Energizing at reduced frequency:</strong> E.g., black start at 48 Hz with full voltage.</li>
                </ul>

                <TheoryLineChart
                    title="V/Hz Inverse-Time Characteristic (IEEE C57.91)"
                    data={[
                        { vhz: 1.05, time: 999 },
                        { vhz: 1.10, time: 60 },
                        { vhz: 1.15, time: 10 },
                        { vhz: 1.20, time: 2 },
                        { vhz: 1.25, time: 0.5 },
                        { vhz: 1.30, time: 0.1 },
                    ]}
                    xKey="vhz"
                    yKeys={[
                        { key: 'time', name: 'Withstand Time (seconds)', color: '#ef4444' },
                    ]}
                    xAxisLabel="V/Hz (per unit)"
                    yAxisLabel="Time (seconds)"
                    height={300}
                />
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
                <StandardRef code="IEEE C37.91" title="Guide for Protecting Power Transformers" />
                <StandardRef code="IEC 60076-1" title="Power Transformers — General Requirements" />
                <StandardRef code="IEEE C57.12.00" title="Standard for Liquid-Immersed Distribution, Power, and Regulating Transformers" />
                <StandardRef code="IEEE C57.91" title="Guide for Loading Mineral-Oil-Immersed Transformers (Overexcitation)" />
                <StandardRef code="IEC 61869-2" title="Instrument Transformers — Current Transformers (CT Selection for 87T)" />
            </>
        )
    }
];
