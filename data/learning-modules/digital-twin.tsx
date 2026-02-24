import React from 'react';
import { MathBlock, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { Globe, FileCode, Layers, Server, ShieldCheck, Zap, Database, Boxes, Cpu, Activity } from 'lucide-react';

export const DIGITAL_TWIN_THEORY_CONTENT = [
    {
        id: 'overview',
        title: "1. The Digital Substation Application",
        subtitle: "From Hardwired to Fiber",
        icon: Globe,
        content: (
            <>
                <p>
                    For 100 years, substations relied on point-to-point copper wiring. A single bay could have 500+ wires connecting CTs to relays, relays to breakers, and breakers to SCADA. 
                    The <strong>Digital Substation (IEC 61850)</strong> replaces tons of copper with a few strands of fiber optic glass.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <strong className="block text-slate-900 dark:text-white mb-2 text-lg">Legacy (Hardwired)</strong>
                        <ul className="text-sm list-disc pl-4 space-y-2 text-slate-600 dark:text-slate-400">
                            <li><strong>CT Circuits:</strong> High energy, lethal open-circuit voltage. Runs from yard to control room.</li>
                            <li><strong>Tripping:</strong> 110VDC signals. Latency ~10ms. Relies on auxiliary contact reliability.</li>
                            <li><strong>Diagnostics:</strong> None. You only know a wire is broken when the breaker fails to trip.</li>
                        </ul>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <strong className="block text-blue-600 dark:text-blue-400 mb-2 text-lg">Digital (IEC 61850)</strong>
                        <ul className="text-sm list-disc pl-4 space-y-2 text-slate-600 dark:text-slate-400">
                            <li><strong>Process Bus:</strong> Digitized values at the source. Fiber is safe to touch.</li>
                            <li><strong>Tripping:</strong> GOOSE messages &lt;3ms. Constant supervision (heartbeat).</li>
                            <li><strong>Diagnostics:</strong> "Self-Monitoring." Comm fail alarms appear instantly.</li>
                        </ul>
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'architecture',
        title: "2. The 3-Layer Architecture",
        subtitle: "Station, Bay, and Process",
        icon: Layers,
        content: (
            <>
                <p>
                    IEC 61850 defines a logical hierarchy that separates functionality from physical hardware.
                </p>

                <div className="space-y-6 mt-6">
                    <div className="flex gap-4 p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/10">
                        <div className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded h-fit"><Database className="w-6 h-6 text-emerald-700"/></div>
                        <div>
                            <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Station Level (Layer 3)</h4>
                            <p className="text-sm mt-1 mb-2"><strong>Role:</strong> SCADA, HMI, Gateway, Engineering PC.</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                Uses <strong>MMS (Manufacturing Message Specification)</strong> over TCP/IP to collect slow-speed data (Measurements, Reports, Disturbance Files) and send commands (Select-Before-Operate).
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/10">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded h-fit"><Cpu className="w-6 h-6 text-blue-700"/></div>
                        <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-300">Bay Level (Layer 2)</h4>
                            <p className="text-sm mt-1 mb-2"><strong>Role:</strong> Protection Relays (IEDs), Bay Control Units (BCUs).</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                The brains. They make sub-cycle decisions based on data from below. They talk horizontally using <strong>GOOSE</strong> (Trips, Interlocks).
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-900/10">
                        <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded h-fit"><Boxes className="w-6 h-6 text-amber-700"/></div>
                        <div>
                            <h4 className="font-bold text-amber-900 dark:text-amber-300">Process Level (Layer 1)</h4>
                            <p className="text-sm mt-1 mb-2"><strong>Role:</strong> Merging Units (MUs), Switchgear Controllers.</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                <strong>Merging Units:</strong> Convert analog CT/VT signals to digital <strong>Sampled Values (SV)</strong> streams (IEC 61850-9-2).<br/>
                                <strong>Switchgear Interface:</strong> Digitizes breaker status (52a/b) and trip coils.
                            </p>
                        </div>
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'scl',
        title: "3. The SCL Ecosystem",
        subtitle: "Reading the File Extensions",
        icon: FileCode,
        content: (
            <>
                <p>
                    In the old days, you needed a CAD drawing to understand the system. In IEC 61850, the "drawing" is an XML text file called <strong>SCL (Substation Configuration Language)</strong>.
                </p>
                <div className="overflow-x-auto my-6">
                    <table className="w-full text-sm text-left border rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-3">File Ext</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="p-3 font-mono font-bold text-purple-600">.ICD</td>
                                <td className="p-3">IED Capability Description</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">Template from manufacturer. "I am a GE Relay and I <em>can</em> do X, Y, Z."</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono font-bold text-blue-600">.SSD</td>
                                <td className="p-3">System Specification Description</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">The topology definition. "This station has 2 buses and 4 breakers." (Vendor neutral).</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono font-bold text-emerald-600">.SCD</td>
                                <td className="p-3">Substation Configuration Description</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">The Master File. Contains ALL IEDs, their IP addresses, and how they talk to each other (GOOSE comms matrix).</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono font-bold text-amber-600">.CID</td>
                                <td className="p-3">Configured IED Description</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">The specific file loaded into ONE relay. Extracted from the SCD.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <ProTip>
                    <strong>Never edit a .CID file directly!</strong> Always edit the system-wide .SCD file and re-export the CIDs. If you edit a CID manually, the relay will understand, but the rest of the system (and the documentation) will be out of sync.
                </ProTip>
            </>
        )
    },
    {
        id: 'virtual',
        title: "4. Virtual Isolation & Testing",
        subtitle: "No More Lifted Wires",
        icon: Activity,
        content: (
            <>
                <p>
                    Testing a conventional panel involves "sliding links" or "lifting wires" to isolate trips. This is risky; leave a link open, and protection fails. Leave a CT open, and it explodes.
                </p>
                <p>
                    Digital substations use <strong>Logical Isolation</strong> defined in IEC 61850 Edition 2.
                </p>

                <h4 className="font-bold text-lg mt-6 text-slate-800 dark:text-slate-200">Simulation Mode (LPHD.Sim)</h4>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm my-4">
                    <p className="mb-2">
                        Every GOOSE and SV packet has a "Simulation" bit in its header.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>In Service:</strong> Relay ignores packets with Sim=True.</li>
                        <li><strong>In Test:</strong> You flip a software switch on the Relay (LPHD.Sim = True). Now it <em>listens</em> to Sim=True packets (from your test set) and <em>ignores</em> real packets.</li>
                    </ul>
                </div>
                <p>
                    This allows you to test a live relay without physically touching a single wire. The rest of the substation ignores your test signals automatically.
                </p>
            </>
        )
    },
    {
        id: 'benefits',
        title: "5. Benefits & ROI",
        subtitle: "Is it worth the complexity?",
        icon: Zap,
        content: (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="border border-green-200 bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                        <strong className="text-green-800 dark:text-green-300 block mb-1">Safety</strong>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Eliminates 110VDC and 5A CT circuits from the control room. No risk of open CTs. No risk of battery grounds.
                        </p>
                    </div>
                    <div className="border border-green-200 bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                        <strong className="text-green-800 dark:text-green-300 block mb-1">Cost</strong>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            <strong>80% reduction</strong> in copper cabling. Smaller trenches. Smaller control room (IEDs can be distributed in field kiosks).
                        </p>
                    </div>
                    <div className="border border-green-200 bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                        <strong className="text-green-800 dark:text-green-300 block mb-1">Flexibility</strong>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Need to add a new interlock? Just draw a line in the software and re-upload the SCD. No wiring changes/drilling panels.
                        </p>
                    </div>
                    <div className="border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg">
                        <strong className="text-amber-800 dark:text-amber-300 block mb-1">The Challenge</strong>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Requires new skills. Protection engineers must understand IP addresses, switches, and SCL files.
                        </p>
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'standards',
        title: "6. Standards & References",
        subtitle: "The Library",
        icon: Layers,
        content: (
            <>
               <StandardRef code="IEC 61850-6" title="Configuration description language for communication in substations (SCL)" />
               <StandardRef code="IEC 61850-9-2" title="Sampled Values (Process Bus)" />
               <StandardRef code="IEC 61850-7-4" title="Logical Nodes and Data Classes" />
               <StandardRef code="IEC 61850-5" title="Communication requirements for functions and device models" />
            </>
        )
    }
];
