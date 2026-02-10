// Service Worker pour LAMITI SHOP
const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `lamiti-shop-${CACHE_VERSION}`;

// Fichiers à pré-cacher
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/products.html',
    '/cart.html',
    '/track-order.html',
    '/admin.html',
    '/config.js',
    '/main.js',
    '/admin.js',
    '/styles/main.css',
    '/resources/product-placeholder.jpg',
    '/resources/category-placeholder.jpg',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap'
];

// Stratégies de cache
const CACHE_STRATEGIES = {
    STATIC: 'static',
    IMAGES: 'images',
    API: 'api',
    FALLBACK: 'fallback'
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installation en cours...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Pré-cache des fichiers...');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Installation terminée');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Erreur d\'installation:', error);
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activation en cours...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation terminée');
                return self.clients.claim();
            })
    );
});

// Gestion des requêtes
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') return;
    
    // Ignorer les requêtes de développement
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return;
    }
    
    // Déterminer la stratégie de cache
    const strategy = determineCacheStrategy(url);
    
    // Appliquer la stratégie appropriée
    switch (strategy) {
        case CACHE_STRATEGIES.STATIC:
            event.respondWith(cacheFirstStrategy(event));
            break;
            
        case CACHE_STRATEGIES.IMAGES:
            event.respondWith(cacheFirstWithUpdateStrategy(event));
            break;
            
        case CACHE_STRATEGIES.API:
            event.respondWith(networkFirstStrategy(event));
            break;
            
        case CACHE_STRATEGIES.FALLBACK:
            event.respondWith(fallbackStrategy(event));
            break;
            
        default:
            event.respondWith(networkFirstStrategy(event));
    }
});

// Déterminer la stratégie de cache basée sur l'URL
function determineCacheStrategy(url) {
    // Fichiers statiques
    if (url.pathname.match(/\.(?:js|css|json)$/)) {
        return CACHE_STRATEGIES.STATIC;
    }
    
    // Images
    if (url.pathname.match(/\.(?:png|jpg|jpeg|webp|svg|gif)$/)) {
        return CACHE_STRATEGIES.IMAGES;
    }
    
    // API
    if (url.pathname.includes('/api/')) {
        return CACHE_STRATEGIES.API;
    }
    
    // Pages HTML
    if (url.pathname.match(/\.html$/) || url.pathname === '/') {
        return CACHE_STRATEGIES.STATIC;
    }
    
    return CACHE_STRATEGIES.FALLBACK;
}

// Stratégie: Cache First (pour les fichiers statiques)
function cacheFirstStrategy(event) {
    return caches.match(event.request)
        .then((cachedResponse) => {
            if (cachedResponse) {
                // Mettre à jour le cache en arrière-plan
                updateCacheInBackground(event.request);
                return cachedResponse;
            }
            
            // Récupérer du réseau
            return fetch(event.request)
                .then((networkResponse) => {
                    // Ne pas mettre en cache les réponses non-OK
                    if (!networkResponse.ok) {
                        return networkResponse;
                    }
                    
                    // Mettre en cache la réponse
                    return caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                })
                .catch(() => {
                    // Fallback à une page d'erreur
                    return caches.match('/offline.html');
                });
        });
}

// Stratégie: Cache First avec mise à jour (pour les images)
function cacheFirstWithUpdateStrategy(event) {
    return caches.match(event.request)
        .then((cachedResponse) => {
            // Toujours essayer de récupérer depuis le réseau
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse.ok) {
                        // Mettre à jour le cache
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, networkResponse.clone());
                            });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Ignorer les erreurs de réseau
                });
            
            // Retourner la réponse du cache si disponible
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Sinon attendre la réponse du réseau
            return fetchPromise;
        });
}

// Stratégie: Network First (pour les API)
function networkFirstStrategy(event) {
    return fetch(event.request)
        .then((networkResponse) => {
            // Mettre en cache la réponse
            if (networkResponse.ok) {
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
            }
            return networkResponse;
        })
        .catch(() => {
            // Fallback au cache
            return caches.match(event.request)
                .then((cachedResponse) => {
                    return cachedResponse || new Response('{"error": "Hors ligne"}', {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                });
        });
}

// Stratégie: Fallback (pour tout le reste)
function fallbackStrategy(event) {
    return fetch(event.request)
        .then((networkResponse) => {
            return networkResponse;
        })
        .catch(() => {
            // Fallback générique
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Hors ligne - LAMITI SHOP</title>
                    <style>
                        body { 
                            font-family: system-ui, sans-serif; 
                            text-align: center; 
                            padding: 50px; 
                            color: #333; 
                        }
                        h1 { color: #666; }
                    </style>
                </head>
                <body>
                    <h1>Vous êtes hors ligne</h1>
                    <p>Certaines fonctionnalités peuvent être limitées.</p>
                    <button onclick="window.location.reload()">Réessayer</button>
                </body>
                </html>
            `, {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        });
}

// Mettre à jour le cache en arrière-plan
function updateCacheInBackground(request) {
    // Utiliser requestIdleCallback si disponible
    if ('requestIdleCallback' in self) {
        requestIdleCallback(() => {
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, response);
                            });
                    }
                });
        });
    }
}

// Gérer les messages depuis la page
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME);
    }
    
    if (event.data && event.data.type === 'GET_CACHE_INFO') {
        caches.open(CACHE_NAME)
            .then((cache) => {
                cache.keys()
                    .then((requests) => {
                        event.ports[0].postMessage({
                            type: 'CACHE_INFO',
                            size: requests.length,
                            urls: requests.map(req => req.url)
                        });
                    });
            });
    }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCartData());
    }
    
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrdersData());
    }
});

async function syncCartData() {
    // Synchroniser le panier
    const cart = await getIndexedDBData('cart');
    if (cart && cart.length > 0) {
        // Envoyer au serveur
        await sendToServer('/api/sync/cart', cart);
    }
}

async function syncOrdersData() {
    // Synchroniser les commandes
    const orders = await getIndexedDBData('orders');
    if (orders && orders.length > 0) {
        // Envoyer au serveur
        await sendToServer('/api/sync/orders', orders);
    }
}

async function getIndexedDBData(storeName) {
    // Implémenter l'accès à IndexedDB
    return new Promise((resolve) => {
        const request = indexedDB.open('lamiti-shop', 1);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result);
            };
            
            getAllRequest.onerror = () => {
                resolve([]);
            };
        };
        
        request.onerror = () => {
            resolve([]);
        };
    });
}

async function sendToServer(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        return response.ok;
    } catch (error) {
        console.error('Erreur de synchronisation:', error);
        return false;
    }
}

// Gérer les notifications push
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nouvelle notification LAMITI SHOP',
        icon: '/resources/icon-192x192.png',
        badge: '/resources/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Voir la boutique',
                icon: '/resources/checkmark.png'
            },
            {
                action: 'close',
                title: 'Fermer',
                icon: '/resources/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('LAMITI SHOP', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    if (action === 'close') {
        notification.close();
    } else {
        // Ouvrir la boutique
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});