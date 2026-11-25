# 01. Arsitektur

Dokumen ini menjelaskan bagian-bagian FeasiFlow AI, cara data mengalir dari formulir sampai laporan, dan titik-titik tempat kode memeriksa keluaran model. Teks prompt lengkap ada di [A-teks-prompt-lengkap.md](A-teks-prompt-lengkap.md), sedangkan rubrik dijelaskan di [03-rubrik-dan-skor.md](03-rubrik-dan-skor.md).

## 1. Gambaran umum

FeasiFlow adalah aplikasi Next.js 14 (App Router) yang berjalan sebagai fungsi tanpa server di Vercel. Seluruh logika agen ditulis dalam TypeScript di `lib/tiga-agen`. Model bahasa yang dipakai adalah Gemini melalui Gemini API dengan *function calling*; bawaan setiap agen adalah `gemini-3.5-flash-lite` dan dapat diganti per agen lewat variabel lingkungan `GEMINI_MODEL_A1`, `GEMINI_MODEL_A2`, dan `GEMINI_MODEL_A3`.

```text
+-------------+      +----------------+      +-------------------------------------+
|  Peramban   | ---> | /api/run (SSE) | ---> | lib/tiga-agen/pipeline.ts           |
|  formulir   | <--- | kirim peristiwa| <--- |  pemeriksa isian -> A1 -> A2 -> A3  |
+-------------+      +----------------+      +-------------------------------------+
                                                   |            |            |
                                         +---------+   +--------+---+   +----+-------------+
                                         | Gemini  |   | Alat agen  |   | Neon PostgreSQL  |
                                         | API     |   | (alat.ts)  |   | riwayat, log,    |
                                         +---------+   +------------+   | tembolok cari    |
                                                         |   |   |      +------------------+
                                     Google Search ------+   |   +------ Direktori & Statistik
                                     (grounding)             |           LPBBTI OJK (JSON lokal)
                                                  HTTP / Chromium / OpenAlex
```

Ada tiga lapis tanggung jawab:

1. **Model** memutuskan alat yang dipanggil, kueri, laman yang dibaca, kapan berhenti, isi BMC, dan skor indikator yang tidak ditetapkan aturan.
2. **Kode** menjalankan alat, menyimpan semua laman yang dibaca sebagai bukti, memeriksa keluaran setiap agen, menetapkan indikator yang syaratnya tertulis, dan menghitung skor gabungan serta kelas.
3. **Penyimpanan** mencatat masukan, keluaran setiap giliran agen, jejak alat, kueri, alamat, dan alasan penolakan, sehingga setiap analisis dapat diperiksa ulang lewat panel admin.

## 2. Alur satu analisis

### 2.1 Formulir dan pemeriksa isian

Pengguna mengisi 17 isian (sebagian memakai beberapa kunci; daftar kunci ada di `KUNCI_IDE` pada `pemeriksa-isian.ts`). Isian wajib adalah produk, segmen, wilayah, pendapatan, dan deskripsi. Sebelum analisis, isian melewati tiga lapis pemeriksaan:

1. `periksaKode`: aturan kode murni tanpa model. Isian kosong, lebih pendek dari batas minimum, berisi huruf acak (rasio vokal, pengulangan, kata yang tidak dikenal kamus), atau angka di luar batas wajar ditandai sebagai sampah.
2. `periksaAgen`: satu panggilan model untuk menilai apakah isian bermakna dan konsisten satu sama lain.
3. Tanya balik: bila ada isian yang meragukan, API mengembalikan status `perlu_klarifikasi` bersama pertanyaan, paling banyak `BATAS_PUTARAN` kali.

Isian yang tergolong sampah **tidak dinilai**. Halaman formulir menampilkan pesan "Isian ditolak: kosong, terlalu pendek, acak, atau tidak bermakna. Ide tidak dinilai." Pemeriksa yang sama dipasang di rute `run`, `satu-agen`, dan `pembanding`, sehingga perbandingan antarkonfigurasi tetap adil.

### 2.2 A1, agen riset

