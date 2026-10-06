import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getAsignaciones = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha, camion_id } = req.query;

    let query = req.db!
      .from('asignaciones_diarias')
      .select(`
        *,
        camion:camiones(id, placa, codigo_interno, modelo, estado),
        chofer:personal(id, nombre, telefono, pago_diario),
        ayudantes:asignacion_ayudantes(
          id,
          personal_id,
          nombre_temporal,
          es_temporal,
          personal:personal(id, nombre, telefono, pago_diario)
        )
      `)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (fecha) {
      query = query.eq('fecha', fecha as string);
    }
    if (camion_id) {
      query = query.eq('camion_id', camion_id as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createAsignacion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { numero_planilla, fecha, camion_id, chofer_id, observaciones, ayudantes } = req.body;

    if (!camion_id) {
      return res.status(400).json({
        success: false,
        error: 'Debe especificar un camión para la asignación'
      });
    }

    const fechaAsignacion = fecha || new Date().toISOString().split('T')[0];
    const folioPlanilla = (numero_planilla && numero_planilla.trim().length > 0)
      ? numero_planilla.trim()
      : `PLN-${fechaAsignacion.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Insertar asignación principal
    const newAsignacion = {
      numero_planilla: folioPlanilla,
      fecha: fechaAsignacion,
      camion_id,
      chofer_id: chofer_id || null,
      estado: 'en_curso',
      observaciones: observaciones || null,
      user_id: req.user?.id || null,
      sync_status: 'synced'
    };

    const { data: asignacionData, error: asignacionError } = await req.db!
      .from('asignaciones_diarias')
      .insert([newAsignacion])
      .select()
      .single();

    if (asignacionError) throw asignacionError;

    // 2. Actualizar estado del camión a 'en_ruta'
    await req.db!
      .from('camiones')
      .update({ estado: 'en_ruta', updated_at: new Date().toISOString() })
      .eq('id', camion_id);

    // 3. Insertar ayudantes (si existen)
    let ayudantesInsertados: any[] = [];
    if (ayudantes && Array.isArray(ayudantes) && ayudantes.length > 0) {
      const ayudantesPayload = ayudantes.map((ay: any) => ({
        asignacion_id: asignacionData.id,
        personal_id: ay.es_temporal ? null : ay.personal_id,
        nombre_temporal: ay.es_temporal ? ay.nombre_temporal?.trim() : null,
        es_temporal: Boolean(ay.es_temporal),
        user_id: req.user?.id || null,
        sync_status: 'synced'
      }));

      const { data: ayData, error: ayError } = await req.db!
        .from('asignacion_ayudantes')
        .insert(ayudantesPayload)
        .select(`
          *,
          personal:personal(id, nombre, telefono, pago_diario)
        `);

      if (ayError) throw ayError;
      ayudantesInsertados = ayData || [];
    }

    return res.status(201).json({
      success: true,
      data: {
        ...asignacionData,
        ayudantes: ayudantesInsertados
      }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const updateEstadoAsignacion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['en_curso', 'completado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado de asignación no válido' });
    }

    // Obtener asignación actual
    const { data: currentAsignacion, error: fetchErr } = await req.db!
      .from('asignaciones_diarias')
      .select('camion_id')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    const { data, error } = await req.db!
      .from('asignaciones_diarias')
      .update({
        estado,
        updated_at: new Date().toISOString(),
        sync_status: 'synced'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Si la asignación finaliza o se cancela, liberar el camión
    if (estado === 'completado' || estado === 'cancelado') {
      await req.db!
        .from('camiones')
        .update({ estado: 'disponible', updated_at: new Date().toISOString() })
        .eq('id', currentAsignacion.camion_id);
    }

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteAsignacion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: asignacion } = await req.db!
      .from('asignaciones_diarias')
      .select('camion_id')
      .eq('id', id)
      .single();

    const { error } = await req.db!
      .from('asignaciones_diarias')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (asignacion?.camion_id) {
      await req.db!
        .from('camiones')
        .update({ estado: 'disponible', updated_at: new Date().toISOString() })
        .eq('id', asignacion.camion_id);
    }

    return res.json({ success: true, message: 'Asignación eliminada correctamente' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
