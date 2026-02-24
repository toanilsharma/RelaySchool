import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DataPoint {
  x?: number;
  [key: string]: number | string | undefined;
}

interface CommonChartProps {
    data: DataPoint[];
    xKey?: string;
    yKeys?: { key: string; color: string; name: string }[];
    xAxisLabel?: string;
    yAxisLabel?: string;
    title?: string;
    height?: number;
    referenceLines?: { x?: number; y?: number; label?: string; color?: string }[];
}


export const TheoryLineChart = ({
    data, 
    xKey = "x", 
    yKeys = [], 
    xAxisLabel, 
    yAxisLabel,
    title,
    height = 300,
    referenceLines = []
}: CommonChartProps) => {
    return (
        <div className="w-full my-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {title && <h4 className="text-center font-bold text-slate-800 dark:text-slate-200 mb-4">{title}</h4>}
            <div style={{ width: '100%', height: height }}>
                <ResponsiveContainer>
                    <LineChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                        <XAxis 
                            dataKey={xKey} 
                            type="number" 
                            label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fill: '#64748b' }} 
                            stroke="#64748b"
                            tick={{fill: '#64748b', fontSize: 12}}
                            domain={['auto', 'auto']}
                        />
                        <YAxis 
                            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#64748b' }} 
                            stroke="#64748b"
                            tick={{fill: '#64748b', fontSize: 12}}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        
                        {referenceLines.map((line, index) => (
                             <ReferenceLine key={index} x={line.x} y={line.y} stroke={line.color || "red"} strokeDasharray="3 3" label={{ position: 'top', value: line.label, fill: line.color || "red", fontSize: 12 }} />
                        ))}

                        {yKeys.map((item, index) => (
                            <Line 
                                key={index}
                                type="monotone" 
                                dataKey={item.key} 
                                name={item.name}
                                stroke={item.color} 
                                strokeWidth={2}
                                dot={false} 
                                activeDot={{ r: 6 }} 
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
                 {yKeys.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                    </div>
                 ))}
                 {referenceLines.map((item, index) => (
                    item.label && (
                         <div key={`ref-${index}`} className="flex items-center gap-2">
                            <div className="w-4 h-1 border-b-2 border-dashed" style={{ borderColor: item.color || 'red' }}></div>
                            <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                        </div>
                    )
                 ))}
            </div>
        </div>
    );
};
