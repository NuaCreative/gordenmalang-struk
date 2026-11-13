(() => {
    'use strict';

    const Dashboard = {
        render() {
            return [
                '<section class="gm-dashboard">',
                    '<div class="gm-dashboard-heading">',
                        '<div>',
                            '<p>Ringkasan pekerjaan dan hal yang perlu ditindaklanjuti.</p>',
                        '</div>',
                        '<span class="gm-dashboard-date" id="dashboardDate">Memuat tanggal...</span>',
                    '</div>',

                    '<div class="gm-dashboard-quick-actions" aria-label="Aksi cepat">',
                        '<button type="button" class="btn primary" data-dashboard-module="receipts">Buat Transaksi</button>',
                        '<button type="button" class="btn light" data-dashboard-module="customers">Buka Data Pelanggan</button>',
                        '<button type="button" class="btn light" data-dashboard-module="schedule">Buka Jadwal</button>',
                        '<button type="button" class="btn light" data-dashboard-module="measurement">Buka Data Ukur</button>',
                    '</div>',

                    '<div class="gm-stat-grid gm-dashboard-stat-grid">',
                        '<article class="gm-stat-card"><div class="gm-stat-label">Total Pelanggan</div><div class="gm-stat-value" id="dashTotalCustomers">—</div><div class="gm-stat-note">Pelanggan terdaftar</div></article>',
                        '<article class="gm-stat-card"><div class="gm-stat-label">Transaksi Tersimpan</div><div class="gm-stat-value" id="dashActiveTransactions">—</div><div class="gm-stat-note">Tidak termasuk transaksi batal</div></article>',
                        '<article class="gm-stat-card"><div class="gm-stat-label">Jadwal Hari Ini</div><div class="gm-stat-value" id="dashTodaySchedules">—</div><div class="gm-stat-note">Semua jenis pekerjaan</div></article>',
                        '<article class="gm-stat-card"><div class="gm-stat-label">Pengukuran Draf</div><div class="gm-stat-value" id="dashDraftMeasurements">—</div><div class="gm-stat-note">Perlu dilengkapi atau ditinjau</div></article>',
                        '<article class="gm-stat-card"><div class="gm-stat-label">Pesanan Belum Selesai</div><div class="gm-stat-value" id="dashActiveProduction">—</div><div class="gm-stat-note">Belum diatur, menunggu, atau sedang diproduksi</div></article>',
                        '<article class="gm-stat-card"><div class="gm-stat-label">Sisa Tagihan</div><div class="gm-stat-value" id="dashOutstanding">—</div><div class="gm-stat-note" id="dashOutstandingNote">Menghitung pembayaran...</div></article>',
                    '</div>',

                    '<section class="gm-dashboard-panel gm-dashboard-flow-panel">',
                        '<div class="gm-dashboard-panel-heading"><div><h3>Alur Pekerjaan</h3><p>Progres transaksi dari pengukuran sampai pembayaran.</p></div><button type="button" class="btn light gm-dashboard-panel-action" data-dashboard-module="receipts">Lihat Transaksi</button></div>',
                        '<div id="dashOrderFlow"><p class="gm-dashboard-loading">Menghubungkan progres pekerjaan...</p></div>',
                    '</section>',

                    '<div class="gm-dashboard-work-grid">',
                        '<section class="gm-dashboard-panel gm-dashboard-work-panel">',
                            '<div class="gm-dashboard-panel-heading"><div><h3>Jadwal Terdekat</h3><p>Jadwal hari ini, mendatang, dan yang terlewat.</p></div><button type="button" class="btn light gm-dashboard-panel-action" data-dashboard-module="schedule">Buka Jadwal</button></div>',
                            '<div id="dashAgendaList"><p class="gm-dashboard-loading">Memuat jadwal...</p></div>',
                        '</section>',
                        '<section class="gm-dashboard-panel gm-dashboard-work-panel">',
                            '<div class="gm-dashboard-panel-heading"><div><h3>Pengukuran Draf</h3><p>Data ukur yang masih berstatus draf.</p></div><button type="button" class="btn light gm-dashboard-panel-action" data-dashboard-module="measurement">Buka Pengukuran</button></div>',
                            '<div id="dashMeasurementList"><p class="gm-dashboard-loading">Memuat data ukur...</p></div>',
                        '</section>',
                        '<section class="gm-dashboard-panel gm-dashboard-work-panel">',
                            '<div class="gm-dashboard-panel-heading"><div><h3>Pesanan Produksi</h3><p>Pesanan yang belum selesai diproses.</p></div><button type="button" class="btn light gm-dashboard-panel-action" data-dashboard-module="production">Buka Produksi</button></div>',
                            '<div id="dashProductionList"><p class="gm-dashboard-loading">Memuat pesanan...</p></div>',
                        '</section>',
                        '<section class="gm-dashboard-panel gm-dashboard-work-panel">',
                            '<div class="gm-dashboard-panel-heading"><div><h3>Tagihan Belum Lunas</h3><p>Diurutkan dari sisa tagihan terbesar.</p></div><button type="button" class="btn light gm-dashboard-panel-action" data-dashboard-module="receipts">Buka Transaksi</button></div>',
                            '<div id="dashBillingList"><p class="gm-dashboard-loading">Memuat tagihan...</p></div>',
                        '</section>',
                    '</div>',

                    '<section class="gm-dashboard-panel gm-dashboard-recent-panel">',
                        '<div class="gm-dashboard-panel-heading"><div><h3>Transaksi Terbaru</h3><p>Lima transaksi terakhir yang tersimpan.</p></div><button type="button" class="btn light gm-dashboard-panel-action" data-dashboard-module="receipts">Lihat Transaksi</button></div>',
                        '<div id="dashRecentTransactions"><p class="gm-dashboard-loading">Memuat transaksi...</p></div>',
                    '</section>',

                    '<p id="dashMessage" class="gm-dashboard-message" role="status" aria-live="polite"></p>',
                '</section>'
            ].join('');
        },

        async init() {
            const $ = id => document.getElementById(id);
            const setText = (id, value) => {
                const element = $(id);
                if (element) element.textContent = value;
            };
            const client = window.gmSupabase || window.supabaseClient;
            const message = $('dashMessage');

            const todayISO = () => {
                const date = new Date();
                const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                return localDate.toISOString().slice(0, 10);
            };
            const today = todayISO();

            const formatDate = value => {
                if (!value) return '—';
                const raw = String(value).slice(0, 10);
                const date = new Date(raw + 'T00:00:00');
                if (Number.isNaN(date.getTime())) return '—';
                return date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            };
            const formatMoney = value => new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
            }).format(Number(value) || 0);
            const statusLabel = value => ({
                paid: 'Lunas',
                partial: 'Belum lunas (DP)',
                unpaid: 'Belum dibayar',
                waiting: 'Menunggu produksi',
                in_production: 'Proses produksi',
                ready_for_installation: 'Siap dipasang',
                completed: 'Selesai',
                cancelled: 'Dibatalkan',
                scheduled: 'Terjadwal',
                confirmed: 'Dikonfirmasi',
                in_progress: 'Sedang dikerjakan',
                rescheduled: 'Dijadwalkan ulang',
                draft: 'Draf'
            })[String(value || '').toLowerCase()] || value || '—';
            const workTypeLabel = value => ({
                survey: 'Survei',
                measurement: 'Pengukuran',
                installation: 'Pemasangan',
                service: 'Servis',
                curtain_laundry: 'Laundry gorden'
            })[value] || value || 'Pekerjaan';

            setText('dashboardDate', new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }));

            const dashboardRoot = document.querySelector('.gm-dashboard');
            const allowedModules = Array.isArray(window.gmModuleAccess)
                ? new Set(window.gmModuleAccess)
                : null;
            dashboardRoot?.querySelectorAll('[data-dashboard-module]').forEach(button => {
                button.hidden = !!allowedModules && !allowedModules.has(button.dataset.dashboardModule);
            });
            dashboardRoot?.addEventListener('click', event => {
                const button = event.target.closest('[data-dashboard-module]');
                if (!button || (allowedModules && !allowedModules.has(button.dataset.dashboardModule))) return;
                const moduleButton = document.querySelector(
                    '.gm-nav-button[data-module="' + button.dataset.dashboardModule + '"]'
                );
                if (moduleButton && !moduleButton.hidden) moduleButton.click();
            });

            const renderTaskList = (id, items, emptyText, errorText) => {
                const container = $(id);
                if (!container) return;
                container.replaceChildren();

                if (errorText) {
                    const error = document.createElement('p');
                    error.className = 'gm-dashboard-empty is-error';
                    error.textContent = errorText;
                    container.appendChild(error);
                    return;
                }

                if (!items.length) {
                    const empty = document.createElement('p');
                    empty.className = 'gm-dashboard-empty';
                    empty.textContent = emptyText;
                    container.appendChild(empty);
                    return;
                }

                const list = document.createElement('div');
                list.className = 'gm-dashboard-task-list';
                items.forEach(item => {
                    const card = document.createElement('article');
                    card.className = 'gm-dashboard-task';

                    const copy = document.createElement('div');
                    copy.className = 'gm-dashboard-task-copy';

                    const title = document.createElement('strong');
                    title.textContent = item.title || '—';

                    const detail = document.createElement('span');
                    detail.textContent = item.detail || '';

                    copy.append(title, detail);
                    card.appendChild(copy);

                    if (item.badge) {
                        const badge = document.createElement('span');
                        badge.className = 'gm-dashboard-task-badge' +
                            (item.urgent ? ' is-urgent' : '');
                        badge.textContent = item.badge;
                        card.appendChild(badge);
                    }

                    list.appendChild(card);
                });
                container.appendChild(list);
            };

            const renderRecentTransactions = (sales, customerMap, errorText) => {
                const container = $('dashRecentTransactions');
                if (!container) return;
                container.replaceChildren();

                if (errorText) {
                    const error = document.createElement('p');
                    error.className = 'gm-dashboard-empty is-error';
                    error.textContent = errorText;
                    container.appendChild(error);
                    return;
                }
                if (!sales.length) {
                    const empty = document.createElement('p');
                    empty.className = 'gm-dashboard-empty';
                    empty.textContent = 'Belum ada transaksi yang tersimpan.';
                    container.appendChild(empty);
                    return;
                }

                const wrap = document.createElement('div');
                wrap.className = 'gm-dashboard-table-wrap';
                const table = document.createElement('table');
                table.className = 'gm-dashboard-table';
                const thead = document.createElement('thead');
                const headRow = document.createElement('tr');
                ['No. Struk', 'Pelanggan', 'Tanggal', 'Total', 'Status'].forEach(label => {
                    const cell = document.createElement('th');
                    cell.textContent = label;
                    headRow.appendChild(cell);
                });
                thead.appendChild(headRow);

                const tbody = document.createElement('tbody');
                sales.slice(0, 5).forEach(sale => {
                    const row = document.createElement('tr');
                    const customer = customerMap.get(String(sale.customer_id));
                    const values = [
                        sale.sale_number || '—',
                        customer?.full_name || '—',
                        formatDate(sale.sale_date),
                        formatMoney(sale.total),
                        sale.cancelled_at ? 'Dibatalkan' : statusLabel(sale.payment_status)
                    ];
                    values.forEach(value => {
                        const cell = document.createElement('td');
                        cell.textContent = value;
                        row.appendChild(cell);
                    });
                    tbody.appendChild(row);
                });

                table.append(thead, tbody);
                wrap.appendChild(table);
                container.appendChild(wrap);
            };

            const renderOrderFlow = (sales, customerMap, productionBySale, schedulesBySale, measurementsBySchedule, paymentsBySale, errorText) => {
                const container = $('dashOrderFlow');
                if (!container) return;
                container.replaceChildren();
                if (errorText) {
                    const error = document.createElement('p');
                    error.className = 'gm-dashboard-empty is-error';
                    error.textContent = errorText;
                    container.appendChild(error);
                    return;
                }

                const activeSales = sales
                    .filter(sale => !sale.cancelled_at)
                    .sort((a, b) =>
                        String(a.sale_number || '').localeCompare(
                            String(b.sale_number || ''),
                            'id',
                            { numeric: true }
                        )
                    )
                    .slice(0, 8);
                if (!activeSales.length) {
                    const empty = document.createElement('p');
                    empty.className = 'gm-dashboard-empty';
                    empty.textContent = 'Belum ada pekerjaan aktif untuk ditampilkan.';
                    container.appendChild(empty);
                    return;
                }

                const stage = (name, label, state, iconName, moduleKey) => ({ name, label, state, iconName, moduleKey });
                const orderCards = document.createElement('div');
                orderCards.className = 'gm-dashboard-flow-list';
                activeSales.forEach(sale => {
                    const customer = customerMap.get(String(sale.customer_id));
                    const saleSchedules = schedulesBySale.get(String(sale.id)) || [];
                    const measureSchedules = saleSchedules.filter(item =>
                        ['measurement', 'survey'].includes(item.work_type) && item.status !== 'cancelled'
                    );
                    const linkedMeasureRows = measureSchedules
                        .flatMap(item => measurementsBySchedule.get(String(item.id)) || [])
                        .filter(item => item.status !== 'cancelled');
                    const completedMeasure = linkedMeasureRows.find(item => item.status === 'completed');
                    const draftMeasure = linkedMeasureRows.find(item => item.status === 'draft');
                    const measurementStage = completedMeasure
                        ? stage('Pengukuran', 'Selesai', 'done', 'fa-ruler-combined', 'measurement')
                        : draftMeasure
                            ? stage('Pengukuran', 'Perlu dilengkapi', 'progress', 'fa-ruler-combined', 'measurement')
                            : measureSchedules.length
                                ? stage('Pengukuran', 'Terjadwal', 'planned', 'fa-ruler-combined', 'measurement')
                                : stage('Pengukuran', 'Hubungkan jadwal', 'waiting', 'fa-ruler-combined', 'schedule');

                    const order = productionBySale.get(String(sale.id));
                    const productionLabel = ({
                        waiting: ['Menunggu', 'planned'],
                        in_production: ['Diproduksi', 'progress'],
                        ready_for_installation: ['Siap dipasang', 'ready'],
                        completed: ['Selesai', 'done'],
                        cancelled: ['Dibatalkan', 'cancelled']
                    })[order?.status] || ['Belum dibuat', 'waiting'];
                    const productionStage = stage('Produksi', productionLabel[0], productionLabel[1], 'fa-scissors', 'production');

                    const installationSchedules = saleSchedules.filter(item => item.work_type === 'installation');
                    const activeInstallation = installationSchedules.find(item => !['completed', 'cancelled'].includes(item.status));
                    const completedInstallation = installationSchedules.find(item => item.status === 'completed');
                    const selectedInstallation = activeInstallation || completedInstallation;
                    const installationLabel = !selectedInstallation
                        ? ['Belum dijadwalkan', 'waiting']
                        : selectedInstallation.status === 'completed'
                            ? ['Selesai', 'done']
                            : selectedInstallation.status === 'in_progress'
                                ? ['Sedang dikerjakan', 'progress']
                                : [selectedInstallation.status === 'rescheduled' ? 'Dijadwalkan ulang' : 'Terjadwal', 'planned'];
                    const installationStage = stage('Pemasangan', installationLabel[0], installationLabel[1], 'fa-calendar-check', 'schedule');

                    const total = Number(sale.total || 0);
                    const paid = paymentsBySale.get(String(sale.id)) || 0;
                    const balance = Math.max(0, total - paid);
                    const paymentStage = balance <= 0
                        ? stage('Pembayaran', 'Lunas', 'done', 'fa-circle-check', 'receipts')
                        : paid > 0
                            ? stage('Pembayaran', 'DP · sisa ' + formatMoney(balance), 'progress', 'fa-wallet', 'receipts')
                            : stage('Pembayaran', 'Belum dibayar', 'waiting', 'fa-wallet', 'receipts');

                    const card = document.createElement('article');
                    card.className = 'gm-dashboard-flow-card';
                    const head = document.createElement('div');
                    head.className = 'gm-dashboard-flow-head';
                    const copy = document.createElement('div');
                    copy.className = 'gm-dashboard-flow-title';
                    const number = document.createElement('strong');
                    number.textContent = sale.sale_number || 'Transaksi';
                    const person = document.createElement('span');
                    person.textContent = (customer?.full_name || 'Pelanggan tidak diketahui') + ' · ' + formatDate(sale.sale_date);
                    copy.append(number, person);
                    const amount = document.createElement('span');
                    amount.className = 'gm-dashboard-flow-total';
                    amount.textContent = formatMoney(sale.total);
                    head.append(copy, amount);

                    const steps = document.createElement('div');
                    steps.className = 'gm-dashboard-flow-steps';
                    [measurementStage, productionStage, installationStage, paymentStage].forEach(item => {
                        const step = document.createElement('button');
                        step.type = 'button';
                        step.className = 'gm-dashboard-flow-step is-' + item.state;
                        step.dataset.dashboardModule = item.moduleKey;
                        step.disabled = !!allowedModules && !allowedModules.has(item.moduleKey);
                        if (step.disabled) step.title = 'Akses modul ini belum diberikan oleh Owner.';
                        const symbol = document.createElement('span');
                        symbol.className = 'gm-dashboard-flow-icon';
                        const icon = document.createElement('i');
                        icon.className = 'fa-solid ' + item.iconName;
                        icon.setAttribute('aria-hidden', 'true');
                        symbol.appendChild(icon);
                        const details = document.createElement('span');
                        details.className = 'gm-dashboard-flow-copy';
                        const label = document.createElement('small');
                        label.textContent = item.name;
                        const status = document.createElement('strong');
                        status.textContent = item.label;
                        details.append(label, status);
                        step.append(symbol, details);
                        steps.appendChild(step);
                    });
                    card.append(head, steps);
                    orderCards.appendChild(card);
                });
                container.appendChild(orderCards);
            };

            const resetMetrics = () => {
                [
                    'dashTotalCustomers',
                    'dashActiveTransactions',
                    'dashTodaySchedules',
                    'dashDraftMeasurements',
                    'dashActiveProduction',
                    'dashOutstanding',
                    'dashOutstandingNote'
                ].forEach(id => setText(id, '—'));
            };

            if (!client) {
                resetMetrics();
                if (message) message.textContent =
                    'Koneksi Supabase belum tersedia. Periksa config.js dan proses login.';
                renderTaskList('dashAgendaList', [], '', 'Jadwal tidak dapat dimuat tanpa koneksi Supabase.');
                renderTaskList('dashMeasurementList', [], '', 'Data ukur tidak dapat dimuat tanpa koneksi Supabase.');
                renderTaskList('dashProductionList', [], '', 'Pesanan tidak dapat dimuat tanpa koneksi Supabase.');
                renderTaskList('dashBillingList', [], '', 'Tagihan tidak dapat dimuat tanpa koneksi Supabase.');
                renderRecentTransactions([], new Map(), 'Transaksi tidak dapat dimuat tanpa koneksi Supabase.');
                renderOrderFlow([], new Map(), new Map(), new Map(), new Map(), new Map(), 'Alur pekerjaan tidak dapat dimuat tanpa koneksi Supabase.');
                return;
            }

            try {
                const [
                    customersResult,
                    salesResult,
                    upcomingResult,
                    overdueResult,
                    measurementsResult,
                    productionResult
                ] = await Promise.all([
                    client.from('customers')
                        .select('id,full_name', { count: 'exact' })
                        .order('full_name', { ascending: true })
                        .limit(5000),

                    client.from('sales')
                        .select('id,sale_number,sale_date,customer_id,total,payment_status,cancelled_at')
                        .order('sale_date', { ascending: false })
                        .limit(1000),

                    client.from('work_schedules')
                        .select('id,schedule_number,customer_id,work_type,scheduled_date,scheduled_time,status')
                        .gte('scheduled_date', today)
                        .order('scheduled_date', { ascending: true })
                        .order('scheduled_time', { ascending: true })
                        .limit(50),

                    client.from('work_schedules')
                        .select('id,schedule_number,customer_id,work_type,scheduled_date,scheduled_time,status')
                        .lt('scheduled_date', today)
                        .in('status', ['scheduled', 'confirmed', 'in_progress', 'rescheduled'])
                        .order('scheduled_date', { ascending: false })
                        .limit(20),

                    client.from('measurements')
                        .select('id,schedule_id,measurement_number,measured_at,status')
                        .eq('status', 'draft')
                        .order('measured_at', { ascending: false })
                        .limit(100),

                    client.from('production_orders')
                        .select('sale_id,status,updated_at')
                        .order('updated_at', { ascending: false })
                        .limit(2000)
                ]);

                const customers = customersResult.data || [];
                const sales = salesResult.data || [];
                const upcomingSchedules = upcomingResult.data || [];
                const overdueSchedules = overdueResult.data || [];
                const draftMeasurements = measurementsResult.data || [];
                const productionOrders = productionResult.data || [];
                const customerMap = new Map(
                    customers.map(customer => [String(customer.id), customer])
                );

                const saleIds = sales.map(sale => sale.id).filter(Boolean);
                const measurementScheduleIds = [...new Set(
                    draftMeasurements.map(item => item.schedule_id).filter(Boolean)
                )];

                const [paymentsResult, measurementSchedulesResult, saleSchedulesResult] = await Promise.all([
                    saleIds.length
                        ? client.from('payments')
                            .select('sale_id,amount')
                            .in('sale_id', saleIds)
                            .limit(10000)
                        : Promise.resolve({ data: [], error: null }),

                    measurementScheduleIds.length
                        ? client.from('work_schedules')
                            .select('id,customer_id,schedule_number')
                            .in('id', measurementScheduleIds)
                        : Promise.resolve({ data: [], error: null }),

                    saleIds.length
                        ? client.from('work_schedules')
                            .select('id,sale_id,work_type,scheduled_date,status')
                            .in('sale_id', saleIds)
                            .order('scheduled_date', { ascending: false })
                            .limit(5000)
                        : Promise.resolve({ data: [], error: null })
                ]);

                const saleSchedules = saleSchedulesResult.data || [];
                const saleScheduleIds = [...new Set(saleSchedules.map(item => item.id).filter(Boolean))];
                const linkedMeasurementsResult = saleScheduleIds.length && !saleSchedulesResult.error
                    ? await client.from('measurements')
                        .select('id,schedule_id,status,measured_at')
                        .in('schedule_id', saleScheduleIds)
                        .order('measured_at', { ascending: false })
                        .limit(5000)
                    : { data: [], error: saleSchedulesResult.error || null };

                const payments = paymentsResult.data || [];
                const measurementSchedules = measurementSchedulesResult.data || [];
                const linkedMeasurements = linkedMeasurementsResult.data || [];
                const schedulesBySale = new Map();
                saleSchedules.forEach(schedule => {
                    const key = String(schedule.sale_id);
                    if (!schedulesBySale.has(key)) schedulesBySale.set(key, []);
                    schedulesBySale.get(key).push(schedule);
                });
                const measurementsBySchedule = new Map();
                linkedMeasurements.forEach(measurement => {
                    const key = String(measurement.schedule_id);
                    if (!measurementsBySchedule.has(key)) measurementsBySchedule.set(key, []);
                    measurementsBySchedule.get(key).push(measurement);
                });
                const measurementScheduleMap = new Map(
                    measurementSchedules.map(schedule => [String(schedule.id), schedule])
                );
                const paymentsBySale = new Map();
                payments.forEach(payment => {
                    const key = String(payment.sale_id);
                    paymentsBySale.set(
                        key,
                        (paymentsBySale.get(key) || 0) + Number(payment.amount || 0)
                    );
                });

                const activeSales = sales.filter(sale => !sale.cancelled_at);
                const activeProductionStatuses = [
                    'waiting',
                    'in_production',
                    'ready_for_installation'
                ];
                const productionBySale = new Map();
                productionOrders.forEach(order => {
                    if (!productionBySale.has(String(order.sale_id))) {
                        productionBySale.set(String(order.sale_id), order);
                    }
                });

                const productionItems = activeSales.map(sale => {
                    const order = productionBySale.get(String(sale.id));
                    return { sale, order };
                }).filter(item =>
                    !item.order || activeProductionStatuses.includes(item.order.status)
                ).sort((a, b) =>
                    String(a.sale.sale_date || '').localeCompare(String(b.sale.sale_date || ''))
                );

                const outstandingItems = activeSales.map(sale => {
                    const total = Number(sale.total || 0);
                    const paid = paymentsBySale.get(String(sale.id)) || 0;
                    return { sale, balance: Math.max(0, total - paid) };
                }).filter(item => item.balance > 0)
                    .sort((a, b) => b.balance - a.balance);

                const todaySchedules = upcomingSchedules.filter(schedule =>
                    schedule.scheduled_date === today &&
                    !['completed', 'cancelled'].includes(schedule.status)
                );

                setText('dashTotalCustomers',
                    customersResult.error ? '—' : Number(customersResult.count ?? customers.length).toLocaleString('id-ID'));
                setText('dashActiveTransactions',
                    salesResult.error ? '—' : activeSales.length.toLocaleString('id-ID'));
                setText('dashTodaySchedules',
                    upcomingResult.error ? '—' : todaySchedules.length.toLocaleString('id-ID'));
                setText('dashDraftMeasurements',
                    measurementsResult.error ? '—' : draftMeasurements.length.toLocaleString('id-ID'));
                setText('dashActiveProduction',
                    salesResult.error || productionResult.error ? '—' : productionItems.length.toLocaleString('id-ID'));

                const outstandingTotal = outstandingItems.reduce(
                    (sum, item) => sum + item.balance,
                    0
                );
                setText('dashOutstanding',
                    salesResult.error || paymentsResult.error ? '—' : formatMoney(outstandingTotal));
                setText('dashOutstandingNote',
                    salesResult.error || paymentsResult.error
                        ? 'Data pembayaran belum dapat dihitung'
                        : outstandingItems.length.toLocaleString('id-ID') + ' transaksi belum lunas');

                const scheduleError = upcomingResult.error || overdueResult.error;
                const agenda = [
                    ...overdueSchedules
                        .filter(schedule => !['completed', 'cancelled'].includes(schedule.status))
                        .sort((a, b) => String(b.scheduled_date).localeCompare(String(a.scheduled_date)))
                        .map(schedule => ({ schedule, overdue: true })),
                    ...upcomingSchedules
                        .filter(schedule => !['completed', 'cancelled'].includes(schedule.status))
                        .map(schedule => ({ schedule, overdue: false }))
                ].slice(0, 6).map(item => {
                    const schedule = item.schedule;
                    const customer = customerMap.get(String(schedule.customer_id));
                    const dateLabel = item.overdue
                        ? 'Lewat jadwal'
                        : schedule.scheduled_date === today
                            ? 'Hari ini'
                            : formatDate(schedule.scheduled_date);
                    const time = schedule.scheduled_time
                        ? String(schedule.scheduled_time).slice(0, 5)
                        : 'Jam belum diatur';
                    return {
                        title: customer?.full_name || 'Pelanggan belum diketahui',
                        detail: (schedule.schedule_number || 'Jadwal') + ' · ' +
                            workTypeLabel(schedule.work_type) + ' · ' + time + ' · ' +
                            statusLabel(schedule.status),
                        badge: dateLabel,
                        urgent: item.overdue
                    };
                });
                renderTaskList(
                    'dashAgendaList',
                    agenda,
                    'Tidak ada jadwal yang perlu ditindaklanjuti.',
                    scheduleError ? 'Jadwal tidak dapat dimuat: ' + scheduleError.message : ''
                );

                const measurementItems = draftMeasurements.slice(0, 6).map(measurement => {
                    const schedule = measurementScheduleMap.get(String(measurement.schedule_id));
                    const customer = schedule
                        ? customerMap.get(String(schedule.customer_id))
                        : null;
                    return {
                        title: measurement.measurement_number || 'Pengukuran tanpa nomor',
                        detail: (customer?.full_name || 'Pelanggan tidak diketahui') +
                            ' · ' + formatDate(measurement.measured_at) +
                            (schedule?.schedule_number ? ' · ' + schedule.schedule_number : ''),
                        badge: statusLabel(measurement.status)
                    };
                });
                renderTaskList(
                    'dashMeasurementList',
                    measurementItems,
                    'Tidak ada pengukuran draf.',
                    measurementsResult.error
                        ? 'Data pengukuran tidak dapat dimuat: ' + measurementsResult.error.message
                        : measurementScheduleIds.length && measurementSchedulesResult.error
                            ? 'Jadwal pelanggan pengukuran tidak dapat dimuat: ' + measurementSchedulesResult.error.message
                            : ''
                );

                const productionTaskItems = productionItems.slice(0, 6).map(item => {
                    const sale = item.sale;
                    const order = item.order;
                    const customer = customerMap.get(String(sale.customer_id));
                    const productionStatus = order?.status || 'Belum diatur';
                    return {
                        title: (sale.sale_number || 'Transaksi') + ' · ' +
                            (customer?.full_name || 'Pelanggan tidak diketahui'),
                        detail: formatDate(sale.sale_date) + ' · ' + formatMoney(sale.total),
                        badge: statusLabel(productionStatus)
                    };
                });
                renderTaskList(
                    'dashProductionList',
                    productionTaskItems,
                    'Tidak ada pesanan aktif yang perlu diproses.',
                    salesResult.error
                        ? 'Data transaksi tidak dapat dimuat: ' + salesResult.error.message
                        : productionResult.error
                            ? 'Data produksi tidak dapat dimuat: ' + productionResult.error.message
                            : ''
                );

                const billingTaskItems = outstandingItems.slice(0, 6).map(item => {
                    const sale = item.sale;
                    const customer = customerMap.get(String(sale.customer_id));
                    return {
                        title: (sale.sale_number || 'Transaksi') + ' · ' +
                            (customer?.full_name || 'Pelanggan tidak diketahui'),
                        detail: 'Total ' + formatMoney(sale.total) + ' · ' +
                            statusLabel(sale.payment_status),
                        badge: 'Sisa ' + formatMoney(item.balance),
                        urgent: true
                    };
                });
                renderTaskList(
                    'dashBillingList',
                    billingTaskItems,
                    'Tidak ada sisa tagihan.',
                    salesResult.error
                        ? 'Data transaksi tidak dapat dimuat: ' + salesResult.error.message
                        : paymentsResult.error
                            ? 'Data pembayaran tidak dapat dimuat: ' + paymentsResult.error.message
                            : ''
                );

                renderRecentTransactions(
                    salesResult.error ? [] : sales,
                    customerMap,
                    salesResult.error
                        ? 'Transaksi tidak dapat dimuat: ' + salesResult.error.message
                        : ''
                );

                const flowError = salesResult.error || customersResult.error ||
                    paymentsResult.error || productionResult.error ||
                    saleSchedulesResult.error || linkedMeasurementsResult.error;
                renderOrderFlow(
                    sales,
                    customerMap,
                    productionBySale,
                    schedulesBySale,
                    measurementsBySchedule,
                    paymentsBySale,
                    flowError
                        ? 'Progres belum lengkap karena sebagian data terkait tidak dapat dimuat. Periksa izin akses Supabase untuk transaksi, jadwal, pengukuran, produksi, dan pembayaran.'
                        : ''
                );

                const issues = [
                    customersResult.error && 'pelanggan',
                    salesResult.error && 'transaksi',
                    paymentsResult.error && 'pembayaran',
                    (upcomingResult.error || overdueResult.error) && 'jadwal',
                    (measurementsResult.error || measurementSchedulesResult.error) && 'pengukuran',
                    productionResult.error && 'produksi',
                    (saleSchedulesResult.error || linkedMeasurementsResult.error) && 'alur pekerjaan'
                ].filter(Boolean);

                if (message) {
                    message.textContent = issues.length
                        ? 'Sebagian ringkasan belum dapat dimuat (' + issues.join(', ') + '). Periksa izin akses Supabase untuk tabel terkait.'
                        : '';
                }

                [
                    customersResult,
                    salesResult,
                    paymentsResult,
                    upcomingResult,
                    overdueResult,
                    measurementsResult,
                    productionResult,
                    measurementSchedulesResult,
                    saleSchedulesResult,
                    linkedMeasurementsResult
                ].forEach(result => {
                    if (result?.error) console.warn('Dashboard section:', result.error);
                });

            } catch (error) {
                console.error('Dashboard error:', error);
                resetMetrics();
                if (message) message.textContent =
                    'Dashboard gagal dimuat: ' + (error.message || 'Periksa koneksi Supabase.');
                renderTaskList('dashAgendaList', [], '', 'Jadwal belum dapat dimuat.');
                renderTaskList('dashMeasurementList', [], '', 'Pengukuran belum dapat dimuat.');
                renderTaskList('dashProductionList', [], '', 'Pesanan belum dapat dimuat.');
                renderTaskList('dashBillingList', [], '', 'Tagihan belum dapat dimuat.');
                renderRecentTransactions([], new Map(), 'Transaksi belum dapat dimuat.');
                renderOrderFlow([], new Map(), new Map(), new Map(), new Map(), new Map(), 'Alur pekerjaan belum dapat dimuat.');
            }
        }
    };

    window.GMDashboard = Dashboard;
})();
