import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import MagneticButton from '../animations/MagneticButton';

export default function LandingNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 py-4 transition-all duration-300">
      <div className="container mx-auto px-6 flex items-center justify-between">
        
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-brand-500 flex items-center justify-center text-white shadow-glow-teal">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ClinicFlow <span className="text-teal-400">AI</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#fitur" className="hover:text-white transition-colors">Fitur Utama</a>
          <a href="#testimoni" className="hover:text-white transition-colors">Testimoni</a>
          <a href="#harga" className="hover:text-white transition-colors">Harga</a>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/practice')} className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Masuk
          </button>
          <MagneticButton strength={15} onClick={() => navigate('/app/practice')}>
            <div className="px-5 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors border border-white/10 text-sm">
              Mulai Demo
            </div>
          </MagneticButton>
        </div>

      </div>
    </nav>
  );
}
