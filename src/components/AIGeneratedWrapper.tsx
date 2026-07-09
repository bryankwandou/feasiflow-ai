import { ReactNode } from 'react';

interface Props { children: ReactNode; label?: string; }

export default function AIGeneratedWrapper({ children, label = "AI Generated" }: Props) {
  return (
    <div className="border-l-4 border-[var(--ai)] bg-[var(--ai-light)] rounded-r-lg p-4 relative">
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-[var(--ai-border)] text-[var(--ai-text)] text-[10px] font-medium px-2 py-0.5 rounded-full">
        <span>✦</span>
        <span>{label} — requires clinician review</span>
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}
