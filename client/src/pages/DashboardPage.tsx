import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamionesStore } from '../stores/useCamionesStore';
import { usePersonalStore } from '../stores/usePersonalStore';
import { useAsignacionesStore } from '../stores/useAsignacionesStore';
import { useTransaccionesStore } from '../stores/useTransaccionesStore';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  Truck,
  Users,
  Navigation,
  DollarSign,
  PlusCircle,
  Clock,
  UserCheck,
  Zap,
  Radio
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { camiones, fetchCamiones } = useCamionesStore();
  const { personal, fetchPersonal } = usePersonalStore();
  const { asignaciones, fetchAsignaciones, initRealtimeSubscription } = useAsignacionesStore();
  const { transacciones, fetchTransacciones } = useTransaccionesStore();

  useEffect(() => {
    fetchCamiones();
    fetchPersonal();
    fetchAsignaciones();
    fetchTransacciones();
    initRealtimeSubscription();
  }, []);

  const totalCamiones = camiones.length;
  const camionesEnRuta = camiones.filter(c => c.estado === 'en_ruta').length;
  const totalPersonal = personal.filter(p => p.activo).length;
  const asignacionesHoy = asignaciones.length;
  const totalGastosMes = transacciones.reduce((acc, t) => acc + Number(t.monto), 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Resumen Operativo en Tiempo Real</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold animate-pulse">
              <Radio className="w-3 h-3" />
              Supabase Realtime
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo en vivo de unidades en ruta, choferes y personal asignado.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/asignaciones')}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Salida a Ruta
          </button>
          <button
            onClick={() => navigate('/transacciones')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Flota Total"
          value={totalCamiones}
          subtitle={`${camionesEnRuta} en ruta activa`}
          icon={Truck}
          color="sky"
        />
        <StatCard
          title="Salidas del Día"
          value={asignacionesHoy}
          subtitle="Registradas hoy"
          icon={Navigation}
          color="emerald"
        />
        <StatCard
          title="Personal Activo"
          value={totalPersonal}
          subtitle="Choferes y Ayudantes"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Gastos Totales"
          value={`$${totalGastosMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          subtitle="Gastos Operativos"
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Tablas y Secciones Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camiones en Ruta Activa hoy */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-sky-400" />
              Camiones Salidos a Ruta Hoy
            </h2>
            <button
              onClick={() => navigate('/asignaciones')}
              className="text-xs text-sky-400 hover:underline font-semibold"
            >
              Ver todas las salidas →
            </button>
          </div>

          {asignaciones.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">No hay salidas registradas para hoy</p>
              <p className="text-xs text-slate-500 mt-1">Asigna un camión y chofer para comenzar la ruta.</p>
              <button
                onClick={() => navigate('/asignaciones')}
                className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-sky-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                Registrar primera salida
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Camión</th>
                    <th className="py-3 px-4">Chofer Titular / Asignado</th>
                    <th className="py-3 px-4">Ayudantes a Bordo</th>
                    <th className="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {asignaciones.map((asig) => (
                    <tr key={asig.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">
                          {asig.camion?.codigo_interno || 'Camión'}
                        </div>
                        <div className="text-[11px] text-slate-400">Placa: {asig.camion?.placa}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {asig.chofer?.nombre || 'Sin Chofer'}
                      </td>
                      <td className="py-3.5 px-4">
                        {asig.ayudantes && asig.ayudantes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {asig.ayudantes.map((ay) => (
                              <span
                                key={ay.id}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                  ay.es_temporal
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                                }`}
                              >
                                {ay.es_temporal ? `${ay.nombre_temporal} (Libre)` : ay.personal?.nombre}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Sin ayudantes</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge type="asignacion" value={asig.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Estado Operacional de la Flota */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            Estado de la Flota
          </h2>

          <div className="space-y-3">
            {camiones.slice(0, 5).map((camion) => (
              <div
                key={camion.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{camion.codigo_interno} ({camion.placa})</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Chofer: {camion.chofer_titular?.nombre || 'No asignado'}
                  </p>
                </div>
                <Badge type="camion" value={camion.estado} />
              </div>
            ))}

            {camiones.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No hay camiones registrados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
