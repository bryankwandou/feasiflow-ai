// Kamus kecil untuk pemeriksa isian deterministik (tanpa LLM): kata dasar umum bahasa Indonesia (KBBI dasar),
// kata Inggris umum di bidang fintech, dan daftar wilayah Indonesia (38 provinsi, alias, dan kota/kabupaten utama).

const DASAR_ID = `
ada adat agen agar agunan air ajar akad akan akses akun akhir aktif alat alam alamat alih aman ambil anak angkut angsur anggota antar anjak apa aplikasi
asal asuransi atas atur awal bagi bahan baik baju banding bangun bank bantu banyak barang baru batas bayar bebas beda beli belum benih bentuk berat besar
biasa biaya bidang bijak bina bisa bisnis bonus buat budaya buka bukti bulan bunga buruh butik buah buku cabang cadang cair calon cara catat cepat cicil
cipta coba contoh cukup daerah dagang dalam dana dapat darat data datang daring dasar daya desa dengan depan diri dokter dompet dua dukung edukasi ekonomi
ekspor emas enkripsi gadai gaji ganti garam gerai gerak guna gudang guru hak hal hama hari harga harian hasil hidup hubung hutang ibu ikan ikut impor
industri informasi ini inti investasi isi izin jadi jalan jamin jangka jasa jaga jahit jalur jaring jual jumlah juta kain kampus kantor kapal karya kasir
kebun kecil kedai kelola kelompok keluarga kembang kemitraan kerja kerajinan kios kirim kita kode komisi komunitas konsumen kontrak koperasi kota kredit
kualitas kuliah kumpul kurang laba lahan lain laku lalu lama laman langsung lapang laut layan layanan lebih lembaga lengkap lepas lewat lindung lokal
luas luring macet madrasah makan maksimal malam mandiri masa masuk masyarakat mau melalui menengah merek miliar milik minat minggu minimal mitra modal
model motor mudah muda mulai murah musim nasabah nelayan nilai nominal nomor obat olah online orang pabrik pada padi pajak pakai pakan paket palawija
panen pangan panjang pasar pasang pasti peduli pegawai pekerja pelajar pemerintah penuh perahu perajin peran perempuan perlu persen pertanian peternak
petani piutang pihak pilih pinjam pintar platform plafon pokok pondok potong produk produksi profesi program proyek pulau pupuk pusat putus rakyat
ramah rancang rantai rata rawat rekening rendah rencana restoran retensi riwayat rumah rupiah saat sajian saja salur sama sampai sasar satu sawah
sayur sebar sedang segmen sehat sekolah selesai semua sendiri seni sepeda sesuai setor sewa siap simpan sistem skor sosial staf suku sumber surat swasta
syariah tagih tahun tahap tambak tambah tanam tanah tangan tangkap tanggung tani tanpa tarif tawar teknologi tempat tempo tenaga tenor tenun terima
tertentu tetap tiap tidak tim tindak tingkat tinggi titik toko tradisional transaksi transportasi tujuan tumbuh tunai turun uang ulang umum unit untuk
untung usaha utama utang wajib waktu wanita warga warung wilayah wisata yang yayasan
dan di ke dari atau oleh per serta juga para kami kamu mereka hingga sebagai secara tersebut itu bila jika supaya karena namun sudah telah setiap
`;

const DASAR_EN = `
app business credit customer data digital farmer fee fintech fund funding growth income interest invoice lending loan market merchant micro micro-loan
mobile online paylater payment peer platform retail revenue risk saas scoring service small startup student supply chain trade user wallet working capital
`;

export const KATA_DIKENAL = new Set((DASAR_ID + " " + DASAR_EN).split(/\s+/).filter(Boolean));

const AWALAN = /^(meng|meny|mem|men|me|peng|peny|pem|pen|pe|per|ber|be|di|ke|se|ter)/;
const AKHIRAN = /(kan|an|i|nya|lah|kah)$/;

