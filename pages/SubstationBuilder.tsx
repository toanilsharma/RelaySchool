import React, { useState, useCallback, useRef } from 'react';
import { Network, Zap, RefreshCw, Hand, Download, Share2, Info } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from "../components/SEO";

type ComponentType = 
    | 'EMPTY' | 'WIRE' | 'SOURCE' | 'BUS' 
    | 'BREAKER_CLOSED' | 'BREAKER_OPEN' 
    | 'TRANSFORMER' | 'LOAD' 
    | 'CT' | 'VT' | 'RELAY_50' | 'RELAY_87';

interface GridCell {
    x: number;
    y: number;
    type: ComponentType;
    powered: boolean;
    zoneId?: number; // For protection zones
}

const GRID_W = 24;
const GRID_H = 16;
const CELL_SIZE = 40; // px

const TOOLS: { type: ComponentType; name: string; category: string }[] = [
    { type: 'EMPTY', name: 'Eraser', category: 'Basic' },
    { type: 'WIRE', name: 'Wire / Connection', category: 'Basic' },
    { type: 'SOURCE', name: 'Grid Source', category: 'Power' },
    { type: 'BUS', name: 'Busbar', category: 'Power' },
    { type: 'TRANSFORMER', name: 'Transformer', category: 'Power' },
    { type: 'LOAD', name: 'Motor Load', category: 'Power' },
    { type: 'BREAKER_CLOSED', name: 'Breaker (Closed)', category: 'Switchgear' },
    { type: 'BREAKER_OPEN', name: 'Breaker (Open)', category: 'Switchgear' },
    { type: 'CT', name: 'Current Transformer', category: 'Protection' },
    { type: 'VT', name: 'Voltage Transformer', category: 'Protection' },
    { type: 'RELAY_50', name: 'Overcurrent Relay (50/51)', category: 'Protection' },
    { type: 'RELAY_87', name: 'Differential Relay (87)', category: 'Protection' },
];

