// results.js

function showLoadingIndicator() {
    const container = document.getElementById('globalStatsContent');
    if (container) {
        container.innerHTML = '<div class="loading-indicator">Chargement des résultats...</div>';
    }
}

function hideLoadingIndicator() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// Gestionnaire d'onglets
function setupTabsManagement() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Retirer la classe active de tous les boutons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');

            // Masquer tous les contenus
            const allContents = document.querySelectorAll('.tab-content');
            allContents.forEach(content => content.classList.remove('active'));

            // Afficher le contenu correspondant
            const targetId = this.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}
function displayOverview(analysis) {
    try {
        if (!analysis || !analysis.results) {
            throw new Error('Données d\'analyse invalides');
        }

        const stats = calculateGlobalStats(analysis.results);

        // Mise à jour des summary cards
        const summaryPanel = document.querySelector('.summary-panel');
        if (summaryPanel) {
            summaryPanel.innerHTML = `
                <div class="summary-card">
                    <h3>Score Global</h3>
                    <div class="statistic-value ${getScoreClass(stats.overallScore)}">
                        ${stats.overallScore}/5
                    </div>
                    <p>Score moyen sur l'ensemble des pages</p>
                </div>

                <div class="summary-card">
                    <h3>Pages Analysées</h3>
                    <div class="statistic-value">
                        ${stats.totalPages}
                    </div>
                    <p>${stats.successfulScans} pages analysées avec succès</p>
                </div>

                <div class="summary-card">
                    <h3>Points d'attention</h3>
                    <div class="statistic-value ${getIssuesClass(stats.totalIssues)}">
                        ${stats.totalIssues}
                    </div>
                    <p>Problèmes détectés nécessitant une action</p>
                </div>
            `;
        }

        // Affichage des statistiques détaillées dans l'onglet Vue d'ensemble
        const globalStatsContent = document.getElementById('globalStatsContent');
        if (globalStatsContent) {
            globalStatsContent.innerHTML = `
                <div class="statistics-grid">
                    <div class="statistic-item">
                        <h4>Meta-données</h4>
                        <div class="statistic-value ${getScoreClass(stats.metaStats.averageScore)}">
                            ${safeNumber(stats.metaStats.averageScore)}/5
                        </div>
                        <p>Issues: ${stats.metaStats.issuesCount}</p>
                    </div>

                    <div class="statistic-item">
                        <h4>Liens</h4>
                        <div class="statistic-value ${getScoreClass(stats.linkStats.averageScore)}">
                            ${safeNumber(stats.linkStats.averageScore)}/5
                        </div>
                        <p>Cassés: ${stats.linkStats.brokenLinks}</p>
                    </div>

                    <div class="statistic-item">
                        <h4>Images</h4>
                        <div class="statistic-value ${getScoreClass(stats.imageStats.averageScore)}">
                            ${safeNumber(stats.imageStats.averageScore)}/5
                        </div>
                        <p>Sans alt: ${stats.imageStats.missingAlt}</p>
                    </div>

                    <div class="statistic-item">
                        <h4>Structure Hn</h4>
                        <div class="statistic-value ${getScoreClass(stats.hnStats.averageScore)}">
                            ${safeNumber(stats.hnStats.averageScore)}/5
                        </div>
                        <p>Sans H1: ${stats.hnStats.missingH1}</p>
                    </div>

                    <div class="statistic-item">
                        <h4>Textes en gras</h4>
                        <div class="statistic-value ${getScoreClass(stats.boldStats.averageScore)}">
                            ${safeNumber(stats.boldStats.averageScore)}/5
                        </div>
                        <p>Issues: ${stats.boldStats.issuesCount}</p>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error('Erreur dans displayOverview:', error);
        showError("Erreur lors de l'affichage de la vue d'ensemble: " + error.message);
    }
}

// Fonction utilitaire pour déterminer la classe CSS selon le nombre de problèmes
function getIssuesClass(issuesCount) {
    if (issuesCount === 0) return 'score-good';
    if (issuesCount < 5) return 'score-warning';
    return 'score-error';
}
// Fonction pour afficher les points d'attention
function displayIssues(analysis) {
    const container = document.getElementById('issuesContent');
    if (!container || !analysis || !analysis.results) return;

    let issues = [];
    let totalIssuesCount = 0;

    Object.entries(analysis.results).forEach(([url, data]) => {
        // Problèmes de liens
        if (data.link_check?.link) {
            const brokenLinks = data.link_check.link.filter(link => link.link_status !== 200);
            totalIssuesCount += brokenLinks.length;
            brokenLinks.forEach(link => {
                issues.push({
                    url,
                    type: 'Lien',
                    description: `Lien cassé : ${link.link_url}`,
                    score: link.link_score
                });
            });
        }

        // Problèmes d'images
        if (data.alt_img_check?.alt_img) {
            const missingAlts = data.alt_img_check.alt_img.filter(img => !img.alt_img_state);
            totalIssuesCount += missingAlts.length;
            missingAlts.forEach(img => {
                issues.push({
                    url,
                    type: 'Image',
                    description: `Alt manquant : ${img.alt_img_src}`,
                    score: img.alt_img_score
                });
            });
        }

        // Problèmes de structure Hn
        if (data.hn) {
            // Problèmes de longueur Hn
            if (data.hn.hn_reco?.hn) {
                const hnLengthIssues = data.hn.hn_reco.hn.filter(h => parseFloat(h.hn_score) < 3);
                totalIssuesCount += hnLengthIssues.length;
                hnLengthIssues.forEach(h => {
                    issues.push({
                        url,
                        type: 'Longueur Hn',
                        description: `${h.hn_type} : "${h.hn_txt}"`,
                        details: {
                            caracteres: h.hn_letters_count,
                            recommandation: data.hn.hn_reco.hn_preco,
                            mots: h.hn_words_count
                        },
                        score: h.hn_score
                    });
                });
            }

            // Problèmes de structure Hn
            if (data.hn.hn_outline?.hn) {
                const hnOutlineIssues = data.hn.hn_outline.hn.filter(h => !h.hn_validity);
                totalIssuesCount += hnOutlineIssues.length;
                hnOutlineIssues.forEach(h => {
                    issues.push({
                        url,
                        type: 'Structure Hn',
                        description: `${h.hn_type}`,
                        details: {
                            message: h.hn_validity_message,
                            probleme: 'Structure hiérarchique non valide'
                        },
                        score: h.hn_validity_score
                    });
                });
            }
        }

        // Problèmes de textes en gras
        if (data.bold_check?.bold_txt) {
            const boldIssues = data.bold_check.bold_txt.filter(bold => !bold.bold_txt_state);
            totalIssuesCount += boldIssues.length;
            boldIssues.forEach(bold => {
                issues.push({
                    url,
                    type: 'Texte en gras',
                    description: bold.bold_txt,
                    score: data.bold_check.global_score
                });
            });
        }
    });

    // Mettre à jour le compteur global
    const statsContainer = document.querySelector('.summary-card:nth-child(3) .statistic-value');
    if (statsContainer) {
        statsContainer.textContent = issues.length;
    }

    // Trier les problèmes par score
    issues.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));

    // Générer le HTML
    const issuesHTML = issues.length > 0 ? `
        <div class="issues-list">
            <p>Nombre total de problèmes : ${issues.length}</p>
            ${issues.map(issue => `
                <div class="issue-card ${getScoreClass(issue.score)}">
                    <h4>${issue.type} - Score: ${issue.score}/5</h4>
                    <p><strong>Page:</strong> ${issue.url}</p>
                    <p><strong>Description:</strong> ${issue.description}</p>
                    ${createIssueDetails(issue)}
                </div>
            `).join('')}
        </div>
    ` : '<p>Aucun problème majeur détecté.</p>';

    container.innerHTML = issuesHTML;
}
function createIssueDetails(issue) {
    switch (issue.type) {
        case 'Longueur Hn':
            return `
                <div class="issue-details">
                    <p><strong>Nombre de caractères:</strong> ${issue.details.caracteres}</p>
                    <p><strong>Nombre de mots:</strong> ${issue.details.mots}</p>
                    <p><strong>Recommandation:</strong> ${issue.details.recommandation}</p>
                </div>
            `;
        case 'Structure Hn':
            return `
                <div class="issue-details">
                    <p><strong>Message:</strong> ${issue.details.message}</p>
                    <p><strong>Type de problème:</strong> ${issue.details.probleme}</p>
                </div>
            `;
        // Ajouter d'autres cas selon les types d'issues
        default:
            return issue.details ? `
                <div class="issue-details">
                    <p>${JSON.stringify(issue.details)}</p>
                </div>
            ` : '';
    }
}

// 1. Définition de tous les styles d'abord
const additionalStyles = `
    .score-card {
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
        color: white;
    }

    .score-good {
        background-color: #28a745;
    }

    .score-warning {
        background-color: #ffc107;
        color: black;
    }

    .score-error {
        background-color: #dc3545;
    }

    .score-value {
        font-size: 24px;
        font-weight: bold;
        margin: 10px 0;
    }
    /* ... autres styles existants ... */

    .score - card {
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
        color: white;
    }

    .score - good {
        background - color: #28a745;
    }

    .score - warning {
        background - color: #ffc107;
        color: black;
    }

    .score - error {
        background - color: #dc3545;
    }

    .score - value {
    font - size: 24px;
    font - weight: bold;
    margin: 10px 0;
}

    .analysis - section {
    background: #f8f9fa;
    padding: 15px;
    margin: 10px 0;
    border - radius: 8px;
    border - left: 4px solid #007bff;
}

    .analysis - section h3 {
    margin: 0 0 10px 0;
    color: #007bff;
}

    .page - card {
    background: white;
    border - radius: 8px;
    padding: 20px;
    margin - bottom: 20px;
    box - shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

    .collapsible {
    background - color: #f8f9fa;
    cursor: pointer;
    padding: 18px;
    width: 100 %;
    border: none;
    text - align: left;
    outline: none;
    font - size: 15px;
    border - radius: 4px;
    margin: 5px 0;
}

    .active, .collapsible:hover {
    background - color: #e9ecef;
}

    .content {
    padding: 0 18px;
    display: none;
    overflow: hidden;
    background - color: #fafafa;
    border - radius: 4px;
}

    table {
    width: 100 %;
    border - collapse: collapse;
    margin: 10px 0;
}

th, td {
    padding: 12px;
    text - align: left;
    border - bottom: 1px solid #dee2e6;
}

    th {
    background - color: #f8f9fa;
    font - weight: bold;
}

    .export -button {
    background - color: #28a745;
    color: white;
    padding: 10px 20px;
    border: none;
    border - radius: 4px;
    cursor: pointer;
    margin: 10px 0;
}

    .export -button:hover {
    background - color: #218838;
}
    .issue-details {
    margin-top: 10px;
    padding: 10px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
}

.issue-details p {
    margin: 5px 0;
}

.issue-card {
    padding: 15px;
    margin: 15px 0;
    border-radius: 8px;
    border-left-width: 4px;
}

.issue-card h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: inherit;
}
`;

const tabStyles = `
    .tab-content {
        display: none;
    }

    .tab-content.active {
        display: block;
    }

    .issue-card {
        padding: 15px;
        margin: 10px 0;
        border-radius: 8px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .issues-list {
        display: grid;
        gap: 15px;
        padding: 15px;
    }

    .issues-list .score-error {
        border-left: 4px solid #dc3545;
    }

    .issues-list .score-warning {
        border-left: 4px solid #ffc107;
    }
`;

const overviewStyles = `
    .summary-panel {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin: 20px 0;
    }

    .summary-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .summary-card h3 {
        margin: 0 0 15px 0;
        color: #333;
    }

    .statistic-value {
        font-size: 32px;
        font-weight: bold;
        margin: 10px 0;
        padding: 10px;
        border-radius: 4px;
        text-align: center;
    }

    .statistics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 20px;
    }

    .statistic-item {
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
    }

    .statistic-item h4 {
        margin: 0 0 10px 0;
        color: #666;
    }
`;

const loadingStyles = `
    .loading-indicator {
        text-align: center;
        padding: 40px;
        color: #666;
    }

    .spinner {
        width: 40px;
        height: 40px;
        margin: 20px auto;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

// 2. Combiner tous les styles
const allStyles = additionalStyles + tabStyles + overviewStyles + loadingStyles;
// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Initialisation des styles
        const styleSheet = document.createElement("style");
        styleSheet.innerText = additionalStyles + tabStyles + overviewStyles;
        document.head.appendChild(styleSheet);

        // 2. Afficher l'indicateur de chargement
        showLoadingIndicator();

        // 3. Récupération et validation des données
        const data = await chrome.storage.local.get('sitemapAnalysis');
        const analysis = data.sitemapAnalysis;

        if (!analysis) {
            throw new Error("Aucune donnée d'analyse trouvée");
        }

        if (!validateAnalysisData(analysis)) {
            throw new Error("Les données d'analyse sont invalides ou incomplètes");
        }

        // 4. Initialisation de l'interface
        setupTabsManagement();
        initializeFilters();

        // 5. Affichage des données dans tous les onglets
        displayOverview(analysis);              // Vue d'ensemble
        displayGlobalStats(analysis);           // Statistiques globales
        displayPagesAnalysis(analysis.results); // Détails par page
        displayIssues(analysis);               // Points d'attention

        // 6. Configuration des interactions
        setupExportButton(analysis);
        setupCollapsibleEvents();

        // 7. Finalisation
        hideLoadingIndicator();

    } catch (error) {
        console.error('Erreur lors du chargement des résultats:', error);
        showError("Erreur lors du chargement des résultats: " + error.message);
        hideLoadingIndicator();
    }
});

// Amélioration de la fonction de validation
function validateAnalysisData(analysis) {
    if (!analysis || !analysis.results || typeof analysis.results !== 'object') {
        return false;
    }

    // Vérification de chaque page analysée
    for (const url in analysis.results) {
        const pageData = analysis.results[url];

        // Vérification des propriétés essentielles
        const requiredProps = [
            'meta_check',
            'link_check',
            'alt_img_check',
            'hn',
            'bold_check',
            'cdp_global_score',
            'webdesigner_global_score'
        ];

        for (const prop of requiredProps) {
            if (!pageData[prop]) {
                console.warn(`Propriété manquante: ${prop} pour l'URL: ${url}`);
                return false;
            }
        }
    }

    return true;
}

// Amélioration des indicateurs de chargement
function showLoadingIndicator() {
    const container = document.getElementById('globalStatsContent');
    if (container) {
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Chargement des résultats d'analyse...</p>
            </div>
        `;
    }
}

function hideLoadingIndicator() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}



// Nouvelle fonction de validation des données
function validateAnalysisData(analysis) {
    if (!analysis || !analysis.results || typeof analysis.results !== 'object') {
        return false;
    }

    // Vérifier la présence des propriétés essentielles dans chaque résultat
    for (const url in analysis.results) {
        const result = analysis.results[url];
        if (!result.meta_check || !result.link_check || !result.alt_img_check ||
            !result.hn || !result.bold_check) {
            console.warn(`Données incomplètes pour l'URL: ${url}`);
            return false;
        }
    }

    return true;
}
// Fonction de filtrage améliorée
function applyFilters() {
    const urlFilter = document.getElementById('urlFilter').value.toLowerCase();
    const scoreFilter = document.getElementById('scoreFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    const pageCards = document.querySelectorAll('.page-card');

    pageCards.forEach(card => {
        const url = card.querySelector('h3').textContent.toLowerCase();
        const score = parseFloat(card.querySelector('.score-card').textContent.split(':')[1]);

        let shouldShow = true;

        // Filtre URL
        if (urlFilter && !url.includes(urlFilter)) {
            shouldShow = false;
        }

        // Filtre Score
        if (scoreFilter !== 'all') {
            switch (scoreFilter) {
                case 'good':
                    if (score < 4) shouldShow = false;
                    break;
                case 'warning':
                    if (score < 2.5 || score >= 4) shouldShow = false;
                    break;
                case 'error':
                    if (score >= 2.5) shouldShow = false;
                    break;
            }
        }

        // Filtre Catégorie
        if (categoryFilter !== 'all') {
            const categoryScore = card.querySelector(`.${categoryFilter}-score`);
            if (!categoryScore || parseFloat(categoryScore.textContent) < 3) {
                shouldShow = false;
            }
        }

        card.style.display = shouldShow ? 'block' : 'none';
    });
}
// Nouvelle fonction pour initialiser les filtres
function initializeFilters() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.innerHTML = `
        <div class="filter-group">
            <input type="text" id="urlFilter" placeholder="Filtrer par URL..." class="filter-input">
            <select id="scoreFilter" class="filter-input">
                <option value="all">Tous les scores</option>
                <option value="good">Bons scores (>4)</option>
                <option value="warning">Scores moyens (2.5-4)</option>
                <option value="error">Mauvais scores (<2.5)</option>
            </select>
            <select id="categoryFilter" class="filter-input">
                <option value="all">Toutes les catégories</option>
                <option value="meta">Meta</option>
                <option value="links">Liens</option>
                <option value="images">Images</option>
                <option value="hn">Structure Hn</option>
                <option value="bold">Textes en gras</option>
            </select>
        </div>
    `;

    // Insérer les filtres avant la section d'analyse des pages
    const pagesAnalysis = document.getElementById('pagesAnalysis');
    pagesAnalysis.parentNode.insertBefore(filterContainer, pagesAnalysis);

    // Ajouter les événements de filtrage
    document.getElementById('urlFilter').addEventListener('input', applyFilters);
    document.getElementById('scoreFilter').addEventListener('change', applyFilters);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
}

