/**
 * Analysis Orchestrator
 * Coordonne tous les endpoints d'analyse
 * @version 5.0.0
 */

class AnalysisOrchestrator {
  constructor() {
    this.configManager = null;
    this.scoringEngine = null;
    this.endpoints = new Map();
    this.analysisHistory = [];
    this.isInitialized = false;
  }

  /**
   * Initialisation
   */
  async init() {
    if (this.isInitialized) return;

    // Créer le ConfigurationManager
    this.configManager = new ConfigurationManager();
    await this.configManager.init();

    // Créer le ScoringEngine
    this.scoringEngine = new ScoringEngine(this.configManager);

    // Enregistrer tous les endpoints
    this.registerEndpoints();

    this.isInitialized = true;
    console.log('✓ AnalysisOrchestrator initialized');
  }

  /**
   * Enregistre tous les endpoints
   */
  registerEndpoints() {
    // Meta Analyzer
    this.endpoints.set('meta', new MetaAnalyzerEndpoint(this.configManager, this.scoringEngine));

    // Image Analyzer
    this.endpoints.set('images', new ImageAnalyzerEndpoint(this.configManager, this.scoringEngine));

    // Heading Analyzer
    this.endpoints.set('headings', new HeadingAnalyzerEndpoint(this.configManager, this.scoringEngine));

    // Autres endpoints à ajouter...
    // this.endpoints.set('links', new LinkAnalyzerEndpoint(this.configManager, this.scoringEngine));
    // this.endpoints.set('accessibility', new AccessibilityAnalyzerEndpoint(this.configManager, this.scoringEngine));
    // etc.

    console.log(`✓ ${this.endpoints.size} endpoints registered`);
  }

  /**
   * Analyse complète d'une page
   */
  async analyzePage(pageData, options = {}) {
    await this.init();

    const startTime = Date.now();
    const results = {
      url: pageData.url,
      timestamp: new Date().toISOString(),
      config: {
        preset: this.configManager.currentPreset,
        profile: this.configManager.currentProfile
      },
      analyses: {},
      globalScore: 0,
      duration: 0,
      success: true
    };

    try {
      // Déterminer quels endpoints exécuter selon le profil
      const enabledEndpoints = this.getEnabledEndpoints();

      // Exécuter les analyses en parallèle
      const analysisPromises = [];

      for (const [name, endpoint] of this.endpoints.entries()) {
        if (enabledEndpoints.includes(name) || enabledEndpoints === 'all') {
          analysisPromises.push(
            endpoint.execute(pageData, options)
              .then(result => ({ name, result }))
              .catch(error => ({ name, error: error.message }))
          );
        }
      }

      const analysisResults = await Promise.all(analysisPromises);

      // Compiler les résultats
      analysisResults.forEach(({ name, result, error }) => {
        if (error) {
          results.analyses[name] = {
            success: false,
            error
          };
        } else {
          results.analyses[name] = result;
        }
      });

      // Calculer le score global
      const scoreData = this.scoringEngine.calculateGlobalScore(
        this.extractScoresForGlobal(results.analyses)
      );

      results.globalScore = scoreData.globalScore;
      results.level = scoreData.level;
      results.summary = scoreData.summary;
      results.categoryScores = scoreData.categoryScores;

      // Durée
      results.duration = Date.now() - startTime;

      // Sauvegarder dans l'historique
      this.saveToHistory(results);

      // Callback de progression
      if (options.onComplete) {
        options.onComplete(results);
      }

      return results;

    } catch (error) {
      console.error('Error in analyzePage:', error);
      results.success = false;
      results.error = error.message;
      results.duration = Date.now() - startTime;
      return results;
    }
  }

