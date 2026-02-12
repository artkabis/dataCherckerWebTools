/**
 * Dashboard Controller v5.0
 * Exploite 100% des données collectées
 * Lazy loading des charts pour corriger le bug des onglets cachés
 * @version 5.0.0
 */

class DashboardV2 {
  constructor() {
    this.orchestrator = new AnalysisOrchestrator();
    this.currentAnalysis = null;
    this.charts = new Map(); // Charts par onglet
    this.chartsLoaded = new Set(); // Onglets avec charts déjà chargés
    this.init();
  }

  async init() {
    console.log('[Dashboard v5.0] Initializing...');

    // Initialiser l'orchestrateur
    await this.orchestrator.init();
    await this.orchestrator.loadHistoryFromStorage();

    // Setup event listeners
    this.setupEventListeners();

    // Charger les données initiales
    await this.loadInitialData();

    // Setup tabs navigation
    this.setupTabs();

    console.log('✓ Dashboard v5.0 initialized');
  }

  setupEventListeners() {
    // Preset & Profile selectors
    document.getElementById('preset-selector')?.addEventListener('change', (e) => {
      this.orchestrator.configManager.applyPreset(e.target.value);
      this.showNotification('Preset appliqué: ' + e.target.value);
    });

    document.getElementById('profile-selector')?.addEventListener('change', (e) => {
      this.orchestrator.configManager.applyProfile(e.target.value);
      this.showNotification('Profil appliqué: ' + e.target.value);
    });

    // New analysis button
    document.getElementById('new-analysis-btn')?.addEventListener('click', () => {
      this.startNewAnalysis();
    });

    // Export buttons
    document.getElementById('export-report-btn')?.addEventListener('click', () => {
      this.exportReport();
    });

    document.getElementById('export-csv')?.addEventListener('click', () => {
      this.exportData('csv');
    });

    document.getElementById('export-json')?.addEventListener('click', () => {
      this.exportData('json');
    });

    // Listen for analysis completion
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'analysisV5Complete') {
        this.handleAnalysisComplete(message.result);
      }
    });
  }

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
   * CORRECTION BUG: Lazy loading des charts au changement d'onglet
   */
  switchTab(tabName) {
    // Désactiver tous les tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // Activer le tab sélectionné
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(`tab-${tabName}`)?.classList.add('active');

    // CRITIQUE: Charger les charts de cet onglet si pas encore fait
    if (!this.chartsLoaded.has(tabName) && this.currentAnalysis) {
      this.renderTabCharts(tabName);
      this.chartsLoaded.add(tabName);
    }
  }

  /**
   * Charge les données initiales
   */
  async loadInitialData() {
    this.showLoading(true);

    try {
      // Récupérer l'URL depuis les paramètres
      const urlParams = new URLSearchParams(window.location.search);
      const pageUrl = urlParams.get('url');

      console.log('[Dashboard] Loading data for URL:', pageUrl);

      let analysisData = null;

      // Charger depuis chrome.storage.local (v5.0)
      if (pageUrl) {
        analysisData = await this.getAnalysisFromStorage(pageUrl);
      }

      // Fallback: dernière analyse depuis IndexedDB
      if (!analysisData) {
        analysisData = await this.getLastAnalysisFromDB();
      }

      if (analysisData) {
        this.currentAnalysis = analysisData;
        this.updateDashboard(analysisData);
        console.log('[Dashboard] Dashboard updated with analysis data');
      } else {
        console.warn('[Dashboard] No analysis data found');
        this.showEmptyState();
      }

      // Mettre à jour les sélecteurs
      document.getElementById('preset-selector').value = this.orchestrator.configManager.currentPreset;
      document.getElementById('profile-selector').value = this.orchestrator.configManager.currentProfile;

    } catch (error) {
      console.error('[Dashboard] Error loading data:', error);
      this.showError('Erreur de chargement des données');
    } finally {
      this.showLoading(false);
    }
  }

  async getAnalysisFromStorage(url) {
    try {
      const cacheKey = this.getCacheKey(url);
      const storageKey = `analysis_${cacheKey}`;

      const result = await chrome.storage.local.get(storageKey);

      if (result[storageKey]) {
        return result[storageKey].result;
      }

      return null;
    } catch (error) {
      console.error('[Dashboard] Error getting analysis from storage:', error);
      return null;
    }
  }

  getCacheKey(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  /**
   * Met à jour tout le dashboard
   */
  updateDashboard(analysis) {
    if (!analysis) return;

    // Afficher l'URL
    document.getElementById('current-url').textContent = analysis.url || 'N/A';

    // Vue d'ensemble (Overview)
    this.updateOverview(analysis);

    // Les autres onglets seront chargés via lazy loading
  }

  /**
   * Met à jour l'onglet Overview
   */
  updateOverview(analysis) {
    // Hero Score
    this.updateGlobalScore(analysis);

    // Category Scores Cards
    this.updateCategoryScores(analysis);

    // Critical Issues
    this.updateCriticalIssues(analysis);

    // Charger le radar chart (onglet visible par défaut)
    this.renderTabCharts('overview');
    this.chartsLoaded.add('overview');
  }

  updateGlobalScore(analysis) {
    const scoreValue = document.getElementById('global-score-value');
    const levelBadge = document.getElementById('global-level');
    const dateEl = document.getElementById('analysis-date');
    const durationEl = document.getElementById('analysis-duration');
    const testsPassedEl = document.getElementById('tests-passed');

    // Score global
    const score = analysis.globalScore || 0;
    scoreValue.textContent = score.toFixed(1) + '/5';

    // Level
    const level = analysis.level || this.getLevel(score);
    levelBadge.textContent = level;
    levelBadge.className = `score-level ${this.getLevelClass(score)}`;

    // Date
    const date = new Date(analysis.timestamp || Date.now());
    dateEl.textContent = date.toLocaleDateString('fr-FR');

    // Durée
    const duration = analysis.duration || 0;
    durationEl.textContent = duration > 0 ? `${(duration / 1000).toFixed(1)}s` : 'N/A';

    // Tests passed (calculer à partir des scores)
    const total = analysis.categoryScores?.length || 6;
    const passed = analysis.categoryScores?.filter(c => c.score >= 3).length || 0;
    testsPassedEl.textContent = `${passed}/${total}`;

    // Circular gauge
    this.createCircularGauge('global-gauge', score, 5, this.getScoreColor(score));
  }

  updateCategoryScores(analysis) {
    const grid = document.getElementById('category-scores-grid');
    if (!grid) return;

    const categories = analysis.categoryScores || [];

    grid.innerHTML = categories.map(cat => {
      const icon = this.getCategoryIcon(cat.category);
      const color = this.getScoreColor(cat.score);
      const label = this.getCategoryLabel(cat.category);

      return `
        <div class="stat-card">
          <div class="stat-icon" style="background: ${color}20; color: ${color};">
            <i class="${icon}"></i>
          </div>
          <div class="stat-value">${cat.score.toFixed(1)}<small>/5</small></div>
          <div class="stat-label">${label}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(cat.score / 5) * 100}%; background: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateCriticalIssues(analysis) {
    const container = document.getElementById('critical-issues-list');
    if (!container) return;

    const allIssues = [];

    // Collecter tous les issues critiques de tous les endpoints
    const analyses = analysis.analyses || {};
    Object.keys(analyses).forEach(endpoint => {
      const data = analyses[endpoint];
      if (data.issues && Array.isArray(data.issues)) {
        data.issues.forEach(issue => {
          if (issue.severity === 'high' || issue.severity === 'critical') {
            allIssues.push({
              ...issue,
              endpoint: this.getCategoryLabel(endpoint)
            });
          }
        });
      }
    });

    if (allIssues.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <i class="fas fa-check-circle"></i>
              <h3>Aucun problème critique</h3>
              <p>Votre site ne présente aucun problème critique !</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = allIssues.map(issue => `
      <div class="issue-card severity-${issue.severity}">
        <div class="issue-icon">${issue.severity === 'critical' ? '🔴' : '⚠️'}</div>
        <div class="issue-content">
          <div class="issue-title">${issue.message}</div>
          <div class="issue-description"><strong>${issue.endpoint}</strong></div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render charts pour un onglet spécifique (LAZY LOADING)
   */
  renderTabCharts(tabName) {
    if (!this.currentAnalysis) return;

    switch (tabName) {
      case 'overview':
        this.renderOverviewCharts();
        break;
      case 'seo':
        this.renderSEOTab();
        break;
      case 'images':
        this.renderImagesTab();
        break;
      case 'accessibility':
        this.renderAccessibilityTab();
        break;
      case 'performance':
        this.renderPerformanceTab();
        break;
      case 'settings':
        this.renderSettingsTab();
        break;
    }
  }

  renderOverviewCharts() {
    const analysis = this.currentAnalysis;

    // Radar Chart
    const radarCtx = document.getElementById('radar-chart');
    if (radarCtx && analysis.categoryScores) {
      this.destroyChart('overview-radar');

      const labels = analysis.categoryScores.map(c => this.getCategoryLabel(c.category));
      const data = analysis.categoryScores.map(c => c.score);

      const chart = new Chart(radarCtx, {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: 'Score',
            data,
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 5,
              ticks: {
                stepSize: 1
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });

      this.charts.set('overview-radar', chart);
    }
  }

  renderSEOTab() {
    const analysis = this.currentAnalysis.analyses || {};
    const meta = analysis.meta?.data || {};
    const headings = analysis.headings?.data || {};
    const links = analysis.links?.data || {};

    // Meta Tags
    this.renderMetaTags(meta, analysis.meta);

    // Headings
    this.renderHeadings(headings, analysis.headings);

    // Links
    this.renderLinks(links, analysis.links);
  }

  renderMetaTags(meta, metaAnalysis) {
    // Score badge
    const badge = document.getElementById('meta-score-badge');
    if (badge && metaAnalysis) {
      const score = metaAnalysis.score || 0;
      badge.textContent = score.toFixed(1) + '/5';
      badge.className = `score-badge ${this.getLevelClass(score)}`;
    }

    // Google Preview
    const preview = document.getElementById('meta-preview');
    if (preview) {
      const title = meta.title?.tag || 'Sans titre';
      const description = meta.description?.tag || 'Aucune description';
      const url = this.currentAnalysis.url || '';

      preview.innerHTML = `
        <div class="google-preview-title">${this.truncate(title, 60)}</div>
        <div class="google-preview-url">${url}</div>
        <div class="google-preview-description">${this.truncate(description, 160)}</div>
      `;
    }

    // Meta Details
    const details = document.getElementById('meta-details');
    if (details) {
      details.innerHTML = `
        <div class="meta-item">
          <span class="meta-item-label">Titre</span>
          <span class="meta-item-value">${meta.title?.length || 0} caractères ${this.getMetaStatusIcon(meta.title?.score)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Description</span>
          <span class="meta-item-value">${meta.description?.length || 0} caractères ${this.getMetaStatusIcon(meta.description?.score)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Keywords</span>
          <span class="meta-item-value">${meta.keywords?.count || 0} mots-clés</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Canonical</span>
          <span class="meta-item-value">${meta.canonical ? '✓ Oui' : '✗ Non'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Robots</span>
          <span class="meta-item-value">${meta.robots || 'N/A'}</span>
        </div>
      `;
    }

    // Open Graph
    const ogTags = document.getElementById('og-tags');
    if (ogTags) {
      const ogData = meta.ogTags || [];
      if (ogData.length > 0) {
        ogTags.innerHTML = ogData.map(tag => `
          <div class="meta-item">
            <span class="meta-item-label">${tag.property}</span>
            <span class="meta-item-value">${this.truncate(tag.content, 50)}</span>
          </div>
        `).join('');
      } else {
        ogTags.innerHTML = '<div class="empty-state"><p>Aucun Open Graph tag</p></div>';
      }
    }

    // Twitter Card
    const twitterTags = document.getElementById('twitter-tags');
    if (twitterTags) {
      const twitterData = meta.twitterCard || [];
      if (twitterData.length > 0) {
        twitterTags.innerHTML = twitterData.map(tag => `
          <div class="meta-item">
            <span class="meta-item-label">${tag.name}</span>
            <span class="meta-item-value">${this.truncate(tag.content, 50)}</span>
          </div>
        `).join('');
      } else {
        twitterTags.innerHTML = '<div class="empty-state"><p>Aucun Twitter Card tag</p></div>';
      }
    }
  }

  renderHeadings(headings, headingsAnalysis) {
    // Distribution Chart
    const headingsChart = document.getElementById('headings-chart');
    if (headingsChart) {
      this.destroyChart('headings-chart');

      const h1 = headings.h1 || 0;
      const h2 = headings.h2 || 0;
      const h3 = headings.h3 || 0;
      const h4 = headings.h4 || 0;
      const h5 = headings.h5 || 0;
      const h6 = headings.h6 || 0;

      const chart = new Chart(headingsChart, {
        type: 'bar',
        data: {
          labels: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
          datasets: [{
            label: 'Nombre de titres',
            data: [h1, h2, h3, h4, h5, h6],
            backgroundColor: [
              '#667eea',
              '#764ba2',
              '#48bb78',
              '#ed8936',
              '#f56565',
              '#4299e1'
            ],
            borderRadius: 8
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
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });

      this.charts.set('headings-chart', chart);
    }

    // Headings Tree
    const tree = document.getElementById('headings-tree');
    if (tree) {
      const structure = headings.structure || {};
      const isValid = structure.valid !== false;

      tree.innerHTML = `
        <div class="meta-item">
          <span class="meta-item-label">Structure valide</span>
          <span class="meta-item-value">${isValid ? '✓ Oui' : '✗ Non'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Total titres</span>
          <span class="meta-item-value">${headings.totalHeadings || 0}</span>
        </div>
        ${headingsAnalysis?.recommendations ? `
          <div style="margin-top: 1rem; padding: 1rem; background: #fff3cd; border-radius: 8px;">
            <strong>Recommandations:</strong>
            ${headingsAnalysis.recommendations.map(r => `<div>• ${r}</div>`).join('')}
          </div>
        ` : ''}
      `;
    }
  }

  renderLinks(links, linksAnalysis) {
    // Links Stats
    const statsContainer = document.getElementById('links-stats');
    if (statsContainer && links.summary) {
      const summary = links.summary;
      statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon" style="background: #667eea20; color: #667eea;">
            <i class="fas fa-link"></i>
          </div>
          <div class="stat-value">${summary.total || 0}</div>
          <div class="stat-label">Total liens</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #48bb7820; color: #48bb78;">
            <i class="fas fa-home"></i>
          </div>
          <div class="stat-value">${summary.internal || 0}</div>
          <div class="stat-label">Liens internes</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #4299e120; color: #4299e1;">
            <i class="fas fa-external-link-alt"></i>
          </div>
          <div class="stat-value">${summary.external || 0}</div>
          <div class="stat-label">Liens externes</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #ed893620; color: #ed8936;">
            <i class="fas fa-ban"></i>
          </div>
          <div class="stat-value">${links.nofollow || 0}</div>
          <div class="stat-label">Nofollow</div>
        </div>
      `;
    }

    // Links Chart (Donut)
    const linksChart = document.getElementById('links-chart');
    if (linksChart && links.summary) {
      this.destroyChart('links-chart');

      const chart = new Chart(linksChart, {
        type: 'doughnut',
        data: {
          labels: ['Internes', 'Externes'],
          datasets: [{
            data: [links.summary.internal || 0, links.summary.external || 0],
            backgroundColor: ['#48bb78', '#4299e1'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      this.charts.set('links-chart', chart);
    }

    // Links Issues
    const issuesContainer = document.getElementById('links-issues');
    if (issuesContainer) {
      const broken = links.broken || [];
      const duplicates = links.duplicates || [];

      if (broken.length === 0 && duplicates.length === 0) {
        issuesContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-check-circle"></i>
            <h3>Aucun problème</h3>
            <p>Tous les liens sont valides</p>
          </div>
        `;
      } else {
        issuesContainer.innerHTML = `
          ${broken.length > 0 ? `
            <div style="margin-bottom: 1rem;">
              <strong style="color: #f56565;">⚠️ ${broken.length} lien(s) cassé(s)</strong>
              ${broken.slice(0, 5).map(link => `<div style="margin-top: 0.5rem; padding: 0.5rem; background: #fff5f5; border-radius: 4px; font-size: 0.85rem;">${link}</div>`).join('')}
              ${broken.length > 5 ? `<div style="margin-top: 0.5rem; color: #718096;">... et ${broken.length - 5} autre(s)</div>` : ''}
            </div>
          ` : ''}
          ${duplicates.length > 0 ? `
            <div>
              <strong style="color: #ed8936;">ℹ️ ${duplicates.length} lien(s) en double</strong>
            </div>
          ` : ''}
        `;
      }
    }
  }

  renderImagesTab() {
    const analysis = this.currentAnalysis.analyses?.images || {};
    const data = analysis.data || {};

    // Images Stats
    this.renderImagesStats(data);

    // Charts
    this.renderImagesCharts(data);

    // Issues
    this.renderImagesIssues(analysis);
  }

  renderImagesStats(data) {
    const container = document.getElementById('images-stats');
    if (!container) return;

    const total = data.totalImages || 0;
    const withAlt = data.withAlt || 0;
    const withoutAlt = data.withoutAlt || 0;
    const optimized = data.optimized || 0;
    const lazy = data.lazy || 0;
    const responsive = data.responsive || 0;

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background: #667eea20; color: #667eea;">
          <i class="fas fa-image"></i>
        </div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total images</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: ${withAlt > 0 ? '#48bb78' : '#f56565'}20; color: ${withAlt > 0 ? '#48bb78' : '#f56565'};">
          <i class="fas fa-font"></i>
        </div>
        <div class="stat-value">${((withAlt / total) * 100).toFixed(0)}%</div>
        <div class="stat-label">Avec attribut alt</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #4299e120; color: #4299e1;">
          <i class="fas fa-compress"></i>
        </div>
        <div class="stat-value">${((optimized / total) * 100).toFixed(0)}%</div>
        <div class="stat-label">Optimisées</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #ed893620; color: #ed8936;">
          <i class="fas fa-shipping-fast"></i>
        </div>
        <div class="stat-value">${((lazy / total) * 100).toFixed(0)}%</div>
        <div class="stat-label">Lazy loading</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #764ba220; color: #764ba2;">
          <i class="fas fa-mobile-alt"></i>
        </div>
        <div class="stat-value">${((responsive / total) * 100).toFixed(0)}%</div>
        <div class="stat-label">Responsive</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #48bb7820; color: #48bb78;">
          <i class="fas fa-weight"></i>
        </div>
        <div class="stat-value">${this.formatBytes(data.avgFileSize || 0)}</div>
        <div class="stat-label">Taille moyenne</div>
      </div>
    `;
  }

  renderImagesCharts(data) {
    // Format Chart
    const formatChart = document.getElementById('images-format-chart');
    if (formatChart && data.format) {
      this.destroyChart('images-format-chart');

      const formats = data.format;
      const labels = Object.keys(formats);
      const values = Object.values(formats);
      const colors = ['#667eea', '#764ba2', '#48bb78', '#ed8936', '#4299e1'];

      const chart = new Chart(formatChart, {
        type: 'doughnut',
        data: {
          labels: labels.map(l => l.toUpperCase()),
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      this.charts.set('images-format-chart', chart);
    }

    // Optimization Chart
    const optChart = document.getElementById('images-optimization-chart');
    if (optChart) {
      this.destroyChart('images-optimization-chart');

      const total = data.totalImages || 1;
      const withAlt = data.withAlt || 0;
      const withoutAlt = data.withoutAlt || 0;
      const optimized = data.optimized || 0;
      const notOptimized = total - optimized;

      const chart = new Chart(optChart, {
        type: 'bar',
        data: {
          labels: ['Alt Text', 'Optimisation'],
          datasets: [{
            label: 'Conforme',
            data: [withAlt, optimized],
            backgroundColor: '#48bb78',
            borderRadius: 8
          }, {
            label: 'Non conforme',
            data: [withoutAlt, notOptimized],
            backgroundColor: '#f56565',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true
            },
            y: {
              stacked: true,
              beginAtZero: true
            }
          }
        }
      });

      this.charts.set('images-optimization-chart', chart);
    }
  }

  renderImagesIssues(analysis) {
    const container = document.getElementById('images-issues-list');
    if (!container) return;

    const issues = analysis.issues || [];
    const recommendations = analysis.recommendations || [];

    if (issues.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <i class="fas fa-check-circle"></i>
              <h3>Aucun problème détecté</h3>
              <p>Vos images sont bien optimisées !</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = issues.map(issue => `
      <div class="issue-card severity-${issue.severity || 'medium'}">
        <div class="issue-icon">${issue.severity === 'high' ? '⚠️' : 'ℹ️'}</div>
        <div class="issue-content">
          <div class="issue-title">${issue.message}</div>
        </div>
      </div>
    `).join('');

    if (recommendations.length > 0) {
      container.innerHTML += `
        <div class="card" style="margin-top: 1rem;">
          <div class="card-header">
            <h3><i class="fas fa-lightbulb"></i> Recommandations</h3>
          </div>
          <div class="card-body">
            ${recommendations.map(r => `<div style="padding: 0.5rem 0;">• ${r}</div>`).join('')}
          </div>
        </div>
      `;
    }
  }

  renderAccessibilityTab() {
    const analysis = this.currentAnalysis.analyses?.accessibility || {};
    const data = analysis.data || {};

    // WCAG Banner
    this.renderWCAGBanner(data);

    // Contrast Analysis
    this.renderContrastAnalysis(data.contrast);

    // ARIA & Semantics
    this.renderARIADetails(data.aria, data.semantics, data.keyboard);

    // Issues
    this.renderA11yIssues(analysis);
  }

  renderWCAGBanner(data) {
    const badge = document.getElementById('wcag-badge');
    const complianceEl = document.getElementById('wcag-compliance');
    const scoreEl = document.getElementById('a11y-score');

    if (badge) {
      const level = data.wcagLevel || 'AA';
      badge.querySelector('.badge-level').textContent = level;
    }

    if (complianceEl && data.contrast) {
      const aaPass = data.contrast.aaPass || 0;
      const total = data.contrast.totalElements || 1;
      const percentage = ((aaPass / total) * 100).toFixed(0);
      complianceEl.textContent = `${percentage}%`;
    }

    if (scoreEl && this.currentAnalysis.analyses?.accessibility) {
      const score = this.currentAnalysis.analyses.accessibility.score || 0;
      scoreEl.textContent = score.toFixed(1) + '/5';
    }
  }

  renderContrastAnalysis(contrast) {
    if (!contrast) return;

    // AA Gauge
    const aaGauge = document.getElementById('contrast-aa-gauge');
    if (aaGauge) {
      const aaPass = contrast.aaPass || 0;
      const total = contrast.totalElements || 1;
      const percentage = (aaPass / total) * 100;

      this.createCircularGauge('contrast-aa-gauge', percentage, 100, this.getScoreColor(percentage / 20));
    }

    // AA Details
    const aaDetails = document.getElementById('contrast-aa-details');
    if (aaDetails) {
      aaDetails.innerHTML = `
        <div class="meta-item" style="margin-top: 1rem;">
          <span class="meta-item-label">✓ Conforme</span>
          <span class="meta-item-value">${contrast.aaPass || 0}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">✗ Non conforme</span>
          <span class="meta-item-value">${contrast.aaFail || 0}</span>
        </div>
      `;
    }

    // AAA Gauge
    const aaaGauge = document.getElementById('contrast-aaa-gauge');
    if (aaaGauge) {
      const aaaPass = contrast.aaaPass || 0;
      const total = contrast.totalElements || 1;
      const percentage = (aaaPass / total) * 100;

      this.createCircularGauge('contrast-aaa-gauge', percentage, 100, this.getScoreColor(percentage / 20));
    }

    // AAA Details
    const aaaDetails = document.getElementById('contrast-aaa-details');
    if (aaaDetails) {
      aaaDetails.innerHTML = `
        <div class="meta-item" style="margin-top: 1rem;">
          <span class="meta-item-label">✓ Conforme</span>
          <span class="meta-item-value">${contrast.aaaPass || 0}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">✗ Non conforme</span>
          <span class="meta-item-value">${contrast.aaaFail || 0}</span>
        </div>
      `;
    }
  }

  renderARIADetails(aria, semantics, keyboard) {
    // ARIA
    const ariaContainer = document.getElementById('aria-details');
    if (ariaContainer && aria) {
      ariaContainer.innerHTML = `
        <div class="meta-item">
          <span class="meta-item-label">Total attributs</span>
          <span class="meta-item-value">${aria.total || 0}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">✓ Valides</span>
          <span class="meta-item-value" style="color: #48bb78;">${aria.valid || 0}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">✗ Invalides</span>
          <span class="meta-item-value" style="color: #f56565;">${aria.invalid || 0}</span>
        </div>
      `;
    }

    // Semantics
    const semanticsContainer = document.getElementById('semantics-details');
    if (semanticsContainer && semantics) {
      semanticsContainer.innerHTML = `
        <div class="meta-item">
          <span class="meta-item-label">Landmarks utilisés</span>
          <span class="meta-item-value">${semantics.landmarksUsed ? '✓ Oui' : '✗ Non'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Structure titres</span>
          <span class="meta-item-value">${semantics.headingStructure || 'N/A'}</span>
        </div>
        ${keyboard ? `
          <div class="meta-item">
            <span class="meta-item-label">Focus visible</span>
            <span class="meta-item-value">${keyboard.focusVisible ? '✓ Oui' : '✗ Non'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-item-label">Ordre tab</span>
            <span class="meta-item-value">${keyboard.tabOrder || 'N/A'}</span>
          </div>
        ` : ''}
      `;
    }
  }

  renderA11yIssues(analysis) {
    const container = document.getElementById('a11y-issues-list');
    if (!container) return;

    const issues = analysis.issues || [];

    if (issues.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <i class="fas fa-check-circle"></i>
              <h3>Aucun problème d'accessibilité</h3>
              <p>Votre site respecte les bonnes pratiques WCAG !</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = issues.map(issue => `
      <div class="issue-card severity-${issue.severity || 'medium'}">
        <div class="issue-icon">${issue.severity === 'high' ? '⚠️' : 'ℹ️'}</div>
        <div class="issue-content">
          <div class="issue-title">${issue.message}</div>
        </div>
      </div>
    `).join('');
  }

  renderPerformanceTab() {
    const analysis = this.currentAnalysis.analyses?.performance || {};
    const data = analysis.data || {};

    // Lighthouse Scores
    this.renderLighthouseScores(data.lighthouse);

    // Core Web Vitals
    this.renderCoreWebVitals(data.coreWebVitals);

    // Resources
    this.renderResources(data.resources);

    // Recommendations
    this.renderPerfRecommendations(analysis);
  }

  renderLighthouseScores(lighthouse) {
    if (!lighthouse) return;

    // Performance
    this.createCircularGauge('lighthouse-perf-gauge', lighthouse.performance || 0, 100, this.getScoreColor((lighthouse.performance || 0) / 20));

    // Accessibility
    this.createCircularGauge('lighthouse-a11y-gauge', lighthouse.accessibility || 0, 100, this.getScoreColor((lighthouse.accessibility || 0) / 20));

    // Best Practices
    this.createCircularGauge('lighthouse-bp-gauge', lighthouse.bestPractices || 0, 100, this.getScoreColor((lighthouse.bestPractices || 0) / 20));

    // SEO
    this.createCircularGauge('lighthouse-seo-gauge', lighthouse.seo || 0, 100, this.getScoreColor((lighthouse.seo || 0) / 20));
  }

  renderCoreWebVitals(vitals) {
    if (!vitals) return;

    // LCP
    const lcpCard = document.getElementById('lcp-card');
    const lcpValue = document.getElementById('lcp-value');
    if (lcpCard && lcpValue) {
      const lcp = vitals.LCP || 0;
      lcpValue.textContent = lcp.toFixed(1) + 's';
      lcpCard.className = 'vital-card ' + this.getVitalRating(lcp, 2.5, 4);
    }

    // FID
    const fidCard = document.getElementById('fid-card');
    const fidValue = document.getElementById('fid-value');
    if (fidCard && fidValue) {
      const fid = vitals.FID || 0;
      fidValue.textContent = fid.toFixed(0) + 'ms';
      fidCard.className = 'vital-card ' + this.getVitalRating(fid, 100, 300);
    }

    // CLS
    const clsCard = document.getElementById('cls-card');
    const clsValue = document.getElementById('cls-value');
    if (clsCard && clsValue) {
      const cls = vitals.CLS || 0;
      clsValue.textContent = cls.toFixed(3);
      clsCard.className = 'vital-card ' + this.getVitalRating(cls, 0.1, 0.25);
    }
  }

  renderResources(resources) {
    if (!resources) return;

    // Chart
    const chart = document.getElementById('resources-chart');
    if (chart) {
      this.destroyChart('resources-chart');

      const chartInstance = new Chart(chart, {
        type: 'doughnut',
        data: {
          labels: ['Scripts', 'Styles', 'Images', 'Autres'],
          datasets: [{
            data: [
              resources.scripts || 0,
              resources.styles || 0,
              resources.images || 0,
              (resources.requests || 0) - ((resources.scripts || 0) + (resources.styles || 0) + (resources.images || 0))
            ],
            backgroundColor: ['#667eea', '#764ba2', '#48bb78', '#ed8936'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      this.charts.set('resources-chart', chartInstance);
    }

    // Stats
    const stats = document.getElementById('resources-stats');
    if (stats) {
      stats.innerHTML = `
        <div class="meta-item">
          <span class="meta-item-label">Taille totale</span>
          <span class="meta-item-value">${this.formatBytes(resources.totalSize || 0)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Requêtes</span>
          <span class="meta-item-value">${resources.requests || 0}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Scripts</span>
          <span class="meta-item-value">${resources.scripts || 0}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Styles</span>
          <span class="meta-item-value">${resources.styles || 0}</span>
        </div>
        <div class="meta-item">
          <span class="meta-item-label">Images</span>
          <span class="meta-item-value">${resources.images || 0}</span>
        </div>
      `;
    }
  }

  renderPerfRecommendations(analysis) {
    const container = document.getElementById('perf-recommendations');
    if (!container) return;

    const recommendations = analysis.recommendations || [];

    if (recommendations.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <i class="fas fa-check-circle"></i>
              <h3>Aucune recommandation</h3>
              <p>Vos performances sont excellentes !</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = recommendations.map(rec => {
      const impact = rec.impact || 'medium';
      const severity = impact === 'high' ? 'high' : impact === 'low' ? 'low' : 'medium';

      return `
        <div class="issue-card severity-${severity}">
          <div class="issue-icon">${impact === 'high' ? '⚠️' : 'ℹ️'}</div>
          <div class="issue-content">
            <div class="issue-title">${rec.message || rec}</div>
            <div class="issue-description">Impact: <strong>${impact.toUpperCase()}</strong></div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderSettingsTab() {
    const container = document.getElementById('settings-manager');
    if (!container) return;

    const presets = Object.keys(ConfigurationManager.PRESETS);
    const currentPreset = this.orchestrator.configManager.currentPreset;

    container.innerHTML = `
      <div style="padding: 20px;">
        <h4>Preset actuel: ${currentPreset}</h4>
        <p style="color: #718096; margin-top: 10px;">Configurez les paramètres d'analyse selon vos besoins</p>

        <div style="margin-top: 30px;">
          <h5 style="margin-bottom: 15px;">Presets disponibles</h5>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${presets.map(preset => `
              <button
                class="btn-small"
                onclick="dashboard.applyPreset('${preset}')"
              >
                ${ConfigurationManager.PRESETS[preset].name}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="margin-top: 30px;">
          <h5 style="margin-bottom: 15px;">Actions</h5>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn-small" onclick="dashboard.exportConfig()">
              <i class="fas fa-download"></i> Exporter configuration
            </button>
            <button class="btn-small" onclick="dashboard.importConfig()">
              <i class="fas fa-upload"></i> Importer configuration
            </button>
            <button class="btn-small" onclick="dashboard.resetConfig()">
              <i class="fas fa-redo"></i> Réinitialiser
            </button>
          </div>
        </div>
      </div>
    `;

    // History Chart
    this.renderHistoryChart();
  }

  renderHistoryChart() {
    const chart = document.getElementById('history-chart');
    const list = document.getElementById('history-list');

    if (!chart) return;

    const history = this.orchestrator.getHistory(50);

    if (history.length === 0) {
      if (list) {
        list.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-history"></i>
            <h3>Aucun historique</h3>
          </div>
        `;
      }
      return;
    }

    // Chart
    this.destroyChart('history-chart');

    const data = history.reverse().map(item => ({
      x: new Date(item.timestamp),
      y: item.globalScore
    }));

    const chartInstance = new Chart(chart, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Score Global',
          data,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
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

    this.charts.set('history-chart', chartInstance);

    // List
    if (list) {
      list.innerHTML = history.reverse().map(item => {
        const level = this.getLevelClass(item.globalScore);
        const date = new Date(item.timestamp).toLocaleString('fr-FR');

        return `
          <div class="history-item ${level}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <strong>${this.truncate(item.url, 60)}</strong>
                <div style="color: #718096; font-size: 0.85rem; margin-top: 5px;">
                  ${date}
                </div>
              </div>
              <div class="score-badge ${level}" style="width: auto; height: auto; min-width: 60px; padding: 8px 16px;">
                ${item.globalScore.toFixed(1)}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  /**
   * Circular Gauge Creation
   */
  createCircularGauge(containerId, value, max, color) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const percentage = (value / max) * 100;
    const circumference = 2 * Math.PI * 54; // radius = 54
    const offset = circumference - (percentage / 100) * circumference;

    container.innerHTML = `
      <svg width="150" height="150">
        <circle class="gauge-bg" cx="75" cy="75" r="54"></circle>
        <circle class="gauge-fill" cx="75" cy="75" r="54"
          stroke="${color}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="gauge-text" style="color: ${color};">${value.toFixed(0)}</div>
    `;
  }

  /**
   * Destroy chart to prevent memory leaks
   */
  destroyChart(chartId) {
    if (this.charts.has(chartId)) {
      this.charts.get(chartId).destroy();
      this.charts.delete(chartId);
    }
  }

  /**
   * Helper functions
   */
  getScoreColor(score) {
    if (score >= 4.5) return '#48bb78'; // success
    if (score >= 4) return '#4299e1'; // info
    if (score >= 3) return '#ed8936'; // warning
    return '#f56565'; // error
  }

  getLevelClass(score) {
    if (score >= 4.5) return 'excellent';
    if (score >= 4) return 'good';
    if (score >= 3) return 'warning';
    return 'error';
  }

  getLevel(score) {
    if (score >= 4.5) return 'A+';
    if (score >= 4) return 'A';
    if (score >= 3) return 'B';
    if (score >= 2) return 'C';
    return 'D';
  }

  getCategoryIcon(category) {
    const icons = {
      meta: 'fas fa-tags',
      images: 'fas fa-image',
      headings: 'fas fa-heading',
      links: 'fas fa-link',
      accessibility: 'fas fa-universal-access',
      performance: 'fas fa-tachometer-alt'
    };
    return icons[category] || 'fas fa-chart-bar';
  }

  getCategoryLabel(category) {
    const labels = {
      meta: 'Meta Tags',
      images: 'Images',
      headings: 'Titres',
      links: 'Liens',
      accessibility: 'Accessibilité',
      performance: 'Performance'
    };
    return labels[category] || category;
  }

  getMetaStatusIcon(score) {
    if (!score) return '';
    if (score >= 4) return '✓';
    if (score >= 3) return '⚠️';
    return '✗';
  }

  getVitalRating(value, good, poor) {
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  truncate(str, maxLength) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      if (show) {
        loading.classList.add('active');
      } else {
        loading.classList.remove('active');
      }
    }
  }

  showEmptyState() {
    const overview = document.getElementById('tab-overview');
    if (overview) {
      overview.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <i class="fas fa-chart-line"></i>
              <h3>Aucune donnée</h3>
              <p>Lancez une analyse pour voir les résultats</p>
              <button class="btn-action" style="margin-top: 20px;" onclick="dashboard.startNewAnalysis()">
                <i class="fas fa-plus"></i> Nouvelle analyse
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Toast notifications
  }

  showError(message) {
    console.error(message);
    this.showNotification(message, 'error');
  }

  /**
   * Actions
   */
  async startNewAnalysis() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        this.showError('Impossible de récupérer l\'URL de la page');
        return;
      }

      this.showLoading(true);

      chrome.runtime.sendMessage({
        action: 'analyzePageV5',
        tabId: tab.id
      });

    } catch (error) {
      console.error('Error starting analysis:', error);
      this.showError('Erreur lors du démarrage de l\'analyse');
      this.showLoading(false);
    }
  }

  async handleAnalysisComplete(result) {
    this.showLoading(false);
    this.showNotification('✓ Analyse terminée !', 'success');

    // Recharger les données
    await this.loadInitialData();
  }

  applyPreset(presetName) {
    this.orchestrator.configManager.applyPreset(presetName);
    document.getElementById('preset-selector').value = presetName;
    this.showNotification('✓ Preset appliqué: ' + presetName, 'success');
    this.renderSettingsTab();
  }

  exportConfig() {
    const config = this.orchestrator.configManager.exportConfig();
    const content = JSON.stringify(config, null, 2);
    this.downloadFile(content, `config_${Date.now()}.json`, 'application/json');
    this.showNotification('✓ Configuration exportée', 'success');
  }

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
          this.renderSettingsTab();
        } catch (error) {
          this.showError('Erreur lors de l\'import');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  resetConfig() {
    if (confirm('Réinitialiser la configuration ?')) {
      this.orchestrator.configManager.reset();
      this.showNotification('✓ Configuration réinitialisée', 'success');
      this.renderSettingsTab();
    }
  }

  exportData(format) {
    const history = this.orchestrator.getHistory();

    if (history.length === 0) {
      this.showError('Aucune donnée à exporter');
      return;
    }

    try {
      let content, filename, mimeType;

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

  exportReport() {
    if (!this.currentAnalysis) {
      this.showError('Aucune analyse à exporter');
      return;
    }

    const content = JSON.stringify(this.currentAnalysis, null, 2);
    this.downloadFile(content, `report_${Date.now()}.json`, 'application/json');
    this.showNotification('✓ Rapport exporté', 'success');
  }

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
   * IndexedDB fallback
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
}

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
  dashboard = new DashboardV2();
});
