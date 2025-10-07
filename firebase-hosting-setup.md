# 🔥 Firebase Hosting Setup Guide

## 📋 **Tổng quan**
Firebase Hosting là lựa chọn tốt nhất cho project Firebase của bạn vì:
- ✅ Tích hợp sẵn với Firebase
- ✅ Miễn phí
- ✅ CDN toàn cầu
- ✅ HTTPS tự động
- ✅ Dễ deploy

## 🚀 **Cài đặt Firebase CLI**

### Bước 1: Cài đặt Firebase CLI
```bash
npm install -g firebase-tools
```

### Bước 2: Login Firebase
```bash
firebase login
```

### Bước 3: Khởi tạo Firebase project
```bash
firebase init hosting
```

Chọn:
- **Project:** project-6680116762664948229
- **Public directory:** . (current directory)
- **Single-page app:** Yes
- **Overwrite index.html:** No

## 📁 **Cấu hình Firebase Hosting**

### Tạo file `firebase.json`:
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/serviceAccountKey.json",
      "**/test-firebase-connection.js",
      "**/excel-server.js",
      "**/firebase-admin.js",
      "**/package.json",
      "**/package-lock.json",
      "**/start.sh",
      "**/README.md",
      "**/QUICK-SETUP-FIREBASE.md",
      "**/FIREBASE-SETUP-GUIDE.md",
      "**/GOOGLE-SHEETS-STRUCTURE.md",
      "**/SYSTEM-GUIDE.md",
      "**/OAUTH-SETUP-GUIDE.md",
      "**/firebase-hosting-setup.md"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 🚀 **Deploy lên Firebase Hosting**

### Deploy static files:
```bash
firebase deploy --only hosting
```

### URL sẽ là:
```
https://project-6680116762664948229.web.app
```

## ⚠️ **Lưu ý quan trọng**

### 1. Excel Server không chạy trên Firebase Hosting
- Firebase Hosting chỉ host static files
- Excel server cần chạy trên Node.js server khác

### 2. Giải pháp cho Excel Export:
#### Option A: Sử dụng Firebase Functions
```bash
# Cài đặt Firebase Functions
firebase init functions

# Deploy functions
firebase deploy --only functions
```

#### Option B: Sử dụng service khác cho Excel API
- Vercel Functions
- Netlify Functions
- Railway/Render

#### Option C: Export CSV thay vì Excel
- Đơn giản hơn
- Không cần server backend

## 🔧 **Cập nhật code cho hosting**

### Cập nhật Excel export URL trong `firebase-integration.js`:
```javascript
// Thay đổi từ localhost sang production URL
const response = await fetch('https://your-excel-api.vercel.app/api/export/excel');
```

## 📊 **Workflow hoàn chỉnh**

1. **Static files** → Firebase Hosting
2. **Excel API** → Vercel/Netlify Functions
3. **Database** → Firebase Realtime Database
4. **Authentication** → Firebase Auth

## 🎯 **Kết quả**

- **Website:** https://project-6680116762664948229.web.app
- **Database:** Firebase Realtime Database
- **Excel API:** Vercel/Netlify Functions
- **Cost:** Miễn phí (với giới hạn)

---

**🎉 Bạn sẽ có một ứng dụng web hoàn chỉnh chạy trên internet!**
