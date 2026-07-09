import { Activity } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-[#020617] border-t border-white/5 pt-20 pb-10 relative z-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-brand-500 flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">ClinicFlow <span className="text-teal-400">AI</span></span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Platform manajemen klinis generasi baru yang didukung oleh kecerdasan buatan. Mengubah cara dokter merawat pasien.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Produk</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#" className="hover:text-teal-400 transition-colors">Rekam Medis</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Penjadwalan</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Tagihan Cerdas</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Portal Pasien</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Perusahaan</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#" className="hover:text-teal-400 transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Karir</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Kontak</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#" className="hover:text-teal-400 transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Syarat Ketentuan</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Kepatuhan HIPAA</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Keamanan Data</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} ClinicFlow AI. Hak cipta dilindungi undang-undang.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">X</div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">in</div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">ig</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
