"use strict";

import { creatDB } from "./Functions/creatIndexDB.js";
import { SitemapAnalyzer } from "./Functions/sitemapAnalyzer.js";
import { CONFIG, initConfig } from "./config.js";

// ==================== INITIALISATION ET CONFIGURATION ====================

// Variables globales
let config;
let sitemapAnalyzer = null;
let user_soprod;
let allTabs = [];
let global_data = {};
const db_name = "db_datas_checker";

// Compteurs pour les processus asynchrones
let cmp = 0;
let cmpInterval = 0;

// Initialisation de la configuration
const initialize = async () => {
  // Initialiser la configuration
  config = await initConfig();
  console.log("Configuration initialisée:", config);

  // Initialiser la gestion des CORS
  setupCORSLifecycle();

  // Détecter les onglets Soprod au démarrage
  detectTabsAndInterfaces();
};

// Appel immédiat à l'initialisation
initialize();

// Liste des ressources à mettre en cache
const resourcesToCache = [
  "./popup.html",
  "./popup.js",
  "./config.js",
  "./interface.html",
  "./service_worker.js",
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
  "./icons/HCW-logo-16.png",
  "./rulesets/allow-credentials.json",
  "./assets/canvas-confetti.mjs",
  "./assets/console.image.min.js",
  "./assets/htmx.min.js",
  "./assets/jquery-3.6.4.min.js",
  "./interface_icons/note_1.png",
  "./interface_icons/note_2.png",
  "./interface_icons/note_3.png",
  "./interface_icons/note_4.png",
  "./interface_icons/note_5.png",
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
  "./Functions/creatIndexDB.js",
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

// Fonction pour mettre en cache une ressource
const cacheResource = (url) => {
  fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error("La récupération de la ressource a échoué.");
    })
    .then((data) => {
      chrome.storage.local.set({ [url]: data }, () => {
        console.log(`Ressource mise en cache : ${url}`);
      });
    })
    .catch((error) => {
      console.error(
        `Erreur lors de la mise en cache de la ressource ${url}:`,
        error
      );
    });
};

// Événement d'installation ou de mise à jour de l'extension
chrome.runtime.onInstalled.addListener(() => {
  // Mettez en cache chaque ressource
  for (const url of resourcesToCache) {
    cacheResource(url);
  }

  // Enregistrement du service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service worker enregistré avec succès!", registration);
      })
      .catch((error) => {
        console.error("Échec de l'enregistrement du service worker:", error);
      });
  }
});

// Fonction pour détecter les onglets et interfaces au démarrage
const detectTabsAndInterfaces = async () => {
  try {
    const solocalmsTabs = await chrome.tabs.query({
      url: "*://*.solocalms.fr/*",
    });

    if (solocalmsTabs.length > 0) {
      console.log("soprod tab detected...");
      // Des onglets avec solocalms.fr ont été détectés
      allTabs.push(...solocalmsTabs);
    } else {
      // Aucun onglet avec solocalms.fr détecté, ajouter uniquement l'onglet actif
      const activeTab = await chrome.tabs.query({
        currentWindow: true,
        active: true,
      });
      console.log("active tab car pas d'onglet soprod : ", activeTab);
      allTabs.push(activeTab[0]);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Log des onglets détectés
    console.log("allTabs:", allTabs);
  }
};

// Vérifiez si le service worker est actif
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    console.log("Service worker prêt!", registration);
  });
}

// Événements au démarrage de l'extension
chrome.runtime.onStartup.addListener(() => {
  console.log(`background onStartup`);
  checkCurrentTab();
});



// ==================== GESTION AMÉLIORÉE DES CORS ====================

// Constantes pour les méthodes HTTP
self.DEFAULT_METHODS = [
  "GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS", "PATCH",
  "PROPFIND", "PROPPATCH", "MKCOL", "COPY", "MOVE", "LOCK",
];

self.DEFAULT_STATUS_METHODS = [
  "GET", "POST", "PUT", "OPTIONS", "PATCH", "PROPFIND", "PROPPATCH",
];

// État des CORS
const corsState = {
  isEnabled: false,
  scanInProgress: false
};

// Objet contenant les fonctions pour les règles CORS
const core = {
  "overwrite-origin": () => updateCORSRules("overwrite-origin", corsState.isEnabled)
  // Les autres règles sont commentées mais peuvent être décommentées au besoin
  /*
  'csp': () => updateCORSRules('csp', corsState.isEnabled),
  'allow-shared-array-buffer': () => updateCORSRules('allow-shared-array-buffer', corsState.isEnabled),
  'x-frame': () => updateCORSRules('x-frame', corsState.isEnabled),
  'allow-credentials': () => updateCORSRules('allow-credentials', corsState.isEnabled),
  'allow-headers': () => updateCORSRules('allow-headers', corsState.isEnabled),
  'referer': () => updateCORSRules('referer', corsState.isEnabled),
  */
};

