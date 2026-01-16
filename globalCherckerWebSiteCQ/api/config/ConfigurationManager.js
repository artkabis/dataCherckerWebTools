/**
 * Configuration Manager
 * Gestion centralisée de tous les paramètres d'analyse avec presets et profils
 * @version 5.0.0
 */

class ConfigurationManager {
  constructor() {
    this.currentConfig = null;
    this.currentProfile = 'FULL';
    this.currentPreset = 'SEO_STANDARD';
    this.customConfigs = new Map();
    this.configHistory = [];
    this.domainConfigs = new Map();

    this.init();
  }

  /**
   * Initialisation du gestionnaire
   */
  async init() {
    await this.loadFromStorage();
    if (!this.currentConfig) {
      this.currentConfig = this.getPreset(this.currentPreset);
    }
  }

  /**
   * Définition des presets par défaut
   */
  static PRESETS = {
    SEO_STANDARD: {
      name: 'SEO Standard',
      description: 'Configuration équilibrée pour SEO général',
      meta: {
        title: {
          min: 50,
          max: 65,
          required: true,
          warnOutside: true,
          score: {
            perfect: { min: 55, max: 60 },
            good: { min: 50, max: 65 },
            warning: { min: 40, max: 70 },
            error: 'outside'
          }
        },
        description: {
          min: 140,
          max: 156,
          required: true,
          warnOutside: true,
          score: {
            perfect: { min: 145, max: 155 },
            good: { min: 140, max: 156 },
            warning: { min: 120, max: 170 },
            error: 'outside'
          }
        }
      },
      images: {
        alt: {
          required: true,
          minLength: 5,
          maxLength: 125,
          warnMissing: true
        },
        weight: {
          hero: { max: 500000, recommended: 300000 }, // bytes
          standard: { max: 300000, recommended: 150000 },
          thumbnail: { max: 150000, recommended: 50000 },
          icon: { max: 50000, recommended: 20000 }
        },
        ratio: {
          maxDistortion: 3,
          warnAbove: 2.5
        },
        formats: {
          recommended: ['webp', 'avif', 'jpg', 'png'],
          warn: ['bmp', 'tiff']
        }
      },
      headings: {
        h1: {
          required: true,
          maxCount: 1,
          minLength: 30,
          maxLength: 70,
          minWords: 5,
          maxWords: 10
        },
        h2: {
          minLength: 25,
          maxLength: 65,
          minWords: 3,
          maxWords: 8
        },
        h3: {
          minLength: 20,
          maxLength: 60,
          minWords: 3,
          maxWords: 8
        },
        general: {
          checkHierarchy: true,
          allowSkipLevels: false,
          detectSplit: true
        }
      },
      typography: {
        bold: {
          min: 3,
          max: 5,
          recommended: 4,
          checkContext: true
        },
        wordCount: {
          min: 300,
          recommended: 800,
          excludeStopWords: true
        }
      },
      links: {
        checkValidity: true,
        checkBroken: true,
        checkDuplicates: true,
        semanticAnalysis: true,
        timeout: 30000,
        maxRedirects: 10,
        excludeDomains: ['mappy.com', 'google.com/maps']
      },
      accessibility: {
        contrast: {
          wcagLevel: 'AA',
          checkAAA: true,
          minRatio: 4.5,
          minRatioLarge: 3,
          strictMode: false
        }
      },
      performance: {
        lighthouse: {
          enabled: true,
          thresholds: {
            performance: 90,
            accessibility: 90,
            bestPractices: 90,
            seo: 90
          }
        },
        timeout: 45000
      },
      scoring: {
        weights: {
          meta: 1,
          images: 1,
          headings: 1,
          links: 1,
          typography: 1,
          accessibility: 1,
          performance: 0.5
        },
        passThreshold: 3.5,
        goodThreshold: 4.0,
        excellentThreshold: 4.5
      }
    },

    SEO_STRICT: {
      name: 'SEO Strict',
      description: 'Recommandations Google strictes',
      meta: {
        title: {
          min: 55,
          max: 60,
          required: true,
          warnOutside: true,
          score: {
            perfect: { min: 55, max: 60 },
            good: { min: 52, max: 62 },
            warning: { min: 50, max: 65 },
            error: 'outside'
          }
        },
        description: {
          min: 145,
          max: 155,
          required: true,
          warnOutside: true,
          score: {
            perfect: { min: 148, max: 152 },
            good: { min: 145, max: 155 },
            warning: { min: 140, max: 160 },
            error: 'outside'
          }
        }
      },
      images: {
        alt: {
          required: true,
          minLength: 10,
          maxLength: 100,
          warnMissing: true
        },
        weight: {
          hero: { max: 300000, recommended: 200000 },
          standard: { max: 200000, recommended: 100000 },
          thumbnail: { max: 100000, recommended: 30000 },
          icon: { max: 30000, recommended: 10000 }
        },
        ratio: {
          maxDistortion: 2.5,
          warnAbove: 2
        },
        formats: {
          recommended: ['webp', 'avif'],
          warn: ['jpg', 'png', 'bmp', 'tiff']
        }
      },
      headings: {
        h1: {
          required: true,
          maxCount: 1,
          minLength: 40,
          maxLength: 60,
          minWords: 6,
          maxWords: 8
        },
        h2: {
          minLength: 30,
          maxLength: 55,
          minWords: 4,
          maxWords: 7
        },
        h3: {
          minLength: 25,
          maxLength: 50,
          minWords: 3,
          maxWords: 6
        },
        general: {
          checkHierarchy: true,
          allowSkipLevels: false,
          detectSplit: true
        }
      },
      typography: {
        bold: {
          min: 3,
          max: 4,
          recommended: 3,
          checkContext: true
        },
        wordCount: {
          min: 500,
          recommended: 1200,
          excludeStopWords: true
        }
      },
      links: {
        checkValidity: true,
        checkBroken: true,
        checkDuplicates: true,
        semanticAnalysis: true,
        timeout: 20000,
        maxRedirects: 5,
        excludeDomains: ['mappy.com', 'google.com/maps']
      },
      accessibility: {
        contrast: {
          wcagLevel: 'AAA',
          checkAAA: true,
          minRatio: 7,
          minRatioLarge: 4.5,
          strictMode: true
        }
      },
      performance: {
        lighthouse: {
          enabled: true,
          thresholds: {
            performance: 95,
            accessibility: 95,
            bestPractices: 95,
            seo: 95
          }
        },
        timeout: 30000
      },
      scoring: {
        weights: {
          meta: 1.2,
          images: 1,
          headings: 1.1,
          links: 1,
          typography: 0.9,
          accessibility: 1.2,
          performance: 1
        },
        passThreshold: 4.0,
        goodThreshold: 4.5,
        excellentThreshold: 4.8
      }
    },

    PERMISSIVE: {
      name: 'Permissif',
      description: 'Pour sites créatifs et artistiques',
      meta: {
        title: {
          min: 30,
          max: 70,
          required: false,
          warnOutside: false,
          score: {
            perfect: { min: 40, max: 65 },
            good: { min: 30, max: 70 },
            warning: { min: 20, max: 80 },
            error: 'outside'
          }
        },
        description: {
          min: 100,
          max: 180,
          required: false,
          warnOutside: false,
          score: {
            perfect: { min: 130, max: 160 },
            good: { min: 100, max: 180 },
            warning: { min: 80, max: 200 },
            error: 'outside'
          }
        }
      },
      images: {
        alt: {
          required: false,
          minLength: 0,
          maxLength: 150,
          warnMissing: false
        },
        weight: {
          hero: { max: 1000000, recommended: 500000 },
          standard: { max: 500000, recommended: 250000 },
          thumbnail: { max: 250000, recommended: 100000 },
          icon: { max: 100000, recommended: 30000 }
        },
        ratio: {
          maxDistortion: 5,
          warnAbove: 4
        },
        formats: {
          recommended: ['webp', 'avif', 'jpg', 'png', 'gif'],
          warn: []
        }
      },
      headings: {
        h1: {
          required: false,
          maxCount: 3,
          minLength: 10,
          maxLength: 100,
          minWords: 2,
          maxWords: 15
        },
        h2: {
          minLength: 10,
          maxLength: 80,
          minWords: 2,
          maxWords: 12
        },
        h3: {
          minLength: 10,
          maxLength: 70,
          minWords: 2,
          maxWords: 10
        },
        general: {
          checkHierarchy: false,
          allowSkipLevels: true,
          detectSplit: false
        }
      },
      typography: {
        bold: {
          min: 1,
          max: 10,
          recommended: 5,
          checkContext: false
        },
        wordCount: {
          min: 100,
          recommended: 500,
          excludeStopWords: true
        }
      },
      links: {
        checkValidity: true,
        checkBroken: true,
        checkDuplicates: false,
        semanticAnalysis: false,
        timeout: 45000,
        maxRedirects: 15,
        excludeDomains: []
      },
      accessibility: {
        contrast: {
          wcagLevel: 'AA',
          checkAAA: false,
          minRatio: 4.5,
          minRatioLarge: 3,
          strictMode: false
        }
      },
      performance: {
        lighthouse: {
          enabled: false,
          thresholds: {
            performance: 70,
            accessibility: 80,
            bestPractices: 80,
            seo: 80
          }
        },
        timeout: 60000
      },
      scoring: {
        weights: {
          meta: 0.7,
          images: 0.8,
          headings: 0.7,
          links: 1,
          typography: 0.5,
          accessibility: 0.8,
          performance: 0.3
        },
        passThreshold: 2.5,
        goodThreshold: 3.5,
        excellentThreshold: 4.0
      }
    },

    ECOMMERCE: {
      name: 'E-commerce',
      description: 'Optimisé pour boutiques en ligne',
      meta: {
        title: {
          min: 50,
          max: 60,
          required: true,
          warnOutside: true,
          includePrice: true,
          score: {
            perfect: { min: 52, max: 58 },
            good: { min: 50, max: 60 },
            warning: { min: 45, max: 65 },
            error: 'outside'
          }
        },
        description: {
          min: 140,
          max: 156,
          required: true,
          warnOutside: true,
          includeCTA: true,
          score: {
            perfect: { min: 145, max: 155 },
            good: { min: 140, max: 156 },
            warning: { min: 130, max: 165 },
            error: 'outside'
          }
        }
      },
      images: {
        alt: {
          required: true,
          minLength: 10,
          maxLength: 100,
          warnMissing: true,
          includeProductName: true
        },
        weight: {
          hero: { max: 400000, recommended: 250000 },
          standard: { max: 250000, recommended: 120000 },
          thumbnail: { max: 80000, recommended: 30000 },
          icon: { max: 30000, recommended: 10000 }
        },
        ratio: {
          maxDistortion: 2,
          warnAbove: 1.5,
          enforceSquare: true // Pour produits
        },
        formats: {
          recommended: ['webp', 'jpg'],
          warn: ['png', 'bmp', 'tiff']
        }
      },
      headings: {
        h1: {
          required: true,
          maxCount: 1,
          minLength: 30,
          maxLength: 60,
          minWords: 4,
          maxWords: 8,
          includeKeyword: true
        },
        h2: {
          minLength: 20,
          maxLength: 55,
          minWords: 3,
          maxWords: 7
        },
        h3: {
          minLength: 15,
          maxLength: 50,
          minWords: 2,
          maxWords: 6
        },
        general: {
          checkHierarchy: true,
          allowSkipLevels: false,
          detectSplit: true
        }
      },
      typography: {
        bold: {
          min: 4,
          max: 8,
          recommended: 6,
          checkContext: true,
          highlightPrice: true
        },
        wordCount: {
          min: 400,
          recommended: 1000,
          excludeStopWords: true
        }
      },
      links: {
        checkValidity: true,
        checkBroken: true,
        checkDuplicates: true,
        semanticAnalysis: true,
        timeout: 25000,
        maxRedirects: 8,
        excludeDomains: [],
        checkCTA: true
      },
      accessibility: {
        contrast: {
          wcagLevel: 'AA',
          checkAAA: true,
          minRatio: 4.5,
          minRatioLarge: 3,
          strictMode: false,
          checkButtons: true
        }
      },
      performance: {
        lighthouse: {
          enabled: true,
          thresholds: {
            performance: 85,
            accessibility: 90,
            bestPractices: 90,
            seo: 90
          }
        },
        timeout: 40000,
        checkLCP: true,
        checkCLS: true
      },
      scoring: {
        weights: {
          meta: 1.2,
          images: 1.3,
          headings: 1,
          links: 1.1,
          typography: 1,
          accessibility: 1.1,
          performance: 1.2
        },
        passThreshold: 3.8,
        goodThreshold: 4.2,
        excellentThreshold: 4.6
      }
    },

    BLOG: {
      name: 'Blog/News',
      description: 'Optimisé pour contenu éditorial',
      meta: {
        title: {
          min: 50,
          max: 70,
          required: true,
          warnOutside: true,
          catchyTitle: true,
          score: {
            perfect: { min: 55, max: 65 },
            good: { min: 50, max: 70 },
            warning: { min: 40, max: 75 },
            error: 'outside'
          }
        },
        description: {
          min: 145,
          max: 160,
          required: true,
          warnOutside: true,
          engaging: true,
          score: {
            perfect: { min: 150, max: 158 },
            good: { min: 145, max: 160 },
            warning: { min: 135, max: 170 },
            error: 'outside'
          }
        }
      },
      images: {
        alt: {
          required: true,
          minLength: 8,
          maxLength: 125,
          warnMissing: true,
          descriptive: true
        },
        weight: {
          hero: { max: 600000, recommended: 350000 },
          standard: { max: 350000, recommended: 180000 },
          thumbnail: { max: 120000, recommended: 60000 },
          icon: { max: 40000, recommended: 15000 }
        },
        ratio: {
          maxDistortion: 3,
          warnAbove: 2.5
        },
        formats: {
          recommended: ['webp', 'jpg'],
          warn: ['bmp', 'tiff']
        }
      },
      headings: {
        h1: {
          required: true,
          maxCount: 1,
          minLength: 40,
          maxLength: 80,
          minWords: 6,
          maxWords: 12
        },
        h2: {
          minLength: 30,
          maxLength: 70,
          minWords: 4,
          maxWords: 10
        },
        h3: {
          minLength: 25,
          maxLength: 65,
          minWords: 3,
          maxWords: 8
        },
        general: {
          checkHierarchy: true,
          allowSkipLevels: false,
          detectSplit: true
        }
      },
      typography: {
        bold: {
          min: 5,
          max: 10,
          recommended: 7,
          checkContext: true
        },
        wordCount: {
          min: 800,
          recommended: 2000,
          excludeStopWords: true
        }
      },
      links: {
        checkValidity: true,
        checkBroken: true,
        checkDuplicates: true,
        semanticAnalysis: true,
        timeout: 30000,
        maxRedirects: 10,
        excludeDomains: [],
        checkInternal: true
      },
      accessibility: {
        contrast: {
          wcagLevel: 'AA',
          checkAAA: true,
          minRatio: 4.5,
          minRatioLarge: 3,
          strictMode: false
        }
      },
      performance: {
        lighthouse: {
          enabled: true,
          thresholds: {
            performance: 85,
            accessibility: 90,
            bestPractices: 88,
            seo: 92
          }
        },
        timeout: 45000
      },
      scoring: {
        weights: {
          meta: 1.1,
          images: 1,
          headings: 1.2,
          links: 1,
          typography: 1.3,
          accessibility: 1,
          performance: 0.8
        },
        passThreshold: 3.5,
        goodThreshold: 4.0,
        excellentThreshold: 4.5
      }
    },

    CORPORATE: {
      name: 'Corporate',
      description: 'Sites institutionnels et professionnels',
      meta: {
        title: {
          min: 50,
          max: 65,
          required: true,
          warnOutside: true,
          professional: true,
          score: {
            perfect: { min: 54, max: 62 },
            good: { min: 50, max: 65 },
            warning: { min: 45, max: 70 },
            error: 'outside'
          }
        },
        description: {
          min: 140,
          max: 156,
          required: true,
          warnOutside: true,
          formal: true,
          score: {
            perfect: { min: 145, max: 154 },
            good: { min: 140, max: 156 },
            warning: { min: 130, max: 165 },
            error: 'outside'
          }
        }
      },
      images: {
        alt: {
          required: true,
          minLength: 8,
          maxLength: 120,
          warnMissing: true,
          professional: true
        },
        weight: {
          hero: { max: 450000, recommended: 280000 },
          standard: { max: 280000, recommended: 140000 },
          thumbnail: { max: 100000, recommended: 40000 },
          icon: { max: 40000, recommended: 15000 }
        },
        ratio: {
          maxDistortion: 2.5,
          warnAbove: 2
        },
        formats: {
          recommended: ['webp', 'jpg', 'png'],
          warn: ['bmp', 'gif']
        }
      },
      headings: {
        h1: {
          required: true,
          maxCount: 1,
          minLength: 35,
          maxLength: 65,
          minWords: 5,
          maxWords: 9
        },
        h2: {
          minLength: 28,
          maxLength: 60,
          minWords: 4,
          maxWords: 8
        },
        h3: {
          minLength: 22,
          maxLength: 55,
          minWords: 3,
          maxWords: 7
        },
        general: {
          checkHierarchy: true,
          allowSkipLevels: false,
          detectSplit: true
        }
      },
      typography: {
        bold: {
          min: 3,
          max: 6,
          recommended: 4,
          checkContext: true
        },
        wordCount: {
          min: 500,
          recommended: 1200,
          excludeStopWords: true
        }
      },
      links: {
        checkValidity: true,
        checkBroken: true,
        checkDuplicates: true,
        semanticAnalysis: true,
        timeout: 30000,
        maxRedirects: 10,
        excludeDomains: [],
        checkAccessibility: true
      },
      accessibility: {
        contrast: {
          wcagLevel: 'AAA',
          checkAAA: true,
          minRatio: 7,
          minRatioLarge: 4.5,
          strictMode: true
        }
      },
      performance: {
        lighthouse: {
          enabled: true,
          thresholds: {
            performance: 90,
            accessibility: 95,
            bestPractices: 92,
            seo: 90
          }
        },
        timeout: 40000
      },
      scoring: {
        weights: {
          meta: 1,
          images: 1,
          headings: 1.1,
          links: 1,
          typography: 0.9,
          accessibility: 1.3,
          performance: 1
        },
        passThreshold: 3.8,
        goodThreshold: 4.3,
        excellentThreshold: 4.7
      }
    }
  };

