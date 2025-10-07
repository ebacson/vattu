// Global Variables
let inventoryData = [];
let tasksData = [];
let transfersData = [];
let logsData = [];
let currentWarehouse = 'net';
let currentEditingItem = null;
let currentEditingTask = null;
let charts = {};

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    spreadsheetId: '1HLCUeCphiODncUk4yA7yDMaOeeLbug2a19Sf_HVTPqk',
    range: 'Sheet1!A:Z',
    apiKey: '96c75d7f6fd066b74f335631bd840e6db963f025'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSampleData();
    updateDashboard();
    renderInventoryTable();
    renderTasksList();
    renderTransfersList();
    renderLogsList();
    initializeCharts();
});

// Initialize Application
function initializeApp() {
    console.log('Initializing 2-Warehouse Inventory Management System...');
    
    // Setup warehouse selector
    setupWarehouseSelector();
    
    showToast('success', 'Hệ thống đã sẵn sàng!', 'Chào mừng đến với hệ thống quản lý vật tư 2 kho.');
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

    // Sync button
    document.getElementById('syncBtn').addEventListener('click', syncWithGoogleSheets);

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

// Sample Data Loading
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
        },
        {
            id: 3,
            code: 'VT003',
            name: 'Cáp mạng CAT6',
            warehouse: 'infrastructure',
            category: 'Phụ kiện',
            condition: 'in-use',
            source: 'Chuyển từ kho Net',
            dateAdded: new Date('2024-01-13'),
            taskId: 1,
            description: 'Cáp mạng CAT6 UTP 305m'
        },
        {
            id: 4,
            code: 'VT004',
            name: 'Ổ cắm mạng',
            warehouse: 'infrastructure',
            category: 'Phụ kiện',
            condition: 'in-use',
            source: 'Chuyển từ kho Net',
            dateAdded: new Date('2024-01-12'),
            taskId: 1,
            description: 'Ổ cắm mạng RJ45'
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
            assignedItems: [3, 4],
            completedItems: []
        },
        {
            id: 2,
            name: 'Nâng cấp trạm XYZ',
            type: 'nangcap',
            description: 'Nâng cấp thiết bị mạng cho trạm XYZ',
            location: 'Trạm XYZ - Quận 2',
            priority: 'medium',
            status: 'pending',
            createdDate: new Date('2024-01-12'),
            deadline: new Date('2024-01-25'),
            createdBy: 'Kho Hạ Tầng',
            assignedItems: [],
            completedItems: []
        }
    ];

    // Sample transfers data
    transfersData = [
        {
            id: 1,
            type: 'request',
            taskId: 1,
            fromWarehouse: 'net',
            toWarehouse: 'infrastructure',
            items: [3, 4],
            status: 'confirmed',
            createdDate: new Date('2024-01-10'),
            confirmedDate: new Date('2024-01-11'),
            notes: 'Vật tư cho sự vụ lắp đặt trạm ABC'
        }
    ];

    // Sample logs data
    logsData = [
        {
            id: 1,
            type: 'transfer',
            action: 'Chuyển kho',
            details: 'Chuyển 2 vật tư từ Kho Net sang Kho Hạ Tầng',
            timestamp: new Date('2024-01-10 09:30:00'),
            user: 'System'
        },
        {
            id: 2,
            type: 'task',
            action: 'Tạo sự vụ',
            details: 'Tạo sự vụ: Lắp đặt trạm mới ABC',
            timestamp: new Date('2024-01-10 08:00:00'),
            user: 'Kho Hạ Tầng'
        },
        {
            id: 3,
            type: 'confirmation',
            action: 'Xác nhận giao nhận',
            details: 'Xác nhận nhận vật tư cho sự vụ #1',
            timestamp: new Date('2024-01-11 14:20:00'),
            user: 'Kho Hạ Tầng'
        }
    ];

    updateDashboard();
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
function handleTaskSubmit(e) {
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

    tasksData.push(newTask);
    addLog('task', 'Tạo sự vụ', `Tạo sự vụ: ${newTask.name}`, getWarehouseName(currentWarehouse));
    
    showToast('success', 'Tạo sự vụ thành công!', 'Sự vụ mới đã được tạo.');
    
    // Auto sync to Google Sheets
    setTimeout(() => {
        syncTasksToSheets().catch(error => {
            console.error('Auto sync tasks failed:', error);
            showToast('warning', 'Cảnh báo', 'Tạo sự vụ thành công nhưng chưa đồng bộ được với Google Sheets.');
        });
    }, 1000);
    
    updateDashboard();
    renderTasksList();
    closeModal('taskModal');
}

