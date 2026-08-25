import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Frosted Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
        />

        {/* Modal Dialog */}
        <div className={`relative w-full ${maxWidth} transform overflow-hidden rounded-3xl bg-white p-6 sm:p-7 text-left shadow-stripe-lg transition-all border border-slate-200/90 animate-scale-in relative`}>
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
