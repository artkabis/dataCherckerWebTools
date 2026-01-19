/**
 * Link Analyzer Endpoint
 * Analyse des liens (validité, broken links, duplicate, sémantique)
 * @version 5.0.0
 */

class LinkAnalyzerEndpoint extends AnalyzerEndpoint {
  constructor(configManager, scoringEngine) {
    super('link-analyzer', configManager, scoringEngine);
  }

  /**
   * Analyse tous les liens
   */
  async analyze(pageData, options = {}) {
    const config = this.configManager.getConfig('links');
    const links = pageData.links || [];

    const results = {
      totalLinks: links.length,
      analyzed: [],
      summary: {
        valid: 0,
        broken: 0,
        duplicate: 0,
        external: 0,
        internal: 0,
        semanticIssues: 0
      },
      duplicates: new Map(),
      globalScore: 0,
      issues: [],
      recommendations: []
    };

    // Détecter les doublons
    const urlCounts = new Map();
    links.forEach(link => {
      const url = link.href || link.url;
      if (url) {
        urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
      }
    });

    // Analyser chaque lien
    for (const link of links) {
      const analysis = await this.analyzeLink(link, config, urlCounts);
      results.analyzed.push(analysis);

      // Mettre à jour le résumé
      if (analysis.status?.valid) results.summary.valid++;
      if (analysis.status?.broken) results.summary.broken++;
      if (analysis.duplicate) results.summary.duplicate++;
      if (analysis.type === 'external') results.summary.external++;
      if (analysis.type === 'internal') results.summary.internal++;
      if (analysis.semantic?.issues > 0) results.summary.semanticIssues++;
    }

    // Calcul du score global
    if (results.analyzed.length > 0) {
      const avgScore = results.analyzed.reduce((sum, link) => sum + link.score, 0) / results.analyzed.length;
      results.globalScore = Number(avgScore.toFixed(2));
    } else {
      results.globalScore = 5; // Pas de liens = pas de problème
    }

    // Issues et recommandations
    results.issues = this.collectIssues(results);
    results.recommendations = this.generateRecommendations(results, config);

    // Alias pour compatibilité avec les tests
    results.byType = {
      internal: results.summary.internal,
      external: results.summary.external
    };

    // Liste des liens cassés
    results.broken = results.analyzed.filter(link => link.status?.broken);

    return results;
  }

  /**
   * Analyse un lien individuel
   */
  async analyzeLink(linkData, config, urlCounts) {
    const url = linkData.href || linkData.url || '';
    const text = linkData.text || linkData.anchorText || '';

    const analysis = {
      url,
      text,
      type: this.getLinkType(url, linkData.type),
      status: null,
      duplicate: (urlCounts.get(url) || 0) > 1,
      duplicateCount: urlCounts.get(url) || 0,
      semantic: null,
      score: 5,
      issues: []
    };

    // Analyse du statut (validité)
    analysis.status = this.analyzeStatus(linkData, config);
    if (!analysis.status.valid) {
      analysis.score -= 2;
      analysis.issues.push({
        type: 'status',
        severity: 'error',
        message: analysis.status.message
      });
    }

    // Pénalité pour doublons
    if (analysis.duplicate && config.checkDuplicates) {
      analysis.score -= 0.5;
      analysis.issues.push({
        type: 'duplicate',
        severity: 'warning',
        message: `Lien dupliqué (${analysis.duplicateCount} fois)`
      });
    }

    // Analyse sémantique si activée
    if (config.semanticAnalysis && text && linkData.destinationTitle) {
      analysis.semantic = this.analyzeSemanticCoherence(text, linkData.destinationTitle);
      if (analysis.semantic.coherence < 0.5) {
        analysis.score -= 1;
        analysis.issues.push({
          type: 'semantic',
          severity: 'warning',
          message: `Faible cohérence sémantique (${(analysis.semantic.coherence * 100).toFixed(0)}%)`
        });
      }
    }

    // Texte du lien vide ou générique
    if (!text || text.trim().length === 0) {
      analysis.score -= 1.5;
      analysis.issues.push({
        type: 'text',
        severity: 'error',
        message: 'Texte de lien vide'
      });
    } else if (this.isGenericText(text)) {
      analysis.score -= 0.5;
      analysis.issues.push({
        type: 'text',
        severity: 'warning',
        message: 'Texte générique ("cliquez ici", "lire la suite"...)'
      });
    }

    // Bonus pour liens descriptifs
    if (text && text.length >= 20 && text.length <= 100) {
      analysis.score = Math.min(5, analysis.score + 0.5);
    }

    // Normaliser le score
    analysis.score = Math.max(0, Math.min(5, Number(analysis.score.toFixed(2))));
    analysis.level = this.getScoreLevel(analysis.score);

    return analysis;
  }

  /**
   * Analyse le statut du lien
   */
  analyzeStatus(linkData, config) {
    const status = linkData.status || linkData.httpStatus;

    const result = {
      code: status,
      valid: false,
      broken: false,
      message: 'Non vérifié'
    };

    if (status === undefined || status === null) {
      result.valid = true; // Considéré valide si non vérifié
      result.message = 'Statut non vérifié';
      return result;
    }

    if (status >= 200 && status < 300) {
      result.valid = true;
      result.message = `OK (${status})`;
    } else if (status >= 300 && status < 400) {
      result.valid = true;
      result.message = `Redirection (${status})`;
    } else if (status >= 400 && status < 500) {
      result.broken = true;
      result.message = `Erreur client (${status})`;
    } else if (status >= 500) {
      result.broken = true;
      result.message = `Erreur serveur (${status})`;
    } else {
      result.message = `Statut inconnu (${status})`;
    }

    return result;
  }

