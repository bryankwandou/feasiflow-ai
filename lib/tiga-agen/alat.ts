// Alat yang dapat dipilih agen. Pengambilan laman selalu utuh dan disimpan
// sebagai bukti; yang dikembalikan kepada agen adalah kutipan yang relevan.

import { cariTersimpan, simpanCari } from "./simpan";
import { cocokDomain, extractMainText, hostDari, tierOf } from "@/lib/agents-ts/search";
import direktori from "./direktori-lpbbti.json";
import statistik from "./statistik-lpbbti.json";
import { ambilLewatGoogle, cariGoogle, type Deklarasi, type Pakai } from "./gemini";
import type { Bukti, Ide, Jejak } from "./tipe";
import { bukaDenganPeramban } from "./peramban";
import { bungkusKontenWeb } from "./injeksi";

const BATAS_CARI = 4;
const BATAS_BACA = 12;
const MAKS_PERAMBAN = Number(process.env.MAKS_PERAMBAN ?? 6);
const MAKS_URL_CONTEXT = 3;
const KATA_TETAP = [
  "pinjaman", "pendanaan", "penyaluran", "outstanding", "lpbbti", "p2p", "lending", "ojk", "pojk", "izin",
  "berizin", "twp90", "gagal bayar", "umkm", "pelaku usaha", "triliun", "miliar", "persen", "tumbuh",
  "pertumbuhan", "borrower", "lender", "penerima dana", "pemberi dana", "data pribadi", "modal",
];

const cacheCari = new Map<string, { mesin: string; tautan: { judul: string; alamat: string; tingkat: number }[] }>();

const KEPALA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
  Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
};

/**
 * Tingkat sumber 4 jenjang (Tabel 5 naskah): 1 resmi, 2 ilmiah dan lembaga internasional (jurnal ber-DOI lewat OpenAlex,
 * World Bank, CCAF), 3 media arus utama (hanya keterangan), 4 lainnya (blog, forum, siaran pers, repositori tanpa jurnal).
 * Hanya tingkat 1 dan 2 yang boleh menjadi dasar angka.
 */
export type Tingkat4 = 1 | 2 | 3 | 4;

/** Benar untuk localhost, IP privat/loopback/link-local, dan host tanpa titik. */
export function alamatPribadi(alamat: string): boolean {
  const h = hostDari(alamat).replace(/^\[|\]$/g, "");
  if (!h || h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".") && !h.includes(":")) return true;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h.includes(":") && (/^(::1?|fc|fd|fe80)/i.test(h))) return true;
  return false;
}
const ILMIAH = ["doi.org", "worldbank.org", "jbs.cam.ac.uk", "imf.org", "adb.org", "oecd.org"];
const REPOSITORI = ["researchgate.net", "academia.edu", "scribd.com", "slideshare.net"];
export function tingkatSumber(alamat: string): Tingkat4 {
  // Dicocokkan dengan nama host (sama persis atau subdomain), agar evil.com/bps.go.id tidak terbaca tingkat 1.
  if (REPOSITORI.some((d) => cocokDomain(alamat, d))) return 4;
  const t = tierOf(alamat);
  if (t === 1) return 1;
  if (ILMIAH.some((d) => cocokDomain(alamat, d))) return 2;
  return t === 2 ? 3 : 4;
}

/** Penyaring OpenAlex (subbab 3.3.4 dan 5.8): judul dan abstrak, terbit sejak 2023, sumber jurnal, jenis artikel. */
export function urlOpenAlex(kueri: string, per = 8): string {
  const q = kueri.replace(/[,:|]/g, " ").replace(/\s+/g, " ").trim();
  return (
    "https://api.openalex.org/works?filter=" +
    encodeURIComponent(`title_and_abstract.search:${q},from_publication_date:2023-01-01,primary_location.source.type:journal,type:article`) +
    `&per_page=${per}&select=id,doi,display_name,publication_date,primary_location,abstract_inverted_index`
  );
}

