import { db } from '../db/dexie';
import { api } from './api';
import { supabase } from './supabaseClient';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
}

export const syncService = {
  // Realizar sincronización manual o automática
  async performSync(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Dispositivo sin conexión a internet. La sincronización se realizará al reconectar.'
      };
    }

    try {
      // 1. Obtener todos los registros pendientes de sincronizar de Dexie
      const pendingCamiones = await db.camiones.where('sync_status').notEqual('synced').toArray();
      const pendingPersonal = await db.personal.where('sync_status').notEqual('synced').toArray();
      const pendingAsignaciones = await db.asignaciones.where('sync_status').notEqual('synced').toArray();
      const pendingAyudantes = await db.ayudantes.where('sync_status').notEqual('synced').toArray();
      const pendingTransacciones = await db.transacciones.where('sync_status').notEqual('synced').toArray();
      const pendingAdelantos = await db.adelantos.where('sync_status').notEqual('synced').toArray();
      const pendingPlanillas = await db.planillas.where('sync_status').notEqual('synced').toArray();
      const pendingGastosPersonales = await db.gastos_personales.where('sync_status').notEqual('synced').toArray();

      const totalPending =
        pendingCamiones.length +
        pendingPersonal.length +
        pendingAsignaciones.length +
        pendingAyudantes.length +
        pendingTransacciones.length +
        pendingAdelantos.length +
        pendingPlanillas.length +
        pendingGastosPersonales.length;

      if (totalPending > 0) {
        // Enviar batch al backend Express
        await api.post('/sync/batch', {
          camiones: pendingCamiones,
          personal: pendingPersonal,
          asignaciones: pendingAsignaciones,
          ayudantes: pendingAyudantes,
          transacciones: pendingTransacciones,
          adelantos: pendingAdelantos,
          planillas: pendingPlanillas,
          gastos_personales: pendingGastosPersonales
        });

        // Marcar los locales como 'synced'
        const markSynced = async (table: any, items: any[]) => {
          for (const item of items) {
            await table.update(item.id, { sync_status: 'synced' });
          }
        };

        await markSynced(db.camiones, pendingCamiones);
        await markSynced(db.personal, pendingPersonal);
        await markSynced(db.asignaciones, pendingAsignaciones);
        await markSynced(db.ayudantes, pendingAyudantes);
        await markSynced(db.transacciones, pendingTransacciones);
        await markSynced(db.adelantos, pendingAdelantos);
        await markSynced(db.planillas, pendingPlanillas);
        await markSynced(db.gastos_personales, pendingGastosPersonales);
      }

      // 2. Descargar datos frescos de Supabase a Dexie (Pull Cloud to Local)
      await this.pullCloudData();

      return {
        success: true,
        syncedCount: totalPending,
        message: totalPending > 0 ? `Sincronizados ${totalPending} cambios locales.` : 'Datos al día con la nube.'
      };
    } catch (error: any) {
      console.error('Error durante la sincronización:', error);
      return {
        success: false,
        syncedCount: 0,
        message: `Error al sincronizar: ${error.message}`
      };
    }
  },

  // Descargar los últimos datos desde Supabase e insertarlos en Dexie
  async pullCloudData() {
    try {
      const [camiones, personal, asignaciones, transacciones, gastosPersonales] = await Promise.all([
        api.get<any[]>('/camiones').catch(() => []),
        api.get<any[]>('/personal').catch(() => []),
        api.get<any[]>('/asignaciones').catch(() => []),
        api.get<any[]>('/transacciones').catch(() => []),
        api.get<any[]>('/gastos-personales').catch(() => [])
      ]);

      if (camiones && Array.isArray(camiones)) {
        for (const c of camiones) {
          await db.camiones.put({ ...c, sync_status: 'synced' });
        }
      }
      if (personal && Array.isArray(personal)) {
        for (const p of personal) {
          await db.personal.put({ ...p, sync_status: 'synced' });
        }
      }
      if (asignaciones && Array.isArray(asignaciones)) {
        for (const a of asignaciones) {
          await db.asignaciones.put({ ...a, sync_status: 'synced' });
        }
      }
      if (transacciones && Array.isArray(transacciones)) {
        for (const t of transacciones) {
          await db.transacciones.put({ ...t, sync_status: 'synced' });
        }
      }
      if (gastosPersonales && Array.isArray(gastosPersonales)) {
        for (const g of gastosPersonales) {
          await db.gastos_personales.put({ ...g, sync_status: 'synced' });
        }
      }
    } catch (err) {
      console.warn('Pull cloud data omitido o sin conexión:', err);
    }
  },

  // Escuchar Supabase Realtime para cambios instantáneos
  subscribeToRealtime(onRealtimeUpdate: (table: string, payload: any) => void) {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('⚡ Evento Supabase Realtime recibido:', payload.table, payload.eventType);
          onRealtimeUpdate(payload.table, payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
