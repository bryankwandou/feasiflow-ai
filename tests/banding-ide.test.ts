// Uji murni peringkat SAW banding ide. Jalankan: npx tsx tests/banding-ide.test.ts
// Tanpa jaringan dan tanpa Gemini: hanya fungsi peringkatSAW dan bobotRubrik.
import assert from "node:assert/strict";
import { peringkatSAW, bobotRubrik, type MasukanBanding } from "../lib/tiga-agen/banding-ide";
import { hitungSkor } from "../lib/tiga-agen/kelas";
import { RUBRIK, type Indikator, type SkorIndikator } from "../lib/tiga-agen/tipe";

const kasus: [string, () => void][] = [];
const uji = (n: string, f: () => void) => kasus.push([n, f]);

type Nilai = 0 | 50 | 100;
/** Ide tiruan: semua indikator bernilai `dasar`, kecuali yang ditimpa. */
function ide(nama: string, dasar: Nilai, timpa: Partial<Record<Indikator, Nilai>> = {}, buang: Indikator[] = []): MasukanBanding {
  const skor = Object.fromEntries(
    RUBRIK.filter((i) => !buang.includes(i)).map((i) => [i, { skor: timpa[i] ?? dasar, bukti: `bukti ${i}`, sumber: "uji" } satisfies SkorIndikator]),
  ) as Record<Indikator, SkorIndikator>;
  return { nama, hasil: { skor, session_id: "sf_" + nama } };
}

uji("bobot rubrik sama dan berjumlah 1", () => {
  const w = bobotRubrik(RUBRIK);
  for (const i of RUBRIK) assert.equal(w[i], 0.1);
  const w2 = bobotRubrik(["D1a", "D1b"], { D1a: 3, D1b: 1 });
  assert.equal(w2.D1a, 0.75);
  assert.throws(() => bobotRubrik(["D1a"], { D1a: 0 }));
});

uji("menolak kurang dari 2 atau lebih dari 5 ide", () => {
  assert.throws(() => peringkatSAW([ide("A", 100)]), /2 sampai 5/);
  assert.throws(() => peringkatSAW(Array.from({ length: 6 }, (_, k) => ide("I" + k, 50))), /2 sampai 5/);
});

uji("normalisasi maks dan V sesuai rumus SAW", () => {
  // A: semua 100 kecuali D1b 50; B: semua 50. maks D1b = 50, jadi F_A(D1b) = 1, F_B(D1b) = 1.
  const h = peringkatSAW([ide("B", 50), ide("A", 100, { D1b: 50 })]);
  const A = h.baris.find((b) => b.nama === "A")!;
  const B = h.baris.find((b) => b.nama === "B")!;
  assert.equal(A.V, 100);
  assert.equal(B.normal.D1a, 0.5);
  assert.equal(B.normal.D1b, 1);
  // V_B = 0.1 * (9 * 0.5 + 1) * 100 = 55
  assert.equal(B.V, 55);
  assert.equal(h.baris[0].nama, "A");
  assert.equal(A.S, hitungSkor(ide("A", 100, { D1b: 50 }).hasil.skor).S);
});

uji("ide gugur selalu di bawah walau V lebih tinggi", () => {
  const g = ide("Gugur", 100, { D3a: 0 });
  const r = ide("Rendah", 50);
  const h = peringkatSAW([g, r]);
  assert.deepEqual(h.baris.map((b) => b.nama), ["Rendah", "Gugur"]);
  assert.equal(h.baris[1].gugur, true);
  assert.equal(h.baris[1].kelas, "Tidak Layak");
  assert.match(h.baris[1].alasan[0], /^Gugur: D3a/);
  assert.match(h.baris[0].alasan.join(" "), /Gugur gugur pada D3a/);
});

uji("aturan_gugur tersimpan dihormati", () => {
  const a = ide("A", 100);
  a.hasil.aturan_gugur = true;
  const h = peringkatSAW([a, ide("B", 50)]);
  assert.equal(h.baris[1].nama, "A");
});

uji("deterministik dan tidak bergantung urutan selain seri penuh", () => {
  const xs = [ide("A", 50, { D1a: 100 }), ide("B", 50, { D2c: 100, D3b: 100 }), ide("C", 100, { D3c: 0 })];
  const satu = peringkatSAW(xs).baris.map((b) => b.nama);
  const dua = peringkatSAW([...xs].reverse()).baris.map((b) => b.nama);
  assert.deepEqual(satu, dua);
  assert.deepEqual(satu, ["C", "B", "A"]);
  assert.deepEqual(peringkatSAW(xs), peringkatSAW(xs));
});

uji("seri penuh diurutkan menurut urutan masukan dan ditandai", () => {
  const h = peringkatSAW([ide("P", 50), ide("Q", 50)]);
  assert.deepEqual(h.baris.map((b) => b.nama), ["P", "Q"]);
  assert.equal(h.baris[1].seri_dengan_atas, true);
  assert.match(h.baris[0].alasan.join(" "), /seri penuh/);
});

uji("seri V dipecah oleh S lalu jumlah nol", () => {
  // Bobot khusus: hanya D1a berbobot, jadi V sama; S berbeda karena D1b.
  const h = peringkatSAW([ide("X", 50, { D1a: 100 }), ide("Y", 50, { D1a: 100, D1b: 100 })], { bobot: { D1a: 1 } });
  assert.equal(h.baris[0].V, h.baris[1].V);
  assert.equal(h.baris[0].nama, "Y");
  assert.match(h.baris[0].alasan.join(" "), /skor rubrik S lebih tinggi/);
});

uji("indikator yang tidak ada pada semua ide dilewati, bukan dianggap 0", () => {
  const h = peringkatSAW([ide("Lama", 100, {}, ["D2d"]), ide("Baru", 100)]);
  assert.deepEqual(h.dilewati, ["D2d"]);
  assert.equal(h.indikator.length, 9);
  assert.equal(h.baris[0].V, 100);
  assert.equal(h.baris[1].V, 100);
  assert.match(h.catatan[0], /D2d/);
});

uji("kolom semua 0 tidak membagi dengan nol", () => {
  const h = peringkatSAW([ide("A", 50, { D3c: 0 }), ide("B", 100, { D3c: 0 })]);
  for (const b of h.baris) assert.equal(b.normal.D3c, 0);
  assert.ok(h.baris.every((b) => Number.isFinite(b.V)));
  assert.match(h.catatan.join(" "), /D3c/);
});

uji("alasan menyebut indikator unggul dan selisih kontribusi", () => {
  const h = peringkatSAW([ide("A", 50), ide("B", 50, { D2c: 100 })]);
  assert.equal(h.baris[0].nama, "B");
  assert.match(h.baris[0].alasan.join(" "), /Terbaik di antara ide pada D2c/);
  assert.match(h.baris[0].alasan.join(" "), /Unggul atas A terutama pada D2c \(\+5,0\)/);
});

uji("lima ide diterima", () => {
  const h = peringkatSAW([0, 50, 100, 50, 0].map((v, k) => ide("I" + k, 50, { D1a: v as Nilai })));
  assert.equal(h.baris.length, 5);
  assert.equal(h.baris[0].nama, "I2");
  assert.deepEqual(h.baris.map((b) => b.peringkat), [1, 2, 3, 4, 5]);
});

let gagal = 0;
for (const [n, f] of kasus) {
  try { f(); console.log("lulus  " + n); } catch (e) { gagal++; console.error("GAGAL  " + n + "\n  " + String((e as Error).message)); }
}
console.log(`\n${kasus.length - gagal}/${kasus.length} lulus`);
if (gagal) process.exit(1);
