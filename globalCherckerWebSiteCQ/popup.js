import { getActiveTabURL } from "./Functions/utils.js";
import { richResultGoole } from "./Functions/richResultGoogle.js";
import { toggleDesignMode } from "./Functions/toggleDesignMode.js";
import { copyExpressionsSoprod } from "./Functions/copyExpressionsSoprod.js";
import { dudaSitemap } from "./Functions/DudaSitemap.js";
import { HnOutlineValidity } from "./Functions/HnOutlineValidity.js";
import { downloaderWPMedia } from "./Functions/downloaderWPMedias.js";
//import { initSitemapAnalysis } from "./Functions/sitemapAnalyzer.js";



document.querySelectorAll('input[name="analysisType"]').forEach(radio => {
  radio.addEventListener('change', function () {
    if (this.value === 'sitemap') {
      document.getElementById('sitemapInput').style.display = 'block';
      document.getElementById('urlListInput').style.display = 'none';
    } else {
      document.getElementById('sitemapInput').style.display = 'none';
      document.getElementById('urlListInput').style.display = 'block';
    }
  });
});
// Modification du gestionnaire pour le bouton d'analyse
document.querySelector("#analyserBtn").addEventListener("click", async function () {
  try {
    // Désactiver le bouton pendant l'initialisation
    this.disabled = true;
    this.innerHTML = '<span class="icon">⏳</span><span class="text">Initialisation...</span>';

    // Déterminer le mode d'analyse sélectionné
    const analysisType = document.querySelector('input[name="analysisType"]:checked').value;

    let urls = [];

    if (analysisType === 'sitemap') {
      // Mode sitemap.xml
      const sitemapUrl = document.getElementById('sitemapUrlInput').value;

      if (!sitemapUrl) {
        alert("Veuillez entrer l'URL du sitemap.xml");
        this.disabled = false;
        this.innerHTML = 'Analyser';
        return;
      }

      // Valider l'URL
      try {
        new URL(sitemapUrl);
      } catch (e) {
        alert("URL de sitemap invalide. Veuillez entrer une URL complète valide.");
        this.disabled = false;
        this.innerHTML = 'Analyser';
        return;
      }

      // Envoyer un message au service worker pour démarrer l'analyse par sitemap
      chrome.runtime.sendMessage(
        { action: "startSitemapAnalysis", sitemapUrl: sitemapUrl },
        (response) => {
          // Le service worker a reçu la demande, le popup peut se fermer
          window.close();
        }
      );

    } else {
      // Mode liste d'URLs
      const urlList = document.getElementById('urlListTextarea').value;

      if (!urlList.trim()) {
        alert("Veuillez entrer au moins une URL à analyser");
        this.disabled = false;
        this.innerHTML = 'Analyser';
        return;
      }

      // Parser et nettoyer les URLs
      urls = urlList.split(',')
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
        alert(`Les URLs suivantes ne sont pas valides:\n${invalidUrls.join('\n')}`);
        this.disabled = false;
        this.innerHTML = 'Analyser';
        return;
      }

      // Envoyer un message au service worker pour démarrer l'analyse par liste d'URLs
      chrome.runtime.sendMessage(
        { action: "startUrlListAnalysis", urls: urls },
        (response) => {
          // Le service worker a reçu la demande, le popup peut se fermer
          window.close();
        }
      );
    }

  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    alert(`Erreur: ${error.message}`);
    this.disabled = false;
    this.innerHTML = 'Analyser';
  }
});
document.querySelector("#sitemapAnalyzer").addEventListener("click", async function () {
  try {
    // Désactiver le bouton pendant l'initialisation
    this.disabled = true;
    this.innerHTML = '<span class="icon">⏳</span><span class="text">Initialisation...</span>';

    // Demander l'URL du sitemap
    const sitemapUrl = prompt("Veuillez entrer l'URL complète du sitemap.xml", "https://example.com/sitemap.xml");

    if (!sitemapUrl) {
      // L'utilisateur a annulé
      this.disabled = false;
      this.innerHTML = '<span class="icon">🌐</span><span class="text">Analyser le site</span>';
      return;
    }

    // Valider l'URL
    try {
      new URL(sitemapUrl);
    } catch (e) {
      alert("URL invalide. Veuillez entrer une URL complète valide.");
      this.disabled = false;
      this.innerHTML = '<span class="icon">🌐</span><span class="text">Analyser le site</span>';
      return;
    }

    // Envoyer un message au service worker pour démarrer l'analyse
    chrome.runtime.sendMessage(
      { action: "startSitemapAnalysis", sitemapUrl: sitemapUrl },
      (response) => {
        // Le service worker a reçu la demande, le popup peut se fermer
        window.close();
      }
    );

  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    alert(`Erreur: ${error.message}`);
    this.disabled = false;
    this.innerHTML = '<span class="icon">🌐</span><span class="text">Analyser le site</span>';
  }
});



