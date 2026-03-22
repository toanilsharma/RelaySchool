import React, { useState, useEffect, useMemo } from 'react';
import { User, Trophy, Flame, Target, Star, Zap, Award, Activity, Calendar, Share2, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from '../components/SEO';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    condition: (stats: UserStats) => boolean;
}

interface UserStats {
    visitedCount: number;
    totalXP: number;
    level: number;
    flashcardsRated: number;
    streakDays: number;
    joinDate: string;
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first-contact',
        title: 'First Contact',
        description: 'Explore your first simulator',
        icon: Zap,
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        condition: (s) => s.visitedCount >= 1
    },
    {
        id: 'speed-reader',
        title: 'Curious Mind',
        description: 'Visit 10 different modules',
        icon: BookOpen,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        condition: (s) => s.visitedCount >= 10
    },
    {
        id: 'system-explorer',
        title: 'System Explorer',
        description: 'Visit 25 different modules',
        icon: Layers,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        condition: (s) => s.visitedCount >= 25
    },
    {
        id: 'master-engineer',
        title: 'Master Engineer',
        description: 'Visit all 37+ modules',
        icon: Trophy,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        condition: (s) => s.visitedCount >= 37
    },
    {
        id: 'flashcard-rookie',
        title: 'Memory Builder',
        description: 'Rate 20 flashcards',
        icon: Star,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        condition: (s) => s.flashcardsRated >= 20
    },
    {
        id: 'flashcard-master',
        title: 'Perfect Recall',
        description: 'Rate 100 flashcards',
        icon: ShieldCheck,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/30',
        condition: (s) => s.flashcardsRated >= 100
    },
    {
        id: 'streak-3',
        title: 'On Fire',
        description: 'Maintain a 3-day study streak',
        icon: Flame,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        condition: (s) => s.streakDays >= 3
    },
    {
        id: 'streak-7',
        title: 'Consistency',
        description: 'Maintain a 7-day study streak',
        icon: Calendar,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        condition: (s) => s.streakDays >= 7
    },
];

