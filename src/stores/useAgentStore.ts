import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface ClinicalAgent {
  id: string; name: string; description: string; icon: string; specialty: string;
  avgDurationSec: number; avgTokens: number; timesRun: number; enabled: boolean;
  outputFormat: string; systemPrompt: string;
}
export interface AgentExecution {
  id: string; agentId: string; patientId?: string; encounterId?: string; input: string; output: string;
  tokensUsed: number; durationMs: number; status: 'success' | 'error' | 'pending'; createdAt: number;
}

interface AgentStore {
  agents: Record<string, ClinicalAgent>;
  executions: Record<string, AgentExecution>;
  setAgents: (agents: Record<string, ClinicalAgent>) => void;
  updateAgent: (id: string, patch: Partial<ClinicalAgent>) => void;
  addExecution: (e: Omit<AgentExecution, 'id' | 'createdAt'>) => string;
  getExecutionsByAgent: (agentId: string) => AgentExecution[];
  getExecutionsByPatient: (patientId: string) => AgentExecution[];
}

export const useAgentStore = create<AgentStore>()(persist(immer((set, get) => ({
  agents: {}, executions: {},
  setAgents: (agents) => set(s => { s.agents = agents; }),
  updateAgent: (id, patch) => set(s => { if (s.agents[id]) Object.assign(s.agents[id], patch); }),
  addExecution: (e) => { const id = `exec_${Date.now()}`; set(s => { s.executions[id] = { ...e, id, createdAt: Date.now() }; if (s.agents[e.agentId]) s.agents[e.agentId].timesRun += 1; }); return id; },
  getExecutionsByAgent: (aid) => Object.values(get().executions).filter(e => e.agentId === aid).sort((a, b) => b.createdAt - a.createdAt),
  getExecutionsByPatient: (pid) => Object.values(get().executions).filter(e => e.patientId === pid).sort((a, b) => b.createdAt - a.createdAt),
})), { name: 'clinicflow-agents' }));
