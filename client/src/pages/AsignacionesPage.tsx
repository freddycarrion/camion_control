import React, { useState, useEffect, useMemo } from 'react';
import { useAsignacionesStore } from '../stores/useAsignacionesStore';
import { useCamionesStore } from '../stores/useCamionesStore';
import { usePersonalStore } from '../stores/usePersonalStore';
import { AsignacionDiaria, EstadoAsignacion } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  Search,
  ArrowUpDown,
  Trash2,
  UserPlus,
  X,
  Printer,
  FileText,
  Truck,
  UserCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface AyudanteFormItem {
  es_temporal: boolean;
  personal_id?: string;
  nombre_temporal?: string;
}

export const AsignacionesPage: React.FC = () => {
  const {
    asignaciones,
    fetchAsignaciones,
    addAsignacion,
    updateEstado,
    deleteAsignacion,
    initRealtimeSubscription
  } = useAsignacionesStore();

  const { camiones, fetchCamiones } = useCamionesStore();
  const { personal, fetchPersonal } = usePersonalStore();
  const { showToast } = useToast();

  // Filtros y ordenamiento
  const [modoFecha, setModoFecha] = useState<'todas' | 'especifica'>('todas');
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAscending, setSortAscending] = useState(false); // Default: Descendente (más reciente primero)

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planillaDetalle, setPlanillaDetalle] = useState<AsignacionDiaria | null>(null);

  // Form state
  const [numeroPlanillaInput, setNumeroPlanillaInput] = useState('');
  const [fechaInput, setFechaInput] = useState(new Date().toISOString().split('T')[0]);
  const [camionId, setCamionId] = useState('');
  const [choferId, setChoferId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [ayudantesList, setAyudantesList] = useState<AyudanteFormItem[]>([]);

  useEffect(() => {
    fetchAsignaciones(modoFecha === 'especifica' ? fechaFiltro : 'all');
    fetchCamiones();
    fetchPersonal();
    initRealtimeSubscription();
  }, [fechaFiltro, modoFecha]);

  const ayudantesPlantilla = personal.filter(p => p.rol === 'ayudante' && p.activo);
  const choferesPlantilla = personal.filter(p => p.rol === 'chofer' && p.activo);
  const camionesDisponibles = camiones.filter(c => c.estado === 'disponible' || c.estado === 'en_ruta');

  const handleOpenModal = () => {
    setNumeroPlanillaInput('');
    setFechaInput(new Date().toISOString().split('T')[0]);
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
      showToast('warning', 'Camión Requerido', 'Selecciona una unidad para la planilla.');
      return;
    }

    try {
      await addAsignacion({
        numero_planilla: numeroPlanillaInput.trim() || undefined,
        fecha: fechaInput,
        camion_id: camionId,
        chofer_id: choferId || null,
        observaciones,
        ayudantes: ayudantesList
      });

      showToast('success', 'Planilla Guardada', 'La planilla del camión fue registrada correctamente.');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Error al registrar planilla', err.message);
    }
  };

  const handleEstadoChange = async (id: string, nuevoEstado: EstadoAsignacion) => {
    try {
      await updateEstado(id, nuevoEstado);
      showToast('success', 'Estado Actualizado', `Planilla cambiada a ${nuevoEstado}.`);
    } catch (err: any) {
      showToast('error', 'Error al actualizar', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Deseas eliminar esta planilla de camión?')) {
      try {
        await deleteAsignacion(id);
        showToast('info', 'Planilla Eliminada', 'Se eliminó el registro de la planilla.');
      } catch (err: any) {
        showToast('error', 'Error al eliminar', err.message);
      }
    }
  };

  // Filtrado y Ordenamiento por Fecha y Buscador
  const planillasFiltradas = useMemo(() => {
    let result = [...asignaciones];

    // Buscador global (N° Planilla, Fecha, Camión, Chofer, Ayudantes, Observaciones)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((item) => {
        const numPlanilla = (item.numero_planilla || item.id || '').toLowerCase();
        const fechaStr = item.fecha.toLowerCase();
        const camionCod = (item.camion?.codigo_interno || '').toLowerCase();
        const camionPlaca = (item.camion?.placa || '').toLowerCase();
        const camionModelo = (item.camion?.modelo || '').toLowerCase();
        const choferNom = (item.chofer?.nombre || '').toLowerCase();
        const obs = (item.observaciones || '').toLowerCase();
        const ayudantesNom = (item.ayudantes || [])
          .map(a => a.es_temporal ? (a.nombre_temporal || '') : (a.personal?.nombre || ''))
          .join(' ')
          .toLowerCase();

        return (
          numPlanilla.includes(q) ||
          fechaStr.includes(q) ||
          camionCod.includes(q) ||
          camionPlaca.includes(q) ||
          camionModelo.includes(q) ||
          choferNom.includes(q) ||
          obs.includes(q) ||
          ayudantesNom.includes(q)
        );
      });
    }

    // Ordenamiento por Fecha (Ascendente o Descendente)
    result.sort((a, b) => {
      const cmp = a.fecha.localeCompare(b.fecha);
      if (cmp !== 0) {
        return sortAscending ? cmp : -cmp;
      }
      return sortAscending
        ? (a.created_at || '').localeCompare(b.created_at || '')
        : (b.created_at || '').localeCompare(a.created_at || '');
    });

    return result;
  }, [asignaciones, searchTerm, sortAscending]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-sky-400" />
            Planillas de Camiones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro, archivo y consulta de planillas diarias por camión (Planilla - Fecha - Camión).
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Planilla de Camión
        </button>
      </div>

      {/* Barra de Filtros, Buscador y Orden de Fecha */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° Planilla, Fecha, Camión (Placa/Código), Chofer, Ayudante..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros de Fecha */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setModoFecha('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                modoFecha === 'todas'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas las Planillas
            </button>
            <button
              onClick={() => setModoFecha('especifica')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                modoFecha === 'especifica'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fecha Específica
            </button>
          </div>

          {modoFecha === 'especifica' && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Calendar className="w-4 h-4 text-sky-400" />
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none"
              />
            </div>
          )}

          {/* Toggle de Orden por Fecha */}
          <button
            onClick={() => setSortAscending(prev => !prev)}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all"
            title="Cambiar orden por fecha"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Orden: {sortAscending ? 'Más antiguas primero' : 'Más recientes primero'}
            </span>
          </button>
        </div>
      </div>

      {/* Resumen de Resultados */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-semibold">
        <span>
          Mostrando {planillasFiltradas.length} {planillasFiltradas.length === 1 ? 'planilla' : 'planillas'}
        </span>
        {searchTerm && (
          <span className="text-sky-400">
            Filtrado por: "{searchTerm}"
          </span>
        )}
      </div>

      {/* Lista de Planillas en Formato "Planilla - Fecha - Camión" */}
      <div className="space-y-4">
        {planillasFiltradas.map((asig) => {
          const folio = asig.numero_planilla || `PLN-${asig.fecha.replace(/-/g, '')}-${asig.id.slice(0, 4).toUpperCase()}`;
          return (
            <div
              key={asig.id}
              className="glass-panel p-5 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="space-y-3 flex-1">
                {/* Formato Requerido: Planilla - Fecha - Camión */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Badge Planilla */}
                  <span className="px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-extrabold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Planilla: {folio}
                  </span>

                  {/* Badge Fecha */}
                  <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {asig.fecha}
                  </span>

                  {/* Badge Camión */}
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-extrabold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Camión: {asig.camion?.codigo_interno || 'Camión'} ({asig.camion?.placa || 'S/P'})
                  </span>

                  <Badge type="asignacion" value={asig.estado} />
                </div>

                {/* Detalles de Tripulación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Chofer Asignado:</span>
                    <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                      <UserCheck className="w-4 h-4 text-sky-400" />
                      <span>{asig.chofer?.nombre || 'Sin chofer asignado'}</span>
                      {asig.chofer?.telefono && (
                        <span className="text-[11px] text-slate-500 font-normal">({asig.chofer.telefono})</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Ayudantes a Bordo:</span>
                    {asig.ayudantes && asig.ayudantes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {asig.ayudantes.map((ay) => (
                          <span
                            key={ay.id}
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                              ay.es_temporal
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                            }`}
                          >
                            {ay.es_temporal ? `🔥 ${ay.nombre_temporal} (Temporal)` : `👤 ${ay.personal?.nombre}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Sin ayudantes registrados</span>
                    )}
                  </div>
                </div>

                {asig.observaciones && (
                  <p className="text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                    <strong>Observaciones / Destino:</strong> {asig.observaciones}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                <button
                  onClick={() => setPlanillaDetalle(asig)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
                  title="Ver Vista Completa / Imprimir"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  Ver / Imprimir
                </button>

                {asig.estado === 'en_curso' && (
                  <button
                    onClick={() => handleEstadoChange(asig.id, 'completado')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Finalizar
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
                  title="Eliminar planilla"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {planillasFiltradas.length === 0 && (
          <div className="text-center py-16 glass-panel space-y-3">
            <Clock className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No se encontraron planillas de camión.</p>
            <p className="text-xs text-slate-500">
              Prueba cambiando los criterios del buscador o registrando una nueva planilla.
            </p>
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Nueva Planilla
            </button>
          </div>
        )}
      </div>

      {/* Modal: Registrar Nueva Planilla de Camión */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nueva Planilla de Camión"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                N° de Planilla / Folio
              </label>
              <input
                type="text"
                value={numeroPlanillaInput}
                onChange={(e) => setNumeroPlanillaInput(e.target.value)}
                placeholder="Ej. PLN-001 (autogenerado si se deja vacío)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Fecha de Planilla *
              </label>
              <input
                type="date"
                value={fechaInput}
                onChange={(e) => setFechaInput(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Tripulación / Ayudantes Asignados
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
              placeholder="Notas de viaje, clientes, ruta asignada, observaciones..."
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
              Guardar Planilla de Camión
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Vista Detalle / Imprimir Planilla de Camión */}
      <Modal
        isOpen={!!planillaDetalle}
        onClose={() => setPlanillaDetalle(null)}
        title={`Detalle de Planilla: ${planillaDetalle?.numero_planilla || 'S/N'}`}
        maxWidth="lg"
      >
        {planillaDetalle && (
          <div className="space-y-6 text-slate-200">
            {/* Cabecera Documento Imprimible */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white">PLANILLA DE TRABAJO Y RUTA DE CAMIÓN</h2>
                  <p className="text-xs text-sky-400 font-mono font-bold mt-0.5">
                    N° FOLIO: {planillaDetalle.numero_planilla || planillaDetalle.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">FECHA DE EMISIÓN:</span>
                  <span className="text-sm font-bold font-mono text-white">{planillaDetalle.fecha}</span>
                </div>
              </div>

              {/* Info Camión & Chofer */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">UNIDAD DE CAMIÓN:</span>
                  <div className="p-2.5 rounded-xl bg-slate-900 font-bold text-white">
                    {planillaDetalle.camion?.codigo_interno || 'Camión'} — Placa: {planillaDetalle.camion?.placa || 'N/A'}
                    <div className="text-[11px] text-slate-400 font-normal">Modelo: {planillaDetalle.camion?.modelo || 'N/A'}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">CHOFER EN RUTA:</span>
                  <div className="p-2.5 rounded-xl bg-slate-900 font-bold text-white">
                    {planillaDetalle.chofer?.nombre || 'Sin Chofer'}
                    <div className="text-[11px] text-slate-400 font-normal">Teléfono: {planillaDetalle.chofer?.telefono || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Tripulación Ayudantes */}
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-medium block">AYUDANTES A BORDO:</span>
                <div className="p-3 rounded-xl bg-slate-900 space-y-1">
                  {planillaDetalle.ayudantes && planillaDetalle.ayudantes.length > 0 ? (
                    planillaDetalle.ayudantes.map((ay, i) => (
                      <div key={ay.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">
                          {i + 1}. {ay.es_temporal ? ay.nombre_temporal : ay.personal?.nombre}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ay.es_temporal ? 'text-amber-400 bg-amber-500/10' : 'text-indigo-400 bg-indigo-500/10'}`}>
                          {ay.es_temporal ? 'Temporal Libre' : 'Personal Plantilla'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Sin ayudantes en esta salida</span>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              {planillaDetalle.observaciones && (
                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 font-medium block">OBSERVACIONES / DESTINO DE RUTA:</span>
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-300 italic">
                    {planillaDetalle.observaciones}
                  </div>
                </div>
              )}

              {/* Firmas de Conformidad */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-800 text-center text-xs">
                <div className="border-t border-dashed border-slate-700 pt-2">
                  <span className="font-bold text-slate-300 block">Firma del Chofer</span>
                  <span className="text-[10px] text-slate-500">{planillaDetalle.chofer?.nombre || 'Chofer'}</span>
                </div>
                <div className="border-t border-dashed border-slate-700 pt-2">
                  <span className="font-bold text-slate-300 block">Firma del Supervisor / Control</span>
                  <span className="text-[10px] text-slate-500">CamiónControl Flotas</span>
                </div>
              </div>
            </div>

            {/* Acciones Modal */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlanillaDetalle(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-600/30"
              >
                <Printer className="w-4 h-4" />
                Imprimir Documento
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
