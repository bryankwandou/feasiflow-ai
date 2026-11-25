// Pembanding K2 (ablasi): SATU agen dengan alat yang sama dengan sistem 3 agen
// (cari_web, cari_jurnal, baca_laman, cek_direktori_ojk, cek_statistik_ojk, lihat_bukti). Prompt v2: PERAN_K2 tiga tahap
// (riset, analisis BMC dan risiko, penilaian) dari blok teks yang sama dengan A1, A2, dan A3, satu JSON keluaran.
// K2 tidak punya minta_riset dan minta_revisi_analisis karena tidak ada agen lain (bagian dari variabel pembagian agen).
// Dilaporkan dua kali: K2 mentah dan K2k (aturan kode yang sama dengan K3 lewat terapkanAturanKode), sehingga
// K2 ke K2k mengukur rubrik sebagai kode, dan K2k ke K3 mengukur pembagian agen beserta pemeriksaannya.

import { DEKLARASI, Konteks } from "./alat";
import { modelUntuk, panggilGemini, type Isi, type Pakai } from "./gemini";
import { hitungDinamis } from "./dinamis";
import { hitungSkor } from "./kelas";
import { angkaPerButir, bungkusIde, Perekam, saringKritik } from "./agentik";
import { bacaBmc, terapkanAturanKode } from "./aturan-kode";
import { catatLog } from "./log";
import { barisTanggal, PERAN_K2, VERSI_PROMPT } from "./prompt";
import { BLOK_BMC, RUBRIK, type Ide, type Indikator, type SkorIndikator } from "./tipe";

export const ALAT_K2 = ["cari_web", "cari_jurnal", "baca_laman", "cek_direktori_ojk", "cek_statistik_ojk", "lihat_bukti"];

/** Baca skor 10 indikator dari JSON agen ({skor: {...}} atau bentuk lama tanpa pembungkus). */
export function bacaSkor(d: Record<string, unknown>) {
  const ds = (d.skor && typeof d.skor === "object" ? d.skor : d) as Record<string, unknown>;
  const tidak_sah: Indikator[] = [];
  const skor = {} as Record<Indikator, SkorIndikator>;
  for (const ind of RUBRIK) {
    const x = (ds[ind] && typeof ds[ind] === "object" ? ds[ind] : {}) as Record<string, unknown>;
    const s = Number(x.skor);
    const sah = s === 0 || s === 50 || s === 100;
    if (!sah) tidak_sah.push(ind);
    skor[ind] = { skor: (sah ? s : 50) as 0 | 50 | 100, bukti: String(x.bukti ?? ""), sumber: String(x.sumber ?? "") };
  }
  return { skor, tidak_sah };
}

