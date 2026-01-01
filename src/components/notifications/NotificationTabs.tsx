import React from 'react';
import { cn } from '@/lib/utils';
import { NotificationType } from '../../types/notification';
import { Check, Circle } from 'lucide-react';
import { usePWA } from '@/pwa/hooks/usePWA';

// Custom icon component for mark all as read
const MarkAllAsReadIcon = () => (
  <div className="flex flex-col items-center gap-0">
    <div className="flex items-center gap-0.5">
      <Check className="w-1.5 h-1.5 text-gray-600" />
      <div className="w-2 h-0.5 bg-gray-600"></div>
    </div>
    <div className="flex items-center gap-0.5">
      <Check className="w-1.5 h-1.5 text-gray-600" />
      <div className="w-2 h-0.5 bg-gray-600"></div>
    </div>
    <div className="flex items-center gap-0.5">
      <Circle className="w-1.5 h-1.5 text-gray-600 fill-gray-600" />
      <div className="w-2 h-0.5 bg-gray-600"></div>
    </div>
  </div>
);

export interface NotificationTab {
  id: string;
  label: string;
  type?: NotificationType;
  status?: 'unread' | 'read' | 'archived';
  count?: number;
}

interface NotificationTabsProps {
  tabs: NotificationTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onMarkAllAsRead?: () => void;
  className?: string;
}

export function NotificationTabs({
  tabs,
  activeTab,
  onTabChange,
  onMarkAllAsRead,
  className
}: NotificationTabsProps) {
  const { isPWA } = usePWA();

  // WEB Layout - centered tabs with text button
  if (!isPWA) {
    return (
      <div className={cn("w-full", className)}>
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center py-3">
              {/* Centered Tabs */}
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-0 whitespace-nowrap",
                      "active:bg-blue-600 active:text-white active:scale-95",
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium min-w-[20px] text-center",
                          activeTab === tab.id
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-600"
                        )}>
                          {tab.count}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {/* Mark all as read button - Text version for WEB */}
              {onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="ml-4 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PWA Layout - original design
  return (
    <div className={cn("w-full", className)}>
      {/* Horizontal scrollable tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Tabs */}
            <div className="flex overflow-x-auto scrollbar-hide gap-1 flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-0 whitespace-nowrap",
                    "active:bg-blue-600 active:text-white active:scale-95",
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium min-w-[20px] text-center",
                        activeTab === tab.id
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-600"
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Mark all as read button */}
            {onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                className="flex-shrink-0 ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
                title="Đánh dấu tất cả đã đọc"
              >
                <MarkAllAsReadIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Predefined tabs for notifications
export const NOTIFICATION_TABS: NotificationTab[] = [
  {
    id: 'all',
    label: 'Tất cả',
  },
  {
    id: 'trips',
    label: 'Chuyến đi',
    type: NotificationType.TRIP_CREATED,
  },
  {
    id: 'expenses',
    label: 'Chi phí',
    type: NotificationType.EXPENSE_ADDED,
  },
  {
    id: 'system',
    label: 'Hệ thống',
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
  },
  {
    id: 'unread',
    label: 'Chưa đọc',
    status: 'unread',
  },
];

// Helper function to get tab counts from stats
export function getTabCounts(stats: any, notifications: any[]): Record<string, number> {
  if (!stats) return {};

  const counts: Record<string, number> = {
    all: stats.total || 0,
    unread: stats.unread || 0,
  };

  // Count by type
  if (stats.byType) {
    counts.trips = (stats.byType[NotificationType.TRIP_CREATED] || 0) +
      (stats.byType[NotificationType.TRIP_UPDATED] || 0) +
      (stats.byType[NotificationType.TRIP_DELETED] || 0);
    counts.expenses = (stats.byType[NotificationType.EXPENSE_ADDED] || 0) +
      (stats.byType[NotificationType.EXPENSE_UPDATED] || 0) +
      (stats.byType[NotificationType.SETTLEMENT_CREATED] || 0);
    counts.system = stats.byType[NotificationType.SYSTEM_ANNOUNCEMENT] || 0;
  }

  return counts;
}
