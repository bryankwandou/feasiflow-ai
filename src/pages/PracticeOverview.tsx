import { useNavigate } from 'react-router-dom';
import { useAppointmentStore } from '@/stores/useAppointmentStore';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { useLabStore } from '@/stores/useLabStore';
import { useBillingStore } from '@/stores/useBillingStore';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, FileText, FlaskConical, Receipt, ArrowRight } from 'lucide-react';

export default function PracticeOverview() {
  const navigate = useNavigate();
  const todayAppts = useAppointmentStore(s => s.getTodayAppointments());
  const unsigned = useEncounterStore(s => s.getUnsigned());
  const unbilled = useEncounterStore(s => s.getUnbilled());
  const criticalLabs = useLabStore(s => s.getCriticalResults());
  const pendingLabs = useLabStore(s => s.getPendingReview());
  const denied = useBillingStore(s => s.getDenied());

  const stats = [
    { label: "Today's Schedule", value: `${todayAppts.length} appointments`, sub: `${todayAppts.filter(a => a.status === 'arrived').length} arrived · ${todayAppts.filter(a => a.status === 'in-progress').length} in progress`, icon: Calendar, color: 'bg-blue-100 text-blue-700', action: () => navigate('/schedule') },
    { label: 'Pending Tasks', value: `${unsigned.length} unsigned notes`, sub: `${pendingLabs.length} labs to review`, icon: FileText, color: 'bg-amber-100 text-amber-700', action: () => navigate('/encounters') },
    { label: 'Billing Status', value: `$${unbilled.reduce((s, e) => s + (e.totalCharges ?? 0), 0)} unbilled`, sub: `${denied.length} claim denials`, icon: Receipt, color: 'bg-emerald-100 text-emerald-700', action: () => navigate('/billing') },
    { label: 'Lab Results', value: `${pendingLabs.length} pending review`, sub: `${criticalLabs.length} critical values`, icon: FlaskConical, color: 'bg-purple-100 text-purple-700', action: () => navigate('/labs') },
  ];

  return (
    <div className="space-y-6">
      {criticalLabs.length > 0 && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span className="font-semibold text-sm">CRITICAL LAB VALUES:</span>
          {criticalLabs.map(lab => (
            <button key={lab.id} onClick={() => navigate(`/labs`)} className="bg-white text-red-600 font-bold px-2 py-1 rounded text-xs hover:bg-red-50">
              {lab.patientName}: {lab.components.find(c => c.valueStatus.includes('critical'))?.testName} = {lab.components.find(c => c.valueStatus.includes('critical'))?.value}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.button key={s.label} onClick={s.action} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white border border-[var(--border)] rounded-xl p-5 text-left hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-5 h-5" /></div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">{s.sub}</div>
            <div className="mt-3 flex items-center text-xs font-medium text-[var(--brand-mid)]">View <ArrowRight className="w-3 h-3 ml-1" /></div>
          </motion.button>
        ))}
      </div>

      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text-primary)]">Patient Flow — Today</h2>
          <span className="text-xs text-[var(--text-muted)]">{new Date().toLocaleDateString()}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase">
              <tr><th className="text-left px-5 py-3">Patient</th><th className="text-left px-5 py-3">Time</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Room</th><th className="text-left px-5 py-3">Provider</th><th className="text-left px-5 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {todayAppts.map(a => (
                <tr key={a.id} className="hover:bg-[var(--bg-subtle)]">
                  <td className="px-5 py-3 font-medium">{a.patientName}</td>
                  <td className="px-5 py-3">{a.scheduledTime}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${a.status === 'arrived' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : a.status === 'in-progress' ? 'bg-amber-100 text-amber-800 border-amber-200' : a.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>{a.status}</span>
                  </td>
                  <td className="px-5 py-3">{a.roomNumber || '—'}</td>
                  <td className="px-5 py-3">{a.providerName}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => navigate(`/patients/${a.patientId}`)} className="text-[var(--brand-mid)] hover:underline text-xs font-medium">Chart</button>
                    {a.status === 'arrived' && <button onClick={() => navigate(`/encounters/${a.encounterId || 'new'}?patient=${a.patientId}&appt=${a.id}`)} className="ml-3 text-[var(--brand-mid)] hover:underline text-xs font-medium">Start Visit</button>}
                  </td>
                </tr>
              ))}
              {todayAppts.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-[var(--text-muted)]">No appointments scheduled for today</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}