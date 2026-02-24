import React from 'react';
import {
  LineChart, Line, BarChart as ReBarChart, Bar, AreaChart as ReAreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  Cell, Legend, PieChart, Pie
} from 'recharts';

// --- INTERFACES ---

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

// --- CHART WRAPPER ---
const ChartWrapper = ({ title, children, height = 300 }: { title?: string; children: React.ReactNode; height?: number }) => (
    <div className="w-full my-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {title && <h4 className="text-center font-bold text-slate-800 dark:text-slate-200 mb-4">{title}</h4>}
        <div style={{ width: '100%', height }}>{children}</div>
    </div>
);

const TOOLTIP_STYLE = { backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' };
const AXIS_STYLE = { fill: '#64748b', fontSize: 12 };

// --- 1. LINE CHART ---
export const TheoryLineChart = ({
    data, xKey = "x", yKeys = [], xAxisLabel, yAxisLabel, title, height = 300, referenceLines = []
}: CommonChartProps) => (
    <ChartWrapper title={title} height={height}>
        <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey={xKey} type="number" label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, ...AXIS_STYLE }} stroke="#64748b" tick={AXIS_STYLE} domain={['auto', 'auto']} />
                <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', ...AXIS_STYLE }} stroke="#64748b" tick={AXIS_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#e2e8f0' }} />
                {referenceLines.map((line, i) => (
                    <ReferenceLine key={i} x={line.x} y={line.y} stroke={line.color || "red"} strokeDasharray="3 3" label={{ position: 'top', value: line.label, fill: line.color || "red", fontSize: 12 }} />
                ))}
                {yKeys.map((item, i) => (
                    <Line key={i} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                ))}
            </LineChart>
        </ResponsiveContainer>
    </ChartWrapper>
);

// --- 2. BAR CHART ---
export const TheoryBarChart = ({
    data, xKey = "name", yKeys = [], title, height = 300, xAxisLabel, yAxisLabel
}: CommonChartProps) => (
    <ChartWrapper title={title} height={height}>
        <ResponsiveContainer>
            <ReBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey={xKey} stroke="#64748b" tick={AXIS_STYLE} label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10, ...AXIS_STYLE } : undefined} />
                <YAxis stroke="#64748b" tick={AXIS_STYLE} label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', ...AXIS_STYLE } : undefined} />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#e2e8f0' }} cursor={{ fill: '#334155', opacity: 0.1 }} />
                {yKeys.map((item, i) => (
                    <Bar key={i} dataKey={item.key} name={item.name} fill={item.color} radius={[4, 4, 0, 0]} />
                ))}
            </ReBarChart>
        </ResponsiveContainer>
    </ChartWrapper>
);

// --- 3. AREA CHART ---
export const TheoryAreaChart = ({
    data, xKey = "x", yKeys = [], title, height = 300, xAxisLabel, yAxisLabel, referenceLines = []
}: CommonChartProps) => (
    <ChartWrapper title={title} height={height}>
        <ResponsiveContainer>
            <ReAreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                    {yKeys.map((item, i) => (
                        <linearGradient key={i} id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={item.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={item.color} stopOpacity={0} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey={xKey} type="number" stroke="#64748b" tick={AXIS_STYLE} label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10, ...AXIS_STYLE } : undefined} domain={['auto', 'auto']} />
                <YAxis stroke="#64748b" tick={AXIS_STYLE} label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', ...AXIS_STYLE } : undefined} />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#e2e8f0' }} />
                {referenceLines.map((line, i) => (
                    <ReferenceLine key={i} x={line.x} y={line.y} stroke={line.color || "red"} strokeDasharray="3 3" label={{ position: 'top', value: line.label, fill: line.color || "red", fontSize: 12 }} />
                ))}
                {yKeys.map((item, i) => (
                    <Area key={i} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2} fill={`url(#grad-${item.key})`} />
                ))}
            </ReAreaChart>
        </ResponsiveContainer>
    </ChartWrapper>
);

// --- 4. PIE/DONUT CHART ---
interface PieDataItem { name: string; value: number; color: string; }
export const TheoryPieChart = ({ data, title, height = 280 }: { data: PieDataItem[]; title?: string; height?: number }) => (
    <ChartWrapper title={title} height={height}>
        <ResponsiveContainer>
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="40%" outerRadius="75%" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 11, fill: '#94a3b8' }}>
                    {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
        </ResponsiveContainer>
    </ChartWrapper>
);

// --- 5. SVG-BASED FLOW / BLOCK DIAGRAMS ---

interface FlowBlock { id: string; label: string; color?: string; sub?: string; }
interface FlowArrow { from: string; to: string; label?: string; }

