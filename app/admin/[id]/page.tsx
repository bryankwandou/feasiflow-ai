import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sudahMasuk } from "@/lib/admin";
import { ambil, ambilLog, catatAdmin } from "@/lib/tiga-agen/simpan";
import KendaliHeader from "@/components/KendaliHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detail analisis — Admin", robots: { index: false } };

const JENIS: Record<string, string> = {
  panggilan_model: "Masukan dan keluaran model",
  panggilan_alat: "Keputusan alat",
  penolakan_pemeriksa: "Penolakan pemeriksa",
  penetapan_kode: "Penetapan kode",
  isian_ditolak: "Isian ditolak",
};

export default async function Detail({ params }: { params: { id: string } }) {
  if (!sudahMasuk()) redirect("/admin");
  const id = params.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  await catatAdmin("buka analisis", headers().get("x-forwarded-for") || "", id);
  const [a, log] = await Promise.all([ambil(id), ambilLog(id)]);
  const tautan = "rounded-full border border-line bg-white px-4 py-2 text-sm text-fg hover:border-fg focus-ring";
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <a href="/admin" className="text-sm text-muted hover:text-fg">Riwayat</a>
          <KendaliHeader />
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight break-words">Analisis {id}</h1>
        <p className="mt-2 text-sm text-muted">
          Status: {a?.status || "tidak ada baris analisis"}{a?.kelas ? `, ${a.kelas}, S ${Number(a.s).toFixed(1)}` : ""}{a?.galat ? `. ${a.galat}` : ""}.
          {a?.hasil?.versi_prompt ? ` Prompt ${a.hasil.versi_prompt.versi}.` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className={tautan} href={`/api/admin/ekspor?id=${id}&format=json`}>Ekspor JSON</a>
          <a className={tautan} href={`/api/admin/ekspor?id=${id}&format=csv`}>Ekspor CSV (log)</a>
          {a?.status === "selesai" && <a className={tautan} href={`/analyze/${id}`}>Buka halaman hasil</a>}
        </div>
        {a?.ide && (
          <details className="glass-card mt-5 rounded-2xl p-5">
            <summary className="cursor-pointer text-sm font-medium">Isian</summary>
            <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-muted">{JSON.stringify(a.ide, null, 2)}</pre>
          </details>
        )}
        {a?.hasil && (() => {
          const h = a.hasil as Record<string, any>;
          const blok: [string, unknown][] = [
            ["Pemeriksa isian", h.periksa_isian],
            ["Keluaran A1 (riset)", h.riset],
            ["URL yang dibaca (alamat, tingkat, jalur, terbit)", h.bukti],
            ["Jejak alat dan kueri", h.jejak],
            ["Keluaran A2 (BMC)", h.bmc],
            ["Keluaran A2 (risiko)", h.risiko],
            ["Keluaran A3 (skor)", h.skor],
            ["Kritik A3", h.kritik],
            ["Pemeriksaan kode dan alasan penolakan", { per_kategori: h.penolakan_per_kategori, rincian: h.pemeriksaan, angka_tanpa_bukti: h.angka_tanpa_bukti }],
            ["Temuan injeksi", h.injeksi],
            ["Keputusan, delegasi, dan metrik agentic", { keputusan: h.keputusan, delegasi: h.delegasi, metrik: h.metrik_agentik }],
            ["Rencana aksi bersumber", h.rencana_aksi],
            ["Model, pemakaian token, versi prompt", { model: h.model, pakai: h.pakai, hitung: h.hitung, versi_prompt: h.versi_prompt }],
          ];
          return (
            <section className="glass-card mt-5 rounded-2xl p-5 sm:p-6">
              <h2 className="text-lg font-medium">Ringkasan hasil per agen</h2>
              <div className="mt-3 space-y-2">
                {blok.filter(([, v]) => v != null).map(([j, v]) => (
                  <details key={j}>
                    <summary className="cursor-pointer text-sm">{j}</summary>
                    <pre className="mt-1 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words text-xs text-muted">{typeof v === "string" ? v : JSON.stringify(v, null, 2)}</pre>
                  </details>
                ))}
              </div>
            </section>
          );
        })()}
        <section className="glass-card mt-5 rounded-2xl p-5 sm:p-6">
          <h2 className="text-lg font-medium">Linimasa log ({log.length} baris)</h2>
          {log.length === 0 && <p className="mt-3 text-sm text-muted">Belum ada log untuk analisis ini. Log dicatat sejak prompt v2.</p>}
          <ol className="mt-4 space-y-4">
            {log.map((x) => (
              <li key={x.id} className="border-t border-line pt-3 text-sm">
                <p className="text-xs text-faint tnum">
                  {new Date(x.waktu).toLocaleString("id-ID", { timeZone: "Asia/Makassar", timeStyle: "medium", dateStyle: "short" })} · {x.agen} · {JENIS[x.jenis] || x.jenis}
                  {x.alat ? ` · ${x.alat}` : ""}{x.token ? ` · ${x.token} token` : ""}{x.durasi_ms ? ` · ${x.durasi_ms} ms` : ""}
                </p>
                {x.masukan && <details className="mt-1"><summary className="cursor-pointer text-muted">Masukan</summary><pre className="mt-1 whitespace-pre-wrap break-words text-xs">{x.masukan}</pre></details>}
                {x.argumen && x.jenis === "panggilan_alat" && <p className="mt-1 text-xs text-muted break-words">Argumen: {x.argumen}</p>}
                {x.keluaran && <details className="mt-1" open={x.jenis !== "panggilan_model" && x.jenis !== "panggilan_alat"}><summary className="cursor-pointer text-muted">Keluaran</summary><pre className="mt-1 whitespace-pre-wrap break-words text-xs">{x.keluaran}</pre></details>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
