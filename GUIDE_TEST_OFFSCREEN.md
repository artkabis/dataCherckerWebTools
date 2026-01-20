# Guide de Test - Offscreen Document API v5.0

## 🎯 Objectif
Tester la nouvelle fonctionnalité d'analyse multi-pages qui utilise l'Offscreen Document API pour analyser des pages web sans ouvrir d'onglets visibles.

---

## 📋 ÉTAPE 1 : Préparation

### 1.1 Rechargement de l'extension

1. Ouvrir Chrome et aller sur `chrome://extensions/`
2. Activer le "**Mode développeur**" (toggle en haut à droite)
3. Localiser l'extension "**Web Quality Analyzer**"
4. Cliquer sur le bouton **🔄 "Recharger"**
5. Vérifier qu'aucune erreur n'apparaît

### 1.2 Ouvrir les outils de développement

**Console du Service Worker :**
```
chrome://extensions/
→ Trouver "Web Quality Analyzer"
→ Cliquer "Inspecter les vues : service worker"
→ Onglet "Console"
```
✅ **Gardez cette fenêtre ouverte** pour suivre les logs en temps réel

**Console Offscreen (optionnel) :**
```
chrome://inspect/#extensions
→ Trouver "offscreen-analyzer.html" (apparaîtra après premier lancement)
→ Cliquer "inspect"
→ Onglet "Console"
```

---

## 🧪 ÉTAPE 2 : Test de Base - Analyse Offscreen Simple

### 2.1 Préparer les URLs de test

Utilisez ces URLs statiques (garanties de fonctionner) :
```
https://example.com,https://example.org,https://example.net
```

### 2.2 Configuration du test

1. Cliquer sur l'icône de l'extension (coin supérieur droit de Chrome)
2. Aller sur l'onglet **"Analyse Multi-URL"**
3. Sélectionner le mode **"Liste d'URLs"** (radio button)
4. Coller les URLs dans le textarea
5. Dans "**Méthode d'analyse multi-pages**" :
   - Sélectionner **🚀 Offscreen (Rapide & Invisible)**

### 2.3 Lancement de l'analyse

1. Cliquer sur **"🚀 Analyser avec v5.0"**
2. Observer le popup :
   - ✅ Le bouton devient "⏳ Analyse en cours..."
   - ✅ Message : "Démarrage de l'analyse v5.0... Méthode: Offscreen (rapide)"

### 2.4 Vérifications attendues

**Dans le popup :**
- [ ] Aucun nouvel onglet ne s'ouvre
- [ ] Barre de progression apparaît
- [ ] Pourcentage augmente progressivement

**Dans la console Service Worker :**
```javascript
[OffscreenBatchAnalyzer] Starting batch analysis: 3 URLs
[OffscreenBatchAnalyzer] Detection complete: { offscreen: 3, tab: 0, percentage: 100% }
[Offscreen Batch] Method selection: ...
[Offscreen Batch] Analysis complete: { success: 3, errors: 0 }
```

**Dans la console Offscreen (si ouverte) :**
```javascript
[Offscreen] Ready to analyze pages
[Offscreen] Message received: analyzeUrls
[Offscreen] Fetching https://example.com (attempt 1/3)
[Offscreen] Fetched https://example.com (1.2 KB)
[Offscreen] Analyzed https://example.com (score: 78)
[Offscreen] Progress: 1/3 (0 errors)
[Offscreen] Progress: 2/3 (0 errors)
[Offscreen] Progress: 3/3 (0 errors)
[Offscreen] Batch complete: 3 success, 0 errors in 4.5s
```

### 2.5 Résultat final

- [ ] Message de succès dans le popup
- [ ] Statistiques affichées :
  - Total pages analysées
  - Nombre de succès
  - Nombre d'erreurs
  - Score moyen
- [ ] Bouton devient actif à nouveau

---

## 🔬 ÉTAPE 3 : Test Avancé - Mode Auto avec Sitemap

### 3.1 URLs de test sitemap

Utilisez un sitemap public :
```
https://www.sitemaps.org/sitemap.xml
```

