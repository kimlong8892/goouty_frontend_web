import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PWANotification {
  title: string;
  body: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface PWANotificationContextType {
  notification: PWANotification | null;
  alertNotification: PWANotification | null;
  showNotification: (title: string, body: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  showAlertNotification: (title: string, body: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  hideNotification: () => void;
  hideAlertNotification: () => void;
}

const PWANotificationContext = createContext<PWANotificationContextType | undefined>(undefined);

export function PWANotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<PWANotification | null>(null);
  const [alertNotification, setAlertNotification] = useState<PWANotification | null>(null);

  const showNotification = (title: string, body: string, type?: 'info' | 'success' | 'warning' | 'error') => {
    setNotification({ title, body, type });
  };

  const showAlertNotification = (title: string, body: string, type?: 'info' | 'success' | 'warning' | 'error') => {
    setAlertNotification({ title, body, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const hideAlertNotification = () => {
    setAlertNotification(null);
  };

  return (
    <PWANotificationContext.Provider value={{ 
      notification, 
      alertNotification,
      showNotification, 
      showAlertNotification,
      hideNotification, 
      hideAlertNotification 
    }}>
      {children}
    </PWANotificationContext.Provider>
  );
}

export function usePWANotificationContext() {
  const context = useContext(PWANotificationContext);
  if (context === undefined) {
    throw new Error('usePWANotificationContext must be used within a PWANotificationProvider');
  }
  return context;
}