// Fonction améliorée de calcul des statistiques globales
function calculateGlobalStats(results) {
    const pages = Object.values(results);

    // Calcul des scores globaux pour chaque page
    const globalScores = pages.map(page => {
        const cdpScore = parseFloat(page.cdp_global_score?.global_score) || 0;
        const webdesignerScore = parseFloat(page.webdesigner_global_score?.global_score) || 0;
        return (cdpScore + webdesignerScore) / 2;
    });

    // Calcul du score global moyen
    const averageGlobalScore = average(globalScores);

    // Création de l'objet stats avec toutes les statistiques
    const stats = {
        ...calculateBasicStats(results),
        metaStats: calculateMetaStats(results),
        linkStats: calculateLinkStats(results),
        imageStats: calculateImageStats(results),
        hnStats: calculateHnStats(results),
        boldStats: calculateBoldStats(results),
        globalScore: averageGlobalScore,      // Ajout du score global moyen
        totalPages: pages.length,             // Nombre total de pages
        individualScores: globalScores        // Scores individuels des pages
    };

    // Ajout des statistiques supplémentaires
    stats.totalIssues = calculateTotalIssues(stats);
    stats.overallScore = calculateOverallScore(stats);

    // Log pour débogage
    console.log('Statistiques calculées:', {
        globalScore: stats.globalScore,
        totalPages: stats.totalPages,
        totalIssues: stats.totalIssues,
        overallScore: stats.overallScore
    });

    return stats;
}

