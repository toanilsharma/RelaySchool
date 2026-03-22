import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BookOpen,
  Cpu,
  Scale,
  Radar,
  Play,
  ShieldCheck,
  Microscope,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Server,
  Wifi,
  Power,
  Waves,
  Globe,
  Eye,
  ArrowRight,
  HelpCircle,
  Network,
  Target,
  DollarSign,
  Building2,
  Sparkles,
  FlaskConical,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Slider from "../components/Slider";
import { PageSEO } from "../components/SEO/PageSEO";

const dashboardSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RelaySchool — Power System Engineering Simulator",
  url: "https://relayschool.co.in",
  description:
    "The premier highly recommended educational platform to master Power System Engineering and IEC 61850 through interactive, real-time browser simulations.",
  keywords: "Power System Simulation, Relay Coordination Training, IEC 61850 courses, Electrical Engineering Education, Free Protection Relay Simulator"
};

// ─────────────────────────────────────────────────────
// HERO SECTION — Value-first, emotional impact
// ─────────────────────────────────────────────────────

const GridPulseHero = () => {
  const [baseFreq, setBaseFreq] = useState(50);
  const [freq, setFreq] = useState(50.0);
  const [breakerClosed, setBreakerClosed] = useState(true);
  const [particles, setParticles] = useState<
    { x: number; y: number; speed: number; id: number }[]
  >([]);

  useEffect(() => {
    const i = setInterval(() => {
      setFreq(
        baseFreq + (Math.random() - 0.5) * (breakerClosed ? 0.035 : 0.5)
      );
    }, 1200);
    return () => clearInterval(i);
  }, [baseFreq, breakerClosed]);

  useEffect(() => {
    if (!breakerClosed) {
      setParticles([]);
      return;
    }
    let particleId = 0;
    const MAX_PARTICLES = 12;
    const interval = setInterval(() => {
      setParticles((prev) => {
        const next = prev
          .map((p) => ({ ...p, x: p.x + p.speed * 3 }))
          .filter((p) => p.x < 100);
        if (next.length < MAX_PARTICLES && Math.random() > 0.5) {
          next.push({
            x: 0,
            y: Math.random() * 100,
            speed: 0.5 + Math.random() * 1,
            id: particleId++,
          });
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [breakerClosed]);

  const pathData =
    `M 0 40 ` +
    Array.from(
      { length: 60 },
      (_, i) =>
        `L ${i * 10} ${40 + Math.sin(i * 0.4 + Date.now() / 400) * (breakerClosed ? 25 : 2)}`
    ).join(" ");

  return (
    <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 text-white group bg-slate-900">
      {/* Particle background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      {breakerClosed && (
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa] blur-[0.5px]"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: 1 - p.x / 100,
              }}
            />
          ))}
        </div>
      )}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* LEFT — Value Proposition */}
        <div className="space-y-6 max-w-xl">
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              100% Free Educational Platform
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.1]">
            Experience Power Systems
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Like Never Before
            </span>
          </h1>

          <p className="text-slate-300 text-lg leading-relaxed max-w-lg">
            See invisible forces—flux, phasors, and fault currents—come alive in real-time. An incredibly powerful educational platform featuring <strong className="text-white">40+ interactive, physics-accurate simulators</strong> running instantly in your browser.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> IEEE & IEC
              aligned simulations
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Works offline
              (PWA)
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Used by
              engineers worldwide
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to="/academy"
              className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-between gap-4 group/btn"
            >
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs text-blue-200 uppercase tracking-widest">
                    Start Free
                  </div>
                  <div className="text-sm">Launch Simulation Lab</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/academy"
              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-between gap-4 group/btn"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 opacity-80 text-purple-400" />
                <div className="text-left">
                  <div className="text-xs text-slate-400 uppercase tracking-widest">
                    Curriculum
                  </div>
                  <div className="text-sm">Explore Learning Paths</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* RIGHT — Live Interactive Monitor */}
        <div className="flex-1 w-full max-w-md bg-slate-950/90 rounded-2xl border border-slate-700 p-6 shadow-2xl relative overflow-hidden group/monitor hover:border-slate-600 transition-colors">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBreakerClosed(!breakerClosed)}
                className={`relative z-10 w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg ${breakerClosed ? "bg-red-500 border-red-600 shadow-red-500/20 text-white" : "bg-emerald-500 border-emerald-600 shadow-emerald-500/20 text-white"}`}
                title={breakerClosed ? "Trip Breaker" : "Close Breaker"}
              >
                <Power className="w-5 h-5" />
              </button>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Try it Now — Interactive Demo
                </div>
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${breakerClosed ? "text-red-400" : "text-emerald-400"}`}
                >
                  CB-101 {breakerClosed ? "CLOSED (LIVE)" : "OPEN (TRIPPED)"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Wifi
                className={`w-3 h-3 ${breakerClosed ? "text-emerald-500 animate-pulse" : "text-slate-600"}`}
              />
              <span
                className={`text-[10px] font-mono font-bold ${breakerClosed ? "text-emerald-500" : "text-slate-500"}`}
              >
                {breakerClosed ? "SYNCED" : "OFFLINE"}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-sm text-slate-400 font-medium">
                Frequency
              </span>
              <div className="flex flex-col items-end">
                <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 mb-1">
                  <button
                    onClick={() => setBaseFreq(50)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${baseFreq === 50 ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    50Hz
                  </button>
                  <button
                    onClick={() => setBaseFreq(60)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${baseFreq === 60 ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    60Hz
                  </button>
                </div>
                <div className="text-right">
                  <span className="font-mono text-4xl font-black text-white tracking-tighter">
                    {freq.toFixed(3)}
                  </span>
                  <span className="text-sm text-slate-500 ml-1 font-bold">
                    Hz
                  </span>
                </div>
              </div>
            </div>
            <div className="h-20 w-full bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden relative">
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  d={pathData}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold">
                  PTP Drift
                </div>
                <div className="text-xs font-mono text-emerald-400 mt-1">
                  0.002ms
                </div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold">
                  GOOSE Latency
                </div>
                <div className="text-xs font-mono text-blue-400 mt-1">
                  3.4ms
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────
// "UNLIMITED EXPERIMENTATION" — 4 learning value cards
// ─────────────────────────────────────────────────────

const WHY_CARDS = [
  {
    icon: FlaskConical,
    title: "Unlimited Experiments",
    desc: "A completely safe environment to inject faults, intentionally miscoordinate relays, and observe the exact consequences without real-world risks.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: Target,
    title: "Learn by Doing, Not Reading",
    desc: "Tweak relay settings, shift curves, watch phasors rotate in real-time. Complex mathematical concepts become deeply intuitive when you can touch and interact with them.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Sparkles,
    title: "Curiosity Driven Learning",
    desc: "Unlike rigid training programs, RelaySchool encourages you to break things. Ask 'What if I change this setting?' and immediately see the system response.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: Globe,
    title: "Learn Anywhere, Even Offline",
    desc: "Browser-based PWA that runs perfectly on any device. Once loaded, the physics engine runs entirely in your browser without needing an internet connection.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

const WhySection = () => (
  <section className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
        Where Theory Finally Meets Reality
      </h2>
      <p className="text-slate-500 mt-2 text-sm max-w-2xl mx-auto">
        A breathtakingly interactive environment where students and engineers transform dense textbook equations into deep, intuitive understanding.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {WHY_CARDS.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className={`relative p-6 rounded-2xl border ${card.border} ${card.bg} backdrop-blur-sm group hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
        >
          <div
            className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            <card.icon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
            {card.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {card.desc}
          </p>
        </motion.div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// TRUST METRICS BAR (replaces fake activity ticker)
// ─────────────────────────────────────────────────────

const TrustBar = () => {
  const metrics = [
    { value: "40+", label: "Interactive Simulators", icon: Cpu },
    { value: "IEEE & IEC", label: "Standards Aligned", icon: ShieldCheck },
    { value: "100%", label: "Free Forever", icon: Sparkles },
    { value: "PWA", label: "Works Offline", icon: Wifi },
  ];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 shadow-xl">
      {metrics.map((m, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <m.icon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white leading-tight">
              {m.value}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {m.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// "WHAT YOU'LL MASTER" — 3 pillar cards (kept tight)
// ─────────────────────────────────────────────────────

const JargonTooltip = ({
  text,
  explanation,
}: {
  text: string;
  explanation: string;
}) => (
  <span className="relative group/tooltip inline-block cursor-help border-b-2 border-dotted border-blue-400 dark:border-blue-600">
    {text}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none shadow-2xl z-50 scale-95 group-hover/tooltip:scale-100">
      <span className="font-bold text-blue-400 block mb-1">{text}</span>
      {explanation}
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-slate-700 rotate-45"></span>
    </span>
  </span>
);

const PILLARS = [
  {
    title: "Protection Coordination",
    subtitle: "Selectivity · Grading · Speed",
    icon: Scale,
    color: "blue",
    desc: "Learn to grade relays, set pickup thresholds, and ensure only the nearest breaker trips during a fault — keeping the rest of the grid alive.",
    tools: "TCC Studio · Relay Tester · Distance Lab",
    link: "/tcc",
  },
  {
    title: "Digital Substations",
    subtitle: "GOOSE · Sampled Values · PTP",
    icon: Network,
    color: "purple",
    desc: "Explore IEC 61850 GOOSE messaging, Sampled Values, and real-time topology — the technologies replacing copper wiring in modern substations.",
    tools: "Comms Hub · Digital Twin · Event Analyzer",
    link: "/comms",
  },
  {
    title: "Fault Analysis & Forensics",
    subtitle: "CT Saturation · Harmonics · DC Offset",
    icon: Microscope,
    color: "red",
    desc: "Reconstruct protection failures, analyze CT Saturation, and study harmonic distortion — the investigative skills every protection engineer needs.",
    tools: "Forensic Lab · Failure Lab · Toolkit",
    link: "/forensic",
  },
];

const colorMap: Record<string, { gradient: string; bg: string; iconBg: string; textColor: string; border: string }> = {
  blue: {
    gradient: "from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    textColor: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200/50 dark:border-blue-800/30",
  },
  purple: {
    gradient: "from-purple-50 to-violet-50/50 dark:from-purple-950/40 dark:to-violet-950/20",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    textColor: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200/50 dark:border-purple-800/30",
  },
  red: {
    gradient: "from-red-50 to-orange-50/50 dark:from-red-950/40 dark:to-orange-950/20",
    bg: "bg-red-100 dark:bg-red-900/40",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    textColor: "text-red-600 dark:text-red-400",
    border: "border-red-200/50 dark:border-red-800/30",
  },
};

const WhatYoullMaster = () => (
  <section className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
        What You'll Master
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
        Three pillars of modern protection engineering — all in your browser
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PILLARS.map((p) => {
        const c = colorMap[p.color];
        return (
          <Link to={p.link} key={p.title} className="group block">
            <div
              className={`bg-gradient-to-br ${c.gradient} rounded-2xl border ${c.border} p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden`}
            >
              <div
                className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${p.color === "blue" ? "from-blue-500 to-indigo-500" : p.color === "purple" ? "from-purple-500 to-violet-500" : "from-red-500 to-orange-500"}`}
              ></div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 ${c.iconBg} rounded-xl shadow-sm`}>
                  <p.icon className={`w-6 h-6 ${c.textColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {p.title}
                  </h3>
                  <div
                    className={`text-[10px] ${c.textColor} font-bold uppercase tracking-wider mt-0.5`}
                  >
                    {p.subtitle}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                {p.desc}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Activity className="w-3 h-3" />
                  <span>{p.tools}</span>
                </div>
                <ArrowRight
                  className={`w-4 h-4 ${c.textColor} opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all`}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// FEATURED SIMULATORS — Top 6 picks
// ─────────────────────────────────────────────────────

const FEATURED = [
  {
    title: "TCC Studio",
    icon: Activity,
    link: "/tcc",
    desc: "Plot IEC/IEEE time-overcurrent curves, set grading margins, and verify relay coordination visually.",
    standard: "IEEE C37.112",
    theme: "blue",
  },
  {
    title: "Digital Twin",
    icon: Server,
    link: "/twin",
    desc: "Operate a real-time substation topology model — toggle breakers and observe power flow consequences.",
    standard: "IEC 61850",
    theme: "teal",
  },
  {
    title: "Distance Lab",
    icon: Radar,
    link: "/distance",
    desc: "Visualize impedance zones on the R-X plane. Study load encroachment and fault resistance effects.",
    standard: "IEEE C37.113",
    theme: "emerald",
  },
  {
    title: "Comms Hub",
    icon: Network,
    link: "/comms",
    desc: "Inspect GOOSE and Sampled Values packets. Simulate network storms and latency gaps.",
    standard: "IEC 61850-9-2",
    theme: "purple",
  },
  {
    title: "Forensic Lab",
    icon: Microscope,
    link: "/forensic",
    desc: "Analyze COMTRADE fault records with multi-channel oscillography and event reconstruction.",
    standard: "IEEE C37.111",
    theme: "red",
  },
  {
    title: "Phasor Lab",
    icon: Waves,
    link: "/vectors",
    desc: "Interactive phasor diagrams with symmetrical components visualization and ABC sequence analysis.",
    standard: "IEC 60044",
    theme: "indigo",
  },
];

const THEME_COLORS: Record<string, { bg: string; border: string; icon: string; btn: string }> = {
  blue: { bg: "bg-blue-50/60 dark:bg-blue-950/30", border: "border-blue-200/60 dark:border-blue-800/40", icon: "text-blue-600 dark:text-blue-400", btn: "bg-blue-600 hover:bg-blue-500" },
  teal: { bg: "bg-teal-50/60 dark:bg-teal-950/30", border: "border-teal-200/60 dark:border-teal-800/40", icon: "text-teal-600 dark:text-teal-400", btn: "bg-teal-600 hover:bg-teal-500" },
  emerald: { bg: "bg-emerald-50/60 dark:bg-emerald-950/30", border: "border-emerald-200/60 dark:border-emerald-800/40", icon: "text-emerald-600 dark:text-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-500" },
  purple: { bg: "bg-purple-50/60 dark:bg-purple-950/30", border: "border-purple-200/60 dark:border-purple-800/40", icon: "text-purple-600 dark:text-purple-400", btn: "bg-purple-600 hover:bg-purple-500" },
  red: { bg: "bg-red-50/60 dark:bg-red-950/30", border: "border-red-200/60 dark:border-red-800/40", icon: "text-red-600 dark:text-red-400", btn: "bg-red-600 hover:bg-red-500" },
  indigo: { bg: "bg-indigo-50/60 dark:bg-indigo-950/30", border: "border-indigo-200/60 dark:border-indigo-800/40", icon: "text-indigo-600 dark:text-indigo-400", btn: "bg-indigo-600 hover:bg-indigo-500" },
};

const FeaturedSimulators = () => (
  <section className="space-y-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
          Featured Simulators
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Our most popular simulation labs — each designed around real
          engineering workflows
        </p>
      </div>
      <Link
        to="/academy"
        className="text-blue-600 font-bold hover:underline flex items-center gap-1 shrink-0"
      >
        Explore All 40+ Modules <ArrowRight className="w-4 h-4" />
      </Link>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURED.map((item) => {
        const t = THEME_COLORS[item.theme] || THEME_COLORS.blue;
        return (
          <Link to={item.link} key={item.title} className="block group">
            <div
              className={`${t.bg} rounded-2xl border ${t.border} p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col relative overflow-hidden`}
            >
              {/* Background icon */}
              <div className="absolute -right-4 -top-4 opacity-[0.04] group-hover:opacity-[0.10] group-hover:-rotate-12 group-hover:scale-125 transition-all duration-700">
                <item.icon className="w-32 h-32" />
              </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div
                  className={`p-3 rounded-xl ${t.bg} ${t.icon} border border-white/10 shadow-lg`}
                >
                  <item.icon className="w-6 h-6 drop-shadow-md" />
                </div>
                <div className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-500/10 text-slate-500 border border-current/20">
                  {item.standard}
                </div>
              </div>

              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative z-10">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1 mb-4 relative z-10">
                {item.desc}
              </p>

              <div
                className={`relative z-10 mt-auto flex items-center justify-between py-3 px-4 rounded-xl ${t.btn} text-white text-sm font-bold transition-all shadow-md`}
              >
                <span>Open Module</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// UNIQUE EDUCATIONAL OFFERING SECTION (Replaces Comparison Table)
// ─────────────────────────────────────────────────────

const UniqueOfferingSection = () => {
  const offerings = [
    {
      title: "Interactive Visualization",
      desc: "Unlike traditional textbook learning or static presentations, see exactly how symmetrical components react and how impedance trajectories move during a fault.",
    },
    {
      title: "Browser-Native Physics Engine",
      desc: "No expensive workstation required. Our custom math engine runs advanced complex number calculations and differential equations right in your browser.",
    },
    {
      title: "Purely Educational Focus",
      desc: "Freed from the constraints of professional compliance tools, our interfaces are optimized purely for pedagogical clarity—making complex topics approachable.",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
          A Revolutionary Educational Experience
        </h2>
        <p className="text-slate-500 mt-2 text-sm max-w-2xl mx-auto">
          We built RelaySchool to do what static diagrams simply cannot: make the complex dynamics of power system protection visible, interactive, and beautifully intuitive.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {offerings.map((item, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                  {i + 1}
                </span>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg leading-tight">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-11">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────
// MISSION SECTION — Compact manifesto
// ─────────────────────────────────────────────────────

const MissionSection = () => (
  <section className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
    <div className="absolute inset-0 opacity-20">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad1)" />
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#8b5cf6", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <div className="relative z-10 p-8 md:p-12 lg:p-16 text-center max-w-3xl mx-auto space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest">
        Our Mission
      </div>
      <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
        Democratizing{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Power Engineering
        </span>
      </h2>
      <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
        Professional simulation software is expensive, clunky, and locked
        behind hardware keys. This creates a barrier for students and engineers
        who just want to learn. RelaySchool breaks this barrier by combining{" "}
        <strong className="text-white">gaming-grade visuals</strong> with{" "}
        <strong className="text-white">IEEE-standard math</strong> — accessible
        to everyone, everywhere.
      </p>
      <div className="flex flex-wrap justify-center gap-6 pt-4">
        {[
          { icon: Eye, title: "Visual Learning", desc: "See flux, waves, and packets" },
          { icon: Cpu, title: "Physics Engine", desc: "Real-time vector math" },
          { icon: Wifi, title: "Offline First", desc: "PWA — works in the field" },
          { icon: Globe, title: "Browser Native", desc: "No installs ever" },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
              <p.icon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <div className="font-bold text-white text-sm">{p.title}</div>
              <div className="text-[11px] text-slate-500">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// FAQ SECTION
// ─────────────────────────────────────────────────────

const FAQ_DATA = [
  {
    q: "What is RelaySchool?",
    a: "RelaySchool is an advanced, browser-based simulation suite for Power System Protection engineering. It provides interactive labs for TCC coordination, IEC 61850 protocol analysis, and forensic fault reconstruction without requiring expensive desktop software.",
  },
  {
    q: "Is this tool suitable for professional coordination studies?",
    a: "RelaySchool is an educational platform designed for training and concept verification. While it uses physics-accurate formulas (IEC 60255/IEEE C37.112), it should not be used as the sole tool for safety-critical settings on live equipment. Always verify with licensed professional software.",
  },
  {
    q: "How does the Digital Twin simulation work?",
    a: "The Digital Twin module uses a real-time topology processor. It analyzes the connectivity of nodes (Breakers, Busbars, Transformers) 60 times per second to calculate load flow, energization status, and fault current propagation based on your switching actions.",
  },
  {
    q: "Can I analyze IEC 61850 GOOSE packets?",
    a: "Yes. The Comms Hub module features a packet generator and inspector. You can simulate GOOSE storms, check VLAN priority tagging, and visualize the impact of network latency on protection clearing times.",
  },
  {
    q: "What is the difference between ANSI and IEC curves?",
    a: "ANSI (IEEE) and IEC standards define different mathematical formulas for Time-Overcurrent protection. IEC curves (Standard, Very, Extremely Inverse) are asymptotic at M=1, whereas ANSI curves have a different slope characteristic. Our TCC Studio allows you to compare both.",
  },
  {
    q: "Does the application work offline?",
    a: "Yes. RelaySchool is a Progressive Web App (PWA) built with offline-first architecture. Once loaded, all calculations, simulations, and interactive graphs run entirely in your browser's local JavaScript engine.",
  },
  {
    q: "Can I export simulation data?",
    a: "Yes. The Event Analyzer allows you to export fault records in a simulated COMTRADE format (CFG/DAT), and the Comms Hub allows PCAP export for Wireshark analysis.",
  },
  {
    q: "Do I need an account?",
    a: "No. RelaySchool uses your browser's Local Storage to persist settings, relay curves, and logic diagrams. No login is required, and your data never leaves your device.",
  },
];

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 text-left flex justify-between items-center group"
      >
        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors text-sm md:text-base pr-4">
          {q}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-blue-500 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-2 border-l-2 border-blue-500 ml-1">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────
// WHO IS THIS FOR — Quick audience cards
// ─────────────────────────────────────────────────────

const AudienceSection = () => {
  const audiences = [
    {
      emoji: "🎓",
      title: "Engineering Students",
      desc: "Build deep intuition for protection concepts before you hit the field. No textbook can replace interactive simulation.",
      color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    },
    {
      emoji: "⚡",
      title: "Working Engineers",
      desc: "Validate relay settings, practice coordination, and prepare for commissioning — all without expensive software licenses.",
      color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    },
    {
      emoji: "📋",
      title: "Consultants & Trainers",
      desc: "Use interactive demos in your presentations. Embed simulations in training programs. Free for commercial use.",
      color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
          Built for Every Power System Professional
        </h2>
        <p className="text-slate-500 mt-2 text-sm">
          Whether you're studying, working, or teaching — RelaySchool adapts to your level
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {audiences.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-2xl border ${a.color} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
          >
            <div className="text-4xl mb-4">{a.emoji}</div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              {a.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {a.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────

const Dashboard = () => {
  return (
    <main className="space-y-16 animate-fade-in max-w-7xl mx-auto pb-12 overflow-hidden">
      <PageSEO
        title="RelaySchool — Free Power System Protection Simulators"
        description="40+ interactive simulators for relay coordination, fault analysis, IEC 61850, and protection engineering. Free, browser-based, works offline."
        url="/"
      />

      {/* 1. HERO */}
      <div className="relative -mx-4 md:-mx-8 lg:-mx-10">
        <div className="px-4 md:px-8 lg:px-10 pb-6">
          <GridPulseHero />
        </div>
      </div>

      {/* 2. TRUST METRICS BAR */}
      <TrustBar />

      {/* 3. WHY ENGINEERS CHOOSE RELAYSCHOOL */}
      <WhySection />

      {/* 4. WHAT YOU'LL MASTER */}
      <WhatYoullMaster />

      {/* 5. FEATURED SIMULATORS */}
      <FeaturedSimulators />

      {/* 6. WHO IS THIS FOR */}
      <AudienceSection />

      {/* 7. UNIQUE OFFERING SECTION */}
      <UniqueOfferingSection />

      {/* 8. MISSION */}
      <MissionSection />

      {/* 9. FAQ */}
      <section className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl w-fit mb-4">
              <HelpCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Technical FAQ
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Common queries about Protection Engineering, Simulation Physics,
              and Platform Capabilities.
            </p>
          </div>
          <div className="md:w-2/3">
            <div className="space-y-2">
              {FAQ_DATA.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
