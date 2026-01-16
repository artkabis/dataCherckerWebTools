/**
 * Image Analyzer Endpoint
 * Analyse complète des images (alt, poids, ratio, format)
 * @version 5.0.0
 */

class ImageAnalyzerEndpoint extends AnalyzerEndpoint {
  constructor(configManager, scoringEngine) {
    super('image-analyzer', configManager, scoringEngine);
  }

  /**
   * Analyse toutes les images
   */
  async analyze(pageData, options = {}) {
    const config = this.configManager.getConfig('images');
    const images = pageData.images || [];

    const results = {
      totalImages: images.length,
      analyzed: [],
      summary: {
        withAlt: 0,
        withoutAlt: 0,
        oversized: 0,
        distorted: 0,
        optimized: 0
      },
      globalScore: 0,
      issues: [],
      recommendations: []
    };

    // Analyser chaque image
    for (const img of images) {
      const analysis = await this.analyzeImage(img, config);
      results.analyzed.push(analysis);

      // Mettre à jour le résumé
      if (analysis.alt?.score === 5) results.summary.withAlt++;
      if (analysis.alt?.score === 0) results.summary.withoutAlt++;
      if (analysis.weight?.level === 'error') results.summary.oversized++;
      if (analysis.ratio?.level === 'error') results.summary.distorted++;
      if (analysis.globalScore >= 4.5) results.summary.optimized++;
    }

    // Calcul du score global
    if (results.analyzed.length > 0) {
      const avgScore = results.analyzed.reduce((sum, img) => sum + img.globalScore, 0) / results.analyzed.length;
      results.globalScore = Number(avgScore.toFixed(2));
    } else {
      results.globalScore = 5; // Pas d'images = pas de problème
    }

    // Issues et recommandations
    results.issues = this.collectIssues(results);
    results.recommendations = this.generateRecommendations(results, config);

    return results;
  }

  /**
   * Analyse une image individuelle
   */
  async analyzeImage(imgData, config) {
    const analysis = {
      src: imgData.src,
      alt: null,
      weight: null,
      ratio: null,
      format: null,
      dimensions: imgData.dimensions,
      globalScore: 0,
      issues: []
    };

    // Alt text
    analysis.alt = this.analyzeAlt(imgData.alt, config.alt);
    if (analysis.alt.score < 5) {
      analysis.issues.push({
        type: 'alt',
        severity: config.alt.required ? 'error' : 'warning',
        message: analysis.alt.message
      });
    }

    // Poids
    if (imgData.weight !== undefined) {
      analysis.weight = this.analyzeWeight(imgData.weight, imgData.type, config.weight);
      if (analysis.weight.level === 'error') {
        analysis.issues.push({
          type: 'weight',
          severity: 'error',
          message: analysis.weight.message
        });
      }
    }

    // Ratio
    if (imgData.dimensions) {
      const ratio = this.calculateRatio(imgData.dimensions);
      analysis.ratio = this.analyzeRatio(ratio, config.ratio);
      if (analysis.ratio.level === 'error') {
        analysis.issues.push({
          type: 'ratio',
          severity: 'warning',
          message: analysis.ratio.message
        });
      }
    }

    // Format
    if (imgData.src) {
      const format = this.extractFormat(imgData.src);
      analysis.format = this.analyzeFormat(format, config.formats);
    }

    // Score global de l'image
    const scoreData = this.scoringEngine.scoreImage({
      alt: imgData.alt,
      weight: imgData.weight,
      ratio: analysis.ratio?.value,
      format: analysis.format?.value
    });

    analysis.globalScore = scoreData.globalScore;
    analysis.level = scoreData.level;

    return analysis;
  }

