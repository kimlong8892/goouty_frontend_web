// Notification Types và Interfaces
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  TRIP_CREATED = 'TRIP_CREATED',
  TRIP_UPDATED = 'TRIP_UPDATED',
  TRIP_DELETED = 'TRIP_DELETED',
  EXPENSE_ADDED = 'EXPENSE_ADDED',
  EXPENSE_UPDATED = 'EXPENSE_UPDATED',
  SETTLEMENT_CREATED = 'SETTLEMENT_CREATED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  data?: any;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  title: string;
  body: string;
  type?: NotificationType;
  data?: any;
}

export interface UpdateNotificationDto {
  status?: NotificationStatus;
  data?: any;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byType: Record<NotificationType, number>;
}

export interface MarkAsReadDto {
  notificationIds: string[];
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: NotificationType;
}

// Notification Type Labels và Colors
export const NOTIFICATION_TYPE_CONFIG = {
  [NotificationType.INFO]: {
    label: 'Thông tin',
    color: 'bg-blue-100 text-blue-800',
    icon: 'ℹ️',
  },
  [NotificationType.SUCCESS]: {
    label: 'Thành công',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  [NotificationType.WARNING]: {
    label: 'Cảnh báo',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⚠️',
  },
  [NotificationType.ERROR]: {
    label: 'Lỗi',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
  },
  [NotificationType.TRIP_CREATED]: {
    label: 'Chuyến đi mới',
    color: 'bg-purple-100 text-purple-800',
    icon: '✈️',
  },
  [NotificationType.TRIP_UPDATED]: {
    label: 'Cập nhật chuyến đi',
    color: 'bg-indigo-100 text-indigo-800',
    icon: '📝',
  },
  [NotificationType.TRIP_DELETED]: {
    label: 'Xóa chuyến đi',
    color: 'bg-gray-100 text-gray-800',
    icon: '🗑️',
  },
  [NotificationType.EXPENSE_ADDED]: {
    label: 'Chi phí mới',
    color: 'bg-orange-100 text-orange-800',
    icon: '💰',
  },
  [NotificationType.EXPENSE_UPDATED]: {
    label: 'Cập nhật chi phí',
    color: 'bg-amber-100 text-amber-800',
    icon: '📊',
  },
  [NotificationType.SETTLEMENT_CREATED]: {
    label: 'Thanh toán',
    color: 'bg-emerald-100 text-emerald-800',
    icon: '💳',
  },
  [NotificationType.SYSTEM_ANNOUNCEMENT]: {
    label: 'Thông báo hệ thống',
    color: 'bg-cyan-100 text-cyan-800',
    icon: '📢',
  },
};

export const NOTIFICATION_STATUS_CONFIG = {
  [NotificationStatus.UNREAD]: {
    label: 'Chưa đọc',
    color: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
  [NotificationStatus.READ]: {
    label: 'Đã đọc',
    color: 'bg-gray-100 text-gray-800',
    dot: 'bg-gray-400',
  },
  [NotificationStatus.ARCHIVED]: {
    label: 'Đã lưu trữ',
    color: 'bg-yellow-100 text-yellow-800',
    dot: 'bg-yellow-500',
  },
};