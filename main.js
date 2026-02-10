// LAMITI SHOP - Main JavaScript
class LamitiShop {
    constructor() {
        this.products = [];
        this.cart = JSON.parse(localStorage.getItem('lamiti-cart')) || [];
        this.orders = JSON.parse(localStorage.getItem('lamiti-orders')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('lamiti-user')) || null;
        this.isAdmin = false;
        
        // Load categories from localStorage or use defaults
        const savedCategories = localStorage.getItem('lamiti-categories');
        const savedSubcategories = localStorage.getItem('lamiti-subcategories');
        const savedCategoryImages = localStorage.getItem('lamiti-category-images');
        
        this.categories = savedCategories ? JSON.parse(savedCategories) : ['femmes', 'hommes', 'accessoires'];
        this.subcategories = savedSubcategories ? JSON.parse(savedSubcategories) : {
            'femmes': ['robes', 'vestes', 'pantalons', 'chaussures'],
            'hommes': ['chemises', 'pantalons', 'vestes', 'chaussures'],
            'accessoires': ['sacs', 'montres', 'lunettes', 'bijoux']
        };
        
        this.categoryImages = savedCategoryImages ? JSON.parse(savedCategoryImages) : {};
        
        this.init();
    }

    init() {
        this.loadProducts();
        this.initializeAnimations();
        this.bindEvents();
        this.updateCartBadge();
        this.initializeAdmin();
        this.initializeRealTimeUpdates();
        this.optimizeForMobile();
        
        // Initialize order tracking
        this.initializeOrderTracking();
    }

    // Product Management
    loadProducts() {
        const defaultProducts = [
            {
                id: 'prod1',
                name: 'Sac en Cuir Noir',
                category: 'accessoires',
                subcategory: 'sacs',
                price: 129000,
                originalPrice: 159000,
                images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Sac en cuir véritable avec finitions impeccables. Parfait pour un usage quotidien.',
                sizes: ['Unique'],
                colors: ['Noir', 'Marron'],
                stock: 15,
                featured: true,
                onSale: true,
                active: true,
                addedAt: new Date('2024-01-15').toISOString()
            },
            {
                id: 'prod2',
                name: 'Blazer Femme Élégant',
                category: 'femmes',
                subcategory: 'vestes',
                price: 89000,
                originalPrice: 89000,
                images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Blazer tailleur parfait pour le bureau ou les occasions spéciales.',
                sizes: ['XS', 'S', 'M', 'L', 'XL'],
                colors: ['Beige', 'Noir', 'Gris'],
                stock: 25,
                featured: true,
                onSale: false,
                active: true,
                addedAt: new Date('2024-01-20').toISOString()
            },
            {
                id: 'prod3',
                name: 'Montre de Luxe',
                category: 'accessoires',
                subcategory: 'montres',
                price: 299000,
                originalPrice: 350000,
                images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Montre suisse avec mouvement automatique et bracelet en cuir.',
                sizes: ['Unique'],
                colors: ['Or', 'Argent'],
                stock: 8,
                featured: false,
                onSale: true,
                active: true,
                addedAt: new Date('2024-02-01').toISOString()
            },
            {
                id: 'prod4',
                name: 'Lunettes de Soleil Design',
                category: 'accessoires',
                subcategory: 'lunettes',
                price: 45000,
                originalPrice: 45000,
                images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Lunettes UV400 avec design moderne et protection maximale.',
                sizes: ['Unique'],
                colors: ['Noir', 'Marron', 'Or'],
                stock: 30,
                featured: false,
                onSale: false,
                active: true,
                addedAt: new Date('2024-02-10').toISOString()
            },
            {
                id: 'prod5',
                name: 'Robe Soirée Élégante',
                category: 'femmes',
                subcategory: 'robes',
                price: 185000,
                originalPrice: 220000,
                images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Robe de soirée en soie avec détails raffinés.',
                sizes: ['XS', 'S', 'M', 'L'],
                colors: ['Noir', 'Rouge', 'Bleu'],
                stock: 12,
                featured: true,
                onSale: true,
                active: true,
                addedAt: new Date('2024-02-15').toISOString()
            },
            {
                id: 'prod6',
                name: 'Chemise Homme Classique',
                category: 'hommes',
                subcategory: 'chemises',
                price: 65000,
                originalPrice: 65000,
                images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                description: 'Chemise en coton premium avec coupe ajustée.',
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                colors: ['Blanc', 'Bleu', 'Gris'],
                stock: 20,
                featured: false,
                onSale: false,
                active: true,
                addedAt: new Date('2024-02-20').toISOString()
            }
        ];

        const savedProducts = localStorage.getItem('lamiti-products');
        this.products = savedProducts ? JSON.parse(savedProducts) : defaultProducts;
        
        if (!savedProducts) {
            localStorage.setItem('lamiti-products', JSON.stringify(this.products));
        }
    }

