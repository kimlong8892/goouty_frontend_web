# Toast Position Test Guide

## 🎯 Mục tiêu
Test để đảm bảo các thông báo (toast messages) hiển thị ở góc trên cùng bên phải.

## 🔧 Cấu hình đã thay đổi

### 1. Sonner Toast (toast từ sonner library)
- **File**: `src/components/ui/sonner.tsx`
- **Thay đổi**: Thêm `position="top-right"`
- **Kết quả**: Toast từ `toast()` function hiển thị ở góc trên cùng bên phải

### 2. Radix Toast (toast từ useToast hook)
- **File**: `src/components/ui/toast.tsx`
- **Thay đổi**: 
  - ToastViewport: `top-0 right-0` thay vì `bottom-0 right-0`
  - Animation: `slide-in-from-right-full` thay vì `slide-in-from-bottom-full`
- **Kết quả**: Toast từ `useToast()` hook hiển thị ở góc trên cùng bên phải

## 🧪 Test Steps

### 1. Test Sonner Toast
```javascript
// Trong browser console hoặc component
import { toast } from 'sonner';

// Test success toast
toast.success('Đăng nhập Google thành công');

// Test error toast
toast.error('Đăng nhập Google thất bại');

// Test info toast
toast.info('Thông tin quan trọng');
```

### 2. Test Radix Toast
```javascript
// Trong component sử dụng useToast
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

// Test success toast
toast({
  title: "Thành công",
  description: "Đăng nhập Google thành công",
});

// Test error toast
toast({
  variant: "destructive",
  title: "Lỗi",
  description: "Đăng nhập Google thất bại",
});
```

### 3. Test trong Google OAuth Flow
1. **Truy cập**: `http://localhost:8080/auth`
2. **Click**: "Đăng nhập với Google"
3. **Verify**: Toast hiển thị ở góc trên cùng bên phải
4. **Complete**: Google OAuth flow
5. **Verify**: Success toast hiển thị ở góc trên cùng bên phải

## ✅ Expected Results

### Position
- ✅ Toast hiển thị ở **góc trên cùng bên phải**
- ✅ Không che khuất nội dung chính
- ✅ Dễ nhìn thấy và không gây phiền toái

### Animation
- ✅ Toast **slide in từ bên phải**
- ✅ Toast **slide out về bên phải**
- ✅ Animation mượt mà và tự nhiên

### Responsive
- ✅ Hoạt động tốt trên desktop
- ✅ Hoạt động tốt trên mobile
- ✅ Không bị che khuất bởi navbar

## 🔍 Debug Points

### 1. Check CSS Classes
```css
/* ToastViewport should have */
.fixed.top-0.right-0.z-\[100\]

/* Toast should have */
.slide-in-from-right-full
.slide-out-to-right-full
```

### 2. Check Console
```javascript
// No errors should appear in console
// Toast should render without issues
```

### 3. Check DOM
```html
<!-- Toast container should be positioned at top-right -->
<div class="fixed top-0 right-0 z-[100] ...">
  <!-- Toast content -->
</div>
```

## 🚨 Common Issues

### Issue 1: Toast still at bottom
**Symptoms**: Toast hiển thị ở dưới cùng
**Debug**: Check ToastViewport className
**Fix**: Verify `top-0 right-0` classes

### Issue 2: Toast not visible
**Symptoms**: Toast không hiển thị
**Debug**: Check z-index and positioning
**Fix**: Verify `z-[100]` and `fixed` positioning

### Issue 3: Animation not working
**Symptoms**: Toast không có animation
**Debug**: Check toastVariants className
**Fix**: Verify `slide-in-from-right-full` class

### Issue 4: Toast overlapping content
**Symptoms**: Toast che khuất nội dung
**Debug**: Check positioning and z-index
**Fix**: Adjust positioning or z-index

## 📋 Test Checklist

- [ ] Sonner toast hiển thị ở góc trên cùng bên phải
- [ ] Radix toast hiển thị ở góc trên cùng bên phải
- [ ] Toast slide in từ bên phải
- [ ] Toast slide out về bên phải
- [ ] Không che khuất nội dung chính
- [ ] Hoạt động tốt trên desktop
- [ ] Hoạt động tốt trên mobile
- [ ] Không bị che khuất bởi navbar
- [ ] Animation mượt mà
- [ ] Toast tự động biến mất sau thời gian

## 🎉 Success Criteria

Toast position được coi là thành công khi:
1. **Vị trí**: Hiển thị ở góc trên cùng bên phải
2. **Animation**: Slide in/out từ bên phải
3. **Responsive**: Hoạt động tốt trên mọi device
4. **UX**: Không che khuất nội dung quan trọng
5. **Visibility**: Dễ nhìn thấy và không gây phiền toái

## 🔧 Troubleshooting Commands

```bash
# Check if changes are applied
grep -r "top-0 right-0" src/components/ui/
grep -r "position.*top-right" src/components/ui/

# Check for any CSS conflicts
# Inspect element in browser dev tools
```

## 📝 Notes

- **Sonner toast**: Sử dụng `position="top-right"` prop
- **Radix toast**: Sử dụng CSS classes `top-0 right-0`
- **Animation**: Cả hai đều slide từ bên phải
- **Z-index**: Đảm bảo toast hiển thị trên các element khác
- **Responsive**: Hoạt động tốt trên mọi kích thước màn hình
