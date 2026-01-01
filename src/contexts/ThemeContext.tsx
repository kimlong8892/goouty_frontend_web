
import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: Theme = 'light';

  useEffect(() => {
    // Always set light mode
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
    
    // Save the theme preference to localStorage
    localStorage.setItem('theme', 'light');
  }, []);

  const toggleTheme = () => {
    // No-op function - theme is always light
    console.log('Theme toggle disabled - using light mode only');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}
