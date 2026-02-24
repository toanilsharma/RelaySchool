import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Settings, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';

const FLASHCARD_DECKS = [
    {
        id: 'distance',
        title: 'Distance Protection (21)',
        cards: [
            { q: 'What is the primary input required for a distance relay?', a: 'Voltage and Current (Z = V/I)' },
            { q: 'Why is Zone 1 typically set to 80-85%?', a: 'To prevent overreaching due to CT/VT errors and line parameter inaccuracies.' },
            { q: 'What does SIR stand for?', a: 'Source Impedance Ratio (ZS/ZL).' },
            { q: 'Which characteristic is inherently directional?', a: 'Mho Characteristic' },
            { q: 'What is the purpose of Load Encroachment logic?', a: 'To prevent Zone 3 tripping during heavy load conditions when measured impedance drops significantly.' }
        ]
    },
    {
        id: 'differential',
        title: 'Differential Protection (87)',
        cards: [
            { q: 'What is the core principle of Differential Protection?', a: 'Kirchhoff\'s Current Law (Sum of currents into a node must equal zero).' },
            { q: 'What causes false differential currents during energization?', a: 'Transformer Inrush Current (rich in 2nd harmonic).' },
            { q: 'Why do we use a Percentage Restraint?', a: 'To increase security during heavy external faults which may cause CT saturation.' },
            { q: 'What harmonic is typically used to block inrush?', a: 'The 2nd Harmonic.' },
            { q: 'What harmonic indicates over-excitation?', a: 'The 5th Harmonic.' }
        ]
    }
];

export default function Flashcards() {
    useThemeObserver();
    // Default to first deck
    const [activeDeck, setActiveDeck] = useState(FLASHCARD_DECKS[0]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % activeDeck.cards.length);
        }, 300);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + activeDeck.cards.length) % activeDeck.cards.length);
        }, 300);
    };

    const selectDeck = (deck: any) => {
        setActiveDeck(deck);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const isDark = document.documentElement.classList.contains('dark');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans flex flex-col items-center">
            
            {/* Header */}
            <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center shadow-sm">
                <div className="bg-blue-600 dark:bg-blue-600 text-white p-2 rounded-lg mr-4 shadow-sm">
                    <BookOpen className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Flashcard Mastery</h1>
                    <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Rapid Concepts Review</p>
                </div>
            </header>

            {/* Deck Selector */}
            <div className="w-full max-w-4xl px-4 py-8">
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {FLASHCARD_DECKS.map(deck => (
                        <button
                            key={deck.id}
                            onClick={() => selectDeck(deck)}
                            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all shadow-sm ${
                                activeDeck.id === deck.id
                                ? 'bg-blue-600 text-white border-transparent'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {deck.title}
                        </button>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-2xl mx-auto my-6">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
                        <span>Card {currentIndex + 1} of {activeDeck.cards.length}</span>
                        <span>{Math.round(((currentIndex + 1) / activeDeck.cards.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${((currentIndex + 1) / activeDeck.cards.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Main Flashcard */}
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-full max-w-2xl aspect-[3/2] perspective-[1000px] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
                        <motion.div
                            className="w-full h-full relative preserve-3d transition-transform duration-500"
                            animate={{ rotateX: isFlipped ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            {/* Front of Card (Question) */}
                            <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-10 flex flex-col justify-center items-center shadow-xl group-hover:shadow-2xl transition-shadow text-center">
                                <span className="absolute top-6 left-6 text-2xl opacity-10 font-serif text-slate-400">Q.</span>
                                <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                                    {activeDeck.cards[currentIndex].q}
                                </h2>
                                <span className="absolute bottom-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 animate-pulse">Click to Reveal</span>
                            </div>

                            {/* Back of Card (Answer) */}
                            <div 
                                className="absolute inset-0 backface-hidden bg-blue-600 dark:bg-blue-700 border-2 border-blue-600 rounded-3xl p-10 flex flex-col justify-center items-center shadow-xl text-center"
                                style={{ transform: 'rotateX(180deg)' }}
                            >
                                <span className="absolute top-6 right-6 text-2xl opacity-20 font-serif text-white">A.</span>
                                <p className="text-xl md:text-3xl font-bold text-white leading-relaxed">
                                    {activeDeck.cards[currentIndex].a}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex gap-6 mt-12">
                        <button 
                            onClick={prevCard}
                            className="p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110 transition-all shadow-md"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={nextCard}
                            className="p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110 transition-all shadow-md"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>

            </div>
            
            <style>{`
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .perspective-[1000px] { perspective: 1000px; }
            `}</style>
        </div>
    );
}
