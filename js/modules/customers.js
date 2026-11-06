
(() => {
    'use strict';

    const Customers = {
        render() {
            return `
                <section class="gm-dashboard">

                    <div class="gm-dashboard-heading">
                        <div>
                            <p>Kelola pelanggan, pengukuran, dan riwayat transaksi.</p>
                        </div>

                        <button type="button" class="btn" id="customerAddButton">
                            + Tambah Pelanggan
                        </button>
                    </div>

                    <!-- FORM PELANGGAN -->
                    <section class="gm-dashboard-panel"
                        id="customerFormPanel" hidden>

                        <h3 id="customerFormTitle">Tambah Pelanggan</h3>

                        <form id="customerForm">
                            <div class="gm-customer-form-grid">
                                <label>
                                    Nama lengkap *
                                    <input name="full_name" required maxlength="150"
                                        placeholder="Nama pelanggan">
                                </label>

                                <label>
                                    Nomor kontak (WhatsApp / telepon)
                                    <input name="contact_number" inputmode="tel"
                                        placeholder="08xxxxxxxxxx">
                                </label>

                                <label>
                                    Kode pelanggan
                                    <input name="customer_code" maxlength="50"
                                        placeholder="Opsional">
                                </label>

                                <label class="gm-customer-full">
                                    Alamat
                                    <textarea name="address" rows="2"
                                        placeholder="Alamat lengkap pelanggan"></textarea>
                                </label>

                                <label class="gm-customer-full">
                                    Catatan
                                    <textarea name="notes" rows="2"
                                        placeholder="Catatan tambahan"></textarea>
                                </label>
                            </div>

                            <div class="gm-customer-form-actions">
                                <button type="submit" class="btn"
                                    id="customerSaveButton">
                                    Simpan Pelanggan
                                </button>

                                <button type="button" class="btn light"
                                    id="customerCancelButton">
                                    Batal
                                </button>
                            </div>
                        </form>
                    </section>

                    <!-- DAFTAR PELANGGAN -->
                    <section class="gm-dashboard-panel" id="customerListPanel">
                        <div class="gm-customer-toolbar">
                            <input type="search" id="customerSearch"
                                placeholder="Cari nama, kode, atau nomor telepon...">

                            <span id="customerCount">Memuat data...</span>
                        </div>

                        <p id="customerMessage"
                            class="gm-dashboard-message"
                            role="status" aria-live="polite"></p>

                        <div class="gm-customer-table-wrap">
                            <table class="gm-dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Kode</th>
                                        <th>Nama Pelanggan</th>
                                        <th>Nomor Kontak</th>
                                        <th>Alamat</th>
                                        <th>Catatan</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>

                                <tbody id="customerRows">
                                    <tr>
                                        <td colspan="6">Memuat data pelanggan...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <!-- DETAIL PELANGGAN -->
                    <section class="gm-dashboard-panel"
                        id="customerDetailPanel" hidden>

                        <div class="gm-dashboard-heading">
                            <div>
                                <h2 id="customerDetailName">Detail Pelanggan</h2>
                                <p id="customerDetailSubtitle">
                                    Informasi dan riwayat pelanggan.
                                </p>
                            </div>

                            <div class="gm-customer-detail-actions">
                                <button type="button" class="btn light"
                                    id="customerDetailRefresh">
                                    Muat Ulang
                                </button>

                                <button type="button" class="btn light"
                                    id="customerDetailBack">
                                    Kembali
                                </button>
                            </div>
                        </div>

                        <p id="customerDetailMessage"
                            class="gm-dashboard-message"
                            role="status" aria-live="polite"></p>

                        <!-- INFORMASI -->
                        <section class="gm-customer-detail-section">
                            <h3>Informasi Pelanggan</h3>

                            <div class="gm-customer-detail-grid">
                                <div>
                                    <small>Kode Pelanggan</small>
                                    <strong id="detailCustomerCode">—</strong>
                                </div>

                                <div>
                                    <small>Nama Lengkap</small>
                                    <strong id="detailCustomerName">—</strong>
                                </div>

                                <div>
                                    <small>Nomor Kontak</small>
                                    <strong id="detailCustomerContact">—</strong>
                                </div>

                                <div class="gm-customer-detail-full">
                                    <small>Alamat</small>
                                    <strong id="detailCustomerAddress">—</strong>
                                </div>

                                <div class="gm-customer-detail-full">
                                    <small>Catatan</small>
                                    <strong id="detailCustomerNotes">—</strong>
                                </div>

                                <div>
                                    <small>Terdaftar Sejak</small>
                                    <strong id="detailCustomerCreated">—</strong>
                                </div>
                            </div>

                            <button type="button" class="btn"
                                id="customerDetailEdit">
                                Edit Data Pelanggan
                            </button>
                        </section>

                        <!-- RINGKASAN -->
                        <section class="gm-customer-detail-section">
                            <h3>Ringkasan Pelanggan</h3>

                            <div class="gm-customer-stat-grid">
                                <div class="gm-customer-stat">
                                    <span>Total Pengukuran</span>
                                    <strong id="detailMeasurementCount">0</strong>
                                </div>

                                <div class="gm-customer-stat">
                                    <span>Total Transaksi</span>
                                    <strong id="detailSalesCount">0</strong>
                                </div>

                                <div class="gm-customer-stat">
                                    <span>Nilai Transaksi Aktif</span>
                                    <strong id="detailSalesTotal">Rp0</strong>
                                </div>

                                <div class="gm-customer-stat">
                                    <span>Total Sudah Dibayar</span>
                                    <strong id="detailSalesPaid">Rp0</strong>
                                </div>

                                <div class="gm-customer-stat">
                                    <span>Sisa Tagihan Aktif</span>
                                    <strong id="detailSalesBalance">Rp0</strong>
                                </div>
                            </div>
                        </section>

                        <!-- RIWAYAT PENGUKURAN -->
                        <section class="gm-customer-detail-section">
                            <h3>Riwayat Pengukuran</h3>

                            <p>
                                Pilih tombol PDF untuk membuka lembar ukuran per ruangan yang siap dicetak atau disimpan.
                            </p>

                            <div class="gm-customer-table-wrap">
                                <table class="gm-dashboard-table gm-customer-measurement-table">
                                    <thead>
                                        <tr>
                                            <th>Nomor Pengukuran</th>
                                            <th>Tanggal</th>
                                            <th>Jadwal</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>

                                    <tbody id="customerMeasurementRows">
                                        <tr>
                                            <td colspan="5">Memuat riwayat...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <!-- RIWAYAT TRANSAKSI -->
                        <section class="gm-customer-detail-section">
                            <h3>Riwayat Transaksi</h3>

                            <p>
                                Tombol PDF membuka rincian transaksi, pembayaran, dan sisa tagihan dalam format cetak.
                            </p>

                            <div class="gm-customer-table-wrap">
                                <table class="gm-dashboard-table gm-customer-sales-table">
                                    <thead>
                                        <tr>
                                            <th>Nomor Transaksi</th>
                                            <th>Tanggal</th>
                                            <th>Total</th>
                                            <th>Dibayar</th>
                                            <th>Sisa</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>

                                    <tbody id="customerSalesRows">
                                        <tr>
                                            <td colspan="7">Memuat riwayat...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </section>
                </section>
            `;
        },

        async init() {
            const db = window.gmSupabase || window.supabaseClient;

            const $ = id => document.getElementById(id);

            const rows = $('customerRows');
            const search = $('customerSearch');
            const count = $('customerCount');
            const message = $('customerMessage');
            const formPanel = $('customerFormPanel');
            const formTitle = $('customerFormTitle');
            const form = $('customerForm');
            const saveButton = $('customerSaveButton');
            const addButton = $('customerAddButton');
            const cancelButton = $('customerCancelButton');
            const detailPanel = $('customerDetailPanel');
            const listPanel = $('customerListPanel');

            if (!db || !rows || !form) {
                console.error(
                    'Supabase atau elemen modul pelanggan tidak ditemukan.'
                );
                return;
            }

            let customers = [];
            let editingCustomerId = null;
            let selectedCustomerId = null;
            let busy = false;
            let detailLoading = false;
            let detailRequestId = 0;

            const showMessage = text => {
                message.textContent = text || '';
            };

            const showDetailMessage = text => {
                $('customerDetailMessage').textContent = text || '';
            };

            const formatDate = value => {
                if (!value) return '—';

                const date = new Date(value);

                if (Number.isNaN(date.getTime())) return '—';

                return date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            };

            const formatMoney = value => {
                const amount = Number(value);

                if (!Number.isFinite(amount)) return '—';

                return amount.toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0
                });
            };

            const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[char]);

            const openPrintWindow = title => {
                const printWindow = window.open('', '_blank');
                if (!printWindow) {
                    showDetailMessage(
                        'Pop-up diblokir browser. Izinkan pop-up untuk membuka PDF riwayat.'
                    );
                    return null;
                }

                printWindow.document.open();
                printWindow.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(title || 'Menyiapkan PDF')}</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#263244"><h2>Menyiapkan PDF...</h2><p>Dialog cetak akan terbuka setelah data siap.</p></body></html>`);
                printWindow.document.close();
                return printWindow;
            };

            const writePrintWindow = (printWindow, html) => {
                if (!printWindow || printWindow.closed) return;
                printWindow.document.open();
                printWindow.document.write(html);
                printWindow.document.close();
            };

            const firstValue = (record, keys) => {
                for (const key of keys) {
                    if (
                        record?.[key] !== undefined &&
                        record?.[key] !== null &&
                        record[key] !== ''
                    ) {
                        return record[key];
                    }
                }

                return null;
            };

            const addCell = (row, value) => {
                const cell = document.createElement('td');

                cell.textContent =
                    value === null ||
                    value === undefined ||
                    value === ''
                        ? '—'
                        : String(value);

                row.appendChild(cell);
                return cell;
            };

            function setDetailText(id, value) {
                const element = $(id);

                if (element) {
                    element.textContent =
                        value === null ||
                        value === undefined ||
                        value === ''
                            ? '—'
                            : String(value);
                }
            }

            function setBusy(value) {
                busy = value;

                saveButton.disabled = value;
                addButton.disabled = value;
                cancelButton.disabled = value;

                rows.querySelectorAll('button').forEach(button => {
                    button.disabled = value;
                });
            }

            function resetForm() {
                form.reset();
                editingCustomerId = null;

                formTitle.textContent = 'Tambah Pelanggan';
                saveButton.textContent = 'Simpan Pelanggan';
                formPanel.hidden = true;
            }

            function openAddForm() {
                if (busy) return;

                form.reset();
                editingCustomerId = null;

                formTitle.textContent = 'Tambah Pelanggan';
                saveButton.textContent = 'Simpan Pelanggan';
                formPanel.hidden = false;

                showMessage('');

                form.elements.full_name.focus();

                formPanel.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }

            function openEditForm(customer) {
                if (busy) return;

                editingCustomerId = customer.id;

                form.elements.full_name.value =
                    customer.full_name || '';

                form.elements.contact_number.value =
                    customer.whatsapp || customer.phone || '';

                form.elements.customer_code.value =
                    customer.customer_code || '';

                form.elements.address.value =
                    customer.address || '';

                form.elements.notes.value =
                    customer.notes || '';

                formTitle.textContent = 'Edit Data Pelanggan';
                saveButton.textContent = 'Simpan Perubahan';
                formPanel.hidden = false;

                showMessage(`Mengedit data ${customer.full_name}.`);

                form.elements.full_name.focus();

                formPanel.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }

            // DAFTAR PELANGGAN
            function renderRows() {
                const keyword = search.value.trim().toLowerCase();

                const filtered = customers.filter(customer => {
                    const searchable = [
                        customer.customer_code,
                        customer.full_name,
                        customer.phone,
                        customer.whatsapp,
                        customer.address,
                        customer.notes
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();

                    return searchable.includes(keyword);
                });

                rows.replaceChildren();
                count.textContent = `${filtered.length} pelanggan`;

                if (!filtered.length) {
                    const row = document.createElement('tr');
                    const cell = document.createElement('td');

                    cell.colSpan = 6;
                    cell.textContent = customers.length
                        ? 'Pelanggan tidak ditemukan.'
                        : 'Belum ada data pelanggan.';

                    row.appendChild(cell);
                    rows.appendChild(row);
                    return;
                }

                filtered.forEach(customer => {
                    const row = document.createElement('tr');

                    addCell(row, customer.customer_code);

                    const nameCell = document.createElement('td');
                    const nameButton = document.createElement('button');

                    nameButton.type = 'button';
                    nameButton.className = 'gm-customer-name-link';
                    nameButton.textContent = customer.full_name || '—';

                    nameButton.addEventListener('click', () => {
                        openCustomerDetail(customer.id);
                    });

                    nameCell.appendChild(nameButton);
                    row.appendChild(nameCell);

                    addCell(row, customer.whatsapp || customer.phone);
                    addCell(row, customer.address);
                    addCell(row, customer.notes);

                    const actionCell = document.createElement('td');
                    actionCell.className = 'gm-customer-actions';

                    const editButton = document.createElement('button');
                    editButton.type = 'button';
                    editButton.className = 'btn light';
                    editButton.textContent = 'Edit';

                    editButton.addEventListener('click', () => {
                        openEditForm(customer);
                    });

                    const deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.className = 'btn gm-customer-delete';
                    deleteButton.textContent = 'Hapus';

                    deleteButton.addEventListener('click', () => {
                        deleteCustomer(customer);
                    });

                    actionCell.append(editButton, deleteButton);
                    row.appendChild(actionCell);
                    rows.appendChild(row);
                });
            }

            // MEMUAT PELANGGAN
            async function loadCustomers() {
                showMessage('Memuat data pelanggan...');

                const { data, error } = await db
                    .from('customers')
                    .select(
                        'id,customer_code,full_name,phone,whatsapp,address,notes,created_at'
                    )
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Gagal memuat pelanggan:', error);
                    showMessage('Data gagal dimuat: ' + error.message);
                    return false;
                }

                customers = data || [];
                renderRows();
                showMessage('');

                return true;
            }

            // MODAL DETAIL RIWAYAT
            function openHistoryDetail(title, record) {
                let modal = $('gmHistoryDetailModal');

                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'gmHistoryDetailModal';
                    modal.className = 'gm-history-modal';
                    modal.hidden = true;

                    modal.innerHTML = `
                        <div class="gm-history-modal-card"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="gmHistoryModalTitle">

                            <div class="gm-history-modal-header">
                                <div>
                                    <h3 id="gmHistoryModalTitle">Detail Riwayat</h3>
                                    <p>Informasi dari data tersimpan.</p>
                                </div>

                                <button type="button"
                                    class="gm-history-modal-close"
                                    aria-label="Tutup detail">&times;</button>
                            </div>

                            <div id="gmHistoryModalBody"
                                class="gm-history-modal-body"></div>

                            <div class="gm-history-modal-footer">
                                <button type="button"
                                    class="btn light"
                                    id="gmHistoryModalCloseButton">
                                    Tutup
                                </button>
                            </div>
                        </div>
                    `;

                    document.body.appendChild(modal);

                    const closeModal = () => {
                        modal.hidden = true;
                    };

                    modal.querySelector(
                        '.gm-history-modal-close'
                    ).addEventListener('click', closeModal);

                    modal.querySelector(
                        '#gmHistoryModalCloseButton'
                    ).addEventListener('click', closeModal);

                    modal.addEventListener('click', event => {
                        if (event.target === modal) closeModal();
                    });

                    document.addEventListener('keydown', event => {
                        if (event.key === 'Escape' && !modal.hidden) {
                            closeModal();
                        }
                    });
                }

                $('gmHistoryModalTitle').textContent = title;

                const body = $('gmHistoryModalBody');
                body.replaceChildren();

                const heading = document.createElement('h4');
                heading.className = 'gm-history-detail-heading';
                heading.textContent = 'Informasi Lengkap';
                body.appendChild(heading);

                const grid = document.createElement('div');
                grid.className = 'gm-history-detail-grid';

                Object.entries(record || {}).forEach(([key, value]) => {
                    const item = document.createElement('div');
                    item.className = 'gm-history-detail-item';

                    const label = document.createElement('small');
                    label.textContent = key
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, char => char.toUpperCase());

                    const valueElement = document.createElement('div');
                    valueElement.className = 'gm-history-detail-value';

                    if (value === null || value === undefined || value === '') {
                        valueElement.textContent = '—';
                    } else if (typeof value === 'object') {
                        valueElement.textContent = JSON.stringify(value, null, 2);
                    } else {
                        valueElement.textContent = String(value);
                    }

                    item.append(label, valueElement);
                    grid.appendChild(item);
                });

                body.appendChild(grid);
                modal.hidden = false;

                modal.querySelector('.gm-history-modal-close').focus();
            }

            function openHistorySections(title, sections) {
                // Pakai modal yang sama dengan detail riwayat lama, tetapi susun
                // pengukuran dan transaksi dalam kelompok yang mudah dipindai.
                openHistoryDetail(title, {});
                const body = $('gmHistoryModalBody');
                body.replaceChildren();

                sections.forEach(section => {
                    const sectionElement = document.createElement('section');
                    sectionElement.className = 'gm-history-detail-section';

                    const heading = document.createElement('h4');
                    heading.className = 'gm-history-detail-heading';
                    heading.textContent = section.title;
                    sectionElement.appendChild(heading);

                    if (section.fields?.length) {
                        const grid = document.createElement('div');
                        grid.className = 'gm-history-detail-grid';

                        section.fields.forEach(([labelText, value]) => {
                            const item = document.createElement('div');
                            item.className = 'gm-history-detail-item';

                            const label = document.createElement('small');
                            label.textContent = labelText;

                            const valueElement = document.createElement('div');
                            valueElement.className = 'gm-history-detail-value';
                            valueElement.textContent = value === null || value === undefined || value === ''
                                ? '—'
                                : String(value);

                            item.append(label, valueElement);
                            grid.appendChild(item);
                        });

                        sectionElement.appendChild(grid);
                    }

                    if (section.columns?.length) {
                        const tableWrap = document.createElement('div');
                        tableWrap.className = 'gm-history-detail-table-wrap';

                        const table = document.createElement('table');
                        table.className = 'gm-history-detail-table';
                        const head = document.createElement('thead');
                        const headRow = document.createElement('tr');
                        section.columns.forEach(column => {
                            const cell = document.createElement('th');
                            cell.textContent = column;
                            headRow.appendChild(cell);
                        });
                        head.appendChild(headRow);
                        table.appendChild(head);

                        const tableBody = document.createElement('tbody');
                        if (!section.rows?.length) {
                            const row = document.createElement('tr');
                            const cell = document.createElement('td');
                            cell.colSpan = section.columns.length;
                            cell.textContent = section.emptyText || 'Belum ada data.';
                            row.appendChild(cell);
                            tableBody.appendChild(row);
                        } else {
                            section.rows.forEach(values => {
                                const row = document.createElement('tr');
                                values.forEach(value => {
                                    const cell = document.createElement('td');
                                    cell.textContent = value === null || value === undefined || value === ''
                                        ? '—'
                                        : String(value);
                                    row.appendChild(cell);
                                });
                                tableBody.appendChild(row);
                            });
                        }
                        table.appendChild(tableBody);
                        tableWrap.appendChild(table);
                        sectionElement.appendChild(tableWrap);
                    }

                    body.appendChild(sectionElement);
                });

                $('gmHistoryDetailModal').hidden = false;
                $('gmHistoryDetailModal').querySelector('.gm-history-modal-close').focus();
            }

            function paymentTypeLabel(value) {
                return ({
                    dp: 'DP',
                    installment: 'Cicilan',
                    settlement: 'Pelunasan',
                    refund: 'Pengembalian dana'
                })[String(value || '').toLowerCase()] || value || 'Pembayaran';
            }

            function paymentMethodLabel(value) {
                return ({
                    cash: 'Tunai',
                    bank_transfer: 'Transfer bank',
                    transfer: 'Transfer bank',
                    qris: 'QRIS',
                    debit_card: 'Kartu debit',
                    credit_card: 'Kartu kredit',
                    other: 'Lainnya'
                })[String(value || '').toLowerCase()] || value || '—';
            }

            async function openMeasurementDetail(measurement) {
                const number = firstValue(measurement, ['measurement_number', 'measurement_code', 'id']);
                const printWindow = openPrintWindow(`Pengukuran ${number || ''}`);
                if (!printWindow) return;

                try {
                    const { data: rooms, error: roomsError } = await db
                        .from('measurement_rooms')
                        .select('*')
                        .eq('measurement_id', measurement.id);
                    if (roomsError) throw roomsError;

                    const roomIds = (rooms || []).map(room => room.id).filter(Boolean);
                    let openings = [];
                    if (roomIds.length) {
                        const { data, error } = await db
                            .from('measurement_openings')
                            .select('*')
                            .in('room_id', roomIds);
                        if (error) throw error;
                        openings = data || [];
                    }

                    const customer = customers.find(item =>
                        String(item.id) === String(selectedCustomerId)
                    );
                    const measurementPdf = window.GMMeasurement;
                    if (!measurementPdf?.buildPdfHtml) {
                        throw new Error('Template PDF pengukuran belum tersedia. Muat ulang aplikasi lalu coba lagi.');
                    }

                    writePrintWindow(printWindow, measurementPdf.buildPdfHtml({
                        measurement,
                        schedule: measurement.schedule,
                        customer,
                        rooms: rooms || [],
                        openings
                    }));
                } catch (error) {
                    console.error('Gagal memuat detail ukuran:', error);
                    if (!printWindow.closed) printWindow.close();
                    showDetailMessage(
                        'PDF pengukuran gagal dibuat: ' +
                        (error.message || 'Periksa akses data ukuran.')
                    );
                }
            }

            async function openTransactionDetail(sale, payments) {
                const total = Number(firstValue(sale, ['total', 'total_amount', 'grand_total']) || 0);
                const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
                const balance = Math.max(0, total - paid);
                const saleNumber = sale.sale_number || sale.transaction_number || sale.id;
                const status = sale.cancelled_at
                    ? 'Dibatalkan'
                    : ({ paid: 'Lunas', partial: 'Belum lunas (DP)', unpaid: 'Belum dibayar' })[
                        String(sale.payment_status || '').toLowerCase()
                    ] || sale.payment_status || '—';
                const printWindow = openPrintWindow(`Transaksi ${saleNumber}`);
                if (!printWindow) return;

                try {
                    const { data: items, error } = await db
                        .from('sale_items')
                        .select('*')
                        .eq('sale_id', sale.id);
                    if (error) throw error;

                    const itemRows = (items || []).map(item => {
                        const quantity = Number(item.quantity || 0);
                        const unitPrice = Number(item.unit_price || 0);
                        const lineTotal = item.line_total == null
                            ? quantity * unitPrice
                            : Number(item.line_total);
                        return [
                            escapeHtml(item.item_name || item.description || '—'),
                            `${quantity} ${item.unit || ''}`.trim(),
                            escapeHtml(formatMoney(unitPrice)),
                            escapeHtml(formatMoney(lineTotal))
                        ];
                    });

                    const itemTableRows = itemRows.length
                        ? itemRows.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join('')}</tr>`).join('')
                        : '<tr><td colspan="4" class="empty">Belum ada rincian produk.</td></tr>';
                    const paymentTableRows = payments.length
                        ? payments.map(payment => `<tr>
                            <td>${escapeHtml(formatDate(payment.payment_date))}</td>
                            <td>${escapeHtml(paymentTypeLabel(payment.payment_type))}</td>
                            <td>${escapeHtml(paymentMethodLabel(payment.payment_method))}</td>
                            <td class="money">${escapeHtml(formatMoney(payment.amount))}</td>
                            <td>${escapeHtml(payment.reference_number || payment.notes || '—')}</td>
                        </tr>`).join('')
                        : '<tr><td colspan="5" class="empty">Belum ada pembayaran tercatat.</td></tr>';
                    const customer = customers.find(item =>
                        String(item.id) === String(selectedCustomerId)
                    );
                    const customerAddress = customer?.address || 'Alamat tidak tersedia';
                    const subtotal = formatMoney(firstValue(sale, ['subtotal']) ?? total);
                    const discount = formatMoney(firstValue(sale, ['discount']) ?? 0);
                    const html = `<!doctype html>
                        <html lang="id"><head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width,initial-scale=1">
                            <title>${escapeHtml(saleNumber)} - Riwayat Transaksi</title>
                            <style>
                                @page { size: A4 portrait; margin: 14mm; }
                                * { box-sizing: border-box; }
                                body { margin: 0; color: #202b3b; font: 10px/1.45 Arial, sans-serif; }
                                .toolbar { display: flex; justify-content: flex-end; gap: 8px; margin: 0 auto 14px; max-width: 820px; }
                                .toolbar button { border: 0; border-radius: 6px; padding: 9px 14px; background: #14243a; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
                                main { max-width: 820px; margin: 0 auto; }
                                header { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #b08a4b; }
                                h1 { margin: 0; color: #14243a; font-size: 18px; }
                                h2 { margin: 18px 0 8px; color: #14243a; font-size: 12px; }
                                .muted { margin-top: 4px; color: #667085; }
                                .doc-number { text-align: right; }
                                .doc-number strong { display: block; color: #14243a; font-size: 13px; }
                                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin: 12px 0; }
                                .info-card { padding: 9px 11px; border: 1px solid #d9dee6; border-radius: 6px; }
                                .info-card h2 { margin: 0 0 5px; color: #667085; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; }
                                .info-card p { margin: 2px 0; overflow-wrap: anywhere; }
                                .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin: 12px 0; }
                                .summary div { padding: 8px; border: 1px solid #d9dee6; border-radius: 5px; }
                                .summary span, .summary strong { display: block; }
                                .summary span { color: #667085; font-size: 9px; }
                                .summary strong { margin-top: 4px; color: #14243a; font-size: 11px; }
                                table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                                thead { display: table-header-group; }
                                tr { break-inside: avoid; page-break-inside: avoid; }
                                th, td { padding: 6px 7px; border: 1px solid #cfd5dd; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
                                th { background: #eef1f5; color: #14243a; font-size: 9px; }
                                .money { text-align: right; white-space: nowrap; }
                                .empty { padding: 12px; text-align: center; color: #667085; }
                                .notes { margin-top: 11px; padding: 8px 10px; border-left: 3px solid #b08a4b; background: #f7f4ee; overflow-wrap: anywhere; }
                                footer { margin-top: 18px; color: #667085; font-size: 9px; }
                                @media screen { body { padding: 22px; background: #eef1f5; } main { padding: 22px; background: white; box-shadow: 0 3px 18px #14243a1c; } }
                                @media print { .toolbar { display: none; } main { max-width: none; } }
                            </style>
                        </head><body>
                            <div class="toolbar"><button type="button" onclick="window.print()">Cetak / Simpan sebagai PDF</button><button type="button" onclick="window.close()">Tutup</button></div>
                            <main>
                                <header>
                                    <div><h1>RIWAYAT TRANSAKSI</h1><div class="muted">Gorden Malang · Ringkasan transaksi dan pembayaran</div></div>
                                    <div class="doc-number"><span>Nomor transaksi</span><strong>${escapeHtml(saleNumber)}</strong><span>${escapeHtml(formatDate(sale.sale_date))}</span></div>
                                </header>
                                <section class="info-grid">
                                    <div class="info-card"><h2>Pelanggan</h2><p><strong>${escapeHtml(customer?.full_name || '—')}</strong></p><p>${escapeHtml(customer?.phone || customer?.whatsapp || 'Nomor tidak tersedia')}</p><p>${escapeHtml(customerAddress)}</p></div>
                                    <div class="info-card"><h2>Status</h2><p><strong>${escapeHtml(status)}</strong></p><p>Keterangan transaksi: ${escapeHtml(sale.notes || '—')}</p></div>
                                </section>
                                <section class="summary">
                                    <div><span>Subtotal</span><strong>${escapeHtml(subtotal)}</strong></div>
                                    <div><span>Diskon</span><strong>${escapeHtml(discount)}</strong></div>
                                    <div><span>Total dibayar</span><strong>${escapeHtml(formatMoney(paid))}</strong></div>
                                    <div><span>Sisa tagihan</span><strong>${escapeHtml(formatMoney(balance))}</strong></div>
                                </section>
                                <h2>Rincian Produk / Jasa</h2>
                                <table><colgroup><col style="width:42%"><col style="width:14%"><col style="width:22%"><col style="width:22%"></colgroup><thead><tr><th>Produk / Jasa</th><th>Qty</th><th>Harga satuan</th><th>Jumlah</th></tr></thead><tbody>${itemTableRows}</tbody></table>
                                <h2>Riwayat Pembayaran</h2>
                                <table><colgroup><col style="width:16%"><col style="width:15%"><col style="width:18%"><col style="width:20%"><col style="width:31%"></colgroup><thead><tr><th>Tanggal</th><th>Jenis</th><th>Metode</th><th>Nominal</th><th>Keterangan</th></tr></thead><tbody>${paymentTableRows}</tbody></table>
                                <footer>Dokumen dibuat dari riwayat pelanggan di aplikasi Gorden Malang.</footer>
                            </main>
                            <script>window.addEventListener('load', function () { setTimeout(function () { window.focus(); window.print(); }, 350); });</script>
                        </body></html>`;
                    writePrintWindow(printWindow, html);
                } catch (error) {
                    console.error('Gagal memuat rincian transaksi:', error);
                    if (!printWindow.closed) printWindow.close();
                    showDetailMessage(
                        'PDF transaksi gagal dibuat: ' +
                        (error.message || 'Periksa akses data transaksi.')
                    );
                }
            }

            // BARIS RIWAYAT DENGAN AKSI PDF YANG JELAS
            function renderHistoryRows(
                tbodyId,
                records,
                columns,
                emptyText,
                onRecordClick
            ) {
                const tbody = $(tbodyId);
                tbody.replaceChildren();

                if (!records.length) {
                    const row = document.createElement('tr');
                    const cell = document.createElement('td');

                    cell.colSpan = columns.length + 1;
                    cell.textContent = emptyText;

                    row.appendChild(cell);
                    tbody.appendChild(row);
                    return;
                }

                records.forEach(record => {
                    const row = document.createElement('tr');

                    columns.forEach(column => {
                        addCell(row, column.value(record));
                    });

                    const actionCell = document.createElement('td');
                    const pdfButton = document.createElement('button');
                    pdfButton.type = 'button';
                    pdfButton.className = 'btn light gm-history-pdf-action';
                    pdfButton.textContent = 'Buka PDF';
                    pdfButton.setAttribute(
                        'aria-label',
                        'Buka PDF ' + (columns[0].value(record) || 'riwayat')
                    );
                    pdfButton.addEventListener('click', () => {
                        onRecordClick(record);
                    });
                    actionCell.appendChild(pdfButton);
                    row.appendChild(actionCell);

                    tbody.appendChild(row);
                });
            }

            // DETAIL PELANGGAN
            async function openCustomerDetail(customerId) {
                if (detailLoading) return;

                const customer = customers.find(
                    item => String(item.id) === String(customerId)
                );

                if (!customer) {
                    showMessage('Data pelanggan tidak ditemukan.');
                    return;
                }

                detailLoading = true;
                const requestId = ++detailRequestId;

                selectedCustomerId = customer.id;
                listPanel.hidden = true;
                formPanel.hidden = true;
                detailPanel.hidden = false;

                $('customerDetailName').textContent =
                    customer.full_name || 'Detail Pelanggan';

                $('customerDetailSubtitle').textContent =
                    'Memuat informasi dan riwayat pelanggan...';

                showDetailMessage('Mengambil data dari Supabase...');

                $('customerMeasurementRows').innerHTML =
                    '<tr><td colspan="5">Memuat riwayat pengukuran...</td></tr>';

                $('customerSalesRows').innerHTML =
                    '<tr><td colspan="7">Memuat riwayat transaksi...</td></tr>';

                try {
                    // INFORMASI PELANGGAN
                    const { data: freshCustomer, error: customerError } =
                        await db
                            .from('customers')
                            .select(
                                'id,customer_code,full_name,phone,whatsapp,address,notes,created_at'
                            )
                            .eq('id', customerId)
                            .single();

                    if (customerError) throw customerError;

                    if (requestId !== detailRequestId) return;

                    const index = customers.findIndex(
                        item => String(item.id) === String(customerId)
                    );

                    if (index !== -1) {
                        customers[index] = freshCustomer;
                    }

                    setDetailText('detailCustomerCode', freshCustomer.customer_code);
                    setDetailText('detailCustomerName', freshCustomer.full_name);
                    setDetailText(
                        'detailCustomerContact',
                        freshCustomer.whatsapp || freshCustomer.phone
                    );
                    setDetailText('detailCustomerAddress', freshCustomer.address);
                    setDetailText('detailCustomerNotes', freshCustomer.notes);
                    setDetailText(
                        'detailCustomerCreated',
                        formatDate(freshCustomer.created_at)
                    );

                    $('customerDetailName').textContent =
                        freshCustomer.full_name || 'Detail Pelanggan';

                    $('customerDetailSubtitle').textContent =
                        `Kode pelanggan: ${freshCustomer.customer_code || '—'}`;

                    // Pengukuran terhubung lewat jadwal: measurements.schedule_id ->
                    // work_schedules.customer_id. Tabel measurements tidak menyimpan customer_id.
                    const { data: scheduleData, error: scheduleError } = await db
                        .from('work_schedules')
                        .select('id,schedule_number,scheduled_date,status,work_type')
                        .eq('customer_id', customerId)
                        .order('scheduled_date', { ascending: false });

                    if (scheduleError) throw scheduleError;
                    if (requestId !== detailRequestId) return;

                    const schedules = scheduleData || [];
                    const scheduleById = new Map(
                        schedules.map(schedule => [String(schedule.id), schedule])
                    );
                    let measurements = [];

                    if (schedules.length) {
                        const { data: measurementData, error: measurementError } = await db
                            .from('measurements')
                            .select('*')
                            .in('schedule_id', schedules.map(schedule => schedule.id))
                            .order('measured_at', { ascending: false });

                        if (measurementError) throw measurementError;
                        measurements = (measurementData || []).map(item => ({
                            ...item,
                            schedule: scheduleById.get(String(item.schedule_id)) || null
                        }));
                    }

                    if (requestId !== detailRequestId) return;

                    renderHistoryRows(
                        'customerMeasurementRows',
                        measurements,
                        [
                            {
                                value: item =>
                                    firstValue(item, [
                                        'measurement_number',
                                        'measurement_code',
                                        'id'
                                    ])
                            },
                            {
                                value: item =>
                                    formatDate(
                                        firstValue(item, [
                                            'measured_at',
                                            'measurement_date',
                                            'created_at',
                                            'date'
                                        ])
                                    )
                            },
                            {
                                value: item => item.schedule?.schedule_number || '—'
                            },
                            {
                                value: item =>
                                    firstValue(item, [
                                        'status',
                                        'measurement_status'
                                    ]) || '—'
                            }
                        ],
                        'Belum ada riwayat pengukuran.',
                        item => openMeasurementDetail(item)
                    );

                    setDetailText(
                        'detailMeasurementCount',
                        measurements.length
                    );

                    // RIWAYAT TRANSAKSI
                    const { data: salesData, error: salesError } = await db
                        .from('sales')
                        .select('*')
                        .eq('customer_id', customerId)
                        .order('sale_date', { ascending: false });

                    if (salesError) throw salesError;

                    if (requestId !== detailRequestId) return;

                    const sales = salesData || [];
                    const paymentsBySale = new Map();

                    if (sales.length) {
                        const { data: paymentData, error: paymentError } = await db
                            .from('payments')
                            .select('sale_id,payment_date,amount,payment_method,payment_type,reference_number,notes')
                            .in('sale_id', sales.map(sale => sale.id))
                            .order('payment_date', { ascending: false });

                        if (paymentError) throw paymentError;

                        (paymentData || []).forEach(payment => {
                            const key = String(payment.sale_id);
                            if (!paymentsBySale.has(key)) paymentsBySale.set(key, []);
                            paymentsBySale.get(key).push(payment);
                        });
                    }

                    if (requestId !== detailRequestId) return;

                    const saleTotal = sale => Number(firstValue(sale, [
                        'grand_total', 'total_amount', 'total', 'total_price',
                        'final_total', 'total_tagihan'
                    ]) || 0);
                    const paymentsForSale = sale => paymentsBySale.get(String(sale.id)) || [];
                    const paidForSale = sale => paymentsForSale(sale).reduce(
                        (sum, payment) => sum + Number(payment.amount || 0), 0
                    );
                    const activeSales = sales.filter(sale => !sale.cancelled_at);

                    const totalSales = activeSales.reduce((sum, sale) => sum + saleTotal(sale), 0);
                    const totalPaid = activeSales.reduce((sum, sale) => sum + paidForSale(sale), 0);
                    const totalBalance = activeSales.reduce(
                        (sum, sale) => sum + Math.max(0, saleTotal(sale) - paidForSale(sale)), 0
                    );

                    setDetailText('detailSalesCount', sales.length);
                    setDetailText('detailSalesTotal', formatMoney(totalSales));
                    setDetailText('detailSalesPaid', formatMoney(totalPaid));
                    setDetailText('detailSalesBalance', formatMoney(totalBalance));

                    renderHistoryRows(
                        'customerSalesRows',
                        sales,
                        [
                            {
                                value: sale =>
                                    firstValue(sale, [
                                        'sale_number',
                                        'transaction_number',
                                        'receipt_number',
                                        'invoice_number',
                                        'receipt_code',
                                        'invoice_code',
                                        'struk_number',
                                        'id'
                                    ])
                            },
                            {
                                value: sale =>
                                    formatDate(
                                        firstValue(sale, [
                                            'sale_date',
                                            'transaction_date',
                                            'created_at',
                                            'date'
                                        ])
                                    )
                            },
                            {
                                value: sale => formatMoney(saleTotal(sale))
                            },
                            {
                                value: sale => formatMoney(paidForSale(sale))
                            },
                            {
                                value: sale => formatMoney(
                                    Math.max(0, saleTotal(sale) - paidForSale(sale))
                                )
                            },
                            {
                                value: sale => sale.cancelled_at
                                    ? 'Dibatalkan'
                                    : ({ paid: 'Lunas', partial: 'Belum lunas (DP)', unpaid: 'Belum dibayar' })[
                                        String(sale.payment_status || '').toLowerCase()
                                    ] || sale.payment_status || '—'
                            }
                        ],
                        'Belum ada riwayat transaksi.',
                        sale => openTransactionDetail(sale, paymentsForSale(sale))
                    );

                    showDetailMessage(
                        'Informasi pelanggan dan riwayat berhasil dimuat.'
                    );

                } catch (error) {
                    if (requestId !== detailRequestId) return;

                    console.error('Gagal memuat detail pelanggan:', error);

                    showDetailMessage(
                        'Gagal memuat detail: ' +
                        (error.message || 'Periksa struktur tabel dan izin Supabase.')
                    );

                } finally {
                    if (requestId === detailRequestId) {
                        detailLoading = false;
                    }
                }
            }

            // HAPUS PELANGGAN
            async function deleteCustomer(customer) {
                if (busy) return;

                const confirmed = window.confirm(
                    `Hapus pelanggan "${customer.full_name}"?\n\n` +
                    'Pelanggan yang memiliki transaksi, jadwal, atau pengukuran tidak dapat dihapus.'
                );

                if (!confirmed) return;

                setBusy(true);
                showMessage('Memeriksa keterkaitan data pelanggan...');

                try {
                    // Cek transaksi
                    const { data: salesData, error: salesError } = await db
                        .from('sales')
                        .select('id')
                        .eq('customer_id', customer.id)
                        .limit(1);

                    if (salesError) throw salesError;

                    if (salesData?.length) {
                        showMessage(
                            'Pelanggan tidak dapat dihapus karena memiliki transaksi.'
                        );
                        return;
                    }

                    // Cek pengukuran langsung
                    const {
                        data: measurementData,
                        error: measurementError
                    } = await db
                        .from('measurements')
                        .select('id')
                        .eq('customer_id', customer.id)
                        .limit(1);

                    if (measurementError) throw measurementError;

                    if (measurementData?.length) {
                        showMessage(
                            'Pelanggan tidak dapat dihapus karena memiliki riwayat pengukuran.'
                        );
                        return;
                    }

                    // Cek jadwal kerja
                    const { data: scheduleData, error: scheduleError } =
                        await db
                            .from('work_schedules')
                            .select('id')
                            .eq('customer_id', customer.id)
                            .limit(1);

                    if (scheduleError) throw scheduleError;

                    if (scheduleData?.length) {
                        showMessage(
                            'Pelanggan tidak dapat dihapus karena masih terhubung dengan jadwal kerja.'
                        );
                        return;
                    }

                    const { data: deletedRows, error: deleteError } =
                        await db
                            .from('customers')
                            .delete()
                            .eq('id', customer.id)
                            .select('id');

                    if (deleteError) throw deleteError;

                    if (!deletedRows?.length) {
                        showMessage(
                            'Pelanggan tidak terhapus. Periksa izin DELETE di Supabase.'
                        );
                        return;
                    }

                    if (
                        String(selectedCustomerId) === String(customer.id)
                    ) {
                        selectedCustomerId = null;
                        detailPanel.hidden = true;
                        listPanel.hidden = false;
                    }

                    await loadCustomers();

                    showMessage(
                        `Pelanggan "${customer.full_name}" berhasil dihapus.`
                    );

                } catch (error) {
                    console.error('Gagal menghapus pelanggan:', error);

                    showMessage(
                        'Gagal menghapus pelanggan: ' +
                        (error.message || 'Periksa izin Supabase.')
                    );

                } finally {
                    setBusy(false);
                }
            }

            // TOMBOL TAMBAH
            addButton.addEventListener('click', () => {
                detailRequestId++;
                detailLoading = false;
                selectedCustomerId = null;

                detailPanel.hidden = true;
                listPanel.hidden = false;

                openAddForm();
            });

            // TOMBOL BATAL
            cancelButton.addEventListener('click', () => {
                if (busy) return;

                resetForm();
                showMessage('');
            });

            // PENCARIAN
            search.addEventListener('input', renderRows);

            // KEMBALI
            $('customerDetailBack').addEventListener('click', () => {
                detailRequestId++;
                detailLoading = false;

                detailPanel.hidden = true;
                listPanel.hidden = false;

                showMessage('');
            });

            // MUAT ULANG
            $('customerDetailRefresh').addEventListener('click', () => {
                if (selectedCustomerId !== null) {
                    openCustomerDetail(selectedCustomerId);
                }
            });

            // EDIT DARI DETAIL
            $('customerDetailEdit').addEventListener('click', () => {
                const customer = customers.find(
                    item =>
                        String(item.id) === String(selectedCustomerId)
                );

                if (customer) {
                    detailRequestId++;
                    detailLoading = false;

                    detailPanel.hidden = true;
                    listPanel.hidden = false;

                    openEditForm(customer);
                }
            });

            // SIMPAN PELANGGAN
            form.addEventListener('submit', async event => {
                event.preventDefault();

                if (busy) return;

                const values = new FormData(form);

                const fullName = String(
                    values.get('full_name') || ''
                ).trim();
                const contactNumber = String(
                    values.get('contact_number') || ''
                ).trim() || null;

                if (!fullName) {
                    showMessage('Nama pelanggan wajib diisi.');
                    form.elements.full_name.focus();
                    return;
                }

                const record = {
                    full_name: fullName,

                    // Simpan nomor tunggal ke kedua kolom lama agar modul
                    // struk dan pengukuran tetap kompatibel.
                    phone: contactNumber,
                    whatsapp: contactNumber,

                    customer_code:
                        String(values.get('customer_code') || '').trim() || null,

                    address:
                        String(values.get('address') || '').trim() || null,

                    notes:
                        String(values.get('notes') || '').trim() || null
                };

                const wasEditing = editingCustomerId !== null;
                const targetId = editingCustomerId;
                const returnToDetail =
                    wasEditing &&
                    selectedCustomerId !== null &&
                    String(selectedCustomerId) === String(targetId);

                setBusy(true);

                try {
                    if (wasEditing) {
                        const { data: updatedRows, error } = await db
                            .from('customers')
                            .update(record)
                            .eq('id', targetId)
                            .select('id');

                        if (error) throw error;

                        if (!updatedRows?.length) {
                            throw new Error(
                                'Data tidak diperbarui. Periksa izin UPDATE.'
                            );
                        }
                    } else {
                        const { error } = await db
                            .from('customers')
                            .insert(record);

                        if (error) throw error;
                    }

                    resetForm();

                    const loaded = await loadCustomers();

                    if (!loaded) return;

                    showMessage(
                        wasEditing
                            ? 'Data pelanggan berhasil diperbarui.'
                            : 'Pelanggan berhasil disimpan.'
                    );

                    if (returnToDetail) {
                        await openCustomerDetail(targetId);
                    }

                } catch (error) {
                    console.error('Gagal menyimpan pelanggan:', error);

                    showMessage(
                        'Gagal menyimpan pelanggan: ' +
                        (error.message || 'Periksa izin dan struktur Supabase.')
                    );

                } finally {
                    setBusy(false);

                    saveButton.textContent =
                        editingCustomerId !== null
                            ? 'Simpan Perubahan'
                            : 'Simpan Pelanggan';
                }
            });

            // INISIALISASI
            await loadCustomers();
        }
    };

    window.GMCustomers = Customers;
})();
