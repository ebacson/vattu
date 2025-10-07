// Form Validation and Enhancement Module
// Provides validation, real-time feedback, and improved UX for forms

// Validation Rules
const validationRules = {
    serial: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: /^[A-Z0-9-]+$/i,
        message: 'Số serial phải từ 3-50 ký tự, chỉ chứa chữ, số và dấu gạch ngang'
    },
    name: {
        required: true,
        minLength: 3,
        maxLength: 100,
        message: 'Tên vật tư phải từ 3-100 ký tự'
    },
    taskName: {
        required: true,
        minLength: 5,
        maxLength: 100,
        message: 'Tên sự vụ phải từ 5-100 ký tự'
    },
    description: {
        required: false,
        maxLength: 500,
        message: 'Mô tả không được quá 500 ký tự'
    },
    location: {
        required: true,
        minLength: 3,
        maxLength: 100,
        message: 'Địa điểm phải từ 3-100 ký tự'
    },
    source: {
        required: false,
        maxLength: 200,
        message: 'Nguồn gốc không được quá 200 ký tự'
    },
    category: {
        required: false,
        maxLength: 50,
        message: 'Danh mục không được quá 50 ký tự'
    }
};

// Validate single field
function validateField(fieldName, value, rules) {
    const result = {
        valid: true,
        message: ''
    };

    if (!rules) return result;

    // Required check
    if (rules.required && (!value || value.trim() === '')) {
        result.valid = false;
        result.message = 'Trường này là bắt buộc';
        return result;
    }

    // Skip other checks if field is empty and not required
    if (!value || value.trim() === '') {
        return result;
    }

    const trimmedValue = value.trim();

    // Min length check
    if (rules.minLength && trimmedValue.length < rules.minLength) {
        result.valid = false;
        result.message = `Tối thiểu ${rules.minLength} ký tự`;
        return result;
    }

    // Max length check
    if (rules.maxLength && trimmedValue.length > rules.maxLength) {
        result.valid = false;
        result.message = `Tối đa ${rules.maxLength} ký tự`;
        return result;
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
        result.valid = false;
        result.message = rules.message || 'Định dạng không hợp lệ';
        return result;
    }

    return result;
}

// Show field error
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Remove existing error
    removeFieldError(fieldId);

    // Add error class
    field.classList.add('field-error');

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error-message';
    errorDiv.textContent = message;
    errorDiv.id = `${fieldId}-error`;

    // Insert after field
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

// Remove field error
function removeFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.remove('field-error');
    const errorMsg = document.getElementById(`${fieldId}-error`);
    if (errorMsg) {
        errorMsg.remove();
    }
}

// Show field success
function showFieldSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    removeFieldError(fieldId);
    field.classList.add('field-success');
    
    // Remove success class after animation
    setTimeout(() => {
        field.classList.remove('field-success');
    }, 1000);
}

// Setup real-time validation for a field
function setupFieldValidation(fieldId, ruleName) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const rules = validationRules[ruleName];
    if (!rules) return;

    // Validate on blur
    field.addEventListener('blur', function() {
        const value = this.value;
        const result = validateField(ruleName, value, rules);
        
        if (!result.valid) {
            showFieldError(fieldId, result.message);
        } else if (value.trim() !== '') {
            showFieldSuccess(fieldId);
        }
    });

    // Clear error on input
    field.addEventListener('input', function() {
        if (this.classList.contains('field-error')) {
            removeFieldError(fieldId);
        }
    });

    // Show character count for long fields
    if (rules.maxLength) {
        const charCountDiv = document.createElement('div');
        charCountDiv.className = 'char-count';
        charCountDiv.id = `${fieldId}-char-count`;
        field.parentNode.appendChild(charCountDiv);

        field.addEventListener('input', function() {
            const count = this.value.length;
            const maxLength = rules.maxLength;
            charCountDiv.textContent = `${count}/${maxLength} ký tự`;
            
            if (count > maxLength * 0.9) {
                charCountDiv.classList.add('warning');
            } else {
                charCountDiv.classList.remove('warning');
            }
        });
    }
}

// Validate entire form
function validateForm(formData, fieldRules) {
    const errors = [];
    
    for (const [fieldName, ruleName] of Object.entries(fieldRules)) {
        const value = formData[fieldName];
        const rules = validationRules[ruleName];
        
        if (rules) {
            const result = validateField(ruleName, value, rules);
            if (!result.valid) {
                errors.push({
                    field: fieldName,
                    message: result.message
                });
            }
        }
    }
    
    return errors;
}

