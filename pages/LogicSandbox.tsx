import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Cpu, Play, Settings, BookOpen, ArrowRight, RefreshCw, Award, 
    Activity, Trash2, Plus, LayoutTemplate, 
    Zap, Timer, ToggleRight, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageSEO from '../components/SEO/PageSEO';

// --- TYPE DEFINITIONS ---

type TabType = 'editor' | 'theory' | 'quiz';
type NodeType = 'INPUT' | 'OUTPUT' | 'AND' | 'OR' | 'NOT' | 'TON' | 'TOF' | 'RS' | 'SR';

interface LogicNode {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    label: string;
    value: boolean;
    params?: any; 
    state?: any;  
}

interface Connection {
    id: string;
    fromNode: string;
    toNode: string;
    toPin: number;
}

// --- MATH TYPOGRAPHY COMPONENTS ---

const InlineMath = ({ children }: { children: React.ReactNode }) => (
    <span className="font-serif italic text-blue-700 dark:text-blue-300 mx-0.5 text-[1.05em] tracking-wide">{children}</span>
);

const BlockMath = ({ children }: { children: React.ReactNode }) => (
    <div className="py-4 px-6 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl text-center font-serif text-lg overflow-x-auto my-4 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center gap-2">
        {children}
    </div>
);

// --- THEORY DATA ---

