// Uji isian sampah (anti-GIGO): semua harus ditolak lapis kode tanpa memanggil Gemini. Jalankan: npx tsx tests/sampah.test.ts
import assert from "node:assert/strict";
import { periksaIsian, type PanggilAgen } from "../lib/tiga-agen/pemeriksa-isian";
import type { Ide } from "../lib/tiga-agen/tipe";

const SAH: Ide = {
  produk: "Pinjaman modal kerja mingguan", segmen: "Perajin tenun ikat rumahan", wilayah: "Nusa Tenggara Timur",
  saluran: "Koperasi desa dan aplikasi", pendapatan: "Biaya layanan 3 persen per pencairan",
  deskripsi: "Platform pendanaan bersama untuk perajin tenun di Sumba, plafon Rp2 sampai 15 juta, tenor 8 minggu.",
};
const acak = (s: string): Ide => ({ produk: s, segmen: s, wilayah: s, saluran: s, pendapatan: s, deskripsi: s + " " + s });
const KASUS: [string, Partial<Ide>][] = [
  ["semua JUIIHLUHLIUHY", acak("JUIIHLUHLIUHY")],
  ["semua kosong", { produk: "", segmen: "", wilayah: "", saluran: "", pendapatan: "", deskripsi: "" }],
  ["semua sangat pendek", acak("ab")],
  ["huruf acak campur", { produk: "kjhkjh", segmen: "lkjlkj", wilayah: "poiupoiu", saluran: "mnbmnb", pendapatan: "zxzxzx", deskripsi: "hjgjhg kjhkjh lkjlkj poiu mnbv" }],
  ["produk acak saja", { ...SAH, produk: "JUIIHLUHLIUHY" }],
  ["wilayah acak saja", { ...SAH, wilayah: "JUIIHLUHLIUHY" }],
  ["deskripsi diselipi satu kata", { ...SAH, deskripsi: "pinjaman JUIIHLUHLIUHY KJHKJHKJ LIUHLIUH OIUYOIUY" }],
  ["deskripsi pendek", { ...SAH, deskripsi: "pinjaman" }],
  ["segmen kosong", { ...SAH, segmen: "" }],
  ["tes tes", { ...SAH, produk: "tes", deskripsi: "test test test test test test" }],
  ["lorem", { ...SAH, deskripsi: "Lorem ipsum dolor sit amet consectetur adipiscing elit" }],
];
(async () => {
  let gagal = 0;
  for (const [n, ide] of KASUS) {
    let dipanggil = 0;
    const panggil = (async () => { dipanggil++; return { isi: { role: "model", parts: [] }, teks: "{}", panggilanAlat: [] }; }) as unknown as PanggilAgen;
    for (const putaran of [1, 3]) {
      const g = await periksaIsian(ide as Ide, putaran, { panggil });
      try {
        assert.equal(g.status, "perlu_klarifikasi", n);
        assert.ok(g.catatan!.masalah.some((m) => m.sampah), n + " harus mutlak ditolak");
        assert.equal(dipanggil, 0, n + " tidak boleh memanggil Gemini");
      } catch (e) { gagal++; console.log("GAGAL  " + n + " putaran " + putaran + ": " + (e as Error).message + " " + JSON.stringify(g.catatan?.masalah)); continue; }
    }
    console.log("lulus  " + n);
  }
  // Isian sah tetap lolos ke agen pemeriksa.
  let dipanggil = 0;
  const panggil = (async () => { dipanggil++; return { isi: { role: "model", parts: [] }, teks: '{"lpbbti":true,"masalah":[],"pertanyaan":[],"terbatas":[]}', panggilanAlat: [] }; }) as unknown as PanggilAgen;
  const g = await periksaIsian(SAH, 1, { panggil });
  if (g.status !== "lanjut" || dipanggil !== 1) { gagal++; console.log("GAGAL  isian sah", g.status, JSON.stringify(g.catatan?.masalah)); } else console.log("lulus  isian sah lanjut");
  console.log(gagal ? `\n${gagal} gagal` : "\nsemua lulus");
  if (gagal) process.exit(1);
})();
