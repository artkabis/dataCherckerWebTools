/**
 * Offscreen Analyzer - Background Analysis Engine
 * Analyse pages web sans ouvrir de tabs visibles
 * @version 5.0
 */

"use strict";

// === LOGGER VISUEL ===
class OffscreenLogger {
    constructor() {
        this.statusEl = document.getElementById('status-text');
        this.logsEl = document.getElementById('logs');
        this.maxLogs = 100;
    }

    updateStatus(text) {
        if (this.statusEl) {
            this.statusEl.textContent = text;
        }
    }

    log(message, type = 'info') {
        console.log(`[Offscreen] ${message}`);

        if (this.logsEl) {
            const entry = document.createElement('div');
            entry.className = `log-entry log-${type}`;
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            this.logsEl.insertBefore(entry, this.logsEl.firstChild);

            // Limiter le nombre de logs
            while (this.logsEl.children.length > this.maxLogs) {
                this.logsEl.removeChild(this.logsEl.lastChild);
            }
        }
    }

    success(message) { this.log(message, 'success'); }
    error(message) { this.log(message, 'error'); }
    warning(message) { this.log(message, 'warning'); }
    info(message) { this.log(message, 'info'); }
}

const logger = new OffscreenLogger();

// === STATE MANAGEMENT ===
const state = {
    isAnalyzing: false,
    currentQueue: [],
    results: [],
    errors: [],
    startTime: null,
    config: {
        timeout: 30000,
        maxConcurrent: 5,
        retryAttempts: 2
    }
};

// === HTML ANALYZER ===
class HTMLAnalyzer {
    /**
     * Analyse complète d'une page depuis son HTML
     * @param {string} url - URL de la page
     * @param {string} html - Contenu HTML
     * @returns {Object} Résultats d'analyse
     */
    static analyze(url, html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Créer un contexte window-like pour les extractors
        const context = {
            document: doc,
            location: new URL(url)
        };

        const results = {
            url,
            timestamp: Date.now(),
            meta: this.analyzeMeta(doc, url),
            images: this.analyzeImages(doc, url),
            headings: this.analyzeHeadings(doc),
            links: this.analyzeLinks(doc, url),
            accessibility: this.analyzeAccessibility(doc),
            structure: this.analyzeStructure(doc),
            seo: this.analyzeSEO(doc, url)
        };

        // Calculer un score global
        results.score = this.calculateScore(results);

        return results;
    }

    /**
     * Analyse des balises meta
     */
    static analyzeMeta(doc, url) {
        const meta = {
            title: '',
            description: '',
            keywords: '',
            ogTags: {},
            twitterTags: {},
            canonical: '',
            robots: '',
            viewport: '',
            charset: '',
            issues: []
        };

        // Title
        const titleEl = doc.querySelector('title');
        meta.title = titleEl ? titleEl.textContent.trim() : '';
        if (!meta.title) {
            meta.issues.push('Balise <title> manquante');
        } else if (meta.title.length < 30) {
            meta.issues.push('Title trop court (< 30 caractères)');
        } else if (meta.title.length > 60) {
            meta.issues.push('Title trop long (> 60 caractères)');
        }

        // Description
        const descEl = doc.querySelector('meta[name="description"]');
        meta.description = descEl ? descEl.getAttribute('content') : '';
        if (!meta.description) {
            meta.issues.push('Meta description manquante');
        } else if (meta.description.length < 120) {
            meta.issues.push('Description trop courte (< 120 caractères)');
        } else if (meta.description.length > 160) {
            meta.issues.push('Description trop longue (> 160 caractères)');
        }

        // Keywords
        const keywordsEl = doc.querySelector('meta[name="keywords"]');
        meta.keywords = keywordsEl ? keywordsEl.getAttribute('content') : '';

        // Open Graph
        doc.querySelectorAll('meta[property^="og:"]').forEach(el => {
            const property = el.getAttribute('property').replace('og:', '');
            meta.ogTags[property] = el.getAttribute('content');
        });

        // Twitter Cards
        doc.querySelectorAll('meta[name^="twitter:"]').forEach(el => {
            const name = el.getAttribute('name').replace('twitter:', '');
            meta.twitterTags[name] = el.getAttribute('content');
        });

        // Canonical
        const canonicalEl = doc.querySelector('link[rel="canonical"]');
        meta.canonical = canonicalEl ? canonicalEl.getAttribute('href') : '';

        // Robots
        const robotsEl = doc.querySelector('meta[name="robots"]');
        meta.robots = robotsEl ? robotsEl.getAttribute('content') : '';

        // Viewport
        const viewportEl = doc.querySelector('meta[name="viewport"]');
        meta.viewport = viewportEl ? viewportEl.getAttribute('content') : '';
        if (!meta.viewport) {
            meta.issues.push('Meta viewport manquante (responsive)');
        }

        // Charset
        const charsetEl = doc.querySelector('meta[charset]');
        meta.charset = charsetEl ? charsetEl.getAttribute('charset') : '';

        return meta;
    }

