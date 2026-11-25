// Skor indikator dinamis 1-100, versi 2 (03_uji_sistem/skor_dinamis, 18 November 2026).
// Kelas tetap ditentukan oleh tingkat diskret 0/50/100; skor dinamis hanya memberi posisi di dalam tingkat itu.
// Salinan persis skor-dinamis.ts yang lolos cek paritas TS-Python 46/46. Deterministik, tanpa panggilan model.

export const INDIKATOR = ["D1a", "D1b", "D1c", "D2a", "D2b", "D2c", "D2d", "D3a", "D3b", "D3c"] as const;
export type Ind = (typeof INDIKATOR)[number];
export type Tingkat = 0 | 50 | 100;

export const PITA: Record<Tingkat, [number, number]> = { 0: [1, 15], 50: [35, 65], 100: [85, 100] };
const TENGAH: Record<Tingkat, number> = { 0: 8, 50: 50, 100: 92.5 };
const BAWAAN: Record<Tingkat, number> = { 0: 0, 50: 0.5, 100: 1 };
const SETENGAH = 7.5;
const H = 2.45;

const clip = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const r1 = (x: number) => Math.floor(x * 10 + 0.5 + 1e-9) / 10;
export const dariPita = (lv: Tingkat, t: number) => r1(PITA[lv][0] + (PITA[lv][1] - PITA[lv][0]) * clip(t));

/** D1a: g = laju majemuk penyaluran wilayah (%/th), n = nasional, jendela sama dengan penentu tingkatnya. */
export function d1a(lv: Tingkat, g: number, n: number) {
  const t = lv === 0 ? 1 - Math.min(1, Math.max(0, -g) / 20) : lv === 50 ? g / n : g / n - 1;
  return dariPita(lv, t);
}

/** D1b, D1c, D2a, D2b (dinilai LLM): k = 1 bila sumber skor lolos pemeriksaan gudang bukti. Tanpa gudang -> bawaan. */
export function dariBukti(lv: Tingkat, k: 0 | 1, adaGudang: boolean, terbatas = false) {
  if (!adaGudang) return dariPita(lv, BAWAAN[lv]);
  const t = lv === 100 ? 0.75 + 0.25 * k : lv === 50 ? 0.5 + 0.25 * k - (terbatas ? 0.25 : 0) : 0.25 - 0.25 * k;
  return dariPita(lv, t);
}

/** D1b tingkat 100: jumlah sumber resmi tingkat 1 yang berlaku, selain Statistik LPBBTI. */
export const d1bResmi = (nTingkat1: number) => r1(Math.min(100, 85 + 5 * Math.min(3, nTingkat1)));

/** D2c: R = pendapatan/biaya (rupiah) bila keduanya ada; bepBulan bila hanya BEP yang disebut. */
export function d2c(lv: Tingkat, R?: number, bepBulan?: number) {
  if (lv === 100 && R !== undefined) return dariPita(100, Math.min(1, R - 1));
  if (lv === 50 && R !== undefined && R < 1) return dariPita(50, R);
  if (lv === 100 && bepBulan !== undefined) return r1(100 - 15 * Math.min(1, bepBulan / 36));
  return dariPita(lv, BAWAAN[lv]);
}

/** D2d (POJK 40/2024): modal disetor (miliar Rp, syarat 25) + direksi >=2 berpengalaman + tenaga ahli TI 3 th + audit internal. */
export function d2d(modalMiliar: number, direksi: boolean, ahliTI: boolean, audit: boolean) {
  const q = Math.min(1, modalMiliar / 25) + +direksi + +ahliTI + +audit;
  return q >= 4 ? 100 : q <= 0 ? 1 : r1(35 + (30 * q) / 4);
}

/** D3b, D3c: n unsur tindakan berbeda; tingkat 50 naik ke 57,5 bila unsurnya memuat besaran angka. */
export function d3(lv: Tingkat, n: number, adaAngka: boolean) {
  if (lv === 0) return 1;
  if (lv === 50) return dariPita(50, adaAngka ? 0.75 : 0.5);
  return dariPita(100, (n - 1) / 3);
}

export type Kelas = "Layak" | "Layak Bersyarat" | "Tidak Layak";
export const kelasDari = (S: number, gugur: boolean): Kelas => (gugur ? "Tidak Layak" : S >= 70 ? "Layak" : S >= 50 ? "Layak Bersyarat" : "Tidak Layak");

/**
 * S dinamis v2. tingkat: skor diskret per indikator; dinamis: skor 1-100 per indikator;
 * berinformasi: indikator yang posisinya dihitung dari data nyata (lainnya simpangan 0).
 */
export function skorDinamis(tingkat: Record<Ind, Tingkat>, dinamis: Record<Ind, number>, berinformasi: Set<Ind>) {
  const gugur = tingkat.D3a === 0;
  const Sd = r1(INDIKATOR.reduce((s, i) => s + tingkat[i], 0) / 10);
  const dbar = INDIKATOR.reduce((s, i) => s + (berinformasi.has(i) ? dinamis[i] - TENGAH[tingkat[i]] : 0), 0) / 10;
  const u = clip(dbar / SETENGAH, -1, 1);
  const S = r1(clip(!gugur && (Sd === 50 || Sd === 70) ? Sd + H * (u + 1) : Sd + H * u, 1, 100));
  const kelas = kelasDari(S, gugur);
  // Jaminan rancangan: kelas dinamis selalu sama dengan kelas diskret.
  if (kelas !== kelasDari(Sd, gugur)) throw new Error("kelas berpindah: pelanggaran invarian skor dinamis");
  return { S_diskret: Sd, S, kelas, gugur };
}