export default function Profile() {
    const isDark = useThemeObserver();
    const [stats, setStats] = useState<UserStats>({
        visitedCount: 0,
        totalXP: 0,
        level: 1,
        flashcardsRated: 0,
        streakDays: 1,
        joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    });

    useEffect(() => {
        // Load data from localStorage
        const visitedRoutes = JSON.parse(localStorage.getItem('visitedRoutes') || '[]');
        const flashcardData = JSON.parse(localStorage.getItem('rs-flashcard-confidence') || '{}');
        const joinDateStored = localStorage.getItem('rs-join-date');

        if (!joinDateStored) {
            localStorage.setItem('rs-join-date', new Date().toISOString());
        }

        const date = joinDateStored ? new Date(joinDateStored) : new Date();

        // Calculate XP: 10 per visited route, 2 per flashcard
        const ratedCardsCount = Object.keys(flashcardData).filter(k => flashcardData[k] !== 'unknown').length;
        const xp = (visitedRoutes.length * 10) + (ratedCardsCount * 2);

        // Simple leveling curve: Level = 1 + int(sqrt(XP / 20))
        const lvl = Math.floor(1 + Math.sqrt(xp / 20));

        // Mock streak calculation (in a real app, track daily logins)
        // We'll read from localStorage or default to 1
        const streak = parseInt(localStorage.getItem('rs-streak') || '1', 10);

        setStats({
            visitedCount: visitedRoutes.length,
            totalXP: xp,
            level: lvl,
            flashcardsRated: ratedCardsCount,
            streakDays: streak,
            joinDate: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
    }, []);

    const earnedAchievements = useMemo(() => {
        return ACHIEVEMENTS.filter(a => a.condition(stats));
    }, [stats]);

    const lockedAchievements = useMemo(() => {
        return ACHIEVEMENTS.filter(a => !a.condition(stats));
    }, [stats]);

    // Next level calculation
    const currentLevelBaseXP = 20 * Math.pow(stats.level - 1, 2);
    const nextLevelBaseXP = 20 * Math.pow(stats.level, 2);
    const xpIntoLevel = stats.totalXP - currentLevelBaseXP;
    const xpRequiredForNext = nextLevelBaseXP - currentLevelBaseXP;
    const progressPct = Math.min(100, Math.max(0, (xpIntoLevel / xpRequiredForNext) * 100));

    const shareProfile = () => {
        if (navigator.clipboard) {
            const text = `I'm Level ${stats.level} on RelaySchool with ${stats.totalXP} XP and ${earnedAchievements.length} achievements! ⚡ Check it out: https://relayschool.co.in`;
            navigator.clipboard.writeText(text);
            alert('Profile stats copied to clipboard!');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
            <SEO
                title="Engineer Profile & Achievements"
                description="Track your learning progress, XP, and engineering achievements."
                url="/profile"
            />

            {/* Header */}
            <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2.5 rounded-lg mr-4 shadow-lg shadow-blue-500/20">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Engineer Profile</h1>
                        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Member since {stats.joinDate}</p>
                    </div>
                </div>
                <button
                    onClick={shareProfile}
                    className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    <Share2 className="w-4 h-4" /> Share Stats
                </button>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* ─── LEVEL & XP CARD ─── */}
                <div className={`p-6 md:p-8 rounded-3xl border shadow-sm mb-8 relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-5 pointer-events-none">
                        <Award className="w-64 h-64 text-blue-500" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        {/* Hexagon Level Badge */}
                        <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-blue-500 drop-shadow-lg">
                                <polygon points="50 3, 95 28, 95 72, 50 97, 5 72, 5 28" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                            <div className="text-center z-10">
                                <div className="text-sm font-bold text-blue-500 uppercase tracking-widest leading-none">Level</div>
                                <div className="text-5xl font-black text-slate-800 dark:text-white mt-1 leading-none">{stats.level}</div>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div className="flex-1 w-full text-center md:text-left">
                            <h2 className="text-2xl font-bold mb-2">Protection Engineer</h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-amber-900/30 text-amber-500 border border-amber-800/50' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                    <Zap className="w-3.5 h-3.5" /> {stats.totalXP} Total XP
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-red-900/30 text-red-500 border border-red-800/50' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                    <Flame className="w-3.5 h-3.5" /> {stats.streakDays} Day Streak
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full">
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 font-mono uppercase">
                                    <span>XP {xpIntoLevel} <span className="text-[10px] opacity-60">/ {xpRequiredForNext} TO NEXT</span></span>
                                    <span>{Math.round(progressPct)}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── STATS GRID ─── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <Activity className="w-6 h-6 mx-auto mb-2 text-indigo-500 opacity-80" />
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.visitedCount}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Modules Explored</div>
                    </div>
                    <div className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <BookOpen className="w-6 h-6 mx-auto mb-2 text-emerald-500 opacity-80" />
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.flashcardsRated}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Cards Reviewed</div>
                    </div>
                    <div className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500 opacity-80" />
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{earnedAchievements.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Achievements</div>
                    </div>
                    <div className={`p-5 rounded-2xl border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <Target className="w-6 h-6 mx-auto mb-2 text-purple-500 opacity-80" />
                        <div className="text-3xl font-black text-slate-800 dark:text-white">0</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Challenges Won</div>
                    </div>
                </div>

                {/* ─── ACHIEVEMENTS ─── */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Earned Badges
                    </h2>

                    {earnedAchievements.length === 0 ? (
                        <div className={`p-8 rounded-2xl border text-center border-dashed ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                            No achievements yet. Start exploring simulators to earn badges!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {earnedAchievements.map(ach => {
                                const Icon = ach.icon;
                                return (
                                    <div key={ach.id} className={`p-5 rounded-2xl border flex flex-col items-center text-center transition-transform hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${ach.bgColor}`}>
                                            <Icon className={`w-7 h-7 ${ach.color}`} />
                                        </div>
                                        <div className="font-bold text-sm text-slate-800 dark:text-white">{ach.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">{ach.description}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Locked Achievements */}
                {lockedAchievements.length > 0 && (
                    <div className="mt-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Locked Achievements</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {lockedAchievements.map(ach => {
                                const Icon = ach.icon;
                                return (
                                    <div key={ach.id} className={`p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                            <Icon className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-bold text-sm text-slate-500">{ach.title}</div>
                                            <div className="text-[10px] text-slate-400">{ach.description}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
