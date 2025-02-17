// sitemapAnalyzer.js

/**
 * Script d'analyse complète d'un site via son sitemap.xml
 * Permet d'analyser chaque page et de générer un rapport complet
 */

// Configuration des styles pour les logs console
const consoleStyles = {
    title: 'font-size: 20px; font-weight: bold; color: #007bff;',
    success: 'color: #28a745;',
    warning: 'color: #ffc107;',
    error: 'color: #dc3545;',
    info: 'color: #17a2b8;'
};

/**
 * Initialise et lance l'analyse complète du sitemap
 */
async function initSitemapAnalysis() {
    console.log('%c🔍 Démarrage de l\'analyse du site', consoleStyles.title);

    try {
        // 1. Récupération du sitemap.xml
        const sitemapURLs = await fetchSitemapURLs();
        console.log('📋 URLs trouvées:', sitemapURLs);
        console.log(`✨ Nombre d'URLs à analyser: ${sitemapURLs.length}`);

        // 2. Initialisation du stockage des résultats
        const analysisResults = {
            timestamp: new Date().toISOString(),
            urls: sitemapURLs,
            results: {},
            stats: {
                totalPages: sitemapURLs.length,
                analyzed: 0,
                failed: 0
            }
        };

        console.group('📊 Progression de l\'analyse');

        // 3. Analyse séquentielle de chaque URL
        for (const url of sitemapURLs) {
            try {
                console.log(`🔍 Analyse en cours: ${url} (${analysisResults.stats.analyzed + 1}/${sitemapURLs.length})`);
                const pageResult = await analyzeURL(url);

                if (pageResult.error) {
                    analysisResults.stats.failed++;
                    console.log(`❌ Échec de l'analyse pour ${url}`, pageResult.error_message);
                } else {
                    analysisResults.stats.analyzed++;
                    console.log(`✅ Analyse réussie pour ${url}`);
                }

                analysisResults.results[url] = pageResult;

                // Sauvegarde progressive des résultats
                await saveProgress(analysisResults);

            } catch (error) {
                console.error(`❌ Erreur lors de l'analyse de ${url}:`, error);
                analysisResults.stats.failed++;
                analysisResults.results[url] = {
                    error: true,
                    error_message: error.message,
                    error_timestamp: new Date().toISOString()
                };
            }
        }

        console.groupEnd();
        console.log('%c✨ Analyse terminée!', consoleStyles.success);
        return analysisResults;

    } catch (error) {
        console.error('%c❌ Erreur lors de l\'analyse du sitemap:', consoleStyles.error, error);
        throw error;
    }
}

/**
 * Récupère et parse le sitemap.xml pour extraire toutes les URLs
 * Gère différents formats de sitemap
 */
async function fetchSitemapURLs() {
    console.group('🌐 Récupération du sitemap.xml');
    try {
        // Récupération du sitemap
        console.log('📡 Tentative de récupération du sitemap...');
        const response = await fetch('https://www.ipno.me/sitemap.xml');
        const xmlText = await response.text();

        console.log('📝 Contenu du sitemap récupéré, début du parsing...');

        // Parse du XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Vérifie si le parsing a réussi
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Erreur de parsing XML: ' + parserError.textContent);
        }

        // Extraction des URLs en gérant différents formats de sitemap
        console.log('🔍 Recherche des URLs dans le sitemap...');

        // Tableau pour stocker toutes les URLs trouvées
        let urls = [];

        // Cherche les balises <loc> directes
        const locNodes = xmlDoc.getElementsByTagName('loc');
        if (locNodes.length > 0) {
            console.log(`📍 Trouvé ${locNodes.length} balises <loc> directes`);
        }

        // Cherche les balises <url> (format sitemap standard)
        const urlNodes = xmlDoc.getElementsByTagName('url');
        if (urlNodes.length > 0) {
            console.log(`📍 Trouvé ${urlNodes.length} balises <url>`);
        }

        // Combine les résultats des deux méthodes
        urls = [
            ...Array.from(locNodes),
            ...Array.from(urlNodes).map(url => url.getElementsByTagName('loc')[0])
        ]
            .filter(node => node) // Filtre les nodes null/undefined
            .map(node => {
                const url = node.textContent.trim();
                console.log(`🔗 URL trouvée: ${url}`);
                return url;
            })
            .filter(url => url && url.length > 0); // Filtre les URLs vides

        // Dédoublonnage des URLs
        urls = [...new Set(urls)];

        console.log(`✅ Extraction terminée. ${urls.length} URLs uniques trouvées`);
        console.groupEnd();

        return urls;

    } catch (error) {
        console.error('%c❌ Erreur lors de la récupération du sitemap:', consoleStyles.error, error);
        console.groupEnd();
        throw error;
    }
}

