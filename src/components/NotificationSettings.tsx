import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { useGlobalToast } from '@/utils/globalToast';

interface NotificationSettingsProps {
  onPermissionChange?: (granted: boolean) => void;
  showCard?: boolean; // Thêm prop để control việc hiển thị Card wrapper
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onPermissionChange,
  showCard = true,
}) => {
  const { showToast } = useGlobalToast();
  
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<{
    isFullyEnabled: boolean;
    reason: string;
    userNotificationsEnabled: boolean;
    hasCurrentDevice: boolean;
    deviceCount: number;
    devices: any[];
  } | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    const supported = notificationService.isNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      // Check complete notification status from backend
      checkCompleteNotificationStatus();
      
      // Load user notification preferences
      loadNotificationPreferences();
    }
  }, [onPermissionChange]);

  const checkCompleteNotificationStatus = async () => {
    try {
      console.log('Checking both browser permission and device existence...');
      const status = await notificationService.getCompleteNotificationStatus();
      console.log('Device status:', status);
      
      setNotificationStatus(status);
      
      // Check both conditions:
      // 1. Browser permission = 'granted'
      // 2. Device exists in backend
      const browserPermission = Notification.permission;
      const deviceExistsInBackend = status.hasCurrentDevice;
      
      console.log('Both conditions check:', {
        browserPermission,
        deviceExistsInBackend,
        bothConditionsMet: browserPermission === 'granted' && deviceExistsInBackend
      });
      
      if (browserPermission === 'granted' && deviceExistsInBackend) {
        // Both conditions met - show "Đã cấp quyền thông báo"
        setPermission('granted');
        onPermissionChange?.(true);
      } else {
        // At least one condition not met - show "Chưa cấp quyền thông báo" + button
        setPermission('default');
        onPermissionChange?.(false);
        
        if (browserPermission !== 'granted') {
          console.log('Browser permission not granted:', browserPermission);
        }
        if (!deviceExistsInBackend) {
          console.log('Device not found in backend');
        }
      }
    } catch (error) {
      console.error('Error checking device status:', error);
      // Fallback to browser permission only
      const browserPermission = Notification.permission;
      setPermission(browserPermission);
      onPermissionChange?.(browserPermission === 'granted');
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const preferences = await notificationService.getNotificationPreferences();
      setNotificationsEnabled((preferences as any).notificationsEnabled);
      setIsSubscribed(!!(preferences as any).pushSubscription);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const handleRequestPermission = async () => {
    if (!isSupported) {
      showToast('Trình duyệt của bạn không hỗ trợ thông báo', 'error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Requesting notification permission...');
      const result = await notificationService.requestPermission();
      console.log('Permission result:', result);
      
      // Force update local state immediately after permission request
      const currentPermission = Notification.permission;
      console.log('Current permission after request:', currentPermission);
      setPermission(currentPermission);
      onPermissionChange?.(currentPermission === 'granted');
      
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        const delayedPermission = Notification.permission;
        console.log('Delayed permission check:', delayedPermission);
        setPermission(delayedPermission);
        onPermissionChange?.(delayedPermission === 'granted');
      }, 100);
      
      if (result.granted) {
        showToast('Đã cấp quyền thông báo!', 'success');
        
        // Đăng ký lại thiết bị với thông tin mới
        try {
          console.log('Re-registering device after permission granted...');
          await notificationService.registerDevice();
          
          // Refresh status để UI cập nhật ngay lập tức
          await checkCompleteNotificationStatus();
        } catch (error) {
          console.error('Failed to re-register device:', error);
        }
        
        // Automatically subscribe to push notifications
        try {
          console.log('Subscribing to push notifications...');
          await notificationService.subscribeToPush();
          setIsSubscribed(true);
          
          // Cập nhật lastSeen cho thiết bị
          await notificationService.updateLastSeen();
          
          showToast('Đã đăng ký nhận thông báo push!', 'success');
          
          // Refresh status để UI cập nhật ngay lập tức
          await checkCompleteNotificationStatus();
        } catch (error) {
          console.error('Failed to subscribe to push notifications:', error);
          showToast('Không thể đăng ký thông báo push', 'error');
        }
      } else if (result.denied) {
        showToast('Quyền thông báo đã bị từ chối', 'error');
      } else {
        showToast('Quyền thông báo chưa được cấp', 'warning');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      showToast(`Không thể yêu cầu quyền thông báo: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const newEnabled = !notificationsEnabled;
      await notificationService.updateNotificationPreferences({
        notificationsEnabled: newEnabled,
      });
      setNotificationsEnabled(newEnabled);
      showToast(newEnabled ? 'Đã bật thông báo' : 'Đã tắt thông báo', 'success');
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showToast('Không thể cập nhật cài đặt thông báo', 'error');
    }
  };

  const handleTestNotificationToAllDevices = async () => {
    try {
      console.log('Testing notification to all devices...');
      const result = await notificationService.sendTestNotificationToAllDevices();
      
      if (result.success) {
        showToast(result.message, 'success');
        console.log('Test notification result:', result);
        
        // Hiển thị thông tin chi tiết trong console
        console.log(`Sent to ${result.sentCount}/${result.totalDevices} devices`);
        if (result.errors && result.errors.length > 0) {
          console.warn('Errors occurred:', result.errors);
        }
      } else {
        showToast(result.message, 'warning');
      }
    } catch (error) {
      console.error('Error testing notification to all devices:', error);
      showToast(`Không thể gửi thông báo test: ${error.message}`, 'error');
    }
  };

  const handleTestNotification = async () => {
    // Check permission directly from browser
    const currentPermission = Notification.permission;
    console.log('Current permission for test:', currentPermission);
    console.log('Local permission state:', permission);
    
    // Update local state to match browser state
    setPermission(currentPermission);
    
    if (currentPermission !== 'granted') {
      showToast(`Quyền thông báo chưa được cấp. Hiện tại: ${currentPermission}`, 'error');
      return;
    }

    try {
      console.log('Testing notification...');
      await notificationService.showNotification('Thông báo test từ Goouty', {
        body: 'Đây là thông báo test để kiểm tra cài đặt thông báo của bạn.',
        tag: 'test-notification'
      });
      showToast('Đã gửi thông báo test!', 'success');
    } catch (error) {
      console.error('Error showing test notification:', error);
      showToast(`Không thể hiển thị thông báo test: ${error.message}`, 'error');
    }
  };

  const getStatusIcon = () => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'default':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <BellOff className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (permission) {
      case 'granted':
        return 'Đã cấp quyền thông báo';
      case 'denied':
        return 'Quyền thông báo bị từ chối';
      case 'default':
        return 'Chưa cấp quyền thông báo';
      default:
        return 'Không hỗ trợ thông báo';
    }
  };

  const getStatusColor = () => {
    switch (permission) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      case 'default':
        return 'text-yellow-600';
      default:
        return 'text-gray-400';
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-gray-400" />
            Thông báo không được hỗ trợ
          </CardTitle>
          <CardDescription>
            Trình duyệt của bạn không hỗ trợ thông báo push
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vui lòng sử dụng trình duyệt hiện đại để nhận thông báo từ Goouty.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Thông báo Push
        </CardTitle>
        <CardDescription>
          Nhận thông báo về các chuyến đi mới được tạo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isSubscribed && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                Đã đăng ký push
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Thông báo:</span>
              <button
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Show button only when both conditions are not met */}
        {(permission !== 'granted' || !notificationStatus?.hasCurrentDevice) && (
          <Button
            onClick={handleRequestPermission}
            disabled={isLoading || permission === 'denied'}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                {permission === 'denied' 
                  ? 'Quyền đã bị từ chối' 
                  : 'Cấp quyền thông báo'
                }
              </>
            )}
          </Button>
        )}

        {/* Show test notification section only when both conditions are met */}
        {permission === 'granted' && notificationStatus?.hasCurrentDevice && (
          <div className="space-y-2">
            <Button
              onClick={handleTestNotification}
              variant="outline"
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Gửi thông báo test
            </Button>
            <Button
              onClick={handleTestNotificationToAllDevices}
              variant="outline"
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Test gửi tới tất cả device
            </Button>
            <p className="text-xs text-muted-foreground">
              Nhấn để kiểm tra xem thông báo có hoạt động không
            </p>
            <p className="text-xs text-orange-600">
              ⚠️ Button "Test gửi tới tất cả device" sẽ gửi thông báo tới tất cả device có pushSubscription trong hệ thống
            </p>
          </div>
        )}

        {permission === 'denied' && (
          <div className="text-xs text-muted-foreground bg-red-50 p-3 rounded-md">
            <strong>Quyền thông báo đã bị từ chối.</strong> Để bật lại, hãy:
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Click vào biểu tượng khóa ở thanh địa chỉ</li>
              <li>Chọn "Thông báo" và đặt thành "Cho phép"</li>
              <li>Tải lại trang</li>
            </ol>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Thông báo sẽ bao gồm:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Chuyến đi mới được tạo</li>
            <li>Cập nhật từ các chuyến đi</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
