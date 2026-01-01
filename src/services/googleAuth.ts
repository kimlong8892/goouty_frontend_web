/**
 * Google OAuth Authentication Service
 * Handles Google OAuth login flow using Google Identity Services
 */

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private isInitialized = false;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    console.log("this.redirectUri", this.redirectUri);
  }

  /**
   * Initialize Google OAuth (no longer needed for redirect flow)
   */
  async initialize(): Promise<void> {
    // No initialization needed for redirect flow
    this.isInitialized = true;
  }


  /**
   * Trigger Google OAuth login
   */
  async login(): Promise<void> {
    if (!this.clientId) {
      throw new Error('Google Client ID not configured');
    }

    // Always use redirect flow (no popup)
    this.redirectToGoogle();
  }

  /**
   * Redirect to Google OAuth
   */
  private redirectToGoogle(): void {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = googleAuthUrl;
  }


  /**
   * Sign out from Google
   */
  signOut(): void {
    // For redirect flow, we just clear local state
    // Google sign out is handled by the backend
  }

  /**
   * Check if Google OAuth is available
   */
  isAvailable(): boolean {
    return !!this.clientId;
  }
}

// Global type declaration for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export const googleAuthService = new GoogleAuthService();
