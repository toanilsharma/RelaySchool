import React, { useState, useEffect, useRef } from 'react';
import { Network, Activity, Clock, Server, AlertTriangle, ShieldAlert, Zap, Settings, Play, RotateCcw, AlertOctagon, Info, CheckCircle, XCircle, Share2, Layers, Cpu, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES & INTERFACES ---

type ScenarioId = 'STORM' | 'VLAN' | 'PTP' | 'MU_FAIL' | 'CUSTOM';

interface SimState {
    congestion: number; // 0-100%
    vlanPriority: boolean; // PCP enabled
    ptpDrift: number; // ms
    muStatus: 'OK' | 'FREEZE' | 'DROP';
    faultInjected: boolean;
}

interface LogEvent {
    id: number;
    time: number;
    source: string;
    message: string;
    type: 'INFO' | 'WARN' | 'CRITICAL';
}

// --- HELPER COMPONENTS ---

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1">
        <HelpCircle className="w-3 h-3 text-slate-400 hover:text-blue-500 cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {text}
        </div>
    </div>
);

const DelayBar = ({ label, value, threshold, max }: { label: string, value: number, threshold: number, max: number }) => {
    const width = Math.min(100, (value / max) * 100);
    const color = value > threshold ? 'bg-red-500' : value > threshold * 0.8 ? 'bg-amber-500' : 'bg-emerald-500';
    
    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                <span className={value > threshold ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'}>{value.toFixed(2)}ms</span>
            </div>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-300 dark:border-slate-700">
                {/* Threshold Marker */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10 opacity-30" style={{ left: `${(threshold/max)*100}%` }}></div>
                <motion.div 
                    className={`h-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>0ms</span>
                <span className="font-semibold text-slate-600 dark:text-slate-400">Limit: {threshold}ms</span>
                <span>{max}ms</span>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: SV WAVEFORM RECONSTRUCTOR ---
const SVReconstructor = ({ congestion, ptpDrift, muStatus }: { congestion: number, ptpDrift: number, muStatus: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [quality, setQuality] = useState(100);

    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        let animationFrameId: number;

        const render = () => {
            frame++;
            const w = cvs.width;
            const h = cvs.height;
            const midY = h / 2;
            
            ctx.clearRect(0, 0, w, h);

            // Draw Grid
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke(); // Zero crossing

            // Parameters
            const freq = 0.05; // Visual frequency
            const amp = h * 0.4;
            const speed = 2;
            const phaseShift = ptpDrift * 0.5; // Simulate PTP drift as phase shift (horizontal offset)

            // 1. Draw Ideal Analog Wave (Ghost)
            ctx.beginPath();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.3;
            for (let x = 0; x < w; x++) {
                const y = midY + Math.sin((x + frame * speed) * freq) * amp;
                if (x===0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;

            // 2. Draw Sampled Values (Dots)
            const sampleRate = 10; // Pixels per sample (simulating 80 samples/cycle)
            const points: {x: number, y: number}[] = [];
            let packetsLost = 0;
            let totalPackets = 0;

            for (let x = 0; x < w; x += sampleRate) {
                totalPackets++;
                
                // Calc Ideal Y
                // PTP Drift shifts the X time base
                let y = midY + Math.sin((x + frame * speed + phaseShift * 20) * freq) * amp;

                // Congestion Simulation (Packet Loss)
                // Probability of drop increases with congestion > 80%
                const dropProb = Math.max(0, (congestion - 50) / 100); 
                const isDropped = Math.random() < dropProb || muStatus === 'DROP';
                
                // Freeze Simulation
                if (muStatus === 'FREEZE') {
                    y = midY + Math.sin((0 + frame * speed) * freq) * amp; // Stuck at one value (simplified)
                }

                if (!isDropped) {
                    points.push({x, y});
                    // Draw Sample Dot
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(x-1.5, y-1.5, 3, 3);
                } else {
                    packetsLost++;
                    // Draw "Missing" X marker
                    ctx.strokeStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.moveTo(x-2, midY-2); ctx.lineTo(x+2, midY+2);
                    ctx.moveTo(x+2, midY-2); ctx.lineTo(x-2, midY+2);
                    ctx.stroke();
                }
            }

            // 3. Draw Reconstructed Wave (Digital to Analog)
            // Connect the dots. If gap is too large, it looks jagged.
            ctx.beginPath();
            ctx.strokeStyle = packetsLost > 2 ? '#ef4444' : '#10b981'; // Red trace if bad quality
            ctx.lineWidth = 2;
            if (points.length > 0) {
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
            }
            ctx.stroke();

            // Update stats
            setQuality(Math.floor(((totalPackets - packetsLost) / totalPackets) * 100));

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [congestion, ptpDrift, muStatus]);

    return (
        <div className="relative h-40 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <canvas ref={canvasRef} width={400} height={160} className="w-full h-full" />
            <div className="absolute top-2 right-2 text-[10px] font-mono bg-slate-900/80 px-2 py-1 rounded text-white border border-slate-800">
                Samples: 4800 Hz
            </div>
            <div className={`absolute bottom-2 left-2 text-xs font-bold px-2 py-1 rounded ${quality < 90 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                SV Integrity: {quality}%
            </div>
        </div>
    );
};

const ScenarioCard = ({ id, active, onClick, title, subtitle, icon: Icon, colorClass }: any) => (
    <button 
        onClick={onClick}
        className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
            active 
            ? `${colorClass.bg} ${colorClass.border} ring-1 ring-offset-1 dark:ring-offset-slate-900 ${colorClass.ring}` 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
    >
        <div className="flex items-start justify-between mb-1">
            <div className={`font-bold text-sm ${active ? colorClass.text : 'text-slate-700 dark:text-slate-200'}`}>
                {title}
            </div>
            <Icon className={`w-4 h-4 ${active ? colorClass.text : 'text-slate-400'}`} />
        </div>
        <div className={`text-[10px] ${active ? colorClass.text + ' opacity-80' : 'text-slate-500'}`}>
            {subtitle}
        </div>
    </button>
);

const DigitalSubstation = () => {
    // --- STATE ---
    const [scenario, setScenario] = useState<ScenarioId>('CUSTOM');
    const [simState, setSimState] = useState<SimState>({
        congestion: 10,
        vlanPriority: true,
        ptpDrift: 0,
        muStatus: 'OK',
        faultInjected: false
    });
    const [logs, setLogs] = useState<LogEvent[]>([]);
    const [relayStatus, setRelayStatus] = useState<'NORMAL' | 'PICKUP' | 'TRIP' | 'BLOCKED' | 'MISOP'>('NORMAL');
    const [breakerStatus, setBreakerStatus] = useState<'CLOSED' | 'OPEN'>('CLOSED');
    
    // Live calculated metrics
    const [gooseDelay, setGooseDelay] = useState(2); // ms
    const [svJitter, setSvJitter] = useState(0.1); // ms
    
    // --- SIMULATION ENGINE (The "Reality" Logic) ---
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. NETWORK PHYSICS MODEL
            // Delay = Base + (QueueingDelay / PriorityFactor)
            const baseDelay = 1.5; // Switch hop latency
            const congestionFactor = Math.pow(simState.congestion / 10, 2); // Non-linear queue growth
            const priorityDivisor = simState.vlanPriority ? 10 : 1; // Priority skips queue
            
            const calculatedGooseDelay = baseDelay + (congestionFactor / priorityDivisor);
            setGooseDelay(calculatedGooseDelay);

            // Jitter increases with congestion
            setSvJitter(0.1 + (simState.congestion / 200));

            // 2. RELAY LOGIC MODEL
            let newStatus: typeof relayStatus = 'NORMAL';
            
            // Logic A: PTP Drift effect on Differential
            // 1ms drift @ 50Hz = 18 degrees. 
            // If drift > 2ms, the phase shift is enough to cause false differential current > 30%
            if (simState.ptpDrift > 2.0) { 
                newStatus = 'MISOP'; // False Trip due to sync error
                if (relayStatus !== 'MISOP' && relayStatus !== 'TRIP') {
                    addLog('Relay 87', 'Differential Element Pickup (Sync Error)', 'WARN');
                }
            }

            // Logic B: GOOSE Tripping
            if (simState.faultInjected) {
                if (calculatedGooseDelay > 20) { // Max Trip Budget 20ms
                    newStatus = 'BLOCKED'; // Trip failed to arrive in time
                } else {
                    newStatus = 'TRIP';
                }
            }

            // Logic C: Merging Unit Health
            // High congestion causes packet loss in SV stream, triggering "Sample Loss" block
            if (simState.muStatus !== 'OK' || (simState.congestion > 90 && !simState.vlanPriority)) {
                newStatus = 'BLOCKED'; // Relay detects bad quality
            }

            setRelayStatus(newStatus);

            // 4. BREAKER BEHAVIOR
            if (newStatus === 'TRIP' && breakerStatus === 'CLOSED') {
                if (!logs.find(l => l.message.includes('Trip Command Sent') && l.time > Date.now() - 1000)) {
                    addLog('Relay', `Trip Command Sent (Network Delay: ${calculatedGooseDelay.toFixed(2)}ms)`, calculatedGooseDelay > 10 ? 'WARN' : 'INFO');
                    setTimeout(() => setBreakerStatus('OPEN'), 50 + calculatedGooseDelay); 
                }
            } else if (newStatus === 'MISOP' && breakerStatus === 'CLOSED') {
                 if (!logs.find(l => l.message.includes('False Trip') && l.time > Date.now() - 2000)) {
                    addLog('Relay 87', 'False Trip Initiated (Idiff > Setting)', 'CRITICAL');
                    setTimeout(() => setBreakerStatus('OPEN'), 50);
                 }
            }

        }, 100);

        return () => clearInterval(interval);
    }, [simState, relayStatus, breakerStatus, logs]);

    // --- ACTIONS ---

    const addLog = (source: string, message: string, type: LogEvent['type']) => {
        setLogs(prev => [{ id: Date.now(), time: Date.now(), source, message, type }, ...prev].slice(0, 50));
    };

    const injectFault = () => {
        setSimState(prev => ({ ...prev, faultInjected: true }));
        addLog('System', 'Fault Injected (Zone 1)', 'CRITICAL');
        
        setTimeout(() => {
            setSimState(prev => ({ ...prev, faultInjected: false }));
        }, 3000);
    };

    const resetSim = () => {
        setSimState({
            congestion: 10,
            vlanPriority: true,
            ptpDrift: 0,
            muStatus: 'OK',
            faultInjected: false
        });
        setBreakerStatus('CLOSED');
        setRelayStatus('NORMAL');
        setLogs([]);
        setScenario('CUSTOM');
    };

    const loadScenario = (id: ScenarioId) => {
        resetSim();
        setScenario(id);
        setTimeout(() => {
            switch(id) {
                case 'STORM':
                    setSimState(prev => ({ ...prev, congestion: 95, vlanPriority: false })); 
                    addLog('Scenario', 'GOOSE Storm Active. Congestion @ 95%', 'WARN');
                    break;
                case 'VLAN':
                    setSimState(prev => ({ ...prev, congestion: 80, vlanPriority: false }));
                    addLog('Scenario', 'VLAN Priority Tagging Disabled', 'WARN');
                    break;
                case 'PTP':
                    setSimState(prev => ({ ...prev, ptpDrift: 3 }));
                    addLog('Scenario', 'PTP Grandmaster Drift: 3ms', 'WARN');
                    break;
                case 'MU_FAIL':
                    setSimState(prev => ({ ...prev, muStatus: 'FREEZE' }));
                    addLog('Scenario', 'Merging Unit Sample Freeze', 'CRITICAL');
                    break;
            }
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 p-4 font-sans animate-fade-in flex flex-col gap-4">
            
            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Network className="w-8 h-8 text-blue-600" /> Digital Substation Reality Mode
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        IEC 61850 Behavioral Simulator. Visualize why correct relays fail in bad networks.
                    </p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <div className="px-3 py-1 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-500 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" /> Training Simulator Only
                    </div>
                    <button onClick={resetSim} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700">
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
                
                {/* --- LEFT PANEL: TOPOLOGY --- */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Share2 className="w-4 h-4" /> Process Bus Topology
                    </h3>
                    
                    {/* SVG Diagram */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden p-2">
                        <svg className="w-full h-full" viewBox="0 0 200 400">
                            {/* Lines */}
                            {/* Switch to IEDs */}
                            <line x1="100" y1="200" x2="50" y2="100" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                            <line x1="100" y1="200" x2="150" y2="100" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                            {/* MUs to Switch */}
                            <line x1="50" y1="300" x2="100" y2="200" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                            <line x1="150" y1="300" x2="100" y2="200" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                            {/* PTP to Switch */}
                            <line x1="180" y1="200" x2="100" y2="200" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" strokeDasharray="4" />

                            {/* Nodes */}
                            {/* Switch */}
                            <rect x="80" y="180" width="40" height="40" rx="4" fill={simState.congestion > 80 ? '#ef4444' : simState.congestion > 50 ? '#f59e0b' : '#3b82f6'} className="transition-colors duration-500 shadow-md" />
                            <text x="100" y="205" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">SW</text>

                            {/* IEDs */}
                            <rect x="30" y="60" width="40" height="40" rx="4" className="fill-white dark:fill-slate-800" stroke={relayStatus === 'TRIP' ? '#ef4444' : '#94a3b8'} strokeWidth="2" />
                            <text x="50" y="85" textAnchor="middle" fontSize="8" className="fill-slate-700 dark:fill-slate-200 font-bold">Prot 87</text>
                            
                            <rect x="130" y="60" width="40" height="40" rx="4" className="fill-white dark:fill-slate-800" stroke="#94a3b8" strokeWidth="2" />
                            <text x="150" y="85" textAnchor="middle" fontSize="8" className="fill-slate-700 dark:fill-slate-200 font-bold">Control</text>

                            {/* MUs */}
                            <circle cx="50" cy="300" r="15" fill={simState.muStatus !== 'OK' ? '#ef4444' : '#10b981'} />
                            <text x="50" y="305" textAnchor="middle" fontSize="8" fill="white">MU1</text>

                            <circle cx="150" cy="300" r="15" fill="#10b981" />
                            <text x="150" y="305" textAnchor="middle" fontSize="8" fill="white">MU2</text>

                            {/* PTP */}
                            <rect x="170" y="190" width="20" height="20" fill="#8b5cf6" />
                            <text x="180" y="225" textAnchor="middle" fontSize="8" fill="#white">PTP</text>

                            {/* Traffic Animation - CSS based for performance */}
                            <circle r="3" className="fill-amber-500">
                                <animateMotion 
                                    dur={`${200 / (simState.congestion + 10)}s`} // Speed varies with congestion
                                    repeatCount="indefinite"
                                    path="M 50 300 L 100 200 L 50 100"
                                />
                            </circle>
                            {simState.faultInjected && (
                                <circle r="4" fill="#ef4444">
                                    <animateMotion 
                                        dur={`${gooseDelay/50}s`} // Visual representation of delay
                                        repeatCount="1"
                                        path="M 50 100 L 100 200 L 130 100"
                                    />
                                </circle>
                            )}
                        </svg>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500"></div> Switch (Normal)</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-500"></div> Congested</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> Merging Unit</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-purple-500"></div> Grandmaster</div>
                    </div>
                </div>

                {/* --- CENTER PANEL: BEHAVIOR & TIMELINE --- */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Real-time Metrics */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" /> Network Performance
                        </h3>
                        
                        <div className="space-y-6">
                            <DelayBar label="GOOSE Trip Delay (Class P1)" value={gooseDelay} threshold={4} max={30} />
                            
                            {/* SV Waveform Visualizer */}
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-bold">
                                    <span className="text-slate-700 dark:text-slate-300">SV Stream Reconstruction (IEC 61850-9-2)</span>
                                </div>
                                <SVReconstructor 
                                    congestion={simState.congestion} 
                                    ptpDrift={simState.ptpDrift} 
                                    muStatus={simState.muStatus} 
                                />
                                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                    <span>Analog (Source)</span>
                                    <span>Digitized (Relay)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event Timeline / Logs */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col overflow-hidden shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Event Log
                            </h3>
                            <div className={`text-xs font-bold px-2 py-1 rounded ${
                                relayStatus === 'TRIP' ? 'bg-red-500 text-white' :
                                relayStatus === 'MISOP' ? 'bg-amber-500 text-white' :
                                relayStatus === 'BLOCKED' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            }`}>
                                STATUS: {relayStatus}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-2 custom-scrollbar bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <AnimatePresence>
                                {logs.map((log) => (
                                    <motion.div 
                                        key={log.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`p-2 rounded border-l-2 flex justify-between ${
                                            log.type === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-200' :
                                            log.type === 'WARN' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-200' :
                                            'bg-white dark:bg-slate-800 border-blue-500 text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        <span><span className="font-bold opacity-50">[{new Date(log.time).toLocaleTimeString().split(' ')[0]}]</span> {log.source}: {log.message}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {logs.length === 0 && <div className="text-center text-slate-400 mt-10">System Ready. Select a scenario to begin.</div>}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT PANEL: CONTROLS --- */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto shadow-sm">
                    
                    {/* Scenario Selector */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                            <Play className="w-3 h-3" /> Learning Scenarios
                        </h3>
                        <div className="space-y-2">
                            <ScenarioCard 
                                active={scenario === 'STORM'}
                                onClick={() => loadScenario('STORM')}
                                title="GOOSE Storm"
                                subtitle="Network Congestion"
                                icon={AlertOctagon}
                                colorClass={{ bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-500', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500' }}
                            />
                            <ScenarioCard 
                                active={scenario === 'VLAN'}
                                onClick={() => loadScenario('VLAN')}
                                title="VLAN Config"
                                subtitle="Priority Tagging (QoS)"
                                icon={Settings}
                                colorClass={{ bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500' }}
                            />
                            <ScenarioCard 
                                active={scenario === 'PTP'}
                                onClick={() => loadScenario('PTP')}
                                title="PTP Drift"
                                subtitle="Time Synchronization"
                                icon={Clock}
                                colorClass={{ bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500' }}
                            />
                            <ScenarioCard 
                                active={scenario === 'MU_FAIL'}
                                onClick={() => loadScenario('MU_FAIL')}
                                title="MU Failure"
                                subtitle="Process Bus Integrity"
                                icon={XCircle}
                                colorClass={{ bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500' }}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

                    {/* Manual Controls */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Settings className="w-3 h-3" /> Parameters
                        </h3>

                        {/* Network Load */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-500 dark:text-slate-400">Network Congestion</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{simState.congestion}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                value={simState.congestion} 
                                onChange={(e) => setSimState(s => ({ ...s, congestion: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* PTP Drift */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    PTP Time Drift
                                    <Tooltip text="Precision Time Protocol error. Should be <1ms." />
                                </span>
                                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{simState.ptpDrift}ms</span>
                            </div>
                            <input 
                                type="range" min="0" max="5" step="0.1"
                                value={simState.ptpDrift} 
                                onChange={(e) => setSimState(s => ({ ...s, ptpDrift: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        {/* Toggles */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">VLAN Priority (QoS)</div>
                                <input 
                                    type="checkbox" 
                                    checked={simState.vlanPriority} 
                                    onChange={(e) => setSimState(s => ({ ...s, vlanPriority: e.target.checked }))}
                                    className="accent-emerald-500 w-4 h-4"
                                />
                            </label>
                            
                            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Merging Unit Status</div>
                                <select 
                                    value={simState.muStatus}
                                    onChange={(e) => setSimState(s => ({ ...s, muStatus: e.target.value as any }))}
                                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs px-2 py-1 outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200"
                                >
                                    <option value="OK">Healthy</option>
                                    <option value="FREEZE">Freeze</option>
                                    <option value="DROP">Pkt Drop</option>
                                </select>
                            </label>
                        </div>

                        {/* Action Button */}
                        <button 
                            onClick={injectFault}
                            disabled={simState.faultInjected}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 dark:shadow-red-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5 fill-white" />
                            {simState.faultInjected ? 'Fault Active...' : 'INJECT FAULT'}
                        </button>
                    </div>

                    {/* Educational Feedback */}
                    <div className="mt-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm">
                        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <Info className="w-3 h-3" /> Engineering Insight
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            {scenario === 'STORM' && "GOOSE messages (Class P1) must arrive within 4ms. High congestion without QoS causes buffering delays in switches, leading to missed trips."}
                            {scenario === 'VLAN' && "Without 802.1Q Priority Tagging (PCP), protection traffic waits behind CCTV or file transfers. Always set PCP=4 (Critical) for GOOSE."}
                            {scenario === 'PTP' && "Time sync is critical for Sampled Values (IEC 61850-9-2). A 1ms drift shifts the waveform 18°, creating a false differential current that trips the relay."}
                            {scenario === 'MU_FAIL' && "Process bus reliability is paramount. Relays block protection on Sample Loss to prevent false tripping, but this leaves the system unprotected (Security vs Dependability)."}
                            {scenario === 'CUSTOM' && "Adjust parameters to see how network conditions affect protection physics. Try increasing congestion with and without VLAN Priority."}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DigitalSubstation;