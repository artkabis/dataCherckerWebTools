/**
 * Service Worker Modernisé - Health Checker Website
 * Version corrigée avec appState et fonctions manquantes
 */

"use strict";

// === IMPORTS MODERNES ===
import { CORSManager } from "./core/CORSManager.js";
import { createDB } from "./Functions/createIndexDB.js";
import { SitemapAnalyzer } from "./Functions/sitemapAnalyzer.js";
import { WebScanner } from "./core/WebScanner.js";
import { CONFIG, initConfig } from "./config.js";



// === INSTANCES GLOBALES ===
const corsManager = new CORSManager();
let webScanner = null;

// === STATE MANAGEMENT MODERNE AVEC CLASSE ===
class ApplicationState {
  constructor() {
    this.config = null;
    this.sitemapAnalyzer = null;
    this.user = null;
    this.allTabs = [];
    this.globalData = {};
    this.dbName = "db_datas_checker";
    this.processStep = 0;
    this.cors = {
      isEnabled: false,
      scanInProgress: false
    };
  }

  async reset() {
    this.sitemapAnalyzer = null;
    this.globalData = {};
    await this.#resetProcessStep();
  }

  async #resetProcessStep() {
    await chrome.storage.local.set({ 'processStep': 0 });
  }
}

const appState = new ApplicationState();

// Helper function pour les messages Chrome
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

// === PROCESS STEP MANAGER MODERNISÉ ===
class ProcessStepManager {
  static async get() {
    const result = await chrome.storage.local.get(['processStep']);
    return result.processStep || 0;
  }

  static async increment() {
    const currentStep = await this.get();
    const newStep = currentStep + 1;
    await chrome.storage.local.set({ 'processStep': newStep });
    console.log(`[Process] Step incremented: ${currentStep} -> ${newStep}`);
    return newStep;
  }

  static async reset() {
    console.log("[Process] Resetting step");
    await chrome.storage.local.set({ 'processStep': 0 });
    return 0;
  }

  static async validate() {
    const step = await this.get();
    if (step > 2) {
      console.warn(`[Process] Inconsistent step (${step}), forced reset`);
      return await this.reset();
    }
    return step;
  }
}

// === ANALYZER MODERNISÉ ===
class Analyzer {
  /**
   * Injecter les scripts d'analyse de manière moderne
   */
  static async injectScriptsForAnalysis(tabId) {
    if (!tabId) {
      throw new Error("[Analyzer] TabId is required to inject scripts");
    }

    const analysisId = `page-analysis-${Date.now()}`;
    console.log(`[Analyzer] Injecting scripts into tab ${tabId}, ID: ${analysisId}`);

    try {
      // Activer CORS avec le nouveau manager
      await corsManager.enable(analysisId);

      // Injection moderne avec gestion d'erreur
      await this.#injectCoreScripts(tabId);
      await this.#waitAndInjectAnalysisScripts(tabId);

      // Attendre la fin d'analyse avec timeout plus long
      await this.#waitForAnalysisComplete(analysisId, tabId);

    } catch (error) {
      console.error(`[Analyzer] Error in analysis ${analysisId}:`, error);
      throw error;
    } finally {
      // S'assurer que CORS est désactivé
      await corsManager.disable(analysisId);
      console.log(`[Analyzer] CORS disabled after analysis ${analysisId}`);
    }
  }

