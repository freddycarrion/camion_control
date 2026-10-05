import { create } from 'zustand';
import { Personal, RolPersonal } from '../types';
import { api } from '../services/api';
import { db } from '../db/dexie';
import { useSyncStore } from './useSyncStore';

interface PersonalState {
  personal: Personal[];
  loading: boolean;
  error: string | null;
  fetchPersonal: (rol?: RolPersonal) => Promise<void>;
  addPersonal: (data: Omit<Personal, 'id'>) => Promise<void>;
  updatePersonal: (id: string, data: Partial<Personal>) => Promise<void>;
  deletePersonal: (id: string) => Promise<void>;
}

export const usePersonalStore = create<PersonalState>((set, get) => ({
  personal: [],
  loading: false,
  error: null,

  fetchPersonal: async (rol) => {
    set({ loading: true, error: null });
    try {
      if (navigator.onLine) {
        const query = rol ? `?rol=${rol}` : '';
        const remoteData = await api.get<Personal[]>(`/personal${query}`);
        set({ personal: remoteData || [] });
        for (const item of remoteData || []) {
          await db.personal.put({ ...item, sync_status: 'synced' });
        }
      } else {
        let localData = await db.personal.toArray();
        if (rol) {
          localData = localData.filter(p => p.rol === rol);
        }
        set({ personal: localData });
      }
    } catch (err: any) {
      const localData = await db.personal.toArray();
      set({ personal: localData, error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addPersonal: async (data) => {
    const tempId = crypto.randomUUID();
    const newRecord: Personal = {
      ...data,
      id: tempId,
      activo: data.activo !== undefined ? data.activo : true,
      sync_status: navigator.onLine ? 'synced' : 'pending_insert',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.personal.put(newRecord);
    set({ personal: [newRecord, ...get().personal] });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.post<Personal>('/personal', data);
        await db.personal.delete(tempId);
        await db.personal.put({ ...saved, sync_status: 'synced' });
        set({
          personal: get().personal.map(p => (p.id === tempId ? saved : p))
        });
      } catch (err) {
        console.warn('Guardado de personal en red falló, reservado en Dexie:', err);
      }
    }
  },

  updatePersonal: async (id, updatedData) => {
    const existing = get().personal.find(p => p.id === id);
    if (!existing) return;

    const updatedRecord: Personal = {
      ...existing,
      ...updatedData,
      updated_at: new Date().toISOString(),
      sync_status: navigator.onLine ? 'synced' : 'pending_update'
    };

    await db.personal.put(updatedRecord);
    set({
      personal: get().personal.map(p => (p.id === id ? updatedRecord : p))
    });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.put<Personal>(`/personal/${id}`, updatedData);
        await db.personal.put({ ...saved, sync_status: 'synced' });
      } catch (err) {
        console.warn('Actualización de personal en red falló:', err);
      }
    }
  },

  deletePersonal: async (id) => {
    await db.personal.delete(id);
    set({ personal: get().personal.filter(p => p.id !== id) });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        await api.delete(`/personal/${id}`);
      } catch (err) {
        console.warn('Eliminación de personal falló:', err);
      }
    }
  }
}));
