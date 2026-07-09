import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type EncounterType = 'office-visit' | 'telehealth' | 'hospital' | 'urgent-care' | 'procedure';
export type EncounterStatus = 'in-progress' | 'documentation-pending' | 'complete' | 'signed' | 'amended';

export interface VitalSigns {
  bloodPressureSystolic?: number; bloodPressureDiastolic?: number; heartRate?: number;
  respiratoryRate?: number; temperature?: number; temperatureRoute?: 'oral' | 'rectal' | 'axillary' | 'tympanic';
  oxygenSaturation?: number; weight?: number; height?: number; bmi?: number; pain?: number;
  recordedAt: number; recordedBy: string;
}
export interface DiagnosisEntry {
  id: string; icd10Code: string; icd10Description: string;
  diagnosisType: 'primary' | 'secondary' | 'comorbidity' | 'rule-out';
  chronic: boolean; newDiagnosis: boolean; presentingProblem: boolean;
}
export interface CPTEntry {
  id: string; cptCode: string; cptDescription: string; units: number; modifier?: string;
  fee: number; aiSuggested: boolean; providerApproved: boolean;
}
export interface LabOrder {
  id: string; testName: string; loincCode?: string; cptCode: string;
  urgency: 'routine' | 'stat' | 'asap'; labName: string; icd10Indication: string;
  specialInstructions?: string; orderedAt: number; resultId?: string;
  status: 'ordered' | 'collected' | 'received' | 'resulted' | 'reviewed';
}
export interface ImagingOrder {
  id: string; studyType: string; cptCode: string; urgency: 'routine' | 'stat' | 'asap';
  facility: string; icd10Indication: string; clinicalHistory: string;
  specialInstructions?: string; orderedAt: number;
  status: 'ordered' | 'scheduled' | 'completed' | 'reported' | 'reviewed';
}
export interface SOAPNote {
  chiefComplaint: string; historyOfPresentIllness: string; reviewOfSystems: string;
  currentMedications: string; allergies: string; socialHistory: string; familyHistory: string;
  vitalSigns: string; physicalExamination: string; diagnosticResults: string;
  diagnoses: DiagnosisEntry[]; clinicalImpression: string;
  medications: string; orders: string; referrals: string; patientEducation: string;
  followUp: string; additionalInstructions: string;
  aiGenerated: boolean; aiGeneratedSections: string[]; providerEdited: boolean;
  signedBy?: string; signedAt?: number; lastEditedBy: string; lastEditedAt: number;
}
export interface Encounter {
  id: string; patientId: string; patientName: string; appointmentId?: string;
  providerId: string; providerName: string; encounterType: EncounterType; status: EncounterStatus;
  encounterDate: string; encounterTime: string; durationMinutes?: number;
  chiefComplaint: string; visitReason: string; vitalSigns?: VitalSigns; soapNote?: SOAPNote;
  icd10Codes: DiagnosisEntry[]; cptCodes: CPTEntry[];
  mdmLevel?: 'straightforward' | 'low' | 'moderate' | 'high'; codingStatus: 'uncoded' | 'ai-suggested' | 'provider-reviewed' | 'submitted';
  labOrders: LabOrder[]; imagingOrders: ImagingOrder[]; proceduresPerformed: string[];
  prescriptionIds: string[]; referralIds: string[]; claimId?: string; totalCharges?: number;
  billingStatus: 'unbilled' | 'coded' | 'submitted' | 'paid' | 'denied';
  internalNotes: string; providerNotes: string; createdAt: number; updatedAt: number;
}

