import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const syncBatchData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { camiones, personal, asignaciones, ayudantes, transacciones, adelantos, planillas } = req.body;
    const userId = req.user?.id || null;

    const results: Record<string, any> = {
      camiones: { synced: 0, errors: [] },
      personal: { synced: 0, errors: [] },
      asignaciones: { synced: 0, errors: [] },
      ayudantes: { synced: 0, errors: [] },
      transacciones: { synced: 0, errors: [] },
      adelantos: { synced: 0, errors: [] },
      planillas: { synced: 0, errors: [] }
    };

    // Auxiliar para procesar cada entidad con resolución last-write-wins (updated_at)
    const syncTable = async (tableName: string, items: any[], resultKey: string) => {
      if (!items || !Array.isArray(items) || items.length === 0) return;

      for (const item of items) {
        try {
          const payload = {
            ...item,
            user_id: item.user_id || userId,
            sync_status: 'synced',
            updated_at: item.updated_at || new Date().toISOString()
          };

          // Verificar si ya existe en Supabase
          const { data: existing } = await req.db!
            .from(tableName)
            .select('updated_at')
            .eq('id', item.id)
            .single();

          if (!existing) {
            // No existe -> Insertar
            const { error: insErr } = await req.db!.from(tableName).insert([payload]);
            if (insErr) throw insErr;
            results[resultKey].synced += 1;
          } else {
            // Existe -> Comparar updated_at (Last Write Wins)
            const clientDate = new Date(payload.updated_at).getTime();
            const serverDate = new Date(existing.updated_at).getTime();

            if (clientDate >= serverDate) {
              const { error: updErr } = await req.db!
                .from(tableName)
                .update(payload)
                .eq('id', item.id);
              if (updErr) throw updErr;
              results[resultKey].synced += 1;
            }
          }
        } catch (err: any) {
          results[resultKey].errors.push({ id: item.id, error: err.message });
        }
      }
    };

    await syncTable('personal', personal, 'personal');
    await syncTable('camiones', camiones, 'camiones');
    await syncTable('asignaciones_diarias', asignaciones, 'asignaciones');
    await syncTable('asignacion_ayudantes', ayudantes, 'ayudantes');
    await syncTable('transacciones', transacciones, 'transacciones');
    await syncTable('adelantos_sueldo', adelantos, 'adelantos');
    await syncTable('planillas_pago', planillas, 'planillas');

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
