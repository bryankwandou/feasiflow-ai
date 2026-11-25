// Agen pemeriksa isian: mencegah isian sampah masuk ke analisis (garbage in, garbage out).
// Tiga lapis: (1) periksaKode, aturan kode murni; (2) periksaAgen, satu panggilan Gemini;
// (3) tanya balik, API mengembalikan "perlu_klarifikasi" paling banyak BATAS_PUTARAN kali.
// Dipasang sama di ketiga route (run, satu-agen, pembanding) agar perbandingan K1/K2/K3 adil.

import { LUAR_LPBBTI, LUAR_PRODUK } from "./aturan";
import { bacaAngka } from "./dinamis";
import { kataDikenal, wilayahDikenal } from "./kamus";
import { catatLog } from "./log";
import { panggilGemini, type Pakai } from "./gemini";
import type { CatatanPemeriksaanIsian, Ide, MasalahIsian, PertanyaanIsian } from "./tipe";

/** Semua kunci formulir 17 isian (isian 15 dan 17 memakai beberapa kunci). */
export const KUNCI_IDE: (keyof Ide)[] = [
  "jenis", "produk", "segmen", "wilayah", "saluran", "pendapatan", "biaya", "rencana_gagal_bayar", "rencana_data", "tahap", "deskripsi",
  "bentuk_hukum", "modal_disetor", "rencana_sdm", "layanan", "tempat", "calon_pelanggan", "pendapatan_bulanan", "biaya_bulanan", "biaya_awal",
];

export const WAJIB: (keyof Ide)[] = ["produk", "segmen", "wilayah", "pendapatan", "deskripsi"];
const PANJANG_MIN: Partial<Record<keyof Ide, number>> = { produk: 3, segmen: 3, wilayah: 3, pendapatan: 3, deskripsi: 20 };
/** Isian angka dan satuan bawaannya, beserta batas atas yang masih masuk akal. */
const ANGKA: { kunci: keyof Ide; satuan: "juta" | "miliar"; maks: number }[] = [
  { kunci: "pendapatan_bulanan", satuan: "juta", maks: 1_000_000 },
  { kunci: "biaya_bulanan", satuan: "juta", maks: 1_000_000 },
  { kunci: "biaya_awal", satuan: "juta", maks: 10_000_000 },
  { kunci: "modal_disetor", satuan: "miliar", maks: 100_000 },
];
/** Isian pilihan dan centang: nilainya dari tombol, jadi tidak diperiksa sebagai teks bebas. */
const PILIHAN: (keyof Ide)[] = ["jenis", "tahap", "bentuk_hukum", "layanan", "rencana_sdm"];
const TEKS: (keyof Ide)[] = KUNCI_IDE.filter((k) => !PILIHAN.includes(k) && !ANGKA.some((a) => a.kunci === k));

/** Contoh pada formulir (app/analyze/page.tsx). Placeholder tertulis "Contoh: " + teks ini. */
export const CONTOH_FORMULIR: Partial<Record<keyof Ide, string>> = {
  produk: "Pinjaman modal kerja harian",
  segmen: "Pedagang pasar tradisional",
  wilayah: "Sulawesi Selatan",
  saluran: "Agen lapangan dan aplikasi",
  tempat: "Kantor di Makassar dan pos agen di 5 pasar",
  calon_pelanggan: "120 pedagang Pasar Terong yang sudah mendaftar",
  pendapatan: "Biaya layanan per pencairan",
  biaya: "Komisi agen, teknologi, penagihan",
  rencana_gagal_bayar: "Penilaian kelayakan dari riwayat setoran, penagihan harian, asuransi kredit",
  rencana_data: "Data dienkripsi dan hanya dipakai dengan persetujuan peminjam",
  deskripsi: "Platform pendanaan bersama yang mempertemukan pemberi dana dengan pedagang pasar, tenor 30 hari.",
};

/** Putaran tanya balik paling banyak; pada putaran berikutnya analisis tetap jalan (kecuali teks sampah). */
export const BATAS_PUTARAN = 2;

/** Pesan untuk isian yang ditolak mutlak: kosong, terlalu pendek, acak, atau tidak bermakna. Tidak ada skor sama sekali. */
export const PESAN_SAMPAH = "Isian ditolak sebelum analisis: ada isian yang kosong, terlalu pendek, acak, atau tidak bermakna. Ide tidak dinilai dan Gemini tidak dipanggil";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const nilai = (ide: Partial<Ide>, k: keyof Ide) => String(ide[k] ?? "").trim();