const THEORY_SECTIONS = [
    {
        title: 'IEC 61131-3 Function Block Diagram (FBD)',
        content: (
            <div className="space-y-4">
                <p>Function Block Diagram (FBD) is a graphical programming language standard for Programmable Logic Controllers (PLCs) defined by IEC 61131-3. It represents signal and data flows through reusable function blocks, making it highly intuitive for control engineers and protection relay technicians.</p>
                <p>The logic is executed cyclically (the "Scan Cycle"). During each cycle, the PLC reads inputs, executes the diagram logic from left to right, and finally updates the outputs.</p>
            </div>
        )
    },
    {
        title: 'Fundamental Boolean Logic Gates',
        content: (
            <div className="space-y-4">
                <p>FBD relies on standard Boolean algebra. The fundamental logical operations are:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400 mb-2">AND Gate (Conjunction)</h4>
                        <p className="text-sm">Output is true ONLY if all inputs are true. Used for series interlocks.</p>
                        <BlockMath><InlineMath>Y</InlineMath> = <InlineMath>A</InlineMath> &middot; <InlineMath>B</InlineMath></BlockMath>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400 mb-2">OR Gate (Disjunction)</h4>
                        <p className="text-sm">Output is true if AT LEAST one input is true. Used for parallel permissives.</p>
                        <BlockMath><InlineMath>Y</InlineMath> = <InlineMath>A</InlineMath> + <InlineMath>B</InlineMath></BlockMath>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 md:col-span-2">
                        <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 mb-2">NOT Gate (Inversion)</h4>
                        <p className="text-sm">Inverts the boolean state. True becomes False, and vice versa.</p>
                        <BlockMath><InlineMath>Y</InlineMath> = <span className="border-t border-blue-700 dark:border-blue-300"><InlineMath>A</InlineMath></span></BlockMath>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: 'Latches: RS vs SR Flip-Flops',
        content: (
            <div className="space-y-4">
                <p>Flip-flops introduce "memory" into the system, allowing an output to remain active even after the initial trigger signal is removed.</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                    <li><strong>RS (Reset Dominant):</strong> If both Set (S) and Reset (R) inputs are TRUE simultaneously, the <strong>Reset</strong> signal wins. Output = FALSE. This is the safest default for industrial control.</li>
                    <li><strong>SR (Set Dominant):</strong> If both S and R inputs are TRUE, the <strong>Set</strong> signal wins. Output = TRUE. Used only when initiating an action is strictly preferred over stopping it.</li>
                </ul>
                <BlockMath>
                    <InlineMath>Q</InlineMath> = <InlineMath>S</InlineMath> + (<InlineMath>Q</InlineMath> &middot; <span className="border-t border-blue-700 dark:border-blue-300"><InlineMath>R</InlineMath></span>)
                </BlockMath>
            </div>
        )
    },
    {
        title: 'Timers: TON and TOF',
        content: (
            <div className="space-y-4">
                <p>Timers are crucial for debouncing signals, sequencing startups, and coordinating protection delays (like Breaker Failure 50BF).</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                    <li><strong>TON (Timer On-Delay):</strong> The input must remain TRUE continuously for the duration of the preset time (<InlineMath>PT</InlineMath>). If it drops before the timer expires, the accumulated time resets.</li>
                    <li><strong>TOF (Timer Off-Delay):</strong> Output goes TRUE instantly with the input. When the input goes FALSE, the output remains TRUE for the preset time (<InlineMath>PT</InlineMath>) before dropping.</li>
                </ul>
            </div>
        )
    }
];

// --- QUIZ DATA ---
const QUIZ_QUESTIONS = [
    {
        question: "In an IEC 61131-3 FBD, what happens to an RS (Reset-Dominant) Flip-Flop if both the Set (S) and Reset (R) inputs are TRUE at the same time?",
        options: [
            "The output toggles on and off rapidly.",
            "The Set input overrides; the output is TRUE.",
            "The Reset input overrides; the output is FALSE.",
            "The logic controller faults and halts execution."
        ],
        correctAnswer: 2,
        explanation: "An RS flip-flop is Reset-dominant. If both inputs are energized, the Reset command takes priority, forcing the output to FALSE. This is typical for safety systems where 'stop' should override 'start'."
    },
    {
        question: "Which of the following Boolean expressions correctly represents a standard OR gate?",
        options: [
            "Y = A · B",
            "Y = A + B",
            "Y = A ⊕ B",
            "Y = /A"
        ],
        correctAnswer: 1,
        explanation: "In Boolean algebra, the '+' symbol represents the logical OR operation (disjunction), meaning Y is true if A OR B is true."
    },
    {
        question: "How does a TON (Timer On-Delay) behave if its input signal goes FALSE before the preset delay time has finished accumulating?",
        options: [
            "The timer pauses and holds its current accumulated value.",
            "The timer resets its accumulated time to zero.",
            "The timer continues running until it finishes.",
            "The output goes TRUE immediately."
        ],
        correctAnswer: 1,
        explanation: "A TON requires a continuous, unbroken input signal to complete its timing cycle. If the input drops to FALSE at any point before completion, the accumulated time instantly resets to zero."
    },
    {
        question: "In standard PLC execution (the Scan Cycle), what is the correct order of operations?",
        options: [
            "Execute Logic -> Read Inputs -> Write Outputs",
            "Write Outputs -> Execute Logic -> Read Inputs",
            "Read Inputs -> Execute Logic -> Write Outputs",
            "Read Inputs -> Write Outputs -> Execute Logic"
        ],
        correctAnswer: 2,
        explanation: "The standard PLC scan cycle always follows: 1) Read physical inputs into memory, 2) Execute the programmed logic (FBD, Ladder, etc.), 3) Write the calculated results to physical outputs."
    },
    {
        question: "A TOF (Timer Off-Delay) is often used for cooling fans. If the input signal (motor running) turns OFF, what does the TOF output do?",
        options: [
            "It turns OFF immediately.",
            "It waits for the delay time, then turns ON.",
            "It stays ON for the preset delay time, then turns OFF.",
            "It pulses ON and OFF until manually reset."
        ],
        correctAnswer: 2,
        explanation: "A TOF extends a signal. The output turns ON immediately with the input, but when the input is removed, the TOF holds the output ON for the programmed delay time before finally dropping it. This allows a cooling fan to run for a few minutes after a motor stops."
    }
];

// --- NODE CONFIGURATION MAP ---

const getNodeConfig = (type: NodeType) => {
    switch (type) {
        case 'INPUT': return { w: 120, h: 44, ins: 0, icon: ToggleRight, color: 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', ring: 'focus:ring-blue-500' };
        case 'OUTPUT': return { w: 120, h: 44, ins: 1, icon: Zap, color: 'border-purple-500 bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300', ring: 'focus:ring-purple-500' };
        case 'AND': return { w: 80, h: 64, ins: 2, icon: null, color: 'border-slate-400 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200', ring: 'focus:ring-slate-500' };
        case 'OR': return { w: 80, h: 64, ins: 2, icon: null, color: 'border-slate-400 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200', ring: 'focus:ring-slate-500' };
        case 'NOT': return { w: 80, h: 44, ins: 1, icon: null, color: 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600/50 dark:bg-amber-900/20 dark:text-amber-300', ring: 'focus:ring-amber-500' };
        case 'TON': return { w: 110, h: 72, ins: 1, icon: Timer, color: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300', ring: 'focus:ring-emerald-500' };
        case 'TOF': return { w: 110, h: 72, ins: 1, icon: Timer, color: 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300', ring: 'focus:ring-teal-500' };
        case 'RS': return { w: 80, h: 72, ins: 2, icon: null, color: 'border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-600/50 dark:bg-rose-900/20 dark:text-rose-300', ring: 'focus:ring-rose-500', labels: ['S', 'R1'] };
        case 'SR': return { w: 80, h: 72, ins: 2, icon: null, color: 'border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-600/50 dark:bg-rose-900/20 dark:text-rose-300', ring: 'focus:ring-rose-500', labels: ['S1', 'R'] };
        default: return { w: 80, h: 44, ins: 1, icon: null, color: 'border-slate-400 bg-slate-50 text-slate-800', ring: 'focus:ring-slate-500' };
    }
};

// --- MAIN APP COMPONENT ---

export default function LogicSandbox() {
    const [isDark, setIsDark] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('editor');

    // Canvas State
    const [nodes, setNodes] = useState<LogicNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    
    // Interaction State
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [wiringStart, setWiringStart] = useState<{ node: string } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [simulating, setSimulating] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // Quiz State
    const [quizStep, setQuizStep] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);

    // Initial Load
    useEffect(() => {
        loadPreset('overcurrent');
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

    // Preset Loader
    const loadPreset = (preset: string) => {
        setSimulating(false);
        if (preset === 'overcurrent') {
            setNodes([
                { id: 'in1', type: 'INPUT', x: 60, y: 80, label: '50P Inst', value: false },
                { id: 'in2', type: 'INPUT', x: 60, y: 180, label: '51P Time', value: false },
                { id: 'or1', type: 'OR', x: 300, y: 110, label: 'OR', value: false },
                { id: 'out1', type: 'OUTPUT', x: 500, y: 120, label: 'TRIP_COIL', value: false }
            ]);
            setConnections([
                { id: 'c1', fromNode: 'in1', toNode: 'or1', toPin: 0 },
                { id: 'c2', fromNode: 'in2', toNode: 'or1', toPin: 1 },
                { id: 'c3', fromNode: 'or1', toNode: 'out1', toPin: 0 }
            ]);
        } else if (preset === 'breaker_fail') {
            setNodes([
                { id: 'in1', type: 'INPUT', x: 60, y: 80, label: 'Trip Cmd', value: false },
                { id: 'in2', type: 'INPUT', x: 60, y: 180, label: '52a Closed', value: false },
                { id: 'and1', type: 'AND', x: 280, y: 110, label: 'AND', value: false },
                { id: 'ton1', type: 'TON', x: 450, y: 106, label: 'LBB Timer', value: false, params: { delay: 1.5 }, state: { activeAt: 0 } },
                { id: 'out1', type: 'OUTPUT', x: 650, y: 120, label: 'BF_TRIP', value: false }
            ]);
            setConnections([
                { id: 'c1', fromNode: 'in1', toNode: 'and1', toPin: 0 },
                { id: 'c2', fromNode: 'in2', toNode: 'and1', toPin: 1 },
                { id: 'c3', fromNode: 'and1', toNode: 'ton1', toPin: 0 },
                { id: 'c4', fromNode: 'ton1', toNode: 'out1', toPin: 0 }
            ]);
        } else if (preset === 'motor_latch') {
            setNodes([
                { id: 'in1', type: 'INPUT', x: 60, y: 80, label: 'Start PB', value: false },
                { id: 'in2', type: 'INPUT', x: 60, y: 180, label: 'Stop PB', value: false },
                { id: 'rs1', type: 'RS', x: 300, y: 106, label: 'RS Latch', value: false },
                { id: 'out1', type: 'OUTPUT', x: 500, y: 120, label: 'Contactor', value: false }
            ]);
            setConnections([
                { id: 'c1', fromNode: 'in1', toNode: 'rs1', toPin: 0 },
                { id: 'c2', fromNode: 'in2', toNode: 'rs1', toPin: 1 },
                { id: 'c3', fromNode: 'rs1', toNode: 'out1', toPin: 0 }
            ]);
        } else {
            setNodes([]);
            setConnections([]);
        }
    };

    // --- SIMULATION ENGINE ---
    useEffect(() => {
        if (!simulating) return;
        
        const tickRate = 30; // ms
        const interval = setInterval(() => {
            setNodes(prevNodes => {
                const nextNodes = [...prevNodes];
                const now = Date.now();

                const getInputValue = (targetId: string, pinId: number) => {
                    const conn = connections.find(c => c.toNode === targetId && c.toPin === pinId);
                    if (!conn) return false;
                    const source = prevNodes.find(n => n.id === conn.fromNode);
                    return source ? source.value : false;
                };

                for (let i = 0; i < nextNodes.length; i++) {
                    const node = nextNodes[i];
                    if (node.type === 'INPUT') continue;

                    const in0 = getInputValue(node.id, 0);
                    const in1 = getInputValue(node.id, 1);

                    switch (node.type) {
                        case 'AND': node.value = in0 && in1; break;
                        case 'OR': node.value = in0 || in1; break;
                        case 'NOT': node.value = !in0; break;
                        case 'OUTPUT': node.value = in0; break;
                        case 'RS':
                            if (in1) node.value = false; // R overrides
                            else if (in0) node.value = true;
                            break;
                        case 'SR':
                            if (in0) node.value = true; // S overrides
                            else if (in1) node.value = false;
                            break;
                        case 'TON':
                            if (in0) {
                                if (!node.state?.active) {
                                    node.state = { active: true, startTime: now };
                                }
                                const elapsed = now - node.state.startTime;
                                const delayMs = (node.params?.delay || 1) * 1000;
                                node.state.progress = Math.min(100, (elapsed / delayMs) * 100);
                                if (elapsed >= delayMs) node.value = true;
                            } else {
                                node.state = { active: false, startTime: 0, progress: 0 };
                                node.value = false;
                            }
                            break;
                        case 'TOF':
                            if (in0) {
                                node.state = { active: false, startTime: 0, progress: 0 };
                                node.value = true;
                            } else {
                                if (node.value) { // Was true, now dropping
                                    if (!node.state?.active) {
                                        node.state = { active: true, startTime: now };
                                    }
                                    const elapsed = now - node.state.startTime;
                                    const delayMs = (node.params?.delay || 1) * 1000;
                                    node.state.progress = Math.min(100, (elapsed / delayMs) * 100);
                                    if (elapsed >= delayMs) {
                                        node.value = false;
                                        node.state.active = false;
                                    }
                                } else {
                                     node.state = { active: false, startTime: 0, progress: 0 };
                                }
                            }
                            break;
                    }
                }
                return nextNodes;
            });
        }, tickRate);
        
        return () => clearInterval(interval);
    }, [simulating, connections]);

    // --- CANVAS INTERACTIONS ---
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!svgRef.current) return;
        const pt = { x: e.clientX, y: e.clientY };
        const rect = svgRef.current.getBoundingClientRect();
        const x = pt.x - rect.left;
        const y = pt.y - rect.top;
        setMousePos({ x, y });

        if (draggingNode) {
            // Grid snapping (20px grid)
            const snapX = Math.round((x - 40) / 20) * 20;
            const snapY = Math.round((y - 20) / 20) * 20;
            setNodes(ns => ns.map(n => n.id === draggingNode ? { ...n, x: snapX, y: snapY } : n));
        }
    };

    const handlePointerUp = () => {
        setDraggingNode(null);
        setWiringStart(null);
    };

    const startWiring = (e: React.PointerEvent, nodeId: string) => {
        e.stopPropagation();
        setWiringStart({ node: nodeId });
    };

    const finishWiring = (e: React.PointerEvent, targetNode: string, pinIndex: number) => {
        e.stopPropagation();
        if (wiringStart && wiringStart.node !== targetNode) {
            // Cycle prevention (basic check)
            if (wiringStart.node === targetNode) return;
            
            const newConns = connections.filter(c => !(c.toNode === targetNode && c.toPin === pinIndex));
            newConns.push({
                id: `c_${Date.now()}`,
                fromNode: wiringStart.node,
                toNode: targetNode,
                toPin: pinIndex
            });
            setConnections(newConns);
        }
        setWiringStart(null);
    };

    const toggleInputValue = (id: string) => {
        setNodes(ns => ns.map(n => n.id === id && n.type === 'INPUT' ? { ...n, value: !n.value } : n));
    };

    const addNode = (type: NodeType) => {
        setNodes(ns => [...ns, {
            id: `n_${Date.now()}`, type, x: 200, y: 100 + (ns.length * 20), label: type, value: false,
            params: (type === 'TON' || type === 'TOF') ? { delay: 2.0 } : undefined,
            state: { progress: 0 }
        }]);
    };

    const deleteNode = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes(ns => ns.filter(n => n.id !== id));
        setConnections(cs => cs.filter(c => c.fromNode !== id && c.toNode !== id));
    };

    // --- RENDER WIRES ---
    const renderWires = () => {
        const paths = [];

        // Active wiring
        if (wiringStart) {
            const node = nodes.find(n => n.id === wiringStart.node);
            if (node) {
                const conf = getNodeConfig(node.type);
                const startX = node.x + conf.w;
                const startY = node.y + (conf.h / 2);
                paths.push(
                    <path key="active" d={`M ${startX} ${startY} C ${startX + 40} ${startY}, ${mousePos.x - 40} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`} 
                        fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="5,5" className="animate-pulse pointer-events-none" />
                );
            }
        }

        // Completed wires
        connections.forEach(c => {
            const frm = nodes.find(n => n.id === c.fromNode);
            const to = nodes.find(n => n.id === c.toNode);
            if (frm && to) {
                const fConf = getNodeConfig(frm.type);
                const tConf = getNodeConfig(to.type);
                
                const startX = frm.x + fConf.w;
                const startY = frm.y + (fConf.h / 2);
                
                let tPinY = to.y + (tConf.h / 2);
                if (tConf.ins === 2) {
                    tPinY = to.y + (c.toPin === 0 ? tConf.h * 0.33 : tConf.h * 0.67);
                }

                const endX = to.x;
                const endY = tPinY;
                
                const isActive = frm.value;
                const strokeColor = isActive ? '#3b82f6' : (isDark ? '#475569' : '#cbd5e1'); 
                
                paths.push(
                    <g key={c.id} className="group cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); setConnections(cs => cs.filter(x => x.id !== c.id)) }}>
                        {/* Invisible thick path for easy clicking */}
                        <path d={`M ${startX} ${startY} C ${startX + 40} ${startY}, ${endX - 40} ${endY}, ${endX} ${endY}`} 
                            fill="none" strokeWidth="20" stroke="transparent" /> 
                        {/* Visible path */}
                        <path d={`M ${startX} ${startY} C ${startX + 40} ${startY}, ${endX - 40} ${endY}, ${endX} ${endY}`} 
                            fill="none" stroke={strokeColor} strokeWidth={isActive ? 4 : 3} className={`transition-all duration-100 ${isActive && simulating ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]' : ''} group-hover:stroke-red-500`} />
                    </g>
                );
            }
        });

        return paths;
    };

    // --- QUIZ FUNCTIONS ---
    const handleQuizAnswer = (index: number) => {
        if (showExplanation) return;
        setSelectedAnswer(index);
        setShowExplanation(true);
        if (index === QUIZ_QUESTIONS[quizStep].correctAnswer) {
            setQuizScore(s => s + 1);
        }
    };
    const nextQuestion = () => {
        if (quizStep < QUIZ_QUESTIONS.length - 1) {
            setQuizStep(s => s + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else setQuizFinished(true);
    };
    const resetQuiz = () => {
        setQuizStep(0);
        setQuizScore(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setQuizFinished(false);
    };


    return (
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1121]' : 'bg-slate-50'} text-slate-900`}>
            <PageSEO 
                title="Logic Sandbox & PLC Simulator | RelaySchool"
                description="Interactive IEC 61131-3 Function Block Diagram (FBD) simulator. Design and test industrial control logic, timers, and latches."
                url="/logicsandbox"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "RelaySchool LogicSandbox PRO",
                    "applicationCategory": "EducationalApplication",
                    "description": "Web-based industrial logic simulator for FBD (Function Block Diagram) design and testing."
                }}
            />
            
            {/* Header */}
            <header className="shrink-0 w-full bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-50">
                <div className="max-w-[1600px] mx-auto px-4 py-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">Logic<span className="text-blue-500">Sandbox</span><span className="opacity-80">PRO</span></h1>
                            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-1">IEC 61131-3 FBD Simulator</p>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        {isDark ? '☀️' : '🌙'}
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'editor', icon: Activity, label: 'Editor & Simulator' },
                        { id: 'theory', icon: BookOpen, label: 'Theory Library' },
                        { id: 'quiz', icon: Award, label: 'Knowledge Quiz' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <AnimatePresence mode="wait">
                    
                    {/* ========================================================= */}
                    {/* TAB: EDITOR & SIMULATOR */}
                    {/* ========================================================= */}
                    {activeTab === 'editor' && (
                        <motion.div 
                            key="editor"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto p-4 md:p-6 gap-6 h-full lg:overflow-hidden overflow-y-auto"
                        >
                            {/* --- TOOLBAR --- */}
                            <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                                
                                {/* Simulator Controls */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                                    <button onClick={() => setSimulating(!simulating)} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${simulating ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border dark:border-amber-700/50' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}>
                                        {simulating ? <Activity className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                                        {simulating ? 'Logic Running' : 'Start Simulation'}
                                    </button>

                                    <div className="relative group/menu">
                                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold transition-colors">
                                            <LayoutTemplate className="w-4 h-4" /> Load Preset <ChevronDown className="w-3 h-3 opacity-50"/>
                                        </button>
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hidden group-hover/menu:block z-50 overflow-hidden">
                                            <button onClick={() => loadPreset('overcurrent')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800">Overcurrent (50/51)</button>
                                            <button onClick={() => loadPreset('breaker_fail')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800">Breaker Failure (50BF)</button>
                                            <button onClick={() => loadPreset('motor_latch')} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800">DOL Starter Latch</button>
                                            <button onClick={() => loadPreset('blank')} className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Clear Canvas</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Node Library */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">IEC 61131-3 Library</h3>
                                    
                                    <div className="space-y-2">
                                        <button onClick={() => addNode('INPUT')} className="w-full p-2.5 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl text-blue-700 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><span>Standard Input</span> <Plus className="w-3 h-3"/></button>
                                        <button onClick={() => addNode('OUTPUT')} className="w-full p-2.5 flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl text-purple-700 dark:text-purple-400 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"><span>Coil Output</span> <Plus className="w-3 h-3"/></button>
                                        
                                        <div className="py-2"><hr className="border-slate-100 dark:border-slate-800" /></div>
                                        
                                        <button onClick={() => addNode('AND')} className="w-full p-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"><span>AND Logic</span> <Plus className="w-3 h-3"/></button>
                                        <button onClick={() => addNode('OR')} className="w-full p-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"><span>OR Logic</span> <Plus className="w-3 h-3"/></button>
                                        <button onClick={() => addNode('NOT')} className="w-full p-2.5 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"><span>NOT (Invert)</span> <Plus className="w-3 h-3"/></button>
                                        
                                        <div className="py-2"><hr className="border-slate-100 dark:border-slate-800" /></div>
                                        
                                        <button onClick={() => addNode('TON')} className="w-full p-2.5 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"><span>TON Timer</span> <Plus className="w-3 h-3"/></button>
                                        <button onClick={() => addNode('TOF')} className="w-full p-2.5 flex items-center justify-between bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-xl text-teal-700 dark:text-teal-400 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"><span>TOF Timer</span> <Plus className="w-3 h-3"/></button>
                                        
                                        <div className="py-2"><hr className="border-slate-100 dark:border-slate-800" /></div>

                                        <button onClick={() => addNode('RS')} className="w-full p-2.5 flex items-center justify-between bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"><span title="Reset Dominant">RS Latch (Reset)</span> <Plus className="w-3 h-3"/></button>
                                        <button onClick={() => addNode('SR')} className="w-full p-2.5 flex items-center justify-between bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"><span title="Set Dominant">SR Latch (Set)</span> <Plus className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            </div>

                            {/* --- CANVAS --- */}
                            <div className="flex-1 min-h-[400px] bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden relative">
                                {/* SVG Layer for wires */}
                                <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
                                    {renderWires()}
                                </svg>
                                
                                {/* HTML Layer for nodes */}
                                <div className="absolute inset-0 overflow-auto bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px]"
                                     onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
                                     {/* Expandable space */}
                                     <div style={{ width: 3000, height: 2000 }}></div>
                                </div>

                                {/* Nodes Render */}
                                {nodes.map(node => {
                                    const conf = getNodeConfig(node.type);
                                    const isActive = node.value;
                                    
                                    return (
                                        <div key={node.id} 
                                             className={`absolute z-20 border-2 rounded-xl shadow-sm cursor-grab active:cursor-grabbing select-none transition-colors 
                                                         ${conf.color} ${isActive ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900 ' + conf.ring : ''}`}
                                             style={{ left: node.x, top: node.y, width: conf.w, height: conf.h }}
                                             onPointerDown={(e) => { e.stopPropagation(); setDraggingNode(node.id); }}
                                        >
                                            {/* Delete Button */}
                                            <button onClick={(e) => deleteNode(node.id, e)} className="absolute -top-3 -right-3 bg-white dark:bg-slate-800 rounded-full p-1 shadow border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-200 z-40 transition-colors">
                                                <Trash2 className="w-3 h-3" />
                                            </button>

                                            {/* Output Pin */}
                                            {node.type !== 'OUTPUT' && (
                                                <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 cursor-copy z-30 transition-colors
                                                               ${isActive ? 'bg-blue-500 border-blue-200' : 'bg-white dark:bg-slate-800 border-slate-400 hover:border-blue-500'}`}
                                                     onPointerDown={(e) => startWiring(e, node.id)} />
                                            )}

                                            {/* Input Pins */}
                                            {conf.ins > 0 && Array.from({ length: conf.ins }).map((_, i) => (
                                                <div key={i} className="absolute -left-2 w-4 h-4 rounded-full border-2 border-slate-400 bg-white dark:bg-slate-800 cursor-crosshair hover:border-blue-500 z-30 transition-colors"
                                                     style={{ top: conf.ins === 1 ? '50%' : (i === 0 ? '33%' : '67%'), transform: 'translateY(-50%)' }}
                                                     onPointerUp={(e) => finishWiring(e, node.id, i)} />
                                            ))}

                                            {/* Pin Labels (RS/SR) */}
                                            {conf.labels && (
                                                <div className="absolute inset-y-0 left-3 flex flex-col justify-around py-1 pointer-events-none">
                                                    {conf.labels.map((lbl, i) => (
                                                        <span key={i} className="text-[9px] font-black opacity-50">{lbl}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Node Body */}
                                            <div className="w-full h-full flex flex-col items-center justify-center p-2 relative overflow-hidden rounded-xl">
                                                
                                                {/* Timer Progress Bar Background */}
                                                {(node.type === 'TON' || node.type === 'TOF') && (
                                                    <div className="absolute bottom-0 left-0 h-1.5 bg-black/10 dark:bg-white/10 w-full">
                                                        <div className="h-full bg-emerald-500 transition-all duration-[50ms]" style={{ width: `${node.state?.progress || 0}%` }} />
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1.5 w-full justify-center">
                                                    {conf.icon && <conf.icon className="w-3.5 h-3.5 opacity-70" />}
                                                    <span className="font-black text-[11px] uppercase tracking-wider">{node.label}</span>
                                                </div>
                                                
                                                {/* Input Toggle */}
                                                {node.type === 'INPUT' && (
                                                    <button onClick={(e) => { e.stopPropagation(); toggleInputValue(node.id); }} className={`mt-1.5 w-8 h-4 rounded-full transition-colors relative shadow-inner ${isActive ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                        <div className={`absolute top-[2px] w-3 h-3 bg-white rounded-full transition-all shadow-sm ${isActive ? 'left-[18px]' : 'left-[2px]'}`} />
                                                    </button>
                                                )}

                                                {/* Timer Param Config */}
                                                {(node.type === 'TON' || node.type === 'TOF') && (
                                                    <div className="flex items-center justify-center mt-1" onPointerDown={e => e.stopPropagation()}>
                                                        <input type="number" min="0" step="0.1" value={node.params.delay} 
                                                            onChange={(e) => {
                                                                const v = Number(e.target.value);
                                                                setNodes(ns => ns.map(n => n.id === node.id ? { ...n, params: { delay: v } } : n));
                                                            }}
                                                            className="w-10 bg-white/50 dark:bg-black/20 text-center text-[10px] font-mono font-bold rounded outline-none border border-transparent focus:border-emerald-500/50" />
                                                        <span className="text-[9px] font-bold ml-0.5 opacity-70">sec</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Hint Overlay */}
                                <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
                                    <div className="inline-block bg-slate-900/60 dark:bg-black/50 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                                        Drag Output Pins to Input Pins to connect • Nodes snap to grid
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB: THEORY LIBRARY */}
                    {/* ========================================================= */}
                    {activeTab === 'theory' && (
                        <motion.div key="theory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar">
                            <div className="text-center mb-10 pt-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mb-6 shadow-inner">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-black mb-4">FBD Theory Library</h2>
                                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                                    Comprehensive engineering reference material for IEC 61131-3 logic programming, utilizing pure mathematical boolean expressions.
                                </p>
                            </div>

                            <div className="space-y-8 pb-12">
                                {THEORY_SECTIONS.map((section, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-bl-[100px] -z-10 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors duration-500" />
                                        
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-black shadow-inner shrink-0">
                                                {idx + 1}
                                            </div>
                                            {section.title}
                                        </h3>
                                        <div className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {section.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB: KNOWLEDGE QUIZ */}
                    {/* ========================================================= */}
                    {activeTab === 'quiz' && (
                        <motion.div key="quiz" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col justify-center">
                            
                            {!quizFinished ? (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden w-full">
                                    {/* Progress Bar */}
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2">
                                        <div 
                                            className="bg-blue-500 h-full transition-all duration-500"
                                            style={{ width: `${((quizStep) / QUIZ_QUESTIONS.length) * 100}%` }}
                                        />
                                    </div>

                                    <div className="p-8 md:p-12">
                                        <div className="flex justify-between items-center mb-8">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Question {quizStep + 1} of {QUIZ_QUESTIONS.length}</span>
                                            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">Score: {quizScore}</span>
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-bold mb-8 leading-tight">
                                            {QUIZ_QUESTIONS[quizStep].question}
                                        </h3>

                                        <div className="space-y-4 mb-8">
                                            {QUIZ_QUESTIONS[quizStep].options.map((option, idx) => {
                                                const isSelected = selectedAnswer === idx;
                                                const isCorrect = idx === QUIZ_QUESTIONS[quizStep].correctAnswer;
                                                
                                                let stateClass = "border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/5";
                                                
                                                if (showExplanation) {
                                                    if (isCorrect) stateClass = "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/50 dark:text-emerald-100";
                                                    else if (isSelected) stateClass = "bg-rose-50 border-rose-500 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/50 dark:text-rose-100";
                                                    else stateClass = "opacity-50 border-slate-200 dark:border-slate-800";
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        disabled={showExplanation}
                                                        onClick={() => handleQuizAnswer(idx)}
                                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${stateClass} flex items-start gap-4`}
                                                    >
                                                        <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${showExplanation && isCorrect ? 'border-emerald-500 text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50' : showExplanation && isSelected ? 'border-rose-500 text-rose-600 bg-rose-100 dark:bg-rose-900/50' : 'border-slate-300 dark:border-slate-600'}`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <span className="leading-snug">{option}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <AnimatePresence>
                                            {showExplanation && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8">
                                                    <div className={`p-5 rounded-2xl ${selectedAnswer === QUIZ_QUESTIONS[quizStep].correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                                                        <h4 className={`text-sm font-bold uppercase mb-2 ${selectedAnswer === QUIZ_QUESTIONS[quizStep].correctAnswer ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                            {selectedAnswer === QUIZ_QUESTIONS[quizStep].correctAnswer ? 'Correct!' : 'Incorrect'}
                                                        </h4>
                                                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                                            {QUIZ_QUESTIONS[quizStep].explanation}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {showExplanation && (
                                            <button onClick={nextQuestion} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                                {quizStep === QUIZ_QUESTIONS.length - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRight className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-12 text-center w-full">
                                    <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Award className="w-12 h-12" />
                                    </div>
                                    <h2 className="text-3xl font-black mb-2">Quiz Complete!</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8">You scored {quizScore} out of {QUIZ_QUESTIONS.length}.</p>
                                    
                                    <div className="flex justify-center gap-4">
                                        <button onClick={resetQuiz} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> Retake Quiz
                                        </button>
                                        <button onClick={() => setActiveTab('editor')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
                                            Back to Editor
                                        </button>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}