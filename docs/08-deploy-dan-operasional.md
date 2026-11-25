# 08. Deploy dan Operasional

## 1. Lingkungan produksi

- Platform: Vercel, proyek `feasiflowai`, URL https://feasiflowai.vercel.app
- Runtime: Node.js. Fungsi analisis memakai `maxDuration` yang cukup untuk tiga agen.
- Basis data: Neon PostgreSQL lewat `@neondatabase/serverless`.
- Peramban: `@sparticuz/chromium` dengan `playwright-core`. Vercel menjalankan Node 24, sedangkan Chromium 131 hanya membongkar pustaka sistemnya untuk Node 20/22, jadi `AWS_LAMBDA_JS_RUNTIME=nodejs22.x` diset sebelum modul diimpor (`peramban.ts`).

## 2. Langkah deploy

```bash
npm run type-check
npm run build
vercel --prod --yes --scope <tim> --token $VERCEL_TOKEN
```

Deploy dilakukan dari salinan folder tanpa `.git`, `node_modules`, `.next`, dan `.env*`, dengan `.vercel/project.json` tetap disertakan. Setelah deploy, periksa:

```bash
curl https://feasiflowai.vercel.app/api/versi
```

Nilai `commit` harus sama dengan `git rev-parse HEAD` pada commit yang di-push ke GitHub. SHA commit diteruskan lewat variabel `FEASIFLOW_COMMIT_SHA` pada saat build.

## 3. Variabel lingkungan produksi

Daftar lengkap ada di [README](../README.md#variabel-lingkungan). Variabel yang wajib di produksi adalah `GEMINI_API_KEY`, `DATABASE_URL`, `ADMIN_USER`, dan `ADMIN_PASS`. Nilainya hanya diisi lewat dasbor atau CLI Vercel.

## 4. Panel admin

| Halaman | Isi |
|---|---|
| `/admin` | Formulir masuk. Setelah masuk: daftar analisis terbaru dengan waktu, status, kelas, S, durasi, dan ringkasan ide, serta log login admin |
| `/admin/[id]` | Rincian satu analisis: isian lengkap, catatan pemeriksa isian, keluaran A1, A2, dan A3, setiap giliran agen dari `feasiflow_log` (masukan, keluaran, alat, argumen, token, durasi), jejak alat, kueri pencarian, alamat yang dibaca beserta tingkat dan jalurnya, alasan penolakan per kategori, temuan injeksi, serta rencana aksi |
| `/api/admin/ekspor` | Unduh riwayat dan log dalam JSON |

Log aktivitas ditulis oleh `catatLog` (`log.ts`) pada setiap giliran agen, dan oleh `catatAdmin` pada setiap login berhasil atau gagal.

## 5. Kuota dan biaya

- Model bawaan `gemini-3.5-flash-lite` memakai tingkat gratis Gemini API. Bila kuota habis, sistem beralih ke `GEMINI_API_KEY_PAID`.
- Pencarian dibatasi 4 kueri per analisis dan ditembolok per kueri di `feasiflow_cari`.
- Peramban dibatasi `MAKS_PERAMBAN` laman per analisis (bawaan 6).
- Analisis serentak dibatasi `MAX_CONCURRENT_RUNS`.

## 6. Pemantauan

- Galat disimpan di kolom `galat` tabel `feasiflow_analisis`.
- `console.error` pada fungsi Vercel mencatat kegagalan skor dinamis, rencana aksi, dan pembacaan laman (alamat dan jumlah kata).
- Panel admin menampilkan jumlah penolakan per kategori, sehingga pola kegagalan agen dapat dilihat.
