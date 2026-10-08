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
  User,
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
        className={`no-print print:hidden fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#06132b] border-r border-[#0d2854] text-white transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#0d2854] bg-[#06132b] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0070f3] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white tracking-wide leading-none">CamiónControl</h1>
              <span className="text-[10px] text-[#38bdf8] font-extrabold tracking-wider uppercase">GESTIÓN DE FLOTAS</span>
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
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1.5 touch-scrolling">
          <p className="px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">MÓDULOS</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0070f3] text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-[#0c2450]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#38bdf8]'}`} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-3.5 border-t border-[#0d2854] bg-[#06132b] pb-safe">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#0070f3] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.email || 'freddycarrion@gmail.com'}</p>
                <p className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sesión Activa
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
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
