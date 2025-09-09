import { getActiveTabURL } from "./Functions/utils.js";
import { richResultGoole } from "./Functions/richResultGoogle.js";
import { toggleDesignMode } from "./Functions/toggleDesignMode.js";
import { copyExpressionsSoprod } from "./Functions/copyExpressionsSoprod.js";
import { dudaSitemap } from "./Functions/DudaSitemap.js";
import { HnOutlineValidity } from "./Functions/HnOutlineValidity.js";
import { downloaderWPMedia } from "./Functions/downloaderWPMedias.js";
import { analyzeMetas } from "./Functions/metaAnalyzer.js";
import { semanticLinks } from "./Functions/semanticLinksAnalyzer.js";
import { CheckRatioImages } from "./Functions/CheckRatioImages.js";


function setupWebScanner() {
  // Vérifier que l'onglet Web Scanner existe
  const scannerTab = document.getElementById("scanner-tab");
  if (!scannerTab) {
    console.log("[WebScanner] Onglet Web Scanner non trouvé dans le DOM");
    return;
  }

  console.log("[WebScanner] Interface WebScanner initialisée");

  // Configuration des boutons
  const startBtn = document.getElementById("startScannerBtn");
  const stopBtn = document.getElementById("scannerStopBtn");
  const viewBtn = document.getElementById("viewScannerResultsBtn");

  if (startBtn) {
    startBtn.addEventListener("click", startWebScanner);
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", stopWebScanner);
  }

  if (viewBtn) {
    viewBtn.addEventListener("click", viewScannerResults);
  }

  // Initialisation de l'état
  checkScannerStatus();
  checkScannerResults();
  setupScannerMessageListeners();
}
// COMPORTEMENT 1 : Garder le popup ouvert pendant l'analyse
function startWebScannerWithPopup() {
  const domain = document.getElementById('scannerDomain').value.trim();
  const searchQuery = document.getElementById('scannerQuery').value.trim();
  const useRegex = document.getElementById('scannerUseRegex').checked;
  const caseSensitive = document.getElementById('scannerCaseSensitive').checked;
  const searchMode = document.querySelector('input[name="scannerMode"]:checked').value;

  showScannerLoading();

  chrome.runtime.sendMessage({
    action: "startWebScanner",
    domain,
    searchQuery,
    useRegex,
    caseSensitive,
    searchMode
  }, (response) => {
    // Gérer l'erreur "message port closed" sans arrêter le processus
    if (chrome.runtime.lastError) {
      console.log('[Popup] Message sent but port closed (normal behavior)');
    }

    if (response && response.status === 'started') {
      showScannerStatus();
      showNotification("Analyse démarrée - Restez sur cette page pour suivre la progression", "success");
    } else if (response && response.status === 'error') {
      showNotification(response.message, "error");
      resetScannerUI();
    } else {
      showScannerStatus();
      showNotification("Analyse démarrée", "success");
    }
  });
}




function startWebScanner() {
  const domain = document.getElementById('scannerDomain').value.trim();
  const searchQuery = document.getElementById('scannerQuery').value.trim();
  const useRegex = document.getElementById('scannerUseRegex').checked;
  const caseSensitive = document.getElementById('scannerCaseSensitive').checked;
  const searchMode = document.querySelector('input[name="scannerMode"]:checked').value;

  // NOUVEAU : Récupérer le comportement choisi par l'utilisateur
  const popupBehavior = document.querySelector('input[name="popupBehavior"]:checked').value;

  // Validation
  if (!domain) {
    showNotification("Veuillez entrer un domaine valide", "error");
    return;
  }

  if (!searchQuery) {
    showNotification("Veuillez entrer une recherche", "error");
    return;
  }

  try {
    new URL(domain);
  } catch (e) {
    showNotification("URL invalide. Incluez http:// ou https://", "error");
    return;
  }

  // Comportement selon le choix de l'utilisateur
  if (popupBehavior === 'close-and-follow') {
    startWebScannerDetached();
  } else {
    startWebScannerWithPopup();
  }
}

