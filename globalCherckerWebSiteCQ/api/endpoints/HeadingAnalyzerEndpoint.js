/**
 * Heading Analyzer Endpoint
 * Analyse de la structure H1-H6 et hiérarchie
 * @version 5.0.0
 */

class HeadingAnalyzerEndpoint extends AnalyzerEndpoint {
  constructor(configManager, scoringEngine) {
    super('heading-analyzer', configManager, scoringEngine);
  }

  /**
   * Analyse tous les headings
   */
  async analyze(pageData, options = {}) {
    const config = this.configManager.getConfig('headings');
    const headings = pageData.headings || [];

    const results = {
      totalHeadings: headings.length,
      byLevel: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
      hierarchy: null,
      outline: [],
      globalScore: 0,
      issues: [],
      recommendations: []
    };

    // Grouper par niveau
    headings.forEach(h => {
      const level = h.level.toLowerCase();
      if (results.byLevel[level]) {
        results.byLevel[level].push(h);
      }
    });

    // Analyser chaque heading
    for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      results.byLevel[level] = results.byLevel[level].map(h =>
        this.analyzeHeading(h, level, config)
      );
    }

    // Analyser la hiérarchie
    results.hierarchy = this.analyzeHierarchy(headings, config.general);

    // Générer l'outline
    results.outline = this.generateOutline(headings);

    // Calcul du score global
    results.globalScore = this.calculateGlobalScore(results, config);

    // Issues et recommandations
    results.issues = this.collectIssues(results, config);
    results.recommendations = this.generateRecommendations(results, config);

