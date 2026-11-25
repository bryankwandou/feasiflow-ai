// Pemanggil Gemini lewat REST, dengan pencatatan token per agen dan log masukan/keluaran (log.ts).

import { agenLog, catatLog } from "./log";

export interface Bagian {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
  [k: string]: unknown;
}
export interface Isi {
  role: "user" | "model";
  parts: Bagian[];
}
export interface Pakai {
  model: string;
  panggilan: number;
  masuk: number;
  cache: number;
  keluar: number;
  pikir: number;
  /** Jumlah panggilan yang dilayani tarif Flex (model sama, separuh harga). */
  flex?: number;
}
export interface Deklarasi {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

const DASAR = "https://generativelanguage.googleapis.com/v1beta/models/";

export function kunci(): string {
  // Buang karakter tak terlihat (BOM, spasi) yang pernah merusak header.
  return (process.env.GEMINI_API_KEY_PAID || process.env.GEMINI_API_KEY || "").replace(/[^\x21-\x7E]/g, "");
}

export function modelUntuk(agen: string): string {
  // Agen pemeriksa isian memakai model murah sendiri, tidak mengikuti GEMINI_MODEL.
  if (agen.startsWith("Pemeriksa")) return process.env.GEMINI_MODEL_PEMERIKSA || "gemini-3.5-flash-lite";
  const a = agen.slice(0, 2).toUpperCase();
  const umum = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  if (a === "A1") return process.env.GEMINI_MODEL_A1 || umum;
  if (a === "A2") return process.env.GEMINI_MODEL_A2 || umum;
  return process.env.GEMINI_MODEL_A3 || umum;
}

// Tarif Flex: model yang sama dengan separuh harga, tetapi boleh ditunda saat server padat.
// Setiap panggilan dicoba di Flex lebih dulu dengan batas waktu; bila lambat atau ditolak,
// panggilan diulang di tarif biasa. GEMINI_FLEX=0 mematikannya.
const PAKAI_FLEX = process.env.GEMINI_FLEX !== "0";
const BATAS_FLEX_MS = Number(process.env.GEMINI_FLEX_MS ?? 25000);

async function kirimGemini(model: string, badan: Record<string, unknown>, flex: boolean): Promise<Response> {
  const pengendali = new AbortController();
  const jam = flex ? setTimeout(() => pengendali.abort(), BATAS_FLEX_MS) : null;
  try {
    return await fetch(DASAR + model + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": kunci() },
      body: JSON.stringify(flex ? { ...badan, service_tier: "flex" } : badan),
      signal: pengendali.signal,
    });
  } finally {
    if (jam) clearTimeout(jam);
  }
}

/** Pencarian Google lewat alat bawaan Gemini. */
export async function cariGoogle(
  kueri: string,
  pakai: Record<string, Pakai>,
): Promise<{ judul: string; alamat: string }[]> {
  const model = modelUntuk("A1");
  const badan = {
    contents: [{ role: "user", parts: [{ text: "Cari di web, lalu tulis daftar bernomor 8 sumber berbeda yang paling relevan (satu baris ringkas per sumber, dahulukan situs resmi pemerintah dan media ekonomi Indonesia) untuk: " + kueri }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 380 },
  };
  let res: Response | null = null;
  if (PAKAI_FLEX) {
    try {
      res = await kirimGemini(model, badan, true);
      if (!res.ok) res = null;
    } catch {
      res = null;
    }
  }
  if (!res) res = await kirimGemini(model, badan, false);
  if (!res.ok) {
    console.error("cariGoogle HTTP", res.status, (await res.text()).slice(0, 300));
    return [];
  }
  const d = (await res.json()) as {
    candidates?: { groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] } }[];
    usageMetadata?: Record<string, number> & { serviceTier?: string };
  };
  const u = d.usageMetadata || {};
  const p = (pakai["Pencarian"] ??= { model, panggilan: 0, masuk: 0, cache: 0, keluar: 0, pikir: 0 });
  p.panggilan += 1;
  if (u.serviceTier === "flex") p.flex = (p.flex || 0) + 1;
  p.masuk += (u.promptTokenCount || 0) + (u.toolUsePromptTokenCount || 0);
  p.keluar += u.candidatesTokenCount || 0;
  p.pikir += u.thoughtsTokenCount || 0;
  const potong = d.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  if (!potong.length) console.error("cariGoogle tanpa sumber:", JSON.stringify(d).slice(0, 400));
  const hasil = await Promise.all(
    potong.slice(0, 8).map(async (c) => {
      const uri = c.web?.uri || "";
      if (!uri) return null;
      let alamat = uri;
      if (uri.includes("grounding-api-redirect")) {
        try {
          const r = await fetch(uri, { redirect: "manual" });
          alamat = r.headers.get("location") || "";
        } catch {
          alamat = "";
        }
      }
      return alamat.startsWith("http") ? { judul: c.web?.title || alamat, alamat } : null;
    }),
  );
  const unik = new Map<string, { judul: string; alamat: string }>();
  for (const h of hasil) if (h && !unik.has(h.alamat)) unik.set(h.alamat, h);
  return Array.from(unik.values());
}

/**
 * Cadangan terakhir pengambilan laman: fitur URL Context Gemini, yaitu Google yang mengambil laman dari
 * infrastrukturnya sendiri. Dipakai hanya untuk laman resmi yang menolak alamat IP server. Teks diterima
 * hanya bila Google melaporkan pengambilan sukses.
 */
