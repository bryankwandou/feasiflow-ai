// Aturan kode bersama (terapkanAturanKode): indikator yang ditetapkan atau dikoreksi kode, dipakai K3 dan K2k
// agar selisih K2k dengan K3 hanya mengukur pembagian agen beserta pemeriksaannya.

import { BATAS_BULAN, umurBulan, type Konteks } from "./alat";
import { LUAR_LPBBTI, LUAR_PRODUK, PRODUK_PENDANAAN } from "./aturan";
import { proyeksi, skorD2d } from "./dinamis";
import { wilayahDikenal } from "./kamus";
import { BLOK_INTI, type Ide, type Indikator, type SkorIndikator } from "./tipe";

export type Statistik = NonNullable<Konteks["statistik"]>;
export type Gudang = Konteks["gudang"];
export type Risiko = { risiko: string; penanganan: string }[];
export type AsalBlok = "ide" | "turunan" | "kosong";

// Kata yang menandakan ide sudah menyebut rencana penanganan sebuah risiko.
export const TANDA_GAGAL_BAYAR =
  /penagihan|menagih|agunan|jaminan|asuransi|skor kredit|penilaian kredit|penilaian kelayakan|credit scoring|tanggung renteng|dana cadangan|restrukturisasi|riwayat (setoran|transaksi|pembayaran)|batas pinjaman/i;
export const TANDA_DATA =
  /enkripsi|terenkripsi|persetujuan (pengguna|peminjam|pemilik data)|pe(r)?lindungan data|uu pdp|iso ?27001|anonim|akses terbatas|keamanan data/i;
// Unsur rencana penanganan (D3b dan D3c): setiap tindakan yang berbeda dihitung satu unsur.
export const UNSUR_GAGAL_BAYAR: [string, RegExp][] = [
  ["penilaian kelayakan peminjam", /penilaian (kredit|kelayakan)|skor(ing)? kredit|credit scor|analisis kelayakan|riwayat (setoran|transaksi|pembayaran|penjualan|pemesanan|tangkapan)/i],
  ["pemeriksaan keaslian tagihan", /keaslian tagihan|verifikasi tagihan/i],
  ["penagihan", /penagihan|menagih|ditagih/i],
  ["pemotongan otomatis", /pemotongan|dipotong|potong(an)? (dari|hasil)|auto ?debet|rekening penampungan/i],
  ["agunan atau jaminan barang", /agunan|jaminan (alat|barang|token|aset)|menjadi jaminan/i],
  ["penjamin atau tanggung renteng", /penjamin|tanggung renteng/i],
  ["asuransi", /asuransi/i],
  ["uang muka", /uang muka/i],
  ["dana cadangan", /dana cadangan|cadangan kerugian/i],
  ["restrukturisasi", /restrukturisasi/i],
  ["batas pinjaman", /batas pinjaman|membatasi|plafon bertahap|bertahap/i],
  ["cicilan sesuai penghasilan", /disesuaikan dengan penghasilan/i],
  ["penghentian layanan saat menunggak", /penghentian pesanan|dihentikan bila menunggak/i],
  ["pendampingan usaha", /pendampingan|penyuluh/i],
];
export const UNSUR_DATA: [string, RegExp][] = [
  ["persetujuan pemilik data", /persetujuan|consent/i],
  ["enkripsi", /enkripsi|terenkripsi/i],
  ["autentikasi akun", /autentikasi|kata sandi|otp/i],
  ["pembatasan akses", /akses terbatas|hak akses/i],
  ["pembatasan pemakaian dan pembagian", /tidak dibagikan|hanya dibagikan|hanya dipakai/i],
  ["retensi dan penghapusan", /retensi|penghapusan/i],
  ["kepatuhan UU PDP", /uu pdp|pelindungan data pribadi|perlindungan data pribadi/i],
  ["standar keamanan", /iso ?27001|audit keamanan/i],
];
export const ANGKA_BESARAN = /rp\s?\d|\d+(?:[.,]\d+)?\s*(%|persen|ribu|juta|miliar|rupiah)/i;
export const RISIKO_GAGAL_BAYAR = /gagal bayar|kredit macet|wanprestasi/i;
export const RISIKO_DATA = /data/i;
export const BELUM = /belum|tidak ada|tanpa rencana|nanti/i;
export const adaRencana = (p: string) => !!p.trim() && !/belum ada/i.test(p);
const ALAMAT = /https?:\/\/[^\s)\]>"'`]+/g;
const bersihAlamat = (a: string) => a.replace(/[.,;]+$/, "");

