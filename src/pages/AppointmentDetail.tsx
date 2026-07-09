import { useParams, useNavigate } from 'react-router-dom';
import { useAppointmentStore } from '@/stores/useAppointmentStore';
import { useEncounterStore } from '@/stores/useEncounterStore';
import { toast } from 'sonner';
import { ArrowLeft, Play, CheckCircle, XCircle } from 'lucide-react';

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appt = useAppointmentStore((s) => (id ? s.appointments[id] : undefined));
  const updateAppointment = useAppointmentStore((s) => s.updateAppointment);
  const checkIn = useAppointmentStore((s) => s.checkIn);
  const completeAppointment = useAppointmentStore((s) => s.completeAppointment);
  const createEncounter = useEncounterStore((s) => s.createEncounter);

  if (!appt) return <div>Appointment not found</div>;

  const startVisit = () => {
    const encId = createEncounter({
      patientId: appt.patientId,
      patientName: appt.patientName,
      appointmentId: appt.id,
      providerId: appt.providerId,
      providerName: appt.providerName,
      encounterType: appt.telehealth ? 'telehealth' : 'office-visit',
      status: 'in-progress',
      encounterDate: appt.scheduledDate,
      encounterTime: appt.scheduledTime,
      durationMinutes: appt.durationMinutes,
      chiefComplaint: appt.chiefComplaint,
      visitReason: appt.visitReason,
    });
    updateAppointment(appt.id, { encounterId: encId, status: 'in-progress' });
    toast.success('Visit started');
    navigate(`/encounters/${encId}/soap`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/schedule')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold">Appointment Detail</h1>
      </div>
      <div className="bg-white rounded-lg border border-[var(--border)] p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-[var(--text-muted)]">Patient:</span> <span className="font-medium">{appt.patientName}</span></div>
          <div><span className="text-[var(--text-muted)]">Date:</span> <span className="font-medium">{appt.scheduledDate}</span></div>
          <div><span className="text-[var(--text-muted)]">Time:</span> <span className="font-medium">{appt.scheduledTime}</span></div>
          <div><span className="text-[var(--text-muted)]">Duration:</span> <span className="font-medium">{appt.durationMinutes} min</span></div>
          <div><span className="text-[var(--text-muted)]">Type:</span> <span className="font-medium">{appt.appointmentTypeLabel}</span></div>
          <div><span className="text-[var(--text-muted)]">Provider:</span> <span className="font-medium">{appt.providerName}</span></div>
          <div><span className="text-[var(--text-muted)]">Status:</span> <span className="font-medium">{appt.status}</span></div>
          <div><span className="text-[var(--text-muted)]">Room:</span> <span className="font-medium">{appt.roomNumber || '—'}</span></div>
        </div>
        <div className="pt-4 border-t border-[var(--border)] flex gap-2">
          {appt.status === 'scheduled' && (
            <button onClick={() => { checkIn(appt.id); toast.success('Patient checked in'); }} className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4" /> Check In
            </button>
          )}
          {(appt.status === 'arrived' || appt.status === 'scheduled') && (
            <button onClick={startVisit} className="flex items-center gap-1.5 bg-[var(--brand-mid)] text-white px-3 py-1.5 rounded-lg text-sm">
              <Play className="w-4 h-4" /> Start Visit
            </button>
          )}
          {appt.status === 'in-progress' && (
            <button onClick={() => { completeAppointment(appt.id); toast.success('Appointment completed'); }} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4" /> Complete
            </button>
          )}
          <button onClick={() => { updateAppointment(appt.id, { status: 'cancelled' }); toast.success('Appointment cancelled'); }} className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm">
            <XCircle className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