    return results;
  }

  /**
   * Analyse un heading individuel
   */
  analyzeHeading(heading, level, config) {
    const levelConfig = config[level] || config.general;
    const text = heading.text || '';
    const length = text.length;
    const words = text.split(/\s+/).filter(w => w.length > 0);

    const analysis = {
      level,
      text,
      length,
      wordCount: words.length,
      score: 0,
      issues: [],
      warnings: []
    };

    // Vérifier la longueur
    if (levelConfig.minLength && length < levelConfig.minLength) {
      analysis.issues.push(`Trop court (${length}/${levelConfig.minLength})`);
      analysis.score -= 1;
    } else if (levelConfig.maxLength && length > levelConfig.maxLength) {
      analysis.issues.push(`Trop long (${length}/${levelConfig.maxLength})`);
      analysis.score -= 0.5;
    } else {
      analysis.score += 2;
    }

    // Vérifier le nombre de mots
    if (levelConfig.minWords && words.length < levelConfig.minWords) {
      analysis.warnings.push(`Peu de mots (${words.length}/${levelConfig.minWords})`);
      analysis.score -= 0.5;
    } else if (levelConfig.maxWords && words.length > levelConfig.maxWords) {
      analysis.warnings.push(`Trop de mots (${words.length}/${levelConfig.maxWords})`);
      analysis.score -= 0.3;
    } else {
      analysis.score += 2;
    }

    // Vérifications de qualité
    if (text.toUpperCase() === text && text.length > 10) {
      analysis.warnings.push('Tout en majuscules');
      analysis.score -= 0.3;
    }

    if (text.endsWith('...') || text.endsWith('…')) {
      analysis.warnings.push('Points de suspension');
    }

    // Détection de balises HTML dans le texte
    if (/<[^>]+>/.test(text)) {
      analysis.warnings.push('Balises HTML détectées');
      analysis.score -= 0.5;
    }

    // Détection de line breaks
    if (heading.hasLineBreak) {
      analysis.warnings.push('Titre scindé (line break)');
      analysis.score -= 0.5;
    }

    // Score final
    analysis.score = Math.max(0, Math.min(5, analysis.score + 1));
    analysis.level = this.getScoreLevel(analysis.score);

    return analysis;
  }

  /**
   * Analyse la hiérarchie
   */
  analyzeHierarchy(headings, generalConfig) {
    const hierarchy = {
      valid: true,
      errors: [],
      warnings: [],
      score: 5
    };

    if (headings.length === 0) {
      hierarchy.valid = false;
      hierarchy.errors.push('Aucun titre trouvé');
      hierarchy.score = 0;
      return hierarchy;
    }

    // Vérifier le H1
    const h1s = headings.filter(h => h.level === 'h1');
    if (h1s.length === 0) {
      hierarchy.valid = false;
      hierarchy.errors.push('Aucun H1 trouvé');
      hierarchy.score -= 2;
    } else if (h1s.length > 1) {
      hierarchy.valid = false;
      hierarchy.errors.push(`${h1s.length} H1 trouvés (1 maximum recommandé)`);
      hierarchy.score -= 1.5;
    }

    // Vérifier la séquence
    if (generalConfig.checkHierarchy) {
      let previousLevel = 0;

      headings.forEach((heading, index) => {
        const currentLevel = parseInt(heading.level.substring(1));

        if (currentLevel > previousLevel + 1 && !generalConfig.allowSkipLevels) {
          hierarchy.errors.push(
            `Saut de niveau détecté: ${heading.level} après H${previousLevel} (position ${index + 1})`
          );
          hierarchy.valid = false;
          hierarchy.score -= 0.5;
        }

        previousLevel = currentLevel;
      });
    }

    // Vérifier la distribution
    const distribution = this.getDistribution(headings);
    if (distribution.h2 === 0 && distribution.h3 > 0) {
      hierarchy.warnings.push('H3 sans H2 parent');
      hierarchy.score -= 0.3;
    }

    hierarchy.score = Math.max(0, hierarchy.score);
    return hierarchy;
  }

  /**
   * Génère l'outline
   */
  generateOutline(headings) {
    const outline = [];
    const stack = [{ level: 0, children: outline }];

    headings.forEach(heading => {
      const level = parseInt(heading.level.substring(1));
      const item = {
        level: heading.level,
        text: heading.text,
        length: heading.text.length,
        children: []
      };

      // Trouver le parent approprié
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      // Ajouter au parent
      stack[stack.length - 1].children.push(item);

      // Empiler pour les futurs enfants
      stack.push({ level, children: item.children });
    });

    return outline;
  }

  /**
   * Calcule le score global
   */
  calculateGlobalScore(results, config) {
    let totalScore = 0;
    let count = 0;

    // Score de hiérarchie (poids: 40%)
    totalScore += results.hierarchy.score * 0.4;
    count += 0.4;

    // Score des headings individuels (poids: 60%)
    for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      if (results.byLevel[level].length > 0) {
        const avgScore = results.byLevel[level].reduce((sum, h) => sum + h.score, 0) / results.byLevel[level].length;
        totalScore += avgScore * 0.6 * (level === 'h1' ? 1.5 : level === 'h2' ? 1.2 : 1);
        count += 0.6 * (level === 'h1' ? 1.5 : level === 'h2' ? 1.2 : 1);
      }
    }

    return count > 0 ? Number((totalScore / count).toFixed(2)) : 5;
  }

  /**
   * Collecte les issues
   */
  collectIssues(results, config) {
    const issues = [];

    // Issues de hiérarchie
    results.hierarchy.errors.forEach(error => {
      issues.push({
        type: 'hierarchy',
        severity: 'error',
        message: error
      });
    });

    results.hierarchy.warnings.forEach(warning => {
      issues.push({
        type: 'hierarchy',
        severity: 'warning',
        message: warning
      });
    });

    // Issues par niveau
    for (const level of ['h1', 'h2', 'h3']) {
      const headings = results.byLevel[level];
      const badHeadings = headings.filter(h => h.score < 3);

      if (badHeadings.length > 0) {
        issues.push({
          type: level,
          severity: level === 'h1' ? 'error' : 'warning',
          count: badHeadings.length,
          message: `${badHeadings.length} ${level.toUpperCase()} problématique(s)`
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

    // H1
    if (results.byLevel.h1.length === 0) {
      recommendations.push({
        type: 'h1',
        priority: 'high',
        message: 'Ajoutez un H1 unique à votre page',
        impact: 'Essentiel pour le SEO et l\'accessibilité',
        effort: 'Facile'
      });
    } else if (results.byLevel.h1.length > 1) {
      recommendations.push({
        type: 'h1',
        priority: 'high',
        message: 'Utilisez un seul H1 par page',
        impact: 'Améliore la structure sémantique',
        effort: 'Facile',
        action: `Convertir ${results.byLevel.h1.length - 1} H1 en H2`
      });
    }

    // Hiérarchie
    if (!results.hierarchy.valid) {
      recommendations.push({
        type: 'hierarchy',
        priority: 'high',
        message: 'Corrigez la hiérarchie des titres',
        impact: 'Améliore l\'accessibilité et le SEO',
        effort: 'Moyen',
        details: results.hierarchy.errors
      });
    }

    // Longueur des titres
    const longHeadings = Object.values(results.byLevel)
      .flat()
      .filter(h => h.length > 90);

    if (longHeadings.length > 0) {
      recommendations.push({
        type: 'length',
        priority: 'medium',
        message: 'Raccourcissez les titres trop longs',
        impact: 'Améliore la lisibilité',
        effort: 'Facile',
        count: longHeadings.length
      });
    }

    // Distribution
    const distribution = this.getDistribution(Object.values(results.byLevel).flat().map(h => ({ level: h.level })));
    if (distribution.h2 < 2 && results.totalHeadings > 3) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        message: 'Ajoutez plus de H2 pour structurer votre contenu',
        impact: 'Améliore la navigation et le SEO',
        effort: 'Moyen'
      });
    }

    return recommendations;
  }

  /**
   * Distribution des headings
   */
  getDistribution(headings) {
    return {
      h1: headings.filter(h => h.level === 'h1').length,
      h2: headings.filter(h => h.level === 'h2').length,
      h3: headings.filter(h => h.level === 'h3').length,
      h4: headings.filter(h => h.level === 'h4').length,
      h5: headings.filter(h => h.level === 'h5').length,
      h6: headings.filter(h => h.level === 'h6').length
    };
  }

  /**
   * Niveau de score
   */
  getScoreLevel(score) {
    if (score >= 4.5) return 'excellent';
    if (score >= 4) return 'good';
    if (score >= 3) return 'warning';
    return 'error';
  }
}

// Export
if (typeof window !== 'undefined') {
  window.HeadingAnalyzerEndpoint = HeadingAnalyzerEndpoint;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeadingAnalyzerEndpoint;
}
