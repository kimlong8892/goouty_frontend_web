import { toast } from 'sonner';
import { usePWA } from '@/pwa/hooks/usePWA';
import { usePWANotificationContext } from '@/pwa/contexts/PWANotificationContext';

// Global toast utility that automatically chooses PWA notification or regular toast
export function useGlobalToast() {
  const { isPWA } = usePWA();
  const { showNotification } = usePWANotificationContext();

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (isPWA) {
      // Use PWA notification for PWA mode
      const title = type === 'success' ? 'Thành công' :
        type === 'error' ? 'Lỗi' :
          type === 'warning' ? 'Cảnh báo' : 'Thông báo';

      showNotification(title, message, type);
    } else {
      // Use regular toast for web mode
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        default:
          toast(message);
      }
    }
  };

  return { showToast };
}

// Standalone function for components that can't use hooks
export function createGlobalToast(isPWA: boolean, showNotification: (title: string, body: string, type?: 'info' | 'success' | 'warning' | 'error') => void) {
  return (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (isPWA) {
      const title = type === 'success' ? 'Thành công' :
        type === 'error' ? 'Lỗi' :
          type === 'warning' ? 'Cảnh báo' : 'Thông báo';

      showNotification(title, message, type);
    } else {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        default:
          toast(message);
      }
    }
  };
}
