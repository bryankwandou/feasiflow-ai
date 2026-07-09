import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '@/stores/usePatientStore';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewPatient() {
  const navigate = useNavigate();
  const addPatient = usePatientStore((s) => s.addPatient);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'female' as const,
    phone: '', email: '', address1: '', city: '', state: 'CA', zip: '',
    emergencyName: '', emergencyRelationship: '', emergencyPhone: '',
    insuranceCarrier: '', insurancePlan: '', memberId: '', groupNumber: '',
    subscriberName: '', subscriberDOB: '', subscriberRelationship: 'self' as const,
    primaryProvider: 'Dr. Sarah Chen', bloodType: 'unknown' as const,
    preferredPharmacy: '', language: 'English', interpreterNeeded: false,
    activeDiagnoses: [], allergies: [], currentMedications: [],
    pastSurgeries: [], familyHistory: [],
    socialHistory: { smokingStatus: 'never' as const, alcoholUse: 'none' as const, occupation: '', exerciseFrequency: 'none' as const, dietType: '', livingSituation: '', educationLevel: '' },
    preventiveHealth: [], status: 'active' as const, notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = addPatient(form as any);
    toast.success('Patient created');
    navigate(`/patients/${id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/patients')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">New Patient Intake</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[var(--border)] p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input required type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as any})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Address</label>
            <input required value={form.address1} onChange={e => setForm({...form, address1: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ZIP</label>
            <input required value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Insurance Carrier</label>
            <input required value={form.insuranceCarrier} onChange={e => setForm({...form, insuranceCarrier: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Member ID</label>
            <input required value={form.memberId} onChange={e => setForm({...form, memberId: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Primary Provider</label>
            <select value={form.primaryProvider} onChange={e => setForm({...form, primaryProvider: e.target.value})} className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
              <option>Dr. Sarah Chen</option>
              <option>Dr. James Patel</option>
            </select>
          </div>
        </div>
        <div className="pt-4 border-t border-[var(--border)]">
          <button type="submit" className="flex items-center gap-1.5 bg-[var(--brand-mid)] text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Save className="w-4 h-4" /> Create Patient
          </button>
        </div>
      </form>
    </div>
  );
}
