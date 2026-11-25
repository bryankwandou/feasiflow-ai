// Log bukti untuk penguji: setiap panggilan model, panggilan alat, penolakan pemeriksa, penetapan kode, dan isian
// yang ditolak dicatat ke tabel feasiflow_log. Konteks analisis dibawa AsyncLocalStorage sehingga panggilGemini dan
// agen_() tidak perlu meneruskan id. Baris ditampung lalu ditulis sekaligus di akhir analisis.
// Tanpa DATABASE_URL (lokal dan uji unit) baris disimpan di logMemori sebagai tiruan sql.

import { AsyncLocalStorage } from "node:async_hooks";

export type AgenLog = "Pemeriksa" | "A1" | "A2" | "A3" | "K1" | "K2" | "Kode" | string;
export type JenisLog = "panggilan_model" | "panggilan_alat" | "penolakan_pemeriksa" | "penetapan_kode" | "isian_ditolak";

export interface BarisLog {
  id_analisis: string;
  waktu: string;
  agen: AgenLog;
  jenis: JenisLog;
  versi_prompt: string;
  masukan: string;
  keluaran: string;
  alat: string;
  argumen: string;
  token: number;
  durasi_ms: number;
}

const MAKS = 4000;
/** Buang apa pun yang mirip kunci API atau token sebelum dicatat. */
export function bersihkan(t: unknown): string {
  const s = typeof t === "string" ? t : JSON.stringify(t ?? "");
  return String(s ?? "")
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[kunci disembunyikan]")
    .replace(/\b(sk|pk|ghp|gho|vercel)_[0-9A-Za-z_-]{16,}/gi, "[kunci disembunyikan]")
    .replace(/(x-goog-api-key|authorization|api[_-]?key|token|password|sandi)("?\s*[:=]\s*"?)[^\s",}]+/gi, "$1$2[disembunyikan]")
    .slice(0, MAKS);
}

interface Konteks { id: string; versi: string; tampung: BarisLog[] }
const penyimpan = new AsyncLocalStorage<Konteks>();

/** Tiruan sql: dipakai bila DATABASE_URL kosong. */
export const logMemori: BarisLog[] = [];
type Penulis = (rows: BarisLog[]) => Promise<void>;
let penulis: Penulis | null = null;
/** Dipasang oleh simpan.ts (Postgres); uji unit dapat memasang penulis sendiri. */
export function pasangPenulis(p: Penulis | null) { penulis = p; }

async function tulis(rows: BarisLog[]) {
  if (!rows.length) return;
  const adaDb = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  if (!penulis || !adaDb) { logMemori.push(...rows); if (logMemori.length > 5000) logMemori.splice(0, logMemori.length - 5000); return; }
  try { await penulis(rows); } catch (e) { console.error("log:", String(e).slice(0, 200)); }
}

/** Jalankan fn dalam konteks log satu analisis; baris ditulis setelah fn selesai atau gagal. */
export async function denganLog<T>(id: string, versi: string, fn: () => Promise<T>): Promise<T> {
  const k: Konteks = { id, versi, tampung: [] };
  try {
    return await penyimpan.run(k, fn);
  } finally {
    await tulis(k.tampung.splice(0));
  }
}

/** Catat satu baris. Di luar konteks analisis baris langsung ditulis (misalnya isian ditolak). */
export function catatLog(b: Partial<BarisLog> & { agen: AgenLog; jenis: JenisLog }, id?: string): Promise<void> | void {
  const k = penyimpan.getStore();
  const baris: BarisLog = {
    id_analisis: id || k?.id || "",
    waktu: new Date().toISOString(),
    agen: b.agen,
    jenis: b.jenis,
    versi_prompt: b.versi_prompt || k?.versi || "",
    masukan: bersihkan(b.masukan ?? ""),
    keluaran: bersihkan(b.keluaran ?? ""),
    alat: String(b.alat ?? "").slice(0, 80),
    argumen: bersihkan(b.argumen ?? "").slice(0, 1000),
    token: Math.round(Number(b.token) || 0),
    durasi_ms: Math.round(Number(b.durasi_ms) || 0),
  };
  if (k && !id) { k.tampung.push(baris); return; }
  return tulis([baris]);
}

/** Nama agen log dari nama agen internal ("A1+", "A2 revisi" -> A1, A2; "Pembanding" -> K1). */
export function agenLog(nama: string): AgenLog {
  if (/^pemeriksa/i.test(nama)) return "Pemeriksa";
  if (/^pembanding/i.test(nama)) return "K1";
  if (/^K2/.test(nama)) return "K2";
  const m = /^A[123]/.exec(nama);
  return m ? m[0] : nama;
}

export function konteksLog() { return penyimpan.getStore(); }

/** Ubah baris log ke CSV (RFC 4180). */
export function keCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const kolom = Object.keys(rows[0]);
  const sel = (v: unknown) => { const s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [kolom.join(","), ...rows.map((r) => kolom.map((c) => sel(r[c])).join(","))].join("\r\n");
}
