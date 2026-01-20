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
import { AnalysisCoordinator } from "./api/core/AnalysisCoordinator.js";
import { BatchAnalyzerV5 } from "./api/core/BatchAnalyzerV5.js";
import { OffscreenBatchAnalyzer } from "./api/core/OffscreenBatchAnalyzer.js";



// === INSTANCES GLOBALES ===
const corsManager = new CORSManager();
let webScanner = null;
const analysisCoordinator = new AnalysisCoordinator();
let batchAnalyzerV5 = null;
let offscreenBatchAnalyzer = null;

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

    // Créer une nouvelle instance du scanner
    webScanner = new WebScanner(corsManager);

    // Stocker immédiatement les paramètres d'analyse
    await chrome.storage.local.set({
      'webScannerActive': true,
      'webScannerParams': {
        domain: normalizedDomain,
        searchQuery,
        useRegex,
        caseSensitive,
        searchMode,
        startTime: Date.now()
      },
      'webScannerResults': [], // Réinitialiser les résultats
      'webScannerSummary': null
    });

    // Démarrer le scan en arrière-plan (sans await pour éviter les timeouts)
    webScanner.startScan({
      domain: normalizedDomain,
      searchQuery,
      useRegex,
      caseSensitive,
      searchMode
    }).then(() => {
      console.log('[ServiceWorker] WebScanner analysis completed successfully');
    }).catch(error => {
      console.error('[ServiceWorker] WebScanner analysis failed:', error);
      chrome.runtime.sendMessage({
        action: 'webScannerError',
        error: error.message
      });
    });

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
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // IMPORTANT: Ne pas utiliser async directement sur le listener
  // car cela ferme le canal prématurément. Utiliser une IIFE async à l'intérieur.

  (async () => {
    try {
      // Déléguer la gestion CORS au manager moderne
      if (corsManager.handleMessage(request, sender, sendResponse)) {
        return;
      }

      // Gestion des analyses avec switch moderne
      switch (request.action) {
        case 'startWebScanner':
          await handleStartWebScanner(request, sendResponse);
          break;

        case 'stopWebScanner':
          await handleStopWebScanner(sendResponse);
          break;

        case 'getWebScannerStatus':
          handleGetWebScannerStatus(sendResponse);
          break;

        case 'getWebScannerResults':
          await handleGetWebScannerResults(sendResponse);
          break;

        case 'clearWebScannerResults':
          await handleClearWebScannerResults(sendResponse);
          break;

        case 'getWebScannerStats':
          handleGetWebScannerStats(sendResponse);
          break;

        case 'startSitemapAnalysis':
          await handleSitemapAnalysis(request, sendResponse);
          break;

        case 'diagnoseWebScanner':
          const diagnosis = await diagnoseWebScanner();
          sendResponse(diagnosis);
          break;

        case 'verifyWebScannerResults':
          await handleVerifyWebScannerResults(sendResponse);
          break;


        case 'startUrlListAnalysis':
          await handleUrlListAnalysis(request, sendResponse);
          break;

        case 'startCurrentPageAnalysis':
          await handleCurrentPageAnalysis(request, sendResponse);
          break;

        case 'getAnalysisStatus':
          handleGetAnalysisStatus(sendResponse);
          break;

        case 'pauseAnalysis':
          handlePauseAnalysis(sendResponse);
          break;

        case 'resumeAnalysis':
          handleResumeAnalysis(sendResponse);
          break;

        case 'cancelAnalysis':
          await handleCancelAnalysis(sendResponse);
          break;

        case 'linksAnalysisComplete':
          await handleLinksAnalysisComplete(request, sendResponse);
          break;

        case 'getLinksAnalysisStatus':
          handleGetLinksAnalysisStatus(sendResponse);
          break;

        case 'diagnoseCORS':
          await handleCORSDiagnosis(sendResponse);
          break;

        case 'open_interface':
          await handleOpenInterface(request);
          break;

        // === v5.0 ENDPOINTS ANALYSIS ===
        case 'analyzePageV5':
          handleAnalyzePageV5(request, sender, sendResponse);
          break;

        case 'getAnalysisResultV5':
          await handleGetAnalysisResultV5(request, sendResponse);
          break;

        case 'getAnalysisHistoryV5':
          await handleGetAnalysisHistoryV5(sendResponse);
          break;

        case 'clearAnalysisHistoryV5':
          await handleClearAnalysisHistoryV5(sendResponse);
          break;

        // === v5.0 BATCH ANALYSIS ===
        case 'startBatchAnalysisV5':
          await handleStartBatchAnalysisV5(request, sendResponse);
          break;

        case 'stopBatchAnalysisV5':
          await handleStopBatchAnalysisV5(sendResponse);
          break;

        case 'getBatchStatusV5':
          await handleGetBatchStatusV5(sendResponse);
          break;

        case 'getBatchResultsV5':
          await handleGetBatchResultsV5(sendResponse);
          break;

        // === v5.0 OFFSCREEN BATCH ANALYSIS (NOUVEAU) ===
        case 'startOffscreenBatchAnalysis':
          await handleStartOffscreenBatchAnalysis(request, sendResponse);
          break;

        case 'stopOffscreenBatchAnalysis':
          await handleStopOffscreenBatchAnalysis(sendResponse);
          break;

        case 'getOffscreenBatchStatus':
          handleGetOffscreenBatchStatus(sendResponse);
          break;

        // Messages de l'offscreen document
        case 'offscreenProgress':
          handleOffscreenProgress(request);
          break;

        case 'analyzeUrls':
          // Router vers l'offscreen document
          if (request.target === 'offscreen') {
            await routeToOffscreen(request, sendResponse);
          }
          break;

        case 'analyzeWithTabs':
          // Fallback vers l'ancien système tabs
          await handleAnalyzeWithTabs(request, sendResponse);
          break;

        // === AUTRES MESSAGES ===
        default:
          handleOtherMessages(request, sender, sendResponse);
          break;
      }
    } catch (error) {
      console.error("[Messages] Error handling message:", error);
      sendResponse?.({ status: 'error', message: error.message });
    }
  })();

  // Retourner true pour indiquer une réponse asynchrone
  return true;
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

    // Debug: afficher l'URL pour comprendre le problème
    console.log(`[injectScriptIfSoprod] Checking tab ${tabId}: ${tab.url}`);

    // Ignorer les pages d'extension, chrome://, about:, etc.
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('devtools://')) {
      console.log(`[injectScriptIfSoprod] Skipping protected page: ${tab.url}`);
      return;
    }

    // On vérifie si l'URL de l'onglet correspond au pattern de Soprod
    if (tab.url.includes("solocalms.fr")) {
      console.log(`🎯 Tab ${tabId} is a Soprod tab. Injecting script...`);

      // Injection du script depuis le fichier local
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['./Functions/soprodDOMTime.js']
      })
        .then(() => {
          console.log("✅ Script 'soprodDOMTime.js' injected successfully.");
        })
        .catch(err => {
          // Injection peut échouer si la page est en cours de chargement ou a des restrictions
          // Ce n'est pas critique, donc on log juste en warning
          console.warn("⚠️ Could not inject script (page may be loading or have CSP restrictions):", err.message);
          // Note: Pas besoin de logger l'URL complète, déjà loggée plus haut
        });
    }
  });
}