A1 menerima ide dan tanggal analisis. Pada giliran pertama A1 diminta memanggil sekaligus beberapa alat: `cari_web` untuk pasar, penyelenggara sejenis, dan aturan izin; satu kueri jumlah segmen di provinsi sasaran; `cek_direktori_ojk`; `cek_statistik_ojk`; dan `cari_jurnal` bila perlu bukti ilmiah. Setelah itu A1 memilih laman yang paling berwenang dan memanggil `baca_laman`.

Kode menerapkan batas dan pemeriksaan berikut:

| Pemeriksaan | Aturan | Letak |
|---|---|---|
| Kuota kueri | paling banyak 4 kueri `cari_web` + `cari_jurnal` | `BATAS_CARI` di `alat.ts` |
| Kuota baca | paling banyak 12 laman | `BATAS_BACA` |
| Asal alamat | hanya alamat dari hasil pencarian atau sumber resmi tingkat 1 | `bacaSatu` |
| Alamat pribadi | alamat lokal atau jaringan pribadi ditolak (cegah SSRF) | `alamatPribadi` |
| Minimal bukti | jawaban ditolak bila laman yang dibaca kurang dari 3 | `pipeline.ts` |
| Angka bersumber | angka di setiap butir harus ada di kutipan laman yang disebut pada butir itu | `angkaPerButir` di `agentik.ts` |
| Umur sumber | laman lebih dari 24 bulan tidak boleh menjadi dasar angka pasar | `BATAS_BULAN` |

Laman dibaca utuh lewat HTTP. Bila teksnya kurang dari 80 kata (biasanya laman yang dirender JavaScript), kode mencoba HTTP sekali lagi lalu membuka laman dengan Chromium tanpa tampilan (`@sparticuz/chromium` + `playwright-core`). Laman resmi tingkat 1 yang menolak alamat IP server diambil lewat fitur *URL context* Gemini. Teks utuh disimpan di `gudang` sebagai bukti; yang dikembalikan kepada agen hanya kutipan yang relevan, dibungkus penanda *spotlighting* (lihat [05-keamanan.md](05-keamanan.md)).

Bila jawaban A1 ditolak, A1 menerima daftar penolakan dan diminta memperbaiki. Perbaikan tanpa alat memakai prompt khusus `PERAN_A1_SUNTING` yang hanya boleh menghapus atau mengganti bagian yang ditandai.

### 2.3 A2, agen analisis

A2 menerima ide dan temuan A1, lalu menyusun BMC sembilan blok dan daftar risiko. Setiap blok wajib diberi asal: `ide` (disalin atau diringkas dari isian), `turunan` (disimpulkan dari ide atau riset), atau `kosong`. Daftar risiko wajib memuat risiko gagal bayar dan risiko perlindungan data. Kolom penanganan disalin dari isian `rencana_gagal_bayar` dan `rencana_data`; bila ide tidak menyebut rencana, kode menetapkan teks "belum ada pada ide".

A2 dapat memeriksa klaim lewat `lihat_bukti` dan boleh meminta bantuan A1 lewat `minta_riset` paling banyak satu kali. Delegasi ini dicatat sebagai bukti perilaku *agentic* (lihat metrik di bagian 4).

### 2.4 A3, agen penilaian

A3 menerima ide, temuan A1, keluaran A2, dan blok `<nilai_tetap>`. Blok itu memuat indikator yang skornya sudah ditetapkan kode dari aturan tertulis: D1a dari Statistik LPBBTI OJK, D2d dari isian modal dan SDM terhadap POJK 40/2024, D3a dari daftar kegiatan yang diizinkan, serta D3b dan D3c dari jumlah unsur rencana. A3 wajib menyalin indikator itu apa adanya dan menilai sendiri indikator lainnya (biasanya D1b, D1c, D2a, D2b, D2c).

Kode memeriksa keluaran A3:

- Skor 100 pada D1b dan D1c wajib bersumber laman tingkat 1 atau 2 yang tersimpan di gudang dan terbit paling lama 24 bulan.
- Skor yang berbeda dari `<nilai_tetap>` dikembalikan ke nilai kode.
- Butir kritik yang memuat angka tanpa bukti dibuang (`saringKritik`).
- A3 boleh mendelegasikan balik: `minta_riset` ke A1 atau `minta_revisi_analisis` ke A2, masing-masing paling banyak satu kali.

