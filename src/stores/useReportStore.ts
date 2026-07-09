import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Report {
  id: string; title: string; type: string; content: string; generatedAt: number; aiGenerated: boolean;
}

interface ReportStore {
  reports: Record<string, Report>;
  addReport: (r: Omit<Report, 'id' | 'generatedAt'>) => string;
  getByType: (type: string) => Report[];
}

export const useReportStore = create<ReportStore>()(persist(immer((set, get) => ({
  reports: {},
  addReport: (r) => { const id = `report_${Date.now()}`; set(s => { s.reports[id] = { ...r, id, generatedAt: Date.now() }; }); return id; },
  getByType: (t) => Object.values(get().reports).filter(r => r.type === t).sort((a, b) => b.generatedAt - a.generatedAt),
})), { name: 'clinicflow-reports' }));
