import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plane,
  Banknote,
  CreditCard,
  RefreshCcw,
  Check,
  XCircle,
  Info,
  UserPlus
} from 'lucide-react';
import { usePWA } from '@/pwa/hooks/usePWA';
import { usePWANotificationContext } from '@/pwa/contexts/PWANotificationContext';

interface PWANotificationToastProps {
  onClose?: () => void;
}

export function PWANotificationToast({ onClose }: PWANotificationToastProps) {
  const { isPWA } = usePWA();
  const { notification, hideNotification } = usePWANotificationContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          hideNotification();
          onClose?.();
        }, 300); // Wait for animation to complete
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification, hideNotification, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      hideNotification();
      onClose?.();
    }, 300);
  };

  if (!isPWA || !notification) return null;

  const getNotificationStyle = () => {
    const type = notification.type?.toUpperCase();
    const isInvitation = notification.body?.toLowerCase().includes('mời');

    switch (type) {
      case 'TRIP_CREATED':
        return {
          icon: <Plane className="w-5 h-5 text-white" />,
          bgColor: "bg-blue-500",
          borderColor: "border-blue-500"
        };
      case 'TRIP_UPDATED':
        return {
          icon: <RefreshCcw className="w-5 h-5 text-white" />,
          bgColor: "bg-indigo-500",
          borderColor: "border-indigo-500"
        };
      case 'EXPENSE_ADDED':
        return {
          icon: <Banknote className="w-5 h-5 text-white" />,
          bgColor: "bg-emerald-500",
          borderColor: "border-emerald-500"
        };
      case 'EXPENSE_UPDATED':
        return {
          icon: <RefreshCcw className="w-5 h-5 text-white" />,
          bgColor: "bg-teal-500",
          borderColor: "border-teal-500"
        };
      case 'SETTLEMENT_CREATED':
        return {
          icon: <CreditCard className="w-5 h-5 text-white" />,
          bgColor: "bg-purple-500",
          borderColor: "border-purple-500"
        };
      case 'SYSTEM_ANNOUNCEMENT':
        return {
          icon: <Bell className="w-5 h-5 text-white fill-current" />,
          bgColor: "bg-orange-500",
          borderColor: "border-orange-500"
        };
      case 'SUCCESS':
        return {
          icon: <Check className="w-5 h-5 text-white" />,
          bgColor: "bg-green-500",
          borderColor: "border-green-500"
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-white" />,
          bgColor: "bg-amber-500",
          borderColor: "border-amber-500"
        };
      case 'ERROR':
        return {
          icon: <XCircle className="w-5 h-5 text-white" />,
          bgColor: "bg-red-500",
          borderColor: "border-red-500"
        };
      case 'INFO':
        return {
          icon: <Info className="w-5 h-5 text-white" />,
          bgColor: "bg-sky-500",
          borderColor: "border-sky-500"
        };
      default:
        if (isInvitation) {
          return {
            icon: <UserPlus className="w-5 h-5 text-white" />,
            bgColor: "bg-pink-500",
            borderColor: "border-pink-500"
          };
        }
        return {
          icon: <Bell className="w-5 h-5 text-white" />,
          bgColor: "bg-blue-500",
          borderColor: "border-blue-500"
        };
    }
  };

  const style = getNotificationStyle();

  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 z-50 transform transition-all duration-300",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      <div className={cn(
        "bg-white rounded-lg shadow-lg border-l-4 p-4 flex items-start gap-3",
        style.borderColor
      )}>
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
          style.bgColor
        )}>
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {notification.title}
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            {notification.body}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
