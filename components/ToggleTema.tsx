"use client";

// Tombol alih mode gelap. Label tetap "Mode gelap"; keadaan disampaikan lewat aria-pressed
// (WAI-ARIA APG, pola Button: label toggle tidak boleh berubah saat keadaannya berubah).
// Ikon dipilih oleh CSS dari atribut data-theme di <html>, jadi tidak ada kedip sebelum hidrasi.

import { useEffect, useState } from "react";
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

  const alih = () => {
    const baru: Tema = gelap ? "light" : "dark";
    terapkanTema(baru);
    simpanTema(baru);
    setTema(baru);
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
      <Sun aria-hidden="true" className="ikon-terang h-4 w-4" />
      <Moon aria-hidden="true" className="ikon-gelap h-4 w-4" />
    </button>
  );
}
