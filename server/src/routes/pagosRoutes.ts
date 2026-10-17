import { Router } from 'express';
import {
  getAdelantos,
  createAdelanto,
  updateAdelanto,
  deleteAdelanto,
  calcularPlanillaSemanal,
  pagarEmpleado,
  getPlanillas,
  guardarPlanilla,
  liquidarPlanilla
} from '../controllers/pagosController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

// Adelantos
router.get('/adelantos', getAdelantos);
router.post('/adelantos', createAdelanto);
router.put('/adelantos/:id', updateAdelanto);
router.delete('/adelantos/:id', deleteAdelanto);

// Planillas
router.get('/planillas/calcular', calcularPlanillaSemanal);
router.post('/planillas/pagar', pagarEmpleado);
router.get('/planillas', getPlanillas);
router.post('/planillas', guardarPlanilla);
router.patch('/planillas/:id/liquidar', liquidarPlanilla);

export default router;
