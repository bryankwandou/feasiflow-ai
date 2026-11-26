# Bukti Sistem Dibangun dan Diuji Coba Langsung

Skripsi versi panjang: *Skripsi_Versi_Panjang_2361021_fintech_audit_ref_25nov2026* (105 halaman), Bab V "Hasil Uji Coba Pendahuluan dan Pembahasan" serta Lampiran 5, 6, dan 10.

Bab V menyatakan bahwa sistem uji coba "dibangun sebagai aplikasi web dan dijalankan pada layanan serverless", dan bahwa "semua data mentahnya disimpan pada folder kerja dan arsip repositori privat". Dokumen ini memeriksa pernyataan itu dari tiga sumber yang tidak bergantung pada naskah: berkas mentah uji coba, basis data aplikasi yang berjalan, dan kode sumber di GitHub.

Diperiksa: 2026-11-26.

## 1. Kode sumber dan aplikasi yang berjalan

| Bukti | Isi | Cara memeriksa |
|---|---|---|
| Kode sumber | Repositori `bryankwandou/feasiflow-ai` | `https://github.com/bryankwandou/feasiflow-ai` |
| Aplikasi berjalan | `https://feasiflowai.vercel.app` | Buka di peramban |
| Kode yang berjalan sama dengan GitHub | `/api/versi` menampilkan commit yang sedang berjalan. Saat pemeriksaan kode ini, nilainya `df8169412eacfa3ff2b47e88ea3b482dc1ee753b`, sama dengan commit terakhir cabang `master`. Commit yang menambahkan dokumen bukti ini lalu di-deploy dengan cara yang sama | Bandingkan `https://feasiflowai.vercel.app/api/versi` dengan halaman commit GitHub |
| Arsip data mentah | Repositori privat `bryankwandou/feasiflow-ai-arsip` dan folder kerja `03_uji_sistem` (39 berkas) | Folder kerja pada drive E |

Uji coba 11 sampai 18 November 2026 dijalankan ke alamat `https://feasiflow-ai.vercel.app` (tercatat di `03_uji_sistem/eval15b/ukuran.json` dan skrip `uji-k1-k2-k3/jalankan.mjs`). Alamat itu kini menjawab HTTP 402 karena penyedia hosting memblokir akun lama, sehingga aplikasi dipindah ke `https://feasiflowai.vercel.app` dengan basis data yang sama. Karena basis datanya sama, sesi uji coba lama masih dapat dibuka di alamat baru.

## 2. Sesi uji coba tercatat di basis data aplikasi

Setiap id sesi diambil dari berkas mentah (`jejak15.json` dan `uji-k1-k2-k3/hasil_E0x.json`), lalu diminta ke `https://feasiflowai.vercel.app/api/result/<id>`. Angka pada id adalah cap waktu (milidetik) saat sesi dibuat oleh skrip uji.

Hasil: **19 sesi ditemukan dengan status selesai. 19 dari 19 cocok dengan berkas mentah, dan 15 dari 15 cocok dengan Tabel 13 naskah** (skor gabungan dan kelas). Model yang tercatat pada setiap sesi adalah `gemini-3.5-flash-lite` untuk ketiga agen, sama dengan Tabel 10 naskah.

