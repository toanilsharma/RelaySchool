import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Odometer from './Odometer';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
  color?: string; // 'blue', 'emerald', 'red', 'purple', 'amber'
}

export default function Slider({ label, unit = '', color = 'blue', className = '', ...props }: SliderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [thumbPos, setThumbPos] = useState(0);

  const updatePos = () => {
    if (inputRef.current) {
        const min = Number(props.min || 0);
        const max = Number(props.max || 100);
        const val = Number(props.value || 0);
        const range = max - min;
        const fraction = range === 0 ? 0 : (val - min) / range;
        
        // Accurate thumb positioning accounting for standard 16px thumb width
        // CSS range thumb travels exactly from center=8px to center=width-8px.
        const thumbOffsetStr = `calc(${fraction * 100}% + ${8 - fraction * 16}px)`;
        setThumbPos(fraction * 100);
    }
  };

  useEffect(() => { updatePos(); }, [props.value, props.min, props.max]);

  const showTooltip = isHovered || isDragging;

  const colorMap = {
      blue: 'bg-blue-500 border-blue-500',
      emerald: 'bg-emerald-500 border-emerald-500',
      red: 'bg-red-500 border-red-500',
      purple: 'bg-purple-500 border-purple-500',
      amber: 'bg-amber-500 border-amber-500'
  };

  const bgMap = {
      blue: 'bg-blue-500',
      emerald: 'bg-emerald-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500'
  };

  const borderMap = {
      blue: 'border-blue-500',
      emerald: 'border-emerald-500',
      red: 'border-red-500',
      purple: 'border-purple-500',
      amber: 'border-amber-500'
  };

  return (
    <div className={`relative w-full ${className}`}>
        {label && <label className="text-xs font-bold uppercase opacity-60 mb-1 block flex justify-between">
            <span>{label}</span>
            <Odometer value={Number(props.value) || 0} format={v => `${v.toFixed(props.step && Number(props.step) < 1 && String(props.step).includes('.') ? String(props.step).split('.')[1].length : 0)}${unit}`} className="font-mono" />
        </label>}
        <div className="relative w-full flex items-center h-6">
            <input
                ref={inputRef}
                type="range"
                {...props}
                className={`w-full absolute inset-0 z-10 opacity-0 cursor-pointer ${props.disabled ? 'cursor-not-allowed' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
            />
            {/* Custom Track */}
            <div className={`absolute left-0 right-0 h-1.5 rounded-full ${props.disabled ? 'bg-slate-200 dark:bg-slate-800' : 'bg-slate-200 dark:bg-slate-700'}`} />
            
            {/* Custom Fill */}
            <div className={`absolute left-0 h-1.5 rounded-full ${props.disabled ? 'bg-slate-400' : bgMap[color as keyof typeof bgMap] || 'bg-blue-500'}`} style={{ width: `${thumbPos}%` }} />
            
            {/* Custom Thumb */}
            <div 
                className={`absolute w-4 h-4 rounded-full shadow-md transform -translate-x-1/2 pointer-events-none transition-transform 
                ${props.disabled ? 'bg-slate-200 border-2 border-slate-400' : `bg-white border-2 ${borderMap[color as keyof typeof borderMap] || 'border-blue-500'}`}`}
                style={{ 
                    left: `calc(${thumbPos}% + ${8 - (thumbPos/100) * 16}px)`, 
                    scale: isDragging ? 1.2 : 1 
                }}
            />

            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && !props.disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-50 shadow-xl"
                        style={{ left: `calc(${thumbPos}% + ${8 - (thumbPos/100) * 16}px)` }}
                    >
                        {props.value}{unit}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-white" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}
