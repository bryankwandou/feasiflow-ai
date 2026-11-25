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