  /**
   * Démarrer une analyse avec gestion CORS sécurisée
   */
  static async startAnalysis(source, mode = 'sitemap') {
    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      console.log(`[Analyzer] Starting ${mode} analysis, ID: ${analysisId}`);

      // Réinitialiser les états
      await chrome.storage.local.set({ 'linksAnalysisComplete': false });

      // Créer l'analyseur avec configuration
      appState.sitemapAnalyzer = new SitemapAnalyzer({
        batchSize: 3,
        pauseBetweenBatches: 750,
        tabTimeout: 45000,
        maxRetries: 2,
        analysisId
      });

      // Configuration des écouteurs
      this.#setupAnalyzerListeners(analysisId);

      // Utiliser le CORSManager moderne avec runWithSafe
      const results = await corsManager.runWithSafe(async () => {
        if (mode === 'urlList' && Array.isArray(source)) {
          console.log(`[Analyzer] Analyzing ${source.length} URLs`);
          return await appState.sitemapAnalyzer.startWithUrlList(source);
        } else {
          console.log(`[Analyzer] Analyzing sitemap: ${source}`);
          return await appState.sitemapAnalyzer.start(source);
        }
      }, analysisId);

      // Stocker les résultats
      await chrome.storage.local.set({ 'sitemapAnalysis': results });
      console.log(`[Analyzer] Analysis ${analysisId} completed successfully`);

      return results;

    } catch (error) {
      console.error(`[Analyzer] Error in analysis ${analysisId}:`, error);
      appState.sitemapAnalyzer = null;
      throw error;
    }
  }

  // === MÉTHODES PRIVÉES ===

  static async #injectCoreScripts(tabId) {
    console.log(`[Analyzer] Injecting core scripts into tab ${tabId}`);
    return chrome.scripting.executeScript({
      target: { tabId },
      files: [
        "./assets/jquery-3.6.4.min.js",
        "./Functions/clear.js",
        "./assets/console.image.min.js",
        "./Functions/checkAndAddJquery.js",
        "./Functions/settingsOptions.js",
      ],
    });
  }

  static async #waitAndInjectAnalysisScripts(tabId) {
    // Délai pour s'assurer que jQuery est chargé
    await new Promise(resolve => setTimeout(resolve, 500)); // Augmenté à 500ms

    console.log(`[Analyzer] Injecting analysis scripts into tab ${tabId}`);
    return chrome.scripting.executeScript({
      target: { tabId },
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
        "./Functions/checkBreakLinks.js",
        "./Functions/checkLinkAndImages.js",
      ],
    });
  }

  static async #waitForAnalysisComplete(analysisId, tabId) {
    console.log(`[Analyzer] Waiting for analysis completion ${analysisId}`);

    return new Promise((resolve, reject) => {
      let analysisComplete = false;
      let messageListenerAdded = false;

      const messageListener = (message) => {
        if (message.action === 'dataCheckerAnalysisComplete') {
          console.log(`[Analyzer] Analysis complete event received for ${analysisId}`);
          analysisComplete = true;

          if (messageListenerAdded) {
            chrome.runtime.onMessage.removeListener(messageListener);
          }

          // Délai pour s'assurer que toutes les requêtes sont terminées
          setTimeout(() => {
            console.log(`[Analyzer] Analysis ${analysisId} fully complete`);
            resolve();
          }, 3000); // Augmenté à 3 secondes
        }
      };

      // Ajouter l'écouteur
      chrome.runtime.onMessage.addListener(messageListener);
      messageListenerAdded = true;

      // Vérifier périodiquement si l'analyse est terminée via le DOM
      const checkInterval = setInterval(async () => {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId },
            function: () => {
              // Vérifier si window.dataCheckerAnalysisComplete existe et est true
              return {
                analysisComplete: window.dataCheckerAnalysisComplete || false,
                dataChecker: window.dataChecker ? 'present' : 'missing'
              };
            }
          });

          const result = results[0]?.result;
          if (result) {
            console.log(`[Analyzer] DOM check for ${analysisId}:`, result);

            if (result.analysisComplete && !analysisComplete) {
              console.log(`[Analyzer] Analysis completed detected via DOM check for ${analysisId}`);
              analysisComplete = true;
              clearInterval(checkInterval);

              if (messageListenerAdded) {
                chrome.runtime.onMessage.removeListener(messageListener);
              }

              setTimeout(resolve, 2000);
            }
          }
        } catch (error) {
          console.log(`[Analyzer] DOM check error for ${analysisId}:`, error);
          // Continue checking
        }
      }, 2000); // Vérifier toutes les 2 secondes

      // Timeout de sécurité augmenté
      setTimeout(() => {
        if (!analysisComplete) {
          console.warn(`[Analyzer] Timeout reached for analysis ${analysisId}, completing anyway`);
          clearInterval(checkInterval);

          if (messageListenerAdded) {
            chrome.runtime.onMessage.removeListener(messageListener);
          }

          // Résoudre quand même pour éviter de bloquer
          resolve();
        }
      }, 30000); // Augmenté à 30 secondes
    });
  }

  static #setupAnalyzerListeners(analysisId) {
    // Écouteur de progression
    appState.sitemapAnalyzer.on('progress', (progress) => {
      progress.analysisId = analysisId;
      chrome.runtime.sendMessage({
        action: 'analysisProgress',
        progress
      });
    });

    // Écouteur d'état d'analyse de liens
    appState.sitemapAnalyzer.on('linksAnalysisStatus', (status) => {
      status.analysisId = analysisId;
      chrome.runtime.sendMessage({
        action: 'linksAnalysisStatus',
        status
      });

      if (status.completed) {
        chrome.storage.local.set({
          'linksAnalysisComplete': true,
          'linksAnalysisId': analysisId
        });
      }
    });

    // Écouteur d'achèvement
    appState.sitemapAnalyzer.on('complete', async (results) => {
      results.analysisId = analysisId;

      console.log(`[Analyzer] Complete results for ${analysisId}:`, results);

      await chrome.storage.local.set({
        'sitemapAnalysis': results,
        'analysisCompleteId': analysisId,
        'analysisCompleteTime': Date.now()
      });

      this.#checkAllAnalysesComplete(results);
      appState.sitemapAnalyzer = null;
    });
  }

  static #checkAllAnalysesComplete(results) {
    chrome.storage.local.get(['linksAnalysisComplete'], (data) => {
      const allComplete = data.linksAnalysisComplete || results?.analysisComplete === true;

      if (allComplete) {
        console.log('[Analyzer] All analyses complete');

        chrome.runtime.sendMessage({
          action: 'allAnalysesComplete',
          results: results
        });

        // Reset pour futures analyses
        chrome.storage.local.set({ 'linksAnalysisComplete': false });
      }
    });
  }

  // Méthodes additionnelles pour compatibilité avec votre code existant
  static async analyzeURLWithLinks(url) {
    let tab = null;
    console.group(`🔍 [Analyzer] Analyzing links for: ${url}`);

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
        }, 30000);

        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            clearTimeout(timeoutId);
            resolve();
          }
        });
      });

      console.log('[Analyzer] Page loaded, injecting checkLinks.js module');

      // Inject necessary dependencies
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          "./assets/jquery-3.6.4.min.js",
          "./Functions/checkAndAddJquery.js",
          "./Functions/settingsOptions.js"
        ]
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Inject checkLinks.js module
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["./Functions/checkLinks.js"]
      });

      console.log('[Analyzer] checkLinks.js module injected, starting analysis');

      // Start links analysis
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          if (typeof window.startLinksAnalysis === 'function') {
            console.log('Starting links analysis');
            window.startLinksAnalysis();

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

      if (tab) {
        await chrome.tabs.remove(tab.id);
        console.log('[Analyzer] Tab closed after link analysis');
      }

      console.groupEnd();
      return { url, status: 'analyzed' };

    } catch (error) {
      console.error('[Analyzer] Error during link analysis:', error);
      if (tab) {
        try {
          await chrome.tabs.remove(tab.id);
        } catch (e) {
          console.error('[Analyzer] Error closing tab:', e);
        }
      }
      console.groupEnd();
      throw error;
    }
  }

  static waitForLinksAnalysisComplete(tabId) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout: links analysis took too long'));
      }, 60000);

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
              setTimeout(checkStatus, 1000);
            }
          })
          .catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
      }

      checkStatus();
    });
  }
}

// === INITIALISATION MODERNE ===
const initialize = async () => {
  await ProcessStepManager.reset();
  appState.config = await initConfig();
  console.log("[App] Configuration initialized:", appState.config);
  // Note: corsManager.setupLifecycle() est appelé automatiquement dans le constructeur
  await detectTabsAndInterfaces();
};

// Initialiser immédiatement
initialize();

