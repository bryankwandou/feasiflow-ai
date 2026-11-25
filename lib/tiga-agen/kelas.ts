// Skor gabungan dan kelas keputusan (persamaan (1) dan Tabel 8 naskah). Dipakai sistem 3 agen
// dan kedua pembanding, sehingga semuanya dinilai dengan aturan yang sama persis.
// S = rerata bobot sama seluruh indikator (10 indikator); skor dimensi hanya keterangan.

import { RUBRIK, type HasilAnalisis, type Indikator, type SkorIndikator } from "./tipe";

export const BATAS_LAYAK = 70;
export const BATAS_BERSYARAT = 50;

export function kelasDari(S: number, gugur: boolean, layak = BATAS_LAYAK, bersyarat = BATAS_BERSYARAT): HasilAnalisis["kelas"] {
  if (gugur) return "Tidak Layak";
  return S >= layak ? "Layak" : S >= bersyarat ? "Layak Bersyarat" : "Tidak Layak";
}

const rerata = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Indikator yang tidak ada (misalnya D2d pada riwayat lama) dilewati, bukan dianggap 0. */
export function hitungSkor(skor: Partial<Record<Indikator, SkorIndikator>>) {
  const ada = RUBRIK.filter((i) => skor[i] && typeof skor[i]!.skor === "number");
  const dim = (d: "D1" | "D2" | "D3") => rerata(ada.filter((i) => i.startsWith(d)).map((i) => skor[i]!.skor));
  const S = rerata(ada.map((i) => skor[i]!.skor));
  const gugur = skor.D3a?.skor === 0;
  return {
    dimensi: { D1: +dim("D1").toFixed(1), D2: +dim("D2").toFixed(1), D3: +dim("D3").toFixed(1) },
    S: +S.toFixed(1),
    gugur,
    kelas: kelasDari(S, gugur),
  };
}
