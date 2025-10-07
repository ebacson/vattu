// Authentication UI Logic for Vattu Management System
// This file handles authentication forms and UI interactions

import { 
    registerUser, 
    signInUser, 
    resetPassword, 
    onAuthStateChange,
    getUserDisplayName,
    getUserEmail
} from './auth-integration.js';

// DOM elements
let loginForm, registerForm, forgotForm;
let loginEmail, loginPassword;
let registerName, registerEmail, registerPassword, confirmPassword;
let forgotEmail;
let errorMessage, successMessage, loading;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    setupAuthStateListener();
});

// Initialize DOM elements
function initializeElements() {
    // Forms
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    forgotForm = document.getElementById('forgotForm');
    
    // Input fields
    loginEmail = document.getElementById('loginEmail');
    loginPassword = document.getElementById('loginPassword');
    registerName = document.getElementById('registerName');
    registerEmail = document.getElementById('registerEmail');
    registerPassword = document.getElementById('registerPassword');
    confirmPassword = document.getElementById('confirmPassword');
    forgotEmail = document.getElementById('forgotEmail');
    
    // Messages
    errorMessage = document.getElementById('errorMessage');
    successMessage = document.getElementById('successMessage');
    loading = document.getElementById('loading');
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Forgot password form
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Password confirmation validation
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordConfirmation);
    }
}

// Setup authentication state listener
function setupAuthStateListener() {
    onAuthStateChange((user) => {
        if (user) {
            // User is authenticated, redirect to main app
            console.log('✅ User authenticated, redirecting to main app');
            window.location.href = 'index.html';
        }
    });
}

// Show specific tab
function showTab(tabName) {
    // Hide all forms
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => form.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected form
    const selectedForm = document.getElementById(tabName + 'Form');
    if (selectedForm) {
        selectedForm.classList.add('active');
    }
    
    // Add active class to selected tab
    const selectedTab = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Clear messages
    clearMessages();
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    if (!email || !password) {
        showError('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    showLoading(true);
    clearMessages();
    
    const result = await signInUser(email, password);
    
    showLoading(false);
    
    if (result.success) {
        showSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        // Redirect will be handled by auth state listener
    } else {
        showError(getErrorMessage(result.error));
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const confirmPass = confirmPassword.value;
    
    if (!name || !email || !password || !confirmPass) {
        showError('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    if (password !== confirmPass) {
        showError('Mật khẩu xác nhận không khớp');
        return;
    }
    
    if (password.length < 6) {
        showError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }
    
    showLoading(true);
    clearMessages();
    
    const result = await registerUser(email, password, name);
    
    showLoading(false);
    
    if (result.success) {
        showSuccess('Đăng ký thành công! Đang chuyển hướng...');
        // Redirect will be handled by auth state listener
    } else {
        showError(getErrorMessage(result.error));
    }
}

// Handle forgot password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = forgotEmail.value.trim();
    
    if (!email) {
        showError('Vui lòng nhập email');
        return;
    }
    
    showLoading(true);
    clearMessages();
    
    const result = await resetPassword(email);
    
    showLoading(false);
    
    if (result.success) {
        showSuccess('Email khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.');
    } else {
        showError(getErrorMessage(result.error));
    }
}

// Validate password confirmation
function validatePasswordConfirmation() {
    const password = registerPassword.value;
    const confirmPass = confirmPassword.value;
    
    if (confirmPass && password !== confirmPass) {
        confirmPassword.setCustomValidity('Mật khẩu xác nhận không khớp');
    } else {
        confirmPassword.setCustomValidity('');
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Clear messages
function clearMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Show/hide loading
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

// Get user-friendly error message
function getErrorMessage(error) {
    const errorMessages = {
        'auth/user-not-found': 'Không tìm thấy tài khoản với email này',
        'auth/wrong-password': 'Mật khẩu không đúng',
        'auth/email-already-in-use': 'Email này đã được sử dụng',
        'auth/weak-password': 'Mật khẩu quá yếu',
        'auth/invalid-email': 'Email không hợp lệ',
        'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
        'auth/too-many-requests': 'Quá nhiều yêu cầu. Vui lòng thử lại sau',
        'auth/network-request-failed': 'Lỗi kết nối mạng',
        'auth/invalid-credential': 'Thông tin đăng nhập không hợp lệ'
    };
    
    return errorMessages[error] || 'Đã xảy ra lỗi. Vui lòng thử lại';
}

// Make showTab function global
window.showTab = showTab;
