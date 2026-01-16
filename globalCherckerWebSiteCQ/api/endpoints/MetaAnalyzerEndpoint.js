/**
 * Meta Analyzer Endpoint
 * Analyse des balises meta (title, description)
 * @version 5.0.0
 */

class MetaAnalyzerEndpoint extends AnalyzerEndpoint {
  constructor(configManager, scoringEngine) {
    super('meta-analyzer', configManager, scoringEngine);
  }

  /**
   * Analyse les meta tags
   */
  async analyze(pageData, options = {}) {
    const config = this.configManager.getConfig('meta');
    const results = {
      title: null,
      description: null,
      globalScore: 0,
      issues: [],
      recommendations: []
    };

    // Analyse du titre
    if (pageData.meta?.title !== undefined) {
      results.title = this.analyzeTitle(pageData.meta.title, config.title);
    } else {
      results.issues.push({
        type: 'missing',
        field: 'title',
        severity: 'error',
        message: 'Balise <title> manquante'
      });
      results.title = {
        value: null,
        length: 0,
        score: 0,
        level: 'error',
        message: 'Titre manquant'
      };
    }

    // Analyse de la description
    if (pageData.meta?.description !== undefined) {
      results.description = this.analyzeDescription(pageData.meta.description, config.description);
    } else {
      results.issues.push({
        type: 'missing',
        field: 'description',
        severity: config.description.required ? 'error' : 'warning',
        message: 'Meta description manquante'
      });
      results.description = {
        value: null,
        length: 0,
        score: config.description.required ? 0 : 3,
        level: config.description.required ? 'error' : 'warning',
        message: 'Description manquante'
      };
    }

    // Calcul du score global
    results.globalScore = Number(
      ((results.title.score + results.description.score) / 2).toFixed(2)
    );

    // Recommandations
    results.recommendations = this.generateRecommendations(results, config);

    return results;
  }

  /**
   * Analyse le titre
   */
  analyzeTitle(title, config) {
    const length = title ? title.length : 0;
    const scoreData = this.scoringEngine.scoreLengthMetric(length, config);

    const result = {
      value: title,
      length,
      ...scoreData,
      analysis: {
        hasNumbers: /\d/.test(title),
        hasSpecialChars: /[!?|•]/.test(title),
        hasBrand: this.detectBrand(title),
        hasKeywords: this.detectKeywords(title),
        structure: this.analyzeStructure(title)
      }
    };

    // Vérifications supplémentaires
    if (title) {
      if (title.startsWith(' ') || title.endsWith(' ')) {
        result.warnings = result.warnings || [];
        result.warnings.push('Espaces inutiles au début/fin');
      }
      if (title.toUpperCase() === title && title.length > 10) {
        result.warnings = result.warnings || [];
        result.warnings.push('Tout en majuscules (déconseillé)');
      }
      if (!title.match(/[a-zA-Z]/)) {
        result.warnings = result.warnings || [];
        result.warnings.push('Aucune lettre détectée');
      }
    }

    return result;
  }

  /**
   * Analyse la description
   */
  analyzeDescription(description, config) {
    const length = description ? description.length : 0;
    const scoreData = this.scoringEngine.scoreLengthMetric(length, config);

    const result = {
      value: description,
      length,
      ...scoreData,
      analysis: {
        hasCallToAction: this.detectCTA(description),
        hasKeywords: this.detectKeywords(description),
        readability: this.calculateReadability(description),
        sentenceCount: this.countSentences(description)
      }
    };

    // Vérifications supplémentaires
    if (description) {
      if (description.startsWith(' ') || description.endsWith(' ')) {
        result.warnings = result.warnings || [];
        result.warnings.push('Espaces inutiles au début/fin');
      }
      if (!description.match(/[.!?]$/)) {
        result.warnings = result.warnings || [];
        result.warnings.push('Pas de ponctuation finale');
      }
      if (description === description.toUpperCase() && description.length > 20) {
        result.warnings = result.warnings || [];
        result.warnings.push('Tout en majuscules (déconseillé)');
      }
    }

    return result;
  }

  /**
   * Détecte une marque
   */
  detectBrand(text) {
    if (!text) return false;
    // Patterns courants : "Site | Brand", "Brand - Site", etc.
    return /[|•\-–—]/.test(text);
  }

  /**
   * Détecte des mots-clés
   */
  detectKeywords(text) {
    if (!text) return [];
    // Extraction simple - peut être amélioré avec NLP
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(w => w.length >= 4 && !this.isStopWord(w));
  }

