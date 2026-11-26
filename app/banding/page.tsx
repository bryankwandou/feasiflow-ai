"use client";

// Banding 2 sampai 5 ide. Tiap ide dijalankan satu per satu lewat API yang sudah ada
// (/api/analyze lalu /api/run), sehingga pemeriksa isian dan sistem 3 agen tetap sama.
// Peringkat dihitung di peramban dengan SAW (lib/tiga-agen/banding-ide.ts), tanpa panggilan Gemini tambahan.

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { peringkatSAW, MAKS_IDE, MIN_IDE, type HasilBanding } from "@/lib/tiga-agen/banding-ide";
import { BENTUK_HUKUM, RUBRIK, URAIAN_RUBRIK, type HasilAnalisis, type Ide } from "@/lib/tiga-agen/tipe";
import KendaliHeader from "@/components/KendaliHeader";

type Status = "siap" | "berjalan" | "selesai" | "klarifikasi" | "ditolak" | "gagal";
type Masalah = { isian: string; alasan: string; jenis: "tolak" | "peringatan"; sampah?: boolean };
type Pertanyaan = { isian: string; pertanyaan: string };

interface KartuIde {
  kunci: string;
  nama: string;
  ide: Partial<Ide>;
  status: Status;
  putaran: number;
  progres: number;
  pesan?: string;
  masalah?: Masalah[];
  pertanyaan?: Pertanyaan[];
  sessionId?: string;
  hasil?: HasilAnalisis;
}

const SIMPAN = "banding_v1";
const WAJIB: (keyof Ide)[] = ["produk", "segmen", "wilayah", "pendapatan", "deskripsi"];
const KOLOM: { kunci: keyof Ide; label: string; contoh: string; panjang?: boolean; wajib?: boolean; angka?: boolean }[] = [
  { kunci: "produk", label: "Produk pendanaan", contoh: "Pinjaman modal kerja harian", wajib: true },
  { kunci: "segmen", label: "Segmen penerima dana", contoh: "Pedagang pasar tradisional", wajib: true },
  { kunci: "wilayah", label: "Wilayah sasaran (provinsi)", contoh: "Sulawesi Selatan", wajib: true },
  { kunci: "pendapatan", label: "Sumber pendapatan", contoh: "Biaya layanan 3% per pencairan", wajib: true },
  { kunci: "deskripsi", label: "Deskripsi singkat", contoh: "Platform pendanaan bersama untuk pedagang pasar, tenor 30 hari.", panjang: true, wajib: true },
  { kunci: "saluran", label: "Saluran distribusi", contoh: "Agen lapangan dan aplikasi" },
  { kunci: "biaya", label: "Biaya utama", contoh: "Komisi agen Rp20 juta per bulan, teknologi, penagihan" },
  { kunci: "rencana_gagal_bayar", label: "Rencana gagal bayar", contoh: "Penilaian kelayakan, penagihan harian, asuransi kredit", panjang: true },
  { kunci: "rencana_data", label: "Rencana perlindungan data", contoh: "Data dienkripsi dan hanya dipakai dengan persetujuan", panjang: true },
  { kunci: "modal_disetor", label: "Modal disetor (miliar rupiah)", contoh: "25", angka: true },
  { kunci: "pendapatan_bulanan", label: "Pendapatan per bulan (juta rupiah)", contoh: "60", angka: true },
  { kunci: "biaya_bulanan", label: "Biaya per bulan (juta rupiah)", contoh: "45", angka: true },
];

let hitungKunci = 0;
const kartuBaru = (n: number): KartuIde => ({
  kunci: `k${Date.now()}_${hitungKunci++}`,
  nama: `Ide ${n}`,
  ide: { jenis: "Produktif", tahap: "Ide" },
  status: "siap",
  putaran: 1,
  progres: 0,
});

const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isi = (k: KartuIde, f: keyof Ide) => String(k.ide[f] ?? "").trim();
const angka = (x: number) => x.toFixed(1).replace(".", ",");