/** Kalimat pada ide yang memuat tanda rencana; kosong bila tidak ada. Isian khusus formulir didahulukan. */
export function kalimatRencana(ide: Ide, tanda: RegExp, isian?: string): string {
  const langsung = (isian || "").trim();
  if (langsung.length >= 15 && !BELUM.test(langsung)) return langsung.slice(0, 240);
  if (langsung && BELUM.test(langsung)) return "";
  const kalimat = Object.values(ide).join(". ").split(/(?<=[.;!?])\s+/);
  return (kalimat.find((x) => tanda.test(x) && !BELUM.test(x)) || "").trim().slice(0, 240);
}

const risikoUntuk = (risiko: Risiko, ind: "D3b" | "D3c") =>
  risiko.find((x) => (ind === "D3b" ? RISIKO_GAGAL_BAYAR.test(x.risiko) : RISIKO_DATA.test(x.risiko) && !RISIKO_GAGAL_BAYAR.test(x.risiko)));

/** Teks rencana penanganan sebuah risiko: isian formulir, kolom penanganan, dan kalimat ide yang bukan pernyataan "belum". */
export function teksRencana(ide: Ide, risiko: Risiko, ind: "D3b" | "D3c") {
  const isian = ((ind === "D3b" ? ide.rencana_gagal_bayar : ide.rencana_data) || "").trim();
  const r = risikoUntuk(risiko, ind);
  const kalimat = Object.values(ide).join(". ").split(/(?<=[.;!?])\s+/).filter((x) => !BELUM.test(x));
  const ada = (!!isian && !BELUM.test(isian)) || (!!r && adaRencana(r.penanganan));
  return { ada, teks: [isian && !BELUM.test(isian) ? isian : "", r && adaRencana(r.penanganan) ? r.penanganan : "", ...kalimat].join(" ") };
}

/** D3b dan D3c: 2 unsur atau lebih 100, 1 unsur 50, tanpa rencana 0. */
export function skorRisiko(ide: Ide, risiko: Risiko) {
  const hasil = {} as Record<"D3b" | "D3c", { skor: 0 | 50 | 100; unsur: string[] }>;
  for (const ind of ["D3b", "D3c"] as const) {
    const { ada, teks } = teksRencana(ide, risiko, ind);
    const unsur = (ind === "D3b" ? UNSUR_GAGAL_BAYAR : UNSUR_DATA).filter(([, re]) => re.test(teks)).map(([n]) => n);
    // Satu-satunya tempat aturan D3b/D3c (Tabel rubrik naskah): 2 tindakan atau lebih 100, 1 tindakan 50, tanpa tindakan 0.
    void ada;
    hasil[ind] = { skor: unsur.length >= 2 ? 100 : unsur.length === 1 ? 50 : 0, unsur };
  }
  return hasil;
}

export function skorRisikoIndikator(ide: Ide, risiko: Risiko): Record<"D3b" | "D3c", SkorIndikator> {
  const rr = skorRisiko(ide, risiko);
  const o = {} as Record<"D3b" | "D3c", SkorIndikator>;
  for (const ind of ["D3b", "D3c"] as const) {
    const u = rr[ind].unsur;
    o[ind] = { skor: rr[ind].skor, bukti: (u.length ? `Rencana memuat ${u.length} tindakan: ` + u.join(", ") : "Ide tidak memiliki rencana dengan tindakan yang jelas") + ". (ditetapkan kode: 2 tindakan atau lebih 100, 1 tindakan 50, tanpa tindakan 0)", sumber: "A2" };
  }
  return o;
}

