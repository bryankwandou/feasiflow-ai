import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '@/stores/usePatientStore';
import { Search, UserPlus } from 'lucide-react';

export default function Patients() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const patients = usePatientStore(s => s.searchPatients(query));
  const allPatients = usePatientStore(s => Object.values(s.patients));
  const display = query ? patients : allPatients;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Patient Registry</h1>
        <button onClick={() => navigate('/patients/new')} className="flex items-center gap-2 bg-[var(--brand-mid)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand)]">
          <UserPlus className="w-4 h-4" /> New Patient
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, MRN, DOB, or phone..." className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--border-focus)]" />
      </div>
      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">Name</th><th className="text-left px-5 py-3">MRN</th><th className="text-left px-5 py-3">DOB</th><th className="text-left px-5 py-3">Provider</th><th className="text-left px-5 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-[var(--border)]">
            {display.map(p => (
              <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} className="hover:bg-[var(--bg-subtle)] cursor-pointer">
                <td className="px-5 py-3 font-medium">{p.lastName}, {p.firstName}</td>
                <td className="px-5 py-3 font-code text-xs">{p.mrn}</td>
                <td className="px-5 py-3">{p.dateOfBirth}</td>
                <td className="px-5 py-3">{p.primaryProvider}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}