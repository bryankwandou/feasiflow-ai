// Pembantu pengambilan laman: tingkat sumber dan ekstraksi teks utama.

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  /** Teks halaman penuh hasil pengambilan; kosong bila pengambilan gagal. */
  content?: string;
  /** Jumlah kata teks yang berhasil diekstraksi — dipakai untuk provenans. */
  words?: number;
  /** Tingkat sumber: 1 resmi, 2 media/asosiasi, 3 sinyal publik. */
  tier?: 1 | 2 | 3;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0 Safari/537.36";

const HEADERS: Record<string, string> = {
  "User-Agent": UA,
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

/** Domain resmi → Tier 1. Statistik dan regulasi hanya sah dari sini. */
const TIER1 = [
  "ojk.go.id",
  "bps.go.id",
  "bi.go.id",
  "kemenkeu.go.id",
  "peraturan.go.id",
  "jdih.go.id",
];
/** Media ekonomi dan asosiasi industri → Tier 2. */
const TIER2 = [
  "kontan.co.id",
  "bisnis.com",
  "katadata.co.id",
  "cnbcindonesia.com",
  "kompas.com",
  "tempo.co",
  "fintech.id",
  "techinasia.com",
  "dailysocial.id",
  "afpi.or.id",
  "antaranews.com",
  "rri.co.id",
  "detik.com",
  "cnnindonesia.com",
  "republika.co.id",
  "infobanknews.com",
];

/** Nama host alamat (huruf kecil); kosong bila alamat tidak sah. */
export function hostDari(url: string): string {
  try { return new URL(url).hostname.toLowerCase().replace(/\.$/, ""); } catch { return ""; }
}
/** Cocok bila host sama persis dengan domain atau subdomainnya, bukan sekadar memuat teksnya. */
export const cocokDomain = (url: string, d: string) => {
  const h = hostDari(url);
  return !!h && (h === d || h.endsWith("." + d));
};

export function tierOf(url: string): 1 | 2 | 3 {
  if (TIER1.some((d) => cocokDomain(url, d))) return 1;
  if (TIER2.some((d) => cocokDomain(url, d))) return 2;
  return 3;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}


/**
 * Ekstraksi teks utama tanpa pustaka eksternal, agar berjalan pada runtime
 * serverless. Membuang script, style, nav, header, footer, dan aside, lalu
 * memilih blok teks terpanjang.
 */
function extractMain(html: string): string {
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Prioritaskan <article> atau <main> bila ada.
  const prefer =
    h.match(/<article[\s\S]*?<\/article>/i) || h.match(/<main[\s\S]*?<\/main>/i);
  if (prefer && stripTags(prefer[0]).length > 400) h = prefer[0];

  // Kumpulkan blok paragraf dan sel tabel — tabel penting bagi data statistik.
  const blocks: string[] = [];
  const re = /<(p|li|td|th|h[1-4])[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(h)) !== null) {
    const t = stripTags(m[2]);
    if (t.length > 25) blocks.push(t);
  }
  const joined = blocks.join("\n");
  return joined.length > 200 ? joined : stripTags(h);
}

/** Ekstraksi teks utama dari HTML yang sudah dirender (dipakai jalur Playwright). */
export function extractMainText(html: string): string {
  return extractMain(html);
}

/** Mengambil satu halaman secara utuh lalu mengekstraksi teks utamanya. */
export async function fetchPage(
  url: string,
  maxChars = 6000,
  timeoutMs = 12000,
): Promise<{ content: string; words: number }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: ac.signal, redirect: "follow" });
    if (!res.ok) return { content: "", words: 0 };
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html") && !ct.includes("text")) return { content: "", words: 0 };
    const html = await res.text();
    const text = extractMain(html).slice(0, maxChars);
    return { content: text, words: text ? text.split(/\s+/).length : 0 };
  } catch {
    return { content: "", words: 0 };
  } finally {
    clearTimeout(timer);
  }
}
