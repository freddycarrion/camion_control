import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getGastosPersonales = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha_inicio, fecha_fin, categoria, metodo_pago } = req.query;

    let query = req.db!
      .from('gastos_personales')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (fecha_inicio) {
      query = query.gte('fecha', fecha_inicio as string);
    }
    if (fecha_fin) {
      query = query.lte('fecha', fecha_fin as string);
    }
    if (categoria) {
      query = query.eq('categoria', categoria as string);
    }
    if (metodo_pago) {
      query = query.eq('metodo_pago', metodo_pago as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createGastoPersonal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha, concepto, categoria, monto, metodo_pago, observaciones } = req.body;

    if (!concepto || !monto || Number(monto) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: concepto, monto (mayor a 0)'
      });
    }

    const newRecord = {
      fecha: fecha || new Date().toISOString().split('T')[0],
      concepto: concepto.trim(),
      categoria: categoria || 'otros',
      monto: Number(monto),
      metodo_pago: metodo_pago || 'efectivo',
      observaciones: observaciones ? observaciones.trim() : null,
      user_id: req.user?.id || null,
      sync_status: 'synced'
    };

    const { data, error } = await req.db!
      .from('gastos_personales')
      .insert([newRecord])
      .select('*')
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const updateGastoPersonal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fecha, concepto, categoria, monto, metodo_pago, observaciones } = req.body;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (fecha !== undefined) updateData.fecha = fecha;
    if (concepto !== undefined) updateData.concepto = concepto.trim();
    if (categoria !== undefined) updateData.categoria = categoria;
    if (monto !== undefined) updateData.monto = Number(monto);
    if (metodo_pago !== undefined) updateData.metodo_pago = metodo_pago;
    if (observaciones !== undefined) updateData.observaciones = observaciones ? observaciones.trim() : null;

    const { data, error } = await req.db!
      .from('gastos_personales')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteGastoPersonal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await req.db!
      .from('gastos_personales')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: 'Gasto personal eliminado correctamente' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
