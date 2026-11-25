// Uji unit agen pemeriksa isian. Jalankan: npx tsx tests/pemeriksa-isian.test.ts
// Panggilan Gemini selalu di-mock; uji ini tidak memakai jaringan.
import assert from "node:assert/strict";
import { CONTOH_FORMULIR, periksaAgen, periksaIsian, periksaKode, type PanggilAgen } from "../lib/tiga-agen/pemeriksa-isian";
import { LUAR_LPBBTI } from "../lib/tiga-agen/aturan";
import { hitungSkor } from "../lib/tiga-agen/kelas";
import type { Ide } from "../lib/tiga-agen/tipe";

const SAH: Ide = {
  produk: "Pinjaman modal kerja mingguan",
  segmen: "Perajin tenun ikat rumahan",
  wilayah: "Nusa Tenggara Timur",
  saluran: "Koperasi desa dan aplikasi",
  pendapatan: "Biaya layanan 3 persen per pencairan",
  biaya: "Gaji petugas lapangan, server, penagihan",
  deskripsi: "Platform pendanaan bersama untuk perajin tenun di Sumba, plafon Rp2 sampai 15 juta, tenor 8 minggu, dibayar dari hasil penjualan kain.",
  pendapatan_bulanan: "80",
  biaya_bulanan: "50",
  biaya_awal: "400",
  modal_disetor: "25",
};

const mockJawab = (obj: unknown): PanggilAgen => (async () => ({ isi: { role: "model", parts: [] }, teks: JSON.stringify(obj), panggilanAlat: [] })) as PanggilAgen;
const mockGagal: PanggilAgen = (async () => { throw new Error("HTTP 503"); }) as PanggilAgen;
const AGEN_BERSIH = mockJawab({ lpbbti: true, masalah: [], pertanyaan: [], terbatas: [] });

let lulus = 0;
const kasus: [string, () => void | Promise<void>][] = [];
const uji = (n: string, f: () => void | Promise<void>) => kasus.push([n, f]);
const tolakDi = (ide: Partial<Ide>, isian: string) => {
  const h = periksaKode(ide);
  assert.equal(h.lolos, false, "seharusnya ditolak");
  assert.ok(h.masalah.some((m) => m.isian === isian && m.jenis === "tolak"), `tolak pada ${isian}: ${JSON.stringify(h.masalah)}`);
  return h;
};

