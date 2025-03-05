// Functions/metaAnalyzer.js
export const analyzeMetas = async (tab) => {
    if (!tab) return;

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: async function () {
            // Récupération des paramètres depuis les options stockées
            const getSettingsFromStorage = () => {
                return new Promise((resolve) => {
                    chrome.storage.sync.get('checkerToolsSettings', (result) => {
                        const settings = result.checkerToolsSettings || {};
                        resolve(settings);
                    });
                });
            };

            const settings = await getSettingsFromStorage();

            // Utiliser les valeurs des paramètres ou les valeurs par défaut
            const MIN_META_TITLE_CARACTERE = settings.MIN_META_TITLE_CARACTERE || 50;
            const MAX_META_TITLE_CARACTERE = settings.MAX_META_TITLE_CARACTERE || 65;
            const MIN_META_DESC_CARACTERE = settings.MIN_META_DESC_CARACTERE || 140;
            const MAX_META_DESC_CARACTERE = settings.MAX_META_DESC_CARACTERE || 156;

            // Récupération des balises meta
            const metaTitle = document.querySelector('title')?.innerText || document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
            const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

            // Analyse des balises meta
            const titleLength = metaTitle.length;
            const descLength = metaDesc.length;

            const titleValid = titleLength >= MIN_META_TITLE_CARACTERE && titleLength <= MAX_META_TITLE_CARACTERE;
            const descValid = descLength >= MIN_META_DESC_CARACTERE && descLength <= MAX_META_DESC_CARACTERE;

            // Préparation des données pour l'affichage
            const result = {
                title: {
                    content: metaTitle,
                    length: titleLength,
                    valid: titleValid,
                    min: MIN_META_TITLE_CARACTERE,
                    max: MAX_META_TITLE_CARACTERE,
                    status: titleLength === 0 ? 'missing' : (titleValid ? 'valid' : 'invalid')
                },
                description: {
                    content: metaDesc,
                    length: descLength,
                    valid: descValid,
                    min: MIN_META_DESC_CARACTERE,
                    max: MAX_META_DESC_CARACTERE,
                    status: descLength === 0 ? 'missing' : (descValid ? 'valid' : 'invalid')
                }
            };

            // Création d'une fenêtre modale pour afficher les résultats
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 45%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                z-index: 100000;
                width: 500px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                font-family: Arial, sans-serif;
            `;

            // Style pour le contenu de la fenêtre modale
            const modalStyle = `
                .meta-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                }
                .meta-title {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                }
                .meta-close {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 22px;
                color: #999;
                }
                .meta-section {
                margin-bottom: 20px;
                padding: 15px;
                border-radius: 6px;
                background: #f9f9f9;
                }
                .meta-section.valid {
                border-left: 4px solid #28a745;
                }
                .meta-section.invalid {
                border-left: 4px solid #dc3545;
                }
                .meta-section.missing {
                border-left: 4px solid #ffc107;
                }
                .meta-section-title {
                font-weight: bold;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                }
                .meta-content {
                background: white;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid #eee;
                margin-bottom: 8px;
                word-break: break-word;
                }
                .meta-info {
                display: flex;
                justify-content: space-between;
                color: #666;
                font-size: 14px;
                }
                .meta-status {
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
                color: white;
                }
                .meta-status.valid {
                background: #28a745;
                }
                .meta-status.invalid {
                background: #dc3545;
                }
                .meta-status.missing {
                background: #ffc107;
                color: #333;
                }
            `;

            // Construction du contenu HTML
            modal.innerHTML = `
                <style>${modalStyle}</style>
                <div class="meta-header">
                <div class="meta-title">Analyse des Meta Tags</div>
                <button class="meta-close">×</button>
                </div>
                
                <div class="meta-section ${result.title.status}">
                <div class="meta-section-title">
                    Title
                    <span class="meta-status ${result.title.status}">
                    ${result.title.status === 'valid' ? 'Valide' : (result.title.status === 'missing' ? 'Manquant' : 'Non valide')}
                    </span>
                </div>
                <div class="meta-content">${result.title.content || 'Non défini'}</div>
                <div class="meta-info">
                    <span>Longueur: ${result.title.length} caractères</span>
                    <span>Recommandation: ${result.title.min} - ${result.title.max} caractères</span>
                </div>
                </div>
                
                <div class="meta-section ${result.description.status}">
                <div class="meta-section-title">
                    Description
                    <span class="meta-status ${result.description.status}">
                    ${result.description.status === 'valid' ? 'Valide' : (result.description.status === 'missing' ? 'Manquante' : 'Non valide')}
                    </span>
                </div>
                <div class="meta-content">${result.description.content || 'Non définie'}</div>
                <div class="meta-info">
                    <span>Longueur: ${result.description.length} caractères</span>
                    <span>Recommandation: ${result.description.min} - ${result.description.max} caractères</span>
                </div>
                </div>
            `;

            // Ajout du modal au body
            document.body.appendChild(modal);

            // Gestion de la fermeture du modal
            const closeButton = modal.querySelector('.meta-close');
            closeButton.addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            // Fermeture du modal en cliquant en dehors
            document.addEventListener('mousedown', (e) => {
                if (!modal.contains(e.target)) {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                }
            });

            // Retourner les résultats pour le débogage
            return result;
        }
    });
};