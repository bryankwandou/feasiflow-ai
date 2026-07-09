import ScrollReveal from '../animations/ScrollReveal';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Pendaftaran Ringkas',
      description: 'Pasien mengisi biodata dan informasi asuransi secara mandiri melalui tautan aman sebelum tiba di klinik.'
    },
    {
      number: '02',
      title: 'Pemeriksaan Fokus',
      description: 'Sistem menampilkan ringkasan riwayat medis secara instan, membantu Anda mengambil keputusan klinis dengan lebih cepat.'
    },
    {
      number: '03',
      title: 'Catatan Rapi',
      description: 'Bantu susun rekam medis terstruktur selagi Anda memeriksa, mengurangi waktu mengetik di akhir jam praktik.'
    },
    {
      number: '04',
      title: 'Klaim Lancar',
      description: 'Data tagihan langsung disesuaikan dengan standar asuransi untuk mempercepat proses pencairan dana.'
    }
  ];

  return (
    <section className="py-32 bg-slate-900/50 border-y border-white/5 relative z-10">
      <div className="container mx-auto px-6">
        
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-brand-400 font-semibold tracking-wide uppercase text-sm mb-3">Langkah Penggunaan</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Proses Mudah, Hasil Maksimal</h3>
        </ScrollReveal>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-teal-500/0 via-teal-500/20 to-brand-500/0 hidden lg:block -translate-y-1/2" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {steps.map((step, index) => (
              <ScrollReveal key={index} delay={index * 150} direction="up">
                <div className="relative flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-2xl glass-dark border border-teal-500/30 flex items-center justify-center text-xl font-bold text-teal-400 mb-6 group-hover:scale-110 group-hover:border-teal-400 transition-all duration-300 relative z-10 shadow-glow-teal bg-slate-900">
                    {step.number}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
