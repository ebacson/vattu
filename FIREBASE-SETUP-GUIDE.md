# 🔥 Hướng dẫn thiết lập Firebase Realtime Database cho Vattu Management System

## 📋 **Tổng quan**
Hệ thống đã được chuyển đổi hoàn toàn sang **Firebase Realtime Database** để lưu trữ dữ liệu realtime và xuất báo cáo Excel. Đây là hướng dẫn chi tiết từng bước.

## 🚀 **Bước 1: Tạo Firebase Project**

### 1.1 Truy cập Firebase Console
- Đi đến: https://console.firebase.google.com/
- Đăng nhập bằng tài khoản Google của bạn

### 1.2 Tạo Project mới
- Nhấn **"Add project"**
- **Project name:** `vattu-management-system`
- **Google Analytics:** Bật (khuyến nghị)
- Nhấn **"Create project"**

## 🔧 **Bước 2: Thiết lập Firebase Services**

### 2.1 Realtime Database (Main Database)
- Vào **"Realtime Database"** → **"Create database"**
- Chọn **"Start in test mode"** (để test)
- Chọn location: `asia-southeast1` (Singapore)
- **Lưu Database URL** để cấu hình sau

### 2.2 Authentication
- Vào **"Authentication"** → **"Get started"**
- Chọn tab **"Sign-in method"**
- Bật **"Anonymous"** (cho đơn giản)

## 🔑 **Bước 3: Lấy Firebase Configuration**

### 3.1 Web App Configuration
- Vào **"Project settings"** (⚙️ icon)
- Cuộn xuống **"Your apps"**
- Nhấn **"Web"** icon (</>)
- **App nickname:** `vattu-web-app`
- Nhấn **"Register app"**

### 3.2 Copy Firebase Config
Sao chép đoạn config và cập nhật vào `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "vattu-management-system.firebaseapp.com",
    databaseURL: "https://vattu-management-system-default-rtdb.firebaseio.com",
    projectId: "vattu-management-system",
    storageBucket: "vattu-management-system.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef..."
};
```

**⚠️ Quan trọng:** Đảm bảo có `databaseURL` trong config!

## 🛠️ **Bước 4: Tạo Service Account**

### 4.1 Tạo Service Account
- Vào **"Project settings"** → **"Service accounts"**
- Nhấn **"Generate new private key"**
- Tải file JSON về máy
- **Đổi tên file thành:** `serviceAccountKey.json`

### 4.2 Cập nhật Database URL
Trong file `firebase-admin.js`, cập nhật với Database URL từ bước 2.1:
```javascript
databaseURL: "https://vattu-management-system-default-rtdb.firebaseio.com"
```

## 📦 **Bước 5: Cài đặt và chạy**

### 5.1 Cài đặt dependencies
```bash
npm install
```

### 5.2 Cấu hình Firebase
1. **Cập nhật `firebase-config.js`** với config từ bước 3.2
2. **Cập nhật `firebase-admin.js`** với database URL từ bước 4.2
3. **Đặt file `serviceAccountKey.json`** vào thư mục project

### 5.3 Chạy ứng dụng

**Option 1: Chạy với Firebase + Excel Export (Recommended)**
```bash
# Terminal 1: Chạy Excel server
npm start

# Terminal 2: Chạy static server
python3 -m http.server 8000

# Truy cập: http://localhost:8000
```

**Option 2: Chỉ chạy static server**
```bash
python3 -m http.server 8000
# Truy cập: http://localhost:8000
```

## 🔥 **Bước 6: Kiểm tra kết nối Firebase**

### 6.1 Kiểm tra trong browser
1. Mở ứng dụng: http://localhost:8000
2. Kiểm tra status indicator ở góc trên bên phải
3. **"Đã kết nối Firebase Realtime DB"** = thành công
4. **"Chưa kết nối Firebase"** = có lỗi

