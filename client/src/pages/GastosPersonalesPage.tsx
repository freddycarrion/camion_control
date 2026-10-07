import React, { useState, useEffect, useMemo } from 'react';
import { useGastosPersonalesStore } from '../stores/useGastosPersonalesStore';
import { GastoPersonal, CategoriaGastoPersonal, MetodoPagoPersonal } from '../types';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import {
  Wallet,
  Plus,
  Filter,
  Trash2,
  Edit3,
  Search,
  Utensils,
  Home,
  Car,
  HeartPulse,
  Gamepad2,
  Zap,
  GraduationCap,
  ShoppingBag,
  Tag,
  CreditCard,
  Banknote,
  Calendar,
  PieChart,
  RefreshCw,
  LucideIcon
} from 'lucide-react';

interface CategoriaConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  barColor: string;
}

const CATEGORIAS_MAP: Record<CategoriaGastoPersonal, CategoriaConfig> = {
  alimentacion: {
    label: 'Alimentación',
    icon: Utensils,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    barColor: 'bg-amber-500'
  },
  vivienda: {
    label: 'Vivienda',
    icon: Home,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    barColor: 'bg-sky-500'
  },
  transporte: {
    label: 'Transporte',
    icon: Car,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    barColor: 'bg-indigo-500'
  },
  salud: {
    label: 'Salud',
    icon: HeartPulse,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    barColor: 'bg-rose-500'
  },
  entretenimiento: {
    label: 'Entretenimiento',
    icon: Gamepad2,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    barColor: 'bg-purple-500'
  },
  servicios: {
    label: 'Servicios',
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    barColor: 'bg-yellow-500'
  },
  educacion: {
    label: 'Educación',
    icon: GraduationCap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    barColor: 'bg-emerald-500'
  },
  compras: {
    label: 'Compras',
    icon: ShoppingBag,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    barColor: 'bg-pink-500'
  },
  otros: {
    label: 'Otros',
    icon: Tag,
    color: 'text-slate-300',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
    barColor: 'bg-slate-500'
  }
};

const METODOS_PAGO_MAP: Record<MetodoPagoPersonal, { label: string; icon: LucideIcon }> = {
  efectivo: { label: 'Efectivo', icon: Banknote },
  tarjeta_credito: { label: 'T. Crédito', icon: CreditCard },
  tarjeta_debito: { label: 'T. Débito', icon: CreditCard },
  transferencia: { label: 'Transferencia', icon: RefreshCw },
  otro: { label: 'Otro', icon: Tag }
};

