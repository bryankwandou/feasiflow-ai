"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Loader2, Clock, AlertCircle } from "lucide-react";
import type { HasilAnalisis } from "@/lib/tiga-agen/tipe";

type Status = "waiting" | "running" | "done" | "error";
interface Langkah { agen: string; teks: string; jenis: "alat" | "periksa-lolos" | "periksa-tolak" }

const AGEN = [
  { kunci: "a1", nama: "A1 Riset", ket: "Mencari dan membaca sumber" },
  { kunci: "a2", nama: "A2 Analisis", ket: "Menyusun BMC dan risiko" },
  { kunci: "a3", nama: "A3 Penilaian", ket: "Memberi skor 10 indikator" },
];

const NAMA_ALAT: Record<string, string> = {
  cari_web: "Mencari di web",
  baca_laman: "Membaca laman",
  cek_direktori_ojk: "Memeriksa Direktori OJK",
  cek_statistik_ojk: "Membaca Statistik LPBBTI OJK",
  lihat_bukti: "Melihat bukti tersimpan",
  minta_riset: "Meminta riset tambahan",
};

function ringkasArgumen(alat: string, argumen: string): string {
  try {
    const a = JSON.parse(argumen) as Record<string, unknown>;
    const v = Object.values(a)[0];
    const d = Array.isArray(v) ? v.map(String) : [String(v ?? "")];
    if (alat === "baca_laman") return `${d.length} laman`;
    return d.join("; ").slice(0, 90);
  } catch {
    return argumen.slice(0, 90);
  }
}

interface Props {
  sessionId: string;
  onComplete: (data: HasilAnalisis) => void;
}