// === RESOURCE CACHING (gardé de votre code existant) ===
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
  "./Functions/checkBreakLinks.js",
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
// 3. Dans service_worker.js - Handler de vérification des résultats
async function handleVerifyWebScannerResults(sendResponse) {
  try {
    const data = await chrome.storage.local.get([
      'webScannerResults',
      'webScannerSummary',
      'webScannerResults_temp',
      'webScannerProgress',
      'webScannerTimestamp'
    ]);

    console.log('[ServiceWorker] Results verification:', {
      hasResults: !!data.webScannerResults,
      resultsCount: data.webScannerResults?.length || 0,
      hasSummary: !!data.webScannerSummary,
      hasTemp: !!data.webScannerResults_temp,
      tempCount: data.webScannerResults_temp?.length || 0,
      timestamp: data.webScannerTimestamp,
      progress: data.webScannerProgress
    });

    // Si pas de résultats finaux mais des résultats temporaires, les promouvoir
    if (!data.webScannerResults && data.webScannerResults_temp && data.webScannerResults_temp.length > 0) {
      console.log('[ServiceWorker] Promoting temporary results to final results');

      const tempResults = data.webScannerResults_temp;
      const reconstructedSummary = {
        totalPages: data.webScannerProgress?.total || tempResults.length,
        pagesWithMatches: tempResults.length,
        totalMatches: tempResults.reduce((sum, result) => sum + result.matches.length, 0),
        timestamp: Date.now(),
        analysisId: data.webScannerProgress?.analysisId || 'recovered'
      };

      await chrome.storage.local.set({
        'webScannerResults': tempResults,
        'webScannerSummary': reconstructedSummary
      });

      sendResponse({
        status: 'recovered',
        results: tempResults,
        summary: reconstructedSummary
      });
    } else {
      sendResponse({
        status: 'success',
        results: data.webScannerResults || [],
        summary: data.webScannerSummary || null,
        debug: {
          hasResults: !!data.webScannerResults,
          resultsCount: data.webScannerResults?.length || 0,
          timestamp: data.webScannerTimestamp
        }
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Error verifying results:', error);
    sendResponse({
      status: 'error',
      message: error.message
    });
  }
  return true;
}

async function handleStartWebScanner(request, sendResponse) {
  const { domain, searchQuery, useRegex, caseSensitive, searchMode } = request;

  if (!domain || !searchQuery) {
    if (sendResponse) sendResponse({ status: 'error', message: 'Domaine et recherche requis' });
    return true;
  }

  try {
    const urlObj = new URL(domain);
    const normalizedDomain = urlObj.origin;

    console.log(`[ServiceWorker] Starting WebScanner analysis for: ${normalizedDomain}`);
    console.log(`[ServiceWorker] Search query: "${searchQuery}"`);

    // Répondre immédiatement pour éviter les ports fermés
    if (sendResponse) {
      sendResponse({ status: 'started', message: 'Analyse démarrée' });
    }

    // Nettoyer l'instance précédente si elle existe
    if (webScanner) {
      await webScanner.cleanup();
    }

    // CONFIGURATIONS OPTIMISÉES PAR TYPE DE SITE

    // Configuration pour sites WordPress lourds
    const wordpressConfig = {
      processingMode: 'parallel',

      // Configuration de base pour WordPress (conservatrice mais efficace)
      batchSize: 12,                    // Lots moyens pour éviter de surcharger
      maxConcurrentRequests: 6,         // Concurrence modérée
      batchDelay: 250,                  // Pause raisonnable entre lots
      requestTimeout: 8000,             // Timeout plus long pour pages lourdes

      // Optimisations spécifiques WordPress
      adaptiveBatching: true,           // S'adapte automatiquement aux performances
      useCache: true,                   // Essential pour WordPress (pages répétitives)
      optimizedHtmlCleaning: true,      // Traitement rapide du HTML lourd
      storageDebounceMs: 1000,          // Grouper les écritures pour la performance

      // Gestion des erreurs WordPress
      maxRetries: 2,                    // Retry sur échec
      backoffMultiplier: 1.5,           // Backoff progressif

      // Seuils adaptatifs pour WordPress
      slowRequestThreshold: 4000,       // Considéré comme lent au-delà de 4s
      failureRateThreshold: 0.15,       // Réduire la charge si > 15% d'échecs

      // Headers optimisés pour WordPress
      customHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };

    // Configuration pour sites statiques (Duda, Netlify, etc.)
    const staticSiteConfig = {
      processingMode: 'parallel',

      // Configuration agressive pour sites statiques (rapides)
      batchSize: 25,                    // Lots plus gros possible avec sites rapides
      maxConcurrentRequests: 12,        // Concurrence élevée (CDN performants)
      batchDelay: 100,                  // Pause minimale entre lots
      requestTimeout: 4000,             // Timeout court (sites rapides)

      // Optimisations spécifiques sites statiques
      adaptiveBatching: true,           // Adaptation même pour sites rapides
      useCache: true,                   // Cache toujours utile
      optimizedHtmlCleaning: true,      // HTML plus propre = traitement rapide
      storageDebounceMs: 300,           // Débounce plus court (plus de résultats)

      // Gestion d'erreur optimiste (sites stables)
      maxRetries: 1,                    // Retry minimal (sites fiables)
      backoffMultiplier: 1.2,           // Backoff minimal

      // Seuils adaptatifs pour sites statiques
      slowRequestThreshold: 2000,       // Considéré comme lent au-delà de 2s
      failureRateThreshold: 0.05,       // Réduire la charge si > 5% d'échecs

      // Headers optimisés pour CDN/sites statiques
      customHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
      }
    };

    // DÉTECTION AUTOMATIQUE DU TYPE DE SITE
    const siteType = await detectSiteType(normalizedDomain);
    console.log(`[ServiceWorker] Site type detected: ${siteType}`);

    // CONFIGURATIONS PROGRESSIVES BASÉES SUR LA PERFORMANCE DÉTECTÉE
    const getAdaptiveConfig = (baseConfig, configType, isInitialScan = true) => {
      if (isInitialScan) {
        // Configuration conservatrice pour les premières pages
        if (configType === 'static') {
          return {
            ...baseConfig,
            batchSize: 15,
            maxConcurrentRequests: 8,
            batchDelay: 150,
            requestTimeout: 3000
          };
        } else { // WordPress
          return {
            ...baseConfig,
            batchSize: 8,
            maxConcurrentRequests: 4,
            batchDelay: 400,
            requestTimeout: 10000
          };
        }
      } else {
        // Configuration basée sur la performance observée
        const metrics = webScanner?.performanceMetrics;
        if (metrics) {
          if (configType === 'static') {
            // Adaptations pour sites statiques
            if (metrics.avgRequestTime > 3000 || metrics.successRate < 0.9) {
              // Site statique anormalement lent
              return {
                ...baseConfig,
                batchSize: Math.max(8, Math.floor(baseConfig.batchSize * 0.8)),
                maxConcurrentRequests: Math.max(4, Math.floor(baseConfig.maxConcurrentRequests * 0.7)),
                batchDelay: Math.min(300, baseConfig.batchDelay * 1.5)
              };
            } else if (metrics.avgRequestTime < 1000 && metrics.successRate > 0.98) {
              // Site statique très rapide - mode turbo
              return {
                ...baseConfig,
                batchSize: Math.min(40, Math.floor(baseConfig.batchSize * 1.5)),
                maxConcurrentRequests: Math.min(20, Math.floor(baseConfig.maxConcurrentRequests * 1.4)),
                batchDelay: Math.max(50, Math.floor(baseConfig.batchDelay * 0.7))
              };
            }
          } else {
            // Adaptations pour WordPress (logique existante)
            if (metrics.avgRequestTime > 5000 || metrics.successRate < 0.85) {
              return {
                ...baseConfig,
                batchSize: 6,
                maxConcurrentRequests: 3,
                batchDelay: 600,
                requestTimeout: 12000
              };
            } else if (metrics.avgRequestTime < 2000 && metrics.successRate > 0.95) {
              return {
                ...baseConfig,
                batchSize: 20,
                maxConcurrentRequests: 10,
                batchDelay: 150,
                requestTimeout: 6000
              };
            }
          }
        }
        return baseConfig; // Configuration par défaut
      }
    };

    // Sélectionner la configuration de base selon le type de site
    let baseConfig, configType;
    if (siteType === 'static' || siteType === 'duda') {
      baseConfig = staticSiteConfig;
      configType = 'static';
    } else {
      baseConfig = wordpressConfig;
      configType = 'wordpress';
    }

    let finalConfig = getAdaptiveConfig(baseConfig, configType, true);

    // Optimisations spécifiques selon le type de site
    if (siteType === 'static' || siteType === 'duda') {
      console.log('[ServiceWorker] Static/Duda site detected - applying static-specific optimizations');

      // Optimisations spécifiques sites statiques
      finalConfig = {
        ...finalConfig,
        // Sites statiques sont généralement stables
        followRedirects: true,
        maxRedirects: 2,

        // Cache moins agressif (contenu statique change rarement)
        maxCacheSize: 2000,
        cacheTimeout: 900000, // 15 minutes

        // Gestion spéciale pour Duda
        skipCommonStaticPaths: true,
        staticPathsToSkip: [
          '/dmapi/', '/websiteserverdefault/', '/sites/multiscreen_preview/',
          '/services/', '/api/', '/_dm/', '/favicon.ico'
        ],

        // Optimisations performance sites rapides
        enableTurboMode: true,
        turboModeThreshold: 1000, // Active le mode turbo si < 1s/page
        maxTurboRequests: 25
      };
    } else if (siteType === 'wordpress') {
      console.log('[ServiceWorker] WordPress site detected - applying WP-specific optimizations');

      // Optimisations spécifiques WordPress (conservées)
      finalConfig = {
        ...finalConfig,
        followRedirects: true,
        maxRedirects: 3,
        maxCacheSize: 1500,
        cacheTimeout: 600000, // 10 minutes
        skipCommonWpPaths: true,
        wpPathsToSkip: [
          '/wp-admin/', '/wp-content/uploads/', '/wp-includes/',
          '/feed/', '/comments/', '/trackback/', '/xmlrpc.php'
        ]
      };
    }

    console.log(`[ServiceWorker] Final ${siteType} configuration:`, finalConfig);

    // Créer l'instance avec la configuration optimisée
    webScanner = new WebScanner(corsManager, finalConfig);

    // Stocker les paramètres d'analyse
    await chrome.storage.local.set({
      'webScannerActive': true,
      'webScannerParams': {
        domain: normalizedDomain,
        searchQuery,
        useRegex,
        caseSensitive,
        searchMode,
        startTime: Date.now(),
        siteType: siteType,
        config: finalConfig
      },
      'webScannerResults': [],
      'webScannerSummary': null
    });

    // Démarrer le scan avec monitoring adapté au type de site
    startScanWithAdaptiveMonitoring(webScanner, {
      domain: normalizedDomain,
      searchQuery,
      useRegex,
      caseSensitive,
      searchMode
    }, siteType);

  } catch (e) {
    console.error('[ServiceWorker] Invalid URL:', e);
    if (sendResponse) {
      sendResponse({
        status: 'error',
        message: 'URL invalide. Assurez-vous d\'inclure http:// ou https://'
      });
    }
  }

  return true;
}

// Fonction pour détecter le type de site (WordPress, Duda, statique, etc.)
async function detectSiteType(domain) {
  try {
    // Vérifications parallèles pour optimiser la détection
    const [robotsCheck, homeCheck, generatorCheck] = await Promise.allSettled([
      checkRobotsForIndicators(domain),
      checkHomePageHeaders(domain),
      checkGeneratorMeta(domain)
    ]);

    const results = {
      wordpress: false,
      duda: false,
      static: false,
      confidence: 0
    };

    // Analyser les résultats des vérifications
    if (robotsCheck.status === 'fulfilled') {
      Object.assign(results, robotsCheck.value);
    }

    if (homeCheck.status === 'fulfilled') {
      Object.assign(results, homeCheck.value);
    }

    if (generatorCheck.status === 'fulfilled') {
      Object.assign(results, generatorCheck.value);
    }

    // Déterminer le type de site avec confiance
    if (results.wordpress && results.confidence > 0.7) {
      return 'wordpress';
    } else if (results.duda && results.confidence > 0.6) {
      return 'duda';
    } else if (results.static && results.confidence > 0.5) {
      return 'static';
    } else if (results.wordpress) {
      return 'wordpress';
    } else {
      return 'static'; // Défaut pour sites non identifiés
    }

  } catch (error) {
    console.log('[ServiceWorker] Site type detection failed:', error);
    return 'static'; // Défaut conservateur
  }
}

// Vérification via robots.txt
async function checkRobotsForIndicators(domain) {
  try {
    const robotsResponse = await fetch(`${domain}/robots.txt`, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebScanner/2.0)' }
    });

    if (!robotsResponse.ok) return { confidence: 0 };

    const robotsText = await robotsResponse.text().catch(() => '');

    const results = { wordpress: false, duda: false, static: false, confidence: 0 };

    // Indicateurs WordPress
    const wpIndicators = ['/wp-content/', '/wp-includes/', '/wp-admin/', '/wp-json/', 'wp-login.php'];
    const wpMatches = wpIndicators.filter(indicator => robotsText.includes(indicator)).length;
    if (wpMatches > 0) {
      results.wordpress = true;
      results.confidence += wpMatches * 0.2;
    }

    // Indicateurs Duda
    const dudaIndicators = ['/dmapi/', 'duda.', 'dudaone.com', '/sites/'];
    const dudaMatches = dudaIndicators.filter(indicator => robotsText.includes(indicator)).length;
    if (dudaMatches > 0) {
      results.duda = true;
      results.confidence += dudaMatches * 0.3;
    }

    // Indicateurs sites statiques
    const staticIndicators = ['sitemap.xml', 'User-agent: *', 'Disallow:'];
    const staticMatches = staticIndicators.filter(indicator => robotsText.includes(indicator)).length;
    if (staticMatches > 0 && !results.wordpress && !results.duda) {
      results.static = true;
      results.confidence += 0.3;
    }

    return results;

  } catch (error) {
    return { confidence: 0 };
  }
}

