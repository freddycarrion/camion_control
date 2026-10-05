import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getPersonal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rol, activo } = req.query;

    let query = req.db!.from('personal').select('*').order('nombre', { ascending: true });

    if (rol) {
      query = query.eq('rol', rol as string);
    }
    if (activo !== undefined) {
      query = query.eq('activo', activo === 'true');
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createPersonal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombre, rol, pago_diario, telefono, activo } = req.body;

    if (!nombre || !rol || pago_diario === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: nombre, rol, pago_diario'
      });
    }

    const newPersonal = {
      nombre: nombre.trim(),
      rol,
      pago_diario: Number(pago_diario),
      telefono: telefono ? telefono.trim() : null,
      activo: activo !== undefined ? Boolean(activo) : true,
      user_id: req.user?.id || null,
      sync_status: 'synced'
    };

    const { data, error } = await req.db!
      .from('personal')
      .insert([newPersonal])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const updatePersonal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, rol, pago_diario, telefono, activo } = req.body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    };

    if (nombre !== undefined) updateData.nombre = nombre.trim();
    if (rol !== undefined) updateData.rol = rol;
    if (pago_diario !== undefined) updateData.pago_diario = Number(pago_diario);
    if (telefono !== undefined) updateData.telefono = telefono ? telefono.trim() : null;
    if (activo !== undefined) updateData.activo = Boolean(activo);

    const { data, error } = await req.db!
      .from('personal')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const deletePersonal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await req.db!
      .from('personal')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: 'Empleado eliminado correctamente' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
