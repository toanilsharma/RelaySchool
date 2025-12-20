
import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, Plus, ArrowRight, Activity, Clock, X, ToggleLeft, ToggleRight, 
    TrendingUp, Zap, HelpCircle, Trash2, RotateCcw, BookOpen, Download,
    Search, FileText, Bookmark, Hash, Layers, Shield, Cpu, Calculator,
    ChevronDown, ChevronUp, ExternalLink, Lightbulb, Binary, Save, MousePointer2
} from 'lucide-react';
import { LogicNode } from '../types';

// --- CONSTANTS FOR LIBRARY ---

const ANSI_DEVICE_NUMBERS = [
    { code: '21', name: 'Distance Relay', func: 'Impedance (Z < Zset)', app: 'Transmission Lines' },
    { code: '25', name: 'Synchronizing Check', func: 'Phase/Volt/Freq matching', app: 'Generator Paralleling' },
    { code: '27', name: 'Undervoltage', func: 'V < Vset', app: 'Motor Protection' },
    { code: '32', name: 'Directional Power', func: 'Power Flow Reverse', app: 'Anti-Motoring (Gen)' },
    { code: '46', name: 'Phase Balance (Neg Seq)', func: 'I2 > I2set', app: 'Unbalanced Loading' },
    { code: '49', name: 'Thermal Replica', func: 'I²t Heating', app: 'Cable/Transformer Overload' },
    { code: '50', name: 'Instantaneous Overcurrent', func: 'I > Iset (No Delay)', app: 'Short Circuits' },
    { code: '50BF', name: 'Breaker Failure', func: 'I > 0 after Trip', app: 'Back-tripping' },
    { code: '51', name: 'AC Time Overcurrent', func: 'Inverse Curve', app: 'Overload / Coordination' },
    { code: '51N', name: 'Neutral Time Overcurrent', func: 'Ground Faults', app: 'Earth Fault Protection' },
    { code: '59', name: 'Overvoltage', func: 'V > Vset', app: 'Insulation Protection' },
    { code: '67', name: 'Directional Overcurrent', func: 'I > Iset AND Angle', app: 'Ring Mains / Parallel Feeders' },
    { code: '79', name: 'Auto-Reclose', func: 'Close after Trip', app: 'Overhead Lines' },
    { code: '81', name: 'Frequency', func: 'f < fset (Underfreq)', app: 'Load Shedding' },
    { code: '86', name: 'Lockout', func: 'Latch Trip', app: 'Master Trip Relay' },
    { code: '87', name: 'Differential', func: 'Idiff > Slope', app: 'Transformers, Busbars, Generators' },
];

const FUNDAMENTALS = [
    {
        title: "The 4 'S' of Protection",
        content: "Every protection scheme implies a trade-off between these four conflicting requirements:",
        points: [
            { term: "Selectivity", desc: "Only the faulted section should be isolated. The breaker closest to the fault trips first (Discrimination)." },
            { term: "Speed", desc: "Clear faults rapidly to minimize equipment damage (I²t) and maintain system stability (Critical Clearing Time)." },
            { term: "Sensitivity", desc: "Detect even the smallest faults (e.g., high-impedance earth faults) within the protected zone." },
            { term: "Stability", desc: "Do NOT trip for external faults, load starting currents, or power swings (Security)." }
        ]
    },
    {
        title: "CT Saturation Physics",
        content: "Current Transformers (CTs) are the eyes of the relay. They fail when the core flux density exceeds the saturation point.",
        points: [
            { term: "Knee Point Voltage (Vk)", desc: "The voltage at which a 10% increase in voltage causes a 50% increase in excitation current. Beyond this, the CT is saturated." },
            { term: "DC Offset", desc: "The DC component of a fault current decays exponentially. This DC offset generates massive flux in the CT core, causing transient saturation even if the AC magnitude is low." },
            { term: "Remanence", desc: "Residual magnetism left in the core from a previous fault. It reduces the available headroom for flux swing in subsequent faults." }
        ]
    }
];