export const TheoryFlowDiagram = ({ blocks, arrows, title, direction = 'horizontal' }: {
    blocks: FlowBlock[]; arrows: FlowArrow[]; title?: string; direction?: 'horizontal' | 'vertical';
}) => {
    const isH = direction === 'horizontal';
    const blockW = 120, blockH = 56, gap = 80;
    const svgW = isH ? blocks.length * (blockW + gap) - gap + 40 : blockW + 80;
    const svgH = isH ? blockH + 60 : blocks.length * (blockH + gap) - gap + 40;

    const getPos = (idx: number) => ({
        x: isH ? 20 + idx * (blockW + gap) : 40,
        y: isH ? 20 : 20 + idx * (blockH + gap),
    });

    return (
        <div className="w-full my-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
            {title && <h4 className="text-center font-bold text-slate-800 dark:text-slate-200 mb-4">{title}</h4>}
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 300 }}>
                <defs>
                    <marker id="arrowHead" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto"><polygon points="0 0, 10 4, 0 8" fill="#64748b" /></marker>
                </defs>
                {/* Arrows */}
                {arrows.map((arrow, i) => {
                    const fi = blocks.findIndex(b => b.id === arrow.from);
                    const ti = blocks.findIndex(b => b.id === arrow.to);
                    if (fi < 0 || ti < 0) return null;
                    const fp = getPos(fi), tp = getPos(ti);
                    const x1 = isH ? fp.x + blockW : fp.x + blockW / 2;
                    const y1 = isH ? fp.y + blockH / 2 : fp.y + blockH;
                    const x2 = isH ? tp.x : tp.x + blockW / 2;
                    const y2 = isH ? tp.y + blockH / 2 : tp.y;
                    return (
                        <g key={i}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arrowHead)" />
                            {arrow.label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight="bold">{arrow.label}</text>}
                        </g>
                    );
                })}
                {/* Blocks */}
                {blocks.map((block, i) => {
                    const pos = getPos(i);
                    const fillColor = block.color || '#3b82f6';
                    return (
                        <g key={block.id}>
                            <rect x={pos.x} y={pos.y} width={blockW} height={blockH} rx={8} fill={fillColor} fillOpacity={0.15} stroke={fillColor} strokeWidth={1.5} />
                            <text x={pos.x + blockW / 2} y={pos.y + (block.sub ? blockH / 2 - 4 : blockH / 2 + 4)} textAnchor="middle" fill={fillColor} fontSize={11} fontWeight="bold">{block.label}</text>
                            {block.sub && <text x={pos.x + blockW / 2} y={pos.y + blockH / 2 + 12} textAnchor="middle" fill="#94a3b8" fontSize={9}>{block.sub}</text>}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// --- 6. COMPARISON TABLE DIAGRAM ---
interface ComparisonItem { label: string; values: (string | number)[]; highlight?: boolean; }

export const TheoryComparisonTable = ({ headers, rows, title }: {
    headers: string[]; rows: ComparisonItem[]; title?: string;
}) => (
    <div className="w-full my-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {title && <h4 className="text-center font-bold text-slate-800 dark:text-slate-200 p-4 pb-0">{title}</h4>}
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                        {headers.map((h, i) => <th key={i} className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((row, i) => (
                        <tr key={i} className={row.highlight ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}>
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{row.label}</td>
                            {row.values.map((v, j) => <td key={j} className="px-4 py-3 text-slate-600 dark:text-slate-400">{v}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- 7. TIMELINE DIAGRAM ---
interface TimelineEvent { time: string; label: string; detail?: string; color?: string; }

export const TheoryTimeline = ({ events, title }: { events: TimelineEvent[]; title?: string }) => (
    <div className="w-full my-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {title && <h4 className="text-center font-bold text-slate-800 dark:text-slate-200 mb-6">{title}</h4>}
        <div className="relative ml-4">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
            {events.map((evt, i) => (
                <div key={i} className="relative pl-8 pb-6 last:pb-0">
                    <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm`} style={{ backgroundColor: evt.color || '#3b82f6' }}></div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{evt.time}</div>
                    <div className="font-bold text-slate-800 dark:text-white text-sm">{evt.label}</div>
                    {evt.detail && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{evt.detail}</div>}
                </div>
            ))}
        </div>
    </div>
);

// --- 8. WAVEFORM DIAGRAM (SVG) ---
export const TheoryWaveform = ({ title, waves, duration = 1, samplesPerCycle = 100 }: {
    title?: string;
    waves: { label: string; color: string; amplitude: number; phase?: number; frequency?: number; dcOffset?: number; saturateAfter?: number; }[];
    duration?: number;
    samplesPerCycle?: number;
}) => {
    const w = 600, h = 200, pad = 40;
    const totalSamples = Math.floor(duration * samplesPerCycle * 50);
    const dt = duration / totalSamples;

    return (
        <ChartWrapper title={title} height={h + 20}>
            <svg viewBox={`0 0 ${w + pad * 2} ${h + pad}`} className="w-full h-full">
                {/* Grid */}
                <line x1={pad} y1={h / 2 + 10} x2={w + pad} y2={h / 2 + 10} stroke="#334155" strokeWidth={0.5} />
                <line x1={pad} y1={10} x2={pad} y2={h + 10} stroke="#334155" strokeWidth={0.5} />
                {/* Waveforms */}
                {waves.map((wave, wi) => {
                    const mid = h / 2 + 10;
                    const scale = (h / 2 - 20) / Math.max(...waves.map(w => w.amplitude + (w.dcOffset || 0)));
                    let path = '';
                    for (let s = 0; s < totalSamples; s++) {
                        const t = s * dt;
                        const freq = wave.frequency || 50;
                        const phase = wave.phase || 0;
                        const dc = wave.dcOffset || 0;
                        let val = wave.amplitude * Math.sin(2 * Math.PI * freq * t + phase * Math.PI / 180) + dc;
                        if (wave.saturateAfter && t > wave.saturateAfter) {
                            val = val * Math.max(0, 1 - (t - wave.saturateAfter) * 3);
                        }
                        const x = pad + (s / totalSamples) * w;
                        const y = mid - val * scale;
                        path += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
                    }
                    return <path key={wi} d={path} fill="none" stroke={wave.color} strokeWidth={1.5} opacity={0.9} />;
                })}
                {/* Legend */}
                {waves.map((wave, wi) => (
                    <g key={`leg-${wi}`}>
                        <line x1={pad + wi * 100} y1={h + pad - 8} x2={pad + wi * 100 + 16} y2={h + pad - 8} stroke={wave.color} strokeWidth={2} />
                        <text x={pad + wi * 100 + 20} y={h + pad - 4} fill="#94a3b8" fontSize={9}>{wave.label}</text>
                    </g>
                ))}
            </svg>
        </ChartWrapper>
    );
};
