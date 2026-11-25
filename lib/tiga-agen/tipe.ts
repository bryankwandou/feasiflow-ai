import type { Pakai } from "./gemini";
import type { Delegasi, Injeksi, Keputusan, Kritik, MetrikAgentik } from "./agentik";

/**
 * 17 isian formulir ide (Tabel 4 naskah, subbab 3.3.3). Lima wajib (produk, segmen, wilayah, pendapatan, deskripsi),
 * dua bawaan (jenis, tahap), sisanya opsional. Isian opsional ditulis opsional agar riwayat lama tetap terbaca.
 * Isian 15 memakai dua kunci (layanan, tempat) dan isian 17 memakai tiga kunci (proyeksi pendapatan, biaya, biaya awal).
 */
export interface Ide {
  produk: string;
  segmen: string;
  wilayah: string;
  saluran: string;
  pendapatan: string;
  deskripsi: string;
  /** Jenis pendanaan: Produktif atau Konsumtif. */
  jenis?: string;
  /** Tahap kesiapan: Ide, Prototipe, atau MVP. */
  tahap?: string;
  /** Biaya utama (dasar blok struktur biaya dan indikator D2c). */
  biaya?: string;
  /** Rencana penanganan gagal bayar (indikator D3b). */
  rencana_gagal_bayar?: string;
  /** Rencana perlindungan data pengguna (indikator D3c). */
  rencana_data?: string;
  /** 12. Bentuk badan hukum: PT atau Koperasi (D3a, POJK 40/2024 Pasal 2). */
  bentuk_hukum?: string;
  /** 13. Modal disetor yang direncanakan, dalam miliar rupiah (D2d, Pasal 7). */
  modal_disetor?: string;
  /** 14. Rencana SDM: direksi, tenaga ahli TI, audit internal (D2d, Pasal 52, 196, 200). */
  rencana_sdm?: string;
  /** 15. Layanan daring, luring, atau keduanya, beserta tempatnya (D1c, keterangan). */
  layanan?: string;
  tempat?: string;
  /** 16. Calon pelanggan awal (D1b). */
  calon_pelanggan?: string;
  /** 17. Proyeksi per bulan dan biaya awal, dalam juta rupiah (D2c dan BEP). */
  pendapatan_bulanan?: string;
  biaya_bulanan?: string;
  biaya_awal?: string;
}

export const JENIS_PENDANAAN = ["Produktif", "Konsumtif"] as const;
export const TAHAP_KESIAPAN = ["Ide", "Prototipe", "MVP"] as const;
export const BENTUK_HUKUM = ["PT", "Koperasi"] as const;
export const LAYANAN = ["Daring", "Luring", "Keduanya"] as const;
/** Tiga syarat SDM POJK 40/2024 yang dinilai pada D2d. */
export const SYARAT_SDM = [
  "Direksi sekurang-kurangnya 2 orang berpengalaman",
  "Tenaga ahli TI berpengalaman sekurang-kurangnya 3 tahun",
  "Fungsi audit internal",
] as const;

export const RUBRIK = ["D1a", "D1b", "D1c", "D2a", "D2b", "D2c", "D2d", "D3a", "D3b", "D3c"] as const;
export type Indikator = (typeof RUBRIK)[number];

export const URAIAN_RUBRIK: Record<Indikator, string> = {
  D1a: "Penyaluran LPBBTI di wilayah sasaran tumbuh dalam 3 tahun terakhir",
  D1b: "Ukuran segmen penerima dana tersedia dalam data resmi",
  D1c: "Ada pembeda yang jelas dari penyelenggara berizin",
  D2a: "5 blok inti BMC terisi tanpa saling bertentangan",
  D2b: "Ada arus pendapatan berulang",
  D2c: "Komponen biaya utama dapat ditutup oleh arus pendapatan",
  D2d: "Rencana modal dan SDM memenuhi syarat POJK 40/2024",
  D3a: "Model usaha termasuk kegiatan yang diizinkan peraturan",
  D3b: "Risiko gagal bayar memiliki rencana penanganan",
  D3c: "Perlindungan data pengguna memiliki rencana penanganan",
};

export const BLOK_BMC = [
  "segmen_pelanggan",
  "proposisi_nilai",
  "saluran",
  "hubungan_pelanggan",
  "arus_pendapatan",
  "sumber_daya_utama",
  "aktivitas_utama",
  "kemitraan_utama",
  "struktur_biaya",
] as const;

/** Lima blok inti BMC yang menjadi dasar D2a. */
export const BLOK_INTI = ["segmen_pelanggan", "proposisi_nilai", "saluran", "arus_pendapatan", "struktur_biaya"] as const;
/** Ambang modal disetor (miliar rupiah) POJK 40/2024 Pasal 7; sama dengan MODAL_MINIMUM_MILIAR di dinamis.ts. */
export const AMBANG_MODAL_MILIAR = 25;

