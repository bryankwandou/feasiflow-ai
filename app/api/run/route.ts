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
