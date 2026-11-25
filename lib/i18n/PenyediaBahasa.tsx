"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BAWAAN,
  KAMUS_SUMBER,
  arahBahasa,
  buatT,
  deteksiBahasa,
  lokalBahasa,
  muatKamus,
  simpanBahasa,
  type FungsiT,
  type Kamus,
  type KodeBahasa,
  type Kunci,
  type Variabel,
} from "./index";

type NilaiBahasa = {
  kode: KodeBahasa;
  arah: "ltr" | "rtl";
  /** Lokal Intl, mis. "en-US", untuk toLocaleString. */
  lokal: string;
  t: FungsiT;
  ganti: (kode: KodeBahasa) => void;
};

const nilaiBawaan: NilaiBahasa = {
  kode: BAWAAN,
  arah: "ltr",
  lokal: "id-ID",
  t: buatT(KAMUS_SUMBER),
  ganti: () => {},
};

const KonteksBahasa = createContext<NilaiBahasa>(nilaiBawaan);

/**
 * Render pertama selalu memakai id (sama dengan HTML dari server, jadi tidak ada hydration mismatch).
 * Setelah terpasang, bahasa dideteksi dari localStorage/navigator dan kamusnya dimuat.
 */
export function PenyediaBahasa({ children }: { children: ReactNode }) {
  const [kode, setKode] = useState<KodeBahasa>(BAWAAN);
  const [kamus, setKamus] = useState<Kamus>(KAMUS_SUMBER);

  useEffect(() => {
    setKode(deteksiBahasa());
  }, []);

  useEffect(() => {
    let batal = false;
    muatKamus(kode).then((k) => {
      if (!batal) setKamus(k);
    });
    const html = document.documentElement;
    html.lang = kode;
    html.dir = arahBahasa(kode);
    return () => {
      batal = true;
    };
  }, [kode]);

  const ganti = useCallback((k: KodeBahasa) => {
    simpanBahasa(k);
    setKode(k);
  }, []);

  const nilai = useMemo<NilaiBahasa>(
    () => ({ kode, arah: arahBahasa(kode), lokal: lokalBahasa(kode), t: buatT(kamus), ganti }),
    [kode, kamus, ganti],
  );

  return <KonteksBahasa.Provider value={nilai}>{children}</KonteksBahasa.Provider>;
}

/** Hook utama. Tanpa PenyediaBahasa di atasnya, tetap berfungsi dengan bahasa Indonesia. */
export function useBahasa(): NilaiBahasa {
  return useContext(KonteksBahasa);
}

/** Untuk dipakai di dalam Server Component: <Teks k="b.heroSub" />. */
export function Teks({ k, v }: { k: Kunci; v?: Variabel }) {
  const { t } = useBahasa();
  return <>{t(k, v)}</>;
}
