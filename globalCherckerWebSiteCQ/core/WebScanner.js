/**
 * WebScanner Module avec parser XML corrigé pour Service Worker
 */

export class WebScanner {
    constructor(corsManager) {
        this.corsManager = corsManager;
        this.domain = '';
        this.sitemap = [];
        this.results = [];
        this.isScanning = false;
        this.searchMode = 'text';
        this.analysisId = null;
        this.progress = {
            current: 0,
            total: 0,
            percentage: 0
        };
    }

    async startScan(config) {
        const { domain, searchQuery, useRegex, caseSensitive, searchMode } = config;

        this.analysisId = `web-scanner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        this.domain = domain;
        this.searchMode = searchMode || 'text';
        this.isScanning = true;
        this.results = [];
        this.sitemap = [];

        console.log(`[WebScanner] Starting scan ${this.analysisId} for domain: ${domain}`);

        try {
            await this.corsManager.enable(this.analysisId);

            this.sendProgress('Récupération du robots.txt...');

            // Étape 1: Récupérer robots.txt avec gestion d'erreur améliorée
            const robotsUrl = `${this.domain}/robots.txt`;
            console.log(`[WebScanner] Fetching robots.txt: ${robotsUrl}`);

            const robotsResponse = await this.fetchWithCORS(robotsUrl);
            const robotsText = await robotsResponse.text();

            console.log(`[WebScanner] Robots.txt content (first 200 chars):`, robotsText.substring(0, 200));
            this.sendProgress('Analyse du robots.txt...');

            // Étape 2: Extraire les URLs de sitemap
            const sitemapUrls = this.extractSitemapUrls(robotsText);
            console.log(`[WebScanner] Found ${sitemapUrls.length} sitemap URLs:`, sitemapUrls);

            if (sitemapUrls.length === 0) {
                // Fallback: essayer les URLs de sitemap communes
                const fallbackUrls = this.getFallbackSitemapUrls();
                console.log(`[WebScanner] No sitemaps in robots.txt, trying fallback URLs:`, fallbackUrls);

                for (const fallbackUrl of fallbackUrls) {
                    try {
                        const testResponse = await this.fetchWithCORS(fallbackUrl);
                        if (testResponse.ok) {
                            sitemapUrls.push(fallbackUrl);
                            console.log(`[WebScanner] Found working fallback sitemap: ${fallbackUrl}`);
                            break;
                        }
                    } catch (e) {
                        console.log(`[WebScanner] Fallback URL failed: ${fallbackUrl}`, e);
                    }
                }

                if (sitemapUrls.length === 0) {
                    throw new Error('Aucun sitemap trouvé dans robots.txt et aucune URL de fallback ne fonctionne');
                }
            }

            this.sendProgress(`${sitemapUrls.length} sitemap(s) trouvé(s). Récupération...`);

            // Étape 3: Récupérer et parser les sitemaps
            for (const sitemapUrl of sitemapUrls) {
                if (!this.isScanning) break;
                console.log(`[WebScanner] Processing sitemap: ${sitemapUrl}`);
                await this.processSitemap(sitemapUrl);
            }

            if (this.sitemap.length === 0) {
                throw new Error('Aucune URL trouvée dans le sitemap');
            }

            console.log(`[WebScanner] Found ${this.sitemap.length} URLs in sitemap`);
            this.sendProgress(`${this.sitemap.length} pages trouvées. Début de l'analyse...`);

            // Étape 4: Scanner chaque page
            await this.scanPages(searchQuery, useRegex, caseSensitive);

            this.sendComplete();

        } catch (error) {
            console.error(`[WebScanner] Error in scan ${this.analysisId}:`, error);
            this.sendError(error.message);
            throw error;
        } finally {
            await this.corsManager.disable(this.analysisId);
            this.isScanning = false;
            console.log(`[WebScanner] CORS disabled after scan ${this.analysisId}`);
        }
    }

    /**
     * Extrait les URLs de sitemap du robots.txt
     */
    extractSitemapUrls(robotsText) {
        const sitemapRegex = /^sitemap:\s*(.+)$/gmi;
        const urls = [];
        let match;

        while ((match = sitemapRegex.exec(robotsText)) !== null) {
            urls.push(match[1].trim());
        }

        return urls;
    }

    /**
     * Retourne les URLs de sitemap communes à essayer en fallback
     */
    getFallbackSitemapUrls() {
        return [
            `${this.domain}/sitemap.xml`,
            `${this.domain}/sitemap_index.xml`,
            `${this.domain}/sitemaps.xml`,
            `${this.domain}/sitemap/sitemap.xml`,
            `${this.domain}/wp-sitemap.xml`,
            `${this.domain}/page-sitemap.xml`
        ];
    }

    /**
     * Traite un sitemap avec parser XML alternatif pour Service Worker
     */
    async processSitemap(sitemapUrl) {
        try {
            const response = await this.fetchWithCORS(sitemapUrl);
            const text = await response.text();

            console.log(`[WebScanner] Processing sitemap content (first 500 chars):`, text.substring(0, 500));

            // Parser XML alternatif compatible avec Service Worker
            const sitemapData = this.parseXMLSitemap(text);

            if (sitemapData.isIndex) {
                // C'est un index de sitemap
                console.log(`[WebScanner] Found sitemap index with ${sitemapData.sitemaps.length} sub-sitemaps`);
                for (const subSitemapUrl of sitemapData.sitemaps) {
                    if (!this.isScanning) break;
                    await this.processSitemap(subSitemapUrl);
                }
            } else {
                // C'est un sitemap normal
                console.log(`[WebScanner] Found regular sitemap with ${sitemapData.urls.length} URLs`);
                this.sitemap.push(...sitemapData.urls);
            }
        } catch (error) {
            console.error(`[WebScanner] Erreur lors du traitement du sitemap ${sitemapUrl}:`, error);
        }
    }

    /**
     * Parser XML alternatif utilisant des regex (compatible Service Worker)
     */
    parseXMLSitemap(xmlText) {
        const result = {
            isIndex: false,
            sitemaps: [],
            urls: []
        };

        // Vérifier si c'est un index de sitemap
        const sitemapIndexRegex = /<sitemap>\s*<loc>(.*?)<\/loc>/gi;
        let match;

        while ((match = sitemapIndexRegex.exec(xmlText)) !== null) {
            result.sitemaps.push(match[1].trim());
            result.isIndex = true;
        }

        // Si ce n'est pas un index, extraire les URLs
        if (!result.isIndex) {
            const urlRegex = /<url>\s*<loc>(.*?)<\/loc>/gi;
            while ((match = urlRegex.exec(xmlText)) !== null) {
                result.urls.push(match[1].trim());
            }
        }

        return result;
    }

    /**
     * Scanne toutes les pages du sitemap
     */
    async scanPages(searchQuery, useRegex, caseSensitive) {
        let searchPattern;
        if (useRegex) {
            try {
                searchPattern = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
            } catch (e) {
                throw new Error('Expression régulière invalide');
            }
        } else {
            const flags = caseSensitive ? 'g' : 'gi';
            const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            searchPattern = new RegExp(escapedQuery, flags);
        }

        this.progress.total = this.sitemap.length;

        for (let i = 0; i < this.sitemap.length; i++) {
            if (!this.isScanning) break;

            const url = this.sitemap[i];
            this.progress.current = i + 1;
            this.progress.percentage = Math.round((this.progress.current / this.progress.total) * 100);

            this.sendProgress(`Analyse de ${this.progress.current}/${this.progress.total} pages...`, this.progress.percentage);

            try {
                const response = await this.fetchWithCORS(url);
                const html = await response.text();

                const matches = this.searchInContent(html, searchPattern, url);
                if (matches.length > 0) {
                    console.log(`[WebScanner] Found ${matches.length} matches in ${url}`);
                    this.addResult(url, matches);
                }
            } catch (error) {
                console.error(`[WebScanner] Erreur lors de l'analyse de ${url}:`, error);
            }

            // Pause pour éviter de surcharger
            await new Promise(resolve => setTimeout(resolve, 150));
        }
    }

    /**
     * Recherche le pattern dans le contenu HTML
     */
    /**
  * Décode les entités HTML avec focus sur les caractères français
  */
    decodeHtmlEntities(text) {
        // Entités HTML courantes pour le français
        const entities = {
            // Lettres accentuées minuscules
            '&agrave;': 'à',    // à
            '&aacute;': 'á',    // á  
            '&acirc;': 'â',     // â
            '&atilde;': 'ã',    // ã
            '&auml;': 'ä',      // ä
            '&aring;': 'å',     // å
            '&aelig;': 'æ',     // æ
            '&ccedil;': 'ç',    // ç
            '&egrave;': 'è',    // è
            '&eacute;': 'é',    // é
            '&ecirc;': 'ê',     // ê
            '&euml;': 'ë',      // ë
            '&igrave;': 'ì',    // ì
            '&iacute;': 'í',    // í
            '&icirc;': 'î',     // î
            '&iuml;': 'ï',      // ï
            '&ntilde;': 'ñ',    // ñ
            '&ograve;': 'ò',    // ò
            '&oacute;': 'ó',    // ó
            '&ocirc;': 'ô',     // ô
            '&otilde;': 'õ',    // õ
            '&ouml;': 'ö',      // ö
            '&oslash;': 'ø',    // ø
            '&ugrave;': 'ù',    // ù
            '&uacute;': 'ú',    // ú
            '&ucirc;': 'û',     // û
            '&uuml;': 'ü',      // ü
            '&yacute;': 'ý',    // ý
            '&yuml;': 'ÿ',      // ÿ

            // Lettres accentuées majuscules
            '&Agrave;': 'À',    // À
            '&Aacute;': 'Á',    // Á
            '&Acirc;': 'Â',     // Â
            '&Atilde;': 'Ã',    // Ã
            '&Auml;': 'Ä',      // Ä
            '&Aring;': 'Å',     // Å
            '&AElig;': 'Æ',     // Æ
            '&Ccedil;': 'Ç',    // Ç
            '&Egrave;': 'È',    // È
            '&Eacute;': 'É',    // É
            '&Ecirc;': 'Ê',     // Ê
            '&Euml;': 'Ë',      // Ë
            '&Igrave;': 'Ì',    // Ì
            '&Iacute;': 'Í',    // Í
            '&Icirc;': 'Î',     // Î
            '&Iuml;': 'Ï',      // Ï
            '&Ntilde;': 'Ñ',    // Ñ
            '&Ograve;': 'Ò',    // Ò
            '&Oacute;': 'Ó',    // Ó
            '&Ocirc;': 'Ô',     // Ô
            '&Otilde;': 'Õ',    // Õ
            '&Ouml;': 'Ö',      // Ö
            '&Oslash;': 'Ø',    // Ø
            '&Ugrave;': 'Ù',    // Ù
            '&Uacute;': 'Ú',    // Ú
            '&Ucirc;': 'Û',     // Û
            '&Uuml;': 'Ü',      // Ü
            '&Yacute;': 'Ý',    // Ý

            // Caractères spéciaux courants
            '&amp;': '&',       // &
            '&lt;': '<',        // <
            '&gt;': '>',        // >
            '&quot;': '"',      // "
            '&#39;': "'",       // '
            '&apos;': "'",      // '
            '&nbsp;': ' ',      // espace insécable
            '&hellip;': '…',    // …
            '&mdash;': '—',     // —
            '&ndash;': '–',     // –
            '&laquo;': '«',     // «
            '&raquo;': '»',     // »
            '&copy;': '©',      // ©
            '&reg;': '®',       // ®
            '&trade;': '™',     // ™
            '&euro;': '€',      // €
            '&pound;': '£',     // £
            '&yen;': '¥'        // ¥
        };

        let decoded = text;

        // Décoder les entités nommées
        for (const [entity, char] of Object.entries(entities)) {
            decoded = decoded.replace(new RegExp(entity, 'g'), char);
        }

        // Décoder les entités numériques décimales (&#233; = é)
        decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
            try {
                return String.fromCharCode(parseInt(dec, 10));
            } catch (e) {
                return match; // Retourner l'original en cas d'erreur
            }
        });

        // Décoder les entités numériques hexadécimales (&#xE9; = é)
        decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
            try {
                return String.fromCharCode(parseInt(hex, 16));
            } catch (e) {
                return match; // Retourner l'original en cas d'erreur
            }
        });

        return decoded;
    }

    /**
     * Normalise les espaces et caractères invisibles
     */
    normalizeWhitespace(text) {
        return text
            .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ') // Espaces Unicode variés
            .replace(/[\u200C\u200D\uFEFF]/g, '') // Caractères de contrôle invisibles
            .replace(/\s+/g, ' ') // Normaliser les espaces multiples
            .trim();
    }

    /**
     * Nettoie le HTML en préservant au mieux la structure du texte
     */
    cleanHtmlForTextSearch(html) {
        let cleaned = html;

        // 1. Retirer les scripts et styles avec leur contenu
        cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
        cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');

        // 2. Retirer les commentaires HTML
        cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, ' ');

        // 3. Ajouter des espaces autour des balises de bloc
        const blockTags = ['div', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th', 'section', 'article', 'header', 'footer', 'nav'];
        blockTags.forEach(tag => {
            cleaned = cleaned.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), ' ');
            cleaned = cleaned.replace(new RegExp(`</${tag}>`, 'gi'), ' ');
        });

        // 4. Retirer toutes les balises HTML restantes
        cleaned = cleaned.replace(/<[^>]+>/g, ' ');

        // 5. ÉTAPE CRUCIALE : Décoder les entités HTML avant de normaliser
        cleaned = this.decodeHtmlEntities(cleaned);

        // 6. Normaliser les espaces
        cleaned = this.normalizeWhitespace(cleaned);

        return cleaned;
    }

    /**
     * Recherche améliorée dans le contenu HTML
     */
    searchInContent(html, pattern, url) {
        const matches = [];

        if (this.searchMode === 'text') {
            // Mode texte visible avec nettoyage amélioré
            const textContent = this.cleanHtmlForTextSearch(html);

            console.log(`[WebScanner] Cleaned text sample for ${url}:`, textContent.substring(0, 200));

            // Créer une version normalisée du pattern pour la recherche
            let normalizedPattern = pattern;

            // Si ce n'est pas déjà une regex compilée, traiter la chaîne
            if (typeof pattern.source === 'string') {
                let searchString = pattern.source;

                // Normaliser les espaces dans le pattern de recherche
                searchString = this.normalizeWhitespace(searchString);

                // Recréer le pattern avec la chaîne normalisée
                normalizedPattern = new RegExp(searchString, pattern.flags);
            }

            normalizedPattern.lastIndex = 0;
            let match;

            while ((match = normalizedPattern.exec(textContent)) !== null) {
                const start = Math.max(0, match.index - 80);
                const end = Math.min(textContent.length, match.index + match[0].length + 80);
                const context = textContent.substring(start, end);

                matches.push({
                    match: match[0],
                    context: context,
                    index: match.index,
                    type: 'text'
                });

                console.log(`[WebScanner] Found match in ${url}:`, match[0]);
            }
        } else {
            // Mode DOM complet (recherche dans le HTML brut)
            pattern.lastIndex = 0;
            let match;

            while ((match = pattern.exec(html)) !== null) {
                const start = Math.max(0, match.index - 150);
                const end = Math.min(html.length, match.index + match[0].length + 150);
                const context = html.substring(start, end);

                matches.push({
                    match: match[0],
                    context: context,
                    index: match.index,
                    type: 'html'
                });
            }
        }

        return matches;
    }

    /**
     * Fonction de test pour déboguer les problèmes de recherche
     */
    debugSearchText(originalText, htmlSource) {
        console.group('[WebScanner Debug] Text Search Analysis');

        console.log('Original text to search:', originalText);
        console.log('Original text length:', originalText.length);
        console.log('Original text bytes:', [...originalText].map(c => c.charCodeAt(0)));

        const cleaned = this.cleanHtmlForTextSearch(htmlSource);
        console.log('Cleaned text sample:', cleaned.substring(0, 500));

        // Test si le texte normalisé est présent
        const normalizedOriginal = this.normalizeWhitespace(originalText);
        const isPresent = cleaned.includes(normalizedOriginal);

        console.log('Normalized original text:', normalizedOriginal);
        console.log('Is present in cleaned text:', isPresent);

        if (!isPresent) {
            // Chercher des parties du texte
            const words = normalizedOriginal.split(' ');
            console.log('Word by word analysis:');
            words.forEach((word, index) => {
                const found = cleaned.includes(word);
                console.log(`  Word ${index + 1} "${word}": ${found ? 'FOUND' : 'NOT FOUND'}`);
            });
        }

        console.groupEnd();

        return {
            originalText,
            normalizedText: normalizedOriginal,
            cleanedHtml: cleaned,
            isPresent
        };
    }

    /**
     * Effectue une requête HTTP avec gestion CORS et retry
     */
    async fetchWithCORS(url, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`[WebScanner] Fetching ${url} (attempt ${attempt + 1})`);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; WebScanner/1.0)',
                        'Accept': '*/*'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
                }

                console.log(`[WebScanner] Successfully fetched ${url}`);
                return response;

            } catch (error) {
                console.error(`[WebScanner] Attempt ${attempt + 1} failed for ${url}:`, error);

                if (attempt === retries) {
                    throw error;
                }

                // Attendre avant de retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }

    // ... (reste des méthodes inchangées: addResult, sendProgress, sendComplete, etc.)

    addResult(url, matches) {
        const result = { url, matches, timestamp: Date.now() };
        this.results.push(result);

        console.log(`[WebScanner] Adding result for ${url}: ${matches.length} matches`);
        console.log(`[WebScanner] Total results so far: ${this.results.length}`);

        // FORCER le stockage immédiat à chaque résultat
        chrome.storage.local.set({
            'webScannerResults': this.results,
            'webScannerResultsCount': this.results.length,
            'webScannerLastUpdate': Date.now()
        }).then(() => {
            console.log(`[WebScanner] Results stored: ${this.results.length} items`);

            // Vérification immédiate
            chrome.storage.local.get(['webScannerResults'], (stored) => {
                console.log(`[WebScanner] Storage verification: ${stored.webScannerResults?.length || 0} items stored`);
            });
        });

        // Envoyer le message (même si personne n'écoute)
        try {
            chrome.runtime.sendMessage({
                action: 'webScannerNewResult',
                result: result,
                analysisId: this.analysisId,
                totalResults: this.results.length
            });
        } catch (error) {
            console.log('[WebScanner] Could not send message (normal if no listeners):', error.message);
        }
    }

    sendProgress(message, percentage = null) {
        this.sendMessage({
            action: 'webScannerProgress',
            progress: {
                message,
                percentage: percentage || this.progress.percentage,
                current: this.progress.current,
                total: this.progress.total
            },
            analysisId: this.analysisId
        });
    }

    sendComplete() {
        const summary = {
            totalPages: this.sitemap.length,
            pagesWithMatches: this.results.length,
            totalMatches: this.results.reduce((sum, result) => sum + result.matches.length, 0),
            timestamp: Date.now(),
            analysisId: this.analysisId,
            completed: true
        };

        console.log(`[WebScanner] Analysis COMPLETE:`, summary);

        // FORCER le stockage final avec vérification
        chrome.storage.local.set({
            'webScannerResults': this.results,
            'webScannerSummary': summary,
            'webScannerActive': false,
            'webScannerCompleted': true,
            'webScannerCompletedTime': Date.now()
        }).then(() => {
            console.log(`[WebScanner] FINAL STORAGE completed: ${this.results.length} results saved`);

            // Double vérification
            chrome.storage.local.get(['webScannerResults', 'webScannerSummary'], (stored) => {
                console.log('[WebScanner] FINAL VERIFICATION:', {
                    storedResults: stored.webScannerResults?.length || 0,
                    storedSummary: stored.webScannerSummary
                });
            });

            // Envoyer le message de completion
            try {
                chrome.runtime.sendMessage({
                    action: 'webScannerComplete',
                    results: this.results,
                    analysisId: this.analysisId,
                    summary
                });
            } catch (error) {
                console.log('[WebScanner] Could not send completion message:', error.message);
            }
        });
    }

    sendError(message) {
        this.sendMessage({
            action: 'webScannerError',
            error: message,
            analysisId: this.analysisId
        });
    }

    sendMessage(message) {
        try {
            chrome.runtime.sendMessage(message);
        } catch (error) {
            console.error('[WebScanner] Error sending message:', error);
        }
    }

    stop() {
        this.isScanning = false;
        console.log(`[WebScanner] Scan ${this.analysisId} stopped`);
    }

    getProgress() {
        return {
            ...this.progress,
            isScanning: this.isScanning,
            analysisId: this.analysisId
        };
    }

    getSummary() {
        return {
            totalPages: this.sitemap.length,
            pagesWithMatches: this.results.length,
            totalMatches: this.results.reduce((sum, result) => sum + result.matches.length, 0),
            isScanning: this.isScanning,
            analysisId: this.analysisId
        };
    }

    async cleanup() {
        this.stop();
        if (this.analysisId && this.corsManager) {
            await this.corsManager.disable(this.analysisId);
        }
        this.results = [];
        this.sitemap = [];
        this.progress = { current: 0, total: 0, percentage: 0 };
    }
}