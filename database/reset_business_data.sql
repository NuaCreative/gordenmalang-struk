-- Reset data operasional aplikasi Gorden Malang.
-- Jalankan hanya jika memang ingin menghapus data bisnis yang tersimpan.
-- Profil/login, user_roles, dan daftar financial_accounts tetap dipertahankan.

BEGIN;

-- Hapus detail pengukuran sebelum data pengukuran utamanya.
DELETE FROM public.measurement_openings;
DELETE FROM public.measurement_rooms;
DELETE FROM public.measurements;

-- Hapus jadwal dan produksi sebelum pesanan/pelanggan.
DELETE FROM public.work_schedules;
DELETE FROM public.production_orders;

-- Hapus pembayaran dan rincian sebelum transaksi utama.
DELETE FROM public.payments;
DELETE FROM public.sale_items;
DELETE FROM public.sales;

-- Hapus data keuangan dan pelanggan.
DELETE FROM public.income_entries;
DELETE FROM public.expenses;
DELETE FROM public.customers;

-- Opsional: hilangkan saldo awal semua akun keuangan.
-- Hapus tanda komentar pada baris berikut hanya jika saldo awal juga ingin direset.
-- UPDATE public.financial_accounts SET opening_balance = 0;

COMMIT;
