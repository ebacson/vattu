// Firebase Integration for Vattu Management System
// This file provides Firebase Realtime Database functions

import { auth, database, DB_PATHS, isAuthenticated } from './firebase-config.js';
import { ref, set, push, update, remove, onValue, off, query, orderByChild, orderByKey, limitToLast } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Wait for Firebase authentication
function waitForAuth() {
    return new Promise((resolve) => {
        // Check if user is authenticated via Firebase Auth
        if (auth.currentUser) {
            console.log('🔐 User already authenticated:', auth.currentUser.uid);
            resolve();
        } else {
            console.log('⏳ Waiting for authentication...');
            // Wait for auth state to be ready
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    console.log('✅ User authenticated:', user.uid);
                    unsubscribe();
                    resolve();
                } else {
                    // No user logged in, resolve anyway to allow operations
                    console.log('⚠️ No user authenticated, proceeding anyway');
                    unsubscribe();
                    resolve();
                }
            });
            
            // Timeout after 5 seconds to prevent infinite waiting
            setTimeout(() => {
                console.log('⚠️ Auth timeout, proceeding anyway');
                resolve();
            }, 5000);
        }
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
            loadLogsFromRealtimeDB(),
            loadDeliveryRequestsFromRealtimeDB(),
            loadReturnRequestsFromRealtimeDB()
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
        
        let isFirstLoad = true;
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
            
            // Trigger UI update on data changes (but not on first load to avoid double render)
            if (!isFirstLoad && typeof window.renderInventoryTable === 'function') {
                console.log('🔄 Inventory data changed, updating UI...');
                window.renderInventoryTable();
                if (typeof window.updateDashboard === 'function') {
                    window.updateDashboard();
                }
            }
            
            if (isFirstLoad) {
                isFirstLoad = false;
                resolve();
            }
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
                    deadline: data[key].deadline ? new Date(data[key].deadline) : null,
                    assignedItems: data[key].assignedItems || [],
                    completedItems: data[key].completedItems || []
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

// Load delivery requests from Firebase
async function loadDeliveryRequestsFromRealtimeDB() {
    return new Promise((resolve, reject) => {
        const requestsRef = ref(database, DB_PATHS.DELIVERY_REQUESTS);
        
        let isFirstLoad = true;
        onValue(requestsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                deliveryRequestsData = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    requestedDate: data[key].requestedDate ? new Date(data[key].requestedDate) : new Date(),
                    confirmedDate: data[key].confirmedDate ? new Date(data[key].confirmedDate) : null
                }));
                console.log('🚚 Loaded delivery requests:', deliveryRequestsData.length);
            } else {
                deliveryRequestsData = [];
                console.log('🚚 No delivery requests found');
            }
            
            if (!isFirstLoad && typeof window.renderInventoryTable === 'function') {
                console.log('🔄 Delivery requests changed, updating UI...');
                window.renderInventoryTable();
            }
            
            if (isFirstLoad) {
                isFirstLoad = false;
                resolve();
            }
        }, (error) => {
            console.error('❌ Error loading delivery requests:', error);
            reject(error);
        });
    });
}

// Load return requests from Firebase
async function loadReturnRequestsFromRealtimeDB() {
    return new Promise((resolve, reject) => {
        const requestsRef = ref(database, DB_PATHS.RETURN_REQUESTS);
        
        let isFirstLoad = true;
        onValue(requestsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                returnRequestsData = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    requestedDate: data[key].requestedDate ? new Date(data[key].requestedDate) : new Date(),
                    confirmedDate: data[key].confirmedDate ? new Date(data[key].confirmedDate) : null
                }));
                console.log('↩️ Loaded return requests:', returnRequestsData.length);
            } else {
                returnRequestsData = [];
                console.log('↩️ No return requests found');
            }
            
            if (!isFirstLoad && typeof window.renderInventoryTable === 'function') {
                console.log('🔄 Return requests changed, updating UI...');
                window.renderInventoryTable();
            }
            
            if (isFirstLoad) {
                isFirstLoad = false;
                resolve();
            }
        }, (error) => {
            console.error('❌ Error loading return requests:', error);
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

// Save delivery request to Firebase
async function saveDeliveryRequestToFirebase(request) {
    try {
        await waitForAuth();
        const requestRef = ref(database, `${DB_PATHS.DELIVERY_REQUESTS}/${request.id}`);
        await set(requestRef, {
            ...request,
            requestedDate: request.requestedDate.toISOString(),
            confirmedDate: request.confirmedDate ? request.confirmedDate.toISOString() : null
        });
        console.log('✅ Delivery request saved to Firebase:', request.id);
        return request.id;
    } catch (error) {
        console.error('❌ Error saving delivery request:', error);
        throw error;
    }
}

// Save return request to Firebase
async function saveReturnRequestToFirebase(request) {
    try {
        await waitForAuth();
        const requestRef = ref(database, `${DB_PATHS.RETURN_REQUESTS}/${request.id}`);
        await set(requestRef, {
            ...request,
            requestedDate: request.requestedDate.toISOString(),
            confirmedDate: request.confirmedDate ? request.confirmedDate.toISOString() : null
        });
        console.log('✅ Return request saved to Firebase:', request.id);
        return request.id;
    } catch (error) {
        console.error('❌ Error saving return request:', error);
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

// Delete delivery request from Firebase
async function deleteDeliveryRequestFromFirebase(requestId) {
    try {
        const requestRef = ref(database, `${DB_PATHS.DELIVERY_REQUESTS}/${requestId}`);
        await remove(requestRef);
        console.log('✅ Delivery request deleted from Firebase:', requestId);
    } catch (error) {
        console.error('❌ Error deleting delivery request:', error);
        throw error;
    }
}

// Delete return request from Firebase
async function deleteReturnRequestFromFirebase(requestId) {
    try {
        const requestRef = ref(database, `${DB_PATHS.RETURN_REQUESTS}/${requestId}`);
        await remove(requestRef);
        console.log('✅ Return request deleted from Firebase:', requestId);
    } catch (error) {
        console.error('❌ Error deleting return request:', error);
        throw error;
    }
}

// Export functions for use in script.js
window.loadAllDataFromFirebase = loadAllDataFromFirebase;
window.loadInventoryFromRealtimeDB = loadInventoryFromRealtimeDB;
window.loadTasksFromRealtimeDB = loadTasksFromRealtimeDB;
window.loadTransfersFromRealtimeDB = loadTransfersFromRealtimeDB;
window.loadLogsFromRealtimeDB = loadLogsFromRealtimeDB;
window.loadDeliveryRequestsFromRealtimeDB = loadDeliveryRequestsFromRealtimeDB;
window.loadReturnRequestsFromRealtimeDB = loadReturnRequestsFromRealtimeDB;
window.saveInventoryToFirebase = saveInventoryToFirebase;
window.saveTaskToFirebase = saveTaskToFirebase;
window.saveTransferToFirebase = saveTransferToFirebase;
window.saveLogToFirebase = saveLogToFirebase;
window.saveDeliveryRequestToFirebase = saveDeliveryRequestToFirebase;
window.saveReturnRequestToFirebase = saveReturnRequestToFirebase;
window.deleteInventoryFromFirebase = deleteInventoryFromFirebase;
window.deleteTaskFromFirebase = deleteTaskFromFirebase;
window.deleteTransferFromFirebase = deleteTransferFromFirebase;
window.deleteDeliveryRequestFromFirebase = deleteDeliveryRequestFromFirebase;
window.deleteReturnRequestFromFirebase = deleteReturnRequestFromFirebase;