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
