import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ReporteFinanciero } from '../types';
import { useToast } from '../components/common/Toast';
import { FileSpreadsheet, Download, Printer, Calendar, DollarSign, Truck, Users, Receipt } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportesPage = () => {
  const { showToast } = useToast();

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(today.toISOString().split('T')[0]);
  const [reporte, setReporte] = useState<ReporteFinanciero | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReporte = async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    try {
      const data = await api.get<ReporteFinanciero>(`/reportes/financiero?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
      setReporte(data);
    } catch (err: any) {
      showToast('error', 'Error al cargar reporte', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
  }, [fechaInicio, fechaFin]);

  const handleExportPDF = () => {
    if (!reporte) return;

    try {
      const doc = new jsPDF();

      // Encabezado
      doc.setFontSize(18);
      doc.setTextColor(2, 132, 199); // Sky color
      doc.text('CamiónControl - Reporte Financiero Consolidado', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Período de Evaluación: ${fechaInicio} al ${fechaFin}`, 14, 27);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 32);

      // Resumen Ejecutivo Table
      autoTable(doc, {
        startY: 38,
        head: [['CONCEPTO DE COSTO OPERATIVO', 'MONTO TOTAL ($)']],
        body: [
          ['Gastos Operativos de Camiones / Flota', `$${reporte.resumen_general.total_gastos_operativos.toFixed(2)}`],
          ['Adelantos Entregados a Personal', `$${reporte.resumen_general.total_adelantos_personal.toFixed(2)}`],
          ['Planilla Neta de Pagos Liquidada', `$${reporte.resumen_general.total_planilla_neto.toFixed(2)}`],
          ['COSTO TOTAL DE OPERACIÓN EN EL PERÍODO', `$${reporte.resumen_general.costo_total_operativo.toFixed(2)}`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [3, 105, 161] }
      });

      // Seccion 1: Gastos por Camión
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      const finalY1 = (doc as any).lastAutoTable.finalY || 80;
      doc.text('1. Desglose de Gastos Operativos por Camión', 14, finalY1 + 10);

      const gastosBody = reporte.gastos_por_camion.map(g => [
        g.camion,
        g.placa,
        g.cantidad.toString(),
        `$${g.total.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: finalY1 + 14,
        head: [['Camión / Código', 'Placa', 'Cant. Transacciones', 'Monto Acumulado ($)']],
        body: gastosBody.length > 0 ? gastosBody : [['Sin registros', '-', '-', '$0.00']],
        theme: 'grid'
      });

      // Seccion 2: Desglose Planilla de Sueldos
      const finalY2 = (doc as any).lastAutoTable.finalY || 140;
      doc.text('2. Desglose de Planilla Netas de Sueldo', 14, finalY2 + 10);

      const planillasBody = reporte.desglose_planillas.map(p => [
        p.personal,
        p.rol.toUpperCase(),
        `${p.dias_trabajados} días`,
        `$${p.monto_bruto.toFixed(2)}`,
        `-$${p.total_adelantos.toFixed(2)}`,
        `$${p.monto_neto.toFixed(2)}`,
        p.estado.toUpperCase()
      ]);

      autoTable(doc, {
        startY: finalY2 + 14,
        head: [['Personal', 'Rol', 'Días Ruta', 'Bruto', 'Adelantos', 'Neto a Pagar', 'Estado']],
        body: planillasBody.length > 0 ? planillasBody : [['Sin planillas emitidas', '-', '-', '-', '-', '$0.00', '-']],
        theme: 'grid'
      });

      doc.save(`Reporte_Financiero_CamionControl_${fechaInicio}_${fechaFin}.pdf`);
      showToast('success', 'PDF Generado', 'El archivo PDF ha sido descargado correctamente.');
    } catch (err: any) {
      showToast('error', 'Error al generar PDF', err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-sky-400" />
            Reportes Financieros & PDF
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generación de reportes consolidados por rango de fechas personalizable e impresión PDF en 1-Clic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Vista
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Selector de Rango de Fechas */}
      <div className="glass-card p-4 flex items-center gap-4 no-print">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>Rango de Evaluación:</span>
        </div>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
        />
        <span className="text-slate-500 text-xs">hasta</span>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
        />
      </div>

      {/* Vista de Reporte printable */}
      {reporte && (
        <div className="space-y-6">
          {/* Tarjetas Consolidadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 border-sky-500/20">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Gastos Operativos</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">
                ${reporte.resumen_general.total_gastos_operativos.toFixed(2)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Combustible, peajes y mecánica</p>
            </div>

            <div className="glass-panel p-5 border-amber-500/20">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Adelantos Sueldo</span>
              <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
                ${reporte.resumen_general.total_adelantos_personal.toFixed(2)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Entregados en el período</p>
            </div>

            <div className="glass-panel p-5 border-purple-500/20">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Planillas de Pago</span>
              <h3 className="text-2xl font-extrabold text-purple-400 mt-1">
                ${reporte.resumen_general.total_planilla_neto.toFixed(2)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Neto acumulado</p>
            </div>

            <div className="glass-panel p-5 border-emerald-500/30 bg-emerald-500/5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase">Costo Total Operativo</span>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
                ${reporte.resumen_general.costo_total_operativo.toFixed(2)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Gastos + Planillas + Adelantos</p>
            </div>
          </div>

          {/* Desglose 1: Gastos por camión */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-400" />
              1. Gastos Operativos Desglosados por Camión
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Camión</th>
                    <th className="py-3 px-4">Placa</th>
                    <th className="py-3 px-4">N° Transacciones</th>
                    <th className="py-3 px-4">Gasto Total Acumulado ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {reporte.gastos_por_camion.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{g.camion}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{g.placa}</td>
                      <td className="py-3 px-4">{g.cantidad} registros</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-emerald-400">
                        ${g.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Desglose 2: Planilla y Adelantos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                2. Desglose de Adelantos de Sueldo
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Personal</th>
                      <th className="py-3 px-4">Monto ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {reporte.desglose_adelantos.map((ad) => (
                      <tr key={ad.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-slate-400">{ad.fecha}</td>
                        <td className="py-3 px-4 font-bold text-white">{ad.personal}</td>
                        <td className="py-3 px-4 font-mono text-amber-400 font-bold">${ad.monto.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-panel p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                3. Desglose de Planillas Netas
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Empleado</th>
                      <th className="py-3 px-4">Días</th>
                      <th className="py-3 px-4">Neto Pagar ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {reporte.desglose_planillas.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-white">{p.personal}</td>
                        <td className="py-3 px-4 text-sky-400 font-bold">{p.dias_trabajados}d</td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">${p.monto_neto.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