/** Kata dikenal bila ada di kamus, atau kata dasarnya ada setelah awalan dan akhiran umum dibuang. */
export function kataDikenal(w: string): boolean {
  const k = w.toLowerCase().replace(/[^a-z-]/g, "");
  if (k.length < 2) return false;
  if (KATA_DIKENAL.has(k)) return true;
  if (k.includes("-")) return k.split("-").some(kataDikenal);
  const tanpaAkhir = k.replace(AKHIRAN, "");
  const kandidat = [tanpaAkhir, k.replace(AWALAN, ""), tanpaAkhir.replace(AWALAN, "")];
  for (const c of kandidat) {
    if (KATA_DIKENAL.has(c)) return true;
    // Peluluhan: m/n/ng/ny + vokal (misalnya "menagih" -> "tagih", "pemasaran" -> "pasar").
    for (const a of ["t", "p", "k", "s"]) if (c.length >= 3 && KATA_DIKENAL.has(a + c)) return true;
  }
  return false;
}

export const PROVINSI = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu", "Lampung",
  "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah",
  "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara", "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Barat Daya", "Papua Selatan",
  "Papua Tengah", "Papua Pegunungan",
];

const ALIAS = [
  "indonesia", "nasional", "seluruh indonesia", "jakarta", "jabodetabek", "yogyakarta", "jogja", "diy", "ntb", "ntt", "sumatra", "sumatera", "jawa",
  "kalimantan", "sulawesi", "babel", "bangka", "belitung", "kepri", "sumut", "sumbar", "sumsel", "jabar", "jateng", "jatim", "kaltim", "kalbar", "kalsel",
  "kalteng", "kaltara", "sulsel", "sulut", "sulteng", "sultra", "sulbar", "malut", "indonesia timur", "indonesia barat",
];

const KOTA = `
medan binjai pematangsiantar padang bukittinggi pekanbaru dumai batam tanjungpinang jambi palembang prabumulih lubuklinggau pangkalpinang bengkulu
bandar lampung metro serang tangerang cilegon bogor depok bekasi bandung cimahi sukabumi cirebon tasikmalaya garut karawang purwakarta subang indramayu
semarang solo surakarta magelang salatiga pekalongan tegal kudus jepara klaten boyolali sukoharjo wonogiri purwokerto banyumas cilacap kebumen
sleman bantul gunungkidul kulon progo surabaya malang batu kediri blitar madiun mojokerto pasuruan probolinggo jember banyuwangi sidoarjo gresik lamongan
tuban bojonegoro ponorogo tulungagung denpasar badung gianyar tabanan buleleng mataram bima sumbawa lombok kupang ende maumere sumba flores labuan bajo
pontianak singkawang palangkaraya banjarmasin banjarbaru balikpapan samarinda bontang tarakan manado bitung tomohon gorontalo palu makassar parepare
palopo gowa maros bone kendari baubau mamuju ambon tual ternate tidore jayapura merauke sorong manokwari timika nabire wamena banda aceh lhokseumawe
langsa sabang
`.trim().split(/\s+/);

/** Wilayah dikenal bila memuat nama provinsi, alias, kota/kabupaten utama, atau berbentuk "Kabupaten/Kota <nama wajar>". */
export function wilayahDikenal(w: string): boolean {
  const t = " " + String(w || "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim() + " ";
  if (t.trim().length < 3) return false;
  if (PROVINSI.some((p) => t.includes(" " + p.toLowerCase() + " "))) return true;
  if (ALIAS.some((p) => t.includes(" " + p + " "))) return true;
  if (KOTA.some((p) => t.includes(" " + p + " "))) return true;
  const m = /\b(kabupaten|kab|kota|provinsi|kecamatan|desa)\s+([a-z]{3,}(?:\s[a-z]{3,})?)/.exec(t);
  if (m) {
    const n = m[2].replace(/\s/g, "");
    const vokal = (n.match(/[aiueo]/g) || []).length / n.length;
    return vokal >= 0.3 && !/(.)\1{2,}/.test(n);
  }
  return false;
}
