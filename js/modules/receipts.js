
(() => {
    'use strict';

    const Receipts = {
        render() {
            return `
            <section class="gm-receipts">
                <div class="account-bar no-print">
                    <div class="account-actions">
                        <button type="button" class="btn light" id="receiptShowForm">Buat Struk</button>
                        <button type="button" class="btn light" id="receiptShowHistory">Riwayat Transaksi</button>
                    </div>
                </div>
                <p id="receiptPageMessage" role="status"></p>

                <section class="gm-receipt-original-layout" id="receiptFormSection">
                    <section class="panel form-panel">
                        <h2>✦ Invoice</h2>
                        <div class="grid">
                            <div class="field"><label for="gmReceiptNumber">Nomor Struk</label><input id="gmReceiptNumber" readonly></div>
                            <div class="field"><label for="gmReceiptDate">Tanggal</label><input id="gmReceiptDate" type="date"></div>
                            <div class="field">
                                <label for="gmReceiptCustomer">Nama Customer *</label>
                                <div class="customer-autocomplete">
                                    <input id="gmReceiptCustomer" placeholder="Cari nama customer" autocomplete="off">
                                    <div id="gmReceiptSuggestions" class="customer-suggestions" hidden></div>
                                </div>
                                <small id="gmReceiptCustomerMessage"></small>
                            </div>
                            <div class="field"><label for="gmReceiptPhone">No. WhatsApp Customer</label><input id="gmReceiptPhone" inputmode="tel" placeholder="08xxxxxxxxxx"></div>
                            <div class="field full"><label for="gmReceiptAddress">Alamat / Lokasi Pemasangan</label><textarea id="gmReceiptAddress" placeholder="Alamat customer"></textarea></div>
                        </div>

                        <h3>Rincian Produk / Jasa</h3>
                        <div class="items-head"><span>Produk / Keterangan</span><span>Qty</span><span>Harga satuan</span><span></span></div>
                        <div id="gmReceiptItems"></div>
                        <button type="button" class="btn light no-print" id="gmReceiptAdd">＋ Tambah item</button>

                        <h3>Pembayaran</h3>
                        <div class="grid">
                            <div class="field"><label for="gmReceiptDiscount">Diskon (Rp)</label><input id="gmReceiptDiscount" type="number" min="0" value="0"></div>
                            <div class="field"><label for="gmReceiptPaid">DP / Sudah dibayar (Rp)</label><input id="gmReceiptPaid" type="number" min="0" value="0"></div>
                            <div class="field full">
                                <label for="gmReceiptMethod">Metode pembayaran</label>
                                <select id="gmReceiptMethod">
                                    <option value="Transfer Bank">Transfer Bank</option><option value="Tunai">Tunai</option>
                                    <option value="QRIS">QRIS</option><option value="Transfer / Tunai">Transfer / Tunai</option>
                                    <option value="Belum dibayar">Belum dibayar</option>
                                </select>
                            </div>
                            <div class="field full"><label for="gmReceiptNotes">Catatan / Ketentuan</label>
                                <textarea id="gmReceiptNotes" rows="5">• Garansi pemasangan 3 bulan: rel, breket, bor, dan kendala instalasi.
• Kain tidak bergaransi atas kerusakan akibat faktor pemakaian luar.
• Barang yang sudah dibeli tidak dapat ditukar/dikembalikan, kecuali ada perjanjian.</textarea>
                            </div>
                        </div>
                        <div class="btns no-print">
                            <button type="button" class="btn primary" id="gmReceiptPrint">Cetak / Simpan PDF</button>
                            <button type="button" class="btn gold" id="gmReceiptWhatsApp">Kirim ke WhatsApp</button>
                            <button type="button" class="btn primary" id="gmReceiptSaveOnline">Simpan Transaksi Online</button>
                            <button type="button" class="btn light" id="gmReceiptCancelEdit" hidden>Batal Edit</button>
                        </div>
                    </section>

                    <section class="panel receipt-panel">
                        <div class="receipt" id="gmReceiptPreview">
                            <div class="receipt-head">
                                <img src="image/logo gm hitam.png" alt="Logo Gorden Malang" class="receipt-logo">
                                <div class="receipt-contact">
                                    <div>Jl. S. Supriadi IX Gg. Pendidikan No. 21 RT. 13 RW. 04</div>
                                    <div class="contact-info">☎ 0822 1133 2228 &nbsp; <i class="fab fa-instagram"></i> <i class="fab fa-tiktok"></i> GORDENMALANGOFFICIAL</div>
                                </div>
                                <p>Custom Curtains • Blinds • Vitrase • Curtain Laundry</p>
                            </div>
                            <div class="receipt-title"><strong>INVOICE</strong><span class="status" id="gmReceiptStatus">BELUM LUNAS</span></div>
                            <div class="meta">No: <span id="gmRNumber">—</span><br>Tanggal: <span id="gmRDate">—</span></div>
                            <div class="customer">
                                <div><b>Customer</b><span id="gmRCustomer">—</span></div>
                                <div><b>WhatsApp</b><span id="gmRPhone">—</span></div>
                                <div><b>Alamat</b><span id="gmRAddress">—</span></div>
                            </div>
                            <table><thead><tr><th>Produk / Keterangan</th><th>Qty</th><th>Harga</th><th>Jumlah</th></tr></thead><tbody id="gmRItems"></tbody></table>
                            <div class="totals">
                                <div class="totalrow"><span>Subtotal</span><strong id="gmRSubtotal">Rp0</strong></div>
                                <div class="totalrow"><span>Diskon</span><strong id="gmRDiscount">Rp0</strong></div>
                                <div class="totalrow grand"><span>Total</span><strong id="gmRTotal">Rp0</strong></div>
                                <div class="totalrow"><span>Sudah dibayar / DP</span><strong id="gmRPaid">Rp0</strong></div>
                                <div class="totalrow grand"><span>Sisa pembayaran</span><strong id="gmRBalance">Rp0</strong></div>
                                <div class="totalrow"><span>Metode</span><strong id="gmRMethod">—</strong></div>
                            </div>
                            <div class="bank-info">
                                <p><strong>Rek. BCA</strong> : 4480725838 / a.n. Indra Permana</p>
                                <p><strong>Rek. Bank Mandiri</strong> : 1440024376342 / a.n. Indra Permana</p>
                            </div>
                            <div class="notes"><b>Catatan:</b><span id="gmRNotes">—</span></div>
                            <div class="thank">Terima kasih atas kepercayaan Anda.</div>
                        </div>
                    </section>
                </section>

                <section id="gmReceiptHistorySection" class="panel no-print" hidden>
                    <div class="history-heading">
                        <div><h2>Riwayat Transaksi</h2><p>Daftar transaksi yang tersimpan online.</p></div>
                        <button type="button" class="btn light" id="gmReceiptRefreshHistory">Muat Ulang</button>
                    </div>
                    <div class="field"><label for="gmReceiptHistorySearch">Cari transaksi</label><input id="gmReceiptHistorySearch" type="search" placeholder="Nomor struk atau nama customer"></div>
                    <p id="gmReceiptHistoryMessage" role="status"></p>
                    <div class="history-table-wrap">
                        <table class="history-table">
                            <thead><tr><th>Tanggal</th><th>Nomor Struk</th><th>Customer</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
                            <tbody id="gmReceiptHistoryRows"><tr><td colspan="6">Klik Muat Ulang untuk mengambil data.</td></tr></tbody>
                        </table>
                    </div>
                </section>
            </section>`;
        },

        async init() {
            const root = document.querySelector('#gmDashboardContainer .gm-receipts');
            if (!root) {
                console.error('Modul Struk: elemen .gm-receipts tidak ditemukan di #gmDashboardContainer.');
                return;
            }

            if (root.dataset.initialized === 'true' || root.dataset.initializing === 'true') {
                return;
            }

            // Tandai sedang berjalan agar event tidak terpasang dua kali.
            root.dataset.initializing = 'true';

            try {
            const $ = id => root.querySelector(`#${id}`);
            const db = () => window.gmSupabase || window.supabaseClient;

            const requiredElements = [
                'gmReceiptNotes', 'gmReceiptCustomer', 'gmReceiptSuggestions',
                'gmReceiptNumber', 'gmReceiptDate', 'gmReceiptItems',
                'gmReceiptCustomerMessage', 'gmReceiptAdd', 'gmReceiptPrint',
                'gmReceiptWhatsApp', 'gmReceiptSaveOnline', 'gmReceiptCancelEdit',
                'gmReceiptHistorySection', 'gmReceiptRefreshHistory',
                'gmReceiptHistorySearch', 'gmReceiptHistoryRows',
                'receiptFormSection', 'receiptShowForm', 'receiptShowHistory',
                'gmReceiptPreview', 'gmReceiptStatus', 'gmRItems'
            ];
            const missingElements = requiredElements.filter(id => !$(id));
            if (missingElements.length) {
                throw new Error('Elemen HTML modul Struk tidak ditemukan: ' + missingElements.join(', '));
            }
            const rupiah = value => new Intl.NumberFormat('id-ID', {
                style: 'currency', currency: 'IDR', maximumFractionDigits: 0
            }).format(Math.max(0, Number(value) || 0));
            const escapeHTML = value => String(value ?? '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const todayISO = () => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            };
            const DEFAULT_NOTES = $('gmReceiptNotes').value;
            let customers = [];
            let selectedCustomer = null;
            let historyData = [];
            let busy = false;
            let editingSaleId = null;
            let editingOriginalPaid = 0;
            let numberLoading = false;
            let numberRequestId = 0;

            const customerInput = $('gmReceiptCustomer');
            const suggestions = $('gmReceiptSuggestions');

            function syncReceiptSaveButton() {
                const button = $('gmReceiptSaveOnline');
                if (!button || busy) return;
                if (editingSaleId) {
                    button.disabled = false;
                    button.textContent = 'Simpan Perubahan';
                    return;
                }
                const hasNumber = /^GM-\d{6}-\d{3,}$/.test($('gmReceiptNumber').value);
                button.disabled = numberLoading || !hasNumber;
                button.textContent = numberLoading ? 'Menyiapkan nomor…' : 'Simpan Transaksi Online';
            }

            async function setDefaultNumber() {
                const requestId = ++numberRequestId;
                const numberInput = $('gmReceiptNumber');
                numberInput.value = '';
                numberInput.placeholder = 'Mengambil nomor dari Supabase…';
                $('gmReceiptDate').value = todayISO();
                numberLoading = true;
                syncReceiptSaveButton();

                try {
                    const client = db();
                    if (!client) throw new Error('Koneksi Supabase belum tersedia.');
                    const { data, error } = await client.rpc('next_gm_receipt_number');
                    if (error) throw error;
                    if (requestId !== numberRequestId || editingSaleId) return;
                    if (typeof data !== 'string' || !/^GM-\d{6}-\d{3,}$/.test(data)) {
                        throw new Error('Supabase mengembalikan format nomor yang tidak valid.');
                    }
                    numberInput.value = data;
                    numberInput.placeholder = '';
                    $('receiptPageMessage').textContent = 'Nomor struk online siap digunakan.';
                } catch (error) {
                    if (requestId !== numberRequestId || editingSaleId) return;
                    console.error('Gagal meminta nomor struk dari Supabase:', error);
                    numberInput.value = '';
                    numberInput.placeholder = 'Nomor belum tersedia';
                    $('receiptPageMessage').textContent =
                        'Nomor struk belum tersedia. Jalankan database/next_gm_receipt_number.sql di Supabase, lalu muat ulang. ' +
                        (error.message || '');
                } finally {
                    if (requestId === numberRequestId) {
                        numberLoading = false;
                        syncReceiptSaveButton();
                    }
                }
            }

            async function loadCustomers() {
                const client = db();
                if (!client) {
                    $('gmReceiptCustomerMessage').textContent = 'Koneksi Supabase belum tersedia.';
                    return;
                }
                $('gmReceiptCustomerMessage').textContent = 'Memuat data pelanggan...';
                let result;
                try {
                    result = await client.from('customers')
                        .select('id,customer_code,full_name,phone,whatsapp,address')
                        .order('full_name', { ascending: true });
                } catch (error) {
                    console.error('Gagal menghubungi tabel customers:', error);
                    $('gmReceiptCustomerMessage').textContent = 'Data pelanggan gagal dimuat. Periksa koneksi Supabase.';
                    return;
                }
                const { data, error } = result;
                if (error) {
                    console.error(error);
                    $('gmReceiptCustomerMessage').textContent = 'Data pelanggan gagal dimuat. Periksa izin tabel customers.';
                    return;
                }
                customers = data || [];
                $('gmReceiptCustomerMessage').textContent = `${customers.length} pelanggan tersedia. Cari lalu pilih nama pelanggan.`;
            }

            function hideSuggestions() {
                suggestions.replaceChildren();
                suggestions.hidden = true;
            }

            function chooseCustomer(customer) {
                selectedCustomer = customer;
                customerInput.value = customer.full_name || '';
                $('gmReceiptPhone').value = customer.whatsapp || customer.phone || '';
                $('gmReceiptAddress').value = customer.address || '';
                hideSuggestions();
                renderPreview();
            }

            function showSuggestions() {
                const keyword = customerInput.value.trim().toLowerCase();
                suggestions.replaceChildren();
                if (!keyword) { suggestions.hidden = true; return; }
                const matches = customers.filter(c =>
                    [c.full_name, c.customer_code, c.phone, c.whatsapp].filter(Boolean).join(' ').toLowerCase().includes(keyword)
                ).slice(0, 10);
                if (!matches.length) {
                    const empty = document.createElement('div');
                    empty.className = 'customer-suggestion';
                    empty.textContent = 'Pelanggan tidak ditemukan. Tambahkan melalui menu Pelanggan.';
                    suggestions.appendChild(empty);
                    suggestions.hidden = false;
                    return;
                }
                matches.forEach(customer => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'customer-suggestion';
                    const name = document.createElement('strong');
                    name.textContent = customer.full_name || 'Tanpa nama';
                    const detail = document.createElement('small');
                    detail.textContent = [
                        customer.customer_code ? `Kode: ${customer.customer_code}` : '',
                        customer.whatsapp || customer.phone || '', customer.address || ''
                    ].filter(Boolean).join(' · ');
                    button.append(name, detail);
                    button.addEventListener('mousedown', e => e.preventDefault());
                    button.addEventListener('click', () => chooseCustomer(customer));
                    suggestions.appendChild(button);
                });
                suggestions.hidden = false;
            }

            function addItem(name = '', qty = 1, price = '') {
                const row = document.createElement('div');
                row.className = 'item';
                const nameInput = document.createElement('input');
                nameInput.className = 'iname'; nameInput.placeholder = 'Gorden custom / jasa ukur'; nameInput.value = name;
                const qtyInput = document.createElement('input');
                qtyInput.className = 'qty'; qtyInput.type = 'number'; qtyInput.min = '0'; qtyInput.step = '0.01'; qtyInput.value = qty;
                const priceInput = document.createElement('input');
                priceInput.className = 'price'; priceInput.type = 'number'; priceInput.min = '0'; priceInput.placeholder = 'Harga satuan'; priceInput.value = price;
                const remove = document.createElement('button');
                remove.type = 'button'; remove.className = 'btn light remove no-print'; remove.textContent = '×';
                [nameInput, qtyInput, priceInput].forEach(input => input.addEventListener('input', renderPreview));
                remove.addEventListener('click', () => {
                    row.remove();
                    if (!$('gmReceiptItems').children.length) addItem();
                    renderPreview();
                });
                row.append(nameInput, qtyInput, priceInput, remove);
                $('gmReceiptItems').appendChild(row);
                renderPreview();
            }

            function getData() {
                const lines = [...$('gmReceiptItems').querySelectorAll('.item')].map(row => ({
                    name: row.querySelector('.iname').value.trim(),
                    qty: Math.max(0, Number(row.querySelector('.qty').value) || 0),
                    price: Math.max(0, Number(row.querySelector('.price').value) || 0)
                })).filter(item => item.name || item.price);
                const subtotal = lines.reduce((sum, item) => sum + item.qty * item.price, 0);
                const discount = Math.min(subtotal, Math.max(0, Number($('gmReceiptDiscount').value) || 0));
                const total = subtotal - discount;
                const paid = Math.max(0, Number($('gmReceiptPaid').value) || 0);
                return {
                    number: $('gmReceiptNumber').value.trim(), date: $('gmReceiptDate').value,
                    customer: customerInput.value.trim(), customerId: selectedCustomer?.id || null,
                    phone: $('gmReceiptPhone').value.trim(), address: $('gmReceiptAddress').value.trim(),
                    lines, subtotal, discount, total, paid, balance: Math.max(0, total - paid),
                    method: $('gmReceiptMethod').value, notes: $('gmReceiptNotes').value.trim()
                };
            }

            function renderPreview() {
                const d = getData();
                const put = (id, value) => { $(id).textContent = value; };
                put('gmRNumber', d.number || '—');
                put('gmRDate', d.date ? new Date(`${d.date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');
                put('gmRCustomer', d.customer || '—'); put('gmRPhone', d.phone || '—'); put('gmRAddress', d.address || '—');
                put('gmRSubtotal', rupiah(d.subtotal)); put('gmRDiscount', rupiah(d.discount)); put('gmRTotal', rupiah(d.total));
                put('gmRPaid', rupiah(d.paid)); put('gmRBalance', rupiah(d.balance)); put('gmRMethod', d.method || '—');
                put('gmRNotes', d.notes || '—');
                put('gmReceiptStatus', d.total > 0 && d.balance === 0 ? 'LUNAS' : d.paid > 0 ? 'DP / BELUM LUNAS' : 'BELUM LUNAS');
                const body = $('gmRItems');
                body.replaceChildren();
                if (!d.lines.length) {
                    const tr = document.createElement('tr'), td = document.createElement('td');
                    td.colSpan = 4; td.textContent = 'Belum ada rincian produk'; tr.appendChild(td); body.appendChild(tr); return;
                }
                d.lines.forEach(item => {
                    const tr = document.createElement('tr');
                    [item.name || 'Produk', String(item.qty), rupiah(item.price), rupiah(item.qty * item.price)].forEach(value => {
                        const td = document.createElement('td'); td.textContent = value; tr.appendChild(td);
                    });
                    body.appendChild(tr);
                });
            }

            function resetReceipt(force = false) {
                if (!force && !confirm('Mulai struk baru? Data formulir saat ini akan dikosongkan.')) return;
                editingSaleId = null;
                editingOriginalPaid = 0;
                customerInput.value = '';
                $('gmReceiptPhone').value = '';
                $('gmReceiptAddress').value = '';
                $('gmReceiptDiscount').value = '0';
                $('gmReceiptPaid').value = '0';
                $('gmReceiptMethod').value = 'Transfer Bank';
                $('gmReceiptNotes').value = DEFAULT_NOTES;
                $('gmReceiptSaveOnline').textContent = 'Simpan Transaksi Online';
                $('gmReceiptCancelEdit').hidden = true;
                selectedCustomer = null;
                $('gmReceiptItems').replaceChildren();
                setDefaultNumber();
                addItem();
                hideSuggestions();
                renderPreview();
                $('receiptPageMessage').textContent = 'Formulir struk baru siap digunakan.';
            }

            function validateData(d) {
                if (!d.number || !d.date || !d.customer) throw new Error('Nomor struk, tanggal, dan customer wajib diisi.');
                if (!d.customerId) throw new Error('Pilih customer dari daftar pelanggan.');
                if (!d.lines.length || d.lines.some(i => !i.name || i.qty <= 0)) throw new Error('Pastikan nama produk dan jumlah sudah benar.');
                if (d.paid > d.total) throw new Error('Pembayaran tidak boleh melebihi total tagihan.');
            }

            async function saveOnline() {
                if (busy) return;
                const client = db(), d = getData();
                if (!client) return alert('Koneksi Supabase belum tersedia.');
                try { validateData(d); } catch (e) { return alert(e.message); }
                try {
                    const { data: authData, error: authError } = await client.auth.getUser();
                    if (authError) throw authError;
                    if (!authData.user) return alert('Sesi login tidak valid. Silakan login kembali.');
                } catch (error) {
                    console.error('Sesi Supabase tidak dapat diperiksa:', error);
                    return alert('Sesi login tidak dapat diperiksa. Silakan login kembali lalu coba lagi.');
                }
                const isEditing = Boolean(editingSaleId);
                if (isEditing && d.paid !== editingOriginalPaid) {
                    return alert('Nilai DP/pembayaran tidak diubah saat Edit agar catatan pembayaran tetap akurat. Gunakan menu pembayaran untuk mengubah pembayaran.');
                }
                if (!confirm(`${isEditing ? 'Simpan perubahan' : 'Simpan transaksi'} ${d.number}?\n\nCustomer: ${d.customer}\nTotal: ${rupiah(d.total)}\nDibayar: ${rupiah(d.paid)}`)) return;

                busy = true;
                $('gmReceiptSaveOnline').disabled = true;
                $('gmReceiptSaveOnline').textContent = isEditing ? 'Menyimpan perubahan...' : 'Menyimpan...';
                try {
                    if (isEditing) {
                        const saleId = editingSaleId;
                        const { error: saleUpdateError } = await client.from('sales').update({
                            sale_date: d.date, customer_id: d.customerId, subtotal: d.subtotal,
                            discount: d.discount, total: d.total, notes: d.notes || null
                        }).eq('id', saleId);
                        if (saleUpdateError) throw saleUpdateError;

                        const { error: deleteItemsError } = await client.from('sale_items').delete().eq('sale_id', saleId);
                        if (deleteItemsError) throw deleteItemsError;
                        const itemRows = d.lines.map(i => ({
                            sale_id: saleId, item_name: i.name, description: i.name,
                            quantity: i.qty, unit: 'pcs', unit_price: i.price
                        }));
                        const { error: insertItemsError } = await client.from('sale_items').insert(itemRows);
                        if (insertItemsError) throw insertItemsError;
                    } else {
                        const { data: existing, error: checkError } = await client.from('sales')
                            .select('id').eq('sale_number', d.number).maybeSingle();
                        if (checkError) throw checkError;
                        if (existing) throw new Error('Nomor struk sudah tersimpan. Buat nomor baru.');
                        const { data: result, error } = await client.rpc('save_gm_receipt', {
                            p_sale_number: d.number, p_sale_date: d.date, p_customer_id: d.customerId,
                            p_subtotal: d.subtotal, p_discount: d.discount, p_notes: d.notes || null,
                            p_items: d.lines.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
                            p_paid: d.paid, p_payment_method: d.method
                        });
                        if (error) {
                            if (error.code === 'PGRST202' || error.code === '42883' || /could not find the function|function .*save_gm_receipt.*does not exist/i.test(error.message || '')) {
                                throw new Error('Fungsi database save_gm_receipt belum tersedia. Jalankan file database/save_gm_receipt.sql melalui Supabase SQL Editor, lalu coba lagi.');
                            }
                            throw error;
                        }
                        if (!result) throw new Error('Supabase tidak mengembalikan ID transaksi. Periksa fungsi save_gm_receipt.');
                    }
                    alert(`${isEditing ? 'Perubahan transaksi berhasil disimpan.' : 'Transaksi berhasil disimpan.'}\nNomor: ${d.number}`);
                    resetReceipt(true);
                    await loadHistory();
                } catch (error) {
                    console.error('Gagal menyimpan transaksi:', error);
                    const detail = error.code === '42501'
                        ? 'Akses database ditolak. Periksa policy RLS untuk tabel sales, sale_items, dan payments.'
                        : (error.message || error);
                    alert('Transaksi gagal disimpan:\n' + detail);
                } finally {
                    busy = false;
                    syncReceiptSaveButton();
                }
            }

            function formatDate(value) {
                if (!value) return '-';
                return new Date(String(value).slice(0, 10) + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            }

            function statusLabel(status) {
                return ({ paid: 'Lunas', partial: 'Belum Lunas (DP)', unpaid: 'Belum Dibayar', refunded: 'Dikembalikan' })[status] || status || '-';
            }

            function renderHistory() {
                const keyword = $('gmReceiptHistorySearch').value.trim().toLowerCase();
                const filtered = historyData.filter(item =>
                    (item.sale_number || '').toLowerCase().includes(keyword) ||
                    (item.customers?.full_name || '').toLowerCase().includes(keyword)
                );
                const body = $('gmReceiptHistoryRows');
                body.replaceChildren();
                if (!filtered.length) {
                    const tr = document.createElement('tr'), td = document.createElement('td');
                    td.colSpan = 6;
                    td.textContent = historyData.length ? 'Transaksi tidak ditemukan.' : 'Belum ada transaksi online.';
                    tr.appendChild(td); body.appendChild(tr); return;
                }
                filtered.forEach(item => {
                    const tr = document.createElement('tr');
                    [formatDate(item.sale_date), item.sale_number || '-', item.customers?.full_name || '-', rupiah(item.total),
                        item.cancelled_at ? 'Dibatalkan' : statusLabel(item.payment_status)].forEach(value => {
                        const td = document.createElement('td'); td.textContent = value; tr.appendChild(td);
                    });
                    const actions = document.createElement('td');
                    actions.className = 'history-actions';

                    const makeButton = (label, className, handler) => {
                        const button = document.createElement('button');
                        button.type = 'button'; button.className = className; button.textContent = label;
                        button.addEventListener('click', handler); actions.appendChild(button);
                    };
                    makeButton('Lihat PDF', 'btn light', () => openTransactionPDF(item.id));
                    if (!item.cancelled_at) {
                        makeButton('Edit', 'btn light', () => editTransaction(item.id));
                        makeButton('Batalkan', 'btn light', () => deleteTransaction(item.id, item.sale_number));
                        if (item.payment_status !== 'paid') {
                            makeButton('Tandai Lunas', 'btn', () => settleSale(item.id, item.sale_number));
                        }
                    } else {
                        makeButton('Hapus Permanen', 'btn btn-delete', () => deleteCancelledTransaction(item.id, item.sale_number));
                    }
                    tr.appendChild(actions); body.appendChild(tr);
                });
            }

            async function loadHistory() {
                const client = db();
                if (!client) { $('gmReceiptHistoryMessage').textContent = 'Koneksi Supabase belum tersedia.'; return; }
                $('gmReceiptRefreshHistory').disabled = true;
                $('gmReceiptHistoryMessage').textContent = 'Memuat transaksi online...';
                try {
                    const { data, error } = await client.from('sales').select(`
                        id, sale_number, sale_date, customer_id, subtotal, discount, total, notes,
                        payment_status, cancelled_at, customers ( full_name )
                    `).order('sale_date', { ascending: false }).limit(500);
                    if (error) throw error;
                    historyData = data || [];
                    renderHistory();
                    $('gmReceiptHistoryMessage').textContent = `Menampilkan ${historyData.length} transaksi.`;
                } catch (error) {
                    console.error(error);
                    $('gmReceiptHistoryMessage').textContent = 'Riwayat gagal dimuat: ' + (error.message || error);
                } finally { $('gmReceiptRefreshHistory').disabled = false; }
            }

            async function editTransaction(saleId) {
                const client = db();
                if (!client) return alert('Koneksi Supabase belum tersedia.');
                try {
                    const { data: sale, error: saleError } = await client.from('sales')
                        .select('id,sale_number,sale_date,customer_id,subtotal,discount,total,notes,payment_status,cancelled_at')
                        .eq('id', saleId).single();
                    if (saleError) throw saleError;
                    if (sale.cancelled_at) throw new Error('Transaksi yang dibatalkan tidak bisa diedit.');
                    if (!sale.customer_id) throw new Error('Transaksi belum memiliki customer_id. Hubungkan customer melalui database terlebih dahulu.');

                    const { data: customer, error: customerError } = await client.from('customers')
                        .select('id,customer_code,full_name,phone,whatsapp,address').eq('id', sale.customer_id).single();
                    if (customerError) throw customerError;
                    const { data: items, error: itemsError } = await client.from('sale_items')
                        .select('item_name,description,quantity,unit,unit_price,line_total').eq('sale_id', saleId);
                    if (itemsError) throw itemsError;
                    const { data: payments, error: paymentsError } = await client.from('payments')
                        .select('amount,payment_method').eq('sale_id', saleId);
                    if (paymentsError) throw paymentsError;

                    selectedCustomer = customer;
                    numberRequestId += 1;
                    numberLoading = false;
                    editingSaleId = saleId;
                    editingOriginalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    $('gmReceiptNumber').value = sale.sale_number || '';
                    $('gmReceiptDate').value = String(sale.sale_date || '').slice(0, 10);
                    customerInput.value = customer.full_name || '';
                    $('gmReceiptPhone').value = customer.whatsapp || customer.phone || '';
                    $('gmReceiptAddress').value = customer.address || '';
                    $('gmReceiptDiscount').value = Number(sale.discount || 0);
                    $('gmReceiptPaid').value = editingOriginalPaid;
                    $('gmReceiptMethod').value = payments?.[0]?.payment_method || (editingOriginalPaid ? 'Transfer Bank' : 'Belum dibayar');
                    $('gmReceiptNotes').value = sale.notes || '';
                    $('gmReceiptItems').replaceChildren();
                    (items || []).forEach(item => addItem(item.item_name || item.description || '', Number(item.quantity || 1), Number(item.unit_price || 0)));
                    if (!items?.length) addItem();
                    $('gmReceiptSaveOnline').textContent = 'Simpan Perubahan';
                    syncReceiptSaveButton();
                    $('gmReceiptCancelEdit').hidden = false;
                    $('receiptFormSection').hidden = false;
                    $('gmReceiptHistorySection').hidden = true;
                    $('receiptPageMessage').textContent = `Mode edit transaksi ${sale.sale_number}. Pembayaran yang sudah tercatat tidak diubah.`;
                    hideSuggestions();
                    renderPreview();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch (error) {
                    console.error(error);
                    alert('Transaksi gagal dibuka untuk diedit:\n' + (error.message || error));
                }
            }

            async function deleteTransaction(saleId, saleNumber) {
                const client = db();
                if (!client) return alert('Koneksi Supabase belum tersedia.');
                if (!confirm(`Batalkan transaksi ${saleNumber}?\n\nTransaksi akan ditandai Dibatalkan, bukan dihapus permanen, agar jejak keuangan tetap ada.`)) return;
                try {
                    const { error } = await client.from('sales').update({ cancelled_at: new Date().toISOString() }).eq('id', saleId);
                    if (error) throw error;
                    alert(`Transaksi ${saleNumber} berhasil ditandai dibatalkan.`);
                    await loadHistory();
                } catch (error) {
                    console.error(error);
                    alert('Transaksi gagal dibatalkan:\n' + (error.message || error));
                }
            }

            async function deleteCancelledTransaction(saleId, saleNumber) {
                const client = db();
                if (!client) return alert('Koneksi Supabase belum tersedia.');
                if (!confirm(
                    `Hapus permanen transaksi ${saleNumber} beserta seluruh riwayat pembayarannya?\n\n` +
                    'Pembayaran terkait dan data produksi, jadwal, serta pengukuran yang juga berstatus dibatalkan akan ikut dihapus. Catatan pembayaran akan hilang dari laporan keuangan.'
                )) return;

                try {
                    const { error } = await client.rpc('delete_gm_cancelled_sale', {
                        p_sale_id: saleId
                    });
                    if (error) throw error;
                    alert(`Transaksi ${saleNumber} berhasil dihapus permanen.`);
                    await loadHistory();
                } catch (error) {
                    console.error('Gagal menghapus transaksi batal:', error);
                    alert('Transaksi tidak dapat dihapus:\n' + (error.message || error));
                }
            }

            async function settleSale(saleId, saleNumber) {
                const client = db();
                if (!client) return alert('Koneksi Supabase belum tersedia.');

                const methodChoice = prompt(
                    `Pilih metode pelunasan transaksi ${saleNumber}:\n` +
                    '1. Tunai\n2. Transfer bank\n3. QRIS\n4. Kartu debit\n5. Lainnya',
                    '2'
                );
                if (methodChoice === null) return;

                const paymentMethods = {
                    '1': 'cash',
                    '2': 'bank_transfer',
                    '3': 'qris',
                    '4': 'debit_card',
                    '5': 'other'
                };
                const paymentMethodLabels = {
                    cash: 'Tunai',
                    bank_transfer: 'Transfer bank',
                    qris: 'QRIS',
                    debit_card: 'Kartu debit',
                    other: 'Lainnya'
                };
                const paymentMethod = paymentMethods[methodChoice.trim()];
                if (!paymentMethod) return alert('Pilihan metode pembayaran tidak valid.');

                const note = prompt(
                    `Masukkan keterangan pelunasan untuk ${saleNumber}:`,
                    'Pelunasan sisa tagihan'
                );
                if (note === null) return;
                if (!note.trim()) return alert('Keterangan pelunasan harus diisi.');

                if (!confirm(
                    `Catat pelunasan transaksi ${saleNumber}?\n` +
                    `Metode: ${paymentMethodLabels[paymentMethod]}\nKeterangan: ${note.trim()}`
                )) return;

                try {
                    const { error } = await client.rpc('settle_gm_sale_with_note', {
                        p_sale_id: saleId,
                        p_payment_method: paymentMethod,
                        p_payment_date: todayISO(),
                        p_notes: note.trim()
                    });
                    if (error) throw error;
                    alert('Transaksi berhasil ditandai lunas.');
                    await loadHistory();
                } catch (error) {
                    console.error(error);
                    const message = error.code === 'PGRST202' || error.code === '42883'
                        ? 'Fungsi pelunasan dengan keterangan belum tersedia. Jalankan database/settle_gm_sale.sql di Supabase SQL Editor.'
                        : error.code === '42501'
                            ? 'Akun tidak memiliki izin untuk mencatat pelunasan.'
                            : 'Gagal menandai lunas.';
                    alert(message + '\n' + (error.message || error));
                }
            }

            async function openTransactionPDF(saleId) {
                const client = db();
                if (!client) return alert('Koneksi Supabase belum tersedia.');

                // Buka tab secara langsung saat tombol diklik agar tidak diblokir browser.
                const win = window.open('', '_blank');
                if (!win) return alert('Izinkan pop-up untuk membuka invoice.');

                win.document.open();
                win.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Memuat Invoice</title></head><body style="font-family:Arial;padding:24px">Memuat invoice...</body></html>`);
                win.document.close();

                try {
                    const { data: sale, error: saleError } = await client.from('sales')
                        .select('id,sale_number,sale_date,customer_id,subtotal,discount,total,notes,payment_status,cancelled_at')
                        .eq('id', saleId).single();
                    if (saleError) throw saleError;
                    if (!sale.customer_id) throw new Error('Transaksi ini belum terhubung dengan data customer.');

                    const { data: customer, error: customerError } = await client.from('customers')
                        .select('full_name,phone,whatsapp,address')
                        .eq('id', sale.customer_id).single();
                    if (customerError) throw customerError;

                    const { data: items, error: itemError } = await client.from('sale_items')
                        .select('item_name,description,quantity,unit,unit_price,line_total')
                        .eq('sale_id', saleId);
                    if (itemError) throw itemError;

                    const { data: payments, error: paymentError } = await client.from('payments')
                        .select('payment_date,amount,payment_method,payment_type,notes')
                        .eq('sale_id', saleId)
                        .order('payment_date', { ascending: true });
                    if (paymentError) throw paymentError;

                    const paid = (payments || []).reduce(
                        (sum, payment) => sum + Number(payment.amount || 0), 0
                    );
                    const subtotal = Number(sale.subtotal || 0);
                    const discount = Number(sale.discount || 0);
                    const total = Number(sale.total || 0);
                    const balance = Math.max(0, total - paid);

                    const status = sale.cancelled_at
                        ? 'DIBATALKAN'
                        : total > 0 && balance === 0
                            ? 'LUNAS'
                            : paid > 0
                                ? 'DP / BELUM LUNAS'
                                : 'BELUM LUNAS';

                    const paymentMethods = [...new Set(
                        (payments || []).map(payment => payment.payment_method).filter(Boolean)
                    )];
                    const method = paymentMethods.length
                        ? paymentMethods.join(' / ')
                        : 'Belum dibayar';
                    const paymentTypeLabels = {
                        dp: 'DP', installment: 'Cicilan', settlement: 'Pelunasan', refund: 'Pengembalian dana'
                    };
                    const paymentMethodLabels = {
                        cash: 'Tunai', bank_transfer: 'Transfer bank', transfer: 'Transfer bank',
                        qris: 'QRIS', debit_card: 'Kartu debit', credit_card: 'Kartu kredit', other: 'Lainnya'
                    };
                    const paymentRows = (payments || []).map(payment => {
                        const paymentType = paymentTypeLabels[payment.payment_type] || payment.payment_type || 'Pembayaran';
                        const paymentMethod = paymentMethodLabels[payment.payment_method] || payment.payment_method || '-';
                        return `
                            <tr>
                                <td>${escapeHTML(formatDate(payment.payment_date))}</td>
                                <td>${escapeHTML(paymentType)}<br><small>${escapeHTML(paymentMethod)}</small></td>
                                <td>${escapeHTML(payment.notes || '-')}</td>
                                <td class="right">${rupiah(payment.amount)}</td>
                            </tr>`;
                    }).join('');

                    const rows = (items || []).map(item => {
                        const quantity = Number(item.quantity || 0);
                        const unitPrice = Number(item.unit_price || 0);
                        const lineTotal = item.line_total == null
                            ? quantity * unitPrice
                            : Number(item.line_total);
                        return `
                            <tr>
                                <td>${escapeHTML(item.item_name || item.description || '-')}</td>
                                <td>${escapeHTML(quantity)} ${escapeHTML(item.unit || '')}</td>
                                <td>${rupiah(unitPrice)}</td>
                                <td>${rupiah(lineTotal)}</td>
                            </tr>`;
                    }).join('');

                    const logoURL = new URL('image/logo gm hitam.png', document.baseURI).href;
                    const invoiceDate = sale.sale_date
                        ? new Date(String(sale.sale_date).slice(0, 10) + 'T00:00:00')
                            .toLocaleDateString('id-ID', {
                                day: '2-digit', month: 'long', year: 'numeric'
                            })
                        : '-';

                    const html = `<!DOCTYPE html>
                    <html lang="id">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <title>Invoice ${escapeHTML(sale.sale_number || '')}</title>
                        <style>
                            @page { size: A5 portrait; margin: 8mm; }
                            * { box-sizing: border-box; }
                            html, body {
                                margin: 0; padding: 0; color: #222; background: #fff;
                                font-family: Arial, Helvetica, sans-serif;
                                -webkit-print-color-adjust: exact; print-color-adjust: exact;
                            }
                            .toolbar {
                                display: flex; justify-content: center; gap: 8px;
                                padding: 12px;
                            }
                            .toolbar button { padding: 9px 16px; cursor: pointer; }
                            #printReceipt {
                                width: 148mm; min-height: 210mm; margin: 0 auto 20px;
                                padding: 8mm; background: #fff;
                                box-shadow: 0 2px 8px #0002;
                            }
                            .receipt { width: 100%; color: #222; font: 9pt/1.4 Arial, sans-serif; }
                            .receipt-head {
                                text-align: center; border-bottom: 1.5px solid #14243a;
                                padding-bottom: 8px; margin-bottom: 8px;
                            }
                            .receipt-logo {
                                display: block; width: 130px; max-width: 60%; max-height: 65px;
                                object-fit: contain; margin: 0 auto 8px;
                            }
                            .receipt-contact { font-size: 8pt; line-height: 1.5; }
                            .receipt-head > p { margin: 6px 0 0; font-size: 8.5pt; font-weight: 600; }
                            .receipt-title {
                                display: flex; justify-content: space-between; align-items: center;
                                gap: 8px; margin: 8px 0 5px; font-size: 12pt;
                            }
                            .status {
                                display: inline-block; padding: 3px 6px; border-radius: 2px;
                                background: #e8f5ec; color: #176534; font-size: 7pt; font-weight: bold;
                            }
                            .status.cancelled { background: #fbe9e7; color: #a12622; }
                            .payment-history { margin-top: 10px; }
                            .payment-history h3 { margin: 0 0 4px; font-size: 8pt; color: #14243a; }
                            .payment-history table { margin: 4px 0 8px; font-size: 7pt; }
                            .payment-history th:nth-child(1), .payment-history td:nth-child(1) { width: 17%; }
                            .payment-history th:nth-child(2), .payment-history td:nth-child(2) { width: 25%; text-align: left; }
                            .payment-history th:nth-child(3), .payment-history td:nth-child(3) { width: 38%; white-space: pre-line; }
                            .payment-history th:nth-child(4), .payment-history td:nth-child(4) { width: 20%; text-align: right; }
                            .meta { margin-bottom: 8px; font-size: 8pt; line-height: 1.5; }
                            .customer {
                                display: block; padding: 7px; margin-bottom: 8px;
                                background: #f7f4ee; font-size: 8pt;
                            }
                            .customer > div {
                                display: grid; grid-template-columns: 60px minmax(0, 1fr);
                                gap: 5px; margin: 2px 0; overflow-wrap: anywhere;
                            }
                            table {
                                width: 100%; margin: 8px 0; border-collapse: collapse;
                                table-layout: fixed; font-size: 7.5pt;
                            }
                            th, td {
                                padding: 5px 4px; border-bottom: 1px solid #e5e5e5;
                                text-align: left; vertical-align: top; overflow-wrap: anywhere;
                            }
                            th { background: #f3f0ea; font-weight: bold; }
                            th:nth-child(1), td:nth-child(1) { width: 46%; }
                            th:nth-child(2), td:nth-child(2) { width: 12%; text-align: center; }
                            th:nth-child(3), td:nth-child(3) { width: 21%; text-align: right; }
                            th:nth-child(4), td:nth-child(4) { width: 21%; text-align: right; }
                            .totals { width: 65%; max-width: 100%; margin: 8px 0 10px auto; font-size: 8pt; }
                            .totalrow { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; }
                            .totalrow strong { text-align: right; overflow-wrap: anywhere; }
                            .totalrow.grand {
                                border-top: 1px solid #bbb; padding-top: 6px;
                                font-size: 10pt; font-weight: bold; color: #14243a;
                            }
                            .bank-info {
                                margin-top: 10px; padding: 7px 0;
                                border-top: 1px dotted #bbb; border-bottom: 1px dotted #bbb;
                                font-size: 7.5pt;
                            }
                            .bank-info p { margin: 2px 0; }
                            .notes { margin-top: 10px; font-size: 7.5pt; overflow-wrap: anywhere; }
                            .notes > span { display: block; margin-top: 6px; white-space: pre-line; }
                            .thank {
                                margin-top: 22px; text-align: center; font-size: 8pt;
                                font-style: italic; color: #776b5c;
                            }
                            @media print {
                                .toolbar { display: none !important; }
                                #printReceipt { width: 100%; min-height: 0; margin: 0; padding: 0; box-shadow: none; }
                                .receipt-head, .receipt-title, .meta, .customer, .totals,
                                .bank-info, .notes, .thank, tr { break-inside: avoid; page-break-inside: avoid; }
                            }
                            @media screen and (max-width: 600px) {
                                #printReceipt { width: calc(100% - 20px); min-height: 0; padding: 18px; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="toolbar">
                            <button type="button" onclick="window.print()">Cetak / Simpan PDF</button>
                            <button type="button" onclick="window.close()">Tutup</button>
                        </div>
                        <main id="printReceipt">
                            <article class="receipt">
                                <header class="receipt-head">
                                    <img src="${escapeHTML(logoURL)}" alt="Logo Gorden Malang" class="receipt-logo">
                                    <div class="receipt-contact">
                                        <strong>GORDEN MALANG OFFICIAL</strong><br>
                                        CV DEKORASI CREATIVE INTERIOR<br>
                                        Jl. S. Supriadi IX Gg. Pendidikan No. 21 RT. 13 RW. 04<br>
                                        WhatsApp: 0822 1133 2228<br>
                                        Instagram / TikTok: GORDENMALANGOFFICIAL
                                    </div>
                                    <p>Custom Curtains • Blinds • Vitrase • Curtain Laundry</p>
                                </header>

                                <div class="receipt-title">
                                    <strong>INVOICE</strong>
                                    <span class="status ${sale.cancelled_at ? 'cancelled' : ''}">${status}</span>
                                </div>
                                <div class="meta">
                                    No: <strong>${escapeHTML(sale.sale_number || '-')}</strong><br>
                                    Tanggal: ${escapeHTML(invoiceDate)}
                                </div>
                                <section class="customer">
                                    <div><b>Customer</b><span>${escapeHTML(customer.full_name || '-')}</span></div>
                                    <div><b>WhatsApp</b><span>${escapeHTML(customer.whatsapp || customer.phone || '-')}</span></div>
                                    <div><b>Alamat</b><span>${escapeHTML(customer.address || '-')}</span></div>
                                </section>

                                <table>
                                    <thead><tr><th>Produk / Keterangan</th><th>Qty</th><th>Harga</th><th>Jumlah</th></tr></thead>
                                    <tbody>${rows || '<tr><td colspan="4">Tidak ada rincian barang.</td></tr>'}</tbody>
                                </table>

                                <section class="totals">
                                    <div class="totalrow"><span>Subtotal</span><strong>${rupiah(subtotal)}</strong></div>
                                    <div class="totalrow"><span>Diskon</span><strong>${rupiah(discount)}</strong></div>
                                    <div class="totalrow grand"><span>Total</span><strong>${rupiah(total)}</strong></div>
                                    <div class="totalrow"><span>Sudah dibayar / DP</span><strong>${rupiah(paid)}</strong></div>
                                    <div class="totalrow grand"><span>Sisa pembayaran</span><strong>${rupiah(balance)}</strong></div>
                                    <div class="totalrow"><span>Metode</span><strong>${escapeHTML(method)}</strong></div>
                                </section>
                                ${paymentRows ? `
                                    <section class="payment-history">
                                        <h3>Riwayat Pembayaran</h3>
                                        <table>
                                            <thead><tr><th>Tanggal</th><th>Jenis / metode</th><th>Keterangan</th><th>Nominal</th></tr></thead>
                                            <tbody>${paymentRows}</tbody>
                                        </table>
                                    </section>` : ''}

                                <section class="bank-info">
                                    <p><strong>Rek. BCA</strong> : 4480725838 / a.n. Indra Permana</p>
                                    <p><strong>Rek. Bank Mandiri</strong> : 1440024376342 / a.n. Indra Permana</p>
                                </section>
                                <section class="notes">
                                    <b>Catatan / Ketentuan:</b>
                                    <span>${escapeHTML(sale.notes || '-')}</span>
                                </section>
                                <div class="thank">Terima kasih atas kepercayaan Anda.</div>
                            </article>
                        </main>
                    </body>
                    </html>`;

                    win.document.open();
                    win.document.write(html);
                    win.document.close();
                } catch (error) {
                    console.error('Gagal membuka invoice:', error);
                    if (win && !win.closed) {
                        win.document.body.textContent = 'Invoice gagal dimuat: ' + (error.message || error);
                    }
                }
            }

            function sendWhatsApp() {
                const d = getData();
                if (!d.phone) return alert('Customer belum memiliki nomor WhatsApp.');
                if (!d.customer) return alert('Pilih customer terlebih dahulu.');
                const lines = d.lines.map((item, i) => `${i + 1}. ${item.name} — ${item.qty} x ${rupiah(item.price)} = ${rupiah(item.qty * item.price)}`).join('\n');
                const message = `*GORDEN MALANG OFFICIAL*\nCV Dekorasi Creative Interior\n\n*STRUK / INVOICE*\nNo: ${d.number}\nTanggal: ${d.date}\nCustomer: ${d.customer}\nAlamat: ${d.address || '-'}\n\n*Rincian:*\n${lines || '-'}\n\nSubtotal: ${rupiah(d.subtotal)}\nDiskon: ${rupiah(d.discount)}\n*TOTAL: ${rupiah(d.total)}*\nDibayar: ${rupiah(d.paid)}\n*Sisa: ${rupiah(d.balance)}*\nMetode: ${d.method}\n\nCatatan:\n${d.notes || '-'}\n\nTerima kasih telah mempercayakan kebutuhan interior Anda kepada Gorden Malang Official.`;
                let phone = d.phone.replace(/\D/g, '');
                if (phone.startsWith('0')) phone = '62' + phone.slice(1);
                else if (!phone.startsWith('62')) phone = '62' + phone;
                window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank');
            }

            function showHistory() {
                $('gmReceiptHistorySection').hidden = false;
                $('receiptFormSection').hidden = true;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                loadHistory();
            }
            function showForm() {
                $('gmReceiptHistorySection').hidden = true;
                $('receiptFormSection').hidden = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            customerInput.addEventListener('input', () => { selectedCustomer = null; showSuggestions(); renderPreview(); });
            customerInput.addEventListener('focus', showSuggestions);
            root.addEventListener('click', event => { if (!event.target.closest('.customer-autocomplete')) hideSuggestions(); });
            ['gmReceiptDate','gmReceiptPhone','gmReceiptAddress','gmReceiptDiscount','gmReceiptPaid','gmReceiptMethod','gmReceiptNotes']
                .forEach(id => { $(id).addEventListener('input', renderPreview); $(id).addEventListener('change', renderPreview); });

            $('gmReceiptAdd').addEventListener('click', () => addItem());
            $('gmReceiptSaveOnline').addEventListener('click', saveOnline);
            $('gmReceiptWhatsApp').addEventListener('click', sendWhatsApp);
            $('gmReceiptRefreshHistory').addEventListener('click', loadHistory);
            $('gmReceiptHistorySearch').addEventListener('input', renderHistory);
            $('receiptShowHistory').addEventListener('click', showHistory);
            $('receiptShowForm').addEventListener('click', () => {
                showForm();
                if (editingSaleId) {
                    if (confirm('Kamu sedang mengedit transaksi. Batalkan edit dan buat struk baru?')) resetReceipt(true);
                } else resetReceipt();
            });
            $('gmReceiptCancelEdit').addEventListener('click', () => {
                if (confirm('Batalkan mode edit? Perubahan yang belum disimpan akan hilang.')) resetReceipt(true);
            });

            $('gmReceiptPrint').addEventListener('click', () => {
                renderPreview();
                const preview = $('gmReceiptPreview');
                if (!preview) return alert('Preview struk tidak ditemukan.');
                const printWindow = window.open('', '_blank');
                if (!printWindow) return alert('Jendela cetak diblokir. Izinkan pop-up untuk situs ini.');
                const receipt = preview.cloneNode(true);
                receipt.removeAttribute('id');
                receipt.querySelectorAll('.no-print').forEach(el => el.remove());
                receipt.querySelectorAll('img').forEach(img => {
                    const src = img.getAttribute('src');
                    if (src) img.src = new URL(src, document.baseURI).href;
                });
                const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cetak Struk Gorden Malang</title>
                <style>
                @page{size:A5 portrait;margin:8mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#222;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
                .print-toolbar{display:flex;justify-content:center;gap:8px;padding:12px}.print-toolbar button{padding:9px 16px;cursor:pointer}
                #printReceipt{width:100%;max-width:100%;margin:0 auto;padding:0;background:#fff}
                #printReceipt .receipt{width:100%;max-width:none;margin:0;padding:0;border:0;border-radius:0;box-shadow:none;background:#fff;color:#222;font:9pt/1.4 Arial,sans-serif}
                #printReceipt .receipt-head{text-align:center;border-bottom:1.5px solid #14243a;padding:0 0 8px;margin-bottom:8px}
                #printReceipt .receipt-logo{display:block;width:130px;max-width:60%;max-height:65px;object-fit:contain;margin:0 auto 8px}
                #printReceipt .receipt-contact{font-size:8pt;line-height:1.5}#printReceipt .receipt-head>p{margin:6px 0 0;font-size:8.5pt;font-weight:600}
                #printReceipt .receipt-title{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:8px 0 5px;font-size:12pt}
                #printReceipt .status{display:inline-block;padding:3px 6px;background:#e8f5ec;color:#176534;font-size:7pt;font-weight:bold}
                #printReceipt .meta{margin-bottom:8px;font-size:8pt;line-height:1.5}#printReceipt .customer{display:block;padding:7px;margin-bottom:8px;background:#f7f4ee;font-size:8pt}
                #printReceipt .customer>div{display:grid;grid-template-columns:60px 1fr;gap:5px;margin:2px 0;overflow-wrap:anywhere}
                #printReceipt table{width:100%;border-collapse:collapse;margin:8px 0;table-layout:fixed;font-size:7.5pt}
                #printReceipt th,#printReceipt td{padding:5px 4px;border-bottom:1px solid #e5e5e5;text-align:left;vertical-align:top;overflow-wrap:anywhere}
                #printReceipt th{background:#f3f0ea;font-weight:bold}#printReceipt th:nth-child(1),#printReceipt td:nth-child(1){width:46%}
                #printReceipt th:nth-child(2),#printReceipt td:nth-child(2){width:12%;text-align:center}
                #printReceipt th:nth-child(3),#printReceipt td:nth-child(3){width:21%;text-align:right}
                #printReceipt th:nth-child(4),#printReceipt td:nth-child(4){width:21%;text-align:right}
                #printReceipt .totals{width:65%;max-width:100%;margin:8px 0 10px auto;font-size:8pt}
                #printReceipt .totalrow{display:flex;justify-content:space-between;gap:10px;padding:4px 0}
                #printReceipt .totalrow strong{text-align:right;overflow-wrap:anywhere}
                #printReceipt .totalrow.grand{border-top:1px solid #bbb;padding-top:6px;font-size:10pt;font-weight:bold;color:#14243a}
                #printReceipt .bank-info{margin-top:10px;padding:7px 0;border-top:1px dotted #bbb;border-bottom:1px dotted #bbb;font-size:7.5pt}
                #printReceipt .bank-info p{margin:2px 0}#printReceipt .notes{margin-top:10px;font-size:7.5pt;overflow-wrap:anywhere}
                #printReceipt .notes>span{display:block;margin-top:6px;white-space:pre-line}#printReceipt .thank{margin-top:22px;text-align:center;font-size:8pt;font-style:italic;color:#776b5c}
                @media screen{body{background:#e9e9e9}#printReceipt{width:148mm;min-height:194mm;margin:0 auto 20px;padding:8mm;background:#fff;box-shadow:0 2px 8px #0002}}
                @media print{.print-toolbar{display:none!important}#printReceipt{width:100%;margin:0;padding:0;box-shadow:none}
                #printReceipt .receipt-head,#printReceipt .receipt-title,#printReceipt .meta,#printReceipt .customer,#printReceipt .totals,#printReceipt .bank-info,#printReceipt .notes,#printReceipt .thank,#printReceipt tr{break-inside:avoid;page-break-inside:avoid}}
                </style></head><body><div class="print-toolbar"><button type="button" onclick="window.print()">Cetak / Simpan PDF</button><button type="button" onclick="window.close()">Tutup</button></div><main id="printReceipt">${receipt.outerHTML}</main></body></html>`;
                printWindow.document.open(); printWindow.document.write(html); printWindow.document.close();
            });

            setDefaultNumber();
            addItem();
            renderPreview();
            await loadCustomers();

            // Penanda sukses dipasang setelah semua listener terdaftar.
            root.dataset.initialized = 'true';
            } catch (error) {
                console.error('Inisialisasi modul Struk gagal:', error);
                throw error;
            } finally {
                delete root.dataset.initializing;
            }
        }
    };

    window.GMReceipts = Receipts;
})();
