// Firebase Integration for Vattu Management System
// This file provides Firebase Realtime Database functions

import { database, DB_PATHS, isAuthenticated } from './firebase-config.js';
import { ref, set, push, update, remove, onValue, off, query, orderByChild, orderByKey, limitToLast } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Wait for Firebase authentication
function waitForAuth() {
    return new Promise((resolve) => {
        const checkAuth = () => {
            if (isAuthenticated) {
                resolve();
            } else {
                setTimeout(checkAuth, 100);
            }
        };
        checkAuth();
    });
}

// Load all data from Firebase Realtime Database
async function loadAllDataFromFirebase() {
    try {
        await waitForAuth();
        console.log('🔄 Loading all data from Firebase...');
        
        await Promise.all([
            loadInventoryFromRealtimeDB(),
            loadTasksFromRealtimeDB(),
            loadTransfersFromRealtimeDB(),
            loadLogsFromRealtimeDB()
        ]);
        
        console.log('✅ All data loaded from Firebase');
        
    } catch (error) {
        console.error('❌ Error loading data from Firebase:', error);
        throw error;
    }
}

// Load inventory data from Firebase
async function loadInventoryFromRealtimeDB() {
    return new Promise((resolve, reject) => {
        const inventoryRef = ref(database, DB_PATHS.INVENTORY);
        
        onValue(inventoryRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert Firebase object to array
                inventoryData = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    dateAdded: data[key].dateAdded ? new Date(data[key].dateAdded) : new Date()
                }));
                console.log('📦 Loaded inventory data:', inventoryData.length, 'items');
            } else {
                inventoryData = [];
                console.log('📦 No inventory data found');
            }
            resolve();
        }, (error) => {
            console.error('❌ Error loading inventory:', error);
            reject(error);
        });
    });
}

// Load tasks data from Firebase
async function loadTasksFromRealtimeDB() {
    return new Promise((resolve, reject) => {
        const tasksRef = ref(database, DB_PATHS.TASKS);
        
        onValue(tasksRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                tasksData = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    createdDate: data[key].createdDate ? new Date(data[key].createdDate) : new Date(),
                    deadline: data[key].deadline ? new Date(data[key].deadline) : null
                }));
                console.log('📋 Loaded tasks data:', tasksData.length, 'tasks');
            } else {
                tasksData = [];
                console.log('📋 No tasks data found');
            }
            resolve();
        }, (error) => {
            console.error('❌ Error loading tasks:', error);
            reject(error);
        });
    });
}

// Load transfers data from Firebase
async function loadTransfersFromRealtimeDB() {
    return new Promise((resolve, reject) => {
        const transfersRef = ref(database, DB_PATHS.TRANSFERS);
        
        onValue(transfersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                transfersData = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    createdDate: data[key].createdDate ? new Date(data[key].createdDate) : new Date(),
                    confirmedDate: data[key].confirmedDate ? new Date(data[key].confirmedDate) : null
                }));
                console.log('🚚 Loaded transfers data:', transfersData.length, 'transfers');
            } else {
                transfersData = [];
                console.log('🚚 No transfers data found');
            }
            resolve();
        }, (error) => {
            console.error('❌ Error loading transfers:', error);
            reject(error);
        });
    });
}

// Load logs data from Firebase
async function loadLogsFromRealtimeDB() {
    return new Promise((resolve, reject) => {
        const logsRef = ref(database, DB_PATHS.LOGS);
        
        onValue(logsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                logsData = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    timestamp: data[key].timestamp ? new Date(data[key].timestamp) : new Date()
                }));
                console.log('📝 Loaded logs data:', logsData.length, 'logs');
            } else {
                logsData = [];
                console.log('📝 No logs data found');
            }
            resolve();
        }, (error) => {
            console.error('❌ Error loading logs:', error);
            reject(error);
        });
    });
}

