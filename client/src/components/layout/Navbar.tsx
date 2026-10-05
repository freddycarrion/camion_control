import React from 'react';
import { Menu } from 'lucide-react';
import { SyncBadge } from '../common/SyncBadge';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-slate-300 hidden sm:inline-block">
          Panel de Control de Transporte
        </span>
      </div>

      <div className="flex items-center gap-4">
        <SyncBadge />
      </div>
    </header>
  );
};
