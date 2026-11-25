"use client";

import { useId } from "react";
import { BAHASA, adalahKode } from "@/lib/i18n";
import { useBahasa } from "@/lib/i18n/PenyediaBahasa";

/**
 * Pemilih bahasa berbasis <select> bawaan: dapat dipakai dengan papan ketik dan pembaca layar,
 * nama tiap bahasa ditulis dalam bahasanya sendiri dan diberi atribut lang.
 * `gelap` untuk dipasang di atas latar gelap (header halaman analisis/hasil).
 */
export function PilihBahasa({ className = "", gelap = false, labelTerlihat = false }: { className?: string; gelap?: boolean; labelTerlihat?: boolean }) {
  const { kode, ganti, t } = useBahasa();
  const idPilih = useId();
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <label htmlFor={idPilih} className={labelTerlihat ? `text-sm ${gelap ? "text-white/60" : "text-muted"}` : "sr-only"}>
        {t("u.bahasa")}
      </label>
      <select
        id={idPilih}
        value={kode}
        onChange={(e) => {
          if (adalahKode(e.target.value)) ganti(e.target.value);
        }}
        className={`rounded-lg border px-2.5 py-1.5 text-sm focus-ring cursor-pointer ${
          gelap ? "border-white/20 bg-transparent text-white hover:border-white/40 [&>option]:text-fg" : ""
        }`}
        style={gelap ? undefined : { background: "var(--tema-surface)", color: "var(--tema-fg)", borderColor: "var(--tema-kontrol)" }}
      >
        {BAHASA.map((b) => (
          <option key={b.kode} value={b.kode} lang={b.kode}>
            {b.nama}
          </option>
        ))}
      </select>
    </div>
  );
}
