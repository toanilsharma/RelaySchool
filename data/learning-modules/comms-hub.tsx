import React from 'react';
import { MathBlock, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { Network, Server, ShieldCheck, Clock, Lock, Database, Wifi, Globe, Share2, Layers } from 'lucide-react';

export const COMMS_HUB_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Industrial Ethernet Fundamentals",
        subtitle: "From Office LANs to Substation WANs",
        icon: Network,
        content: (
            <>
                <p>
                    In the past, substations relied on thousands of copper wires for signaling. Today, a single fiber optic cable can carry all protection, control, and metering data. This shift uses <strong>Industrial Ethernet</strong>, but it's not the same as the Wi-Fi in a coffee shop.
                </p>
                <p>
                    Commercial Ethernet is "Best Effort"—if a packet drops, it re-sends. In protection, a 5ms delay can mean equipment destruction. Substation networks must be <strong>Deterministic</strong> and <strong>Redundant</strong>.
                </p>

                <h3 className="text-xl font-bold mt-8 mb-4">The OSI Model in Power Systems</h3>
                <p>
                    IEC 61850 maps differently to the 7-Layer OSI model depending on the urgency of the message.
                </p>
                
                <div className="overflow-x-auto my-6">
                    <table className="w-full text-sm text-left border rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                            <tr>
                                <th className="p-3">Protocol</th>
                                <th className="p-3">OSI Layers</th>
                                <th className="p-3">Performance</th>
                                <th className="p-3">Use Case</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr className="bg-blue-50 dark:bg-blue-900/10">
                                <td className="p-3 font-bold">GOOSE</td>
                                <td className="p-3">Layer 2 (Data Link)</td>
                                <td className="p-3">&lt; 3ms</td>
                                <td className="p-3">Tripping, Interlocking</td>
                            </tr>
                            <tr className="bg-blue-50 dark:bg-blue-900/10">
                                <td className="p-3 font-bold">Sampled Values (SV)</td>
                                <td className="p-3">Layer 2 (Data Link)</td>
                                <td className="p-3">&lt; 1ms</td>
                                <td className="p-3">Digitized CT/VT waveforms</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold">MMS</td>
                                <td className="p-3">Layer 3 (Network/IP)</td>
                                <td className="p-3">&gt; 100ms</td>
                                <td className="p-3">SCADA, Reporting, Files</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <ProTip>
                    Notice that GOOSE and SV skip the IP layer (Layer 3). They don't have IP addresses! They use <strong>Multicast MAC Addresses</strong> (e.g., 01:0C:CD:01:00:01) to "publish" to the network switch, which then filters them to subscribers.
                </ProTip>
            </>
        )
    },
    {
        id: 'protocols',
        title: "2. The IEC 61850 Protocol Suite",
        subtitle: "Speaking the Language of the Grid",
        icon: Database,
        content: (
            <>
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 mt-4">GOOSE (Generic Object Oriented Substation Event)</h4>
                <p>
                    GOOSE replaces hardwired copper signals. When a breaker opens, the IED "Publishes" a GOOSE message. Other IEDs "Subscribe" to it. All this happens in milliseconds.
                </p>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm my-4">
                    <strong>The Retransmission Mechanism:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Event occurs ($t=0$). Send 1st packet immediately.</li>
                        <li>Send 2nd packet after 2ms (redundancy).</li>
                        <li>Send 3rd packet after 4ms.</li>
                        <li>Send subsequents at 8ms, 16ms... up to a "Heartbeat" of 1s.</li>
                    </ul>
                    <p className="mt-2 text-slate-500">This "burst" ensures the message gets through even if the first packet is corrupted by EMI.</p>
                </div>

                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 mt-6">MMS (Manufacturing Message Specification)</h4>
                <p>
                    MMS is the slow, reliable Client-Server protocol used by SCADA. It travels over TCP/IP, so it works across routers and WANs. It carries:
                </p>
                <ul className="list-disc pl-5 mt-2 mb-4 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>Analogue measurements (MW, MVAR, kV)</li>
                    <li>Switchgear status reports (Position, Quality)</li>
                    <li>Buffered Reports (Sequences of events)</li>
                </ul>
            </>
        )
    },
    {
        id: 'redundancy',
        title: "3. Network Redundancy (PRP & HSR)",
        subtitle: "Zero Recovery Time",
        icon: Share2,
        content: (
            <>
                <p>
                    In office networks, Spanning Tree Protocol (RSTP) handles loops. If a cable breaks, RSTP re-calculates the path in approx 50ms - 2 seconds. For protection, <strong>50ms is too slow</strong> (a fault must clear in &lt;100ms).
                </p>
                <p>
                    We use "Bumpless Redundancy" protocols defined in IEC 62439-3: PRP and HSR.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-6">
                    <div>
                        <h4 className="font-bold text-blue-600 dark:text-blue-400">PRP (Parallel Redundancy Protocol)</h4>
                        <p className="text-sm mt-2 mb-4">
                            The IED has two ports (LAN A and LAN B). It sends every packet simultaneously on <strong>both</strong> independent networks.
                        </p>
                        <p className="text-sm">
                            The receiver accepts the first packet to arrive and discards the duplicate. If LAN A fails, LAN B delivers the packet with <strong>Zero Switchover Time</strong>.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-purple-600 dark:text-purple-400">HSR (High-availability Seamless Redundancy)</h4>
                        <p className="text-sm mt-2 mb-4">
                            Devices are connected in a Ring. The IED has two ports and acts as a switch.
                        </p>
                        <p className="text-sm">
                            Packets are sent in <strong>both directions</strong> around the ring. The receiver gets two copies. If the ring breaks, the other path still works instantly.
                        </p>
                    </div>
                </div>

                <Hazard>
                    <strong>HSR Bandwidth Warning:</strong> Because every packet is duplicated and circulates the ring, HSR effectively halves the available network bandwidth. Do not use HSR for high-volume Sampled Values (SV) on 100Mbps networks.
                </Hazard>
            </>
        )
    },
    {
        id: 'sync',
        title: "4. Time Synchronization (PTP)",
        subtitle: "Microsecond Accuracy with IEEE 1588",
        icon: Clock,
        content: (
            <>
                <p>
                    For SCADA events, 1ms accuracy (via SNTP) is enough. But for <strong>Sampled Values</strong> and <strong>Synchrophasors</strong>, we need $\mu s$ (microsecond) accuracy.
                </p>
                <p>
                    If two Merging Units on different phases are not synchronized to within $4 \mu s$, the calculated Angle Error will cause differential protection to misoperate.
                </p>
                
                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg my-4">
                    <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h5 className="font-bold">Precision Time Protocol (PTP v2)</h5>
                        <p className="text-sm mt-1">
                            Defined in IEEE 1588. A "Grandmaster Clock" (GPS) sends sync messages. Every Ethernet switch in the path acts as a "Transparent Clock," measuring the exact "Residence Time" of the packet inside the switch and adding it to a correction field.
                        </p>
                        <p className="text-sm mt-2 font-mono text-slate-500">
                            Accuracy Target: &lt; 1 &#181;s (Power Profile)
                        </p>
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'cybersecurity',
        title: "5. Cybersecurity & Case Studies",
        subtitle: "Ukraine 2015 & Stuxnet",
        icon: ShieldCheck,
        content: (
            <>
                <p>
                    Grid modernization has a dark side: Connect a substation to a WAN, and it becomes a target.
                </p>
                
                <h3 className="text-xl font-bold mt-8 mb-4">Case Study: Ukraine Power Grid Hack (2015)</h3>
                <p>
                    On December 23, 2015, attackers (Sandworm group) remotely seized control of SCADA systems in three distribution companies.
                </p>
                <ul className="list-disc pl-5 mt-2 mb-6 space-y-2 text-sm">
                    <li><strong>Entry:</strong> Spear-phishing emails containing BlackEnergy malware.</li>
                    <li><strong>Reconnaissance:</strong> Attackers lurked for 6 months, learning the network topology.</li>
                    <li><strong>Attack:</strong> They remotely opened breakers at 30 substations, cutting power to 225,000 customers.</li>
                    <li><strong>Kill Switch:</strong> They deployed "KillDisk" wiper malware to erase the SCADA servers and disabled the UPS systems to blind the operators.</li>
                </ul>

                <h3 className="text-xl font-bold mt-8 mb-4">Defense in Depth (IEC 62351)</h3>
                <p>
                    We cannot rely on "Air Gaps" anymore.
                </p>
                <div className="space-y-4">
                    <div className="border-l-4 border-emerald-500 pl-4">
                        <strong className="block text-emerald-700 dark:text-emerald-400">RBAC (Role Based Access Control)</strong>
                        <span className="text-sm">Centralized LDAP/RADIUS authentication. No shared "admin/admin" passwords.</span>
                    </div>
                    <div className="border-l-4 border-emerald-500 pl-4">
                        <strong className="block text-emerald-700 dark:text-emerald-400">Firmware Signing</strong>
                        <span className="text-sm">IEDs must reject unsigned firmware updates to prevent rootkits.</span>
                    </div>
                    <div className="border-l-4 border-emerald-500 pl-4">
                        <strong className="block text-emerald-700 dark:text-emerald-400">VPNs & Firewalls</strong>
                        <span className="text-sm">Encrypting traffic between substations and Control Centers (IEC 60870-5-104 secure).</span>
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'future',
        title: "6. Future Trends: SDN & Virtualization",
        subtitle: "Software Defined Power Grids",
        icon: Globe,
        content: (
            <>
                <p>
                    The next generation of substations will move away from hardware switches and proprietary IED boxes.
                </p>
                
                <h4 className="font-bold text-lg mt-4 mb-2">Software Defined Networking (SDN)</h4>
                <p className="mb-4">
                    Instead of letting switches learn MAC addresses automatically (risky), an SDN Controller pre-programs the "Flow Tables" of every switch. Only authorized GOOSE flows are allowed. If an unauthorized laptop plugs in, it gets zero traffic. This is the ultimate cybersecurity whitelist.
                </p>

                <h4 className="font-bold text-lg mt-4 mb-2">Virtual Protection (vPAC)</h4>
                <p>
                    Running protection algorithms as Docker containers on ruggedized servers (IEC 61850 Server). This allows "Protection as a Service," centralized backups, and instant hardware replacement without recoordination.
                </p>
            </>
        )
    },
    {
        id: 'standards',
        title: "7. Standards & References",
        subtitle: "The Library",
        icon: Layers,
        content: (
            <>
                <StandardRef code="IEC 61850-9-2" title="Process Bus communication (Sampled Values)" />
                <StandardRef code="IEC 62439-3" title="Industrial Communication Networks - High Availability (PRP/HSR)" />
                <StandardRef code="IEEE 1588-2008" title="Precision Clock Synchronization (PTP)" />
                <StandardRef code="NERC CIP" title="Critical Infrastructure Protection (North American Standards)" />
            </>
        )
    }
];
