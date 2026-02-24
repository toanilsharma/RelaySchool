import React, { useState, useEffect, useMemo } from 'react';
import { Network, Cpu, Play, CircleDot, GitMerge, Settings, Zap } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from "../components/SEO";

// Simple boolean expression evaluator
// Supports AND, OR, NOT, (, )
const evaluateExpression = (expr: string, vars: Record<string, boolean>): boolean => {
    try {
        let parsed = expr
             .replace(/AND/gi, '&&')
             .replace(/OR/gi, '||')
             .replace(/NOT/gi, '!');
        
        // Add variable values
        const varNames = Object.keys(vars).sort((a, b) => b.length - a.length); // replace longer first
        varNames.forEach(v => {
            const regex = new RegExp(`\\b${v}\\b`, 'g');
            parsed = parsed.replace(regex, vars[v] ? 'true' : 'false');
        });

        // eslint-disable-next-line no-new-func
        const fn = new Function('return !!(' + parsed + ')');
        return fn();
    } catch (e) {
        return false;
    }
};

const extractVariables = (expr: string): string[] => {
    try {
        const cleaned = expr.replace(/AND|OR|NOT|\(|\)/gi, ' ');
        const words = cleaned.split(/\s+/).filter(w => w.trim().length > 0 && !/^(true|false|1|0)$/i.test(w));
        return Array.from(new Set(words));
    } catch {
        return [];
    }
};

const PRESETS = [
    { name: 'Overcurrent Trip', logic: '50P OR 51P' },
    { name: 'Breaker Failure', logic: '(50BF AND Timer_Done) AND NOT 86_Lockout' },
    { name: 'Directional Comparison', logic: 'Z2_Trip AND Fwd_Dir AND RX_Received' },
    { name: 'Permissive Overreach', logic: '(Z2_Trip OR Comm_Trip) AND NOT Block_Sig' }
];

export default function LogicSandbox() {
    useThemeObserver();
    
    const [logicString, setLogicString] = useState('50P AND NOT 86_Lockout');
    const [variables, setVariables] = useState<Record<string, boolean>>({});
    const [isValid, setIsValid] = useState(true);

    // Update variables list when logic string changes
    useEffect(() => {
        const vars = extractVariables(logicString);
        setVariables(prev => {
            const next: Record<string, boolean> = {};
            vars.forEach(v => {
                next[v] = prev[v] || false;
            });
            return next;
        });

        // Simple validation check (does it parse?)
        try {
            evaluateExpression(logicString, Object.fromEntries(vars.map(v => [v, false])));
            setIsValid(true);
        } catch {
            setIsValid(false);
        }
    }, [logicString]);

    const result = useMemo(() => {
        if (!isValid) return false;
        return evaluateExpression(logicString, variables);
    }, [logicString, variables, isValid]);

    const toggleVar = (v: string) => {
        setVariables(prev => ({ ...prev, [v]: !prev[v] }));
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
<SEO title="Logic Sandbox" description="Interactive Power System simulation and engineering tool: Logic Sandbox." url="/logicsandbox" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-indigo-600" /> Protection Logic Sandbox
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Design and test boolean protection logic. Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">AND</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">OR</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">NOT</code>, and parentheses.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Inputs & Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-indigo-500" /> Logic Equation
                            </h3>
                            {!isValid && <span className="text-red-500 text-sm font-bold animate-pulse">Syntax Error</span>}
                        </div>
                        
                        <input
                            type="text"
                            value={logicString}
                            onChange={(e) => setLogicString(e.target.value.toUpperCase())}
                            className={`w-full bg-slate-50 dark:bg-slate-950 border-2 rounded-xl p-4 font-mono text-lg transition-colors ${
                                isValid ? 'border-slate-200 dark:border-slate-800 focus:border-indigo-500' : 'border-red-500 focus:border-red-500'
                            } text-slate-900 dark:text-white uppercase`}
                            placeholder="(50P AND NOT 86) OR Z2"
                        />
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                            {PRESETS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => setLogicString(p.logic.toUpperCase())}
                                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors"
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                            <Play className="w-5 h-5 text-emerald-500" /> Live Simulation Toggles
                        </h3>
                        
                        {Object.keys(variables).length === 0 ? (
                            <p className="text-slate-500 italic">No variables detected in equation.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {Object.keys(variables).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => toggleVar(v)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                            variables[v] 
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                                        }`}
                                    >
                                        <CircleDot className={`w-8 h-8 mb-2 ${variables[v] ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                                        <span className="font-bold font-mono text-sm break-all">{v}</span>
                                        <span className="text-xs opacity-70 mt-1">{variables[v] ? 'TRUE (1)' : 'FALSE (0)'}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Output State */}
                <div className="lg:col-span-1 space-y-6">
                    <div className={`rounded-2xl border-4 p-8 flex flex-col items-center justify-center min-h-[300px] transition-all duration-300 ${
                        result && isValid
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}>
                        <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center mb-6 transition-all duration-300 ${
                            result && isValid
                            ? 'border-red-500 bg-red-100 dark:bg-red-500/20 rotate-12 scale-110'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
                        }`}>
                            <Zap className={`w-16 h-16 ${result && isValid ? 'text-red-500 fill-current animate-pulse' : 'text-slate-300 dark:text-slate-700'}`} />
                        </div>
                        
                        <h2 className={`text-4xl font-black tracking-widest ${result && isValid ? 'text-red-500' : 'text-slate-400'}`}>
                            {result && isValid ? 'TRIP' : 'NORMAL'}
                        </h2>
                        
                        <p className={`mt-4 text-sm font-medium ${result && isValid ? 'text-red-400' : 'text-slate-500'}`}>
                            {result && isValid ? 'Output Contact Closed' : 'Output Contact Open'}
                        </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <GitMerge className="w-4 h-4" /> Truth Table Tip
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            A classic trip scheme uses <strong>OR</strong> gates to collect multiple trip signals (e.g. Zone 1 OR Zone 2), 
                            and <strong>AND NOT</strong> gates to act as blocks (e.g. AND NOT Block_Signal).
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
