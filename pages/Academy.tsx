
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    BookOpen, CheckCircle, Lock, Play, Star, Trophy, Zap, 
    ArrowRight, Activity, GitMerge, Radar, Network, Server, 
    ShieldCheck, GraduationCap, ChevronRight, Check
} from 'lucide-react';
import SEO from "../components/SEO";

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

const CertificateSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" className="w-full max-w-lg mx-auto drop-shadow-2xl">
        <defs>
            <linearGradient id="cert-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="cert-border" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#cert-bg)" />
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#cert-border)" strokeWidth="12" />
        <rect x="30" y="30" width="740" height="540" fill="none" stroke="#e2e8f0" strokeWidth="2" />
        
        <g transform="translate(400, 100)">
            <path d="M-30,-20 L30,-20 L40,10 L0,40 L-40,10 Z" fill="#f59e0b" />
            <path d="M-20,-10 L20,-10 L25,10 L0,30 L-25,10 Z" fill="#fbbf24" />
        </g>
        
        <text x="400" y="180" fontFamily="serif" fontSize="48" fontWeight="bold" textAnchor="middle" fill="#0f172a">CERTIFICATE OF MASTERY</text>
        <text x="400" y="220" fontFamily="sans-serif" fontSize="16" letterSpacing="4" textAnchor="middle" fill="#64748b">PROUDLY PRESENTED TO</text>
        
        <line x1="200" y1="300" x2="600" y2="300" stroke="#cbd5e1" strokeWidth="2" />
        <text x="400" y="290" fontFamily="serif" fontSize="36" fontStyle="italic" textAnchor="middle" fill="#1e293b">RelaySchool Engineer</text>
        
        <text x="400" y="360" fontFamily="sans-serif" fontSize="14" textAnchor="middle" fill="#475569" width="500">For successfully completing the comprehensive Power Systems Protection Curriculum,</text>
        <text x="400" y="380" fontFamily="sans-serif" fontSize="14" textAnchor="middle" fill="#475569">demonstrating advanced proficiency in electrical theory, coordination, and digital substations.</text>
        
        <g transform="translate(200, 480)">
            <line x1="-80" y1="0" x2="80" y2="0" stroke="#94a3b8" strokeWidth="2" />
            <text x="0" y="20" fontFamily="sans-serif" fontSize="12" textAnchor="middle" fill="#64748b">DATE COMPLETED</text>
            <text x="0" y="-10" fontFamily="sans-serif" fontSize="16" textAnchor="middle" fill="#0f172a">{new Date().toLocaleDateString()}</text>
        </g>
        
        <g transform="translate(600, 480)">
            <line x1="-80" y1="0" x2="80" y2="0" stroke="#94a3b8" strokeWidth="2" />
            <text x="0" y="20" fontFamily="sans-serif" fontSize="12" textAnchor="middle" fill="#64748b">PLATFORM VERIFIED</text>
            <text x="0" y="-10" fontFamily="serif" fontSize="20" fontStyle="italic" textAnchor="middle" fill="#0f172a">RelaySchool</text>
        </g>
        
        <circle cx="400" cy="460" r="40" fill="#f59e0b" />
        <circle cx="400" cy="460" r="35" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M385,460 L395,470 L415,445" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M380,490 L400,530 L420,490 Z" fill="#d97706" />
    </svg>
);

const Academy = () => {
    const [progress, setProgress] = useState<Record<string, boolean>>(() => {
        try {
            const stored = localStorage.getItem('rs_academy_progress');
            return stored ? JSON.parse(stored) : {};
        } catch { return {}; }
    });

    const toggleModule = (id: string, isCompleted: boolean) => {
        const newProgress = { ...progress, [id]: isCompleted };
        setProgress(newProgress);
        localStorage.setItem('rs_academy_progress', JSON.stringify(newProgress));
    };

    const totalModules = CURRICULUM.reduce((acc, tier) => acc + tier.modules.length, 0);
    const completedCount = Object.values(progress).filter(Boolean).length;
    const isCertified = completedCount === totalModules;

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
<SEO title="Academy" description="Interactive Power System simulation and engineering tool: Academy." url="/academy" />

            
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
                            {[...Array(totalModules)].map((_, i) => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold ${i < completedCount ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    {i < completedCount ? <Check className="w-4 h-4" /> : i + 1}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm text-slate-400 font-medium">4 Tiers • {completedCount}/{totalModules} Modules</span>
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
                                                {progress[mod.id] ? (
                                                    <button onClick={() => toggleModule(mod.id, false)} className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-200 transition-colors cursor-pointer">
                                                        <CheckCircle className="w-3 h-3" /> Mastered
                                                    </button>
                                                ) : (
                                                    <button onClick={() => toggleModule(mod.id, true)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                                                        <Play className="w-3 h-3" /> Mark Complete
                                                    </button>
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
                                                    <div key={i} className={`flex items-start gap-2 text-xs ${progress[mod.id] ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${progress[mod.id] ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                                                        <span>{obj}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <Link 
                                                to={mod.toolLink}
                                                className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-colors ${progress[mod.id] ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 group-hover:border-blue-500 group-hover:text-blue-600'}`}
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

            {/* Certification Badge */}
            {isCertified ? (
                <div className="mt-16 animate-in zoom-in duration-500">
                    <CertificateSVG />
                    <div className="text-center mt-6">
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg flex justify-center items-center gap-2">
                            <Trophy className="w-6 h-6" /> Curriculum Mastered!
                        </p>
                        <p className="text-slate-500 mt-2">You can save this certificate by right clicking on it.</p>
                    </div>
                </div>
            ) : (
                <div className="mt-16 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800/50 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30 shrink-0">
                        <Lock className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">Completion Certificate Locked</h3>
                        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed max-w-2xl">
                            Complete all {totalModules} modules in the curriculum to unlock your digital Certificate of Mastery. 
                            Currently completed: {completedCount}/{totalModules}.
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Academy;
