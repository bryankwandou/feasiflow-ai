# FeasiFlow AI

Sistem *agentic AI* tiga agen untuk menilai kelayakan ide *startup fintech lending* (Layanan Pendanaan Bersama Berbasis Teknologi Informasi, LPBBTI) di Indonesia. Sistem melakukan riset pasar bersumber, menyusun *Business Model Canvas* (BMC) sembilan blok, lalu mengklasifikasikan ide menjadi **Layak**, **Layak Bersyarat**, atau **Tidak Layak** dengan rubrik sepuluh indikator. Setiap skor disertai alamat sumber dan setiap syarat yang belum dipenuhi disertai pasal POJK Nomor 40 Tahun 2024.

- Produksi: https://feasiflowai.vercel.app
- Versi yang sedang berjalan (SHA commit, waktu build): https://feasiflowai.vercel.app/api/versi
- Kode penelitian: repositori ini. Arsip data dan bukti: `bryankwandou/feasiflow-ai-arsip`.

Penelitian tugas akhir Program Studi Teknik Informatika, Fakultas Teknologi Informasi, Universitas Atma Jaya Makassar (NIM 2361021).

---

## Daftar isi

1. [Masalah yang diselesaikan](#masalah-yang-diselesaikan)
2. [Cara kerja singkat](#cara-kerja-singkat)
3. [Fitur](#fitur)
4. [Struktur repositori](#struktur-repositori)
5. [Menjalankan secara lokal](#menjalankan-secara-lokal)
6. [Variabel lingkungan](#variabel-lingkungan)
7. [Pengujian](#pengujian)
8. [Dokumentasi rinci](#dokumentasi-rinci)
9. [Batasan](#batasan)

---

## Masalah yang diselesaikan

Calon pendiri biasanya memeriksa ide dengan BMC dan riset pasar. Pemeriksaan itu lama karena sumbernya tersebar: Statistik LPBBTI OJK berupa lembar kerja bulanan, Direktori OJK berupa PDF, data segmen dari BPS atau kementerian, dan syarat izin di dalam pasal POJK. Pemeriksaan juga biasanya dikerjakan sendiri oleh pendiri yang berkepentingan agar idenya tampak layak.

Model bahasa yang ditanya langsung menjawab dari ingatan pelatihannya, bukan dari data terbaru, dan jawabannya dapat berubah setiap kali ditanya. FeasiFlow mengatasinya dengan tiga cara:

1. **Agen mencari dan membaca sumber sendiri.** Angka yang menjadi dasar skor hanya boleh berasal dari sumber tingkat 1 (resmi) atau tingkat 2 (ilmiah dan lembaga internasional) yang sudah benar-benar dibaca.
2. **Kode memeriksa setiap perpindahan antaragen.** Keluaran tanpa bukti, alamat yang tidak pernah dibaca, atau angka yang tidak ada di kutipan ditolak dan agen diminta mengulang.
3. **Aturan yang tertulis ditetapkan oleh kode, bukan oleh model.** Contohnya modal disetor paling sedikit Rp25 miliar (Pasal 7 ayat 1 POJK 40/2024) dan aturan gugur untuk produk di luar kegiatan LPBBTI.

## Cara kerja singkat

```text
Formulir 17 isian
      |
      v
Pemeriksa isian (kode + satu panggilan model + tanya balik)  -> isian sampah ditolak, tidak dinilai
      |
      v
A1 Riset   : cari_web, baca_laman, cari_jurnal (OpenAlex), cek_direktori_ojk, cek_statistik_ojk
      |  pemeriksaan kode: alamat harus dari hasil cari, angka harus ada di kutipan, minimal 3 laman
      v
A2 Analisis: BMC 9 blok + daftar risiko (wajib gagal bayar dan perlindungan data)
      |  pemeriksaan kode: asal tiap blok (ide / turunan / kosong), penanganan risiko disalin dari ide
      v
A3 Penilaian: skor 10 indikator (0/50/100) + kritik
      |  kode menetapkan indikator yang syaratnya tertulis (nilai_tetap), menolak skor 100 tanpa sumber
      v
SAW berbobot sama + aturan gugur D3a  ->  kelas + skor tampilan 1-100 + rencana aksi bersumber
```

Uraian lengkap ada di [docs/01-arsitektur.md](docs/01-arsitektur.md).

## Fitur

| Fitur | Keterangan | Dokumen |
|---|---|---|
| Tiga agen dengan pemeriksaan antaragen | A1 riset, A2 analisis, A3 penilaian, pola ReAct dan *function calling* Gemini | [01](docs/01-arsitektur.md), [02](docs/02-agen-dan-prompt.md) |
| Penolakan isian sampah | Isian kosong, terlalu pendek, acak (misalnya "UAWHRBUWSHU"), atau tidak bermakna ditolak sebelum analisis | [05](docs/05-keamanan.md), [07](docs/07-pengujian-dan-bukti.md) |
| Rubrik 10 indikator | Tiga dimensi: pasar (D1a–D1c), model bisnis dan keuangan (D2a–D2d), regulasi dan risiko (D3a–D3c) | [03](docs/03-rubrik-dan-skor.md) |
| Konfigurasi pembanding | K1 satu LLM tanpa alat, K2 satu agen beralat sama, K3 tiga agen | [03](docs/03-rubrik-dan-skor.md) |
| Rencana aksi bersumber | Butir legal, modal, risiko, pivot; setiap butir wajib mengutip laman yang dibaca, butir tanpa sitasi sah dibuang kode | [06](docs/06-sumber-dan-rekomendasi-aksi.md) |
| Banding beberapa ide | Peringkat dengan *Simple Additive Weighting* di halaman `/banding` | [06](docs/06-sumber-dan-rekomendasi-aksi.md) |
| Ambil isian dari URL atau PDF pitch deck | Isian hanya diterima bila ada kutipan persis di dokumen | [06](docs/06-sumber-dan-rekomendasi-aksi.md) |
| Pertahanan *prompt injection* | *Spotlighting* (penanda acak + *datamarking*) dan penetralan instruksi tersisip pada setiap laman web | [05](docs/05-keamanan.md) |
| 22 bahasa antarmuka | Indonesia, English, dan 20 bahasa lain | [09](docs/09-i18n-tema-dan-dasar-ilmiah.md) |
| Tema terang dan gelap | Mengikuti sistem, dapat diganti, tanpa kedip saat muat | [09](docs/09-i18n-tema-dan-dasar-ilmiah.md) |
| Panel admin | `/admin`: riwayat analisis, masukan, keluaran A1/A2/A3, jejak alat, kueri, URL, alasan penolakan, ekspor | [08](docs/08-deploy-dan-operasional.md) |

## Struktur repositori

```text
app/                      Halaman Next.js (App Router) dan rute API
  analyze/                Formulir ide dan halaman hasil
  banding/                Banding beberapa ide (SAW)
  admin/                  Panel admin (login, riwayat, rincian, ekspor)
  api/                    run, satu-agen, pembanding, analyze, result, cek, ambil-dokumen, versi, admin
components/               Komponen antarmuka (panel hasil, pemilih bahasa, tombol tema, ambil dokumen)
lib/tiga-agen/            Inti sistem
  pipeline.ts             Orkestrasi A1 -> A2 -> A3 dan pemeriksaan antaragen
  prompt.ts               Teks prompt v2 (sidik SHA-256 disimpan di setiap hasil)
  alat.ts                 Alat agen: pencarian, pembacaan laman, OpenAlex, Direktori dan Statistik OJK
  agentik.ts              Perekam keputusan, metrik agentic, penyaring kritik
  kelas.ts, dinamis.ts    SAW, aturan gugur, skor tampilan 1-100, BEP
  aturan-kode.ts          Nilai indikator yang ditetapkan kode dari aturan tertulis
  pemeriksa-isian.ts      Penolak isian sampah
  injeksi.ts              Pertahanan prompt injection
  rekomendasi.ts          Rencana aksi bersumber
  banding-ide.ts          Peringkat SAW banyak ide
  ambil-dokumen.ts        Pemetaan URL/PDF ke isian formulir
  satu-agen.ts, pembanding.ts   Konfigurasi K2 dan K1
  simpan.ts, log.ts       Penyimpanan Neon PostgreSQL dan log aktivitas
lib/i18n/                 Kamus 22 bahasa dan penyedia bahasa
lib/tema/                 Skrip tema awal
tests/                    Uji unit (tsx)
docs/                     Dokumentasi rinci
```

## Menjalankan secara lokal

Prasyarat: Node.js 20 atau lebih baru, kunci Gemini API, dan (opsional) basis data PostgreSQL.

```bash
npm install
cp .env.example .env.local   # isi variabel di bawah
npm run dev                  # http://localhost:3000
npm run type-check
npm run build
```

Tanpa `DATABASE_URL`, analisis tetap berjalan tetapi riwayat, log admin, dan tembolok pencarian tidak disimpan.

## Variabel lingkungan

| Variabel | Wajib | Kegunaan |
|---|---|---|
| `GEMINI_API_KEY` | ya | Kunci Gemini API tingkat gratis |
| `GEMINI_API_KEY_PAID` | tidak | Kunci cadangan bila kuota gratis habis |
| `GEMINI_MODEL`, `GEMINI_MODEL_A1/A2/A3`, `GEMINI_MODEL_PEMERIKSA` | tidak | Nama model per agen; bawaan `gemini-3.5-flash-lite` |
| `DATABASE_URL` atau `POSTGRES_URL` | tidak | Neon PostgreSQL untuk riwayat, log, dan tembolok |
| `ADMIN_USER`, `ADMIN_PASS` | untuk `/admin` | Akun admin; tidak pernah ditulis di kode |
| `CEK_TOKEN` | tidak | Token untuk rute uji `/api/cek` |
| `MAKS_PERAMBAN`, `TANPA_PERAMBAN` | tidak | Batas pemakaian peramban Chromium per analisis |
| `MAX_CONCURRENT_RUNS` | tidak | Batas analisis serentak |

Kunci dan sandi hanya disimpan di variabel lingkungan Vercel dan tidak pernah dimasukkan ke repositori.

## Pengujian

```bash
npx tsx tests/pemeriksa-isian.test.ts   # penolakan isian sampah
npx tsx tests/sampah.test.ts            # kasus isian acak, kosong, berulang
npx tsx tests/agentik.test.ts           # metrik agentic dan penyaring kritik
npx tsx tests/banding-ide.test.ts       # peringkat SAW
npx tsx tests/ambil-dokumen.test.ts     # pemetaan dokumen dan kutipan
```

Hasil uji dan bukti lain dijelaskan di [docs/07-pengujian-dan-bukti.md](docs/07-pengujian-dan-bukti.md).

## Dokumentasi rinci

| Berkas | Isi |
|---|---|
| [docs/01-arsitektur.md](docs/01-arsitektur.md) | Arsitektur, alur data, pemeriksaan antaragen |
| [docs/02-agen-dan-prompt.md](docs/02-agen-dan-prompt.md) | Peran tiap agen, alat, otonomi, delegasi |
| [docs/03-rubrik-dan-skor.md](docs/03-rubrik-dan-skor.md) | Rubrik, SAW, aturan gugur, kelas, skor dinamis, pembanding |
| [docs/04-api-dan-data.md](docs/04-api-dan-data.md) | Rute API, tabel basis data, bentuk data |
| [docs/05-keamanan.md](docs/05-keamanan.md) | Isian sampah, prompt injection, SSRF, admin |
| [docs/06-sumber-dan-rekomendasi-aksi.md](docs/06-sumber-dan-rekomendasi-aksi.md) | Tingkat sumber, rencana aksi, banding ide, ambil dokumen |
| [docs/07-pengujian-dan-bukti.md](docs/07-pengujian-dan-bukti.md) | Cara uji dan bukti |
| [docs/08-deploy-dan-operasional.md](docs/08-deploy-dan-operasional.md) | Deploy Vercel, admin, log |
| [docs/09-i18n-tema-dan-dasar-ilmiah.md](docs/09-i18n-tema-dan-dasar-ilmiah.md) | Bahasa, tema, dan rujukan ilmiah setiap fitur |
| [docs/A-teks-prompt-lengkap.md](docs/A-teks-prompt-lengkap.md) | Teks prompt lengkap (dibangkitkan dari kode) |
| [docs/B-rubrik-dari-kode.md](docs/B-rubrik-dari-kode.md) | Rubrik (dibangkitkan dari kode) |
| [docs/C-deklarasi-alat.md](docs/C-deklarasi-alat.md) | Deklarasi alat agen (dibangkitkan dari kode) |
| [docs/D-rute-api.md](docs/D-rute-api.md) | Kode sumber setiap rute API |
| [docs/E-bahasa-dan-kamus.md](docs/E-bahasa-dan-kamus.md) | Daftar bahasa dan kamus sumber |

## Batasan

- Hanya ide *fintech lending* berbasis rupiah di Indonesia pada tahap ide hingga MVP. Ide berbasis aset kripto, token, atau kontrak pintar dinyatakan Tidak Layak karena di luar kegiatan LPBBTI.
- Luaran adalah alat bantu keputusan, bukan nasihat investasi, nasihat hukum, atau penilaian kepatuhan resmi.
- Status izin OJK dipakai sebagai patokan pengganti kelayakan, sehingga hasil uji tidak bersifat mutlak.
- Terjemahan 18 bahasa selain Indonesia, English, Melayu, dan Jawa dibuat dengan mesin penerjemah; kunci yang hilang jatuh ke bahasa Indonesia.
