import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 p-4 z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-fade-in print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-300">
          <p>
            <strong>We value your privacy.</strong> We use cookies and local storage to enhance your user experience, 
            analyze site traffic, and serve personalized content. By using our services, you agree to our{' '}
            <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Privacy Policy</Link> and{' '}
            <Link to="/terms" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Terms of Service</Link>.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={accept} 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            Accept All
          </button>
          <button 
            onClick={() => setIsVisible(false)} 
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;