import React, { useState, useEffect, useMemo } from 'react';
import { usePagosStore } from '../stores/usePagosStore';
import { usePersonalStore } from '../stores/usePersonalStore';
import { CalculoPlanillaItem } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import {
  Receipt,
  Plus,
  Calculator,
  CheckCircle2,
  DollarSign,
  Calendar,
  Trash2,
  Wallet,
  AlertTriangle,
  Users,
  RefreshCw
} from 'lucide-react';

// Fecha local en formato YYYY-MM-DD (toISOString usa UTC y puede saltar al día siguiente)
const toLocalISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Lunes a domingo de la semana actual
const semanaActual = () => {
  const hoy = new Date();
  const offsetLunes = (hoy.getDay() + 6) % 7; // domingo => 6, lunes => 0
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - offsetLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { inicio: toLocalISO(lunes), fin: toLocalISO(domingo) };
};

const money = (n: number) => `$${Number(n).toFixed(2)}`;

export const PagosPage: React.FC = () => {
  const {
    adelantos,
    planillas,
    calculoActual,
    loading,
    error,
    fetchAdelantos,
    addAdelanto,
    deleteAdelanto,
    calcularPlanilla,
    fetchPlanillas,
    liquidarPlanilla,
    pagarEmpleado
  } = usePagosStore();

  const { personal, fetchPersonal } = usePersonalStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'calculo' | 'adelantos' | 'historial'>('calculo');

  const semana = semanaActual();
  const [fechaInicio, setFechaInicio] = useState(semana.inicio);
  const [fechaFin, setFechaFin] = useState(semana.fin);

  // Modal de pago
  const [empleadoAPagar, setEmpleadoAPagar] = useState<CalculoPlanillaItem | null>(null);
  const [pagando, setPagando] = useState(false);

  // Modal de adelanto
  const [isAdelantoModalOpen, setIsAdelantoModalOpen] = useState(false);
  const [personalId, setPersonalId] = useState('');
  const [montoAdelanto, setMontoAdelanto] = useState<number | ''>('');
  const [fechaAdelanto, setFechaAdelanto] = useState(toLocalISO(new Date()));
  const [motivoAdelanto, setMotivoAdelanto] = useState('');

  useEffect(() => {
    fetchPersonal();
    fetchAdelantos();
    fetchPlanillas();
  }, []);

  // Recalcular automáticamente al abrir la página y al cambiar el período
  useEffect(() => {
    if (fechaInicio && fechaFin && fechaInicio <= fechaFin) {
      calcularPlanilla(fechaInicio, fechaFin);
    }
  }, [fechaInicio, fechaFin]);

  // Totales del período (solo empleados aún no pagados y con días trabajados)
  const resumen = useMemo(() => {
    const porPagar = calculoActual.filter(c => !c.ya_pagado && c.dias_trabajados > 0);
    return {
      totalNeto: porPagar.reduce((s, c) => s + c.monto_neto, 0),
      totalAdelantos: porPagar.reduce((s, c) => s + (c.total_adelantos - c.saldo_adelanto), 0),
      pendientes: porPagar.length,
      pagados: calculoActual.filter(c => c.ya_pagado).length
    };
  }, [calculoActual]);

  // Adelantos pendientes del empleado que se van a descontar en el pago
  const adelantosDelPago = useMemo(() => {
    if (!empleadoAPagar) return [];
    return adelantos
      .filter(a => a.personal_id === empleadoAPagar.personal_id && !a.planilla_id && a.fecha <= fechaFin)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [empleadoAPagar, adelantos, fechaFin]);

  const handleRecalcular = async () => {
    if (!fechaInicio || !fechaFin || fechaInicio > fechaFin) {
      showToast('warning', 'Rango inválido', 'La fecha de inicio debe ser anterior o igual a la fecha fin.');
      return;
    }
    await calcularPlanilla(fechaInicio, fechaFin);
  };

  const handleConfirmarPago = async () => {
    if (!empleadoAPagar) return;
    setPagando(true);
    try {
      const planilla = await pagarEmpleado(empleadoAPagar.personal_id, fechaInicio, fechaFin);
      showToast(
        'success',
        'Pago registrado',
        `${empleadoAPagar.nombre}: neto pagado ${money(Number(planilla.monto_neto))}` +
          (Number(planilla.total_adelantos) > 0 ? ` (se descontaron ${money(Number(planilla.total_adelantos))} de adelantos)` : '')
      );
      setEmpleadoAPagar(null);
    } catch (err: any) {
      showToast('error', 'No se pudo registrar el pago', err.message);
    } finally {
      setPagando(false);
    }
  };

  const handleLiquidar = async (id: string, nombre: string) => {
    if (confirm(`¿Confirmas la liquidación y pago del sueldo a ${nombre}?`)) {
      try {
        await liquidarPlanilla(id);
        showToast('success', 'Pago Liquidado', `Planilla de ${nombre} marcada como PAGADA.`);
      } catch (err: any) {
        showToast('error', 'Error al liquidar', err.message);
      }
    }
  };

  const handleCreateAdelanto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalId || !montoAdelanto || Number(montoAdelanto) <= 0) {
      showToast('warning', 'Datos requeridos', 'Selecciona al empleado e ingresa un monto válido.');
      return;
    }

    try {
      await addAdelanto({
        personal_id: personalId,
        fecha: fechaAdelanto,
        monto: Number(montoAdelanto),
        motivo: motivoAdelanto.trim() || null
      });

      showToast('success', 'Adelanto Registrado', 'Se descontará automáticamente en el próximo pago del empleado.');
      setIsAdelantoModalOpen(false);
      setPersonalId('');
      setMontoAdelanto('');
      setMotivoAdelanto('');
      calcularPlanilla(fechaInicio, fechaFin);
    } catch (err: any) {
      showToast('error', 'Error al registrar adelanto', err.message);
    }
  };

  const handleDeleteAdelanto = async (id: string) => {
    if (confirm('¿Eliminar este adelanto de sueldo?')) {
      try {
        await deleteAdelanto(id);
        showToast('info', 'Adelanto Eliminado', 'Se removió el adelanto de sueldo.');
        calcularPlanilla(fechaInicio, fechaFin);
      } catch (err: any) {
        showToast('error', 'No se pudo eliminar', err.message);
      }
    }
  };

  const adelantosPendientesCount = adelantos.filter(a => !a.planilla_id).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-400" />
            Planilla de Pagos & Adelantos de Sueldo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Al pagar, los adelantos pendientes del empleado se descuentan automáticamente del sueldo.
          </p>
        </div>

        <button
          onClick={() => setIsAdelantoModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Adelanto de Sueldo
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { key: 'calculo', label: 'Pagar Semana', icon: Wallet },
          { key: 'historial', label: `Pagos Realizados (${planillas.length})`, icon: Receipt },
          { key: 'adelantos', label: `Adelantos (${adelantosPendientesCount} pendientes)`, icon: DollarSign }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.key ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PAGAR SEMANA */}
      {activeTab === 'calculo' && (
        <div className="space-y-6">
          {/* Selector de período */}
          <div className="glass-panel p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-sky-400" />
              <div>
                <span className="text-xs font-bold text-white block">Período a pagar</span>
                <span className="text-[11px] text-slate-400">Se cuentan los días en que cada empleado salió a ruta</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <span className="text-slate-500 text-xs">a</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <button
                onClick={handleRecalcular}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Recalcular
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <strong>Error al calcular la planilla:</strong> {error}
              {error.includes('calcular_planilla') && (
                <div className="mt-1 text-rose-200">
                  Ejecuta <code>database/migration_01_pagos_adelantos.sql</code> en el SQL Editor de Supabase.
                </div>
              )}
            </div>
          )}

          {/* Resumen del período */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total neto por pagar</span>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-0.5">{money(resumen.totalNeto)}</h3>
            </div>
            <div className="glass-card p-4 border-rose-500/20 bg-rose-500/5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Adelantos a descontar</span>
              <h3 className="text-2xl font-extrabold text-rose-400 mt-0.5">{money(resumen.totalAdelantos)}</h3>
            </div>
            <div className="glass-card p-4 border-sky-500/20 bg-sky-500/5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Empleados</span>
              <h3 className="text-2xl font-extrabold text-white mt-0.5">
                {resumen.pendientes} <span className="text-sm text-slate-400 font-semibold">por pagar</span>
                <span className="text-sm text-slate-500 font-semibold"> · {resumen.pagados} pagados</span>
              </h3>
            </div>
          </div>

          {/* Tabla de cálculo */}
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Empleado</th>
                    <th className="py-3 px-4">Tarifa</th>
                    <th className="py-3 px-4">Días</th>
                    <th className="py-3 px-4">Bruto</th>
                    <th className="py-3 px-4">Adelantos (−)</th>
                    <th className="py-3 px-4">Neto a pagar</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {calculoActual.map((item) => (
                    <tr key={item.personal_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="mb-1">{item.nombre}</div>
                        <Badge type="rol" value={item.rol} />
                      </td>
                      <td className="py-3.5 px-4 font-mono">{money(item.pago_diario)}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-extrabold">
                          {item.dias_trabajados} {item.dias_trabajados === 1 ? 'día' : 'días'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">{money(item.monto_bruto)}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-rose-400">
                        {item.total_adelantos > 0 ? `−${money(item.total_adelantos)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-400 text-sm">
                        {money(item.monto_neto)}
                        {item.saldo_adelanto > 0 && (
                          <div className="text-[10px] font-sans font-semibold text-amber-400 mt-0.5">
                            Debe {money(item.saldo_adelanto)} para la próxima semana
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.ya_pagado ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pagado
                          </span>
                        ) : item.dias_trabajados === 0 ? (
                          <span className="text-[11px] text-slate-500">Sin días trabajados</span>
                        ) : (
                          <button
                            onClick={() => setEmpleadoAPagar(item)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                          >
                            <Wallet className="w-3.5 h-3.5" /> Pagar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {calculoActual.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                No hay empleados activos. Regístralos en <strong>Gestión de Personal</strong>.
              </div>
            )}
            {loading && calculoActual.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">Calculando planilla...</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAGOS REALIZADOS */}
      {activeTab === 'historial' && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Empleado</th>
                  <th className="py-3.5 px-4">Período</th>
                  <th className="py-3.5 px-4">Días</th>
                  <th className="py-3.5 px-4">Bruto</th>
                  <th className="py-3.5 px-4">Adelantos descontados</th>
                  <th className="py-3.5 px-4">Neto pagado</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Fecha de pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {planillas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{p.personal?.nombre || 'Empleado'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{p.fecha_inicio} al {p.fecha_fin}</td>
                    <td className="py-3.5 px-4 font-bold text-sky-400">{p.dias_trabajados}d</td>
                    <td className="py-3.5 px-4 font-mono">{money(Number(p.monto_bruto))}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-400">−{money(Number(p.total_adelantos))}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-400 text-sm">{money(Number(p.monto_neto))}</td>
                    <td className="py-3.5 px-4"><Badge type="planilla" value={p.estado} /></td>
                    <td className="py-3.5 px-4 text-right">
                      {p.estado === 'pendiente' ? (
                        <button
                          onClick={() => handleLiquidar(p.id, p.personal?.nombre || '')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Liquidar
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {p.fecha_liquidacion ? new Date(p.fecha_liquidacion).toLocaleString() : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {planillas.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">Todavía no se ha registrado ningún pago.</div>
          )}
        </div>
      )}

      {/* TAB 3: ADELANTOS */}
      {activeTab === 'adelantos' && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Empleado</th>
                  <th className="py-3.5 px-4">Monto</th>
                  <th className="py-3.5 px-4">Motivo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {adelantos.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{ad.fecha}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{ad.personal?.nombre || 'Personal'}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-rose-400 text-sm">{money(Number(ad.monto))}</td>
                    <td className="py-3.5 px-4 text-slate-300">{ad.motivo || '—'}</td>
                    <td className="py-3.5 px-4">
                      {ad.planilla_id ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                          Descontado
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                          Pendiente de descontar
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!ad.planilla_id && (
                        <button
                          onClick={() => handleDeleteAdelanto(ad.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Eliminar adelanto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {adelantos.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">No hay adelantos registrados.</div>
          )}
        </div>
      )}

      {/* Modal: Confirmar pago */}
      <Modal
        isOpen={!!empleadoAPagar}
        onClose={() => !pagando && setEmpleadoAPagar(null)}
        title={`Pagar a ${empleadoAPagar?.nombre || ''}`}
      >
        {empleadoAPagar && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Período <span className="font-mono text-slate-200">{fechaInicio}</span> al{' '}
              <span className="font-mono text-slate-200">{fechaFin}</span>
            </p>

            {/* Desglose */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 divide-y divide-slate-800 text-sm">
              <div className="flex justify-between px-4 py-3">
                <span className="text-slate-400">
                  {empleadoAPagar.dias_trabajados} {empleadoAPagar.dias_trabajados === 1 ? 'día' : 'días'} × {money(empleadoAPagar.pago_diario)}
                </span>
                <span className="font-mono font-semibold text-white">{money(empleadoAPagar.monto_bruto)}</span>
              </div>

              {adelantosDelPago.map(ad => (
                <div key={ad.id} className="flex justify-between px-4 py-2.5 text-xs">
                  <span className="text-slate-400">
                    Adelanto {ad.fecha}{ad.motivo ? ` · ${ad.motivo}` : ''}
                  </span>
                  <span className="font-mono text-rose-400">−{money(Number(ad.monto))}</span>
                </div>
              ))}

              {adelantosDelPago.length === 0 && (
                <div className="px-4 py-2.5 text-xs text-slate-500">Sin adelantos pendientes</div>
              )}

              <div className="flex justify-between px-4 py-3 bg-emerald-500/5">
                <span className="font-bold text-white">Neto a pagar</span>
                <span className="font-mono font-extrabold text-emerald-400 text-lg">{money(empleadoAPagar.monto_neto)}</span>
              </div>
            </div>

            {empleadoAPagar.saldo_adelanto > 0 && (
              <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Los adelantos superan el sueldo de la semana. Se descontarán {money(empleadoAPagar.monto_bruto)} ahora
                  y los <strong>{money(empleadoAPagar.saldo_adelanto)}</strong> restantes quedarán como adelanto pendiente
                  para el próximo pago.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmpleadoAPagar(null)}
                disabled={pagando}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarPago}
                disabled={pagando}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {pagando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {pagando ? 'Registrando pago...' : `Confirmar pago de ${money(empleadoAPagar.monto_neto)}`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Registrar adelanto */}
      <Modal
        isOpen={isAdelantoModalOpen}
        onClose={() => setIsAdelantoModalOpen(false)}
        title="Registrar Adelanto de Sueldo"
      >
        <form onSubmit={handleCreateAdelanto} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Empleado *</label>
            <select
              value={personalId}
              onChange={(e) => setPersonalId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Seleccionar Empleado --</option>
              {personal.filter(p => p.activo).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.rol.toUpperCase()}) - Pago diario: ${p.pago_diario}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Monto ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={montoAdelanto}
                onChange={(e) => setMontoAdelanto(e.target.value ? Number(e.target.value) : '')}
                placeholder="50.00"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Fecha *</label>
              <input
                type="date"
                value={fechaAdelanto}
                onChange={(e) => setFechaAdelanto(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Motivo</label>
            <input
              type="text"
              value={motivoAdelanto}
              onChange={(e) => setMotivoAdelanto(e.target.value)}
              placeholder="Emergencia médica, avance de quincena, etc."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            El adelanto se descontará automáticamente la próxima vez que se le pague a este empleado.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdelantoModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              Otorgar Adelanto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
