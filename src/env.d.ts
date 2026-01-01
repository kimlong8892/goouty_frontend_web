/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_URL: string;
  
  // Frontend Configuration
  readonly VITE_FRONTEND_URL: string;
  
  // Backend Configuration (for proxy)
  readonly VITE_BACKEND_URL: string;
  
  // Development
  readonly VITE_DEV_PORT: string;
  readonly NODE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
