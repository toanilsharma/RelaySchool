import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, Clock, Search, Sliders, Zap, Download, RefreshCw, 
  Maximize2, FileSearch, ArrowRight, Info, AlertTriangle, 
  CheckCircle, BarChart, Timer, Ruler, MoveHorizontal, Target, 
  TrendingUp, Play, Pause, ChevronLeft, ChevronRight, ZoomIn, 
  ZoomOut, Compass, HelpCircle, X, BookOpen, Layers, Microscope 
} from 'lucide-react';

// --- TYPES ---

interface DataPoint {
    t: number; // Time in ms
    ia: number; ib: number; ic: number;
    va: number; vb: number; vc: number;
    trip: number;
}

// --- HELP MODAL ---

const ForensicHelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileSearch className="w-6 h-6 text-purple-600" /> Forensic Lab Guide
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8">
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-500" /> How to Analyze a Fault
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">1. Scrub the Timeline</div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Click and drag on the black oscillograph (graph) to move the yellow cursor. This updates the Phasors and FFT in real-time to show the state of the grid at that exact millisecond.
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">2. Identify State Changes</div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Locate the transition from <strong>Pre-Fault</strong> (Balanced Sine waves) to <strong>Fault</strong> (Current spike, Voltage dip) and finally <strong>Post-Fault</strong> (Current zero).
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">3. Watch the Vectors</div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Observe the Phasor Diagram . During a fault, the faulted phase current (e.g., IA) will grow and lag voltage (inductive), while voltage (VA) collapses.
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">4. Check Harmonics</div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Use the FFT Spectrum to check for <strong>DC Offset</strong> (transient asymmetry) or <strong>2nd Harmonic</strong> (inrush). Real relays use these signatures to block or trip.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Microscope className="w-5 h-5 text-purple-500" /> What is COMTRADE?
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                            <strong>IEEE C37.111 / IEC 60255-24</strong> Common Format for Transient Data Exchange. 
                            It is the universal file format used by protection engineers to replay faults . 
                            A record consists of:
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <li className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 text-center">
                                <div className="font-mono font-bold text-blue-700 dark:text-blue-300">.CFG</div>
                                <div className="text-xs text-slate-500 mt-1">Configuration (Scaling, Channel Names)</div>
                            </li>
                            <li className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 text-center">
                                <div className="font-mono font-bold text-blue-700 dark:text-blue-300">.DAT</div>
                                <div className="text-xs text-slate-500 mt-1">Data (Raw Samples)</div>
                            </li>
                            <li className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 text-center">
                                <div className="font-mono font-bold text-blue-700 dark:text-blue-300">.HDR</div>
                                <div className="text-xs text-slate-500 mt-1">Header (Meta info)</div>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
};

// --- MATH & GENERATION ---

const SAMPLE_RATE = 2000; // Hz
const SAMPLES_PER_CYCLE = 40; // 50Hz
const TOTAL_DURATION = 200; // ms
const TOTAL_SAMPLES = (TOTAL_DURATION / 1000) * SAMPLE_RATE;

