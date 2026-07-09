import { useBillingStore } from '@/stores/useBillingStore';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Receipt, AlertTriangle } from 'lucide-react';

export default function BillingOverview() {
  const denied = useBillingStore(s => s.getDenied());
  const pending = useBillingStore(s => s.getPending());
  const arAging = useBillingStore(s => s.getTotalARByAging());
  const monthly = useBillingStore(s => s.getMonthlyRevenue(6));
  const unbilled = useEncounterStore(s => s.getUnbilled());

  const arData = [
    { name: '0-30 days', value: arAging['0-30'], fill: '#16A34A' },
    { name: '31-60 days', value: arAging['31-60'], fill: '#D97706' },
    { name: '61-90 days', value: arAging['61-90'], fill: '#EA580C' },
    { name: '90+ days', value: arAging['90+'], fill: '#DC2626' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Revenue Cycle</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-xl p-5">
          <div className="text-sm text-[var(--text-muted)] mb-1">Denied Claims</div>
          <div className="text-2xl font-bold text-red-600">{denied.length}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Action required</div>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-xl p-5">
          <div className="text-sm text-[var(--text-muted)] mb-1">Pending Claims</div>
          <div className="text-2xl font-bold text-[var(--brand-mid)]">{pending.length}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Awaiting adjudication</div>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-xl p-5">
          <div className="text-sm text-[var(--text-muted)] mb-1">Unbilled Encounters</div>
          <div className="text-2xl font-bold text-amber-600">{unbilled.length}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Revenue at risk</div>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-xl p-5">
          <div className="text-sm text-[var(--text-muted)] mb-1">Total AR</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">${Object.values(arAging).reduce((a, b) => a + b, 0).toLocaleString()}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Outstanding balance</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">AR Aging</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="value" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Monthly Revenue</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="period" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="billed" fill="var(--brand-mid)" name="Billed" radius={[4, 4, 0, 0]} /><Bar dataKey="collected" fill="#059669" name="Collected" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-sm">Claim Denials — Action Required</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">Patient</th><th className="text-left px-5 py-3">Date of Service</th><th className="text-left px-5 py-3">Amount</th><th className="text-left px-5 py-3">Denial Code</th><th className="text-left px-5 py-3">Reason</th><th className="text-left px-5 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-[var(--border)]">
            {denied.map(c => (
              <tr key={c.id} className="hover:bg-[var(--bg-subtle)]">
                <td className="px-5 py-3 font-medium">{c.patientName}</td>
                <td className="px-5 py-3">{c.dateOfService}</td>
                <td className="px-5 py-3">${c.totalCharges.toFixed(2)}</td>
                <td className="px-5 py-3 font-code text-xs">{c.denialCode}</td>
                <td className="px-5 py-3 max-w-xs truncate">{c.denialReason}</td>
                <td className="px-5 py-3"><button className="text-xs text-[var(--ai)] font-medium hover:underline flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> AI Appeal</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}