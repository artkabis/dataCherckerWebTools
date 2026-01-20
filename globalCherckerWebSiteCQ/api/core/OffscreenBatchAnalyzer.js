/**
 * Offscreen Batch Analyzer - Coordinateur intelligent pour analyse multi-pages
 * Utilise Offscreen Document API pour pages statiques et Tabs pour pages dynamiques
 * @version 5.0
 */

import { PageTypeDetector } from '../utils/PageTypeDetector.js';

export class OffscreenBatchAnalyzer {
    constructor(options = {}) {
        this.config = {
            autoDetect: true,
            preferOffscreen: true,
            maxConcurrentOffscreen: 5,
            maxConcurrentTabs: 3,
            timeout: 30000,
            retryAttempts: 2,
            ...options
        };

        this.state = {
            isAnalyzing: false,
            offscreenDocumentCreated: false,
            currentAnalysis: null,
            results: [],
            errors: []
        };

        this.eventListeners = {
            progress: [],
            complete: [],
            error: [],
            methodSelected: []
        };
    }

    /**
     * Analyse un batch d'URLs avec détection automatique de méthode
     * @param {Array<string>} urls - URLs à analyser
     * @param {Object} options - Options d'analyse
     * @returns {Promise<Object>} Résultats agrégés
     */
    async analyzeBatch(urls, options = {}) {
        if (this.state.isAnalyzing) {
            throw new Error('Une analyse est déjà en cours');
        }

        this.state.isAnalyzing = true;
        this.state.currentAnalysis = {
            urls,
            startTime: Date.now(),
            totalUrls: urls.length,
            processedUrls: 0
        };

        const mergedConfig = { ...this.config, ...options };

        try {
            console.log(`[OffscreenBatchAnalyzer] Starting batch analysis: ${urls.length} URLs`);

            // 1. Détecter le type de chaque page
            const detection = await this.#detectPageTypes(urls, mergedConfig);

            console.log(`[OffscreenBatchAnalyzer] Detection complete:`, {
                offscreen: detection.offscreen.length,
                tab: detection.tab.length,
                percentage: detection.stats.offscreenPercentage + '%'
            });

            // Émettre event de sélection de méthode
            this.#emit('methodSelected', detection);

            // 2. Analyser les URLs avec les méthodes appropriées
            const results = await this.#analyzeWithMethods(detection, mergedConfig);

            // 3. Agréger et retourner les résultats
            const aggregated = this.#aggregateResults(results);

            console.log(`[OffscreenBatchAnalyzer] Batch complete:`, {
                success: aggregated.success.length,
                errors: aggregated.errors.length,
                duration: Date.now() - this.state.currentAnalysis.startTime
            });

            this.#emit('complete', aggregated);

            return aggregated;

        } catch (error) {
            console.error('[OffscreenBatchAnalyzer] Batch analysis failed:', error);
            this.#emit('error', error);
            throw error;

        } finally {
            this.state.isAnalyzing = false;
            this.state.currentAnalysis = null;

            // Cleanup offscreen document
            if (this.state.offscreenDocumentCreated) {
                await this.#closeOffscreenDocument();
            }
        }
    }

    /**
     * Analyse depuis un sitemap avec détection automatique
     */
    async analyzeFromSitemap(sitemapUrl, options = {}) {
        console.log(`[OffscreenBatchAnalyzer] Fetching sitemap: ${sitemapUrl}`);

        try {
            const urls = await this.#fetchSitemapUrls(sitemapUrl);
            console.log(`[OffscreenBatchAnalyzer] Sitemap parsed: ${urls.length} URLs found`);

            return await this.analyzeBatch(urls, options);

        } catch (error) {
            console.error('[OffscreenBatchAnalyzer] Sitemap analysis failed:', error);
            throw error;
        }
    }

    /**
     * Enregistrer un écouteur d'événements
     */
    on(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }

    /**
     * Arrêter l'analyse en cours
     */
    async cancel() {
        if (!this.state.isAnalyzing) {
            return;
        }

        console.log('[OffscreenBatchAnalyzer] Cancelling analysis...');

        this.state.isAnalyzing = false;

        // Annuler l'analyse offscreen si active
        if (this.state.offscreenDocumentCreated) {
            try {
                await chrome.runtime.sendMessage({
                    action: 'cancelAnalysis',
                    target: 'offscreen'
                });
            } catch (error) {
                console.warn('[OffscreenBatchAnalyzer] Cancel message failed:', error);
            }
        }

        // Cleanup
        await this.#closeOffscreenDocument();
    }

