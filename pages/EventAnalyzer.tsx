import React, { useState, useEffect, useRef } from 'react';
import { 
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
    Download, Power, AlertTriangle, Database, 
    Activity, Play, RotateCcw, FileText, Server,
    Cpu, ShieldCheck, Zap, BookOpen, AlertOctagon,
    CheckCircle2, HelpCircle, X, Settings, Menu
} from 'lucide-react';

// --- CONSTANTS & STANDARDS ---

const ANSI_CODES = {
    50: { name: 'Instantaneous Overcurrent', desc: 'Operates with no intentional time delay when current exceeds pickup.' },
    51: { name: 'AC Time Overcurrent', desc: 'Operates with an inverse time characteristic (curve) to coordinate with downstream fuses.' },
    '50N': { name: 'Neutral Inst. Overcurrent', desc: 'Fast ground fault protection.' },
    '51N': { name: 'Neutral Time Overcurrent', desc: 'Backup ground fault protection.' },
    52: { name: 'AC Circuit Breaker', desc: 'The physical switching device.' },
    86: { name: 'Lockout Relay', desc: 'Prevents reclosing until manual reset.' }
};

const SAFETY_RULES = [
    "NEVER open a CT secondary circuit while load is flowing. High voltage will occur.",
    "Always verify 'Breaker Open' status before racking out.",
    "Treat all targets as 'Real' until proven otherwise via Event Log."
];

// --- COMPONENTS ---

// 1. The "Quick Start" Overlay
const QuickGuide = ({ onClose }) => (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-blue-100 rounded-full text-blue-500"><X className="w-5 h-5"/></button>
        <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5"/> How to Use This Simulator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-800 dark:text-blue-200">
            <div>
                <strong className="block mb-1 text-blue-900 dark:text-white">1. Inject a Fault</strong>
                <p>Click the red <span className="font-bold text-red-600 bg-red-100 px-1 rounded">INJECT FAULT</span> button. This simulates a short circuit on the feeder.</p>
            </div>
            <div>
                <strong className="block mb-1 text-blue-900 dark:text-white">2. Analyze the Targets</strong>
                <p>Observe which LEDs light up. <strong>"TRIP"</strong> means the breaker opened. <strong>"INSTANT"</strong> implies a high-current fault.</p>
            </div>
            <div>
                <strong className="block mb-1 text-blue-900 dark:text-white">3. Interrogate the Relay</strong>
                <p>Use the <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">Arrow Keys</span> to navigate the LCD menu. Go to <strong>EVENTS</strong> to find the Magnitude (kA).</p>
            </div>
        </div>
    </div>
);

