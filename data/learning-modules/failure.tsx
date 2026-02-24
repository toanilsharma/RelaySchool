import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryWaveform, TheoryFlowDiagram } from '../../components/TheoryDiagrams';
import { Zap, AlertTriangle, Activity, Magnet, TrendingDown, Battery, ShieldAlert, BookOpen } from 'lucide-react';

export const FAILURE_THEORY_CONTENT = [
    {
        id: 'mechanics',
        title: "1. CT Saturation Mechanics",
        subtitle: "The B-H Curve & Hysteresis",
        icon: Magnet,
        content: (
            <>
                <p>
                    Current Transformers (CTs) are the eyes of the protection system. If they blink (saturate), the relay is blind.
                </p>
                <div className="flex flex-col md:flex-row gap-6 my-6 items-center">
                    <div className="flex-1">
                        <p>
                            A CT works by inducing a magnetic flux (<InlineMath math="\phi" />) in its iron core proportional to the primary current. This flux drives the secondary current.
                        </p>
                        <p className="mt-4">
                            Every magnetic material has a limit. As you increase the current (Force <InlineMath math="H" />), the flux density (<InlineMath math="B" />) increases linearly at first. Eventually, all magnetic domains align, and the core hits the <strong>Knee Point</strong>.
                        </p>
                    </div>
                </div>

                <h4 className="font-bold text-lg mt-4 text-slate-800 dark:text-slate-200">The Saturation Phenomenon</h4>
                <p>
                    Beyond the knee point, the core behaves like air (<InlineMath math="\mu_r \approx 1" />). The inductance collapses. In this state, the transformer cannot transfer energy to the secondary side.
                </p>
                <p>
                    The secondary current output drops to zero for the portion of the cycle where flux is above the limit. This creates "chopped" waveforms.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Remanent Flux & Hysteresis</h4>
                <p>
                    When a fault clears, the flux doesn't always return to zero. If the breaker opens at a current zero (flux peak), the core acts like a permanent magnet, retaining <strong>Remanent Flux</strong> (<InlineMath math="\phi_r" />).
                </p>
                <p>
                    If an Auto-Reclose occurs 500ms later into a fault of the same polarity, standard CTs may saturate instantly (in &lt; 2ms) because they started with the "tank half full" of flux.
                </p>

                <TheoryWaveform
                    title="CT Secondary Output: Normal vs Saturated (Clipped Waveform)"
                    waves={[
                        { label: 'Normal (Low I)', color: '#3b82f6', amplitude: 1.0, phase: 0 },
                        { label: 'Saturated (High I)', color: '#ef4444', amplitude: 3.0, phase: 0, saturateAfter: 0.01 },
                    ]}
                    duration={0.06}
                />

                <div className="mt-8 mb-4">
                     <TheoryLineChart 
                        title="CT B-H Curve (Saturation Dynamics)"
                        data={[
                            { h: -10, b: -10 },
                            { h: -8, b: -9 },
                            { h: -6, b: -8 },
                            { h: -4, b: -6 },
                            { h: 0, b: 0 },
                            { h: 4, b: 6 },
                            { h: 6, b: 8 },
                            { h: 8, b: 9 }, // Knee Point region
                            { h: 10, b: 9.5 },
                            { h: 15, b: 9.8 },
                            { h: 20, b: 10 }
                        ]}
                        xKey="h"
                        yKeys={[
                            { key: 'b', name: 'Flux Density (B)', color: '#3b82f6' }
                        ]}
                        xAxisLabel="Magnetic Field Strength (H) ~ Current"
                        yAxisLabel="Flux Density (B) ~ Voltage"
                        referenceLines={[
                            { x: 8, label: 'Knee Point', color: '#f59e0b' },
                            { x: -8, label: 'Knee Point', color: '#f59e0b' }
                        ]}
                        height={300}
                    />
                </div>

                <ProTip>
                    <strong>TPY and TPZ</strong> class CTs (IEC 61869) have air gaps in the core to reduce remanence to near zero. They are mandatory for high-speed Auto-Reclose schemes near large generators.
                </ProTip>
            </>
        )
    },
    {
        id: 'classes',
        title: "2. Accuracy Classes (ANSI vs. IEC)",
        subtitle: "Decoding the Nameplate",
        icon: BookOpen,
        content: (
            <>
                <p>
                    Engineers must select the right CT class to match the application. A metering CT (high accuracy, low saturation voltage) used for protection will explode the meter during a fault.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">ANSI C-Class (IEEE C57.13)</h4>
                        <p className="text-sm italic mb-2">Example: <strong>C800</strong></p>
                        <p className="text-sm">
                            "C" means leakage flux is negligible (Calculable). 800 means the CT can deliver <strong>800 Volts</strong> to the secondary without exceeding 10% error at 20x nominal current.
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">IEC P-Class (IEC 61869-2)</h4>
                        <p className="text-sm italic mb-2">Example: <strong>5P20</strong></p>
                        <p className="text-sm">
                            <strong>5</strong> = 5% Composite Error Limit.<br/>
                            <strong>P</strong> = Protection Class.<br/>
                            <strong>20</strong> = Accuracy Limit Factor (20x Nominal Current).
                        </p>
                    </div>
                </div>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Transient Classes (IEC 61869-2)</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-3">Class</th>
                                <th className="p-3">Core Construction</th>
                                <th className="p-3">Remanence Limit</th>
                                <th className="p-3">Application</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="p-3 font-bold">TPX</td>
                                <td className="p-3">Closed Core (No Gap)</td>
                                <td className="p-3">None (High)</td>
                                <td className="p-3">General Protection (if oversighted)</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold">TPY</td>
                                <td className="p-3">Small Air Gap</td>
                                <td className="p-3">&lt; 10%</td>
                                <td className="p-3">Line Protection with Auto-Reclose</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold">TPZ</td>
                                <td className="p-3">Large Linear Air Gap</td>
                                <td className="p-3">Negligible</td>
                                <td className="p-3">Busbar Differential (avoids saturation)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </>
        )
    },
    {
        id: 'calc',
        title: "3. Worked Example: CT Sizing",
        subtitle: "Calculating the Saturation Voltage",
        icon: Activity,
        content: (
            <>
                <p>
                    Let's verify if a <strong>C400, 1200/5A</strong> CT is adequate for a specific feeder application.
                </p>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-5 rounded-xl text-sm mb-6">
                    <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-3 border-b border-amber-200 pb-2">Input Data</h4>
                    <div className="grid grid-cols-2 gap-y-2">
                        <span>Max Fault Current (<InlineMath math="I_f" />):</span> <span className="font-mono">25,000 A (Primary)</span>
                        <span>CT Ratio:</span> <span className="font-mono">1200 / 5</span>
                        <span>CT Internal Resistance (<InlineMath math="R_{ct}" />):</span> <span className="font-mono">0.61 <InlineMath math="\Omega" /></span>
                        <span>Lead Resistance (<InlineMath math="R_{lead}" />):</span> <span className="font-mono">0.80 <InlineMath math="\Omega" /> (200ft #10 AWG)</span>
                        <span>Relay Burden (<InlineMath math="R_{relay}" />):</span> <span className="font-mono">0.10 <InlineMath math="\Omega" /></span>
                        <span>X/R Ratio:</span> <span className="font-mono">15 (High DC Offset)</span>
                    </div>
                </div>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 1: Calculate Secondary Fault Current</h4>
                <MathBlock formula="I_{sec} = \frac{25000}{240} = 104.17 \text{ Amps}" />
                
                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 2: Calculate Total Burden</h4>
                <p>The voltage the CT must push is <InlineMath math="V = I \times R_{total}" />.</p>
                <MathBlock formula="R_{total} = R_{ct} + R_{lead} + R_{relay} = 0.61 + 0.80 + 0.10 = 1.51 \Omega" />

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 3: Calculate Required Voltage (Steady State)</h4>
                <MathBlock formula="V_{required} = I_{sec} \times R_{total} = 104.17 \times 1.51 = 157.3 \text{ Volts}" />
                <p>
                    Since <InlineMath math="157.3V < 400V" /> (Class C400), this CT is fine for AC symmetrical faults.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 4: Check for Transient Saturation</h4>
                <p>
                    With an X/R of 15, the DC offset can effectively multiply the flux requirement by <InlineMath math="(1 + X/R)" />.
                </p>
                <MathBlock formula="V_{transient} = V_{required} \times (1 + 15) = 157.3 \times 16 = 2516 \text{ Volts}" />
                
                <Hazard>
                    <strong>FAIL!</strong> The CT is rated for <strong>400V</strong>, but the transient requirement is <strong>2516V</strong>. This CT <em>will</em> saturate heavily during the first few cycles of an asymmetric fault.
                </Hazard>
                
                <p className="mt-4">
                    <strong>Solution:</strong> We cannot get a 2500V CT (unrealistic). We must ensure the relay is transient-proof (e.g., uses saturation detectors) or increase the CT ratio (e.g., use 2000/5A) to reduce secondary current and burden voltage.
                </p>
            </>
        )
    },
    {
        id: 'wiring',
        title: "4. Common Wiring Errors",
        subtitle: "Human Factor Failures",
        icon: AlertTriangle,
        content: (
            <>
                <p>
                    More relays fail due to screwdriver errors than internal faults.
                </p>
                
                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-[1fr_2fr] gap-4 p-4 border rounded bg-white dark:bg-slate-900 border-red-200 dark:border-red-900">
                        <strong className="text-red-600">Open CT Secondary</strong>
                        <div>
                            <p className="text-sm">
                                <strong>Physics:</strong> A CT acts as a current source. If the path is open (<InlineMath math="R = \infty" />), it generates infinite voltage (<InlineMath math="V = I \times \infty" />) to try to push the current.
                            </p>
                            <p className="text-sm mt-1">
                                <strong>Result:</strong> Voltage spikes to kV levels. Insulation breaks down. Arcing. Fire. <strong>Life Safety Hazard.</strong>
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] gap-4 p-4 border rounded bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900">
                        <strong className="text-amber-600">Reversed Polarity</strong>
                        <div>
                            <p className="text-sm">
                                <strong>Physics:</strong> Current enters the "Polarity Mark" (dot) on primary, leaves Polarity Mark on secondary.
                            </p>
                            <p className="text-sm mt-1">
                                <strong>Result:</strong> Differential relays see "Through Current" as "Internal Fault". Instantaneous trip on load up. Directional relays look backward.
                            </p>
                        </div>
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'dc-failure',
        title: "5. DC System & Trip Coil Supervision",
        subtitle: "The Heartbeat of the Substation",
        icon: Battery,
        content: (
            <>
                <p>
                    Relays are useless if the Breaker Trigger doesn't work. The Trip Coil (TC) is the solenoid that releases the latch.
                </p>

                <h4 className="font-bold text-lg mt-4 mb-2">Trip Circuit Supervision (ANSI 74)</h4>
                <p>
                    A tiny current (<InlineMath math="\approx 1mA" />) is continuously passed through the Trip Coil to verify continuity.
                </p>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm my-4">
                    <strong>Logic:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>While Breaker Closed:</strong> Monitor via 52a contact. If current stops <InlineMath math="\rightarrow" /> Alarm (Broken Wire/Coil).</li>
                        <li><strong>While Breaker Open:</strong> Monitor via 52b contact. </li>
                    </ul>
                </div>

                <h4 className="font-bold text-lg mt-6 mb-2">DC Ground Faults</h4>
                <p>
                    Substation batteries (125VDC) are floating (ungrounded). If a positive wire touches ground, nothing happens (no path).
                </p>
                <Hazard>
                    If a <strong>Negative</strong> wire <em>also</em> touches ground later, you create a short circuit across the battery. Alternatively, a double ground fault can bypass the relay contact, energizing the trip coil directly and causing a "Ghost Trip."
                </Hazard>

                <TheoryFlowDiagram
                    title="Trip Circuit Supervision (ANSI 74) Logic"
                    blocks={[
                        { id: 'batt', label: 'DC Battery', sub: '125V DC', color: '#f59e0b' },
                        { id: 'relay', label: 'Relay Contact', sub: '86/Trip', color: '#3b82f6' },
                        { id: 'coil', label: 'Trip Coil', sub: 'Solenoid', color: '#ef4444' },
                        { id: 'cb', label: 'Breaker', sub: 'Opens', color: '#10b981' },
                    ]}
                    arrows={[
                        { from: 'batt', to: 'relay', label: '110VDC' },
                        { from: 'relay', to: 'coil', label: 'Close' },
                        { from: 'coil', to: 'cb', label: 'Latch' },
                    ]}
                />
            </>
        )
    },
    {
        id: 'standards',
        title: "6. Standards & References",
        subtitle: "The Rules",
        icon: BookOpen,
        content: (
            <>
               <StandardRef code="IEEE C37.110" title="Guide for the Application of Current Transformers Used for Protective Relaying Purposes" />
               <StandardRef code="IEC 61869-2" title="Instrument Transformers - Part 2: Additional requirements for current transformers" />
               <StandardRef code="ANSI/IEEE C57.13" title="Standard Requirements for Instrument Transformers" />
            </>
        )
    }
];
