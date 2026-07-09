import { useNavigate } from 'react-router-dom';
import { useEncounterStore } from '@/stores/useEncounterStore';

export default function Encounters() {
  const navigate = useNavigate();
  const encounters = useEncounterStore(s => Object.values(s.encounters).sort((a, b) => `${b.encounterDate} ${b.encounterTime}`.localeCompare(`${a.encounterDate} ${a.encounterTime}`)));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Encounters</h1>
      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">Date</th><th className="text-left px-5 py-3">Patient</th><th className="text-left px-5 py-3">Type</th><th className="text-left px-5 py-3">Chief Complaint</th><th className="text-left px-5 py-3">Provider</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Billing</th></tr></thead>
          <tbody className="divide-y divide-[var(--border)]">
            {encounters.map(e => (
              <tr key={e.id} className="hover:bg-[var(--bg-subtle)] cursor-pointer" onClick={() => navigate(`/encounters/${e.id}/soap`)}>
                <td className="px-5 py-3">{e.encounterDate} {e.encounterTime}</td>
                <td className="px-5 py-3 font-medium">{e.patientName}</td>
                <td className="px-5 py-3 capitalize">{e.encounterType.replace('-', ' ')}</td>
                <td className="px-5 py-3 max-w-xs truncate">{e.chiefComplaint}</td>
                <td className="px-5 py-3">{e.providerName}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${e.status === 'signed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : e.status === 'in-progress' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>{e.status}</span></td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${e.billingStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : e.billingStatus === 'unbilled' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{e.billingStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}