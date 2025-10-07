# 🔥 Vattu Management System v2.0

Hệ thống quản lý vật tư hoàn chỉnh với **Firebase backend** và **xuất báo cáo Excel**.

## ✨ **Tính năng mới v2.0**

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
- **Kho Net** - Kho chính cung cấp vật tư
- **Kho Hạ Tầng** - Kho thực hiện sự vụ

### **Quản lý sự vụ**
- Tạo, theo dõi và quản lý sự vụ
- Phân loại: Xử lý, Lắp đặt, Swap, Nâng cấp
- Trạng thái: Pending, In Progress, Completed

### **Chuyển kho thông minh**
- Chuyển vật tư giữa các kho
- Xác nhận giao nhận
- Theo dõi trạng thái chuyển kho

### **Báo cáo Excel**
- **Sheet 1**: Danh sách vật tư
- **Sheet 2**: Danh sách sự vụ  
- **Sheet 3**: Danh sách chuyển kho
- **Sheet 4**: Lịch sử log
- **Sheet 5**: Tổng kết thống kê

## 🚀 **Cài đặt nhanh**

### **Bước 1: Cài đặt dependencies**
```bash
npm install
```

### **Bước 2: Cấu hình Firebase**
✅ **Firebase config đã được cập nhật!**
- Project ID: `project-6680116762664948229`
- Database URL: `https://project-6680116762664948229-default-rtdb.firebaseio.com`

**Chỉ cần tạo Service Account:**
1. Truy cập: https://console.firebase.google.com/project/project-6680116762664948229
2. Vào **Project Settings** → **Service Accounts**
3. Nhấn **"Generate new private key"**
4. Tải file JSON và đổi tên thành `serviceAccountKey.json`
5. Đặt file vào thư mục project

### **Bước 3: Chạy ứng dụng**

**Cách 1: Tự động (Khuyến nghị)**
```bash
./start.sh
```

**Cách 2: Thủ công**
```bash
# Terminal 1: Excel Export Server
npm start

# Terminal 2: Static Server  
python3 -m http.server 8000

# Truy cập: http://localhost:8000
```

**Cách 3: Test Firebase connection**
```bash
# Test Firebase connection trước
node test-firebase-connection.js
```

## 📖 **Hướng dẫn chi tiết**

- 📋 **[QUICK-SETUP-FIREBASE.md](QUICK-SETUP-FIREBASE.md)** - Setup nhanh Firebase
- 📋 **[FIREBASE-SETUP-GUIDE.md](FIREBASE-SETUP-GUIDE.md)** - Thiết lập Firebase chi tiết
- 📊 **[GOOGLE-SHEETS-STRUCTURE.md](GOOGLE-SHEETS-STRUCTURE.md)** - Cấu trúc dữ liệu
- 🎯 **[SYSTEM-GUIDE.md](SYSTEM-GUIDE.md)** - Hướng dẫn sử dụng
- 🔥 **[demo-firebase.html](demo-firebase.html)** - Demo test Firebase connection

## 🔧 **Cấu trúc project**

```
vattu-management/
├── index.html              # Giao diện chính
├── styles.css              # CSS styling
├── script.js               # Logic chính
├── firebase-config.js      # Firebase client config
├── firebase-integration.js # Firebase integration
├── firebase-admin.js       # Firebase admin SDK
├── excel-server.js         # Excel export server
├── package.json            # Dependencies
├── serviceAccountKey.json  # Firebase service account (tự tạo)
└── exports/                # Thư mục xuất Excel
```

## 📊 **Workflow hoàn chỉnh**

1. **Khởi tạo** → Kết nối Firebase → Load dữ liệu
2. **Tạo sự vụ** → Lưu vào Realtime Database → Cập nhật UI
3. **Thêm vật tư** → Lưu vào Realtime Database → Cập nhật UI  
4. **Chuyển kho** → Lưu vào Realtime Database → Cập nhật UI
5. **Xuất báo cáo** → Tạo Excel file → Tải về

## 🔐 **Bảo mật**

- ✅ Firebase Authentication
- ✅ Realtime Database Security Rules
- ✅ Service Account Protection
- ✅ CORS Configuration
- ✅ Input Validation

## 🎯 **Sử dụng**

### **Tạo dữ liệu**
1. Chọn kho từ dropdown
2. Tạo sự vụ hoặc thêm vật tư
3. Dữ liệu tự động lưu vào Firebase Realtime Database

### **Xuất báo cáo**
1. Nhấn "Xuất báo cáo Excel"
2. File Excel được tạo với 5 sheets
3. Tải về và mở bằng Excel

### **Theo dõi**
1. Xem Dashboard để thống kê
2. Xem Log để theo dõi hoạt động
3. Kiểm tra Firebase Console → Realtime Database

## 🆘 **Troubleshooting**

### **Firebase không kết nối**
- Kiểm tra `firebase-config.js` (có databaseURL)
- Kiểm tra Realtime Database rules
- Kiểm tra Console errors

### **Excel không xuất được**
- Đảm bảo Excel server chạy (port 3002)
- Kiểm tra `serviceAccountKey.json`
- Kiểm tra Firebase permissions

### **Dữ liệu không hiển thị**
- Kiểm tra Firebase Console → Realtime Database
- Kiểm tra Authentication status
- Refresh trang và thử lại

## 📞 **Hỗ trợ**

- 📧 Email: support@vattu.com
- 📱 Phone: +84 xxx xxx xxx
- 🌐 Website: https://vattu.com

---

**🎉 Hệ thống quản lý vật tư hoàn chỉnh với Firebase Realtime Database và Excel export!**