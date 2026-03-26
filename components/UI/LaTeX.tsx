import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath as KaTeXInline, BlockMath as KaTeXBlock } from 'react-katex';

interface LaTeXProps {
    math: string;
    block?: boolean;
    className?: string;
}

/**
 * Standardized LaTeX component for RelaySchool.
 * Uses KaTeX for high-performance engineering notation.
 */
export const LaTeX: React.FC<LaTeXProps> = ({ math, block = false, className = '' }) => {
    return (
        <span className={`math-standard inline-flex items-center justify-center ${className}`}>
            {block ? (
                <KaTeXBlock math={math} />
            ) : (
                <KaTeXInline math={math} />
            )}
        </span>
    );
};