// Calcul des statistiques de base
function calculateBasicStats(results) {
    const pages = Object.values(results);

    const cdpScores = pages.map(p => parseFloat(p.cdp_global_score?.global_score) || 0);
    const webdesignerScores = pages.map(p => parseFloat(p.webdesigner_global_score?.global_score) || 0);

    return {
        totalPages: pages.length,
        successfulScans: pages.filter(p => !p.error).length,
        averageCDPScore: average(cdpScores),
        averageWebdesignerScore: average(webdesignerScores)
    };
}

// Calcul des statistiques meta
function calculateMetaStats(results) {
    const pages = Object.values(results);
    return {
        averageScore: average(pages.map(p => parseFloat(p.meta_check?.global_score) || 0)),
        totalMetas: sum(pages.map(p => parseInt(p.meta_check?.nb_meta) || 0)),
        issuesCount: pages.reduce((acc, page) => {
            const metaIssues = page.meta_check?.meta?.filter(m =>
                parseFloat(m.meta_score) < 3
            ).length || 0;
            return acc + metaIssues;
        }, 0),
        missingMetas: pages.filter(p =>
            !p.meta_check?.meta?.some(m => m.meta_type === "title") ||
            !p.meta_check?.meta?.some(m => m.meta_type === "description")
        ).length
    };
}