// Vérification via headers de la page d'accueil
async function checkHomePageHeaders(domain) {
  try {
    const homeResponse = await fetch(domain, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebScanner/2.0)' }
    });

    const results = { wordpress: false, duda: false, static: false, confidence: 0 };

    // Vérifier les headers
    const server = homeResponse.headers.get('server') || '';
    const xPoweredBy = homeResponse.headers.get('x-powered-by') || '';
    const via = homeResponse.headers.get('via') || '';

    // Indicateurs WordPress
    if (server.toLowerCase().includes('apache') || xPoweredBy.toLowerCase().includes('php')) {
      results.wordpress = true;
      results.confidence += 0.3;
    }

    // Indicateurs Duda
    if (server.toLowerCase().includes('duda') || via.toLowerCase().includes('duda')) {
      results.duda = true;
      results.confidence += 0.5;
    }

    // Indicateurs sites statiques (CDN, etc.)
    const staticServers = ['cloudflare', 'netlify', 'vercel', 'github', 'amazonaws'];
    if (staticServers.some(s => server.toLowerCase().includes(s))) {
      results.static = true;
      results.confidence += 0.4;
    }

    return results;

  } catch (error) {
    return { confidence: 0 };
  }
}

// Vérification via meta generator
async function checkGeneratorMeta(domain) {
  try {
    const homeResponse = await fetch(domain, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebScanner/2.0)' }
    });

    if (!homeResponse.ok) return { confidence: 0 };

    const html = await homeResponse.text();
    const results = { wordpress: false, duda: false, static: false, confidence: 0 };

    // Recherche du meta generator
    const generatorMatch = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
    const generator = generatorMatch ? generatorMatch[1].toLowerCase() : '';

    // Recherche d'autres indicateurs dans le HTML
    if (generator.includes('wordpress') || html.includes('wp-content') || html.includes('wp-includes')) {
      results.wordpress = true;
      results.confidence += 0.6;
    }

    if (generator.includes('duda') || html.includes('dudaone.com') || html.includes('dmapi')) {
      results.duda = true;
      results.confidence += 0.7;
    }

    // Indicateurs sites statiques
    const staticGenerators = ['hugo', 'jekyll', 'gatsby', 'next.js', 'nuxt', 'gridsome'];
    if (staticGenerators.some(g => generator.includes(g)) ||
      (!results.wordpress && !results.duda && html.length < 50000)) {
      results.static = true;
      results.confidence += 0.4;
    }

    return results;

  } catch (error) {
    return { confidence: 0 };
  }
}

