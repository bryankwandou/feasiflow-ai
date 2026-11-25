// Membangkitkan bagian referensi dokumentasi langsung dari kode, agar isi dokumen selalu sama dengan sistem.
// Jalankan: npx tsx docs/_gen/referensi.ts
import fs from "node:fs";
import path from "node:path";
import * as P from "../../lib/tiga-agen/prompt";
import * as T from "../../lib/tiga-agen/tipe";
import { DEKLARASI } from "../../lib/tiga-agen/alat";
import { BAHASA } from "../../lib/i18n";
import { KALIMAT_SISTEM_INJEKSI } from "../../lib/tiga-agen/injeksi";
import { PERAN_REKOMENDASI } from "../../lib/tiga-agen/rekomendasi";

const AKAR = path.resolve(__dirname, "../..");
const tulis = (nama: string, isi: string) => {
  fs.writeFileSync(path.join(AKAR, "docs", nama), isi, "utf8");
  console.log(nama, Buffer.byteLength(isi));
};
const blok = (t: string) => "```text\n" + t + "\n```\n";
const kode = (bhs: string, t: string) => "```" + bhs + "\n" + t + "\n```\n";

// ---------- A. Prompt lengkap ----------
const prompt: [string, string, string][] = [
  ["A1 (riset)", "PERAN_A1", P.PERAN_A1],
  ["A1 sunting (perbaikan tanpa alat)", "PERAN_A1_SUNTING", P.PERAN_A1_SUNTING],
  ["A2 (analisis BMC dan risiko)", "PERAN_A2", P.PERAN_A2],
  ["A3 (penilaian)", "PERAN_A3", P.PERAN_A3],
  ["K2 (pembanding: satu agen beralat)", "PERAN_K2", P.PERAN_K2],
  ["K1 (pembanding: satu LLM tanpa alat)", "PERAN_K1", P.PERAN_K1],
  ["Rekomendasi aksi bersumber", "PERAN_REKOMENDASI", PERAN_REKOMENDASI],
  ["Kalimat sistem pertahanan injeksi (ditambahkan ke setiap agen beralat)", "KALIMAT_SISTEM_INJEKSI", KALIMAT_SISTEM_INJEKSI],
];
let a = "# Lampiran A. Teks Prompt Lengkap\n\n";
a += "Berkas ini dibangkitkan otomatis oleh `docs/_gen/referensi.ts` dari `lib/tiga-agen/prompt.ts`, `lib/tiga-agen/rekomendasi.ts`, dan `lib/tiga-agen/injeksi.ts`. Jangan disunting tangan; ubah kodenya lalu jalankan ulang pembangkit.\n\n";
a += `Versi prompt: **${P.VERSI_PROMPT.versi}**. Setiap hasil analisis menyimpan sidik SHA-256 dari setiap teks di bawah (kolom \`versi_prompt\`), sehingga hasil uji dapat dicocokkan dengan teks prompt yang benar-benar dipakai.\n\n`;
a += "| Prompt | Konstanta | Panjang (karakter) | SHA-256 |\n|---|---|---|---|\n";
const shaMap = P.VERSI_PROMPT.sha256 as Record<string, string>;
const kunciSha: Record<string, string> = { PERAN_A1: "A1", PERAN_A1_SUNTING: "A1_sunting", PERAN_A2: "A2", PERAN_A3: "A3", PERAN_K2: "K2", PERAN_K1: "K1" };
for (const [j, k, t] of prompt) a += `| ${j} | \`${k}\` | ${t.length} | ${shaMap[kunciSha[k]] ? "`" + shaMap[kunciSha[k]].slice(0, 16) + "…`" : "-"} |\n`;
a += "\n";
for (const [j, k, t] of prompt) a += `## ${j}\n\nKonstanta \`${k}\`, ${t.length} karakter.\n\n` + blok(t) + "\n";
a += "## Blok bersama\n\nBlok berikut dikirim kata demi kata sama ke A1/A2/A3, K1, dan K2, sehingga perbedaan hasil antarkonfigurasi tidak berasal dari perbedaan aturan.\n\n";
for (const [j, t] of [["RISET_LANGKAH", P.RISET_LANGKAH], ["RISET_ATURAN", P.RISET_ATURAN], ["ANALISIS_LANGKAH", P.ANALISIS_LANGKAH], ["ANALISIS_ATURAN", P.ANALISIS_ATURAN], ["SKALA", T.SKALA], ["ATURAN_RUBRIK", T.ATURAN_RUBRIK]] as const) a += `### ${j}\n\n` + blok(t) + "\n";
tulis("A-teks-prompt-lengkap.md", a);

