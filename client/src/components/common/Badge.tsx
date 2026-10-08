import React from 'react';
import { EstadoCamion, EstadoAsignacion, EstadoPlanilla, RolPersonal } from '../../types';

interface BadgeProps {
  type: 'camion' | 'asignacion' | 'planilla' | 'rol' | 'custom';
  value: EstadoCamion | EstadoAsignacion | EstadoPlanilla | RolPersonal | string;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, label }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let dotColor = 'bg-slate-500 dark:bg-slate-400';
  let text = label || String(value);

  if (type === 'camion') {
    switch (value) {
      case 'disponible':
        colorClasses = 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800';
        dotColor = 'bg-[#16a34a] dark:bg-emerald-400';
        text = 'Disponible';
        break;
      case 'en_ruta':
        colorClasses = 'bg-[#bbf7d0] text-[#065f46] border-[#86efac] font-bold shadow-xs dark:bg-[#052e16] dark:text-[#4ade80] dark:border-[#166534]';
        dotColor = 'bg-[#047857] dark:bg-[#4ade80]';
        text = 'En Ruta';
        break;
      case 'mantenimiento':
        colorClasses = 'bg-[#fef3c7] text-[#b45309] border-[#fde68a] dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800';
        dotColor = 'bg-[#d97706] dark:bg-amber-400';
        text = 'Mantenimiento';
        break;
      case 'fuera_servicio':
        colorClasses = 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3] dark:bg-rose-950/80 dark:text-rose-400 dark:border-rose-800';
        dotColor = 'bg-[#e11d48] dark:bg-rose-400';
        text = 'Fuera de Servicio';
        break;
    }
  } else if (type === 'asignacion') {
    switch (value) {
      case 'en_curso':
        colorClasses = 'bg-[#bbf7d0] text-[#065f46] border-[#86efac] font-bold shadow-xs dark:bg-[#052e16] dark:text-[#4ade80] dark:border-[#166534]';
        dotColor = 'bg-[#047857] dark:bg-[#4ade80]';
        text = 'En Ruta';
        break;
      case 'completado':
        colorClasses = 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800';
        dotColor = 'bg-[#16a34a] dark:bg-emerald-400';
        text = 'Completado';
        break;
      case 'cancelado':
        colorClasses = 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3] dark:bg-rose-950/80 dark:text-rose-400 dark:border-rose-800';
        dotColor = 'bg-[#e11d48] dark:bg-rose-400';
        text = 'Cancelado';
        break;
    }
  } else if (type === 'planilla') {
    switch (value) {
      case 'pendiente':
        colorClasses = 'bg-[#fef3c7] text-[#b45309] border-[#fde68a] dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800';
        dotColor = 'bg-[#d97706] dark:bg-amber-400';
        text = 'Pendiente de Pago';
        break;
      case 'pagado':
        colorClasses = 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800';
        dotColor = 'bg-[#16a34a] dark:bg-emerald-400';
        text = 'Pagado / Liquidado';
        break;
    }
  } else if (type === 'rol') {
    switch (value) {
      case 'chofer':
        colorClasses = 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe] dark:bg-indigo-950/80 dark:text-indigo-400 dark:border-indigo-800';
        dotColor = 'bg-[#2563eb] dark:bg-indigo-400';
        text = 'Chofer Titular';
        break;
      case 'ayudante':
        colorClasses = 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff] dark:bg-purple-950/80 dark:text-purple-400 dark:border-purple-800';
        dotColor = 'bg-[#9333ea] dark:bg-purple-400';
        text = 'Ayudante';
        break;
    }
  }

  return (
    <span className={`badge-pill badge-span inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs border ${colorClasses}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></span>
      <span className="whitespace-nowrap">{text}</span>
    </span>
  );
};

