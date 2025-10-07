// Excel Export Server
const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { initializeFirebaseAdmin, generateFullReport } = require('./firebase-admin.js');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize Firebase Admin
let db;
try {
    db = initializeFirebaseAdmin();
    console.log('🔥 Firebase Admin connected');
} catch (error) {
    console.error('❌ Firebase Admin connection failed:', error);
}

// Helper function to format date
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN');
}

// Generate Excel file from data
function generateExcelFile(data, filename) {
    const workbook = XLSX.utils.book_new();
    
    // Inventory Sheet
    if (data.inventory && data.inventory.length > 0) {
        const inventorySheet = data.inventory.map(item => ({
            'ID': item.id,
            'Mã VT': item.code,
            'Tên Vật Tư': item.name,
            'Kho': item.warehouse,
            'Danh Mục': item.category || '',
            'Tình Trạng': item.condition,
            'Nguồn Gốc': item.source || '',
            'Ngày Nhập': formatDate(item.dateAdded),
            'Sự Vụ ID': item.taskId || '',
            'Mô Tả': item.description || '',
            'Ngày Tạo': formatDate(item.createdAt)
        }));
        
        const ws1 = XLSX.utils.json_to_sheet(inventorySheet);
        XLSX.utils.book_append_sheet(workbook, ws1, 'Vật Tư');
    }
    
    // Tasks Sheet
    if (data.tasks && data.tasks.length > 0) {
        const tasksSheet = data.tasks.map(task => ({
            'ID': task.id,
            'Tên Sự Vụ': task.name,
            'Loại': task.type,
            'Mô Tả': task.description,
            'Địa Điểm': task.location || '',
            'Ưu Tiên': task.priority,
            'Trạng Thái': task.status,
            'Ngày Tạo': formatDate(task.createdDate),
            'Hạn Hoàn Thành': formatDate(task.deadline),
            'Người Tạo': task.createdBy,
            'Vật Tư ID': task.assignedItems ? task.assignedItems.join(', ') : '',
            'Vật Tư Hoàn Thành': task.completedItems ? task.completedItems.join(', ') : '',
            'Ghi Chú': task.notes || ''
        }));
        
        const ws2 = XLSX.utils.json_to_sheet(tasksSheet);
        XLSX.utils.book_append_sheet(workbook, ws2, 'Sự Vụ');
    }
    
    // Transfers Sheet
    if (data.transfers && data.transfers.length > 0) {
        const transfersSheet = data.transfers.map(transfer => ({
            'ID': transfer.id,
            'Loại': transfer.type,
            'Sự Vụ ID': transfer.taskId || '',
            'Từ Kho': transfer.fromWarehouse,
            'Đến Kho': transfer.toWarehouse,
            'Vật Tư ID': transfer.items ? transfer.items.join(', ') : '',
            'Trạng Thái': transfer.status,
            'Ngày Tạo': formatDate(transfer.createdDate),
            'Ngày Xác Nhận': formatDate(transfer.confirmedDate),
            'Ghi Chú': transfer.notes || '',
            'Người Tạo': transfer.createdBy || '',
            'Người Xác Nhận': transfer.confirmedBy || ''
        }));
        
        const ws3 = XLSX.utils.json_to_sheet(transfersSheet);
        XLSX.utils.book_append_sheet(workbook, ws3, 'Chuyển Kho');
    }
    
    // Logs Sheet
    if (data.logs && data.logs.length > 0) {
        const logsSheet = data.logs.map(log => ({
            'ID': log.id,
            'Loại': log.type,
            'Hành Động': log.action,
            'Chi Tiết': log.details,
            'Thời Gian': formatDate(log.timestamp),
            'Người Thực Hiện': log.user
        }));
        
        const ws4 = XLSX.utils.json_to_sheet(logsSheet);
        XLSX.utils.book_append_sheet(workbook, ws4, 'Log');
    }
    
    // Summary Sheet
    const summarySheet = [
        { 'Metric': 'Tổng số vật tư', 'Value': data.summary.totalInventory },
        { 'Metric': 'Tổng số sự vụ', 'Value': data.summary.totalTasks },
        { 'Metric': 'Tổng số chuyển kho', 'Value': data.summary.totalTransfers },
        { 'Metric': 'Tổng số log', 'Value': data.summary.totalLogs },
        { 'Metric': 'Ngày tạo báo cáo', 'Value': formatDate(data.generatedAt) }
    ];
    
    const ws5 = XLSX.utils.json_to_sheet(summarySheet);
    XLSX.utils.book_append_sheet(workbook, ws5, 'Tổng Kết');
    
    // Write file
    const filepath = path.join(__dirname, 'exports', filename);
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    XLSX.writeFile(workbook, filepath);
    return filepath;
}

// API Endpoints
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        firebase: db ? 'Connected' : 'Disconnected'
    });
});

// Generate Excel report
app.get('/api/export/excel', async (req, res) => {
    try {
        console.log('📊 Generating Excel report...');
        
        // Generate report data from Firebase
        const reportData = await generateFullReport();
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `vattu-bao-cao-${timestamp}.xlsx`;
        
        // Generate Excel file
        const filepath = generateExcelFile(reportData, filename);
        
        console.log('✅ Excel report generated:', filename);
        
        // Send file to client
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            } else {
                console.log('📤 File sent to client');
                // Clean up file after sending
                setTimeout(() => {
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                        console.log('🗑️ Temporary file cleaned up');
                    }
                }, 5000);
            }
        });
        
    } catch (error) {
        console.error('❌ Error generating Excel report:', error);
        res.status(500).json({ 
            error: 'Failed to generate Excel report',
            details: error.message 
        });
    }
});

// Generate specific sheet Excel
app.get('/api/export/excel/:sheetType', async (req, res) => {
    try {
        const { sheetType } = req.params;
        console.log(`📊 Generating ${sheetType} Excel...`);
        
        let data = {};
        let filename = '';
        
        switch (sheetType) {
            case 'inventory':
                data.inventory = await generateInventoryExcel();
                filename = `vat-tu-${new Date().toISOString().slice(0, 10)}.xlsx`;
                break;
            case 'tasks':
                data.tasks = await generateTasksExcel();
                filename = `su-vu-${new Date().toISOString().slice(0, 10)}.xlsx`;
                break;
            case 'transfers':
                data.transfers = await generateTransfersExcel();
                filename = `chuyen-kho-${new Date().toISOString().slice(0, 10)}.xlsx`;
                break;
            case 'logs':
                data.logs = await generateLogsExcel();
                filename = `log-${new Date().toISOString().slice(0, 10)}.xlsx`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid sheet type' });
        }
        
        data.summary = {
            totalInventory: data.inventory ? data.inventory.length : 0,
            totalTasks: data.tasks ? data.tasks.length : 0,
            totalTransfers: data.transfers ? data.transfers.length : 0,
            totalLogs: data.logs ? data.logs.length : 0
        };
        data.generatedAt = new Date();
        
        const filepath = generateExcelFile(data, filename);
        
        console.log('✅ Excel report generated:', filename);
        
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            } else {
                setTimeout(() => {
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                    }
                }, 5000);
            }
        });
        
    } catch (error) {
        console.error('❌ Error generating Excel report:', error);
        res.status(500).json({ 
            error: 'Failed to generate Excel report',
            details: error.message 
        });
    }
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`📊 Excel Export Server running on http://localhost:${PORT}`);
    console.log(`📁 Export endpoint: http://localhost:${PORT}/api/export/excel`);
    console.log(`🔧 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Excel server...');
    process.exit(0);
});
