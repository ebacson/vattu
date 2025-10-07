// Global Variables
let inventoryData = [];
let tasksData = [];
let transfersData = [];
let logsData = [];
let currentWarehouse = 'net';
let currentEditingItem = null;
let currentEditingTask = null;
let charts = {};
let currentUser = null;
let userWarehouse = 'net'; // User's assigned warehouse
let isUserAdmin = false; // User's admin status

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupAuthentication();
    
    // Wait for Firebase functions to be available
    waitForFirebaseFunctions().then(() => {
        loadAllDataFromFirebase();
        updateDashboard();
        renderInventoryTable();
        renderTasksList();
        renderTransfersList();
        renderLogsList();
        initializeCharts();
    });
});

// Wait for Firebase functions to be available
function waitForFirebaseFunctions() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.loadAllDataFromFirebase && window.saveInventoryToFirebase) {
                console.log('✅ Firebase functions ready');
                resolve();
            } else {
                console.log('⏳ Waiting for Firebase functions...');
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Permission checking functions
function canManageWarehouse(warehouse) {
    // Admin can manage all warehouses
    if (isUserAdmin) {
        return true;
    }
    // Regular users can only manage their assigned warehouse
    return userWarehouse === warehouse;
}

function canViewWarehouse(warehouse) {
    // Admin can view all warehouses
    if (isUserAdmin) {
        return true;
    }
    // Regular users can view their assigned warehouse
    return userWarehouse === warehouse;
}

function canCreateItem(warehouse) {
    return canManageWarehouse(warehouse);
}

function canEditItem(item) {
    return canManageWarehouse(item.warehouse);
}

function canDeleteItem(item) {
    return canManageWarehouse(item.warehouse);
}

function canCreateTask() {
    // All authenticated users can create tasks
    return currentUser !== null;
}

function canCreateTransfer() {
    // All authenticated users can create transfers
    return currentUser !== null;
}

function canConfirmTransfer(transfer) {
    // Admin can confirm all transfers
    if (isUserAdmin) {
        return true;
    }
    // Regular users can confirm transfers involving their warehouse
    return userWarehouse === transfer.fromWarehouse || userWarehouse === transfer.toWarehouse;
}

// Update UI based on user permissions
function updateUIForPermissions() {
    console.log('🔐 Updating UI for permissions:', { userWarehouse, isUserAdmin });
    
    // Update warehouse selector visibility
    const warehouseSelector = document.getElementById('currentWarehouse');
    if (warehouseSelector) {
        if (isUserAdmin) {
            // Admin can see all warehouses
            warehouseSelector.style.display = 'block';
            warehouseSelector.disabled = false;
        } else {
            // Regular users can only see their assigned warehouse
            warehouseSelector.style.display = 'none';
            warehouseSelector.disabled = true;
        }
    }
    
    // Update add item button visibility
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        if (canCreateItem(currentWarehouse)) {
            addItemBtn.style.display = 'block';
            addItemBtn.disabled = false;
        } else {
            addItemBtn.style.display = 'none';
            addItemBtn.disabled = true;
        }
    }
    
    // Update inventory table
    renderInventoryTable();
    
    // Update tasks and transfers
    renderTasksList();
    renderTransfersList();
}

// Initialize Application
function initializeApp() {
    console.log('Initializing 2-Warehouse Inventory Management System with Firebase...');
    
    // Setup warehouse selector
    setupWarehouseSelector();
    
    // Initialize form validation
    if (typeof window.initializeFormValidation === 'function') {
        window.initializeFormValidation();
    }
    
    showToast('success', 'Hệ thống đã sẵn sàng!', 'Chào mừng đến với hệ thống quản lý vật tư 2 kho với Firebase.');
}

// Setup Event Listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // Warehouse selector
    document.getElementById('currentWarehouse').addEventListener('change', function() {
        currentWarehouse = this.value;
        updateDashboard();
        renderInventoryTable();
        showToast('info', 'Đã chuyển kho', `Chuyển sang ${this.value === 'net' ? 'Kho Net' : 'Kho Hạ Tầng'}`);
    });

    // Search and filters
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('warehouseFilter').addEventListener('change', handleFilter);
    document.getElementById('statusFilter').addEventListener('change', handleFilter);
    document.getElementById('taskStatusFilter').addEventListener('change', handleTaskFilter);
    document.getElementById('transferStatusFilter').addEventListener('change', handleTransferFilter);

    // Sync button - now triggers Firebase sync
    document.getElementById('syncBtn').addEventListener('click', syncWithFirebase);

    // Form submissions
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('itemForm').addEventListener('submit', handleItemSubmit);
    document.getElementById('transferForm').addEventListener('submit', handleTransferSubmit);

    // Modal close on outside click
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
}

// Warehouse Management
function setupWarehouseSelector() {
    const selector = document.getElementById('currentWarehouse');
    selector.value = currentWarehouse;
}

function getWarehouseName(warehouse) {
    return warehouse === 'net' ? 'Kho Net' : 'Kho Hạ Tầng';
}