function stopWebScanner() {
  chrome.runtime.sendMessage({
    action: "stopWebScanner"
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('[Popup] Stop message sent');
    }

    if (response && response.status === 'stopped') {
      hideScannerStatus();
      resetScannerUI();
      showNotification("Analyse arrêtée", "info");
    }
  });
}
// NOUVELLE FONCTION : Alternative pour utilisateurs qui préfèrent fermer le popup
function startWebScannerDetached() {
  const domain = document.getElementById('scannerDomain').value.trim();
  const searchQuery = document.getElementById('scannerQuery').value.trim();
  const useRegex = document.getElementById('scannerUseRegex').checked;
  const caseSensitive = document.getElementById('scannerCaseSensitive').checked;
  const searchMode = document.querySelector('input[name="scannerMode"]:checked').value;

  // Même validation...
  if (!domain || !searchQuery) {
    showNotification("Veuillez remplir tous les champs", "error");
    return;
  }

  try {
    new URL(domain);
  } catch (e) {
    showNotification("URL invalide", "error");
    return;
  }

  // Lancer l'analyse
  chrome.runtime.sendMessage({
    action: "startWebScanner",
    domain,
    searchQuery,
    useRegex,
    caseSensitive,
    searchMode
  });

  // Ouvrir immédiatement la page de résultats pour le suivi en temps réel
  chrome.tabs.create({
    url: chrome.runtime.getURL('web-scanner-results.html')
  });

  // Fermer le popup
  window.close();
}
function viewScannerResults() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('web-scanner-results.html')
  });
  window.close();
}

function checkScannerStatus() {
  // CORRECTION : Gestion d'erreur pour éviter les ports fermés
  try {
    chrome.runtime.sendMessage({
      action: "getWebScannerStatus"
    }, (response) => {
      // Vérifier si la réponse est valide
      if (chrome.runtime.lastError) {
        console.log('[Popup] Runtime error (normal if popup closed):', chrome.runtime.lastError.message);
        return;
      }

      if (response && response.active) {
        showScannerStatus();
        if (response.progress) {
          updateScannerProgress(response.progress);
        }
      } else {
        hideScannerStatus();
        resetScannerUI();
      }
    });
  } catch (error) {
    console.log('[Popup] Error checking scanner status:', error);
  }
}

function checkScannerResults() {
  try {
    chrome.runtime.sendMessage({
      action: "getWebScannerResults"
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[Popup] Runtime error checking results:', chrome.runtime.lastError.message);
        return;
      }

      if (response && response.status === 'success' && response.results.length > 0) {
        const viewBtn = document.getElementById("viewScannerResultsBtn");
        if (viewBtn) {
          viewBtn.disabled = false;
          viewBtn.innerHTML = `<span class="icon">📊</span> Résultats (${response.results.length})`;
        }
      }
    });
  } catch (error) {
    console.log('[Popup] Error checking results:', error);
  }
}

function setupScannerMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      switch (message.action) {
        case 'webScannerProgress':
          updateScannerProgress(message.progress);
          break;

        case 'webScannerNewResult':
          updateResultsButton();
          break;

        case 'webScannerComplete':
          handleScannerComplete(message.results, message.summary);
          break;

        case 'webScannerError':
          handleScannerError(message.error);
          break;
      }
    } catch (error) {
      console.error('[Popup] Error handling message:', error);
    }
  });
}

function showScannerLoading() {
  const startBtn = document.getElementById("startScannerBtn");
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="icon">⏳</span> Initialisation...';
  }
}

function showScannerStatus() {
  const statusPanel = document.getElementById("scannerStatus");
  const startBtn = document.getElementById("startScannerBtn");

  if (statusPanel) {
    statusPanel.classList.remove("hidden");
  }

  if (startBtn) {
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="icon">⏳</span> En cours...';
  }
}

function hideScannerStatus() {
  const statusPanel = document.getElementById("scannerStatus");
  if (statusPanel) {
    statusPanel.classList.add("hidden");
  }
}

// Mise à jour de la progression (seulement en mode popup ouvert)
function updateScannerProgress(progress) {
  const statusMessage = document.getElementById("scannerStatusMessage");
  const progressBar = document.getElementById("scannerProgressBar");
  const progressText = document.getElementById("scannerProgressText");

  if (statusMessage) {
    statusMessage.textContent = progress.message || "Analyse en cours...";
  }

  if (progress.percentage !== undefined) {
    if (progressBar) {
      progressBar.style.width = progress.percentage + '%';
    }
    if (progressText) {
      progressText.textContent = progress.percentage + '%';
    }
  }

  if (progress.current && progress.total && progressText) {
    progressText.textContent = `${progress.current}/${progress.total} (${progress.percentage}%)`;
  }
}

