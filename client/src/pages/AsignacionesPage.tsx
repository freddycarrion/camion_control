import React, { useState, useEffect } from 'react';
import { useAsignacionesStore } from '../stores/useAsignacionesStore';
import { useCamionesStore } from '../stores/useCamionesStore';
import { usePersonalStore } from '../stores/usePersonalStore';
import { EstadoAsignacion } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { Navigation, Plus, Calendar, Trash2, UserPlus, X } from 'lucide-react';

interface AyudanteFormItem {
  es_temporal: boolean;
  personal_id?: string;
  nombre_temporal?: string;
}

export const AsignacionesPage: React.FC = () => {
  const { asignaciones, fetchAsignaciones, addAsignacion, updateEstado, deleteAsignacion, initRealtimeSubscription } = useAsignacionesStore();
  const { camiones, fetchCamiones } = useCamionesStore();
  const { personal, fetchPersonal } = usePersonalStore();
  const { showToast } = useToast();

  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [camionId, setCamionId] = useState('');
  const [choferId, setChoferId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [ayudantesList, setAyudantesList] = useState<AyudanteFormItem[]>([]);

  useEffect(() => {
    fetchAsignaciones(fechaFiltro);
    fetchCamiones();
    fetchPersonal();
    initRealtimeSubscription();
  }, [fechaFiltro]);

  const ayudantesPlantilla = personal.filter(p => p.rol === 'ayudante' && p.activo);
  const choferesPlantilla = personal.filter(p => p.rol === 'chofer' && p.activo);
  const camionesDisponibles = camiones.filter(c => c.estado === 'disponible' || c.estado === 'en_ruta');

  const handleOpenModal = () => {
    setCamionId('');
    setChoferId('');
    setObservaciones('');
    setAyudantesList([]);
    setIsModalOpen(true);
  };

  const handleAddAyudanteSlot = (esTemp: boolean) => {
    setAyudantesList(prev => [...prev, { es_temporal: esTemp, personal_id: '', nombre_temporal: '' }]);
  };

  const handleRemoveAyudanteSlot = (index: number) => {
    setAyudantesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleCamionChange = (id: string) => {
    setCamionId(id);
    const cam = camiones.find(c => c.id === id);
    if (cam && cam.chofer_titular_id) {
      setChoferId(cam.chofer_titular_id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camionId) {
      showToast('warning', 'Camión Requerido', 'Selecciona una unidad para la salida.');
      return;
    }

    try {
      await addAsignacion({
        fecha: fechaFiltro,
        camion_id: camionId,
        chofer_id: choferId || null,
        observaciones,
        ayudantes: ayudantesList
      });

      showToast('success', 'Salida Registrada', 'La unidad ha sido asignada a ruta correctamente.');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Error al registrar salida', err.message);
    }
  };

  const handleEstadoChange = async (id: string, nuevoEstado: EstadoAsignacion) => {
    try {
      await updateEstado(id, nuevoEstado);
      showToast('success', 'Estado Actualizado', `Asignación cambiada a ${nuevoEstado}.`);
    } catch (err: any) {
      showToast('error', 'Error al actualizar', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Deseas cancelar/eliminar esta asignación de salida?')) {
      try {
        await deleteAsignacion(id);
        showToast('info', 'Asignación Eliminada', 'Se removió la salida de la ruta.');
      } catch (err: any) {
        showToast('error', 'Error al eliminar', err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Navigation className="w-7 h-7 text-sky-400" />
            Salidas del Día & Rutas Operativas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Asignación diaria de camiones, choferes y tripulación de ayudantes (Plantilla y Libres Temporales).
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Salida de Camión
        </button>
      </div>

      {/* Selector de Fecha */}
      <div className="flex items-center gap-3 glass-card p-3 w-fit">
        <Calendar className="w-4 h-4 text-sky-400" />
        <span className="text-xs font-semibold text-slate-300">Fecha de Ruta:</span>
        <input
          type="date"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
          className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Lista de Asignaciones */}
      <div className="space-y-4">
        {asignaciones.map((asig) => (
          <div
            key={asig.id}
            className="glass-panel p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-white bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                  {asig.camion?.codigo_interno || 'Camión'} ({asig.camion?.placa})
                </span>
                <Badge type="asignacion" value={asig.estado} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Chofer Titular / Asignado:</span>
                  <span className="font-bold text-sky-300">{asig.chofer?.nombre || 'Sin Chofer'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Ayudantes A Bordo:</span>
                  {asig.ayudantes && asig.ayudantes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {asig.ayudantes.map((ay) => (
                        <span
                          key={ay.id}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                            ay.es_temporal
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                          }`}
                        >
                          {ay.es_temporal ? `🔥 ${ay.nombre_temporal} (Temporal Libre)` : `👤 ${ay.personal?.nombre}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Sin ayudantes registrados</span>
                  )}
                </div>
              </div>

              {asig.observaciones && (
                <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                  Notas: {asig.observaciones}
                </p>
              )}
            </div>

            {/* Acciones de Estado */}
            <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              {asig.estado === 'en_curso' && (
                <button
                  onClick={() => handleEstadoChange(asig.id, 'completado')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
                >
                  Finalizar Ruta
                </button>
              )}
              {asig.estado !== 'cancelado' && (
                <button
                  onClick={() => handleEstadoChange(asig.id, 'cancelado')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs border border-amber-500/30 transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => handleDelete(asig.id)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                title="Eliminar registro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {asignaciones.length === 0 && (
          <div className="text-center py-12 glass-panel">
            <p className="text-sm font-semibold text-slate-400">No hay salidas a ruta en la fecha seleccionada.</p>
          </div>
        )}
      </div>

      {/* Modal Registrar Salida */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Salida de Ruta del Día"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Seleccionar Camión *
              </label>
              <select
                value={camionId}
                onChange={(e) => handleCamionChange(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Seleccionar Unidad --</option>
                {camionesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo_interno} ({c.placa}) - {c.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Chofer a Cargo
              </label>
              <select
                value={choferId}
                onChange={(e) => setChoferId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Asignar Chofer --</option>
                {choferesPlantilla.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nombre} (Tel: {ch.telefono || 'S/N'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sección de Ayudantes */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Ayudantes Asignados
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddAyudanteSlot(false)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Ayudante Plantilla
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAyudanteSlot(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Ayudante Libre (Temporal)
                </button>
              </div>
            </div>

            {ayudantesList.map((item, index) => (
              <div key={index} className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 w-6">#{index + 1}</span>
                {item.es_temporal ? (
                  <input
                    type="text"
                    value={item.nombre_temporal || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAyudantesList(prev => prev.map((ay, i) => i === index ? { ...ay, nombre_temporal: val } : ay));
                    }}
                    placeholder="Nombre completo de ayudante libre temporal..."
                    required
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                ) : (
                  <select
                    value={item.personal_id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAyudantesList(prev => prev.map((ay, i) => i === index ? { ...ay, personal_id: val } : ay));
                    }}
                    required
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Seleccionar Ayudante Registrado --</option>
                    {ayudantesPlantilla.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.nombre}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveAyudanteSlot(index)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {ayudantesList.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">No has añadido ayudantes a este camión.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Observaciones / Destino de Ruta
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ruta Norte, entregas especiales, etc..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/30"
            >
              Guardar y Salir a Ruta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
