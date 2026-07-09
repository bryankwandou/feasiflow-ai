import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface EducationMaterial {
  id: string; title: string; condition: string; readingLevel: string; language: string;
  content: string; fullHandoutText: string; createdAt: number; updatedAt: number;
}

interface EducationStore {
  materials: Record<string, EducationMaterial>;
  addMaterial: (m: Omit<EducationMaterial, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateMaterial: (id: string, patch: Partial<EducationMaterial>) => void;
  getByCondition: (condition: string) => EducationMaterial[];
}

export const useEducationStore = create<EducationStore>()(persist(immer((set, get) => ({
  materials: {},
  addMaterial: (m) => { const id = `edu_${Date.now()}`; set(s => { s.materials[id] = { ...m, id, createdAt: Date.now(), updatedAt: Date.now() }; }); return id; },
  updateMaterial: (id, patch) => set(s => { if (s.materials[id]) { Object.assign(s.materials[id], patch); s.materials[id].updatedAt = Date.now(); } }),
  getByCondition: (c) => Object.values(get().materials).filter(m => m.condition.toLowerCase().includes(c.toLowerCase())),
})), { name: 'clinicflow-education' }));