// Sample Data Loading (fallback)
function loadSampleData() {
    // Sample inventory data
    inventoryData = [
        {
            id: 1,
            serial: 'SN001234567',
            name: 'Switch 24 port',
            warehouse: 'net',
            category: 'Thiết bị mạng',
            condition: 'available',
            source: 'Mới nhập kho',
            dateAdded: new Date('2024-01-15'),
            taskId: null,
            description: 'Switch 24 port Gigabit Ethernet'
        },
        {
            id: 2,
            serial: 'SN001234568',
            name: 'Router WiFi',
            warehouse: 'net',
            category: 'Thiết bị mạng',
            condition: 'available',
            source: 'Mới nhập kho',
            dateAdded: new Date('2024-01-14'),
            taskId: null,
            description: 'Router WiFi 6 băng tần kép'
        }
    ];

    // Sample tasks data
    tasksData = [
        {
            id: 1,
            name: 'Lắp đặt trạm mới ABC',
            type: 'lapdat',
            description: 'Lắp đặt thiết bị mạng cho trạm mới tại khu vực ABC',
            location: 'Trạm ABC - Quận 1',
            priority: 'high',
            status: 'in-progress',
            createdDate: new Date('2024-01-10'),
            deadline: new Date('2024-01-20'),
            createdBy: 'Kho Hạ Tầng',
            assignedItems: [],
            completedItems: []
        }
    ];

    // Sample transfers data
    transfersData = [];

    // Sample logs data
    logsData = [
        {
            id: 1,
            type: 'system',
            action: 'Khởi động hệ thống',
            details: 'Hệ thống đã được khởi động',
            timestamp: new Date(),
            user: 'System'
        }
    ];

    console.log('📦 Sample data loaded');
}

// Firebase Data Loading
async function loadAllDataFromFirebase() {
    try {
        showLoading();
        console.log('Loading all data from Firebase...');
        
        // Check if Firebase functions are available
        if (typeof window.loadAllDataFromFirebase === 'function') {
            await window.loadAllDataFromFirebase();
            console.log('All data loaded from Firebase');
            showToast('success', 'Tải dữ liệu thành công!', 'Đã tải tất cả dữ liệu từ Firebase.');
        } else {
            console.log('Firebase functions not available, using sample data');
            loadSampleData();
            showToast('warning', 'Sử dụng dữ liệu mẫu', 'Firebase chưa sẵn sàng, sử dụng dữ liệu mẫu.');
        }
        
    } catch (error) {
        console.error('Error loading data from Firebase:', error);
        console.log('Falling back to sample data');
        loadSampleData();
        showToast('warning', 'Sử dụng dữ liệu mẫu', 'Lỗi Firebase, sử dụng dữ liệu mẫu.');
    } finally {
        hideLoading();
    }
}

// Dashboard Functions
function updateDashboard() {
    // Update warehouse stats based on user permissions
    const netItems = inventoryData.filter(item => item.warehouse === 'net' && canViewWarehouse('net'));
    const infraItems = inventoryData.filter(item => item.warehouse === 'infrastructure' && canViewWarehouse('infrastructure'));
    
    const netPending = transfersData.filter(t => t.toWarehouse === 'net' && t.status === 'pending' && canConfirmTransfer(t)).length;
    const infraPending = tasksData.filter(t => t.status === 'pending').length;
    
    const netAvailable = netItems.filter(item => item.condition === 'available').length;
    const infraInUse = infraItems.filter(item => item.condition === 'in-use').length;

    // Update Net warehouse stats
    document.getElementById('netTotalItems').textContent = netItems.length;
    document.getElementById('netPendingTransfers').textContent = netPending;
    document.getElementById('netAvailableItems').textContent = netAvailable;

    // Update Infrastructure warehouse stats
    document.getElementById('infraTotalItems').textContent = infraItems.length;
    document.getElementById('infraPendingTasks').textContent = infraPending;
    document.getElementById('infraInUseItems').textContent = infraInUse;

    updateRecentActivities();
    updateActiveTasks();
}