/** Skala dan aturan rubrik: satu sumber kebenaran, dikirim kata demi kata sama ke K1, K2, dan K3. */
export const SKALA =
  "Setiap indikator hanya boleh bernilai 100, 50, atau 0. 100 = terpenuhi dan dasarnya dapat ditunjukkan. 50 = terpenuhi sebagian, atau dasarnya terbatas (bukti terbatas). 0 = tidak terpenuhi menurut aturan indikator.";

export const ATURAN_RUBRIK = [
  "D1a Pertumbuhan pasar wilayah. Dasar: pertumbuhan penyaluran LPBBTI rata-rata per tahun, Desember 2023 sampai Desember 2025, provinsi sasaran dibanding angka nasional (Statistik LPBBTI OJK). 100 = provinsi tumbuh sama dengan atau di atas angka nasional. 50 = tumbuh tetapi di bawah angka nasional, atau wilayah dikenali tetapi data provinsinya tidak tersedia (angka nasional tidak dipakai sebagai pengganti). 0 = tidak tumbuh, atau wilayah tidak dikenali.",
  "D1b Ukuran segmen penerima dana dalam data resmi. 100 = ada sumber resmi tingkat 1 selain Statistik LPBBTI (BPS, kementerian, pemerintah daerah), terbit paling lama 24 bulan sebelum TANGGAL ANALISIS, yang menyebut jumlah segmen penerima dana di wilayah sasaran; kutip angkanya. 50 = hanya ada data wilayah (misalnya rekening penerima dana LPBBTI), sumber segmen tanpa tanggal atau lebih dari 24 bulan, atau hanya isian calon_pelanggan. 0 = tidak ada data segmen maupun data wilayah.",
  "D1c Pembeda dari penyelenggara berizin. Langkah: (1) kutip satu fitur pembeda dari ide; (2) sebut paling sedikit 2 penyelenggara berizin sejenis yang namanya ada pada Direktori OJK; (3) bandingkan fitur itu dengan laman produk kedua penyelenggara tersebut. 100 = fitur itu spesifik dan tidak disebut pada laman produk kedua pembanding. 50 = pembanding kurang dari 2, laman produk pembanding tidak tersedia, atau pembeda berupa klaim umum (cepat, mudah, digital, berbasis aplikasi). 0 = fitur itu sudah ditawarkan salah satu pembanding. Direktori OJK hanya membuktikan siapa yang berizin, bukan fitur produknya; Direktori dan laman milik pemohon tidak boleh menjadi dasar skor 100.",
  "D2a Keselarasan 5 blok inti BMC (" + BLOK_INTI.join(", ") + "). Cari pertentangan antarblok, misalnya saluran tidak menjangkau segmen, pendapatan berasal dari pihak di luar segmen, atau struktur_biaya tidak memuat biaya yang disebut ide. 100 = kelima blok inti bersumber dari ide dan tidak ada pertentangan. 50 = ada satu pertentangan, atau 1 sampai 2 blok inti tidak disebut ide (hanya turunan atau kosong). 0 = ada dua pertentangan atau lebih, atau 3 blok inti atau lebih tidak disebut ide. Pada bukti, sebut pasangan blok yang dibandingkan, atau tulis 'tidak ada pertentangan'.",
  "D2b Pendapatan berulang, dinilai hanya dari isian pendapatan dan deskripsi ide. 100 = ide menyebut mekanisme berulang secara tertulis: bunga atau bagi hasil per cicilan, biaya langganan, atau pinjaman ulang atau plafon bertahap. 50 = pendapatan hanya berupa biaya sekali per transaksi, atau keberulangannya tidak disebut. 0 = ide tidak menyebut sumber pendapatan. Kutip kata pada ide yang menjadi dasar.",
  "D2c Biaya utama tertutup pendapatan. 100 = isian pendapatan dan isian biaya sama-sama memuat besaran (persen atau rupiah) dan, bila pendapatan_bulanan dan biaya_bulanan diisi, pendapatan lebih besar dari biaya. 50 = salah satu isian tanpa besaran, atau proyeksi pendapatan belum menutup biaya. 0 = ide tidak menyebut sumber pendapatan.",
  "D2d Modal dan SDM menurut POJK 40/2024. 100 = modal_disetor sekurang-kurangnya Rp" + AMBANG_MODAL_MILIAR + " miliar dan rencana_sdm memuat direksi, tenaga ahli TI, dan audit internal. 50 = hanya salah satu yang memenuhi, atau isiannya kosong. 0 = keduanya tidak memenuhi.",
  "D3a Kegiatan yang diizinkan. 0 = ide memakai aset kripto, token, atau kontrak pintar, produknya bukan pendanaan bersama dalam rupiah, atau model usahanya tidak bermakna atau tidak terklasifikasi. 100 = produk pendanaan LPBBTI dengan bentuk_hukum PT atau koperasi. 50 = produk pendanaan LPBBTI, tetapi bentuk_hukum belum disebut atau bukan PT/koperasi.",
  "D3b Rencana penanganan gagal bayar. D3c Rencana perlindungan data pengguna. Satu unsur = satu tindakan berbeda yang disebut ide (misalnya penilaian kelayakan, penagihan, agunan, dana cadangan; atau enkripsi, persetujuan pengguna, akses terbatas, kepatuhan UU PDP). 100 = rencana memuat 2 tindakan atau lebih. 50 = rencana memuat 1 tindakan. 0 = ide tidak memiliki rencana (rencana tanpa tindakan yang jelas dihitung 0). Kalimat penyangkalan, misalnya 'tidak memakai enkripsi' atau 'tanpa persetujuan', bukan unsur.",
].join("\n");

