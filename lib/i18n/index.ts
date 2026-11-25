// Sistem multibahasa ringan tanpa dependensi: kamus statis per bahasa, fungsi t(), dan deteksi bahasa.
// Bahasa Indonesia (id) adalah sumber dan cadangan untuk setiap kunci yang hilang.
import id from "./kamus/id";

export type Kunci = keyof typeof id;
export type Kamus = Record<Kunci, string>;
export type Variabel = Record<string, string | number>;

/** Daftar bahasa. `lokal` dipakai untuk Intl (angka/tanggal), `arah` untuk atribut dir pada <html>. */
export const BAHASA = [
  { kode: "id", nama: "Bahasa Indonesia", lokal: "id-ID", arah: "ltr" },
  { kode: "en", nama: "English", lokal: "en-US", arah: "ltr" },
  { kode: "ms", nama: "Bahasa Melayu", lokal: "ms-MY", arah: "ltr" },
  { kode: "jv", nama: "Basa Jawa", lokal: "jv-ID", arah: "ltr" },
  { kode: "su", nama: "Basa Sunda", lokal: "su-ID", arah: "ltr" },
  { kode: "zh", nama: "中文（简体）", lokal: "zh-CN", arah: "ltr" },
  { kode: "ja", nama: "日本語", lokal: "ja-JP", arah: "ltr" },
  { kode: "ko", nama: "한국어", lokal: "ko-KR", arah: "ltr" },
  { kode: "ar", nama: "العربية", lokal: "ar", arah: "rtl" },
  { kode: "hi", nama: "हिन्दी", lokal: "hi-IN", arah: "ltr" },
  { kode: "th", nama: "ไทย", lokal: "th-TH", arah: "ltr" },
  { kode: "vi", nama: "Tiếng Việt", lokal: "vi-VN", arah: "ltr" },
  { kode: "tl", nama: "Filipino", lokal: "fil-PH", arah: "ltr" },
  { kode: "es", nama: "Español", lokal: "es-ES", arah: "ltr" },
  { kode: "fr", nama: "Français", lokal: "fr-FR", arah: "ltr" },
  { kode: "de", nama: "Deutsch", lokal: "de-DE", arah: "ltr" },
  { kode: "pt", nama: "Português", lokal: "pt-BR", arah: "ltr" },
  { kode: "ru", nama: "Русский", lokal: "ru-RU", arah: "ltr" },
  { kode: "it", nama: "Italiano", lokal: "it-IT", arah: "ltr" },
  { kode: "nl", nama: "Nederlands", lokal: "nl-NL", arah: "ltr" },
  { kode: "tr", nama: "Türkçe", lokal: "tr-TR", arah: "ltr" },
  { kode: "bn", nama: "বাংলা", lokal: "bn-BD", arah: "ltr" },
] as const;

export type KodeBahasa = (typeof BAHASA)[number]["kode"];
export const BAWAAN: KodeBahasa = "id";
export const KUNCI_SIMPAN = "feasiflow.bahasa";

const KODE = new Set<string>(BAHASA.map((b) => b.kode));
export const adalahKode = (x: unknown): x is KodeBahasa => typeof x === "string" && KODE.has(x);
export const infoBahasa = (kode: KodeBahasa) => BAHASA.find((b) => b.kode === kode) ?? BAHASA[0];
export const arahBahasa = (kode: KodeBahasa): "ltr" | "rtl" => infoBahasa(kode).arah;
export const lokalBahasa = (kode: KodeBahasa): string => infoBahasa(kode).lokal;

// Kamus selain id dimuat saat dibutuhkan (dynamic import) supaya bundle awal tetap kecil.
const PEMUAT: Record<Exclude<KodeBahasa, "id">, () => Promise<{ default: Kamus }>> = {
  en: () => import("./kamus/en"),
  ms: () => import("./kamus/ms"),
  jv: () => import("./kamus/jv"),
  su: () => import("./kamus/su"),
  zh: () => import("./kamus/zh"),
  ja: () => import("./kamus/ja"),
  ko: () => import("./kamus/ko"),
  ar: () => import("./kamus/ar"),
  hi: () => import("./kamus/hi"),
  th: () => import("./kamus/th"),
  vi: () => import("./kamus/vi"),
  tl: () => import("./kamus/tl"),
  es: () => import("./kamus/es"),
  fr: () => import("./kamus/fr"),
  de: () => import("./kamus/de"),
  pt: () => import("./kamus/pt"),
  ru: () => import("./kamus/ru"),
  it: () => import("./kamus/it"),
  nl: () => import("./kamus/nl"),
  tr: () => import("./kamus/tr"),
  bn: () => import("./kamus/bn"),
};

