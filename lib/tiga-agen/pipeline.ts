// Alur 3 agen (subbab 3.3.2): A1 Riset -> pemeriksaan -> A2 Analisis ->
// pemeriksaan -> A3 Penilaian -> pemeriksaan -> skor dan kelas dihitung kode.
// Prompt v2 ada di prompt.ts; aturan kode bersama (juga dipakai K2k) ada di aturan-kode.ts.

import { BATAS_BULAN, DEKLARASI, Konteks, umurBulan } from "./alat";
import { modelUntuk, panggilGemini, type Isi, type Pakai } from "./gemini";
import { hitungSkor } from "./kelas";
import { hitungDinamis } from "./dinamis";
import { KALIMAT_SISTEM_INJEKSI } from "./injeksi";
import { buatRekomendasiAksi, sumberDariGudang } from "./rekomendasi";
import { angkaPerButir, angkaTanpaBukti, bungkus, bungkusIde, Perekam, saringKritik } from "./agentik";
import {
  adaRencana, bacaBmc, batasD2a, kalimatRencana, koreksiD1b, koreksiD1c, koreksiD2c, nilaiTetap, RISIKO_DATA, RISIKO_GAGAL_BAYAR,
  skorRisiko as skorRisikoKode, TANDA_DATA, TANDA_GAGAL_BAYAR, teksRencana as teksRencanaKode, type AsalBlok,
} from "./aturan-kode";
import { agenLog, catatLog } from "./log";
import { barisTanggal, PERAN_A1, PERAN_A1_SUNTING, PERAN_A2, PERAN_A3, VERSI_PROMPT } from "./prompt";
import {
  BLOK_BMC,
  RUBRIK,
  URAIAN_RUBRIK,
  type HasilAnalisis,
  type Ide,
  type Indikator,
  type Kirim,
  type Pemeriksaan,
  type SkorIndikator,
} from "./tipe";

export { angkaTanpaBukti } from "./agentik";
export { PERAN_A1, PERAN_A2, PERAN_A3 } from "./prompt";

/** Kategori alasan penolakan, agar penolakan dapat dilaporkan per kategori. */
export function kategoriPenolakan(c: string): string {
  const m = /^(D\d[abc])/.exec(c);
  if (m) return m[1];
  if (/angka/i.test(c)) return "angka";
  if (/alamat|sumber/i.test(c)) return "sumber";
  if (/laman terbaca|Direktori|Statistik/i.test(c)) return "cakupan riset";
  if (/BMC|blok/i.test(c)) return "BMC";
  if (/risiko|penanganan/i.test(c)) return "risiko";
  return "lain";
}

function ambilJson(t: string): Record<string, unknown> {
  const m = /\{[\s\S]*\}/.exec(t || "");
  if (!m) return {};
  try {
    return JSON.parse(m[0]);
  } catch {
    return {};
  }
}

