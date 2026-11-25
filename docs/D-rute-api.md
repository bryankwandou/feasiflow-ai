# Lampiran D. Rute API (dari kode sumber)

Setiap rute di bawah disalin dari `app/api/**/route.ts` apa adanya.

## `/api/admin/ekspor`

Metode: GET. Berkas: `app/api/admin/ekspor/route.ts`.

```ts
import { NextResponse } from "next/server";
import { sudahMasuk } from "@/lib/admin";
import { keCsv } from "@/lib/tiga-agen/log";
import { ambil, ambilBanyak, ambilLog, catatAdmin, semuaLog } from "@/lib/tiga-agen/simpan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Ekspor JSON atau CSV per analisis (?id=) atau seluruh riwayat. Hanya untuk admin yang sudah masuk. */
export async function GET(request: Request) {
  if (!sudahMasuk()) return NextResponse.json({ error: "perlu masuk admin" }, { status: 401 });
  const u = new URL(request.url);
  const id = (u.searchParams.get("id") || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const format = u.searchParams.get("format") === "csv" ? "csv" : "json";
  const isi = u.searchParams.get("isi") === "log" ? "log" : "analisis";
  await catatAdmin("ekspor", request.headers.get("x-forwarded-for") || "", `${format} ${id || "semua"} ${isi}`);
  const nama = `feasiflow_${id || "semua"}_${isi}.${format}`;
  const kepala = { "Content-Disposition": `attachment; filename="${nama}"`, "Cache-Control": "no-store" };
  if (id) {
    const [a, log] = await Promise.all([ambil(id), ambilLog(id)]);
    if (format === "json") return NextResponse.json({ analisis: a, log }, { headers: kepala });
    return new Response(keCsv(log as unknown as Record<string, unknown>[]), { headers: { ...kepala, "Content-Type": "text/csv; charset=utf-8" } });
  }
  if (isi === "log") {
    const log = await semuaLog();
    if (format === "json") return NextResponse.json(log, { headers: kepala });
    return new Response(keCsv(log as unknown as Record<string, unknown>[]), { headers: { ...kepala, "Content-Type": "text/csv; charset=utf-8" } });
  }
  const semua = await ambilBanyak();
  if (format === "json") return NextResponse.json(semua, { headers: kepala });
  const baris = semua.map((b) => ({ id: b.id, dibuat: b.dibuat, status: b.status, s: b.s, kelas: b.kelas, detik: b.detik, galat: b.galat, ide: b.ide, versi_prompt: b.hasil?.versi_prompt?.versi || "" }));
  return new Response(keCsv(baris), { headers: { ...kepala, "Content-Type": "text/csv; charset=utf-8" } });
}
```

## `/api/admin`

Metode: POST. Berkas: `app/api/admin/route.ts`.

```ts
import { NextResponse } from "next/server";
import { buatKuki, cocok, KUKI } from "@/lib/admin";
import { catatAdmin } from "@/lib/tiga-agen/simpan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Masuk (POST formulir) dan keluar (POST dengan aksi=keluar).
export async function POST(request: Request) {
  const f = await request.formData();
  const ke = (jalur: string) => NextResponse.redirect(new URL(jalur, request.url), 303);
  if (f.get("aksi") === "keluar") {
    const r = ke("/admin");
    r.cookies.delete(KUKI);
    return r;
  }
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  if (!cocok(String(f.get("nama") || ""), String(f.get("sandi") || ""))) {
    await catatAdmin("login gagal", ip);
    await new Promise((s) => setTimeout(s, 800));
    return ke("/admin?salah=1");
  }
  await catatAdmin("login berhasil", ip);
  const k = buatKuki();
  const r = ke("/admin");
  r.cookies.set(k.nama, k.nilai, { httpOnly: true, secure: true, sameSite: "lax", maxAge: k.umur, path: "/" });
  return r;
}
```

## `/api/ambil-dokumen`

Metode: POST. Berkas: `app/api/ambil-dokumen/route.ts`.

