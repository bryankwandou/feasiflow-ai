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
