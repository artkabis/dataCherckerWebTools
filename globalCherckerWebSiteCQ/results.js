// results.js

// Ajouter les styles CSS
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

    .analysis-section {
        background: #f8f9fa;
        padding: 15px;
        margin: 10px 0;
        border-radius: 8px;
        border-left: 4px solid #007bff;
    }

    .analysis-section h3 {
        margin: 0 0 10px 0;
        color: #007bff;
    }

    .page-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .collapsible {
        background-color: #f8f9fa;
        cursor: pointer;
        padding: 18px;
        width: 100%;
        border: none;
        text-align: left;
        outline: none;
        font-size: 15px;
        border-radius: 4px;
        margin: 5px 0;
    }

    .active, .collapsible:hover {
        background-color: #e9ecef;
    }

    .content {
        padding: 0 18px;
        display: none;
        overflow: hidden;
        background-color: #fafafa;
        border-radius: 4px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
    }

    th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #dee2e6;
    }

    th {
        background-color: #f8f9fa;
        font-weight: bold;
    }

    .export-button {
        background-color: #28a745;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin: 10px 0;
    }

    .export-button:hover {
        background-color: #218838;
    }
`;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Ajouter les styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = additionalStyles;
    document.head.appendChild(styleSheet);

    try {
        const data = await chrome.storage.local.get('sitemapAnalysis');
        const analysis = data.sitemapAnalysis;

        if (!analysis) {
            showError("Aucune donnée d'analyse trouvée");
            return;
        }

        displayGlobalStats(analysis);
        displayPagesAnalysis(analysis.results);
        setupExportButton(analysis);

        // Initialiser les événements pour les éléments collapsibles
        setupCollapsibleEvents();
    } catch (error) {
        console.error('Erreur lors du chargement des résultats:', error);
        showError("Erreur lors du chargement des résultats");
    }
});

function calculateGlobalStats(results) {
    const pages = Object.values(results);
    return {
        // Scores globaux
        averageCDPScore: average(pages.map(p => parseFloat(p.cdp_global_score?.global_score) || 0)),
        averageWebdesignerScore: average(pages.map(p => parseFloat(p.webdesigner_global_score?.global_score) || 0)),

        // Scores par catégorie
        metaScore: {
            average: average(pages.map(p => parseFloat(p.meta_check?.global_score) || 0)),
            total: pages.length,
            issues: pages.filter(p => parseFloat(p.meta_check?.global_score) < 3).length
        },
        linksScore: {
            average: average(pages.map(p => parseFloat(p.link_check?.global_score) || 0)),
            total: sum(pages.map(p => parseInt(p.link_check?.nb_link) || 0)),
            broken: pages.reduce((acc, p) => {
                const brokenLinks = p.link_check?.link?.filter(l => l.link_status !== 200) || [];
                return acc + brokenLinks.length;
            }, 0)
        },
        imagesScore: {
            alt: {
                average: average(pages.map(p => parseFloat(p.alt_img_check?.global_score) || 0)),
                total: sum(pages.map(p => parseInt(p.alt_img_check?.nb_alt_img) || 0)),
                missing: pages.reduce((acc, p) => {
                    const missingAlts = p.alt_img_check?.alt_img?.filter(img => !img.alt_img_state) || [];
                    return acc + missingAlts.length;
                }, 0)
            },
            size: {
                average: average(pages.map(p => parseFloat(p.img_check?.global_score) || 0)),
                total: sum(pages.map(p => parseInt(p.img_check?.nb_img) || 0)),
                issues: pages.reduce((acc, p) => {
                    const sizeIssues = p.img_check?.size_img?.filter(img => !img.size_img_state) || [];
                    return acc + sizeIssues.length;
                }, 0)
            },
            ratio: {
                issues: pages.reduce((acc, p) => {
                    const ratioIssues = p.img_check?.ratio_img?.filter(img => !img.ratio_img_state) || [];
                    return acc + ratioIssues.length;
                }, 0)
            }
        },
        hnScore: {
            average: average(pages.map(p => parseFloat(p.hn?.global_score) || 0)),
            missingH1: pages.filter(p => !p.hn?.hn_reco?.hn?.some(h => h.hn_type === "h1")).length
        },
        boldScore: {
            average: average(pages.map(p => parseFloat(p.bold_check?.global_score) || 0)),
            total: sum(pages.map(p => parseInt(p.bold_check?.nb_bold) || 0))
        }
    };
}

function displayGlobalStats(analysis) {
    const stats = calculateGlobalStats(analysis.results);
    const container = document.getElementById('globalStatsContent');

    container.innerHTML = `
        <div class="metric-group">
            <div class="metric-title">Scores Globaux</div>
            <div class="score-card ${getScoreClass(stats.averageCDPScore)}">
                <h3>Score CDP</h3>
                <p class="score-value">${stats.averageCDPScore.toFixed(2)}/5</p>
            </div>
            <div class="score-card ${getScoreClass(stats.averageWebdesignerScore)}">
                <h3>Score Webdesigner</h3>
                <p class="score-value">${stats.averageWebdesignerScore.toFixed(2)}/5</p>
            </div>
        </div>

        <div class="metric-group">
            <div class="metric-title">Analyses Détaillées</div>
            
            <div class="analysis-section">
                <h3>Meta-données</h3>
                <p>Score moyen: ${stats.metaScore.average.toFixed(2)}/5</p>
                <p>Pages avec problèmes: ${stats.metaScore.issues}/${stats.metaScore.total}</p>
            </div>

            <div class="analysis-section">
                <h3>Liens</h3>
                <p>Score moyen: ${stats.linksScore.average.toFixed(2)}/5</p>
                <p>Nombre total de liens: ${stats.linksScore.total}</p>
                <p>Liens cassés: ${stats.linksScore.broken}</p>
            </div>

            <div class="analysis-section">
                <h3>Images</h3>
                <p>Score alt moyen: ${stats.imagesScore.alt.average.toFixed(2)}/5</p>
                <p>Images sans alt: ${stats.imagesScore.alt.missing}/${stats.imagesScore.alt.total}</p>
                <p>Problèmes de taille: ${stats.imagesScore.size.issues}</p>
                <p>Problèmes de ratio: ${stats.imagesScore.ratio.issues}</p>
            </div>

            <div class="analysis-section">
                <h3>Structure Hn</h3>
                <p>Score moyen: ${stats.hnScore.average.toFixed(2)}/5</p>
                <p>Pages sans H1: ${stats.hnScore.missingH1}</p>
            </div>

            <div class="analysis-section">
                <h3>Textes en gras</h3>
                <p>Score moyen: ${stats.boldScore.average.toFixed(2)}/5</p>
                <p>Nombre total: ${stats.boldScore.total}</p>
            </div>
        </div>
    `;
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

function createPageCard(url, data) {
    return `
        <div class="page-header">
            <h3>${url}</h3>
            <div class="score-card ${getScoreClass(data.cdp_global_score?.global_score)}">
                Score Global: ${data.cdp_global_score?.global_score || 0}/5
            </div>
        </div>

        <button class="collapsible">Meta (Score: ${data.meta_check?.global_score || 0}/5)</button>
        <div class="content">
            ${createMetaSection(data.meta_check)}
        </div>

        <button class="collapsible">Images (Score: ${data.alt_img_check?.global_score || 0}/5)</button>
        <div class="content">
            ${createImagesSection(data.alt_img_check, data.img_check)}
        </div>

        <button class="collapsible">Liens (Score: ${data.link_check?.global_score || 0}/5)</button>
        <div class="content">
            ${createLinksSection(data.link_check)}
        </div>

        <button class="collapsible">Structure Hn (Score: ${data.hn?.global_score || 0}/5)</button>
        <div class="content">
            ${createHnSection(data.hn)}
        </div>

        <button class="collapsible">Textes en gras (Score: ${data.bold_check?.global_score || 0}/5)</button>
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
    let content = '<h4>Images et attributs Alt</h4>';

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
} function createLinksSection(linkCheck) {
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
                        <td>${link.link_url}</td>
                        <td>${link.link_text}</td>
                        <td>${link.link_status}</td>
                        <td><span class="score ${getScoreClass(link.alt_img_score)}">${link.alt_img_score}/5</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function createHnSection(hnData) {
    if (!hnData?.hn_reco?.hn) return '<p>Pas de données Hn disponibles</p>';

    return `
        <div class="metric-group">
            <p><strong>Recommandation:</strong> ${hnData.hn_reco.hn_preco}</p>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Contenu</th>
                        <th>Nombre de mots</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${hnData.hn_reco.hn.map(hn => `
                        <tr>
                            <td>${hn.hn_type}</td>
                            <td>${hn.hn_txt}</td>
                            <td>${hn.hn_words_count}</td>
                            <td><span class="score ${getScoreClass(hn.hn_score)}">${hn.hn_score}/5</span></td>
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
                        <td>${bold.bold_txt_content}</td>
                        <td>${bold.bold_txt_state ? '✅' : '❌'}</td>
                        <td><span class="score ${getScoreClass(bold.bold_txt_score)}">${bold.bold_txt_score}/5</span></td>
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
        'Score Bold'
    ];

    const rows = [headers];

    Object.entries(analysis.results).forEach(([url, data]) => {
        rows.push([
            url,
            data.cdp_global_score?.global_score || 0,
            data.webdesigner_global_score?.global_score || 0,
            data.meta_check?.global_score || 0,
            data.alt_img_check?.global_score || 0,
            data.link_check?.global_score || 0,
            data.hn?.global_score || 0,
            data.bold_check?.global_score || 0
        ]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'site-analysis.csv');
    a.click();
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