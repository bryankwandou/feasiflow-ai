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
