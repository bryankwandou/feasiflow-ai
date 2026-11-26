"use client";

// Komponen gerak kecil: tombol utama, judul kata demi kata, dan penyorot kartu.

import { useEffect, Fragment, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KAMUS_SUMBER, type Kunci } from "@/lib/i18n";
import { useBahasa } from "@/lib/i18n/PenyediaBahasa";

/** Mengisi --x dan --y pada kartu .sorot yang dilewati kursor, dan menandai saat isian aktif. Dipasang sekali di layout. */
export function PenyorotKartu() {
  useEffect(() => {
    const gerak = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(".sorot") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - r.left}px`);
      el.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", gerak, { passive: true });
    // Penanda kelas saat isian aktif, agar animasi latar dijeda selama pengguna mengetik.
    const isian = (e: Event) => /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName || "");
    const masuk = (e: FocusEvent) => { if (isian(e)) document.documentElement.classList.add("mengetik"); };
    const keluar = (e: FocusEvent) => { if (isian(e)) document.documentElement.classList.remove("mengetik"); };
    document.addEventListener("focusin", masuk);
    document.addEventListener("focusout", keluar);
    return () => {
      document.removeEventListener("pointermove", gerak);
      document.removeEventListener("focusin", masuk);
      document.removeEventListener("focusout", keluar);
    };
  }, []);
  return null;
}

/** Label yang bergulir saat tombol disorot. */
export function Gulir({ teks }: { teks: string }) {
  return (
    <span className="gulir">
      <span>
        <span>{teks}</span>
        <span aria-hidden="true">{teks}</span>
      </span>
    </span>
  );
}

/** Lingkaran berisi panah yang berganti saat disorot. */
export function Panah() {
  return (
    <span className="panah" aria-hidden="true">
      <ArrowRight size={15} />
      <ArrowRight size={15} />
    </span>
  );
}

/** Tombol utama berbentuk pil: label bergulir, lingkaran panah, dan cahaya pelangi di bawahnya. */
export function TombolUtama({
  href,
  teks,
  terang = false,
  kecil = false,
  className = "",
}: {
  href: string;
  teks: string;
  terang?: boolean;
  kecil?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`tombol-utama ${terang ? "tombol-terang" : ""} ${kecil ? "py-1 pl-4 pr-1 text-sm gap-2.5" : "py-1.5 pl-6 pr-1.5 text-[15px]"} focus-ring ${className}`}
    >
      <Gulir teks={teks} />
      <Panah />
    </Link>
  );
}

/** Judul yang muncul kata demi kata dari buram. Bagian redup diberi warna abu. */
export function JudulKata({
  redup,
  utama,
  urutan = "redup-dulu",
  className = "",
}: {
  redup: string;
  utama: string;
  urutan?: "redup-dulu" | "utama-dulu";
  className?: string;
}) {
  // Judul diterjemahkan per bagian lewat kamus, supaya bagian abu-abu dan bagian utama tetap terpisah.
  // Tanpa ini, penerjemah halaman memasukkan seluruh judul ke span pertama (abu-abu).
  const { t, kode } = useBahasa();
  const cari = (s: string) => {
    const k = (Object.keys(KAMUS_SUMBER) as Kunci[]).find((x) => KAMUS_SUMBER[x] === s);
    return k ? t(k) : null;
  };
  const r = cari(redup);
  const u = cari(utama);
  const sendiri = r != null && u != null;
  if (sendiri) { redup = r; utama = u; }
  const atribut = sendiri ? { "data-tanpa-terjemah": "" } : {};
  let i = 0;
  const kata = (teks: string, abu: boolean): ReactNode[] =>
    teks.split(" ").map((k, n, semua) => (
      <Fragment key={i}>
        <span className={`kata ${abu ? "nada-abu" : ""}`} style={{ ["--i" as string]: i++ }}>{k}</span>
        {n < semua.length - 1 ? " " : ""}
      </Fragment>
    ));
  if (urutan === "utama-dulu") {
    return (
      <h1 key={sendiri ? kode : undefined} className={className} {...atribut}>
        {kata(utama, false)} {kata(redup, true)}
      </h1>
    );
  }
  return (
    <h1 key={sendiri ? kode : undefined} className={className} {...atribut}>
      {kata(redup, true)}
      <br />
      {kata(utama, false)}
    </h1>
  );
}
