import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Search, Hash, Flag, X, ZapOff, ShieldAlert, Copy, Check } from 'lucide-react';

// ─── REALISTIC MOCK DATA ───
const DEVICE_CATEGORIES = {
    protection: { label: 'Protection', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    control: { label: 'Control', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    monitoring: { label: 'Monitoring', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    auxiliary: { label: 'Auxiliary', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

const ANSI_DEVICES = [
    { code: '21', name: 'Distance Relay', description: 'Functions when circuit admittance, impedance, or reactance increases or decreases beyond predetermined limits.', application: 'Transmission line protection', category: 'protection' },
    { code: '25', name: 'Synchronizing or Synchronism-Check Device', description: 'Operates when two AC circuits are within the desired limits of frequency, phase angle, and voltage.', application: 'Generator/Grid synchronization', category: 'control' },
    { code: '27', name: 'Undervoltage Relay', description: 'Operates when its input voltage is less than a predetermined value.', application: 'Bus protection, Motor protection', category: 'protection' },
    { code: '32', name: 'Directional Power Relay', description: 'Operates on a predetermined value of power flow in a given direction.', application: 'Anti-motoring protection', category: 'protection' },
    { code: '49', name: 'Machine or Transformer Thermal Relay', description: 'Functions when the temperature of a machine or transformer exceeds a predetermined value.', application: 'Overload thermal protection', category: 'monitoring' },
    { code: '50', name: 'Instantaneous Overcurrent Relay', description: 'Functions instantaneously on an excessive value of current.', application: 'Short circuit protection', category: 'protection' },
    { code: '51', name: 'AC Time Overcurrent Relay', description: 'Relay with either a definite or inverse time characteristic that functions when the AC input current exceeds a predetermined value.', application: 'Overload & Fault protection', category: 'protection' },
    { code: '52', name: 'AC Circuit Breaker', description: 'Device that is used to close and interrupt an AC power circuit under normal or fault conditions.', application: 'Switchgear', category: 'control' },
    { code: '86', name: 'Lockout Relay', description: 'Hand or electrically reset auxiliary relay that is operated upon the occurrence of abnormal conditions.', application: 'Master tripping circuits', category: 'auxiliary' },
    { code: '87', name: 'Differential Protective Relay', description: 'Functions on a percentage, phase angle, or other quantitative difference of two currents.', application: 'Transformer, Generator, Bus protection', category: 'protection' }
];

const INDIAN_STANDARDS = [
    { code: 'IS 2026', title: 'Power Transformers', scope: 'Specification for power transformers, including general requirements, temperature rise, and insulation levels.', category: 'IS' },
    { code: 'IS 1180', title: 'Outdoor Type Distribution Transformers', scope: 'Specifications for outdoor type Three Phase Distribution Transformers up to and including 2500 kVA, 33kV.', category: 'IS' },
    { code: 'IS 3043', title: 'Code of Practice for Earthing', scope: 'Guidelines for the design, installation, and maintenance of earthing systems for electrical installations.', category: 'IS' },
    { code: 'CEA 2010', title: 'Safety and Electric Supply Regulations', scope: 'Mandatory safety requirements for construction, operation and maintenance of electrical plants and lines.', category: 'CEA' },
    { code: 'IEGC 2023', title: 'Indian Electricity Grid Code', scope: 'Rules, guidelines and standards to be followed by participants to plan, develop, maintain and operate the power system.', category: 'IEGC' },
    { code: 'IS 7098', title: 'Crosslinked Polyethylene Insulated PVC Sheathed Cables', scope: 'Specifications for XLPE cables for working voltages from 3.3 kV up to and including 33 kV.', category: 'IS' },
    { code: 'CBIP 317', title: 'Manual on Substation Layout', scope: 'Standard practices and guidelines for layout and design of extra high voltage (EHV) substations.', category: 'CBIP' },
];

import { PageSEO } from "../components/SEO/PageSEO";

const ansiSchema = {
    "@type": "WebApplication",
    "name": "ANSI Device & Indian Standards Reference",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "WebBrowser",
    "description": "Comprehensive index of ANSI device numbers (21, 50, 51, 87) and Indian Standards (IS 2026, IS 3043) for electrical engineers.",
};

export default function ANSIReference() {
    const [activeTab, setActiveTab] = useState('ansi');
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [stdFilter, setStdFilter] = useState('all');
    const [copiedId, setCopiedId] = useState(null);

    // ─── Utility: Copy to Clipboard ───
    const handleCopy = (text, id) => {
        // Fallback approach ensures it works safely within iFrames
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
        document.body.removeChild(textArea);
    };

    // ─── Filtering Logic ───
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

    const filteredStandards = useMemo(() => {
        let items = INDIAN_STANDARDS;
        if (stdFilter !== 'all') items = items.filter(s => s.category === stdFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter(s =>
                s.code.toLowerCase().includes(q) || 
                s.title.toLowerCase().includes(q) || 
                s.scope.toLowerCase().includes(q)
            );
        }
        return items;
    }, [search, stdFilter]);

    const tabs = [
        { id: 'ansi', label: 'ANSI Device Numbers', icon: <Hash className="w-4 h-4" />, count: ANSI_DEVICES.length },
        { id: 'indian', label: 'Indian Standards', icon: <Flag className="w-4 h-4" />, count: INDIAN_STANDARDS.length },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
            <PageSEO 
                title="ANSI & IS Standards Reference"
                description="Instant lookup for ANSI device numbers and Indian Electrical Standards. Master the language of protection engineering."
                url="/ansi-reference"
                schema={ansiSchema}
                keywords={["ANSI numbers", "IS standards", "electrical engineering", "protection relay codes"]}
            />
            {/* ─── Header ─── */}
            <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2.5 rounded-xl mr-4 shadow-lg shadow-blue-500/20">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Engineering Reference</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-widest uppercase mt-0.5">
                            {ANSI_DEVICES.length} Device Codes • {INDIAN_STANDARDS.length} Standards
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* ─── Controls ─── */}
                <div className="mb-6 space-y-4">
                    {/* Tabs */}
                    <div role="tablist" aria-label="Reference Categories" className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`${tab.id}-panel`}
                                    id={`${tab.id}-tab`}
                                    onClick={() => { setActiveTab(tab.id); setSearch(''); setCatFilter('all'); setStdFilter('all'); }}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                                        isActive
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={activeTab === 'ansi' ? 'Search by code, name, or application (e.g. "Overcurrent", "51")...' : 'Search standards by code or keyword (e.g. "IS 2026", "Transformer")...'}
                            className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm text-sm"
                        />
                        {search && (
                            <button 
                                onClick={() => setSearch('')} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── ANSI TAB CONTENT ─── */}
                {activeTab === 'ansi' && (
                    <div id="ansi-panel" role="tabpanel" aria-labelledby="ansi-tab" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Category filter */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <button 
                                onClick={() => setCatFilter('all')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    catFilter === 'all' 
                                    ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-sm' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}>
                                All ({ANSI_DEVICES.length})
                            </button>
                            {Object.entries(DEVICE_CATEGORIES).map(([key, val]) => {
                                const count = ANSI_DEVICES.filter(d => d.category === key).length;
                                return (
                                    <button 
                                        key={key} 
                                        onClick={() => setCatFilter(key)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                            catFilter === key 
                                            ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-sm' 
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}>
                                        {val.label} <span className="opacity-60 ml-1">({count})</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Table View */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-sm">
                                        <tr>
                                            <th scope="col" className="px-5 py-4 font-bold w-24 border-b border-slate-200 dark:border-slate-800">Code</th>
                                            <th scope="col" className="px-5 py-4 font-bold border-b border-slate-200 dark:border-slate-800">Name</th>
                                            <th scope="col" className="px-5 py-4 font-bold hidden md:table-cell border-b border-slate-200 dark:border-slate-800">Description</th>
                                            <th scope="col" className="px-5 py-4 font-bold hidden lg:table-cell border-b border-slate-200 dark:border-slate-800 w-1/4">Application</th>
                                            <th scope="col" className="px-5 py-4 font-bold w-32 border-b border-slate-200 dark:border-slate-800">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {filteredDevices.map((d) => {
                                            const cat = DEVICE_CATEGORIES[d.category];
                                            const isCopied = copiedId === `ansi-${d.code}`;
                                            return (
                                                <tr key={d.code} className="even:bg-slate-50/50 dark:even:bg-slate-800/20 hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors group">
                                                    <td className="px-5 py-4 font-black text-blue-600 dark:text-blue-400 font-mono text-base">
                                                        <div className="flex items-center gap-2">
                                                            {d.code}
                                                            <button 
                                                                onClick={() => handleCopy(d.code, `ansi-${d.code}`)}
                                                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 hover:bg-blue-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all outline-none focus:ring-2 focus:ring-blue-500/50"
                                                                title="Copy Code"
                                                                aria-label={`Copy ANSI code ${d.code}`}
                                                            >
                                                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100">
                                                        {d.name}
                                                    </td>
                                                    <td className="px-5 py-4 hidden md:table-cell text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        {d.description}
                                                    </td>
                                                    <td className="px-5 py-4 hidden lg:table-cell text-slate-500 dark:text-slate-500 text-xs">
                                                        {d.application}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center justify-center text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border border-white/5 dark:border-black/5 shadow-sm ${cat.color} ${cat.bg}`}>
                                                            {cat.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Empty State */}
                            {filteredDevices.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <ZapOff className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No devices found</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">We couldn't find any ANSI codes matching your current search or filter criteria.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── INDIAN STANDARDS TAB CONTENT ─── */}
                {activeTab === 'indian' && (
                    <div id="indian-panel" role="tabpanel" aria-labelledby="indian-tab" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Category filter */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {['all', 'IS', 'CEA', 'IEGC', 'CBIP'].map(cat => {
                                const count = cat === 'all' ? INDIAN_STANDARDS.length : INDIAN_STANDARDS.filter(s => s.category === cat).length;
                                if (count === 0 && cat !== 'all') return null;
                                return (
                                    <button 
                                        key={cat} 
                                        onClick={() => setStdFilter(cat)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                            stdFilter === cat 
                                            ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-sm' 
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}>
                                        {cat === 'all' ? 'All Standards' : cat} <span className="opacity-60 ml-1">({count})</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Card List View */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredStandards.map((s) => (
                                <div key={s.code} className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50">
                                    <div className="flex items-start gap-4">
                                        <span className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide uppercase shadow-sm ${
                                            s.category === 'IS' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                                            s.category === 'CEA' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                            s.category === 'IEGC' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' :
                                            s.category === 'CBIP' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}>
                                            {s.category}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-base font-mono">{s.code}</h3>
                                                    <button 
                                                        onClick={() => handleCopy(s.code, `std-${s.code}`)}
                                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all outline-none focus:ring-2 focus:ring-blue-500/50"
                                                        title="Copy Standard Code"
                                                        aria-label={`Copy standard code ${s.code}`}
                                                    >
                                                        {copiedId === `std-${s.code}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-2 leading-snug">
                                                {s.title}
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {s.scope}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredStandards.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No standards found</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">Try adjusting your search terms or exploring a different standard category.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}