import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Apple, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { usePWAInstall } from '@/pwa/hooks/usePWAInstall';
import { usePWA } from '@/pwa/hooks/usePWA';
import { InstallInstructionsModal } from './InstallInstructionsModal';
import { useIsMobile } from '@/hooks/use-mobile';

export const PWAInstallButton: React.FC<{
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    showIconOnly?: boolean;
}> = ({ className, variant = 'default', showIconOnly = false }) => {
    const { isInstallable, handleInstallClick } = usePWAInstall();
    const { isPWA } = usePWA();
    const isMobile = useIsMobile();
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
        } else {
            setPlatform('other');
        }
    }, []);

    // Don't show if already in PWA mode
    if (isPWA) return null;

    const handleClick = () => {
        if (isInstallable) {
            handleInstallClick();
        } else {
            // If not "installable" via beforeinstallprompt, show manual instructions
            // especially important for iOS
            setIsModalOpen(true);
        }
    };

    // On non-mobile desktop, if not installable, maybe hide?
    // But usually we want to show it if there's a chance.
    // For now, let's show it if isInstallable OR if it's mobile (for instructions)
    if (!isInstallable && !isMobile) return null;

    return (
        <>
            <Button
                variant={variant}
                className={className}
                onClick={handleClick}
                title="Cài đặt ứng dụng Goouty"
            >
                {platform === 'ios' ? (
                    <Apple className={showIconOnly ? "w-5 h-5" : "w-4 h-4 mr-2"} />
                ) : platform === 'android' ? (
                    <Smartphone className={showIconOnly ? "w-5 h-5" : "w-4 h-4 mr-2"} />
                ) : (
                    <Download className={showIconOnly ? "w-5 h-5" : "w-4 h-4 mr-2"} />
                )}
                {!showIconOnly && "Cài đặt ứng dụng"}
            </Button>

            <InstallInstructionsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                platform={platform}
            />
        </>
    );
};
