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
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    app: 'Camión Control API',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Rutas de API REST (Soporte tanto con prefijo /api como directo por reescrituras de Vercel)
app.use('/api/camiones', camionesRoutes);
app.use('/camiones', camionesRoutes);

app.use('/api/personal', personalRoutes);
app.use('/personal', personalRoutes);

app.use('/api/asignaciones', asignacionesRoutes);
app.use('/asignaciones', asignacionesRoutes);

app.use('/api/transacciones', transaccionesRoutes);
app.use('/transacciones', transaccionesRoutes);

app.use('/api/pagos', pagosRoutes);
app.use('/pagos', pagosRoutes);

app.use('/api/reportes', reportesRoutes);
app.use('/reportes', reportesRoutes);

app.use('/api/sync', syncRoutes);
app.use('/sync', syncRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Error interno del servidor' });
});

// Manejo de error 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.method} ${req.url}` });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Camión Control corriendo en http://localhost:${PORT}`);
  });
}

export default app;
module.exports = app;

