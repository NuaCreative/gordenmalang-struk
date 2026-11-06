-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Mengalokasikan nomor struk bulanan secara global dan aman untuk permintaan bersamaan.

CREATE TABLE IF NOT EXISTS public.gm_receipt_counters (
    period_key text PRIMARY KEY
        CHECK (period_key ~ '^[0-9]{6}$'),
    last_number bigint NOT NULL DEFAULT 0
        CHECK (last_number >= 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gm_receipt_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gm_receipt_counters FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.next_gm_receipt_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_period text;
    v_last_used bigint := 0;
    v_next bigint;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sesi login tidak valid.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role::text IN ('owner', 'finance', 'sales')
    ) THEN
        RAISE EXCEPTION 'Akun tidak memiliki akses untuk membuat nomor struk.'
            USING ERRCODE = '42501';
    END IF;

    -- Gunakan bulan kalender bisnis Gorden Malang.
    v_period := to_char((now() AT TIME ZONE 'Asia/Jakarta')::date, 'YYYYMM');

    -- Lanjutkan dari nomor lama tertinggi jika pemasangan ini baru dijalankan.
    SELECT COALESCE(MAX(substring(sale_number FROM 11)::bigint), 0)
    INTO v_last_used
    FROM public.sales
    WHERE sale_number ~ ('^GM-' || v_period || '-[0-9]+$');

    INSERT INTO public.gm_receipt_counters AS counters (
        period_key,
        last_number,
        updated_at
    )
    VALUES (
        v_period,
        v_last_used + 1,
        now()
    )
    ON CONFLICT (period_key) DO UPDATE
    SET last_number = GREATEST(counters.last_number + 1, EXCLUDED.last_number),
        updated_at = now()
    RETURNING counters.last_number INTO v_next;

    RETURN 'GM-' || v_period || '-' || lpad(v_next::text, 3, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_gm_receipt_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_gm_receipt_number() TO authenticated;

NOTIFY pgrst, 'reload schema';
