import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cpu, Play, Download, Trash2, Plus, Info, LayoutTemplate, Activity } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from "../components/SEO";

type NodeType = 'INPUT' | 'OUTPUT' | 'AND' | 'OR' | 'NOT' | 'TON' | 'RS';

interface LogicNode {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    label: string;
    value: boolean;       // Current output state
    params?: any;         // e.g. delay for TON
    state?: any;          // internal state (timer start time, RS state)
}

interface Connection {
    id: string;
    fromNode: string;
    toNode: string;
    toPin: number;        // index of input pin on target node
}

const PIN_H = 20;

const LogicSandbox = () => {
    useThemeObserver();

    const [nodes, setNodes] = useState<LogicNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [wiringStart, setWiringStart] = useState<{ node: string } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    
    const [simulating, setSimulating] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // Initial Example: Overcurrent Trip
    useEffect(() => {
        loadPreset('overcurrent');
    }, []);

    const loadPreset = (preset: string) => {
        setSimulating(false);
        if (preset === 'overcurrent') {
            setNodes([
                { id: 'in1', type: 'INPUT', x: 50, y: 100, label: '50P (Inst)', value: false },
                { id: 'in2', type: 'INPUT', x: 50, y: 200, label: '51P (Time)', value: false },
                { id: 'or1', type: 'OR', x: 300, y: 130, label: 'OR', value: false },
                { id: 'out1', type: 'OUTPUT', x: 550, y: 140, label: 'TRIP_COIL', value: false }
            ]);
            setConnections([
                { id: 'c1', fromNode: 'in1', toNode: 'or1', toPin: 0 },
                { id: 'c2', fromNode: 'in2', toNode: 'or1', toPin: 1 },
                { id: 'c3', fromNode: 'or1', toNode: 'out1', toPin: 0 }
            ]);
        } else if (preset === 'breaker_fail') {
            setNodes([
                { id: 'in1', type: 'INPUT', x: 50, y: 100, label: 'Trip Cmd', value: false },
                { id: 'in2', type: 'INPUT', x: 50, y: 200, label: '52a (Closed)', value: false },
                { id: 'and1', type: 'AND', x: 250, y: 130, label: 'AND', value: false },
                { id: 'ton1', type: 'TON', x: 450, y: 130, label: 'TON 200ms', value: false, params: { delay: 0.2 }, state: { activeAt: 0 } },
                { id: 'out1', type: 'OUTPUT', x: 650, y: 130, label: 'BF_TRIP', value: false }
            ]);
            setConnections([
                { id: 'c1', fromNode: 'in1', toNode: 'and1', toPin: 0 },
                { id: 'c2', fromNode: 'in2', toNode: 'and1', toPin: 1 },
                { id: 'c3', fromNode: 'and1', toNode: 'ton1', toPin: 0 },
                { id: 'c4', fromNode: 'ton1', toNode: 'out1', toPin: 0 }
            ]);
        } else {
            setNodes([]);
            setConnections([]);
        }
    };

    // Simulation Loop
    useEffect(() => {
        if (!simulating) return;
        const interval = setInterval(() => {
            setNodes(prevNodes => {
                const nextNodes = [...prevNodes];
                
                // Get node value helper
                const getInputValue = (targetId: string, pinId: number) => {
                    const conn = connections.find(c => c.toNode === targetId && c.toPin === pinId);
                    if (!conn) return false;
                    const source = nextNodes.find(n => n.id === conn.fromNode);
                    return source ? source.value : false;
                };

                const now = Date.now();

                // Evaluate gates
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
                            if (in0) node.value = true;       // Set
                            else if (in1) node.value = false; // Reset (Reset dominant usually, but check first)
                            break;
                        case 'TON':
                            if (in0) {
                                if (!node.state?.activeAt) node.state = { activeAt: now };
                                else if (now - node.state.activeAt >= (node.params?.delay || 1) * 1000) {
                                    node.value = true;
                                }
                            } else {
                                node.state = { activeAt: 0 };
                                node.value = false;
                            }
                            break;
                    }
                }
                return nextNodes;
            });
        }, 50); // 20fps simulation
        
        return () => clearInterval(interval);
    }, [simulating, connections]); // Depend on connections so router can update

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!svgRef.current) return;
        const pt = DOMPoint.fromPoint(e);
        const rect = svgRef.current.getBoundingClientRect();
        const x = pt.x - rect.left;
        const y = pt.y - rect.top;
        setMousePos({ x, y });

        if (draggingNode) {
            setNodes(ns => ns.map(n => n.id === draggingNode ? { ...n, x: x - 40, y: y - 20 } : n));
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
            // Remove existing connection to this pin if any
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
            id: `n_${Date.now()}`, type, x: 100 + ns.length * 20, y: 100, label: type, value: false,
            params: type === 'TON' ? { delay: 1.0 } : undefined
        }]);
    };

    const deleteNode = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes(ns => ns.filter(n => n.id !== id));
        setConnections(cs => cs.filter(c => c.fromNode !== id && c.toNode !== id));
    };

    const getNodeConfig = (type: NodeType) => {
        switch (type) {
            case 'INPUT': return { w: 100, h: 40, ins: 0, color: 'fill-blue-100 stroke-blue-500 text-blue-800' };
            case 'OUTPUT': return { w: 100, h: 40, ins: 1, color: 'fill-purple-100 stroke-purple-500 text-purple-800' };
            case 'AND': return { w: 80, h: 60, ins: 2, color: 'fill-slate-100 stroke-slate-500 text-slate-800' };
            case 'OR': return { w: 80, h: 60, ins: 2, color: 'fill-slate-100 stroke-slate-500 text-slate-800' };
            case 'NOT': return { w: 80, h: 40, ins: 1, color: 'fill-amber-100 stroke-amber-500 text-amber-800' };
            case 'TON': return { w: 100, h: 60, ins: 1, color: 'fill-emerald-100 stroke-emerald-500 text-emerald-800' };
            case 'RS': return { w: 80, h: 60, ins: 2, color: 'fill-rose-100 stroke-rose-500 text-rose-800', labels: ['S', 'R'] };
            default: return { w: 80, h: 40, ins: 1, color: 'fill-slate-100 stroke-slate-500 text-slate-800' };
        }
    };

    // Calculate nice bezier curves for wires
    const renderWires = () => {
        const paths = [];

        // Active wiring line
        if (wiringStart) {
            const node = nodes.find(n => n.id === wiringStart.node);
            if (node) {
                const conf = getNodeConfig(node.type);
                const startX = node.x + conf.w;
                const startY = node.y + (conf.h / 2);
                paths.push(
                    <path key="active" d={`M ${startX} ${startY} Q ${(startX + mousePos.x)/2} ${startY} ${(startX + mousePos.x)/2} ${(startY + mousePos.y)/2} T ${mousePos.x} ${mousePos.y}`} 
                        fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse pointer-events-none" />
                );
            }
        }

        // Completed connections
        connections.forEach(c => {
            const frm = nodes.find(n => n.id === c.fromNode);
            const to = nodes.find(n => n.id === c.toNode);
            if (frm && to) {
                const fConf = getNodeConfig(frm.type);
                const tConf = getNodeConfig(to.type);
                
                const startX = frm.x + fConf.w;
                const startY = frm.y + (fConf.h / 2);
                
                // Pin spacing logic: if 1 pin, center. If 2 pins, 1/3 and 2/3 down.
                let tPinY = to.y + (tConf.h / 2);
                if (tConf.ins === 2) {
                    tPinY = to.y + (c.toPin === 0 ? tConf.h * 0.33 : tConf.h * 0.67);
                }

                const endX = to.x;
                const endY = tPinY;
                
                // Signal state for wire color
                const isActive = frm.value;
                const strokeColor = isActive ? '#3b82f6' : '#94a3b8'; // Blue if active, slate if inactive
                
                paths.push(
                    <g key={c.id} className="group cursor-pointer" onClick={(e) => { e.stopPropagation(); setConnections(cs => cs.filter(x => x.id !== c.id)) }}>
                        <path d={`M ${startX} ${startY} C ${startX + 40} ${startY}, ${endX - 40} ${endY}, ${endX} ${endY}`} 
                            fill="none" strokeWidth="10" stroke="transparent" /> 
                        <path d={`M ${startX} ${startY} C ${startX + 40} ${startY}, ${endX - 40} ${endY}, ${endX} ${endY}`} 
                            fill="none" stroke={strokeColor} strokeWidth={isActive ? 3 : 2} className={`transition-all ${isActive && simulating ? 'drop-shadow-md' : ''} group-hover:stroke-red-500`} />
                    </g>
                );
            }
        });

        return paths;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] max-w-[1600px] mx-auto p-6 animate-fade-in font-sans">
            <SEO title="Logic Sandbox PRO" description="IEC 61131-3 Function Block Diagram (FBD) Logic Editor." url="/logicsandbox" />

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <Cpu className="w-6 h-6 text-blue-600" /> IEC 61131-3 Logic Editor <span className="text-blue-600">PRO</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 flex gap-4 mt-2">
                        <span>■ Function Block Diagrams (FBD)</span>
                        <span>■ Real-time Protection Logic Processing</span>
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => setSimulating(!simulating)} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${simulating ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'}`}>
                        {simulating ? <Activity className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                        {simulating ? 'Logic Running' : 'Start Simulation'}
                    </button>
                    <div className="relative group/menu">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-sm font-bold">
                            <LayoutTemplate className="w-4 h-4" /> Presets
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hidden group-hover/menu:block z-50">
                            <div className="p-2 space-y-1">
                                <button onClick={() => loadPreset('overcurrent')} className="w-full text-left p-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded">Overcurrent (50/51)</button>
                                <button onClick={() => loadPreset('breaker_fail')} className="w-full text-left p-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded">Breaker Failure (50BF)</button>
                                <hr className="border-slate-100 dark:border-slate-800" />
                                <button onClick={() => loadPreset('blank')} className="w-full text-left p-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">Clear Canvas</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* TOOLBAR */}
                <div className="w-56 shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Library 61131-3</h3>
                        
                        <div className="space-y-2">
                            <button onClick={() => addNode('INPUT')} className="w-full p-2 flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"><span>Standard Input</span> <Plus className="w-3 h-3"/></button>
                            <button onClick={() => addNode('OUTPUT')} className="w-full p-2 flex items-center justify-between bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/30 rounded-lg text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors"><span>Coil Output</span> <Plus className="w-3 h-3"/></button>
                            <hr className="my-2 border-slate-100 dark:border-slate-800" />
                            <button onClick={() => addNode('AND')} className="w-full p-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-colors"><span>AND Logic</span> <Plus className="w-3 h-3"/></button>
                            <button onClick={() => addNode('OR')} className="w-full p-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-colors"><span>OR Logic</span> <Plus className="w-3 h-3"/></button>
                            <button onClick={() => addNode('NOT')} className="w-full p-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-amber-700 text-xs font-bold hover:bg-slate-100 transition-colors"><span>NOT (Inverter)</span> <Plus className="w-3 h-3"/></button>
                            <hr className="my-2 border-slate-100 dark:border-slate-800" />
                            <button onClick={() => addNode('TON')} className="w-full p-2 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-lg text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"><span>TON (Timer On)</span> <Plus className="w-3 h-3"/></button>
                            <button onClick={() => addNode('RS')} className="w-full p-2 flex items-center justify-between bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-lg text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"><span>RS Flip-Flop</span> <Plus className="w-3 h-3"/></button>
                        </div>
                    </div>
                </div>

                {/* CANVAS */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden relative">
                    {/* SVG Layer for wires */}
                    <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
                        {renderWires()}
                    </svg>
                    
                    {/* HTML Layer for interactive nodes */}
                    <div className="absolute inset-0 overflow-auto bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px]"
                         onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
                         {/* Scale helper */}
                         <div style={{ width: 3000, height: 2000 }}></div>
                    </div>

                    {/* Logic Nodes */}
                    {nodes.map(node => {
                        const conf = getNodeConfig(node.type);
                        
                        return (
                            <div key={node.id} 
                                 className={`absolute z-20 border-2 rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none transition-transform bg-white dark:bg-slate-900
                                             ${node.value ? 'border-blue-500 shadow-blue-500/20' : 'border-slate-300 dark:border-slate-700'}`}
                                 style={{ left: node.x, top: node.y, width: conf.w, height: conf.h }}
                                 onPointerDown={(e) => { e.stopPropagation(); setDraggingNode(node.id); }}
                            >
                                {/* Output Pin */}
                                {node.type !== 'OUTPUT' && (
                                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-slate-400 bg-white dark:bg-slate-800 cursor-copy hover:border-blue-500 z-30"
                                         onPointerDown={(e) => startWiring(e, node.id)} />
                                )}

                                {/* Input Pins */}
                                {conf.ins > 0 && Array.from({ length: conf.ins }).map((_, i) => (
                                    <div key={i} className="absolute -left-3 w-4 h-4 rounded-full border-2 border-slate-400 bg-white dark:bg-slate-800 cursor-crosshair hover:bg-blue-100 z-30"
                                         style={{ top: conf.ins === 1 ? '50%' : (i === 0 ? '33%' : '67%'), transform: 'translateY(-50%)' }}
                                         onPointerUp={(e) => finishWiring(e, node.id, i)} />
                                ))}

                                {/* Node Body */}
                                <div className="w-full h-full flex flex-col pt-1 relative">
                                    <button onClick={(e) => deleteNode(node.id, e)} className="absolute -top-3 -right-3 bg-white rounded-full p-0.5 shadow border text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                    
                                    <div className={`text-center font-black text-xs uppercase tracking-wider ${node.value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {node.label}
                                    </div>
                                    
                                    {/* Editable Label / Control */}
                                    {node.type === 'INPUT' && (
                                        <div className="flex justify-center mt-1">
                                            <button onClick={(e) => { e.stopPropagation(); toggleInputValue(node.id); }} className={`w-8 h-4 rounded-full transition-colors relative ${node.value ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${node.value ? 'left-4.5 translate-x-3.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    )}

                                    {node.type === 'TON' && (
                                        <div className="flex justify-center mt-1 px-1" onPointerDown={e => e.stopPropagation()}>
                                            <input type="number" min="0" step="0.1" value={node.params.delay} 
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    setNodes(ns => ns.map(n => n.id === node.id ? { ...n, params: { delay: v } } : n));
                                                }}
                                                className="w-12 text-[10px] text-center bg-slate-100 dark:bg-slate-800 rounded font-mono" />
                                            <span className="text-[10px] text-slate-400 ml-1 font-bold">s</span>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-1 flex justify-between px-1 pointer-events-none">
                                        <div className="flex flex-col gap-1 w-full relative h-full">
                                            {conf.labels?.map((lbl, i) => (
                                                <span key={i} style={{ position: 'absolute', left: 4, top: conf.ins===1 ? 8 : (i===0 ? -6 : 14), fontSize: 8 }} className="font-bold text-slate-400">{lbl}</span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">
                Click wire to delete • Drag output pin to draw wire • Drop onto input pin • Logic is standard Boolean algebra
            </div>
        </div>
    );
};

export default LogicSandbox;
