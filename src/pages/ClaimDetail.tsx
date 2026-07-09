import { useParams, useNavigate } from 'react-router-dom';
import { useBillingStore } from '@/stores/useBillingStore';
import { ArrowLeft } from 'lucide-react';

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const claim = useBillingStore((s) => (id ? s.claims[id] : undefined));

  if (!claim) return <div>Claim not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/billing')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold">Claim Detail</h1>
      </div>
      <div className="bg-white rounded-lg border border-[var(--border)] p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-[var(--text-muted)]">Claim ID:</span> <span className="font-mono font-medium">{claim.id}</span></div>
          <div><span className="text-[var(--text-muted)]">Patient:</span> <span className="font-medium">{claim.patientName}</span></div>
          <div><span className="text-[var(--text-muted)]">Date of Service:</span> <span className="font-medium">{claim.dateOfService}</span></div>
          <div><span className="text-[var(--text-muted)]">Status:</span> <span className="font-medium">{claim.status}</span></div>
          <div><span className="text-[var(--text-muted)]">Total Charges:</span> <span className="font-medium">${claim.totalCharges}</span></div>
          <div><span className="text-[var(--text-muted)]">Balance:</span> <span className="font-medium">${claim.balance}</span></div>
          {claim.denialCode && (
            <>
              <div><span className="text-[var(--text-muted)]">Denial Code:</span> <span className="font-medium text-red-600">{claim.denialCode}</span></div>
              <div><span className="text-[var(--text-muted)]">Denial Reason:</span> <span className="font-medium">{claim.denialReason}</span></div>
            </>
          )}
        </div>
        <div className="pt-4 border-t border-[var(--border)]">
          <h3 className="font-semibold mb-2">Service Lines</h3>
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)]"><tr><th className="text-left p-2">CPT</th><th className="text-left p-2">Description</th><th className="text-left p-2">Units</th><th className="text-left p-2">Charge</th></tr></thead>
            <tbody>
              {claim.serviceLines.map((sl) => (
                <tr key={sl.id} className="border-t border-[var(--border)]">
                  <td className="p-2 font-mono">{sl.cptCode}</td>
                  <td className="p-2">{sl.description}</td>
                  <td className="p-2">{sl.units}</td>
                  <td className="p-2">${sl.chargeAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
