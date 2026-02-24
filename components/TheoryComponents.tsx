import React from 'react';
import { AlertTriangle, Lightbulb, Bookmark, ExternalLink } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath as ReactInlineMath } from 'react-katex';

// --- COMPONENTS ---

export const StandardRef = ({ code, title, link }: { code: string; title: string, link?: string }) => (
    <div className="flex items-start gap-3 p-3 my-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300 shrink-0">
            <Bookmark className="w-4 h-4" />
        </div>
        <div>
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {code}
                {link && <ExternalLink className="w-3 h-3 text-slate-400" />}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mt-0.5">{title}</div>
        </div>
    </div>
);

export const ProTip = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-4 p-5 my-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-l-4 border-amber-500 rounded-r-xl">
        <Lightbulb className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            <strong className="block text-amber-700 dark:text-amber-500 mb-1 font-bold uppercase tracking-wider text-xs">Field Note</strong>
            {children}
        </div>
    </div>
);

export const Hazard = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-4 p-5 my-6 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl">
        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            <strong className="block text-red-700 dark:text-red-500 mb-1 font-bold uppercase tracking-wider text-xs">Safety Critical</strong>
            {children}
        </div>
    </div>
);

export const MathBlock = ({ formula, legend }: { formula: string; legend?: string[][] }) => (
    <div className="my-6">
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 rounded-t-xl text-center text-lg overflow-x-auto border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
            <BlockMath math={formula} />
        </div>
        {legend && (
            <div className="bg-white dark:bg-slate-950 p-4 rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {legend.map(([sym, desc], i) => (
                    <div key={i} className="flex justify-between border-b border-slate-200 dark:border-slate-800 last:border-0 pb-1 last:pb-0">
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-300">{sym}</span>
                        <span className="text-slate-500 italic text-right">{desc}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export const InlineMath = ({ math }: { math: string }) => <ReactInlineMath math={math} />;
