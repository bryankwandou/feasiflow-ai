import { useNavigate } from 'react-router-dom';
import { useLabStore } from '@/stores/useLabStore';
import { useState } from 'react';
import { FlaskConical, AlertTriangle, Eye, CheckCircle } from 'lucide-react';

export default function Labs() {
  const navigate = useNavigate();
  const critical = useLabStore((s) => s.getCriticalResults());
  const pending = useLabStore((s) => s.getPendingReview());
  const all = useLabStore((s) => Object.values(s.results).sort((a, b) => b.reportedAt - a.reportedAt));
  const [filter, setFilter] = useState<'all' | 'critical' | 'pending' | 'reviewed'>('all');

  const filtered = filter === 'all' ? all : filter === 'critical' ? critical : filter === 'pending' ? pending : all.filter(l => l.status === 'reviewed');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Lab Results</h1>

      <div className="flex gap-2">
        {(['all', 'critical', 'pending', 'reviewed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${filter === f ? 'bg-[var(--brand-mid)] text-white' : 'bg-white border border-[var(--border)] text-[var(--text-secondary)]'}`}
          >
            {f === 'critical' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? all.length : f === 'critical' ? critical.length : f === 'pending' ? pending.length : all.filter(l => l.status === 'reviewed').length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)]">
            <tr>
              <th className="text-left p-3">Patient</th>
              <th className="text-left p-3">Panel</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Lab</th>
              <th className="text-left p-3">Abnormal</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lab) => (
              <tr key={lab.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-subtle)]">
                <td className="p-3 font-medium">{lab.patientName}</td>
                <td className="p-3">{lab.testPanel}</td>
                <td className="p-3">{lab.resultDate}</td>
                <td className="p-3 text-xs">{lab.lab}</td>
                <td className="p-3">
                  {lab.hasCritical && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">Critical</span>}
                  {!lab.hasCritical && lab.hasAbnormal && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Abnormal</span>}
                  {!lab.hasAbnormal && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Normal</span>}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${lab.status === 'acknowledged' ? 'bg-green-100 text-green-700' : lab.status === 'reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {lab.status}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => navigate(`/labs/${lab.id}`)} className="text-[var(--brand-mid)] hover:underline text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
