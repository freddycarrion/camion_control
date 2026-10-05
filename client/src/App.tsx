import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CamionesPage } from './pages/CamionesPage';
import { PersonalPage } from './pages/PersonalPage';
import { AsignacionesPage } from './pages/AsignacionesPage';
import { TransaccionesPage } from './pages/TransaccionesPage';
import { PagosPage } from './pages/PagosPage';
import { ReportesPage } from './pages/ReportesPage';

// Componente para Proteger Rutas Privadas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-semibold text-sm">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Privadas Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="camiones" element={<CamionesPage />} />
          <Route path="personal" element={<PersonalPage />} />
          <Route path="asignaciones" element={<AsignacionesPage />} />
          <Route path="transacciones" element={<TransaccionesPage />} />
          <Route path="pagos" element={<PagosPage />} />
          <Route path="reportes" element={<ReportesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
