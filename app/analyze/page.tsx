"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Minus } from "lucide-react";
import { Gulir, Panah, JudulKata } from "@/components/Gerak";
import { MedanTitik } from "@/components/MedanTitik";
import AmbilDokumen from "@/components/AmbilDokumen";
import { BENTUK_HUKUM, JENIS_PENDANAAN, LAYANAN, RUBRIK, SYARAT_SDM, TAHAP_KESIAPAN, URAIAN_RUBRIK, type Ide, type Indikator } from "@/lib/tiga-agen/tipe";

type Kolom = { kunci: keyof Ide; label: string; contoh: string; bantuan: string; lebar?: boolean; opsional?: boolean; panjang?: boolean; angka?: boolean };
/** Pilihan opsional memakai opsi pertama "Belum ditentukan" yang disimpan sebagai isian kosong. */
type Pilihan = { kunci: "jenis" | "tahap" | "bentuk_hukum" | "layanan"; label: string; bantuan: string; opsi: readonly string[]; opsional?: boolean };
type Centang = { kunci: "rencana_sdm"; label: string; bantuan: string; opsi: readonly string[] };
const BELUM_DITENTUKAN = "Belum ditentukan";

const WAJIB: (keyof Ide)[] = ["produk", "segmen", "wilayah", "pendapatan", "deskripsi"];

const PILIH_JENIS: Pilihan = { kunci: "jenis", label: "Jenis pendanaan", bantuan: "Produktif untuk usaha, konsumtif untuk kebutuhan pribadi.", opsi: JENIS_PENDANAAN };
const PILIH_TAHAP: Pilihan = { kunci: "tahap", label: "Tahap kesiapan", bantuan: "Sejauh mana ide sudah dikerjakan.", opsi: TAHAP_KESIAPAN };

const PILIH_BENTUK: Pilihan = { kunci: "bentuk_hukum", label: "Bentuk badan hukum", bantuan: "POJK 40/2024 Pasal 2: penyelenggara berbentuk PT atau koperasi.", opsi: [BELUM_DITENTUKAN, ...BENTUK_HUKUM], opsional: true };
const PILIH_LAYANAN: Pilihan = { kunci: "layanan", label: "Layanan daring atau luring", bantuan: "Cara layanan dijalankan.", opsi: [BELUM_DITENTUKAN, ...LAYANAN], opsional: true };
const CENTANG_SDM: Centang = { kunci: "rencana_sdm", label: "Rencana SDM", bantuan: "Centang yang sudah direncanakan (POJK 40/2024 Pasal 52, 196, 200).", opsi: SYARAT_SDM };

