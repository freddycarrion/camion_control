import { create } from 'zustand';
import { AdelantoSueldo, PlanillaPago, CalculoPlanillaItem } from '../types';
import { api } from '../services/api';
import { db } from '../db/dexie';
import { useSyncStore } from './useSyncStore';

interface PagosState {
  adelantos: AdelantoSueldo[];
  planillas: PlanillaPago[];
  calculoActual: CalculoPlanillaItem[];
  loading: boolean;
  error: string | null;
  fetchAdelantos: (personal_id?: string) => Promise<void>;
  addAdelanto: (data: Omit<AdelantoSueldo, 'id'>) => Promise<void>;
  deleteAdelanto: (id: string) => Promise<void>;
  calcularPlanilla: (fecha_inicio: string, fecha_fin: string, personal_id?: string) => Promise<void>;
  fetchPlanillas: () => Promise<void>;
  guardarPlanilla: (data: Partial<PlanillaPago>) => Promise<void>;
  liquidarPlanilla: (id: string) => Promise<void>;
  // Paga al empleado y descuenta automáticamente sus adelantos pendientes
  pagarEmpleado: (personal_id: string, fecha_inicio: string, fecha_fin: string) => Promise<PlanillaPago>;
}

export const usePagosStore = create<PagosState>((set, get) => ({
  adelantos: [],
  planillas: [],
  calculoActual: [],
  loading: false,
  error: null,

  fetchAdelantos: async (personal_id) => {
    set({ loading: true, error: null });
    try {
      let localData = await db.adelantos.toArray();
      if (personal_id) localData = localData.filter(a => a.personal_id === personal_id);
      if (localData.length > 0) {
        set({ adelantos: localData });
      }

      if (navigator.onLine) {
        try {
          const query = personal_id ? `?personal_id=${personal_id}` : '';
          const remoteData = await api.get<AdelantoSueldo[]>(`/pagos/adelantos${query}`);
          const mergedMap = new Map<string, AdelantoSueldo>();

          localData.forEach(a => mergedMap.set(a.id, a));

          if (remoteData && Array.isArray(remoteData)) {
            for (const item of remoteData) {
              mergedMap.set(item.id, { ...item, sync_status: 'synced' });
              await db.adelantos.put({ ...item, sync_status: 'synced' });
            }
          }

          set({ adelantos: Array.from(mergedMap.values()) });
        } catch (netErr: any) {
          console.warn('Servidor no disponible para adelantos, conservando datos locales:', netErr.message);
        }
      }
    } catch (err: any) {
      const localData = await db.adelantos.toArray();
      set({ adelantos: localData, error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addAdelanto: async (data) => {
    const tempId = crypto.randomUUID();
    const newRecord: AdelantoSueldo = {
      ...data,
      id: tempId,
      fecha: data.fecha || new Date().toISOString().split('T')[0],
      sync_status: navigator.onLine ? 'synced' : 'pending_insert',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.adelantos.put(newRecord);
    set({ adelantos: [newRecord, ...get().adelantos] });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.post<AdelantoSueldo>('/pagos/adelantos', data);
        await db.adelantos.delete(tempId);
        await db.adelantos.put({ ...saved, sync_status: 'synced' });
        set({
          adelantos: get().adelantos.map(a => (a.id === tempId ? saved : a))
        });
      } catch (err) {
        console.warn('Adelanto guardado en Dexie:', err);
      }
    }
  },

  deleteAdelanto: async (id) => {
    const adelanto = get().adelantos.find(a => a.id === id);
    if (adelanto?.planilla_id) {
      throw new Error('Este adelanto ya fue descontado en una planilla pagada y no puede eliminarse');
    }

    // Online: primero el servidor (puede rechazarlo); si falla, no se toca el estado local
    if (navigator.onLine) {
      await api.delete(`/pagos/adelantos/${id}`);
    }

    await db.adelantos.delete(id);
    set({ adelantos: get().adelantos.filter(a => a.id !== id) });
    useSyncStore.getState().checkPendingCount();
  },

  calcularPlanilla: async (fecha_inicio, fecha_fin, personal_id) => {
    set({ loading: true, error: null });
    try {
      if (navigator.onLine) {
        const queryParams = new URLSearchParams({ fecha_inicio, fecha_fin });
        if (personal_id) queryParams.append('personal_id', personal_id);

        const data = await api.get<CalculoPlanillaItem[]>(`/pagos/planillas/calcular?${queryParams.toString()}`);
        set({ calculoActual: data || [] });
      } else {
        // Cálculo offline con las MISMAS reglas que la función SQL calcular_planilla
        // (IndexedDB no indexa booleanos, por eso se filtra 'activo' en memoria)
        const empleados = (await db.personal.toArray()).filter(p => p.activo);
        const asignaciones = (await db.asignaciones.toArray()).filter(a =>
          a.fecha >= fecha_inicio && a.fecha <= fecha_fin && a.estado !== 'cancelado'
        );
        const ayudantes = await db.ayudantes.toArray();
        const adelantos = await db.adelantos.toArray();
        const planillas = await db.planillas.toArray();

        const resultados: CalculoPlanillaItem[] = [];

        for (const emp of empleados) {
          if (personal_id && emp.id !== personal_id) continue;

          // Días trabajados = fechas distintas como chofer o ayudante de plantilla
          const fechas = new Set<string>();
          for (const a of asignaciones) {
            if (a.chofer_id === emp.id) fechas.add(a.fecha);
            const comoAyudante =
              (a.ayudantes || []).some(ay => ay.personal_id === emp.id) ||
              ayudantes.some(ay => ay.asignacion_id === a.id && ay.personal_id === emp.id);
            if (comoAyudante) fechas.add(a.fecha);
          }
          const diasTrabajados = fechas.size;

          // Adelantos pendientes de descontar hasta el fin del período
          const totalAdelantos = adelantos
            .filter(ad => ad.personal_id === emp.id && !ad.planilla_id && ad.fecha <= fecha_fin)
            .reduce((s, ad) => s + Number(ad.monto), 0);

          const bruto = diasTrabajados * Number(emp.pago_diario);

          resultados.push({
            personal_id: emp.id,
            nombre: emp.nombre,
            rol: emp.rol,
            pago_diario: Number(emp.pago_diario),
            dias_trabajados: diasTrabajados,
            monto_bruto: bruto,
            total_adelantos: totalAdelantos,
            monto_neto: Math.max(0, bruto - totalAdelantos),
            saldo_adelanto: Math.max(0, totalAdelantos - bruto),
            ya_pagado: planillas.some(p =>
              p.personal_id === emp.id && p.fecha_inicio <= fecha_fin && p.fecha_fin >= fecha_inicio
            ),
            fecha_inicio,
            fecha_fin
          });
        }

        set({ calculoActual: resultados.sort((a, b) => a.nombre.localeCompare(b.nombre)) });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchPlanillas: async () => {
    set({ loading: true, error: null });
    try {
      const localData = await db.planillas.toArray();
      if (localData.length > 0) {
        set({ planillas: localData });
      }

      if (navigator.onLine) {
        try {
          const data = await api.get<PlanillaPago[]>('/pagos/planillas');
          const mergedMap = new Map<string, PlanillaPago>();

          localData.forEach(p => mergedMap.set(p.id, p));

          if (data && Array.isArray(data)) {
            for (const item of data) {
              mergedMap.set(item.id, { ...item, sync_status: 'synced' });
              await db.planillas.put({ ...item, sync_status: 'synced' });
            }
          }

          set({ planillas: Array.from(mergedMap.values()) });
        } catch (netErr: any) {
          console.warn('Servidor no disponible para planillas de pago, conservando datos locales:', netErr.message);
        }
      }
    } catch (err: any) {
      const localData = await db.planillas.toArray();
      set({ planillas: localData, error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  guardarPlanilla: async (data) => {
    const tempId = crypto.randomUUID();
    const newRecord: PlanillaPago = {
      id: tempId,
      personal_id: data.personal_id!,
      fecha_inicio: data.fecha_inicio!,
      fecha_fin: data.fecha_fin!,
      dias_trabajados: data.dias_trabajados || 0,
      pago_diario: data.pago_diario || 0,
      monto_bruto: data.monto_bruto || 0,
      total_adelantos: data.total_adelantos || 0,
      monto_neto: data.monto_neto || 0,
      estado: data.estado || 'pendiente',
      sync_status: navigator.onLine ? 'synced' : 'pending_insert',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.planillas.put(newRecord);
    set({ planillas: [newRecord, ...get().planillas] });
    useSyncStore.getState().checkPendingCount();

    if (navigator.onLine) {
      try {
        const saved = await api.post<PlanillaPago>('/pagos/planillas', data);
        await db.planillas.delete(tempId);
        await db.planillas.put({ ...saved, sync_status: 'synced' });
        set({
          planillas: get().planillas.map(p => (p.id === tempId ? saved : p))
        });
      } catch (err) {
        console.warn('Planilla guardada offline:', err);
      }
    }
  },

  liquidarPlanilla: async (id) => {
    const existing = get().planillas.find(p => p.id === id);
    if (!existing) return;

    const updatedRecord: PlanillaPago = {
      ...existing,
      estado: 'pagado',
      fecha_liquidacion: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.planillas.put(updatedRecord);
    set({
      planillas: get().planillas.map(p => (p.id === id ? updatedRecord : p))
    });

    if (navigator.onLine) {
      try {
        const saved = await api.patch<PlanillaPago>(`/pagos/planillas/${id}/liquidar`, {});
        await db.planillas.put({ ...saved, sync_status: 'synced' });
      } catch (err) {
        console.warn('Liquidación falló online:', err);
      }
    }
  },

  pagarEmpleado: async (personal_id, fecha_inicio, fecha_fin) => {
    // El pago descuenta adelantos y debe ser atómico en la BD: requiere conexión
    if (!navigator.onLine) {
      throw new Error('Se necesita conexión a internet para registrar un pago');
    }

    const planilla = await api.post<PlanillaPago>('/pagos/planillas/pagar', {
      personal_id,
      fecha_inicio,
      fecha_fin
    });

    // Refrescar planillas, adelantos (ahora marcados como descontados) y el cálculo
    await Promise.all([
      get().fetchPlanillas(),
      get().fetchAdelantos(),
      get().calcularPlanilla(fecha_inicio, fecha_fin)
    ]);

    return planilla;
  }
}));
