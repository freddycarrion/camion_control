import { Router } from 'express';
import {
  getTransacciones,
  createTransaccion,
  deleteTransaccion
} from '../controllers/transaccionesController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getTransacciones);
router.post('/', createTransaccion);
router.delete('/:id', deleteTransaccion);

export default router;