uji("isian valid lolos tanpa tolak", () => {
  const h = periksaKode(SAH);
  assert.equal(h.lolos, true, JSON.stringify(h.masalah));
  assert.equal(h.masalah.length, 0);
});
uji("isian wajib kosong ditolak", () => { tolakDi({ ...SAH, wilayah: "" }, "wilayah"); });
uji("deskripsi terlalu pendek ditolak", () => { tolakDi({ ...SAH, deskripsi: "pinjaman cepat" }, "deskripsi"); });
uji("ketikan asdf ditolak sebagai sampah", () => {
  const h = tolakDi({ ...SAH, segmen: "asdfasdf" }, "segmen");
  assert.ok(h.masalah.find((m) => m.isian === "segmen")?.sampah);
});
uji("ketikan qwerty ditolak", () => { tolakDi({ ...SAH, wilayah: "qwerty" }, "wilayah"); });
uji("lorem ipsum ditolak", () => { tolakDi({ ...SAH, deskripsi: "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod." }, "deskripsi"); });
uji("karakter berulang ditolak", () => { tolakDi({ ...SAH, produk: "aaaaaaaa" }, "produk"); });
uji("keragaman huruf rendah ditolak", () => { tolakDi({ ...SAH, deskripsi: "abab abab abab abab abab abab abab" }, "deskripsi"); });
uji("ketikan tanpa huruf hidup ditolak", () => { tolakDi({ ...SAH, segmen: "sdfghk bnmkl" }, "segmen"); });
uji("angka negatif ditolak", () => { tolakDi({ ...SAH, biaya_awal: "-300" }, "biaya_awal"); });
uji("modal disetor negatif ditolak", () => { tolakDi({ ...SAH, modal_disetor: "minus 5" }, "modal_disetor"); });
uji("angka tak terbaca ditolak", () => { tolakDi({ ...SAH, pendapatan_bulanan: "banyak sekali" }, "pendapatan_bulanan"); });
uji("angka dengan satuan tetap terbaca", () => {
  assert.equal(periksaKode({ ...SAH, pendapatan_bulanan: "Rp80 juta", modal_disetor: "25,5 miliar" }).lolos, true);
});
uji("isian berbeda yang identik ditolak", () => { tolakDi({ ...SAH, segmen: "Pedagang sayur keliling", saluran: "pedagang sayur  keliling" }, "saluran"); });
uji("salinan placeholder ditolak", () => { tolakDi({ ...SAH, produk: "Contoh: " + CONTOH_FORMULIR.produk }, "produk"); });
uji("sama dengan contoh formulir hanya peringatan", () => {
  const h = periksaKode({ ...SAH, wilayah: CONTOH_FORMULIR.wilayah! });
  assert.equal(h.lolos, true);
  assert.ok(h.masalah.some((m) => m.isian === "wilayah" && m.jenis === "peringatan"));
});
uji("BEP tak terhitung menjadi peringatan, bukan tolak", () => {
  const h = periksaKode({ ...SAH, pendapatan_bulanan: "40", biaya_bulanan: "50" });
  assert.equal(h.lolos, true);
  assert.ok(h.masalah.some((m) => m.isian === "pendapatan_bulanan" && m.jenis === "peringatan" && /BEP/.test(m.alasan)));
});
uji("ide kripto tidak ditolak pemeriksa dan tetap gugur lewat D3a", () => {
  const ide = { ...SAH, produk: "Pinjaman berbasis token kripto", deskripsi: SAH.deskripsi + " Dana disalurkan sebagai token di blockchain." };
  const h = periksaKode(ide);
  assert.equal(h.lolos, true);
  assert.ok(h.masalah.some((m) => m.jenis === "peringatan" && /D3a/.test(m.alasan)));
  assert.ok(LUAR_LPBBTI.test(Object.values(ide).join(" ")));
  const skor = Object.fromEntries(["D1a", "D1b", "D1c", "D2a", "D2b", "D2c", "D2d", "D3a", "D3b", "D3c"].map((i) => [i, { skor: i === "D3a" ? 0 : 100, bukti: "", sumber: "" }]));
  const k = hitungSkor(skor as never);
  assert.equal(k.gugur, true);
  assert.equal(k.kelas, "Tidak Layak");
});
uji("agen: pertanyaan dibatasi 3 dan kunci tak sah jadi umum", async () => {
  const h = await periksaAgen(SAH, {}, mockJawab({
    lpbbti: true, masalah: [],
    pertanyaan: [1, 2, 3, 4].map((i) => ({ isian: i === 1 ? "ngawur" : "segmen", pertanyaan: "Tanya " + i })),
    terbatas: ["wilayah", "ngawur"],
  }));
  assert.equal(h.pertanyaan.length, 3);
  assert.equal(h.pertanyaan[0].isian, "umum");
  assert.deepEqual(h.terbatas, ["wilayah"]);
});
uji("gerbang: isian valid langsung lanjut", async () => {
  const g = await periksaIsian(SAH, 1, { panggil: AGEN_BERSIH });
  assert.equal(g.status, "lanjut");
  assert.equal(g.catatan?.putaran, 1);
});
uji("gerbang: agen gagal tidak memblokir", async () => {
  const g = await periksaIsian(SAH, 1, { panggil: mockGagal });
  assert.equal(g.status, "lanjut");
  assert.ok(g.catatan?.catatan?.[0].includes("gagal"));
});
uji("gerbang: pertanyaan agen memicu tanya balik pada putaran 1", async () => {
  const g = await periksaIsian(SAH, 1, { panggil: mockJawab({ lpbbti: true, pertanyaan: [{ isian: "segmen", pertanyaan: "Berapa jumlah perajin?" }] }) });
  assert.equal(g.status, "perlu_klarifikasi");
});
uji("gerbang: setelah putaran ke-2 analisis jalan dan isian ditandai terbatas", async () => {
  const panggil = mockJawab({ lpbbti: true, pertanyaan: [{ isian: "segmen", pertanyaan: "Berapa jumlah perajin?" }] });
  const g = await periksaIsian({ ...SAH, biaya_awal: "tidak tahu" }, 3, { panggil });
  assert.equal(g.status, "lanjut");
  assert.ok(g.catatan!.ditandaiTerbatas.includes("segmen"));
  assert.ok(g.catatan!.ditandaiTerbatas.includes("biaya_awal"));
  assert.equal(g.ide.biaya_awal, undefined, "angka tak terbaca dikosongkan");
});
uji("gerbang: teks sampah tetap ditolak setelah 2 putaran, tanpa memanggil agen", async () => {
  let dipanggil = 0;
  const panggil = (async (...a: Parameters<PanggilAgen>) => { dipanggil++; return AGEN_BERSIH(...a); }) as PanggilAgen;
  const g = await periksaIsian({ ...SAH, deskripsi: "lorem ipsum dolor sit amet lorem ipsum" }, 5, { panggil });
  assert.equal(g.status, "perlu_klarifikasi");
  assert.equal(dipanggil, 0);
});
uji("gerbang: PEMERIKSA_ISIAN=0 mematikan pemeriksa", async () => {
  process.env.PEMERIKSA_ISIAN = "0";
  try {
    const g = await periksaIsian({ ...SAH, segmen: "asdf" }, 1, { panggil: mockGagal });
    assert.equal(g.status, "mati");
  } finally { delete process.env.PEMERIKSA_ISIAN; }
});

(async () => {
  for (const [n, f] of kasus) {
    try { await f(); lulus++; console.log("lulus  " + n); }
    catch (e) { console.log("GAGAL  " + n + "\n       " + String((e as Error).message).slice(0, 300)); }
  }
  console.log(`\n${lulus}/${kasus.length} kasus lulus`);
  if (lulus !== kasus.length) process.exit(1);
})();