// Fonction pour activer les CORS de manière sécurisée
const enableCORS = () => {
  return new Promise((resolve) => {
    if (corsState.isEnabled) {
      console.log("Les CORS sont déjà activés");
      resolve();
      return;
    }

    corsState.scanInProgress = true;
    chrome.storage.sync.set({ corsEnabled: true }, () => {
      corsState.isEnabled = true;
      const ruleNames = ["overwrite-origin"];
      // Autres règles si nécessaire: 'csp', 'allow-shared-array-buffer', etc.

      ruleNames.forEach((ruleName) => {
        const prefName = `remove-${ruleName}`;
        updateCORSRules(ruleName, true);
        console.log({ prefName, ruleName, enabled: true });
      });

      console.log("CORS activés pour le scan");

      // Petit délai pour s'assurer que les règles sont appliquées
      setTimeout(resolve, 100);
    });
  });
};

// Fonction pour désactiver les CORS de manière sécurisée
const disableCORS = () => {
  return new Promise((resolve) => {
    if (!corsState.isEnabled && !corsState.scanInProgress) {
      console.log("Les CORS sont déjà désactivés");
      resolve();
      return;
    }

    chrome.storage.sync.set({ corsEnabled: false }, () => {
      corsState.isEnabled = false;
      corsState.scanInProgress = false;

      const ruleNames = ["overwrite-origin"];
      // Autres règles si nécessaire

      ruleNames.forEach((ruleName) => {
        const prefName = `remove-${ruleName}`;
        updateCORSRules(ruleName, false);
        console.log({ prefName, ruleName, enabled: false });
      });

      console.log("CORS désactivés après le scan");

      // Force la désactivation une seconde fois pour s'assurer que les règles sont bien désactivées
      setTimeout(() => {
        forceCORSDisable();
        resolve();
      }, 100);
    });
  });
};

// Fonction pour forcer la désactivation des CORS (garantie supplémentaire)
const forceCORSDisable = () => {
  const ruleNames = ["overwrite-origin"];
  // Autres règles si nécessaire

  ruleNames.forEach(rule => {
    chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: [rule]
    }).then(() => {
      console.log(`Forçage de la désactivation de la règle '${rule}' réussi`);
    }).catch(error => {
      console.error(`Erreur lors du forçage de la désactivation de '${rule}':`, error);
    });
  });
};

// Fonction pour mettre à jour les règles CORS (remplace toggle)
const updateCORSRules = (rule, enable, value = false) => {
  console.log("updateCORSRules arguments : ", { rule, enable, value });

  chrome.declarativeNetRequest.updateEnabledRulesets(
    enable
      ? { enableRulesetIds: [rule] }
      : { disableRulesetIds: [rule] }
  ).then(() => {
    console.log(`Règle '${rule}' ${enable ? 'activée' : 'désactivée'} avec succès`);
  }).catch(error => {
    console.error(`Erreur lors de la mise à jour de la règle '${rule}':`, error);
  });
};

// Fonction pour exécuter une tâche avec gestion sécurisée des CORS
const runWithSafeCORS = async (taskFunction) => {
  try {
    // Activer les CORS avant la tâche
    await enableCORS();

    // Exécuter la fonction passée en paramètre
    return await taskFunction();

  } catch (error) {
    console.error("Erreur pendant l'exécution de la tâche:", error);
    throw error;
  } finally {
    // Désactiver les CORS quoi qu'il arrive, même en cas d'erreur
    await disableCORS();
  }
};

// Initialisation de l'état des CORS au démarrage
const initCORSState = () => {
  chrome.storage.sync.get("corsEnabled", (result) => {
    // Par défaut, on désactive les CORS au démarrage par sécurité
    const shouldBeEnabled = false;

    if (result.corsEnabled !== shouldBeEnabled) {
      chrome.storage.sync.set({ corsEnabled: shouldBeEnabled });
    }

    corsState.isEnabled = shouldBeEnabled;
    const ruleNames = ["overwrite-origin"];

    ruleNames.forEach((ruleName) => {
      updateCORSRules(ruleName, shouldBeEnabled);
    });
  });
};

// Écouteur de message pour la gestion des CORS (fusion avec l'écouteur existant)
const corsMessageHandler = (request, sender, sendResponse) => {
  // Activation/désactivation des CORS
  if (request.corsEnabled !== undefined) {
    if (request.corsEnabled) {
      enableCORS().then(() => {
        sendResponse && sendResponse({ success: true, corsState: corsState });
      });
    } else {
      disableCORS().then(() => {
        sendResponse && sendResponse({ success: true, corsState: corsState });
      });
    }
    return true;
  }

  // Récupération de l'état des CORS
  if (request.action === 'getCORSStatus') {
    sendResponse({
      isEnabled: corsState.isEnabled,
      scanInProgress: corsState.scanInProgress
    });
    return true;
  }

  return false; // Indique que ce handler n'a pas traité le message
};

