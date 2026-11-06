(() => {
    'use strict';

    const ACCESS = window.GMAccess;
    const ROLE_META = ACCESS?.roles || {};

    const state = {
        profiles: [],
        roles: [],
        currentUserId: null,
        filter: 'all',
        query: '',
        loading: false,
        saving: false
    };

    const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    const roleLabel = role => ROLE_META[role]?.label || role;

    function profileRoles(profileId) {
        return state.roles
            .filter(item => item.user_id === profileId)
            .map(item => item.role);
    }

    function statusFor(profile) {
        const roles = profileRoles(profile.id);
        if (profile.is_active && roles.length) return 'active';
        if (!profile.is_active && roles.length) return 'inactive';
        return 'pending';
    }

    function statusLabel(status) {
        return ({ active: 'Aktif', pending: 'Menunggu persetujuan', inactive: 'Nonaktif' })[status];
    }

    function icon(name) {
        return `<i class="fa-solid ${name}" aria-hidden="true"></i>`;
    }

    function render() {
        return `
            <section class="gm-admin" id="gmAdminModule">
                <header class="gm-admin-hero">
                    <div class="gm-admin-hero-copy">
                        <span class="gm-admin-eyebrow">PUSAT AKSES TIM</span>
                        <h2>Kelola tim dengan lebih tenang.</h2>
                        <p>Setujui akun, atur tanggung jawab, dan pastikan setiap orang hanya mendapat akses yang diperlukan.</p>
                    </div>
                    <div class="gm-admin-hero-tools">
                        <span class="gm-admin-owner-chip">${icon('fa-shield-halved')} OWNER CONTROL</span>
                        <button type="button" class="gm-admin-refresh" data-admin-refresh aria-label="Muat ulang data admin">
                            ${icon('fa-arrows-rotate')} <span>Muat ulang</span>
                        </button>
                    </div>
                    <div class="gm-admin-hero-mark" aria-hidden="true"><span>${icon('fa-user-shield')}</span></div>
                </header>

                <div class="gm-admin-message" id="gmAdminMessage" role="status" aria-live="polite"></div>

                <div class="gm-admin-stats" aria-label="Ringkasan akun">
                    <article class="gm-admin-stat">
                        <span class="gm-admin-stat-icon is-navy">${icon('fa-users')}</span>
                        <div><span>Total akun</span><strong id="gmAdminTotal">—</strong><small>Terdaftar di sistem</small></div>
                    </article>
                    <article class="gm-admin-stat">
                        <span class="gm-admin-stat-icon is-green">${icon('fa-user-check')}</span>
                        <div><span>Akun aktif</span><strong id="gmAdminActive">—</strong><small>Bisa masuk ke aplikasi</small></div>
                    </article>
                    <article class="gm-admin-stat is-attention">
                        <span class="gm-admin-stat-icon is-gold">${icon('fa-user-clock')}</span>
                        <div><span>Perlu ditinjau</span><strong id="gmAdminPendingCount">—</strong><small>Menunggu akses dari owner</small></div>
                    </article>
                    <article class="gm-admin-stat">
                        <span class="gm-admin-stat-icon is-muted">${icon('fa-user-slash')}</span>
                        <div><span>Nonaktif</span><strong id="gmAdminInactive">—</strong><small>Akses masuk sedang dihentikan</small></div>
                    </article>
                </div>

                <div class="gm-admin-layout">
                    <section class="gm-admin-panel gm-admin-directory">
                        <div class="gm-admin-panel-heading">
                            <div><span class="gm-admin-kicker">PENGGUNA</span><h3>Daftar akses</h3><p>Atur status dan tanggung jawab setiap akun.</p></div>
                            <span class="gm-admin-directory-count" id="gmAdminCount">Memuat…</span>
                        </div>
                        <div class="gm-admin-toolbar">
                            <div class="gm-admin-tabs" role="tablist" aria-label="Filter status akun">
                                <button type="button" class="is-selected" data-admin-filter="all">Semua <span id="gmTabAll">0</span></button>
                                <button type="button" data-admin-filter="pending">Menunggu <span id="gmTabPending">0</span></button>
                                <button type="button" data-admin-filter="active">Aktif <span id="gmTabActive">0</span></button>
                                <button type="button" data-admin-filter="inactive">Nonaktif <span id="gmTabInactive">0</span></button>
                            </div>
                            <label class="gm-admin-search">
                                ${icon('fa-magnifying-glass')}
                                <input id="gmAdminSearch" type="search" placeholder="Cari nama atau ID akun…" autocomplete="off">
                            </label>
                        </div>
                        <div class="gm-admin-table-wrap">
                            <table class="gm-admin-table">
                                <thead><tr><th>ANGGOTA TIM</th><th>ROLE</th><th>STATUS</th><th><span class="gm-admin-visually-hidden">Aksi</span></th></tr></thead>
                                <tbody id="gmAdminList"><tr><td colspan="4" class="gm-admin-loading">${icon('fa-circle-notch')} Memuat data akun…</td></tr></tbody>
                            </table>
                        </div>
                        <p class="gm-admin-footnote">Email akun dikelola oleh Supabase Auth. ID akun ditampilkan sebagai penanda agar data login tetap aman.</p>
                    </section>

                    <aside class="gm-admin-side">
                        <section class="gm-admin-panel gm-admin-pending-panel">
                            <div class="gm-admin-panel-heading gm-admin-panel-heading-compact">
                                <div><span class="gm-admin-kicker">TINDAKAN OWNER</span><h3>Perlu ditinjau</h3></div>
                                <span class="gm-admin-pending-badge" id="gmPendingBadge">0</span>
                            </div>
                            <p class="gm-admin-side-intro">Akun baru perlu role dan persetujuan sebelum bisa digunakan.</p>
                            <div class="gm-admin-pending-list" id="gmAdminPendingList">
                                <div class="gm-admin-loading gm-admin-loading-card">${icon('fa-circle-notch')} Memuat antrean…</div>
                            </div>
                        </section>

                        <section class="gm-admin-panel gm-admin-roles-panel">
                            <div class="gm-admin-panel-heading gm-admin-panel-heading-compact">
                                <div><span class="gm-admin-kicker">PEMBAGIAN TUGAS</span><h3>Role dalam tim</h3></div>
                                ${icon('fa-shield-halved')}
                            </div>
                            <div class="gm-admin-role-guide">
                                ${Object.entries(ROLE_META).map(([key, role]) => `
                                    <div class="gm-admin-role-guide-item">
                                        <span class="gm-admin-role-icon role-${key}">${icon(role.icon)}</span>
                                        <div><strong>${html(role.label)}</strong><small>${html(role.description)}</small></div>
                                    </div>`).join('')}
                            </div>
                        </section>

                        <div class="gm-admin-security-note">
                            <span>${icon('fa-lock')}</span>
                            <p><strong>Akses tetap terlindungi</strong>Perubahan akun mengikuti izin tabel Supabase. Nonaktifkan akun untuk menghentikan akses tanpa menghapus riwayat kerjanya.</p>
                        </div>
                    </aside>
                </div>

                <dialog class="gm-admin-dialog" id="gmAdminDialog" aria-labelledby="gmAdminDialogTitle">
                    <form id="gmAdminEditForm" method="dialog">
                        <div class="gm-admin-dialog-head">
                            <span class="gm-admin-dialog-icon">${icon('fa-user-gear')}</span>
                            <button type="button" class="gm-admin-dialog-close" data-admin-close aria-label="Tutup">${icon('fa-xmark')}</button>
                            <span class="gm-admin-kicker">PENGATURAN AKUN</span>
                            <h3 id="gmAdminDialogTitle">Atur akses anggota</h3>
                            <p id="gmAdminDialogIdentity"></p>
                        </div>
                        <input type="hidden" name="user_id">
                        <fieldset class="gm-admin-role-picker">
                            <legend>Pilih pembagian tugas <span>Pilih satu atau beberapa role. Dashboard tersedia otomatis setelah akun aktif.</span></legend>
                            ${Object.entries(ROLE_META).map(([key, role]) => `
                                <label class="gm-admin-role-option">
                                    <input type="checkbox" name="roles" value="${key}">
                                    <span class="gm-admin-role-option-icon role-${key}">${icon(role.icon)}</span>
                                    <span><strong>${html(role.label)}</strong><small>${html(role.description)}</small></span>
                                    <span class="gm-admin-check">${icon('fa-check')}</span>
                                </label>`).join('')}
                        </fieldset>
                        <div class="gm-admin-access-preview">
                            <span>MODUL YANG AKAN TERBUKA</span>
                            <div id="gmAdminModulePreview"><small>Pilih role untuk melihat modul tugas.</small></div>
                        </div>
                        <label class="gm-admin-active-toggle">
                            <input type="checkbox" name="is_active">
                            <span class="gm-admin-toggle-track"></span>
                            <span><strong>Izinkan akun masuk</strong><small>Matikan untuk menghentikan akses tanpa menghapus data.</small></span>
                        </label>
                        <p class="gm-admin-dialog-message" id="gmAdminDialogMessage" role="status" aria-live="polite"></p>
                        <div class="gm-admin-dialog-actions">
                            <button type="button" class="gm-admin-button is-secondary" data-admin-close>Batal</button>
                            <button type="submit" class="gm-admin-button is-primary" id="gmAdminSave">Simpan perubahan</button>
                        </div>
                    </form>
                </dialog>
            </section>`;
    }

    function showMessage(text, type = 'info') {
        const node = document.getElementById('gmAdminMessage');
        if (!node) return;
        node.className = `gm-admin-message is-${type}`;
        node.textContent = text;
    }

    function setLoading(loading) {
        state.loading = loading;
        const refresh = document.querySelector('[data-admin-refresh]');
        if (refresh) {
            refresh.disabled = loading || state.saving;
            refresh.classList.toggle('is-loading', loading);
        }
    }

    function filteredProfiles() {
        const needle = state.query.trim().toLowerCase();
        return state.profiles.filter(profile => {
            const status = statusFor(profile);
            const matchesFilter = state.filter === 'all' || state.filter === status;
            const matchesQuery = !needle ||
                String(profile.full_name || '').toLowerCase().includes(needle) ||
                String(profile.id || '').toLowerCase().includes(needle);
            return matchesFilter && matchesQuery;
        });
    }

    function avatarTone(profile) {
        const palette = ['sand', 'blue', 'sage', 'rose', 'lavender'];
        const seed = String(profile.id || profile.full_name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return palette[seed % palette.length];
    }

    function userRow(profile) {
        const roles = profileRoles(profile.id);
        const status = statusFor(profile);
        const initials = String(profile.full_name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
        const roleContent = roles.length
            ? roles.map(role => `<span class="gm-admin-role-chip role-${html(role)}">${html(roleLabel(role))}</span>`).join('')
            : '<span class="gm-admin-no-role">Role belum ditentukan</span>';
        return `<tr>
            <td><div class="gm-admin-person"><span class="gm-admin-avatar tone-${avatarTone(profile)}">${html(initials || 'GM')}</span><span class="gm-admin-person-meta"><strong>${html(profile.full_name || 'Nama belum diisi')}</strong><small>ID · ${html(String(profile.id).slice(0, 8))}…</small></span></div></td>
            <td><div class="gm-admin-role-list">${roleContent}</div></td>
            <td><span class="gm-admin-status is-${status}"><i></i>${statusLabel(status)}</span></td>
            <td class="gm-admin-action-cell"><button type="button" class="gm-admin-row-action" data-review-user="${html(profile.id)}">Atur akses ${icon('fa-arrow-up-right-from-square')}</button></td>
        </tr>`;
    }

    function renderList() {
        const body = document.getElementById('gmAdminList');
        const count = document.getElementById('gmAdminCount');
        if (!body) return;
        const filtered = filteredProfiles();
        if (count) count.textContent = `${filtered.length} dari ${state.profiles.length} akun`;
        body.innerHTML = filtered.length
            ? filtered.map(userRow).join('')
            : `<tr><td colspan="4"><div class="gm-admin-empty"><span>${icon(state.profiles.length ? 'fa-filter-circle-xmark' : 'fa-users')}</span><strong>${state.profiles.length ? 'Akun tidak ditemukan' : 'Belum ada akun terdaftar'}</strong><small>${state.profiles.length ? 'Coba kata kunci atau filter status yang lain.' : 'Akun baru akan muncul di sini setelah pengguna mendaftar.'}</small></div></td></tr>`;
    }

    function renderPending() {
        const list = document.getElementById('gmAdminPendingList');
        if (!list) return;
        const pending = state.profiles.filter(profile => statusFor(profile) === 'pending');
        const badge = document.getElementById('gmPendingBadge');
        if (badge) badge.textContent = pending.length;
        if (!pending.length) {
            list.innerHTML = `<div class="gm-admin-queue-empty"><span>${icon('fa-circle-check')}</span><strong>Semua sudah tertangani</strong><small>Belum ada akun yang menunggu persetujuan.</small></div>`;
            return;
        }
        list.innerHTML = pending.slice(0, 5).map(profile => {
            const initials = String(profile.full_name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
            return `<article class="gm-admin-pending-item">
                <span class="gm-admin-avatar tone-${avatarTone(profile)}">${html(initials || 'GM')}</span>
                <div class="gm-admin-pending-person"><strong>${html(profile.full_name || 'Nama belum diisi')}</strong><small>ID · ${html(String(profile.id).slice(0, 8))}…</small></div>
                <button type="button" data-review-user="${html(profile.id)}" aria-label="Tinjau akun ${html(profile.full_name || '')}">${icon('fa-arrow-right')}</button>
            </article>`;
        }).join('') + (pending.length > 5 ? `<button type="button" class="gm-admin-more-pending" data-admin-filter="pending">Lihat ${pending.length - 5} akun lainnya ${icon('fa-arrow-right')}</button>` : '');
    }

    function renderStats() {
        const totals = { active: 0, pending: 0, inactive: 0 };
        state.profiles.forEach(profile => totals[statusFor(profile)]++);
        const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
        set('gmAdminTotal', state.profiles.length);
        set('gmAdminActive', totals.active);
        set('gmAdminPendingCount', totals.pending);
        set('gmAdminInactive', totals.inactive);
        set('gmTabAll', state.profiles.length);
        set('gmTabActive', totals.active);
        set('gmTabPending', totals.pending);
        set('gmTabInactive', totals.inactive);
    }

    async function loadData() {
        const client = window.gmSupabase;
        if (!client) throw new Error('Koneksi Supabase belum tersedia. Silakan masuk kembali.');
        setLoading(true);
        try {
            const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
                client.from('profiles').select('id,full_name,is_active').order('full_name', { ascending: true }),
                client.from('user_roles').select('user_id,role')
            ]);
            if (profileError) throw profileError;
            if (roleError) throw roleError;
            state.profiles = profiles || [];
            state.roles = roles || [];
            renderStats();
            renderList();
            renderPending();
            showMessage('Data akun berhasil diperbarui.', 'success');
        } catch (error) {
            console.error('Gagal memuat Manajemen Admin:', error);
            showMessage(`Data akun belum bisa dimuat. Pastikan tabel profiles dan user_roles dapat dibaca oleh role owner. ${error.message || ''}`, 'error');
            const body = document.getElementById('gmAdminList');
            const pending = document.getElementById('gmAdminPendingList');
            if (body) body.innerHTML = '<tr><td colspan="4" class="gm-admin-load-error">Akun belum dapat dimuat. Periksa koneksi dan policy Supabase.</td></tr>';
            if (pending) pending.innerHTML = `<div class="gm-admin-queue-empty is-error"><span>${icon('fa-triangle-exclamation')}</span><strong>Data belum tersedia</strong><small>Periksa koneksi atau izin tabel di Supabase.</small></div>`;
        } finally {
            setLoading(false);
        }
    }

    function openEditor(profileId) {
        const profile = state.profiles.find(item => item.id === profileId);
        const dialog = document.getElementById('gmAdminDialog');
        if (!profile || !dialog) return;
        const form = document.getElementById('gmAdminEditForm');
        const roles = profileRoles(profileId);
        form.elements.user_id.value = profile.id;
        form.elements.is_active.checked = profile.is_active === true;
        form.querySelectorAll('input[name="roles"]').forEach(input => { input.checked = roles.includes(input.value); });
        updateModulePreview();
        document.getElementById('gmAdminDialogIdentity').textContent = `${profile.full_name || 'Nama belum diisi'} · ID ${String(profile.id).slice(0, 8)}…`;
        document.getElementById('gmAdminDialogMessage').textContent = '';
        document.getElementById('gmAdminSave').disabled = false;
        dialog.showModal();
    }

    function updateModulePreview() {
        const preview = document.getElementById('gmAdminModulePreview');
        const form = document.getElementById('gmAdminEditForm');
        if (!preview || !form) return;
        const selectedRoles = [...form.querySelectorAll('input[name="roles"]:checked')].map(input => input.value);
        const moduleKeys = ACCESS?.modulesForRoles(selectedRoles) || ['dashboard'];
        const taskModules = moduleKeys;
        preview.innerHTML = taskModules.length
            ? taskModules.map(moduleKey => `<span>${html(ACCESS.modules[moduleKey])}</span>`).join('')
            : '<small>Pilih role untuk melihat modul tugas.</small>';
    }

    function closeEditor() {
        document.getElementById('gmAdminDialog')?.close();
    }

    async function saveAccess(event) {
        event.preventDefault();
        if (state.saving) return;
        const form = event.currentTarget;
        const profileId = form.elements.user_id.value;
        const profile = state.profiles.find(item => item.id === profileId);
        const dialogMessage = document.getElementById('gmAdminDialogMessage');
        if (!profile) return;

        const selectedRoles = [...form.querySelectorAll('input[name="roles"]:checked')].map(input => input.value);
        const isActive = form.elements.is_active.checked;
        const previousRoles = profileRoles(profileId);
        const rolesChanged = [...selectedRoles].sort().join('|') !== [...previousRoles].sort().join('|');
        if (profileId === state.currentUserId && rolesChanged) {
            dialogMessage.textContent = 'Role akun yang sedang digunakan tidak dapat diubah dari sesi ini.';
            return;
        }
        if (isActive && !selectedRoles.length) {
            dialogMessage.textContent = 'Pilih minimal satu role sebelum mengaktifkan akun.';
            return;
        }
        if (profileId === state.currentUserId && !isActive) {
            dialogMessage.textContent = 'Akun yang sedang digunakan tidak dapat dinonaktifkan dari sesi ini.';
            return;
        }
        const activeOwners = state.profiles.filter(item => item.is_active && profileRoles(item.id).includes('owner'));
        const removesOwnerAccess = previousRoles.includes('owner') && (!selectedRoles.includes('owner') || !isActive);
        if (removesOwnerAccess && activeOwners.length <= 1) {
            dialogMessage.textContent = 'Akun ini adalah Owner aktif terakhir. Tetapkan Owner lain terlebih dahulu.';
            return;
        }

        state.saving = true;
        const saveButton = document.getElementById('gmAdminSave');
        saveButton.disabled = true;
        saveButton.innerHTML = `${icon('fa-circle-notch')} Menyimpan…`;
        dialogMessage.textContent = '';
        try {
            const client = window.gmSupabase;
            if (rolesChanged) {
                const { error: deleteError } = await client.from('user_roles').delete().eq('user_id', profileId);
                if (deleteError) throw deleteError;
                if (selectedRoles.length) {
                    const { error: insertError } = await client.from('user_roles').insert(
                        selectedRoles.map(role => ({ user_id: profileId, role }))
                    );
                    if (insertError) {
                        await client.from('user_roles').delete().eq('user_id', profileId);
                        if (previousRoles.length) {
                            await client.from('user_roles').insert(previousRoles.map(role => ({ user_id: profileId, role })));
                        }
                        throw insertError;
                    }
                }
            }

            const { data: updatedProfile, error: profileError } = await client
                .from('profiles')
                .update({ is_active: isActive })
                .eq('id', profileId)
                .select('id')
                .maybeSingle();
            if (profileError || !updatedProfile) {
                if (rolesChanged) {
                    await client.from('user_roles').delete().eq('user_id', profileId);
                    if (previousRoles.length) await client.from('user_roles').insert(previousRoles.map(role => ({ user_id: profileId, role })));
                }
                throw profileError || new Error('Perubahan profil ditolak oleh policy Supabase.');
            }

            closeEditor();
            await loadData();
            showMessage(`Akses ${profile.full_name || 'anggota'} berhasil diperbarui.`, 'success');
        } catch (error) {
            console.error('Gagal menyimpan akses admin:', error);
            dialogMessage.textContent = `Perubahan tidak tersimpan. Periksa policy UPDATE profiles serta INSERT/DELETE user_roles di Supabase. ${error.message || ''}`;
        } finally {
            state.saving = false;
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Simpan perubahan';
            }
            setLoading(state.loading);
        }
    }

    async function init() {
        const client = window.gmSupabase;
        const container = document.getElementById('gmAdminModule');
        if (!container) return;
        if (!client) {
            showMessage('Koneksi Supabase belum tersedia. Silakan masuk kembali.', 'error');
            return;
        }

        const currentRoles = window.gmRoles || [];
        if (!currentRoles.includes('owner')) {
            container.innerHTML = `<section class="gm-admin-restricted"><span>${icon('fa-lock')}</span><span class="gm-admin-kicker">AREA OWNER</span><h2>Pengaturan tim bersifat terbatas.</h2><p>Hubungi Owner untuk meminta akses atau perubahan role.</p></section>`;
            return;
        }

        const { data: { user }, error: userError } = await client.auth.getUser();
        if (!userError) state.currentUserId = user?.id || null;

        container.addEventListener('click', event => {
            const filterButton = event.target.closest('[data-admin-filter]');
            const reviewButton = event.target.closest('[data-review-user]');
            if (filterButton) {
                state.filter = filterButton.dataset.adminFilter;
                container.querySelectorAll('.gm-admin-tabs [data-admin-filter]').forEach(button => button.classList.toggle('is-selected', button.dataset.adminFilter === state.filter));
                if (state.filter === 'pending') document.querySelector('.gm-admin-directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                renderList();
                return;
            }
            if (reviewButton) { openEditor(reviewButton.dataset.reviewUser); return; }
            if (event.target.closest('[data-admin-refresh]')) { loadData(); return; }
            if (event.target.closest('[data-admin-close]')) closeEditor();
        });
        container.querySelector('#gmAdminSearch')?.addEventListener('input', event => {
            state.query = event.target.value;
            renderList();
        });
        container.querySelector('#gmAdminEditForm')?.addEventListener('submit', saveAccess);
        container.querySelectorAll('input[name="roles"]').forEach(input => input.addEventListener('change', updateModulePreview));
        container.querySelector('#gmAdminDialog')?.addEventListener('click', event => {
            if (event.target === event.currentTarget) closeEditor();
        });

        await loadData();
    }

    window.GMAdmins = { render, init };
})();
