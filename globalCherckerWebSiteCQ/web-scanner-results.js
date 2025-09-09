// web-scanner-results.js
// Fichier JavaScript séparé pour la page de résultats

class WebScannerResults {
    constructor() {
        this.results = [];
        this.summary = null;
        this.filteredResults = [];
        this.allExpanded = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadResults();
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadResults());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearResults());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportResults());
        document.getElementById('filterInput').addEventListener('input', (e) => this.filterResults(e.target.value));
        document.getElementById('expandAllBtn').addEventListener('click', () => this.expandAll());
        document.getElementById('collapseAllBtn').addEventListener('click', () => this.collapseAll());
    }
    loadResultsDirectly() {
        chrome.storage.local.get([
            'webScannerResults',
            'webScannerSummary',
            'webScannerResults_temp',
            'webScannerProgress'
        ], (data) => {
            console.log('[Results] Direct storage access:', data);

            let results = data.webScannerResults || [];
            let summary = data.webScannerSummary || null;

            // Si pas de résultats finaux mais des temporaires
            if (results.length === 0 && data.webScannerResults_temp && data.webScannerResults_temp.length > 0) {
                console.log('[Results] Using temporary results as fallback');
                results = data.webScannerResults_temp;

                // Reconstruire le summary
                summary = {
                    totalPages: data.webScannerProgress?.total || results.length,
                    pagesWithMatches: results.length,
                    totalMatches: results.reduce((sum, result) => sum + result.matches.length, 0),
                    timestamp: Date.now(),
                    analysisId: data.webScannerProgress?.analysisId || 'fallback'
                };
            }

            this.results = results;
            this.summary = summary;

            if (this.results.length > 0) {
                console.log('[Results] Successfully loaded from storage:', this.results.length, 'results');
                this.displayResults();
            } else {
                console.log('[Results] No results found in storage');
                this.showNoResults();
            }
        });
    }

    loadResults() {
        console.log('[Results] Loading Web Scanner results...');

        // D'abord vérifier les résultats
        chrome.runtime.sendMessage({
            action: "verifyWebScannerResults"
        }, (response) => {
            console.log('[Results] Verification response:', response);

            if (response && (response.status === 'success' || response.status === 'recovered')) {
                this.results = response.results || [];
                this.summary = response.summary || null;

                console.log('[Results] Loaded results:', {
                    count: this.results.length,
                    summary: this.summary
                });

                this.displayResults();
            } else {
                console.warn('[Results] No results found, trying direct storage access...');
                this.loadResultsDirectly();
            }
        });
    }

    displayResults() {
        document.getElementById('loadingContainer').style.display = 'none';

        if (this.results.length === 0) {
            this.showNoResults();
            return;
        }

        // Afficher le résumé
        this.displaySummary();

        // Afficher les résultats
        this.filteredResults = [...this.results];
        this.renderResults();

        document.getElementById('resultsCount').textContent =
            `${this.results.length} page(s) avec correspondances`;
    }

    displaySummary() {
        if (!this.summary) return;

        document.getElementById('summaryPanel').style.display = 'block';
        document.getElementById('totalPages').textContent = this.summary.totalPages || 0;
        document.getElementById('pagesWithMatches').textContent = this.summary.pagesWithMatches || 0;
        document.getElementById('totalMatches').textContent = this.summary.totalMatches || 0;

        if (this.summary.timestamp) {
            const date = new Date(this.summary.timestamp);
            document.getElementById('analysisTime').textContent = date.toLocaleString('fr-FR');
        }
    }

    renderResults() {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = '';

        if (this.filteredResults.length === 0) {
            container.innerHTML = '<div class="no-results">Aucun résultat ne correspond au filtre</div>';
            return;
        }

        this.filteredResults.forEach(result => {
            const resultElement = this.createResultElement(result);
            container.appendChild(resultElement);
        });

        document.getElementById('noResultsContainer').style.display = 'none';
    }

    createResultElement(result) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';

        const urlDiv = document.createElement('div');
        urlDiv.className = 'result-url';
        urlDiv.innerHTML = `<a href="${result.url}" target="_blank">${result.url}</a>`;

        const matchCountDiv = document.createElement('div');
        matchCountDiv.className = 'match-count';
        matchCountDiv.textContent = `${result.matches.length} correspondance(s) trouvée(s)`;

        const matchesContainer = document.createElement('div');
        matchesContainer.className = 'matches-container';

        // Afficher toutes les correspondances
        result.matches.forEach((match, index) => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match-item';

            // Cacher les correspondances après la 3ème initialement
            if (index >= 3) {
                matchDiv.classList.add('hidden-match');
            }

            // Mettre en surbrillance la correspondance dans le contexte
            let highlightedContext = match.context;
            try {
                const escapedMatch = match.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                highlightedContext = match.context.replace(
                    new RegExp(escapedMatch, 'g'),
                    '<span class="highlight">' + match.match + '</span>'
                );
            } catch (e) {
                // Si erreur, afficher sans surbrillance
                highlightedContext = match.context;
            }

            matchDiv.innerHTML = highlightedContext;
            matchesContainer.appendChild(matchDiv);
        });

        resultDiv.appendChild(urlDiv);
        resultDiv.appendChild(matchCountDiv);
        resultDiv.appendChild(matchesContainer);

        // Bouton pour afficher plus si nécessaire
        if (result.matches.length > 3) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-matches-btn';
            toggleBtn.textContent = `▼ Voir ${result.matches.length - 3} autre(s) résultat(s)`;

            let expanded = false;
            toggleBtn.addEventListener('click', () => {
                expanded = !expanded;
                const hiddenMatches = matchesContainer.querySelectorAll('.hidden-match');

                if (expanded) {
                    hiddenMatches.forEach(matchEl => {
                        matchEl.style.display = 'block';
                    });
                    toggleBtn.textContent = `▲ Masquer ${result.matches.length - 3} résultat(s)`;
                } else {
                    hiddenMatches.forEach(matchEl => {
                        matchEl.style.display = 'none';
                    });
                    toggleBtn.textContent = `▼ Voir ${result.matches.length - 3} autre(s) résultat(s)`;
                }
            });

            resultDiv.appendChild(toggleBtn);
        }

        return resultDiv;
    }

    filterResults(query) {
        const searchTerm = query.toLowerCase();
        this.filteredResults = this.results.filter(result =>
            result.url.toLowerCase().includes(searchTerm)
        );
        this.renderResults();

        document.getElementById('resultsCount').textContent =
            `${this.filteredResults.length} page(s) affichée(s) sur ${this.results.length}`;
    }

    expandAll() {
        const hiddenMatches = document.querySelectorAll('.hidden-match');
        const toggleButtons = document.querySelectorAll('.toggle-matches-btn');

        hiddenMatches.forEach(match => {
            match.style.display = 'block';
        });

        toggleButtons.forEach(btn => {
            if (btn.textContent.includes('Voir')) {
                btn.click();
            }
        });

        this.allExpanded = true;
    }

    collapseAll() {
        const hiddenMatches = document.querySelectorAll('.hidden-match');
        const toggleButtons = document.querySelectorAll('.toggle-matches-btn');

        hiddenMatches.forEach(match => {
            match.style.display = 'none';
        });

        toggleButtons.forEach(btn => {
            if (btn.textContent.includes('Masquer')) {
                btn.click();
            }
        });

        this.allExpanded = false;
    }

    exportResults() {
        if (this.results.length === 0) {
            alert('Aucun résultat à exporter');
            return;
        }

        const exportData = {
            summary: this.summary,
            results: this.results,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `web-scanner-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearResults() {
        if (confirm('Êtes-vous sûr de vouloir effacer tous les résultats ?')) {
            chrome.runtime.sendMessage({
                action: "clearWebScannerResults"
            }, (response) => {
                if (response && response.status === 'success') {
                    this.results = [];
                    this.summary = null;
                    this.showNoResults();
                }
            });
        }
    }

    showNoResults() {
        document.getElementById('loadingContainer').style.display = 'none';
        document.getElementById('noResultsContainer').style.display = 'block';
        document.getElementById('resultsContainer').innerHTML = '';
        document.getElementById('summaryPanel').style.display = 'none';
        document.getElementById('resultsCount').textContent = 'Aucun résultat';
    }
}

// Initialiser la page au chargement
document.addEventListener('DOMContentLoaded', () => {
    new WebScannerResults();
});