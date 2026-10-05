import { create } from 'zustand';
import { Camion, EstadoCamion } from '../types';
import { api } from '../services/api';
import { db } from '../db/dexie';
import { useSyncStore } from './useSyncStore';

interface CamionesState {
  camiones: Camion[];
  loading: boolean;
  error: string | null;
  fetchCamiones: () => Promise<void>;
  addCamion: (camion: Omit<Camion, 'id'>) => Promise<void>;
  updateCamion: (id: string, camion: Partial<Camion>) => Promise<void>;
  deleteCamion: (id: string) => Promise<void>;
}

export const useCamionesStore = create<CamionesState>((set, get) => ({
  camiones: [],
  loading: false,
  error: null,

  fetchCamiones: async () => {
    set({ loading: true, error: null });
    try {
      if (navigator.onLine) {
        const remoteData = await api.get<Camion[]>('/camiones');
        set({ camiones: remoteData || [] });
        // Actualizar Dexie DB local
        for (const item of remoteData || []) {
          await db.camiones.put({ ...item, sync_status: 'synced' });
        }
      } else {
        // Cargar desde Dexie DB offline
        const localData = await db.camiones.toArray();
        set({ camiones: localData });
      }
    } catch (err: any) {
      // Fallback a Dexie si falla la red
      const localData = await db.camiones.toArray();
      set({ camiones: localData, error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addCamion: async (newCamionData) => {
    const tempId = crypto.randomUUID();
    const newRecord: Camion = {
      ...newCamionData,
      id: tempId,
      estado: newCamionData.estado || 'disponible',
      sync_status: navigator.onLine ? 'synced' : 'pending_insert',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Actualización optimista en Dexie y estado Zustand
    await db.camiones.put(newRecord);
    set({ camiones: [newRecord, ...get().camiones] });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.post<Camion>('/camiones', newCamionData);
        // Reemplazar el tempId con el id real de la BD
        await db.camiones.delete(tempId);
        await db.camiones.put({ ...saved, sync_status: 'synced' });
        set({
          camiones: get().camiones.map(c => (c.id === tempId ? saved : c))
        });
      } catch (err) {
        console.warn('Guardado online falló, reservado en Dexie:', err);
      }
    }
  },

  updateCamion: async (id, updatedData) => {
    const existing = get().camiones.find(c => c.id === id);
    if (!existing) return;

    const updatedRecord: Camion = {
      ...existing,
      ...updatedData,
      updated_at: new Date().toISOString(),
      sync_status: navigator.onLine ? 'synced' : 'pending_update'
    };

    await db.camiones.put(updatedRecord);
    set({
      camiones: get().camiones.map(c => (c.id === id ? updatedRecord : c))
    });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.put<Camion>(`/camiones/${id}`, updatedData);
        await db.camiones.put({ ...saved, sync_status: 'synced' });
      } catch (err) {
        console.warn('Actualización online falló, reservado en Dexie:', err);
      }
    }
  },

  deleteCamion: async (id) => {
    await db.camiones.delete(id);
    set({ camiones: get().camiones.filter(c => c.id !== id) });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        await api.delete(`/camiones/${id}`);
      } catch (err) {
        console.warn('Eliminación online falló:', err);
      }
    }
  }
}));
