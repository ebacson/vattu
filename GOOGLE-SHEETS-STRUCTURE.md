# 📊 Cấu Trúc Google Sheets cho Hệ Thống Quản Lý Vật Tư 2 Kho

## 📋 Tổng Quan

Hệ thống cần **4 sheet chính** trong Google Sheets để lưu trữ dữ liệu:

1. **Sheet1 - Vật Tư** (Inventory)
2. **Sheet2 - Sự Vụ** (Tasks)  
3. **Sheet3 - Chuyển Kho** (Transfers)
4. **Sheet4 - Log** (Logs)

## 📦 Sheet1 - Vật Tư (Inventory)

### Cấu trúc cột:

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| ID | Mã VT | Tên Vật Tư | Kho | Danh Mục | Tình Trạng | Nguồn Gốc | Ngày Nhập | Sự Vụ ID | Mô Tả |

### Chi tiết từng cột:

- **A - ID**: Số thứ tự (1, 2, 3...)
- **B - Mã VT**: Mã vật tư (VT001, VT002...)
- **C - Tên Vật Tư**: Tên đầy đủ vật tư
- **D - Kho**: `net` hoặc `infrastructure`
- **E - Danh Mục**: Thiết bị mạng, Phụ kiện, Cáp...
- **F - Tình Trạng**: `available`, `in-use`, `maintenance`, `damaged`
- **G - Nguồn Gốc**: Thu hồi từ trạm ABC, thay cho trạm XYZ...
- **H - Ngày Nhập**: Định dạng DD/MM/YYYY
- **I - Sự Vụ ID**: ID của sự vụ (để trống nếu chưa gán)
- **J - Mô Tả**: Mô tả chi tiết vật tư

### Ví dụ dữ liệu:

```
ID | Mã VT | Tên Vật Tư | Kho | Danh Mục | Tình Trạng | Nguồn Gốc | Ngày Nhập | Sự Vụ ID | Mô Tả
1  | VT001 | Switch 24 port | net | Thiết bị mạng | available | Mới nhập kho | 15/01/2024 | | Switch 24 port Gigabit Ethernet
2  | VT002 | Router WiFi | net | Thiết bị mạng | available | Mới nhập kho | 14/01/2024 | | Router WiFi 6 băng tần kép
3  | VT003 | Cáp mạng CAT6 | infrastructure | Phụ kiện | in-use | Chuyển từ kho Net | 13/01/2024 | 1 | Cáp mạng CAT6 UTP 305m
4  | VT004 | Ổ cắm mạng | infrastructure | Phụ kiện | in-use | Chuyển từ kho Net | 12/01/2024 | 1 | Ổ cắm mạng RJ45
```

## 🎯 Sheet2 - Sự Vụ (Tasks)

### Cấu trúc cột:

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ID | Tên Sự Vụ | Loại | Mô Tả | Địa Điểm | Ưu Tiên | Trạng Thái | Ngày Tạo | Hạn Hoàn Thành | Người Tạo | Vật Tư ID | Vật Tư Hoàn Thành | Ghi Chú |

### Chi tiết từng cột:

- **A - ID**: Số thứ tự (1, 2, 3...)
- **B - Tên Sự Vụ**: Tên sự vụ
- **C - Loại**: `xuly`, `lapdat`, `swap`, `nangcap`, `baotri`, `khac`
- **D - Mô Tả**: Mô tả chi tiết sự vụ
- **E - Địa Điểm**: Địa điểm thực hiện
- **F - Ưu Tiên**: `low`, `medium`, `high`, `urgent`
- **G - Trạng Thái**: `pending`, `in-progress`, `waiting-confirmation`, `completed`, `cancelled`
- **H - Ngày Tạo**: Định dạng DD/MM/YYYY
- **I - Hạn Hoàn Thành**: Định dạng DD/MM/YYYY
- **J - Người Tạo**: Kho Net hoặc Kho Hạ Tầng
- **K - Vật Tư ID**: Danh sách ID vật tư (cách nhau bởi dấu phẩy)
- **L - Vật Tư Hoàn Thành**: Danh sách ID vật tư đã hoàn thành
- **M - Ghi Chú**: Ghi chú thêm

### Ví dụ dữ liệu:

```
ID | Tên Sự Vụ | Loại | Mô Tả | Địa Điểm | Ưu Tiên | Trạng Thái | Ngày Tạo | Hạn Hoàn Thành | Người Tạo | Vật Tư ID | Vật Tư Hoàn Thành | Ghi Chú
1  | Lắp đặt trạm mới ABC | lapdat | Lắp đặt thiết bị mạng cho trạm mới tại khu vực ABC | Trạm ABC - Quận 1 | high | in-progress | 10/01/2024 | 20/01/2024 | Kho Hạ Tầng | 3,4 | | Đang chờ vật tư
2  | Nâng cấp trạm XYZ | nangcap | Nâng cấp thiết bị mạng cho trạm XYZ | Trạm XYZ - Quận 2 | medium | pending | 12/01/2024 | 25/01/2024 | Kho Hạ Tầng | | | Chờ lên kế hoạch
```

## 🔄 Sheet3 - Chuyển Kho (Transfers)

### Cấu trúc cột:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ID | Loại | Sự Vụ ID | Từ Kho | Đến Kho | Vật Tư ID | Trạng Thái | Ngày Tạo | Ngày Xác Nhận | Ghi Chú | Người Tạo | Người Xác Nhận |

### Chi tiết từng cột:

