import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { useSegurosStore } from '../../stores/useSegurosStore';
import { diasParaVencer, hoyBolivia } from '../../services/seguros';

export const SegurosAlert: React.FC = () => {
  const { seguros, fetchSeguros, error } = useSegurosStore();
  const [hoy, setHoy] = useState(hoyBolivia);
  useEffect(() => {
    fetchSeguros();
    const refresh = () => { setHoy(hoyBolivia()); fetchSeguros(); };
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); };
  }, [fetchSeguros]);
  const vencidos = seguros.filter(s => diasParaVencer(s.fecha_vencimiento, hoy) < 0).length;
  const proximos = seguros.filter(s => { const d = diasParaVencer(s.fecha_vencimiento, hoy); return d >= 0 && d <= 5; }).length;
  if (error) return <div role="alert" className="no-print mb-5 p-3 rounded-xl border border-amber-500/30 text-amber-400 text-sm">No se pudieron comprobar los vencimientos de seguros. <Link className="underline" to="/seguros">Revisar seguros</Link></div>;
  if (!vencidos && !proximos) return null;
  return <Link to="/seguros" role="status" className="no-print mb-5 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-400 text-sm">
    <BellRing className="shrink-0" /><span><strong>Seguros pendientes de pago:</strong> {proximos} por vencer en los próximos 5 días y {vencidos} vencidos. Ver seguros →</span>
  </Link>;
};
