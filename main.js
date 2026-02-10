// LAMITI SHOP - Main JavaScript
class LamitiShop {
    constructor() {
        this.products = [];
        this.cart = JSON.parse(localStorage.getItem('lamiti-cart')) || [];
        this.orders = JSON.parse(localStorage.getItem('lamiti-orders')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('lamiti-user')) || null;
        this.isAdmin = false;
        
        // Catégories et images
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
        
        // Gestionnaire Supabase
        this.supabaseManager = null;
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    async init() {
        this.loadProducts();
        this.initializeAnimations();
        this.bindEvents();
        this.updateCartBadge();
        this.initializeAdmin();
        this.initializeRealTimeUpdates();
        this.optimizeForMobile();
        this.initializeOrderTracking();
        
        // Initialiser Supabase
        await this.initializeSupabase();
        
        // Écouter les changements de connexion
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
        
        // Synchroniser les données locales avec Supabase
        this.scheduleSync();
    }

    async initializeSupabase() {
        try {
            // Vérifier si Supabase est chargé
            if (typeof supabase === 'undefined') {
                console.warn('Supabase non chargé, chargement du script...');
                await this.loadSupabaseScript();
            }
            
            // Initialiser le gestionnaire Supabase
            if (window.supabaseManager) {
                this.supabaseManager = window.supabaseManager;
                console.log('Supabase Manager initialisé');
                
                // Charger les données depuis Supabase si en ligne
                if (this.isOnline) {
                    await this.loadDataFromSupabase();
                }
            } else {
                console.warn('Supabase Manager non disponible');
            }
        } catch (error) {
            console.error('Erreur d\'initialisation Supabase:', error);
        }
    }

    loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            if (typeof supabase !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async loadDataFromSupabase() {
        if (!this.supabaseManager || !this.supabaseManager.isConnected) {
            console.warn('Supabase non connecté');
            return;
        }

        try {
            console.log('Chargement des données depuis Supabase...');
            
            // Charger les produits
            const supabaseProducts = await this.supabaseManager.getProducts();
            if (supabaseProducts && supabaseProducts.length > 0) {
                // Fusionner avec les produits locaux
                this.mergeProducts(supabaseProducts);
                this.saveProducts();
                console.log(`${supabaseProducts.length} produits chargés depuis Supabase`);
            }
            
            // Charger les catégories
            const supabaseCategories = await this.supabaseManager.getCategories();
            if (supabaseCategories && supabaseCategories.length > 0) {
                this.categories = supabaseCategories.map(cat => cat.name.toLowerCase());
                this.saveCategories();
                console.log(`${supabaseCategories.length} catégories chargées depuis Supabase`);
            }
            
            // Charger les commandes (admin seulement)
            if (this.isAdmin) {
                const supabaseOrders = await this.supabaseManager.getOrders();
                if (supabaseOrders && supabaseOrders.length > 0) {
                    this.mergeOrders(supabaseOrders);
                    this.saveOrders();
                    console.log(`${supabaseOrders.length} commandes chargées depuis Supabase`);
                }
            }
            
            this.notifyDataChange();
            
        } catch (error) {
            console.error('Erreur lors du chargement des données Supabase:', error);
        }
    }

    mergeProducts(supabaseProducts) {
        // Créer un map des produits locaux par ID
        const localProductsMap = {};
        this.products.forEach(product => {
            localProductsMap[product.id] = product;
        });
        
        // Fusionner avec les produits Supabase
        supabaseProducts.forEach(supabaseProduct => {
            if (localProductsMap[supabaseProduct.id]) {
                // Mettre à jour le produit existant
                Object.assign(localProductsMap[supabaseProduct.id], supabaseProduct);
            } else {
                // Ajouter le nouveau produit
                this.products.push(supabaseProduct);
            }
        });
        
        // Trier par date d'ajout
        this.products.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    }

    mergeOrders(supabaseOrders) {
        // Créer un map des commandes locales par ID
        const localOrdersMap = {};
        this.orders.forEach(order => {
            localOrdersMap[order.id] = order;
        });
        
        // Fusionner avec les commandes Supabase
        supabaseOrders.forEach(supabaseOrder => {
            if (localOrdersMap[supabaseOrder.id]) {
                // Mettre à jour la commande existante
                const localOrder = localOrdersMap[supabaseOrder.id];
                
                // Vérifier si le statut a changé
                if (localOrder.status !== supabaseOrder.status) {
                    localOrder.status = supabaseOrder.status;
                    if (!localOrder.statusHistory) {
                        localOrder.statusHistory = [];
                    }
                    localOrder.statusHistory.push({
                        status: supabaseOrder.status,
                        timestamp: new Date().toISOString(),
                        note: 'Mise à jour depuis Supabase'
                    });
                }
                
                // Mettre à jour les autres champs
                Object.assign(localOrder, supabaseOrder);
            } else {
                // Ajouter la nouvelle commande
                this.orders.push(supabaseOrder);
            }
        });
        
        // Trier par date de commande
        this.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }

    async syncDataToSupabase() {
        if (!this.isOnline || !this.supabaseManager || !this.supabaseManager.isConnected) {
            console.log('Hors ligne ou Supabase non connecté, synchronisation reportée');
            return false;
        }

        try {
            console.log('Synchronisation des données vers Supabase...');
            
            // Synchroniser les produits
            if (this.products.length > 0) {
                await this.supabaseManager.syncProducts(this.products);
            }
            
            // Synchroniser les commandes
            if (this.orders.length > 0) {
                await this.supabaseManager.syncOrders(this.orders);
            }
            
            console.log('Synchronisation terminée avec succès');
            return true;
            
        } catch (error) {
            console.error('Erreur lors de la synchronisation:', error);
            return false;
        }
    }

    scheduleSync() {
        // Synchroniser toutes les 30 secondes si en ligne
        setInterval(() => {
            if (this.isOnline) {
                this.syncDataToSupabase();
            }
        }, 30000);
        
        // Synchroniser immédiatement au chargement
        setTimeout(() => {
            if (this.isOnline) {
                this.syncDataToSupabase();
            }
        }, 5000);
    }

    handleOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        
        if (isOnline) {
            console.log('Connecté en ligne, synchronisation des données...');
            this.loadDataFromSupabase();
            this.syncDataToSupabase();
        } else {
            console.log('Hors ligne, utilisation des données locales');
        }
    }

    // MODIFICATION DE LA MÉTHODE createOrder pour synchroniser avec Supabase
    async createOrder(customerInfo, shippingAddress, paymentMethod) {
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
            adminRead: false
        };

        // Mettre à jour le stock
        this.cart.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        this.orders.push(order);
        this.saveOrders();
        this.saveProducts();
        
        // Vider le panier
        this.cart = [];
        this.saveCart();
        this.updateCartBadge();

        // Synchroniser avec Supabase si en ligne
        if (this.isOnline && this.supabaseManager) {
            try {
                await this.supabaseManager.createOrder(order);
            } catch (error) {
                console.error('Erreur lors de la synchronisation de la commande:', error);
                // Stocker la commande pour synchronisation ultérieure
                this.queueOrderForSync(order);
            }
        } else {
            // Stocker pour synchronisation ultérieure
            this.queueOrderForSync(order);
        }

        // Envoyer confirmation email
        this.sendOrderConfirmation(order);

        // Déclencher notification admin
        this.triggerAdminNotification(order);

        // Stocker référence client
        this.storeCustomerOrder(order.customer.email, orderId);

        return order;
    }

