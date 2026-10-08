import React, { useState, useEffect } from 'react';
import { Menu, Truck, Sun, Moon } from 'lucide-react';
import { SyncBadge } from '../common/SyncBadge';
import { useThemeStore } from '../../stores/useThemeStore';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useThemeStore();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timePart = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setTimeStr(`${datePart} ${timePart}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="no-print print:hidden sticky top-0 z-30 h-16 bg-slate-900/90 light:bg-[#f0f4f9]/90 backdrop-blur-md border-b border-slate-800 light:border-slate-200/80 px-3 sm:px-6 md:px-8 flex items-center justify-between transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-[#0070f3] flex items-center justify-center text-white shadow-sm">
            <Truck className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-white light:text-[#0f172a] tracking-wide">CamiónControl</span>
        </div>
        <span className="text-base sm:text-lg font-extrabold text-slate-100 light:text-[#0f172a] hidden md:inline-block tracking-tight">
          Panel de Control de Flotas & Transportes
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <SyncBadge />

        {/* Indicador de estado en línea */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800 light:bg-[#dcfce7] light:text-[#15803d] light:border-[#bbf7d0]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          En línea
        </span>

        {/* Botón para cambiar entre Modo Oscuro y Modo Claro */}
        <button
          onClick={toggleTheme}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold shadow-sm focus:outline-none bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-amber-400 light:bg-white light:border-slate-200 light:text-[#0070f3] light:hover:bg-slate-50"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline text-amber-300">Modo Claro</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-[#0070f3]" />
              <span className="hidden sm:inline text-[#0f172a]">Modo Oscuro</span>
            </>
          )}
        </button>

        {/* Reloj y Fecha en tiempo real */}
        {timeStr && (
          <span className="text-xs font-mono font-bold text-slate-300 light:text-[#0f172a] hidden md:inline-block bg-slate-950/60 light:bg-white px-3 py-1.5 rounded-xl border border-slate-800 light:border-slate-200 shadow-sm">
            {timeStr}
          </span>
        )}
      </div>
    </header>
  );
};
