"use strict";

import { creatDB } from "./Functions/creatIndexDB.js";
import { SitemapAnalyzer } from "./Functions/sitemapAnalyzer.js";
import { CONFIG, initConfig } from "./config.js";

// Initialisation de la configuration
let config;

// Initialisation au démarrage
const initialize = async () => {
  config = await initConfig();
  console.log("Configuration initialisée:", config);
};

// Appel immédiat à l'initialisation
initialize();
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
        return response.text(); // Vous pouvez également utiliser response.json() si la ressource est au format JSON.
      }
      throw new Error("La récupération de la ressource a échoué.");
    })
    .then((data) => {
      // Stockez les données dans le stockage local de l'extension
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
});

// Événement d'installation du service worker
chrome.runtime.onInstalled.addListener(() => {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.from === "content_script" && message.subject === "fetch") {
    fetch(message.url)
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

// Vérifiez si le service worker est actif
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    console.log("Service worker prêt!", registration);
  });
}

chrome.runtime.onStartup.addListener(() => {
  console.log(`background onStartup`);
});
const core = {};
self.DEFAULT_METHODS = [
  "GET",
  "PUT",
  "POST",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "PROPFIND",
  "PROPPATCH",
  "MKCOL",
  "COPY",
  "MOVE",
  "LOCK",
];
self.DEFAULT_STATUS_METHODS = [
  "GET",
  "POST",
  "PUT",
  "OPTIONS",
  "PATCH",
  "PROPFIND",
  "PROPPATCH",
];
let prefs, corsEnabled;

/*core['csp'] = () => toggle('remove-csp', 'csp', false);
core['allow-shared-array-buffer'] = () => toggle('allow-shared-array-buffer', 'allow-shared-array-buffer', false);
core['x-frame'] = () => toggle('remove-x-frame', 'x-frame', true);
core['allow-credentials'] = () => toggle('allow-credentials', 'allow-credentials', true);
core['allow-headers'] = () => toggle('allow-headers', 'allow-headers', false);
core['referer'] = () => toggle('remove-referer', 'referer', false);*/
core["overwrite-origin"] = () =>
  toggle("remove-overwrite-origin", "overwrite-origin", false);

const toggle = (name, rule, value) => {
  console.log("toggle arguments : ", { name }, { rule }, { value });
  console.log("rules updated:", { rule }, { value }, { corsEnabled });
  chrome.declarativeNetRequest.updateEnabledRulesets(
    corsEnabled
      ? {
        enableRulesetIds: [rule],
      }
      : {
        disableRulesetIds: [rule],
      }
  );
  //});
};
const toggleCorsEnabled = (corsEnabled) => {
  const value = corsEnabled;
  console.log("--- toggleCorsEnabled value :", value);
  const ruleNames = ["overwrite-origin"]; //'csp', 'allow-shared-array-buffer', 'x-frame', 'allow-credentials', 'allow-headers', 'referer',
  ruleNames.forEach((ruleName) => {
    const prefName = `remove-${ruleName}`;

    core[ruleName](prefName, ruleName, value);
    console.log({ prefName }, { ruleName }, { value });
  });
  setTimeout(() => console.log(core), 200);
};
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.corsEnabled !== undefined) {
    chrome.storage.sync.set({ corsEnabled: request.corsEnabled }, () => {
      corsEnabled = request.corsEnabled;
      toggleCorsEnabled(corsEnabled);
    });
  }
});

const once = () => {
  chrome.storage.sync.get("corsEnabled", (result) => {
    corsEnabled = result.corsEnabled;
    toggleCorsEnabled();
  });
};


// Fonction d'injection de scripts pour l'analyse d'une page
function injectScriptsForAnalysis(tabId) {
  if (tabId) {
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
      () => {
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
            }
          );
        }, 50);
      }
    );
  }
}

//gestionnaire de l'analise des page du sitemap.xml
let sitemapAnalyzer = null;

