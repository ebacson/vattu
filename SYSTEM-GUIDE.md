# 📋 Hướng Dẫn Sử Dụng Hệ Thống Quản Lý Vật Tư 2 Kho

## 🏢 Tổng Quan Hệ Thống

Hệ thống quản lý vật tư được thiết kế đặc biệt cho 2 kho:
- **Kho Net**: Quản lý vật tư sẵn sàng
- **Kho Hạ Tầng**: Quản lý vật tư đang sử dụng trong sự vụ

## 🔄 Quy Trình Hoạt Động

### 1. **Tạo Sự Vụ** (Kho Hạ Tầng)
- Người dùng kho Hạ Tầng tạo sự vụ mới
- Bao gồm: tên, loại, mô tả, địa điểm, mức độ ưu tiên
- Các loại sự vụ: Xử lý, Lắp đặt, Swap, Nâng cấp, Bảo trì

### 2. **Yêu Cầu Vật Tư** (Kho Hạ Tầng → Kho Net)
- Kho Hạ Tầng yêu cầu vật tư cần thiết cho sự vụ
- Tạo chuyển kho từ Kho Net sang Kho Hạ Tầng
- Kho Net xác nhận và chuẩn bị vật tư

### 3. **Giao Nhận Vật Tư**
- Kho Hạ Tầng nhận vật tư và xác nhận
- Vật tư chuyển từ trạng thái "Sẵn sàng" → "Đang sử dụng"
- Ghi log thời gian giao nhận

### 4. **Hoàn Thành Sự Vụ**
- Kho Hạ Tầng cập nhật trạng thái sự vụ
- Nhập thông tin vật tư thu hồi (nếu có)
- Tạo chuyển kho trả về Kho Net

### 5. **Trả Vật Tư** (Kho Hạ Tầng → Kho Net)
- Chuyển vật tư thu hồi về Kho Net
- Kho Net xác nhận nhận lại vật tư
- Cập nhật nguồn gốc và tình trạng vật tư

## 📊 Các Tab Chức Năng

### 🏠 **Tab Tổng Quan**
- **Thống kê 2 kho**: Số lượng vật tư, trạng thái
- **Hoạt động gần đây**: Log các thao tác mới nhất
- **Sự vụ đang hoạt động**: Danh sách sự vụ đang thực hiện
- **Thao tác nhanh**: Tạo sự vụ, chuyển kho, thêm vật tư

### 📦 **Tab Quản Lý Vật Tư**
- **Danh sách vật tư**: Hiển thị tất cả vật tư trong 2 kho
- **Bộ lọc**: Theo kho, trạng thái, tìm kiếm
- **Thông tin chi tiết**: Mã, tên, kho, tình trạng, nguồn gốc, ngày nhập
- **Thao tác**: Chỉnh sửa, xem lịch sử, cập nhật tình trạng

### 🎯 **Tab Quản Lý Sự Vụ**
- **Danh sách sự vụ**: Tất cả sự vụ với trạng thái chi tiết
- **Bộ lọc**: Theo trạng thái, ngày
- **Thông tin sự vụ**: Tên, loại, mô tả, địa điểm, mức độ ưu tiên
- **Thao tác**: Xem chi tiết, yêu cầu vật tư, cập nhật, xem lịch sử

### 🔄 **Tab Chuyển Kho**
- **Danh sách chuyển kho**: Tất cả giao dịch chuyển vật tư
- **Bộ lọc**: Theo trạng thái, loại chuyển kho
- **Thông tin**: Từ kho nào → kho nào, sự vụ liên quan, vật tư
- **Thao tác**: Xác nhận, xem chi tiết, xem lịch sử

### 📜 **Tab Lịch Sử**
- **Log hoạt động**: Tất cả thao tác được ghi lại
- **Bộ lọc**: Theo loại, ngày, tìm kiếm
- **Thông tin**: Thời gian, người thực hiện, chi tiết thao tác
- **Xuất log**: Tải về file JSON

### 📈 **Tab Thống Kê**
- **Phân bố vật tư theo kho**: Biểu đồ doughnut
- **Trạng thái sự vụ**: Biểu đồ pie
- **Lượng chuyển kho theo tháng**: Biểu đồ line
- **Hiệu suất xử lý sự vụ**: Biểu đồ bar

## 🎯 Các Trạng Thái Vật Tư

### **Sẵn sàng** (Available)
- Vật tư có thể sử dụng ngay
- Ở trong Kho Net hoặc Kho Hạ Tầng
- Chưa được gán cho sự vụ nào

### **Đang sử dụng** (In-use)
- Vật tư đang được sử dụng trong sự vụ
- Thường ở Kho Hạ Tầng
- Đã được gán cho sự vụ cụ thể

### **Bảo trì** (Maintenance)
- Vật tư đang được bảo trì, sửa chữa
- Không thể sử dụng tạm thời
- Có thể ở bất kỳ kho nào