/** D1a: pertumbuhan penyaluran wilayah 2023-2025 dibandingkan angka nasional (Statistik LPBBTI OJK). */
export function skorD1a(s: Statistik | null | undefined): SkorIndikator | null {
  if (!s) return null;
  const skor = (s.tumbuh <= 0 ? 0 : s.tumbuh >= s.tumbuhNasional ? 100 : 50) as 0 | 50 | 100;
  const arah = skor === 100 ? "sama dengan atau di atas angka nasional" : skor === 50 ? "tumbuh tetapi di bawah angka nasional" : "tidak tumbuh";
  return { skor, bukti: "Pertumbuhan penyaluran wilayah " + arah + ". " + s.kalimat + " (ditetapkan kode dari Statistik LPBBTI OJK)", sumber: s.sumber };
}

/** D3a: kegiatan yang diizinkan POJK Nomor 40 Tahun 2024 (pendanaan bersama dalam rupiah). */
export function skorD3a(ide: Ide, gudang?: Gudang): SkorIndikator | null {
  const luar = LUAR_LPBBTI.exec(Object.values(ide).join(" ")) || LUAR_PRODUK.exec(ide.produk || "");
  const pojk = gudang ? Array.from(gudang.keys()).find((a) => /pojk[-_ ]?40|POJK-40/i.test(a)) : undefined;
  const sumber = pojk || "POJK Nomor 40 Tahun 2024";
  if (luar) return { skor: 0, bukti: `Ide memakai "${luar[0]}", kegiatan yang berada di luar LPBBTI dan diatur ketentuan lain. (ditetapkan kode)`, sumber };
  if (PRODUK_PENDANAAN.test(ide.produk || "")) {
    const bh = (ide.bentuk_hukum || "").trim();
    const pas = /^(pt|perseroan|koperasi)\b/i.test(bh);
    // Riwayat dan pemanggil lama tanpa isian bentuk hukum tidak dikenai syarat ini.
    if (ide.bentuk_hukum === undefined || pas) {
      return { skor: 100, bukti: "Produk berupa pendanaan atau pinjaman antara pemberi dan penerima dana, yaitu kegiatan LPBBTI menurut POJK Nomor 40 Tahun 2024" + (pas ? ", dengan badan hukum " + bh + " (Pasal 2)" : "") + ". (ditetapkan kode)", sumber };
    }
    return { skor: 50, bukti: "Produk berupa pendanaan LPBBTI, tetapi " + (bh ? "bentuk badan hukum " + bh + " bukan PT atau koperasi" : "badan hukum belum disebutkan") + " (POJK 40/2024 Pasal 2). (ditetapkan kode)", sumber };
  }
  // Model usaha yang tidak terklasifikasi sebagai pendanaan LPBBTI tidak boleh diberi 100.
  return { skor: 0, bukti: "Produk tidak terklasifikasi sebagai pendanaan atau pinjaman LPBBTI menurut POJK Nomor 40 Tahun 2024. (ditetapkan kode)", sumber };
}

const NASIONAL = /^(indonesia|nasional|seluruh indonesia)$/i;
/** D1a dengan pemeriksaan wilayah: tidak dikenali 0, dikenali tanpa data wilayah 50, selain itu dari Statistik LPBBTI. */
export function skorD1aIde(ide: Ide, s: Statistik | null | undefined): SkorIndikator {
  const w = (ide.wilayah || "").trim();
  if (!wilayahDikenal(w)) return { skor: 0, bukti: `Wilayah "${w.slice(0, 60)}" tidak dikenali sebagai provinsi, kabupaten, atau kota di Indonesia, sehingga pertumbuhan wilayah tidak dapat dinilai. (ditetapkan kode)`, sumber: "kode" };
  const nasionalDipakai = !!s && NASIONAL.test(s.wilayah.trim()) && !NASIONAL.test(w);
  if (!s || nasionalDipakai) return { skor: 50, bukti: `Wilayah "${w.slice(0, 60)}" dikenali, tetapi data penyaluran provinsinya tidak tersedia di Statistik LPBBTI OJK; angka nasional tidak dipakai sebagai pengganti. (ditetapkan kode: bukti terbatas)`, sumber: s?.sumber || "Statistik LPBBTI OJK" };
  return skorD1a(s)!;
}

