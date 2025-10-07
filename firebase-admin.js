// Firebase Admin SDK for Realtime Database operations
const admin = require("firebase-admin");

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
    try {
        // Initialize with service account
        const serviceAccount = require("./serviceAccountKey.json");
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://project-6680116762664948229-default-rtdb.firebaseio.com"
        });
        
        console.log("✅ Firebase Admin initialized successfully for Realtime Database");
        return admin.database();
    } catch (error) {
        console.error("❌ Firebase Admin initialization failed:", error);
        throw error;
    }
}

// Export functions for Excel generation from Realtime Database
async function generateInventoryExcel() {
    const db = admin.database();
    
    try {
        const snapshot = await db.ref('inventory').once('value');
        const inventoryData = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                inventoryData.push({
                    id: key,
                    ...data[key]
                });
            });
            
            // Sort by createdAt descending
            inventoryData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return inventoryData;
    } catch (error) {
        console.error('Error generating inventory Excel:', error);
        throw error;
    }
}

async function generateTasksExcel() {
    const db = admin.database();
    
    try {
        const snapshot = await db.ref('tasks').once('value');
        const tasksData = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                tasksData.push({
                    id: key,
                    ...data[key]
                });
            });
            
            // Sort by createdDate descending
            tasksData.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        }
        
        return tasksData;
    } catch (error) {
        console.error('Error generating tasks Excel:', error);
        throw error;
    }
}

async function generateTransfersExcel() {
    const db = admin.database();
    
    try {
        const snapshot = await db.ref('transfers').once('value');
        const transfersData = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                transfersData.push({
                    id: key,
                    ...data[key]
                });
            });
            
            // Sort by createdDate descending
            transfersData.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        }
        
        return transfersData;
    } catch (error) {
        console.error('Error generating transfers Excel:', error);
        throw error;
    }
}

async function generateLogsExcel() {
    const db = admin.database();
    
    try {
        const snapshot = await db.ref('logs').once('value');
        const logsData = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                logsData.push({
                    id: key,
                    ...data[key]
                });
            });
            
            // Sort by timestamp descending
            logsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        return logsData;
    } catch (error) {
        console.error('Error generating logs Excel:', error);
        throw error;
    }
}

// Generate comprehensive report
async function generateFullReport() {
    try {
        const [inventory, tasks, transfers, logs] = await Promise.all([
            generateInventoryExcel(),
            generateTasksExcel(),
            generateTransfersExcel(),
            generateLogsExcel()
        ]);
        
        return {
            inventory,
            tasks,
            transfers,
            logs,
            generatedAt: new Date(),
            summary: {
                totalInventory: inventory.length,
                totalTasks: tasks.length,
                totalTransfers: transfers.length,
                totalLogs: logs.length
            }
        };
    } catch (error) {
        console.error('Error generating full report:', error);
        throw error;
    }
}

module.exports = {
    initializeFirebaseAdmin,
    generateInventoryExcel,
    generateTasksExcel,
    generateTransfersExcel,
    generateLogsExcel,
    generateFullReport
};
