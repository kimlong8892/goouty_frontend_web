# Tính năng Tạo Trip từ URL

## Mô tả
Tính năng cho phép người dùng tạo chuyến đi tự động từ các nguồn URL như Google Sheets, TikTok, hoặc YouTube.

## Cách sử dụng

### Desktop/Web
1. Truy cập trang "Tạo chuyến đi mới" (`/create-trip`)
2. Nhấn vào nút **"Tạo từ URL"** (màu xanh với icon link)
3. Nhập URL vào dialog xuất hiện
4. Nhấn **"Tạo chuyến đi"**
5. Đợi vài phút và kiểm tra email để nhận thông báo khi chuyến đi được tạo thành công

### PWA/Mobile
1. Truy cập trang "Tạo chuyến đi"
2. Nhấn vào icon **Link** (🔗) ở góc phải trên header
3. Nhập URL vào dialog xuất hiện
4. Nhấn **"Tạo chuyến đi"**
5. Đợi vài phút và kiểm tra email để nhận thông báo

## Các loại URL được hỗ trợ
- ✅ Google Sheets (Google Spreadsheets)
- ✅ TikTok
- ✅ YouTube

## API Endpoint
```
POST /api/trips/create-pending
```

### Request Body
```json
{
  "url": "https://docs.google.com/spreadsheets/d/..."
}
```

### Response
```json
{
  "message": "Trip creation request received",
  "tripId": "optional-trip-id"
}
```

## Thông báo
Sau khi gửi yêu cầu thành công, người dùng sẽ nhận được:
- Toast notification: "Yêu cầu đã được gửi! Bạn sẽ nhận được email thông báo trong vài phút."
- Email thông báo khi chuyến đi được tạo thành công (trong vài phút)

## Files đã thay đổi
1. `/src/lib/api.ts` - Thêm method `createFromUrl`
2. `/src/components/dialogs/CreateTripFromUrlDialog.tsx` - Component dialog mới
3. `/src/pages/CreateTripPage.tsx` - Thêm nút và dialog
4. `/src/pwa/pages/PWACreateTripPage.tsx` - Thêm icon và dialog cho PWA

## UI/UX
- **Desktop**: Nút "Tạo từ URL" nằm giữa "Sử dụng mẫu" và "Bắt đầu hành trình"
- **PWA**: Icon link (🔗) ở góc phải trên header
- Dialog hiển thị:
  - Input field cho URL
  - Danh sách các loại URL được hỗ trợ
  - Lưu ý về việc nhận email thông báo
  - Nút "Hủy" và "Tạo chuyến đi"