// Calcul des statistiques des liens
function calculateLinkStats(results) {
    const pages = Object.values(results);
    return {
        averageScore: average(pages.map(p => parseFloat(p.link_check?.global_score) || 0)),
        totalLinks: sum(pages.map(p => parseInt(p.link_check?.nb_link) || 0)),
        brokenLinks: pages.reduce((acc, page) => {
            const brokenCount = page.link_check?.link?.filter(l =>
                l.link_status !== 200
            ).length || 0;
            return acc + brokenCount;
        }, 0),
        emptyTextLinks: pages.reduce((acc, page) => {
            const emptyCount = page.link_check?.link?.filter(l =>
                !l.link_text || l.link_text.trim() === ""
            ).length || 0;
            return acc + emptyCount;
        }, 0)
    };
}

// Calcul des statistiques des images
function calculateImageStats(results) {
    const pages = Object.values(results);
    return {
        averageScore: average(pages.map(p => parseFloat(p.alt_img_check?.global_score) || 0)),
        totalImages: sum(pages.map(p => parseInt(p.img_check?.nb_img) || 0)),
        missingAlt: pages.reduce((acc, page) => {
            const missingCount = page.alt_img_check?.alt_img?.filter(img =>
                !img.alt_img_state
            ).length || 0;
            return acc + missingCount;
        }, 0),
        sizeIssues: pages.reduce((acc, page) => {
            const sizeIssuesCount = page.img_check?.size_img?.filter(img =>
                !img.size_img_state
            ).length || 0;
            return acc + sizeIssuesCount;
        }, 0),
        ratioIssues: pages.reduce((acc, page) => {
            const ratioIssuesCount = page.img_check?.ratio_img?.filter(img =>
                !img.ratio_img_state
            ).length || 0;
            return acc + ratioIssuesCount;
        }, 0)
    };
}

