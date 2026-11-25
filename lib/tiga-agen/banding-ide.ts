// Banding ide: memeringkat 2 sampai 5 hasil analisis yang sudah ada dengan Simple Additive Weighting (SAW).
// Deterministik, fungsi murni, tanpa panggilan Gemini. Skor indikator dan bobot sama dengan kelas.ts:
// bobot sama untuk tiap indikator rubrik (tipe.ts RUBRIK), S dan kelas dihitung ulang lewat hitungSkor.
//
// Langkah SAW (Wang & Rangaiah 2025, arXiv:2509.06388, subbab 8.2; asal metode: MacCrimmon 1968,
// RAND RM-4823; Hwang & Yoon 1981, doi:10.1007/978-3-642-48318-9):
//   1. Normalisasi maks untuk kriteria manfaat: F_ij = f_ij / maks_k f_kj (semua indikator rubrik adalah manfaat).
//      Bila maks_k f_kj = 0 (semua ide bernilai 0), F_ij = 0: indikator itu tidak membedakan ide.
//   2. V_i = jumlah_j w_j * F_ij, dengan jumlah w_j = 1. Ditampilkan sebagai 0..100.
// Aturan tambahan dari rubrik: ide gugur (D3a = 0) selalu di bawah ide yang tidak gugur, berapa pun V-nya.
// Urutan seri: V, lalu S, lalu jumlah indikator bernilai 0 (lebih sedikit lebih baik), lalu urutan masukan.

import { RUBRIK, URAIAN_RUBRIK, type HasilAnalisis, type Indikator } from "./tipe";
import { hitungSkor } from "./kelas";

export const MIN_IDE = 2;
export const MAKS_IDE = 5;

export interface MasukanBanding {
  /** Nama tampilan ide; kosong diganti "Ide n". */
  nama: string;
  hasil: Pick<HasilAnalisis, "skor"> & Partial<Pick<HasilAnalisis, "S" | "kelas" | "aturan_gugur" | "session_id">>;
}

export interface BarisPeringkat {
  peringkat: number;
  nama: string;
  /** Posisi pada masukan, mulai 0. */
  urutan_masuk: number;
  session_id?: string;
  /** Nilai preferensi SAW, 0..100 (satu desimal). */
  V: number;
  /** Skor rubrik S dan kelas, dihitung ulang dengan hitungSkor (sama dengan sistem 3 agen). */
  S: number;
  kelas: HasilAnalisis["kelas"];
  gugur: boolean;
  /** Skor asli 0/50/100 tiap indikator yang dibandingkan. */
  skor: Partial<Record<Indikator, number>>;
  /** F_ij, 0..1 (empat desimal). */
  normal: Partial<Record<Indikator, number>>;
  /** w_j * F_ij * 100, sumbangan tiap indikator pada V. */
  kontribusi: Partial<Record<Indikator, number>>;
  /** Benar bila sama persis dengan baris sebelumnya pada gugur, V, S, dan jumlah nol (urutan dari masukan). */
  seri_dengan_atas: boolean;
  alasan: string[];
}

export interface HasilBanding {
  metode: "SAW";
  /** Indikator yang ada pada semua ide; hanya ini yang dibandingkan. */
  indikator: Indikator[];
  /** Indikator yang tidak ada pada salah satu ide (misalnya D2d pada riwayat lama). */
  dilewati: Indikator[];
  bobot: Partial<Record<Indikator, number>>;
  baris: BarisPeringkat[];
  catatan: string[];
}

const angka = (x: number, d = 1) => x.toFixed(d).replace(".", ",");
const bulat = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;
const label = (i: Indikator) => `${i} (${URAIAN_RUBRIK[i].charAt(0).toLowerCase()}${URAIAN_RUBRIK[i].slice(1)})`;

const nilaiSah = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;

/** Bobot rubrik: sama untuk tiap indikator, seperti rerata pada kelas.ts. Bobot opsional dinormalkan agar berjumlah 1. */
export function bobotRubrik(ind: readonly Indikator[], bobot?: Partial<Record<Indikator, number>>): Partial<Record<Indikator, number>> {
  const mentah = ind.map((i) => {
    const b = bobot?.[i];
    return bobot ? (typeof b === "number" && Number.isFinite(b) && b > 0 ? b : 0) : 1;
  });
  const jumlah = mentah.reduce((a, b) => a + b, 0);
  if (jumlah <= 0) throw new Error("Bobot tidak sah: jumlah bobot harus lebih dari 0");
  return Object.fromEntries(ind.map((i, k) => [i, mentah[k] / jumlah]));
}

