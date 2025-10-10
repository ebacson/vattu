// Global Variables
let inventoryData = [];
let tasksData = [];
let transfersData = [];
let logsData = [];
let deliveryRequestsData = []; // NEW: Delivery requests waiting for confirmation
let currentWarehouse = 'net';
let currentEditingItem = null;
let currentEditingTask = null;
let charts = {};
let currentUser = null;
let userWarehouse = 'net'; // User's assigned warehouse
let isUserAdmin = false; // User's admin status
let listenersSetup = false; // Flag to prevent duplicate event listeners

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
        renderPendingRequestsList();
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
        console.log('✅ Admin can manage all warehouses');
        return true;
    }
    // Regular users can only manage their assigned warehouse
    const canManage = userWarehouse === warehouse;
    console.log(`🔐 Can manage ${warehouse}:`, canManage, '(User warehouse:', userWarehouse + ')');
    return canManage;
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
    console.log('🔐 Updating UI for permissions:', { userWarehouse, isUserAdmin, currentWarehouse });
    
    // Update warehouse display (no selector anymore, just display)
    const userWarehouseDisplay = document.getElementById('userWarehouseDisplay');
    console.log('🔍 userWarehouseDisplay element:', userWarehouseDisplay);
    console.log('🔍 userWarehouse value:', userWarehouse);
    
    if (userWarehouseDisplay) {
        const warehouseName = userWarehouse === 'net' ? 'Kho Net' : 'Kho Hạ Tầng';
        userWarehouseDisplay.textContent = warehouseName;
        userWarehouseDisplay.style.display = 'inline-block';
        console.log('✅ Warehouse display updated:', warehouseName);
    } else {
        console.error('❌ userWarehouseDisplay element not found!');
    }
    
    // Update add item button visibility
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        if (canCreateItem(currentWarehouse)) {
            addItemBtn.style.display = 'inline-block';
            addItemBtn.disabled = false;
        } else {
            addItemBtn.style.display = 'inline-block';
            addItemBtn.disabled = false;
        }
    }
    
    // Update create task button visibility
    const createTaskBtn = document.getElementById('createTaskBtn');
    if (createTaskBtn) {
        if (canCreateTask()) {
            createTaskBtn.style.display = 'inline-block';
            createTaskBtn.disabled = false;
        } else {
            createTaskBtn.style.display = 'inline-block';
            createTaskBtn.disabled = false;
        }
    }
    
    // Update inventory table
    renderInventoryTable();
    
    // Update tasks and pending requests
    renderTasksList();
    renderPendingRequestsList();
}

// Initialize Application
function initializeApp() {
    console.log('Initializing 2-Warehouse Inventory Management System with Firebase...');
    
    // Initialize form validation
    if (typeof window.initializeFormValidation === 'function') {
        window.initializeFormValidation();
    }
    
    showToast('success', 'Online', 'Hệ thống đã kết nối thành công.');
}

// Setup Event Listeners
function setupEventListeners() {
    // Prevent duplicate event listeners
    if (listenersSetup) {
        console.log('⚠️ Event listeners already setup, skipping...');
        return;
    }
    
    console.log('🎯 Setting up event listeners...');
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // Warehouse display (no longer a selector, just display user's warehouse)
    // Event listener removed as users cannot change their assigned warehouse

    // Search and filters
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('warehouseFilter').addEventListener('change', handleFilter);
    document.getElementById('statusFilter').addEventListener('change', handleFilter);
    document.getElementById('taskStatusFilter').addEventListener('change', handleTaskFilter);
    document.getElementById('pendingRequestTypeFilter').addEventListener('change', renderPendingRequestsList);
    document.getElementById('pendingRequestStatusFilter').addEventListener('change', renderPendingRequestsList);

    // Sync button - now triggers Firebase sync
    document.getElementById('syncBtn').addEventListener('click', syncWithFirebase);

    // Form submissions
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('itemForm').addEventListener('submit', handleItemSubmit);
    document.getElementById('transferForm').addEventListener('submit', handleTransferSubmit);
    document.getElementById('deliverItemForm').addEventListener('submit', handleDeliverItemSubmit);
    
    // Transfer item search
    const transferItemSearch = document.getElementById('transferItemSearch');
    if (transferItemSearch) {
        transferItemSearch.addEventListener('input', function() {
            renderAvailableItems(this.value);
        });
    }
    
    // Report period selector
    const reportPeriodSelect = document.getElementById('reportPeriodSelect');
    if (reportPeriodSelect) {
        reportPeriodSelect.addEventListener('change', function() {
            const startDate = document.getElementById('reportStartDate');
            const endDate = document.getElementById('reportEndDate');
            if (this.value === 'custom') {
                startDate.style.display = 'inline-block';
                endDate.style.display = 'inline-block';
            } else {
                startDate.style.display = 'none';
                endDate.style.display = 'none';
            }
        });
    }

    // Modal close on outside click
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    // Mark listeners as setup
    listenersSetup = true;
    console.log('✅ Event listeners setup complete');
}

