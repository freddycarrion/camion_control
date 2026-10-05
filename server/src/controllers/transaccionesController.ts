import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getTransacciones = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha_inicio, fecha_fin, camion_id, categoria } = req.query;

    let query = req.db!
      .from('transacciones')
      .select(`
        *,
        camion:camiones(id, placa, codigo_interno, modelo)
      `)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (fecha_inicio) {
      query = query.gte('fecha', fecha_inicio as string);
    }
    if (fecha_fin) {
      query = query.lte('fecha', fecha_fin as string);
    }
    if (camion_id) {
      query = query.eq('camion_id', camion_id as string);
    }
    if (categoria) {
      query = query.eq('categoria', categoria as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createTransaccion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha, camion_id, concepto, categoria, monto, observaciones } = req.body;

    if (!concepto || !categoria || monto === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: concepto, categoria, monto'
      });
    }

    const newTransaccion = {
      fecha: fecha || new Date().toISOString().split('T')[0],
      camion_id: camion_id || null,
      concepto: concepto.trim(),
      categoria,
      monto: Number(monto),
      observaciones: observaciones ? observaciones.trim() : null,
      user_id: req.user?.id || null,
      sync_status: 'synced'
    };

    const { data, error } = await req.db!
      .from('transacciones')
      .insert([newTransaccion])
      .select(`
        *,
        camion:camiones(id, placa, codigo_interno, modelo)
      `)
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteTransaccion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await req.db!
      .from('transacciones')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: 'Transacción eliminada correctamente' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
