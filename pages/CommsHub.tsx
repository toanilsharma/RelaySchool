
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Network, Play, Pause, RefreshCw, ShieldAlert, Layers, Activity, 
    AlertTriangle, FileCode, ChevronRight, Info, Zap, ShieldCheck, 
    Filter, Eye, Globe, Lock, ShieldX, Terminal, Cpu, Share2,
    HelpCircle, X, BookOpen, Database, Search, ArrowDown, Download,
    Server, Wifi, AlertOctagon, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
type Protocol = 'GOOSE' | 'SV' | 'MMS' | 'PTP';
type ScenarioType = 'NORMAL' | 'STORM' | 'REPLAY' | 'VLAN_ERR';

interface PacketField {
    label: string;
    value: string;
    desc: string;
    isError?: boolean;
}

interface Packet {
    id: number;
    timestamp: number;
    protocol: Protocol;
    src: string;
    dst: string;
    summary: string;
    latency: number; // ms
    isMalicious?: boolean;
    isDelayed?: boolean;
    rawHex: string[];
    decoded: { layer: string; fields: PacketField[] }[];
}

// --- CONSTANTS ---
const IED_MAC = "00:50:56:C0:00:01";
const CONTROLLER_MAC = "00:50:56:C0:00:02";
const ATTACKER_MAC = "DE:AD:BE:EF:00:00";
const GOOSE_ETHERTYPE = "0x88B8";

// --- GENERATORS ---
let globalSeq = 0;
let globalStNum = 10;

const generatePacket = (scenario: ScenarioType, time: number): Packet => {
    globalSeq++;
    const isStorm = scenario === 'STORM';
    const isReplay = scenario === 'REPLAY';
    const isVlanErr = scenario === 'VLAN_ERR';

    // Probability Logic
    const rand = Math.random();
    let protocol: Protocol = 'GOOSE';
    let src = IED_MAC;
    let dst = "01:0C:CD:01:00:01"; // Multicast
    let summary = "";
    let latency = isStorm ? Math.random() * 15 + 2 : Math.random() * 2 + 0.5; // Normal < 3ms, Storm > 20ms
    let isMalicious = false;
    let isDelayed = latency > 4.0;
    
    // Attack Injection
    if (isReplay && rand > 0.8) {
        // Inject Replay Packet
        isMalicious = true;
        src = ATTACKER_MAC;
        summary = `Trip Cmd (st: ${globalStNum}, sq: ${globalSeq - 50})`; // Old sequence
    } else if (isVlanErr && rand > 0.7) {
        summary = "Status Change (No VLAN Tag)";
        isDelayed = true; // Untagged frames get delayed
        latency += 10;
    } else {
        // Normal Traffic
        if (rand > 0.9) {
            protocol = 'MMS';
            dst = CONTROLLER_MAC;
            summary = "Report (Buffered)";
        } else if (rand > 0.6) {
            protocol = 'SV';
            summary = "9-2LE Sample Stream";
        } else {
            protocol = 'GOOSE';
            summary = `Trip Cmd (st: ${globalStNum}, sq: ${globalSeq})`;
        }
    }

    // Build Decode Data
    const decoded = [
        {
            layer: "Ethernet II",
            fields: [
                { label: "Destination", value: dst, desc: "Multicast MAC for GOOSE" },
                { label: "Source", value: src, desc: "IED MAC Address", isError: src === ATTACKER_MAC }
            ]
        }
    ];

    if (protocol === 'GOOSE') {
        decoded.push({
            layer: "802.1Q (VLAN)",
            fields: [
                { label: "Priority (PCP)", value: isVlanErr && !isMalicious ? "0 (Best Effort)" : "4 (Critical)", desc: "QoS Priority", isError: isVlanErr && !isMalicious },
                { label: "VLAN ID", value: "100", desc: "Protection LAN" }
            ]
        });
        decoded.push({
            layer: "IEC 61850-8-1",
            fields: [
                { label: "APPID", value: "0x0001", desc: "Application ID" },
                { label: "gocbRef", value: "IED1/LLN0$GO$Trip", desc: "Control Block Reference" },
                { label: "stNum", value: globalStNum.toString(), desc: "State Number (Increments on Event)" },
                { label: "sqNum", value: (isMalicious ? globalSeq - 50 : globalSeq).toString(), desc: "Sequence Number (Heartbeat)", isError: isMalicious },
            ]
        });
    }

    return {
        id: globalSeq,
        timestamp: time,
        protocol,
        src,
        dst,
        summary,
        latency,
        isMalicious,
        isDelayed,
        rawHex: Array.from({length: 16}, () => Math.floor(Math.random()*255).toString(16).padStart(2,'0').toUpperCase()),
        decoded
    };
};

