import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

interface Phasor {
  id: string;
  magnitude: number; // 0 to 1 normalized
  angle: number; // degrees
  color: string;
  label: string;
}

interface PhasorCanvasProps {
  phasors: Phasor[];
  size?: number;
  isDark?: boolean;
  showGrid?: boolean;
}

export const PhasorCanvas: React.FC<PhasorCanvasProps> = ({ 
  phasors, 
  size = 300, 
  isDark = true,
  showGrid = true 
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.8;

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      {/* Background Grid */}
      <svg width={size} height={size} className="absolute inset-0 pointer-events-none">
         <defs>
           <filter id="glow">
             <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
             <feMerge>
               <feMergeNode in="coloredBlur"/>
               <feMergeNode in="SourceGraphic"/>
             </feMerge>
           </filter>
         </defs>
         
         {showGrid && (
           <g className="opacity-20">
             <circle cx={center} cy={center} r={radius} fill="none" stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth="1" />
             <circle cx={center} cy={center} r={radius/2} fill="none" stroke={isDark ? '#475569' : '#cbd5e1'} strokeDasharray="4 4" />
             <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke={isDark ? '#475569' : '#cbd5e1'} />
             <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke={isDark ? '#475569' : '#cbd5e1'} />
           </g>
         )}

         {/* Vectors with Framer Motion Animation */}
         {phasors.map((p) => {
           const angleRad = (p.angle * Math.PI) / 180;
           // In SVG, y is down, so we use -sin for the standard counter-clockwise math
           const targetX = center + Math.cos(angleRad) * (p.magnitude * radius);
           const targetY = center - Math.sin(angleRad) * (p.magnitude * radius);

           return (
             <g key={p.id}>
               <motion.line
                 initial={false}
                 animate={{ x2: targetX, y2: targetY }}
                 transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                 x1={center} y1={center}
                 stroke={p.color}
                 strokeWidth="3"
                 strokeLinecap="round"
                 style={{ filter: 'url(#glow)' }}
               />
               <motion.circle
                 initial={false}
                 animate={{ cx: targetX, cy: targetY }}
                 transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                 r="4"
                 fill={p.color}
               />
               <motion.text
                 initial={false}
                 animate={{ x: targetX + 10, y: targetY - 10 }}
                 transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                 className="text-[10px] font-black uppercase tracking-widest"
                 fill={p.color}
               >
                 {p.label}
               </motion.text>
             </g>
           );
         })}
      </svg>
      
      {/* HUD Info */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {phasors.map(p => (
           <div key={p.id} className="text-[8px] font-black uppercase text-slate-500 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
             {p.label}: {Math.round(p.magnitude * 100)}% @ {Math.round(p.angle)}°
           </div>
        ))}
      </div>
    </div>
  );
};