### 6.2 Kiểm tra Console
- Mở Developer Tools (F12)
- Xem Console tab
- Tìm log: `🔥 Firebase auth initialized`

## 📊 **Bước 7: Test chức năng**

### 7.1 Test tạo dữ liệu
1. **Tạo sự vụ** → Kiểm tra Firebase Console → Realtime Database
2. **Thêm vật tư** → Kiểm tra node `inventory`
3. **Tạo chuyển kho** → Kiểm tra node `transfers`

### 7.2 Test xuất Excel
1. Nhấn **"Xuất báo cáo Excel"**
2. File Excel sẽ được tải về với 5 sheets:
   - **Vật Tư** - Danh sách vật tư
   - **Sự Vụ** - Danh sách sự vụ
   - **Chuyển Kho** - Danh sách chuyển kho
   - **Log** - Lịch sử hoạt động
   - **Tổng Kết** - Thống kê tổng quan

## 📁 **Cấu trúc dữ liệu Firebase Realtime Database**

### Nodes trong Realtime Database:
```
/inventory
  - id: auto-generated
  - code: string
  - name: string
  - warehouse: string
  - category: string
  - condition: string
  - source: string
  - dateAdded: timestamp
  - taskId: string (optional)
  - description: string
  - createdAt: timestamp
  - updatedAt: timestamp

/tasks
  - id: auto-generated
  - name: string
  - type: string
  - description: string
  - location: string
  - priority: string
  - status: string
  - createdDate: timestamp
  - deadline: timestamp (optional)
  - createdBy: string
  - assignedItems: array
  - completedItems: array
  - notes: string
  - createdAt: timestamp
  - updatedAt: timestamp

/transfers
  - id: auto-generated
  - type: string
  - taskId: string (optional)
  - fromWarehouse: string
  - toWarehouse: string
  - items: array
  - status: string
  - createdDate: timestamp
  - confirmedDate: timestamp (optional)
  - notes: string
  - createdBy: string
  - confirmedBy: string (optional)
  - createdAt: timestamp
  - updatedAt: timestamp

/logs
  - id: auto-generated
  - type: string
  - action: string
  - details: string
  - timestamp: timestamp
  - user: string
  - createdAt: timestamp
```

## ⚠️ **Lưu ý quan trọng**

### Bảo mật
- **KHÔNG BAO GIỜ** commit file `serviceAccountKey.json` vào Git
- File đã được thêm vào `.gitignore`
- Chỉ chia sẻ Firebase config, không chia sẻ service account

### Production
- Thay đổi Firestore rules từ test mode sang production
- Cấu hình Authentication rules
- Sử dụng HTTPS trong production
- Cập nhật Firebase config cho domain production

### Troubleshooting
- **"Firebase not initialized"**: Kiểm tra firebase-config.js và databaseURL
- **"Permission denied"**: Kiểm tra Realtime Database rules
- **"Excel export failed"**: Kiểm tra Excel server (port 3002)
- **"Service account error"**: Kiểm tra serviceAccountKey.json

## 🆘 **Hỗ trợ**

Nếu gặp vấn đề:
1. Kiểm tra Console trong browser (F12)
2. Kiểm tra logs trong terminal
3. Đảm bảo tất cả Firebase configs đúng (có databaseURL)
4. Kiểm tra Firebase Console → Realtime Database → Data

## 🎯 **Tính năng hoàn chỉnh**

✅ **Lưu trữ dữ liệu** vào Firebase Realtime Database
✅ **Đồng bộ realtime** giữa các thiết bị
✅ **Xuất báo cáo Excel** với 5 sheets
✅ **Authentication** với Firebase Auth
✅ **Logging** tất cả hoạt động
✅ **Responsive UI** với status indicators
✅ **Error handling** và user feedback

---

**🎉 Sau khi hoàn thành, bạn sẽ có một hệ thống quản lý vật tư hoàn chỉnh với Firebase Realtime Database và xuất Excel báo cáo!**
