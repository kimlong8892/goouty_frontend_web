import { useNotificationCountContext } from '../contexts/NotificationCountContext';

export interface UseNotificationCountReturn {
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  refreshCount: () => Promise<void>;
}

export function useNotificationCount(): UseNotificationCountReturn {
  const context = useNotificationCountContext();
  
  return {
    unreadCount: context.unreadCount,
    totalCount: context.totalCount,
    loading: context.loading,
    error: context.error,
    refreshCount: context.refreshCount,
  };
}