const KETIKAN_ACAK = /asdf|qwert|zxcv|sdfg|dfgh|fghj|ghjk|hjkl|uiop|yuio|wasd/i;
const LOREM = /lorem|ipsum|dolor sit|consectetur adipiscing/i;
const KATA_KOSONG = /^(tes|test|testing|coba|cobacoba|abc|abcd|xxx+|x|aaa+|null|undefined|n\/?a|-+|\.+|\?+|isi|isian|apa aja|terserah|bebas|123+|1234+)$/i;

/** Alasan bila teks tampak sampah; kosong bila wajar. */
export function alasanSampah(teks: string): string {
  const t = teks.trim();
  if (!t) return "";
  if (LOREM.test(t)) return "berisi teks pengisi lorem ipsum";
  if (KATA_KOSONG.test(norm(t).replace(/\s/g, ""))) return "berisi kata uji, bukan isi sebenarnya";
  if (KETIKAN_ACAK.test(t.replace(/\s/g, ""))) return "berisi ketikan acak papan ketik";
  if (/([a-zÀ-ɏ])\1{3,}/i.test(t)) return "berisi huruf yang diulang-ulang";
  const huruf = t.toLowerCase().replace(/[^a-zÀ-ɏ]/g, "");
  if (huruf.length >= 8 && new Set(huruf).size <= 3) return "keragaman hurufnya terlalu rendah";
  if (huruf.length >= 30 && new Set(huruf).size / Math.min(huruf.length, 60) < 0.12) return "keragaman hurufnya terlalu rendah";
  const kata = norm(t).split(/[^a-z0-9À-ɏ]+/).filter(Boolean);
  if (kata.length >= 4 && new Set(kata).size / kata.length < 0.34) return "berisi kata yang sama diulang-ulang";
  // Kata panjang tanpa huruf hidup (misalnya "sdfghjkl") hampir pasti ketikan acak.
  const tanpaVokal = kata.filter((w) => /^[a-zÀ-ɏ]{6,}$/.test(w) && !/[aiueoy]/i.test(w));
  if (tanpaVokal.length && tanpaVokal.length >= Math.ceil(kata.length / 2)) return "berisi ketikan acak tanpa huruf hidup";
  return "";
}

/** Isian teks yang wajib memuat sedikitnya satu kata dikenal (kamus kecil + KBBI dasar). */
const PERLU_KATA: (keyof Ide)[] = ["produk", "segmen", "saluran", "pendapatan", "biaya", "deskripsi", "rencana_gagal_bayar", "rencana_data", "calon_pelanggan", "tempat"];

/** Pemeriksaan deterministik tanpa LLM: rasio huruf hidup, angka-huruf campur acak, kata dikenal, dan wilayah Indonesia. */
export function alasanTakBermakna(k: keyof Ide, v: string): string {
  const token = v.split(/[^A-Za-z0-9À-ɏ-]+/).filter(Boolean);
  for (const w of token) {
    if (/[a-z]/i.test(w) && /\d/.test(w) && (w.match(/[a-z]+|\d+/gi) || []).length >= 4) return "berisi campuran huruf dan angka acak";
    const huruf = w.replace(/[^a-z]/gi, "");
    if (huruf.length >= 4) {
      const vokal = (huruf.match(/[aiueo]/gi) || []).length / huruf.length;
      if (vokal < 0.2) return "huruf hidupnya terlalu sedikit untuk kata yang bermakna";
    }
  }
  if (k === "wilayah") return wilayahDikenal(v) ? "" : "wilayah tidak dikenali sebagai provinsi, kabupaten, atau kota di Indonesia";
  if (PERLU_KATA.includes(k)) {
    const kata = token.filter((w) => /[a-z]/i.test(w));
    const dikenal = kata.filter(kataDikenal).length;
    if (kata.length && !dikenal && !(k === "tempat" && wilayahDikenal(v))) return "tidak memuat kata bahasa Indonesia atau Inggris yang dikenal";
    // Deskripsi panjang yang hanya diselipi satu-dua kata dikenal (misalnya "pinjaman JUIIHLUHLIUHY KJHKJH") tetap acak.
    if (k === "deskripsi" && kata.length >= 4 && (dikenal < 2 || dikenal / kata.length < 0.2)) return "sebagian besar kata tidak bermakna";
  }
  return "";
}

