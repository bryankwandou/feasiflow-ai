import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Plus, Bell, AlertTriangle, ChevronDown } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { usePatientStore } from '@/stores/usePatientStore';
import { useLabStore } from '@/stores/useLabStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export default function Topbar() {
  const navigate = useNavigate();
  const { toggleSidebar, selectedProvider, setSelectedProvider } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const patients = usePatientStore();
  const criticalLabs = useLabStore(s => s.getCriticalResults());
  const notifications = useNotificationStore(s => s.getUnread());

  const searchResults = searchQuery.length > 1 ? patients.searchPatients(searchQuery) : [];

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-[var(--border)] z-50 flex items-center px-4 gap-4">
      <button onClick={toggleSidebar} className="p-2 hover:bg-[var(--bg-subtle)] rounded-lg">
        <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
      </button>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg text-[var(--brand)]">ClinicFlow</span>
        <span className="bg-[var(--ai)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">AI</span>
      </div>

      <div className="flex-1 max-w-xl relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search patients, diagnoses, medications..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--border-focus)]"
          />
        </div>
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
            {searchResults.map(p => (
              <button key={p.id} onClick={() => { navigate(`/patients/${p.id}`); setSearchOpen(false); setSearchQuery(''); }} className="w-full text-left px-4 py-3 hover:bg-[var(--bg-subtle)] border-b border-[var(--border)] last:border-0">
                <div className="font-medium text-sm">{p.lastName}, {p.firstName}</div>
                <div className="text-xs text-[var(--text-muted)]">{p.mrn} · {p.dateOfBirth} · {p.primaryProvider}</div>
              </button>
            ))}
          </div>
        )}
        {searchOpen && searchQuery.length > 1 && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50 p-4 text-sm text-[var(--text-muted)]">
            No patients found
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/encounters')} className="flex items-center gap-2 bg-[var(--brand-mid)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand)]">
          <Plus className="w-4 h-4" /> New Encounter
        </button>
        <div className="text-xs text-[var(--text-secondary)] hidden md:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
        {criticalLabs.length > 0 && (
          <button onClick={() => navigate('/labs')} className="relative p-2 text-red-600 hover:bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{criticalLabs.length}</span>
          </button>
        )}
        <button className="relative p-2 hover:bg-[var(--bg-subtle)] rounded-lg">
          <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--brand-mid)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notifications.length}</span>
          )}
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-secondary)] hidden md:inline">Riverside Family Medicine</span>
          <div className="flex items-center gap-1">
            <span className="font-medium">{selectedProvider}</span>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
        </div>
      </div>
    </header>
  );
}
