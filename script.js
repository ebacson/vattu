// Global Variables
let inventoryData = [];
let tasksData = [];
let transfersData = [];
let logsData = [];
let currentWarehouse = 'net';
let currentEditingItem = null;
let currentEditingTask = null;
let charts = {};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    
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

// Initialize Application
function initializeApp() {
    console.log('Initializing 2-Warehouse Inventory Management System with Firebase...');
    
    // Setup warehouse selector
    setupWarehouseSelector();
    
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
            code: 'VT001',
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
            code: 'VT002',
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
    // Update warehouse stats
    const netItems = inventoryData.filter(item => item.warehouse === 'net');
    const infraItems = inventoryData.filter(item => item.warehouse === 'infrastructure');
    
    const netPending = transfersData.filter(t => t.toWarehouse === 'net' && t.status === 'pending').length;
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
            item.code.toLowerCase().includes(searchTerm) ||
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm);

        return matchesWarehouse && matchesStatus && matchesSearch;
    });

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">Không có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = filteredData.map(item => {
        const task = tasksData.find(t => t.id === item.taskId);
        return `
            <tr>
                <td><strong>${item.code}</strong></td>
                <td>${item.name}</td>
                <td><span class="warehouse-badge ${item.warehouse}">${getWarehouseName(item.warehouse)}</span></td>
                <td><span class="status-badge ${item.condition}">${getConditionText(item.condition)}</span></td>
                <td>${item.source}</td>
                <td>${formatDate(item.dateAdded)}</td>
                <td>${task ? task.name : '-'}</td>
                <td>
                    <div class="action-buttons-table">
                        <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="viewItemHistory(${item.id})" title="Lịch sử">
                            <i class="fas fa-history"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="updateItemCondition(${item.id})" title="Cập nhật tình trạng">
                            <i class="fas fa-tools"></i>
                        </button>
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
        return matchesStatus && matchesType;
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
                    ${transfer.status === 'pending' ? `
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
    
    const formData = {
        name: document.getElementById('taskName').value,
        type: document.getElementById('taskType').value,
        description: document.getElementById('taskDescription').value,
        location: document.getElementById('taskLocation').value,
        priority: document.getElementById('taskPriority').value,
        deadline: document.getElementById('taskDeadline').value ? new Date(document.getElementById('taskDeadline').value) : null
    };

    if (!formData.name || !formData.type || !formData.description) {
        showToast('error', 'Lỗi!', 'Vui lòng điền đầy đủ các trường bắt buộc.');
        return;
    }

    const newTask = {
        id: Math.max(...tasksData.map(t => t.id), 0) + 1,
        ...formData,
        status: 'pending',
        createdDate: new Date(),
        createdBy: getWarehouseName(currentWarehouse),
        assignedItems: [],
        completedItems: []
    };

    try {
        // Save to Firebase
        await saveTaskToFirebase(newTask);
        
        // Update local data
        tasksData.push(newTask);
        await addLog('task', 'Tạo sự vụ', `Tạo sự vụ: ${newTask.name}`, getWarehouseName(currentWarehouse));
        
        showToast('success', 'Tạo sự vụ thành công!', 'Sự vụ mới đã được tạo và lưu vào Firebase.');
        
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
    
    const formData = {
        code: document.getElementById('itemCode').value,
        name: document.getElementById('itemName').value,
        warehouse: document.getElementById('itemWarehouse').value,
        category: document.getElementById('itemCategory').value,
        source: document.getElementById('itemSource').value,
        condition: document.getElementById('itemCondition').value,
        description: document.getElementById('itemDescription').value
    };

    if (!formData.code || !formData.name || !formData.warehouse || !formData.condition) {
        showToast('error', 'Lỗi!', 'Vui lòng điền đầy đủ các trường bắt buộc.');
        return;
    }

    const newItem = {
        id: Math.max(...inventoryData.map(i => i.id), 0) + 1,
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
    
    const formData = {
        type: document.getElementById('transferType').value,
        taskId: document.getElementById('transferTask').value ? parseInt(document.getElementById('transferTask').value) : null,
        notes: document.getElementById('transferNotes').value
    };

    if (!formData.type) {
        showToast('error', 'Lỗi!', 'Vui lòng chọn loại chuyển kho.');
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
        id: Math.max(...transfersData.map(t => t.id), 0) + 1,
        ...formData,
        fromWarehouse,
        toWarehouse,
        items: [], // Will be populated when items are selected
        status: 'pending',
        createdDate: new Date(),
        confirmedDate: null
    };

    try {
        // Save to Firebase
        await saveTransferToFirebase(newTransfer);
        
        // Update local data
        transfersData.push(newTransfer);
        await addLog('transfer', 'Tạo chuyển kho', `Tạo chuyển kho ${getTransferTypeText(newTransfer.type)} từ ${getWarehouseName(fromWarehouse)} sang ${getWarehouseName(toWarehouse)}`, getWarehouseName(currentWarehouse));
        
        showToast('success', 'Tạo chuyển kho thành công!', 'Chuyển kho mới đã được tạo và lưu vào Firebase.');
        
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
        id: Math.max(...logsData.map(l => l.id), 0) + 1,
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

function confirmTransfer(transferId) {
    const transfer = transfersData.find(t => t.id === transferId);
    if (transfer) {
        transfer.status = 'confirmed';
        transfer.confirmedDate = new Date();
        addLog('confirmation', 'Xác nhận chuyển kho', `Xác nhận chuyển kho #${transferId}`, getWarehouseName(currentWarehouse));
        showToast('success', 'Xác nhận thành công!', 'Chuyển kho đã được xác nhận.');
        updateDashboard();
        renderTransfersList();
    }
}

function editItem(itemId) {
    showToast('info', 'Chỉnh sửa vật tư', `Chỉnh sửa vật tư #${itemId}`);
}

function viewItemHistory(itemId) {
    showToast('info', 'Lịch sử vật tư', `Xem lịch sử vật tư #${itemId}`);
}

function updateItemCondition(itemId) {
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