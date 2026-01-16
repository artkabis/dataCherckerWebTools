/**
 * Scoring Engine
 * Moteur de calcul de scores intelligent basé sur la configuration
 * @version 5.0.0
 */

class ScoringEngine {
  constructor(configManager) {
    this.configManager = configManager;
  }

  /**
   * Calcule le score pour une métrique donnée
   * @param {string} category - Catégorie (meta, images, headings, etc.)
   * @param {string} metric - Métrique spécifique
   * @param {*} value - Valeur à évaluer
   * @returns {Object} { score, level, message }
   */
  calculateScore(category, metric, value) {
    const config = this.configManager.getConfig(`${category}.${metric}`);

    if (!config) {
      return { score: 5, level: 'unknown', message: 'Configuration non trouvée' };
    }

    // Pour les longueurs de texte
    if (typeof value === 'number' && config.min !== undefined && config.max !== undefined) {
      return this.scoreLengthMetric(value, config);
    }

    // Pour les booléens (présence/absence)
    if (typeof value === 'boolean') {
      return this.scoreBooleanMetric(value, config);
    }

    // Pour les tableaux (comptage)
    if (Array.isArray(value)) {
      return this.scoreArrayMetric(value, config);
    }

    return { score: 5, level: 'neutral', message: 'Métrique non évaluable' };
  }

  /**
   * Score pour les métriques de longueur
   */
  scoreLengthMetric(value, config) {
    const { min, max, score: scoreConfig } = config;

    // Score parfait
    if (scoreConfig?.perfect && value >= scoreConfig.perfect.min && value <= scoreConfig.perfect.max) {
      return {
        score: 5,
        level: 'excellent',
        message: `Parfait (${value} caractères)`,
        details: { value, min, max, range: 'perfect' }
      };
    }

    // Score bon
    if (scoreConfig?.good && value >= scoreConfig.good.min && value <= scoreConfig.good.max) {
      return {
        score: 4,
        level: 'good',
        message: `Bon (${value} caractères)`,
        details: { value, min, max, range: 'good' }
      };
    }

    // Score warning
    if (scoreConfig?.warning && value >= scoreConfig.warning.min && value <= scoreConfig.warning.max) {
      return {
        score: 3,
        level: 'warning',
        message: `Acceptable (${value} caractères)`,
        details: { value, min, max, range: 'warning' }
      };
    }

    // Hors limites
    if (value < min || value > max) {
      const distance = value < min ? min - value : value - max;
      return {
        score: Math.max(0, 2 - Math.floor(distance / 10)),
        level: 'error',
        message: value < min ? `Trop court (${value}/${min} min)` : `Trop long (${value}/${max} max)`,
        details: { value, min, max, range: 'error', distance }
      };
    }

    return {
      score: 3.5,
      level: 'neutral',
      message: `OK (${value} caractères)`,
      details: { value, min, max }
    };
  }

  /**
   * Score pour les métriques booléennes
   */
  scoreBooleanMetric(value, config) {
    if (config.required) {
      return {
        score: value ? 5 : 0,
        level: value ? 'excellent' : 'error',
        message: value ? 'Présent ✓' : 'Absent (requis)',
        details: { value, required: config.required }
      };
    }

    return {
      score: value ? 5 : 3,
      level: value ? 'excellent' : 'warning',
      message: value ? 'Présent ✓' : 'Absent (optionnel)',
      details: { value, required: false }
    };
  }

  /**
   * Score pour les métriques de comptage (tableaux)
   */
  scoreArrayMetric(value, config) {
    const count = value.length;
    const { min, max, recommended } = config;

    if (recommended && count === recommended) {
      return {
        score: 5,
        level: 'excellent',
        message: `Optimal (${count}/${recommended})`,
        details: { count, recommended }
      };
    }

    if (count >= min && count <= max) {
      return {
        score: 4,
        level: 'good',
        message: `Bon (${count})`,
        details: { count, min, max }
      };
    }

    if (count < min) {
      return {
        score: Math.max(0, 2.5 - (min - count) * 0.5),
        level: 'warning',
        message: `Insuffisant (${count}/${min} min)`,
        details: { count, min }
      };
    }

    if (count > max) {
      return {
        score: Math.max(0, 3 - (count - max) * 0.3),
        level: 'warning',
        message: `Trop nombreux (${count}/${max} max)`,
        details: { count, max }
      };
    }

    return {
      score: 3.5,
      level: 'neutral',
      message: `OK (${count})`,
      details: { count }
    };
  }