  /**
   * Définition des profils
   */
  static PROFILES = {
    CDP: {
      name: 'CDP (Content)',
      description: 'Focus sur contenu et SEO',
      enabledChecks: ['meta', 'headings', 'typography', 'links', 'semanticLinks', 'bold', 'altImages'],
      disabledChecks: ['imageRatio', 'imageWeight', 'performance']
    },
    WEBDESIGNER: {
      name: 'Web Designer',
      description: 'Focus design et performance',
      enabledChecks: ['images', 'imageRatio', 'imageWeight', 'accessibility', 'performance', 'headings'],
      disabledChecks: ['semanticLinks', 'bold', 'wordCount']
    },
    ACCESSIBILITY: {
      name: 'Accessibilité',
      description: 'WCAG AAA compliance',
      enabledChecks: ['accessibility', 'contrast', 'altImages', 'headings', 'links'],
      disabledChecks: ['performance', 'semanticLinks']
    },
    PERFORMANCE: {
      name: 'Performance',
      description: 'Core Web Vitals',
      enabledChecks: ['performance', 'images', 'imageWeight', 'lighthouse'],
      disabledChecks: ['semanticLinks', 'bold', 'typography']
    },
    FULL: {
      name: 'Complet',
      description: 'Toutes les vérifications',
      enabledChecks: 'all',
      disabledChecks: []
    }
  };

