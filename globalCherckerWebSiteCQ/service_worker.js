/**
 * Service Worker Modernisé - Health Checker Website
 * Version corrigée avec appState et fonctions manquantes
 */

"use strict";

// === IMPORTS MODERNES ===
import { CORSManager } from "./core/CORSManager.js";
import { createDB } from "./Functions/createIndexDB.js";
import { SitemapAnalyzer } from "./Functions/sitemapAnalyzer.js";
import { CONFIG, initConfig } from "./config.js";

// === INSTANCES GLOBALES ===
const corsManager = new CORSManager();

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

// === GESTIONNAIRE DE MESSAGES MODERNISÉ ===
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  try {
    // Déléguer la gestion CORS au manager moderne
    if (corsManager.handleMessage(request, sender, sendResponse)) {
      return true;
    }

    // Gestion des analyses avec switch moderne
    switch (request.action) {
      case 'startSitemapAnalysis':
        return await handleSitemapAnalysis(request, sendResponse);

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