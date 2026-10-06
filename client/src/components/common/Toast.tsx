import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 z-50 flex flex-col gap-2.5 max-w-sm w-auto sm:w-full pointer-events-none pb-safe">
        {toasts.map((toast) => {
          const config = {
            success: { bg: 'bg-slate-900/95 border-emerald-500/40 text-emerald-400', icon: CheckCircle2 },
            error: { bg: 'bg-slate-900/95 border-rose-500/40 text-rose-400', icon: XCircle },
            warning: { bg: 'bg-slate-900/95 border-amber-500/40 text-amber-400', icon: AlertTriangle },
            info: { bg: 'bg-slate-900/95 border-sky-500/40 text-sky-400', icon: Info }
          }[toast.type];

          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-slideUp ${config.bg}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{toast.title}</h4>
                {toast.message && <p className="text-xs text-slate-300 mt-0.5 leading-snug">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe ser usado dentro de ToastProvider');
  return ctx;
};
