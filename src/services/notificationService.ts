import { api } from '../integrations/api/client';
import type {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationListResponse,
  NotificationStats,
  MarkAsReadDto,
  NotificationFilters,
} from '../types/notification';
import { NotificationType, NotificationStatus } from '../types/notification';

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission | null = null;
  private deviceId: string | null = null;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.deviceId = this.generateDeviceId();
  }

  /**
   * Tạo device ID duy nhất cho thiết bị này
   */
  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('goouty_device_id');
    if (!deviceId) {
      // Tạo device ID từ browser fingerprint
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx?.fillText('GoOuty Device ID', 10, 10);
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');

      deviceId = btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      localStorage.setItem('goouty_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Đăng ký thiết bị với server
   */
  async registerDevice(): Promise<void> {
    try {
      const deviceData = {
        deviceId: this.deviceId,
        deviceName: this.getDeviceName(),
        userAgent: navigator.userAgent,
      };

      console.log('Registering device:', deviceData);
      const response = await api.post('/devices', deviceData);
      console.log('Device registered successfully:', response);

      // Cập nhật lastSeen ngay sau khi đăng ký
      await this.updateLastSeen();
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  /**
   * Lấy tên thiết bị thân thiện
   */
  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Mobile')) {
      return 'Mobile Device';
    } else if (userAgent.includes('Tablet')) {
      return 'Tablet';
    } else if (userAgent.includes('Chrome')) {
      return 'Chrome Browser';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox Browser';
    } else if (userAgent.includes('Safari')) {
      return 'Safari Browser';
    } else {
      return 'Web Browser';
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notifications not supported');
    }

    try {
      console.log('Current permission before request:', Notification.permission);
      const permission = await Notification.requestPermission();
      console.log('Permission after request:', permission);

      // Double-check the permission after a short delay
      setTimeout(() => {
        const delayedCheck = Notification.permission;
        console.log('Delayed permission check:', delayedCheck);
      }, 100);

      this.permission = {
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default',
      };

      console.log('Updated permission object:', this.permission);
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      throw new Error('Notifications not supported or permission not granted');
    }

    try {
      console.log('Starting push subscription process...');

      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready, subscribing to push...');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BPIVK5Oa3vmJH7lEC5QmvTGcgd3OvruJQKNoghD4j_VL7m_GMZRBuh2i4ePqLQSajKrFKata5xZYtyN_wLldzUE'
        ),
      });

      const pushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')),
        },
      };

      console.log('Push subscription created:', pushSubscriptionData);

      // Gửi push subscription đến backend với thông tin thiết bị
      await this.sendPushSubscriptionToBackend(pushSubscriptionData);
      console.log('Push subscription sent to backend with device info');

      return pushSubscriptionData;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Gửi push subscription đến backend với thông tin thiết bị
   */
  async sendPushSubscriptionToBackend(pushSubscriptionData: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }): Promise<void> {
    try {
      const subscriptionPayload = {
        endpoint: pushSubscriptionData.endpoint,
        p256dh: pushSubscriptionData.keys.p256dh,
        auth: pushSubscriptionData.keys.auth,
        deviceId: this.deviceId,
        deviceName: this.getDeviceName(),
        userAgent: navigator.userAgent,
      };

      console.log('Sending push subscription to backend:', subscriptionPayload);

      const response = await api.post('/notifications/subscribe', subscriptionPayload);
      console.log('Push subscription sent to backend successfully:', response);
    } catch (error) {
      console.error('Error sending push subscription to backend:', error);
      throw error;
    }
  }

  /**
   * Cập nhật push subscription cho thiết bị hiện tại
   */
  async updateDevicePushSubscription(pushSubscription: string): Promise<void> {
    try {
      if (!this.deviceId) {
        throw new Error('Device ID not available');
      }

      console.log('Updating push subscription for device:', this.deviceId);
      console.log('Push subscription data:', pushSubscription);

      const response = await api.put(`/devices/${this.deviceId}/push-subscription`, {
        pushSubscription,
      });

      console.log('Push subscription updated successfully:', response);
    } catch (error) {
      console.error('Error updating device push subscription:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thời gian lastSeen cho thiết bị
   */
  async updateLastSeen(): Promise<void> {
    try {
      if (!this.deviceId) {
        console.warn('Device ID not available for lastSeen update');
        return;
      }

      console.log('Updating lastSeen for device:', this.deviceId);
      const response = await api.put(`/devices/${this.deviceId}/last-seen`);
      console.log('LastSeen updated successfully:', response);
    } catch (error) {
      console.error('Error updating last seen:', error);
      // Không throw error vì đây là operation không critical
    }
  }

  /**
   * Lấy danh sách thiết bị của user
   */
  async getUserDevices() {
    try {
      const response = await api.get('/devices');
      console.log('User devices:', response);
      return response;
    } catch (error) {
      console.error('Error getting user devices:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem thiết bị hiện tại đã được đăng ký chưa
   */
  async checkDeviceRegistration(): Promise<boolean> {
    try {
      const devices = await this.getUserDevices();
      const currentDevice = devices.find((device: any) => device.deviceId === this.deviceId);
      console.log('Current device registration status:', !!currentDevice);
      return !!currentDevice;
    } catch (error) {
      console.error('Error checking device registration:', error);
      return false;
    }
  }

  /**
   * Kiểm tra xem device hiện tại có trong table Device chưa
   */
  async getCompleteNotificationStatus(): Promise<{
    isFullyEnabled: boolean;
    reason: string;
    userNotificationsEnabled: boolean;
    hasCurrentDevice: boolean;
    deviceCount: number;
    devices: any[];
  }> {
    try {
      console.log('Checking if current device exists in backend...');
      const response = await api.get('/notifications/status');
      console.log('Device status:', response);
      return response;
    } catch (error) {
      console.error('Error checking device status:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo test tới tất cả device trong hệ thống
   */
  async sendTestNotificationToAllDevices(): Promise<{
    success: boolean;
    message: string;
    sentCount: number;
    totalDevices: number;
    errors?: any[];
  }> {
    try {
      console.log('Sending test notification to all devices...');
      const response = await api.post('/notifications/test-all-devices');
      console.log('Test notification response:', response);
      return response;
    } catch (error) {
      console.error('Error sending test notification to all devices:', error);
      throw error;
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Notifications not supported');
    }

    // Check permission directly from browser
    const currentPermission = Notification.permission;
    console.log('Current browser permission:', currentPermission);

    if (currentPermission !== 'granted') {
      throw new Error(`Notification permission not granted. Current: ${currentPermission}`);
    }

    try {
      console.log('Attempting to show notification:', { title, options });

      // Check if service worker is ready
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready:', registration);

      // Show notification via service worker
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        requireInteraction: true, // Keep notification visible until user interacts
        ...options,
      });

      console.log('Notification shown successfully');
    } catch (error) {
      console.error('Error showing notification:', error);
      throw error;
    }
  }

  async getNotificationPreferences() {
    try {
      const response = await api.get('/notifications/preferences');
      return response;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(preferences: {
    notificationsEnabled?: boolean;
    pushSubscription?: string;
  }) {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  getPermissionStatus(): NotificationPermission | null {
    return this.permission;
  }

  /**
   * Get current browser permission status for debugging
   */
  getCurrentBrowserPermission(): string {
    return Notification.permission;
  }

  /**
   * Force refresh permission status
   */
  refreshPermissionStatus(): NotificationPermission {
    const currentPermission = Notification.permission;
    console.log('Refreshing permission status:', currentPermission);

    this.permission = {
      granted: currentPermission === 'granted',
      denied: currentPermission === 'denied',
      default: currentPermission === 'default',
    };

    return this.permission;
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }

  async getServiceWorkerStatus(): Promise<{
    supported: boolean;
    registered: boolean;
    ready: boolean;
    permission: string;
  }> {
    const supported = this.isSupported;
    let registered = false;
    let ready = false;
    let permission = 'unknown';

    if (supported) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        registered = !!registration;

        if (registered) {
          const sw = await navigator.serviceWorker.ready;
          ready = !!sw;
        }

        permission = Notification.permission;
      } catch (error) {
        console.error('Error checking service worker status:', error);
      }
    }

    return {
      supported,
      registered,
      ready,
      permission,
    };
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // ==================== NOTIFICATION CRUD METHODS ====================

  /**
   * Tạo notification mới
   */
  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      console.log('Creating notification:', createNotificationDto);
      const response = await api.post('/notifications', createNotificationDto);
      console.log('Notification created successfully:', response);
      return response;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách notifications của user
   */
  async getUserNotifications(filters: NotificationFilters = {}): Promise<NotificationListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);

      const queryString = params.toString();
      const url = queryString ? `/notifications?${queryString}` : '/notifications';

      console.log('Fetching notifications with filters:', filters);
      const response = await api.get(url);
      console.log('Notifications fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Lấy notification theo ID
   */
  async getNotificationById(id: string): Promise<Notification> {
    try {
      console.log('Fetching notification by ID:', id);
      const response = await api.get(`/notifications/${id}`);
      console.log('Notification fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('Error fetching notification by ID:', error);
      throw error;
    }
  }

  /**
   * Cập nhật notification
   */
  async updateNotification(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    try {
      console.log('Updating notification:', id, updateNotificationDto);
      const response = await api.put(`/notifications/${id}`, updateNotificationDto);
      console.log('Notification updated successfully:', response);
      return response;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  /**
   * Xóa notification
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      console.log('Deleting notification:', id);
      await api.delete(`/notifications/${id}`);
      console.log('Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<{ updated: number }> {
    try {
      console.log('Marking notifications as read:', notificationIds);
      const response = await api.post('/notifications/mark-as-read', {
        notificationIds,
      });
      console.log('Notifications marked as read successfully:', response);
      return response;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(id: string): Promise<Notification> {
    try {
      console.log('Marking notification as unread:', id);
      const response = await api.put(`/notifications/${id}`, {
        status: NotificationStatus.UNREAD,
      });
      console.log('Notification marked as unread successfully:', response);
      return response;
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ updated: number }> {
    try {
      console.log('Marking all notifications as read');
      const response = await api.post('/notifications/mark-all-as-read');
      console.log('All notifications marked as read successfully:', response);
      return response as { updated: number };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Xóa tất cả thông báo đã đọc
   */
  async clearReadNotifications(): Promise<{ deleted: number }> {
    try {
      console.log('Clearing read notifications');
      const response = await api.post('/notifications/clear-read');
      console.log('Read notifications cleared successfully:', response);
      return response as { deleted: number };
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê notifications
   */
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      console.log('Fetching notification stats');
      const response = await api.get('/notifications/stats');
      console.log('Notification stats fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo tới user và lưu vào database
   */
  async sendNotificationToUser(data: {
    title: string;
    body: string;
    type?: string;
    data?: any;
  }): Promise<{
    notificationId: string;
    devicesSent: number;
    totalDevices: number;
  }> {
    try {
      console.log('Sending notification to user:', data);
      const response = await api.post('/notifications/send-to-user', data);
      console.log('Notification sent to user successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  /**
   * Gửi thông báo và lưu vào database
   */
  async sendNotificationWithDatabase(data: {
    title: string;
    body: string;
    type?: string;
    data?: any;
    pushSubscription?: any;
  }): Promise<{
    notificationId: string;
    pushSent: boolean;
  }> {
    try {
      console.log('Sending notification with database:', data);
      const response = await api.post('/notifications/send-with-database', data);
      console.log('Notification sent with database successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending notification with database:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
