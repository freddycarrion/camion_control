export interface Seguro {
  id: string;
  tipo: 'camion' | 'personal';
  camion_id: string | null;
  personal_id: string | null;
  aseguradora: string;
  poliza: string;
  monto: number;
  fecha_vencimiento: string;
  observaciones: string;
}
// Comparar días de calendario en Bolivia, sin desplazamientos por zona horaria.
export function hoyBolivia(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function diasParaVencer(fecha: string, hoy = hoyBolivia()): number {
  return Math.round((Date.parse(fecha + 'T00:00:00Z') - Date.parse(hoy + 'T00:00:00Z')) / 86400000);
}
export function estadoSeguro(fecha: string, hoy = hoyBolivia()): string {
  const dias = diasParaVencer(fecha, hoy);
  return dias < 0 ? `Vencido hace ${-dias} días` : dias === 0 ? 'Vence hoy' : dias <= 5 ? `Vence en ${dias} días` : 'Vigente';
}
