(() => {
    'use strict';

    const modules = {
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

    const roles = {
        owner: { label: 'Owner', icon: 'fa-crown', description: 'Semua modul dan pengelolaan tim.', modules: Object.keys(modules) },
        finance: { label: 'Keuangan', icon: 'fa-wallet', description: 'Keuangan dan laporan.', modules: ['finance', 'reports'] },
        sales: { label: 'Penjualan', icon: 'fa-receipt', description: 'Struk, transaksi, dan pelanggan.', modules: ['receipts', 'customers'] },
        operations: { label: 'Operasional', icon: 'fa-ruler-combined', description: 'Jadwal, pengukuran, dan produksi.', modules: ['schedule', 'measurement', 'production'] }
    };

    function modulesForRoles(selectedRoles) {
        const allowed = new Set(['dashboard']);
        for (const role of selectedRoles || []) {
            for (const moduleKey of roles[role]?.modules || []) allowed.add(moduleKey);
        }
        return Object.keys(modules).filter(moduleKey => allowed.has(moduleKey));
    }

    window.GMAccess = Object.freeze({ modules, roles, modulesForRoles });
})();