  /**
   * Récupère un preset
   */
  getPreset(presetName) {
    return JSON.parse(JSON.stringify(ConfigurationManager.PRESETS[presetName] || ConfigurationManager.PRESETS.SEO_STANDARD));
  }

  /**
   * Récupère un profil
   */
  getProfile(profileName) {
    return ConfigurationManager.PROFILES[profileName] || ConfigurationManager.PROFILES.FULL;
  }

  /**
   * Applique un preset
   */
  applyPreset(presetName) {
    this.currentPreset = presetName;
    this.currentConfig = this.getPreset(presetName);
    this.saveToHistory('preset_applied', presetName);
    return this.currentConfig;
  }

  /**
   * Applique un profil
   */
  applyProfile(profileName) {
    this.currentProfile = profileName;
    const profile = this.getProfile(profileName);

    // Appliquer les filtres du profil
    if (profile.disabledChecks.length > 0) {
      this.currentConfig._disabledChecks = profile.disabledChecks;
    }
    if (profile.enabledChecks !== 'all') {
      this.currentConfig._enabledChecks = profile.enabledChecks;
    }

    this.saveToHistory('profile_applied', profileName);
    return profile;
  }

  /**
   * Modifie la configuration courante
   */
  updateConfig(path, value) {
    const keys = path.split('.');
    let obj = this.currentConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    this.saveToHistory('config_updated', { path, value });
  }