// Save inventory item to Firebase
async function saveInventoryToFirebase(item) {
    try {
        await waitForAuth();
        const inventoryRef = ref(database, `${DB_PATHS.INVENTORY}/${item.id}`);
        await set(inventoryRef, {
            ...item,
            dateAdded: item.dateAdded.toISOString()
        });
        console.log('✅ Inventory item saved to Firebase:', item.id);
        return item.id;
    } catch (error) {
        console.error('❌ Error saving inventory item:', error);
        throw error;
    }
}

// Save task to Firebase
async function saveTaskToFirebase(task) {
    try {
        await waitForAuth();
        const tasksRef = ref(database, `${DB_PATHS.TASKS}/${task.id}`);
        await set(tasksRef, {
            ...task,
            createdDate: task.createdDate.toISOString(),
            deadline: task.deadline ? task.deadline.toISOString() : null
        });
        console.log('✅ Task saved to Firebase:', task.id);
        return task.id;
    } catch (error) {
        console.error('❌ Error saving task:', error);
        throw error;
    }
}

// Save transfer to Firebase
async function saveTransferToFirebase(transfer) {
    try {
        await waitForAuth();
        const transfersRef = ref(database, `${DB_PATHS.TRANSFERS}/${transfer.id}`);
        await set(transfersRef, {
            ...transfer,
            createdDate: transfer.createdDate.toISOString(),
            confirmedDate: transfer.confirmedDate ? transfer.confirmedDate.toISOString() : null
        });
        console.log('✅ Transfer saved to Firebase:', transfer.id);
        return transfer.id;
    } catch (error) {
        console.error('❌ Error saving transfer:', error);
        throw error;
    }
}

// Save log to Firebase
async function saveLogToFirebase(log) {
    try {
        await waitForAuth();
        const logsRef = ref(database, `${DB_PATHS.LOGS}/${log.id}`);
        await set(logsRef, {
            ...log,
            timestamp: log.timestamp.toISOString()
        });
        console.log('✅ Log saved to Firebase:', log.id);
        return log.id;
    } catch (error) {
        console.error('❌ Error saving log:', error);
        throw error;
    }
}

// Delete inventory item from Firebase
async function deleteInventoryFromFirebase(itemId) {
    try {
        const inventoryRef = ref(database, `${DB_PATHS.INVENTORY}/${itemId}`);
        await remove(inventoryRef);
        console.log('✅ Inventory item deleted from Firebase:', itemId);
    } catch (error) {
        console.error('❌ Error deleting inventory item:', error);
        throw error;
    }
}

// Delete task from Firebase
async function deleteTaskFromFirebase(taskId) {
    try {
        const tasksRef = ref(database, `${DB_PATHS.TASKS}/${taskId}`);
        await remove(tasksRef);
        console.log('✅ Task deleted from Firebase:', taskId);
    } catch (error) {
        console.error('❌ Error deleting task:', error);
        throw error;
    }
}

// Delete transfer from Firebase
async function deleteTransferFromFirebase(transferId) {
    try {
        const transfersRef = ref(database, `${DB_PATHS.TRANSFERS}/${transferId}`);
        await remove(transfersRef);
        console.log('✅ Transfer deleted from Firebase:', transferId);
    } catch (error) {
        console.error('❌ Error deleting transfer:', error);
        throw error;
    }
}

// Export functions for use in script.js
window.loadAllDataFromFirebase = loadAllDataFromFirebase;
window.loadInventoryFromRealtimeDB = loadInventoryFromRealtimeDB;
window.loadTasksFromRealtimeDB = loadTasksFromRealtimeDB;
window.loadTransfersFromRealtimeDB = loadTransfersFromRealtimeDB;
window.loadLogsFromRealtimeDB = loadLogsFromRealtimeDB;
window.saveInventoryToFirebase = saveInventoryToFirebase;
window.saveTaskToFirebase = saveTaskToFirebase;
window.saveTransferToFirebase = saveTransferToFirebase;
window.saveLogToFirebase = saveLogToFirebase;
window.deleteInventoryFromFirebase = deleteInventoryFromFirebase;
window.deleteTaskFromFirebase = deleteTaskFromFirebase;
window.deleteTransferFromFirebase = deleteTransferFromFirebase;