/** Menjalankan satu ide lewat API yang sudah ada. Mengembalikan pembaruan kartu. */
async function jalankanSatu(k: KartuIde, sinyal: AbortSignal, progres: (p: number) => void): Promise<Partial<KartuIde>> {
  // Sesi baru tiap percobaan: id yang pernah ditolak sebagai sampah tidak bisa dimulai ulang.
  const a = await fetch("/api/analyze", { method: "POST", signal: sinyal });
  const { sessionId } = (await a.json()) as { sessionId: string };
  const params = { ...k.ide };
  try { sessionStorage.setItem(`params_${sessionId}`, JSON.stringify(params)); } catch { /* abaikan */ }

  let res: Response;
  for (;;) {
    res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params, sessionId, putaran: k.putaran }),
      signal: sinyal,
    });
    if (res.status !== 503) break;
    await jeda(5000 + Math.random() * 2000);
  }

  if (res.status === 409) {
    for (let i = 0; i < 90 && !sinyal.aborted; i++) {
      await jeda(5000);
      const d = (await (await fetch(`/api/result/${sessionId}`, { cache: "no-store", signal: sinyal })).json()) as { status: string; hasil?: HasilAnalisis; galat?: string };
      if (d.status === "selesai" && d.hasil) return { status: "selesai", hasil: d.hasil, sessionId, progres: 100 };
      if (d.status === "gagal" || d.status === "tidak_ada") return { status: "gagal", pesan: d.galat || "Analisis tidak ditemukan.", sessionId };
    }
    return { status: "gagal", pesan: "Analisis terlalu lama.", sessionId };
  }

  if ((res.headers.get("content-type") || "").includes("application/json")) {
    const d = (await res.json().catch(() => ({}))) as {
      status?: string; error?: string; pesan?: string; isian_gagal?: string[]; putaran?: number; masalah?: Masalah[]; pertanyaan?: Pertanyaan[];
    };
    if (d.status === "perlu_klarifikasi") {
      // Teks sampah: tidak dinilai sama sekali. Selain itu: tanya balik, putaran berikutnya dikirim saat dijalankan ulang.
      if (d.pesan) return { status: "ditolak", pesan: `${d.pesan}: ${(d.isian_gagal || []).join(", ")}`, masalah: d.masalah, pertanyaan: d.pertanyaan, sessionId };
      return { status: "klarifikasi", putaran: (d.putaran || k.putaran) + 1, masalah: d.masalah, pertanyaan: d.pertanyaan, sessionId };
    }
    return { status: "gagal", pesan: d.error || "Server menjawab tanpa aliran analisis.", sessionId };
  }
  if (!res.ok || !res.body) return { status: "gagal", pesan: (await res.text().catch(() => "")).slice(0, 200) || "Server tidak menjawab.", sessionId };

  const pembaca = res.body.getReader();
  const dekoder = new TextDecoder();
  let penampung = "";
  for (;;) {
    const { done, value } = await pembaca.read();
    if (done) break;
    penampung += dekoder.decode(value, { stream: true });
    const potong = penampung.split("\n\n");
    penampung = potong.pop() ?? "";
    for (const p of potong) {
      const baris = p.trim();
      if (!baris.startsWith("data: ")) continue;
      let ev: Record<string, unknown>;
      try { ev = JSON.parse(baris.slice(6)); } catch { continue; }
      if (typeof ev.progress === "number") progres(ev.progress);
      if (ev.event === "agent_error") return { status: "gagal", pesan: String(ev.message || "Galat pada agen.").slice(0, 200), sessionId };
      if (ev.event === "complete" && ev.data) {
        try { sessionStorage.setItem(`hasil_${sessionId}`, JSON.stringify(ev.data)); } catch { /* abaikan */ }
        return { status: "selesai", hasil: ev.data as HasilAnalisis, sessionId, progres: 100 };
      }
    }
  }
  return { status: "gagal", pesan: "Sambungan terputus sebelum analisis selesai.", sessionId };
}

