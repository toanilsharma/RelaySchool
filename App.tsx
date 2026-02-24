import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import AICoach from './components/AICoach';
import { Menu, Loader2 } from 'lucide-react';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Academy = lazy(() => import('./pages/Academy'));
const TCCStudio = lazy(() => import('./pages/TCCStudio'));
const DigitalTwin = lazy(() => import('./pages/DigitalTwin'));
const FailureLab = lazy(() => import('./pages/FailureLab'));
const ForensicLab = lazy(() => import('./pages/ForensicLab'));
const KnowledgeEngine = lazy(() => import('./pages/KnowledgeEngine'));
const Challenges = lazy(() => import('./pages/Challenges'));
const RelayTester = lazy(() => import('./pages/RelayTester'));
const CommsHub = lazy(() => import('./pages/CommsHub'));
const MistakeLearning = lazy(() => import('./pages/MistakeLearning'));
const EngineerToolkit = lazy(() => import('./pages/EngineerToolkit'));
const DigitalSubstation = lazy(() => import('./pages/DigitalSubstation'));
const SymComponents = lazy(() => import('./pages/SymComponents'));
const DistanceLab = lazy(() => import('./pages/DistanceLab'));
const EventAnalyzer = lazy(() => import('./pages/EventAnalyzer'));
const VectorLab = lazy(() => import('./pages/VectorLab'));
const SmartGridTrends = lazy(() => import('./pages/SmartGridTrends'));
const FastBusTransfer = lazy(() => import('./pages/FastBusTransfer'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Contact = lazy(() => import('./pages/Contact'));
const DiffSlope = lazy(() => import('./pages/DiffSlope'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const LoadingSpinner = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="text-sm font-medium text-slate-500">Loading Module...</span>
    </div>
  </div>
);

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
            <Suspense fallback={<LoadingSpinner />}>
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
            </Suspense>
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
