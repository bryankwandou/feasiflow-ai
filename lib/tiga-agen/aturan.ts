// Aturan gugur D3a, dipakai bersama oleh pipeline dan pemeriksa isian agar keduanya tidak berbeda.

/** Kegiatan di luar LPBBTI (POJK Nomor 40 Tahun 2024): aset kripto dan kontrak pintar diatur terpisah. */
export const LUAR_LPBBTI = /kripto|crypto|\bdefi\b|\btoken\b|smart contract|kontrak pintar|blockchain|aset digital|tanpa rupiah/i;
/** Produk keuangan lain yang punya rezim izin sendiri (bukan pendanaan bersama). */
export const LUAR_PRODUK = /gadai|urun dana|saham|reksa ?dana|polis|asuransi digital|dompet digital|e-?wallet/i;
/** Produk berbentuk pendanaan atau pinjaman, yaitu kegiatan LPBBTI. */
export const PRODUK_PENDANAAN = /pinjam|pendanaan|pembiayaan|kredit|talangan|modal|paylater|cicil|invoice|anjak piutang|dana/i;
