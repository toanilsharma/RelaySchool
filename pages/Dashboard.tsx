import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity, BookOpen, Cpu, Scale, Radar, Play, ShieldCheck,
  Microscope, ChevronDown, ChevronUp, Server, Wifi, Power, Waves,
  Globe, Eye, ArrowRight, HelpCircle, Network, Target, Sparkles,
  FlaskConical, CheckCircle2, Zap, GraduationCap, Users, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSEO } from "../components/SEO/PageSEO";

// ─────────────────────────────────────────────────────
// HERO — Mobile-first, clean, no overflow tricks
// ─────────────────────────────────────────────────────
const HeroSection = () => {
  const [breakerClosed, setBreakerClosed] = useState(true);
  const [freq, setFreq] = useState(50.0);

  useEffect(() => {
    const i = setInterval(() => {
      setFreq(50 + (Math.random() - 0.5) * (breakerClosed ? 0.03 : 0.45));
    }, 1200);
    return () => clearInterval(i);
  }, [breakerClosed]);

  const deviation = Math.abs(freq - 50);

  return (
    <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-40 bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-9 lg:p-14">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          100% Free · No Login Required
        </div>

        {/* Headline */}
        <h1 className="text-[1.85rem] sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white mb-4">
          Master Power Systems
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Through Simulation
          </span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mb-5">
          See fault currents, relay curves, and GOOSE packets come alive in real-time.{" "}
          <strong className="text-white">40+ physics-accurate simulators</strong> running
          directly in your browser — no installs, no fees.
        </p>

        {/* Trust checkmarks */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
          {["IEEE & IEC aligned", "Works offline (PWA)", "Used worldwide"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {t}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link
            to="/academy"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 group"
          >
            <Play className="w-4 h-4 shrink-0" />
            Launch Simulation Lab
            <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/tcc"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-bold text-sm transition-all"
          >
            <Activity className="w-4 h-4 text-blue-400 shrink-0" />
            Open TCC Studio
          </Link>
        </div>

        {/* Live Demo Widget — compact, no overflow */}
        <div className="bg-slate-950/80 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setBreakerClosed(!breakerClosed)}
              className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all active:scale-90 shadow-lg ${
                breakerClosed ? "bg-red-500 border-red-600" : "bg-emerald-500 border-emerald-600"
              }`}
              aria-label="Toggle circuit breaker"
            >
              <Power className="w-4 h-4 text-white" />
            </button>
            <div className="min-w-0">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Interactive Demo — Tap breaker</div>
              <div className={`text-xs font-bold uppercase truncate ${breakerClosed ? "text-red-400" : "text-emerald-400"}`}>
                CB-101 {breakerClosed ? "CLOSED (LIVE)" : "OPEN (TRIPPED)"}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
              <Wifi className={`w-3 h-3 ${breakerClosed ? "text-emerald-500 animate-pulse" : "text-slate-600"}`} />
              <span className={`text-[10px] font-mono font-bold ${breakerClosed ? "text-emerald-500" : "text-slate-500"}`}>
                {breakerClosed ? "SYNCED" : "OFFLINE"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 bg-slate-900/70 rounded-xl p-3 flex items-end justify-between gap-2">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Grid Freq</div>
                <div className="font-mono text-2xl font-black text-white leading-none mt-1">{freq.toFixed(3)}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">Hz</div>
              </div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 ${
                deviation < 0.05
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {deviation < 0.05 ? "NORMAL" : "DEVIATED"}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex-1 bg-slate-900/70 rounded-xl p-2 text-center">
                <div className="text-[9px] text-slate-500 font-bold uppercase">PTP</div>
                <div className="text-xs font-mono text-blue-400 font-bold mt-0.5">0.002ms</div>
              </div>
              <div className="flex-1 bg-slate-900/70 rounded-xl p-2 text-center">
                <div className="text-[9px] text-slate-500 font-bold uppercase">GOOSE</div>
                <div className="text-xs font-mono text-purple-400 font-bold mt-0.5">3.4ms</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────
// STATS — 2x2 on mobile, 4-col on sm+
// ─────────────────────────────────────────────────────
const STATS = [
  { value: "40+", label: "Simulators", icon: Cpu },
  { value: "IEEE & IEC", label: "Aligned", icon: ShieldCheck },
  { value: "100%", label: "Free Forever", icon: Star },
  { value: "PWA", label: "Works Offline", icon: Wifi },
];

const StatsBar = () => (
  <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {STATS.map((s) => (
      <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center gap-2 shadow-sm hover:shadow-md transition-shadow">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <s.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{s.value}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
        </div>
      </div>
    ))}
  </section>
);

// ─────────────────────────────────────────────────────
// WHY SECTION — 1-col → 2-col
// ─────────────────────────────────────────────────────
const WHY_CARDS = [
  { icon: FlaskConical, title: "Unlimited Experiments", desc: "Inject faults, miscoordinate relays, observe consequences — zero real-world risk.", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200/60 dark:border-emerald-800/30" },
  { icon: Target, title: "Learn by Doing", desc: "Tweak settings, shift curves, watch phasors rotate. Complex math becomes intuitive.", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200/60 dark:border-blue-800/30" },
  { icon: Sparkles, title: "Curiosity Driven", desc: "Ask 'What if I change this?' and immediately see the system's exact response.", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200/60 dark:border-amber-800/30" },
  { icon: Globe, title: "Learn Anywhere", desc: "Browser PWA — runs offline once loaded. Study in the field, lab, or classroom.", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200/60 dark:border-purple-800/30" },
];

const WhySection = () => (
  <section className="space-y-5">
    <div className="text-center">
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Where Theory Meets Reality</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-xl mx-auto">
        An interactive environment where equations become intuitive through direct manipulation.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {WHY_CARDS.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className={`relative p-5 rounded-2xl border ${card.border} ${card.bg} group hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}
        >
          <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3 border ${card.border} group-hover:scale-110 transition-transform`}>
            <card.icon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1">{card.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// THREE PILLARS — 1-col → 3-col
// ─────────────────────────────────────────────────────
const PILLARS = [
  { title: "Protection Coordination", subtitle: "Selectivity · Grading · Speed", icon: Scale, color: "blue", desc: "Grade relays, set pickup thresholds, ensure only the nearest breaker trips during a fault.", tools: "TCC Studio · Relay Tester · Distance Lab", link: "/tcc" },
  { title: "Digital Substations", subtitle: "GOOSE · Sampled Values · PTP", icon: Network, color: "purple", desc: "Explore IEC 61850 GOOSE messaging, Sampled Values, and real-time topology modeling.", tools: "Comms Hub · Digital Twin · Events", link: "/comms" },
  { title: "Fault Analysis & Forensics", subtitle: "CT Saturation · Harmonics · DC Offset", icon: Microscope, color: "red", desc: "Reconstruct failures, analyze CT Saturation, study harmonic distortion in waveforms.", tools: "Forensic Lab · Failure Lab · Toolkit", link: "/forensic" },
];

const PILLAR_COLORS: Record<string, { grad: string; iconBg: string; text: string; border: string; bar: string }> = {
  blue:   { grad: "from-blue-50 dark:from-blue-950/40",   iconBg: "bg-blue-100 dark:bg-blue-900/40",   text: "text-blue-600 dark:text-blue-400",   border: "border-blue-200/50 dark:border-blue-800/30",   bar: "from-blue-500 to-indigo-500"   },
  purple: { grad: "from-purple-50 dark:from-purple-950/40", iconBg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200/50 dark:border-purple-800/30", bar: "from-purple-500 to-violet-500" },
  red:    { grad: "from-red-50 dark:from-red-950/40",     iconBg: "bg-red-100 dark:bg-red-900/40",     text: "text-red-600 dark:text-red-400",     border: "border-red-200/50 dark:border-red-800/30",     bar: "from-red-500 to-orange-500"    },
};

const PillarsSection = () => (
  <section className="space-y-5">
    <div className="text-center">
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">What You'll Master</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Three pillars of modern protection engineering — all in your browser</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PILLARS.map((p) => {
        const c = PILLAR_COLORS[p.color];
        return (
          <Link to={p.link} key={p.title} className="group block">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              className={`bg-gradient-to-br ${c.grad} to-transparent rounded-2xl border ${c.border} p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden`}
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.bar}`} />
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 ${c.iconBg} rounded-xl shadow-sm shrink-0`}>
                  <p.icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{p.title}</h3>
                  <div className={`text-[10px] ${c.text} font-bold uppercase tracking-wider mt-0.5`}>{p.subtitle}</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">{p.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 min-w-0">
                  <Activity className="w-3 h-3 shrink-0" />
                  <span className="truncate">{p.tools}</span>
                </div>
                <ArrowRight className={`w-4 h-4 ${c.text} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 ml-2`} />
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// FEATURED SIMULATORS — 1 → 2 → 3 col
// ─────────────────────────────────────────────────────
const FEATURED = [
  { title: "TCC Studio", icon: Activity, link: "/tcc", desc: "Plot IEC/IEEE time-overcurrent curves and verify relay coordination visually.", standard: "IEEE C37.112", accent: "bg-blue-600" },
  { title: "Digital Twin", icon: Server, link: "/twin", desc: "Operate a real-time substation topology — toggle breakers, observe power flow.", standard: "IEC 61850", accent: "bg-teal-600" },
  { title: "Distance Lab", icon: Radar, link: "/distance", desc: "Visualize impedance zones on the R-X plane. Study load encroachment effects.", standard: "IEEE C37.113", accent: "bg-emerald-600" },
  { title: "Comms Hub", icon: Network, link: "/comms", desc: "Inspect GOOSE and Sampled Values packets. Simulate network storms.", standard: "IEC 61850-9-2", accent: "bg-purple-600" },
  { title: "Forensic Lab", icon: Microscope, link: "/forensic", desc: "Analyze COMTRADE fault records with multi-channel oscillography.", standard: "IEEE C37.111", accent: "bg-red-600" },
  { title: "Phasor Lab", icon: Waves, link: "/vectors", desc: "Interactive phasor diagrams with symmetrical components visualization.", standard: "IEC 60044", accent: "bg-indigo-600" },
];

const FeaturedSimulators = () => (
  <section className="space-y-5">
    <div className="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Featured Simulators</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Our most popular labs — built around real engineering workflows</p>
      </div>
      <Link to="/academy" className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline flex items-center gap-1 shrink-0">
        View All 40+ <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {FEATURED.map((item, i) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
        >
          <Link to={item.link} className="group block h-full">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <item.icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                  {item.standard}
                </div>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1 mb-4">{item.desc}</p>
              <div className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl ${item.accent} text-white text-xs font-bold shadow-sm`}>
                <span>Open Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// AUDIENCE — 1 → 3 col
// ─────────────────────────────────────────────────────
const AUDIENCES = [
  { emoji: "🎓", title: "Engineering Students", desc: "Build deep intuition for protection concepts before you hit the field. No textbook can replace live simulation.", color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-800/30" },
  { emoji: "⚡", title: "Working Engineers", desc: "Validate relay settings, practice coordination, and prepare for commissioning — no expensive software.", color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-800/30" },
  { emoji: "📋", title: "Trainers & Consultants", desc: "Use live demos in your presentations. Embed simulations in training programs. Free for commercial use.", color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/30" },
];

const AudienceSection = () => (
  <section className="space-y-5">
    <div className="text-center">
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Built for Every Power Professional</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Whether studying, working, or teaching — RelaySchool adapts to your level</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {AUDIENCES.map((a, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
          className={`p-5 rounded-2xl border ${a.color} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
          <div className="text-3xl mb-3">{a.emoji}</div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1.5">{a.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{a.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// MISSION CTA
// ─────────────────────────────────────────────────────
const MissionCTA = () => (
  <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
    <div className="absolute inset-0 opacity-20">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#ctaGrad)" />
        <defs>
          <linearGradient id="ctaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#3b82f6" }} />
            <stop offset="100%" style={{ stopColor: "#8b5cf6" }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div className="relative z-10 p-6 sm:p-12 lg:p-16 text-center max-w-2xl mx-auto space-y-5">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest">
        Our Mission
      </div>
      <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
        Democratizing{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Power Engineering</span>
      </h2>
      <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
        Professional simulation software costs thousands and requires hardware keys. RelaySchool combines{" "}
        <strong className="text-white">gaming-grade visuals</strong> with{" "}
        <strong className="text-white">IEEE-standard math</strong> — accessible to everyone, everywhere.
      </p>
      <div className="flex flex-wrap justify-center gap-2.5 pt-1">
        {[{ icon: Eye, label: "Visual Learning" }, { icon: Cpu, label: "Physics Engine" }, { icon: Wifi, label: "Offline First" }, { icon: Globe, label: "Browser Native" }].map((p) => (
          <div key={p.label} className="flex items-center gap-2 bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700 text-sm text-white font-semibold">
            <p.icon className="w-4 h-4 text-blue-400 shrink-0" />
            {p.label}
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link to="/academy" className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all">
          <GraduationCap className="w-4 h-4" /> Start Learning Free
        </Link>
        <Link to="/about" className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-bold text-sm transition-all">
          <Users className="w-4 h-4" /> About RelaySchool
        </Link>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────
const FAQ_DATA = [
  { q: "What is RelaySchool?", a: "RelaySchool is an advanced, browser-based simulation suite for Power System Protection engineering. Interactive labs for TCC coordination, IEC 61850 protocol analysis, and forensic fault reconstruction — all free, no login required." },
  { q: "Is it suitable for professional coordination studies?", a: "RelaySchool is an educational platform for training and concept verification. While it uses physics-accurate formulas (IEC 60255/IEEE C37.112), always verify safety-critical settings with licensed professional software." },
  { q: "How does the Digital Twin simulation work?", a: "The Digital Twin uses a real-time topology processor analyzing node connectivity 60 times per second to calculate load flow, energization status, and fault current propagation based on your switching actions." },
  { q: "Can I analyze IEC 61850 GOOSE packets?", a: "Yes. The Comms Hub features a packet generator and inspector. Simulate GOOSE storms, check VLAN priority tagging, and visualize the impact of network latency on protection clearing times." },
  { q: "Does the application work offline?", a: "Yes. RelaySchool is a Progressive Web App (PWA). Once loaded, all calculations, simulations, and interactive graphs run entirely in your browser without any internet connection." },
  { q: "Do I need an account to use it?", a: "No. RelaySchool uses your browser's Local Storage to persist settings, relay curves, and progress. No login is required — your data never leaves your device." },
];

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full py-4 text-left flex justify-between items-start gap-4 group">
        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm leading-snug pr-2">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-3 border-l-2 border-blue-500 ml-1">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = () => (
  <section className="space-y-5">
    <div className="text-center">
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
      <p className="text-slate-500 mt-2 text-sm">Common questions about the platform, physics, and capabilities</p>
    </div>
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {FAQ_DATA.map((item, i) => (
        <div key={i} className="px-5">
          <FAQItem q={item.q} a={item.a} />
        </div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────
const Dashboard = () => (
  <main className="space-y-10 sm:space-y-14 animate-fade-in max-w-6xl mx-auto pb-10">
    <PageSEO
      title="RelaySchool — Free Power System Protection Simulators"
      description="40+ interactive simulators for relay coordination, fault analysis, IEC 61850, and protection engineering. Free, browser-based, works offline."
      url="/"
      schema={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "RelaySchool — Power System Engineering Simulator",
        url: "https://relayschool.co.in",
        description: "The premier educational platform to master Power System Engineering through interactive, real-time browser simulations.",
      }}
    />
    <HeroSection />
    <StatsBar />
    <WhySection />
    <PillarsSection />
    <FeaturedSimulators />
    <AudienceSection />
    <MissionCTA />
    <FAQSection />
  </main>
);

export default Dashboard;