// Calcul des statistiques des titres Hn
function calculateHnStats(results) {
    const pages = Object.values(results);
    return {
        averageScore: average(pages.map(p => parseFloat(p.hn?.global_score) || 0)),
        totalHn: sum(pages.map(p => parseInt(p.hn?.nb_hn) || 0)),
        missingH1: pages.filter(p =>
            !p.hn?.hn_reco?.hn?.some(h => h.hn_type === "h1")
        ).length,
        outlineIssues: pages.reduce((acc, page) => {
            const outlineIssues = page.hn?.hn_outline?.hn?.filter(h =>
                !h.hn_validity
            ).length || 0;
            return acc + outlineIssues;
        }, 0),
        lengthIssues: pages.reduce((acc, page) => {
            const lengthIssues = page.hn?.hn_reco?.hn?.filter(h =>
                parseFloat(h.hn_score) < 3
            ).length || 0;
            return acc + lengthIssues;
        }, 0)
    };
}

// Calcul des statistiques des textes en gras
function calculateBoldStats(results) {
    const pages = Object.values(results);
    return {
        averageScore: average(pages.map(p => parseFloat(p.bold_check?.global_score) || 0)),
        totalBold: sum(pages.map(p => parseInt(p.bold_check?.nb_bold) || 0)),
        issuesCount: pages.reduce((acc, page) => {
            const boldIssues = page.bold_check?.bold_txt?.filter(b =>
                !b.bold_txt_state
            ).length || 0;
            return acc + boldIssues;
        }, 0)
    };
}

// Calcul du nombre total de problèmes
function calculateTotalIssues(stats) {
    return (
        stats.metaStats.issuesCount +
        stats.linkStats.brokenLinks +
        stats.imageStats.missingAlt +
        stats.imageStats.sizeIssues +
        stats.imageStats.ratioIssues +
        stats.hnStats.missingH1 +
        stats.hnStats.outlineIssues +
        stats.hnStats.lengthIssues +
        stats.boldStats.issuesCount
    );
}