function updateResultsButton() {
  chrome.runtime.sendMessage({
    action: "getWebScannerResults"
  }, (response) => {
    if (response && response.status === 'success') {
      const viewBtn = document.getElementById("viewScannerResultsBtn");
      if (viewBtn) {
        viewBtn.disabled = false;
        const resultCount = response.results.length;
        if (resultCount > 0) {
          viewBtn.innerHTML = `<span class="icon">📊</span> Résultats (${resultCount})`;
        }
      }
    }
  });
}

function handleScannerComplete(results, summary) {
  hideScannerStatus();
  resetScannerUI();

  const message = `Analyse terminée!\n${summary.totalPages} pages analysées\n${summary.pagesWithMatches} pages avec résultats\n${summary.totalMatches} correspondances`;

  showNotification(message, "success");

  // Activer le bouton de résultats
  const viewBtn = document.getElementById("viewScannerResultsBtn");
  if (viewBtn) {
    viewBtn.disabled = false;
    viewBtn.innerHTML = `<span class="icon">📊</span> Voir les résultats (${summary.pagesWithMatches})`;
  }

  // Proposer d'ouvrir les résultats si il y en a
  if (summary.pagesWithMatches > 0) {
    const openResults = confirm(`Analyse terminée avec ${summary.pagesWithMatches} résultats trouvés.\n\nVoulez-vous ouvrir la page de résultats ?`);
    if (openResults) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('web-scanner-results.html')
      });
      window.close();
    }
  }
}

function handleScannerError(error) {
  hideScannerStatus();
  resetScannerUI();
  showNotification(`Erreur: ${error}`, "error");
  // NE PAS fermer le popup en cas d'erreur pour que l'utilisateur puisse réessayer
}

function resetScannerUI() {
  const startBtn = document.getElementById("startScannerBtn");
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.innerHTML = '<span class="icon">🕷️</span> Lancer l\'analyse';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Affichage de la version dans le popup
  const manifest = chrome.runtime.getManifest();
  const versionElement = document.getElementById("version");
  versionElement.textContent = `v${manifest.version}`;

  // Système d'onglets
  setupTabs();

  // Gestion du type d'analyse multiple
  setupAnalysisTypeToggle();

  // Configuration du bouton CORS
  setupCorsButton();

  // Configuration des boutons d'analyse
  setupAnalysisButtons();

  // Configuration des outils
  setupTools();

  // Configuration du Web Scanner
  setupWebScanner();
});

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Désactiver tous les onglets
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));

      // Activer l'onglet cliqué
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

function setupAnalysisTypeToggle() {
  const radioButtons = document.querySelectorAll('input[name="analysisType"]');
  const sitemapInput = document.getElementById('sitemapInput');
  const urlListInput = document.getElementById('urlListInput');

  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'sitemap') {
        sitemapInput.style.display = 'block';
        urlListInput.style.display = 'none';
      } else {
        sitemapInput.style.display = 'none';
        urlListInput.style.display = 'block';
      }
    });
  });
}

function setupCorsButton() {
  const toggleButton = document.getElementById("corsButton");

  // Initialiser l'état du bouton CORS
  chrome.storage.sync.get("corsEnabled", (result) => {
    const corsEnabled = result.corsEnabled || false;
    toggleButton.checked = corsEnabled;
  });

  // Écouter les changements d'état du bouton CORS
  toggleButton.addEventListener("click", () => {
    const corsEnabled = toggleButton.checked;
    chrome.storage.sync.set({ corsEnabled: corsEnabled }, () => {
      chrome.runtime.sendMessage({ corsEnabled: corsEnabled });
    });
  });
}

function setupAnalysisButtons() {
  // Analyse de la page courante
  document.getElementById("currentPageBtn").addEventListener("click", analyzeCurrentPage);

  // Analyse par sitemap ou liste d'URLs
  document.getElementById("analyserBtn").addEventListener("click", analyzeMultiplePages);
}

function analyzeCurrentPage() {
  // Activer CORS temporairement pour l'analyse
  toggleCors(true, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];

      // Envoyer un message au service worker pour démarrer l'analyse
      chrome.runtime.sendMessage({
        action: "startCurrentPageAnalysis",
        tabId: activeTab.id
      });

      // Fermer le popup
      window.close();
    });
  });
}

