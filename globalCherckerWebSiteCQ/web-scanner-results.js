class WebScannerResults {
    constructor() {
        this.results = [];
        this.summary = null;
        this.filteredResults = [];
        this.allExpanded = false;
        this.pollingInterval = null;
        this.lastResultCount = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Commencer directement par le storage plutôt que les messages
        this.loadResultsDirectly();
        this.startPolling();
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadResultsDirectly());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearResults());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportResults());
        document.getElementById('filterInput').addEventListener('input', (e) => this.filterResults(e.target.value));
        document.getElementById('expandAllBtn').addEventListener('click', () => this.expandAll());
        document.getElementById('collapseAllBtn').addEventListener('click', () => this.collapseAll());
    }

    startPolling() {
        console.log('[Results] Starting polling for live updates');

        this.pollingInterval = setInterval(() => {
            this.loadResultsDirectly();
        }, 2000);

        // Arrêter le polling après 5 minutes max
        setTimeout(() => {
            if (this.pollingInterval) {
                console.log('[Results] Stopping polling after 5 minutes');
                this.stopPolling();
            }
        }, 300000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('[Results] Polling stopped');
        }
    }

    // FONCTION CORRIGÉE : Chargement direct depuis le storage SANS messages
    loadResultsDirectly() {
        chrome.storage.local.get([
            'webScannerResults',
            'webScannerSummary',
            'webScannerActive',
            'webScannerCompleted',
            'webScannerResultsCount',
            'webScannerLastUpdate'
        ], (data) => {
            // Vérifier s'il y a une erreur de runtime (normal dans certains cas)
            if (chrome.runtime.lastError) {
                console.log('[Results] Storage access error (retrying):', chrome.runtime.lastError.message);
                return;
            }

            const currentResultCount = data.webScannerResults?.length || 0;
            const isActive = data.webScannerActive || false;
            const isCompleted = data.webScannerCompleted || false;

            console.log('[Results] Storage check:', {
                results: currentResultCount,
                active: isActive,
                completed: isCompleted,
                lastUpdate: data.webScannerLastUpdate
            });

            // Mise à jour si nouveaux résultats ou première fois
            if (currentResultCount !== this.lastResultCount || this.results.length === 0) {
                console.log(`[Results] New results detected: ${this.lastResultCount} -> ${currentResultCount}`);

                this.results = data.webScannerResults || [];
                this.summary = data.webScannerSummary || null;
                this.lastResultCount = currentResultCount;

                if (this.results.length > 0) {
                    document.getElementById('loadingContainer').style.display = 'none';
                    this.displayResults();
                } else if (!isActive && !isCompleted) {
                    this.showNoResults();
                }
            }

            // Arrêter le polling si l'analyse est terminée
            if (isCompleted && this.pollingInterval) {
                console.log('[Results] Analysis completed, stopping polling');
                this.stopPolling();
            }

            this.updateStatus(isActive, isCompleted, currentResultCount);
        });
    }

    // FONCTION SUPPRIMÉE : Ne plus utiliser loadResults() avec messages
    // loadResults() { ... } - SUPPRIMÉ

    updateStatus(isActive, isCompleted, resultCount) {
        const statusElement = document.querySelector('.results-count');
        if (!statusElement) return;

        if (isActive && !isCompleted) {
            statusElement.textContent = `Analyse en cours... ${resultCount} résultat(s) trouvé(s)`;
            statusElement.style.color = '#667eea';
        } else if (isCompleted) {
            statusElement.textContent = `Analyse terminée - ${resultCount} résultat(s)`;
            statusElement.style.color = '#28a745';
        } else if (resultCount > 0) {
            statusElement.textContent = `${resultCount} résultat(s) disponible(s)`;
            statusElement.style.color = '#333';
        } else {
            statusElement.textContent = 'Aucun résultat';
            statusElement.style.color = '#666';
        }
    }

    displayResults() {
        document.getElementById('loadingContainer').style.display = 'none';

        if (this.results.length === 0) {
            this.showNoResults();
            return;
        }

        this.displaySummary();
        this.filteredResults = [...this.results];
        this.renderResults();

        console.log(`[Results] Displayed ${this.results.length} results`);
    }

    displaySummary() {
        if (!this.summary) {
            this.summary = {
                totalPages: this.results.length,
                pagesWithMatches: this.results.length,
                totalMatches: this.results.reduce((sum, result) => sum + result.matches.length, 0),
                timestamp: Date.now()
            };
        }

        document.getElementById('summaryPanel').style.display = 'block';
        document.getElementById('totalPages').textContent = this.summary.totalPages || this.results.length;
        document.getElementById('pagesWithMatches').textContent = this.summary.pagesWithMatches || this.results.length;
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

        result.matches.forEach((match, index) => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match-item';

            if (index >= 3) {
                matchDiv.classList.add('hidden-match');
            }

            let highlightedContext = match.context;
            try {
                const escapedMatch = match.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                highlightedContext = match.context.replace(
                    new RegExp(escapedMatch, 'g'),
                    '<span class="highlight">' + match.match + '</span>'
                );
            } catch (e) {
                highlightedContext = match.context;
            }

            matchDiv.innerHTML = highlightedContext;
            matchesContainer.appendChild(matchDiv);
        });

        resultDiv.appendChild(urlDiv);
        resultDiv.appendChild(matchCountDiv);
        resultDiv.appendChild(matchesContainer);

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

    // FONCTION CORRIGÉE : Suppression sans envoyer de messages
    clearResults() {
        if (confirm('Êtes-vous sûr de vouloir effacer tous les résultats ?')) {
            this.stopPolling();

            // Supprimer directement du storage SANS envoyer de messages
            chrome.storage.local.remove([
                'webScannerResults',
                'webScannerSummary',
                'webScannerActive',
                'webScannerCompleted',
                'webScannerResultsCount',
                'webScannerLastUpdate'
            ], () => {
                if (chrome.runtime.lastError) {
                    console.log('[Results] Error clearing storage:', chrome.runtime.lastError.message);
                    return;
                }

                this.results = [];
                this.summary = null;
                this.lastResultCount = 0;
                this.showNoResults();
                console.log('[Results] All data cleared');
            });
        }
    }

    showNoResults() {
        document.getElementById('loadingContainer').style.display = 'none';
        document.getElementById('noResultsContainer').style.display = 'block';
        document.getElementById('resultsContainer').innerHTML = '';
        document.getElementById('summaryPanel').style.display = 'none';

        const statusElement = document.querySelector('.results-count');
        if (statusElement) {
            statusElement.textContent = 'Aucun résultat';
        }
    }
}

// Initialiser la page au chargement
document.addEventListener('DOMContentLoaded', () => {
    new WebScannerResults();
});