### **Hỏng** (Damaged)
- Vật tư bị hỏng, không thể sử dụng
- Cần thay thế hoặc xử lý
- Có thể ở bất kỳ kho nào

## 📋 Các Trạng Thái Sự Vụ

### **Chờ xử lý** (Pending)
- Sự vụ mới được tạo
- Chưa được gán vật tư
- Chờ yêu cầu vật tư

### **Đang thực hiện** (In-progress)
- Sự vụ đang được thực hiện
- Đã được gán vật tư
- Đang trong quá trình xử lý

### **Chờ xác nhận** (Waiting-confirmation)
- Hoàn thành sự vụ, chờ xác nhận
- Đang chờ trả vật tư
- Chờ kho Net xác nhận nhận lại

### **Hoàn thành** (Completed)
- Sự vụ đã hoàn thành
- Vật tư đã được trả về
- Tất cả thao tác đã xác nhận

### **Hủy bỏ** (Cancelled)
- Sự vụ bị hủy bỏ
- Vật tư đã được trả về kho
- Không hoàn thành

## 🔄 Các Loại Chuyển Kho

### **Yêu cầu** (Request)
- Từ Kho Net → Kho Hạ Tầng
- Kho Hạ Tầng yêu cầu vật tư cho sự vụ
- Kho Net chuẩn bị và giao vật tư

### **Trả về** (Return)
- Từ Kho Hạ Tầng → Kho Net
- Trả vật tư sau khi hoàn thành sự vụ
- Kho Net xác nhận nhận lại

## 📝 Quản Lý Nguồn Gốc Vật Tư

Mỗi vật tư có thông tin nguồn gốc:
- **Mới nhập kho**: Vật tư mới
- **Thu hồi từ trạm ABC**: Vật tư thu hồi từ trạm cụ thể
- **Thay cho trạm XYZ**: Vật tư thay thế cho trạm cụ thể
- **Chuyển từ kho Net**: Vật tư chuyển từ kho khác

## 🔍 Tìm Kiếm và Lọc

### **Tìm kiếm vật tư:**
- Theo mã vật tư
- Theo tên vật tư
- Theo danh mục
- Theo nhà cung cấp

### **Lọc theo kho:**
- Tất cả kho
- Chỉ Kho Net
- Chỉ Kho Hạ Tầng

### **Lọc theo trạng thái:**
- Tất cả trạng thái
- Sẵn sàng
- Đang sử dụng
- Bảo trì
- Hỏng

## 📊 Báo Cáo và Thống Kê

### **Thống kê theo kho:**
- Số lượng vật tư mỗi kho
- Vật tư sẵn sàng/đang sử dụng
- Chuyển kho chờ xử lý

### **Thống kê sự vụ:**
- Sự vụ theo trạng thái
- Hiệu suất hoàn thành
- Thời gian xử lý trung bình

### **Thống kê chuyển kho:**
- Lượng chuyển kho theo thời gian
- Tỷ lệ yêu cầu vs trả về
- Thời gian xử lý chuyển kho

## 🚀 Các Tính Năng Nâng Cao

### **Logging System:**
- Ghi lại mọi thao tác
- Thời gian chính xác
- Người thực hiện
- Chi tiết thao tác

### **Confirmation System:**
- Xác nhận giao nhận
- Xác nhận hoàn thành
- Xác nhận trả về
- Audit trail đầy đủ

### **Priority Management:**
- Mức độ ưu tiên sự vụ
- Thấp, Trung bình, Cao, Khẩn cấp
- Cảnh báo sự vụ khẩn cấp

### **Deadline Tracking:**
- Theo dõi hạn hoàn thành
- Cảnh báo sắp hết hạn
- Thống kê hoàn thành đúng hạn

## 💡 Mẹo Sử Dụng

### **Hiệu quả:**
1. Sử dụng bộ lọc để tìm kiếm nhanh
2. Thường xuyên cập nhật trạng thái sự vụ
3. Ghi chú chi tiết khi chuyển kho
4. Kiểm tra log để theo dõi hoạt động

### **Bảo mật:**
1. Chỉ xác nhận khi đã kiểm tra thực tế
2. Ghi chú rõ ràng nguồn gốc vật tư
3. Backup dữ liệu định kỳ
4. Kiểm tra log thường xuyên

### **Tối ưu:**
1. Tạo sự vụ với mô tả chi tiết
2. Ưu tiên sự vụ khẩn cấp
3. Theo dõi vật tư sắp hết
4. Lên kế hoạch trả vật tư

---

**Lưu ý**: Hệ thống được thiết kế để hỗ trợ quy trình làm việc thực tế. Hãy sử dụng đúng quy trình để đảm bảo hiệu quả và độ chính xác cao nhất.