function analyzeMultiplePages() {
  try {
    // Désactiver le bouton pendant l'initialisation
    const analyzeBtn = document.getElementById("analyserBtn");
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="icon">⏳</span> Initialisation...';

    // Déterminer le mode d'analyse sélectionné
    const analysisType = document.querySelector('input[name="analysisType"]:checked').value;

    if (analysisType === 'sitemap') {
      // Mode sitemap.xml
      const sitemapUrl = document.getElementById('sitemapUrlInput').value.trim();

      if (!sitemapUrl) {
        showNotification("Veuillez entrer l'URL du sitemap.xml", "error");
        resetButton(analyzeBtn);
        return;
      }

      // Valider l'URL
      try {
        new URL(sitemapUrl);
      } catch (e) {
        showNotification("URL de sitemap invalide. Veuillez entrer une URL complète valide.", "error");
        resetButton(analyzeBtn);
        return;
      }

      // Envoyer un message au service worker pour démarrer l'analyse par sitemap
      toggleCors(true, () => {
        chrome.runtime.sendMessage(
          { action: "startSitemapAnalysis", sitemapUrl: sitemapUrl },
          () => {
            window.close();
          }
        );
      });

    } else {
      // Mode liste d'URLs
      const urlList = document.getElementById('urlListTextarea').value.trim();

      if (!urlList) {
        showNotification("Veuillez entrer au moins une URL à analyser", "error");
        resetButton(analyzeBtn);
        return;
      }

      // Parser et nettoyer les URLs
      const urls = urlList.split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      // Valider les URLs
      const invalidUrls = [];
      urls.forEach(url => {
        try {
          new URL(url);
        } catch (e) {
          invalidUrls.push(url);
        }
      });

      if (invalidUrls.length > 0) {
        showNotification(`Les URLs suivantes ne sont pas valides:\n${invalidUrls.join('\n')}`, "error");
        resetButton(analyzeBtn);
        return;
      }

      // Envoyer un message au service worker pour démarrer l'analyse par liste d'URLs
      toggleCors(true, () => {
        chrome.runtime.sendMessage(
          { action: "startUrlListAnalysis", urls: urls },
          () => {
            window.close();
          }
        );
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    showNotification(`Erreur: ${error.message}`, "error");
    resetButton(document.getElementById("analyserBtn"));
  }
}

function resetButton(button) {
  button.disabled = false;
  button.innerHTML = '<span class="icon">🔍</span> Analyser';
}

function toggleCors(enable, callback) {
  chrome.storage.sync.set({ corsEnabled: enable }, () => {
    chrome.runtime.sendMessage({ corsEnabled: enable });

    // Attendre un peu pour s'assurer que le message est traité
    setTimeout(() => {
      if (callback) callback();
    }, 100);
  });
}

async function injectScriptsForAnalysis(tab) {
  if (tab) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
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
              target: { tabId: tab.id },
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
            }
          );
        }, 50);
      }
    );
  }
}