    /**
     * Analyse des images
     */
    static analyzeImages(doc, url) {
        const images = [];
        const imgElements = doc.querySelectorAll('img');

        imgElements.forEach((img, index) => {
            const src = img.getAttribute('src') || '';
            const alt = img.getAttribute('alt') || '';
            const title = img.getAttribute('title') || '';
            const width = img.getAttribute('width') || '';
            const height = img.getAttribute('height') || '';
            const loading = img.getAttribute('loading') || '';

            // Résoudre URL relative
            let absoluteSrc = src;
            try {
                absoluteSrc = new URL(src, url).href;
            } catch (e) {
                // Garder src original si erreur
            }

            images.push({
                index,
                src: absoluteSrc,
                alt,
                title,
                width,
                height,
                loading,
                hasAlt: alt.length > 0,
                hasLazyLoading: loading === 'lazy',
                hasDimensions: width && height,
                issues: []
            });

            // Vérifications
            if (!alt) {
                images[images.length - 1].issues.push('Attribut alt manquant');
            }
            if (!width || !height) {
                images[images.length - 1].issues.push('Dimensions non spécifiées (CLS)');
            }
        });

        return {
            count: images.length,
            withoutAlt: images.filter(img => !img.hasAlt).length,
            withoutDimensions: images.filter(img => !img.hasDimensions).length,
            withLazyLoading: images.filter(img => img.hasLazyLoading).length,
            images: images.slice(0, 50) // Limiter à 50 pour performance
        };
    }

