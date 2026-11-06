# Gorden Malang Management

Aplikasi operasional Gorden Malang untuk transaksi, keuangan, pelanggan, jadwal kerja, pengukuran, produksi, dan laporan. Web memakai Supabase untuk penyimpanan data. Proyek ini juga menyertakan pembungkus Android berbasis Capacitor.

## Menjalankan versi web

Buka folder ini di VS Code, jalankan **Live Server** pada `index.html`, lalu buka alamat lokal yang ditampilkan. Aplikasi memerlukan koneksi internet untuk Supabase dan pustaka yang dimuat dari CDN.

`config.js` berisi URL proyek dan Supabase Publishable key untuk aplikasi browser. Jangan menggantinya dengan `service_role` atau secret key; akses data tetap harus dilindungi oleh kebijakan RLS di Supabase.

## Membuat APK Android

Gunakan Node.js 22 atau lebih baru dan Android SDK API 36. Setelah tool Android tersedia, jalankan:

```powershell
npm install
npm run android:apk
```

APK yang bisa dipasang akan dibuat sebagai `Gorden-Malang.apk`. Panduan tambahan ada di [ANDROID_APP.md](ANDROID_APP.md). APK saat ini ditandatangani dengan debug key untuk pemasangan langsung; distribusi Play Store memerlukan release signing.

## Skrip database

Folder `database/` berisi SQL untuk fungsi dan skema Supabase. Tinjau setiap skrip sebelum menjalankannya di proyek Supabase.
