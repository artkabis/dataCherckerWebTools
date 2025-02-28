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
 * Classe principale pour l'analyse de sitemap
 * Gère la file d'attente et l'état de l'analyse
 */
class SitemapAnalyzer {
    constructor(options = {}) {
        // Configuration 
        this.config = {
            batchSize: options.batchSize || 3, // Nombre d'URLs à traiter en parallèle
            pauseBetweenBatches: options.pauseBetweenBatches || 500, // Pause entre les lots en ms
            tabTimeout: options.tabTimeout || 30000, // Timeout pour l'analyse d'une page
            maxRetries: options.maxRetries || 2, // Nombre de tentatives en cas d'échec
            ...options
        };

        // État interne
        this.queue = [];
        this.results = {
            timestamp: new Date().toISOString(),
            urls: [],
            results: {},
            stats: {
                totalPages: 0,
                analyzed: 0,
                failed: 0,
                skipped: 0
            }
        };
        this.isProcessing = false;
        this.isPaused = false;
        this.isCancelled = false;

        // Callback d'événements
        this.eventListeners = {
            progress: [],
            complete: [],
            error: [],
            pause: [],
            resume: [],
            cancel: []
        };
    }

    /**
     * Démarre l'analyse en récupérant les URLs du sitemap
     * @param {string} sitemapUrl - URL du sitemap à analyser
     */
    async start(sitemapUrl) {
        try {
            console.log('%c🔍 Démarrage de l\'analyse du site', consoleStyles.title);

            // Validation de l'URL
            if (!sitemapUrl) {
                throw new Error('URL du sitemap.xml non fournie');
            }

            try {
                new URL(sitemapUrl);
            } catch (e) {
                throw new Error('URL invalide');
            }

            // Récupération des URLs
            const urls = await this.fetchSitemapURLs(sitemapUrl);
            console.log('📋 URLs trouvées:', urls);
            console.log(`✨ Nombre d'URLs à analyser: ${urls.length}`);

            // Initialisation des résultats
            this.results.urls = urls;
            this.results.stats.totalPages = urls.length;

            // Ajout des URLs à la file d'attente
            this.addToQueue(urls);

            // Retourne une promesse qui sera résolue lorsque l'analyse sera terminée
            return new Promise((resolve, reject) => {
                this.on('complete', () => resolve(this.results));
                this.on('error', (error) => reject(error));
            });

        } catch (error) {
            console.error('%c❌ Erreur lors du démarrage de l\'analyse:', consoleStyles.error, error);
            this.trigger('error', error);
            throw error;
        }
    }

    /**
     * Démarre l'analyse avec une liste d'URLs fournie directement
     * @param {Array<string>} urls - Liste d'URLs à analyser
     */
    async startWithUrlList(urls) {
        try {
            console.log('%c🔍 Démarrage de l\'analyse avec une liste personnalisée', consoleStyles.title);

            // Validation
            if (!urls || !Array.isArray(urls) || urls.length === 0) {
                throw new Error('Liste d\'URLs non valide');
            }

            console.log('📋 URLs à analyser:', urls);
            console.log(`✨ Nombre d'URLs à analyser: ${urls.length}`);

            // Initialisation des résultats
            this.results.urls = urls;
            this.results.stats.totalPages = urls.length;

            // Ajout des URLs à la file d'attente
            this.addToQueue(urls);

            // Retourne une promesse qui sera résolue lorsque l'analyse sera terminée
            return new Promise((resolve, reject) => {
                this.on('complete', () => resolve(this.results));
                this.on('error', (error) => reject(error));
            });

        } catch (error) {
            console.error('%c❌ Erreur lors du démarrage de l\'analyse:', consoleStyles.error, error);
            this.trigger('error', error);
            throw error;
        }
    }

    /**
     * Récupère et parse le sitemap.xml pour extraire toutes les URLs
     * Version compatible avec le service worker (sans DOMParser)
     */
    async fetchSitemapURLs(sitemapUrl) {
        console.group('🌐 Récupération du sitemap.xml');
        try {
            // Récupération du sitemap
            console.log('📡 Tentative de récupération du sitemap...');
            const response = await fetch(sitemapUrl);
            const xmlText = await response.text();

            console.log('📝 Contenu du sitemap récupéré, début du parsing...');

            // Utilisation de regex au lieu de DOMParser
            const urls = [];

            // Recherche de balises <loc> dans le XML (méthode compatible service worker)
            const locRegex = /<loc>(.*?)<\/loc>/g;
            let match;

            while ((match = locRegex.exec(xmlText)) !== null) {
                const url = match[1].trim();
                console.log(`🔗 URL trouvée: ${url}`);
                urls.push(url);
            }

            // Dédoublonnage des URLs
            const uniqueUrls = [...new Set(urls)];

            console.log(`✅ Extraction terminée. ${uniqueUrls.length} URLs uniques trouvées`);
            console.groupEnd();

            return uniqueUrls;

        } catch (error) {
            console.error('%c❌ Erreur lors de la récupération du sitemap:', consoleStyles.error, error);
            console.groupEnd();
            throw error;
        }
    }

