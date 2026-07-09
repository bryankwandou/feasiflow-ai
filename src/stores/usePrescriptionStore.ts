import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface DrugInteraction {
  id: string; interactingDrug: string; severity: 'contraindicated' | 'major' | 'moderate' | 'minor';
  mechanism: string; clinicalEffect: string; management: string; source: string; aiIdentified: boolean;
}
export interface Prescription {
  id: string; rxNumber: string; patientId: string; patientName: string; encounterId?: string;
  prescriberId: string; prescriberName: string; prescriberNPI: string; prescriberDEA?: string;
  medicationName: string; genericName: string; brandName?: string; ndc: string; strength: string;
  dosageForm: string; sig: string; quantity: number; unit: string; daysSupply: number; refills: number; refillsRemaining: number;
  indication: string; icd10Code?: string; substituteGeneric: boolean; isControlled: boolean; scheduleClass?: 'II' | 'III' | 'IV' | 'V';
  priorAuthRequired: boolean; priorAuthNumber?: string; interactionCheckPerformed: boolean; interactionCheckAt?: number; interactions: DrugInteraction[];
  pharmacyName: string; pharmacyNPI?: string; pharmacyAddress?: string; pharmacyPhone?: string; sentToPharmacy: boolean; sentAt?: number; sentMethod?: 'electronic' | 'fax' | 'phone' | 'paper';
  status: 'pending' | 'sent' | 'filled' | 'picked-up' | 'discontinued' | 'expired';
  writtenDate: string; expirationDate: string; lastFillDate?: string; nextRefillDate?: string; notes?: string; createdAt: number; updatedAt: number;
}

interface PrescriptionStore {
  prescriptions: Record<string, Prescription>; rxCounter: number;
  addPrescription: (rx: Omit<Prescription, 'id' | 'rxNumber' | 'createdAt' | 'updatedAt' | 'refillsRemaining' | 'interactionCheckPerformed' | 'interactions' | 'sentToPharmacy'>) => string;
  updatePrescription: (id: string, patch: Partial<Prescription>) => void;
  discontinue: (id: string, reason: string) => void;
  recordFill: (id: string) => void;
  addInteraction: (id: string, interaction: DrugInteraction) => void;
  getByPatient: (patientId: string) => Prescription[];
  getActiveByPatient: (patientId: string) => Prescription[];
  getControlledByPatient: (patientId: string) => Prescription[];
  checkRefillsDue: (days: number) => Prescription[];
}

export const usePrescriptionStore = create<PrescriptionStore>()(persist(immer((set, get) => ({
  prescriptions: {}, rxCounter: 10000,
  addPrescription: (rx) => { const counter = get().rxCounter + 1; const id = `rx_${Date.now()}_${Math.random().toString(36).slice(2,5)}`; const rxNumber = `RX-${String(counter).padStart(6, '0')}`; set(s => { s.rxCounter = counter; s.prescriptions[id] = { ...rx, id, rxNumber, refillsRemaining: rx.refills, interactionCheckPerformed: false, interactions: [], sentToPharmacy: false, createdAt: Date.now(), updatedAt: Date.now() }; }); return id; },
  updatePrescription: (id, patch) => set(s => { if (s.prescriptions[id]) { Object.assign(s.prescriptions[id], patch); s.prescriptions[id].updatedAt = Date.now(); } }),
  discontinue: (id, reason) => set(s => { if (s.prescriptions[id]) { s.prescriptions[id].status = 'discontinued'; s.prescriptions[id].notes = reason; s.prescriptions[id].updatedAt = Date.now(); } }),
  recordFill: (id) => set(s => { const rx = s.prescriptions[id]; if (rx && rx.refillsRemaining > 0) { rx.refillsRemaining -= 1; rx.lastFillDate = new Date().toISOString().split('T')[0]; const next = new Date(); next.setDate(next.getDate() + rx.daysSupply); rx.nextRefillDate = next.toISOString().split('T')[0]; rx.status = 'filled'; rx.updatedAt = Date.now(); } }),
  addInteraction: (id, interaction) => set(s => { if (s.prescriptions[id]) { s.prescriptions[id].interactions.push(interaction); s.prescriptions[id].interactionCheckPerformed = true; s.prescriptions[id].interactionCheckAt = Date.now(); } }),
  getByPatient: (pid) => Object.values(get().prescriptions).filter(rx => rx.patientId === pid).sort((a, b) => b.createdAt - a.createdAt),
  getActiveByPatient: (pid) => Object.values(get().prescriptions).filter(rx => rx.patientId === pid && rx.status !== 'discontinued' && rx.status !== 'expired'),
  getControlledByPatient: (pid) => Object.values(get().prescriptions).filter(rx => rx.patientId === pid && rx.isControlled),
  checkRefillsDue: (days) => { const threshold = new Date(); threshold.setDate(threshold.getDate() + days); const ts = threshold.toISOString().split('T')[0]; return Object.values(get().prescriptions).filter(rx => rx.status === 'filled' && rx.refillsRemaining > 0 && rx.nextRefillDate && rx.nextRefillDate <= ts); },
})), { name: 'clinicflow-prescriptions' }));
