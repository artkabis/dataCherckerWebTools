/**
 * DataExtractor - Content Script Principal
 * Extrait toutes les données nécessaires depuis une page web réelle
 * Version 5.0.0
 */

class DataExtractor {
  constructor() {
    this.pageData = {
      url: window.location.href,
      timestamp: Date.now(),
      domain: window.location.hostname,
      meta: {},
      images: [],
      headings: [],
      links: [],
      accessibility: {},
      performance: {}
    };
  }

  /**
   * Extrait toutes les données de la page
   */
  async extractAll() {
    try {
      console.log('[DataExtractor] Starting full page extraction...');

      this.extractMeta();
      await this.extractImages();
      this.extractHeadings();
      this.extractLinks();
      this.extractAccessibility();
      await this.extractPerformance();

      console.log('[DataExtractor] Extraction complete:', this.pageData);
      return this.pageData;
    } catch (error) {
      console.error('[DataExtractor] Extraction error:', error);
      throw error;
    }
  }

  /**
   * Extrait les meta tags
   */
  extractMeta() {
    console.log('[DataExtractor] Extracting meta tags...');

    this.pageData.meta = {
      title: document.title || '',
      description: this.getMetaContent('description') || '',
      keywords: this.getMetaContent('keywords') || '',
      ogTitle: this.getMetaContent('og:title') || '',
      ogDescription: this.getMetaContent('og:description') || '',
      ogImage: this.getMetaContent('og:image') || '',
      twitterCard: this.getMetaContent('twitter:card') || '',
      canonical: this.getCanonical(),
      robots: this.getMetaContent('robots') || '',
      viewport: this.getMetaContent('viewport') || '',
      charset: document.characterSet || 'UTF-8',
      lang: document.documentElement.lang || ''
    };
  }

  /**
   * Récupère le contenu d'une meta tag
   */
  getMetaContent(name) {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return meta ? meta.getAttribute('content') : null;
  }

  /**
   * Récupère l'URL canonique
   */
  getCanonical() {
    const canonical = document.querySelector('link[rel="canonical"]');
    return canonical ? canonical.href : '';
  }

  /**
   * Extrait toutes les images avec leurs propriétés
   */
  async extractImages() {
    console.log('[DataExtractor] Extracting images...');

    const images = document.querySelectorAll('img');
    const promises = Array.from(images).map(img => this.extractImageData(img));

    this.pageData.images = await Promise.all(promises);
  }

  /**
   * Extrait les données d'une image
   */
  async extractImageData(img) {
    const rect = img.getBoundingClientRect();

    // Déterminer le type d'image
    let type = 'standard';
    if (img.closest('header') || img.classList.contains('hero') || rect.height > 400) {
      type = 'hero';
    } else if (rect.width < 150 && rect.height < 150) {
      type = 'thumbnail';
    } else if (rect.width < 50 && rect.height < 50) {
      type = 'icon';
    }

    const imageData = {
      src: img.src || img.getAttribute('data-src') || '',
      alt: img.alt || '',
      title: img.title || '',
      width: img.width || rect.width,
      height: img.height || rect.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      dimensions: {
        width: img.width || rect.width,
        height: img.height || rect.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      },
      loading: img.loading || 'eager',
      decoding: img.decoding || 'auto',
      type: type,
      isVisible: rect.width > 0 && rect.height > 0,
      format: this.getImageFormat(img.src),
      weight: await this.estimateImageSize(img.src)
    };

    return imageData;
  }

  /**
   * Détermine le format d'une image
   */
  getImageFormat(src) {
    if (!src) return 'unknown';
    const ext = src.split('.').pop().split('?')[0].toLowerCase();
    if (['jpg', 'jpeg'].includes(ext)) return 'jpeg';
    if (ext === 'png') return 'png';
    if (ext === 'webp') return 'webp';
    if (ext === 'svg') return 'svg';
    if (ext === 'gif') return 'gif';
    if (ext === 'avif') return 'avif';
    return 'unknown';
  }

  /**
   * Estime la taille d'une image
   */
  async estimateImageSize(src) {
    try {
      // Essayer d'obtenir la taille réelle via fetch
      const response = await fetch(src, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
    } catch (error) {
      // Si fetch échoue, estimer basé sur les dimensions
    }

    // Estimation basique basée sur le format
    return 0; // Sera calculé côté serveur si nécessaire
  }

  /**
   * Extrait tous les headings H1-H6
   */
  extractHeadings() {
    console.log('[DataExtractor] Extracting headings...');

    this.pageData.headings = [];

    for (let level = 1; level <= 6; level++) {
      const headings = document.querySelectorAll(`h${level}`);
      headings.forEach(heading => {
        this.pageData.headings.push({
          level: `h${level}`,
          text: heading.textContent.trim(),
          html: heading.innerHTML,
          hasLineBreak: heading.innerHTML.includes('<br'),
          id: heading.id || '',
          classes: Array.from(heading.classList),
          isVisible: this.isElementVisible(heading)
        });
      });
    }
  }

  /**
   * Vérifie si un élément est visible
   */
  isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }

