"use strict";

import { createDB } from "./Functions/createIndexDB.js";
import { SitemapAnalyzer } from "./Functions/sitemapAnalyzer.js";
import { CONFIG, initConfig } from "./config.js";

// ==================== STATE MANAGEMENT ====================

// Application state
const state = {
  config: null,
  sitemapAnalyzer: null,
  user: null,
  allTabs: [],
  globalData: {},
  dbName: "db_datas_checker",
  processStep: 0,
  cors: {
    isEnabled: false,
    scanInProgress: false
  }
};
function sendMessagePromise(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}
// Process step management
const ProcessStepManager = {
  async get() {
    const result = await chrome.storage.local.get(['processStep']);
    return result.processStep || 0;
  },

  async increment() {
    const currentStep = await this.get();
    const newStep = currentStep + 1;
    await chrome.storage.local.set({ 'processStep': newStep });
    console.log(`Process step incremented: ${currentStep} -> ${newStep}`);
    return newStep;
  },

  async reset() {
    console.log("Resetting process step");
    await chrome.storage.local.set({ 'processStep': 0 });
    return 0;
  },

  async validate() {
    const step = await this.get();
    if (step > 2) {
      console.warn(`Inconsistent process step (${step}), forced reset`);
      return await this.reset();
    }
    return step;
  }
};

// ==================== INITIALIZATION ====================

// Main initialization function
const initialize = async () => {
  // Reset process step at startup
  await ProcessStepManager.reset();

  // Initialize configuration
  state.config = await initConfig();
  console.log("Configuration initialized:", state.config);

  // Setup CORS lifecycle
  CORSManager.setupLifecycle();

  // Detect Soprod tabs at startup
  await detectTabsAndInterfaces();
};

// Initialize immediately
initialize();

// ==================== RESOURCE CACHING ====================

// List of resources to cache
const resourcesToCache = [
  "./popup.html",
  "./popup.js",
  "./config.js",
  "./interface.html",
  "./service_worker.js",
  // Icons
  "./icons/github-mark-white.png",
  "./icons/hn-icon.png",
  "./icons/icon-soprod.JPG",
  "./icons/merciAppIcon.JPG",
  "./icons/sitemap.png",
  "./icons/HCW-logo-128.png",
  "./icons/HCW-logo-16.png",
  "./icons/HCW-logo-48.png",
  "./icons/SofixedMenu-520.png",
  "./icons/soprod.png",
  // Rulesets
  "./rulesets/allow-credentials.json",
  // Assets
  "./assets/canvas-confetti.mjs",
  "./assets/console.image.min.js",
  "./assets/htmx.min.js",
  "./assets/jquery-3.6.4.min.js",
  // Interface icons
  "./interface_icons/note_1.png",
  "./interface_icons/note_2.png",
  "./interface_icons/note_3.png",
  "./interface_icons/note_4.png",
  "./interface_icons/note_5.png",
  // Function modules
  "./Functions/checkAltImages.js",
  "./Functions/checkAndAddJquery.js",
  "./Functions/checkBold.js",
  "./Functions/checkColorContrast.js",
  "./Functions/checkDataBindingDuda.js",
  "./Functions/checkLinkAndImages.js",
  "./Functions/checkMetas.js",
  "./Functions/checkOutlineHn.js",
  "./Functions/copyExpressionsSoprod.js",
  "./Functions/counterLettersHn.js",
  "./Functions/counterWords.js",
  "./Functions/createIndexDB.js",
  "./Functions/dataCheckerSchema.js",
  "./Functions/detectOnotherInterface.js",
  "./Functions/DudaSitemap.js",
  "./Functions/HnOutlineValidity.js",
  "./Functions/initDataChecker.js",
  "./Functions/initLighthouse.js",
  "./Functions/richResultGoogle.js",
  "./Functions/settingsWords.js",
  "./Functions/toggleDesignMode.js",
  "./Functions/utils.js",
  "./Functions/wordsCountLexical.js",
];

// Function to cache a resource
const cacheResource = (url) => {
  fetch(url)
    .then((response) => {
      if (response.ok) return response.text();
      throw new Error("Resource retrieval failed.");
    })
    .then((data) => {
      chrome.storage.local.set({ [url]: data }, () => {
        console.log(`Resource cached: ${url}`);
      });
    })
    .catch((error) => {
      console.error(`Error caching resource ${url}:`, error);
    });
};

// ==================== CORS MANAGEMENT ====================

