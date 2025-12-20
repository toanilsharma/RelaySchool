
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Academy from './pages/Academy';
import TCCStudio from './pages/TCCStudio';
import DigitalTwin from './pages/DigitalTwin';
import FailureLab from './pages/FailureLab';
import ForensicLab from './pages/ForensicLab';
import KnowledgeEngine from './pages/KnowledgeEngine';
import Challenges from './pages/Challenges';
import RelayTester from './pages/RelayTester';
import CommsHub from './pages/CommsHub';
import MistakeLearning from './pages/MistakeLearning';
import EngineerToolkit from './pages/EngineerToolkit';
import DigitalSubstation from './pages/DigitalSubstation';
import SymComponents from './pages/SymComponents';
import DistanceLab from './pages/DistanceLab';
import EventAnalyzer from './pages/EventAnalyzer';
import VectorLab from './pages/VectorLab';
import SmartGridTrends from './pages/SmartGridTrends';
import FastBusTransfer from './pages/FastBusTransfer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import DiffSlope from './pages/DiffSlope';
import CookieConsent from './components/CookieConsent';
import AICoach from './components/AICoach';
import { Menu } from 'lucide-react';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <HashRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased selection:bg-blue-50 selection:text-white transition-colors duration-300">
        <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-30 shadow-md">
             <div className="font-bold text-lg flex items-center gap-2">RelaySchool</div>
             <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Menu className="w-6 h-6" /></button>
        </div>
        <Sidebar theme={theme} toggleTheme={toggleTheme} isOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />
        <main className="md:ml-64 p-4 md:p-8 lg:p-10 animate-fade-in min-h-screen flex flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/tcc" element={<TCCStudio />} />
              <Route path="/fbts" element={<FastBusTransfer />} />
              <Route path="/symcomp" element={<SymComponents />} />
              <Route path="/distance" element={<DistanceLab />} />
              <Route path="/diffslope" element={<DiffSlope />} />
              <Route path="/twin" element={<DigitalTwin />} />
              <Route path="/vectors" element={<VectorLab />} />
              <Route path="/forensic" element={<ForensicLab />} />
              <Route path="/failure" element={<FailureLab />} />
              <Route path="/events" element={<EventAnalyzer />} />
              <Route path="/tester" element={<RelayTester />} />
              <Route path="/comms" element={<CommsHub />} />
              <Route path="/digital-substation" element={<DigitalSubstation />} />
              <Route path="/knowledge" element={<KnowledgeEngine />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/mistakes" element={<MistakeLearning />} />
              <Route path="/trends" element={<SmartGridTrends />} />
              <Route path="/tools" element={<EngineerToolkit />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </main>
        <AICoach />
        <CookieConsent />
      </div>
    </HashRouter>
  );
};

export default App;
