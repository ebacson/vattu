# 🔐 Hướng dẫn thiết lập OAuth 2.0 cho Google Sheets API

## 📋 **Tổng quan**
Để có thể ghi dữ liệu trực tiếp vào Google Sheets, bạn cần thiết lập OAuth 2.0 authentication. Đây là hướng dẫn chi tiết từng bước.

## 🚀 **Bước 1: Tạo Google Cloud Project**

### 1.1 Truy cập Google Cloud Console
- Đi đến: https://console.cloud.google.com/
- Đăng nhập bằng tài khoản Google của bạn

### 1.2 Tạo Project mới (nếu chưa có)
- Nhấn **"Select a project"** ở góc trên
- Nhấn **"New Project"**
- **Project name:** `Vattu Management System`
- Nhấn **"Create"**

## 🔧 **Bước 2: Kích hoạt Google Sheets API**

### 2.1 Enable APIs
- Vào **"APIs & Services"** → **"Library"**
- Tìm kiếm **"Google Sheets API"**
- Nhấn **"Enable"**
- Tìm kiếm **"Google Drive API"** 
- Nhấn **"Enable"**

## 🔑 **Bước 3: Tạo OAuth 2.0 Credentials**

### 3.1 Tạo OAuth Client ID
- Vào **"APIs & Services"** → **"Credentials"**
- Nhấn **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

### 3.2 Cấu hình OAuth Consent Screen
- Nếu chưa có, nhấn **"Configure Consent Screen"**
- Chọn **"External"** → **"Create"**
- **App name:** `Vattu Management System`
- **User support email:** Email của bạn
- **Developer contact information:** Email của bạn
- Nhấn **"Save and Continue"** → **"Save and Continue"** → **"Save and Continue"**

### 3.3 Tạo OAuth Client ID
- **Application type:** `Web application`
- **Name:** `Vattu Management App`
- **Authorized JavaScript origins:**
  ```
  http://localhost:8000
  http://localhost:3001
  https://yourdomain.com (nếu deploy)
  ```
- **Authorized redirect URIs:**
  ```
  http://localhost:8000/oauth-callback.html
  http://localhost:3001/oauth-callback.html
  https://yourdomain.com/oauth-callback.html (nếu deploy)
  ```
- Nhấn **"Create"**

### 3.4 Tải về credentials
- Sau khi tạo, sẽ hiện popup với thông tin credentials
- Nhấn **"Download JSON"** để tải file credentials
- **Lưu file này an toàn** (không commit vào Git!)

## ⚙️ **Bước 4: Cấu hình ứng dụng**

### 4.1 Cập nhật oauth-config.js
Mở file `oauth-config.js` và thay thế:

```javascript
const OAUTH_CONFIG = {
    clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com', // Thay bằng Client ID từ Google Console
    redirectUri: 'http://localhost:8000/oauth-callback.html',
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
    ]
};
```

### 4.2 Cập nhật server.js
Mở file `server.js` và thay thế:

```javascript
const OAUTH_CONFIG = {
    clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com', // Thay bằng Client ID
    clientSecret: 'YOUR_CLIENT_SECRET_HERE', // Thay bằng Client Secret
    redirectUri: 'http://localhost:3001/oauth-callback.html'
};
```

## 🛠️ **Bước 5: Cài đặt và chạy**

### 5.1 Cài đặt Node.js dependencies
```bash
npm install
```

### 5.2 Chạy ứng dụng

**Option 1: Chạy với OAuth (Recommended)**
```bash
# Terminal 1: Chạy OAuth server
npm start

# Terminal 2: Chạy static server (nếu cần)
python3 -m http.server 8000
```

**Option 2: Chỉ chạy static server (không có OAuth)**
```bash
python3 -m http.server 8000
```

### 5.3 Truy cập ứng dụng
- Mở trình duyệt: http://localhost:3001 (nếu dùng OAuth)
- Hoặc: http://localhost:8000 (nếu chỉ dùng static server)

## 🔐 **Bước 6: Đăng nhập Google**

### 6.1 Đăng nhập lần đầu
1. Nhấn button **"Đăng nhập Google"** trong ứng dụng
2. Popup sẽ mở trang đăng nhập Google
3. Chọn tài khoản Google và cấp quyền
4. Popup sẽ tự động đóng sau khi đăng nhập thành công

### 6.2 Đồng bộ dữ liệu
1. Sau khi đăng nhập, button sẽ đổi thành **"Đồng bộ Google Sheets"**
2. Nhấn button để đồng bộ dữ liệu
3. Dữ liệu sẽ được ghi trực tiếp vào Google Sheets

## 📊 **Cấu trúc Google Sheets**

Ứng dụng sẽ tự động tạo và đồng bộ dữ liệu vào 4 sheets:

### Sheet 1: "Vật Tư" 
- ID, Mã VT, Tên Vật Tư, Kho, Danh Mục, Tình Trạng, Nguồn Gốc, Ngày Nhập, Sự Vụ ID, Mô Tả

### Sheet 2: "Sự Vụ"
- ID, Tên Sự Vụ, Loại, Mô Tả, Địa Điểm, Ưu Tiên, Trạng Thái, Ngày Tạo, Hạn Hoàn Thành, Người Tạo, Vật Tư ID, Vật Tư Hoàn Thành, Ghi Chú

### Sheet 3: "Chuyển Kho"
- ID, Loại, Sự Vụ ID, Từ Kho, Đến Kho, Vật Tư ID, Trạng Thái, Ngày Tạo, Ngày Xác Nhận, Ghi Chú, Người Tạo, Người Xác Nhận

### Sheet 4: "Log"
- ID, Loại, Hành Động, Chi Tiết, Thời Gian, Người Thực Hiện

## ⚠️ **Lưu ý quan trọng**

### Bảo mật
- **KHÔNG BAO GIỜ** commit file credentials vào Git
- Thêm `oauth-config.js` và `server.js` vào `.gitignore`
- Chỉ chia sẻ Client ID, không chia sẻ Client Secret

### Production
- Đổi `localhost` thành domain thực tế
- Sử dụng HTTPS trong production
- Cập nhật redirect URIs trong Google Console

### Troubleshooting
- **"Invalid client"**: Kiểm tra Client ID
- **"Redirect URI mismatch"**: Kiểm tra redirect URIs
- **"Access denied"**: Kiểm tra OAuth consent screen
- **"Quota exceeded"**: Google Sheets API có giới hạn requests

## 🆘 **Hỗ trợ**

Nếu gặp vấn đề:
1. Kiểm tra Console trong browser (F12)
2. Kiểm tra logs trong terminal
3. Đảm bảo tất cả URLs và credentials đúng
4. Kiểm tra Google Sheets có được share với tài khoản Google không

---

**🎉 Sau khi hoàn thành, bạn sẽ có thể đồng bộ dữ liệu trực tiếp với Google Sheets!**
