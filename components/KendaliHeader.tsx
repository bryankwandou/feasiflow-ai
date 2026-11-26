"use client";

// Kendali bahasa + tema yang dipasang DI DALAM header tiap halaman (hero bar), bukan melayang.
// Pemilih bahasa tampil ringkas (ikon bola dunia + kode bahasa), tetapi tetap <select> bawaan
// yang transparan di atasnya, sehingga papan ketik, pembaca layar, dan daftar pilihan ponsel tetap jalan.
// `gelap` untuk header berlatar hitam (halaman analisis, hasil, banding).

import { useId } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { BAHASA, adalahKode } from "@/lib/i18n";
import { useBahasa } from "@/lib/i18n/PenyediaBahasa";
import ToggleTema from "@/components/ToggleTema";

export default function KendaliHeader({ gelap = false, className = "" }: { gelap?: boolean; className?: string }) {
  const { kode, ganti, t } = useBahasa();
  const idPilih = useId();
  return (
    <div data-tanpa-terjemah className={`kendali-header ${gelap ? "kendali-gelap" : ""} ${className}`}>
      <div className="pilih-ringkas">
        <Globe aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span aria-hidden="true" className="kode-bahasa">{kode.toUpperCase()}</span>
        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <label htmlFor={idPilih} className="sr-only">{t("u.bahasa")}</label>
        <select
          id={idPilih}
          value={kode}
          onChange={(e) => {
            if (adalahKode(e.target.value)) ganti(e.target.value);
          }}
        >
          {BAHASA.map((b) => (
            <option key={b.kode} value={b.kode} lang={b.kode}>
              {b.nama}
            </option>
          ))}
        </select>
      </div>
      <ToggleTema />
    </div>
  );
}
