// Firebase Authentication Integration for Vattu Management System
// This file provides Firebase Authentication functions

import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

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
async function registerUser(email, password, displayName) {
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
        
        console.log('✅ User registered successfully:', user.uid);
        return { success: true, user: user };
        
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
    getUserUID
};