// Generate synthetic COMTRADE data
const generateFaultRecord = (): DataPoint[] => {
    const data: DataPoint[] = [];
    
    // Scenario: Phase A-G Fault @ 50ms, Cleared @ 120ms
    const faultStart = 50;
    const tripTime = 80;
    const clearTime = 120;

    // Parameters
    const freq = 50;
    const omega = 2 * Math.PI * freq;
    
    // Magnitudes (Secondary)
    const loadI = 5; 
    const faultI = 80; 
    const nomV = 63.5; // 110V LL / sqrt(3)

    // DC Offset decay
    const tau = 0.04; // 40ms time constant

    for (let i = 0; i < TOTAL_SAMPLES; i++) {
        const t = (i / SAMPLE_RATE) * 1000; // ms
        const tSec = t / 1000;

        let ia = 0, ib = 0, ic = 0;
        let va = 0, vb = 0, vc = 0;
        let trip = 0;

        // Base Sine Waves
        const angA = omega * tSec;
        const angB = omega * tSec - (2*Math.PI/3);
        const angC = omega * tSec + (2*Math.PI/3);

        // Pre-Fault
        if (t < faultStart) {
            ia = loadI * Math.sin(angA);
            ib = loadI * Math.sin(angB);
            ic = loadI * Math.sin(angC);
            va = nomV * Math.sin(angA);
            vb = nomV * Math.sin(angB);
            vc = nomV * Math.sin(angC);
        } 
        // Fault State (A-G)
        else if (t >= faultStart && t < clearTime) {
            // DC Offset calculation
            const faultTime = (t - faultStart) / 1000;
            const dcOffset = 40 * Math.exp(-faultTime / tau); // Initial DC offset

            ia = (faultI * Math.sin(angA - Math.PI/3)) + dcOffset; // Lagging PF
            ib = loadI * Math.sin(angB);
            ic = loadI * Math.sin(angC);

            va = (nomV * 0.2) * Math.sin(angA); // Voltage collapse
            vb = nomV * Math.sin(angB);
            vc = nomV * Math.sin(angC);
        }
        // Post-Fault (Breaker Open)
        else {
            ia = 0; // Cleared
            ib = 0; // Cleared (Assuming 3-pole trip)
            ic = 0; // Cleared
            
            va = nomV * Math.sin(angA); // Voltage recovery
            vb = nomV * Math.sin(angB);
            vc = nomV * Math.sin(angC);
        }

        // Digital Channels
        if (t >= tripTime && t < tripTime + 100) trip = 1;

        // Add Noise
        ia += (Math.random() - 0.5) * 0.5;

        data.push({ t, ia, ib, ic, va, vb, vc, trip });
    }
    return data;
};

// --- SUB-COMPONENTS ---

const PhasorDiagramCorrect = ({ magnitudes, angles }: { magnitudes: number[], angles: number[] }) => {
    // 0: Ia, 1: Ib, 2: Ic, 3: Va, 4: Vb, 5: Vc
    const size = 100;
    
    // Scaling
    const maxI = Math.max(magnitudes[0], magnitudes[1], magnitudes[2], 10);
    const maxV = Math.max(magnitudes[3], magnitudes[4], magnitudes[5], 10);
    
    const scaleI = 90 / maxI;
    const scaleV = 90 / maxV;

    const getX = (mag: number, ang: number) => mag * Math.cos(ang * Math.PI / 180);
    const getY = (mag: number, ang: number) => -mag * Math.sin(ang * Math.PI / 180);

    return (
        <svg viewBox="-100 -100 200 200" className="w-full h-full bg-slate-900 rounded-xl border border-slate-800">
            <circle cx="0" cy="0" r="90" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="-100" y1="0" x2="100" y2="0" stroke="#334155" strokeWidth="1" />
            <line x1="0" y1="-100" x2="0" y2="100" stroke="#334155" strokeWidth="1" />

            {/* Currents */}
            <line x1="0" y1="0" x2={getX(magnitudes[0]*scaleI, angles[0])} y2={getY(magnitudes[0]*scaleI, angles[0])} stroke="#ef4444" strokeWidth="3" markerEnd="url(#head-curr)" />
            <line x1="0" y1="0" x2={getX(magnitudes[1]*scaleI, angles[1])} y2={getY(magnitudes[1]*scaleI, angles[1])} stroke="#eab308" strokeWidth="3" />
            <line x1="0" y1="0" x2={getX(magnitudes[2]*scaleI, angles[2])} y2={getY(magnitudes[2]*scaleI, angles[2])} stroke="#3b82f6" strokeWidth="3" />

            {/* Voltages (Dashed) */}
            <line x1="0" y1="0" x2={getX(magnitudes[3]*scaleV, angles[3])} y2={getY(magnitudes[3]*scaleV, angles[3])} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <line x1="0" y1="0" x2={getX(magnitudes[4]*scaleV, angles[4])} y2={getY(magnitudes[4]*scaleV, angles[4])} stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <line x1="0" y1="0" x2={getX(magnitudes[5]*scaleV, angles[5])} y2={getY(magnitudes[5]*scaleV, angles[5])} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

            <defs>
                <marker id="head-curr" orient="auto" markerWidth="6" markerHeight="6" refX="5" refY="3">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                </marker>
            </defs>
        </svg>
    );
};

