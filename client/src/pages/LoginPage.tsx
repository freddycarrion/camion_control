import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { Truck, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const { login, signup, loading, user } = useAuthStore();

  // Si ya hay sesión activa, ir directo al Dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor ingresa tu correo y contraseña');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      if (isRegistering) {
        const { needsConfirmation } = await signup(email, password);
        if (needsConfirmation) {
          setInfoMsg('Cuenta creada. Revisa tu correo y confirma tu cuenta para poder iniciar sesión.');
          setIsRegistering(false);
        }
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      const msg = err?.message || 'Error en el proceso de autenticación';
      // Traducir mensajes comunes de Supabase
      if (msg.includes('Email not confirmed')) {
        setErrorMsg('Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.');
      } else if (msg.includes('Invalid login credentials')) {
        setErrorMsg('Correo o contraseña incorrectos.');
      } else if (msg.includes('already registered')) {
        setErrorMsg('Este correo ya está registrado. Inicia sesión.');
      } else {
        setErrorMsg(msg);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center p-3.5 sm:p-6 relative overflow-hidden py-safe">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-5 sm:p-8 relative z-10 shadow-2xl border border-slate-800/80">
        {/* Logo & Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 sm:mb-4 shadow-lg shadow-sky-500/30">
            <Truck className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">CamiónControl</h1>
          <p className="text-xs text-slate-400 mt-1">Plataforma de Gestión de Flotas de Transporte</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 sm:p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center animate-shake">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-5 p-3 sm:p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@transporte.com"
                required
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
          >
            <span>{loading ? 'Procesando...' : isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 sm:mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg('');
              setInfoMsg('');
            }}
            className="text-xs text-sky-400 hover:underline font-medium py-1"
          >
            {isRegistering
              ? '¿Ya tienes cuenta? Inicia sesión aquí'
              : '¿Nuevo usuario? Regístrate aquí'}
          </button>
        </div>

        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Protegido con Supabase Auth & RLS</span>
        </div>
      </div>
    </div>
  );
};
