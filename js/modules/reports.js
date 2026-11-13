(() => {
    'use strict';

    const todayISO = () => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);
    };

    const monthStart = (year, month) => {
        const date = new Date(year, month, 1);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);
    };

    const addDays = (date, count) => {
        const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        result.setDate(result.getDate() + count);
        return result;
    };

    const toISO = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 10);

    const insideRange = (value, start, end) => {
        const key = value ? String(value).slice(0, 10) : '';
        return Boolean(key && key >= start && key <= end);
    };

    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);

    const Reports = {
        data: { accounts: [], payments: [], manualIncomes: [], expenses: [], sales: [] },

        render() {
            const now = new Date();
            const today = todayISO();
            const yearStart = monthStart(now.getFullYear(), 0);
            const initialStart = yearStart;
            const initialEnd = today;
            return `
                <section class="gm-dashboard gm-reports">
                    <div class="gm-dashboard-heading report-heading">
                        <div><span class="finance-eyebrow">ANALISIS &amp; REKAP</span><p>Rekap arus kas, pembayaran, pengeluaran, saldo akun, dan piutang pelanggan.</p></div>
                        <div class="report-heading-actions"><button type="button" class="btn light" data-report-module="finance">Buka Keuangan</button><button type="button" class="btn light" id="reportRefresh">Muat ulang</button><button type="button" class="btn primary" id="reportPrint">Cetak laporan</button></div>
                    </div>

                    <form class="report-filter-panel" id="reportFilterForm">
                        <div><strong>Periode laporan</strong><small>Gunakan rentang tanggal yang sama untuk ringkasan, grafik, dan tabel.</small></div>
                        <div class="report-filter-controls">
                            <button type="button" class="btn light is-selected" data-report-preset="year">Tahun ini</button>
                            <button type="button" class="btn light" data-report-preset="month">Bulan ini</button>
                            <button type="button" class="btn light" data-report-preset="six">6 bulan</button>
                            <label>Dari<input type="date" id="reportFromDate" value="${initialStart}" max="${today}"></label>
                            <label>Sampai<input type="date" id="reportToDate" value="${initialEnd}" max="${today}"></label>
                            <button type="submit" class="btn primary">Terapkan</button>
                        </div>
                    </form>
                    <div id="reportMessage" class="finance-message" role="status" aria-live="polite"></div>

                    <div class="finance-kpi-grid report-kpi-grid">
                        <article class="finance-kpi is-income"><span>Pemasukan Tercatat</span><strong id="reportIncome">—</strong><small>Pembayaran transaksi dan pemasukan manual</small></article>
                        <article class="finance-kpi is-expense"><span>Pengeluaran Kas</span><strong id="reportExpense">—</strong><small>Biaya dibayar dan pengembalian dana</small></article>
                        <article class="finance-kpi is-net"><span>Arus Kas Bersih</span><strong id="reportNet">—</strong><small>Pemasukan dikurangi pengeluaran kas</small></article>
                        <article class="finance-kpi is-receivable"><span>Piutang Pelanggan</span><strong id="reportReceivable">—</strong><small id="reportReceivableNote">Sisa transaksi aktif saat ini</small></article>
                    </div>

                    <div class="report-secondary-kpis">
                        <article><span>Transaksi dibuat</span><strong id="reportSaleCount">—</strong></article>
                        <article><span>Nilai transaksi</span><strong id="reportSaleTotal">—</strong></article>
                        <article><span>Jumlah catatan pemasukan</span><strong id="reportPaymentCount">—</strong></article>
                        <article><span>Pengeluaran dibayar</span><strong id="reportPaidExpense">—</strong></article>
                        <article><span>Pengeluaran belum dibayar</span><strong id="reportUnpaidExpense">—</strong></article>
                        <article><span>Nilai pengeluaran tertunda</span><strong id="reportUnpaidAmount">—</strong></article>
                    </div>

                    <section class="gm-dashboard-panel report-panel">
                        <div class="finance-section-heading"><div><h3>Grafik Arus Kas</h3><p id="reportChartCaption">Pemasukan dan pengeluaran kas per bulan.</p></div><span class="finance-chart-unit">Rupiah</span></div>
                        <div id="reportCashflowChart" class="finance-chart-area"><p class="finance-empty">Menghitung laporan...</p></div>
                    </section>

                    <div class="report-chart-grid">
                        <section class="gm-dashboard-panel report-panel"><div class="finance-section-heading"><div><h3>Pemasukan per Metode</h3><p>Komposisi uang masuk selama periode.</p></div></div><div id="reportMethodBreakdown"></div></section>
                        <section class="gm-dashboard-panel report-panel"><div class="finance-section-heading"><div><h3>Pengeluaran per Akun</h3><p>Biaya yang sudah dibayar dan sumber dananya.</p></div></div><div id="reportExpenseBreakdown"></div></section>
                    </div>

                    <section class="gm-dashboard-panel report-panel">
                        <div class="finance-section-heading"><div><h3>Rincian Pemasukan</h3><p>Pembayaran pelanggan dan pemasukan manual berdasarkan tanggal diterima.</p></div></div>
                        <div class="finance-table-wrap"><table class="gm-dashboard-table finance-table report-table"><thead><tr><th>Tanggal</th><th>No. / Referensi</th><th>Jenis / Keterangan</th><th>Metode</th><th>Akun</th><th class="numeric">Nominal</th></tr></thead><tbody id="reportPaymentRows"><tr><td colspan="6">Memuat...</td></tr></tbody></table></div>
                    </section>

                    <section class="gm-dashboard-panel report-panel">
                        <div class="finance-section-heading"><div><h3>Rincian Pengeluaran</h3><p>Termasuk biaya yang sudah maupun belum dibayar.</p></div></div>
                        <div class="finance-table-wrap"><table class="gm-dashboard-table finance-table report-table"><thead><tr><th>Tanggal</th><th>No. Pengeluaran</th><th>Keterangan</th><th>Akun</th><th>Metode</th><th>Status</th><th class="numeric">Nominal</th></tr></thead><tbody id="reportExpenseRows"><tr><td colspan="7">Memuat...</td></tr></tbody></table></div>
                    </section>
                    <p class="report-footnote">Laporan memakai dasar kas: pembayaran transaksi dan pemasukan manual dihitung dari tanggal diterima; pengeluaran kas dihitung saat statusnya sudah dibayar. Piutang pelanggan dihitung dari transaksi aktif di luar periode terpilih.</p>
                </section>
            `;
        },

        async init() {
            this.bindEvents();
            const finance = window.GMFinance;
            if (!finance?.loadData) {
                this.showMessage('Sumber data Keuangan belum dimuat. Pastikan finance.js dimuat sebelum reports.js.', true);
                return;
            }

            try {
                this.data = await finance.loadData();
                this.renderReport();
                this.showMessage('Laporan memakai sumber data yang sama dengan modul Keuangan.');
            } catch (error) {
                console.error('Gagal memuat Laporan Keuangan:', error);
                this.showMessage('Laporan gagal dimuat: ' + error.message, true);
            }
        },

        bindEvents() {
            const root = document.querySelector('.gm-reports');
            if (!root || root.dataset.eventsBound === 'true') return;
            root.dataset.eventsBound = 'true';

            root.querySelector('#reportFilterForm')?.addEventListener('submit', event => {
                event.preventDefault();
                this.renderReport();
            });
            root.addEventListener('click', event => {
                const button = event.target.closest('button');
                if (!button || !root.contains(button)) return;

                if (button.dataset.reportPreset) {
                    this.applyPreset(button.dataset.reportPreset);
                    return;
                }
                if (button.dataset.reportModule === 'finance') {
                    document.querySelector('.gm-nav-button[data-module="finance"]')?.click();
                    return;
                }
                if (button.id === 'reportRefresh') {
                    this.init();
                    return;
                }
                if (button.id === 'reportPrint') this.printReport();
            });
        },

        applyPreset(preset) {
            const now = new Date();
            const today = todayISO();
            let start = monthStart(now.getFullYear(), 0);
            if (preset === 'month') start = monthStart(now.getFullYear(), now.getMonth());
            if (preset === 'six') start = monthStart(now.getFullYear(), now.getMonth() - 5);
            const from = document.getElementById('reportFromDate');
            const to = document.getElementById('reportToDate');
            if (from) from.value = start;
            if (to) to.value = today;
            document.querySelectorAll('.gm-reports [data-report-preset]').forEach(button => {
                button.classList.toggle('is-selected', button.dataset.reportPreset === preset);
            });
            this.renderReport();
        },

        getRange() {
            const start = document.getElementById('reportFromDate')?.value || monthStart(new Date().getFullYear(), 0);
            const end = document.getElementById('reportToDate')?.value || todayISO();
            return start <= end ? { start, end } : { start: end, end: start };
        },

        createMonthlyBuckets(start, end) {
            const startDate = new Date(start + 'T00:00:00');
            const endDate = new Date(end + 'T00:00:00');
            const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            const monthCount = Math.max(1, (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + endMonth.getMonth() - startMonth.getMonth() + 1);
            const firstOffset = Math.max(0, monthCount - 24);
            const buckets = [];
            for (let index = firstOffset; index < monthCount; index += 1) {
                const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);
                const key = toISO(date).slice(0, 7);
                buckets.push({ key, label: window.GMFinance.monthLabel(key), income: 0, expense: 0 });
            }
            return { buckets, omittedMonths: firstOffset };
        },

        getReceivables() {
            const paidBySale = new Map();
            this.data.payments.forEach(payment => {
                const key = String(payment.sale_id);
                paidBySale.set(key, (paidBySale.get(key) || 0) + window.GMFinance.paymentFlow(payment));
            });
            return this.data.sales
                .filter(sale => !sale.cancelled_at)
                .map(sale => ({
                    sale,
                    balance: Math.max(0, (Number(sale.total) || 0) - (paidBySale.get(String(sale.id)) || 0))
                }))
                .filter(item => item.balance > 0)
                .sort((a, b) => b.balance - a.balance);
        },

        renderReport() {
            const finance = window.GMFinance;
            if (!finance || !this.data.payments) return;
            const { start, end } = this.getRange();
            const payments = this.data.payments.filter(payment => insideRange(payment.payment_date, start, end));
            const manualIncomes = (this.data.manualIncomes || []).filter(income => insideRange(income.income_date, start, end));
            const expenses = this.data.expenses.filter(expense => insideRange(expense.expense_date, start, end));
            const periodSales = this.data.sales.filter(sale =>
                !sale.cancelled_at && insideRange(sale.sale_date, start, end)
            );
            const periodSalesTotal = periodSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
            const income = payments.filter(payment => !finance.isRefund(payment))
                .reduce((sum, payment) => sum + Math.abs(Number(payment.amount) || 0), 0) +
                manualIncomes.reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);
            const refunds = payments.filter(payment => finance.isRefund(payment))
                .reduce((sum, payment) => sum + Math.abs(Number(payment.amount) || 0), 0);
            const paidExpenses = expenses.filter(expense => finance.isPaid(expense.payment_status));
            const paidExpenseTotal = paidExpenses.reduce((sum, expense) => sum + Math.abs(Number(expense.amount) || 0), 0);
            const unpaidExpenses = expenses.filter(expense => !finance.isPaid(expense.payment_status));
            const unpaidTotal = unpaidExpenses.reduce((sum, expense) => sum + Math.abs(Number(expense.amount) || 0), 0);
            const cashOut = refunds + paidExpenseTotal;
            const receivables = this.getReceivables();
            const receivableTotal = receivables.reduce((sum, item) => sum + item.balance, 0);

            this.setText('reportIncome', finance.formatMoney(income));
            this.setText('reportExpense', finance.formatMoney(cashOut));
            this.setText('reportNet', finance.formatMoney(income - cashOut));
            this.setText('reportReceivable', finance.formatMoney(receivableTotal));
            this.setText('reportReceivableNote', `${receivables.length.toLocaleString('id-ID')} transaksi aktif belum lunas`);
            this.setText('reportPaymentCount', (payments.filter(payment => !finance.isRefund(payment)).length + manualIncomes.length).toLocaleString('id-ID'));
            this.setText('reportSaleCount', periodSales.length.toLocaleString('id-ID'));
            this.setText('reportSaleTotal', finance.formatMoney(periodSalesTotal));
            this.setText('reportPaidExpense', `${paidExpenses.length.toLocaleString('id-ID')} · ${finance.formatMoney(paidExpenseTotal)}`);
            this.setText('reportUnpaidExpense', unpaidExpenses.length.toLocaleString('id-ID'));
            this.setText('reportUnpaidAmount', finance.formatMoney(unpaidTotal));
            this.setText('reportAccountCount', `${this.data.accounts.length.toLocaleString('id-ID')} akun aktif`);

            const { buckets, omittedMonths } = this.createMonthlyBuckets(start, end);
            const bucketMap = new Map(buckets.map(bucket => [bucket.key, bucket]));
            payments.forEach(payment => {
                const bucket = bucketMap.get(String(payment.payment_date || '').slice(0, 7));
                if (!bucket) return;
                const flow = finance.paymentFlow(payment);
                if (flow >= 0) bucket.income += flow;
                else bucket.expense += Math.abs(flow);
            });
            manualIncomes.forEach(item => {
                const bucket = bucketMap.get(String(item.income_date || '').slice(0, 7));
                if (bucket) bucket.income += Math.abs(Number(item.amount) || 0);
            });
            paidExpenses.forEach(expense => {
                const bucket = bucketMap.get(String(expense.expense_date || '').slice(0, 7));
                if (bucket) bucket.expense += Math.abs(Number(expense.amount) || 0);
            });
            const chartCaption = omittedMonths
                ? `Menampilkan 24 bulan terakhir dalam periode terpilih (${omittedMonths} bulan awal tidak ditampilkan).`
                : `${window.GMFinance.formatDate(start)} – ${window.GMFinance.formatDate(end)} · dikelompokkan per bulan.`;
            this.setText('reportChartCaption', chartCaption);
            finance.renderBarChart(document.getElementById('reportCashflowChart'), buckets, 'Tidak ada arus kas pada periode ini.');

            const methodTotals = new Map();
            payments.filter(payment => !finance.isRefund(payment)).forEach(payment => {
                const label = finance.methodLabel(payment.payment_method) || 'Tidak diketahui';
                methodTotals.set(label, (methodTotals.get(label) || 0) + Math.abs(Number(payment.amount) || 0));
            });
            manualIncomes.forEach(item => {
                const label = finance.methodLabel(item.payment_method) || 'Tidak diketahui';
                methodTotals.set(label, (methodTotals.get(label) || 0) + Math.abs(Number(item.amount) || 0));
            });
            finance.renderBreakdown(
                document.getElementById('reportMethodBreakdown'),
                [...methodTotals].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount),
                'Belum ada pemasukan pada periode ini.'
            );

            const accountMap = new Map(this.data.accounts.map(account => [String(account.id), account.account_name]));
            const expenseByAccount = new Map();
            paidExpenses.forEach(expense => {
                const label = accountMap.get(String(expense.account_id)) || 'Akun tidak aktif / tidak diketahui';
                expenseByAccount.set(label, (expenseByAccount.get(label) || 0) + Math.abs(Number(expense.amount) || 0));
            });
            finance.renderBreakdown(
                document.getElementById('reportExpenseBreakdown'),
                [...expenseByAccount].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount),
                'Belum ada pengeluaran dibayar pada periode ini.'
            );

            this.renderPaymentRows(payments, accountMap, manualIncomes);
            this.renderExpenseRows(expenses, accountMap);
            this.showMessage('Data Laporan diperbarui dari modul Keuangan.');
        },

        renderAccounts(accountMap) {
            const container = document.getElementById('reportAccountSummary');
            if (!container) return;
            const cards = this.data.accounts.map(account => {
                const opening = Number(account.opening_balance) || 0;
                const inflows = this.data.payments
                    .filter(payment => String(payment.financial_account_id || '') === String(account.id))
                    .reduce((sum, payment) => sum + window.GMFinance.paymentFlow(payment), 0) +
                    (this.data.manualIncomes || [])
                        .filter(item => String(item.account_id) === String(account.id))
                        .reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);
                const expenses = this.data.expenses
                    .filter(expense => String(expense.account_id || '') === String(account.id) && window.GMFinance.isPaid(expense.payment_status))
                    .reduce((sum, expense) => sum + Math.abs(Number(expense.amount) || 0), 0);
                const balance = opening + inflows - expenses;
                return `<article class="finance-account-card ${balance < 0 ? 'is-negative' : ''}"><div class="finance-account-top"><span class="finance-account-icon">${escapeHTML((account.account_name || 'A').slice(0, 1).toUpperCase())}</span><div><strong>${escapeHTML(account.account_name || 'Akun keuangan')}</strong><small>${escapeHTML(account.account_type || account.bank_name || 'Akun aktif')}</small></div></div><span class="finance-account-balance-label">Saldo berjalan</span><strong class="finance-account-balance">${escapeHTML(window.GMFinance.formatMoney(balance))}</strong><div class="finance-account-breakdown"><span>Saldo awal <b>${escapeHTML(window.GMFinance.formatMoney(opening))}</b></span><span>Pemasukan <b>${escapeHTML(window.GMFinance.formatMoney(inflows))}</b></span><span>Pengeluaran dibayar <b>${escapeHTML(window.GMFinance.formatMoney(expenses))}</b></span></div></article>`;
            });
            const unallocated = this.data.payments
                .filter(payment => !payment.financial_account_id)
                .reduce((sum, payment) => sum + window.GMFinance.paymentFlow(payment), 0);
            container.innerHTML = cards.length
                ? `<div class="finance-account-grid">${cards.join('')}</div>${unallocated ? `<div class="finance-unallocated"><span>Arus pembayaran belum dialokasikan</span><strong>${escapeHTML(window.GMFinance.formatMoney(unallocated))}</strong></div>` : ''}`
                : '<p class="finance-empty">Belum ada akun keuangan aktif.</p>';
        },

        renderPaymentRows(payments, accountMap, manualIncomes = []) {
            const tbody = document.getElementById('reportPaymentRows');
            if (!tbody) return;
            const sales = new Map(this.data.sales.map(sale => [String(sale.id), sale]));
            const rows = [
                ...payments.map(payment => {
                    const sale = sales.get(String(payment.sale_id));
                    const refund = window.GMFinance.isRefund(payment);
                    return {
                        date: payment.payment_date,
                        reference: sale?.sale_number || '—',
                        kind: refund ? 'Pengembalian dana' : window.GMFinance.paymentTypeLabel(payment.payment_type),
                        method: window.GMFinance.methodLabel(payment.payment_method),
                        account: accountMap.get(String(payment.financial_account_id)) || 'Belum dialokasikan',
                        amount: Math.abs(Number(payment.amount) || 0),
                        negative: refund
                    };
                }),
                ...manualIncomes.map(item => ({
                    date: item.income_date,
                    reference: item.income_number || '—',
                    kind: item.description || 'Pemasukan manual',
                    method: window.GMFinance.methodLabel(item.payment_method),
                    account: accountMap.get(String(item.account_id)) || 'Akun tidak aktif / tidak diketahui',
                    amount: Math.abs(Number(item.amount) || 0),
                    negative: false
                }))
            ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
            tbody.innerHTML = rows.length ? rows.slice(0, 500).map(row => {
                return `<tr><td>${escapeHTML(window.GMFinance.formatDate(row.date))}</td><td>${escapeHTML(row.reference)}</td><td>${escapeHTML(row.kind)}</td><td>${escapeHTML(row.method)}</td><td>${escapeHTML(row.account)}</td><td class="numeric ${row.negative ? 'is-negative' : 'is-positive'}">${row.negative ? '− ' : '+ '}${escapeHTML(window.GMFinance.formatMoney(row.amount))}</td></tr>`;
            }).join('') : '<tr><td colspan="6" class="finance-empty-cell">Tidak ada pemasukan pada periode ini.</td></tr>';
            if (rows.length > 500) this.appendLimitNote(tbody, rows.length, 6);
        },

        renderExpenseRows(expenses, accountMap) {
            const tbody = document.getElementById('reportExpenseRows');
            if (!tbody) return;
            const rows = [...expenses].sort((a, b) => String(b.expense_date || '').localeCompare(String(a.expense_date || '')));
            tbody.innerHTML = rows.length ? rows.slice(0, 500).map(expense => `<tr>
                <td>${escapeHTML(window.GMFinance.formatDate(expense.expense_date))}</td>
                <td>${escapeHTML(expense.expense_number || '—')}</td>
                <td>${escapeHTML(expense.description || expense.notes || '—')}</td>
                <td>${escapeHTML(accountMap.get(String(expense.account_id)) || 'Akun tidak aktif / tidak diketahui')}</td>
                <td>${escapeHTML(window.GMFinance.methodLabel(expense.payment_method))}</td>
                <td><span class="finance-kind-badge ${window.GMFinance.isPaid(expense.payment_status) ? 'is-income' : 'is-pending'}">${window.GMFinance.isPaid(expense.payment_status) ? 'Dibayar' : 'Belum dibayar'}</span></td>
                <td class="numeric">${escapeHTML(window.GMFinance.formatMoney(expense.amount))}</td>
            </tr>`).join('') : '<tr><td colspan="7" class="finance-empty-cell">Tidak ada pengeluaran pada periode ini.</td></tr>';
            if (rows.length > 500) this.appendLimitNote(tbody, rows.length, 7);
        },

        appendLimitNote(tbody, count, colspan) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = colspan;
            cell.className = 'finance-empty-cell';
            cell.textContent = `Menampilkan 500 dari ${count.toLocaleString('id-ID')} baris. Atur periode yang lebih pendek untuk melihat bagian lain.`;
            row.appendChild(cell);
            tbody.appendChild(row);
        },

        setText(id, value) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        },

        showMessage(text, isError = false) {
            const element = document.getElementById('reportMessage');
            if (!element) return;
            element.textContent = text || '';
            element.classList.toggle('is-error', Boolean(isError));
        },

        printReport() {
            const root = document.querySelector('.gm-reports');
            if (!root) return;
            const popup = window.open('', '_blank');
            if (!popup) {
                this.showMessage('Pop-up diblokir. Izinkan pop-up untuk mencetak laporan.', true);
                return;
            }
            const title = `Laporan Keuangan ${this.getRange().start} - ${this.getRange().end}`;
            popup.document.open();
            popup.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${escapeHTML(title)}</title><style>
                @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font:9px/1.4 Arial,sans-serif;color:#202b3b;margin:0}.report-heading-actions,.report-filter-panel,.report-footnote,.finance-message{display:none!important}.gm-dashboard-heading{margin-bottom:10px!important}.gm-dashboard-heading h2{margin:0;color:#14243a;font-size:19px}.gm-dashboard-heading p{margin:3px 0;color:#667085}.finance-eyebrow{color:#9a743b;font-weight:bold;letter-spacing:.1em}.finance-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:8px 0}.finance-kpi,.report-secondary-kpis article{padding:8px;border:1px solid #d9dee6;border-radius:5px}.finance-kpi span,.finance-kpi small,.report-secondary-kpis span{display:block;color:#667085;font-size:8px}.finance-kpi strong,.report-secondary-kpis strong{display:block;margin:4px 0;color:#14243a;font-size:12px}.report-secondary-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:7px 0}.gm-dashboard-panel{padding:10px;margin:8px 0;border:1px solid #d9dee6;border-radius:5px;break-inside:avoid}.finance-section-heading{margin-bottom:6px}.finance-section-heading h3{margin:0;color:#14243a;font-size:12px}.finance-section-heading p{margin:2px 0;color:#667085;font-size:8px}.finance-chart-legend{display:flex;gap:12px;margin:3px 0}.finance-chart{display:flex;align-items:flex-end;height:105px;gap:4px}.finance-chart-group{flex:1;min-width:20px}.finance-chart-bars{height:85px;display:flex;align-items:flex-end;justify-content:center;gap:2px;border-bottom:1px solid #d9dee6}.finance-chart-bar{display:block;width:9px}.finance-chart-bar.is-income{background:#17966f}.finance-chart-bar.is-expense{background:#d26956}.finance-chart-group small{display:block;text-align:center;font-size:7px}.report-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.finance-breakdown-row{margin:4px 0}.finance-breakdown-row>div:first-child{display:flex;justify-content:space-between}.finance-breakdown-track{height:5px;background:#eef1f5}.finance-breakdown-track i{display:block;height:100%;background:#b08a4b}.finance-account-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.finance-account-card{padding:8px;border:1px solid #d9dee6;border-radius:5px}.finance-account-top{display:flex;gap:6px;align-items:center}.finance-account-icon{display:none}.finance-account-top strong,.finance-account-top small{display:block}.finance-account-balance-label,.finance-account-breakdown span{display:block;color:#667085;font-size:8px}.finance-account-balance{display:block;color:#14243a;font-size:12px}.finance-account-breakdown{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:5px}.finance-table-wrap{overflow:visible}.finance-table{width:100%;border-collapse:collapse;font-size:7px}.finance-table th,.finance-table td{padding:4px;border:1px solid #cfd5dd;text-align:left;vertical-align:top;overflow-wrap:anywhere}.finance-table th{background:#eef1f5;color:#14243a}.finance-table .numeric{text-align:right;white-space:nowrap}.finance-kind-badge{padding:2px 4px;border:1px solid #d9dee6;border-radius:3px}.finance-chart-scroll{overflow:visible}
                </style></head><body>${root.outerHTML}<script>window.addEventListener('load',function(){setTimeout(function(){window.focus();window.print()},350)})</script></body></html>`);
            popup.document.close();
        }
    };

    window.GMReports = Reports;
})();