/**
 * Vérifie si une URL est valide
 * @param {string} url - L'URL à vérifier
 * @returns {boolean} - true si l'URL est valide
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        console.warn(`⚠️ URL invalide détectée: ${url}`);
        return false;
    }
}

/**
 * Nettoie une URL (supprime les espaces, etc.)
 * @param {string} url - L'URL à nettoyer
 * @returns {string} - L'URL nettoyée
 */
function cleanUrl(url) {
    return url.trim()
        .replace(/\s+/g, '') // Supprime les espaces
        .replace(/\/+$/, ''); // Supprime les slashes de fin
}

/**
 * Analyse une URL spécifique en injectant tous les scripts nécessaires
 * et en récupérant les résultats
 */
async function analyzeURL(url) {
    let tab = null;
    console.group(`🔍 Analyse détaillée de : ${cleanUrl(url)}`);

    try {
        // 1. Création d'un nouvel onglet pour l'analyse
        console.log('📑 Création d\'un nouvel onglet...');
        tab = await chrome.tabs.create({
            url: cleanUrl(url),
            active: false
        });

        // 2. Attente du chargement complet de la page
        console.log('⏳ Attente du chargement de la page...');
        await new Promise((resolve) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            });
        });

        // 3. Injection des dépendances
        console.log('📦 Injection des dépendances...');
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [
                "./assets/jquery-3.6.4.min.js",
                "./Functions/clear.js",
                "./assets/console.image.min.js",
                "./Functions/checkAndAddJquery.js",
                "./Functions/settingsOptions.js"
            ]
        });

        // Attente pour s'assurer que les dépendances sont chargées
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Dépendances chargées');

        // 4. Injection des scripts d'analyse
        console.log('🔧 Injection des scripts d\'analyse...');
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [
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
            ]
        });

        // 5. Attente pour l'exécution des analyses
        console.log('⏳ Attente de l\'exécution des analyses...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 6. Récupération des résultats (dataChecker)
        console.log('📊 Récupération des résultats...');
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const pageResults = {
                    ...window.dataChecker,
                    url_analyzed: window.location.href,
                    analysis_timestamp: new Date().toISOString()
                };
                console.log('DataChecker pour cette page:', pageResults);
                return pageResults;
            }
        });

        // 7. Vérification des résultats
        if (!results || !results[0] || !results[0].result) {
            throw new Error('Analyse incomplète ou invalide');
        }

        const pageAnalysis = results[0].result;
        console.log('✅ Analyse terminée avec succès');
        console.log('📊 Résultats:', pageAnalysis);

        // 8. Fermeture de l'onglet
        if (tab) {
            await chrome.tabs.remove(tab.id);
            console.log('🚫 Onglet fermé');
        }

        console.groupEnd();
        return pageAnalysis;

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error);

        // S'assurer que l'onglet est fermé en cas d'erreur
        if (tab) {
            try {
                await chrome.tabs.remove(tab.id);
                console.log('🚫 Onglet fermé après erreur');
            } catch (e) {
                console.error('Erreur lors de la fermeture de l\'onglet:', e);
            }
        }

        console.groupEnd();
        return {
            url_analyzed: url,
            error: true,
            error_message: error.message,
            error_timestamp: new Date().toISOString()
        };
    }
}

