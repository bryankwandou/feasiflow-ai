import ScrollReveal from '../animations/ScrollReveal';
import AnimatedCounter from '../animations/AnimatedCounter';

export default function StatsSection() {
  return (
    <section className="py-20 border-y border-white/5 bg-slate-900/50 backdrop-blur-sm relative z-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          
          <ScrollReveal delay={100}>
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 font-mono flex items-center">
                <AnimatedCounter target={12400} suffix="+" duration={2500} />
              </div>
              <div className="text-sm md:text-base text-slate-400 font-medium">Pasien Terlayani</div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl md:text-5xl font-bold text-teal-400 mb-2 font-mono flex items-center">
                <AnimatedCounter target={98} suffix="%" duration={2500} />
                <span className="text-2xl">.3</span>
              </div>
              <div className="text-sm md:text-base text-slate-400 font-medium">Klaim Berhasil</div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 font-mono flex items-center">
                <AnimatedCounter target={4} suffix="mnt" duration={2000} />
              </div>
              <div className="text-sm md:text-base text-slate-400 font-medium">Waktu Isi Rekam Medis</div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl md:text-5xl font-bold text-brand-400 mb-2 font-mono flex items-center">
                <AnimatedCounter target={99} suffix="%" duration={2500} />
                <span className="text-2xl">.9</span>
              </div>
              <div className="text-sm md:text-base text-slate-400 font-medium">Keandalan Server</div>
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}
