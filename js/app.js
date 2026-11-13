
(() => {
    'use strict';

    let currentModule = null;

    const moduleNames = {
        dashboard: 'Dashboard',
        receipts: 'Struk & Transaksi',
        finance: 'Keuangan',
        customers: 'Pelanggan',
        schedule: 'Jadwal Kerja',
        measurement: 'Pengukuran',
        production: 'Produksi & Pesanan',
        reports: 'Laporan',
        admins: 'Manajemen Admin'
    };
    const appHistoryKey = 'gmManagementNavigation';

    function recordNavigation(route, moduleKey, replace = false) {
        const state = history.state && typeof history.state === 'object'
            ? history.state
            : {};
        const nextState = {
            ...state,
            [appHistoryKey]: true,
            gmRoute: route,
            gmModule: moduleKey
        };

        if (
            state[appHistoryKey] &&
            state.gmRoute === route &&
            state.gmModule === moduleKey
        ) return;

        if (replace || !state[appHistoryKey]) {
            history.replaceState(nextState, '', window.location.href);
        } else {
            history.pushState(nextState, '', window.location.href);
        }
    }

    function getMainElements() {
        return {
            app: document.getElementById('appContent'),
            main: document.getElementById('mainContent'),
            history: document.getElementById('historySection'),
            topbarTitle: document.querySelector('.gm-page-title'),
            topbarDescription: document.querySelector('.gm-page-description')
        };
    }

    // Membuat area khusus untuk Dashboard dan modul lainnya.
    function getModuleContainer() {
        const main = document.getElementById('mainContent');

        if (!main || !main.parentNode) {
            return null;
        }

        let container = document.getElementById('gmDashboardContainer');

        if (!container) {
            container = document.createElement('section');
            container.id = 'gmDashboardContainer';
            container.hidden = true;

            main.parentNode.insertBefore(container, main);
        }

        return container;
    }



    function showPlaceholder(moduleKey, description) {
        const container = getModuleContainer();

        if (!container) return;

        container.replaceChildren();

        const panel = document.createElement('section');
        panel.className = 'gm-dashboard-panel';

        const paragraph = document.createElement('p');
        paragraph.textContent = description ||
            'Modul ini belum tersedia. Fitur akan ditambahkan pada tahap berikutnya.';

        panel.append(paragraph);
        container.appendChild(panel);
        container.hidden = false;
    }

    function updateSidebar(moduleKey) {
        document.querySelectorAll('.gm-nav-button').forEach(button => {
            const active = button.dataset.module === moduleKey;

            button.classList.toggle('active', active);

            if (active) {
                button.setAttribute('aria-current', 'page');
            } else {
                button.removeAttribute('aria-current');
            }
        });
    }

    function updatePageTitle(moduleKey) {
        const elements = getMainElements();

        if (elements.topbarTitle) {
            elements.topbarTitle.textContent = moduleNames[moduleKey];
        }

        if (elements.topbarDescription) {
            elements.topbarDescription.textContent = '';
            elements.topbarDescription.hidden = true;
        }
    }

    async function openModule(moduleKey, { skipHistory = false } = {}) {
        const elements = getMainElements();
        const container = getModuleContainer();

        if (!elements.main || !container) {
            console.error(
                'Gorden Malang: mainContent atau container modul tidak ditemukan.'
            );
            return;
        }

        if (!moduleNames[moduleKey]) {
            console.warn('Modul tidak dikenal:', moduleKey);
            return;
        }

        if (Array.isArray(window.gmModuleAccess) && !window.gmModuleAccess.includes(moduleKey)) {
            showPlaceholder(moduleKey, 'Akses modul ini belum diberikan. Minta Owner menyesuaikan pembagian tugas akun Anda.');
            return;
        }

        if (!skipHistory) {
            recordNavigation('module', moduleKey, currentModule === null);
        }
        currentModule = moduleKey;

        updateSidebar(moduleKey);
        updatePageTitle(moduleKey);

        // Sembunyikan riwayat saat berpindah menu.
        if (elements.history) {
            elements.history.hidden = true;
        }

        // Sembunyikan kedua area sebelum menampilkan modul yang dipilih.
        elements.main.hidden = true;
        container.hidden = true;
        container.replaceChildren();

        // Tombol aksi hanya tampil pada modul Struk & Transaksi.
        const receiptActions = document.getElementById('receiptActions');

        if (receiptActions) {
            receiptActions.hidden = moduleKey !== 'receipts';
        }


        // =========================================
        // STRUK & TRANSAKSI
        // =========================================
        if (moduleKey === 'receipts') {
            elements.main.hidden = true;
            container.hidden = false;

            if (receiptActions) {
                receiptActions.hidden = true;
            }

            if (window.GMReceipts) {
                try {
                    container.innerHTML = window.GMReceipts.render();

                    await window.GMReceipts.init();
                } catch (error) {
                    console.error(
                        'Gagal membuka Struk & Transaksi:',
                        error
                    );

                    container.innerHTML = `
                        <section class="gm-dashboard gm-module-error">
                            <p>
                                Modul gagal dimuat. Periksa Console browser
                                dan koneksi Supabase.
                            </p>
                            <button
                                type="button"
                                class="btn primary"
                                id="retryReceiptsButton"
                            >
                                Coba Lagi
                            </button>
                        </section>
                    `;

                    const retryButton =
                        container.querySelector('#retryReceiptsButton');

                    retryButton?.addEventListener('click', () => {
                        openModule('receipts');
                    });
                }
            } else {
                console.error(
                    'window.GMReceipts tidak ditemukan. ' +
                    'Periksa pemuatan js/modules/receipts.js.'
                );

                container.innerHTML = `
                    <section class="gm-dashboard gm-module-error">
                        <p>
                            Modul struk belum tersedia.
                            Pastikan file js/modules/receipts.js
                            dimuat sebelum js/app.js.
                        </p>
                    </section>
                `;
            }

            return;
        }

        // =========================================
        // DASHBOARD
        // =========================================
        if (moduleKey === 'dashboard') {
            container.hidden = false;

            if (window.GMDashboard) {
                try {
                    container.innerHTML =
                        window.GMDashboard.render();

                    await window.GMDashboard.init();
                } catch (error) {
                    console.error('Gagal membuka Dashboard:', error);

                    showPlaceholder(
                        'dashboard',
                        'Dashboard gagal dimuat. Periksa koneksi Supabase dan struktur kode Dashboard.'
                    );
                }
            } else {
                showPlaceholder(
                    'dashboard',
                    'Dashboard belum dimuat. Pastikan js/modules/dashboard.js sudah ditautkan di index.html.'
                );
            }

            return;
        }

        // =========================================
        // PELANGGAN
        // =========================================
        if (moduleKey === 'customers') {
            container.hidden = false;

            if (window.GMCustomers) {
                try {
                    container.innerHTML =
                        window.GMCustomers.render();

                    await window.GMCustomers.init();
                } catch (error) {
                    console.error(
                        'Gagal membuka modul Pelanggan:',
                        error
                    );

                    showPlaceholder(
                        'customers',
                        'Modul pelanggan gagal dimuat. Periksa Console browser dan koneksi Supabase.'
                    );
                }
            } else {
                showPlaceholder(
                    'customers',
                    'Modul pelanggan belum dimuat. Pastikan js/modules/customers.js sudah ditautkan di index.html.'
                );
            }

            return;
        }


        // =========================================
        // KEUANGAN
        // =========================================
        if (moduleKey === 'finance') {
            container.hidden = false;

            if (window.GMFinance) {
                try {
                    container.innerHTML =
                        window.GMFinance.render();

                    await window.GMFinance.init();
                } catch (error) {
                    console.error(
                        'Gagal membuka Keuangan:',
                        error
                    );

                    showPlaceholder(
                        'finance',
                        'Modul Keuangan gagal dimuat. Periksa Console browser.'
                    );
                }
            } else {


                showPlaceholder(
                    'finance',
                    'Modul Keuangan belum dimuat. Pastikan js/modules/finance.js sudah ditautkan di index.html.'
                );
            }

            return;
        }

        // =========================================
        // LAPORAN
        // =========================================
        if (moduleKey === 'reports') {
            container.hidden = false;

            if (window.GMReports) {
                try {
                    container.innerHTML = window.GMReports.render();
                    await window.GMReports.init();
                } catch (error) {
                    console.error('Gagal membuka Laporan:', error);
                    showPlaceholder(
                        'reports',
                        'Laporan gagal dimuat. Periksa koneksi Supabase dan data Keuangan.'
                    );
                }
            } else {
                showPlaceholder(
                    'reports',
                    'Modul Laporan belum dimuat. Pastikan js/modules/reports.js sudah ditautkan di index.html.'
                );
            }

            return;
        }

        // =========================================
        // JADWAL KERJA
        // =========================================
        if (moduleKey === 'schedule') {
            container.hidden = false;

            if (window.GMSchedule) {
                try {
                    container.innerHTML = window.GMSchedule.render();
                    await window.GMSchedule.init();
                } catch (error) {
                    console.error('Gagal membuka Jadwal Kerja:', error);

                    showPlaceholder(
                        'schedule',
                        'Modul Jadwal Kerja gagal dimuat. Periksa Console browser.'
                    );
                }
            } else {
                showPlaceholder(
                    'schedule',
                    'Modul Jadwal Kerja belum dimuat. Periksa script schedule.js di index.html.'
                );
            }

            return;
        }


        // =========================================
        // PRODUKSI & PESANAN
        // =========================================
        if (moduleKey === 'production') {
            container.hidden = false;

            if (window.GMProduction) {
                try {
                    container.innerHTML =
                        window.GMProduction.render();

                    await window.GMProduction.init();
                } catch (error) {
                    console.error(
                        'Gagal membuka Produksi & Pesanan:',
                        error
                    );

                    showPlaceholder(
                        'production',
                        'Modul Produksi gagal dimuat. Periksa Console browser.'
                    );
                }
            } else {
                showPlaceholder(
                    'production',
                    'Modul Produksi belum dimuat. Periksa script production.js di index.html.'
                );
            }

            return;
        }


        // =========================================
        // PENGUKURAN
        // =========================================
        if (moduleKey === 'measurement') {
            container.hidden = false;

            if (window.GMMeasurement) {
                try {
                    container.innerHTML =
                        window.GMMeasurement.render();

                    await window.GMMeasurement.init();
                } catch (error) {
                    console.error(
                        'Gagal membuka modul Pengukuran:',
                        error
                    );

                    showPlaceholder(
                        'measurement',
                        'Modul Pengukuran gagal dimuat. Periksa Console browser dan koneksi Supabase.'
                    );
                }
            } else {
                showPlaceholder(
                    'measurement',
                    'Modul Pengukuran belum dimuat. Pastikan js/modules/measurement.js sudah ditautkan di index.html.'
                );
            }

            return;
        }

        // =========================================
        // MANAJEMEN ADMIN
        // =========================================
        if (moduleKey === 'admins') {
            container.hidden = false;

            if (window.GMAdmins) {
                try {
                    container.innerHTML = window.GMAdmins.render();
                    await window.GMAdmins.init();
                } catch (error) {
                    console.error('Gagal membuka Manajemen Admin:', error);
                    showPlaceholder('admins', 'Manajemen Admin gagal dimuat. Periksa koneksi Supabase dan policy akses akun.');
                }
            } else {
                showPlaceholder('admins', 'Manajemen Admin belum dimuat. Pastikan js/modules/admins.js sudah ditautkan di index.html.');
            }

            return;
        }


        // =========================================
        // MODUL LAINNYA
        // =========================================
        showPlaceholder(
            moduleKey,
            'Modul ini belum diaktifkan. Menu sudah tersedia dan fiturnya dapat dikembangkan berikutnya.'
        );

    }


        // Membuka detail pekerjaan dari notifikasi.
        async function openNotification(notification) {
            if (!notification) return;

            const moduleKey =
                notification.entity_type === 'schedule'
                    ? 'schedule'
                    : notification.entity_type === 'production'
                        ? 'production'
                        : null;

            if (!moduleKey) return;

            if (
                Array.isArray(window.gmModuleAccess) &&
                !window.gmModuleAccess.includes(moduleKey)
            ) {
                alert('Anda tidak memiliki akses ke modul pekerjaan ini.');
                return;
            }

            await openModule(moduleKey);

            if (moduleKey === 'schedule') {
                if (window.GMSchedule) {
                    window.GMSchedule.openDetail(notification.entity_id);
                }
            }

            if (moduleKey === 'production') {
                if (window.GMProduction) {
                    window.GMProduction.showDetail(notification.entity_id);
                }
            }
        }


    function openHistory({ skipHistory = false } = {}) {
        if (Array.isArray(window.gmModuleAccess) && !window.gmModuleAccess.includes('receipts')) {
            return;
        }
        if (!skipHistory) {
            recordNavigation('history', 'receipts', currentModule === null);
        }
        const elements = getMainElements();
        const container = getModuleContainer();

        // Jangan tampilkan Dashboard di belakang riwayat.
        if (elements.main) {
            elements.main.hidden = true;
        }

        if (container) {
            container.hidden = true;
        }

        if (elements.history) {
            elements.history.hidden = false;
        }

        // Tidak ada menu sidebar yang aktif ketika melihat riwayat.
        document.querySelectorAll('.gm-nav-button').forEach(button => {
            button.classList.remove('active');
            button.removeAttribute('aria-current');
        });

        if (elements.topbarTitle) {
            elements.topbarTitle.textContent = 'Riwayat Transaksi';
        }

        if (elements.topbarDescription) {
            elements.topbarDescription.textContent =
                'Lihat dan kelola transaksi yang tersimpan.';
        }

    }

    function initMobileNavigation() {
        const sidebar = document.querySelector('.gm-sidebar');
        const toggle = document.getElementById('gmSidebarToggle');
        const icon = toggle?.querySelector('i');
        const mobileViewport = window.matchMedia('(max-width: 700px)');

        if (!sidebar || !toggle) return;

        const setMenuOpen = open => {
            const expanded = mobileViewport.matches && open;
            sidebar.classList.toggle('is-menu-open', expanded);
            toggle.setAttribute('aria-expanded', String(expanded));
            toggle.setAttribute('aria-label', expanded ? 'Tutup menu navigasi' : 'Buka menu navigasi');
            icon?.classList.toggle('fa-bars', !expanded);
            icon?.classList.toggle('fa-xmark', expanded);
        };

        toggle.addEventListener('click', () => {
            setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
        });

        sidebar.querySelectorAll('.gm-nav-button').forEach(button => {
            button.addEventListener('click', () => {
                if (mobileViewport.matches) setMenuOpen(false);
            });
        });

        document.addEventListener('click', event => {
            if (mobileViewport.matches && !sidebar.contains(event.target)) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') setMenuOpen(false);
        });

        const closeOnDesktop = () => {
            if (!mobileViewport.matches) setMenuOpen(false);
        };

        if (typeof mobileViewport.addEventListener === 'function') {
            mobileViewport.addEventListener('change', closeOnDesktop);
        } else {
            mobileViewport.addListener(closeOnDesktop);
        }
    }

    function init() {
        const elements = getMainElements();

        if (!elements.app || !elements.main) {
            console.error(
                'Gorden Malang: elemen appContent atau mainContent tidak ditemukan.'
            );
            return;
        }

        // Navigasi sidebar.
        document.querySelectorAll('.gm-nav-button').forEach(button => {
            button.addEventListener('click', () => {
                openModule(button.dataset.module);
            });
        });

        initMobileNavigation();

        // Tombol Buat Struk.
        const showFormButton =
            document.getElementById('showFormButton');

        if (showFormButton) {
            showFormButton.addEventListener('click', () => {
                openModule('receipts');
            });
        }

        // Tombol Riwayat Transaksi.
        // Handler lama di index.html tetap dapat menjalankan loadHistory().
        const showHistoryButton =
            document.getElementById('showHistoryButton');

        if (showHistoryButton) {
            showHistoryButton.addEventListener('click', openHistory);
        }

        // Buat tiap perpindahan modul dapat ditelusuri dengan tombol atau gesture Back.
        window.addEventListener('popstate', event => {
            const state = event.state;
            if (!state || !state[appHistoryKey]) return;

            if (state.gmRoute === 'history') {
                openHistory({ skipHistory: true });
            } else if (moduleNames[state.gmModule]) {
                openModule(state.gmModule, { skipHistory: true });
            }
        });

        // Tampilkan Dashboard setelah aplikasi berhasil login.
        const observer = new MutationObserver(() => {
            if (!elements.app.hidden && currentModule === null) {
                openModule('dashboard');
            }
        });

        observer.observe(elements.app, {
            attributes: true,
            attributeFilter: ['hidden']
        });

        if (!elements.app.hidden) {
            openModule('dashboard');
        }
    }

        window.GMApp = {
            openModule,
            openNotification
        };

    document.addEventListener('DOMContentLoaded', init);
})();