    /**
     * Analyse de la structure des titres (H1-H6)
     */
    static analyzeHeadings(doc) {
        const headings = {
            h1: [],
            h2: [],
            h3: [],
            h4: [],
            h5: [],
            h6: [],
            issues: []
        };

        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            const elements = doc.querySelectorAll(tag);
            elements.forEach((el, index) => {
                headings[tag].push({
                    text: el.textContent.trim(),
                    length: el.textContent.trim().length,
                    index
                });
            });
        });

        // Vérifications
        if (headings.h1.length === 0) {
            headings.issues.push('Aucun H1 détecté');
        } else if (headings.h1.length > 1) {
            headings.issues.push(`${headings.h1.length} H1 détectés (recommandé: 1 seul)`);
        }

        // Vérifier la hiérarchie
        const structure = this.#validateHeadingHierarchy(headings);
        if (structure.errors.length > 0) {
            headings.issues.push(...structure.errors);
        }

        return headings;
    }

    /**
     * Validation de la hiérarchie des titres
     */
    static #validateHeadingHierarchy(headings) {
        const errors = [];
        let lastLevel = 0;

        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag, level) => {
            const currentLevel = level + 1;
            if (headings[tag].length > 0) {
                if (lastLevel > 0 && currentLevel > lastLevel + 1) {
                    errors.push(`Saut de niveau: ${tag} après h${lastLevel}`);
                }
                lastLevel = currentLevel;
            }
        });

        return { errors };
    }

    /**
     * Analyse des liens
     */
    static analyzeLinks(doc, url) {
        const links = [];
        const anchorElements = doc.querySelectorAll('a[href]');

        anchorElements.forEach((anchor, index) => {
            const href = anchor.getAttribute('href') || '';
            const text = anchor.textContent.trim();
            const title = anchor.getAttribute('title') || '';
            const rel = anchor.getAttribute('rel') || '';
            const target = anchor.getAttribute('target') || '';

            // Déterminer type de lien
            let type = 'internal';
            let absoluteHref = href;

            try {
                const linkUrl = new URL(href, url);
                absoluteHref = linkUrl.href;

                if (linkUrl.hostname !== new URL(url).hostname) {
                    type = 'external';
                }
            } catch (e) {
                if (href.startsWith('#')) {
                    type = 'anchor';
                } else if (href.startsWith('mailto:')) {
                    type = 'email';
                } else if (href.startsWith('tel:')) {
                    type = 'phone';
                }
            }

            links.push({
                index,
                href: absoluteHref,
                text,
                title,
                rel,
                target,
                type,
                issues: []
            });

            // Vérifications
            if (!text && !title) {
                links[links.length - 1].issues.push('Lien sans texte ni title');
            }
            if (type === 'external' && target !== '_blank') {
                links[links.length - 1].issues.push('Lien externe sans target="_blank"');
            }
            if (type === 'external' && !rel.includes('noopener')) {
                links[links.length - 1].issues.push('Lien externe sans rel="noopener"');
            }
        });

        return {
            count: links.length,
            internal: links.filter(l => l.type === 'internal').length,
            external: links.filter(l => l.type === 'external').length,
            anchors: links.filter(l => l.type === 'anchor').length,
            withIssues: links.filter(l => l.issues.length > 0).length,
            links: links.slice(0, 100) // Limiter à 100
        };
    }

    /**
     * Analyse d'accessibilité basique
     */
    static analyzeAccessibility(doc) {
        const accessibility = {
            hasLang: false,
            lang: '',
            hasSkipLinks: false,
            ariaLabels: 0,
            ariaDescribedby: 0,
            altImages: 0,
            formLabels: 0,
            issues: []
        };

        // Lang sur <html>
        const htmlEl = doc.querySelector('html');
        accessibility.hasLang = htmlEl && htmlEl.hasAttribute('lang');
        accessibility.lang = htmlEl ? htmlEl.getAttribute('lang') : '';
        if (!accessibility.hasLang) {
            accessibility.issues.push('Attribut lang manquant sur <html>');
        }

        // Skip links
        const skipLinks = doc.querySelectorAll('a[href^="#"][class*="skip"]');
        accessibility.hasSkipLinks = skipLinks.length > 0;

        // ARIA
        accessibility.ariaLabels = doc.querySelectorAll('[aria-label]').length;
        accessibility.ariaDescribedby = doc.querySelectorAll('[aria-describedby]').length;

        // Images avec alt
        const images = doc.querySelectorAll('img');
        const imagesWithAlt = doc.querySelectorAll('img[alt]');
        accessibility.altImages = imagesWithAlt.length;
        if (images.length > imagesWithAlt.length) {
            accessibility.issues.push(`${images.length - imagesWithAlt.length} images sans alt`);
        }

        // Labels de formulaires
        const inputs = doc.querySelectorAll('input:not([type="hidden"]), select, textarea');
        const labels = doc.querySelectorAll('label');
        accessibility.formLabels = labels.length;
        if (inputs.length > labels.length) {
            accessibility.issues.push(`${inputs.length - labels.length} champs sans label`);
        }

        return accessibility;
    }

    /**
     * Analyse de la structure HTML
     */
    static analyzeStructure(doc) {
        return {
            hasHeader: doc.querySelector('header') !== null,
            hasNav: doc.querySelector('nav') !== null,
            hasMain: doc.querySelector('main') !== null,
            hasFooter: doc.querySelector('footer') !== null,
            hasArticle: doc.querySelector('article') !== null,
            hasAside: doc.querySelector('aside') !== null,
            semanticScore: 0
        };
    }

    /**
     * Analyse SEO globale
     */
    static analyzeSEO(doc, url) {
        const seo = {
            score: 0,
            recommendations: []
        };

        // Schema.org / JSON-LD
        const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
        if (jsonLdScripts.length > 0) {
            seo.hasStructuredData = true;
            seo.recommendations.push('✓ Données structurées JSON-LD présentes');
        } else {
            seo.recommendations.push('⚠ Aucune donnée structurée détectée');
        }

        return seo;
    }

    /**
     * Calcul du score global
     */
    static calculateScore(results) {
        let score = 100;

        // Pénalités meta
        if (!results.meta.title) score -= 15;
        if (!results.meta.description) score -= 10;
        if (!results.meta.viewport) score -= 5;

        // Pénalités images
        if (results.images.withoutAlt > 0) {
            score -= Math.min(10, results.images.withoutAlt * 2);
        }

        // Pénalités headings
        if (results.headings.h1.length === 0) score -= 10;
        if (results.headings.h1.length > 1) score -= 5;

        // Pénalités accessibilité
        if (!results.accessibility.hasLang) score -= 5;
        score -= results.accessibility.issues.length * 2;

        return Math.max(0, Math.min(100, score));
    }
}