// Écouteur de messages pour les actions liées à l'analyse
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
    return true; // Indique que la réponse sera envoyée de manière asynchrone
  }
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
  }

  if (request.action === 'resumeAnalysis' && sitemapAnalyzer) {
    sitemapAnalyzer.resume();
    sendResponse({ status: 'resumed' });
  }

  if (request.action === 'cancelAnalysis' && sitemapAnalyzer) {
    sitemapAnalyzer.cancel();
    sitemapAnalyzer = null;
    sendResponse({ status: 'cancelled' });
  }
  if (request.action === 'startCurrentPageAnalysis') {
    // Injecter les scripts pour analyser la page actuelle
    injectScriptsForAnalysis(request.tabId);
    sendResponse({ status: 'started' });
    return true;
  }

  // Récupération de l'état actuel de l'analyse
  if (request.action === 'getAnalysisStatus') {
    if (sitemapAnalyzer) {
      sendResponse({
        active: true,
        isPaused: sitemapAnalyzer.isPaused,
        progress: sitemapAnalyzer.getProgress()
      });
    } else {
      sendResponse({ active: false });
    }
    return true;
  }

  // Écouteur pour l'analyse des liens
  if (request.action === 'linksAnalysisComplete') {
    console.log('Message reçu: analyse des liens terminée', request.detail);

    // Stocker l'information que l'analyse des liens est terminée
    chrome.storage.local.set({ 'linksAnalysisComplete': true });

    // Stocker les résultats détaillés de l'analyse des liens
    chrome.storage.local.set({ 'linksAnalysisResults': request.detail });

    // Vérifier si toutes les analyses sont terminées
    checkAllAnalysesComplete();

    sendResponse({ status: 'success' });
    return true;
  }

  // Répondre aux demandes de statut d'analyse
  if (request.action === 'getLinksAnalysisStatus') {
    chrome.storage.local.get(['linksAnalysisComplete', 'linksAnalysisResults'], (data) => {
      sendResponse({
        complete: data.linksAnalysisComplete || false,
        results: data.linksAnalysisResults || null
      });
    });
    return true;
  }
});

// Fonction pour démarrer l'analyse
async function startAnalysis(source, mode) {
  try {
    // Réinitialiser les états d'analyse
    chrome.storage.local.set({
      'linksAnalysisComplete': false
      // 'imagesAnalysisComplete': false (commenté comme demandé)
    });

    // Création de l'analyseur
    sitemapAnalyzer = new SitemapAnalyzer({
      batchSize: 3,
      pauseBetweenBatches: 500,
      tabTimeout: 30000,
      maxRetries: 2
    });

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
    sitemapAnalyzer.on('complete', (results) => {
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

      // Marquer l'analyse comme terminée
      // chrome.storage.local.set({ 'imagesAnalysisComplete': true }); (commenté comme demandé)

      // Vérifier si toutes les analyses sont terminées
      checkAllAnalysesComplete(results);

      sitemapAnalyzer = null; // Libérer la référence
    });

    // Démarrer l'analyse selon le mode
    if (mode === 'urlList' && Array.isArray(source)) {
      // Mode liste d'URLs
      return await sitemapAnalyzer.startWithUrlList(source);
    } else {
      // Mode sitemap classique
      return await sitemapAnalyzer.start(source);
    }

  } catch (error) {
    console.error('Erreur lors du démarrage de l\'analyse:', error);
    sitemapAnalyzer = null;
    throw error;
  }
}

