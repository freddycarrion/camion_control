import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2 } from 'lucide-react';
import { useSegurosStore } from '../stores/useSegurosStore';
import { useCamionesStore } from '../stores/useCamionesStore';
import { usePersonalStore } from '../stores/usePersonalStore';
import { Seguro, hoyBolivia, diasParaVencer, estadoSeguro } from '../services/seguros';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';

const vacio = (): Omit<Seguro, 'id'> => ({ tipo: 'camion', camion_id: null, personal_id: null,
  aseguradora: '', poliza: '', monto: 0, fecha_vencimiento: hoyBolivia(), observaciones: '' });
const input = 'w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm';

export const SegurosPage: React.FC = () => {
  const { seguros, error, loading, fetchSeguros, guardar, eliminar } = useSegurosStore();
  const { camiones, fetchCamiones } = useCamionesStore();
  const { personal, fetchPersonal } = usePersonalStore();
  const { showToast } = useToast();
  const [form, setForm] = useState(vacio);
  const [id, setId] = useState<string>();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [hoy, setHoy] = useState(hoyBolivia);
  useEffect(() => {
    fetchSeguros(); fetchCamiones(); fetchPersonal();
    const timer = window.setInterval(() => setHoy(hoyBolivia()), 60000);
    return () => window.clearInterval(timer);
  }, [fetchSeguros, fetchCamiones, fetchPersonal]);
  const titular = (s: Seguro) => s.tipo === 'camion'
    ? (() => { const c = camiones.find(c => c.id === s.camion_id); return c ? `${c.codigo_interno} (${c.placa})` : 'Camión registrado'; })()
    : personal.find(p => p.id === s.personal_id)?.nombre || 'Personal registrado';
  const rows = seguros.filter(s => {
    const dias = diasParaVencer(s.fecha_vencimiento, hoy);
    return (filter === 'todos' || filter === s.tipo || (filter === 'avisos' && dias <= 5)) &&
      `${titular(s)} ${s.aseguradora} ${s.poliza}`.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento));
  const edit = (s?: Seguro) => {
    setId(s?.id); setForm(s ? { tipo: s.tipo, camion_id: s.camion_id, personal_id: s.personal_id,
      aseguradora: s.aseguradora, poliza: s.poliza, monto: Number(s.monto),
      fecha_vencimiento: s.fecha_vencimiento, observaciones: s.observaciones } : vacio()); setOpen(true);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await guardar(form, id); setOpen(false);
      showToast('success', 'Seguro guardado', 'Te avisaremos en la aplicación desde 5 días antes del vencimiento.');
    } catch (err: any) { showToast('error', 'No se pudo guardar', err.message); }
    finally { setSaving(false); }
  };
  const remove = async (s: Seguro) => {
    if (!confirm(`¿Eliminar el seguro de ${titular(s)}?`)) return;
    try { await eliminar(s.id); }
    catch (err: any) { showToast('error', 'No se pudo eliminar', err.message); }
  };
  return <div className="space-y-5">
    <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><ShieldCheck className="text-sky-400" /> Seguros</h1>
        <p className="text-sm text-slate-400 mt-2">Seguros de camiones y personal. Avisos desde 5 días antes de la próxima fecha de pago o vencimiento.</p></div>
      <button onClick={() => edit()} className="bg-sky-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={18} /> Nuevo seguro</button>
    </div>
    {error && <div role="alert" className="glass-panel p-4 text-rose-400">No se pudieron cargar los seguros: {error}
      <button onClick={fetchSeguros} className="underline ml-3">Reintentar</button></div>}
    <div className="glass-panel p-4 flex flex-wrap gap-3">
      <input aria-label="Buscar seguros" placeholder="Buscar camión, persona, aseguradora o póliza" value={search} onChange={e => setSearch(e.target.value)} className={`${input} flex-1 min-w-[220px]`} />
      <select aria-label="Filtrar seguros" value={filter} onChange={e => setFilter(e.target.value)} className={`${input} sm:w-auto`}>
        <option value="todos">Todos los seguros</option><option value="camion">Camiones</option><option value="personal">Personal</option><option value="avisos">Por vencer y vencidos</option>
      </select>
    </div>
    <p className="text-sm text-slate-400">{loading ? 'Actualizando seguros…' : `${rows.length} seguros · ${seguros.filter(s => diasParaVencer(s.fecha_vencimiento, hoy) <= 5).length} requieren atención`}</p>
    {rows.map(s => <div key={s.id} className="glass-panel p-5 flex flex-wrap justify-between gap-4">
      <div className="space-y-2"><h2 className="font-bold text-white">{s.tipo === 'camion' ? 'Camión' : 'Personal'}: {titular(s)}</h2>
        <p className="text-sm text-slate-300">{s.aseguradora}{s.poliza && ` · Póliza: ${s.poliza}`}</p>
        <p className="text-sm text-slate-400">Próximo pago / vencimiento: {s.fecha_vencimiento.split('-').reverse().join('/')} · Bs {Number(s.monto).toFixed(2)}</p>
        <p className={`text-sm font-bold ${diasParaVencer(s.fecha_vencimiento, hoy) < 0 ? 'text-rose-400' : diasParaVencer(s.fecha_vencimiento, hoy) <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>{estadoSeguro(s.fecha_vencimiento, hoy)}</p>
        {s.observaciones && <p className="text-sm text-slate-400 whitespace-pre-wrap">{s.observaciones}</p>}
      </div>
      <div className="flex gap-3 items-center"><button onClick={() => edit(s)} className="text-sky-400 flex items-center gap-1"><Pencil size={16} /> Editar / renovar</button>
        <button onClick={() => remove(s)} aria-label={`Eliminar seguro de ${titular(s)}`} className="text-rose-400 p-2"><Trash2 size={18} /></button></div>
    </div>)}
    {!loading && !error && !rows.length && <div className="glass-panel p-8 text-center text-slate-400">No hay seguros para mostrar. Registra un seguro o cambia los filtros.</div>}
    <Modal isOpen={open} onClose={() => !saving && setOpen(false)} title={id ? 'Editar / renovar seguro' : 'Nuevo seguro'}>
      <form onSubmit={submit} className="space-y-4 text-sm text-slate-300">
        <label className="block">Seguro para<select className={input} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as Seguro['tipo'], camion_id: null, personal_id: null })}>
          <option value="camion">Camión</option><option value="personal">Personal</option></select></label>
        <label className="block">{form.tipo === 'camion' ? 'Camión' : 'Persona'} *
          <select required className={input} value={(form.tipo === 'camion' ? form.camion_id : form.personal_id) || ''}
            onChange={e => setForm({ ...form, [form.tipo === 'camion' ? 'camion_id' : 'personal_id']: e.target.value })}>
            <option value="">Selecciona…</option>
            {form.tipo === 'camion' ? camiones.map(c => <option key={c.id} value={c.id}>{c.codigo_interno} ({c.placa})</option>) : personal.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select></label>
        <label className="block">Aseguradora / nombre del seguro *<input required maxLength={200} className={input} value={form.aseguradora} onChange={e => setForm({ ...form, aseguradora: e.target.value })} /></label>
        <label className="block">Número de póliza<input maxLength={200} className={input} value={form.poliza} onChange={e => setForm({ ...form, poliza: e.target.value })} /></label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label>Monto a pagar (Bs) *<input required type="number" min="0" step="0.01" className={input} value={form.monto} onChange={e => setForm({ ...form, monto: Number(e.target.value) })} /></label>
          <label>Próximo pago / vencimiento *<input required type="date" className={input} value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} /></label>
        </div>
        <p className="text-xs text-sky-400">Aviso automático dentro de CamiónControl desde 5 días antes. Al pagar o renovar, actualiza esta fecha al próximo vencimiento.</p>
        <label className="block">Observaciones<textarea maxLength={2000} className={input} value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} /></label>
        <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={() => setOpen(false)}>Cancelar</button><button disabled={saving} className="bg-sky-600 text-white rounded-xl px-4 py-2">{saving ? 'Guardando…' : 'Guardar seguro'}</button></div>
      </form>
    </Modal>
  </div>;
};
