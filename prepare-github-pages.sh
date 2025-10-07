#!/bin/bash

echo "🐙 Preparing Vattu Management System for GitHub Pages..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please initialize git first:"
    echo "   git init"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/vattu-management.git"
    exit 1
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
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

# Development files
start.sh
test-firebase-connection.js
demo-firebase.html
*.md
EOF
fi

# Create production version of firebase-config.js
echo "🔥 Creating production Firebase config..."
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

// Firebase Realtime Database Paths
const DB_PATHS = {
    INVENTORY: 'inventory',
    TASKS: 'tasks',
    TRANSFERS: 'transfers',
    LOGS: 'logs'
};

// Authentication
let currentUser = null;

// Initialize authentication
async function initializeAuth() {
    try {
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
        console.log('Firebase auth initialized:', currentUser.uid);
        
        // Update UI
        updateAuthStatus(true);
        
        // Load data from Firebase
        await loadAllDataFromFirebase();
        
    } catch (error) {
        console.error('Firebase auth error:', error);
        showToast('error', 'Lỗi Firebase', 'Không thể kết nối Firebase. Vui lòng kiểm tra cấu hình.');
        updateAuthStatus(false);
    }
}

// Monitor auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        console.log('User signed in:', user.uid);
        updateAuthStatus(true);
    } else {
        console.log('User signed out');
        updateAuthStatus(false);
    }
});

// Update authentication status in UI
function updateAuthStatus(isAuthenticated) {
    const authStatus = document.getElementById('authStatus');
    if (authStatus) {
        if (isAuthenticated) {
            authStatus.innerHTML = '<i class="fas fa-fire text-success"></i> Đã kết nối Firebase Realtime DB';
            authStatus.style.background = 'rgba(40, 167, 69, 0.2)';
        } else {
            authStatus.innerHTML = '<i class="fas fa-fire text-danger"></i> Chưa kết nối Firebase';
            authStatus.style.background = 'rgba(220, 53, 69, 0.2)';
        }
    }
}

// Load all data from Firebase Realtime Database
async function loadAllDataFromFirebase() {
    try {
        showLoading();
        
        // Load inventory data
        await loadInventoryFromRealtimeDB();
        
        // Load tasks data
        await loadTasksFromRealtimeDB();
        
        // Load transfers data
        await loadTransfersFromRealtimeDB();
        
        // Load logs data
        await loadLogsFromRealtimeDB();
        
        // Update UI
        updateDashboard();
        renderInventoryTable();
        renderTasksList();
        renderTransfersList();
        renderLogsList();
        
        showToast('success', 'Tải dữ liệu thành công!', 'Đã tải dữ liệu từ Firebase Realtime Database.');
        
    } catch (error) {
        console.error('Error loading data from Firebase:', error);
        showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải dữ liệu từ Firebase Realtime Database.');
    } finally {
        hideLoading();
    }
}

