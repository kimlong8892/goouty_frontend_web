import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      // Check if running in PWA mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      // Additional checks for PWA
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppSafari = (window.navigator as any).standalone === true;
      
      const detected = isStandalone || isIOSStandalone || isInWebAppiOS || isInWebAppChrome || isInWebAppSafari;
      
      console.log('[usePWA] PWA Detection:', {
        isStandalone,
        isIOSStandalone,
        isInWebAppiOS,
        isInWebAppChrome,
        isInWebAppSafari,
        detected,
        userAgent: navigator.userAgent,
        displayMode: window.matchMedia('(display-mode: standalone)').matches
      });
      
      setIsPWA(detected);
    };

    // Check immediately
    checkPWA();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      console.log('[usePWA] Display mode changed');
      checkPWA();
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      (mediaQuery as any).addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        (mediaQuery as any).removeListener(handleChange);
      }
    };
  }, []);

  return { isPWA };
};