/**
 * Écouteur pour le changement d'onglet actif.
 * Se déclenche lorsque l'utilisateur clique sur un autre onglet.
 */
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("👆 User switched tabs. Checking new active tab...");
  injectScriptIfSoprod(activeInfo.tabId);
});

/**
 * Écouteur pour la mise à jour d'un onglet.
 * Se déclenche lorsqu'une page est chargée ou rechargée.
 * On vérifie que la page est complètement chargée ('complete').
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Log pour debug
  if (changeInfo.status) {
    console.log(`📊 Tab ${tabId} status changed to: ${changeInfo.status}`);
  }

  if (changeInfo.status === 'complete') {
    console.log("🔄 A tab has finished loading. Checking it...");
    injectScriptIfSoprod(tabId);
  }
});

/**
 * Écouteur optionnel pour les nouvelles fenêtres/onglets créés.
 * Utile si l'utilisateur ouvre la page dans un nouvel onglet.
 */
chrome.tabs.onCreated.addListener((tab) => {
  console.log(`🆕 New tab created: ${tab.id}`);
  // Note: l'URL n'est pas toujours disponible immédiatement lors de la création
  // Le onUpdated se chargera de l'injection une fois la page chargée
});

/**
 * Écouteur pour l'installation/mise à jour de l'extension.
 * Permet d'injecter le script sur les onglets déjà ouverts lors de l'installation.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`🔧 Extension installed/updated. Reason: ${details.reason}`);

  try {
    // Récupère tous les onglets ouverts
    const tabs = await chrome.tabs.query({});

    // Vérifie chaque onglet pour voir s'il s'agit d'une page Soprod
    for (const tab of tabs) {
      if (tab.url && tab.url.includes("solocalms.fr")) {
        console.log(`🔄 Found existing Soprod tab: ${tab.id}`);
        // Petite pause pour laisser l'extension s'initialiser complètement
        setTimeout(() => {
          injectScriptIfSoprod(tab.id);
        }, 1000);
      }
    }
  } catch (error) {
    console.error("❌ Error during installation check:", error);
  }
});

/**
 * Optionnel : Écouteur pour la navigation via webNavigation API
 * Plus fiable que tabs.onUpdated dans certains cas
 * Nécessite la permission "webNavigation" dans manifest.json
 */
