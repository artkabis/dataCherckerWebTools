# ⚡ Test Ultra-Rapide - Offscreen API (60 secondes)

## Étapes

1. **Recharger extension**
   ```
   chrome://extensions/ → Recharger
   ```

2. **Ouvrir popup + console**
   ```
   - Clic icône extension
   - F12 → Service Worker → Console
   ```

3. **Configurer test**
   ```
   Onglet: "Analyse Multi-URL"
   Mode: "Liste d'URLs"
   URLs: https://example.com,https://example.org
   Méthode: 🚀 Offscreen
   ```

4. **Lancer**
   ```
   Clic "🚀 Analyser avec v5.0"
   ```

5. **Vérifier**
   ```
   ✅ Console affiche : "[Offscreen] Batch complete: 2 success"
   ✅ Aucun onglet ouvert
   ✅ Popup montre succès
   ```

## ✅ Si ça marche → Tout est OK !

Si erreur → Voir GUIDE_TEST_OFFSCREEN.md section 7 (Debugging)