function handleItemSubmit(e) {
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

    inventoryData.push(newItem);
    addLog('inventory', 'Thêm vật tư', `Thêm vật tư: ${newItem.name} vào ${getWarehouseName(newItem.warehouse)}`, getWarehouseName(currentWarehouse));
    
    showToast('success', 'Thêm vật tư thành công!', 'Vật tư mới đã được thêm vào hệ thống.');
    
    // Auto sync to Google Sheets
    setTimeout(() => {
        syncInventoryToSheets().catch(error => {
            console.error('Auto sync inventory failed:', error);
            showToast('warning', 'Cảnh báo', 'Thêm vật tư thành công nhưng chưa đồng bộ được với Google Sheets.');
        });
    }, 1000);
    
    updateDashboard();
    renderInventoryTable();
    closeModal('itemModal');
}

function handleTransferSubmit(e) {
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

    transfersData.push(newTransfer);
    addLog('transfer', 'Tạo chuyển kho', `Tạo chuyển kho ${getTransferTypeText(newTransfer.type)} từ ${getWarehouseName(fromWarehouse)} sang ${getWarehouseName(toWarehouse)}`, getWarehouseName(currentWarehouse));
    
    showToast('success', 'Tạo chuyển kho thành công!', 'Chuyển kho mới đã được tạo.');
    
    // Auto sync to Google Sheets
    setTimeout(() => {
        syncTransfersToSheets().catch(error => {
            console.error('Auto sync transfers failed:', error);
            showToast('warning', 'Cảnh báo', 'Tạo chuyển kho thành công nhưng chưa đồng bộ được với Google Sheets.');
        });
    }, 1000);
    
    updateDashboard();
    renderTransfersList();
    closeModal('transferModal');
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
function addLog(type, action, details, user) {
    const newLog = {
        id: Math.max(...logsData.map(l => l.id), 0) + 1,
        type,
        action,
        details,
        timestamp: new Date(),
        user
    };
    logsData.unshift(newLog); // Add to beginning
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

async function syncWithGoogleSheets() {
    showLoading();
    
    try {
        // Check if user is authenticated
        if (!isAuthenticated) {
            throw new Error('Chưa đăng nhập Google. Vui lòng đăng nhập trước.');
        }

        console.log('Syncing data with Google Sheets...');

        // Sync all data to Google Sheets
        await syncInventoryToGoogleSheets();
        await syncTasksToGoogleSheets();
        await syncTransfersToGoogleSheets();
        await syncLogsToGoogleSheets();
        
        showToast('success', 'Đồng bộ thành công!', 'Tất cả dữ liệu đã được đồng bộ với Google Sheets.');
        
    } catch (error) {
        console.error('Sync error:', error);
        showToast('error', 'Lỗi đồng bộ!', error.message);
        
        // If authentication error, offer to re-login
        if (error.message.includes('Not authenticated') || error.message.includes('expired')) {
            setTimeout(() => {
                if (confirm('Phiên đăng nhập đã hết hạn. Bạn có muốn đăng nhập lại không?')) {
                    startOAuthFlow();
                }
            }, 2000);
        }
    } finally {
        hideLoading();
    }
}

// Sync Inventory Data to Google Sheets
async function syncInventoryToGoogleSheets() {
    try {
        const sheetName = 'Vật Tư';
        const range = 'A1:J1000'; // Adjust range as needed
        
        // Prepare data
        const headers = ['ID', 'Mã VT', 'Tên Vật Tư', 'Kho', 'Danh Mục', 'Tình Trạng', 'Nguồn Gốc', 'Ngày Nhập', 'Sự Vụ ID', 'Mô Tả'];
        const values = [headers];
        
        inventoryData.forEach(item => {
            values.push([
                item.id.toString(),
                item.code,
                item.name,
                item.warehouse,
                item.category || '',
                item.condition,
                item.source || '',
                formatDateForSheets(item.dateAdded),
                item.taskId ? item.taskId.toString() : '',
                item.description || ''
            ]);
        });

        // Clear existing data and write new data
        await clearSheetData(sheetName, range);
        await writeSheetData(sheetName, range, values);
        
        console.log('Inventory data synced:', values.length - 1, 'items');
        addLog('inventory', 'Đồng bộ dữ liệu', `Đồng bộ ${inventoryData.length} vật tư lên Google Sheets`, 'System');
        
    } catch (error) {
        console.error('Error syncing inventory:', error);
        throw error;
    }
}

// Sync Tasks Data to Google Sheets
async function syncTasksToSheets() {
    try {
        const headers = ['ID', 'Tên Sự Vụ', 'Loại', 'Mô Tả', 'Địa Điểm', 'Ưu Tiên', 'Trạng Thái', 'Ngày Tạo', 'Hạn Hoàn Thành', 'Người Tạo', 'Vật Tư ID', 'Vật Tư Hoàn Thành', 'Ghi Chú'];
        const rows = [headers];
        
        tasksData.forEach(task => {
            rows.push([
                task.id.toString(),
                task.name,
                task.type,
                task.description,
                task.location || '',
                task.priority,
                task.status,
                formatDateForSheets(task.createdDate),
                task.deadline ? formatDateForSheets(task.deadline) : '',
                task.createdBy,
                task.assignedItems.join(','),
                task.completedItems.join(','),
                task.notes || ''
            ]);
        });

        console.log('Tasks data prepared for sync:', rows.length - 1, 'tasks');
        
        addLog('task', 'Đồng bộ dữ liệu', `Đồng bộ ${tasksData.length} sự vụ lên Google Sheets`, 'System');
        
    } catch (error) {
        console.error('Error syncing tasks:', error);
        throw error;
    }
}

// Sync Transfers Data to Google Sheets
async function syncTransfersToSheets() {
    try {
        const headers = ['ID', 'Loại', 'Sự Vụ ID', 'Từ Kho', 'Đến Kho', 'Vật Tư ID', 'Trạng Thái', 'Ngày Tạo', 'Ngày Xác Nhận', 'Ghi Chú', 'Người Tạo', 'Người Xác Nhận'];
        const rows = [headers];
        
        transfersData.forEach(transfer => {
            rows.push([
                transfer.id.toString(),
                transfer.type,
                transfer.taskId ? transfer.taskId.toString() : '',
                transfer.fromWarehouse,
                transfer.toWarehouse,
                transfer.items.join(','),
                transfer.status,
                formatDateTimeForSheets(transfer.createdDate),
                transfer.confirmedDate ? formatDateTimeForSheets(transfer.confirmedDate) : '',
                transfer.notes || '',
                transfer.createdBy || '',
                transfer.confirmedBy || ''
            ]);
        });

        console.log('Transfers data prepared for sync:', rows.length - 1, 'transfers');
        
        addLog('transfer', 'Đồng bộ dữ liệu', `Đồng bộ ${transfersData.length} chuyển kho lên Google Sheets`, 'System');
        
    } catch (error) {
        console.error('Error syncing transfers:', error);
        throw error;
    }
}

// Sync Logs Data to Google Sheets
async function syncLogsToSheets() {
    try {
        const headers = ['ID', 'Loại', 'Hành Động', 'Chi Tiết', 'Thời Gian', 'Người Thực Hiện'];
        const rows = [headers];
        
        logsData.forEach(log => {
            rows.push([
                log.id.toString(),
                log.type,
                log.action,
                log.details,
                formatDateTimeForSheets(log.timestamp),
                log.user
            ]);
        });

        console.log('Logs data prepared for sync:', rows.length - 1, 'logs');
        
        addLog('log', 'Đồng bộ dữ liệu', `Đồng bộ ${logsData.length} log lên Google Sheets`, 'System');
        
    } catch (error) {
        console.error('Error syncing logs:', error);
        throw error;
    }
}

// Helper function to format date for Google Sheets
function formatDateForSheets(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
}

// Helper function to format datetime for Google Sheets
function formatDateTimeForSheets(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('vi-VN');
}

// Export Functions for CSV
function prepareInventoryForExport() {
    const headers = ['ID', 'Mã VT', 'Tên Vật Tư', 'Kho', 'Danh Mục', 'Tình Trạng', 'Nguồn Gốc', 'Ngày Nhập', 'Sự Vụ ID', 'Mô Tả'];
    const rows = [headers];
    
    inventoryData.forEach(item => {
        rows.push([
            item.id.toString(),
            item.code,
            item.name,
            item.warehouse,
            item.category || '',
            item.condition,
            item.source || '',
            formatDateForSheets(item.dateAdded),
            item.taskId ? item.taskId.toString() : '',
            item.description || ''
        ]);
    });
    
    return rows;
}

function prepareTasksForExport() {
    const headers = ['ID', 'Tên Sự Vụ', 'Loại', 'Mô Tả', 'Địa Điểm', 'Ưu Tiên', 'Trạng Thái', 'Ngày Tạo', 'Hạn Hoàn Thành', 'Người Tạo', 'Vật Tư ID', 'Vật Tư Hoàn Thành', 'Ghi Chú'];
    const rows = [headers];
    
    tasksData.forEach(task => {
        rows.push([
            task.id.toString(),
            task.name,
            task.type,
            task.description,
            task.location || '',
            task.priority,
            task.status,
            formatDateForSheets(task.createdDate),
            task.deadline ? formatDateForSheets(task.deadline) : '',
            task.createdBy,
            task.assignedItems.join(','),
            task.completedItems.join(','),
            task.notes || ''
        ]);
    });
    
    return rows;
}

function prepareTransfersForExport() {
    const headers = ['ID', 'Loại', 'Sự Vụ ID', 'Từ Kho', 'Đến Kho', 'Vật Tư ID', 'Trạng Thái', 'Ngày Tạo', 'Ngày Xác Nhận', 'Ghi Chú', 'Người Tạo', 'Người Xác Nhận'];
    const rows = [headers];
    
    transfersData.forEach(transfer => {
        rows.push([
            transfer.id.toString(),
            transfer.type,
            transfer.taskId ? transfer.taskId.toString() : '',
            transfer.fromWarehouse,
            transfer.toWarehouse,
            transfer.items.join(','),
            transfer.status,
            formatDateTimeForSheets(transfer.createdDate),
            transfer.confirmedDate ? formatDateTimeForSheets(transfer.confirmedDate) : '',
            transfer.notes || '',
            transfer.createdBy || '',
            transfer.confirmedBy || ''
        ]);
    });
    
    return rows;
}

function prepareLogsForExport() {
    const headers = ['ID', 'Loại', 'Hành Động', 'Chi Tiết', 'Thời Gian', 'Người Thực Hiện'];
    const rows = [headers];
    
    logsData.forEach(log => {
        rows.push([
            log.id.toString(),
            log.type,
            log.action,
            log.details,
            formatDateTimeForSheets(log.timestamp),
            log.user
        ]);
    });
    
    return rows;
}

function exportToCSVFiles(exportData) {
    // Export Inventory
    const inventoryCSV = convertToCSV(exportData.inventory);
    downloadCSV(inventoryCSV, 'vat-tu.csv');
    
    // Export Tasks
    const tasksCSV = convertToCSV(exportData.tasks);
    downloadCSV(tasksCSV, 'su-vu.csv');
    
    // Export Transfers
    const transfersCSV = convertToCSV(exportData.transfers);
    downloadCSV(transfersCSV, 'chuyen-kho.csv');
    
    // Export Logs
    const logsCSV = convertToCSV(exportData.logs);
    downloadCSV(logsCSV, 'log.csv');
    
    // Show instructions
    showInstructionsModal();
}

function convertToCSV(data) {
    return data.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

function showInstructionsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Hướng dẫn import vào Google Sheets</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <p><strong>📁 Các file đã được tải về:</strong></p>
                <ul>
                    <li>📊 <code>vat-tu.csv</code> - Dữ liệu vật tư</li>
                    <li>📋 <code>su-vu.csv</code> - Dữ liệu sự vụ</li>
                    <li>🚚 <code>chuyen-kho.csv</code> - Dữ liệu chuyển kho</li>
                    <li>📝 <code>log.csv</code> - Dữ liệu log</li>
                </ul>
                
                <p><strong>🔧 Cách import vào Google Sheets:</strong></p>
                <ol>
                    <li>Mở Google Sheets của bạn: <a href="https://docs.google.com/spreadsheets/d/1HLCUeCphiODncUk4yA7yDMaOeeLbug2a19Sf_HVTPqk/edit" target="_blank">Link Google Sheets</a></li>
                    <li>Chọn tab "Vật Tư" (Sheet1)</li>
                    <li>File → Import → Upload → Chọn file <code>vat-tu.csv</code></li>
                    <li>Chọn "Replace data at selected cell" → Import data</li>
                    <li>Lặp lại với các file khác cho các sheet tương ứng</li>
                </ol>
                
                <p><strong>⚠️ Lưu ý:</strong></p>
                <ul>
                    <li>File CSV đã có header row, không cần thêm</li>
                    <li>Import sẽ thay thế toàn bộ dữ liệu cũ</li>
                    <li>Nên backup dữ liệu cũ trước khi import</li>
                </ul>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Đã hiểu</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Google Sheets API Helper Functions
async function clearSheetData(sheetName, range) {
    const url = `${SHEETS_API.baseUrl}/${SHEETS_API.spreadsheetId}/values/${sheetName}!${range}:clear`;
    
    const response = await makeAuthenticatedRequest(url, {
        method: 'POST'
    });
    
    if (!response.ok) {
        throw new Error(`Failed to clear sheet data: ${response.statusText}`);
    }
    
    return await response.json();
}

async function writeSheetData(sheetName, range, values) {
    const url = `${SHEETS_API.baseUrl}/${SHEETS_API.spreadsheetId}/values/${sheetName}!${range}?valueInputOption=RAW`;
    
    const response = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
            values: values
        })
    });
    
    if (!response.ok) {
        throw new Error(`Failed to write sheet data: ${response.statusText}`);
    }
    
    return await response.json();
}

