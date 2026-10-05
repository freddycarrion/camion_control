import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getCamiones = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await req.db!
      .from('camiones')
      .select(`
        *,
        chofer_titular:personal(id, nombre, telefono, pago_diario)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getCamionById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await req.db!
      .from('camiones')
      .select(`
        *,
        chofer_titular:personal(id, nombre, telefono, pago_diario)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(404).json({ success: false, error: 'Camión no encontrado' });
  }
};

export const createCamion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { placa, codigo_interno, modelo, anio, estado, chofer_titular_id } = req.body;

    if (!placa || !codigo_interno || !modelo || !anio) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: placa, codigo_interno, modelo, anio'
      });
    }

    const newCamion = {
      placa: placa.trim().toUpperCase(),
      codigo_interno: codigo_interno.trim().toUpperCase(),
      modelo,
      anio: Number(anio),
      estado: estado || 'disponible',
      chofer_titular_id: chofer_titular_id || null,
      user_id: req.user?.id || null,
      sync_status: 'synced'
    };

    const { data, error } = await req.db!
      .from('camiones')
      .insert([newCamion])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const updateCamion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { placa, codigo_interno, modelo, anio, estado, chofer_titular_id } = req.body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
      sync_status: 'synced'
    };

    if (placa !== undefined) updateData.placa = placa.trim().toUpperCase();
    if (codigo_interno !== undefined) updateData.codigo_interno = codigo_interno.trim().toUpperCase();
    if (modelo !== undefined) updateData.modelo = modelo;
    if (anio !== undefined) updateData.anio = Number(anio);
    if (estado !== undefined) updateData.estado = estado;
    if (chofer_titular_id !== undefined) updateData.chofer_titular_id = chofer_titular_id || null;

    const { data, error } = await req.db!
      .from('camiones')
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

export const deleteCamion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await req.db!
      .from('camiones')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: 'Camión eliminado correctamente' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
