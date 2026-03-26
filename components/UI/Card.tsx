import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    isDark?: boolean;
    noPadding?: boolean;
    hover?: boolean;
    animate?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
    children, 
    className = '', 
    isDark, 
    noPadding = false, 
    hover = false,
    animate = true
}) => {
    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div 
            variants={animate ? itemVariants : undefined}
            initial={animate ? "hidden" : undefined}
            animate={animate ? "show" : undefined}
            whileHover={hover ? { y: -4, transition: { duration: 0.2, ease: 'easeOut' } } : {}}
            className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300 text-adaptive ${noPadding ? '' : 'p-6 lg:p-8'} ${
            isDark 
                ? 'bg-slate-900/60 border-white/5 shadow-2xl shadow-black/40 hover:border-white/10 hover:shadow-engineering-900/20' 
                : 'bg-white/70 border-slate-200/50 shadow-xl shadow-slate-200/50 hover:border-slate-300/50 hover:shadow-engineering-500/10'
            } ${className}`}>
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay" 
                 style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};
