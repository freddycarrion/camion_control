import React, { useState, useEffect } from 'react';
import { usePersonalStore } from '../stores/usePersonalStore';
import { Personal, RolPersonal } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { Users, UserPlus, Edit2, Trash2, Phone, DollarSign, Search, CheckCircle, XCircle } from 'lucide-react';

export const PersonalPage: React.FC = () => {
  const { personal, fetchPersonal, addPersonal, updatePersonal, deletePersonal } = usePersonalStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedRolFilter, setSelectedRolFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState<Personal | null>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<RolPersonal>('chofer');
  const [pagoDiario, setPagoDiario] = useState<number>(50);
  const [telefono, setTelefono] = useState('');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    fetchPersonal();
  }, []);

  const handleOpenModal = (p?: Personal) => {
    if (p) {
      setEditingPersonal(p);
      setNombre(p.nombre);
      setRol(p.rol);
      setPagoDiario(p.pago_diario);
      setTelefono(p.telefono || '');
      setActivo(p.activo);
    } else {
      setEditingPersonal(null);
      setNombre('');
      setRol('chofer');
      setPagoDiario(50);
      setTelefono('');
      setActivo(true);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      showToast('warning', 'Campo requerido', 'Ingresa el nombre completo del empleado.');
      return;
    }

    try {
      if (editingPersonal) {
        await updatePersonal(editingPersonal.id, {
          nombre: nombre.trim(),
          rol,
          pago_diario: Number(pagoDiario),
          telefono: telefono ? telefono.trim() : null,
          activo
        });
        showToast('success', 'Personal actualizado', `${nombre} actualizado correctamente.`);
      } else {
        await addPersonal({
          nombre: nombre.trim(),
          rol,
          pago_diario: Number(pagoDiario),
          telefono: telefono ? telefono.trim() : null,
          activo
        });
        showToast('success', 'Empleado registrado', `${nombre} añadido al equipo.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Error al guardar', err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Deseas eliminar a ${name} de la plantilla?`)) {
      try {
        await deletePersonal(id);
        showToast('info', 'Empleado eliminado', `${name} ha sido eliminado.`);
      } catch (err: any) {
        showToast('error', 'Error al eliminar', err.message);
      }
    }
  };

  const filteredPersonal = personal.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.telefono && p.telefono.includes(search));
    const matchesRol = selectedRolFilter === 'todos' || p.rol === selectedRolFilter;
    return matchesSearch && matchesRol;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 sm:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 dark:text-purple-400" />
            Gestión de Personal (Choferes y Ayudantes)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configura las tarifas de pago diario por trabajador, teléfonos y roles en plantilla.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all min-h-[40px] sm:min-h-0 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Empleado
        </button>
      </div>

      {/* Bar Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empleado por nombre o teléfono..."
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-[#0f172a] dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto touch-scrolling pb-1 sm:pb-0 w-full sm:w-auto">
          {['todos', 'chofer', 'ayudante'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRolFilter(r)}
              className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all whitespace-nowrap flex-1 sm:flex-initial text-center ${
                selectedRolFilter === r
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r === 'todos' ? 'Todos' : r === 'chofer' ? 'Choferes' : 'Ayudantes'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredPersonal.map((p) => (
          <div
            key={p.id}
            className="glass-card p-4 sm:p-5 space-y-4 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-[#0f172a] dark:text-white">{p.nombre}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{p.telefono || 'Sin teléfono'}</span>
                </div>
              </div>
              <Badge type="rol" value={p.rol} />
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">Tarifa Diario</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <DollarSign className="w-3.5 h-3.5" />
                  {p.pago_diario.toFixed(2)} / día
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">Estado</span>
                {p.activo ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-semibold">
                    <XCircle className="w-3.5 h-3.5" /> Inactivo
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-300 dark:border-slate-800/60">
              <button
                onClick={() => handleOpenModal(p)}
                className="p-2.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
                title="Editar"
              >
                <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(p.id, p.nombre)}
                className="p-2.5 sm:p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredPersonal.length === 0 && (
          <div className="col-span-full text-center py-12 glass-panel">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No se encontró personal registrado.</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPersonal ? 'Editar Empleado' : 'Nuevo Empleado'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              required
              className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0f172a] dark:text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Rol *
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as RolPersonal)}
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0f172a] dark:text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="chofer">Chofer</option>
                <option value="ayudante">Ayudante</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Pago Diario ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pagoDiario}
                onChange={(e) => setPagoDiario(Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0f172a] dark:text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+593 99 123 4567"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#0f172a] dark:text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activo-check"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="activo-check" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Empleado activo disponible para salidas de ruta
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30"
            >
              Guardar Empleado
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