    // === MÉTHODES PRIVÉES ===

    /**
     * Détecter le type de chaque page
     */
    async #detectPageTypes(urls, config) {
        if (!config.autoDetect) {
            // Mode manuel : tout en offscreen ou tout en tabs
            return {
                offscreen: config.preferOffscreen ? urls : [],
                tab: config.preferOffscreen ? [] : urls,
                detections: urls.map(url => ({
                    url,
                    method: config.preferOffscreen ? 'offscreen' : 'tab',
                    manual: true
                })),
                stats: {
                    total: urls.length,
                    offscreen: config.preferOffscreen ? urls.length : 0,
                    tab: config.preferOffscreen ? 0 : urls.length,
                    offscreenPercentage: config.preferOffscreen ? 100 : 0
                }
            };
        }

        // Détection automatique
        return await PageTypeDetector.detectBatch(urls, {
            parallelDetections: 5,
            checkContent: true,
            timeout: 5000
        });
    }

    /**
     * Analyser avec les méthodes appropriées
     */
    async #analyzeWithMethods(detection, config) {
        const results = {
            offscreen: [],
            tab: [],
            errors: []
        };

        // 1. Analyser les URLs offscreen
        if (detection.offscreen.length > 0) {
            console.log(`[OffscreenBatchAnalyzer] Analyzing ${detection.offscreen.length} URLs with offscreen`);

            try {
                const offscreenResults = await this.#analyzeWithOffscreen(
                    detection.offscreen,
                    config
                );
                results.offscreen = offscreenResults.results || [];
                results.errors.push(...(offscreenResults.errors || []));

            } catch (error) {
                console.error('[OffscreenBatchAnalyzer] Offscreen analysis failed:', error);
                results.errors.push({
                    method: 'offscreen',
                    error: error.message,
                    urls: detection.offscreen
                });
            }
        }

        // 2. Analyser les URLs tabs (fallback sur l'ancien système)
        if (detection.tab.length > 0) {
            console.log(`[OffscreenBatchAnalyzer] Analyzing ${detection.tab.length} URLs with tabs`);

            try {
                const tabResults = await this.#analyzeWithTabs(
                    detection.tab,
                    config
                );
                results.tab = tabResults.results || [];
                results.errors.push(...(tabResults.errors || []));

            } catch (error) {
                console.error('[OffscreenBatchAnalyzer] Tab analysis failed:', error);
                results.errors.push({
                    method: 'tab',
                    error: error.message,
                    urls: detection.tab
                });
            }
        }

        return results;
    }

    /**
     * Analyser avec offscreen document
     */
    async #analyzeWithOffscreen(urls, config) {
        // Créer l'offscreen document si nécessaire
        if (!this.state.offscreenDocumentCreated) {
            await this.#createOffscreenDocument();
        }

        return new Promise((resolve, reject) => {
            // Envoyer message à l'offscreen document
            chrome.runtime.sendMessage({
                action: 'analyzeUrls',
                target: 'offscreen',
                urls,
                config: {
                    maxConcurrent: config.maxConcurrentOffscreen,
                    timeout: config.timeout,
                    retryAttempts: config.retryAttempts
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (response && response.success) {
                    resolve({
                        results: response.results,
                        errors: response.errors,
                        stats: response.stats
                    });
                } else {
                    reject(new Error(response?.error || 'Offscreen analysis failed'));
                }
            });
        });
    }

    /**
     * Analyser avec tabs (utilise l'ancien système BatchAnalyzerV5)
     */
    async #analyzeWithTabs(urls, config) {
        console.log('[OffscreenBatchAnalyzer] Using legacy tab-based analysis');

        // Cette méthode fera appel au BatchAnalyzerV5 existant
        // Pour l'instant, on retourne un placeholder
        // Le service_worker se chargera d'appeler le bon système

        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'analyzeWithTabs',
                urls,
                config
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[OffscreenBatchAnalyzer] Tab analysis message failed:', chrome.runtime.lastError);
                    resolve({ results: [], errors: [] });
                    return;
                }

                resolve(response || { results: [], errors: [] });
            });
        });
    }

    /**
     * Créer l'offscreen document
     */
    async #createOffscreenDocument() {
        if (this.state.offscreenDocumentCreated) {
            console.log('[OffscreenBatchAnalyzer] Offscreen document already created');
            return;
        }

        try {
            // Vérifier si un offscreen document existe déjà
            const existingContexts = await chrome.runtime.getContexts({
                contextTypes: ['OFFSCREEN_DOCUMENT']
            });

            if (existingContexts.length > 0) {
                console.log('[OffscreenBatchAnalyzer] Offscreen document already exists');
                this.state.offscreenDocumentCreated = true;
                return;
            }

            // Créer le document offscreen
            await chrome.offscreen.createDocument({
                url: 'offscreen-analyzer.html',
                reasons: ['DOM_SCRAPING'],
                justification: 'Analyze web pages in background without opening visible tabs'
            });

            this.state.offscreenDocumentCreated = true;
            console.log('[OffscreenBatchAnalyzer] Offscreen document created');

            // Attendre un peu pour que le document soit prêt
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error('[OffscreenBatchAnalyzer] Failed to create offscreen document:', error);
            throw error;
        }
    }

    /**
     * Fermer l'offscreen document
     */
    async #closeOffscreenDocument() {
        if (!this.state.offscreenDocumentCreated) {
            return;
        }

        try {
            await chrome.offscreen.closeDocument();
            this.state.offscreenDocumentCreated = false;
            console.log('[OffscreenBatchAnalyzer] Offscreen document closed');

        } catch (error) {
            console.warn('[OffscreenBatchAnalyzer] Failed to close offscreen document:', error);
        }
    }

    /**
     * Fetch et parse un sitemap (sans DOMParser - Service Worker compatible)
     */
    async #fetchSitemapUrls(sitemapUrl) {
        const response = await fetch(sitemapUrl);
        const xmlText = await response.text();

        const urls = [];

        // Parser XML manuellement avec RegEx (Service Worker compatible)
        // Détecter si c'est un sitemap index
        const sitemapIndexPattern = /<sitemap>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/g;
        const sitemapMatches = [...xmlText.matchAll(sitemapIndexPattern)];

        if (sitemapMatches.length > 0) {
            console.log('[OffscreenBatchAnalyzer] Sitemap index detected, fetching sub-sitemaps');

            // Récupérer tous les sitemaps
            for (const match of sitemapMatches) {
                const subSitemapUrl = match[1];
                const subUrls = await this.#fetchSitemapUrls(subSitemapUrl);
                urls.push(...subUrls);
            }
        } else {
            // Sitemap normal - extraire les URLs
            const urlPattern = /<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/url>/g;
            const urlMatches = [...xmlText.matchAll(urlPattern)];

            for (const match of urlMatches) {
                urls.push(match[1].trim());
            }
        }

        return urls;
    }

    /**
     * Agréger les résultats des différentes méthodes
     */
    #aggregateResults(results) {
        const allResults = [
            ...results.offscreen,
            ...results.tab
        ];

        const aggregated = {
            success: allResults,
            errors: results.errors,
            stats: {
                total: allResults.length + results.errors.length,
                success: allResults.length,
                errors: results.errors.length,
                offscreenCount: results.offscreen.length,
                tabCount: results.tab.length,
                duration: Date.now() - this.state.currentAnalysis.startTime
            }
        };

        // Calculer scores moyens
        if (allResults.length > 0) {
            const totalScore = allResults.reduce((sum, r) => sum + (r.score || 0), 0);
            aggregated.stats.averageScore = (totalScore / allResults.length).toFixed(1);
        }

        return aggregated;
    }

    /**
     * Émettre un événement
     */
    #emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[OffscreenBatchAnalyzer] Event listener error (${event}):`, error);
                }
            });
        }
    }

    /**
     * Obtenir le statut actuel
     */
    getStatus() {
        return {
            isAnalyzing: this.state.isAnalyzing,
            offscreenDocumentCreated: this.state.offscreenDocumentCreated,
            currentAnalysis: this.state.currentAnalysis
        };
    }
}
