import { useNavigate } from 'react-router-dom';
import { useLabStore } from '@/stores/useLabStore';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LabResults() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'critical' | 'abnormal' | 'pending'>('all');
  const allResults = useLabStore(s => Object.values(s.results).sort((a, b) => b.reportedAt - a.reportedAt));
  const critical = useLabStore(s => s.getCriticalResults());
  const pending = useLabStore(s => s.getPendingReview());

  const filtered = filter === 'critical' ? critical : filter === 'abnormal' ? allResults.filter(r => r.hasAbnormal && !r.hasCritical) : filter === 'pending' ? pending : allResults;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Lab Results</h1>
      <div className="flex gap-2">
        {([['all', 'All'], ['critical', 'Critical'], ['abnormal', 'Abnormal'], ['pending', 'Pending Review']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${filter === key ? 'bg-[var(--brand-mid)] text-white border-[var(--brand-mid)]' : 'bg-white text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-subtle)]'}`}>
            {label} {key === 'critical' ? `(${critical.length})` : key === 'pending' ? `(${pending.length})` : ''}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(lab => (
          <div key={lab.id} className={`bg-white border rounded-xl p-5 ${lab.hasCritical ? 'border-red-300' : lab.hasAbnormal ? 'border-amber-300' : 'border-[var(--border)]'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {lab.hasCritical && <AlertTriangle className="w-5 h-5 text-red-600" />}
                <span className="font-medium">{lab.patientName}</span>
                <span className="text-sm text-[var(--text-muted)]">· {lab.testPanel} · {lab.resultDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs border ${lab.status === 'acknowledged' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : lab.status === 'reviewed' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>{lab.status}</span>
                <button onClick={() => navigate(`/labs`)} className="text-xs text-[var(--brand-mid)] hover:underline">View</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {lab.components.map(c => (
                <div key={c.id} className={`p-2 rounded border text-center ${c.valueStatus.includes('critical') ? 'bg-red-50 border-red-200' : c.valueStatus === 'high' || c.valueStatus === 'low' ? 'bg-amber-50 border-amber-200' : 'bg-[var(--bg-subtle)] border-[var(--border)]'}`}>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">{c.testName}</div>
                  <div className={`text-sm font-code font-semibold ${c.valueStatus.includes('critical') ? 'text-red-700' : c.valueStatus === 'high' || c.valueStatus === 'low' ? 'text-amber-700' : 'text-[var(--text-primary)]'}`}>{c.value}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{c.unit}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}