// === FETCHER ===
class PageFetcher {
    /**
     * Fetch une page avec timeout et retry
     */
    static async fetchPage(url, options = {}) {
        const {
            timeout = 30000,
            retryAttempts = 2
        } = options;

        let lastError = null;

        for (let attempt = 0; attempt <= retryAttempts; attempt++) {
            try {
                logger.info(`Fetching ${url} (attempt ${attempt + 1}/${retryAttempts + 1})`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; WebQualityAnalyzer/5.0)'
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const html = await response.text();
                logger.success(`Fetched ${url} (${(html.length / 1024).toFixed(1)} KB)`);

                return {
                    success: true,
                    url,
                    html,
                    status: response.status,
                    contentType: response.headers.get('content-type')
                };

            } catch (error) {
                lastError = error;
                logger.warning(`Fetch failed for ${url}: ${error.message}`);

                if (attempt < retryAttempts) {
                    const delay = 1000 * (attempt + 1);
                    logger.info(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        return {
            success: false,
            url,
            error: lastError.message
        };
    }
}

// === BATCH PROCESSOR ===
class BatchProcessor {
    /**
     * Traite un batch d'URLs
     */
    static async processBatch(urls, options = {}) {
        const {
            maxConcurrent = 5,
            onProgress = null
        } = options;

        const results = [];
        const errors = [];

        // Traiter par batch concurrent
        for (let i = 0; i < urls.length; i += maxConcurrent) {
            const batch = urls.slice(i, i + maxConcurrent);

            logger.info(`Processing batch ${Math.floor(i / maxConcurrent) + 1} (${batch.length} URLs)`);

            const batchPromises = batch.map(async (url) => {
                try {
                    // Fetch la page
                    const fetchResult = await PageFetcher.fetchPage(url, state.config);

                    if (!fetchResult.success) {
                        errors.push({
                            url,
                            error: fetchResult.error
                        });
                        return null;
                    }

                    // Analyser le HTML
                    const analysis = HTMLAnalyzer.analyze(url, fetchResult.html);

                    logger.success(`Analyzed ${url} (score: ${analysis.score})`);

                    return analysis;

                } catch (error) {
                    logger.error(`Error analyzing ${url}: ${error.message}`);
                    errors.push({
                        url,
                        error: error.message
                    });
                    return null;
                }
            });

            const batchResults = await Promise.all(batchPromises);

            // Filtrer les résultats null et ajouter aux résultats
            results.push(...batchResults.filter(r => r !== null));

            // Callback de progression
            if (onProgress) {
                onProgress({
                    processed: results.length,
                    total: urls.length,
                    errors: errors.length
                });
            }

            // Pause entre batches pour éviter surcharge
            if (i + maxConcurrent < urls.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return { results, errors };
    }
}

// === MESSAGE HANDLER ===
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.info(`Message received: ${message.action}`);

    switch (message.action) {
        case 'analyzeUrls':
            handleAnalyzeUrls(message, sendResponse);
            return true; // Async response

        case 'getStatus':
            sendResponse({
                isAnalyzing: state.isAnalyzing,
                queueSize: state.currentQueue.length,
                resultsCount: state.results.length,
                errorsCount: state.errors.length
            });
            return false;

        case 'cancelAnalysis':
            state.isAnalyzing = false;
            state.currentQueue = [];
            logger.warning('Analysis cancelled');
            sendResponse({ success: true });
            return false;

        default:
            logger.warning(`Unknown action: ${message.action}`);
            return false;
    }
});

/**
 * Handler pour analyser des URLs
 */
async function handleAnalyzeUrls(message, sendResponse) {
    const { urls, config = {} } = message;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        sendResponse({
            success: false,
            error: 'URLs array is required'
        });
        return;
    }

    state.isAnalyzing = true;
    state.currentQueue = [...urls];
    state.results = [];
    state.errors = [];
    state.startTime = Date.now();

    // Merge config
    Object.assign(state.config, config);

    logger.updateStatus(`Analyzing ${urls.length} URLs...`);
    logger.info(`Starting batch analysis: ${urls.length} URLs, ${state.config.maxConcurrent} concurrent`);

    try {
        // Progress callback
        const onProgress = (progress) => {
            logger.info(`Progress: ${progress.processed}/${progress.total} (${progress.errors} errors)`);
            logger.updateStatus(`${progress.processed}/${progress.total} analyzed`);

            // Envoyer update au service worker
            chrome.runtime.sendMessage({
                action: 'offscreenProgress',
                progress
            });
        };

        // Traiter le batch
        const { results, errors } = await BatchProcessor.processBatch(urls, {
            maxConcurrent: state.config.maxConcurrent,
            onProgress
        });

        state.results = results;
        state.errors = errors;

        const duration = Date.now() - state.startTime;
        const avgTime = duration / urls.length;

        logger.updateStatus('Analysis complete');
        logger.success(`Batch complete: ${results.length} success, ${errors.length} errors in ${(duration / 1000).toFixed(1)}s`);
        logger.info(`Average time per URL: ${avgTime.toFixed(0)}ms`);

        sendResponse({
            success: true,
            results,
            errors,
            stats: {
                total: urls.length,
                success: results.length,
                errors: errors.length,
                duration,
                avgTime
            }
        });

    } catch (error) {
        logger.error(`Batch analysis failed: ${error.message}`);
        logger.updateStatus('Error');

        sendResponse({
            success: false,
            error: error.message
        });
    } finally {
        state.isAnalyzing = false;
        state.currentQueue = [];
    }
}

// === INITIALIZATION ===
logger.updateStatus('Ready');
logger.success('Offscreen Analyzer v5.0 initialized');
console.log('[Offscreen] Ready to analyze pages');
