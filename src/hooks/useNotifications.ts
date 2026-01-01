import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import {
  Notification,
  NotificationFilters,
  NotificationStats,
  NotificationListResponse,
  NotificationType,
  NotificationStatus
} from '../types/notification';
import { useGlobalToast } from '../utils/globalToast';

export interface UseNotificationsReturn {
  // Data
  notifications: Notification[];
  stats: NotificationStats | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;

  // Load more
  hasMore: boolean;
  total: number;
  unreadCount: number;

  // Filters
  filters: NotificationFilters;

  // Actions
  fetchNotifications: (newFilters?: NotificationFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Filter actions
  setFilters: (filters: NotificationFilters) => void;
  setStatusFilter: (status: NotificationStatus | undefined) => void;
  setTypeFilter: (type: NotificationType | undefined) => void;
  clearFilters: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const { showToast } = useGlobalToast();
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load more state
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters state
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 20,
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async (newFilters?: NotificationFilters) => {
    try {
      setLoading(true);
      setError(null);

      const filtersToUse = newFilters || filters;
      const response: NotificationListResponse = await notificationService.getUserNotifications(filtersToUse);

      setNotifications(response.notifications);
      setTotal(response.total);
      setUnreadCount(response.unreadCount);
      setHasMore(response.notifications.length < response.total);

      console.log('Notifications fetched:', response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
      showToast('Không thể tải thông báo', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      const nextPage = Math.floor(notifications.length / (filters.limit || 20)) + 1;
      const response: NotificationListResponse = await notificationService.getUserNotifications({
        ...filters,
        page: nextPage,
      });

      setNotifications(prev => [...prev, ...response.notifications]);
      setHasMore(response.notifications.length === (filters.limit || 20));

      console.log('More notifications loaded:', response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more notifications';
      setError(errorMessage);
      console.error('Error loading more notifications:', err);
      showToast('Không thể tải thêm thông báo', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, notifications.length, filters]);

  // Fetch stats
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await notificationService.getNotificationStats();
      setStats(statsData);
      console.log('Stats refreshed:', statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationService.markAsRead(notificationIds);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, status: NotificationStatus.READ, readAt: new Date().toISOString() }
            : notification
        )
      );

      // Update stats
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark as read';
      console.error('Error marking as read:', err);
      showToast('Không thể đánh dấu đã đọc', 'error');
    }
  }, [refreshStats]);

  // Mark notification as unread
  const markAsUnread = useCallback(async (id: string) => {
    try {
      await notificationService.markAsUnread(id);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, status: NotificationStatus.UNREAD, readAt: undefined }
            : notification
        )
      );

      // Update stats
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark as unread';
      console.error('Error marking as unread:', err);
      showToast('Không thể đánh dấu chưa đọc', 'error');
    }
  }, [refreshStats]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllAsRead();

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          status: NotificationStatus.READ,
          readAt: new Date().toISOString()
        }))
      );

      // Update stats
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all as read';
      console.error('Error marking all as read:', err);
      showToast('Không thể đánh dấu tất cả đã đọc', 'error');
    }
  }, [refreshStats]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id);

      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== id));

      // Update stats
      await refreshStats();

      showToast('Đã xóa thông báo', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      console.error('Error deleting notification:', err);
      showToast('Không thể xóa thông báo', 'error');
    }
  }, [refreshStats]);

  // Clear read notifications
  const clearReadNotifications = useCallback(async () => {
    try {
      const result = await notificationService.clearReadNotifications();

      // Update local state - remove read notifications
      setNotifications(prev => prev.filter(notification => notification.status !== NotificationStatus.READ));

      // Update stats
      await refreshStats();

      showToast(`Đã xóa ${result.deleted} thông báo đã đọc`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear read notifications';
      console.error('Error clearing read notifications:', err);
      showToast('Không thể xóa thông báo đã đọc', 'error');
    }
  }, [refreshStats]);

  // Filter actions
  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const setStatusFilter = useCallback((status: NotificationStatus | undefined) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  }, []);

  const setTypeFilter = useCallback((type: NotificationType | undefined) => {
    setFilters(prev => ({ ...prev, type, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, limit: 20 });
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotifications();
    refreshStats();
  }, [fetchNotifications, refreshStats]);

  // Refetch when filters change
  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  return {
    // Data
    notifications,
    stats,
    loading,
    loadingMore,
    error,

    // Load more
    hasMore,
    total,
    unreadCount,

    // Filters
    filters,

    // Actions
    fetchNotifications,
    loadMore,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    refreshStats,

    // Filter actions
    setFilters,
    setStatusFilter,
    setTypeFilter,
    clearFilters,
  };
}
