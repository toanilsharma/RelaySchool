
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity, Zap, Layers, BookOpen, LayoutDashboard, Sun, Moon, Target,
  ClipboardCheck, Network, AlertTriangle, Calculator, Server, PieChart,
  Radar, Smartphone, FileSearch, Globe, GraduationCap, GitMerge,
  FastForward, Cpu, ChevronDown, Waves, Microscope, ShieldCheck, Wrench
} from 'lucide-react';

interface SidebarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isOpen?: boolean;
  closeMobileMenu?: () => void;
}

const tierGroups = [
  {
    id: 'fundamentals',
    label: 'Fundamentals',
    color: 'text-blue-400',
    dotColor: 'bg-blue-500',
    items: [
      { name: 'Phasor Lab', path: '/vectors', icon: Waves },
      { name: 'Digital Twin', path: '/twin', icon: Server },
    ],
  },
  {
    id: 'protection',
    label: 'Protection & Relay',
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
    items: [
      { name: 'TCC Studio', path: '/tcc', icon: Activity },
      { name: 'Distance Lab', path: '/distance', icon: Radar },
      { name: 'Diff Slope', path: '/diffslope', icon: GitMerge },
      { name: 'SymComp Lab', path: '/symcomp', icon: PieChart },
      { name: 'Relay Tester', path: '/tester', icon: ClipboardCheck },
      { name: 'Logic Sandbox', path: '/logic', icon: Cpu },
    ],
  },
  {
    id: 'studies',
    label: 'System Studies',
    color: 'text-purple-400',
    dotColor: 'bg-purple-500',
    items: [
      { name: 'SLD Builder', path: '/builder', icon: Network },
      { name: 'Fast Bus (FBTS)', path: '/fbts', icon: FastForward },
      { name: 'Power Calculators', path: '/calculators', icon: Calculator },
      { name: 'Engineer Toolkit', path: '/tools', icon: Wrench },
    ],
  },
  {
    id: 'forensic',
    label: 'Digital & Forensic',
    color: 'text-amber-400',
    dotColor: 'bg-amber-500',
    items: [
      { name: 'Comms Hub', path: '/comms', icon: Network },
      { name: 'Forensic Lab', path: '/forensic', icon: Microscope },
      { name: 'Event Analyzer', path: '/events', icon: Smartphone },
      { name: 'Failure Lab', path: '/failure', icon: AlertTriangle },
      { name: 'Case Studies', path: '/cases', icon: BookOpen },
    ],
  },
  {
    id: 'learning',
    label: 'Learning Hub',
    color: 'text-cyan-400',
    dotColor: 'bg-cyan-500',
    items: [
      { name: 'Academy', path: '/academy', icon: GraduationCap },
      { name: 'Flashcards', path: '/flashcards', icon: BookOpen },
      { name: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
      { name: 'Challenges', path: '/challenges', icon: Target },
      { name: 'Mistake Learning', path: '/mistakes', icon: AlertTriangle },
      { name: 'Smart Grid 2025', path: '/trends', icon: Globe },
    ],
  },
];

const Sidebar = ({ theme, toggleTheme, isOpen, closeMobileMenu }: SidebarProps) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    tierGroups.forEach(g => { initial[g.id] = true; });
    return initial;
  });

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMobileMenu}
      />
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/80 text-slate-100 flex flex-col z-[70] transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* BRAND HEADER */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/80 h-[72px] shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent pointer-events-none"></div>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/30">
            <Zap className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight leading-none">
              Relay<span className="text-blue-400">School</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Power System Sim</div>
          </div>
        </div>

        {/* DASHBOARD LINK */}
        <div className="px-3 pt-4 pb-2 shrink-0">
          <NavLink
            to="/"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-[18px] h-[18px]" />
            <span className="font-semibold text-sm">Dashboard</span>
          </NavLink>
        </div>

        {/* GROUPED NAVIGATION */}
        <nav className="flex-1 py-2 px-3 overflow-y-auto custom-scrollbar space-y-1">
          {tierGroups.map((group) => (
            <div key={group.id}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2 mt-1 rounded-lg hover:bg-slate-800/40 transition-colors group/header"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${group.dotColor} shadow-sm`} style={{ boxShadow: `0 0 6px currentColor` }}></div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${group.color}`}>{group.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${openGroups[group.id] ? 'rotate-0' : '-rotate-90'}`} />
              </button>

              {/* Group Items */}
              <div className={`overflow-hidden transition-all duration-200 ${openGroups[group.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="ml-[11px] border-l border-slate-800/60 pl-3 space-y-0.5 py-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-[7px] rounded-lg transition-all duration-150 text-[13px] ${
                          isActive
                            ? 'bg-slate-800/80 text-white font-semibold ring-1 ring-slate-700/60'
                            : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-200'
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
          ))}
        </nav>

        {/* BOTTOM CONTROLS */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0 bg-slate-950/50">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-xl transition-all duration-200"
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
