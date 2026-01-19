/**
 * Accessibility Analyzer Endpoint
 * Analyse de l'accessibilité (WCAG AA/AAA, contraste, ARIA)
 * @version 5.0.0
 */

class AccessibilityAnalyzerEndpoint extends AnalyzerEndpoint {
  constructor(configManager, scoringEngine) {
    super('accessibility-analyzer', configManager, scoringEngine);
  }

  /**
   * Analyse complète de l'accessibilité
   */
  async analyze(pageData, options = {}) {
    const config = this.configManager.getConfig('accessibility');

    const results = {
      contrast: null,
      aria: null,
      semantics: null,
      keyboard: null,
      globalScore: 0,
      wcagLevel: config.contrast?.wcagLevel || 'AA',
      issues: [],
      recommendations: []
    };

    // Analyse du contraste
    if (pageData.contrast) {
      results.contrast = this.analyzeContrast(pageData.contrast, config.contrast);
    }

    // Analyse ARIA
    if (pageData.aria) {
      results.aria = this.analyzeARIA(pageData.aria);
    }

    // Analyse sémantique
    if (pageData.semantics) {
      results.semantics = this.analyzeSemantics(pageData.semantics);
    }

    // Analyse navigation clavier
    if (pageData.keyboard) {
      results.keyboard = this.analyzeKeyboard(pageData.keyboard);
    }

    // Calcul du score global
    results.globalScore = this.calculateGlobalScore(results);

    // Issues et recommandations
    results.issues = this.collectIssues(results);
    results.recommendations = this.generateRecommendations(results, config);

    // Alias WCAG pour compatibilité avec les tests
    results.wcag = {
      level: results.wcagLevel,
      contrastPassing: results.contrast?.summary?.aaPass || 0,
      contrastTotal: results.contrast?.totalElements || 0
    };

    return results;
  }

  /**
   * Analyse du contraste des couleurs
   */
  analyzeContrast(contrastData, config) {
    const elements = contrastData.elements || [];

    const result = {
      totalElements: elements.length,
      analyzed: [],
      summary: {
        aaPass: 0,
        aaaPass: 0,
        aaFail: 0,
        aaaFail: 0,
        highContrast: 0,
        lowContrast: 0
      },
      globalScore: 0
    };

    elements.forEach(elem => {
      const analysis = this.analyzeContrastElement(elem, config);
      result.analyzed.push(analysis);

      // Mise à jour du résumé
      if (analysis.wcag.aa.pass) result.summary.aaPass++;
      else result.summary.aaFail++;

      if (analysis.wcag.aaa.pass) result.summary.aaaPass++;
      else result.summary.aaaFail++;

      if (analysis.ratio >= 7) result.summary.highContrast++;
      if (analysis.ratio < config.minRatio) result.summary.lowContrast++;
    });

    // Score global du contraste
    if (elements.length > 0) {
      const avgScore = result.analyzed.reduce((sum, a) => sum + a.score, 0) / elements.length;
      result.globalScore = Number(avgScore.toFixed(2));
    } else {
      result.globalScore = 5;
    }

    return result;
  }

  /**
   * Analyse un élément de contraste
   */
  analyzeContrastElement(elem, config) {
    const ratio = elem.ratio || elem.contrastRatio || 0;
    const isLarge = elem.isLargeText || elem.fontSize >= 18 || (elem.fontSize >= 14 && elem.bold);

    const analysis = {
      ratio: Number(ratio.toFixed(2)),
      foreground: elem.foreground || elem.color,
      background: elem.background || elem.backgroundColor,
      isLargeText: isLarge,
      wcag: {
        aa: {
          pass: false,
          required: isLarge ? 3 : 4.5,
          level: 'AA'
        },
        aaa: {
          pass: false,
          required: isLarge ? 4.5 : 7,
          level: 'AAA'
        }
      },
      score: 0,
      level: 'error',
      message: ''
    };

    // Vérification WCAG AA
    analysis.wcag.aa.pass = ratio >= analysis.wcag.aa.required;

    // Vérification WCAG AAA
    analysis.wcag.aaa.pass = ratio >= analysis.wcag.aaa.required;

    // Score et niveau
    if (config.checkAAA && analysis.wcag.aaa.pass) {
      analysis.score = 5;
      analysis.level = 'excellent';
      analysis.message = `Excellent contraste (${ratio.toFixed(2)}:1, AAA)`;
    } else if (analysis.wcag.aa.pass) {
      analysis.score = 4;
      analysis.level = 'good';
      analysis.message = `Bon contraste (${ratio.toFixed(2)}:1, AA)`;
    } else if (ratio >= config.minRatio) {
      analysis.score = 2.5;
      analysis.level = 'warning';
      analysis.message = `Contraste faible (${ratio.toFixed(2)}:1)`;
    } else {
      analysis.score = 0;
      analysis.level = 'error';
      analysis.message = `Contraste insuffisant (${ratio.toFixed(2)}:1 < ${analysis.wcag.aa.required}:1)`;
    }

    return analysis;
  }