// Configuration du cycle de vie pour la gestion des CORS
const setupCORSLifecycle = () => {
  // Initialisation des CORS au démarrage
  initCORSState();

  // S'assurer que les CORS sont désactivés lors de la suspension de l'extension
  chrome.runtime.onSuspend.addListener(() => {
    console.log("Extension en cours de suspension, désactivation forcée des CORS");
    forceCORSDisable();
  });
};

// Fonction pour maintenir la compatibilité avec le code existant
const toggleCorsEnabled = (value) => {
  if (value === undefined) {
    // Si pas de valeur fournie, utiliser l'état actuel (pour maintenir la compatibilité)
    value = corsState.isEnabled;
  }

  if (value) {
    enableCORS();
  } else {
    disableCORS();
  }
};

// Fonction pour maintenir la compatibilité avec le code existant
const once = () => {
  initCORSState();
};



// ==================== FONCTIONS D'ANALYSE ET D'INJECTION DE SCRIPTS ====================

// Fonction d'injection de scripts pour l'analyse d'une page
function injectScriptsForAnalysis(tabId) {
  if (!tabId) {
    console.error("Erreur: tabId est nécessaire pour injecter des scripts");
    return;
  }

  console.log(`Injection de scripts pour l'analyse dans l'onglet ${tabId}`);

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
        console.error("Erreur lors de l'injection de scripts:", chrome.runtime.lastError);
        return;
      }

      console.log("Premier ensemble de scripts injecté avec succès");

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
              console.error("Erreur lors de l'injection du second ensemble de scripts:", chrome.runtime.lastError);
            } else {
              console.log("Second ensemble de scripts injecté avec succès");
            }
          }
        );
      }, 50);
    }
  );
}

// Fonction pour démarrer l'analyse avec gestion sécurisée des CORS
async function startAnalysis(source, mode = 'sitemap') {
  try {
    console.log(`Démarrage de l'analyse en mode ${mode}`);

    // Réinitialiser les états d'analyse
    chrome.storage.local.set({
      'linksAnalysisComplete': false
    });

    // Création de l'analyseur
    sitemapAnalyzer = new SitemapAnalyzer({
      batchSize: 3,
      pauseBetweenBatches: 500,
      tabTimeout: 30000,
      maxRetries: 2
    });

    // Configurer les écouteurs d'événements
    setupSitemapAnalyzerListeners();

    // Exécuter l'analyse avec gestion sécurisée des CORS
    return await runWithSafeCORS(async () => {
      if (mode === 'urlList' && Array.isArray(source)) {
        console.log(`Démarrage de l'analyse de ${source.length} URLs`);
        return await sitemapAnalyzer.startWithUrlList(source);
      } else {
        console.log(`Démarrage de l'analyse du sitemap: ${source}`);
        return await sitemapAnalyzer.start(source);
      }
    });

  } catch (error) {
    console.error('Erreur lors du démarrage de l\'analyse:', error);
    sitemapAnalyzer = null;
    // S'assurer que les CORS sont désactivés en cas d'erreur
    await disableCORS();
    throw error;
  }
}

// Configurer les écouteurs d'événements pour l'analyseur de sitemap
function setupSitemapAnalyzerListeners() {
  // Écouteur pour la progression
  sitemapAnalyzer.on('progress', (progress) => {
    // Diffuser la progression à toutes les pages d'analyse ouvertes
    chrome.runtime.sendMessage({
      action: 'analysisProgress',
      progress: progress
    });
  });

  // Écouteur pour le statut d'analyse des liens
  sitemapAnalyzer.on('linksAnalysisStatus', (status) => {
    // Diffuser le statut d'analyse des liens
    chrome.runtime.sendMessage({
      action: 'linksAnalysisStatus',
      status: status
    });

    // Si l'analyse des liens est terminée, mémoriser l'état
    if (status.completed) {
      chrome.storage.local.set({ 'linksAnalysisComplete': true });
    }
  });

  // Écouteur pour la complétion
  sitemapAnalyzer.on('complete', async (results) => {
    // Sauvegarder les résultats
    console.log('Résultats complets avant sauvegarde:', results);

    // Vérifiez spécifiquement les données de liens
    let totalLinks = 0;
    let totalPages = 0;

    Object.entries(results.results).forEach(([url, data]) => {
      totalPages++;
      if (data.link_check && Array.isArray(data.link_check.link)) {
        totalLinks += data.link_check.link.length;
        console.log(`Page ${url}: ${data.link_check.link.length} liens`);
      }
    });

    console.log(`Total: ${totalPages} pages, ${totalLinks} liens`);

    chrome.storage.local.set({ 'sitemapAnalysis': results });

    // Vérifier si toutes les analyses sont terminées
    checkAllAnalysesComplete(results);

    sitemapAnalyzer = null; // Libérer la référence
  });
}

