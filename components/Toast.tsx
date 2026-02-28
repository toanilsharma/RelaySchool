import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: ((toasts: Toast[]) => void)[] = [];

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  add(message: string, type: ToastType = 'info') {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = { id, message, type };
    this.toasts = [...this.toasts, toast];
    this.notify();
    setTimeout(() => this.remove(id), 3000);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l([...this.toasts]));
  }
}

export const toastManager = new ToastManager();

export const toast = {
  success: (msg: string) => toastManager.add(msg, 'success'),
  error: (msg: string) => toastManager.add(msg, 'error'),
  info: (msg: string) => toastManager.add(msg, 'info'),
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl pointer-events-auto border backdrop-blur-md 
              ${t.type === 'success' ? 'bg-emerald-50/90 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-100' : 
                t.type === 'error' ? 'bg-red-50/90 dark:bg-red-900/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-100' : 
                'bg-blue-50/90 dark:bg-blue-900/90 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-100'}`}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {t.type === 'info' && <Info className="w-5 h-5" />}
            <span className="text-sm font-bold tracking-tight">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