//Affichage de la version dans popup via manifest.version
document.addEventListener("DOMContentLoaded", function () {
  // use Chrome API chrome.runtime.getManifest() for listen the version of this extension
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;
  //Add version in popup.html
  const versionDiv = document.getElementById("version");
  console.log({ versionDiv });
  versionDiv.innerText = "Version : " + version;
});

//listen cors toggle cors activity
var toggleButton = document.getElementById("corsButton");
document.addEventListener("DOMContentLoaded", function () {
  let corsEnabled = false;
  chrome.storage.sync.set({ corsEnabled: corsEnabled }, function () {
    // update state of cors

    toggleButton.checked = corsEnabled;
    toggleButton.textContent = !corsEnabled ? "Désactiver" : "Activer";
    console.log("click toggle cors : ", { corsEnabled });
    // send message in service-worker for update state
    chrome.runtime.sendMessage({ corsEnabled: corsEnabled });
  });

  // get actualy state of corsEnabled value
  chrome.storage.sync.get("corsEnabled", function (result) {
    var corsEnabled = result.corsEnabled;
    toggleButton.checked = corsEnabled; // update state checkbox
    toggleButton.textContent = !corsEnabled ? "Désactiver" : "Activer";

    // listen event click checkbox
    toggleButton.addEventListener("click", function () {
      // toggle value of corsEnabled
      corsEnabled = !corsEnabled;
      chrome.storage.sync.set({ corsEnabled: corsEnabled }, function () {
        // update state checkbox
        toggleButton.checked = corsEnabled;
        toggleButton.textContent = corsEnabled ? "Désactiver" : "Activer";
        console.log("click toggle cors : ", { corsEnabled });
        // send message for the update the corsEnabled in service-worker
        chrome.runtime.sendMessage({ corsEnabled: corsEnabled });
      });
    });
  });
});

document.querySelector(".openSitemap").addEventListener("click", function () {
  console.log("btn sitemap : ", this);
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

document
  .querySelector("#copyExpressionsSoprod")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      copyExpressionsSoprod(tabs[0]);
    });
  });

document
  .querySelector("#downloadMediaWP")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      downloaderWPMedia(tabs[0]);
    });
  });

document
  .querySelector("#openGoogleSchemaValidator")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      richResultGoole(tabs[0]);
    });
  });
document
  .querySelector("#designModeToggle")
  .addEventListener("click", function () {
    !this.classList.contains("actif")
      ? this.classList.add("actif")
      : this.classList.remove("actif");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      toggleDesignMode(tabs[0]);
    });
  });
document.querySelector("#linksDuda").addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    dudaSitemap(tabs[0]);
  });
});

document
  .querySelector("#openHnValidity")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      HnOutlineValidity(activeTab);
    });
  });

document.querySelector("#analyserBtn").addEventListener("click", function () {
  var toggleButton = document.getElementById("corsButton");
  toggleButton.click();
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    var tabId = activeTab.id;
    chrome.tabs.get(tabId, function (tab) {
      var tabContent = tab ? tab.content : null;
      console.log(tab, { tabContent });
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
                    "./Functions/checkLinkAndImages.js",
                  ],
                },
                () => {
                  // Fermez la fenêtre contextuelle
                  window.close();
                }
              );
            }, 50);
          }
        );

      }
    });
  });
});
document.querySelector("#wordsCloud").addEventListener("click", function () {
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
