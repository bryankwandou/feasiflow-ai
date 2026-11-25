"use client";

import { useState, useCallback, Fragment, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Loader2, X } from "lucide-react";
import { LiveMonitor } from "@/components/LiveMonitor";
import { PanelBoundary } from "@/components/PanelBoundary";
import { Muncul, Hitung } from "@/components/Muncul";
import { TombolUtama, JudulKata } from "@/components/Gerak";
import { MedanTitik } from "@/components/MedanTitik";
import { RUBRIK, URAIAN_RUBRIK, BLOK_BMC, type HasilAnalisis, type Indikator } from "@/lib/tiga-agen/tipe";

const NAMA_DIMENSI = {
  D1: "Pasar dan permintaan",
  D2: "Model bisnis dan keuangan",
  D3: "Regulasi dan risiko",
} as const;
const DIMENSI = ["D1", "D2", "D3"] as const;

const NAMA_BLOK: Record<string, string> = {
  segmen_pelanggan: "Segmen pelanggan",
  proposisi_nilai: "Proposisi nilai",
  saluran: "Saluran",
  hubungan_pelanggan: "Hubungan pelanggan",
  arus_pendapatan: "Arus pendapatan",
  sumber_daya_utama: "Sumber daya utama",
  aktivitas_utama: "Aktivitas utama",
  kemitraan_utama: "Kemitraan utama",
  struktur_biaya: "Struktur biaya",
};

const NAMA_TINGKAT: Record<number, string> = { 1: "Resmi", 2: "Media", 3: "Lainnya" };
const NAMA_TINGKAT4: Record<number, string> = { 1: "Resmi", 2: "Ilmiah", 3: "Media", 4: "Lainnya" };
const NAMA_JALUR = { http: "HTTP", playwright: "Playwright", url_context: "Google URL Context", berkas: "Berkas resmi" } as const;

const teks = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v));
const desimal = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Alamat panjang diringkas menjadi nama situs, ditambah nama berkas bila alamatnya menunjuk berkas.
function ringkasAlamat(u: string) {
  try {
    const a = new URL(u);
    const situs = a.hostname.replace(/^www\./, "");
    const akhir = decodeURIComponent(a.pathname.split("/").filter(Boolean).pop() || "");
    return /\.(pdf|xlsx?|docx?)$/i.test(akhir) ? `${situs} / ${akhir}` : situs;
  } catch {
    return u;
  }
}

function Tautan({ href, className = "" }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={href}
      className={`underline decoration-black/20 underline-offset-2 hover:decoration-fg transition-colors duration-150 break-words ${className}`}
    >
      {ringkasAlamat(href)}
      <ArrowUpRight size={12} className="inline ml-0.5 -mt-0.5" aria-hidden="true" />
    </a>
  );
}

