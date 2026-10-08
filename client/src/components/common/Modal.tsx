import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 light:bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${widthClasses[maxWidth]} max-h-[92dvh] sm:max-h-[85vh] flex flex-col bg-slate-900 light:bg-white border border-slate-800/90 light:border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-fadeIn`}
      >
        {/* Drag Indicator for mobile bottom sheet */}
        <div className="w-12 h-1 bg-slate-700/60 light:bg-slate-300 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 light:border-slate-200 bg-slate-900/95 light:bg-slate-50 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white light:text-slate-900 tracking-wide truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 sm:p-1.5 rounded-xl text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors flex-shrink-0 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto touch-scrolling flex-1 text-slate-200 light:text-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
};