export const GastosPersonalesPage: React.FC = () => {
  const {
    gastosPersonales,
    fetchGastosPersonales,
    addGastoPersonal,
    updateGastoPersonal,
    deleteGastoPersonal,
    loading
  } = useGastosPersonalesStore();

  const { showToast } = useToast();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');
  const [metodoPagoFilter, setMetodoPagoFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGastoPersonal>('alimentacion');
  const [monto, setMonto] = useState<number | ''>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPagoPersonal>('efectivo');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    fetchGastosPersonales({
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      categoria: (categoriaFilter as CategoriaGastoPersonal) || undefined,
      metodo_pago: (metodoPagoFilter as MetodoPagoPersonal) || undefined
    });
  }, [fechaInicio, fechaFin, categoriaFilter, metodoPagoFilter]);

  // Gastos filtrados por texto
  const filteredGastos = useMemo(() => {
    return gastosPersonales.filter((g) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const conc = g.concepto.toLowerCase();
      const obs = (g.observaciones || '').toLowerCase();
      const cat = (CATEGORIAS_MAP[g.categoria]?.label || '').toLowerCase();
      return conc.includes(term) || obs.includes(term) || cat.includes(term);
    });
  }, [gastosPersonales, searchTerm]);

  // Cálculos KPI
  const hoyStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const mesActualStr = useMemo(() => new Date().toISOString().substring(0, 7), []); // YYYY-MM

  const totalMontoFiltrado = useMemo(() => {
    return filteredGastos.reduce((acc, g) => acc + Number(g.monto), 0);
  }, [filteredGastos]);

  const totalMontoMesActual = useMemo(() => {
    return gastosPersonales
      .filter((g) => g.fecha.startsWith(mesActualStr))
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastosPersonales, mesActualStr]);

  const totalMontoHoy = useMemo(() => {
    return gastosPersonales
      .filter((g) => g.fecha === hoyStr)
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastosPersonales, hoyStr]);

  // Desglose por categoría para la barra de distribución
  const desgloseCategorias = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    filteredGastos.forEach((g) => {
      const amt = Number(g.monto);
      counts[g.categoria] = (counts[g.categoria] || 0) + amt;
      total += amt;
    });

    return Object.entries(counts)
      .map(([cat, amt]) => ({
        cat: cat as CategoriaGastoPersonal,
        amt,
        percentage: total > 0 ? (amt / total) * 100 : 0
      }))
      .sort((a, b) => b.amt - a.amt);
  }, [filteredGastos]);

  const categoriaPrincipal = desgloseCategorias.length > 0 ? CATEGORIAS_MAP[desgloseCategorias[0].cat]?.label : 'N/A';

  // Abrir Modal Crear
  const handleOpenCreate = () => {
    setEditingId(null);
    setFecha(new Date().toISOString().split('T')[0]);
    setConcepto('');
    setCategoria('alimentacion');
    setMonto('');
    setMetodoPago('efectivo');
    setObservaciones('');
    setIsModalOpen(true);
  };

  // Abrir Modal Editar
  const handleOpenEdit = (gasto: GastoPersonal) => {
    setEditingId(gasto.id);
    setFecha(gasto.fecha);
    setConcepto(gasto.concepto);
    setCategoria(gasto.categoria);
    setMonto(gasto.monto);
    setMetodoPago(gasto.metodo_pago);
    setObservaciones(gasto.observaciones || '');
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || !monto || Number(monto) <= 0) {
      showToast('warning', 'Campos requeridos', 'Ingresa un concepto y un monto positivo.');
      return;
    }

    try {
      if (editingId) {
        await updateGastoPersonal(editingId, {
          fecha,
          concepto: concepto.trim(),
          categoria,
          monto: Number(monto),
          metodo_pago: metodoPago,
          observaciones: observaciones.trim() || null
        });
        showToast('success', 'Gasto Actualizado', `El gasto "${concepto.trim()}" fue modificado correctamente.`);
      } else {
        await addGastoPersonal({
          fecha,
          concepto: concepto.trim(),
          categoria,
          monto: Number(monto),
          metodo_pago: metodoPago,
          observaciones: observaciones.trim() || null
        });
        showToast('success', 'Gasto Personal Registrado', `Gasto de $${Number(monto).toFixed(2)} guardado.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Error al guardar', err.message);
    }
  };

  // Eliminar
  const handleDelete = async (id: string, conc: string) => {
    if (confirm(`¿Estás seguro de eliminar el gasto personal "${conc}"?`)) {
      try {
        await deleteGastoPersonal(id);
        showToast('info', 'Gasto Eliminado', 'El registro fue removido del sistema.');
      } catch (err: any) {
        showToast('error', 'Error al eliminar', err.message);
      }
    }
  };

  // Reset Filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setFechaInicio('');
    setFechaFin('');
    setCategoriaFilter('');
    setMetodoPagoFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 sm:p-6 border-l-4 border-l-purple-500">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 flex-shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Gestión de Gastos Personales
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Registra tu consumo personal diario, organiza por categorías y controla tus egresos personales.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all min-h-[42px] sm:min-h-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Gasto Personal
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Filtrado */}
        <div className="glass-card p-4 flex items-center justify-between border-purple-500/20 bg-purple-500/5">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Filtrado</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
              ${totalMontoFiltrado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-purple-400 font-medium">{filteredGastos.length} registros</span>
          </div>
          <Wallet className="w-8 h-8 text-purple-400 flex-shrink-0" />
        </div>

        {/* Mes Actual */}
        <div className="glass-card p-4 flex items-center justify-between border-sky-500/20 bg-sky-500/5">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gastos Mes Actual</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
              ${totalMontoMesActual.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-sky-400 font-medium">Mes en curso</span>
          </div>
          <Calendar className="w-8 h-8 text-sky-400 flex-shrink-0" />
        </div>

        {/* Hoy */}
        <div className="glass-card p-4 flex items-center justify-between border-emerald-500/20 bg-emerald-500/5">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gastos de Hoy</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
              ${totalMontoHoy.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium">{hoyStr}</span>
          </div>
          <Banknote className="w-8 h-8 text-emerald-400 flex-shrink-0" />
        </div>

        {/* Categoría Mayoritaria */}
        <div className="glass-card p-4 flex items-center justify-between border-amber-500/20 bg-amber-500/5">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mayor Categoría</span>
            <h3 className="text-lg font-extrabold text-white mt-0.5 truncate max-w-[150px]">
              {categoriaPrincipal}
            </h3>
            <span className="text-[10px] text-amber-400 font-medium">Mayor concentración</span>
          </div>
          <PieChart className="w-8 h-8 text-amber-400 flex-shrink-0" />
        </div>
      </div>

      {/* Barra de Distribución por Categorías */}
      {desgloseCategorias.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <PieChart className="w-3.5 h-3.5 text-purple-400" />
              Distribución de Gastos por Categoría
            </span>
            <span className="text-[11px] text-slate-400">{desgloseCategorias.length} categorías registradas</span>
          </div>

          {/* Progress Multi-Bar */}
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex gap-0.5">
            {desgloseCategorias.map((item) => {
              const cfg = CATEGORIAS_MAP[item.cat];
              return (
                <div
                  key={item.cat}
                  className={`${cfg.barColor} h-full transition-all`}
                  style={{ width: `${item.percentage}%` }}
                  title={`${cfg.label}: $${item.amt.toFixed(2)} (${item.percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          {/* Categorías Badges Legend */}
          <div className="flex flex-wrap gap-2 pt-1">
            {desgloseCategorias.map((item) => {
              const cfg = CATEGORIAS_MAP[item.cat];
              const Icon = cfg.icon;
              return (
                <span
                  key={item.cat}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}: <strong className="text-white">${item.amt.toFixed(2)}</strong> ({item.percentage.toFixed(0)}%)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Bar de Búsqueda y Filtros */}
      <div className="glass-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Buscar por Concepto */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar concepto u observación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Categoría */}
          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Todas las Categorías</option>
            {Object.entries(CATEGORIAS_MAP).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Método de Pago */}
          <select
            value={metodoPagoFilter}
            onChange={(e) => setMetodoPagoFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Todos los Métodos</option>
            {Object.entries(METODOS_PAGO_MAP).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Botón Limpiar */}
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Limpiar Filtros
          </button>
        </div>

        {/* Rango de Fechas secundario */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-slate-400 font-medium">Filtrar por Fechas:</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
          />
          <span className="text-slate-500">a</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
          />
        </div>
      </div>

      {/* Tabla de Gastos Personales */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto touch-scrolling">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Concepto / Detalle</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Método de Pago</th>
                <th className="py-3.5 px-4">Monto ($)</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredGastos.map((g) => {
                const catCfg = CATEGORIAS_MAP[g.categoria] || CATEGORIAS_MAP.otros;
                const CatIcon = catCfg.icon;

                const metCfg = METODOS_PAGO_MAP[g.metodo_pago] || METODOS_PAGO_MAP.efectivo;
                const MetIcon = metCfg.icon;

                return (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-300">{g.fecha}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{g.concepto}</div>
                      {g.observaciones && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{g.observaciones}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${catCfg.bg} ${catCfg.color} ${catCfg.border}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                        {catCfg.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-medium">
                        <MetIcon className="w-3 h-3 text-slate-400" />
                        {metCfg.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-purple-400 text-sm">
                      ${Number(g.monto).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(g)}
                        className="p-2 sm:p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors min-w-[34px] min-h-[34px] inline-flex items-center justify-center"
                        title="Editar gasto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id, g.concepto)}
                        className="p-2 sm:p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors min-w-[34px] min-h-[34px] inline-flex items-center justify-center"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredGastos.length === 0 && (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold">No se encontraron gastos personales con los filtros aplicados.</p>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Primer Gasto
            </button>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Gasto Personal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Gasto Personal' : 'Registrar Gasto Personal'}
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
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
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
                placeholder="25.50"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
              />
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
              placeholder="Ej: Almuerzo de trabajo / Pago de luz / Supermercado"
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaGastoPersonal)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                {Object.entries(CATEGORIAS_MAP).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Método de Pago *
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPagoPersonal)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                {Object.entries(METODOS_PAGO_MAP).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Observaciones / Notas Adicionales
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Comentarios extras o número de comprobante..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30"
            >
              {editingId ? 'Guardar Cambios' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
