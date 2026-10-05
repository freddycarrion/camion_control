import { create } from 'zustand';
import { Transaccion, CategoriaGasto } from '../types';
import { api } from '../services/api';
import { db } from '../db/dexie';
import { useSyncStore } from './useSyncStore';

interface TransaccionesFilter {
  fecha_inicio?: string;
  fecha_fin?: string;
  camion_id?: string;
  categoria?: CategoriaGasto;
}

interface TransaccionesState {
  transacciones: Transaccion[];
  loading: boolean;
  error: string | null;
  fetchTransacciones: (filters?: TransaccionesFilter) => Promise<void>;
  addTransaccion: (data: Omit<Transaccion, 'id'>) => Promise<void>;
  deleteTransaccion: (id: string) => Promise<void>;
}

export const useTransaccionesStore = create<TransaccionesState>((set, get) => ({
  transacciones: [],
  loading: false,
  error: null,

  fetchTransacciones: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      if (navigator.onLine) {
        const queryParams = new URLSearchParams();
        if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
        if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
        if (filters.camion_id) queryParams.append('camion_id', filters.camion_id);
        if (filters.categoria) queryParams.append('categoria', filters.categoria);

        const url = `/transacciones${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const remoteData = await api.get<Transaccion[]>(url);
        set({ transacciones: remoteData || [] });
        for (const item of remoteData || []) {
          await db.transacciones.put({ ...item, sync_status: 'synced' });
        }
      } else {
        let localData = await db.transacciones.toArray();
        if (filters.camion_id) localData = localData.filter(t => t.camion_id === filters.camion_id);
        if (filters.categoria) localData = localData.filter(t => t.categoria === filters.categoria);
        set({ transacciones: localData });
      }
    } catch (err: any) {
      const localData = await db.transacciones.toArray();
      set({ transacciones: localData, error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addTransaccion: async (data) => {
    const tempId = crypto.randomUUID();
    const newRecord: Transaccion = {
      ...data,
      id: tempId,
      fecha: data.fecha || new Date().toISOString().split('T')[0],
      sync_status: navigator.onLine ? 'synced' : 'pending_insert',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.transacciones.put(newRecord);
    set({ transacciones: [newRecord, ...get().transacciones] });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.post<Transaccion>('/transacciones', data);
        await db.transacciones.delete(tempId);
        await db.transacciones.put({ ...saved, sync_status: 'synced' });
        set({
          transacciones: get().transacciones.map(t => (t.id === tempId ? saved : t))
        });
      } catch (err) {
        console.warn('Gasto guardado offline en Dexie:', err);
      }
    }
  },

  deleteTransaccion: async (id) => {
    await db.transacciones.delete(id);
    set({ transacciones: get().transacciones.filter(t => t.id !== id) });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        await api.delete(`/transacciones/${id}`);
      } catch (err) {
        console.warn('Eliminación de gasto falló online:', err);
      }
    }
  }
}));
