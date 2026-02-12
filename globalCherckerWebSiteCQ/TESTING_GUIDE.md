# 🧪 Guide de Test v5.0 - Méthodologie Complète

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Méthodologie de test](#méthodologie-de-test)
4. [Plan de test par module](#plan-de-test-par-module)
5. [Checklist de validation](#checklist-de-validation)
6. [Critères d'acceptation](#critères-dacceptation)
7. [Rapport de test](#rapport-de-test)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

### Objectif
Valider le bon fonctionnement de l'architecture v5.0 avec endpoints modulaires et système de configuration.

### Portée
- ✅ 6 modules principaux
- ✅ 3 endpoints implémentés (Meta, Image, Heading)
- ✅ Système de configuration avec 6 presets
- ✅ Moteur de scoring
- ✅ Orchestrateur d'analyses

### Durée estimée
- **Test rapide** : 15 minutes (happy path uniquement)
- **Test complet** : 45 minutes (tous les cas)
- **Test exhaustif** : 2 heures (edge cases + documentation)

---

## 📦 Prérequis

### Environnement

```bash
# 1. Vérifier la structure des fichiers
cd globalCherckerWebSiteCQ
ls -la api/config/
ls -la api/core/
ls -la api/endpoints/
ls -la dashboard/

# 2. Vérifier que test-dashboard.html existe
ls -la test-dashboard.html

# 3. Ouvrir avec un serveur HTTP (recommandé)
python3 -m http.server 8000
# Ou Node.js
npx http-server -p 8000
```

### Navigateur
- **Recommandé** : Chrome/Edge (DevTools puissants)
- **Minimum** : Firefox, Safari

### Outils
- ✅ Console navigateur (F12)
- ✅ Network tab (pour vérifier les chargements)
- ✅ Bloc-notes pour noter les résultats

---

## 🔬 Méthodologie de Test

### Approche en 3 phases

```
Phase 1: SMOKE TEST (5 min)
├─ Vérifier que la page charge
├─ Tester 1 bouton par section
└─ Validation rapide des résultats

Phase 2: FUNCTIONAL TEST (20 min)
├─ Tester tous les boutons
├─ Vérifier les résultats détaillés
├─ Valider les scores et messages
└─ Tester cas normaux et edge cases

Phase 3: INTEGRATION TEST (20 min)
├─ Tester l'orchestrateur complet
├─ Valider l'export de données
├─ Tester les configurations personnalisées
└─ Vérifier la cohérence entre modules
```

### Principe AAA (Arrange-Act-Assert)

Pour chaque test :

1. **Arrange** : Préparer les données
2. **Act** : Exécuter l'action (clic bouton)
3. **Assert** : Vérifier le résultat

---

## 📊 Plan de Test par Module

### Module 1️⃣ : ConfigurationManager

#### Test 1.1 : Initialisation
```yaml
ID: CM-001
Nom: Initialisation ConfigurationManager
Priorité: CRITIQUE
Durée: 1 min

Steps:
  1. Cliquer sur "Tester ConfigurationManager"
  2. Attendre le résultat

Résultat attendu:
  ✓ Message vert "✓ ConfigurationManager initialisé avec succès !"
  ✓ currentPreset: "SEO_STANDARD"
  ✓ currentProfile: "FULL"
  ✓ availablePresets: array de 6 éléments
  ✓ availableProfiles: array de 5 éléments
  ✓ sampleConfig contient: metaTitle, imagesWeight, headingsH1

Critères de validation:
  - Status dot devient VERT
  - JSON bien formaté
  - Aucune erreur console
  - Temps < 100ms

Points de vigilance:
  - Vérifier que les 6 presets sont listés
  - Vérifier les valeurs par défaut (meta.title.min=50, max=65)
```

#### Test 1.2 : Tous les Presets
```yaml
ID: CM-002
Nom: Validation des 6 presets
Priorité: HAUTE
Durée: 2 min

Steps:
  1. Cliquer sur "Tester tous les Presets"
  2. Observer le JSON retourné

Résultat attendu:
  ✓ 6 presets testés
  ✓ Chaque preset contient:
    - name (string)
    - description (string)
    - metaTitleRange (format: "XX-YY")
    - imageWeightMax (number)

Validation par preset:
  SEO_STANDARD:
    - metaTitleRange: "50-65"
    - imageWeightMax: 500000

  SEO_STRICT:
    - metaTitleRange: "55-60"
    - imageWeightMax: 300000

  PERMISSIVE:
    - metaTitleRange: "30-70"
    - imageWeightMax: 1000000

  ECOMMERCE:
    - metaTitleRange: "50-60"
    - imageWeightMax: 400000

  BLOG:
    - metaTitleRange: "50-70"
    - imageWeightMax: 600000

  CORPORATE:
    - metaTitleRange: "50-65"
    - imageWeightMax: 450000

Critères de validation:
  - Les 6 presets sont présents
  - Valeurs cohérentes (min < max)
  - Aucune valeur null/undefined
```

#### Test 1.3 : Configuration Personnalisée
```yaml
ID: CM-003
Nom: Création et export config personnalisée
Priorité: MOYENNE
Durée: 2 min

Steps:
  1. Cliquer sur "Config personnalisée"
  2. Vérifier les sections "Configuration sauvegardée" et "Export"

Résultat attendu:
  ✓ Configuration sauvegardée:
    - name: "Test Config"
    - description: "Configuration de test personnalisée"
    - createdAt: date ISO
    - data: objet avec modifications (meta.title.max=80, images.weight.hero.max=700000)

  ✓ Export:
    - version: "5.0.0"
    - exportDate: date ISO
    - preset: "SEO_STANDARD"
    - profile: "FULL"
    - config: objet complet

Critères de validation:
  - Les modifications sont bien appliquées (80 et 700000)
  - Le JSON est valide
  - Possibilité de copier le JSON
```

---

### Module 2️⃣ : MetaAnalyzerEndpoint

#### Test 2.1 : Analyse Normale
```yaml
ID: MA-001
Nom: Analyse meta tags valides
Priorité: CRITIQUE
Durée: 1 min

Steps:
  1. Cliquer sur "Analyser Meta Tags"
  2. Observer le score et les détails

Données de test:
  - Title: "Test de titre pour SEO - Ma marque" (40 caractères)
  - Description: "Ceci est une description..." (148 caractères)

Résultat attendu:
  ✓ Score global: entre 3.5 et 5
  ✓ Titre:
    - length: 40
    - score: 2-4 (trop court pour optimal)
    - level: "warning" ou "good"
    - message contient "caractères"

  ✓ Description:
    - length: 148
    - score: 4-5
    - level: "good" ou "excellent"
    - analysis.hasCallToAction: true (détecte "Découvrez" et "contactez")

Critères de validation:
  - Cartes KPI affichent les bonnes valeurs
  - Score cohérent avec longueurs
  - JSON complet présent
```

#### Test 2.2 : Cas Problématique
```yaml
ID: MA-002
Nom: Détection erreurs meta tags
Priorité: CRITIQUE
Durée: 1 min

Steps:
  1. Cliquer sur "Tester cas problématique"
  2. Vérifier issues et recommendations

Données de test:
  - Title: "Test" (4 caractères - TROP COURT)
  - Description: "Trop court" (10 caractères - TROP COURT)
  - Preset: SEO_STRICT (limites strictes)

Résultat attendu:
  ✓ Score global: < 2
  ✓ Issues détectées:
    - Au moins 2 issues
    - Type: "missing" ou "length"
    - Severity: "error" ou "warning"

  ✓ Recommendations:
    - Au moins 2 recommandations
    - Type: "title" et "description"
    - Priority: "high"
    - Messages avec suggestions d'amélioration

Critères de validation:
  - Score reflète bien les problèmes
  - Messages clairs et actionnables
  - Calcul correct des manques (55-4=51 caractères manquants pour titre)
```

---

### Module 3️⃣ : ImageAnalyzerEndpoint

#### Test 3.1 : Analyse Images Mixtes
```yaml
ID: IA-001
Nom: Analyse de 3 images (hero, thumbnail, oversized)
Priorité: CRITIQUE
Durée: 1 min

Steps:
  1. Cliquer sur "Analyser Images"
  2. Vérifier summary et scores individuels

Données de test:
  - Image 1: Hero, 250KB, alt présent, pas de distorsion
  - Image 2: Thumbnail, 80KB, alt manquant
  - Image 3: Standard, 800KB (TROP LOURD), alt présent

Résultat attendu:
  ✓ Summary:
    - totalImages: 3
    - withAlt: 2
    - withoutAlt: 1
    - oversized: 1 (Image 3)
    - optimized: 1-2

  ✓ Score global: 3-4 (pénalisé par img 3)

  ✓ Analyses individuelles:
    Image 1: score ~5 (excellente)
    Image 2: score 2-3 (alt manquant)
    Image 3: score 1-2 (trop lourde)

Critères de validation:
  - Cartes KPI correctes
  - Issues détectées pour alt manquant et poids excessif
  - Recommendations présentes
```

#### Test 3.2 : Rapport d'Optimisation
```yaml
ID: IA-002
Nom: Génération rapport optimisation
Priorité: MOYENNE
Durée: 1 min

Steps:
  1. Cliquer sur "Rapport d'optimisation"
  2. Analyser les économies potentielles

Résultat attendu:
  ✓ Rapport contient:
    - totalImages: 3
    - optimizedImages: nombre d'images OK
    - needsOptimization: nombre d'images à optimiser
    - potentialSavings: string avec unité (ex: "450 KB")
    - recommendations: array
    - priority: "high", "medium" ou "low"

Critères de validation:
  - Calcul d'économies correct
  - Priorité adaptée au total d'économies
  - Recommendations actionnables
```

---

### Module 4️⃣ : HeadingAnalyzerEndpoint

#### Test 4.1 : Hiérarchie Valide
```yaml
ID: HA-001
Nom: Validation structure H1-H6 correcte
Priorité: CRITIQUE
Durée: 1 min

Steps:
  1. Cliquer sur "Analyser Headings"
  2. Vérifier hierarchy.valid = true

Données de test:
  - 1x H1: "Titre principal de la page - Exemple"
  - 2x H2: "Première section" et "Deuxième section"
  - 2x H3: sous-sections

Résultat attendu:
  ✓ totalHeadings: 5
  ✓ byLevel:
    - h1: array[1]
    - h2: array[2]
    - h3: array[2]

  ✓ hierarchy:
    - valid: true
    - errors: [] (vide)
    - warnings: [] (vide)
    - score: 5

  ✓ globalScore: 4-5

Critères de validation:
  - Outline généré correctement (structure arborescente)
  - Scores individuels par heading corrects
  - Aucune erreur de hiérarchie
```

#### Test 4.2 : Hiérarchie Invalide
```yaml
ID: HA-002
Nom: Détection erreurs hiérarchie
Priorité: CRITIQUE
Durée: 1 min

Steps:
  1. Cliquer sur "Tester hiérarchie invalide"
  2. Vérifier détection des erreurs

Données de test:
  - 2x H1 (ERREUR: 1 seul H1 recommandé)
  - 1x H4 direct (ERREUR: saut de niveau)

Résultat attendu:
  ✓ hierarchy.valid: false
  ✓ hierarchy.errors:
    - Au moins 2 erreurs
    - Messages clairs:
      * "2 H1 trouvés (1 maximum recommandé)"
      * "Saut de niveau détecté: h4"

  ✓ globalScore: < 3
  ✓ recommendations contient solutions

Critères de validation:
  - Détection correcte des 2 H1
  - Détection du saut de niveau
  - Messages explicites et actionnables
```

---

### Module 5️⃣ : ScoringEngine

#### Test 5.1 : Calcul Score Global
```yaml
ID: SE-001
Nom: Agrégation scores de catégories
Priorité: CRITIQUE
Durée: 1 min

Steps:
  1. Cliquer sur "Calculer Score Global"
  2. Vérifier calcul et pondération

Données de test:
  - meta: 4.2
  - images: 3.8
  - headings: 4.5

Résultat attendu:
  ✓ globalScore: ~4.17 (moyenne)
  ✓ level: "Bon" ou "Excellent"
  ✓ categoryScores: array[3]
  ✓ summary:
    - strengths: array (headings excellent)
    - weaknesses: array (images si < 4)
    - recommendations: array
    - message: string descriptif

Critères de validation:
  - Calcul mathématiquement correct
  - Pondération appliquée (selon config)
  - Messages adaptés au score
```

#### Test 5.2 : Métriques Unitaires
```yaml
ID: SE-002
Nom: Test métriques individuelles
Priorité: MOYENNE
Durée: 1 min

Steps:
  1. Cliquer sur "Tester métriques"
  2. Vérifier chaque type de métrique

Tests inclus:
  - Meta title 58 caractères (GOOD - dans la plage)
  - Meta title 25 caractères (BAD - trop court)
  - Image avec alt (GOOD)
  - Image sans alt (BAD)

Résultat attendu:
  ✓ metaTitleGood:
    - score: 4-5
    - level: "good" ou "excellent"

  ✓ metaTitleBad:
    - score: 0-2
    - level: "error" ou "warning"

  ✓ imageWithAlt:
    - score: 5
    - level: "excellent"

  ✓ imageNoAlt:
    - score: 0
    - level: "error"

Critères de validation:
  - Scoring cohérent avec les seuils
  - Niveaux corrects
  - Messages explicites
```

---

### Module 6️⃣ : AnalysisOrchestrator

#### Test 6.1 : Analyse Complète
```yaml
ID: AO-001
Nom: Orchestration de tous les endpoints
Priorité: CRITIQUE
Durée: 2 min

Steps:
  1. Cliquer sur "Analyse Complète"
  2. Vérifier que tous les endpoints sont appelés

Données de test:
  - URL complète avec meta, images, headings

Résultat attendu:
  ✓ success: true
  ✓ globalScore: 3-5
  ✓ level: string ("Bon", "Excellent", etc.)
  ✓ analyses:
    - meta: { success: true, data: {...} }
    - images: { success: true, data: {...} }
    - headings: { success: true, data: {...} }

  ✓ categoryScores: array avec scores par catégorie
  ✓ summary: objet avec strengths, weaknesses, recommendations
  ✓ duration: < 200ms
  ✓ timestamp: date ISO
  ✓ config: { preset, profile }

Critères de validation:
  - Tous les endpoints exécutés
  - Score global cohérent
  - Durée raisonnable (< 200ms)
  - Pas d'erreur dans analyses
```

#### Test 6.2 : Analyse Batch
```yaml
ID: AO-002
Nom: Analyse de multiples pages
Priorité: HAUTE
Durée: 2 min

Steps:
  1. Cliquer sur "Analyse Batch"
  2. Vérifier traitement de 3 pages

Résultat attendu:
  ✓ success: true
  ✓ total: 3
  ✓ successful: 3
  ✓ failed: 0
  ✓ results: array[3] avec analyses complètes
  ✓ summary:
    - avgScore: moyenne des 3 pages
    - successful: 3
    - categoryAverages: objet
    - bestPage: page avec meilleur score
    - worstPage: page avec plus bas score

Critères de validation:
  - Les 3 pages analysées
  - Batch processing fonctionnel
  - Calcul de moyenne correct
  - Identification best/worst correcte
```

#### Test 6.3 : Export de Données
```yaml
ID: AO-003
Nom: Export JSON et CSV
Priorité: MOYENNE
Durée: 1 min

Steps:
  1. Cliquer sur "Test Export"
  2. Vérifier formats JSON et CSV

Résultat attendu:
  ✓ Export JSON:
    - Longueur > 0 caractères
    - Format JSON valide
    - Contient toutes les données

  ✓ Export CSV:
    - Headers: URL,Date,Score Global,Meta,Images,Headings...
    - Au moins 2 lignes (header + data)
    - Valeurs séparées par virgules

Critères de validation:
  - JSON parsable
  - CSV bien formaté
  - Pas de données manquantes
```

---

## ✅ Checklist de Validation Globale

### Avant les tests

- [ ] Tous les fichiers JS présents dans `/api`
- [ ] Serveur HTTP lancé (ou fichier ouvert)
- [ ] Console navigateur ouverte (F12)
- [ ] Navigateur moderne (Chrome/Firefox/Safari)

### Tests Critiques (MUST PASS)

- [ ] CM-001 : ConfigurationManager s'initialise
- [ ] CM-002 : Les 6 presets fonctionnent
- [ ] MA-001 : MetaAnalyzer analyse correctement
- [ ] MA-002 : Détection d'erreurs meta
- [ ] IA-001 : ImageAnalyzer analyse correctement
- [ ] HA-001 : HeadingAnalyzer valide hiérarchie
- [ ] HA-002 : Détection erreurs hiérarchie
- [ ] SE-001 : Calcul score global correct
- [ ] AO-001 : Orchestrateur analyse complète
- [ ] AO-002 : Batch analysis fonctionne

### Tests Importants (SHOULD PASS)

- [ ] CM-003 : Config personnalisée
- [ ] IA-002 : Rapport optimisation
- [ ] SE-002 : Métriques unitaires
- [ ] AO-003 : Export JSON/CSV

### Validation Console

- [ ] Aucune erreur rouge dans console
- [ ] Aucun warning critique
- [ ] Chargement de tous les scripts (6+ scripts)
- [ ] Pas d'erreur CORS

### Validation Visuelle

- [ ] Tous les status dots deviennent verts
- [ ] Scores affichés correctement (grands chiffres)
- [ ] Cartes KPI avec valeurs
- [ ] JSON formaté et lisible
- [ ] Messages d'alerte colorés (vert/rouge/bleu)

---

## 🎯 Critères d'Acceptation

### Critères de Succès

Pour que le test soit **VALIDÉ**, il faut :

1. **100% des tests CRITIQUES** passent (10/10)
2. **80% des tests IMPORTANTS** passent (3/4 minimum)
3. **Aucune erreur console bloquante**
4. **Performance acceptable** (< 200ms par analyse)

### Critères de Rejet

Le test est **REJETÉ** si :

- ❌ Un endpoint ne fonctionne pas du tout
- ❌ Erreur JavaScript bloquante
- ❌ Score global incohérent (NaN, Infinity, négatif)
- ❌ Export impossible
- ❌ Plus de 2 tests CRITIQUES échouent

---

## 📝 Rapport de Test

### Template de Rapport

```markdown
# Rapport de Test v5.0
Date: [DATE]
Testeur: [NOM]
Navigateur: [Chrome/Firefox/Safari + VERSION]
Durée: [XX minutes]

## Résumé Exécutif
- Tests exécutés: X/18
- Tests réussis: X
- Tests échoués: X
- Taux de réussite: X%

## Résultats par Module

### ConfigurationManager
- [✓/✗] CM-001: Initialisation
- [✓/✗] CM-002: Presets
- [✓/✗] CM-003: Config personnalisée

### MetaAnalyzerEndpoint
- [✓/✗] MA-001: Analyse normale
- [✓/✗] MA-002: Cas problématique

### ImageAnalyzerEndpoint
- [✓/✗] IA-001: Analyse images
- [✓/✗] IA-002: Rapport optimisation

### HeadingAnalyzerEndpoint
- [✓/✗] HA-001: Hiérarchie valide
- [✓/✗] HA-002: Hiérarchie invalide

### ScoringEngine
- [✓/✗] SE-001: Score global
- [✓/✗] SE-002: Métriques

### AnalysisOrchestrator
- [✓/✗] AO-001: Analyse complète
- [✓/✗] AO-002: Batch analysis
- [✓/✗] AO-003: Export

## Problèmes Rencontrés
1. [Description du problème]
   - Sévérité: [CRITIQUE/HAUTE/MOYENNE/BASSE]
   - Module: [Nom]
   - Reproduction: [Steps]
   - Workaround: [Si applicable]

## Recommandations
- [Liste des recommandations]

## Conclusion
[VALIDÉ / REJETÉ / VALIDÉ AVEC RÉSERVES]

Raison: [Explication]
```

---

## 🔧 Troubleshooting

### Problème : "Cannot find ConfigurationManager"

**Cause** : Script non chargé

**Solution** :
```javascript
// Dans la console
console.log(typeof ConfigurationManager); // Devrait être "function"
```

Vérifier :
- Chemin correct : `api/config/ConfigurationManager.js`
- Pas d'erreur 404 dans Network tab
- Script chargé avant utilisation

---

### Problème : Scores NaN ou Infinity

**Cause** : Division par zéro ou données manquantes

**Solution** :
```javascript
// Vérifier les données d'entrée
console.log('PageData:', pageData);
console.log('Config:', config.getConfig('meta'));
```

Vérifier :
- Données d'entrée complètes
- Pas de valeurs null/undefined
- Arrays non vides pour calculs de moyenne

---

### Problème : "Promise rejection" ou erreurs async

**Cause** : Async/await mal géré

**Solution** :
```javascript
// Wrapper try/catch
try {
  const result = await endpoint.execute(data);
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error);
}
```

---

### Problème : Export ne fonctionne pas

**Cause** : Navigateur bloque le téléchargement

**Solution** :
- Autoriser les popups
- Vérifier les permissions de téléchargement
- Essayer un autre navigateur

---

### Problème : Tests lents (> 1s)

**Cause** : Trop de calculs ou données volumineuses

**Solution** :
```javascript
// Activer le profiler
console.time('Analysis');
await orchestrator.analyzePage(data);
console.timeEnd('Analysis');
```

Optimisations :
- Réduire le nombre d'images de test
- Désactiver le cache (option `bypassCache: true`)
- Vérifier les loops infinis

---

## 📊 Matrice de Tests Rapide

| ID | Module | Test | Priorité | Durée | Status |
|----|--------|------|----------|-------|--------|
| CM-001 | Config | Init | CRITIQUE | 1min | [ ] |
| CM-002 | Config | Presets | HAUTE | 2min | [ ] |
| CM-003 | Config | Custom | MOYENNE | 2min | [ ] |
| MA-001 | Meta | Normal | CRITIQUE | 1min | [ ] |
| MA-002 | Meta | Erreurs | CRITIQUE | 1min | [ ] |
| IA-001 | Image | Analyse | CRITIQUE | 1min | [ ] |
| IA-002 | Image | Rapport | MOYENNE | 1min | [ ] |
| HA-001 | Heading | Valide | CRITIQUE | 1min | [ ] |
| HA-002 | Heading | Invalide | CRITIQUE | 1min | [ ] |
| SE-001 | Scoring | Global | CRITIQUE | 1min | [ ] |
| SE-002 | Scoring | Métriques | MOYENNE | 1min | [ ] |
| AO-001 | Orchestr. | Complet | CRITIQUE | 2min | [ ] |
| AO-002 | Orchestr. | Batch | HAUTE | 2min | [ ] |
| AO-003 | Orchestr. | Export | MOYENNE | 1min | [ ] |

**Total Durée Estimée** : 18 minutes (tests critiques uniquement)

---

## 🚀 Quick Start

### Test Rapide (5 minutes)

```bash
# 1. Ouvrir la page
open globalCherckerWebSiteCQ/test-dashboard.html

# 2. Tester 1 bouton par section (6 clics)
- ConfigurationManager > "Tester ConfigurationManager"
- MetaAnalyzer > "Analyser Meta Tags"
- ImageAnalyzer > "Analyser Images"
- HeadingAnalyzer > "Analyser Headings"
- ScoringEngine > "Calculer Score Global"
- Orchestrator > "Analyse Complète"

# 3. Vérifier
- Tous les status dots VERTS ✓
- Scores affichés (0-5)
- Aucune erreur console
```

### Test Complet (45 minutes)

1. Suivre le plan de test module par module
2. Cocher la matrice de tests
3. Noter les problèmes
4. Remplir le rapport de test

---

**Version:** 1.0
**Dernière mise à jour:** Janvier 2026
**Auteur:** Équipe HCW
