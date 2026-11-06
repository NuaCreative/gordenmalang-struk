
(() => {
    'use strict';

    const WORK_TYPES = [
        { value: 'survey', label: 'Survei', color: '#6478a5' },
        { value: 'measurement', label: 'Pengukuran', color: '#b08a4b' },
        { value: 'installation', label: 'Pemasangan', color: '#287a65' },
        { value: 'service', label: 'Servis', color: '#b65d45' },
        { value: 'curtain_laundry', label: 'Laundry Gorden', color: '#8264a8' }
    ];

    const STATUSES = [
        'scheduled', 'confirmed', 'in_progress',
        'completed', 'cancelled', 'rescheduled'
    ];

    const STATUS_LABELS = {
        scheduled: 'Terjadwal',
        confirmed: 'Dikonfirmasi',
        in_progress: 'Sedang Dikerjakan',
        completed: 'Selesai',
        cancelled: 'Dibatalkan',
        rescheduled: 'Dijadwalkan Ulang'
    };

    const $ = id => document.getElementById(id);

    const escapeHTML = value =>
        String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);

    const getClient = () =>
        window.gmSupabase || window.supabaseClient || null;

    const getToday = () => {
        const now = new Date();
        return new Date(
            now.getTime() - now.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 10);
    };

    const formatDate = value => {
        if (!value) return '-';

        const parts = String(value).slice(0, 10).split('-');
        if (parts.length !== 3) return value;

        return new Date(+parts[0], +parts[1] - 1, +parts[2])
            .toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
    };

    const getWorkType = value =>
        WORK_TYPES.find(type => type.value === value);

    const Schedule = {
        schedules: [],
        customers: [],
        sales: [],
        calendar: null,
        initialized: false,
        editingId: null,

        render() {
            return `
                <section class="schedule-module">
                    <div class="schedule-header">
                        <div>
                            <p>Kalender survei, pengukuran, pemasangan,
                               servis, dan laundry gorden.</p>
                        </div>

                        <div class="schedule-header-actions">
                            <button type="button" id="scheduleRefresh"
                                class="schedule-btn schedule-btn-light">
                                ↻ Muat Ulang
                            </button>

                            <button type="button" id="scheduleAdd"
                                class="schedule-btn schedule-btn-primary">
                                + Tambah Jadwal
                            </button>
                        </div>
                    </div>

                    <div id="scheduleMessage" role="status"
                        aria-live="polite"></div>

                    <div class="schedule-stats">
                        <div class="schedule-stat">
                            <span>Total Jadwal</span>
                            <strong id="scheduleTotal">0</strong>
                        </div>
                        <div class="schedule-stat">
                            <span>Terjadwal</span>
                            <strong id="schedulePlanned">0</strong>
                        </div>
                        <div class="schedule-stat">
                            <span>Diproses</span>
                            <strong id="scheduleProgress">0</strong>
                        </div>
                        <div class="schedule-stat">
                            <span>Selesai</span>
                            <strong id="scheduleDone">0</strong>
                        </div>
                    </div>

                    <div class="schedule-panel">
                        <div class="schedule-calendar-toolbar">
                            <div class="schedule-legend">
                                ${WORK_TYPES.map(type => `
                                    <span>
                                        <i style="background:${type.color}"></i>
                                        ${type.label}
                                    </span>
                                `).join('')}
                            </div>

                            <div class="schedule-filters">
                                <select id="scheduleTypeFilter"
                                    aria-label="Filter jenis pekerjaan">
                                    <option value="">Semua Pekerjaan</option>
                                    ${WORK_TYPES.map(type => `
                                        <option value="${type.value}">
                                            ${type.label}
                                        </option>
                                    `).join('')}
                                </select>

                                <select id="scheduleStatusFilter"
                                    aria-label="Filter status">
                                    <option value="">Semua Status</option>
                                    ${STATUSES.map(status => `
                                        <option value="${status}">
                                            ${STATUS_LABELS[status]}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>

                        <div id="scheduleCalendar"></div>
                    </div>

                    <div class="schedule-panel">
                        <h3>Daftar Jadwal</h3>

                        <div class="schedule-table-wrap">
                            <table class="schedule-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Pelanggan</th>
                                        <th>Pekerjaan</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>

                                <tbody id="scheduleTableBody">
                                    <tr>
                                        <td colspan="5">Memuat jadwal...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- MODAL FORM JADWAL -->
                    <div id="scheduleFormModal" class="schedule-modal"
                        hidden>
                        <div class="schedule-modal-card"
                            role="dialog" aria-modal="true"
                            aria-labelledby="scheduleModalTitle">

                            <div class="schedule-modal-header">
                                <h3 id="scheduleModalTitle">Tambah Jadwal</h3>

                                <button type="button"
                                    class="schedule-modal-close"
                                    data-action="close-form"
                                    aria-label="Tutup">&times;</button>
                            </div>

                            <form id="scheduleForm">
                                <div class="schedule-form-grid">

                                    <div class="schedule-full
                                        schedule-customer-field">
                                        <label for="scheduleCustomer">
                                            Pelanggan *
                                        </label>

                                        <div class="schedule-customer-select">
                                            <select name="customer_id"
                                                id="scheduleCustomer" required>
                                                <option value="">
                                                    Pilih pelanggan
                                                </option>
                                            </select>

                                            <button type="button"
                                                id="scheduleAddCustomer"
                                                class="schedule-btn
                                                    schedule-btn-light">
                                                + Pelanggan Baru
                                            </button>
                                        </div>

                                        <small class="schedule-help">
                                            Belum ada pelanggan?
                                            Tambahkan pelanggan baru di sini.
                                        </small>
                                    </div>

                                    <label>
                                        Pesanan / Penjualan
                                        <select name="sale_id"
                                            id="scheduleSale">
                                            <option value="">
                                                Tanpa pesanan terkait
                                            </option>
                                        </select>
                                    </label>

                                    <label>
                                        Jenis Pekerjaan *
                                        <select name="work_type" required>
                                            ${WORK_TYPES.map(type => `
                                                <option value="${type.value}">
                                                    ${type.label}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </label>

                                    <label>
                                        Status *
                                        <select name="status">
                                            ${STATUSES.map(status => `
                                                <option value="${status}">
                                                    ${STATUS_LABELS[status]}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </label>

                                    <label>
                                        Tanggal *
                                        <input type="date"
                                            name="scheduled_date"
                                            value="${getToday()}" required>
                                    </label>

                                    <label>
                                        Jam
                                        <input type="time"
                                            name="scheduled_time">
                                    </label>

                                    <label class="schedule-full">
                                        Alamat Pekerjaan
                                        <textarea name="address" rows="2"
                                            placeholder="Alamat lokasi pekerjaan"></textarea>
                                    </label>

                                    <label class="schedule-full">
                                        ID Petugas (opsional)
                                        <input type="text"
                                            name="assigned_to"
                                            placeholder="UUID akun petugas">
                                    </label>

                                    <label class="schedule-full">
                                        Catatan
                                        <textarea name="notes" rows="2"
                                            placeholder="Detail pekerjaan atau permintaan pelanggan"></textarea>
                                    </label>
                                </div>

                                <div class="schedule-modal-actions">
                                    <button type="button"
                                        class="schedule-btn
                                            schedule-btn-light"
                                        data-action="close-form">
                                        Batal
                                    </button>

                                    <button type="submit"
                                        id="scheduleSubmit"
                                        class="schedule-btn
                                            schedule-btn-primary">
                                        Simpan Jadwal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- MODAL TAMBAH PELANGGAN -->
                    <div id="scheduleCustomerModal"
                        class="schedule-modal" hidden>

                        <div class="schedule-modal-card"
                            role="dialog" aria-modal="true"
                            aria-labelledby="scheduleCustomerModalTitle">

                            <div class="schedule-modal-header">
                                <h3 id="scheduleCustomerModalTitle">
                                    Tambah Pelanggan Baru
                                </h3>

                                <button type="button"
                                    class="schedule-modal-close"
                                    data-action="close-customer"
                                    aria-label="Tutup">&times;</button>
                            </div>

                            <form id="scheduleCustomerForm">
                                <div class="schedule-form-grid">

                                    <label class="schedule-full">
                                        Nama Pelanggan *
                                        <input type="text"
                                            name="full_name"
                                            maxlength="150"
                                            placeholder="Masukkan nama pelanggan"
                                            autocomplete="name"
                                            required>
                                    </label>

                                    <label class="schedule-full">
                                        Nomor Telepon / WhatsApp *
                                        <input type="tel"
                                            name="phone"
                                            maxlength="30"
                                            placeholder="Contoh: 081234567890"
                                            autocomplete="tel"
                                            required>
                                    </label>

                                    <label class="schedule-full">
                                        Alamat Pelanggan
                                        <textarea name="address"
                                            rows="3"
                                            autocomplete="street-address"
                                            placeholder="Masukkan alamat pelanggan"></textarea>
                                    </label>
                                </div>

                                <div class="schedule-modal-actions">
                                    <button type="button"
                                        class="schedule-btn
                                            schedule-btn-light"
                                        data-action="close-customer">
                                        Batal
                                    </button>

                                    <button type="submit"
                                        id="scheduleSaveCustomer"
                                        class="schedule-btn
                                            schedule-btn-primary">
                                        Simpan Pelanggan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- MODAL DETAIL JADWAL -->
                    <div id="scheduleDetailModal"
                        class="schedule-modal" hidden>

                        <div class="schedule-modal-card"
                            role="dialog" aria-modal="true"
                            aria-labelledby="scheduleDetailTitle">

                            <div class="schedule-modal-header">
                                <h3 id="scheduleDetailTitle">
                                    Detail Jadwal
                                </h3>

                                <button type="button"
                                    class="schedule-modal-close"
                                    data-action="close-detail"
                                    aria-label="Tutup">&times;</button>
                            </div>

                            <div id="scheduleDetailBody"></div>

                            <div class="schedule-modal-actions">
                                <button type="button"
                                    class="schedule-btn
                                        schedule-btn-light"
                                    data-action="close-detail">
                                    Tutup
                                </button>

                                <button type="button"
                                    id="scheduleEdit"
                                    class="schedule-btn
                                        schedule-btn-primary">
                                    Edit Jadwal
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        },

        async init() {
            this.bindEvents();

            const client = getClient();

            if (!client) {
                this.showMessage(
                    'Client Supabase tidak ditemukan. Periksa config.js.',
                    true
                );
                return;
            }

            try {
                const [customers, sales, schedules] = await Promise.all([
                    client.from('customers')
                        .select('id, full_name, phone, address')
                        .order('full_name'),

                    client.from('sales')
                        .select(
                            'id, sale_number, customer_id, sale_date, total'
                        )
                        .order('sale_date', { ascending: false }),

                    client.from('work_schedules')
                        .select(`
                            id, schedule_number, customer_id, sale_id,
                            work_type, scheduled_date, scheduled_time,
                            address, assigned_to, status, notes, created_at
                        `)
                        .order('scheduled_date', { ascending: true })
                        .order('scheduled_time', { ascending: true })
                ]);

                for (const result of [customers, sales, schedules]) {
                    if (result.error) throw result.error;
                }

                this.customers = customers.data || [];
                this.sales = sales.data || [];
                this.schedules = schedules.data || [];

                this.renderCustomerOptions();
                this.renderSalesOptions();
                this.renderStats();
                this.renderTable();
                this.renderCalendar();

                this.showMessage('', false);
                this.initialized = true;
            } catch (error) {
                console.error('Gagal memuat jadwal:', error);

                this.showMessage(
                    'Gagal memuat jadwal: ' + error.message,
                    true
                );
            }
        },

        bindEvents() {
            const root = document.querySelector('.schedule-module');

            if (!root || root.dataset.eventsBound === 'true') return;

            root.dataset.eventsBound = 'true';

            root.addEventListener('submit', event => {
                if (event.target.id === 'scheduleForm') {
                    this.handleSubmit(event);
                } else if (
                    event.target.id === 'scheduleCustomerForm'
                ) {
                    this.handleCustomerSubmit(event);
                }
            });

            root.addEventListener('click', event => {
                const button = event.target.closest('button');
                if (!button) return;

                if (button.id === 'scheduleAdd') {
                    this.openForm();

                } else if (button.id === 'scheduleRefresh') {
                    this.init();

                } else if (button.id === 'scheduleAddCustomer') {
                    this.openCustomerForm();

                } else if (button.id === 'scheduleEdit') {
                    if (this.editingId) {
                        this.openForm(this.editingId);
                    }

                } else if (button.dataset.action === 'close-form') {
                    this.closeModal('scheduleFormModal');

                } else if (
                    button.dataset.action === 'close-customer'
                ) {
                    this.closeModal('scheduleCustomerModal');

                } else if (button.dataset.action === 'close-detail') {
                    this.closeModal('scheduleDetailModal');

                } else if (button.dataset.action === 'edit') {
                    this.openForm(button.dataset.id);

                } else if (button.dataset.action === 'detail') {
                    this.openDetail(button.dataset.id);

                } else if (button.dataset.action === 'delete') {
                    this.deleteSchedule(button.dataset.id);

                } else if (button.dataset.action === 'status') {
                    this.changeStatus(
                        button.dataset.id,
                        button.dataset.status
                    );
                }
            });

            root.addEventListener('change', event => {
                if (event.target.id === 'scheduleCustomer') {
                    this.renderSalesOptions();
                }

                if (
                    event.target.id === 'scheduleTypeFilter' ||
                    event.target.id === 'scheduleStatusFilter'
                ) {
                    this.renderCalendar();
                    this.renderTable();
                }
            });

            root.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    this.closeModal('scheduleFormModal');
                    this.closeModal('scheduleCustomerModal');
                    this.closeModal('scheduleDetailModal');
                }
            });
        },

        renderCustomerOptions(selectedId = '') {
            const select = $('scheduleCustomer');
            if (!select) return;

            select.innerHTML = `
                <option value="">Pilih pelanggan</option>
                ${this.customers.map(customer => `
                    <option value="${escapeHTML(customer.id)}"
                        ${String(customer.id) === String(selectedId)
                            ? 'selected' : ''}>
                        ${escapeHTML(customer.full_name)}
                    </option>
                `).join('')}
            `;
        },

        renderSalesOptions(selectedId = '') {
            const select = $('scheduleSale');
            const customerId = $('scheduleCustomer')?.value || '';

            if (!select) return;

            const available = this.sales.filter(sale =>
                !customerId ||
                String(sale.customer_id) === String(customerId)
            );

            select.innerHTML = `
                <option value="">Tanpa pesanan terkait</option>
                ${available.map(sale => `
                    <option value="${escapeHTML(sale.id)}"
                        ${String(sale.id) === String(selectedId)
                            ? 'selected' : ''}>
                        ${escapeHTML(sale.sale_number)}
                        — ${escapeHTML(sale.sale_date || '')}
                    </option>
                `).join('')}
            `;
        },

        openCustomerForm() {
            const form = $('scheduleCustomerForm');
            const modal = $('scheduleCustomerModal');

            if (!form || !modal) return;

            form.reset();
            modal.hidden = false;

            form.elements.full_name?.focus();
        },

        closeModal(id) {
            const modal = $(id);
            if (modal) modal.hidden = true;
        },

        async handleCustomerSubmit(event) {
            event.preventDefault();

            const client = getClient();
            const form = event.target;
            const button = $('scheduleSaveCustomer');

            if (!client) {
                this.showMessage(
                    'Koneksi Supabase tidak tersedia.',
                    true
                );
                return;
            }

            const data = new FormData(form);

            const fullName = String(
                data.get('full_name') || ''
            ).trim();

            const phone = String(
                data.get('phone') || ''
            ).trim();

            const address = String(
                data.get('address') || ''
            ).trim();

            if (!fullName || !phone) {
                this.showMessage(
                    'Nama dan nomor telepon wajib diisi.',
                    true
                );
                return;
            }

            if (button.disabled) return;

            button.disabled = true;
            button.textContent = 'Menyimpan...';

            try {
                const { data: customer, error } = await client
                    .from('customers')
                    .insert({
                        full_name: fullName,
                        phone,
                        address: address || null
                    })
                    .select('id, full_name, phone, address')
                    .single();

                if (error) throw error;

                // Masukkan pelanggan baru ke data modul saat ini.
                this.customers.push(customer);

                // Otomatis pilih pelanggan yang baru dibuat.
                this.renderCustomerOptions(customer.id);

                // Perbarui pilihan pesanan sesuai pelanggan.
                this.renderSalesOptions();

                // Tutup modal tambah pelanggan.
                this.closeModal('scheduleCustomerModal');

                this.showMessage(
                    'Pelanggan berhasil ditambahkan dan dipilih. ' +
                    'Silakan lanjutkan mengisi jadwal.'
                );

            } catch (error) {
                console.error(
                    'Gagal menambahkan pelanggan:',
                    error
                );

                this.showMessage(
                    'Gagal menambahkan pelanggan: ' + error.message,
                    true
                );

            } finally {
                button.disabled = false;
                button.textContent = 'Simpan Pelanggan';
            }
        },

        openForm(id = null, initialDate = null) {
            const form = $('scheduleForm');
            if (!form) return;

            this.editingId = id;

            form.reset();

            const record = id
                ? this.schedules.find(item =>
                    String(item.id) === String(id)
                )
                : null;

            if (id && !record) {
                this.showMessage('Jadwal tidak ditemukan.', true);
                return;
            }

            this.renderCustomerOptions(record?.customer_id || '');
            this.renderSalesOptions(record?.sale_id || '');

            form.elements.scheduled_date.value =
                record?.scheduled_date || initialDate || getToday();

            form.elements.scheduled_time.value =
                record?.scheduled_time?.slice(0, 5) || '';

            form.elements.work_type.value =
                record?.work_type || 'survey';

            form.elements.status.value =
                record?.status || 'scheduled';

            form.elements.address.value =
                record?.address || '';

            form.elements.assigned_to.value =
                record?.assigned_to || '';

            form.elements.notes.value =
                record?.notes || '';

            $('scheduleModalTitle').textContent =
                record ? 'Edit Jadwal' : 'Tambah Jadwal';

            $('scheduleSubmit').textContent =
                record ? 'Simpan Perubahan' : 'Simpan Jadwal';

            $('scheduleFormModal').hidden = false;
        },

        async handleSubmit(event) {
            event.preventDefault();

            const client = getClient();
            const form = event.target;
            const button = $('scheduleSubmit');
            const data = new FormData(form);

            if (!client) {
                this.showMessage(
                    'Koneksi Supabase tidak tersedia.',
                    true
                );
                return;
            }

            const isEditing = Boolean(this.editingId);
            const editingId = this.editingId;

            const customerId = String(
                data.get('customer_id') || ''
            );

            const saleId = String(
                data.get('sale_id') || ''
            );

            const assignedTo = String(
                data.get('assigned_to') || ''
            ).trim();

            const workType = String(
                data.get('work_type') || ''
            );

            const status = String(
                data.get('status') || ''
            );

            const date = String(
                data.get('scheduled_date') || ''
            );

            if (!this.customers.some(item =>
                String(item.id) === customerId
            )) {
                this.showMessage(
                    'Pilih pelanggan yang valid.',
                    true
                );
                return;
            }

            if (saleId) {
                const sale = this.sales.find(item =>
                    String(item.id) === saleId
                );

                if (
                    !sale ||
                    String(sale.customer_id) !== customerId
                ) {
                    this.showMessage(
                        'Pesanan tidak sesuai dengan pelanggan.',
                        true
                    );
                    return;
                }
            }

            if (!getWorkType(workType) ||
                !STATUSES.includes(status)) {
                this.showMessage(
                    'Jenis pekerjaan atau status tidak valid.',
                    true
                );
                return;
            }

            if (!date) {
                this.showMessage(
                    'Tanggal wajib diisi.',
                    true
                );
                return;
            }

            if (
                assignedTo &&
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                    .test(assignedTo)
            ) {
                this.showMessage(
                    'ID Petugas harus berupa UUID yang valid.',
                    true
                );
                return;
            }

            const record = {
                customer_id: customerId,
                sale_id: saleId || null,
                work_type: workType,
                scheduled_date: date,
                scheduled_time:
                    String(data.get('scheduled_time') || '') || null,
                address:
                    String(data.get('address') || '').trim() || null,
                assigned_to: assignedTo || null,
                status,
                notes:
                    String(data.get('notes') || '').trim() || null,
                updated_at: new Date().toISOString()
            };

            if (!isEditing) {
                const compact = date.replaceAll('-', '');

                record.schedule_number =
                    `JAD-${compact}-${Math.random()
                        .toString(36)
                        .slice(2, 8)
                        .toUpperCase()}`;
            }

            if (button.disabled) return;

            button.disabled = true;
            button.textContent = 'Menyimpan...';

            try {
                let result;

                if (isEditing) {
                    result = await client
                        .from('work_schedules')
                        .update(record)
                        .eq('id', editingId);
                } else {
                    result = await client
                        .from('work_schedules')
                        .insert(record);
                }

                if (result.error) throw result.error;

                this.closeModal('scheduleFormModal');

                this.showMessage(
                    isEditing
                        ? 'Jadwal berhasil diperbarui.'
                        : 'Jadwal berhasil ditambahkan.'
                );

                await this.init();

            } catch (error) {
                console.error(
                    'Gagal menyimpan jadwal:',
                    error
                );

                this.showMessage(
                    'Gagal menyimpan jadwal: ' + error.message,
                    true
                );

            } finally {
                button.disabled = false;
                button.textContent = isEditing
                    ? 'Simpan Perubahan'
                    : 'Simpan Jadwal';
            }
        },

        getFilteredSchedules() {
            const type =
                $('scheduleTypeFilter')?.value || '';

            const status =
                $('scheduleStatusFilter')?.value || '';

            return this.schedules.filter(item =>
                (!type || item.work_type === type) &&
                (!status || item.status === status)
            );
        },

        renderCalendar() {
            const element = $('scheduleCalendar');
            if (!element) return;

            if (!window.FullCalendar) {
                element.innerHTML = `
                    <p class="schedule-error">
                        FullCalendar belum dimuat.
                        Periksa script di index.html.
                    </p>
                `;
                return;
            }

            const events = this.getFilteredSchedules().map(schedule => {
                const customer = this.customers.find(
                    item => String(item.id) === String(schedule.customer_id)
                );

                const type = getWorkType(schedule.work_type);

                return {
                    id: schedule.id,
                    title: customer?.full_name || 'Pelanggan',
                    start: schedule.scheduled_time
                        ? `${schedule.scheduled_date}T${schedule.scheduled_time}`
                        : schedule.scheduled_date,
                    allDay: !schedule.scheduled_time,
                    backgroundColor: type?.color || '#64748b',
                    borderColor: type?.color || '#64748b',
                    textColor: '#ffffff',
                    extendedProps: { schedule }
                };
            });

            if (this.calendar) {
                this.calendar.destroy();
                this.calendar = null;
            }

            this.calendar = new FullCalendar.Calendar(element, {
                locale: 'id',

                initialView: window.innerWidth < 600
                    ? 'listWeek'
                    : 'dayGridMonth',

                height: 'auto',
                firstDay: 1,

                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                },

                buttonText: {
                    today: 'Hari ini',
                    month: 'Bulan',
                    week: 'Minggu',
                    day: 'Hari',
                    list: 'Agenda'
                },

                events,
                dayMaxEvents: 3,
                navLinks: true,
                selectable: true,

                dateClick: info => {
                    this.openForm(
                        null,
                        info.dateStr.slice(0, 10)
                    );
                },

                eventClick: info => {
                    this.openDetail(info.event.id);
                },

                eventContent: info => {
                    const schedule =
                        info.event.extendedProps.schedule;

                    const type = getWorkType(schedule.work_type);

                    const time = schedule.scheduled_time
                        ? schedule.scheduled_time.slice(0, 5) + ' · '
                        : '';

                    const wrapper = document.createElement('div');
                    wrapper.className = 'schedule-event-content';

                    const title = document.createElement('div');
                    title.className = 'schedule-event-title';
                    title.textContent = time + info.event.title;

                    const kind = document.createElement('div');
                    kind.className = 'schedule-event-type';
                    kind.textContent =
                        type?.label || schedule.work_type;

                    wrapper.append(title, kind);

                    return { domNodes: [wrapper] };
                }
            });

            this.calendar.render();
        },

        openDetail(id) {
            const schedule = this.schedules.find(
                item => String(item.id) === String(id)
            );

            if (!schedule) return;

            this.editingId = schedule.id;

            const customer = this.customers.find(
                item => String(item.id) === String(schedule.customer_id)
            );

            const sale = this.sales.find(
                item => String(item.id) === String(schedule.sale_id)
            );

            const type = getWorkType(schedule.work_type);

            const fields = [
                ['Nomor Jadwal', schedule.schedule_number],
                ['Pelanggan', customer?.full_name],
                ['WhatsApp / Telepon', customer?.phone],
                ['Jenis Pekerjaan', type?.label || schedule.work_type],
                ['Tanggal', formatDate(schedule.scheduled_date)],
                [
                    'Jam',
                    schedule.scheduled_time?.slice(0, 5) ||
                        'Belum ditentukan'
                ],
                [
                    'Status',
                    STATUS_LABELS[schedule.status] || schedule.status
                ],
                ['Pesanan', sale?.sale_number],
                ['Alamat', schedule.address || customer?.address],
                ['Catatan', schedule.notes],
                ['ID Petugas', schedule.assigned_to]
            ];

            $('scheduleDetailTitle').textContent =
                schedule.schedule_number || 'Detail Jadwal';

            $('scheduleDetailBody').innerHTML = `
                <div class="schedule-detail-grid">
                    ${fields.map(([label, value]) => `
                        <div class="schedule-detail-item">
                            <span>${escapeHTML(label)}</span>
                            <strong>${escapeHTML(value || '-')}</strong>
                        </div>
                    `).join('')}
                </div>

                <div class="schedule-detail-actions">
                    ${schedule.status !== 'completed' &&
                      schedule.status !== 'cancelled' ? `
                        <button class="schedule-btn schedule-btn-light"
                            data-action="status"
                            data-id="${escapeHTML(id)}"
                            data-status="cancelled">
                            Batalkan Jadwal
                        </button>
                    ` : ''}

                    ${schedule.status === 'scheduled' ? `
                        <button class="schedule-btn schedule-btn-light"
                            data-action="status"
                            data-id="${escapeHTML(id)}"
                            data-status="confirmed">
                            Konfirmasi
                        </button>
                    ` : ''}

                    ${schedule.status === 'confirmed' ? `
                        <button class="schedule-btn schedule-btn-light"
                            data-action="status"
                            data-id="${escapeHTML(id)}"
                            data-status="in_progress">
                            Mulai Dikerjakan
                        </button>
                    ` : ''}

                    ${schedule.status === 'in_progress' ? `
                        <button class="schedule-btn schedule-btn-light"
                            data-action="status"
                            data-id="${escapeHTML(id)}"
                            data-status="completed">
                            Tandai Selesai
                        </button>
                    ` : ''}

                    <button class="schedule-btn schedule-btn-danger"
                        data-action="delete"
                        data-id="${escapeHTML(id)}">
                        Hapus Jadwal
                    </button>
                </div>
            `;

            $('scheduleDetailModal').hidden = false;
        },

        renderStats() {
            const count = status =>
                this.schedules.filter(
                    item => item.status === status
                ).length;

            $('scheduleTotal').textContent =
                this.schedules.length;

            $('schedulePlanned').textContent =
                count('scheduled') + count('confirmed');

            $('scheduleProgress').textContent =
                count('in_progress');

            $('scheduleDone').textContent =
                count('completed');
        },

        renderTable() {
            const tbody = $('scheduleTableBody');
            if (!tbody) return;

            const rows = this.getFilteredSchedules();

            if (!rows.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            Belum ada jadwal yang cocok.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = rows.map(item => {
                const customer = this.customers.find(
                    person =>
                        String(person.id) === String(item.customer_id)
                );

                const type = getWorkType(item.work_type);

                return `
                    <tr>
                        <td>
                            <strong>
                                ${escapeHTML(formatDate(item.scheduled_date))}
                            </strong>
                            <small class="schedule-table-sub">
                                ${escapeHTML(
                                    item.scheduled_time?.slice(0, 5) ||
                                    'Jam belum ditentukan'
                                )}
                            </small>
                        </td>

                        <td>
                            ${escapeHTML(
                                customer?.full_name ||
                                'Pelanggan tidak ditemukan'
                            )}
                            <small class="schedule-table-sub">
                                ${escapeHTML(customer?.phone || '')}
                            </small>
                        </td>

                        <td>
                            ${escapeHTML(
                                type?.label || item.work_type
                            )}
                        </td>

                        <td>
                            <span class="schedule-status
                                status-${escapeHTML(item.status)}">
                                ${escapeHTML(
                                    STATUS_LABELS[item.status] ||
                                    item.status
                                )}
                            </span>
                        </td>

                        <td>
                            <div class="schedule-row-actions">
                                <button
                                    class="schedule-btn schedule-btn-light"
                                    data-action="detail"
                                    data-id="${escapeHTML(item.id)}">
                                    Detail
                                </button>

                                <button
                                    class="schedule-btn schedule-btn-light"
                                    data-action="edit"
                                    data-id="${escapeHTML(item.id)}">
                                    Edit
                                </button>

                                ${item.status === 'cancelled' ? `
                                    <button
                                        class="schedule-btn schedule-btn-danger"
                                        data-action="delete"
                                        data-id="${escapeHTML(item.id)}">
                                        Hapus Jadwal Batal
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        },

        async changeStatus(id, status) {
            if (!STATUSES.includes(status)) return;

            const client = getClient();
            if (!client) return;

            try {
                const { error } = await client
                    .from('work_schedules')
                    .update({
                        status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (error) throw error;

                this.closeModal('scheduleDetailModal');

                this.showMessage(
                    'Status jadwal berhasil diperbarui.'
                );

                await this.init();

            } catch (error) {
                console.error(
                    'Gagal memperbarui status:',
                    error
                );

                this.showMessage(
                    'Gagal memperbarui status: ' + error.message,
                    true
                );
            }
        },

        async deleteSchedule(id) {
            if (!window.confirm(
                'Yakin ingin menghapus jadwal ini? ' +
                'Tindakan ini tidak dapat dibatalkan.'
            )) {
                return;
            }

            const client = getClient();
            if (!client) return;

            try {
                const schedule = this.schedules.find(item =>
                    String(item.id) === String(id)
                );
                let error;

                if (schedule?.status === 'cancelled') {
                    ({ error } = await client.rpc('delete_gm_cancelled_schedule', {
                        p_schedule_id: id
                    }));
                } else {
                    const { data: linkedMeasurements, error: measurementError } =
                        await client.from('measurements')
                            .select('id')
                            .eq('schedule_id', id)
                            .limit(1);

                    if (measurementError) throw measurementError;
                    if (linkedMeasurements?.length) {
                        throw new Error(
                            'Jadwal ini masih terhubung dengan data pengukuran. Hapus data pengukuran yang berstatus dibatalkan terlebih dahulu; data ukur selesai harus tetap disimpan.'
                        );
                    }

                    ({ error } = await client
                        .from('work_schedules')
                        .delete()
                        .eq('id', id));
                }

                if (error) throw error;

                this.closeModal('scheduleDetailModal');

                this.showMessage('Jadwal berhasil dihapus.');

                await this.init();

            } catch (error) {
                console.error(
                    'Gagal menghapus jadwal:',
                    error
                );

                this.showMessage(
                    'Gagal menghapus jadwal: ' + error.message,
                    true
                );
            }
        },

        showMessage(message, isError = false) {
            const element = $('scheduleMessage');
            if (!element) return;

            element.textContent = message;

            element.className = message
                ? `schedule-message ${isError ? 'error' : 'success'}`
                : '';
        }
    };

    window.GMSchedule = Schedule;
})();