```ts
import { NextResponse } from "next/server";
import { ambilDokumen, BATAS_BYTE, GalatAmbil, type KodeGalat } from "@/lib/tiga-agen/ambil-dokumen";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/ambil-dokumen
//   application/json      {"url": "https://..."}
//   multipart/form-data   berkas=<PDF pitch deck, maks 10 MB, maks 30 halaman>
// Mengembalikan draf isian formulir ide; tidak menjalankan analisis.

const STATUS: Partial<Record<KodeGalat, number>> = {
  terlalu_besar: 413, pemetaan_gagal: 502, http_gagal: 502, waktu_habis: 504, jenis_tidak_didukung: 415, bukan_pdf: 415,
};

export async function POST(request: Request) {
  try {
    const jenis = request.headers.get("content-type") || "";
    if (Number(request.headers.get("content-length") || 0) > BATAS_BYTE + 64 * 1024) {
      throw new GalatAmbil("terlalu_besar", "Berkas melebihi 10 MB.");
    }
    if (jenis.includes("multipart/form-data")) {
      const fd = await request.formData();
      const f = fd.get("berkas");
      if (!f || typeof f === "string") throw new GalatAmbil("bukan_pdf", "Kirim berkas PDF pada isian 'berkas'.");
      if (f.size > BATAS_BYTE) throw new GalatAmbil("terlalu_besar", "Berkas melebihi 10 MB.");
      const pdf = new Uint8Array(await f.arrayBuffer());
      return NextResponse.json(await ambilDokumen({ pdf }));
    }
    const badan = (await request.json().catch(() => ({}))) as { url?: unknown };
    if (typeof badan.url !== "string" || !badan.url.trim()) throw new GalatAmbil("url_tidak_sah", "Kirim {\"url\": \"https://...\"} atau berkas PDF.");
    return NextResponse.json(await ambilDokumen({ url: badan.url }));
  } catch (e) {
    if (e instanceof GalatAmbil) {
      return NextResponse.json({ status: "ditolak", kode: e.kode, pesan: e.message }, { status: STATUS[e.kode] ?? 400 });
    }
    // Galat tak terduga tidak dibocorkan ke klien (OWASP A10: jangan kirim respons mentah).
    console.error("ambil-dokumen", e);
    return NextResponse.json({ status: "galat", pesan: "Dokumen gagal diproses." }, { status: 500 });
  }
}
```

## `/api/analyze`

Metode: POST. Berkas: `app/api/analyze/route.ts`.

