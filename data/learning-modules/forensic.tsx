import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram, TheoryWaveform, TheoryTimeline } from '../../components/TheoryDiagrams';
import { Layers, Activity, TrendingUp, Search, FileText, Binary, Sigma, Cpu, AlertTriangle, FileCode } from 'lucide-react';

export const FORENSIC_THEORY_CONTENT = [
    {
        id: 'intro',
        title: "1. The Art of Forensic Analysis",
        subtitle: "Post-Mortem of a Power System Fault",
        icon: Search,
        content: (
            <>
                <p>
                    When a transmission line trips, the operator's first question is "Can I re-energize?" To answer this confidently, protection engineers perform <strong>Forensic Analysis</strong>.
                </p>
                <p>
                    A fault is a massive release of energy. By capturing the voltage and current waveforms during the event (Oscillography), we can determine the fault type, location, and cause. This process is akin to a "Black Box" investigation in aviation.
                </p>
                <div className="my-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
                    <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Key Questions to Answer</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                        <li><strong>What happened?</strong> (Phase A-Ground vs Phase B-C)</li>
                        <li><strong>Where was it?</strong> (5km from substation vs 45km)</li>
                        <li><strong>Did protection work correctly?</strong> (Trip in 25ms vs 150ms)</li>
                        <li><strong>Was the breaker healthy?</strong> (Pole Scatter &lt; 5ms?)</li>
                    </ul>
                </div>

                <TheoryFlowDiagram
                    title="Forensic Analysis Workflow (Post-Fault Investigation)"
                    blocks={[
                        { id: 'event', label: 'Fault Event', sub: 'Trip Signal', color: '#ef4444' },
                        { id: 'capture', label: 'DFR / Relay', sub: 'COMTRADE', color: '#3b82f6' },
                        { id: 'analysis', label: 'Waveform View', sub: 'V, I, Trip', color: '#a855f7' },
                        { id: 'result', label: 'Report', sub: 'Type, Location', color: '#10b981' },
                    ]}
                    arrows={[
                        { from: 'event', to: 'capture', label: 'Record' },
                        { from: 'capture', to: 'analysis', label: 'Load' },
                        { from: 'analysis', to: 'result', label: 'Analyze' },
                    ]}
                />
            </>
        )
    },
    {
        id: 'comtrade',
        title: "2. The COMTRADE Format",
        subtitle: "IEEE C37.111 Standard",
        icon: FileCode,
        content: (
            <>
                <p>
                    The universal language of fault records is <strong>COMTRADE</strong> (Common Format for Transient Data Exchange). A record consists of at least two files:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                        <strong className="text-lg text-purple-600 dark:text-purple-400 mb-2 block flex items-center gap-2">
                            <FileText className="w-5 h-5"/> Configuration (.CFG)
                        </strong>
                        <p className="text-sm mb-2">A text file describing the data structure.</p>
                        <ul className="text-xs list-disc pl-4 space-y-1 text-slate-500">
                            <li>Station Name & ID</li>
                            <li>Number of Channels (Analog & Digital)</li>
                            <li>Channel Names (IA, IB, IC, VA...)</li>
                            <li>Sampling Rate (e.g., 1000 Hz)</li>
                            <li>Scaling Factors (Primary Ratio)</li>
                        </ul>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                        <strong className="text-lg text-emerald-600 dark:text-emerald-400 mb-2 block flex items-center gap-2">
                            <Binary className="w-5 h-5"/> Data (.DAT)
                        </strong>
                        <p className="text-sm mb-2">The raw sample values.</p>
                        <ul className="text-xs list-disc pl-4 space-y-1 text-slate-500">
                            <li>Usually binary for compactness.</li>
                            <li>Contains simple integers (0-65535 or signed).</li>
                            <li>Must be multiplied by scaling factors from .CFG to get Amps/Volts.</li>
                        </ul>
                    </div>
                </div>

                <ProTip>
                    Always check the <strong>Sampling Rate</strong> in the .CFG file. Older relays sample at 16 samples/cycle (960Hz), which is enough for impedance but misses high-frequency transients. Modern Digital Fault Recorders (DFRs) sample at &gt;10kHz.
                </ProTip>

                <TheoryFlowDiagram
                    title="COMTRADE File Structure (IEEE C37.111)"
                    blocks={[
                        { id: 'cfg', label: '.CFG', sub: 'Text Metadata', color: '#a855f7' },
                        { id: 'dat', label: '.DAT', sub: 'Binary Samples', color: '#10b981' },
                        { id: 'hdr', label: '.HDR', sub: 'Header (Optional)', color: '#64748b' },
                        { id: 'inf', label: '.INF', sub: 'Info (Optional)', color: '#64748b' },
                    ]}
                    arrows={[
                        { from: 'cfg', to: 'dat', label: 'Defines' },
                    ]}
                />
            </>
        )
    },
    {
        id: 'dsp',
        title: "3. Digital Signal Processing",
        subtitle: "From Samples to Phasors",
        icon: Cpu,
        content: (
            <>
                <p>
                    Relays don't see sine waves; they see a stream of dots (samples). To protect the grid, they must extract the <strong>Fundamental (50/60Hz) Component</strong> from these noisy samples.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">The Discrete Fourier Transform (DFT)</h4>
                <p>
                    The relay uses a recursive DFT or Cosine Filter to calculate the Magnitude ($|I|$) and Angle ($\theta$) of the current phasor.
                </p>

                <MathBlock 
                    formula="X_{real} = \frac{2}{N} \sum_{k=0}^{N-1} x_k \cos\left(\frac{2\pi k}{N}\right)"
                    legend={[
                        ["x_k", "Sample value at step k"],
                        ["N", "Samples per cycle"],
                        ["X_real", "Real part of phasor"]
                    ]}
                />
                <MathBlock 
                    formula="X_{imag} = -\frac{2}{N} \sum_{k=0}^{N-1} x_k \sin\left(\frac{2\pi k}{N}\right)"
                />
                
                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Aliasing & Anti-Aliasing</h4>
                <p>
                    The <strong>Nyquist Theorem</strong> states you must sample at least twice the highest frequency of interest (<InlineMath math="f_s > 2f_{max}" />).
                </p>
                <p>
                    If a 900Hz transient enters a relay sampling at 1000Hz, it will appear as a 100Hz "ghost" signal (Aliasing). Analog "Anti-Aliasing" Low-Pass Filters (RC circuits) are placed before the A/D converter to remove these high frequencies.
                </p>

                <TheoryWaveform
                    title="Three-Phase Waveform with A-G Fault at t=0.3s"
                    waves={[
                        { label: 'Phase A', color: '#ef4444', amplitude: 1.0, phase: 0, saturateAfter: 0.3 },
                        { label: 'Phase B', color: '#eab308', amplitude: 1.0, phase: -120 },
                        { label: 'Phase C', color: '#3b82f6', amplitude: 1.0, phase: 120 },
                    ]}
                    duration={0.5}
                />
            </>
        )
    },
    {
        id: 'symmetrical',
        title: "4. Symmetrical Components Deep Dive",
        subtitle: "The Mathematician's Scalpel",
        icon: Sigma,
        content: (
            <>
                <p>
                    Dr. Fortescue (1918) proved that any unbalanced 3-phase system can be decomposed into three balanced systems. This is the foundation of modern fault analysis.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                        <strong className="block text-green-700 dark:text-green-400 mb-2">Positive Sequence (1)</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Balanced, A-B-C rotation. Represents "Load" and "Generation". 
                        </p>
                        <div className="mt-2 font-mono text-xs bg-white dark:bg-slate-900 p-1 rounded border dark:border-slate-700">
                           I1 ≈ I_load
                        </div>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <strong className="block text-amber-700 dark:text-amber-400 mb-2">Negative Sequence (2)</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Balanced, A-C-B (Reverse) rotation. Represents <strong>Unbalance</strong>.
                        </p>
                        <div className="mt-2 font-mono text-xs bg-white dark:bg-slate-900 p-1 rounded border dark:border-slate-700">
                           I2 High during L-L
                        </div>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                        <strong className="block text-red-700 dark:text-red-400 mb-2">Zero Sequence (0)</strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            In-phase (<InlineMath math="A+B+C" />). Represents <strong>Ground Current</strong>.
                        </p>
                        <div className="mt-2 font-mono text-xs bg-white dark:bg-slate-900 p-1 rounded border dark:border-slate-700">
                           I0 = IG / 3
                        </div>
                    </div>
                </div>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Fault Signatures Table</h4>
                <div className="overflow-x-auto mt-2">
                    <table className="w-full text-sm text-center border rounded-lg">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-2 text-left">Fault Type</th>
                                <th className="p-2 text-green-600">Pos (I1)</th>
                                <th className="p-2 text-amber-600">Neg (I2)</th>
                                <th className="p-2 text-red-600">Zero (I0)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="p-2 text-left font-bold">Phase A-Ground (L-G)</td>
                                <td className="p-2">High</td>
                                <td className="p-2">High</td>
                                <td className="p-2">High</td>
                            </tr>
                            <tr>
                                <td className="p-2 text-left font-bold">Phase B-C (L-L)</td>
                                <td className="p-2">High</td>
                                <td className="p-2">High</td>
                                <td className="p-2 text-slate-400">Zero</td>
                            </tr>
                            <tr>
                                <td className="p-2 text-left font-bold">3-Phase (L-L-L)</td>
                                <td className="p-2">High</td>
                                <td className="p-2 text-slate-400">Zero</td>
                                <td className="p-2 text-slate-400">Zero</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </>
        )
    },
    {
        id: 'location',
        title: "5. Calculating Fault Location",
        subtitle: "The Reactance Method",
        icon: Activity,
        content: (
            <>
                <p>
                    Identifying "Trip" is easy. Finding the tower number where the insulator flashed over requires math. The simplest robust method is likely the <strong>Reactance Method</strong>.
                </p>
                
                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Why Reactance?</h4>
                <p>
                    Fault paths contain resistance (Arc Resistance + Tower Footing Resistance), which is variable and unpredictable. The line's <strong>Inductive Reactance ($X_L$)</strong>, however, is purely a physical property of the conductor geometry and length.
                </p>
                <p>
                    By ignoring the resistive part of <InlineMath math="Z" /> and focusing on <InlineMath math="Im(Z) = X" />, we eliminate errors caused by arc resistance.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Worked Example</h4>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl text-sm mb-4">
                    <p className="mb-2"><strong>Given:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Line Impedance: <InlineMath math="0.4 \\Omega/km" /> (Reactance)</li>
                        <li>Fault Report: <InlineMath math="V_{relay} = 4000V \\angle 0^{\\circ}" /></li>
                        <li>Fault Report: <InlineMath math="I_{relay} = 2000A \\angle -70^{\\circ}" /></li>
                    </ul>
                </div>

                <p>Step 1: Calculate Measured Impedance <InlineMath math="Z_{meas}" /></p>
                <MathBlock formula="Z_{meas} = \\frac{4000 \\angle 0^{\\circ}}{2000 \\angle -70^{\\circ}} = 2.0 \\angle 70^{\\circ} \\Omega" />
                
                <p>Step 2: Convert to Rectangular Form (<InlineMath math="R + jX" />)</p>
                <MathBlock formula="Z_{meas} = 2.0(\\cos 70^{\\circ} + j\\sin 70^{\\circ}) = 0.68 + j1.88 \\Omega" />
                
                <p>Step 3: Extract Reactance (<InlineMath math="X" />) and Divide by Line Reactance (<InlineMath math="X_{line}" /> per km)</p>
                <MathBlock formula="Distance = \\frac{X_{measured}}{X_{per\\_km}} = \\frac{1.88 \\Omega}{0.4 \\Omega/km} = 4.7 \\text{ km}" />

                <Hazard>
                    This simple calculation ignores Infeed and Load Flow pre-fault, but it is accurate enough for a first-pass estimate. Modern relays use "Two-Ended" algorithms (using data from both ends) to cancel out these errors.
                </Hazard>
            </>
        )
    },
    {
        id: 'dc',
        title: "6. Transient Analysis (DC Offset)",
        subtitle: "Why Breakers Fail",
        icon: TrendingUp,
        content: (
            <>
                <p>
                    Fault current is rarely a perfect sine wave. If a fault occurs when the voltage sine wave is crossing zero (<InlineMath math="V=0" />), the inductance forces the current to maintain continuity, generating a massive DC component.
                </p>
                <p>
                    This <strong>DC Offset</strong> decays exponentially based on the system's <InlineMath math="X/R" /> ratio.
                </p>

                <MathBlock formula="i(t) = I_{peak} [\\sin(\\omega t + \\alpha - \\phi) + e^{-\\frac{t}{\\tau}} \\sin(\\phi - \\alpha)]" />

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">The Danger: Current Zero Crossing</h4>
                <p>
                    Circuit Breakers extinguish arcs at <strong>Current Zero</strong>. If the DC offset is high enough (e.g., &gt;100%), the fault current waveform may become fully offset and <em>never cross zero</em> for several cycles.
                </p>
                <div className="mt-8 mb-6">
                     <TheoryLineChart 
                        title="Fault Current with Full DC Offset (X/R = 14)"
                        data={Array.from({length: 100}, (_, index) => {
                            const t = index * 0.001; // 0 to 100ms
                            const omega = 2 * Math.PI * 60; // 60Hz
                            const tau = 0.037; // X/R = 14 -> L/R ~ 37ms
                            const ac = Math.sin(omega * t - Math.PI/2);
                            const dc = Math.exp(-t / tau);
                            return {
                                time: index,
                                total: ac + dc,
                                acOnly: ac,
                                dcOnly: dc
                            };
                        })}
                        xKey="time"
                        yKeys={[
                            { key: 'total', name: 'Asymmetrical Current', color: '#ef4444' },
                            { key: 'acOnly', name: 'Symmetrical AC', color: '#94a3b8' },
                            { key: 'dcOnly', name: 'Decaying DC Component', color: '#f59e0b' }
                        ]}
                        xAxisLabel="Time (ms)"
                        yAxisLabel="Current (Per Unit)"
                        referenceLines={[
                            { y: 0, color: '#64748b' }
                        ]}
                        height={350}
                    />
                </div>
                <p>
                    If a breaker tries to open during this "Delayed Current Zero" condition, the arc will not extinguish, and the breaker may explode. Forensic analysis checks if the protection tripped too fast for the breaker's capability.
                </p>
            </>
        )
    },
    {
        id: 'standards',
        title: "7. Standards & References",
        subtitle: "Official Guidelines",
        icon: Layers,
        content: (
            <>
                <StandardRef code="IEEE C37.111" title="Common Format for Transient Data Exchange (COMTRADE)" />
                <StandardRef code="IEEE C37.114" title="Guide for Determining Fault Location on AC Transmission and Distribution Lines" />
                <StandardRef code="IEC 60255-24" title="Electrical Relays - Part 24: Common format for transient data exchange" />
            </>
        )
    }
];
