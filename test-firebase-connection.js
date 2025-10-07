// Test Firebase Realtime Database Connection
const admin = require("firebase-admin");

console.log('🔥 Testing Firebase Realtime Database connection...');

try {
    // Try to initialize Firebase Admin
    const serviceAccount = require("./serviceAccountKey.json");
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://project-6680116762664948229-default-rtdb.firebaseio.com"
    });
    
    console.log('✅ Firebase Admin initialized successfully');
    
    // Test database connection
    const db = admin.database();
    const testRef = db.ref('test');
    
    console.log('🔄 Testing database write...');
    
    // Write test data
    testRef.set({
        message: 'Hello Firebase Realtime Database!',
        timestamp: new Date().toISOString(),
        test: true
    }).then(() => {
        console.log('✅ Database write successful');
        
        // Read test data
        console.log('🔄 Testing database read...');
        return testRef.once('value');
        
    }).then((snapshot) => {
        const data = snapshot.val();
        console.log('✅ Database read successful:', data);
        
        // Clean up test data
        console.log('🔄 Cleaning up test data...');
        return testRef.remove();
        
    }).then(() => {
        console.log('✅ Test data cleaned up');
        console.log('🎉 Firebase Realtime Database connection test PASSED!');
        process.exit(0);
        
    }).catch((error) => {
        console.error('❌ Database operation failed:', error);
        process.exit(1);
    });
    
} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error('❌ serviceAccountKey.json not found!');
        console.error('📋 Please follow these steps:');
        console.error('1. Go to Firebase Console → Project Settings → Service Accounts');
        console.error('2. Click "Generate new private key"');
        console.error('3. Download the JSON file');
        console.error('4. Rename it to "serviceAccountKey.json"');
        console.error('5. Place it in the project directory');
    } else {
        console.error('❌ Firebase initialization failed:', error);
    }
    process.exit(1);
}
