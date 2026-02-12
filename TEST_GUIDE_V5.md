# Guide de Test - Extension v5.0

## 📋 Préparation

### 1. Recharger l'extension
1. Ouvrir Chrome et aller à `chrome://extensions/`
2. Trouver "Web Quality Analyzer"
3. Cliquer sur le bouton de rechargement (🔄)

### 2. Ouvrir les Developer Tools
Pour voir les logs de débogage, vous devez ouvrir les outils de développement pour chaque contexte :

#### a) **Console du Popup**
1. Cliquer droit sur l'icône de l'extension dans la barre d'outils
2. Sélectionner "Inspecter la fenêtre contextuelle" (Inspect popup)
3. Onglet "Console" - vous verrez les logs préfixés par `[Popup v5.0]`

#### b) **Console du Content Script**
1. Ouvrir une page web (par exemple https://example.com)
2. Appuyer sur `F12` pour ouvrir DevTools
3. Onglet "Console" - vous verrez les logs préfixés par `[Content Script]`

#### c) **Console du Service Worker**
1. Aller à `chrome://extensions/`
2. Mode développeur activé
3. Trouver "Web Quality Analyzer"
4. Cliquer sur "service worker" (lien bleu)
5. Onglet "Console" - vous verrez les logs préfixés par `[v5.0]`

---

## 🧪 Test 1 : Analyse Single-Page

### Étapes :
1. **Naviguer vers une page** : Ouvrir une page web (ex: https://example.com)
2. **Ouvrir le popup** : Cliquer sur l'icône de l'extension
3. **Ouvrir la console du popup** : Clic droit → Inspecter la fenêtre contextuelle
4. **Lancer l'analyse** : Cliquer sur "🚀 Analyse Complète v5.0"

### Logs attendus :

**Dans la console du popup :**
```
[Popup v5.0] Single-page analysis button attached
[Popup v5.0] Starting single-page analysis...
[Popup v5.0] Active tab: {id: 123, url: "https://example.com", ...}
[Popup v5.0] Sending message to service worker...
[Popup v5.0] Response received: {success: true, data: {...}}
[Popup v5.0] Analysis successful! {url: "https://example.com", globalScore: 4.2, ...}
```

**Dans la console du service worker :**
```
[v5.0] Starting page analysis... {tabId: 123}
[AnalysisCoordinator] Starting analysis for tab: 123
[AnalysisCoordinator] Requesting full analysis from content script...
[AnalysisCoordinator] Analysis result received from content script
[AnalysisCoordinator] Analysis complete: {url: "https://example.com", ...}
```

**Dans la console de la page (Content Script) :**
```
[Content Script] Web Quality Analyzer v5.0 loaded
[Content Script] Message received: analyzePagepData
[Content Script] Starting page analysis...
[Content Script] Page data extracted: {meta: {...}, images: [...], ...}
[Content Script] Analysis complete: {url: "https://example.com", globalScore: 4.2, ...}
```

### Interface attendue :
- ✅ Bouton devient "⏳ Analyse en cours..."
- ✅ Zone `v5Status` s'affiche avec fond bleu clair
- ✅ Après quelques secondes, fond devient vert
- ✅ Affichage du score global et du niveau
- ✅ Bouton "📊 Voir le Dashboard" apparaît

---

## 🧪 Test 2 : Analyse Batch (Sitemap)

### Étapes :
1. **Ouvrir le popup** et aller dans l'onglet "Analyse multi-pages"
2. **Sélectionner "Sitemap XML"**
3. **Entrer une URL** : `https://example.com/sitemap.xml`
4. **Cliquer** sur "🚀 Analyser avec v5.0"

### Logs attendus :

**Dans la console du service worker :**
```
[v5.0 Batch] Starting batch analysis... {type: "sitemap", data: "https://example.com/sitemap.xml"}
[BatchAnalyzerV5] Fetching sitemap from: https://example.com/sitemap.xml
[BatchAnalyzerV5] Found 10 URLs in sitemap
[BatchAnalyzerV5] Starting analysis of 10 URLs with concurrency: 3
```

**Dans la console du popup :**
```
[Popup v5.0] Batch analysis button attached
```

### Interface attendue :
- ✅ Barre de progression qui se remplit
- ✅ Texte "0% (0/10)" qui se met à jour
- ✅ Bouton "⏹️ Arrêter" fonctionnel
- ✅ À la fin : résumé avec score moyen, pages analysées, etc.

---

## 🧪 Test 3 : Analyse Batch (Liste d'URLs)

### Étapes :
1. **Sélectionner "Liste d'URLs"**
2. **Entrer des URLs** (séparées par des virgules) :
   ```
   https://example.com/page1, https://example.com/page2, https://example.com/page3
   ```
3. **Cliquer** sur "🚀 Analyser avec v5.0"

### Interface attendue :
- ✅ Même comportement que pour le sitemap
- ✅ 3 URLs analysées

---

## ❌ Problèmes Possibles

### Problème 1 : Aucun log dans la console du popup
**Cause** : Le popup se ferme ou la console n'est pas ouverte assez tôt
**Solution** : Ouvrir la console AVANT de cliquer sur le bouton

### Problème 2 : "analyzeV5Btn not found"
**Cause** : Le bouton n'existe pas dans le DOM
**Solution** : Vérifier que le popup.html contient bien `id="analyzeV5Btn"`

### Problème 3 : "Runtime error: Could not establish connection"
**Cause** : Le content script n'est pas injecté
**Solution** : Recharger la page web, puis réessayer

### Problème 4 : "DataExtractor failed to load"
**Cause** : Les scripts ne sont pas chargés via content_scripts
**Solution** : Vérifier le manifest.json (déjà corrigé)

### Problème 5 : Analyse bloquée à "Extraction des données..."
**Cause** : Le content script ne répond pas
**Solution** :
1. Vérifier la console de la page pour voir les logs
2. Vérifier que tous les scripts sont bien chargés
3. Recharger la page et réessayer

---

## 🔍 Debug Avancé

### Vérifier que les scripts sont chargés :
Ouvrir la console de la page et taper :
```javascript
// Vérifier que les classes sont disponibles
typeof DataExtractor !== 'undefined'          // true
typeof ConfigurationManager !== 'undefined'   // true
typeof AnalysisOrchestrator !== 'undefined'   // true
```

### Test manuel dans la console de la page :
```javascript
// Lancer une analyse manuelle
window.__webQualityAnalyzer.runQuickAnalysis().then(result => {
  console.log('Résultat:', result);
});
```

### Vérifier le cache :
Dans la console du service worker :
```javascript
// Voir le cache
chrome.storage.local.get(null, data => {
  console.log('Storage:', Object.keys(data).filter(k => k.startsWith('analysis_')));
});
```

---

## 📊 Résultat Attendu

Si tout fonctionne correctement :

1. ✅ Les logs apparaissent dans les 3 consoles
2. ✅ L'analyse se termine en 2-5 secondes
3. ✅ Les résultats s'affichent dans le popup
4. ✅ Le bouton "Voir le Dashboard" est cliquable
5. ✅ Les données JSON sont visibles dans les logs

---

## 📝 Retour à me donner

Merci de me partager :

1. **Screenshots** de la console du popup avec les logs
2. **Screenshots** de l'interface popup avec les résultats
3. **Erreurs** rencontrées (copier-coller le message complet)
4. **Comportement** observé vs attendu

Cela m'aidera à corriger rapidement les problèmes restants !
