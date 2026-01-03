import React from 'react';
import { useOfflineStatus } from '@/lib/offline/OfflineManager';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const SyncStatus: React.FC = () => {
    const { isOnline, pendingCount } = useOfflineStatus();

    if (isOnline && pendingCount === 0) {
        return null;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300",
                    !isOnline ? "bg-red-100 text-red-600 shadow-sm" : "bg-blue-100 text-blue-600 shadow-sm animate-pulse"
                )}>
                    {!isOnline ? <CloudOff size={16} /> : <RefreshCw size={16} className="animate-spin" />}
                    {pendingCount > 0 && <span className="text-xs font-bold">{pendingCount}</span>}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>
                    {!isOnline
                        ? `Đang ngoại tuyến. ${pendingCount} thay đổi chờ đồng bộ.`
                        : `Đang đồng bộ ${pendingCount} thay đổi...`}
                </p>
            </TooltipContent>
        </Tooltip>
    );
};