  /**
   * Extrait tous les liens
   */
  extractLinks() {
    console.log('[DataExtractor] Extracting links...');

    const links = document.querySelectorAll('a[href]');
    this.pageData.links = Array.from(links).map(link => {
      const href = link.href;
      const type = this.determineLinkType(href);

      return {
        href: href,
        text: link.textContent.trim(),
        title: link.title || '',
        rel: link.rel || '',
        target: link.target || '',
        type: type,
        hasAriaLabel: link.hasAttribute('aria-label'),
        ariaLabel: link.getAttribute('aria-label') || '',
        isVisible: this.isElementVisible(link),
        accessible: true, // Sera validé côté analyseur
        broken: false // Sera vérifié côté analyseur
      };
    });
  }

  /**
   * Détermine le type d'un lien
   */
  determineLinkType(href) {
    if (!href) return 'unknown';

    if (href.startsWith('#')) return 'anchor';
    if (href.startsWith('mailto:')) return 'email';
    if (href.startsWith('tel:')) return 'phone';
    if (href.startsWith(window.location.origin)) return 'internal';
    if (href.startsWith('http')) return 'external';

    // Lien relatif
    return 'internal';
  }

  /**
   * Extrait les données d'accessibilité
   */
  extractAccessibility() {
    console.log('[DataExtractor] Extracting accessibility data...');

    this.pageData.accessibility = {
      wcag: this.extractWCAGData(),
      aria: this.extractARIAData(),
      semantic: this.extractSemanticStructure(),
      keyboard: this.extractKeyboardData()
    };
  }

  /**
   * Extrait les données WCAG (contraste de couleurs)
   */
  extractWCAGData() {
    const contrastData = [];

    // Analyser les éléments de texte principaux
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, button, a, span, div');

    // Limiter à 50 éléments pour performance
    const elementsToCheck = Array.from(textElements).slice(0, 50);

    elementsToCheck.forEach(elem => {
      if (!elem.textContent.trim()) return;

      const style = window.getComputedStyle(elem);
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = parseInt(style.fontWeight);

      // Déterminer si c'est du grand texte (18pt+ ou 14pt+ gras)
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

      contrastData.push({
        element: elem.tagName.toLowerCase(),
        ratio: 0, // Sera calculé avec une lib de contraste si nécessaire
        fontSize: fontSize,
        fontWeight: fontWeight,
        isLargeText: isLargeText,
        color: style.color,
        backgroundColor: style.backgroundColor,
        passes: {
          AA: true, // À calculer
          AAA: true // À calculer
        }
      });
    });

    return {
      level: 'AA', // Par défaut
      contrast: contrastData
    };
  }

  /**
   * Extrait les données ARIA
   */
  extractARIAData() {
    const ariaElements = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby], [aria-hidden]');

    const issues = [];
    let valid = 0;
    let invalid = 0;

    ariaElements.forEach(elem => {
      const role = elem.getAttribute('role');
      const ariaLabel = elem.getAttribute('aria-label');
      const ariaHidden = elem.getAttribute('aria-hidden');

      // Vérifications basiques
      if (role && !this.isValidARIARole(role)) {
        issues.push({
          element: elem.tagName.toLowerCase(),
          issue: `Invalid ARIA role: ${role}`
        });
        invalid++;
      } else {
        valid++;
      }

      // Vérifier les attributs aria-label vides
      if (ariaLabel === '') {
        issues.push({
          element: elem.tagName.toLowerCase(),
          issue: 'Empty aria-label attribute'
        });
      }
    });

