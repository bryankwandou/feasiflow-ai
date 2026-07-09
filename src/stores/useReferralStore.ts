import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Referral {
  id: string; referralNumber: string; patientId: string; patientName: string; patientDOB: string; patientInsurance: string; patientMemberId: string; encounterId?: string;
  referringProvider: string; referringNPI: string; referringPractice: string; referringPhone: string; referringFax: string;
  specialistName: string; specialistSpecialty: string; specialistNPI?: string; specialistPractice: string; specialistPhone: string; specialistFax: string; specialistAddress: string;
  referralReason: string; primaryDiagnosis: string; secondaryDiagnoses: string[]; clinicalSummary: string; urgency: 'routine' | 'urgent' | 'emergent';
  authorizationRequired: boolean; authorizationNumber?: string; authorizationStatus?: 'pending' | 'approved' | 'denied'; visitsAuthorized?: number;
  referralLetter: string; aiGeneratedLetter: boolean; attachedRecords: string[];
  status: 'draft' | 'sent' | 'received' | 'appointment-scheduled' | 'completed' | 'cancelled';
  sentDate?: string; sentMethod?: 'fax' | 'electronic' | 'patient'; appointmentDate?: string; consultNoteReceived: boolean; consultNoteDate?: string; consultNoteSummary?: string; aiConsultSummary?: string;
  notes: string; createdAt: number; updatedAt: number;
}

interface ReferralStore {
  referrals: Record<string, Referral>; refCounter: number;
  addReferral: (r: Omit<Referral, 'id' | 'referralNumber' | 'createdAt' | 'updatedAt'>) => string;
  updateReferral: (id: string, patch: Partial<Referral>) => void;
  getByPatient: (patientId: string) => Referral[];
  getPending: () => Referral[];
  getAwaitingConsultNote: () => Referral[];
}

export const useReferralStore = create<ReferralStore>()(persist(immer((set, get) => ({
  referrals: {}, refCounter: 1000,
  addReferral: (r) => { const counter = get().refCounter + 1; const id = `ref_${Date.now()}`; const referralNumber = `REF-${String(counter).padStart(6, '0')}`; set(s => { s.refCounter = counter; s.referrals[id] = { ...r, id, referralNumber, createdAt: Date.now(), updatedAt: Date.now() }; }); return id; },
  updateReferral: (id, patch) => set(s => { if (s.referrals[id]) { Object.assign(s.referrals[id], patch); s.referrals[id].updatedAt = Date.now(); } }),
  getByPatient: (pid) => Object.values(get().referrals).filter(r => r.patientId === pid),
  getPending: () => Object.values(get().referrals).filter(r => ['draft', 'sent'].includes(r.status)),
  getAwaitingConsultNote: () => Object.values(get().referrals).filter(r => r.status === 'completed' && !r.consultNoteReceived),
})), { name: 'clinicflow-referrals' }));