const BAGIAN: { nomor: string; judul: string; ket: string; pilihan?: Pilihan[]; centang?: Centang; kolom: Kolom[] }[] = [
  {
    nomor: "01",
    judul: "Produk",
    ket: "Apa yang ditawarkan dan sejauh mana kesiapannya.",
    pilihan: [PILIH_JENIS, PILIH_TAHAP],
    kolom: [
      { kunci: "produk", label: "Produk pendanaan", contoh: "Pinjaman modal kerja harian", bantuan: "Jenis pinjaman atau pendanaan yang ditawarkan.", lebar: true },
    ],
  },
  {
    nomor: "02",
    judul: "Pasar",
    ket: "Siapa penerima dana dan di mana layanan dijalankan.",
    pilihan: [PILIH_LAYANAN],
    kolom: [
      { kunci: "segmen", label: "Segmen penerima dana", contoh: "Pedagang pasar tradisional", bantuan: "Siapa yang akan menerima dana." },
      { kunci: "wilayah", label: "Wilayah sasaran", contoh: "Sulawesi Selatan", bantuan: "Tulis nama provinsi agar cocok dengan Statistik OJK." },
      { kunci: "saluran", label: "Saluran distribusi", contoh: "Agen lapangan dan aplikasi", bantuan: "Cara layanan sampai ke penerima dana.", lebar: true, opsional: true },
      { kunci: "tempat", label: "Tempat layanan", contoh: "Kantor di Makassar dan pos agen di 5 pasar", bantuan: "Lokasi kantor atau titik layanan, bagian dari isian layanan.", opsional: true },
      { kunci: "calon_pelanggan", label: "Calon pelanggan awal", contoh: "120 pedagang Pasar Terong yang sudah mendaftar", bantuan: "Siapa dan berapa calon penerima dana pertama.", opsional: true },
    ],
  },
  {
    nomor: "03",
    judul: "Model bisnis",
    ket: "Dari mana uang masuk dan ke mana uang keluar.",
    kolom: [
      { kunci: "pendapatan", label: "Sumber pendapatan", contoh: "Biaya layanan per pencairan", bantuan: "Dari mana pendapatan diperoleh. Sebutkan besarannya (persen atau rupiah) agar D2c dapat bernilai 100." },
      { kunci: "biaya", label: "Biaya utama", contoh: "Komisi agen, teknologi, penagihan", bantuan: "Pengeluaran terbesar beserta besarannya, misalnya Rp20 juta per bulan.", opsional: true },
      { kunci: "pendapatan_bulanan", label: "Proyeksi pendapatan per bulan (juta rupiah)", contoh: "60", bantuan: "Bagian dari isian proyeksi. Dipakai untuk D2c dan BEP.", opsional: true, angka: true },
      { kunci: "biaya_bulanan", label: "Proyeksi biaya per bulan (juta rupiah)", contoh: "45", bantuan: "Bagian dari isian proyeksi.", opsional: true, angka: true },
      { kunci: "biaya_awal", label: "Biaya awal (juta rupiah)", contoh: "300", bantuan: "BEP = biaya awal / (pendapatan - biaya) per bulan.", opsional: true, angka: true },
    ],
  },
  {
    nomor: "04",
    judul: "Badan hukum, modal, dan SDM",
    ket: "Syarat izin POJK 40/2024. Isian kosong dinilai 50 sebagai bukti terbatas.",
    pilihan: [PILIH_BENTUK],
    centang: CENTANG_SDM,
    kolom: [
      { kunci: "modal_disetor", label: "Modal disetor yang direncanakan (miliar rupiah)", contoh: "25", bantuan: "Pasal 7: paling sedikit Rp25 miliar.", opsional: true, angka: true },
    ],
  },
  {
    nomor: "05",
    judul: "Risiko",
    ket: "Rencana dengan 2 unsur atau lebih dinilai 100, 1 unsur dinilai 50, dan tanpa rencana dinilai 0.",
    kolom: [
      { kunci: "rencana_gagal_bayar", label: "Rencana menangani gagal bayar", contoh: "Penilaian kelayakan dari riwayat setoran, penagihan harian, asuransi kredit", bantuan: "Cara mencegah dan menagih pinjaman yang macet.", lebar: true, opsional: true, panjang: true },
      { kunci: "rencana_data", label: "Rencana melindungi data pengguna", contoh: "Data dienkripsi dan hanya dipakai dengan persetujuan peminjam", bantuan: "Cara data peminjam disimpan dan dipakai.", lebar: true, opsional: true, panjang: true },
    ],
  },
];

/** Isian yang menjadi dasar tiap indikator rubrik, dan keterangan bila isian opsionalnya kosong. */
const DASAR: Record<Indikator, { perlu: (keyof Ide)[]; kosong: string }> = {
  D1a: { perlu: ["wilayah"], kosong: "isi wilayah" },
  D1b: { perlu: ["segmen", "wilayah"], kosong: "isi segmen dan wilayah" },
  D1c: { perlu: ["produk", "deskripsi"], kosong: "isi produk dan deskripsi" },
  D2a: { perlu: ["produk", "segmen", "pendapatan"], kosong: "isi produk, segmen, pendapatan" },
  D2b: { perlu: ["pendapatan"], kosong: "isi pendapatan" },
  D2c: { perlu: ["pendapatan", "biaya"], kosong: "tanpa besaran, paling tinggi 50" },
  D2d: { perlu: ["modal_disetor", "rencana_sdm"], kosong: "kosong, dinilai 50 (bukti terbatas)" },
  D3a: { perlu: ["produk", "bentuk_hukum"], kosong: "tanpa badan hukum, paling tinggi 50" },
  D3b: { perlu: ["rencana_gagal_bayar"], kosong: "kosong, dinilai 0" },
  D3c: { perlu: ["rencana_data"], kosong: "kosong, dinilai 0" },
};

