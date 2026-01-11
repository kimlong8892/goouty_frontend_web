import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationCountContext } from '../contexts/NotificationCountContext';
import { NotificationList } from '../components/notifications/NotificationList';
import { NotificationTabs, NOTIFICATION_TABS, getTabCounts } from '../components/notifications/NotificationTabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  RefreshCw,
  Plus,
  MoreVertical,
  CheckCircle2,
  Trash2,
  ChevronLeft
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationService } from '../services/notificationService';
import { NotificationType, NotificationStatus } from '../types/notification';
import { cn } from '@/lib/utils';
import { useGlobalToast } from '../utils/globalToast';
import { usePWA } from '@/pwa/hooks/usePWA';

function NotificationsPage() {
  const { showToast } = useGlobalToast();
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;
  const {
    notifications,
    stats,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    unreadCount,
    filters,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    refreshStats,
    setStatusFilter,
    setTypeFilter,
    clearFilters,
    setFilters,
  } = useNotifications();

  // Set initial limit to 5 for notifications page
  React.useEffect(() => {
    setFilters({ page: 1, limit: 5 });
  }, [setFilters]);

  // Use notification count context to refresh navbar
  const { markAsRead: markAsReadContext, markAsUnread: markAsUnreadContext, markAllAsRead: markAllAsReadContext } = useNotificationCountContext();

  const [activeTab, setActiveTab] = React.useState('all');

  // Infinite scroll for Mobile/PWA
  React.useEffect(() => {
    if (!isMobileView || !hasMore || loadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

      // Load more when user scrolls to bottom (with 100px threshold)
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileView, hasMore, loadingMore, loadMore]);

  const handleMarkAsRead = async (id: string) => {
    // Use context method for immediate UI update
    await markAsReadContext([id]);
    // Also update local notifications state
    await markAsRead([id]);
  };

  const handleMarkAsUnread = async (id: string) => {
    // Use context method for immediate UI update
    await markAsUnreadContext(id);
    // Also update local notifications state
    await markAsUnread(id);
  };

  const handleMarkAllAsRead = async () => {
    // Use context method for immediate UI update
    await markAllAsReadContext();
    // Also update local notifications state
    await markAllAsRead();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleClearRead = async () => {
    await clearReadNotifications();
  };

  const handleRefresh = async () => {
    await fetchNotifications();
    await refreshStats();
  };

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    // Apply filters based on tab
    const tab = NOTIFICATION_TABS.find(t => t.id === tabId);
    if (!tab) return;

    if (tabId === 'all') {
      // Show all notifications
      setFilters({ page: 1, limit: 5, status: undefined, type: undefined });
    } else if (tab.status) {
      // Filter by status
      setFilters({ page: 1, limit: 5, status: tab.status.toUpperCase() as NotificationStatus, type: undefined });
    } else if (tab.type) {
      // Filter by type - for trip and expense tabs, we need to handle multiple types
      if (tabId === 'trips') {
        // For trips tab, we'll filter on the frontend since backend doesn't support multiple types
        setFilters({ page: 1, limit: 50, status: undefined, type: undefined });
      } else if (tabId === 'expenses') {
        // For expenses tab, we'll filter on the frontend since backend doesn't support multiple types
        setFilters({ page: 1, limit: 50, status: undefined, type: undefined });
      } else {
        setFilters({ page: 1, limit: 5, status: undefined, type: tab.type });
      }
    }
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (activeTab === 'all') {
      return notifications;
    }

    const tab = NOTIFICATION_TABS.find(t => t.id === activeTab);
    if (!tab) return notifications;

    if (tab.status) {
      return notifications.filter(n => n.status === tab.status!.toUpperCase());
    } else if (tab.type) {
      if (activeTab === 'trips') {
        return notifications.filter(n =>
          n.type === NotificationType.TRIP_CREATED ||
          n.type === NotificationType.TRIP_UPDATED ||
          n.type === NotificationType.TRIP_DELETED
        );
      } else if (activeTab === 'expenses') {
        return notifications.filter(n =>
          n.type === NotificationType.EXPENSE_ADDED ||
          n.type === NotificationType.EXPENSE_UPDATED ||
          n.type === NotificationType.SETTLEMENT_CREATED
        );
      } else {
        return notifications.filter(n => n.type === tab.type);
      }
    }

    return notifications;
  };

  const handleCreateTestNotification = async () => {
    try {
      // Tạo notification test để gửi qua queue system-notifications
      const testNotification = {
        title: 'Thông báo test từ Frontend',
        message: 'Đây là thông báo test được tạo từ frontend và sẽ được lưu vào database',
        type: 'system_announcement',
        context: {
          message: 'Đây là thông báo test được tạo từ frontend và sẽ được lưu vào database',
          createdAt: new Date().toLocaleString('vi-VN'),
          test: true,
          timestamp: Date.now(),
        },
        options: {
          skipEmail: false,
          skipPush: false,
        }
      };

      // Gọi API để gửi thông báo qua queue system-notifications
      const response = await fetch('/api/notifications/system-announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: testNotification.message,
          options: testNotification.options,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      const result = await response.json();

      showToast(
        `Đã gửi vào queue system-notifications! Job ID: ${result.jobId || 'N/A'}`,
        'success'
      );

      // Refresh notifications list
      await fetchNotifications();
      await refreshStats();
    } catch (error) {
      console.error('Error creating test notification:', error);
      showToast('Không thể tạo thông báo test', 'error');
    }
  };

  // Get tab counts
  const tabCounts = getTabCounts(stats, notifications);
  const tabsWithCounts = NOTIFICATION_TABS.map(tab => ({
    ...tab,
    count: tabCounts[tab.id] || 0
  }));

  // Get filtered notifications
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className={cn(
      "min-h-screen bg-white dark:bg-background", // Change to white as per image
      isMobileView ? "pb-20" : ""
    )}>
      {/* Horizontal Tabs - Hide on Mobile */}
      {!isMobileView && (
        <NotificationTabs
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onMarkAllAsRead={handleMarkAllAsRead}
          className="sticky top-0 z-50 bg-white dark:bg-card"
        />
      )}

      {/* Mobile Special Header */}
      {isMobileView && (
        <div className="px-4 py-4 flex items-center bg-white dark:bg-card sticky top-0 z-40 border-b border-gray-100 dark:border-border transition-colors">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-foreground" />
          </Button>
          <h1 className="flex-1 text-center text-xl font-bold text-[#1A1D1F] dark:text-foreground">Thông báo</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-secondary-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl dark:bg-popover dark:border-border">
              <DropdownMenuItem
                onClick={handleMarkAllAsRead}
                className="focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-100 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 mr-2 text-gray-500" />
                Đánh dấu tất cả đã đọc
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleRefresh}
                className="focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-100 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2 text-gray-500" />
                Làm mới
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "pb-12 px-0", // Remove padding-x for mobile to have full-width dividers
        !isMobileView && "pt-4 px-4"
      )}>
        <div className="max-w-6xl mx-auto">
          {/* Notifications List */}
          <NotificationList
            notifications={filteredNotifications}
            loading={loading}
            error={error}
            onMarkAsRead={handleMarkAsRead}
            onMarkAsUnread={handleMarkAsUnread}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearRead={handleClearRead}
            showActions={true}
          />

          {/* Load More Button - Only for Desktop Web mode */}
          {!isMobileView && hasMore && (
            <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border-0 mt-4">
              <Button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-primary dark:hover:bg-primary/90"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Xem thêm 5 thông báo
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Mobile/PWA Loading Indicator */}
          {isMobileView && hasMore && loadingMore && (
            <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border-0 mt-2">
              <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-muted-foreground py-4">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Đang tải thêm...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;