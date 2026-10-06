import React, { useState, useEffect } from 'react';
import { useCamionesStore } from '../stores/useCamionesStore';
import { usePersonalStore } from '../stores/usePersonalStore';
import { Camion, EstadoCamion } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { Truck, Plus, Edit2, Trash2, Search, UserCheck } from 'lucide-react';

export const CamionesPage: React.FC = () => {
  const { camiones, fetchCamiones, addCamion, updateCamion, deleteCamion, loading } = useCamionesStore();
  const { personal, fetchPersonal } = usePersonalStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamion, setEditingCamion] = useState<Camion | null>(null);

  // Form State
  const [placa, setPlaca] = useState('');
  const [codigoInterno, setCodigoInterno] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [estado, setEstado] = useState<EstadoCamion>('disponible');
  const [choferTitularId, setChoferTitularId] = useState('');

  useEffect(() => {
    fetchCamiones();
    fetchPersonal('chofer');
  }, []);

  const choferesDisponibles = personal.filter(p => p.rol === 'chofer');

  const handleOpenModal = (camion?: Camion) => {
    if (camion) {
      setEditingCamion(camion);
      setPlaca(camion.placa);
      setCodigoInterno(camion.codigo_interno);
      setModelo(camion.modelo);
      setAnio(camion.anio);
      setEstado(camion.estado);
      setChoferTitularId(camion.chofer_titular_id || '');
    } else {
      setEditingCamion(null);
      setPlaca('');
      setCodigoInterno('');
      setModelo('');
      setAnio(new Date().getFullYear());
      setEstado('disponible');
      setChoferTitularId('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa || !codigoInterno || !modelo) {
      showToast('warning', 'Campos requeridos', 'Completa los datos obligatorios del vehículo.');
      return;
    }

    try {
      if (editingCamion) {
        await updateCamion(editingCamion.id, {
          placa: placa.toUpperCase(),
          codigo_interno: codigoInterno.toUpperCase(),
          modelo,
          anio: Number(anio),
          estado,
          chofer_titular_id: choferTitularId || null
        });
        showToast('success', 'Camión actualizado', `Unidad ${codigoInterno} modificada correctamente.`);
      } else {
        await addCamion({
          placa: placa.toUpperCase(),
          codigo_interno: codigoInterno.toUpperCase(),
          modelo,
          anio: Number(anio),
          estado,
          chofer_titular_id: choferTitularId || null
        });
        showToast('success', 'Camión registrado', `Nueva unidad ${codigoInterno} registrada en la flota.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Error al guardar', err.message);
    }
  };

  const handleDelete = async (id: string, codigo: string) => {
    if (confirm(`¿Estás seguro de eliminar el camión ${codigo}?`)) {
      try {
        await deleteCamion(id);
        showToast('info', 'Camión eliminado', `La unidad ${codigo} fue removida.`);
      } catch (err: any) {
        showToast('error', 'Error al eliminar', err.message);
      }
    }
  };

  const filteredCamiones = camiones.filter(c =>
    c.placa.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo_interno.toLowerCase().includes(search.toLowerCase()) ||
    c.modelo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 sm:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400" />
            Gestión de Flota de Camiones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administra los vehículos de transporte, asignación de choferes y estados operacionales.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all min-h-[40px] sm:min-h-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Camión
        </button>
      </div>

      {/* Bar Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa, código interno o modelo..."
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Grid de Camiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredCamiones.map((camion) => (
          <div
            key={camion.id}
            className="glass-card p-4 sm:p-5 space-y-4 border border-slate-800 hover:border-slate-700 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {camion.codigo_interno}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">{camion.modelo}</h3>
                <p className="text-xs text-slate-400 font-mono">Placa: {camion.placa} • Año: {camion.anio}</p>
              </div>
              <Badge type="camion" value={camion.estado} />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="text-slate-400 truncate">Chofer Titular:</span>
              </div>
              <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-none text-right">
                {camion.chofer_titular?.nombre || 'Sin chofer fijo'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => handleOpenModal(camion)}
                className="p-2.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
                title="Editar"
              >
                <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(camion.id, camion.codigo_interno)}
                className="p-2.5 sm:p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredCamiones.length === 0 && (
          <div className="col-span-full text-center py-12 glass-panel">
            <p className="text-sm font-semibold text-slate-400">No se encontraron camiones.</p>
          </div>
        )}
      </div>

      {/* Modal Alta / Edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCamion ? 'Editar Camión' : 'Nuevo Camión'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Placa del Camión *
              </label>
              <input
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                placeholder="ABC-123"
                required
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Código Interno *
              </label>
              <input
                type="text"
                value={codigoInterno}
                onChange={(e) => setCodigoInterno(e.target.value)}
                placeholder="CAM-01"
                required
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Modelo / Marca *
              </label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Volvo FH500 / Hino"
                required
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Año de Fabricación *
              </label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                min="1990"
                max="2050"
                required
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Chofer Titular Fijo
            </label>
            <select
              value={choferTitularId}
              onChange={(e) => setChoferTitularId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Sin Chofer Fijo (Asignación libre) --</option>
              {choferesDisponibles.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.nombre} (Tel: {ch.telefono || 'S/N'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Estado Operacional
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoCamion)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="disponible">Disponible</option>
              <option value="en_ruta">En Ruta</option>
              <option value="mantenimiento">En Mantenimiento</option>
              <option value="fuera_servicio">Fuera de Servicio</option>
            </select>
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
              Guardar Camión
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
