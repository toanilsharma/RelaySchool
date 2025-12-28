import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, RotateCcw, ShieldCheck, Gauge, BookOpen, X, Check,
  LayoutDashboard, GraduationCap, Trophy, Factory, Power,
  BrainCircuit, School, FileText, Terminal, MousePointer2, Layers,
  Sun, Moon, Info, AlertTriangle, Book, MonitorPlay, Zap,
  Settings, ChevronRight, PlayCircle, Lock, Timer, ArrowRight,
  Globe, AlertOctagon, CheckCircle2, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. ENGINEERING CONSTANTS & PHYSICS ---
const NOMINAL_FREQ = 60; // Hz
const SYSTEM_V = 1.0; // Per Unit
const MAX_HISTORY_POINTS = 400; // Higher resolution
const DEG_TO_RAD = Math.PI / 180;

// Utility: Polyline generator for Oscillography with auto-scaling
const useTrendline = (data, width, height, minVal, maxVal) => {
  if (!data || data.length < 2) return "";
  const range = maxVal - minVal || 1;
  return data.map((val, i) => {
    const x = (i / (MAX_HISTORY_POINTS - 1)) * width;
    // Clamp values to prevent graph overflow
    const clampedVal = Math.max(minVal, Math.min(maxVal, val));
    const y = height - ((clampedVal - minVal) / range) * height;
    return `${x},${y}`;
  }).join(' ');
};

// --- 2. DATA BANKS ---

const SCENARIOS = [
  {
    id: 'high_inertia',
    name: 'ID Fan (High H)',
    type: 'Fan Load',
    desc: 'Slow frequency decay (High Inertia). Common in Coal Power Plants. Easy Fast Transfer window.',
    params: { inertiaH: 4.0, decayConstant: 3.0 }
  },
  {
    id: 'low_inertia',
    name: 'Recip. Compressor',
    type: 'Const Torque',
    desc: 'Rapid frequency decay. Common in Refineries/LNG. Very hard to catch Fast Transfer.',
    params: { inertiaH: 0.8, decayConstant: 1.2 }
  },
  {
    id: 'high_static',
    name: 'Mixed Feeder',
    type: 'Static Load',
    desc: 'Rapid voltage collapse due to static loads (heaters). Requires immediate action.',
    params: { inertiaH: 1.5, decayConstant: 0.6 }
  }
];

