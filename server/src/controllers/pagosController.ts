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

    // Verificar de forma segura si el adelanto ya fue descontado en una planilla
    try {
      const { data: adelanto, error: fetchErr } = await req.db!
        .from('adelantos_sueldo')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!fetchErr && adelanto && (adelanto as any).planilla_id) {
        return res.status(400).json({
          success: false,
          error: 'Este adelanto ya fue descontado en una planilla pagada y no puede eliminarse'
        });
      }
    } catch (checkErr) {
      console.warn('Omitiendo verificación de planilla_id en adelantos_sueldo:', checkErr);
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

    const fInicio = fecha_inicio as string;
    const fFin = fecha_fin as string;
    const pId = (personal_id as string) || null;

    try {
      // Intentar primero ejecutar la función PostgreSQL en Supabase
      const { data, error } = await req.db!.rpc('calcular_planilla', {
        p_inicio: fInicio,
        p_fin: fFin,
        p_personal_id: pId
      });

      if (error) throw error;

      const resultados = (data || []).map((row: any) =>
        mapCalculo(row, fInicio, fFin)
      );

      return res.json({ success: true, data: resultados });
    } catch (rpcErr: any) {
      console.warn('RPC calcular_planilla falló o aún no existe en Supabase, ejecutando fallback backend:', rpcErr.message);

      // Fallback automático por consulta directa si la función SQL no está creada aún en Supabase
      let personalQuery = req.db!.from('personal').select('*').eq('activo', true);
      if (pId) personalQuery = personalQuery.eq('id', pId);

      const [
        { data: personalList },
        { data: asignacionesList },
        { data: ayudantesList },
        { data: adelantosList },
        { data: planillasList }
      ] = await Promise.all([
        personalQuery,
        req.db!.from('asignaciones_diarias').select('*').gte('fecha', fInicio).lte('fecha', fFin).neq('estado', 'cancelado'),
        req.db!.from('asignacion_ayudantes').select('*'),
        req.db!.from('adelantos_sueldo').select('*').lte('fecha', fFin),
        req.db!.from('planillas_pago').select('*').lte('fecha_inicio', fFin).gte('fecha_fin', fInicio)
      ]);

      const asignacionesIds = new Set((asignacionesList || []).map((a: any) => a.id));
      const ayudantesValidos = (ayudantesList || []).filter((ay: any) => asignacionesIds.has(ay.asignacion_id));

      const resultadosFallback = (personalList || []).map((emp: any) => {
        const fechasTrabajadas = new Set<string>();

        (asignacionesList || []).forEach((a: any) => {
          if (a.chofer_id === emp.id) fechasTrabajadas.add(a.fecha);
        });

        ayudantesValidos.forEach((ay: any) => {
          if (ay.personal_id === emp.id) {
            const asig = (asignacionesList || []).find((a: any) => a.id === ay.asignacion_id);
            if (asig) fechasTrabajadas.add(asig.fecha);
          }
        });

        const diasTrabajados = fechasTrabajadas.size;
        const totalAdelantos = (adelantosList || [])
          .filter((ad: any) => ad.personal_id === emp.id)
          .reduce((sum: number, ad: any) => sum + Number(ad.monto), 0);

        const bruto = diasTrabajados * Number(emp.pago_diario);
        const neto = Math.max(0, bruto - totalAdelantos);
        const saldoAdelanto = Math.max(0, totalAdelantos - bruto);
        const yaPagado = (planillasList || []).some((p: any) => p.personal_id === emp.id);

        return {
          personal_id: emp.id,
          nombre: emp.nombre,
          rol: emp.rol,
          pago_diario: Number(emp.pago_diario),
          dias_trabajados: diasTrabajados,
          monto_bruto: bruto,
          total_adelantos: totalAdelantos,
          monto_neto: neto,
          saldo_adelanto: saldoAdelanto,
          ya_pagado: yaPagado,
          fecha_inicio: fInicio,
          fecha_fin: fFin
        };
      });

      resultadosFallback.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
      return res.json({ success: true, data: resultadosFallback });
    }
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

    try {
      const { data, error } = await req.db!.rpc('pagar_empleado', {
        p_personal_id: personal_id,
        p_inicio: fecha_inicio,
        p_fin: fecha_fin
      });

      if (error) throw error;
      return res.status(201).json({ success: true, data });
    } catch (rpcErr: any) {
      console.warn('RPC pagar_empleado falló o no existe, usando fallback:', rpcErr.message);

      // Fallback backend para pagar empleado si la función SQL no está cargada aún
      const { data: emp } = await req.db!.from('personal').select('*').eq('id', personal_id).single();
      if (!emp) throw new Error('Empleado no encontrado');

      // Buscar asignaciones y ayudantes
      const { data: asignacionesList } = await req.db!
        .from('asignaciones_diarias')
        .select('*')
        .gte('fecha', fecha_inicio)
        .lte('fecha', fecha_fin)
        .neq('estado', 'cancelado');

      const asignacionesIds = new Set((asignacionesList || []).map((a: any) => a.id));
      const { data: ayudantesList } = await req.db!.from('asignacion_ayudantes').select('*');
      const ayudantesValidos = (ayudantesList || []).filter((ay: any) => asignacionesIds.has(ay.asignacion_id));

      const fechasTrabajadas = new Set<string>();
      (asignacionesList || []).forEach((a: any) => {
        if (a.chofer_id === personal_id) fechasTrabajadas.add(a.fecha);
      });
      ayudantesValidos.forEach((ay: any) => {
        if (ay.personal_id === personal_id) {
          const asig = (asignacionesList || []).find((a: any) => a.id === ay.asignacion_id);
          if (asig) fechasTrabajadas.add(asig.fecha);
        }
      });

      const diasTrabajados = fechasTrabajadas.size;
      if (diasTrabajados === 0) {
        throw new Error(`El empleado no tiene días trabajados en el período ${fecha_inicio} al ${fecha_fin}`);
      }

      const { data: todosAdelantos } = await req.db!
        .from('adelantos_sueldo')
        .select('*')
        .eq('personal_id', personal_id)
        .lte('fecha', fecha_fin);

      const adelantosPendientes = (todosAdelantos || []).filter((a: any) => !a.planilla_id);

      const totalAdelantos = (adelantosPendientes || []).reduce((s: number, a: any) => s + Number(a.monto), 0);
      const montoBruto = diasTrabajados * Number(emp.pago_diario);
      const montoDescontado = Math.min(montoBruto, totalAdelantos);
      const montoNeto = Math.max(0, montoBruto - totalAdelantos);
      const saldoAdelanto = Math.max(0, totalAdelantos - montoBruto);

      // Crear registro en planillas_pago
      const { data: nuevaPlanilla, error: pErr } = await req.db!
        .from('planillas_pago')
        .insert([{
          personal_id,
          fecha_inicio,
          fecha_fin,
          dias_trabajados: diasTrabajados,
          pago_diario: Number(emp.pago_diario),
          monto_bruto: montoBruto,
          total_adelantos: montoDescontado,
          monto_neto: montoNeto,
          estado: 'pagado',
          fecha_liquidacion: new Date().toISOString(),
          user_id: req.user?.id || null,
          sync_status: 'synced'
        }])
        .select()
        .single();

      if (pErr) throw pErr;

      // Descontar adelantos vinculándolos a la nueva planilla
      if (adelantosPendientes && adelantosPendientes.length > 0) {
        const adelantoIds = adelantosPendientes.map((a: any) => a.id);
        await req.db!
          .from('adelantos_sueldo')
          .update({ planilla_id: nuevaPlanilla.id })
          .in('id', adelantoIds);
      }

      // Si quedó saldo de adelantos, crear adelanto con la diferencia para el siguiente periodo
      if (saldoAdelanto > 0) {
        const fechaSiguiente = new Date(fecha_fin);
        fechaSiguiente.setDate(fechaSiguiente.getDate() + 1);
        const fSigStr = fechaSiguiente.toISOString().split('T')[0];

        await req.db!.from('adelantos_sueldo').insert([{
          personal_id,
          fecha: fSigStr,
          monto: saldoAdelanto,
          motivo: `Saldo de adelantos no cubierto por la planilla ${fecha_inicio} al ${fecha_fin}`,
          user_id: req.user?.id || null,
          sync_status: 'synced'
        }]);
      }

      return res.status(201).json({ success: true, data: nuevaPlanilla });
    }
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
