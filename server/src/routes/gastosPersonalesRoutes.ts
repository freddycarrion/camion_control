import { Router } from 'express';
import {
  getGastosPersonales,
  createGastoPersonal,
  updateGastoPersonal,
  deleteGastoPersonal
} from '../controllers/gastosPersonalesController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getGastosPersonales);
router.post('/', createGastoPersonal);
router.put('/:id', updateGastoPersonal);
router.delete('/:id', deleteGastoPersonal);

export default router;
