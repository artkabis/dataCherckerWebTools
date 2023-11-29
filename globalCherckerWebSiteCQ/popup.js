import { getActiveTabURL } from "./Functions/utils.js";
import { richResultGoole } from "./Functions/richResultGoogle.js";
import { toggleDesignMode } from "./Functions/toggleDesignMode.js";
import { copyExpressionsSoprod } from "./Functions/copyExpressionsSoprod.js";
import { dudaSitemap } from "./Functions/DudaSitemap.js";
import { HnOutlineValidity } from "./Functions/HnOutlineValidity.js";

// chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
//   chrome.scripting.executeScript({
//     target: { tabId: tab[0].id },
//     function: function () {
//       if (window.location.origin.includes("soprod")) {
//         setTimeout(function () {
//           const dropUser
//           const user = dropUser.innerHTML;
//           chrome.storage.sync.set({ user: user }, function () {
//             // Envoi d'un message à l'arrière-plan pour mettre à jour l'état de user
//             chrome.runtime.sendMessage({ user: user });
//           });
//         }, 100);
//       }
//     },
//   });
// });

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
              "./assets/console.image.min.js",
              "./Functions/checkAndAddJquery.js",
              './Functions/settingsOptions.js',


              "./Functions/settingsWords.js",
              "./Functions/dataCheckerSchema.js",
              "./Functions/initLighthouse.js",
              "./Functions/counterWords.js",
              "./Functions/checkMetas.js",
              "./Functions/checkAltImages.js",
              "./Functions/checkBold.js",
              "./Functions/checkOutlineHn.js",
              "./Functions/checkColorContrast.js",
              "./Functions/counterLettersHn.js",
              //"./Functions/checkUserSoprod.js",
              "./Functions/initDataChecker.js",
              "./Functions/checkDataBindingDuda.js",
              "./Functions/checkLinkAndImages.js",
            ],
          },
          function () {
            // close popup
            window.close();
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
      var tabContent = tab ? tab.content : null;
      console.log(tab, { tabContent });
      if (tab) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [
            "./Functions/settingsWords.js",
            "./Functions/counterWords.js",
            "./Functions/wordsCountLexical.js",
          ],
        });
      }
    });
  });
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