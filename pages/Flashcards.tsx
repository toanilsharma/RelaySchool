import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, ArrowRight, ArrowLeft, Keyboard, BarChart3, 
  CheckCircle, XCircle, HelpCircle, RotateCcw, Zap, 
  ShieldCheck, Network, Cpu, Lightbulb, BrainCircuit, Target,
  BatteryMedium, Activity
} from 'lucide-react';

// ============================== CURRICULUM DATA ==============================
const CATEGORIES = ['fundamentals', 'protection', 'equipment', 'digital', 'system'];

const CATEGORY_LABELS = {
  fundamentals: { label: 'Fundamentals', icon: Lightbulb, color: 'text-amber-400' },
  protection: { label: 'Protection', icon: ShieldCheck, color: 'text-emerald-400' },
  equipment: { label: 'Primary Equip', icon: BatteryMedium, color: 'text-orange-400' },
  digital: { label: 'Digital Substation', icon: Cpu, color: 'text-blue-400' },
  system: { label: 'System Studies', icon: Network, color: 'text-violet-400' },
};

const FLASHCARD_DECKS = [
  {
    id: 'ansi-codes',
    category: 'fundamentals',
    title: 'ANSI Device Numbers',
    emoji: '🔢',
    cards: [
      { q: 'What is ANSI 50?', a: 'Instantaneous Overcurrent Relay. Operates with no intentional time delay when current exceeds a predetermined value.' },
      { q: 'What is ANSI 51?', a: 'AC Time Overcurrent Relay. Operates with an inverse time delay dependent on the magnitude of the overcurrent.' },
      { q: 'What is ANSI 87?', a: 'Differential Protective Relay. Operates on a percentage or phase angle difference between currents entering and leaving a protected zone.' },
      { q: 'What is ANSI 21?', a: 'Distance Relay. Functions when the circuit admittance, impedance, or reactance increases or decreases beyond predetermined limits.' },
      { q: 'What is ANSI 67?', a: 'AC Directional Overcurrent Relay. Operates on a desired value of AC overcurrent flowing in a predetermined direction.' },
      { q: 'What is ANSI 32?', a: 'Directional Power Relay (Reverse Power). Operates on a predetermined value of power flow in a given direction (often used for generator motoring protection).' }
    ]
  },
  {
    id: 'transformer-prot',
    category: 'protection',
    title: 'Transformer Protection',
    emoji: '⚡',
    cards: [
      { q: 'What causes Magnetizing Inrush Current in a transformer?', a: 'Energizing the transformer causes the core flux to temporarily saturate, leading to a high transient current drawn by the primary winding (rich in 2nd harmonics).' },
      { q: 'How does an 87T relay distinguish between a fault and inrush current?', a: 'By using 2nd Harmonic Restraint. Inrush currents contain a high percentage of 2nd harmonics (typically >15%), whereas internal fault currents do not.' },
      { q: 'What is a Buchholz Relay?', a: 'A gas-actuated mechanical relay installed in the pipe between the main tank and conservator. It detects incipient faults (slow gas buildup) and severe internal faults (oil surges).' },
      { q: 'What is Restricted Earth Fault (REF) protection?', a: 'A high-sensitivity zero-sequence differential scheme (87N) used to detect ground faults near the neutral point of a star-connected transformer winding.' },
      { q: 'Why is 5th Harmonic Restraint sometimes used in 87T?', a: 'To prevent the differential relay from misoperating during transformer overexcitation (V/Hz) conditions, which produce high 5th harmonic currents.' }
    ]
  },
  {
    id: 'line-prot',
    category: 'protection',
    title: 'Line & Distance Protection',
    emoji: '🛤️',
    cards: [
      { q: 'What is the typical reach setting for Distance Zone 1?', a: '80% to 90% of the protected line length. It trips instantaneously (no time delay) because it underreaches the remote bus, guaranteeing the fault is on the line.' },
      { q: 'What is the purpose of Distance Zone 2?', a: 'It overreaches the protected line (typically set to 120%) to provide 100% line coverage and backup protection for the remote bus. It uses a time delay (e.g., 0.3s) to coordinate with adjacent Zone 1 relays.' },
      { q: 'What is a POTT scheme?', a: 'Permissive Overreaching Transfer Trip. A pilot scheme where the relay sends a permissive signal to the remote end if it detects a fault in its overreaching Zone 2. Trip occurs if local Zone 2 sees fault AND permissive signal is received.' },
      { q: 'What is a PUTT scheme?', a: 'Permissive Underreaching Transfer Trip. The relay sends a permissive signal only if the fault is detected in its underreaching Zone 1.' },
      { q: 'How does a Mho characteristic differ from a Quadrilateral characteristic?', a: 'A Mho is circular and inherently directional, passing through the origin. Quadrilateral allows independent setting of resistive (R) and reactive (X) boundaries, offering better fault resistance coverage.' }
    ]
  },
  {
    id: 'motor-gen-prot',
    category: 'protection',
    title: 'Motor & Generator Protection',
    emoji: '🏭',
    cards: [
      { q: 'What does ANSI 46 (Negative Sequence) protect against in rotating machines?', a: 'It protects the rotor from overheating. Unbalanced stator currents create a reverse-rotating magnetic field that induces double-frequency (120Hz) eddy currents in the rotor.' },
      { q: 'What is Loss of Field (ANSI 40) protection?', a: 'Detects failure of the DC excitation system. The generator loses synchronism, acts as an induction generator, and draws massive reactive power (VARs) from the grid, overheating the rotor.' },
      { q: 'What is the purpose of ANSI 49 in motor protection?', a: 'Machine Thermal Relay. It calculates the thermal capacity of the motor based on I²t to protect against prolonged overloads that would degrade winding insulation.' },
      { q: 'How is 100% Stator Ground Fault protection achieved in generators?', a: 'Standard overvoltage relays (59N) only cover ~95% of the winding. 100% coverage requires Third Harmonic Voltage measurement or Sub-harmonic voltage injection.' }
    ]
  },
  {
    id: 'cts-vts',
    category: 'equipment',
    title: 'Instrument Transformers',
    emoji: '🧲',
    cards: [
      { q: 'What happens if a Current Transformer (CT) secondary is open-circuited under load?', a: 'Extremely dangerous high voltages will develop across the open secondary terminals, potentially destroying the insulation and lethal to personnel. CTs must always be shorted before disconnecting a burden.' },
      { q: 'What is CT Saturation?', a: 'When the magnetic flux in the CT core reaches its physical limit (knee point) due to high fault currents or DC offset. The secondary current waveform collapses, causing relays to underreach or delay.' },
      { q: 'What is the Knee Point Voltage (Vk)?', a: 'The point on the CT excitation curve where a 10% increase in secondary voltage requires a 50% increase in exciting current. It defines the CT\'s linear operating region.' },
      { q: 'What is a CVT and why is it used?', a: 'Capacitive Voltage Transformer. Uses a capacitor divider before a magnetic transformer. It is cheaper than pure magnetic VTs at Extra High Voltages (EHV) and can be used for Power Line Carrier Communication (PLCC).' }
    ]
  },
  {
    id: 'iec-61850-basics',
    category: 'digital',
    title: 'IEC 61850 Fundamentals',
    emoji: '🌐',
    cards: [
      { q: 'What is a GOOSE message?', a: 'Generic Object Oriented Substation Event. A high-speed, multicast, Layer-2 Ethernet protocol used for critical events like tripping and interlocking (< 3ms transmission).' },
      { q: 'What is an SV (Sampled Value)?', a: 'A protocol used to transmit digitized instantaneous waveforms of voltage and current from Merging Units to IEDs over the process bus.' },
      { q: 'What is MMS?', a: 'Manufacturing Message Specification. A client-server protocol used for non-time-critical communication, such as sending reports, events, and measurements to the SCADA system.' },
      { q: 'Name the main SCL (Substation Configuration Language) file types.', a: 'ICD (IED Capability Description), SCD (Substation Configuration Description), CID (Configured IED Description).' }
    ]
  },
  {
    id: 'iec-61850-adv',
    category: 'digital',
    title: 'Advanced Digital Substation',
    emoji: '📡',
    cards: [
      { q: 'What is PTP (IEEE 1588)?', a: 'Precision Time Protocol. A hardware-assisted timing protocol over Ethernet that provides microsecond-level synchronization, essential for aligning Sampled Values (SV).' },
      { q: 'Compare PRP and HSR network redundancy.', a: 'Both provide zero-recovery-time redundancy. PRP (Parallel Redundancy Protocol) uses two completely separate LANs. HSR (High-availability Seamless Redundancy) uses a ring topology where nodes pass frames in both directions.' },
      { q: 'What is a Merging Unit (MU)?', a: 'A device physically located in the switchyard that digitizes analog signals from CTs/VTs and binary statuses from breakers, transmitting them to relays via SV and GOOSE.' }
    ]
  },
  {
    id: 'symmetrical-comp',
    category: 'system',
    title: 'Symmetrical Components',
    emoji: '📐',
    cards: [
      { q: 'What are Positive Sequence components?', a: 'A balanced three-phase set of phasors that are equal in magnitude, 120° apart, and have the same phase sequence as the original power system (A-B-C).' },
      { q: 'What are Zero Sequence components?', a: 'A set of three phasors equal in magnitude and with zero phase displacement from each other. They only exist during ground faults or severe unbalances.' },
      { q: 'What is the formula for Zero Sequence Current (I₀)?', a: 'I₀ = 1/3 (Ia + Ib + Ic). Note that the total residual current (3I₀) flowing in the neutral is equal to the sum of the three phase currents.' },
      { q: 'How are sequence networks connected for a Single Line-to-Ground (SLG) fault?', a: 'The Positive, Negative, and Zero sequence networks are connected in SERIES.' }
    ]
  },
  {
    id: 'fault-analysis',
    category: 'system',
    title: 'Fault Analysis',
    emoji: '💥',
    cards: [
      { q: 'Which fault type is the most common in power systems?', a: 'Single Line-to-Ground (SLG) faults. They account for roughly 70-80% of all transmission line faults, usually caused by lightning or tree contact.' },
      { q: 'How are sequence networks connected for a Line-to-Line (LL) fault?', a: 'The Positive and Negative sequence networks are connected in PARALLEL. The Zero sequence network is isolated (I₀ = 0).' },
      { q: 'What dictates the magnitude of a ground fault current in a power system?', a: 'The system grounding method (neutral grounding). Solid grounding allows massive fault currents, while high-resistance grounding limits current to a few amps.' },
      { q: 'What is the X/R ratio of a fault?', a: 'The ratio of system reactance to resistance up to the fault point. A high X/R ratio produces a slowly decaying DC offset in the fault current, stressing circuit breakers.' }
    ]
  }
];

