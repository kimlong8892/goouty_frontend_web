import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { usePWA } from '@/pwa/hooks/usePWA';
import { usePWANotificationContext } from '@/pwa/contexts/PWANotificationContext';

interface PWAAlertNotificationProps {
  onClose?: () => void;
}

export function PWAAlertNotification({ onClose }: PWAAlertNotificationProps) {
  const { isPWA } = usePWA();
  const { alertNotification, hideAlertNotification } = usePWANotificationContext();
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (alertNotification) {
      setIsVisible(true);
      setDragOffset(0);
      // Auto hide after 8 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [alertNotification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      hideAlertNotification();
      onClose?.();
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    // Only allow upward swipe (negative deltaY)
    if (deltaY < 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // If dragged up more than 50px, close the notification
    if (dragOffset < -50) {
      handleClose();
    } else {
      // Snap back to original position
      setDragOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaY = e.clientY - startY;

    // Only allow upward swipe (negative deltaY)
    if (deltaY < 0) {
      setDragOffset(deltaY);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // If dragged up more than 50px, close the notification
    if (dragOffset < -50) {
      handleClose();
    } else {
      // Snap back to original position
      setDragOffset(0);
    }
  };

  // Add global mouse events for drag
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY;
        if (deltaY < 0) {
          setDragOffset(deltaY);
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        if (dragOffset < -50) {
          handleClose();
        } else {
          setDragOffset(0);
        }
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startY, dragOffset]);

  if (!isPWA || !alertNotification) return null;

  const getTypeStyles = () => {
    switch (alertNotification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (alertNotification.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getIconColor = () => {
    switch (alertNotification.type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 transform transition-all duration-300",
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    )}>
      <div
        ref={notificationRef}
        className={cn(
          "mx-4 mt-4 rounded-lg shadow-lg border-2 p-4 flex items-start gap-3 cursor-grab active:cursor-grabbing",
          getTypeStyles(),
          isDragging && "transition-none"
        )}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Icon */}
        <div className={cn("flex-shrink-0 mt-0.5", getIconColor())}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">
            {alertNotification.title}
          </h4>
          <p className="text-xs leading-relaxed opacity-90">
            {alertNotification.body}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Swipe indicator */}
      <div className="flex justify-center mt-2">
        <div className="w-8 h-1 bg-gray-300 rounded-full opacity-50"></div>
      </div>
    </div>
  );
}
