import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart } from '../../components/TheoryDiagrams';
import { Layers, Activity, TrendingUp, Box, CheckCircle2, AlertTriangle, Zap, Clock, ShieldCheck, Thermometer } from 'lucide-react';

export const TCC_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. The Science of Coordination",
        subtitle: "Selectivity vs Speed",
        icon: Layers,
        content: (
            <>
                <p>
                    Power system protection is a balancing act between two opposing goals: <strong>Speed</strong> (clearing faults instantly to save life/equipment) and <strong>Selectivity</strong> (isolating only the faulted section to maximize uptime).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <strong className="text-blue-600 dark:text-blue-400 block mb-2">The "Four S's" of Protection</strong>
                        <ul className="text-sm list-disc pl-4 space-y-2 text-slate-600 dark:text-slate-400">
                            <li><strong>Selectivity:</strong> Only the device closest to the fault trips.</li>
                            <li><strong>Speed:</strong> Minimizing damage and arc flash energy.</li>
                            <li><strong>Sensitivity:</strong> Detecting low-current faults (high impedance).</li>
                            <li><strong>Security:</strong> Never tripping when you shouldn't (stability).</li>
                        </ul>
                    </div>
                </div>

                <h3 className="text-xl font-bold mt-8 mb-4">Log-Log Plotting</h3>
                <p>
                    Time-Current Characteristics (TCCs) are plotted on <strong>Log-Log paper</strong> because both Current and Time vary over massive ranges.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Current (X-Axis):</strong> From 10A (Load) to 50,000A (Fault).</li>
                    <li><strong>Time (Y-Axis):</strong> From 0.01s (Instantaneous) to 1000s (Overload).</li>
                </ul>
                <p className="mt-4">
                    On a Log-Log scale, inverse relay curves appear as straight lines or gentle curves, making visual coordination possible.
                </p>

                <div className="mt-8">
                     <TheoryLineChart 
                        title="Typical IDMT Curve on Log scales (Conceptual)"
                        data={[
                            { x: 1, current: 1, time: 100 },
                            { x: 2, current: 2, time: 10 },
                            { x: 3, current: 3, time: 3 },
                            { x: 4, current: 5, time: 1 },
                            { x: 5, current: 10, time: 0.1 }
                        ]}
                        xKey="current"
                        yKeys={[
                            { key: 'time', name: 'Operating Time (s)', color: '#3b82f6' }
                        ]}
                        xAxisLabel="Current Multiples (I/Is)"
                        yAxisLabel="Time (Seconds)"
                        height={350}
                    />
                </div>
            </>
        )
    },
    {
        id: 'fuses',
        title: "2. Fuses vs. Relays",
        subtitle: "The Battle of Technologies",
        icon: Zap,
        content: (
            <>
                <p>
                    <strong>Fuses</strong> are simple thermal devices. A metal element melts when heated by current (<InlineMath math="I^2R" />). They are cheap, fast, and fail-safe, but they have a "Band" of operation rather than a single line.
                </p>

                <div className="flex gap-4 p-4 border rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 my-6">
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">The Fuse Band</h4>
                        <p className="text-sm mb-2">
                            A fuse curve is an Area between two lines:
                        </p>
                        <ul className="text-sm list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                            <li><strong>Minimum Melt (MM):</strong> The time it takes for the element to <em>start</em> melting. Below this line, the fuse is undamaged.</li>
                            <li><strong>Total Clearing (TC):</strong> The time it takes to fully extinguish the arc. Above this line, the circuit is open.</li>
                        </ul>
                    </div>
                </div>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Fuse Saving vs. Fuse Blowing</h4>
                <p>
                    On overhead distribution lines, 70% of faults are temporary (lightning, branches).
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li><strong>Fuse Saving:</strong> The upstream recloser trips <em>fast</em> (Instantaneous) before the fuse melts. It recloses, checking if the fault is gone. If the fault persists, it switches to a <em>slow</em> curve to let the fuse blow. Evaluation: Saves truck rolls, but blinks the whole feeder.</li>
                    <li><strong>Fuse Blowing:</strong> The recloser always delays. The fuse blows immediately for any downstream fault. Evaluation: Permanent outage for that spur, but the main feeder never blinks. Preferable for industrial power quality.</li>
                </ul>
            </>
        )
    },
    {
        id: 'transformers',
        title: "3. Transformer Protection",
        subtitle: "Inrush and Damage Curves",
        icon: Box,
        content: (
            <>
                <p>
                    A transformer is a thermal mass. Protection must allow it to breathe (Overload) and wake up (Inrush) but stop it from burning (Faults).
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">The ANSI Point (Inrush)</h4>
                <p>
                    When energized, a transformer acts like a short circuit for a few cycles while the core magnetizes.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Magnitude:</strong> Typically 8x - 12x Full Load Amps (FLA).</li>
                    <li><strong>Duration:</strong> 0.1 seconds.</li>
                </ul>
                <p className="mt-2">
                    Your relay curve must pass to the <strong>right</strong> of this point (<InlineMath math="12 \times I_n, 0.1s" />). If it passes to the left, the breaker trips every time you energize.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Damage Curves (ANSI C57.109)</h4>
                <p>
                    The standard defines how long a transformer can withstand a through-fault before mechanical forces warp the windings or heat destroys the insulation.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded">
                        <strong className="block text-red-700 dark:text-red-400">Category I (5-500 kVA)</strong>
                        <span className="text-xs">Withstand is mostly thermal. Curve is <InlineMath math="I^2t = K" />.</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded">
                        <strong className="block text-red-700 dark:text-red-400">Category II-IV (&gt;500 kVA)</strong>
                        <span className="text-xs">Withstand depends on Fault Frequency. Frequent faults allow less time.</span>
                    </div>
                </div>

                <div className="mt-8">
                     <TheoryLineChart 
                        title="Transformer Damage Curve vs Inrush (Conceptual)"
                        data={[
                            { x: 1, Time: 200, Damage: 200 },
                            { x: 2, Time: 50, Damage: 50 },
                            { x: 3, Time: 20, Damage: 20 },
                            { x: 5, Time: 5, Damage: 5 },
                            { x: 10, Inrush: 0.1, Damage: 1 },
                            { x: 12, Inrush: 0.1, Damage: 0.8 },
                            { x: 15, Inrush: 0, Damage: 0.5 }
                        ]}
                        xKey="x"
                        yKeys={[
                            { key: 'Damage', name: 'Thermal Damage Limit', color: '#ef4444' },
                            { key: 'Inrush', name: 'Inrush Point', color: '#10b981' }
                        ]}
                        xAxisLabel="Current (Multiples of FLA)"
                        yAxisLabel="Time (Seconds)"
                         referenceLines={[
                            { x: 12, label: 'Inrush (12x, 0.1s)', color: '#10b981' }
                        ]}
                        height={350}
                    />
                </div>
            </>
        )
    },
    {
        id: 'motors',
        title: "4. Motor & Cable Protection",
        subtitle: "Thermal Limits",
        icon: Thermometer,
        content: (
            <>
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">Motor Starting</h4>
                <p>
                    Starting a large Induction Motor draws <strong>Locked Rotor Current (LRA)</strong>, typically <InlineMath math="6 \times FLA" />, for 5-10 seconds.
                </p>
                <div className="my-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <p className="text-sm">
                        <strong>The Challenge:</strong> Distinguishing a "Healthy Start" from a "Stalled Rotor".
                    </p>
                    <p className="text-sm mt-2">
                        If the rotor is locked, cooling fans don't spin. The "Safe Stall Time" is often shorter than the "Start Time". We use a <strong>Thermal Model (49)</strong> or Speed Switch to detect this.
                    </p>
                </div>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Cable Damage Curves</h4>
                <p>
                    Cables heat up adiabatically during a short circuit. The insulation (XLPE/PVC) melts if limits are exceeded.
                </p>
                <MathBlock formula="t = \left( \frac{K \times A}{I} \right)^2" legend={[["t", "Max Time (s)"], ["A", "Area (mm²)"], ["K", "Constant (143 for XLPE)"], ["I", "Fault Current"]]} />
                
                <Hazard>
                    <strong>Copper Tape Shields:</strong> The thin copper tape shielding on MV cables is the weak link. It can melt in cycles during a ground fault. Always verify the shield's thermal limit against the <strong>Ground Overcurrent</strong> trip time.
                </Hazard>
            </>
        )
    },
    {
        id: 'ground',
        title: "5. Ground Fault Coordination",
        subtitle: "Zero Sequence Networks",
        icon: Activity,
        content: (
            <>
                <p>
                    Phase coordination is easy (<InlineMath math="I > I_{load}" />). Ground coordination is harder but offers more sensitivity because <InlineMath math="I_{load\_ground} \approx 0" />.
                </p>
                
                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Residually Connected CTs</h4>
                <p>
                    In a 3-wire system, adding the three phase currents (<InlineMath math="I_A + I_B + I_C" />) gives <InlineMath math="3I_0" /> (Ground Current).
                </p>
                
                <ProTip>
                    <strong>The CT Saturation Trap:</strong> During a heavy Phase-Phase fault (no ground current), one CT might saturate. Its output drops. The sum <InlineMath math="I_A + I_B + I_C" /> is no longer zero! This "False Residual Current" trips the Ground Relay (50N/51N).
                    <br/><br/>
                    <strong>Solution:</strong> Set the 50N instantaneous Pickup higher than the maximum "False Residual" caused by saturation, or use a time delay.
                </ProTip>
            </>
        )
    },
    {
        id: 'standards',
        title: "6. Standards & References",
        subtitle: "The Guidelines",
        icon: Layers,
        content: (
            <>
               <StandardRef code="IEEE C57.109" title="Guide for Liquid-Immersed Transformer Through-Fault-Current Duration" />
               <StandardRef code="IEEE 242 (Buff Book)" title="Protection and Coordination of Industrial and Commercial Power Systems" />
               <StandardRef code="NEC 240" title="Overcurrent Protection (National Electrical Code)" />
            </>
        )
    }
];