OU un sitemap plus petit pour tests rapides :
```
https://example.com/sitemap.xml
```

### 3.2 Configuration

1. Dans le popup, onglet "**Analyse Multi-URL**"
2. Sélectionner **"Sitemap XML"**
3. Entrer l'URL du sitemap
4. Méthode : **🤖 Auto (Intelligent)**
5. Cliquer "🚀 Analyser avec v5.0"

### 3.3 Vérifications - Détection automatique

**Console Service Worker - Détection :**
```javascript
[PageTypeDetector] Batch analysis: 75.0% can use offscreen
[OffscreenBatchAnalyzer] Detection complete: {
  offscreen: 15,
  tab: 5,
  percentage: 75%
}
[Offscreen Batch] Method selection: offscreen: 15, tab: 5
```

**Comportement attendu :**
- [ ] La majorité des URLs statiques → offscreen (invisible)
- [ ] Les URLs dynamiques détectées → tabs (onglets visibles)
- [ ] Mix des deux méthodes automatiquement

### 3.4 Détection de frameworks JavaScript

**Pages qui DOIVENT être détectées comme "tab" :**
- Sites React : https://react.dev
- Sites Next.js : https://nextjs.org
- Sites avec Shopify, Wix, etc.

**Console attendue :**
```javascript
[PageTypeDetector] Framework react détecté (pattern: __REACT)
[PageTypeDetector] Detection: { method: 'tab', confidence: 0.9, framework: 'react' }
```

---

## ⚖️ ÉTAPE 4 : Comparaison Offscreen vs Tabs

### 4.1 Test avec même dataset

Même liste de 10 URLs, tester les 2 méthodes :

**Test A - Offscreen :**
1. Méthode : 🚀 Offscreen
2. Lancer et noter :
   - Temps total (console)
   - RAM utilisée (Gestionnaire de tâches Chrome)
   - Onglets ouverts (0)

**Test B - Tabs :**
1. Méthode : 🔖 Tabs
2. Lancer et noter :
   - Temps total
   - RAM utilisée
   - Onglets ouverts (3 simultanés)

### 4.2 Résultats attendus

| Métrique | Offscreen | Tabs | Gagnant |
|----------|-----------|------|---------|
| Temps (10 URLs) | ~15-20s | ~35-50s | ✅ Offscreen |
| RAM | ~50-80MB | ~200-300MB | ✅ Offscreen |
| Onglets visibles | 0 | 3 à la fois | ✅ Offscreen |
| Support JS | ⚠️ Limité | ✅ Complet | Tabs |
| Concurrent | 5 | 3 | ✅ Offscreen |

---

## 🐛 ÉTAPE 5 : Tests d'Erreur & Edge Cases

### 5.1 URL invalide

**Test :**
```
https://this-domain-does-not-exist-12345.com
```

**Résultat attendu :**
```javascript
[Offscreen] Fetch failed for https://...: Failed to fetch
[Offscreen] Batch complete: 0 success, 1 errors
```
- [ ] Erreur capturée proprement
- [ ] Pas de crash
- [ ] Statistiques correctes (1 erreur)

### 5.2 Timeout

**Test :**
```
https://httpstat.us/200?sleep=60000
```

