# Notification System Frontend

## 📋 Overview

Hệ thống notification frontend đã được tạo hoàn chỉnh với đầy đủ UI components và tính năng để quản lý thông báo của user.

## 🎯 Features

### ✅ **Core Features**
- **Notification List**: Hiển thị danh sách thông báo với pagination
- **Notification Filters**: Lọc theo trạng thái và loại thông báo
- **Notification Stats**: Thống kê số lượng thông báo
- **Mark as Read**: Đánh dấu đã đọc (đơn lẻ hoặc hàng loạt)
- **Delete Notifications**: Xóa thông báo
- **Clear Read**: Xóa tất cả thông báo đã đọc
- **Real-time Updates**: Cập nhật real-time khi có thay đổi

### ✅ **UI Components**
- **NotificationBell**: Bell icon trong navbar với badge số lượng chưa đọc
- **NotificationCard**: Card hiển thị từng thông báo
- **NotificationList**: Danh sách thông báo với loading states
- **NotificationFilters**: Bộ lọc và thống kê
- **Pagination**: Phân trang cho danh sách thông báo
- **NotificationsPage**: Trang chính quản lý thông báo

## 📁 File Structure

```
frontend/src/
├── types/
│   └── notification.ts              # Types và interfaces
├── hooks/
│   └── useNotifications.ts          # Custom hook quản lý state
├── services/
│   └── notificationService.ts       # API service (đã cập nhật)
├── components/
│   └── notifications/
│       ├── NotificationBell.tsx     # Bell icon trong navbar
│       ├── NotificationCard.tsx     # Card hiển thị thông báo
│       ├── NotificationList.tsx     # Danh sách thông báo
│       ├── NotificationFilters.tsx  # Bộ lọc và thống kê
│       └── Pagination.tsx            # Phân trang
├── pages/
│   └── NotificationsPage.tsx        # Trang chính
└── App.tsx                          # Routes (đã cập nhật)
```

## 🚀 Usage

### 1. **NotificationBell trong Navbar**
```tsx
// Đã được thêm vào Navbar.tsx
{isAuthenticated && <NotificationBell />}
```

### 2. **NotificationsPage**
```tsx
// Route: /notifications
<Route path="/notifications" element={<NotificationsPage />} />
```

### 3. **useNotifications Hook**
```tsx
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    notifications,
    stats,
    loading,
    error,
    markAsRead,
    deleteNotification,
    // ... other methods
  } = useNotifications();

  return (
    // Your component JSX
  );
}
```

## 🎨 UI Components

### **NotificationBell**
- Hiển thị trong navbar
- Badge số lượng thông báo chưa đọc
- Dropdown với 5 thông báo gần nhất
- Click để mark as read và navigate

### **NotificationCard**
- Hiển thị thông tin thông báo
- Badge loại và trạng thái
- Actions: Mark as read, Delete, Archive
- Click để navigate đến URL

### **NotificationFilters**
- Lọc theo trạng thái (UNREAD, READ, ARCHIVED)
- Lọc theo loại (INFO, SUCCESS, WARNING, etc.)
- Thống kê tổng quan
- Clear filters

### **NotificationList**
- Danh sách thông báo với loading states
- Empty state khi không có thông báo
- Error handling
- Bulk actions (Mark all as read, Clear read)

### **Pagination**
- Phân trang với page numbers
- Jump to first/last page
- Items per page selector
- Responsive design

## 🔧 API Integration

### **NotificationService Methods**
```typescript
// CRUD Operations
await notificationService.createNotification(data);
await notificationService.getUserNotifications(filters);
await notificationService.getNotificationById(id);
await notificationService.updateNotification(id, data);
await notificationService.deleteNotification(id);

// Bulk Operations
await notificationService.markAsRead(notificationIds);
await notificationService.markAllAsRead();
await notificationService.clearReadNotifications();

// Statistics
await notificationService.getNotificationStats();
```

### **API Endpoints Used**
- `GET /notifications` - Lấy danh sách thông báo
- `GET /notifications/stats` - Lấy thống kê
- `GET /notifications/:id` - Lấy thông báo theo ID
- `POST /notifications` - Tạo thông báo mới
- `PUT /notifications/:id` - Cập nhật thông báo
- `DELETE /notifications/:id` - Xóa thông báo
- `POST /notifications/mark-as-read` - Đánh dấu đã đọc
- `POST /notifications/mark-all-as-read` - Đánh dấu tất cả đã đọc
- `DELETE /notifications/clear-read` - Xóa đã đọc

