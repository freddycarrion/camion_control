import React from 'react';
import { EstadoCamion, EstadoAsignacion, EstadoPlanilla, RolPersonal } from '../../types';

interface BadgeProps {
  type: 'camion' | 'asignacion' | 'planilla' | 'rol' | 'custom';
  value: EstadoCamion | EstadoAsignacion | EstadoPlanilla | RolPersonal | string;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, label }) => {
  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let text = label || String(value);

  if (type === 'camion') {
    switch (value) {
      case 'disponible':
        colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-800 light:bg-emerald-100 light:text-emerald-700 light:border-emerald-300';
        text = 'Disponible';
        break;
      case 'en_ruta':
        colorClasses = 'bg-[#052e16] text-[#4ade80] border-[#166534] light:bg-emerald-100 light:text-emerald-700 light:border-emerald-300 font-bold';
        text = 'En Ruta';
        break;
      case 'mantenimiento':
        colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-800 light:bg-amber-100 light:text-amber-700 light:border-amber-300';
        text = 'Mantenimiento';
        break;
      case 'fuera_servicio':
        colorClasses = 'bg-rose-950/80 text-rose-400 border-rose-800 light:bg-rose-100 light:text-rose-700 light:border-rose-300';
        text = 'Fuera de Servicio';
        break;
    }
  } else if (type === 'asignacion') {
    switch (value) {
      case 'en_curso':
        colorClasses = 'bg-[#052e16] text-[#4ade80] border-[#166534] light:bg-emerald-100 light:text-emerald-700 light:border-emerald-300 font-bold';
        text = 'En Ruta';
        break;
      case 'completado':
        colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-800 light:bg-emerald-100 light:text-emerald-700 light:border-emerald-300';
        text = 'Completado';
        break;
      case 'cancelado':
        colorClasses = 'bg-rose-950/80 text-rose-400 border-rose-800 light:bg-rose-100 light:text-rose-700 light:border-rose-300';
        text = 'Cancelado';
        break;
    }
  } else if (type === 'planilla') {
    switch (value) {
      case 'pendiente':
        colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-800 light:bg-amber-100 light:text-amber-700 light:border-amber-300';
        text = 'Pendiente de Pago';
        break;
      case 'pagado':
        colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-800 light:bg-emerald-100 light:text-emerald-700 light:border-emerald-300';
        text = 'Pagado / Liquidado';
        break;
    }
  } else if (type === 'rol') {
    switch (value) {
      case 'chofer':
        colorClasses = 'bg-indigo-950/80 text-indigo-400 border-indigo-800 light:bg-indigo-100 light:text-indigo-700 light:border-indigo-300';
        text = 'Chofer Titular';
        break;
      case 'ayudante':
        colorClasses = 'bg-purple-950/80 text-purple-400 border-purple-800 light:bg-purple-100 light:text-purple-700 light:border-purple-300';
        text = 'Ayudante';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {text}
    </span>
  );
};