/** Nilai yang ditetapkan kode sebelum agen penilai bekerja; dikirim sebagai <nilai_tetap> dan tidak dinilai ulang. */
export function nilaiTetap(ide: Ide, statistik: Statistik | null | undefined, gudang: Gudang | undefined, risiko: Risiko): Partial<Record<Indikator, SkorIndikator>> {
  const o: Partial<Record<Indikator, SkorIndikator>> = {};
  o.D1a = skorD1aIde(ide, statistik);
  const d2d = skorD2d(ide);
  o.D2d = { skor: d2d.skor, bukti: d2d.bukti, sumber: d2d.sumber };
  o.D3a = skorD3a(ide, gudang)!;
  Object.assign(o, skorRisikoIndikator(ide, risiko));
  return o;
}

const sahTingkat12 = (g: Gudang | undefined, al: string) => {
  const x = al && g ? g.get(al) : undefined;
  return !!x && x.tingkat <= 2 && x.jalur !== "berkas" && x.jalur !== "url_context" && !(x.terbit && umurBulan(x.terbit) > BATAS_BULAN);
};

/** D1b: 100 hanya bila ukuran segmen tercatat di sumber resmi tingkat 1 selain Statistik LPBBTI; data wilayah saja = 50. */
export function koreksiD1b(x: SkorIndikator, statistik: Statistik | null | undefined, gudang: Gudang | undefined): SkorIndikator {
  const al = bersihAlamat((x.sumber.match(ALAMAT) || [""])[0]);
  const g = al && gudang ? gudang.get(al) : undefined;
  const sah = !!g && g.tingkat === 1 && g.jalur !== "berkas" && g.jalur !== "url_context" && al !== statistik?.sumber && !(g.terbit && umurBulan(g.terbit) > BATAS_BULAN);
  if (x.skor === 100 && sah) return x;
  if (x.skor === 0 && !statistik) return x;
  const s = statistik;
  return {
    skor: 50,
    bukti: "Ukuran segmen penerima dana tidak ditemukan dalam sumber resmi; yang tersedia data wilayah" +
      (s ? ": rekening penerima pinjaman aktif LPBBTI di " + s.wilayah + " per Desember 2025 sebanyak " + s.rekening.toLocaleString("id-ID") + " akun" : "") +
      ". (ditetapkan kode: bukti terbatas)",
    sumber: s?.sumber || x.sumber,
  };
}

/** D1c: 100 wajib bersumber laman tingkat 1-2 yang bukan berkas, dengan sedikitnya 2 alamat pembanding yang tersimpan. */
export function koreksiD1c(x: SkorIndikator, gudang: Gudang | undefined): SkorIndikator {
  if (x.skor !== 100) return x;
  const alamat = Array.from(new Set([...(x.sumber.match(ALAMAT) || []), ...(x.bukti.match(ALAMAT) || [])].map(bersihAlamat)));
  const tersimpan = alamat.filter((a) => gudang?.has(a) && gudang.get(a)!.jalur !== "berkas");
  if (sahTingkat12(gudang, bersihAlamat((x.sumber.match(ALAMAT) || [""])[0])) && tersimpan.length >= 2) return x;
  return {
    skor: 50,
    bukti: "Pembeda belum dibandingkan dengan laman produk sedikitnya 2 penyelenggara berizin pada sumber tingkat 1 atau 2 yang tersimpan. (ditetapkan kode: bukti terbatas)",
    sumber: x.sumber,
  };
}

