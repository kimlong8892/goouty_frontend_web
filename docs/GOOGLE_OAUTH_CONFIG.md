# Google OAuth Configuration Guide

## ✅ Cấu hình đúng cho Frontend Redirect Flow

### 1. Environment Variables (.env)

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
```

### 2. Google Cloud Console Configuration

**Authorized JavaScript origins:**
- `http://localhost:8080` (development)
- `https://your-domain.com` (production)

**Authorized redirect URIs:**
- `http://localhost:8080/auth/google/callback` (development)
- `https://your-domain.com/auth/google/callback` (production)

### 3. Flow hoạt động

```
1. User click "Đăng nhập với Google"
   ↓
2. Redirect trực tiếp đến Google OAuth page
   ↓
3. User đăng nhập Google và authorize
   ↓
4. Google redirect về: http://localhost:8080/auth/google/callback?code=xxx
   ↓
5. Frontend GoogleCallbackPage xử lý code
   ↓
6. Frontend gọi backend: POST /auth/google/callback với { code, redirectUri }
   ↓
7. Backend trả về JWT token
   ↓
8. Frontend lưu token và notify AuthContext
   ↓
9. AuthContext tự động fetch user data
   ↓
10. User được login tự động và redirect về /my-trips
```

### 4. Files liên quan

**Frontend:**
- `src/services/googleAuth.ts` - Google OAuth service
- `src/pages/GoogleCallbackPage.tsx` - Xử lý callback từ Google
- `src/pages/AuthPage.tsx` - Trang đăng nhập
- `src/contexts/AuthContext.tsx` - Auth context

**Backend:**
- `src/auth/auth.controller.ts` - POST /auth/google endpoint
- `src/auth/social-login.service.ts` - Xử lý social login logic

### 5. Testing

1. **Start backend**: `npm run start:dev`
2. **Start frontend**: `npm run dev`
3. **Truy cập**: `http://localhost:8080/auth`
4. **Click "Đăng nhập với Google"**
5. **Test flow**: Google → Frontend → Backend → Success

### 6. Production Setup

```env
# Production .env
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id
VITE_GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

**Google Cloud Console:**
- Add production domain to authorized origins
- Add production redirect URI

### 7. Troubleshooting

**Lỗi "Invalid redirect URI":**
- Kiểm tra Google Cloud Console configuration
- Đảm bảo redirect URI khớp với VITE_GOOGLE_REDIRECT_URI

**Lỗi "Google OAuth not configured":**
- Kiểm tra VITE_GOOGLE_CLIENT_ID trong .env
- Restart dev server sau khi thay đổi env vars

**Lỗi "No authorization code":**
- Kiểm tra Google Cloud Console redirect URIs
- Đảm bảo frontend đang chạy trên đúng port

### 8. Security Notes

- **Client Secret** chỉ cần cho backend (nếu cần verify token)
- **Frontend** chỉ cần Client ID
- **HTTPS** bắt buộc cho production
- **Domain whitelist** trong Google Cloud Console

### 9. Development vs Production

**Development:**
- `http://localhost:8080/auth/google/callback`
- Google Cloud Console: Add localhost origins

**Production:**
- `https://your-domain.com/auth/google/callback`
- Google Cloud Console: Add production domain
- SSL certificate required

## 🚀 Quick Start

1. **Tạo Google OAuth credentials** trong Google Cloud Console
2. **Cấu hình .env** với Client ID và redirect URI
3. **Start servers** (backend + frontend)
4. **Test login** tại `/auth`
5. **Deploy** với production configuration
