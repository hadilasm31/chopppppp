class AdminManager {
    constructor() {
        this.isAdmin = false;
        this.unreadNotifications = [];
        this.notificationSound = null;
        this.notificationSoundInterval = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAdminSession();
        this.loadNotificationSound();
    }

    bindEvents() {
        // Login form submission
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Login button click
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Enter key in login form
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        
        if (usernameInput && passwordInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAdminLogin();
                }
            });
            
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAdminLogin();
                }
            });
        }
        
        // Listen for new orders
        document.addEventListener('newOrderCreated', (e) => {
            this.handleNewOrderNotification(e.detail.order);
        });
        
        // Listen for data updates
        document.addEventListener('shopDataUpdate', () => {
            if (this.isAdmin) {
                this.loadDashboardStats();
                this.updateCategoriesChart();
                this.loadCustomerStats();
            }
        });
    }

    loadNotificationSound() {
        // Create notification sound element if it doesn't exist
        if (!document.getElementById('new-order-notification-sound')) {
            const audio = document.createElement('audio');
            audio.id = 'new-order-notification-sound';
            audio.preload = 'auto';
            audio.loop = true;
            audio.volume = 0.5;
            
            const source = document.createElement('source');
            source.src = 'https://lasonotheque.org/UPLOAD/aac/0089.aac';
            source.type = 'audio/mpeg';
            
            audio.appendChild(source);
            document.body.appendChild(audio);
        }
        
        this.notificationSound = document.getElementById('new-order-notification-sound');
        
        // Précharger le son
        if (this.notificationSound) {
            this.notificationSound.load();
        }
    }

    checkAdminSession() {
        const adminSession = localStorage.getItem('lamiti-admin');
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession);
                const now = new Date();
                const loginTime = new Date(session.loginTime);
                const sessionDuration = now - loginTime;
                
                // Check if session is still valid (1 hour)
                if (sessionDuration < 3600000) {
                    this.isAdmin = true;
                    this.showAdminDashboard();
                    this.loadAdminContent();
                } else {
                    // Session expired
                    localStorage.removeItem('lamiti-admin');
                }
            } catch (error) {
                console.error('Invalid admin session:', error);
                localStorage.removeItem('lamiti-admin');
            }
        }
    }

    handleAdminLogin() {
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value.trim();

        // Simple admin authentication (demo)
        if (username === 'admin' && password === 'lamiti2024') {
            this.isAdmin = true;
            
            // Save admin session
            localStorage.setItem('lamiti-admin', JSON.stringify({
                username,
                loginTime: new Date().toISOString()
            }));
            
            this.showAdminDashboard();
            this.showNotification('Connexion admin réussie!', 'success');
            this.loadAdminContent();
            
            // Stop notification sound when admin logs in
            this.stopNotificationSound();
        } else {
            this.showNotification('Identifiants incorrects!', 'error');
            
            // Add shake animation to form
            const loginContainer = document.querySelector('.login-container');
            if (loginContainer) {
                loginContainer.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    loginContainer.style.animation = '';
                }, 500);
            }
        }
    }

    showAdminDashboard() {
        const loginSection = document.getElementById('admin-login');
        const dashboardSection = document.getElementById('admin-dashboard');
        
        if (loginSection && dashboardSection) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        }
    }

    loadAdminContent() {
        // Load dashboard stats
        this.loadDashboardStats();
        
        // Initialize charts
        this.initializeCharts();
        
        // Load products
        this.loadAdminProducts();
        this.loadMobileProducts();
        
        // Load categories
        this.loadAdminCategories();
        
        // Load orders
        this.loadAdminOrders();
        this.loadMobileOrders();
        
        // Load customers
        this.loadAdminCustomers();
        this.loadMobileCustomers();
        
        // Load customer stats
        this.loadCustomerStats();
        
        // Load low stock
        this.loadLowStockProducts();
        this.loadMobileLowStock();
        
        // Check for unread notifications
        this.checkForUnreadNotifications();
        
        // Update notification panel
        this.updateNotificationPanel();
    }

    loadDashboardStats() {
        if (!window.shop) return;
        
        const totalProducts = window.shop.products.length;
        const totalOrders = window.shop.orders.length;
        const totalRevenue = window.shop.orders.reduce((sum, order) => sum + order.total, 0);
        const lowStockItems = window.shop.products.filter(p => p.stock < 5).length;
        const pendingOrders = window.shop.orders.filter(o => o.status === 'pending').length;
        const completedOrders = window.shop.orders.filter(o => o.status === 'delivered').length;
        
        const elements = {
            'total-products': totalProducts,
            'total-orders': totalOrders,
            'total-revenue': window.shop.formatPrice(totalRevenue),
            'low-stock-items': lowStockItems,
            'pending-orders': pendingOrders,
            'completed-orders': completedOrders
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    loadCustomerStats() {
        if (!window.shop) return;
        
        const customers = this.getUniqueCustomers();
        const totalCustomers = customers.length;
        
        // Calculate active customers (ordered in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeCustomers = customers.filter(customer => {
            const latestOrder = Math.max(...customer.orders.map(o => new Date(o.orderDate).getTime()));
            return latestOrder > thirtyDaysAgo.getTime();
        }).length;
        
        // Calculate average order value
        const totalRevenue = window.shop.orders.reduce((sum, order) => sum + order.total, 0);
        const avgOrderValue = window.shop.orders.length > 0 ? totalRevenue / window.shop.orders.length : 0;
        
        // Calculate repeat customer rate
        const repeatCustomers = customers.filter(c => c.orders.length > 1).length;
        const repeatCustomerRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
        
        // Update UI
        const totalCustomersEl = document.getElementById('total-customers');
        const activeCustomersEl = document.getElementById('active-customers');
        const avgOrderValueEl = document.getElementById('avg-order-value');
        const repeatCustomersEl = document.getElementById('repeat-customers');
        
        if (totalCustomersEl) totalCustomersEl.textContent = totalCustomers;
        if (activeCustomersEl) activeCustomersEl.textContent = activeCustomers;
        if (avgOrderValueEl) avgOrderValueEl.textContent = window.shop.formatPrice(avgOrderValue);
        if (repeatCustomersEl) repeatCustomersEl.textContent = repeatCustomerRate + '%';
    }

    getUniqueCustomers() {
        if (!window.shop) return [];
        
        const customers = {};
        window.shop.orders.forEach(order => {
            const email = order.customer.email;
            if (!customers[email]) {
                customers[email] = {
                    ...order.customer,
                    orders: [],
                    totalSpent: 0
                };
            }
            customers[email].orders.push(order);
            customers[email].totalSpent += order.total;
        });
        
        return Object.values(customers);
    }

    initializeCharts() {
        // Initialize charts if ECharts is available
        if (typeof echarts !== 'undefined') {
            this.updateSalesChart();
            this.updateCategoriesChart();
        }
    }

    updateSalesChart() {
        const salesChartEl = document.getElementById('sales-chart');
        if (!salesChartEl) return;
        
        const salesChart = echarts.init(salesChartEl);
        const salesOption = {
            title: {
                text: 'Ventes des 6 derniers mois',
                left: 'center',
                textStyle: {
                    fontSize: 14
                }
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                axisLabel: {
                    fontSize: window.innerWidth <= 768 ? 10 : 12
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: '{value} FCFA',
                    fontSize: window.innerWidth <= 768 ? 10 : 12
                }
            },
            series: [{
                data: [120000, 200000, 150000, 80000, 70000, 110000],
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: '#d4af37'
                },
                areaStyle: {
                    color: 'rgba(212, 175, 55, 0.3)'
                }
            }],
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            }
        };
        salesChart.setOption(salesOption);
        
        // Handle resize
        window.addEventListener('resize', function() {
            salesChart.resize();
        });
    }

    updateCategoriesChart() {
        const categoriesChartEl = document.getElementById('categories-chart');
        if (!categoriesChartEl || !window.shop) return;
        
        const categoriesChart = echarts.init(categoriesChartEl);
        const categoryStats = window.shop.getCategoryStats();
        const chartData = Object.entries(categoryStats).map(([name, value]) => ({
            value: value,
            name: name.charAt(0).toUpperCase() + name.slice(1)
        }));

        const categoriesOption = {
            title: {
                text: 'Répartition par catégorie',
                left: 'center',
                textStyle: {
                    fontSize: 14
                }
            },
            tooltip: {
                trigger: 'item'
            },
            series: [{
                type: 'pie',
                radius: window.innerWidth <= 768 ? '45%' : '50%',
                data: chartData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                label: {
                    fontSize: window.innerWidth <= 768 ? 10 : 12
                }
            }],
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            }
        };
        categoriesChart.setOption(categoriesOption);
        
        // Handle resize
        window.addEventListener('resize', function() {
            categoriesChart.resize();
        });
    }

    // PRODUCTS TABLE - DESKTOP VERSION
    loadAdminProducts() {
        if (!window.shop) return;
        
        const productsTable = document.getElementById('products-table-body');
        if (!productsTable) return;

        const products = window.shop.products;
        
        let html = '';
        
        products.forEach(product => {
            const stockClass = product.stock < 5 ? 'text-red-600 font-semibold' : '';
            const statusClass = product.active ? 'status-confirmed' : 'status-cancelled';
            const statusText = product.active ? 'Actif' : 'Inactif';
            const toggleIcon = product.active ? '✅' : '⏸️';
            const saleStatus = product.onSale ? 'Oui' : 'Non';
            
            html += `
                <tr data-product-id="${product.id}">
                    <td>
                        <div class="table-image">
                            <img src="${product.images[0] || 'resources/product-placeholder.jpg'}" alt="${product.name}">
                        </div>
                    </td>
                    <td>
                        <div class="font-semibold" style="font-size: 0.9rem;">${product.name}</div>
                        <div class="text-sm text-gray-600">
                            ${product.description.substring(0, 50)}...
                        </div>
                    </td>
                    <td class="capitalize">${product.category}</td>
                    <td class="font-semibold">${window.shop.formatPrice(product.price)}</td>
                    <td class="${stockClass}">${product.stock}</td>
                    <td>${saleStatus}</td>
                    <td>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit-btn" onclick="editProduct('${product.id}')" title="Modifier">✏️</button>
                            <button class="action-btn toggle-btn ${product.active ? 'active' : ''}" onclick="toggleProduct('${product.id}')" title="${product.active ? 'Désactiver' : 'Activer'}">
                                ${toggleIcon}
                            </button>
                            <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')" title="Supprimer">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        productsTable.innerHTML = html;
    }

    // PRODUCTS MOBILE VERSION
    loadMobileProducts() {
        if (!window.shop || window.innerWidth > 768) return;
        
        const mobileContainer = document.getElementById('products-mobile-view');
        if (!mobileContainer) return;

        const products = window.shop.products;
        
        let html = '';
        
        products.forEach(product => {
            const stockClass = product.stock < 5 ? 'text-red-600 font-semibold' : '';
            const statusClass = product.active ? 'status-confirmed' : 'status-cancelled';
            const statusText = product.active ? 'Actif' : 'Inactif';
            const saleStatus = product.onSale ? 'Oui' : 'Non';
            
            html += `
                <div class="mobile-table-card" data-product-id="${product.id}">
                    <div class="mobile-table-row">
                        <div class="mobile-table-label">Image</div>
                        <div class="mobile-table-value">
                            <div class="table-image" style="margin: 0 auto;">
                                <img src="${product.images[0] || 'resources/product-placeholder.jpg'}" alt="${product.name}">
                            </div>
                        </div>
                    </div>
                    <div class="mobile-table-row">
                        <div class="mobile-table-label">Nom</div>
                        <div class="mobile-table-value">
                            <div class="font-semibold">${product.name}</div>
                            <div class="text-sm text-gray-600">${product.description.substring(0, 40)}...</div>
                        </div>
                    </div>
                    <div class="mobile-table-row">
                        <div class="mobile-table-label">Catégorie</div>
                        <div class="mobile-table-value capitalize">${product.category}</div>
                    </div>
                    <div class="mobile-table-row">
                        <div class="mobile-table-label">Prix</div>
                        <div class="mobile-table-value font-semibold">${window.shop.formatPrice(product.price)}</div>
                    </div>
                    <div class="mobile-table-row">
                        <div class="mobile-table-label">Stock</div>
                        <div class="mobile-table-value ${stockClass}">${product.stock}</div>
                    </div>
                    <div class="mobile-table-row">
                        <div class="mobile-table-label">En solde</div>
                        <div class="mobile-table-value">${saleStatus}</div>
                    </div>
                    <div class="mobile-table-row">
                        <div class="mobile-table-label">Statut</div>
                        <div class="mobile-table-value">
                            <span class="order-status ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                    <div class="mobile-table-row">
                        <div class="mobile-table-label">Actions</div>
                        <div class="mobile-table-value">
                            <div class="table-actions">
                                <button class="action-btn edit-btn" onclick="editProduct('${product.id}')" title="Modifier">✏️</button>
                                <button class="action-btn toggle-btn ${product.active ? 'active' : ''}" onclick="toggleProduct('${product.id}')" title="${product.active ? 'Désactiver' : 'Activer'}">
                                    ${product.active ? '✅' : '⏸️'}
                                </button>
                                <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')" title="Supprimer">🗑️</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        mobileContainer.innerHTML = html;
    }

    loadAdminCategories() {
        if (!window.shop) return;
        
        const categoriesGrid = document.getElementById('categories-grid');
        if (!categoriesGrid) return;

        let html = '';
        
        window.shop.categories.forEach(category => {
            const subcategories = window.shop.subcategories[category] || [];
            const productCount = window.shop.products.filter(p => p.category === category).length;
            const categoryImage = window.shop.categoryImages ? window.shop.categoryImages[category] : null;
            
            html += `
                <div class="category-card">
                    <div class="category-header">
                        <div class="category-name capitalize">${category}</div>
                        <div class="category-actions">
                            <button class="action-btn edit-btn" onclick="editCategory('${category}')">✏️</button>
                            <button class="action-btn delete-btn" onclick="deleteCategory('${category}')">🗑️</button>
                        </div>
                    </div>
                    <div class="category-image">
                        <img src="${categoryImage || 'resources/category-placeholder.jpg'}" alt="${category}">
                        <div class="category-image-actions">
                            <button class="action-btn edit-btn" onclick="changeCategoryImage('${category}')">📷</button>
                        </div>
                    </div>
                    <div class="subcategories">
                        <div class="text-sm text-gray-600 mb-2">Sous-catégories:</div>
                        <div class="subcategory-list" id="subcategory-list-${category}">
                            ${subcategories.map(sub => `
                                <span class="subcategory-tag">
                                    ${sub}
                                    <button class="remove-subcategory" onclick="removeSubcategory('${category}', '${sub}')">&times;</button>
                                </span>
                            `).join('')}
                        </div>
                        <div class="add-subcategory-form">
                            <input type="text" class="add-subcategory-input" id="subcategory-input-${category}" placeholder="Nouvelle sous-catégorie">
                            <button class="add-subcategory-btn" onclick="addSubcategory('${category}')">+</button>
                        </div>
                    </div>
                    <div class="mt-4 text-sm text-gray-600">
                        ${productCount} produit(s) dans cette catégorie
                    </div>
                </div>
            `;
        });
        
        categoriesGrid.innerHTML = html;
    }

    // ORDERS TABLE - DESKTOP VERSION
    loadAdminOrders() {
        if (!window.shop) return;
        
        const ordersTable = document.getElementById('orders-table-body');
        if (!ordersTable) return;

        let html = '';
        
        window.shop.orders.forEach(order => {
            const paymentMethod = order.paymentMethod === 'card' ? 'Carte' : 'Mobile';
            const isUnread = !order.adminRead;
            const rowClass = isUnread ? 'unread-order' : '';
            const orderIcon = isUnread ? '🔔 ' : '';
            
            html += `
                <tr data-order-id="${order.id}" class="${rowClass}">
                    <td class="font-mono text-sm">${orderIcon}${order.id}</td>
                    <td>
                        <div class="font-semibold" style="font-size: 0.9rem;">${order.customer.firstName} ${order.customer.lastName}</div>
                        <div class="text-sm text-gray-600">${order.customer.email}</div>
                    </td>
                    <td class="text-sm">${new Date(order.orderDate).toLocaleDateString('fr-FR')}</td>
                    <td class="font-semibold">${window.shop.formatPrice(order.total)}</td>
                    <td>
                        <span class="order-status status-${order.status}">
                            ${this.getStatusLabel(order.status)}
                        </span>
                    </td>
                    <td>${paymentMethod}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit-btn" onclick="viewOrderDetails('${order.id}')" title="Voir détails">👁️</button>
                            <button class="action-btn edit-btn" onclick="openUpdateOrderStatusModal('${order.id}')" title="Mettre à jour">🔄</button>
                            <button class="action-btn delete-btn" onclick="deleteOrder('${order.id}')" title="Supprimer">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        ordersTable.innerHTML = html;
    }
