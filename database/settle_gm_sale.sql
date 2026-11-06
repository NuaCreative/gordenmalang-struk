-- RPC pelunasan transaksi dengan keterangan yang diisi dari aplikasi.
-- Jalankan melalui Supabase Dashboard > SQL Editor.

CREATE OR REPLACE FUNCTION public.settle_gm_sale_with_note(
    p_sale_id uuid,
    p_payment_method text,
    p_payment_date date,
    p_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sale public.sales%ROWTYPE;
    v_paid numeric;
    v_remaining numeric;
    v_payment_method text;
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
        RAISE EXCEPTION 'Akun tidak memiliki akses untuk mencatat pelunasan.'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_sale
    FROM public.sales
    WHERE id = p_sale_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaksi tidak ditemukan.';
    END IF;

    IF v_sale.cancelled_at IS NOT NULL THEN
        RAISE EXCEPTION 'Transaksi yang dibatalkan tidak dapat dilunasi.';
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM public.payments
    WHERE sale_id = p_sale_id;

    v_remaining := COALESCE(v_sale.total, 0) - v_paid;
    IF v_remaining <= 0 THEN
        RAISE EXCEPTION 'Transaksi sudah lunas.';
    END IF;

    v_payment_method := lower(btrim(COALESCE(p_payment_method, '')));
    IF v_payment_method NOT IN ('cash', 'bank_transfer', 'qris', 'debit_card', 'credit_card', 'other') THEN
        RAISE EXCEPTION 'Metode pembayaran tidak valid.';
    END IF;

    IF NULLIF(btrim(p_notes), '') IS NULL THEN
        RAISE EXCEPTION 'Keterangan pelunasan harus diisi.';
    END IF;

    INSERT INTO public.payments (
        sale_id,
        payment_date,
        amount,
        payment_method,
        payment_type,
        notes
    )
    VALUES (
        p_sale_id,
        COALESCE(p_payment_date, CURRENT_DATE),
        v_remaining,
        v_payment_method,
        'settlement',
        btrim(p_notes)
    );

    UPDATE public.sales
    SET payment_status = 'paid'
    WHERE id = p_sale_id;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_gm_sale_with_note(uuid, text, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_gm_sale_with_note(uuid, text, date, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.settle_gm_sale_with_note(uuid, text, date, text) TO authenticated;