    return {
      total: ariaElements.length,
      valid: valid,
      invalid: invalid,
      issues: issues
    };
  }

  /**
   * Valide un rôle ARIA
   */
  isValidARIARole(role) {
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
      'checkbox', 'complementary', 'contentinfo', 'dialog', 'directory',
      'document', 'form', 'grid', 'gridcell', 'group', 'heading', 'img',
      'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee',
      'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
      'navigation', 'option', 'presentation', 'progressbar', 'radio',
      'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar',
      'search', 'separator', 'slider', 'spinbutton', 'status', 'tab',
      'tablist', 'tabpanel', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
      'treegrid', 'treeitem'
    ];
    return validRoles.includes(role);
  }

  /**
   * Extrait la structure sémantique HTML5
   */
  extractSemanticStructure() {
    return {
      hasMain: !!document.querySelector('main'),
      hasNav: !!document.querySelector('nav'),
      hasHeader: !!document.querySelector('header'),
      hasFooter: !!document.querySelector('footer'),
      hasAside: !!document.querySelector('aside'),
      hasArticle: !!document.querySelector('article'),
      hasSection: !!document.querySelector('section'),
      headingsValid: this.validateHeadingsHierarchy()
    };
  }

  /**
   * Valide la hiérarchie des headings
   */
  validateHeadingsHierarchy() {
    const h1s = document.querySelectorAll('h1');
    if (h1s.length !== 1) return false;

    // Vérifier qu'il n'y a pas de saut de niveau
    let currentLevel = 0;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    for (const heading of headings) {
      const level = parseInt(heading.tagName[1]);
      if (level > currentLevel + 1) return false;
      currentLevel = level;
    }

    return true;
  }

  /**
   * Extrait les données de navigation clavier
   */
  extractKeyboardData() {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    const skipLinks = document.querySelectorAll('a[href^="#"][class*="skip"]');

    return {
      focusVisible: true, // À tester interactivement
      tabOrder: 'sequential', // À analyser
      skipLinks: skipLinks.length > 0,
      focusTraps: [], // À détecter avec tests
      focusableCount: focusableElements.length
    };
  }

  /**
   * Extrait les données de performance
   */
  async extractPerformance() {
    console.log('[DataExtractor] Extracting performance data...');

    // Utiliser Performance API si disponible
    const performanceData = {
      lighthouse: {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
        pwa: 0
      },
      coreWebVitals: await this.getCoreWebVitals(),
      resources: this.getResourcesData(),
      loadTime: this.getLoadTimeData()
    };

    this.pageData.performance = performanceData;
  }

  /**
   * Récupère les Core Web Vitals
   */
  async getCoreWebVitals() {
    const vitals = {
      LCP: 0,
      FID: 0,
      CLS: 0,
      FCP: 0,
      TTFB: 0,
      TTI: 0
    };

    // Utiliser PerformanceObserver si disponible
    if ('PerformanceObserver' in window) {
      try {
        // FCP et LCP
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) vitals.FCP = Math.round(fcpEntry.startTime);

        // Navigation Timing
        const navTiming = performance.getEntriesByType('navigation')[0];
        if (navTiming) {
          vitals.TTFB = Math.round(navTiming.responseStart - navTiming.requestStart);
          vitals.TTI = Math.round(navTiming.domInteractive);
        }
      } catch (error) {
        console.warn('[DataExtractor] Error getting Core Web Vitals:', error);
      }
    }

    return vitals;
  }

  /**
   * Récupère les données de ressources
   */
  getResourcesData() {
    const resources = performance.getEntriesByType('resource');

    const byType = {
      javascript: { count: 0, size: 0, blocking: 0 },
      css: { count: 0, size: 0, blocking: 0 },
      images: { count: 0, size: 0, lazy: 0 },
      fonts: { count: 0, size: 0 }
    };

    resources.forEach(resource => {
      const size = resource.transferSize || resource.encodedBodySize || 0;

      if (resource.name.endsWith('.js') || resource.initiatorType === 'script') {
        byType.javascript.count++;
        byType.javascript.size += size;
      } else if (resource.name.endsWith('.css') || resource.initiatorType === 'css') {
        byType.css.count++;
        byType.css.size += size;
      } else if (resource.initiatorType === 'img') {
        byType.images.count++;
        byType.images.size += size;
      } else if (resource.initiatorType === 'font' || resource.name.match(/\.(woff2?|ttf|otf|eot)$/)) {
        byType.fonts.count++;
        byType.fonts.size += size;
      }
    });

    // Compter les images lazy
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    byType.images.lazy = lazyImages.length;

    return byType;
  }

  /**
   * Récupère les temps de chargement
   */
  getLoadTimeData() {
    const navTiming = performance.getEntriesByType('navigation')[0];

    if (!navTiming) {
      return {
        domContentLoaded: 0,
        load: 0,
        firstPaint: 0
      };
    }

    return {
      domContentLoaded: Math.round(navTiming.domContentLoadedEventEnd - navTiming.fetchStart),
      load: Math.round(navTiming.loadEventEnd - navTiming.fetchStart),
      firstPaint: Math.round(navTiming.responseStart - navTiming.fetchStart)
    };
  }
}

// Export pour utilisation dans content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataExtractor;
}
