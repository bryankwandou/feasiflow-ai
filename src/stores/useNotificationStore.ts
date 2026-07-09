import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Notification {
  id: string; type: 'critical-lab' | 'lab-result' | 'claim-denial' | 'task' | 'message' | 'refill' | 'referral' | 'appointment';
  title: string; description: string; patientId?: string; patientName?: string; relatedId?: string;
  read: boolean; acknowledged: boolean; priority: 'urgent' | 'high' | 'normal' | 'low'; createdAt: number;
}

interface NotificationStore {
  notifications: Record<string, Notification>;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read' | 'acknowledged'>) => string;
  markRead: (id: string) => void;
  acknowledge: (id: string) => void;
  dismiss: (id: string) => void;
  getUnread: () => Notification[];
  getUrgent: () => Notification[];
  getByPatient: (patientId: string) => Notification[];
}

export const useNotificationStore = create<NotificationStore>()(persist(immer((set, get) => ({
  notifications: {},
  addNotification: (n) => { const id = `notif_${Date.now()}`; set(s => { s.notifications[id] = { ...n, id, read: false, acknowledged: false, createdAt: Date.now() }; }); return id; },
  markRead: (id) => set(s => { if (s.notifications[id]) s.notifications[id].read = true; }),
  acknowledge: (id) => set(s => { if (s.notifications[id]) { s.notifications[id].acknowledged = true; s.notifications[id].read = true; } }),
  dismiss: (id) => set(s => { delete s.notifications[id]; }),
  getUnread: () => Object.values(get().notifications).filter(n => !n.read).sort((a, b) => b.createdAt - a.createdAt),
  getUrgent: () => Object.values(get().notifications).filter(n => n.priority === 'urgent' && !n.acknowledged).sort((a, b) => b.createdAt - a.createdAt),
  getByPatient: (pid) => Object.values(get().notifications).filter(n => n.patientId === pid).sort((a, b) => b.createdAt - a.createdAt),
})), { name: 'clinicflow-notifications' }));
