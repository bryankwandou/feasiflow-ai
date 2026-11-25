// Penetapan D2d oleh kode (Tabel 7 naskah) dan penyusunan skor tampilan 1-100 (skor dinamis v2).
// Aturan posisi dalam pita mengikuti skor_dinamis.py / Lampiran 11; kelas tetap dari skor diskret.

import { d1a, d1bResmi, d2c, d2d, d3, dariBukti, dariPita, skorDinamis, type Ind, type Tingkat } from "./skor-dinamis";
import { RUBRIK, SYARAT_SDM, type Ide, type Indikator, type SkorIndikator } from "./tipe";

export const MODAL_MINIMUM_MILIAR = 25;

/** Angka dari isian bebas ("25", "25,5", "Rp25 miliar", "500 juta"). Satuan bawaan sesuai isian. */
export function bacaAngka(s: string | undefined, satuan: "miliar" | "juta"): number | null {
  const t = (s || "").toLowerCase().trim();
  if (!t) return null;
  const m = /(\d+(?:[.,]\d+)*)/.exec(t.replace(/rp\s?/g, ""));
  if (!m) return null;
  let a = m[1];
  // "1.500" = ribuan, "2,5" = desimal.
  a = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(a) ? a.replace(/\./g, "").replace(",", ".") : a.replace(",", ".");
  let n = Number(a);
  if (!Number.isFinite(n)) return null;
  const ke = (x: string) => ({ triliun: 1e12, miliar: 1e9, juta: 1e6, ribu: 1e3 } as Record<string, number>)[x];
  const tertulis = /(triliun|miliar|juta|ribu)/.exec(t)?.[1];
  if (tertulis && tertulis !== satuan) n = (n * ke(tertulis)) / ke(satuan);
  return n;
}

/** Syarat SDM yang dicentang; null bila isian kosong. */
export function bacaSdm(ide: Ide): { direksi: boolean; ahliTI: boolean; audit: boolean } | null {
  const t = (ide.rencana_sdm || "").trim();
  if (!t) return null;
  const l = t.toLowerCase();
  return {
    direksi: l.includes(SYARAT_SDM[0].toLowerCase()) || /direksi/.test(l),
    ahliTI: l.includes(SYARAT_SDM[1].toLowerCase()) || /ahli ti|teknologi informasi/.test(l),
    audit: l.includes(SYARAT_SDM[2].toLowerCase()) || /audit internal/.test(l),
  };
}

/** D2d (Tabel 7): modal disetor >= Rp25 miliar (Pasal 7) dan syarat SDM (Pasal 52, 196, 200). */
export function skorD2d(ide: Ide): SkorIndikator & { modal: number | null; sdm: ReturnType<typeof bacaSdm> } {
  const modal = bacaAngka(ide.modal_disetor, "miliar");
  const sdm = bacaSdm(ide);
  const sumber = "POJK Nomor 40 Tahun 2024";
  if (modal === null || sdm === null) {
    const kurang = [modal === null ? "modal disetor" : "", sdm === null ? "rencana SDM" : ""].filter(Boolean).join(" dan ");
    return { skor: 50, bukti: `Isian ${kurang} kosong. (ditetapkan kode: bukti terbatas)`, sumber, modal, sdm };
  }
  const modalOk = modal >= MODAL_MINIMUM_MILIAR;
  const kurangSdm = [!sdm.direksi && "direksi", !sdm.ahliTI && "tenaga ahli TI", !sdm.audit && "audit internal"].filter(Boolean) as string[];
  const sdmOk = kurangSdm.length === 0;
  const skor = (modalOk && sdmOk ? 100 : modalOk || sdmOk ? 50 : 0) as 0 | 50 | 100;
  const bukti =
    `Modal disetor Rp${modal.toLocaleString("id-ID")} miliar ${modalOk ? "memenuhi" : "di bawah"} syarat Rp25 miliar (Pasal 7); ` +
    (sdmOk ? "rencana SDM memuat direksi, tenaga ahli TI, dan audit internal (Pasal 52, 196, 200)" : "rencana SDM belum memuat " + kurangSdm.join(", ")) +
    ". (ditetapkan kode dari isian formulir)";
  return { skor, bukti, sumber, modal, sdm };
}

