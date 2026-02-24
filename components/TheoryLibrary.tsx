import React, { useState } from 'react';
import { 
    BookOpen, ChevronRight, Lightbulb, AlertTriangle, 
    Shield, CheckCircle2, Bookmark, ArrowRight, Menu, X,
    ExternalLink, GraduationCap, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
export type TheorySection = {
    id: string;
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    content: React.ReactNode;
};

export type TheoryLibraryProps = {
    title: string;
    description: string;
    sections: TheorySection[];
};

// --- COMPONENTS ---

// Components moved to TheoryComponents.tsx

// --- MAIN LAYOUT ---

const TheoryLibrary = ({ title, description, sections = [] }: TheoryLibraryProps) => {
    const [activeId, setActiveId] = useState((sections && sections.length > 0) ? sections[0].id : '');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!sections || sections.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-950 text-slate-500">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No theory content available.</p>
                </div>
            </div>
        );
    }

    const activeSection = sections.find(s => s.id === activeId) || sections[0];

    return (
        <div className="flex flex-col lg:flex-row h-full bg-slate-50 dark:bg-slate-950">
            {/* Sidebar Navigation */}
            <div className={`
                fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity
                ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `} onClick={() => setMobileMenuOpen(false)} />

            <div className={`
                fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out shrink-0
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                             <GraduationCap className="w-4 h-4 text-blue-600" /> Theory Library
                        </h2>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1 hover:bg-slate-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4 space-y-1 overflow-y-auto h-[calc(100%-60px)]">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => { setActiveId(section.id); setMobileMenuOpen(false); }}
                            className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden
                                ${activeId === section.id 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                {section.icon && <section.icon className={`w-4 h-4 ${activeId === section.id ? 'text-blue-200' : 'text-slate-400'}`} />}
                                <span>{section.title}</span>
                            </div>
                            {activeId === section.id && (
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 h-full overflow-y-auto relative scroll-smooth">
                {/* Mobile Header Toggle */}
                <div className="lg:hidden p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 sticky top-0 z-30">
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg">
                        <Menu className="w-6 h-6 text-slate-600" />
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white truncate">{activeSection.title}</span>
                </div>

                <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
                    {/* Header */}
                    <header className="mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
                            RelaySchool Knowledge Base
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                            {title}
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed border-l-4 border-slate-200 dark:border-slate-800 pl-4">
                            {description}
                        </p>
                    </header>

                    {/* Active Section Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    {activeSection.icon ? <activeSection.icon className="w-8 h-8 text-slate-700 dark:text-slate-300" /> : <BookOpen className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{activeSection.title}</h2>
                                    {activeSection.subtitle && <p className="text-slate-500 dark:text-slate-500 font-medium">{activeSection.subtitle}</p>}
                                </div>
                            </div>

                            <div className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-600 dark:text-slate-300">
                                {activeSection.content}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                    
                    {/* Navigation Footer */}
                    <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                         {/* Logic to find prev/next could go here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TheoryLibrary;