// Fonction de monitoring adaptatif selon le type de site
async function startScanWithAdaptiveMonitoring(scanner, config, siteType) {
  try {
    // Monitoring en temps réel adapté au type de site
    const monitoringInterval = setInterval(() => {
      if (!scanner.isScanning) {
        clearInterval(monitoringInterval);
        return;
      }

      const progress = scanner.getProgress();
      const metrics = scanner.performanceMetrics;

      // Adaptation automatique selon le type de site
      if (progress.current > 50 && progress.current % 25 === 0) {
        if (siteType === 'static' || siteType === 'duda') {
          adaptStaticSiteConfiguration(scanner, metrics);
        } else {
          adaptWordPressConfiguration(scanner, metrics);
        }
      }

      // Log des performances adaptés au type de site
      if (progress.current % 50 === 0) {
        console.log(`[${siteType.toUpperCase()} Monitor]`, {
          pages: `${progress.current}/${progress.total}`,
          avgTime: `${Math.round(metrics.avgRequestTime)}ms`,
          successRate: `${Math.round(metrics.successRate * 100)}%`,
          cacheHits: scanner.responseCache.size,
          siteType: siteType
        });
      }

    }, siteType === 'static' ? 3000 : 5000); // Monitoring plus fréquent pour sites rapides

    // Démarrer le scan
    await scanner.startScan(config);

    console.log(`[ServiceWorker] ${siteType} scan completed successfully`);

  } catch (error) {
    console.error(`[ServiceWorker] ${siteType} scan failed:`, error);
    chrome.runtime.sendMessage({
      action: 'webScannerError',
      error: error.message,
      context: `${siteType} scan`
    });
  }
}

// Adaptation dynamique pour sites statiques/Duda
function adaptStaticSiteConfiguration(scanner, metrics) {
  const currentOptions = scanner.options;
  let newOptions = {};

  // Si les performances sont exceptionnelles - mode turbo
  if (metrics.avgRequestTime < 800 && metrics.successRate > 0.98) {
    newOptions = {
      batchSize: Math.min(50, Math.floor(currentOptions.batchSize * 1.6)),
      maxConcurrentRequests: Math.min(25, Math.floor(currentOptions.maxConcurrentRequests * 1.5)),
      batchDelay: Math.max(50, Math.floor(currentOptions.batchDelay * 0.6)),
      requestTimeout: Math.max(2000, Math.floor(currentOptions.requestTimeout * 0.8))
    };
    console.log('[Static Adapter] Activating TURBO mode - exceptional performance detected');
  }

  // Si les performances se dégradent (anormal pour un site statique)
  else if (metrics.avgRequestTime > 3000 || metrics.successRate < 0.9) {
    newOptions = {
      batchSize: Math.max(5, Math.floor(currentOptions.batchSize * 0.6)),
      maxConcurrentRequests: Math.max(3, Math.floor(currentOptions.maxConcurrentRequests * 0.7)),
      batchDelay: Math.min(500, currentOptions.batchDelay * 1.8),
      requestTimeout: Math.min(8000, currentOptions.requestTimeout * 1.3)
    };
    console.log('[Static Adapter] Reducing load - unexpected slowdown detected');
  }

  // Si bonnes performances mais pas exceptionnelles
  else if (metrics.avgRequestTime < 2000 && metrics.successRate > 0.95) {
    newOptions = {
      batchSize: Math.min(35, Math.floor(currentOptions.batchSize * 1.2)),
      maxConcurrentRequests: Math.min(15, Math.floor(currentOptions.maxConcurrentRequests * 1.1)),
      batchDelay: Math.max(80, Math.floor(currentOptions.batchDelay * 0.9))
    };
    console.log('[Static Adapter] Increasing performance - good metrics detected');
  }

  if (Object.keys(newOptions).length > 0) {
    scanner.updateOptions(newOptions);
    console.log('[Static Adapter] New options:', newOptions);
  }
}

// Adaptation dynamique de la configuration WordPress (conservée et améliorée)
function adaptWordPressConfiguration(scanner, metrics) {
  const currentOptions = scanner.options;
  let newOptions = {};

  // Si les performances se dégradent
  if (metrics.avgRequestTime > 6000 || metrics.successRate < 0.8) {
    newOptions = {
      batchSize: Math.max(3, Math.floor(currentOptions.batchSize * 0.7)),
      maxConcurrentRequests: Math.max(2, Math.floor(currentOptions.maxConcurrentRequests * 0.8)),
      batchDelay: Math.min(1000, currentOptions.batchDelay * 1.5),
      requestTimeout: Math.min(15000, currentOptions.requestTimeout * 1.2)
    };
    console.log('[WordPress Adapter] Reducing load due to poor performance');
  }

  // Si les performances sont bonnes
  else if (metrics.avgRequestTime < 3000 && metrics.successRate > 0.95) {
    newOptions = {
      batchSize: Math.min(25, Math.floor(currentOptions.batchSize * 1.2)),
      maxConcurrentRequests: Math.min(12, Math.floor(currentOptions.maxConcurrentRequests * 1.1)),
      batchDelay: Math.max(100, Math.floor(currentOptions.batchDelay * 0.9)),
      requestTimeout: Math.max(5000, Math.floor(currentOptions.requestTimeout * 0.9))
    };
    console.log('[WordPress Adapter] Increasing performance due to good metrics');
  }

  if (Object.keys(newOptions).length > 0) {
    scanner.updateOptions(newOptions);
    console.log('[WordPress Adapter] New options:', newOptions);
  }
}

