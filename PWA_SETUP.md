# PWA Setup Guide - Goouty

## ✅ PWA đã được kích hoạt!

PWA (Progressive Web App) đã được cấu hình đầy đủ cho ứng dụng Goouty với các tính năng sau:

### 🎯 Tính năng PWA

1. **Service Worker** - Tự động cache assets và API calls
2. **Offline Support** - Hoạt động khi không có internet
3. **Install Prompt** - Người dùng có thể cài đặt app lên thiết bị
4. **Auto Update** - Tự động cập nhật khi có phiên bản mới
5. **App Shortcuts** - Quick actions từ home screen
6. **Standalone Mode** - Chạy như native app

### 📦 Các file đã được tạo/cập nhật

- ✅ `/public/manifest.json` - PWA manifest với icons và metadata
- ✅ `/vite.config.ts` - Thêm vite-plugin-pwa với workbox
- ✅ `/index.html` - Thêm manifest link và PWA meta tags
- ✅ `/src/components/PWAInstallPrompt.tsx` - Install prompt component
- ✅ `/src/App.tsx` - Tích hợp PWAInstallPrompt
- ✅ `/src/vite-env.d.ts` - Type definitions cho PWA

### 🧪 Cách test PWA

#### 1. **Development Mode**
```bash
npm run dev
```
- PWA sẽ hoạt động ngay trong dev mode
- Service worker được enable trong dev
- Có thể test install prompt

#### 2. **Production Build**
```bash
npm run build
npm run preview
```
- Build production bundle với service worker
- Preview để test PWA hoàn chỉnh

#### 3. **Test trên Chrome Desktop**
1. Mở Chrome
2. Truy cập `http://localhost:8080` (hoặc URL của bạn)
3. Nhìn vào address bar, sẽ có icon ⊕ (install)
4. Click vào icon để cài đặt PWA
5. Hoặc: Menu (⋮) → "Install Goouty"

#### 4. **Test trên Chrome Mobile**
1. Mở Chrome trên điện thoại
2. Truy cập URL của app
3. Sẽ có banner "Add to Home Screen" xuất hiện
4. Hoặc: Menu (⋮) → "Add to Home screen"

#### 5. **Test trên iOS Safari**
1. Mở Safari trên iPhone/iPad
2. Truy cập URL của app
3. Tap Share button (hình vuông với mũi tên lên)
4. Chọn "Add to Home Screen"

### 🔍 Kiểm tra PWA trong Chrome DevTools

1. Mở Chrome DevTools (F12)
2. Chuyển sang tab **Application**
3. Kiểm tra:
   - **Manifest**: Xem manifest.json đã load đúng
   - **Service Workers**: Xem SW đã registered và active
   - **Cache Storage**: Xem assets đã được cache
   - **Lighthouse**: Chạy PWA audit

### 📱 PWA Features trong Code

#### Install Prompt
```tsx
// Component tự động hiển thị khi app có thể install
<PWAInstallPrompt />
```

#### Check PWA Mode
```tsx
import { usePWA } from '@/pwa/hooks/usePWA';

const { isPWA } = usePWA();
// isPWA = true khi chạy trong standalone mode
```

#### Service Worker Updates
```tsx
// Tự động hiển thị toast khi có update
// User có thể click "Reload" để update
```

### 🎨 Customization

#### Thay đổi màu theme
Sửa trong `vite.config.ts`:
```typescript
theme_color: '#6347f9', // Primary purple
background_color: '#ffffff',
```

#### Thay đổi icons
Thay file `/public/logo.png` (cần 192x192 và 512x512)

#### Thêm shortcuts
Sửa trong `vite.config.ts` → `manifest.shortcuts`

### 🚀 Deploy PWA

Khi deploy lên production:

1. Build app: `npm run build`
2. Upload folder `dist/` lên server
3. Đảm bảo HTTPS (bắt buộc cho PWA)
4. Service worker sẽ tự động hoạt động

### 📊 Monitoring

Kiểm tra PWA metrics:
- Install rate
- Offline usage
- Service worker errors
- Cache hit rate

### 🐛 Troubleshooting

**PWA không hiển thị install prompt?**
- Kiểm tra HTTPS (localhost OK cho dev)
- Kiểm tra manifest.json đã load
- Kiểm tra service worker đã registered
- Clear cache và reload

**Service worker không update?**
- Hard refresh (Ctrl+Shift+R)
- Clear service worker trong DevTools
- Kiểm tra `registerType: 'autoUpdate'`

**Icons không hiển thị?**
- Kiểm tra path trong manifest
- Đảm bảo icons tồn tại trong `/public`
- Kiểm tra sizes phù hợp (192x192, 512x512)

### 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)

---

**Lưu ý**: PWA cần HTTPS để hoạt động trên production. Localhost được miễn trừ cho development.
