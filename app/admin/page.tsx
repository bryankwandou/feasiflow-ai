import type { Metadata } from "next";
import { sudahMasuk } from "@/lib/admin";
import { daftar, daftarAdmin } from "@/lib/tiga-agen/simpan";
import KendaliHeader from "@/components/KendaliHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin — FeasiFlow AI", robots: { index: false } };

const isian =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] text-fg outline-none transition-colors focus:border-fg";
const tombol =
  "rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-black focus-ring";

type Pakai = Record<string, { panggilan: number; masuk: number; keluar: number; pikir: number }>;

function warnaKelas(k: string | null) {
  return k === "Layak" ? "text-emerald-700" : k === "Layak Bersyarat" ? "text-amber-700" : "text-rose-700";
}

function Masuk({ salah }: { salah: boolean }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form method="post" action="/api/admin" className="glass-card w-full max-w-sm rounded-2xl p-7">
        <a href="/" className="text-sm text-muted hover:text-fg transition-colors">FeasiFlow AI</a>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Masuk admin</h1>
        <label className="mt-6 block text-sm text-muted" htmlFor="nama">Nama pengguna</label>
        <input id="nama" name="nama" autoComplete="username" required className={`mt-1.5 ${isian}`} />
        <label className="mt-4 block text-sm text-muted" htmlFor="sandi">Kata sandi</label>
        <input id="sandi" name="sandi" type="password" autoComplete="current-password" required className={`mt-1.5 ${isian}`} />
        {salah && <p role="alert" className="mt-3 text-sm text-rose-700">Nama pengguna atau kata sandi salah.</p>}
        <button type="submit" className={`mt-6 w-full ${tombol}`}>Masuk</button>
      </form>
    </main>
  );
}

