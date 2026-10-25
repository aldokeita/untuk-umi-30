# Untuk Umi ♡

Website kejutan ulang tahun ke-30 untuk Umi, 26 Oktober 2026.

Link: https://aldokeita.github.io/untuk-umi-30/

## Cek tampilan sebelum hari H

| Link | Untuk apa |
|---|---|
| `…/untuk-umi-30/?preview=1` | Lewati hitung mundur, tampilkan nama slot foto yang belum diisi |
| `…/untuk-umi-30/?preview=1&skip=1` | Langsung ke halaman utama (tanpa amplop) |
| `…/untuk-umi-30/?now=2026-10-25T23:59:50%2B07:00` | Simulasi 10 detik sebelum tengah malam |

Link untuk Umi adalah link **tanpa** `?…` di belakangnya.

## Menambahkan foto

Taruh foto di `assets/photos/` dengan nama berikut (huruf kecil):

| File | Muncul di |
|---|---|
| `2020-menikah.jpg` | Timeline: Hari kita dimulai |
| `2020-tahun-pertama.jpg` | Timeline: Tahun pertama |
| `2021-muwsa.jpg` | Timeline: Umi menjadi ibu |
| `2022-keluarga.jpg` | Timeline: Belajar jadi orang tua |
| `2023-keluarga.jpg` | Timeline: Rumah yang makin hangat |
| `2024-aaron.jpg` | Timeline: Aaron Al Khalif hadir |
| `2025-berempat.jpg` | Timeline: Kita berempat |
| `2026-umi.jpg` | Timeline: Umi, tiga puluh |
| `galeri-01.jpg` … `galeri-12.jpg` | Galeri polaroid (yang tidak ada otomatis disembunyikan) |
| `muwsa.jpg`, `aaron.jpg` | Foto bulat di kartu pesan anak |

Lalu kecilkan ukurannya supaya cepat dibuka di HP (juga mengubah .png/.heic/.jpeg menjadi .jpg dan menghapus data lokasi GPS):

```bash
bash scripts/optimize-photos.sh
```

## Menambahkan lagu

Simpan lagu sebagai `assets/music/lagu.mp3`. Lagu mulai saat Umi membuka amplop. Kalau file tidak ada, tombol musik otomatis disembunyikan.

## Mengubah tulisan

Semua tulisan, tanggal, 30 hal, kupon, dan doa ada di `js/config.js`. Isi `whatsapp` dengan nomor Abi (format `62812…`) supaya tombol kupon dan "Balas pesan Abi" membuka WhatsApp.

## Publikasi ulang setelah mengubah sesuatu

```bash
git add -A && git commit -m "Tambah foto" && git push
```

GitHub Pages memperbarui situs dalam 1–2 menit.
