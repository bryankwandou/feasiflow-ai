import { useParams } from 'react-router-dom';
import { useLabStore } from '@/stores/useLabStore';
import { useState } from 'react';
import { callClaude } from '@/lib/claude';
import { CLINICAL_AGENTS } from '@/data/agentSeed';
import { toast } from 'sonner';
import { Loader2, Sparkles, CheckCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function LabDetail() {
  const { id } = useParams();
  const lab = useLabStore((s) => (id ? s.results[id] : undefined));
  const reviewResult = useLabStore((s) => s.reviewResult);
  const acknowledgeResult = useLabStore((s) => s.acknowledgeResult);
  const [interpreting, setInterpreting] = useState(false);
  const [aiText, setAiText] = useState(lab?.aiInterpretation || '');

  if (!lab) return <div>Lab not found</div>;

  const runInterpretation = async () => {
    setInterpreting(true);
    try {
      const agent = CLINICAL_AGENTS['agent-lab-interpreter'];
      const context = `Patient: ${lab.patientName}
Test: ${lab.testPanel}
Date: ${lab.resultDate}
Results:
${lab.components.map(c => `- ${c.testName}: ${c.value} ${c.unit} (ref: ${c.referenceRangeLow}-${c.referenceRangeHigh}) [${c.valueStatus}]`).join('\\n')}`;
      const result = await callClaude(agent.systemPrompt, context, 1000);
      setAiText(result);
      toast.success('AI interpretation complete');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setInterpreting(false);
    }
  };

  const abnormalComponents = lab.components.filter(c => !['normal', 'not-reported'].includes(c.valueStatus));
  const trendData = lab.components.map(c => ({ name: c.testName, value: Number(c.value), refLow: c.referenceRangeLow, refHigh: c.referenceRangeHigh })).filter(d => !isNaN(d.value));

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">{lab.testPanel}</h1>
      <div className="text-sm text-[var(--text-secondary)]">
        {lab.patientName} · {lab.lab} · Collected: {lab.collectedDate} · Resulted: {lab.resultDate}
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)]">
            <tr>
              <th className="text-left p-3">Test</th>
              <th className="text-left p-3">Value</th>
              <th className="text-left p-3">Unit</th>
              <th className="text-left p-3">Reference Range</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {lab.components.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="p-3 font-medium">{c.testName}</td>
                <td className="p-3 font-mono font-bold text-lg">{c.value}</td>
                <td className="p-3">{c.unit}</td>
                <td className="p-3 text-[var(--text-muted)]">{c.referenceRangeLow}-{c.referenceRangeHigh}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.valueStatus.includes('critical') ? 'bg-red-600 text-white' : c.valueStatus === 'high' ? 'bg-orange-100 text-orange-700' : c.valueStatus === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {c.valueStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button onClick={runInterpretation} disabled={interpreting} className="flex items-center gap-1.5 bg-[var(--ai)] text-white px-3 py-1.5 rounded-lg text-sm">
          {interpreting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Interpret
        </button>
        <button onClick={() => { reviewResult(lab.id, 'Dr. Sarah Chen', 'Reviewed and acknowledged'); toast.success('Result reviewed'); }} className="flex items-center gap-1.5 bg-[var(--brand-mid)] text-white px-3 py-1.5 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" /> Review
        </button>
        <button onClick={() => { acknowledgeResult(lab.id); toast.success('Result acknowledged'); }} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" /> Acknowledge
        </button>
      </div>

      {aiText && (
        <div className="ai-generated-wrapper">
          <div className="ai-generated-badge"><Sparkles className="w-3 h-3" /> AI Generated — requires review</div>
          <div className="text-sm whitespace-pre-wrap font-clinical">{aiText}</div>
        </div>
      )}
    </div>
  );
}
