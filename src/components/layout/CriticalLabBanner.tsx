import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useLabStore } from '@/stores/useLabStore';

export default function CriticalLabBanner() {
  const navigate = useNavigate();
  const criticalLabs = useLabStore((s) => s.getCriticalResults());

  if (criticalLabs.length === 0) return null;

  return (
    <div className="critical-lab-banner">
      <AlertTriangle className="w-5 h-5 animate-pulse" />
      <span className="font-semibold">CRITICAL LAB VALUES REQUIRING IMMEDIATE ATTENTION:</span>
      {criticalLabs.map((lab) => {
        const crit = lab.components.find((c) => c.valueStatus.includes('critical'));
        return (
          <button
            key={lab.id}
            onClick={() => navigate(`/labs/${lab.id}`)}
            className="bg-white text-red-600 font-bold px-3 py-1 rounded text-sm hover:bg-red-50"
          >
            {lab.patientName}: {crit?.testName} = {crit?.value}
          </button>
        );
      })}
    </div>
  );
}