// Inventory operations with Realtime Database
async function loadInventoryFromRealtimeDB() {
    try {
        const inventoryRef = ref(db, DB_PATHS.INVENTORY);
        
        return new Promise((resolve, reject) => {
            onValue(inventoryRef, (snapshot) => {
                const data = snapshot.val();
                inventoryData = [];
                
                if (data) {
                    Object.keys(data).forEach(key => {
                        inventoryData.push({
                            id: key,
                            ...data[key]
                        });
                    });
                    
                    // Sort by createdAt descending
                    inventoryData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                }
                
                console.log('Loaded inventory from Realtime DB:', inventoryData.length, 'items');
                resolve(inventoryData);
            }, (error) => {
                console.error('Error loading inventory:', error);
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error loading inventory:', error);
        throw error;
    }
}

async function saveInventoryToFirebase(item) {
    try {
        if (item.id && item.id.startsWith('temp_')) {
            // New item - push to get auto-generated key
            const newItemRef = push(ref(db, DB_PATHS.INVENTORY));
            const itemData = {
                ...item,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await set(newItemRef, itemData);
            return newItemRef.key;
        } else {
            // Update existing item
            const itemRef = ref(db, `${DB_PATHS.INVENTORY}/${item.id}`);
            const updateData = {
                ...item,
                updatedAt: new Date().toISOString()
            };
            
            await update(itemRef, updateData);
            return item.id;
        }
    } catch (error) {
        console.error('Error saving inventory:', error);
        throw error;
    }
}

// Tasks operations
async function loadTasksFromRealtimeDB() {
    try {
        const tasksRef = ref(db, DB_PATHS.TASKS);
        
        return new Promise((resolve, reject) => {
            onValue(tasksRef, (snapshot) => {
                const data = snapshot.val();
                tasksData = [];
                
                if (data) {
                    Object.keys(data).forEach(key => {
                        tasksData.push({
                            id: key,
                            ...data[key]
                        });
                    });
                    
                    // Sort by createdDate descending
                    tasksData.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
                }
                
                console.log('Loaded tasks from Realtime DB:', tasksData.length, 'tasks');
                resolve(tasksData);
            }, (error) => {
                console.error('Error loading tasks:', error);
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
        throw error;
    }
}

async function saveTaskToFirebase(task) {
    try {
        if (task.id && task.id.startsWith('temp_')) {
            // New task
            const newTaskRef = push(ref(db, DB_PATHS.TASKS));
            const taskData = {
                ...task,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await set(newTaskRef, taskData);
            return newTaskRef.key;
        } else {
            // Update existing task
            const taskRef = ref(db, `${DB_PATHS.TASKS}/${task.id}`);
            const updateData = {
                ...task,
                updatedAt: new Date().toISOString()
            };
            
            await update(taskRef, updateData);
            return task.id;
        }
    } catch (error) {
        console.error('Error saving task:', error);
        throw error;
    }
}

// Transfers operations
async function loadTransfersFromRealtimeDB() {
    try {
        const transfersRef = ref(db, DB_PATHS.TRANSFERS);
        
        return new Promise((resolve, reject) => {
            onValue(transfersRef, (snapshot) => {
                const data = snapshot.val();
                transfersData = [];
                
                if (data) {
                    Object.keys(data).forEach(key => {
                        transfersData.push({
                            id: key,
                            ...data[key]
                        });
                    });
                    
                    // Sort by createdDate descending
                    transfersData.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
                }
                
                console.log('Loaded transfers from Realtime DB:', transfersData.length, 'transfers');
                resolve(transfersData);
            }, (error) => {
                console.error('Error loading transfers:', error);
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error loading transfers:', error);
        throw error;
    }
}

async function saveTransferToFirebase(transfer) {
    try {
        if (transfer.id && transfer.id.startsWith('temp_')) {
            // New transfer
            const newTransferRef = push(ref(db, DB_PATHS.TRANSFERS));
            const transferData = {
                ...transfer,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await set(newTransferRef, transferData);
            return newTransferRef.key;
        } else {
            // Update existing transfer
            const transferRef = ref(db, `${DB_PATHS.TRANSFERS}/${transfer.id}`);
            const updateData = {
                ...transfer,
                updatedAt: new Date().toISOString()
            };
            
            await update(transferRef, updateData);
            return transfer.id;
        }
    } catch (error) {
        console.error('Error saving transfer:', error);
        throw error;
    }
}

// Logs operations
async function loadLogsFromRealtimeDB() {
    try {
        const logsRef = ref(db, DB_PATHS.LOGS);
        
        return new Promise((resolve, reject) => {
            onValue(logsRef, (snapshot) => {
                const data = snapshot.val();
                logsData = [];
                
                if (data) {
                    Object.keys(data).forEach(key => {
                        logsData.push({
                            id: key,
                            ...data[key]
                        });
                    });
                    
                    // Sort by timestamp descending
                    logsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                }
                
                console.log('Loaded logs from Realtime DB:', logsData.length, 'logs');
                resolve(logsData);
            }, (error) => {
                console.error('Error loading logs:', error);
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error loading logs:', error);
        throw error;
    }
}

async function saveLogToFirebase(log) {
    try {
        const newLogRef = push(ref(db, DB_PATHS.LOGS));
        const logData = {
            ...log,
            createdAt: new Date().toISOString()
        };
        
        await set(newLogRef, logData);
        return newLogRef.key;
    } catch (error) {
        console.error('Error saving log:', error);
        throw error;
    }
}

// Initialize Firebase when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase after a short delay to ensure DOM is ready
    setTimeout(initializeAuth, 1000);
});

// Export functions for use in other files
window.firebaseApp = {
    db,
    auth,
    currentUser,
    loadAllDataFromFirebase,
    saveInventoryToFirebase,
    saveTaskToFirebase,
    saveTransferToFirebase,
    saveLogToFirebase,
    loadInventoryFromRealtimeDB,
    loadTasksFromRealtimeDB,
    loadTransfersFromRealtimeDB,
    loadLogsFromRealtimeDB
};
EOF

# Create CSV export function for GitHub Pages
echo "📊 Creating CSV export function..."
cat > csv-export.js << 'EOF'
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
EOF

# Update index.html for GitHub Pages
echo "📝 Updating index.html for GitHub Pages..."
cp index.html index.html.backup

# Update the script imports in index.html
sed -i '' 's|firebase-config.js|firebase-config-prod.js|g' index.html
sed -i '' 's|firebase-integration.js|firebase-integration-prod.js|g' index.html

# Create production version of firebase-integration.js
echo "🔧 Creating production firebase-integration.js..."
cat > firebase-integration-prod.js << 'EOF'
// Firebase Integration for GitHub Pages
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
        
        // Update sync button for CSV export
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.innerHTML = '<i class="fas fa-file-csv"></i> Xuất báo cáo CSV';
            syncBtn.removeEventListener('click', syncWithGoogleSheets);
            syncBtn.addEventListener('click', exportToCSV);
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
            authStatus.innerHTML = '<i class="fas fa-fire text-success"></i> Đã kết nối Firebase Realtime DB';
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
    handleTaskSubmitWithFirebase,
    handleItemSubmitWithFirebase,
    handleTransferSubmitWithFirebase
};
EOF

# Add CSV export script to index.html
echo "📊 Adding CSV export script to index.html..."
sed -i '' '/<script src="firebase-integration-prod.js"><\/script>/a\
    <script src="csv-export.js"></script>' index.html

echo "✅ Preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create GitHub repository:"
echo "   https://github.com/new"
echo ""
echo "2. Initialize git and push:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit: Vattu Management System'"
echo "   git remote add origin https://github.com/YOUR_USERNAME/vattu-management.git"
echo "   git push -u origin main"
echo ""
echo "3. Enable GitHub Pages:"
echo "   Go to repository Settings → Pages"
echo "   Source: Deploy from a branch"
echo "   Branch: main"
echo ""
echo "4. Your website will be available at:"
echo "   https://YOUR_USERNAME.github.io/vattu-management"
echo ""
echo "📖 See github-pages-setup.md for detailed instructions"
