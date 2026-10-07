import { create } from 'zustand';
import { GastoPersonal, CategoriaGastoPersonal, MetodoPagoPersonal } from '../types';
import { api } from '../services/api';
import { db } from '../db/dexie';
import { useSyncStore } from './useSyncStore';

export interface GastosPersonalesFilter {
  fecha_inicio?: string;
  fecha_fin?: string;
  categoria?: CategoriaGastoPersonal;
  metodo_pago?: MetodoPagoPersonal;
}

interface GastosPersonalesState {
  gastosPersonales: GastoPersonal[];
  loading: boolean;
  error: string | null;
  fetchGastosPersonales: (filters?: GastosPersonalesFilter) => Promise<void>;
  addGastoPersonal: (data: Omit<GastoPersonal, 'id'>) => Promise<void>;
  updateGastoPersonal: (id: string, data: Partial<GastoPersonal>) => Promise<void>;
  deleteGastoPersonal: (id: string) => Promise<void>;
}

export const useGastosPersonalesStore = create<GastosPersonalesState>((set, get) => ({
  gastosPersonales: [],
  loading: false,
  error: null,

  fetchGastosPersonales: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      // 1. Cargar locales desde Dexie
      let localData = await db.gastos_personales.toArray();

      if (filters.fecha_inicio) {
        localData = localData.filter(g => g.fecha >= filters.fecha_inicio!);
      }
      if (filters.fecha_fin) {
        localData = localData.filter(g => g.fecha <= filters.fecha_fin!);
      }
      if (filters.categoria) {
        localData = localData.filter(g => g.categoria === filters.categoria);
      }
      if (filters.metodo_pago) {
        localData = localData.filter(g => g.metodo_pago === filters.metodo_pago);
      }

      // Ordenar por fecha descendente
      localData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      if (localData.length > 0) {
        set({ gastosPersonales: localData });
      }

      // 2. Si hay red, traer de Supabase vía API Express
      if (navigator.onLine) {
        try {
          const queryParams = new URLSearchParams();
          if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
          if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
          if (filters.categoria) queryParams.append('categoria', filters.categoria);
          if (filters.metodo_pago) queryParams.append('metodo_pago', filters.metodo_pago);

          const url = `/gastos-personales${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
          const remoteData = await api.get<GastoPersonal[]>(url);
          const mergedMap = new Map<string, GastoPersonal>();

          localData.forEach(g => mergedMap.set(g.id, g));

          if (remoteData && Array.isArray(remoteData)) {
            for (const item of remoteData) {
              mergedMap.set(item.id, { ...item, sync_status: 'synced' });
              await db.gastos_personales.put({ ...item, sync_status: 'synced' });
            }
          }

          const finalArray = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          set({ gastosPersonales: finalArray });
        } catch (netErr: any) {
          console.warn('Servidor no disponible para gastos personales, manteniendo locales:', netErr.message);
        }
      }
    } catch (err: any) {
      const localData = await db.gastos_personales.toArray();
      set({ gastosPersonales: localData, error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addGastoPersonal: async (data) => {
    const tempId = crypto.randomUUID();
    const newRecord: GastoPersonal = {
      ...data,
      id: tempId,
      fecha: data.fecha || new Date().toISOString().split('T')[0],
      sync_status: navigator.onLine ? 'synced' : 'pending_insert',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.gastos_personales.put(newRecord);
    set({ gastosPersonales: [newRecord, ...get().gastosPersonales] });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.post<GastoPersonal>('/gastos-personales', data);
        await db.gastos_personales.delete(tempId);
        await db.gastos_personales.put({ ...saved, sync_status: 'synced' });
        set({
          gastosPersonales: get().gastosPersonales.map(g => (g.id === tempId ? saved : g))
        });
      } catch (err) {
        console.warn('Gasto personal guardado offline en Dexie:', err);
      }
    }
  },

  updateGastoPersonal: async (id, data) => {
    const existing = get().gastosPersonales.find(g => g.id === id);
    if (!existing) return;

    const updatedRecord: GastoPersonal = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
      sync_status: navigator.onLine ? 'synced' : 'pending_update'
    };

    await db.gastos_personales.put(updatedRecord);
    set({
      gastosPersonales: get().gastosPersonales.map(g => (g.id === id ? updatedRecord : g))
    });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.put<GastoPersonal>(`/gastos-personales/${id}`, data);
        await db.gastos_personales.put({ ...saved, sync_status: 'synced' });
        set({
          gastosPersonales: get().gastosPersonales.map(g => (g.id === id ? saved : g))
        });
      } catch (err) {
        console.warn('Actualización de gasto personal guardada offline en Dexie:', err);
      }
    }
  },

  deleteGastoPersonal: async (id) => {
    await db.gastos_personales.delete(id);
    set({ gastosPersonales: get().gastosPersonales.filter(g => g.id !== id) });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        await api.delete(`/gastos-personales/${id}`);
      } catch (err) {
        console.warn('Eliminación de gasto personal falló online:', err);
      }
    }
  }
}));
