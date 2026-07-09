import { useParams } from 'react-router-dom';
import { useAgentStore } from '@/stores/useAgentStore';
import { useState } from 'react';
import { Bot, Play, Settings, CheckCircle, XCircle } from 'lucide-react';
import { callClaude } from '@/lib/claude';

export default function Agents() {
  const { agentId } = useParams();
  const { agents, addExecution } = useAgentStore();
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);

  const selectedAgent = agentId ? agents[agentId] : null;

  const runTest = async () => {
    if (!selectedAgent || !testInput) return;
    setTesting(true);
    const start = Date.now();
    try {
      const output = await callClaude(selectedAgent.systemPrompt, testInput, 1000);
      setTestOutput(output);
      addExecution({ agentId: selectedAgent.id, input: testInput, output, tokensUsed: 0, durationMs: Date.now() - start, status: 'success' });
    } catch (e: any) {
      setTestOutput(`Error: ${e.message}`);
      addExecution({ agentId: selectedAgent.id, input: testInput, output: e.message, tokensUsed: 0, durationMs: Date.now() - start, status: 'error' });
    }
    setTesting(false);
  };

  if (selectedAgent) {
    const agentExecutions = useAgentStore.getState().getExecutionsByAgent(selectedAgent.id);
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-[var(--ai)]" /> {selectedAgent.name}</h1>
        <div className="bg-white border border-[var(--border)] rounded-xl p-5">
          <div className="text-sm text-[var(--text-secondary)] mb-4">{selectedAgent.description}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-[var(--bg-subtle)] rounded-lg"><div className="text-xs text-[var(--text-muted)]">Avg Duration</div><div className="font-medium">{selectedAgent.avgDurationSec}s</div></div>
            <div className="p-3 bg-[var(--bg-subtle)] rounded-lg"><div className="text-xs text-[var(--text-muted)]">Avg Tokens</div><div className="font-medium">{selectedAgent.avgTokens}</div></div>
            <div className="p-3 bg-[var(--bg-subtle)] rounded-lg"><div className="text-xs text-[var(--text-muted)]">Times Run</div><div className="font-medium">{selectedAgent.timesRun}</div></div>
            <div className="p-3 bg-[var(--bg-subtle)] rounded-lg"><div className="text-xs text-[var(--text-muted)]">Status</div><div className={`font-medium ${selectedAgent.enabled ? 'text-emerald-600' : 'text-gray-500'}`}>{selectedAgent.enabled ? 'Enabled' : 'Disabled'}</div></div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Agent</label>
            <textarea value={testInput} onChange={e => setTestInput(e.target.value)} rows={4} placeholder="Enter patient context or clinical scenario..." className="w-full p-3 bg-[var(--bg-clinical)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--border-focus)]" />
            <button onClick={runTest} disabled={testing} className="flex items-center gap-2 bg-[var(--ai)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--ai-text)] disabled:opacity-50"><Play className="w-4 h-4" /> {testing ? 'Running...' : 'Run Test'}</button>
            {testOutput && <div className="mt-3 p-4 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-sm whitespace-pre-wrap font-clinical max-h-96 overflow-auto">{testOutput}</div>}
          </div>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] font-semibold text-sm">Recent Executions</div>
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs uppercase"><tr><th className="text-left px-5 py-3">Date</th><th className="text-left px-5 py-3">Input</th><th className="text-left px-5 py-3">Duration</th><th className="text-left px-5 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {agentExecutions.map(ex => (
                <tr key={ex.id}><td className="px-5 py-3 text-xs">{new Date(ex.createdAt).toLocaleString()}</td><td className="px-5 py-3 max-w-xs truncate">{ex.input}</td><td className="px-5 py-3">{ex.durationMs}ms</td><td className="px-5 py-3">{ex.status === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-[var(--ai)]" /> Clinical AI Agents</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(agents).map(agent => (
          <div key={agent.id} className="bg-white border border-[var(--border)] rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xl">{agent.icon}</div>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${agent.enabled ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{agent.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <h3 className="font-semibold text-sm mb-1">{agent.name}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">{agent.description}</p>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-3">
              <span>{agent.specialty}</span>
              <span>{agent.timesRun} runs</span>
            </div>
            <button onClick={() => window.location.href = `/agents/${agent.id}`} className="w-full flex items-center justify-center gap-2 bg-[var(--bg-subtle)] hover:bg-[var(--border)] text-[var(--text-primary)] px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <Settings className="w-4 h-4" /> Configure
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}