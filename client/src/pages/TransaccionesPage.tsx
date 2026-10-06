import { useState, useEffect } from 'react';
import { useTransaccionesStore } from '../stores/useTransaccionesStore';
import { useCamionesStore } from '../stores/useCamionesStore';
import { CategoriaGasto } from '../types';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { DollarSign, Plus, Filter, Trash2, Fuel, Wrench, Shield, Tag } from 'lucide-react';

export const TransaccionesPage: React.FC = () => {
  const { transacciones, fetchTransacciones, addTransaccion, deleteTransaccion } = useTransaccionesStore();
  const { camiones, fetchCamiones } = useCamionesStore();
  const { showToast } = useToast();

  // Filters state
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [camionFilter, setCamionFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [camionId, setCamionId] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGasto>('combustible');
  const [monto, setMonto] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    fetchTransacciones({
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      camion_id: camionFilter || undefined,
      categoria: (categoriaFilter as CategoriaGasto) || undefined
    });
    fetchCamiones();
  }, [fechaInicio, fechaFin, camionFilter, categoriaFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto || !monto || Number(monto) <= 0) {
      showToast('warning', 'Datos Inválidos', 'Ingresa un concepto y un monto válido mayor a 0.');
      return;
    }

    try {
      await addTransaccion({
        fecha,
        camion_id: camionId || null,
        concepto: concepto.trim(),
        categoria,
        monto: Number(monto),
        observaciones: observaciones.trim() || null
      });

      showToast('success', 'Gasto Registrado', `Gasto de $${Number(monto).toFixed(2)} guardado.`);
      setIsModalOpen(false);
      setConcepto('');
      setMonto('');
      setObservaciones('');
    } catch (err: any) {
      showToast('error', 'Error al guardar gasto', err.message);
    }
  };

  const handleDelete = async (id: string, conc: string) => {
    if (confirm(`¿Deseas eliminar la transacción "${conc}"?`)) {
      try {
        await deleteTransaccion(id);
        showToast('info', 'Gasto Eliminado', 'Transacción removida del sistema.');
      } catch (err: any) {
        showToast('error', 'Error al eliminar', err.message);
      }
    }
  };

  const totalMontoGasto = transacciones.reduce((acc, t) => acc + Number(t.monto), 0);

  const getCategoriaBadge = (cat: CategoriaGasto) => {
    const map = {
      combustible: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Fuel, label: 'Combustible' },
      mantenimiento: { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30', icon: Wrench, label: 'Mantenimiento' },
      peaje: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Shield, label: 'Peaje' },
      viaticos: { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Tag, label: 'Viáticos' },
      mecanica: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: Wrench, label: 'Mecánica' },
      repuestos: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: Tag, label: 'Repuestos' },
      otros: { bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: Tag, label: 'Otros' }
    };

    const cfg = map[cat] || map.otros;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 sm:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            Control Financiero & Gastos Operativos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro y desglose de combustible, viáticos, mantenimiento y peajes por camión o flota.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all min-h-[40px] sm:min-h-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Nuevo Gasto
        </button>
      </div>

      {/* Bar Filtros y Resumen Total */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Acumulador Total */}
        <div className="glass-card p-4 flex items-center justify-between border-emerald-500/20 bg-emerald-500/5">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Filtrado</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
              ${totalMontoGasto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <DollarSign className="w-8 h-8 text-emerald-400 flex-shrink-0" />
        </div>

        {/* Filtros */}
        <div className="lg:col-span-3 glass-card p-3.5 sm:p-4 flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-sky-400" /> Filtros:
          </div>

          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            placeholder="Desde"
            className="px-3 py-2 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white flex-1 sm:flex-initial"
          />

          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            placeholder="Hasta"
            className="px-3 py-2 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white flex-1 sm:flex-initial"
          />

          <select
            value={camionFilter}
            onChange={(e) => setCamionFilter(e.target.value)}
            className="px-3 py-2 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white w-full sm:w-auto"
          >
            <option value="">Todos los Camiones</option>
            {camiones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo_interno} ({c.placa})
              </option>
            ))}
          </select>

          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="px-3 py-2 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white w-full sm:w-auto"
          >
            <option value="">Todas las Categorías</option>
            <option value="combustible">Combustible</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="peaje">Peaje</option>
            <option value="viaticos">Viáticos</option>
            <option value="mecanica">Mecánica</option>
            <option value="repuestos">Repuestos</option>
            <option value="otros">Otros</option>
          </select>
        </div>
      </div>

      {/* Tabla de Transacciones */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto touch-scrolling">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Camión / Destino</th>
                <th className="py-3.5 px-4">Concepto</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Monto ($)</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {transacciones.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-300">{t.fecha}</td>
                  <td className="py-3.5 px-4">
                    {t.camion ? (
                      <span className="font-bold text-white">
                        {t.camion.codigo_interno} ({t.camion.placa})
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Flota General</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{t.concepto}</div>
                    {t.observaciones && <div className="text-[11px] text-slate-400">{t.observaciones}</div>}
                  </td>
                  <td className="py-3.5 px-4">{getCategoriaBadge(t.categoria)}</td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-400 text-sm">
                    ${Number(t.monto).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(t.id, t.concepto)}
                      className="p-2 sm:p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transacciones.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            No hay transacciones registradas con los filtros actuales.
          </div>
        )}
      </div>

      {/* Modal Agregar Gasto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Gasto Operativo"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Fecha del Gasto *
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Camión Asociado
              </label>
              <select
                value={camionId}
                onChange={(e) => setCamionId(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Gasto General de Flota --</option>
                {camiones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo_interno} ({c.placa})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Concepto del Gasto *
            </label>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Carga de Diesel 50 Galones / Cambio de Aceite"
              required
              className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="combustible">Combustible</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="peaje">Peaje</option>
                <option value="viaticos">Viáticos</option>
                <option value="mecanica">Mecánica</option>
                <option value="repuestos">Repuestos</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Monto ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value ? Number(e.target.value) : '')}
                placeholder="150.00"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Observaciones Adicionales
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Número de factura o detalles del mantenimiento..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
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
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30"
            >
              Guardar Gasto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
