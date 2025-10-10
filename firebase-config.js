// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
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

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

// Database paths
const DB_PATHS = {
  INVENTORY: 'inventory',
  TASKS: 'tasks',
  TRANSFERS: 'transfers',
  LOGS: 'logs',
  DELIVERY_REQUESTS: 'deliveryRequests',
  RETURN_REQUESTS: 'returnRequests'
};

// Authentication status
let isAuthenticated = false;

// Update authentication status in UI
function updateAuthStatus(status, message) {
  const authStatus = document.getElementById('authStatus');
  if (authStatus) {
    authStatus.innerHTML = `
      <i class="fas fa-fire ${status === 'success' ? 'text-success' : 'text-danger'}"></i> 
      ${message}
    `;
  }
}

// Initialize authentication status
updateAuthStatus('success', 'Online');

// Export for use in other files
export { app, auth, database, DB_PATHS, isAuthenticated };