// GESTION AMÉLIORÉE DES ERREURS WORDPRESS
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  try {
    // Déléguer la gestion CORS au manager moderne
    if (corsManager.handleMessage(request, sender, sendResponse)) {
      return true;
    }

    switch (request.action) {
      case 'startWebScanner':
        return await handleStartWebScanner(request, sendResponse);

      case 'getOptimizationTips':
        if (webScanner) {
          const storedParams = await chrome.storage.local.get(['webScannerParams']);
          const siteType = storedParams.webScannerParams?.siteType || 'unknown';
          const tips = generateOptimizationTips(webScanner, siteType);
          sendResponse({ status: 'success', tips, siteType });
        } else {
          sendResponse({ status: 'error', message: 'Aucun scan actif' });
        }
        return true;

      // ... autres cases existantes ...
    }
  } catch (error) {
    console.error("[WordPress Messages] Error handling message:", error);
    sendResponse?.({ status: 'error', message: error.message, context: 'WordPress handler' });
    return true;
  }
});

// Conseils d'optimisation basés sur les métriques et le type de site
function generateOptimizationTips(scanner, siteType) {
  const metrics = scanner.performanceMetrics;
  const progress = scanner.getProgress();
  const tips = [];

  // Conseils généraux basés sur les performances
  if (siteType === 'static' || siteType === 'duda') {
    // Conseils spécifiques aux sites statiques
    if (metrics.avgRequestTime > 2000) {
      tips.push({
        type: 'warning',
        message: 'Site statique anormalement lent',
        suggestion: 'Vérifier la connexion réseau ou la charge du CDN. Sites statiques devraient répondre en < 2s'
      });
    }

    if (metrics.successRate < 0.95) {
      tips.push({
        type: 'warning',
        message: 'Taux d\'échec inhabituel pour un site statique',
        suggestion: 'Problème potentiel de CDN ou de configuration serveur'
      });
    }

    if (metrics.avgRequestTime < 1000 && metrics.successRate > 0.98) {
      tips.push({
        type: 'success',
        message: 'Performances exceptionnelles détectées',
        suggestion: 'Mode TURBO disponible - le scanner peut être accéléré davantage'
      });
    }

    if (scanner.responseCache.size > 50) {
      tips.push({
        type: 'info',
        message: 'Cache efficace sur site statique',
        suggestion: `${scanner.responseCache.size} pages en cache optimisent les requêtes répétées`
      });
    }

  } else if (siteType === 'wordpress') {
    // Conseils spécifiques WordPress (conservés)
    if (metrics.avgRequestTime > 5000) {
      tips.push({
        type: 'warning',
        message: 'Site WordPress lent détecté',
        suggestion: 'Considérer réduire la concurrence ou analyser en heures creuses'
      });
    }

    if (metrics.successRate < 0.9) {
      tips.push({
        type: 'warning',
        message: 'Taux d\'échec élevé',
        suggestion: 'Le serveur WordPress pourrait être surchargé ou avoir des plugins lourds'
      });
    }

    if (scanner.responseCache.size > 100) {
      tips.push({
        type: 'success',
        message: 'Cache efficace',
        suggestion: `${scanner.responseCache.size} pages en cache évitent des requêtes répétées`
      });
    }

  } else {
    // Conseils génériques pour sites non identifiés
    tips.push({
      type: 'info',
      message: 'Type de site non identifié',
      suggestion: 'Configuration adaptative activée pour optimiser automatiquement'
    });
  }

  // Conseils basés sur les options actuelles
  const currentBatchSize = scanner.options.batchSize;
  if (currentBatchSize < 5) {
    tips.push({
      type: 'info',
      message: 'Mode conservateur activé',
      suggestion: 'Configuration réduite pour préserver les performances du serveur'
    });
  } else if (currentBatchSize > 30) {
    tips.push({
      type: 'success',
      message: 'Mode haute performance activé',
      suggestion: 'Le serveur supporte bien la charge élevée'
    });
  }

  // Conseils d'optimisation générale
  if (progress.current > 100) {
    const pagesPerSecond = progress.current / ((Date.now() - (scanner.startTime || Date.now())) / 1000);
    if (pagesPerSecond > 2) {
      tips.push({
        type: 'success',
        message: `Vitesse excellente: ${pagesPerSecond.toFixed(1)} pages/seconde`,
        suggestion: 'Performance optimale atteinte'
      });
    } else if (pagesPerSecond < 0.5) {
      tips.push({
        type: 'info',
        message: `Vitesse: ${pagesPerSecond.toFixed(1)} pages/seconde`,
        suggestion: 'Considérer analyser en heures creuses pour de meilleures performances'
      });
    }
  }

  return tips;
}

/**
 * Arrête l'analyse Web Scanner en cours
 */
async function handleStopWebScanner(sendResponse) {
  if (webScanner && webScanner.isScanning) {
    await webScanner.stop();
    sendResponse({ status: 'stopped' });
  } else {
    sendResponse({ status: 'error', message: 'Aucun scan en cours' });
  }
  return true;
}

/**
 * Retourne le statut actuel de l'analyse
 */
function handleGetWebScannerStatus(sendResponse) {
  if (webScanner) {
    const progress = webScanner.getProgress();
    const summary = webScanner.getSummary();
    sendResponse({
      active: webScanner.isScanning,
      progress: progress,
      summary: summary
    });
  } else {
    sendResponse({ active: false });
  }
  return true;
}

/**
 * Récupère les résultats stockés de la dernière analyse
 */
async function handleGetWebScannerResults(sendResponse) {
  try {
    const data = await chrome.storage.local.get(['webScannerResults', 'webScannerSummary']);
    sendResponse({
      status: 'success',
      results: data.webScannerResults || [],
      summary: data.webScannerSummary || null
    });
  } catch (error) {
    sendResponse({
      status: 'error',
      message: error.message
    });
  }
  return true;
}

/**
 * Efface les résultats stockés
 */
async function handleClearWebScannerResults(sendResponse) {
  try {
    await chrome.storage.local.remove(['webScannerResults', 'webScannerSummary']);

    // Nettoyer l'instance en cours aussi
    if (webScanner) {
      await webScanner.cleanup();
      webScanner = null;
    }

    sendResponse({ status: 'success' });
  } catch (error) {
    sendResponse({ status: 'error', message: error.message });
  }
  return true;
}

/**
 * Retourne des statistiques détaillées sur l'analyse en cours
 */
function handleGetWebScannerStats(sendResponse) {
  if (webScanner) {
    const stats = {
      isScanning: webScanner.isScanning,
      analysisId: webScanner.analysisId,
      domain: webScanner.domain,
      searchMode: webScanner.searchMode,
      sitemapSize: webScanner.sitemap.length,
      currentResults: webScanner.results.length,
      progress: webScanner.getProgress(),
      summary: webScanner.getSummary()
    };
    sendResponse({ status: 'success', stats });
  } else {
    sendResponse({ status: 'error', message: 'Aucune analyse active' });
  }
  return true;
}

