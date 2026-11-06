(() => {
    const capacitor = window.Capacitor;
    if (!capacitor?.isNativePlatform?.() || capacitor.getPlatform?.() !== 'android') return;

    const android = capacitor.registerPlugin('GMAndroid');
    const showError = (error) => {
        console.error('Fitur Android tidak dapat dijalankan:', error);
        window.alert('Fitur ini tidak dapat dibuka saat ini. Coba lagi setelah memeriksa koneksi aplikasi.');
    };

    const printHtml = (html) => {
        const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
            ?.replace(/<[^>]*>/g, ' ')
            ?.replace(/\s+/g, ' ')
            ?.trim() || 'Gorden Malang';
        android.printHtml({ html, jobName: title }).catch(showError);
    };

    const createPrintWindow = () => {
        let html = '';
        let closed = false;

        return {
            get closed() { return closed; },
            document: {
                open() { html = ''; },
                write(content) { html += String(content); },
                close() {
                    if (html.trim()) printHtml(html);
                }
            },
            focus() {},
            print() {
                if (html.trim()) printHtml(html);
            },
            close() { closed = true; }
        };
    };

    window.open = (url = '', target = '_blank') => {
        if (url === '' || url === 'about:blank') return createPrintWindow();

        android.openExternalUrl({ url: String(url) }).catch(showError);
        return { closed: false, focus() {}, close() {} };
    };
})();
