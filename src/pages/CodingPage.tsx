import { useParams } from 'react-router-dom';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { useState } from 'react';
import { callClaudeJSON } from '@/lib/claude';
import { CLINICAL_AGENTS } from '@/data/agentSeed';
import { toast } from 'sonner';
import { Loader2, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CodingPage() {
  const { id } = useParams();
  const encounter = useEncounterStore((s) => (id ? s.encounters[id] : undefined));
  const addDiagnosis = useEncounterStore((s) => s.addDiagnosis);
  const addCPT = useEncounterStore((s) => s.addCPT);
  const [loading, setLoading] = useState(false);
  const [mdm, setMdm] = useState<any>(null);

  if (!encounter) return <div>Not found</div>;

  const suggestCoding = async () => {
    setLoading(true);
    try {
      const agent = CLINICAL_AGENTS['agent-coding-specialist'];
      const context = `Encounter date: ${encounter.encounterDate}
Chief complaint: ${encounter.chiefComplaint}
HPI: ${encounter.soapNote?.historyOfPresentIllness || 'Not documented'}
Physical exam: ${encounter.soapNote?.physicalExamination || 'Not documented'}
Assessment: ${encounter.soapNote?.clinicalImpression || 'Not documented'}
Plan: ${encounter.soapNote?.medications || 'Not documented'}
Vitals: ${encounter.vitalSigns ? `BP ${encounter.vitalSigns.bloodPressureSystolic}/${encounter.vitalSigns.bloodPressureDiastolic}` : 'None'}`;
      const result = await callClaudeJSON<any>(agent.systemPrompt, context, 1000);
      result.icd10_codes?.forEach((dx: any) => {
        addDiagnosis(encounter.id, { id: `dx_${Date.now()}_${Math.random()}`, icd10Code: dx.code, icd10Description: dx.description, diagnosisType: dx.type || 'secondary', chronic: true, newDiagnosis: false, presentingProblem: false });
      });
      result.cpt_codes?.forEach((cpt: any) => {
        addCPT(encounter.id, { id: `cpt_${Date.now()}_${Math.random()}`, cptCode: cpt.code, cptDescription: cpt.description, units: cpt.units || 1, fee: 150, aiSuggested: true, providerApproved: false });
      });
      setMdm(result.mdm_analysis);
      toast.success('Coding suggestions applied');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">AI Coding Suggestions</h1>
        <button onClick={suggestCoding} disabled={loading} className="flex items-center gap-1.5 bg-[var(--ai)] text-white px-3 py-1.5 rounded-lg text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Suggest Codes
        </button>
      </div>

      {mdm && (
        <div className="bg-white rounded-lg border border-[var(--border)] p-4">
          <h3 className="font-semibold mb-3">MDM Analysis</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-[var(--bg-subtle)] p-3 rounded">
              <div className="text-xs text-[var(--text-muted)]">Problems</div>
              <div className="font-medium">{mdm.ncp_level}</div>
            </div>
            <div className="bg-[var(--bg-subtle)] p-3 rounded">
              <div className="text-xs text-[var(--text-muted)]">Data</div>
              <div className="font-medium">{mdm.acd_level}</div>
            </div>
            <div className="bg-[var(--bg-subtle)] p-3 rounded">
              <div className="text-xs text-[var(--text-muted)]">Risk</div>
              <div className="font-medium">{mdm.roc_level}</div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-[var(--ai-light)] border border-[var(--ai-border)] rounded-lg">
            <div className="text-sm font-medium text-[var(--ai-text)]">Overall MDM: {mdm.overall_mdm} → Recommended: {mdm.recommended_level}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[var(--border)] p-4">
        <h3 className="font-semibold mb-3">ICD-10 Diagnoses</h3>
        {encounter.icd10Codes.length === 0 && <div className="text-sm text-[var(--text-muted)]">No diagnoses added</div>}
        {encounter.icd10Codes.map((d) => (
          <div key={d.id} className="flex justify-between p-2 border-b border-[var(--border)] last:border-0">
            <div><span className="font-mono font-medium">{d.icd10Code}</span> — {d.icd10Description}</div>
            <span className="text-xs bg-[var(--bg-subtle)] px-2 py-0.5 rounded">{d.diagnosisType}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)] p-4">
        <h3 className="font-semibold mb-3">CPT Codes</h3>
        {encounter.cptCodes.length === 0 && <div className="text-sm text-[var(--text-muted)]">No CPT codes added</div>}
        {encounter.cptCodes.map((c) => (
          <div key={c.id} className="flex justify-between p-2 border-b border-[var(--border)] last:border-0">
            <div><span className="font-mono font-medium">{c.cptCode}</span> — {c.cptDescription}</div>
            <div className="text-sm">${c.fee} · {c.units} unit{c.units > 1 ? 's' : ''} {c.aiSuggested && <span className="text-[var(--ai)] text-xs">✦ AI</span>}</div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-700 font-medium mb-2"><AlertTriangle className="w-4 h-4" /> Coding Flags</div>
        <div className="text-sm text-amber-700">
          Review all AI-suggested codes before submitting. Ensure documentation supports the selected level of service.
        </div>
      </div>
    </div>
  );
}
