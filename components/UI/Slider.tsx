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
        <div className="flex flex-col gap-3 group">
            <div className="flex justify-between items-center">
                <label className="engineering-label opacity-80 group-hover:opacity-100 transition-opacity">{label}</label>
                <motion.span 
                    key={value}
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-[10px] font-mono font-black bg-gradient-to-r ${colorMap[color]} text-white px-2 py-1 rounded shadow-lg`}
                >
                    {value}{unit}
                </motion.span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden backdrop-blur-sm shadow-inner cursor-pointer">
                <div 
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colorMap[color]} transition-all duration-200 ease-out`}
                    style={{ width: `${progress}%` }}
                />
                <input 
                    type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
                    aria-label={label}
                />
            </div>
        </div>
    );
};