async function readSheetData(sheetName, range) {
    const url = `${SHEETS_API.baseUrl}/${SHEETS_API.spreadsheetId}/values/${sheetName}!${range}`;
    
    const response = await makeAuthenticatedRequest(url);
    
    if (!response.ok) {
        throw new Error(`Failed to read sheet data: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.values || [];
}

// Sync Tasks Data to Google Sheets
async function syncTasksToGoogleSheets() {
    try {
        const sheetName = 'Sự Vụ';
        const range = 'A1:M1000';
        
        const headers = ['ID', 'Tên Sự Vụ', 'Loại', 'Mô Tả', 'Địa Điểm', 'Ưu Tiên', 'Trạng Thái', 'Ngày Tạo', 'Hạn Hoàn Thành', 'Người Tạo', 'Vật Tư ID', 'Vật Tư Hoàn Thành', 'Ghi Chú'];
        const values = [headers];
        
        tasksData.forEach(task => {
            values.push([
                task.id.toString(),
                task.name,
                task.type,
                task.description,
                task.location || '',
                task.priority,
                task.status,
                formatDateForSheets(task.createdDate),
                task.deadline ? formatDateForSheets(task.deadline) : '',
                task.createdBy,
                task.assignedItems.join(','),
                task.completedItems.join(','),
                task.notes || ''
            ]);
        });

        await clearSheetData(sheetName, range);
        await writeSheetData(sheetName, range, values);
        
        console.log('Tasks data synced:', values.length - 1, 'tasks');
        addLog('task', 'Đồng bộ dữ liệu', `Đồng bộ ${tasksData.length} sự vụ lên Google Sheets`, 'System');
        
    } catch (error) {
        console.error('Error syncing tasks:', error);
        throw error;
    }
}

// Sync Transfers Data to Google Sheets
async function syncTransfersToGoogleSheets() {
    try {
        const sheetName = 'Chuyển Kho';
        const range = 'A1:L1000';
        
        const headers = ['ID', 'Loại', 'Sự Vụ ID', 'Từ Kho', 'Đến Kho', 'Vật Tư ID', 'Trạng Thái', 'Ngày Tạo', 'Ngày Xác Nhận', 'Ghi Chú', 'Người Tạo', 'Người Xác Nhận'];
        const values = [headers];
        
        transfersData.forEach(transfer => {
            values.push([
                transfer.id.toString(),
                transfer.type,
                transfer.taskId ? transfer.taskId.toString() : '',
                transfer.fromWarehouse,
                transfer.toWarehouse,
                transfer.items.join(','),
                transfer.status,
                formatDateTimeForSheets(transfer.createdDate),
                transfer.confirmedDate ? formatDateTimeForSheets(transfer.confirmedDate) : '',
                transfer.notes || '',
                transfer.createdBy || '',
                transfer.confirmedBy || ''
            ]);
        });

        await clearSheetData(sheetName, range);
        await writeSheetData(sheetName, range, values);
        
        console.log('Transfers data synced:', values.length - 1, 'transfers');
        addLog('transfer', 'Đồng bộ dữ liệu', `Đồng bộ ${transfersData.length} chuyển kho lên Google Sheets`, 'System');
        
    } catch (error) {
        console.error('Error syncing transfers:', error);
        throw error;
    }
}

// Sync Logs Data to Google Sheets
async function syncLogsToGoogleSheets() {
    try {
        const sheetName = 'Log';
        const range = 'A1:F1000';
        
        const headers = ['ID', 'Loại', 'Hành Động', 'Chi Tiết', 'Thời Gian', 'Người Thực Hiện'];
        const values = [headers];
        
        logsData.forEach(log => {
            values.push([
                log.id.toString(),
                log.type,
                log.action,
                log.details,
                formatDateTimeForSheets(log.timestamp),
                log.user
            ]);
        });

        await clearSheetData(sheetName, range);
        await writeSheetData(sheetName, range, values);
        
        console.log('Logs data synced:', values.length - 1, 'logs');
        addLog('log', 'Đồng bộ dữ liệu', `Đồng bộ ${logsData.length} log lên Google Sheets`, 'System');
        
    } catch (error) {
        console.error('Error syncing logs:', error);
        throw error;
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