// Calcul du score global
function calculateOverallScore(stats) {
    const scores = [
        stats.globalScore,                    // Score global moyen
        stats.metaStats.averageScore,         // Score meta
        stats.linkStats.averageScore,         // Score liens
        stats.imageStats.averageScore,        // Score images
        stats.hnStats.averageScore,           // Score Hn
        stats.boldStats.averageScore          // Score textes en gras
    ];

    // Pondération des scores
    const weights = [0.3, 0.15, 0.15, 0.15, 0.15, 0.1];
    let weightedScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < scores.length; i++) {
        if (!isNaN(scores[i])) {
            weightedScore += scores[i] * weights[i];
            totalWeight += weights[i];
        }
    }

    return totalWeight > 0 ? (weightedScore / totalWeight).toFixed(2) : 0;
}

// Fonction de calcul et affichage des statistiques globales corrigée
function displayGlobalStats(analysis) {
    try {
        console.log('Données d\'analyse reçues:', analysis); // Debug

        // Vérification de la structure des données
        if (!analysis || !analysis.results) {
            throw new Error('Structure de données invalide');
        }

        const stats = calculateGlobalStats(analysis.results);
        console.log('Statistiques calculées:', stats); // Debug

        const container = document.getElementById('globalStatsContent');
        if (!container) {
            throw new Error('Container des statistiques non trouvé');
        }

        container.innerHTML = `
            <div class="metric-group">
                <div class="metric-title">Scores Globaux</div>
                <div class="score-card ${getScoreClass(stats.overallScore)}">
                    <h3>Score Global</h3>
                    <p class="score-value">${stats.overallScore || '0'}/5</p>
                </div>
            </div>

            <div class="metric-group">
                <div class="metric-title">Analyses Détaillées</div>
                
                <div class="analysis-section">
                    <h3>Meta-données</h3>
                    <p>Score moyen: ${stats.metaStats?.averageScore?.toFixed(2) || '0'}/5</p>
                    <p>Pages avec problèmes: ${stats.metaStats?.issuesCount || '0'}/${stats.totalPages || '0'}</p>
                </div>

                <div class="analysis-section">
                    <h3>Liens</h3>
                    <p>Score moyen: ${stats.linkStats?.averageScore?.toFixed(2) || '0'}/5</p>
                    <p>Nombre total de liens: ${stats.linkStats?.totalLinks || '0'}</p>
                    <p>Liens cassés: ${stats.linkStats?.brokenLinks || '0'}</p>
                </div>

                <div class="analysis-section">
                    <h3>Images</h3>
                    <p>Score alt moyen: ${stats.imageStats?.averageScore?.toFixed(2) || '0'}/5</p>
                    <p>Images sans alt: ${stats.imageStats?.missingAlt || '0'}/${stats.imageStats?.totalImages || '0'}</p>
                    <p>Problèmes de taille: ${stats.imageStats?.sizeIssues || '0'}</p>
                    <p>Problèmes de ratio: ${stats.imageStats?.ratioIssues || '0'}</p>
                </div>

                <div class="analysis-section">
                    <h3>Structure Hn</h3>
                    <p>Score moyen: ${stats.hnStats?.averageScore?.toFixed(2) || '0'}/5</p>
                    <p>Pages sans H1: ${stats.hnStats?.missingH1 || '0'}</p>
                    <p>Problèmes de structure: ${stats.hnStats?.outlineIssues || '0'}</p>
                </div>

                <div class="analysis-section">
                    <h3>Textes en gras</h3>
                    <p>Score moyen: ${stats.boldStats?.averageScore?.toFixed(2) || '0'}/5</p>
                    <p>Nombre total: ${stats.boldStats?.totalBold || '0'}</p>
                    <p>Problèmes détectés: ${stats.boldStats?.issuesCount || '0'}</p>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Erreur dans displayGlobalStats:', error);
        const container = document.getElementById('globalStatsContent');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>Une erreur est survenue lors de l'affichage des statistiques.</p>
                    <p>Détail: ${error.message}</p>
                </div>
            `;
        }
    }
}
// Fonction utilitaire pour la gestion sécurisée des nombres
function safeNumber(value, decimals = 2) {
    try {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num.toFixed(decimals);
    } catch {
        return '0';
    }
}


// Fonction de calcul des statistiques globales avec vérification des données
function calculateGlobalStats(results) {
    if (!results || typeof results !== 'object') {
        console.warn('Données invalides pour le calcul des statistiques');
        return {
            totalPages: 0,
            overallScore: 0,
            metaStats: {},
            linkStats: {},
            imageStats: {},
            hnStats: {},
            boldStats: {}
        };
    }

    try {
        const pages = Object.values(results);
        const stats = {
            totalPages: pages.length,
            ...calculateBasicStats(results),
            metaStats: calculateMetaStats(results),
            linkStats: calculateLinkStats(results),
            imageStats: calculateImageStats(results),
            hnStats: calculateHnStats(results),
            boldStats: calculateBoldStats(results)
        };

        stats.totalIssues = calculateTotalIssues(stats);
        stats.overallScore = calculateOverallScore(stats);

        return stats;
    } catch (error) {
        console.error('Erreur dans le calcul des statistiques:', error);
        return {
            totalPages: 0,
            overallScore: 0,
            metaStats: {},
            linkStats: {},
            imageStats: {},
            hnStats: {},
            boldStats: {}
        };
    }
}

