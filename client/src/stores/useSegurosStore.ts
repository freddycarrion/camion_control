import { create } from 'zustand';
import { api } from '../services/api';
import { Seguro } from '../services/seguros';
import { useAuthStore } from './useAuthStore';

interface SegurosState {
  seguros: Seguro[];
  error: string | null;
  loading: boolean;
  fetchSeguros: () => Promise<void>;
  guardar: (data: Omit<Seguro, 'id'>, id?: string) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
}
export const useSegurosStore = create<SegurosState>((set, get) => ({
  seguros: [], error: null, loading: false,
  fetchSeguros: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    set({ loading: true });
    try {
      const seguros = await api.get<Seguro[]>('/seguros');
      if (useAuthStore.getState().user?.id === userId) set({ seguros, error: null });
    } catch (error: any) {
      if (useAuthStore.getState().user?.id === userId) set({ error: error.message });
    } finally { set({ loading: false }); }
  },
  guardar: async (data, id) => {
    const saved = id ? await api.put<Seguro>(`/seguros/${id}`, data) : await api.post<Seguro>('/seguros', data);
    set({ seguros: [...get().seguros.filter(s => s.id !== saved.id), saved] });
  },
  eliminar: async id => {
    await api.delete(`/seguros/${id}`);
    set({ seguros: get().seguros.filter(s => s.id !== id) });
  }
}));
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) useSegurosStore.setState({ seguros: [], error: null });
});