export default function BandingPage() {
  const [kartu, setKartu] = useState<KartuIde[]>(() => [kartuBaru(1), kartuBaru(2)]);
  const [jalan, setJalan] = useState(false);
  const [galat, setGalat] = useState("");
  const pengendali = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SIMPAN);
      if (raw) {
        const k = (JSON.parse(raw) as KartuIde[]).map((x) => (x.status === "berjalan" ? { ...x, status: "siap" as Status, progres: 0 } : x));
        if (k.length >= MIN_IDE) setKartu(k.slice(0, MAKS_IDE));
      }
    } catch { /* abaikan */ }
    return () => pengendali.current?.abort();
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(SIMPAN, JSON.stringify(kartu)); } catch { /* kuota penuh */ }
  }, [kartu]);

  const ubahKartu = (kunci: string, f: (k: KartuIde) => KartuIde) => setKartu((ks) => ks.map((k) => (k.kunci === kunci ? f(k) : k)));
  const ubahIsian = (kunci: string, f: keyof Ide, v: string) =>
    ubahKartu(kunci, (k) => ({ ...k, ide: { ...k.ide, [f]: v }, ...(k.status === "selesai" ? { status: "siap" as Status, hasil: undefined, progres: 0 } : {}) }));

  const selesai = kartu.filter((k) => k.status === "selesai" && k.hasil);
  const banding: HasilBanding | null = useMemo(() => {
    if (selesai.length < MIN_IDE) return null;
    try { return peringkatSAW(selesai.map((k) => ({ nama: k.nama, hasil: k.hasil! }))); } catch { return null; }
  }, [selesai]);

  async function mulai() {
    const kurang = kartu
      .map((k) => {
        const kosong = WAJIB.filter((f) => !isi(k, f));
        const pendek = isi(k, "deskripsi").length > 0 && isi(k, "deskripsi").length < 20;
        return kosong.length || pendek ? `${k.nama}: ${kosong.length ? "belum diisi " + kosong.join(", ") : ""}${pendek ? (kosong.length ? "; " : "") + "deskripsi kurang dari 20 karakter" : ""}` : "";
      })
      .filter(Boolean);
    if (kurang.length) { setGalat(kurang.join(". ") + "."); return; }
    setGalat("");
    setJalan(true);
    const c = new AbortController();
    pengendali.current = c;
    // Satu per satu, agar tidak memenuhi antrian server dan biaya tetap sama dengan analisis tunggal.
    for (const k of kartu) {
      if (k.status === "selesai" || c.signal.aborted) continue;
      ubahKartu(k.kunci, (x) => ({ ...x, status: "berjalan", progres: 0, pesan: undefined }));
      try {
        const baru = await jalankanSatu(k, c.signal, (p) => ubahKartu(k.kunci, (x) => ({ ...x, progres: p })));
        ubahKartu(k.kunci, (x) => ({ ...x, ...baru }));
      } catch (e) {
        if ((e as Error).name === "AbortError") break;
        ubahKartu(k.kunci, (x) => ({ ...x, status: "gagal", pesan: "Sambungan terputus. Jalankan lagi." }));
      }
    }
    setJalan(false);
  }

  const inputCls = "w-full bg-white border border-line rounded-lg px-3 py-2 text-base md:text-[15px] text-fg placeholder:text-faint focus:outline-none focus:border-fg focus:ring-4 focus:ring-black/[0.07]";
  const statusTeks: Record<Status, string> = {
    siap: "Belum dijalankan", berjalan: "Sedang dianalisis", selesai: "Selesai", klarifikasi: "Perlu klarifikasi", ditolak: "Ditolak, tidak dinilai", gagal: "Gagal",
  };

  return (
    <div className="min-h-screen bg-base">
      <header className="gelap">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-10">
          <div className="flex items-center justify-between gap-3">
            <a href="/" className="inline-flex items-center gap-1.5 py-1.5 text-sm text-white/60 hover:text-white focus-ring rounded">
              <ArrowLeft size={15} /> FeasiFlow AI
            </a>
            <KendaliHeader gelap />
          </div>
          <h1 className="mt-8 text-[30px] leading-tight md:text-[44px] font-medium tracking-[-0.03em]">Banding beberapa ide</h1>
          <p className="mt-3 max-w-2xl text-[15px] text-white/65 leading-relaxed">
            Isi {MIN_IDE} sampai {MAKS_IDE} ide. Tiap ide dianalisis satu per satu oleh tiga agen dengan rubrik yang sama, lalu diperingkat dengan
            Simple Additive Weighting: skor tiap indikator dibagi skor tertinggi di antara ide, lalu dijumlah dengan bobot rubrik yang sama.
            Ide yang gugur pada D3a selalu di bawah.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          {kartu.map((k, n) => (
            <section key={k.kunci} className="glass-card rounded-2xl p-5 min-w-0">
              <div className="flex items-center gap-3">
                <input
                  aria-label={`Nama ide ${n + 1}`}
                  value={k.nama}
                  onChange={(e) => ubahKartu(k.kunci, (x) => ({ ...x, nama: e.target.value.slice(0, 80) }))}
                  className="min-w-0 flex-1 bg-transparent text-lg font-medium text-fg border-b border-transparent focus:border-fg focus:outline-none"
                  disabled={jalan}
                />
                {kartu.length > MIN_IDE && !jalan && (
                  <button type="button" onClick={() => setKartu((ks) => ks.filter((x) => x.kunci !== k.kunci))} className="p-2 text-muted hover:text-fg focus-ring rounded" aria-label={`Hapus ${k.nama}`}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className={`mt-1 text-sm ${k.status === "gagal" || k.status === "ditolak" ? "text-rose-700" : k.status === "klarifikasi" ? "text-amber-700" : "text-muted"}`}>
                {statusTeks[k.status]}
                {k.status === "berjalan" && <> <Loader2 size={13} className="inline animate-spin" aria-hidden="true" /> {k.progres}%</>}
                {k.status === "selesai" && k.hasil && <> · S {angka(k.hasil.S)}, {k.hasil.kelas}</>}
                {k.pesan && <> · {k.pesan}</>}
              </p>
              {(k.masalah?.length || k.pertanyaan?.length) && k.status !== "selesai" ? (
                <ul className="mt-2 space-y-1 text-[13px] leading-snug">
                  {(k.masalah || []).map((m, i) => (
                    <li key={"m" + i} className={m.jenis === "tolak" ? "text-rose-700" : "text-amber-700"}>{m.isian}: {m.alasan}.</li>
                  ))}
                  {(k.pertanyaan || []).map((q, i) => <li key={"q" + i} className="text-fg">{q.isian === "umum" ? "" : q.isian + ": "}{q.pertanyaan}</li>)}
                  {k.status === "klarifikasi" && <li className="text-muted">Perbaiki isian lalu jalankan lagi; setelah putaran batas, analisis tetap jalan kecuali teks sampah.</li>}
                </ul>
              ) : null}

              <div className="mt-4 space-y-3">
                {KOLOM.filter((c) => c.wajib).map((c) => (
                  <label key={c.kunci} className="block">
                    <span className="block text-sm font-medium text-fg">{c.label}</span>
                    {c.panjang ? (
                      <textarea rows={3} className={inputCls + " mt-1 resize-y"} placeholder={"Contoh: " + c.contoh} value={String(k.ide[c.kunci] ?? "")} onChange={(e) => ubahIsian(k.kunci, c.kunci, e.target.value)} disabled={jalan} />
                    ) : (
                      <input className={inputCls + " mt-1"} placeholder={"Contoh: " + c.contoh} value={String(k.ide[c.kunci] ?? "")} onChange={(e) => ubahIsian(k.kunci, c.kunci, e.target.value)} disabled={jalan} />
                    )}
                  </label>
                ))}
                <details className="rounded-lg border border-line bg-white/60 px-3 py-2">
                  <summary className="cursor-pointer text-sm text-muted">Isian opsional (makin lengkap, makin sedikit yang ditebak agen)</summary>
                  <div className="mt-3 space-y-3">
                    <label className="block">
                      <span className="block text-sm font-medium text-fg">Bentuk badan hukum</span>
                      <select className={inputCls + " mt-1"} value={String(k.ide.bentuk_hukum ?? "")} onChange={(e) => ubahIsian(k.kunci, "bentuk_hukum", e.target.value)} disabled={jalan}>
                        <option value="">Belum ditentukan</option>
                        {BENTUK_HUKUM.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </label>
                    {KOLOM.filter((c) => !c.wajib).map((c) => (
                      <label key={c.kunci} className="block">
                        <span className="block text-sm font-medium text-fg">{c.label}</span>
                        {c.panjang ? (
                          <textarea rows={2} className={inputCls + " mt-1 resize-y"} placeholder={"Contoh: " + c.contoh} value={String(k.ide[c.kunci] ?? "")} onChange={(e) => ubahIsian(k.kunci, c.kunci, e.target.value)} disabled={jalan} />
                        ) : (
                          <input inputMode={c.angka ? "decimal" : undefined} className={inputCls + " mt-1"} placeholder={"Contoh: " + c.contoh} value={String(k.ide[c.kunci] ?? "")} onChange={(e) => ubahIsian(k.kunci, c.kunci, e.target.value)} disabled={jalan} />
                        )}
                      </label>
                    ))}
                  </div>
                </details>
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {kartu.length < MAKS_IDE && !jalan && (
            <button type="button" onClick={() => setKartu((ks) => [...ks, kartuBaru(ks.length + 1)])} className="tombol-garis inline-flex items-center gap-1.5 rounded-full border border-fg px-4 py-2 text-sm font-medium focus-ring">
              <Plus size={15} /> Tambah ide
            </button>
          )}
          <button type="button" onClick={mulai} disabled={jalan} className="inline-flex items-center gap-2 rounded-full bg-fg text-white px-5 py-2.5 text-sm font-medium focus-ring disabled:opacity-60">
            {jalan && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {jalan ? "Menganalisis satu per satu" : selesai.length ? "Jalankan ide yang belum selesai" : `Analisis dan bandingkan ${kartu.length} ide`}
          </button>
          {jalan && (
            <button type="button" onClick={() => pengendali.current?.abort()} className="text-sm text-muted underline focus-ring rounded">Hentikan</button>
          )}
        </div>
        {galat && <p className="text-sm text-rose-700" role="alert">{galat}</p>}

        {banding ? (
          <section className="glass-card rounded-2xl p-5 md:p-6 min-w-0">
            <h2 className="text-xl font-medium text-fg">Peringkat</h2>
            <p className="mt-1 text-sm text-muted">
              Nilai SAW V = jumlah bobot x (skor / skor tertinggi) pada {banding.indikator.length} indikator, bobot sama {angka(100 / banding.indikator.length)}%.
              Kelas tetap dari skor rubrik S. {banding.catatan.join(" ")}
              {selesai.length < kartu.length && ` ${kartu.length - selesai.length} ide belum dinilai dan tidak ikut diperingkat.`}
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm tnum border-collapse">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Ide</th>
                    <th className="py-2 pr-3 font-medium">V</th>
                    <th className="py-2 pr-3 font-medium">S</th>
                    <th className="py-2 pr-3 font-medium">Kelas</th>
                    {banding.indikator.map((i) => <th key={i} className="py-2 pr-2 font-medium" title={URAIAN_RUBRIK[i]}>{i}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {banding.baris.map((b) => (
                    <tr key={b.urutan_masuk} className="border-b border-line align-top">
                      <td className="py-2 pr-3">{b.peringkat}</td>
                      <td className="py-2 pr-3 font-medium text-fg">
                        {b.session_id ? <a href={`/analyze/${b.session_id}`} className="underline focus-ring rounded">{b.nama}</a> : b.nama}
                        {b.gugur && <span className="block text-xs font-normal text-rose-700">gugur D3a</span>}
                      </td>
                      <td className="py-2 pr-3 font-medium">{angka(b.V)}</td>
                      <td className="py-2 pr-3">{angka(b.S)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{b.kelas}</td>
                      {banding.indikator.map((i) => (
                        <td key={i} className={`py-2 pr-2 ${b.normal[i] === 1 && b.skor[i]! > 0 ? "font-semibold text-fg" : "text-muted"}`}>{b.skor[i]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ol className="mt-5 space-y-3">
              {banding.baris.map((b) => (
                <li key={b.urutan_masuk} className="text-sm leading-relaxed">
                  <span className="font-medium text-fg">{b.peringkat}. {b.nama}</span>
                  <ul className="mt-1 list-disc pl-5 text-muted">
                    {b.alasan.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <p className="text-sm text-muted">
            Peringkat muncul setelah sekurang-kurangnya {MIN_IDE} ide selesai dianalisis. Isian sampah tetap ditolak pemeriksa isian dan tidak ikut diperingkat.
            Indikator yang dibandingkan: {RUBRIK.join(", ")}.
          </p>
        )}
      </main>
    </div>
  );
}