// === GESTIONNAIRE DE MESSAGES MODERNISÉ ===
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  try {
    // Déléguer la gestion CORS au manager moderne
    if (corsManager.handleMessage(request, sender, sendResponse)) {
      return true;
    }

    // Gestion des analyses avec switch moderne
    switch (request.action) {
      case 'startWebScanner':
        return await handleStartWebScanner(request, sendResponse);

      case 'stopWebScanner':
        return await handleStopWebScanner(sendResponse);

      case 'getWebScannerStatus':
        return handleGetWebScannerStatus(sendResponse);

      case 'getWebScannerResults':
        return await handleGetWebScannerResults(sendResponse);

      case 'clearWebScannerResults':
        return await handleClearWebScannerResults(sendResponse);

      case 'getWebScannerStats':
        return handleGetWebScannerStats(sendResponse);
      case 'startSitemapAnalysis':
        return await handleSitemapAnalysis(request, sendResponse);
      case 'diagnoseWebScanner':
        const diagnosis = await diagnoseWebScanner();
        sendResponse(diagnosis);
        return true;
      case 'verifyWebScannerResults':
        return await handleVerifyWebScannerResults(sendResponse);


      case 'startUrlListAnalysis':
        return await handleUrlListAnalysis(request, sendResponse);

      case 'startCurrentPageAnalysis':
        return await handleCurrentPageAnalysis(request, sendResponse);

      case 'getAnalysisStatus':
        return handleGetAnalysisStatus(sendResponse);

      case 'pauseAnalysis':
        return handlePauseAnalysis(sendResponse);

      case 'resumeAnalysis':
        return handleResumeAnalysis(sendResponse);

      case 'cancelAnalysis':
        return await handleCancelAnalysis(sendResponse);

      case 'linksAnalysisComplete':
        return await handleLinksAnalysisComplete(request, sendResponse);

      case 'getLinksAnalysisStatus':
        return handleGetLinksAnalysisStatus(sendResponse);

      case 'diagnoseCORS':
        return await handleCORSDiagnosis(sendResponse);

      case 'open_interface':
        return await handleOpenInterface(request);

      // === AUTRES MESSAGES ===
      default:
        return handleOtherMessages(request, sender, sendResponse);
    }
  } catch (error) {
    console.error("[Messages] Error handling message:", error);
    sendResponse?.({ status: 'error', message: error.message });
    return true;
  }
});

chrome.runtime.onSuspend.addListener(async () => {
  console.log('[ServiceWorker] Extension suspending, cleaning up WebScanner...');
  if (webScanner) {
    await webScanner.cleanup();
    webScanner = null;
  }
});
/**
 * Diagnostic de l'état du WebScanner
 */
async function diagnoseWebScanner() {
  console.group("🔍 WebScanner Diagnostic Tool");

  try {
    const diagnosis = {
      instanceExists: !!webScanner,
      isScanning: webScanner?.isScanning || false,
      analysisId: webScanner?.analysisId || null,
      corsState: corsManager.getState(),
      storageData: await chrome.storage.local.get(['webScannerResults', 'webScannerSummary']),
      timestamp: Date.now()
    };

    if (webScanner) {
      diagnosis.scannerState = {
        domain: webScanner.domain,
        searchMode: webScanner.searchMode,
        sitemapSize: webScanner.sitemap.length,
        resultsCount: webScanner.results.length,
        progress: webScanner.getProgress()
      };
    }

    console.log("WebScanner diagnosis:", diagnosis);

    // Vérifier les incohérences
    const issues = [];

    if (diagnosis.isScanning && !diagnosis.corsState.isEnabled) {
      issues.push("Scanner actif mais CORS désactivé");
    }

    if (!diagnosis.isScanning && diagnosis.corsState.activeScans.some(scan => scan.includes('web-scanner'))) {
      issues.push("Scanner inactif mais session CORS active");
    }

    if (issues.length > 0) {
      console.warn("Issues detected:", issues);
      diagnosis.issues = issues;

      // Auto-correction
      if (webScanner && !webScanner.isScanning) {
        await webScanner.cleanup();
      }
    }

    return diagnosis;

  } catch (error) {
    console.error("Error during WebScanner diagnosis:", error);
    return {
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    };
  } finally {
    console.groupEnd();
  }
}
// === HANDLERS SPÉCIFIQUES ===
async function handleSitemapAnalysis(request, sendResponse) {
  sendResponse({ status: 'started' });

  chrome.tabs.create({
    url: chrome.runtime.getURL('analysis-progress.html')
  });

  Analyzer.startAnalysis(request.sitemapUrl)
    .then(() => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('results.html')
      });
    })
    .catch(error => {
      console.error('[Handler] Analysis error:', error);
      chrome.runtime.sendMessage({
        action: 'analysisError',
        error: error.message
      });
    });

  return true;
}

async function handleUrlListAnalysis(request, sendResponse) {
  sendResponse({ status: 'started' });

  chrome.tabs.create({
    url: chrome.runtime.getURL('analysis-progress.html')
  });

  Analyzer.startAnalysis(request.urls, 'urlList')
    .then(() => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('results.html')
      });
    })
    .catch(error => {
      console.error('[Handler] Analysis error:', error);
      chrome.runtime.sendMessage({
        action: 'analysisError',
        error: error.message
      });
    });

  return true;
}

async function handleCurrentPageAnalysis(request, sendResponse) {
  try {
    await Analyzer.injectScriptsForAnalysis(request.tabId);
    console.log('[Handler] Page analysis scripts injected successfully');
    sendResponse({ status: 'started' });
  } catch (error) {
    console.error('[Handler] Error during script injection:', error);
    sendResponse({ status: 'error', message: error.message });
  }
  return true;
}

function handleGetAnalysisStatus(sendResponse) {
  const corsState = corsManager.getState();

  if (appState.sitemapAnalyzer) {
    sendResponse({
      active: true,
      isPaused: appState.sitemapAnalyzer.isPaused,
      progress: appState.sitemapAnalyzer.getProgress(),
      corsState
    });
  } else {
    sendResponse({
      active: false,
      corsState
    });
  }
  return true;
}

function handlePauseAnalysis(sendResponse) {
  if (appState.sitemapAnalyzer) {
    appState.sitemapAnalyzer.pause();
    sendResponse({ status: 'paused' });
  } else {
    sendResponse({ status: 'error', message: 'No active analysis' });
  }
  return true;
}

function handleResumeAnalysis(sendResponse) {
  if (appState.sitemapAnalyzer) {
    appState.sitemapAnalyzer.resume();
    sendResponse({ status: 'resumed' });
  } else {
    sendResponse({ status: 'error', message: 'No active analysis' });
  }
  return true;
}

async function handleCancelAnalysis(sendResponse) {
  if (appState.sitemapAnalyzer) {
    const analysisId = appState.sitemapAnalyzer.analysisId || 'unknown-analysis';

    appState.sitemapAnalyzer.cancel();
    appState.sitemapAnalyzer = null;

    try {
      await corsManager.disable(analysisId);
      console.log(`[Handler] CORS disabled after cancelling analysis ${analysisId}`);
      sendResponse({ status: 'cancelled' });
    } catch (error) {
      console.error('[Handler] Error disabling CORS after cancel:', error);
      sendResponse({ status: 'cancelled', error: error.message });
    }
  } else {
    sendResponse({ status: 'error', message: 'No active analysis' });
  }
  return true;
}

