// Skenario pembanding K1 (subbab 3.3.5): model yang sama dijalankan sebagai satu LLM tanpa agen,
// tanpa alat pencarian, dan tanpa pemeriksaan antarfase. Prompt v2: K1 menerima SKALA dan ATURAN_RUBRIK yang sama
// kata demi kata dengan K2 dan K3, ditambah sikap kritis, anti-halusinasi, dan aturan data tidak tepercaya.
// Skor gabungan dan kelas dihitung dengan aturan yang sama.

import { modelUntuk, panggilGemini, type Pakai } from "./gemini";
import { bungkusIde, saringKritik, type Kritik } from "./agentik";
import { hitungDinamis } from "./dinamis";
import { hitungSkor } from "./kelas";
import { barisTanggal, PERAN_K1, VERSI_PROMPT } from "./prompt";
import { RUBRIK, type Ide, type Indikator, type SkorIndikator } from "./tipe";

export interface HasilPembanding {
  ide: Ide;
  skor: Record<Indikator, SkorIndikator>;
  dimensi: { D1: number; D2: number; D3: number };
  /** Skor tampilan 1-100 (skor dinamis v2), modul yang sama dengan K3. */
  dinamis?: ReturnType<typeof hitungDinamis>;
  bep_bulan?: number | null;
  S: number;
  kelas: "Layak" | "Layak Bersyarat" | "Tidak Layak";
  aturan_gugur: boolean;
  /** Indikator yang tidak dijawab sah oleh model dan diberi 50. */
  tidak_sah: Indikator[];
  bmc_inti?: Record<string, unknown>;
  kritik?: Kritik;
  versi_prompt: typeof VERSI_PROMPT;
  pakai: Record<string, Pakai>;
  model: string;
  detik: number;
}

export async function jalankanPembanding(ide: Ide): Promise<HasilPembanding> {
  const t0 = Date.now();
  const pakai: Record<string, Pakai> = {};
  const ideTeks = bungkusIde(ide);
  const r = await panggilGemini("Pembanding", pakai, {
    sistem: PERAN_K1,
    isi: [{ role: "user", parts: [{ text: barisTanggal() + "\nNilai ide di bawah.\n" + ideTeks }] }],
    json: true,
    maksKeluar: 3000,
  });
  let d: Record<string, unknown> = {};
  try {
    d = JSON.parse((/\{[\s\S]*\}/.exec(r.teks) || ["{}"])[0]);
  } catch {
    d = {};
  }
  const ds = (d.skor && typeof d.skor === "object" ? d.skor : d) as Record<string, unknown>;
  const tidak_sah: Indikator[] = [];
  const skor = {} as Record<Indikator, SkorIndikator>;
  for (const ind of RUBRIK) {
    const x = (ds[ind] && typeof ds[ind] === "object" ? ds[ind] : {}) as Record<string, unknown>;
    const s = Number(x.skor);
    const sah = s === 0 || s === 50 || s === 100;
    if (!sah) tidak_sah.push(ind);
    skor[ind] = { skor: (sah ? s : 50) as 0 | 50 | 100, bukti: String(x.bukti ?? x.alasan ?? ""), sumber: String(x.sumber ?? "pengetahuan model") };
  }
  const h = hitungSkor(skor);
  // Skor tampilan 1-100 dengan modul yang sama dengan K3; skor 0/50/100 dan kelas tidak berubah.
  let dinamis: ReturnType<typeof hitungDinamis> | undefined;
  try { dinamis = hitungDinamis({ ide, skor }); } catch (e) { console.error("skor dinamis K1:", String(e).slice(0, 200)); }
  return {
    ide,
    dinamis,
    bep_bulan: dinamis?.bep_bulan ?? null,
    skor,
    dimensi: h.dimensi,
    S: h.S,
    kelas: h.kelas,
    aturan_gugur: h.gugur,
    tidak_sah,
    bmc_inti: d.bmc_inti && typeof d.bmc_inti === "object" ? (d.bmc_inti as Record<string, unknown>) : undefined,
    // K1 tidak punya bukti laman: kritik berangka hanya sah bila angkanya ada di isian.
    kritik: saringKritik(d.kritik, ideTeks),
    versi_prompt: VERSI_PROMPT,
    pakai,
    model: modelUntuk("Pembanding"),
    detik: Math.round((Date.now() - t0) / 1000),
  };
}
