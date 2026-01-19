/**
 * Performance Analyzer Endpoint
 * Analyse des performances (Lighthouse, Core Web Vitals, métriques)
 * @version 5.0.0
 */

class PerformanceAnalyzerEndpoint extends AnalyzerEndpoint {
  constructor(configManager, scoringEngine) {
    super('performance-analyzer', configManager, scoringEngine);
  }

  /**
   * Analyse complète des performances
   */
  async analyze(pageData, options = {}) {
    const config = this.configManager.getConfig('performance');

    const results = {
      lighthouse: null,
      coreWebVitals: null,
      resources: null,
      metrics: null,
      globalScore: 0,
      issues: [],
      recommendations: []
    };

    // Analyse Lighthouse si disponible
    if (pageData.lighthouse) {
      results.lighthouse = this.analyzeLighthouse(pageData.lighthouse, config.lighthouse);
    } else {
      // Valeurs par défaut si pas de données Lighthouse
      results.lighthouse = {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
        pwa: 0,
        globalScore: 0,
        passed: false,
        score: 0
      };
    }

    // Core Web Vitals
    if (pageData.coreWebVitals || pageData.metrics) {
      results.coreWebVitals = this.analyzeCoreWebVitals(
        pageData.coreWebVitals || pageData.metrics,
        config
      );
    } else {
      // Valeurs par défaut si pas de Core Web Vitals
      results.coreWebVitals = {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
        tti: null,
        LCP: null,
        FID: null,
        CLS: null,
        FCP: null,
        TTFB: null,
        TTI: null,
        score: 0,
        rating: 'unknown'
      };
    }

    // Analyse des ressources
    if (pageData.resources) {
      results.resources = this.analyzeResources(pageData.resources);
    }

    // Métriques générales
    if (pageData.metrics) {
      results.metrics = this.analyzeMetrics(pageData.metrics);
    }

    // Calcul du score global
    results.globalScore = this.calculateGlobalScore(results);

    // Issues et recommandations
    results.issues = this.collectIssues(results);
    results.recommendations = this.generateRecommendations(results, config);

    return results;
  }