  /**
   * Calcule le score pour les images
   */
  scoreImage(imageData) {
    const scores = [];

    // Alt text
    if (imageData.alt !== undefined) {
      const altConfig = this.configManager.getConfig('images.alt');
      const hasAlt = imageData.alt && imageData.alt.length > 0;
      const altLength = imageData.alt ? imageData.alt.length : 0;

      if (altConfig.required && !hasAlt) {
        scores.push({
          metric: 'alt',
          score: 0,
          level: 'error',
          message: 'Alt manquant (requis)',
          weight: 1
        });
      } else if (hasAlt) {
        if (altLength < altConfig.minLength) {
          scores.push({
            metric: 'alt',
            score: 2,
            level: 'warning',
            message: `Alt trop court (${altLength}/${altConfig.minLength})`,
            weight: 1
          });
        } else if (altLength > altConfig.maxLength) {
          scores.push({
            metric: 'alt',
            score: 3,
            level: 'warning',
            message: `Alt trop long (${altLength}/${altConfig.maxLength})`,
            weight: 1
          });
        } else {
          scores.push({
            metric: 'alt',
            score: 5,
            level: 'excellent',
            message: 'Alt valide',
            weight: 1
          });
        }
      } else {
        scores.push({
          metric: 'alt',
          score: 3,
          level: 'warning',
          message: 'Alt absent (optionnel)',
          weight: 0.5
        });
      }
    }

    // Poids
    if (imageData.weight !== undefined) {
      const weightConfig = this.configManager.getConfig('images.weight');
      const imageType = imageData.type || 'standard';
      const maxWeight = weightConfig[imageType]?.max || weightConfig.standard.max;
      const recommendedWeight = weightConfig[imageType]?.recommended || weightConfig.standard.recommended;

      if (imageData.weight <= recommendedWeight) {
        scores.push({
          metric: 'weight',
          score: 5,
          level: 'excellent',
          message: `Poids optimal (${this.formatBytes(imageData.weight)})`,
          weight: 1
        });
      } else if (imageData.weight <= maxWeight) {
        const ratio = imageData.weight / recommendedWeight;
        scores.push({
          metric: 'weight',
          score: Math.max(3, 5 - ratio),
          level: 'good',
          message: `Poids acceptable (${this.formatBytes(imageData.weight)})`,
          weight: 1
        });
      } else {
        const ratio = imageData.weight / maxWeight;
        scores.push({
          metric: 'weight',
          score: Math.max(0, 2 - ratio),
          level: 'error',
          message: `Poids excessif (${this.formatBytes(imageData.weight)}/${this.formatBytes(maxWeight)})`,
          weight: 1.2
        });
      }
    }

    // Ratio
    if (imageData.ratio !== undefined) {
      const ratioConfig = this.configManager.getConfig('images.ratio');

      if (imageData.ratio <= ratioConfig.warnAbove) {
        scores.push({
          metric: 'ratio',
          score: 5,
          level: 'excellent',
          message: `Ratio optimal (${imageData.ratio.toFixed(2)})`,
          weight: 1
        });
      } else if (imageData.ratio <= ratioConfig.maxDistortion) {
        scores.push({
          metric: 'ratio',
          score: 3.5,
          level: 'warning',
          message: `Ratio acceptable (${imageData.ratio.toFixed(2)})`,
          weight: 1
        });
      } else {
        scores.push({
          metric: 'ratio',
          score: 1,
          level: 'error',
          message: `Image distordue (${imageData.ratio.toFixed(2)}/${ratioConfig.maxDistortion})`,
          weight: 1.2
        });
      }
    }

    // Format
    if (imageData.format) {
      const formatsConfig = this.configManager.getConfig('images.formats');
      const format = imageData.format.toLowerCase();

      if (formatsConfig.recommended.includes(format)) {
        scores.push({
          metric: 'format',
          score: 5,
          level: 'excellent',
          message: `Format recommandé (${format})`,
          weight: 0.5
        });
      } else if (formatsConfig.warn.includes(format)) {
        scores.push({
          metric: 'format',
          score: 2,
          level: 'warning',
          message: `Format déconseillé (${format})`,
          weight: 0.5
        });
      } else {
        scores.push({
          metric: 'format',
          score: 3.5,
          level: 'neutral',
          message: `Format acceptable (${format})`,
          weight: 0.3
        });
      }
    }

    // Calcul du score global de l'image
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight;

    return {
      globalScore: Number(weightedScore.toFixed(2)),
      scores,
      level: this.getScoreLevel(weightedScore),
      issues: scores.filter(s => s.level === 'error' || s.level === 'warning')
    };
  }

