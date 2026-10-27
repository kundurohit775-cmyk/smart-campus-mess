import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
        {toasts.map(toast => {
          let bg = 'bg-white text-[#1E1B16] border-stone-200 shadow-modal';
          let icon = <Info className="w-5 h-5 text-[#2563EB] shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-emerald-50 text-emerald-950 border-emerald-200 shadow-modal';
            icon = <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-50 text-amber-950 border-amber-200 shadow-modal';
            icon = <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-red-50 text-red-950 border-red-200 shadow-modal';
            icon = <XCircle className="w-5 h-5 text-[#DC2626] shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border transition-all animate-slide-up ${bg}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-medium leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-stone-400 hover:text-stone-700 transition p-1 ml-2"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
