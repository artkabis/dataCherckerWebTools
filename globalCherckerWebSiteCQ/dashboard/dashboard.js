/**
 * Dashboard Controller
 * Gère l'interface du dashboard professionnel
 * @version 5.0.0
 */

class DashboardController {
  constructor() {
    this.orchestrator = new AnalysisOrchestrator();
    this.currentAnalysis = null;
    this.charts = {};
    this.init();
  }

  /**
   * Initialisation
   */
  async init() {
    console.log('Initializing Dashboard...');

    // Initialiser l'orchestrateur
    await this.orchestrator.init();

    // Charger l'historique
    await this.orchestrator.loadHistoryFromStorage();

    // Setup event listeners
    this.setupEventListeners();

    // Charger les données initiales
    await this.loadInitialData();

    // Setup tabs
    this.setupTabs();

    console.log('✓ Dashboard initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Preset selector
    document.getElementById('preset-selector').addEventListener('change', (e) => {
      this.orchestrator.configManager.applyPreset(e.target.value);
      this.showNotification('Preset appliqué: ' + e.target.value);
    });

    // Profile selector
    document.getElementById('profile-selector').addEventListener('change', (e) => {
      this.orchestrator.configManager.applyProfile(e.target.value);
      this.showNotification('Profil appliqué: ' + e.target.value);
    });

    // New analysis button
    document.getElementById('new-analysis-btn').addEventListener('click', () => {
      this.startNewAnalysis();
    });

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.switchTab('settings');
    });

    // Export buttons
    document.getElementById('export-csv')?.addEventListener('click', () => {
      this.exportData('csv');
    });

    document.getElementById('export-json')?.addEventListener('click', () => {
      this.exportData('json');
    });

