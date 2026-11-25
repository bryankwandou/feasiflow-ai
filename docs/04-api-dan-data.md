# 04. API dan Data

Kode sumber lengkap setiap rute ada di [D-rute-api.md](D-rute-api.md). Dokumen ini merangkum fungsi setiap rute, bentuk masukan dan keluarannya, serta tabel basis data.

## 1. Rute

| Rute | Metode | Fungsi |
|---|---|---|
| `/api/run` | POST | Menjalankan K3 (tiga agen) dan mengalirkan peristiwa lewat *Server-Sent Events* |
| `/api/satu-agen` | POST | Menjalankan K2 (satu agen beralat) |
| `/api/pembanding` | POST | Menjalankan K1 (satu LLM tanpa alat) |
| `/api/analyze` | POST | Membuat sesi analisis dan menyimpan ide |
| `/api/result/[sessionId]` | GET | Mengambil hasil analisis yang tersimpan |
| `/api/cek` | POST | Uji terkendali, hanya dengan `CEK_TOKEN` |
| `/api/ambil-dokumen` | POST | Mengubah URL atau PDF pitch deck menjadi draf isian formulir |
| `/api/versi` | GET | SHA commit, cabang, dan waktu build yang sedang berjalan |
| `/api/admin` | POST | Masuk dan keluar panel admin |
| `/api/admin/ekspor` | GET | Ekspor riwayat dan log dalam JSON (hanya admin) |

### 1.1 `/api/run`

Masukan berupa JSON objek `Ide` (17 isian). Keluaran berupa aliran peristiwa:

| Peristiwa | Isi |
|---|---|
| `perlu_klarifikasi` | Pertanyaan dari pemeriksa isian; analisis belum dijalankan |
| `ditolak` | Isian sampah; ide tidak dinilai |
| `langkah` | Giliran agen: nama agen, alat yang dipanggil, ringkasan |
| `periksa` | Hasil pemeriksaan kode setelah agen menjawab, termasuk alasan penolakan |
| `selesai` | `HasilAnalisis` lengkap |
| `galat` | Pesan galat tanpa rincian internal |

Analisis dibatasi `MAX_CONCURRENT_RUNS` agar kuota model tidak habis serentak.

### 1.2 `/api/ambil-dokumen`

- `application/json` `{"url": "https://..."}`: mengambil laman, membersihkan teks, lalu memetakannya ke isian.
- `multipart/form-data` dengan berkas `berkas`: PDF paling besar 10 MB dan paling banyak 30 halaman.

Keluarannya `{status: "ok", sumber, ide, pemeriksaan, injeksi, ditolak, catatan}`. Isian diterima hanya bila model menyertakan kutipan persis 3–25 kata dari dokumen dan kutipan itu benar-benar ditemukan di teks. Kode galat dipetakan ke status HTTP: `terlalu_besar` 413, `jenis_tidak_didukung`/`bukan_pdf` 415, `http_gagal`/`pemetaan_gagal` 502, `waktu_habis` 504.

### 1.3 `/api/versi`

Mengembalikan `aplikasi`, `commit`, cabang, waktu build, dan id deploy Vercel. Rute ini dipakai sebagai bukti bahwa kode yang berjalan di produksi sama dengan commit terakhir di GitHub.

## 2. Bentuk data utama

### 2.1 `Ide`

Kunci formulir: `jenis`, `produk`, `segmen`, `wilayah`, `saluran`, `pendapatan`, `biaya`, `rencana_gagal_bayar`, `rencana_data`, `tahap`, `deskripsi`, `bentuk_hukum`, `modal_disetor`, `rencana_sdm`, `layanan`, `tempat`, `calon_pelanggan`, `pendapatan_bulanan`, `biaya_bulanan`, `biaya_awal`.

### 2.2 `HasilAnalisis`

| Kolom | Isi |
|---|---|
| `session_id`, `ide` | Identitas dan masukan |
| `periksa_isian` | Catatan pemeriksa isian |
| `riset`, `bukti` | Temuan A1 dan daftar laman yang dibaca (alamat, judul, jalur, tingkat, tanggal terbit) |
| `bmc`, `bmc_asal`, `risiko` | Keluaran A2 |
| `skor`, `dimensi`, `S`, `kelas`, `aturan_gugur` | Penilaian |
| `dinamis`, `bep_bulan` | Skor tampilan 1–100 dan BEP |
| `kritik` | Kelemahan utama, pertanyaan tajam, syarat agar layak, dan butir yang dibuang |
| `rencana_aksi` | Butir aksi bersitasi, butir dibuang, catatan |
| `pemeriksaan`, `penolakan_per_kategori` | Jejak pemeriksaan kode |
| `keputusan`, `delegasi`, `injeksi`, `metrik_agentik` | Jejak perilaku agentic |
| `jejak`, `hitung` | Urutan pemanggilan alat dan hitungan per jalur (http, playwright, url_context, gagal) |
| `angka_diperiksa`, `angka_tanpa_bukti` | Pemeriksaan angka |
| `versi_prompt`, `model`, `pakai`, `detik` | Versi prompt, model per agen, pemakaian token, durasi |

## 3. Tabel basis data

Tabel dibuat otomatis saat pertama kali dipakai (`simpan.ts`).

```sql
CREATE TABLE IF NOT EXISTS feasiflow_analisis (
  id text PRIMARY KEY,
  dibuat timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL,
  ide jsonb NOT NULL,
  hasil jsonb,
  s numeric,
  kelas text,
  detik integer,
  galat text
);

CREATE TABLE IF NOT EXISTS feasiflow_log (
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
);

CREATE TABLE IF NOT EXISTS feasiflow_admin_log (
  id bigserial PRIMARY KEY,
  waktu timestamptz NOT NULL DEFAULT now(),
  aksi text NOT NULL,
  ip text,
  rincian text
);

CREATE TABLE IF NOT EXISTS feasiflow_cari (
  kueri text PRIMARY KEY,
  dibuat timestamptz NOT NULL DEFAULT now(),
  tautan jsonb NOT NULL
);
```

## 4. Data statis

| Berkas | Isi | Sumber |
|---|---|---|
| `lib/tiga-agen/statistik-lpbbti.json` | Penyaluran dan outstanding LPBBTI per provinsi, Desember 2023 sampai Desember 2025 | Statistik LPBBTI OJK |
| `lib/tiga-agen/direktori-lpbbti.json` | Nama penyelenggara berizin | Direktori LPBBTI OJK per 31 Maret 2026 |
| `data/entitas-uji.contoh.json` | Contoh bentuk data entitas uji | disusun peneliti |

Kedua berkas OJK disimpan di repositori agar indikator yang ditetapkan kode tidak bergantung pada ketersediaan situs OJK saat analisis berjalan.
