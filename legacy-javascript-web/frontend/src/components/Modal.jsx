import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Clean Soft Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/40 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Clean White Modal Dialog */}
        <div 
          className={`relative transform overflow-hidden rounded-2xl bg-[#FFFFFF] text-left shadow-modal transition-all sm:my-8 w-full ${maxWidth} border border-stone-200/80 animate-slide-up`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100">
            <h3 className="text-base font-bold text-[#1E1B16] font-heading">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-[#6B6560] hover:text-[#1E1B16] flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
