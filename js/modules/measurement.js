
(() => {
    'use strict';

    const Measurement = {
        schedules: [],
        measurements: [],
        customers: [],
        initialized: false,
        loading: false,

        getClient() {
            return window.gmSupabase || window.supabaseClient || null;
        },

        escape(value) {
            return String(value ?? '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[char]);
        },

        today() {
            const now = new Date();
            return new Date(
                now.getTime() - now.getTimezoneOffset() * 60000
            ).toISOString().slice(0, 10);
        },

        formatDate(value) {
            if (!value) return '-';

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) return '-';

            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        },

        statusLabel(value) {
            return ({
                draft: 'Draf',
                completed: 'Selesai',
                cancelled: 'Dibatalkan'
            })[String(value || '').toLowerCase()] || value || '—';
        },

        workTypeLabel(value) {
            return ({
                survey: 'Survei',
                measurement: 'Pengukuran',
                installation: 'Pemasangan',
                service: 'Servis',
                curtain_laundry: 'Laundry gorden'
            })[value] || value || 'Pekerjaan';
        },

        showMessage(message, isError = false) {
            const element = document.getElementById(
                'measurementMessage'
            );

            if (!element) return;

            element.textContent = message;
            element.className = isError
                ? 'measurement-message error'
                : 'measurement-message success';
        },

        // Label pencarian pelanggan harus unik.
        customerLabel(customer) {
            return `${customer.full_name || ''} — ${customer.phone || customer.whatsapp || 'Tanpa nomor'}`;
        },

        render() {
            return `
                <section class="measurement-module">

                    <div class="measurement-header">
                        <div>
                            <p>Catat ukuran per ruangan, lalu tandai selesai dan simpan hasilnya sebagai PDF.</p>
                        </div>

                        <button type="button"
                                id="measurementRefresh"
                                class="measurement-btn secondary">
                            Muat ulang data
                        </button>
                    </div>

                    <div class="measurement-summary" aria-label="Ringkasan pengukuran">
                        <article><span>Total data ukur</span><strong id="measurementTotalCount">—</strong></article>
                        <article><span>Menunggu diselesaikan</span><strong id="measurementDraftCount">—</strong></article>
                        <article><span>Selesai</span><strong id="measurementCompletedCount">—</strong></article>
                    </div>

                    <div class="measurement-flow" aria-label="Alur pengukuran">
                        <div><span>1</span><p><strong>Pilih pelanggan</strong><small>Tentukan jadwal yang sesuai.</small></p></div>
                        <div><span>2</span><p><strong>Isi ukuran</strong><small>Kelompokkan berdasarkan ruangan.</small></p></div>
                        <div><span>3</span><p><strong>Simpan hasil</strong><small>Selesaikan dan buat PDF tabel.</small></p></div>
                    </div>

                    <div id="measurementMessage"
                         class="measurement-message"
                         role="status"
                         aria-live="polite"></div>

                    <details class="measurement-customer-details">
                        <summary>Belum terdaftar? Tambah pelanggan baru</summary>
                        <div class="measurement-customer-form-wrap">

                        <form id="measurementCustomerForm">
                            <div class="measurement-grid">
                                <label>
                                    Nama Pelanggan *
                                    <input
                                        type="text"
                                        name="full_name"
                                        placeholder="Masukkan nama pelanggan"
                                        maxlength="150"
                                        required
                                    >
                                </label>

                                <label>
                                    Nomor Telepon / WhatsApp *
                                    <input
                                        type="tel"
                                        name="phone"
                                        inputmode="tel"
                                        placeholder="Contoh: 081234567890"
                                        required
                                    >
                                </label>
                            </div>

                            <label>
                                Alamat Pelanggan *
                                <textarea
                                    name="address"
                                    rows="3"
                                    placeholder="Masukkan alamat lengkap pelanggan"
                                    required
                                ></textarea>
                            </label>

                            <button
                                type="submit"
                                id="saveMeasurementCustomer"
                                class="measurement-btn primary"
                            >
                                Simpan Pelanggan
                            </button>
                        </form>
                        </div>
                    </details>

                    <div class="measurement-panel">
                        <div class="measurement-section-heading measurement-form-heading">
                            <div>
                                <span class="measurement-step-label">FORM PENGUKURAN BARU</span>
                                <h3>Isi Data Pengukuran</h3>
                                <p>Satu formulir dapat memuat beberapa ruangan dan bukaan.</p>
                            </div>
                        </div>

                        <form id="measurementForm">

                            <div class="measurement-grid">
                                <label>
                                    Pilih Pelanggan *
                                    <input
                                        type="text"
                                        id="measurementCustomerSearch"
                                        name="customer_search"
                                        list="measurementCustomerOptions"
                                        placeholder="Ketik nama atau nomor telepon..."
                                        autocomplete="off"
                                        required
                                    >

                                    <datalist id="measurementCustomerOptions">
                                    </datalist>

                                    <small>
                                        Ketik nama atau nomor, lalu pilih hasil pelanggan yang sesuai.
                                    </small>
                                </label>

                                <label>
                                    Tanggal Pengukuran *
                                    <input
                                        type="date"
                                        name="measured_at"
                                        value="${this.today()}"
                                        required
                                    >
                                </label>
                            </div>

                            <div id="measurementCustomerInfo"
                                 class="measurement-customer-info">
                                Pilih pelanggan untuk melihat informasi jadwalnya.
                            </div>

                            <div class="measurement-divider"></div>

                            <div class="measurement-section-heading">
                                <div>
                                    <span class="measurement-step-label">TAHAP 2</span>
                                    <h3>Ruangan dan Ukuran</h3>
                                    <p>
                                        Tambahkan satu kartu per ruangan, lalu isi setiap jendela atau pintu.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    id="addMeasurementRoom"
                                    class="measurement-btn secondary"
                                >
                                    + Tambah Ruangan
                                </button>
                            </div>

                            <div id="measurementRooms"></div>

                            <label>
                                Catatan Umum
                                <textarea
                                    name="general_notes"
                                    rows="2"
                                    placeholder="Catatan tambahan (opsional)"
                                ></textarea>
                            </label>

                            <button
                                type="submit"
                                id="saveMeasurement"
                                class="measurement-btn primary"
                            >
                                Simpan sebagai Draf
                            </button>
                        </form>
                    </div>

                    <div class="measurement-panel">
                        <div class="measurement-section-heading">
                            <div>
                                <h3>Riwayat Pengukuran</h3>
                                <p>Tandai data yang sudah final sebagai selesai. Setiap baris dapat dicetak atau disimpan sebagai PDF.</p>
                            </div>
                        </div>

                        <div class="measurement-history-toolbar">
                            <input type="search"
                                   id="measurementHistorySearch"
                                   placeholder="Cari nomor, pelanggan, atau jadwal..."
                                   aria-label="Cari data pengukuran">
                            <select id="measurementStatusFilter" aria-label="Filter status pengukuran">
                                <option value="all">Semua status</option>
                                <option value="draft">Draf</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                        </div>

                        <div class="measurement-table-wrap">
                            <table class="measurement-table">
                                <thead>
                                    <tr>
                                        <th>Nomor</th>
                                        <th>Tanggal</th>
                                        <th>Pelanggan</th>
                                        <th>Jadwal</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>

                                <tbody id="measurementTableBody">
                                    <tr>
                                        <td colspan="6">Memuat data...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </section>
            `;
        },

        async init() {
            const client = this.getClient();

            if (!client) {
                this.showMessage(
                    'Supabase tidak ditemukan. Periksa konfigurasi aplikasi.',
                    true
                );
                return;
            }

            if (this.loading) return;

            this.loading = true;
            this.bindEvents();

            const roomsContainer = document.getElementById(
                'measurementRooms'
            );

            if (roomsContainer && !roomsContainer.children.length) {
                this.addRoom();
            }

            const refreshButton = document.getElementById(
                'measurementRefresh'
            );

            if (refreshButton) refreshButton.disabled = true;

            try {
                const [
                    scheduleResult,
                    measurementResult,
                    customerResult
                ] = await Promise.all([
                    client.from('work_schedules')
                        .select(`
                            id,
                            schedule_number,
                            customer_id,
                            work_type,
                            scheduled_date,
                            status
                        `)
                        .order('scheduled_date', {
                            ascending: false
                        }),

                    client.from('measurements')
                        .select(`
                            id,
                            measurement_number,
                            schedule_id,
                            measured_at,
                            status,
                            general_notes,
                            created_at
                        `)
                        .order('created_at', {
                            ascending: false
                        }),

                    client.from('customers')
                        .select(`
                            id,
                            customer_code,
                            full_name,
                            phone,
                            whatsapp,
                            address
                        `)
                        .order('full_name', {
                            ascending: true
                        })
                ]);

                if (scheduleResult.error) throw scheduleResult.error;
                if (measurementResult.error) throw measurementResult.error;
                if (customerResult.error) throw customerResult.error;

                this.schedules = scheduleResult.data || [];
                this.measurements = measurementResult.data || [];
                this.customers = customerResult.data || [];

                this.renderCustomerOptions();
                this.renderStats();
                this.renderTable();

                this.initialized = true;

            } catch (error) {
                console.error('Gagal memuat modul Pengukuran:', error);

                this.showMessage(
                    'Gagal memuat data: ' +
                    (error.message || 'Periksa koneksi Supabase.'),
                    true
                );

            } finally {
                this.loading = false;

                if (refreshButton) {
                    refreshButton.disabled = false;
                }
            }
        },

        bindEvents() {
            const root = document.querySelector('.measurement-module');

            if (!root || root.dataset.eventsBound === 'true') return;

            root.dataset.eventsBound = 'true';

            root.addEventListener('click', event => {
                const button = event.target.closest('button');

                if (!button || !root.contains(button)) return;

                if (button.id === 'measurementRefresh') {
                    this.init();
                    return;
                }

                if (button.id === 'addMeasurementRoom') {
                    this.addRoom();
                    return;
                }

                if (button.dataset.action === 'measurement-pdf') {
                    this.openMeasurementPdf(button.dataset.measurementId);
                    return;
                }

                if (button.dataset.action === 'measurement-complete') {
                    this.completeMeasurement(button.dataset.measurementId, button);
                    return;
                }

                if (button.dataset.action === 'measurement-delete-cancelled') {
                    this.deleteCancelledMeasurement(button.dataset.measurementId);
                    return;
                }

                if (button.dataset.action === 'remove-room') {
                    button.closest('.measurement-room')?.remove();
                    return;
                }

                if (button.dataset.action === 'add-opening') {
                    const room = button.closest('.measurement-room');
                    if (room) this.addOpening(room);
                    return;
                }

                if (button.dataset.action === 'remove-opening') {
                    button.closest('.measurement-opening')?.remove();
                }
            });

            root.addEventListener('input', event => {
                if (event.target.id === 'measurementCustomerSearch') {
                    this.updateCustomerInfo();
                }

                if (event.target.id === 'measurementHistorySearch') {
                    this.renderTable();
                }
            });

            root.addEventListener('change', event => {
                if (event.target.id === 'measurementCustomerSearch') {
                    this.updateCustomerInfo();
                }

                if (event.target.id === 'measurementStatusFilter') {
                    this.renderTable();
                }

                const checkbox = event.target.closest(
                    '[name="use_room_defaults"]'
                );

                if (!checkbox || !root.contains(checkbox)) return;

                const opening = checkbox.closest('.measurement-opening');
                const customFields = opening?.querySelector(
                    '.opening-custom-fields'
                );

                if (customFields) {
                    customFields.hidden = checkbox.checked;
                }
            });

            root.addEventListener('submit', event => {
                if (event.target.id === 'measurementForm') {
                    this.save(event);
                }

                if (event.target.id === 'measurementCustomerForm') {
                    this.saveCustomer(event);
                }
            });
        },

        // Tampilkan SEMUA pelanggan, bukan hanya pelanggan yang
        // sudah memiliki jadwal kerja.
        renderCustomerOptions() {
            const datalist = document.getElementById(
                'measurementCustomerOptions'
            );

            if (!datalist) return;

            datalist.replaceChildren();

            this.customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = this.customerLabel(customer);
                datalist.appendChild(option);
            });

            this.updateCustomerInfo();
        },

        getSelectedCustomer() {
            const input = document.getElementById(
                'measurementCustomerSearch'
            );

            if (!input) return null;

            const value = input.value.trim();

            if (!value) return null;

            // Wajib memilih hasil yang cocok dengan data pelanggan.
            return this.customers.find(
                customer => this.customerLabel(customer) === value
            ) || null;
        },

        updateCustomerInfo() {
            const info = document.getElementById(
                'measurementCustomerInfo'
            );

            if (!info) return;

            const input = document.getElementById(
                'measurementCustomerSearch'
            );

            const value = input?.value.trim() || '';

            if (!value) {
                info.textContent =
                    'Pilih pelanggan untuk melihat informasi jadwalnya.';
                return;
            }

            const customer = this.getSelectedCustomer();

            if (!customer) {
                info.textContent =
                    'Pelanggan belum cocok dengan data yang tersimpan. ' +
                    'Pilih salah satu saran yang muncul.';
                return;
            }

            const schedules = this.schedules
                .filter(schedule =>
                    String(schedule.customer_id) === String(customer.id) &&
                    String(schedule.status || '').toLowerCase() !== 'cancelled'
                )
                .sort((a, b) =>
                    String(b.scheduled_date || '').localeCompare(
                        String(a.scheduled_date || '')
                    )
                );

            if (!schedules.length) {
                info.textContent =
                    `${customer.full_name} dipilih. Belum ada jadwal aktif; ` +
                    'jadwal pengukuran akan dibuat otomatis saat draf disimpan.';
                return;
            }

            const preferredSchedule = schedules.find(schedule =>
                schedule.work_type === 'measurement' &&
                !['completed', 'cancelled'].includes(
                    String(schedule.status || '').toLowerCase()
                )
            ) || schedules.find(schedule =>
                !['completed', 'cancelled'].includes(
                    String(schedule.status || '').toLowerCase()
                )
            ) || schedules[0];

            const summary = document.createElement('span');
            summary.textContent = `${customer.full_name} · ${customer.phone || customer.whatsapp || 'Nomor tidak tersedia'} dipilih. Tentukan jadwal yang terkait:`;

            const label = document.createElement('label');
            label.className = 'measurement-schedule-label';
            label.textContent = 'Jadwal kerja';

            const select = document.createElement('select');
            select.id = 'measurementScheduleSelect';
            select.name = 'schedule_id';
            select.setAttribute('aria-label', 'Jadwal kerja untuk pengukuran');

            schedules.forEach(schedule => {
                const option = document.createElement('option');
                option.value = String(schedule.id);
                option.textContent = [
                    schedule.schedule_number || 'Jadwal tanpa nomor',
                    this.workTypeLabel(schedule.work_type),
                    this.formatDate(schedule.scheduled_date),
                    this.statusLabel(schedule.status)
                ].join(' · ');
                if (String(schedule.id) === String(preferredSchedule.id)) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            label.appendChild(select);
            info.replaceChildren(summary, label);
        },

        addRoom() {
            const container = document.getElementById(
                'measurementRooms'
            );

            if (!container) return;

            const room = document.createElement('div');
            room.className = 'measurement-room';

            room.innerHTML = `
                <div class="measurement-section-heading">
                    <h4>Ruangan</h4>
                    <button type="button"
                            class="measurement-btn text-btn"
                            data-action="remove-room">
                        Hapus
                    </button>
                </div>

                <label>
                    Nama Ruangan *
                    <input type="text"
                           name="room_name"
                           placeholder="Contoh: Ruang Tamu"
                           required>
                </label>

                <div class="measurement-section-heading">
                    <div>
                        <h4>Ukuran Jendela / Pintu</h4>
                        <p>Masukkan ukuran dalam sentimeter.</p>
                    </div>

                    <button type="button"
                            class="measurement-btn secondary small"
                            data-action="add-opening">
                        + Tambah Ukuran
                    </button>
                </div>

                <div class="measurement-openings"></div>

                <details class="measurement-extra">
                    <summary>Detail Tambahan Kain dan Rel</summary>

                    <div class="measurement-extra-content">
                        <div class="measurement-grid">
                            <label>Jenis Kain
                                <input name="default_fabric_type"
                                       placeholder="Contoh: Blackout">
                            </label>

                            <label>Kode Kain
                                <input name="default_fabric_code"
                                       placeholder="Contoh: BO-001">
                            </label>

                            <label>Warna Kain
                                <input name="default_fabric_color"
                                       placeholder="Contoh: Cream">
                            </label>

                            <label>Jenis Rel
                                <input name="default_rail_type"
                                       placeholder="Contoh: Aluminium">
                            </label>

                            <label>Spesifikasi Rel
                                <input name="default_rail_spec"
                                       placeholder="Contoh: Double track">
                            </label>
                        </div>

                        <label>Catatan Ruangan
                            <textarea name="room_notes"
                                      rows="2"
                                      placeholder="Catatan opsional"></textarea>
                        </label>
                    </div>
                </details>
            `;

            container.appendChild(room);
            this.addOpening(room);
        },

        addOpening(room) {
            const container = room?.querySelector(
                '.measurement-openings'
            );

            if (!container) return;

            const opening = document.createElement('div');
            opening.className = 'measurement-opening';

            opening.innerHTML = `
                <div class="measurement-section-heading">
                    <strong>Detail Ukuran</strong>
                    <button type="button"
                            class="measurement-btn text-btn"
                            data-action="remove-opening">
                        Hapus
                    </button>
                </div>

                <label>Nama Jendela / Pintu *
                    <input name="opening_name"
                           placeholder="Contoh: Jendela kiri"
                           required>
                </label>

                <div class="measurement-grid">
                    <label>Jenis Bukaan
                        <select name="opening_type">
                            <option value="window">Jendela</option>
                            <option value="door">Pintu</option>
                            <option value="other">Lainnya</option>
                        </select>
                    </label>

                    <label>Jenis Produk
                        <select name="product_type">
                            <option value="Gorden">Gorden</option>
                            <option value="Vitrase">Vitrase</option>
                            <option value="Blinds">Blinds</option>
                            <option value="Gorden + Vitrase">Gorden + Vitrase</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </label>

                    <label>Lebar (cm) *
                        <input type="number"
                               name="width_cm"
                               min="0.01"
                               step="0.01"
                               placeholder="Contoh: 200"
                               required>
                    </label>

                    <label>Tinggi (cm) *
                        <input type="number"
                               name="height_cm"
                               min="0.01"
                               step="0.01"
                               placeholder="Contoh: 250"
                               required>
                    </label>

                    <label>Jumlah
                        <input type="number"
                               name="quantity"
                               min="1"
                               step="1"
                               value="1"
                               required>
                    </label>
                </div>

                <details class="measurement-extra">
                    <summary>Detail Khusus Ukuran</summary>

                    <div class="measurement-extra-content">
                        <label class="measurement-checkbox">
                            <input type="checkbox"
                                   name="use_room_defaults"
                                   checked>
                            Gunakan kain dan rel default ruangan
                        </label>

                        <div class="measurement-grid opening-custom-fields"
                             hidden>
                            <label>Jenis Kain
                                <input name="fabric_type">
                            </label>

                            <label>Kode Kain
                                <input name="fabric_code">
                            </label>

                            <label>Warna Kain
                                <input name="fabric_color">
                            </label>

                            <label>Jenis Rel
                                <input name="rail_type">
                            </label>

                            <label>Spesifikasi Rel
                                <input name="rail_spec">
                            </label>
                        </div>

                        <label>Catatan Pemasangan
                            <textarea name="installation_notes"
                                      rows="2"
                                      placeholder="Contoh: Rel dipasang ke plafon"></textarea>
                        </label>
                    </div>
                </details>
            `;

            container.appendChild(opening);
        },

        // SIMPAN PELANGGAN BARU
        async saveCustomer(event) {
            event.preventDefault();

            const client = this.getClient();
            const form = event.target;
            const button = document.getElementById(
                'saveMeasurementCustomer'
            );

            if (!client) {
                this.showMessage('Supabase tidak ditemukan.', true);
                return;
            }

            if (!form.reportValidity()) return;

            const formData = new FormData(form);

            const fullName = String(
                formData.get('full_name') || ''
            ).trim();

            const phone = String(
                formData.get('phone') || ''
            ).trim();

            const address = String(
                formData.get('address') || ''
            ).trim();

            if (!fullName || !phone || !address) {
                this.showMessage(
                    'Nama, nomor telepon, dan alamat wajib diisi.',
                    true
                );
                return;
            }

            button.disabled = true;
            button.textContent = 'Menyimpan...';

            try {
                const { data: existing, error: lookupError } =
                    await client
                        .from('customers')
                        .select('id, full_name, phone, whatsapp')
                        .eq('phone', phone)
                        .maybeSingle();

                if (lookupError) throw lookupError;

                if (existing) {
                    this.showMessage(
                        `Nomor ${phone} sudah terdaftar atas nama ` +
                        `${existing.full_name}. Pilih pelanggan tersebut ` +
                        'pada kolom Cari Nama Pelanggan.',
                        true
                    );
                    return;
                }

                const datePart = this.today().replaceAll('-', '');
                const randomPart = crypto.randomUUID()
                    .replaceAll('-', '')
                    .slice(0, 6)
                    .toUpperCase();

                const customerRecord = {
                    customer_code: `CUS-${datePart}-${randomPart}`,
                    full_name: fullName,
                    phone,
                    whatsapp: phone,
                    address
                };

                const { data: savedCustomer, error: insertError } =
                    await client
                        .from('customers')
                        .insert(customerRecord)
                        .select(`
                            id,
                            customer_code,
                            full_name,
                            phone,
                            whatsapp,
                            address
                        `)
                        .single();

                if (insertError) throw insertError;

                this.customers.push(savedCustomer);

                this.customers.sort((a, b) =>
                    String(a.full_name || '').localeCompare(
                        String(b.full_name || ''),
                        'id'
                    )
                );

                this.renderCustomerOptions();

                // Otomatis pilih pelanggan yang baru disimpan.
                const searchInput = document.getElementById(
                    'measurementCustomerSearch'
                );

                if (searchInput) {
                    searchInput.value = this.customerLabel(savedCustomer);
                }

                this.updateCustomerInfo();
                form.reset();

                this.showMessage(
                    'Pelanggan berhasil disimpan dan sudah tersedia ' +
                    'pada kolom Cari Nama Pelanggan.'
                );

            } catch (error) {
                console.error('Gagal menyimpan pelanggan:', error);

                this.showMessage(
                    'Gagal menyimpan pelanggan: ' +
                    (error.message || 'Periksa koneksi Supabase.'),
                    true
                );

            } finally {
                button.disabled = false;
                button.textContent = 'Simpan Pelanggan';
            }
        },

        // SIMPAN PENGUKURAN
        async save(event) {
            event.preventDefault();

            const client = this.getClient();
            const form = event.target;

            const button = document.getElementById(
                'saveMeasurement'
            );

            if (!client) {
                this.showMessage('Supabase tidak ditemukan.', true);
                return;
            }

            if (!form.reportValidity()) return;

            const formData = new FormData(form);
            const customer = this.getSelectedCustomer();

            if (!customer) {
                this.showMessage(
                    'Pilih pelanggan dari saran yang tersedia. ' +
                    'Jangan hanya mengetik nama tanpa memilih hasilnya.',
                    true
                );
                return;
            }

            const measuredAt = String(
                formData.get('measured_at') || this.today()
            );

            const roomElements = [
                ...form.querySelectorAll('.measurement-room')
            ];

            if (!roomElements.length) {
                this.showMessage('Tambahkan minimal satu ruangan.', true);
                return;
            }

            for (const room of roomElements) {
                if (!room.querySelector('[name="room_name"]')?.value.trim()) {
                    this.showMessage('Nama setiap ruangan wajib diisi.', true);
                    return;
                }

                const openings = [
                    ...room.querySelectorAll('.measurement-opening')
                ];

                if (!openings.length) {
                    this.showMessage(
                        'Setiap ruangan harus memiliki minimal satu ukuran.',
                        true
                    );
                    return;
                }

                for (const opening of openings) {
                    const name = opening.querySelector(
                        '[name="opening_name"]'
                    )?.value.trim();

                    const width = Number(
                        opening.querySelector('[name="width_cm"]').value
                    );

                    const height = Number(
                        opening.querySelector('[name="height_cm"]').value
                    );

                    const quantity = Number(
                        opening.querySelector('[name="quantity"]').value
                    );

                    if (
                        !name ||
                        !Number.isFinite(width) || width <= 0 ||
                        !Number.isFinite(height) || height <= 0 ||
                        !Number.isInteger(quantity) || quantity < 1
                    ) {
                        this.showMessage(
                            'Periksa nama bukaan, lebar, tinggi, dan jumlah.',
                            true
                        );
                        return;
                    }
                }
            }

            button.disabled = true;
            button.textContent = 'Menyimpan...';

            let measurementId = null;

            try {
                let customerSchedules = this.schedules.filter(
                    schedule =>
                        String(schedule.customer_id) === String(customer.id) &&
                        String(schedule.status || '').toLowerCase() !== 'cancelled'
                );

                let schedule;

                if (customerSchedules.length) {
                    const selectedScheduleId = document.getElementById(
                        'measurementScheduleSelect'
                    )?.value;
                    schedule = customerSchedules.find(item =>
                        String(item.id) === String(selectedScheduleId)
                    );

                    if (!schedule) {
                        this.showMessage(
                            'Pilih jadwal kerja yang terkait dengan pengukuran ini.',
                            true
                        );
                        return;
                    }

                } else {
                    // Pelanggan belum memiliki jadwal:
                    // buat jadwal pengukuran agar relasi tetap valid.
                    const dateCompact = measuredAt.replaceAll('-', '');

                    const randomSchedule = crypto.randomUUID()
                        .replaceAll('-', '')
                        .slice(0, 8)
                        .toUpperCase();

                    const newSchedule = {
                        schedule_number:
                            `JAD-${dateCompact}-${randomSchedule}`,
                        customer_id: customer.id,
                        work_type: 'measurement',
                        scheduled_date: measuredAt,
                        status: 'scheduled'
                    };

                    const { data: savedSchedule, error: scheduleError } =
                        await client
                            .from('work_schedules')
                            .insert(newSchedule)
                            .select(`
                                id,
                                schedule_number,
                                customer_id,
                                work_type,
                                scheduled_date,
                                status
                            `)
                            .single();

                    if (scheduleError) throw scheduleError;

                    schedule = savedSchedule;
                    this.schedules.push(savedSchedule);
                }

                const dateCompact = measuredAt.replaceAll('-', '');
                const randomPart = crypto.randomUUID()
                    .replaceAll('-', '')
                    .slice(0, 8)
                    .toUpperCase();

                const measurementRecord = {
                    measurement_number: `UK-${dateCompact}-${randomPart}`,
                    schedule_id: schedule.id,
                    measured_at: new Date(
                        `${measuredAt}T00:00:00`
                    ).toISOString(),
                    status: 'draft',
                    general_notes:
                        String(formData.get('general_notes') || '').trim() || null
                };

                const { data: measurement, error: measurementError } =
                    await client
                        .from('measurements')
                        .insert(measurementRecord)
                        .select('id')
                        .single();

                if (measurementError) throw measurementError;

                measurementId = measurement.id;

                for (const roomElement of roomElements) {
                    const roomValue = name =>
                        String(
                            roomElement.querySelector(`[name="${name}"]`)
                                ?.value || ''
                        ).trim();

                    const roomRecord = {
                        measurement_id: measurementId,
                        room_name: roomValue('room_name'),
                        default_fabric_type:
                            roomValue('default_fabric_type') || null,
                        default_fabric_code:
                            roomValue('default_fabric_code') || null,
                        default_fabric_color:
                            roomValue('default_fabric_color') || null,
                        default_rail_type:
                            roomValue('default_rail_type') || null,
                        default_rail_spec:
                            roomValue('default_rail_spec') || null,
                        notes: roomValue('room_notes') || null
                    };

                    const { data: savedRoom, error: roomError } =
                        await client
                            .from('measurement_rooms')
                            .insert(roomRecord)
                            .select('id')
                            .single();

                    if (roomError) throw roomError;

                    const openings = [
                        ...roomElement.querySelectorAll('.measurement-opening')
                    ];

                    for (const openingElement of openings) {
                        const field = name =>
                            String(
                                openingElement.querySelector(`[name="${name}"]`)
                                    ?.value || ''
                            ).trim();

                        const useDefaults =
                            openingElement.querySelector(
                                '[name="use_room_defaults"]'
                            )?.checked ?? true;

                        const openingRecord = {
                            room_id: savedRoom.id,
                            opening_name: field('opening_name'),
                            opening_type: field('opening_type') || 'window',
                            width_cm: Number(field('width_cm')),
                            height_cm: Number(field('height_cm')),
                            quantity: Number(field('quantity') || 1),
                            product_type: field('product_type') || null,
                            use_room_defaults: useDefaults,

                            fabric_type: useDefaults
                                ? roomRecord.default_fabric_type
                                : field('fabric_type') || null,

                            fabric_code: useDefaults
                                ? roomRecord.default_fabric_code
                                : field('fabric_code') || null,

                            fabric_color: useDefaults
                                ? roomRecord.default_fabric_color
                                : field('fabric_color') || null,

                            rail_type: useDefaults
                                ? roomRecord.default_rail_type
                                : field('rail_type') || null,

                            rail_spec: useDefaults
                                ? roomRecord.default_rail_spec
                                : field('rail_spec') || null,

                            installation_notes:
                                field('installation_notes') || null
                        };

                        const { error: openingError } = await client
                            .from('measurement_openings')
                            .insert(openingRecord);

                        if (openingError) throw openingError;
                    }
                }

                form.reset();

                const roomsContainer = document.getElementById(
                    'measurementRooms'
                );

                if (roomsContainer) roomsContainer.innerHTML = '';

                const dateInput = form.querySelector('[name="measured_at"]');

                if (dateInput) dateInput.value = this.today();

                this.addRoom();

                this.showMessage(
                    `Pengukuran berhasil disimpan untuk ${customer.full_name}.`
                );

                // Muat ulang riwayat dan jadwal.
                await this.init();

            } catch (error) {
                console.error('Gagal menyimpan pengukuran:', error);

                let message = error.message ||
                    'Terjadi kesalahan yang tidak diketahui.';

                if (measurementId) {
                    message +=
                        ' Sebagian data mungkin sudah tersimpan. ' +
                        'Periksa data Supabase sebelum menyimpan ulang.';
                }

                this.showMessage(
                    'Gagal menyimpan pengukuran: ' + message,
                    true
                );

            } finally {
                button.disabled = false;
                button.textContent = 'Simpan Pengukuran';
            }
        },

        renderStats() {
            const total = this.measurements.length;
            const drafts = this.measurements.filter(item =>
                String(item.status || '').toLowerCase() === 'draft'
            ).length;
            const completed = this.measurements.filter(item =>
                String(item.status || '').toLowerCase() === 'completed'
            ).length;

            [
                ['measurementTotalCount', total],
                ['measurementDraftCount', drafts],
                ['measurementCompletedCount', completed]
            ].forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value.toLocaleString('id-ID');
            });
        },

        async completeMeasurement(measurementId, button) {
            const client = this.getClient();
            if (!client || !measurementId || button?.disabled) return;

            button.disabled = true;
            button.textContent = 'Menyelesaikan...';

            try {
                const { data: updatedMeasurement, error } = await client
                    .from('measurements')
                    .update({ status: 'completed' })
                    .eq('id', measurementId)
                    .select('id')
                    .maybeSingle();

                if (error) throw error;
                if (!updatedMeasurement) {
                    throw new Error(
                        'Tidak ada baris yang berubah. Pastikan akun memiliki role owner, finance, sales, atau operations dan data masih terlihat oleh policy SELECT.'
                    );
                }

                this.measurements = this.measurements.map(item =>
                    String(item.id) === String(measurementId)
                        ? { ...item, status: 'completed' }
                        : item
                );
                this.renderStats();
                this.renderTable();
                this.showMessage('Pengukuran ditandai selesai. PDF sudah bisa dicetak dari baris data tersebut.');
            } catch (error) {
                console.error('Gagal menyelesaikan pengukuran:', error);
                this.showMessage(
                    'Gagal menyelesaikan pengukuran: ' +
                    (error.message || 'Periksa koneksi Supabase.'),
                    true
                );
                button.disabled = false;
                button.textContent = 'Tandai selesai';
            }
        },

        async deleteCancelledMeasurement(measurementId) {
            const client = this.getClient();
            if (!client || !measurementId) return;

            const measurement = this.measurements.find(item =>
                String(item.id) === String(measurementId)
            );
            if (String(measurement?.status || '').toLowerCase() !== 'cancelled') {
                this.showMessage('Hanya data pengukuran berstatus dibatalkan yang dapat dihapus.', true);
                return;
            }

            if (!window.confirm(
                `Hapus permanen data pengukuran ${measurement.measurement_number || ''}? Rincian ruangan dan bukaan di dalamnya juga akan dihapus.`
            )) return;

            try {
                const { error } = await client.rpc('delete_gm_cancelled_measurement', {
                    p_measurement_id: measurementId
                });
                if (error) throw error;

                this.showMessage('Data pengukuran yang dibatalkan berhasil dihapus.');
                await this.init();
            } catch (error) {
                console.error('Gagal menghapus pengukuran batal:', error);
                this.showMessage(
                    'Data pengukuran tidak dapat dihapus: ' + (error.message || 'Periksa akses Supabase.'),
                    true
                );
            }
        },

        async openMeasurementPdf(measurementId) {
            const client = this.getClient();
            if (!client || !measurementId) return;

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                this.showMessage(
                    'Jendela PDF diblokir browser. Izinkan pop-up untuk situs ini, lalu coba lagi.',
                    true
                );
                return;
            }

            printWindow.document.open();
            printWindow.document.write(
                '<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Menyiapkan PDF</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#263244"><h2>Menyiapkan data pengukuran...</h2><p>Jendela ini akan membuka dialog cetak untuk menyimpan sebagai PDF.</p></body></html>'
            );
            printWindow.document.close();

            try {
                const measurement = this.measurements.find(item =>
                    String(item.id) === String(measurementId)
                );
                if (!measurement) throw new Error('Data pengukuran tidak ditemukan. Muat ulang riwayat lalu coba lagi.');

                const schedule = this.schedules.find(item =>
                    String(item.id) === String(measurement.schedule_id)
                );
                const customer = schedule
                    ? this.customers.find(item =>
                        String(item.id) === String(schedule.customer_id)
                    )
                    : null;

                const { data: rooms, error: roomsError } = await client
                    .from('measurement_rooms')
                    .select('*')
                    .eq('measurement_id', measurementId);
                if (roomsError) throw roomsError;

                const roomIds = (rooms || []).map(room => room.id).filter(Boolean);
                let openings = [];
                if (roomIds.length) {
                    const { data, error } = await client
                        .from('measurement_openings')
                        .select('*')
                        .in('room_id', roomIds);
                    if (error) throw error;
                    openings = data || [];
                }

                const html = this.buildPdfHtml({
                    measurement,
                    schedule,
                    customer,
                    rooms: rooms || [],
                    openings
                });
                printWindow.document.open();
                printWindow.document.write(html);
                printWindow.document.close();
            } catch (error) {
                console.error('Gagal menyiapkan PDF pengukuran:', error);
                printWindow.close();
                this.showMessage(
                    'PDF tidak dapat dibuat: ' +
                    (error.message || 'Periksa akses data pengukuran.'),
                    true
                );
            }
        },

        buildPdfHtml({ measurement, schedule, customer, rooms, openings }) {
            const esc = value => this.escape(value || '');
            const fmtDate = value => esc(this.formatDate(value));
            const fmtNumber = value => {
                if (value === null || value === undefined || value === '') return '—';
                const number = Number(value);
                return Number.isFinite(number)
                    ? number.toLocaleString('id-ID', { maximumFractionDigits: 2 })
                    : esc(value);
            };
            const lines = values => values
                .filter(value => value !== null && value !== undefined && String(value).trim() !== '')
                .map(value => esc(value))
                .join('<br>') || '—';

            const orderedRooms = [...rooms].sort((a, b) =>
                String(a.room_name || '').localeCompare(String(b.room_name || ''), 'id')
            );
            const rows = [];
            let rowNumber = 0;
            orderedRooms.forEach(room => {
                const roomOpenings = openings
                    .filter(opening => String(opening.room_id) === String(room.id))
                    .sort((a, b) =>
                        String(a.opening_name || '').localeCompare(String(b.opening_name || ''), 'id')
                    );

                roomOpenings.forEach(opening => {
                    rowNumber += 1;
                    rows.push(`
                        <tr>
                            <td class="center">${rowNumber}</td>
                            <td><strong>${esc(room.room_name || 'Tanpa nama')}</strong><br><span class="muted">${esc(opening.opening_name || 'Bukaan tanpa nama')}</span><br><span class="muted">${esc(({ window: 'Jendela', door: 'Pintu', other: 'Lainnya' })[opening.opening_type] || opening.opening_type || '')}</span></td>
                            <td>${esc(opening.product_type || '—')}</td>
                            <td class="center">${fmtNumber(opening.width_cm)} × ${fmtNumber(opening.height_cm)}</td>
                            <td class="center">${fmtNumber(opening.quantity)}</td>
                            <td>${lines([opening.fabric_type, opening.fabric_code, opening.fabric_color])}</td>
                            <td>${lines([opening.rail_type, opening.rail_spec])}</td>
                            <td>${lines([room.notes, opening.installation_notes])}</td>
                        </tr>
                    `);
                });
            });

            const customerAddress = customer?.address || schedule?.address;
            const title = measurement.measurement_number || 'Pengukuran';

            return `<!doctype html>
                <html lang="id">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width,initial-scale=1">
                    <title>${esc(title)} - Data Pengukuran</title>
                    <style>
                        @page { size: A4 landscape; margin: 13mm; }
                        * { box-sizing: border-box; }
                        body { margin: 0; color: #202b3b; font: 10px/1.45 Arial, sans-serif; }
                        .toolbar { display: flex; justify-content: flex-end; gap: 8px; margin: 0 auto 14px; max-width: 1180px; }
                        .toolbar button { border: 0; border-radius: 6px; padding: 9px 14px; background: #14243a; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
                        main { max-width: 1180px; margin: 0 auto; }
                        header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; padding-bottom: 12px; border-bottom: 2px solid #b08a4b; }
                        h1 { margin: 0; color: #14243a; font-size: 20px; letter-spacing: .04em; }
                        .brand { margin-top: 4px; color: #7b8491; font-size: 10px; }
                        .doc-number { text-align: right; }
                        .doc-number strong { display: block; color: #14243a; font-size: 13px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 9px; margin: 13px 0; }
                        .info-card { min-width: 0; padding: 9px 11px; border: 1px solid #d9dee6; border-radius: 6px; }
                        .info-card h2 { margin: 0 0 5px; color: #7b8491; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; }
                        .info-card p { margin: 2px 0; overflow-wrap: anywhere; }
                        .info-card strong { color: #14243a; }
                        .notes { margin: 0 0 11px; padding: 8px 10px; border-left: 3px solid #b08a4b; background: #f7f4ee; overflow-wrap: anywhere; }
                        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                        thead { display: table-header-group; }
                        tr { break-inside: avoid; page-break-inside: avoid; }
                        th, td { padding: 6px 7px; border: 1px solid #cfd5dd; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
                        th { background: #eef1f5; color: #14243a; font-size: 9px; }
                        tbody tr:nth-child(even) { background: #f7f8fa; }
                        .center { text-align: center; }
                        .muted { color: #667085; font-size: 9px; }
                        .empty { padding: 14px; text-align: center; color: #667085; }
                        footer { display: flex; justify-content: space-between; gap: 20px; margin-top: 18px; color: #667085; font-size: 9px; }
                        @media screen { body { padding: 22px; background: #eef1f5; } main { padding: 22px; background: white; box-shadow: 0 3px 18px #14243a1c; } }
                        @media print { .toolbar { display: none; } main { max-width: none; } }
                    </style>
                </head>
                <body>
                    <div class="toolbar"><button type="button" onclick="window.print()">Cetak / Simpan sebagai PDF</button><button type="button" onclick="window.close()">Tutup</button></div>
                    <main>
                        <header>
                            <div><h1>DATA PENGUKURAN GORDEN</h1><div class="brand">Gorden Malang · Dokumen ukuran pelanggan</div></div>
                            <div class="doc-number"><span>Nomor Pengukuran</span><strong>${esc(title)}</strong><span>Tanggal: ${fmtDate(measurement.measured_at)}</span></div>
                        </header>
                        <section class="info-grid">
                            <div class="info-card"><h2>Pelanggan</h2><p><strong>${esc(customer?.full_name || 'Pelanggan tidak ditemukan')}</strong></p><p>${esc(customer?.phone || customer?.whatsapp || 'Nomor tidak tersedia')}</p><p>${esc(customerAddress || 'Alamat tidak tersedia')}</p></div>
                            <div class="info-card"><h2>Jadwal terkait</h2><p><strong>${esc(schedule?.schedule_number || 'Jadwal tidak ditemukan')}</strong></p><p>${esc(this.workTypeLabel(schedule?.work_type))} · ${fmtDate(schedule?.scheduled_date)}</p><p>Status pengukuran: ${esc(this.statusLabel(measurement.status))}</p></div>
                            <div class="info-card"><h2>Ringkasan ukuran</h2><p>Ruangan: <strong>${orderedRooms.length}</strong></p><p>Detail bukaan: <strong>${rowNumber}</strong></p><p>Satuan ukuran: sentimeter (cm)</p></div>
                        </section>
                        ${measurement.general_notes ? `<p class="notes"><strong>Catatan umum:</strong> ${esc(measurement.general_notes)}</p>` : ''}
                        <table>
                            <colgroup><col style="width:4%"><col style="width:18%"><col style="width:10%"><col style="width:13%"><col style="width:5%"><col style="width:16%"><col style="width:15%"><col style="width:19%"></colgroup>
                            <thead><tr><th>No.</th><th>Ruangan / Bukaan</th><th>Produk</th><th>Lebar × Tinggi (cm)</th><th>Qty</th><th>Kain / Kode / Warna</th><th>Rel / Spesifikasi</th><th>Catatan</th></tr></thead>
                            <tbody>${rows.length ? rows.join('') : '<tr><td colspan="8" class="empty">Belum ada detail bukaan untuk data pengukuran ini.</td></tr>'}</tbody>
                        </table>
                        <footer><span>Dokumen ini dibuat dari data pengukuran aplikasi Gorden Malang.</span><span>Nomor: ${esc(title)}</span></footer>
                    </main>
                    <script>window.addEventListener('load', function () { setTimeout(function () { window.focus(); window.print(); }, 350); });</script>
                </body>
                </html>`;
        },

        renderTable() {
            const tbody = document.getElementById(
                'measurementTableBody'
            );

            if (!tbody) return;

            const search = String(
                document.getElementById('measurementHistorySearch')?.value || ''
            ).trim().toLocaleLowerCase('id');
            const statusFilter = String(
                document.getElementById('measurementStatusFilter')?.value || 'all'
            ).toLowerCase();

            const customerMap = new Map(
                this.customers.map(customer => [
                    String(customer.id),
                    customer
                ])
            );

            const filteredMeasurements = this.measurements.filter(item => {
                const schedule = this.schedules.find(entry =>
                    String(entry.id) === String(item.schedule_id)
                );
                const customer = schedule
                    ? customerMap.get(String(schedule.customer_id))
                    : null;
                const matchesStatus = statusFilter === 'all' ||
                    String(item.status || '').toLowerCase() === statusFilter;
                const searchText = [
                    item.measurement_number,
                    customer?.full_name,
                    customer?.phone,
                    customer?.whatsapp,
                    schedule?.schedule_number
                ].filter(Boolean).join(' ').toLocaleLowerCase('id');

                return matchesStatus && (!search || searchText.includes(search));
            });

            if (!filteredMeasurements.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">${this.measurements.length
                            ? 'Tidak ada data yang cocok dengan pencarian atau filter.'
                            : 'Belum ada data pengukuran.'}</td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filteredMeasurements.map(item => {
                const schedule = this.schedules.find(
                    entry =>
                        String(entry.id) === String(item.schedule_id)
                );

                const customer = schedule
                    ? customerMap.get(String(schedule.customer_id))
                    : null;
                const normalizedStatus = String(item.status || '').toLowerCase();
                const isDraft = normalizedStatus === 'draft';
                const statusClass = isDraft
                    ? 'is-draft'
                    : normalizedStatus === 'completed'
                        ? 'is-completed'
                        : normalizedStatus === 'cancelled'
                            ? 'is-cancelled'
                            : '';

                return `
                    <tr>
                        <td>${this.escape(item.measurement_number || '-')}</td>
                        <td>${this.escape(this.formatDate(item.measured_at))}</td>
                        <td>${this.escape(
                            customer?.full_name || 'Pelanggan tidak ditemukan'
                        )}</td>
                        <td>${this.escape(
                            schedule?.schedule_number || 'Jadwal tidak ditemukan'
                        )}</td>
                        <td>
                            <span class="measurement-status ${statusClass}">
                                ${this.escape(this.statusLabel(item.status))}
                            </span>
                        </td>
                        <td>
                            <div class="measurement-row-actions">
                                ${isDraft ? `
                                    <button type="button"
                                            class="measurement-btn secondary small"
                                            data-action="measurement-complete"
                                            data-measurement-id="${this.escape(item.id)}">
                                        Tandai selesai
                                    </button>
                                ` : ''}
                                <button type="button"
                                        class="measurement-btn pdf small"
                                        data-action="measurement-pdf"
                                        data-measurement-id="${this.escape(item.id)}">
                                    Cetak / PDF
                                </button>
                                ${normalizedStatus === 'cancelled' ? `
                                    <button type="button"
                                            class="measurement-btn delete small"
                                            data-action="measurement-delete-cancelled"
                                            data-measurement-id="${this.escape(item.id)}">
                                        Hapus Data Batal
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    };

    window.GMMeasurement = Measurement;
})();