const FORMULAS = [
    { name: "Fault MVA", eq: "MVA = \\sqrt{3} \\times V_{LL} \\times I_{sc}" },
    { name: "Impedance (Ohms)", eq: "Z_{\\Omega} = \\frac{kV^2}{MVA}" },
    { name: "Per Unit", eq: "Z_{pu} = Z_{\\Omega} \\times \\frac{Base MVA}{Base kV^2}" },
    { name: "Sequence Components", eq: "\\begin{bmatrix} I_0 \\\\ I_1 \\\\ I_2 \\end{bmatrix} = \\frac{1}{3} \\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & a & a^2 \\\\ 1 & a^2 & a \\end{bmatrix} \\begin{bmatrix} I_a \\\\ I_b \\\\ I_c \\end{bmatrix}" }
];

// --- LOGIC SCENARIOS (Protection Engineering) ---
const LOGIC_SCENARIOS = [
    {
        id: 'basic_and',
        name: "Switching Interlock",
        description: "Safety Logic: The Circuit Breaker close command is permitted only if Disconnector is Closed AND Earth Switch is Open.",
        nodes: [
            { id: 'disc_status', type: 'INPUT', x: 50, y: 50, inputs: [], state: true, label: 'Disc. Closed' },
            { id: 'es_status', type: 'INPUT', x: 50, y: 200, inputs: [], state: false, label: 'Earth Sw. Closed' },
            { id: 'not_es', type: 'NOT', x: 200, y: 200, inputs: ['es_status'], state: true },
            { id: 'permit', type: 'AND', x: 350, y: 125, inputs: ['disc_status', 'not_es'], state: true },
            { id: 'close_coil', type: 'OUTPUT', x: 500, y: 125, inputs: ['permit'], state: true, label: 'Close Permit' }
        ] as LogicNode[]
    },
    {
        id: 'breaker_failure',
        name: "Breaker Failure (50BF)",
        description: "If a Trip signal is present AND Current is still flowing after a short delay, initiate a busbar back-trip.",
        nodes: [
            { id: 'trip_sig', type: 'INPUT', x: 50, y: 50, inputs: [], state: false, label: 'Trip Signal' },
            { id: 'current_high', type: 'INPUT', x: 50, y: 200, inputs: [], state: true, label: 'Current > 0' },
            { id: 'bf_init', type: 'AND', x: 200, y: 125, inputs: ['trip_sig', 'current_high'], state: false },
            { id: 'bf_timer', type: 'TIMER', x: 350, y: 125, inputs: ['bf_init'], state: false, label: 't=200ms' },
            { id: 'back_trip', type: 'OUTPUT', x: 500, y: 125, inputs: ['bf_timer'], state: false, label: 'Busbar Trip' }
        ] as LogicNode[]
    },
    {
        id: 'zone_interlock',
        name: "Zone Interlocking (ZSI)",
        description: "If a local fault is detected, trip FAST. BUT if a blocking signal arrives from downstream, wait for backup timer.",
        nodes: [
            { id: 'fault_pickup', type: 'INPUT', x: 50, y: 50, inputs: [], state: true, label: 'Fault Pickup' },
            { id: 'block_rx', type: 'INPUT', x: 50, y: 250, inputs: [], state: false, label: 'Block Rx' },
            { id: 'not_block', type: 'NOT', x: 200, y: 250, inputs: ['block_rx'], state: true },
            { id: 'fast_logic', type: 'AND', x: 350, y: 100, inputs: ['fault_pickup', 'not_block'], state: true },
            { id: 'delay_timer', type: 'TIMER', x: 350, y: 200, inputs: ['fault_pickup'], state: false, label: 't=300ms' },
            { id: 'fast_trip', type: 'OUTPUT', x: 550, y: 100, inputs: ['fast_logic'], state: true, label: 'Fast Trip' },
            { id: 'backup_trip', type: 'OUTPUT', x: 550, y: 200, inputs: ['delay_timer'], state: false, label: 'Backup Trip' }
        ] as LogicNode[]
    },
    {
        id: 'sr_latch',
        name: "SR Latch (Memory)",
        description: "A 1-bit memory cell using cross-coupled logic. Used in 'Lockout' relays (86) to latch a trip.",
        nodes: [
            { id: 'in_s', type: 'INPUT', x: 50, y: 200, inputs: [], state: false, label: 'Set' },
            { id: 'in_r', type: 'INPUT', x: 50, y: 50, inputs: [], state: false, label: 'Reset' },
            { id: 'or1', type: 'OR', x: 200, y: 50, inputs: ['in_r', 'not2'], state: false }, 
            { id: 'not1', type: 'NOT', x: 300, y: 50, inputs: ['or1'], state: true },
            { id: 'or2', type: 'OR', x: 200, y: 200, inputs: ['in_s', 'not1'], state: false }, 
            { id: 'not2', type: 'NOT', x: 300, y: 200, inputs: ['or2'], state: false }, 
            { id: 'out_q', type: 'OUTPUT', x: 450, y: 200, inputs: ['not2'], state: false, label: 'Q' },
            { id: 'out_qbar', type: 'OUTPUT', x: 450, y: 50, inputs: ['not1'], state: true, label: "Q'" }
        ] as LogicNode[]
    }
];