// Fonction pour vérifier si toutes les analyses sont terminées
function checkAllAnalysesComplete(results) {
  chrome.storage.local.get(['linksAnalysisComplete'], (data) => {
    // Pour l'instant, nous vérifions uniquement l'analyse des liens
    // Ajoutez 'imagesAnalysisComplete' ici plus tard quand vous réactiverez l'analyse des images
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
        // 'imagesAnalysisComplete': false (commenté comme demandé)
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
let user_soprod;
/****** check all tab and remove interface*/
let allTabs = [];

(async () => {
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
    // Votre code à exécuter après la récupération des onglets
    console.log("allTabs:", allTabs);
  }
})();

//Suppression du CTA IA MerciApp qui est injecté sur toutes les pages web actives.
const removeMAButton = async (activeTab, tabId, url) => {
  if (
    url &&
    activeTab?.url.startsWith("http") &&
    !url.startsWith("chrome://") &&
    !url.startsWith("chrome-extension://") &&
    !url.startsWith("chrome-devtools://")
  ) {
    console.log("Vérification de l'élément dans l'onglet : ", tabId);
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        const maButtonDiv = document.querySelector(
          'div[style*="position: fixed; z-index: 9999999;"]'
        );
        if (maButtonDiv && maButtonDiv.childElementCount === 0) {
          maButtonDiv.style.display = "none";
        }
      },
    });
  }
};

// Fonction pour vérifier l'onglet actif actuel et exécuter le script
const checkCurrentTab = async () => {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTab && !(activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://') || activeTab.url.startsWith('chrome-devtools://'))) {
    (activeTab?.id && activeTab?.url) && removeMAButton(activeTab, activeTab.id, activeTab.url);
  }
};

// Écouter quand un onglet est mis à jour (changement d'URL, rechargement)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('chrome-devtools://')) {
    return;
  }
  if (changeInfo.status === "complete") {
    removeMAButton(tabId, tab.url);
  }
});

// Écouter quand l'utilisateur change d'onglet actif
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome?.tabs?.get(activeInfo.tabId);
  removeMAButton(tab.id, tab.url);
});

// Vérifier l'onglet actuel au démarrage de l'extension ou au rechargement
chrome.runtime.onStartup.addListener(checkCurrentTab);
chrome.runtime.onInstalled.addListener(checkCurrentTab);

