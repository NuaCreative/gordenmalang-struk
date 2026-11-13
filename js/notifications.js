
(() => {
    'use strict';

    const MAX_NOTIFICATIONS = 50;

    let client = null;
    let currentUserId = null;
    let channel = null;
    let notifications = [];
    let readIds = new Set();
    let isOpen = false;

    const escapeHTML = value => String(value ?? '').replace(
        /[&<>"']/g,
        char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[char]
    );

    const formatDate = value => {
        if (!value) return '-';

        return new Date(value).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    function getElements() {
        return {
            wrapper: document.getElementById('gmNotificationWrapper'),
            button: document.getElementById('gmNotificationButton'),
            badge: document.getElementById('gmNotificationBadge'),
            panel: document.getElementById('gmNotificationPanel'),
            list: document.getElementById('gmNotificationList'),
            markAll: document.getElementById('gmNotificationMarkAll')
        };
    }

    function mount() {
        const userArea = document.querySelector('.gm-user-area');

        if (!userArea) {
            console.error('GM Notifications: area akun tidak ditemukan.');
            return false;
        }

        if (document.getElementById('gmNotificationWrapper')) {
            return true;
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'gmNotificationWrapper';
        wrapper.className = 'gm-notification-wrapper';

        wrapper.innerHTML = `
            <button
                type="button"
                id="gmNotificationButton"
                class="gm-notification-button"
                aria-label="Notifikasi"
                aria-expanded="false"
                aria-controls="gmNotificationPanel"
                title="Notifikasi"
            >
                <i class="fa-regular fa-bell" aria-hidden="true"></i>
                <span
                    id="gmNotificationBadge"
                    class="gm-notification-badge"
                    hidden
                >0</span>
            </button>

            <section
                id="gmNotificationPanel"
                class="gm-notification-panel"
                aria-label="Daftar notifikasi"
                hidden
            >
                <div class="gm-notification-header">
                    <div>
                        <strong>Notifikasi</strong>
                        <small>Perubahan jadwal dan produksi</small>
                    </div>

                    <button
                        type="button"
                        id="gmNotificationMarkAll"
                        class="gm-notification-mark-all"
                    >
                        Baca semua
                    </button>
                </div>

                <div
                    id="gmNotificationList"
                    class="gm-notification-list"
                    aria-live="polite"
                >
                    <div class="gm-notification-empty">
                        Memuat notifikasi...
                    </div>
                </div>
            </section>
        `;

        const logoutButton = document.getElementById('logoutButton');

        if (logoutButton && logoutButton.parentNode === userArea) {
            userArea.insertBefore(wrapper, logoutButton);
        } else {
            userArea.appendChild(wrapper);
        }

        const elements = getElements();

        elements.button.addEventListener('click', togglePanel);
        elements.markAll.addEventListener('click', markAllAsRead);
        elements.list.addEventListener('click', handleNotificationClick);

        document.addEventListener('click', event => {
            if (
                isOpen &&
                !wrapper.contains(event.target)
            ) {
                closePanel();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closePanel();
        });

        return true;
    }

    function togglePanel() {
        if (isOpen) {
            closePanel();
        } else {
            openPanel();
        }
    }

    function openPanel() {
        const elements = getElements();
        if (!elements.panel) return;

        isOpen = true;
        elements.panel.hidden = false;
        elements.button.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
        const elements = getElements();
        if (!elements.panel) return;

        isOpen = false;
        elements.panel.hidden = true;
        elements.button.setAttribute('aria-expanded', 'false');
    }

    function updateBadge() {
        const elements = getElements();
        if (!elements.badge) return;

        const unreadCount = notifications.filter(
            item => !readIds.has(item.id)
        ).length;

        elements.badge.textContent =
            unreadCount > 99 ? '99+' : String(unreadCount);

        elements.badge.hidden = unreadCount === 0;

        elements.button?.setAttribute(
            'aria-label',
            unreadCount
                ? `Notifikasi, ${unreadCount} belum dibaca`
                : 'Notifikasi'
        );
    }

    function render() {
        const elements = getElements();
        if (!elements.list) return;

        if (!notifications.length) {
            elements.list.innerHTML = `
                <div class="gm-notification-empty">
                    <i class="fa-regular fa-bell-slash"></i>
                    <strong>Belum ada notifikasi</strong>
                    <span>Perubahan status pekerjaan akan muncul di sini.</span>
                </div>
            `;

            updateBadge();
            return;
        }

        elements.list.innerHTML = notifications.map(item => {
            const unread = !readIds.has(item.id);
            const icon = item.entity_type === 'production'
                ? 'fa-scissors'
                : 'fa-calendar-check';

            return `
                <button
                    type="button"
                    class="gm-notification-item ${unread ? 'is-unread' : ''}"
                    data-notification-id="${escapeHTML(item.id)}"
                    aria-label="${escapeHTML(item.title)}"
                >
                    <span class="gm-notification-icon">
                        <i class="fa-solid ${icon}" aria-hidden="true"></i>
                    </span>

                    <span class="gm-notification-content">
                        <strong>${escapeHTML(item.title)}</strong>
                        <span>${escapeHTML(item.message)}</span>
                        <small>${escapeHTML(formatDate(item.created_at))}</small>
                    </span>

                    ${unread ? `
                        <span class="gm-notification-unread-dot"
                            aria-label="Belum dibaca"></span>
                    ` : ''}
                </button>
            `;
        }).join('');

        updateBadge();
    }

    async function loadNotifications() {
        if (!client || !currentUserId) return;

        const elements = getElements();

        if (elements.list) {
            elements.list.innerHTML = `
                <div class="gm-notification-empty">
                    Memuat notifikasi...
                </div>
            `;
        }

        const { data, error } = await client
            .from('notifications')
            .select(`
                id,
                event_type,
                title,
                message,
                entity_type,
                entity_id,
                entity_number,
                old_status,
                new_status,
                created_at
            `)
            .order('created_at', { ascending: false })
            .limit(MAX_NOTIFICATIONS);

        if (error) {
            console.error('Gagal memuat notifikasi:', error);

            if (elements.list) {
                elements.list.innerHTML = `
                    <div class="gm-notification-empty">
                        Notifikasi gagal dimuat. Periksa koneksi.
                    </div>
                `;
            }

            return;
        }

        notifications = data || [];

        if (notifications.length) {
            const ids = notifications.map(item => item.id);

            const { data: reads, error: readError } = await client
                .from('notification_reads')
                .select('notification_id')
                .eq('user_id', currentUserId)
                .in('notification_id', ids);

            if (readError) {
                console.error('Gagal memuat status notifikasi:', readError);
                readIds = new Set();
            } else {
                readIds = new Set(
                    (reads || []).map(item => item.notification_id)
                );
            }
        } else {
            readIds = new Set();
        }

        render();
    }

    async function markAsRead(notificationId) {
        if (!client || !currentUserId || readIds.has(notificationId)) {
            return true;
        }

        const { error } = await client
            .from('notification_reads')
            .insert({
                notification_id: notificationId,
                user_id: currentUserId
            });

        if (error && error.code !== '23505') {
            console.error('Gagal menandai notifikasi dibaca:', error);
            return false;
        }

        readIds.add(notificationId);
        render();

        return true;
    }

    async function markAllAsRead() {
        if (!client || !currentUserId) return;

        const unread = notifications.filter(
            item => !readIds.has(item.id)
        );

        if (!unread.length) return;

        const rows = unread.map(item => ({
            notification_id: item.id,
            user_id: currentUserId
        }));

        const { error } = await client
            .from('notification_reads')
            .upsert(rows, {
                onConflict: 'notification_id,user_id',
                ignoreDuplicates: true
            });

        if (error) {
            console.error('Gagal menandai semua notifikasi:', error);
            return;
        }

        unread.forEach(item => readIds.add(item.id));
        render();
    }

    async function handleNotificationClick(event) {
        const button = event.target.closest(
            '[data-notification-id]'
        );

        if (!button) return;

        const notification = notifications.find(
            item => item.id === button.dataset.notificationId
        );

        if (!notification) return;

        const marked = await markAsRead(notification.id);

        if (!marked) return;

        closePanel();

        if (
            window.GMApp &&
            typeof window.GMApp.openNotification === 'function'
        ) {
            await window.GMApp.openNotification(notification);
        } else {
            console.error('GMApp.openNotification belum tersedia.');
        }
    }

    function subscribeRealtime() {
        if (!client || !currentUserId) return;

        if (channel) {
            client.removeChannel(channel);
            channel = null;
        }

        channel = client
            .channel(`gm-notifications-${currentUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                payload => {
                    const incoming = payload.new;

                    if (!incoming?.id) return;

                    if (!notifications.some(item => item.id === incoming.id)) {
                        notifications.unshift(incoming);
                        notifications = notifications.slice(
                            0,
                            MAX_NOTIFICATIONS
                        );

                        render();
                    }
                }
            )
            .subscribe(status => {
                if (status === 'CHANNEL_ERROR') {
                    console.error(
                        'Realtime notifikasi gagal terhubung.'
                    );
                }
            });
    }

    async function start(user) {
        const supabase = window.gmSupabase || window.supabaseClient;

        if (!supabase || !user?.id) {
            console.error(
                'GM Notifications: Supabase client atau pengguna tidak tersedia.'
            );
            return;
        }

        await stop();

        client = supabase;
        currentUserId = user.id;

        if (!mount()) return;

        await loadNotifications();
        subscribeRealtime();
    }

    async function stop() {
        if (client && channel) {
            await client.removeChannel(channel);
        }

        channel = null;
        currentUserId = null;
        notifications = [];
        readIds = new Set();
        isOpen = false;

        const elements = getElements();

        if (elements.panel) elements.panel.hidden = true;
        if (elements.button) {
            elements.button.setAttribute('aria-expanded', 'false');
        }

        updateBadge();

        client = null;
    }

    window.GMNotifications = {
        init: userId => start({ id: userId }),
        destroy: stop,
        refresh: loadNotifications
    };
})();