// Teks bebas dengan alamat di dalamnya: alamat diganti tautan ringkas.
function TeksBertautan({ isi }: { isi: string }) {
  const bagian = isi.split(/(https?:\/\/[^\s)\]>"']+)/g);
  return (
    <>
      {bagian.map((b, i) =>
        /^https?:\/\//.test(b) ? <Tautan key={i} href={b.replace(/[.,;]+$/, "")} className="text-fg" /> : <Fragment key={i}>{b}</Fragment>,
      )}
    </>
  );
}

const nadaSkor = (s: number) =>
  // Kontras WCAG AA: teks gelap #1c1917 di atas kuning #fde68a (13,9:1) dan merah muda #fecdd3 (13,1:1); putih di atas #111 (18,9:1).
  s >= 100 ? "bg-fg !text-white" : s >= 50 ? "bg-[#fde68a] !text-[#1c1917]" : "bg-[#fecdd3] !text-[#1c1917]";
const warnaKelas = (k: string) => (k === "Layak" ? "text-emerald-700" : k === "Layak Bersyarat" ? "text-amber-700" : "text-rose-700");

function Bagian({ nomor, judul, ket, children }: { nomor: string; judul: string; ket?: string; children: ReactNode }) {
  return (
    <section className="glass-card rounded-2xl p-5 sm:p-7">
      <Muncul>
        <div className="flex items-baseline gap-4 border-b border-line pb-4">
          <span className="font-mono text-sm text-faint tnum">{nomor}</span>
          <div className="min-w-0">
            <h2 className="text-lg font-medium tracking-tight">{judul}</h2>
            {ket && <p className="text-sm text-muted mt-0.5">{ket}</p>}
          </div>
        </div>
      </Muncul>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Hasil({ h }: { h: HasilAnalisis }) {
  const laman = h.bukti.filter((b) => b.jalur !== "berkas");
  const kataLaman = laman.reduce((n, b) => n + b.kata, 0);
  const token = Object.values(h.pakai || {}).reduce((n, p) => n + p.masuk + p.keluar + p.pikir, 0);
  const panggilan = Object.values(h.pakai || {}).reduce((n, p) => n + p.panggilan, 0);
  const temuan = h.riset.replace(/\*+/g, "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const bernomor = temuan.every((x) => /^\d+[.)]\s/.test(x));
  // Riwayat lama dibuat sebelum D2d ada: indikator yang tidak tersimpan tampil sebagai belum dinilai.
  const dinilai = RUBRIK.filter((i) => typeof h.skor?.[i]?.skor === "number");
  const dyn = h.dinamis;

  return (
    <>
      <PanelBoundary name="Skor kelayakan">
        <div className="grid xl:grid-cols-[17rem_1fr] gap-5">
          <Muncul className="tepi-cahaya tepi-gelap rounded-2xl bg-white border border-line shadow-sm p-7 flex flex-col">
            <p className="text-sm text-muted">Skor gabungan</p>
            <p className="mt-3 text-[80px] leading-none font-medium tracking-[-0.05em] tnum">
              <Hitung nilai={h.S} />
            </p>
            {dyn && (
              <p className="mt-2 text-sm text-muted tnum">
                Skor dinamis 1–100: <span className="font-medium text-fg">{desimal(dyn.S)}</span>
              </p>
            )}
            <p className={`mt-3 text-xl font-medium tracking-tight ${warnaKelas(h.kelas)}`}>{h.kelas}</p>
            {h.aturan_gugur && (
              <p className="mt-3 text-sm text-rose-800 leading-relaxed">
                Gugur: D3a bernilai 0, sehingga ide dinyatakan Tidak Layak berapa pun skornya.
              </p>
            )}
            {h.periksa_isian && (h.periksa_isian.masalah.length > 0 || h.periksa_isian.ditandaiTerbatas.length > 0 || h.periksa_isian.putaran > 1) && (
              <div className="mt-3 text-xs text-muted leading-relaxed">
                <p>
                  Pemeriksaan isian: putaran {h.periksa_isian.putaran}, {h.periksa_isian.masalah.length} catatan
                  {h.periksa_isian.ditandaiTerbatas.length > 0 && <>; ditandai bukti terbatas: {h.periksa_isian.ditandaiTerbatas.join(", ")}</>}.
                </p>
                {h.periksa_isian.masalah.slice(0, 4).map((m, i) => (
                  <p key={i} className="text-amber-700">{m.isian}: {m.alasan}</p>
                ))}
              </div>
            )}
            <p className="mt-auto pt-6 text-xs text-faint leading-relaxed">
              Rerata bobot sama {dinilai.length} indikator. Layak 70 ke atas, Layak Bersyarat 50 sampai di bawah 70. Dihitung kode, bukan model.
              {dyn && " Skor dinamis hanya memberi posisi di dalam tingkat 0/50/100; kelasnya selalu sama dengan skor diskret."}
              {dinilai.length < RUBRIK.length && " Riwayat ini dibuat sebelum rubrik 10 indikator, jadi indikator yang belum ada tidak ikut dihitung."}
            </p>
          </Muncul>

          <Muncul tunda={120} className="gelap tepi-cahaya rounded-2xl p-6 sm:p-7">
            <div className="grid sm:grid-cols-3 gap-x-6 gap-y-6">
              {DIMENSI.map((d) => (
                <div key={d}>
                  <p className="font-mono text-xs text-white/45">{d}</p>
                  <p className="text-sm text-white/70 mt-0.5">{NAMA_DIMENSI[d]}</p>
                  <p className="mt-2 text-3xl font-medium tracking-[-0.03em] tnum">{desimal(h.dimensi[d])}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="batang h-full rounded-full bg-white" style={{ ["--w" as string]: `${h.dimensi[d]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-7 text-xs text-white/45">Peta {RUBRIK.length} indikator. Pilih satu untuk melihat buktinya.</p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {RUBRIK.map((ind: Indikator) => {
                const ada = typeof h.skor?.[ind]?.skor === "number";
                const s = h.skor?.[ind]?.skor ?? 0;
                if (!ada) {
                  return (
                    <a key={ind} href={`#ind-${ind}`} title="Belum dinilai" className="rounded-lg px-3 py-2.5 flex items-baseline justify-between gap-2 bg-white/10 text-white/60 focus-ring">
                      <span className="font-mono text-xs">{ind}</span>
                      <span className="text-sm tnum">–</span>
                    </a>
                  );
                }
                return (
                  <a
                    key={ind}
                    href={`#ind-${ind}`}
                    className={`rounded-lg px-3 py-2.5 flex items-baseline justify-between gap-2 transition-[transform,background-color] duration-150 hover:-translate-y-0.5 focus-ring ${
                      s >= 100 ? "bg-white !text-[#111111]" : s >= 50 ? "bg-[#fde68a] !text-[#1c1917]" : "bg-[#fecdd3] !text-[#1c1917]"
                    }`}
                  >
                    <span className="font-mono text-xs">{ind}</span>
                    <span className="text-sm font-medium tnum">{s}</span>
                  </a>
                );
              })}
            </div>
          </Muncul>
        </div>
      </PanelBoundary>

      <PanelBoundary name="Rubrik">
        <Bagian nomor="01" judul={`Rubrik ${RUBRIK.length} indikator`} ket="100 terpenuhi dengan bukti, 50 terpenuhi sebagian atau bukti terbatas, 0 tidak terpenuhi.">
          <div className="space-y-8">
            {DIMENSI.map((d) => (
              <div key={d}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium"><span className="font-mono text-faint mr-2">{d}</span>{NAMA_DIMENSI[d]}</p>
                  <p className="text-sm text-muted tnum">{desimal(h.dimensi[d])}</p>
                </div>
                <div className="mt-3 divide-y divide-line border-y border-line">
                  {RUBRIK.filter((i) => i.startsWith(d)).map((ind: Indikator, n) => {
                    const s = h.skor?.[ind];
                    if (!s || typeof s.skor !== "number") {
                      return (
                        <div key={ind} id={`ind-${ind}`} className="scroll-mt-6 py-5 grid grid-cols-[3.25rem_1fr] gap-4">
                          <p className="h-11 rounded-lg grid place-items-center text-base font-medium bg-black/[0.05] text-faint">–</p>
                          <div className="min-w-0">
                            <p className="text-[15px] font-medium"><span className="font-mono text-[13px] text-faint mr-2">{ind}</span>{URAIAN_RUBRIK[ind]}</p>
                            <p className="text-sm text-muted mt-1.5">Belum dinilai. Analisis ini dibuat sebelum indikator ini ditambahkan ke rubrik.</p>
                          </div>
                        </div>
                      );
                    }
                    const nd = dyn?.indikator?.[ind];
                    const tautan = /^https?:\/\//.test(s.sumber) ? s.sumber : "";
                    return (
                      <Muncul key={ind} tunda={n * 70}>
                        <div id={`ind-${ind}`} className="scroll-mt-6 py-5 grid grid-cols-[3.25rem_1fr] gap-4">
                          <p className={`h-11 rounded-lg grid place-items-center text-base font-medium tnum ${nadaSkor(s.skor)}`}>{s.skor}</p>
                          <div className="min-w-0">
                            <p className="text-[15px] font-medium"><span className="font-mono text-[13px] text-faint mr-2">{ind}</span>{URAIAN_RUBRIK[ind]}</p>
                            <p className="text-sm text-muted mt-1.5 leading-relaxed break-words">{teks(s.bukti)}</p>
                            {typeof nd === "number" && (
                              <p className="text-xs text-faint mt-2 tnum">Skor dinamis 1–100: <span className="text-fg">{desimal(nd)}</span></p>
                            )}
                            {s.sumber && (
                              <p className="text-xs text-faint mt-2">
                                Sumber: {tautan ? <Tautan href={tautan} className="text-muted" /> : teks(s.sumber) === "A2" ? "keluaran A2" : teks(s.sumber)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Muncul>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Bagian>
      </PanelBoundary>

      <PanelBoundary name="BMC">
        <Bagian nomor="02" judul="Business Model Canvas" ket="Disusun A2 dari ide dan temuan A1.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BLOK_BMC.map((b, i) => (
              <Muncul key={b} tunda={(i % 3) * 80} className="kartu sorot rounded-xl border border-line bg-white p-4 h-full">
                <p className="font-mono text-[11px] text-faint tnum">{String(i + 1).padStart(2, "0")}</p>
                <p className="text-sm font-medium mt-1">{NAMA_BLOK[b]}</p>
                <p className="text-sm text-muted mt-1.5 leading-relaxed break-words">{teks(h.bmc?.[b]) || "Tidak terisi"}</p>
              </Muncul>
            ))}
          </div>
        </Bagian>
      </PanelBoundary>

      <PanelBoundary name="Risiko">
        <Bagian nomor="03" judul="Daftar risiko" ket="Penanganan hanya diisi bila rencananya disebut pada ide.">
          <div className="grid sm:grid-cols-2 gap-3">
            {(h.risiko || []).map((r, i) => {
              const belum = /belum ada/i.test(teks(r.penanganan));
              return (
                <Muncul key={i} tunda={i * 80} className={`sorot rounded-xl border p-4 ${belum ? "border-amber-300 bg-amber-50" : "border-line bg-white"}`}>
                  <p className="text-sm font-medium">{teks(r.risiko)}</p>
                  <p className={`text-xs mt-3 ${belum ? "text-amber-800" : "text-faint"}`}>{belum ? "Rencana penanganan belum ada" : "Rencana penanganan"}</p>
                  <p className="text-sm text-muted mt-0.5 leading-relaxed">{belum ? "Tambahkan rencananya pada formulir agar indikator ini bisa bernilai 100." : teks(r.penanganan)}</p>
                </Muncul>
              );
            })}
          </div>
        </Bagian>
      </PanelBoundary>

      <PanelBoundary name="Temuan riset">
        <Bagian nomor="04" judul="Temuan riset A1" ket={`${h.angka_diperiksa} angka pada temuan dicocokkan ke teks bukti; ${h.angka_tanpa_bukti.length} tidak ditemukan.`}>
          {bernomor ? (
            <ol className="space-y-3">
              {temuan.map((x, i) => (
                <li key={i} className="grid grid-cols-[2rem_1fr] gap-2 text-sm leading-relaxed">
                  <span className="font-mono text-faint tnum">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-muted break-words"><TeksBertautan isi={x.replace(/^\d+[.)]\s*/, "")} /></span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap break-words"><TeksBertautan isi={temuan.join("\n")} /></p>
          )}
          {h.angka_tanpa_bukti.length > 0 && (
            <p className="text-sm text-amber-700 mt-4">Angka tanpa bukti: {h.angka_tanpa_bukti.join(", ")}</p>
          )}
        </Bagian>
      </PanelBoundary>

      <PanelBoundary name="Sumber">
        <Bagian nomor="05" judul="Sumber yang dibaca" ket={`${laman.length} laman diambil utuh, ${kataLaman.toLocaleString("id-ID")} kata tersimpan sebagai bukti.`}>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-sm min-w-[34rem]">
              <thead>
                <tr className="text-left text-xs text-faint">
                  <th className="font-normal pb-2 pr-3">Sumber</th>
                  <th className="font-normal pb-2 pr-3">Jenis</th>
                  <th className="font-normal pb-2 pr-3">Jalur</th>
                  <th className="font-normal pb-2 pr-3">Terbit</th>
                  <th className="font-normal pb-2 text-right">Kata</th>
                </tr>
              </thead>
              <tbody>
                {h.bukti.map((b) => (
                  <tr key={b.alamat} className="border-t border-line align-top transition-colors duration-150 hover:bg-black/[0.02]">
                    <td className="py-3 pr-3 max-w-[22rem]">
                      {ringkasAlamat(b.alamat).replace(/^m\./, "") === b.judul ? (
                        <Tautan href={b.alamat} />
                      ) : (
                        <>
                          <p className="truncate">{b.judul}</p>
                          <Tautan href={b.alamat} className="text-xs text-faint" />
                        </>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-muted whitespace-nowrap">{(b.skala === 4 ? NAMA_TINGKAT4 : NAMA_TINGKAT)[b.tingkat]}</td>
                    <td className="py-3 pr-3 text-muted whitespace-nowrap">{NAMA_JALUR[b.jalur]}</td>
                    <td className={`py-3 pr-3 whitespace-nowrap tnum ${b.kedaluwarsa ? "text-amber-700" : "text-muted"}`}>
                      {b.terbit ? `${b.terbit}${b.kedaluwarsa ? ", lebih dari 24 bulan" : ""}` : "–"}
                    </td>
                    <td className="py-3 text-right text-muted tnum">{b.kata.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bagian>
      </PanelBoundary>

      {h.kritik && (
        <PanelBoundary name="Kritik penilai">
          <Bagian nomor="05a" judul="Kritik penilai" ket="Ditulis A3 dari bukti. Tidak mengubah skor dan kelas. Butir berangka tanpa bukti dibuang kode.">
            <div className="grid md:grid-cols-3 gap-6 text-sm leading-relaxed">
              {([["Kelemahan utama", h.kritik.kelemahan_utama], ["Pertanyaan tajam", h.kritik.pertanyaan_tajam], ["Syarat agar layak", h.kritik.syarat_agar_layak]] as const).map(([j, xs]) => (
                <div key={j}>
                  <h3 className="font-medium">{j}</h3>
                  {xs.length ? <ol className="mt-2 list-decimal pl-5 space-y-1.5 text-muted">{xs.map((x, i) => <li key={i}>{x}</li>)}</ol> : <p className="mt-2 text-faint">Tidak ada.</p>}
                </div>
              ))}
            </div>
            {h.kritik.dibuang && h.kritik.dibuang.length > 0 && (
              <p className="mt-4 text-xs text-amber-700">Dibuang kode karena angkanya tidak ada pada bukti: {h.kritik.dibuang.length} butir.</p>
            )}
          </Bagian>
        </PanelBoundary>
      )}

      {h.rencana_aksi && (
        <PanelBoundary name="Rencana aksi bersumber">
          <Bagian nomor="05c" judul="Rencana aksi bersumber" ket="Langkah legal, modal, risiko, dan pivot. Setiap butir wajib mengutip laman yang dibaca agen; butir tanpa sitasi sah dibuang kode.">
            {h.rencana_aksi.butir.length ? (
              <ol className="space-y-4 text-sm leading-relaxed">
                {h.rencana_aksi.butir.map((b, i) => (
                  <li key={i} className="border-l-2 border-line pl-4">
                    <p className="text-xs uppercase tracking-wide text-faint">{b.kategori}</p>
                    <p className="mt-1 font-medium">{b.aksi}</p>
                    {b.alasan && <p className="mt-1 text-muted">{b.alasan}</p>}
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {b.sitasi.map((s) => <Tautan key={s.id + s.url} href={s.url} />)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-faint">Tidak ada butir yang lolos pemeriksaan sitasi.</p>
            )}
            {h.rencana_aksi.catatan.length > 0 && <p className="mt-4 text-xs text-muted">{h.rencana_aksi.catatan.join(" ")}</p>}
            {h.rencana_aksi.dibuang.length > 0 && (
              <p className="mt-2 text-xs text-amber-700">Dibuang kode karena sitasinya tidak sah: {h.rencana_aksi.dibuang.length} butir.</p>
            )}
          </Bagian>
        </PanelBoundary>
      )}

      {h.keputusan && h.keputusan.length > 0 && (
        <PanelBoundary name="Jejak keputusan agen">
          <Bagian nomor="05b" judul="Jejak keputusan agen" ket="Rencana, keputusan tiap giliran, delegasi, dan alasan berhenti yang ditulis agen. Metrik dihitung kode.">
            {h.metrik_agentik && (
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
                {([
                  ["Keputusan model", h.metrik_agentik.n_keputusan_model],
                  ["Langkah dipaksa kode", h.metrik_agentik.n_langkah_dipaksa_kode],
                  ["Alat berbeda", h.metrik_agentik.n_alat_unik],
                  ["Berhenti oleh", h.metrik_agentik.berhenti_oleh === "agen" ? "agen" : "batas langkah"],
                  ["Delegasi atas inisiatif", h.metrik_agentik.n_minta_riset_inisiatif],
                  ["Perbaikan setelah ditolak", h.metrik_agentik.n_perbaikan_setelah_ditolak],
                  ["Pola instruksi pada data", h.metrik_agentik.n_pola_injeksi_terdeteksi],
                  ["Delegasi tercatat", h.metrik_agentik.n_delegasi ?? 0],
                ] as const).map(([l, v]) => (
                  <div key={l}><dt className="text-xs text-faint">{l}</dt><dd className="tnum font-medium">{v}</dd></div>
                ))}
              </dl>
            )}
            {h.metrik_agentik && h.metrik_agentik.lintasan_alat.length > 0 && (
              <p className="mt-4 text-xs text-muted break-words">Lintasan alat: {h.metrik_agentik.lintasan_alat.join(" → ")}</p>
            )}
            {h.delegasi && h.delegasi.length > 0 && (
              <div className="mt-5 text-sm">
                <h3 className="font-medium">Delegasi antaragen</h3>
                <ul className="mt-2 space-y-2 text-muted">
                  {h.delegasi.map((x, i) => (
                    <li key={i}><span className="text-fg">{x.dari} ke {x.ke}</span> ({x.alat}): {x.alasan}. Hasil: {x.hasil}</li>
                  ))}
                </ul>
              </div>
            )}
            <ol className="mt-5 space-y-3 text-sm">
              {h.keputusan.filter((x) => x.rencana || x.keputusan || x.selesai || x.alat_dipilih.length).map((x, i) => (
                <li key={i} className="border-t border-line pt-3">
                  <p className="text-xs text-faint">
                    {x.agen}, giliran {x.giliran}{x.dipaksa_kode ? ", dipicu kode" : ""}{x.alat_dipilih.length ? ", alat: " + x.alat_dipilih.join(", ") : ""}
                  </p>
                  {x.rencana && <p className="mt-1"><span className="font-medium">Rencana:</span> {x.rencana}</p>}
                  {x.keputusan && <p className="mt-1"><span className="font-medium">Keputusan:</span> {x.keputusan}</p>}
                  {x.selesai && <p className="mt-1"><span className="font-medium">Selesai:</span> {x.selesai}</p>}
                </li>
              ))}
            </ol>
            {h.injeksi && h.injeksi.length > 0 && (
              <p className="mt-4 text-xs text-amber-700">Pola instruksi terdeteksi pada data: {h.injeksi.map((x) => x.sumber + " (" + x.pola.join(", ") + ")").join("; ")}.</p>
            )}
            {h.versi_prompt && <p className="mt-4 text-xs text-faint">Prompt {h.versi_prompt.versi}, sha256 A3 {h.versi_prompt.sha256.A3?.slice(0, 12)}.</p>}
          </Bagian>
        </PanelBoundary>
      )}

      <PanelBoundary name="Pemeriksaan">
        <Bagian nomor="06" judul="Pemeriksaan antarfase" ket="Kode biasa memeriksa keluaran tiap agen. Yang tidak lolos dikembalikan paling banyak 2 kali.">
          <ol className="relative space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-line">
            {h.pemeriksaan.map((p, i) => (
              <li key={i} className="relative grid grid-cols-[1.5rem_2.25rem_1fr] gap-2 text-sm items-start">
                <span className={`mt-0.5 h-6 w-6 rounded-full grid place-items-center ${p.lolos ? "bg-fg text-white" : "bg-amber-100 text-amber-800 ring-1 ring-amber-300"}`}>
                  {p.lolos ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
                </span>
                <span className="font-mono text-faint mt-0.5">{p.fase}</span>
                <span className={`mt-0.5 leading-relaxed break-words ${p.lolos ? "text-fg" : "text-amber-800"}`}>
                  Percobaan {p.percobaan}: {p.lolos ? "lolos" : "ditolak, " + p.catatan.join("; ")}
                </span>
              </li>
            ))}
          </ol>
          <dl className="gelap rounded-xl grid grid-cols-2 sm:grid-cols-4 mt-6 divide-x divide-white/10">
            {[
              ["Waktu", `${h.detik} detik`],
              ["Panggilan model", String(panggilan)],
              ["Token", token.toLocaleString("id-ID")],
              ["Pencarian", String(h.hitung?.cari ?? 0)],
            ].map(([k, v]) => (
              <div key={k} className="px-4 py-4">
                <dt className="text-xs text-white/50">{k}</dt>
                <dd className="text-lg font-medium tnum mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </Bagian>
      </PanelBoundary>
    </>
  );
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [hasil, setHasil] = useState<HasilAnalisis | null>(null);
  const selesai = useCallback((d: HasilAnalisis) => setHasil(d), []);
  const ide = hasil?.ide;
  const meta = ide ? [ide.jenis, ide.tahap, ide.wilayah].filter(Boolean).join(" · ") : "";

  return (
    <div className="min-h-screen">
      <header className="gelap">
        <MedanTitik className="medan opacity-25 !top-[58%] !h-[42%]" warna="#ffffff" varian="pita" />
        <div className="max-w-6xl mx-auto px-6 pt-6 pb-10 md:pb-12 animate-fade-up">
          <div className="flex items-center justify-between gap-3">
            <a href="/" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors duration-150 focus-ring rounded">
              <ArrowLeft size={15} /> FeasiFlow AI
            </a>
            {hasil && (
              <TombolUtama href="/analyze" teks="Analisis baru" terang kecil />
            )}
          </div>
          <p className="mt-8 text-sm text-white/50">{hasil ? "Laporan kelayakan" : "Analisis berjalan"}</p>
          <JudulKata
            key={ide ? "hasil" : "jalan"}
            utama={ide ? ide.produk : "Tiga agen"}
            redup={ide ? "untuk " + (ide.segmen || "segmen sasaran") : "sedang menilai ide Anda."}
            urutan="utama-dulu"
            className="judul-gelap mt-2 max-w-3xl text-[30px] leading-[1.08] md:text-[44px] md:leading-[1.05] font-medium tracking-[-0.035em] break-words"
          />
          {meta && <p className="mt-4 text-sm text-white/60">{meta}</p>}
        </div>
      </header>

      <div className="latar-kisi">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          <div className={`lg:sticky lg:top-6 ${hasil ? "order-2 lg:order-1" : ""}`}>
            <LiveMonitor sessionId={sessionId} onComplete={selesai} />
          </div>
          <div className={`space-y-5 min-w-0 ${hasil ? "order-1 lg:order-2" : ""}`}>
            {!hasil && (
              <div className="glass-card rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 size={18} className="animate-spin" />
                  <h2 className="text-lg font-medium tracking-tight">Laporan sedang disusun</h2>
                </div>
                <p className="text-muted text-sm mb-8 max-w-lg">
                  Langkah setiap agen tampil di panel samping. Hasil muncul di sini setelah penilaian selesai, biasanya 1 sampai 2 menit.
                </p>
                <div className="space-y-3 animate-pulse">
                  <div className="grid sm:grid-cols-[14rem_1fr] gap-3">
                    <div className="h-40 rounded-xl bg-black/[0.05]" />
                    <div className="h-40 rounded-xl bg-black/[0.08]" />
                  </div>
                  <div className="h-24 rounded-xl bg-black/[0.03]" />
                  <div className="h-24 rounded-xl bg-black/[0.03]" />
                </div>
              </div>
            )}
            {hasil && <Hasil h={hasil} />}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
