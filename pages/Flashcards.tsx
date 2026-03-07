import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, ArrowLeft, Keyboard, BarChart3, CheckCircle, XCircle, HelpCircle, RotateCcw, Filter, Zap } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from "../components/SEO";
import { FLASHCARD_DECKS, TOTAL_CARDS, CATEGORIES, type FlashDeck } from '../data/flashcardDecks';

// Confidence levels for spaced-repetition tracking
type Confidence = 'unknown' | 'hard' | 'okay' | 'easy';

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; color: string; icon: React.ReactNode }> = {
    unknown: { label: 'Not Rated', color: 'text-slate-400', icon: <HelpCircle className="w-4 h-4" /> },
    hard: { label: 'Hard', color: 'text-red-500', icon: <XCircle className="w-4 h-4" /> },
    okay: { label: 'Okay', color: 'text-amber-500', icon: <HelpCircle className="w-4 h-4" /> },
    easy: { label: 'Easy', color: 'text-emerald-500', icon: <CheckCircle className="w-4 h-4" /> },
};

const CATEGORY_LABELS: Record<string, string> = {
    protection: '🛡️ Protection',
    system: '⚡ System Studies',
    digital: '🌐 Digital',
    fundamentals: '📚 Fundamentals',
};

// Persist confidence ratings in localStorage
const STORAGE_KEY = 'rs-flashcard-confidence';

function loadConfidence(): Record<string, Confidence> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
}

