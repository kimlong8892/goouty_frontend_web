import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Clock,
  Plane,
  Banknote,
  CreditCard,
  RefreshCcw,
  Check,
  AlertTriangle,
  XCircle,
  Info,
  UserPlus
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType } from '../../types/notification';
import { useNotificationCountContext } from '../../contexts/NotificationCountContext';
import { Notification, NotificationStatus } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Use notification count context for navbar
  const { unreadCount, markAsRead: markAsReadContext, markAllAsRead: markAllAsReadContext } = useNotificationCountContext();

  // Use notifications hook for dropdown content
  const {
    notifications,
    loading,
    loadingMore,
    hasMore,
    markAsRead,
    loadMore,
    refreshStats,
    fetchNotifications
  } = useNotifications();

  // Load notifications when dropdown opens (ban đầu chỉ 3)
  useEffect(() => {
    if (isOpen && !isMobile) {
      // Set limit to 3 for initial load
      fetchNotifications({ page: 1, limit: 3 });
    }
  }, [isOpen, isMobile, fetchNotifications]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lấy notifications để hiển thị trong dropdown (ban đầu chỉ 3, cuộn thì load thêm)
  const displayNotifications = notifications;

  const handleMarkAsRead = async (notificationId: string) => {
    // Use context method for immediate UI update
    await markAsReadContext([notificationId]);
    // Also update local notifications state
    await markAsRead([notificationId]);
    await refreshStats();
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => n.status === NotificationStatus.UNREAD)
      .map(n => n.id);

    if (unreadIds.length > 0) {
      // Use context method for immediate UI update
      await markAllAsReadContext();
      // Also update local notifications state
      await markAsRead(unreadIds);
      await refreshStats();
    }
  };

  // Handle scroll to load more notifications
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Load more when user scrolls to bottom (with 20px threshold)
    if (scrollTop + clientHeight >= scrollHeight - 20 && hasMore && !loadingMore) {
      console.log('Loading more notifications...');
      loadMore();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: vi
      });
    } catch {
      return 'Không xác định';
    }
  };

  const getNotificationStyle = (notification: Notification) => {
    const isInvitation = notification.type === NotificationType.TRIP_CREATED || notification.body.toLowerCase().includes('mời');

    switch (notification.type) {
      case NotificationType.TRIP_CREATED:
        return {
          icon: <Plane size={14} className="text-white fill-current" />,
          bgColor: "bg-blue-500"
        };
      case NotificationType.TRIP_UPDATED:
        return {
          icon: <RefreshCcw size={14} className="text-white" />,
          bgColor: "bg-indigo-500"
        };
      case NotificationType.EXPENSE_ADDED:
        return {
          icon: <Banknote size={14} className="text-white" />,
          bgColor: "bg-emerald-500"
        };
      case NotificationType.EXPENSE_UPDATED:
        return {
          icon: <RefreshCcw size={14} className="text-white" />,
          bgColor: "bg-teal-500"
        };
      case NotificationType.SETTLEMENT_CREATED:
        return {
          icon: <CreditCard size={14} className="text-white" />,
          bgColor: "bg-purple-500"
        };
      case NotificationType.SYSTEM_ANNOUNCEMENT:
        return {
          icon: <Bell size={14} className="text-white fill-current" />,
          bgColor: "bg-orange-500"
        };
      case NotificationType.SUCCESS:
        return {
          icon: <Check size={14} className="text-white" />,
          bgColor: "bg-green-500"
        };
      case NotificationType.WARNING:
        return {
          icon: <AlertTriangle size={14} className="text-white" />,
          bgColor: "bg-amber-500"
        };
      case NotificationType.ERROR:
        return {
          icon: <XCircle size={14} className="text-white" />,
          bgColor: "bg-red-500"
        };
      case NotificationType.INFO:
        return {
          icon: <Info size={14} className="text-white" />,
          bgColor: "bg-sky-500"
        };
      default:
        if (isInvitation) {
          return {
            icon: <UserPlus size={14} className="text-white" />,
            bgColor: "bg-pink-500"
          };
        }
        return {
          icon: <Bell size={14} className="text-white" />,
          bgColor: "bg-gray-400"
        };
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === NotificationStatus.UNREAD) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to URL if available
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }

    setIsOpen(false);
  };

  // Handle mobile click - navigate directly to notifications page
  const handleMobileClick = () => {
    navigate('/notifications');
  };

  // On mobile, show simple button that navigates to notifications page
  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
        onClick={handleMobileClick}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
    );
  }

  // On desktop, show dropdown menu
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-96 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Thông báo
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAllAsRead();
              }}
              className={`text-sm font-medium transition-colors ${unreadCount > 0
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-gray-400 cursor-not-allowed'
                }`}
              disabled={unreadCount === 0}
            >
              Đánh dấu đã đọc
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto max-h-80" onScroll={handleScroll}>
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm">Đang tải...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium">Chưa có thông báo</p>
              <p className="text-xs text-gray-400 mt-1">Khi có thông báo mới, chúng sẽ xuất hiện ở đây</p>
            </div>
          ) : (
            <div className="py-1">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${notification.status === NotificationStatus.UNREAD ? 'bg-[#FFF8F8]' : ''
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm relative ${getNotificationStyle(notification).bgColor
                      }`}>
                      {getNotificationStyle(notification).icon}

                      {/* Unread dot */}
                      {notification.status === NotificationStatus.UNREAD && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h4 className={`text-sm font-semibold leading-tight mb-1 ${notification.status === NotificationStatus.UNREAD ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                        {notification.title}
                      </h4>

                      {/* Body */}
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">
                        {notification.body}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="p-3 text-center text-gray-500">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-1"></div>
                  <p className="text-xs">Đang tải thêm...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Only show on mobile */}
        {isMobile && (
          <div className="p-3 border-t border-gray-100 bg-white">
            <DropdownMenuItem asChild>
              <Link
                to="/notifications"
                className="flex items-center justify-center p-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                Xem tất cả thông báo
              </Link>
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