    // Écouter les messages du service worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'analysis_complete') {
        this.handleAnalysisComplete(message.data);
      }
    });
  }

  /**
   * Setup tabs
   */
  setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  /**
   * Switch tab
   */
  switchTab(tabName) {
    // Désactiver tous les tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // Activer le tab sélectionné
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Charger les données du tab
    switch (tabName) {
      case 'overview':
        this.loadOverview();
        break;
      case 'history':
        this.loadHistory();
        break;
      case 'comparison':
        this.loadComparison();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  }

  /**
   * Charge les données initiales
   */
  async loadInitialData() {
    this.showLoading(true);

    try {
      // Charger la dernière analyse depuis IndexedDB
      const lastAnalysis = await this.getLastAnalysisFromDB();
      if (lastAnalysis) {
        this.currentAnalysis = lastAnalysis;
        this.updateDashboard(lastAnalysis);
      } else {
        this.showEmptyState();
      }

      // Mettre à jour les sélecteurs
      document.getElementById('preset-selector').value = this.orchestrator.configManager.currentPreset;
      document.getElementById('profile-selector').value = this.orchestrator.configManager.currentProfile;

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Erreur de chargement des données');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Démarre une nouvelle analyse
   */
  async startNewAnalysis() {
    try {
      // Obtenir l'onglet actif
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        this.showError('Impossible de récupérer l\'URL de la page');
        return;
      }

      this.showLoading(true);
      this.showNotification('Analyse en cours...');

      // Envoyer un message au service worker pour démarrer l'analyse
      chrome.runtime.sendMessage({
        action: 'start_analysis',
        url: tab.url,
        tabId: tab.id,
        config: {
          preset: this.orchestrator.configManager.currentPreset,
          profile: this.orchestrator.configManager.currentProfile
        }
      });

    } catch (error) {
      console.error('Error starting analysis:', error);
      this.showError('Erreur lors du démarrage de l\'analyse');
      this.showLoading(false);
    }
  }

  /**
   * Gère la fin d'une analyse
   */
  async handleAnalysisComplete(data) {
    this.showLoading(false);

    if (data.success) {
      this.currentAnalysis = data;
      this.updateDashboard(data);
      this.showNotification('✓ Analyse terminée !', 'success');

      // Sauvegarder dans IndexedDB
      await this.saveAnalysisToDB(data);
    } else {
      this.showError('Erreur lors de l\'analyse: ' + data.error);
    }
  }

  /**
   * Met à jour le dashboard
   */
  updateDashboard(analysis) {
    if (!analysis) return;

    // Mettre à jour les stats
    this.updateStats(analysis);

    // Mettre à jour les graphiques
    this.updateCharts(analysis);

    // Mettre à jour la liste des analyses récentes
    this.updateRecentAnalyses();
  }

  /**
   * Met à jour les statistiques
   */
  updateStats(analysis) {
    const statsGrid = document.getElementById('stats-grid');
    if (!statsGrid) return;

    const stats = [
      {
        icon: 'fas fa-star',
        value: analysis.globalScore.toFixed(1),
        label: 'Score Global',
        color: this.getScoreColor(analysis.globalScore),
        suffix: '/5'
      },
      {
        icon: 'fas fa-tags',
        value: analysis.analyses?.meta?.data?.globalScore?.toFixed(1) || 'N/A',
        label: 'Meta Tags',
        color: '#667eea',
        suffix: '/5'
      },
      {
        icon: 'fas fa-image',
        value: analysis.analyses?.images?.data?.totalImages || 0,
        label: 'Images',
        color: '#48bb78'
      },
      {
        icon: 'fas fa-heading',
        value: analysis.analyses?.headings?.data?.totalHeadings || 0,
        label: 'Titres',
        color: '#ed8936'
      }
    ];

    statsGrid.innerHTML = stats.map(stat => `
      <div class="stat-card">
        <div class="stat-icon" style="background: ${stat.color}20; color: ${stat.color};">
          <i class="${stat.icon}"></i>
        </div>
        <div class="stat-value">${stat.value}${stat.suffix || ''}</div>
        <div class="stat-label">${stat.label}</div>
      </div>
    `).join('');
  }

  /**
   * Met à jour les graphiques
   */
  updateCharts(analysis) {
    if (!analysis.categoryScores) return;

    // Chart des catégories
    this.updateCategoryChart(analysis.categoryScores);
  }

  /**
   * Met à jour le graphique des catégories
   */
  updateCategoryChart(categoryScores) {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;

    // Détruire l'ancien chart s'il existe
    if (this.charts.category) {
      this.charts.category.destroy();
    }

    const labels = categoryScores.map(c => this.getCategoryLabel(c.category));
    const data = categoryScores.map(c => c.score);
    const colors = data.map(score => this.getScoreColor(score));

    this.charts.category = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Score',
          data,
          backgroundColor: colors,
          borderRadius: 8,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Score: ${context.parsed.y.toFixed(2)}/5`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  /**
   * Met à jour les analyses récentes
   */
  updateRecentAnalyses() {
    const container = document.getElementById('recent-analyses');
    if (!container) return;

    const history = this.orchestrator.getHistory(10);

    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>Aucune analyse</h3>
          <p>Lancez une nouvelle analyse pour voir les résultats ici</p>
        </div>
      `;
      return;
    }

    container.innerHTML = history.map(item => {
      const level = this.getScoreLevelClass(item.globalScore);
      const date = new Date(item.timestamp).toLocaleString('fr-FR');

      return `
        <div class="analysis-item ${level}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <strong>${this.truncateUrl(item.url)}</strong>
              <div style="color: #718096; font-size: 0.9rem; margin-top: 5px;">
                ${date} • ${item.preset} • ${item.profile}
              </div>
            </div>
            <div class="score-badge ${level}">
              ${item.globalScore.toFixed(1)}
            </div>
          </div>
          <div class="progress-bar-custom">
            <div class="progress-fill" style="width: ${(item.globalScore / 5) * 100}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Charge l'overview
   */
  loadOverview() {
    if (this.currentAnalysis) {
      this.updateDashboard(this.currentAnalysis);
    }
  }

  /**
   * Charge l'historique
   */
  loadHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;

    const history = this.orchestrator.getHistory(50);

    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history"></i>
          <h3>Aucun historique</h3>
        </div>
      `;
      return;
    }

    // Afficher l'historique
    container.innerHTML = history.map(item => {
      const level = this.getScoreLevelClass(item.globalScore);
      const date = new Date(item.timestamp).toLocaleString('fr-FR');

      return `
        <div class="analysis-item ${level}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <strong>${item.url}</strong>
              <div style="color: #718096; font-size: 0.9rem; margin-top: 5px;">
                ${date}
              </div>
            </div>
            <div class="score-badge ${level}">
              ${item.globalScore.toFixed(1)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Mettre à jour le chart d'évolution
    this.updateHistoryChart(history);
  }

  /**
   * Met à jour le chart d'historique
   */
  updateHistoryChart(history) {
    const ctx = document.getElementById('history-chart');
    if (!ctx) return;

    if (this.charts.history) {
      this.charts.history.destroy();
    }

    const data = history.reverse().map(item => ({
      x: new Date(item.timestamp),
      y: item.globalScore
    }));

    this.charts.history = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Score Global',
          data,
          borderColor: '#667eea',
          backgroundColor: '#667eea20',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            }
          },
          y: {
            beginAtZero: true,
            max: 5
          }
        }
      }
    });
  }

  /**
   * Charge la comparaison
   */
  loadComparison() {
    const container = document.getElementById('comparison-grid');
    if (!container) return;

    const history = this.orchestrator.getHistory(10);

    if (history.length < 2) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-balance-scale"></i>
          <h3>Comparaison indisponible</h3>
          <p>Analysez au moins 2 pages pour les comparer</p>
        </div>
      `;
      return;
    }

    // TODO: Implémenter la comparaison visuelle
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-balance-scale"></i>
        <h3>Comparaison</h3>
        <p>Fonctionnalité en cours de développement</p>
      </div>
    `;
  }

  /**
   * Charge les settings
   */
  loadSettings() {
    const container = document.getElementById('settings-manager');
    if (!container) return;

    const presets = Object.keys(ConfigurationManager.PRESETS);
    const currentPreset = this.orchestrator.configManager.currentPreset;
    const currentConfig = this.orchestrator.configManager.currentConfig;

    container.innerHTML = `
      <div style="padding: 20px;">
        <h4>Preset actuel: ${currentPreset}</h4>
        <p>Configurez les paramètres selon vos besoins</p>

        <div style="margin-top: 30px;">
          <h5>Presets disponibles</h5>
          ${presets.map(preset => `
            <button
              class="export-btn"
              style="margin: 5px;"
              onclick="dashboard.applyPreset('${preset}')"
            >
              ${ConfigurationManager.PRESETS[preset].name}
            </button>
          `).join('')}
        </div>

        <div style="margin-top: 30px;">
          <h5>Actions</h5>
          <button class="export-btn" onclick="dashboard.exportConfig()">
            <i class="fas fa-download"></i> Exporter configuration
          </button>
          <button class="export-btn" onclick="dashboard.importConfig()">
            <i class="fas fa-upload"></i> Importer configuration
          </button>
          <button class="export-btn" onclick="dashboard.resetConfig()">
            <i class="fas fa-redo"></i> Réinitialiser
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Exporte les données
   */
  async exportData(format) {
    const history = this.orchestrator.getHistory();

    if (history.length === 0) {
      this.showError('Aucune donnée à exporter');
      return;
    }

    try {
      let content;
      let filename;
      let mimeType;

      if (format === 'csv') {
        content = this.orchestrator.exportResults(history, 'csv');
        filename = `analysis_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else if (format === 'json') {
        content = this.orchestrator.exportResults(history, 'json');
        filename = `analysis_${Date.now()}.json`;
        mimeType = 'application/json';
      }

      this.downloadFile(content, filename, mimeType);
      this.showNotification('✓ Export réussi !', 'success');

    } catch (error) {
      console.error('Error exporting data:', error);
      this.showError('Erreur lors de l\'export');
    }
  }

  /**
   * Télécharge un fichier
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Applique un preset
   */
  applyPreset(presetName) {
    this.orchestrator.configManager.applyPreset(presetName);
    document.getElementById('preset-selector').value = presetName;
    this.showNotification('✓ Preset appliqué: ' + presetName, 'success');
    this.loadSettings();
  }

  /**
   * Exporte la config
   */
  exportConfig() {
    const config = this.orchestrator.configManager.exportConfig();
    const content = JSON.stringify(config, null, 2);
    this.downloadFile(content, `config_${Date.now()}.json`, 'application/json');
    this.showNotification('✓ Configuration exportée', 'success');
  }

  /**
   * Importe une config
   */
  importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target.result);
          this.orchestrator.configManager.importConfig(config);
          this.showNotification('✓ Configuration importée', 'success');
          this.loadSettings();
        } catch (error) {
          this.showError('Erreur lors de l\'import');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /**
   * Reset config
   */
  resetConfig() {
    if (confirm('Réinitialiser la configuration ?')) {
      this.orchestrator.configManager.reset();
      this.showNotification('✓ Configuration réinitialisée', 'success');
      this.loadSettings();
    }
  }

  /**
   * Helpers
   */
  getScoreColor(score) {
    if (score >= 4.5) return '#28a745';
    if (score >= 4) return '#17a2b8';
    if (score >= 3) return '#ffc107';
    return '#dc3545';
  }

  getScoreLevelClass(score) {
    if (score >= 4.5) return 'excellent';
    if (score >= 4) return 'good';
    if (score >= 3) return 'warning';
    return 'error';
  }

  getCategoryLabel(category) {
    const labels = {
      meta: 'Meta Tags',
      images: 'Images',
      headings: 'Titres',
      links: 'Liens',
      typography: 'Typographie',
      accessibility: 'Accessibilité',
      performance: 'Performance'
    };
    return labels[category] || category;
  }

  truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.toggle('active', show);
    }
  }

  showEmptyState() {
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-chart-line"></i>
          <h3>Aucune donnée</h3>
          <p>Lancez une analyse pour voir les statistiques</p>
        </div>
      `;
    }
  }

  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Implémenter un système de notifications toast
  }

  showError(message) {
    console.error(message);
    this.showNotification(message, 'error');
  }

  /**
   * Récupère la dernière analyse depuis IndexedDB
   */
  async getLastAnalysisFromDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open('db_datas_checker', 4);

      request.onsuccess = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('analyses')) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(['analyses'], 'readonly');
        const store = transaction.objectStore('analyses');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const analyses = getAllRequest.result;
          if (analyses.length > 0) {
            resolve(analyses[analyses.length - 1]);
          } else {
            resolve(null);
          }
        };

        getAllRequest.onerror = () => resolve(null);
      };

      request.onerror = () => resolve(null);
    });
  }

  /**
   * Sauvegarde une analyse dans IndexedDB
   */
  async saveAnalysisToDB(analysis) {
    return new Promise((resolve) => {
      const request = indexedDB.open('db_datas_checker', 4);

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['analyses'], 'readwrite');
        const store = transaction.objectStore('analyses');
        store.add(analysis);
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => resolve(false);
      };

      request.onerror = () => resolve(false);
    });
  }
}

// Initialiser le dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
  dashboard = new DashboardController();
});
