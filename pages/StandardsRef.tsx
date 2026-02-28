import React, { useState, useEffect } from 'react';
import { Book, Search, Library, FileText, ChevronRight, Hash, Globe, Filter, Share2 } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from "../components/SEO";

const STANDARDS_DB = [
    { id: 'c37.113', org: 'IEEE', num: 'C37.113', year: 2015, title: 'Guide for Protective Relay Applications to Transmission Lines', desc: 'Covers distance protection (21), pilot schemes (POTT, PUTT, DCB), and current differential (87L) applied to transmission networks. Includes guidance on reach settings, mutual coupling, and infeed effects.', tags: ['Distance', 'Differential', 'Transmission'] },
    { id: 'c37.104', org: 'IEEE', num: 'C37.104', year: 2022, title: 'Guide for Automatic Reclosing of Circuit Breakers for AC Transmission and Distribution Lines', desc: 'Detailed guidance on autoreclosing (79) logic, including shot sequences, dead times, deionization times, and fuse-saving vs fuse-clearing strategies.', tags: ['Autorecloser', 'Distribution'] },
    { id: 'c37.112', org: 'IEEE', num: 'C37.112', year: 2018, title: 'Standard Inverse-Time Characteristic Equations for Overcurrent Relays', desc: 'Defines the mathematical equations for U.S. (ANSI/IEEE) and IEC inverse-time overcurrent characteristics (51) to ensure coordination and interchangeability.', tags: ['Overcurrent', 'Coordination'] },
    { id: 'c37.91', org: 'IEEE', num: 'C37.91', year: 2021, title: 'Guide for Protecting Power Transformers', desc: 'Covers percentage differential (87T) protection, including harmonic restraint for inrush, Volts/Hz (24), and overall transformer protection schemes.', tags: ['Transformer', 'Differential'] },
    { id: 'c37.102', org: 'IEEE', num: 'C37.102', year: 2006, title: 'Guide for AC Generator Protection', desc: 'Comprehensive guide covering stator and rotor ground faults, loss of excitation (40), out-of-step (78), voltage-restrained overcurrent (51V), and differential (87G).', tags: ['Generator'] },
    { id: 'c37.96', org: 'IEEE', num: 'C37.96', year: 2012, title: 'Guide for AC Motor Protection', desc: 'Addresses thermal overload (49), locked rotor, unbalance (46), and ground fault protection for critical AC motors.', tags: ['Motor'] },
    { id: 'c37.2', org: 'IEEE', num: 'C37.2', year: 2008, title: 'Standard for Electrical Power System Device Function Numbers', desc: 'The definitive list of ANSI device numbers (e.g., 50, 51, 21, 87) used globally to denote specific relay functions in schematics and logic.', tags: ['Fundamentals'] },
    { id: 'iec-60255-151', org: 'IEC', num: '60255-151', year: 2009, title: 'Measuring relays and protection equipment - Part 151: Functional requirements for over/under current protection', desc: 'Specifies the operating characteristics (SI, VI, EI, LTI) for overcurrent relays, replacing older standards.', tags: ['Overcurrent', 'IEC'] },
    { id: 'iec-60255-121', org: 'IEC', num: '60255-121', year: 2014, title: 'Measuring relays and protection equipment - Part 121: Functional requirements for distance protection', desc: 'Defines performance requirements, zones, characteristics, and test methodologies for distance relays.', tags: ['Distance', 'IEC'] },
    { id: 'iec-61850', org: 'IEC', num: '61850', year: 'Ongoing', title: 'Communication networks and systems for power utility automation', desc: 'The foundational standard for digital substations, defining GOOSE messaging, Sampled Values (SV), and logical nodes for interoperable protection schemes.', tags: ['Communications', 'Digital Substation', 'IEC'] },
    { id: 'iec-60909', org: 'IEC', num: '60909-0', year: 2016, title: 'Short-circuit currents in three-phase a.c. systems - Part 0: Calculation of currents', desc: 'The global standard for calculating maximum and minimum short-circuit currents used for relay setting and equipment sizing.', tags: ['Analysis', 'IEC'] },
    { id: 'c37.243', org: 'IEEE', num: 'C37.243', year: 2015, title: 'Guide for Application of Digital Line Current Differential Relays Using Digital Communication', desc: 'Details on line differential (87L) applying digital comms, including channel asymmetry, charging current compensation, and alpha-plane logic.', tags: ['Differential', 'Communications'] },
];

