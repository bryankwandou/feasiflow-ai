# Lampiran C. Deklarasi Alat Agen (function calling)

Dibangkitkan otomatis dari `DEKLARASI` di `lib/tiga-agen/alat.ts`. Model memilih alat; kode yang menjalankannya dan memeriksa hasilnya.

## `cari_web`

```json
{
  "name": "cari_web",
  "description": "Mencari tautan di web. Mengembalikan judul, alamat, dan tingkat sumber (1 resmi, 2 ilmiah atau lembaga internasional, 3 media arus utama yang hanya menjadi keterangan, 4 lainnya yang tidak digunakan), bukan isi laman. Paling banyak 4 kueri untuk seluruh riset, termasuk cari_jurnal.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "daftar_kueri": {
        "type": "ARRAY",
        "items": {
          "type": "STRING"
        },
        "description": "satu sampai empat kueri pencarian"
      }
    },
    "required": [
      "daftar_kueri"
    ]
  }
}
```

## `cari_jurnal`

```json
{
  "name": "cari_jurnal",
  "description": "Mencari artikel jurnal lewat OpenAlex dengan penyaring judul dan abstrak, terbit sejak 2023, dan sumber berupa jurnal. Hanya artikel yang memiliki nama jurnal dan DOI yang dikembalikan; abstraknya langsung tersimpan sebagai bukti tingkat 2. Memakai jatah kueri yang sama dengan cari_web.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "daftar_kueri": {
        "type": "ARRAY",
        "items": {
          "type": "STRING"
        },
        "description": "satu atau dua kueri dalam bahasa Inggris, misalnya 'peer-to-peer lending Indonesia'"
      }
    },
    "required": [
      "daftar_kueri"
    ]
  }
}
```

## `baca_laman`

```json
{
  "name": "baca_laman",
  "description": "Mengambil isi penuh beberapa laman sekaligus dan menyimpannya sebagai bukti. Mengembalikan kutipan yang relevan dari tiap laman.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "daftar_alamat": {
        "type": "ARRAY",
        "items": {
          "type": "STRING"
        },
        "description": "satu sampai enam alamat laman dari hasil cari_web"
      }
    },
    "required": [
      "daftar_alamat"
    ]
  }
}
```

## `cek_direktori_ojk`

```json
{
  "name": "cek_direktori_ojk",
  "description": "Mencari kata pada Direktori resmi penyelenggara LPBBTI berizin OJK (edisi Maret 2026). Mengembalikan jumlah penyelenggara berizin dan baris yang cocok.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "daftar_kata": {
        "type": "ARRAY",
        "items": {
          "type": "STRING"
        },
        "description": "nama penyelenggara atau kata yang dicari, misalnya 'syariah' atau 'modal'"
      }
    },
    "required": [
      "daftar_kata"
    ]
  }
}
```

## `cek_statistik_ojk`

```json
{
  "name": "cek_statistik_ojk",
  "description": "Membaca Statistik LPBBTI resmi OJK (edisi Desember 2023 sampai Desember 2025) untuk satu provinsi: penyaluran pinjaman per tahun dan outstanding akhir tahun. Wajib dipanggil untuk provinsi wilayah sasaran ide.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "daftar_wilayah": {
        "type": "ARRAY",
        "items": {
          "type": "STRING"
        },
        "description": "nama provinsi wilayah sasaran, misalnya 'Sulawesi Selatan'; pakai 'Indonesia' bila sasarannya nasional"
      }
    },
    "required": [
      "daftar_wilayah"
    ]
  }
}
```

## `lihat_bukti`

```json
{
  "name": "lihat_bukti",
  "description": "Mencari kutipan pada teks utuh bukti yang sudah dikumpulkan agen riset.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "daftar_kata_kunci": {
        "type": "ARRAY",
        "items": {
          "type": "STRING"
        },
        "description": "satu sampai lima kata kunci"
      }
    },
    "required": [
      "daftar_kata_kunci"
    ]
  }
}
```

## `minta_riset`

```json
{
  "name": "minta_riset",
  "description": "Meminta agen riset mencari bukti tambahan bila bukti yang ada belum cukup. Hanya 1 kali.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "pertanyaan": {
        "type": "STRING",
        "description": "hal yang perlu dicari"
      }
    },
    "required": [
      "pertanyaan"
    ]
  }
}
```

## `minta_revisi_analisis`

```json
{
  "name": "minta_revisi_analisis",
  "description": "Mengirim agen analisis (A2) kembali bekerja dengan catatanmu bila BMC atau daftar risiko keliru, bertentangan, atau kurang. Hasil revisi menggantikan BMC dan risiko, lalu kamu menilai ulang. Hanya 1 kali.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "pertanyaan": {
        "type": "STRING",
        "description": "catatan atau pertanyaan untuk agen analisis: blok atau risiko mana yang harus diperbaiki dan mengapa"
      }
    },
    "required": [
      "pertanyaan"
    ]
  }
}
```

