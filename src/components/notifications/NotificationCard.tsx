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
import { usePWA } from '@/pwa/hooks/usePWA';
import {
  ClipboardList,
  Key,
  User,
  Ticket,
  Lock,
  CheckCircle2,
  Wallet,
  Tag,
  MapPin,
  MessageSquare,
  AlertCircle,
  Megaphone,
  ShoppingBag,
  Car
} from 'lucide-react';

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
  const { isPWA } = usePWA();
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
        return {
          icon: <Bell size={12} className="text-white" />,
          bgColor: "bg-gray-400"
        };
    }
  };

  const getPWAStyle = () => {
    const bodyLower = notification.body.toLowerCase();
    const titleLower = (notification.title || "").toLowerCase();

    // Default PWA style properties
    const pwaBgColor = "bg-[#F5F3FF]";
    const pwaIconColor = "text-primary";
    const iconSize = 22;

    // 1. Trip Invitations (Highest Priority)
    if (isInvitation ||
      bodyLower.includes('mời') || titleLower.includes('mời') ||
      bodyLower.includes('lời mời') || titleLower.includes('lời mời')) {
      return {
        icon: <UserPlus size={iconSize} className={pwaIconColor} />,
        bgColor: pwaBgColor
      };
    }

    // 2. Payments & Settlements (Specific Keywords)
    if (notification.type === NotificationType.SETTLEMENT_CREATED ||
      bodyLower.includes('thanh toán') || titleLower.includes('thanh toán') ||
      bodyLower.includes('payment') || bodyLower.includes('card')) {
      return {
        icon: <CreditCard size={iconSize} className={pwaIconColor} />,
        bgColor: pwaBgColor
      };
    }

    // 3. Expenses (Specific Keywords)
    if (notification.type === NotificationType.EXPENSE_ADDED ||
      notification.type === NotificationType.EXPENSE_UPDATED ||
      bodyLower.includes('chi phí') || titleLower.includes('chi phí') ||
      bodyLower.includes('expense')) {
      return {
        icon: <Banknote size={iconSize} className={pwaIconColor} />,
        bgColor: pwaBgColor
      };
    }

    // 4. Trips & Booking (General Trip related)
    if (notification.type === NotificationType.TRIP_CREATED ||
      notification.type === NotificationType.TRIP_UPDATED ||
      notification.type === NotificationType.TRIP_DELETED ||
      bodyLower.includes('booking') || titleLower.includes('chuyến đi') || titleLower.includes('trip')) {
      return {
        icon: <Car size={iconSize} className={pwaIconColor} />,
        bgColor: pwaBgColor
      };
    }

    // 5. Security & System
    if (bodyLower.includes('password') || titleLower.includes('password')) {
      return { icon: <Lock size={iconSize} className={pwaIconColor} />, bgColor: pwaBgColor };
    }

    // Default Fallback
    return {
      icon: <Bell size={iconSize} className={pwaIconColor} />,
      bgColor: pwaBgColor
    };
  };

  const style = isPWA ? getPWAStyle() : getNotificationStyle();

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-5 transition-all duration-200 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0",
        isUnread
          ? (isPWA
            ? "bg-[#F8FAFF] dark:bg-blue-900/20"
            : "bg-[#FFF8F8] hover:bg-[#FFF0F0] dark:bg-blue-900/30 dark:hover:bg-blue-900/50")
          : "bg-white hover:bg-gray-50 dark:bg-card dark:hover:bg-gray-800/50",
        "active:bg-gray-100 dark:active:bg-gray-800"
      )}
      onClick={handleClick}
    >
      {/* Icon Container */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
          style.bgColor
        )}>
          {style.icon}
        </div>
        {/* Unread Dot for PWA */}
        {isPWA && isUnread && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex flex-col gap-0.5">
          <h4 className={cn(
            "text-[16px] leading-tight text-gray-900 dark:text-gray-100 font-bold",
            isUnread && "text-blue-600 dark:text-blue-400"
          )}>
            {notification.title || sender.fullName}
          </h4>
          <p className={cn(
            "text-[14px] leading-snug text-gray-500 dark:text-gray-400",
            isUnread && "text-gray-900 dark:text-gray-200"
          )}>
            {notification.body}
          </p>

          {/* Action Buttons for Invitations (Keep these for functionality) */}
          {isInvitation && !notification.data?.responded && (
            <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="bg-[#FF4D4C] hover:bg-[#FF3333] text-white rounded-full px-6 h-9 font-bold text-xs shadow-sm dark:bg-red-600 dark:hover:bg-red-700"
                onClick={() => {/* Handle Accept */ }}
              >
                Chấp nhận
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-[#E9ECEF] hover:bg-gray-200 text-[#495057] rounded-full px-6 h-9 font-bold text-xs dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => {/* Handle Decline */ }}
              >
                Từ chối
              </Button>
            </div>
          )}

          {/* Status if responded */}
          {notification.data?.responded && (
            <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
              Bạn đã {notification.data?.response === 'accept' ? 'chấp nhận' : 'từ chối'} lời mời này.
            </p>
          )}

          {!isPWA && (
            <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 block">
              {formatDate(notification.createdAt)}
            </span>
          )}
        </div>
      </div>

      {/* More Options Menu */}
      {showActions && (
        <div className="absolute top-5 right-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <MoreVertical size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl dark:bg-gray-900 dark:border-gray-800">
              {isUnread ? (
                <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)} className="dark:focus:bg-gray-800">
                  <Check className="w-4 h-4 mr-2" /> Đánh dấu đã đọc
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onMarkAsUnread(notification.id)} className="dark:focus:bg-gray-800">
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
