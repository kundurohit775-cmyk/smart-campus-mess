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
      {/* Backdrop with 8px blur */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Modal Dialog with Level 3 shadow and scale-in animation */}
        <div 
          className={`relative transform overflow-hidden rounded-modal bg-white text-left shadow-level-3 transition-all sm:my-8 w-full ${maxWidth} border border-border animate-scale-in`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-divider">
            <h3 className="text-h3 text-ink">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FAFAFB] text-muted hover:text-ink hover:bg-slate-100 flex items-center justify-center transition"
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