// ---------- B. Rubrik ----------
let b = "# Lampiran B. Rubrik dan Uraian Indikator (dari kode)\n\nDibangkitkan otomatis dari `lib/tiga-agen/tipe.ts`.\n\n";
b += `Indikator: ${T.RUBRIK.join(", ")} (${T.RUBRIK.length} indikator).\n\n`;
b += "| Indikator | Uraian di kode |\n|---|---|\n";
const ur = T.URAIAN_RUBRIK as Record<string, unknown>;
for (const k of T.RUBRIK) b += `| ${k} | ${JSON.stringify(ur[k]).replace(/\|/g, "\\|")} |\n`;
b += "\n## Blok Business Model Canvas\n\n" + T.BLOK_BMC.map((x, i) => `${i + 1}. \`${x}\`${(T.BLOK_INTI as readonly string[]).includes(x) ? " (blok inti, dinilai pada D2a)" : ""}`).join("\n") + "\n\n";
for (const nama of ["BENTUK_HUKUM", "JENIS_PENDANAAN", "LAYANAN", "SYARAT_SDM", "TAHAP_KESIAPAN"] as const) {
  const v = (T as Record<string, unknown>)[nama];
  if (v) b += `## ${nama}\n\n` + kode("json", JSON.stringify(v, null, 2)) + "\n";
}
tulis("B-rubrik-dari-kode.md", b);

// ---------- C. Alat agen ----------
let c = "# Lampiran C. Deklarasi Alat Agen (function calling)\n\nDibangkitkan otomatis dari `DEKLARASI` di `lib/tiga-agen/alat.ts`. Model memilih alat; kode yang menjalankannya dan memeriksa hasilnya.\n\n";
for (const [n, d] of Object.entries(DEKLARASI)) c += `## \`${n}\`\n\n` + kode("json", JSON.stringify(d, null, 2)) + "\n";
tulis("C-deklarasi-alat.md", c);

// ---------- D. Rute API ----------
let d = "# Lampiran D. Rute API (dari kode sumber)\n\nSetiap rute di bawah disalin dari `app/api/**/route.ts` apa adanya.\n\n";
const cari = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? cari(path.join(dir, e.name)) : e.name === "route.ts" ? [path.join(dir, e.name)] : []));
for (const f of cari(path.join(AKAR, "app", "api")).sort()) {
  const rel = path.relative(AKAR, f).replace(/\\/g, "/");
  const url = "/" + rel.replace(/^app\//, "").replace(/\/route\.ts$/, "");
  const src = fs.readFileSync(f, "utf8");
  const metode = [...src.matchAll(/export async function (GET|POST|PUT|DELETE)/g)].map((m) => m[1]).join(", ");
  d += `## \`${url}\`\n\nMetode: ${metode || "-"}. Berkas: \`${rel}\`.\n\n` + kode("ts", src.trim()) + "\n";
}
tulis("D-rute-api.md", d);

// ---------- E. Bahasa ----------
let e = "# Lampiran E. Daftar Bahasa Antarmuka\n\nDibangkitkan dari `lib/i18n/index.ts` dan folder `lib/i18n/kamus`.\n\n| Kode | Nama | Lokal Intl | Arah | Jumlah kunci |\n|---|---|---|---|---|\n";
for (const x of BAHASA) {
  const f = path.join(AKAR, "lib/i18n/kamus", x.kode + ".ts");
  const n = fs.existsSync(f) ? (fs.readFileSync(f, "utf8").match(/^\s*"[^"]+":/gm) || []).length : 0;
  e += `| ${x.kode} | ${x.nama} | ${x.lokal} | ${x.arah} | ${n} |\n`;
}
const idSrc = fs.readFileSync(path.join(AKAR, "lib/i18n/kamus/id.ts"), "utf8");
e += "\n## Kamus sumber (bahasa Indonesia)\n\nSemua kunci di bawah wajib ada di kamus lain; kunci yang hilang jatuh ke nilai bahasa Indonesia.\n\n" + kode("ts", idSrc.trim()) + "\n";
tulis("E-bahasa-dan-kamus.md", e);