export interface HasilPeriksa {
  lolos: boolean;
  masalah: MasalahIsian[];
}

/** Lapis 1: aturan kode murni, tanpa jaringan. Lolos bila tidak ada masalah berjenis "tolak". */
export function periksaKode(ide: Partial<Ide>): HasilPeriksa {
  const masalah: MasalahIsian[] = [];
  const tambah = (isian: string, alasan: string, jenis: MasalahIsian["jenis"], sampah = false) => {
    if (masalah.some((m) => m.isian === isian && m.jenis === "tolak")) return;
    masalah.push({ isian, alasan, jenis, ...(sampah ? { sampah: true } : {}) });
  };

  // Isian wajib dan panjang minimal: selalu ditolak (sampah = mutlak), berapa pun putarannya, tanpa memanggil Gemini.
  for (const k of WAJIB) {
    const v = nilai(ide, k);
    if (!v) tambah(k, "isian wajib masih kosong", "tolak", true);
    else if (v.length < (PANJANG_MIN[k] ?? 1)) tambah(k, `terlalu pendek, sekurang-kurangnya ${PANJANG_MIN[k]} karakter`, "tolak", true);
  }

  // Teks sampah dan salinan placeholder.
  for (const k of TEKS) {
    const v = nilai(ide, k);
    if (!v) continue;
    const contoh = CONTOH_FORMULIR[k];
    if (contoh && (norm(v) === norm("Contoh: " + contoh) || /^contoh\s*:/i.test(v))) {
      tambah(k, "isinya salinan placeholder formulir, bukan ide Anda", "tolak", true);
      continue;
    }
    const alasan = alasanSampah(v) || alasanTakBermakna(k, v);
    if (alasan) { tambah(k, alasan, "tolak", true); continue; }
    if (contoh && norm(v) === norm(contoh)) tambah(k, "isinya sama persis dengan contoh formulir", "peringatan");
  }

  // Isian berbeda yang isinya identik.
  const sudah = new Map<string, keyof Ide>();
  for (const k of TEKS) {
    const v = norm(nilai(ide, k));
    if (v.length < 3) continue;
    const lain = sudah.get(v);
    if (lain) tambah(k, `isinya identik dengan isian ${lain}`, "tolak", true);
    else sudah.set(v, k);
  }

  // Angka terbaca dan masuk akal.
  const angka: Partial<Record<keyof Ide, number>> = {};
  for (const a of ANGKA) {
    const v = nilai(ide, a.kunci);
    if (!v) continue;
    if (/(^|[^\d])-\s*\d|minus/i.test(v)) { tambah(a.kunci, "angka tidak boleh negatif", "tolak"); continue; }
    const n = /\d/.test(v) && !/[a-qs-z]{4,}/i.test(v.replace(/rp|juta|miliar|ribu|triliun/gi, "")) ? bacaAngka(v, a.satuan) : null;
    if (n === null || !Number.isFinite(n)) { tambah(a.kunci, `angka tidak terbaca, tulis bilangan dalam ${a.satuan} rupiah, misalnya 60`, "tolak"); continue; }
    if (n > a.maks) tambah(a.kunci, `angka ${n.toLocaleString("id-ID")} ${a.satuan} rupiah tidak wajar, periksa satuannya`, "peringatan");
    angka[a.kunci] = n;
  }

  // Konsistensi proyeksi: BEP hanya terhitung bila pendapatan per bulan melebihi biaya per bulan.
  const p = angka.pendapatan_bulanan, b = angka.biaya_bulanan;
  if (p !== undefined && b !== undefined && p <= b) {
    tambah("pendapatan_bulanan", "pendapatan per bulan tidak melebihi biaya per bulan, sehingga BEP tidak terhitung", "peringatan");
  }
  if (b === 0) tambah("biaya_bulanan", "biaya per bulan nol tidak wajar untuk penyelenggara LPBBTI", "peringatan");

  // Kegiatan di luar LPBBTI tidak ditolak di sini: dinilai aturan gugur D3a yang sama dengan pipeline.
  const semua = KUNCI_IDE.map((k) => nilai(ide, k)).join(" ");
  if (LUAR_LPBBTI.test(semua) || LUAR_PRODUK.test(nilai(ide, "produk"))) {
    tambah("produk", "ide menyebut kegiatan di luar LPBBTI; akan dinilai aturan gugur D3a", "peringatan");
  }

  return { lolos: !masalah.some((m) => m.jenis === "tolak"), masalah };
}

