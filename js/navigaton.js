// Tampilkan tombol Buat Struk dan Riwayat Transaksi
// hanya ketika modul Struk & Transaksi aktif.
document.addEventListener('DOMContentLoaded', () => {
    const receiptActions = document.getElementById('receiptActions');

    if (!receiptActions) return;

    function updateReceiptActions(moduleName) {
        receiptActions.hidden = moduleName !== 'receipts';
    }

    // Pantau navigasi sidebar.
    document.querySelectorAll('.gm-nav-button[data-module]').forEach(button => {
        button.addEventListener('click', () => {
            updateReceiptActions(button.dataset.module);
        });
    });

    // Kondisi awal: tombol disembunyikan.
    updateReceiptActions('');
});