// CORS Manager
const CORSManager = {
  // HTTP methods constants
  DEFAULT_METHODS: [
    "GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS", "PATCH",
    "PROPFIND", "PROPPATCH", "MKCOL", "COPY", "MOVE", "LOCK",
  ],

  DEFAULT_STATUS_METHODS: [
    "GET", "POST", "PUT", "OPTIONS", "PATCH", "PROPFIND", "PROPPATCH",
  ],

  // Core ruleset functions
  core: {
    "overwrite-origin": (isEnabled) => CORSManager.updateRules("overwrite-origin", isEnabled)
    // Other rules can be uncommented as needed
    /*
    'csp': (isEnabled) => CORSManager.updateRules('csp', isEnabled),
    'allow-shared-array-buffer': (isEnabled) => CORSManager.updateRules('allow-shared-array-buffer', isEnabled),
    'x-frame': (isEnabled) => CORSManager.updateRules('x-frame', isEnabled),
    'allow-credentials': (isEnabled) => CORSManager.updateRules('allow-credentials', isEnabled),
    'allow-headers': (isEnabled) => CORSManager.updateRules('allow-headers', isEnabled),
    'referer': (isEnabled) => CORSManager.updateRules('referer', isEnabled),
    */
  },

  // État amélioré avec compteur de référence
  _state: {
    isEnabled: false,
    refCount: 0,
    activeScans: new Set(),
    scanInProgress: false,
    lastActionTimestamp: 0
  },

  // Activer CORS avec référence
  async enable(scanId = null) {
    this._state.lastActionTimestamp = Date.now();

    // Ajouter une référence
    this._state.refCount++;

    // Ajouter l'ID du scan s'il est fourni
    if (scanId) {
      this._state.activeScans.add(scanId);
    }

    console.log(`CORS enable called. RefCount: ${this._state.refCount}, ActiveScans: ${this._state.activeScans.size}`);

    // Activer CORS seulement s'il n'est pas déjà activé
    if (!this._state.isEnabled) {
      this._state.scanInProgress = true;
      await chrome.storage.sync.set({ corsEnabled: true });
      this._state.isEnabled = true;

      const ruleNames = ["overwrite-origin"];
      for (const ruleName of ruleNames) {
        await this.updateRules(ruleName, true);
        console.log(`CORS rule ${ruleName} enabled`);
      }

      console.log(`CORS enabled for scanning. RefCount: ${this._state.refCount}`);
    }

    // Synchroniser l'état avec state.cors
    state.cors.isEnabled = this._state.isEnabled;
    state.cors.scanInProgress = this._state.scanInProgress;
    state.cors.refCount = this._state.refCount;

    // Petit délai pour s'assurer que les règles sont appliquées
    return new Promise(resolve => setTimeout(resolve, 200));
  },

  // Désactiver CORS avec gestion des références
  async disable(scanId = null) {
    this._state.lastActionTimestamp = Date.now();

    // Réduire le compteur de référence
    if (this._state.refCount > 0) {
      this._state.refCount--;
    }

    // Supprimer l'ID du scan s'il est fourni
    if (scanId && this._state.activeScans.has(scanId)) {
      this._state.activeScans.delete(scanId);
    }

    console.log(`CORS disable called. RefCount: ${this._state.refCount}, ActiveScans: ${this._state.activeScans.size}`);

    // Désactiver CORS seulement si toutes les références sont libérées
    if (this._state.isEnabled && this._state.refCount === 0 && this._state.activeScans.size === 0) {
      await chrome.storage.sync.set({ corsEnabled: false });
      this._state.isEnabled = false;
      this._state.scanInProgress = false;

      const ruleNames = ["overwrite-origin"];
      for (const ruleName of ruleNames) {
        await this.updateRules(ruleName, false);
        console.log(`CORS rule ${ruleName} disabled`);
      }

      console.log(`CORS disabled after all scans complete`);

      // Force disable une seconde fois pour plus de certitude
      setTimeout(() => this.forceDisable(), 300);
    }

    // Synchroniser l'état avec state.cors
    state.cors.isEnabled = this._state.isEnabled;
    state.cors.scanInProgress = this._state.scanInProgress;
    state.cors.refCount = this._state.refCount;

    return Promise.resolve();
  },

  // Obtenir l'état actuel des CORS
  getState() {
    return {
      isEnabled: this._state.isEnabled,
      refCount: this._state.refCount,
      activeScans: Array.from(this._state.activeScans),
      scanInProgress: this._state.scanInProgress,
      lastActionTimestamp: this._state.lastActionTimestamp
    };
  },

  // Force disable CORS (garantie supplémentaire)
  forceDisable() {
    const ruleNames = ["overwrite-origin"];
    ruleNames.forEach(rule => {
      chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: [rule]
      })
        .then(() => console.log(`Forced disable of rule '${rule}' successful`))
        .catch(error => console.error(`Error during forced disable of '${rule}':`, error));
    });

    // Réinitialiser complètement l'état
    this._state.isEnabled = false;
    this._state.refCount = 0;
    this._state.activeScans.clear();
    this._state.scanInProgress = false;

    // Synchroniser l'état avec state.cors
    state.cors.isEnabled = false;
    state.cors.scanInProgress = false;

    console.log("CORS force disabled - all state reset");
  },

  // Mettre à jour les règles CORS (remplace toggle)
  async updateRules(rule, enable) {
    console.log("updateCORSRules:", { rule, enable });

    try {
      await chrome.declarativeNetRequest.updateEnabledRulesets(
        enable
          ? { enableRulesetIds: [rule] }
          : { disableRulesetIds: [rule] }
      );
      console.log(`Rule '${rule}' ${enable ? 'enabled' : 'disabled'} successfully`);
      return true;
    } catch (error) {
      console.error(`Error updating rule '${rule}':`, error);
      return false;
    }
  },

  // Exécuter une tâche avec gestion sécurisée des CORS
  async runWithSafe(taskFunction, scanId = `scan-${Date.now()}`) {
    try {
      // Activer CORS avant la tâche
      await this.enable(scanId);
      console.log(`Task ${scanId} started with CORS enabled`);

      // Exécuter la fonction passée en paramètre
      const result = await taskFunction();
      return result;
    } catch (error) {
      console.error(`Error during task ${scanId} execution:`, error);
      throw error;
    } finally {
      // Désactiver CORS dans tous les cas, même en cas d'erreur
      await this.disable(scanId);
      console.log(`Task ${scanId} completed, CORS reference released`);
    }
  },

  // Initialiser l'état des CORS au démarrage
  initState() {
    chrome.storage.sync.get("corsEnabled", (result) => {
      // Par défaut, on désactive les CORS au démarrage par sécurité
      const shouldBeEnabled = false;

      if (result.corsEnabled !== shouldBeEnabled) {
        chrome.storage.sync.set({ corsEnabled: shouldBeEnabled });
      }

      this._state.isEnabled = shouldBeEnabled;
      this._state.refCount = 0;
      this._state.activeScans.clear();
      this._state.scanInProgress = false;

      // Synchroniser l'état avec state.cors
      state.cors.isEnabled = shouldBeEnabled;
      state.cors.scanInProgress = false;

      const ruleNames = ["overwrite-origin"];
      ruleNames.forEach((ruleName) => {
        this.updateRules(ruleName, shouldBeEnabled);
      });

      console.log("CORS state initialized:", shouldBeEnabled);
    });
  },

  // Gestionnaire de messages pour la gestion des CORS
  messageHandler(request, sender, sendResponse) {
    // Activer/désactiver CORS
    if (request.corsEnabled !== undefined) {
      if (request.corsEnabled) {
        this.enable(request.scanId || null).then(() => {
          sendResponse && sendResponse({
            success: true,
            corsState: this.getState()
          });
        });
      } else {
        this.disable(request.scanId || null).then(() => {
          sendResponse && sendResponse({
            success: true,
            corsState: this.getState()
          });
        });
      }
      return true;
    }

    // Obtenir l'état des CORS
    if (request.action === 'getCORSStatus') {
      sendResponse(this.getState());
      return true;
    }

    return false; // Indique que ce gestionnaire n'a pas traité le message
  },

  // Configurer le cycle de vie pour la gestion des CORS
  setupLifecycle() {
    // Initialiser les CORS au démarrage
    this.initState();

    // S'assurer que les CORS sont désactivés lorsque l'extension est suspendue
    chrome.runtime.onSuspend.addListener(() => {
      console.log("Extension being suspended, forced CORS disable");
      this.forceDisable();
    });

    // Vérifier périodiquement si les CORS sont activés sans scan actif
    setInterval(() => {
      if (this._state.isEnabled && this._state.refCount === 0 && this._state.activeScans.size === 0) {
        const idleTime = Date.now() - this._state.lastActionTimestamp;
        // Si inactif depuis plus de 60 secondes, forcer la désactivation
        if (idleTime > 60000) {
          console.warn(`CORS has been enabled without active scans for ${idleTime}ms, forcing disable`);
          this.forceDisable();
        }
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }
};
// ==================== SCRIPT INJECTION & ANALYSIS ====================

// Analyzer Module
const Analyzer = {
  // Inject scripts for page analysis
  async injectScriptsForAnalysis(tabId) {
    if (!tabId) {
      console.error("Error: tabId is required to inject scripts");
      return Promise.reject(new Error("No tabId provided"));
    }

    const analysisId = `page-analysis-${Date.now()}`;
    console.log(`Injecting analysis scripts into tab ${tabId}, analysisId: ${analysisId}`);

    // Activer explicitement CORS pour cette analyse
    await CORSManager.enable(analysisId);

    return new Promise((resolve, reject) => {
      let scriptsInjected = false;
      let analysisComplete = false;

      // Premier ensemble de scripts
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: [
            "./assets/jquery-3.6.4.min.js",
            "./Functions/clear.js",
            "./assets/console.image.min.js",
            "./Functions/checkAndAddJquery.js",
            "./Functions/settingsOptions.js",
          ],
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error("Error during script injection:", chrome.runtime.lastError);
            CORSManager.disable(analysisId);
            reject(chrome.runtime.lastError);
            return;
          }

          console.log(`First set of scripts injected successfully for ${analysisId}`);

          // Petit délai avant d'injecter le second ensemble
          setTimeout(() => {
            chrome.scripting.executeScript(
              {
                target: { tabId: tabId },
                files: [
                  "./Functions/settingsWords.js",
                  "./Functions/dataCheckerSchema.js",
                  "./Functions/initLighthouse.js",
                  "./Functions/counterWords.js",
                  "./Functions/checkAltImages.js",
                  "./Functions/checkMetas.js",
                  "./Functions/checkLogoHeader.js",
                  "./Functions/checkOldRGPD.js",
                  "./Functions/checkBold.js",
                  "./Functions/checkOutlineHn.js",
                  "./Functions/checkColorContrast.js",
                  "./Functions/counterLettersHn.js",
                  "./Functions/initDataChecker.js",
                  "./Functions/checkDataBindingDuda.js",
                  "./Functions/checkLinkAndImages.js",
                ],
              },
              (secondInjectionResults) => {
                if (chrome.runtime.lastError) {
                  console.error("Error during second set script injection:", chrome.runtime.lastError);
                  CORSManager.disable(analysisId);
                  reject(chrome.runtime.lastError);
                } else {
                  console.log(`Second set of scripts injected successfully for ${analysisId}`);
                  scriptsInjected = true;

                  // Si l'analyse est déjà terminée, résoudre maintenant
                  if (analysisComplete) {
                    CORSManager.disable(analysisId);
                    resolve();
                  }
                }
              }
            );
          }, 100); // Délai légèrement augmenté
        }
      );

      // Écouter l'événement de fin d'analyse
      const messageListener = (message) => {
        if (message.action === 'dataCheckerAnalysisComplete') {
          console.log(`Analysis complete event received for ${analysisId}`);
          analysisComplete = true;

          // Si les scripts sont injectés, c'est terminé
          if (scriptsInjected) {
            chrome.runtime.onMessage.removeListener(messageListener);

            // Désactiver CORS après un délai pour s'assurer que toutes les requêtes sont terminées
            setTimeout(() => {
              CORSManager.disable(analysisId);
              console.log(`CORS disabled after page analysis completion ${analysisId}`);
              resolve();
            }, 2000);
          }
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      // Timeout de sécurité (augmenté à 30s)
      setTimeout(() => {
        if (!analysisComplete) {
          console.warn(`Timeout reached for analysis ${analysisId}, force completing`);
          chrome.runtime.onMessage.removeListener(messageListener);
          CORSManager.disable(analysisId);
          // On résout quand même pour éviter de bloquer
          resolve();
        }
      }, 15000);
    });
  },

  // Start analysis with secure CORS handling
  async startAnalysis(source, mode = 'sitemap') {
    // Générer un ID unique pour cette analyse
    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      console.log(`Starting analysis in ${mode} mode, ID: ${analysisId}`);

      // Réinitialiser les états d'analyse
      await chrome.storage.local.set({
        'linksAnalysisComplete': false
      });

      // Créer l'analyseur avec options améliorées
      state.sitemapAnalyzer = new SitemapAnalyzer({
        batchSize: 3,
        pauseBetweenBatches: 750, // Augmenter pour réduire la charge
        tabTimeout: 45000,        // Augmenter pour les pages lentes
        maxRetries: 2,
        analysisId: analysisId    // Transmettre l'ID d'analyse
      });

      // Configurer les écouteurs d'événements
      this.setupAnalyzerListeners(analysisId);

      // Activer CORS explicitement avant l'analyse
      await CORSManager.enable(analysisId);
      console.log(`CORS explicitly enabled for analysis ${analysisId}`);

      try {
        // Démarrer l'analyse
        let results;
        if (mode === 'urlList' && Array.isArray(source)) {
          console.log(`Starting analysis of ${source.length} URLs with ID ${analysisId}`);
          results = await state.sitemapAnalyzer.startWithUrlList(source);
        } else {
          console.log(`Starting sitemap analysis: ${source} with ID ${analysisId}`);
          results = await state.sitemapAnalyzer.start(source);
        }

        // Stocker les résultats
        await chrome.storage.local.set({ 'sitemapAnalysis': results });
        console.log(`Analysis ${analysisId} completed successfully`);

        return results;
      } finally {
        // S'assurer que CORS est désactivé à la fin, même en cas d'erreur
        await CORSManager.disable(analysisId);
        console.log(`CORS explicitly disabled after analysis ${analysisId}`);
      }

    } catch (error) {
      console.error(`Error starting analysis ${analysisId}:`, error);
      state.sitemapAnalyzer = null;

      // S'assurer que CORS est désactivé en cas d'erreur
      await CORSManager.disable(analysisId);
      console.log(`CORS disabled after analysis error ${analysisId}`);

      throw error;
    }
  },

  // Mettre à jour la fonction setupAnalyzerListeners pour utiliser l'ID d'analyse
  setupAnalyzerListeners(analysisId) {
    // Écouteur de progression
    state.sitemapAnalyzer.on('progress', (progress) => {
      // Ajouter l'ID d'analyse aux informations de progression
      progress.analysisId = analysisId;

      // Diffuser la progression à toutes les pages d'analyse ouvertes
      chrome.runtime.sendMessage({
        action: 'analysisProgress',
        progress: progress
      });
    });

    // Écouteur d'état d'analyse de liens
    state.sitemapAnalyzer.on('linksAnalysisStatus', (status) => {
      // Ajouter l'ID d'analyse aux informations d'état
      status.analysisId = analysisId;

      // Diffuser l'état d'analyse des liens
      chrome.runtime.sendMessage({
        action: 'linksAnalysisStatus',
        status: status
      });

      // Si l'analyse des liens est terminée, stocker l'état
      if (status.completed) {
        chrome.storage.local.set({
          'linksAnalysisComplete': true,
          'linksAnalysisId': analysisId
        });
      }
    });

    // Écouteur d'achèvement
    state.sitemapAnalyzer.on('complete', async (results) => {
      // Ajouter l'ID d'analyse aux résultats
      results.analysisId = analysisId;

      // Journaliser les résultats complets
      console.log(`Complete results for analysis ${analysisId} before saving:`, results);

      // Vérifier spécifiquement les données de liens
      let totalLinks = 0;
      let totalPages = 0;

      Object.entries(results.results).forEach(([url, data]) => {
        totalPages++;
        if (data.link_check && Array.isArray(data.link_check.link)) {
          totalLinks += data.link_check.link.length;
          console.log(`Page ${url}: ${data.link_check.link.length} links`);
        }
      });

      console.log(`Analysis ${analysisId} complete: ${totalPages} pages, ${totalLinks} links`);

      // Sauvegarder les résultats
      await chrome.storage.local.set({
        'sitemapAnalysis': results,
        'analysisCompleteId': analysisId,
        'analysisCompleteTime': Date.now()
      });

      // Vérifier si toutes les analyses sont terminées
      this.checkAllAnalysesComplete(results);

      // Libérer explicitement la référence CORS
      await CORSManager.disable(analysisId);
      console.log(`CORS explicitly disabled after analysis completion ${analysisId}`);

      state.sitemapAnalyzer = null; // Libérer la référence
    });
  },

  // Check if all analyses are complete
  checkAllAnalysesComplete(results) {
    chrome.storage.local.get(['linksAnalysisComplete'], (data) => {
      const allComplete = (data.linksAnalysisComplete) ||
        (results && results.analysisComplete === true);

      if (allComplete) {
        console.log('All analyses are complete');

        // Retrieve and combine analysis results
        chrome.storage.local.get(['sitemapAnalysis', 'linksAnalysisResults'], (results) => {
          // Enrich site analysis results with link results
          if (results.sitemapAnalysis && results.linksAnalysisResults) {
            console.log('Enriching results with link data');
            // You can implement result merging logic here
          }

          // End of all analyses notification
          chrome.runtime.sendMessage({
            action: 'allAnalysesComplete',
            results: results.sitemapAnalysis
          });
        });

        // Reset states for future analyses
        chrome.storage.local.set({
          'linksAnalysisComplete': false
        });
      }
    });
  },

  // Analyze URL with the checkLinks.js module
  async analyzeURLWithLinks(url) {
    let tab = null;
    console.group(`🔍 Analyzing links for: ${url}`);

    try {
      // Create new tab for analysis
      tab = await chrome.tabs.create({
        url: url,
        active: false
      });

      // Wait for page to load completely
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout: page loading took too long'));
        }, 30000); // 30s timeout

        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            clearTimeout(timeoutId);
            resolve();
          }
        });
      });

      console.log('Page loaded, injecting checkLinks.js module');

      // Inject necessary dependencies
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          "./assets/jquery-3.6.4.min.js",
          "./Functions/checkAndAddJquery.js",
          "./Functions/settingsOptions.js"
        ]
      });

      // Small delay to ensure jQuery is loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      // Inject checkLinks.js module
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["./Functions/checkLinks.js"]
      });

      console.log('checkLinks.js module injected, starting analysis');

      // Start links analysis
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Check if module is loaded
          if (typeof window.startLinksAnalysis === 'function') {
            console.log('Starting links analysis');
            window.startLinksAnalysis();

            // Create event listener for analysis completion
            window.addEventListener('linksAnalysisComplete', (event) => {
              console.log('Links analysis complete, sending results to service worker');
              chrome.runtime.sendMessage({
                action: 'linksAnalysisComplete',
                detail: event.detail
              });
            });
          } else {
            console.error('checkLinks.js module not found or not initialized');
          }
        }
      });

      // Wait for links analysis to complete
      await this.waitForLinksAnalysisComplete(tab.id);

      // Close tab
      if (tab) {
        await chrome.tabs.remove(tab.id);
        console.log('Tab closed after link analysis');
      }

      console.groupEnd();
      return { url, status: 'analyzed' };

    } catch (error) {
      console.error('Error during link analysis:', error);
      if (tab) {
        try {
          await chrome.tabs.remove(tab.id);
        } catch (e) {
          console.error('Error closing tab:', e);
        }
      }
      console.groupEnd();
      throw error;
    }
  },

  // Wait for links analysis to complete
  waitForLinksAnalysisComplete(tabId) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout: links analysis took too long'));
      }, 60000); // 60 seconds timeout

      function checkStatus() {
        chrome.scripting.executeScript({
          target: { tabId },
          function: () => {
            return window.isLinksAnalysisComplete ? window.isLinksAnalysisComplete() : false;
          }
        })
          .then(result => {
            if (result[0].result === true) {
              clearTimeout(timeoutId);
              resolve();
            } else {
              // Check again after a short delay
              setTimeout(checkStatus, 1000);
            }
          })
          .catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
      }

      // Start checking
      checkStatus();
    });
  }
};