function saveConfidence(data: Record<string, Confidence>) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export default function Flashcards() {
    const isDark = useThemeObserver();

    // Category filter
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Filtered decks
    const filteredDecks = useMemo(() => {
        if (activeCategory === 'all') return FLASHCARD_DECKS;
        return FLASHCARD_DECKS.filter(d => d.category === activeCategory);
    }, [activeCategory]);

    // Active deck & card
    const [activeDeck, setActiveDeck] = useState<FlashDeck>(FLASHCARD_DECKS[0]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Confidence tracking
    const [confidence, setConfidence] = useState<Record<string, Confidence>>(loadConfidence);

    // Persist confidence on change
    useEffect(() => { saveConfidence(confidence); }, [confidence]);

    const cardKey = `${activeDeck.id}-${currentIndex}`;

    const nextCard = useCallback(() => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % activeDeck.cards.length);
        }, 200);
    }, [activeDeck]);

    const prevCard = useCallback(() => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + activeDeck.cards.length) % activeDeck.cards.length);
        }, 200);
    }, [activeDeck]);

    const selectDeck = (deck: FlashDeck) => {
        setActiveDeck(deck);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const rateCard = (rating: Confidence) => {
        setConfidence(prev => ({ ...prev, [cardKey]: rating }));
        // Auto-advance after rating
        setTimeout(() => nextCard(), 300);
    };

    const resetProgress = () => {
        if (window.confirm('Reset all flashcard confidence ratings?')) {
            setConfidence({});
        }
    };

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextCard(); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevCard(); }
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setIsFlipped(f => !f); }
        else if (e.key === 'Escape') { setIsFlipped(false); }
        else if (e.key === '1') { rateCard('hard'); }
        else if (e.key === '2') { rateCard('okay'); }
        else if (e.key === '3') { rateCard('easy'); }
    }, [activeDeck, nextCard, prevCard]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Stats calculation
    const stats = useMemo(() => {
        const deckCards = activeDeck.cards.map((_, i) => `${activeDeck.id}-${i}`);
        const rated = deckCards.filter(k => confidence[k] && confidence[k] !== 'unknown');
        const hard = deckCards.filter(k => confidence[k] === 'hard').length;
        const okay = deckCards.filter(k => confidence[k] === 'okay').length;
        const easy = deckCards.filter(k => confidence[k] === 'easy').length;
        return { total: activeDeck.cards.length, rated: rated.length, hard, okay, easy };
    }, [activeDeck, confidence]);

    // Global stats
    const globalStats = useMemo(() => {
        const allKeys = FLASHCARD_DECKS.flatMap((d) => d.cards.map((_, i) => `${d.id}-${i}`));
        const rated = allKeys.filter(k => confidence[k] && confidence[k] !== 'unknown').length;
        return { total: TOTAL_CARDS, rated, pct: Math.round((rated / TOTAL_CARDS) * 100) };
    }, [confidence]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans flex flex-col items-center">
            <SEO title="Flashcards" description="128+ interactive flashcards covering power system protection, IEC 61850, Indian standards. Free spaced-repetition revision for electrical engineers." url="/flashcards" />

            {/* Header */}
            <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="bg-blue-600 text-white p-2 rounded-lg mr-4 shadow-sm">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Flashcard Mastery</h1>
                        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
                            {FLASHCARD_DECKS.length} Decks • {TOTAL_CARDS} Cards • {globalStats.pct}% Reviewed
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className={`p-2 rounded-lg transition-colors ${showStats ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        aria-label="Toggle statistics"
                    >
                        <BarChart3 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={resetProgress}
                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Reset progress"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="w-full max-w-5xl px-4 py-6">

                {/* Category Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeCategory === 'all'
                            ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        All ({FLASHCARD_DECKS.length})
                    </button>
                    {CATEGORIES.map(cat => {
                        const count = FLASHCARD_DECKS.filter(d => d.category === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                {CATEGORY_LABELS[cat] || cat} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Deck Selector */}
                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                    {filteredDecks.map(deck => (
                        <button
                            key={deck.id}
                            onClick={() => selectDeck(deck)}
                            className={`px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${activeDeck.id === deck.id
                                ? 'bg-blue-600 text-white border-transparent ring-2 ring-blue-400/30'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <span>{deck.emoji}</span>
                            <span>{deck.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeDeck.id === deck.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                {deck.cards.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Stats Panel */}
                {showStats && (
                    <div className={`mb-6 p-5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Deck Progress: {activeDeck.title}
                        </h3>
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-black text-blue-500">{stats.rated}/{stats.total}</div>
                                <div className="text-[10px] font-bold uppercase text-slate-500">Reviewed</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-red-500">{stats.hard}</div>
                                <div className="text-[10px] font-bold uppercase text-slate-500">Hard</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-amber-500">{stats.okay}</div>
                                <div className="text-[10px] font-bold uppercase text-slate-500">Okay</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-emerald-500">{stats.easy}</div>
                                <div className="text-[10px] font-bold uppercase text-slate-500">Easy</div>
                            </div>
                        </div>
                        {/* Stacked progress bar */}
                        <div className="mt-3 w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            {stats.hard > 0 && <div className="h-full bg-red-500" style={{ width: `${(stats.hard / stats.total) * 100}%` }} />}
                            {stats.okay > 0 && <div className="h-full bg-amber-500" style={{ width: `${(stats.okay / stats.total) * 100}%` }} />}
                            {stats.easy > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(stats.easy / stats.total) * 100}%` }} />}
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="w-full max-w-3xl mx-auto my-4">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
                        <span>Card {currentIndex + 1} of {activeDeck.cards.length}</span>
                        <span className="flex items-center gap-1.5">
                            {confidence[cardKey] && confidence[cardKey] !== 'unknown' && (
                                <span className={CONFIDENCE_CONFIG[confidence[cardKey]].color}>
                                    {CONFIDENCE_CONFIG[confidence[cardKey]].label}
                                </span>
                            )}
                            {Math.round(((currentIndex + 1) / activeDeck.cards.length) * 100)}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${((currentIndex + 1) / activeDeck.cards.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Main Flashcard */}
                <div className="flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-full max-w-3xl aspect-[3/2] perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
                        <motion.div
                            className="w-full h-full relative preserve-3d transition-transform duration-500"
                            animate={{ rotateX: isFlipped ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            {/* Front (Question) */}
                            <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-8 md:p-10 flex flex-col justify-center items-center shadow-xl group-hover:shadow-2xl transition-shadow text-center">
                                <span className="absolute top-5 left-5 text-lg opacity-10 font-serif text-slate-400">Q.</span>
                                <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">{activeDeck.emoji} {activeDeck.title}</span>
                                <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 leading-tight max-w-[90%]">
                                    {activeDeck.cards[currentIndex].q}
                                </h2>
                                <span className="absolute bottom-5 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 animate-pulse">Click or Press Space to Reveal</span>
                            </div>

                            {/* Back (Answer) */}
                            <div
                                className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-blue-500 rounded-3xl p-8 md:p-10 flex flex-col justify-center items-center shadow-xl text-center"
                                style={{ transform: 'rotateX(180deg)' }}
                            >
                                <span className="absolute top-5 right-5 text-lg opacity-20 font-serif text-white">A.</span>
                                <p className="text-lg md:text-2xl font-bold text-white leading-relaxed max-w-[90%]">
                                    {activeDeck.cards[currentIndex].a}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center gap-4 mt-8">
                        <button
                            onClick={prevCard}
                            className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110 transition-all shadow-md"
                            aria-label="Previous card"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        {/* Confidence Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => rateCard('hard')}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 ${confidence[cardKey] === 'hard'
                                        ? 'bg-red-500 text-white border-red-500'
                                        : 'bg-white dark:bg-slate-800 text-red-500 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950'
                                    }`}
                                aria-label="Rate as hard"
                            >
                                ❌ Hard (1)
                            </button>
                            <button
                                onClick={() => rateCard('okay')}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 ${confidence[cardKey] === 'okay'
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-white dark:bg-slate-800 text-amber-500 border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950'
                                    }`}
                                aria-label="Rate as okay"
                            >
                                🤔 Okay (2)
                            </button>
                            <button
                                onClick={() => rateCard('easy')}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 ${confidence[cardKey] === 'easy'
                                        ? 'bg-emerald-500 text-white border-emerald-500'
                                        : 'bg-white dark:bg-slate-800 text-emerald-500 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                    }`}
                                aria-label="Rate as easy"
                            >
                                ✅ Easy (3)
                            </button>
                        </div>

                        <button
                            onClick={nextCard}
                            className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110 transition-all shadow-md"
                            aria-label="Next card"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Keyboard hint */}
                <div className="w-full max-w-3xl mx-auto px-4 py-6">
                    <div className={`flex items-center justify-center gap-3 text-xs flex-wrap ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Keyboard className="w-3.5 h-3.5" />
                        <span>← → Navigate</span>
                        <span className="opacity-40">|</span>
                        <span>Space: Flip</span>
                        <span className="opacity-40">|</span>
                        <span>1/2/3: Rate</span>
                        <span className="opacity-40">|</span>
                        <span>Esc: Unflip</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