// Helper component for Modal
const HelpModal = ({ isOpen, onClose, title, content }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 m-4 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{title}</h2>
                <div className="text-slate-600 dark:text-slate-300">
                    {content}
                </div>
            </div>
        </div>
    );
};

const LogicHelpModal = ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 m-4 p-6 relative animate-fade-in" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-blue-500" /> Logic Lab Guide
                </h2>

                <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                    <section>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                            <MousePointer2 className="w-4 h-4 text-slate-500" /> How to Build Logic
                        </h3>
                        <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-100 dark:bg-slate-800 font-bold px-1.5 rounded text-xs mt-0.5">1</span>
                                <div><strong>Add Components:</strong> Click the buttons in the floating toolbar (top-left) to spawn Gates (AND, OR, NOT), Inputs (Switches), or Outputs (Bulbs).</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-100 dark:bg-slate-800 font-bold px-1.5 rounded text-xs mt-0.5">2</span>
                                <div><strong>Move:</strong> Drag any component to position it on the canvas.</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-100 dark:bg-slate-800 font-bold px-1.5 rounded text-xs mt-0.5">3</span>
                                <div><strong>Connect:</strong> Click the <span className="font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">Output Dot</span> (Right side) of one node, then click the <span className="font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">Input Dot</span> (Left side) of another to create a wire.</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-100 dark:bg-slate-800 font-bold px-1.5 rounded text-xs mt-0.5">4</span>
                                <div><strong>Simulate:</strong> Click on <span className="font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-1 rounded">Switches</span> to toggle them On/Off. The logic solves in real-time.</div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-100 dark:bg-slate-800 font-bold px-1.5 rounded text-xs mt-0.5">5</span>
                                <div><strong>Delete:</strong> Right-click (or long press) a node to remove it.</div>
                            </li>
                        </ul>
                    </section>

                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex justify-between">AND Gate <span className="text-xs font-mono bg-white dark:bg-slate-900 px-1 rounded border dark:border-slate-800">&</span></div>
                            <p className="text-xs text-slate-500">Output is HIGH only if ALL inputs are HIGH. Used for safety interlocks.</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex justify-between">OR Gate <span className="text-xs font-mono bg-white dark:bg-slate-900 px-1 rounded border dark:border-slate-800">≥1</span></div>
                            <p className="text-xs text-slate-500">Output is HIGH if ANY input is HIGH. Used for parallel tripping paths.</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex justify-between">NOT Gate <span className="text-xs font-mono bg-white dark:bg-slate-900 px-1 rounded border dark:border-slate-800">!</span></div>
                            <p className="text-xs text-slate-500">Inverts the signal. HIGH becomes LOW. Used for blocking/inhibit logic.</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex justify-between">TIMER <span className="text-xs font-mono bg-white dark:bg-slate-900 px-1 rounded border dark:border-slate-800">t</span></div>
                            <p className="text-xs text-slate-500">Adds a delay (Pulse). Essential for coordination margins.</p>
                        </div>
                    </section>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <h4 className="font-bold text-blue-700 dark:text-blue-300 text-sm mb-1 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Pro Tip: Protection Logic
                        </h4>
                        <p className="text-xs text-blue-600 dark:text-blue-200 leading-relaxed">
                            Real relays use Boolean Logic Equations. For example, a "Zone Selective Interlock" typically uses a NOT gate on the blocking signal feeding into an AND gate with the trip signal to permit fast tripping.
                        </p>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-500/20">
                        Got it, let's build!
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- LIBRARY SUB-COMPONENTS ---

