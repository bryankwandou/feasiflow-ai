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
