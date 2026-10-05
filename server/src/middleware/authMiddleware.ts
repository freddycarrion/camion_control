import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  user?: any;
  // Cliente de Supabase con el JWT del usuario: las políticas RLS lo ven como 'authenticated'
  db?: SupabaseClient;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó un token de autorización válido'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o sesión expirada'
      });
    }

    req.user = user;

    // Crear un cliente por petición que reenvía el token del usuario a PostgREST
    req.db = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    next();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Error interno en la verificación de autenticación',
      details: err.message
    });
  }
};