let cmp = 0;
let cmpInterval = 0;
let global_data = {};
const db_name = "db_datas_checker";
const detecteSoprod = async () => {
  console.log("detecting soprod tab");
  const storageUser = await chrome.storage.sync.get("user");

  console.log("All tabs : ", { allTabs });
  let isSoprodTab = {};
  isSoprodTab.detected = false;
  let userSoprod = undefined;
  let soprodTabsDetected = 0;

  allTabs.map(async (tab, i) => {
    if (
      tab &&
      tab?.url.startsWith("http") &&
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
        console.log("_________________tab id  soprod : ", tab);
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function(tab) {
            window["cmp"] = 0;
            console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& cmp : ", cmp);
            if (window["cmp"] === 0) {
              console.log(
                "================================ lancement de la récupération du user dans soprod"
              );
              let dropUser = document.querySelector(".dropdown-user .username");
              console.log({ dropUser });
              const user = dropUser?.innerHTML;
              if (user) {
                window["cmp"] += 1;
                userSoprod = user; // Met à jour le nom d'utilisateur
                chrome.storage.sync.set({ user: userSoprod }, function () {
                  console.log(
                    "---------------------storage sync user : ",
                    userSoprod
                  );
                  chrome.runtime.sendMessage({ user: userSoprod });
                });
              }
            }
          },
        });
      }

      if (userSoprod !== "Customer" || userSoprod !== undefined) {
        // Si le nom d'utilisateur est mis à jour, sort de la boucle
        return;
      }
    } else {
      console.log(
        "tab length and i",
        allTabs.length - 1,
        i,
        " userSoprod is undefined : ",
        userSoprod
      );

      console.log("get user storage :; ", storageUser);
      console.log(
        "is valide user soprod : ",
        storageUser.user,
        "includes @solocal.com : ",
        storageUser.user.includes("@solocal.com")
      );
      if (
        storageUser.user === undefined &&
        !storageUser.user.includes("@solocal.com")
      ) {
        console.log("mise en place du name par défaut !!!");
        // Si l'onglet n'est pas lié à "soprod", le stocker comme dernier onglet non "soprod"
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function(tab) {
            chrome.storage.sync.set({ user: "Customer" }, function () {
              chrome.runtime.sendMessage({ user: "Customer" });
            });
          },
        });
      } else if (storageUser?.user?.includes("@solocal.com")) {
        console.log(
          "user detected and username includes email domain solocal.com : " +
          storageUser.user.includes("@solocal.com"),
          "     user : ",
          storageUser?.user
        );

        chrome.windows.getCurrent(
          { populate: true },
          async function (currentWindow) {
            // Vérifier si la fenêtre est valide et si elle contient des onglets
            if (currentWindow && currentWindow?.tabs) {
              for (const tab of currentWindow.tabs) {
                // Vérifier si l'URL commence par "http" et n'est pas de type "chrome://"
                if (
                  (tab &&
                    tab?.url) &&
                  tab?.url.startsWith("http") &&
                  !tab?.url.startsWith("chrome://") &&
                  !tab?.url.startsWith("chrome-extension://")
                ) {
                  // Faites quelque chose avec l'onglet, par exemple, affichez l'URL dans la console
                  await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    async function(tab) {
                      console.log("_____________");
                      const storageUser = await chrome.storage.sync.get("user");
                      console.log("++", storageUser.user);
                      chrome.storage.sync.set(
                        { user: storageUser.user },
                        function () {
                          chrome.runtime.sendMessage({
                            user: storageUser.user,
                          });
                        }
                      );
                    },
                  });
                }
              }
            }
          }
        );
      }
    }
  });
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  let user,
    data_checker,
    interCheck,
    cmpInterface = 0;

  if (request.action === "open_interface") {
    cmpInterface++;
    if (cmpInterface === 1) {
      console.log("launch detected antoned interface", allTabs);
      //detectOnotherInterface(allTabs);
      console.log("launch detected soprod tab and snip username ");
      detecteSoprod();
      console.log("Data de datachecker : ", request.data);
      cmp++;
      console.log(" cmp + 1 in datachecker interface : ", cmp);
      data_checker = request.data;
      global_data.dataChecker = request.data;
    }
    // clearInterval(interCheck);
  }
  if (request.user) {
    console.log("request user soprod : ", request.user);
    let cmpUserSoprod = 0;
    if (cmpUserSoprod === 0) {
      cmpUserSoprod++;
      console.log(" Data de user Soprod : ", request.user);
      cmp === 1 && cmp++;
      console.log(" cmp + 1 in user soprod : ", cmp);
      user = request.user;
      global_data.user = user;
    }
  }
  const checkDatas = () => {
    cmpInterval++;
    if (cmp === 2) {
      console.log("Interval function ready : ", { interCheck });
      //cleanInterval();
      console.log("Data_checker -> ", global_data.dataChecker);
      if (global_data.dataChecker) {
        const user = global_data.user;
        console.log("User pour envoi vers indexDB : ", global_data.user);
        global_data.user = global_data.user ? global_data.user : "Customer"; //JSON.parse(global_data.user)
        console.log("Les deux datas sont bien arrivées : ", { global_data });
        const dataCheckerParse = JSON.parse(global_data.dataChecker);
        creatDB(user, db_name, dataCheckerParse);
        console.log(
          "CREATEDB -> lanuche with the datas :  user = ",
          user,
          { db_name },
          { dataCheckerParse }
        );

        cmp = 0;
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

        // Fonction pour vérifier si un onglet est ouvert et n'est pas une page Chrome ou DevTools
        const isTabOpenAndNotChrome = (tabId, callback) => {
          chrome.tabs.get(tabId, (tab) => {
            if (
              chrome.runtime.lastError ||
              !tab ||
              tab.url.startsWith("chrome://") ||
              tab.url.startsWith("chrome-extension://") ||
              tab.url.startsWith("chrome-devtools://")
            ) {
              console.log(
                "Tab not found, is a Chrome page, or error:",
                chrome.runtime.lastError
              );
              callback(false);
            } else {
              callback(true);
            }
          });
        };



        // Fonction pour ouvrir ou remplacer la fenêtre
        const openOrReplaceWindow = () => {
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

        // Appel de la fonction pour ouvrir ou remplacer la fenêtre
        openOrReplaceWindow();
      }
    }
  };
  checkDatas();
});