const DIMENSI: { kode: string; nama: string; ind: Indikator[] }[] = [
  { kode: "D1", nama: "Pasar dan permintaan", ind: ["D1a", "D1b", "D1c"] },
  { kode: "D2", nama: "Model bisnis dan keuangan", ind: ["D2a", "D2b", "D2c", "D2d"] },
  { kode: "D3", nama: "Regulasi dan risiko", ind: ["D3a", "D3b", "D3c"] },
];

const CONTOH: Ide = {
  produk: "Pinjaman modal kerja harian",
  segmen: "Pedagang pasar tradisional",
  wilayah: "Sulawesi Selatan",
  saluran: "Agen lapangan dan aplikasi",
  pendapatan: "Biaya layanan per pencairan",
  jenis: "Produktif",
  tahap: "Ide",
  biaya: "Komisi agen, biaya teknologi, dan biaya penagihan",
  rencana_gagal_bayar: "Penilaian kelayakan dari riwayat setoran harian, penagihan harian oleh agen, dan asuransi kredit",
  rencana_data: "Data peminjam disimpan terenkripsi dan hanya dipakai dengan persetujuan peminjam",
  bentuk_hukum: "PT",
  modal_disetor: "25",
  rencana_sdm: SYARAT_SDM.join("; "),
  layanan: "Keduanya",
  tempat: "Kantor di Makassar dan pos agen di pasar tradisional",
  calon_pelanggan: "Pedagang pasar tradisional di Makassar yang sudah mendaftar minat",
  pendapatan_bulanan: "60",
  biaya_bulanan: "45",
  biaya_awal: "300",
  deskripsi:
    "Platform pendanaan bersama yang mempertemukan pemberi dana dengan pedagang pasar, plafon Rp 1 sampai 10 juta, tenor 30 hari. " +
    "Hubungan pelanggan dijaga agen lapangan yang mendampingi pedagang dan layanan pengaduan lewat aplikasi.",
};

const KOSONG: Ide = {
  produk: "", segmen: "", wilayah: "", saluran: "", pendapatan: "", deskripsi: "",
  jenis: "Produktif", tahap: "Ide", biaya: "", rencana_gagal_bayar: "", rencana_data: "",
  bentuk_hukum: "", modal_disetor: "", rencana_sdm: "", layanan: "", tempat: "", calon_pelanggan: "",
  pendapatan_bulanan: "", biaya_bulanan: "", biaya_awal: "",
};

/** 17 isian Tabel 4 naskah. Isian 15 dan 17 terdiri atas beberapa kunci. */
const ISIAN: { no: number; kunci: (keyof Ide)[]; semua?: boolean }[] = [
  { no: 1, kunci: ["jenis"] }, { no: 2, kunci: ["produk"] }, { no: 3, kunci: ["segmen"] }, { no: 4, kunci: ["wilayah"] },
  { no: 5, kunci: ["saluran"] }, { no: 6, kunci: ["pendapatan"] }, { no: 7, kunci: ["biaya"] }, { no: 8, kunci: ["rencana_gagal_bayar"] },
  { no: 9, kunci: ["rencana_data"] }, { no: 10, kunci: ["tahap"] }, { no: 11, kunci: ["deskripsi"] }, { no: 12, kunci: ["bentuk_hukum"] },
  { no: 13, kunci: ["modal_disetor"] }, { no: 14, kunci: ["rencana_sdm"] }, { no: 15, kunci: ["layanan", "tempat"] },
  { no: 16, kunci: ["calon_pelanggan"] }, { no: 17, kunci: ["pendapatan_bulanan", "biaya_bulanan"], semua: true },
];
const LABEL: Partial<Record<keyof Ide, string>> = { deskripsi: "deskripsi singkat" };
for (const b of BAGIAN) for (const k of b.kolom) LABEL[k.kunci] = k.label.toLowerCase();

