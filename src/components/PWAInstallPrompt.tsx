import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Sparkles, Share, PlusSquare, MoreVertical } from 'lucide-react';
import { usePWAInstall } from '@/pwa/hooks/usePWAInstall';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

export const PWAInstallPrompt = () => {
    const { isInstallable, handleInstallClick } = usePWAInstall();
    const { isPWA } = usePWA();
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        // Detect platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
        setIsAndroid(/android/.test(userAgent));

        // Only show if not already in PWA mode
        if (!isPWA) {
            const isMobile = /iphone|ipad|ipod|android/.test(userAgent);

            if (isMobile || isInstallable) {
                // Delay showing the prompt a bit for better UX
                const timer = setTimeout(() => {
                    setShowPrompt(true);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [isInstallable, isPWA]);

    const handleInstall = async () => {
        if (isInstallable) {
            await handleInstallClick();
            setShowPrompt(false);
        } else {
            // If not directly installable (like iOS), we just show instructions
            // which are already visible in the dialog
        }
    };

    const close = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500 md:left-auto md:right-6 md:max-w-sm">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-5 border border-primary/20 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>

                <button
                    onClick={close}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                            <Download className="w-7 h-7 text-white animate-bounce-subtle" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Cài đặt Goouty App
                                </h3>
                                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                Để trải nghiệm tốt hơn, truy cập nhanh, mượt mà và tiết kiệm dữ liệu.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-3">
                        {isIOS ? (
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                                    Hướng dẫn cài đặt trên iOS:
                                </p>
                                <div className="space-y-1.5 ml-1">
                                    <div className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">1</span>
                                        <p>Nhấn vào nút <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 mx-0.5"><Share className="w-3.5 h-3.5" /></span> trên thanh menu Safari.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">2</span>
                                        <p>Kéo xuống và chọn <span className="font-semibold text-gray-900 dark:text-white italic">"Thêm vào MH chính"</span> (Add to Home Screen).</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">3</span>
                                        <p>Nhấn <span className="font-bold text-primary">Thêm</span> (Add) để hoàn tất.</p>
                                    </div>
                                </div>
                            </div>
                        ) : isInstallable ? (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug text-center">
                                    Ứng dụng đã sẵn sàng để cài đặt trực tiếp vào điện thoại của bạn.
                                </p>
                                <Button
                                    onClick={handleInstall}
                                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 font-bold h-11 rounded-xl transition-all active:scale-[0.98]"
                                >
                                    Cài đặt ngay
                                </Button>
                            </div>
                        ) : isAndroid ? (
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                                    Hướng dẫn cài đặt trên Android:
                                </p>
                                <div className="space-y-1.5 ml-1">
                                    <div className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">1</span>
                                        <p>Nhấn vào biểu tượng <span className="inline-flex items-center px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 mx-0.5"><MoreVertical className="w-3.5 h-3.5" /></span> trên trình duyệt Chrome.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">2</span>
                                        <p>Chọn <span className="font-semibold text-gray-900 dark:text-white italic">"Cài đặt ứng dụng"</span> (Install app).</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <p className="text-center font-medium text-gray-900 dark:text-white">
                                    Sử dụng như một ứng dụng:
                                </p>
                                <p className="text-center">
                                    Vào menu trình duyệt và chọn <span className="font-semibold italic">"Cài đặt Goouty"</span> hoặc <span className="font-semibold italic">"Thêm vào màn hình chính"</span>.
                                </p>
                            </div>
                        )}
                    </div>

                    {!isInstallable && (
                        <Button
                            onClick={close}
                            variant="ghost"
                            className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-9 font-medium"
                        >
                            Đã hiểu, cảm ơn!
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