    saveProducts() {
        localStorage.setItem('lamiti-products', JSON.stringify(this.products));
        this.notifyDataChange();
    }

    saveOrders() {
        localStorage.setItem('lamiti-orders', JSON.stringify(this.orders));
        this.notifyDataChange();
    }

    // Category Management
    addCategory(categoryName, subcategories = [], image = null) {
        const normalizedName = categoryName.trim().toLowerCase();
        
        if (!this.categories.includes(normalizedName)) {
            this.categories.push(normalizedName);
            this.subcategories[normalizedName] = subcategories;
            
            // Save category image if provided
            if (image) {
                this.categoryImages[normalizedName] = image;
                this.saveCategoryImages();
            }
            
            this.saveCategories();
            this.showNotification(`Catégorie "${categoryName}" ajoutée avec succès!`, 'success');
            return true;
        }
        this.showNotification('Cette catégorie existe déjà!', 'error');
        return false;
    }

    deleteCategory(categoryName) {
        if (this.categories.includes(categoryName)) {
            // Check if category has products
            const hasProducts = this.products.some(p => p.category === categoryName);
            if (hasProducts) {
                this.showNotification('Impossible de supprimer: cette catégorie contient des produits!', 'error');
                return false;
            }
            
            this.categories = this.categories.filter(c => c !== categoryName);
            delete this.subcategories[categoryName];
            
            // Remove category image
            if (this.categoryImages[categoryName]) {
                delete this.categoryImages[categoryName];
                this.saveCategoryImages();
            }
            
            this.saveCategories();
            this.showNotification(`Catégorie "${categoryName}" supprimée avec succès!`, 'info');
            return true;
        }
        return false;
    }

    saveCategories() {
        localStorage.setItem('lamiti-categories', JSON.stringify(this.categories));
        localStorage.setItem('lamiti-subcategories', JSON.stringify(this.subcategories));
        this.notifyDataChange();
    }

    saveCategoryImages() {
        localStorage.setItem('lamiti-category-images', JSON.stringify(this.categoryImages));
        this.notifyDataChange();
    }

