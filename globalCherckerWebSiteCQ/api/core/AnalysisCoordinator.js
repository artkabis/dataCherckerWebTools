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
   * L'analyse complète est déléguée au content script
   * @param {number} tabId - ID de l'onglet à analyser
   * @param {Object} options - Options d'analyse
   * @returns {Promise<Object>} - Résultats de l'analyse
   */
  async analyzePage(tabId, options = {}) {
    console.log('[AnalysisCoordinator] Starting analysis for tab:', tabId);

    try {
      // Vérifier que le content script est prêt
      const isReady = await this.waitForContentScript(tabId);
      if (!isReady) {
        throw new Error('Content script not ready. Please reload the page and try again.');
      }

      // Demander au content script de faire l'analyse complète
      const analysisResult = await this.requestAnalysis(tabId, options);

      // Sauvegarder en cache
      this.cacheResult(analysisResult.url, analysisResult);

      // Sauvegarder dans chrome.storage
      await this.saveToStorage(analysisResult.url, analysisResult);

      console.log('[AnalysisCoordinator] Analysis complete:', analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('[AnalysisCoordinator] Analysis error:', error);
      throw error;
    }
  }

  /**
   * Vérifie que le content script est prêt avec plusieurs tentatives
   */
  async waitForContentScript(tabId, maxRetries = 5, delayMs = 300) {
    console.log('[AnalysisCoordinator] Checking if content script is ready...');

    for (let i = 0; i < maxRetries; i++) {
      try {
        const isReady = await this.pingContentScript(tabId);
        if (isReady) {
          console.log('[AnalysisCoordinator] Content script is ready');
          return true;
        }
      } catch (error) {
        console.log(`[AnalysisCoordinator] Ping attempt ${i + 1}/${maxRetries} failed:`, error.message);
      }

      // Attendre avant de réessayer
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.error('[AnalysisCoordinator] Content script failed to respond after', maxRetries, 'attempts');
    return false;
  }

  /**
   * Envoie un ping au content script pour vérifier qu'il est prêt
   */
  async pingContentScript(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { action: 'ping' },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response && response.status === 'ready') {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );
    });
  }

  /**
   * Demande au content script de faire l'analyse complète
   */
  async requestAnalysis(tabId, options = {}) {
    console.log('[AnalysisCoordinator] Requesting full analysis from content script...');

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { action: 'analyzePagepData', options: options },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Failed to analyze page: ${chrome.runtime.lastError.message}`));
            return;
          }

          if (!response || !response.success) {
            reject(new Error(response?.error || 'Unknown analysis error'));
            return;
          }

          console.log('[AnalysisCoordinator] Analysis result received from content script');
          resolve(response.data);
        }
      );
    });
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
