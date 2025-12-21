import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Zap, Activity, RotateCcw, Play, Pause, Settings,
  AlertTriangle, ShieldCheck, XCircle, Gauge,
  ArrowDownToLine, Timer, Info, TrendingDown, BookOpen, X, List, Check,
  LayoutDashboard, GraduationCap, Trophy, ChevronRight, Calculator,
  Factory, Wind, Power, AlertOctagon, BrainCircuit, School,
  FileText, Terminal, MousePointer2, Layers, Lightbulb, HelpCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. PHYSICS & ENGINEERING CONSTANTS ---
const NOMINAL_FREQ = 60; // Hz
const SYSTEM_V = 1.0; // Per Unit
const MAX_HISTORY_POINTS = 300;
const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

// Utility: Polyline generator for Oscillography
const useTrendline = (data, width, height, minVal, maxVal) => {
  if (data.length < 2) return "";
  const range = maxVal - minVal || 1;
  return data.map((val, i) => {
    const x = (i / (MAX_HISTORY_POINTS - 1)) * width;
    const y = height - ((val - minVal) / range) * height;
    return `${x},${y}`;
  }).join(' ');
};

// --- 2. DATA BANKS (Advanced Theory & Quiz) ---

const SCENARIOS = [
  {
    id: 'high_inertia',
    name: 'High Inertia (ID Fan)',
    desc: 'Slow frequency decay (High H). Ideal for learning Fast Transfer windows.',
    params: { inertiaH: 3.5, decayConstant: 2.5, loadType: 'fan' }
  },
  {
    id: 'low_inertia',
    name: 'Low Inertia (Reciprocating)',
    desc: 'Rapid frequency decay (Low H). The angle drifts very fast. Advanced difficulty.',
    params: { inertiaH: 0.6, decayConstant: 1.0, loadType: 'compressor' }
  },
  {
    id: 'high_static',
    name: 'High Static Load',
    desc: 'Rapid voltage collapse. Good for practicing Residual Transfer.',
    params: { inertiaH: 1.5, decayConstant: 0.5, loadType: 'mixed' }
  }
];