    /**
     * Ajoute des URLs à la file d'attente et démarre le traitement si nécessaire
     * @param {Array<string>} urls - Liste d'URLs à analyser
     */
    addToQueue(urls) {
        // Ajoute les URLs à la file d'attente
        this.queue.push(...urls);
        console.log(`📥 ${urls.length} URLs ajoutées à la file d'attente. Total: ${this.queue.length}`);

        // Démarre le traitement si ce n'est pas déjà en cours
        if (!this.isProcessing && !this.isPaused && !this.isCancelled) {
            this.processQueue();
        }
    }

    /**
     * Traite la file d'attente par lots
     */
    async processQueue() {
        if (this.isProcessing || this.isPaused || this.isCancelled || this.queue.length === 0) {
            if (this.queue.length === 0 && !this.isPaused && !this.isCancelled) {
                console.log('%c✨ Analyse terminée!', consoleStyles.success);
                this.trigger('complete', this.results);
            }
            return;
        }

        // Marque le traitement comme en cours
        this.isProcessing = true;
        console.group('📊 Traitement par lots');

        try {
            // Prélève un lot d'URLs de la file d'attente
            const batch = this.queue.splice(0, this.config.batchSize);
            console.log(`🔄 Traitement d'un lot de ${batch.length} URLs. Restant: ${this.queue.length}`);

            // Analyse chaque URL du lot en parallèle
            const batchPromises = batch.map(url => this.analyzeURLWithRetry(url));
            await Promise.all(batchPromises);

            // Sauvegarde progressive des résultats
            await this.saveProgress();

            // Pause entre les lots pour permettre au navigateur de respirer
            await new Promise(resolve => setTimeout(resolve, this.config.pauseBetweenBatches));

            // Continue le traitement
            this.isProcessing = false;
            this.processQueue();

        } catch (error) {
            console.error('❌ Erreur lors du traitement de la file d\'attente:', error);
            this.isProcessing = false;
            this.trigger('error', error);
        }

        console.groupEnd();
    }

    /**
     * Renvoie la progression actuelle de l'analyse
     * @returns {Object} Objet contenant les informations de progression
     */
    getProgress() {
        const total = this.results.stats.totalPages;
        const analyzed = this.results.stats.analyzed;
        const failed = this.results.stats.failed;
        const skipped = this.results.stats.skipped || 0;

        return {
            analyzed,
            failed,
            skipped,
            total,
            percentage: total > 0 ? Math.round(((analyzed + failed) / total) * 100) : 0
        };
    }