  /**
   * Récupère une valeur de configuration
   */
  getConfig(path) {
    const keys = path.split('.');
    let obj = this.currentConfig;

    for (const key of keys) {
      if (obj === undefined || obj === null) return undefined;
      obj = obj[key];
    }

    return obj;
  }

  /**
   * Sauvegarde une configuration personnalisée
   */
  saveCustomConfig(name, description = '') {
    const config = {
      name,
      description,
      data: JSON.parse(JSON.stringify(this.currentConfig)),
      createdAt: new Date().toISOString(),
      preset: this.currentPreset,
      profile: this.currentProfile
    };

    this.customConfigs.set(name, config);
    this.saveToStorage();
    return config;
  }

  /**
   * Charge une configuration personnalisée
   */
  loadCustomConfig(name) {
    const config = this.customConfigs.get(name);
    if (config) {
      this.currentConfig = JSON.parse(JSON.stringify(config.data));
      this.currentPreset = config.preset || 'CUSTOM';
      this.currentProfile = config.profile || 'FULL';
      this.saveToHistory('custom_config_loaded', name);
      return config;
    }
    return null;
  }

  /**
   * Supprime une configuration personnalisée
   */
  deleteCustomConfig(name) {
    this.customConfigs.delete(name);
    this.saveToStorage();
  }