if (chrome.webNavigation) {
  chrome.webNavigation.onCompleted.addListener((details) => {
    // Vérifie que c'est le frame principal (pas un iframe)
    if (details.frameId === 0) {
      console.log(`🧭 Navigation completed for tab ${details.tabId}`);
      // Petit délai pour s'assurer que le DOM est stable
      setTimeout(() => {
        injectScriptIfSoprod(details.tabId);
      }, 500);
    }
  });
}


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


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    (async () => {
      const result = await repairCORSState();
      sendResponse(result);
    })();
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

// ========================================
// v5.0 HANDLERS - NEW ENDPOINTS ARCHITECTURE
// ========================================

/**
 * Initialise l'AnalysisCoordinator au démarrage
 */
(async () => {
  try {
    await analysisCoordinator.init();
    console.log('[v5.0] AnalysisCoordinator initialized successfully');
  } catch (error) {
    console.error('[v5.0] Failed to initialize AnalysisCoordinator:', error);
  }
})();

/**
 * Handler pour analyser une page avec la v5.0
 */
function handleAnalyzePageV5(request, sender, sendResponse) {
  console.log('[v5.0] Starting page analysis...', request);

  const tabId = sender.tab?.id || request.tabId;

  if (!tabId) {
    sendResponse({
      success: false,
      error: 'No tab ID provided'
    });
    return true;
  }

  // Marquer l'analyse comme en cours
  chrome.storage.local.set({
    v5_analysis_status: {
      inProgress: true,
      startTime: Date.now(),
      tabId: tabId
    }
  });

  // Répondre immédiatement que l'analyse a démarré
  sendResponse({
    success: true,
    started: true,
    message: 'Analysis started'
  });

  // Analyser la page de manière asynchrone
  analysisCoordinator.analyzePage(tabId, request.options || {})
    .then(result => {
      console.log('[v5.0] Analysis complete, notifying popup');

      // Sauvegarder le statut de fin d'analyse
      chrome.storage.local.set({
        v5_analysis_status: {
          inProgress: false,
          completed: true,
          endTime: Date.now(),
          tabId: tabId,
          result: {
            url: result.url,
            globalScore: result.globalScore,
            level: result.level,
            timestamp: result.timestamp
          }
        }
      });

      // Envoyer un message aux popups/pages ouvertes
      chrome.runtime.sendMessage({
        action: 'analysisV5Complete',
        tabId: tabId,
        result: {
          url: result.url,
          globalScore: result.globalScore,
          level: result.level,
          timestamp: result.timestamp
        }
      }).catch(err => {
        // Pas grave si aucun listener (popup fermé)
        console.log('[v5.0] No listeners for completion message:', err.message);
      });
    })
    .catch(error => {
      console.error('[v5.0] Analysis error:', error);

      // Sauvegarder l'erreur
      chrome.storage.local.set({
        v5_analysis_status: {
          inProgress: false,
          error: true,
          errorMessage: error.message,
          endTime: Date.now(),
          tabId: tabId
        }
      });

      // Envoyer un message d'erreur
      chrome.runtime.sendMessage({
        action: 'analysisV5Error',
        tabId: tabId,
        error: error.message
      }).catch(err => {
        console.log('[v5.0] No listeners for error message:', err.message);
      });
    });

  // Retourner true pour garder le canal ouvert (même si on a déjà répondu)
  return true;
}

/**
 * Handler pour récupérer un résultat d'analyse
 */
