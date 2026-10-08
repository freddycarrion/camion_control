import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useSyncStore } from '../../stores/useSyncStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { ToastProvider } from '../common/Toast';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { initSyncListeners } = useSyncStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    initSyncListeners();
  }, [initSyncListeners, initTheme]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f0f4f9] dark:bg-[#020617] text-[#0f172a] dark:text-slate-100 flex flex-col transition-colors duration-200">
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