  /**
   * Liste les configurations personnalisées
   */
  listCustomConfigs() {
    return Array.from(this.customConfigs.values());
  }

  /**
   * Exporte la configuration courante
   */
  exportConfig() {
    return {
      version: '5.0.0',
      exportDate: new Date().toISOString(),
      preset: this.currentPreset,
      profile: this.currentProfile,
      config: this.currentConfig
    };
  }

  /**
   * Importe une configuration
   */
  importConfig(configData) {
    if (!configData.config || !configData.version) {
      throw new Error('Format de configuration invalide');
    }

    this.currentConfig = JSON.parse(JSON.stringify(configData.config));
    this.currentPreset = configData.preset || 'CUSTOM';
    this.currentProfile = configData.profile || 'FULL';
    this.saveToHistory('config_imported', configData);
    this.saveToStorage();
    return this.currentConfig;
  }

  /**
   * Configuration par domaine
   */
  setDomainConfig(domain, configName) {
    this.domainConfigs.set(domain, configName);
    this.saveToStorage();
  }

  /**
   * Récupère la configuration pour un domaine
   */
  getDomainConfig(url) {
    try {
      const domain = new URL(url).hostname;
      const configName = this.domainConfigs.get(domain);

      if (configName) {
        const config = this.customConfigs.get(configName);
        if (config) {
          return config;
        }
      }
    } catch (e) {
      console.error('Erreur getDomainConfig:', e);
    }
    return null;
  }

