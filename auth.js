(() => {
    const config = window.GM_SUPABASE_CONFIG;
    const loginScreen = document.getElementById('loginScreen');
    const appContent = document.getElementById('appContent');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginButton = document.getElementById('loginButton');
    const loginMessage = document.getElementById('loginMessage');
    const signupButton = document.getElementById('signupButton');
    const signupMessage = document.getElementById('signupMessage');
    const showSignupButton = document.getElementById('showSignupButton');
    const showLoginButton = document.getElementById('showLoginButton');
    const accountLabel = document.getElementById('accountLabel');
    const logoutButton = document.getElementById('logoutButton');

    function message(text, success = false) {
        loginMessage.textContent = text;
        loginMessage.classList.toggle('success', success);
    }

    function signupStatus(text, success = false) {
        signupMessage.textContent = text;
        signupMessage.classList.toggle('success', success);
    }

    function setAuthMode(mode) {
        const signup = mode === 'signup';
        loginForm.hidden = signup;
        signupForm.hidden = !signup;
        if (signup) document.getElementById('signupName').focus();
        else document.getElementById('loginEmail').focus();
    }

    function showLogin(text = '') {
        loginScreen.hidden = false;
        appContent.hidden = true;
        accountLabel.textContent = '';
        window.gmRoles = [];
        window.gmModuleAccess = [];
        updateModuleNavigation();
        if (text) message(text);
    }

    function showApp(label) {
        loginScreen.hidden = true;
        appContent.hidden = false;
        accountLabel.textContent = label;
    }

    function roleLabel(role) {
        return ({ owner: 'Owner', finance: 'Finance', sales: 'Sales', operations: 'Operasional' })[role] || role;
    }

    function updateModuleNavigation() {
        const allowed = new Set(window.gmModuleAccess || []);
        document.querySelectorAll('.gm-nav-button').forEach(button => {
            button.hidden = !allowed.has(button.dataset.module);
        });
        document.querySelectorAll('.gm-navigation').forEach(nav => {
            const hasVisibleButton = [...nav.querySelectorAll('.gm-nav-button')].some(button => !button.hidden);
            nav.hidden = !hasVisibleButton;
            const sectionLabel = nav.previousElementSibling;
            if (sectionLabel?.classList.contains('gm-menu-label')) sectionLabel.hidden = !hasVisibleButton;
        });
    }

    async function init() {
        if (!window.supabase || !config ||
            !config.url || config.url.includes('PASTE_') ||
            !config.publishableKey || config.publishableKey.includes('PASTE_')) {
            showLogin('Konfigurasi Supabase belum diisi. Isi URL dan Publishable key di file config.js.');
            loginButton.disabled = true;
            return;
        }

        const client = window.supabase.createClient(config.url, config.publishableKey);
        window.gmSupabase = client;

        async function validateAndShow(user) {
            if (!user) { showLogin(); return; }
            const [{ data: profile, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
                client.from('profiles').select('full_name,is_active').eq('id', user.id).maybeSingle(),
                client.from('user_roles').select('role').eq('user_id', user.id)
            ]);
            if (profileError || roleError) {
                showLogin('Tidak dapat memeriksa profil/role. Pastikan tabel dan policy Supabase sudah dibuat.');
                return;
            }
            if (!profile || profile.is_active !== true || !roles || roles.length === 0) {
                await client.auth.signOut();
                showLogin('Akun Anda belum diaktifkan. Minta owner mengaktifkan profil dan memberi role sebelum masuk.');
                return;
            }
            // Simpan role pengguna untuk menentukan hak akses di tampilan aplikasi.
            window.gmRoles = roles.map(item => item.role);
            window.gmModuleAccess = window.GMAccess
                ? window.GMAccess.modulesForRoles(window.gmRoles)
                : ['dashboard'];
            updateModuleNavigation();

            const roleNames = roles.map(item => roleLabel(item.role)).join(', ');
            showApp(`${profile.full_name || user.email} · ${roleNames}`);
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            loginButton.disabled = true;
            loginButton.textContent = 'Memeriksa...';
            message('');
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const { data, error } = await client.auth.signInWithPassword({ email, password });
            if (error) {
                console.error('Login error:', error);
                message(
                    error.message === 'Email not confirmed'
                        ? 'Email belum diverifikasi. Silakan periksa inbox Gmail.'
                        : 'Login gagal: ' + error.message
                );
            } else {
                await validateAndShow(data.user);
            }
            loginButton.disabled = false;
            loginButton.textContent = 'Masuk';
        });

        showSignupButton.addEventListener('click', () => {
            signupStatus('');
            setAuthMode('signup');
        });

        showLoginButton.addEventListener('click', () => {
            message('');
            setAuthMode('login');
        });

        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!signupForm.reportValidity()) return;

            const fullName = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim().toLowerCase();
            const password = document.getElementById('signupPassword').value;
            const confirmation = document.getElementById('signupPasswordConfirm').value;

            if (password !== confirmation) {
                signupStatus('Password dan ulangi password belum sama.');
                return;
            }

            signupButton.disabled = true;
            signupButton.textContent = 'Membuat akun...';
            signupStatus('');

            try {
                const { data, error } = await client.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } }
                });

                if (error) throw error;

                if (data.session) {
                    const { error: signOutError } = await client.auth.signOut();
                    if (signOutError) throw signOutError;
                }

                signupForm.reset();
                signupStatus(
                    'Pendaftaran berhasil. Akun menunggu persetujuan owner. ' +
                    'Jika Supabase meminta verifikasi email, buka email tersebut terlebih dahulu.',
                    true
                );
            } catch (error) {
                console.error('Pendaftaran akun gagal:', error);
                signupStatus(
                    'Pendaftaran gagal: ' +
                    (error.message || 'Periksa koneksi dan pengaturan Supabase Auth.')
                );
            } finally {
                signupButton.disabled = false;
                signupButton.textContent = 'Buat Akun';
            }
        });

        logoutButton.addEventListener('click', async () => {
            logoutButton.disabled = true;
            const { error } = await client.auth.signOut();
            logoutButton.disabled = false;
            if (error) alert('Gagal keluar. Periksa koneksi internet lalu coba lagi.');
            else showLogin('Kamu sudah keluar dari aplikasi.');
        });

        const { data: { session }, error } = await client.auth.getSession();
        if (error) showLogin('Sesi tidak dapat diperiksa. Silakan login kembali.');
        else await validateAndShow(session?.user || null);

        client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') showLogin();
            // Login awal ditangani oleh getSession agar query profil tidak berjalan berulang.
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
