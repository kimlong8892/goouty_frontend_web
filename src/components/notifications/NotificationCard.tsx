import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Notification,
  NOTIFICATION_TYPE_CONFIG,
  NOTIFICATION_STATUS_CONFIG,
  NotificationType,
  NotificationStatus
} from '../../types/notification';
import {
  Trash2,
  ExternalLink,
  Clock,
  MoreVertical,
  Check,
  Banknote,
  Plane,
  CreditCard,
  Bell,
  Info,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  showActions?: boolean;
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onArchive,
  showActions = true
}: NotificationCardProps) {
  const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type];
  const isUnread = notification.status?.toUpperCase() === 'UNREAD';

  const handleMarkAsRead = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsUnread = () => {
    if (!isUnread) {
      onMarkAsUnread(notification.id);
    }
  };

  const handleClick = () => {
    handleMarkAsRead();

    // Navigate to URL if available
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'Vừa xong';
      if (diffInHours < 24) return `${diffInHours}h`;

      return formatDistanceToNow(date, {
        addSuffix: false,
        locale: vi
      }).replace('khoảng ', '');
    } catch {
      return '—';
    }
  };

  // Get sender info from data or fallback
  const sender = notification.data?.sender || {
    fullName:
      notification.data?.context?.actionBy ||
      (notification.type === NotificationType.SYSTEM_ANNOUNCEMENT ? 'Goouty' :
        notification.title && !['Chuyến đi mới', 'Cập nhật chuyến đi', 'Chi phí mới', 'Cập nhật chi phí'].includes(notification.title)
          ? notification.title
          : 'Goouty'),
    profilePicture: notification.data?.sender?.profilePicture || null
  };

  const isInvitation = notification.type === NotificationType.TRIP_CREATED || notification.body.toLowerCase().includes('mời');

  // Map icons and colors based on type
  const getNotificationStyle = () => {
    switch (notification.type) {
      case NotificationType.TRIP_CREATED:
        return {
          icon: <Plane size={12} className="text-white fill-current" />,
          bgColor: "bg-blue-500"
        };
      case NotificationType.TRIP_UPDATED:
        return {
          icon: <RefreshCcw size={12} className="text-white" />,
          bgColor: "bg-indigo-500"
        };
      case NotificationType.EXPENSE_ADDED:
        return {
          icon: <Banknote size={12} className="text-white" />,
          bgColor: "bg-emerald-500"
        };
      case NotificationType.EXPENSE_UPDATED:
        return {
          icon: <RefreshCcw size={12} className="text-white" />,
          bgColor: "bg-teal-500"
        };
      case NotificationType.SETTLEMENT_CREATED:
        return {
          icon: <CreditCard size={12} className="text-white" />,
          bgColor: "bg-purple-500"
        };
      case NotificationType.SYSTEM_ANNOUNCEMENT:
        return {
          icon: <Bell size={12} className="text-white fill-current" />,
          bgColor: "bg-orange-500"
        };
      case NotificationType.SUCCESS:
        return {
          icon: <Check size={12} className="text-white" />,
          bgColor: "bg-green-500"
        };
      case NotificationType.WARNING:
        return {
          icon: <AlertTriangle size={12} className="text-white" />,
          bgColor: "bg-amber-500"
        };
      case NotificationType.ERROR:
        return {
          icon: <XCircle size={12} className="text-white" />,
          bgColor: "bg-red-500"
        };
      case NotificationType.INFO:
        return {
          icon: <Info size={12} className="text-white" />,
          bgColor: "bg-sky-500"
        };
      default:
        // Check for invitation in body if it's not a specific type
        if (isInvitation) {
          return {
            icon: <UserPlus size={12} className="text-white" />,
            bgColor: "bg-pink-500"
          };
        }
        return {
          icon: <Bell size={12} className="text-white" />,
          bgColor: "bg-gray-400"
        };
    }
  };

  const style = getNotificationStyle();

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-4 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-0",
        isUnread ? "bg-[#FFF8F8]" : "bg-white",
        "active:bg-gray-100"
      )}
      onClick={handleClick}
    >
      {/* Avatar Container */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
          {sender.profilePicture ? (
            <img src={sender.profilePicture} alt={sender.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
              {sender.fullName?.charAt(0).toUpperCase() || 'G'}
            </div>
          )}
        </div>

        {/* Type Icon Overlay */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm",
          style.bgColor
        )}>
          {style.icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-12">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <h4 className={cn(
              "text-[15px] leading-[1.5] text-gray-900",
              isUnread && "font-medium"
            )}>
              <span>{sender.fullName}</span> {notification.body}
            </h4>
            <span className="text-[13px] text-gray-500 mt-1 block">
              {formatDate(notification.createdAt)}
            </span>

            {/* Action Buttons for Invitations */}
            {isInvitation && !notification.data?.responded && (
              <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  className="bg-[#FF4D4C] hover:bg-[#FF3333] text-white rounded-full px-8 h-10 font-bold text-sm shadow-sm"
                  onClick={() => {/* Handle Accept */ }}
                >
                  Chấp nhận
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-[#E9ECEF] hover:bg-gray-200 text-[#495057] rounded-full px-8 h-10 font-bold text-sm"
                  onClick={() => {/* Handle Decline */ }}
                >
                  Từ chối
                </Button>
              </div>
            )}

            {/* Status if responded */}
            {notification.data?.responded && (
              <p className="text-[13px] text-gray-400 mt-2 font-medium">
                Bạn đã {notification.data?.response === 'accept' ? 'chấp nhận' : 'từ chối'} lời mời này.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* More Options Menu */}
      {showActions && (
        <div className="absolute top-4 right-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
                <MoreVertical size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {isUnread ? (
                <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                  <Check className="w-4 h-4 mr-2" /> Đánh dấu đã đọc
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onMarkAsUnread(notification.id)}>
                  <Bell className="w-4 h-4 mr-2" /> Đánh dấu chưa đọc
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