  /**
   * Analyse l'attribut alt
   */
  analyzeAlt(alt, config) {
    if (!alt || alt.trim().length === 0) {
      return {
        value: null,
        present: false,
        length: 0,
        score: config.required ? 0 : 3,
        level: config.required ? 'error' : 'warning',
        message: config.required ? 'Alt manquant (requis)' : 'Alt manquant (recommandé)'
      };
    }

    const length = alt.length;
    const result = {
      value: alt,
      present: true,
      length,
      score: 5,
      level: 'excellent',
      message: 'Alt présent',
      warnings: []
    };

    // Vérifications
    if (length < config.minLength) {
      result.score = 3;
      result.level = 'warning';
      result.message = `Alt trop court (${length}/${config.minLength})`;
    } else if (length > config.maxLength) {
      result.score = 3;
      result.level = 'warning';
      result.message = `Alt trop long (${length}/${config.maxLength})`;
    }

    // Warnings supplémentaires
    if (alt.toLowerCase().includes('image') || alt.toLowerCase().includes('photo')) {
      result.warnings.push('Évitez les mots "image" ou "photo" dans l\'alt');
    }
    if (alt.match(/^(img|pic|photo)_?\d+$/i)) {
      result.warnings.push('Alt générique détecté (non descriptif)');
      result.score = Math.min(result.score, 2);
      result.level = 'error';
    }
    if (alt.endsWith('.jpg') || alt.endsWith('.png') || alt.endsWith('.gif')) {
      result.warnings.push('L\'alt ne doit pas être un nom de fichier');
      result.score = Math.min(result.score, 1);
      result.level = 'error';
    }

    return result;
  }

  /**
   * Analyse le poids de l'image
   */
  analyzeWeight(weight, imageType, config) {
    const type = imageType || 'standard';
    const thresholds = config[type] || config.standard;

    const result = {
      value: weight,
      formatted: this.formatBytes(weight),
      type,
      score: 5,
      level: 'excellent',
      message: 'Poids optimal'
    };

    if (weight <= thresholds.recommended) {
      result.score = 5;
      result.level = 'excellent';
      result.message = `Poids optimal (${result.formatted})`;
    } else if (weight <= thresholds.max) {
      const ratio = weight / thresholds.recommended;
      result.score = Math.max(3, 5 - (ratio - 1));
      result.level = 'good';
      result.message = `Poids acceptable (${result.formatted})`;
    } else {
      const oversize = weight - thresholds.max;
      const oversizePercent = Math.round((oversize / thresholds.max) * 100);
      result.score = Math.max(0, 2 - oversizePercent / 50);
      result.level = 'error';
      result.message = `Trop lourd (${result.formatted}/${this.formatBytes(thresholds.max)}, +${oversizePercent}%)`;
      result.recommendation = `Compressez l'image pour économiser ${this.formatBytes(oversize)}`;
    }

    return result;
  }

  /**
   * Calcule le ratio d'une image
   */
  calculateRatio(dimensions) {
    if (!dimensions || !dimensions.width || !dimensions.height) {
      return null;
    }

    const { width, height, naturalWidth, naturalHeight } = dimensions;

    // Ratio d'affichage vs naturel
    const displayRatio = width / height;
    const naturalRatio = (naturalWidth || width) / (naturalHeight || height);

    // Distorsion
    const distortion = Math.abs(displayRatio - naturalRatio) > 0.1
      ? Math.max(displayRatio / naturalRatio, naturalRatio / displayRatio)
      : 1;

    return {
      display: Number(displayRatio.toFixed(2)),
      natural: Number(naturalRatio.toFixed(2)),
      distortion: Number(distortion.toFixed(2))
    };
  }

  /**
   * Analyse le ratio
   */
  analyzeRatio(ratioData, config) {
    if (!ratioData) {
      return {
        value: null,
        score: 5,
        level: 'neutral',
        message: 'Ratio non déterminable'
      };
    }

    const distortion = ratioData.distortion;

    const result = {
      value: ratioData,
      distortion,
      score: 5,
      level: 'excellent',
      message: 'Ratio optimal'
    };

    if (distortion <= 1.1) {
      result.score = 5;
      result.level = 'excellent';
      result.message = 'Pas de distorsion';
    } else if (distortion <= config.warnAbove) {
      result.score = 4;
      result.level = 'good';
      result.message = `Légère distorsion (${distortion.toFixed(2)})`;
    } else if (distortion <= config.maxDistortion) {
      result.score = 2;
      result.level = 'warning';
      result.message = `Distorsion notable (${distortion.toFixed(2)})`;
    } else {
      result.score = 0;
      result.level = 'error';
      result.message = `Image très distordue (${distortion.toFixed(2)}/${config.maxDistortion})`;
      result.recommendation = 'Utilisez les dimensions naturelles de l\'image';
    }

    return result;
  }

  /**
   * Extrait le format d'une URL
   */
  extractFormat(src) {
    if (!src) return 'unknown';

    // Chercher l'extension
    const match = src.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (match) {
      return match[1].toLowerCase();
    }

    // Vérifier si c'est du base64
    if (src.startsWith('data:image/')) {
      const format = src.match(/data:image\/([^;]+)/);
      return format ? format[1] : 'base64';
    }

    return 'unknown';
  }