```ts
import { NextResponse } from "next/server";

export async function POST() {
  const sessionId = `sf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return NextResponse.json({ sessionId });
}
```

## `/api/cek`

Metode: GET. Berkas: `app/api/cek/route.ts`.

```ts
import { NextResponse } from "next/server";
import { Konteks } from "@/lib/tiga-agen/alat";
import { bukaDenganPeramban, galatPeramban } from "@/lib/tiga-agen/peramban";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Pemeriksaan lapisan data: ?q=<kueri> menguji pencarian, ?u=<alamat> menguji
// pengambilan laman utuh (jumlah kata dan jalur yang dipakai).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Rute diagnosis: di server produksi hanya terbuka dengan kunci CEK_TOKEN.
  if (process.env.VERCEL && (!process.env.CEK_TOKEN || searchParams.get("t") !== process.env.CEK_TOKEN)) {
    return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  }
  const q = searchParams.get("q");
  const p = searchParams.get("p");
  const u = searchParams.get("u");
  const k = new Konteks({ produk: "", segmen: "", wilayah: "", saluran: "", pendapatan: "", deskripsi: "" });
  const keluar: Record<string, unknown> = {};
  if (q) keluar.pencarian = await k.cari_web({ daftar_kueri: [q.slice(0, 200)] });
  if (u) {
    const h = (await k.bacaSatu(u.slice(0, 500))) as Record<string, unknown>;
    const utuh = k.gudang.get(String(h.alamat))?.teks || "";
    keluar.laman = { ...h, jumlah_karakter_tersimpan: utuh.length, awal_teks: utuh.slice(0, 400), akhir_teks: utuh.slice(-300) };
  }
  if (p) {
    // Memaksa jalur Playwright (Chromium tanpa kepala) untuk membuktikan peramban hidup di server.
    const t0 = Date.now();
    const teks = await bukaDenganPeramban(p.slice(0, 500));
    keluar.peramban = {
      alamat: p,
      lingkungan: process.env.VERCEL ? "vercel" : "lokal",
      milidetik: Date.now() - t0,
      jumlah_kata: teks.split(/\s+/).filter(Boolean).length,
      jumlah_karakter: teks.length,
      awal_teks: teks.slice(0, 400),
      galat: teks ? "" : galatPeramban,
      node: process.version,
    };
  }
  keluar.hitung = k.hitung;
  return NextResponse.json(keluar);
}
```

## `/api/pembanding`

Metode: POST. Berkas: `app/api/pembanding/route.ts`.

```ts
import { NextResponse } from "next/server";
import { jalankanPembanding } from "@/lib/tiga-agen/pembanding";
import { kunci } from "@/lib/tiga-agen/gemini";
import type { Ide } from "@/lib/tiga-agen/tipe";
import { bacaIde, jawabanKlarifikasi, periksaIsian } from "@/lib/tiga-agen/pemeriksa-isian";
import { denganLog } from "@/lib/tiga-agen/log";
import { VERSI } from "@/lib/tiga-agen/prompt";
import { tandaiDitolak } from "@/lib/tiga-agen/simpan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Skenario pembanding (subbab 3.3.5): satu LLM tanpa agen, tanpa pencarian, tanpa pemeriksaan antarfase. */
export async function POST(request: Request) {
  if (!kunci()) return NextResponse.json({ error: "GEMINI_API_KEY belum diatur" }, { status: 500 });
  let body: { params?: Partial<Ide>; putaran?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Badan permintaan bukan JSON" }, { status: 400 });
  }
  const p = body.params || {};
  let ide = bacaIde(p);
  if (!ide.produk || !ide.deskripsi) {
    return NextResponse.json({ error: "Parameter tidak lengkap: produk dan deskripsi wajib diisi" }, { status: 400 });
  }
  // Agen pemeriksa isian, sama dengan route run dan satu-agen.
  const idLog = "k1_" + Date.now();
  const gerbang = await denganLog(idLog, VERSI, () => periksaIsian(ide, body.putaran));
  if (gerbang.status === "perlu_klarifikasi") {
    const j = jawabanKlarifikasi(gerbang);
    if ("pesan" in j) await tandaiDitolak(idLog, ide, j.pesan + ": " + (j.isian_gagal || []).join(", "));
    return NextResponse.json({ ...j, id_log: idLog });
  }
  ide = gerbang.ide;
  try {
    return NextResponse.json({ ...(await denganLog(idLog, VERSI, () => jalankanPembanding(ide))), ...(gerbang.catatan ? { periksa_isian: gerbang.catatan } : {}), id_log: idLog });
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 502 });
  }
}
```

## `/api/result/[sessionId]`

Metode: GET. Berkas: `app/api/result/[sessionId]/route.ts`.

```ts
import { NextResponse } from "next/server";
import { ambil } from "@/lib/tiga-agen/simpan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Status dan hasil tersimpan sebuah analisis, supaya halaman hasil tidak
// menjalankan ulang analisis saat dimuat ulang.
export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  const b = await ambil(params.sessionId.slice(0, 80));
  if (!b) return NextResponse.json({ status: "tidak_ada" });
  if (b.status === "berjalan" && b.umur_detik > 360) return NextResponse.json({ status: "gagal", galat: "Analisis terhenti sebelum selesai." });
  return NextResponse.json({ status: b.status, hasil: b.hasil, galat: b.galat, ide: b.ide });
}
```

## `/api/run`

Metode: POST. Berkas: `app/api/run/route.ts`.

```ts
import { NextResponse } from "next/server";
import { jalankan } from "@/lib/tiga-agen/pipeline";
import { kunci } from "@/lib/tiga-agen/gemini";
import type { Ide } from "@/lib/tiga-agen/tipe";
import { mulai, tuntas, gagal, tandaiDitolak } from "@/lib/tiga-agen/simpan";
import { denganLog } from "@/lib/tiga-agen/log";
import { VERSI } from "@/lib/tiga-agen/prompt";
import { bacaIde, jawabanKlarifikasi, periksaIsian } from "@/lib/tiga-agen/pemeriksa-isian";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// Antrian: batasi jumlah analisis yang berjalan bersamaan per instans.
const MAKS = Number(process.env.MAX_CONCURRENT_RUNS ?? 4);
let aktif = 0;

