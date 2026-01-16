# Health Checker Website - Version 5.0 🚀

## Architecture Moderne avec Endpoints et Dashboard Professionnel

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Nouveautés v5.0](#nouveautés-v50)
4. [Système de Configuration](#système-de-configuration)
5. [Endpoints API](#endpoints-api)
6. [Dashboard Professionnel](#dashboard-professionnel)
7. [Utilisation](#utilisation)
8. [Migration depuis v4.x](#migration-depuis-v4x)
9. [Développement](#développement)

---

## 🎯 Vue d'ensemble

Health Checker Website v5.0 est une refonte complète de l'extension avec une architecture moderne basée sur des **endpoints modulaires** et un **dashboard professionnel** avec graphiques interactifs.

### Principales améliorations

✅ **Architecture modulaire** avec endpoints séparés
✅ **6 presets configurables** (SEO Standard, Strict, Permissif, E-commerce, Blog, Corporate)
✅ **5 profils d'analyse** (Full, CDP, WebDesigner, Accessibility, Performance)
✅ **Dashboard professionnel** avec Chart.js
✅ **Système de scoring intelligent** avec seuils configurables
✅ **Export multi-formats** (JSON, CSV, HTML)
✅ **Comparaison multi-pages**
✅ **Historique d'analyses**
✅ **Import/Export de configurations**

---

## 🏗️ Architecture

### Structure des dossiers

```
globalCherckerWebSiteCQ/
├── api/
│   ├── config/
│   │   └── ConfigurationManager.js       # Gestion des configurations
│   ├── core/
│   │   ├── AnalyzerEndpoint.js           # Classe de base pour endpoints
│   │   ├── ScoringEngine.js              # Moteur de calcul de scores
│   │   └── AnalysisOrchestrator.js       # Orchestrateur principal
│   └── endpoints/
│       ├── MetaAnalyzerEndpoint.js       # Analyse meta tags
│       ├── ImageAnalyzerEndpoint.js      # Analyse images
│       ├── HeadingAnalyzerEndpoint.js    # Analyse headings H1-H6
│       ├── LinkAnalyzerEndpoint.js       # Analyse liens (à créer)
│       ├── AccessibilityAnalyzerEndpoint.js  # Accessibilité (à créer)
│       └── PerformanceAnalyzerEndpoint.js    # Performance (à créer)
├── dashboard/
│   ├── dashboard.html                    # Interface dashboard
│   ├── dashboard.js                      # Controller dashboard
│   ├── components/                       # Composants UI (à créer)
│   ├── charts/                          # Graphiques (à créer)
│   └── views/                           # Vues (à créer)
├── Functions/                            # Fonctions originales (legacy)
└── manifest.json                         # Configuration extension
```

### Flux de données

```
User Action (Dashboard)
    ↓
AnalysisOrchestrator.analyzePage()
    ↓
Endpoints parallèles:
    ├── MetaAnalyzerEndpoint
    ├── ImageAnalyzerEndpoint
    ├── HeadingAnalyzerEndpoint
    ├── LinkAnalyzerEndpoint
    ├── AccessibilityAnalyzerEndpoint
    └── PerformanceAnalyzerEndpoint
    ↓
ScoringEngine.calculateGlobalScore()
    ↓
Dashboard.updateDashboard()
    ↓
IndexedDB Storage
```

---

## 🆕 Nouveautés v5.0

### 1. Système de Configuration Avancé

**6 Presets disponibles:**

| Preset | Description | Use Case |
|--------|-------------|----------|
| **SEO Standard** | Configuration équilibrée | Sites généraux |
| **SEO Strict** | Recommandations Google strictes | Sites haute performance |
| **Permissif** | Critères assouplis | Sites créatifs/artistiques |
| **E-commerce** | Optimisé boutiques | Sites marchands |
| **Blog** | Optimisé contenu éditorial | Blogs, actualités |
| **Corporate** | Sites institutionnels | Entreprises, institutions |

**5 Profils d'analyse:**

| Profil | Focus | Checks activés |
|--------|-------|----------------|
| **FULL** | Complet | Tous |
| **CDP** | Content/SEO | Meta, Headings, Typography, Links |
| **WEBDESIGNER** | Design/Performance | Images, Accessibility, Performance |
| **ACCESSIBILITY** | WCAG AAA | Contrast, Alt, Headings, Links |
| **PERFORMANCE** | Core Web Vitals | Performance, Images, Lighthouse |

### 2. Endpoints Modulaires

Chaque type d'analyse possède son propre endpoint :

- ✅ **MetaAnalyzerEndpoint** : Titre, description, longueurs, CTA
- ✅ **ImageAnalyzerEndpoint** : Alt, poids, ratio, formats
- ✅ **HeadingAnalyzerEndpoint** : H1-H6, hiérarchie, structure
- 🔄 **LinkAnalyzerEndpoint** : Validité, broken links, sémantique
- 🔄 **AccessibilityAnalyzerEndpoint** : Contraste WCAG, aria
- 🔄 **PerformanceAnalyzerEndpoint** : Lighthouse, Core Web Vitals

### 3. Dashboard Professionnel

**Fonctionnalités:**

- 📊 **Vue d'ensemble** : Stats globales, graphiques par catégorie
- 📈 **Historique** : Évolution des scores dans le temps
- ⚖️ **Comparaison** : Comparaison multi-pages
- ⚙️ **Configuration** : Gestion presets, import/export

**Technologies:**
- Chart.js pour les graphiques
- Design moderne avec gradients
- Responsive
- Animations fluides

---

## ⚙️ Système de Configuration

### ConfigurationManager

Gestion centralisée de tous les paramètres.

#### Paramètres configurables

**Meta Tags:**
```javascript
{
  title: {
    min: 50,              // Longueur minimale
    max: 65,              // Longueur maximale
    required: true,       // Requis?
    warnOutside: true,    // Alerter si hors limites?
    score: {              // Paliers de scoring
      perfect: { min: 55, max: 60 },
      good: { min: 50, max: 65 },
      warning: { min: 40, max: 70 }
    }
  },
  description: { /* idem */ }
}
```

**Images:**
```javascript
{
  alt: {
    required: true,
    minLength: 5,
    maxLength: 125
  },
  weight: {
    hero: { max: 500000, recommended: 300000 },
    standard: { max: 300000, recommended: 150000 },
    thumbnail: { max: 150000, recommended: 50000 },
    icon: { max: 50000, recommended: 20000 }
  },
  ratio: {
    maxDistortion: 3,
    warnAbove: 2.5
  }
}
```

**Headings:**
```javascript
{
  h1: {
    required: true,
    maxCount: 1,
    minLength: 30,
    maxLength: 70,
    minWords: 5,
    maxWords: 10
  },
  h2: { /* ... */ },
  general: {
    checkHierarchy: true,
    allowSkipLevels: false,
    detectSplit: true
  }
}
```

#### API du ConfigurationManager

```javascript
// Initialisation
const config = new ConfigurationManager();
await config.init();

// Appliquer un preset
config.applyPreset('SEO_STRICT');

// Appliquer un profil
config.applyProfile('CDP');

// Récupérer une valeur
const maxTitle = config.getConfig('meta.title.max');

// Modifier une valeur
config.updateConfig('meta.title.max', 70);

// Sauvegarder configuration personnalisée
config.saveCustomConfig('Ma Config', 'Description');

// Exporter
const exported = config.exportConfig();

// Importer
config.importConfig(importedData);

// Configuration par domaine
config.setDomainConfig('example.com', 'Ma Config');
```

---

## 🔌 Endpoints API

### AnalyzerEndpoint (Base)

Classe de base pour tous les endpoints.

```javascript
class AnalyzerEndpoint {
  async analyze(pageData, options) {
    // Logique d'analyse
  }

  async execute(pageData, options) {
    // Wrapper avec cache et gestion erreurs
  }

  async analyzeBatch(pagesData, options) {
    // Analyse batch avec progression
  }
}
```

### MetaAnalyzerEndpoint

Analyse des balises meta.

**Input:**
```javascript
{
  meta: {
    title: "Mon titre de page",
    description: "Ma description..."
  }
}
```

**Output:**
```javascript
{
  success: true,
  data: {
    title: {
      value: "Mon titre de page",
      length: 18,
      score: 2.5,
      level: 'warning',
      message: 'Trop court (18/50 min)',
      analysis: {
        hasNumbers: false,
        hasSpecialChars: false,
        hasBrand: false,
        hasKeywords: ['titre', 'page']
      }
    },
    description: { /* ... */ },
    globalScore: 3.2,
    issues: [ /* ... */ ],
    recommendations: [ /* ... */ ]
  }
}
```

### ImageAnalyzerEndpoint

Analyse complète des images.

**Input:**
```javascript
{
  images: [
    {
      src: 'https://example.com/image.jpg',
      alt: 'Description image',
      weight: 250000,
      dimensions: {
        width: 800,
        height: 600,
        naturalWidth: 1600,
        naturalHeight: 1200
      },
      type: 'standard'
    }
  ]
}
```

**Output:**
```javascript
{
  success: true,
  data: {
    totalImages: 15,
    analyzed: [ /* analyses individuelles */ ],
    summary: {
      withAlt: 12,
      withoutAlt: 3,
      oversized: 2,
      distorted: 1,
      optimized: 10
    },
    globalScore: 4.2,
    issues: [ /* ... */ ],
    recommendations: [ /* ... */ ]
  }
}
```

### HeadingAnalyzerEndpoint

Analyse de la structure H1-H6.

**Input:**
```javascript
{
  headings: [
    { level: 'h1', text: 'Titre principal', hasLineBreak: false },
    { level: 'h2', text: 'Sous-titre', hasLineBreak: false }
  ]
}
```

**Output:**
```javascript
{
  success: true,
  data: {
    totalHeadings: 8,
    byLevel: {
      h1: [ /* H1 analysés */ ],
      h2: [ /* H2 analysés */ ],
      h3: [ /* H3 analysés */ ]
    },
    hierarchy: {
      valid: true,
      errors: [],
      warnings: [],
      score: 5
    },
    outline: [ /* structure arborescente */ ],
    globalScore: 4.5,
    issues: [],
    recommendations: []
  }
}
```

---

## 📊 Dashboard Professionnel

### Fonctionnalités

#### 1. Vue d'ensemble

- **Stats KPIs** : Score global, Meta, Images, Headings
- **Graphique catégories** : Bar chart des scores par catégorie
- **Analyses récentes** : Liste des 10 dernières analyses

#### 2. Historique

- **Timeline** : Graphique d'évolution des scores
- **Liste complète** : Toutes les analyses avec filtres
- **Export** : JSON, CSV

#### 3. Comparaison

- **Comparaison 2 pages** : Côte à côte
- **Diff par catégorie** : Gagnant/perdant par métrique

#### 4. Configuration

- **Sélection preset** : Boutons rapides
- **Import/Export** : Sauvegarde configurations
- **Paramètres avancés** : (à développer)

### API du Dashboard

```javascript
// Initialisation
const dashboard = new DashboardController();

// Démarrer nouvelle analyse
dashboard.startNewAnalysis();

// Charger une analyse
dashboard.updateDashboard(analysisData);

// Exporter données
dashboard.exportData('csv'); // ou 'json'

// Changer de preset
dashboard.applyPreset('SEO_STRICT');

// Comparer deux analyses
const comparison = orchestrator.compareAnalyses(analysis1, analysis2);
```

---

## 🚀 Utilisation

### 1. Analyse Simple

```javascript
// Initialiser l'orchestrateur
const orchestrator = new AnalysisOrchestrator();
await orchestrator.init();

// Analyser une page
const pageData = {
  url: 'https://example.com',
  meta: { title: '...', description: '...' },
  images: [ /* ... */ ],
  headings: [ /* ... */ ]
};

const result = await orchestrator.analyzePage(pageData);
console.log('Score global:', result.globalScore);
```

### 2. Analyse Batch

```javascript
const pagesData = [
  { url: 'https://example.com/page1', /* ... */ },
  { url: 'https://example.com/page2', /* ... */ },
  { url: 'https://example.com/page3', /* ... */ }
];

const batchResult = await orchestrator.analyzeMultiplePages(pagesData, {
  batchSize: 3,
  delay: 750,
  onProgress: (progress) => {
    console.log(`${progress.percentage}% - ${progress.completed}/${progress.total}`);
  }
});

console.log('Moyenne:', batchResult.summary.avgScore);
```

### 3. Configuration Personnalisée

```javascript
// Créer une configuration custom
orchestrator.configManager.applyPreset('SEO_STANDARD');
orchestrator.configManager.updateConfig('meta.title.max', 70);
orchestrator.configManager.updateConfig('images.weight.hero.max', 600000);

// Sauvegarder
orchestrator.configManager.saveCustomConfig('Mon Preset', 'Pour mes projets');

// Appliquer
orchestrator.configManager.loadCustomConfig('Mon Preset');
```

### 4. Export Résultats

```javascript
// Export JSON
const json = orchestrator.exportResults(results, 'json');
downloadFile(json, 'results.json');

// Export CSV
const csv = orchestrator.exportResults(results, 'csv');
downloadFile(csv, 'results.csv');

// Export HTML
const html = orchestrator.exportResults(results, 'html');
downloadFile(html, 'report.html');
```

---

## 🔄 Migration depuis v4.x

### Compatibilité

- ✅ Toutes les fonctions legacy dans `/Functions` sont **préservées**
- ✅ L'architecture v5 **coexiste** avec v4
- ✅ Migration **progressive** possible

### Plan de migration

1. **Phase 1** : Dashboard v5 utilise les données v4 existantes
2. **Phase 2** : Nouveaux endpoints remplacent progressivement les fonctions legacy
3. **Phase 3** : Refactoring complet (optionnel)

### Mapping v4 → v5

| v4 | v5 |
|----|-----|
| `checkMetas.js` | `MetaAnalyzerEndpoint` |
| `checkImages.js` + `checkAltImages.js` | `ImageAnalyzerEndpoint` |
| `checkOutlineHn.js` + `counterLettersHn.js` | `HeadingAnalyzerEndpoint` |
| `checkLinks.js` | `LinkAnalyzerEndpoint` |
| `checkColorContrast.js` | `AccessibilityAnalyzerEndpoint` |
| `initLighthouse.js` | `PerformanceAnalyzerEndpoint` |

---

## 🛠️ Développement

### Ajouter un nouvel endpoint

```javascript
// 1. Créer la classe
class MyAnalyzerEndpoint extends AnalyzerEndpoint {
  constructor(configManager, scoringEngine) {
    super('my-analyzer', configManager, scoringEngine);
  }

  async analyze(pageData, options) {
    // Votre logique
    return {
      globalScore: 4.5,
      data: { /* ... */ }
    };
  }
}

// 2. Enregistrer dans l'orchestrateur
// Dans AnalysisOrchestrator.registerEndpoints()
this.endpoints.set('myAnalyzer', new MyAnalyzerEndpoint(
  this.configManager,
  this.scoringEngine
));
```

### Ajouter un nouveau preset

```javascript
// Dans ConfigurationManager.PRESETS
MY_PRESET: {
  name: 'Mon Preset',
  description: 'Description',
  meta: { /* config meta */ },
  images: { /* config images */ },
  // ... autres configs
  scoring: {
    weights: { /* pondérations */ },
    passThreshold: 3.5,
    goodThreshold: 4.0,
    excellentThreshold: 4.5
  }
}
```

### Tests

```javascript
// Test unitaire endpoint
const endpoint = new MetaAnalyzerEndpoint(config, scoring);
const result = await endpoint.execute({
  meta: { title: 'Test', description: 'Test description' }
});

assert(result.success === true);
assert(result.data.globalScore >= 0 && result.data.globalScore <= 5);
```

---

## 📝 TODO / Roadmap

### À implémenter

- [ ] LinkAnalyzerEndpoint complet
- [ ] AccessibilityAnalyzerEndpoint
- [ ] PerformanceAnalyzerEndpoint
- [ ] Comparaison multi-pages visuelle
- [ ] Settings UI avancé avec formulaires
- [ ] Système de notifications toast
- [ ] Export PDF avec graphiques
- [ ] API REST optionnelle (serveur local)
- [ ] Tests unitaires complets
- [ ] Documentation API complète

### Améliorations futures

- [ ] Machine Learning pour suggestions
- [ ] Templates de configurations par industrie
- [ ] Intégration CI/CD
- [ ] Mode offline complet
- [ ] Multi-langues (EN, ES, DE, IT)
- [ ] Partage de configurations en équipe
- [ ] Webhooks pour notifications

---

## 📄 Licence

© 2024 Health Checker Website - Tous droits réservés

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de créer une issue avant de soumettre une PR.

---

**Version:** 5.0.0
**Date:** Janvier 2026
**Auteur:** Équipe HCW
