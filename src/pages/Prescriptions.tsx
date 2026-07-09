import { useState } from 'react';
import { usePrescriptionStore } from '@/stores/usePrescriptionStore';
import { usePatientStore } from '@/stores/usePatientStore';
import { Pill, AlertTriangle } from 'lucide-react';

export default function Prescriptions() {
  const [selectedPatient, setSelectedPatient] = useState('');
  const prescriptions = usePrescriptionStore(s => s.prescriptions);
  const patients = usePatientStore(s => Object.values(s.patients));

  const filtered = selectedPatient
    ? Object.values(prescriptions).filter(r => r.patientId === selectedPatient)
    : Object.values(prescriptions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Prescription Manager</h1>
        <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} className="bg-white border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
          <option value="">All Patients</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>)}
        </select>
      </div>
      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">RX#</th><th className="text-left px-5 py-3">Patient</th><th className="text-left px-5 py-3">Medication</th><th className="text-left px-5 py-3">SIG</th><th className="text-left px-5 py-3">Refills</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Interactions</th></tr></thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map(rx => (
              <tr key={rx.id} className="hover:bg-[var(--bg-subtle)]">
                <td className="px-5 py-3 font-code text-xs">{rx.rxNumber}</td>
                <td className="px-5 py-3">{rx.patientName}</td>
                <td className="px-5 py-3 font-medium">{rx.medicationName} {rx.strength}</td>
                <td className="px-5 py-3 max-w-xs truncate">{rx.sig}</td>
                <td className="px-5 py-3">{rx.refillsRemaining}/{rx.refills}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${rx.status === 'filled' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : rx.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{rx.status}</span></td>
                <td className="px-5 py-3">
                  {rx.interactions.length > 0 ? (
                    <span className={`flex items-center gap-1 text-xs font-medium ${rx.interactions.some(i => i.severity === 'contraindicated' || i.severity === 'major') ? 'text-red-600' : 'text-amber-600'}`}>
                      <AlertTriangle className="w-3 h-3" /> {rx.interactions.length} found
                    </span>
                  ) : <span className="text-xs text-[var(--text-muted)]">None</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}