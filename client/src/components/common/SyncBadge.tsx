import React from 'react';
import { useSyncStore } from '../../stores/useSyncStore';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export const SyncBadge: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncMessage, triggerSync } = useSyncStore();

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      {/* Indicador de Red */}
      <div
        className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full text-xs font-semibold border ${
          isOnline
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}
        title={isOnline ? 'Conexión a internet activa' : 'Sin conexión a internet'}
      >
        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 animate-pulse" />}
        <span className="hidden sm:inline">{isOnline ? 'En línea' : 'Sin conexión'}</span>
      </div>

      {/* Botón / Estado de Sincronización */}
      <button
        onClick={triggerSync}
        disabled={isSyncing || !isOnline}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
          pendingCount > 0
            ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-600/20'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Sincronización manual con Supabase"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
        <span className="hidden xs:inline sm:inline">
          {isSyncing
            ? 'Sincronizando...'
            : pendingCount > 0
            ? `Sincronizar (${pendingCount})`
            : 'Al día'}
        </span>
      </button>

      {syncMessage && (
        <span className="hidden lg:inline-flex items-center gap-1 text-xs text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {syncMessage}
        </span>
      )}
    </div>
  );
};
