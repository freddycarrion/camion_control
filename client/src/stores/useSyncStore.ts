import { create } from 'zustand';
import { db, getPendingSyncCount } from '../db/dexie';
import { syncService } from '../services/syncService';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  syncMessage: string | null;
  updateOnlineStatus: (status: boolean) => void;
  checkPendingCount: () => Promise<number>;
  triggerSync: () => Promise<void>;
  initSyncListeners: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  syncMessage: null,

  updateOnlineStatus: (status) => {
    set({ isOnline: status });
    if (status) {
      // Intentar auto sincronización al volver a estar online
      get().triggerSync();
    }
  },

  checkPendingCount: async () => {
    const count = await getPendingSyncCount();
    set({ pendingCount: count });
    return count;
  },

  triggerSync: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true, syncMessage: 'Sincronizando datos con la nube...' });

    const result = await syncService.performSync();
    const count = await getPendingSyncCount();

    set({
      isSyncing: false,
      pendingCount: count,
      lastSyncedAt: new Date().toLocaleTimeString(),
      syncMessage: result.message
    });

    setTimeout(() => {
      set({ syncMessage: null });
    }, 4000);
  },

  initSyncListeners: () => {
    window.addEventListener('online', () => get().updateOnlineStatus(true));
    window.addEventListener('offline', () => get().updateOnlineStatus(false));
    get().checkPendingCount();
  }
}));
