"use client";

// Tombol alih mode gelap. Label tetap "Mode gelap"; keadaan disampaikan lewat aria-pressed
// (WAI-ARIA APG, pola Button: label toggle tidak boleh berubah saat keadaannya berubah).
// Ikon dipilih oleh CSS dari atribut data-theme di <html>, jadi tidak ada kedip sebelum hidrasi.

import { useEffect, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import {
  KUNCI_TEMA,
  bacaTemaTersimpan,
  pilihTema,
  simpanTema,
  temaSah,
  terapkanTema,
  type Tema,
} from "@/lib/tema/skrip-awal";

function sistemGelap(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export default function ToggleTema({ className = "" }: { className?: string }) {
  // null sampai terpasang di klien, agar render server dan render pertama klien sama.
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    const awal = document.documentElement.getAttribute("data-theme");
    const t = temaSah(awal) ? awal : pilihTema(bacaTemaTersimpan(), sistemGelap());
    terapkanTema(t);
    setTema(t);

    // Tanpa pilihan tersimpan, ikuti perubahan tema sistem secara langsung.
    let mq: MediaQueryList | null = null;
    const ubahSistem = (e: MediaQueryListEvent) => {
      if (bacaTemaTersimpan()) return;
      const baru: Tema = e.matches ? "dark" : "light";
      terapkanTema(baru);
      setTema(baru);
    };
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", ubahSistem);
    } catch {
      mq = null;
    }

    // Selaraskan antar tab.
    const ubahTab = (e: StorageEvent) => {
      if (e.key !== KUNCI_TEMA) return;
      const baru = pilihTema(e.newValue, sistemGelap());
      terapkanTema(baru);
      setTema(baru);
    };
    window.addEventListener("storage", ubahTab);

    return () => {
      mq?.removeEventListener("change", ubahSistem);
      window.removeEventListener("storage", ubahTab);
    };
  }, []);

  const gelap = tema === "dark";

  // Animasi pergantian: tema baru menyebar sebagai lingkaran dari tombol ke seluruh layar
  // (View Transitions API). Peramban tanpa API itu mendapat transisi warna halus 0,5 detik.
  // prefers-reduced-motion: langsung berganti tanpa animasi.
  const alih = (e: MouseEvent<HTMLButtonElement>) => {
    const baru: Tema = (document.documentElement.getAttribute("data-theme") ?? tema) === "dark" ? "light" : "dark";
    const ganti = () => {
      terapkanTema(baru);
      simpanTema(baru);
      flushSync(() => setTema(baru));
    };
    let kurangi = false;
    try {
      kurangi = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* abaikan */
    }
    const d = document.documentElement;
    if (kurangi) {
      ganti();
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const jari = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    d.classList.add("tema-beralih");
    const selesai = () => window.setTimeout(() => d.classList.remove("tema-beralih", "tema-pudar"), 760);
    if (!doc.startViewTransition) {
      d.classList.add("tema-pudar");
      ganti();
      selesai();
      return;
    }
    const vt = doc.startViewTransition(ganti);
    vt.ready
      .then(() => {
        d.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${jari}px at ${x}px ${y}px)`] },
          { duration: 720, easing: "cubic-bezier(0.7, 0, 0.25, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => undefined)
      .finally(selesai);
  };

  return (
    <button
      type="button"
      onClick={alih}
      aria-label="Mode gelap"
      aria-pressed={tema === null ? undefined : gelap}
      title="Mode gelap"
      className={`toggle-tema focus-ring ${className}`}
    >
      <Sun aria-hidden="true" className="ikon-terang h-[18px] w-[18px]" />
      <Moon aria-hidden="true" className="ikon-gelap h-[18px] w-[18px]" />
    </button>
  );
}
