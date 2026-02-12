/**
 * BatchAnalyzerV5 - Analyse multi-pages avec endpoints v5.0
 * Permet d'analyser plusieurs pages en utilisant les nouveaux endpoints
 * Version 5.0.0
 */

class BatchAnalyzerV5 {
  constructor() {
    this.isAnalyzing = false;
    this.currentBatch = null;
    this.results = [];
    this.errors = [];
    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
      percentage: 0
    };
    this.onProgress = null; // Callback pour les updates de progression
    this.analysisId = null;
  }

  /**
   * Analyse plusieurs pages depuis un sitemap XML
   * @param {string} sitemapUrl - URL du sitemap XML
   * @param {Object} options - Options d'analyse
   * @returns {Promise<Object>} - Résultats agrégés
   */
  async analyzeFromSitemap(sitemapUrl, options = {}) {
    console.log('[BatchAnalyzerV5] Starting sitemap analysis:', sitemapUrl);

    try {
      // 1. Récupérer et parser le sitemap
      const urls = await this.fetchAndParseSitemap(sitemapUrl);

      console.log(`[BatchAnalyzerV5] Found ${urls.length} URLs in sitemap`);

      // 2. Analyser toutes les URLs
      return await this.analyzeFromURLList(urls, options);

    } catch (error) {
      console.error('[BatchAnalyzerV5] Sitemap analysis error:', error);
      throw error;
    }
  }

  /**
   * Récupère et parse un sitemap XML
   * MANIFEST V3 COMPATIBLE: N'utilise pas DOMParser (indisponible dans service workers)
   * @param {string} sitemapUrl - URL du sitemap
   * @returns {Promise<Array<string>>} - Liste des URLs
   */
  async fetchAndParseSitemap(sitemapUrl) {
    try {
      const response = await fetch(sitemapUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();

      // Parser XML manuellement avec RegEx (Service Worker compatible - pas de DOMParser)
      const urls = [];

      // Détecter si c'est un sitemap index
      const sitemapIndexPattern = /<sitemap>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/g;
      const sitemapMatches = [...xmlText.matchAll(sitemapIndexPattern)];

      if (sitemapMatches.length > 0) {
        // C'est un sitemap index
        const sitemapUrls = sitemapMatches.map(match => match[1].trim());
        console.log(`[BatchAnalyzerV5] Found ${sitemapUrls.length} sitemaps in index`);

        // Récupérer toutes les URLs de tous les sitemaps
        const allUrls = [];
        for (const childSitemapUrl of sitemapUrls) {
          const urls = await this.fetchAndParseSitemap(childSitemapUrl);
          allUrls.push(...urls);
        }
        return allUrls;
      }

      // Parser les URLs normalement
      const urlPattern = /<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/url>/g;
      const urlMatches = [...xmlText.matchAll(urlPattern)];

      return urlMatches.map(match => match[1].trim());

    } catch (error) {
      console.error('[BatchAnalyzerV5] Sitemap parsing error:', error);
      throw new Error(`Failed to parse sitemap: ${error.message}`);
    }
  }

  /**
   * Extrait les URLs de sitemap depuis un sitemap index
   * @param {string} xmlText - Contenu XML
   * @returns {Array<string>} - URLs des sitemaps
   */
  extractSitemapUrls(xmlText) {
    const urls = [];

    // Regex pour matcher <sitemap><loc>URL</loc></sitemap>
    const sitemapRegex = /<sitemap[^>]*>[\s\S]*?<loc[^>]*>(.*?)<\/loc>[\s\S]*?<\/sitemap>/gi;

    let match;
    while ((match = sitemapRegex.exec(xmlText)) !== null) {
      const url = match[1].trim();
      if (url) {
        // Décoder les entités HTML si nécessaire
        const decodedUrl = this.decodeXmlEntities(url);
        urls.push(decodedUrl);
      }
    }

    return urls;
  }

  /**
   * Extrait les URLs depuis un sitemap standard
   * @param {string} xmlText - Contenu XML
   * @returns {Array<string>} - URLs de pages
   */
  extractUrlsFromSitemap(xmlText) {
    const urls = [];

    // Regex pour matcher <url><loc>URL</loc>...</url>
    const urlRegex = /<url[^>]*>[\s\S]*?<loc[^>]*>(.*?)<\/loc>[\s\S]*?<\/url>/gi;

    let match;
    while ((match = urlRegex.exec(xmlText)) !== null) {
      const url = match[1].trim();
      if (url) {
        // Décoder les entités HTML si nécessaire
        const decodedUrl = this.decodeXmlEntities(url);
        urls.push(decodedUrl);
      }
    }

    return urls;
  }

  /**
   * Décode les entités XML communes
   * @param {string} text - Texte à décoder
   * @returns {string} - Texte décodé
   */
  decodeXmlEntities(text) {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  /**
   * Analyse plusieurs pages depuis une liste d'URLs
   * @param {Array<string>} urls - Liste des URLs à analyser
   * @param {Object} options - Options d'analyse
   * @returns {Promise<Object>} - Résultats agrégés
   */
  async analyzeFromURLList(urls, options = {}) {
    if (this.isAnalyzing) {
      throw new Error('Batch analysis already in progress');
    }

    console.log(`[BatchAnalyzerV5] Starting batch analysis of ${urls.length} URLs`);

    this.isAnalyzing = true;
    this.analysisId = `batch_${Date.now()}`;
    this.results = [];
    this.errors = [];

    this.progress = {
      total: urls.length,
      completed: 0,
      failed: 0,
      percentage: 0
    };

    const startTime = Date.now();

    try {
      // Options par défaut
      const batchOptions = {
        concurrent: options.concurrent || 3, // Nombre d'analyses en parallèle
        delay: options.delay || 1000, // Délai entre chaque batch (ms)
        timeout: options.timeout || 30000, // Timeout par page (ms)
        preset: options.preset || 'SEO_STANDARD',
        profile: options.profile || 'FULL',
        ...options
      };

      // Analyser par batch
      await this.processBatch(urls, batchOptions);

      // Calculer les résultats agrégés
      const duration = Date.now() - startTime;
      const aggregatedResults = this.aggregateResults();

      const finalResults = {
        analysisId: this.analysisId,
        timestamp: startTime,
        duration: duration,
        total: urls.length,
        successful: this.results.length,
        failed: this.errors.length,
        progress: this.progress,
        options: batchOptions,
        summary: aggregatedResults,
        results: this.results,
        errors: this.errors
      };

      console.log('[BatchAnalyzerV5] Batch analysis complete:', finalResults);

      return finalResults;

    } catch (error) {
      console.error('[BatchAnalyzerV5] Batch analysis error:', error);
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Traite les URLs par batch
   * @param {Array<string>} urls - Liste des URLs
   * @param {Object} options - Options
   */
  async processBatch(urls, options) {
    const { concurrent, delay } = options;

    // Diviser en chunks
    for (let i = 0; i < urls.length; i += concurrent) {
      const chunk = urls.slice(i, i + concurrent);

      console.log(`[BatchAnalyzerV5] Processing batch ${Math.floor(i / concurrent) + 1}/${Math.ceil(urls.length / concurrent)}`);

      // Analyser le chunk en parallèle
      const promises = chunk.map(url => this.analyzeURL(url, options));
      await Promise.allSettled(promises);

      // Mettre à jour la progression
      this.updateProgress();

      // Délai entre les batches (sauf pour le dernier)
      if (i + concurrent < urls.length) {
        await this.sleep(delay);
      }
    }
  }

  /**
   * Analyse une URL unique
   * @param {string} url - URL à analyser
   * @param {Object} options - Options
   */
  async analyzeURL(url, options) {
    console.log(`[BatchAnalyzerV5] Analyzing: ${url}`);

    try {
      // Créer un onglet temporaire
      const tab = await chrome.tabs.create({
        url: url,
        active: false
      });

      // Attendre que la page se charge
      await this.waitForTabLoad(tab.id, options.timeout);

      // Analyser avec v5.0
      const result = await this.requestAnalysis(tab.id, options);

      // Fermer l'onglet
      await chrome.tabs.remove(tab.id);

      // Sauvegarder le résultat
      this.results.push({
        url: url,
        ...result
      });

      console.log(`[BatchAnalyzerV5] ✓ Analysis complete for: ${url}`);

    } catch (error) {
      console.error(`[BatchAnalyzerV5] ✗ Analysis failed for: ${url}`, error);

      this.errors.push({
        url: url,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Attend que l'onglet soit chargé
   * @param {number} tabId - ID de l'onglet
   * @param {number} timeout - Timeout en ms
   */
  waitForTabLoad(tabId, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error('Tab load timeout'));
      }, timeout);

      const listener = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          clearTimeout(timeoutId);
          chrome.tabs.onUpdated.removeListener(listener);
          // Attendre encore 500ms pour que le content script soit prêt
          setTimeout(resolve, 500);
        }
      };

      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  /**
   * Demande l'analyse d'un onglet
   * @param {number} tabId - ID de l'onglet
   * @param {Object} options - Options
   */
  requestAnalysis(tabId, options) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        {
          action: 'analyzePagepData',
          options: {
            preset: options.preset,
            profile: options.profile
          }
        },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!response || !response.success) {
            reject(new Error(response?.error || 'Analysis failed'));
            return;
          }

          resolve(response.data);
        }
      );
    });
  }

  /**
   * Met à jour la progression
   */
  updateProgress() {
    this.progress.completed = this.results.length;
    this.progress.failed = this.errors.length;
    this.progress.percentage = Math.round(
      ((this.progress.completed + this.progress.failed) / this.progress.total) * 100
    );

    console.log(`[BatchAnalyzerV5] Progress: ${this.progress.percentage}% (${this.progress.completed}/${this.progress.total})`);

    // Appeler le callback si défini
    if (this.onProgress) {
      this.onProgress(this.progress);
    }
  }

  /**
   * Agrège les résultats
   */
  aggregateResults() {
    if (this.results.length === 0) {
      return {
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
        bestPage: null,
        worstPage: null,
        distribution: {}
      };
    }

    const scores = this.results.map(r => r.globalScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    const bestPage = this.results.find(r => r.globalScore === maxScore);
    const worstPage = this.results.find(r => r.globalScore === minScore);

    // Distribution par niveau
    const distribution = {
      excellent: this.results.filter(r => r.level === 'excellent').length,
      good: this.results.filter(r => r.level === 'good').length,
      warning: this.results.filter(r => r.level === 'warning').length,
      error: this.results.filter(r => r.level === 'error').length
    };

    return {
      avgScore: Math.round(avgScore * 10) / 10,
      minScore,
      maxScore,
      bestPage: bestPage ? { url: bestPage.url, score: bestPage.globalScore } : null,
      worstPage: worstPage ? { url: worstPage.url, score: worstPage.globalScore } : null,
      distribution
    };
  }

  /**
   * Pause l'exécution
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Arrête l'analyse en cours
   */
  stop() {
    console.log('[BatchAnalyzerV5] Stopping batch analysis');
    this.isAnalyzing = false;
  }

  /**
   * Récupère l'état actuel
   */
  getStatus() {
    return {
      isAnalyzing: this.isAnalyzing,
      analysisId: this.analysisId,
      progress: this.progress,
      resultsCount: this.results.length,
      errorsCount: this.errors.length
    };
  }

  /**
   * Exporte les résultats
   * @param {string} format - Format d'export (json, csv)
   */
  exportResults(format = 'json') {
    if (format === 'csv') {
      return this.exportToCSV();
    }
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Exporte vers CSV
   */
  exportToCSV() {
    const headers = ['URL', 'Score Global', 'Niveau', 'Meta Score', 'Images Score', 'Headings Score', 'Links Score', 'Accessibility Score', 'Performance Score'];

    const rows = this.results.map(result => [
      result.url,
      result.globalScore,
      result.level,
      result.analyses?.meta?.globalScore || 0,
      result.analyses?.images?.globalScore || 0,
      result.analyses?.headings?.globalScore || 0,
      result.analyses?.links?.globalScore || 0,
      result.analyses?.accessibility?.globalScore || 0,
      result.analyses?.performance?.globalScore || 0
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Export CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BatchAnalyzerV5;
}

// Export ES6 pour service worker
export { BatchAnalyzerV5 };

// Exposer dans le scope global pour le navigateur
if (typeof window !== 'undefined') {
  window.BatchAnalyzerV5 = BatchAnalyzerV5;
}
