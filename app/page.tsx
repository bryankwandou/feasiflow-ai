import { MedanTitik } from "@/components/MedanTitik";
import { Muncul, Hitung } from "@/components/Muncul";
import { TombolUtama, JudulKata } from "@/components/Gerak";

const AGENTS = [
  { name: "A1 Riset", desc: "Memilih sendiri kueri dan laman, membaca isi laman secara utuh, lalu memeriksa Direktori dan Statistik LPBBTI OJK.", alat: "cari_web · baca_laman · cek_direktori_ojk · cek_statistik_ojk" },
  { name: "A2 Analisis", desc: "Menyusun Business Model Canvas 9 blok dan daftar risiko dari temuan A1, tanpa mengambil data baru.", alat: "lihat_bukti · minta_riset" },
  { name: "A3 Penilaian", desc: "Memberi skor 10 indikator rubrik. Tujuh indikator ditetapkan kode terhadap data resmi dan isian, dan skor penuh lainnya hanya boleh bila buktinya tersimpan.", alat: "lihat_bukti · minta_riset" },
];

const HURUF = ["a", "b", "c"];

const DIMENSI = [
  { kode: "D1", nama: "Pasar", teks: "66,7", nilai: 66.7 },
  { kode: "D2", nama: "Model bisnis", teks: "87,5", nilai: 87.5 },
  { kode: "D3", nama: "Regulasi", teks: "100", nilai: 100 },
];

const BUKTI = [
  { kode: "D1a", skor: "100", judul: "Penyaluran di wilayah sasaran tumbuh", bukti: "Penyaluran pinjaman di Sulawesi Selatan naik dari Rp4.147,1 miliar (2023) ke Rp7.185,6 miliar (2025), rata-rata 31,6 persen per tahun, di atas angka nasional 18,8 persen.", sumber: "Statistik LPBBTI OJK, edisi Desember 2025" },
  { kode: "D2c", skor: "50", judul: "Biaya utama tertutup pendapatan", bukti: "Pendapatan dan biaya disebutkan tanpa besaran angka, sehingga kecukupannya belum dapat dibuktikan.", sumber: "keluaran A2, ditetapkan kode" },
  { kode: "D3b", skor: "100", judul: "Rencana menangani gagal bayar", bukti: "Rencana memuat 3 tindakan: penilaian kredit dari catatan penjualan, batas pinjaman bertahap, dan dana cadangan.", sumber: "keluaran A2" },
];

const RUBRIK = [
  { kode: "D1", nama: "Pasar dan permintaan", butir: ["Penyaluran di wilayah sasaran tumbuh dibanding angka nasional.", "Ukuran segmen penerima dana tersedia dalam data resmi.", "Ada pembeda yang jelas dari penyelenggara berizin."] },
  { kode: "D2", nama: "Model bisnis dan keuangan", butir: ["Lima blok inti BMC terisi tanpa saling bertentangan.", "Ada arus pendapatan berulang.", "Biaya utama dapat ditutup oleh arus pendapatan.", "Rencana modal dan SDM memenuhi syarat POJK 40/2024."] },
  { kode: "D3", nama: "Regulasi dan risiko", butir: ["Model usaha termasuk kegiatan yang diizinkan peraturan.", "Risiko gagal bayar memiliki rencana penanganan.", "Perlindungan data pengguna memiliki rencana penanganan."] },
];

const KELAS = [
  { nama: "Layak", syarat: "Skor 70 ke atas" },
  { nama: "Layak Bersyarat", syarat: "Skor 50 sampai di bawah 70" },
  { nama: "Tidak Layak", syarat: "Skor di bawah 50 atau gugur" },
];

