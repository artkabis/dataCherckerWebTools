# ⚡ Quick Test Reference - v5.0

## 🚀 Test en 5 Minutes

```
1. Ouvrir: test-dashboard.html
2. Cliquer 6 boutons (1 par section)
3. Vérifier: Tous les dots VERTS ✓
4. Si 6/6 verts → ✅ VALIDÉ
```

---

## 📊 Matrice de Test Rapide

| # | Section | Bouton à cliquer | Résultat attendu | ✓ |
|---|---------|------------------|------------------|---|
| 1 | Config | "Tester ConfigurationManager" | `currentPreset: "SEO_STANDARD"` | [ ] |
| 2 | Meta | "Analyser Meta Tags" | Score global **3.5-5** | [ ] |
| 3 | Image | "Analyser Images" | 3 images, 2 avec alt | [ ] |
| 4 | Heading | "Analyser Headings" | Hiérarchie valide ✓ | [ ] |
| 5 | Scoring | "Calculer Score Global" | Score ~4.17 | [ ] |
| 6 | Orchestrator | "Analyse Complète" | Success: true, durée <200ms | [ ] |

**Si 6/6 ✓** → Passer aux tests avancés
**Si < 6/6** → Consulter TESTING_GUIDE.md

---

## 🎯 Valeurs de Référence

### ConfigurationManager
```javascript
✓ availablePresets: 6
✓ availableProfiles: 5
✓ meta.title.min: 50
✓ meta.title.max: 65
```

### MetaAnalyzer (SEO_STANDARD)
```javascript
Input:
  title: 40 chars → Score: 2-4 ⚠️
  description: 148 chars → Score: 4-5 ✓

Plages optimales:
  title: 55-60 chars
  description: 145-155 chars
```

### ImageAnalyzer
```javascript
✓ Alt présent: score 5
✗ Alt manquant: score 0-3
✗ > 300KB: oversized
✓ < 300KB: optimal
```

### HeadingAnalyzer
```javascript
✓ 1 seul H1
✓ Pas de saut de niveau
✗ 2+ H1 → ERROR
✗ H1 → H4 → ERROR
```

### ScoringEngine
```javascript
Formule:
globalScore = Σ(score × weight) / Σ(weight)

Niveaux:
  ≥ 4.5 → Excellent ⭐⭐⭐⭐⭐
  ≥ 4.0 → Bon ⭐⭐⭐⭐
  ≥ 3.5 → Acceptable ⭐⭐⭐
  < 3.5 → À améliorer ⚠️
```

---

## 🔴 Red Flags (Échec Immédiat)

Si vous voyez l'un de ces éléments, **STOP** et consultez le guide complet :

- ❌ Erreur console rouge au chargement
- ❌ "Cannot find ConfigurationManager"
- ❌ Score = NaN ou Infinity
- ❌ Durée analyse > 1000ms
- ❌ Export ne génère rien
- ❌ Plus de 2 dots rouges

---

## 🟢 Indicateurs de Succès

Signes que tout fonctionne parfaitement :

