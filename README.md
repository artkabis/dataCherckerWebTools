# 🔍 Global Website Checker

> Une extension Chrome/Edge complète pour l'audit et l'analyse de sites web (support Firefox en console uniquement)

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285f4?style=flat-square&logo=googlechrome)](https://chrome.google.com/webstore)
[![Edge Extension](https://img.shields.io/badge/Edge-Extension-0078d4?style=flat-square&logo=microsoftedge)](https://microsoftedge.microsoft.com/addons)
[![Firefox](https://img.shields.io/badge/Firefox-Console%20Only-ff9500?style=flat-square&logo=firefox)](https://firefox.com)

## ✨ Fonctionnalités principales

### 🏷️ Méta-données et SEO
- Validation des balises **title** et **meta description**
- Vérification de la structure des titres **Hn** (hiérarchie, longueur, mots-clés)
- Contrôle de la densité des balises `<strong>` et `<b>` (alerte si < 3 ou > 5)
- Analyse du plan de titres et détection des niveaux manquants

### 🖼️ Images et médias
- Vérification des attributs **alt** (tags `<img>` pour Duda et WordPress)
- Détection des **alt dupliqués** sur la page
- Analyse de la **taille des images** (Ko, Mo, Go) et des ratios
- Support multi-formats : `background-image`, `<img>`, base64, SVG
- Détection des **images dupliquées** (exclusion automatique des logos)
- **Téléchargeur WordPress** pour gestion de bibliothèque média

### 🔗 Liens et navigation
- Vérification du **statut des liens** (200, 404, 300, 403)
- **Analyse sémantique avancée** des liens avec détection d'accessibilité
- Contrôle des **ancres** et liens internes
- Validation des **numéros de téléphone**
- Détection des erreurs 404 en temps réel
- **Patterns français enrichis** (400+ variants pour 25+ secteurs TPE/PME)

## 🔗 Analyse sémantique des liens

### 🧠 Intelligence de cohérence
- **Correspondances exactes** : Détection directe entre texte de lien et destination
- **Variations linguistiques** : Reconnaissance des pluriels, dérivations ("peintre" → "/peinture")
- **Analyse contextuelle** : Compréhension des expressions ("Contactez-nous" → "/contact")
- **Secteurs spécialisés** : Support de 25+ domaines d'activité français (artisanat, commerce, professions libérales)

### 🎯 Détection des problèmes
- **Liens d'accessibilité** : Identification des liens sans texte descriptif
- **CTA génériques** : Détection des boutons vagues ("En savoir plus", "Cliquez ici")
- **Images sans ALT** : Contrôle des images-liens non décrites
- **Incohérences majeures** : Texte complètement déconnecté de la destination

### 📊 Interface et reporting
- **Score global** avec indicateur visuel circulaire
- **Badges colorés** : Classification par type (exact, sémantique, linguistique, contextuel)
- **Filtres intelligents** : Vue par statut (cohérents, incohérents, nouveaux)
- **Export CSV** avec rapport détaillé pour audit client

### 🎯 Web Vitals et PageSpeed
- **PageSpeed Insights** intégré
- Métriques Web Vitals : **FCP**, **LCP**, **TTI**
- Score de performance détaillé
- Détection automatique de la stack technique
- **Interface drag & drop** avec redimensionnement temps réel

### 🌐 Audit multi-pages
- Scan complet via **sitemap.xml** avec analyseur avancé
- Analyse par liste d'URLs (séparées par virgules)
- Traitement en lot pour les gros sites
- **Orchestrateur d'analyses** pour coordination multi-outils

## 🛠️ Outils avancés

### 🎨 Accessibilité et contraste
- **Analyse de contraste WCAG** (AA/AAA) automatique pour tous les éléments textuels
- **Calcul de luminosité** avec coefficients officiels (0.2126R, 0.7152G, 0.0722B)
- **Gestion multi-formats** : HEX, RGB, RGBA avec transparence
- **Détection intelligente** de taille de texte (normal vs large ≥24px)
- **Score d'accessibilité** détaillé avec recommandations

### 🔍 Analyse technique
- Détection d'utilisateur connecté
- Validation du **sitemap** (Duda/WordPress)  
- Vérification des **schema markup**
- Contrôle de la navigation interne/externe
- **Base de données IndexedDB** pour persistance des données

### 📝 Contenu et accessibilité
- Correcteur orthographique intégré
- **Analyse lexicale avancée** et comptage de mots
- **Validation Hn renforcée** avec structure hiérarchique
- Data binding Duda
- Toggle CORS pour requêtes cross-domain
- **Mode design** pour édition en temps réel

### 🔧 Outils spécifiques
- **Soprod** : Extraction d'expressions et localités
- **WordPress Media Uploader** : Gestion de bibliothèque média
- **Options DTU personnalisées** : Limites configurables (méta, Hn, images, etc.)

## 📦 Installation

### Prérequis
- Chrome 88+ ou Edge 88+
- Permissions : `activeTab`, `storage`, `tabs`

### Étapes d'installation

1. **Téléchargement**
   ```bash
   # Télécharger le fichier globalCheckerWebsite.zip
   # Extraire dans un dossier permanent
   ```

2. **Configuration Chrome/Edge**
   
   **Étape 1 :** Ouvrir `chrome://extensions/`
   ![Extensions](https://github.com/artkabis/toolsWP/blob/main/Solocal%20tools%2C%20tips%20%26%20fix/tools-cq-checker/Chrome-extension/globalCheckerWebsite/medias/open-extensions.JPG)
   
   **Étape 2 :** Activer le **Mode développeur**
   ![Mode dev](https://github.com/artkabis/toolsWP/blob/main/Solocal%20tools%2C%20tips%20%26%20fix/tools-cq-checker/Chrome-extension/globalCheckerWebsite/medias/mode-dev.JPG)
   
   **Étape 3 :** Charger l'**extension non empaquetée**
   ![Chargement](https://github.com/artkabis/toolsWP/blob/main/Solocal%20tools%2C%20tips%20%26%20fix/tools-cq-checker/Chrome-extension/globalCheckerWebsite/medias/extension-empaquetee.JPG)
   
   **Étape 4 :** Sélectionner le **dossier extrait**
   ![Sélection](https://github.com/artkabis/toolsWP/blob/main/Solocal%20tools%2C%20tips%20%26%20fix/tools-cq-checker/Chrome-extension/globalCheckerWebsite/medias/selection-dossier-extension.JPG)

3. **Activation**
   - ✅ Activer l'extension
   - 📌 Épingler à la barre d'outils pour un accès rapide

## 🚀 Utilisation rapide

```javascript
// Interface en un clic depuis n'importe quelle page web
// Rapport détaillé avec export JSON/CSV
// Suggestions d'amélioration automatiques
```

### Raccourcis clavier
- `Ctrl + Shift + G` : Ouvrir le checker
- `Ctrl + Shift + R` : Relancer l'analyse
- `Ctrl + Shift + E` : Exporter le rapport

## 📊 Types de rapports

**Visuel** - Interface interactive avec highlights (Audit en temps réel)
**JSON** - Données structurées complètes (Intégration API)  
**CSV** - Export avec métriques temps réel (Reporting client)
**PDF** - Rapport professionnel formaté (Présentation stakeholders)

### 🔄 Intégrations
- **Interface graphique** avec drag & drop
- **Scripts d'audit automatisés** pour CI/CD
- **API programmatique** complète avec options de configuration
- **Métriques temps réel** et tableaux de bord

## 🤝 Contribution

Contributions bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

## 📄 Licence

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

---

*Développé avec ❤️ pour la communauté web*
