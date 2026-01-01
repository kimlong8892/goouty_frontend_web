# Google Redirect Flow Test Guide

## 🎯 Mục tiêu
Test để đảm bảo khi click "Đăng nhập với Google" thì redirect trực tiếp đến Google OAuth page.

## 🔄 Flow hoạt động mới

```
1. User click "Đăng nhập với Google"
   ↓
2. Redirect trực tiếp đến Google OAuth page (không popup)
   ↓
3. User đăng nhập Google và authorize
   ↓
4. Google redirect về: /auth/google/callback?code=xxx
   ↓
5. GoogleCallbackPage xử lý code
   ↓
6. Gọi backend: POST /auth/google/callback
   ↓
7. Backend trả về JWT token
   ↓
8. Frontend lưu token và dispatch 'tokenUpdated' event
   ↓
9. AuthContext nhận event và fetch user data
   ↓
10. User được login tự động và redirect về /my-trips
```

## 🧪 Test Steps

### 1. Setup
```bash
# Start backend
npm run start:dev

# Start frontend
npm run dev
```

### 2. Test Redirect Flow
1. **Truy cập**: `http://localhost:8080/auth`
2. **Click**: "Đăng nhập với Google"
3. **Verify**: Trang chuyển trực tiếp đến Google OAuth (không popup)
4. **Đăng nhập**: Google account
5. **Authorize**: App permissions
6. **Verify**: Google redirect về `/auth/google/callback`
7. **Verify**: Tự động xử lý và redirect về `/my-trips`
8. **Check**: User đã được login (navbar hiển thị user info)

### 3. Expected Results
- ✅ Click "Đăng nhập với Google" → Redirect trực tiếp đến Google
- ✅ Không có popup window
- ✅ Trang chuyển hoàn toàn đến Google OAuth
- ✅ User có thể đăng nhập Google
- ✅ Google redirect về frontend với code
- ✅ GoogleCallbackPage xử lý code thành công
- ✅ Backend trả về JWT token
- ✅ Frontend lưu token vào localStorage
- ✅ AuthContext nhận tokenUpdated event
- ✅ AuthContext fetch user data từ backend
- ✅ User được set trong AuthContext
- ✅ Tự động redirect về /my-trips
- ✅ Navbar hiển thị user info
- ✅ User có thể access protected routes

## 🔍 Debug Points

### 1. Check URL Changes
```javascript
// Khi click "Đăng nhập với Google"
// URL should change to:
// https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account
```

### 2. Check Console Logs
```javascript
// Trong GoogleCallbackPage
console.log('Processing Google callback...');
console.log('Authorization code:', code);
console.log('Backend response:', response);

// Trong AuthContext
console.log('Token updated event received');
console.log('Fetching user data...');
console.log('User data:', userData);
```

### 3. Check Network Requests
- `POST /auth/google/callback` - Should return 200 with JWT token
- `GET /users/profile` - Should return 200 with user data

### 4. Check localStorage
```javascript
// Should contain accessToken
localStorage.getItem('accessToken')
```

## 🚨 Common Issues

### Issue 1: Popup still appears
**Symptoms**: Click button shows popup instead of redirect
**Debug**: Check `googleAuth.ts` login method
**Fix**: Ensure `redirectToGoogle()` is called directly

### Issue 2: Redirect not working
**Symptoms**: Click button does nothing
**Debug**: Check Google Client ID configuration
**Fix**: Verify `VITE_GOOGLE_CLIENT_ID` in .env

### Issue 3: Wrong redirect URI
**Symptoms**: Google shows error about redirect URI
**Debug**: Check Google Cloud Console configuration
**Fix**: Verify redirect URI matches `VITE_GOOGLE_REDIRECT_URI`

### Issue 4: Callback not processed
**Symptoms**: Redirect to Google works but callback fails
**Debug**: Check GoogleCallbackPage and backend
**Fix**: Verify authorization code processing

## 📋 Test Checklist

- [ ] Click "Đăng nhập với Google" redirects to Google
- [ ] No popup window appears
- [ ] Page completely navigates to Google OAuth
- [ ] User can login with Google account
- [ ] Google redirects back to callback page
- [ ] Authorization code is received
- [ ] Backend processes code successfully
- [ ] JWT token is returned
- [ ] Token is saved to localStorage
- [ ] tokenUpdated event is dispatched
- [ ] AuthContext receives event
- [ ] User data is fetched from backend
- [ ] User is set in AuthContext
- [ ] isAuthenticated becomes true
- [ ] Automatic redirect to /my-trips
- [ ] Navbar shows user info
- [ ] Protected routes are accessible

## 🎉 Success Criteria

Flow được coi là thành công khi:
1. Click "Đăng nhập với Google" → **Redirect trực tiếp đến Google** (không popup)
2. Hoàn thành Google OAuth flow
3. **Tự động login** (không cần click thêm gì)
4. Redirect về `/my-trips`
5. User info hiển thị trong navbar
6. Có thể access các protected routes

## 🔧 Troubleshooting Commands

```bash
# Check backend logs
npm run start:dev

# Check frontend logs
npm run dev

# Test redirect URL manually
# Should redirect to Google OAuth page
```

## 📝 Key Changes

### Before (Popup Flow):
- Click button → Popup window opens
- User interacts in popup
- Popup closes after authentication

### After (Redirect Flow):
- Click button → **Page redirects to Google**
- User interacts on Google page
- Google redirects back to app

## 🚀 Benefits

- ✅ **Better UX**: No popup blocking issues
- ✅ **Mobile friendly**: Works better on mobile devices
- ✅ **Simpler flow**: Direct navigation
- ✅ **More reliable**: No popup blocker issues
- ✅ **Consistent**: Same experience across all devices