  /**
   * Historique
   */
  saveToHistory(action, data) {
    this.configHistory.push({
      action,
      data,
      timestamp: new Date().toISOString(),
      preset: this.currentPreset,
      profile: this.currentProfile
    });

    // Limite à 50 entrées
    if (this.configHistory.length > 50) {
      this.configHistory = this.configHistory.slice(-50);
    }
  }

  /**
   * Récupère l'historique
   */
  getHistory() {
    return this.configHistory;
  }

  /**
   * Sauvegarde dans Chrome Storage
   */
  async saveToStorage() {
    const data = {
      currentConfig: this.currentConfig,
      currentPreset: this.currentPreset,
      currentProfile: this.currentProfile,
      customConfigs: Array.from(this.customConfigs.entries()),
      domainConfigs: Array.from(this.domainConfigs.entries()),
      configHistory: this.configHistory
    };

    try {
      await chrome.storage.local.set({ configManager: data });
    } catch (e) {
      console.error('Erreur sauvegarde storage:', e);
    }
  }

  /**
   * Charge depuis Chrome Storage
   */
  async loadFromStorage() {
    try {
      const result = await chrome.storage.local.get('configManager');
      if (result.configManager) {
        const data = result.configManager;
        this.currentConfig = data.currentConfig;
        this.currentPreset = data.currentPreset || 'SEO_STANDARD';
        this.currentProfile = data.currentProfile || 'FULL';
        this.customConfigs = new Map(data.customConfigs || []);
        this.domainConfigs = new Map(data.domainConfigs || []);
        this.configHistory = data.configHistory || [];
      }
    } catch (e) {
      console.error('Erreur chargement storage:', e);
    }
  }

