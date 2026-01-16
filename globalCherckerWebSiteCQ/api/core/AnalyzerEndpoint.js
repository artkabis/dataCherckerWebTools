/**
 * Base Analyzer Endpoint
 * Classe de base pour tous les endpoints d'analyse
 * @version 5.0.0
 */

class AnalyzerEndpoint {
  constructor(name, configManager, scoringEngine) {
    this.name = name;
    this.configManager = configManager;
    this.scoringEngine = scoringEngine;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Méthode principale d'analyse (à override)
   */
  async analyze(pageData, options = {}) {
    throw new Error('analyze() must be implemented by subclass');
  }

  /**
   * Validation des données d'entrée
   */
  validateInput(pageData) {
    if (!pageData) {
      throw new Error('pageData is required');
    }
    return true;
  }

  /**
   * Gestion du cache
   */
  getCacheKey(pageData, options) {
    return `${this.name}_${pageData.url}_${JSON.stringify(options)}`;
  }

  getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Wrapper d'analyse avec cache et gestion d'erreurs
   */
  async execute(pageData, options = {}) {
    try {
      this.validateInput(pageData);

      // Vérifier le cache
      const cacheKey = this.getCacheKey(pageData, options);
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.bypassCache) {
        return {
          success: true,
          data: cached,
          fromCache: true,
          endpoint: this.name
        };
      }

      // Exécuter l'analyse
      const startTime = Date.now();
      const result = await this.analyze(pageData, options);
      const duration = Date.now() - startTime;

      // Ajouter métadonnées
      const response = {
        success: true,
        data: result,
        fromCache: false,
        endpoint: this.name,
        duration,
        timestamp: new Date().toISOString(),
        config: {
          preset: this.configManager.currentPreset,
          profile: this.configManager.currentProfile
        }
      };

      // Mettre en cache
      this.setCache(cacheKey, response);

      return response;

    } catch (error) {
      console.error(`Error in ${this.name}:`, error);
      return {
        success: false,
        error: error.message,
        endpoint: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyse batch (multiple URLs)
   */
  async analyzeBatch(pagesData, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 5;
    const delay = options.delay || 500;

    for (let i = 0; i < pagesData.length; i += batchSize) {
      const batch = pagesData.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(pageData => this.execute(pageData, options))
      );
      results.push(...batchResults);

      // Pause entre les batches
      if (i + batchSize < pagesData.length) {
        await this.sleep(delay);
      }

      // Callback de progression
      if (options.onProgress) {
        options.onProgress({
          completed: Math.min(i + batchSize, pagesData.length),
          total: pagesData.length,
          percentage: Math.round((Math.min(i + batchSize, pagesData.length) / pagesData.length) * 100)
        });
      }
    }

    return {
      success: true,
      results,
      total: pagesData.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      endpoint: this.name,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Utilitaire sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Génère des statistiques
   */
  getStats() {
    return {
      endpoint: this.name,
      cacheSize: this.cache.size,
      cacheTimeout: this.cacheTimeout
    };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.AnalyzerEndpoint = AnalyzerEndpoint;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyzerEndpoint;
}
