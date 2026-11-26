"use client";

// Penerjemah teks halaman (global). Pemilih bahasa dan tombol tema ada di header tiap halaman.
// Halaman ditulis dalam bahasa Indonesia. Terjemahan diambil dari dua sumber:
//   1. kamus berkunci (lib/i18n/kamus/<kode>.ts), dicocokkan lewat nilai bahasa Indonesianya;
//   2. peta teks tampil (lib/i18n/tampil/<kode>.json): seluruh teks yang tampil di halaman produksi,
//      dikumpulkan otomatis lalu diterjemahkan, berkunci teks Indonesia yang sudah dirapikan spasinya.
// Pencocokan dilakukan per elemen (judul yang dipecah menjadi beberapa span tetap cocok) lalu per teks.
// Teks asli selalu disimpan sehingga kembali ke bahasa Indonesia tidak memerlukan muat ulang.

import { useEffect } from "react";
import { KAMUS_SUMBER, muatKamus, type KodeBahasa, type Kunci } from "@/lib/i18n";
import { useBahasa } from "@/lib/i18n/PenyediaBahasa";

const asli = new WeakMap<Text, string>();
// Teks terakhir yang ditulis penerjemah ke simpul. Bila isi simpul berbeda dari teks asli dan dari teks ini,
// berarti React yang mengubahnya (misalnya "Analisis berjalan" menjadi "Laporan kelayakan"), jadi teks asli diperbarui.
// Tanpa ini, setiap perubahan React dikembalikan ke teks lama dan status halaman membeku.
const tertulis = new WeakMap<Text, string>();
const tulis = (t: Text, s: string) => { if (t.data !== s) t.data = s; tertulis.set(t, s); };
const asliAttr = new WeakMap<Element, Record<string, string>>();
const ATTR = ["placeholder", "title", "aria-label"];
const ELEMEN = "h1,h2,h3,h4,p,li,td,th,dt,dd,label,button,a,summary,option,span,div,legend,figcaption,small,strong,em";
const BLOK = "p,div,li,h1,h2,h3,h4,ul,ol,table,section,form,details,pre";
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const LEWATI = "script,style,textarea,pre,[data-tanpa-terjemah]";

async function muatTampil(kode: KodeBahasa): Promise<Record<string, string>> {
  try {
    return (await import(`@/lib/i18n/tampil/${kode}.json`)).default as Record<string, string>;
  } catch {
    return {};
  }
}

function terapkan(peta: Map<string, string> | null) {
  // Kembalikan semua teks ke aslinya dulu, agar pergantian bahasa selalu berangkat dari bahasa Indonesia.
  const jalan = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const simpul: Text[] = [];
  let n: Node | null;
  while ((n = jalan.nextNode())) {
    const t = n as Text;
    if (!t.parentElement || t.parentElement.closest(LEWATI)) continue;
    const lama = asli.get(t);
    if (lama === undefined || (t.data !== lama && t.data !== tertulis.get(t))) asli.set(t, t.data);
    tulis(t, asli.get(t)!);
    simpul.push(t);
  }
  if (peta) {
    const sudah = new Set<Text>();
    // 1) per elemen: teks gabungan elemen tanpa anak blok
    document.body.querySelectorAll(ELEMEN).forEach((el) => {
      if (el.closest(LEWATI) || el.querySelector(BLOK)) return;
      const ts: Text[] = [];
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let m: Node | null;
      while ((m = w.nextNode())) ts.push(m as Text);
      if (ts.length < 2 || ts.some((t) => sudah.has(t))) return;
      const baru = peta.get(norm(ts.map((t) => asli.get(t) ?? t.data).join("")));
      if (!baru) return;
      const pertama = ts.find((t) => norm(t.data)) || ts[0];
      ts.forEach((t) => { tulis(t, t === pertama ? baru : (/\s$/.test(t.data) ? " " : "")); sudah.add(t); });
    });
    // 2) per teks
    for (const t of simpul) {
      if (sudah.has(t)) continue;
      const a = asli.get(t)!;
      const k = norm(a);
      const baru = k ? peta.get(k) : undefined;
      if (baru) tulis(t, a.replace(a.trim(), baru));
    }
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
      const baru = peta?.get(norm(v)) ?? v;
      if (el.getAttribute(k) !== baru) el.setAttribute(k, baru);
    }
  });
  const judul = document.querySelector("title");
  if (judul) {
    const ds = judul.dataset as DOMStringMap & { asli?: string };
    ds.asli ??= judul.textContent || "";
    judul.textContent = peta?.get(norm(ds.asli)) ?? ds.asli;
  }
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
        const [k, tampil] = await Promise.all([muatKamus(kode), muatTampil(kode)]);
        peta = new Map(Object.entries(tampil));
        for (const kunci of Object.keys(KAMUS_SUMBER) as Kunci[]) {
          const dari = norm(KAMUS_SUMBER[kunci] || "");
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

  // Tombol bahasa dan tema kini berada di header tiap halaman (components/KendaliHeader.tsx).
  return null;
}
