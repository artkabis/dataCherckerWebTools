# Dépendances Locales pour Manifest V3

## ⚠️ Important: Chrome Extension Manifest V3

En Manifest V3, **toutes les bibliothèques JavaScript et CSS doivent être hébergées localement** dans l'extension. Vous ne pouvez pas utiliser de CDN externes pour les `extension_pages`.

## 📥 Fichiers à Télécharger

Téléchargez les fichiers suivants et placez-les dans ce répertoire (`libs/`):

### 1. Chart.js (Obligatoire)
- **URL:** https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
- **Nom du fichier:** `chart.min.js`
- **Taille:** ~250 KB
- **Commande:**
  ```bash
  curl -o chart.min.js https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
  ```

### 2. Bootstrap CSS (Optionnel mais recommandé)
- **URL:** https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css
- **Nom du fichier:** `bootstrap.min.css`
- **Taille:** ~200 KB
- **Commande:**
  ```bash
  curl -o bootstrap.min.css https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css
  ```

### 3. Font Awesome CSS (Optionnel)
- **URL:** https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css
- **Nom du fichier:** `font-awesome.min.css`
- **Taille:** ~70 KB
- **Commande:**
  ```bash
  curl -o font-awesome.min.css https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css
  ```

### 4. Font Awesome Webfonts (Si vous utilisez Font Awesome)
Téléchargez également le dossier `webfonts` depuis:
- https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/

## 🔧 Script de Téléchargement Automatique

Utilisez ce script bash pour tout télécharger:

```bash
#!/bin/bash
cd globalCherckerWebSiteCQ/libs

# Chart.js
curl -o chart.min.js https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js

# Bootstrap CSS
curl -o bootstrap.min.css https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css

# Font Awesome CSS
curl -o font-awesome.min.css https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css

# Font Awesome Webfonts
mkdir -p webfonts
cd webfonts
curl -O https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2
curl -O https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2
curl -O https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2

echo "✅ Tous les fichiers ont été téléchargés!"
```

## 📋 Structure Finale

Après téléchargement, votre dossier `libs/` devrait ressembler à:

```
libs/
├── README.md (ce fichier)
├── chart.min.js
├── bootstrap.min.css
├── font-awesome.min.css
└── webfonts/
    ├── fa-solid-900.woff2
    ├── fa-regular-400.woff2
    └── fa-brands-400.woff2
```

## ❓ Pourquoi Cette Restriction?

Chrome Manifest V3 impose des règles de sécurité strictes:

- **Content Security Policy (CSP)** pour `extension_pages` ne peut PAS inclure de domaines externes dans `script-src`
- Cela empêche les attaques par injection de code malveillant depuis des CDN compromis
- Toutes les ressources doivent être auditables dans le package de l'extension

## 🔗 Documentation

- [Manifest V3 CSP](https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/)
- [Migrating from V2 to V3](https://developer.chrome.com/docs/extensions/migrating/)

## ⚡ Alternative Sans Dépendances

Si vous ne voulez pas gérer ces dépendances, vous pouvez:

1. **Simplifier le dashboard** pour utiliser uniquement du HTML/CSS vanilla
2. **Utiliser Canvas natif** au lieu de Chart.js
3. **Créer des graphiques CSS** simples

Exemple de graphique CSS simple:
```html
<div class="progress" style="height: 20px;">
  <div class="progress-bar" style="width: 75%; background: #28a745;">75%</div>
</div>
```
