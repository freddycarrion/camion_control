import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// --- ADELANTOS DE SUELDO ---

export const getAdelantos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { personal_id, fecha_inicio, fecha_fin } = req.query;

    let query = req.db!
      .from('adelantos_sueldo')
      .select(`
        *,
        personal:personal(id, nombre, rol, pago_diario)
      `)
      .order('fecha', { ascending: false });

    if (personal_id) query = query.eq('personal_id', personal_id as string);
    if (fecha_inicio) query = query.gte('fecha', fecha_inicio as string);
    if (fecha_fin) query = query.lte('fecha', fecha_fin as string);

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createAdelanto = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { personal_id, fecha, monto, motivo } = req.body;

    if (!personal_id || monto === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: personal_id, monto'
      });
    }

    const newAdelanto = {
      personal_id,
      fecha: fecha || new Date().toISOString().split('T')[0],
      monto: Number(monto),
      motivo: motivo ? motivo.trim() : null,
      user_id: req.user?.id || null,
      sync_status: 'synced'
    };

    const { data, error } = await req.db!
      .from('adelantos_sueldo')
      .insert([newAdelanto])
      .select(`
        *,
        personal:personal(id, nombre, rol, pago_diario)
      `)
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteAdelanto = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Un adelanto ya descontado en una planilla pagada no se puede eliminar
    const { data: adelanto, error: fetchErr } = await req.db!
      .from('adelantos_sueldo')
      .select('planilla_id')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;
    if (adelanto?.planilla_id) {
      return res.status(400).json({
        success: false,
        error: 'Este adelanto ya fue descontado en una planilla pagada y no puede eliminarse'
      });
    }

    const { error } = await req.db!
      .from('adelantos_sueldo')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: 'Adelanto eliminado correctamente' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// --- PLANILLAS DE PAGO ---

// Convierte una fila de la función SQL calcular_planilla al formato del frontend
const mapCalculo = (row: any, fecha_inicio: string, fecha_fin: string) => ({
  personal_id: row.personal_id,
  nombre: row.nombre,
  rol: row.rol,
  pago_diario: Number(row.pago_diario),
  dias_trabajados: Number(row.dias_trabajados),
  monto_bruto: Number(row.monto_bruto),
  total_adelantos: Number(row.total_adelantos),
  monto_neto: Number(row.monto_neto),
  saldo_adelanto: Number(row.saldo_adelanto),
  ya_pagado: Boolean(row.ya_pagado),
  fecha_inicio,
  fecha_fin
});

export const calcularPlanillaSemanal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha_inicio, fecha_fin, personal_id } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        error: 'Debe especificar fecha_inicio y fecha_fin para el cálculo de planilla'
      });
    }

    // El cálculo se hace en PostgreSQL (función calcular_planilla) para que
    // coincida exactamente con lo que se cobra al pagar
    const { data, error } = await req.db!.rpc('calcular_planilla', {
      p_inicio: fecha_inicio as string,
      p_fin: fecha_fin as string,
      p_personal_id: (personal_id as string) || null
    });

    if (error) throw error;

    const resultados = (data || []).map((row: any) =>
      mapCalculo(row, fecha_inicio as string, fecha_fin as string)
    );

    return res.json({ success: true, data: resultados });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Paga a un empleado: crea la planilla 'pagado' y descuenta sus adelantos pendientes
export const pagarEmpleado = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { personal_id, fecha_inicio, fecha_fin } = req.body;

    if (!personal_id || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: personal_id, fecha_inicio, fecha_fin'
      });
    }

    const { data, error } = await req.db!.rpc('pagar_empleado', {
      p_personal_id: personal_id,
      p_inicio: fecha_inicio,
      p_fin: fecha_fin
    });

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const getPlanillas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { personal_id, estado, fecha_inicio, fecha_fin } = req.query;

    let query = req.db!
      .from('planillas_pago')
      .select(`
        *,
        personal:personal(id, nombre, rol, pago_diario)
      `)
      .order('fecha_inicio', { ascending: false });

    if (personal_id) query = query.eq('personal_id', personal_id as string);
    if (estado) query = query.eq('estado', estado as string);
    if (fecha_inicio) query = query.gte('fecha_inicio', fecha_inicio as string);
    if (fecha_fin) query = query.lte('fecha_fin', fecha_fin as string);

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const guardarPlanilla = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      personal_id,
      fecha_inicio,
      fecha_fin,
      dias_trabajados,
      pago_diario,
      monto_bruto,
      total_adelantos,
      monto_neto,
      estado
    } = req.body;

    const payload = {
      personal_id,
      fecha_inicio,
      fecha_fin,
      dias_trabajados: Number(dias_trabajados),
      pago_diario: Number(pago_diario),
      monto_bruto: Number(monto_bruto),
      total_adelantos: Number(total_adelantos),
      monto_neto: Number(monto_neto),
      estado: estado || 'pendiente',
      fecha_liquidacion: estado === 'pagado' ? new Date().toISOString() : null,
      user_id: req.user?.id || null,
      sync_status: 'synced'
    };

    const { data, error } = await req.db!
      .from('planillas_pago')
      .insert([payload])
      .select(`
        *,
        personal:personal(id, nombre, rol, pago_diario)
      `)
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const liquidarPlanilla = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.db!
      .from('planillas_pago')
      .update({
        estado: 'pagado',
        fecha_liquidacion: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'synced'
      })
      .eq('id', id)
      .select(`
        *,
        personal:personal(id, nombre, rol)
      `)
      .single();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