interface EncounterStore {
  encounters: Record<string, Encounter>;
  createEncounter: (e: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt' | 'icd10Codes' | 'cptCodes' | 'labOrders' | 'imagingOrders' | 'proceduresPerformed' | 'prescriptionIds' | 'referralIds' | 'codingStatus' | 'billingStatus' | 'internalNotes' | 'providerNotes'>) => string;
  updateEncounter: (id: string, patch: Partial<Encounter>) => void;
  recordVitals: (id: string, vitals: VitalSigns) => void;
  updateSOAP: (id: string, soap: Partial<SOAPNote>) => void;
  addDiagnosis: (id: string, dx: DiagnosisEntry) => void;
  addCPT: (id: string, cpt: CPTEntry) => void;
  addLabOrder: (id: string, order: LabOrder) => void;
  addImagingOrder: (id: string, order: ImagingOrder) => void;
  signEncounter: (id: string, providerName: string) => void;
  getByPatient: (patientId: string) => Encounter[];
  getUnsigned: () => Encounter[];
  getUnbilled: () => Encounter[];
  getTodayEncounters: () => Encounter[];
}

export const useEncounterStore = create<EncounterStore>()(persist(immer((set, get) => ({
  encounters: {},
  createEncounter: (e) => {
    const id = `enc_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
    set(s => { s.encounters[id] = { ...e, id, icd10Codes: [], cptCodes: [], labOrders: [], imagingOrders: [], proceduresPerformed: [], prescriptionIds: [], referralIds: [], codingStatus: 'uncoded', billingStatus: 'unbilled', internalNotes: '', providerNotes: '', createdAt: Date.now(), updatedAt: Date.now() }; });
    return id;
  },
  updateEncounter: (id, patch) => set(s => { if (s.encounters[id]) { Object.assign(s.encounters[id], patch); s.encounters[id].updatedAt = Date.now(); } }),
  recordVitals: (id, vitals) => set(s => { if (s.encounters[id]) { if (vitals.weight && vitals.height) vitals.bmi = parseFloat(((703 * vitals.weight) / (vitals.height ** 2)).toFixed(1)); s.encounters[id].vitalSigns = vitals; s.encounters[id].updatedAt = Date.now(); } }),
  updateSOAP: (id, soap) => set(s => { if (s.encounters[id]) { if (!s.encounters[id].soapNote) s.encounters[id].soapNote = { chiefComplaint: '', historyOfPresentIllness: '', reviewOfSystems: '', currentMedications: '', allergies: '', socialHistory: '', familyHistory: '', vitalSigns: '', physicalExamination: '', diagnosticResults: '', diagnoses: [], clinicalImpression: '', medications: '', orders: '', referrals: '', patientEducation: '', followUp: '', additionalInstructions: '', aiGenerated: false, aiGeneratedSections: [], providerEdited: false, lastEditedBy: '', lastEditedAt: Date.now() }; Object.assign(s.encounters[id].soapNote!, soap); s.encounters[id].soapNote!.lastEditedAt = Date.now(); s.encounters[id].status = 'documentation-pending'; s.encounters[id].updatedAt = Date.now(); } }),
  addDiagnosis: (id, dx) => set(s => { if (s.encounters[id] && !s.encounters[id].icd10Codes.some(d => d.icd10Code === dx.icd10Code)) s.encounters[id].icd10Codes.push(dx); }),
  addCPT: (id, cpt) => set(s => { if (s.encounters[id]) s.encounters[id].cptCodes.push(cpt); }),
  addLabOrder: (id, order) => set(s => { if (s.encounters[id]) s.encounters[id].labOrders.push(order); }),
  addImagingOrder: (id, order) => set(s => { if (s.encounters[id]) s.encounters[id].imagingOrders.push(order); }),
  signEncounter: (id, providerName) => set(s => { if (s.encounters[id]) { s.encounters[id].status = 'signed'; if (s.encounters[id].soapNote) { s.encounters[id].soapNote!.signedBy = providerName; s.encounters[id].soapNote!.signedAt = Date.now(); s.encounters[id].soapNote!.providerEdited = true; } s.encounters[id].updatedAt = Date.now(); } }),
  getByPatient: (pid) => Object.values(get().encounters).filter(e => e.patientId === pid).sort((a, b) => `${b.encounterDate} ${b.encounterTime}`.localeCompare(`${a.encounterDate} ${a.encounterTime}`)),
  getUnsigned: () => Object.values(get().encounters).filter(e => ['in-progress', 'documentation-pending'].includes(e.status)),
  getUnbilled: () => Object.values(get().encounters).filter(e => e.billingStatus === 'unbilled' && e.status === 'signed'),
  getTodayEncounters: () => { const today = new Date().toISOString().split('T')[0]; return Object.values(get().encounters).filter(e => e.encounterDate === today).sort((a, b) => a.encounterTime.localeCompare(b.encounterTime)); },
})), { name: 'clinicflow-encounters' }));