### 2.5 Skor gabungan, kelas, dan rencana aksi

Kode menghitung skor gabungan S dengan *Simple Additive Weighting* berbobot sama atas sepuluh indikator (`hitungSkor` di `kelas.ts`). Kelas ditentukan sebagai berikut:

| Kondisi | Kelas |
|---|---|
| D3a = 0 (aturan gugur) | Tidak Layak |
| S ≥ 70 | Layak |
| 50 ≤ S < 70 | Layak Bersyarat |
| S < 50 | Tidak Layak |

Di samping itu, `dinamis.ts` menghitung skor tampilan 1–100 dan BEP dalam bulan. Skor tampilan tidak mengubah kelas. Terakhir, `rekomendasi.ts` menyusun rencana aksi 3–7 butir (legal, modal, risiko, pivot); setiap butir wajib mengutip sumber dari gudang bukti, dan butir tanpa sitasi sah dibuang.

## 3. Konfigurasi pembanding

Agar sumbangan pembagian agen dapat dipisahkan dari sumbangan alat pencarian, sistem menyediakan tiga konfigurasi dengan rubrik dan aturan yang kata demi kata sama:

| Kode | Rute | Isi |
|---|---|---|
| K1 | `/api/pembanding` | Satu LLM tanpa alat; hanya rubrik, sikap kritis, dan aturan anti-halusinasi |
| K2 | `/api/satu-agen` | Satu agen dengan alat yang sama dengan A1, mengerjakan riset, analisis, dan penilaian sendirian tanpa pemeriksaan antartahap |
| K3 | `/api/run` | Tiga agen A1, A2, A3 dengan pemeriksaan antaragen dan nilai kode |

## 4. Metrik agentic

`Perekam` di `agentik.ts` mencatat setiap giliran model: alat yang dipilih, baris RENCANA, KEPUTUSAN, dan SELESAI yang ditulis agen, delegasi antaragen, serta apakah pesan pertama dikirim oleh kode (putaran ulang karena penolakan) atau merupakan keputusan agen. Dari catatan itu dihitung metrik berikut dan disimpan di kolom `metrik_agentik` setiap hasil:

- jumlah keputusan yang diambil model dan jumlah langkah yang dipaksa kode;
- keragaman lintasan alat antaride;
- keputusan berhenti oleh agen;
- jumlah delegasi antaragen;
- jumlah perbaikan setelah keluaran ditolak.

## 5. Penyimpanan

Neon PostgreSQL menyimpan empat tabel (rinciannya ada di [04-api-dan-data.md](04-api-dan-data.md)):

- `feasiflow_analisis`: ide, hasil lengkap, S, kelas, durasi, galat;
- `feasiflow_log`: setiap giliran agen dengan masukan, keluaran, alat, argumen, token, dan durasi;
- `feasiflow_admin_log`: login admin berhasil atau gagal beserta alamat IP;
- `feasiflow_cari`: tembolok hasil pencarian per kueri, agar kueri yang sama tidak menghabiskan kuota.

## 6. Keputusan rancangan dan alasannya

| Keputusan | Alasan |
|---|---|
| Tiga agen, bukan lima atau sembilan | Sesuai tiga jenis pekerjaan (mengumpulkan, menganalisis, menilai) dan hanya menghasilkan dua sambungan yang perlu diperiksa; kesalahan satu agen dapat menjalar (Cemri dkk., 2025) |
| Skala 0/50/100 per indikator | Mengurangi keragaman skor model; skor tampilan 1–100 dihitung kode terpisah |
| Bobot sama rata | Data terlalu sedikit untuk menaksir bobot; bobot sama rata dapat mengungguli bobot hasil regresi di luar sampel |
| Indikator beraturan ditetapkan kode | Model tidak dapat mengubah syarat tertulis seperti modal Rp25 miliar |
| Teks laman disimpan utuh | Setiap angka di laporan dapat ditelusuri ke kutipan aslinya |
| TypeScript dan Next.js, bukan Python dan Streamlit | Sesuai layanan web tanpa server di Vercel; satu bahasa untuk antarmuka dan agen |
