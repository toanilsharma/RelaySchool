
import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Activity, Zap, Layers, BookOpen, LayoutDashboard, Sun, Moon, Target,
  ClipboardCheck, Network, AlertTriangle, Calculator, Server, PieChart,
  Radar, Smartphone, FileSearch, Globe, GraduationCap, GitMerge,
  FastForward, Cpu, ChevronDown, Waves, Microscope, ShieldCheck, Wrench,
  RefreshCw, Gauge, Timer, TrendingUp, Settings, Search, X, Trophy,
  Flame, User
} from 'lucide-react';

interface SidebarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isOpen?: boolean;
  closeMobileMenu?: () => void;
}

import { ROUTE_GROUPS, GET_ALL_APP_ROUTES, RouteGroup } from '../routes';

const ALL_PATHS = GET_ALL_APP_ROUTES().map(r => r.path);

const STORAGE_KEY_GROUPS = 'rs-sidebar-groups';

const Sidebar = ({ theme, toggleTheme, isOpen, closeMobileMenu }: SidebarProps) => {
  const location = useLocation();

  // --- FIX #13: Persist sidebar group open/closed state to localStorage ---
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    const initial: Record<string, boolean> = {};
    ROUTE_GROUPS.forEach(g => { initial[g.id] = true; });
    return initial;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(openGroups)); } catch { /* ignore */ }
  }, [openGroups]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- FIX #12: Search bar state ---
  const [search, setSearch] = useState('');

  // Filter items by search query
  const filteredGroups = useMemo<RouteGroup[]>(() => {
    if (!search.trim()) return ROUTE_GROUPS;
    const q = search.toLowerCase();
    return ROUTE_GROUPS
      .map(g => ({
        ...g,
        items: g.items.filter(i => i.name.toLowerCase().includes(q) || i.path.toLowerCase().includes(q)),
      }))
      .filter(g => g.items.length > 0);
  }, [search]);

  // --- FIX #14: Active group indicator — auto-expand group that contains current route ---
  useEffect(() => {
    const currentPath = location.pathname;
    for (const group of ROUTE_GROUPS) {
      if (group.items.some(item => item.path === currentPath)) {
        setOpenGroups(prev => {
          if (prev[group.id]) return prev; // already open
          return { ...prev, [group.id]: true };
        });
        break;
      }
    }
  }, [location.pathname]);

  // --- FIX #17: Progress % and Gamification XP from localStorage ---
  const [progress, setProgress] = useState(0);
  const [userLvl, setUserLvl] = useState(1);
  const [xpPct, setXpPct] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      try {
        const visited = JSON.parse(localStorage.getItem('visitedRoutes') || '[]') as string[];
        const uniqueVisited = new Set(visited.filter(r => ALL_PATHS.includes(r)));
        setProgress(Math.round((uniqueVisited.size / ALL_PATHS.length) * 100));

        const flashcardsData = JSON.parse(localStorage.getItem('rs-flashcard-confidence') || '{}');
        const ratedCount = Object.keys(flashcardsData).filter(k => flashcardsData[k] !== 'unknown').length;

        const xp = (uniqueVisited.size * 10) + (ratedCount * 2);
        const lvl = Math.floor(1 + Math.sqrt(xp / 20));
        setUserLvl(lvl);

        const currentLevelBaseXP = 20 * Math.pow(lvl - 1, 2);
        const nextLevelBaseXP = 20 * Math.pow(lvl, 2);
        const pct = ((xp - currentLevelBaseXP) / (nextLevelBaseXP - currentLevelBaseXP)) * 100;
        setXpPct(Math.min(100, Math.max(0, pct)));
      } catch {
        setProgress(0);
        setUserLvl(1);
        setXpPct(0);
      }
    };

    updateStats();
    window.addEventListener('progress_updated', updateStats);
    window.addEventListener('storage', updateStats);
    return () => {
      window.removeEventListener('progress_updated', updateStats);
      window.removeEventListener('storage', updateStats);
    };
  }, [location.pathname]); // re-calculate on every navigation

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMobileMenu}
      />
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/80 text-slate-100 flex flex-col z-[70] transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* BRAND HEADER */}
        <Link to="/" onClick={closeMobileMenu} className="p-5 flex items-center gap-3 border-b border-slate-800/80 h-[72px] shrink-0 relative overflow-hidden group/brand hover:bg-slate-800/30 transition-colors cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent pointer-events-none group-hover/brand:from-blue-600/10 transition-all"></div>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/30 group-hover/brand:scale-105 transition-transform overflow-hidden">
            <img src="/favicon.svg" alt="RelaySchool Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight leading-none group-hover/brand:text-white transition-colors">
              Relay<span className="text-blue-400">School</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mt-0.5 group-hover/brand:text-slate-400 transition-colors">Power System Sim</div>
          </div>
        </Link>

        {/* SEARCH BAR — FIX #12 */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search modules..."
              aria-label="Search sidebar modules"
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* DASHBOARD LINK */}
        <div className="px-3 pt-2 pb-2 shrink-0">
          <NavLink
            to="/"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/30'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-[18px] h-[18px]" />
            <span className="font-semibold text-[15px]">Dashboard</span>
          </NavLink>
        </div>

        {/* GROUPED NAVIGATION */}
        <nav className="flex-1 py-2 px-3 overflow-y-auto custom-scrollbar space-y-1" aria-label="Main navigation">
          {filteredGroups.length === 0 && search && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No modules match "<span className="font-bold text-slate-400">{search}</span>"
            </div>
          )}
          {filteredGroups.map((group) => {
            // FIX #14: Highlight group whose child is the active route
            const hasActiveChild = group.items.some(item => location.pathname === item.path);
            return (
              <div key={group.id}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 mt-1 rounded-lg transition-colors group/header ${hasActiveChild ? 'bg-slate-800/50' : 'hover:bg-slate-800/40'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${group.dotColor} shadow-sm ${hasActiveChild ? 'ring-2 ring-offset-1 ring-offset-slate-900' : ''}`} style={{ boxShadow: `0 0 6px currentColor` }}></div>
                    <span className={`text-[13px] font-bold uppercase tracking-wider ${group.color}`}>{group.label}</span>
                    {hasActiveChild && <span className="text-[9px] bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase">Active</span>}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${(openGroups[group.id] || (search.trim() !== '')) ? 'rotate-0' : '-rotate-90'}`} />
                </button>

                {/* Group Items — always open when searching */}
                <div className={`overflow-hidden transition-all duration-200 ${(openGroups[group.id] || search.trim()) ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-[11px] border-l border-slate-800/60 pl-3 space-y-0.5 py-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-[9px] rounded-lg transition-all duration-150 text-[14px] ${isActive
                            ? 'bg-slate-800/80 text-white font-semibold ring-1 ring-slate-700/60'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* BOTTOM CONTROLS */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0 bg-slate-950/50">
          {/* GAMIFICATION PROFILE LINK */}
          <div className="px-3 pb-2 shrink-0">
            <NavLink
              to="/profile"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block rounded-xl border p-3 transition-colors ${isActive
                  ? 'bg-slate-800/80 border-slate-700 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 flex flex-col items-center justify-center font-bold font-mono shadow-inner shadow-black/20">
                  <span className="text-[8px] leading-none opacity-80">LVL</span>
                  <span className="text-xs leading-none mt-0.5">{userLvl}</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-200">Engineer Profile</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {progress}% Explored
                  </div>
                </div>
              </div>
              {/* XP Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </NavLink>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-xl transition-all duration-200"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-600 font-mono">v4.6.0</span>
            <span className="text-[9px] text-slate-700 font-mono uppercase tracking-wider">Grid Resilience Ed.</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
