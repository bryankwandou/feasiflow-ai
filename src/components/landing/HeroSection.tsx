import { motion } from 'framer-motion';
import MagneticButton from '../animations/MagneticButton';
import { ArrowRight, Activity, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] orb-teal opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] orb-brand opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] orb-purple opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-teal mb-6"
            >
              <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-ping" />
              <span className="text-sm font-medium text-teal-300 tracking-wide">PENGELOLAAN KLINIK TERPADU</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight"
            >
              Fokus Penuh Pada <br className="hidden md:block" />
              <span className="gradient-text">Kesembuhan Pasien</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Tinggalkan beban administrasi yang menyita waktu. Sistem kami merapikan jadwal, menyusun rekam medis, dan membereskan tagihan, agar Anda bisa memberikan perhatian seutuhnya kepada pasien yang membutuhkan.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <MagneticButton strength={40} onClick={() => navigate('/app/practice')}>
                <div className="btn-primary flex items-center gap-2 group">
                  Mulai Gunakan Sekarang
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </MagneticButton>
              <MagneticButton strength={20}>
                <div className="btn-ghost flex items-center gap-2">
                  Lihat Demo Langsung
                </div>
              </MagneticButton>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-slate-400 text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" /> Sesuai Standar Medis
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-400" /> Selalu Siap Digunakan
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-400" /> Data Selalu Terhubung
              </div>
            </motion.div>
          </div>
          
          {/* 3D Dashboard Mockup */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-none perspective-1000">
            <motion.div
              initial={{ opacity: 0, rotateY: 20, rotateX: 10, scale: 0.9 }}
              animate={{ opacity: 1, rotateY: -5, rotateX: 5, scale: 1 }}
              transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
              className="relative w-full aspect-video rounded-2xl border border-white/10 glass-dark shadow-2xl shadow-brand-500/20 overflow-hidden animate-float"
            >
              {/* Mockup UI Elements */}
              <div className="absolute top-0 left-0 w-full h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/5 backdrop-blur-md">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="mx-auto w-1/3 h-6 rounded-md bg-white/5 border border-white/10" />
              </div>
              
              <div className="p-6 pt-16 h-full flex gap-4">
                {/* Sidebar mock */}
                <div className="w-1/4 h-full flex flex-col gap-3">
                  <div className="w-full h-8 rounded bg-teal-500/20 border border-teal-500/30" />
                  <div className="w-full h-8 rounded bg-white/5" />
                  <div className="w-full h-8 rounded bg-white/5" />
                  <div className="w-full h-8 rounded bg-white/5" />
                </div>
                {/* Main area mock */}
                <div className="w-3/4 h-full flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="flex-1 h-24 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-center p-4">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 mb-2" />
                      <div className="w-1/2 h-4 rounded bg-white/20 mb-2" />
                      <div className="w-1/3 h-6 rounded bg-white/40" />
                    </div>
                    <div className="flex-1 h-24 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-center p-4">
                      <div className="w-8 h-8 rounded-full bg-brand-500/20 mb-2" />
                      <div className="w-1/2 h-4 rounded bg-white/20 mb-2" />
                      <div className="w-1/3 h-6 rounded bg-white/40" />
                    </div>
                  </div>
                  <div className="flex-1 rounded-lg bg-white/5 border border-white/5 p-4 flex flex-col gap-3">
                    <div className="w-1/4 h-5 rounded bg-white/20 mb-2" />
                    <div className="w-full h-10 rounded bg-white/5" />
                    <div className="w-full h-10 rounded bg-white/5" />
                    <div className="w-full h-10 rounded bg-white/5" />
                  </div>
                </div>
              </div>
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-transparent pointer-events-none" />
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
