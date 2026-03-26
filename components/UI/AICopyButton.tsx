import React, { useState } from 'react';
import { Copy, Check, MessageSquare } from 'lucide-react';

interface AICopyButtonProps {
    state: any;
    toolName: string;
}

export const AICopyButton: React.FC<AICopyButtonProps> = ({ state, toolName }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const prompt = `I am using the ${toolName} simulator on RelaySchool. 
Here is my current simulation state:
${JSON.stringify(state, null, 2)}

Can you analyze these settings and explain the technical implications or potential issues?`;

        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy state', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all group"
            title="Copy state for AI analysis"
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                </>
            ) : (
                <>
                    <MessageSquare className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Copy for AI</span>
                </>
            )}
        </button>
    );
};