const THEORY_DATA = [
  {
    id: 'intro',
    title: "1. Significance & Overview",
    icon: <Zap className="w-5 h-5" />,
    content: (
      <div className="space-y-6 text-sm leading-relaxed">
        <div className="p-5 rounded-xl border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
          <h3 className="text-lg font-bold mb-2 text-blue-900 dark:text-blue-100">Why Fast Transfer (FBT)?</h3>
          <p className="text-slate-800 dark:text-slate-200">
            In continuous process industries (Refineries, Power Plants, Semiconductor Fabs), a power interruption lasting longer than <strong>200ms</strong> (approx. 12 cycles) is catastrophic. It causes magnetic contactors to drop out, VFDs to trip on undervoltage, and synchronous motors to lose stability.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-white dark:bg-black/30 rounded border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500 uppercase">Cost of Downtime</div>
              <div className="font-mono font-bold text-red-500">$100k - $2M per event</div>
            </div>
            <div className="p-3 bg-white dark:bg-black/30 rounded border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-500 uppercase">Restart Time</div>
              <div className="font-mono font-bold text-amber-500">8 - 48 Hours</div>
            </div>
          </div>
        </div>

        <p className="text-slate-700 dark:text-slate-300">
          <strong>The Goal:</strong> To transfer the essential motor bus from a failing source (Main) to a healthy source (Standby/Aux) so quickly that the motors don't "realize" power was lost, maintaining process continuity.
        </p>
      </div>
    )
  },
  {
    id: 'physics',
    title: "2. Theory & Motor Physics",
    icon: <Activity className="w-5 h-5" />,
    content: (
      <div className="space-y-6 text-sm leading-relaxed">
        <h4 className="font-bold text-slate-900 dark:text-white text-lg">What happens when the breaker opens?</h4>
        <p className="text-slate-700 dark:text-slate-300">
          When a motor bus is disconnected, motors don't stop instantly. Due to stored magnetic energy and mechanical inertia, they act as <strong>Induction Generators</strong>. This generates a "Back EMF" or Residual Voltage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h5 className="font-bold text-indigo-600 dark:text-indigo-400">1. Voltage Decay</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              The magnitude of the voltage drops as the rotor's magnetic field collapses. This is determined by the <em>Open Circuit Time Constant</em> (T'do).
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-indigo-600 dark:text-indigo-400">2. Frequency Decay</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              The motors slow down due to the mechanical load. As RPM drops, the generated frequency drops (e.g., 60Hz &rarr; 58Hz).
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h5 className="font-bold text-slate-900 dark:text-white mb-2">The Phase Angle Problem</h5>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Since the Grid stays at 60Hz and the Motor Bus drops to 58Hz, they drift apart. The phase angle (δ) between them increases continuously.
            <br /><br />
            <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">Slip (Hz) = Grid Freq - Motor Freq</code>
            <br />
            <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">Angle Drift = ∫ (Slip × 360°) dt</code>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'modes',
    title: "3. Types of Transfer",
    icon: <Layers className="w-5 h-5" />,
    content: (
      <div className="space-y-6 text-sm">
        <div className="space-y-4">
          {/* FAST */}
          <div className="border-l-4 border-emerald-500 pl-4 py-1">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-base">Type A: Fast Transfer</h4>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700 dark:text-slate-300">
              <li><strong>Logic:</strong> Close immediately if phase angle is small (&lt;20°).</li>
              <li><strong>Timeframe:</strong> &lt; 100ms (5-6 cycles).</li>
              <li><strong>Hardware:</strong> Requires high-speed vacuum circuit breakers and fast relay processing.</li>
              <li><strong>Risk:</strong> Low. Minimal torque shock.</li>
            </ul>
          </div>

          {/* IN-PHASE */}
          <div className="border-l-4 border-blue-500 pl-4 py-1">
            <h4 className="font-bold text-blue-700 dark:text-blue-400 text-base">Type B: In-Phase Transfer</h4>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700 dark:text-slate-300">
              <li><strong>Logic:</strong> If Fast Transfer is missed, wait for the motor to slip exactly 360° (one full rotation) and re-close when it is back in sync.</li>
              <li><strong>Feature:</strong> Uses "Predictive Logic" to account for breaker closing time (e.g., initiating close at -20° to make contact at 0°).</li>
              <li><strong>Risk:</strong> Moderate. Requires precise calculation of slip acceleration.</li>
            </ul>
          </div>

          {/* RESIDUAL */}
          <div className="border-l-4 border-amber-500 pl-4 py-1">
            <h4 className="font-bold text-amber-700 dark:text-amber-400 text-base">Type C: Residual Transfer</h4>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700 dark:text-slate-300">
              <li><strong>Logic:</strong> Wait until bus voltage drops to a safe level (typically 0.25 pu or 25%).</li>
              <li><strong>Timeframe:</strong> 1 - 5 seconds.</li>
              <li><strong>Risk:</strong> Safe for shafts, but process usually trips due to low voltage/speed. Used as a backup.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'standards',
    title: "4. IEEE/ANSI Standards",
    icon: <ShieldCheck className="w-5 h-5" />,
    content: (
      <div className="space-y-6 text-sm leading-relaxed">
        <p className="text-slate-700 dark:text-slate-300">Any commercial FBT system must adhere to these safety curves:</p>
        <ul className="space-y-4">
          <li className="flex flex-col gap-2 p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded font-mono text-xs font-bold text-slate-800 dark:text-slate-200">ANSI C50.41 (2012)</span>
              <span className="text-xs font-bold text-red-500 border border-red-500 px-2 py-0.5 rounded">LIMIT: 1.33 pu</span>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white block mb-1">Resultant V/Hz Vector Limit</strong>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                "The vector difference between the residual voltage and the source voltage at the instant of reconnection shall not exceed 1.33 per unit V/Hz."
                <br /><br />
                Exceeding this creates transient torques up to 20x nominal, which can <strong>shear couplings</strong>, twist shafts, or loosen stator windings.
              </p>
            </div>
          </li>
          <li className="flex flex-col gap-2 p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded font-mono text-xs font-bold text-slate-800 dark:text-slate-200">IEEE C37.96</span>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white block mb-1">Motor Protection Guide</strong>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Recommends specific relay functions (27 Undervoltage, 81 Frequency, 25 Sync Check) to supervise transfers and prevent out-of-phase damage.
              </p>
            </div>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'dos',
    title: "5. Dos, Don'ts & Precautions",
    icon: <AlertOctagon className="w-5 h-5" />,
    content: (
      <div className="space-y-6 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4" /> DOs</h4>
            <ul className="space-y-2 text-xs text-emerald-900 dark:text-emerald-200/80">
              <li>• <strong>Do</strong> perform dynamic simulation (ETAP/SKM) before setting relay parameters.</li>
              <li>• <strong>Do</strong> use breakers with closing times &lt; 5 cycles (83ms).</li>
              <li>• <strong>Do</strong> supervise manual transfers with a Sync-Check (25) relay.</li>
              <li>• <strong>Do</strong> account for transformer phase shifts if sources are different voltages.</li>
            </ul>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800">
            <h4 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3"><XCircle className="w-4 h-4" /> DON'Ts</h4>
            <ul className="space-y-2 text-xs text-red-900 dark:text-red-200/80">
              <li>• <strong>Don't</strong> use simple undervoltage (27) relays for Fast Transfer initiation (too slow).</li>
              <li>• <strong>Don't</strong> attempt Fast Transfer on high-static loads without verifying decay time.</li>
              <li>• <strong>Don't</strong> ignore the breaker mechanism delay (50-80ms) in logic settings.</li>
            </ul>
          </div>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-r">
          <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-1">Critical Precaution: The "Ghost" Vector</h4>
          <p className="text-xs text-amber-900 dark:text-amber-100/70">
            Relays measure the angle <em>now</em>, but the breaker takes ~80ms to physically close. By the time the contacts touch, the angle will have advanced. You MUST use <strong>Predictive Advance Angle</strong> compensation to aim for 0°, not just measure 0°.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'global',
    title: "6. Worldwide Practices",
    icon: <Globe className="w-5 h-5" />,
    content: (
      <div className="space-y-6 text-sm leading-relaxed">
        <div className="space-y-4">
          <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            <strong className="block text-slate-900 dark:text-white">North America (NERC/ANSI)</strong>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Heavy emphasis on "Break-Before-Make" transfers during faults. Parallel (Make-Before-Break) is only used for planned routine switching.
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            <strong className="block text-slate-900 dark:text-white">Europe (IEC)</strong>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Similar physics, but often refers to "High Speed Transfer Systems" (HSTS). IEC 60255 standards govern the relay performance requirements.
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            <strong className="block text-slate-900 dark:text-white">Marine / FPSO</strong>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Floating Production vessels use extremely stiff grids but have very low inertia loads. Fast transfer windows are exceptionally short (&lt;3 cycles), often requiring specialized solid-state breakers or sub-cycle static switches.
            </p>
          </div>
        </div>
      </div>
    )
  }
];

const QUIZ_BANK = {
  easy: [
    { q: "What is the primary danger of an Out-of-Phase transfer?", options: ["Voltage swell", "Shaft Shearing / Coupling Failure", "Fuse blowing", "Cable heating"], a: 1, explanation: "Closing when vectors are opposed creates torque up to 20x nominal, snapping steel shafts." },
    { q: "What is the ANSI C50.41 Safety Limit for vector difference?", options: ["1.0 pu", "1.33 pu", "2.0 pu", "0.5 pu"], a: 1, explanation: "1.33 pu is the industry standard limit. Exceeding this risks cumulative fatigue." },
    { q: "Which transfer type preserves process continuity best?", options: ["Fast Transfer", "Residual Transfer", "Manual Transfer", "Slow Transfer"], a: 0, explanation: "Fast transfer (<100ms) keeps motors spinning and contactors held in." },
    { q: "In the Simulator, the 'Ghost Vector' represents:", options: ["Past voltage", "Future angle at closure time", "Ground fault", "DC Component"], a: 1, explanation: "It predicts where the angle will be after the breaker mechanical delay (83ms)." },
    { q: "At what voltage is 'Residual Transfer' considered safe?", options: ["0.8 pu", "0.25 pu", "0.5 pu", "0.9 pu"], a: 1, explanation: "Below 0.25 pu (25%), the magnetic field is too weak to cause damage upon reclosing." }
  ],
  hard: [
    { q: "The 'Ghost Vector' calculation depends on:", options: ["Current only", "Slip Frequency & Breaker Time", "Voltage Magnitude", "Power Factor"], a: 1, explanation: "Prediction = Current Angle + (Slip Speed × Breaker Time)." },
    { q: "If Slip is 4Hz and Breaker Time is 5 cycles (83ms), calculate Advance Angle:", options: ["30°", "approx 120°", "360°", "10°"], a: 1, explanation: "4 Hz * 360°/s * 0.083s ≈ 119.5°." },
    { q: "High Inertia (H=4.0) loads make Fast Transfer:", options: ["Easier (Wider Window)", "Harder (Narrow Window)", "Impossible", "Dangerous"], a: 0, explanation: "High inertia maintains speed longer, keeping the phase angle small for a longer duration." },
    { q: "Which IEEE Device Number supervises the closing?", options: ["50/51", "25 (Sync Check)", "87 (Diff)", "64 (Ground)"], a: 1, explanation: "Device 25 is the Synchronism Check relay used to monitor angle and slip." },
    { q: "Why is In-Phase preferred over Residual?", options: ["Cheaper breaker", "Better re-acceleration / Less Inrush", "Simpler wiring", "No reason"], a: 1, explanation: "Reconnecting at high speed reduces inrush current and mechanical stress compared to restarting from a stop." }
  ]
};

// --- 3. SUB-COMPONENTS ---

const TheoryModule = ({ isDark }) => {
  const [activeId, setActiveId] = useState(THEORY_DATA[0].id);
  const activeContent = THEORY_DATA.find(t => t.id === activeId);

  return (
    <div className={`flex flex-col md:flex-row h-full animate-fade-in ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className={`w-full md:w-72 border-r overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`p-6 border-b sticky top-0 z-10 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Training Manual</span>
          <h2 className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Knowledge Base</h2>
        </div>
        <div className="p-4 space-y-2">
          {THEORY_DATA.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium transition-all ${activeId === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              {item.icon}
              <span className="text-left">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-3xl mx-auto pb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              {React.cloneElement(activeContent.icon, { className: `w-8 h-8 ${isDark ? 'text-white' : 'text-blue-600'}` })}
            </div>
            <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeContent.title}</h2>
          </div>
          <div className="prose max-w-none">
            {activeContent.content}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuizModule = ({ isDark }) => {
  const [level, setLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const startQuiz = (lvl) => {
    const pool = QUIZ_BANK[lvl] || [];
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
    <div className={`flex flex-col items-center justify-center h-full p-6 animate-fade-in ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="text-center max-w-lg mb-12">
        <div className={`inline-block p-4 rounded-full mb-6 ${isDark ? 'bg-slate-900 shadow-2xl' : 'bg-white shadow-xl'}`}>
          <GraduationCap className={`w-12 h-12 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
        </div>
        <h2 className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Certification Exam</h2>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Choose your difficulty level to begin the assessment.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {[
          { id: 'easy', label: 'Technician', desc: 'Fundamentals & Safety', color: 'bg-emerald-600', icon: <School className="w-8 h-8" /> },
          { id: 'hard', label: 'Engineer', desc: 'Advanced Physics & Relay Logic', color: 'bg-indigo-600', icon: <BrainCircuit className="w-8 h-8" /> },
        ].map(l => (
          <button key={l.id} onClick={() => startQuiz(l.id)} className={`${l.color} relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] p-8 rounded-2xl shadow-xl flex flex-col items-start gap-4 text-white transition-all`}>
            <div className="absolute right-0 top-0 p-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:bg-white/20 transition-all" />
            <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm z-10 shadow-inner">{l.icon}</div>
            <div className="z-10 text-left">
              <span className="text-2xl font-bold block mb-1">{l.label}</span>
              <span className="text-sm opacity-90">{l.desc}</span>
            </div>
            <div className="mt-auto flex items-center gap-2 text-sm font-bold bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm z-10 group-hover:bg-black/30 transition-colors">
              Start Exam <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`h-full overflow-y-auto animate-fade-in ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-3xl mx-auto p-8 pb-20">
        <div className="flex justify-between items-center mb-8 sticky top-0 z-20 py-4 bg-inherit backdrop-blur-sm">
          <button onClick={reset} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-black'}`}>
            <RotateCcw className="w-4 h-4" /> Exit Exam
          </button>
          <div className={`text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full ${isDark ? 'bg-slate-900 text-blue-400 border border-slate-700' : 'bg-white text-blue-600 border border-slate-200 shadow-sm'}`}>
            {level === 'easy' ? 'Technician' : 'Engineer'} Level
          </div>
        </div>

        {submitted ? (
          <div className={`p-10 rounded-3xl border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
            {passed ? <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-bounce" /> : <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-6" />}
            <h2 className="text-5xl font-black mb-2">{score} / 5</h2>
            <p className={`text-xl mb-10 font-bold ${passed ? 'text-emerald-500' : 'text-red-500'}`}>{passed ? "CERTIFIED COMPETENT" : "CERTIFICATION FAILED"}</p>

            <div className="text-left space-y-4 mb-8">
              {questions.map((q, idx) => (
                <div key={idx} className={`p-5 rounded-xl text-sm border-l-4 ${answers[idx] === q.a ? 'bg-emerald-500/10 border-emerald-500' : 'bg-red-500/10 border-red-500'}`}>
                  <div className="font-bold mb-2 text-base">{q.q}</div>
                  <div className={`font-mono text-xs mb-2 ${answers[idx] === q.a ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    Your Answer: {q.options[answers[idx]]}
                  </div>
                  <div className="opacity-80 mt-2 pt-2 border-t border-black/10 dark:border-white/10">{q.explanation}</div>
                </div>
              ))}
            </div>
            <button onClick={reset} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 w-full shadow-lg transition-transform active:scale-95">Take Another Exam</button>
          </div>
        ) : (
          <div className="space-y-8">
            {questions.map((q, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="font-bold text-lg mb-6 flex gap-3 leading-snug"><span className="text-blue-500 font-mono">Q{idx + 1}</span>{q.q}</h3>
                <div className="grid grid-cols-1 gap-3 pl-0 md:pl-4">
                  {q.options.map((opt, oid) => (
                    <button key={oid} onClick={() => setAnswers({ ...answers, [idx]: oid })}
                      className={`text-left p-4 rounded-xl border transition-all font-medium text-sm flex items-center justify-between group relative overflow-hidden
                            ${answers[idx] === oid
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : isDark ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-md'}`}>
                      <span className="z-10 relative">{opt}</span>
                      {answers[idx] === oid && <Check className="w-5 h-5 z-10" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < 5}
              className="w-full py-5 bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xl mt-8 transition-transform active:scale-95 flex items-center justify-center gap-2">
              Submit Final Answers <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SimulatorView = ({ isActive, isDark }) => {
  // --- SIMULATOR STATE ---
  const [simState, setSimState] = useState('CONNECTED');
  const [source1, setSource1] = useState(true);
  const [source2, setSource2] = useState(false);
  const [time, setTime] = useState(0);
  const [busV, setBusV] = useState(1.0);
  const [busFreq, setBusFreq] = useState(NOMINAL_FREQ);
  const [phaseAngle, setPhaseAngle] = useState(0);
  const [loadScenario, setLoadScenario] = useState(SCENARIOS[0]);
  const [predictedAngle, setPredictedAngle] = useState(0);
  const breakerDelay = 83; // ms (5 cycles)

  const [transferResult, setTransferResult] = useState(null);
  const [events, setEvents] = useState([{ time: '00:00:00.000', msg: 'System Initialized. Main Breaker 52-1 CLOSED.' }]);
  const [showHelp, setShowHelp] = useState(true);

  const [historyV, setHistoryV] = useState(new Array(MAX_HISTORY_POINTS).fill(1.0));
  const [historyAngle, setHistoryAngle] = useState(new Array(MAX_HISTORY_POINTS).fill(0));

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  // --- PHYSICS ENGINE ---
  const updatePhysics = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = (timestamp - (lastTimeRef.current || timestamp)) / 1000;
    lastTimeRef.current = timestamp;

    if (simState === 'COASTING' || simState === 'TRANSFER_INITIATED') {
      setTime(prev => prev + dt);

      const newV = Math.exp(-time / loadScenario.params.decayConstant);
      setBusV(newV);

      const freqDecayRate = (1 / (2 * loadScenario.params.inertiaH));
      const newFreq = NOMINAL_FREQ * Math.exp(-time * freqDecayRate * 0.2);
      setBusFreq(newFreq);

      const slipFreq = NOMINAL_FREQ - newFreq;
      const angleChange = -(slipFreq * 360 * dt);
      let newAngle = (phaseAngle + angleChange) % 360;
      if (newAngle < -180) newAngle += 360;
      setPhaseAngle(newAngle);

      const futureChange = -(slipFreq * 360 * (breakerDelay / 1000));
      let predAngle = (newAngle + futureChange) % 360;
      if (predAngle < -180) predAngle += 360;
      setPredictedAngle(predAngle);

      setHistoryV(prev => [...prev.slice(1), newV]);
      setHistoryAngle(prev => [...prev.slice(1), newAngle]);
    } else {
      setHistoryV(prev => [...prev.slice(1), busV]);
      setHistoryAngle(prev => [...prev.slice(1), phaseAngle]);
      setPredictedAngle(phaseAngle);
    }
    // ALWAYS request frame if active to maintain loop
    requestRef.current = requestAnimationFrame(updatePhysics);
  }, [simState, time, phaseAngle, loadScenario, busV, breakerDelay]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current);
  }, [updatePhysics]);

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
    setTimeout(() => executeClosure(), breakerDelay);
  };

  const executeClosure = () => {
    setSimState('COMPLETED');
    setSource2(true);
    const finalAngle = Math.abs(predictedAngle);
    const rad = finalAngle * DEG_TO_RAD;
    const deltaV = Math.sqrt(Math.pow(SYSTEM_V, 2) + Math.pow(busV, 2) - 2 * SYSTEM_V * busV * Math.cos(rad));

    let res = { type: 'success', msg: '', detail: '' };
    if (finalAngle <= 25 && deltaV < 1.33) {
      res = { type: 'success', msg: "SUCCESS: Fast Transfer", detail: `Ideal closure at ${finalAngle.toFixed(1)}°. Minimal Torque Shock.` };
    } else if (busV <= 0.25) {
      res = { type: 'success', msg: "SUCCESS: Residual Transfer", detail: `Voltage dropped to safe level (${busV.toFixed(2)}pu).` };
    } else if (deltaV > 1.33) {
      res = { type: 'critical', msg: "FAILURE: SHAFT SHEAR DETECTED", detail: `V/Hz limit exceeded (${deltaV.toFixed(2)}pu). Catastrophic Failure.` };
    } else {
      res = { type: 'warning', msg: "WARNING: Marginal Transfer", detail: `High torque shock (${deltaV.toFixed(2)}pu). Possible coupling damage.` };
    }
    setTransferResult(res);
    addEvent(res.msg);
    setBusV(1.0); setBusFreq(NOMINAL_FREQ); setPhaseAngle(0);
  };

  const resetSystem = () => {
    setSimState('CONNECTED'); setSource1(true); setSource2(false);
    setTime(0); setBusV(1.0); setBusFreq(NOMINAL_FREQ); setPhaseAngle(0);
    setHistoryV(new Array(MAX_HISTORY_POINTS).fill(1.0));
    setHistoryAngle(new Array(MAX_HISTORY_POINTS).fill(0));
    setEvents([{ time: '00:00:00.000', msg: 'System Reset. Ready.' }]);
    setTransferResult(null);
  };

  const predDeltaV = Math.sqrt(Math.pow(SYSTEM_V, 2) + Math.pow(busV, 2) - 2 * SYSTEM_V * busV * Math.cos(predictedAngle * DEG_TO_RAD));
  const isFastSafe = Math.abs(predictedAngle) <= 25 && predDeltaV < 1.33;
  const isResidualSafe = busV < 0.25;

  return (
    <div style={{ display: isActive ? 'grid' : 'none' }} className={`p-4 md:p-6 grid-cols-12 gap-6 h-full overflow-hidden animate-fade-in ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>

      {/* --- INSTRUCTION MODAL --- */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><MousePointer2 className="w-5 h-5 text-blue-500" /> Simulator Guide</h2>
              <button onClick={() => setShowHelp(false)}><X className="w-6 h-6 hover:text-red-500" /></button>
            </div>
            <div className={`p-6 space-y-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Objective</h3>
                <p>Safely transfer the motor bus from Utility to Aux Generator. Catch the "Fast" window (Green Zone) to prevent process interruption.</p>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <div><strong>Select Load:</strong> Choose "ID Fan" (High Inertia, Easier) or "Compressor" (Low Inertia, Harder).</div>
                </li>
                <li className="flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <div><strong>Trip Utility (52-1):</strong> The bus will de-energize and the vector will start spinning clockwise.</div>
                </li>
                <li className="flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <div><strong>Watch the GHOST:</strong> The Dotted Line predicts where the angle WILL be in 83ms. Aim with this!</div>
                </li>
                <li className="flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">4</div>
                  <div><strong>Close Aux (52-2):</strong> Click when the Ghost Vector is in the GREEN zone (&lt;25°).</div>
                </li>
              </ul>
              <button onClick={() => setShowHelp(false)} className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg">Start Simulation</button>
            </div>
          </div>
        </div>
      )}

      {/* --- LEFT PANEL: SCADA & CONTROLS --- */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
        {/* STATUS BAR */}
        <div className={`p-4 rounded-xl border flex justify-between items-center shadow-sm ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <MonitorPlay className="text-blue-500 w-6 h-6" />
            <div>
              <h3 className={`font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>System Status</h3>
              <div className="font-mono font-bold text-lg flex items-center gap-2">
                {simState === 'CONNECTED' && <span className="text-emerald-500 flex items-center gap-2"><Lock className="w-4 h-4" /> NORMAL OP</span>}
                {simState === 'COASTING' && <span className="text-amber-500 animate-pulse flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> BUS COASTING</span>}
                {simState === 'TRANSFER_INITIATED' && <span className="text-blue-500 flex items-center gap-2"><Settings className="w-4 h-4 animate-spin" /> CLOSING...</span>}
                {simState === 'COMPLETED' && <span className="text-slate-500 flex items-center gap-2"><Lock className="w-4 h-4" /> SEQUENCE END</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {SCENARIOS.map(s => (
              <button key={s.id} onClick={() => setLoadScenario(s)}
                className={`text-xs px-3 py-1.5 rounded font-bold border transition-colors ${loadScenario.id === s.id
                  ? (isDark ? 'bg-blue-900 border-blue-500 text-blue-200' : 'bg-blue-100 border-blue-400 text-blue-800')
                  : (isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600')}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* SINGLE LINE DIAGRAM (SCADA) */}
        <div className={`rounded-2xl border p-8 shadow-inner relative overflow-hidden flex-1 min-h-[400px] flex flex-col justify-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
          <div className={`absolute inset-0 opacity-10 pointer-events-none ${isDark ? 'bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]' : 'bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]'}`}></div>

          {/* Sources */}
          <div className="flex justify-between px-6 md:px-24 mb-4 z-10">
            {/* Source 1 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Utility 138kV</div>
              <Factory className={`w-14 h-14 p-3 rounded-lg border-2 transition-all ${source1 ? 'text-emerald-500 border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'text-slate-400 border-slate-400 bg-slate-200 dark:bg-slate-800'}`} />
              <div className={`h-10 w-1.5 transition-colors ${source1 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {/* Breaker 52-1 */}
              <div className={`w-12 h-12 border-2 rounded shadow-lg flex items-center justify-center transition-all duration-300 ${source1 ? 'bg-red-500 border-red-600' : 'bg-green-500 border-green-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-sm ${source1 ? '' : 'border border-slate-400'}`} />
              </div>
              <span className={`font-mono text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>52-1</span>
            </div>

            {/* Source 2 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Aux Gen</div>
              <Power className={`w-14 h-14 p-3 rounded-lg border-2 transition-all ${source2 ? 'text-blue-500 border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'text-slate-400 border-slate-400 bg-slate-200 dark:bg-slate-800'}`} />
              <div className={`h-10 w-1.5 transition-colors ${source2 ? 'bg-blue-500' : 'bg-slate-400'}`} />
              {/* Breaker 52-2 */}
              <div className={`w-12 h-12 border-2 rounded shadow-lg flex items-center justify-center transition-all duration-300 ${source2 ? 'bg-red-500 border-red-600' : 'bg-green-500 border-green-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-sm ${source2 ? '' : 'border border-slate-400'}`} />
              </div>
              <span className={`font-mono text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>52-2</span>
            </div>
          </div>

          {/* Main Bus */}
          <div className="px-16 md:px-32 z-10 relative">
            <div className={`h-6 w-full rounded flex items-center justify-center transition-colors duration-300 relative ${busV > 0.1 ? 'bg-amber-500 shadow-[0_0_15px_orange]' : 'bg-slate-500'}`}>
              <span className="text-[10px] font-black text-black/50 tracking-[0.2em] absolute bg-white/20 px-2 rounded">4.16kV ESSENTIAL BUS</span>
            </div>
          </div>

          {/* Load */}
          <div className="flex justify-center z-10 -mt-1">
            <div className="flex flex-col items-center">
              <div className={`h-12 w-1.5 ${busV > 0.1 ? 'bg-amber-500' : 'bg-slate-500'}`} />
              <div className={`w-32 h-32 rounded-full border-[6px] flex items-center justify-center relative shadow-2xl transition-all bg-white dark:bg-slate-900 ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                <Gauge className={`w-16 h-16 transition-colors ${busV > 0.1 ? 'text-amber-500' : 'text-slate-400'}`} />
                {busV > 0.05 && (
                  <svg className="absolute inset-0 w-full h-full animate-spin-slow" style={{ animationDuration: `${(1 / busFreq) * 50}s` }}>
                    <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="3" fill="none" className="text-slate-400/30" strokeDasharray="8 8" />
                  </svg>
                )}
                <div className={`absolute -bottom-12 text-center w-40 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <div className="text-xs font-bold uppercase bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded inline-block">{loadScenario.name}</div>
                  <div className="font-mono text-xs opacity-80 mt-1">{busFreq.toFixed(2)} Hz</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[280px]">
          <div className={`rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Terminal className="w-3 h-3" /> Operator Desk</h4>
            <div className="grid grid-cols-3 gap-3 h-32">
              <button onClick={tripMain} disabled={!source1}
                className="rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs flex flex-col items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_red]" />
                TRIP 52-1
              </button>
              <button onClick={initiateTransfer} disabled={simState !== 'COASTING'}
                className="rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex flex-col items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden transition-all active:scale-95">
                {simState === 'TRANSFER_INITIATED' && <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />}
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_blue]" />
                CLOSE 52-2
              </button>
              <button onClick={resetSystem}
                className={`rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-2 hover:bg-opacity-80 transition-all active:scale-95 ${isDark ? 'border-slate-600 bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                <RotateCcw className="w-4 h-4" /> RESET
              </button>
            </div>
          </div>
          <div className={`rounded-xl border p-5 flex flex-col ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><FileText className="w-3 h-3" /> Event Log (SOE)</h4>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar pr-2 bg-slate-50 dark:bg-black/20 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
              {events.map((e, i) => (
                <div key={i} className="flex gap-2 border-b border-dashed border-slate-200 dark:border-slate-800 pb-1 last:border-0">
                  <span className={`select-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{e.time}</span>
                  <span className={e.msg.includes('TRIP') ? 'text-red-600 font-bold' : e.msg.includes('SUCCESS') ? 'text-emerald-600 font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'}>{e.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: PROTECTION RELAY --- */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar">

        {/* SYNCHROSCOPE */}
        <div className={`rounded-xl border-4 p-5 shadow-2xl relative min-h-[400px] flex flex-col items-center ${isDark ? 'bg-[#1e293b] border-slate-600' : 'bg-slate-800 border-slate-400'}`}>
          <div className="absolute top-2 left-3 text-[10px] font-black text-slate-400 bg-black/20 px-2 py-1 rounded tracking-widest border border-white/5">SEL-700G SYNC-CHECK</div>

          {/* V/Hz Meters */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6 mt-8">
            <div className="bg-black/40 p-3 rounded border border-white/10 text-right">
              <div className="text-[10px] text-slate-400 font-bold mb-1">ANGLE DIFF</div>
              <div className={`text-3xl font-mono font-bold ${Math.abs(phaseAngle) > 25 ? 'text-red-500' : 'text-emerald-400'}`}>{Math.abs(phaseAngle).toFixed(1)}°</div>
            </div>
            <div className="bg-black/40 p-3 rounded border border-white/10 text-right">
              <div className="text-[10px] text-slate-400 font-bold mb-1">PRED. DELTA V</div>
              <div className={`text-3xl font-mono font-bold ${predDeltaV > 1.33 ? 'text-red-500' : 'text-emerald-400'}`}>{predDeltaV.toFixed(2)}pu</div>
            </div>
          </div>

          {/* Scope Visual */}
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
              {/* Dial Face */}
              <circle cx="100" cy="100" r="98" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              {/* Ticks */}
              {[...Array(36)].map((_, i) => (
                <line key={i} x1="100" y1="5" x2="100" y2={i % 3 === 0 ? "15" : "10"} transform={`rotate(${i * 10} 100 100)`} stroke={i % 3 === 0 ? "#cbd5e1" : "#475569"} strokeWidth={i % 3 === 0 ? "2" : "1"} />
              ))}

              {/* Safe Zones */}
              <path d="M 100 100 L 80 25 A 80 80 0 0 1 120 25 Z" fill="#10b981" fillOpacity="0.2" />
              <path d="M 100 20 L 100 2" stroke="#10b981" strokeWidth="4" />
              <text x="88" y="30" fill="#10b981" fontSize="10" fontWeight="bold">SYNC</text>

              {/* Danger Zones */}
              <path d="M 100 100 L 190 100 A 90 90 0 0 1 10 100 Z" fill="#ef4444" fillOpacity="0.1" />

              {/* Reference Grid Vector (Fixed) */}
              <line x1="100" y1="100" x2="100" y2="20" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
              <text x="92" y="16" fill="#3b82f6" fontSize="9" fontWeight="bold">GRID</text>

              {/* Moving Bus Vector */}
              <g transform={`rotate(${phaseAngle}, 100, 100)`}>
                <line x1="100" y1="100" x2="100" y2={100 - (busV * 75)} stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                <circle cx="100" cy={100 - (busV * 75)} r="6" fill="#f59e0b" stroke="#fff" strokeWidth="1" />
              </g>

              {/* Predictive Ghost Vector */}
              {simState === 'COASTING' && (
                <g transform={`rotate(${predictedAngle}, 100, 100)`}>
                  <line x1="100" y1="100" x2="100" y2={100 - (busV * 75)} stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" opacity="0.6" />
                  <text x="100" y={100 - (busV * 85)} fill="#f59e0b" fontSize="9" opacity="0.8" fontWeight="bold" textAnchor="middle">GHOST</text>
                </g>
              )}

              <circle cx="100" cy="100" r="4" fill="white" />
            </svg>
          </div>

          {/* LEDs */}
          <div className="w-full flex justify-around mt-6 px-4 pb-2">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-4 h-4 rounded-full border border-black shadow-inner transition-colors duration-300 ${isFastSafe ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-emerald-900'}`} />
              <span className="text-[9px] font-bold text-slate-400 tracking-wider">FAST OK</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-4 h-4 rounded-full border border-black shadow-inner transition-colors duration-300 ${isResidualSafe ? 'bg-amber-500 shadow-[0_0_10px_orange]' : 'bg-amber-900'}`} />
              <span className="text-[9px] font-bold text-slate-400 tracking-wider">RESIDUAL</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-4 h-4 rounded-full border border-black shadow-inner transition-colors duration-300 ${simState === 'COMPLETED' && transferResult?.type === 'critical' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-red-900'}`} />
              <span className="text-[9px] font-bold text-slate-400 tracking-wider">TRIP</span>
            </div>
          </div>
        </div>

        {/* FEEDBACK & OSCILLOGRAPHY */}
        <AnimatePresence>
          {transferResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border-l-4 shadow-lg ${transferResult.type === 'success' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : transferResult.type === 'warning' ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-red-100 border-red-500 text-red-900'}`}>
              <h3 className="font-bold flex items-center gap-2">
                {transferResult.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {transferResult.msg}
              </h3>
              <p className="text-sm mt-1 opacity-90">{transferResult.detail}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`rounded-xl border p-4 shadow-sm flex-1 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h4 className={`text-xs font-bold uppercase tracking-widest opacity-60 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Oscillography (Last 5s)</h4>
            <Activity className={`w-4 h-4 opacity-40 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
          </div>
          <div className="space-y-4">
            <div className="relative h-20 border rounded bg-slate-50 dark:bg-black/20 overflow-hidden group">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <line x1="0" y1="20%" x2="100%" y2="20%" stroke="gray" strokeWidth="1" strokeDasharray="2 2" opacity="0.1" />
                <line x1="0" y1="80%" x2="100%" y2="80%" stroke="gray" strokeWidth="1" strokeDasharray="2 2" opacity="0.1" />
                <polyline points={useTrendline(historyV, 400, 80, 0, 1.2)} fill="none" stroke="#10b981" strokeWidth="2" />
              </svg>
              <span className="absolute top-1 left-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-500 bg-white/50 dark:bg-black/50 px-1 rounded">VOLTAGE (pu)</span>
              <span className="absolute bottom-1 right-2 text-[9px] font-mono text-emerald-600 dark:text-emerald-500">{busV.toFixed(2)}</span>
            </div>
            <div className="relative h-20 border rounded bg-slate-50 dark:bg-black/20 overflow-hidden">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="gray" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
                <polyline points={useTrendline(historyAngle, 400, 80, -180, 180)} fill="none" stroke="#f59e0b" strokeWidth="2" />
              </svg>
              <span className="absolute top-1 left-2 text-[9px] font-bold text-amber-600 dark:text-amber-500 bg-white/50 dark:bg-black/50 px-1 rounded">ANGLE (Deg)</span>
              <span className="absolute bottom-1 right-2 text-[9px] font-mono text-amber-600 dark:text-amber-500">{phaseAngle.toFixed(1)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- 4. MAIN LAYOUT ---

export default function FastBusTransferApp() {
  const [mode, setMode] = useState('simulator');
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      {/* Header */}
      <header className={`h-16 border-b shrink-0 flex items-center justify-between px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>GridGuard <span className="text-blue-500">PRO</span></h1>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Transient Analysis Suite</span>
          </div>
        </div>

        <div className={`flex items-center p-1 rounded-xl border shadow-sm ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          {[
            { id: 'theory', label: 'Manual', icon: <Book className="w-4 h-4" /> },
            { id: 'simulator', label: 'Simulator', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'quiz', label: 'Exam', icon: <GraduationCap className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${mode === tab.id ? (isDark ? 'bg-slate-800 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm') : 'opacity-60 hover:opacity-100'}`}
            >
              {tab.icon} <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsDark(!isDark)} className={`p-2.5 rounded-lg transition-all border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm'}`}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => window.open('https://standards.ieee.org/ieee/C37.96/6018/', '_blank')} className="hidden md:flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-600 hover:underline">
            <Info className="w-4 h-4" /> IEEE C37.96
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 overflow-hidden relative">
        {mode === 'theory' && <TheoryModule isDark={isDark} />}
        {/* We keep Simulator mounted but hidden when inactive to preserve state */}
        <SimulatorView isActive={mode === 'simulator'} isDark={isDark} />
        {mode === 'quiz' && <QuizModule isDark={isDark} />}
      </div>
    </div>
  );
}