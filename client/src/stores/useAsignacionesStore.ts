import { create } from 'zustand';
import { AsignacionDiaria, EstadoAsignacion } from '../types';
import { api } from '../services/api';
import { db } from '../db/dexie';
import { useSyncStore } from './useSyncStore';
import { syncService } from '../services/syncService';

interface CreateAsignacionPayload {
  fecha?: string;
  camion_id: string;
  chofer_id?: string | null;
  observaciones?: string;
  ayudantes?: Array<{
    personal_id?: string | null;
    nombre_temporal?: string | null;
    es_temporal: boolean;
  }>;
}

interface AsignacionesState {
  asignaciones: AsignacionDiaria[];
  loading: boolean;
  error: string | null;
  unsubscribeRealtime: (() => void) | null;
  fetchAsignaciones: (fecha?: string) => Promise<void>;
  addAsignacion: (payload: CreateAsignacionPayload) => Promise<void>;
  updateEstado: (id: string, estado: EstadoAsignacion) => Promise<void>;
  deleteAsignacion: (id: string) => Promise<void>;
  initRealtimeSubscription: () => void;
}

export const useAsignacionesStore = create<AsignacionesState>((set, get) => ({
  asignaciones: [],
  loading: false,
  error: null,
  unsubscribeRealtime: null,

  fetchAsignaciones: async (fecha) => {
    set({ loading: true, error: null });
    try {
      const targetFecha = fecha || new Date().toISOString().split('T')[0];
      if (navigator.onLine) {
        const remoteData = await api.get<AsignacionDiaria[]>(`/asignaciones?fecha=${targetFecha}`);
        set({ asignaciones: remoteData || [] });
        for (const item of remoteData || []) {
          await db.asignaciones.put({ ...item, sync_status: 'synced' });
        }
      } else {
        const localData = await db.asignaciones.where('fecha').equals(targetFecha).toArray();
        set({ asignaciones: localData });
      }
    } catch (err: any) {
      const localData = await db.asignaciones.toArray();
      set({ asignaciones: localData, error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addAsignacion: async (payload) => {
    const tempId = crypto.randomUUID();
    const fecha = payload.fecha || new Date().toISOString().split('T')[0];

    const newRecord: AsignacionDiaria = {
      id: tempId,
      fecha,
      camion_id: payload.camion_id,
      chofer_id: payload.chofer_id || null,
      estado: 'en_curso',
      observaciones: payload.observaciones || null,
      ayudantes: (payload.ayudantes || []).map(a => ({
        id: crypto.randomUUID(),
        asignacion_id: tempId,
        personal_id: a.personal_id || null,
        nombre_temporal: a.nombre_temporal || null,
        es_temporal: a.es_temporal,
        sync_status: 'synced'
      })),
      sync_status: navigator.onLine ? 'synced' : 'pending_insert',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.asignaciones.put(newRecord);
    set({ asignaciones: [newRecord, ...get().asignaciones] });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.post<AsignacionDiaria>('/asignaciones', payload);
        await db.asignaciones.delete(tempId);
        await db.asignaciones.put({ ...saved, sync_status: 'synced' });
        set({
          asignaciones: get().asignaciones.map(a => (a.id === tempId ? saved : a))
        });
      } catch (err) {
        console.warn('Salida del día guardada offline en Dexie:', err);
      }
    }
  },

  updateEstado: async (id, estado) => {
    const existing = get().asignaciones.find(a => a.id === id);
    if (!existing) return;

    const updatedRecord: AsignacionDiaria = {
      ...existing,
      estado,
      updated_at: new Date().toISOString()
    };

    await db.asignaciones.put(updatedRecord);
    set({
      asignaciones: get().asignaciones.map(a => (a.id === id ? updatedRecord : a))
    });

    if (navigator.onLine) {
      try {
        const saved = await api.patch<AsignacionDiaria>(`/asignaciones/${id}/estado`, { estado });
        await db.asignaciones.put({ ...saved, sync_status: 'synced' });
      } catch (err) {
        console.warn('Cambio de estado asignación falló online:', err);
      }
    }
  },

  deleteAsignacion: async (id) => {
    await db.asignaciones.delete(id);
    set({ asignaciones: get().asignaciones.filter(a => a.id !== id) });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        await api.delete(`/asignaciones/${id}`);
      } catch (err) {
        console.warn('Eliminación de asignación falló online:', err);
      }
    }
  },

  initRealtimeSubscription: () => {
    const existingSub = get().unsubscribeRealtime;
    if (existingSub) existingSub();

    const unsub = syncService.subscribeToRealtime((table) => {
      if (table === 'asignaciones_diarias' || table === 'camiones') {
        get().fetchAsignaciones();
      }
    });

    set({ unsubscribeRealtime: unsub });
  }
}));
