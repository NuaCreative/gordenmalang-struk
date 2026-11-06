
(() => {
    'use strict';

    const STATUSES = [
        { value: 'waiting', label: 'Menunggu Produksi' },
        { value: 'in_production', label: 'Proses Produksi' },
        { value: 'ready_for_installation', label: 'Siap Dipasang' },
        { value: 'completed', label: 'Selesai' },
        { value: 'cancelled', label: 'Dibatalkan' }
    ];

    const escapeHTML = value =>
        String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);

    const money = value =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(Number(value) || 0);

    function getClient() {
        return window.gmSupabase || window.supabaseClient || null;
    }

    function formatDate(value) {
        if (!value) return '-';

        const parts = String(value).slice(0, 10).split('-');
        if (parts.length !== 3) return value;

        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        ).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    const Production = {
        sales: [],
        customers: [],
        items: [],
        productionOrders: [],
        search: '',
        statusFilter: '',
        initialized: false,

        render() {
            return `
                <section class="production-module">
                    <div class="production-header">
                        <div>
                            <p>
                                Pantau pesanan pelanggan dan progres
                                pengerjaan produk Gorden Malang.
                            </p>
                        </div>

                        <button type="button"
                            id="productionRefresh"
                            class="production-secondary-btn">
                            Muat Ulang
                        </button>
                    </div>

                    <div id="productionMessage"
                        role="status"
                        aria-live="polite"></div>

                    <div class="production-stats">
                        <div class="production-stat">
                            <span>Total Pesanan</span>
                            <strong id="productionTotal">0</strong>
                        </div>
                        <div class="production-stat">
                            <span>Menunggu</span>
                            <strong id="productionWaiting">0</strong>
                        </div>
                        <div class="production-stat">
                            <span>Proses Produksi</span>
                            <strong id="productionProgress">0</strong>
                        </div>
                        <div class="production-stat">
                            <span>Siap Dipasang</span>
                            <strong id="productionReady">0</strong>
                        </div>
                        <div class="production-stat">
                            <span>Selesai</span>
                            <strong id="productionCompleted">0</strong>
                        </div>
                    </div>

                    <div class="production-panel">
                        <div class="production-list-header">
                            <h3>Daftar Pesanan</h3>

                            <div class="production-filters">
                                <input type="search"
                                    id="productionSearch"
                                    placeholder="Cari nomor atau pelanggan..."
                                    aria-label="Cari pesanan">

                                <select id="productionStatusFilter"
                                    aria-label="Filter status produksi">
                                    <option value="">Semua Status</option>
                                    ${STATUSES.map(status => `
                                        <option value="${status.value}">
                                            ${status.label}
                                        </option>
                                    `).join('')}
                                    <option value="not_created">
                                        Belum Ada Status Produksi
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div class="production-table-wrap">
                            <table class="production-table">
                                <thead>
                                    <tr>
                                        <th>Nomor Pesanan</th>
                                        <th>Pelanggan</th>
                                        <th>Tanggal</th>
                                        <th>Total</th>
                                        <th>Pembayaran</th>
                                        <th>Status Produksi</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="productionTableBody">
                                    <tr>
                                        <td colspan="7">Memuat pesanan...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="production-panel"
                        id="productionDetailPanel"
                        hidden>
                        <div class="production-list-header">
                            <h3>Detail Pesanan</h3>
                            <button type="button"
                                id="productionCloseDetail"
                                class="production-secondary-btn">
                                Tutup
                            </button>
                        </div>
                        <div id="productionDetailContent"></div>
                    </div>
                </section>
            `;
        },

        async init() {
            const client = getClient();

            if (!client) {
                this.showMessage(
                    'Client Supabase tidak ditemukan. Periksa config.js.',
                    true
                );
                return;
            }

            this.bindEvents();
            this.showMessage('Memuat data pesanan...');

            try {
                const [
                    salesResult,
                    customersResult,
                    itemsResult,
                    productionResult
                ] = await Promise.all([
                    client.from('sales')
                        .select(`
                            id,
                            sale_number,
                            customer_id,
                            sale_date,
                            subtotal,
                            discount,
                            total,
                            payment_status,
                            notes
                        `)
                        .order('sale_date', { ascending: false }),

                    client.from('customers')
                        .select('id, full_name, phone, address'),

                    client.from('sale_items')
                        .select(`
                            id,
                            sale_id,
                            item_name,
                            description,
                            quantity,
                            unit,
                            unit_price,
                            line_total
                        `),

                    client.from('production_orders')
                        .select(`
                            id,
                            sale_id,
                            status,
                            production_notes,
                            started_at,
                            completed_at,
                            created_at,
                            updated_at
                        `)
                ]);

                const errors = [
                    salesResult.error,
                    customersResult.error,
                    itemsResult.error,
                    productionResult.error
                ].filter(Boolean);

                if (errors.length) {
                    throw new Error(
                        errors.map(error => error.message).join(' | ')
                    );
                }

                this.sales = salesResult.data || [];
                this.customers = customersResult.data || [];
                this.items = itemsResult.data || [];
                this.productionOrders = productionResult.data || [];

                this.renderStats();
                this.renderTable();

                this.showMessage(
                    `Data berhasil dimuat: ${this.sales.length} pesanan.`,
                    false,
                    true
                );
            } catch (error) {
                console.error(
                    'Gagal memuat modul Produksi:',
                    error
                );

                this.showMessage(
                    'Gagal memuat data. Periksa tabel, koneksi, dan RLS Supabase. ' +
                    error.message,
                    true
                );
            }
        },

        bindEvents() {
            const root = document.querySelector('.production-module');

            if (!root || root.dataset.eventsBound === 'true') return;

            root.dataset.eventsBound = 'true';

            root.addEventListener('click', event => {
                const button = event.target.closest('button');
                if (!button) return;

                if (button.id === 'productionRefresh') {
                    this.init();
                }

                if (button.id === 'productionCloseDetail') {
                    const panel = document.getElementById(
                        'productionDetailPanel'
                    );
                    if (panel) panel.hidden = true;
                }

                if (button.dataset.action === 'detail') {
                    this.showDetail(button.dataset.id);
                }

                if (button.dataset.action === 'save-status') {
                    this.saveStatus(button.dataset.id);
                }

                if (button.dataset.action === 'delete-cancelled-production') {
                    this.deleteCancelledProduction(button.dataset.id);
                }
            });

            root.addEventListener('change', event => {
                if (event.target.id === 'productionStatusFilter') {
                    this.statusFilter = event.target.value;
                    this.renderTable();
                }
            });

            root.addEventListener('input', event => {
                if (event.target.id === 'productionSearch') {
                    this.search = event.target.value.trim().toLowerCase();
                    this.renderTable();
                }
            });
        },

        getProduction(saleId) {
            return this.productionOrders.find(
                order => order.sale_id === saleId
            ) || null;
        },

        getCustomer(customerId) {
            return this.customers.find(
                customer => customer.id === customerId
            ) || null;
        },

        getStatusLabel(status) {
            return STATUSES.find(
                item => item.value === status
            )?.label || status || 'Belum diatur';
        },

        renderStats() {
            const getCount = status =>
                this.sales.filter(sale =>
                    this.getProduction(sale.id)?.status === status
                ).length;

            document.getElementById('productionTotal').textContent =
                this.sales.length;

            document.getElementById('productionWaiting').textContent =
                getCount('waiting');

            document.getElementById('productionProgress').textContent =
                getCount('in_production');

            document.getElementById('productionReady').textContent =
                getCount('ready_for_installation');

            document.getElementById('productionCompleted').textContent =
                getCount('completed');
        },

        renderTable() {
            const tbody = document.getElementById(
                'productionTableBody'
            );

            if (!tbody) return;

            const filtered = this.sales.filter(sale => {
                const customer = this.getCustomer(sale.customer_id);
                const production = this.getProduction(sale.id);

                const searchable = [
                    sale.sale_number,
                    customer?.full_name,
                    customer?.phone
                ].join(' ').toLowerCase();

                const matchesSearch =
                    !this.search || searchable.includes(this.search);

                const matchesStatus =
                    !this.statusFilter ||
                    (this.statusFilter === 'not_created'
                        ? !production
                        : production?.status === this.statusFilter);

                return matchesSearch && matchesStatus;
            });

            if (!filtered.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            Tidak ada pesanan yang cocok.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filtered.map(sale => {
                const customer = this.getCustomer(sale.customer_id);
                const production = this.getProduction(sale.id);
                const status = production?.status || 'not_created';

                return `
                    <tr>
                        <td>
                            <strong>${escapeHTML(sale.sale_number)}</strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                customer?.full_name ||
                                'Pelanggan tidak ditemukan'
                            )}
                            <br>
                            <small>${escapeHTML(customer?.phone || '')}</small>
                        </td>

                        <td>${escapeHTML(formatDate(sale.sale_date))}</td>

                        <td>${escapeHTML(money(sale.total))}</td>

                        <td>
                            ${escapeHTML(sale.payment_status || '-')}
                        </td>

                        <td>
                            <span class="production-status status-${escapeHTML(status)}">
                                ${escapeHTML(
                                    production
                                        ? this.getStatusLabel(production.status)
                                        : 'Belum diatur'
                                )}
                            </span>
                        </td>

                        <td>
                            <button type="button"
                                class="production-primary-btn"
                                data-action="detail"
                                data-id="${escapeHTML(sale.id)}">
                                Detail / Kelola
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        },

        showDetail(saleId) {
            const sale = this.sales.find(
                item => item.id === saleId
            );

            if (!sale) {
                this.showMessage('Pesanan tidak ditemukan.', true);
                return;
            }

            const customer = this.getCustomer(sale.customer_id);
            const production = this.getProduction(sale.id);

            const saleItems = this.items.filter(
                item => item.sale_id === sale.id
            );

            const panel = document.getElementById(
                'productionDetailPanel'
            );
            const content = document.getElementById(
                'productionDetailContent'
            );

            if (!panel || !content) return;

            content.innerHTML = `
                <div class="production-detail-grid">
                    <div>
                        <span>Nomor Pesanan</span>
                        <strong>${escapeHTML(sale.sale_number)}</strong>
                    </div>
                    <div>
                        <span>Pelanggan</span>
                        <strong>${escapeHTML(customer?.full_name || '-')}</strong>
                    </div>
                    <div>
                        <span>Kontak</span>
                        <strong>${escapeHTML(customer?.phone || '-')}</strong>
                    </div>
                    <div>
                        <span>Tanggal Pesanan</span>
                        <strong>${escapeHTML(formatDate(sale.sale_date))}</strong>
                    </div>
                    <div>
                        <span>Total Transaksi</span>
                        <strong>${escapeHTML(money(sale.total))}</strong>
                    </div>
                    <div>
                        <span>Status Pembayaran</span>
                        <strong>${escapeHTML(sale.payment_status || '-')}</strong>
                    </div>
                </div>

                <h4>Rincian Barang</h4>

                <div class="production-table-wrap">
                    <table class="production-table">
                        <thead>
                            <tr>
                                <th>Nama Barang</th>
                                <th>Deskripsi</th>
                                <th>Jumlah</th>
                                <th>Harga Satuan</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${saleItems.length ? saleItems.map(item => `
                                <tr>
                                    <td>${escapeHTML(item.item_name)}</td>
                                    <td>${escapeHTML(item.description || '-')}</td>
                                    <td>
                                        ${escapeHTML(item.quantity)}
                                        ${escapeHTML(item.unit)}
                                    </td>
                                    <td>${escapeHTML(money(item.unit_price))}</td>
                                    <td>${escapeHTML(money(
                                        item.line_total ??
                                        Number(item.quantity) * Number(item.unit_price)
                                    ))}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="5">
                                        Tidak ada rincian barang.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>

                <form id="productionStatusForm"
                    data-sale-id="${escapeHTML(sale.id)}">

                    <h4>Pengelolaan Produksi</h4>

                    <label class="production-form-label">
                        Status Produksi
                        <select name="status" required>
                            ${STATUSES.map(status => `
                                <option value="${status.value}"
                                    ${(production?.status || 'waiting') === status.value
                                        ? 'selected'
                                        : ''}>
                                    ${status.label}
                                </option>
                            `).join('')}
                        </select>
                    </label>

                    <label class="production-form-label">
                        Catatan Produksi
                        <textarea name="production_notes"
                            rows="4"
                            placeholder="Contoh: warna kain, ukuran, model lipatan, detail pengerjaan..."
                        >${escapeHTML(production?.production_notes || '')}</textarea>
                    </label>

                    <button type="submit"
                        class="production-primary-btn"
                        id="productionSaveButton">
                        Simpan Status Produksi
                    </button>
                </form>
                ${production?.status === 'cancelled' ? `
                    <button type="button"
                        class="production-delete-btn"
                        data-action="delete-cancelled-production"
                        data-id="${escapeHTML(production.id)}">
                        Hapus Data Produksi Batal
                    </button>
                ` : ''}
            `;

            const form = document.getElementById(
                'productionStatusForm'
            );

            form.addEventListener('submit', event => {
                event.preventDefault();
                this.saveStatus(sale.id);
            });

            panel.hidden = false;
            panel.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        },

        async deleteCancelledProduction(productionId) {
            const client = getClient();
            if (!client || !productionId) return;

            const production = this.productionOrders.find(order =>
                String(order.id) === String(productionId)
            );
            if (production?.status !== 'cancelled') {
                this.showMessage('Hanya data produksi berstatus dibatalkan yang dapat dihapus.', true);
                return;
            }

            if (!window.confirm(
                'Hapus permanen data produksi yang dibatalkan? Data transaksi penjualannya tetap disimpan.'
            )) return;

            try {
                const { error } = await client.rpc('delete_gm_cancelled_production', {
                    p_production_id: productionId
                });
                if (error) throw error;

                const panel = document.getElementById('productionDetailPanel');
                if (panel) panel.hidden = true;
                await this.init();
                this.showMessage('Data produksi yang dibatalkan berhasil dihapus. Transaksi tetap tersimpan.');
            } catch (error) {
                console.error('Gagal menghapus produksi batal:', error);
                this.showMessage('Data produksi tidak dapat dihapus: ' + (error.message || error), true);
            }
        },

        async saveStatus(saleId) {
            const client = getClient();
            const form = document.getElementById(
                'productionStatusForm'
            );

            if (!client || !form) return;

            const data = new FormData(form);
            const status = String(data.get('status') || '');
            const notes = String(
                data.get('production_notes') || ''
            ).trim();

            if (!STATUSES.some(item => item.value === status)) {
                this.showMessage('Status produksi tidak valid.', true);
                return;
            }

            const existing = this.getProduction(saleId);
            const now = new Date().toISOString();

            const record = {
                sale_id: saleId,
                status,
                production_notes: notes || null,
                started_at: existing?.started_at ||
                    (status === 'in_production' ? now : null),
                completed_at: status === 'completed'
                    ? (existing?.completed_at || now)
                    : null,
                updated_at: now
            };

            const button = document.getElementById(
                'productionSaveButton'
            );

            if (button) {
                button.disabled = true;
                button.textContent = 'Menyimpan...';
            }

            try {
                const { error } = await client
                    .from('production_orders')
                    .upsert(record, {
                        onConflict: 'sale_id'
                    });

                if (error) throw error;

                this.showMessage('Status produksi berhasil disimpan.');

                await this.init();
                this.showDetail(saleId);
            } catch (error) {
                console.error(
                    'Gagal menyimpan status produksi:',
                    error
                );

                this.showMessage(
                    'Gagal menyimpan status: ' + error.message,
                    true
                );

                if (button) {
                    button.disabled = false;
                    button.textContent = 'Simpan Status Produksi';
                }
            }
        },

        showMessage(message, isError = false, quiet = false) {
            const element = document.getElementById(
                'productionMessage'
            );

            if (!element) return;

            element.textContent = quiet ? '' : message;
            element.className = quiet
                ? ''
                : isError
                    ? 'production-message production-message-error'
                    : 'production-message production-message-success';
        }
    };

    window.GMProduction = Production;
})();
