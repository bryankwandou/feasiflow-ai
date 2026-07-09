import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UIStore {
  sidebarCollapsed: boolean; darkMode: boolean; commandPaletteOpen: boolean;
  selectedProvider: string; practiceName: string;
  toggleSidebar: () => void; toggleDarkMode: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSelectedProvider: (name: string) => void;
}

export const useUIStore = create<UIStore>()(persist(immer((set) => ({
  sidebarCollapsed: false, darkMode: false, commandPaletteOpen: false,
  selectedProvider: 'Dr. Sarah Chen', practiceName: 'Riverside Family Medicine',
  toggleSidebar: () => set(s => { s.sidebarCollapsed = !s.sidebarCollapsed; }),
  toggleDarkMode: () => set(s => { s.darkMode = !s.darkMode; }),
  setCommandPaletteOpen: (open) => set(s => { s.commandPaletteOpen = open; }),
  setSelectedProvider: (name) => set(s => { s.selectedProvider = name; }),
})), { name: 'clinicflow-ui' }));
