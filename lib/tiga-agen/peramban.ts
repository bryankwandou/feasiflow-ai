// Cadangan pengambilan: laman yang dibangun dengan JavaScript dibuka dengan
// Playwright (Chromium tanpa kepala). Dipakai hanya bila pengambilan HTTP
// tidak menghasilkan teks yang cukup.

import { extractMainText } from "@/lib/agents-ts/search";

export let galatPeramban = "";
let peramban: Promise<import("playwright-core").Browser> | null = null;
let ctxBersama: import("playwright-core").BrowserContext | null = null;

async function mulai() {
  const { chromium } = await import("playwright-core");
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Paket Chromium hanya mengenali Node 20 dan 22 untuk mengekstrak pustaka
    // sistem Amazon Linux 2023. Server memakai Node 24 di sistem yang sama,
    // jadi penanda runtime diisi sebelum paket dimuat.
    if (!/2[02]\.x/.test(process.env.AWS_LAMBDA_JS_RUNTIME || "")) process.env.AWS_LAMBDA_JS_RUNTIME = "nodejs22.x";
    const sparticuz = (await import("@sparticuz/chromium")).default;
    return chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    });
  }
  // Di komputer pengembang dipakai Chromium bawaan Playwright atau Chrome.
  try {
    return await chromium.launch({ headless: true });
  } catch {
    return chromium.launch({ headless: true, channel: "chrome" });
  }
}

// Di komputer pengembang, bila ada profil Chrome yang sudah login (dibuat
// dengan scripts/login-google.mjs), peramban memakai profil itu sehingga
// laman dengan pemeriksaan anti-bot terbuka seperti pada peramban biasa.
// Profil ini tidak ada di server, jadi di sana jalur ini tidak dipakai.
let ctxProfil: Promise<import("playwright-core").BrowserContext> | null = null;

async function profilLogin(): Promise<string> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return "";
  const os = await import("node:os");
  const path = await import("node:path");
  const fs = await import("node:fs");
  const p = process.env.PROFIL_PERAMBAN || path.join(os.homedir(), ".feasiflow-peramban");
  return fs.existsSync(path.join(p, "Default")) ? p : "";
}

async function sekaliDenganProfil(profil: string, alamat: string, batasMs: number): Promise<string> {
  ctxProfil ??= (async () => {
    const { chromium } = await import("playwright-core");
    const c = await chromium.launchPersistentContext(profil, {
      channel: "chrome",
      headless: process.env.PERAMBAN_TAMPAK !== "1",
      ignoreDefaultArgs: ["--enable-automation"],
      args: ["--disable-blink-features=AutomationControlled"],
    });
    c.on("close", () => {
      ctxProfil = null;
    });
    return c;
  })();
  let ctx: import("playwright-core").BrowserContext;
  try {
    ctx = await ctxProfil;
  } catch (e) {
    ctxProfil = null;
    throw e;
  }
  const hal = await ctx.newPage();
  try {
    await hal.goto(alamat, { waitUntil: "domcontentloaded", timeout: batasMs });
    try {
      await hal.waitForLoadState("networkidle", { timeout: 3000 });
    } catch {
      /* lanjut dengan isi yang sudah ada */
    }
    let teks = extractMainText(await hal.content());
    for (let i = 0; i < 1 && teks.split(/\s+/).length < 80; i++) {
      await hal.waitForTimeout(3000);
      teks = extractMainText(await hal.content());
    }
    return teks.slice(0, 60000);
  } finally {
    await hal.close().catch(() => undefined);
  }
}

async function sekali(alamat: string, batasMs: number): Promise<string> {
  const profil = await profilLogin();
  if (profil) return sekaliDenganProfil(profil, alamat, batasMs);
  peramban ??= mulai();
  const b = await peramban;
  if (!b.isConnected()) throw new Error("peramban terputus");
  // Chromium server berjalan --single-process: menutup context mematikan seluruh peramban.
  // Karena itu satu context dipakai bersama dan satu tab kosong dibiarkan terbuka sebagai jangkar;
  // yang ditutup setelah membaca hanya tab lamannya.
  if (!ctxBersama || ctxBersama.browser() !== b) {
    ctxBersama = await b.newContext({
      locale: "id-ID",
      ignoreHTTPSErrors: true,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    });
    await ctxBersama.newPage();
    await ctxBersama.route("**/*", (r) =>
      ["image", "media", "font", "stylesheet"].includes(r.request().resourceType()) ? r.abort() : r.continue(),
    );
  }
  const hal = await ctxBersama.newPage();
  try {
    await hal.goto(alamat, { waitUntil: "domcontentloaded", timeout: batasMs });
    try {
      await hal.waitForLoadState("networkidle", { timeout: 3000 });
    } catch {
      /* lanjut dengan isi yang sudah ada */
    }
    let teks = extractMainText(await hal.content());
    // Laman dengan pemeriksaan keamanan baru menampilkan isinya beberapa detik kemudian.
    for (let i = 0; i < 1 && teks.split(/\s+/).length < 80; i++) {
      await hal.waitForTimeout(3000);
      teks = extractMainText(await hal.content());
    }
    return teks.slice(0, 60000);
  } finally {
    await hal.close().catch(() => undefined);
  }
}

// Laman dibuka satu per satu: Chromium di fungsi server kehabisan sumber daya (ERR_INSUFFICIENT_RESOURCES)
// bila beberapa laman dibuka bersamaan.
const MAKS_SERENTAK = 1;
let serentak = 0;
const antre: (() => void)[] = [];
async function giliran<T>(kerja: () => Promise<T>): Promise<T> {
  if (serentak >= MAKS_SERENTAK) await new Promise<void>((r) => antre.push(r));
  serentak++;
  try {
    return await kerja();
  } finally {
    serentak--;
    antre.shift()?.();
  }
}

export async function bukaDenganPeramban(alamat: string, batasMs = 15000): Promise<string> {
  return giliran(() => bukaSekarang(alamat, batasMs));
}

async function bukaSekarang(alamat: string, batasMs: number): Promise<string> {
  if (process.env.TANPA_PERAMBAN === "1") return "";
  // Peramban yang tersimpan bisa mati saat server dibekukan; percobaan kedua memakai peramban baru.
  for (let coba = 0; coba < 2; coba++) {
    try {
      return await sekali(alamat, batasMs);
    } catch (e) {
      galatPeramban = String(e).slice(0, 1500);
      console.error("peramban gagal:", galatPeramban.slice(0, 300));
      // Peramban hanya diganti bila memang sudah mati; galat satu laman tidak menutup laman lain.
      const lama = peramban;
      const hidup = lama ? await lama.then((b) => b.isConnected()).catch(() => false) : false;
      if (!hidup || /INSUFFICIENT_RESOURCES/i.test(galatPeramban)) {
        // Peramban mati atau kehabisan sumber daya: diganti peramban baru lalu dicoba sekali lagi.
        peramban = null;
        if (lama) lama.then((b) => b.close()).catch(() => undefined);
      } else if (!/Target|closed/i.test(galatPeramban)) {
        // Galat laman (misalnya batas waktu) tidak perlu diulang.
        return "";
      }
    }
  }
  return "";
}