    /**
     * Analyse une URL avec système de réessai en cas d'échec
     * @param {string} url - URL à analyser
     * @returns {Object} - Résultat de l'analyse
     */
    async analyzeURLWithRetry(url) {
        let attempts = 0;
        let lastError = null;

        // Essaie d'analyser l'URL plusieurs fois en cas d'échec
        while (attempts < this.config.maxRetries) {
            attempts++;
            try {
                console.log(`🔍 Analyse de ${url} (tentative ${attempts}/${this.config.maxRetries})`);
                const result = await this.analyzeURL(url);
                this.results.results[url] = result;

                if (result.error) {
                    this.results.stats.failed++;
                    console.log(`❌ Échec de l'analyse pour ${url}`, result.error_message);
                } else {
                    this.results.stats.analyzed++;
                    console.log(`✅ Analyse réussie pour ${url}`);
                }

                // Mise à jour de la progression
                this.trigger('progress', this.getProgress());

                return result;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Erreur lors de l'analyse de ${url} (tentative ${attempts}/${this.config.maxRetries}):`, error);

                // Attendre un peu avant de réessayer
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Si c'est la dernière tentative, enregistrer l'erreur
                if (attempts >= this.config.maxRetries) {
                    this.results.stats.failed++;
                    this.results.results[url] = {
                        url_analyzed: url,
                        error: true,
                        error_message: error.message,
                        error_timestamp: new Date().toISOString()
                    };

                    // Mise à jour de la progression
                    this.trigger('progress', this.getProgress());
                }
            }
        }

        throw lastError;
    }
    /**
     * Analyse une URL spécifique en injectant tous les scripts nécessaires
     * et en récupérant les résultats
     */
    async analyzeURL(url) {
        let tab = null;
        console.group(`🔍 Analyse détaillée de : ${this.cleanUrl(url)}`);

        try {
            // 1. Création d'un nouvel onglet pour l'analyse
            console.log('📑 Création d\'un nouvel onglet...');
            tab = await chrome.tabs.create({
                url: this.cleanUrl(url),
                active: false
            });

            // 2. Attente du chargement complet de la page
            console.log('⏳ Attente du chargement de la page...');
            await Promise.race([
                new Promise((resolve) => {
                    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                        if (tabId === tab.id && info.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    });
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout pendant le chargement de la page')),
                        this.config.tabTimeout)
                )
            ]);

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

            // 6. Récupération des résultats (dataChecker) avec attention particulière aux liens
            console.log('📊 Récupération des résultats...');
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // Vérifier que dataChecker est accessible
                    if (!window.dataChecker) {
                        console.error("dataChecker n'est pas défini dans la page");
                        return { error: true, message: "Données d'analyse non disponibles" };
                    }

                    // S'assurer que les liens sont correctement récupérés
                    if (window.dataChecker.link_check) {
                        console.log(`Nombre de liens détectés: ${window.dataChecker.link_check.link?.length || 0}`);
                    }

                    // Analyser les liens pour déterminer leur contexte
                    if (window.dataChecker.link_check && Array.isArray(window.dataChecker.link_check.link)) {
                        window.dataChecker.link_check.link.forEach(link => {
                            if (!link.link_type) {
                                // Trouver le nœud DOM correspondant au lien
                                const links = document.querySelectorAll('a[href]');
                                let linkNode = null;

                                for (const node of links) {
                                    if (node.href === link.link_url ||
                                        node.getAttribute('href') === link.link_url) {
                                        linkNode = node;
                                        break;
                                    }
                                }

                                if (linkNode) {
                                    // Déterminer le contexte du lien
                                    link.link_type = {
                                        isMenuLink: !!linkNode.closest('nav') ||
                                            !!linkNode.closest('header') ||
                                            !!linkNode.closest('menu'),
                                        isContentLink: !!linkNode.closest('#Content') ||
                                            !!linkNode.closest('#dm_content') ||
                                            !!linkNode.closest('main') ||
                                            !!linkNode.closest('article'),
                                        isFooterLink: !!linkNode.closest('footer'),
                                        isImageLink: !!linkNode.querySelector('img') ||
                                            (linkNode.style.backgroundImage &&
                                                linkNode.style.backgroundImage !== 'none'),
                                        isCTA: linkNode.classList.contains('button') ||
                                            linkNode.classList.contains('btn') ||
                                            linkNode.classList.contains('cta')
                                    };
                                }
                            }
                        });
                    }

                    // Créer une copie profonde des données pour éviter les problèmes de référence
                    const pageResults = JSON.parse(JSON.stringify({
                        ...window.dataChecker,
                        url_analyzed: window.location.href,
                        analysis_timestamp: new Date().toISOString()
                    }));

                    return pageResults;
                }
            });

            // 7. Vérification des résultats
            if (!results || !results[0] || !results[0].result) {
                throw new Error('Analyse incomplète ou invalide');
            }

            const pageAnalysis = results[0].result;

            // Vérification supplémentaire pour les liens
            if (!pageAnalysis.link_check || !Array.isArray(pageAnalysis.link_check.link)) {
                console.warn(`⚠️ Aucun lien détecté ou structure de liens incorrecte pour ${url}`);
                // Initialiser une structure vide pour éviter les erreurs
                pageAnalysis.link_check = pageAnalysis.link_check || {
                    link_check_state: false,
                    nb_link: 0,
                    check_title: "Links validities",
                    global_score: 0,
                    profil: ["CDP", "WEBDESIGNER"],
                    link: []
                };
            } else {
                console.log(`✅ ${pageAnalysis.link_check.link.length} liens récupérés pour ${url}`);

                // Filtrer les liens pour ne garder que ceux qui sont pertinents
                const totalLinks = pageAnalysis.link_check.link.length;
                const originalNbLink = pageAnalysis.link_check.nb_link || totalLinks;

                // Filtrer pour prioritiser les liens de contenu et exclure les liens de menu
                const filteredLinks = pageAnalysis.link_check.link.filter(link => {
                    if (!link.link_type) return true;

                    // Garder les liens qui ne sont pas uniquement des liens de menu
                    // (par exemple, garder un lien qui est à la fois menu et CTA)
                    if (link.link_type.permalien) return true;
                    if (link.link_type.isImageLink && !link.link_type.isMenuLink) return true;
                    if (link.link_type.isCTA && !link.link_type.isMenuLink) return true;
                    if (link.link_type.isExternalLink) return true;

                    // Exclure les liens qui sont uniquement des liens de menu
                    return !link.link_type.isMenuLink;
                });
                console.log('::::::::::::::::::: liens filtrés :::: ', filteredLinks);
                // Mettre à jour le tableau des liens mais conserver le nombre total
                pageAnalysis.link_check.link = filteredLinks;
                pageAnalysis.link_check.nb_link = originalNbLink;

                console.log(`📊 Filtrage des liens: ${filteredLinks.length}/${totalLinks} liens conservés`);
            }

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
            throw error;
        }
    }

    /**
     * Sauvegarde la progression de l'analyse
     */
    async saveProgress() {
        console.group('💾 Sauvegarde de la progression');
        try {
            // Log détaillé de la sauvegarde
            console.log('État actuel de l\'analyse:', {
                totalPages: this.results.stats.totalPages,
                analyzed: this.results.stats.analyzed,
                failed: this.results.stats.failed,
                remainingPages: this.results.stats.totalPages - this.results.stats.analyzed - this.results.stats.failed
            });

            // Sauvegarde dans le storage local de Chrome
            await chrome.storage.local.set({ 'sitemapAnalysis': this.results });
            console.log('✅ Sauvegarde réussie');

        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
        console.groupEnd();
    }

    /**
     * Nettoie une URL (supprime les espaces, etc.)
     * @param {string} url - L'URL à nettoyer
     * @returns {string} - L'URL nettoyée
     */
    cleanUrl(url) {
        return url.trim()
            .replace(/\s+/g, '') // Supprime les espaces
            .replace(/\/+$/, ''); // Supprime les slashes de fin
    }

    /**
     * Met en pause l'analyse
     */
    pause() {
        if (!this.isPaused) {
            this.isPaused = true;
            console.log('⏸️ Analyse mise en pause');
            this.trigger('pause');
        }
    }

    /**
     * Reprend l'analyse
     */
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            console.log('▶️ Reprise de l\'analyse');
            this.trigger('resume');
            this.processQueue();
        }
    }

    /**
     * Annule l'analyse en cours
     */
    cancel() {
        this.isCancelled = true;
        this.queue = []; // Vide la file d'attente
        console.log('🛑 Analyse annulée');
        this.trigger('cancel');
    }

    /**
     * Ajoute un écouteur d'événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à appeler
     */
    on(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }

    /**
     * Déclenche un événement
     * @param {string} event - Nom de l'événement
     * @param {*} data - Données à passer aux écouteurs
     */
    trigger(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
}

