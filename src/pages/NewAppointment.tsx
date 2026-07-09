import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppointmentStore } from '@/stores/useAppointmentStore';
import { usePatientStore } from '@/stores/usePatientStore';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patients = usePatientStore((s) => Object.values(s.patients));
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const [form, setForm] = useState({
    patientId: searchParams.get('patient') || '',
    providerId: 'prov_chen',
    providerName: 'Dr. Sarah Chen',
    appointmentType: 'follow-up' as const,
    appointmentTypeLabel: 'Follow-up visit',
    status: 'scheduled' as const,
    scheduledDate: searchParams.get('date') || '2024-12-12',
    scheduledTime: searchParams.get('time') || '09:00',
    durationMinutes: 30,
    chiefComplaint: '',
    visitReason: '',
    isFirstVisit: false,
    isUrgent: false,
    telehealth: false,
    confirmationSent: false,
    reminderSent: false,
    intakeForms: false,
    followUpNeeded: false,
    followUpScheduled: false,
    insuranceVerified: false,
    notes: '',
  });

  const selectedPatient = patients.find((p) => p.id === form.patientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error('Select a patient'); return; }
    const id = addAppointment({
      ...form,
      patientName: `${selectedPatient.lastName}, ${selectedPatient.firstName}`,
    } as any);
    toast.success('Appointment scheduled');
    navigate('/schedule');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/schedule')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold">Book Appointment</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[var(--border)] p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Patient</label>
          <select required value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
            <option value="">Select patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} ({p.mrn})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input required type="date" value={form.scheduledDate} onChange={e => setForm({...form, scheduledDate: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input required type="time" value={form.scheduledTime} onChange={e => setForm({...form, scheduledTime: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (min)</label>
            <select value={form.durationMinutes} onChange={e => setForm({...form, durationMinutes: Number(e.target.value)})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={form.appointmentType} onChange={e => setForm({...form, appointmentType: e.target.value as any})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
              <option value="new-patient">New Patient</option>
              <option value="follow-up">Follow-up</option>
              <option value="annual-physical">Annual Physical</option>
              <option value="urgent-care">Urgent Care</option>
              <option value="telehealth">Telehealth</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Chief Complaint</label>
          <input value={form.chiefComplaint} onChange={e => setForm({...form, chiefComplaint: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isUrgent} onChange={e => setForm({...form, isUrgent: e.target.checked})} /> Urgent</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.telehealth} onChange={e => setForm({...form, telehealth: e.target.checked})} /> Telehealth</label>
        </div>
        <button type="submit" className="flex items-center gap-1.5 bg-[var(--brand-mid)] text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Save className="w-4 h-4" /> Schedule Appointment
        </button>
      </form>
    </div>
  );
}
