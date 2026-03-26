import React from 'react';

interface JargonTooltipProps {
    text: string;
    explanation: string;
    className?: string;
}

/**
 * Educational tooltip for defining engineering terms.
 * Encourages curiosity without cluttering the main UI.
 */
export const JargonTooltip: React.FC<JargonTooltipProps> = ({ text, explanation, className = '' }) => {
    return (
        <span className={`relative group/tooltip inline-block cursor-help border-b-2 border-dotted border-blue-400 dark:border-blue-600 ${className}`}>
            {text}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none shadow-2xl z-50 scale-95 group-hover/tooltip:scale-100 transition-all duration-200">
                <span className="font-bold text-blue-400 block mb-1">{text}</span>
                {explanation}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-slate-700 rotate-45"></span>
            </span>
        </span>
    );
};