const STEPS = [
  { step: "01", title: "Isi 17 isian ide", desc: "Produk, segmen, wilayah, pendapatan, dan deskripsi wajib. Sisanya opsional: saluran, biaya, proyeksi, badan hukum, modal disetor, SDM, layanan, calon pelanggan, dan dua rencana penanganan risiko." },
  { step: "02", title: "Tiga agen bekerja", desc: "A1 mengumpulkan bukti, A2 menyusun model bisnis dan risiko, A3 menilai. Setiap langkah agen tampil langsung." },
  { step: "03", title: "Skor dan kelas keputusan", desc: "Skor 3 dimensi, skor gabungan, dan kelas Layak, Layak Bersyarat, atau Tidak Layak, lengkap dengan sumbernya." },
];

const FAKTA = ["3 agen", "10 indikator rubrik", "Skor 0–100", "Direktori dan Statistik OJK", "Sumber di setiap skor"];

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="nav-kaca sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-[15px] font-semibold tracking-tight">FeasiFlow AI</span>
          <div className="flex items-center gap-7">
            <a href="#cara-kerja" className="garis hidden sm:inline text-sm text-muted hover:text-fg">Cara kerja</a>
            <a href="#rubrik" className="garis hidden sm:inline text-sm text-muted hover:text-fg">Rubrik</a>
            <a href="#agen" className="garis hidden sm:inline text-sm text-muted hover:text-fg">Agen</a>
            <TombolUtama href="/analyze" teks="Mulai analisis" kecil />
          </div>
        </div>
        <span className="progres-gulir" aria-hidden="true" />
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <MedanTitik className="absolute inset-0 h-full w-full" />
        <div className="relative px-6 pt-20 pb-36 md:pt-28 md:pb-40">
          <div className="max-w-3xl mx-auto text-center">
            <JudulKata
              redup="Nilai kelayakan"
              utama="ide fintech lending."
              className="text-[40px] leading-[1.04] md:text-[68px] md:leading-[1.02] font-medium tracking-[-0.035em]"
            />
            <p className="animate-fade-up [animation-delay:550ms] mt-6 text-[17px] text-muted max-w-md mx-auto leading-relaxed">
              Tiga agen AI mencari bukti dari sumber resmi, menyusun model bisnis, lalu memberi skor dengan sumber di setiap angka.
            </p>
            <div className="animate-fade-up [animation-delay:700ms] mt-9 flex items-center justify-center">
              <TombolUtama href="/analyze" teks="Mulai analisis" />
            </div>
            <p className="animate-fade-up [animation-delay:800ms] mt-5 text-[13px] text-faint">Tanpa registrasi. Hasil dalam 1 sampai 2 menit.</p>
          </div>
        </div>
        <div className="marquee relative max-w-4xl mx-auto pb-10 text-sm text-faint">
          <div>
            {[0, 1].map((salinan) => (
              <ul key={salinan} className="flex shrink-0 items-center" aria-hidden={salinan === 1}>
                {FAKTA.map((f) => (
                  <li key={f} className="flex items-center gap-10 pr-10 whitespace-nowrap">
                    {f}
                    <span className="h-px w-6 bg-black/20" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {/* Contoh laporan */}
      <section className="gelap px-6 py-24 md:py-28">
        <MedanTitik className="medan opacity-40" warna="#ffffff" varian="pita" />
        <div className="max-w-5xl mx-auto">
          <Muncul>
          <h2 className="text-3xl md:text-[40px] md:leading-[1.08] font-medium tracking-[-0.03em]">
            <span className="text-white/45">Bukan sekadar angka.</span>
            <br />
            Setiap skor membawa sumbernya.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] text-white/60 leading-relaxed">
            Contoh di bawah diambil dari satu analisis nyata: pinjaman modal kerja harian untuk pedagang pasar di Sulawesi Selatan.
          </p>
          </Muncul>

          <div className="mt-12 grid lg:grid-cols-[18rem_1fr] gap-5">
            <Muncul tunda={100} className="tepi-cahaya tepi-gelap rounded-2xl bg-white text-fg p-7 flex flex-col">
              <p className="text-sm text-muted">Skor gabungan</p>
              <p className="mt-3 text-[84px] leading-none font-medium tracking-[-0.05em] tnum"><Hitung nilai={85} /></p>
              <p className="mt-3 text-lg font-medium">Layak</p>
              <dl className="mt-auto pt-8 space-y-3">
                {DIMENSI.map((d) => (
                  <div key={d.kode}>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted"><span className="font-mono text-fg">{d.kode}</span> {d.nama}</dt>
                      <dd className="tnum font-medium">{d.teks}</dd>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-black/10 overflow-hidden">
                      <div className="batang h-full bg-fg" style={{ ["--w" as string]: d.nilai + "%" }} />
                    </div>
                  </div>
                ))}
              </dl>
            </Muncul>

            <div className="kaca rounded-2xl divide-y divide-white/10 overflow-hidden">
              {BUKTI.map((b, i) => (
                <Muncul key={b.kode} tunda={180 + i * 120} className="sorot p-6 grid sm:grid-cols-[5.5rem_1fr] gap-x-5 gap-y-2">
                  <div>
                    <p className="font-mono text-sm text-white/50">{b.kode}</p>
                    <p className="text-3xl font-medium tracking-[-0.03em] tnum">{b.skor}</p>
                  </div>
                  <div>
                    <p className="text-[15px] font-medium">{b.judul}</p>
                    <p className="mt-1.5 text-[15px] text-white/65 leading-relaxed">{b.bukti}</p>
                    <p className="mt-2 text-[13px] text-white/45">Sumber: {b.sumber}</p>
                  </div>
                </Muncul>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="latar-kisi px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <Muncul>
          <h2 className="text-3xl md:text-[40px] md:leading-[1.08] font-medium tracking-[-0.03em]">
            <span className="nada-abu">Dari ide</span> ke laporan kelayakan.
          </h2>
          </Muncul>
          <div className="relative mt-14 hidden md:grid grid-cols-3 gap-5" aria-hidden="true">
            <div className="alur" style={{ top: 5 }} />
            {STEPS.map(({ step }) => (
              <span key={step} className="relative h-[11px] w-[11px] rounded-full border border-fg bg-[#f5f5f3]" />
            ))}
          </div>
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {STEPS.map(({ step, title, desc }, i) => (
              <Muncul key={step} tunda={i * 120} className="kartu sorot glass-card rounded-2xl p-7">
                <span className="block text-[56px] leading-none font-medium tracking-[-0.04em] text-black/15 tnum">{step}</span>
                <h3 className="mt-6 text-lg font-medium tracking-tight">{title}</h3>
                <p className="mt-2 text-[15px] text-muted leading-relaxed">{desc}</p>
              </Muncul>
            ))}
          </div>
        </div>
      </section>

      {/* Rubrik */}
      <section id="rubrik" className="latar-kisi border-t border-line px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <Muncul className="grid md:grid-cols-2 gap-x-12 gap-y-4 items-end">
            <h2 className="text-3xl md:text-[40px] md:leading-[1.08] font-medium tracking-[-0.03em]">
              <span className="nada-abu">10 indikator,</span>
              <br />
              tiga dimensi.
            </h2>
            <p className="text-[15px] text-muted leading-relaxed">
              Tiap indikator bernilai 100, 50, atau 0. Skor gabungan adalah rerata bobot sama 10 indikator. Ide yang kegiatannya tidak diizinkan peraturan langsung dinyatakan Tidak Layak.
            </p>
          </Muncul>
          <div className="mt-12 grid md:grid-cols-3 border-t border-fg">
            {RUBRIK.map((d, i) => (
              <Muncul key={d.kode} tunda={i * 120} className="pt-6 pb-2 md:px-6 md:first:pl-0 md:last:pr-0 md:border-l md:first:border-l-0 border-line">
                <p className="font-mono text-sm text-faint">{d.kode}</p>
                <h3 className="mt-1 text-lg font-medium tracking-tight">{d.nama}</h3>
                <ol className="mt-5 space-y-4">
                  {d.butir.map((x, i) => (
                    <li key={x} className="flex gap-3 text-[15px] text-muted leading-relaxed">
                      <span className="font-mono text-[13px] text-fg mt-0.5">{HURUF[i]}</span>
                      {x}
                    </li>
                  ))}
                </ol>
              </Muncul>
            ))}
          </div>
          <dl className="mt-12 grid sm:grid-cols-3 gap-5">
            {KELAS.map((k, i) => (
              <Muncul key={k.nama} tunda={i * 100} className="kartu sorot rounded-2xl border border-line bg-white px-6 py-5">
                <dt className="text-sm text-muted">{k.syarat}</dt>
                <dd className="mt-1 text-xl font-medium tracking-tight">{k.nama}</dd>
              </Muncul>
            ))}
          </dl>
        </div>
      </section>

      {/* Agen */}
      <section id="agen" className="gelap px-6 py-24 md:py-28">
        <MedanTitik className="medan opacity-40" warna="#ffffff" varian="pita" />
        <div className="max-w-5xl mx-auto">
          <Muncul>
          <h2 className="text-3xl md:text-[40px] md:leading-[1.08] font-medium tracking-[-0.03em]">
            <span className="text-white/45">Tiga agen,</span> satu pemeriksa.
          </h2>
          </Muncul>
          <ol className="mt-14 grid md:grid-cols-3 gap-5">
            {AGENTS.map(({ name, desc, alat }, i) => (
              <li key={name} className="flex">
              <Muncul tunda={i * 140} className="kaca kartu sorot rounded-2xl p-7 flex flex-col w-full hover:border-white/25">
                <p className="font-mono text-sm text-white/45">Agen {i + 1}</p>
                <h3 className="mt-2 text-2xl font-medium tracking-tight">{name}</h3>
                <p className="mt-3 text-[15px] text-white/65 leading-relaxed">{desc}</p>
                <p className="mt-auto pt-6 font-mono text-[12.5px] text-white/50 leading-relaxed">
                  <span className="block border-t border-white/15 pt-4">{alat}</span>
                </p>
              </Muncul>
              </li>
            ))}
          </ol>
          <Muncul tunda={200} className="mt-5 rounded-2xl bg-white text-fg px-7 py-6 grid md:grid-cols-[14rem_1fr] gap-x-8 gap-y-2">
            <h3 className="text-lg font-medium tracking-tight">Pemeriksaan antarfase</h3>
            <p className="text-[15px] text-muted leading-relaxed">
              Di antara setiap agen ada kode biasa, bukan AI. Kode ini menolak angka yang tidak ada pada bukti tersimpan, data pasar yang terbit lebih dari 24 bulan lalu, dan keluaran yang formatnya salah, lalu mengembalikannya ke agen paling banyak 2 kali. Skor gabungan dan kelas keputusan juga dihitung kode.
            </p>
          </Muncul>
        </div>
      </section>

      {/* Ajakan */}
      <section className="relative overflow-hidden border-t border-line px-6 py-28 text-center">
        <MedanTitik className="absolute inset-0 h-full w-full opacity-60" />
        <Muncul className="relative">
        <h2 className="text-3xl md:text-5xl font-medium tracking-[-0.03em]">
          <span className="nada-abu">Siap menilai</span> ide Anda?
        </h2>
        <p className="mt-4 text-[15px] text-muted">Lima isian wajib. Hasil dalam 1 sampai 2 menit.</p>
        <div className="mt-9 flex justify-center">
          <TombolUtama href="/analyze" teks="Mulai sekarang" />
        </div>
        </Muncul>
      </section>

      <footer className="border-t border-line py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-faint">
          <p className="font-medium text-fg">FeasiFlow AI</p>
          <p>Tugas Akhir Teknik Informatika, Universitas Atma Jaya Makassar, 2026</p>
          <p>Vincentius Bryan Kwandou · 2361021</p>
        </div>
      </footer>
    </main>
  );
}
