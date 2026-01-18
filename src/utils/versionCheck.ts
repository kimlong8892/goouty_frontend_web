
export const checkAndClearCache = async () => {
    const STORAGE_KEY = 'app_version';
    const currentVersion = __APP_VERSION__;
    const storedVersion = localStorage.getItem(STORAGE_KEY);

    console.log(`[VersionCheck] Current: ${currentVersion}, Stored: ${storedVersion}`);

    if (storedVersion && storedVersion !== currentVersion) {
        console.log('[VersionCheck] New version detected. Clearing cache...');

        // 1. Clear LocalStorage
        localStorage.clear();

        // 2. Clear SessionStorage
        sessionStorage.clear();

        // 3. Clear Cache Storage (for PWA/Service Workers)
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map((key) => caches.delete(key)));
                console.log('[VersionCheck] Cache storage cleared.');
            } catch (error) {
                console.error('[VersionCheck] Failed to clear cache storage:', error);
            }
        }

        // 4. Unregister Service Workers
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
                console.log('[VersionCheck] Service workers unregistered.');
            } catch (error) {
                console.error('[VersionCheck] Failed to unregister service workers:', error);
            }
        }

        // 5. Update Version
        localStorage.setItem(STORAGE_KEY, currentVersion);

        // 6. Reload Page to fetch fresh assets
        console.log('[VersionCheck] Reloading page...');
        window.location.reload();
    } else if (!storedVersion) {
        // First time load, just set the version
        console.log('[VersionCheck] First load, setting version.');
        localStorage.setItem(STORAGE_KEY, currentVersion);
    } else {
        console.log('[VersionCheck] Version is up to date.');
    }
};