// --- MAIN COMPONENT ---

const ForensicLab = () => {
    // Data
    const [record] = useState(generateFaultRecord());
    
    // View State
    const [cursor, setCursor] = useState(40); // ms
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showHelp, setShowHelp] = useState(false);
    
    // Analysis State
    const [phasors, setPhasors] = useState<{mag: number[], ang: number[]}>({ mag: [0,0,0,0,0,0], ang: [0,0,0,0,0,0] });
    const [harmonics, setHarmonics] = useState<number[]>([]);

    const graphRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    // --- ANALYSIS ENGINE ---
    
    // Perform DFT on a window around the cursor
    useEffect(() => {
        if (!record.length) return;

        // Find index
        const idx = Math.floor((cursor / TOTAL_DURATION) * TOTAL_SAMPLES);
        // Take 1 cycle window (40 samples)
        const windowSize = SAMPLES_PER_CYCLE;
        const start = Math.max(0, idx - windowSize/2);
        const end = Math.min(record.length, start + windowSize);
        const windowData = record.slice(start, end);

        if (windowData.length < windowSize) return;

        // Simple DFT for Fundamental (50Hz) for all 6 channels
        // Channels: Ia, Ib, Ic, Va, Vb, Vc
        const mags = [];
        const angs = [];

        const keys: (keyof DataPoint)[] = ['ia', 'ib', 'ic', 'va', 'vb', 'vc'];

        keys.forEach(key => {
            let real = 0;
            let imag = 0;
            for (let n = 0; n < windowData.length; n++) {
                const val = windowData[n][key] as number;
                const angle = (2 * Math.PI * n) / windowSize;
                real += val * Math.cos(angle);
                imag += val * Math.sin(angle);
            }
            // RMS magnitude = (2/N) * sqrt(re^2 + im^2) / sqrt(2) = sqrt(2)/N * ...
            // Peak magnitude = (2/N) * sqrt(...)
            const mag = (2 / windowSize) * Math.sqrt(real*real + imag*imag);
            let ang = Math.atan2(imag, real) * (180 / Math.PI);
            
            // Adjust angle to be relative to a reference (e.g., Va) or just raw
            // Since our window shifts, the phase rotates. We need to lock to Va or just show relative.
            // For this sim, let's keep it raw but normalized to Va if we wanted stable display.
            // However, rolling phasors are also cool.
            
            mags.push(mag);
            angs.push(ang);
        });

        setPhasors({ mag: mags, ang: angs });

        // Harmonics for Phase A Current
        // Calculate DC, 2nd, 3rd
        const hMags = [0, 0, 0, 0]; // DC, 1st, 2nd, 3rd, 5th
        [0, 1, 2, 3, 5].forEach((hOrder, i) => {
            let r = 0, i_val = 0;
            for (let n = 0; n < windowData.length; n++) {
                const val = windowData[n].ia;
                const angle = (2 * Math.PI * n * hOrder) / windowSize;
                r += val * Math.cos(angle);
                i_val += val * Math.sin(angle);
            }
            hMags[i] = (2/windowSize) * Math.sqrt(r*r + i_val*i_val);
            if(hOrder === 0) hMags[i] /= 2; // DC component adjustment
        });
        setHarmonics(hMags);

    }, [cursor, record]);

    // --- PLAYBACK ---
    useEffect(() => {
        if (isPlaying) {
            let lastTime = Date.now();
            const loop = () => {
                const now = Date.now();
                const delta = now - lastTime;
                lastTime = now;
                setCursor(prev => {
                    const next = prev + (delta * 0.1 * playbackSpeed); // Speed scale
                    return next > TOTAL_DURATION ? 0 : next;
                });
                animationRef.current = requestAnimationFrame(loop);
            };
            animationRef.current = requestAnimationFrame(loop);
        } else {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying, playbackSpeed]);

    // --- INTERACTION ---
    const handleGraphClick = (e: React.MouseEvent) => {
        if (!graphRef.current) return;
        const rect = graphRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const t = (x / width) * TOTAL_DURATION;
        setCursor(Math.max(0, Math.min(t, TOTAL_DURATION)));
    };

    const handleDrag = (e: React.MouseEvent) => {
        if (e.buttons === 1) handleGraphClick(e);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto">
            <ForensicHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <FileSearch className="w-8 h-8 text-purple-600" /> Forensic Lab
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Advanced COMTRADE Analysis & Oscillography.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors">
                        <HelpCircle className="w-4 h-4" /> Guide
                    </button>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-lg transition-colors ${isPlaying ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                            {isPlaying ? <Pause className="w-5 h-5"/> : <Play className="w-5 h-5"/>}
                        </button>
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-200 w-16 text-center">{cursor.toFixed(1)}ms</div>
                        <button onClick={() => setCursor(Math.min(TOTAL_DURATION, cursor + 1))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronRight className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- MAIN OSCILLOGRAPH --- */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div 
                        ref={graphRef}
                        className="bg-black rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative select-none cursor-crosshair h-[500px]"
                        onMouseDown={handleGraphClick}
                        onMouseMove={handleDrag}
                    >
                        {/* Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
                        
                        {/* Cursor Line */}
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-30 shadow-[0_0_10px_#facc15]"
                            style={{ left: `${(cursor / TOTAL_DURATION) * 100}%` }}
                        >
                            <div className="absolute top-0 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded-b">
                                {cursor.toFixed(1)}ms
                            </div>
                        </div>

                        {/* Graphs Container */}
                        <div className="flex flex-col h-full absolute inset-0">
                            
                            {/* Analog Channels */}
                            <div className="flex-1 border-b border-slate-800 relative">
                                <span className="absolute top-2 left-2 text-[10px] text-slate-500 font-bold uppercase bg-black/50 px-1 rounded">Analog Inputs (I, V)</span>
                                <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 -120 ${TOTAL_SAMPLES} 240`}>
                                    {/* Currents */}
                                    <path d={`M ${record.map((d, i) => `${i} ${-d.ia}`).join(' L ')}`} fill="none" stroke="#ef4444" strokeWidth="1.5" />
                                    <path d={`M ${record.map((d, i) => `${i} ${-d.ib}`).join(' L ')}`} fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.5" />
                                    <path d={`M ${record.map((d, i) => `${i} ${-d.ic}`).join(' L ')}`} fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
                                    
                                    {/* Voltages (Scaled down) */}
                                    <path d={`M ${record.map((d, i) => `${i} ${-d.va * 0.5}`).join(' L ')}`} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
                                </svg>
                            </div>

                            {/* Digital Channels */}
                            <div className="h-24 bg-slate-900/50 relative border-t border-slate-800">
                                <span className="absolute top-2 left-2 text-[10px] text-slate-500 font-bold uppercase bg-black/50 px-1 rounded">Digital (Trip)</span>
                                <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${TOTAL_SAMPLES} 10`}>
                                    <path d={`M ${record.map((d, i) => `${i} ${10 - d.trip * 8}`).join(' L ')}`} fill="none" stroke="#22c55e" strokeWidth="2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2"><div className="w-3 h-1 bg-red-500"></div> IA (Phase A)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-1 bg-yellow-500"></div> IB (Phase B)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-500"></div> IC (Phase C)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-1 border-t border-red-500 border-dashed"></div> VA</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-1 bg-green-500"></div> Trip Signal</div>
                    </div>
                </div>

                {/* --- SIDEBAR ANALYSIS --- */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Phasor Widget */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Compass className="w-4 h-4 text-blue-500" /> Vector Analysis
                        </h3>
                        <div className="aspect-square w-full max-w-[280px] mx-auto mb-4">
                            <PhasorDiagramCorrect magnitudes={phasors.mag} angles={phasors.ang} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
                            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                                <div className="text-red-500 font-bold">IA</div>
                                <div>{phasors.mag[0].toFixed(1)}A</div>
                                <div className="text-slate-400">{phasors.ang[0].toFixed(0)}°</div>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                                <div className="text-yellow-500 font-bold">IB</div>
                                <div>{phasors.mag[1].toFixed(1)}A</div>
                                <div className="text-slate-400">{phasors.ang[1].toFixed(0)}°</div>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                                <div className="text-blue-500 font-bold">IC</div>
                                <div>{phasors.mag[2].toFixed(1)}A</div>
                                <div className="text-slate-400">{phasors.ang[2].toFixed(0)}°</div>
                            </div>
                        </div>
                    </div>

                    {/* Harmonics Widget */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <BarChart className="w-4 h-4 text-purple-500" /> FFT Spectrum (Phase A)
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-12 font-bold text-slate-500">DC</span>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-500" style={{width: `${Math.min(100, harmonics[0] * 2)}%`}}></div>
                                </div>
                                <span className="w-8 text-right font-mono">{harmonics[0]?.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-12 font-bold text-blue-500">50Hz</span>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{width: `${Math.min(100, harmonics[1])}%`}}></div>
                                </div>
                                <span className="w-8 text-right font-mono">{harmonics[1]?.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-12 font-bold text-amber-500">2nd</span>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{width: `${Math.min(100, harmonics[2] * 5)}%`}}></div>
                                </div>
                                <span className="w-8 text-right font-mono">{harmonics[2]?.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-12 font-bold text-purple-500">3rd</span>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{width: `${Math.min(100, harmonics[3] * 5)}%`}}></div>
                                </div>
                                <span className="w-8 text-right font-mono">{harmonics[3]?.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- RICH EDUCATIONAL SECTION --- */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 mt-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-red-500" /> Anatomy of a Fault
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        A typical fault record tells a story in three acts. Recognizing these phases is the first step in root cause analysis.
                    </p>
                    <ul className="space-y-3">
                        <li className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 font-bold text-green-700 dark:text-green-400 text-xs">
                                PRE
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pre-Fault State</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Steady state. Currents are balanced (or zero). Voltage is nominal (1.0pu). Vectors rotate at 50/60Hz.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 font-bold text-red-700 dark:text-red-400 text-xs">
                                FLT
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Fault Inception</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Massive current spike. Voltage collapse on faulted phase. DC offset appears (decaying exponential) . Protection logic (Trip) asserts.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 font-bold text-slate-700 dark:text-slate-400 text-xs">
                                CLR
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Fault Clearance</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Breaker opens. Current falls to zero. Voltage may overshoot (Transient Recovery Voltage) before stabilizing.
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-amber-500" /> Key Phenomena
                    </h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <div className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase mb-1">DC Offset</div>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Faults are inductive. Current cannot change instantly. If a fault hits at voltage zero, the current waveform shifts vertically (DC component) to maintain flux continuity. This causes CT Saturation.
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <div className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase mb-1">Harmonic Content</div>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                <strong>2nd Harmonic:</strong> Sign of Magnetizing Inrush (Transformer energization). Relays use this to BLOCK tripping.
                                <br/>
                                <strong>3rd Harmonic:</strong> Zero sequence component. Often filtered out by Delta windings.
                            </p>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/30">
                            <div className="text-xs font-bold text-purple-800 dark:text-purple-200 uppercase mb-1">Sequence Components</div>
                            <p className="text-xs text-purple-700 dark:text-purple-300">
                                <strong>Negative Seq (I2):</strong> Indicates unbalance (L-L or L-G faults).
                                <br/>
                                <strong>Zero Seq (I0):</strong> Indicates ground involvement (L-G).
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ForensicLab;