// ── Lapis 2: agen ────────────────────────────────────────────────────────

export interface HasilAgen {
  masalah: MasalahIsian[];
  pertanyaan: PertanyaanIsian[];
  terbatas: string[];
}

export type PanggilAgen = typeof panggilGemini;

export const PERAN_PEMERIKSA =
  "Kamu agen pemeriksa isian formulir ide usaha LPBBTI (pendanaan bersama berbasis teknologi informasi, POJK 40/2024) di Indonesia. " +
  "Tugasmu hanya menilai mutu isian sebelum analisis kelayakan, bukan menilai kelayakan. Nilai: (1) apakah ide memang layanan pendanaan/pinjaman LPBBTI; " +
  "(2) apakah segmen penerima dana dan wilayah cukup spesifik (wilayah sebaiknya nama provinsi atau kota di Indonesia); (3) apakah ada isian yang saling bertentangan. " +
  "Jangan menolak ide karena kripto, token, atau kontrak pintar: itu dinilai aturan lain. Jangan bertanya hal yang sudah dijawab isian. " +
  "Tulis pertanyaan klarifikasi paling banyak 3, singkat, bahasa Indonesia, hanya untuk isian yang benar-benar kabur atau bertentangan. " +
  "Balas HANYA JSON: {\"lpbbti\": true|false, \"masalah\": [{\"isian\": kunci, \"alasan\": teks}], \"pertanyaan\": [{\"isian\": kunci, \"pertanyaan\": teks}], \"terbatas\": [kunci]}. " +
  "Kunci isian yang sah: " + KUNCI_IDE.join(", ") + ".";

function ambilJson(t: string): Record<string, unknown> {
  const m = /\{[\s\S]*\}/.exec(t || "");
  if (!m) throw new Error("jawaban agen bukan JSON");
  return JSON.parse(m[0]);
}

const sahKunci = (k: unknown): string => (typeof k === "string" && (KUNCI_IDE as string[]).includes(k) ? k : "umum");

/** Lapis 2: satu panggilan Gemini, temperature 0, keluaran JSON. Melempar galat bila panggilan gagal. */
export async function periksaAgen(ide: Partial<Ide>, pakai: Record<string, Pakai> = {}, panggil: PanggilAgen = panggilGemini): Promise<HasilAgen> {
  const isian = Object.fromEntries(KUNCI_IDE.map((k) => [k, nilai(ide, k)]).filter(([, v]) => v));
  const j = await panggil("Pemeriksa isian", pakai, {
    sistem: PERAN_PEMERIKSA,
    isi: [{ role: "user", parts: [{ text: "ISIAN: " + JSON.stringify(isian) }] }],
    json: true,
    maksKeluar: 700,
  });
  const d = ambilJson(j.teks);
  const masalah: MasalahIsian[] = [];
  if (d.lpbbti === false) masalah.push({ isian: "produk", alasan: "agen menilai ide mungkin bukan layanan LPBBTI; dinilai aturan gugur D3a", jenis: "peringatan" });
  for (const m of Array.isArray(d.masalah) ? d.masalah : []) {
    const x = m as Record<string, unknown>;
    if (typeof x?.alasan === "string" && x.alasan.trim()) masalah.push({ isian: sahKunci(x.isian), alasan: x.alasan.trim().slice(0, 200), jenis: "peringatan" });
  }
  const pertanyaan: PertanyaanIsian[] = [];
  for (const q of Array.isArray(d.pertanyaan) ? d.pertanyaan : []) {
    const x = q as Record<string, unknown>;
    if (typeof x?.pertanyaan === "string" && x.pertanyaan.trim()) pertanyaan.push({ isian: sahKunci(x.isian), pertanyaan: x.pertanyaan.trim().slice(0, 200) });
    if (pertanyaan.length >= 3) break;
  }
  const terbatas = Array.from(new Set((Array.isArray(d.terbatas) ? d.terbatas : []).map(sahKunci).filter((k) => k !== "umum")));
  return { masalah: masalah.slice(0, 6), pertanyaan, terbatas };
}

// ── Lapis 3: tanya balik ─────────────────────────────────────────────────

