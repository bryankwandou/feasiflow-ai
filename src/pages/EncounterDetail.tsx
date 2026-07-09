import { useParams, useNavigate } from 'react-router-dom';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { usePatientStore } from '@/stores/usePatientStore';
import { ArrowLeft, FileText, Edit, DollarSign } from 'lucide-react';

export default function EncounterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const encounter = useEncounterStore((s) => (id ? s.encounters[id] : undefined));
  const patient = usePatientStore((s) => (encounter ? s.patients[encounter.patientId] : undefined));

  if (!encounter) return <div>Encounter not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/encounters')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold">Encounter Detail</h1>
      </div>
      <div className="bg-white rounded-lg border border-[var(--border)] p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-[var(--text-muted)]">Patient:</span> <span className="font-medium">{encounter.patientName}</span></div>
          <div><span className="text-[var(--text-muted)]">Date:</span> <span className="font-medium">{encounter.encounterDate} {encounter.encounterTime}</span></div>
          <div><span className="text-[var(--text-muted)]">Provider:</span> <span className="font-medium">{encounter.providerName}</span></div>
          <div><span className="text-[var(--text-muted)]">Type:</span> <span className="font-medium capitalize">{encounter.encounterType}</span></div>
          <div><span className="text-[var(--text-muted)]">Status:</span> <span className="font-medium">{encounter.status}</span></div>
          <div><span className="text-[var(--text-muted)]">Billing:</span> <span className="font-medium">{encounter.billingStatus}</span></div>
        </div>

        {encounter.vitalSigns && (
          <div className="pt-4 border-t border-[var(--border)]">
            <h3 className="font-semibold mb-2">Vital Signs</h3>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="bg-[var(--bg-subtle)] p-2 rounded">BP: <span className="font-mono font-medium">{encounter.vitalSigns.bloodPressureSystolic}/{encounter.vitalSigns.bloodPressureDiastolic}</span></div>
              <div className="bg-[var(--bg-subtle)] p-2 rounded">HR: <span className="font-mono font-medium">{encounter.vitalSigns.heartRate}</span></div>
              <div className="bg-[var(--bg-subtle)] p-2 rounded">SpO2: <span className="font-mono font-medium">{encounter.vitalSigns.oxygenSaturation}%</span></div>
              <div className="bg-[var(--bg-subtle)] p-2 rounded">Wt: <span className="font-mono font-medium">{encounter.vitalSigns.weight} lbs</span></div>
            </div>
          </div>
        )}

        {encounter.soapNote && (
          <div className="pt-4 border-t border-[var(--border)]">
            <h3 className="font-semibold mb-2">SOAP Note</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Chief Complaint:</span> {encounter.soapNote.chiefComplaint}</div>
              <div><span className="font-medium">HPI:</span> <span className="font-clinical text-[var(--text-clinical)]">{encounter.soapNote.historyOfPresentIllness}</span></div>
              <div><span className="font-medium">Assessment:</span> {encounter.soapNote.clinicalImpression}</div>
              <div><span className="font-medium">Plan:</span> {encounter.soapNote.medications}</div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[var(--border)] flex gap-2">
          <button onClick={() => navigate(`/encounters/${encounter.id}/soap`)} className="flex items-center gap-1.5 bg-[var(--brand-mid)] text-white px-3 py-1.5 rounded-lg text-sm"><FileText className="w-4 h-4" /> Edit SOAP</button>
          <button onClick={() => navigate(`/encounters/${encounter.id}/coding`)} className="flex items-center gap-1.5 bg-[var(--ai)] text-white px-3 py-1.5 rounded-lg text-sm"><Edit className="w-4 h-4" /> Coding</button>
        </div>
      </div>
    </div>
  );
}
