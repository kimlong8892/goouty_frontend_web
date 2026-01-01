# Google Login Flow Test Guide

## 🎯 Mục tiêu
Test để đảm bảo sau khi Google callback xử lý xong thì user được login tự động.

## 🔄 Flow hoạt động

```
1. User click "Đăng nhập với Google"
   ↓
2. Google OAuth redirect
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

### 2. Test Flow
1. **Truy cập**: `http://localhost:8080/auth`
2. **Click**: "Đăng nhập với Google"
3. **Đăng nhập**: Google account
4. **Authorize**: App permissions
5. **Verify**: Tự động redirect về `/my-trips`
6. **Check**: User đã được login (navbar hiển thị user info)

### 3. Expected Results
- ✅ Google OAuth popup/redirect mở ra
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

### 1. Check Console Logs
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

### 2. Check Network Requests
- `POST /auth/google/callback` - Should return 200 with JWT token
- `GET /users/profile` - Should return 200 with user data

### 3. Check localStorage
```javascript
// Should contain accessToken
localStorage.getItem('accessToken')
```

### 4. Check AuthContext State
```javascript
// In browser console
// Should show user object and isAuthenticated: true
```

## 🚨 Common Issues

### Issue 1: Token not saved
**Symptoms**: User not logged in after callback
**Debug**: Check localStorage for accessToken
**Fix**: Verify backend response structure

### Issue 2: AuthContext not updated
**Symptoms**: Token saved but user not set
**Debug**: Check tokenUpdated event dispatch
**Fix**: Verify event listener in AuthContext

### Issue 3: User data not fetched
**Symptoms**: Token updated but user data missing
**Debug**: Check /users/profile API call
**Fix**: Verify JWT token format and backend endpoint

### Issue 4: Redirect not working
**Symptoms**: User logged in but still on callback page
**Debug**: Check navigate('/my-trips') call
**Fix**: Verify setTimeout delay

## 📋 Test Checklist

- [ ] Google OAuth popup opens
- [ ] User can login with Google
- [ ] Google redirects to callback page
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
1. User click "Đăng nhập với Google"
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

# Test API endpoint
curl -X POST http://localhost:3000/auth/google/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code","redirectUri":"http://localhost:8080/auth/google/callback"}'

# Check database
npx prisma studio
```

## 📝 Notes

- Flow hoạt động hoàn toàn tự động
- Không cần user interaction sau Google OAuth
- AuthContext tự động update khi có token mới
- User được login ngay lập tức sau callback
- Redirect về trang chính của app
