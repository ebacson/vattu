# 🚀 Hướng dẫn Setup nhanh Firebase Realtime Database

## ✅ **Bước 1: Firebase đã được cấu hình**
Firebase config đã được cập nhật với thông số của bạn:
- **Project ID:** `project-6680116762664948229`
- **Database URL:** `https://project-6680116762664948229-default-rtdb.firebaseio.com`

## 🔑 **Bước 2: Tạo Service Account (Quan trọng)**

### 2.1 Truy cập Firebase Console
1. Đi đến: https://console.firebase.google.com/
2. Chọn project: `project-6680116762664948229`

### 2.2 Tạo Service Account
1. Vào **"Project Settings"** (⚙️ icon)
2. Chọn tab **"Service accounts"**
3. Nhấn **"Generate new private key"**
4. Tải file JSON về máy
5. **Đổi tên file thành:** `serviceAccountKey.json`
6. **Đặt file vào thư mục project:** `/Users/tabacson/Desktop/Vattu/`

### 2.3 Kiểm tra file
File `serviceAccountKey.json` phải có cấu trúc như sau:
```json
{
  "type": "service_account",
  "project_id": "project-6680116762664948229",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@project-6680116762664948229.iam.gserviceaccount.com",
  ...
}
```

## 🛠️ **Bước 3: Cài đặt và chạy**

### 3.1 Cài đặt dependencies
```bash
cd /Users/tabacson/Desktop/Vattu
npm install
```

### 3.2 Chạy ứng dụng
```bash
# Terminal 1: Excel Export Server
npm start

# Terminal 2: Static Server
python3 -m http.server 8000
```

### 3.3 Truy cập ứng dụng
- **URL:** http://localhost:8000
- **Excel API:** http://localhost:3002

## 🔥 **Bước 4: Kiểm tra kết nối**

### 4.1 Kiểm tra Firebase
1. Mở http://localhost:8000
2. Xem status indicator ở góc trên bên phải
3. **"Đã kết nối Firebase Realtime DB"** = thành công ✅
4. **"Chưa kết nối Firebase"** = có lỗi ❌

### 4.2 Kiểm tra Console
1. Mở Developer Tools (F12)
2. Xem Console tab
3. Tìm log: `🔥 Firebase auth initialized`

### 4.3 Test tạo dữ liệu
1. **Tạo sự vụ** → Kiểm tra Firebase Console → Realtime Database
2. **Thêm vật tư** → Kiểm tra node `inventory`
3. **Xuất Excel** → Nhấn "Xuất báo cáo Excel"

## 📊 **Bước 5: Test Excel Export**

### 5.1 Tạo dữ liệu test
1. Tạo 1-2 sự vụ
2. Thêm 1-2 vật tư
3. Tạo 1 chuyển kho

### 5.2 Xuất báo cáo
1. Nhấn **"Xuất báo cáo Excel"**
2. File Excel sẽ được tải về với 5 sheets:
   - **Vật Tư** - Danh sách vật tư
   - **Sự Vụ** - Danh sách sự vụ
   - **Chuyển Kho** - Danh sách chuyển kho
   - **Log** - Lịch sử hoạt động
   - **Tổng Kết** - Thống kê tổng quan

## 🆘 **Troubleshooting**

### Lỗi "Firebase not initialized"
- ✅ Kiểm tra `firebase-config.js` đã có config đúng
- ✅ Kiểm tra Console errors (F12)

### Lỗi "Service account not found"
- ✅ Kiểm tra file `serviceAccountKey.json` có trong thư mục
- ✅ Kiểm tra tên file chính xác (không có space)

### Lỗi "Excel export failed"
- ✅ Kiểm tra Excel server chạy (port 3002)
- ✅ Kiểm tra Firebase Console → Realtime Database có dữ liệu

### Lỗi "Permission denied"
- ✅ Kiểm tra Realtime Database rules trong Firebase Console
- ✅ Đảm bảo rules cho phép read/write

## 🎯 **Kết quả mong đợi**

Sau khi setup thành công:
- ✅ Firebase kết nối thành công
- ✅ Tạo được sự vụ, vật tư, chuyển kho
- ✅ Dữ liệu lưu vào Firebase Realtime Database
- ✅ Xuất được file Excel với đầy đủ dữ liệu
- ✅ Status indicator hiển thị "Đã kết nối Firebase Realtime DB"

## 📞 **Hỗ trợ**

Nếu gặp vấn đề:
1. Kiểm tra Console errors (F12)
2. Kiểm tra terminal logs
3. Kiểm tra Firebase Console → Realtime Database
4. Đảm bảo file `serviceAccountKey.json` đúng

---

**🎉 Chúc bạn setup thành công! Hệ thống quản lý vật tư với Firebase Realtime Database và Excel export sẵn sàng sử dụng!**
