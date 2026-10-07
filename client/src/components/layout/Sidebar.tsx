import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  Navigation,
  DollarSign,
  Wallet,
  Receipt,
  FileSpreadsheet,
  LogOut,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, user } = useAuthStore();

  const navItems = [
    { label: 'Dashboard Resumen', path: '/', icon: LayoutDashboard },
    { label: 'Flota de Camiones', path: '/camiones', icon: Truck },
    { label: 'Gestión de Personal', path: '/personal', icon: Users },
    { label: 'Planillas de Camiones', path: '/asignaciones', icon: Navigation },
    { label: 'Gastos Operativos', path: '/transacciones', icon: DollarSign },
    { label: 'Gastos Personales', path: '/gastos-personales', icon: Wallet },
    { label: 'Planilla de Pagos', path: '/pagos', icon: Receipt },
    { label: 'Reportes & PDF', path: '/reportes', icon: FileSpreadsheet }
  ];

  return (
    <>
      {/* Backdrop móvil */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`no-print print:hidden fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white tracking-wide leading-none">CamiónControl</h1>
              <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">Gestión de Flotas</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Cerrar navegación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1 touch-scrolling">
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Módulos</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-sky-400" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 pb-safe">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="truncate max-w-[140px]">
              <p className="text-xs font-semibold text-white truncate">{user?.email || 'Usuario Logueado'}</p>
              <p className="text-[10px] text-emerald-400">● Sesión Activa</p>
            </div>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
