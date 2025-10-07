// Firebase Authentication Integration for Vattu Management System
// This file provides Firebase Authentication functions

import { auth, database } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Authentication state
let currentUser = null;
let authStateListeners = [];

// Initialize authentication state listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    authStateListeners.forEach(callback => callback(user));
    
    if (user) {
        console.log('✅ User authenticated:', user.email);
    } else {
        console.log('❌ User not authenticated');
    }
});

// Register new user
async function registerUser(email, password, displayName, warehouse = 'net') {
    try {
        console.log('🔄 Registering user:', email);
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user profile with display name
        if (displayName) {
            await updateProfile(user, {
                displayName: displayName
            });
        }
        
        // Wait a bit to ensure user is authenticated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Save user data to Firebase Realtime Database
        const userData = {
            uid: user.uid,
            email: email,
            displayName: displayName,
            admin: false,
            warehouse: warehouse,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true
        };
        
        console.log('🔄 Saving user data to Firebase:', userData);
        const userRef = ref(database, `users/${user.uid}`);
        await set(userRef, userData);
        
        console.log('✅ User registered successfully:', user.uid);
        console.log('✅ User data saved to Firebase:', userData);
        return { success: true, user: user, userData: userData };
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Sign in user
async function signInUser(email, password) {
    try {
        console.log('🔄 Signing in user:', email);
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ User signed in successfully:', user.uid);
        return { success: true, user: user };
        
    } catch (error) {
        console.error('❌ Sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign out user
async function signOutUser() {
    try {
        console.log('🔄 Signing out user');
        
        await signOut(auth);
        
        console.log('✅ User signed out successfully');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// Send password reset email
async function resetPassword(email) {
    try {
        console.log('🔄 Sending password reset email:', email);
        
        await sendPasswordResetEmail(auth, email);
        
        console.log('✅ Password reset email sent successfully');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Password reset error:', error);
        return { success: false, error: error.message };
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return currentUser !== null;
}

// Add authentication state listener
function onAuthStateChange(callback) {
    authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
        const index = authStateListeners.indexOf(callback);
        if (index > -1) {
            authStateListeners.splice(index, 1);
        }
    };
}

// Get user display name
function getUserDisplayName() {
    return currentUser ? currentUser.displayName || currentUser.email : null;
}

// Get user email
function getUserEmail() {
    return currentUser ? currentUser.email : null;
}

// Get user UID
function getUserUID() {
    return currentUser ? currentUser.uid : null;
}

// Get user data from Firebase
async function getUserData(uid = null) {
    try {
        const userId = uid || getUserUID();
        if (!userId) {
            return { success: false, error: 'No user ID provided' };
        }
        
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log('✅ User data retrieved:', userData);
            return { success: true, userData: userData };
        } else {
            console.log('❌ User data not found');
            return { success: false, error: 'User data not found' };
        }
        
    } catch (error) {
        console.error('❌ Error getting user data:', error);
        return { success: false, error: error.message };
    }
}

// Update user data
async function updateUserData(uid, updates) {
    try {
        const userRef = ref(database, `users/${uid}`);
        await set(userRef, updates);
        console.log('✅ User data updated:', updates);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error updating user data:', error);
        return { success: false, error: error.message };
    }
}

// Check if user is admin
async function isUserAdmin(uid = null) {
    try {
        const result = await getUserData(uid);
        if (result.success) {
            return result.userData.admin === true;
        }
        return false;
        
    } catch (error) {
        console.error('❌ Error checking admin status:', error);
        return false;
    }
}

// Get user warehouse
async function getUserWarehouse(uid = null) {
    try {
        const result = await getUserData(uid);
        if (result.success) {
            return result.userData.warehouse || 'net';
        }
        return 'net';
        
    } catch (error) {
        console.error('❌ Error getting user warehouse:', error);
        return 'net';
    }
}

// Export functions for use in other files
export {
    registerUser,
    signInUser,
    signOutUser,
    resetPassword,
    getCurrentUser,
    isAuthenticated,
    onAuthStateChange,
    getUserDisplayName,
    getUserEmail,
    getUserUID,
    getUserData,
    updateUserData,
    isUserAdmin,
    getUserWarehouse
};
