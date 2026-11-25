// Penyimpanan hasil analisis dan cache pencarian di Postgres (Neon).
// Tanpa DATABASE_URL (misalnya di lokal) semua fungsi diam dan mengembalikan kosong.

import { neon } from "@neondatabase/serverless";
import type { HasilAnalisis, Ide } from "./tipe";
import { pasangPenulis, type BarisLog } from "./log";

const alamatDb = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
// cache: "no-store" wajib: Next menyimpan jawaban fetch, sehingga kueri yang sama mengembalikan data lama.
const sql = () => neon(alamatDb(), { fetchOptions: { cache: "no-store" } });

let siap: Promise<void> | null = null;
function siapkan(): Promise<void> {
  if (!siap) {
    siap = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS feasiflow_analisis (
        id text PRIMARY KEY,
        dibuat timestamptz NOT NULL DEFAULT now(),
        status text NOT NULL,
        ide jsonb NOT NULL,
        hasil jsonb,
        s numeric,
        kelas text,
        detik integer,
        galat text
      )`;
      await q`CREATE TABLE IF NOT EXISTS feasiflow_log (
        id bigserial PRIMARY KEY,
        id_analisis text NOT NULL,
        waktu timestamptz NOT NULL DEFAULT now(),
        agen text NOT NULL,
        jenis text NOT NULL,
        versi_prompt text,
        masukan text,
        keluaran text,
        alat text,
        argumen text,
        token integer,
        durasi_ms integer
      )`;
      await q`CREATE INDEX IF NOT EXISTS feasiflow_log_analisis ON feasiflow_log (id_analisis, waktu)`;
      await q`CREATE TABLE IF NOT EXISTS feasiflow_admin_log (
        id bigserial PRIMARY KEY,
        waktu timestamptz NOT NULL DEFAULT now(),
        aksi text NOT NULL,
        ip text,
        rincian text
      )`;
      await q`CREATE TABLE IF NOT EXISTS feasiflow_cari (
        kueri text PRIMARY KEY,
        dibuat timestamptz NOT NULL DEFAULT now(),
        tautan jsonb NOT NULL
      )`;
    })().catch((e) => {
      siap = null;
      throw e;
    });
  }
  return siap;
}

async function aman<T>(kosong: T, f: () => Promise<T>): Promise<T> {
  if (!alamatDb()) return kosong;
  try {
    await siapkan();
    return await f();
  } catch (e) {
    console.error("simpan:", String(e).slice(0, 300));
    return kosong;
  }
}

export interface Baris {
  id: string;
  dibuat: string;
  status: "berjalan" | "selesai" | "gagal" | "ditolak";
  ide: Ide;
  hasil: HasilAnalisis | null;
  s: number | null;
  kelas: string | null;
  detik: number | null;
  galat: string | null;
  umur_detik: number;
}

export const ambil = (id: string) =>
  aman<Baris | null>(null, async () => {
    const r = await sql()`SELECT *, extract(epoch FROM now() - dibuat)::int AS umur_detik FROM feasiflow_analisis WHERE id = ${id}`;
    return (r[0] as Baris) || null;
  });

/** Menandai analisis mulai berjalan. Mengembalikan false bila id itu sudah ada dan masih berjalan atau sudah selesai. */
export const mulai = (id: string, ide: Ide) =>
  aman<boolean>(true, async () => {
    const r = await sql()`
      INSERT INTO feasiflow_analisis (id, status, ide) VALUES (${id}, 'berjalan', ${JSON.stringify(ide)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET status = 'berjalan', dibuat = now(), galat = NULL
        WHERE feasiflow_analisis.status = 'gagal'
           OR (feasiflow_analisis.status = 'berjalan' AND feasiflow_analisis.dibuat < now() - interval '6 minutes')
      RETURNING id`;
    return r.length > 0;
  });

export const tuntas = (id: string, h: HasilAnalisis) =>
  aman<void>(undefined, async () => {
    await sql()`UPDATE feasiflow_analisis SET status = 'selesai', hasil = ${JSON.stringify(h)}::jsonb,
      s = ${h.S}, kelas = ${h.kelas}, detik = ${Math.round(h.detik)} WHERE id = ${id}`;
  });

export const gagal = (id: string, pesan: string) =>
  aman<void>(undefined, async () => {
    await sql()`UPDATE feasiflow_analisis SET status = 'gagal', galat = ${pesan.slice(0, 400)} WHERE id = ${id}`;
  });

export const daftar = (maks = 200) =>
  aman<Omit<Baris, "hasil">[]>([], async () => {
    const r = await sql()`SELECT id, dibuat, status, ide, s, kelas, detik, galat,
      hasil->'pakai' AS pakai, hasil->'hitung' AS hitung, hasil->'dinamis'->'S' AS s_dinamis,
      extract(epoch FROM now() - dibuat)::int AS umur_detik
      FROM feasiflow_analisis ORDER BY dibuat DESC LIMIT ${maks}`;
    return r as Omit<Baris, "hasil">[];
  });

type Tautan = { judul: string; alamat: string; tingkat: number }[];

/** Hasil pencarian disimpan 14 hari supaya kueri yang sama tidak dibayar dua kali. */
export const cariTersimpan = (kueri: string) =>
  aman<Tautan | null>(null, async () => {
    const r = await sql()`SELECT tautan FROM feasiflow_cari WHERE kueri = ${kueri} AND dibuat > now() - interval '14 days'`;
    return r[0] ? (r[0].tautan as Tautan) : null;
  });

export const simpanCari = (kueri: string, tautan: Tautan) =>
  aman<void>(undefined, async () => {
    await sql()`INSERT INTO feasiflow_cari (kueri, tautan) VALUES (${kueri}, ${JSON.stringify(tautan)}::jsonb)
      ON CONFLICT (kueri) DO UPDATE SET tautan = EXCLUDED.tautan, dibuat = now()`;
  });

// ── Log bukti ────────────────────────────────────────────────────────────
pasangPenulis((rows: BarisLog[]) =>
  aman<void>(undefined, async () => {
    await sql()`INSERT INTO feasiflow_log (id_analisis, waktu, agen, jenis, versi_prompt, masukan, keluaran, alat, argumen, token, durasi_ms)
      SELECT id_analisis, waktu, agen, jenis, versi_prompt, masukan, keluaran, alat, argumen, token, durasi_ms
      FROM json_to_recordset(${JSON.stringify(rows)}::json) AS x(id_analisis text, waktu timestamptz, agen text, jenis text, versi_prompt text,
        masukan text, keluaran text, alat text, argumen text, token integer, durasi_ms integer)`;
  }),
);

export const ambilLog = (id: string) =>
  aman<(BarisLog & { id: number })[]>([], async () =>
    (await sql()`SELECT * FROM feasiflow_log WHERE id_analisis = ${id} ORDER BY waktu, id`) as (BarisLog & { id: number })[]);

export const semuaLog = (maks = 20000) =>
  aman<(BarisLog & { id: number })[]>([], async () =>
    (await sql()`SELECT * FROM feasiflow_log ORDER BY waktu DESC, id DESC LIMIT ${maks}`) as (BarisLog & { id: number })[]);

/** Isian yang ditolak pemeriksa dicatat sebagai analisis berstatus 'ditolak', tanpa skor. */
export const tandaiDitolak = (id: string, ide: Ide, alasan: string) =>
  aman<void>(undefined, async () => {
    await sql()`INSERT INTO feasiflow_analisis (id, status, ide, galat) VALUES (${id}, 'ditolak', ${JSON.stringify(ide)}::jsonb, ${alasan.slice(0, 400)})
      ON CONFLICT (id) DO UPDATE SET status = 'ditolak', ide = EXCLUDED.ide, galat = EXCLUDED.galat, dibuat = now()
        WHERE feasiflow_analisis.status IN ('ditolak', 'gagal')`;
  });

/** IP dipotong: oktet terakhir IPv4 atau separuh akhir IPv6 diganti x. */
export function potongIp(ip: string): string {
  const a = (ip || "").split(",")[0].trim();
  if (/^\d+\.\d+\.\d+\.\d+$/.test(a)) return a.replace(/\.\d+$/, ".x");
  if (a.includes(":")) return a.split(":").slice(0, 3).join(":") + ":x";
  return a ? "x" : "";
}

export const catatAdmin = (aksi: string, ip: string, rincian = "") =>
  aman<void>(undefined, async () => {
    await sql()`INSERT INTO feasiflow_admin_log (aksi, ip, rincian) VALUES (${aksi}, ${potongIp(ip)}, ${rincian.slice(0, 300)})`;
  });

export const daftarAdmin = (maks = 500) =>
  aman<{ id: number; waktu: string; aksi: string; ip: string; rincian: string }[]>([], async () =>
    (await sql()`SELECT * FROM feasiflow_admin_log ORDER BY waktu DESC LIMIT ${maks}`) as { id: number; waktu: string; aksi: string; ip: string; rincian: string }[]);

export const ambilBanyak = (maks = 2000) =>
  aman<Baris[]>([], async () => (await sql()`SELECT *, 0 AS umur_detik FROM feasiflow_analisis ORDER BY dibuat DESC LIMIT ${maks}`) as Baris[]);