// Fonction pour vérifier si toutes les analyses sont terminées
function checkAllAnalysesComplete(results) {
  chrome.storage.local.get(['linksAnalysisComplete'], (data) => {
    const allComplete = (data.linksAnalysisComplete) ||
      (results && results.analysisComplete === true);

    if (allComplete) {
      console.log('Toutes les analyses sont terminées');

      // Récupérer et combiner les résultats des analyses
      chrome.storage.local.get(['sitemapAnalysis', 'linksAnalysisResults'], (results) => {
        // Enrichir les résultats d'analyse du site avec les résultats des liens
        if (results.sitemapAnalysis && results.linksAnalysisResults) {
          console.log('Enrichissement des résultats avec les données de liens');
          // Vous pouvez implémenter la logique de fusion des résultats ici
        }

        // Notification de fin de toutes les analyses
        chrome.runtime.sendMessage({
          action: 'allAnalysesComplete',
          results: results.sitemapAnalysis
        });
      });

      // Réinitialiser les états pour les futures analyses
      chrome.storage.local.set({
        'linksAnalysisComplete': false
      });
    }
  });
}

// Fonction pour analyser une URL avec le module checkLinks.js
async function analyzeURLWithLinks(url) {
  let tab = null;
  console.group(`🔍 Analyse des liens pour: ${url}`);

  try {
    // Création d'un nouvel onglet pour l'analyse
    tab = await chrome.tabs.create({
      url: url,
      active: false
    });

    // Attente du chargement complet de la page
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout: chargement de la page trop long'));
      }, 30000); // 30s de timeout

      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          clearTimeout(timeoutId);
          resolve();
        }
      });
    });

    console.log('Page chargée, injection du module checkLinks.js');

    // Injection des dépendances nécessaires
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [
        "./assets/jquery-3.6.4.min.js",
        "./Functions/checkAndAddJquery.js",
        "./Functions/settingsOptions.js"
      ]
    });

    // Petit délai pour s'assurer que jQuery est bien chargé
    await new Promise(resolve => setTimeout(resolve, 100));

    // Injection du module checkLinks.js
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["./Functions/checkLinks.js"]
    });

    console.log('Module checkLinks.js injecté, démarrage de l\'analyse');

    // Démarrer l'analyse des liens
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // Vérifier que le module est chargé
        if (typeof window.startLinksAnalysis === 'function') {
          console.log('Démarrage de l\'analyse des liens');
          window.startLinksAnalysis();

          // Créer un écouteur d'événement pour la fin de l'analyse
          window.addEventListener('linksAnalysisComplete', (event) => {
            console.log('Analyse des liens terminée, envoi des résultats au service worker');
            chrome.runtime.sendMessage({
              action: 'linksAnalysisComplete',
              detail: event.detail
            });
          });
        } else {
          console.error('Module checkLinks.js non trouvé ou non initialisé');
        }
      }
    });

    // Attendre que l'analyse des liens soit terminée
    await waitForLinksAnalysisComplete(tab.id);

    // Fermeture de l'onglet
    if (tab) {
      await chrome.tabs.remove(tab.id);
      console.log('Onglet fermé après analyse des liens');
    }

    console.groupEnd();
    return { url, status: 'analyzed' };

  } catch (error) {
    console.error('Erreur lors de l\'analyse des liens:', error);
    if (tab) {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (e) {
        console.error('Erreur lors de la fermeture de l\'onglet:', e);
      }
    }
    console.groupEnd();
    throw error;
  }
}

// Fonction pour attendre que l'analyse des liens soit terminée
function waitForLinksAnalysisComplete(tabId) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout: l\'analyse des liens a pris trop de temps'));
    }, 60000); // 60 secondes de timeout

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
            // Vérifier à nouveau après un court délai
            setTimeout(checkStatus, 1000);
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    }

    // Démarrer la vérification
    checkStatus();
  });
}


// ==================== ÉCOUTEURS DE MESSAGES ET GESTION DES ÉVÉNEMENTS ====================