- ✅ Tous les dots verts en < 10 secondes
- ✅ Scores entre 0 et 5 (jamais NaN)
- ✅ JSON toujours formaté et lisible
- ✅ Messages clairs et actionnables
- ✅ Console propre (pas d'erreur rouge)
- ✅ Durées < 200ms

---

## 📋 Checklist Pré-Test (30 sec)

```bash
# 1. Vérifier fichiers
ls api/config/ConfigurationManager.js     # ✓
ls api/core/ScoringEngine.js              # ✓
ls api/core/AnalyzerEndpoint.js           # ✓
ls api/endpoints/MetaAnalyzerEndpoint.js  # ✓
ls api/endpoints/ImageAnalyzerEndpoint.js # ✓
ls api/endpoints/HeadingAnalyzerEndpoint.js # ✓

# 2. Lancer serveur
python3 -m http.server 8000

# 3. Ouvrir
http://localhost:8000/test-dashboard.html

# 4. Console F12
Vérifier: 0 erreur au chargement
```

---

## 🎨 Codes Couleurs

### Status Dots
- 🟡 **Jaune** (pending) → Pas encore testé
- 🟢 **Vert** (success) → Test réussi ✓
- 🔴 **Rouge** (error) → Test échoué ✗

### Alertes
- 🟢 **Vert** → Succès, tout va bien
- 🔴 **Rouge** → Erreur critique
- 🔵 **Bleu** → Information, test spécifique

### Scores
- 🟢 **Vert** (≥4.5) → Excellent
- 🔵 **Bleu** (≥4.0) → Bon
- 🟡 **Jaune** (≥3.0) → Acceptable
- 🔴 **Rouge** (<3.0) → Problématique

---

## 🧮 Calculs Rapides

### Score Meta
```
globalScore = (titleScore + descScore) / 2
```

### Score Image
```
imageScore = (altScore × 1 + weightScore × 1 + ratioScore × 1) / 3
```

### Score Global
```
globalScore = (meta + images + headings + ...) / N
avec pondération selon config
```

---

## 🔧 Commandes Console Utiles

```javascript
// Vérifier chargement
typeof ConfigurationManager // "function"
typeof ScoringEngine        // "function"
typeof AnalysisOrchestrator // "function"

// Test rapide config
const cfg = new ConfigurationManager();
await cfg.init();
console.log(cfg.currentPreset); // "SEO_STANDARD"

// Test rapide scoring
const scoring = new ScoringEngine(cfg);
const score = scoring.calculateScore('meta', 'title', 58);
console.log(score); // { score: 4-5, level: "good" }
```

---

## 📞 Aide Rapide

| Problème | Solution Rapide |
|----------|-----------------|
| Script non chargé | Vérifier Network tab (F12) |
| NaN dans scores | Vérifier données d'entrée |
| Durée > 1000ms | Réduire taille données test |
| Export vide | Autoriser popups navigateur |
| Console errors | Voir TESTING_GUIDE.md section Troubleshooting |

---

## 🎓 Niveaux de Test

### Niveau 1 : SMOKE (5 min)
```
→ 1 bouton par section
→ 6 clics total
→ Vérifier dots verts
```

### Niveau 2 : FUNCTIONAL (20 min)
```
→ Tous les boutons
→ 14 clics total
→ Vérifier valeurs détaillées
```

### Niveau 3 : EDGE CASES (20 min)
```
→ Cas limites
→ Données invalides
→ Vérifier robustesse
```

---

## 💾 Export Rapide des Résultats

```javascript
// Copier tous les résultats
const results = {
  config: document.getElementById('result-config').innerText,
  meta: document.getElementById('result-meta').innerText,
  image: document.getElementById('result-image').innerText,
  heading: document.getElementById('result-heading').innerText,
  scoring: document.getElementById('result-scoring').innerText,
  orchestrator: document.getElementById('result-orchestrator').innerText
};
copy(results); // Copie dans clipboard
```

---

## 🎯 Objectifs par Profil

### Développeur
- ✅ Tous les tests critiques passent
- ✅ Code review des endpoints
- ✅ Performance < 200ms

### QA/Testeur
- ✅ Tests fonctionnels complets
- ✅ Edge cases validés
- ✅ Rapport de test rempli

### Chef de Projet
- ✅ Smoke test OK (5 min)
- ✅ Démo fonctionnelle
- ✅ Prêt pour review

---

## 📱 One-Liner Status Check

```bash
# Tout en une commande
cd globalCherckerWebSiteCQ && \
ls api/config/ConfigurationManager.js api/core/*.js api/endpoints/*.js && \
echo "✓ Tous les fichiers présents" && \
python3 -m http.server 8000
```

---

## ⏱️ Timing Référence

| Action | Temps attendu |
|--------|---------------|
| Chargement page | < 1s |
| ConfigManager init | < 100ms |
| Meta analysis | < 50ms |
| Image analysis | < 100ms |
| Heading analysis | < 50ms |
| Analyse complète | < 200ms |
| Batch 3 pages | < 2s |
| Export JSON | < 50ms |

Si un timing dépasse **2x la valeur attendue**, investiguer.

---

## 🏆 Critère de Validation Final

```
✅ VALIDÉ si:
   - 10/10 tests critiques ✓
   - 3/4 tests importants ✓
   - 0 erreur console ✓
   - Performance OK ✓

⚠️ VALIDÉ AVEC RÉSERVES si:
   - 8/10 tests critiques ✓
   - Problèmes mineurs documentés

❌ REJETÉ si:
   - < 8/10 tests critiques
   - Erreur bloquante
   - Performance inacceptable
```

---

**Version** : 1.0
**Durée totale recommandée** : 5-45 minutes selon niveau
**Contact** : Voir TESTING_GUIDE.md pour support complet
