"use client";

// Kendali tampilan global: pemilih bahasa + tombol tema, dan penerjemah teks halaman.
// Halaman ditulis dalam bahasa Indonesia; teks yang sama persis dengan nilai di kamus id
// diganti dengan nilai kamus bahasa terpilih. Teks asli disimpan agar bisa dikembalikan.

import { useEffect } from "react";
import { KAMUS_SUMBER, muatKamus, type Kunci } from "@/lib/i18n";
import { PilihBahasa } from "@/components/PilihBahasa";
import { useBahasa } from "@/lib/i18n/PenyediaBahasa";
import ToggleTema from "@/components/ToggleTema";

const asli = new WeakMap<Text, string>();
const asliAttr = new WeakMap<Element, Record<string, string>>();
const ATTR = ["placeholder", "title", "aria-label"];

function terapkan(peta: Map<string, string> | null) {
  const jalan = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = jalan.nextNode())) {
    const t = n as Text;
    const p = t.parentElement;
    if (!p || p.closest("script,style,textarea,[data-tanpa-terjemah]")) continue;
    if (!asli.has(t)) asli.set(t, t.data);
    const a = asli.get(t)!;
    const kunci = a.trim();
    const baru = peta && kunci ? peta.get(kunci) : undefined;
    const isi = baru ? a.replace(kunci, baru) : a;
    if (t.data !== isi) t.data = isi;
  }
  document.body.querySelectorAll("[placeholder],[title],[aria-label]").forEach((el) => {
    if (el.closest("[data-tanpa-terjemah]")) return;
    let s = asliAttr.get(el);
    if (!s) {
      s = {};
      for (const k of ATTR) { const v = el.getAttribute(k); if (v != null) s[k] = v; }
      asliAttr.set(el, s);
    }
    for (const [k, v] of Object.entries(s)) {
      const baru = peta?.get(v.trim()) ?? v;
      if (el.getAttribute(k) !== baru) el.setAttribute(k, baru);
    }
  });
}

export default function KendaliTampilan() {
  const { kode } = useBahasa();

  useEffect(() => {
    let batal = false;
    let peta: Map<string, string> | null = null;
    let obs: MutationObserver | null = null;
    let antre = 0;
    const jalankan = () => {
      obs?.disconnect();
      terapkan(peta);
      obs?.observe(document.body, { subtree: true, childList: true, characterData: true });
    };
    (async () => {
      if (kode !== "id") {
        const k = await muatKamus(kode);
        peta = new Map();
        for (const kunci of Object.keys(KAMUS_SUMBER) as Kunci[]) {
          const dari = KAMUS_SUMBER[kunci]?.trim();
          const ke = k[kunci];
          if (dari && ke && !dari.includes("{")) peta.set(dari, ke);
        }
      }
      if (batal) return;
      obs = new MutationObserver(() => {
        cancelAnimationFrame(antre);
        antre = requestAnimationFrame(jalankan);
      });
      jalankan();
    })();
    return () => {
      batal = true;
      obs?.disconnect();
      cancelAnimationFrame(antre);
    };
  }, [kode]);

  return (
    <div data-tanpa-terjemah className="fixed right-3 top-3 z-[60] flex items-center gap-2 rounded-xl border border-line bg-white/90 p-1.5 shadow-sm backdrop-blur">
      <PilihBahasa />
      <ToggleTema />
    </div>
  );
}
