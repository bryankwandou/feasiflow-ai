# 06. Sumber, Rencana Aksi, Banding Ide, dan Ambil Dokumen

## 1. Tingkat sumber

Tingkat sumber ditetapkan oleh kode dari nama domain (`tingkatSumber` di `alat.ts`), bukan ditebak model.

| Tingkat | Jenis | Contoh | Boleh menjadi dasar angka |
|---|---|---|---|
| 1 | Resmi | OJK, BPS, Bank Indonesia, kementerian, pemerintah daerah, `.go.id`, peraturan | ya |
| 2 | Ilmiah dan lembaga internasional | jurnal ber-DOI, World Bank, IMF, ADB, OECD, CCAF | ya |
| 3 | Media arus utama | portal berita nasional | hanya keterangan, tanpa angka |
| 4 | Lainnya | blog, forum, siaran pers, repositori tanpa jurnal | tidak |

Sumber juga dibatasi umurnya. Laman yang terbit lebih dari 24 bulan sebelum tanggal analisis, atau yang tanggal terbitnya tidak diketahui, tidak boleh menjadi dasar angka pasar. Pengecualiannya adalah kutipan yang menyebut sendiri periode data dalam 24 bulan terakhir.

Jurnal dicari lewat OpenAlex (Priem dkk., 2022), yaitu indeks terbuka karya ilmiah yang dapat diakses tanpa biaya. Hasil yang tidak memiliki abstrak atau tidak terbit di jurnal disaring (`saringJurnal`).

## 2. Rencana aksi bersumber

Setelah kelas ditetapkan, sistem menyusun 3–7 butir rencana aksi dalam empat kategori:

| Kategori | Isi |
|---|---|
| `legal` | Langkah perizinan OJK dan bentuk badan hukum |
| `modal` | Kebutuhan modal disetor dan ekuitas |
| `risiko` | Risiko utama dan penanganannya |
| `pivot` | Arah perubahan bila ada indikator lemah |

Alurnya:

1. `sumberDariGudang` mengambil paling banyak 12 laman yang sudah dibaca agen, sumber resmi lebih dulu, lalu memberinya id `S1…S12`.
2. Teks setiap sumber dibungkus *spotlighting*, paling banyak 1.800 karakter per sumber.
3. Satu panggilan model menghasilkan JSON butir aksi. Setiap butir wajib berisi `sitasi: [{id, url}]`.
4. `validasiSitasi` membuang butir yang:
   - tidak memiliki sitasi;
   - mengutip id atau url yang tidak ada di daftar;
   - memuat angka yang tidak tertulis di sumber yang dikutip maupun di isian ide;
   - kategorinya tidak dikenal.
5. Bila butir yang lolos kurang dari 3, kode **tidak** menambah butir tanpa sumber, tetapi menulis catatan.

Dengan cara ini setiap rekomendasi dapat ditelusuri ke laman aslinya. Rencana aksi tampil di halaman hasil sebagai bagian 05c, dengan tautan ke setiap sumber.

## 3. Banding beberapa ide

Halaman `/banding` memeringkat 2–5 hasil analisis yang sudah ada dengan *Simple Additive Weighting*. Prosesnya deterministik dan tidak memanggil model.

1. Normalisasi maksimum untuk kriteria manfaat: F_ij = f_ij / maks_k f_kj. Bila semua ide bernilai 0 pada suatu indikator, F_ij = 0, karena indikator itu tidak membedakan ide.
2. V_i = Σ_j w_j · F_ij dengan bobot sama, ditampilkan pada skala 0–100.
3. Ide yang gugur (D3a = 0) selalu diletakkan di bawah ide yang tidak gugur, berapa pun nilai V-nya.
4. Bila seri, urutan ditentukan oleh S, lalu jumlah indikator bernilai 0 (yang lebih sedikit lebih baik), lalu urutan masukan.

Rujukan metode: MacCrimmon (1968), Hwang dan Yoon (1981), serta Wang dan Rangaiah (2025) subbab 8.2.

## 4. Ambil isian dari URL atau PDF pitch deck

Pengguna dapat mengisi formulir dari laman pitch atau PDF pitch deck.

1. Sumber divalidasi: skema, port, dan IP hasil resolusi DNS (lihat [05-keamanan.md](05-keamanan.md)).
2. Teks diambil. HTML dibersihkan dengan `extractMainText`, sedangkan PDF diekstrak dengan `unpdf` (paling besar 10 MB dan paling banyak 30 halaman).
3. Teks disaring dari instruksi tersisip.
4. Satu panggilan model dengan suhu 0 memetakan teks ke isian. Setiap isian wajib disertai kutipan persis 3–25 kata.
5. Kode memeriksa apakah kutipan itu benar-benar ada di teks. Isian tanpa kutipan yang cocok ditolak.
6. `periksaKode` membuang isian yang tergolong sampah.
7. Hasilnya hanya draf. Pengguna tetap meninjau dan mengirim formulir, sehingga pemeriksa isian lengkap tetap berjalan.

LinkedIn tidak didukung karena ketentuan layanannya melarang pengambilan data otomatis.
