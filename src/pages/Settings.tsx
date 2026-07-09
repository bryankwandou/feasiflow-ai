import { useUIStore } from '@/stores/useUIStore';

export default function Settings() {
  const { darkMode, toggleDarkMode, selectedProvider, setSelectedProvider } = useUIStore();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="bg-white rounded-lg border border-[var(--border)] p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
          <div>
            <div className="font-medium">Dark Mode</div>
            <div className="text-sm text-[var(--text-muted)]">Toggle dark theme</div>
          </div>
          <button onClick={toggleDarkMode} className={`w-12 h-6 rounded-full ${darkMode ? 'bg-[var(--brand-mid)]' : 'bg-gray-300'} relative transition-colors`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
          <div>
            <div className="font-medium">Current Provider</div>
            <div className="text-sm text-[var(--text-muted)]">Set your provider context</div>
          </div>
          <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} className="p-2 border border-[var(--border)] rounded-lg text-sm">
            <option>Dr. Sarah Chen</option>
            <option>Dr. James Patel</option>
          </select>
        </div>
        <div className="pt-2">
          <div className="font-medium mb-2">Practice Information</div>
          <div className="text-sm text-[var(--text-secondary)] space-y-1">
            <div>Riverside Family Medicine</div>
            <div>123 Medical Plaza, Suite 200</div>
            <div>Riverside, CA 92501</div>
            <div>NPI: 9876543210</div>
          </div>
        </div>
      </div>
    </div>
  );
}
