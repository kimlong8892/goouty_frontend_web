import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { useGlobalToast } from '@/utils/globalToast';
import { usePWA } from '@/pwa/hooks/usePWA';

interface NotificationSettingsProps {
  onPermissionChange?: (granted: boolean) => void;
  showCard?: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onPermissionChange,
  showCard = true,
}) => {
  const { showToast } = useGlobalToast();
  const { isPWA } = usePWA();

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load initial state
  useEffect(() => {
    if (!isPWA) return;

    if (!notificationService.isNotificationSupported()) {
      return;
    }

    const checkStatus = async () => {
      // Check permission
      setPermission(Notification.permission);

      // Load preferences
      try {
        const prefs = await notificationService.getNotificationPreferences();
        setNotificationsEnabled((prefs as any).notificationsEnabled);
      } catch (e) {
        console.error("Failed to load prefs", e);
      }
    };

    checkStatus();
  }, [isPWA]);

  const handleToggle = async (checked: boolean) => {
    if (!isPWA || isLoading) return;

    // Turning ON
    if (checked) {
      if (permission === 'denied') {
        showToast('Quyền thông báo đã bị từ chối. Vui lòng bật trong cài đặt trình duyệt.', 'error');
        return;
      }

      setIsLoading(true);
      try {
        // Always try to Ensure permission & subscription when turning on
        let currentPermission = Notification.permission;

        if (currentPermission !== 'granted') {
          const result = await notificationService.requestPermission();
          if (!result.granted) {
            setPermission(Notification.permission);
            showToast('Bạn cần cấp quyền để nhận thông báo.', 'warning');
            setIsLoading(false);
            return;
          }
          currentPermission = 'granted';
        }

        setPermission(currentPermission);
        onPermissionChange?.(true);

        // Register/Subscribe if needed
        await notificationService.registerDevice();
        await notificationService.subscribeToPush();

        // Update Preference
        await notificationService.updateNotificationPreferences({ notificationsEnabled: true });
        setNotificationsEnabled(true);
        showToast('Đã bật thông báo', 'success');

      } catch (error) {
        console.error('Failed to enable notifications:', error);
        showToast('Không thể bật thông báo. Vui lòng thử lại.', 'error');
        // Revert switch if failed
        setNotificationsEnabled(false);
      } finally {
        setIsLoading(false);
      }

    } else {
      // Turning OFF
      try {
        setIsLoading(true);
        await notificationService.updateNotificationPreferences({ notificationsEnabled: false });
        setNotificationsEnabled(false);
        showToast('Đã tắt thông báo', 'success');
      } catch (error) {
        console.error('Failed to disable notifications:', error);
        showToast('Lỗi khi tắt thông báo', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isPWA) return null;

  const content = (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-secondary rounded-xl text-primary">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">Thông báo</span>
          <span className="text-xs text-muted-foreground">Nhận thông báo về chuyến đi</span>
        </div>
      </div>
      <Switch
        checked={notificationsEnabled}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card className="w-full border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cài đặt thông báo</CardTitle>
        <CardDescription>Quản lý nhận thông báo trên thiết bị này</CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