// Check for duplicate serial number
async function checkDuplicateSerial(serial, excludeId = null) {
    const existingItem = inventoryData.find(item => 
        item.serial.toLowerCase() === serial.toLowerCase() && 
        item.id !== excludeId
    );
    
    return existingItem !== undefined;
}

// Enhanced validation for inventory form
async function validateInventoryForm(formData, editingItemId = null) {
    const fieldRules = {
        serial: 'serial',
        name: 'name',
        category: 'category',
        source: 'source',
        description: 'description'
    };
    
    const errors = validateForm(formData, fieldRules);
    
    // Check for duplicate serial
    if (formData.serial) {
        const isDuplicate = await checkDuplicateSerial(formData.serial, editingItemId);
        if (isDuplicate) {
            errors.push({
                field: 'serial',
                message: 'Số serial này đã tồn tại trong hệ thống'
            });
        }
    }
    
    return errors;
}

// Enhanced validation for task form
function validateTaskForm(formData) {
    const fieldRules = {
        name: 'taskName',
        description: 'description',
        location: 'location'
    };
    
    const errors = validateForm(formData, fieldRules);
    
    // Validate deadline if provided
    if (formData.deadline) {
        const deadline = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deadline < today) {
            errors.push({
                field: 'deadline',
                message: 'Deadline không thể là ngày trong quá khứ'
            });
        }
    }
    
    return errors;
}

// Enhanced validation for transfer form
function validateTransferForm(formData) {
    const errors = [];
    
    // Check if items are selected
    if (!formData.items || formData.items.length === 0) {
        errors.push({
            field: 'items',
            message: 'Vui lòng chọn ít nhất một vật tư để chuyển'
        });
    }
    
    // Check if source and destination are different
    if (formData.fromWarehouse === formData.toWarehouse) {
        errors.push({
            field: 'toWarehouse',
            message: 'Kho đích phải khác kho nguồn'
        });
    }
    
    // Check if task is selected
    if (!formData.taskId) {
        errors.push({
            field: 'taskId',
            message: 'Vui lòng chọn sự vụ liên quan'
        });
    }
    
    return errors;
}

// Display form errors
function displayFormErrors(errors) {
    errors.forEach(error => {
        const fieldId = getFieldId(error.field);
        if (fieldId) {
            showFieldError(fieldId, error.message);
        }
    });
    
    // Show summary toast
    if (errors.length > 0) {
        showToast('error', 'Lỗi nhập liệu!', `Có ${errors.length} lỗi cần sửa. Vui lòng kiểm tra lại.`);
    }
}

// Get field ID from field name
function getFieldId(fieldName) {
    const fieldMap = {
        'serial': 'itemSerial',
        'name': 'itemName',
        'category': 'itemCategory',
        'source': 'itemSource',
        'description': 'itemDescription',
        'taskName': 'taskName',
        'location': 'taskLocation',
        'deadline': 'taskDeadline',
        'items': 'transferItems',
        'fromWarehouse': 'transferFromWarehouse',
        'toWarehouse': 'transferToWarehouse',
        'taskId': 'transferTask'
    };
    
    return fieldMap[fieldName] || fieldName;
}

// Clear all form errors
function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const errorFields = form.querySelectorAll('.field-error');
    errorFields.forEach(field => {
        field.classList.remove('field-error');
    });
    
    const errorMessages = form.querySelectorAll('.field-error-message');
    errorMessages.forEach(msg => msg.remove());
    
    const charCounts = form.querySelectorAll('.char-count');
    charCounts.forEach(count => {
        count.textContent = '';
        count.classList.remove('warning');
    });
}

// Initialize form validation
function initializeFormValidation() {
    // Inventory form
    setupFieldValidation('itemSerial', 'serial');
    setupFieldValidation('itemName', 'name');
    setupFieldValidation('itemCategory', 'category');
    setupFieldValidation('itemSource', 'source');
    setupFieldValidation('itemDescription', 'description');
    
    // Task form
    setupFieldValidation('taskName', 'taskName');
    setupFieldValidation('taskDescription', 'description');
    setupFieldValidation('taskLocation', 'location');
    
    console.log('✅ Form validation initialized');
}

// Export functions
window.validateInventoryForm = validateInventoryForm;
window.validateTaskForm = validateTaskForm;
window.validateTransferForm = validateTransferForm;
window.displayFormErrors = displayFormErrors;
window.clearFormErrors = clearFormErrors;
window.initializeFormValidation = initializeFormValidation;

console.log('✅ Form validation module loaded');