// ==================== MESSAGE HANDLERS & EVENT LISTENERS ====================

// Main message listener for extension
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  // === CORS MANAGEMENT ===
  if (CORSManager.messageHandler(request, sender, sendResponse)) {
    return true; // Message handled by CORS manager
  }

  // === ANALYSIS MANAGEMENT ===
  // Sitemap analysis
  if (request.action === 'startSitemapAnalysis') {
    // Répondre immédiatement que l'analyse est démarrée
    sendResponse({ status: 'started' });

    // Ouvrir immédiatement la page de suivi de progression
    chrome.tabs.create({
      url: chrome.runtime.getURL('analysis-progress.html')
    });

    // Démarrer l'analyse en arrière-plan
    Analyzer.startAnalysis(request.sitemapUrl)
      .then(results => {
        // Une fois l'analyse terminée, ouvrir la page de résultats
        chrome.tabs.create({
          url: chrome.runtime.getURL('results.html')
        });
      })
      .catch(error => {
        console.error('Error during analysis:', error);
        // Notifier l'erreur
        chrome.runtime.sendMessage({
          action: 'analysisError',
          error: error.message
        });
      });

    return true;
  }

  // URL list analysis
  if (request.action === 'startUrlListAnalysis') {
    // Répondre immédiatement que l'analyse est démarrée
    sendResponse({ status: 'started' });

    // Ouvrir immédiatement la page de suivi de progression
    chrome.tabs.create({
      url: chrome.runtime.getURL('analysis-progress.html')
    });

    // Démarrer l'analyse en arrière-plan
    Analyzer.startAnalysis(request.urls, 'urlList')
      .then(results => {
        // Une fois l'analyse terminée, ouvrir la page de résultats
        chrome.tabs.create({
          url: chrome.runtime.getURL('results.html')
        });
      })
      .catch(error => {
        console.error('Error during analysis:', error);
        // Notifier l'erreur
        chrome.runtime.sendMessage({
          action: 'analysisError',
          error: error.message
        });
      });

    return true;
  }

  // Analysis control management
  if (request.action === 'pauseAnalysis' && state.sitemapAnalyzer) {
    state.sitemapAnalyzer.pause();
    sendResponse({ status: 'paused' });
    return true;
  }

  if (request.action === 'resumeAnalysis' && state.sitemapAnalyzer) {
    state.sitemapAnalyzer.resume();
    sendResponse({ status: 'resumed' });
    return true;
  }

  if (request.action === 'cancelAnalysis' && state.sitemapAnalyzer) {
    // Capturer l'ID d'analyse avant d'annuler
    const analysisId = state.sitemapAnalyzer.analysisId || 'unknown-analysis';

    state.sitemapAnalyzer.cancel();
    state.sitemapAnalyzer = null;

    // Assurer que CORS est désactivé si l'analyse est annulée
    try {
      await CORSManager.disable(analysisId);
      console.log(`CORS disabled after cancelling analysis ${analysisId}`);
      sendResponse({ status: 'cancelled' });
    } catch (error) {
      console.error('Error disabling CORS after cancel:', error);
      sendResponse({ status: 'cancelled', error: error.message });
    }

    return true;
  }

  // Current page analysis
  if (request.action === 'startCurrentPageAnalysis') {
    // Injecter des scripts pour analyser la page courante
    try {
      await Analyzer.injectScriptsForAnalysis(request.tabId);
      console.log('Page analysis scripts injected successfully');
      sendResponse({ status: 'started' });
    } catch (error) {
      console.error('Error during script injection:', error);
      sendResponse({ status: 'error', message: error.message });
    }

    return true;
  }

  // Get current analysis state
  if (request.action === 'getAnalysisStatus') {
    const corsState = CORSManager.getState();

    if (state.sitemapAnalyzer) {
      sendResponse({
        active: true,
        isPaused: state.sitemapAnalyzer.isPaused,
        progress: state.sitemapAnalyzer.getProgress(),
        corsState: corsState
      });
    } else {
      sendResponse({
        active: false,
        corsState: corsState
      });
    }
    return true;
  }

  // Link analysis listener
  if (request.action === 'linksAnalysisComplete') {
    console.log('Message received: link analysis complete', request.detail);

    await chrome.storage.local.set({
      'linksAnalysisComplete': true,
      'linksAnalysisResults': request.detail,
      'linksAnalysisTimestamp': Date.now()
    });

    Analyzer.checkAllAnalysesComplete();
    sendResponse({ status: 'success' });
    return true;
  }

  // Respond to link analysis status requests
  if (request.action === 'getLinksAnalysisStatus') {
    chrome.storage.local.get(['linksAnalysisComplete', 'linksAnalysisResults', 'linksAnalysisTimestamp'], (data) => {
      sendResponse({
        complete: data.linksAnalysisComplete || false,
        results: data.linksAnalysisResults || null,
        timestamp: data.linksAnalysisTimestamp || null
      });
    });
    return true;
  }

  // Analysis control management
  if (request.action === 'pauseAnalysis' && state.sitemapAnalyzer) {
    state.sitemapAnalyzer.pause();
    sendResponse({ status: 'paused' });
    return true;
  }

  if (request.action === 'resumeAnalysis' && state.sitemapAnalyzer) {
    state.sitemapAnalyzer.resume();
    sendResponse({ status: 'resumed' });
    return true;
  }

  if (request.action === 'cancelAnalysis' && state.sitemapAnalyzer) {
    state.sitemapAnalyzer.cancel();
    state.sitemapAnalyzer = null;

    // Ensure CORS are disabled if analysis is cancelled
    CORSManager.disable().then(() => {
      sendResponse({ status: 'cancelled' });
    });
    return true;
  }

  // Current page analysis
  if (request.action === 'startCurrentPageAnalysis') {
    // Enable CORS before page analysis
    CORSManager.enable().then(() => {
      // Inject scripts to analyze current page
      Analyzer.injectScriptsForAnalysis(request.tabId);

      // Once analysis is complete, ensure CORS are disabled
      setTimeout(() => {
        CORSManager.disable();
      }, 10000); // Reasonable timeout for page analysis

      sendResponse({ status: 'started' });
    });
    return true;
  }

  // Get current analysis state
  if (request.action === 'getAnalysisStatus') {
    if (state.sitemapAnalyzer) {
      sendResponse({
        active: true,
        isPaused: state.sitemapAnalyzer.isPaused,
        progress: state.sitemapAnalyzer.getProgress(),
        corsState: state.cors
      });
    } else {
      sendResponse({
        active: false,
        corsState: state.cors
      });
    }
    return true;
  }

  // Link analysis listener
  if (request.action === 'linksAnalysisComplete') {
    console.log('Message received: link analysis complete', request.detail);
    chrome.storage.local.set({
      'linksAnalysisComplete': true,
      'linksAnalysisResults': request.detail
    });
    Analyzer.checkAllAnalysesComplete();
    sendResponse({ status: 'success' });
    return true;
  }

  // Respond to link analysis status requests
  if (request.action === 'getLinksAnalysisStatus') {
    chrome.storage.local.get(['linksAnalysisComplete', 'linksAnalysisResults'], (data) => {
      sendResponse({
        complete: data.linksAnalysisComplete || false,
        results: data.linksAnalysisResults || null
      });
    });
    return true;
  }

  // === INTERFACE MANAGEMENT ===
  if (request.action === "open_interface") {
    console.log("Interface open request received");
    // Validate and reset if needed
    await ProcessStepManager.validate();

    // Store received data
    state.globalData.dataChecker = request.data;
    console.log("dataChecker data stored");

    console.log("launch detected soprod tab and snip username");
    detecteSoprod();
    console.log("dataChecker data:", request.data);

    // Vérifier si nous sommes déjà à l'étape 1 (user détecté)
    const step = await ProcessStepManager.get();
    if (step === 1) {
      // Si nous avons déjà l'étape 1 (user détecté), passer à 2 (données complètes)
      await ProcessStepManager.increment();
      console.log("Step incremented to 2 (data complete) from interface request");

      // Vérifier les données maintenant que nous sommes à l'étape 2
      await checkDatas(state.user || "Customer");
    }

    return true;
  }

  // === FETCH FOR CONTENT SCRIPTS ===
  if (request.from === "content_script" && request.subject === "fetch") {
    fetch(request.url)
      .then((response) => response.text())
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// ==================== SOPROD DETECTION AND UI ELEMENTS ====================

// Detect Soprod tabs and interfaces
const detectTabsAndInterfaces = async () => {
  try {
    const solocalmsTabs = await chrome.tabs.query({
      url: "*://*.solocalms.fr/*",
    });

    if (solocalmsTabs.length > 0) {
      console.log("Soprod tab detected...");
      // Tabs with solocalms.fr were detected
      state.allTabs.push(...solocalmsTabs);
    } else {
      // No tab with solocalms.fr detected, add only active tab
      const activeTab = await chrome.tabs.query({
        currentWindow: true,
        active: true,
      });
      console.log("Active tab (no Soprod tab):", activeTab);
      state.allTabs.push(activeTab[0]);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Log detected tabs
    console.log("allTabs:", state.allTabs);
  }
};

// Soprod user detection
const detecteSoprod = async () => {
  console.log("Detecting Soprod tabs...");

  // Check storage first
  const storageUser = await chrome.storage.sync.get("user");

  // If a valid user is already stored, use it
  if (storageUser.user && storageUser.user.includes("@solocal.com")) {
    console.log("Soprod user already detected in storage:", storageUser.user);
    await handleUserSoprod(storageUser.user);
    return;
  }

  try {
    // Find Soprod tabs
    const soprodTabs = await chrome.tabs.query({
      url: "*://*.solocalms.fr/*",
    });

    // Go through Soprod tabs to find a user
    for (const tab of soprodTabs) {
      if (!tab.id) continue;

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            const dropUser = document.querySelector(".dropdown-user .username");
            return dropUser ? dropUser.innerHTML : null;
          }
        });

        if (results && results[0] && results[0].result) {
          const userSoprod = results[0].result;
          console.log("Soprod user detected:", userSoprod);

          // Store user
          await chrome.storage.sync.set({ user: userSoprod });
          console.log("User stored in storage.sync");

          // Process detected user
          await handleUserSoprod(userSoprod);
          return;
        }
      } catch (error) {
        console.error("Error executing script in Soprod tab:", error);
      }
    }

    // If no user found, use "Customer"
    console.log("No Soprod user detected, using 'Customer'");
    await chrome.storage.sync.set({ user: "Customer" });
    await handleUserSoprod("Customer");

  } catch (error) {
    console.error("Error detecting Soprod tabs:", error);
    await chrome.storage.sync.set({ user: "Customer" });
    await handleUserSoprod("Customer");
  }
};

