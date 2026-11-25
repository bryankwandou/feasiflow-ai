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