**Résultat attendu :**
```javascript
[Offscreen] Fetch failed: AbortError (timeout)
[Offscreen] Retrying in 1000ms...
```
- [ ] Retry automatique (jusqu'à 2 fois)
- [ ] Timeout après 30s par URL
- [ ] Erreur finale si échec persistant

### 5.3 Mix URLs valides/invalides

**Test :**
```
https://example.com,https://invalid.xyz,https://example.org
```

**Résultat attendu :**
- [ ] 2 succès, 1 erreur
- [ ] Analyse continue malgré erreur
- [ ] Statistiques finales correctes

### 5.4 Sitemap vide ou invalide

**Test :**
```
https://example.com/sitemap-that-does-not-exist.xml
```

**Résultat attendu :**
- [ ] Erreur claire : "Failed to fetch sitemap"
- [ ] Bouton redevient actif
- [ ] Message d'erreur dans popup

---

## 📊 ÉTAPE 6 : Validation des Résultats d'Analyse

### 6.1 Structure des résultats

Après une analyse réussie, vérifier dans `chrome.storage.local` :

**DevTools Console (page quelconque) :**
```javascript
chrome.storage.local.get(['offscreenBatchResults'], (data) => {
  console.log(data.offscreenBatchResults);
});
```

**Structure attendue :**
```javascript
{
  success: [
    {
      url: "https://example.com",
      timestamp: 1234567890,
      score: 85,
      meta: {
        title: "Example Domain",
        description: "...",
        issues: []
      },
      images: {
        count: 0,
        withoutAlt: 0,
        images: []
      },
      headings: {
        h1: [{ text: "Example Domain", length: 14 }],
        h2: [],
        issues: []
      },
      links: {
        count: 1,
        internal: 0,
        external: 1,
        links: [...]
      },
      accessibility: {
        hasLang: true,
        lang: "en",
        issues: []
      }
    }
  ],
  errors: [],
  stats: {
    total: 3,
    success: 3,
    errors: 0,
    offscreenCount: 3,
    tabCount: 0,
    averageScore: "82.3",
    duration: 4523
  }
}
```

### 6.2 Vérifications de qualité

Pour chaque résultat, vérifier :

**Meta tags :**
- [ ] `title` extrait correctement
- [ ] `description` présente
- [ ] `canonical` détecté si présent
- [ ] Open Graph tags (`ogTags`)

**Images :**
- [ ] Compte correct
- [ ] Attributs `alt` vérifiés
- [ ] URLs absolues (pas relatives)

**Headings :**
- [ ] H1 détecté
- [ ] Hiérarchie validée
- [ ] Issues signalés (H1 multiple, sauts de niveau)

**Liens :**
- [ ] Distinction internal/external
- [ ] Vérification `rel="noopener"` sur externes
- [ ] Liens sans texte signalés

**Accessibilité :**
- [ ] Attribut `lang` sur `<html>`
- [ ] Images sans `alt` comptées
- [ ] Labels de formulaires vérifiés

**Score global :**
- [ ] Entre 0 et 100
- [ ] Calcul cohérent avec les issues

---

## 🔧 ÉTAPE 7 : Debugging en cas de problème

### 7.1 L'offscreen document ne se crée pas

**Symptômes :**
```javascript
Error: Failed to create offscreen document
```

**Vérifications :**
1. Permission `offscreen` dans `manifest.json` ✓
2. Fichiers `offscreen-analyzer.html` et `.js` présents
3. Recharger l'extension complètement
4. Vérifier Chrome version ≥ 109

**Fix :**
```bash
# Vérifier les fichiers
ls globalCherckerWebSiteCQ/offscreen-analyzer.*
```

### 7.2 CORS bloque les fetch

**Symptômes :**
```javascript
Fetch failed: CORS policy blocked
```

**Vérifications :**
1. CORSManager activé :
```javascript
// Console Service Worker
corsManager.getState()
// Doit retourner : { isEnabled: true, refCount: 1, ... }
```

2. Règles declarativeNetRequest actives :
```javascript
chrome.declarativeNetRequest.getEnabledRulesets()
// Doit inclure : ["overwrite-origin"]
```

**Fix :**
```javascript
// Forcer activation CORS
chrome.runtime.sendMessage({ corsEnabled: true });
```

### 7.3 Pas de résultats retournés

**Symptômes :**
- Analyse semble complète
- Mais `results` est vide

**Vérifications :**
1. Console offscreen : vérifier `response.success === true`
2. Vérifier `sendResponse()` appelé dans offscreen-analyzer.js
3. Vérifier timeout suffisant (30s par défaut)

**Console debug :**
```javascript
// Dans offscreen-analyzer.js, ajouter temporairement
console.log('RESULTS:', results);
console.log('SENDING RESPONSE:', { success: true, results });
```

### 7.4 Détection incorrecte (offscreen au lieu de tab)

**Symptômes :**
- Page React analysée avec offscreen
- Contenu manquant ou incomplet

**Fix temporaire - Forcer méthode :**
```javascript
// Dans popup, utiliser méthode "Tabs" au lieu de "Auto"
```

**Fix permanent - Améliorer détection :**
Ajouter domaine à la liste dans `PageTypeDetector.js` :
```javascript
static JS_HEAVY_DOMAINS = [
  'app.', 'admin.', 'dashboard.',
  'shopify.com', 'wix.com',
  'votre-domaine-react.com'  // ← Ajouter ici
];
```

---

## ✅ ÉTAPE 8 : Checklist Finale de Validation

Avant de considérer le test réussi, vérifier :

### Fonctionnalités de base
- [ ] ✅ Extension charge sans erreur
- [ ] ✅ Popup s'ouvre correctement
- [ ] ✅ Onglet "Analyse Multi-URL" visible
- [ ] ✅ 3 méthodes disponibles (Offscreen/Tabs/Auto)

### Analyse Offscreen
- [ ] ✅ Aucun onglet visible pendant analyse
- [ ] ✅ Progression affichée en temps réel
- [ ] ✅ 3-5 URLs analysées en < 20s
- [ ] ✅ Résultats complets (meta, images, headings, links)
- [ ] ✅ Scores calculés correctement

### Détection automatique (Mode Auto)
- [ ] ✅ Pages statiques → offscreen
- [ ] ✅ Pages React/Vue → tabs
- [ ] ✅ Statistiques de détection affichées dans console
- [ ] ✅ Mix des deux méthodes fonctionne

### Gestion d'erreurs
- [ ] ✅ URLs invalides gérées proprement
- [ ] ✅ Timeouts avec retry
- [ ] ✅ Erreurs n'arrêtent pas l'analyse
- [ ] ✅ Statistiques finales incluent erreurs

### Performance
- [ ] ✅ Offscreen plus rapide que tabs (2-3x)
- [ ] ✅ RAM réduite vs tabs
- [ ] ✅ Concurrent 5 pages (offscreen) vs 3 (tabs)

### Compatibilité
- [ ] ✅ Ancien système v4 toujours fonctionnel
- [ ] ✅ Bouton "Analyser (v4)" fonctionne
- [ ] ✅ Analyse page unique v5.0 fonctionne
- [ ] ✅ CORSManager s'active/désactive correctement

---

## 📈 ÉTAPE 9 : Mesures de Performance

### 9.1 Benchmark standardisé

**Dataset de test :**
```
https://example.com
https://example.org
https://example.net
https://wikipedia.org
https://github.com
https://stackoverflow.com
https://dev.to
https://medium.com
https://reddit.com
https://news.ycombinator.com
```

**Protocole :**
1. Redémarrer Chrome (pour reset RAM)
2. Ouvrir Gestionnaire de tâches Chrome (`Shift+Esc`)
3. Noter RAM initiale extension
4. Lancer analyse avec méthode Offscreen
5. Noter :
   - Temps total (console)
   - RAM pic (Gestionnaire tâches)
   - Nombre erreurs
   - Score moyen

**Résultats attendus (10 URLs) :**
```
Méthode Offscreen :
- Temps : 15-25 secondes
- RAM pic : +50-100MB
- Onglets ouverts : 0
- Concurrent : 5

Méthode Tabs :
- Temps : 40-60 secondes
- RAM pic : +200-400MB
- Onglets ouverts : 3 à la fois
- Concurrent : 3
```

### 9.2 Test de charge (optionnel)

**Sitemap avec 100+ URLs :**
```
https://www.sitemaps.org/large-sitemap.xml
```

**Vérifications :**
- [ ] Pas de crash après 50 pages
- [ ] Mémoire stable (pas de fuite)
- [ ] Progress tracking précis
- [ ] Possibilité d'arrêter à tout moment

---

## 🎓 ÉTAPE 10 : Compréhension du Système

### 10.1 Architecture simplifiée

```
┌─────────────────┐
│   POPUP.JS      │ ← Utilisateur choisit méthode
└────────┬────────┘
         │ Message: startOffscreenBatchAnalysis
         ▼
┌─────────────────────────────────────┐
│   SERVICE_WORKER.JS                 │
│   - Crée OffscreenBatchAnalyzer     │
│   - Active CORSManager              │
└────────┬───────────────────┬────────┘
         │ Offscreen         │ Tabs
         ▼                   ▼
┌──────────────────┐  ┌─────────────┐
│ OFFSCREEN DOC    │  │ TABS        │
│ - Fetch HTML     │  │ - Open tabs │
│ - Parse DOM      │  │ - Inject    │
│ - Extract data   │  │ - Analyze   │
└──────────────────┘  └─────────────┘
         │                   │
         └─────────┬─────────┘
                   ▼
         ┌──────────────────┐
         │ RESULTS STORAGE  │
         │ chrome.storage   │
         └──────────────────┘
```

### 10.2 Flux de messages

**1. User clicks "Analyser v5.0"**
```javascript
popup.js → chrome.runtime.sendMessage({
  action: 'startOffscreenBatchAnalysis',
  urls: [...],
  config: { autoDetect: true }
})
```

**2. Service Worker traite**
```javascript
service_worker.js → handleStartOffscreenBatchAnalysis()
  → corsManager.enable()
  → offscreenBatchAnalyzer.analyzeBatch(urls)
```

**3. Détection de type**
```javascript
PageTypeDetector.detectBatch(urls)
  → Pour chaque URL : fetch HEAD, parse HTML
  → Retourne { offscreen: [...], tab: [...] }
```

**4. Analyse offscreen**
```javascript
OffscreenBatchAnalyzer → chrome.offscreen.createDocument()
  → Envoie message à offscreen-analyzer.js
  → offscreen-analyzer.js : fetch + parse + analyze
  → Retourne résultats via sendResponse()
```

**5. Agrégation**
```javascript
service_worker.js → Compile résultats
  → Sauvegarde chrome.storage.local
  → Notifie popup (si ouvert)
```

---

## 📞 Support & Troubleshooting

### Logs à collecter en cas de problème

**1. Console Service Worker :**
```javascript
// Copier tout le contenu de la console
// Particulièrement les lignes avec [Offscreen] ou [CORS]
```

**2. Storage inspection :**
```javascript
chrome.storage.local.get(null, (data) => {
  console.log('ALL STORAGE:', JSON.stringify(data, null, 2));
});
```

**3. Manifest validation :**
```javascript
// Vérifier permissions
chrome.runtime.getManifest().permissions
// Doit inclure "offscreen"
```

### Questions fréquentes

**Q: "No batch analysis results available"**
A: L'instance OffscreenBatchAnalyzer n'est pas créée. Vérifier que le message `startOffscreenBatchAnalysis` arrive bien au service worker.

**Q: "Offscreen document already exists"**
A: Normal si relancement rapide. Le système réutilise le document existant.

**Q: Analyse très lente**
A: Vérifier concurrent settings. Devrait être 5 pour offscreen, 3 pour tabs.

**Q: Résultats incomplets (headings vides, etc.)**
A: Page probablement générée par JavaScript. Utiliser méthode "Tabs" ou vérifier détection auto.

---

## ✨ Conclusion

Si tous les tests passent, vous avez validé :
- ✅ Analyse invisible ultra-rapide (Offscreen)
- ✅ Détection automatique intelligente (Auto)
- ✅ Compatibilité backward (Tabs v4)
- ✅ Gestion d'erreurs robuste
- ✅ Performance 2-3x meilleure que tabs

**Prochaines étapes suggérées :**
1. Tester avec vos propres sitemaps de production
2. Affiner la détection si nécessaire
3. Implémenter dashboard pour visualiser résultats batch
4. Ajouter export CSV/PDF des résultats

---

**Version du guide :** 1.0
**Date :** 2026-01-20
**Extension :** Web Quality Analyzer v5.0