// Handle detected Soprod user
const handleUserSoprod = async (user) => {
  console.log("Processing Soprod user:", user);

  // Update user in global state
  state.user = user;
  state.globalData.user = user;

  // Validate and get current step
  let step = await ProcessStepManager.validate();

  // If step is 0, go to 1 (user detected)
  // If step is 1, go to 2 (data complete)
  if (step === 0) {
    step = await ProcessStepManager.increment();
    console.log("Step incremented to 1 (user detected)");
  }

  // Si nous avons déjà des données dataChecker stockées, on peut incrémenter à 2
  if (step === 1 && state.globalData.dataChecker) {
    step = await ProcessStepManager.increment();
    console.log("Step incremented to 2 (data complete)");
  }

  // Check if data is complete
  await checkDatas(user);
};

// Interface window management
const InterfaceManager = {
  // Open or replace interface window
  openOrReplaceWindow() {
    console.log("Starting interface opening");
    const interfacePopupUrl = chrome.runtime.getURL("interface.html");

    // Store a flag indicating we're opening the interface
    chrome.storage.local.set({ 'openingInterface': true, 'openingTime': Date.now() }, () => {
      // Get window ID from local storage
      chrome.storage.local.get(["popupWindowId"], (result) => {
        const popupWindowId = result.popupWindowId;

        const createNewWindow = () => {
          console.log("Creating new interface window");

          // Add error protection
          try {
            chrome.windows.create(
              {
                type: "popup",
                url: interfacePopupUrl,
                width: 1000,
                height: 1000,
              },
              (window) => {
                if (chrome.runtime.lastError) {
                  console.error("Error creating window:", chrome.runtime.lastError);
                  // Mark creation failed
                  chrome.storage.local.set({
                    'openingInterface': false,
                    'interfaceError': chrome.runtime.lastError.message
                  });
                  return;
                }

                if (!window || !window.id) {
                  console.error("Window created without valid ID");
                  chrome.storage.local.set({
                    'openingInterface': false,
                    'interfaceError': 'Window without ID'
                  });
                  return;
                }

                // Store new window ID
                chrome.storage.local.set({
                  'popupWindowId': window.id,
                  'openingInterface': false,
                  'interfaceOpened': true
                });
                console.log("New interface window created, ID:", window.id);
              }
            );
          } catch (e) {
            console.error("Exception creating window:", e);
            chrome.storage.local.set({ 'openingInterface': false, 'interfaceError': e.message });
          }
        };

        // Handle existing window
        if (popupWindowId) {
          try {
            chrome.windows.get(popupWindowId, {}, (windowInfo) => {
              const error = chrome.runtime.lastError;

              if (error || !windowInfo) {
                console.log("Previous window not found:", error);
                chrome.storage.local.remove("popupWindowId", createNewWindow);
              } else {
                // Existing window found - close it then create a new one
                chrome.windows.remove(popupWindowId, () => {
                  console.log("Existing window closed, ID:", popupWindowId);
                  chrome.storage.local.remove("popupWindowId", createNewWindow);
                });
              }
            });
          } catch (e) {
            console.error("Exception checking existing window:", e);
            chrome.storage.local.remove("popupWindowId", createNewWindow);
          }
        } else {
          // No window ID stored, directly create a new window
          createNewWindow();
        }
      });
    });
  },

  // Get window ID from local storage
  getWindowId(callback) {
    chrome.storage.local.get(["popupWindowId"], (result) => {
      const storedPopupWindowId = result.popupWindowId;
      callback(storedPopupWindowId);
    });
  },

  // Store window ID in local storage
  setWindowId(id) {
    chrome.storage.local.set({ popupWindowId: id });
  },

  // Close window if it exists
  closeIfExists(windowId, callback) {
    if (windowId) {
      chrome.windows.get(windowId, {}, (windowInfo) => {
        if (chrome.runtime.lastError || !windowInfo) {
          // Window not found or error, reset stored ID
          console.log(
            "Window not found or error:",
            chrome.runtime.lastError
          );
          chrome.storage.local.remove("popupWindowId", () => {
            callback();
          });
        } else {
          // Window found, close it
          chrome.windows.remove(windowId, () => {
            console.log("Closed existing window with ID:", windowId);
            chrome.storage.local.remove("popupWindowId", () => {
              callback();
            });
          });
        }
      });
    } else {
      // No window ID, do nothing
      callback();
    }
  }
};