export default async function Admin({ searchParams }: { searchParams: { salah?: string; status?: string; tab?: string } }) {
  if (!sudahMasuk()) return <Masuk salah={searchParams.salah === "1"} />;
  const tab = searchParams.tab === "log" ? "log" : "riwayat";
  const filter = ["selesai", "berjalan", "gagal", "ditolak"].includes(searchParams.status || "") ? searchParams.status! : "";
  const logAdmin = tab === "log" ? await daftarAdmin() : [];
  const tautan = (aktif: boolean) => `rounded-full border px-4 py-1.5 text-sm focus-ring ${aktif ? "border-fg bg-fg text-white" : "border-line bg-white text-fg hover:border-fg"}`;

  const semua = (await daftar()) as unknown as {
    id: string; dibuat: string; status: string; ide: { produk: string; segmen: string; wilayah: string };
    s: string | null; s_dinamis: number | null; kelas: string | null; detik: number | null; galat: string | null; pakai: Pakai | null; umur_detik: number;
  }[];
  const baris = filter ? semua.filter((b) => b.status === filter) : semua;
  const selesai = semua.filter((b) => b.status === "selesai");
  const rata = selesai.length ? selesai.reduce((n, b) => n + Number(b.s), 0) / selesai.length : 0;
  const token = (p: Pakai | null) => Object.values(p || {}).reduce((n, x) => n + x.masuk + x.keluar + x.pikir, 0);
  const ringkas: [string, string][] = [
    ["Analisis tersimpan", String(semua.length)],
    ["Selesai", String(selesai.length)],
    ["Rata-rata skor S", selesai.length ? rata.toFixed(1) : "–"],
    ["Layak", String(selesai.filter((b) => b.kelas === "Layak").length)],
  ];

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <a href="/" className="text-sm text-muted hover:text-fg transition-colors">Beranda</a>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Riwayat analisis</h1>
          </div>
          <div className="flex items-center gap-3">
            <KendaliHeader />
            <form method="post" action="/api/admin">
              <input type="hidden" name="aksi" value="keluar" />
              <button type="submit" className="rounded-full border border-line bg-white px-4 py-2 text-sm text-fg transition-colors hover:border-fg focus-ring">Keluar</button>
            </form>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ringkas.map(([k, v]) => (
            <div key={k} className="glass-card rounded-2xl p-4">
              <dt className="text-xs text-faint">{k}</dt>
              <dd className="mt-1 text-2xl font-semibold tnum">{v}</dd>
            </div>
          ))}
        </dl>

        <nav className="mt-5 flex flex-wrap items-center gap-2" aria-label="Tab admin">
          <a href="/admin" className={tautan(tab === "riwayat" && !filter)}>Semua</a>
          {["selesai", "berjalan", "gagal", "ditolak"].map((st) => (
            <a key={st} href={`/admin?status=${st}`} className={tautan(tab === "riwayat" && filter === st)}>{st[0].toUpperCase() + st.slice(1)}</a>
          ))}
          <a href="/admin?tab=log" className={tautan(tab === "log")}>Log aktivitas admin</a>
          <span className="ml-auto flex flex-wrap gap-2 text-sm">
            <a className="underline underline-offset-2" href="/api/admin/ekspor?format=json">Ekspor riwayat JSON</a>
            <a className="underline underline-offset-2" href="/api/admin/ekspor?format=csv">CSV</a>
            <a className="underline underline-offset-2" href="/api/admin/ekspor?format=json&isi=log">Ekspor semua log JSON</a>
            <a className="underline underline-offset-2" href="/api/admin/ekspor?format=csv&isi=log">CSV</a>
          </span>
        </nav>

        {tab === "log" ? (
          <section className="glass-card mt-5 rounded-2xl p-5 sm:p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-faint"><th className="pb-2 pr-4 font-medium">Waktu (WITA)</th><th className="pb-2 pr-4 font-medium">Aksi</th><th className="pb-2 pr-4 font-medium">IP</th><th className="pb-2 font-medium">Rincian</th></tr></thead>
              <tbody>
                {logAdmin.map((x) => (
                  <tr key={x.id} className="border-t border-black/[0.06]">
                    <td className="py-2 pr-4 whitespace-nowrap text-muted tnum">{new Date(x.waktu).toLocaleString("id-ID", { timeZone: "Asia/Makassar", dateStyle: "medium", timeStyle: "medium" })}</td>
                    <td className="py-2 pr-4">{x.aksi}</td>
                    <td className="py-2 pr-4 text-muted tnum">{x.ip}</td>
                    <td className="py-2 text-muted break-words">{x.rincian}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logAdmin.length === 0 && <p className="text-sm text-muted">Belum ada aktivitas admin tercatat.</p>}
          </section>
        ) : (
        <section className="glass-card mt-5 rounded-2xl p-5 sm:p-6">
          {baris.length === 0 ? (
            <p className="text-sm text-muted">Belum ada analisis tersimpan. Riwayat mulai dicatat sejak fitur ini dipasang.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-faint">
                    <th className="pb-2 pr-4 font-medium">Waktu (WITA)</th>
                    <th className="pb-2 pr-4 font-medium">Ide</th>
                    <th className="pb-2 pr-4 font-medium text-right">S</th>
                    <th className="pb-2 pr-4 font-medium text-right">S 1–100</th>
                    <th className="pb-2 pr-4 font-medium">Kelas</th>
                    <th className="pb-2 pr-4 font-medium text-right">Detik</th>
                    <th className="pb-2 pr-4 font-medium text-right">Token</th>
                    <th className="pb-2 font-medium">Hasil</th>
                  </tr>
                </thead>
                <tbody>
                  {baris.map((b) => {
                    const macet = b.status === "berjalan" && b.umur_detik > 360;
                    return (
                      <tr key={b.id} className="border-t border-black/[0.06] align-top">
                        <td className="py-2.5 pr-4 whitespace-nowrap text-muted tnum">
                          {new Date(b.dibuat).toLocaleString("id-ID", { timeZone: "Asia/Makassar", dateStyle: "medium", timeStyle: "short" })}
                        </td>
                        <td className="py-2.5 pr-4 max-w-[22rem]">
                          <p className="text-fg break-words">{b.ide?.produk}</p>
                          <p className="text-xs text-faint break-words">{[b.ide?.segmen, b.ide?.wilayah].filter(Boolean).join(" · ")}</p>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium tnum">{b.s != null ? Number(b.s).toFixed(1) : "–"}</td>
                        <td className="py-2.5 pr-4 text-right text-muted tnum">{b.s_dinamis != null ? Number(b.s_dinamis).toFixed(1) : "–"}</td>
                        <td className={`py-2.5 pr-4 whitespace-nowrap ${b.kelas ? warnaKelas(b.kelas) : "text-muted"}`}>
                          {b.kelas || (b.status === "ditolak" ? "Ditolak, tanpa skor" : b.status === "gagal" || macet ? "Gagal" : "Berjalan")}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-muted tnum">{b.detik ?? "–"}</td>
                        <td className="py-2.5 pr-4 text-right text-muted tnum">{b.pakai ? token(b.pakai).toLocaleString("id-ID") : "–"}</td>
                        <td className="py-2.5">
                          <a href={`/admin/${b.id}`} className="text-fg underline underline-offset-2 hover:no-underline">Detail dan log</a>
                          {b.status !== "selesai" && <span className="block text-xs text-faint break-words">{b.galat || ""}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}
      </div>
    </main>
  );
}
