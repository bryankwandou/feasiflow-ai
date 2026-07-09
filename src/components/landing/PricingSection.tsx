import ScrollReveal from '../animations/ScrollReveal';
import MagneticButton from '../animations/MagneticButton';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section className="py-32 relative z-10 bg-slate-900/30 border-y border-white/5">
      <div className="container mx-auto px-6">
        
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-brand-400 font-semibold tracking-wide uppercase text-sm mb-3">Biaya Terbuka</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Sesuaikan dengan Kebutuhan Anda</h3>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Starter Plan */}
          <ScrollReveal delay={100} direction="right">
            <div className="glass-dark border border-white/5 rounded-3xl p-10 h-full">
              <h4 className="text-2xl font-bold text-white mb-2">Praktik Mandiri</h4>
              <p className="text-slate-400 mb-6">Cocok bagi dokter yang membuka praktik sendiri dan ingin beralih dari pencatatan manual.</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">Gratis</span>
                <span className="text-slate-400">/selamanya</span>
              </div>
              
              <ul className="space-y-4 mb-10">
                {['Maksimal 500 pasien', 'Buku jadwal elektronik', 'Format rekam medis standar', 'Bantuan via email'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-teal-500 shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              
              <MagneticButton strength={20} className="w-full" onClick={() => navigate('/app/practice')}>
                <div className="btn-ghost w-full text-center">Mulai Gratis</div>
              </MagneticButton>
            </div>
          </ScrollReveal>

          {/* Pro Plan */}
          <ScrollReveal delay={200} direction="left">
            <div className="glass border border-teal-500/30 rounded-3xl p-10 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-teal-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Saran Kami
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] orb-teal opacity-20 pointer-events-none" />
              
              <div className="relative z-10">
                <h4 className="text-2xl font-bold text-teal-400 mb-2">Klinik Terpadu</h4>
                <p className="text-slate-400 mb-6">Solusi utuh untuk klinik dengan tim besar dan jam operasional tinggi.</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">Hubungi</span>
                  <span className="text-slate-400">/kami</span>
                </div>
                
                <ul className="space-y-4 mb-10">
                  {['Kuota pasien tanpa batas', 'Bantuan asisten penyusun catatan', 'Sistem klaim asuransi otomatis', 'Bantuan teknis 24 jam', 'Koneksi ke lab & apotek'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-teal-400 shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
                
                <MagneticButton strength={20} className="w-full">
                  <div className="btn-teal w-full text-center">Jadwalkan Konsultasi</div>
                </MagneticButton>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}
