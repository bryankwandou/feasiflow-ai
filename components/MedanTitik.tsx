"use client";

// Latar hero: kisi titik hitam yang besarnya mengikuti gelombang yang
// bergerak pelan. Digambar di kanvas, tanpa berkas video.

import { useEffect, useRef } from "react";

function gelombang(x: number, y: number, t: number, sempit: boolean): number {
  const a = Math.sin(x * 0.011 + t * 0.55) * 0.5 + Math.sin(x * 0.004 - t * 0.3 + 1.7) * 0.5;
  const b = Math.sin(x * 0.007 + t * 0.2 + 4.1);
  // Dua pita mendatar yang naik turun; titik membesar di dekat pusat pita.
  const pita1 = (sempit ? 0.045 : 0.42) + a * (sempit ? 0.015 : 0.13);
  const pita2 = (sempit ? 0.77 : 0.66) + b * (sempit ? 0.02 : 0.09);
  const tebal1 = (0.1 + (Math.sin(x * 0.006 + t * 0.4) + 1) * 0.05) * (sempit ? 0.3 : 1);
  const tebal2 = (0.05 + (Math.sin(x * 0.009 - t * 0.5 + 2) + 1) * 0.035) * (sempit ? 0.55 : 1);
  const d1 = Math.max(0, 1 - Math.abs(y - pita1) / tebal1);
  const d2 = Math.max(0, 1 - Math.abs(y - pita2) / tebal2);
  return Math.max(d1, d2 * 0.8);
}

// varian 'hero': dua pita dengan ruang kosong di tengah untuk judul.
// varian 'pita': satu pita di dekat bawah, tanpa ruang kosong, untuk latar bagian.
function pitaBawah(x: number, y: number, t: number): number {
  const p = 0.8 + (Math.sin(x * 0.006 + t * 0.35) * 0.6 + Math.sin(x * 0.013 - t * 0.5) * 0.4) * 0.09;
  const tebal = 0.09 + (Math.sin(x * 0.005 - t * 0.3 + 1) + 1) * 0.05;
  return Math.max(0, 1 - Math.abs(y - p) / tebal);
}

export function MedanTitik({
  className = "",
  warna,
  varian = "hero",
}: {
  className?: string;
  warna?: string;
  varian?: "hero" | "pita";
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const kanvas = ref.current;
    if (!kanvas) return;
    const ctx = kanvas.getContext("2d");
    if (!ctx) return;
    const diam = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lebar = 0;
    let tinggi = 0;
    let bingkai = 0;
    let terlihat = true;
    // Saat pengguna mengetik di isian, kanvas berhenti agar ketikan tidak tersendat.
    const isian = (e: EventTarget | null) => !!e && /^(INPUT|TEXTAREA|SELECT)$/.test((e as HTMLElement).tagName || "");
    let mengetik = isian(document.activeElement);
    let terakhir = 0;
    const jalan = () => !diam && terlihat && !mengetik;

    const ukur = () => {
      const r = kanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      lebar = r.width;
      tinggi = r.height;
      kanvas.width = Math.round(lebar * dpr);
      kanvas.height = Math.round(tinggi * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const gambar = (ms: number) => {
      // Cukup sekitar 30 bingkai per detik untuk gerak titik yang pelan.
      if (ms && ms - terakhir < 32) {
        if (jalan()) bingkai = requestAnimationFrame(gambar);
        return;
      }
      terakhir = ms;
      const t = ms / 1000;
      const sempit = lebar < 640;
      const jarak = sempit ? 7 : 9;
      ctx.clearRect(0, 0, lebar, tinggi);
      // Tanpa warna tetap, titik mengikuti tema: hitam di mode terang, terang dan sedikit redup di mode gelap.
      const gelap = document.documentElement.dataset.theme === "dark";
      ctx.fillStyle = warna || (gelap ? "#e8e8e4" : "#111111");
      ctx.globalAlpha = !warna && gelap ? 0.55 : 1;
      const tengah = lebar / 2;
      for (let y = jarak / 2; y < tinggi; y += jarak) {
        for (let x = jarak / 2; x < lebar; x += jarak) {
          let k = varian === "pita" ? pitaBawah(x, y / tinggi, t) : gelombang(x, y / tinggi, t, sempit);
          // Ruang kosong di tengah supaya judul tetap terbaca.
          const jx = Math.abs(x - tengah) / (sempit ? lebar : 470);
          const jy = Math.abs(y / tinggi - 0.47) / (sempit ? 0.34 : 0.36);
          const dekat = jx * jx + jy * jy;
          if (varian === "hero" && !sempit && dekat < 1) k *= dekat * dekat;
          if (k < 0.12) continue;
          const r = Math.min(jarak * 0.42, k * jarak * 0.46);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (jalan()) bingkai = requestAnimationFrame(gambar);
    };

    ukur();
    bingkai = requestAnimationFrame(gambar);
    const amati = new ResizeObserver(() => {
      ukur();
      if (diam) gambar(0);
    });
    amati.observe(kanvas);
    // Kanvas berhenti menggambar saat tidak terlihat supaya halaman tetap ringan.
    const pantau = new IntersectionObserver(([m]) => {
      const dulu = terlihat;
      terlihat = m.isIntersecting;
      if (terlihat && !dulu && jalan()) bingkai = requestAnimationFrame(gambar);
    });
    pantau.observe(kanvas);
    // Gambar ulang segera saat tema berganti, termasuk saat gerak dimatikan.
    const amatiTema = new MutationObserver(() => { cancelAnimationFrame(bingkai); gambar(0); });
    amatiTema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const masuk = (e: FocusEvent) => { if (isian(e.target)) mengetik = true; };
    const keluar = (e: FocusEvent) => {
      if (!isian(e.target)) return;
      mengetik = false;
      cancelAnimationFrame(bingkai);
      if (jalan()) bingkai = requestAnimationFrame(gambar);
    };
    document.addEventListener("focusin", masuk);
    document.addEventListener("focusout", keluar);
    return () => {
      document.removeEventListener("focusin", masuk);
      document.removeEventListener("focusout", keluar);
      cancelAnimationFrame(bingkai);
      amati.disconnect();
      pantau.disconnect();
      amatiTema.disconnect();
    };
  }, [warna, varian]);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
