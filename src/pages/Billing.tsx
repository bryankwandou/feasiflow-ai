import { useNavigate } from 'react-router-dom';
import { useBillingStore } from '@/stores/useBillingStore';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { useState } from 'react';
import { callClaudeJSON } from '@/lib/claude';
import { CLINICAL_AGENTS } from '@/data/agentSeed';
import { toast } from 'sonner';
import { Loader2, Sparkles, FileText, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Billing() {
  const navigate = useNavigate();
  const claims = useBillingStore((s) => Object.values(s.claims).sort((a, b) => b.createdAt - a.createdAt));
  const denied = useBillingStore((s) => s.getDenied());
  const pending = useBillingStore((s) => s.getPending());
  const arAging = useBillingStore((s) => s.getTotalARByAging());
  const monthlyRevenue = useBillingStore((s) => s.getMonthlyRevenue(6));
  const unbilled = useEncounterStore((s) => s.getUnbilled());
  const [appealing, setAppealing] = useState<string | null>(null);

  const arData = [
    { name: '0-30', amount: arAging['0-30'] },
    { name: '31-60', amount: arAging['31-60'] },
    { name: '61-90', amount: arAging['61-90'] },
    { name: '90+', amount: arAging['90+'] },
  ];

  const revenueData = monthlyRevenue.map((m) => ({ name: m.period, billed: m.billed, collected: m.collected }));

  const generateAppeal = async (claimId: string) => {
    setAppealing(claimId);
    try {
      const claim = claims.find((c) => c.id === claimId);
      if (!claim) return;
      const agent = CLINICAL_AGENTS['agent-denial-analyzer'];
      const context = `Claim #: ${claim.id}
Patient: ${claim.patientName}
Date of Service: ${claim.dateOfService}
Denial Code: ${claim.denialCode}
Denial Reason: ${claim.denialReason}
Total Charges: $${claim.totalCharges}
Service Lines: ${claim.serviceLines.map((s) => `${s.cptCode} - ${s.description}`).join(', ')}
ICD-10: ${claim.icd10Codes.join(', ')}`;
      const result = await callClaudeJSON<any>(agent.systemPrompt, context, 1000);
      toast.success('Appeal letter generated');
      alert(result.appeal_letter?.substring(0, 1000) + '...\\n\\n(Full letter saved to claim record)');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAppealing(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing & Revenue Cycle</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm mb-2"><DollarSign className="w-4 h-4" /> Total AR</div>
          <div className="text-2xl font-bold">${Object.values(arAging).reduce((a, b) => a + b, 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm mb-2"><AlertTriangle className="w-4 h-4" /> Denied</div>
          <div className="text-2xl font-bold text-red-600">{denied.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm mb-2"><TrendingUp className="w-4 h-4" /> Pending</div>
          <div className="text-2xl font-bold text-blue-600">{pending.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm mb-2"><FileText className="w-4 h-4" /> Unbilled</div>
          <div className="text-2xl font-bold text-amber-600">{unbilled.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[var(--border)] p-4">
          <h3 className="font-semibold mb-3">AR Aging</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="amount" fill="#1D6FD8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[var(--border)] p-4">
          <h3 className="font-semibold mb-3">Monthly Revenue</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="billed" fill="#1D6FD8" />
                <Bar dataKey="collected" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)] p-4">
        <h2 className="font-semibold mb-3">Claims Requiring Action</h2>
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)]">
            <tr><th className="text-left p-2">Claim</th><th className="text-left p-2">Patient</th><th className="text-left p-2">Amount</th><th className="text-left p-2">Status</th><th className="text-left p-2">Denial</th><th className="text-left p-2">Actions</th></tr>
          </thead>
          <tbody>
            {claims.filter((c) => c.status === 'denied' || c.status === 'submitted').map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-subtle)]">
                <td className="p-2 font-mono text-xs">{c.id.slice(0, 12)}</td>
                <td className="p-2">{c.patientName}</td>
                <td className="p-2">${c.totalCharges}</td>
                <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'paid' ? 'bg-green-100 text-green-700' : c.status === 'denied' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{c.status}</span></td>
                <td className="p-2 text-xs">{c.denialCode || '—'}</td>
                <td className="p-2">
                  {c.status === 'denied' && (
                    <button onClick={() => generateAppeal(c.id)} disabled={appealing === c.id} className="flex items-center gap-1 text-xs bg-[var(--ai)] text-white px-2 py-1 rounded">
                      {appealing === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Appeal
                    </button>
                  )}
                  <button onClick={() => navigate(`/billing/claims/${c.id}`)} className="text-[var(--brand-mid)] hover:underline text-xs ml-2">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)] p-4">
        <h2 className="font-semibold mb-3">Unbilled Encounters</h2>
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)]">
            <tr><th className="text-left p-2">Date</th><th className="text-left p-2">Patient</th><th className="text-left p-2">Provider</th><th className="text-left p-2">Type</th><th className="text-left p-2">Action</th></tr>
          </thead>
          <tbody>
            {unbilled.map((e) => (
              <tr key={e.id} className="border-t border-[var(--border)]">
                <td className="p-2">{e.encounterDate}</td>
                <td className="p-2">{e.patientName}</td>
                <td className="p-2">{e.providerName}</td>
                <td className="p-2">{e.encounterType}</td>
                <td className="p-2"><button onClick={() => navigate(`/encounters/${e.id}/coding`)} className="text-[var(--brand-mid)] hover:underline text-xs">Code & Bill</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
