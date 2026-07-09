import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type AppointmentType = 'new-patient' | 'follow-up' | 'annual-physical' | 'urgent-care' | 'preventive-care' | 'procedure' | 'telehealth' | 'mental-health' | 'chronic-disease-management' | 'pre-op' | 'post-op' | 'wound-check' | 'injection' | 'lab-review' | 'consult';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';

export interface Appointment {
  id: string; patientId: string; patientName: string; providerId: string; providerName: string;
  appointmentType: AppointmentType; appointmentTypeLabel: string; status: AppointmentStatus;
  scheduledDate: string; scheduledTime: string; durationMinutes: number; roomNumber?: string;
  chiefComplaint: string; visitReason: string; isFirstVisit: boolean; isUrgent: boolean; telehealth: boolean; telehealthLink?: string;
  confirmationSent: boolean; reminderSent: boolean; intakeForms: boolean; preVisitInstructions?: string;
  checkedInAt?: number; roomAssignedAt?: number; providerNotifiedAt?: number;
  encounterId?: string; followUpNeeded: boolean; followUpInterval?: string; followUpScheduled: boolean;
  insuranceVerified: boolean; copayCollected?: number; copayAmount?: number;
  notes: string; cancellationReason?: string; rescheduledFrom?: string; createdAt: number; updatedAt: number;
}

interface AppointmentStore {
  appointments: Record<string, Appointment>;
  addAppointment: (a: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  cancelAppointment: (id: string, reason: string) => void;
  checkIn: (id: string) => void;
  startEncounter: (id: string, encounterId: string) => void;
  completeAppointment: (id: string) => void;
  getTodayAppointments: () => Appointment[];
  getByPatient: (patientId: string) => Appointment[];
  getByProvider: (providerId: string, date?: string) => Appointment[];
  getUpcoming: (patientId: string, limit?: number) => Appointment[];
}

export const useAppointmentStore = create<AppointmentStore>()(persist(immer((set, get) => ({
  appointments: {},
  addAppointment: (a) => {
    const id = `appt_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
    set(s => { s.appointments[id] = { ...a, id, createdAt: Date.now(), updatedAt: Date.now() }; });
    return id;
  },
  updateAppointment: (id, patch) => set(s => { if (s.appointments[id]) { Object.assign(s.appointments[id], patch); s.appointments[id].updatedAt = Date.now(); } }),
  cancelAppointment: (id, reason) => set(s => { if (s.appointments[id]) { s.appointments[id].status = 'cancelled'; s.appointments[id].cancellationReason = reason; s.appointments[id].updatedAt = Date.now(); } }),
  checkIn: (id) => set(s => { if (s.appointments[id]) { s.appointments[id].status = 'arrived'; s.appointments[id].checkedInAt = Date.now(); s.appointments[id].updatedAt = Date.now(); } }),
  startEncounter: (id, eid) => set(s => { if (s.appointments[id]) { s.appointments[id].status = 'in-progress'; s.appointments[id].encounterId = eid; s.appointments[id].roomAssignedAt = Date.now(); s.appointments[id].updatedAt = Date.now(); } }),
  completeAppointment: (id) => set(s => { if (s.appointments[id]) { s.appointments[id].status = 'completed'; s.appointments[id].updatedAt = Date.now(); } }),
  getTodayAppointments: () => {
    const today = new Date().toISOString().split('T')[0];
    return Object.values(get().appointments).filter(a => a.scheduledDate === today).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  },
  getByPatient: (pid) => Object.values(get().appointments).filter(a => a.patientId === pid).sort((a, b) => `${b.scheduledDate} ${b.scheduledTime}`.localeCompare(`${a.scheduledDate} ${a.scheduledTime}`)),
  getByProvider: (pid, date) => Object.values(get().appointments).filter(a => a.providerId === pid && (!date || a.scheduledDate === date)).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
  getUpcoming: (pid, limit = 5) => {
    const today = new Date().toISOString().split('T')[0];
    return Object.values(get().appointments).filter(a => a.patientId === pid && a.scheduledDate >= today && a.status === 'scheduled').sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)).slice(0, limit);
  },
})), { name: 'clinicflow-appointments' }));