/**
 * Fonction d'initialisation pour le démarrage direct
 */
async function initSitemapAnalysis() {
    console.log('%c🔍 Démarrage de l\'analyse du site', consoleStyles.title);
    // Demande de l'URL via prompt
    const sitemapUrl = prompt("Veuillez entrer l'URL complète du sitemap.xml", "https://example.com/sitemap.xml");
    // Vérification si l'utilisateur a annulé ou n'a pas entré d'URL
    if (!sitemapUrl) {
        throw new Error('URL du sitemap.xml non fournie');
    }
    // Validation basique de l'URL
    try {
        new URL(sitemapUrl);
    } catch (e) {
        throw new Error('URL invalide');
    }

    try {
        // Création de l'analyseur avec options
        const analyzer = new SitemapAnalyzer({
            batchSize: 3,                   // Nombre d'URLs à analyser en parallèle
            pauseBetweenBatches: 500,       // Pause entre les lots (ms)
            tabTimeout: 30000,              // Timeout pour l'analyse d'une page (ms)
            maxRetries: 2                   // Nombre de tentatives en cas d'échec
        });

        // Écouteurs d'événements pour la mise à jour de l'interface
        analyzer.on('progress', (progress) => {
            updateProgressUI(progress.analyzed, progress.total);
            console.log(`Progression: ${progress.percentage}%`);
        });

        // Démarrage de l'analyse
        const results = await analyzer.start(sitemapUrl);

        // Traitement des résultats
        await chrome.storage.local.set({ 'sitemapAnalysis': results });

        // Affichage des résultats
        await chrome.tabs.create({
            url: chrome.runtime.getURL('results.html')
        });

        return results;

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error);
        throw error;
    }
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
    SitemapAnalyzer,
    initSitemapAnalysis,
    updateProgressUI,
    formatResults,
    validateResults,
    consoleStyles
};