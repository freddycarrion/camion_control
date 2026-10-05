import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getReporteFinanciero = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar un rango de fechas válido (fecha_inicio y fecha_fin)'
      });
    }

    const inicioStr = fecha_inicio as string;
    const finStr = fecha_fin as string;

    // 1. Gastos Operativos por Camión en el rango
    const { data: transacciones, error: transErr } = await req.db!
      .from('transacciones')
      .select(`
        id,
        fecha,
        concepto,
        categoria,
        monto,
        camion_id,
        camion:camiones(placa, codigo_interno, modelo)
      `)
      .gte('fecha', inicioStr)
      .lte('fecha', finStr);

    if (transErr) throw transErr;

    // Agrupar gastos por camión
    const gastosPorCamionMap: Record<string, { camion: string; placa: string; total: number; cantidad: number }> = {};
    let totalGastosFlota = 0;

    (transacciones || []).forEach((t: any) => {
      const montoNum = Number(t.monto);
      totalGastosFlota += montoNum;

      const key = t.camion_id ? t.camion_id : 'flota_general';
      const label = t.camion ? `${t.camion.codigo_interno} (${t.camion.placa})` : 'Gastos Generales de Flota';
      const placa = t.camion ? t.camion.placa : 'N/A';

      if (!gastosPorCamionMap[key]) {
        gastosPorCamionMap[key] = { camion: label, placa, total: 0, cantidad: 0 };
      }
      gastosPorCamionMap[key].total += montoNum;
      gastosPorCamionMap[key].cantidad += 1;
    });

    const gastosPorCamion = Object.values(gastosPorCamionMap);

    // 2. Adelantos entregados al personal
    const { data: adelantos, error: adErr } = await req.db!
      .from('adelantos_sueldo')
      .select(`
        id,
        fecha,
        monto,
        motivo,
        personal:personal(nombre, rol)
      `)
      .gte('fecha', inicioStr)
      .lte('fecha', finStr);

    if (adErr) throw adErr;

    let totalAdelantos = 0;
    const desgloseAdelantos = (adelantos || []).map((ad: any) => {
      const m = Number(ad.monto);
      totalAdelantos += m;
      return {
        id: ad.id,
        fecha: ad.fecha,
        personal: ad.personal?.nombre || 'Desconocido',
        rol: ad.personal?.rol || 'N/A',
        monto: m,
        motivo: ad.motivo || '-'
      };
    });

    // 3. Pagos netos de planilla en el rango
    const { data: planillas, error: planErr } = await req.db!
      .from('planillas_pago')
      .select(`
        id,
        fecha_inicio,
        fecha_fin,
        dias_trabajados,
        monto_bruto,
        total_adelantos,
        monto_neto,
        estado,
        personal:personal(nombre, rol)
      `)
      .gte('fecha_inicio', inicioStr)
      .lte('fecha_fin', finStr);

    if (planErr) throw planErr;

    let totalPlanillaNeto = 0;
    let totalPlanillaBruto = 0;

    const desglosePlanillas = (planillas || []).map((p: any) => {
      const neto = Number(p.monto_neto);
      const bruto = Number(p.monto_bruto);
      totalPlanillaNeto += neto;
      totalPlanillaBruto += bruto;

      return {
        id: p.id,
        personal: p.personal?.nombre || 'Desconocido',
        rol: p.personal?.rol || 'N/A',
        dias_trabajados: p.dias_trabajados,
        monto_bruto: bruto,
        total_adelantos: Number(p.total_adelantos),
        monto_neto: neto,
        estado: p.estado
      };
    });

    // 4. Gran Total Consolidado
    const costoTotalOperacion = totalGastosFlota + totalPlanillaNeto + totalAdelantos;

    return res.json({
      success: true,
      periodo: {
        fecha_inicio: inicioStr,
        fecha_fin: finStr
      },
      resumen_general: {
        total_gastos_operativos: totalGastosFlota,
        total_adelantos_personal: totalAdelantos,
        total_planilla_neto: totalPlanillaNeto,
        total_planilla_bruto: totalPlanillaBruto,
        costo_total_operativo: costoTotalOperacion
      },
      gastos_por_camion: gastosPorCamion,
      desglose_adelantos: desgloseAdelantos,
      desglose_planillas: desglosePlanillas,
      detalle_transacciones: transacciones
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
