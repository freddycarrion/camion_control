export type RolPersonal = 'chofer' | 'ayudante';
export type EstadoCamion = 'disponible' | 'en_ruta' | 'mantenimiento' | 'fuera_servicio';
export type EstadoAsignacion = 'en_curso' | 'completado' | 'cancelado';
export type CategoriaGasto = 'combustible' | 'mantenimiento' | 'peaje' | 'viaticos' | 'mecanica' | 'repuestos' | 'otros';
export type EstadoPlanilla = 'pendiente' | 'pagado';
export type SyncStatus = 'synced' | 'pending_insert' | 'pending_update' | 'pending_delete';

export interface Personal {
  id: string;
  nombre: string;
  rol: RolPersonal;
  pago_diario: number;
  telefono?: string | null;
  activo: boolean;
  sync_status?: SyncStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Camion {
  id: string;
  placa: string;
  codigo_interno: string;
  modelo: string;
  anio: number;
  estado: EstadoCamion;
  chofer_titular_id?: string | null;
  chofer_titular?: Personal | null;
  sync_status?: SyncStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AsignacionAyudante {
  id: string;
  asignacion_id: string;
  personal_id?: string | null;
  personal?: Personal | null;
  nombre_temporal?: string | null;
  es_temporal: boolean;
  sync_status?: SyncStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AsignacionDiaria {
  id: string;
  numero_planilla?: string | null;
  fecha: string;
  camion_id: string;
  camion?: Camion | null;
  chofer_id?: string | null;
  chofer?: Personal | null;
  estado: EstadoAsignacion;
  observaciones?: string | null;
  ayudantes?: AsignacionAyudante[];
  sync_status?: SyncStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Transaccion {
  id: string;
  fecha: string;
  camion_id?: string | null;
  camion?: Camion | null;
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  observaciones?: string | null;
  sync_status?: SyncStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AdelantoSueldo {
  id: string;
  personal_id: string;
  personal?: Personal | null;
  fecha: string;
  monto: number;
  motivo?: string | null;
  // null = pendiente de descontar; con valor = ya descontado en esa planilla
  planilla_id?: string | null;
  sync_status?: SyncStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PlanillaPago {
  id: string;
  personal_id: string;
  personal?: Personal | null;
  fecha_inicio: string;
  fecha_fin: string;
  dias_trabajados: number;
  pago_diario: number;
  monto_bruto: number;
  total_adelantos: number;
  monto_neto: number;
  estado: EstadoPlanilla;
  fecha_liquidacion?: string | null;
  sync_status?: SyncStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CalculoPlanillaItem {
  personal_id: string;
  nombre: string;
  rol: RolPersonal;
  pago_diario: number;
  dias_trabajados: number;
  monto_bruto: number;
  total_adelantos: number;
  monto_neto: number;
  // Adelantos que el bruto no alcanza a cubrir (se pasan al siguiente período)
  saldo_adelanto: number;
  // El empleado ya tiene una planilla que se cruza con este período
  ya_pagado: boolean;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface ReporteFinanciero {
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  resumen_general: {
    total_gastos_operativos: number;
    total_adelantos_personal: number;
    total_planilla_neto: number;
    total_planilla_bruto: number;
    costo_total_operativo: number;
  };
  gastos_por_camion: Array<{
    camion: string;
    placa: string;
    total: number;
    cantidad: number;
  }>;
  desglose_adelantos: Array<{
    id: string;
    fecha: string;
    personal: string;
    rol: string;
    monto: number;
    motivo: string;
  }>;
  desglose_planillas: Array<{
    id: string;
    personal: string;
    rol: string;
    dias_trabajados: number;
    monto_bruto: number;
    total_adelantos: number;
    monto_neto: number;
    estado: string;
  }>;
  detalle_transacciones: Transaccion[];
}
