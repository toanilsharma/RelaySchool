import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Hash, Globe2, Flag, Filter, X } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from '../components/SEO';
import { ANSI_DEVICES, DEVICE_CATEGORIES, INDIAN_STANDARDS } from '../data/referenceData';

type Tab = 'ansi' | 'indian';

export default function ANSIReference() {
    const isDark = useThemeObserver();
    const [activeTab, setActiveTab] = useState<Tab>('ansi');
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState<string>('all');

    // ─── ANSI Filtering ───
    const filteredDevices = useMemo(() => {
        let items = ANSI_DEVICES;
        if (catFilter !== 'all') items = items.filter(d => d.category === catFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter(d =>
                d.code.toLowerCase().includes(q) ||
                d.name.toLowerCase().includes(q) ||
                d.description.toLowerCase().includes(q) ||
                d.application.toLowerCase().includes(q)
            );
        }
        return items;
    }, [search, catFilter]);

    // ─── Indian Standards Filtering ───
    const [stdFilter, setStdFilter] = useState<string>('all');
    const filteredStandards = useMemo(() => {
        let items = INDIAN_STANDARDS;
        if (stdFilter !== 'all') items = items.filter(s => s.category === stdFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter(s =>
                s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.scope.toLowerCase().includes(q)
            );
        }
        return items;
    }, [search, stdFilter]);

    const tabs = [
        { id: 'ansi' as Tab, label: 'ANSI Device Numbers', icon: <Hash className="w-4 h-4" />, count: ANSI_DEVICES.length },
        { id: 'indian' as Tab, label: 'Indian Standards', icon: <Flag className="w-4 h-4" />, count: INDIAN_STANDARDS.length },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
            <SEO
                title="ANSI Device Numbers & Indian Standards Reference"
                description="Complete ANSI/IEEE C37.2 device number table, and Indian standards (IS, CEA, IEGC, CEIG) for electrical engineers."
                url="/ansi-reference"
            />

            {/* Header */}
            <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white p-2.5 rounded-lg mr-4 shadow-lg shadow-teal-500/20">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Engineering Reference</h1>
                        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
                            {ANSI_DEVICES.length} Device Codes • {INDIAN_STANDARDS.length} Standards
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSearch(''); setCatFilter('all'); setStdFilter('all'); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === tab.id ? 'bg-white/20' : isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={activeTab === 'ansi' ? 'Search by code, name, or application...' : 'Search standards...'}
                        className={`w-full pl-9 pr-8 py-3 rounded-xl border text-sm ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* ═══════ ANSI TAB ═══════ */}
                {activeTab === 'ansi' && (
                    <>
                        {/* Category filter */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <button onClick={() => setCatFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${catFilter === 'all' ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                All ({ANSI_DEVICES.length})
                            </button>
                            {Object.entries(DEVICE_CATEGORIES).map(([key, val]) => {
                                const count = ANSI_DEVICES.filter(d => d.category === key).length;
                                return (
                                    <button key={key} onClick={() => setCatFilter(key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${catFilter === key ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                        {val.label} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* Table */}
                        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={isDark ? 'bg-slate-900' : 'bg-slate-50'}>
                                            <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500 w-20">Code</th>
                                            <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500">Name</th>
                                            <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500 hidden md:table-cell">Description</th>
                                            <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500 hidden lg:table-cell">Application</th>
                                            <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500 w-24">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDevices.map((d) => {
                                            const cat = DEVICE_CATEGORIES[d.category];
                                            return (
                                                <tr key={d.code} className={`border-t ${isDark ? 'border-slate-800 hover:bg-slate-900/50' : 'border-slate-100 hover:bg-slate-50'} transition-colors`}>
                                                    <td className="px-4 py-3 font-black text-blue-500 font-mono">{d.code}</td>
                                                    <td className="px-4 py-3 font-bold">{d.name}</td>
                                                    <td className={`px-4 py-3 hidden md:table-cell ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{d.description}</td>
                                                    <td className={`px-4 py-3 hidden lg:table-cell text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{d.application}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${cat.color} ${cat.bg}`}>{cat.label}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {filteredDevices.length === 0 && (
                                <div className="text-center py-12 text-slate-500">No devices match your search.</div>
                            )}
                        </div>
                    </>
                )}


                {/* ═══════ INDIAN STANDARDS TAB ═══════ */}
                {activeTab === 'indian' && (
                    <>
                        {/* Category filter */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {['all', 'IS', 'CEA', 'IEGC', 'CEIG', 'CBIP', 'RDSO'].map(cat => {
                                const count = cat === 'all' ? INDIAN_STANDARDS.length : INDIAN_STANDARDS.filter(s => s.category === cat).length;
                                if (count === 0 && cat !== 'all') return null;
                                return (
                                    <button key={cat} onClick={() => setStdFilter(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stdFilter === cat ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                        {cat === 'all' ? 'All' : cat} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-3">
                            {filteredStandards.map((s) => (
                                <div key={s.code} className={`p-5 rounded-xl border transition-all hover:shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <div className="flex items-start gap-4">
                                        <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${s.category === 'IS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                                                s.category === 'CEA' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                                                    s.category === 'IEGC' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                                                        s.category === 'CEIG' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                                            s.category === 'CBIP' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                                                'bg-slate-100 dark:bg-slate-800 text-slate-600'
                                            }`}>
                                            {s.category}
                                        </span>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm">{s.code}</div>
                                            <div className={`font-medium text-sm mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{s.title}</div>
                                            <div className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{s.scope}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredStandards.length === 0 && (
                            <div className="text-center py-12 text-slate-500">No standards match your search.</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