  /**
   * Analyse de plusieurs pages
   */
  async analyzeMultiplePages(pagesData, options = {}) {
    await this.init();

    const batchSize = options.batchSize || 3;
    const delay = options.delay || 750;
    const results = [];

    for (let i = 0; i < pagesData.length; i += batchSize) {
      const batch = pagesData.slice(i, i + batchSize);

      // Analyser le batch en parallèle
      const batchResults = await Promise.all(
        batch.map(pageData => this.analyzePage(pageData, options))
      );

      results.push(...batchResults);

      // Callback de progression
      if (options.onProgress) {
        options.onProgress({
          completed: Math.min(i + batchSize, pagesData.length),
          total: pagesData.length,
          percentage: Math.round((Math.min(i + batchSize, pagesData.length) / pagesData.length) * 100),
          results: results
        });
      }

      // Pause entre les batches
      if (i + batchSize < pagesData.length) {
        await this.sleep(delay);
      }
    }

    return {
      success: true,
      total: pagesData.length,
      results,
      summary: this.generateMultiPageSummary(results),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extrait les scores pour le calcul global
   */
  extractScoresForGlobal(analyses) {
    const extracted = {};

    if (analyses.meta?.success && analyses.meta.data) {
      extracted.meta = {
        globalScore: analyses.meta.data.globalScore
      };
    }

    if (analyses.images?.success && analyses.images.data) {
      extracted.images = {
        globalScore: analyses.images.data.globalScore
      };
    }

    if (analyses.headings?.success && analyses.headings.data) {
      extracted.headings = {
        globalScore: analyses.headings.data.globalScore
      };
    }

    // Ajouter les autres analyses...

    return extracted;
  }

  /**
   * Détermine les endpoints activés selon le profil
   */
  getEnabledEndpoints() {
    const profile = this.configManager.getProfile(this.configManager.currentProfile);

    if (profile.enabledChecks === 'all') {
      return 'all';
    }

    const mapping = {
      meta: ['meta'],
      images: ['images'],
      headings: ['headings'],
      links: ['links'],
      accessibility: ['accessibility'],
      performance: ['performance']
    };

    const enabled = [];
    profile.enabledChecks.forEach(check => {
      if (mapping[check]) {
        enabled.push(...mapping[check]);
      }
    });

    return enabled;
  }

  /**
   * Génère un résumé multi-pages
   */
  generateMultiPageSummary(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length === 0) {
      return {
        avgScore: 0,
        successful: 0,
        failed: failed.length,
        issues: []
      };
    }

    const avgScore = successful.reduce((sum, r) => sum + r.globalScore, 0) / successful.length;

    const categoryAverages = {};
    const categories = ['meta', 'images', 'headings', 'links', 'accessibility', 'performance'];

    categories.forEach(category => {
      const scores = successful
        .map(r => r.categoryScores?.find(c => c.category === category)?.score)
        .filter(s => s !== undefined);

      if (scores.length > 0) {
        categoryAverages[category] = Number((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(2));
      }
    });

    return {
      avgScore: Number(avgScore.toFixed(2)),
      successful: successful.length,
      failed: failed.length,
      categoryAverages,
      bestPage: successful.reduce((best, r) => r.globalScore > best.globalScore ? r : best, successful[0]),
      worstPage: successful.reduce((worst, r) => r.globalScore < worst.globalScore ? r : worst, successful[0])
    };
  }

  /**
   * Sauvegarde dans l'historique
   */
  saveToHistory(results) {
    this.analysisHistory.unshift({
      url: results.url,
      timestamp: results.timestamp,
      globalScore: results.globalScore,
      level: results.level,
      preset: this.configManager.currentPreset,
      profile: this.configManager.currentProfile
    });

    // Limiter à 100 entrées
    if (this.analysisHistory.length > 100) {
      this.analysisHistory = this.analysisHistory.slice(0, 100);
    }

    // Sauvegarder dans storage
    this.saveHistoryToStorage();
  }

  /**
   * Sauvegarde l'historique
   */
  async saveHistoryToStorage() {
    try {
      // Vérifier si chrome.storage est disponible (contexte extension)
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({
          analysisHistory: this.analysisHistory
        });
      } else {
        // Fallback vers localStorage pour tests hors extension
        localStorage.setItem('analysisHistory', JSON.stringify(this.analysisHistory));
      }
    } catch (e) {
      console.error('Error saving history:', e);
    }
  }

  /**
   * Charge l'historique
   */
  async loadHistoryFromStorage() {
    try {
      let result;

      // Vérifier si chrome.storage est disponible (contexte extension)
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        result = await chrome.storage.local.get('analysisHistory');
      } else {
        // Fallback vers localStorage pour tests hors extension
        const stored = localStorage.getItem('analysisHistory');
        result = stored ? { analysisHistory: JSON.parse(stored) } : {};
      }

      if (result.analysisHistory) {
        this.analysisHistory = result.analysisHistory;
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
  }

  /**
   * Récupère l'historique
   */
  getHistory(limit = 50) {
    return this.analysisHistory.slice(0, limit);
  }

  /**
   * Compare deux analyses
   */
  compareAnalyses(analysis1, analysis2) {
    const comparison = {
      url1: analysis1.url,
      url2: analysis2.url,
      scoreDiff: Number((analysis1.globalScore - analysis2.globalScore).toFixed(2)),
      winner: analysis1.globalScore > analysis2.globalScore ? analysis1.url : analysis2.url,
      categories: {}
    };

    // Comparer par catégorie
    const categories = ['meta', 'images', 'headings', 'links', 'accessibility', 'performance'];

    categories.forEach(category => {
      const score1 = analysis1.categoryScores?.find(c => c.category === category)?.score || 0;
      const score2 = analysis2.categoryScores?.find(c => c.category === category)?.score || 0;

      comparison.categories[category] = {
        score1,
        score2,
        diff: Number((score1 - score2).toFixed(2)),
        winner: score1 > score2 ? analysis1.url : score2 > score1 ? analysis2.url : 'tie'
      };
    });

    return comparison;
  }

  /**
   * Export des résultats
   */
  exportResults(results, format = 'json') {
    if (format === 'json') {
      return JSON.stringify(results, null, 2);
    }

    if (format === 'csv') {
      return this.convertToCSV(results);
    }

    if (format === 'html') {
      return this.convertToHTML(results);
    }

    throw new Error(`Format non supporté: ${format}`);
  }

  /**
   * Convertit en CSV
   */
  convertToCSV(results) {
    const rows = [];

    // Headers
    rows.push(['URL', 'Date', 'Score Global', 'Meta', 'Images', 'Headings', 'Links', 'Accessibility', 'Performance'].join(','));

    // Data
    if (Array.isArray(results)) {
      results.forEach(r => {
        if (r.success) {
          rows.push([
            r.url,
            r.timestamp,
            r.globalScore,
            r.categoryScores?.find(c => c.category === 'meta')?.score || '',
            r.categoryScores?.find(c => c.category === 'images')?.score || '',
            r.categoryScores?.find(c => c.category === 'headings')?.score || '',
            r.categoryScores?.find(c => c.category === 'links')?.score || '',
            r.categoryScores?.find(c => c.category === 'accessibility')?.score || '',
            r.categoryScores?.find(c => c.category === 'performance')?.score || ''
          ].join(','));
        }
      });
    } else {
      rows.push([
        results.url,
        results.timestamp,
        results.globalScore,
        results.categoryScores?.find(c => c.category === 'meta')?.score || '',
        results.categoryScores?.find(c => c.category === 'images')?.score || '',
        results.categoryScores?.find(c => c.category === 'headings')?.score || '',
        results.categoryScores?.find(c => c.category === 'links')?.score || '',
        results.categoryScores?.find(c => c.category === 'accessibility')?.score || '',
        results.categoryScores?.find(c => c.category === 'performance')?.score || ''
      ].join(','));
    }

    return rows.join('\n');
  }

  /**
   * Convertit en HTML
   */
  convertToHTML(results) {
    // Template HTML simple
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Rapport d'analyse - ${results.url}</title>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .score { font-size: 48px; font-weight: bold; }
    .excellent { color: #28a745; }
    .good { color: #17a2b8; }
    .warning { color: #ffc107; }
    .error { color: #dc3545; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f8f9fa; }
  </style>
</head>
<body>
  <h1>Rapport d'analyse</h1>
  <p><strong>URL:</strong> ${results.url}</p>
  <p><strong>Date:</strong> ${new Date(results.timestamp).toLocaleString('fr-FR')}</p>
  <p><strong>Preset:</strong> ${results.config.preset} | <strong>Profile:</strong> ${results.config.profile}</p>

  <div class="score ${results.level?.toLowerCase()}">${results.globalScore} / 5</div>
  <p>${results.summary?.message || ''}</p>

  <h2>Scores par catégorie</h2>
  <table>
    <thead>
      <tr>
        <th>Catégorie</th>
        <th>Score</th>
        <th>Niveau</th>
      </tr>
    </thead>
    <tbody>
      ${(results.categoryScores || []).map(cat => `
        <tr>
          <td>${cat.category}</td>
          <td>${cat.score}</td>
          <td class="${this.scoringEngine.getScoreLevel(cat.score)}">${this.scoringEngine.getScoreLevel(cat.score)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <p><em>Généré par Health Checker Website v5.0</em></p>
</body>
</html>
    `;
  }

  /**
   * Utilitaire sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache de tous les endpoints
   */
  clearAllCaches() {
    this.endpoints.forEach(endpoint => endpoint.clearCache());
  }

  /**
   * Statistiques
   */
  getStats() {
    return {
      totalAnalyses: this.analysisHistory.length,
      endpoints: Array.from(this.endpoints.keys()),
      currentPreset: this.configManager.currentPreset,
      currentProfile: this.configManager.currentProfile
    };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.AnalysisOrchestrator = AnalysisOrchestrator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalysisOrchestrator;
}