// Écouteur principal pour les messages de l'extension
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // === GESTION DES CORS ===
  if (corsMessageHandler(request, sender, sendResponse)) {
    return true; // Message traité par le gestionnaire CORS
  }

  // === GESTION DES ANALYSES ===
  // Analyse de sitemap
  if (request.action === 'startSitemapAnalysis') {
    startAnalysis(request.sitemapUrl)
      .then(results => {
        // Une fois l'analyse terminée, ouvrir la page de résultats
        chrome.tabs.create({
          url: chrome.runtime.getURL('results.html')
        });
      })
      .catch(error => {
        console.error('Erreur lors de l\'analyse :', error);
      });

    // Ouvrir immédiatement une page de suivi de progression
    chrome.tabs.create({
      url: chrome.runtime.getURL('analysis-progress.html')
    });

    sendResponse({ status: 'started' });
    return true;
  }

  // Analyse de liste d'URLs
  if (request.action === 'startUrlListAnalysis') {
    startAnalysis(request.urls, 'urlList')
      .then(results => {
        // Une fois l'analyse terminée, ouvrir la page de résultats
        chrome.tabs.create({
          url: chrome.runtime.getURL('results.html')
        });
      })
      .catch(error => {
        console.error('Erreur lors de l\'analyse :', error);
      });

    // Ouvrir immédiatement une page de suivi de progression
    chrome.tabs.create({
      url: chrome.runtime.getURL('analysis-progress.html')
    });

    sendResponse({ status: 'started' });
    return true;
  }

  // Gestion des contrôles de l'analyse
  if (request.action === 'pauseAnalysis' && sitemapAnalyzer) {
    sitemapAnalyzer.pause();
    sendResponse({ status: 'paused' });
    return true;
  }

  if (request.action === 'resumeAnalysis' && sitemapAnalyzer) {
    sitemapAnalyzer.resume();
    sendResponse({ status: 'resumed' });
    return true;
  }

  if (request.action === 'cancelAnalysis' && sitemapAnalyzer) {
    sitemapAnalyzer.cancel();
    sitemapAnalyzer = null;

    // S'assurer que les CORS sont désactivés si l'analyse est annulée
    disableCORS().then(() => {
      sendResponse({ status: 'cancelled' });
    });
    return true;
  }

  // Analyse de la page actuelle
  if (request.action === 'startCurrentPageAnalysis') {
    // Activer les CORS avant l'analyse de la page
    enableCORS().then(() => {
      // Injecter les scripts pour analyser la page actuelle
      injectScriptsForAnalysis(request.tabId);

      // Une fois l'analyse terminée, s'assurer de désactiver les CORS
      setTimeout(() => {
        disableCORS();
      }, 10000); // Timeout raisonnable pour l'analyse d'une page

      sendResponse({ status: 'started' });
    });
    return true;
  }

  // Récupération de l'état actuel de l'analyse
  if (request.action === 'getAnalysisStatus') {
    if (sitemapAnalyzer) {
      sendResponse({
        active: true,
        isPaused: sitemapAnalyzer.isPaused,
        progress: sitemapAnalyzer.getProgress(),
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

  // Écouteur pour l'analyse des liens
  if (request.action === 'linksAnalysisComplete') {
    console.log('Message reçu: analyse des liens terminée', request.detail);
    chrome.storage.local.set({
      'linksAnalysisComplete': true,
      'linksAnalysisResults': request.detail
    });
    checkAllAnalysesComplete();
    sendResponse({ status: 'success' });
    return true;
  }

  // Répondre aux demandes de statut d'analyse des liens
  if (request.action === 'getLinksAnalysisStatus') {
    chrome.storage.local.get(['linksAnalysisComplete', 'linksAnalysisResults'], (data) => {
      sendResponse({
        complete: data.linksAnalysisComplete || false,
        results: data.linksAnalysisResults || null
      });
    });
    return true;
  }

  // === GESTION DE L'INTERFACE ===
  if (request.action === "open_interface") {
    console.log("Demande d'ouverture de l'interface reçue");
    console.log("launch detected soprod tab and snip username");
    detecteSoprod();
    console.log("Data de datachecker : ", request.data);
    cmp++;
    console.log(" cmp + 1 in datachecker interface : ", cmp);
    global_data.dataChecker = request.data;

    // Vérifier si les données sont complètes
    checkDatas();

    return true;
  }

  // Message pour la détection d'utilisateur Soprod
  if (request.user) {
    console.log("request user soprod : ", request.user);
    let cmpUserSoprod = 0;
    if (cmpUserSoprod === 0) {
      cmpUserSoprod++;
      console.log(" Data de user Soprod : ", request.user);
      cmp === 1 && cmp++;
      console.log(" cmp + 1 in user soprod : ", cmp);
      user_soprod = request.user;
      global_data.user = user_soprod;

      // Vérifier si les données sont complètes
      checkDatas();
    }
    return true;
  }

  // === FETCH POUR LES CONTENT SCRIPTS ===
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

// Fonction pour vérifier si les données sont complètes (DataChecker et User)
const checkDatas = () => {
  if (cmp === 2) {
    console.log("Les deux données requises sont arrivées");

    if (global_data.dataChecker) {
      const user = global_data.user;
      console.log("User pour envoi vers indexDB : ", global_data.user);
      global_data.user = global_data.user ? global_data.user : "Customer";
      console.log("Les deux datas sont bien arrivées : ", { global_data });

      try {
        const dataCheckerParse = JSON.parse(global_data.dataChecker);
        creatDB(user, db_name, dataCheckerParse);
        console.log(
          "CREATEDB -> lanuche with the datas :  user = ",
          user,
          { db_name },
          { dataCheckerParse }
        );
      } catch (error) {
        console.error("Erreur lors du parsing des données:", error);
      }

      cmp = 0; // Réinitialiser le compteur pour la prochaine utilisation

      // Ouvrir la fenêtre d'interface
      openOrReplaceInterfaceWindow();
    }
  }
};

// Fonction pour ouvrir ou remplacer la fenêtre d'interface
const openOrReplaceInterfaceWindow = () => {
  console.log("start open interface");
  const interfacePopupUrl = chrome.runtime.getURL("interface.html");

  // Récupérer l'ID de la fenêtre depuis le stockage local
  getPopupWindowId((popupWindowId) => {
    console.log("Stored popup interface ID:", popupWindowId);

    // Fermer la fenêtre existante (si elle existe encore)
    closeWindowIfExists(popupWindowId, () => {
      // Ouvrir une nouvelle fenêtre
      chrome.windows.create(
        {
          type: "popup",
          url: interfacePopupUrl,
          width: 1000,
          height: 1000,
        },
        (window) => {
          // Stocker le nouvel ID de fenêtre dans le stockage local
          setPopupWindowId(window.id);
          console.log("New popup interface ID:", window.id);
        }
      );
    });
  });
};

// Fonction pour récupérer l'ID de la fenêtre depuis le stockage local
const getPopupWindowId = (callback) => {
  chrome.storage.local.get(["popupWindowId"], (result) => {
    const storedPopupWindowId = result.popupWindowId;
    callback(storedPopupWindowId);
  });
};

// Fonction pour stocker l'ID de la fenêtre dans le stockage local
const setPopupWindowId = (id) => {
  chrome.storage.local.set({ popupWindowId: id });
};

// Fonction pour fermer la fenêtre si elle existe
const closeWindowIfExists = (windowId, callback) => {
  if (windowId) {
    chrome.windows.get(windowId, {}, (windowInfo) => {
      if (chrome.runtime.lastError || !windowInfo) {
        // Fenêtre introuvable ou erreur, réinitialiser l'ID stocké
        console.log(
          "Window not found or error:",
          chrome.runtime.lastError
        );
        chrome.storage.local.remove("popupWindowId", () => {
          callback();
        });
      } else {
        // Fenêtre trouvée, la fermer
        chrome.windows.remove(windowId, () => {
          console.log("Closed existing window with ID:", windowId);
          chrome.storage.local.remove("popupWindowId", () => {
            callback();
          });
        });
      }
    });
  } else {
    // Aucun ID de fenêtre, ne rien faire
    callback();
  }
};




// ==================== DÉTECTION SOPROD ET GESTION DES ÉLÉMENTS UI ====================

// Détection des utilisateurs Soprod
const detecteSoprod = async () => {
  console.log("detecting soprod tab");
  const storageUser = await chrome.storage.sync.get("user");

  console.log("All tabs : ", { allTabs });

  let isSoprodTab = {
    detected: false
  };

  let userSoprod = undefined;
  let soprodTabsDetected = 0;

  // Parcourir tous les onglets pour détecter les onglets Soprod
  for (const tab of allTabs) {
    if (
      tab &&
      tab?.url?.startsWith("http") &&
      tab.url.includes("soprod") &&
      !tab.url.startsWith("chrome://") &&
      !tab.url.startsWith("chrome-extension://") &&
      !tab.url.startsWith("chrome-devtools://")
    ) {
      soprodTabsDetected++; // Incrémente le compteur de tabs "soprod" détectés
      console.log("soprod detecteSoprod");

      // Exécute le script dans le tab actuel s'il existe
      console.log("tab id soprod : ", tab.id);

      if (tab?.id) {
        console.log("_________________tab id soprod : ", tab);

        try {
          const injectionResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
              window["cmp"] = 0;
              console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& cmp : ", window["cmp"]);

              if (window["cmp"] === 0) {
                console.log("================================ lancement de la récupération du user dans soprod");
                let dropUser = document.querySelector(".dropdown-user .username");
                console.log({ dropUser });
                const user = dropUser?.innerHTML;

                if (user) {
                  window["cmp"] += 1;
                  return user; // Retourne le nom d'utilisateur
                }
              }

              return null;
            }
          });

          if (injectionResult && injectionResult[0] && injectionResult[0].result) {
            userSoprod = injectionResult[0].result;
            console.log("Utilisateur Soprod détecté:", userSoprod);

            // Stocker l'utilisateur détecté
            chrome.storage.sync.set({ user: userSoprod }, function () {
              console.log("---------------------storage sync user : ", userSoprod);
              chrome.runtime.sendMessage({ user: userSoprod });
            });

            // On a trouvé un utilisateur valide, on peut arrêter la recherche
            if (userSoprod !== "Customer" && userSoprod !== undefined) {
              break;
            }
          }
        } catch (error) {
          console.error("Erreur lors de l'exécution du script dans l'onglet Soprod:", error);
        }
      }
    }
  }

  // Si aucun utilisateur Soprod n'a été détecté ou s'il n'est pas valide
  if (!userSoprod || userSoprod === "Customer" || userSoprod === undefined) {
    console.log("Aucun utilisateur Soprod valide détecté");

    // Vérifier si un utilisateur est stocké
    console.log("get user storage : ", storageUser);

    if (storageUser.user) {
      console.log(
        "is valide user soprod : ",
        storageUser.user,
        "includes @solocal.com : ",
        storageUser.user.includes("@solocal.com")
      );
    }

    // Si aucun utilisateur valide n'est stocké, utiliser "Customer" par défaut
    if (!storageUser.user || !storageUser.user.includes("@solocal.com")) {
      console.log("mise en place du name par défaut !!!");

      // Mettre à jour tous les onglets non-chrome avec l'utilisateur par défaut
      for (const tab of allTabs) {
        if (
          tab &&
          tab.id &&
          tab?.url?.startsWith("http") &&
          !tab.url.startsWith("chrome://") &&
          !tab.url.startsWith("chrome-extension://") &&
          !tab.url.startsWith("chrome-devtools://")
        ) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: () => {
                chrome.storage.sync.set({ user: "Customer" }, function () {
                  chrome.runtime.sendMessage({ user: "Customer" });
                });
              }
            });
          } catch (error) {
            console.error("Erreur lors de la mise à jour de l'utilisateur par défaut:", error);
          }
        }
      }
    }
    // Sinon, propager l'utilisateur stocké à tous les onglets
    else if (storageUser?.user?.includes("@solocal.com")) {
      console.log(
        "user detected and username includes email domain solocal.com : " +
        storageUser.user.includes("@solocal.com"),
        "     user : ",
        storageUser?.user
      );

      // Mettre à jour tous les onglets non-chrome avec l'utilisateur stocké
      chrome.windows.getCurrent({ populate: true }, async function (currentWindow) {
        // Vérifier si la fenêtre est valide et si elle contient des onglets
        if (currentWindow && currentWindow?.tabs) {
          for (const tab of currentWindow.tabs) {
            // Vérifier si l'URL commence par "http" et n'est pas de type "chrome://"
            if (
              tab &&
              tab?.url &&
              tab?.url.startsWith("http") &&
              !tab?.url.startsWith("chrome://") &&
              !tab?.url.startsWith("chrome-extension://") &&
              !tab?.url.startsWith("chrome-devtools://")
            ) {
              try {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  function: async (storedUser) => {
                    console.log("_____________");
                    const storageResult = await chrome.storage.sync.get("user");
                    console.log("++", storageResult.user);

                    chrome.storage.sync.set({ user: storageResult.user }, function () {
                      chrome.runtime.sendMessage({
                        user: storageResult.user,
                      });
                    });
                  },
                  args: [storageUser.user]
                });
              } catch (error) {
                console.error("Erreur lors de la propagation de l'utilisateur:", error);
              }
            }
          }
        }
      });
    }
  }
};

