import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export const PWAInstallPrompt = () => {
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [offlineReady, setOfflineReady] = useState(false);
    const [needRefresh, setNeedRefresh] = useState(false);

    // Handle install prompt
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Register service worker manually
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then((registration) => {
                    console.log('SW registered:', registration);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    setNeedRefresh(true);
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.log('SW registration failed:', error);
                });

            // Listen for controller change (new SW activated)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleUpdate = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration && registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }
    };

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
        setShowInstallPrompt(false);
    };

    return (
        <>
            {/* Update Available Toast */}
            {(offlineReady || needRefresh) && (
                <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
                    <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm border border-gray-200">
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    {offlineReady ? 'App ready to work offline' : 'New content available'}
                                </h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    {offlineReady
                                        ? 'The app is now ready to work offline.'
                                        : 'Click reload to update to the latest version.'}
                                </p>
                                {needRefresh && (
                                    <Button
                                        onClick={handleUpdate}
                                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                                    >
                                        Reload
                                    </Button>
                                )}
                            </div>
                            <button
                                onClick={close}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Install Prompt */}
            {showInstallPrompt && (
                <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-4 md:max-w-sm">
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-primary/20">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <Download className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-1">
                                    Cài đặt Goouty
                                </h3>
                                <p className="text-sm text-gray-700 mb-3">
                                    Cài đặt ứng dụng để truy cập nhanh hơn và sử dụng offline
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleInstallClick}
                                        className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                                    >
                                        Cài đặt
                                    </Button>
                                    <Button
                                        onClick={close}
                                        variant="outline"
                                        className="border-gray-300 hover:bg-white/50"
                                    >
                                        Để sau
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
