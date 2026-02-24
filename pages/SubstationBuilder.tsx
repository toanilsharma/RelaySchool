import React, { useState, useCallback, useMemo } from 'react';
import { Network, Zap, GitCommit, Search, RefreshCw, Hand, Crosshair } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from "../components/SEO";

type ComponentType = 'EMPTY' | 'SOURCE' | 'BUS' | 'BREAKER_CLOSED' | 'BREAKER_OPEN' | 'TRANSFORMER' | 'LOAD';

interface GridCell {
    x: number;
    y: number;
    type: ComponentType;
    powered: boolean;
}

const GRID_W = 12;
const GRID_H = 8;

const TOOLS: { type: ComponentType; name: string; icon: string }[] = [
    { type: 'EMPTY', name: 'Eraser', icon: '🧹' },
    { type: 'SOURCE', name: 'Grid Source', icon: '⚡' },
    { type: 'BUS', name: 'Busbar', icon: '━' },
    { type: 'BREAKER_CLOSED', name: 'Breaker (Closed)', icon: '[-]' },
    { type: 'BREAKER_OPEN', name: 'Breaker (Open)', icon: '[/]' },
    { type: 'TRANSFORMER', name: 'Transformer', icon: '⧜' },
    { type: 'LOAD', name: 'Load Motor', icon: 'Ⓜ' }
];

export default function SubstationBuilder() {
    useThemeObserver();
    
    // Initialize 12x8 Grid
    const [grid, setGrid] = useState<GridCell[]>(() => {
        const initial = [];
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                initial.push({ x, y, type: 'EMPTY', powered: false });
            }
        }
        return initial as GridCell[];
    });

    const [activeTool, setActiveTool] = useState<ComponentType>('BUS');

    // Simple solver using BFS from any SOURCE
    const runPowerFlow = useCallback(() => {
        setGrid(prev => {
            const next = prev.map(c => ({ ...c, powered: false }));
            
            // Find all sources
            const queue = next.filter(c => c.type === 'SOURCE');
            queue.forEach(q => q.powered = true);

            const visited = new Set<string>();
            queue.forEach(q => visited.add(`${q.x},${q.y}`));

            while (queue.length > 0) {
                const curr = queue.shift()!;
                
                // Get neighbors
                const neighbors = [
                    next.find(c => c.x === curr.x + 1 && c.y === curr.y),
                    next.find(c => c.x === curr.x - 1 && c.y === curr.y),
                    next.find(c => c.x === curr.x && c.y === curr.y + 1),
                    next.find(c => c.x === curr.x && c.y === curr.y - 1)
                ].filter(Boolean) as GridCell[];

                for (const n of neighbors) {
                    const id = `${n.x},${n.y}`;
                    if (!visited.has(id)) {
                        // Can power flow through?
                        if (['BUS', 'BREAKER_CLOSED', 'TRANSFORMER', 'LOAD'].includes(n.type)) {
                            n.powered = true;
                            visited.add(id);
                            if (n.type !== 'LOAD') { // Power doesn't flow OUT of a load
                                queue.push(n);
                            }
                        }
                    }
                }
            }

            return next;
        });
    }, []);

    const handleCellClick = (x: number, y: number) => {
        setGrid(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(c => c.x === x && c.y === y);
            if (copy[idx].type === 'BREAKER_CLOSED' && activeTool === 'EMPTY') {
                 // Fast toggle
                 copy[idx] = { ...copy[idx], type: 'BREAKER_OPEN' };
            } else if (copy[idx].type === 'BREAKER_OPEN' && activeTool === 'EMPTY') {
                 // Fast toggle
                 copy[idx] = { ...copy[idx], type: 'BREAKER_CLOSED' };
            } else {
                 copy[idx] = { ...copy[idx], type: activeTool };
            }
            return copy;
        });
        // Wait for state to settle then run power flow
        setTimeout(runPowerFlow, 50);
    };

    const clearGrid = () => {
        setGrid(prev => prev.map(c => ({ ...c, type: 'EMPTY', powered: false })));
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
<SEO title="Substation Builder" description="Interactive Power System simulation and engineering tool: Substation Builder." url="/substationbuilder" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Network className="w-8 h-8 text-blue-600" /> Substation Builder
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Interactive drag-and-drop SLD engine. Construct networks and test real-time power flow. 
                        Click breakers with the Eraser tool to toggle them instantly.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* TOOLBOX */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                            <Hand className="w-4 h-4" /> Toolbox
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {TOOLS.map(t => (
                                <button
                                    key={t.type}
                                    onClick={() => setActiveTool(t.type)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition-all shadow-sm ${
                                        activeTool === t.type 
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20' 
                                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                                    }`}
                                >
                                    <span className="text-2xl mb-1">{t.icon}</span>
                                    <span className="text-[10px] font-bold uppercase text-center border-t border-slate-200 dark:border-slate-700 pt-1 mt-1 w-full">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={clearGrid} className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-xl font-bold transition-colors">
                        <RefreshCw className="w-4 h-4" /> Clear Canvas
                    </button>
                    
                    <button onClick={runPowerFlow} className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400 rounded-xl font-bold transition-colors">
                        <Zap className="w-4 h-4" /> Force Recalculate Flow
                    </button>

                     <div className="text-xs text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="font-bold mb-1">Power Flow Legend:</p>
                        <p className="flex items-center gap-2 mb-1"><span className="w-3 h-3 block bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.6)]"></span> Has Power</p>
                        <p className="flex items-center gap-2"><span className="w-3 h-3 block bg-slate-300 dark:bg-slate-700 rounded-full"></span> De-energized</p>
                    </div>
                </div>

                {/* GRID CANVAS */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-x-auto custom-scrollbar">
                    
                    <div 
                        className="inline-grid gap-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl"
                        style={{ gridTemplateColumns: `repeat(${GRID_W}, minmax(0, 1fr))` }}
                    >
                        {grid.map(cell => (
                            <button
                                key={`${cell.x}-${cell.y}`}
                                onClick={() => handleCellClick(cell.x, cell.y)}
                                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-xl sm:text-2xl transition-all relative ${
                                    cell.type === 'EMPTY' ? 'bg-white dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-slate-900' : 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500 z-10'
                                }`}
                            >
                                {/* Posi-color power glow */}
                                {cell.powered && cell.type !== 'EMPTY' && (
                                    <div className="absolute inset-0 bg-amber-400/20 rounded-lg animate-pulse z-0"></div>
                                )}
                                
                                <span className={`relative z-10 ${cell.powered ? 'text-amber-500 drop-shadow-md' : 'text-slate-400 grayscale'}`}>
                                    {TOOLS.find(t => t.type === cell.type)?.icon === '🧹' ? '' : TOOLS.find(t => t.type === cell.type)?.icon}
                                </span>
                            </button>
                        ))}
                    </div>

                </div>

            </div>
        </div>
    );
}
