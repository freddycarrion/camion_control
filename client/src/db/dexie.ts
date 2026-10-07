import Dexie, { Table } from 'dexie';
import {
  Camion,
  Personal,
  AsignacionDiaria,
  AsignacionAyudante,
  Transaccion,
  AdelantoSueldo,
  PlanillaPago,
  GastoPersonal
} from '../types';

export class CamionControlDB extends Dexie {
  camiones!: Table<Camion, string>;
  personal!: Table<Personal, string>;
  asignaciones!: Table<AsignacionDiaria, string>;
  ayudantes!: Table<AsignacionAyudante, string>;
  transacciones!: Table<Transaccion, string>;
  adelantos!: Table<AdelantoSueldo, string>;
  planillas!: Table<PlanillaPago, string>;
  gastos_personales!: Table<GastoPersonal, string>;

  constructor() {
    super('CamionControlDB');
    this.version(1).stores({
      camiones: 'id, placa, codigo_interno, estado, chofer_titular_id, sync_status, updated_at',
      personal: 'id, nombre, rol, activo, sync_status, updated_at',
      asignaciones: 'id, numero_planilla, fecha, camion_id, chofer_id, estado, sync_status, updated_at',
      ayudantes: 'id, asignacion_id, personal_id, es_temporal, sync_status, updated_at',
      transacciones: 'id, fecha, camion_id, categoria, sync_status, updated_at',
      adelantos: 'id, personal_id, fecha, sync_status, updated_at',
      planillas: 'id, personal_id, estado, fecha_inicio, fecha_fin, sync_status, updated_at',
      gastos_personales: 'id, fecha, categoria, metodo_pago, sync_status, updated_at'
    });
  }
}

export const db = new CamionControlDB();

// Auxiliares para contar elementos pendientes de sincronización
export const getPendingSyncCount = async (): Promise<number> => {
  try {
    const p1 = await db.camiones.where('sync_status').notEqual('synced').count();
    const p2 = await db.personal.where('sync_status').notEqual('synced').count();
    const p3 = await db.asignaciones.where('sync_status').notEqual('synced').count();
    const p4 = await db.ayudantes.where('sync_status').notEqual('synced').count();
    const p5 = await db.transacciones.where('sync_status').notEqual('synced').count();
    const p6 = await db.adelantos.where('sync_status').notEqual('synced').count();
    const p7 = await db.planillas.where('sync_status').notEqual('synced').count();
    const p8 = await db.gastos_personales.where('sync_status').notEqual('synced').count();
    return p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8;
  } catch (error) {
    console.error('Error al contar pendientes de sincronización:', error);
    return 0;
  }
};