// Warehouse Management
// Warehouse selector removed - users now have fixed assigned warehouse
// This function is no longer needed

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
            showToast('warning', 'Offline', 'Chưa kết nối được, sử dụng dữ liệu mẫu.');
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
    
    // Update statistics charts
    if (typeof updateCharts === 'function') {
        updateCharts();
    }
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
                <p><i class="fas fa-tag"></i> ${getTaskTypeText(task.type)}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${task.location}</p>
                <p><i class="fas fa-user"></i> ${task.createdBy || 'Không rõ'}${task.createdByWarehouse ? ` (${task.createdByWarehouse})` : ''}</p>
                <p><i class="fas fa-calendar"></i> ${formatDate(task.createdDate)}</p>
                <p><i class="fas fa-boxes"></i> ${task.assignedItems ? task.assignedItems.length : 0} vật tư</p>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm btn-primary" onclick="viewTask(${task.id})">Xem</button>
                <button class="btn btn-sm btn-success" onclick="closeTask(${task.id})">Đóng sự vụ</button>
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

    console.log('📦 renderInventoryTable called');
    console.log('📊 Total inventory items:', inventoryData.length);
    console.log('🏢 Items by warehouse:', {
        net: inventoryData.filter(i => i.warehouse === 'net').length,
        infrastructure: inventoryData.filter(i => i.warehouse === 'infrastructure').length
    });
    console.log('🔧 Items by condition:', {
        available: inventoryData.filter(i => i.condition === 'available').length,
        'in-use': inventoryData.filter(i => i.condition === 'in-use').length
    });
    console.log('🔍 Infrastructure + available:', inventoryData.filter(i => i.warehouse === 'infrastructure' && i.condition === 'available').length);

    let filteredData = inventoryData.filter(item => {
        const matchesWarehouse = warehouseFilter === 'all' || item.warehouse === warehouseFilter;
        const matchesStatus = statusFilter === 'all' || item.condition === statusFilter;
        const matchesSearch = !searchTerm || 
            item.serial.toLowerCase().includes(searchTerm) ||
            item.name.toLowerCase().includes(searchTerm) ||
            (item.category && item.category.toLowerCase().includes(searchTerm));
        
        // Permission check with special case for pending requests
        // Infrastructure user can see Net items if there's a pending delivery request
        const pendingDeliveryRequest = deliveryRequestsData.find(r => r.itemId === item.id && r.status === 'pending');
        const canViewPendingDelivery = userWarehouse === 'infrastructure' && pendingDeliveryRequest;
        
        // Net user can see Infrastructure items if there's a pending return request  
        const pendingReturnRequest = returnRequestsData.find(r => r.itemId === item.id && r.status === 'pending');
        const canViewPendingReturn = userWarehouse === 'net' && pendingReturnRequest;
        
        const canView = canViewWarehouse(item.warehouse) || canViewPendingDelivery || canViewPendingReturn;

        return matchesWarehouse && matchesStatus && matchesSearch && canView;
    });

    console.log('🔍 Pending delivery requests:', deliveryRequestsData.filter(r => r.status === 'pending').length);
    console.log('🔍 Pending return requests:', returnRequestsData.filter(r => r.status === 'pending').length);

    console.log('✅ Filtered items:', filteredData.length);

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">Không có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = filteredData.map(item => {
        const task = tasksData.find(t => t.id === item.taskId);
        
        // Check for pending requests
        const pendingDelivery = deliveryRequestsData.find(r => r.itemId === item.id && r.status === 'pending');
        const pendingReturn = returnRequestsData.find(r => r.itemId === item.id && r.status === 'pending');
        const hasPendingRequest = pendingDelivery || pendingReturn;
        
        return `
            <tr style="${hasPendingRequest ? 'background: #fff9e6;' : ''}">
                <td>
                    <strong>${item.serial}</strong>
                    ${hasPendingRequest ? '<br><small style="color: #f39c12;"><i class="fas fa-clock"></i> Chờ xác nhận</small>' : ''}
                </td>
                <td>${item.name}</td>
                <td><span class="warehouse-badge ${item.warehouse}">${getWarehouseName(item.warehouse)}</span></td>
                <td>
                    <span class="status-badge ${item.condition}">${getConditionText(item.condition)}</span>
                    ${pendingDelivery ? '<br><small style="color: #3498db;"><i class="fas fa-arrow-right"></i> → Hạ Tầng</small>' : ''}
                    ${pendingReturn ? '<br><small style="color: #27ae60;"><i class="fas fa-arrow-left"></i> → Net</small>' : ''}
                </td>
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
                        
                        ${item.warehouse === 'infrastructure' && userWarehouse === 'infrastructure' ? `
                            <button class="btn btn-sm btn-success" onclick="returnItemToNet(${item.id})" title="Chuyển trả về Net (bất kỳ tình trạng)">
                                <i class="fas fa-undo"></i> Trả
                            </button>
                        ` : ''}
                        
                        ${item.warehouse === 'net' && item.condition === 'available' && userWarehouse === 'net' ? `
                            <button class="btn btn-sm btn-success" onclick="deliverItemToTask(${item.id})" title="Giao cho sự vụ">
                                <i class="fas fa-shipping-fast"></i> Giao
                            </button>
                        ` : ''}
                        
                        ${(() => {
                            // Check if there's a pending delivery request (Net → Infrastructure)
                            const pendingDeliveryRequest = deliveryRequestsData.find(r => r.itemId === item.id && r.status === 'pending');
                            if (pendingDeliveryRequest && userWarehouse === 'infrastructure') {
                                return `
                                    <button class="btn btn-sm btn-warning" onclick="confirmDeliveryRequest(${pendingDeliveryRequest.id})" title="Xác nhận nhận vật tư">
                                        <i class="fas fa-check-circle"></i> Xác nhận nhận
                                    </button>
                                `;
                            }
                            
                            // Check if there's a pending return request (Infrastructure → Net)
                            const pendingReturnRequest = returnRequestsData.find(r => r.itemId === item.id && r.status === 'pending');
                            if (pendingReturnRequest && userWarehouse === 'net') {
                                return `
                                    <button class="btn btn-sm btn-warning" onclick="confirmReturnRequest(${pendingReturnRequest.id})" title="Xác nhận nhận trả">
                                        <i class="fas fa-check-circle"></i> Xác nhận trả
                                    </button>
                                `;
                            }
                            
                            return '';
                        })()}
                        
                        <button class="btn btn-sm btn-info" onclick="viewItemHistory(${item.id})" title="Lịch sử">
                            <i class="fas fa-history"></i>
                        </button>
                        ${canEditItem(item) ? `
                            <button class="btn btn-sm btn-warning" onclick="updateItemCondition(${item.id})" title="Cập nhật tình trạng">
                                <i class="fas fa-tools"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})" title="Xóa">
                                <i class="fas fa-trash"></i>
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

    console.log('🔍 renderTasksList called');
    console.log('📊 Total tasks:', tasksData.length);
    console.log('🔧 Status filter:', statusFilter);

    let filteredTasks = tasksData.filter(task => {
        let matchesStatus = true;
        
        if (statusFilter === 'active') {
            // Active = not completed (pending, in-progress, waiting-confirmation)
            matchesStatus = task.status !== 'completed' && task.status !== 'cancelled';
        } else if (statusFilter === 'completed') {
            // Completed
            matchesStatus = task.status === 'completed';
        }
        // 'all' shows everything
        
        const matchesDate = !dateFilter || formatDate(task.createdDate) === dateFilter;
        return matchesStatus && matchesDate;
    });

    console.log('✅ Filtered tasks:', filteredTasks.length);

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
                <p><i class="fas fa-user"></i> Người tạo: ${task.createdBy || 'Không rõ'}${task.createdByWarehouse ? ` (${task.createdByWarehouse})` : ''}</p>
                <p><i class="fas fa-calendar"></i> Tạo: ${formatDate(task.createdDate)}</p>
                <p><i class="fas fa-boxes"></i> ${task.assignedItems ? task.assignedItems.length : 0} vật tư</p>
                ${task.status === 'completed' && task.completedDate ? `
                    <p><i class="fas fa-check-circle"></i> Hoàn thành: ${formatDate(task.completedDate)} bởi ${task.completedBy || 'Không rõ'}</p>
                ` : ''}
            </div>
            <div class="task-description">
                <p>${task.description}</p>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm btn-primary" onclick="viewTask(${task.id})">Xem chi tiết</button>
                ${task.status !== 'completed' ? `
                    <button class="btn btn-sm btn-success" onclick="requestItems(${task.id})">Yêu cầu vật tư</button>
                    <button class="btn btn-sm btn-danger" onclick="closeTask(${task.id})">Đóng sự vụ</button>
                ` : ''}
                <button class="btn btn-sm btn-info" onclick="viewTaskLogs(${task.id})">Lịch sử</button>
            </div>
        </div>
    `).join('');
}

// Transfers Management
function renderPendingRequestsList() {
    const requestsList = document.getElementById('pendingRequestsList');
    if (!requestsList) return;
    
    const typeFilter = document.getElementById('pendingRequestTypeFilter').value;
    const statusFilter = document.getElementById('pendingRequestStatusFilter').value;
    
    console.log('🔍 renderPendingRequestsList called');
    console.log('📊 Delivery requests:', deliveryRequestsData.length);
    console.log('📊 Return requests:', returnRequestsData.length);
    
    // Combine both types of requests
    let allRequests = [];
    
    // Add delivery requests
    if (typeFilter === 'all' || typeFilter === 'delivery') {
        deliveryRequestsData.forEach(req => {
            if (statusFilter === 'all' || req.status === statusFilter) {
                allRequests.push({
                    ...req,
                    type: 'delivery',
                    direction: 'Net → Hạ Tầng',
                    icon: 'fa-shipping-fast',
                    color: '#3498db'
                });
            }
        });
    }
    
    // Add return requests
    if (typeFilter === 'all' || typeFilter === 'return') {
        returnRequestsData.forEach(req => {
            if (statusFilter === 'all' || req.status === statusFilter) {
                allRequests.push({
                    ...req,
                    type: 'return',
                    direction: 'Hạ Tầng → Net',
                    icon: 'fa-undo',
                    color: '#e67e22'
                });
            }
        });
    }
    
    // Sort by date (newest first)
    allRequests.sort((a, b) => b.requestedDate - a.requestedDate);
    
    console.log('✅ Filtered requests:', allRequests.length);
    
    if (allRequests.length === 0) {
        requestsList.innerHTML = '<p class="no-data">Chưa có yêu cầu nào</p>';
        return;
    }
    
    requestsList.innerHTML = allRequests.map(request => {
        const task = tasksData.find(t => t.id === request.taskId);
        const item = inventoryData.find(i => i.id === request.itemId);
        const isPending = request.status === 'pending';
        const canConfirm = (request.type === 'delivery' && userWarehouse === 'infrastructure') ||
                          (request.type === 'return' && userWarehouse === 'net');
        
        return `
            <div class="transfer-card" style="border-left: 4px solid ${request.color};">
                <div class="transfer-header">
                    <h3>
                        <i class="fas ${request.icon}"></i> 
                        ${request.type === 'delivery' ? 'Giao Nhận' : 'Chuyển Trả'}
                    </h3>
                    <span class="status-badge ${isPending ? 'pending' : 'completed'}">
                        ${isPending ? 'Chờ xác nhận' : 'Đã xác nhận'}
                    </span>
                </div>
                <div class="transfer-info">
                    <p><i class="fas fa-arrow-right"></i> <strong>${request.direction}</strong></p>
                    <p><i class="fas fa-box"></i> Vật tư: <strong>${request.itemSerial} - ${request.itemName}</strong></p>
                    ${request.itemCondition ? `<p><i class="fas fa-info-circle"></i> Tình trạng: <span class="status-badge ${request.itemCondition}">${getConditionText(request.itemCondition)}</span></p>` : ''}
                    <p><i class="fas fa-tasks"></i> Sự vụ: ${request.taskName || task?.name || 'Không có'}</p>
                    <p><i class="fas fa-user"></i> Yêu cầu bởi: ${request.requestedBy}</p>
                    <p><i class="fas fa-calendar"></i> Ngày yêu cầu: ${formatDateTime(request.requestedDate)}</p>
                    ${!isPending ? `
                        <p><i class="fas fa-check-circle"></i> Xác nhận bởi: ${request.confirmedBy}</p>
                        <p><i class="fas fa-calendar-check"></i> Ngày xác nhận: ${formatDateTime(request.confirmedDate)}</p>
                    ` : ''}
                </div>
                ${request.notes ? `
                    <div class="transfer-notes">
                        <p><i class="fas fa-sticky-note"></i> ${request.notes}</p>
                    </div>
                ` : ''}
                <div class="transfer-actions">
                    ${isPending && canConfirm ? `
                        <button class="btn btn-sm btn-success" onclick="${request.type === 'delivery' ? 'confirmDeliveryRequest' : 'confirmReturnRequest'}(${request.id})">
                            <i class="fas fa-check"></i> Xác nhận
                        </button>
                    ` : ''}
                    ${item ? `
                        <button class="btn btn-sm btn-info" onclick="viewItemHistory(${item.id})">
                            <i class="fas fa-box"></i> Xem vật tư
                        </button>
                    ` : ''}
                    ${task ? `
                        <button class="btn btn-sm btn-primary" onclick="viewTask(${task.id})">
                            <i class="fas fa-tasks"></i> Xem sự vụ
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Reports Management
function generateReport() {
    const reportType = document.getElementById('reportTypeSelect').value;
    const period = document.getElementById('reportPeriodSelect').value;
    const reportContent = document.getElementById('reportContent');
    
    console.log('📊 Generating report:', reportType, 'Period:', period);
    
    // Get date range
    const dateRange = getDateRange(period);
    
    switch(reportType) {
        case 'inventory-list':
            renderInventoryListReport(dateRange, reportContent);
            break;
        case 'tasks':
            renderTasksReport(dateRange, reportContent);
            break;
        case 'inventory-changes':
            renderInventoryChangesReport(dateRange, reportContent);
            break;
        case 'activity-logs':
            renderActivityLogsReport(dateRange, reportContent);
            break;
        default:
            reportContent.innerHTML = '<p class="no-data">Chọn loại báo cáo</p>';
    }
}

function getDateRange(period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(period) {
        case 'today':
            return { start: today, end: new Date(today.getTime() + 86400000) };
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return { start: weekStart, end: now };
        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: monthStart, end: now };
        case 'custom':
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            return { 
                start: startDate ? new Date(startDate) : new Date(0), 
                end: endDate ? new Date(endDate) : now 
            };
        case 'all':
        default:
            return { start: new Date(0), end: now };
    }
}

function renderInventoryListReport(dateRange, container) {
    // Get all items added in the date range
    const filteredItems = inventoryData.filter(item => 
        item.dateAdded >= dateRange.start && item.dateAdded <= dateRange.end
    );
    
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">
                <i class="fas fa-boxes"></i> Báo Cáo Danh Sách Vật Tư
            </h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #3498db; font-weight: bold;">${filteredItems.length}</div>
                    <div style="color: #7f8c8d;">Tổng vật tư</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #2ecc71; font-weight: bold;">${filteredItems.filter(i => i.warehouse === 'net').length}</div>
                    <div style="color: #7f8c8d;">Kho Net</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #9b59b6; font-weight: bold;">${filteredItems.filter(i => i.warehouse === 'infrastructure').length}</div>
                    <div style="color: #7f8c8d;">Kho Hạ Tầng</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #e74c3c; font-weight: bold;">${filteredItems.filter(i => i.condition === 'damaged').length}</div>
                    <div style="color: #7f8c8d;">Hỏng</div>
                </div>
            </div>
        </div>
        
        <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #34495e; color: white;">
                        <th style="padding: 12px; text-align: left;">STT</th>
                        <th style="padding: 12px; text-align: left;">Serial</th>
                        <th style="padding: 12px; text-align: left;">Tên Vật Tư</th>
                        <th style="padding: 12px; text-align: left;">Kho</th>
                        <th style="padding: 12px; text-align: left;">Tình Trạng</th>
                        <th style="padding: 12px; text-align: left;">Sự Vụ</th>
                        <th style="padding: 12px; text-align: left;">Ngày Nhập</th>
                        <th style="padding: 12px; text-align: left;">Ngày Trả</th>
                        <th style="padding: 12px; text-align: left;">Người Trả</th>
                        <th style="padding: 12px; text-align: left;">Ngày Nhận Trả</th>
                        <th style="padding: 12px; text-align: left;">Người Nhận Trả</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (filteredItems.length === 0) {
        html += '<tr><td colspan="11" style="padding: 20px; text-align: center; color: #95a5a6;">Không có vật tư trong khoảng thời gian này</td></tr>';
    } else {
        filteredItems.forEach((item, index) => {
            const task = item.taskId ? tasksData.find(t => t.id === item.taskId) : null;
            
            // Find return request for this item
            const returnReq = returnRequestsData.find(r => r.itemId === item.id && r.status === 'confirmed');
            
            html += `
                <tr style="border-bottom: 1px solid #ecf0f1; ${item.condition === 'damaged' ? 'background: #ffebee;' : ''}">
                    <td style="padding: 12px;">${index + 1}</td>
                    <td style="padding: 12px;"><strong>${item.serial}</strong></td>
                    <td style="padding: 12px;">${item.name}</td>
                    <td style="padding: 12px;"><span class="warehouse-badge ${item.warehouse}">${getWarehouseName(item.warehouse)}</span></td>
                    <td style="padding: 12px;"><span class="status-badge ${item.condition}">${getConditionText(item.condition)}</span></td>
                    <td style="padding: 12px;">${task ? task.name : '-'}</td>
                    <td style="padding: 12px;">${formatDate(item.dateAdded)}</td>
                    <td style="padding: 12px;">${returnReq ? formatDateTime(returnReq.requestedDate) : '-'}</td>
                    <td style="padding: 12px;">${returnReq ? returnReq.requestedBy : '-'}</td>
                    <td style="padding: 12px;">${returnReq ? formatDateTime(returnReq.confirmedDate) : '-'}</td>
                    <td style="padding: 12px;">${returnReq ? returnReq.confirmedBy : '-'}</td>
                </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderTasksReport(dateRange, container) {
    const filteredTasks = tasksData.filter(task => 
        task.createdDate >= dateRange.start && task.createdDate <= dateRange.end
    );
    
    const completedTasks = filteredTasks.filter(t => t.status === 'completed');
    const activeTasks = filteredTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    
    // Calculate total items
    let totalItemsDelivered = 0;
    let totalItemsReturned = 0;
    
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">
                <i class="fas fa-tasks"></i> Báo Cáo Sự Vụ & Vật Tư
            </h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #3498db; font-weight: bold;">${filteredTasks.length}</div>
                    <div style="color: #7f8c8d;">Tổng sự vụ</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #f39c12; font-weight: bold;">${activeTasks.length}</div>
                    <div style="color: #7f8c8d;">Đang hoạt động</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #27ae60; font-weight: bold;">${completedTasks.length}</div>
                    <div style="color: #7f8c8d;">Đã hoàn thành</div>
                </div>
            </div>
        </div>
    `;
    
    if (filteredTasks.length === 0) {
        html += '<p class="no-data">Không có sự vụ trong khoảng thời gian này</p>';
    } else {
        // Render each task with its items
        filteredTasks.forEach(task => {
            const assignedItems = inventoryData.filter(item => 
                task.assignedItems && task.assignedItems.includes(item.id)
            );
            
            const taskDeliveries = deliveryRequestsData.filter(r => r.taskId === task.id);
            const taskReturns = returnRequestsData.filter(r => r.taskId === task.id);
            
            totalItemsDelivered += taskDeliveries.filter(d => d.status === 'confirmed').length;
            totalItemsReturned += taskReturns.filter(r => r.status === 'confirmed').length;
            
            html += `
                <div style="background: white; border: 1px solid #e1e8ed; border-radius: 8px; margin-bottom: 20px; overflow: hidden;">
                    <!-- Task Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; color: white;">
                        <h3 style="margin: 0; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="fas fa-tasks"></i> ${task.name}</span>
                            <span class="status-badge ${task.status}" style="background: rgba(255,255,255,0.3);">${getTaskStatusText(task.status)}</span>
                        </h3>
                        <div style="margin-top: 10px; font-size: 0.9rem; opacity: 0.95;">
                            <span><i class="fas fa-tag"></i> ${getTaskTypeText(task.type)}</span> • 
                            <span><i class="fas fa-map-marker-alt"></i> ${task.location}</span> • 
                            <span><i class="fas fa-user"></i> ${task.createdBy}</span> • 
                            <span><i class="fas fa-calendar"></i> ${formatDate(task.createdDate)}</span>
                        </div>
                    </div>
                    
                    <!-- Items Currently Assigned -->
                    <div style="padding: 15px; border-bottom: 1px solid #e1e8ed;">
                        <h4 style="margin-top: 0; color: #2c3e50;">
                            <i class="fas fa-boxes"></i> Vật Tư Hiện Tại (${assignedItems.length})
                        </h4>
                        ${assignedItems.length === 0 ? `
                            <p style="color: #95a5a6; font-style: italic;">Chưa có vật tư</p>
                        ` : `
                            <table style="width: 100%; font-size: 0.9rem;">
                                <thead>
                                    <tr style="background: #f8f9fa;">
                                        <th style="padding: 8px; text-align: left;">Serial</th>
                                        <th style="padding: 8px; text-align: left;">Tên</th>
                                        <th style="padding: 8px; text-align: left;">Tình Trạng</th>
                                        <th style="padding: 8px; text-align: left;">Kho</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${assignedItems.map(item => `
                                        <tr style="border-bottom: 1px solid #f0f0f0;">
                                            <td style="padding: 8px;"><strong>${item.serial}</strong></td>
                                            <td style="padding: 8px;">${item.name}</td>
                                            <td style="padding: 8px;"><span class="status-badge ${item.condition}">${getConditionText(item.condition)}</span></td>
                                            <td style="padding: 8px;">${getWarehouseName(item.warehouse)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `}
                    </div>
                    
                    <!-- Delivery Timeline -->
                    ${taskDeliveries.length > 0 ? `
                        <div style="padding: 15px; background: #e8f8f5; border-bottom: 1px solid #e1e8ed;">
                            <h4 style="margin-top: 0; color: #27ae60;">
                                <i class="fas fa-shipping-fast"></i> Vật Tư Đã Giao (${taskDeliveries.filter(d => d.status === 'confirmed').length})
                            </h4>
                            ${taskDeliveries.filter(d => d.status === 'confirmed').map(delivery => `
                                <div style="padding: 10px; background: white; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid #27ae60;">
                                    <strong>${delivery.itemSerial} - ${delivery.itemName}</strong>
                                    <div style="color: #7f8c8d; font-size: 0.85rem; margin-top: 3px;">
                                        📤 Giao: ${formatDateTime(delivery.requestedDate)} (${delivery.requestedBy})
                                        <br>
                                        ✅ Nhận: ${formatDateTime(delivery.confirmedDate)} (${delivery.confirmedBy})
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Return Timeline -->
                    ${taskReturns.length > 0 ? `
                        <div style="padding: 15px; background: #fef5e7;">
                            <h4 style="margin-top: 0; color: #e67e22;">
                                <i class="fas fa-undo"></i> Vật Tư Đã Trả (${taskReturns.filter(r => r.status === 'confirmed').length})
                            </h4>
                            ${taskReturns.filter(r => r.status === 'confirmed').map(returnReq => `
                                <div style="padding: 10px; background: white; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid #e67e22;">
                                    <strong>${returnReq.itemSerial} - ${returnReq.itemName}</strong>
                                    <span class="status-badge ${returnReq.itemCondition}" style="margin-left: 8px; font-size: 0.8rem;">${getConditionText(returnReq.itemCondition)}</span>
                                    <div style="color: #7f8c8d; font-size: 0.85rem; margin-top: 3px;">
                                        📥 Trả: ${formatDateTime(returnReq.requestedDate)} (${returnReq.requestedBy})
                                        <br>
                                        ✅ Nhận: ${formatDateTime(returnReq.confirmedDate)} (${returnReq.confirmedBy})
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        // Add summary at end
        html += `
            <div style="background: #34495e; color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h4 style="margin-top: 0;">
                    <i class="fas fa-chart-bar"></i> Tổng Kết
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div>
                        <strong>Sự Vụ:</strong>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            <li>Tổng: ${filteredTasks.length}</li>
                            <li>Hoạt động: ${activeTasks.length}</li>
                            <li>Hoàn thành: ${completedTasks.length}</li>
                        </ul>
                    </div>
                    <div>
                        <strong>Vật Tư:</strong>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            <li>Đã giao: ${totalItemsDelivered}</li>
                            <li>Đã trả: ${totalItemsReturned}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function renderInventoryChangesReport(dateRange, container) {
    // Get all logs related to inventory changes
    const inventoryLogs = logsData.filter(log => 
        (log.type === 'inventory' || log.type === 'delivery' || log.type === 'return' || 
         log.type === 'delivery-request' || log.type === 'delivery-confirmed' || 
         log.type === 'return-request' || log.type === 'return-confirmed') &&
        log.timestamp >= dateRange.start && log.timestamp <= dateRange.end
    ).sort((a, b) => b.timestamp - a.timestamp);
    
    // Group by date
    const byDate = {};
    inventoryLogs.forEach(log => {
        const dateKey = formatDate(log.timestamp);
        if (!byDate[dateKey]) {
            byDate[dateKey] = [];
        }
        byDate[dateKey].push(log);
    });
    
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">
                <i class="fas fa-exchange-alt"></i> Báo Cáo Biến Động Vật Tư
            </h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #3498db; font-weight: bold;">${inventoryLogs.length}</div>
                    <div style="color: #7f8c8d;">Tổng biến động</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #2ecc71; font-weight: bold;">${inventoryLogs.filter(l => l.type.includes('delivery')).length}</div>
                    <div style="color: #7f8c8d;">Giao nhận</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #e67e22; font-weight: bold;">${inventoryLogs.filter(l => l.type.includes('return')).length}</div>
                    <div style="color: #7f8c8d;">Chuyển trả</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; color: #9b59b6; font-weight: bold;">${inventoryLogs.filter(l => l.type === 'inventory').length}</div>
                    <div style="color: #7f8c8d;">Thêm/Sửa/Xóa</div>
                </div>
            </div>
        </div>
    `;
    
    if (Object.keys(byDate).length === 0) {
        html += '<p class="no-data">Không có biến động trong khoảng thời gian này</p>';
    } else {
        Object.keys(byDate).sort().reverse().forEach(date => {
            const logs = byDate[date];
            html += `
                <div style="margin-bottom: 25px;">
                    <h4 style="background: #34495e; color: white; padding: 10px; margin: 0; border-radius: 8px 8px 0 0;">
                        <i class="fas fa-calendar-day"></i> ${date} (${logs.length} hoạt động)
                    </h4>
                    <div style="border: 1px solid #ecf0f1; border-top: none; border-radius: 0 0 8px 8px; padding: 15px; background: white;">
                        ${logs.map(log => `
                            <div style="display: flex; gap: 12px; padding: 10px; border-bottom: 1px solid #f0f0f0;">
                                <div style="background: ${getActivityColor(log.type)}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="${getActivityIcon(log.type)}" style="color: white;"></i>
                                </div>
                                <div style="flex: 1;">
                                    <strong style="color: #2c3e50;">${log.action}</strong>
                                    <p style="margin: 5px 0 0 0; color: #555;">${log.details}</p>
                                    <small style="color: #95a5a6;">${formatDateTime(log.timestamp)}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

function renderActivityLogsReport(dateRange, container) {
    const filteredLogs = logsData.filter(log => 
        log.timestamp >= dateRange.start && log.timestamp <= dateRange.end
    ).sort((a, b) => b.timestamp - a.timestamp);
    
    const byType = {
        'inventory': filteredLogs.filter(l => l.type === 'inventory').length,
        'task': filteredLogs.filter(l => l.type === 'task').length,
        'delivery': filteredLogs.filter(l => l.type.includes('delivery')).length,
        'return': filteredLogs.filter(l => l.type.includes('return')).length,
        'transfer': filteredLogs.filter(l => l.type === 'transfer').length,
    };
    
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">
                <i class="fas fa-history"></i> Báo Cáo Lịch Sử Hoạt Động
            </h3>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 15px;">
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; color: #3498db; font-weight: bold;">${byType.inventory}</div>
                    <div style="color: #7f8c8d; font-size: 0.85rem;">Vật tư</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; color: #9b59b6; font-weight: bold;">${byType.task}</div>
                    <div style="color: #7f8c8d; font-size: 0.85rem;">Sự vụ</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; color: #2ecc71; font-weight: bold;">${byType.delivery}</div>
                    <div style="color: #7f8c8d; font-size: 0.85rem;">Giao nhận</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; color: #e67e22; font-weight: bold;">${byType.return}</div>
                    <div style="color: #7f8c8d; font-size: 0.85rem;">Chuyển trả</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; color: #34495e; font-weight: bold;">${filteredLogs.length}</div>
                    <div style="color: #7f8c8d; font-size: 0.85rem;">Tổng cộng</div>
                </div>
            </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px;">
            ${filteredLogs.length === 0 ? `
                <p class="no-data">Không có hoạt động trong khoảng thời gian này</p>
            ` : `
                ${filteredLogs.map(log => `
                    <div style="display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid #ecf0f1;">
                        <div style="background: ${getActivityColor(log.type)}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="${getActivityIcon(log.type)}" style="color: white;"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <strong style="color: #2c3e50;">${log.action}</strong>
                                <small style="color: #95a5a6;">${formatTimeAgo(log.timestamp)}</small>
                            </div>
                            <p style="margin: 5px 0 0 0; color: #555;">${log.details}</p>
                            <small style="color: #95a5a6;">${formatDateTime(log.timestamp)} - ${log.user}</small>
                        </div>
                    </div>
                `).join('')}
            `}
        </div>
    `;
    
    container.innerHTML = html;
}

function exportReportToExcel() {
    const reportType = document.getElementById('reportTypeSelect').value;
    const period = document.getElementById('reportPeriodSelect').value;
    const dateRange = getDateRange(period);
    
    if (typeof XLSX === 'undefined') {
        showToast('error', 'Lỗi!', 'Thư viện Excel chưa được tải.');
        return;
    }
    
    let workbook = XLSX.utils.book_new();
    let fileName = '';
    
    switch(reportType) {
        case 'inventory-list':
            exportInventoryListToExcel(workbook, dateRange);
            fileName = `BaoCao_DanhSachVatTu_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`;
            break;
        case 'tasks':
            exportTasksToExcel(workbook, dateRange);
            fileName = `BaoCao_SuVu_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`;
            break;
        case 'inventory-changes':
            exportInventoryChangesToExcel(workbook, dateRange);
            fileName = `BaoCao_BienDongVatTu_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`;
            break;
        case 'activity-logs':
            exportActivityLogsToExcel(workbook, dateRange);
            fileName = `BaoCao_LichSuHoatDong_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`;
            break;
        default:
            showToast('error', 'Lỗi!', 'Vui lòng chọn loại báo cáo trước.');
            return;
    }
    
    // Save file
    XLSX.writeFile(workbook, fileName);
    showToast('success', 'Xuất Excel thành công!', `File đã được tải: ${fileName}`);
}

function exportInventoryListToExcel(workbook, dateRange) {
    const filteredItems = inventoryData.filter(item => 
        item.dateAdded >= dateRange.start && item.dateAdded <= dateRange.end
    );
    
    const wsData = [
        ['BÁO CÁO DANH SÁCH VẬT TƯ'],
        [`Từ ngày: ${formatDate(dateRange.start)} - Đến ngày: ${formatDate(dateRange.end)}`],
        [],
        ['STT', 'Serial', 'Tên Vật Tư', 'Kho', 'Tình Trạng', 'Sự Vụ', 'Ngày Nhập', 
         'Ngày Trả', 'Người Trả', 'Ngày Nhận Trả', 'Người Nhận Trả']
    ];
    
    filteredItems.forEach((item, index) => {
        const task = item.taskId ? tasksData.find(t => t.id === item.taskId) : null;
        const returnReq = returnRequestsData.find(r => r.itemId === item.id && r.status === 'confirmed');
        
        wsData.push([
            index + 1,
            item.serial,
            item.name,
            getWarehouseName(item.warehouse),
            getConditionText(item.condition),
            task ? task.name : '-',
            formatDate(item.dateAdded),
            returnReq ? formatDateTime(returnReq.requestedDate) : '-',
            returnReq ? returnReq.requestedBy : '-',
            returnReq ? formatDateTime(returnReq.confirmedDate) : '-',
            returnReq ? returnReq.confirmedBy : '-'
        ]);
    });
    
    // Add summary
    wsData.push([]);
    wsData.push(['TỔNG KẾT']);
    wsData.push(['Tổng vật tư:', filteredItems.length]);
    wsData.push(['Kho Net:', filteredItems.filter(i => i.warehouse === 'net').length]);
    wsData.push(['Kho Hạ Tầng:', filteredItems.filter(i => i.warehouse === 'infrastructure').length]);
    wsData.push(['Đã trả:', filteredItems.filter(i => returnRequestsData.find(r => r.itemId === i.id && r.status === 'confirmed')).length]);
    wsData.push(['Hỏng:', filteredItems.filter(i => i.condition === 'damaged').length]);
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
        {wch: 5}, {wch: 15}, {wch: 30}, {wch: 12}, {wch: 12}, {wch: 30}, {wch: 12},
        {wch: 18}, {wch: 25}, {wch: 18}, {wch: 25}
    ];
    
    XLSX.utils.book_append_sheet(workbook, ws, 'Danh Sách Vật Tư');
}

function exportTasksToExcel(workbook, dateRange) {
    const filteredTasks = tasksData.filter(task => 
        task.createdDate >= dateRange.start && task.createdDate <= dateRange.end
    );
    
    // Create main worksheet
    const wsData = [
        ['BÁO CÁO SỰ VỤ & VẬT TƯ'],
        [`Từ ngày: ${formatDate(dateRange.start)} - Đến ngày: ${formatDate(dateRange.end)}`],
        [],
        ['STT', 'Tên Sự Vụ', 'Loại', 'Địa Điểm', 'Người Tạo', 'Ngày Tạo', 'Trạng Thái']
    ];
    
    let rowIndex = 5;
    filteredTasks.forEach((task, index) => {
        wsData.push([
            index + 1,
            task.name,
            getTaskTypeText(task.type),
            task.location,
            task.createdBy || 'Không rõ',
            formatDateTime(task.createdDate),
            getTaskStatusText(task.status)
        ]);
        rowIndex++;
        
        // Get items for this task
        const assignedItems = inventoryData.filter(item => 
            task.assignedItems && task.assignedItems.includes(item.id)
        );
        
        const taskDeliveries = deliveryRequestsData.filter(r => r.taskId === task.id && r.status === 'confirmed');
        const taskReturns = returnRequestsData.filter(r => r.taskId === task.id && r.status === 'confirmed');
        
        // Add items section
        if (assignedItems.length > 0 || taskDeliveries.length > 0 || taskReturns.length > 0) {
            wsData.push(['', '  VẬT TƯ CỦA SỰ VỤ NÀY:']);
            rowIndex++;
            
            // Current items
            if (assignedItems.length > 0) {
                wsData.push(['', '', 'Serial', 'Tên VT', 'Tình Trạng', 'Kho']);
                rowIndex++;
                assignedItems.forEach(item => {
                    wsData.push(['', '', item.serial, item.name, getConditionText(item.condition), getWarehouseName(item.warehouse)]);
                    rowIndex++;
                });
            }
            
            // Delivered items timeline
            if (taskDeliveries.length > 0) {
                wsData.push(['', '', 'VẬT TƯ ĐÃ GIAO:']);
                rowIndex++;
                wsData.push(['', '', 'Serial', 'Tên', 'Ngày Giao', 'Người Giao', 'Ngày Nhận', 'Người Nhận']);
                rowIndex++;
                taskDeliveries.forEach(d => {
                    wsData.push(['', '', d.itemSerial, d.itemName, 
                        formatDateTime(d.requestedDate), d.requestedBy,
                        formatDateTime(d.confirmedDate), d.confirmedBy]);
                    rowIndex++;
                });
            }
            
            // Returned items timeline
            if (taskReturns.length > 0) {
                wsData.push(['', '', 'VẬT TƯ ĐÃ TRẢ:']);
                rowIndex++;
                wsData.push(['', '', 'Serial', 'Tên', 'Tình Trạng', 'Ngày Trả', 'Người Trả', 'Ngày Nhận', 'Người Nhận']);
                rowIndex++;
                taskReturns.forEach(r => {
                    wsData.push(['', '', r.itemSerial, r.itemName, getConditionText(r.itemCondition),
                        formatDateTime(r.requestedDate), r.requestedBy,
                        formatDateTime(r.confirmedDate), r.confirmedBy]);
                    rowIndex++;
                });
            }
            
            wsData.push([]);
            rowIndex++;
        }
    });
    
    // Add summary
    wsData.push([]);
    wsData.push(['TỔNG KẾT']);
    wsData.push(['Tổng số sự vụ:', filteredTasks.length]);
    wsData.push(['Đang hoạt động:', filteredTasks.filter(t => t.status !== 'completed').length]);
    wsData.push(['Đã hoàn thành:', filteredTasks.filter(t => t.status === 'completed').length]);
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch: 5}, {wch: 35}, {wch: 15}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 15}];
    
    XLSX.utils.book_append_sheet(workbook, ws, 'Báo Cáo Sự Vụ');
}

function exportInventoryChangesToExcel(workbook, dateRange) {
    const inventoryLogs = logsData.filter(log => 
        (log.type === 'inventory' || log.type === 'delivery' || log.type === 'return' || 
         log.type === 'delivery-request' || log.type === 'delivery-confirmed' || 
         log.type === 'return-request' || log.type === 'return-confirmed') &&
        log.timestamp >= dateRange.start && log.timestamp <= dateRange.end
    ).sort((a, b) => b.timestamp - a.timestamp);
    
    const wsData = [
        ['BÁO CÁO BIẾN ĐỘNG VẬT TƯ'],
        [`Từ ngày: ${formatDate(dateRange.start)} - Đến ngày: ${formatDate(dateRange.end)}`],
        [],
        ['STT', 'Ngày Giờ', 'Loại Hoạt Động', 'Chi Tiết', 'Người Thực Hiện']
    ];
    
    inventoryLogs.forEach((log, index) => {
        wsData.push([
            index + 1,
            formatDateTime(log.timestamp),
            log.action,
            log.details,
            log.user
        ]);
    });
    
    // Add summary
    wsData.push([]);
    wsData.push(['TỔNG KẾT']);
    wsData.push(['Tổng biến động:', inventoryLogs.length]);
    wsData.push(['Giao nhận:', inventoryLogs.filter(l => l.type.includes('delivery')).length]);
    wsData.push(['Chuyển trả:', inventoryLogs.filter(l => l.type.includes('return')).length]);
    wsData.push(['Thêm/Sửa/Xóa:', inventoryLogs.filter(l => l.type === 'inventory').length]);
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch: 5}, {wch: 20}, {wch: 25}, {wch: 60}, {wch: 20}];
    
    XLSX.utils.book_append_sheet(workbook, ws, 'Biến Động Vật Tư');
}

function exportActivityLogsToExcel(workbook, dateRange) {
    const filteredLogs = logsData.filter(log => 
        log.timestamp >= dateRange.start && log.timestamp <= dateRange.end
    ).sort((a, b) => b.timestamp - a.timestamp);
    
    const wsData = [
        ['BÁO CÁO LỊCH SỬ HOẠT ĐỘNG'],
        [`Từ ngày: ${formatDate(dateRange.start)} - Đến ngày: ${formatDate(dateRange.end)}`],
        [],
        ['STT', 'Ngày Giờ', 'Loại', 'Hành Động', 'Chi Tiết', 'Người Thực Hiện']
    ];
    
    filteredLogs.forEach((log, index) => {
        wsData.push([
            index + 1,
            formatDateTime(log.timestamp),
            log.type,
            log.action,
            log.details,
            log.user
        ]);
    });
    
    // Add summary by type
    wsData.push([]);
    wsData.push(['THỐNG KÊ THEO LOẠI']);
    wsData.push(['Vật tư:', filteredLogs.filter(l => l.type === 'inventory').length]);
    wsData.push(['Sự vụ:', filteredLogs.filter(l => l.type === 'task').length]);
    wsData.push(['Giao nhận:', filteredLogs.filter(l => l.type.includes('delivery')).length]);
    wsData.push(['Chuyển trả:', filteredLogs.filter(l => l.type.includes('return')).length]);
    wsData.push(['Chuyển kho:', filteredLogs.filter(l => l.type === 'transfer').length]);
    wsData.push(['Tổng cộng:', filteredLogs.length]);
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch: 5}, {wch: 20}, {wch: 20}, {wch: 30}, {wch: 60}, {wch: 20}];
    
    XLSX.utils.book_append_sheet(workbook, ws, 'Lịch Sử Hoạt Động');
}

// Make functions global
window.generateReport = generateReport;
window.exportReportToExcel = exportReportToExcel;

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
    
    // Set warehouse to user's warehouse and disable if not admin
    const warehouseSelect = document.getElementById('itemWarehouse');
    if (warehouseSelect) {
        warehouseSelect.value = userWarehouse;
        if (!isUserAdmin) {
            warehouseSelect.disabled = true;
        } else {
            warehouseSelect.disabled = false;
        }
    }
    
    // Reset button text
    const submitBtn = document.querySelector('#itemModal .modal-footer button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Thêm Vật Tư';
    }
    
    // Handle warehouse change to show/hide task field
    handleWarehouseChange();
    
    openModal('itemModal');
}

// Handle warehouse selection change
function handleWarehouseChange() {
    const warehouseSelect = document.getElementById('itemWarehouse');
    const taskGroup = document.getElementById('itemTaskGroup');
    const taskSelect = document.getElementById('itemTask');
    
    if (!warehouseSelect || !taskGroup || !taskSelect) return;
    
    const selectedWarehouse = warehouseSelect.value;
    
    if (selectedWarehouse === 'infrastructure') {
        // Show task field for Hạ Tầng warehouse (recovered equipment)
        taskGroup.style.display = 'block';
        taskSelect.required = true;
        
        // Populate with ACTIVE tasks only (exclude completed)
        taskSelect.innerHTML = '<option value="">Chọn sự vụ thu hồi...</option>';
        const availableTasks = tasksData.filter(task => 
            task.status === 'pending' || task.status === 'in-progress'
        );
        
        if (availableTasks.length === 0) {
            taskSelect.innerHTML += '<option value="" disabled>Chưa có sự vụ đang hoạt động</option>';
        } else {
            availableTasks.forEach(task => {
                taskSelect.innerHTML += `<option value="${task.id}">${task.name} (${getTaskTypeText(task.type)}) - ${task.location}</option>`;
            });
        }
        
        console.log('📋 Available tasks for item assignment:', availableTasks.length);
        
        console.log('📋 Infrastructure warehouse selected - Task field shown with', availableTasks.length, 'tasks');
    } else {
        // Hide task field for Net warehouse (new equipment)
        taskGroup.style.display = 'none';
        taskSelect.required = false;
        taskSelect.value = '';
        
        console.log('📦 Net warehouse selected - Task field hidden');
    }
}

// Make function global
window.handleWarehouseChange = handleWarehouseChange;

// Selected items for transfer
let selectedTransferItems = [];

function showTransferModal() {
    document.getElementById('transferModalTitle').textContent = 'Chuyển Kho';
    document.getElementById('transferForm').reset();
    
    // Reset selected items
    selectedTransferItems = [];
    
    // Determine transfer direction based on user's warehouse
    const transferDirection = document.getElementById('transferDirection');
    if (transferDirection) {
        if (userWarehouse === 'net') {
            transferDirection.innerHTML = '<i class="fas fa-arrow-right"></i> Từ Kho Net → Kho Hạ Tầng';
        } else {
            transferDirection.innerHTML = '<i class="fas fa-arrow-left"></i> Từ Kho Hạ Tầng → Kho Net';
        }
    }
    
    updateTransferTaskOptions();
    
    // Don't render items initially - wait for task selection
    const container = document.getElementById('transferAvailableItems');
    if (container) {
        if (userWarehouse === 'infrastructure') {
            container.innerHTML = '<p class="no-data" style="margin: 10px 0; color: #7f8c8d;"><i class="fas fa-info-circle"></i> Vui lòng chọn sự vụ để xem vật tư thu hồi</p>';
        } else {
            renderAvailableItems();
        }
    }
    
    renderSelectedItems();
    
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
    
    // Add event listener for task selection to filter items
    taskSelect.onchange = function() {
        const selectedTaskId = parseInt(this.value) || null;
        console.log('📋 Task selected:', selectedTaskId);
        
        if (userWarehouse === 'infrastructure' && selectedTaskId) {
            // Filter items by selected task
            renderAvailableItems('', selectedTaskId);
        } else if (userWarehouse === 'infrastructure' && !selectedTaskId) {
            // No task selected - show message
            const container = document.getElementById('transferAvailableItems');
            if (container) {
                container.innerHTML = '<p class="no-data" style="margin: 10px 0; color: #7f8c8d;"><i class="fas fa-info-circle"></i> Vui lòng chọn sự vụ để xem vật tư thu hồi</p>';
            }
        }
    };
}

// Render available items for transfer
function renderAvailableItems(searchTerm = '', filterTaskId = null) {
    const container = document.getElementById('transferAvailableItems');
    if (!container) return;
    
    console.log('🔍 renderAvailableItems called');
    console.log('👤 User warehouse:', userWarehouse);
    console.log('📋 Filter by taskId:', filterTaskId);
    console.log('📦 Total inventory:', inventoryData.length);
    
    // Get items from user's warehouse that are not already selected
    const itemsInUserWarehouse = inventoryData.filter(item => item.warehouse === userWarehouse);
    console.log(`🏢 Items in ${userWarehouse}:`, itemsInUserWarehouse.length);
    
    const itemsWithCorrectCondition = itemsInUserWarehouse.filter(item => 
        item.condition === 'available' || item.condition === 'in-use'
    );
    console.log('✅ Items available or in-use:', itemsWithCorrectCondition.length);
    console.log('📋 Breakdown:', {
        available: itemsInUserWarehouse.filter(i => i.condition === 'available').length,
        'in-use': itemsInUserWarehouse.filter(i => i.condition === 'in-use').length,
        maintenance: itemsInUserWarehouse.filter(i => i.condition === 'maintenance').length,
        damaged: itemsInUserWarehouse.filter(i => i.condition === 'damaged').length
    });
    
    const availableItems = inventoryData.filter(item => {
        const isInUserWarehouse = item.warehouse === userWarehouse;
        const isNotSelected = !selectedTransferItems.includes(item.id);
        const isAvailable = item.condition === 'available' || item.condition === 'in-use';
        const matchesSearch = !searchTerm || item.serial.toLowerCase().includes(searchTerm.toLowerCase()) || item.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // For Infrastructure warehouse, filter by taskId if specified
        const matchesTask = !filterTaskId || item.taskId === filterTaskId;
        
        return isInUserWarehouse && isNotSelected && isAvailable && matchesSearch && matchesTask;
    });
    
    console.log('✅ Final available items for transfer:', availableItems.length);
    
    if (availableItems.length === 0) {
        container.innerHTML = '<p class="no-data" style="margin: 10px 0;">Không có vật tư nào</p>';
        return;
    }
    
    // Simple list for all warehouses (task filtering done above)
    container.innerHTML = availableItems.map(item => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid #f0f0f0; background: white; transition: background 0.2s;" onmouseenter="this.style.background='#f8f9fa'" onmouseleave="this.style.background='white'">
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #2c3e50;">${item.serial}</div>
                <div style="color: #666; font-size: 0.9rem;">${item.name}</div>
                <div style="color: #999; font-size: 0.85rem;">${getConditionText(item.condition)}</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="addItemToTransfer(${item.id})" style="white-space: nowrap;">
                <i class="fas fa-plus"></i> Thêm
            </button>
        </div>
    `).join('');
    
    console.log('📦 Available items:', availableItems.length);
}

// Render selected items for transfer
function renderSelectedItems() {
    const container = document.getElementById('transferSelectedItems');
    const countSpan = document.getElementById('selectedItemsCount');
    
    if (!container) return;
    
    if (countSpan) {
        countSpan.textContent = selectedTransferItems.length;
    }
    
    if (selectedTransferItems.length === 0) {
        container.innerHTML = '<p class="no-data" style="margin: 0; color: #999;">Chưa chọn vật tư nào</p>';
        return;
    }
    
    container.innerHTML = selectedTransferItems.map(itemId => {
        const item = inventoryData.find(i => i.id === itemId);
        if (!item) return '';
        
        return `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 6px; margin-bottom: 5px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #2c3e50;">${item.serial} - ${item.name}</div>
                    <div style="color: #999; font-size: 0.85rem;">${getConditionText(item.condition)}</div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="removeItemFromTransfer(${item.id})" style="white-space: nowrap;">
                    <i class="fas fa-times"></i> Xóa
                </button>
            </div>
        `;
    }).join('');
    
    console.log('✅ Selected items:', selectedTransferItems.length);
}

// Add item to transfer list
function addItemToTransfer(itemId) {
    if (!selectedTransferItems.includes(itemId)) {
        selectedTransferItems.push(itemId);
        renderAvailableItems(document.getElementById('transferItemSearch').value);
        renderSelectedItems();
        showToast('success', 'Đã thêm', 'Vật tư đã được thêm vào danh sách chuyển kho.');
    }
}

// Remove item from transfer list
function removeItemFromTransfer(itemId) {
    selectedTransferItems = selectedTransferItems.filter(id => id !== itemId);
    renderAvailableItems(document.getElementById('transferItemSearch').value);
    renderSelectedItems();
}

// Make functions global
window.addItemToTransfer = addItemToTransfer;
window.removeItemFromTransfer = removeItemFromTransfer;

// Form Handlers
async function handleTaskSubmit(e) {
    e.preventDefault();
    console.log('🔄 handleTaskSubmit called');
    
    // Prevent duplicate submissions
    if (isSubmittingTask) {
        console.log('⚠️ Task already being submitted, skipping...');
        return;
    }
    
    // Clear previous errors
    if (typeof window.clearFormErrors === 'function') {
        window.clearFormErrors('taskForm');
    }
    
    const formData = {
        name: document.getElementById('taskName').value,
        type: document.getElementById('taskType').value,
        description: document.getElementById('taskDescription').value,
        location: document.getElementById('taskLocation').value,
        priority: document.getElementById('taskPriority').value
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

    // Mark as submitting
    isSubmittingTask = true;
    console.log('🔐 Marked task as submitting');

    const newTask = {
        id: tasksData.length > 0 ? Math.max(...tasksData.map(t => t.id), 0) + 1 : 1,
        ...formData,
        status: 'pending',
        createdDate: new Date(),
        createdBy: currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown',
        createdByWarehouse: getWarehouseName(userWarehouse),
        assignedItems: [],
        completedItems: []
    };

    try {
        // Check if Firebase functions are available
        if (typeof window.saveTaskToFirebase === 'function') {
            // Save to Firebase (onValue listener will update tasksData automatically)
            await window.saveTaskToFirebase(newTask);
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
        console.error('❌ Error saving task:', error);
        showToast('error', 'Lỗi!', 'Không thể lưu sự vụ vào Firebase.');
    } finally {
        // Always reset submitting flag
        isSubmittingTask = false;
        console.log('🔓 Reset task submitting flag');
    }
}

async function handleItemSubmit(e) {
    e.preventDefault();
    console.log('🔄 handleItemSubmit called');
    
    // Prevent duplicate submissions
    if (isSubmittingItem) {
        console.log('⚠️ Item already being submitted, skipping...');
        return;
    }
    
    // Clear previous errors
    if (typeof window.clearFormErrors === 'function') {
        window.clearFormErrors('itemForm');
    }
    
    const taskSelect = document.getElementById('itemTask');
    const taskId = taskSelect && taskSelect.value ? parseInt(taskSelect.value) : null;
    
    const formData = {
        serial: document.getElementById('itemSerial').value,
        name: document.getElementById('itemName').value,
        warehouse: document.getElementById('itemWarehouse').value,
        source: document.getElementById('itemSource').value,
        condition: document.getElementById('itemCondition').value,
        description: document.getElementById('itemDescription').value,
        taskId: taskId
    };
    
    console.log('📝 Form data:', formData);

    // Enhanced validation
    if (typeof window.validateInventoryForm === 'function') {
        console.log('✅ Using enhanced validation');
        const errors = await window.validateInventoryForm(formData, currentEditingItem ? currentEditingItem.id : null);
        if (errors.length > 0) {
            console.log('❌ Validation errors:', errors);
            window.displayFormErrors(errors);
            return;
        }
        console.log('✅ Validation passed');
    } else {
        console.log('⚠️ Using fallback validation');
        // Fallback basic validation
        if (!formData.serial || !formData.name || !formData.warehouse || !formData.condition) {
            console.log('❌ Missing required fields');
            showToast('error', 'Lỗi!', 'Vui lòng điền đầy đủ các trường bắt buộc.');
            return;
        }
        console.log('✅ Basic validation passed');
    }
    
    // Additional validation for infrastructure warehouse
    // Infrastructure items are recovered equipment, must be linked to a task
    if (formData.warehouse === 'infrastructure' && !formData.taskId) {
        console.log('❌ Task required for infrastructure warehouse - recovered equipment');
        showToast('error', 'Thiếu thông tin!', 'Vật tư kho Hạ Tầng là thiết bị thu hồi, BẮT BUỘC phải gán sự vụ.');
        
        // Highlight the task field
        const taskSelect = document.getElementById('itemTask');
        if (taskSelect) {
            taskSelect.style.borderColor = '#e74c3c';
            taskSelect.focus();
            setTimeout(() => {
                taskSelect.style.borderColor = '';
            }, 3000);
        }
        
        return;
    }
    
    // Check if task is completed (for infrastructure items)
    if (formData.warehouse === 'infrastructure' && formData.taskId) {
        const selectedTask = tasksData.find(t => t.id === formData.taskId);
        if (selectedTask && selectedTask.status === 'completed') {
            console.log('❌ Cannot assign items to completed task');
            showToast('error', 'Sự vụ đã đóng!', 'Không thể gán vật tư vào sự vụ đã hoàn thành. Sự vụ đã đóng chỉ để thống kê.');
            
            const taskSelect = document.getElementById('itemTask');
            if (taskSelect) {
                taskSelect.style.borderColor = '#e74c3c';
                taskSelect.focus();
                setTimeout(() => {
                    taskSelect.style.borderColor = '';
                }, 3000);
            }
            
            return;
        }
    }
    
    // Check permissions
    console.log('🔐 Checking permissions for warehouse:', formData.warehouse);
    if (!canCreateItem(formData.warehouse)) {
        console.log('❌ Permission denied');
        showToast('error', 'Lỗi quyền!', `Bạn không có quyền thêm vật tư vào ${getWarehouseName(formData.warehouse)}.`);
        return;
    }
    console.log('✅ Permission granted');

    // Mark as submitting
    isSubmittingItem = true;
    console.log('🔐 Marked item as submitting');

    try {
        if (currentEditingItem) {
            // UPDATE existing item
            console.log('📝 Updating existing item:', currentEditingItem.id);
            
            const updatedItem = {
                ...currentEditingItem,
                ...formData,
                dateAdded: currentEditingItem.dateAdded // Keep original date
            };
            
            console.log('📦 Updated item:', updatedItem);
            
            // Save to Firebase
            if (typeof window.saveInventoryToFirebase === 'function') {
                console.log('💾 Updating in Firebase...');
                await window.saveInventoryToFirebase(updatedItem);
                console.log('✅ Updated in Firebase');
            }
            
            // Update local data
            const index = inventoryData.findIndex(i => i.id === currentEditingItem.id);
            if (index !== -1) {
                inventoryData[index] = updatedItem;
                console.log('✅ Updated in local data');
            }
            
            await addLog('inventory', 'Cập nhật vật tư', `Cập nhật vật tư: ${updatedItem.name}`, getWarehouseName(currentWarehouse));
            showToast('success', 'Cập nhật thành công!', 'Vật tư đã được cập nhật.');
            
        } else {
            // CREATE new item
            const newItem = {
                id: inventoryData.length > 0 ? Math.max(...inventoryData.map(i => i.id), 0) + 1 : 1,
                ...formData,
                dateAdded: new Date()
                // taskId already in formData
            };
            
            console.log('📦 New item created:', newItem);
            console.log('🔥 Checking Firebase functions...');
            console.log('saveInventoryToFirebase available:', typeof window.saveInventoryToFirebase);
            
            if (typeof window.saveInventoryToFirebase === 'function') {
                console.log('💾 Saving to Firebase...');
                await window.saveInventoryToFirebase(newItem);
                console.log('✅ Saved to Firebase');
                
                // Don't push to local array - Firebase onValue listener will update it automatically
                // This prevents duplicate entries
                
                await addLog('inventory', 'Thêm vật tư', `Thêm vật tư: ${newItem.name} vào ${getWarehouseName(newItem.warehouse)}`, getWarehouseName(currentWarehouse));
                showToast('success', 'Thêm vật tư thành công!', 'Vật tư mới đã được thêm vào hệ thống và lưu vào Firebase.');
            } else {
                console.log('⚠️ Using fallback (no Firebase)');
                inventoryData.push(newItem);
                console.log('✅ Added to local data (fallback), total items:', inventoryData.length);
                
                addLog('inventory', 'Thêm vật tư', `Thêm vật tư: ${newItem.name} vào ${getWarehouseName(newItem.warehouse)}`, getWarehouseName(currentWarehouse));
                showToast('warning', 'Thêm vật tư thành công!', 'Vật tư đã được thêm vào hệ thống (chưa lưu Firebase).');
            }
        }
        
        // Don't call renderInventoryTable() here - Firebase listener will trigger it
        updateDashboard();
        closeModal('itemModal');
        
    } catch (error) {
        console.error('❌ Error saving item:', error);
        showToast('error', 'Lỗi!', 'Không thể lưu vật tư vào Firebase.');
    } finally {
        // Always reset submitting flag
        isSubmittingItem = false;
        console.log('🔓 Reset item submitting flag');
    }
}

async function handleTransferSubmit(e) {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmittingTransfer) {
        console.log('⚠️ Transfer already being submitted, skipping...');
        return;
    }
    
    // Clear previous errors
    if (typeof window.clearFormErrors === 'function') {
        window.clearFormErrors('transferForm');
    }
    
    const taskId = document.getElementById('transferTask').value ? parseInt(document.getElementById('transferTask').value) : null;
    const notes = document.getElementById('transferNotes').value;
    
    if (!taskId) {
        showToast('error', 'Lỗi!', 'Vui lòng chọn sự vụ liên quan.');
        return;
    }
    
    // Use selected items from the list
    console.log('📦 Selected items for transfer:', selectedTransferItems);
    
    if (selectedTransferItems.length === 0) {
        showToast('error', 'Lỗi!', 'Vui lòng chọn ít nhất một vật tư để chuyển.');
        return;
    }

    // Determine warehouses based on user's warehouse
    const fromWarehouse = userWarehouse;
    const toWarehouse = userWarehouse === 'net' ? 'infrastructure' : 'net';
    
    // Determine transfer type
    const type = userWarehouse === 'net' ? 'request' : 'return';
    
    console.log(`🔄 Transfer from ${fromWarehouse} to ${toWarehouse}, type: ${type}`);

    // Mark as submitting
    isSubmittingTransfer = true;
    console.log('🔐 Marked transfer as submitting');

    const newTransfer = {
        id: transfersData.length > 0 ? Math.max(...transfersData.map(t => t.id), 0) + 1 : 1,
        type: type,
        taskId: taskId,
        notes: notes,
        fromWarehouse,
        toWarehouse,
        items: selectedTransferItems,
        status: 'pending',
        createdDate: new Date(),
        createdBy: currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown',
        confirmedDate: null,
        confirmedBy: null
    };

    try {
        // Check if Firebase functions are available
        if (typeof window.saveTransferToFirebase === 'function') {
            // Save to Firebase
            await window.saveTransferToFirebase(newTransfer);
            
            // Update local data
            transfersData.push(newTransfer);
            await addLog('transfer', 'Tạo chuyển kho', `Tạo chuyển kho ${getTransferTypeText(newTransfer.type)} từ ${getWarehouseName(fromWarehouse)} sang ${getWarehouseName(toWarehouse)} (${selectedTransferItems.length} vật tư)`, getWarehouseName(currentWarehouse));
            
            showToast('success', 'Tạo chuyển kho thành công!', `Đã tạo chuyển kho ${selectedTransferItems.length} vật tư và lưu vào Firebase.`);
        } else {
            // Fallback: just update local data
            transfersData.push(newTransfer);
            addLog('transfer', 'Tạo chuyển kho', `Tạo chuyển kho ${getTransferTypeText(newTransfer.type)} từ ${getWarehouseName(fromWarehouse)} sang ${getWarehouseName(toWarehouse)}`, getWarehouseName(currentWarehouse));
            
            showToast('warning', 'Tạo chuyển kho thành công!', 'Chuyển kho đã được tạo (chưa lưu Firebase).');
        }
        
        updateDashboard();
        renderPendingRequestsList();
        closeModal('transferModal');
        
    } catch (error) {
        console.error('❌ Error saving transfer:', error);
        showToast('error', 'Lỗi!', 'Không thể lưu chuyển kho vào Firebase.');
    } finally {
        // Always reset submitting flag
        isSubmittingTransfer = false;
        console.log('🔓 Reset transfer submitting flag');
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
    renderPendingRequestsList();
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
function updateStatisticsMetrics() {
    const metricsGrid = document.getElementById('statsMetricsGrid');
    if (!metricsGrid) return;
    
    // Calculate metrics
    const totalItems = inventoryData.length;
    const totalTasks = tasksData.length;
    const activeTasks = tasksData.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
    const completedTasks = tasksData.filter(t => t.status === 'completed').length;
    const pendingDeliveries = deliveryRequestsData.filter(r => r.status === 'pending').length;
    const pendingReturns = returnRequestsData.filter(r => r.status === 'pending').length;
    const damagedItems = inventoryData.filter(i => i.condition === 'damaged').length;
    const availableItems = inventoryData.filter(i => i.condition === 'available').length;
    
    metricsGrid.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 2.5rem; font-weight: bold;">${totalItems}</div>
            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 5px;">
                <i class="fas fa-boxes"></i> Tổng Vật Tư
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 2.5rem; font-weight: bold;">${totalTasks}</div>
            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 5px;">
                <i class="fas fa-tasks"></i> Tổng Sự Vụ
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 2.5rem; font-weight: bold;">${activeTasks}</div>
            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 5px;">
                <i class="fas fa-spinner"></i> Sự Vụ Hoạt Động
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 2.5rem; font-weight: bold;">${completedTasks}</div>
            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 5px;">
                <i class="fas fa-check-circle"></i> Đã Hoàn Thành
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 2.5rem; font-weight: bold;">${pendingDeliveries + pendingReturns}</div>
            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 5px;">
                <i class="fas fa-clock"></i> Chờ Xác Nhận
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 2.5rem; font-weight: bold;">${availableItems}</div>
            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 5px;">
                <i class="fas fa-check"></i> Sẵn Sàng
            </div>
        </div>
        
        ${damagedItems > 0 ? `
            <div style="background: linear-gradient(135deg, #f83600 0%, #f9d423 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="font-size: 2.5rem; font-weight: bold;">${damagedItems}</div>
                <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 5px;">
                    <i class="fas fa-exclamation-triangle"></i> Vật Tư Hỏng
                </div>
            </div>
        ` : ''}
    `;
}

function initializeCharts() {
    // Update metrics
    updateStatisticsMetrics();
    
    // Warehouse Chart
    const warehouseCtx = document.getElementById('warehouseChart').getContext('2d');
    charts.warehouse = new Chart(warehouseCtx, {
        type: 'doughnut',
        data: {
            labels: ['Kho Net', 'Kho Hạ Tầng'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#3498db', '#9b59b6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Condition Chart
    const conditionCtx = document.getElementById('conditionChart').getContext('2d');
    charts.condition = new Chart(conditionCtx, {
        type: 'pie',
        data: {
            labels: ['Sẵn sàng', 'Đang sử dụng', 'Bảo trì', 'Hỏng'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#27ae60', '#3498db', '#f39c12', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Activity Trend Chart (Last 7 days)
    const activityTrendCtx = document.getElementById('activityTrendChart').getContext('2d');
    charts.activityTrend = new Chart(activityTrendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Hoạt động',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Initial update
    updateCharts();
}

function updateCharts() {
    // Update metrics cards
    updateStatisticsMetrics();
    
    // Update warehouse chart
    const netCount = inventoryData.filter(item => item.warehouse === 'net').length;
    const infraCount = inventoryData.filter(item => item.warehouse === 'infrastructure').length;
    
    if (charts.warehouse) {
        charts.warehouse.data.datasets[0].data = [netCount, infraCount];
        charts.warehouse.update();
    }
    
    // Update condition chart
    const availableCount = inventoryData.filter(i => i.condition === 'available').length;
    const inUseCount = inventoryData.filter(i => i.condition === 'in-use').length;
    const maintenanceCount = inventoryData.filter(i => i.condition === 'maintenance').length;
    const damagedCount = inventoryData.filter(i => i.condition === 'damaged').length;
    
    if (charts.condition) {
        charts.condition.data.datasets[0].data = [availableCount, inUseCount, maintenanceCount, damagedCount];
        charts.condition.update();
    }

    // Update activity trend (last 7 days)
    const last7Days = [];
    const activityCounts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        last7Days.push(dateStr.substring(0, 5)); // DD/MM
        
        const dayLogs = logsData.filter(log => formatDate(log.timestamp) === dateStr);
        activityCounts.push(dayLogs.length);
    }
    
    if (charts.activityTrend) {
        charts.activityTrend.data.labels = last7Days;
        charts.activityTrend.data.datasets[0].data = activityCounts;
        charts.activityTrend.update();
    }
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
    const task = tasksData.find(t => t.id === taskId);
    if (!task) {
        showToast('error', 'Lỗi!', 'Không tìm thấy sự vụ.');
        return;
    }
    
    // Get assigned items
    const assignedItems = inventoryData.filter(item => 
        task.assignedItems && task.assignedItems.includes(item.id)
    );
    
    // Get delivery requests for this task
    const taskDeliveries = deliveryRequestsData.filter(r => r.taskId === taskId);
    
    // Get return requests for items from this task
    const taskReturns = returnRequestsData.filter(r => r.taskId === taskId);
    
    // Get logs related to this task
    const taskLogs = logsData.filter(log => 
        log.details.toLowerCase().includes(task.name.toLowerCase()) ||
        log.details.includes(`#${taskId}`)
    ).sort((a, b) => b.timestamp - a.timestamp);
    
    // Build modal content
    let content = `
        <!-- Task Information -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #2c3e50;">
                <i class="fas fa-tasks"></i> ${task.name}
            </h3>
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 12px; margin-top: 15px;">
                <strong>Loại sự vụ:</strong> <span>${getTaskTypeText(task.type)}</span>
                <strong>Trạng thái:</strong> <span class="status-badge ${task.status}">${getTaskStatusText(task.status)}</span>
                <strong>Độ ưu tiên:</strong> <span class="priority-badge ${task.priority}">${getPriorityText(task.priority)}</span>
                <strong>Địa điểm:</strong> <span>${task.location}</span>
                <strong>Người tạo:</strong> <span>${task.createdBy || 'Không rõ'}${task.createdByWarehouse ? ` (${task.createdByWarehouse})` : ''}</span>
                <strong>Ngày tạo:</strong> <span>${formatDateTime(task.createdDate)}</span>
                ${task.status === 'completed' ? `
                    <strong>Hoàn thành:</strong> <span>${formatDateTime(task.completedDate)} bởi ${task.completedBy}</span>
                ` : ''}
            </div>
            <div style="margin-top: 15px;">
                <strong>Mô tả:</strong>
                <p style="margin-top: 5px; color: #555;">${task.description}</p>
            </div>
        </div>
        
        <!-- Assigned Items Section -->
        <div style="margin-bottom: 20px;">
            <h4 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
                <i class="fas fa-boxes"></i> Vật Tư Được Gán (${assignedItems.length})
            </h4>
            ${assignedItems.length === 0 ? `
                <p class="no-data">Chưa có vật tư nào được gán</p>
            ` : `
                <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #ecf0f1;">
                            <th style="padding: 8px; text-align: left;">Serial</th>
                            <th style="padding: 8px; text-align: left;">Tên</th>
                            <th style="padding: 8px; text-align: left;">Tình trạng</th>
                            <th style="padding: 8px; text-align: left;">Kho hiện tại</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignedItems.map(item => `
                            <tr style="border-bottom: 1px solid #ecf0f1;">
                                <td style="padding: 8px;"><strong>${item.serial}</strong></td>
                                <td style="padding: 8px;">${item.name}</td>
                                <td style="padding: 8px;"><span class="status-badge ${item.condition}">${getConditionText(item.condition)}</span></td>
                                <td style="padding: 8px;"><span class="warehouse-badge ${item.warehouse}">${getWarehouseName(item.warehouse)}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
        
        <!-- Delivery History Section -->
        <div style="margin-bottom: 20px;">
            <h4 style="color: #2c3e50; border-bottom: 2px solid #2ecc71; padding-bottom: 8px;">
                <i class="fas fa-shipping-fast"></i> Lịch Sử Giao Nhận (${taskDeliveries.length})
            </h4>
            ${taskDeliveries.length === 0 ? `
                <p class="no-data">Chưa có lịch sử giao nhận</p>
            ` : `
                <div style="margin-top: 10px;">
                    ${taskDeliveries.map(delivery => `
                        <div style="padding: 12px; background: ${delivery.status === 'confirmed' ? '#e8f8f5' : '#fff9e6'}; border-left: 4px solid ${delivery.status === 'confirmed' ? '#27ae60' : '#f39c12'}; margin-bottom: 10px; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <strong style="color: #2c3e50;">${delivery.itemSerial} - ${delivery.itemName}</strong>
                                    <div style="color: #7f8c8d; font-size: 0.9rem; margin-top: 5px;">
                                        <i class="fas fa-user"></i> Yêu cầu bởi: ${delivery.requestedBy}
                                        <br>
                                        <i class="fas fa-calendar"></i> ${formatDateTime(delivery.requestedDate)}
                                    </div>
                                    ${delivery.status === 'confirmed' ? `
                                        <div style="color: #27ae60; font-size: 0.9rem; margin-top: 5px;">
                                            <i class="fas fa-check-circle"></i> Xác nhận bởi: ${delivery.confirmedBy}
                                            <br>
                                            <i class="fas fa-calendar-check"></i> ${formatDateTime(delivery.confirmedDate)}
                                        </div>
                                    ` : ''}
                                </div>
                                <span class="status-badge ${delivery.status === 'confirmed' ? 'completed' : 'pending'}">
                                    ${delivery.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                                </span>
                            </div>
                            ${delivery.notes ? `<div style="margin-top: 8px; color: #555; font-style: italic;">Ghi chú: ${delivery.notes}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
        
        <!-- Return History Section -->
        <div style="margin-bottom: 20px;">
            <h4 style="color: #2c3e50; border-bottom: 2px solid #e67e22; padding-bottom: 8px;">
                <i class="fas fa-undo"></i> Lịch Sử Chuyển Trả (${taskReturns.length})
            </h4>
            ${taskReturns.length === 0 ? `
                <p class="no-data">Chưa có lịch sử chuyển trả</p>
            ` : `
                <div style="margin-top: 10px;">
                    ${taskReturns.map(returnReq => `
                        <div style="padding: 12px; background: ${returnReq.status === 'confirmed' ? '#fef5e7' : '#fff3cd'}; border-left: 4px solid ${returnReq.status === 'confirmed' ? '#e67e22' : '#f39c12'}; margin-bottom: 10px; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <strong style="color: #2c3e50;">${returnReq.itemSerial} - ${returnReq.itemName}</strong>
                                    <span class="status-badge ${returnReq.itemCondition}" style="margin-left: 10px; font-size: 0.85rem;">${getConditionText(returnReq.itemCondition)}</span>
                                    <div style="color: #7f8c8d; font-size: 0.9rem; margin-top: 5px;">
                                        <i class="fas fa-user"></i> Yêu cầu trả bởi: ${returnReq.requestedBy}
                                        <br>
                                        <i class="fas fa-calendar"></i> ${formatDateTime(returnReq.requestedDate)}
                                    </div>
                                    ${returnReq.status === 'confirmed' ? `
                                        <div style="color: #e67e22; font-size: 0.9rem; margin-top: 5px;">
                                            <i class="fas fa-check-circle"></i> Nhận trả bởi: ${returnReq.confirmedBy}
                                            <br>
                                            <i class="fas fa-calendar-check"></i> ${formatDateTime(returnReq.confirmedDate)}
                                        </div>
                                    ` : ''}
                                </div>
                                <span class="status-badge ${returnReq.status === 'confirmed' ? 'completed' : 'pending'}">
                                    ${returnReq.status === 'confirmed' ? 'Đã trả' : 'Chờ xác nhận'}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
        
        <!-- Activity Logs Section -->
        <div style="margin-bottom: 20px;">
            <h4 style="color: #2c3e50; border-bottom: 2px solid #9b59b6; padding-bottom: 8px;">
                <i class="fas fa-history"></i> Lịch Sử Hoạt Động (${taskLogs.length})
            </h4>
            ${taskLogs.length === 0 ? `
                <p class="no-data">Chưa có hoạt động nào</p>
            ` : `
                <div style="margin-top: 10px; max-height: 300px; overflow-y: auto;">
                    ${taskLogs.map(log => `
                        <div style="padding: 10px; border-bottom: 1px solid #ecf0f1; display: flex; gap: 12px;">
                            <div style="background: ${getActivityColor(log.type)}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <i class="${getActivityIcon(log.type)}" style="color: white;"></i>
                            </div>
                            <div style="flex: 1;">
                                <strong style="color: #2c3e50;">${log.action}</strong>
                                <p style="margin: 5px 0 0 0; color: #555; font-size: 0.9rem;">${log.details}</p>
                                <small style="color: #95a5a6;">${formatTimeAgo(log.timestamp)} - ${formatDateTime(log.timestamp)}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
    
    document.getElementById('taskDetailsContent').innerHTML = content;
    openModal('taskDetailsModal');
}

// Make function global
window.viewTask = viewTask;

function requestItems(taskId) {
    showToast('info', 'Yêu cầu vật tư', `Yêu cầu vật tư cho sự vụ #${taskId}`);
}

async function closeTask(taskId) {
    console.log('🔒 closeTask called for:', taskId);
    
    // Prevent duplicate close operations
    if (closingTasks.has(taskId)) {
        console.log('⚠️ Task already being closed, skipping...');
        return;
    }
    
    const task = tasksData.find(t => t.id === taskId);
    if (!task) {
        showToast('error', 'Lỗi!', 'Không tìm thấy sự vụ.');
        return;
    }
    
    // Check if user is the creator (ONLY creator can close, not admin)
    const currentUserName = currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown';
    const isCreator = task.createdBy === currentUserName;
    
    if (!isCreator) {
        showToast('error', 'Không có quyền!', 'Chỉ người tạo sự vụ mới có thể đóng sự vụ.');
        console.log('❌ Not creator. Task created by:', task.createdBy, 'Current user:', currentUserName);
        return;
    }
    
    // Show confirmation
    const confirmed = await showConfirmDialog(
        'Đóng sự vụ',
        `Bạn có chắc muốn đóng sự vụ này?<br><br>
        <strong>Tên:</strong> ${task.name}<br>
        <strong>Loại:</strong> ${getTaskTypeText(task.type)}<br>
        <strong>Địa điểm:</strong> ${task.location}<br>
        <strong>Trạng thái hiện tại:</strong> ${getTaskStatusText(task.status)}`,
        'Đóng sự vụ',
        'Hủy'
    );
    
    if (!confirmed) {
        console.log('❌ Close task cancelled by user');
        return;
    }
    
    // Mark as closing
    closingTasks.add(taskId);
    console.log('🔐 Marked task as closing:', taskId);
    
    try {
        // Update task status
        task.status = 'completed';
        task.completedDate = new Date();
        task.completedBy = currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown';
        
        // Save to Firebase
        if (typeof window.saveTaskToFirebase === 'function') {
            await window.saveTaskToFirebase(task);
            console.log('✅ Task closed and saved to Firebase');
        }
        
        await addLog('task', 'Đóng sự vụ', `Đóng sự vụ: ${task.name}`, getWarehouseName(currentWarehouse));
        showToast('success', 'Đóng sự vụ thành công!', 'Sự vụ đã được đánh dấu hoàn thành.');
        
        updateDashboard();
        renderTasksList();
        
    } catch (error) {
        console.error('❌ Error closing task:', error);
        showToast('error', 'Lỗi!', 'Không thể đóng sự vụ.');
    } finally {
        // Always remove from closing set
        closingTasks.delete(taskId);
        console.log('🔓 Removed task from closing set:', taskId);
    }
}

async function confirmTransfer(transferId) {
    console.log('✅ confirmTransfer called for:', transferId);
    
    // Prevent duplicate confirm operations
    if (confirmingTransfers.has(transferId)) {
        console.log('⚠️ Transfer already being confirmed, skipping...');
        return;
    }
    
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
        console.log('❌ Transfer confirm cancelled by user');
        return;
    }
    
    // Mark as confirming
    confirmingTransfers.add(transferId);
    console.log('🔐 Marked transfer as confirming:', transferId);
    
    try {
        // Update transfer status
        transfer.status = 'confirmed';
        transfer.confirmedDate = new Date();
        transfer.confirmedBy = currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown';
        
        // Update items in transfer if any
        if (transfer.items && transfer.items.length > 0) {
            console.log(`🔄 Updating ${transfer.items.length} items warehouse to ${transfer.toWarehouse}`);
            
            for (const itemId of transfer.items) {
                const item = inventoryData.find(i => i.id === itemId);
                if (item) {
                    console.log(`📦 Updating item ${item.serial} from ${item.warehouse} to ${transfer.toWarehouse}`);
                    
                    const oldWarehouse = item.warehouse;
                    
                    // Update item warehouse and status
                    item.warehouse = transfer.toWarehouse;
                    item.condition = 'in-use';
                    item.taskId = transfer.taskId;
                    
                    // Save updated item to Firebase
                    if (typeof window.saveInventoryToFirebase === 'function') {
                        await window.saveInventoryToFirebase(item);
                        console.log(`✅ Item ${item.serial} warehouse updated in Firebase`);
                    }
                    
                    // Add individual log for each item
                    const task = tasksData.find(t => t.id === transfer.taskId);
                    const itemLogDetails = `Chuyển vật tư ${item.serial} (${item.name}) từ ${getWarehouseName(oldWarehouse)} sang ${getWarehouseName(transfer.toWarehouse)}${task ? ` - Sự vụ: ${task.name}` : ''}`;
                    await addLog('transfer', 'Chuyển vật tư', itemLogDetails, getWarehouseName(currentWarehouse));
                }
            }
            
            console.log(`✅ All ${transfer.items.length} items updated to ${getWarehouseName(transfer.toWarehouse)}`);
        }
        
        // Save transfer to Firebase
        if (typeof window.saveTransferToFirebase === 'function') {
            await window.saveTransferToFirebase(transfer);
            console.log('✅ Transfer confirmed and saved to Firebase');
        }
        
        // Add summary log for the transfer
        const logDetails = `Xác nhận chuyển kho #${transferId} (${getTransferTypeText(transfer.type)}) từ ${getWarehouseName(transfer.fromWarehouse)} sang ${getWarehouseName(transfer.toWarehouse)} - Tổng ${transfer.items ? transfer.items.length : 0} vật tư`;
        await addLog('confirmation', 'Xác nhận chuyển kho', logDetails, getWarehouseName(currentWarehouse));
        
        showToast('success', 'Xác nhận thành công!', 'Chuyển kho đã được xác nhận và vật tư đã được cập nhật.');
        
        updateDashboard();
        renderPendingRequestsList();
        renderInventoryTable();
        
    } catch (error) {
        console.error('❌ Error confirming transfer:', error);
        showToast('error', 'Lỗi!', 'Không thể xác nhận chuyển kho.');
    } finally {
        // Always remove from confirming set
        confirmingTransfers.delete(transferId);
        console.log('🔓 Removed transfer from confirming set:', transferId);
    }
}

function editItem(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) {
        showToast('error', 'Lỗi!', 'Không tìm thấy vật tư.');
        return;
    }
    
    if (!canEditItem(item)) {
        const userWarehouseName = getWarehouseName(userWarehouse);
        const itemWarehouseName = getWarehouseName(item.warehouse);
        showToast('error', 'Không có quyền!', `Bạn chỉ có quyền quản lý ${userWarehouseName}. Vật tư này thuộc ${itemWarehouseName}.`);
        console.log('❌ Permission denied: User warehouse:', userWarehouse, 'Item warehouse:', item.warehouse);
        return;
    }
    
    // Set current editing item
    currentEditingItem = item;
    
    // Update modal title
    document.getElementById('itemModalTitle').textContent = 'Chỉnh Sửa Vật Tư';
    
    // Populate form with item data
    document.getElementById('itemSerial').value = item.serial;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemWarehouse').value = item.warehouse;
    document.getElementById('itemSource').value = item.source || '';
    document.getElementById('itemCondition').value = item.condition;
    document.getElementById('itemDescription').value = item.description || '';
    
    // Change button text to "Lưu" for editing
    const submitBtn = document.querySelector('#itemModal .modal-footer button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu';
    }
    
    // Open modal
    openModal('itemModal');
}

// Track operations in progress to prevent duplicates
const deletingItems = new Set();
const closingTasks = new Set();
const confirmingTransfers = new Set();
let isSubmittingTask = false;
let isSubmittingItem = false;
let isSubmittingTransfer = false;

async function deleteItem(itemId) {
    console.log('🗑️ deleteItem called for:', itemId);
    
    // Prevent duplicate delete operations
    if (deletingItems.has(itemId)) {
        console.log('⚠️ Item already being deleted, skipping...');
        return;
    }
    
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) {
        showToast('error', 'Lỗi!', 'Không tìm thấy vật tư.');
        return;
    }
    
    if (!canEditItem(item)) {
        const userWarehouseName = getWarehouseName(userWarehouse);
        const itemWarehouseName = getWarehouseName(item.warehouse);
        showToast('error', 'Không có quyền!', `Bạn chỉ có quyền quản lý ${userWarehouseName}. Vật tư này thuộc ${itemWarehouseName}.`);
        console.log('❌ Permission denied for delete: User warehouse:', userWarehouse, 'Item warehouse:', item.warehouse);
        return;
    }
    
    // Show confirmation dialog
    const confirmed = await showConfirmDialog(
        'Xác nhận xóa',
        `Bạn có chắc muốn xóa vật tư này?<br><br>
        <strong>Serial:</strong> ${item.serial}<br>
        <strong>Tên:</strong> ${item.name}<br>
        <strong>Kho:</strong> ${getWarehouseName(item.warehouse)}<br>
        <strong>Tình trạng:</strong> ${getConditionText(item.condition)}`,
        'Xóa',
        'Hủy'
    );
    
    if (!confirmed) {
        console.log('❌ Delete cancelled by user');
        return;
    }
    
    // Mark as deleting
    deletingItems.add(itemId);
    console.log('🔒 Marked item as deleting:', itemId);
    
    try {
        // Delete from Firebase
        if (typeof window.deleteInventoryFromFirebase === 'function') {
            console.log('🗑️ Deleting from Firebase...');
            await window.deleteInventoryFromFirebase(item.id);
            console.log('✅ Deleted from Firebase');
        }
        
        // Delete from local data
        const index = inventoryData.findIndex(i => i.id === itemId);
        if (index !== -1) {
            inventoryData.splice(index, 1);
            console.log('✅ Deleted from local data');
        }
        
        await addLog('inventory', 'Xóa vật tư', `Xóa vật tư: ${item.name} (${item.serial})`, getWarehouseName(currentWarehouse));
        showToast('success', 'Xóa thành công!', 'Vật tư đã được xóa khỏi hệ thống.');
        
        updateDashboard();
        renderInventoryTable();
        
    } catch (error) {
        console.error('❌ Error deleting item:', error);
        showToast('error', 'Lỗi!', 'Không thể xóa vật tư.');
    } finally {
        // Always remove from deleting set
        deletingItems.delete(itemId);
        console.log('🔓 Removed item from deleting set:', itemId);
    }
}

// Global variable for return requests
let returnRequestsData = [];

// Return item from Infrastructure to Net warehouse (creates return request)
async function returnItemToNet(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) {
        showToast('error', 'Lỗi!', 'Không tìm thấy vật tư.');
        return;
    }
    
    const task = item.taskId ? tasksData.find(t => t.id === item.taskId) : null;
    
    // Show confirmation
    const confirmed = await showConfirmDialog(
        'Tạo yêu cầu chuyển trả về Kho Net',
        `Bạn có chắc muốn chuyển trả vật tư này về Kho Net?<br><br>
        <strong>Serial:</strong> ${item.serial}<br>
        <strong>Tên:</strong> ${item.name}<br>
        <strong>Tình trạng:</strong> ${getConditionText(item.condition)}<br>
        <strong>Sự vụ:</strong> ${task ? task.name : 'Không có'}<br><br>
        <em style="color: #7f8c8d;">Yêu cầu sẽ chờ xác nhận từ Kho Net</em>`,
        'Tạo yêu cầu',
        'Hủy'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Create return request instead of direct transfer
        const returnRequest = {
            id: returnRequestsData.length > 0 ? Math.max(...returnRequestsData.map(r => r.id), 0) + 1 : 1,
            itemId: item.id,
            itemSerial: item.serial,
            itemName: item.name,
            itemCondition: item.condition,
            taskId: item.taskId,
            taskName: task ? task.name : null,
            status: 'pending',
            requestedBy: currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown',
            requestedFrom: 'infrastructure',
            requestedDate: new Date(),
            confirmedBy: null,
            confirmedDate: null,
            notes: `Chuyển trả vật tư ${getConditionText(item.condition).toLowerCase()}`
        };
        
        // Add to local data
        returnRequestsData.push(returnRequest);
        
        // Save to Firebase if available
        if (typeof window.saveReturnRequestToFirebase === 'function') {
            await window.saveReturnRequestToFirebase(returnRequest);
        }
        
        // Add log
        await addLog('return-request', 'Yêu cầu chuyển trả', 
            `Tạo yêu cầu chuyển trả vật tư ${item.serial} - ${item.name} (${getConditionText(item.condition)}) từ Kho Hạ Tầng về Kho Net`, 
            getWarehouseName(currentWarehouse));
        
        showToast('success', 'Tạo yêu cầu thành công!', 'Yêu cầu chuyển trả đang chờ xác nhận từ Kho Net.');
        
        updateDashboard();
        renderInventoryTable();
        renderPendingRequestsList();
        
    } catch (error) {
        console.error('❌ Error creating return request:', error);
        showToast('error', 'Lỗi!', 'Không thể tạo yêu cầu chuyển trả.');
    }
}

// Track current item being delivered
let currentDeliveringItem = null;

// Deliver item from Net to task (Infrastructure)
function deliverItemToTask(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) {
        showToast('error', 'Lỗi!', 'Không tìm thấy vật tư.');
        return;
    }
    
    currentDeliveringItem = item;
    
    // Show item info
    const itemInfo = document.getElementById('deliverItemInfo');
    itemInfo.innerHTML = `
        <h4 style="margin-top: 0; color: #2c3e50;">
            <i class="fas fa-box"></i> Thông tin vật tư
        </h4>
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px; font-size: 14px;">
            <strong>Serial:</strong> <span>${item.serial}</span>
            <strong>Tên:</strong> <span>${item.name}</span>
            <strong>Kho hiện tại:</strong> <span>${getWarehouseName(item.warehouse)}</span>
            <strong>Tình trạng:</strong> <span class="status-badge ${item.condition}">${getConditionText(item.condition)}</span>
        </div>
    `;
    
    // Populate task dropdown with active tasks
    const taskSelect = document.getElementById('deliverTaskSelect');
    taskSelect.innerHTML = '<option value="">Chọn sự vụ cần giao...</option>';
    
    const activeTasks = tasksData.filter(task => 
        task.status === 'pending' || task.status === 'in-progress'
    );
    
    if (activeTasks.length === 0) {
        taskSelect.innerHTML += '<option value="" disabled>Chưa có sự vụ đang hoạt động</option>';
    } else {
        activeTasks.forEach(task => {
            taskSelect.innerHTML += `<option value="${task.id}">${task.name} (${getTaskTypeText(task.type)} - ${task.location})</option>`;
        });
    }
    
    // Reset form
    document.getElementById('deliverItemForm').reset();
    document.getElementById('deliverNotes').value = '';
    
    // Open modal
    openModal('deliverItemModal');
}

// Handle deliver item form submission
async function handleDeliverItemSubmit(e) {
    e.preventDefault();
    
    if (!currentDeliveringItem) {
        showToast('error', 'Lỗi!', 'Không tìm thấy vật tư.');
        return;
    }
    
    const taskId = parseInt(document.getElementById('deliverTaskSelect').value);
    const notes = document.getElementById('deliverNotes').value;
    
    if (!taskId) {
        showToast('error', 'Lỗi!', 'Vui lòng chọn sự vụ.');
        return;
    }
    
    const task = tasksData.find(t => t.id === taskId);
    if (!task) {
        showToast('error', 'Lỗi!', 'Không tìm thấy sự vụ.');
        return;
    }
    
    try {
        // Create delivery request instead of direct transfer
        const deliveryRequest = {
            id: deliveryRequestsData.length > 0 ? Math.max(...deliveryRequestsData.map(d => d.id), 0) + 1 : 1,
            itemId: currentDeliveringItem.id,
            itemSerial: currentDeliveringItem.serial,
            itemName: currentDeliveringItem.name,
            taskId: taskId,
            taskName: task.name,
            status: 'pending', // pending, confirmed, rejected
            requestedBy: currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown',
            requestedFrom: 'net',
            requestedDate: new Date(),
            confirmedBy: null,
            confirmedDate: null,
            notes: notes
        };
        
        // Add to local data (Firebase integration will come later)
        deliveryRequestsData.push(deliveryRequest);
        
        // Save to Firebase if available
        if (typeof window.saveDeliveryRequestToFirebase === 'function') {
            await window.saveDeliveryRequestToFirebase(deliveryRequest);
        }
        
        // Add log
        const logDetails = notes ? 
            `Tạo yêu cầu giao vật tư ${currentDeliveringItem.serial} - ${currentDeliveringItem.name} cho sự vụ "${task.name}". Ghi chú: ${notes}` :
            `Tạo yêu cầu giao vật tư ${currentDeliveringItem.serial} - ${currentDeliveringItem.name} cho sự vụ "${task.name}"`;
        await addLog('delivery-request', 'Yêu cầu giao vật tư', logDetails, getWarehouseName(currentWarehouse));
        
        showToast('success', 'Tạo yêu cầu thành công!', `Yêu cầu giao vật tư đang chờ xác nhận từ Kho Hạ Tầng.`);
        
        closeModal('deliverItemModal');
        currentDeliveringItem = null;
        
        updateDashboard();
        renderInventoryTable();
        renderPendingRequestsList();
        
    } catch (error) {
        console.error('❌ Error creating delivery request:', error);
        showToast('error', 'Lỗi!', 'Không thể tạo yêu cầu giao vật tư.');
    }
}

// Confirm delivery request (Infrastructure warehouse user)
async function confirmDeliveryRequest(requestId) {
    const request = deliveryRequestsData.find(r => r.id === requestId);
    if (!request) {
        showToast('error', 'Lỗi!', 'Không tìm thấy yêu cầu.');
        return;
    }
    
    const item = inventoryData.find(i => i.id === request.itemId);
    if (!item) {
        showToast('error', 'Lỗi!', 'Không tìm thấy vật tư.');
        return;
    }
    
    const task = tasksData.find(t => t.id === request.taskId);
    if (!task) {
        showToast('error', 'Lỗi!', 'Không tìm thấy sự vụ.');
        return;
    }
    
    // Show confirmation
    const confirmed = await showConfirmDialog(
        'Xác nhận nhận vật tư',
        `Bạn xác nhận đã nhận vật tư này?<br><br>
        <strong>Vật tư:</strong> ${item.serial} - ${item.name}<br>
        <strong>Sự vụ:</strong> ${task.name}<br>
        <strong>Người yêu cầu:</strong> ${request.requestedBy}<br>
        <strong>Ngày yêu cầu:</strong> ${formatDateTime(request.requestedDate)}<br>
        ${request.notes ? `<strong>Ghi chú:</strong> ${request.notes}` : ''}`,
        'Xác nhận',
        'Hủy'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Update item
        item.warehouse = 'infrastructure';
        item.condition = 'in-use';
        item.taskId = request.taskId;
        
        // Save item to Firebase
        if (typeof window.saveInventoryToFirebase === 'function') {
            await window.saveInventoryToFirebase(item);
        }
        
        // Add to task's assigned items
        if (!task.assignedItems) {
            task.assignedItems = [];
        }
        if (!task.assignedItems.includes(item.id)) {
            task.assignedItems.push(item.id);
            
            // Save task to Firebase
            if (typeof window.saveTaskToFirebase === 'function') {
                await window.saveTaskToFirebase(task);
            }
        }
        
        // Update delivery request status
        request.status = 'confirmed';
        request.confirmedBy = currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown';
        request.confirmedDate = new Date();
        
        // Save request to Firebase if available
        if (typeof window.saveDeliveryRequestToFirebase === 'function') {
            await window.saveDeliveryRequestToFirebase(request);
        }
        
        // Add log
        await addLog('delivery-confirmed', 'Xác nhận giao vật tư', 
            `Xác nhận nhận vật tư ${item.serial} - ${item.name} cho sự vụ "${task.name}" (Yêu cầu bởi: ${request.requestedBy})`, 
            getWarehouseName(currentWarehouse));
        
        showToast('success', 'Xác nhận thành công!', `Vật tư đã được giao cho sự vụ "${task.name}".`);
        
        updateDashboard();
        renderInventoryTable();
        renderTasksList();
        renderPendingRequestsList();
        
    } catch (error) {
        console.error('❌ Error confirming delivery:', error);
        showToast('error', 'Lỗi!', 'Không thể xác nhận giao vật tư.');
    }
}

// Confirm return request (Net warehouse user)
async function confirmReturnRequest(requestId) {
    const request = returnRequestsData.find(r => r.id === requestId);
    if (!request) {
        showToast('error', 'Lỗi!', 'Không tìm thấy yêu cầu.');
        return;
    }
    
    const item = inventoryData.find(i => i.id === request.itemId);
    if (!item) {
        showToast('error', 'Lỗi!', 'Không tìm thấy vật tư.');
        return;
    }
    
    // Show confirmation
    const confirmed = await showConfirmDialog(
        'Xác nhận nhận trả vật tư',
        `Bạn xác nhận đã nhận trả vật tư này về Kho Net?<br><br>
        <strong>Vật tư:</strong> ${item.serial} - ${item.name}<br>
        <strong>Tình trạng:</strong> ${getConditionText(request.itemCondition)}<br>
        <strong>Sự vụ:</strong> ${request.taskName || 'Không có'}<br>
        <strong>Người yêu cầu:</strong> ${request.requestedBy}<br>
        <strong>Ngày yêu cầu:</strong> ${formatDateTime(request.requestedDate)}`,
        'Xác nhận',
        'Hủy'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Update item - return to Net warehouse with original condition
        item.warehouse = 'net';
        // Keep original condition (available, damaged, etc)
        item.taskId = null; // Clear task assignment
        
        // Save item to Firebase
        if (typeof window.saveInventoryToFirebase === 'function') {
            await window.saveInventoryToFirebase(item);
        }
        
        // Update return request status
        request.status = 'confirmed';
        request.confirmedBy = currentUser ? (currentUser.displayName || currentUser.email) : 'Unknown';
        request.confirmedDate = new Date();
        
        // Save request to Firebase if available
        if (typeof window.saveReturnRequestToFirebase === 'function') {
            await window.saveReturnRequestToFirebase(request);
        }
        
        // Add log
        await addLog('return-confirmed', 'Xác nhận nhận trả', 
            `Xác nhận nhận trả vật tư ${item.serial} - ${item.name} (${getConditionText(item.condition)}) từ Kho Hạ Tầng (Yêu cầu bởi: ${request.requestedBy})`, 
            getWarehouseName(currentWarehouse));
        
        showToast('success', 'Xác nhận thành công!', 'Vật tư đã được chuyển về Kho Net.');
        
        updateDashboard();
        renderInventoryTable();
        renderPendingRequestsList();
        
    } catch (error) {
        console.error('❌ Error confirming return:', error);
        showToast('error', 'Lỗi!', 'Không thể xác nhận nhận trả vật tư.');
    }
}

// Make functions global
window.returnItemToNet = returnItemToNet;
window.deliverItemToTask = deliverItemToTask;
window.confirmDeliveryRequest = confirmDeliveryRequest;
window.confirmReturnRequest = confirmReturnRequest;

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
    // Just call viewTask - it already shows all logs
    viewTask(taskId);
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
    const userWarehouseDisplay = document.getElementById('userWarehouseDisplay');
    
    if (user && userInfo && userName) {
        try {
            // Get user data from Firebase
            const { getUserData, getUserWarehouse, isUserAdmin: checkIsUserAdmin } = await import('./auth-integration.js');
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
                
                // Update warehouse display
                if (userWarehouseDisplay) {
                    userWarehouseDisplay.textContent = warehouse === 'net' ? 'Kho Net' : 'Kho Hạ Tầng';
                    currentWarehouse = warehouse;
                }
                
                // Update UI based on permissions
                updateUIForPermissions();
                
                // Refresh dashboard and tables with user's warehouse
                updateDashboard();
                renderInventoryTable();
                
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
                
                if (userWarehouseDisplay) {
                    userWarehouseDisplay.textContent = 'Kho Net (mặc định)';
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