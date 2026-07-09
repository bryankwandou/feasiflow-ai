import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'domestic-partner';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export interface Allergy {
  id: string; substance: string; allergyType: 'drug' | 'food' | 'environmental' | 'other';
  reaction: string; severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  status: 'active' | 'inactive' | 'unverified'; onsetDate?: string; enteredBy: string; enteredAt: number;
}
export interface MedicationEntry {
  id: string; medicationName: string; genericName?: string; strength: string; form: string;
  sig: string; prescribedBy: string; prescribedDate: string; daysSupply: number; refillsRemaining: number;
  nextRefillDate?: string; indication: string; status: 'active' | 'discontinued' | 'on-hold';
  discontinuedReason?: string; ndc?: string; rxNumber?: string;
}
export interface SocialHistory {
  smokingStatus: 'never' | 'former' | 'current' | 'unknown'; packYears?: number; quitDate?: string;
  alcoholUse: 'none' | 'social' | 'moderate' | 'heavy' | 'unknown'; drinksPerWeek?: number;
  substanceUse?: string; occupation?: string; employer?: string;
  exerciseFrequency?: 'none' | 'occasional' | 'regular' | 'daily'; dietType?: string;
  livingSituation?: string; educationLevel?: string;
}
export interface PreventiveHealthItem {
  id: string; name: string; category: 'screening' | 'immunization' | 'counseling';
  lastDone?: string; nextDue?: string; status: 'current' | 'overdue' | 'declined' | 'not-applicable'; notes?: string;
}
export interface Patient {
  id: string; mrn: string; firstName: string; lastName: string; preferredName?: string;
  dateOfBirth: string; gender: Gender; pronouns?: string; maritalStatus: MaritalStatus; ssn?: string;
  phone: string; phoneType: 'mobile' | 'home' | 'work'; email?: string; preferredContact: 'phone' | 'email' | 'mail';
  address1: string; address2?: string; city: string; state: string; zip: string;
  emergencyName: string; emergencyRelationship: string; emergencyPhone: string;
  insuranceCarrier: string; insurancePlan: string; memberId: string; groupNumber: string;
  subscriberName: string; subscriberDOB: string; subscriberRelationship: 'self' | 'spouse' | 'child' | 'other';
  copay?: number; deductibleMet?: number; deductibleTotal?: number;
  secondaryInsurance?: { carrier: string; memberId: string; groupNumber: string };
  primaryProvider: string; referringProvider?: string; bloodType: BloodType;
  preferredPharmacy: string; preferredPharmacyNPI?: string; language: string; interpreterNeeded: boolean;
  activeDiagnoses: { code: string; description: string; onsetDate?: string }[];
  allergies: Allergy[]; currentMedications: MedicationEntry[];
  pastSurgeries: { description: string; date?: string }[];
  familyHistory: { condition: string; relationship: string }[];
  socialHistory: SocialHistory; preventiveHealth: PreventiveHealthItem[];
  status: 'active' | 'inactive' | 'deceased'; firstVisitDate?: string; lastVisitDate?: string;
  nextAppointmentId?: string; totalVisits: number; balanceOwed: number; notes: string; tags: string[];
  createdAt: number; updatedAt: number;
}

interface PatientStore {
  patients: Record<string, Patient>;
  mrnCounter: number;
  addPatient: (p: Omit<Patient, 'id' | 'mrn' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'balanceOwed' | 'tags'>) => string;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  addAllergy: (patientId: string, allergy: Omit<Allergy, 'id'>) => void;
  updateAllergy: (patientId: string, allergyId: string, patch: Partial<Allergy>) => void;
  addMedication: (patientId: string, med: Omit<MedicationEntry, 'id'>) => void;
  updateMedication: (patientId: string, medId: string, patch: Partial<MedicationEntry>) => void;
  discontinueMedication: (patientId: string, medId: string, reason: string) => void;
  addDiagnosis: (patientId: string, diagnosis: { code: string; description: string; onsetDate?: string }) => void;
  searchPatients: (query: string) => Patient[];
  getByProvider: (providerName: string) => Patient[];
  getPatientsWithOverduePreventive: () => Patient[];
}

export const usePatientStore = create<PatientStore>()(persist(immer((set, get) => ({
  patients: {}, mrnCounter: 1000,
  addPatient: (p) => {
    const counter = get().mrnCounter + 1;
    const mrn = `MRN-${String(counter).padStart(6, '0')}`;
    const id = `pat_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
    set(s => { s.mrnCounter = counter; s.patients[id] = { ...p, id, mrn, totalVisits: 0, balanceOwed: 0, tags: [], createdAt: Date.now(), updatedAt: Date.now() }; });
    return id;
  },
  updatePatient: (id, patch) => set(s => { if (s.patients[id]) { Object.assign(s.patients[id], patch); s.patients[id].updatedAt = Date.now(); } }),
  addAllergy: (pid, a) => set(s => { if (s.patients[pid]) s.patients[pid].allergies.push({ ...a, id: `allergy_${Date.now()}` }); }),
  updateAllergy: (pid, aid, patch) => set(s => { const p = s.patients[pid]; if (p) { const i = p.allergies.findIndex(a => a.id === aid); if (i >= 0) Object.assign(p.allergies[i], patch); } }),
  addMedication: (pid, m) => set(s => { if (s.patients[pid]) s.patients[pid].currentMedications.push({ ...m, id: `med_${Date.now()}` }); }),
  updateMedication: (pid, mid, patch) => set(s => { const p = s.patients[pid]; if (p) { const i = p.currentMedications.findIndex(m => m.id === mid); if (i >= 0) Object.assign(p.currentMedications[i], patch); } }),
  discontinueMedication: (pid, mid, reason) => set(s => { const p = s.patients[pid]; if (p) { const m = p.currentMedications.find(m => m.id === mid); if (m) { m.status = 'discontinued'; m.discontinuedReason = reason; } } }),
  addDiagnosis: (pid, dx) => set(s => { const p = s.patients[pid]; if (p && !p.activeDiagnoses.some(d => d.code === dx.code)) p.activeDiagnoses.push(dx); }),
  searchPatients: (q) => {
    const query = q.toLowerCase().trim(); if (!query) return [];
    return Object.values(get().patients).filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) || p.mrn.toLowerCase().includes(query) || p.dateOfBirth.includes(query) || p.phone.includes(query)
    );
  },
  getByProvider: (name) => Object.values(get().patients).filter(p => p.primaryProvider === name),
  getPatientsWithOverduePreventive: () => Object.values(get().patients).filter(p => p.preventiveHealth.some(ph => ph.status === 'overdue')),
})), { name: 'clinicflow-patients' }));