const THEORY_DATA = [
  {
    id: 'fundamentals',
    title: "Fast Bus Transfer Fundamentals",
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    content: (
      <div className="space-y-6 text-slate-300 text-sm">
        <p>
          <strong>Fast Bus Transfer (FBT)</strong> is the automated process of moving a critical motor bus from a failing source to a healthy alternate source rapidly enough to keep the motors spinning and the process running.
        </p>
        <div className="bg-slate-800 p-4 rounded-xl border-l-4 border-blue-500">
          <h4 className="font-bold text-white mb-2">The Engineering Challenge</h4>
          <p>When you disconnect a running motor from the grid, it doesn't stop instantly. It becomes an <strong>Induction Generator</strong>. However, its frequency and voltage decay over time.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>The grid stays at 60Hz.</li>
            <li>The motor bus slows to 59Hz, 58Hz, etc.</li>
            <li>This frequency difference creates a <strong>Phase Angle</strong> that rotates continuously. Reconnecting when this angle is large can destroy the motor shaft.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'ansi',
    title: "ANSI C50.41 Limit (1.33 pu)",
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    content: (
      <div className="space-y-6 text-slate-300 text-sm">
        <div className="bg-slate-800 p-4 rounded-xl border-l-4 border-emerald-500">
          <h3 className="text-lg font-bold text-white mb-2">The 1.33 pu Safety Rule</h3>
          <p>
            <strong>ANSI C50.41</strong> states that the vector difference ($\Delta V$) between the motor residual voltage and the new source voltage at the instant of closure must not exceed <strong>1.33 per unit (pu)</strong>.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">Why this limit?</h4>
            <p className="opacity-80">
              Torque is proportional to $V^2$. If $\Delta V$ is 2.0 pu (which happens at 180° opposition), the torque shock is <strong>4 times</strong> the normal starting torque. This is enough to twist steel shafts and rip windings.
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">Vector Formula</h4>
            <div className="bg-black/30 p-2 rounded text-xs font-mono text-amber-400">
              {"ΔV = √(Es² + Er² - 2·Es·Er·cos(δ))"}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Es = Source V (1.0)<br />Er = Residual V (Decays)<br />δ = Phase Angle
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'zones',
    title: "Transfer Zones Explained",
    icon: <Layers className="w-5 h-5 text-purple-400" />,
    content: (
      <div className="space-y-6 text-slate-300 text-sm">
        <p>A relay must choose one of three safe "windows" to close the breaker:</p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded bg-emerald-900/50 flex items-center justify-center font-bold text-emerald-400 border border-emerald-500">1</div>
            <div>
              <h4 className="font-bold text-emerald-400">Fast Transfer</h4>
              <p className="text-xs">Closing before the phase angle drifts beyond 20°-30°. Requires high-speed breakers. Best for motors.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded bg-blue-900/50 flex items-center justify-center font-bold text-blue-400 border border-blue-500">2</div>
            <div>
              <h4 className="font-bold text-blue-400">In-Phase Transfer</h4>
              <p className="text-xs">If you miss the fast window, wait for the motor to slip 360° and catch it when it comes back in phase (near 0°). Requires predictive logic.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded bg-amber-900/50 flex items-center justify-center font-bold text-amber-400 border border-amber-500">3</div>
            <div>
              <h4 className="font-bold text-amber-400">Residual Transfer</h4>
              <p className="text-xs">Wait until voltage drops below 0.25 pu. Safe but slow. Motors will stop and process will likely trip.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

const QUIZ_BANK = {
  easy: [
    { q: "What is the primary risk of closing a breaker out-of-phase?", options: ["Voltage regulator failure", "Motor Shaft Shearing / Damage", "Fuse blowing", "Frequency rise"], a: 1, explanation: "Closing out-of-phase creates massive transient torque (up to 20x nominal) which can mechanically shear the motor shaft or coupling." },
    { q: "According to ANSI C50.41, the max vector difference allowed is:", options: ["1.0 pu", "1.33 pu", "1.5 pu", "2.0 pu"], a: 1, explanation: "The standard limit is 1.33 pu V/Hz. Exceeding this risks cumulative mechanical fatigue or catastrophic failure." },
    { q: "Which transfer mode is generally preferred to maintain process continuity?", options: ["Fast Transfer", "Residual Transfer", "Slow Transfer", "Manual Transfer"], a: 0, explanation: "Fast transfer occurs in <100ms, usually keeping motors energized enough to continue the process without tripping." },
    { q: "If the bus frequency is 58Hz and grid is 60Hz, what is the slip frequency?", options: ["2 Hz", "58 Hz", "60 Hz", "118 Hz"], a: 0, explanation: "Slip is the difference: 60 - 58 = 2 Hz." },
    { q: "In the Simulator, what does the Blue Vector represent?", options: ["The Motor Bus", "The Grid (Source)", "The Ground", "The Current"], a: 1, explanation: "The Blue vector is the Grid reference (fixed at 0°). The Yellow/Orange vector is the slipping Motor Bus." },
    { q: "What happens to motor voltage immediately after the breaker opens?", options: ["It drops to zero instantly", "It stays at 1.0 pu forever", "It decays exponentially", "It rises"], a: 2, explanation: "It decays exponentially as the rotor magnetic field collapses." },
    { q: "Residual Transfer usually waits for voltage to drop below:", options: ["0.9 pu", "0.5 pu", "0.25 pu", "0.1 pu"], a: 2, explanation: "0.25 pu is the standard 'safe' threshold where re-closing regardless of angle is considered safe." },
    { q: "What unit is 'Inertia' typically measured in for these studies?", options: ["Seconds (H constant)", "Kilograms", "Newtons", "Joules"], a: 0, explanation: "In power systems, inertia is expressed as the H constant (seconds)." },
    { q: "Fast Transfer typically requires the phase angle to be less than:", options: ["20° - 30°", "60°", "90°", "180°"], a: 0, explanation: "The 'Fast' window is narrow, usually before the angle exceeds 20 or 30 degrees." },
    { q: "Which device physically connects the bus to the source?", options: ["Relay", "Breaker", "Fuse", "Transformer"], a: 1, explanation: "The Circuit Breaker (52 device) performs the switching." }
  ],
  medium: [
    { q: "If a breaker takes 5 cycles to close at 60Hz, what is the time delay?", options: ["50ms", "83ms", "100ms", "120ms"], a: 1, explanation: "1 cycle = 16.67ms. 5 * 16.67 ≈ 83.3ms." },
    { q: "What happens to the V/Hz ratio if you close at 180° opposition (1.0 pu voltage)?", options: ["It doubles (2.0 pu)", "It halves", "It stays same", "It becomes infinite"], a: 0, explanation: "At 180 degrees, the vectors add up: 1 + 1 = 2.0 pu." },
    { q: "Why does High Inertia (H) make Fast Transfer easier?", options: ["It maintains voltage", "It slows down frequency decay", "It speeds up the breaker", "It reduces current"], a: 1, explanation: "High inertia means the load keeps spinning longer, so the frequency (and thus phase angle) drifts much slower." },
    { q: "Which load type typically causes the fastest frequency decay?", options: ["High Inertia Fan", "Reciprocating Compressor", "Centrifugal Pump", "Lightbulb"], a: 1, explanation: "Compressors often have low inertia and high back-pressure, causing them to stop very quickly." },
    { q: "What determines the 'Open Circuit Time Constant'?", options: ["The Breaker", "The Grid", "The Motor's Rotor Physics", "The Cable Length"], a: 2, explanation: "It is an inherent electrical property of the motor (T'do)." },
    { q: "The 'Ghost Vector' in the simulator helps with:", options: ["Past analysis", "Predicting angle at contact touch", "Measuring current", "Nothing"], a: 1, explanation: "It predicts where the angle will be after the breaker mechanical delay (e.g., 83ms) to ensure closure happens in the safe zone." },
    { q: "Torque is proportional to:", options: ["Voltage", "Voltage Squared (V²)", "Current", "Frequency"], a: 1, explanation: "T ∝ V². This is why limiting ΔV is so critical." },
    { q: "If the angle is 90° and voltages are 1.0 pu, what is ΔV?", options: ["1.0", "1.414", "2.0", "0.5"], a: 1, explanation: "sqrt(1^2 + 1^2) = sqrt(2) ≈ 1.414." },
    { q: "Why might a 'Static Load' cause a failed Fast Transfer?", options: ["It generates power", "It causes voltage to collapse too fast", "It increases frequency", "It has too much inertia"], a: 1, explanation: "Static loads (heaters, lights) consume power without storing kinetic energy, draining the bus voltage rapidly." },
    { q: "A 'Sympathetic Trip' refers to:", options: ["A relay tripping incorrectly due to current surge elsewhere", "Tripping both sources at once", "A slow trip", "A manual trip"], a: 0, explanation: "It often happens during faults when relays on healthy feeders trip due to inrush or current redistribution." }
  ],
  hard: [
    { q: "In a 'Predictive' Fast Transfer, the relay calculates the advance angle using:", options: ["Current Angle only", "Slip Freq × Breaker Time", "Voltage Magnitude only", "Load Current"], a: 1, explanation: "Advance Angle = Slip Frequency (Hz) × 360° × Breaker Time (s)." },
    { q: "If Slip is 3Hz and Breaker Time is 100ms, how many degrees will the vector move during closing?", options: ["30°", "108°", "360°", "10°"], a: 1, explanation: "3 Hz * 360 deg/cycle * 0.1s = 108 degrees." },
    { q: "What is the primary advantage of 'In-Phase Transfer' over 'Residual'?", options: ["It is safer", "It maintains process speed (re-accelerates faster)", "It requires less logic", "It uses cheaper breakers"], a: 1, explanation: "It reconnects the motor while it is still spinning at high speed, minimizing the re-acceleration time compared to letting it stop (residual)." },
    { q: "The 'C50.41' curve typically plots:", options: ["Time vs Current", "Safe ΔV vs Time", "Torque vs Speed", "Voltage vs Frequency"], a: 1, explanation: "It defines the permissible vector difference limit over time." },
    { q: "If you close at 60° phase difference (1.0 pu V), is it safe according to C50.41?", options: ["Yes (1.0 pu)", "No", "Maybe", "Depends on current"], a: 0, explanation: "At 60°, ΔV = 1.0 pu. Since 1.0 < 1.33, it is technically safe, though marginal." },
    { q: "During transfer, the 'Reactive Power' flow into the motor:", options: ["Stops", "Reverses", "Increases significantly on reconnection (Inrush)", "Becomes zero"], a: 2, explanation: "Re-energizing the magnetic field draws massive VARs (Inrush), causing a voltage dip." },
    { q: "Which protection element is used to block transfer if the angle drifts too far?", options: ["50 (Inst OC)", "25 (Sync Check)", "27 (Undervoltage)", "81 (Frequency)"], a: 1, explanation: "Relay 25 (Sync Check) measures voltage magnitude, phase angle, and slip frequency to supervise the close." },
    { q: "If the load has high back-pressure (e.g., loaded compressor), the 'H' constant effectively:", options: ["Increases", "Decreases", "Stays same", "Becomes negative"], a: 1, explanation: "The mechanical load acts as a brake, making the system behave as if it has lower inertia (decelerates faster)." },
    { q: "The 'Resultant V/Hz' is the key metric because:", options: ["It determines breaker rating", "It determines magnetic flux and shaft torque", "It determines cable heating", "It determines fuse size"], a: 1, explanation: "Flux Φ ∝ V/Hz. Torque T ∝ Φ²." },
    { q: "To perform a 'Sequential' Fast Transfer, you must:", options: ["Trip Main, confirm Open, then Close Aux", "Close Aux, then Trip Main", "Trip both simultaneously", "Close Aux without Tripping Main"], a: 0, explanation: "Sequential means break-before-make. You must validate the Main is open before closing the Aux to avoid paralleling sources out of phase." }
  ]
};

// --- 3. SUB-COMPONENTS ---

const TheoryModule = () => {
  const [activeId, setActiveId] = useState(THEORY_DATA[0].id);
  const activeContent = THEORY_DATA.find(t => t.id === activeId);

  return (
    <div className="flex flex-col md:flex-row h-full animate-fade-in bg-slate-950">
      <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Engineering Manual</span>
        </div>
        <div className="p-2 space-y-1">
          {THEORY_DATA.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeId === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              {item.icon}
              {item.title}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
              {activeContent.icon}
            </div>
            <h2 className="text-3xl font-black text-white">{activeContent.title}</h2>
          </div>
          <div className="prose prose-invert prose-slate max-w-none">
            {activeContent.content}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuizModule = () => {
  const [level, setLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const startQuiz = (lvl) => {
    // Correctly pull from the specific level array in QUIZ_BANK
    const pool = QUIZ_BANK[lvl] || [];
    // Shuffle and pick 5 unique questions
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);
    setQuestions(shuffled);
    setLevel(lvl);
    setAnswers({});
    setSubmitted(false);
  };

  const reset = () => { setLevel(null); setQuestions([]); setAnswers({}); setSubmitted(false); };
  const score = Object.keys(answers).reduce((acc, key) => answers[key] === questions[key].a ? acc + 1 : acc, 0);
  const passed = score >= 4;

  if (!level) return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in bg-slate-950">
      <div className="text-center max-w-lg mb-12">
        <h2 className="text-3xl font-black text-white mb-4">Competency Assessment</h2>
        <p className="text-slate-400">Validate your expertise in Critical Power Systems and Bus Transfer logic.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[
          { id: 'easy', label: 'Technician', color: 'bg-emerald-600', icon: <School className="w-8 h-8" /> },
          { id: 'medium', label: 'Engineer', color: 'bg-blue-600', icon: <Calculator className="w-8 h-8" /> },
          { id: 'hard', label: 'Specialist', color: 'bg-purple-600', icon: <BrainCircuit className="w-8 h-8" /> },
        ].map(l => (
          <button key={l.id} onClick={() => startQuiz(l.id)} className={`${l.color} hover:brightness-110 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 text-white transition-all`}>
            <div className="p-4 bg-white/20 rounded-full">{l.icon}</div>
            <span className="text-xl font-bold uppercase tracking-widest">{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-in bg-slate-950 min-h-full">
      <div className="flex justify-between items-center mb-8">
        <button onClick={reset} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><RotateCcw className="w-4 h-4" /> Exit Assessment</button>
        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{level} Level</div>
      </div>

      {submitted ? (
        <div className="space-y-8">
          <div className="text-center py-10 bg-slate-900 rounded-3xl border border-slate-800">
            {passed ? <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" /> : <RefreshCw className="w-20 h-20 text-slate-500 mx-auto mb-4" />}
            <h2 className="text-4xl font-black text-white mb-2">{score} / 5</h2>
            <p className={`text-lg mb-6 ${passed ? 'text-emerald-400' : 'text-slate-400'}`}>{passed ? "Certification Level: Competent" : "Review ANSI C50.41 and try again."}</p>
            <button onClick={reset} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500">New Quiz</button>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2">Review Answers</h3>
            {questions.map((q, idx) => {
              const isCorrect = answers[idx] === q.a;
              return (
                <div key={idx} className={`p-6 rounded-xl border ${isCorrect ? 'bg-emerald-900/10 border-emerald-900' : 'bg-red-900/10 border-red-900'}`}>
                  <div className="flex items-start gap-3 mb-2">
                    {isCorrect ? <Check className="w-5 h-5 text-emerald-500 mt-1" /> : <XCircle className="w-5 h-5 text-red-500 mt-1" />}
                    <div>
                      <h4 className="font-bold text-slate-200">{q.q}</h4>
                      <p className={`text-sm mt-1 font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                        Your Answer: {q.options[answers[idx]]}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-emerald-400 font-bold mt-1">
                          Correct Answer: {q.options[q.a]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pl-8 text-sm text-slate-400 bg-black/20 p-3 rounded-lg">
                    <strong className="text-slate-500 uppercase text-[10px] block mb-1">Explanation</strong>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-lg text-white mb-4"><span className="text-blue-500 mr-2">Q{idx + 1}</span>{q.q}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {q.options.map((opt, oid) => (
                  <button key={oid} onClick={() => setAnswers({ ...answers, [idx]: oid })} className={`text-left p-3 rounded-lg border transition-all ${answers[idx] === oid ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < 5} className="w-full py-4 bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg mt-8">Submit Final Answers</button>
        </div>
      )}
    </div>
  );
};

const SimulatorView = ({ isActive }) => {
  // --- SIMULATOR STATE ---
  const [simState, setSimState] = useState('CONNECTED'); // CONNECTED, COASTING, TRANSFER_INITIATED, COMPLETED
  const [source1, setSource1] = useState(true);
  const [source2, setSource2] = useState(false);

  // Physics Variables
  const [time, setTime] = useState(0);
  const [busV, setBusV] = useState(1.0);
  const [busFreq, setBusFreq] = useState(NOMINAL_FREQ);
  const [phaseAngle, setPhaseAngle] = useState(0);
  const [loadPercent, setLoadPercent] = useState(100);
  const [predictedAngle, setPredictedAngle] = useState(0); // Ghost vector position

  // Parameters
  const [params, setParams] = useState(SCENARIOS[0].params);
  const [breakerDelay, setBreakerDelay] = useState(83); // 5-cycle default

  // Results & Logs
  const [transferResult, setTransferResult] = useState(null);
  const [events, setEvents] = useState([{ time: '00:00:00.000', msg: 'System Initialized. Main Breaker 52-1 CLOSED.' }]);

  // Oscillography Data
  const [historyV, setHistoryV] = useState(new Array(MAX_HISTORY_POINTS).fill(1.0));
  const [historyAngle, setHistoryAngle] = useState(new Array(MAX_HISTORY_POINTS).fill(0));

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  // --- PHYSICS LOOP ---
  const updatePhysics = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = (timestamp - (lastTimeRef.current || timestamp)) / 1000;
    lastTimeRef.current = timestamp;

    if (simState === 'COASTING' || simState === 'TRANSFER_INITIATED') {
      setTime(prev => prev + dt);

      const loadFactor = loadPercent / 100;

      // 1. Voltage Decay (Exponential)
      const newV = Math.exp(-time / (params.decayConstant / loadFactor));
      setBusV(newV);

      // 2. Freq Decay (Inertia based)
      // df/dt = -(Power / 2H) * f0
      const freqDecayRate = (1 / (2 * params.inertiaH)) * loadFactor;
      const newFreq = NOMINAL_FREQ * Math.exp(-time * freqDecayRate * 0.2);
      setBusFreq(newFreq);

      // 3. Phase Angle Integration
      const slipFreq = NOMINAL_FREQ - newFreq;
      // Angle moves clockwise (negative) as bus slows
      const angleChange = -(slipFreq * 360 * dt);
      let newAngle = (phaseAngle + angleChange) % 360;
      if (newAngle < -180) newAngle += 360;
      setPhaseAngle(newAngle);

      // 4. Predictive Angle Calculation (Ghost Vector)
      // Where will we be in {breakerDelay} ms?
      const futureSlip = slipFreq; // Assume constant slip for short duration
      const futureChange = -(futureSlip * 360 * (breakerDelay / 1000));
      let predAngle = (newAngle + futureChange) % 360;
      if (predAngle < -180) predAngle += 360;
      setPredictedAngle(predAngle);

      setHistoryV(prev => [...prev.slice(1), newV]);
      setHistoryAngle(prev => [...prev.slice(1), newAngle]);
    } else if (simState === 'CONNECTED' || simState === 'COMPLETED') {
      // Steady state
      setHistoryV(prev => [...prev.slice(1), busV]);
      setHistoryAngle(prev => [...prev.slice(1), phaseAngle]);
      setPredictedAngle(phaseAngle); // No prediction needed
    }

    if (isActive) requestRef.current = requestAnimationFrame(updatePhysics);
  }, [simState, time, phaseAngle, params, loadPercent, busV, isActive, breakerDelay]);

  useEffect(() => {
    if (isActive) requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current);
  }, [updatePhysics, isActive]);

  // --- ACTIONS ---
  const addEvent = (msg) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    setEvents(prev => [{ time: ts, msg }, ...prev].slice(0, 50));
  };

  const tripMain = () => {
    if (!source1) return;
    setSource1(false);
    setSimState('COASTING');
    setTime(0);
    addEvent(`TRIP: Main Breaker 52-1 OPEN. Bus Coasting.`);
  };

  const initiateTransfer = () => {
    if (simState !== 'COASTING') return;
    setSimState('TRANSFER_INITIATED');
    addEvent(`CMD: Relay 25 asserted CLOSE 52-2. Delay: ${breakerDelay}ms`);
    // Simulate mechanical delay
    setTimeout(() => executeClosure(), breakerDelay);
  };

  const executeClosure = () => {
    setSimState('COMPLETED');
    setSource2(true);

    const finalAngle = Math.abs(phaseAngle);
    const finalV = busV;
    const rad = finalAngle * DEG_TO_RAD;
    const deltaV = Math.sqrt(Math.pow(SYSTEM_V, 2) + Math.pow(finalV, 2) - 2 * SYSTEM_V * finalV * Math.cos(rad));

    // Detailed Logic for Feedback
    let resultType = 'success';
    let resultMsg = "";
    let detailMsg = "";

    if (finalAngle <= 25 && deltaV < 1.33) {
      resultMsg = "SUCCESS: Fast Transfer (In-Phase).";
      detailMsg = `Ideal closure at ${finalAngle.toFixed(1)}°. Torque shock was negligible.`;
    } else if (finalV <= 0.25) {
      resultMsg = "SUCCESS: Residual Transfer.";
      detailMsg = `Voltage was safe (${finalV.toFixed(2)}pu). Motors will re-accelerate from zero speed.`;
    } else if (deltaV > 1.33) {
      resultType = 'critical';
      resultMsg = `FAILURE: Shaft Damage Likely!`;
      detailMsg = `You closed at ${finalAngle.toFixed(1)}°, causing ${deltaV.toFixed(2)}pu vector difference. This exceeds the 1.33pu ANSI limit.`;
    } else {
      resultType = 'warning';
      resultMsg = `WARNING: Marginal Transfer.`;
      detailMsg = `High torque shock. Angle ${finalAngle.toFixed(1)}° resulted in ${deltaV.toFixed(2)}pu difference. Try to close sooner.`;
    }

    setTransferResult({ type: resultType, msg: resultMsg, detail: detailMsg });
    addEvent(resultMsg);
    addEvent(`STATUS: Breaker 52-2 CLOSED. Bus Re-energized.`);

    // Snap physics to grid
    setBusV(1.0);
    setBusFreq(NOMINAL_FREQ);
    setPhaseAngle(0);
  };

  const resetSystem = () => {
    setSimState('CONNECTED'); setSource1(true); setSource2(false);
    setTime(0); setBusV(1.0); setBusFreq(NOMINAL_FREQ); setPhaseAngle(0);
    setHistoryV(new Array(MAX_HISTORY_POINTS).fill(1.0));
    setHistoryAngle(new Array(MAX_HISTORY_POINTS).fill(0));
    setEvents([{ time: '00:00:00.000', msg: 'System Reset. Ready.' }]);
    setTransferResult(null);
  };

  // --- DERIVED STATUS FOR RELAY 25 ---
  const deltaV = Math.sqrt(Math.pow(SYSTEM_V, 2) + Math.pow(busV, 2) - 2 * SYSTEM_V * busV * Math.cos(phaseAngle * DEG_TO_RAD));
  const predDeltaV = Math.sqrt(Math.pow(SYSTEM_V, 2) + Math.pow(busV, 2) - 2 * SYSTEM_V * busV * Math.cos(predictedAngle * DEG_TO_RAD));
  const isFastSafe = Math.abs(predictedAngle) <= 25 && predDeltaV < 1.33;
  const isResidualSafe = busV < 0.25;
  const isSyncReady = (simState === 'COASTING') && (isFastSafe || isResidualSafe);

  // Results State
  const [showHelp, setShowHelp] = useState(true); // Open by default for training

  // --- LIVE COACH LOGIC ---
  const getCoachMessage = () => {
    if (simState === 'CONNECTED') return "System Healthy. Ready to test. Click 'TRIP MAIN' to begin coast-down.";
    if (simState === 'COMPLETED') return "Transfer Complete. Review results below or click RESET to try again.";
    if (simState === 'TRANSFER_INITIATED') return "Breaker Closing... Mechanical Delay in progress...";

    // COASTING LOGIC
    if (isFastSafe) return "FAST WINDOW OPEN! Click 'CLOSE AUX' immediately!";
    if (busV > 0.25) {
      // Missed fast, waiting for residual
      if (Math.abs(phaseAngle) > 25 && Math.abs(phaseAngle) < 90) return "Missed Fast Window. Wait for In-Phase (360°) or Residual voltage drop.";
      if (Math.abs(phaseAngle) >= 90) return "DANGER ZONE! Do NOT Close. Torque shock would be catastrophic.";
    }
    if (isResidualSafe) return "RESIDUAL SAFE. Voltage < 0.25pu. Safe to re-close now.";

    return "Monitoring System...";
  };

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto grid grid-cols-12 gap-6 animate-fade-in font-sans h-full overflow-hidden" style={{ display: isActive ? 'grid' : 'none' }}>

      {/* INSTRUCTIONS MODAL */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><MousePointer2 className="w-5 h-5 text-blue-400" /> Training Instructions</h2>
              <button onClick={() => setShowHelp(false)}><X className="w-6 h-6 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-4 text-slate-300 text-sm">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">1</div>
                <p><strong>Initiate Coast Down:</strong> Click <span className="text-red-400">TRIP MAIN</span> to open the utility breaker. The motor bus will lose power, and the vector will start rotating away from the grid.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">2</div>
                <p><strong>Watch the "Ghost Vector":</strong> The dotted vector shows where the angle WILL be in 83ms (breaker closure time). Use this prediction to time your closure.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">3</div>
                <p><strong>Execute Transfer:</strong> Click <span className="text-emerald-400">CLOSE AUX</span> when the "SYNC PERMIT" light is green. Try to catch the <strong>Fast Transfer</strong> window (Angle &lt; 25°).</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">4</div>
                <p><strong>Review Results:</strong> The tool will analyze your timing and calculate the exact torque shock (ΔV) you applied to the motor shaft.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-800 flex justify-end"><button onClick={() => setShowHelp(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Start Simulation</button></div>
          </div>
        </div>
      )}

      {/* LIVE COACH BAR */}
      <div className="col-span-12 bg-slate-800 border-l-4 border-blue-500 p-4 rounded-r-lg flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <Lightbulb className={`w-6 h-6 ${simState === 'COASTING' ? 'text-yellow-400 animate-pulse' : 'text-slate-500'}`} />
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Coach</h4>
            <p className="text-white font-medium text-lg">{getCoachMessage()}</p>
          </div>
        </div>
        <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 text-sm text-blue-400 hover:text-white px-3 py-1 border border-blue-500/30 rounded">
          <HelpCircle className="w-4 h-4" /> Instructions
        </button>
      </div>

      {/* LEFT: SCADA & CONTROLS */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">

        {/* SCADA PANEL */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl relative overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.95),rgba(15,23,42,0.9)),url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-50 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="text-blue-500 w-5 h-5" />
                <h3 className="font-bold text-slate-300 uppercase tracking-widest text-sm">Main Bus SCADA</h3>
              </div>
              <div className="bg-black/40 px-3 py-1 rounded text-slate-400 border border-slate-800 text-xs font-mono">BUS: 4.16 kV</div>
            </div>

            {/* DIAGRAM */}
            <div className="flex flex-col items-center flex-grow justify-center relative">
              {/* Sources */}
              <div className="flex justify-between w-full px-16 mb-2">
                {/* Source 1 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Utility Feed</div>
                  <div className={`w-16 h-16 rounded border-2 flex items-center justify-center transition-all ${source1 ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-slate-600 bg-slate-800'}`}>
                    <Factory className={`w-8 h-8 ${source1 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </div>
                  <div className={`h-12 w-1 transition-colors ${source1 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                  {/* Breaker 52-1 */}
                  <div className={`w-8 h-8 border-2 rounded-sm bg-slate-950 z-20 flex items-center justify-center transition-colors ${source1 ? 'border-red-500 bg-red-500 shadow-[0_0_10px_red]' : 'border-emerald-500 bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}>
                    <div className={`w-4 h-4 rounded-sm ${source1 ? 'bg-white' : 'bg-slate-900 border border-emerald-300'}`}></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">52-1</span>
                </div>

                {/* Source 2 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Aux Gen</div>
                  <div className={`w-16 h-16 rounded border-2 flex items-center justify-center transition-all ${source2 ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border-slate-600 bg-slate-800'}`}>
                    <Power className={`w-8 h-8 ${source2 ? 'text-blue-400' : 'text-slate-600'}`} />
                  </div>
                  <div className={`h-12 w-1 transition-colors ${source2 ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                  {/* Breaker 52-2 */}
                  <div className={`w-10 h-10 border-2 rounded-sm bg-slate-950 z-20 flex items-center justify-center transition-colors ${source2 ? 'border-red-500 bg-red-500 shadow-[0_0_10px_red]' : 'border-emerald-500 bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}>
                    <div className={`w-4 h-4 rounded-sm ${source2 ? 'bg-white' : 'bg-slate-900 border border-emerald-300'}`}></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">52-2</span>
                </div>
              </div>

              {/* Main Bus */}
              <div className="w-full px-20 relative z-10">
                <div className={`h-4 w-full rounded-sm flex items-center justify-center shadow-lg relative overflow-hidden transition-colors ${busV > 0.1 ? 'bg-amber-500 border border-amber-400 shadow-[0_0_15px_orange]' : 'bg-slate-800 border border-slate-700'}`}>
                  {(source1 || source2) && (
                    <div className="absolute inset-0 flex justify-around">
                      {[...Array(10)].map((_, i) => <div key={i} className="w-1 h-full bg-white/30 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />)}
                    </div>
                  )}
                </div>
              </div>

              {/* Load Feed */}
              <div className="flex flex-col items-center relative -mt-1">
                <div className={`h-12 w-1 transition-colors ${busV > 0.1 ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                <div className="w-20 h-20 rounded-full border-4 border-slate-700 bg-slate-800 flex items-center justify-center relative shadow-xl">
                  <Gauge className={`w-10 h-10 transition-colors duration-300 ${busV > 0.8 ? 'text-amber-400' : busV > 0.3 ? 'text-amber-700' : 'text-slate-700'}`} />
                  {busV > 0.05 && (
                    <svg className="absolute inset-0 w-full h-full animate-spin-slow" style={{ animationDuration: `${(1 / busFreq) * 100}s` }}>
                      <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="2" fill="none" className="text-slate-500" strokeDasharray="8 8" />
                    </svg>
                  )}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-2">Plant Load</div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS & LOGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-[300px]">
          {/* Control Desk */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="text-slate-400 w-4 h-4" />
              <h3 className="font-bold text-slate-300 uppercase tracking-widest text-xs">Operator Desk</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button onClick={tripMain} disabled={!source1} className="bg-red-900/20 border border-red-500/30 hover:bg-red-900/40 hover:border-red-500 text-red-100 p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed group">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_red] group-hover:scale-125 transition-transform" />
                <span className="font-bold text-xs tracking-wider">TRIP MAIN</span>
              </button>
              <button onClick={initiateTransfer} disabled={simState !== 'COASTING'} className="bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 hover:border-blue-500 text-blue-100 p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden">
                {simState === 'TRANSFER_INITIATED' && <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />}
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_blue] group-hover:scale-125 transition-transform" />
                <span className="font-bold text-xs tracking-wider">CLOSE AUX</span>
              </button>
              <button onClick={resetSystem} className="bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200 p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all group">
                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-bold text-xs tracking-wider">RESET</span>
              </button>
            </div>

            <div className="mt-2 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                <span>Total System Load</span>
                <span className="font-mono text-blue-400">{loadPercent}%</span>
              </div>
              <input type="range" min="10" max="150" value={loadPercent} onChange={(e) => setLoadPercent(parseInt(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Light Load</span>
                <span>Heavy Load (Fast Decay)</span>
              </div>
            </div>
          </div>

          {/* Event Log */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-hidden flex flex-col h-[300px]">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
              <FileText className="text-slate-500 w-3 h-3" />
              <h3 className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Sequence of Events (SOE)</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] text-slate-400 pr-2 custom-scrollbar">
              {events.map((e, i) => (
                <div key={i} className="flex gap-3 animate-fade-in-up">
                  <span className="text-slate-600 shrink-0">{e.time}</span>
                  <span className={e.msg.includes('TRIP') ? 'text-red-400' : e.msg.includes('SUCCESS') ? 'text-emerald-400' : e.msg.includes('FAILURE') ? 'text-red-500 font-bold' : 'text-slate-300'}>{e.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: RELAY & ANALYSIS */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">

        {/* RELAY 25 FACEPLATE */}
        <div className="bg-[#0f172a] rounded-xl border-4 border-slate-600 shadow-2xl p-1 relative">
          <div className="absolute top-2 left-2 text-[8px] font-black text-slate-500 tracking-widest">RELAY 25 - SYNC CHECK</div>
          <div className="bg-slate-800 rounded p-4 flex flex-col gap-4">
            {/* Digital Display */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#1e293b] border-2 border-slate-600 rounded p-2 font-mono text-right relative shadow-inner">
                <div className="text-[9px] text-slate-500 absolute top-1 left-2">ANGLE</div>
                <div className={`text-xl font-bold ${Math.abs(phaseAngle) > 25 ? 'text-red-500' : 'text-emerald-400'}`}>{Math.abs(phaseAngle).toFixed(1)}°</div>
              </div>
              <div className="bg-[#1e293b] border-2 border-slate-600 rounded p-2 font-mono text-right relative shadow-inner">
                <div className="text-[9px] text-slate-500 absolute top-1 left-2">PRED. ANG</div>
                <div className={`text-xl font-bold ${Math.abs(predictedAngle) > 25 ? 'text-amber-500' : 'text-emerald-400'}`}>{Math.abs(predictedAngle).toFixed(1)}°</div>
              </div>
            </div>

            {/* LEDs */}
            <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border border-black shadow-inner transition-colors ${Math.abs(predictedAngle) <= 25 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-emerald-900'}`} />
                <span className="text-[9px] font-bold text-slate-400">ANGLE OK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border border-black shadow-inner transition-colors ${predDeltaV < 1.33 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-emerald-900'}`} />
                <span className="text-[9px] font-bold text-slate-400">DV OK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border border-black shadow-inner transition-colors ${isResidualSafe ? 'bg-amber-500 shadow-[0_0_8px_orange]' : 'bg-amber-900'}`} />
                <span className="text-[9px] font-bold text-slate-400">RESIDUAL V</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border border-black shadow-inner transition-colors ${simState === 'COMPLETED' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-red-900'}`} />
                <span className="text-[9px] font-bold text-slate-400">TRIP</span>
              </div>
            </div>

            {/* BIG SYNC OK */}
            <div className={`border-2 rounded p-2 text-center transition-all ${isSyncReady ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-700 bg-slate-900'}`}>
              <span className={`text-xs font-black tracking-widest ${isSyncReady ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`}>SYNC PERMIT</span>
            </div>
          </div>
        </div>

        {/* SYNCHROSCOPE */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 flex flex-col items-center flex-grow min-h-[350px] relative">
          <div className="flex justify-between w-full mb-2">
            <h3 className="font-bold text-slate-300 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Vector Scope</h3>
          </div>
          <div className="relative w-64 h-64 my-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Grid */}
              <circle cx="100" cy="100" r="90" fill="#020617" stroke="#334155" strokeWidth="2" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="100" y1="10" x2="100" y2="190" stroke="#1e293b" strokeWidth="1" />
              <line x1="10" y1="100" x2="190" y2="100" stroke="#1e293b" strokeWidth="1" />

              {/* Danger Zone */}
              <path d="M 100 100 L 190 100 A 90 90 0 0 1 10 100 L 100 100" fill="#ef4444" fillOpacity="0.1" />

              {/* Fast Transfer Zone */}
              <path d="M 100 10 L 100 25 A 75 75 0 0 1 125 30" fill="none" stroke="#10b981" strokeWidth="4" opacity="0.4" />
              <path d="M 100 10 L 100 25 A 75 75 0 0 0 75 30" fill="none" stroke="#10b981" strokeWidth="4" opacity="0.4" />
              <text x="130" y="25" fill="#10b981" fontSize="8" fontWeight="bold">FAST ZONE</text>

              {/* Reference Vector (GRID) */}
              <line x1="100" y1="100" x2="100" y2="20" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
              <text x="90" y="15" fill="#3b82f6" fontSize="9" fontWeight="bold">GRID</text>

              {/* Active Vector (BUS) */}
              <g transform={`rotate(${phaseAngle}, 100, 100)`}>
                <line x1="100" y1="100" x2="100" y2={100 - (busV * 80)} stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                <circle cx="100" cy={100 - (busV * 80)} r="4" fill="#f59e0b" stroke="black" strokeWidth="1" />
              </g>

              {/* GHOST VECTOR (PREDICTIVE) */}
              {simState === 'COASTING' && (
                <g transform={`rotate(${predictedAngle}, 100, 100)`}>
                  <line x1="100" y1="100" x2="100" y2={100 - (busV * 80)} stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  <circle cx="100" cy={100 - (busV * 80)} r="3" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
                </g>
              )}
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div className="w-full text-center mt-4 p-2 bg-slate-950 rounded border border-slate-800">
            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase px-4">
              <span>Real-Time Angle</span>
              <span>Pred. Angle (+{breakerDelay}ms)</span>
            </div>
            <div className="flex justify-between items-center text-sm font-mono font-bold text-white px-4">
              <span className="text-amber-400">{phaseAngle.toFixed(1)}°</span>
              <span className="text-emerald-400">{predictedAngle.toFixed(1)}°</span>
            </div>
          </div>
        </div>

        {/* RESULT ANALYSIS CARD */}
        <AnimatePresence>
          {transferResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-4 rounded-xl border-l-4 shadow-xl flex items-start gap-4 ${transferResult.type === 'success' ? 'bg-emerald-900/20 border-emerald-500' : transferResult.type === 'warning' ? 'bg-amber-900/20 border-amber-500' : 'bg-red-900/20 border-red-500'}`}>
              <div className="flex-1">
                <h3 className={`text-md font-black tracking-tight ${transferResult.type === 'success' ? 'text-emerald-400' : transferResult.type === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>{transferResult.msg}</h3>
                <p className="text-slate-300 text-xs mt-1">{transferResult.detail}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LIVE TRENDS */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 shadow-xl">
          <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-emerald-500 uppercase">Voltage Profile</span></div>
          <div className="relative h-20 bg-slate-950 rounded border border-slate-800 overflow-hidden mb-4">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
              <polyline points={useTrendline(historyV, 400, 80, 0, 1.2)} fill="none" stroke="#10b981" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-amber-500 uppercase">Angle Drift</span></div>
          <div className="relative h-20 bg-slate-950 rounded border border-slate-800 overflow-hidden">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#334155" strokeWidth="1" />
              <polyline points={useTrendline(historyAngle, 400, 80, -180, 180)} fill="none" stroke="#f59e0b" strokeWidth="2" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- 4. MAIN LAYOUT COMPONENT ---

const FastBusTransfer = () => {
  const [mode, setMode] = useState('simulator'); // 'theory', 'simulator', 'quiz'

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Top Navigation */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 shrink-0 flex items-center justify-between px-6 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-900/50">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-lg leading-none tracking-tight text-white">TransientSim <span className="text-blue-500">PRO</span></h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bus Transfer Analysis Suite</span>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: 'theory', label: 'Theory', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'simulator', label: 'Simulator', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'quiz', label: 'Assessment', icon: <GraduationCap className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === tab.id ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="w-32 hidden md:block"></div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {mode === 'theory' && <div className="h-full overflow-hidden bg-slate-950"><TheoryModule /></div>}
        <SimulatorView isActive={mode === 'simulator'} />
        {mode === 'quiz' && <div className="h-full overflow-y-auto bg-slate-950"><QuizModule /></div>}
      </div>
    </div>
  );
};

export default FastBusTransfer;