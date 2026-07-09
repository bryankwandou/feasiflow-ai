import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type LabResultStatus = 'pending' | 'resulted' | 'reviewed' | 'acknowledged';
export type LabValueStatus = 'normal' | 'high' | 'low' | 'critical-high' | 'critical-low' | 'abnormal' | 'not-reported';

export interface LabComponent {
  id: string; testName: string; loincCode?: string; value: string; unit: string;
  referenceRangeLow?: number; referenceRangeHigh?: number; referenceRangeText?: string;
  valueStatus: LabValueStatus; criticalLow?: number; criticalHigh?: number; footnotes?: string;
}
export interface LabResult {
  id: string; patientId: string; patientName: string; encounterId?: string; orderId?: string;
  testPanel: string; orderingProvider: string; orderedDate: string; collectedDate?: string; resultDate?: string;
  lab: string; accessionNumber?: string; components: LabComponent[]; interpretation?: string; labComments?: string;
  status: LabResultStatus; hasAbnormal: boolean; hasCritical: boolean; reviewedBy?: string; reviewedAt?: number; reviewNotes?: string;
  aiInterpretation?: string; aiRecommendations?: string[]; reportedAt: number; createdAt: number;
}

interface LabStore {
  results: Record<string, LabResult>;
  addResult: (r: Omit<LabResult, 'id' | 'createdAt' | 'hasAbnormal' | 'hasCritical'>) => string;
  updateResult: (id: string, patch: Partial<LabResult>) => void;
  reviewResult: (id: string, reviewerName: string, notes?: string) => void;
  acknowledgeResult: (id: string) => void;
  getByPatient: (patientId: string) => LabResult[];
  getCriticalResults: () => LabResult[];
  getPendingReview: () => LabResult[];
  getResultsByTest: (patientId: string, testName: string) => LabResult[];
}

export const useLabStore = create<LabStore>()(persist(immer((set, get) => ({
  results: {},
  addResult: (r) => {
    const id = `lab_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
    const hasCritical = r.components.some(c => c.valueStatus === 'critical-high' || c.valueStatus === 'critical-low');
    const hasAbnormal = r.components.some(c => !['normal', 'not-reported'].includes(c.valueStatus));
    set(s => { s.results[id] = { ...r, id, hasAbnormal, hasCritical, createdAt: Date.now() }; });
    return id;
  },
  updateResult: (id, patch) => set(s => { if (s.results[id]) Object.assign(s.results[id], patch); }),
  reviewResult: (id, reviewerName, notes) => set(s => { if (s.results[id]) { s.results[id].status = 'reviewed'; s.results[id].reviewedBy = reviewerName; s.results[id].reviewedAt = Date.now(); if (notes) s.results[id].reviewNotes = notes; } }),
  acknowledgeResult: (id) => set(s => { if (s.results[id]) s.results[id].status = 'acknowledged'; }),
  getByPatient: (pid) => Object.values(get().results).filter(r => r.patientId === pid).sort((a, b) => b.reportedAt - a.reportedAt),
  getCriticalResults: () => Object.values(get().results).filter(r => r.hasCritical && r.status !== 'acknowledged'),
  getPendingReview: () => Object.values(get().results).filter(r => r.status === 'resulted'),
  getResultsByTest: (pid, testName) => Object.values(get().results).filter(r => r.patientId === pid && r.components.some(c => c.testName.toLowerCase().includes(testName.toLowerCase()))).sort((a, b) => b.reportedAt - a.reportedAt),
})), { name: 'clinicflow-labs' }));