const ArticleCard = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-blue-500/30 transition-all">
        <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-4">
            {children}
        </div>
    </div>
);

const ReferenceLibrary = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAnsi = ANSI_DEVICE_NUMBERS.filter(
        d => d.code.includes(searchTerm) || d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.app.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            
            {/* Search Hero */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Engineering Reference Library</h2>
                    <div className="max-w-md mx-auto relative">
                        <input 
                            type="text" 
                            placeholder="Search ANSI codes, formulas, or concepts..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            {/* Quick Reference Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ANSI Codes Table */}
                <ArticleCard title="Standard Device Numbers (ANSI/IEEE C37.2)" icon={Hash}>
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                <tr>
                                    <th className="p-3">#</th>
                                    <th className="p-3">Function Name</th>
                                    <th className="p-3 hidden sm:table-cell">Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {filteredAnsi.slice(0, 8).map(device => (
                                    <tr key={device.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{device.code}</td>
                                        <td className="p-3 font-medium">
                                            {device.name}
                                            <div className="text-xs text-slate-400 mt-0.5 sm:hidden">{device.app}</div>
                                        </td>
                                        <td className="p-3 text-slate-500 hidden sm:table-cell">{device.app}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAnsi.length > 8 && (
                            <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-950">
                                {filteredAnsi.length - 8} more codes available...
                            </div>
                        )}
                    </div>
                </ArticleCard>

                {/* Core Fundamentals */}
                <div className="space-y-6">
                    {FUNDAMENTALS.map((topic, i) => (
                        <ArticleCard key={i} title={topic.title} icon={BookOpen}>
                            <p className="mb-4 text-slate-700 dark:text-slate-300 font-medium">{topic.content}</p>
                            <ul className="space-y-3">
                                {topic.points.map((pt, j) => (
                                    <li key={j} className="flex gap-3">
                                        <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                                        <div>
                                            <strong className="text-slate-900 dark:text-white">{pt.term}:</strong> <span className="text-slate-500 dark:text-slate-400">{pt.desc}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </ArticleCard>
                    ))}
                </div>
            </div>

            {/* Formulas & Protocols */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ArticleCard title="Essential Formula Sheet" icon={Calculator}>
                    <div className="grid grid-cols-1 gap-3">
                        {FORMULAS.map((f, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center group hover:border-blue-500/30 transition-colors">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{f.name}</span>
                                {/* Note: LaTeX rendering would be ideal here, using simplified text representation for now */}
                                <code className="font-mono text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400">
                                    {f.eq}
                                </code>
                            </div>
                        ))}
                    </div>
                </ArticleCard>

                <ArticleCard title="IEC 61850 Architecture" icon={Layers}>
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">Station Bus (IEC 61850-8-1)</span>
                                <span className="text-[10px] uppercase font-bold bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-white px-2 py-0.5 rounded">MMS & GOOSE</span>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-200">Connects IEDs, HMIs, and Gateways. Handles slow SCADA data (MMS) and fast tripping (GOOSE).</p>
                        </div>
                        
                        <div className="flex justify-center">
                            <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700"></div>
                        </div>

                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-purple-700 dark:text-purple-300 text-sm">Process Bus (IEC 61850-9-2)</span>
                                <span className="text-[10px] uppercase font-bold bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-white px-2 py-0.5 rounded">Sampled Values</span>
                            </div>
                            <p className="text-xs text-purple-600 dark:text-purple-200">Connects Merging Units (MUs) to IEDs. Digitizes CT/VT analog signals at source (4000/4800 Hz).</p>
                        </div>
                    </div>
                </ArticleCard>
            </div>

        </div>
    );
};

// --- LOGIC SIMULATOR ---

const LogicOscilloscope = ({ history, nodes }: { history: {timestamp: number, states: Record<string, boolean>}[], nodes: LogicNode[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const traceNodes = nodes.filter(n => n.type === 'INPUT' || n.type === 'OUTPUT');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const rowHeight = h / (traceNodes.length || 1);
        const padding = 5;

        // Clear
        ctx.fillStyle = '#0f172a'; // Slate 900
        ctx.fillRect(0, 0, w, h);

        // Draw Grid
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < traceNodes.length; i++) {
            const y = (i + 1) * rowHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw Traces
        traceNodes.forEach((node, i) => {
            const yBase = (i + 1) * rowHeight - padding;
            const yTop = i * rowHeight + padding;
            const yMid = (yBase + yTop) / 2;
            
            ctx.beginPath();
            ctx.strokeStyle = node.type === 'INPUT' ? '#3b82f6' : '#22c55e'; // Blue for Input, Green for Output
            ctx.lineWidth = 2;

            // History is typically 50 items. Map X to width.
            const stepX = w / 50; 
            
            history.forEach((frame, idx) => {
                const x = idx * stepX;
                const state = frame.states[node.id];
                const y = state ? yTop : yBase;

                if (idx === 0) {
                    ctx.moveTo(x, y);
                } else {
                    // Draw square wave transition
                    const prevState = history[idx-1].states[node.id];
                    const prevY = prevState ? yTop : yBase;
                    ctx.lineTo(x, prevY); // Horizontal to new time
                    ctx.lineTo(x, y); // Vertical transition
                }
            });
            ctx.stroke();

            // Labels
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.fillText(node.label || node.id, 5, yTop + 10);
        });

    }, [history, nodes, traceNodes]);

    if (traceNodes.length === 0) return <div className="text-center text-xs text-slate-500 py-4">Add inputs/outputs to see timing diagram.</div>;

    return (
        <div className="w-full h-40 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner mt-4">
            <canvas ref={canvasRef} width={800} height={160} className="w-full h-full" />
        </div>
    );
};

const LogicLab = () => {
    const [nodes, setNodes] = useState<LogicNode[]>([]);
    const [dragging, setDragging] = useState<string | null>(null);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [instruction, setInstruction] = useState('Select a scenario or drag components to build logic.');
    const [history, setHistory] = useState<{timestamp: number, states: Record<string, boolean>}[]>([]);
    const [showHelp, setShowHelp] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // Initial Setup - Load Basic Interlock by default
    useEffect(() => {
        if (nodes.length === 0) {
            loadScenario('basic_and');
        }
    }, []);

    const loadScenario = (id: string) => {
        const scenario = LOGIC_SCENARIOS.find(s => s.id === id);
        if (scenario) {
            // Deep copy to prevent mutation of the template
            setNodes(JSON.parse(JSON.stringify(scenario.nodes)));
            setInstruction(scenario.description);
            setHistory([]); // Reset history on new scenario
        }
    };

    // Logic Simulation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setNodes(currentNodes => {
                const nextNodes = currentNodes.map(node => {
                    if (node.type === 'INPUT') return node;
                    const inputStates = node.inputs.map(id => currentNodes.find(n => n.id === id)?.state || false);
                    let newState = false;
                    switch (node.type) {
                        case 'AND': newState = inputStates.every(s => s); break;
                        case 'OR': newState = inputStates.some(s => s); break;
                        case 'NOT': newState = !inputStates[0]; break;
                        case 'OUTPUT': newState = inputStates[0] || false; break;
                        case 'TIMER': newState = !node.state; break;
                        default: newState = false;
                    }
                    return { ...node, state: newState };
                });
                const snapshot = nextNodes.reduce((acc, n) => ({...acc, [n.id]: n.state}), {});
                setHistory(h => [...h.slice(-50), { timestamp: Date.now(), states: snapshot }]);
                return nextNodes;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const addNode = (type: LogicNode['type']) => {
        const id = Math.random().toString(36).substr(2, 5);
        setNodes([...nodes, { id, type, x: 100 + Math.random()*50, y: 100 + Math.random()*50, inputs: [], state: false, label: type === 'INPUT' ? 'Switch' : type === 'OUTPUT' ? 'Bulb' : undefined }]);
    };

    const toggleInput = (id: string) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, state: !n.state } : n));
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!dragging) return;
        const container = svgRef.current?.parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        let cx, cy;
        if ('touches' in e) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
        else { cx = (e as React.MouseEvent).clientX; cy = (e as React.MouseEvent).clientY; }
        setNodes(nodes.map(n => n.id === dragging ? { ...n, x: cx - rect.left - 48, y: cy - rect.top - 24 } : n));
    };

    const startConnection = (id: string) => setConnecting(id);
    const finishConnection = (id: string) => {
        if (connecting && connecting !== id) {
            setNodes(nodes.map(n => n.id === id ? { ...n, inputs: [...n.inputs, connecting] } : n));
            setConnecting(null);
        }
    };

    const deleteNode = (id: string) => {
        setNodes(nodes.filter(n => n.id !== id).map(n => ({ ...n, inputs: n.inputs.filter(i => i !== id) })));
    };

    const renderWire = (source: LogicNode, target: LogicNode, active: boolean) => {
        const sx = source.x + 96; const sy = source.y + 24;
        const ex = target.x; const ey = target.y + 24;
        return <path key={`${source.id}-${target.id}`} d={`M ${sx} ${sy} C ${sx+50} ${sy}, ${ex-50} ${ey}, ${ex} ${ey}`} stroke={active ? '#22c55e' : '#94a3b8'} strokeWidth="3" fill="none" className="transition-colors duration-200" />;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
            <LogicHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
            
            <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex-1 flex flex-col min-h-[400px]">
                    {/* Toolbar */}
                    <div className="absolute top-4 left-4 z-20 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col gap-2">
                        <button onClick={() => addNode('INPUT')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" title="Input"><ToggleRight className="w-5 h-5 text-slate-600 dark:text-slate-300"/></button>
                        <button onClick={() => addNode('OUTPUT')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" title="Output"><div className="w-4 h-4 rounded-full border-2 border-slate-600 dark:border-slate-300"></div></button>
                        <div className="h-px w-full bg-slate-200 dark:bg-slate-700"></div>
                        <button onClick={() => addNode('AND')} className="text-xs font-bold p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="AND Gate">AND</button>
                        <button onClick={() => addNode('OR')} className="text-xs font-bold p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="OR Gate">OR</button>
                        <button onClick={() => addNode('NOT')} className="text-xs font-bold p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="NOT Gate">NOT</button>
                        <div className="h-px w-full bg-slate-200 dark:bg-slate-700"></div>
                        <button onClick={() => setShowHelp(true)} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 rounded flex items-center justify-center" title="How to Use">
                            <HelpCircle className="w-5 h-5"/>
                        </button>
                    </div>
                    
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>
                    
                    <div className="flex-1 relative w-full h-full cursor-crosshair overflow-hidden" 
                        onMouseMove={handleMove} onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)}
                        style={{ touchAction: 'none' }}
                    >
                        <svg ref={svgRef} className="w-full h-full pointer-events-none absolute inset-0 z-0">
                            {nodes.map(n => n.inputs.map(i => {
                                const src = nodes.find(x => x.id === i);
                                return src ? renderWire(src, n, src.state) : null;
                            }))}
                            {connecting && dragging && nodes.find(n=>n.id===connecting) && (
                                <path d={`M ${nodes.find(n=>n.id===connecting)!.x+96} ${nodes.find(n=>n.id===connecting)!.y+24} L ${nodes.find(n=>n.id===dragging)!.x} ${nodes.find(n=>n.id===dragging)!.y}`} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" className="animate-pulse" />
                            )}
                        </svg>
                        {nodes.map(node => (
                            <div key={node.id}
                                onMouseDown={(e) => { e.stopPropagation(); setDragging(node.id); }}
                                onClick={(e) => { e.stopPropagation(); finishConnection(node.id); }}
                                onContextMenu={(e) => { e.preventDefault(); deleteNode(node.id); }}
                                className={`absolute w-24 h-12 rounded-lg border-2 flex items-center justify-center shadow-lg transition-all select-none
                                    ${node.state ? 'border-green-500 shadow-green-500/20' : 'border-slate-300 dark:border-slate-600'}
                                    ${dragging === node.id ? 'scale-105 cursor-grabbing z-50' : 'cursor-grab z-10'}
                                    ${node.type === 'INPUT' || node.type === 'OUTPUT' ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-800'}
                                `}
                                style={{ left: node.x, top: node.y }}
                            >
                                {/* Inputs Points (Left) */}
                                {node.type !== 'INPUT' && (
                                    <div 
                                        className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-400 rounded-full hover:bg-blue-500 cursor-crosshair"
                                        onClick={(e) => { e.stopPropagation(); startConnection(node.id); }}
                                        title="Connect Input"
                                    ></div>
                                )}

                                {/* Content */}
                                <div className="font-bold text-xs pointer-events-none flex flex-col items-center">
                                    <span className={node.state ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                                        {node.label || node.type}
                                    </span>
                                    {node.type === 'TIMER' && <span className="text-[8px] text-slate-400">Pulse</span>}
                                </div>

                                {/* Output Point (Right) */}
                                {node.type !== 'OUTPUT' && (
                                    <div 
                                        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-crosshair ${connecting === node.id ? 'bg-blue-500 animate-ping' : 'bg-slate-400 hover:bg-blue-500'}`}
                                        onClick={(e) => { e.stopPropagation(); startConnection(node.id); }}
                                        title="Connect Output"
                                    ></div>
                                )}
                                
                                {/* Input Toggle (if INPUT) */}
                                {node.type === 'INPUT' && (
                                    <button 
                                        className={`absolute inset-0 w-full h-full rounded-lg opacity-0`}
                                        onClick={() => toggleInput(node.id)}
                                    ></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Oscilloscope */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                    <h3 className="font-bold text-xs text-slate-500 uppercase flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-500" /> Timing Diagram (Oscilloscope)
                    </h3>
                    <LogicOscilloscope history={history} nodes={nodes} />
                </div>
            </div>
            
            {/* Sidebar / Info Panel for Logic Lab */}
            <div className="lg:col-span-1 space-y-6 flex flex-col h-full overflow-hidden">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" /> Simulation Status
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                        {instruction}
                    </p>
                    <div className="flex gap-2 text-xs">
                        <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                            Nodes: {nodes.length}
                        </div>
                        <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded animate-pulse">
                            Running
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col flex-1 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-500" /> Load Example
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
                        {LOGIC_SCENARIOS.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => loadScenario(s.id)}
                                className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
                            >
                                <div className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {s.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                    {s.description}
                                </div>
                            </button>
                        ))}
                    </div>
                    {/* Add Custom Build Hint */}
                    <div className="p-3 text-[10px] text-center text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        Don't see what you need? Build it manually on the canvas!
                    </div>
                </div>
            </div>
        </div>
    );
};

const KnowledgeEngine = () => {
    const [activeTab, setActiveTab] = useState<'library' | 'logic'>('library');

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-600" /> Knowledge Engine
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Reference Library & Logic Simulator.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('library')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Reference
                    </button>
                    <button 
                        onClick={() => setActiveTab('logic')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'logic' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Logic Lab
                    </button>
                </div>
            </div>

            {activeTab === 'library' ? <ReferenceLibrary /> : <LogicLab />}
        </div>
    );
};

export default KnowledgeEngine;