export default function StandardsReference() {
    const isDark = useThemeObserver();
    const [search, setSearch] = useState('');
    const [orgFilter, setOrgFilter] = useState<string | null>(null);

    const copyShareLink = () => {
        const state = { search, orgFilter };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert('Link copied!');
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('s');
        if (s) { try { const st = JSON.parse(atob(s)); if (st.search !== undefined) setSearch(st.search); if (st.orgFilter !== undefined) setOrgFilter(st.orgFilter); } catch (e) {} }
    }, []);

    const filtered = STANDARDS_DB.filter(s => {
        const matchSearch = s.num.toLowerCase().includes(search.toLowerCase()) || 
                            s.title.toLowerCase().includes(search.toLowerCase()) ||
                            s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchOrg = orgFilter ? s.org === orgFilter : true;
        return matchSearch && matchOrg;
    });

    return (
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            <SEO title="Protection Standards Reference (IEEE/IEC)" description="Database of critical IEEE and IEC power system protection standards including C37.113, C37.2, IEC 60255, and IEC 61850." url="/standards" />
            
            <header className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg text-white shadow-lg">
                        <Library className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`font-black text-lg leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Standards<span className="text-indigo-500">Index</span></h1>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">IEEE & IEC Reference</span>
                    </div>
                </div>
                <button onClick={copyShareLink} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-md">
                    <Share2 className="w-3 h-3" />Share
                </button>
            </header>

            <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 space-y-6">
                
                {/* Search & Filter */}
                <div className={`p-4 md:p-6 rounded-2xl border flex flex-col md:flex-row gap-4 items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                        <input
                            type="text"
                            placeholder="Search standard number (e.g., C37.113), title, or topic..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                                isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        <button onClick={() => setOrgFilter(null)} className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${!orgFilter ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'}`}>All</button>
                        <button onClick={() => setOrgFilter('IEEE')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${orgFilter === 'IEEE' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'}`}><Hash className="w-4 h-4" /> IEEE</button>
                        <button onClick={() => setOrgFilter('IEC')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${orgFilter === 'IEC' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'}`}><Globe className="w-4 h-4" /> IEC</button>
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center gap-2 text-sm font-bold opacity-60 px-2">
                    <FileText className="w-4 h-4" /> Showing {filtered.length} standards
                </div>

                {/* Listing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] overflow-y-auto pb-12 custom-scrollbar pr-2">
                    {filtered.map(std => (
                        <div key={std.id} className={`p-6 rounded-2xl border transition-all hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg flex flex-col h-full ${
                            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-widest ${
                                    std.org === 'IEEE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                }`}>{std.org} {std.num}</span>
                                <span className="text-xs font-mono opacity-50 bg-slate-200 dark:bg-slate-800 px-2 rounded">{std.year}</span>
                            </div>
                            
                            <h3 className="font-bold text-lg leading-snug mb-3 text-slate-900 dark:text-white line-clamp-2">{std.title}</h3>
                            <p className="text-sm opacity-70 leading-relaxed mb-6 flex-1">{std.desc}</p>
                            
                            <div className="flex flex-wrap gap-2 mt-auto">
                                {std.tags.map(t => (
                                    <span key={t} className={`text-[10px] font-bold px-2 py-1 rounded-sm border ${
                                        isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}>#{t}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {filtered.length === 0 && (
                        <div className="col-span-full py-12 text-center opacity-50 flex flex-col items-center">
                            <Book className="w-12 h-12 mb-4" />
                            <p>No standards found matching your criteria.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