const TOTAL_CARDS = FLASHCARD_DECKS.reduce((acc, deck) => acc + deck.cards.length, 0);

// ============================== LOGIC & STATE ==============================
const CONFIDENCE_CONFIG = {
  unknown: { label: 'Not Rated', color: 'text-slate-500', bg: 'bg-slate-800', border: 'border-slate-700' },
  hard: { label: 'Hard', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/50' },
  okay: { label: 'Okay', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/50' },
  easy: { label: 'Easy', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50' },
};

const STORAGE_KEY = 'flashcard-mastery-data';

function loadConfidence() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

export default function FlashcardApp() {
  // Navigation State
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDeck, setActiveDeck] = useState(FLASHCARD_DECKS[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState(1);
  
  // UI State
  const [showStats, setShowStats] = useState(false);
  const [confidence, setConfidence] = useState(loadConfidence);

  // Persistence
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(confidence)); } catch {}
  }, [confidence]);

  // Derived Data
  const filteredDecks = useMemo(() => {
    if (activeCategory === 'all') return FLASHCARD_DECKS;
    return FLASHCARD_DECKS.filter(d => d.category === activeCategory);
  }, [activeCategory]);

  const cardKey = `${activeDeck.id}-${currentIndex}`;
  const currentConfidence = confidence[cardKey] || 'unknown';

  // Actions
  const navigateCard = useCallback((direction) => {
    setIsFlipped(false);
    setSlideDirection(direction);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        let next = prev + direction;
        if (next >= activeDeck.cards.length) next = 0;
        if (next < 0) next = activeDeck.cards.length - 1;
        return next;
      });
    }, 150);
  }, [activeDeck.cards.length]);

  const selectDeck = (deck) => {
    if (activeDeck.id === deck.id) return;
    setIsFlipped(false);
    setSlideDirection(1);
    setTimeout(() => {
      setActiveDeck(deck);
      setCurrentIndex(0);
    }, 150);
  };

  const rateCard = (rating) => {
    setConfidence(prev => ({ ...prev, [cardKey]: rating }));
    setTimeout(() => navigateCard(1), 400);
  };

  const resetProgress = () => {
    if (window.confirm('Reset all your learning progress and ratings?')) {
      setConfidence({});
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); navigateCard(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); navigateCard(-1); }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setIsFlipped(f => !f); }
      else if (e.key === 'Escape') { setIsFlipped(false); }
      else if (e.key === '1') { rateCard('hard'); }
      else if (e.key === '2') { rateCard('okay'); }
      else if (e.key === '3') { rateCard('easy'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateCard]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const deckCards = activeDeck.cards.map((_, i) => `${activeDeck.id}-${i}`);
    const hard = deckCards.filter(k => confidence[k] === 'hard').length;
    const okay = deckCards.filter(k => confidence[k] === 'okay').length;
    const easy = deckCards.filter(k => confidence[k] === 'easy').length;
    const rated = hard + okay + easy;
    return { total: activeDeck.cards.length, rated, hard, okay, easy, pct: Math.round((rated / activeDeck.cards.length) * 100) || 0 };
  }, [activeDeck, confidence]);

  const globalStats = useMemo(() => {
    const allKeys = FLASHCARD_DECKS.flatMap(d => d.cards.map((_, i) => `${d.id}-${i}`));
    const rated = allKeys.filter(k => confidence[k] && confidence[k] !== 'unknown').length;
    return { total: TOTAL_CARDS, rated, pct: Math.round((rated / TOTAL_CARDS) * 100) || 0 };
  }, [confidence]);

  // Helper for deck progression in the carousel
  const getDeckProgress = (deck) => {
    const deckKeys = deck.cards.map((_, i) => `${deck.id}-${i}`);
    const rated = deckKeys.filter(k => confidence[k] && confidence[k] !== 'unknown').length;
    return { rated, total: deck.cards.length, pct: Math.round((rated / deck.cards.length) * 100) };
  };

  // Animation Variants
  const cardVariants = {
    enter: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
    center: { zIndex: 1, x: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0, scale: 0.95, transition: { duration: 0.2 } })
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col items-center selection:bg-indigo-500/30">
      
      {/* HEADER */}
      <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between shadow-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Flash<span className="text-indigo-400">Master</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
              {globalStats.pct}% Curriculum Mastery ({globalStats.rated}/{globalStats.total} Cards)
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setShowStats(!showStats)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${showStats ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
            <BarChart3 className="w-4 h-4" /> <span className="hidden md:inline">Dashboard</span>
          </button>
          <button onClick={resetProgress} className="p-2.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all hover:text-white" title="Reset Progress">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl px-4 py-8 flex flex-col flex-1">
        
        {/* STATS DASHBOARD */}
        <AnimatePresence>
          {showStats && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }} 
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" /> Deck Mastery Analytics
                  </h3>
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold">
                    {activeDeck.title}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 text-center">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-3xl font-black text-indigo-400 mb-1">{stats.pct}%</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Completion</div>
                  </div>
                  <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-900/50">
                    <div className="text-3xl font-black text-emerald-400 mb-1">{stats.easy}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Mastered (Easy)</div>
                  </div>
                  <div className="bg-amber-950/30 p-4 rounded-xl border border-amber-900/50">
                    <div className="text-3xl font-black text-amber-400 mb-1">{stats.okay}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Learning (Okay)</div>
                  </div>
                  <div className="bg-rose-950/30 p-4 rounded-xl border border-rose-900/50">
                    <div className="text-3xl font-black text-rose-400 mb-1">{stats.hard}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-rose-500/70">Struggling (Hard)</div>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  {stats.easy > 0 && <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${(stats.easy / stats.total) * 100}%` }} />}
                  {stats.okay > 0 && <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${(stats.okay / stats.total) * 100}%` }} />}
                  {stats.hard > 0 && <div className="h-full bg-rose-500 shadow-[0_0_10px_rgba(243,64,64,0.5)]" style={{ width: `${(stats.hard / stats.total) * 100}%` }} />}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NAVIGATION PILLS */}
        <div className="space-y-4 mb-8">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              All Library
            </button>
            {CATEGORIES.map(cat => {
              const info = CATEGORY_LABELS[cat];
              const CatIcon = info.icon;
              return (
                <button
                  key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 border ${activeCategory === cat ? `bg-slate-800 ${info.color} border-slate-700 shadow-lg` : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300'}`}
                >
                  <CatIcon className="w-3.5 h-3.5" /> {info.label}
                </button>
              );
            })}
          </div>

          {/* Decks Carousel */}
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x">
            {filteredDecks.map(deck => {
              const prog = getDeckProgress(deck);
              const isActive = activeDeck.id === deck.id;
              const isCompleted = prog.pct === 100;
              
              return (
                <button
                  key={deck.id} onClick={() => selectDeck(deck)}
                  className={`snap-start relative px-5 py-4 rounded-2xl font-bold text-sm whitespace-nowrap transition-all flex flex-col items-start gap-2 border min-w-[200px] ${isActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-600'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-2xl">{deck.emoji}</span>
                    {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <span className="truncate w-full text-left">{deck.title}</span>
                  
                  <div className="w-full flex items-center justify-between mt-1">
                    <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden mr-3">
                      <div className={`h-full ${isActive ? 'bg-white' : 'bg-indigo-500'} rounded-full`} style={{ width: `${prog.pct}%` }} />
                    </div>
                    <span className={`text-[10px] font-mono opacity-80`}>
                      {prog.rated}/{prog.total}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STUDY AREA */}
        <div className="flex flex-col items-center flex-1 w-full max-w-4xl mx-auto">
          
          {/* Card Header Info */}
          <div className="w-full flex justify-between items-center mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded-md text-slate-300 border border-slate-700">Card {currentIndex + 1} of {activeDeck.cards.length}</span>
            </span>
            <span className={`px-3 py-1 rounded-full border flex items-center gap-1.5 ${CONFIDENCE_CONFIG[currentConfidence].bg} ${CONFIDENCE_CONFIG[currentConfidence].color} ${CONFIDENCE_CONFIG[currentConfidence].border}`}>
              Status: {CONFIDENCE_CONFIG[currentConfidence].label}
            </span>
          </div>

          {/* THE FLASHCARD */}
          <div className="relative w-full aspect-[4/3] md:aspect-[2/1] perspective-1000 mb-10">
            <AnimatePresence initial={false} custom={slideDirection} mode="wait">
              <motion.div
                key={currentIndex}
                custom={slideDirection}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  className="w-full h-full relative preserve-3d"
                  animate={{ rotateY: isFlipped ? 180 : 0, scale: isFlipped ? 1.02 : 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                >
                  {/* FRONT */}
                  <div className="absolute inset-0 backface-hidden bg-slate-900 border border-slate-700 rounded-[2rem] p-8 md:p-12 flex flex-col justify-center items-center shadow-2xl group-hover:border-indigo-500/50 transition-colors text-center">
                    <div className="absolute top-6 left-6 text-6xl opacity-5 font-serif text-white pointer-events-none">Q.</div>
                    <div className="absolute top-6 right-6 text-2xl opacity-20 pointer-events-none">{activeDeck.emoji}</div>
                    
                    <h2 className="text-2xl md:text-4xl font-black text-slate-100 leading-tight">
                      {activeDeck.cards[currentIndex].q}
                    </h2>
                    
                    <div className="absolute bottom-6 font-bold text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2 animate-pulse">
                      <Zap className="w-3 h-3 text-indigo-400" /> Tap or Space to Reveal
                    </div>
                  </div>

                  {/* BACK */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-violet-800 border border-indigo-400 rounded-[2rem] p-8 md:p-12 flex flex-col justify-center items-center shadow-[0_0_50px_rgba(99,102,241,0.2)] text-center"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div className="absolute top-6 right-6 text-6xl opacity-10 font-serif text-white pointer-events-none">A.</div>
                    <p className="text-xl md:text-3xl font-bold text-white leading-relaxed text-shadow-sm">
                      {activeDeck.cards[currentIndex].a}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CONTROLS */}
          <div className="w-full max-w-2xl flex flex-col items-center gap-6">
            
            {/* Rating Buttons */}
            <div className={`flex gap-3 w-full transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <button onClick={() => rateCard('hard')} className="flex-1 py-4 bg-slate-900 border border-rose-500/30 hover:bg-rose-500/10 rounded-2xl flex flex-col items-center gap-1 transition-all group">
                <span className="text-2xl group-hover:scale-125 transition-transform">🤯</span>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Hard (1)</span>
              </button>
              <button onClick={() => rateCard('okay')} className="flex-1 py-4 bg-slate-900 border border-amber-500/30 hover:bg-amber-500/10 rounded-2xl flex flex-col items-center gap-1 transition-all group">
                <span className="text-2xl group-hover:scale-125 transition-transform">🤔</span>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Okay (2)</span>
              </button>
              <button onClick={() => rateCard('easy')} className="flex-1 py-4 bg-slate-900 border border-emerald-500/30 hover:bg-emerald-500/10 rounded-2xl flex flex-col items-center gap-1 transition-all group">
                <span className="text-2xl group-hover:scale-125 transition-transform">😎</span>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Easy (3)</span>
              </button>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-8">
              <button onClick={() => navigateCard(-1)} className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-all shadow-lg hover:scale-110 active:scale-95" aria-label="Previous card">
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 hidden md:flex items-center">
                <Keyboard className="w-4 h-4 mr-1" /> Use keyboard to navigate
              </div>

              <button onClick={() => navigateCard(1)} className="p-4 rounded-full bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-110 active:scale-95" aria-label="Next card">
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Global CSS to fix backface visibility rendering bugs in some browsers */}
      <style dangerouslySetInnerHTML={{__html: `
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .perspective-1000 { perspective: 1000px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}