// Firebase Integration for Vattu Management
// This file extends the main script.js with Firebase functionality

// Firebase Integration Variables
let firebaseApp = null;
let isFirebaseReady = false;

// Wait for Firebase to be available
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebaseApp) {
                firebaseApp = window.firebaseApp;
                isFirebaseReady = true;
                console.log('🔥 Firebase integration ready');
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Enhanced form handlers with Firebase
async function handleTaskSubmitWithFirebase(e) {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = new FormData(e.target);
        const taskData = {
            name: formData.get('taskName'),
            type: formData.get('taskType'),
            description: formData.get('taskDescription'),
            location: formData.get('taskLocation') || '',
            priority: formData.get('taskPriority') || 'medium',
            status: 'pending',
            createdDate: new Date(),
            deadline: formData.get('taskDeadline') ? new Date(formData.get('taskDeadline')) : null,
            createdBy: getWarehouseName(currentWarehouse),
            assignedItems: [],
            completedItems: [],
            notes: formData.get('taskNotes') || ''
        };
        
        // Save to Firebase
        const taskId = await firebaseApp.saveTaskToFirebase(taskData);
        taskData.id = taskId;
        
        // Add to local data
        tasksData.push(taskData);
        
        // Add log
        await firebaseApp.saveLogToFirebase({
            type: 'task',
            action: 'Tạo sự vụ',
            details: `Tạo sự vụ: ${taskData.name}`,
            timestamp: new Date(),
            user: getWarehouseName(currentWarehouse)
        });
        
        showToast('success', 'Tạo sự vụ thành công!', 'Sự vụ mới đã được tạo và lưu vào Firebase.');
        
        updateDashboard();
        renderTasksList();
        closeModal('taskModal');
        
    } catch (error) {
        console.error('Error creating task:', error);
        showToast('error', 'Lỗi tạo sự vụ!', error.message);
    } finally {
        hideLoading();
    }
}

async function handleItemSubmitWithFirebase(e) {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = new FormData(e.target);
        const itemData = {
            code: formData.get('itemCode'),
            name: formData.get('itemName'),
            warehouse: formData.get('itemWarehouse'),
            category: formData.get('itemCategory') || '',
            condition: formData.get('itemCondition'),
            source: formData.get('itemSource') || '',
            description: formData.get('itemDescription') || '',
            dateAdded: new Date(),
            taskId: null
        };
        
        // Save to Firebase
        const itemId = await firebaseApp.saveInventoryToFirebase(itemData);
        itemData.id = itemId;
        
        // Add to local data
        inventoryData.push(itemData);
        
        // Add log
        await firebaseApp.saveLogToFirebase({
            type: 'inventory',
            action: 'Thêm vật tư',
            details: `Thêm vật tư: ${itemData.name} vào ${getWarehouseName(itemData.warehouse)}`,
            timestamp: new Date(),
            user: getWarehouseName(currentWarehouse)
        });
        
        showToast('success', 'Thêm vật tư thành công!', 'Vật tư mới đã được thêm và lưu vào Firebase.');
        
        updateDashboard();
        renderInventoryTable();
        closeModal('itemModal');
        
    } catch (error) {
        console.error('Error creating item:', error);
        showToast('error', 'Lỗi thêm vật tư!', error.message);
    } finally {
        hideLoading();
    }
}

