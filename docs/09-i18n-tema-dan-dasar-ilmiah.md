# 09. Bahasa, Tema, dan Dasar Ilmiah Setiap Fitur

## 1. Multibahasa (22 bahasa)

Antarmuka tersedia dalam bahasa Indonesia, English, dan 20 bahasa lain: Melayu, Jawa, Sunda, Tionghoa (Sederhana), Jepang, Korea, Arab, Hindi, Thai, Vietnam, Filipino, Spanyol, Prancis, Jerman, Portugis, Rusia, Italia, Belanda, Turki, dan Bengali. Daftar lengkap beserta jumlah kunci per bahasa ada di [E-bahasa-dan-kamus.md](E-bahasa-dan-kamus.md).

Cara kerjanya:

- Kamus statis per bahasa ada di `lib/i18n/kamus/<kode>.ts`. Bahasa Indonesia adalah sumber dan cadangan untuk setiap kunci yang hilang.
- Kamus selain bahasa Indonesia dimuat saat dibutuhkan (*dynamic import*), sehingga ukuran muat awal tetap kecil.
- Bahasa dipilih dengan urutan: pilihan tersimpan di `localStorage`, lalu `navigator.languages`, lalu bahasa Indonesia. Tag BCP 47 dicocokkan ke kode yang didukung, misalnya `fil` → `tl` dan `in` → `id`.
- Atribut `lang` dan `dir` pada `<html>` diganti sesuai bahasa. Bahasa Arab memakai arah `rtl`.
- `KendaliTampilan` mengganti teks halaman yang sama persis dengan nilai kamus Indonesia menjadi nilai kamus bahasa terpilih, termasuk atribut `placeholder`, `title`, dan `aria-label`. Teks aslinya disimpan sehingga dapat dikembalikan. `MutationObserver` menerapkan terjemahan juga pada konten yang muncul belakangan.
- Pemilih bahasa memakai `<select>` bawaan agar dapat dipakai dengan papan ketik dan pembaca layar. Nama setiap bahasa ditulis dalam bahasanya sendiri dengan atribut `lang`.

Kamus Indonesia, English, Melayu, dan Jawa ditulis tangan. Kamus 18 bahasa lain diterjemahkan mesin dari English dengan placeholder `{nama}` dilindungi. Teks laporan dari agen (riset, BMC, kritik) tetap berbahasa Indonesia karena sumbernya peraturan dan data Indonesia.

## 2. Tema terang dan gelap

- Token warna ditulis sebagai kanal RGB di `app/tema.css`, untuk `:root` (terang) dan `[data-theme="dark"]` (gelap).
- Skrip kecil di `<head>` (`SKRIP_TEMA_AWAL`) menentukan tema sebelum halaman dilukis, sehingga tidak ada kedip warna. Urutannya: pilihan tersimpan, lalu `prefers-color-scheme` sistem.
- Tombol `ToggleTema` memakai label tetap "Mode gelap" dengan `aria-pressed`, mengikuti pola tombol *toggle* WAI-ARIA APG. Pilihan diselaraskan antartab lewat peristiwa `storage`.
- Rasio kontras dihitung dengan rumus WCAG 2.2. Semua teks biasa memenuhi AA (≥ 4,5:1), sedangkan komponen non-teks ≥ 3:1. Tabel rasio ada di kepala berkas `tema.css`.

## 3. Dasar ilmiah setiap fitur

| Fitur | Dasar | Rujukan |
|---|---|---|
| Agen bernalar dan bertindak | Pola ReAct menyelang penalaran dengan pemanggilan alat | Yao dkk. (2023), ICLR |
| Agen dengan perencanaan, alat, memori | Survei agen otonom berbasis LLM | Wang dkk. (2024), *Frontiers of Computer Science* |
| Sistem multiagen | Pembagian peran antaragen | Guo dkk. (2024), IJCAI; Hong dkk. (2024), ICLR; Wu dkk. (2024) |
| Pemeriksaan antaragen | Kegagalan multiagen dari spesifikasi kabur dan verifikasi lemah | Cemri dkk. (2025), arXiv:2503.13657 |
| Refleksi dan perbaikan setelah ditolak | Agen memperbaiki diri dari umpan balik | Shinn dkk. (2023), NeurIPS |
| Gate kode di antara langkah | Pola *prompt chaining* dengan pemeriksaan terprogram | Schluntz dan Zhang (2024), Anthropic |
| Business Model Canvas | Sembilan blok model bisnis | Anita dkk. (2024) |
| Riset pasar sekunder | Pengumpulan dan analisis data sekunder | Hajari dkk. (2024) |
| Pencarian jurnal | Indeks terbuka karya ilmiah | Priem dkk. (2022), OpenAlex |
| SAW dan bobot sama | Penjumlahan berbobot nilai ternormalisasi | Hwang dan Yoon (1981); MacCrimmon (1968) |
| Aturan gugur | Syarat non-kompensatori di atas SAW | Hwang dan Yoon (1981) |
| Ukuran evaluasi | Akurasi, presisi, recall, F1 | Opitz (2024) |
| Uji beda konfigurasi | Uji McNemar untuk data berpasangan | McNemar (1947) |
| Kesepakatan dengan pakar | Cohen's kappa | Cohen (1960) |
| Validitas isi rubrik | I-CVI | Lynn (1986) |
| Kemudahan penggunaan | System Usability Scale, rerata 68 | Deshmukh dan Chalmeta (2024) |
| Prompt injection tidak langsung | Instruksi disisipkan di data yang diambil aplikasi | Greshake dkk. (2023), AISec, arXiv:2302.12173 |
| Spotlighting | Delimiting dan datamarking dengan penanda acak | Hines dkk. (2024), arXiv:2403.14720 |
| Pertahanan berlapis | Tidak ada satu pertahanan yang cukup | Liu dkk. (2024), USENIX Security, arXiv:2310.12815 |
| Kebijakan konten eksternal | Pisahkan dan tandai konten eksternal | OWASP Top 10 for LLM Applications 2025, LLM01 |
| Pencegahan SSRF | Validasi IP hasil DNS, matikan pengalihan | OWASP SSRF Prevention Cheat Sheet; OWASP Top 10:2021 A10 |
| Peraturan LPBBTI | Syarat badan hukum, modal, SDM, audit | POJK Nomor 40 Tahun 2024 |
| Kontras warna | Rasio kontras minimum | W3C WCAG 2.2 |
| Tombol toggle yang aksesibel | Label tetap dengan `aria-pressed` | W3C WAI-ARIA Authoring Practices Guide |