// Check and process data
const checkDatas = async (user_soprod) => {
  // Validate and get current step
  const step = await ProcessStepManager.validate();
  console.log('Check step before opening interface:', step, user_soprod);

  // Check if we have the two required data
  if (step !== 2) {
    console.log("Incomplete data. Step:", step);
    return; // Exit if conditions not met
  }

  console.log("Both required data arrived");

  if (!state.globalData.dataChecker) {
    console.error("dataChecker data missing");
    await ProcessStepManager.reset(); // Reset to allow a new attempt
    return;
  }

  const user = user_soprod || state.globalData.user || "Customer";
  console.log("User for indexDB:", user);
  state.globalData.user = user;

  try {
    const dataCheckerParse = JSON.parse(state.globalData.dataChecker);

    // Store data in local storage
    await chrome.storage.local.set({
      'parsedData': dataCheckerParse,
      'currentUser': user,
      'timestamp': Date.now()
    });

    console.log("Data saved in local storage");

    // Create database
    try {
      createDB(user, state.dbName, dataCheckerParse);
      console.log("CREATEDB -> launched with data: user =", user, { dbName: state.dbName });

      // Reset step BEFORE opening interface
      await ProcessStepManager.reset();

      // Open interface with delay
      setTimeout(() => {
        InterfaceManager.openOrReplaceWindow();
      }, 300);

    } catch (dbError) {
      console.error("Error creating DB:", dbError);
      await ProcessStepManager.reset();

      // Try to open interface anyway
      setTimeout(() => {
        InterfaceManager.openOrReplaceWindow();
      }, 300);
    }

  } catch (error) {
    console.error("Error parsing data:", error);
    await ProcessStepManager.reset();

    // Try to open interface anyway
    setTimeout(() => {
      InterfaceManager.openOrReplaceWindow();
    }, 300);
  }
};