  /**
   * Analyse le format
   */
  analyzeFormat(format, config) {
    const result = {
      value: format,
      score: 3.5,
      level: 'neutral',
      message: `Format: ${format}`
    };

    if (config.recommended.includes(format)) {
      result.score = 5;
      result.level = 'excellent';
      result.message = `Format recommandé (${format})`;
    } else if (config.warn.includes(format)) {
      result.score = 2;
      result.level = 'warning';
      result.message = `Format déconseillé (${format})`;
      result.recommendation = `Utilisez plutôt: ${config.recommended.join(', ')}`;
    }

    return result;
  }

  /**
   * Collecte les issues
   */
  collectIssues(results) {
    const issues = [];

    // Images sans alt
    if (results.summary.withoutAlt > 0) {
      issues.push({
        type: 'accessibility',
        severity: 'error',
        count: results.summary.withoutAlt,
        message: `${results.summary.withoutAlt} image(s) sans attribut alt`
      });
    }

    // Images surdimensionnées
    if (results.summary.oversized > 0) {
      issues.push({
        type: 'performance',
        severity: 'error',
        count: results.summary.oversized,
        message: `${results.summary.oversized} image(s) trop lourde(s)`
      });
    }

    // Images distordues
    if (results.summary.distorted > 0) {
      issues.push({
        type: 'quality',
        severity: 'warning',
        count: results.summary.distorted,
        message: `${results.summary.distorted} image(s) distordue(s)`
      });
    }

    return issues;
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(results, config) {
    const recommendations = [];

    // Alt manquants
    if (results.summary.withoutAlt > 0) {
      recommendations.push({
        type: 'alt',
        priority: 'high',
        message: 'Ajoutez des attributs alt à toutes les images',
        impact: 'Améliore l\'accessibilité et le SEO',
        effort: 'Moyen'
      });
    }

    // Images trop lourdes
    if (results.summary.oversized > 0) {
      const avgWeight = results.analyzed
        .filter(img => img.weight?.level === 'error')
        .reduce((sum, img) => sum + img.weight.value, 0) / results.summary.oversized;

      recommendations.push({
        type: 'compression',
        priority: 'high',
        message: 'Compressez les images trop lourdes',
        impact: `Améliore la vitesse de chargement (économie moyenne: ${this.formatBytes(avgWeight / 2)}/image)`,
        effort: 'Facile',
        tools: ['TinyPNG', 'ImageOptim', 'Squoosh']
      });
    }

    // Formats non optimaux
    const badFormats = results.analyzed.filter(img => img.format?.level === 'warning');
    if (badFormats.length > 0) {
      recommendations.push({
        type: 'format',
        priority: 'medium',
        message: 'Utilisez des formats modernes',
        impact: 'Réduit le poids de 30-50% (WebP, AVIF)',
        effort: 'Moyen',
        formats: config.formats.recommended
      });
    }

    // Images distordues
    if (results.summary.distorted > 0) {
      recommendations.push({
        type: 'ratio',
        priority: 'medium',
        message: 'Corrigez les images distordues',
        impact: 'Améliore l\'esthétique et l\'expérience utilisateur',
        effort: 'Facile'
      });
    }

    // Bon score général
    if (results.globalScore >= 4.5 && results.totalImages > 0) {
      recommendations.push({
        type: 'success',
        priority: 'low',
        message: '✓ Excellente optimisation des images !',
        impact: 'Continuez sur cette voie'
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
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Génère un rapport d'optimisation
   */
  generateOptimizationReport(results) {
    const potentialSavings = results.analyzed
      .filter(img => img.weight?.level === 'error' || img.weight?.level === 'warning')
      .reduce((sum, img) => {
        const config = this.configManager.getConfig('images.weight');
        const recommended = config[img.weight.type]?.recommended || config.standard.recommended;
        return sum + Math.max(0, img.weight.value - recommended);
      }, 0);

    return {
      totalImages: results.totalImages,
      optimizedImages: results.summary.optimized,
      needsOptimization: results.totalImages - results.summary.optimized,
      potentialSavings: this.formatBytes(potentialSavings),
      recommendations: results.recommendations,
      priority: potentialSavings > 1000000 ? 'high' : potentialSavings > 500000 ? 'medium' : 'low'
    };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ImageAnalyzerEndpoint = ImageAnalyzerEndpoint;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageAnalyzerEndpoint;
}
