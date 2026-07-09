import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReferralStore } from '@/stores/useReferralStore';
import { usePatientStore } from '@/stores/usePatientStore';
import { callClaudeJSON } from '@/lib/claude';
import { CLINICAL_AGENTS } from '@/data/agentSeed';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react';

export default function NewReferral() {
  const navigate = useNavigate();
  const patients = usePatientStore((s) => Object.values(s.patients));
  const addReferral = useReferralStore((s) => s.addReferral);
  const [form, setForm] = useState({
    patientId: '', specialistName: '', specialistSpecialty: '', specialistPractice: '',
    specialistPhone: '', specialistFax: '', specialistAddress: '',
    referralReason: '', primaryDiagnosis: '', urgency: 'routine' as 'routine' | 'urgent' | 'emergent',
    clinicalSummary: '', authorizationRequired: false,
  });
  const [generating, setGenerating] = useState(false);
  const [letter, setLetter] = useState('');

  const selectedPatient = patients.find((p) => p.id === form.patientId);

  const generateLetter = async () => {
    if (!selectedPatient) { toast.error('Select a patient'); return; }
    setGenerating(true);
    try {
      const agent = CLINICAL_AGENTS['agent-referral-letter'];
      const context = `Patient: ${selectedPatient.firstName} ${selectedPatient.lastName}, DOB: ${selectedPatient.dateOfBirth}, MRN: ${selectedPatient.mrn}
Specialist: ${form.specialistName}, ${form.specialistSpecialty}
Reason: ${form.referralReason}
Primary Diagnosis: ${form.primaryDiagnosis}
Clinical Summary: ${form.clinicalSummary}
Active Diagnoses: ${selectedPatient.activeDiagnoses.map(d => d.code + ' ' + d.description).join(', ')}
Current Meds: ${selectedPatient.currentMedications.filter(m => m.status === 'active').map(m => m.medicationName + ' ' + m.strength).join(', ')}
Allergies: ${selectedPatient.allergies.filter(a => a.status === 'active').map(a => a.substance + ' (' + a.reaction + ')').join(', ')}`;
      const result = await callClaudeJSON<any>(agent.systemPrompt, context, 1000);
      setLetter(result.referral_letter_text || '');
      toast.success('Referral letter generated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const id = addReferral({
      ...form as any,
      patientName: `${selectedPatient.lastName}, ${selectedPatient.firstName}`,
      patientDOB: selectedPatient.dateOfBirth,
      patientInsurance: selectedPatient.insuranceCarrier,
      patientMemberId: selectedPatient.memberId,
      referringProvider: 'Dr. Sarah Chen',
      referringNPI: '1234567890',
      referringPractice: 'Riverside Family Medicine',
      referringPhone: '(951) 555-0100',
      referringFax: '(951) 555-0101',
      secondaryDiagnoses: [],
      referralLetter: letter,
      aiGeneratedLetter: true,
      attachedRecords: [],
      status: 'draft',
      consultNoteReceived: false,
      notes: '',
    });
    toast.success('Referral created');
    navigate('/referrals');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/referrals')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold">New Referral</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[var(--border)] p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Patient</label>
          <select required value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
            <option value="">Select patient...</option>
            {patients.map((p) => (<option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Specialist Name</label>
            <input required value={form.specialistName} onChange={e => setForm({...form, specialistName: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Specialty</label>
            <select required value={form.specialistSpecialty} onChange={e => setForm({...form, specialistSpecialty: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
              <option>Cardiology</option><option>Nephrology</option><option>Endocrinology</option><option>Neurology</option><option>Orthopedics</option><option>Pulmonology</option><option>Gastroenterology</option><option>Rheumatology</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Referral Reason</label>
          <input required value={form.referralReason} onChange={e => setForm({...form, referralReason: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Primary Diagnosis (ICD-10)</label>
          <input required value={form.primaryDiagnosis} onChange={e => setForm({...form, primaryDiagnosis: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Urgency</label>
          <div className="flex gap-4">
            {(['routine', 'urgent', 'emergent'] as const).map((u) => (
              <label key={u} className="flex items-center gap-2 text-sm">
                <input type="radio" name="urgency" checked={form.urgency === u} onChange={() => setForm({...form, urgency: u})} />
                <span className="capitalize">{u}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Clinical Summary</label>
          <textarea rows={3} value={form.clinicalSummary} onChange={e => setForm({...form, clinicalSummary: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
        </div>
        <button type="button" onClick={generateLetter} disabled={generating} className="flex items-center gap-1.5 bg-[var(--ai)] text-white px-3 py-1.5 rounded-lg text-sm">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate AI Referral Letter
        </button>
        {letter && (
          <div className="ai-generated-wrapper">
            <div className="ai-generated-badge"><Sparkles className="w-3 h-3" /> AI Generated — requires review</div>
            <textarea value={letter} onChange={e => setLetter(e.target.value)} rows={8} className="w-full p-2 text-sm font-clinical bg-transparent border-none outline-none" />
          </div>
        )}
        <button type="submit" className="flex items-center gap-1.5 bg-[var(--brand-mid)] text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Save className="w-4 h-4" /> Create Referral
        </button>
      </form>
    </div>
  );
}