  /**
   * Reset à la configuration par défaut
   */
  reset() {
    this.currentPreset = 'SEO_STANDARD';
    this.currentProfile = 'FULL';
    this.currentConfig = this.getPreset(this.currentPreset);
    this.saveToHistory('reset', null);
    this.saveToStorage();
  }

  /**
   * Valide une configuration
   */
  validateConfig(config = this.currentConfig) {
    const errors = [];
    const warnings = [];

    // Vérifications basiques
    if (!config.meta) errors.push('Section meta manquante');
    if (!config.images) errors.push('Section images manquante');
    if (!config.headings) errors.push('Section headings manquante');

    // Vérifications de cohérence
    if (config.meta?.title?.min > config.meta?.title?.max) {
      errors.push('Meta title: min > max');
    }

    if (config.images?.weight?.hero?.max < config.images?.weight?.hero?.recommended) {
      warnings.push('Images hero: max < recommended');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Génère des recommandations
   */
  getRecommendations(analysisResults) {
    const recommendations = [];

    // Analyser les résultats et suggérer des ajustements
    if (analysisResults.meta?.title?.length > this.currentConfig.meta.title.max) {
      recommendations.push({
        type: 'config_adjustment',
        message: 'Considérez augmenter la limite max du titre meta',
        suggestedValue: analysisResults.meta.title.length + 10
      });
    }

    return recommendations;
  }

  /**
   * Clone la configuration courante
   */
  cloneConfig(newName) {
    return this.saveCustomConfig(newName, `Clone de ${this.currentPreset}`);
  }
}

// Export pour utilisation globale
if (typeof window !== 'undefined') {
  window.ConfigurationManager = ConfigurationManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfigurationManager;
}
