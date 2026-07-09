import { useReferralStore } from '@/stores/useReferralStore';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function Referrals() {
  const navigate = useNavigate();
  const referrals = useReferralStore(s => Object.values(s.referrals).sort((a, b) => b.createdAt - a.createdAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Referrals</h1>
        <button onClick={() => navigate('/referrals/new')} className="flex items-center gap-2 bg-[var(--brand-mid)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand)]">
          <Mail className="w-4 h-4" /> New Referral
        </button>
      </div>
      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">REF#</th><th className="text-left px-5 py-3">Patient</th><th className="text-left px-5 py-3">Specialist</th><th className="text-left px-5 py-3">Specialty</th><th className="text-left px-5 py-3">Urgency</th><th className="text-left px-5 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-[var(--border)]">
            {referrals.map(r => (
              <tr key={r.id} className="hover:bg-[var(--bg-subtle)] cursor-pointer" onClick={() => navigate(`/referrals/${r.id}`)}>
                <td className="px-5 py-3 font-code text-xs">{r.referralNumber}</td>
                <td className="px-5 py-3 font-medium">{r.patientName}</td>
                <td className="px-5 py-3">{r.specialistName}</td>
                <td className="px-5 py-3">{r.specialistSpecialty}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${r.urgency === 'emergent' ? 'bg-red-100 text-red-800 border-red-200' : r.urgency === 'urgent' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>{r.urgency}</span></td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${r.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : r.status === 'sent' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}