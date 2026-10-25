#!/usr/bin/env bash
# Kompres semua foto di assets/photos supaya website cepat dibuka di HP.
# - Mengubah .jpeg/.png/.heic/.webp menjadi .jpg (nama file tetap, hanya ekstensi)
# - Memutar foto sesuai orientasi kamera, mengecilkan ke maks 1600px, kualitas 80
# - Menghapus metadata (lokasi GPS, info kamera)
#
# Pakai:  bash scripts/optimize-photos.sh
set -euo pipefail

cd "$(dirname "$0")/../assets/photos"
shopt -s nullglob nocaseglob

for f in *.jpeg *.png *.heic *.webp; do
  out="${f%.*}.jpg"
  out="${out,,}"
  echo "konversi  $f  ->  $out"
  magick "$f" -auto-orient "$out"
  rm -- "$f"
done

for f in *.jpg; do
  lower="${f,,}"
  [[ "$f" != "$lower" ]] && mv -- "$f" "$lower" && f="$lower"
  magick mogrify -auto-orient -resize '1600x1600>' -quality 80 -strip -interlace Plane "$f"
  printf 'ok        %-28s %s\n' "$f" "$(du -h "$f" | cut -f1)"
done
