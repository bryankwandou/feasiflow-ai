import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { useUIStore } from '@/stores/useUIStore';

export default function AppLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      <Topbar />
      <div className="flex flex-1 pt-14">
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
