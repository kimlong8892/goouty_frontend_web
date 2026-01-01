# Google OAuth Setup Guide

Hướng dẫn thiết lập Google OAuth cho ứng dụng Goouty.

## 1. Tạo Google OAuth Credentials

### Bước 1: Truy cập Google Cloud Console
1. Đi tới [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Kích hoạt Google+ API (nếu chưa có)

### Bước 2: Tạo OAuth 2.0 Credentials
1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Chọn **Web application**
4. Điền thông tin:
   - **Name**: Goouty App (hoặc tên bạn muốn)
   - **Authorized JavaScript origins**:
     - `http://localhost:8080` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:8080/auth/google/callback` (development)
     - `https://your-domain.com/auth/google/callback` (production)
     - **Lưu ý**: Google sẽ redirect về frontend, không phải backend

### Bước 3: Lấy Client ID
1. Sau khi tạo, copy **Client ID**
2. Lưu **Client Secret** (cần cho backend)

## 2. Cấu hình Environment Variables

### Development (.env)
```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
```

### Production (.env)
```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

## 3. Backend Configuration (Cần thiết)

Backend cần implement endpoint `/auth/google` để xử lý Google OAuth:

```typescript
// Backend endpoint cần implement
POST /auth/google
{
  "googleId": "string",
  "email": "string", 
  "fullName": "string",
  "picture": "string",
  "credential": "string" // JWT token từ Google
}

// Response
{
  "id": number,
  "email": "string",
  "fullName": "string", 
  "accessToken": "string"
}
```

## 4. Cách sử dụng

### Trong component
```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { loginWithGoogle } = useAuth();
  
  const handleGoogleLogin = async () => {
    const { error } = await loginWithGoogle();
    if (error) {
      console.error('Google login failed:', error);
    }
  };
  
  return (
    <button onClick={handleGoogleLogin}>
      Đăng nhập với Google
    </button>
  );
};
```

## 5. Flow hoạt động

1. **User click "Đăng nhập với Google"**
2. **Google OAuth popup/redirect** mở ra
3. **User đăng nhập Google** và authorize app
4. **Google redirect** về frontend `/auth/google/callback` với authorization code
5. **Frontend xử lý code** và extract user info
6. **Frontend gửi user info** tới backend `/auth/google`
7. **Backend verify** và tạo JWT token
8. **Frontend nhận token** và lưu vào localStorage
9. **User được đăng nhập** thành công

## 6. Troubleshooting

### Lỗi "Google OAuth not configured"
- Kiểm tra `VITE_GOOGLE_CLIENT_ID` trong .env
- Restart dev server sau khi thay đổi env vars

### Lỗi "Invalid redirect URI"
- Kiểm tra redirect URI trong Google Cloud Console
- Đảm bảo URI khớp với `VITE_GOOGLE_REDIRECT_URI`

### Lỗi "Client ID not found"
- Kiểm tra Client ID trong Google Cloud Console
- Đảm bảo project đã được publish (nếu cần)

### Popup bị block
- Browser có thể block popup, sẽ tự động fallback sang redirect flow
- User cần allow popup cho domain

## 7. Security Notes

- **Client Secret** chỉ dùng ở backend, KHÔNG expose ở frontend
- **JWT token** từ Google cần được verify ở backend
- **HTTPS** bắt buộc cho production
- **Domain whitelist** trong Google Cloud Console

## 8. Testing

### Development
1. Start dev server: `npm run dev`
2. Truy cập `http://localhost:8080/auth`
3. Click "Đăng nhập với Google"
4. Test với Google account

### Production
1. Deploy với environment variables đúng
2. Test với production domain
3. Verify redirect URIs trong Google Cloud Console

## 9. Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
