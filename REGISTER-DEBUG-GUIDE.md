# 🔧 Hướng dẫn Debug Lỗi Đăng Ký

## ❌ **Vấn đề: Không đăng ký được**

## ✅ **Các bước debug:**

### **1. Kiểm tra với test page:**
- Truy cập: http://localhost:8000/test-register-debug.html
- Click "Check Firebase" để kiểm tra kết nối Firebase
- Click "Test Register" để test đăng ký
- Xem debug info và error messages

### **2. Kiểm tra browser console:**
- Mở trang đăng ký: http://localhost:8000/auth.html
- Nhấn F12 để mở Developer Tools
- Chọn tab "Console"
- Thử đăng ký và xem error messages

### **3. Kiểm tra Firebase Console:**
- Mở: https://console.firebase.google.com/project/project-6680116762664948229/database
- Chọn **Realtime Database** > **Rules**
- Đảm bảo rules là:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### **4. Kiểm tra Authentication:**
- Mở Firebase Console
- Chọn **Authentication** > **Sign-in method**
- Enable **Email/Password** authentication
- Save changes

### **5. Các lỗi thường gặp:**

#### **Lỗi 1: Firebase Rules**
```
Error: permission-denied
```
**Giải pháp:** Cấu hình Firebase Rules cho phép read/write

#### **Lỗi 2: Authentication not enabled**
```
Error: auth/operation-not-allowed
```
**Giải pháp:** Enable Email/Password authentication trong Firebase Console

#### **Lỗi 3: Email already exists**
```
Error: auth/email-already-in-use
```
**Giải pháp:** Sử dụng email khác hoặc đăng nhập với email đã có

#### **Lỗi 4: Weak password**
```
Error: auth/weak-password
```
**Giải pháp:** Sử dụng mật khẩu có ít nhất 6 ký tự

#### **Lỗi 5: Invalid email**
```
Error: auth/invalid-email
```
**Giải pháp:** Sử dụng email hợp lệ

### **6. Test với email khác:**
- Thử đăng ký với email khác
- Đảm bảo email chưa được sử dụng
- Sử dụng mật khẩu mạnh (ít nhất 6 ký tự)

### **7. Kiểm tra network:**
- Mở F12 > Network tab
- Thử đăng ký
- Xem có request nào bị lỗi không

### **8. Test với test page:**
- Sử dụng test page để debug chi tiết
- Xem debug info từng bước
- Kiểm tra Firebase connection

## 🔍 **Debug Steps:**

1. **Mở test page:** http://localhost:8000/test-register-debug.html
2. **Click "Check Firebase"** - Kiểm tra kết nối Firebase
3. **Click "Test Register"** - Test đăng ký với dữ liệu mẫu
4. **Xem debug info** - Kiểm tra từng bước
5. **Kiểm tra browser console** - Xem error messages
6. **Kiểm tra Firebase Console** - Xem dữ liệu có được lưu không

## 📊 **Kết quả mong đợi:**

- ✅ Firebase connection OK
- ✅ Registration successful
- ✅ User data saved to Firebase
- ✅ Redirect to main app

## 🆘 **Nếu vẫn lỗi:**

1. **Kiểm tra Firebase project status**
2. **Kiểm tra billing (nếu cần)**
3. **Thử tạo project Firebase mới**
4. **Kiểm tra network/firewall**
5. **Liên hệ Firebase support**

---

**Hãy sử dụng test page để debug chi tiết lỗi đăng ký!**