function displayPagesAnalysis(results) {
    const container = document.getElementById('pagesAnalysis');
    container.innerHTML = ''; // Clear container

    Object.entries(results).forEach(([url, pageData]) => {
        const card = document.createElement('div');
        card.className = 'page-card';
        card.innerHTML = createPageCard(url, pageData);
        container.appendChild(card);
    });
}
// Fonction principale pour le calcul du score global
function calculateGlobalScore(pageData) {
    // Scores individuels
    const cdpScore = parseFloat(pageData.cdp_global_score?.global_score) || 0;
    const webdesignerScore = parseFloat(pageData.webdesigner_global_score?.global_score) || 0;

    // Scores de catégories
    const metaScore = parseFloat(pageData.meta_check?.global_score) || 0;
    const linkScore = parseFloat(pageData.link_check?.global_score) || 0;
    const imgScore = parseFloat(pageData.alt_img_check?.global_score) || 0;
    const hnScore = parseFloat(pageData.hn?.global_score) || 0;
    const boldScore = parseFloat(pageData.bold_check?.global_score) || 0;

    // Calcul de la moyenne pondérée
    const scores = [
        { score: metaScore, weight: 0.25 },       // 25% meta
        { score: linkScore, weight: 0.20 },       // 20% liens
        { score: imgScore, weight: 0.20 },        // 20% images
        { score: hnScore, weight: 0.25 },         // 25% structure
        { score: boldScore, weight: 0.10 }        // 10% textes en gras
    ];

    let totalScore = 0;
    let totalWeight = 0;

    scores.forEach(({ score, weight }) => {
        if (!isNaN(score)) {
            totalScore += score * weight;
            totalWeight += weight;
        }
    });

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return finalScore.toFixed(2);
}
function createPageCard(url, data) {
    const globalScore = calculateGlobalScore(data);

    return `
        <div class="page-header">
            <h3><a class="headerTitleH3" href="${url}" target="_blank">${url}</a></h3>
            <div class="score-card ${getScoreClass(globalScore)}">
                Score Global: ${globalScore}/5
            </div>
        </div>

        <button class="collapsible">Meta (Score: ${data.meta_check?.global_score || '0'}/5)</button>
        <div class="content">
            ${createMetaSection(data.meta_check)}
        </div>

        <button class="collapsible">Images (Score: ${data.alt_img_check?.global_score || '0'}/5)</button>
        <div class="content">
            ${createImagesSection(data.alt_img_check, data.img_check)}
        </div>

        <button class="collapsible">Liens (Score: ${data.link_check?.global_score || '0'}/5)</button>
        <div class="content">
            ${createLinksSection(data.link_check)}
        </div>

        <button class="collapsible">Longueur Hn (Score: ${data.hn?.hn_reco?.global_score || '0'}/5)</button>
        <div class="content">
            ${createHnRecoSection(data.hn)}
        </div>

        <button class="collapsible">Outline Hn (Score: ${data.hn?.hn_outline?.global_score || '0'}/5)</button>
        <div class="content">
            ${createHnOutlineSection(data.hn)}
        </div>

        <button class="collapsible">Textes en gras (Score: ${data.bold_check?.global_score || '0'}/5)</button>
        <div class="content">
            ${createBoldSection(data.bold_check)}
        </div>
    `;
}

