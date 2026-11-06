(() => {
    'use strict';

    const PAGE_SIZE = 1000;
    const PAID_STATUSES = ['paid', 'lunas', 'dibayar', 'sudah dibayar'];
    const REFUND_TYPES = ['refund', 'refund_payment', 'pengembalian_dana'];

    const money = value => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(Number(value) || 0);

    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);

    const dateKey = value => value ? String(value).slice(0, 10) : '';

    const formatDate = value => {
        const key = dateKey(value);
        if (!key) return '—';
        const date = new Date(key + 'T00:00:00');
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const isPaid = status => PAID_STATUSES.includes(
        String(status || '').trim().toLowerCase()
    );

    const isRefund = payment => REFUND_TYPES.includes(
        String(payment?.payment_type || '').trim().toLowerCase()
    );

    const paymentFlow = payment => {
        const amount = Math.abs(Number(payment?.amount) || 0);
        return isRefund(payment) ? -amount : amount;
    };

    const methodLabel = method => ({
        cash: 'Tunai',
        bank_transfer: 'Transfer bank',
        transfer: 'Transfer bank',
        qris: 'QRIS',
        debit_card: 'Kartu debit',
        credit_card: 'Kartu kredit',
        other: 'Lainnya'
    }[String(method || '').toLowerCase()] || method || '—');

    const paymentTypeLabel = type => ({
        dp: 'Uang muka',
        installment: 'Cicilan',
        settlement: 'Pelunasan',
        refund: 'Pengembalian dana',
        refund_payment: 'Pengembalian dana'
    }[String(type || '').toLowerCase()] || type || 'Pembayaran');

    function getClient() {
        return window.gmSupabase || window.supabaseClient || null;
    }

    function localISODate(date) {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    function getToday() {
        return localISODate(new Date());
    }

    function getMonthStart(monthOffset = 0) {
        const now = new Date();
        return localISODate(new Date(now.getFullYear(), now.getMonth() + monthOffset, 1));
    }

    function addDays(date, days) {
        const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        result.setDate(result.getDate() + days);
        return result;
    }

    function makeQueryPager(queryFactory) {
        return async () => {
            const records = [];
            let offset = 0;
            while (true) {
                const { data, error } = await queryFactory()
                    .range(offset, offset + PAGE_SIZE - 1);
                if (error) throw error;
                const page = data || [];
                records.push(...page);
                if (page.length < PAGE_SIZE) break;
                offset += PAGE_SIZE;
            }
            return records;
        };
    }

    function insideRange(value, start, end) {
        const key = dateKey(value);
        return Boolean(key && key >= start && key <= end);
    }

    function sumAmounts(records, amountSelector) {
        return records.reduce((sum, item) => sum + (Number(amountSelector(item)) || 0), 0);
    }

    function monthLabel(key) {
        const date = new Date(key + '-01T00:00:00');
        return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    }

    function getMonthlyTrend(payments, expenses, manualIncomes = [], months = 6) {
        const now = new Date();
        const buckets = [];
        for (let index = months - 1; index >= 0; index -= 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
            const key = localISODate(date).slice(0, 7);
            buckets.push({ key, label: monthLabel(key), income: 0, expense: 0 });
        }

        const bucketByKey = new Map(buckets.map(bucket => [bucket.key, bucket]));
        payments.forEach(payment => {
            const bucket = bucketByKey.get(dateKey(payment.payment_date).slice(0, 7));
            if (bucket) {
                const amount = paymentFlow(payment);
                if (amount >= 0) bucket.income += amount;
                else bucket.expense += Math.abs(amount);
            }
        });
        manualIncomes.forEach(income => {
            const bucket = bucketByKey.get(dateKey(income.income_date).slice(0, 7));
            if (bucket) bucket.income += Math.abs(Number(income.amount) || 0);
        });
        expenses.forEach(expense => {
            if (!isPaid(expense.payment_status)) return;
            const bucket = bucketByKey.get(dateKey(expense.expense_date).slice(0, 7));
            if (bucket) bucket.expense += Math.abs(Number(expense.amount) || 0);
        });
        return buckets;
    }

    function renderBarChart(container, buckets, emptyMessage = 'Belum ada data untuk grafik.') {
        if (!container) return;
        const max = Math.max(1, ...buckets.flatMap(item => [item.income, item.expense]));
        const hasData = buckets.some(item => item.income || item.expense);
        if (!hasData) {
            container.innerHTML = `<p class="finance-empty">${escapeHTML(emptyMessage)}</p>`;
            return;
        }

        container.innerHTML = `
            <div class="finance-chart-legend">
                <span><i class="is-income"></i>Pemasukan</span>
                <span><i class="is-expense"></i>Pengeluaran</span>
            </div>
            <div class="finance-chart-scroll">
                <div class="finance-chart">
                    ${buckets.map(item => {
                        const incomeHeight = item.income ? Math.max(4, item.income / max * 145) : 2;
                        const expenseHeight = item.expense ? Math.max(4, item.expense / max * 145) : 2;
                        return `
                            <div class="finance-chart-group" title="${escapeHTML(item.label)} · Masuk ${escapeHTML(money(item.income))} · Keluar ${escapeHTML(money(item.expense))}">
                                <div class="finance-chart-bars">
                                    <span class="finance-chart-bar is-income" style="height:${incomeHeight}px"></span>
                                    <span class="finance-chart-bar is-expense" style="height:${expenseHeight}px"></span>
                                </div>
                                <small>${escapeHTML(item.label)}</small>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    function renderBreakdown(container, rows, emptyMessage) {
        if (!container) return;
        const meaningful = rows.filter(row => Number(row.amount) > 0);
        if (!meaningful.length) {
            container.innerHTML = `<p class="finance-empty">${escapeHTML(emptyMessage)}</p>`;
            return;
        }

        const max = Math.max(...meaningful.map(row => Number(row.amount) || 0), 1);
        container.innerHTML = `<div class="finance-breakdown-list">
            ${meaningful.map(row => {
                const percent = Math.max(3, Number(row.amount) / max * 100);
                return `<div class="finance-breakdown-row">
                    <div><strong>${escapeHTML(row.label)}</strong><span>${escapeHTML(money(row.amount))}</span></div>
                    <div class="finance-breakdown-track"><i style="width:${percent}%"></i></div>
                </div>`;
            }).join('')}
        </div>`;
    }

    const Finance = {
        accounts: [],
        payments: [],
        manualIncomes: [],
        expenses: [],
        sales: [],
        currentRange: null,

        render() {
            const today = getToday();
            const defaultRange = this.currentRange || {
                start: getMonthStart(),
                end: today
            };
            return `
                <section class="gm-dashboard gm-finance">
                    <div class="gm-dashboard-heading finance-heading">
                        <div>
                            <span class="finance-eyebrow">ARUS KAS &amp; PENGELOLAAN</span>
                            <p>Pantau uang masuk dan keluar, saldo akun, serta tagihan yang perlu ditindaklanjuti.</p>
                        </div>
                        <button type="button" class="btn light" data-finance-module="reports">Lihat Laporan Lengkap</button>
                    </div>

                    <section class="finance-filter-panel">
                        <div><strong>Periode ringkasan</strong><small>Pilih rentang tanggal untuk kartu dan riwayat di bawah.</small></div>
                        <div class="finance-filter-controls">
                            <button type="button" class="btn light is-selected" data-finance-preset="month">Bulan ini</button>
                            <button type="button" class="btn light" data-finance-preset="previous">Bulan lalu</button>
                            <button type="button" class="btn light" data-finance-preset="quarter">90 hari</button>
                            <label>Dari<input type="date" id="financeFromDate" value="${escapeHTML(defaultRange.start)}" max="${today}"></label>
                            <label>Sampai<input type="date" id="financeToDate" value="${escapeHTML(defaultRange.end)}" max="${today}"></label>
                            <button type="button" class="btn primary" id="financeApplyFilter">Terapkan</button>
                        </div>
                    </section>

                    <div id="financeMessage" class="finance-message" role="status" aria-live="polite"></div>

                    <div class="finance-kpi-grid">
                        <article class="finance-kpi is-income"><span>Uang Masuk</span><strong id="financeIncome">—</strong><small>Pembayaran pelanggan dan pemasukan manual</small></article>
                        <article class="finance-kpi is-expense"><span>Uang Keluar</span><strong id="financeExpense">—</strong><small>Pengeluaran dibayar dan pengembalian dana</small></article>
                        <article class="finance-kpi is-net"><span>Arus Kas Bersih</span><strong id="financeNet">—</strong><small>Uang masuk dikurangi uang keluar</small></article>
                        <article class="finance-kpi is-pending"><span>Tagihan Pengeluaran</span><strong id="financeUnpaidExpense">—</strong><small id="financeUnpaidExpenseNote">Belum dibayar pada periode ini</small></article>
                        <article class="finance-kpi is-receivable"><span>Piutang Pelanggan</span><strong id="financeReceivable">—</strong><small id="financeReceivableNote">Sisa transaksi aktif</small></article>
                    </div>

                    <div class="finance-primary-grid">
                        <section class="gm-dashboard-panel finance-panel">
                            <div class="finance-section-heading"><div><h3>Tren Arus Kas</h3><p>Perbandingan uang masuk dan keluar selama enam bulan terakhir.</p></div><span class="finance-chart-unit">Rupiah</span></div>
                            <div id="financeCashflowChart" class="finance-chart-area"><p class="finance-empty">Menghitung arus kas...</p></div>
                        </section>
                        <section class="gm-dashboard-panel finance-panel">
                            <div class="finance-section-heading"><div><h3>Pemasukan per Metode</h3><p>Distribusi pembayaran pelanggan dalam periode terpilih.</p></div></div>
                            <div id="financeMethodBreakdown"><p class="finance-empty">Menghitung metode pembayaran...</p></div>
                        </section>
                    </div>

                    <section class="gm-dashboard-panel finance-panel">
                        <div class="finance-section-heading"><div><h3>Saldo Akun Saat Ini</h3><p>Saldo awal + pembayaran transaksi + pemasukan manual − pengeluaran yang sudah dibayar.</p></div><span id="financeAccountCount" class="finance-count-pill">0 akun aktif</span></div>
                        <div id="financeAccounts"><p class="finance-empty">Memuat akun keuangan...</p></div>
                        <div id="financeUnallocatedIncome" class="finance-unallocated"></div>
                    </section>

                    <section class="gm-dashboard-panel finance-panel">
                        <div class="finance-section-heading"><div><h3>Catat Pemasukan Manual</h3><p>Untuk tambahan modal atau uang masuk yang bukan pembayaran transaksi.</p></div><button type="button" class="btn light" id="financeToggleIncome">Buka formulir</button></div>
                        <form id="financeIncomeForm" class="finance-expense-form" hidden>
                            <div class="finance-form-grid">
                                <label>Tanggal pemasukan *<input type="date" name="income_date" value="${today}" max="${today}" required></label>
                                <label>Nominal (Rp) *<input type="number" name="amount" min="1" step="1" placeholder="Contoh: 500000" required></label>
                                <label>Akun tujuan *<select name="account_id" id="financeIncomeAccountSelect" required><option value="">Memuat akun...</option></select></label>
                                <label>Metode penerimaan *<select name="payment_method" required><option value="cash">Tunai</option><option value="bank_transfer">Transfer bank</option><option value="qris">QRIS</option><option value="other">Lainnya</option></select></label>
                                <label class="finance-form-wide">Sumber / keterangan *<input type="text" name="description" maxlength="200" placeholder="Contoh: setoran tabungan, tambahan modal" required></label>
                                <label class="finance-form-wide">Catatan<textarea name="notes" rows="2" placeholder="Referensi atau catatan tambahan (opsional)"></textarea></label>
                            </div>
                            <div class="finance-form-footer"><small>Pemasukan ini menambah saldo dan laporan arus kas. Jangan catat transfer antar rekening sendiri sebagai pemasukan.</small><button type="submit" class="btn primary">Simpan Pemasukan</button></div>
                            <p id="financeIncomeFormMessage" class="finance-form-message" role="status" aria-live="polite"></p>
                        </form>
                    </section>

                    <section class="gm-dashboard-panel finance-panel">
                        <div class="finance-section-heading"><div><h3>Catat Pengeluaran</h3><p>Catat biaya operasional, tentukan akun sumber dana, dan pantau status pembayarannya.</p></div><button type="button" class="btn light" id="financeToggleExpense">Buka formulir</button></div>
                        <form id="financeExpenseForm" class="finance-expense-form" hidden>
                            <div class="finance-form-grid">
                                <label>Tanggal pengeluaran *<input type="date" name="expense_date" value="${today}" max="${today}" required></label>
                                <label>Nominal (Rp) *<input type="number" name="amount" min="1" step="1" placeholder="Contoh: 150000" required></label>
                                <label>Akun pembayaran *<select name="account_id" id="financeAccountSelect" required><option value="">Memuat akun...</option></select></label>
                                <label>Metode pembayaran *<select name="payment_method" required><option value="cash">Tunai</option><option value="bank_transfer">Transfer bank</option><option value="qris">QRIS</option><option value="debit_card">Kartu debit</option><option value="other">Lainnya</option></select></label>
                                <label>Status pembayaran *<select name="payment_status" required><option value="paid">Sudah dibayar</option><option value="unpaid">Belum dibayar</option></select></label>
                                <label class="finance-form-wide">Keterangan *<input type="text" name="description" maxlength="200" placeholder="Contoh: pembelian kain, ongkos kirim, listrik" required></label>
                                <label class="finance-form-wide">Catatan<textarea name="notes" rows="2" placeholder="Referensi atau catatan tambahan (opsional)"></textarea></label>
                            </div>
                            <div class="finance-form-footer"><small>Pengeluaran berstatus belum dibayar tidak mengurangi saldo akun sampai dibayar.</small><button type="submit" class="btn primary">Simpan Pengeluaran</button></div>
                            <p id="financeFormMessage" class="finance-form-message" role="status" aria-live="polite"></p>
                        </form>
                    </section>

                    <section class="gm-dashboard-panel finance-panel">
                        <div class="finance-section-heading"><div><h3>Riwayat Keuangan</h3><p id="financeHistorySubtitle">Arus masuk dan keluar sesuai periode terpilih.</p></div></div>
                        <div class="finance-history-filters">
                            <input type="search" id="financeHistorySearch" placeholder="Cari nomor, keterangan, akun..." aria-label="Cari transaksi keuangan">
                            <select id="financeTypeFilter" aria-label="Jenis transaksi"><option value="all">Semua jenis</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select>
                            <select id="financeAccountFilter" aria-label="Filter akun"><option value="all">Semua akun</option></select>
                        </div>
                        <div class="finance-table-wrap"><table class="gm-dashboard-table finance-table"><thead><tr><th>Tanggal</th><th>Arus</th><th>No. / Referensi</th><th>Keterangan</th><th>Akun</th><th>Metode / Status</th><th class="numeric">Nominal</th></tr></thead><tbody id="financeHistory"><tr><td colspan="7">Memuat riwayat...</td></tr></tbody></table></div>
                    </section>
                </section>
            `;
        },

        async loadData() {
            const client = getClient();
            if (!client) throw new Error('Koneksi Supabase tidak ditemukan. Periksa config.js dan inisialisasi gmSupabase.');

            const fetchPayments = makeQueryPager(() => client
                .from('payments')
                .select('*')
                .order('payment_date', { ascending: false }));
            const fetchManualIncomes = makeQueryPager(() => client
                .from('income_entries')
                .select('*')
                .order('income_date', { ascending: false }));
            const fetchExpenses = makeQueryPager(() => client
                .from('expenses')
                .select('*')
                .order('expense_date', { ascending: false }));
            const fetchSales = makeQueryPager(() => client
                .from('sales')
                .select('id,sale_number,customer_id,sale_date,total,payment_status,cancelled_at')
                .order('sale_date', { ascending: false }));

            const [accountResult, payments, manualIncomes, expenses, sales] = await Promise.all([
                client.from('financial_accounts')
                    .select('*')
                    .eq('is_active', true)
                    .order('account_name'),
                fetchPayments(),
                fetchManualIncomes(),
                fetchExpenses(),
                fetchSales()
            ]);

            if (accountResult.error) throw accountResult.error;
            this.accounts = accountResult.data || [];
            this.payments = payments;
            this.manualIncomes = manualIncomes;
            this.expenses = expenses;
            this.sales = sales;
            return this.getSnapshot();
        },

        getSnapshot() {
            return {
                accounts: [...this.accounts],
                payments: [...this.payments],
                manualIncomes: [...this.manualIncomes],
                expenses: [...this.expenses],
                sales: [...this.sales]
            };
        },

        async init() {
            this.bindEvents();
            try {
                await this.loadData();
                this.populateAccountControls();
                this.renderCurrentPeriod();
                this.renderAccounts();
                this.renderHistory();
                this.showMessage('');
            } catch (error) {
                console.error('Gagal memuat Keuangan:', error);
                this.showMessage('Data keuangan gagal dimuat: ' + error.message, true);
                this.showError(error.message);
            }
        },

        bindEvents() {
            const root = document.querySelector('.gm-finance');
            if (!root || root.dataset.eventsBound === 'true') return;
            root.dataset.eventsBound = 'true';

            const expenseForm = root.querySelector('#financeExpenseForm');
            expenseForm?.addEventListener('submit', event => this.saveExpense(event));
            const incomeForm = root.querySelector('#financeIncomeForm');
            incomeForm?.addEventListener('submit', event => this.saveManualIncome(event));

            root.addEventListener('submit', event => {
                const form = event.target.closest('.finance-opening-form');
                if (!form) return;
                event.preventDefault();
                this.saveOpeningBalance(form);
            });

            root.addEventListener('click', event => {
                const button = event.target.closest('button');
                if (!button || !root.contains(button)) return;

                if (button.dataset.financeEditOpening) {
                    const card = button.closest('.finance-account-card');
                    const form = card?.querySelector('.finance-opening-form');
                    if (form) {
                        form.hidden = false;
                        form.querySelector('[name="opening_balance"]')?.focus();
                    }
                    return;
                }

                if (button.hasAttribute('data-finance-opening-cancel')) {
                    const form = button.closest('.finance-opening-form');
                    if (form) {
                        form.reset();
                        form.hidden = true;
                    }
                    return;
                }

                if (button.dataset.financeModule === 'reports') {
                    document.querySelector('.gm-nav-button[data-module="reports"]')?.click();
                    return;
                }

                if (button.dataset.financePreset) {
                    this.applyPreset(button.dataset.financePreset);
                    return;
                }

                if (button.id === 'financeApplyFilter') {
                    root.querySelectorAll('[data-finance-preset]').forEach(preset => {
                        preset.classList.remove('is-selected');
                    });
                    this.renderCurrentPeriod();
                    this.renderHistory();
                    return;
                }

                if (button.id === 'financeToggleExpense') {
                    const form = root.querySelector('#financeExpenseForm');
                    if (!form) return;
                    form.hidden = !form.hidden;
                    button.textContent = form.hidden ? 'Buka formulir' : 'Tutup formulir';
                    if (!form.hidden) form.querySelector('[name="description"]')?.focus();
                }

                if (button.id === 'financeToggleIncome') {
                    const form = root.querySelector('#financeIncomeForm');
                    if (!form) return;
                    form.hidden = !form.hidden;
                    button.textContent = form.hidden ? 'Buka formulir' : 'Tutup formulir';
                    if (!form.hidden) form.querySelector('[name="description"]')?.focus();
                }
            });

            root.addEventListener('input', event => {
                if (event.target.id === 'financeHistorySearch') this.renderHistory();
            });
            root.addEventListener('change', event => {
                if (['financeTypeFilter', 'financeAccountFilter'].includes(event.target.id)) {
                    this.renderHistory();
                }
            });
        },

        applyPreset(preset) {
            const from = document.getElementById('financeFromDate');
            const to = document.getElementById('financeToDate');
            const now = new Date();
            const today = getToday();
            let start = getMonthStart();
            let end = today;

            if (preset === 'previous') {
                start = getMonthStart(-1);
                end = localISODate(new Date(now.getFullYear(), now.getMonth(), 0));
            } else if (preset === 'quarter') {
                start = localISODate(addDays(now, -89));
            }

            if (from) from.value = start;
            if (to) to.value = end;
            document.querySelectorAll('.gm-finance [data-finance-preset]').forEach(button => {
                button.classList.toggle('is-selected', button.dataset.financePreset === preset);
            });
            this.renderCurrentPeriod();
            this.renderHistory();
        },

        getRange() {
            const from = document.getElementById('financeFromDate')?.value || getMonthStart();
            const to = document.getElementById('financeToDate')?.value || getToday();
            return from <= to ? { start: from, end: to } : { start: to, end: from };
        },

        applyDateFilter(records, field, range) {
            return records.filter(record => insideRange(record[field], range.start, range.end));
        },

        populateAccountControls() {
            const expenseSelect = document.getElementById('financeAccountSelect');
            const incomeSelect = document.getElementById('financeIncomeAccountSelect');
            const accountFilter = document.getElementById('financeAccountFilter');
            const options = this.accounts.map(account =>
                `<option value="${escapeHTML(account.id)}">${escapeHTML(account.account_name)}</option>`
            ).join('');

            if (expenseSelect) {
                expenseSelect.innerHTML = '<option value="">Pilih akun</option>' + options;
                expenseSelect.disabled = !this.accounts.length;
            }
            if (incomeSelect) {
                incomeSelect.innerHTML = '<option value="">Pilih akun tujuan</option>' + options;
                incomeSelect.disabled = !this.accounts.length;
            }
            if (accountFilter) {
                const current = accountFilter.value || 'all';
                accountFilter.innerHTML = '<option value="all">Semua akun</option>' +
                    options + '<option value="unassigned">Belum dialokasikan</option>';
                if ([...accountFilter.options].some(option => option.value === current)) {
                    accountFilter.value = current;
                }
            }
        },

        renderCurrentPeriod() {
            const range = this.getRange();
            if (range.start > range.end) return;
            this.currentRange = { ...range };

            const payments = this.applyDateFilter(this.payments, 'payment_date', range);
            const manualIncomes = this.applyDateFilter(this.manualIncomes, 'income_date', range);
            const expenses = this.applyDateFilter(this.expenses, 'expense_date', range);
            const positiveIncome = sumAmounts(payments.filter(item => !isRefund(item)), item => Math.abs(Number(item.amount) || 0)) +
                sumAmounts(manualIncomes, item => Math.abs(Number(item.amount) || 0));
            const refunds = sumAmounts(payments.filter(isRefund), item => Math.abs(Number(item.amount) || 0));
            const paidExpenses = sumAmounts(expenses.filter(item => isPaid(item.payment_status)), item => Math.abs(Number(item.amount) || 0));
            const unpaidExpenses = expenses.filter(item => !isPaid(item.payment_status));
            const unpaidTotal = sumAmounts(unpaidExpenses, item => Math.abs(Number(item.amount) || 0));
            const cashOut = refunds + paidExpenses;
            const receivables = this.getReceivables();
            const receivable = sumAmounts(receivables, item => item.balance);

            this.setText('financeIncome', money(positiveIncome));
            this.setText('financeExpense', money(cashOut));
            this.setText('financeNet', money(positiveIncome - cashOut));
            this.setText('financeUnpaidExpense', money(unpaidTotal));
            this.setText('financeUnpaidExpenseNote', `${unpaidExpenses.length.toLocaleString('id-ID')} catatan belum dibayar pada periode ini`);
            this.setText('financeReceivable', money(receivable));
            this.setText('financeReceivableNote', `${receivables.length.toLocaleString('id-ID')} transaksi aktif`);
            this.setText('financeHistorySubtitle', `${formatDate(range.start)} – ${formatDate(range.end)} · ${payments.length + manualIncomes.length + expenses.length} catatan arus kas`);

            renderBarChart(
                document.getElementById('financeCashflowChart'),
                getMonthlyTrend(this.payments, this.expenses, this.manualIncomes),
                'Belum ada arus kas enam bulan terakhir.'
            );

            const methodTotals = new Map();
            payments.filter(item => !isRefund(item)).forEach(payment => {
                const label = methodLabel(payment.payment_method);
                methodTotals.set(label, (methodTotals.get(label) || 0) + Math.abs(Number(payment.amount) || 0));
            });
            manualIncomes.forEach(income => {
                const label = methodLabel(income.payment_method);
                methodTotals.set(label, (methodTotals.get(label) || 0) + Math.abs(Number(income.amount) || 0));
            });
            renderBreakdown(
                document.getElementById('financeMethodBreakdown'),
                [...methodTotals].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount),
                'Belum ada pembayaran pelanggan pada periode ini.'
            );
        },

        getReceivables() {
            const paidBySale = new Map();
            this.payments.forEach(payment => {
                const key = String(payment.sale_id);
                paidBySale.set(key, (paidBySale.get(key) || 0) + paymentFlow(payment));
            });
            return this.sales.filter(sale => !sale.cancelled_at).map(sale => ({
                sale,
                balance: Math.max(0, (Number(sale.total) || 0) - (paidBySale.get(String(sale.id)) || 0))
            })).filter(item => item.balance > 0);
        },

        setText(id, value) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        },

        showMessage(text, isError = false) {
            const element = document.getElementById('financeMessage');
            if (!element) return;
            element.textContent = text || '';
            element.classList.toggle('is-error', Boolean(isError));
        },

        async saveExpense(event) {
            event.preventDefault();
            const client = getClient();
            const form = event.currentTarget;
            const message = document.getElementById('financeFormMessage');
            const submitButton = form.querySelector('button[type="submit"]');
            if (!client) {
                if (message) message.textContent = 'Koneksi Supabase tidak tersedia.';
                return;
            }
            if (!form.reportValidity()) return;

            const formData = new FormData(form);
            const amount = Number(formData.get('amount'));
            const accountId = String(formData.get('account_id') || '');
            if (!Number.isFinite(amount) || amount <= 0) {
                if (message) message.textContent = 'Nominal harus lebih besar dari nol.';
                return;
            }
            if (!this.accounts.some(account => String(account.id) === accountId)) {
                if (message) message.textContent = 'Pilih akun keuangan yang aktif.';
                return;
            }

            const expenseDate = String(formData.get('expense_date') || getToday());
            const datePart = expenseDate.replaceAll('-', '');
            const record = {
                expense_number: `EXP-${datePart}-${Date.now().toString().slice(-6)}`,
                expense_date: expenseDate,
                account_id: accountId,
                description: String(formData.get('description') || '').trim(),
                amount,
                payment_method: formData.get('payment_method'),
                payment_status: formData.get('payment_status'),
                notes: String(formData.get('notes') || '').trim() || null
            };

            if (submitButton) submitButton.disabled = true;
            if (message) message.textContent = 'Menyimpan pengeluaran...';
            try {
                const { error } = await client.from('expenses').insert(record);
                if (error) throw error;

                form.reset();
                const dateInput = form.querySelector('[name="expense_date"]');
                if (dateInput) dateInput.value = getToday();
                if (message) message.textContent = 'Pengeluaran berhasil dicatat.';
                await this.init();
                const currentForm = document.getElementById('financeExpenseForm');
                if (currentForm) currentForm.hidden = false;
                this.setText('financeToggleExpense', 'Tutup formulir');
                if (message) message.textContent = 'Pengeluaran berhasil dicatat.';
            } catch (error) {
                console.error('Gagal menyimpan pengeluaran:', error);
                if (message) message.textContent = 'Gagal menyimpan pengeluaran: ' + error.message;
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        },

        async saveManualIncome(event) {
            event.preventDefault();
            const client = getClient();
            const form = event.currentTarget;
            const message = document.getElementById('financeIncomeFormMessage');
            const submitButton = form.querySelector('button[type="submit"]');
            if (!client) {
                if (message) message.textContent = 'Koneksi Supabase tidak tersedia.';
                return;
            }
            if (!form.reportValidity()) return;

            const formData = new FormData(form);
            const amount = Number(formData.get('amount'));
            const accountId = String(formData.get('account_id') || '');
            if (!Number.isFinite(amount) || amount <= 0) {
                if (message) message.textContent = 'Nominal harus lebih besar dari nol.';
                return;
            }
            if (!this.accounts.some(account => String(account.id) === accountId)) {
                if (message) message.textContent = 'Pilih akun tujuan yang aktif.';
                return;
            }

            const incomeDate = String(formData.get('income_date') || getToday());
            const record = {
                income_number: `INC-${incomeDate.replaceAll('-', '')}-${Date.now()}`,
                income_date: incomeDate,
                account_id: accountId,
                description: String(formData.get('description') || '').trim(),
                amount,
                payment_method: formData.get('payment_method'),
                notes: String(formData.get('notes') || '').trim() || null
            };

            if (submitButton) submitButton.disabled = true;
            if (message) message.textContent = 'Menyimpan pemasukan...';
            try {
                const { error } = await client.from('income_entries').insert(record);
                if (error) throw error;

                form.reset();
                const dateInput = form.querySelector('[name="income_date"]');
                if (dateInput) dateInput.value = getToday();
                await this.init();
                const currentForm = document.getElementById('financeIncomeForm');
                if (currentForm) currentForm.hidden = false;
                this.setText('financeToggleIncome', 'Tutup formulir');
                const currentMessage = document.getElementById('financeIncomeFormMessage');
                if (currentMessage) currentMessage.textContent = 'Pemasukan berhasil dicatat.';
            } catch (error) {
                console.error('Gagal mencatat pemasukan manual:', error);
                if (message) message.textContent = 'Pemasukan gagal dicatat: ' + error.message;
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        },

        async saveOpeningBalance(form) {
            const client = getClient();
            const accountId = String(form.dataset.accountId || '');
            const input = form.querySelector('[name="opening_balance"]');
            const submitButton = form.querySelector('button[type="submit"]');
            const openingBalance = Number(input?.value);

            if (!client) {
                this.showMessage('Koneksi Supabase tidak tersedia.', true);
                return;
            }
            if (!accountId || !Number.isFinite(openingBalance) || openingBalance < 0) {
                this.showMessage('Masukkan saldo awal yang valid dan tidak kurang dari nol.', true);
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Menyimpan...';
            }

            try {
                const { data, error } = await client
                    .from('financial_accounts')
                    .update({ opening_balance: openingBalance })
                    .eq('id', accountId)
                    .select('id,opening_balance')
                    .maybeSingle();

                if (error) throw error;
                if (!data) {
                    throw new Error('Saldo tidak berubah. Pastikan akun Anda memiliki role owner atau finance.');
                }

                this.accounts = this.accounts.map(account =>
                    String(account.id) === accountId
                        ? { ...account, opening_balance: data.opening_balance }
                        : account
                );
                this.renderAccounts();
                this.showMessage('Saldo awal akun berhasil diperbarui.');
            } catch (error) {
                console.error('Gagal memperbarui saldo awal:', error);
                this.showMessage('Saldo awal gagal diperbarui: ' + (error.message || error), true);
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Simpan saldo awal';
                }
            }
        },

        renderAccounts() {
            const container = document.getElementById('financeAccounts');
            if (!container) return;
            this.setText('financeAccountCount', `${this.accounts.length.toLocaleString('id-ID')} akun aktif`);

            const accountCards = this.accounts.map(account => {
                const opening = Number(account.opening_balance) || 0;
                const income = this.payments
                    .filter(payment => String(payment.financial_account_id || '') === String(account.id))
                    .reduce((sum, payment) => sum + paymentFlow(payment), 0) +
                    this.manualIncomes
                        .filter(item => String(item.account_id) === String(account.id))
                        .reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);
                const expenses = this.expenses
                    .filter(expense => String(expense.account_id || '') === String(account.id) && isPaid(expense.payment_status))
                    .reduce((sum, expense) => sum + Math.abs(Number(expense.amount) || 0), 0);
                const balance = opening + income - expenses;
                return `<article class="finance-account-card ${balance < 0 ? 'is-negative' : ''}">
                    <div class="finance-account-top"><span class="finance-account-icon">${escapeHTML((account.account_name || 'A').slice(0, 1).toUpperCase())}</span><div><strong>${escapeHTML(account.account_name || 'Akun keuangan')}</strong><small>${escapeHTML(account.account_type || account.bank_name || 'Akun aktif')}</small></div></div>
                    <span class="finance-account-balance-label">Saldo berjalan</span><strong class="finance-account-balance">${escapeHTML(money(balance))}</strong>
                    <div class="finance-account-breakdown"><span>Saldo awal <b>${escapeHTML(money(opening))}</b></span><span>Pemasukan <b>${escapeHTML(money(income))}</b></span><span>Pengeluaran dibayar <b>${escapeHTML(money(expenses))}</b></span></div>
                    <button type="button" class="finance-opening-toggle" data-finance-edit-opening="${escapeHTML(account.id)}">Ubah saldo awal</button>
                    <form class="finance-opening-form" data-account-id="${escapeHTML(account.id)}" hidden>
                        <label>Saldo awal (Rp)<input type="number" name="opening_balance" min="0" step="1" value="${escapeHTML(opening)}" required></label>
                        <small>Atur saldo pada awal pencatatan. Pembayaran dan pengeluaran tercatat tetap dihitung terpisah.</small>
                        <div class="finance-opening-actions">
                            <button type="button" class="finance-opening-cancel" data-finance-opening-cancel>Batal</button>
                            <button type="submit" class="finance-opening-save">Simpan saldo awal</button>
                        </div>
                    </form>
                </article>`;
            });
            container.innerHTML = accountCards.length
                ? `<div class="finance-account-grid">${accountCards.join('')}</div>`
                : '<p class="finance-empty">Belum ada akun keuangan aktif.</p>';

            const unallocated = this.payments
                .filter(payment => !payment.financial_account_id)
                .reduce((sum, payment) => sum + paymentFlow(payment), 0);
            const unallocatedContainer = document.getElementById('financeUnallocatedIncome');
            if (unallocatedContainer) {
                unallocatedContainer.innerHTML = unallocated
                    ? `<span>Arus pembayaran yang belum dialokasikan ke akun</span><strong>${escapeHTML(money(unallocated))}</strong>`
                    : '';
            }
        },

        renderHistory() {
            const tbody = document.getElementById('financeHistory');
            if (!tbody) return;
            const range = this.getRange();
            const search = String(document.getElementById('financeHistorySearch')?.value || '').trim().toLocaleLowerCase('id');
            const typeFilter = document.getElementById('financeTypeFilter')?.value || 'all';
            const accountFilter = document.getElementById('financeAccountFilter')?.value || 'all';
            const accountMap = new Map(this.accounts.map(account => [String(account.id), account.account_name]));
            const saleMap = new Map(this.sales.map(sale => [String(sale.id), sale]));

            const rows = [
                ...this.payments.map(payment => {
                    const sale = saleMap.get(String(payment.sale_id));
                    return {
                        date: payment.payment_date,
                        direction: isRefund(payment) ? 'expense' : 'income',
                        type: isRefund(payment) ? 'Pengembalian dana' : paymentTypeLabel(payment.payment_type),
                        reference: payment.reference_number || sale?.sale_number || '—',
                        description: payment.notes || sale?.sale_number || 'Pembayaran pelanggan',
                        accountId: payment.financial_account_id ? String(payment.financial_account_id) : 'unassigned',
                        account: accountMap.get(String(payment.financial_account_id)) || 'Belum dialokasikan',
                        method: methodLabel(payment.payment_method),
                        status: 'Tercatat',
                        amount: paymentFlow(payment)
                    };
                }),
                ...this.manualIncomes.map(income => ({
                    date: income.income_date,
                    direction: 'income',
                    type: 'Pemasukan manual',
                    reference: income.income_number || '—',
                    description: income.description || income.notes || 'Pemasukan manual',
                    accountId: income.account_id ? String(income.account_id) : 'unassigned',
                    account: accountMap.get(String(income.account_id)) || 'Akun tidak aktif / tidak diketahui',
                    method: methodLabel(income.payment_method),
                    status: 'Tercatat',
                    amount: Math.abs(Number(income.amount) || 0)
                })),
                ...this.expenses.map(expense => ({
                    date: expense.expense_date,
                    direction: 'expense',
                    type: 'Pengeluaran',
                    reference: expense.expense_number || '—',
                    description: expense.description || expense.notes || '—',
                    accountId: expense.account_id ? String(expense.account_id) : 'unassigned',
                    account: accountMap.get(String(expense.account_id)) || 'Akun tidak aktif / tidak diketahui',
                    method: `${methodLabel(expense.payment_method)} · ${isPaid(expense.payment_status) ? 'Dibayar' : 'Belum dibayar'}`,
                    status: isPaid(expense.payment_status) ? 'Dibayar' : 'Belum dibayar',
                    amount: -Math.abs(Number(expense.amount) || 0)
                }))
            ].filter(row => insideRange(row.date, range.start, range.end))
                .filter(row => typeFilter === 'all' || row.direction === typeFilter)
                .filter(row => accountFilter === 'all' || row.accountId === accountFilter)
                .filter(row => !search || [row.type, row.reference, row.description, row.account, row.method].join(' ').toLocaleLowerCase('id').includes(search))
                .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)));

            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="finance-empty-cell">Tidak ada catatan yang cocok dengan periode dan filter.</td></tr>';
                return;
            }

            tbody.innerHTML = rows.slice(0, 500).map(row => `
                <tr>
                    <td>${escapeHTML(formatDate(row.date))}</td>
                    <td><span class="finance-kind-badge ${row.direction === 'income' ? 'is-income' : 'is-expense'}">${escapeHTML(row.type)}</span></td>
                    <td>${escapeHTML(row.reference)}</td>
                    <td>${escapeHTML(row.description)}</td>
                    <td>${escapeHTML(row.account)}</td>
                    <td>${escapeHTML(row.method)}</td>
                    <td class="numeric ${row.amount < 0 ? 'is-negative' : 'is-positive'}">${row.amount < 0 ? '− ' : '+ '}${escapeHTML(money(Math.abs(row.amount)))}</td>
                </tr>
            `).join('');

            if (rows.length > 500) {
                const note = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 7;
                cell.className = 'finance-empty-cell';
                cell.textContent = `Menampilkan 500 dari ${rows.length.toLocaleString('id-ID')} catatan. Persempit periode atau pencarian untuk melihat data lain.`;
                note.appendChild(cell);
                tbody.appendChild(note);
            }
        },

        showError(message) {
            const accounts = document.getElementById('financeAccounts');
            const history = document.getElementById('financeHistory');
            if (accounts) {
                const error = document.createElement('p');
                error.className = 'finance-empty';
                error.textContent = message;
                accounts.replaceChildren(error);
            }
            if (history) {
                history.innerHTML = '';
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 7;
                cell.className = 'finance-empty-cell is-error';
                cell.textContent = message;
                row.appendChild(cell);
                history.appendChild(row);
            }
        }
    };

    Finance.formatMoney = money;
    Finance.formatDate = formatDate;
    Finance.isPaid = isPaid;
    Finance.isRefund = isRefund;
    Finance.paymentFlow = paymentFlow;
    Finance.methodLabel = methodLabel;
    Finance.paymentTypeLabel = paymentTypeLabel;
    Finance.rangeFilter = insideRange;
    Finance.renderBarChart = renderBarChart;
    Finance.renderBreakdown = renderBreakdown;
    Finance.monthLabel = monthLabel;

    window.GMFinance = Finance;
})();
