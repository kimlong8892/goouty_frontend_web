# Environment Variables Setup

## Tạo file .env

Tạo file `.env` trong thư mục frontend với nội dung sau:

```env
# API Configuration
VITE_API_BASE_URL=/api
VITE_API_URL=http://localhost:3000

# Frontend Configuration  
VITE_FRONTEND_URL=http://localhost:8080

# Backend Configuration (for proxy)
VITE_BACKEND_URL=http://localhost:3000

# Development
VITE_DEV_PORT=8080
NODE_ENV=development

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
```

## Production Environment

Cho production, cập nhật các values tương ứng:

```env
# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_API_URL=https://your-api-domain.com

# Frontend Configuration  
VITE_FRONTEND_URL=https://your-frontend-domain.com

# Backend Configuration (for proxy)
VITE_BACKEND_URL=https://your-api-domain.com

# Production
NODE_ENV=production

# Google OAuth Configuration (Production)
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=https://your-frontend-domain.com/auth/google/callback
```

## Environment Variables được sử dụng

### VITE_API_BASE_URL
- **Mục đích**: Base URL cho API calls (với /api prefix)
- **Sử dụng trong**: `src/lib/api.ts`
- **Mặc định**: `http://localhost:3000/api`

### VITE_API_URL  
- **Mục đích**: Base URL cho legacy API client
- **Sử dụng trong**: `src/integrations/api/client.ts`
- **Mặc định**: `http://localhost:3000`

### VITE_FRONTEND_URL
- **Mục đích**: Frontend URL cho share links
- **Sử dụng trong**: 
  - `src/components/ShareLinkManager.tsx`
  - `src/pages/MyTripsPage.tsx`
  - `src/pages/TripDetailsPage.tsx`
- **Mặc định**: `window.location.origin`

### VITE_BACKEND_URL
- **Mục đích**: Backend URL cho Vite proxy
- **Sử dụng trong**: `vite.config.ts`
- **Mặc định**: `http://localhost:3000`

### VITE_DEV_PORT
- **Mục đích**: Port cho development server
- **Sử dụng trong**: `vite.config.ts`
- **Mặc định**: `8080`

### VITE_GOOGLE_CLIENT_ID
- **Mục đích**: Google OAuth Client ID cho authentication
- **Sử dụng trong**: 
  - `src/services/googleAuth.ts`
  - `src/contexts/AuthContext.tsx`
- **Lấy từ**: [Google Cloud Console](https://console.cloud.google.com/)

### VITE_GOOGLE_REDIRECT_URI
- **Mục đích**: Redirect URI cho Google OAuth callback (Google sẽ redirect về frontend)
- **Sử dụng trong**: 
  - `src/services/googleAuth.ts`
  - Google OAuth configuration
- **Mặc định**: `http://localhost:8080/auth/google/callback` (dev), `https://your-domain.com/auth/google/callback` (prod)
- **Lưu ý**: Google sẽ redirect về frontend, frontend sẽ xử lý và gọi backend `/auth/google`

## Lưu ý

1. **File .env không được commit vào git** (đã có trong .gitignore)
2. **Tất cả Vite env vars phải có prefix `VITE_`** để được expose cho client
3. **Restart dev server** sau khi thay đổi env vars
4. **Sử dụng fallback values** để tránh lỗi khi không có env vars

## Docker Environment

Khi sử dụng Docker, có thể pass env vars qua docker-compose.yml:

```yaml
services:
  frontend:
    build: .
    environment:
      - VITE_API_BASE_URL=http://backend:3000/api
      - VITE_FRONTEND_URL=http://localhost:8080
      - VITE_BACKEND_URL=http://backend:3000
```

## SPA Routing Configuration

### Development
Vite dev server đã được cấu hình với `historyApiFallback: true` để handle client-side routing.

### Production Deployment

#### Netlify
File `public/_redirects` đã được tạo:
```
/* /index.html 200
```

#### Apache
File `public/.htaccess` đã được tạo:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

#### Nginx
Thêm cấu hình sau vào nginx.conf:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Troubleshooting

### 404 Error cho Share Links
Nếu gặp lỗi 404 khi truy cập `/join/:shareToken`:

1. **Development**: Restart Vite dev server
2. **Production**: Đảm bảo server được cấu hình để serve SPA
3. **Check routes**: Xác nhận route đã được định nghĩa trong App.tsx
4. **Check import**: Đảm bảo component được import đúng cách