/** D2c: kecukupan pendapatan baru dapat dibuktikan bila ide menyebut besaran pendapatan dan biaya. Alasan diganti, tidak disambung. */
export function koreksiD2c(x: SkorIndikator, ide: Ide): SkorIndikator {
  if (x.skor !== 100) return x;
  const pr = proyeksi(ide);
  if (pr.R !== undefined && pr.R <= 1) return { skor: 50, bukti: "Proyeksi pendapatan per bulan belum menutup biaya per bulan. (ditetapkan kode)", sumber: "A2" };
  if (pr.R !== undefined) return x;
  if (ANGKA_BESARAN.test(ide.pendapatan || "") && ANGKA_BESARAN.test(ide.biaya || "")) return x;
  return { skor: 50, bukti: "Ide tidak menyebut besaran pendapatan dan biaya, jadi kecukupannya belum dapat dibuktikan. (ditetapkan kode)", sumber: "A2" };
}

/** D2a: syarat "terisi" dihitung kode dari asal 5 blok inti; agen hanya menilai pertentangan. */
export function batasD2a(x: SkorIndikator, asal: Partial<Record<string, AsalBlok>> | undefined): SkorIndikator {
  if (!asal) return x;
  const tidakDisebut = BLOK_INTI.filter((b) => asal[b] !== "ide");
  const maks = tidakDisebut.length >= 3 ? 0 : tidakDisebut.length >= 1 ? 50 : 100;
  if (x.skor <= maks) return x;
  return { skor: maks as 0 | 50 | 100, bukti: `${tidakDisebut.length} blok inti tidak disebut ide (${tidakDisebut.join(", ")}). (ditetapkan kode dari asal blok)`, sumber: x.sumber || "A2" };
}

export interface MasukanAturan {
  ide: Ide;
  skor: Record<Indikator, SkorIndikator>;
  statistik?: Statistik | null;
  gudang?: Gudang;
  risiko: Risiko;
  asal?: Partial<Record<string, AsalBlok>>;
}

/** Terapkan seluruh aturan kode pada skor agen; mengembalikan salinan beserta daftar indikator yang diubah. */
export function terapkanAturanKode(m: MasukanAturan): { skor: Record<Indikator, SkorIndikator>; diubah: Indikator[] } {
  const awal = m.skor;
  const skor = { ...m.skor };
  Object.assign(skor, nilaiTetap(m.ide, m.statistik, m.gudang, m.risiko));
  skor.D1b = koreksiD1b(skor.D1b, m.statistik, m.gudang);
  skor.D1c = koreksiD1c(skor.D1c, m.gudang);
  skor.D2c = koreksiD2c(skor.D2c, m.ide);
  skor.D2a = batasD2a(skor.D2a, m.asal);
  const diubah = (Object.keys(skor) as Indikator[]).filter((i) => awal[i]?.skor !== skor[i].skor);
  return { skor, diubah };
}

/** Normalisasi BMC dari agen: blok berupa teks atau {isi, asal, isian}. */
export function bacaBmc(b: unknown, blok: readonly string[]): { bmc: Record<string, string>; asal: Record<string, AsalBlok> } {
  const o = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
  const bmc: Record<string, string> = {};
  const asal: Record<string, AsalBlok> = {};
  for (const x of blok) {
    const v = o[x];
    if (v && typeof v === "object") {
      const w = v as Record<string, unknown>;
      bmc[x] = String(w.isi ?? "");
      const a = String(w.asal ?? "").toLowerCase();
      asal[x] = a === "ide" || a === "turunan" || a === "kosong" ? a : bmc[x].trim() ? "turunan" : "kosong";
    } else {
      bmc[x] = typeof v === "string" ? v : "";
      asal[x] = bmc[x].trim() ? "turunan" : "kosong";
    }
  }
  return { bmc, asal };
}
