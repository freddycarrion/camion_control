import { Router } from 'express';
import {
  getAsignaciones,
  createAsignacion,
  updateEstadoAsignacion,
  deleteAsignacion
} from '../controllers/asignacionesController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getAsignaciones);
router.post('/', createAsignacion);
router.patch('/:id/estado', updateEstadoAsignacion);
router.delete('/:id', deleteAsignacion);

export default router;
