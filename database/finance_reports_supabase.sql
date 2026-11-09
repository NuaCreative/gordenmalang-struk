-- Supabase setup untuk modul Keuangan dan Laporan.
-- Jalankan melalui Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang; tidak menghapus atau mengubah transaksi lama.

BEGIN;

CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name text NOT NULL,
    bank_name text,
    account_number text,
    opening_balance numeric(14, 2) NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    notes text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number text NOT NULL UNIQUE,
    expense_date date NOT NULL DEFAULT CURRENT_DATE,
    account_id uuid NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    description text NOT NULL,
    amount numeric(14, 2) NOT NULL CHECK (amount > 0),
    payment_method text NOT NULL DEFAULT 'cash'
        CHECK (payment_method IN ('cash', 'bank_transfer', 'transfer', 'qris', 'debit_card', 'credit_card', 'other')),
    payment_status text NOT NULL DEFAULT 'paid'
        CHECK (payment_status IN ('paid', 'unpaid', 'dibayar', 'belum dibayar', 'sudah dibayar')),
    notes text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Perbarui foreign key dari instalasi lama yang masih menunjuk ke tabel akun lain.
-- Hentikan migrasi dengan aman jika masih ada pengeluaran yang belum punya akun pasangan.
DO $$
DECLARE
    account_fk_target oid;
    orphan_expense_count bigint;
BEGIN
    SELECT confrelid
    INTO account_fk_target
    FROM pg_constraint
    WHERE conrelid = 'public.expenses'::regclass
      AND conname = 'expenses_account_id_fkey'
      AND contype = 'f';

    IF account_fk_target IS DISTINCT FROM 'public.financial_accounts'::regclass THEN
        SELECT count(*)
        INTO orphan_expense_count
        FROM public.expenses e
        LEFT JOIN public.financial_accounts a ON a.id = e.account_id
        WHERE a.id IS NULL;

        IF orphan_expense_count > 0 THEN
            RAISE EXCEPTION
                'Tidak dapat memperbarui expenses_account_id_fkey: % pengeluaran belum cocok dengan financial_accounts. Cocokkan account_id lama terlebih dahulu.',
                orphan_expense_count;
        END IF;

        ALTER TABLE public.expenses
            DROP CONSTRAINT IF EXISTS expenses_account_id_fkey;

        ALTER TABLE public.expenses
            ADD CONSTRAINT expenses_account_id_fkey
            FOREIGN KEY (account_id)
            REFERENCES public.financial_accounts(id)
            ON DELETE RESTRICT;
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.income_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    income_number text NOT NULL UNIQUE,
    income_date date NOT NULL DEFAULT CURRENT_DATE,
    account_id uuid NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    description text NOT NULL,
    amount numeric(14, 2) NOT NULL CHECK (amount > 0),
    payment_method text NOT NULL DEFAULT 'cash'
        CHECK (payment_method IN ('cash', 'bank_transfer', 'transfer', 'qris', 'debit_card', 'credit_card', 'other')),
    notes text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Sediakan akun awal bersaldo nol hanya jika belum ada akun aktif.
-- Owner dapat mengganti nama dan saldo awalnya dari Table Editor Supabase.
INSERT INTO public.financial_accounts (
    account_name,
    opening_balance,
    is_active
)
SELECT 'Kas Operasional', 0, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.financial_accounts WHERE is_active = true
);

-- Kolom ini menghubungkan pembayaran pelanggan dengan akun kas/bank.
-- Pembayaran lama tetap NULL sampai dialokasikan dengan benar.
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS financial_account_id uuid;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'payments_financial_account_id_fkey'
          AND conrelid = 'public.payments'::regclass
    ) THEN
        ALTER TABLE public.payments
            ADD CONSTRAINT payments_financial_account_id_fkey
            FOREIGN KEY (financial_account_id)
            REFERENCES public.financial_accounts(id)
            ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_financial_accounts_active_name
    ON public.financial_accounts (is_active, account_name);

CREATE INDEX IF NOT EXISTS idx_expenses_date
    ON public.expenses (expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_account_date
    ON public.expenses (account_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_payment_status
    ON public.expenses (payment_status, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_income_entries_date
    ON public.income_entries (income_date DESC);

CREATE INDEX IF NOT EXISTS idx_income_entries_account_date
    ON public.income_entries (account_id, income_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_financial_account_date
    ON public.payments (financial_account_id, payment_date DESC);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.financial_accounts, public.expenses, public.income_entries
    TO authenticated;

-- Hanya owner dan finance yang dapat mengelola akun, pemasukan manual, dan pengeluaran.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'financial_accounts'
          AND policyname = 'gm_finance_accounts_manage'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY gm_finance_accounts_manage
            ON public.financial_accounts
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                      AND ur.role::text IN ('owner', 'finance')
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                      AND ur.role::text IN ('owner', 'finance')
                )
            )
        $policy$;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'income_entries'
          AND policyname = 'gm_finance_income_manage'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY gm_finance_income_manage
            ON public.income_entries
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                      AND ur.role::text IN ('owner', 'finance')
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                      AND ur.role::text IN ('owner', 'finance')
                )
            )
        $policy$;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'expenses'
          AND policyname = 'gm_finance_expenses_manage'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY gm_finance_expenses_manage
            ON public.expenses
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                      AND ur.role::text IN ('owner', 'finance')
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                      AND ur.role::text IN ('owner', 'finance')
                )
            )
        $policy$;
    END IF;

    -- Tambahkan hak baca untuk laporan tanpa menghapus policy transaksi yang sudah ada.
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'payments'
          AND policyname = 'gm_finance_read_payments'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY gm_finance_read_payments
            ON public.payments
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                      AND ur.role::text IN ('owner', 'finance', 'sales')
                )
            )
        $policy$;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'sales'
          AND policyname = 'gm_finance_read_sales'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY gm_finance_read_sales
            ON public.sales
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                      AND ur.role::text IN ('owner', 'finance', 'sales', 'operations')
                )
            )
        $policy$;
    END IF;
END;
$$;

COMMENT ON COLUMN public.payments.financial_account_id IS
    'Akun penerimaan kas/bank; NULL berarti belum dialokasikan ke akun.';

NOTIFY pgrst, 'reload schema';

COMMIT;