  /**
   * Calcule le score pour un heading
   */
  scoreHeading(headingData, level) {
    const scores = [];
    const config = this.configManager.getConfig(`headings.${level}`) || this.configManager.getConfig('headings.general');

    // Longueur
    if (headingData.length !== undefined) {
      const lengthScore = this.scoreLengthMetric(headingData.length, {
        min: config.minLength,
        max: config.maxLength,
        score: {
          perfect: { min: config.minLength + 5, max: config.maxLength - 5 },
          good: { min: config.minLength, max: config.maxLength },
          warning: { min: config.minLength - 10, max: config.maxLength + 10 }
        }
      });
      scores.push({ ...lengthScore, metric: 'length', weight: 1 });
    }

    // Nombre de mots
    if (headingData.wordCount !== undefined) {
      const wordScore = this.scoreArrayMetric(
        new Array(headingData.wordCount),
        { min: config.minWords, max: config.maxWords }
      );
      scores.push({ ...wordScore, metric: 'wordCount', weight: 0.8 });
    }

    // Calcul score global
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight;

    return {
      globalScore: Number(weightedScore.toFixed(2)),
      scores,
      level: this.getScoreLevel(weightedScore)
    };
  }

  /**
   * Calcule le score global d'une analyse complète
   */
  calculateGlobalScore(analysisResults) {
    const categoryScores = [];
    const weights = this.configManager.getConfig('scoring.weights');

    // Meta tags
    if (analysisResults.meta) {
      const metaScore = this.calculateCategoryScore('meta', analysisResults.meta);
      categoryScores.push({ category: 'meta', score: metaScore, weight: weights.meta });
    }

    // Images
    if (analysisResults.images) {
      const imagesScore = this.calculateCategoryScore('images', analysisResults.images);
      categoryScores.push({ category: 'images', score: imagesScore, weight: weights.images });
    }

    // Headings
    if (analysisResults.headings) {
      const headingsScore = this.calculateCategoryScore('headings', analysisResults.headings);
      categoryScores.push({ category: 'headings', score: headingsScore, weight: weights.headings });
    }

    // Links
    if (analysisResults.links) {
      const linksScore = this.calculateCategoryScore('links', analysisResults.links);
      categoryScores.push({ category: 'links', score: linksScore, weight: weights.links });
    }

    // Typography
    if (analysisResults.typography) {
      const typographyScore = this.calculateCategoryScore('typography', analysisResults.typography);
      categoryScores.push({ category: 'typography', score: typographyScore, weight: weights.typography });
    }

    // Accessibility
    if (analysisResults.accessibility) {
      const accessibilityScore = this.calculateCategoryScore('accessibility', analysisResults.accessibility);
      categoryScores.push({ category: 'accessibility', score: accessibilityScore, weight: weights.accessibility });
    }

    // Performance
    if (analysisResults.performance) {
      const performanceScore = this.calculateCategoryScore('performance', analysisResults.performance);
      categoryScores.push({ category: 'performance', score: performanceScore, weight: weights.performance });
    }

    // Calcul pondéré
    const totalWeight = categoryScores.reduce((sum, cat) => sum + cat.weight, 0);
    const weightedScore = categoryScores.reduce((sum, cat) => sum + (cat.score * cat.weight), 0) / totalWeight;

    const globalScore = Number(weightedScore.toFixed(2));

    return {
      globalScore,
      level: this.getGlobalLevel(globalScore),
      categoryScores,
      summary: this.generateScoreSummary(globalScore, categoryScores)
    };
  }