export interface SkorIndikator {
  skor: 0 | 50 | 100;
  bukti: string;
  sumber: string;
}

export interface Bukti {
  alamat: string;
  judul: string;
  jalur: "http" | "playwright" | "url_context" | "berkas";
  /** Skala 4 (sejak 19 November 2026): 1 resmi, 2 ilmiah, 3 media, 4 lainnya. Riwayat lama tanpa skala: 1 resmi, 2 media, 3 lainnya. */
  tingkat: 1 | 2 | 3 | 4;
  skala?: 4;
  kata: number;
  /** Tanggal terbit laman (TTTT-BB), bila dapat dikenali. */
  terbit?: string;
  /** Benar bila terbit lebih dari 24 bulan sebelum analisis. */
  kedaluwarsa?: boolean;
}

export interface Jejak {
  agen: string;
  alat: string;
  argumen: string;
  ringkas: string;
}

export interface Pemeriksaan {
  fase: string;
  percobaan: number;
  lolos: boolean;
  catatan: string[];
}

/** Satu masalah isian dari agen pemeriksa isian. "tolak" memicu tanya balik, "peringatan" hanya dicatat. */
export interface MasalahIsian {
  isian: string;
  alasan: string;
  jenis: "tolak" | "peringatan";
  /** Teks sampah: tetap ditolak berapa pun putarannya. */
  sampah?: boolean;
}

export interface PertanyaanIsian {
  isian: string;
  pertanyaan: string;
}

/** Catatan pemeriksaan isian yang ikut tersimpan pada hasil, untuk menghitung penolakan keliru saat uji. */
export interface CatatanPemeriksaanIsian {
  putaran: number;
  masalah: MasalahIsian[];
  pertanyaan: PertanyaanIsian[];
  ditandaiTerbatas: string[];
  /** Catatan proses, misalnya panggilan agen gagal sehingga hanya lapis kode yang dipakai. */
  catatan?: string[];
}

export interface HasilAnalisis {
  /** Rencana aksi bersumber (legal, modal, risiko, pivot); setiap butir bersitasi ke bukti yang dibaca. */
  rencana_aksi?: import("./rekomendasi").RencanaAksi;
  /** Hasil agen pemeriksa isian sebelum analisis. Tidak ada pada riwayat lama. */
  periksa_isian?: CatatanPemeriksaanIsian;
  /** Prompt v2: jejak keputusan tiap giliran agen, delegasi balik, pola instruksi pada data, metrik agentic, dan kritik A3. Tidak ada pada riwayat lama. */
  keputusan?: Keputusan[];
  delegasi?: Delegasi[];
  injeksi?: Injeksi[];
  metrik_agentik?: MetrikAgentik;
  kritik?: Kritik;
  /** Versi prompt (v2) dan sha256 tiap PERAN. */
  versi_prompt?: { versi: string; sha256: Record<string, string>; build: string };
  penolakan_per_kategori?: Record<string, number>;
  /** Asal tiap blok BMC menurut A2: ide, turunan, atau kosong. */
  bmc_asal?: Record<string, "ide" | "turunan" | "kosong">;
  /** Skor K3 sebelum putaran "A3 ulang" (riset ulang otomatis). */
  skor_sebelum_ulang?: Record<string, number>;
  /** Pemeriksaan angka pada bukti A3 (dicatat, tidak mengubah skor). */
  angka_bukti_a3?: { diperiksa: string[]; hilang: string[] };
  session_id: string;
  ide: Ide;
  riset: string;
  bukti: Bukti[];
  bmc: Record<string, string>;
  risiko: { risiko: string; penanganan: string }[];
  /** Riwayat lama (sebelum 19 November 2026) hanya memuat 9 indikator, tanpa D2d. */
  skor: Record<Indikator, SkorIndikator>;
  dimensi: { D1: number; D2: number; D3: number };
  S: number;
  kelas: "Layak" | "Layak Bersyarat" | "Tidak Layak";
  aturan_gugur: boolean;
  pemeriksaan: Pemeriksaan[];
  jejak: Jejak[];
  angka_diperiksa: number;
  angka_tanpa_bukti: string[];
  pakai: Record<string, Pakai>;
  hitung: Record<string, number>;
  /** Skor tampilan 1-100 (skor dinamis v2). Tidak ada pada riwayat lama. Kelas tetap dari skor diskret. */
  dinamis?: { indikator: Partial<Record<Indikator, number>>; S: number; S_diskret: number; berinformasi: Indikator[] };
  /** Titik impas dalam bulan bila proyeksi diisi. */
  bep_bulan?: number | null;
  detik: number;
  model: Record<string, string>;
}

export type Kirim = (ev: Record<string, unknown>) => void;
