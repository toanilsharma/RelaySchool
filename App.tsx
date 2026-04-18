import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from './components/Toast';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import AICoach from './components/AICoach';
import ErrorBoundary from './components/ErrorBoundary';
import { Menu, Loader2, Command, Monitor, Expand } from 'lucide-react';
import { CommandPalette } from './components/UI/CommandPalette';

import { GET_ALL_APP_ROUTES, STATIC_ROUTES } from './routes';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    // Ignore non-simulator routes for progress tracking
    const ignoredPaths = ['/', '/dashboard', '/academy', '/privacy', '/terms', '/contact', '/disclaimer', '/cookies', '/about'];
    if (!ignoredPaths.includes(location.pathname)) {
      const stored = JSON.parse(localStorage.getItem('relayschool_progress') || '[]');
      if (!stored.includes(location.pathname)) {
        const next = [...stored, location.pathname];
        localStorage.setItem('relayschool_progress', JSON.stringify(next));
        window.dispatchEvent(new Event('progress_updated'));
      }
      // Also track for sidebar progress bar (visitedRoutes)
      const visited = JSON.parse(localStorage.getItem('visitedRoutes') || '[]');
      if (!visited.includes(location.pathname)) {
        visited.push(location.pathname);
        localStorage.setItem('visitedRoutes', JSON.stringify(visited));
      }
    }
  }, [location.pathname]);
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

// FIX #9: AnimatedPages defined OUTSIDE App so it is not re-created on every App render.
// Defining it inside App caused all child pages to remount on every state change.
const AnimatedPages = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex-1"
      >
        <Suspense fallback={<LoadingSpinner />}>
          <Routes location={location} key={location.pathname}>
            {/* Static top-level routes */}
            {STATIC_ROUTES.map(route => {
              const Component = route.component;
              return <Route key={route.path} path={route.path} element={<Component />} />;
            })}

            {/* Dynamic Simulator & Learning routes from Sidebar groups */}
            {GET_ALL_APP_ROUTES().map(route => {
              const Component = route.component;
              return <Route key={route.path} path={route.path} element={<Component />} />;
            })}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
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
    // FIX #1: ErrorBoundary wraps the entire app so any uncaught simulator crash
    // shows a recovery UI instead of a blank white screen.
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <RouteTracker />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased selection:bg-blue-50 selection:text-white transition-colors duration-300 flex flex-col">
          <CommandPalette />
          
          {/* UNIVERSAL DESKTOP WARNING BANNER */}
          <div className="bg-indigo-600 dark:bg-indigo-900 border-b border-indigo-700 dark:border-indigo-950 text-white text-[10px] sm:text-xs font-bold py-1.5 px-3 text-center flex items-center justify-center gap-2 shadow-sm shrink-0 w-full z-[100] relative">
            <Expand className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-90 shrink-0" />
            <span className="truncate uppercase tracking-wider">Simulators require a large screen. Best viewed on Laptop, Tablet, or using Desktop Mode.</span>
          </div>

          <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-30 shadow-md">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="font-bold text-lg flex items-center gap-2 hover:text-blue-400 transition-colors">RelaySchool</Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search tools"
              >
                <Command className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
          <Sidebar theme={theme} toggleTheme={toggleTheme} isOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />
          <main id="main-content" className="md:ml-64 p-4 md:p-8 lg:p-10 animate-fade-in min-h-screen flex flex-col">
            <AnimatedPages />
            <Footer />
          </main>
          <AICoach />
          <CookieConsent />
          <Toaster />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