  /**
   * Détecte un call-to-action
   */
  detectCTA(text) {
    if (!text) return false;
    const ctaPatterns = [
      /découvr(ez|ir)/i,
      /achete[rz]/i,
      /commande[rz]/i,
      /contacte[rz]/i,
      /appele[rz]/i,
      /demande[rz]/i,
      /obteni[rz]/i,
      /profite[rz]/i,
      /économise[rz]/i,
      /réserve[rz]/i
    ];
    return ctaPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calcule la lisibilité (simple)
   */
  calculateReadability(text) {
    if (!text) return 0;
    const words = text.split(/\s+/).length;
    const sentences = this.countSentences(text);
    const avgWordsPerSentence = sentences > 0 ? words / sentences : words;

    // Score simple : idéal = 15-20 mots par phrase
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) return 'excellent';
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) return 'good';
    if (avgWordsPerSentence < 8 || avgWordsPerSentence > 30) return 'poor';
    return 'fair';
  }

  /**
   * Compte les phrases
   */
  countSentences(text) {
    if (!text) return 0;
    return (text.match(/[.!?]+/g) || []).length;
  }

  /**
   * Vérifie si c'est un stop word
   */
  isStopWord(word) {
    const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car'];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Analyse la structure du titre
   */
  analyzeStructure(title) {
    if (!title) return null;

    const structure = {
      hasSeparator: /[|•\-–—]/.test(title),
      parts: [],
      format: 'simple'
    };

    if (structure.hasSeparator) {
      structure.parts = title.split(/[|•\-–—]/).map(p => p.trim());
      if (structure.parts.length === 2) {
        structure.format = 'title_brand';
      } else if (structure.parts.length > 2) {
        structure.format = 'complex';
      }
    } else {
      structure.parts = [title];
    }

    return structure;
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(results, config) {
    const recommendations = [];

    // Titre
    if (results.title) {
      if (results.title.length < config.title.min) {
        recommendations.push({
          type: 'title',
          priority: 'high',
          message: `Rallongez le titre (${results.title.length}/${config.title.min} min)`,
          suggestion: `Ajoutez ${config.title.min - results.title.length} caractères pour atteindre la longueur minimale`
        });
      } else if (results.title.length > config.title.max) {
        recommendations.push({
          type: 'title',
          priority: 'high',
          message: `Raccourcissez le titre (${results.title.length}/${config.title.max} max)`,
          suggestion: `Supprimez ${results.title.length - config.title.max} caractères pour respecter la limite`
        });
      }

      if (results.title.value && !results.title.analysis.hasBrand) {
        recommendations.push({
          type: 'title',
          priority: 'medium',
          message: 'Ajoutez votre marque dans le titre',
          suggestion: 'Format recommandé : "Page Title | Nom de la marque"'
        });
      }
    }

    // Description
    if (results.description) {
      if (results.description.length < config.description.min) {
        recommendations.push({
          type: 'description',
          priority: 'high',
          message: `Rallongez la description (${results.description.length}/${config.description.min} min)`,
          suggestion: `Ajoutez ${config.description.min - results.description.length} caractères`
        });
      } else if (results.description.length > config.description.max) {
        recommendations.push({
          type: 'description',
          priority: 'high',
          message: `Raccourcissez la description (${results.description.length}/${config.description.max} max)`,
          suggestion: `Supprimez ${results.description.length - config.description.max} caractères`
        });
      }

      if (results.description.value && !results.description.analysis.hasCallToAction) {
        recommendations.push({
          type: 'description',
          priority: 'medium',
          message: 'Ajoutez un appel à l\'action',
          suggestion: 'Utilisez des verbes d\'action : découvrez, achetez, contactez, etc.'
        });
      }
    }

    // Score global faible
    if (results.globalScore < 3.5) {
      recommendations.push({
        type: 'global',
        priority: 'high',
        message: 'Optimisez vos meta tags pour améliorer le SEO',
        suggestion: 'Les meta tags sont essentiels pour le référencement Google'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Génère un exemple optimisé
   */
  generateOptimizedExample(currentData, config) {
    const examples = {
      title: null,
      description: null
    };

    // Exemple de titre
    if (currentData.title?.value) {
      const targetLength = Math.floor((config.title.min + config.title.max) / 2);
      examples.title = this.adjustTextLength(currentData.title.value, targetLength);
    }

    // Exemple de description
    if (currentData.description?.value) {
      const targetLength = Math.floor((config.description.min + config.description.max) / 2);
      examples.description = this.adjustTextLength(currentData.description.value, targetLength);
    }

    return examples;
  }

  /**
   * Ajuste la longueur d'un texte
   */
  adjustTextLength(text, targetLength) {
    if (!text) return '';
    if (text.length === targetLength) return text;

    if (text.length > targetLength) {
      // Raccourcir
      return text.substring(0, targetLength - 3) + '...';
    } else {
      // Suggestions pour rallonger
      return `${text} (ajoutez environ ${targetLength - text.length} caractères)`;
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.MetaAnalyzerEndpoint = MetaAnalyzerEndpoint;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetaAnalyzerEndpoint;
}
