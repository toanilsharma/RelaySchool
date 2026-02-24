import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart } from '../../components/TheoryDiagrams';
import { Zap, Activity, TrendingUp, Clock, AlertTriangle, CheckCircle, Wifi, ShieldAlert } from 'lucide-react';

export const DISTANCE_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Fundamentals & The Impedance Plane",
        subtitle: "Why Distance Protection Beats Overcurrent",
        icon: Zap,
        content: (
            <>
                <p>
                    Distance protection (ANSI 21) is the primary defense mechanism for high-voltage transmission lines. Unlike Overcurrent (50/51) protection, which relies on fault current magnitude, distance relays measure the <strong>impedance (Z)</strong> between the relay location and the fault point.
                </p>
                <p>
                    This distinction is critical because fault current magnitude depends heavily on the <strong>Source Impedance (<InlineMath math="Z_s" />)</strong>, which changes constantly as generators come online or lines trip. A weak source might produce a fault current lower than the full load current of a strong source, making simple overcurrent coordination impossible.
                </p>
                <p>
                    By measuring impedance, distance protection becomes independent of source strength. Since the impedance of a transmission line is uniform (e.g., <InlineMath math="0.35 \Omega/km" />), the measured impedance is directly proportional to the physical distance to the fault.
                </p>
                
                <h3 className="text-xl font-bold mt-8 mb-4">The Basic Algorithm</h3>
                <p>
                    The relay measures the voltage (<InlineMath math="V" />) and current (<InlineMath math="I" />) at its terminal and calculates <InlineMath math="Z = V/I" />. In a three-phase system, this calculation is performed for all six possible fault loops (A-G, B-G, C-G, A-B, B-C, C-A) simultaneously.
                </p>

                <MathBlock 
                    formula="Z_{meas} = \frac{V_{relay}}{I_{relay}}"
                    legend={[
                        ["Z_meas", "Measured Impedance (Ω)"],
                        ["V_relay", "Voltage phasor at Relay Point"],
                        ["I_relay", "Current phasor at Relay Point"]
                    ]}
                />

                <p>
                    Each loop impedance is compared against a pre-defined "Characteristic" on the Complex Impedance Plane (R-X Diagram). If the measured <InlineMath math="Z" /> falls <strong>inside</strong> the operating characteristic, the relay issues a trip.
                </p>

                <h3 className="text-xl font-bold mt-8 mb-4">Operating Characteristics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-slate-50 dark:bg-slate-900">
                        <strong className="text-lg text-blue-600 dark:text-blue-400 mb-2 block flex items-center gap-2">
                            <Activity className="w-5 h-5"/> Mho (Admittance)
                        </strong>
                        <p className="text-sm mb-3">
                            Classically implemented using electromechanical induction cups. On the R-X plane, it appears as a circle passing through the origin.
                        </p>
                        <ul className="text-sm list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                            <li><strong>Pros:</strong> Inherently directional. Very secure against power swings. Simple to set (Reach = Diameter).</li>
                            <li><strong>Cons:</strong> Resistive coverage shrinks as you approach the reach limit. Poor coverage for high specific-resistance ground faults near the end of the line.</li>
                        </ul>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-slate-50 dark:bg-slate-900">
                        <strong className="text-lg text-emerald-600 dark:text-emerald-400 mb-2 block flex items-center gap-2">
                            <TrendingUp className="w-5 h-5"/> Quadrilateral (Polygonal)
                        </strong>
                        <p className="text-sm mb-3">
                            The modern digital standard. Defined by four boundaries: Reactance (Top), Resistance (Right/Left), and Directional (Bottom).
                        </p>
                        <ul className="text-sm list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                            <li><strong>Pros:</strong> <InlineMath math="R" /> and <InlineMath math="X" /> settings are independent. Excellent resistive coverage even at the end of the zone.</li>
                            <li><strong>Cons:</strong> Requires careful setting to avoid Load Encroachment. More complex to test.</li>
                        </ul>
                    </div>
                </div>

                <StandardRef code="ANSI/IEEE C37.113" title="Guide for Protective Relay Applications to Transmission Lines" link="https://standards.ieee.org/ieee/37.113/" />
            </>
        )
    },
    {
        id: 'zones',
        title: "2. Stepped Distance Zones",
        subtitle: "The Philosophy of Under-reaching & Over-reaching",
        icon: Clock,
        content: (
            <>
                <p>
                    Because measurement errors exist (CT/VT ratio errors, line parameter inaccuracies), we cannot set a relay to trip exactly at 100% of the line length. If we did, a fault just <em>outside</em> the line (on the next busbar) might look like it's <em>inside</em> due to a +5% error, causing a non-selective trip.
                </p>
                <p>
                    To solve this, we use <strong>Stepped Distance Zones</strong>, grading them by reach and time.
                </p>

                <div className="space-y-6 mt-8">
                    <div className="flex gap-4 p-4 border rounded-xl border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30">
                        <div className="text-2xl font-black text-red-500">Z1</div>
                        <div>
                            <h4 className="font-bold text-red-700 dark:text-red-400">Zone 1: Instantaneous Under-Reach</h4>
                            <p className="text-sm mt-1 mb-2">
                                <strong>Setting:</strong> 80% to 85% of Line Length (<InlineMath math="Z_{line}" />)<br/>
                                <strong>Time:</strong> Instantaneous (<InlineMath math="t = 0\text{s}" />)
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                This is the primary protection. It must <strong>never</strong> over-reach the remote terminal. We leave a 15-20% safety margin to account for instrument transformer errors (typically 5-10%) and line calculation errors.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 border rounded-xl border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30">
                        <div className="text-2xl font-black text-amber-500">Z2</div>
                        <div>
                            <h4 className="font-bold text-amber-700 dark:text-amber-400">Zone 2: Time-Delayed Over-Reach</h4>
                            <p className="text-sm mt-1 mb-2">
                                <strong>Setting:</strong> 120% of Line Length (<InlineMath math="1.2 \times Z_{line}" />)<br/>
                                <strong>Time:</strong> Cordination Time Interval (typically 0.3s - 0.4s)
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Covers the remaining 15-20% of the line that Zone 1 missed. It also provides backup for the remote busbar. The time delay is mandatory to allow the remote busbar protection (or the next line's Z1) to clear their own faults first.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 border rounded-xl border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/30">
                        <div className="text-2xl font-black text-blue-500">Z3</div>
                        <div>
                            <h4 className="font-bold text-blue-700 dark:text-blue-400">Zone 3: Remote Backup</h4>
                            <p className="text-sm mt-1 mb-2">
                                <strong>Setting:</strong> 120% of (Line + Longest Adjacent Line)<br/>
                                <strong>Time:</strong> Further Delayed (0.8s - 1.0s)
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Backup for the <em>next</em> line if its protection fails. Zone 3 settings are the most dangerous; if set too large, they can encroach on load impedance and cause cascading blackouts.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <TheoryLineChart 
                        title="Stepped Distance Zones (Time vs Distance)"
                        data={[
                            { distance: 0, z1Time: 0.02, z2Time: 0.4, z3Time: 1.0 },
                            { distance: 80, z1Time: 0.02, z2Time: 0.4, z3Time: 1.0 },
                            { distance: 80.01, z2Time: 0.4, z3Time: 1.0 },
                            { distance: 100, z2Time: 0.4, z3Time: 1.0 }, // End of Line 1
                            { distance: 120, z2Time: 0.4, z3Time: 1.0 }, // 20% into Line 2
                            { distance: 120.01, z3Time: 1.0 },
                            { distance: 150, z3Time: 1.0 },
                            { distance: 220, z3Time: 1.0 }, // End of Line 2
                            { distance: 220.01 }
                        ]}
                        xKey="distance"
                        yKeys={[
                            { key: 'z1Time', name: 'Zone 1 (Instantaneous)', color: '#ef4444' },
                            { key: 'z2Time', name: 'Zone 2 (0.4s Delay)', color: '#f59e0b' },
                            { key: 'z3Time', name: 'Zone 3 (1.0s Delay)', color: '#3b82f6' }
                        ]}
                        xAxisLabel="Distance (% of Protected Line)"
                        yAxisLabel="Operating Time (Seconds)"
                        referenceLines={[
                            { x: 100, label: 'Remote Busbar', color: '#64748b' }
                        ]}
                        height={300}
                    />
                </div>

                <ProTip>
                    Always verify <strong>Infeed Effect</strong> when setting Zone 2/3. If there is a strong source at the remote bus injecting current into a fault on the adjacent line, the relay will "see" a higher impedance, essentially requiring you to set the reach <em>longer</em> to detect the fault.
                </ProTip>
            </>
        )
    },
    {
        id: 'pilot',
        title: "3. Pilot Schemes (Teleprotection)",
        subtitle: "Achieving 100% Instantaneous Coverage",
        icon: Wifi,
        content: (
            <>
                <p>
                    Basic Zone 1 only covers 80% of the line instantaneously. A fault in the last 20% is cleared in Zone 2 time (0.4s). For high-voltage grids, 0.4s is too long—it risks transient instability and severe equipment damage.
                </p>
                <p>
                    To clear 100% of line faults instantaneously using Zone 1 logic, we use <strong>Pilot Schemes</strong>. Relays at both ends communicate via fiber, PLC (Power Line Carrier), or microwave.
                </p>

                <h3 className="text-xl font-bold mt-8 mb-4">Common Schemes</h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-slate-200 dark:border-slate-800 rounded-lg">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-left">
                                <th className="p-3 border-b border-r dark:border-slate-700">Scheme</th>
                                <th className="p-3 border-b border-r dark:border-slate-700">Logic</th>
                                <th className="p-3 border-b dark:border-slate-700">Pros/Cons</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b dark:border-slate-800">
                                <td className="p-3 font-semibold text-blue-600 border-r dark:border-slate-700">DUTT (Direct Under-Reach Transfer Trip)</td>
                                <td className="p-3 border-r dark:border-slate-700">If Zone 1 operates, trip locally AND send a "Trip" signal to the remote end.</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">Simple, but doesn't cover the middle 60% if Z1 reach is short. Requires Z1 overlap.</td>
                            </tr>
                            <tr className="border-b dark:border-slate-800">
                                <td className="p-3 font-semibold text-blue-600 border-r dark:border-slate-700">POTT (Permissive Over-Reach Transfer Trip)</td>
                                <td className="p-3 border-r dark:border-slate-700">If Zone 2 (Over-reaching) sees a fault, send "Permission". If I receive Permission AND see a Z2 fault, Trip immediately.</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">Most common. Secure. Requires a duplex channel. Does not trip on comms failure (fails safe).</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-blue-600 border-r dark:border-slate-700">DCB (Directional Comparison Blocking)</td>
                                <td className="p-3 border-r dark:border-slate-700">Reverse Zone detects external fault <InlineMath math="\rightarrow" /> Send "BLOCK". Forward Zone detects fault <InlineMath math="\rightarrow" /> Wait (e.g., 20ms). If no "BLOCK" received, Trip.</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">Fastest for internal faults since no signal needs to arrive. Preferable for Power Line Carrier (PLC) since signal must travel <em>through</em> the fault.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <Hazard>
                    In <strong>Blocking Schemes (DCB)</strong>, the channel is only used during external faults. If the channel fails (broken wire), the relay will not receive a block for an external fault and will misoperate (over-trip). This is a "Dependability bias."
                </Hazard>
            </>
        )
    },
    {
        id: 'math',
        title: "4. Calculations: Setting Zone 1",
        subtitle: "A Complete Worked Example",
        icon: Activity,
        content: (
            <>
                <p>
                    Let's calculate the Zone 1 settings for a <strong>132kV Overhead Line</strong>.
                </p>

                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl text-sm mb-6">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b pb-2">Line Data</h4>
                    <div className="grid grid-cols-2 gap-y-2">
                        <span>Line Length:</span> <span className="font-mono">45 km</span>
                        <span>Positive Sequence Impedance (<InlineMath math="Z_1" />):</span> <span className="font-mono">0.11 + j0.40 Ω/km</span>
                        <span>Zero Sequence Impedance (<InlineMath math="Z_0" />):</span> <span className="font-mono">0.30 + j1.20 Ω/km</span>
                        <span>CT Ratio:</span> <span className="font-mono">1200 / 5 A</span>
                        <span>VT Ratio:</span> <span className="font-mono">132,000 / 110 V</span>
                    </div>
                </div>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 1: Calculate Primary Loop Impedance</h4>
                <p className="mb-2">Total primary impedance of the line (<InlineMath math="Z_{pri}" />):</p>
                <MathBlock 
                    formula="Z_{pri} = (0.11 + j0.40) \Omega/km \times 45km = 4.95 + j18.0 \Omega" 
                />

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 2: Calculate CT/VT Ratio Conversions</h4>
                <p>The relay sees "secondary" ohms, not primary ohms. We must convert using the impedance transformation ratio.</p>
                <MathBlock 
                    formula="Ratio_Z = \frac{Ratio_{CT}}{Ratio_{VT}} = \frac{1200/5}{132000/110} = \frac{240}{1200} = 0.2"
                />
                <p className="mt-2">Thus, <InlineMath math="Z_{sec} = Z_{pri} \times 0.2" />.</p>
                <MathBlock 
                    formula="Z_{line(sec)} = (4.95 + j18.0) \times 0.2 = 0.99 + j3.6 \Omega" 
                />

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 3: Apply Zone 1 Reach (80%)</h4>
                <p>We set Zone 1 to 80% of the line to allow a 20% margin for errors.</p>
                <MathBlock 
                    formula="Z_{set(Z1)} = 0.8 \times (0.99 + j3.6) = 0.792 + j2.88 \Omega" 
                />
                
                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Step 4: Residual Compensation (<InlineMath math="K_0" />)</h4>
                <p>For ground faults, the relay needs the <InlineMath math="K_0" /> factor to measure the correct distance.</p>
                <MathBlock 
                    formula="K_0 = \frac{Z_0 - Z_1}{3 \cdot Z_1} = \frac{(0.3+j1.2) - (0.11+j0.4)}{3(0.11+j0.4)} \approx 0.65 \angle -10^{\circ}"
                />
                
                <ProTip>
                    Most modern relays allow you to enter <InlineMath math="Z_1" /> and <InlineMath math="Z_0" /> directly as line parameters, and the relay calculates <InlineMath math="K_0" /> internally. always check if the relay asks for <InlineMath math="K_0" />, <InlineMath math="K_N" />, or <InlineMath math="R_E/R_L" /> and <InlineMath math="X_E/X_L" />. Mixing these formats is a fatal error!
                </ProTip>
            </>
        )
    },
    {
        id: 'sir',
        title: "5. Source Impedance Ratio (SIR)",
        subtitle: "Why Short Lines are Hard to Protect",
        icon: TrendingUp,
        content: (
            <>
                <p>
                    The performance of a distance relay is heavily influenced by the <strong>Source Impedance Ratio (SIR)</strong>, defined as the ratio of the source impedance behind the relay (<InlineMath math="Z_S" />) to the line impedance setting (<InlineMath math="Z_L" />).
                </p>
                <MathBlock formula="SIR = \frac{Z_{Source}}{Z_{Line}}" />
                
                <h3 className="text-xl font-bold mt-6 mb-4">The Short Line Problem</h3>
                <p>
                    <strong>Long Lines (SIR &lt; 0.5):</strong> The line impedance is dominant. The voltage at the relay during a fault is substantial (e.g., 50V). This is easy for the relay to measure accurately.
                </p>
                <p className="mt-4">
                    <strong>Short Lines (SIR &gt; 4.0):</strong> The source impedance dominates. The line impedance is tiny. During a fault at the end of the line, the voltage at the relay collapses to near zero (e.g., 2V or 3V).
                </p>
                
                <div className="my-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                    <h4 className="font-bold text-red-700 dark:text-red-400">Challenges with High SIR (Short Lines):</h4>
                    <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <li><strong>Voltage Memory Required:</strong> With near-zero voltage, the relay cannot determine directionality. It must use "Memory Voltage" (voltage stored from 3 cycles before the fault) to polarize the measurement.</li>
                        <li><strong>Transient Overreach:</strong> DC offsets in the current waveform (decaying exponentials) can cause the impedance calculation to oscillate transiently into Zone 1 for an external fault.</li>
                        <li><strong>CVT Transients:</strong> Capacitive Voltage Transformers (CVTs) have internal energy storage elements that ring during voltage collapse, generating spurious low-frequency voltages that confuse the relay.</li>
                    </ul>
                </div>
            </>
        )
    },
    {
        id: 'load',
        title: "6. Load Encroachment & Power Swings",
        subtitle: "Distinguishing Faults from Heavy Traffic",
        icon: ShieldAlert,
        content: (
            <>
                <p>
                    Relays must trip for faults but remain stable for load. On the impedance plane, "Load" usually appears as a high impedance near the Resistance axis (0°).
                </p>
                <p>
                    However, during emergency loading or lower system voltages, the load impedance drops (<InlineMath math="Z = V/I" />, so high <InlineMath math="I" /> = low <InlineMath math="Z" />). If it drops enough, it can enter the large backup Zone 3 circle, causing a <strong>false trip</strong>.
                </p>

                <h3 className="text-xl font-bold mt-8 mb-4">Case Study: The 2003 Northeast Blackout</h3>
                <p>
                    On August 14, 2003, a sagging line in Ohio contacted a tree and tripped. This shifted massive power flow onto parallel lines. The Zone 3 distance relays on these parallel lines saw this massive current as a "remote fault" (low impedance) and tripped unnecessarily.
                </p>
                <p>
                    This triggered a cascading failure that left 55 million people in the dark. The root cause was partly the inability of simple Mho characteristics to distinguish between heavy resistive load and inductive faults.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">The Solution: Load Blinders</h4>
                <p>
                    Modern protection ("Lens" or "Peanut" characteristics, or simple "Blinders") cuts a notch out of the operating characteristic along the resistive axis. This allows the relay to accommodate heavy loads (<InlineMath math="R_{load}" />) while still detecting faults (<InlineMath math="R_{fault} + jX_{fault}" />).
                </p>

                <div className="mt-8 mb-8">
                     <TheoryLineChart 
                        title="Impedance Plane: Load Encroachment vs Fault"
                        data={[
                            { r: 0, characteristic: 10,  },
                            { r: 2, characteristic: 9.8, fault: 5 },
                            { r: 4, characteristic: 9.2, fault: 8 },
                            { r: 6, characteristic: 8,   fault: 12 },
                            { r: 8, characteristic: 6 },
                            { r: 9, characteristic: 4 },
                            { r: 9.8, characteristic: 2 },
                            { r: 10, characteristic: 0, load: 3  },
                            { r: 12, load: 2 },
                            { r: 15, load: 1.5 }
                            
                        ]}
                        xKey="r"
                        yKeys={[
                            { key: 'characteristic', name: 'Mho Circle (Backup Zone)', color: '#ef4444' },
                            { key: 'fault', name: 'Fault Trajectory', color: '#3b82f6' },
                            { key: 'load', name: 'Load Trajectory (Dropping V)', color: '#f59e0b' }
                        ]}
                        xAxisLabel="Resistance (R)"
                        yAxisLabel="Reactance (X)"
                        referenceLines={[
                            { x: 8, label: 'Load Blinder Setting', color: '#10b981' }
                        ]}
                        height={350}
                    />
                </div>

                <h3 className="text-xl font-bold mt-8 mb-4">Power Swings</h3>
                <p>
                    A stable power swing (oscillation between generators) causes the impedance vector to move slowly across the R-X diagram. A fault causes it to jump instantly.
                </p>
                <p>
                    <strong>Out-of-Step Blocking (68):</strong> The relay measures the rate of change of impedance (<InlineMath math="\Delta Z / \Delta t" />). If the timer expires between an outer and inner blinder before the impedance enters the trip zone, it declares a Swing and blocks tripping.
                </p>
                
                <Hazard>
                    Do not block Zone 1 for power swings indiscriminately! If a genuine fault occurs <em>during</em> a power swing, the relay must still trip. This requires sophisticated "Unblocking" logic.
                </Hazard>
            </>
        )
    },
    {
        id: 'standards',
        title: "7. Standards & References",
        subtitle: "Industry Guidelines",
        icon: CheckCircle,
        content: (
            <>
                <p>
                   For further deep-dive reading, the following international standards govern the application and testing of distance protection.
                </p>
                <StandardRef code="IEEE C37.113-2015" title="IEEE Guide for Protective Relay Applications to Transmission Lines" />
                <StandardRef code="IEC 60255-121" title="Functional requirements for distance protection" />
                <StandardRef code="IEC 61850-7-4" title="Logical Nodes for protection functions (PDIS, POPT, PSCH)" />
                
                <h4 className="font-bold text-lg mt-6 mb-2">Bibliography</h4>
                <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>Blackburn, J. L., & Domin, T. J. (2014). <em>Protective Relaying: Principles and Applications</em>. CRC Press.</li>
                    <li>Ziegler, G. (2011). <em>Numerical Distance Protection: Principles and Applications</em>. Siemens Publicis.</li>
                    <li>Schweitzer, E. O., et al. "A Fresh Look at Limits to the Sensitivity of Line Protection." <em>SEL Technical Papers</em>.</li>
                </ul>
            </>
        )
    }
];
