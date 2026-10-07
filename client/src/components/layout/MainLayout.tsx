import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useSyncStore } from '../../stores/useSyncStore';
import { ToastProvider } from '../common/Toast';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { initSyncListeners } = useSyncStore();

  useEffect(() => {
    initSyncListeners();
  }, [initSyncListeners]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 md:pl-64 print:pl-0 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
          <main className="flex-1 p-3.5 sm:p-6 md:p-8 print:p-0 overflow-y-auto touch-scrolling pb-safe">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
