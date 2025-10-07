# 🔥 Vattu Management System v2.0

Hệ thống quản lý vật tư hoàn chỉnh với **Firebase Realtime Database**.

## ✨ **Tính năng chính**

- 🔥 **Firebase Realtime Database** - Lưu trữ dữ liệu realtime
- 📊 **Xuất báo cáo Excel** - 5 sheets với dữ liệu đầy đủ
- 🔐 **Firebase Authentication** - Bảo mật và xác thực
- 📱 **Responsive Design** - Tương thích mọi thiết bị
- 🔄 **Auto-sync** - Đồng bộ dữ liệu tự động
- 📝 **Comprehensive Logging** - Ghi lại mọi hoạt động

## 🏗️ **Kiến trúc hệ thống**

```
Frontend (HTML/CSS/JS)
    ↓
Firebase Realtime Database
    ↓
Firebase Admin SDK (Server)
    ↓
Excel Export Server (Node.js)
    ↓
XLSX Files (Reports)
```

## 📋 **Tính năng chính**

### **Quản lý 2 kho**
- **Kho Net**: Quản lý thiết bị mạng, cung cấp vật tư
- **Kho Hạ Tầng**: Nhận vật tư, thực hiện sự vụ, trả về

### **Quản lý sự vụ**
- Tạo sự vụ (xử lý, lắp đặt, swap, nâng cấp...)
- Yêu cầu vật tư từ kho Net
- Xác nhận nhận vật tư
- Trả vật tư sau khi hoàn thành

### **Chuyển kho**
- Yêu cầu chuyển kho (Net → Hạ Tầng)
- Trả kho (Hạ Tầng → Net)
- Xác nhận giao nhận
- Theo dõi trạng thái

### **Báo cáo & Thống kê**
- Dashboard tổng quan
- Biểu đồ phân tích
- Xuất báo cáo Excel
- Lịch sử hoạt động

## 🚀 **Cài đặt nhanh**

### **1. Clone project**
```bash
git clone <repository-url>
cd Vattu
```

### **2. Cài đặt dependencies**
```bash
npm install
```

### **3. Cấu hình Firebase**
1. Tạo project Firebase mới
2. Bật Realtime Database
3. Tải `serviceAccountKey.json` vào thư mục root
4. Cập nhật `firebase-config.js` với thông tin project

### **4. Chạy ứng dụng**
```bash
# Chạy Excel export server
npm start

# Chạy static server (terminal khác)
npm run static
```

### **5. Truy cập ứng dụng**
- **Web App**: http://localhost:8000
- **Excel Export**: http://localhost:3002/api/export/excel

## 🔧 **Cấu hình Firebase**

### **1. Tạo Firebase Project**
1. Truy cập [Firebase Console](https://console.firebase.google.com)
2. Tạo project mới
3. Bật **Realtime Database**
4. Bật **Authentication** (Anonymous)

### **2. Cấu hình Realtime Database**
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### **3. Tải Service Account Key**
1. Project Settings → Service Accounts
2. Generate new private key
3. Lưu file `serviceAccountKey.json` vào thư mục root

### **4. Cập nhật Firebase Config**
```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 📁 **Cấu trúc project**

```
Vattu/
├── index.html              # Giao diện chính
├── styles.css              # CSS styles
├── script.js               # Logic chính
├── firebase-config.js      # Cấu hình Firebase
├── firebase-integration.js # Firebase functions
├── firebase-admin.js       # Firebase Admin SDK
├── excel-server.js         # Excel export server
├── serviceAccountKey.json  # Firebase service account
├── package.json            # Dependencies
└── README.md              # Hướng dẫn
```

## 🎯 **Sử dụng**

### **1. Tạo sự vụ**
1. Chuyển sang tab "Quản Lý Sự Vụ"
2. Nhấn "Tạo Sự Vụ Mới"
3. Điền thông tin sự vụ
4. Lưu vào Firebase

### **2. Thêm vật tư**
1. Chuyển sang tab "Quản Lý Vật Tư"
2. Nhấn "Thêm Vật Tư Mới"
3. Điền thông tin vật tư
4. Lưu vào Firebase

### **3. Chuyển kho**
1. Chuyển sang tab "Chuyển Kho"
2. Nhấn "Tạo Chuyển Kho"
3. Chọn loại chuyển kho
4. Xác nhận giao nhận

### **4. Xuất báo cáo**
1. Nhấn "Đồng bộ Firebase"
2. Truy cập http://localhost:3002/api/export/excel
3. Tải file Excel về

## 🔍 **Troubleshooting**

### **Lỗi kết nối Firebase**
```bash
# Kiểm tra serviceAccountKey.json
ls -la serviceAccountKey.json

# Test kết nối
node firebase-admin.js
```

### **Lỗi Excel export**
```bash
# Kiểm tra server
curl http://localhost:3002/health

# Restart server
npm start
```

### **Lỗi authentication**
- Kiểm tra Firebase Authentication đã bật
- Kiểm tra Realtime Database rules
- Kiểm tra firebase-config.js

## 📊 **API Endpoints**

### **Excel Export Server**
- `GET /health` - Health check
- `GET /api/export/excel` - Xuất báo cáo Excel

### **Firebase Realtime Database**
- `inventory/` - Dữ liệu vật tư
- `tasks/` - Dữ liệu sự vụ
- `transfers/` - Dữ liệu chuyển kho
- `logs/` - Dữ liệu log

## 🤝 **Đóng góp**

1. Fork project
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 **License**

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 📞 **Hỗ trợ**

- **Email**: support@vattu.com
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

---

**🔥 Được phát triển với Firebase Realtime Database**