  /**
   * Analyse des attributs ARIA
   */
  analyzeARIA(ariaData) {
    const elements = ariaData.elements || [];

    const result = {
      totalElements: elements.length,
      summary: {
        valid: 0,
        invalid: 0,
        missing: 0,
        redundant: 0
      },
      issues: [],
      score: 0
    };

    elements.forEach(elem => {
      // ARIA labels
      if (elem.ariaLabel !== undefined) {
        if (elem.ariaLabel && elem.ariaLabel.length > 0) {
          result.summary.valid++;
        } else {
          result.summary.missing++;
          result.issues.push({
            type: 'aria-label',
            element: elem.selector || elem.tag,
            message: 'aria-label vide'
          });
        }
      }

      // Rôles ARIA
      if (elem.role) {
        const validRoles = [
          'navigation', 'main', 'banner', 'contentinfo', 'complementary',
          'search', 'form', 'button', 'link', 'heading', 'list', 'listitem'
        ];

        if (validRoles.includes(elem.role)) {
          result.summary.valid++;
        } else {
          result.summary.invalid++;
          result.issues.push({
            type: 'role',
            element: elem.selector || elem.tag,
            role: elem.role,
            message: `Rôle ARIA invalide: ${elem.role}`
          });
        }
      }

      // Détection de redondances
      if (elem.hasNativeSemantics && elem.role) {
        result.summary.redundant++;
        result.issues.push({
          type: 'redundant',
          element: elem.selector || elem.tag,
          message: 'Rôle ARIA redondant avec sémantique native'
        });
      }
    });

    // Score
    if (elements.length > 0) {
      const validRatio = result.summary.valid / elements.length;
      const invalidRatio = result.summary.invalid / elements.length;
      result.score = Math.max(0, Math.min(5, (validRatio * 5) - (invalidRatio * 2)));
      result.score = Number(result.score.toFixed(2));
    } else {
      result.score = 5;
    }

    return result;
  }

  /**
   * Analyse de la sémantique HTML
   */
  analyzeSemantics(semanticsData) {
    const result = {
      landmarksUsed: false,
      headingStructure: false,
      listsProper: false,
      tablesAccessible: false,
      score: 0,
      issues: []
    };

    // Landmarks HTML5
    const landmarks = semanticsData.landmarks || [];
    const requiredLandmarks = ['header', 'nav', 'main', 'footer'];
    const foundLandmarks = landmarks.map(l => l.tag || l.type);

    requiredLandmarks.forEach(required => {
      if (!foundLandmarks.includes(required)) {
        result.issues.push({
          type: 'landmark',
          message: `Élément sémantique <${required}> manquant`
        });
      }
    });

    result.landmarksUsed = foundLandmarks.length >= 3;

    // Structure des headings (déjà analysée ailleurs, juste vérifier)
    if (semanticsData.headings) {
      result.headingStructure = semanticsData.headings.valid || false;
    }

    // Listes
    if (semanticsData.lists) {
      const improperLists = semanticsData.lists.filter(l => !l.valid);
      result.listsProper = improperLists.length === 0;

      improperLists.forEach(list => {
        result.issues.push({
          type: 'list',
          message: 'Liste mal structurée (li en dehors de ul/ol)'
        });
      });
    }

    // Tables
    if (semanticsData.tables) {
      const inaccessibleTables = semanticsData.tables.filter(t => !t.hasHeaders && !t.hasCaption);
      result.tablesAccessible = inaccessibleTables.length === 0;

      inaccessibleTables.forEach(table => {
        result.issues.push({
          type: 'table',
          message: 'Table sans <th> ni <caption>'
        });
      });
    }

    // Score
    let score = 5;
    if (!result.landmarksUsed) score -= 1.5;
    if (!result.headingStructure) score -= 1;
    if (!result.listsProper) score -= 0.5;
    if (!result.tablesAccessible) score -= 1;

    result.score = Math.max(0, Number(score.toFixed(2)));

    return result;
  }

  /**
   * Analyse de la navigation clavier
   */
  analyzeKeyboard(keyboardData) {
    const result = {
      focusVisible: false,
      tabOrder: false,
      skipLinks: false,
      trapsFocus: false,
      score: 0,
      issues: []
    };

    // Focus visible
    if (keyboardData.focusVisible !== undefined) {
      result.focusVisible = keyboardData.focusVisible;
      if (!result.focusVisible) {
        result.issues.push({
          type: 'focus',
          message: 'Focus clavier non visible (outline supprimé)'
        });
      }
    }

    // Ordre de tabulation logique
    if (keyboardData.tabOrder !== undefined) {
      result.tabOrder = keyboardData.tabOrder.valid || false;
      if (!result.tabOrder) {
        result.issues.push({
          type: 'taborder',
          message: 'Ordre de tabulation incohérent'
        });
      }
    }

    // Skip links
    if (keyboardData.skipLinks !== undefined) {
      result.skipLinks = keyboardData.skipLinks.present || false;
      if (!result.skipLinks) {
        result.issues.push({
          type: 'skiplinks',
          message: 'Pas de lien "Aller au contenu"'
        });
      }
    }

    // Pièges à focus
    if (keyboardData.focusTraps) {
      result.trapsFocus = keyboardData.focusTraps.length > 0;
      if (result.trapsFocus) {
        result.issues.push({
          type: 'focustrap',
          message: `${keyboardData.focusTraps.length} piège(s) à focus détecté(s)`
        });
      }
    }

    // Score
    let score = 5;
    if (!result.focusVisible) score -= 2;
    if (!result.tabOrder) score -= 1.5;
    if (!result.skipLinks) score -= 0.5;
    if (result.trapsFocus) score -= 2;

    result.score = Math.max(0, Number(score.toFixed(2)));

    return result;
  }