function updateRecentActivities() {
    const activitiesList = document.getElementById('activitiesList');
    const recentLogs = logsData.slice(0, 5);

    if (recentLogs.length === 0) {
        activitiesList.innerHTML = '<p class="no-data">Chưa có hoạt động nào</p>';
        return;
    }

    activitiesList.innerHTML = recentLogs.map(log => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${getActivityColor(log.type)}">
                <i class="${getActivityIcon(log.type)}"></i>
            </div>
            <div class="activity-content">
                <h4>${log.action}</h4>
                <p>${log.details}</p>
            </div>
            <div class="activity-time">
                ${formatTimeAgo(log.timestamp)}
            </div>
        </div>
    `).join('');
}

function updateActiveTasks() {
    const activeTasksList = document.getElementById('activeTasksList');
    const activeTasks = tasksData.filter(task => task.status === 'in-progress' || task.status === 'pending');

    if (activeTasks.length === 0) {
        activeTasksList.innerHTML = '<p class="no-data">Chưa có sự vụ nào</p>';
        return;
    }

    activeTasksList.innerHTML = activeTasks.map(task => `
        <div class="task-card">
            <div class="task-header">
                <h4>${task.name}</h4>
                <span class="task-priority ${task.priority}">${getPriorityText(task.priority)}</span>
            </div>
            <div class="task-info">
                <p><i class="fas fa-map-marker-alt"></i> ${task.location}</p>
                <p><i class="fas fa-clock"></i> Hạn: ${formatDate(task.deadline)}</p>
                <p><i class="fas fa-boxes"></i> ${task.assignedItems.length} vật tư</p>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm btn-primary" onclick="viewTask(${task.id})">Xem</button>
                <button class="btn btn-sm btn-success" onclick="updateTaskStatus(${task.id})">Cập nhật</button>
            </div>
        </div>
    `).join('');
}

// Inventory Management
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const warehouseFilter = document.getElementById('warehouseFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filteredData = inventoryData.filter(item => {
        const matchesWarehouse = warehouseFilter === 'all' || item.warehouse === warehouseFilter;
        const matchesStatus = statusFilter === 'all' || item.condition === statusFilter;
        const matchesSearch = !searchTerm || 
            item.serial.toLowerCase().includes(searchTerm) ||
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm);
        
        // Permission check: only show items from warehouses user can view
        const canView = canViewWarehouse(item.warehouse);

        return matchesWarehouse && matchesStatus && matchesSearch && canView;
    });

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">Không có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = filteredData.map(item => {
        const task = tasksData.find(t => t.id === item.taskId);
        return `
            <tr>
                <td><strong>${item.serial}</strong></td>
                <td>${item.name}</td>
                <td><span class="warehouse-badge ${item.warehouse}">${getWarehouseName(item.warehouse)}</span></td>
                <td><span class="status-badge ${item.condition}">${getConditionText(item.condition)}</span></td>
                <td>${item.source}</td>
                <td>${formatDate(item.dateAdded)}</td>
                <td>${task ? task.name : '-'}</td>
                <td>
                    <div class="action-buttons-table">
                        ${canEditItem(item) ? `
                            <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})" title="Chỉnh sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-info" onclick="viewItemHistory(${item.id})" title="Lịch sử">
                            <i class="fas fa-history"></i>
                        </button>
                        ${canEditItem(item) ? `
                            <button class="btn btn-sm btn-warning" onclick="updateItemCondition(${item.id})" title="Cập nhật tình trạng">
                                <i class="fas fa-tools"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Tasks Management
function renderTasksList() {
    const tasksList = document.getElementById('tasksList');
    const statusFilter = document.getElementById('taskStatusFilter').value;
    const dateFilter = document.getElementById('taskDateFilter').value;

    let filteredTasks = tasksData.filter(task => {
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesDate = !dateFilter || formatDate(task.createdDate) === dateFilter;
        return matchesStatus && matchesDate;
    });

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="no-data">Chưa có sự vụ nào</p>';
        return;
    }

    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-card">
            <div class="task-header">
                <h3>${task.name}</h3>
                <div class="task-status">
                    <span class="status-badge ${task.status}">${getTaskStatusText(task.status)}</span>
                    <span class="priority-badge ${task.priority}">${getPriorityText(task.priority)}</span>
                </div>
            </div>
            <div class="task-info">
                <p><i class="fas fa-tag"></i> ${getTaskTypeText(task.type)}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${task.location}</p>
                <p><i class="fas fa-calendar"></i> Tạo: ${formatDate(task.createdDate)}</p>
                <p><i class="fas fa-clock"></i> Hạn: ${formatDate(task.deadline)}</p>
                <p><i class="fas fa-boxes"></i> ${task.assignedItems.length} vật tư</p>
            </div>
            <div class="task-description">
                <p>${task.description}</p>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm btn-primary" onclick="viewTask(${task.id})">Xem chi tiết</button>
                <button class="btn btn-sm btn-success" onclick="requestItems(${task.id})">Yêu cầu vật tư</button>
                <button class="btn btn-sm btn-warning" onclick="updateTaskStatus(${task.id})">Cập nhật</button>
                <button class="btn btn-sm btn-info" onclick="viewTaskLogs(${task.id})">Lịch sử</button>
            </div>
        </div>
    `).join('');
}

// Transfers Management
function renderTransfersList() {
    const transfersList = document.getElementById('transfersList');
    const statusFilter = document.getElementById('transferStatusFilter').value;
    const typeFilter = document.getElementById('transferTypeFilter').value;

    let filteredTransfers = transfersData.filter(transfer => {
        const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
        const matchesType = typeFilter === 'all' || transfer.type === typeFilter;
        
        // Permission check: only show transfers involving user's warehouse
        const canView = canConfirmTransfer(transfer);
        
        return matchesStatus && matchesType && canView;
    });

    if (filteredTransfers.length === 0) {
        transfersList.innerHTML = '<p class="no-data">Chưa có chuyển kho nào</p>';
        return;
    }

    transfersList.innerHTML = filteredTransfers.map(transfer => {
        const task = tasksData.find(t => t.id === transfer.taskId);
        const items = transfer.items.map(itemId => {
            const item = inventoryData.find(i => i.id === itemId);
            return item ? item.name : 'Unknown';
        }).join(', ');

        return `
            <div class="transfer-card">
                <div class="transfer-header">
                    <h3>Chuyển kho ${getTransferTypeText(transfer.type)}</h3>
                    <span class="status-badge ${transfer.status}">${getTransferStatusText(transfer.status)}</span>
                </div>
                <div class="transfer-info">
                    <p><i class="fas fa-arrow-right"></i> Từ ${getWarehouseName(transfer.fromWarehouse)} → ${getWarehouseName(transfer.toWarehouse)}</p>
                    <p><i class="fas fa-tasks"></i> Sự vụ: ${task ? task.name : 'Không có'}</p>
                    <p><i class="fas fa-boxes"></i> Vật tư: ${items}</p>
                    <p><i class="fas fa-calendar"></i> Ngày tạo: ${formatDate(transfer.createdDate)}</p>
                    ${transfer.confirmedDate ? `<p><i class="fas fa-check"></i> Xác nhận: ${formatDate(transfer.confirmedDate)}</p>` : ''}
                </div>
                <div class="transfer-notes">
                    <p>${transfer.notes}</p>
                </div>
                <div class="transfer-actions">
                    ${transfer.status === 'pending' && canConfirmTransfer(transfer) ? `
                        <button class="btn btn-sm btn-success" onclick="confirmTransfer(${transfer.id})">Xác nhận</button>
                    ` : ''}
                    <button class="btn btn-sm btn-primary" onclick="viewTransferDetails(${transfer.id})">Chi tiết</button>
                    <button class="btn btn-sm btn-info" onclick="viewTransferLogs(${transfer.id})">Lịch sử</button>
                </div>
            </div>
        `;
    }).join('');
}

// Logs Management
function renderLogsList() {
    const logsList = document.getElementById('logsList');
    const typeFilter = document.getElementById('logTypeFilter').value;
    const dateFilter = document.getElementById('logDateFilter').value;
    const searchTerm = document.getElementById('logSearchInput').value.toLowerCase();

    let filteredLogs = logsData.filter(log => {
        const matchesType = typeFilter === 'all' || log.type === typeFilter;
        const matchesDate = !dateFilter || formatDate(log.timestamp) === dateFilter;
        const matchesSearch = !searchTerm || 
            log.action.toLowerCase().includes(searchTerm) ||
            log.details.toLowerCase().includes(searchTerm);
        return matchesType && matchesDate && matchesSearch;
    });

    if (filteredLogs.length === 0) {
        logsList.innerHTML = '<p class="no-data">Chưa có log nào</p>';
        return;
    }

    logsList.innerHTML = filteredLogs.map(log => `
        <div class="log-item">
            <div class="log-icon">
                <i class="${getActivityIcon(log.type)}"></i>
            </div>
            <div class="log-content">
                <h4>${log.action}</h4>
                <p>${log.details}</p>
                <div class="log-meta">
                    <span><i class="fas fa-user"></i> ${log.user}</span>
                    <span><i class="fas fa-clock"></i> ${formatDateTime(log.timestamp)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal Functions
function showCreateTaskModal() {
    currentEditingTask = null;
    document.getElementById('taskModalTitle').textContent = 'Tạo Sự Vụ Mới';
    document.getElementById('taskForm').reset();
    openModal('taskModal');
}

function showAddItemModal() {
    currentEditingItem = null;
    document.getElementById('itemModalTitle').textContent = 'Thêm Vật Tư Mới';
    document.getElementById('itemForm').reset();
    openModal('itemModal');
}

function showTransferModal() {
    document.getElementById('transferModalTitle').textContent = 'Chuyển Kho';
    document.getElementById('transferForm').reset();
    updateTransferTaskOptions();
    openModal('transferModal');
}

function updateTransferTaskOptions() {
    const taskSelect = document.getElementById('transferTask');
    taskSelect.innerHTML = '<option value="">Chọn sự vụ</option>';
    
    tasksData.forEach(task => {
        if (task.status === 'pending' || task.status === 'in-progress') {
            taskSelect.innerHTML += `<option value="${task.id}">${task.name}</option>`;
        }
    });
}

// Form Handlers
async function handleTaskSubmit(e) {
    e.preventDefault();
    
    // Clear previous errors
    if (typeof window.clearFormErrors === 'function') {
        window.clearFormErrors('taskForm');
    }
    
    const formData = {
        name: document.getElementById('taskName').value,
        type: document.getElementById('taskType').value,
        description: document.getElementById('taskDescription').value,
        location: document.getElementById('taskLocation').value,
        priority: document.getElementById('taskPriority').value,
        deadline: document.getElementById('taskDeadline').value ? new Date(document.getElementById('taskDeadline').value) : null
    };

    // Enhanced validation
    if (typeof window.validateTaskForm === 'function') {
        const errors = window.validateTaskForm(formData);
        if (errors.length > 0) {
            window.displayFormErrors(errors);
            return;
        }
    } else {
        // Fallback basic validation
        if (!formData.name || !formData.type || !formData.description) {
            showToast('error', 'Lỗi!', 'Vui lòng điền đầy đủ các trường bắt buộc.');
            return;
        }
    }

    const newTask = {
        id: tasksData.length > 0 ? Math.max(...tasksData.map(t => t.id), 0) + 1 : 1,
        ...formData,
        status: 'pending',
        createdDate: new Date(),
        createdBy: getWarehouseName(currentWarehouse),
        assignedItems: [],
        completedItems: []
    };

    try {
        // Check if Firebase functions are available
        if (typeof window.saveTaskToFirebase === 'function') {
            // Save to Firebase
            await window.saveTaskToFirebase(newTask);
            
            // Update local data
            tasksData.push(newTask);
            await addLog('task', 'Tạo sự vụ', `Tạo sự vụ: ${newTask.name}`, getWarehouseName(currentWarehouse));
            
            showToast('success', 'Tạo sự vụ thành công!', 'Sự vụ mới đã được tạo và lưu vào Firebase.');
        } else {
            // Fallback: just update local data
            tasksData.push(newTask);
            addLog('task', 'Tạo sự vụ', `Tạo sự vụ: ${newTask.name}`, getWarehouseName(currentWarehouse));
            
            showToast('warning', 'Tạo sự vụ thành công!', 'Sự vụ đã được tạo (chưa lưu Firebase).');
        }
        
        updateDashboard();
        renderTasksList();
        closeModal('taskModal');
        
    } catch (error) {
        console.error('Error saving task:', error);
        showToast('error', 'Lỗi!', 'Không thể lưu sự vụ vào Firebase.');
    }
}

async function handleItemSubmit(e) {
    e.preventDefault();
    
    // Clear previous errors
    if (typeof window.clearFormErrors === 'function') {
        window.clearFormErrors('itemForm');
    }
    
    const formData = {
        serial: document.getElementById('itemSerial').value,
        name: document.getElementById('itemName').value,
        warehouse: document.getElementById('itemWarehouse').value,
        category: document.getElementById('itemCategory').value,
        source: document.getElementById('itemSource').value,
        condition: document.getElementById('itemCondition').value,
        description: document.getElementById('itemDescription').value
    };

    // Enhanced validation
    if (typeof window.validateInventoryForm === 'function') {
        const errors = await window.validateInventoryForm(formData, currentEditingItem ? currentEditingItem.id : null);
        if (errors.length > 0) {
            window.displayFormErrors(errors);
            return;
        }
    } else {
        // Fallback basic validation
        if (!formData.serial || !formData.name || !formData.warehouse || !formData.condition) {
            showToast('error', 'Lỗi!', 'Vui lòng điền đầy đủ các trường bắt buộc.');
            return;
        }
    }
    
    // Check permissions
    if (!canCreateItem(formData.warehouse)) {
        showToast('error', 'Lỗi quyền!', `Bạn không có quyền thêm vật tư vào ${getWarehouseName(formData.warehouse)}.`);
        return;
    }

    const newItem = {
        id: inventoryData.length > 0 ? Math.max(...inventoryData.map(i => i.id), 0) + 1 : 1,
        ...formData,
        dateAdded: new Date(),
        taskId: null
    };

    try {
        // Check if Firebase functions are available
        if (typeof window.saveInventoryToFirebase === 'function') {
            // Save to Firebase
            await window.saveInventoryToFirebase(newItem);
            
            // Update local data
            inventoryData.push(newItem);
            await addLog('inventory', 'Thêm vật tư', `Thêm vật tư: ${newItem.name} vào ${getWarehouseName(newItem.warehouse)}`, getWarehouseName(currentWarehouse));
            
            showToast('success', 'Thêm vật tư thành công!', 'Vật tư mới đã được thêm vào hệ thống và lưu vào Firebase.');
        } else {
            // Fallback: just update local data
            inventoryData.push(newItem);
            addLog('inventory', 'Thêm vật tư', `Thêm vật tư: ${newItem.name} vào ${getWarehouseName(newItem.warehouse)}`, getWarehouseName(currentWarehouse));
            
            showToast('warning', 'Thêm vật tư thành công!', 'Vật tư đã được thêm vào hệ thống (chưa lưu Firebase).');
        }
        
        updateDashboard();
        renderInventoryTable();
        closeModal('itemModal');
        
    } catch (error) {
        console.error('Error saving item:', error);
        showToast('error', 'Lỗi!', 'Không thể lưu vật tư vào Firebase.');
    }
}

async function handleTransferSubmit(e) {
    e.preventDefault();
    
    // Clear previous errors
    if (typeof window.clearFormErrors === 'function') {
        window.clearFormErrors('transferForm');
    }
    
    const formData = {
        type: document.getElementById('transferType').value,
        taskId: document.getElementById('transferTask').value ? parseInt(document.getElementById('transferTask').value) : null,
        notes: document.getElementById('transferNotes').value
    };

    if (!formData.type) {
        showToast('error', 'Lỗi!', 'Vui lòng chọn loại chuyển kho.');
        return;
    }
    
    if (!formData.taskId) {
        showToast('error', 'Lỗi!', 'Vui lòng chọn sự vụ liên quan.');
        return;
    }

    // Determine warehouses based on transfer type
    let fromWarehouse, toWarehouse;
    if (formData.type === 'request') {
        fromWarehouse = 'net';
        toWarehouse = 'infrastructure';
    } else {
        fromWarehouse = 'infrastructure';
        toWarehouse = 'net';
    }

    const newTransfer = {
        id: transfersData.length > 0 ? Math.max(...transfersData.map(t => t.id), 0) + 1 : 1,
        ...formData,
        fromWarehouse,
        toWarehouse,
        items: [], // Will be populated when items are selected
        status: 'pending',
        createdDate: new Date(),
        confirmedDate: null
    };

    try {
        // Check if Firebase functions are available
        if (typeof window.saveTransferToFirebase === 'function') {
            // Save to Firebase
            await window.saveTransferToFirebase(newTransfer);
            
            // Update local data
            transfersData.push(newTransfer);
            await addLog('transfer', 'Tạo chuyển kho', `Tạo chuyển kho ${getTransferTypeText(newTransfer.type)} từ ${getWarehouseName(fromWarehouse)} sang ${getWarehouseName(toWarehouse)}`, getWarehouseName(currentWarehouse));
            
            showToast('success', 'Tạo chuyển kho thành công!', 'Chuyển kho mới đã được tạo và lưu vào Firebase.');
        } else {
            // Fallback: just update local data
            transfersData.push(newTransfer);
            addLog('transfer', 'Tạo chuyển kho', `Tạo chuyển kho ${getTransferTypeText(newTransfer.type)} từ ${getWarehouseName(fromWarehouse)} sang ${getWarehouseName(toWarehouse)}`, getWarehouseName(currentWarehouse));
            
            showToast('warning', 'Tạo chuyển kho thành công!', 'Chuyển kho đã được tạo (chưa lưu Firebase).');
        }
        
        updateDashboard();
        renderTransfersList();
        closeModal('transferModal');
        
    } catch (error) {
        console.error('Error saving transfer:', error);
        showToast('error', 'Lỗi!', 'Không thể lưu chuyển kho vào Firebase.');
    }
}

// Search and Filter Functions
function handleSearch() {
    renderInventoryTable();
}

function handleFilter() {
    renderInventoryTable();
}

function handleTaskFilter() {
    renderTasksList();
}

function handleTransferFilter() {
    renderTransfersList();
}

// Utility Functions
async function addLog(type, action, details, user) {
    const newLog = {
        id: logsData.length > 0 ? Math.max(...logsData.map(l => l.id), 0) + 1 : 1,
        type,
        action,
        details,
        timestamp: new Date(),
        user
    };
    
    try {
        // Check if Firebase functions are available
        if (typeof window.saveLogToFirebase === 'function') {
            // Save to Firebase
            await window.saveLogToFirebase(newLog);
        }
        
        // Update local data
        logsData.unshift(newLog); // Add to beginning
        
    } catch (error) {
        console.error('Error saving log:', error);
    }
}

function getActivityColor(type) {
    const colors = {
        'transfer': '#3498db',
        'task': '#27ae60',
        'inventory': '#f39c12',
        'confirmation': '#9b59b6'
    };
    return colors[type] || '#95a5a6';
}

function getActivityIcon(type) {
    const icons = {
        'transfer': 'fas fa-exchange-alt',
        'task': 'fas fa-tasks',
        'inventory': 'fas fa-boxes',
        'confirmation': 'fas fa-check-circle'
    };
    return icons[type] || 'fas fa-info';
}

function getConditionText(condition) {
    const conditions = {
        'available': 'Sẵn sàng',
        'in-use': 'Đang sử dụng',
        'maintenance': 'Bảo trì',
        'damaged': 'Hỏng'
    };
    return conditions[condition] || condition;
}

function getTaskStatusText(status) {
    const statuses = {
        'pending': 'Chờ xử lý',
        'in-progress': 'Đang thực hiện',
        'waiting-confirmation': 'Chờ xác nhận',
        'completed': 'Hoàn thành',
        'cancelled': 'Hủy bỏ'
    };
    return statuses[status] || status;
}

function getTaskTypeText(type) {
    const types = {
        'xuly': 'Xử lý',
        'lapdat': 'Lắp đặt',
        'swap': 'Swap',
        'nangcap': 'Nâng cấp',
        'baotri': 'Bảo trì',
        'khac': 'Khác'
    };
    return types[type] || type;
}

function getPriorityText(priority) {
    const priorities = {
        'low': 'Thấp',
        'medium': 'Trung bình',
        'high': 'Cao',
        'urgent': 'Khẩn cấp'
    };
    return priorities[priority] || priority;
}

function getTransferTypeText(type) {
    const types = {
        'request': 'Yêu cầu',
        'return': 'Trả về'
    };
    return types[type] || type;
}

function getTransferStatusText(status) {
    const statuses = {
        'pending': 'Chờ chuyển',
        'in-transit': 'Đang chuyển',
        'delivered': 'Đã giao',
        'confirmed': 'Đã xác nhận'
    };
    return statuses[status] || status;
}

function formatDate(date) {
    return date.toLocaleDateString('vi-VN');
}

function formatDateTime(date) {
    return date.toLocaleString('vi-VN');
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
}

// Tab Management
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    switch(tabName) {
        case 'statistics':
            updateCharts();
            break;
    }
}

// Charts
function initializeCharts() {
    // Warehouse Chart
    const warehouseCtx = document.getElementById('warehouseChart').getContext('2d');
    charts.warehouse = new Chart(warehouseCtx, {
        type: 'doughnut',
        data: {
            labels: ['Kho Net', 'Kho Hạ Tầng'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#3498db', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Task Status Chart
    const taskStatusCtx = document.getElementById('taskStatusChart').getContext('2d');
    charts.taskStatus = new Chart(taskStatusCtx, {
        type: 'pie',
        data: {
            labels: ['Chờ xử lý', 'Đang thực hiện', 'Hoàn thành'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#f39c12', '#3498db', '#27ae60']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Transfer Trend Chart
    const transferTrendCtx = document.getElementById('transferTrendChart').getContext('2d');
    charts.transferTrend = new Chart(transferTrendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Chuyển kho',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Performance Chart
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    charts.performance = new Chart(performanceCtx, {
        type: 'bar',
        data: {
            labels: ['Tuần này', 'Tháng này', 'Quý này'],
            datasets: [{
                label: 'Sự vụ hoàn thành',
                data: [0, 0, 0],
                backgroundColor: '#27ae60'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateCharts() {
    // Update warehouse chart
    const netCount = inventoryData.filter(item => item.warehouse === 'net').length;
    const infraCount = inventoryData.filter(item => item.warehouse === 'infrastructure').length;
    
    charts.warehouse.data.datasets[0].data = [netCount, infraCount];
    charts.warehouse.update();

    // Update task status chart
    const pendingCount = tasksData.filter(task => task.status === 'pending').length;
    const inProgressCount = tasksData.filter(task => task.status === 'in-progress').length;
    const completedCount = tasksData.filter(task => task.status === 'completed').length;
    
    charts.taskStatus.data.datasets[0].data = [pendingCount, inProgressCount, completedCount];
    charts.taskStatus.update();
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Loading Functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Toast Notifications
function showToast(type, title, message) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconMap[type]}"></i>
        </div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Show confirmation dialog
function showConfirmDialog(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.5); display: flex;
            align-items: center; justify-content: center; z-index: 10000;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white; border-radius: 15px; max-width: 500px; width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;
        
        dialog.innerHTML = `
            <div style="padding: 25px; border-bottom: 1px solid #e1e5e9;">
                <h3 style="margin: 0; color: #2c3e50; font-size: 1.5rem;">
                    <i class="fas fa-question-circle" style="color: #3498db; margin-right: 10px;"></i>
                    ${title}
                </h3>
            </div>
            <div style="padding: 25px; color: #555; line-height: 1.6;">${message}</div>
            <div style="padding: 20px 25px; border-top: 1px solid #e1e5e9; display: flex; justify-content: flex-end; gap: 10px;">
                <button class="cancel-btn btn btn-secondary">${cancelText}</button>
                <button class="confirm-btn btn btn-primary">${confirmText}</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        const confirmBtn = dialog.querySelector('.confirm-btn');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        
        confirmBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });
        
        cancelBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

// Placeholder functions for future implementation
function viewTask(taskId) {
    showToast('info', 'Xem sự vụ', `Xem chi tiết sự vụ #${taskId}`);
}

function requestItems(taskId) {
    showToast('info', 'Yêu cầu vật tư', `Yêu cầu vật tư cho sự vụ #${taskId}`);
}

function updateTaskStatus(taskId) {
    showToast('info', 'Cập nhật sự vụ', `Cập nhật trạng thái sự vụ #${taskId}`);
}

async function confirmTransfer(transferId) {
    const transfer = transfersData.find(t => t.id === transferId);
    if (!transfer) {
        showToast('error', 'Lỗi!', 'Không tìm thấy chuyển kho.');
        return;
    }
    
    if (!canConfirmTransfer(transfer)) {
        showToast('error', 'Lỗi quyền!', 'Bạn không có quyền xác nhận chuyển kho này.');
        return;
    }
    
    // Show confirmation dialog
    const confirmed = await showConfirmDialog(
        'Xác nhận chuyển kho',
        `Bạn có chắc muốn xác nhận chuyển kho này?<br><br>
        <strong>Loại:</strong> ${getTransferTypeText(transfer.type)}<br>
        <strong>Từ:</strong> ${getWarehouseName(transfer.fromWarehouse)}<br>
        <strong>Đến:</strong> ${getWarehouseName(transfer.toWarehouse)}<br>
        <strong>Ngày tạo:</strong> ${formatDateTime(transfer.createdDate)}<br>
        ${transfer.notes ? `<strong>Ghi chú:</strong> ${transfer.notes}` : ''}`,
        'Xác nhận',
        'Hủy'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Update transfer status
        transfer.status = 'confirmed';
        transfer.confirmedDate = new Date();
        transfer.confirmedBy = currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown';
        
        // Update items in transfer if any
        if (transfer.items && transfer.items.length > 0) {
            transfer.items.forEach(itemId => {
                const item = inventoryData.find(i => i.id === itemId);
                if (item) {
                    // Update item warehouse
                    item.warehouse = transfer.toWarehouse;
                    item.condition = 'in-use';
                    item.taskId = transfer.taskId;
                }
            });
        }
        
        // Save to Firebase
        if (typeof window.saveTransferToFirebase === 'function') {
            await window.saveTransferToFirebase(transfer);
        }
        
        // Add detailed log
        const logDetails = `Xác nhận chuyển kho #${transferId} (${getTransferTypeText(transfer.type)}) từ ${getWarehouseName(transfer.fromWarehouse)} sang ${getWarehouseName(transfer.toWarehouse)}. ${transfer.items ? `Số vật tư: ${transfer.items.length}` : ''}`;
        await addLog('confirmation', 'Xác nhận chuyển kho', logDetails, getWarehouseName(currentWarehouse));
        
        showToast('success', 'Xác nhận thành công!', 'Chuyển kho đã được xác nhận và vật tư đã được cập nhật.');
        
        updateDashboard();
        renderTransfersList();
        renderInventoryTable();
        
    } catch (error) {
        console.error('Error confirming transfer:', error);
        showToast('error', 'Lỗi!', 'Không thể xác nhận chuyển kho.');
    }
}

function editItem(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) {
        showToast('error', 'Lỗi!', 'Không tìm thấy vật tư.');
        return;
    }
    
    if (!canEditItem(item)) {
        showToast('error', 'Lỗi quyền!', `Bạn không có quyền chỉnh sửa vật tư trong ${getWarehouseName(item.warehouse)}.`);
        return;
    }
    
    showToast('info', 'Chỉnh sửa vật tư', `Chỉnh sửa vật tư #${itemId}`);
}

function viewItemHistory(itemId) {
    showToast('info', 'Lịch sử vật tư', `Xem lịch sử vật tư #${itemId}`);
}

function updateItemCondition(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) {
        showToast('error', 'Lỗi!', 'Không tìm thấy vật tư.');
        return;
    }
    
    if (!canEditItem(item)) {
        showToast('error', 'Lỗi quyền!', `Bạn không có quyền cập nhật tình trạng vật tư trong ${getWarehouseName(item.warehouse)}.`);
        return;
    }
    
    showToast('info', 'Cập nhật tình trạng', `Cập nhật tình trạng vật tư #${itemId}`);
}

function viewTaskLogs(taskId) {
    showToast('info', 'Lịch sử sự vụ', `Xem lịch sử sự vụ #${taskId}`);
}

function viewTransferDetails(transferId) {
    showToast('info', 'Chi tiết chuyển kho', `Xem chi tiết chuyển kho #${transferId}`);
}

function viewTransferLogs(transferId) {
    showToast('info', 'Lịch sử chuyển kho', `Xem lịch sử chuyển kho #${transferId}`);
}

function showPendingConfirmations() {
    switchTab('transfers');
    document.getElementById('transferStatusFilter').value = 'pending';
    handleTransferFilter();
}

function exportLogs() {
    const dataStr = JSON.stringify(logsData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('success', 'Xuất log thành công!', 'File log đã được tải về.');
}

// Firebase Sync Function
async function syncWithFirebase() {
    try {
        showLoading();
        console.log('Syncing data with Firebase...');
        
        // Reload all data from Firebase
        await loadAllDataFromFirebase();
        
        showToast('success', 'Đồng bộ thành công!', 'Tất cả dữ liệu đã được đồng bộ với Firebase.');
        
    } catch (error) {
        console.error('Sync error:', error);
        showToast('error', 'Lỗi đồng bộ!', error.message);
    } finally {
        hideLoading();
    }
}

// Add CSS for toast animation
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Authentication Functions
async function setupAuthentication() {
    try {
        // Import authentication functions
        const { 
            onAuthStateChange, 
            signOutUser, 
            getUserDisplayName, 
            getUserEmail,
            isAuthenticated,
            getUserData,
            getUserWarehouse,
            isUserAdmin
        } = await import('./auth-integration.js');
        
        // Setup authentication state listener
        onAuthStateChange(async (user) => {
            currentUser = user;
            await updateUserInterface(user);
            
            if (!user) {
                // User not authenticated, redirect to login
                window.location.href = 'auth.html';
            }
        });
        
        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const result = await signOutUser();
                if (result.success) {
                    showToast('Đăng xuất thành công', 'success');
                    window.location.href = 'auth.html';
                } else {
                    showToast('Lỗi đăng xuất: ' + result.error, 'error');
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Authentication setup error:', error);
        // If authentication fails, redirect to login
        window.location.href = 'auth.html';
    }
}

// Update user interface based on authentication state
async function updateUserInterface(user) {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const currentWarehouseSelect = document.getElementById('currentWarehouse');
    
    if (user && userInfo && userName) {
        try {
            // Get user data from Firebase
            const { getUserData, getUserWarehouse, isUserAdmin } = await import('./auth-integration.js');
            const userDataResult = await getUserData();
            
            if (userDataResult.success) {
                const userData = userDataResult.userData;
                const displayName = userData.displayName || user.email;
                const warehouse = userData.warehouse || 'net';
                const isAdmin = userData.admin || false;
                
                // Update global variables
                userWarehouse = warehouse;
                isUserAdmin = isAdmin;
                currentWarehouse = warehouse;
                
                // Update user name display
                userName.innerHTML = `
                    Xin chào, ${displayName}
                    <br><small style="color: #666;">
                        ${isAdmin ? '👑 Admin' : '👤 User'} | 
                        Kho: ${warehouse === 'net' ? 'Net' : 'Hạ Tầng'}
                    </small>
                `;
                
                // Update warehouse selector to match user's warehouse
                if (currentWarehouseSelect) {
                    currentWarehouseSelect.value = warehouse;
                    currentWarehouse = warehouse;
                }
                
                // Update UI based on permissions
                updateUIForPermissions();
                
                userInfo.style.display = 'block';
                
                console.log('✅ User interface updated:', {
                    displayName,
                    warehouse,
                    isAdmin,
                    userData
                });
            } else {
                // User exists but no data in Firebase yet (new user)
                console.log('ℹ️ User authenticated but no data in Firebase yet');
                const displayName = user.displayName || user.email;
                userName.innerHTML = `
                    Xin chào, ${displayName}
                    <br><small style="color: #666;">
                        👤 User | Kho: Net (mặc định)
                    </small>
                `;
                
                // Set default values
                userWarehouse = 'net';
                isUserAdmin = false;
                currentWarehouse = 'net';
                
                if (currentWarehouseSelect) {
                    currentWarehouseSelect.value = 'net';
                }

                updateUIForPermissions();
                userInfo.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Error updating user interface:', error);
            // Fallback
            const displayName = user.displayName || user.email;
            userName.textContent = `Xin chào, ${displayName}`;
            userInfo.style.display = 'block';
        }
    } else if (userInfo) {
        userInfo.style.display = 'none';
    }
}