function createMetaSection(metaCheck) {
    if (!metaCheck?.meta) return '<p>Pas de données meta disponibles</p>';

    return `
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Contenu</th>
                    <th>Taille</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${metaCheck.meta.map(meta => `
                    <tr>
                        <td>${meta.meta_type}</td>
                        <td>${meta.meta_txt}</td>
                        <td>${meta.meta_size}</td>
                        <td><span class="score ${getScoreClass(meta.meta_score)}">${meta.meta_score}/5</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function createImagesSection(altCheck, imgCheck) {
    let content = '<h4>Attributs Alt des images</h4>';

    if (altCheck?.alt_img) {
        content += `
            <table>
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>État Alt</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${altCheck.alt_img.map(img => `
                        <tr>
                            <td>${img.alt_img_src}</td>
                            <td>${img.alt_img_state ? '✅' : '❌'}</td>
                            <td><span class="score ${getScoreClass(img.alt_img_score)}">${img.alt_img_score}/5</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    if (imgCheck?.size_img) {
        content += `
            <h4>Tailles des images</h4>
            <table>
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>Taille</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${imgCheck.size_img.map(img => `
                        <tr>
                            <td>${img.size_img_src}</td>
                            <td>${img.size_img}</td>
                            <td><span class="score ${getScoreClass(img.size_img_score)}">${img.size_img_score}/5</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    return content;
}

function createLinksSection(linkCheck) {
    if (!linkCheck?.link) return '<p>Pas de données sur les liens disponibles</p>';

    return `
        <table>
            <thead>
                <tr>
                    <th>URL</th>
                    <th>Texte</th>
                    <th>Status</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${linkCheck.link.map(link => `
                    <tr>
                        <td>${link.link_url || ''}</td>
                        <td>${link.link_text || ''}</td>
                        <td>${link.link_status || ''}</td>
                        <td><span class="score ${getScoreClass(link.link_score)}">${link.link_score || '0'}/5</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function createHnRecoSection(hnData) {
    if (!hnData?.hn_reco?.hn) return '<p>Pas de données sur la longueur des Hn disponibles</p>';

    return `
        <div class="metric-group">
            <p><strong>Recommandation:</strong> ${hnData.hn_reco.hn_preco}</p>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Contenu</th>
                        <th>Nombre de caractères</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${hnData.hn_reco.hn.map(hn => `
                        <tr>
                            <td>${hn.hn_type}</td>
                            <td>${hn.hn_txt}</td>
                            <td>${hn.hn_letters_count}</td>
                            <td><span class="score ${getScoreClass(hn.hn_score)}">${hn.hn_score}/5</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Nouvelle fonction pour l'analyse de la structure des Hn
function createHnOutlineSection(hnData) {
    if (!hnData?.hn_outline?.hn) return '<p>Pas de données sur la structure des Hn disponibles</p>';

    return `
        <div class="metric-group">
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Validité</th>
                        <th>Message</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${hnData.hn_outline.hn.map(hn => `
                        <tr>
                            <td>${hn.hn_type}</td>
                            <td>${hn.hn_validity ? '✅' : '❌'}</td>
                            <td>${hn.hn_validity_message}</td>
                            <td><span class="score ${getScoreClass(hn.hn_validity_score)}">${hn.hn_validity_score}/5</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function createBoldSection(boldCheck) {
    if (!boldCheck?.bold_txt) return '<p>Pas de données sur les textes en gras</p>';

    return `
        <table>
            <thead>
                <tr>
                    <th>Contenu</th>
                    <th>État</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${boldCheck.bold_txt.map(bold => `
                    <tr>
                        <td>${bold.bold_txt} | nombre de mot ${bold.bold_nb_words}</td>
                        <td>${bold.bold_txt_state ? '✅' : '❌'}</td>
                        <td><span class="score">${boldCheck.global_score}/5</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function setupExportButton(analysis) {
    document.getElementById('exportButton')?.addEventListener('click', () => {
        exportToCSV(analysis);
    });
}

function exportToCSV(analysis) {
    const headers = [
        'URL',
        'Score CDP Global',
        'Score Webdesigner Global',
        'Score Meta',
        'Score Images',
        'Score Liens',
        'Score Hn',
        'Score Bold',
        'Nombre de métas',
        'Nombre d\'images',
        'Nombre de liens',
        'Nombre de Hn',
        'Textes en gras',
        'Erreurs détectées'
    ];

    const rows = [headers];

    Object.entries(analysis.results).forEach(([url, data]) => {
        const row = [
            url,
            data.cdp_global_score?.global_score || 0,
            data.webdesigner_global_score?.global_score || 0,
            data.meta_check?.global_score || 0,
            data.alt_img_check?.global_score || 0,
            data.link_check?.global_score || 0,
            data.hn?.global_score || 0,
            data.bold_check?.global_score || 0,
            data.meta_check?.nb_meta || 0,
            data.img_check?.nb_img || 0,
            data.link_check?.nb_link || 0,
            data.hn?.nb_hn || 0,
            data.bold_check?.nb_bold || 0,
            countErrors(data)
        ];

        rows.push(row);
    });

    const csvContent = rows.map(row =>
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    downloadCSV(csvContent, `analyse-seo-${new Date().toISOString()}.csv`);
}

function countErrors(pageData) {
    let errorCount = 0;

    if (pageData.meta_check?.meta) {
        errorCount += pageData.meta_check.meta.filter(m => m.meta_score < 3).length;
    }
    if (pageData.link_check?.link) {
        errorCount += pageData.link_check.link.filter(l => l.link_status !== 200).length;
    }
    if (pageData.alt_img_check?.alt_img) {
        errorCount += pageData.alt_img_check.alt_img.filter(img => !img.alt_img_state).length;
    }

    return errorCount;
}

function setupCollapsibleEvents() {
    document.addEventListener('click', function (e) {
        if (e.target && e.target.className.includes('collapsible')) {
            e.target.classList.toggle('active');
            const content = e.target.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        }
    });
}

function showError(message) {
    const container = document.getElementById('globalStatsContent');
    if (container) {
        container.innerHTML = `
            <div class="error-message" style="color: red; padding: 20px;">
                <h2>⚠️ ${message}</h2>
            </div>
        `;
    }
}

// Fonctions utilitaires
function average(arr) {
    return arr.length ? arr.reduce((a, b) => a + b) / arr.length : 0;
}

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

function getScoreClass(score) {
    score = parseFloat(score);
    if (score >= 4) return 'score-good';
    if (score >= 2.5) return 'score-warning';
    return 'score-error';
}