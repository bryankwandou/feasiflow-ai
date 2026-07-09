import { useAppointmentStore } from '@/stores/useAppointmentStore';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, UserPlus } from 'lucide-react';

export default function Schedule() {
  const navigate = useNavigate();
  const today = useAppointmentStore(s => s.getTodayAppointments());
  const all = useAppointmentStore(s => Object.values(s.appointments).sort((a, b) => `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(`${b.scheduledDate} ${b.scheduledTime}`)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-[var(--brand-mid)]" /> Schedule</h1>
        <button onClick={() => navigate('/schedule/new')} className="flex items-center gap-2 bg-[var(--brand-mid)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand)]"><UserPlus className="w-4 h-4" /> Book Appointment</button>
      </div>
      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] font-semibold text-sm">Today's Appointments</div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">Time</th><th className="text-left px-5 py-3">Patient</th><th className="text-left px-5 py-3">Type</th><th className="text-left px-5 py-3">Provider</th><th className="text-left px-5 py-3">Room</th><th className="text-left px-5 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-[var(--border)]">
            {today.map(a => (
              <tr key={a.id} className="hover:bg-[var(--bg-subtle)] cursor-pointer" onClick={() => navigate(`/appointments/${a.id}`)}>
                <td className="px-5 py-3 font-medium">{a.scheduledTime}</td>
                <td className="px-5 py-3">{a.patientName}</td>
                <td className="px-5 py-3">{a.appointmentTypeLabel}</td>
                <td className="px-5 py-3">{a.providerName}</td>
                <td className="px-5 py-3">{a.roomNumber || '—'}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${a.status === 'arrived' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : a.status === 'in-progress' ? 'bg-amber-100 text-amber-800 border-amber-200' : a.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] font-semibold text-sm">Upcoming Appointments</div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">Date</th><th className="text-left px-5 py-3">Time</th><th className="text-left px-5 py-3">Patient</th><th className="text-left px-5 py-3">Type</th><th className="text-left px-5 py-3">Provider</th><th className="text-left px-5 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-[var(--border)]">
            {all.filter(a => a.scheduledDate >= new Date().toISOString().split('T')[0] && a.status !== 'completed' && a.status !== 'cancelled').slice(0, 20).map(a => (
              <tr key={a.id} className="hover:bg-[var(--bg-subtle)]"><td className="px-5 py-3">{a.scheduledDate}</td><td className="px-5 py-3">{a.scheduledTime}</td><td className="px-5 py-3">{a.patientName}</td><td className="px-5 py-3">{a.appointmentTypeLabel}</td><td className="px-5 py-3">{a.providerName}</td><td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${a.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{a.status}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}