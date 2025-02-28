/**
 * Configuration centralisée pour l'extension Website Health Checker
 * Permet de facilement modifier les comportements et paramètres de l'extension
 */

export const CONFIG = {
    // Version de l'extension (auto-détectée depuis manifest)
    version: null, // sera rempli automatiquement

    // Configuration des analyses
    analysis: {
        // Délai entre les injections de scripts (ms)
        scriptInjectionDelay: 50,

        // Timeout pour l'analyse d'une page (ms)
        analysisTimeout: 30000,

        // Nombre de pages à analyser simultanément pour les analyses multiples
        batchSize: 3,

        // Délai entre les analyses par lots (ms)
        batchDelay: 500,

        // Nombre maximal de tentatives en cas d'échec
        maxRetries: 2,

        // Taille maximale acceptée pour les images (en octets)
        maxImageSize: 317435, // ~310KB

        // Ratio maximum d'image acceptable
        maxImageRatio: 3,

        // Caractères minimum et maximum pour les méta-tags
        meta: {
            title: {
                min: 50,
                max: 65
            },
            description: {
                min: 140,
                max: 156
            }
        },

        // Configuration des balises Hn
        hn: {
            minLength: 50,
            maxLength: 90
        },

        // Configuration des textes en gras
        bold: {
            min: 3,
            max: 5
        }
    },

    // Scripts à injecter dans les pages pour l'analyse
    scripts: {
        // Scripts de dépendances (base nécessaire pour le fonctionnement)
        dependencies: [
            "./assets/jquery-3.6.4.min.js",
            "./Functions/clear.js",
            "./assets/console.image.min.js",
            "./Functions/checkAndAddJquery.js",
            "./Functions/settingsOptions.js"
        ],

        // Scripts d'analyse (exécutés après les dépendances)
        analysis: [
            "./Functions/settingsWords.js",
            "./Functions/dataCheckerSchema.js",
            "./Functions/initLighthouse.js",
            "./Functions/counterWords.js",
            "./Functions/checkAltImages.js",
            "./Functions/checkMetas.js",
            "./Functions/checkLogoHeader.js",
            "./Functions/checkOldRGPD.js",
            "./Functions/checkBold.js",
            "./Functions/checkOutlineHn.js",
            "./Functions/checkColorContrast.js",
            "./Functions/counterLettersHn.js",
            "./Functions/initDataChecker.js",
            "./Functions/checkDataBindingDuda.js",
            "./Functions/checkLinkAndImages.js"
        ],

        // Scripts pour l'analyse des mots
        wordAnalysis: [
            "./assets/jquery-3.6.4.min.js",
            "./Functions/settingsWords.js",
            "./Functions/counterWords.js",
            "./Functions/wordsCountLexical.js"
        ]
    },

    // Configuration des notifications
    notifications: {
        // Durée d'affichage des notifications (ms)
        duration: 3000,

        // Types de notifications
        types: {
            info: {
                icon: "💬",
                className: "toast-info"
            },
            success: {
                icon: "✅",
                className: "toast-success"
            },
            warning: {
                icon: "⚠️",
                className: "toast-warning"
            },
            error: {
                icon: "❌",
                className: "toast-error"
            }
        }
    },

    // Configuration du stockage
    storage: {
        // Préfixes pour les clés de stockage
        keyPrefix: "whc_",

        // Clés utilisées dans le stockage
        keys: {
            corsEnabled: "corsEnabled",
            user: "user",
            sitemapAnalysis: "sitemapAnalysis",
            popupWindowId: "popupWindowId",
            settings: "checkerToolsSettings"
        }
    }
};

// Initialisation dynamique de certaines valeurs de configuration
export const initConfig = async () => {
    try {
        // Récupération de la version depuis le manifest
        const manifest = await chrome.runtime.getManifest();
        CONFIG.version = manifest.version;

        // Ici vous pouvez ajouter d'autres initialisations dynamiques

        return CONFIG;
    } catch (error) {
        console.error("Erreur lors de l'initialisation de la configuration:", error);
        return CONFIG;
    }
};

// Fonction utilitaire pour récupérer une valeur particulière de la config
export const getConfig = (path) => {
    const parts = path.split('.');
    let current = CONFIG;

    for (const part of parts) {
        if (current[part] === undefined) {
            console.warn(`Configuration path "${path}" not found`);
            return undefined;
        }
        current = current[part];
    }

    return current;
};