import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ReporteFinanciero } from '../types';
import { useToast } from '../components/common/Toast';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Coins,
  User,
  FileText,
  Wallet,
  Truck,
  Receipt
} from 'lucide-react';
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
      const doc = new jsPDF('p', 'mm', 'a4');

      // Título Encabezado
      doc.setFontSize(16);
      doc.setTextColor(30, 98, 208); // Blue
      doc.setFont('helvetica', 'bold');
      doc.text('CamiónControl - Reporte Financiero Consolidado', 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período de Evaluación: ${fechaInicio} al ${fechaFin}`, 14, 24);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 29);

      // 4 Tarjetas Resumen Top (2x2 Grid)
      const startY = 35;
      const cardWidth = 88;
      const cardHeight = 24;

      // Card 1: Gastos Operativos
      doc.setFillColor(30, 98, 208); // Header Blue
      doc.roundedRect(14, startY, cardWidth, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('GASTOS OPERATIVOS', 18, startY + 4.5);

      doc.setFillColor(240, 247, 255); // Body Light Blue
      doc.setDrawColor(30, 98, 208);
      doc.setLineWidth(0.4);
      doc.roundedRect(14, startY + 7, cardWidth, cardHeight - 7, 0, 0, 'FD');

      doc.setFontSize(14);
      doc.setTextColor(30, 98, 208);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${reporte.resumen_general.total_gastos_operativos.toFixed(2)}`, 18, startY + 14);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Combustible, peajes y mecánica', 18, startY + 19);

      // Card 2: Adelantos Sueldo
      const card2X = 108;
      doc.setFillColor(243, 130, 26); // Header Orange
      doc.roundedRect(card2X, startY, cardWidth, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('ADELANTOS SUELDO', card2X + 4, startY + 4.5);

      doc.setFillColor(255, 247, 237);
      doc.setDrawColor(243, 130, 26);
      doc.setLineWidth(0.4);
      doc.roundedRect(card2X, startY + 7, cardWidth, cardHeight - 7, 0, 0, 'FD');

      doc.setFontSize(14);
      doc.setTextColor(243, 130, 26);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${reporte.resumen_general.total_adelantos_personal.toFixed(2)}`, card2X + 4, startY + 14);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Entregados en el periodo', card2X + 4, startY + 19);

      // Row 2 of Cards
      const startY2 = startY + cardHeight + 4;

      // Card 3: Planillas de Pago
      doc.setFillColor(124, 58, 237); // Header Purple
      doc.roundedRect(14, startY2, cardWidth, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('PLANILLAS DE PAGO', 18, startY2 + 4.5);

      doc.setFillColor(250, 245, 255);
      doc.setDrawColor(124, 58, 237);
      doc.setLineWidth(0.4);
      doc.roundedRect(14, startY2 + 7, cardWidth, cardHeight - 7, 0, 0, 'FD');

      doc.setFontSize(14);
      doc.setTextColor(124, 58, 237);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${reporte.resumen_general.total_planilla_neto.toFixed(2)}`, 18, startY2 + 14);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Neto acumulado', 18, startY2 + 19);

      // Card 4: Costo Total Operativo
      doc.setFillColor(5, 150, 105); // Header Green
      doc.roundedRect(card2X, startY2, cardWidth, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('COSTO TOTAL OPERATIVO', card2X + 4, startY2 + 4.5);

      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(0.4);
      doc.roundedRect(card2X, startY2 + 7, cardWidth, cardHeight - 7, 0, 0, 'FD');

      doc.setFontSize(14);
      doc.setTextColor(5, 150, 105);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${reporte.resumen_general.costo_total_operativo.toFixed(2)}`, card2X + 4, startY2 + 14);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Gastos + Planillas + Adelantos', card2X + 4, startY2 + 19);

      // Sección 1: Gastos por Camión
      const section1Y = startY2 + cardHeight + 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 98, 208);
      doc.text('1. Gastos Operativos Desglosados por Camión', 14, section1Y);

      const gastosBody = reporte.gastos_por_camion.map(g => [
        g.camion,
        g.placa,
        `${g.cantidad} registros`,
        `$${g.total.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: section1Y + 3,
        head: [['Camión', 'Placa', 'N° Transacciones', 'Gasto Total Acumulado ($)']],
        body: gastosBody.length > 0 ? gastosBody : [['No hay registros en este apartado.', '', '', '']],
        theme: 'grid',
        headStyles: { fillColor: [30, 98, 208], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        columnStyles: {
          3: { fontStyle: 'bold', halign: 'right' }
        }
      });

      // Sección 2: Desglose Adelantos de Sueldo
      const section2Y = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(124, 58, 237);
      doc.text('2. Desglose de Adelantos de Sueldo', 14, section2Y);

      const adelantosBody = reporte.desglose_adelantos.map(ad => [
        ad.fecha,
        ad.personal,
        `$${ad.monto.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: section2Y + 3,
        head: [['Fecha', 'Personal', 'Monto ($)']],
        body: adelantosBody.length > 0 ? adelantosBody : [['No hay registros en este apartado.', '', '']],
        theme: 'grid',
        headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        columnStyles: {
          2: { fontStyle: 'bold', halign: 'right' }
        }
      });

      // Sección 3: Desglose de Planillas Netas
      const section3Y = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text('3. Desglose de Planillas Netas', 14, section3Y);

      const planillasBody = reporte.desglose_planillas.map(p => [
        p.personal,
        `${p.dias_trabajados} días`,
        `$${p.monto_neto.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: section3Y + 3,
        head: [['Empleado', 'Días', 'Neto Pagar ($)']],
        body: planillasBody.length > 0 ? planillasBody : [['No hay registros en este apartado.', '', '']],
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        columnStyles: {
          2: { fontStyle: 'bold', halign: 'right' }
        }
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header no-print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 sm:p-6 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400" />
            Reportes Financieros & Hoja de Impresión
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generación de reportes consolidados con diseño visual idéntico para pantalla e impresión PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all min-h-[40px] sm:min-h-0"
          >
            <Printer className="w-4 h-4" />
            Imprimir Hoja
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all min-h-[40px] sm:min-h-0"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Selector de Rango de Fechas no-print */}
      <div className="glass-card p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 no-print">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Calendar className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>Rango de Evaluación:</span>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 py-2 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white flex-1"
          />
          <span className="text-slate-500 text-xs">hasta</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 py-2 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white flex-1"
          />
        </div>
      </div>

      {/* Hoja de Impresión Visual Printable Container */}
      {reporte && (
        <div className="report-sheet-container bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
          {/* Tarjetas KPI Top Grid (2x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Gastos Operativos (Blue) */}
            <div className="rounded-2xl border-2 border-[#1e62d0] overflow-hidden bg-[#f0f7ff] shadow-sm">
              <div className="bg-[#1e62d0] text-white px-4 py-2.5 flex items-center gap-2.5">
                <Coins className="w-5 h-5 flex-shrink-0" />
                <span className="font-extrabold text-xs tracking-wider uppercase">GASTOS OPERATIVOS</span>
              </div>
              <div className="p-4 space-y-0.5">
                <h3 className="text-3xl font-extrabold text-[#1e62d0] tracking-tight">
                  ${reporte.resumen_general.total_gastos_operativos.toFixed(2)}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Combustible, peajes y mecánica
                </p>
              </div>
            </div>

            {/* Card 2: Adelantos Sueldo (Orange) */}
            <div className="rounded-2xl border-2 border-[#f3821a] overflow-hidden bg-[#fff7ed] shadow-sm">
              <div className="bg-[#f3821a] text-white px-4 py-2.5 flex items-center gap-2.5">
                <User className="w-5 h-5 flex-shrink-0" />
                <span className="font-extrabold text-xs tracking-wider uppercase">ADELANTOS SUELDO</span>
              </div>
              <div className="p-4 space-y-0.5">
                <h3 className="text-3xl font-extrabold text-[#f3821a] tracking-tight">
                  ${reporte.resumen_general.total_adelantos_personal.toFixed(2)}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Entregados en el periodo
                </p>
              </div>
            </div>

            {/* Card 3: Planillas de Pago (Purple) */}
            <div className="rounded-2xl border-2 border-[#7c3aed] overflow-hidden bg-[#faf5ff] shadow-sm">
              <div className="bg-[#7c3aed] text-white px-4 py-2.5 flex items-center gap-2.5">
                <FileText className="w-5 h-5 flex-shrink-0" />
                <span className="font-extrabold text-xs tracking-wider uppercase">PLANILLAS DE PAGO</span>
              </div>
              <div className="p-4 space-y-0.5">
                <h3 className="text-3xl font-extrabold text-[#7c3aed] tracking-tight">
                  ${reporte.resumen_general.total_planilla_neto.toFixed(2)}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Neto acumulado
                </p>
              </div>
            </div>

            {/* Card 4: Costo Total Operativo (Green) */}
            <div className="rounded-2xl border-2 border-[#059669] overflow-hidden bg-[#f0fdf4] shadow-sm">
              <div className="bg-[#059669] text-white px-4 py-2.5 flex items-center gap-2.5">
                <Wallet className="w-5 h-5 flex-shrink-0" />
                <span className="font-extrabold text-xs tracking-wider uppercase">COSTO TOTAL OPERATIVO</span>
              </div>
              <div className="p-4 space-y-0.5">
                <h3 className="text-3xl font-extrabold text-[#059669] tracking-tight">
                  ${reporte.resumen_general.costo_total_operativo.toFixed(2)}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Gastos + Planillas + Adelantos
                </p>
              </div>
            </div>
          </div>

          {/* Sección 1: Gastos Operativos Desglosados por Camión */}
          <div className="rounded-2xl border-2 border-[#1e62d0] overflow-hidden bg-white shadow-sm page-break-inside-avoid">
            <div className="bg-[#1e62d0] text-white px-4 py-3 flex items-center gap-2.5">
              <Truck className="w-5 h-5 flex-shrink-0" />
              <h2 className="font-extrabold text-sm sm:text-base tracking-wide">
                1. Gastos Operativos Desglosados por Camión
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#e0f2fe] text-[#1e3a8a] border-b border-[#bae6fd] font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-center">Camión</th>
                    <th className="py-3 px-4 text-center">Placa</th>
                    <th className="py-3 px-4 text-center">N° Transacciones</th>
                    <th className="py-3 px-4 text-center">Gasto Total Acumulado ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reporte.gastos_por_camion.length > 0 ? (
                    reporte.gastos_por_camion.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-extrabold text-slate-900 text-center">{g.camion}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700 text-center">{g.placa}</td>
                        <td className="py-3 px-4 font-medium text-slate-700 text-center">{g.cantidad} registros</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 text-center">
                          ${g.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold text-xs">
                        No hay registros en este apartado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sección 2: Desglose de Adelantos de Sueldo */}
          <div className="rounded-2xl border-2 border-[#7c3aed] overflow-hidden bg-white shadow-sm page-break-inside-avoid">
            <div className="bg-[#7c3aed] text-white px-4 py-3 flex items-center gap-2.5">
              <User className="w-5 h-5 flex-shrink-0" />
              <h2 className="font-extrabold text-sm sm:text-base tracking-wide">
                2. Desglose de Adelantos de Sueldo
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f3e8ff] text-[#581c87] border-b border-[#e9d5ff] font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-center">Fecha</th>
                    <th className="py-3 px-4 text-center">Personal</th>
                    <th className="py-3 px-4 text-center">Monto ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reporte.desglose_adelantos.length > 0 ? (
                    reporte.desglose_adelantos.map((ad) => (
                      <tr key={ad.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700 text-center">{ad.fecha}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 text-center">{ad.personal}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 text-center">${ad.monto.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 font-semibold text-xs">
                        No hay registros en este apartado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sección 3: Desglose de Planillas Netas */}
          <div className="rounded-2xl border-2 border-[#059669] overflow-hidden bg-white shadow-sm page-break-inside-avoid">
            <div className="bg-[#059669] text-white px-4 py-3 flex items-center gap-2.5">
              <Receipt className="w-5 h-5 flex-shrink-0" />
              <h2 className="font-extrabold text-sm sm:text-base tracking-wide">
                3. Desglose de Planillas Netas
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#dcfce7] text-[#064e3b] border-b border-[#bbf7d0] font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-center">Empleado</th>
                    <th className="py-3 px-4 text-center">Días</th>
                    <th className="py-3 px-4 text-center">Neto Pagar ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reporte.desglose_planillas.length > 0 ? (
                    reporte.desglose_planillas.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-extrabold text-slate-900 text-center">{p.personal}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 text-center">{p.dias_trabajados} días</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 text-center">${p.monto_neto.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 font-semibold text-xs">
                        No hay registros en este apartado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
