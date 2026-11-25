# 03. Rubrik, Skor, dan Kelas

Teks aturan setiap indikator yang dikirim ke agen ada di [A-teks-prompt-lengkap.md](A-teks-prompt-lengkap.md) (blok `ATURAN_RUBRIK`). Uraian singkat dan daftar pilihan formulir ada di [B-rubrik-dari-kode.md](B-rubrik-dari-kode.md).

## 1. Tiga dimensi, sepuluh indikator

| Dimensi | Indikator | Uraian | Penilai |
|---|---|---|---|
| D1 Pasar dan permintaan | D1a | Penyaluran LPBBTI di wilayah sasaran tumbuh dalam 3 tahun terakhir | kode (Statistik LPBBTI OJK) |
| | D1b | Ukuran segmen penerima dana tersedia dalam data resmi | A3, diperiksa kode |
| | D1c | Ada pembeda yang jelas dari penyelenggara berizin | A3, diperiksa kode |
| D2 Model bisnis dan keuangan | D2a | Lima blok inti BMC terisi tanpa saling bertentangan | A3 dari BMC A2 |
| | D2b | Ada arus pendapatan berulang | A3 dari isian |
| | D2c | Komponen biaya utama dapat ditutup oleh arus pendapatan | A3 dari isian dan proyeksi |
| | D2d | Rencana modal dan SDM memenuhi syarat POJK 40/2024 | kode |
| D3 Regulasi dan risiko | D3a | Model usaha termasuk kegiatan yang diizinkan peraturan | kode (aturan gugur) |
| | D3b | Risiko gagal bayar memiliki rencana penanganan | kode (jumlah unsur) |
| | D3c | Perlindungan data pengguna memiliki rencana penanganan | kode (jumlah unsur) |

Setiap indikator hanya boleh bernilai **100** (terpenuhi dan dasarnya dapat ditunjukkan), **50** (terpenuhi sebagian atau bukti terbatas), atau **0** (tidak terpenuhi).

## 2. Dasar setiap indikator

### D1a Pertumbuhan pasar wilayah

Pertumbuhan penyaluran LPBBTI rata-rata per tahun, Desember 2023 sampai Desember 2025, di provinsi sasaran dibandingkan dengan angka nasional. Datanya diambil dari Statistik LPBBTI OJK yang disimpan di `statistik-lpbbti.json`. Nilai 100 bila provinsi tumbuh sama dengan atau di atas angka nasional. Nilai 50 bila tumbuh tetapi di bawah angka nasional, atau bila wilayah dikenali tetapi data provinsinya tidak tersedia. Nilai 0 bila tidak tumbuh atau wilayah tidak dikenali. Angka nasional tidak dipakai sebagai pengganti data provinsi.

### D1b Ukuran segmen

Nilai 100 hanya bila ada sumber resmi tingkat 1 selain Statistik LPBBTI (BPS, kementerian, pemerintah daerah) yang terbit paling lama 24 bulan sebelum tanggal analisis dan menyebut jumlah segmen di wilayah sasaran. Angka itu harus dikutip.

### D1c Pembeda

Agen mengutip satu fitur pembeda dari ide, menyebut paling sedikit dua penyelenggara berizin sejenis dari Direktori OJK, lalu membandingkan fitur itu dengan laman produk keduanya. Klaim umum seperti "cepat", "mudah", atau "digital" hanya bernilai 50. Direktori OJK membuktikan siapa yang berizin, bukan fitur produknya.

### D2a sampai D2c

- **D2a** dinilai dari keselarasan lima blok inti BMC: segmen pelanggan, proposisi nilai, saluran, arus pendapatan, dan struktur biaya. Blok berasal `kosong` atau `turunan` dihitung tidak disebut ide.
- **D2b** bernilai 100 bila ide menyebut mekanisme pendapatan berulang secara tertulis.
- **D2c** bernilai 100 bila isian pendapatan dan biaya sama-sama memuat besaran dan proyeksi pendapatan bulanan melebihi biaya bulanan.

### D2d Modal dan SDM

Nilai 100 bila modal disetor yang direncanakan paling sedikit Rp25 miliar (Pasal 7 ayat 1 POJK 40/2024) dan rencana SDM memuat direksi (Pasal 196), tenaga ahli TI (Pasal 52), serta audit internal (Pasal 200). Nilai 50 bila hanya salah satu yang terpenuhi.

### D3a Kegiatan yang diizinkan (aturan gugur)

Nilai 0 bila ide memakai aset kripto, token, atau kontrak pintar, produknya bukan pendanaan bersama dalam rupiah, atau model usahanya tidak bermakna. Nilai 100 bila produknya pendanaan LPBBTI dengan bentuk hukum PT atau koperasi (Pasal 2). Nilai D3a = 0 langsung membuat kelas Tidak Layak berapa pun skor indikator lain; ini syarat non-kompensatori.

### D3b dan D3c Rencana penanganan

Kode menghitung unsur, yaitu tindakan berbeda yang disebut ide, misalnya penilaian kelayakan, penagihan, agunan, dan dana cadangan untuk gagal bayar, atau enkripsi, persetujuan, akses terbatas, dan kepatuhan UU PDP untuk data. Nilai 100 untuk dua unsur atau lebih, 50 untuk satu unsur, dan 0 bila tidak ada unsur. Kalimat penyangkalan seperti "tidak memakai enkripsi" bukan unsur.

## 3. Skor gabungan dan kelas

Skor gabungan memakai *Simple Additive Weighting* berbobot sama (Hwang dan Yoon, 1981):

```text
S = (s1 + s2 + ... + s10) / 10
```

Karena setiap indikator sudah berskala 0–100, normalisasi cukup dengan membagi 100. Kelas ditentukan di `kelas.ts`:

```ts
export const BATAS_LAYAK = 70;
export const BATAS_BERSYARAT = 50;
if (gugur) return "Tidak Layak";
return S >= 70 ? "Layak" : S >= 50 ? "Layak Bersyarat" : "Tidak Layak";
```

## 4. Skor tampilan 1–100 dan BEP

`dinamis.ts` menghitung skor tampilan yang lebih halus untuk dibaca pengguna. Contohnya, D1a dihitung dari besarnya selisih pertumbuhan provinsi terhadap nasional, dan D3b/D3c dari jumlah unsur rencana. Skor tampilan **tidak mengubah kelas**, karena kelas tetap dihitung dari skor diskret. BEP dihitung sebagai biaya awal dibagi selisih pendapatan dan biaya per bulan.

## 5. Konfigurasi pembanding dan uji

| Konfigurasi | Alat | Pembagian agen | Nilai kode |
|---|---|---|---|
| K1 | tidak | tidak | tidak |
| K2 | ya | tidak | tidak |
| K3 (FeasiFlow) | ya | ya | ya |

Ketiganya menerima rubrik yang kata demi kata sama. Ketepatan diukur terhadap status izin OJK dengan *macro F1-score*, dua konfigurasi dibandingkan dengan uji McNemar (versi binomial eksak bila b + c kecil), dan kesepakatan dengan pakar diukur dengan Cohen's *kappa*. Rubrik divalidasi dua pakar praktisi dengan I-CVI.

## 6. Analisis kepekaan

Ambang 70/50 diuji dengan menggeser kedua ambang dan dengan memperlakukan Layak Bersyarat sebagai kelas negatif. Dengan cara ini dapat dilihat apakah kesimpulan berubah bila ambang berubah.
