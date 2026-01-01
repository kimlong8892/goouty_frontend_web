import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationStats } from '../types/notification';

interface NotificationCountContextType {
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  refreshCount: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationCountContext = createContext<NotificationCountContextType | undefined>(undefined);

export function NotificationCountProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await notificationService.getNotificationStats();
      setUnreadCount(stats.unread);
      setTotalCount(stats.total);
    } catch (err) {
      console.error('Error fetching notification count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notification count');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationService.markAsRead(notificationIds);

      // Update local count immediately for better UX
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));

      // Refresh from server to ensure accuracy
      await refreshCount();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      // Refresh count to get accurate state
      await refreshCount();
    }
  }, [refreshCount]);

  const markAsUnread = useCallback(async (id: string) => {
    try {
      await notificationService.markAsUnread(id);

      // Update local count
      setUnreadCount(prev => prev + 1);

      await refreshCount();
    } catch (err) {
      console.error('Error marking notification as unread:', err);
      await refreshCount();
    }
  }, [refreshCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllAsRead();

      // Update local count immediately
      setUnreadCount(0);

      // Refresh from server to ensure accuracy
      await refreshCount();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Refresh count to get accurate state
      await refreshCount();
    }
  }, [refreshCount]);

  // Initial load
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Set up interval to refresh count periodically
  useEffect(() => {
    const interval = setInterval(refreshCount, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshCount]);

  const value: NotificationCountContextType = {
    unreadCount,
    totalCount,
    loading,
    error,
    refreshCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
  };

  return (
    <NotificationCountContext.Provider value={value}>
      {children}
    </NotificationCountContext.Provider>
  );
}

export function useNotificationCountContext() {
  const context = useContext(NotificationCountContext);
  if (context === undefined) {
    throw new Error('useNotificationCountContext must be used within a NotificationCountProvider');
  }
  return context;
}