/**
 * Sauvegarde la progression de l'analyse
 * @param {Object} results - Les résultats à sauvegarder
 */
async function saveProgress(results) {
    console.group('💾 Sauvegarde de la progression');
    try {
        // Log détaillé de la sauvegarde
        console.log('État actuel de l\'analyse:', {
            totalPages: results.stats.totalPages,
            analyzed: results.stats.analyzed,
            failed: results.stats.failed,
            remainingPages: results.stats.totalPages - results.stats.analyzed
        });

        // Sauvegarde dans le storage local de Chrome
        await chrome.storage.local.set({ 'sitemapAnalysis': results });
        console.log('✅ Sauvegarde réussie');

        // Mise à jour de l'interface utilisateur
        updateProgressUI(results.stats.analyzed, results.stats.totalPages);

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
    console.groupEnd();
}

/**
 * Met à jour l'interface utilisateur avec la progression
 * @param {number} analyzed - Nombre de pages analysées
 * @param {number} total - Nombre total de pages
 */
function updateProgressUI(analyzed, total) {
    const progressElement = document.getElementById('analysisProgress');
    if (progressElement) {
        const percentage = Math.round((analyzed / total) * 100);
        console.log(`📊 Progression: ${percentage}%`);

        progressElement.innerHTML = `
            <div class="progress-info">
                <span>Analyse en cours: ${analyzed}/${total} pages (${percentage}%)</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    }
}

/**
 * Vérifie la validité des résultats d'analyse
 * @param {Object} results - Les résultats à vérifier
 * @returns {boolean} - true si les résultats sont valides
 */
function validateResults(results) {
    console.group('🔍 Validation des résultats');

    try {
        // Vérifications de base
        if (!results || typeof results !== 'object') {
            console.error('❌ Résultats invalides: format incorrect');
            return false;
        }

        // Vérification des propriétés requises
        const requiredProps = ['meta_check', 'link_check', 'alt_img_check', 'hn', 'bold_check'];
        const missingProps = requiredProps.filter(prop => !(prop in results));

        if (missingProps.length > 0) {
            console.warn('⚠️ Propriétés manquantes:', missingProps);
            return false;
        }

        console.log('✅ Validation réussie');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la validation:', error);
        return false;
    } finally {
        console.groupEnd();
    }
}

/**
 * Nettoie et formate les résultats pour l'export
 * @param {Object} results - Les résultats à formater
 * @returns {Object} - Les résultats formatés
 */
function formatResults(results) {
    console.group('🔧 Formatage des résultats');

    try {
        const formatted = {
            ...results,
            timestamp: new Date().toISOString(),
            formatted_date: new Date().toLocaleDateString(),
            stats: {
                ...results.stats,
                success_rate: `${Math.round((results.stats.analyzed / results.stats.totalPages) * 100)}%`
            }
        };

        console.log('✅ Formatage réussi');
        return formatted;
    } catch (error) {
        console.error('❌ Erreur lors du formatage:', error);
        return results;
    } finally {
        console.groupEnd();
    }
}

// Export des fonctions nécessaires
export {
    initSitemapAnalysis,
    updateProgressUI,
    formatResults,
    validateResults
};

// Constantes et configurations
const CONFIG = {
    TIMEOUT: 30000, // 30 secondes timeout pour les analyses
    DELAY_BETWEEN_PAGES: 1000, // 1 seconde entre chaque analyse
    MAX_RETRIES: 3, // Nombre maximum de tentatives par page
    DEBUG_MODE: true // Active les logs détaillés
};

// Écouteur d'événements pour le debug mode
if (CONFIG.DEBUG_MODE) {
    console.log('%c🔍 Mode debug activé pour l\'analyseur de sitemap', consoleStyles.title);
    window.addEventListener('error', (event) => {
        console.error('🐛 Erreur détectée:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    });
}