export async function POST(request: Request) {
  if (!kunci()) {
    return NextResponse.json({ error: "GEMINI_API_KEY belum diatur" }, { status: 500 });
  }
  let body: { params?: Partial<Ide>; sessionId?: string; putaran?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Badan permintaan bukan JSON" }, { status: 400 });
  }
  const p = body.params || {};
  let ide = bacaIde(p);
  for (const k of ["produk", "segmen", "wilayah", "saluran", "pendapatan", "deskripsi"] as const) ide[k] = ide[k] || "";
  const sessionId = String(body.sessionId || `sf_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || `sf_${Date.now()}`;

  // Agen pemeriksa isian (anti-GIGO), sama dengan route satu-agen dan pembanding. Isian kosong, pendek, atau acak
  // ditolak di sini oleh lapis kode, tanpa memanggil Gemini, dan alasannya dicatat ke feasiflow_log.
  const gerbang = await denganLog(sessionId, VERSI, () => periksaIsian(ide, body.putaran));
  if (gerbang.status === "perlu_klarifikasi") {
    const j = jawabanKlarifikasi(gerbang);
    if ("pesan" in j) await tandaiDitolak(sessionId, ide, j.pesan + ": " + (j.isian_gagal || []).join(", "));
    return NextResponse.json({ ...j, session_id: sessionId });
  }
  if (!ide.produk || !ide.deskripsi) {
    return NextResponse.json({ error: "Parameter tidak lengkap: produk dan deskripsi wajib diisi" }, { status: 400 });
  }
  if (aktif >= MAKS) {
    return NextResponse.json(
      { queued: true, active: aktif, capacity: MAKS, message: "Sistem sibuk, Anda dalam antrian." },
      { status: 503, headers: { "Retry-After": "5" } },
    );
  }
  ide = gerbang.ide;
  // Satu id hanya dijalankan sekali: muat ulang halaman tidak memulai analisis baru.
  if (!(await mulai(sessionId, ide))) {
    return NextResponse.json({ sudah_ada: true }, { status: 409 });
  }
  aktif++;

  const enc = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({ start(c) { controller = c; } });
  let progres = 0;
  let agen = "a1";
  const kirim = (ev: Record<string, unknown>) => {
    if (typeof ev.progress === "number") progres = ev.progress;
    if (typeof ev.agent === "string") agen = ev.agent;
    try {
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ progress: progres, agent: agen, ...ev })}\n\n`));
    } catch { /* klien terputus */ }
  };

  (async () => {
    // Denyut agar sambungan tidak diputus saat agen menunggu laman.
    const denyut = setInterval(() => {
      try { controller.enqueue(enc.encode(": denyut\n\n")); } catch { /* abaikan */ }
    }, 10000);
    try {
      const hasil = await denganLog(sessionId, VERSI, () => jalankan(ide, sessionId, kirim));
      if (gerbang.catatan) hasil.periksa_isian = gerbang.catatan;
      await tuntas(sessionId, hasil);
      kirim({ event: "complete", agent: "a3", progress: 100, data: hasil });
    } catch (err) {
      await gagal(sessionId, String(err));
      kirim({ event: "agent_error", message: String(err).slice(0, 400) });
    } finally {
      clearInterval(denyut);
      aktif = Math.max(0, aktif - 1);
      try { controller.close(); } catch { /* sudah tertutup */ }
    }
  })();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