async function handleGetAnalysisResultV5(request, sendResponse) {
  try {
    const { url } = request;

    if (!url) {
      sendResponse({
        success: false,
        error: 'URL is required'
      });
      return true;
    }

    // Essayer le cache d'abord
    let result = analysisCoordinator.getCachedResult(url);

    // Sinon, essayer le storage
    if (!result) {
      result = await analysisCoordinator.getFromStorage(url);
    }

    sendResponse({
      success: !!result,
      data: result
    });

  } catch (error) {
    console.error('[v5.0] Get result error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return true;
}

/**
 * Handler pour récupérer l'historique des analyses
 */
async function handleGetAnalysisHistoryV5(sendResponse) {
  try {
    const history = await analysisCoordinator.getAllStoredResults();

    sendResponse({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('[v5.0] Get history error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return true;
}

/**
 * Handler pour effacer l'historique des analyses
 */
async function handleClearAnalysisHistoryV5(sendResponse) {
  try {
    await analysisCoordinator.clearAllResults();

    sendResponse({
      success: true,
      message: 'Analysis history cleared'
    });

  } catch (error) {
    console.error('[v5.0] Clear history error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return true;
}

// ========================================
// v5.0 BATCH ANALYSIS HANDLERS
// ========================================

/**
 * Handler pour démarrer une analyse batch v5.0
 */
async function handleStartBatchAnalysisV5(request, sendResponse) {
  try {
    console.log('[v5.0 Batch] Starting batch analysis...', request);

    const { type, data, options } = request;

    // Créer une nouvelle instance de BatchAnalyzerV5
    batchAnalyzerV5 = new BatchAnalyzerV5();

    // Callback pour les updates de progression
    batchAnalyzerV5.onProgress = (progress) => {
      // Broadcast progress à tous les onglets
      chrome.runtime.sendMessage({
        action: 'batchProgressUpdate',
        progress: progress
      });
    };

    // Démarrer l'analyse en arrière-plan
    let analysisPromise;

    if (type === 'sitemap') {
      analysisPromise = batchAnalyzerV5.analyzeFromSitemap(data, options);
    } else if (type === 'urlList') {
      const urls = data.split(',').map(url => url.trim()).filter(Boolean);
      analysisPromise = batchAnalyzerV5.analyzeFromURLList(urls, options);
    } else {
      throw new Error(`Unknown batch type: ${type}`);
    }

    // Répondre immédiatement que l'analyse a démarré
    sendResponse({
      success: true,
      message: 'Batch analysis started',
      analysisId: batchAnalyzerV5.analysisId
    });

    // Continuer l'analyse en arrière-plan
    analysisPromise.then(results => {
      console.log('[v5.0 Batch] Analysis complete:', results);

      // Notifier la completion
      chrome.runtime.sendMessage({
        action: 'batchAnalysisComplete',
        results: results
      });

    }).catch(error => {
      console.error('[v5.0 Batch] Analysis error:', error);

      // Notifier l'erreur
      chrome.runtime.sendMessage({
        action: 'batchAnalysisError',
        error: error.message
      });
    });

  } catch (error) {
    console.error('[v5.0 Batch] Start error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return true;
}

/**
 * Handler pour arrêter l'analyse batch
 */
async function handleStopBatchAnalysisV5(sendResponse) {
  try {
    if (!batchAnalyzerV5) {
      sendResponse({
        success: false,
        error: 'No batch analysis in progress'
      });
      return true;
    }

    batchAnalyzerV5.stop();

    sendResponse({
      success: true,
      message: 'Batch analysis stopped'
    });

  } catch (error) {
    console.error('[v5.0 Batch] Stop error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return true;
}

/**
 * Handler pour récupérer le status de l'analyse batch
 */
async function handleGetBatchStatusV5(sendResponse) {
  try {
    if (!batchAnalyzerV5) {
      sendResponse({
        success: true,
        status: {
          isAnalyzing: false,
          progress: { total: 0, completed: 0, failed: 0, percentage: 0 }
        }
      });
      return true;
    }

    const status = batchAnalyzerV5.getStatus();

    sendResponse({
      success: true,
      status: status
    });

  } catch (error) {
    console.error('[v5.0 Batch] Get status error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return true;
}

/**
 * Handler pour récupérer les résultats de l'analyse batch
 */
async function handleGetBatchResultsV5(sendResponse) {
  try {
    if (!batchAnalyzerV5) {
      sendResponse({
        success: false,
        error: 'No batch analysis results available'
      });
      return true;
    }

    const results = {
      summary: batchAnalyzerV5.aggregateResults(),
      results: batchAnalyzerV5.results,
      errors: batchAnalyzerV5.errors,
      progress: batchAnalyzerV5.progress
    };

    sendResponse({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('[v5.0 Batch] Get results error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return true;
}

// ============================================================================
// OFFSCREEN BATCH ANALYSIS HANDLERS (v5.0 - NEW)
// ============================================================================

/**
 * Handler pour démarrer une analyse batch avec offscreen
 */
async function handleStartOffscreenBatchAnalysis(request, sendResponse) {
  try {
    const { urls, sitemapUrl, config = {} } = request;

    console.log('[Offscreen Batch] Starting analysis...', {
      urlCount: urls?.length,
      sitemapUrl
    });

    // Créer l'instance si nécessaire
    if (!offscreenBatchAnalyzer) {
      offscreenBatchAnalyzer = new OffscreenBatchAnalyzer({
        autoDetect: true,
        preferOffscreen: true,
        maxConcurrentOffscreen: 5,
        maxConcurrentTabs: 3
      });

      // Configurer les listeners
      offscreenBatchAnalyzer.on('progress', (progress) => {
        console.log('[Offscreen Batch] Progress:', progress);
        // Notifier le popup
        chrome.runtime.sendMessage({
          action: 'offscreenBatchProgress',
          progress
        }).catch(() => {
          // Popup peut être fermé, ignorer l'erreur
        });
      });

      offscreenBatchAnalyzer.on('methodSelected', (detection) => {
        console.log('[Offscreen Batch] Method selection:', detection.stats);
      });

      offscreenBatchAnalyzer.on('error', (error) => {
        console.error('[Offscreen Batch] Error:', error);
      });
    }

    // Activer CORS
    await corsManager.enable('offscreen-batch');

    // Lancer l'analyse
    let results;
    if (sitemapUrl) {
      results = await offscreenBatchAnalyzer.analyzeFromSitemap(sitemapUrl, config);
    } else if (urls && urls.length > 0) {
      results = await offscreenBatchAnalyzer.analyzeBatch(urls, config);
    } else {
      throw new Error('URLs or sitemap URL required');
    }

    // Sauvegarder les résultats
    await chrome.storage.local.set({
      offscreenBatchResults: results,
      offscreenBatchTimestamp: Date.now()
    });

    console.log('[Offscreen Batch] Analysis complete:', results.stats);

    sendResponse({
      success: true,
      results: results.success,
      errors: results.errors,
      stats: results.stats
    });

  } catch (error) {
    console.error('[Offscreen Batch] Analysis error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  } finally {
    // Désactiver CORS
    await corsManager.disable('offscreen-batch');
  }

  return true;
}

/**
 * Handler pour arrêter l'analyse offscreen
 */
async function handleStopOffscreenBatchAnalysis(sendResponse) {
  try {
    if (offscreenBatchAnalyzer) {
      await offscreenBatchAnalyzer.cancel();
      console.log('[Offscreen Batch] Analysis cancelled');
    }

    sendResponse({ success: true });

  } catch (error) {
    console.error('[Offscreen Batch] Stop error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return true;
}

/**
 * Handler pour obtenir le statut de l'analyse offscreen
 */
function handleGetOffscreenBatchStatus(sendResponse) {
  try {
    const status = offscreenBatchAnalyzer
      ? offscreenBatchAnalyzer.getStatus()
      : { isAnalyzing: false };

    sendResponse({
      success: true,
      status
    });

  } catch (error) {
    console.error('[Offscreen Batch] Get status error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }

  return false; // Sync response
}

/**
 * Handler pour les messages de progression de l'offscreen document
 */
function handleOffscreenProgress(request) {
  const { progress } = request;

  console.log('[Offscreen] Progress update:', progress);

  // Relayer au popup si ouvert
  chrome.runtime.sendMessage({
    action: 'offscreenBatchProgress',
    progress
  }).catch(() => {
    // Ignorer si popup fermé
  });
}

/**
 * Router un message vers l'offscreen document
 */
async function routeToOffscreen(request, sendResponse) {
  try {
    // Vérifier que l'offscreen document existe
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (contexts.length === 0) {
      throw new Error('Offscreen document not available');
    }

    // Le message sera reçu par l'offscreen document
    // La réponse sera gérée par le listener dans offscreen-analyzer.js

  } catch (error) {
    console.error('[Offscreen] Route error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handler pour analyser avec tabs (fallback)
 */
async function handleAnalyzeWithTabs(request, sendResponse) {
  try {
    const { urls, config = {} } = request;

    console.log('[Tab Analysis] Analyzing', urls.length, 'URLs with tabs (fallback)');

    // Utiliser le BatchAnalyzerV5 existant
    if (!batchAnalyzerV5) {
      batchAnalyzerV5 = new BatchAnalyzerV5();
    }

    const results = await batchAnalyzerV5.analyzeFromURLList(urls, config);

    sendResponse({
      success: true,
      results: results.results || [],
      errors: results.errors || []
    });

  } catch (error) {
    console.error('[Tab Analysis] Error:', error);
    sendResponse({
      success: false,
      error: error.message,
      results: [],
      errors: []
    });
  }

  return true;
}

