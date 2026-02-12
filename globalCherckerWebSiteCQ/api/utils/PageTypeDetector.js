/**
 * Page Type Detector - Détecte si une page peut être analysée avec Offscreen ou nécessite un Tab
 * @version 1.0
 */

export class PageTypeDetector {
    // Domaines connus nécessitant JavaScript (SPA/frameworks)
    static JS_HEAVY_DOMAINS = [
        'app.', 'admin.', 'dashboard.',
        'shopify.com', 'wix.com', 'webflow.io',
        'squarespace.com', 'wordpress.com',
        'react.', 'angular.', 'vue.'
    ];

    // Extensions de fichiers qui sont généralement statiques
    static STATIC_EXTENSIONS = [
        '.html', '.htm', '.php', '.asp', '.aspx', '.jsp'
    ];

    // Frameworks JavaScript détectables dans HTML
    static JS_FRAMEWORKS = {
        react: ['react', '__REACT', 'react-root', 'reactroot'],
        vue: ['vue', '__VUE__', 'v-app', 'v-cloak'],
        angular: ['ng-app', 'ng-version', '__ANGULAR__'],
        next: ['__NEXT_DATA__', '_next/static'],
        nuxt: ['__NUXT__'],
        svelte: ['svelte'],
        ember: ['ember-application']
    };

    /**
     * Analyse une URL et détermine la méthode optimale
     * @param {string} url - URL à analyser
     * @param {Object} options - Options de détection
     * @returns {Promise<Object>} Résultat de détection
     */
    static async detectPageType(url, options = {}) {
        const {
            timeout = 5000,
            checkContent = true,
            useCache = true
        } = options;

        const detection = {
            url,
            method: 'offscreen', // Par défaut : offscreen
            confidence: 0,
            reasons: [],
            framework: null,
            fallbackAvailable: true
        };

        try {
            // 1. Vérification rapide par URL
            const urlCheck = this.#checkByURL(url);
            if (urlCheck.jsRequired) {
                detection.method = 'tab';
                detection.confidence = urlCheck.confidence;
                detection.reasons.push(...urlCheck.reasons);
                return detection;
            }

            // 2. Si vérification contenu activée, fetch HEAD pour headers
            if (checkContent) {
                const headersCheck = await this.#checkByHeaders(url, timeout);
                if (headersCheck.jsRequired) {
                    detection.method = 'tab';
                    detection.confidence = headersCheck.confidence;
                    detection.reasons.push(...headersCheck.reasons);
                    detection.framework = headersCheck.framework;
                    return detection;
                }

                // 3. Fetch partiel du contenu HTML (premiers 50KB)
                const contentCheck = await this.#checkByContent(url, timeout);
                if (contentCheck.jsRequired) {
                    detection.method = 'tab';
                    detection.confidence = contentCheck.confidence;
                    detection.reasons.push(...contentCheck.reasons);
                    detection.framework = contentCheck.framework;
                    return detection;
                }

                detection.reasons.push(...contentCheck.reasons);
            }

            // Si aucun indicateur JS trouvé, utiliser offscreen
            detection.confidence = 0.8;
            detection.reasons.push('Aucun framework JavaScript détecté');
            detection.reasons.push('HTML semble statique ou server-rendered');

        } catch (error) {
            console.warn(`[PageTypeDetector] Erreur détection pour ${url}:`, error);
            // En cas d'erreur, fallback sur tab pour sécurité
            detection.method = 'tab';
            detection.confidence = 0.5;
            detection.reasons.push(`Erreur détection: ${error.message}`);
            detection.reasons.push('Fallback sur méthode Tab par sécurité');
        }

        return detection;
    }

    /**
     * Détection batch pour plusieurs URLs
     * @param {Array<string>} urls - Liste d'URLs
     * @param {Object} options - Options
     * @returns {Promise<Object>} Résultats par méthode
     */
    static async detectBatch(urls, options = {}) {
        const results = {
            offscreen: [],
            tab: [],
            detections: []
        };

        // Limiter les détections parallèles pour éviter surcharge
        const batchSize = options.parallelDetections || 5;

        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(url => this.detectPageType(url, options))
            );

