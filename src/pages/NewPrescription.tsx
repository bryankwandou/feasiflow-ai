import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrescriptionStore } from '@/stores/usePrescriptionStore';
import { usePatientStore } from '@/stores/usePatientStore';
import { callClaudeJSON } from '@/lib/claude';
import { CLINICAL_AGENTS } from '@/data/agentSeed';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function NewPrescription() {
  const navigate = useNavigate();
  const patients = usePatientStore((s) => Object.values(s.patients));
  const addPrescription = usePrescriptionStore((s) => s.addPrescription);
  const [form, setForm] = useState({
    patientId: '', medicationName: '', genericName: '', strength: '', dosageForm: 'tablet',
    sig: '', quantity: 30, unit: 'tablets', daysSupply: 30, refills: 5,
    indication: '', substituteGeneric: true, isControlled: false,
    pharmacyName: 'CVS Pharmacy', status: 'pending' as const,
    writtenDate: new Date().toISOString().split('T')[0],
  });
  const [checking, setChecking] = useState(false);
  const [interactionResult, setInteractionResult] = useState<any>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const selectedPatient = patients.find((p) => p.id === form.patientId);

  const runInteractionCheck = async () => {
    if (!selectedPatient) { toast.error('Select a patient'); return; }
    setChecking(true);
    try {
      const agent = CLINICAL_AGENTS['agent-drug-interaction'];
      const context = `New medication: ${form.medicationName} ${form.strength}
Patient medications: ${selectedPatient.currentMedications.filter(m => m.status === 'active').map(m => m.medicationName + ' ' + m.strength).join(', ')}
Allergies: ${selectedPatient.allergies.filter(a => a.status === 'active').map(a => a.substance).join(', ')}
Indication: ${form.indication}`;
      const result = await callClaudeJSON<any>(agent.systemPrompt, context, 1000);
      setInteractionResult(result);
      toast.success('Interaction check complete');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error('Select a patient'); return; }
    if (interactionResult && (interactionResult.overall_safety_assessment === 'contraindicated' || interactionResult.overall_safety_assessment === 'significant-concern') && !acknowledged) {
      toast.error('You must acknowledge the interaction check before proceeding');
      return;
    }
    const id = addPrescription({
      ...form as any,
      patientName: `${selectedPatient.lastName}, ${selectedPatient.firstName}`,
      prescriberId: 'prov_chen',
      prescriberName: 'Dr. Sarah Chen',
      prescriberNPI: '1234567890',
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    });
    toast.success('Prescription created');
    navigate('/prescriptions');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/prescriptions')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold">New Prescription</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[var(--border)] p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Patient</label>
          <select required value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
            <option value="">Select patient...</option>
            {patients.map((p) => (<option key={p.id} value={p.id}>{p.lastName}, {p.firstName} ({p.mrn})</option>))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Medication</label>
            <input required value={form.medicationName} onChange={e => setForm({...form, medicationName: e.target.value})} placeholder="e.g. Metformin" className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Strength</label>
            <input required value={form.strength} onChange={e => setForm({...form, strength: e.target.value})} placeholder="e.g. 500mg" className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Form</label>
            <select value={form.dosageForm} onChange={e => setForm({...form, dosageForm: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
              <option>tablet</option><option>capsule</option><option>liquid</option><option>inhaler</option><option>cream</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SIG (Directions)</label>
          <input required value={form.sig} onChange={e => setForm({...form, sig: e.target.value})} placeholder="Take 1 tablet by mouth twice daily with meals" className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Days Supply</label>
            <input type="number" value={form.daysSupply} onChange={e => setForm({...form, daysSupply: Number(e.target.value)})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Refills</label>
            <input type="number" value={form.refills} onChange={e => setForm({...form, refills: Number(e.target.value)})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Indication</label>
          <input required value={form.indication} onChange={e => setForm({...form, indication: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
        </div>

        <div className="pt-4 border-t border-[var(--border)]">
          <button type="button" onClick={runInteractionCheck} disabled={checking || !form.patientId} className="flex items-center gap-1.5 bg-[var(--ai)] text-white px-3 py-1.5 rounded-lg text-sm mb-4">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />} Run AI Interaction Check
          </button>

          {interactionResult && (
            <div className={`p-3 rounded-lg mb-4 ${interactionResult.overall_safety_assessment === 'contraindicated' ? 'bg-red-50 border border-red-200' : interactionResult.overall_safety_assessment === 'significant-concern' ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="font-medium mb-2">Safety Assessment: {interactionResult.overall_safety_assessment}</div>
              {interactionResult.drug_drug_interactions?.map((i: any, idx: number) => (
                <div key={idx} className="text-sm mb-1">
                  <span className={`font-medium ${i.severity === 'contraindicated' || i.severity === 'major' ? 'text-red-600' : 'text-orange-600'}`}>{i.severity}</span> — {i.interacting_drug}: {i.clinical_effect}
                </div>
              ))}
              {(interactionResult.overall_safety_assessment === 'contraindicated' || interactionResult.overall_safety_assessment === 'significant-concern') && (
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
                  I have reviewed the interaction check and choose to proceed
                </label>
              )}
            </div>
          )}
        </div>

        <button type="submit" className="flex items-center gap-1.5 bg-[var(--brand-mid)] text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Save className="w-4 h-4" /> Create Prescription
        </button>
      </form>
    </div>
  );
}
