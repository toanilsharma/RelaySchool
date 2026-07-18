import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from './components/Toast';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ErrorBoundary';
import RoutePreloader from './components/RoutePreloader';
import { Menu, Loader2, Command, Monitor, Expand, X } from 'lucide-react';
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
        className="flex-1 flex flex-col h-full"
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

const DesktopWarningBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('hasSeenDesktopWarning');
    if (!hasSeen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('hasSeenDesktopWarning', 'true');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenDesktopWarning', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="bg-blue-600 dark:bg-indigo-900 text-white text-[10px] sm:text-xs font-bold px-3 text-center flex items-center justify-between gap-2 shadow-lg shrink-0 w-full z-[100] relative overflow-hidden"
        >
          <div className="flex-1 py-2 flex items-center justify-center gap-2">
            <Monitor className="w-3.5 h-3.5 opacity-90 animate-pulse" />
            <span className="uppercase tracking-wider">Simulators require a large screen. Best viewed on Laptop, Tablet, or Desktop Mode.</span>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AppLayout = ({ theme, toggleTheme, mobileMenuOpen, setMobileMenuOpen }: any) => {
  const location = useLocation();
  const isFullscreenApp = location.pathname === '/tcc';

  return (
        <div className={`bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased selection:bg-blue-50 selection:text-white transition-colors duration-300 flex flex-col ${isFullscreenApp ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
          <CommandPalette />
          
          {/* UNIVERSAL DESKTOP WARNING BANNER */}
          <DesktopWarningBanner />

          {!isFullscreenApp && (
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
          )}
          
          {!isFullscreenApp && <Sidebar theme={theme} toggleTheme={toggleTheme} isOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />}
          
          <main id="main-content" className={`${isFullscreenApp ? 'w-full p-0 flex-1 h-0 overflow-hidden' : 'md:ml-64 p-4 md:p-8 lg:p-10 min-h-screen'} animate-fade-in flex flex-col`}>
            <AnimatedPages />
            {!isFullscreenApp && <Footer />}
          </main>
          
          
          <CookieConsent />
          <Toaster />
        </div>
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
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <RouteTracker />
        {/* Silently prefetch all lazy route chunks after app shell renders */}
        <RoutePreloader />
        <AppLayout theme={theme} toggleTheme={toggleTheme} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
