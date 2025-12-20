import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, FastForward, RotateCcw, ClipboardCheck, AlertCircle, CheckCircle2, XCircle, Download, Activity, Zap, Timer, HelpCircle, BookOpen, X, CheckCircle, AlertTriangle, Settings, Sliders, PenTool, Database, TrendingUp, Music } from 'lucide-react';
import { CurveType } from '../types';
import { calculateTripTime } from '../services/mathEngine';

const RelayTester = () => {
    const [mode, setMode] = useState<'PULSE' | 'RAMP'>('PULSE');
    
    // Pulse Mode State
    const [injectCurrent, setInjectCurrent] = useState(10);
    const [timer, setTimer] = useState(0);
    const [tripTime, setTripTime] = useState<number | null>(null);
    
    // Ramp Mode State
    const [rampStart, setRampStart] = useState(0);
    const [rampRate, setRampRate] = useState(1.0); // Amps per second
    const [currentAmps, setCurrentAmps] = useState(0);
    const [pickupResult, setPickupResult] = useState<number | null>(null);

    // Harmonic State
    const [harmonicLevel, setHarmonicLevel] = useState(0); // % of 2nd Harmonic

    const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'TRIPPED' | 'REST'>('IDLE');
    const intervalRef = useRef<number | undefined>(undefined);

    // Relay Settings Mock (Virtual Relay)
    const [relaySetting, setRelaySetting] = useState({
        pickup: 5, // A
        tms: 0.1,
        curve: CurveType.IEC_STANDARD_INVERSE
    });

    // --- PULSE TEST LOGIC ---
    const startPulseTest = () => {
        setStatus('RUNNING');
        setTimer(0);
        setTripTime(null);
        setCurrentAmps(injectCurrent); // Instant injection
        
        const startTime = Date.now();
        const expected = calculateTripTime(injectCurrent, relaySetting.pickup, relaySetting.tms, relaySetting.curve);

        intervalRef.current = window.setInterval(() => {
            const now = Date.now();
            const elapsed = (now - startTime) / 1000;
            setTimer(elapsed);

            // Logic: 2nd Harmonic Blocking (Transformer Inrush)
            // If Harmonic > 15%, relay enters REST (Restrained) mode and will not trip
            if (harmonicLevel > 15) {
                setStatus('REST');
                // It keeps running but won't trip
            } else {
                // Check Trip
                if (expected && elapsed >= expected && status !== 'REST') {
                    finishTest('TRIPPED');
                    setTripTime(elapsed);
                }
            }
            
            // Timeout safety
            if (elapsed > 100) finishTest('IDLE');
        }, 10); // 10ms resolution
    };

    // --- RAMP TEST LOGIC ---
    const startRampTest = () => {
        setStatus('RUNNING');
        setPickupResult(null);
        setCurrentAmps(rampStart);
        
        // We use a faster tick for smooth ramping UI, but logic check is physics based
        const tickRate = 50; // ms
        const stepPerTick = rampRate * (tickRate / 1000);

        intervalRef.current = window.setInterval(() => {
            setCurrentAmps(prev => {
                const nextCurrent = prev + stepPerTick;
                
                // Check if this current causes a trip (i.e., is above pickup)
                if (nextCurrent > relaySetting.pickup) {
                    if (harmonicLevel > 15) {
                        setStatus('REST'); // Pickup reached but blocked by harmonics
                    } else {
                        finishTest('TRIPPED');
                        setPickupResult(nextCurrent);
                    }
                    return nextCurrent;
                }
                
                if (nextCurrent > 100) { // Safety limit
                    finishTest('IDLE');
                    return prev;
                }
                return nextCurrent;
            });
        }, tickRate);
    };

    const finishTest = (finalStatus: 'TRIPPED' | 'IDLE') => {
        clearInterval(intervalRef.current);
        setStatus(finalStatus);
    };

    const stopTest = () => {
        clearInterval(intervalRef.current);
        setStatus('IDLE');
        if (mode === 'PULSE') setCurrentAmps(0);
        // Keep ramp current displayed so user sees where it stopped
    };

    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <ClipboardCheck className="w-8 h-8 text-indigo-600" /> Relay Tester
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Virtual Secondary Injection Set.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => { setMode('PULSE'); stopTest(); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'PULSE' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Timer className="w-4 h-4"/> Pulse (Timing)
                    </button>
                    <button 
                        onClick={() => { setMode('RAMP'); stopTest(); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'RAMP' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <TrendingUp className="w-4 h-4"/> Ramp (Pickup)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* --- LEFT: CONTROLS --- */}
                <div className="space-y-6">
                    {/* Test Config */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4"/> Test Configuration
                        </h3>
                        
                        {mode === 'PULSE' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Injection Current</label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <input 
                                            type="range" min="1" max="50" step="0.5"
                                            value={injectCurrent} 
                                            onChange={(e) => setInjectCurrent(Number(e.target.value))}
                                            className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <span className="font-mono text-xl font-bold w-20 text-right">{injectCurrent} A</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Start Amps</label>
                                        <input 
                                            type="number" 
                                            value={rampStart} 
                                            onChange={(e) => setRampStart(Number(e.target.value))}
                                            className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Ramp Rate (A/s)</label>
                                        <input 
                                            type="number" step="0.1"
                                            value={rampRate} 
                                            onChange={(e) => setRampRate(Number(e.target.value))}
                                            className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                                <span>2nd Harmonic Injection (100Hz)</span>
                                <span className={harmonicLevel > 15 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}>{harmonicLevel}% {harmonicLevel > 15 ? '(BLOCK)' : ''}</span>
                            </label>
                            <input 
                                type="range" min="0" max="40" step="1"
                                value={harmonicLevel} 
                                onChange={(e) => setHarmonicLevel(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <p className="text-[10px] text-slate-400 mt-2">Simulates Transformer Inrush. Levels &gt;15% typically restrain the differential element.</p>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button 
                                onClick={mode === 'PULSE' ? startPulseTest : startRampTest} 
                                disabled={status === 'RUNNING' || status === 'REST'} 
                                className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all"
                            >
                                <Play className="w-5 h-5"/> {mode === 'PULSE' ? 'Inject Pulse' : 'Start Ramp'}
                            </button>
                            <button 
                                onClick={stopTest} 
                                className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
                            >
                                <Square className="w-5 h-5"/> Stop
                            </button>
                        </div>
                    </div>

                    {/* Virtual Relay Settings */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase">Target Relay Settings</h3>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">Read-Only Simulation</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                <div className="text-[10px] text-slate-400 uppercase">Pickup</div>
                                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{relaySetting.pickup} A</div>
                            </div>
                            <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                <div className="text-[10px] text-slate-400 uppercase">TMS</div>
                                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{relaySetting.tms}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                <div className="text-[10px] text-slate-400 uppercase">Curve</div>
                                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">IEC-SI</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: DISPLAY --- */}
                <div className="flex flex-col gap-6">
                    {/* Main Seven-Segment Style Display */}
                    <div className="flex-1 bg-black rounded-3xl p-8 border-4 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]"></div>
                        
                        {/* Status Light */}
                        <div className={`absolute top-6 right-6 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                            status === 'TRIPPED' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 
                            status === 'RUNNING' ? 'bg-green-500/20 text-green-500 border border-green-500/50' :
                            status === 'REST' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' :
                            'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${
                                status === 'TRIPPED' ? 'bg-red-500 animate-ping' : 
                                status === 'RUNNING' ? 'bg-green-500 animate-pulse' : 
                                status === 'REST' ? 'bg-amber-500' :
                                'bg-slate-500'
                            }`}></div>
                            {status === 'REST' ? 'RESTRAINED' : status}
                        </div>

                        {/* Harmonic Indicator */}
                        {harmonicLevel > 0 && (
                            <div className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono text-amber-500 opacity-80">
                                <Music className="w-3 h-3" />
                                <span>+ {harmonicLevel}% 2nd H</span>
                            </div>
                        )}

                        {/* Primary Value */}
                        <div className="text-center z-10">
                            <div className="text-slate-500 text-sm font-mono uppercase tracking-widest mb-2">
                                {mode === 'PULSE' ? 'Trip Time' : 'Current Injection'}
                            </div>
                            <div className={`text-7xl md:text-8xl font-mono font-bold tracking-tighter ${status === 'REST' ? 'text-amber-500 opacity-50' : 'text-white'}`}>
                                {mode === 'PULSE' 
                                    ? (tripTime ?? timer).toFixed(3) 
                                    : currentAmps.toFixed(2)
                                }
                                <span className="text-2xl text-slate-600 ml-2">
                                    {mode === 'PULSE' ? 's' : 'A'}
                                </span>
                            </div>
                        </div>

                        {/* Secondary Value (Result for Ramp) */}
                        {mode === 'RAMP' && (
                            <div className="mt-8 text-center z-10 h-16">
                                {status === 'TRIPPED' && (
                                    <div className="animate-fade-in">
                                        <div className="text-slate-500 text-xs font-mono uppercase">Pickup Detected</div>
                                        <div className="text-3xl font-mono font-bold text-amber-500">
                                            {pickupResult?.toFixed(2)} A
                                        </div>
                                        <div className="text-[10px] text-green-500 mt-1">
                                            Error: {Math.abs((pickupResult || 0) - relaySetting.pickup).toFixed(2)} A
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Pulse Mode Last Result */}
                        {mode === 'PULSE' && tripTime !== null && (
                            <div className="mt-8 text-center z-10 h-16 animate-fade-in">
                                <div className="text-slate-500 text-xs font-mono uppercase">Status</div>
                                <div className="text-xl font-bold text-green-500 mt-1 flex items-center gap-2 justify-center">
                                    <CheckCircle2 className="w-5 h-5"/> Test Complete
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- RICH CONTENT SECTION --- */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Zap className="w-32 h-32" /></div>
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                        <PenTool className="w-5 h-5" /> Secondary Injection Methods
                    </h3>
                    <p className="text-indigo-100 leading-relaxed mb-4 text-sm">
                        This simulator mimics industry-standard test sets (e.g. Omicron, Doble). 
                        <strong> Pulse Mode</strong> injects a step current to measure timing speed. 
                        <strong> Ramp Mode</strong> slowly increases current to identify the exact pickup threshold, testing the relay's sensitivity and analog measurement accuracy.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" /> Pulse vs Ramp
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Pulse (Timing)</div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Used to verify the curve logic. Inject 2x or 5x pickup and check if trip time matches the IEC formula.</p>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Ramp (Pickup)</div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Used to find the "Must Trip" point. Current is increased slowly (e.g. 0.1A/s) until contact closure.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Database className="w-5 h-5 text-amber-500" /> Acceptance Criteria
                    </h3>
                    <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500"/> Pickup Accuracy: <strong>±5%</strong> of setting.</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500"/> Timing Accuracy: <strong>±5%</strong> or <strong>±30ms</strong>.</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500"/> Reset Ratio: Typically <strong>&gt;90%</strong> (Electromechanical) or <strong>&gt;95%</strong> (Digital).</li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default RelayTester;