import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram, TheoryTimeline, TheoryWaveform } from '../../components/TheoryDiagrams';
import { ShieldCheck, TrendingUp, Activity, CheckCircle2, Sliders, Clock, Zap, AlertTriangle, BookOpen, Compass, RotateCcw, Timer } from 'lucide-react';

export const AUTORECLOSER_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Autoreclosing Fundamentals",
        subtitle: "Why 80% of Faults are Temporary (ANSI 79)",
        icon: RotateCcw,
        content: (
            <>
                <p>
                    On overhead transmission and distribution lines, the vast majority of faults are <strong>transient</strong> — caused by lightning strikes, tree branches, birds, or wind-blown debris. 
                    These faults self-clear once the arc is extinguished by de-energizing the line for a brief period called the <strong>dead time</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    <div className="p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">80%</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Transient Faults</div>
                        <p className="text-xs text-slate-500 mt-1">Self-clear after de-energization. Lightning, birds, wind.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mb-1">10%</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Semi-Permanent</div>
                        <p className="text-xs text-slate-500 mt-1">May clear after multiple attempts. Tree limbs, ice.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <div className="text-3xl font-black text-red-600 dark:text-red-400 mb-1">10%</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Permanent Faults</div>
                        <p className="text-xs text-slate-500 mt-1">Will not clear. Broken conductor, equipment failure.</p>
                    </div>
                </div>

                <p>
                    Without autoreclosing, every fault — even a momentary lightning flashover — results in a <strong>sustained outage</strong> requiring manual intervention. 
                    The autorecloser re-energizes the line automatically after a preset dead time, restoring power to consumers within seconds.
                </p>

                <TheoryFlowDiagram
                    title="Autoreclosing Sequence: Fault → Trip → Dead Time → Reclose"
                    blocks={[
                        { id: 'fault', label: 'Fault Detected', sub: '50/51 Pickup', color: '#ef4444' },
                        { id: 'trip', label: 'Breaker TRIP', sub: 'Arc Interrupted', color: '#f59e0b' },
                        { id: 'dead', label: 'Dead Time', sub: '0.3 – 1.0 sec', color: '#64748b' },
                        { id: 'close', label: 'AUTO RECLOSE', sub: 'Breaker CLOSE', color: '#3b82f6' },
                        { id: 'check', label: 'Check: Fault?', sub: 'Monitor I', color: '#10b981' },
                    ]}
                    arrows={[
                        { from: 'fault', to: 'trip', label: 'Protect' },
                        { from: 'trip', to: 'dead', label: 'Wait' },
                        { from: 'dead', to: 'close', label: 'Reclose' },
                        { from: 'close', to: 'check', label: 'Verify' },
                    ]}
                />

                <ProTip>
                    <strong>Industry Rule:</strong> On overhead lines, autoreclosing is <strong>mandatory</strong> for all distribution circuits and most transmission lines. On underground cables, autoreclosing is typically <strong>disabled</strong> because cable faults are almost always permanent.
                </ProTip>
            </>
        )
    },
    {
        id: 'shot-sequence',
        title: "2. Shot Sequence & Timing",
        subtitle: "Fast Shots, Slow Shots, and Lockout",
        icon: Timer,
        content: (
            <>
                <p>
                    A typical autorecloser uses a <strong>multi-shot sequence</strong>: one or more "fast" trips followed by "slow" trips. 
                    If the fault persists after all shots are exhausted, the breaker <strong>locks out</strong>.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Standard 4-Shot Sequence</h4>
                <div className="overflow-x-auto my-4">
                    <table className="w-full text-sm text-center border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-3 text-left">Shot</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Trip Delay</th>
                                <th className="p-3">Dead Time</th>
                                <th className="p-3 text-left">Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="p-3 text-left font-bold text-blue-600">1st</td>
                                <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-bold">FAST</span></td>
                                <td className="p-3 font-mono">~50ms (Instantaneous)</td>
                                <td className="p-3 font-mono">0.3 – 0.5 sec</td>
                                <td className="p-3 text-left text-xs">Clear transient faults with minimal arc energy</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold text-blue-600">2nd</td>
                                <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-bold">FAST</span></td>
                                <td className="p-3 font-mono">~50ms</td>
                                <td className="p-3 font-mono">0.5 sec</td>
                                <td className="p-3 text-left text-xs">Second attempt for semi-persistent transients</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold text-amber-600">3rd</td>
                                <td className="p-3"><span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded text-xs font-bold">SLOW</span></td>
                                <td className="p-3 font-mono">~0.4s (Time OC)</td>
                                <td className="p-3 font-mono">15 – 30 sec</td>
                                <td className="p-3 text-left text-xs">Allow downstream fuse to blow (fuse-saving)</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold text-red-600">4th</td>
                                <td className="p-3"><span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-xs font-bold">SLOW</span></td>
                                <td className="p-3 font-mono">~0.4s</td>
                                <td className="p-3 font-mono">—</td>
                                <td className="p-3 text-left text-xs">Final attempt before lockout</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <MathBlock 
                    formula="T_{reclaim} = \\text{Time after last successful reclose to reset shot counter}"
                    legend={[
                        ["T_{reclaim}", "Reclaim Time (typically 30–180 seconds)"],
                        ["Dead Time", "Time breaker stays open between shots (0.3–30s)"],
                        ["Lockout", "Breaker stays open until manually reset"],
                    ]}
                />

                <TheoryTimeline
                    title="4-Shot Autorecloser Sequence (Time vs. Events)"
                    events={[
                        { time: 't=0', label: 'Fault Occurs', detail: 'Overcurrent detected by 50/51 element.', color: '#ef4444' },
                        { time: 't=50ms', label: '1st Fast Trip', detail: 'Breaker opens. Instantaneous element.', color: '#3b82f6' },
                        { time: 't=350ms', label: '1st Reclose', detail: 'Breaker closes after 300ms dead time.', color: '#10b981' },
                        { time: 't=400ms', label: 'Fault Still Present', detail: '2nd trip initiated.', color: '#ef4444' },
                        { time: 't=900ms', label: '2nd Reclose', detail: 'Breaker closes after 500ms dead time.', color: '#10b981' },
                        { time: 't=1.3s', label: '3rd Slow Trip', detail: 'Time-OC curve used. Fuse may blow.', color: '#f59e0b' },
                        { time: 't=31s', label: '3rd Reclose', detail: 'Long dead time (30s) for arc deionization.', color: '#10b981' },
                        { time: 't=31.4s', label: '4th Trip → LOCKOUT', detail: 'Permanent fault confirmed. Breaker locks out.', color: '#ef4444' },
                    ]}
                />
            </>
        )
    },
    {
        id: 'fuse-coordination',
        title: "3. Fuse-Saving vs. Fuse-Clearing",
        subtitle: "The Critical Coordination Decision",
        icon: Sliders,
        content: (
            <>
                <p>
                    In distribution networks, fuses protect lateral taps (spur lines). The autorecloser on the main feeder must coordinate with these fuses. 
                    There are two competing philosophies:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-bold ring-1 ring-blue-500/20">Option 1</span>
                            <strong className="text-slate-900 dark:text-white text-lg">Fuse-Saving</strong>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            The autorecloser trips <strong>faster</strong> than the fuse on the first shot. If the fault is transient, power is restored without blowing the fuse.
                        </p>
                        <ul className="text-xs list-disc pl-4 space-y-1 text-slate-500">
                            <li><strong>Pros:</strong> Fewer fuse replacements, faster restoration.</li>
                            <li><strong>Cons:</strong> Momentary outage on the <em>entire</em> feeder, even for lateral faults.</li>
                            <li><strong>Best for:</strong> Rural areas with long laterals.</li>
                        </ul>
                    </div>
                    <div className="p-5 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded text-xs font-bold ring-1 ring-amber-500/20">Option 2</span>
                            <strong className="text-slate-900 dark:text-white text-lg">Fuse-Clearing</strong>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            The autorecloser trips <strong>slower</strong> than the fuse. The fuse blows first, isolating only the faulted lateral.
                        </p>
                        <ul className="text-xs list-disc pl-4 space-y-1 text-slate-500">
                            <li><strong>Pros:</strong> Main feeder unaffected. Fewer voltage sags for other customers.</li>
                            <li><strong>Cons:</strong> Fuse must be replaced (crew dispatch needed).</li>
                            <li><strong>Best for:</strong> Urban areas with sensitive loads.</li>
                        </ul>
                    </div>
                </div>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Coordination on the TCC</h4>
                <p>
                    On a Time-Current Characteristics (TCC) chart, fuse-saving requires the autorecloser's <strong>fast curve</strong> to lie entirely <em>below</em> the fuse minimum-melt curve. 
                    For fuse-clearing, the autorecloser's <strong>slow curve</strong> must lie entirely <em>above</em> the fuse total-clear curve.
                </p>

                <TheoryLineChart
                    title="Fuse-Saving: Recloser Fast Curve vs. Fuse Melt Curve"
                    data={[
                        { I: 100, recloserFast: 0.03, fuseMelt: 0.1, recloserSlow: 0.5 },
                        { I: 200, recloserFast: 0.03, fuseMelt: 0.04, recloserSlow: 0.3 },
                        { I: 500, recloserFast: 0.03, fuseMelt: 0.015, recloserSlow: 0.15 },
                        { I: 1000, recloserFast: 0.03, fuseMelt: 0.008, recloserSlow: 0.08 },
                        { I: 2000, recloserFast: 0.03, fuseMelt: 0.004, recloserSlow: 0.05 },
                    ]}
                    xKey="I"
                    yKeys={[
                        { key: 'recloserFast', name: 'Recloser Fast (50ms)', color: '#3b82f6' },
                        { key: 'fuseMelt', name: 'Fuse Min-Melt', color: '#ef4444' },
                        { key: 'recloserSlow', name: 'Recloser Slow (51)', color: '#f59e0b' },
                    ]}
                    xAxisLabel="Fault Current (A)"
                    yAxisLabel="Time (Seconds)"
                    height={300}
                />

                <Hazard>
                    <strong>Critical:</strong> For fuse-saving to work, the autorecloser must completely clear the fault <em>before</em> the fuse element starts to melt. If the autorecloser fast-trip time exceeds the fuse minimum melt time at any fault level, fuse-saving coordination fails.
                </Hazard>
            </>
        )
    },
    {
        id: 'settings',
        title: "4. Settings & Configuration",
        subtitle: "Dead Time, Reclaim, and Shot Count",
        icon: Settings,
        content: (
            <>
                <p>
                    Setting an autorecloser correctly depends on the type of line, fault characteristics, and downstream protection devices.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Key Settings</h4>
                <div className="overflow-x-auto my-4">
                    <table className="w-full text-sm border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-3 text-left">Parameter</th>
                                <th className="p-3 text-left">Typical Range</th>
                                <th className="p-3 text-left">Considerations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="p-3 font-bold">Dead Time (Fast Shot)</td>
                                <td className="p-3 font-mono">0.2 – 0.5 sec</td>
                                <td className="p-3 text-xs">Must be long enough for arc to deionize. For 132kV+, use ≥0.5s.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold">Dead Time (Slow Shot)</td>
                                <td className="p-3 font-mono">15 – 30 sec</td>
                                <td className="p-3 text-xs">Long delay for semi-permanent faults (tree contact). Allows fuse to cool.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold">Reclaim Time</td>
                                <td className="p-3 font-mono">30 – 180 sec</td>
                                <td className="p-3 text-xs">After successful reclose, shot counter resets after this time expires.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold">Number of Shots</td>
                                <td className="p-3 font-mono">1 – 4</td>
                                <td className="p-3 text-xs">Typically 1 fast + 2 slow, or 2 fast + 2 slow for distribution.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold">Synchrocheck (25)</td>
                                <td className="p-3 font-mono">ON/OFF</td>
                                <td className="p-3 text-xs">For transmission lines, check voltage phase angle before reclosing.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <MathBlock
                    formula="T_{deion} \\geq \\frac{V_{sys}}{34.5} \\times 10.5 \\text{ cycles}"
                    legend={[
                        ["T_{deion}", "Minimum deionization time"],
                        ["V_{sys}", "System voltage in kV"],
                    ]}
                />

                <ProTip>
                    <strong>High-Voltage Rule:</strong> For transmission lines (≥69kV), the dead time must be long enough for the ionized air in the fault arc path to fully deionize. At 345kV, this can require dead times of 20+ cycles (0.33s at 60Hz). Always calculate deionization time using the IEEE C37.104 formula.
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
                <StandardRef code="IEEE C37.60" title="High-Voltage AC Circuit Reclosers and Fault Interrupters" />
                <StandardRef code="IEEE C37.104" title="Guide for Automatic Reclosing on AC Distribution and Transmission Lines" />
                <StandardRef code="IEC 62271-111" title="Automatic Circuit Reclosers and Fault Interrupters for Alternating Current Systems" />
                <StandardRef code="IEEE C37.112" title="Standard Inverse-Time Characteristic Equations for Overcurrent Relays" />
                <StandardRef code="IEEE 1547" title="Standard for Interconnection of Distributed Energy Resources (DER Reclosing Considerations)" />
            </>
        )
    }
];