| Id sesi | Dibuat | Basis data | Berkas mentah | Naskah (Tabel 13) | Cocok mentah | Cocok naskah | Panggilan alat |
|---|---|---|---|---|---|---|---|
| `eval_C12_1794761703442` | 2026-11-15 16:55:03 UTC | 77,8 Layak | 77,8 Layak | 77,8 Layak | ya | ya | 22 |
| `eval_C15_1794761438068` | 2026-11-15 16:50:38 UTC | 50 Tidak Layak | 50 Tidak Layak | 50 Tidak Layak | ya | ya | 12 |
| `eval_C14_1794761380723` | 2026-11-15 16:49:40 UTC | 55,6 Layak Bersyarat | 55,6 Layak Bersyarat | 55,6 Layak Bersyarat | ya | ya | 14 |
| `eval_C13_1794761300247` | 2026-11-15 16:48:20 UTC | 66,7 Layak Bersyarat | 66,7 Layak Bersyarat | 66,7 Layak Bersyarat | ya | ya | 23 |
| `eval_C12_1794761222885` | 2026-11-15 16:47:02 UTC | 77,8 Layak | 77,8 Layak | 77,8 Layak | ya | ya | 22 |
| `eval_C11_1794761142460` | 2026-11-15 16:45:42 UTC | 66,7 Layak Bersyarat | 66,7 Layak Bersyarat | 66,7 Layak Bersyarat | ya | ya | 24 |
| `eval_C10_1794761039063` | 2026-11-15 16:43:59 UTC | 72,2 Layak | 72,2 Layak | 72,2 Layak | ya | ya | 24 |
| `eval_C09_1794760937795` | 2026-11-15 16:42:17 UTC | 88,9 Layak | 88,9 Layak | 88,9 Layak | ya | ya | 31 |
| `eval_C08_1794760869621` | 2026-11-15 16:41:09 UTC | 50 Layak Bersyarat | 50 Layak Bersyarat | 50 Layak Bersyarat | ya | ya | 12 |
| `eval_C07_1794760778691` | 2026-11-15 16:39:38 UTC | 72,2 Layak | 72,2 Layak | 72,2 Layak | ya | ya | 29 |
| `eval_C06_1794760725842` | 2026-11-15 16:38:45 UTC | 72,2 Layak | 72,2 Layak | 72,2 Layak | ya | ya | 18 |
| `eval_C05_1794760637408` | 2026-11-15 16:37:17 UTC | 66,7 Layak Bersyarat | 66,7 Layak Bersyarat | 66,7 Layak Bersyarat | ya | ya | 35 |
| `eval_C04_1794760548473` | 2026-11-15 16:35:48 UTC | 72,2 Layak | 72,2 Layak | 72,2 Layak | ya | ya | 16 |
| `eval_C03_1794760457420` | 2026-11-15 16:34:17 UTC | 72,2 Layak | 72,2 Layak | 72,2 Layak | ya | ya | 23 |
| `eval_C02_1794760388355` | 2026-11-15 16:33:08 UTC | 72,2 Layak | 72,2 Layak | 72,2 Layak | ya | ya | 21 |
| `uji_k3_E01_1794931324478` | 2026-11-17 16:02:04 UTC | 72,2 Layak | 72,2 Layak | Lampiran 5 | ya | lihat Lampiran 5 | 19 |
| `uji_k3_E02_1794931705407` | 2026-11-17 16:08:25 UTC | 77,8 Layak | 77,8 Layak | Lampiran 5 | ya | lihat Lampiran 5 | 12 |
| `uji_k3_E03_1794931324485` | 2026-11-17 16:02:04 UTC | 61,1 Layak Bersyarat | 61,1 Layak Bersyarat | Lampiran 5 | ya | lihat Lampiran 5 | 12 |
| `uji_k3_E04_1794931871038` | 2026-11-17 16:11:11 UTC | 72,2 Layak | 72,2 Layak | Lampiran 5 | ya | lihat Lampiran 5 | 20 |

Kontrol: id karangan `eval_C01_1794760300000` dijawab `tidak_ada`. Artinya endpoint tidak membuat hasil untuk id sembarang; sesi di atas memang tersimpan.

Keterbatasan: id sesi C01 tidak tersimpan di `jejak15.json` (berkas itu memuat C12 dua kali), sehingga baris C01 pada Tabel 13 hanya dapat dicocokkan ke `eval15b/uji_fungsional.csv`, tidak ke basis data. Delapan jalan K1 dan K2 (`/api/pembanding`, `/api/satu-agen`) tidak disimpan dengan id, sehingga angkanya hanya dapat dicocokkan ke `ringkasan.csv`.

## 3. Angka Lampiran 5 sama dengan berkas mentah

Baris tabel rincian Lampiran 5 yang dicek (halaman PDF 67) sama dengan `03_uji_sistem/uji-k1-k2-k3/ringkasan.csv`: E03 K2: 14.535 token masuk, 2.520 token keluar, 62 detik; E03 K3: 36.800, 6.016, 238 detik; E04 K1: 365, 445, 9 detik.

## 4. Tangkapan layar aplikasi yang berjalan

Diambil 2026-11-26 dari `https://feasiflowai.vercel.app` dengan peramban Chromium, bahasa Indonesia.

| Berkas | Isi |
|---|---|
| `01_beranda.png` | Halaman depan aplikasi |
| `02_hasil_C15_DeFi_TidakLayak.png` | Sesi uji C15 (15 November 2026): skor 50,0, Tidak Layak karena aturan gugur D3a, rubrik 10 indikator dengan sumber, BMC, temuan A1, 8 sumber yang dibaca, pemeriksaan antarfase (A2 dan A3 sempat ditolak lalu lolos), 58 detik, 23 panggilan model, 50.414 token |
| `03_hasil_C09_peternak_sapi_Layak.png` | Sesi uji C09: skor 88,9, Layak |
| `04_hasil_E03_K3_LayakBersyarat.png` | Sesi uji E03 pada K3 (17 November 2026): skor 61,1, Layak Bersyarat |
| `05_api_versi.png` | Commit yang sedang berjalan |
| `06_api_result_C12.png` | Data mentah sesi C12 dari basis data |

## 5. Kesimpulan

Pernyataan Bab V bahwa sistem sudah dibangun dan diuji coba dapat diperiksa ulang oleh pihak lain: kode sumbernya publik, aplikasinya berjalan, commit yang berjalan sama dengan GitHub, dan 19 sesi uji coba tanggal 15 dan 17 November 2026 masih tersimpan di basis data aplikasi dengan skor dan kelas yang sama dengan berkas mentah dan tabel naskah.

Data lengkap pencocokan: `cocok_sesi.json`.
