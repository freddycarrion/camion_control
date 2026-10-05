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
        colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        text = 'Disponible';
        break;
      case 'en_ruta':
        colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse';
        text = 'En Ruta';
        break;
      case 'mantenimiento':
        colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        text = 'Mantenimiento';
        break;
      case 'fuera_servicio':
        colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        text = 'Fuera de Servicio';
        break;
    }
  } else if (type === 'asignacion') {
    switch (value) {
      case 'en_curso':
        colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
        text = 'En Ruta';
        break;
      case 'completado':
        colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        text = 'Completado';
        break;
      case 'cancelado':
        colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        text = 'Cancelado';
        break;
    }
  } else if (type === 'planilla') {
    switch (value) {
      case 'pendiente':
        colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        text = 'Pendiente de Pago';
        break;
      case 'pagado':
        colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        text = 'Pagado / Liquidado';
        break;
    }
  } else if (type === 'rol') {
    switch (value) {
      case 'chofer':
        colorClasses = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
        text = 'Chofer Titular';
        break;
      case 'ayudante':
        colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        text = 'Ayudante';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {text}
    </span>
  );
};