type Klarifikasi = {
  putaran: number;
  batas_putaran: number;
  masalah: { isian: string; alasan: string; jenis: "tolak" | "peringatan"; sampah?: boolean }[];
  pertanyaan: { isian: string; pertanyaan: string }[];
};

export default function AnalyzePage() {
  const router = useRouter();
  const [ide, setIde] = useState<Ide>(KOSONG);
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState("");
  // Tanya balik agen pemeriksa isian: sesi yang dikembalikan beserta masalah dan pertanyaannya.
  const [ulang, setUlang] = useState<{ sessionId: string; k: Klarifikasi } | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("ulang");
    if (!id) return;
    try {
      const p = sessionStorage.getItem(`params_${id}`);
      const k = sessionStorage.getItem(`klarifikasi_${id}`);
      if (p) setIde({ ...KOSONG, ...(JSON.parse(p) as Ide) });
      if (k) setUlang({ sessionId: id, k: JSON.parse(k) as Klarifikasi });
    } catch { /* abaikan */ }
  }, []);

  const catatanIsian = (k: string) => {
    if (!ulang) return null;
    const m = ulang.k.masalah.filter((x) => x.isian === k);
    const q = ulang.k.pertanyaan.filter((x) => x.isian === k);
    if (!m.length && !q.length) return null;
    return (
      <ul className="mt-2 space-y-1 text-[13px] leading-snug">
        {m.map((x, i) => (
          <li key={"m" + i} className={x.jenis === "tolak" ? "text-rose-700" : "text-amber-700"}>
            {x.jenis === "tolak" ? "Perlu diperbaiki: " : "Catatan: "}{x.alasan}.
          </li>
        ))}
        {q.map((x, i) => <li key={"q" + i} className="text-fg">Pertanyaan: {x.pertanyaan}</li>)}
      </ul>
    );
  };

  const inputCls =
    "w-full bg-white border border-line rounded-lg px-3.5 py-2.5 text-base md:text-[15px] text-fg placeholder:text-faint hover:border-black/25 focus:outline-none focus:border-fg focus:ring-4 focus:ring-black/[0.07] transition-[border-color,box-shadow] duration-300";
  const labelCls = "block text-sm font-medium text-fg";

  const ubah = (k: keyof Ide, v: string) => {
    setIde((s) => ({ ...s, [k]: v === BELUM_DITENTUKAN ? "" : v }));
    setGalat("");
  };
  const isi = (k: keyof Ide) => (ide[k] || "").trim();
  const terisi = ISIAN.filter((x) => (x.semua ? x.kunci.every((k) => isi(k)) : x.kunci.some((k) => isi(k)))).length;
  const sdm = isi("rencana_sdm").split(";").map((x) => x.trim()).filter(Boolean);
  const centang = (o: string) => {
    const baru = sdm.includes(o) ? sdm.filter((x) => x !== o) : [...sdm, o];
    ubah("rencana_sdm", SYARAT_SDM.filter((x) => baru.includes(x)).join("; "));
  };

  async function mulai(e: React.FormEvent) {
    e.preventDefault();
    const kosong = WAJIB.filter((k) => !isi(k));
    const pendek = isi("deskripsi").length > 0 && isi("deskripsi").length < 20;
    if (kosong.length || pendek) {
      setGalat(
        (kosong.length ? "Belum diisi: " + kosong.map((k) => LABEL[k]).join(", ") + ". " : "") +
          (pendek ? "Deskripsi singkat sekurang-kurangnya 20 karakter." : ""),
      );
      return;
    }
    setGalat("");
    setKirim(true);
    if (ulang) {
      // Kirim ulang sesi yang sama dengan nomor putaran berikutnya.
      try {
        sessionStorage.setItem(`params_${ulang.sessionId}`, JSON.stringify(ide));
        sessionStorage.setItem(`putaran_${ulang.sessionId}`, String(ulang.k.putaran + 1));
        sessionStorage.removeItem(`klarifikasi_${ulang.sessionId}`);
      } catch { /* abaikan */ }
      router.push(`/analyze/${ulang.sessionId}`);
      return;
    }
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const { sessionId } = (await res.json()) as { sessionId: string };
      sessionStorage.setItem(`params_${sessionId}`, JSON.stringify(ide));
      router.push(`/analyze/${sessionId}`);
    } catch {
      setGalat("Analisis tidak bisa dimulai. Periksa sambungan internet lalu coba lagi.");
      setKirim(false);
    }
  }

  const opsional = <span className="font-normal text-faint"> (opsional)</span>;

  return (
    <div className="min-h-screen">
      {/* Kepala halaman */}
      <header className="gelap">
        <MedanTitik className="medan opacity-25 !top-[58%] !h-[42%]" warna="#ffffff" varian="pita" />
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-12 md:pb-14 animate-fade-up">
          <a href="/" className="inline-flex items-center gap-1.5 py-1.5 text-sm text-white/60 hover:text-white transition-colors duration-150 focus-ring rounded">
            <ArrowLeft size={15} /> FeasiFlow AI
          </a>
          <div className="mt-9 grid md:grid-cols-[1.5fr_1fr] gap-x-12 gap-y-6 items-end">
            <JudulKata redup="Ceritakan idenya," utama="agen yang mencari buktinya." className="judul-gelap text-[34px] leading-[1.06] md:text-[52px] md:leading-[1.03] font-medium tracking-[-0.035em]" />
            <p className="text-[15px] text-white/65 leading-relaxed">
              Ada 17 isian. Lima wajib, dua sudah terisi nilai bawaan, sepuluh lainnya opsional. Makin lengkap isiannya, makin sedikit yang harus ditebak agen.
            </p>
          </div>
        </div>
      </header>

      <div className="latar-kisi">
      <form onSubmit={mulai} className="max-w-5xl mx-auto px-6 py-10 grid lg:grid-cols-[1fr_19rem] gap-10 items-start">
        <div className="space-y-5 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Belum punya ide? Coba dengan contoh pedagang pasar.</p>
            <button
              type="button"
              onClick={() => { setIde(CONTOH); setGalat(""); }}
              className="tombol-garis shrink-0 rounded-full border border-fg px-4 py-2 text-sm font-medium focus-ring"
            >
              <Gulir teks="Isi dengan contoh" />
            </button>
          </div>

          <AmbilDokumen isi={(d) => { setIde((s) => ({ ...s, ...d })); setGalat(""); }} />
          <p className="text-sm text-muted">
            Ingin membandingkan beberapa ide sekaligus? Buka <a href="/banding" className="underline">Banding ide</a>.
          </p>

          {ulang && (
            <section className="rounded-2xl border border-amber-300 bg-amber-50 text-neutral-900 p-6" role="status">
              <h2 className="text-base font-medium">
                {ulang.k.masalah.some((m) => m.sampah) ? "Isian ditolak: kosong, terlalu pendek, acak, atau tidak bermakna. Ide tidak dinilai." : "Isian perlu diperiksa sebelum analisis"}
              </h2>
              {ulang.k.masalah.some((m) => m.sampah) && (
                <p className="text-sm text-rose-800 mt-1">
                  Tidak ada skor yang dihitung. Isian yang gagal: {Array.from(new Set(ulang.k.masalah.filter((m) => m.sampah).map((m) => LABEL[m.isian as keyof Ide] || m.isian))).join(", ")}.
                </p>
              )}
              <p className="text-sm text-muted mt-1">
                Pemeriksa isian menemukan hal di bawah ini (putaran {ulang.k.putaran} dari {ulang.k.batas_putaran}). Perbaiki atau lengkapi isian yang ditandai, lalu kirim ulang.
                {ulang.k.putaran >= ulang.k.batas_putaran && " Setelah putaran ini analisis tetap dijalankan; isian yang masih bermasalah ditandai bukti terbatas, kecuali isian kosong, terlalu pendek, atau acak yang tetap ditolak."}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {ulang.k.masalah.filter((m) => m.jenis === "tolak").map((m, i) => (
                  <li key={"t" + i} className="text-rose-700">{LABEL[m.isian as keyof Ide] || m.isian}: {m.alasan}.</li>
                ))}
                {ulang.k.pertanyaan.map((q, i) => (
                  <li key={"p" + i}>{q.isian === "umum" ? "" : (LABEL[q.isian as keyof Ide] || q.isian) + ": "}{q.pertanyaan}</li>
                ))}
              </ul>
            </section>
          )}

          {BAGIAN.map((b, i) => (
            <section key={b.nomor} className="glass-card sorot rounded-2xl p-6 md:p-7 animate-fade-up" style={{ animationDelay: `${80 + i * 70}ms` }}>
              <div className="flex items-baseline gap-4 border-b border-line pb-4">
                <span className="font-mono text-sm text-faint tnum">{b.nomor}</span>
                <div>
                  <h2 className="text-lg font-medium tracking-tight">{b.judul}</h2>
                  <p className="text-sm text-muted mt-0.5">{b.ket}</p>
                </div>
              </div>
              <div className="mt-5 grid sm:grid-cols-2 gap-x-4 gap-y-5">
                {b.pilihan?.map((p) => (
                  <fieldset key={p.kunci} className="min-w-0">
                    <legend className={labelCls}>{p.label}{p.opsional && opsional}</legend>
                    <p className="text-xs text-faint mt-1 mb-2">{p.bantuan}</p>
                    {catatanIsian(p.kunci)}
                    <div className="relative grid grid-flow-col auto-cols-fr rounded-lg border border-line bg-black/[0.03] p-1 gap-1">
                      <span
                        aria-hidden="true"
                        className="penanda absolute left-1 top-1 bottom-1 rounded-md bg-fg shadow-sm"
                        style={{
                          width: `calc((100% - 0.5rem - ${(p.opsi.length - 1) * 0.25}rem) / ${p.opsi.length})`,
                          transform: `translateX(calc(${Math.max(0, p.opsi.indexOf((ide[p.kunci] || p.opsi[0]) as never))} * (100% + 0.25rem)))`,
                        }}
                      />
                      {p.opsi.map((o) => {
                        const aktif = (ide[p.kunci] || p.opsi[0]) === o;
                        return (
                          <button
                            key={o}
                            type="button"
                            aria-pressed={aktif}
                            onClick={() => ubah(p.kunci, o)}
                            className={`relative rounded-md px-2 py-2 text-sm transition-colors duration-300 focus-ring ${aktif ? "text-white font-medium" : "text-muted hover:text-fg"}`}
                          >
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
                {b.centang && (
                  <fieldset className="min-w-0 sm:col-span-2">
                    <legend className={labelCls}>{b.centang.label}{opsional}</legend>
                    <p className="text-xs text-faint mt-1 mb-2">{b.centang.bantuan}</p>
                    <div className="grid gap-2">
                      {b.centang.opsi.map((o) => (
                        <label key={o} className="flex items-start gap-2.5 text-sm text-fg cursor-pointer">
                          <input type="checkbox" checked={sdm.includes(o)} onChange={() => centang(o)} className="mt-0.5 h-4 w-4 accent-black" />
                          <span>{o}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                {b.kolom.map((k) => (
                  <div key={k.kunci} className={k.lebar ? "sm:col-span-2" : ""}>
                    <label htmlFor={k.kunci} className={labelCls}>
                      {k.label}{k.opsional && opsional}
                    </label>
                    <p className="text-xs text-faint mt-1 mb-2">{k.bantuan}</p>
                    {k.panjang ? (
                      <textarea
                        id={k.kunci}
                        value={ide[k.kunci] || ""}
                        onChange={(e) => ubah(k.kunci, e.target.value)}
                        rows={2}
                        maxLength={300}
                        placeholder={"Contoh: " + k.contoh}
                        className={inputCls + " resize-y"}
                      />
                    ) : (
                      <input
                        id={k.kunci}
                        value={ide[k.kunci] || ""}
                        onChange={(e) => ubah(k.kunci, e.target.value)}
                        placeholder={"Contoh: " + k.contoh}
                        maxLength={160}
                        inputMode={k.angka ? "decimal" : undefined}
                        className={inputCls}
                      />
                    )}
                    {catatanIsian(k.kunci)}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="glass-card rounded-2xl p-6 md:p-7">
            <div className="flex items-baseline gap-4 border-b border-line pb-4">
              <span className="font-mono text-sm text-faint tnum">06</span>
              <div>
                <h2 className="text-lg font-medium tracking-tight">Deskripsi singkat</h2>
                <p className="text-sm text-muted mt-0.5">Cara kerja layanan, plafon, tenor, dan apa yang membedakannya.</p>
              </div>
            </div>
            <label htmlFor="deskripsi" className="sr-only">Deskripsi singkat</label>
            <textarea
              id="deskripsi"
              value={ide.deskripsi}
              onChange={(e) => ubah("deskripsi", e.target.value)}
              rows={5}
              maxLength={1200}
              placeholder="Contoh: Platform pendanaan bersama yang mempertemukan pemberi dana dengan pedagang pasar, tenor 30 hari."
              className={inputCls + " resize-y mt-5"}
            />
            <p className="text-xs text-faint mt-1 text-right tnum">{ide.deskripsi.length}/1200</p>
            {catatanIsian("deskripsi")}
          </section>
        </div>

        {/* Ringkasan di samping */}
        <aside className="lg:sticky lg:top-6 space-y-4">
          <div className="gelap tepi-cahaya rounded-2xl p-6">
            <p className="text-sm text-white/60">Kelengkapan isian</p>
            <p className="mt-2 text-[44px] leading-none font-medium tracking-[-0.03em] tnum">
              {terisi}<span className="text-white/40 text-2xl"> / 17</span>
            </p>
            <div className="mt-4 h-1.5 rounded-full bg-white/15 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={17} aria-valuenow={terisi}>
              <div className="h-full bg-white transition-[width] duration-300" style={{ width: `${(terisi / 17) * 100}%` }} />
            </div>

            {galat && <p className="mt-4 text-sm text-rose-300" role="alert">{galat}</p>}

            <button
              type="submit"
              disabled={kirim}
              className="tombol-utama tombol-terang mt-5 w-full justify-between py-1.5 pl-6 pr-1.5 text-[15px] focus-ring"
            >
              {kirim ? (
                <>
                  <span>Menyiapkan analisis</span>
                  <span className="panah"><Loader2 size={15} className="animate-spin" /></span>
                </>
              ) : (
                <>
                  <Gulir teks="Mulai analisis" />
                  <Panah />
                </>
              )}
            </button>
            <p className="mt-3 text-xs text-white/50 text-center">Selesai dalam 1 sampai 2 menit.</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-sm font-medium">Yang akan dinilai</h2>
            <p className="text-xs text-faint mt-1">10 indikator rubrik dan isian yang menjadi dasarnya.</p>
            {DIMENSI.map((d) => (
              <div key={d.kode} className="mt-4">
                <p className="text-xs text-muted"><span className="font-mono text-fg">{d.kode}</span> {d.nama}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {d.ind.map((i) => {
                    const siap = DASAR[i].perlu.every((k) => isi(k));
                    return (
                      <li key={i} className="flex gap-2 text-[13px] leading-snug">
                        {siap
                          ? <Check size={14} className="mt-0.5 shrink-0 text-fg" aria-hidden="true" />
                          : <Minus size={14} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />}
                        <span className={siap ? "text-fg" : "text-muted"}>
                          {URAIAN_RUBRIK[i]}
                          {!siap && <span className="block text-xs text-faint">{DASAR[i].kosong}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <p className="sr-only">{RUBRIK.length} indikator</p>
          </div>
        </aside>
      </form>
      </div>
    </div>
  );
}