  /**
   * Analyse des scores Lighthouse
   */
  analyzeLighthouse(lighthouseData, config) {
    const result = {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      pwa: 0,
      globalScore: 0,
      passed: false
    };

    // Récupérer les scores (0-100)
    result.performance = lighthouseData.performance || lighthouseData.performanceScore || 0;
    result.accessibility = lighthouseData.accessibility || lighthouseData.accessibilityScore || 0;
    result.bestPractices = lighthouseData.bestPractices || lighthouseData.bestPracticesScore || 0;
    result.seo = lighthouseData.seo || lighthouseData.seoScore || 0;
    result.pwa = lighthouseData.pwa || lighthouseData.pwaScore || 0;

    // Score global (moyenne)
    const scores = [result.performance, result.accessibility, result.bestPractices, result.seo];
    result.globalScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));

    // Vérifier si les seuils sont atteints
    if (config && config.thresholds) {
      result.passed =
        result.performance >= config.thresholds.performance &&
        result.accessibility >= config.thresholds.accessibility &&
        result.bestPractices >= config.thresholds.bestPractices &&
        result.seo >= config.thresholds.seo;
    }

    // Convertir en score 0-5
    result.score = Number((result.globalScore / 20).toFixed(2)); // 100 → 5

    return result;
  }

  /**
   * Analyse des Core Web Vitals
   */
  analyzeCoreWebVitals(vitalsData, config) {
    const result = {
      lcp: null,  // Largest Contentful Paint
      fid: null,  // First Input Delay
      cls: null,  // Cumulative Layout Shift
      fcp: null,  // First Contentful Paint
      ttfb: null, // Time to First Byte
      tti: null,  // Time to Interactive
      score: 0,
      rating: 'poor'
    };

    // LCP (Largest Contentful Paint)
    if (vitalsData.lcp !== undefined) {
      const lcp = vitalsData.lcp;
      result.lcp = {
        value: lcp,
        rating: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
        score: lcp < 2500 ? 5 : lcp < 4000 ? 3 : 1,
        threshold: { good: 2500, poor: 4000 }
      };
    }

    // FID (First Input Delay)
    if (vitalsData.fid !== undefined) {
      const fid = vitalsData.fid;
      result.fid = {
        value: fid,
        rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
        score: fid < 100 ? 5 : fid < 300 ? 3 : 1,
        threshold: { good: 100, poor: 300 }
      };
    }

    // CLS (Cumulative Layout Shift)
    if (vitalsData.cls !== undefined) {
      const cls = vitalsData.cls;
      result.cls = {
        value: cls,
        rating: cls < 0.1 ? 'good' : cls < 0.25 ? 'needs-improvement' : 'poor',
        score: cls < 0.1 ? 5 : cls < 0.25 ? 3 : 1,
        threshold: { good: 0.1, poor: 0.25 }
      };
    }

    // FCP (First Contentful Paint)
    if (vitalsData.fcp !== undefined) {
      const fcp = vitalsData.fcp;
      result.fcp = {
        value: fcp,
        rating: fcp < 1800 ? 'good' : fcp < 3000 ? 'needs-improvement' : 'poor',
        score: fcp < 1800 ? 5 : fcp < 3000 ? 3 : 1,
        threshold: { good: 1800, poor: 3000 }
      };
    }

    // TTFB (Time to First Byte)
    if (vitalsData.ttfb !== undefined) {
      const ttfb = vitalsData.ttfb;
      result.ttfb = {
        value: ttfb,
        rating: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor',
        score: ttfb < 800 ? 5 : ttfb < 1800 ? 3 : 1,
        threshold: { good: 800, poor: 1800 }
      };
    }

    // TTI (Time to Interactive)
    if (vitalsData.tti !== undefined) {
      const tti = vitalsData.tti;
      result.tti = {
        value: tti,
        rating: tti < 3800 ? 'good' : tti < 7300 ? 'needs-improvement' : 'poor',
        score: tti < 3800 ? 5 : tti < 7300 ? 3 : 1,
        threshold: { good: 3800, poor: 7300 }
      };
    }

    // Score global des Core Web Vitals
    const scores = [result.lcp, result.fid, result.cls, result.fcp, result.ttfb, result.tti]
      .filter(v => v !== null)
      .map(v => v.score);

    if (scores.length > 0) {
      result.score = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
    }

    // Rating global
    if (result.score >= 4) result.rating = 'good';
    else if (result.score >= 2.5) result.rating = 'needs-improvement';
    else result.rating = 'poor';

    // Alias en majuscules pour compatibilité avec les tests
    result.LCP = result.lcp?.value || null;
    result.FID = result.fid?.value || null;
    result.CLS = result.cls?.value || null;
    result.FCP = result.fcp?.value || null;
    result.TTFB = result.ttfb?.value || null;
    result.TTI = result.tti?.value || null;

    return result;
  }

  /**
   * Analyse des ressources
   */
  analyzeResources(resourcesData) {
    const result = {
      totalSize: 0,
      totalRequests: 0,
      byType: {
        js: { count: 0, size: 0 },
        css: { count: 0, size: 0 },
        images: { count: 0, size: 0 },
        fonts: { count: 0, size: 0 },
        other: { count: 0, size: 0 }
      },
      largestResources: [],
      score: 0
    };

    const resources = resourcesData.resources || resourcesData || [];

    resources.forEach(resource => {
      const size = resource.size || resource.transferSize || 0;
      const type = this.getResourceType(resource.url || resource.name, resource.type);

      result.totalSize += size;
      result.totalRequests++;

      if (result.byType[type]) {
        result.byType[type].count++;
        result.byType[type].size += size;
      }
    });

    // Top 10 ressources les plus lourdes
    result.largestResources = resources
      .map(r => ({
        url: r.url || r.name,
        size: r.size || r.transferSize || 0,
        type: this.getResourceType(r.url || r.name, r.type)
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    // Score basé sur la taille totale
    const totalMB = result.totalSize / (1024 * 1024);
    if (totalMB < 1) result.score = 5;
    else if (totalMB < 2) result.score = 4;
    else if (totalMB < 3) result.score = 3;
    else if (totalMB < 5) result.score = 2;
    else result.score = 1;

    result.totalSizeFormatted = this.formatBytes(result.totalSize);

    return result;
  }

  /**
   * Analyse des métriques générales
   */
  analyzeMetrics(metricsData) {
    const result = {
      loadTime: metricsData.loadTime || metricsData.domContentLoaded || 0,
      domReady: metricsData.domReady || metricsData.domInteractive || 0,
      renderTime: metricsData.renderTime || metricsData.firstPaint || 0,
      score: 0
    };

    // Score basé sur loadTime
    const loadTime = result.loadTime;
    if (loadTime < 1000) result.score = 5;
    else if (loadTime < 2000) result.score = 4;
    else if (loadTime < 3000) result.score = 3;
    else if (loadTime < 5000) result.score = 2;
    else result.score = 1;

    return result;
  }

  /**
   * Détermine le type de ressource
   */
  getResourceType(url, providedType) {
    if (providedType) {
      if (providedType.includes('javascript') || providedType.includes('script')) return 'js';
      if (providedType.includes('css') || providedType.includes('stylesheet')) return 'css';
      if (providedType.includes('image')) return 'images';
      if (providedType.includes('font')) return 'fonts';
    }

    if (!url) return 'other';

    const ext = url.split('.').pop().toLowerCase().split('?')[0];

    if (['js', 'jsx', 'ts', 'tsx', 'mjs'].includes(ext)) return 'js';
    if (['css', 'scss', 'sass', 'less'].includes(ext)) return 'css';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'ico'].includes(ext)) return 'images';
    if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) return 'fonts';

    return 'other';
  }

  /**
   * Calcul du score global
   */
  calculateGlobalScore(results) {
    const scores = [];

    if (results.lighthouse) scores.push(results.lighthouse.score);
    if (results.coreWebVitals) scores.push(results.coreWebVitals.score);
    if (results.resources) scores.push(results.resources.score);
    if (results.metrics) scores.push(results.metrics.score);

    if (scores.length === 0) return 5;

    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Number(avg.toFixed(2));
  }

  /**
   * Collecte les issues
   */
  collectIssues(results) {
    const issues = [];

    // Lighthouse
    if (results.lighthouse && !results.lighthouse.passed) {
      if (results.lighthouse.performance < 90) {
        issues.push({
          type: 'lighthouse-performance',
          severity: 'warning',
          score: results.lighthouse.performance,
          message: `Score Lighthouse Performance: ${results.lighthouse.performance}/100`
        });
      }
    }

    // Core Web Vitals
    if (results.coreWebVitals) {
      const vitals = results.coreWebVitals;

      if (vitals.lcp && vitals.lcp.rating === 'poor') {
        issues.push({
          type: 'lcp',
          severity: 'error',
          value: vitals.lcp.value,
          message: `LCP trop élevé: ${vitals.lcp.value}ms (< 2500ms recommandé)`
        });
      }

      if (vitals.cls && vitals.cls.rating === 'poor') {
        issues.push({
          type: 'cls',
          severity: 'warning',
          value: vitals.cls.value,
          message: `CLS trop élevé: ${vitals.cls.value} (< 0.1 recommandé)`
        });
      }

      if (vitals.fid && vitals.fid.rating === 'poor') {
        issues.push({
          type: 'fid',
          severity: 'error',
          value: vitals.fid.value,
          message: `FID trop élevé: ${vitals.fid.value}ms (< 100ms recommandé)`
        });
      }
    }

    // Ressources
    if (results.resources) {
      const totalMB = results.resources.totalSize / (1024 * 1024);
      if (totalMB > 3) {
        issues.push({
          type: 'resources',
          severity: 'warning',
          size: results.resources.totalSizeFormatted,
          message: `Poids total élevé: ${results.resources.totalSizeFormatted}`
        });
      }
    }

    return issues;
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(results, config) {
    const recommendations = [];

    // LCP
    if (results.coreWebVitals?.lcp && results.coreWebVitals.lcp.rating !== 'good') {
      recommendations.push({
        type: 'lcp',
        priority: 'high',
        message: 'Améliorez le Largest Contentful Paint (LCP)',
        impact: 'Réduit le temps de chargement perçu',
        effort: 'Moyen',
        actions: [
          'Optimisez les images',
          'Utilisez un CDN',
          'Réduisez le JavaScript bloquant',
          'Préchargez les ressources critiques'
        ]
      });
    }

    // CLS
    if (results.coreWebVitals?.cls && results.coreWebVitals.cls.rating !== 'good') {
      recommendations.push({
        type: 'cls',
        priority: 'high',
        message: 'Réduisez le Cumulative Layout Shift (CLS)',
        impact: 'Améliore la stabilité visuelle',
        effort: 'Facile',
        actions: [
          'Définissez width/height pour images et vidéos',
          'Évitez d\'insérer du contenu dynamiquement',
          'Préchargez les fonts'
        ]
      });
    }

    // Ressources lourdes
    if (results.resources && results.resources.totalSize > 3 * 1024 * 1024) {
      recommendations.push({
        type: 'resources',
        priority: 'medium',
        message: 'Réduisez le poids total des ressources',
        impact: `Économie potentielle: ${this.formatBytes(results.resources.totalSize / 2)}`,
        effort: 'Moyen',
        actions: [
          'Minifiez JS et CSS',
          'Compressez les images',
          'Activez la compression Gzip/Brotli',
          'Utilisez le code splitting'
        ]
      });
    }

    // JavaScript
    if (results.resources?.byType.js.size > 500 * 1024) {
      recommendations.push({
        type: 'javascript',
        priority: 'medium',
        message: 'Optimisez le JavaScript',
        impact: 'Améliore le temps d\'exécution',
        effort: 'Moyen',
        size: this.formatBytes(results.resources.byType.js.size),
        actions: [
          'Utilisez le tree-shaking',
          'Lazy load des modules non critiques',
          'Supprimez le code inutilisé'
        ]
      });
    }

    // Bon score
    if (results.globalScore >= 4.5) {
      recommendations.push({
        type: 'success',
        priority: 'low',
        message: '✓ Excellentes performances !',
        impact: 'Votre site est rapide'
      });
    }

    return recommendations;
  }

  /**
   * Formatte les octets
   */
  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Génère un rapport Core Web Vitals
   */
  generateCoreWebVitalsReport(results) {
    if (!results.coreWebVitals) return null;

    const vitals = results.coreWebVitals;

    return {
      passed: vitals.rating === 'good',
      rating: vitals.rating,
      score: vitals.score,
      metrics: {
        lcp: vitals.lcp,
        fid: vitals.fid,
        cls: vitals.cls
      },
      recommendations: results.recommendations.filter(r =>
        ['lcp', 'fid', 'cls'].includes(r.type)
      )
    };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.PerformanceAnalyzerEndpoint = PerformanceAnalyzerEndpoint;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceAnalyzerEndpoint;
}
