import { Router } from 'express';
import {
  getCamiones,
  getCamionById,
  createCamion,
  updateCamion,
  deleteCamion
} from '../controllers/camionesController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getCamiones);
router.get('/:id', getCamionById);
router.post('/', createCamion);
router.put('/:id', updateCamion);
router.delete('/:id', deleteCamion);

export default router;
