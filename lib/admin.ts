// Sesi admin: kuki bertanda tangan HMAC. Nama pengguna dan sandi dibaca dari
// ADMIN_USER dan ADMIN_PASS, tidak pernah ditulis di kode.

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const KUKI = "ff_admin";
const UMUR = 7 * 24 * 3600;

const rahasia = () => `${process.env.ADMIN_PASS || ""}|${process.env.CEK_TOKEN || ""}|feasiflow`;
const tanda = (isi: string) => createHmac("sha256", rahasia()).update(isi).digest("hex");

function sama(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function cocok(nama: string, sandi: string): boolean {
  const u = process.env.ADMIN_USER || "";
  const p = process.env.ADMIN_PASS || "";
  if (!u || !p) return false;
  return sama(nama, u) && sama(sandi, p);
}

export function buatKuki(): { nama: string; nilai: string; umur: number } {
  const habis = String(Math.floor(Date.now() / 1000) + UMUR);
  return { nama: KUKI, nilai: `${habis}.${tanda(habis)}`, umur: UMUR };
}

export function sudahMasuk(): boolean {
  if (!process.env.ADMIN_PASS) return false;
  const v = cookies().get(KUKI)?.value || "";
  const [habis, t] = v.split(".");
  if (!habis || !t) return false;
  return sama(t, tanda(habis)) && Number(habis) > Date.now() / 1000;
}