export type KaryaOA = {
  doi?: string | null;
  display_name?: string;
  publication_date?: string;
  primary_location?: { source?: { display_name?: string; type?: string } | null } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
};

/** Hanya karya yang memiliki nama jurnal dan DOI yang diterima (unggahan repositori tanpa jurnal ditolak). */
export function saringJurnal(hasil: KaryaOA[]) {
  return hasil
    .filter((w) => !!w.doi && !!w.primary_location?.source?.display_name && (w.publication_date || "") >= "2023")
    .map((w) => {
      const pos: [number, string][] = [];
      for (const [kata, idx] of Object.entries(w.abstract_inverted_index || {})) for (const i of idx) pos.push([i, kata]);
      const abstrak = pos.sort((a, b) => a[0] - b[0]).map((x) => x[1]).join(" ");
      const doi = String(w.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
      return {
        alamat: "https://doi.org/" + doi,
        judul: String(w.display_name || ""),
        jurnal: String(w.primary_location!.source!.display_name),
        terbit: String(w.publication_date || "").slice(0, 7),
        abstrak,
      };
    });
}

/** Batas keberlakuan data pasar (subbab 3.3.3): 24 bulan sebelum analisis. */
export const BATAS_BULAN = 24;

const META_TANGGAL = "article:published_time|datePublished|og:published_time|publishdate|pubdate|date|dc\\.date|dcterms\\.created";
const POLA_TANGGAL = [
  new RegExp("<meta[^>]+(?:property|name|itemprop)=[\"'](?:" + META_TANGGAL + ")[\"'][^>]*content=[\"']([^\"']+)[\"']", "i"),
  new RegExp("<meta[^>]+content=[\"']([^\"']+)[\"'][^>]*(?:property|name|itemprop)=[\"'](?:" + META_TANGGAL + ")[\"']", "i"),
  /"datePublished"\s*:\s*"([^"]+)"/i,
  /<time[^>]+datetime=["']([^"']+)["']/i,
];

/** Tanggal terbit laman (TTTT-BB) dari metadata HTML, lalu dari alamatnya. Kosong bila tidak dikenali. */
function tanggalTerbit(html: string, alamat: string): string {
  for (const p of POLA_TANGGAL) {
    const m = p.exec(html);
    const t = m && /(20[0-3]\d)-(\d{2})/.exec(m[1]);
    if (t) return t[1] + "-" + t[2];
  }
  const u = /\/(20[0-3]\d)\/(0[1-9]|1[0-2])\//.exec(alamat);
  return u ? u[1] + "-" + u[2] : "";
}

/** Umur dalam bulan dari tanggal TTTT-BB sampai sekarang. */
export function umurBulan(terbit: string): number {
  const m = /^(\d{4})-(\d{2})/.exec(terbit);
  if (!m) return 0;
  const s = new Date();
  return (s.getUTCFullYear() - Number(m[1])) * 12 + (s.getUTCMonth() + 1 - Number(m[2]));
}

/** Tanggal terbit laman yang sudah diambil, menurut alamatnya. */
const tanggalLaman = new Map<string, string>();

/** Mengambil satu laman secara utuh. HTML diekstraksi teks utamanya; PDF diurai teksnya. */
async function ambilUtuh(alamat: string, batasMs = 14000): Promise<string> {
  const ac = new AbortController();
  const jam = setTimeout(() => ac.abort(), batasMs);
  try {
    const res = await fetch(alamat, { headers: KEPALA, signal: ac.signal, redirect: "follow" });
    if (!res.ok) return "";
    const jenis = (res.headers.get("content-type") || "").toLowerCase();
    if (jenis.includes("pdf") || /\.pdf($|\?)/i.test(alamat)) {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.length > 12_000_000) return "";
      const { extractText, getDocumentProxy } = await import("unpdf");
      const dok = await getDocumentProxy(buf);
      const { text } = await extractText(dok, { mergePages: false });
      return (Array.isArray(text) ? text.slice(0, 40).join("\n") : String(text)).slice(0, 80000);
    }
    if (!jenis.includes("html") && !jenis.includes("text")) return "";
    const html = await res.text();
    tanggalLaman.set(alamat, tanggalTerbit(html, alamat));
    return extractMainText(html).slice(0, 80000);
  } catch {
    return "";
  } finally {
    clearTimeout(jam);
  }
}

