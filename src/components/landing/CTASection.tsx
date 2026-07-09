import ScrollReveal from '../animations/ScrollReveal';
import MagneticButton from '../animations/MagneticButton';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-32 relative z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-900/50 pointer-events-none" />
      
      <div className="container mx-auto px-6 relative">
        <ScrollReveal className="max-w-4xl mx-auto glass border border-white/10 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] orb-brand opacity-30 pointer-events-none animate-spin-slow" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Kembalikan Waktu Anda untuk Melayani Pasien</h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Berhenti tenggelam dalam tumpukan dokumen medis. Mari kita buat operasional klinik Anda lebih ringkas, aman, dan tertata rapi mulai hari ini.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton strength={40} onClick={() => navigate('/app/practice')}>
                <div className="btn-primary flex items-center gap-2 group text-lg px-8 py-4">
                  Coba Sekarang Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </MagneticButton>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
