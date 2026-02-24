import React, { useState } from 'react';
import { BookOpen, AlertTriangle, FileText, Search, ShieldCheck, Activity, Calendar, GitCommit } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from "../components/SEO";

const CASES = [
    {
        id: 'c1',
        title: 'The Great Northeast Blackout',
        date: 'August 14, 2003',
        location: 'Ohio, USA to Ontario, Canada',
        difficulty: 'Hard',
        summary: 'A localized fault cascaded into one of the largest blackouts in history, affecting 50 million people.',
        evidence: [
            { type: 'log', title: 'Energy Management System (EMS)', content: '14:02 - Alarm server fails. Operator unaware of degraded state.\n15:05 - Harding-Chamberlin 345kV trips on tree contact.\n15:32 - Hanna-Juniper 345kV trips (overload/sag).\n15:41 - Star-South Canton 345kV trips.' },
            { type: 'diagram', title: 'System State', content: 'Lines were carrying roughly 110% of their emergency rating. Reactive power reserves were depleted due to high summer loads.' },
            { type: 'relay', title: 'Zone 3 Relay Operation', content: 'Relays on distant lines saw high load current and low voltage as a "fault" (Load Encroachment) and tripped, accelerating the cascade.' }
        ],
        question: 'What was the primary protection engineering failure that accelerated the cascade?',
        options: [
            'Breaker Failure (50BF) did not operate.',
            'Zone 3 Distance Relays tripped on load encroachment.',
            'Differential (87L) relays lost sync over fiber.',
            'Transformers exploded due to overvoltage.'
        ],
        answer: 1,
        explanation: 'Zone 3 distance relays have a large reach and long delay. When heavy load depressed voltages, the apparent impedance fell into Zone 3, causing relays to trip healthy lines and shifting even more load to remaining lines.'
    }
];

export default function CaseStudies() {
    useThemeObserver();
    const [activeCase, setActiveCase] = useState(CASES[0]);
    const [activeEvidence, setActiveEvidence] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    const handleAnswer = (index: number) => {
        setSelectedOption(index);
        setShowResult(true);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
<SEO title="Case Studies" description="Interactive Power System simulation and engineering tool: Case Studies." url="/casestudies" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-rose-600" /> Case Studies
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Investigate real-world grid failures. Analyze evidence logs and identify the root cause.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Master List */}
                <div className="lg:col-span-1 space-y-4">
                    {CASES.map(c => (
                        <button
                            key={c.id}
                            onClick={() => { setActiveCase(c); setShowResult(false); setSelectedOption(null); setActiveEvidence(0); }}
                            className={`w-full text-left p-4 flex flex-col gap-2 rounded-2xl border transition-all ${
                                activeCase.id === c.id 
                                ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
                            }`}
                        >
                            <h3 className={`font-bold ${activeCase.id === c.id ? 'text-rose-700 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                {c.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Calendar className="w-3 h-3" /> {c.date}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Case Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{activeCase.title}</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">{activeCase.summary}</p>

                        <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-800">
                            {activeCase.evidence.map((ev, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveEvidence(i)}
                                    className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
                                        activeEvidence === i
                                        ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {ev.title}
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-200 dark:border-slate-800 min-h-[150px]">
                            {activeCase.evidence[activeEvidence].content}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Search className="w-5 h-5 text-indigo-500" /> Root Cause Analysis
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300 mb-6 font-medium bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                            {activeCase.question}
                        </p>

                        <div className="space-y-3">
                            {activeCase.options.map((opt, i) => {
                                let style = 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-400';
                                if (showResult) {
                                    if (i === activeCase.answer) {
                                        style = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-300';
                                    } else if (i === selectedOption) {
                                        style = 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300';
                                    } else {
                                        style = 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-50';
                                    }
                                }
                                return (
                                    <button
                                        key={i}
                                        disabled={showResult}
                                        onClick={() => handleAnswer(i)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${style}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {showResult && (
                            <div className={`mt-6 p-4 rounded-xl border ${selectedOption === activeCase.answer ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`}>
                                <h4 className={`font-bold text-lg mb-2 flex items-center gap-2 ${selectedOption === activeCase.answer ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    {selectedOption === activeCase.answer ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    {selectedOption === activeCase.answer ? 'Correct Analysis' : 'Incorrect Analysis'}
                                </h4>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {activeCase.explanation}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