export async function ambilLewatGoogle(alamat: string, pakai: Record<string, Pakai>): Promise<string> {
  const model = modelUntuk("A1");
  const badan = {
    contents: [{ role: "user", parts: [{ text: "Salin isi utama laman ini apa adanya, termasuk tabel dan angka, tanpa meringkas dan tanpa menambah apa pun: " + alamat }] }],
    tools: [{ url_context: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 2500 },
  };
  try {
    const res = await kirimGemini(model, badan, false);
    if (!res.ok) return "";
    const d = (await res.json()) as {
      candidates?: { content?: Isi; urlContextMetadata?: { urlMetadata?: { urlRetrievalStatus?: string }[] } }[];
      usageMetadata?: Record<string, number>;
    };
    const u = d.usageMetadata || {};
    const p = (pakai["Ambil laman"] ??= { model, panggilan: 0, masuk: 0, cache: 0, keluar: 0, pikir: 0 });
    p.panggilan += 1;
    p.masuk += (u.promptTokenCount || 0) + (u.toolUsePromptTokenCount || 0);
    p.keluar += u.candidatesTokenCount || 0;
    p.pikir += u.thoughtsTokenCount || 0;
    const c = d.candidates?.[0];
    const sukses = (c?.urlContextMetadata?.urlMetadata || []).some((m) => m.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS");
    if (!sukses) return "";
    return (c?.content?.parts || []).map((b) => (typeof b.text === "string" ? b.text : "")).join("");
  } catch {
    return "";
  }
}

const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Jawaban {
  isi: Isi;
  teks: string;
  panggilanAlat: { name: string; args: Record<string, unknown> }[];
}

export async function panggilGemini(
  agen: string,
  pakai: Record<string, Pakai>,
  opsi: {
    sistem: string;
    isi: Isi[];
    alat?: Deklarasi[];
    json?: boolean;
    maksKeluar?: number;
    /** Nama agen di log bila berbeda dari nama agen untuk model (misalnya K2 memakai model A1). */
    log?: string;
  },
): Promise<Jawaban> {
  const model = modelUntuk(agen);
  const badan: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: opsi.sistem }] },
    contents: opsi.isi,
    generationConfig: {
      temperature: 0,
      seed: 7,
      maxOutputTokens: opsi.maksKeluar ?? 3000,
      ...(opsi.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opsi.alat?.length) badan.tools = [{ functionDeclarations: opsi.alat }];

  let galat = "";
  let flex = PAKAI_FLEX;
  const t0 = Date.now();
  const akhir = opsi.isi[opsi.isi.length - 1];
  const masukan = (akhir?.parts || []).map((b) => (typeof b.text === "string" ? b.text : b.functionResponse ? "[hasil alat " + b.functionResponse.name + "] " + JSON.stringify(b.functionResponse.response).slice(0, 600) : "")).join(" | ");
  for (let coba = 0; coba < 5; coba++) {
    let res: Response;
    const denganFlex = flex;
    try {
      res = await kirimGemini(model, badan, denganFlex);
    } catch (e) {
      galat = String(e);
      // Flex yang lambat atau terputus langsung diganti tarif biasa, tanpa menunggu.
      if (denganFlex) flex = false;
      else await tidur(1500 * (coba + 1));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      galat = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
      if (denganFlex) flex = false;
      else await tidur(2500 * (coba + 1));
      continue;
    }
    if (!res.ok && denganFlex) {
      galat = `Flex HTTP ${res.status}`;
      flex = false;
      continue;
    }
    if (!res.ok) {
      throw new Error(`Gemini ${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const d = (await res.json()) as {
      candidates?: { content?: Isi; finishReason?: string }[];
      usageMetadata?: Record<string, number> & { serviceTier?: string };
    };
    const u = d.usageMetadata || {};
    const p = (pakai[agen] ??= { model, panggilan: 0, masuk: 0, cache: 0, keluar: 0, pikir: 0 });
    p.panggilan += 1;
    if (u.serviceTier === "flex") p.flex = (p.flex || 0) + 1;
    p.masuk += (u.promptTokenCount || 0) + (u.toolUsePromptTokenCount || 0);
    p.cache += u.cachedContentTokenCount || 0;
    p.keluar += u.candidatesTokenCount || 0;
    p.pikir += u.thoughtsTokenCount || 0;

    const isi: Isi = d.candidates?.[0]?.content?.parts?.length
      ? { role: "model", parts: d.candidates[0].content!.parts }
      : { role: "model", parts: [{ text: "" }] };
    const teks = isi.parts.map((b) => (typeof b.text === "string" && !b.thought ? b.text : "")).join("");
    const panggilanAlat = isi.parts
      .filter((b) => b.functionCall)
      .map((b) => ({ name: b.functionCall!.name, args: b.functionCall!.args || {} }));
    catatLog({
      agen: opsi.log || agenLog(agen), jenis: "panggilan_model", masukan,
      keluaran: teks + (panggilanAlat.length ? " | [memanggil alat] " + panggilanAlat.map((c) => c.name + " " + JSON.stringify(c.args)).join("; ") : ""),
      token: (u.promptTokenCount || 0) + (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0), durasi_ms: Date.now() - t0,
      alat: panggilanAlat.map((c) => c.name).join(","), argumen: "model " + model,
    });
    return { isi, teks, panggilanAlat };
  }
  throw new Error("Gemini tidak menjawab setelah 5 percobaan: " + galat);
}
