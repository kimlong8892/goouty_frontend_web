import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Bell, X, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
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

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-500';
      case 'warning':
        return 'border-yellow-500';
      case 'error':
        return 'border-red-500';
      default:
        return 'border-blue-500';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 z-50 transform transition-all duration-300",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      <div className={cn(
        "bg-white rounded-lg shadow-lg border-l-4 p-4 flex items-start gap-3",
        getTypeStyles()
      )}>
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
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