// Suppression du CTA IA MerciApp qui est injecté sur toutes les pages web actives
const removeMAButton = async (activeTab, tabId, url) => {
  if (!tabId) {
    console.error("Impossible de supprimer le bouton: tabId manquant");
    return;
  }

  if (!url) {
    if (activeTab && activeTab.url) {
      url = activeTab.url;
    } else {
      console.error("Impossible de supprimer le bouton: URL manquante");
      return;
    }
  }

  if (
    url &&
    url.startsWith("http") &&
    !url.startsWith("chrome://") &&
    !url.startsWith("chrome-extension://") &&
    !url.startsWith("chrome-devtools://")
  ) {
    console.log(`Vérification et suppression du bouton MerciApp dans l'onglet ${tabId}`);

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
          const maButtonDiv = document.querySelector(
            'div[style*="position: fixed; z-index: 9999999;"]'
          );

          if (maButtonDiv && maButtonDiv.childElementCount === 0) {
            console.log("Bouton MerciApp trouvé et masqué");
            maButtonDiv.style.display = "none";
          }
        }
      });
    } catch (error) {
      console.error(`Erreur lors de la suppression du bouton MerciApp dans l'onglet ${tabId}:`, error);
    }
  }
};

// Fonction pour vérifier l'onglet actif actuel et exécuter le script de suppression
const checkCurrentTab = async () => {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!activeTab) {
      console.log("Aucun onglet actif trouvé");
      return;
    }

    if (
      activeTab &&
      activeTab.url &&
      !(
        activeTab.url.startsWith('chrome://') ||
        activeTab.url.startsWith('chrome-extension://') ||
        activeTab.url.startsWith('chrome-devtools://')
      )
    ) {
      await removeMAButton(activeTab, activeTab.id, activeTab.url);
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'onglet actuel:", error);
  }
};

