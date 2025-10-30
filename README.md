# 🏭 Hệ Thống Quản Lý Vật Tư - 2 Kho

## 📋 Mô tả
Hệ thống quản lý vật tư với 2 kho (Kho Net và Kho Hạ Tầng), bao gồm quản lý sự vụ, chuyển kho, và thống kê dữ liệu. Sử dụng Firebase Realtime Database để lưu trữ dữ liệu.

## ✨ Tính năng chính

### 🔐 Authentication
- Đăng ký/đăng nhập với email và mật khẩu
- Quên mật khẩu với email reset
- Quản lý session tự động
- Bảo vệ routes - chỉ user đã đăng nhập mới truy cập được

### 👤 Quản lý User
- Lưu thông tin user vào Firebase
- Phân quyền admin/user
- Gán kho quản lý cho từng user
- Hiển thị thông tin user trong header

### 📦 Quản lý Vật Tư
- Thêm/sửa/xóa vật tư
- Quản lý theo kho (Net/Hạ Tầng)
- Tìm kiếm và lọc vật tư
- Số serial thay vì mã vật tư

### 📋 Quản lý Sự Vụ
- Tạo sự vụ mới (xử lý, lắp đặt, swap, nâng cấp...)
- Gán vật tư cho sự vụ
- Theo dõi trạng thái sự vụ
- Quản lý deadline và priority

### 🔄 Chuyển Kho
- Tạo yêu cầu chuyển kho
- Xác nhận nhận vật tư
- Theo dõi lịch sử chuyển kho
- Quản lý trạng thái chuyển kho

### 📊 Thống Kê & Báo Cáo
- Dashboard tổng quan
- Biểu đồ thống kê
- Xuất báo cáo Excel
- Lịch sử hoạt động

## 🚀 Cài đặt và Chạy

### 1. Clone Repository
```bash
git clone https://github.com/ebacson/vattu.git
cd vattu
```

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu hình Firebase
- Tạo file `firebase-config.js` từ template:
```bash
cp firebase-config.js.template firebase-config.js
```
- Cập nhật thông tin Firebase trong `firebase-config.js`

### 4. Chạy Ứng dụng
```bash
# Chạy web server
python3 -m http.server 8000

# Hoặc chạy Excel export server (optional)
node excel-server.js
```

### 5. Truy cập Ứng dụng
- Mở browser: http://localhost:8000
- Đăng ký tài khoản mới hoặc đăng nhập

## 🔧 Cấu hình Firebase

### 1. Firebase Console
- Truy cập: https://console.firebase.google.com/
- Tạo project mới hoặc sử dụng project có sẵn

### 2. Realtime Database
- Tạo Realtime Database
- Cấu hình Rules:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### 3. Authentication
- Enable Email/Password authentication
- Cấu hình domain cho production

## 📁 Cấu trúc Project

```
vattu/
├── index.html              # Trang chính
├── auth.html               # Trang đăng nhập/đăng ký
├── styles.css              # CSS styles
├── script.js               # JavaScript chính
├── auth.js                 # Authentication logic
├── firebase-config.js      # Firebase configuration
├── firebase-integration.js # Firebase integration
├── auth-integration.js     # Authentication integration
├── excel-server.js         # Excel export server
├── package.json            # Node.js dependencies
├── README.md               # Hướng dẫn này
└── firebase-config.js.template # Template cấu hình
```

## 🔐 Bảo mật

### Production Rules
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "inventory": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "tasks": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "transfers": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "logs": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 📊 Cấu trúc Dữ liệu

### Users
```json
{
  "uid": "user_uid",
  "email": "user@example.com",
  "displayName": "User Name",
  "admin": false,
  "warehouse": "net",
  "createdAt": "2025-01-07T...",
  "lastLogin": "2025-01-07T...",
  "isActive": true
}
```

### Inventory
```json
{
  "id": "item_id",
  "serial": "SN123456",
  "name": "Item Name",
  "warehouse": "net",
  "category": "Category",
  "condition": "available",
  "source": "Source",
  "dateAdded": "2025-01-07T...",
  "taskId": null,
  "description": "Description"
}
```

### Tasks
```json
{
  "id": "task_id",
  "name": "Task Name",
  "type": "installation",
  "description": "Description",
  "location": "Location",
  "priority": "high",
  "status": "pending",
  "createdDate": "2025-01-07T...",
  "deadline": "2025-01-10T...",
  "createdBy": "user_email",
  "assignedItems": [],
  "completedItems": []
}
```

## 🚀 Deploy

### GitHub Pages
1. Push code lên GitHub repository
2. Enable GitHub Pages trong repository settings
3. Chọn source: Deploy from a branch
4. Chọn branch: main
5. Truy cập: https://username.github.io/vattu

### Vercel/Netlify
1. Connect repository với Vercel/Netlify
2. Deploy tự động
3. Cấu hình environment variables nếu cần

## 🛠️ Troubleshooting

### Lỗi Firebase
- Kiểm tra Firebase Rules
- Kiểm tra Authentication settings
- Kiểm tra network connection

### Lỗi Authentication
- Kiểm tra Email/Password authentication đã enable.
- Kiểm tra Firebase configuration
- Kiểm tra browser console

### Lỗi Excel Export
- Chạy Excel server: `node excel-server.js`
- Kiểm tra port 3002 có bị chiếm không
- Kiểm tra Firebase Admin SDK

## 📞 Hỗ trợ

- GitHub Issues: https://github.com/ebacson/vattu/issues
- Email: support@example.com

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

---

**Hệ thống Quản lý Vật tư - Sẵn sàng cho Production!** 🚀
