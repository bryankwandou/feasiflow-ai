import ScrollReveal from '../animations/ScrollReveal';

export default function SocialProof() {
  const testimonials = [
    {
      quote: "Pengisian data kini jauh lebih cepat. Dokter kami punya waktu ekstra untuk benar-benar mendengarkan pasien, bukan sekadar menatap layar komputer.",
      author: "Dr. Sarah Jenkins",
      role: "Pemilik Klinik Utama",
      avatar: "https://i.pravatar.cc/150?u=sarah"
    },
    {
      quote: "Urusan keuangan menjadi jauh lebih tertata. Pencairan dana asuransi lebih lancar dan hampir tidak ada lagi penolakan klaim karena salah ketik.",
      author: "Michael Chen",
      role: "Penanggung Jawab Operasional",
      avatar: "https://i.pravatar.cc/150?u=michael"
    },
    {
      quote: "Sangat mudah dipelajari, bahkan oleh staf kami yang sudah berumur. Bantuan teknisnya juga cepat tanggap ketika kami menemui kendala.",
      author: "Dr. Elena Rodriguez",
      role: "Dokter Spesialis Anak",
      avatar: "https://i.pravatar.cc/150?u=elena"
    }
  ];

  return (
    <section className="py-32 relative z-10 overflow-hidden">
      <div className="container mx-auto px-6">
        
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-teal-400 font-semibold tracking-wide uppercase text-sm mb-3">Kesan Pengguna</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Telah Teruji di Berbagai Klinik</h3>
        </ScrollReveal>

        {/* Logos Marquee */}
        <div className="relative w-full overflow-hidden h-24 mb-20 mask-edges">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050C18] to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050C18] to-transparent z-10" />
          
          <div className="animate-marquee flex items-center gap-16 whitespace-nowrap h-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="text-2xl font-bold text-slate-700 mx-8">KLINIK {i}</div>
            ))}
            {/* Duplicate for infinite effect */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={`dup-${i}`} className="text-2xl font-bold text-slate-700 mx-8">KLINIK {i}</div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testi, i) => (
            <ScrollReveal key={i} delay={i * 200} direction="up">
              <div className="glass-dark border border-white/5 rounded-2xl p-8 h-full flex flex-col hover:border-white/10 transition-colors">
                <div className="text-brand-400 text-4xl font-serif mb-4">"</div>
                <p className="text-slate-300 flex-1 mb-8 leading-relaxed">
                  {testi.quote}
                </p>
                <div className="flex items-center gap-4">
                  <img src={testi.avatar} alt={testi.author} className="w-12 h-12 rounded-full border border-white/10" />
                  <div>
                    <div className="font-bold text-white">{testi.author}</div>
                    <div className="text-sm text-slate-400">{testi.role}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