function daftar(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

export class Konteks {
  gudang = new Map<string, { teks: string; judul: string; jalur: Bukti["jalur"]; tingkat: Tingkat4; terbit?: string }>();
  /** Hasil cek_statistik_ojk untuk wilayah sasaran, dipakai kode untuk menetapkan D1a. */
  statistik: {
    wilayah: string;
    sumber: string;
    kalimat: string;
    naik: number;
    rekening: number;
    /** Pertumbuhan penyaluran rata-rata per tahun 2023-2025 (persen) di wilayah dan nasional. */
    tumbuh: number;
    tumbuhNasional: number;
  } | null = null;
  judul = new Map<string, string>();
  jejak: Jejak[] = [];
  hitung = { cari: 0, cari_google: 0, jurnal: 0, http: 0, playwright: 0, url_context: 0, gagal: 0, ojk: 0, statistik: 0, lihat_bukti: 0, minta_riset: 0, minta_revisi: 0 };
  kataIde: string[];
  batasCari = BATAS_CARI;
  perambanDipakai = 0;
  googleDipakai = 0;
  gagalBaca = new Set<string>();

  /** Tautan hasil pencarian yang belum dibaca dan belum pernah gagal, sumber resmi lebih dulu. */
  belumDibaca(maks = 8): string[] {
    const a: string[] = [];
    this.judul.forEach((_, alamat) => {
      if (!this.gudang.has(alamat) && !this.gagalBaca.has(alamat)) a.push(alamat);
    });
    return a.sort((x, y) => tingkatSumber(x) - tingkatSumber(y)).slice(0, maks);
  }

  constructor(public ide: Ide, public pakai: Record<string, Pakai> = {}) {
    this.kataIde = Array.from(
      new Set(
        Object.values(ide)
          .join(" ")
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((k) => k.length > 3),
      ),
    );
  }

  /** Jumlah laman web yang terbaca, tidak termasuk berkas Direktori OJK. */
  get lamanTerbaca(): number {
    let n = 0;
    this.gudang.forEach((v) => {
      if (v.jalur !== "berkas") n++;
    });
    return n;
  }

  semuaTeks(): string {
    const b: string[] = [];
    this.gudang.forEach((v) => b.push(v.teks));
    return b.join("\n");
  }

  /** Teks bukti yang boleh menjadi dasar angka: sumber tingkat 1 dan 2 saja (Tabel 5). */
  teksBerwenang(): string {
    const b: string[] = [];
    this.gudang.forEach((v) => {
      if (v.tingkat <= 2) b.push(v.teks);
    });
    return b.join("\n");
  }

  daftarBukti(): Bukti[] {
    const b: Bukti[] = [];
    this.gudang.forEach((v, alamat) =>
      b.push({
        alamat,
        judul: v.judul,
        jalur: v.jalur,
        tingkat: v.tingkat,
        skala: 4,
        kata: v.teks.split(/\s+/).length,
        ...(v.terbit ? { terbit: v.terbit, kedaluwarsa: umurBulan(v.terbit) > BATAS_BULAN } : {}),
      }),
    );
    return b;
  }

  /** Memilih paragraf yang paling relevan dari teks utuh. */
  kutipan(teks: string, tambahan: string[] = [], maks = 1700): string {
    const kunci = [...this.kataIde, ...KATA_TETAP, ...tambahan.map((t) => t.toLowerCase())];
    const par = teks.split(/\n+/).map((p) => p.trim()).filter((p) => p.length > 40);
    const nilai = par.map((p, i) => {
      const l = p.toLowerCase();
      let s = 0;
      for (const k of kunci) if (l.includes(k)) s += 1;
      if (/\d/.test(p)) s += 1.5;
      return { i, p, s };
    });
    const pilih = [...nilai].sort((a, b) => b.s - a.s);
    const ambil: typeof nilai = [];
    let panjang = 0;
    for (const x of pilih) {
      const potong = x.p.slice(0, 600);
      if (panjang + potong.length > maks) continue;
      ambil.push({ ...x, p: potong });
      panjang += potong.length;
      if (panjang > maks - 120) break;
    }
    return ambil.sort((a, b) => a.i - b.i).map((x) => x.p).join("\n");
  }

  // ── alat ────────────────────────────────────────────────────────────────

  async cari_web(args: Record<string, unknown>) {
    const kueri = daftar(args.daftar_kueri ?? args.kueri ?? Object.values(args)[0]);
    const hasil: Record<string, unknown>[] = [];
    for (const k of kueri) {
      if (this.hitung.cari >= this.batasCari) {
        hasil.push({ kueri: k, galat: "batas pencarian sudah tercapai; baca laman dari tautan yang sudah ada", tautan_belum_dibaca: this.belumDibaca() });
        continue;
      }
      this.hitung.cari++;
      const kunci = k.trim().toLowerCase();
      let c = cacheCari.get(kunci);
      if (!c) {
        const lama = await cariTersimpan(kunci);
        if (lama?.length) {
          c = { mesin: "Google Search", tautan: lama };
          cacheCari.set(kunci, c);
        }
      }
      if (!c) {
        // Mesin pencari: Google Search. Bila kosong, dicoba sekali lagi.
        const mesin = "Google Search";
        let tautan = (await cariGoogle(k, this.pakai)).map((r) => ({ ...r, tingkat: tingkatSumber(r.alamat) as number }));
        if (!tautan.length) tautan = (await cariGoogle(k, this.pakai)).map((r) => ({ ...r, tingkat: tingkatSumber(r.alamat) as number }));
        c = { mesin, tautan };
        if (tautan.length) {
          cacheCari.set(kunci, c);
          await simpanCari(kunci, tautan);
        }
      }
      if (c.tautan.length) this.hitung.cari_google++;
      c.tautan.forEach((r) => this.judul.set(r.alamat, r.judul));
      // Tautan dari cache lama memakai skala 3 jenjang; tingkatnya dihitung ulang.
      hasil.push({ kueri: k, mesin: c.mesin, tautan: c.tautan.map((r) => ({ ...r, tingkat: tingkatSumber(r.alamat) })) });
    }
    return { hasil, sisa_pencarian: Math.max(0, this.batasCari - this.hitung.cari) };
  }

  /** Pencarian jurnal lewat OpenAlex. Dihitung dalam batas kueri yang sama dengan cari_web. */
  async cari_jurnal(args: Record<string, unknown>) {
    const kueri = daftar(args.daftar_kueri ?? args.kueri ?? Object.values(args)[0]).slice(0, 2);
    const hasil: Record<string, unknown>[] = [];
    for (const q of kueri) {
      if (this.hitung.cari >= this.batasCari) {
        hasil.push({ kueri: q, galat: "batas pencarian sudah tercapai" });
        continue;
      }
      this.hitung.cari++;
      this.hitung.jurnal++;
      let karya: KaryaOA[] = [];
      try {
        const ac = new AbortController();
        const jam = setTimeout(() => ac.abort(), 12000);
        const res = await fetch(urlOpenAlex(q), { signal: ac.signal, headers: { "User-Agent": "feasiflow-ai" } });
        clearTimeout(jam);
        if (res.ok) karya = ((await res.json()) as { results?: KaryaOA[] }).results || [];
      } catch {
        karya = [];
      }
      const semua = saringJurnal(karya);
      const jurnal = semua.slice(0, 5);
      for (const j of jurnal) {
        if (!j.abstrak || this.gudang.has(j.alamat)) continue;
        this.judul.set(j.alamat, j.judul);
        this.gudang.set(j.alamat, { teks: `${j.judul}. ${j.jurnal}, ${j.terbit}. ${j.abstrak}`, judul: `${j.judul} (${j.jurnal})`, jalur: "berkas", tingkat: 2, terbit: j.terbit });
      }
      hasil.push({
        kueri: q,
        mesin: "OpenAlex",
        ditolak_tanpa_jurnal_atau_doi: karya.length - semua.length,
        jurnal: jurnal.map((j) => ({ alamat: j.alamat, judul: j.judul, jurnal: j.jurnal, terbit: j.terbit, kutipan: this.kutipan(j.abstrak, [], 700) })),
      });
    }
    return { hasil, sisa_pencarian: Math.max(0, this.batasCari - this.hitung.cari) };
  }

  async bacaSatu(alamat: string) {
    alamat = alamat.trim().replace(/[`'",;]+$/, "");
    if (this.gagalBaca.has(alamat)) return { alamat, galat: "laman ini sudah gagal dibaca; pilih alamat lain" };
    if (this.gudang.has(alamat)) {
      const g = this.gudang.get(alamat)!;
      if (g.jalur === "berkas") {
        return { alamat, catatan: "Direktori OJK sudah tersedia lewat cek_direktori_ojk dan tidak dihitung sebagai laman. Baca laman lain dari hasil cari_web." };
      }
      return { alamat, jalur: g.jalur, tingkat: g.tingkat, jumlah_kata: g.teks.split(/\s+/).length, kutipan: bungkusKontenWeb(this.kutipan(g.teks), alamat) };
    }
    if (!/^https?:\/\//.test(alamat)) return { alamat, galat: "alamat tidak sah" };
    if (alamatPribadi(alamat)) return { alamat, galat: "alamat lokal atau jaringan pribadi tidak boleh dibaca" };
    // Hanya alamat dari hasil cari_web/cari_jurnal (atau sumber resmi tetap) yang boleh dibaca, bukan alamat yang disebut di ide atau di isi laman.
    if (!this.judul.has(alamat) && tingkatSumber(alamat) !== 1) return { alamat, galat: "alamat ini tidak ada di hasil pencarian; baca alamat dari hasil cari_web atau cari_jurnal" };
    let jalur: Bukti["jalur"] = "http";
    let teks = await ambilUtuh(alamat);
    // Coba HTTP sekali lagi sebelum menyalakan peramban; peramban dibatasi per analisis agar hemat waktu komputasi.
    if (teks.split(/\s+/).length < 80) teks = await ambilUtuh(alamat);
    const kataHttp = teks.split(/\s+/).filter(Boolean).length;
    let kataPeramban = -1;
    if (kataHttp < 80 && this.perambanDipakai < MAKS_PERAMBAN) {
      this.perambanDipakai++;
      jalur = "playwright";
      teks = await bukaDenganPeramban(alamat);
      kataPeramban = teks.split(/\s+/).filter(Boolean).length;
    }
    // Laman resmi (tingkat 1) yang tetap gagal karena menolak alamat IP server diambil lewat Google.
    if (teks.split(/\s+/).length < 80 && tingkatSumber(alamat) === 1 && this.googleDipakai < MAKS_URL_CONTEXT) {
      this.googleDipakai++;
      const g = await ambilLewatGoogle(alamat, this.pakai);
      if (g.split(/\s+/).length >= 80) {
        teks = g;
        jalur = "url_context";
      }
    }
    if (teks.split(/\s+/).length < 80) {
      this.hitung.gagal++;
      this.gagalBaca.add(alamat);
      console.log("baca gagal", alamat.slice(0, 120), "| http", kataHttp, "kata | peramban", kataPeramban < 0 ? "tidak dipakai" : kataPeramban + " kata");
      return { alamat, galat: "isi laman tidak terbaca; pilih alamat lain" };
    }
    this.hitung[jalur]++;
    const tingkat = tingkatSumber(alamat);
    const terbit = tanggalLaman.get(alamat) || tanggalTerbit("", alamat);
    this.gudang.set(alamat, { teks, judul: this.judul.get(alamat) || alamat, jalur, tingkat, terbit });
    const lama = !!terbit && umurBulan(terbit) > BATAS_BULAN;
    return {
      alamat,
      jalur,
      tingkat,
      jumlah_kata: teks.split(/\s+/).length,
      ...(tingkat >= 3 ? { catatan_tingkat: "sumber tingkat " + tingkat + ": hanya keterangan, angkanya tidak boleh menjadi dasar skor" } : {}),
      ...(terbit ? { terbit } : {}),
      ...(lama
        ? { peringatan: "laman ini terbit " + terbit + ", lebih dari " + BATAS_BULAN + " bulan lalu; angkanya tidak boleh menjadi dasar data pasar" }
        : {}),
      kutipan: bungkusKontenWeb(this.kutipan(teks), alamat),
    };
  }

  async baca_laman(args: Record<string, unknown>) {
    let alamat = daftar(args.daftar_alamat ?? args.alamat ?? Object.values(args)[0]).slice(0, 6);
    const sisa = BATAS_BACA - (this.hitung.http + this.hitung.playwright + this.hitung.url_context + this.hitung.gagal);
    if (sisa <= 0) return { galat: "batas pembacaan laman tercapai" };
    alamat = alamat.slice(0, sisa);
    const laman = await Promise.all(alamat.map((a) => this.bacaSatu(a)));
    return { laman, laman_terbaca_sejauh_ini: this.lamanTerbaca, tautan_belum_dibaca: this.belumDibaca(6) };
  }

  cek_direktori_ojk(args: Record<string, unknown>) {
    const kata = daftar(args.daftar_kata ?? args.kata ?? Object.values(args)[0]).slice(0, 6);
    this.hitung.ojk++;
    const d = direktori as { sumber: string; judul: string; jumlah: number; penyelenggara: { baris: string }[] };
    if (!this.gudang.has(d.sumber)) {
      this.gudang.set(d.sumber, {
        teks: d.penyelenggara.map((p) => p.baris).join("\n"),
        judul: d.judul,
        jalur: "berkas",
        tingkat: 1,
      });
    }
    const syariah = d.penyelenggara.filter((p) => /\|\s*Syariah\s*\|/i.test(p.baris)).length;
    return {
      sumber: d.sumber,
      keterangan: d.judul,
      jumlah_penyelenggara_berizin: d.jumlah,
      jumlah_syariah: syariah,
      pencarian: kata.map((k) => {
        const cocok = d.penyelenggara.filter((p) => p.baris.toLowerCase().includes(k.toLowerCase()));
        return { kata: k, baris_cocok: cocok.length, contoh: cocok.slice(0, 6).map((p) => p.baris) };
      }),
    };
  }

  /** Statistik LPBBTI OJK per provinsi: penyaluran tahunan dan outstanding akhir tahun. */
  cek_statistik_ojk(args: Record<string, unknown>) {
    const minta = daftar(args.daftar_wilayah ?? args.wilayah ?? Object.values(args)[0]).slice(0, 3);
    this.hitung.statistik++;
    const s = statistik as unknown as {
      judul: string;
      sumber: string;
      terbit: string;
      keterangan: string;
      wilayah: Record<string, { outstanding: Record<string, number>; rekening_aktif: Record<string, number>; penyaluran: Record<string, number> }>;
    };
    const rp = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const nama = Object.keys(s.wilayah);
    const cari = (w: string) => {
      const l = w.toLowerCase().replace(/provinsi|daerah khusus ibukota|daerah istimewa/g, "").trim();
      if (/indonesia|nasional|seluruh/.test(l)) return "JUMLAH";
      return nama.find((n) => n.toLowerCase() === l) || nama.find((n) => l.includes(n.toLowerCase()) || n.toLowerCase().includes(l)) || "";
    };
    const hasil = minta.map((w) => {
      const n = cari(w);
      if (!n) return { wilayah: w, galat: "tidak ada pada Statistik LPBBTI; pakai nama provinsi, misalnya 'Sulawesi Selatan', atau 'Indonesia'" };
      const d = s.wilayah[n];
      const p = d.penyaluran;
      const naik = (p["2024"] > p["2023"] ? 1 : 0) + (p["2025"] > p["2024"] ? 1 : 0);
      const label = n === "JUMLAH" ? "Indonesia" : n;
      // Pertumbuhan rata-rata per tahun 2023-2025 (laju majemuk), dibandingkan dengan angka nasional.
      const tumbuh = (q: Record<string, number>) => +((Math.sqrt(q["2025"] / q["2023"]) - 1) * 100).toFixed(1);
      const pct = (x: number) => x.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      const tW = tumbuh(p), tN = tumbuh(s.wilayah.JUMLAH.penyaluran);
      const kalimat =
        "Statistik LPBBTI OJK untuk " + label + ": penyaluran pinjaman tahun 2023 sebesar Rp" + rp(p["2023"]) + " miliar, tahun 2024 sebesar Rp" +
        rp(p["2024"]) + " miliar, dan tahun 2025 sebesar Rp" + rp(p["2025"]) + " miliar. Outstanding pinjaman akhir Desember 2022 sebesar Rp" +
        rp(d.outstanding["2022"]) + " miliar, Desember 2023 Rp" + rp(d.outstanding["2023"]) + " miliar, Desember 2024 Rp" + rp(d.outstanding["2024"]) +
        " miliar, dan Desember 2025 Rp" + rp(d.outstanding["2025"]) + " miliar. Rekening penerima pinjaman aktif Desember 2025 sebanyak " +
        d.rekening_aktif["2025"].toLocaleString("id-ID") + " akun. Pertumbuhan penyaluran rata-rata per tahun 2023 sampai 2025 sebesar " +
        pct(tW) + " persen" + (n === "JUMLAH" ? "." : ", sedangkan angka nasional " + pct(tN) + " persen.");
      const g = this.gudang.get(s.sumber);
      if (!g || !g.teks.includes(kalimat)) {
        this.gudang.set(s.sumber, { teks: (g ? g.teks + "\n" : "") + kalimat, judul: s.judul, jalur: "berkas", tingkat: 1, terbit: s.terbit });
      }
      // Wilayah pertama yang cocok menjadi dasar D1a.
      if (!this.statistik) {
        this.statistik = { wilayah: label, sumber: s.sumber, kalimat, naik, rekening: d.rekening_aktif["2025"] || 0, tumbuh: tW, tumbuhNasional: tN };
      }
      // Provinsi pemekaran Papua baru dicatat OJK sejak pertengahan 2024, jadi dipakai deret provinsi induknya.
      const induk = /papua (tengah|pegunungan|selatan|barat daya)/i.test(w)
        ? { catatan_wilayah: w + " baru dicatat terpisah sejak pertengahan 2024; angka di atas adalah provinsi induknya, " + label }
        : {};
      return { wilayah: label, sumber: s.sumber, data: kalimat, kenaikan_penyaluran_tahunan: naik + " dari 2 pergantian tahun", ...induk };
    });
    return { keterangan: s.keterangan, catatan: "salin angka persis seperti tertulis", hasil };
  }

  lihat_bukti(args: Record<string, unknown>) {
    const kata = daftar(args.daftar_kata_kunci ?? args.kata_kunci ?? Object.values(args)[0]).slice(0, 5);
    this.hitung.lihat_bukti++;
    const hasil: { kata_kunci: string; alamat: string; kutipan: string }[] = [];
    for (const k of kata) {
      const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      let n = 0;
      this.gudang.forEach((v, alamat) => {
        if (n >= 2) return;
        const m = re.exec(v.teks);
        if (!m) return;
        n++;
        hasil.push({ kata_kunci: k, alamat, kutipan: v.teks.slice(Math.max(0, m.index - 220), m.index + 380) });
      });
    }
    return hasil.length ? { hasil: hasil.slice(0, 8) } : { hasil: "tidak ada bukti dengan kata kunci itu" };
  }
}

// ── deklarasi untuk model ───────────────────────────────────────────────────

const larik = (ket: string) => ({ type: "ARRAY", items: { type: "STRING" }, description: ket });
const d = (name: string, description: string, arg: string, skema: Record<string, unknown>): Deklarasi => ({
  name,
  description,
  parameters: { type: "OBJECT", properties: { [arg]: skema }, required: [arg] },
});

export const DEKLARASI: Record<string, Deklarasi> = {
  cari_web: d(
    "cari_web",
    "Mencari tautan di web. Mengembalikan judul, alamat, dan tingkat sumber (1 resmi, 2 ilmiah atau lembaga internasional, 3 media arus utama yang hanya menjadi keterangan, 4 lainnya yang tidak digunakan), bukan isi laman. Paling banyak 4 kueri untuk seluruh riset, termasuk cari_jurnal.",
    "daftar_kueri",
    larik("satu sampai empat kueri pencarian"),
  ),
  cari_jurnal: d(
    "cari_jurnal",
    "Mencari artikel jurnal lewat OpenAlex dengan penyaring judul dan abstrak, terbit sejak 2023, dan sumber berupa jurnal. Hanya artikel yang memiliki nama jurnal dan DOI yang dikembalikan; abstraknya langsung tersimpan sebagai bukti tingkat 2. Memakai jatah kueri yang sama dengan cari_web.",
    "daftar_kueri",
    larik("satu atau dua kueri dalam bahasa Inggris, misalnya 'peer-to-peer lending Indonesia'"),
  ),
  baca_laman: d(
    "baca_laman",
    "Mengambil isi penuh beberapa laman sekaligus dan menyimpannya sebagai bukti. Mengembalikan kutipan yang relevan dari tiap laman.",
    "daftar_alamat",
    larik("satu sampai enam alamat laman dari hasil cari_web"),
  ),
  cek_direktori_ojk: d(
    "cek_direktori_ojk",
    "Mencari kata pada Direktori resmi penyelenggara LPBBTI berizin OJK (edisi Maret 2026). Mengembalikan jumlah penyelenggara berizin dan baris yang cocok.",
    "daftar_kata",
    larik("nama penyelenggara atau kata yang dicari, misalnya 'syariah' atau 'modal'"),
  ),
  cek_statistik_ojk: d(
    "cek_statistik_ojk",
    "Membaca Statistik LPBBTI resmi OJK (edisi Desember 2023 sampai Desember 2025) untuk satu provinsi: penyaluran pinjaman per tahun dan outstanding akhir tahun. Wajib dipanggil untuk provinsi wilayah sasaran ide.",
    "daftar_wilayah",
    larik("nama provinsi wilayah sasaran, misalnya 'Sulawesi Selatan'; pakai 'Indonesia' bila sasarannya nasional"),
  ),
  lihat_bukti: d(
    "lihat_bukti",
    "Mencari kutipan pada teks utuh bukti yang sudah dikumpulkan agen riset.",
    "daftar_kata_kunci",
    larik("satu sampai lima kata kunci"),
  ),
  minta_riset: {
    name: "minta_riset",
    description: "Meminta agen riset mencari bukti tambahan bila bukti yang ada belum cukup. Hanya 1 kali.",
    parameters: {
      type: "OBJECT",
      properties: { pertanyaan: { type: "STRING", description: "hal yang perlu dicari" } },
      required: ["pertanyaan"],
    },
  },
  minta_revisi_analisis: {
    name: "minta_revisi_analisis",
    description: "Mengirim agen analisis (A2) kembali bekerja dengan catatanmu bila BMC atau daftar risiko keliru, bertentangan, atau kurang. Hasil revisi menggantikan BMC dan risiko, lalu kamu menilai ulang. Hanya 1 kali.",
    parameters: {
      type: "OBJECT",
      properties: { pertanyaan: { type: "STRING", description: "catatan atau pertanyaan untuk agen analisis: blok atau risiko mana yang harus diperbaiki dan mengapa" } },
      required: ["pertanyaan"],
    },
  },
};