export async function jalankan(ide: Ide, sessionId: string, kirim: Kirim): Promise<HasilAnalisis> {
  const t0 = Date.now();
  const pakai: Record<string, Pakai> = {};
  const k = new Konteks(ide, pakai);
  const pemeriksaan: Pemeriksaan[] = [];
  // Isian dikirim di antara penanda <ide> agar model membedakan data dari perintah.
  const ideTeks = bungkusIde(ide);
  const tanggal = barisTanggal();
  /** Teks laman tersimpan untuk pemeriksaan angka per butir (hanya tingkat 1-2). */
  const teksLaman = (a: string) => { const g = k.gudang.get(a); return g && g.tingkat <= 2 ? g.teks : undefined; };
  let asalBmc: Record<string, AsalBlok> = {};
  let jatahRiset = 2;
  let jatahRevisi = 1;
  const rekam = new Perekam();
  rekam.periksaIde(ide);

  const catat = (agen: string, alat: string, args: unknown, hasil: unknown) => {
    const j = {
      agen,
      alat,
      argumen: JSON.stringify(args).slice(0, 220),
      ringkas: JSON.stringify(hasil).slice(0, 200),
    };
    k.jejak.push(j);
    kirim({ event: "langkah", ...j });
    catatLog({ agen: agenLog(agen), jenis: "panggilan_alat", alat, argumen: JSON.stringify(args), keluaran: JSON.stringify(hasil) });
  };

  async function jalankanAlat(agen: string, nama: string, args: Record<string, unknown>, boleh: string[]) {
    if (!boleh.includes(nama)) return { galat: "alat tidak tersedia untuk agen ini" };
    try {
      if (nama === "cari_web") return await k.cari_web(args);
      if (nama === "cari_jurnal") return await k.cari_jurnal(args);
      if (nama === "baca_laman") return await k.baca_laman(args);
      if (nama === "cek_direktori_ojk") return k.cek_direktori_ojk(args);
      if (nama === "cek_statistik_ojk") return k.cek_statistik_ojk(args);
      if (nama === "lihat_bukti") return k.lihat_bukti(args);
      if (nama === "minta_riset") {
        if (jatahRiset <= 0) return { galat: "jatah permintaan riset habis" };
        jatahRiset--;
        k.hitung.minta_riset++;
        const alasan = String(args.pertanyaan ?? Object.values(args)[0] ?? "").slice(0, 200);
        k.batasCari += 1;
        const t = await agen_(
          "A1+",
          PERAN_A1,
          tanggal + "\nCari bukti untuk pertanyaan di bawah dengan membaca 1 sampai 3 laman (pakai tautan yang sudah ada atau 1 kueri baru), " +
            "lalu tulis temuan singkat bersumber.\n" + bungkus("pertanyaan", alasan) + "\n" + ideTeks,
          ["cari_web", "cari_jurnal", "baca_laman", "cek_direktori_ojk", "cek_statistik_ojk"],
          3,
        );
        rekam.delegasi.push({ dari: agen, ke: "A1", alat: nama, alasan: alasan.slice(0, 300), hasil: t.slice(0, 300) });
        return { temuan_tambahan: t.slice(0, 2200) };
      }
      if (nama === "minta_revisi_analisis") {
        // Delegasi balik A3 -> A2: A2 bekerja lagi dengan PERAN_A2 dan alatnya sendiri; hasilnya menggantikan BMC dan risiko.
        if (jatahRevisi <= 0) return { galat: "jatah permintaan revisi habis" };
        jatahRevisi--;
        k.hitung.minta_revisi++;
        const alasan = String(args.pertanyaan ?? Object.values(args)[0] ?? "").slice(0, 400);
        await analisis(alasan);
        rekam.delegasi.push({ dari: agen, ke: "A2", alat: nama, alasan: alasan.slice(0, 300), hasil: ("BMC dan risiko direvisi: " + risiko.map((x) => x.risiko).join("; ")).slice(0, 300) });
        return { bmc, risiko };
      }
    } catch (e) {
      return { galat: String(e).slice(0, 160) };
    }
    return { galat: "alat tidak dikenal" };
  }

  /** Lingkar agen: model memilih alat; kode menjalankannya dan mengembalikan hasil. */
  /** dipaksa: pesan pertama dikirim kode (putaran ulang karena penolakan atau riset ulang otomatis), bukan keputusan agen. */
  async function agen_(nama: string, peran: string, tugas: string, alat: string[], maks: number, dipaksa = false): Promise<string> {
    const isi: Isi[] = [{ role: "user", parts: [{ text: tugas }] }];
    const dek = alat.map((a) => DEKLARASI[a]);
    for (let langkah = 0; langkah < maks; langkah++) {
      const r = await panggilGemini(nama, pakai, { sistem: peran + "\n\n" + KALIMAT_SISTEM_INJEKSI, isi, alat: dek });
      const teks = rekam.giliranModel(nama, r.teks, r.panggilanAlat.map((c) => c.name), dipaksa && langkah === 0);
      if (!r.panggilanAlat.length) return teks;
      isi.push(r.isi);
      const balasan = await Promise.all(
        r.panggilanAlat.map(async (c) => {
          const h = await jalankanAlat(nama, c.name, c.args, alat);
          catat(nama, c.name, c.args, h);
          // Hasil alat dibungkus sebagai data tidak tepercaya dan diperiksa pola instruksinya.
          return { functionResponse: { name: c.name, response: rekam.bungkus(c.name, h) } };
        }),
      );
      isi.push({ role: "user", parts: balasan });
    }
    rekam.batasLangkah = true;
    isi.push({ role: "user", parts: [{ text: "Batas langkah tercapai. Tulis jawaban akhir sekarang tanpa memanggil alat." }] });
    return rekam.giliranModel(nama, (await panggilGemini(nama, pakai, { sistem: peran, isi })).teks, [], true);
  }

  const periksa = (fase: string, percobaan: number, catatan: string[]) => {
    const p = { fase, percobaan, lolos: catatan.length === 0, catatan };
    pemeriksaan.push(p);
    kirim({ event: "periksa", ...p });
    if (!p.lolos) catatLog({ agen: agenLog(fase), jenis: "penolakan_pemeriksa", masukan: fase + " percobaan " + percobaan, keluaran: catatan.join("; ") });
    return p.lolos;
  };

  // ── A1 Riset ────────────────────────────────────────────────────────────
  kirim({ event: "agent_start", agent: "a1", progress: 5 });
  let tA = Date.now();
  let tugas1 = tanggal + "\nKumpulkan bukti untuk ide di bawah sesuai CARA KERJA, lalu tulis temuan sesuai FORMAT KELUARAN.\n" + ideTeks;
  let riset = "";
  let angka = { diperiksa: [] as string[], hilang: [] as string[] };
  let pakaiAlat = true;
  for (let coba = 0; coba < 3; coba++) {
    // Perbaikan yang tidak butuh bacaan baru cukup satu panggilan tanpa alat.
    if (coba > 0) rekam.perbaikan++;
    riset = pakaiAlat
      ? await agen_("A1", PERAN_A1, tugas1, ["cari_web", "cari_jurnal", "baca_laman", "cek_direktori_ojk", "cek_statistik_ojk"], 5, coba > 0)
      : rekam.giliranModel("A1", (await panggilGemini("A1", pakai, { sistem: PERAN_A1_SUNTING, isi: [{ role: "user", parts: [{ text: tugas1 }] }] })).teks, [], true);
    // Angka per butir dicocokkan dengan laman tingkat 1-2 yang disebut butir itu; angka isian hanya sah dengan awalan "menurut isian pemohon".
    angka = angkaPerButir(riset, teksLaman, k.teksBerwenang(), JSON.stringify(ide));
    const g: string[] = [];
    if (k.lamanTerbaca < 3) g.push(`laman terbaca baru ${k.lamanTerbaca}, sekurang-kurangnya 3`);
    if (!k.hitung.ojk) g.push("Direktori LPBBTI belum diperiksa");
    if (!k.statistik) g.push("Statistik LPBBTI OJK untuk provinsi wilayah sasaran belum diperiksa; panggil cek_statistik_ojk dengan nama provinsi");
    const alamat = riset.match(/https?:\/\/[^\s)\]>"'`]+/g) || [];
    if (!alamat.length) g.push("temuan tanpa alamat sumber");
    const asing = alamat.map((a) => a.replace(/[.,;]+$/, "")).filter((a) => !k.gudang.has(a));
    if (asing.length) g.push("alamat sumber yang tidak pernah dibaca: " + Array.from(new Set(asing)).slice(0, 3).join(", "));
    if (angka.hilang.length) g.push("angka tidak ada pada sumber tingkat 1 atau 2 (media dan sumber lain hanya keterangan): " + angka.hilang.slice(0, 6).join(", "));
    // Aturan 24 bulan: butir temuan yang memuat angka tidak boleh bersumber dari laman yang sudah lama terbit.
    const usang = new Set<string>();
    for (const butir of riset.split(/\n+/)) {
      if (!/\d[\d.,]*\s*(%|persen|miliar|triliun|juta|ribu)/i.test(butir)) continue;
      for (const a of butir.match(/https?:\/\/[^\s)\]>"'`]+/g) || []) {
        const t = k.gudang.get(a.replace(/[.,;]+$/, ""))?.terbit;
        if (t && umurBulan(t) > BATAS_BULAN) usang.add(a.replace(/[.,;]+$/, "") + " (terbit " + t + ")");
      }
    }
    if (usang.size) g.push("angka dari laman yang terbit lebih dari 24 bulan lalu: " + Array.from(usang).slice(0, 3).join(", ") + "; hapus angkanya atau ganti dengan data Statistik LPBBTI OJK");
    if (periksa("A1", coba + 1, g) || coba === 2) break;
    tugas1 =
      "Keluaranmu ditolak pemeriksaan: " + g.join("; ") + ". Perbaiki hanya bagian itu: baca laman tambahan bila laman kurang, " +
      "hapus atau ganti angka yang tidak ada pada bukti, dan pakai hanya alamat laman yang sudah kamu baca. Lalu tulis ulang " +
      "temuan bernomor lengkap.\n" + tanggal + "\n" + ideTeks + "\nALAMAT YANG SUDAH DIBACA:\n" +
      k.daftarBukti().map((b) => b.alamat).join("\n") + "\nTAUTAN HASIL PENCARIAN YANG BELUM DIBACA (baca dari sini lebih dulu):\n" +
      k.belumDibaca().join("\n") + "\nTEMUAN SEBELUMNYA:\n" + bungkus("riset_a1", riset.slice(0, 3500));
    pakaiAlat = k.lamanTerbaca < 3 || !k.hitung.ojk || !k.statistik || !alamat.length;
    if (k.lamanTerbaca < 3) k.batasCari += 2;
  }
  // Data Statistik LPBBTI OJK ditulis kode sebagai temuan pertama, persis seperti pada berkas sumbernya.
  if (k.statistik) {
    const st = k.statistik;
    const lain = riset.split(/\n+/).map((b) => b.trim()).filter((b) => b && !b.includes(st.sumber)).map((b) => b.replace(/^\d+[.)]\s*/, ""));
    riset = [st.kalimat + " " + st.sumber, ...lain].map((b, i) => `${i + 1}. ${b}`).join("\n");
  }
  kirim({ event: "agent_done", agent: "a1", progress: 45, elapsed_seconds: (Date.now() - tA) / 1000 });

  // ── A2 Analisis ─────────────────────────────────────────────────────────
  kirim({ event: "agent_start", agent: "a2", progress: 45 });
  tA = Date.now();
  let bmc: Record<string, string> = {};
  let risiko: { risiko: string; penanganan: string }[] = [];
  await analisis();
  kirim({ event: "agent_done", agent: "a2", progress: 70, elapsed_seconds: (Date.now() - tA) / 1000 });

  /** A2 Analisis. catatanA3 diisi bila A3 mendelegasikan revisi lewat minta_revisi_analisis. */
  async function analisis(catatanA3?: string) {
  const dasar2 = tanggal + "\nSusun BMC dan risiko untuk ide di bawah.\n" + ideTeks + "\n" + bungkus("riset_a1", riset.slice(0, 6000));
  let tugas2 = dasar2 +
    (catatanA3 ? "\n" + bungkus("keluaran_a2", JSON.stringify({ bmc, asal: asalBmc, risiko }).slice(0, 3000)) + "\nAgen penilaian (A3) meminta revisi; perbaiki sesuai catatan di bawah bila didukung ide dan riset.\n" + bungkus("catatan_a3", catatanA3) : "");
  for (let coba = 0; coba < 3; coba++) {
    if (coba > 0) rekam.perbaikan++;
    const r2 = await agen_(catatanA3 ? "A2 revisi" : "A2", PERAN_A2, tugas2, ["lihat_bukti", "minta_riset"], 4, coba > 0);
    const d = ambilJson(r2);
    // Blok berupa {isi, asal, isian}; blok yang tidak disebut ide boleh berasal "kosong".
    ({ bmc, asal: asalBmc } = bacaBmc(d.bmc, BLOK_BMC));
    for (const x of BLOK_BMC) if (asalBmc[x] === "kosong" && !bmc[x].trim()) bmc[x] = "tidak disebut pada ide";
    risiko = (Array.isArray(d.risiko) ? d.risiko : [])
      .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : { risiko: String(x) }))
      .map((x) => ({ risiko: String(x.risiko ?? ""), penanganan: String(x.penanganan ?? "belum ada pada ide") }))
      .filter((x) => x.risiko);
    const g: string[] = [];
    const kosong = BLOK_BMC.filter((x) => !bmc[x].trim());
    if (kosong.length) g.push("blok BMC tanpa isi dan tanpa asal: " + kosong.join(", "));
    if (risiko.length < 2) g.push("daftar risiko kurang dari 2");
    if (!risiko.some((x) => /gagal bayar|kredit macet|wanprestasi/i.test(x.risiko))) g.push("risiko gagal bayar belum ada");
    if (!risiko.some((x) => /data/i.test(x.risiko))) g.push("risiko perlindungan data belum ada");
    // Rencana yang disebut pada ide tidak boleh hilang dari kolom penanganan.
    for (const [nama, pola, tanda] of [
      ["gagal bayar", RISIKO_GAGAL_BAYAR, TANDA_GAGAL_BAYAR],
      ["perlindungan data", RISIKO_DATA, TANDA_DATA],
    ] as const) {
      const r = risiko.find((x) => pola.test(x.risiko) && (nama !== "perlindungan data" || !RISIKO_GAGAL_BAYAR.test(x.risiko)));
      const kal = kalimatRencana(ide, tanda, nama === "gagal bayar" ? ide.rencana_gagal_bayar : ide.rencana_data);
      if (r && kal && !adaRencana(r.penanganan)) {
        g.push(`penanganan risiko ${nama} tertulis belum ada, padahal ide menyebut: "${kal}". Salin rencana itu ke kolom penanganan`);
      }
    }
    if (periksa("A2", coba + 1, g) || coba === 2) break;
    tugas2 = "Keluaranmu ditolak pemeriksaan: " + g.join("; ") + ". Perbaiki dan balas HANYA JSON lengkap.\n" + dasar2 +
      "\n" + bungkus("keluaran_a2", r2.slice(0, 2500));
  }
  // Kolom penanganan dua risiko wajib ditetapkan kode dari ide, supaya D3b dan D3c tidak bergantung pada tafsiran model.
  for (const [pola, tanda, isian, bukanGb] of [
    [RISIKO_GAGAL_BAYAR, TANDA_GAGAL_BAYAR, ide.rencana_gagal_bayar, false],
    [RISIKO_DATA, TANDA_DATA, ide.rencana_data, true],
  ] as const) {
    const r = risiko.find((x) => pola.test(x.risiko) && (!bukanGb || !RISIKO_GAGAL_BAYAR.test(x.risiko)));
    if (!r) continue;
    const kal = kalimatRencana(ide, tanda, isian);
    if (!kal) r.penanganan = "belum ada pada ide";
    else if (!adaRencana(r.penanganan)) r.penanganan = kal;
  }
  }

  // ── A3 Penilaian ────────────────────────────────────────────────────────
  kirim({ event: "agent_start", agent: "a3", progress: 70 });
  tA = Date.now();
  let skor = {} as Record<Indikator, SkorIndikator>;
  let kritikMentah: unknown;
  /** Nilai yang ditetapkan kode, dihitung sebelum A3 dan dikirim sebagai <nilai_tetap>; tidak memicu penolakan. */
  const tetap = () => nilaiTetap(ide, k.statistik, k.gudang, risiko);
  const tugasA3 = (tambahan?: string) =>
    tanggal + "\nNilai ide di bawah.\n<nilai_tetap>\n" + JSON.stringify(tetap()) + "\n</nilai_tetap>\n" + ideTeks + "\n" + bungkus("riset_a1", riset.slice(0, tambahan ? 5000 : 6000)) +
    (tambahan ? "\n" + bungkus("riset_tambahan", tambahan.slice(0, 2500)) : "") +
    "\n" + bungkus("keluaran_a2", JSON.stringify({ bmc, asal: asalBmc, risiko }));
  let tugas3 = tugasA3();
  const teksRencana = (ind: "D3b" | "D3c") => teksRencanaKode(ide, risiko, ind);
  const skorRisiko = () => skorRisikoKode(ide, risiko);
  let angkaA3 = { diperiksa: [] as string[], hilang: [] as string[] };
  const nilai = async (fase: string) => {
  for (let coba = 0; coba < 3; coba++) {
    if (coba > 0) rekam.perbaikan++;
    const r3 = await agen_("A3", PERAN_A3, tugas3, ["lihat_bukti", "minta_riset", "minta_revisi_analisis"], 4, coba > 0 || fase !== "A3");
    const d = ambilJson(r3);
    if (d.kritik) kritikMentah = d.kritik;
    const nt = tetap();
    const g: string[] = [];
    skor = {} as Record<Indikator, SkorIndikator>;
    for (const ind of RUBRIK) {
      const x = (d[ind] && typeof d[ind] === "object" ? d[ind] : null) as Record<string, unknown> | null;
      // Indikator dengan nilai kode tidak memicu penolakan: nilainya ditimpa kode di bawah.
      if (nt[ind]) { skor[ind] = nt[ind]!; continue; }
      if (!x) {
        g.push(ind + " tidak ada");
        skor[ind] = { skor: 50, bukti: "tidak dinilai agen; bukti terbatas", sumber: "" };
        continue;
      }
      const s = Number(x.skor);
      const bukti = String(x.bukti ?? "").trim();
      const sumber = String(x.sumber ?? "").trim();
      if (![0, 50, 100].includes(s)) g.push(ind + " skor tidak sah");
      if (!bukti) g.push(ind + " tanpa bukti");
      if (s === 100 && ["D1a", "D1c", "D3a"].includes(ind)) {
        const al = (sumber.match(/https?:\/\/[^\s)\]>"'`]+/) || [""])[0].replace(/[.,;]+$/, "");
        if (!al || !k.gudang.has(al)) g.push(ind + " skor 100 tanpa sumber bukti yang tersimpan");
        else {
          const t = k.gudang.get(al)?.terbit;
          if (t && umurBulan(t) > BATAS_BULAN) g.push(ind + " skor 100 tanpa sumber yang berlaku: laman terbit " + t + ", lebih dari 24 bulan");
        }
      }
      skor[ind] = { skor: ([0, 50, 100].includes(s) ? s : 50) as 0 | 50 | 100, bukti, sumber };
    }
    if (periksa(fase, coba + 1, g) || coba === 2) {
      // Skor 100 yang tetap tanpa sumber sah diturunkan kode menjadi 50; alasannya diganti, tidak disambung.
      for (const c of g) {
        const m = /^(D\d[abc]) skor 100 tanpa sumber/.exec(c);
        if (m && !nt[m[1] as Indikator]) {
          const ind = m[1] as Indikator;
          skor[ind] = { ...skor[ind], skor: 50, bukti: "Skor 100 tanpa sumber sah yang tersimpan. (diturunkan kode: bukti terbatas)" };
        }
      }
      const agenSkor = { ...skor };
      Object.assign(skor, nt);
      skor.D1b = koreksiD1b(skor.D1b, k.statistik, k.gudang);
      skor.D1c = koreksiD1c(skor.D1c, k.gudang);
      skor.D2c = koreksiD2c(skor.D2c, ide);
      skor.D2a = batasD2a(skor.D2a, asalBmc);
      // Sumber yang bukan alamat laman ditulis seragam, agar laporan tidak memuat label buatan agen.
      for (const ind of RUBRIK) {
        const s = skor[ind].sumber.trim();
        if (/^https?:\/\//.test(s) || s === "A2" || s === "POJK Nomor 40 Tahun 2024") continue;
        skor[ind] = { ...skor[ind], sumber: ind.startsWith("D1") ? "bukti terbatas" : "A2" };
      }
      for (const ind of RUBRIK) {
        if (agenSkor[ind]?.skor !== skor[ind].skor || nt[ind]) {
          catatLog({ agen: "Kode", jenis: "penetapan_kode", alat: ind, masukan: nt[ind] ? "nilai tetap" : "agen " + (agenSkor[ind]?.skor ?? "-"), keluaran: `${ind} = ${skor[ind].skor}: ${skor[ind].bukti}` });
        }
      }
      // Angka pada bukti A3 diperiksa seperti temuan A1 (dicatat, tidak mengubah skor).
      angkaA3 = angkaPerButir(RUBRIK.filter((i) => !nt[i]).map((i) => skor[i].bukti + " " + skor[i].sumber).join("\n"), teksLaman, k.teksBerwenang() + " " + JSON.stringify({ bmc, risiko }), JSON.stringify(ide));
      break;
    }
    tugas3 += "\nKeluaranmu ditolak: " + g.join("; ") + ". Perbaiki dan balas HANYA JSON lengkap 10 indikator.";
  }
  };
  await nilai("A3");
  // Indikator pasar yang belum penuh karena bukti belum ditemukan diberi satu putaran
  // riset terarah, lalu dinilai ulang. Skor hanya naik bila bukti barunya benar-benar tersimpan.
  const skorSebelumUlang = Object.fromEntries(RUBRIK.map((i) => [i, skor[i].skor])) as Record<Indikator, number>;
  const kurang = ((k.statistik ? ["D1b", "D1c"] : ["D1a", "D1b", "D1c"]) as Indikator[]).filter((i) => skor[i].skor < 100);
  if (kurang.length && jatahRiset > 0) {
    jatahRiset--;
    k.hitung.minta_riset++;
    k.batasCari += 2;
    const tambahan = await agen_(
      "A1+",
      PERAN_A1,
      tanggal + "\nBukti untuk indikator berikut belum cukup: " + kurang.map((i) => `${i} ${URAIAN_RUBRIK[i]}`).join("; ") +
        ". Cari dengan paling banyak 2 kueri baru yang berbeda dari sebelumnya (pakai data resmi tingkat 1 atau 2: OJK, BPS, kementerian, pemerintah daerah), " +
        "baca 2 sampai 3 laman sekaligus, lalu tulis temuan bersumber satu kalimat untuk tiap indikator itu.\n" + ideTeks +
        "\nTAUTAN YANG BELUM DIBACA:\n" + k.belumDibaca().join("\n"),
      ["cari_web", "cari_jurnal", "baca_laman", "cek_direktori_ojk", "cek_statistik_ojk"],
      3,
      true,
    );
    const sebelum = skor;
    tugas3 = tugasA3(tambahan);
    await nilai("A3 ulang");
    // Penilaian ulang tidak boleh menurunkan indikator yang sudah berbukti.
    for (const ind of RUBRIK) if (sebelum[ind].skor > skor[ind].skor) skor[ind] = sebelum[ind];
  }
  kirim({ event: "agent_done", agent: "a3", progress: 95, elapsed_seconds: (Date.now() - tA) / 1000 });

  // ── Skor dan kelas dihitung kode ────────────────────────────────────────
  const { dimensi, S, gugur, kelas } = hitungSkor(skor);
  // Skor tampilan 1-100 (skor dinamis v2). Kelasnya identik dengan kelas di atas; bila gagal, laporan tetap jalan tanpa itu.
  let dinamis: HasilAnalisis["dinamis"];
  let bep_bulan: number | null = null;
  try {
    const rr = skorRisiko();
    const nTingkat1 = Array.from(k.gudang.entries()).filter(
      ([a, g]) => g.tingkat === 1 && g.jalur !== "berkas" && a !== k.statistik?.sumber && !(g.terbit && umurBulan(g.terbit) > BATAS_BULAN),
    ).length;
    const x = hitungDinamis({
      ide, skor, statistik: k.statistik, gudang: k.gudang, nTingkat1,
      unsur: { D3b: { n: rr.D3b.unsur.length, teks: ide.rencana_gagal_bayar || teksRencana("D3b").teks }, D3c: { n: rr.D3c.unsur.length, teks: ide.rencana_data || teksRencana("D3c").teks } },
    });
    dinamis = { indikator: x.indikator, S: x.S, S_diskret: x.S_diskret, berinformasi: x.berinformasi };
    bep_bulan = x.bep_bulan;
  } catch (e) {
    console.error("skor dinamis:", String(e).slice(0, 200));
  }

  // Kritik A3 tidak menyentuh skor dan kelas; butir berangka tanpa bukti dibuang kode.
  const kritik = saringKritik(kritikMentah, k.teksBerwenang() + " " + ideTeks + " " + JSON.stringify({ bmc, risiko }));
  const penolakan: Record<string, number> = {};
  for (const p of pemeriksaan) for (const c of p.catatan) { const x = kategoriPenolakan(c); penolakan[x] = (penolakan[x] || 0) + 1; }

  const hasil: HasilAnalisis = {
    kritik,
    keputusan: rekam.keputusan,
    delegasi: rekam.delegasi,
    injeksi: rekam.injeksi,
    metrik_agentik: rekam.metrik(),
    versi_prompt: VERSI_PROMPT,
    penolakan_per_kategori: penolakan,
    bmc_asal: asalBmc,
    skor_sebelum_ulang: skorSebelumUlang,
    angka_bukti_a3: angkaA3,
    session_id: sessionId,
    ide,
    riset,
    bukti: k.daftarBukti(),
    bmc,
    risiko,
    skor,
    dimensi,
    S,
    kelas,
    aturan_gugur: gugur,
    dinamis,
    bep_bulan,
    pemeriksaan,
    jejak: k.jejak,
    angka_diperiksa: angka.diperiksa.length,
    angka_tanpa_bukti: angka.hilang,
    pakai,
    hitung: k.hitung,
    detik: Math.round((Date.now() - t0) / 1000),
    model: { A1: modelUntuk("A1"), A2: modelUntuk("A2"), A3: modelUntuk("A3") },
  };
  // Rencana aksi bersumber: setiap butir wajib mengutip laman yang benar-benar dibaca agen; butir tanpa sitasi sah dibuang kode.
  try {
    hasil.rencana_aksi = await buatRekomendasiAksi(hasil, sumberDariGudang(k.gudang), { pakai });
  } catch (e) {
    console.error("rencana aksi:", String(e).slice(0, 200));
  }
  return hasil;
}
