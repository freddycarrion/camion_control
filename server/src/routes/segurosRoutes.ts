import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAuth);
const schema = z.object({
  tipo: z.enum(['camion', 'personal']),
  camion_id: z.string().uuid().nullable(),
  personal_id: z.string().uuid().nullable(),
  aseguradora: z.string().trim().min(1).max(200),
  poliza: z.string().trim().max(200),
  monto: z.number().finite().min(0),
  fecha_vencimiento: z.string().date(),
  observaciones: z.string().trim().max(2000)
}).refine(s => s.tipo === 'camion' ? !!s.camion_id && !s.personal_id : !!s.personal_id && !s.camion_id,
  'Selecciona el camión o la persona asegurada');

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const records: any[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await req.db!.from('seguros').select('*')
        .eq('user_id', req.user.id).order('fecha_vencimiento').order('id').range(offset, offset + 499);
      if (error) throw error;
      records.push(...(data || []));
      if (!data || data.length < 500) break;
    }
    return res.json({ success: true, data: records });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
for (const method of ['post', 'put'] as const) {
  router[method](method === 'post' ? '/' : '/:id', async (req: AuthenticatedRequest, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    if (method === 'put' && !z.string().uuid().safeParse(req.params.id).success)
      return res.status(400).json({ success: false, error: 'Identificador inválido' });
    try {
      const table = req.db!.from('seguros');
      const query = method === 'post'
        ? table.insert({ ...parsed.data, user_id: req.user.id })
        : table.update(parsed.data).eq('id', req.params.id).eq('user_id', req.user.id);
      const { data, error } = await query.select('*').single();
      if (error) throw error;
      return res.status(method === 'post' ? 201 : 200).json({ success: true, data });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  });
}
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await req.db!.from('seguros').delete()
      .eq('id', req.params.id).eq('user_id', req.user.id).select('id').single();
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});
export default router;
