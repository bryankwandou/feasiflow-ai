// Tema terang/gelap: kunci penyimpanan, aturan pemilihan, dan skrip inline untuk <head>.
// Skrip dijalankan sebelum halaman dilukis sehingga tidak ada kedip warna saat muat.

export type Tema = "light" | "dark";

/** Kunci localStorage untuk pilihan tema pengguna. */
export const KUNCI_TEMA = "feasiflow-tema";

/** Nilai tersimpan yang sah; selain ini dianggap tidak ada pilihan. */
export function temaSah(nilai: unknown): nilai is Tema {
  return nilai === "light" || nilai === "dark";
}

/**
 * Aturan pemilihan (fungsi murni, mudah diuji):
 * pilihan tersimpan menang; tanpa pilihan, ikuti prefers-color-scheme sistem.
 */
export function pilihTema(tersimpan: unknown, sistemGelap: boolean): Tema {
  if (temaSah(tersimpan)) return tersimpan;
  return sistemGelap ? "dark" : "light";
}

/**
 * String skrip inline untuk <head>. Logikanya sama dengan pilihTema.
 * Semua akses storage dan matchMedia dibungkus try/catch (mode privat, storage diblokir).
 * Pasang dengan: <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA_AWAL }} />
 */
export const SKRIP_TEMA_AWAL = `(function(){var d=document.documentElement,t=null,g=false;try{t=localStorage.getItem(${JSON.stringify(
  KUNCI_TEMA,
)})}catch(e){}try{g=window.matchMedia("(prefers-color-scheme: dark)").matches}catch(e){}if(t!=="light"&&t!=="dark")t=g?"dark":"light";d.setAttribute("data-theme",t);d.style.colorScheme=t})();`;

/** Menerapkan tema ke <html>. Dipakai komponen ToggleTema. */
export function terapkanTema(tema: Tema): void {
  const d = document.documentElement;
  d.setAttribute("data-theme", tema);
  d.style.colorScheme = tema;
}

/** Membaca pilihan tersimpan; null bila tidak ada atau storage tidak bisa diakses. */
export function bacaTemaTersimpan(): Tema | null {
  try {
    const t = window.localStorage.getItem(KUNCI_TEMA);
    return temaSah(t) ? t : null;
  } catch {
    return null;
  }
}

/** Menyimpan pilihan; gagal diam-diam bila storage diblokir (tema tetap berlaku untuk sesi ini). */
export function simpanTema(tema: Tema): void {
  try {
    window.localStorage.setItem(KUNCI_TEMA, tema);
  } catch {
    /* storage tidak tersedia */
  }
}