    // Cart Management
    addToCart(productId, quantity = 1, size = null, color = null) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.stock < quantity) {
            this.showNotification('Stock insuffisant!', 'error');
            return false;
        }

        // Check if item already exists in cart
        const existingItem = this.cart.find(item => 
            item.productId === productId && 
            item.size === size && 
            item.color === color
        );

        if (existingItem) {
            if (product.stock < existingItem.quantity + quantity) {
                this.showNotification('Stock insuffisant!', 'error');
                return false;
            }
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                productId,
                quantity,
                size,
                color,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart();
        this.updateCartBadge();
        this.showNotification('Article ajouté au panier!', 'success');
        this.animateAddToCart();
        
        // Close any open modals
        this.closeAllModals();
        return true;
    }

    removeFromCart(productId, size = null, color = null) {
        this.cart = this.cart.filter(item => 
            !(item.productId === productId && 
              item.size === size && 
              item.color === color)
        );
        this.saveCart();
        this.updateCartBadge();
        this.showNotification('Article retiré du panier', 'info');
    }

    updateCartQuantity(productId, quantity, size = null, color = null) {
        const item = this.cart.find(item => 
            item.productId === productId && 
            item.size === size && 
            item.color === color
        );
        
        if (item) {
            const product = this.products.find(p => p.id === productId);
            if (product && product.stock >= quantity) {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartBadge();
                this.updateCartDisplay();
            } else {
                this.showNotification('Stock insuffisant!', 'error');
            }
        }
    }

    saveCart() {
        localStorage.setItem('lamiti-cart', JSON.stringify(this.cart));
    }

    updateCartBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        badges.forEach(badge => {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }

    updateCartDisplay() {
        // Update cart page if user is on it
        if (window.location.pathname.includes('cart.html')) {
            if (typeof loadCartPage === 'function') {
                loadCartPage();
            }
        }
    }

    // Order Management - MODIFIÉ avec adminRead
    createOrder(customerInfo, shippingAddress, paymentMethod) {
        if (this.cart.length === 0) {
            this.showNotification('Votre panier est vide!', 'error');
            return null;
        }

        const orderId = 'ORD-' + Date.now();
        const order = {
            id: orderId,
            customer: customerInfo,
            items: [...this.cart],
            total: this.calculateTotal(),
            status: 'pending',
            statusHistory: [
                {
                    status: 'pending',
                    timestamp: new Date().toISOString(),
                    note: 'Commande créée'
                }
            ],
            orderDate: new Date().toISOString(),
            shippingAddress,
            paymentMethod,
            trackingCode: this.generateTrackingCode(),
            estimatedDelivery: this.calculateEstimatedDelivery(),
            updates: [],
            adminRead: false // NOUVEAU: marqué comme non lu par l'admin
        };

        // Update stock
        this.cart.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        this.orders.push(order);
        this.saveOrders();
        this.saveProducts();
        
        // Clear cart
        this.cart = [];
        this.saveCart();
        this.updateCartBadge();

        // Send confirmation email simulation
        this.sendOrderConfirmation(order);

        // Trigger admin notification avec son continu
        this.triggerAdminNotification(order);

        // Store customer order reference
        this.storeCustomerOrder(order.customer.email, orderId);

        return order;
    }

    storeCustomerOrder(email, orderId) {
        let customerOrders = JSON.parse(localStorage.getItem('lamiti-customer-orders') || '{}');
        if (!customerOrders[email]) {
            customerOrders[email] = [];
        }
        if (!customerOrders[email].includes(orderId)) {
            customerOrders[email].push(orderId);
            localStorage.setItem('lamiti-customer-orders', JSON.stringify(customerOrders));
        }
    }

    generateTrackingCode() {
        return 'TRK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    calculateEstimatedDelivery() {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3); // 3 days delivery
        return deliveryDate.toISOString();
    }

    calculateTotal() {
        return this.cart.reduce((total, item) => {
            const product = this.products.find(p => p.id === item.productId);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    }

    // Updated order status management
    updateOrderStatus(orderId, newStatus, note = null) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const oldStatus = order.status;
            order.status = newStatus;
            
            // Add to status history
            if (!order.statusHistory) {
                order.statusHistory = [];
            }
            
            order.statusHistory.push({
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: note || `Statut changé de "${this.getStatusLabel(oldStatus)}" à "${this.getStatusLabel(newStatus)}"`
            });
            
            order.lastUpdate = new Date().toISOString();
            this.saveOrders();
            
            // Add to updates for real-time notification
            order.updates = order.updates || [];
            order.updates.push({
                type: 'status_change',
                oldStatus: oldStatus,
                newStatus: newStatus,
                timestamp: new Date().toISOString(),
                message: note || `Votre commande est maintenant "${this.getStatusLabel(newStatus)}"`
            });
            
            // Notify customer
            this.sendStatusUpdateNotification(order);
            
            return true;
        }
        return false;
    }

    getOrderByTrackingCode(trackingCode) {
        return this.orders.find(o => o.trackingCode === trackingCode);
    }

    getCustomerOrders(email) {
        const customerOrders = JSON.parse(localStorage.getItem('lamiti-customer-orders') || '{}');
        const orderIds = customerOrders[email] || [];
        
        return this.orders.filter(order => orderIds.includes(order.id));
    }

    // Order tracking system
    initializeOrderTracking() {
        // Check for order updates every 5 seconds
        setInterval(() => {
            this.checkOrderUpdates();
        }, 5000);
    }

    checkOrderUpdates() {
        const currentUserEmail = this.currentUser?.email;
        if (!currentUserEmail) return;
        
        const customerOrders = this.getCustomerOrders(currentUserEmail);
        
        customerOrders.forEach(order => {
            // Check if there are new updates
            if (order.updates && order.updates.length > 0) {
                const lastSeenUpdate = localStorage.getItem(`lamiti-last-update-${order.id}`) || 0;
                const newUpdates = order.updates.filter(update => 
                    new Date(update.timestamp).getTime() > lastSeenUpdate
                );
                
                if (newUpdates.length > 0) {
                    // Show notification for new updates
                    newUpdates.forEach(update => {
                        if (update.type === 'status_change') {
                            this.showNotification(
                                `Mise à jour commande ${order.id}: ${update.message}`,
                                'info'
                            );
                        }
                    });
                    
                    // Update last seen
                    const latestUpdate = order.updates[order.updates.length - 1];
                    localStorage.setItem(`lamiti-last-update-${order.id}`, 
                        new Date(latestUpdate.timestamp).getTime());
                }
            }
        });
    }

    getOrderStatusTimeline(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order || !order.statusHistory) return [];
        
        return order.statusHistory.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
    }

    getNextStatus(currentStatus) {
        const statusFlow = {
            'pending': 'confirmed',
            'confirmed': 'shipped',
            'shipped': 'delivered',
            'delivered': null,
            'cancelled': null
        };
        return statusFlow[currentStatus];
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'shipped': 'Expédiée',
            'delivered': 'Livrée',
            'cancelled': 'Annulée'
        };
        return labels[status] || status;
    }

    // Trigger admin notification for new order avec son continu
    triggerAdminNotification(order) {
        // Dispatch event for admin page
        const event = new CustomEvent('newOrderCreated', {
            detail: { order }
        });
        document.dispatchEvent(event);
        
        // Si l'admin est connecté, déclencher le son immédiatement
        if (window.adminManager && window.adminManager.isAdmin) {
            // Le son sera déclenché via l'event listener dans adminManager
        }
    }

    // Admin Functions
    initializeAdmin() {
        const adminLogin = document.getElementById('admin-login-form');
        if (adminLogin) {
            adminLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Check if admin is already logged in
        const adminSession = localStorage.getItem('lamiti-admin');
        if (adminSession) {
            this.isAdmin = true;
        }
    }

    handleAdminLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        // Simple admin authentication (demo)
        if (username === 'admin' && password === 'lamiti2024') {
            this.isAdmin = true;
            localStorage.setItem('lamiti-admin', JSON.stringify({
                username,
                loginTime: new Date().toISOString()
            }));
            this.showNotification('Connexion admin réussie!', 'success');
        } else {
            this.showNotification('Identifiants incorrects!', 'error');
        }
    }

    logoutAdmin() {
        localStorage.removeItem('lamiti-admin');
        this.isAdmin = false;
        location.reload();
    }

    // Product CRUD for Admin
    addProduct(productData) {
        const newProduct = {
            id: 'prod' + Date.now(),
            ...productData,
            active: true,
            addedAt: new Date().toISOString()
        };
        this.products.push(newProduct);
        this.saveProducts();
        this.showNotification('Produit ajouté avec succès!', 'success');
        return newProduct;
    }

    updateProduct(productId, updates) {
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            this.saveProducts();
            this.showNotification('Produit mis à jour!', 'success');
            return true;
        }
        return false;
    }

    deleteProduct(productId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.showNotification('Produit supprimé!', 'info');
            return true;
        }
        return false;
    }

    toggleProductStatus(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            product.active = !product.active;
            this.saveProducts();
            this.showNotification(
                product.active ? 'Produit activé!' : 'Produit désactivé!',
                'info'
            );
            return true;
        }
        return false;
    }

    // UI Functions avec son pour notifications
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Jouer le son pour les notifications importantes
        if (type === 'success' || type === 'info') {
            this.playNotificationSound();
        }
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }

    // Fonction pour jouer le son de notification
    playNotificationSound() {
        // Vérifier si nous sommes dans l'admin
        if (document.getElementById('notification-sound')) {
            const sound = document.getElementById('notification-sound');
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => {
                    console.log('Audio playback failed:', e);
                });
            }
        } else {
            // Pour les autres pages, créer un élément audio temporaire
            const audio = new Audio('resources/natifmp3.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => {
                console.log('Audio playback failed:', e);
            });
        }
    }

    animateAddToCart() {
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.classList.add('bounce');
            setTimeout(() => {
                cartIcon.classList.remove('bounce');
            }, 600);
        }
    }

    initializeAnimations() {
        // Initialize Anime.js animations
        if (typeof anime !== 'undefined') {
            // Hero text animation
            anime({
                targets: '.hero-title',
                translateY: [50, 0],
                opacity: [0, 1],
                duration: 1000,
                easing: 'easeOutExpo',
                delay: 500
            });

            // Product cards animation
            anime({
                targets: '.product-card',
                translateY: [30, 0],
                opacity: [0, 1],
                duration: 800,
                delay: anime.stagger(100),
                easing: 'easeOutExpo'
            });
        }
    }

    bindEvents() {
        // Search functionality
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        });

        // Cart toggle
        const cartToggle = document.querySelector('.cart-toggle');
        if (cartToggle) {
            cartToggle.addEventListener('click', () => {
                this.toggleCart();
            });
        }

        // Listen for order updates
        document.addEventListener('orderStatusUpdated', (e) => {
            this.handleOrderStatusUpdate(e.detail);
        });
    }

    handleSearch(query) {
        if (query.trim()) {
            window.location.href = `products.html?search=${encodeURIComponent(query.trim())}`;
        }
    }

    handleOrderStatusUpdate(detail) {
        const { orderId, newStatus } = detail;
        const order = this.orders.find(o => o.id === orderId);
        
        if (order) {
            this.showNotification(
                `Votre commande ${orderId} est maintenant "${this.getStatusLabel(newStatus)}"`,
                'info'
            );
            
            // If on tracking page, refresh the view
            if (window.location.pathname.includes('track-order.html')) {
                window.location.reload();
            }
        }
    }

    // Customer order tracking page functions
    displayOrderTracking(order) {
        if (!order) return '';
        
        const timeline = this.getOrderStatusTimeline(order.id);
        
        return `
            <div class="order-tracking-container">
                <div class="order-header">
                    <h2>Suivi de commande</h2>
                    <div class="order-meta">
                        <div><strong>Numéro:</strong> ${order.id}</div>
                        <div><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString('fr-FR')}</div>
                        <div><strong>Code de suivi:</strong> <span class="tracking-code">${order.trackingCode}</span></div>
                    </div>
                </div>
                
                <div class="current-status">
                    <h3>Statut actuel</h3>
                    <div class="status-badge status-${order.status}">
                        ${this.getStatusLabel(order.status)}
                    </div>
                    ${order.estimatedDelivery ? `
                        <div class="estimated-delivery">
                            Livraison estimée: ${new Date(order.estimatedDelivery).toLocaleDateString('fr-FR')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="order-timeline">
                    <h3>Historique du statut</h3>
                    ${timeline.map((status, index) => `
                        <div class="timeline-item ${index === timeline.length - 1 ? 'current' : 'completed'}">
                            <div class="timeline-icon">${index + 1}</div>
                            <div class="timeline-content">
                                <div class="status-label">${this.getStatusLabel(status.status)}</div>
                                <div class="status-time">${new Date(status.timestamp).toLocaleString('fr-FR')}</div>
                                ${status.note ? `<div class="status-note">${status.note}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-details">
                    <h3>Détails de la commande</h3>
                    <div class="details-grid">
                        <div>
                            <h4>Adresse de livraison</h4>
                            <p>${order.shippingAddress.address}</p>
                            <p>${order.shippingAddress.city}, ${order.shippingAddress.zipCode}</p>
                            <p>${order.shippingAddress.country}</p>
                        </div>
                        <div>
                            <h4>Articles commandés</h4>
                            ${order.items.map(item => {
                                const product = this.products.find(p => p.id === item.productId);
                                return `
                                    <div class="order-item">
                                        <span>${product ? product.name : 'Produit'} × ${item.quantity}</span>
                                        <span>${window.shop.formatPrice(product ? product.price * item.quantity : 0)}</span>
                                    </div>
                                `;
                            }).join('')}
                            <div class="order-total">
                                <strong>Total:</strong>
                                <strong>${this.formatPrice(order.total)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    filterByCategory(category) {
        const filteredProducts = category === 'all' 
            ? this.products 
            : this.products.filter(product => product.category === category);
        this.displayProducts(filteredProducts);
    }

    displayProducts(products, container = null) {
        const targetContainer = container || document.querySelector('.products-grid');
        if (!targetContainer) return;

        targetContainer.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                    ${product.onSale ? '<span class="sale-badge">SOLDES</span>' : ''}
                    <div class="product-overlay">
                        <button class="quick-view-btn" onclick="shop.quickView('${product.id}')">
                            Aperçu rapide
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        ${product.onSale 
                            ? `<span class="original-price">${this.formatPrice(product.originalPrice)}</span>
                               <span class="sale-price">${this.formatPrice(product.price)}</span>`
                            : `<span class="price">${this.formatPrice(product.price)}</span>`
                        }
                    </div>
                    <div class="product-stock">
                        Stock: ${product.stock > 0 ? product.stock : 'Rupture'}
                    </div>
                    <button class="add-to-cart-btn" 
                            onclick="shop.addToCart('${product.id}', 1)"
                            ${product.stock <= 0 ? 'disabled' : ''}>
                        ${product.stock > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    quickView(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Create modal if it doesn't exist
        this.createQuickViewModal();
        
        // Populate modal content
        this.populateQuickViewModal(product);
        
        // Show modal
        const modal = document.getElementById('quick-view-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    createQuickViewModal() {
        if (document.getElementById('quick-view-modal')) return;

        const modalHTML = `
            <div class="modal-overlay" id="quick-view-modal">
                <div class="modal-content">
                    <button class="modal-close" onclick="shop.closeQuickView()">&times;</button>
                    <div class="quick-view-content">
                        <div class="quick-view-image">
                            <img id="qv-image" src="" alt="">
                            <div class="image-gallery" id="qv-gallery"></div>
                        </div>
                        <div class="quick-view-info">
                            <h2 id="qv-name"></h2>
                            <div class="price" id="qv-price"></div>
                            <p class="description" id="qv-description"></p>
                            <div class="options">
                                <div class="size-options">
                                    <label>Taille:</label>
                                    <select class="size-select" id="qv-size">
                                        <option value="">Sélectionner une taille</option>
                                    </select>
                                </div>
                                <div class="color-options">
                                    <label>Couleur:</label>
                                    <select class="color-select" id="qv-color">
                                        <option value="">Sélectionner une couleur</option>
                                    </select>
                                </div>
                            </div>
                            <button class="add-to-cart-btn" onclick="shop.addToCartFromQuickView()">
                                Ajouter au panier
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    populateQuickViewModal(product) {
        document.getElementById('qv-image').src = product.images[0];
        document.getElementById('qv-name').textContent = product.name;
        document.getElementById('qv-price').textContent = this.formatPrice(product.price);
        document.getElementById('qv-description').textContent = product.description;
        
        // Populate image gallery
        const gallery = document.getElementById('qv-gallery');
        if (gallery) {
            gallery.innerHTML = product.images.map((image, index) => `
                <img src="${image}" 
                     alt="${product.name} - Image ${index + 1}" 
                     onclick="shop.changeQuickViewImage(${index})"
                     class="${index === 0 ? 'active' : ''}">
            `).join('');
        }
        
        // Populate size options
        const sizeSelect = document.getElementById('qv-size');
        sizeSelect.innerHTML = '<option value="">Sélectionner une taille</option>';
        product.sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            sizeSelect.appendChild(option);
        });
        
        // Populate color options
        const colorSelect = document.getElementById('qv-color');
        colorSelect.innerHTML = '<option value="">Sélectionner une couleur</option>';
        product.colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            colorSelect.appendChild(option);
        });
        
        // Store current product
        this.currentQuickViewProduct = product;
        this.currentQuickViewImageIndex = 0;
    }

    changeQuickViewImage(index) {
        if (this.currentQuickViewProduct && this.currentQuickViewProduct.images[index]) {
            document.getElementById('qv-image').src = this.currentQuickViewProduct.images[index];
            this.currentQuickViewImageIndex = index;
            
            // Update active state in gallery
            const galleryImages = document.querySelectorAll('#qv-gallery img');
            galleryImages.forEach((img, i) => {
                img.classList.toggle('active', i === index);
            });
        }
    }

    closeQuickView() {
        const modal = document.getElementById('quick-view-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        this.currentQuickViewProduct = null;
        this.currentQuickViewImageIndex = 0;
    }

    addToCartFromQuickView() {
        if (!this.currentQuickViewProduct) return;
        
        const size = document.getElementById('qv-size').value;
        const color = document.getElementById('qv-color').value;
        
        if (this.addToCart(this.currentQuickViewProduct.id, 1, size, color)) {
            this.closeQuickView();
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    // Real-time updates simulation
    initializeRealTimeUpdates() {
        // Simulate real-time stock updates
        setInterval(() => {
            this.simulateStockUpdates();
        }, 30000); // Every 30 seconds
    }

    // Mobile detection and optimization
    isMobile() {
        return window.innerWidth <= 768;
    }

    // Optimize for mobile devices
    optimizeForMobile() {
        if (this.isMobile()) {
            // Reduce animation complexity on mobile
            if (typeof anime !== 'undefined') {
                anime.suspendWhenDocumentHidden = true;
            }
            
            // Optimize touch interactions
            document.addEventListener('touchstart', function() {}, { passive: true });
            document.addEventListener('touchmove', function() {}, { passive: true });
        }
    }

    simulateStockUpdates() {
        // Randomly update stock for demo purposes
        this.products.forEach(product => {
            if (Math.random() < 0.1) { // 10% chance
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                product.stock = Math.max(0, product.stock + change);
            }
        });
        this.saveProducts();
    }

    notifyDataChange() {
        // Notify other components of data change
        const event = new CustomEvent('shopDataUpdate', {
            detail: { 
                products: this.products, 
                orders: this.orders,
                categories: this.categories,
                subcategories: this.subcategories,
                categoryImages: this.categoryImages
            }
        });
        document.dispatchEvent(event);
    }

    // Email simulation
    sendOrderConfirmation(order) {
        console.log(`Order confirmation sent to ${order.customer.email} for order ${order.id}`);
        
        // Store confirmation for customer
        const confirmations = JSON.parse(localStorage.getItem('lamiti-order-confirmations') || '[]');
        confirmations.push({
            orderId: order.id,
            email: order.customer.email,
            sentAt: new Date().toISOString()
        });
        localStorage.setItem('lamiti-order-confirmations', JSON.stringify(confirmations));
    }

    sendStatusUpdateNotification(order) {
        console.log(`Status update sent to ${order.customer.email} for order ${order.id}: ${order.status}`);
        
        // Dispatch event for real-time updates
        const event = new CustomEvent('orderStatusUpdated', {
            detail: {
                orderId: order.id,
                newStatus: order.status
            }
        });
        document.dispatchEvent(event);
    }

    // Customer management
    getCustomerStats(email) {
        const customerOrders = this.getCustomerOrders(email);
        const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = customerOrders.length;
        
        return {
            totalSpent,
            totalOrders,
            averageOrder: totalOrders > 0 ? totalSpent / totalOrders : 0,
            lastOrder: customerOrders.length > 0 ? customerOrders[customerOrders.length - 1] : null
        };
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        if (cartSidebar) {
            cartSidebar.classList.toggle('active');
        }
    }

    // Get low stock products
    getLowStockProducts(threshold = 5) {
        return this.products.filter(p => p.stock <= threshold && p.active);
    }

    // Get category statistics for charts
    getCategoryStats() {
        const stats = {};
        this.categories.forEach(category => {
            stats[category] = this.products.filter(p => p.category === category).length;
        });
        return stats;
    }
}

// Initialize the shop when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shop = new LamitiShop();
});

// Utility functions
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Handle escape key for modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll('.modal-overlay.active');
        activeModals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LamitiShop;
}
