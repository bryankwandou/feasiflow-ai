import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePatientStore } from '@/stores/usePatientStore';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { useLabStore } from '@/stores/useLabStore';
import { useAppointmentStore } from '@/stores/useAppointmentStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Pill, FlaskConical, Stethoscope, FileText, Calendar } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: FileText },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'labs', label: 'Labs', icon: FlaskConical },
  { id: 'visits', label: 'Visit History', icon: Stethoscope },
];

export default function PatientChart() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const patient = usePatientStore(s => s.patients[id || '']);
  const encounters = useEncounterStore(s => s.getByPatient(id || ''));
  const labs = useLabStore(s => s.getByPatient(id || ''));
  const upcoming = useAppointmentStore(s => s.getUpcoming(id || '', 3));

  if (!patient) return <div className="p-8 text-center text-[var(--text-muted)]">Patient not found</div>;

  const vitalsData = encounters.filter(e => e.vitalSigns).slice(0, 5).reverse().map(e => ({
    date: e.encounterDate,
    bp: e.vitalSigns?.bloodPressureSystolic,
    weight: e.vitalSigns?.weight,
    hr: e.vitalSigns?.heartRate,
  }));

  return (
    <div className="space-y-4">
      {patient.allergies.some(a => a.status === 'active') && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-sm text-red-800 font-medium">
            ALLERGIES: {patient.allergies.filter(a => a.status === 'active').map(a => `${a.substance} (${a.reaction})`).join(' · ')}
          </div>
        </div>
      )}

      <div className="bg-white border border-[var(--border)] rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{patient.lastName}, {patient.firstName} {patient.preferredName ? `(${patient.preferredName})` : ''}</h1>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {patient.mrn} · DOB: {patient.dateOfBirth} · {patient.gender === 'female' ? 'F' : patient.gender === 'male' ? 'M' : 'NB'} · {patient.primaryProvider}
            </div>
          </div>
          <div className="text-sm text-[var(--text-secondary)] text-right">
            <div>Insurance: {patient.insuranceCarrier} — {patient.insurancePlan}</div>
            <div>Balance: ${patient.balanceOwed.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-[var(--brand-mid)] text-[var(--brand-mid)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Active Diagnoses</h3>
              <div className="space-y-2">
                {patient.activeDiagnoses.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-lg">
                    <div><span className="font-code text-sm font-semibold text-[var(--brand-text)]">{d.code}</span> <span className="text-sm text-[var(--text-secondary)] ml-2">{d.description}</span></div>
                    {d.onsetDate && <span className="text-xs text-[var(--text-muted)]">Onset {d.onsetDate}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Vital Sign Trends</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bp" stroke="var(--brand-mid)" name="Systolic BP" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="weight" stroke="#059669" name="Weight (lbs)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Recent Visits</h3>
              <div className="space-y-2">
                {encounters.slice(0, 3).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{e.encounterDate} · {e.encounterTime}</div>
                      <div className="text-xs text-[var(--text-muted)]">{e.chiefComplaint}</div>
                    </div>
                    <button onClick={() => navigate(`/encounters/${e.id}/soap`)} className="text-xs text-[var(--brand-mid)] hover:underline">View Note</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3">Current Medications</h3>
              <div className="space-y-2">
                {patient.currentMedications.filter(m => m.status === 'active').map(m => (
                  <div key={m.id} className="text-sm border-l-2 border-emerald-500 pl-3 py-1">
                    <div className="font-medium">{m.medicationName} {m.strength}</div>
                    <div className="text-xs text-[var(--text-muted)]">{m.sig}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/prescriptions')} className="mt-3 text-xs text-[var(--brand-mid)] hover:underline">Manage prescriptions</button>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3">Upcoming Appointments</h3>
              {upcoming.length > 0 ? upcoming.map(a => (
                <div key={a.id} className="flex items-center gap-2 text-sm py-1"><Calendar className="w-4 h-4 text-[var(--brand-mid)]" /> {a.scheduledDate} {a.scheduledTime} — {a.appointmentTypeLabel}</div>
              )) : <div className="text-xs text-[var(--text-muted)]">No upcoming appointments</div>}
            </div>

            <div className="bg-white border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3">Preventive Care</h3>
              {patient.preventiveHealth.map(ph => (
                <div key={ph.id} className={`text-xs py-1 flex items-center justify-between ${ph.status === 'overdue' ? 'text-red-600 font-medium' : 'text-[var(--text-secondary)]'}`}>
                  <span>{ph.name}</span>
                  <span className="capitalize">{ph.status.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'medications' && (
        <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">Medication</th><th className="text-left px-5 py-3">Strength</th><th className="text-left px-5 py-3">SIG</th><th className="text-left px-5 py-3">Indication</th><th className="text-left px-5 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {patient.currentMedications.map(m => (
                <tr key={m.id} className={m.status === 'discontinued' ? 'opacity-50 line-through' : ''}>
                  <td className="px-5 py-3 font-medium">{m.medicationName}</td>
                  <td className="px-5 py-3">{m.strength}</td>
                  <td className="px-5 py-3">{m.sig}</td>
                  <td className="px-5 py-3">{m.indication}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${m.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'}`}>{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'labs' && (
        <div className="space-y-4">
          {labs.map(lab => (
            <div key={lab.id} className={`bg-white border rounded-xl p-5 ${lab.hasCritical ? 'border-red-300' : lab.hasAbnormal ? 'border-amber-300' : 'border-[var(--border)]'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-sm">{lab.testPanel} <span className="text-[var(--text-muted)] font-normal ml-2">{lab.resultDate}</span></div>
                <button onClick={() => navigate(`/labs`)} className="text-xs text-[var(--brand-mid)] hover:underline">View Detail</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {lab.components.map(c => (
                  <div key={c.id} className={`p-3 rounded-lg border ${c.valueStatus.includes('critical') ? 'bg-red-50 border-red-200' : c.valueStatus === 'high' || c.valueStatus === 'low' ? 'bg-amber-50 border-amber-200' : 'bg-[var(--bg-subtle)] border-[var(--border)]'}`}>
                    <div className="text-xs text-[var(--text-muted)]">{c.testName}</div>
                    <div className={`text-lg font-code font-semibold ${c.valueStatus.includes('critical') ? 'text-red-700' : c.valueStatus === 'high' || c.valueStatus === 'low' ? 'text-amber-700' : 'text-[var(--text-primary)]'}`}>{c.value} <span className="text-xs font-normal text-[var(--text-muted)]">{c.unit}</span></div>
                    <div className="text-[10px] text-[var(--text-muted)]">Ref: {c.referenceRangeLow}-{c.referenceRangeHigh}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">Date</th><th className="text-left px-5 py-3">Type</th><th className="text-left px-5 py-3">Chief Complaint</th><th className="text-left px-5 py-3">Provider</th><th className="text-left px-5 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {encounters.map(e => (
                <tr key={e.id} className="hover:bg-[var(--bg-subtle)]">
                  <td className="px-5 py-3">{e.encounterDate}</td>
                  <td className="px-5 py-3 capitalize">{e.encounterType.replace('-', ' ')}</td>
                  <td className="px-5 py-3">{e.chiefComplaint}</td>
                  <td className="px-5 py-3">{e.providerName}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${e.status === 'signed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : e.status === 'in-progress' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}