## 📊 Notification Types

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| `INFO` | ℹ️ | Blue | Thông tin chung |
| `SUCCESS` | ✅ | Green | Thành công |
| `WARNING` | ⚠️ | Yellow | Cảnh báo |
| `ERROR` | ❌ | Red | Lỗi |
| `TRIP_CREATED` | ✈️ | Purple | Chuyến đi mới |
| `TRIP_UPDATED` | 📝 | Indigo | Cập nhật chuyến đi |
| `TRIP_DELETED` | 🗑️ | Gray | Xóa chuyến đi |
| `EXPENSE_ADDED` | 💰 | Orange | Chi phí mới |
| `EXPENSE_UPDATED` | 📊 | Amber | Cập nhật chi phí |
| `SETTLEMENT_CREATED` | 💳 | Emerald | Thanh toán |
| `SYSTEM_ANNOUNCEMENT` | 📢 | Cyan | Thông báo hệ thống |

## 🎯 Notification Status

| Status | Color | Description |
|--------|-------|-------------|
| `UNREAD` | Blue | Chưa đọc |
| `READ` | Gray | Đã đọc |
| `ARCHIVED` | Yellow | Đã lưu trữ |

## 🔄 State Management

### **useNotifications Hook**
```typescript
interface UseNotificationsReturn {
  // Data
  notifications: Notification[];
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  total: number;
  unreadCount: number;
  
  // Filters
  filters: NotificationFilters;
  
  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Filter actions
  setFilters: (filters: NotificationFilters) => void;
  setPage: (page: number) => void;
  setStatusFilter: (status: NotificationStatus | undefined) => void;
  setTypeFilter: (type: NotificationType | undefined) => void;
  clearFilters: () => void;
}
```

## 🎨 Styling

### **Tailwind CSS Classes**
- Responsive design với `grid-cols-1 lg:grid-cols-4`
- Color coding cho từng loại thông báo
- Hover effects và transitions
- Loading states với skeletons
- Error states với alerts

### **Icons**
- Sử dụng Lucide React icons
- Emoji icons cho notification types
- Consistent icon sizing

## 📱 Responsive Design

- **Mobile**: Single column layout
- **Tablet**: 2-column layout
- **Desktop**: 4-column layout với sidebar filters
- **Touch-friendly**: Large touch targets
- **Accessible**: Proper ARIA labels và keyboard navigation

## 🔧 Customization

### **Adding New Notification Types**
```typescript
// 1. Add to enum in types/notification.ts
export enum NotificationType {
  // ... existing types
  NEW_TYPE = 'NEW_TYPE',
}

// 2. Add config in NOTIFICATION_TYPE_CONFIG
[NotificationType.NEW_TYPE]: {
  label: 'New Type',
  color: 'bg-purple-100 text-purple-800',
  icon: '🆕',
},
```

### **Customizing Colors**
```typescript
// Update NOTIFICATION_TYPE_CONFIG colors
[NotificationType.INFO]: {
  label: 'Thông tin',
  color: 'bg-blue-100 text-blue-800', // Customize here
  icon: 'ℹ️',
},
```

## 🚀 Getting Started

1. **Install Dependencies** (nếu cần):
```bash
npm install date-fns
```

2. **Import Components**:
```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationsPage } from '@/pages/NotificationsPage';
```

3. **Use Hook**:
```tsx
import { useNotifications } from '@/hooks/useNotifications';
```

4. **Access Route**:
```
http://localhost:3000/notifications
```

## 🎉 Features Summary

- ✅ **Complete CRUD Operations**
- ✅ **Real-time Updates**
- ✅ **Responsive Design**
- ✅ **Loading States**
- ✅ **Error Handling**
- ✅ **Pagination**
- ✅ **Filtering**
- ✅ **Statistics**
- ✅ **Bulk Actions**
- ✅ **Accessibility**
- ✅ **TypeScript Support**
- ✅ **Toast Notifications**
- ✅ **Navigation Integration**

**Notification System Frontend** đã sẵn sàng để sử dụng! 🚀
