/**
 * Environment variables configuration
 * Centralized place to manage all environment variables with fallbacks
 */

export const env = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // Frontend Configuration
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'),
  
  // Backend Configuration (for proxy)
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  
  // Development
  DEV_PORT: parseInt(import.meta.env.VITE_DEV_PORT) || 8080,
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // Computed properties
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
  
  get isProduction() {
    return this.NODE_ENV === 'production';
  },
} as const;

/**
 * Utility functions for environment-specific operations
 */
export const envUtils = {
  /**
   * Get the frontend URL for share links
   */
  getFrontendUrl(): string {
    return env.FRONTEND_URL;
  },
  
  /**
   * Get the API base URL
   */
  getApiBaseUrl(): string {
    return env.API_BASE_URL;
  },
  
  /**
   * Get the API URL (without /api prefix)
   */
  getApiUrl(): string {
    return env.API_URL;
  },
  
  /**
   * Generate share link for trip
   */
  generateTripShareLink(tripId: string, shareToken: string): string {
    return `${this.getFrontendUrl()}/trip/${tripId}/${shareToken}`;
  },
  
  /**
   * Generate trip detail link
   */
  generateTripDetailLink(tripId: number | string): string {
    return `${this.getFrontendUrl()}/trip/${tripId}`;
  },
  
  /**
   * Generate legacy trip link
   */
  generateLegacyTripLink(tripId: number | string): string {
    return `${this.getFrontendUrl()}/t/${tripId}`;
  },
} as const;
