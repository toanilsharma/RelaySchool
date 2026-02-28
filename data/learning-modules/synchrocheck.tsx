import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram, TheoryTimeline, TheoryWaveform } from '../../components/TheoryDiagrams';
import { ShieldCheck, TrendingUp, Activity, CheckCircle2, Sliders, Clock, Zap, AlertTriangle, BookOpen, Compass, Gauge, Radio } from 'lucide-react';

export const SYNCHROCHECK_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Synchronization Fundamentals",
        subtitle: "Why We Cannot Just 'Close the Breaker' (ANSI 25)",
        icon: ShieldCheck,
        content: (
            <>
                <p>
                    When connecting two AC systems together — whether paralleling a generator to the grid, reclosing a transmission line, or reconnecting two sections of a busbar — the voltages on both sides of the breaker must be <strong>in sync</strong>. 
                    Closing a breaker across two unsynchronized sources can generate massive inrush currents and torque transients that can destroy generators, transformers, and prime movers.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    <div className="p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">ΔV</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Voltage Difference</div>
                        <p className="text-xs text-slate-500 mt-1">Both sides must have similar voltage magnitude. Typical limit: ±10% of nominal.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">Δf</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Frequency Difference</div>
                        <p className="text-xs text-slate-500 mt-1">Slip frequency must be small enough for the breaker to close safely. Typical: ≤0.1 Hz.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mb-1">Δφ</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Phase Angle Difference</div>
                        <p className="text-xs text-slate-500 mt-1">The angle between the two voltage phasors at the moment of closure. Typical limit: ±25°.</p>
                    </div>
                </div>

                <MathBlock
                    formula="V_{across} = \\sqrt{V_1^2 + V_2^2 - 2 V_1 V_2 \\cos(\\Delta\\phi)}"
                    legend={[
                        ["V_{across}", "Voltage across the breaker at closure"],
                        ["V_1, V_2", "Voltages on each side"],
                        ["\\Delta\\phi", "Phase angle difference at closure"],
                    ]}
                />

                <Hazard>
                    <strong>Worst Case:</strong> Closing 180° out of phase creates a voltage across the breaker of approximately <InlineMath math="2 \\times V_{rated}" />. 
                    The resulting current can be <strong>10–20× rated</strong>, causing catastrophic shaft damage to generators and transformer winding deformation.
                </Hazard>
            </>
        )
    },
    {
        id: 'synchroscope',
        title: "2. The Synchroscope",
        subtitle: "Reading the Pointer",
        icon: Gauge,
        content: (
            <>
                <p>
                    The <strong>synchroscope</strong> is the primary instrument for manual synchronization. It displays the <em>phase angle difference</em> between two systems as a rotating pointer.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold mb-3 text-slate-900 dark:text-white">Pointer Behavior</h4>
                        <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-400">
                            <li>• <strong>Pointer at 12 o'clock (0°):</strong> Both systems are <em>in phase</em>. Safe to close.</li>
                            <li>• <strong>Pointer rotating clockwise:</strong> Incoming system is <em>faster</em> (higher frequency).</li>
                            <li>• <strong>Pointer rotating counter-clockwise:</strong> Incoming system is <em>slower</em>.</li>
                            <li>• <strong>Pointer at 6 o'clock (180°):</strong> Systems are exactly out of phase. <strong>NEVER close here.</strong></li>
                            <li>• <strong>Pointer speed:</strong> Proportional to the slip frequency (Δf).</li>
                        </ul>
                    </div>
                    <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold mb-3 text-slate-900 dark:text-white">Closing Technique</h4>
                        <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-400">
                            <li>1. Adjust governor to slow pointer rotation.</li>
                            <li>2. Match voltage using AVR (Automatic Voltage Regulator).</li>
                            <li>3. Anticipate breaker closing time: close <em>before</em> 12 o'clock.</li>
                            <li>4. "Lead the pointer" — account for breaker operating time (typically 3–5 cycles).</li>
                        </ul>
                    </div>
                </div>

                <MathBlock
                    formula="\\theta_{advance} = 360° \\times \\Delta f \\times t_{breaker}"
                    legend={[
                        ["\\theta_{advance}", "How far to lead the close command (degrees)"],
                        ["\\Delta f", "Slip frequency (Hz)"],
                        ["t_{breaker}", "Breaker closing time (seconds)"],
                    ]}
                />

                <ProTip>
                    <strong>Operator's Rule:</strong> If the synchroscope pointer is rotating too fast (high Δf), do NOT attempt to close. First reduce the slip frequency by adjusting the governor. A safe maximum is about <strong>one revolution per 10 seconds</strong> (Δf = 0.1 Hz).
                </ProTip>
            </>
        )
    },
    {
        id: 'relay-function',
        title: "3. Synchrocheck Relay (25)",
        subtitle: "Automatic Closing Verification",
        icon: Radio,
        content: (
            <>
                <p>
                    The synchrocheck relay (ANSI 25) provides automatic verification before allowing the breaker close command to execute. 
                    It continuously monitors ΔV, Δf, and Δφ and only passes the close command when <strong>all three</strong> criteria are within limits.
                </p>

                <TheoryFlowDiagram
                    title="Synchrocheck Relay Decision Logic"
                    blocks={[
                        { id: 'close', label: 'Close Command', sub: 'Operator/Auto', color: '#64748b' },
                        { id: 'dv', label: 'ΔV Check', sub: '|V₁-V₂| ≤ 10%', color: '#3b82f6' },
                        { id: 'df', label: 'Δf Check', sub: 'Δf ≤ 0.1 Hz', color: '#10b981' },
                        { id: 'da', label: 'Δφ Check', sub: '|φ₁-φ₂| ≤ 25°', color: '#8b5cf6' },
                        { id: 'pass', label: 'CLOSE OK', sub: 'Breaker Energize', color: '#10b981' },
                    ]}
                    arrows={[
                        { from: 'close', to: 'dv', label: 'Verify' },
                        { from: 'dv', to: 'df', label: 'Pass' },
                        { from: 'df', to: 'da', label: 'Pass' },
                        { from: 'da', to: 'pass', label: 'All OK' },
                    ]}
                />

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Typical Settings</h4>
                <div className="overflow-x-auto my-4">
                    <table className="w-full text-sm text-center border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-3 text-left">Parameter</th>
                                <th className="p-3">Generator Parallel</th>
                                <th className="p-3">Line Reclose</th>
                                <th className="p-3">Bus Coupler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="p-3 text-left font-bold">ΔV Max</td>
                                <td className="p-3 font-mono">±5%</td>
                                <td className="p-3 font-mono">±10%</td>
                                <td className="p-3 font-mono">±5%</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold">Δf Max</td>
                                <td className="p-3 font-mono">0.05 Hz</td>
                                <td className="p-3 font-mono">0.2 Hz</td>
                                <td className="p-3 font-mono">0.1 Hz</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-left font-bold">Δφ Max</td>
                                <td className="p-3 font-mono">±10°</td>
                                <td className="p-3 font-mono">±25°</td>
                                <td className="p-3 font-mono">±15°</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <TheoryWaveform
                    title="Voltage Waveforms: Bus vs. Incoming Generator (Animated by Your Simulator State)"
                    liveTopic="live-state-synchrocheck"
                    waves={[
                        { label: 'Bus Voltage', color: '#3b82f6', amplitude: 1.0, phase: 0, liveKeyAmp: 'busV' },
                        { label: 'Gen Voltage', color: '#10b981', amplitude: 0.95, phase: 15, liveKeyAmp: 'genV', liveKeyPhase: 'deltaAngle' },
                    ]}
                    duration={0.06}
                />
            </>
        )
    },
    {
        id: 'applications',
        title: "4. Application Scenarios",
        subtitle: "Generator, Line, and Transfer",
        icon: Activity,
        content: (
            <>
                <h4 className="font-bold text-lg mt-2 text-slate-800 dark:text-slate-200">Scenario 1: Generator Paralleling</h4>
                <p className="mb-4">
                    The most critical use case. A generator is brought up to speed, voltage is matched via the AVR, and the synchrocheck relay verifies ΔV, Δf, Δφ before allowing the generator circuit breaker to close. 
                    <strong> IEEE C50.13</strong> limits the closing angle to prevent shaft damage to the turbine-generator coupling.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Scenario 2: Transmission Line Reclosing</h4>
                <p className="mb-4">
                    After a trip on a transmission line, autoreclosing may attempt to re-energize the line. If the line connects two electrically separate systems (e.g., after the trip), the synchrocheck relay ensures the two systems are in sync before reconnecting. 
                    This prevents <strong>power swings</strong> and potential cascading outages.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Scenario 3: Bus Transfer</h4>
                <p>
                    When transferring a bus from one supply to another (e.g., normal to standby source), the synchrocheck relay verifies that the two sources are compatible. 
                    For <strong>live-to-live</strong> transfers, Δφ must be small. For <strong>dead bus</strong> conditions, the relay may allow closing without synchrocheck (dead-bus close logic).
                </p>

                <TheoryTimeline
                    title="Generator Paralleling Sequence"
                    events={[
                        { time: 'Step 1', label: 'Start Prime Mover', detail: 'Bring turbine/engine up to rated speed.', color: '#64748b' },
                        { time: 'Step 2', label: 'Match Voltage', detail: 'Adjust AVR until Vgen ≈ Vbus (within ±5%).', color: '#3b82f6' },
                        { time: 'Step 3', label: 'Match Frequency', detail: 'Adjust governor until Δf < 0.05 Hz.', color: '#10b981' },
                        { time: 'Step 4', label: 'Watch Synchroscope', detail: 'Wait for slow clockwise rotation.', color: '#8b5cf6' },
                        { time: 'Step 5', label: 'Close Breaker', detail: 'Close just before 12 o\'clock position.', color: '#10b981' },
                        { time: 'Step 6', label: 'Load Pickup', detail: 'Gradually increase load on generator.', color: '#f59e0b' },
                    ]}
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
                <StandardRef code="IEEE C37.2" title="Standard for Electrical Power System Device Function Numbers (Device 25)" />
                <StandardRef code="IEEE C50.13" title="Standard for Cylindrical-Rotor Synchronous Generators (Paralleling Requirements)" />
                <StandardRef code="IEC 60034-1" title="Rotating Electrical Machines – Rating and Performance" />
                <StandardRef code="IEEE C37.104" title="Guide for Automatic Reclosing (Synchrocheck for Line Reclosing)" />
                <StandardRef code="IEC 60255-181" title="Frequency Protection Functions (Related to Synchrocheck)" />
            </>
        )
    }
];