// Fonction de diagnostic CORS
// Fonction de diagnostic CORS
async function diagnoseCORSIssues() {
  console.group("🔍 CORS Diagnostic Tool");

  try {
    // 1. Vérifier l'état actuel
    const corsState = CORSManager.getState();
    console.log("Current CORS state:", corsState);

    // 2. Vérifier la cohérence avec le storage
    const storageData = await chrome.storage.sync.get(["corsEnabled"]);
    console.log("Storage CORS state:", storageData);

    // 3. Vérifier les règles actives
    let enabledRulesets = [];
    try {
      enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    } catch (e) {
      console.warn("Error getting enabled rulesets:", e);
      inconsistencies.push("Unable to verify active rulesets: " + e.message);
    }
    console.log("Enabled rulesets:", enabledRulesets);

    // 4. Vérifier les sessions actives
    console.log("Active scans:", corsState.activeScans);

    // 5. Vérifier s'il y a des incohérences
    const inconsistencies = [];

    if (corsState.isEnabled !== storageData.corsEnabled) {
      inconsistencies.push("CORS state mismatch between memory and storage");
    }

    if (corsState.isEnabled && !enabledRulesets.includes("overwrite-origin")) {
      inconsistencies.push("CORS marked as enabled but ruleset not active");
    }

    if (!corsState.isEnabled && enabledRulesets.includes("overwrite-origin")) {
      inconsistencies.push("CORS marked as disabled but ruleset still active");
    }

    if (corsState.refCount > 0 && corsState.activeScans.length === 0) {
      inconsistencies.push("Reference count > 0 but no active scans registered");
    }

    if (corsState.refCount === 0 && corsState.activeScans.length > 0) {
      inconsistencies.push("Reference count = 0 but active scans registered");
    }

    if (corsState.refCount > corsState.activeScans.length) {
      inconsistencies.push("Reference count higher than active scans count");
    }

    // 6. Rapport
    if (inconsistencies.length > 0) {
      console.warn("CORS inconsistencies detected:", inconsistencies);

      // 7. Tentative de correction automatique
      console.log("Attempting automatic correction...");

      // Réinitialiser l'état CORS
      await CORSManager.forceDisable();

      // Vérifier l'état après correction
      const updatedState = CORSManager.getState();
      console.log("CORS state after correction:", updatedState);

      // Vérifier les analyses en cours
      const runningAnalyses = await chrome.storage.local.get(['sitemapAnalysis', 'linksAnalysisComplete']);

      if (runningAnalyses.linksAnalysisComplete === false) {
        console.log("Incomplete link analysis detected, marking as complete");
        await chrome.storage.local.set({ 'linksAnalysisComplete': true });
      }

      return {
        status: "fixed",
        message: "CORS inconsistencies detected and fixed",
        inconsistencies: inconsistencies,
        currentState: updatedState
      };
    } else {
      console.log("No CORS inconsistencies detected");
      return {
        status: "ok",
        message: "No CORS inconsistencies detected",
        currentState: corsState
      };
    }
  } catch (error) {
    console.error("Error during CORS diagnosis:", error);
    return {
      status: "error",
      error: error.message || "Unexpected error during CORS diagnosis",
      details: error.stack
    };
  } finally {
    console.groupEnd();
  }
}

