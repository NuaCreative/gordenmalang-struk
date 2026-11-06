-- Hapus permanen transaksi dan data lain yang sudah dibatalkan.
-- Jalankan sekali melalui Supabase Dashboard > SQL Editor.
-- RPC ini hanya dapat dipanggil oleh pengguna ber-role owner.

CREATE OR REPLACE FUNCTION public.delete_gm_cancelled_sale(
    p_sale_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sale public.sales%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sesi login tidak valid.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role::text = 'owner'
    ) THEN
        RAISE EXCEPTION 'Hanya owner yang dapat menghapus transaksi secara permanen.'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_sale
    FROM public.sales
    WHERE id = p_sale_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaksi tidak ditemukan.';
    END IF;

    IF v_sale.cancelled_at IS NULL THEN
        RAISE EXCEPTION 'Hanya transaksi yang sudah dibatalkan yang dapat dihapus.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.production_orders
        WHERE sale_id = p_sale_id
          AND status IS DISTINCT FROM 'cancelled'
    ) THEN
        RAISE EXCEPTION 'Transaksi masih memiliki data produksi yang belum dibatalkan. Batalkan atau hapus data produksi itu terlebih dahulu.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.work_schedules
        WHERE sale_id = p_sale_id
          AND status IS DISTINCT FROM 'cancelled'
    ) THEN
        RAISE EXCEPTION 'Transaksi masih memiliki jadwal yang belum dibatalkan. Batalkan atau hapus jadwal itu terlebih dahulu.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.measurements m
        JOIN public.work_schedules ws ON ws.id = m.schedule_id
        WHERE ws.sale_id = p_sale_id
          AND m.status IS DISTINCT FROM 'cancelled'
    ) THEN
        RAISE EXCEPTION 'Transaksi masih memiliki data pengukuran yang belum dibatalkan. Data pengukuran tersebut harus tetap disimpan.';
    END IF;

    -- Hapus rincian modul terkait yang semuanya sudah berstatus dibatalkan.
    DELETE FROM public.measurement_openings
    WHERE room_id IN (
        SELECT mr.id
        FROM public.measurement_rooms mr
        JOIN public.measurements m ON m.id = mr.measurement_id
        JOIN public.work_schedules ws ON ws.id = m.schedule_id
        WHERE ws.sale_id = p_sale_id
    );

    DELETE FROM public.measurement_rooms
    WHERE measurement_id IN (
        SELECT m.id
        FROM public.measurements m
        JOIN public.work_schedules ws ON ws.id = m.schedule_id
        WHERE ws.sale_id = p_sale_id
    );

    DELETE FROM public.measurements
    WHERE schedule_id IN (
        SELECT id FROM public.work_schedules WHERE sale_id = p_sale_id
    );
    DELETE FROM public.work_schedules
    WHERE sale_id = p_sale_id AND status = 'cancelled';
    DELETE FROM public.production_orders
    WHERE sale_id = p_sale_id AND status = 'cancelled';

    -- Pembayaran hanya dihapus jika milik transaksi yang sudah dibatalkan ini.
    DELETE FROM public.payments WHERE sale_id = p_sale_id;
    DELETE FROM public.sale_items WHERE sale_id = p_sale_id;
    DELETE FROM public.sales WHERE id = p_sale_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_gm_cancelled_schedule(
    p_schedule_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sesi login tidak valid.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role::text = 'owner'
    ) THEN
        RAISE EXCEPTION 'Hanya owner yang dapat menghapus jadwal secara permanen.'
            USING ERRCODE = '42501';
    END IF;

    SELECT status INTO v_status
    FROM public.work_schedules
    WHERE id = p_schedule_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Jadwal tidak ditemukan.';
    END IF;

    IF v_status IS DISTINCT FROM 'cancelled' THEN
        RAISE EXCEPTION 'Hanya jadwal yang sudah dibatalkan yang dapat dihapus.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.measurements WHERE schedule_id = p_schedule_id
    ) THEN
        RAISE EXCEPTION 'Jadwal masih memiliki data pengukuran. Hapus data pengukuran yang dibatalkan terlebih dahulu; data ukur selesai harus tetap disimpan.';
    END IF;

    DELETE FROM public.work_schedules WHERE id = p_schedule_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_gm_cancelled_production(
    p_production_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sesi login tidak valid.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role::text = 'owner'
    ) THEN
        RAISE EXCEPTION 'Hanya owner yang dapat menghapus data produksi secara permanen.'
            USING ERRCODE = '42501';
    END IF;

    SELECT status INTO v_status
    FROM public.production_orders
    WHERE id = p_production_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data produksi tidak ditemukan.';
    END IF;

    IF v_status IS DISTINCT FROM 'cancelled' THEN
        RAISE EXCEPTION 'Hanya data produksi yang sudah dibatalkan yang dapat dihapus.';
    END IF;

    DELETE FROM public.production_orders WHERE id = p_production_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_gm_cancelled_measurement(
    p_measurement_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sesi login tidak valid.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role::text = 'owner'
    ) THEN
        RAISE EXCEPTION 'Hanya owner yang dapat menghapus data pengukuran secara permanen.'
            USING ERRCODE = '42501';
    END IF;

    SELECT status INTO v_status
    FROM public.measurements
    WHERE id = p_measurement_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data pengukuran tidak ditemukan.';
    END IF;

    IF v_status IS DISTINCT FROM 'cancelled' THEN
        RAISE EXCEPTION 'Hanya data pengukuran yang dibatalkan yang dapat dihapus.';
    END IF;

    DELETE FROM public.measurement_openings
    WHERE room_id IN (
        SELECT id
        FROM public.measurement_rooms
        WHERE measurement_id = p_measurement_id
    );

    DELETE FROM public.measurement_rooms
    WHERE measurement_id = p_measurement_id;

    DELETE FROM public.measurements
    WHERE id = p_measurement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_gm_cancelled_sale(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_gm_cancelled_schedule(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_gm_cancelled_production(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_gm_cancelled_measurement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_gm_cancelled_sale(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_gm_cancelled_schedule(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_gm_cancelled_production(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_gm_cancelled_measurement(uuid) TO authenticated;

-- Pastikan PostgREST mengenali RPC baru tanpa menunggu cache diperbarui.
NOTIFY pgrst, 'reload schema';
