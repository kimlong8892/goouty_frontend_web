import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '@/pwa/hooks/usePWAInstall';
import { usePWA } from '@/pwa/hooks/usePWA';

export const PWAInstallPrompt = () => {
    const { isInstallable, handleInstallClick } = usePWAInstall();
    const { isPWA } = usePWA();
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem('goouty_pwa_install_prompt_dismissed') === 'true';
        if (isInstallable && !isPWA && !isDismissed) {
            // Delay showing the prompt a bit for better UX
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isInstallable, isPWA]);

    const handleInstall = async () => {
        localStorage.setItem('goouty_pwa_install_prompt_dismissed', 'true');
        await handleInstallClick();
        setShowPrompt(false);
    };

    const close = () => {
        localStorage.setItem('goouty_pwa_install_prompt_dismissed', 'true');
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[100] animate-slide-up md:left-auto md:right-4 md:max-w-sm">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(99,71,249,0.3)] p-5 border border-primary/20 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>

                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                        <Download className="w-7 h-7 text-white animate-bounce-subtle" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">
                                Trải nghiệm Goouty tốt hơn
                            </h3>
                            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </div>
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            Cài đặt Goouty để truy cập nhanh, sử dụng mượt mà và tiết kiệm dữ liệu hơn.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleInstall}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 font-semibold h-11"
                            >
                                Cài đặt ngay
                            </Button>
                            <Button
                                onClick={close}
                                variant="ghost"
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-11 px-4"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

