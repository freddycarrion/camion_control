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
      // 1. Mostrar de inmediato los datos locales de Dexie
      const localData = await db.camiones.toArray();
      if (localData.length > 0) {
        set({ camiones: localData });
      }

      // 2. Si está online, consultar datos remotos y fusionar sin borrar locales
      if (navigator.onLine) {
        try {
          const remoteData = await api.get<Camion[]>('/camiones');
          const mergedMap = new Map<string, Camion>();

          // Preservar primero los locales
          localData.forEach(c => mergedMap.set(c.id, c));

          // Actualizar con remotos
          if (remoteData && Array.isArray(remoteData)) {
            for (const item of remoteData) {
              mergedMap.set(item.id, { ...item, sync_status: 'synced' });
              await db.camiones.put({ ...item, sync_status: 'synced' });
            }
          }

          set({ camiones: Array.from(mergedMap.values()) });
        } catch (netErr: any) {
          console.warn('Servidor no disponible, conservando datos locales:', netErr.message);
        }
      }
    } catch (err: any) {
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
