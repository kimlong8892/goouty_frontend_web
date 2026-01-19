import { useState, useEffect } from 'react';

export const useAppLoading = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Detect PWA mode
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsPWA(isPWAMode);

    if (!isPWAMode) {
      // Web mode - no loading screen
      setIsLoading(false);
      return;
    }

    // PWA mode - immediate loading
    setIsLoading(false);
  }, []);

  return { isLoading, isPWA };
};