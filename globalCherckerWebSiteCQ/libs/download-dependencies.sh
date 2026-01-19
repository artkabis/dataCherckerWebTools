#!/bin/bash

# Script de téléchargement des dépendances pour Manifest V3
# Usage: bash download-dependencies.sh

set -e  # Arrêter en cas d'erreur

echo "📥 Téléchargement des dépendances pour Chrome Extension Manifest V3..."
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "README.md" ]; then
  echo "❌ Erreur: Ce script doit être exécuté depuis le dossier libs/"
  echo "   cd globalCherckerWebSiteCQ/libs && bash download-dependencies.sh"
  exit 1
fi

echo "1️⃣ Téléchargement de Chart.js (obligatoire pour les graphiques)..."
curl -L -o chart.min.js https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
if [ $? -eq 0 ]; then
  SIZE=$(du -h chart.min.js | cut -f1)
  echo "   ✅ Chart.js téléchargé ($SIZE)"
else
  echo "   ❌ Échec du téléchargement de Chart.js"
fi
echo ""

echo "2️⃣ Téléchargement de Bootstrap CSS (recommandé pour le design)..."
curl -L -o bootstrap.min.css https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css
if [ $? -eq 0 ]; then
  SIZE=$(du -h bootstrap.min.css | cut -f1)
  echo "   ✅ Bootstrap CSS téléchargé ($SIZE)"
else
  echo "   ❌ Échec du téléchargement de Bootstrap"
fi
echo ""

echo "3️⃣ Téléchargement de Font Awesome CSS (optionnel pour les icônes)..."
curl -L -o font-awesome.min.css https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css
if [ $? -eq 0 ]; then
  SIZE=$(du -h font-awesome.min.css | cut -f1)
  echo "   ✅ Font Awesome CSS téléchargé ($SIZE)"
else
  echo "   ❌ Échec du téléchargement de Font Awesome"
fi
echo ""

echo "4️⃣ Téléchargement des webfonts Font Awesome..."
mkdir -p webfonts
cd webfonts

FONTS=(
  "fa-solid-900.woff2"
  "fa-regular-400.woff2"
  "fa-brands-400.woff2"
)

for font in "${FONTS[@]}"; do
  echo "   Téléchargement de $font..."
  curl -L -o "$font" "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/$font"
  if [ $? -eq 0 ]; then
    echo "   ✅ $font téléchargé"
  else
    echo "   ❌ Échec du téléchargement de $font"
  fi
done

cd ..
echo ""

echo "✨ Téléchargement terminé!"
echo ""
echo "📁 Fichiers téléchargés:"
ls -lh *.css *.js 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'
if [ -d "webfonts" ]; then
  echo "   webfonts/ ($(ls webfonts | wc -l) fichiers)"
fi
echo ""
echo "🚀 Vous pouvez maintenant recharger l'extension dans Chrome!"
echo "   chrome://extensions/ → Recharger"
