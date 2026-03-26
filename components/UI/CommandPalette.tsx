import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, CornerDownLeft, Sparkles, Zap, Activity, Radar, PieChart, ShieldCheck } from 'lucide-react';
import { ROUTE_GROUPS, GET_ALL_APP_ROUTES } from '../../routes';

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const allRoutes = GET_ALL_APP_ROUTES();
    const filteredRoutes = query === '' 
        ? allRoutes.slice(0, 8) 
        : allRoutes.filter(route => 
            route.name.toLowerCase().includes(query.toLowerCase()) || 
            route.id.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 10);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredRoutes.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredRoutes.length) % filteredRoutes.length);
        } else if (e.key === 'Enter' && filteredRoutes[selectedIndex]) {
            handleSelect(filteredRoutes[selectedIndex].path);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    />

                    {/* Palette */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-4 border-b border-slate-800 gap-3 group">
                            <Search className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                ref={inputRef}
                                type="text"
                                placeholder="Search machines, tools, theory..."
                                className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 text-lg font-medium"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                onKeyDown={onKeyDown}
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400">ESC</span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                            {filteredRoutes.length > 0 ? (
                                <div className="space-y-1">
                                    {filteredRoutes.map((route, index) => {
                                        const Icon = route.icon;
                                        const isSelected = index === selectedIndex;
                                        return (
                                            <button
                                                key={route.id}
                                                onClick={() => handleSelect(route.path)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                                                    isSelected ? 'bg-blue-600 shadow-lg shadow-blue-900/40 text-white' : 'hover:bg-slate-800/50 text-slate-400'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-800'}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{route.name}</div>
                                                        <div className={`text-[10px] uppercase tracking-wider font-bold opacity-60`}>{route.path}</div>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold opacity-60">Navigate</span>
                                                        <CornerDownLeft className="w-3 h-3 opacity-60" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-4">
                                    <Sparkles className="w-8 h-8 opacity-20" />
                                    <p className="text-sm font-medium">No engineering tools found for "{query}"</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Hints */}
                        <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                    <div className="p-1 px-1.5 bg-slate-800 rounded border border-slate-700 text-slate-400">↑↓</div>
                                    <span>Select</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                    <div className="p-1 px-1.5 bg-slate-800 rounded border border-slate-700 text-slate-400">ENTER</div>
                                    <span>Open</span>
                                </div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                <Zap className="w-3 h-3" />
                                <span>Spotlight Search v2.0</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