// Fonction pour corriger automatiquement les problèmes CORS
async function repairCORSState() {
  console.log("🛠️ Repairing CORS state...");

  try {
    // 1. Désactiver complètement CORS
    await CORSManager.forceDisable();

    // 2. Mettre à jour le stockage
    await chrome.storage.sync.set({ corsEnabled: false });

    // 3. Réinitialiser les états d'analyse en cours
    await chrome.storage.local.set({
      'linksAnalysisComplete': true
    });

    // 4. Vérifier l'état après réparation
    const diagnosis = await diagnoseCORSIssues();

    console.log("CORS repair completed:", diagnosis);
    return diagnosis;
  } catch (error) {
    console.error("Error during CORS repair:", error);
    return {
      status: "error",
      error: error.message
    };
  }
}


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'diagnoseCORS') {
    // Réponse immédiate pour confirmer réception
    sendResponse({ received: true });

    // Lancer le diagnostic en arrière-plan
    diagnoseCORSIssues()
      .then(result => {
        console.log("Diagnostic CORS terminé:", result);

        // Stocker le résultat dans le stockage local
        chrome.storage.local.set({
          'corsResult': result,
          'corsResultTimestamp': Date.now()
        }, () => {
          // Notifier le popup que le résultat est disponible
          chrome.runtime.sendMessage({
            action: 'corsResultReady',
            result: result  // Envoyer également le résultat directement
          });
        });
      })
      .catch(error => {
        console.error("Error during CORS diagnosis:", error);

        // Stocker l'erreur également
        chrome.storage.local.set({
          'corsResult': {
            status: 'error',
            error: error.message || "Unexpected error during CORS diagnosis",
            details: error.stack
          },
          'corsResultTimestamp': Date.now()
        }, () => {
          // Notifier le popup que le résultat est disponible
          chrome.runtime.sendMessage({
            action: 'corsResultReady',
            error: true
          });
        });
      });

    return true; // Indiquer que sendResponse sera appelé de manière asynchrone
  }

  if (request.action === 'repairCORS') {
    const result = await repairCORSState();
    sendResponse(result);
    return true;
  }

  return false; // Indiquer que ce gestionnaire n'a pas traité le message
});

// Écouter les erreurs de CORS pour les diagnostiquer automatiquement
self.addEventListener('unhandledrejection', async (event) => {
  const error = event.reason;

  // Si l'erreur semble liée à CORS, diagnostiquer et corriger
  if (error && typeof error.message === 'string' &&
    (error.message.includes('CORS') || error.message.includes('cross-origin'))) {
    console.warn("Unhandled CORS-related rejection detected:", error);

    // Diagnostiquer et corriger automatiquement
    const result = await repairCORSState();
    console.log("Auto-repair result:", result);
  }
});
setTimeout(async () => {
  console.log("Performing startup CORS diagnosis...");
  await diagnoseCORSIssues();
}, 3000);