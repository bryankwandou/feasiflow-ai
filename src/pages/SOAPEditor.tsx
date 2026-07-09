import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { usePatientStore } from '@/stores/usePatientStore';
import AIGeneratedWrapper from '@/components/AIGeneratedWrapper';
import { callClaudeJSON } from '@/lib/claude';
import { motion } from 'framer-motion';
import { Sparkles, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import { CLINICAL_AGENTS } from '@/data/agentSeed';

export default function SOAPEditor() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientId = searchParams.get('patient') || '';
  const encounterStore = useEncounterStore();
  const patient = usePatientStore(s => s.patients[patientId || '']);
  const encounter = id && id !== 'new' ? encounterStore.encounters[id] : null;

  const [chiefComplaint, setChiefComplaint] = useState(encounter?.chiefComplaint || '');
  const [hpi, setHpi] = useState(encounter?.soapNote?.historyOfPresentIllness || '');
  const [ros, setRos] = useState(encounter?.soapNote?.reviewOfSystems || '');
  const [pe, setPe] = useState(encounter?.soapNote?.physicalExamination || '');
  const [assessment, setAssessment] = useState(encounter?.soapNote?.clinicalImpression || '');
  const [plan, setPlan] = useState(encounter?.soapNote?.medications || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSections, setAiSections] = useState<string[]>([]);
  const [attested, setAttested] = useState(false);

  const generateSOAP = async () => {
    if (!patient) return;
    setAiLoading(true);
    try {
      const prompt = `Patient: ${patient.firstName} ${patient.lastName}, ${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}${patient.gender === 'female' ? 'F' : 'M'}. Chief complaint: ${chiefComplaint}. Active diagnoses: ${patient.activeDiagnoses.map(d => d.code + ' ' + d.description).join(', ')}. Current meds: ${patient.currentMedications.map(m => m.medicationName + ' ' + m.strength).join(', ')}. Allergies: ${patient.allergies.map(a => a.substance + ' (' + a.reaction + ')').join(', ')}.`;
      const system = CLINICAL_AGENTS['agent-soap-scribe'].systemPrompt;
      const result = await callClaudeJSON<any>(system, prompt, 1200);
      if (result) {
        setHpi(result.subjective?.hpi || result.hpi || '');
        setRos(result.subjective?.review_of_systems || result.ros || '');
        setPe(result.objective?.physical_examination || result.pe || '');
        setAssessment(result.assessment?.clinical_impression || result.assessment || '');
        setPlan(result.plan?.medications || result.plan || '');
        setAiSections(['hpi', 'ros', 'pe', 'assessment', 'plan']);
      }
    } catch (e) {
      console.error(e);
    }
    setAiLoading(false);
  };

  const saveDraft = () => {
    if (!encounter) return;
    encounterStore.updateSOAP(encounter.id, { chiefComplaint, historyOfPresentIllness: hpi, reviewOfSystems: ros, physicalExamination: pe, clinicalImpression: assessment, medications: plan, aiGenerated: aiSections.length > 0, aiGeneratedSections: aiSections, providerEdited: true, lastEditedBy: 'Dr. Sarah Chen', lastEditedAt: Date.now() });
  };

  const signNote = () => {
    if (!encounter || !attested) return;
    encounterStore.signEncounter(encounter.id, 'Dr. Sarah Chen');
    navigate('/encounters');
  };

  if (!patient && !encounter) return <div className="p-8 text-center">Select a patient to begin documentation</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--bg-subtle)] rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">SOAP Note — {patient?.lastName}, {patient?.firstName}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Encounter Context</h3>
            <div className="text-sm space-y-1 text-[var(--text-secondary)]">
              <div><span className="font-medium text-[var(--text-primary)]">Patient:</span> {patient?.lastName}, {patient?.firstName}</div>
              <div><span className="font-medium text-[var(--text-primary)]">DOB:</span> {patient?.dateOfBirth}</div>
              <div><span className="font-medium text-[var(--text-primary)]">Provider:</span> Dr. Sarah Chen</div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <div className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-2">Active Problems</div>
              {patient?.activeDiagnoses.map((d, i) => <div key={i} className="text-xs py-0.5"><span className="font-code text-[var(--brand-text)]">{d.code}</span> {d.description}</div>)}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <div className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-2">Current Medications</div>
              {patient?.currentMedications.filter(m => m.status === 'active').map(m => <div key={m.id} className="text-xs py-0.5">{m.medicationName} {m.strength}</div>)}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <div className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-2">Allergies</div>
              {patient?.allergies.filter(a => a.status === 'active').map(a => <div key={a.id} className="text-xs py-0.5 text-red-700">{a.substance} — {a.reaction}</div>)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={generateSOAP} disabled={aiLoading} className="flex items-center gap-2 bg-[var(--ai)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--ai-text)] disabled:opacity-50">
              <Sparkles className="w-4 h-4" /> {aiLoading ? 'Generating...' : 'Generate with AI'}
            </button>
            <button onClick={saveDraft} className="flex items-center gap-2 bg-white border border-[var(--border)] text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--bg-subtle)]">
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <div className="flex-1" />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={attested} onChange={e => setAttested(e.target.checked)} className="rounded border-[var(--border)]" />
              <span>I have reviewed and attest to this documentation</span>
            </label>
            <button onClick={signNote} disabled={!attested} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              <CheckCircle className="w-4 h-4" /> Sign & Complete
            </button>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-xl p-5 space-y-5">
            <Section label="Chief Complaint" value={chiefComplaint} onChange={setChiefComplaint} ai={aiSections.includes('chiefComplaint')} />
            <Section label="History of Present Illness" value={hpi} onChange={setHpi} ai={aiSections.includes('hpi')} large />
            <Section label="Review of Systems" value={ros} onChange={setRos} ai={aiSections.includes('ros')} large />
            <Section label="Physical Examination" value={pe} onChange={setPe} ai={aiSections.includes('pe')} large />
            <Section label="Assessment / Clinical Impression" value={assessment} onChange={setAssessment} ai={aiSections.includes('assessment')} large />
            <Section label="Plan" value={plan} onChange={setPlan} ai={aiSections.includes('plan')} large />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, value, onChange, ai, large }: { label: string; value: string; onChange: (v: string) => void; ai?: boolean; large?: boolean }) {
  const content = (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">{label}</div>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={large ? 6 : 2} className="w-full p-3 bg-[var(--bg-clinical)] border border-[var(--border)] rounded-lg text-sm font-clinical focus:outline-none focus:border-[var(--border-focus)] resize-y" />
    </div>
  );
  if (ai) return <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}><AIGeneratedWrapper>{content}</AIGeneratedWrapper></motion.div>;
  return content;
}