// Écouter quand un onglet est mis à jour (changement d'URL, rechargement)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab || !tab.url) {
    return;
  }

  if (
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('chrome-extension://') ||
    tab.url.startsWith('chrome-devtools://')
  ) {
    return;
  }

  if (changeInfo.status === "complete") {
    removeMAButton(tab, tabId, tab.url);
  }
});

// Écouter quand l'utilisateur change d'onglet actif
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome?.tabs?.get(activeInfo.tabId);
    if (tab && tab.id) {
      removeMAButton(tab, tab.id, tab.url);
    }
  } catch (error) {
    console.error("Erreur lors du changement d'onglet actif:", error);
  }
});

// ==================== FINALISATION ET CONFIGURATION ====================

// Gestion des écouteurs d'événements pour le cycle de vie de l'extension
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension démarrée");

  // Initialiser l'état des CORS au démarrage
  initCORSState();

  // Vérifier l'onglet actuel
  checkCurrentTab();

  // Réinitialiser les états d'analyse
  chrome.storage.local.set({
    'linksAnalysisComplete': false
  });
});

// Lorsque l'extension est installée ou mise à jour
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`Extension installée/mise à jour: ${details.reason}`);

  // Vérifier l'onglet actuel
  checkCurrentTab();

  // Réinitialiser les états d'analyse
  chrome.storage.local.set({
    'linksAnalysisComplete': false
  });
});

