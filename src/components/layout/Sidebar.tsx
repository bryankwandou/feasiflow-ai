import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/useUIStore';
import { useAppointmentStore } from '@/stores/useAppointmentStore';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { useBillingStore } from '@/stores/useBillingStore';
import {
  LayoutDashboard, Calendar, Users, Stethoscope, Pill, FlaskConical, Mail, Receipt, BookOpen, BarChart3, Bot, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';

const navGroups = [
  { label: 'DAILY WORKFLOW', items: [
    { icon: LayoutDashboard, label: 'Practice Overview', path: '/practice' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: Users, label: 'Patients', path: '/patients' },
  ]},
  { label: 'CLINICAL', items: [
    { icon: Stethoscope, label: 'Encounters', path: '/encounters' },
    { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
    { icon: FlaskConical, label: 'Lab Results', path: '/labs' },
    { icon: Mail, label: 'Referrals', path: '/referrals' },
  ]},
  { label: 'ADMINISTRATIVE', items: [
    { icon: Receipt, label: 'Billing & Coding', path: '/billing' },
    { icon: BookOpen, label: 'Patient Education', path: '/education' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ]},
  { label: 'SYSTEM', items: [
    { icon: Bot, label: 'AI Agents', path: '/agents' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]},
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const todayAppts = useAppointmentStore(s => s.getTodayAppointments());
  const unsigned = useEncounterStore(s => s.getUnsigned());
  const unbilled = useEncounterStore(s => s.getUnbilled());
  const ar = useBillingStore(s => s.getTotalARByAging());
  const totalAR = Object.values(ar).reduce((a, b) => a + b, 0);

  return (
    <aside className={`fixed left-0 top-14 bottom-0 bg-[var(--brand)] text-white transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-3 flex flex-col h-full">
        <button onClick={toggleSidebar} className="self-end p-1 hover:bg-white/10 rounded mb-2">
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <nav className="flex-1 overflow-y-auto space-y-6">
          {navGroups.map(group => (
            <div key={group.label}>
              {!sidebarCollapsed && <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider px-3 mb-2">{group.label}</div>}
              <div className="space-y-1">
                {group.items.map(item => {
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <button key={item.path} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-white/20 font-medium' : 'hover:bg-white/10 text-white/80'}`}>
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        {!sidebarCollapsed && (
          <div className="mt-auto pt-4 border-t border-white/20 text-xs text-white/70 space-y-1">
            <div>{todayAppts.length} appts today</div>
            <div>{unsigned.length} unsigned notes</div>
            <div>${(totalAR / 100).toFixed(0)} unbilled</div>
          </div>
        )}
      </div>
    </aside>
  );
}