export const KAMUS_SUMBER: Kamus = id;
const tembolok = new Map<KodeBahasa, Kamus>([["id", id]]);

export async function muatKamus(kode: KodeBahasa): Promise<Kamus> {
  const ada = tembolok.get(kode);
  if (ada) return ada;
  if (kode === "id") return id;
  try {
    const k = (await PEMUAT[kode]()).default;
    tembolok.set(kode, k);
    return k;
  } catch {
    return id;
  }
}

/** Fungsi murni: ambil teks untuk kunci, isi placeholder {nama}, cadangan ke id lalu ke kunci itu sendiri. */
export function terjemah(kamus: Partial<Kamus> | undefined, kunci: Kunci, v?: Variabel): string {
  const mentah = kamus?.[kunci] || id[kunci] || kunci;
  if (!v) return mentah;
  return mentah.replace(/\{(\w+)\}/g, (m, n: string) => (n in v ? String(v[n]) : m));
}

export type FungsiT = (kunci: Kunci, v?: Variabel) => string;
export const buatT = (kamus?: Partial<Kamus>): FungsiT => (kunci, v) => terjemah(kamus, kunci, v);

/** t() bawaan (bahasa Indonesia) untuk kode di luar React. */
export const t: FungsiT = buatT(id);

/** Cocokkan tag BCP 47 (mis. "zh-Hans-CN", "fil", "en-GB") ke kode yang didukung. */
export function cocokkanTag(tag: string | null | undefined): KodeBahasa | null {
  if (!tag) return null;
  const dasar = tag.toLowerCase().split(/[-_]/)[0];
  const alias: Record<string, KodeBahasa> = { in: "id", fil: "tl", jw: "jv" };
  const k = alias[dasar] ?? dasar;
  return adalahKode(k) ? k : null;
}

/** Urutan: pilihan tersimpan di localStorage, lalu navigator.languages, lalu id. Aman dipanggil di server. */
export function deteksiBahasa(): KodeBahasa {
  if (typeof window === "undefined") return BAWAAN;
  try {
    const simpan = window.localStorage.getItem(KUNCI_SIMPAN);
    if (adalahKode(simpan)) return simpan;
  } catch { /* localStorage diblokir */ }
  const daftar = typeof navigator !== "undefined" ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : [];
  for (const tag of daftar) {
    const k = cocokkanTag(tag);
    if (k) return k;
  }
  return BAWAAN;
}

export function simpanBahasa(kode: KodeBahasa): void {
  try { window.localStorage.setItem(KUNCI_SIMPAN, kode); } catch { /* abaikan */ }
}

// Nilai dari backend (kelas keputusan, opsi formulir) tetap disimpan dalam bahasa Indonesia;
// peta di bawah hanya untuk menampilkan labelnya.
export const KUNCI_KELAS: Record<string, Kunci> = {
  Layak: "kls.layak",
  "Layak Bersyarat": "kls.bersyarat",
  "Tidak Layak": "kls.tidak",
};
export const KUNCI_OPSI: Record<string, Kunci> = {
  Produktif: "opsi.Produktif",
  Konsumtif: "opsi.Konsumtif",
  Ide: "opsi.Ide",
  Prototipe: "opsi.Prototipe",
  MVP: "opsi.MVP",
  PT: "opsi.PT",
  Koperasi: "opsi.Koperasi",
  Daring: "opsi.Daring",
  Luring: "opsi.Luring",
  Keduanya: "opsi.Keduanya",
  "Belum ditentukan": "opsi.belum",
  "Direksi sekurang-kurangnya 2 orang berpengalaman": "opsi.sdm1",
  "Tenaga ahli TI berpengalaman sekurang-kurangnya 3 tahun": "opsi.sdm2",
  "Fungsi audit internal": "opsi.sdm3",
};
/** Label tampilan untuk nilai berbahasa Indonesia; nilai yang tidak dikenal dikembalikan apa adanya. */
export const labelNilai = (tf: FungsiT, nilai: string): string => {
  const k = KUNCI_KELAS[nilai] ?? KUNCI_OPSI[nilai];
  return k ? tf(k) : nilai;
};
