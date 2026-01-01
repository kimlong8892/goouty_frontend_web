
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { googleAuthService, GoogleUser } from '@/services/googleAuth';

interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  loginWithGoogle: () => Promise<{ error: any }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing token in localStorage on load
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setAccessToken(storedToken);

      // Fetch user data using the token
      const fetchUserData = async () => {
        try {
          const userData = await api.get<User>('/users/profile');
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('accessToken');
          setAccessToken(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Listen for token changes in localStorage (for Google OAuth callback)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' && e.newValue && e.newValue !== accessToken) {
        setAccessToken(e.newValue);
        
        // Fetch user data with new token
        const fetchUserData = async () => {
          try {
            const userData = await api.get<User>('/users/profile');
            setUser(userData);
          } catch (error) {
            console.error('Error fetching user data:', error);
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setUser(null);
          }
        };

        fetchUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [accessToken]);

  // Listen for token updates (from Google OAuth callback)
  useEffect(() => {
    const handleTokenUpdate = async (event: CustomEvent) => {
      const { token } = event.detail;
      
      if (token && token !== accessToken) {
        setAccessToken(token);
        
        // Fetch user data with new token
        try {
          const userData = await api.get<User>('/users/profile');
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data after token update:', error);
          localStorage.removeItem('accessToken');
          setAccessToken(null);
          setUser(null);
        }
      }
    };

    window.addEventListener('tokenUpdated', handleTokenUpdate as EventListener);
    
    return () => {
      window.removeEventListener('tokenUpdated', handleTokenUpdate as EventListener);
    };
  }, [accessToken]);


  const login = async (email: string, password: string) => {
    try {
      const data = await api.post<User & { accessToken: string }>('/auth/login', {
        email,
        password
      });

      setUser({
        id: data.id,
        email: data.email,
        fullName: data.fullName
      });
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      await api.post('/auth/register', { email, password, fullName });
      return { error: null };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: error instanceof Error ? error.message : 'Registration failed' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      if (!googleAuthService.isAvailable()) {
        return { error: 'Google OAuth not configured' };
      }
      
      await googleAuthService.login();
      return { error: null };
    } catch (error) {
      console.error('Google login error:', error);
      return { error: error instanceof Error ? error.message : 'Google login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setAccessToken(null);
    setIsLoading(false);
    googleAuthService.signOut();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, accessToken, isLoading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
