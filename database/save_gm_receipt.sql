-- Jalankan sekali melalui Supabase Dashboard > SQL Editor.
-- Fungsi memeriksa role login sebelum menulis transaksi secara atomik.

CREATE OR REPLACE FUNCTION public.save_gm_receipt(
    p_sale_number text,
    p_sale_date date,
    p_customer_id uuid,
    p_subtotal numeric,
    p_discount numeric,
    p_notes text,
    p_items jsonb,
    p_paid numeric,
    p_payment_method text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sale_id uuid;
    v_total numeric;
    v_items_subtotal numeric := 0;
    v_item jsonb;
    v_item_name text;
    v_quantity numeric;
    v_unit_price numeric;
    v_payment_method text;
    v_payment_status text;
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
        RAISE EXCEPTION 'Akun tidak memiliki akses untuk menyimpan transaksi.' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(btrim(p_sale_number), '') IS NULL OR p_sale_date IS NULL THEN
        RAISE EXCEPTION 'Nomor struk dan tanggal wajib diisi.';
    END IF;

    IF p_customer_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.customers WHERE id = p_customer_id
    ) THEN
        RAISE EXCEPTION 'Pelanggan tidak ditemukan. Pilih pelanggan dari daftar.';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Struk harus memiliki minimal satu rincian produk.';
    END IF;
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Struk harus memiliki minimal satu rincian produk.';
    END IF;

    IF p_subtotal IS NULL OR p_subtotal < 0 OR p_discount IS NULL OR p_discount < 0 OR p_discount > p_subtotal THEN
        RAISE EXCEPTION 'Nilai subtotal atau diskon tidak valid.';
    END IF;

    IF p_paid IS NULL OR p_paid < 0 THEN
        RAISE EXCEPTION 'Nilai pembayaran tidak valid.';
    END IF;

    v_total := p_subtotal - p_discount;
    IF p_paid > v_total THEN
        RAISE EXCEPTION 'Pembayaran tidak boleh melebihi total tagihan.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.sales WHERE sale_number = btrim(p_sale_number)) THEN
        RAISE EXCEPTION 'Nomor struk sudah tersimpan. Buat nomor baru.';
    END IF;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        v_item_name := NULLIF(btrim(v_item ->> 'name'), '');
        v_quantity := NULLIF(v_item ->> 'qty', '')::numeric;
        v_unit_price := NULLIF(v_item ->> 'price', '')::numeric;

        IF v_item_name IS NULL OR v_quantity IS NULL OR v_quantity <= 0 OR v_unit_price IS NULL OR v_unit_price < 0 THEN
            RAISE EXCEPTION 'Rincian produk tidak valid.';
        END IF;

        v_items_subtotal := v_items_subtotal + (v_quantity * v_unit_price);
    END LOOP;

    IF abs(v_items_subtotal - p_subtotal) > 0.000001 THEN
        RAISE EXCEPTION 'Subtotal tidak sesuai dengan rincian produk.';
    END IF;

    v_payment_status := CASE
        WHEN v_total > 0 AND p_paid >= v_total THEN 'paid'
        WHEN p_paid > 0 THEN 'partial'
        ELSE 'unpaid'
    END;

    INSERT INTO public.sales (
        sale_number,
        sale_date,
        customer_id,
        subtotal,
        discount,
        total,
        payment_status,
        notes
    )
    VALUES (
        btrim(p_sale_number),
        p_sale_date,
        p_customer_id,
        p_subtotal,
        p_discount,
        v_total,
        v_payment_status,
        NULLIF(btrim(p_notes), '')
    )
    RETURNING id INTO v_sale_id;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        v_item_name := btrim(v_item ->> 'name');
        v_quantity := (v_item ->> 'qty')::numeric;
        v_unit_price := (v_item ->> 'price')::numeric;

        INSERT INTO public.sale_items (
            sale_id,
            item_name,
            description,
            quantity,
            unit,
            unit_price
        )
        VALUES (
            v_sale_id,
            v_item_name,
            v_item_name,
            v_quantity,
            'pcs',
            v_unit_price
        );
    END LOOP;

    IF p_paid > 0 THEN
        v_payment_method := CASE lower(btrim(COALESCE(p_payment_method, '')))
            WHEN 'tunai' THEN 'cash'
            WHEN 'transfer bank' THEN 'bank_transfer'
            WHEN 'qris' THEN 'qris'
            WHEN 'transfer / tunai' THEN 'other'
            WHEN 'belum dibayar' THEN 'other'
            ELSE lower(btrim(p_payment_method))
        END;

        INSERT INTO public.payments (
            sale_id,
            payment_date,
            amount,
            payment_method,
            payment_type
        )
        VALUES (
            v_sale_id,
            p_sale_date,
            p_paid,
            COALESCE(NULLIF(v_payment_method, ''), 'other'),
            CASE WHEN p_paid >= v_total THEN 'settlement' ELSE 'dp' END
        );
    END IF;

    RETURN v_sale_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_gm_receipt(text, date, uuid, numeric, numeric, text, jsonb, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_gm_receipt(text, date, uuid, numeric, numeric, text, jsonb, numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_gm_receipt(text, date, uuid, numeric, numeric, text, jsonb, numeric, text) TO authenticated;