export interface Gerbang {
  status: "lanjut" | "perlu_klarifikasi" | "mati";
  catatan?: CatatanPemeriksaanIsian;
  /** Ide yang diteruskan ke analisis: angka yang tidak terbaca dikosongkan agar dinilai bukti terbatas. */
  ide: Ide;
}

export const pemeriksaAktif = () => process.env.PEMERIKSA_ISIAN !== "0";

/** Baca isian dari badan permintaan: semua kunci formulir, dipangkas 1200 karakter. */
export function bacaIde(p: Partial<Record<keyof Ide, unknown>>): Ide {
  return Object.fromEntries(
    KUNCI_IDE.map((k) => [k, String(p[k] ?? "").trim().slice(0, 1200)] as const).filter(([, v]) => v),
  ) as unknown as Ide;
}

/** Gabungan tiga lapis. putaran dimulai dari 1 dan dikirim ulang formulir pada tiap tanya balik. */
export async function periksaIsian(
  ide: Ide,
  putaranMasuk: unknown,
  opsi: { pakai?: Record<string, Pakai>; panggil?: PanggilAgen } = {},
): Promise<Gerbang> {
  if (!pemeriksaAktif()) return { status: "mati", ide };
  const putaran = Math.max(1, Math.min(9, Math.floor(Number(putaranMasuk) || 1)));
  const kode = periksaKode(ide);
  const catatan: string[] = [];
  let agen: HasilAgen = { masalah: [], pertanyaan: [], terbatas: [] };
  const sampah = kode.masalah.filter((m) => m.sampah);
  const kodeTolak = kode.masalah.some((m) => m.jenis === "tolak");
  // Teks sampah (dan isian yang pasti dikembalikan lapis kode pada putaran ini) ditolak tanpa memanggil Gemini.
  if (!sampah.length && !(kodeTolak && putaran <= BATAS_PUTARAN)) {
    try {
      agen = await periksaAgen(ide, opsi.pakai, opsi.panggil);
    } catch (e) {
      catatan.push("Agen pemeriksa gagal, hanya lapis kode yang dipakai: " + String(e).slice(0, 160));
    }
  }
  const masalah = [...kode.masalah, ...agen.masalah];
  const tolak = masalah.filter((m) => m.jenis === "tolak");
  const pertanyaan = agen.pertanyaan.slice(0, 3);
  const perlu = sampah.length > 0 || ((tolak.length > 0 || pertanyaan.length > 0) && putaran <= BATAS_PUTARAN);
  const terbatas = Array.from(new Set([...tolak.map((m) => m.isian), ...agen.terbatas, ...(perlu ? [] : pertanyaan.map((q) => q.isian))])).filter((k) => k !== "umum");
  const hasil: CatatanPemeriksaanIsian = { putaran, masalah, pertanyaan, ditandaiTerbatas: perlu ? [] : terbatas, ...(catatan.length ? { catatan } : {}) };
  if (perlu) {
    catatLog({
      agen: "Pemeriksa", jenis: "isian_ditolak", masukan: JSON.stringify(ide),
      keluaran: (sampah.length ? PESAN_SAMPAH + ". " : "Perlu klarifikasi. ") + JSON.stringify({ putaran, masalah, pertanyaan }),
    });
    return { status: "perlu_klarifikasi", catatan: hasil, ide };
  }
  // Angka yang tetap tak terbaca atau negatif dikosongkan: isian kosong dinilai 50 sebagai bukti terbatas.
  const bersih = { ...ide };
  for (const m of tolak) if (ANGKA.some((a) => a.kunci === m.isian)) delete bersih[m.isian as keyof Ide];
  return { status: "lanjut", catatan: hasil, ide: bersih };
}

/** Badan jawaban API untuk tanya balik. */
export const jawabanKlarifikasi = (g: Gerbang) => ({
  status: "perlu_klarifikasi" as const,
  putaran: g.catatan!.putaran,
  batas_putaran: BATAS_PUTARAN,
  /** Teks sampah: tidak ada skor sama sekali. */
  ...(g.catatan!.masalah.some((m) => m.sampah) ? { pesan: PESAN_SAMPAH, isian_gagal: Array.from(new Set(g.catatan!.masalah.filter((m) => m.sampah).map((m) => m.isian))) } : {}),
  masalah: g.catatan!.masalah,
  pertanyaan: g.catatan!.pertanyaan,
});
