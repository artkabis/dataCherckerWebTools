/**
 * AnalysisCoordinator - v5.0
 * Coordonne les analyses depuis le service worker
 * Utilise l'AnalysisOrchestrator avec les données extraites du content script
 */

class AnalysisCoordinator {
  constructor() {
    this.orchestrator = null;
    this.analysisCache = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialise le coordinator
   */
  async init() {
    if (this.isInitialized) return;

    console.log('[AnalysisCoordinator] Initializing...');

    try {
      // L'orchestrator sera créé dynamiquement lors de l'analyse
      this.isInitialized = true;
      console.log('[AnalysisCoordinator] Initialized successfully');
    } catch (error) {
      console.error('[AnalysisCoordinator] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Analyse une page en utilisant les endpoints v5.0
   * @param {number} tabId - ID de l'onglet à analyser
   * @param {Object} options - Options d'analyse
   * @returns {Promise<Object>} - Résultats de l'analyse
   */
  async analyzePage(tabId, options = {}) {
    console.log('[AnalysisCoordinator] Starting analysis for tab:', tabId);

    try {
      // 1. Extraire les données de la page via le content script
      const pageData = await this.extractPageData(tabId);

      // 2. Analyser avec l'orchestrateur
      const analysisResult = await this.analyzeWithOrchestrator(pageData, options);

      // 3. Sauvegarder en cache
      this.cacheResult(pageData.url, analysisResult);

      // 4. Sauvegarder dans chrome.storage
      await this.saveToStorage(pageData.url, analysisResult);

      console.log('[AnalysisCoordinator] Analysis complete:', analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('[AnalysisCoordinator] Analysis error:', error);
      throw error;
    }
  }

  /**
   * Extrait les données de la page via le content script
   */
  async extractPageData(tabId) {
    console.log('[AnalysisCoordinator] Extracting page data from tab:', tabId);

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { action: 'getPageData' },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Failed to extract page data: ${chrome.runtime.lastError.message}`));
            return;
          }

          if (!response || !response.success) {
            reject(new Error(response?.error || 'Unknown extraction error'));
            return;
          }

          console.log('[AnalysisCoordinator] Page data extracted successfully');
          resolve(response.data);
        }
      );
    });
  }

  /**
   * Analyse les données avec l'orchestrateur
   * Exécute le code dans le contexte de la page via scripting API
   */
  async analyzeWithOrchestrator(pageData, options = {}) {
    console.log('[AnalysisCoordinator] Analyzing with orchestrator...');

    // Créer un objet analysisRequest à passer au contexte de la page
    const analysisRequest = {
      pageData: pageData,
      options: options
    };

    try {
      // Exécuter l'analyse dans le contexte du service worker
      // Charger les modules nécessaires
      const { default: AnalysisOrchestrator } = await import('./AnalysisOrchestrator.js');

      const orchestrator = new AnalysisOrchestrator();
      await orchestrator.init();

      // Analyser la page
      const result = await orchestrator.analyzePage(pageData, options);

      return result;

    } catch (error) {
      console.error('[AnalysisCoordinator] Orchestrator analysis error:', error);
      throw error;
    }
  }

  /**
   * Met en cache un résultat d'analyse
   */
  cacheResult(url, result) {
    const cacheKey = this.getCacheKey(url);
    this.analysisCache.set(cacheKey, {
      result: result,
      timestamp: Date.now()
    });

    // Nettoyer les vieux résultats (> 1h)
    this.cleanCache();
  }

  /**
   * Récupère un résultat depuis le cache
   */
  getCachedResult(url, maxAge = 3600000) { // 1h par défaut
    const cacheKey = this.getCacheKey(url);
    const cached = this.analysisCache.get(cacheKey);

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.analysisCache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * Génère une clé de cache depuis une URL
   */
  getCacheKey(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  /**
   * Nettoie les résultats de cache obsolètes
   */
  cleanCache() {
    const now = Date.now();
    const maxAge = 3600000; // 1h

    for (const [key, value] of this.analysisCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.analysisCache.delete(key);
      }
    }
  }

  /**
   * Sauvegarde un résultat dans chrome.storage
   */
  async saveToStorage(url, result) {
    try {
      const storageKey = `analysis_${this.getCacheKey(url)}`;

      // Limiter la taille en storage (garder seulement les 10 derniers)
      const stored = await chrome.storage.local.get(null);
      const analysisKeys = Object.keys(stored).filter(k => k.startsWith('analysis_'));

      if (analysisKeys.length >= 10) {
        // Supprimer le plus ancien
        const oldest = analysisKeys.sort((a, b) => {
          return (stored[a].timestamp || 0) - (stored[b].timestamp || 0);
        })[0];

        await chrome.storage.local.remove(oldest);
      }

      // Sauvegarder le nouveau
      await chrome.storage.local.set({
        [storageKey]: {
          url: url,
          result: result,
          timestamp: Date.now()
        }
      });

      console.log('[AnalysisCoordinator] Result saved to storage');
    } catch (error) {
      console.error('[AnalysisCoordinator] Storage save error:', error);
    }
  }

  /**
   * Récupère un résultat depuis chrome.storage
   */
  async getFromStorage(url) {
    try {
      const storageKey = `analysis_${this.getCacheKey(url)}`;
      const result = await chrome.storage.local.get(storageKey);

      if (result[storageKey]) {
        return result[storageKey].result;
      }

      return null;
    } catch (error) {
      console.error('[AnalysisCoordinator] Storage get error:', error);
      return null;
    }
  }

  /**
   * Récupère tous les résultats stockés
   */
  async getAllStoredResults() {
    try {
      const stored = await chrome.storage.local.get(null);
      const results = [];

      for (const [key, value] of Object.entries(stored)) {
        if (key.startsWith('analysis_')) {
          results.push({
            url: value.url,
            timestamp: value.timestamp,
            globalScore: value.result.globalScore,
            level: value.result.level
          });
        }
      }

      // Trier par timestamp (plus récent en premier)
      return results.sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
      console.error('[AnalysisCoordinator] Get all results error:', error);
      return [];
    }
  }

  /**
   * Efface tous les résultats stockés
   */
  async clearAllResults() {
    try {
      const stored = await chrome.storage.local.get(null);
      const analysisKeys = Object.keys(stored).filter(k => k.startsWith('analysis_'));

      if (analysisKeys.length > 0) {
        await chrome.storage.local.remove(analysisKeys);
        console.log(`[AnalysisCoordinator] Cleared ${analysisKeys.length} stored results`);
      }

      this.analysisCache.clear();

    } catch (error) {
      console.error('[AnalysisCoordinator] Clear results error:', error);
    }
  }
}

// Export pour utilisation dans service worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalysisCoordinator;
}

export { AnalysisCoordinator };