/** Peringkat SAW untuk 2 sampai 5 hasil analisis. Melempar galat bila jumlah ide di luar batas atau tidak ada indikator bersama. */
export function peringkatSAW(masukan: MasukanBanding[], opsi: { bobot?: Partial<Record<Indikator, number>> } = {}): HasilBanding {
  if (!Array.isArray(masukan) || masukan.length < MIN_IDE || masukan.length > MAKS_IDE) {
    throw new Error(`Banding memerlukan ${MIN_IDE} sampai ${MAKS_IDE} ide, diterima ${Array.isArray(masukan) ? masukan.length : 0}`);
  }
  const ind = RUBRIK.filter((i) => masukan.every((m) => nilaiSah(m.hasil?.skor?.[i]?.skor)));
  const dilewati = RUBRIK.filter((i) => !ind.includes(i));
  if (!ind.length) throw new Error("Tidak ada indikator yang dimiliki semua ide");
  const w = bobotRubrik(ind, opsi.bobot);
  const maks = Object.fromEntries(ind.map((i) => [i, Math.max(...masukan.map((m) => m.hasil.skor[i].skor))])) as Record<Indikator, number>;

  const awal = masukan.map((m, k) => {
    const skor: Partial<Record<Indikator, number>> = {};
    const normal: Partial<Record<Indikator, number>> = {};
    const kontribusi: Partial<Record<Indikator, number>> = {};
    let V = 0;
    for (const i of ind) {
      const f = m.hasil.skor[i].skor;
      const F = maks[i] > 0 ? f / maks[i] : 0;
      skor[i] = f;
      normal[i] = bulat(F, 4);
      kontribusi[i] = bulat(w[i]! * F * 100, 2);
      V += w[i]! * F;
    }
    const h = hitungSkor(m.hasil.skor);
    return {
      nama: String(m.nama || "").trim().slice(0, 80) || `Ide ${k + 1}`,
      urutan_masuk: k,
      session_id: m.hasil.session_id,
      V: bulat(V * 100, 1),
      Vtepat: bulat(V * 100, 6),
      S: h.S,
      kelas: h.kelas,
      gugur: h.gugur || m.hasil.aturan_gugur === true,
      nol: ind.filter((i) => skor[i] === 0).length,
      skor, normal, kontribusi,
    };
  });

  const banding = (a: (typeof awal)[number], b: (typeof awal)[number]) =>
    Number(a.gugur) - Number(b.gugur) || b.Vtepat - a.Vtepat || b.S - a.S || a.nol - b.nol || a.urutan_masuk - b.urutan_masuk;
  const urut = [...awal].sort(banding);
  const samaPersis = (a: (typeof awal)[number], b: (typeof awal)[number]) =>
    a.gugur === b.gugur && a.Vtepat === b.Vtepat && a.S === b.S && a.nol === b.nol;

  const baris: BarisPeringkat[] = urut.map((r, k) => {
    const alasan: string[] = [];
    if (r.gugur) {
      const bukti = String(masukan[r.urutan_masuk].hasil.skor.D3a?.bukti || "").trim();
      alasan.push("Gugur: D3a bernilai 0 (kegiatan tidak termasuk yang diizinkan), jadi selalu di bawah ide yang tidak gugur." + (bukti ? ` Dasar: ${bukti.slice(0, 160)}` : ""));
    }
    alasan.push(`Nilai SAW ${angka(r.V)} dari 100; skor rubrik S ${angka(r.S)} (${r.kelas}).`);
    const unggul = ind.filter((i) => r.normal[i] === 1 && urut.some((o) => o !== r && (o.normal[i] ?? 0) < 1));
    if (unggul.length) alasan.push("Terbaik di antara ide pada " + unggul.slice(0, 3).map(label).join("; ") + (unggul.length > 3 ? `; dan ${unggul.length - 3} indikator lain.` : "."));
    const nolnya = ind.filter((i) => r.skor[i] === 0);
    if (nolnya.length) alasan.push("Bernilai 0 pada " + nolnya.slice(0, 3).map(label).join("; ") + (nolnya.length > 3 ? `; dan ${nolnya.length - 3} indikator lain.` : "."));
    const bawah = urut[k + 1];
    if (bawah) {
      if (r.gugur === bawah.gugur && r.Vtepat === bawah.Vtepat) {
        const dasar = r.S !== bawah.S ? "skor rubrik S lebih tinggi" : r.nol !== bawah.nol ? "indikator bernilai 0 lebih sedikit" : "urutan masukan (seri penuh)";
        alasan.push(`Nilai SAW sama dengan ${bawah.nama}; di atasnya karena ${dasar}.`);
      } else if (r.gugur !== bawah.gugur) {
        alasan.push(`Di atas ${bawah.nama} karena ${bawah.nama} gugur pada D3a.`);
      } else {
        const selisih = ind
          .map((i) => ({ i, d: (r.kontribusi[i] ?? 0) - (bawah.kontribusi[i] ?? 0) }))
          .filter((x) => x.d > 0)
          .sort((a, b) => b.d - a.d || RUBRIK.indexOf(a.i) - RUBRIK.indexOf(b.i))
          .slice(0, 2);
        if (selisih.length) alasan.push(`Unggul atas ${bawah.nama} terutama pada ` + selisih.map((x) => `${x.i} (+${angka(x.d)})`).join(" dan ") + ".");
      }
    }
    return {
      peringkat: k + 1,
      nama: r.nama,
      urutan_masuk: r.urutan_masuk,
      ...(r.session_id ? { session_id: r.session_id } : {}),
      V: r.V,
      S: r.S,
      kelas: r.kelas,
      gugur: r.gugur,
      skor: r.skor,
      normal: r.normal,
      kontribusi: r.kontribusi,
      seri_dengan_atas: k > 0 && samaPersis(urut[k - 1], r),
      alasan,
    };
  });

  const catatan: string[] = [];
  if (dilewati.length) catatan.push(`Indikator ${dilewati.join(", ")} tidak ada pada semua ide, jadi tidak dibandingkan; bobot dibagi rata ke ${ind.length} indikator.`);
  const takBeda = ind.filter((i) => new Set(awal.map((r) => r.skor[i])).size === 1);
  if (takBeda.length) catatan.push(`Indikator ${takBeda.join(", ")} bernilai sama pada semua ide sehingga tidak membedakan peringkat.`);
  return { metode: "SAW", indikator: ind, dilewati, bobot: w, baris, catatan };
}
