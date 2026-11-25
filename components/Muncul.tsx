"use client";

// Gerak masuk saat bagian halaman terlihat: memudar naik sekali, dengan jeda berurutan.
// Hitung menaikkan angka dari nol saat terlihat.

import { useEffect, useRef, useState, type ReactNode } from "react";

function useTerlihat<T extends Element>(ambang = 0.15) {
  const ref = useRef<T>(null);
  const [tampak, setTampak] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setTampak(true);
      return;
    }
    const io = new IntersectionObserver(
      (masuk) => {
        if (masuk.some((m) => m.isIntersecting)) {
          setTampak(true);
          io.disconnect();
        }
      },
      { threshold: ambang, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ambang]);
  return { ref, tampak };
}

export function Muncul({ children, tunda = 0, className = "" }: { children: ReactNode; tunda?: number; className?: string }) {
  const { ref, tampak } = useTerlihat<HTMLDivElement>();
  return (
    <div ref={ref} className={`muncul ${tampak ? "tampak" : ""} ${className}`} style={{ transitionDelay: `${tunda}ms` }}>
      {children}
    </div>
  );
}

export function Hitung({ nilai, desimal = 1, className = "" }: { nilai: number; desimal?: number; className?: string }) {
  const { ref, tampak } = useTerlihat<HTMLSpanElement>(0.4);
  // Nilai akhir sudah tertulis sejak render server (terbaca saat disalin, oleh pembaca layar, dan tanpa JavaScript);
  // animasi hitung naik hanya berjalan sekali ketika angka masuk layar.
  const [n, setN] = useState(nilai);
  const sudah = useRef(false);
  useEffect(() => {
    if (!tampak || sudah.current) return;
    sudah.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(nilai);
      return;
    }
    let bingkai = 0;
    const mulai = performance.now();
    const langkah = (t: number) => {
      const p = Math.min(1, (t - mulai) / 1400);
      setN(nilai * (1 - Math.pow(1 - p, 3)));
      if (p < 1) bingkai = requestAnimationFrame(langkah);
    };
    bingkai = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(bingkai);
  }, [tampak, nilai]);
  return (
    <span ref={ref} className={className}>
      {n.toLocaleString("id-ID", { minimumFractionDigits: desimal, maximumFractionDigits: desimal })}
    </span>
  );
}