  /**
   * Calcul du score global
   */
  calculateGlobalScore(results) {
    const scores = [];

    if (results.contrast) scores.push(results.contrast.globalScore);
    if (results.aria) scores.push(results.aria.score);
    if (results.semantics) scores.push(results.semantics.score);
    if (results.keyboard) scores.push(results.keyboard.score);

    if (scores.length === 0) return 5;

    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Number(avg.toFixed(2));
  }

  /**
   * Collecte les issues
   */
  collectIssues(results) {
    const issues = [];

    // Contraste
    if (results.contrast && results.contrast.summary.aaFail > 0) {
      issues.push({
        type: 'contrast',
        severity: 'error',
        count: results.contrast.summary.aaFail,
        message: `${results.contrast.summary.aaFail} élément(s) avec contraste insuffisant (WCAG AA)`
      });
    }

    // ARIA
    if (results.aria && results.aria.summary.invalid > 0) {
      issues.push({
        type: 'aria',
        severity: 'error',
        count: results.aria.summary.invalid,
        message: `${results.aria.summary.invalid} attribut(s) ARIA invalide(s)`
      });
    }

    // Sémantique
    if (results.semantics && results.semantics.issues.length > 0) {
      issues.push({
        type: 'semantics',
        severity: 'warning',
        count: results.semantics.issues.length,
        message: `${results.semantics.issues.length} problème(s) de sémantique HTML`
      });
    }

    // Clavier
    if (results.keyboard && results.keyboard.issues.length > 0) {
      issues.push({
        type: 'keyboard',
        severity: 'error',
        count: results.keyboard.issues.length,
        message: `${results.keyboard.issues.length} problème(s) de navigation clavier`
      });
    }

    return issues;
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(results, config) {
    const recommendations = [];

    // Contraste
    if (results.contrast && results.contrast.summary.lowContrast > 0) {
      recommendations.push({
        type: 'contrast',
        priority: 'high',
        message: 'Améliorez le contraste des couleurs',
        impact: `Respecter WCAG ${config.wcagLevel || 'AA'} améliore la lisibilité pour tous`,
        effort: 'Moyen',
        wcagLevel: config.wcagLevel || 'AA'
      });
    }

    // ARIA
    if (results.aria && (results.aria.summary.invalid > 0 || results.aria.summary.missing > 0)) {
      recommendations.push({
        type: 'aria',
        priority: 'high',
        message: 'Corrigez les attributs ARIA',
        impact: 'Améliore l\'accessibilité pour lecteurs d\'écran',
        effort: 'Moyen'
      });
    }

    // Sémantique
    if (results.semantics && !results.semantics.landmarksUsed) {
      recommendations.push({
        type: 'semantics',
        priority: 'medium',
        message: 'Utilisez les éléments sémantiques HTML5',
        impact: 'Améliore la navigation et le SEO',
        effort: 'Facile',
        example: '<header>, <nav>, <main>, <footer>'
      });
    }

    // Clavier
    if (results.keyboard && !results.keyboard.focusVisible) {
      recommendations.push({
        type: 'keyboard',
        priority: 'high',
        message: 'Rendez le focus clavier visible',
        impact: 'Essentiel pour navigation au clavier',
        effort: 'Facile',
        action: 'Ne pas supprimer outline sur :focus'
      });
    }

    // Bon score
    if (results.globalScore >= 4.5) {
      recommendations.push({
        type: 'success',
        priority: 'low',
        message: '✓ Excellente accessibilité !',
        impact: 'Votre site est accessible à tous'
      });
    }

    return recommendations;
  }

  /**
   * Génère un rapport WCAG
   */
  generateWCAGReport(results) {
    const wcagLevel = results.wcagLevel;

    return {
      level: wcagLevel,
      compliance: results.globalScore >= 4.5 ? 'compliant' : results.globalScore >= 3.5 ? 'partial' : 'non-compliant',
      score: results.globalScore,
      criteria: {
        perceivable: results.contrast?.globalScore || 0,
        operable: results.keyboard?.score || 0,
        understandable: results.semantics?.score || 0,
        robust: results.aria?.score || 0
      },
      totalIssues: results.issues.length,
      criticalIssues: results.issues.filter(i => i.severity === 'error').length
    };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.AccessibilityAnalyzerEndpoint = AccessibilityAnalyzerEndpoint;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityAnalyzerEndpoint;
}
