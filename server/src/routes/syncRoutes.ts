import { Router } from 'express';
import { syncBatchData } from '../controllers/syncController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.post('/batch', syncBatchData);

export default router;