  /**
   * Calcule le score d'une catégorie
   */
  calculateCategoryScore(category, data) {
    if (!data) return 5;

    // Si le score global est déjà calculé
    if (data.globalScore !== undefined) {
      return data.globalScore;
    }

    // Sinon, calculer à partir des sous-scores
    const scores = [];

    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.score !== undefined) {
          scores.push(item.score);
        }
      });
    } else if (typeof data === 'object') {
      Object.values(data).forEach(value => {
        if (value && value.score !== undefined) {
          scores.push(value.score);
        }
      });
    }

    if (scores.length === 0) return 5;

    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Number(average.toFixed(2));
  }

  /**
   * Détermine le niveau de score
   */
  getScoreLevel(score) {
    const thresholds = this.configManager.getConfig('scoring');

    if (score >= (thresholds?.excellentThreshold || 4.5)) return 'excellent';
    if (score >= (thresholds?.goodThreshold || 4.0)) return 'good';
    if (score >= (thresholds?.passThreshold || 3.5)) return 'pass';
    if (score >= 2.5) return 'warning';
    return 'error';
  }

  /**
   * Détermine le niveau global
   */
  getGlobalLevel(score) {
    const level = this.getScoreLevel(score);
    const labels = {
      excellent: 'Excellent',
      good: 'Bon',
      pass: 'Acceptable',
      warning: 'À améliorer',
      error: 'Problématique'
    };
    return labels[level] || 'Non évalué';
  }

  /**
   * Génère un résumé du score
   */
  generateScoreSummary(globalScore, categoryScores) {
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    categoryScores.forEach(cat => {
      if (cat.score >= 4.5) {
        strengths.push(`${this.getCategoryName(cat.category)} excellent (${cat.score}/5)`);
      } else if (cat.score < 3.5) {
        weaknesses.push(`${this.getCategoryName(cat.category)} à améliorer (${cat.score}/5)`);
        recommendations.push(this.getRecommendation(cat.category, cat.score));
      }
    });

    return {
      globalScore,
      level: this.getGlobalLevel(globalScore),
      strengths,
      weaknesses,
      recommendations: recommendations.filter(r => r),
      message: this.getGlobalMessage(globalScore)
    };
  }

  /**
   * Nom de catégorie en français
   */
  getCategoryName(category) {
    const names = {
      meta: 'Meta tags',
      images: 'Images',
      headings: 'Titres',
      links: 'Liens',
      typography: 'Typographie',
      accessibility: 'Accessibilité',
      performance: 'Performance'
    };
    return names[category] || category;
  }

  /**
   * Recommandation pour une catégorie
   */
  getRecommendation(category, score) {
    const recommendations = {
      meta: 'Optimisez les meta tags (titre et description) selon les longueurs recommandées',
      images: 'Réduisez le poids des images et ajoutez les attributs alt manquants',
      headings: 'Améliorez la structure et la longueur de vos titres (H1-H6)',
      links: 'Vérifiez et corrigez les liens cassés, améliorez la cohérence sémantique',
      typography: 'Ajustez le nombre d\'expressions en gras et le contenu textuel',
      accessibility: 'Améliorez le contraste des couleurs pour respecter WCAG AA/AAA',
      performance: 'Optimisez la vitesse de chargement (images, scripts, ressources)'
    };
    return recommendations[category];
  }

  /**
   * Message global selon le score
   */
  getGlobalMessage(score) {
    if (score >= 4.8) return '🎉 Parfait ! Votre page est excellente sur tous les points.';
    if (score >= 4.5) return '👏 Excellent ! Quelques ajustements mineurs suffiraient.';
    if (score >= 4.0) return '👍 Bon travail ! Améliorez les points faibles identifiés.';
    if (score >= 3.5) return '⚠️ Acceptable, mais des améliorations sont recommandées.';
    if (score >= 2.5) return '⚠️ Attention ! Plusieurs problèmes doivent être corrigés.';
    return '❌ Problématique. Des corrections importantes sont nécessaires.';
  }

  /**
   * Formatte les octets
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Génère un rapport détaillé
   */
  generateDetailedReport(analysisResults) {
    const globalScoreData = this.calculateGlobalScore(analysisResults);

    return {
      timestamp: new Date().toISOString(),
      url: analysisResults.url,
      preset: this.configManager.currentPreset,
      profile: this.configManager.currentProfile,
      globalScore: globalScoreData.globalScore,
      level: globalScoreData.level,
      summary: globalScoreData.summary,
      categories: globalScoreData.categoryScores,
      details: analysisResults,
      configuration: this.configManager.exportConfig()
    };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ScoringEngine = ScoringEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoringEngine;
}