/** Proyeksi isian 17 (juta rupiah): rasio pendapatan/biaya dan BEP = biaya awal / (pendapatan - biaya) per bulan. */
export function proyeksi(ide: Ide): { R?: number; bep?: number | null } {
  const p = bacaAngka(ide.pendapatan_bulanan, "juta");
  const b = bacaAngka(ide.biaya_bulanan, "juta");
  const a = bacaAngka(ide.biaya_awal, "juta");
  if (p === null || b === null || b <= 0) return {};
  const R = p / b;
  const bep = a !== null && p > b ? +(a / (p - b)).toFixed(1) : a !== null ? null : undefined;
  return { R, bep };
}

export interface MasukanDinamis {
  ide: Ide;
  skor: Record<Indikator, SkorIndikator>;
  statistik?: { tumbuh: number; tumbuhNasional: number; sumber: string } | null;
  gudang?: Map<string, { tingkat: number; jalur: string; terbit?: string }>;
  /** Jumlah unsur rencana dan teks rencana untuk D3b dan D3c. */
  unsur?: Partial<Record<"D3b" | "D3c", { n: number; teks: string }>>;
  /** Sumber tingkat 1 yang berlaku selain Statistik LPBBTI (untuk D1b tingkat 100). */
  nTingkat1?: number;
}

const URL = /https?:\/\/[^\s)\]>"'`]+/;

/** Skor tampilan 1-100 per indikator dan S dinamis. Kelasnya dijamin identik dengan kelas diskret. */
export function hitungDinamis(m: MasukanDinamis) {
  const lv = Object.fromEntries(RUBRIK.map((i) => [i, m.skor[i].skor])) as Record<Ind, Tingkat>;
  const d = {} as Record<Ind, number>;
  const info = new Set<Ind>();
  const adaGudang = !!m.gudang && m.gudang.size > 0;

  d.D1a = dariPita(lv.D1a, lv.D1a === 0 ? 0 : lv.D1a === 50 ? 0.5 : 1);
  if (m.statistik && m.statistik.tumbuhNasional > 0) {
    d.D1a = d1a(lv.D1a, m.statistik.tumbuh, m.statistik.tumbuhNasional);
    info.add("D1a");
  }
  for (const i of ["D1b", "D1c", "D2a", "D2b"] as const) {
    const al = ((m.skor[i].sumber || "").match(URL) || [""])[0].replace(/[.,;]+$/, "");
    const k = adaGudang && al && m.gudang!.has(al) ? 1 : 0;
    const terbatas = /bukti terbatas|tidak dinilai|diturunkan/i.test(m.skor[i].bukti || "");
    d[i] = dariBukti(lv[i], k, adaGudang, terbatas);
    if (adaGudang) info.add(i);
  }
  if (lv.D1b === 100 && m.nTingkat1 !== undefined) {
    d.D1b = d1bResmi(m.nTingkat1);
    info.add("D1b");
  }
  const pr = proyeksi(m.ide);
  d.D2c = d2c(lv.D2c, pr.R, pr.bep ?? undefined);
  if (d.D2c !== dariPita(lv.D2c, lv.D2c === 0 ? 0 : lv.D2c === 50 ? 0.5 : 1)) info.add("D2c");

  const x = skorD2d(m.ide);
  if (lv.D2d === 100) d.D2d = 100;
  else if (lv.D2d === 0) d.D2d = 1;
  else if (x.modal !== null && x.sdm) {
    d.D2d = d2d(x.modal, x.sdm.direksi, x.sdm.ahliTI, x.sdm.audit);
    info.add("D2d");
  } else d.D2d = 50;

  d.D3a = lv.D3a === 100 ? 100 : lv.D3a === 0 ? 1 : 50;
  for (const i of ["D3b", "D3c"] as const) {
    const u = m.unsur?.[i];
    d[i] = d3(lv[i], u?.n ?? (lv[i] === 100 ? 2 : 1), /\d/.test(u?.teks || ""));
    if (lv[i] !== 0 && u) info.add(i);
  }
  const r = skorDinamis(lv, d, info);
  return {
    indikator: d as Record<Indikator, number>,
    S: r.S,
    S_diskret: r.S_diskret,
    berinformasi: RUBRIK.filter((i) => info.has(i)) as Indikator[],
    bep_bulan: pr.bep ?? null,
  };
}