export function LiveMonitor({ sessionId, onComplete }: Props) {
  const [status, setStatus] = useState<Record<string, { status: Status; detik?: number }>>(
    Object.fromEntries(AGEN.map((a) => [a.kunci, { status: "waiting" as Status }])),
  );
  const [progres, setProgres] = useState(0);
  const [selesai, setSelesai] = useState(false);
  const [galat, setGalat] = useState("");
  const [antre, setAntre] = useState(false);
  const [menunggu, setMenunggu] = useState(false);
  const [langkah, setLangkah] = useState<Langkah[]>([]);
  const ujung = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ujung.current?.scrollIntoView({ block: "nearest" });
  }, [langkah.length]);

  useEffect(() => {
    let params: unknown = null;
    try {
      const raw = sessionStorage.getItem(`params_${sessionId}`);
      if (raw) params = JSON.parse(raw);
    } catch { /* abaikan */ }
    const pengendali = new AbortController();
    const putaran = () => {
      try { return Number(sessionStorage.getItem(`putaran_${sessionId}`)) || 1; } catch { return 1; }
    };

    const tampil = (h: HasilAnalisis) => {
      try { sessionStorage.setItem(`hasil_${sessionId}`, JSON.stringify(h)); } catch { /* abaikan */ }
      setStatus(Object.fromEntries(AGEN.map((a) => [a.kunci, { status: "done" as Status }])));
      setProgres(100);
      setSelesai(true);
      onComplete(h);
    };
    // Hasil tersimpan dibaca lebih dulu supaya muat ulang tidak menjalankan analisis lagi.
    const tersimpan = async (): Promise<"selesai" | "berjalan" | "gagal" | "tidak_ada"> => {
      try {
        const r = await fetch(`/api/result/${sessionId}`, { cache: "no-store", signal: pengendali.signal });
        const d = (await r.json()) as { status: string; hasil?: HasilAnalisis; galat?: string };
        if (d.status === "selesai" && d.hasil) { tampil(d.hasil); return "selesai"; }
        if (d.status === "berjalan") return "berjalan";
        if (d.status === "gagal") { setGalat(d.galat || "Analisis ini gagal."); return "gagal"; }
      } catch { /* jatuh ke salinan lokal */ }
      try {
        const raw = sessionStorage.getItem(`hasil_${sessionId}`);
        if (raw) { tampil(JSON.parse(raw) as HasilAnalisis); return "selesai"; }
      } catch { /* abaikan */ }
      return "tidak_ada";
    };
    const tunggu = async () => {
      setMenunggu(true);
      for (let i = 0; i < 90 && !pengendali.signal.aborted; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const s = await tersimpan();
        if (s === "selesai" || s === "gagal") break;
        if (s === "tidak_ada") { setGalat("Analisis tidak ditemukan. Mulai analisis baru dari formulir."); break; }
      }
      setMenunggu(false);
    };

    (async () => {
      try {
        const awal = await tersimpan();
        if (awal === "selesai" || awal === "gagal") return;
        if (awal === "berjalan") { await tunggu(); return; }
        if (!params) {
          setGalat("Analisis tidak ditemukan. Mulai analisis baru dari formulir.");
          return;
        }
        let res: Response;
        for (;;) {
          res = await fetch("/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ params, sessionId, putaran: putaran() }),
            signal: pengendali.signal,
          });
          if (res.status === 409) { await tunggu(); return; }
          if (res.status !== 503) break;
          setAntre(true);
          await new Promise((r) => setTimeout(r, 5000 + Math.random() * 2000));
          if (pengendali.signal.aborted) return;
        }
        setAntre(false);
        // Tanya balik agen pemeriksa isian: kembali ke formulir dengan pertanyaan di dekat isian terkait.
        if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
          const d = (await res.json().catch(() => ({}))) as { status?: string };
          if (d.status === "perlu_klarifikasi") {
            try { sessionStorage.setItem(`klarifikasi_${sessionId}`, JSON.stringify(d)); } catch { /* abaikan */ }
            window.location.replace(`/analyze?ulang=${encodeURIComponent(sessionId)}`);
            return;
          }
          setGalat("Server menjawab tanpa aliran analisis.");
          return;
        }
        if (!res.ok || !res.body) {
          const t = await res.text().catch(() => "");
          let pesan = t;
          try { pesan = (JSON.parse(t) as { error?: string }).error || t; } catch { /* teks biasa */ }
          setGalat(pesan || "Server tidak menjawab.");
          return;
        }
        const pembaca = res.body.getReader();
        const dekoder = new TextDecoder();
        let penampung = "";
        let tuntas = false;
        for (;;) {
          const { done, value } = await pembaca.read();
          if (done) break;
          penampung += dekoder.decode(value, { stream: true });
          const potong = penampung.split("\n\n");
          penampung = potong.pop() ?? "";
          for (const p of potong) {
            const baris = p.trim();
            if (!baris.startsWith("data: ")) continue;
            let ev: Record<string, unknown>;
            try { ev = JSON.parse(baris.slice(6)); } catch { continue; }
            if (typeof ev.progress === "number") setProgres(ev.progress);
            const agen = String(ev.agent ?? "");
            if (ev.event === "agent_start") {
              setStatus((s) => ({ ...s, [agen]: { status: "running" } }));
            } else if (ev.event === "agent_done") {
              setStatus((s) => ({ ...s, [agen]: { status: "done", detik: Number(ev.elapsed_seconds) } }));
            } else if (ev.event === "langkah") {
              const alat = String(ev.alat);
              setLangkah((l) => [...l, {
                agen: String(ev.agen),
                jenis: "alat",
                teks: `${NAMA_ALAT[alat] || alat}: ${ringkasArgumen(alat, String(ev.argumen ?? ""))}`,
              }]);
            } else if (ev.event === "periksa") {
              const catatan = Array.isArray(ev.catatan) ? (ev.catatan as string[]) : [];
              setLangkah((l) => [...l, {
                agen: String(ev.fase),
                jenis: ev.lolos ? "periksa-lolos" : "periksa-tolak",
                teks: ev.lolos
                  ? `Pemeriksaan ke-${ev.percobaan} lolos`
                  : `Pemeriksaan ke-${ev.percobaan} menolak: ${catatan.join("; ").slice(0, 140)}`,
              }]);
            } else if (ev.event === "agent_error") {
              setStatus((s) => ({ ...s, [agen]: { status: "error" } }));
              setGalat(String(ev.message || "Terjadi galat pada agen."));
            } else if (ev.event === "complete") {
              tuntas = true;
              setSelesai(true);
              if (ev.data) tampil(ev.data as HasilAnalisis);
            }
          }
        }
        if (!tuntas) setGalat((g) => g || "Sambungan terputus sebelum analisis selesai. Coba mulai lagi.");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setGalat("Sambungan terputus. Coba mulai lagi.");
      }
    })();

    return () => pengendali.abort();
  }, [sessionId, onComplete]);

  return (
    <div className="gelap rounded-2xl p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-white/60">{selesai ? "Analisis selesai" : "Analisis berjalan"}</p>
        <p className="text-sm font-mono tnum text-white/60">{progres}%</p>
      </div>
      <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progres} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-white rounded-full transition-[width] duration-700 ease-out" style={{ width: `${progres}%` }} />
      </div>

      {menunggu && !selesai && (
        <p className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm">
          Analisis ini masih berjalan di server. Hasil tampil otomatis saat selesai, tanpa menjalankan ulang.
        </p>
      )}

      {antre && !selesai && (
        <p className="mt-4 p-3 bg-amber-400/10 border border-amber-300/30 rounded-xl text-amber-200 text-sm">
          Sistem sedang penuh. Analisis dimulai otomatis saat ada giliran.
        </p>
      )}

      <ol className="mt-5 space-y-2">
        {AGEN.map((a, i) => {
          const s = status[a.kunci];
          return (
            <li
              key={a.kunci}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors duration-300 ${
                s.status === "running" ? "bg-white/10 border-white/30"
                : s.status === "error" ? "bg-rose-500/10 border-rose-400/40"
                : "bg-white/[0.03] border-white/10"
              }`}
            >
              <span
                className={`h-7 w-7 shrink-0 rounded-full grid place-items-center text-xs font-mono transition-colors duration-300 ${
                  s.status === "done" ? "bg-white text-fg"
                  : s.status === "running" ? "bg-white/15 text-white"
                  : s.status === "error" ? "bg-rose-400 text-fg"
                  : "bg-white/5 text-white/40"
                }`}
              >
                {s.status === "done" ? <CheckCircle size={15} aria-hidden="true" />
                  : s.status === "running" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  : s.status === "error" ? <AlertCircle size={15} aria-hidden="true" />
                  : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${s.status === "waiting" ? "text-white/45" : "text-white"}`}>{a.nama}</p>
                <p className="text-xs text-white/45">{a.ket}</p>
              </div>
              {s.detik != null && (
                <span className="text-xs text-white/45 flex items-center gap-1 tnum"><Clock size={11} />{s.detik.toFixed(0)} dtk</span>
              )}
            </li>
          );
        })}
      </ol>

      {langkah.length > 0 && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-xs text-white/45 mb-2">Langkah agen</p>
          <ol className="space-y-1.5 max-h-72 overflow-y-auto pr-1 text-xs">
            {langkah.map((l, i) => (
              <li key={i} className="flex gap-2 leading-snug animate-fade-up">
                <span className="font-mono text-white/35 shrink-0 w-7">{l.agen}</span>
                <span className={l.jenis === "periksa-lolos" ? "text-white" : l.jenis === "periksa-tolak" ? "text-amber-300" : "text-white/60"}>
                  {l.teks}
                </span>
              </li>
            ))}
            <div ref={ujung} />
          </ol>
        </div>
      )}

      {galat && !selesai && (
        <div className="mt-5 p-4 bg-rose-500/10 border border-rose-400/40 rounded-xl" role="alert">
          <p className="text-rose-200 font-medium text-sm">Analisis berhenti</p>
          <p className="text-white/60 text-xs mt-1 break-words">{galat}</p>
          <a href="/analyze" className="mt-2 inline-block text-xs text-white underline">Mulai analisis baru</a>
        </div>
      )}
    </div>
  );
}