  /**
   * Détermine le type de lien
   */
  getLinkType(url, providedType) {
    if (providedType) return providedType;

    if (!url) return 'unknown';

    // Lien externe
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Vérifier si c'est le même domaine
      try {
        const linkDomain = new URL(url).hostname;
        const currentDomain = window.location?.hostname || '';
        return linkDomain === currentDomain ? 'internal' : 'external';
      } catch (e) {
        return 'external';
      }
    }

    // Lien ancre
    if (url.startsWith('#')) return 'anchor';

    // Lien relatif
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return 'internal';
    }

    // Lien mail/tel
    if (url.startsWith('mailto:')) return 'email';
    if (url.startsWith('tel:')) return 'phone';

    return 'internal';
  }

  /**
   * Analyse la cohérence sémantique
   */
  analyzeSemanticCoherence(anchorText, destinationTitle) {
    if (!anchorText || !destinationTitle) {
      return {
        coherence: 0,
        matches: [],
        score: 0
      };
    }

    // Normaliser les textes
    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
    };

    const anchorWords = normalizeText(anchorText);
    const titleWords = normalizeText(destinationTitle);

    // Compter les mots en commun
    const matches = anchorWords.filter(word => titleWords.includes(word));
    const coherence = matches.length / Math.max(anchorWords.length, 1);

    return {
      coherence: Number(coherence.toFixed(2)),
      matches,
      score: coherence >= 0.7 ? 5 : coherence >= 0.5 ? 4 : coherence >= 0.3 ? 3 : 2
    };
  }

  /**
   * Vérifie si le texte est générique
   */
  isGenericText(text) {
    const genericTexts = [
      'cliquez ici',
      'click here',
      'lire la suite',
      'en savoir plus',
      'voir plus',
      'plus',
      'ici',
      'here',
      'read more',
      'more',
      'suite',
      'voir',
      'lire',
      'découvrir'
    ];

    const normalized = text.toLowerCase().trim();
    return genericTexts.some(generic => normalized === generic || normalized.includes(generic));
  }

  /**
   * Collecte les issues
   */
  collectIssues(results) {
    const issues = [];

    // Liens cassés
    if (results.summary.broken > 0) {
      issues.push({
        type: 'broken',
        severity: 'error',
        count: results.summary.broken,
        message: `${results.summary.broken} lien(s) cassé(s)`
      });
    }

    // Doublons
    if (results.summary.duplicate > 0) {
      issues.push({
        type: 'duplicate',
        severity: 'warning',
        count: results.summary.duplicate,
        message: `${results.summary.duplicate} lien(s) en double`
      });
    }

    // Problèmes sémantiques
    if (results.summary.semanticIssues > 0) {
      issues.push({
        type: 'semantic',
        severity: 'warning',
        count: results.summary.semanticIssues,
        message: `${results.summary.semanticIssues} lien(s) avec faible cohérence sémantique`
      });
    }

    // Liens sans texte
    const emptyTextLinks = results.analyzed.filter(l =>
      l.issues.some(i => i.type === 'text' && i.severity === 'error')
    );
    if (emptyTextLinks.length > 0) {
      issues.push({
        type: 'text',
        severity: 'error',
        count: emptyTextLinks.length,
        message: `${emptyTextLinks.length} lien(s) sans texte`
      });
    }

    return issues;
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(results, config) {
    const recommendations = [];

    // Liens cassés
    if (results.summary.broken > 0) {
      recommendations.push({
        type: 'broken',
        priority: 'high',
        message: 'Corrigez les liens cassés',
        impact: 'Améliore l\'expérience utilisateur et le SEO',
        effort: 'Moyen',
        action: `Vérifier et corriger ${results.summary.broken} lien(s)`
      });
    }

    // Doublons
    if (results.summary.duplicate > 0) {
      recommendations.push({
        type: 'duplicate',
        priority: 'medium',
        message: 'Supprimez les liens en double',
        impact: 'Améliore la clarté et réduit la confusion',
        effort: 'Facile'
      });
    }

    // Problèmes sémantiques
    if (results.summary.semanticIssues > 0) {
      recommendations.push({
        type: 'semantic',
        priority: 'medium',
        message: 'Améliorez la cohérence entre texte de lien et destination',
        impact: 'Améliore l\'accessibilité et l\'expérience utilisateur',
        effort: 'Moyen',
        example: 'Au lieu de "cliquez ici", utilisez "Voir nos services de plomberie"'
      });
    }

    // Textes génériques
    const genericLinks = results.analyzed.filter(l =>
      l.issues.some(i => i.type === 'text' && i.message.includes('générique'))
    );
    if (genericLinks.length > 0) {
      recommendations.push({
        type: 'text',
        priority: 'medium',
        message: 'Utilisez des textes de liens descriptifs',
        impact: 'Améliore l\'accessibilité et le SEO',
        effort: 'Facile',
        count: genericLinks.length
      });
    }

    // Bon score général
    if (results.globalScore >= 4.5 && results.totalLinks > 0) {
      recommendations.push({
        type: 'success',
        priority: 'low',
        message: '✓ Excellente qualité des liens !',
        impact: 'Continuez sur cette voie'
      });
    }

    return recommendations;
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

  /**
   * Génère un rapport de liens cassés
   */
  generateBrokenLinksReport(results) {
    const brokenLinks = results.analyzed.filter(l => l.status?.broken);

    return {
      totalBroken: brokenLinks.length,
      links: brokenLinks.map(l => ({
        url: l.url,
        text: l.text,
        status: l.status.code,
        type: l.type
      })),
      priority: brokenLinks.length > 5 ? 'high' : brokenLinks.length > 0 ? 'medium' : 'low'
    };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.LinkAnalyzerEndpoint = LinkAnalyzerEndpoint;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinkAnalyzerEndpoint;
}
