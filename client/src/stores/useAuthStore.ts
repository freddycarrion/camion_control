import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

interface UserProfile {
  id: string;
  email: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, pass: string) => Promise<void>;
  // Devuelve true si Supabase exige confirmar el correo antes de iniciar sesión
  signup: (email: string, pass: string) => Promise<{ needsConfirmation: boolean }>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || ''
          },
          initialized: true
        });
      } else {
        set({ user: null, initialized: true });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email || ''
            }
          });
        } else {
          set({ user: null });
        }
      });
    } catch (err) {
      console.error('Error al inicializar Auth:', err);
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || ''
          }
        });
      }
    } finally {
      set({ loading: false });
    }
  },

  signup: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      // Si "Confirm email" está activo en Supabase, no hay sesión hasta confirmar el correo
      if (!data.session || !data.user) {
        return { needsConfirmation: true };
      }

      set({
        user: {
          id: data.user.id,
          email: data.user.email || ''
        }
      });
      return { needsConfirmation: false };
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));
