import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram, TheoryTimeline, TheoryWaveform } from '../../components/TheoryDiagrams';
import { ShieldCheck, TrendingUp, Activity, CheckCircle2, Sliders, Clock, Zap, AlertTriangle, BookOpen, Compass } from 'lucide-react';

export const RELAY_TESTER_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Overcurrent Protection Fundamentals",
        subtitle: "The Workhorse of the Grid (ANSI 50/51)",
        icon: ShieldCheck,
        content: (
            <>
                <p>
                    Overcurrent protection is the oldest and most widely used form of protection. Ideally, we want to clear severe faults instantly but allow temporary overloads (like motor starting) to ride through. To achieve this, we split the function into two elements:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded text-xs font-bold ring-1 ring-amber-500/20">ANSI 51</span>
                            <strong className="text-slate-900 dark:text-white text-lg">Time-Overcurrent</strong>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            <strong>Inverse Characteristic:</strong> The higher the current, the faster it trips.
                        </p>
                        <ul className="text-xs list-disc pl-4 space-y-1 text-slate-500">
                            <li>Protects against cable overloads and distant faults.</li>
                            <li>Coordinated with downstream devices.</li>
                            <li>Settings: Pickup (<InlineMath math="I_p" />) and Time Dial (<InlineMath math="TMS" />).</li>
                        </ul>
                    </div>
                    <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-xs font-bold ring-1 ring-red-500/20">ANSI 50</span>
                            <strong className="text-slate-900 dark:text-white text-lg">Instantaneous</strong>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            <strong>No Intentional Delay:</strong> Trips in &lt;30ms when current exceeds a high threshold.
                        </p>
                        <ul className="text-xs list-disc pl-4 space-y-1 text-slate-500">
                            <li>Clears close-in, high-energy faults immediately.</li>
                            <li>No coordination with downstream (usually).</li>
                            <li>Setting: High Set (<InlineMath math="I \gg" />).</li>
                        </ul>
                    </div>
                </div>

                <TheoryFlowDiagram
                    title="Overcurrent Protection: 50/51 Decision Logic"
                    blocks={[
                        { id: 'ct', label: 'CT Input', sub: 'Ia, Ib, Ic', color: '#64748b' },
                        { id: 'pickup', label: '51 Element', sub: 'I > Is ?', color: '#3b82f6' },
                        { id: 'inst', label: '50 Element', sub: 'I > I>> ?', color: '#ef4444' },
                        { id: 'trip', label: 'TRIP', sub: 'Breaker Open', color: '#10b981' },
                    ]}
                    arrows={[
                        { from: 'ct', to: 'pickup', label: 'Measure' },
                        { from: 'ct', to: 'inst', label: 'Measure' },
                        { from: 'pickup', to: 'trip', label: 'Delay' },
                        { from: 'inst', to: 'trip', label: 'Instant' },
                    ]}
                />
            </>
        )
    },
    {
        id: 'curves',
        title: "2. The IEC 60255 Curves",
        subtitle: "Selecting the Right Characteristic",
        icon: TrendingUp,
        content: (
            <>
                <p>
                    The operating time (<InlineMath math="t" />) of an IDMT (Inverse Definite Minimum Time) relay is defined by the IEC 60255-151 standard equation.
                </p>

                <MathBlock 
                    formula="t(I) = TMS \times \left( \frac{k}{(\frac{I}{I_s})^{\alpha} - 1} \right)"
                    legend={[
                        ["t", "Trip Time (seconds)"],
                        ["TMS", "Time Multiplier Setting (0.05 - 1.0)"],
                        ["I", "Measured Fault Current"],
                        ["I_s", "Pickup Current Setting"],
                        ["k, α", "Curve Constants"]
                    ]}
                />

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Standard Curve Constants</h4>
                <div className="overflow-x-auto my-4">
                    <table className="w-full text-sm text-center border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-3 text-left">Curve Type</th>
                                <th className="p-3">Alpha (<InlineMath math="\alpha" />)</th>
                                <th className="p-3">Constant (<InlineMath math="k" />)</th>
                                <th className="p-3 text-left">Application</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="p-3 text-left font-bold text-blue-600">Standard Inverse (SI)</td>
                                <td className="p-3">0.02</td>
                                <td className="p-3">0.14</td>
                                <td className="p-3 text-left text-xs">General purpose feeders. Easy to coordinate.</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold text-amber-600">Very Inverse (VI)</td>
                                <td className="p-3">1.0</td>
                                <td className="p-3">13.5</td>
                                <td className="p-3 text-left text-xs">Long lines where <InlineMath math="I_f" /> drops with distance.</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold text-red-600">Extremely Inverse (EI)</td>
                                <td className="p-3">2.0</td>
                                <td className="p-3">80.0</td>
                                <td className="p-3 text-left text-xs">Matching fuse curves or protecting against overheating.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-8">
                     <TheoryLineChart 
                        title="IEC IDMT Curve Families (tms = 1.0)"
                        data={[
                            { I: 1.5, si: 0.14/(Math.pow(1.5, 0.02)-1), vi: 13.5/(1.5-1), ei: 80/(Math.pow(1.5, 2)-1) },
                            { I: 2,   si: 0.14/(Math.pow(2, 0.02)-1), vi: 13.5/(2-1), ei: 80/(Math.pow(2, 2)-1) },
                            { I: 3,   si: 0.14/(Math.pow(3, 0.02)-1), vi: 13.5/(3-1), ei: 80/(Math.pow(3, 2)-1) },
                            { I: 5,   si: 0.14/(Math.pow(5, 0.02)-1), vi: 13.5/(5-1), ei: 80/(Math.pow(5, 2)-1) },
                            { I: 10,  si: 0.14/(Math.pow(10, 0.02)-1), vi: 13.5/(10-1), ei: 80/(Math.pow(10, 2)-1) },
                            { I: 20,  si: 0.14/(Math.pow(20, 0.02)-1), vi: 13.5/(20-1), ei: 80/(Math.pow(20, 2)-1) }
                        ]}
                        xKey="I"
                        yKeys={[
                            { key: 'si', name: 'Standard Inverse (SI)', color: '#3b82f6' },
                            { key: 'vi', name: 'Very Inverse (VI)', color: '#f59e0b' },
                            { key: 'ei', name: 'Extremely Inverse (EI)', color: '#ef4444' }
                        ]}
                        xAxisLabel="Current (Multiple of Pickup I/Is)"
                        yAxisLabel="Time (Seconds)"
                        height={350}
                    />
                </div>

                <h3 className="text-xl font-bold mt-8 mb-4">Time Multiplier Setting (TMS / TD)</h3>
                <ProTip>
                    <strong>Rule of Thumb:</strong> Use <strong>Standard Inverse</strong> for most utility distribution. Use <strong>Extremely Inverse</strong> when backing up fuses or protecting transformers against inrush (relays ride through the initial spike).
                </ProTip>
            </>
        )
    },
    {
        id: 'coordination',
        title: "3. Worked Example: Time Grading",
        subtitle: "Achieving Selectivity",
        icon: Sliders,
        content: (
            <>
                <p>
                    We have two relays in series: <strong>Relay A</strong> (Source) and <strong>Relay B</strong> (Load). A fault occurs just after Relay B.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl text-sm mb-6">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b pb-2">Data</h4>
                    <div className="grid grid-cols-2 gap-y-2">
                        <span>Fault Current:</span> <span className="font-mono">5000 A</span>
                        <span>Relay B Setting:</span> <span className="font-mono"><InlineMath math="I_s = 400A" />, SI Curve, TMS = 0.1</span>
                        <span>Required Margin:</span> <span className="font-mono">0.3 seconds (Grading Interval)</span>
                        <span>Relay A Pickup:</span> <span className="font-mono"><InlineMath math="I_s = 600A" />, SI Curve</span>
                    </div>
                </div>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 1: Calculate Relay B Trip Time</h4>
                <p>First, find the Multiple of Pickup Setting (PSM) for Relay B.</p>
                <MathBlock formula="\text{PSM}_B = \frac{5000}{400} = 12.5" />
                <p>Now calculate time using SI formula (<InlineMath math="k=0.14, \alpha=0.02" />):</p>
                <MathBlock formula="t_B = 0.1 \times \frac{0.14}{12.5^{0.02} - 1} = 0.27 \text{ seconds}" />

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 2: Determine Required Time for Relay A</h4>
                <p>Relay A must wait for Relay B + Grading Margin.</p>
                <MathBlock formula="t_{A\_req} = t_B + 0.3s = 0.27 + 0.3 = 0.57 \text{ seconds}" />

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 3: Calculate Relay A TMS</h4>
                <p>Find PSM for Relay A:</p>
                <MathBlock formula="\text{PSM}_A = \frac{5000}{600} = 8.33" />
                <p>Rearrange the formula to solve for TMS:</p>
                <MathBlock 
                    formula="\text{TMS}_A = t_{A\_req} \times \frac{\text{PSM}^{\alpha} - 1}{k} = 0.57 \times \frac{8.33^{0.02} - 1}{0.14} \approx 0.176" 
                />
                <p>
                    <strong>Result:</strong> Set Relay A TMS to <strong>0.18</strong> or <strong>0.20</strong> (always round up for safety).
                </p>

                <TheoryLineChart
                    title="Time Grading: Relay B (Fast) vs Relay A (Slow)"
                    data={[
                        { I: 2, relayB: 0.1 * 0.14 / (Math.pow(2/0.4, 0.02) - 1), relayA: 0.20 * 0.14 / (Math.pow(2/0.6, 0.02) - 1) },
                        { I: 5, relayB: 0.1 * 0.14 / (Math.pow(5/0.4, 0.02) - 1), relayA: 0.20 * 0.14 / (Math.pow(5/0.6, 0.02) - 1) },
                        { I: 10, relayB: 0.1 * 0.14 / (Math.pow(10/0.4, 0.02) - 1), relayA: 0.20 * 0.14 / (Math.pow(10/0.6, 0.02) - 1) },
                        { I: 20, relayB: 0.1 * 0.14 / (Math.pow(20/0.4, 0.02) - 1), relayA: 0.20 * 0.14 / (Math.pow(20/0.6, 0.02) - 1) },
                    ]}
                    xKey="I"
                    yKeys={[
                        { key: 'relayB', name: 'Relay B (TMS=0.1)', color: '#3b82f6' },
                        { key: 'relayA', name: 'Relay A (TMS=0.2)', color: '#ef4444' },
                    ]}
                    xAxisLabel="Fault Current (kA)"
                    yAxisLabel="Trip Time (s)"
                    referenceLines={[{ y: 0.3, label: 'Grading Margin', color: '#f59e0b' }]}
                    height={300}
                />
            </>
        )
    },
    {
        id: 'directional',
        title: "4. Directional Overcurrent (67)",
        subtitle: "Looking the Right Way",
        icon: Compass,
        content: (
            <>
                <p>
                    In a radial feeder (power flows only one way), non-directional relays (50/51) are fine. 
                    But in Ring Mains or Parallel Feeders, fault current can flow in either direction.
                </p>
                <p>
                    A non-directional relay on a healthy parallel line might see "reverse" fault current feeding a fault on the sick line and trip incorrectly. To fix this, we add a <strong>Directional Element (67)</strong>.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Polarization</h4>
                <p>
                    How does the relay know which way is "Forward"? It compares the Fault Current Angle against a verified Reference (Polarizing) Voltage.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <strong className="block text-slate-800 dark:text-slate-200 mb-1">Quadrature connection</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            If calculating direction for Phase A Current (<InlineMath math="I_A" />), use Phase B-C Voltage (<InlineMath math="V_{BC}" />) as reference. <InlineMath math="V_{BC}" /> is 90° shifted from <InlineMath math="V_A" />, providing a stable reference even if <InlineMath math="V_A" /> collapses during the fault.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <strong className="block text-slate-800 dark:text-slate-200 mb-1">Max Torque Angle (MTA)</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            The "sweet spot" angle where the relay is most sensitive. Typically set to 30° or 45° for lines (inductive faults) and 0° for cables.
                        </p>
                    </div>
                </div>

                <TheoryWaveform
                    title="Directional Element: Forward vs Reverse Fault Current"
                    waves={[
                        { label: 'Voltage Ref (Vbc)', color: '#64748b', amplitude: 1.0, phase: 0 },
                        { label: 'Forward Ia', color: '#3b82f6', amplitude: 1.5, phase: -30 },
                        { label: 'Reverse Ia', color: '#ef4444', amplitude: 1.5, phase: 150 },
                    ]}
                    duration={0.06}
                />
            </>
        )
    },
    {
        id: 'testing',
        title: "5. Testing & Commissioning",
        subtitle: "Verifying the Settings",
        icon: Activity,
        content: (
            <>
                <p>
                    Before energizing, every relay must be tested with secondary injection.
                </p>
                
                <h4 className="font-bold text-lg mt-6 mb-2">The Standard Test Sequence</h4>
                <ul className="list-disc pl-5 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                    <li>
                        <strong>Pickup Test:</strong> Slowly increase current injection until the relay creates a "Start" event. 
                        <br/><span className="text-xs text-slate-500">Pass Criteria: <InlineMath math="\pm 5\%" /> of Setting.</span>
                    </li>
                    <li>
                        <strong>Timing Test (2x):</strong> Inject <InlineMath math="2 \times I_s" />. Measure trip time.
                        <br/><span className="text-xs text-slate-500">Pass Criteria: <InlineMath math="\pm 5\%" /> or <InlineMath math="\pm 30ms" /> (whichever is greater).</span>
                    </li>
                    <li>
                        <strong>Timing Test (5x):</strong> Inject <InlineMath math="5 \times I_s" />. Verification of the inverse curve steepness.
                    </li>
                    <li>
                        <strong>Harmonic Restraint Test:</strong> Inject current with 20% 2nd Harmonic ($100Hz$). The relay should <strong>BLOCK</strong> (Restrain) to simulate transformer inrush.
                    </li>
                </ul>

                <Hazard>
                    <strong>Safety First:</strong> Never open-circuit a live CT secondary during testing. The back-EMF can generate thousands of volts, causing arcing and death. Always use test blocks (shorting links).
                </Hazard>

                <TheoryTimeline
                    title="Standard Relay Commissioning Test Sequence"
                    events={[
                        { time: 'Step 1', label: 'Insulation Resistance', detail: 'Megger all CT/VT circuits. >100MΩ required.', color: '#64748b' },
                        { time: 'Step 2', label: 'Pickup Test (51)', detail: 'Slowly ramp current. Verify Start at Is ±5%.', color: '#3b82f6' },
                        { time: 'Step 3', label: 'Timing Test (2×Is)', detail: 'Inject 2× pickup, verify trip time ±5% or ±30ms.', color: '#3b82f6' },
                        { time: 'Step 4', label: 'Timing Test (5×Is)', detail: 'Inject 5× pickup, verify steeper part of curve.', color: '#3b82f6' },
                        { time: 'Step 5', label: 'Instantaneous (50)', detail: 'Verify I>> trips in <30ms.', color: '#ef4444' },
                        { time: 'Step 6', label: 'Harmonic Restraint', detail: 'Inject 20% 2nd harmonic. Relay must BLOCK.', color: '#f59e0b' },
                        { time: 'Step 7', label: 'End-to-End Trip', detail: 'Full trip through breaker. Verify close-trip cycle.', color: '#10b981' },
                    ]}
                />
            </>
        )
    },
    {
        id: 'standards',
        title: "6. Standards & References",
        subtitle: "The Guidelines",
        icon: BookOpen,
        content: (
            <>
               <StandardRef code="IEEE C37.112" title="Standard Inverse-Time Characteristic Equations for Overcurrent Relays" />
               <StandardRef code="IEC 60255-151" title="Functional requirements for overcurrent protection" />
               <StandardRef code="IEEE 242 (Buff Book)" title="Protection and Coordination of Industrial and Commercial Power Systems" />
            </>
        )
    }
];