function setupTools() {
  // Outil Meta Analyzer
  document.getElementById("metaAnalyzer").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      analyzeMetas(tabs[0]);
    });
  });
  // Outil Sitemap WP
  document.getElementById("sitemapWP").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function() {
          let sitemap = window.location.origin + "/page-sitemap.xml";
          window.open(sitemap, "_blank", "width=900,height=600,toolbar=no");
        },
      });
    });
  });

  // Outil Copy Expressions Soprod
  document.getElementById("copyExpressionsSoprod").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      copyExpressionsSoprod(tabs[0]);
    });
  });

  // Outil Download Media WP
  document.getElementById("downloadMediaWP").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      downloaderWPMedia(tabs[0]);
    });
  });

  // Outil Google Schema Validator
  document.getElementById("openGoogleSchemaValidator").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      richResultGoole(tabs[0]);
    });
  });

  // Outil Design Mode Toggle
  const designModeBtn = document.getElementById("designModeToggle");
  designModeBtn.addEventListener("click", function () {
    this.classList.toggle("active");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      toggleDesignMode(tabs[0]);
    });
  });

  // Outil Ratio Images
  document.getElementById("ratioImg").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      CheckRatioImages(tabs[0]);
    });
  });

  // Outil Links Duda
  document.getElementById("linksDuda").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      dudaSitemap(tabs[0]);
    });
  });

  // Outil vérification de la sémantique des ancres de lien
  document.getElementById("semanticLinks").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      semanticLinks(tabs[0]);
    });
  });

  // Outil Hn Validity
  document.getElementById("openHnValidity").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      HnOutlineValidity(tabs[0]);
    });
  });

  // Outil Words Cloud
  document.getElementById("wordsCloud").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      var tabId = activeTab.id;
      chrome.tabs.get(tabId, function (tab) {
        if (tab) {
          // Exécuter les scripts dans l'ordre
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["./assets/jquery-3.6.4.min.js"]
          }).then(() => {
            return chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["./Functions/settingsWords.js"]
            });
          }).then(() => {
            return chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["./Functions/counterWords.js"]
            });
          }).then(() => {
            return chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["./Functions/wordsCountLexical.js"]
            });
          }).then(() => {
            // Exécuter la fonction après le chargement de tous les scripts
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                // On vérifie que la fonction existe bien
                if (typeof window.wordsCloudCounter === 'function') {
                  // On l'exécute
                  window.wordsCloudCounter();
                } else {
                  console.error("wordsCloudCounter n'est pas disponible");
                }
              }
            });
          }).catch(err => {
            console.error('Erreur lors du chargement des scripts:', err);
          });
        }
      });
    });
  });
}
document.getElementById("diagnosticCORS").addEventListener("click", function () {
  // Sauvegarder le texte original du bouton
  const originalButtonText = this.textContent || "CORS";

  // Désactiver le bouton pendant le diagnostic
  this.disabled = true;
  this.textContent = "Diagnostic en cours...";

  // Fonction pour afficher le résultat et restaurer le bouton
  const displayResult = (result) => {
    console.log("Affichage du résultat CORS:", result);

    // Restaurer le bouton
    const button = document.getElementById("diagnosticCORS");
    button.disabled = false;
    button.textContent = originalButtonText;

    if (!result) {
      alert("Le diagnostic CORS a échoué. Aucun résultat n'a été reçu.");
      return;
    }

    switch (result.status) {
      case "fixed":
        alert(`Des problèmes CORS ont été détectés et corrigés:\n${result.inconsistencies?.join('\n') || result.message}\n\nL'extension devrait maintenant fonctionner correctement.`);
        break;

      case "ok":
        alert("✅ Aucun problème CORS détecté. L'extension fonctionne correctement.");
        break;

      case "error":
        console.error("CORS diagnostic error:", result.error, result.details);
        alert(`❌ Une erreur s'est produite lors du diagnostic CORS:\n${result.error || "Erreur inconnue"}\n\nVoir la console pour plus de détails.`);
        break;

      default:
        console.warn("Unknown CORS diagnostic status:", result.status);
        alert(`Résultat de diagnostic CORS inattendu: ${result.status || "statut inconnu"}`);
    }
  };

  // Écouter la notification de résultat prêt
  const messageListener = (message) => {
    if (message.action === 'corsResultReady') {
      // Supprimer l'écouteur de messages dès réception
      chrome.runtime.onMessage.removeListener(messageListener);
      clearTimeout(timeoutId); // Annuler le timeout

      // Si le résultat est directement inclus dans le message, l'utiliser
      if (message.result) {
        displayResult(message.result);
      } else {
        // Sinon, récupérer le résultat depuis le stockage local
        chrome.storage.local.get(['corsResult'], (data) => {
          displayResult(data.corsResult);
        });
      }
    }
  };

  // Ajouter l'écouteur de messages avant d'envoyer la requête
  chrome.runtime.onMessage.addListener(messageListener);

  // Ajouter un timeout pour éviter de bloquer indéfiniment
  const timeoutId = setTimeout(() => {
    chrome.runtime.onMessage.removeListener(messageListener);

    // Restaurer le bouton
    const button = document.getElementById("diagnosticCORS");
    button.disabled = false;
    button.textContent = originalButtonText;

    // Vérifier si un résultat est disponible dans le stockage
    chrome.storage.local.get(['corsResult', 'corsResultTimestamp'], (data) => {
      if (data.corsResult && data.corsResultTimestamp &&
        (Date.now() - data.corsResultTimestamp < 10000)) {
        displayResult(data.corsResult);
      } else {
        alert("Le diagnostic CORS a pris trop de temps. Veuillez réessayer.");
      }
    });
  }, 10000);

  // Lancer le diagnostic
  chrome.runtime.sendMessage({ action: "diagnoseCORS" }, (response) => {
    console.log("Réponse du diagnostic CORS:", response);

    if (!response || !response.received) {
      // La demande n'a pas été reçue, annuler tout
      clearTimeout(timeoutId);
      chrome.runtime.onMessage.removeListener(messageListener);

      // Restaurer le bouton
      this.disabled = false;
      this.textContent = originalButtonText;

      alert("Impossible de lancer le diagnostic CORS. Veuillez réessayer.");
    }
  });
});
function showNotification(message, type = "info") {
  // On pourrait implémenter une notification toast ici
  alert(message);
}