            batchResults.forEach(detection => {
                results.detections.push(detection);
                if (detection.method === 'offscreen') {
                    results.offscreen.push(detection.url);
                } else {
                    results.tab.push(detection.url);
                }
            });
        }

        // Stats
        results.stats = {
            total: urls.length,
            offscreen: results.offscreen.length,
            tab: results.tab.length,
            offscreenPercentage: ((results.offscreen.length / urls.length) * 100).toFixed(1)
        };

        console.log(`[PageTypeDetector] Batch analysis: ${results.stats.offscreenPercentage}% can use offscreen`);

        return results;
    }

    // === MÉTHODES PRIVÉES ===

    /**
     * Vérification rapide basée sur l'URL
     */
    static #checkByURL(url) {
        const result = {
            jsRequired: false,
            confidence: 0,
            reasons: []
        };

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            const pathname = urlObj.pathname.toLowerCase();

            // Vérifier domaines connus
            for (const domain of this.JS_HEAVY_DOMAINS) {
                if (hostname.includes(domain)) {
                    result.jsRequired = true;
                    result.confidence = 0.9;
                    result.reasons.push(`Domaine connu pour SPA: ${domain}`);
                    return result;
                }
            }

            // Vérifier extensions statiques
            for (const ext of this.STATIC_EXTENSIONS) {
                if (pathname.endsWith(ext)) {
                    result.reasons.push(`Extension statique détectée: ${ext}`);
                    return result;
                }
            }

            // Patterns dans l'URL suggérant une app
            if (pathname.includes('/app/') || pathname.includes('/admin/') || pathname.includes('/dashboard/')) {
                result.jsRequired = true;
                result.confidence = 0.7;
                result.reasons.push('URL suggère une application web');
                return result;
            }

        } catch (error) {
            console.warn('[PageTypeDetector] URL parsing error:', error);
        }

        return result;
    }

    /**
     * Vérification par headers HTTP
     */
    static async #checkByHeaders(url, timeout) {
        const result = {
            jsRequired: false,
            confidence: 0,
            reasons: [],
            framework: null
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Vérifier headers révélateurs
            const contentType = response.headers.get('content-type') || '';
            const server = response.headers.get('server') || '';
            const poweredBy = response.headers.get('x-powered-by') || '';

            // Détection par headers
            if (server.includes('Vercel') || server.includes('Netlify')) {
                result.jsRequired = true;
                result.confidence = 0.8;
                result.reasons.push(`Hébergement JAMstack détecté: ${server}`);
                result.framework = 'jamstack';
            }

            if (poweredBy.includes('Next.js')) {
                result.jsRequired = true;
                result.confidence = 0.95;
                result.reasons.push('Framework Next.js détecté');
                result.framework = 'next';
            }

            // Content-Type doit être HTML
            if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
                result.jsRequired = true;
                result.confidence = 0.6;
                result.reasons.push(`Content-Type non-HTML: ${contentType}`);
            }

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('[PageTypeDetector] Headers check error:', error);
            }
        }

        return result;
    }

    /**
     * Vérification par analyse du contenu HTML
     */
    static async #checkByContent(url, timeout) {
        const result = {
            jsRequired: false,
            confidence: 0,
            reasons: [],
            framework: null
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Lire seulement les premiers 50KB
            const reader = response.body.getReader();
            const chunks = [];
            let totalSize = 0;
            const maxSize = 50 * 1024; // 50KB

            while (totalSize < maxSize) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                totalSize += value.length;
            }

            reader.cancel();

            // Décoder le HTML
            const decoder = new TextDecoder('utf-8');
            const html = decoder.decode(new Uint8Array(chunks.flat()));
            const htmlLower = html.toLowerCase();

            // 1. Détecter les frameworks
            for (const [framework, patterns] of Object.entries(this.JS_FRAMEWORKS)) {
                for (const pattern of patterns) {
                    if (htmlLower.includes(pattern.toLowerCase())) {
                        result.jsRequired = true;
                        result.confidence = 0.9;
                        result.framework = framework;
                        result.reasons.push(`Framework ${framework} détecté (pattern: ${pattern})`);
                        return result;
                    }
                }
            }

            // 2. Vérifier <noscript> avec warnings
            if (htmlLower.includes('<noscript>') &&
                (htmlLower.includes('javascript') || htmlLower.includes('enable js'))) {
                result.jsRequired = true;
                result.confidence = 0.85;
                result.reasons.push('Balise <noscript> avec avertissement JavaScript requis');
                return result;
            }

            // 3. Ratio contenu vs scripts
            const scriptCount = (html.match(/<script/gi) || []).length;
            const contentTags = (html.match(/<(p|h[1-6]|article|section|div class="content")/gi) || []).length;

            if (scriptCount > 10 && scriptCount > contentTags) {
                result.jsRequired = true;
                result.confidence = 0.75;
                result.reasons.push(`Ratio scripts/contenu suspect: ${scriptCount} scripts vs ${contentTags} contenus`);
                return result;
            }

            // 4. Détecter root div vide (typique SPA)
            const rootDivPatterns = [
                /<div\s+id=["']root["']\s*><\/div>/i,
                /<div\s+id=["']app["']\s*><\/div>/i,
                /<div\s+id=["']__next["']\s*><\/div>/i
            ];

            for (const pattern of rootDivPatterns) {
                if (pattern.test(html)) {
                    result.jsRequired = true;
                    result.confidence = 0.95;
                    result.reasons.push('Div root vide détectée - SPA confirmée');
                    return result;
                }
            }

            // 5. Vérifier si du contenu sémantique est présent
            const hasContent = htmlLower.includes('<article') ||
                             htmlLower.includes('<main') ||
                             (html.match(/<h[1-6]/gi) || []).length > 2 ||
                             (html.match(/<p/gi) || []).length > 5;

            if (hasContent) {
                result.reasons.push('Contenu sémantique HTML détecté');
                result.reasons.push('Page analysable sans exécution JavaScript');
            } else {
                result.jsRequired = true;
                result.confidence = 0.7;
                result.reasons.push('Peu de contenu sémantique dans HTML initial');
            }

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('[PageTypeDetector] Content check error:', error);
            }
        }

        return result;
    }

    /**
     * Forcer une méthode pour une URL spécifique
     * @param {string} url - URL
     * @param {string} method - 'offscreen' ou 'tab'
     * @returns {Object} Détection avec méthode forcée
     */
    static forceMethod(url, method) {
        return {
            url,
            method,
            confidence: 1.0,
            reasons: ['Méthode forcée par utilisateur ou configuration'],
            framework: null,
            fallbackAvailable: true,
            forced: true
        };
    }
}