export async function jalankanSatuAgen(ide: Ide) {
  const t0 = Date.now();
  const pakai: Record<string, Pakai> = {};
  const k = new Konteks(ide, pakai);
  // Aturan data sama dengan K3: isian di antara penanda <ide>, hasil alat dibungkus, pola instruksi dicatat.
  const ideTeks = bungkusIde(ide);
  const rekam = new Perekam();
  rekam.periksaIde(ide);
  const isi: Isi[] = [{ role: "user", parts: [{ text: barisTanggal() + "\nNilai ide di bawah.\n" + ideTeks }] }];
  const dek = ALAT_K2.map((a) => DEKLARASI[a]);
  let teks = "";
  for (let langkah = 0; langkah < 8; langkah++) {
    const r = await panggilGemini("A1", pakai, { sistem: PERAN_K2, isi, alat: dek, maksKeluar: 6000, log: "K2" });
    const t = rekam.giliranModel("K2", r.teks, r.panggilanAlat.map((c) => c.name), false);
    if (!r.panggilanAlat.length) { teks = t; break; }
    isi.push(r.isi);
    const balasan = await Promise.all(r.panggilanAlat.map(async (c) => {
      let h: unknown;
      try {
        const a = c.args;
        h = c.name === "cari_web" ? await k.cari_web(a) : c.name === "cari_jurnal" ? await k.cari_jurnal(a) : c.name === "baca_laman" ? await k.baca_laman(a)
          : c.name === "cek_direktori_ojk" ? k.cek_direktori_ojk(a) : c.name === "cek_statistik_ojk" ? k.cek_statistik_ojk(a)
          : c.name === "lihat_bukti" ? k.lihat_bukti(a) : { galat: "alat tidak dikenal" };
      } catch (e) { h = { galat: String(e).slice(0, 160) }; }
      k.jejak.push({ agen: "K2", alat: c.name, argumen: JSON.stringify(c.args).slice(0, 220), ringkas: JSON.stringify(h).slice(0, 200) });
      catatLog({ agen: "K2", jenis: "panggilan_alat", alat: c.name, argumen: JSON.stringify(c.args), keluaran: JSON.stringify(h) });
      return { functionResponse: { name: c.name, response: rekam.bungkus(c.name, h) } };
    }));
    isi.push({ role: "user", parts: balasan });
  }
  if (!teks) {
    rekam.batasLangkah = true;
    isi.push({ role: "user", parts: [{ text: "Batas langkah tercapai. Tulis jawaban akhir JSON sekarang tanpa memanggil alat." }] });
    teks = rekam.giliranModel("K2", (await panggilGemini("A1", pakai, { sistem: PERAN_K2, isi, maksKeluar: 6000, log: "K2" })).teks, [], true);
  }
  let d: Record<string, unknown> = {};
  try { d = JSON.parse((/\{[\s\S]*\}/.exec(teks) || ["{}"])[0]); } catch { d = {}; }
  const { skor, tidak_sah } = bacaSkor(d);
  const { bmc, asal } = bacaBmc(d.bmc, BLOK_BMC);
  const risiko = (Array.isArray(d.risiko) ? d.risiko : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : { risiko: String(x) }))
    .map((x) => ({ risiko: String(x.risiko ?? ""), penanganan: String(x.penanganan ?? "belum ada pada ide") }))
    .filter((x) => x.risiko);
  const temuan = (Array.isArray(d.temuan) ? d.temuan : []).map(String);
  // Keterlacakan: pemeriksaan angka per butir yang sama dengan K3, pada temuan dan bukti skor (tidak mengubah skor).
  const teksLaman = (a: string) => { const g = k.gudang.get(a); return g && g.tingkat <= 2 ? g.teks : undefined; };
  const angka = angkaPerButir(temuan.join("\n") + "\n" + RUBRIK.map((i) => skor[i].bukti + " " + skor[i].sumber).join("\n"), teksLaman, k.teksBerwenang(), JSON.stringify(ide));
  const sumberSah = RUBRIK.filter((i) => /^https?:\/\//.test(skor[i].sumber) && k.gudang.has(skor[i].sumber.replace(/[.,;]+$/, ""))).length;
  const h = hitungSkor(skor);
  // K2k: aturan kode bersama diterapkan pada skor K2 yang sama.
  const k2k = terapkanAturanKode({ ide, skor, statistik: k.statistik, gudang: k.gudang, risiko, asal });
  const hk = hitungSkor(k2k.skor);
  for (const ind of k2k.diubah) catatLog({ agen: "Kode", jenis: "penetapan_kode", alat: ind, masukan: "K2k: agen " + skor[ind].skor, keluaran: `${ind} = ${k2k.skor[ind].skor}: ${k2k.skor[ind].bukti}` });
  const kritik = saringKritik(d.kritik, k.teksBerwenang() + " " + ideTeks + " " + JSON.stringify({ bmc, risiko }));
  // Skor tampilan 1-100 dengan modul yang sama dengan K3; skor 0/50/100 dan kelas tidak berubah.
  let dinamis: ReturnType<typeof hitungDinamis> | undefined;
  try { dinamis = hitungDinamis({ ide, skor, statistik: k.statistik, gudang: k.gudang }); } catch (e) { console.error("skor dinamis K2:", String(e).slice(0, 200)); }
  return {
    dinamis, bep_bulan: dinamis?.bep_bulan ?? null,
    konfigurasi: "K2 satu agen dengan alat",
    ide, skor, dimensi: h.dimensi, S: h.S, kelas: h.kelas, aturan_gugur: h.gugur, tidak_sah,
    k2k: { skor: k2k.skor, diubah_kode: k2k.diubah, dimensi: hk.dimensi, S: hk.S, kelas: hk.kelas, aturan_gugur: hk.gugur },
    temuan, bmc, bmc_asal: asal, risiko, kritik,
    keputusan: rekam.keputusan, injeksi: rekam.injeksi, metrik_agentik: rekam.metrik(), versi_prompt: VERSI_PROMPT,
    laman_terbaca: k.lamanTerbaca, angka_diperiksa: angka.diperiksa.length, angka_tanpa_bukti: angka.hilang,
    indikator_bersumber_laman: sumberSah, jejak: k.jejak, hitung: k.hitung, pakai,
    model: modelUntuk("A1"), detik: Math.round((Date.now() - t0) / 1000),
  };
}
