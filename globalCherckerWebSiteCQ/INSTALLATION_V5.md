# Installation et Utilisation - Web Quality Analyzer v5.0

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Première utilisation](#première-utilisation)
4. [Utilisation avancée](#utilisation-avancée)
5. [Architecture technique](#architecture-technique)
6. [Dépannage](#dépannage)

---

## 🔧 Prérequis

- **Navigateur**: Chrome, Edge, Brave ou tout navigateur Chromium-based
- **Version minimum**: Chrome 88+ (support Manifest V3)
- **Système**: Windows, macOS, ou Linux

---

## 📦 Installation

### Étape 1: Télécharger l'extension

```bash
# Cloner le dépôt
git clone https://github.com/artkabis/dataCherckerWebTools.git

# Aller dans le dossier de l'extension
cd dataCherckerWebTools/globalCherckerWebSiteCQ
```

### Étape 2: Charger l'extension dans Chrome

1. **Ouvrir Chrome** et aller à `chrome://extensions/`

2. **Activer le mode développeur**
   - Cliquer sur le bouton "Mode développeur" en haut à droite

3. **Charger l'extension**
   - Cliquer sur "Charger l'extension non empaquetée"
   - Sélectionner le dossier `globalCherckerWebSiteCQ`

4. **Vérifier l'installation**
   - L'extension "Web Quality Analyzer" devrait apparaître dans la liste
   - Version affichée: **5.0.0**
   - Icône visible dans la barre d'outils Chrome

### Étape 3: Épingler l'extension

- Cliquer sur l'icône extensions (puzzle) dans la barre d'outils
- Épingler "Web Quality Analyzer" pour un accès rapide

---

## 🚀 Première utilisation

### Analyse d'une page simple

1. **Naviguer** vers n'importe quelle page web (ex: https://example.com)

2. **Cliquer** sur l'icône de l'extension dans la barre d'outils

3. **Lancer l'analyse v5.0**
   - Cliquer sur le bouton **"🚀 Analyse Complète v5.0"**

4. **Patienter** pendant l'analyse (5-15 secondes)
   - Le bouton affiche "⏳ Analyse en cours..."
   - Les données sont extraites de la page
   - Les 6 endpoints analysent les données

5. **Consulter les résultats**
   - Score global affiché directement (ex: 4.2/5)
   - Niveau de qualité (Excellent, Good, Warning, Error)
   - Bouton "📊 Voir le Dashboard" pour plus de détails

### Comprendre les résultats

Le score global est calculé à partir de **6 catégories**:

| Catégorie | Description | Poids |
|-----------|-------------|-------|
| **Meta Tags** | Title, description, OG tags | 20% |
| **Images** | Alt text, poids, format, ratio | 15% |
| **Headings** | Hiérarchie H1-H6 | 15% |
| **Links** | Validité, sémantique | 15% |
| **Accessibility** | WCAG AA/AAA, ARIA | 20% |
| **Performance** | Core Web Vitals, Lighthouse | 15% |

**Niveaux de score**:
- 🟢 **4.0-5.0**: Excellent
- 🔵 **3.0-3.9**: Good
- 🟡 **2.0-2.9**: Warning (amélioration nécessaire)
- 🔴 **0.0-1.9**: Error (problèmes critiques)

---

## 🎯 Utilisation avancée

### Dashboard complet

Après une analyse, cliquer sur **"📊 Voir le Dashboard"** pour accéder à:

- **Overview Tab**: Vue d'ensemble avec KPIs et scores
- **History Tab**: Historique de toutes les analyses
- **Comparison Tab**: Comparer plusieurs pages
- **Settings Tab**: Configuration des presets et thresholds

### Configuration des presets

L'extension offre **6 presets préconfigurés**:

#### 1. SEO_STANDARD (par défaut)
```javascript
meta.title: 30-70 caractères
meta.description: 120-160 caractères
images.weight.hero: 500KB max
```

#### 2. SEO_STRICT
```javascript
meta.title: 40-60 caractères
meta.description: 140-155 caractères
images.weight.hero: 300KB max
```

#### 3. PERMISSIVE
```javascript
meta.title: 10-90 caractères
meta.description: 50-180 caractères
images.weight.hero: 1MB max
```

#### 4. ECOMMERCE
Optimisé pour les sites e-commerce avec focus sur les images produit

#### 5. BLOG
Optimisé pour les blogs avec focus sur le contenu et la lisibilité

#### 6. CORPORATE
Optimisé pour les sites corporate avec normes strictes

### Profils d'analyse

Personnaliser quels endpoints sont activés:

- **FULL**: Tous les endpoints (par défaut)
- **CDP**: Meta + Images + Headings (Chargé de Projet)
- **WEBDESIGNER**: Images + Headings + Accessibility
- **ACCESSIBILITY**: Accessibility + Headings + Links
- **PERFORMANCE**: Performance + Images only

### Modification des thresholds en temps réel

```javascript
// Dans la console DevTools de l'extension popup
chrome.storage.local.get('configManager', (data) => {
  console.log('Current config:', data);
});

// Modifier un threshold
chrome.storage.local.set({
  'meta.title.max': 80  // Au lieu de 70
});
```

---

## 🏗️ Architecture technique

### Flux d'analyse complet

```
┌─────────────┐        ┌──────────────┐       ┌────────────────┐
│   Popup     │───────▶│Service Worker│───────▶│Content Script  │
│  (UI)       │        │(Coordinator) │        │(DataExtractor) │
└─────────────┘        └──────────────┘       └────────────────┘
       │                       │                        │
       │                       │                        ▼
       │                       │              ┌─────────────────┐
       │                       │              │  Real Page DOM  │
       │                       │              │  - Meta tags    │
       │                       │              │  - Images       │
       │                       │              │  - Headings     │
       │                       │              │  - Links        │
       │                       │              │  - A11y data    │
       │                       │              │  - Performance  │
       │                       │              └─────────────────┘
       │                       │                        │
       │                       │                        │
       │                       ▼                        │
       │             ┌────────────────────┐            │
       │             │AnalysisOrchestrator│◀───────────┘
       │             └────────────────────┘
       │                       │
       │                       ▼
       │              ┌─────────────────┐
       │              │  6 Endpoints    │
       │              │  - MetaAnalyzer │
       │              │  - ImageAnalyzer│
       │              │  - HeadingAnalyz│
       │              │  - LinkAnalyzer │
       │              │  - A11yAnalyzer │
       │              │  - PerfAnalyzer │
       │              └─────────────────┘
       │                       │
       │                       ▼
       │              ┌─────────────────┐
       │              │ ScoringEngine   │
       │              └─────────────────┘
       │                       │
       │                       ▼
       │              ┌─────────────────┐
       │              │  Final Result   │
       │              │  globalScore    │
       │              │  level          │
       │              │  recommendations│
       │              └─────────────────┘
       │                       │
       ▼                       │
┌──────────────┐              │
│ Dashboard    │◀─────────────┘
│ - Charts     │
│ - History    │
│ - Export     │
└──────────────┘
```

### Fichiers clés

| Fichier | Rôle | Taille |
|---------|------|--------|
| `manifest.json` | Configuration Manifest V3 | ~90 lignes |
| `content-script.js` | Point d'entrée content script | ~150 lignes |
| `api/extractors/DataExtractor.js` | Extraction données page | ~600 lignes |
| `service_worker.js` | Coordination background | ~2000 lignes |
| `api/core/AnalysisCoordinator.js` | Orchestration analyses | ~330 lignes |
| `api/core/AnalysisOrchestrator.js` | Gestion endpoints | ~600 lignes |
| `api/endpoints/*.js` | 6 endpoints d'analyse | ~3000 lignes |
| `api/config/ConfigurationManager.js` | Gestion configuration | ~1200 lignes |
| `api/core/ScoringEngine.js` | Calcul scores | ~700 lignes |

---

## 🧪 Test de l'installation

### Test 1: Vérifier que l'extension est chargée

```javascript
// Ouvrir DevTools (F12) > Console
// Sur n'importe quelle page web

// Vérifier que le content script est chargé
window.__webQualityAnalyzer
// Devrait retourner: { version: '5.0.0', extractPageData: function }
```

### Test 2: Test d'extraction de données

```javascript
// Dans la console de la page web
await window.__webQualityAnalyzer.extractPageData()
// Devrait retourner un objet avec toutes les données de la page
```

### Test 3: Test du service worker

```bash
# Ouvrir chrome://extensions/
# Cliquer sur "Service worker" sous l'extension
# Dans la console du service worker:

chrome.runtime.sendMessage(
  { action: 'analyzePageV5', tabId: CURRENT_TAB_ID },
  (response) => console.log(response)
);
```

### Test 4: Analyse complète sur une page de test

**Pages de test recommandées**:
1. https://example.com (simple, bon score attendu)
2. https://github.com (complexe, score moyen attendu)
3. Votre propre site web

---

## 🔍 Dépannage

### Problème: "Content script not loaded"

**Cause**: Le content script ne s'est pas injecté dans la page

**Solution**:
1. Recharger l'extension dans `chrome://extensions/`
2. Recharger la page web (F5)
3. Vérifier dans DevTools > Sources > Content Scripts

### Problème: "DataExtractor failed to load"

**Cause**: Le fichier DataExtractor.js n'est pas accessible

**Solution**:
1. Vérifier que `api/extractors/DataExtractor.js` existe
2. Vérifier `web_accessible_resources` dans `manifest.json`
3. Recharger l'extension

### Problème: "No tab ID provided"

**Cause**: L'onglet actif n'a pas pu être détecté

**Solution**:
1. S'assurer que la page est complètement chargée
2. Éviter les pages système (chrome://, about:, etc.)
3. Essayer sur une vraie page web (http:// ou https://)

### Problème: "Analysis timeout"

**Cause**: L'analyse prend trop de temps (page très lourde)

**Solution**:
1. Attendre quelques secondes de plus
2. Vérifier la console pour les erreurs
3. Essayer sur une page plus simple

### Problème: Scores à 0 ou données manquantes

**Cause**: La page n'a pas certaines données

**Solution**:
- C'est normal ! Toutes les pages n'ont pas tous les éléments
- Vérifier le rapport détaillé pour voir ce qui manque
- Par exemple: une page sans images aura un score images bas

### Logs de debug

**Console du service worker**:
```bash
chrome://extensions/ > Service worker > Console
```

**Console du content script**:
```bash
F12 > Console (sur la page analysée)
```

**Filtrer les logs v5.0**:
```javascript
// Uniquement les logs v5.0
[v5.0]
[AnalysisCoordinator]
[DataExtractor]
```

---

## 📊 Exemple de résultat complet

```json
{
  "url": "https://example.com",
  "timestamp": 1673520000000,
  "globalScore": 4.3,
  "level": "excellent",
  "duration": 8432,
  "config": {
    "preset": "SEO_STANDARD",
    "profile": "FULL"
  },
  "analyses": {
    "meta": {
      "globalScore": 4.5,
      "title": { "length": 58, "score": 5, "level": "excellent" },
      "description": { "length": 145, "score": 5, "level": "excellent" }
    },
    "images": {
      "globalScore": 4.2,
      "totalImages": 12,
      "withAlt": 10,
      "withoutAlt": 2,
      "optimized": 8
    },
    "headings": {
      "globalScore": 5.0,
      "hierarchy": { "valid": true },
      "h1Count": 1
    },
    "links": {
      "globalScore": 4.0,
      "totalLinks": 45,
      "broken": 0,
      "semantics": { "score": 4.0 }
    },
    "accessibility": {
      "globalScore": 4.1,
      "wcag": { "level": "AA", "contrastPassing": 45, "contrastTotal": 50 },
      "aria": { "valid": 12, "invalid": 1 }
    },
    "performance": {
      "globalScore": 4.0,
      "coreWebVitals": { "LCP": 2100, "FID": 80, "CLS": 0.08 },
      "lighthouse": { "performance": 85 }
    }
  },
  "recommendations": [
    "Ajouter alt text aux 2 images manquantes",
    "Corriger 1 attribut ARIA invalide",
    "Optimiser 4 images (format WebP recommandé)"
  ]
}
```

---

## 🎓 Ressources supplémentaires

- **Documentation API**: `README_V5.md`
- **Guide de test**: `TESTING_GUIDE.md`
- **Guide rapide**: `START_HERE.md`
- **Template de rapport**: `TEST_REPORT_TEMPLATE.md`

---

## 📝 Notes importantes

1. **Permissions**: L'extension demande `<all_urls>` pour analyser n'importe quelle page
2. **Données privées**: Aucune donnée n'est envoyée à des serveurs externes
3. **Stockage local**: Les résultats sont stockés uniquement dans `chrome.storage.local`
4. **Limite de cache**: Maximum 10 analyses en cache
5. **Performance**: Analyse complète en 5-15 secondes selon la complexité de la page

---

## ✅ Checklist post-installation

- [ ] Extension visible dans `chrome://extensions/`
- [ ] Version 5.0.0 affichée
- [ ] Icône épinglée dans la barre d'outils
- [ ] Content script se charge (`window.__webQualityAnalyzer` existe)
- [ ] Service worker actif (pas d'erreurs dans la console)
- [ ] Popup s'ouvre correctement
- [ ] Bouton "🚀 Analyse Complète v5.0" visible
- [ ] Test réussi sur https://example.com
- [ ] Dashboard accessible via le bouton
- [ ] Résultats sauvegardés dans l'historique

---

## 🆘 Support

En cas de problème:

1. Vérifier les logs dans la console du service worker
2. Consulter la section Dépannage ci-dessus
3. Ouvrir une issue sur GitHub avec:
   - Version de Chrome
   - URL de la page testée
   - Logs d'erreur complets
   - Capture d'écran si possible

---

**Version**: 5.0.0
**Dernière mise à jour**: 2026-01-16
**Auteur**: Artkabis
**Licence**: MIT