async function handleLinksAnalysisComplete(request, sendResponse) {
  console.log('[Handler] Message received: link analysis complete', request.detail);

  await chrome.storage.local.set({
    'linksAnalysisComplete': true,
    'linksAnalysisResults': request.detail,
    'linksAnalysisTimestamp': Date.now()
  });

  Analyzer.checkAllAnalysesComplete();
  sendResponse({ status: 'success' });
  return true;
}

function handleGetLinksAnalysisStatus(sendResponse) {
  chrome.storage.local.get(['linksAnalysisComplete', 'linksAnalysisResults', 'linksAnalysisTimestamp'], (data) => {
    sendResponse({
      complete: data.linksAnalysisComplete || false,
      results: data.linksAnalysisResults || null,
      timestamp: data.linksAnalysisTimestamp || null
    });
  });
  return true;
}

async function handleCORSDiagnosis(sendResponse) {
  sendResponse({ received: true });

  try {
    const result = await corsManager.performHealthCheck();

    await chrome.storage.local.set({
      'corsResult': result,
      'corsResultTimestamp': Date.now()
    });

    chrome.runtime.sendMessage({
      action: 'corsResultReady',
      result
    });
  } catch (error) {
    console.error("[Handler] CORS Diagnosis error:", error);

    await chrome.storage.local.set({
      'corsResult': {
        status: 'error',
        error: error.message,
        details: error.stack
      },
      'corsResultTimestamp': Date.now()
    });

    chrome.runtime.sendMessage({
      action: 'corsResultReady',
      error: true
    });
  }

  return true;
}

async function handleOpenInterface(request) {
  console.log("[Handler] Interface open request received");

  await ProcessStepManager.validate();
  appState.globalData.dataChecker = request.data;
  console.log("[Handler] dataChecker data stored");

  console.log("[Handler] Launch detected soprod tab and snip username");
  detecteSoprod();
  console.log("[Handler] dataChecker data:", request.data);

  const step = await ProcessStepManager.get();
  if (step === 1) {
    await ProcessStepManager.increment();
    console.log("[Handler] Step incremented to 2 (data complete) from interface request");
    await checkDatas(appState.user || "Customer");
  }

  return true;
}

// === FONCTION MANQUANTE AJOUTÉE ===
function handleOtherMessages(request, sender, sendResponse) {
  console.log('[Handler] Processing other message type:', request.action);

  // Gestion des messages fetch pour les content scripts
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

  // Log des messages non traités pour debug
  console.log('[Handler] Unhandled message:', request);
  return false;
}

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
      appState.allTabs.push(...solocalmsTabs);
    } else {
      // No tab with solocalms.fr detected, add only active tab
      const activeTab = await chrome.tabs.query({
        currentWindow: true,
        active: true,
      });
      console.log("Active tab (no Soprod tab):", activeTab);
      appState.allTabs.push(activeTab[0]);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Log detected tabs
    console.log("allTabs:", appState.allTabs);
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

  // Update user in global appState
  appState.user = user;
  appState.globalData.user = user;

  // Validate and get current step
  let step = await ProcessStepManager.validate();

  // If step is 0, go to 1 (user detected)
  // If step is 1, go to 2 (data complete)
  if (step === 0) {
    step = await ProcessStepManager.increment();
    console.log("Step incremented to 1 (user detected)");
  }

  // Si nous avons déjà des données dataChecker stockées, on peut incrémenter à 2
  if (step === 1 && appState.globalData.dataChecker) {
    step = await ProcessStepManager.increment();
    console.log("Step incremented to 2 (data complete)");
  }

  // Check if data is complete
  await checkDatas(user);
};



/**
 * Cette fonction vérifie si un onglet donné correspond à l'URL de Soprod
 * et injecte le script si c'est le cas.
 * @param {number} tabId L'ID de l'onglet à vérifier.
 */
function injectScriptIfSoprod(tabId) {
  // S'assure que tabId est valide
  if (!tabId) {
    return;
  }

  // On récupère les détails de l'onglet pour avoir son URL
  chrome.tabs.get(tabId, (tab) => {
    // Vérifie si l'onglet existe toujours et si son URL est accessible
    // chrome.runtime.lastError est une vérification de sécurité
    if (chrome.runtime.lastError || !tab || !tab.url) {
      // console.error(chrome.runtime.lastError?.message || "Tab or URL not found.");
      return;
    }

    // On vérifie si l'URL de l'onglet correspond au pattern de Soprod
    if (tab.url.includes("solocalms.fr")) {
      console.log(`Tab ${tabId} is a Soprod tab. Injecting script...`);

      // Injection du script depuis le fichier local
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['./Functions/soprodDOMTime.js']
      })
        .then(() => {
          console.log("Script 'soprodDOMTime.js' injected successfully.");
        })
        .catch(err => {
          console.error("Failed to inject script:", err);
        });
    } else {
      console.log(`Tab ${tabId} is not a Soprod tab. No action taken.`);
    }
  });
}

/**
 * Écouteur pour le changement d'onglet actif.
 * Se déclenche lorsque l'utilisateur clique sur un autre onglet.
 */
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("User switched tabs. Checking new active tab...");
  injectScriptIfSoprod(activeInfo.tabId);
});

/**
 * Écouteur pour la mise à jour d'un onglet.
 * Se déclenche lorsqu'une page est chargée ou rechargée.
 * On vérifie que la page est complètement chargée ('complete').
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log("A tab has finished loading. Checking it...");
    injectScriptIfSoprod(tabId);
  }
});

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

  if (!appState.globalData.dataChecker) {
    console.error("dataChecker data missing");
    await ProcessStepManager.reset(); // Reset to allow a new attempt
    return;
  }

  const user = user_soprod || appState.globalData.user || "Customer";
  console.log("User for indexDB:", user);
  appState.globalData.user = user;

  try {
    const dataCheckerParse = JSON.parse(appState.globalData.dataChecker);

    // Store data in local storage
    await chrome.storage.local.set({
      'parsedData': dataCheckerParse,
      'currentUser': user,
      'timestamp': Date.now()
    });

    console.log("Data saved in local storage");

    // Create database
    try {
      createDB(user, appState.dbName, dataCheckerParse);
      console.log("CREATEDB -> launched with data: user =", user, { dbName: appState.dbName });

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
    const corsState = corsManager.getState();
    console.log("Current CORS appState:", corsState);

    // 2. Vérifier la cohérence avec le storage
    const storageData = await chrome.storage.sync.get(["corsEnabled"]);
    console.log("Storage CORS appState:", storageData);

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
      inconsistencies.push("CORS appState mismatch between memory and storage");
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
      await corsManager.forceDisable();

      // Vérifier l'état après correction
      const updatedState = corsManager.getState();
      console.log("CORS appState after correction:", updatedState);

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
  console.log("🛠️ Repairing CORS appState...");

  try {
    // 1. Désactiver complètement CORS
    await corsManager.forceDisable();

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

