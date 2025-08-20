export const CheckRatioImages = async (tab) => {
    if (!tab) return;

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: async function () {
            // Configuration - marge de tolérance en pourcentage (ajustable)
            const TOLERANCE = 3; // 3% de marge par défaut

            // Ratios standards officiels
            const STANDARD_RATIOS = [
                { ratio: 1 / 1, name: '1:1', desc: 'Carré' },
                { ratio: 4 / 5, name: '4:5', desc: 'Instagram Portrait' },
                { ratio: 3 / 4, name: '3:4', desc: 'Portrait Standard' },
                { ratio: 2 / 3, name: '2:3', desc: 'Portrait Photo' },
                { ratio: 9 / 16, name: '9:16', desc: 'Vertical Mobile' },
                { ratio: 3 / 2, name: '3:2', desc: 'Photo Standard' },
                { ratio: 4 / 3, name: '4:3', desc: 'Écran Standard' },
                { ratio: 5 / 4, name: '5:4', desc: 'Format Moyen' },
                { ratio: 16 / 10, name: '16:10', desc: 'Écran Large' },
                { ratio: 5 / 3, name: '5:3', desc: 'Format Européen' },
                { ratio: 16 / 9, name: '16:9', desc: 'Widescreen HD' },
                { ratio: 1.85 / 1, name: '1.85:1', desc: 'Cinéma Standard' },
                { ratio: 2 / 1, name: '2:1', desc: 'Format Large' },
                { ratio: 21 / 9, name: '21:9', desc: 'Ultra-wide' },
                { ratio: 2.35 / 1, name: '2.35:1', desc: 'CinemaScope' },
                { ratio: 32 / 9, name: '32:9', desc: 'Super Ultra-wide' }
            ];

            // Fonction pour calculer le plus grand commun diviseur (GCD)
            function gcd(a, b) {
                return b === 0 ? a : gcd(b, a % b);
            }

            // Fonction pour simplifier le ratio
            function simplifyRatio(width, height) {
                const diviseur = gcd(width, height);
                return `${width / diviseur}:${height / diviseur}`;
            }

            // Fonction pour trouver le ratio standard le plus proche
            function findClosestStandardRatio(width, height) {
                const currentRatio = width / height;
                let closest = null;
                let minDifference = Infinity;

                STANDARD_RATIOS.forEach(standard => {
                    const difference = Math.abs(currentRatio - standard.ratio);
                    const percentDifference = (difference / standard.ratio) * 100;

                    if (difference < minDifference) {
                        minDifference = difference;
                        closest = {
                            ...standard,
                            difference: percentDifference
                        };
                    }
                });

                // Retourner le ratio standard si dans la tolérance
                if (closest && closest.difference <= TOLERANCE) {
                    return closest;
                }

                return null;
            }

            // Fonction pour créer l'overlay d'information injecté dans le parent
            function createInfoOverlay(img, info) {
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: absolute;
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.9));
                    color: white;
                    padding: 10px;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    font-size: 12px;
                    border-radius: 6px;
                    z-index: 10000;
                    pointer-events: none;
                    white-space: nowrap;
                    line-height: 1.4;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    top: 5px;
                    left: 5px;
                `;
                overlay.innerHTML = info;

                // Trouver le conteneur approprié (parent ou grand-parent)
                let container = img.parentElement;

                // Vérifier si le parent a une position relative/absolue, sinon remonter
                const computedStyle = window.getComputedStyle(container);
                if (computedStyle.position === 'static') {
                    // Si le parent est en position static, on essaie le grand-parent
                    if (container.parentElement && window.getComputedStyle(container.parentElement).position !== 'static') {
                        container = container.parentElement;
                    } else {
                        // Sinon on force la position relative sur le parent direct
                        container.style.position = 'relative';
                    }
                }

                // Ajouter l'overlay au conteneur approprié
                container.appendChild(overlay);

                // Ajuster la position selon l'espace disponible dans le conteneur
                const containerRect = container.getBoundingClientRect();
                const imgRect = img.getBoundingClientRect();

                // Position relative à l'image dans son conteneur
                const relativeLeft = imgRect.left - containerRect.left;
                const relativeTop = imgRect.top - containerRect.top;

                // Vérifier si on peut placer l'overlay en haut à gauche de l'image
                let finalLeft = relativeLeft + 5;
                let finalTop = relativeTop + 5;

                // Si l'overlay dépasse à droite du conteneur, le placer à droite de l'image
                if ((relativeLeft + 250) > containerRect.width) {
                    finalLeft = relativeLeft + imgRect.width - 250 - 5;
                }

                // Si l'overlay dépasse en bas du conteneur, le placer en bas de l'image
                if ((relativeTop + 120) > containerRect.height) {
                    finalTop = relativeTop + imgRect.height - 120 - 5;
                }

                // S'assurer qu'on reste dans les limites du conteneur
                finalLeft = Math.max(5, Math.min(finalLeft, containerRect.width - 250));
                finalTop = Math.max(5, Math.min(finalTop, containerRect.height - 120));

                overlay.style.left = finalLeft + 'px';
                overlay.style.top = finalTop + 'px';

                return overlay;
            }

            // Supprimer les overlays existants
            const existingOverlays = document.querySelectorAll('[data-ratio-overlay]');
            existingOverlays.forEach(overlay => overlay.remove());

            // Analyser toutes les images
            const images = document.querySelectorAll('img');
            let processedCount = 0;
            let totalImages = images.length;
            let standardMatches = 0;

            if (totalImages === 0) {
                alert('Aucune image trouvée sur cette page.');
                return;
            }

            images.forEach((img, index) => {
                // Vérifier si l'image est chargée
                function analyzeImage() {
                    const width = img.naturalWidth;
                    const height = img.naturalHeight;

                    if (width > 0 && height > 0) {
                        const ratio = simplifyRatio(width, height);
                        const standardRatio = findClosestStandardRatio(width, height);

                        let info = `
                            <div style="font-weight: bold; color: #4CAF50;">📷 Image ${index + 1}</div>
                            <div style="margin: 2px 0;">📐 <strong>${width} × ${height}px</strong></div>
                            <div style="margin: 2px 0;">📊 Ratio exact: <strong>${ratio}</strong></div>
                        `;

                        if (standardRatio) {
                            standardMatches++;
                            info += `
                                <div style="margin: 2px 0; color: #FFD700;">
                                    ⭐ <strong>${standardRatio.name}</strong> (${standardRatio.desc})
                                </div>
                                <div style="margin: 2px 0; font-size: 11px; color: #90EE90;">
                                    📏 Écart: ${standardRatio.difference.toFixed(1)}%
                                </div>
                            `;
                            // Bordure dorée pour les ratios standards
                            img.style.outline = '3px solid #FFD700';
                        } else {
                            // Bordure rouge pour les ratios non-standards
                            img.style.outline = '2px solid #ff6b6b';
                        }

                        info += `<div style="margin: 2px 0; font-size: 11px; color: #ccc;">Affiché: ${img.width} × ${img.height}px</div>`;

                        const overlay = createInfoOverlay(img, info);
                        overlay.setAttribute('data-ratio-overlay', 'true');
                        img.style.outlineOffset = '2px';
                    }

                    processedCount++;
                    if (processedCount === totalImages) {
                        createSummaryPanel();
                    }
                }

                if (img.complete && img.naturalWidth > 0) {
                    analyzeImage();
                } else {
                    img.onload = analyzeImage;
                    img.onerror = () => {
                        processedCount++;
                        if (processedCount === totalImages) {
                            createSummaryPanel();
                        }
                    };
                }
            });

            // Créer un panneau de résumé
            function createSummaryPanel() {
                const summary = document.createElement('div');
                summary.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(30, 30, 30, 0.95));
                    color: white;
                    padding: 20px;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    border-radius: 10px;
                    z-index: 10001;
                    max-width: 320px;
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                `;

                const percentageStandard = ((standardMatches / totalImages) * 100).toFixed(0);

                summary.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 15px; font-size: 16px;">
                        📊 Analyse des Ratios
                    </div>
                    <div style="margin: 8px 0;">
                        📷 Images analysées: <strong>${totalImages}</strong>
                    </div>
                    <div style="margin: 8px 0; color: #FFD700;">
                        ⭐ Ratios standards: <strong>${standardMatches}</strong> (${percentageStandard}%)
                    </div>
                    <div style="margin: 8px 0; color: #ff6b6b;">
                        🔴 Ratios personnalisés: <strong>${totalImages - standardMatches}</strong>
                    </div>
                    <div style="margin: 15px 0 10px 0; font-size: 12px; color: #90EE90;">
                        📏 Tolérance: ±${TOLERANCE}%
                    </div>
                    <div style="margin-top: 15px; font-size: 12px; color: #ccc; cursor: pointer; text-align: center; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                        👆 Cliquez pour fermer
                    </div>
                `;

                summary.addEventListener('click', () => {
                    // Supprimer tous les overlays et le panneau
                    const allOverlays = document.querySelectorAll('[data-ratio-overlay]');
                    allOverlays.forEach(overlay => overlay.remove());
                    summary.remove();

                    // Supprimer les bordures des images
                    images.forEach(img => {
                        img.style.outline = '';
                        img.style.outlineOffset = '';
                    });
                });

                summary.setAttribute('data-ratio-overlay', 'true');
                document.body.appendChild(summary);

                // Plus de fermeture automatique - seulement manuelle via le bouton
            }
        }
    });
}