// Lorsque l'extension est sur le point d'être suspendue (navigateur fermé)
chrome.runtime.onSuspend.addListener(() => {
  console.log("Extension suspendue");

  // S'assurer que les CORS sont désactivés
  forceCORSDisable();

  // Nettoyer les ressources si nécessaire
  if (sitemapAnalyzer) {
    sitemapAnalyzer.cancel();
    sitemapAnalyzer = null;
  }
});

// Fonction utilitaire pour la compatibilité des navigateurs
const isBrowserCompatible = () => {
  return typeof chrome !== 'undefined' &&
    typeof chrome.runtime !== 'undefined' &&
    typeof chrome.runtime.id !== 'undefined';
};

// ==================== ASSEMBLAGE FINAL ====================

// Fonction pour assembler tous les modules et initialiser le service worker
const initServiceWorker = () => {
  if (!isBrowserCompatible()) {
    console.error("Environnement de navigateur non compatible");
    return;
  }

  console.log("Initialisation du service worker");

  // Initialiser la configuration
  initialize();

  // Configurer le cycle de vie pour les CORS
  setupCORSLifecycle();

  // Enregistrer les écouteurs d'événements
  console.log("Écouteurs d'événements enregistrés");

  // Initialiser les variables globales
  console.log("Variables globales initialisées");
};

// Auto-exécution de l'initialisation
if (isBrowserCompatible()) {
  initServiceWorker();
} else {
  console.error("Ce script ne peut être exécuté que dans un contexte d'extension Chrome");
}

// ==================== ASSEMBLAGE FINAL DU SERVICE WORKER ====================

/* 
  Ce service worker a été refactorisé pour améliorer:
  1. La gestion des CORS - Désactivation garantie après les scans
  2. L'organisation générale - Code plus lisible et maintenable
  3. La gestion des erreurs - Meilleure robustesse
  4. Les performances - Optimisation du cycle de vie
  
  Toutes les fonctionnalités existantes ont été conservées:
  - Analyse des pages et des liens
  - Détection des utilisateurs Soprod
  - Suppression du bouton MerciApp
  - Gestion des fenêtres et interfaces
  - Mise en cache des ressources
  
  Version: 2.0.0
  Date: 2025-03-24
*/