# 🚀 Hướng dẫn Setup Vattu Management System

## 📋 **Yêu cầu hệ thống**

- Node.js 16+ 
- Python 3.x
- Git
- Firebase project

## 🔥 **Bước 1: Clone repository**

```bash
git clone https://github.com/ebacson/vattu.git
cd vattu
```

## 📦 **Bước 2: Cài đặt dependencies**

```bash
npm install
```

## 🔧 **Bước 3: Cấu hình Firebase**

### **3.1. Tạo Firebase project**
1. Truy cập [Firebase Console](https://console.firebase.google.com)
2. Tạo project mới
3. Bật **Realtime Database**
4. Bật **Authentication** (Anonymous)

### **3.2. Cấu hình Realtime Database**
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### **3.3. Tải Service Account Key**
1. Project Settings → Service Accounts
2. Generate new private key
3. Tải file JSON
4. Đổi tên thành `serviceAccountKey.json`
5. Đặt vào thư mục root

### **3.4. Tạo firebase-config.js**
```bash
# Copy template
cp firebase-config.js.template firebase-config.js

# Chỉnh sửa với thông tin Firebase của bạn
nano firebase-config.js
```

**Cập nhật thông tin trong `firebase-config.js`:**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## 🚀 **Bước 4: Chạy ứng dụng**

### **Cách 1: Tự động (Khuyến nghị)**
```bash
./start.sh
```

### **Cách 2: Thủ công**
```bash
# Terminal 1: Excel Export Server
npm start

# Terminal 2: Web Server
npm run static
```

## 🌐 **Bước 5: Truy cập ứng dụng**

- **Web App**: http://localhost:8000
- **Excel Export**: http://localhost:3002/api/export/excel
- **Health Check**: http://localhost:3002/health

## ✅ **Bước 6: Kiểm tra**

1. Mở http://localhost:8000
2. Kiểm tra status Firebase ở góc phải màn hình
3. Thử tạo sự vụ mới
4. Thử thêm vật tư mới
5. Kiểm tra Firebase Console → Realtime Database

## 🔍 **Troubleshooting**

### **Lỗi "Không thể tải dữ liệu từ Firebase"**
- Kiểm tra `firebase-config.js` có đúng thông tin không
- Kiểm tra Realtime Database rules
- Kiểm tra Authentication đã bật chưa

### **Lỗi "EADDRINUSE: address already in use :::3002"**
```bash
# Tìm và kill process đang dùng port 3002
lsof -ti:3002 | xargs kill -9
```

### **Lỗi "Cannot find module './serviceAccountKey.json'"**
- Đảm bảo file `serviceAccountKey.json` có trong thư mục root
- Kiểm tra tên file chính xác

### **Lỗi Firebase Authentication**
- Kiểm tra Anonymous Authentication đã bật
- Kiểm tra Realtime Database rules cho phép auth != null

## 📊 **Cấu trúc dữ liệu Firebase**

```
project-6680116762664948229-default-rtdb/
├── inventory/
│   ├── item1: { name, warehouse, condition, ... }
│   └── item2: { name, warehouse, condition, ... }
├── tasks/
│   ├── task1: { name, type, status, ... }
│   └── task2: { name, type, status, ... }
├── transfers/
│   ├── transfer1: { type, fromWarehouse, toWarehouse, ... }
│   └── transfer2: { type, fromWarehouse, toWarehouse, ... }
└── logs/
    ├── log1: { action, details, timestamp, ... }
    └── log2: { action, details, timestamp, ... }
```

## 🎯 **Sử dụng**

### **Tạo sự vụ**
1. Chuyển sang tab "Quản Lý Sự Vụ"
2. Nhấn "Tạo Sự Vụ Mới"
3. Điền thông tin và lưu

### **Thêm vật tư**
1. Chuyển sang tab "Quản Lý Vật Tư"
2. Nhấn "Thêm Vật Tư Mới"
3. Điền thông tin và lưu

### **Chuyển kho**
1. Chuyển sang tab "Chuyển Kho"
2. Nhấn "Tạo Chuyển Kho"
3. Chọn loại và xác nhận

### **Xuất báo cáo**
1. Nhấn "Đồng bộ Firebase"
2. Truy cập http://localhost:3002/api/export/excel
3. Tải file Excel về

## 📞 **Hỗ trợ**

- **GitHub Issues**: [https://github.com/ebacson/vattu/issues](https://github.com/ebacson/vattu/issues)
- **Repository**: [https://github.com/ebacson/vattu](https://github.com/ebacson/vattu)

---

**🎉 Chúc bạn sử dụng thành công!**