async function handleTransferSubmitWithFirebase(e) {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = new FormData(e.target);
        const transferData = {
            type: formData.get('transferType'),
            taskId: formData.get('transferTaskId') || null,
            fromWarehouse: formData.get('transferFrom'),
            toWarehouse: formData.get('transferTo'),
            items: JSON.parse(formData.get('transferItems') || '[]'),
            notes: formData.get('transferNotes') || '',
            status: 'pending',
            createdDate: new Date(),
            confirmedDate: null,
            createdBy: getWarehouseName(currentWarehouse),
            confirmedBy: null
        };
        
        // Save to Firebase
        const transferId = await firebaseApp.saveTransferToFirebase(transferData);
        transferData.id = transferId;
        
        // Add to local data
        transfersData.push(transferData);
        
        // Add log
        await firebaseApp.saveLogToFirebase({
            type: 'transfer',
            action: 'Tạo chuyển kho',
            details: `Tạo chuyển kho ${getTransferTypeText(transferData.type)} từ ${getWarehouseName(transferData.fromWarehouse)} sang ${getWarehouseName(transferData.toWarehouse)}`,
            timestamp: new Date(),
            user: getWarehouseName(currentWarehouse)
        });
        
        showToast('success', 'Tạo chuyển kho thành công!', 'Chuyển kho mới đã được tạo và lưu vào Firebase.');
        
        updateDashboard();
        renderTransfersList();
        closeModal('transferModal');
        
    } catch (error) {
        console.error('Error creating transfer:', error);
        showToast('error', 'Lỗi tạo chuyển kho!', error.message);
    } finally {
        hideLoading();
    }
}

// Excel Export Function
async function exportToExcel() {
    try {
        showLoading();
        
        const response = await fetch('http://localhost:3002/api/export/excel');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition ? 
            contentDisposition.split('filename=')[1].replace(/"/g, '') : 
            'vattu-bao-cao.xlsx';
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('success', 'Xuất Excel thành công!', `File ${filename} đã được tải về.`);
        
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showToast('error', 'Lỗi xuất Excel!', 'Không thể kết nối đến Excel server. Đảm bảo server đang chạy.');
    } finally {
        hideLoading();
    }
}

// Initialize Firebase Integration
async function initializeFirebaseIntegration() {
    try {
        // Wait for Firebase to be ready
        await waitForFirebase();
        
        // Override existing form handlers
        const taskForm = document.getElementById('taskForm');
        const itemForm = document.getElementById('itemForm');
        const transferForm = document.getElementById('transferForm');
        
        if (taskForm) {
            taskForm.removeEventListener('submit', handleTaskSubmit);
            taskForm.addEventListener('submit', handleTaskSubmitWithFirebase);
        }
        
        if (itemForm) {
            itemForm.removeEventListener('submit', handleItemSubmit);
            itemForm.addEventListener('submit', handleItemSubmitWithFirebase);
        }
        
        if (transferForm) {
            transferForm.removeEventListener('submit', handleTransferSubmit);
            transferForm.addEventListener('submit', handleTransferSubmitWithFirebase);
        }
        
        // Update sync button
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.innerHTML = '<i class="fas fa-file-excel"></i> Xuất báo cáo Excel';
            syncBtn.removeEventListener('click', syncWithGoogleSheets);
            syncBtn.addEventListener('click', exportToExcel);
        }
        
        // Update auth status
        updateFirebaseAuthStatus(true);
        
        console.log('✅ Firebase integration initialized successfully');
        
    } catch (error) {
        console.error('❌ Firebase integration failed:', error);
        updateFirebaseAuthStatus(false);
    }
}

// Update Firebase authentication status
function updateFirebaseAuthStatus(isConnected) {
    const authStatus = document.getElementById('authStatus');
    if (authStatus) {
        if (isConnected) {
            authStatus.innerHTML = '<i class="fas fa-fire text-success"></i> Đã kết nối Firebase';
            authStatus.style.background = 'rgba(40, 167, 69, 0.2)';
            authStatus.style.border = '1px solid rgba(40, 167, 69, 0.5)';
        } else {
            authStatus.innerHTML = '<i class="fas fa-fire text-danger"></i> Chưa kết nối Firebase';
            authStatus.style.background = 'rgba(220, 53, 69, 0.2)';
            authStatus.style.border = '1px solid rgba(220, 53, 69, 0.5)';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase integration after a delay to ensure main script is loaded
    setTimeout(initializeFirebaseIntegration, 2000);
});

// Export functions for global access
window.firebaseIntegration = {
    initializeFirebaseIntegration,
    exportToExcel,
    handleTaskSubmitWithFirebase,
    handleItemSubmitWithFirebase,
    handleTransferSubmitWithFirebase
};
