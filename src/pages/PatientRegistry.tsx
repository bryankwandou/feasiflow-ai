import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '@/stores/usePatientStore';
import { useState } from 'react';
import { Search, Plus, User } from 'lucide-react';

export default function PatientRegistry() {
  const navigate = useNavigate();
  const patients = usePatientStore((s) => Object.values(s.patients));
  const [query, setQuery] = useState('');
  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    p.mrn.toLowerCase().includes(query.toLowerCase()) ||
    p.phone.includes(query)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Daftar Pasien</h1>
        <button
          onClick={() => navigate('/app/patients/new')}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Pasien Baru
        </button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari berdasarkan nama, nomor rekam medis, atau telepon..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
        />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-semibold text-slate-600">Nama Lengkap</th>
              <th className="text-left p-4 font-semibold text-slate-600">No. Rekam Medis</th>
              <th className="text-left p-4 font-semibold text-slate-600">Tanggal Lahir</th>
              <th className="text-left p-4 font-semibold text-slate-600">Dokter Penanggung Jawab</th>
              <th className="text-left p-4 font-semibold text-slate-600">Asuransi</th>
              <th className="text-left p-4 font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors last:border-0" onClick={() => navigate(`/app/patients/${p.id}`)}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{p.lastName}, {p.firstName}</div>
                      <div className="text-xs text-slate-500">{p.gender === 'male' ? 'L' : 'P'} · {new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()} Tahun</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-slate-600">{p.mrn}</td>
                <td className="p-4 text-slate-600">{p.dateOfBirth}</td>
                <td className="p-4 text-slate-600">{p.primaryProvider}</td>
                <td className="p-4 text-xs text-slate-600">{p.insuranceCarrier}</td>
                <td className="p-4">
                  <span className="text-xs px-2.5 py-1 rounded-md font-medium bg-emerald-50 text-emerald-700">{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