// --- VISUAL COMPONENTS ---

const TopologyView = ({ scenario, packetCount }: { scenario: ScenarioType, packetCount: number }) => {
    // Visual Pulse for Traffic
    const [pulse, setPulse] = useState(false);
    useEffect(() => {
        const i = setInterval(() => setPulse(p => !p), 500);
        return () => clearInterval(i);
    }, []);

    const isStorm = scenario === 'STORM';
    const linkColor = isStorm ? 'stroke-red-500' : 'stroke-slate-400 dark:stroke-slate-600';
    const linkWidth = isStorm ? 4 : 2;

    return (
        <div className="relative h-64 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center select-none">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>

            {/* SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Switch to IED */}
                <line x1="50%" y1="50%" x2="20%" y2="80%" className={linkColor} strokeWidth={linkWidth} strokeDasharray={isStorm ? "4 4" : ""} />
                {/* Switch to Gateway */}
                <line x1="50%" y1="50%" x2="80%" y2="80%" className={linkColor} strokeWidth={linkWidth} />
                {/* Switch to Attacker (Only if Replay) */}
                {scenario === 'REPLAY' && (
                    <line x1="50%" y1="50%" x2="50%" y2="20%" className="stroke-red-500" strokeWidth="2" strokeDasharray="5 5" />
                )}
                
                {/* Traffic Particles */}
                <circle r="4" fill={isStorm ? "#ef4444" : "#3b82f6"}>
                    <animateMotion 
                        dur={isStorm ? "0.2s" : "1s"} 
                        repeatCount="indefinite"
                        path="M 100 200 L 250 150" 
                    />
                </circle>
            </svg>

            {/* Devices */}
            
            {/* Switch (Center) */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-slate-800 rounded-lg border-2 ${isStorm ? 'border-red-500 shadow-[0_0_20px_red]' : 'border-blue-500'} flex flex-col items-center z-10`}>
                <Network className={`w-6 h-6 ${isStorm ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
                <span className="text-[10px] font-bold text-white mt-1">Switch</span>
            </div>

            {/* IED (Bottom Left) */}
            <div className="absolute bottom-8 left-16 flex flex-col items-center z-10">
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-600">
                    <Cpu className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1">Prot Relay</span>
            </div>

            {/* Gateway (Bottom Right) */}
            <div className="absolute bottom-8 right-16 flex flex-col items-center z-10">
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-600">
                    <Server className="w-6 h-6 text-purple-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1">Gateway</span>
            </div>

            {/* Attacker (Top) - Conditional */}
            {scenario === 'REPLAY' && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 animate-bounce">
                    <div className="p-3 bg-red-900/80 rounded-lg border border-red-500">
                        <ShieldX className="w-6 h-6 text-red-200" />
                    </div>
                    <span className="text-[10px] font-bold text-red-400 mt-1">INTRUDER</span>
                </div>
            )}

            {/* Stats Overlay */}
            <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500 bg-slate-900/80 p-2 rounded">
                <div>PPS: {isStorm ? (2000 + Math.random()*500).toFixed(0) : (5 + Math.random()*2).toFixed(0)}</div>
                <div>BW: {isStorm ? '98%' : '2%'}</div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const CommsHub = () => {
    const [scenario, setScenario] = useState<ScenarioType>('NORMAL');
    const [isRunning, setIsRunning] = useState(false);
    const [packets, setPackets] = useState<Packet[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [filter, setFilter] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);

    // Simulation Loop
    useEffect(() => {
        let interval: any;
        if (isRunning) {
            const rate = scenario === 'STORM' ? 50 : 1000; // Storm = 20 packets/sec, Normal = 1 packet/sec
            interval = setInterval(() => {
                const pkt = generatePacket(scenario, Date.now());
                setPackets(prev => {
                    const next = [pkt, ...prev].slice(0, 200); // Keep last 200
                    return next;
                });
            }, rate);
        }
        return () => clearInterval(interval);
    }, [isRunning, scenario]);

    // Scenario Logic
    const toggleScenario = (s: ScenarioType) => {
        if (scenario === s) {
            setScenario('NORMAL');
        } else {
            setScenario(s);
            if (!isRunning) setIsRunning(true);
        }
    };

    const selectedPacket = packets.find(p => p.id === selectedId) || packets[0];

    // Stats
    const latencyAvg = useMemo(() => {
        const recent = packets.slice(0, 20);
        if (!recent.length) return 0;
        return recent.reduce((sum, p) => sum + p.latency, 0) / recent.length;
    }, [packets]);

    return (
        <div className="flex flex-col space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
            
            {/* TOP BAR: Controls & Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                
                {/* 1. Master Control */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                            <Monitor className="w-4 h-4 text-blue-500" /> Network Simulator
                        </h2>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsRunning(!isRunning)} 
                                className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                    isRunning 
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                                    : 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-500/20'
                                }`}
                            >
                                {isRunning ? <><Pause className="w-3 h-3"/> PAUSE</> : <><Play className="w-3 h-3"/> START LIVE</>}
                            </button>
                            <button onClick={() => setPackets([])} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Inject Scenario</div>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => toggleScenario('STORM')}
                                className={`p-2 rounded border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${scenario==='STORM' ? 'bg-red-500 text-white border-red-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                            >
                                <Activity className="w-3 h-3" /> STORM
                            </button>
                            <button 
                                onClick={() => toggleScenario('REPLAY')}
                                className={`p-2 rounded border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${scenario==='REPLAY' ? 'bg-purple-500 text-white border-purple-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                            >
                                <ShieldAlert className="w-3 h-3" /> REPLAY
                            </button>
                            <button 
                                onClick={() => toggleScenario('VLAN_ERR')}
                                className={`p-2 rounded border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${scenario==='VLAN_ERR' ? 'bg-orange-500 text-white border-orange-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                            >
                                <Layers className="w-3 h-3" /> VLAN
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Topology Visualizer */}
                <div className="lg:col-span-2">
                    <TopologyView scenario={scenario} packetCount={packets.length} />
                </div>

                {/* 3. Critical Metrics */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Trip Latency (Avg)</div>
                        <div className={`text-2xl font-mono font-bold ${latencyAvg > 4 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                            {latencyAvg.toFixed(2)} ms
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full transition-all duration-300 ${latencyAvg > 4 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, (latencyAvg/10)*100)}%`}}></div>
                        </div>
                        <div className="text-[8px] text-slate-400 mt-1 flex justify-between">
                            <span>Target: &lt;4ms</span>
                            <span>{latencyAvg > 4 ? 'VIOLATION' : 'OK'}</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Active Threat</div>
                        {scenario === 'NORMAL' ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                                <ShieldCheck className="w-4 h-4" /> System Secure
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-bold animate-pulse">
                                <AlertOctagon className="w-4 h-4" /> {scenario} DETECTED
                            </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                            {scenario === 'STORM' && "Network flooded. Latency exceeding protection limits."}
                            {scenario === 'REPLAY' && "Duplicate sequence numbers detected. Check Auth."}
                            {scenario === 'VLAN_ERR' && "Priority tag missing. Traffic buffered in switch."}
                            {scenario === 'NORMAL' && "Traffic nominal. GOOSE/SV flows within specs."}
                        </p>
                    </div>
                </div>
            </div>

            {/* BOTTOM AREA: Sniffer & Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
                
                {/* PACKET LIST (Wireshark Style) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                        <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" /> Live Traffic Capture
                        </h3>
                        <div className="flex gap-2">
                            <input 
                                placeholder="Filter (e.g. GOOSE)" 
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                            <div className="text-[10px] font-mono text-slate-400 self-center">{packets.length} Pkts</div>
                        </div>
                    </div>
                    
                    {/* List Header */}
                    <div className="grid grid-cols-[60px_80px_60px_1fr_60px] px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                        <div>Time</div>
                        <div>Source</div>
                        <div>Proto</div>
                        <div>Info</div>
                        <div className="text-right">Latency</div>
                    </div>

                    {/* Virtual List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px]" ref={scrollRef}>
                        {packets.filter(p => p.protocol.includes(filter.toUpperCase()) || p.summary.includes(filter)).map((p) => (
                            <div 
                                key={p.id}
                                onClick={() => setSelectedId(p.id)}
                                className={`grid grid-cols-[60px_80px_60px_1fr_60px] px-4 py-1.5 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors ${
                                    selectedId === p.id 
                                    ? 'bg-blue-600 text-white' 
                                    : p.isMalicious 
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40' 
                                        : p.isDelayed
                                            ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-300 hover:bg-amber-100'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <div className="opacity-70">{(p.timestamp % 10000).toString()}</div>
                                <div className="truncate">{p.src === ATTACKER_MAC ? '⚠️ ATTACKER' : 'IED_01'}</div>
                                <div className={`font-bold ${p.protocol === 'GOOSE' ? 'text-purple-500' : 'text-emerald-500'} ${selectedId === p.id ? '!text-white' : ''}`}>{p.protocol}</div>
                                <div className="truncate">{p.summary}</div>
                                <div className={`text-right font-bold ${p.latency > 4 ? 'text-red-500' : 'text-green-500'} ${selectedId === p.id ? '!text-white' : ''}`}>{p.latency.toFixed(1)}ms</div>
                            </div>
                        ))}
                        {packets.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 space-y-4">
                                <Network className="w-16 h-16" />
                                <p>No Traffic. Click "START LIVE" to simulate.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* PACKET INSPECTOR (Right Side) */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-lg">
                    <div className="p-3 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                        <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Search className="w-4 h-4" /> Deep Packet Inspection
                        </h3>
                        {selectedPacket && <span className="text-[10px] font-mono text-blue-400">Frame #{selectedPacket.id}</span>}
                    </div>

                    {selectedPacket ? (
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {selectedPacket.decoded.map((layer, i) => (
                                <div key={i} className="animate-fade-in">
                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <ChevronRight className="w-3 h-3" /> {layer.layer}
                                    </div>
                                    <div className="space-y-1 pl-3 border-l border-slate-700">
                                        {layer.fields.map((f, j) => (
                                            <div key={j} className={`group flex justify-between items-start text-xs p-1 rounded hover:bg-white/5 ${f.isError ? 'bg-red-500/20 text-red-400 border border-red-500/50' : ''}`}>
                                                <div>
                                                    <div className="text-slate-400 font-medium">{f.label}</div>
                                                    <div className="text-[10px] text-slate-600 hidden group-hover:block">{f.desc}</div>
                                                </div>
                                                <div className={`font-mono ${f.isError ? 'font-bold text-red-400' : 'text-slate-200'}`}>{f.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="mt-6 pt-4 border-t border-slate-800">
                                <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase">Raw Hex Dump</div>
                                <div className="font-mono text-[10px] text-slate-600 break-all leading-relaxed bg-black/50 p-2 rounded">
                                    {selectedPacket.rawHex.join(' ')} ...
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
                            Select a packet to inspect headers.
                        </div>
                    )}
                </div>

            </div>

            {/* --- NEW SECTION: EDUCATIONAL CONTEXT --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-500" /> Digital Substation Physics
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        This tool simulates the <strong>Station Bus (IEC 61850-8-1)</strong> and <strong>Process Bus (IEC 61850-9-2)</strong>. Unlike hardwired copper, Ethernet networks are probabilistic. 
                        A "Trip" is no longer a DC voltage; it is a GOOSE packet that must fight for bandwidth. You can see how <strong>Congestion</strong> creates <strong>Jitter</strong>, causing protection to fail or block.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-purple-500" /> Real-World Application
                    </h3>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                        <li className="flex gap-2"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div><span><strong>Network Engineering:</strong> Learn why VLAN Priority (802.1p) is mandatory for GOOSE/SV to survive data storms.</span></li>
                        <li className="flex gap-2"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div><span><strong>Cyber Defense:</strong> Recognize attacks. A jump in `sqNum` or a MAC address mismatch indicates an intruder.</span></li>
                        <li className="flex gap-2"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div><span><strong>Troubleshooting:</strong> Use "Deep Packet Inspection" to verify dataset alignment between IEDs.</span></li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-amber-500" /> Why It Matters Now
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        The industry is shifting to <strong>Digital Substations</strong>. Copper wiring is being replaced by Fiber Optic cables. 
                        Modern Protection Engineers must be hybrid professionals: part Electrical Engineer, part Network Architect. 
                        Understanding packet switching, PTP timing, and cybersecurity is no longer optional—it's a core competency.
                    </p>
                </div>
            </div>

        </div>
    );
};

export default CommsHub;
