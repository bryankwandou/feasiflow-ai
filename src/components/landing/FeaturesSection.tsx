import ScrollReveal from '../animations/ScrollReveal';
import FloatingCard from '../animations/FloatingCard';
import { Bot, FileText, Calendar, CreditCard, Stethoscope, Lock } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section className="py-32 relative z-10" id="fitur">
      <div className="container mx-auto px-6">
        
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-teal-400 font-semibold tracking-wide uppercase text-sm mb-3">Keunggulan Sistem</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Meringankan Pekerjaan Anda</h3>
          <p className="text-slate-400 text-lg">
            Semua peralatan yang dibutuhkan untuk menjalankan klinik dengan lancar, aman, dan tanpa hambatan.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <ScrollReveal delay={100} direction="up" className="lg:col-span-2">
            <FloatingCard intensity={10} className="h-full">
              <div className="h-full rounded-2xl glass-dark border border-white/5 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                  <Bot className="w-32 h-32 text-teal-500" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-6">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-3">Pencatatan Lebih Cepat</h4>
                    <p className="text-slate-400 max-w-md">
                      Membantu merangkum pemeriksaan, mengambil data penting dari riwayat kesehatan, dan menyajikan informasi yang relevan saat Anda membutuhkannya.
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-teal-500/10 to-transparent pointer-events-none" />
              </div>
            </FloatingCard>
          </ScrollReveal>

          {/* Card 2 */}
          <ScrollReveal delay={200} direction="up">
            <FloatingCard intensity={15} className="h-full">
              <div className="h-full rounded-2xl glass border border-white/5 p-8 relative overflow-hidden group hover:border-brand-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Data Pasien Lengkap</h4>
                <p className="text-slate-400">
                  Buka riwayat perawatan, hasil laboratorium, dan daftar obat dalam satu layar yang mudah dibaca.
                </p>
              </div>
            </FloatingCard>
          </ScrollReveal>

          {/* Card 3 */}
          <ScrollReveal delay={300} direction="up">
            <FloatingCard intensity={15} className="h-full">
              <div className="h-full rounded-2xl glass border border-white/5 p-8 relative overflow-hidden group hover:border-teal-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-slate-700/50 text-slate-300 flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Jadwal Teratur</h4>
                <p className="text-slate-400">
                  Cegah tumpang tindih janji temu dan kurangi risiko pasien lupa dengan pengingat otomatis.
                </p>
              </div>
            </FloatingCard>
          </ScrollReveal>

          {/* Card 4 */}
          <ScrollReveal delay={400} direction="up">
            <FloatingCard intensity={15} className="h-full">
              <div className="h-full rounded-2xl glass border border-white/5 p-8 relative overflow-hidden group hover:border-brand-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-6">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Administrasi Rapi</h4>
                <p className="text-slate-400">
                  Selesaikan urusan penagihan dan klaim asuransi lebih cepat dengan sistem yang meminimalkan kesalahan ketik.
                </p>
              </div>
            </FloatingCard>
          </ScrollReveal>

          {/* Card 5 */}
          <ScrollReveal delay={500} direction="up">
            <FloatingCard intensity={15} className="h-full">
              <div className="h-full rounded-2xl glass border border-white/5 p-8 relative overflow-hidden group hover:border-teal-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Data Aman Terlindungi</h4>
                <p className="text-slate-400">
                  Informasi pasien disimpan dengan aman sesuai standar kerahasiaan medis yang berlaku.
                </p>
              </div>
            </FloatingCard>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}
