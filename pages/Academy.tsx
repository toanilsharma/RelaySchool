
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    BookOpen, CheckCircle, Lock, Play, Star, Trophy, Zap, 
    ArrowRight, Activity, GitMerge, Radar, Network, Server, 
    ShieldCheck, GraduationCap, ChevronRight
} from 'lucide-react';

const CURRICULUM = [
    {
        id: 'tier1',
        title: 'Tier 1: The Physics of Faults',
        subtitle: 'Understand what happens before the relay trips.',
        color: 'blue',
        modules: [
            {
                id: 'm1',
                title: 'Phasors & Polarity',
                desc: 'Learn how AC waves are represented as vectors. Understand magnitude and angle.',
                toolLink: '/vectors',
                toolName: 'Vector Lab',
                icon: Activity,
                status: 'unlocked',
                objectives: ['Visualize 3-phase systems', 'Understand Lead/Lag', 'Calculate Residual Current (3I0)']
            },
            {
                id: 'm2',
                title: 'Symmetrical Components',
                desc: 'The math behind unbalanced faults. Decompose L-G faults into Pos, Neg, and Zero sequence.',
                toolLink: '/symcomp',
                toolName: 'SymComp Lab',
                icon: GitMerge,
                status: 'locked',
                objectives: ['Visualize Sequence Networks', 'Analyze Unbalance Factors', 'See why Ground Faults affect I0']
            }
        ]
    },
    {
        id: 'tier2',
        title: 'Tier 2: Device Logic & Settings',
        subtitle: 'How does a relay "think"?',
        color: 'emerald',
        modules: [
            {
                id: 'm3',
                title: 'Overcurrent Principles (50/51)',
                desc: 'Master the Inverse Curve. Learn why we use curves instead of fixed timers.',
                toolLink: '/tester',
                toolName: 'Relay Tester',
                icon: Zap,
                status: 'locked',
                objectives: ['Test Pickup Accuracy', 'Verify IEC Curve Timing', 'Understand Reset Ratio']
            }
        ]
    },
    {
        id: 'tier3',
        title: 'Tier 3: System Coordination',
        subtitle: 'Protecting the Grid, not just the equipment.',
        color: 'amber',
        modules: [
            {
                id: 'm5',
                title: 'Grading & Selectivity',
                desc: 'The art of tripping ONLY the closest breaker. Manage margins between Upstream and Downstream.',
                toolLink: '/tcc',
                toolName: 'TCC Studio',
                icon: GitMerge,
                status: 'locked',
                objectives: ['Calculate Grading Margins', 'Coordinate with Fuses/Cables', 'Handle Inrush Current']
            },
            {
                id: 'm6',
                title: 'Distance Protection (21)',
                desc: 'Protection for transmission lines. Impedance (Z) zones and the Mho Circle.',
                toolLink: '/distance',
                toolName: 'Distance Lab',
                icon: Radar,
                status: 'locked',
                objectives: ['Visualize Zone Reach', 'Understand Load Encroachment', 'Plot Fault Impedance']
            }
        ]
    },
    {
        id: 'tier4',
        title: 'Tier 4: The Digital Substation',
        subtitle: 'Modern IEC 61850 Architecture.',
        color: 'purple',
        modules: [
            {
                id: 'm7',
                title: 'GOOSE & Process Bus',
                desc: 'Replace copper wires with fiber optics. Network engineering for electrical engineers.',
                toolLink: '/comms',
                toolName: 'Comms Hub',
                icon: Network,
                status: 'locked',
                objectives: ['Analyze GOOSE Packets', 'Understand VLAN Priority', 'Debug Network Storms']
            },
            {
                id: 'm8',
                title: 'Digital Twin Operations',
                desc: 'Run a full substation simulation. Handle load flow and topology changes in real-time.',
                toolLink: '/twin',
                toolName: 'Digital Twin',
                icon: Server,
                status: 'locked',
                objectives: ['Manage Busbar Splitting', 'Analyze Load Flow', 'React to Cascading Failures']
            }
        ]
    }
];

const Academy = () => {
    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 relative overflow-hidden border border-slate-700 shadow-2xl text-white">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <GraduationCap className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-500/30">
                        <Star className="w-3 h-3" /> Career Path
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                        From Novice to <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Protection Expert</span>
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed mb-8">
                        Don't just use the tools—master the engineering behind them. 
                        This structured curriculum guides you through the physics, logic, and application of power system protection.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold">
                                    {i}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm text-slate-400 font-medium">4 Tiers • 7 Core Modules</span>
                    </div>
                </div>
            </div>

            {/* Curriculum Tree */}
            <div className="relative">
                {/* Vertical Connector Line */}
                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

                <div className="space-y-12">
                    {CURRICULUM.map((tier, idx) => (
                        <div key={tier.id} className="relative">
                            
                            {/* Tier Header */}
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-${tier.color}-600 text-white font-bold text-xl shrink-0`}>
                                    T{idx + 1}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{tier.title}</h2>
                                    <p className="text-slate-500 dark:text-slate-400">{tier.subtitle}</p>
                                </div>
                            </div>

                            {/* Modules Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:pl-20">
                                {tier.modules.map((mod) => (
                                    <div key={mod.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <mod.icon className="w-24 h-24" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors">
                                                    <mod.icon className="w-6 h-6" />
                                                </div>
                                                {/* Simulate progress - First module unlocked */}
                                                {idx === 0 ? (
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                                                        <Play className="w-3 h-3 fill-current" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                                                        <Lock className="w-3 h-3" /> Locked
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {mod.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                                {mod.desc}
                                            </p>

                                            <div className="space-y-3 mb-6">
                                                {mod.objectives.map((obj, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                        <CheckCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                                                        <span>{obj}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <Link 
                                                to={mod.toolLink}
                                                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group-hover:border-blue-500 group-hover:text-blue-600"
                                            >
                                                Open {mod.toolName} <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Certification Badge (Simulated) */}
            <div className="mt-16 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800/50 flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30 shrink-0">
                    <Trophy className="w-10 h-10 text-white" />
                </div>
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">Completion Certificate</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed max-w-2xl">
                        Complete all challenges in the "Challenges" module and verify your understanding in the "Academy" path to unlock your virtual Certificate of Competency in Digital Protection Engineering.
                    </p>
                </div>
                <Link to="/challenges" className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-600/20 transition-all whitespace-nowrap">
                    Take Final Exam
                </Link>
            </div>

        </div>
    );
};

export default Academy;