    queueOrderForSync(order) {
        let pendingSync = JSON.parse(localStorage.getItem('lamiti-pending-sync') || '[]');
        pendingSync.push({
            type: 'order',
            data: order,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('lamiti-pending-sync', JSON.stringify(pendingSync));
    }

    // MODIFICATION DE updateOrderStatus pour synchroniser avec Supabase
    async updateOrderStatus(orderId, newStatus, note = null) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return false;

        const oldStatus = order.status;
        order.status = newStatus;
        
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
        
        // Synchroniser avec Supabase si en ligne
        if (this.isOnline && this.supabaseManager) {
            try {
                await this.supabaseManager.updateOrderStatus(orderId, newStatus, note);
            } catch (error) {
                console.error('Erreur lors de la synchronisation du statut:', error);
                this.queueStatusUpdateForSync(orderId, newStatus, note);
            }
        } else {
            this.queueStatusUpdateForSync(orderId, newStatus, note);
        }

        // Ajouter aux mises à jour pour notification en temps réel
        order.updates = order.updates || [];
        order.updates.push({
            type: 'status_change',
            oldStatus: oldStatus,
            newStatus: newStatus,
            timestamp: new Date().toISOString(),
            message: note || `Votre commande est maintenant "${this.getStatusLabel(newStatus)}"`
        });
        
        // Notifier le client
        this.sendStatusUpdateNotification(order);
        
        return true;
    }

    queueStatusUpdateForSync(orderId, newStatus, note) {
        let pendingSync = JSON.parse(localStorage.getItem('lamiti-pending-sync') || '[]');
        pendingSync.push({
            type: 'status_update',
            data: { orderId, newStatus, note },
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('lamiti-pending-sync', JSON.stringify(pendingSync));
    }

    // Autres méthodes modifiées pour la synchronisation...
    async addProduct(productData) {
        const newProduct = {
            id: 'prod' + Date.now(),
            ...productData,
            active: true,
            addedAt: new Date().toISOString()
        };
        this.products.push(newProduct);
        this.saveProducts();
        
        // Synchroniser avec Supabase
        if (this.isOnline && this.supabaseManager) {
            try {
                await this.supabaseManager.syncProducts([newProduct]);
            } catch (error) {
                console.error('Erreur lors de la synchronisation du produit:', error);
            }
        }
        
        this.showNotification('Produit ajouté avec succès!', 'success');
        return newProduct;
    }

    async deleteProduct(productId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            
            // Synchroniser avec Supabase
            if (this.isOnline && this.supabaseManager) {
                try {
                    // Pour la suppression, on marque le produit comme inactif dans Supabase
                    const productToDelete = this.products.find(p => p.id === productId);
                    if (productToDelete) {
                        productToDelete.active = false;
                        await this.supabaseManager.syncProducts([productToDelete]);
                    }
                } catch (error) {
                    console.error('Erreur lors de la synchronisation de la suppression:', error);
                }
            }
            
            this.showNotification('Produit supprimé!', 'info');
            return true;
        }
        return false;
    }

    // Méthode pour traiter les synchronisations en attente
    async processPendingSync() {
        if (!this.isOnline || !this.supabaseManager) return;
        
        let pendingSync = JSON.parse(localStorage.getItem('lamiti-pending-sync') || '[]');
        if (pendingSync.length === 0) return;
        
        console.log(`Traitement de ${pendingSync.length} éléments en attente de synchronisation...`);
        
        const successfulSyncs = [];
        
        for (const syncItem of pendingSync) {
            try {
                switch (syncItem.type) {
                    case 'order':
                        await this.supabaseManager.createOrder(syncItem.data);
                        successfulSyncs.push(syncItem);
                        break;
                    case 'status_update':
                        await this.supabaseManager.updateOrderStatus(
                            syncItem.data.orderId,
                            syncItem.data.newStatus,
                            syncItem.data.note
                        );
                        successfulSyncs.push(syncItem);
                        break;
                    case 'product':
                        await this.supabaseManager.syncProducts([syncItem.data]);
                        successfulSyncs.push(syncItem);
                        break;
                }
            } catch (error) {
                console.error(`Erreur lors de la synchronisation de ${syncItem.type}:`, error);
            }
        }
        
        // Retirer les synchronisations réussies
        pendingSync = pendingSync.filter(item => 
            !successfulSyncs.some(success => 
                success.timestamp === item.timestamp && success.type === item.type
            )
        );
        
        localStorage.setItem('lamiti-pending-sync', JSON.stringify(pendingSync));
        
        if (successfulSyncs.length > 0) {
            console.log(`${successfulSyncs.length} éléments synchronisés avec succès`);
            this.showNotification('Données synchronisées avec le serveur', 'success');
        }
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

// Initialisation du shop
document.addEventListener('DOMContentLoaded', () => {
    window.shop = new LamitiShop();
    
    // Traiter les synchronisations en attente au démarrage
    setTimeout(() => {
        if (window.shop && window.shop.processPendingSync) {
            window.shop.processPendingSync();
        }
    }, 3000);
});