export default function SubstationBuilder() {
    useThemeObserver();
    
    const [grid, setGrid] = useState<GridCell[]>(() => {
        const initial = [];
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                initial.push({ x, y, type: 'EMPTY', powered: false });
            }
        }
        return initial as GridCell[];
    });

    const [activeTool, setActiveTool] = useState<ComponentType>('WIRE');
    const [isDragging, setIsDragging] = useState(false);
    const [hoverCell, setHoverCell] = useState<{x: number, y: number} | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Get cell neighbors for wire drawing
    const getNeighbors = (g: GridCell[], cx: number, cy: number) => {
        const hasConn = (nx: number, ny: number) => {
            const cell = g.find(c => c.x === nx && c.y === ny);
            return cell && cell.type !== 'EMPTY';
        };
        return {
            n: hasConn(cx, cy - 1),
            s: hasConn(cx, cy + 1),
            w: hasConn(cx - 1, cy),
            e: hasConn(cx + 1, cy)
        };
    };

    const runPowerFlow = useCallback(() => {
        setGrid(prev => {
            const next = prev.map(c => ({ ...c, powered: false }));
            
            const queue = next.filter(c => c.type === 'SOURCE');
            queue.forEach(q => q.powered = true);

            const visited = new Set<string>();
            queue.forEach(q => visited.add(`${q.x},${q.y}`));

            while (queue.length > 0) {
                const curr = queue.shift()!;
                
                const neighbors = [
                    next.find(c => c.x === curr.x + 1 && c.y === curr.y),
                    next.find(c => c.x === curr.x - 1 && c.y === curr.y),
                    next.find(c => c.x === curr.x && c.y === curr.y + 1),
                    next.find(c => c.x === curr.x && c.y === curr.y - 1)
                ].filter(Boolean) as GridCell[];

                for (const n of neighbors) {
                    const id = `${n.x},${n.y}`;
                    if (!visited.has(id)) {
                        // Conductive elements
                        if (['WIRE', 'BUS', 'BREAKER_CLOSED', 'TRANSFORMER', 'LOAD', 'CT', 'VT', 'RELAY_50', 'RELAY_87'].includes(n.type)) {
                            n.powered = true;
                            visited.add(id);
                            // Power stops at loads and open breakers
                            if (n.type !== 'LOAD' && n.type !== 'BREAKER_OPEN') {
                                queue.push(n);
                            }
                        }
                    }
                }
            }
            return next;
        });
    }, []);

    const applyToolToCell = (x: number, y: number) => {
        setGrid(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(c => c.x === x && c.y === y);
            if (activeTool === 'EMPTY' && copy[idx].type === 'BREAKER_CLOSED') {
                copy[idx] = { ...copy[idx], type: 'BREAKER_OPEN' };
            } else if (activeTool === 'EMPTY' && copy[idx].type === 'BREAKER_OPEN') {
                copy[idx] = { ...copy[idx], type: 'BREAKER_CLOSED' };
            } else {
                copy[idx] = { ...copy[idx], type: activeTool };
            }
            return copy;
        });
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        const { x, y } = getGridCoords(e);
        applyToolToCell(x, y);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const { x, y } = getGridCoords(e);
        setHoverCell({ x, y });
        if (!isDragging) return;
        applyToolToCell(x, y);
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        runPowerFlow();
    };

    const handlePointerLeave = () => {
        setHoverCell(null);
        handlePointerUp();
    };

    const getGridCoords = (e: React.PointerEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        const pt = DOMPoint.fromPoint({ x: e.clientX, y: e.clientY });
        // Map native pixels to SVG coordinate system
        const smx = pt.x - rect.left;
        const smy = pt.y - rect.top;
        const scaleX = (GRID_W * CELL_SIZE) / rect.width;
        const scaleY = (GRID_H * CELL_SIZE) / rect.height;
        let x = Math.floor((smx * scaleX) / CELL_SIZE);
        let y = Math.floor((smy * scaleY) / CELL_SIZE);
        x = Math.max(0, Math.min(x, GRID_W - 1));
        y = Math.max(0, Math.min(y, GRID_H - 1));
        return { x, y };
    };

    const clearGrid = () => {
        setGrid(prev => prev.map(c => ({ ...c, type: 'EMPTY', powered: false })));
    };

    const exportSLD = () => {
        if (!svgRef.current) return;
        
        // Clone the SVG and prepare for export
        const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
        
        // Inline styles for export
        const style = document.createElement('style');
        style.innerHTML = `
            .sld-wire { stroke: #333; stroke-width: 2; fill: none; }
            .sld-powered { stroke: #eab308; }
            .sld-fill { fill: #333; }
            .sld-powered-fill { fill: #eab308; }
            .sld-text { fill: #333; font-family: sans-serif; font-size: 10px; font-weight: bold; }
            .sld-bg { fill: #ffffff; }
        `;
        svgClone.prepend(style);
        
        // Add white background rect
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', '100%');
        bg.setAttribute('height', '100%');
        bg.setAttribute('fill', '#ffffff');
        svgClone.prepend(bg);

        // Remove grid lines for cleaner export
        const gridLines = svgClone.querySelector('#bg-grid');
        if (gridLines) gridLines.remove();

        const svgData = new XMLSerializer().serializeToString(svgClone);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `RelaySchool_SLD_${new Date().getTime()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Render an IEEE Symbol inside a cell (40x40)
    const renderSymbol = (cell: GridCell) => {
        const hw = CELL_SIZE / 2; // 20
        const strokeColor = cell.powered ? "stroke-amber-500" : "stroke-slate-800 dark:stroke-slate-200";
        const fillColor = cell.powered ? "fill-amber-500" : "fill-slate-800 dark:fill-slate-200";
        const textColor = cell.powered ? "fill-amber-600" : "fill-slate-600 dark:fill-slate-400";
        const baseClass = `transition-colors duration-300 ${strokeColor} sld-wire ${cell.powered ? 'sld-powered' : ''}`;
        
        const nbrs = getNeighbors(grid, cell.x, cell.y);

        let content = null;
        
        // Auto-wire helper: draw lines to connected neighbors
        const crossWires = () => (
            <>
                {(nbrs.n || nbrs.s) && <line x1={hw} y1={nbrs.n ? 0 : hw} x2={hw} y2={nbrs.s ? CELL_SIZE : hw} className={baseClass} strokeWidth="2" />}
                {(nbrs.w || nbrs.e) && <line x1={nbrs.w ? 0 : hw} y1={hw} x2={nbrs.e ? CELL_SIZE : hw} y2={hw} className={baseClass} strokeWidth="2" />}
            </>
        );

        switch (cell.type) {
            case 'WIRE':
                // Smart wire rendering based on neighbors
                const nConnections = [nbrs.n, nbrs.s, nbrs.e, nbrs.w].filter(Boolean).length;
                if (nConnections === 0) content = <circle cx={hw} cy={hw} r={2} className={`${fillColor} sld-fill`} />;
                else if (nConnections === 1) content = crossWires();
                else if (nConnections === 2) {
                    if (nbrs.n && nbrs.s) content = <line x1={hw} y1={0} x2={hw} y2={CELL_SIZE} className={baseClass} strokeWidth="2" />;
                    else if (nbrs.e && nbrs.w) content = <line x1={0} y1={hw} x2={CELL_SIZE} y2={hw} className={baseClass} strokeWidth="2" />;
                    else content = crossWires(); // corner
                }
                else content = crossWires(); // junction
                break;
            case 'BUS':
                content = (
                    <>
                        <line x1={0} y1={hw} x2={CELL_SIZE} y2={hw} className={baseClass} strokeWidth="6" />
                        {nbrs.n && <line x1={hw} y1={0} x2={hw} y2={hw} className={baseClass} strokeWidth="2" />}
                        {nbrs.s && <line x1={hw} y1={hw} x2={hw} y2={CELL_SIZE} className={baseClass} strokeWidth="2" />}
                    </>
                );
                break;
            case 'SOURCE':
                content = (
                    <>
                        <line x1={hw} y1={CELL_SIZE} x2={hw} y2={hw+12} className={baseClass} strokeWidth="2" />
                        <circle cx={hw} cy={hw-2} r={14} fill="none" className={baseClass} strokeWidth="2" />
                        <path d="M 12 18 Q 16 12 20 18 T 28 18" fill="none" className={baseClass} strokeWidth="2" />
                    </>
                );
                break;
            case 'TRANSFORMER':
                content = (
                    <>
                        <line x1={hw} y1={0} x2={hw} y2={8} className={baseClass} strokeWidth="2" />
                        <line x1={hw} y1={32} x2={hw} y2={CELL_SIZE} className={baseClass} strokeWidth="2" />
                        <circle cx={hw} cy={14} r={8} fill="none" className={baseClass} strokeWidth="2" />
                        <circle cx={hw} cy={26} r={8} fill="none" className={baseClass} strokeWidth="2" />
                    </>
                );
                break;
            case 'BREAKER_CLOSED':
                content = (
                    <>
                        {crossWires()}
                        <rect x={hw-8} y={hw-8} width={16} height={16} className={`${fillColor} sld-fill`} />
                    </>
                );
                break;
            case 'BREAKER_OPEN':
                content = (
                    <>
                        {crossWires()}
                        <rect x={hw-8} y={hw-8} width={16} height={16} fill="none" className={baseClass} strokeWidth="2" />
                        <line x1={hw-8} y1={hw-8} x2={hw+8} y2={hw+8} className={baseClass} strokeWidth="2" />
                    </>
                );
                break;
            case 'LOAD':
                content = (
                    <>
                        <line x1={hw} y1={0} x2={hw} y2={8} className={baseClass} strokeWidth="2" />
                        <circle cx={hw} cy={22} r={14} fill="none" className={baseClass} strokeWidth="2" />
                        <text x={hw} y={26} textAnchor="middle" fontSize="12" fontWeight="bold" className={`${textColor} sld-text`}>M</text>
                    </>
                );
                break;
            case 'CT':
                content = (
                    <>
                        {crossWires()}
                        <circle cx={hw} cy={hw} r={6} fill="none" className={baseClass} strokeWidth="2" />
                        {nbrs.n || nbrs.s ? (
                             <path d={`M ${hw-6} ${hw} Q ${hw-12} ${hw-6} ${hw-6} ${hw-12}`} fill="none" className={baseClass} strokeWidth="2" />
                        ) : (
                             <path d={`M ${hw} ${hw-6} Q ${hw+6} ${hw-12} ${hw+12} ${hw-6}`} fill="none" className={baseClass} strokeWidth="2" />
                        )}
                    </>
                );
                break;
            case 'VT':
                content = (
                    <>
                        {crossWires()}
                        <line x1={hw} y1={hw} x2={hw+15} y2={hw} className={baseClass} strokeWidth="2" />
                        <circle cx={hw+15} cy={hw-5} r={4} fill="none" className={baseClass} strokeWidth="2" />
                        <circle cx={hw+15} cy={hw+5} r={4} fill="none" className={baseClass} strokeWidth="2" />
                        <line x1={hw+15} y1={hw+9} x2={hw+15} y2={hw+14} className={baseClass} strokeWidth="2" />
                        <line x1={hw+11} y1={hw+14} x2={hw+19} y2={hw+14} className={baseClass} strokeWidth="2" />
                    </>
                );
                break;
            case 'RELAY_50':
            case 'RELAY_87':
                const label = cell.type === 'RELAY_50' ? '50/51' : '87';
                content = (
                    <>
                        {crossWires()}
                        <rect x={hw-12} y={hw-12} width={24} height={24} fill="none" className={baseClass} strokeWidth="2" strokeDasharray="3,2" />
                        <text x={hw} y={hw+4} textAnchor="middle" fontSize="9" fontWeight="bold" className={`${textColor} sld-text`}>{label}</text>
                    </>
                );
                break;
            default:
                break;
        }

        return (
            <g transform={`translate(${cell.x * CELL_SIZE}, ${cell.y * CELL_SIZE})`} key={`${cell.x}-${cell.y}`} style={{ filter: cell.powered && cell.type !== 'EMPTY' && cell.type !== 'WIRE' ? 'url(#glow-active)' : 'none' }}>
                {content}
                {cell.powered && cell.type !== 'EMPTY' && (
                    <rect width={CELL_SIZE} height={CELL_SIZE} fill="#fbbf24" opacity="0.1" className="pointer-events-none animate-pulse" style={{ mixBlendMode: 'overlay' }} />
                )}
            </g>
        );
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12 animate-fade-in font-sans h-[calc(100vh-80px)] flex flex-col">
            <SEO title="Substation Builder Pro" description="Interactive IEEE Single-Line Diagram builder and simulator." url="/substationbuilder" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0 px-6 pt-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <Network className="w-6 h-6 text-blue-600" /> Substation Builder <span className="text-blue-600">PRO</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        IEEE C37 / IEC 61850 compliant Single-Line Diagram (SLD) editor with real-time topology processing.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={runPowerFlow} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-lg text-xs font-bold transition-all">
                        <Zap className="w-4 h-4" /> Run Power Flow
                    </button>
                    <button onClick={exportSLD} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors">
                        <Download className="w-4 h-4" /> Export SLD
                    </button>
                    <button onClick={clearGrid} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg text-xs font-bold transition-colors">
                        <RefreshCw className="w-4 h-4" /> Clear
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-6 px-6 overflow-hidden">
                
                {/* TOOLBOX */}
                <div className="w-64 shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-6">
                    {['Basic', 'Power', 'Switchgear', 'Protection'].map(category => (
                        <div key={category} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{category}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {TOOLS.filter(t => t.category === category).map(t => (
                                    <button
                                        key={t.type}
                                        onClick={() => setActiveTool(t.type)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${
                                            activeTool === t.type 
                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm' 
                                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="h-8 flex items-center justify-center mb-1 pointer-events-none">
                                            {/* Mini SVG icons for toolbox */}
                                            <svg width="24" height="24" viewBox="0 0 40 40" className={`${activeTool === t.type ? 'stroke-blue-600 dark:stroke-blue-400' : 'stroke-slate-600 dark:stroke-slate-400'}`}>
                                                {renderSymbol({ x:0, y:0, type: t.type, powered: false }).props.children[0]}
                                            </svg>
                                        </div>
                                        <span className="text-[9px] font-bold text-center leading-tight">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2"><Info className="w-4 h-4" /> Editing Tips</h4>
                        <ul className="text-[10px] text-blue-700/80 dark:text-blue-400/80 space-y-2 list-disc pl-4">
                            <li>Click and drag to draw wires continuously.</li>
                            <li>Select the Eraser tool and click a Breaker to instantly toggle its Open/Closed state.</li>
                            <li>Power flows organically from Grid Sources down to Loads based on Breaker continuity.</li>
                        </ul>
                    </div>
                </div>

                {/* SLD CANVAS */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-auto relative custom-scrollbar flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCBMIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCBMIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')]">
                    <svg 
                        ref={svgRef}
                        width={GRID_W * CELL_SIZE} 
                        height={GRID_H * CELL_SIZE} 
                        className="bg-transparent touch-none shadow-sm outline-none cursor-crosshair"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerLeave}
                    >
                        {/* Define SVG Filters/Markers if needed */}
                        <defs>
                            <pattern id="bg-grid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
                                <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.5" />
                                <circle cx={CELL_SIZE/2} cy={CELL_SIZE/2} r="1" fill="currentColor" className="text-slate-300 dark:text-slate-700 opacity-50" />
                            </pattern>
                            <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        
                        <rect width="100%" height="100%" fill="url(#bg-grid)" className="pointer-events-none" />

                        {grid.map(cell => renderSymbol(cell))}
                        
                        {hoverCell && !isDragging && activeTool !== 'EMPTY' && (
                            <g className="pointer-events-none" style={{ opacity: 0.5 }}>
                                {renderSymbol({ x: hoverCell.x, y: hoverCell.y, type: activeTool, powered: false })}
                            </g>
                        )}
                        
                    </svg>
                </div>

            </div>
        </div>
    );
}
