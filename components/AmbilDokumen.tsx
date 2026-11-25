"use client";

// Isi formulir dari URL laman pitch atau berkas PDF pitch deck (maks 10 MB).
// Hasilnya hanya draf isian; pengguna tetap memeriksa sebelum analisis dijalankan.

import { useState } from "react";
import type { Ide } from "@/lib/tiga-agen/tipe";

export default function AmbilDokumen({ isi }: { isi: (d: Partial<Ide>) => void }) {
  const [url, setUrl] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");

  async function kirim(badan: BodyInit, json: boolean) {
    setSibuk(true);
    setPesan("");
    try {
      const r = await fetch("/api/ambil-dokumen", {
        method: "POST",
        body: badan,
        headers: json ? { "content-type": "application/json" } : undefined,
      });
      const d = await r.json();
      if (!r.ok || d.status !== "ok") throw new Error(d.pesan || "Dokumen gagal diproses.");
      const n = Object.keys(d.ide || {}).length;
      isi(d.ide || {});
      const tolak = (d.ditolak?.length || 0) + (d.injeksi?.length || 0);
      setPesan(`${n} isian terisi dari dokumen${tolak ? `, ${tolak} bagian ditolak (tanpa kutipan atau berisi instruksi tersisip)` : ""}. Periksa kembali sebelum menjalankan analisis.`);
    } catch (e) {
      setPesan((e as Error).message);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line p-4 text-sm">
      <h2 className="font-medium">Ambil dari laman atau PDF pitch deck</h2>
      <p className="mt-1 text-muted">Isian diambil hanya bila ada kutipan persis di dokumen. Data LinkedIn tidak diambil karena dilarang ketentuan layanannya.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://laman-pitch-anda.com"
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 focus-ring"
        />
        <button
          type="button"
          disabled={sibuk || !url.trim()}
          onClick={() => kirim(JSON.stringify({ url: url.trim() }), true)}
          className="rounded-lg border border-fg px-3 py-2 font-medium focus-ring disabled:opacity-50"
        >
          Ambil dari URL
        </button>
        <label className="cursor-pointer rounded-lg border border-fg px-3 py-2 text-center font-medium focus-ring">
          Unggah PDF
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            disabled={sibuk}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const fd = new FormData();
              fd.append("berkas", f);
              kirim(fd, false);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {sibuk && <p className="mt-2 text-muted" role="status">Membaca dokumen…</p>}
      {pesan && !sibuk && <p className="mt-2 text-muted" role="status">{pesan}</p>}
    </section>
  );
}
