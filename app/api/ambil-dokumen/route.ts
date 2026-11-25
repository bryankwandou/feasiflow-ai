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
