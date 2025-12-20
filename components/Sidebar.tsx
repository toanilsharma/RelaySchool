
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Zap, Layers, BookOpen, LayoutDashboard, Settings, Sun, Moon, Target, ClipboardCheck, Network, AlertTriangle, Calculator, Server, PieChart, Radar, Smartphone, FileSearch, Globe, GraduationCap, GitMerge, FastForward } from 'lucide-react';

interface SidebarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isOpen?: boolean;
  closeMobileMenu?: () => void;
}

const Sidebar = ({ theme, toggleTheme, isOpen, closeMobileMenu }: SidebarProps) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Academy', path: '/academy', icon: GraduationCap },
    { name: 'TCC Studio', path: '/tcc', icon: Activity },
    { name: 'Fast Bus (FBTS)', path: '/fbts', icon: FastForward },
    { name: 'Distance Lab', path: '/distance', icon: Radar },
    { name: 'Diff Slope', path: '/diffslope', icon: GitMerge },
    { name: 'Phasor Lab', path: '/vectors', icon: PieChart },
    { name: 'SymComp Lab', path: '/symcomp', icon: PieChart },
    { name: 'Digital Twin', path: '/twin', icon: Zap },
    { name: 'Forensic Lab', path: '/forensic', icon: FileSearch },
    { name: 'Failure Lab', path: '/failure', icon: Layers },
    { name: 'Event Analyzer', path: '/events', icon: Smartphone },
    { name: 'Relay Tester', path: '/tester', icon: ClipboardCheck },
    { name: 'Comms Hub', path: '/comms', icon: Network },
    { name: 'Digital Substation', path: '/digital-substation', icon: Server },
    { name: 'Mistake Learning', path: '/mistakes', icon: AlertTriangle },
    { name: 'Smart Grid 2025', path: '/trends', icon: Globe },
    { name: 'Engineer Tools', path: '/tools', icon: Calculator },
    { name: 'Knowledge', path: '/knowledge', icon: BookOpen },
    { name: 'Challenges', path: '/challenges', icon: Target },
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-[60] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeMobileMenu} />
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-700 text-slate-100 flex flex-col z-[70] transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-700 h-20">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Zap className="text-white w-5 h-5" />
          </div>
          <div className="font-bold text-lg tracking-tight">Relay<span className="text-blue-400">School</span></div>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={closeMobileMenu} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="mt-4 px-4 text-xs text-slate-600 font-mono">v4.6.0 (Grid Resilience Ed.)</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
