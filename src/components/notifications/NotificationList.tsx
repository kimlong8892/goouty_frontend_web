import React from 'react';
import { NotificationCard } from './NotificationCard';
import { Notification } from '../../types/notification';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Archive,
  Bell
} from 'lucide-react';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onRefresh: () => void;
  onMarkAllAsRead?: () => void;
  onClearRead?: () => void;
  showActions?: boolean;
}

export function NotificationList({
  notifications,
  loading,
  error,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onArchive,
  onRefresh,
  onMarkAllAsRead,
  onClearRead,
  showActions = true
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-card rounded-xl p-4 border-0 shadow-sm">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full dark:bg-gray-800" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 dark:bg-gray-800" />
                <Skeleton className="h-3 w-1/2 dark:bg-gray-800" />
                <Skeleton className="h-3 w-1/4 dark:bg-gray-800" />
              </div>
              <Skeleton className="w-8 h-8 rounded dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">Có lỗi xảy ra</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Chưa có thông báo
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
          Khi có thông báo mới, chúng sẽ xuất hiện ở đây để bạn có thể xem lại.
        </p>
        <Button
          variant="outline"
          onClick={onRefresh}
          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>
    );
  }

  // Group notifications
  const groupNotifications = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const categories: { [key: string]: Notification[] } = {
      'Hôm nay': [],
      'Hôm qua': [],
      'Trước đó': []
    };

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        categories['Hôm nay'].push(notification);
      } else if (date.getTime() === yesterday.getTime()) {
        categories['Hôm qua'].push(notification);
      } else {
        categories['Trước đó'].push(notification);
      }
    });

    return categories;
  };

  const categories = groupNotifications();

  return (
    <div className="bg-white dark:bg-card overflow-hidden">
      {Object.entries(categories).map(([category, items]) => (
        items.length > 0 && (
          <div key={category} className="mb-2">
            <div className="px-5 pt-8 pb-3 bg-transparent border-0">
              <h3 className="text-[18px] font-bold text-[#1A1D1F] dark:text-gray-100">{category}</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAsUnread={onMarkAsUnread}
                  onDelete={onDelete}
                  onArchive={onArchive}
                  showActions={showActions}
                />
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
