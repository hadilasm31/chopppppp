// Configuration du site LAMITI SHOP
const CONFIG = {
    // Informations du site
    siteName: 'LAMITI SHOP',
    siteDescription: 'Boutique de mode et accessoires de qualité',
    siteUrl: 'https://lamiti-shop.com',
    
    // Informations de contact
    contact: {
        email: 'hadilasmakadji31@gmail.com',
        phone: '+241 77 95 03 88',
        address: 'Libreville, Gabon',
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        }
    },
    
    // Configuration de la boutique
    shop: {
        currency: 'XAF',
        currencySymbol: 'FCFA',
        taxRate: 0.18, // 18% de TVA
        shippingFee: 0, // Livraison gratuite
        freeShippingThreshold: 50000, // Livraison gratuite au-delà de 50 000 FCFA
        
        // Paramètres de paiement
        paymentMethods: [
            {
                id: 'card',
                name: 'Carte bancaire',
                icon: '💳',
                description: 'Paiement sécurisé par carte bancaire'
            },
            {
                id: 'mobile',
                name: 'Paiement mobile',
                icon: '📱',
                description: 'Paiement par Orange Money, MTN Money'
            }
        ],
        
        // Paramètres de livraison
        delivery: {
            standardDays: 3,
            expressDays: 1,
            expressFee: 5000
        }
    },
    
    // Configuration de l'admin
    admin: {
        username: 'admin',
        password: 'lamiti2024',
        sessionTimeout: 3600000 // 1 heure en millisecondes
    },
    
    // Configuration des notifications
    notifications: {
        enabled: true,
        duration: 3000,
        position: 'top-right',
        sound: {
            enabled: true,
            volume: 1.0,
            loop: true
        }
    },
    
    // Configuration des animations
    animations: {
        duration: 300,
        easing: 'ease-out'
    },
    
    // Configuration des images
    images: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        placeholder: 'resources/product-placeholder.jpg'
    },
    
    // Configuration du cache
    cache: {
        products: 5 * 60 * 1000, // 5 minutes
        orders: 1 * 60 * 1000, // 1 minute
        stats: 30 * 1000 // 30 secondes
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
// Configuration Supabase
CONFIG.supabase = {
    url: 'https://lqeulbulihjoaolsizrl.supabase.co',
    anonKey: 'sb_publishable_AyTm3RqnYVpwGzZhLri97g_0X2WEoQL',
    adminKey: 'votre_clé_secrète_admin_ici' // À récupérer dans Supabase Dashboard
};

// Make CONFIG available globally
window.CONFIG = CONFIG;