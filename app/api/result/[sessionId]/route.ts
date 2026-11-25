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