const EventAnalyzer = () => {
    // --- STATE ---
    const [showGuide, setShowGuide] = useState(true);
    
    // HMI State
    const [screenText, setScreenText] = useState([]); 
    const [cursorRow, setCursorRow] = useState(0);
    const [currentMenu, setCurrentMenu] = useState('HOME'); 
    const [menuHistory, setMenuHistory] = useState([]);
    
    // Relay State
    const [isPowered, setIsPowered] = useState(true);
    const [leds, setLeds] = useState({ enabled: true, trip: false, alarm: false, pickup: false });
    const [breakerStatus, setBreakerStatus] = useState('CLOSED'); // CLOSED or TRIPPED
    const [records, setRecords] = useState([]);
    const [selectedRecordId, setSelectedRecordId] = useState(null);

    // --- LOGIC ENGINE ---
    useEffect(() => {
        if (!isPowered) {
             setScreenText(['', '      POWER OFF', '', '']);
             return;
        }

        let lines = [];
        // Menu Tree
        switch (currentMenu) {
            case 'HOME':
                lines = ['> METERING', '  STATUS', '  EVENTS', '  SETTINGS']; break;
            case 'METERING':
                lines = ['> PHASE CURRENTS', '  VOLTAGES', '  POWER (P/Q)', '  SEQUENCE COMP']; break;
            case 'METERING_I':
                // Simulated live values (If tripped, current is 0)
                const i_load = breakerStatus === 'TRIPPED' ? '0.0' : '105';
                lines = [`  IA:   ${i_load}.2 A`, `  IB:   ${i_load}.8 A`, `  IC:   ${i_load}.1 A`, '  IG:     0.5 A']; break;
            case 'EVENTS':
                lines = ['> EVENT HISTORY', '  SOE LOG', '  CLEAR LOGS']; break;
            case 'HISTORY':
                if (records.length === 0) lines = ['  NO RECORDS'];
                else lines = records.map(r => `> EV:${r.id} ${r.type} ${r.date}`); break;
            case 'RECORD_DETAIL':
                const rec = records.find(r => r.id === selectedRecordId);
                if (rec) {
                    lines = [`ID: ${rec.id}  TYPE: ${rec.type}`, `TIME: ${rec.time}`, `MAG: ${rec.mag}`, `TRIP: ${rec.element}`];
                } break;
            default: lines = ['  MENU ERROR'];
        }

        if (currentMenu !== 'RECORD_DETAIL' && currentMenu !== 'METERING_I') {
            // Ensure cursor stays within bounds if list shrinks
            if(cursorRow >= lines.length) setCursorRow(lines.length - 1);
        }
        setScreenText(lines);
        
    }, [currentMenu, cursorRow, isPowered, records, selectedRecordId, breakerStatus]);

    // --- HANDLERS ---
    const handleKey = (key) => {
        if (!isPowered) return;
        if (key === 'UP') setCursorRow(prev => prev > 0 ? prev - 1 : screenText.length - 1);
        if (key === 'DOWN') setCursorRow(prev => prev < screenText.length - 1 ? prev + 1 : 0);
        if (key === 'ESC') {
            if (menuHistory.length > 0) {
                const prev = menuHistory[menuHistory.length - 1];
                setMenuHistory(prev => prev.slice(0, -1));
                setCurrentMenu(prev);
                setCursorRow(0);
            }
        }
        if (key === 'ENT') {
            // "Enter" Logic for drilling down menus
            const line = screenText[cursorRow] || "";
            const selectedItem = line.replace('> ', '').trim();
            
            if (currentMenu === 'HOME') {
                if (selectedItem === 'METERING') { setMenuHistory([...menuHistory, 'HOME']); setCurrentMenu('METERING'); setCursorRow(0); }
                if (selectedItem === 'EVENTS') { setMenuHistory([...menuHistory, 'HOME']); setCurrentMenu('EVENTS'); setCursorRow(0); }
            }
            else if (currentMenu === 'METERING') {
                if (selectedItem === 'PHASE CURRENTS') { setMenuHistory([...menuHistory, 'METERING']); setCurrentMenu('METERING_I'); }
            }
            else if (currentMenu === 'EVENTS') {
                if (selectedItem === 'EVENT HISTORY') { setMenuHistory([...menuHistory, 'EVENTS']); setCurrentMenu('HISTORY'); setCursorRow(0); }
            }
            else if (currentMenu === 'HISTORY' && selectedItem !== 'NO RECORDS') {
                 const idStr = selectedItem.split(' ')[0].split(':')[1];
                 setSelectedRecordId(parseInt(idStr));
                 setMenuHistory([...menuHistory, 'HISTORY']);
                 setCurrentMenu('RECORD_DETAIL');
            }
        }
    };

    const injectFault = () => {
        if (!isPowered) return;
        if (breakerStatus === 'TRIPPED') {
            alert("Breaker is already OPEN. Close breaker before testing.");
            return;
        }

        // 1. Simulation Logic
        const types = [
            { id: 'AG', mag: '4.2kA', ele: '50N' },
            { id: 'BC', mag: '12.5kA', ele: '50P' }, 
            { id: 'ABC', mag: '22.1kA', ele: '50P' }
        ];
        const fault = types[Math.floor(Math.random() * types.length)];

        // 2. Hardware Response
        setLeds(prev => ({ ...prev, trip: true, pickup: true }));
        setBreakerStatus('TRIPPED');

        // 3. Write Memory
        const newRecord = {
            id: records.length + 101,
            date: new Date().toISOString().slice(0,10),
            time: new Date().toISOString().slice(11,19),
            type: fault.id,
            mag: fault.mag,
            element: fault.ele
        };
        setRecords([newRecord, ...records]);
        
        // 4. Force UX Disturbance
        setCurrentMenu('HOME');
        setCursorRow(0);
    };

    const closeBreaker = () => {
        // Logic check: Cannot close if Lockout (86) is active (simulated by non-reset LEDs)
        if (leds.trip) {
            alert("SAFETY INTERLOCK: Cannot close breaker while Trip Target is active. Reset Relay first.");
            return;
        }
        setBreakerStatus('CLOSED');
    };

    const resetTarget = () => {
        setLeds({ ...leds, trip: false, pickup: false });
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-100 pb-20">
            
            {/* --- HEADER --- */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-600/20">
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">RelaySim <span className="text-blue-600">PRO</span></h1>
                            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">IEC 61850 Compliant Trainer</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={injectFault} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md active:translate-y-0.5 transition-all">
                            <Zap className="w-4 h-4" /> INJECT FAULT
                        </button>
                        <button onClick={() => setShowGuide(!showGuide)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-slate-700">
                            <BookOpen className="w-4 h-4" /> GUIDE
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                
                {showGuide && <QuickGuide onClose={() => setShowGuide(false)} />}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* --- LEFT: RELAY FACEPLATE --- */}
                    <div className="lg:col-span-7 flex justify-center">
                        <div className="relative w-full max-w-[550px] aspect-[4/3] bg-[#d4d4d8] dark:bg-[#1f2937] rounded-lg shadow-2xl border-2 border-slate-400 dark:border-slate-600 p-1">
                            {/* Bezel */}
                            <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded border border-slate-400 dark:border-black p-6 grid grid-cols-12 gap-4 relative">
                                
                                {/* Screw Heads (Visual) */}
                                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-500"></div>
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-500"></div>
                                <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-500"></div>
                                <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-400 border border-slate-500"></div>

                                {/* LEDs */}
                                <div className="col-span-3 flex flex-col gap-4 py-6 px-2 border-r border-slate-300 dark:border-slate-700/50">
                                    {/* Fix: Property 'blink' is missing in type but required. */}
                                    <StatusLED label="ENABLED" color="green" active={isPowered && leds.enabled} />
                                    <StatusLED label="TRIP" color="red" active={isPowered && leds.trip} blink={true} />
                                    {/* Fix: Property 'blink' is missing in type but required. */}
                                    <StatusLED label="INSTANT" color="red" active={isPowered && leds.pickup} />
                                    {/* Fix: Property 'blink' is missing in type but required. */}
                                    <StatusLED label="TIME OC" color="red" active={false} />
                                    {/* Fix: Property 'blink' is missing in type but required. */}
                                    <StatusLED label="ALARM" color="amber" active={isPowered && leds.alarm} />
                                </div>

                                {/* Main Interface */}
                                <div className="col-span-9 flex flex-col gap-4">
                                    {/* LCD */}
                                    <div className="bg-[#99a68c] dark:bg-[#0f1a0f] flex-1 rounded border-4 border-slate-400 dark:border-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] p-4 relative overflow-hidden font-mono text-sm">
                                        {isPowered ? (
                                            <div className="text-black dark:text-[#33ff33] drop-shadow-sm leading-6">
                                                {screenText.map((line, i) => (
                                                    <div key={i} className={`whitespace-pre ${i === cursorRow && cursorRow !== -1 ? 'bg-black/10 dark:bg-[#33ff33]/20' : ''}`}>
                                                        {line}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center opacity-20 text-black dark:text-white font-bold">NO DC SUPPLY</div>
                                        )}
                                    </div>

                                    {/* Keypad */}
                                    <div className="grid grid-cols-5 gap-2 h-32">
                                        {/* Nav Pad */}
                                        <div className="col-span-3 grid grid-cols-3 gap-1 p-2 bg-slate-300 dark:bg-slate-800 rounded border border-slate-400 dark:border-slate-700 shadow-inner">
                                            {/* Fix: Type is missing required properties label, color. */}
                                            <div></div><KeyBtn icon={<ChevronUp/>} onClick={() => handleKey('UP')} /><div></div>
                                            {/* Fix: Type is missing required properties label, color. */}
                                            <KeyBtn icon={<ChevronLeft/>} onClick={() => handleKey('ESC')} /><KeyBtn label="ENT" color="red" onClick={() => handleKey('ENT')} /><KeyBtn icon={<ChevronRight/>} onClick={() => handleKey('ENT')} />
                                            {/* Fix: Type is missing required properties label, color. */}
                                            <div></div><KeyBtn icon={<ChevronDown/>} onClick={() => handleKey('DOWN')} /><div></div>
                                        </div>
                                        {/* Function Keys */}
                                        <div className="col-span-2 grid grid-cols-2 gap-2">
                                            {/* Fix: Property 'active' is missing but required. */}
                                            <CmdBtn label="RESET" icon={<RotateCcw className="w-4 h-4"/>} onClick={resetTarget} />
                                            <CmdBtn label="POWER" icon={<Power className="w-4 h-4"/>} onClick={() => setIsPowered(!isPowered)} active={isPowered} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT: ENGINEERING DASHBOARD --- */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* Status Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500" /> Breaker Status (52)
                                </h3>
                                <div className="text-[10px] font-mono text-slate-400">CB-ID: 52-101</div>
                            </div>
                            
                            <div className="flex gap-4 items-center">
                                <div className={`flex-1 p-4 rounded-lg border-2 text-center transition-all ${
                                    breakerStatus === 'CLOSED' 
                                    ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400' // Utility convention: Red = Closed/Energized
                                    : 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                }`}>
                                    <div className="text-2xl font-black">{breakerStatus}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-70 mt-1">{breakerStatus === 'CLOSED' ? 'Energized' : 'Safe / Open'}</div>
                                </div>
                                <button 
                                    onClick={closeBreaker}
                                    disabled={breakerStatus === 'CLOSED'}
                                    className="px-4 py-4 rounded-lg bg-slate-800 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                                >
                                    CLOSE<br/>(52C)
                                </button>
                            </div>
                        </div>

                        {/* Standards Reference */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-500"/> ANSI/IEEE C37.2 Device Codes
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                                {Object.entries(ANSI_CODES).map(([code, info]) => (
                                    <div key={code} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex gap-3 group">
                                        <div className="font-mono font-bold text-blue-600 w-10 shrink-0">{code}</div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">{info.name}</div>
                                            <div className="text-[10px] text-slate-500">{info.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- FOOTER: KNOWLEDGE BASE --- */}
                <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" /> Engineering Knowledge Hub
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Best Practices */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Best Practices
                            </h4>
                            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5"></div><span><strong>Target Reset:</strong> Always log the fault data (Amps, Time, Type) BEFORE resetting the LEDs. If you reset first, the data may be harder to correlate on older relays.</span></li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5"></div><span><strong>Date/Time Sync:</strong> Ensure IRIG-B or NTP is active. A fault record with the wrong time is legally useless in root-cause analysis.</span></li>
                            </ul>
                        </div>

                        {/* 2. Safety */}
                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                                <AlertOctagon className="w-4 h-4" /> Safety Precautions
                            </h4>
                            <ul className="space-y-3 text-sm text-red-800 dark:text-red-300">
                                {SAFETY_RULES.map((rule, i) => (
                                    <li key={i} className="flex gap-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0 opacity-70"/>
                                        <span>{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 3. Standards */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                                <Database className="w-4 h-4" /> Applicable Standards
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-bold text-blue-600">IEEE C37.2</div>
                                    <div className="text-xs text-slate-500">Standard for Electrical Power System Device Function Numbers (50, 51, etc).</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-600">IEC 61850</div>
                                    <div className="text-xs text-slate-500">Communication networks and systems for power utility automation.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-600">NFPA 70E</div>
                                    <div className="text-xs text-slate-500">Standard for Electrical Safety in the Workplace (Arc Flash Boundaries).</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

// --- SUBCOMPONENTS ---

// Added explicit optional types for props to resolve TS errors.
const StatusLED = ({ label, color, active, blink = false }: { label: any, color: any, active: any, blink?: any }) => {
    const colors = {
        red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
        green: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]',
        amber: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        off: 'bg-[#3a3a3a] border border-[#555]'
    };
    return (
        <div className="flex flex-col items-center gap-1.5 mb-2">
            <div className={`w-3 h-3 rounded-full transition-all duration-200 ${active ? colors[color] : colors.off} ${active && blink ? 'animate-pulse' : ''}`}></div>
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 text-center leading-tight">{label}</span>
        </div>
    );
};

// Added explicit optional types for props to resolve TS errors.
const KeyBtn = ({ icon, label, onClick, color }: { icon?: any, label?: any, onClick: any, color?: any }) => (
    <button onClick={onClick} className={`w-full h-full rounded flex items-center justify-center shadow-md active:scale-95 transition-all ${color === 'red' ? 'bg-red-600 text-white border-b-4 border-red-800' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white border-b-4 border-slate-400 dark:border-slate-900'}`}>
        {icon || <span className="font-bold text-xs">{label}</span>}
    </button>
);

// Added explicit optional types for props to resolve TS errors.
const CmdBtn = ({ label, icon, onClick, active = false }: { label: any, icon: any, onClick: any, active?: any }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center h-full rounded shadow-md border-b-4 active:border-b-0 active:translate-y-1 transition-all ${active ? 'bg-green-100 border-green-400 text-green-700' : 'bg-slate-200 border-slate-400 text-slate-600'}`}>
        {icon}
        <span className="text-[9px] font-bold mt-1">{label}</span>
    </button>
);

export default EventAnalyzer;