```

## `/api/satu-agen`

Metode: POST. Berkas: `app/api/satu-agen/route.ts`.

```ts
import { NextResponse } from "next/server";
import { jalankanSatuAgen } from "@/lib/tiga-agen/satu-agen";
import { kunci } from "@/lib/tiga-agen/gemini";
import type { Ide } from "@/lib/tiga-agen/tipe";
import { bacaIde, jawabanKlarifikasi, periksaIsian } from "@/lib/tiga-agen/pemeriksa-isian";
import { denganLog } from "@/lib/tiga-agen/log";
import { VERSI } from "@/lib/tiga-agen/prompt";
import { tandaiDitolak } from "@/lib/tiga-agen/simpan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/** Pembanding K2: satu agen dengan alat yang sama, tanpa pembagian agen dan tanpa pemeriksaan antarfase. */
export async function POST(request: Request) {
  if (!kunci()) return NextResponse.json({ error: "GEMINI_API_KEY belum diatur" }, { status: 500 });
  let body: { params?: Partial<Ide>; putaran?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Badan permintaan bukan JSON" }, { status: 400 }); }
  const p = body.params || {};
  let ide = bacaIde(p);
  for (const k of ["produk", "segmen", "wilayah", "saluran", "pendapatan", "deskripsi"] as const) ide[k] = ide[k] || "";
  if (!ide.produk || !ide.deskripsi) return NextResponse.json({ error: "produk dan deskripsi wajib diisi" }, { status: 400 });
  // Agen pemeriksa isian, sama dengan route run dan pembanding.
  const idLog = "k2_" + Date.now();
  const gerbang = await denganLog(idLog, VERSI, () => periksaIsian(ide, body.putaran));
  if (gerbang.status === "perlu_klarifikasi") {
    const j = jawabanKlarifikasi(gerbang);
    if ("pesan" in j) await tandaiDitolak(idLog, ide, j.pesan + ": " + (j.isian_gagal || []).join(", "));
    return NextResponse.json({ ...j, id_log: idLog });
  }
  ide = gerbang.ide;
  try { return NextResponse.json({ ...(await denganLog(idLog, VERSI, () => jalankanSatuAgen(ide))), ...(gerbang.catatan ? { periksa_isian: gerbang.catatan } : {}), id_log: idLog }); }
  catch (e) { return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 502 }); }
}
```

## `/api/versi`

Metode: GET. Berkas: `app/api/versi/route.ts`.

```ts
import { NextResponse } from "next/server";
import { VERSI_PROMPT } from "@/lib/tiga-agen/prompt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Bukti versi: SHA commit GitHub yang dibangun. Deploy lewat CLI tidak membawa meta git, jadi SHA
// dimasukkan saat deploy sebagai env FEASIFLOW_COMMIT_SHA (build dan runtime). Deploy lewat integrasi
// Git Vercel memakai VERCEL_GIT_COMMIT_SHA.
export async function GET() {
  const sha = process.env.FEASIFLOW_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "";
  return NextResponse.json(
    {
      aplikasi: "FeasiFlow AI",
      commit: sha,
      repo: process.env.FEASIFLOW_REPO || "https://github.com/bryankwandou/feasiflow-ai",
      cabang: process.env.FEASIFLOW_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "",
      dibangun: process.env.FEASIFLOW_BUILD_TIME || "",
      deployment: process.env.VERCEL_DEPLOYMENT_ID || "",
      url_deployment: process.env.VERCEL_URL || "",
      lingkungan: process.env.VERCEL_ENV || "lokal",
      versi_prompt: { versi: VERSI_PROMPT.versi, sha256: VERSI_PROMPT.sha256 },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
```

