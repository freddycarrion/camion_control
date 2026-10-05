import { Router } from 'express';
import { getReporteFinanciero } from '../controllers/reportesController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/financiero', getReporteFinanciero);

export default router;
