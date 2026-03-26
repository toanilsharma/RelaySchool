import React from 'react';
import { motion } from 'framer-motion';

interface SliderProps {
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    color: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'orange' | 'yellow';
    disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({ 
    label, unit, min, max, step, value, onChange, color, disabled 
}) => {
    const colorMap = { 
        emerald: 'from-emerald-400 to-teal-500', 
        blue: 'from-blue-400 to-indigo-500', 
        amber: 'from-amber-400 to-orange-500',
        red: 'from-red-400 to-rose-500',
        purple: 'from-purple-400 to-violet-500',
        orange: 'from-orange-400 to-amber-500',
        yellow: 'from-yellow-400 to-amber-500'
    };
    const progress = ((value - min) / (max - min)) * 100;

    return (
        <div className="flex flex-col gap-4 group">
            <div className="flex justify-between items-center">
                <label className="engineering-label opacity-80 group-hover:opacity-100 transition-opacity select-none">{label}</label>
                <motion.span 
                    key={value}
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-[10px] font-mono font-black bg-gradient-to-r ${colorMap[color]} text-white px-2.5 py-1.5 rounded-md shadow-lg min-w-[3.5rem] text-center`}
                >
                    {value}<span className="opacity-70 ml-0.5">{unit}</span>
                </motion.span>
            </div>
            
            {/* Fat-finger friendly container */}
            <div className="relative h-6 flex items-center group/track">
                {/* Visual Track */}
                <div className="h-2.5 w-full rounded-full bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden backdrop-blur-sm shadow-inner relative border border-slate-300/20 dark:border-white/5">
                    <div 
                        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colorMap[color]} transition-all duration-200 ease-out`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                {/* Invisible enlarged hit area for touch */}
                <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    step={step} 
                    value={value} 
                    onChange={onChange} 
                    disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20" 
                    aria-label={label}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    aria-valuetext={`${value} ${unit}`}
                />

                {/* Visible Thumb (Animated on hover/active) */}
                <motion.div 
                    className={`absolute w-5 h-5 rounded-full bg-white shadow-xl border-2 border-slate-100 dark:bg-slate-50 pointer-events-none z-10`}
                    style={{ left: `calc(${progress}% - 10px)` }}
                    animate={{ 
                        scale: 1,
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                    }}
                    whileHover={{ scale: 1.2 }}
                >
                    <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${colorMap[color]} opacity-80`} />
                </motion.div>
            </div>
        </div>
    );
};
