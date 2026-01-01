import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  NotificationType, 
  NotificationStatus, 
  NOTIFICATION_TYPE_CONFIG, 
  NOTIFICATION_STATUS_CONFIG 
} from '../../types/notification';
import { Filter, X, CheckCircle, Circle, Bell } from 'lucide-react';

interface NotificationFiltersProps {
  statusFilter?: NotificationStatus;
  typeFilter?: NotificationType;
  onStatusChange: (status: NotificationStatus | undefined) => void;
  onTypeChange: (type: NotificationType | undefined) => void;
  onClearFilters: () => void;
  stats?: {
    total: number;
    unread: number;
    read: number;
    archived: number;
  } | null;
}

export function NotificationFilters({
  statusFilter,
  typeFilter,
  onStatusChange,
  onTypeChange,
  onClearFilters,
  stats
}: NotificationFiltersProps) {
  const hasActiveFilters = statusFilter || typeFilter;

  return (
    <div className="space-y-4">
      {/* Stats Overview - Mobile friendly */}
      {stats && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="text-xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-blue-600 font-medium">Tổng cộng</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <div className="text-xl font-bold text-orange-600">{stats.unread}</div>
                <div className="text-xs text-orange-600 font-medium">Chưa đọc</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <div className="text-xl font-bold text-green-600">{stats.read}</div>
                <div className="text-xs text-green-600 font-medium">Đã đọc</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold text-gray-600">{stats.archived}</div>
                <div className="text-xs text-gray-600 font-medium">Lưu trữ</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Bộ lọc</h3>
          </div>

          <div className="space-y-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Trạng thái</label>
              <Select 
                value={statusFilter || 'all'} 
                onValueChange={(value) => onStatusChange(value === 'all' ? undefined : value as NotificationStatus)}
              >
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4" />
                      Tất cả
                    </div>
                  </SelectItem>
                  {Object.values(NotificationStatus).map((status) => {
                    const config = NOTIFICATION_STATUS_CONFIG[status];
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Loại thông báo</label>
              <Select 
                value={typeFilter || 'all'} 
                onValueChange={(value) => onTypeChange(value === 'all' ? undefined : value as NotificationType)}
              >
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Chọn loại thông báo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Tất cả
                    </div>
                  </SelectItem>
                  {Object.values(NotificationType).map((type) => {
                    const config = NOTIFICATION_TYPE_CONFIG[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {hasActiveFilters && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Bộ lọc đang áp dụng</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                Xóa tất cả
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {statusFilter && (
                <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  <div className={`w-2 h-2 rounded-full ${NOTIFICATION_STATUS_CONFIG[statusFilter].dot}`} />
                  {NOTIFICATION_STATUS_CONFIG[statusFilter].label}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onStatusChange(undefined)}
                    className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              
              {typeFilter && (
                <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  <span>{NOTIFICATION_TYPE_CONFIG[typeFilter].icon}</span>
                  {NOTIFICATION_TYPE_CONFIG[typeFilter].label}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onTypeChange(undefined)}
                    className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
