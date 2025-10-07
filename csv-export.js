// CSV Export for GitHub Pages (No server required)
function generateCSVData() {
    const data = {
        inventory: inventoryData,
        tasks: tasksData,
        transfers: transfersData,
        logs: logsData
    };
    
    return data;
}

function convertToCSV(data) {
    let csv = '';
    
    // Inventory CSV
    if (data.inventory && data.inventory.length > 0) {
        csv += '=== VẬT TƯ ===\n';
        csv += 'ID,Mã VT,Tên Vật Tư,Kho,Danh Mục,Tình Trạng,Nguồn Gốc,Ngày Nhập,Sự Vụ ID,Mô Tả\n';
        
        data.inventory.forEach(item => {
            csv += `"${item.id}","${item.code}","${item.name}","${item.warehouse}","${item.category || ''}","${item.condition}","${item.source || ''}","${formatDateForCSV(item.dateAdded)}","${item.taskId || ''}","${item.description || ''}"\n`;
        });
        
        csv += '\n';
    }
    
    // Tasks CSV
    if (data.tasks && data.tasks.length > 0) {
        csv += '=== SỰ VỤ ===\n';
        csv += 'ID,Tên Sự Vụ,Loại,Mô Tả,Địa Điểm,Ưu Tiên,Trạng Thái,Ngày Tạo,Hạn Hoàn Thành,Người Tạo,Vật Tư ID,Vật Tư Hoàn Thành,Ghi Chú\n';
        
        data.tasks.forEach(task => {
            csv += `"${task.id}","${task.name}","${task.type}","${task.description}","${task.location || ''}","${task.priority}","${task.status}","${formatDateForCSV(task.createdDate)}","${formatDateForCSV(task.deadline)}","${task.createdBy}","${task.assignedItems ? task.assignedItems.join(', ') : ''}","${task.completedItems ? task.completedItems.join(', ') : ''}","${task.notes || ''}"\n`;
        });
        
        csv += '\n';
    }
    
    // Transfers CSV
    if (data.transfers && data.transfers.length > 0) {
        csv += '=== CHUYỂN KHO ===\n';
        csv += 'ID,Loại,Sự Vụ ID,Từ Kho,Đến Kho,Vật Tư ID,Trạng Thái,Ngày Tạo,Ngày Xác Nhận,Ghi Chú,Người Tạo,Người Xác Nhận\n';
        
        data.transfers.forEach(transfer => {
            csv += `"${transfer.id}","${transfer.type}","${transfer.taskId || ''}","${transfer.fromWarehouse}","${transfer.toWarehouse}","${transfer.items ? transfer.items.join(', ') : ''}","${transfer.status}","${formatDateTimeForCSV(transfer.createdDate)}","${formatDateTimeForCSV(transfer.confirmedDate)}","${transfer.notes || ''}","${transfer.createdBy || ''}","${transfer.confirmedBy || ''}"\n`;
        });
        
        csv += '\n';
    }
    
    // Logs CSV
    if (data.logs && data.logs.length > 0) {
        csv += '=== LOG ===\n';
        csv += 'ID,Loại,Hành Động,Chi Tiết,Thời Gian,Người Thực Hiện\n';
        
        data.logs.forEach(log => {
            csv += `"${log.id}","${log.type}","${log.action}","${log.details}","${formatDateTimeForCSV(log.timestamp)}","${log.user}"\n`;
        });
    }
    
    return csv;
}

function formatDateForCSV(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
}

function formatDateTimeForCSV(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('vi-VN');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Export CSV function
async function exportToCSV() {
    try {
        showLoading();
        
        const data = generateCSVData();
        const csvContent = convertToCSV(data);
        
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `vattu-bao-cao-${timestamp}.csv`;
        
        downloadCSV(csvContent, filename);
        
        showToast('success', 'Xuất CSV thành công!', `File ${filename} đã được tải về.`);
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showToast('error', 'Lỗi xuất CSV!', error.message);
    } finally {
        hideLoading();
    }
}

// Make exportToCSV available globally
window.exportToCSV = exportToCSV;
