import { useEducationStore } from '@/stores/useEducationStore';
import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';

export default function Education() {
  const [query, setQuery] = useState('');
  const materials = useEducationStore(s => Object.values(s.materials).filter(m => m.title.toLowerCase().includes(query.toLowerCase()) || m.condition.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Patient Education Library</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by condition or title..." className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--border-focus)]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map(m => (
          <div key={m.id} className="bg-white border border-[var(--border)] rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2"><BookOpen className="w-5 h-5 text-[var(--brand-mid)]" /><span className="text-xs font-medium text-[var(--brand-text)] uppercase">{m.condition}</span></div>
            <h3 className="font-semibold text-sm mb-2">{m.title}</h3>
            <div className="text-xs text-[var(--text-muted)] mb-3">Reading level: {m.readingLevel} · {m.language}</div>
            <div className="text-sm text-[var(--text-secondary)] line-clamp-4">{m.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}