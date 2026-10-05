import { Router } from 'express';
import {
  getPersonal,
  createPersonal,
  updatePersonal,
  deletePersonal
} from '../controllers/personalController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getPersonal);
router.post('/', createPersonal);
router.put('/:id', updatePersonal);
router.delete('/:id', deletePersonal);

export default router;
