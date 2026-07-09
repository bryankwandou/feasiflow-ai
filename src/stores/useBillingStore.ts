import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type ClaimStatus = 'draft' | 'ready-to-submit' | 'submitted' | 'accepted' | 'pending' | 'paid' | 'denied' | 'appealed' | 'partially-paid' | 'write-off';

export interface ServiceLine {
  id: string; cptCode: string; description: string; dateOfService: string; units: number;
  modifier?: string; chargeAmount: number; paidAmount?: number; adjustmentAmount?: number;
  patientAmount?: number; icd10Pointer: string; placeOfService: string; renderingProvider?: string;
}
export interface InsuranceClaim {
  id: string; claimNumber?: string; patientId: string; patientName: string; encounterId: string;
  providerId: string; providerNPI: string; providerName: string; practiceNPI: string; practiceName: string;
  insuranceCarrier: string; memberId: string; groupNumber: string; subscriberName: string; subscriberDOB: string;
  dateOfService: string; dateSubmitted?: string; icd10Codes: string[]; serviceLines: ServiceLine[];
  totalCharges: number; insurancePayment?: number; patientResponsibility?: number; adjustments?: number; balance: number;
  status: ClaimStatus; denialReason?: string; denialCode?: string; appealDeadline?: string; appealNotes?: string;
  aiDenialAnalysis?: string; aiAppealLetter?: string; submittedAt?: number; paidAt?: number; era?: string; notes: string;
  createdAt: number; updatedAt: number;
}

interface BillingStore {
  claims: Record<string, InsuranceClaim>;
  addClaim: (c: Omit<InsuranceClaim, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateClaim: (id: string, patch: Partial<InsuranceClaim>) => void;
  submitClaim: (id: string) => void;
  recordPayment: (id: string, ins: number, pat: number, adj: number) => void;
  recordDenial: (id: string, reason: string, code: string, appealDeadline: string) => void;
  getByPatient: (patientId: string) => InsuranceClaim[];
  getDenied: () => InsuranceClaim[];
  getPending: () => InsuranceClaim[];
  getMonthlyRevenue: (months: number) => { period: string; billed: number; collected: number }[];
  getDenialRateByCode: () => Record<string, number>;
  getTotalARByAging: () => { '0-30': number; '31-60': number; '61-90': number; '90+': number };
}

export const useBillingStore = create<BillingStore>()(persist(immer((set, get) => ({
  claims: {},
  addClaim: (c) => { const id = `claim_${Date.now()}_${Math.random().toString(36).slice(2,5)}`; set(s => { s.claims[id] = { ...c, id, createdAt: Date.now(), updatedAt: Date.now() }; }); return id; },
  updateClaim: (id, patch) => set(s => { if (s.claims[id]) { Object.assign(s.claims[id], patch); s.claims[id].updatedAt = Date.now(); } }),
  submitClaim: (id) => set(s => { if (s.claims[id]) { s.claims[id].status = 'submitted'; s.claims[id].dateSubmitted = new Date().toISOString().split('T')[0]; s.claims[id].submittedAt = Date.now(); s.claims[id].updatedAt = Date.now(); } }),
  recordPayment: (id, ins, pat, adj) => set(s => { const c = s.claims[id]; if (c) { c.insurancePayment = ins; c.patientResponsibility = pat; c.adjustments = adj; c.balance = c.totalCharges - ins - adj; c.status = c.balance <= 0 ? 'paid' : 'partially-paid'; c.paidAt = Date.now(); c.updatedAt = Date.now(); } }),
  recordDenial: (id, reason, code, deadline) => set(s => { if (s.claims[id]) { s.claims[id].status = 'denied'; s.claims[id].denialReason = reason; s.claims[id].denialCode = code; s.claims[id].appealDeadline = deadline; s.claims[id].updatedAt = Date.now(); } }),
  getByPatient: (pid) => Object.values(get().claims).filter(c => c.patientId === pid),
  getDenied: () => Object.values(get().claims).filter(c => c.status === 'denied'),
  getPending: () => Object.values(get().claims).filter(c => ['submitted', 'accepted', 'pending'].includes(c.status)),
  getMonthlyRevenue: (months) => {
    const claims = Object.values(get().claims); const result = [];
    for (let i = months - 1; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); const period = d.toISOString().slice(0, 7); const pc = claims.filter(c => c.dateOfService?.startsWith(period)); result.push({ period, billed: pc.reduce((s, c) => s + (c.totalCharges ?? 0), 0), collected: pc.reduce((s, c) => s + (c.insurancePayment ?? 0) + (c.patientResponsibility ?? 0), 0) }); }
    return result;
  },
  getDenialRateByCode: () => Object.values(get().claims).filter(c => c.status === 'denied').reduce((acc, c) => { const code = c.denialCode ?? 'Unknown'; acc[code] = (acc[code] ?? 0) + 1; return acc; }, {} as Record<string, number>),
  getTotalARByAging: () => { const now = Date.now(); const r = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }; Object.values(get().claims).filter(c => c.balance > 0 && c.submittedAt).forEach(c => { const days = Math.floor((now - c.submittedAt!) / 86400000); if (days <= 30) r['0-30'] += c.balance; else if (days <= 60) r['31-60'] += c.balance; else if (days <= 90) r['61-90'] += c.balance; else r['90+'] += c.balance; }); return r; },
})), { name: 'clinicflow-billing' }));
