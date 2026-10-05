import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import camionesRoutes from './routes/camionesRoutes';
import personalRoutes from './routes/personalRoutes';
import asignacionesRoutes from './routes/asignacionesRoutes';
import transaccionesRoutes from './routes/transaccionesRoutes';
import pagosRoutes from './routes/pagosRoutes';
import reportesRoutes from './routes/reportesRoutes';
import syncRoutes from './routes/syncRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Camión Control API',
    timestamp: new Date().toISOString()
  });
});

// Rutas de API REST
app.use('/api/camiones', camionesRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/asignaciones', asignacionesRoutes);
app.use('/api/transacciones', transaccionesRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/sync', syncRoutes);

// Manejo de error 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Camión Control corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