- **A - ID**: Số thứ tự (1, 2, 3...)
- **B - Loại**: `request` hoặc `return`
- **C - Sự Vụ ID**: ID của sự vụ liên quan
- **D - Từ Kho**: `net` hoặc `infrastructure`
- **E - Đến Kho**: `net` hoặc `infrastructure`
- **F - Vật Tư ID**: Danh sách ID vật tư (cách nhau bởi dấu phẩy)
- **G - Trạng Thái**: `pending`, `in-transit`, `delivered`, `confirmed`
- **H - Ngày Tạo**: Định dạng DD/MM/YYYY HH:MM
- **I - Ngày Xác Nhận**: Định dạng DD/MM/YYYY HH:MM
- **J - Ghi Chú**: Ghi chú về chuyển kho
- **K - Người Tạo**: Người tạo chuyển kho
- **L - Người Xác Nhận**: Người xác nhận chuyển kho

### Ví dụ dữ liệu:

```
ID | Loại | Sự Vụ ID | Từ Kho | Đến Kho | Vật Tư ID | Trạng Thái | Ngày Tạo | Ngày Xác Nhận | Ghi Chú | Người Tạo | Người Xác Nhận
1  | request | 1 | net | infrastructure | 3,4 | confirmed | 10/01/2024 09:30 | 11/01/2024 14:20 | Vật tư cho sự vụ lắp đặt trạm ABC | Kho Hạ Tầng | Kho Net
```

## 📜 Sheet4 - Log (Logs)

### Cấu trúc cột:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| ID | Loại | Hành Động | Chi Tiết | Thời Gian | Người Thực Hiện |

### Chi tiết từng cột:

- **A - ID**: Số thứ tự (1, 2, 3...)
- **B - Loại**: `transfer`, `task`, `inventory`, `confirmation`
- **C - Hành Động**: Mô tả hành động
- **D - Chi Tiết**: Chi tiết cụ thể
- **E - Thời Gian**: Định dạng DD/MM/YYYY HH:MM:SS
- **F - Người Thực Hiện**: Người thực hiện hành động

### Ví dụ dữ liệu:

```
ID | Loại | Hành Động | Chi Tiết | Thời Gian | Người Thực Hiện
1  | transfer | Chuyển kho | Chuyển 2 vật tư từ Kho Net sang Kho Hạ Tầng | 10/01/2024 09:30:00 | System
2  | task | Tạo sự vụ | Tạo sự vụ: Lắp đặt trạm mới ABC | 10/01/2024 08:00:00 | Kho Hạ Tầng
3  | confirmation | Xác nhận giao nhận | Xác nhận nhận vật tư cho sự vụ #1 | 11/01/2024 14:20:00 | Kho Hạ Tầng
4  | inventory | Thêm vật tư | Thêm vật tư: Switch 24 port vào Kho Net | 15/01/2024 10:15:00 | Kho Net
```

## ⚙️ Cấu Hình API

### Cập nhật trong `script.js`:

```javascript
const GOOGLE_SHEETS_CONFIG = {
    spreadsheetId: 'YOUR_SPREADSHEET_ID',
    ranges: {
        inventory: 'Sheet1!A:J',      // Vật tư
        tasks: 'Sheet2!A:M',          // Sự vụ
        transfers: 'Sheet3!A:L',      // Chuyển kho
        logs: 'Sheet4!A:F'            // Log
    },
    apiKey: 'YOUR_API_KEY'
};
```

## 📝 Lưu Ý Quan Trọng

### 1. **Định dạng dữ liệu:**
- **Ngày tháng**: Sử dụng định dạng DD/MM/YYYY
- **Thời gian**: Sử dụng định dạng DD/MM/YYYY HH:MM:SS
- **Danh sách ID**: Cách nhau bởi dấu phẩy (VD: 1,2,3)
- **Trạng thái**: Sử dụng giá trị chính xác như định nghĩa

### 2. **Quy tắc đặt tên:**
- **Mã vật tư**: Bắt đầu bằng "VT" + 3 chữ số (VT001, VT002...)
- **ID**: Số nguyên dương, tăng dần
- **Kho**: Chỉ `net` hoặc `infrastructure`
- **Trạng thái**: Sử dụng giá trị enum đã định nghĩa

### 3. **Bảo trì dữ liệu:**
- **Không xóa dòng header**
- **Không để trống ID**
- **Cập nhật trạng thái đúng thời điểm**
- **Ghi log mọi thay đổi quan trọng**

### 4. **Backup và đồng bộ:**
- **Xuất dữ liệu định kỳ** để backup
- **Kiểm tra tính nhất quán** giữa các sheet
- **Đồng bộ thường xuyên** với hệ thống

## 🔧 Hướng Dẫn Setup

### Bước 1: Tạo Google Sheets
1. Tạo Google Sheets mới
2. Đổi tên sheet thành: Sheet1, Sheet2, Sheet3, Sheet4
3. Thêm header row cho mỗi sheet theo cấu trúc trên

### Bước 2: Nhập dữ liệu mẫu
1. Copy dữ liệu mẫu từ ví dụ trên
2. Paste vào các sheet tương ứng
3. Kiểm tra định dạng dữ liệu

### Bước 3: Chia sẻ và cấu hình
1. Chia sẻ sheet: "Anyone with the link can view"
2. Copy Spreadsheet ID từ URL
3. Cập nhật cấu hình trong `script.js`

### Bước 4: Test kết nối
1. Mở hệ thống: `http://localhost:8000`
2. Nhấp "Đồng bộ dữ liệu"
3. Kiểm tra dữ liệu được tải đúng

---

**Lưu ý**: Cấu trúc này được thiết kế để hỗ trợ đầy đủ tính năng của hệ thống quản lý vật tư 2 kho. Hãy tuân thủ cấu trúc để đảm bảo hệ thống hoạt động chính xác.
