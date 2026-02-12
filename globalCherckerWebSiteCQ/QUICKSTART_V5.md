# 🚀 Quick Start - Web Quality Analyzer v5.0

## Installation en 3 étapes

### 1. Charger l'extension

```bash
# Dans votre terminal
cd globalCherckerWebSiteCQ
```

### 2. Ouvrir Chrome Extensions

- Aller à `chrome://extensions/`
- Activer "Mode développeur"
- Cliquer "Charger l'extension non empaquetée"
- Sélectionner le dossier `globalCherckerWebSiteCQ`

### 3. Épingler l'extension

- Cliquer sur l'icône extensions (puzzle)
- Épingler "Web Quality Analyzer"

---

## Utilisation en 3 clics

### 1. Ouvrir une page web
```
https://example.com
```

### 2. Cliquer sur l'extension
![Extension Icon]

### 3. Lancer l'analyse v5.0
Bouton: **🚀 Analyse Complète v5.0**

---

## Résultat instantané

```
✓ Analyse terminée !
Score global: 4.3/5 (excellent)
URL: https://example.com

📊 Voir le Dashboard
```

---

## Dashboard - Comprendre vos résultats

### Score Global
- **🟢 4.0-5.0**: Excellent - Rien à redire !
- **🔵 3.0-3.9**: Good - Quelques améliorations possibles
- **🟡 2.0-2.9**: Warning - Action recommandée
- **🔴 0.0-1.9**: Error - Problèmes critiques

### 6 Catégories analysées

#### 1. Meta Tags (20%)
- Title (30-70 caractères)
- Description (120-160 caractères)
- OG Tags (Facebook/Twitter)

#### 2. Images (15%)
- Alt text présent
- Poids optimisé
- Format moderne (WebP)
- Ratio correct

#### 3. Headings (15%)
- Un seul H1
- Hiérarchie respectée (H1 → H2 → H3)
- Pas de saut de niveau

#### 4. Links (15%)
- Liens valides (pas cassés)
- Textes descriptifs (pas "cliquez ici")
- Attributs corrects (rel, target)

#### 5. Accessibility (20%)
- WCAG AA/AAA
- Contraste des couleurs
- Attributs ARIA
- Navigation clavier

#### 6. Performance (15%)
- Core Web Vitals (LCP, FID, CLS)
- Lighthouse Score
- Taille des ressources
- Temps de chargement

---

## Presets disponibles

Changer le preset dans Settings:

- **SEO_STANDARD** ⭐ (par défaut)
- **SEO_STRICT** (normes strictes)
- **PERMISSIVE** (souple)
- **ECOMMERCE** (sites e-commerce)
- **BLOG** (blogs et articles)
- **CORPORATE** (sites corporate)

---

## Export des résultats

Dans le dashboard:

1. Onglet "Overview"
2. Bouton "Export"
3. Choisir format:
   - **JSON** (données brutes)
   - **CSV** (Excel/Sheets)
   - **HTML** (rapport visuel)

---

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Alt+Shift+A` | Ouvrir l'extension |
| `Alt+Shift+D` | Ouvrir le dashboard |

---

## Troubleshooting rapide

### L'analyse ne démarre pas
1. Recharger la page (F5)
2. Recharger l'extension (`chrome://extensions/`)

### Scores à 0
- Normal si la page n'a pas certains éléments
- Vérifier le rapport détaillé

### Erreur "Content script not loaded"
1. Recharger l'extension
2. Recharger la page
3. Éviter les pages système (chrome://, about:)

---

## Support & Documentation

- 📖 **Guide complet**: `INSTALLATION_V5.md`
- 🧪 **Tests**: `TESTING_GUIDE.md`
- 🏗️ **Architecture**: `README_V5.md`
- 🐛 **Issues**: GitHub Issues

---

## Exemple rapide

```javascript
// Test dans la console de la page
await window.__webQualityAnalyzer.extractPageData()

// Résultat:
{
  url: "https://example.com",
  meta: { title: "Example Domain", description: "..." },
  images: [...],
  headings: [...],
  links: [...],
  accessibility: {...},
  performance: {...}
}
```

---

**C'est parti !** 🎉

Analysez votre première page en moins de 2 minutes.
