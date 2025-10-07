# 🐙 GitHub Pages Setup Guide

## 📋 **Tổng quan**
GitHub Pages cho phép host website miễn phí từ GitHub repository:
- ✅ Miễn phí
- ✅ HTTPS tự động
- ✅ Custom domain (tùy chọn)
- ✅ Dễ deploy
- ✅ Tích hợp với GitHub

## 🚀 **Bước 1: Tạo GitHub Repository**

### 1.1 Tạo repository mới
1. Truy cập: https://github.com/new
2. **Repository name:** `vattu-management` (hoặc tên bạn muốn)
3. **Description:** Vattu Management System with Firebase
4. **Public** (cần thiết cho GitHub Pages miễn phí)
5. Nhấn **"Create repository"**

### 1.2 Clone repository về máy
```bash
# Thay YOUR_USERNAME bằng tên GitHub của bạn
git clone https://github.com/YOUR_USERNAME/vattu-management.git
cd vattu-management
```

## 📁 **Bước 2: Chuẩn bị files cho GitHub Pages**

### 2.1 Tạo file `.gitignore`
```bash
# Tạo file .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Firebase credentials (IMPORTANT: Never commit!)
serviceAccountKey.json
firebase-config.js

# Logs
*.log
npm-debug.log*

# Runtime data
pids
*.pid
*.seed

# Coverage directory
coverage/

# Environment variables
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
EOF
```

### 2.2 Tạo file `index.html` cho GitHub Pages
```bash
# Copy file index.html hiện tại
cp index.html index.html.backup

# Tạo index.html mới cho GitHub Pages
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vattu Management System</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- Nội dung HTML giống như file gốc -->
    <!-- Nhưng cập nhật Firebase config cho production -->
</body>
</html>
EOF
```

## 🔥 **Bước 3: Cấu hình Firebase cho Production**

### 3.1 Tạo file `firebase-config-prod.js`
```bash
cat > firebase-config-prod.js << 'EOF'
// Firebase Configuration for Production (GitHub Pages)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, push, update, remove, onValue, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase config - Production
const firebaseConfig = {
    apiKey: "AIzaSyAoLWS5iRF9HalbcQQ7akw7iuVgNKM3SV4",
    authDomain: "project-6680116762664948229.firebaseapp.com",
    databaseURL: "https://project-6680116762664948229-default-rtdb.firebaseio.com",
    projectId: "project-6680116762664948229",
    storageBucket: "project-6680116762664948229.firebasestorage.app",
    messagingSenderId: "814890355043",
    appId: "1:814890355043:web:5b2dfd1a0223640c17eb56",
    measurementId: "G-CRXF2ZH941"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Rest of the code same as firebase-config.js
// ... (copy from firebase-config.js)
EOF
```

### 3.2 Cập nhật Firebase Database Rules
1. Truy cập: https://console.firebase.google.com/project/project-6680116762664948229
2. Vào **Realtime Database** → **Rules**
3. Cập nhật rules cho production:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## 🚀 **Bước 4: Deploy lên GitHub**

### 4.1 Commit và push code
```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: Vattu Management System"

# Push to GitHub
git push origin main
```

### 4.2 Enable GitHub Pages
1. Truy cập repository trên GitHub
2. Vào **Settings** → **Pages**
3. **Source:** Deploy from a branch
4. **Branch:** main
5. **Folder:** / (root)
6. Nhấn **Save**

### 4.3 Truy cập website
URL sẽ là: `https://YOUR_USERNAME.github.io/vattu-management`

## ⚠️ **Lưu ý quan trọng**

### 1. Excel Export không hoạt động trên GitHub Pages
- GitHub Pages chỉ host static files
- Cần giải pháp khác cho Excel export

### 2. Giải pháp cho Excel Export:

#### Option A: Sử dụng Vercel Functions
```bash
# Tạo file api/export-excel.js trong repository
mkdir api
cat > api/export-excel.js << 'EOF'
// Vercel Function for Excel Export
// Code từ excel-server.js
EOF
```

#### Option B: Export CSV thay vì Excel
```javascript
// Trong firebase-integration.js
function exportToCSV() {
    // Export CSV thay vì Excel
    // Không cần server backend
}
```

#### Option C: Sử dụng Google Sheets API
```javascript
// Tích hợp với Google Sheets để export
// Sử dụng API key (không cần OAuth)
```

## 🔧 **Cập nhật code cho GitHub Pages**

### Cập nhật `firebase-integration.js`:
```javascript
// Thay đổi Excel export function
async function exportToCSV() {
    try {
        showLoading();
        
        // Export CSV thay vì Excel
        const csvData = generateCSVData();
        downloadCSV(csvData, 'vattu-bao-cao.csv');
        
        showToast('success', 'Xuất CSV thành công!', 'File CSV đã được tải về.');
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showToast('error', 'Lỗi xuất CSV!', error.message);
    } finally {
        hideLoading();
    }
}
```

## 📊 **Workflow hoàn chỉnh**

1. **Code** → GitHub Repository
2. **Deploy** → GitHub Pages
3. **Database** → Firebase Realtime Database
4. **Export** → CSV (hoặc Vercel Functions)

## 🎯 **Kết quả**

- **Website:** https://YOUR_USERNAME.github.io/vattu-management
- **Database:** Firebase Realtime Database
- **Cost:** Miễn phí
- **Custom Domain:** Có thể cấu hình

## 🆘 **Troubleshooting**

### Lỗi "Firebase not initialized"
- Kiểm tra Firebase config
- Kiểm tra Database rules

### Lỗi "Excel export failed"
- GitHub Pages không hỗ trợ server-side code
- Sử dụng CSV export hoặc Vercel Functions

### Lỗi "Permission denied"
- Kiểm tra Firebase Database rules
- Đảm bảo authentication hoạt động

---

**🎉 Bạn sẽ có một ứng dụng web miễn phí trên GitHub Pages!**
