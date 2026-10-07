import React from 'react';
import { Menu, Truck } from 'lucide-react';
import { SyncBadge } from '../common/SyncBadge';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  return (
    <header className="no-print print:hidden sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Truck className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-white tracking-wide">CamiónControl</span>
        </div>
        <span className="text-sm font-semibold text-slate-300 hidden md:inline-block">
          Panel de Control de Flotas & Transportes
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <SyncBadge />
      </div>
    </header>
  );
};
