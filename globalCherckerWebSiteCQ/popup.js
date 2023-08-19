import { getActiveTabURL } from "./Functions/utils.js";
console.log(jQuery, $);
//HnOutlineValidity()
chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
chrome.scripting.executeScript({
  target: { tabId: tab[0].id },
  function: function () {
    if(window.location.origin.includes('soprod')){
        setTimeout(function () {
        console.log('---------------------- add user in soprod --------------------');  
        const dropUser = document.querySelector('.dropdown-user .username');
        console.log({dropUser},dropUser.innerHTML);
        const user = dropUser.innerHTML;
        console.log(' user in DOM Soprod : ',{user});
        chrome.storage.sync.set({ user: user }, function () {
          console.log("sync set user : ", { user });
          // Envoi d'un message à l'arrière-plan pour mettre à jour l'état des règles
          chrome.runtime.sendMessage({ user: user });
        });
      },100);

    }

  }
});
})

// Utilisez l'API chrome.runtime.getManifest() pour accéder aux informations du manifest
const manifest = chrome.runtime.getManifest();
const version = manifest.version;
document.addEventListener("DOMContentLoaded", function () {
  // Utilisez la valeur récupérée comme bon vous semble
  console.log("Version de l'extension : " + version);

  // Faites ce que vous voulez avec la variable 'version', par exemple, l'afficher dans une div HTML
  var versionDiv = document.getElementById("version");

  console.log({ versionDiv });
  versionDiv.innerText = "Version : " + version;
});

function executeScriptInTabGoogle(tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      window.open(
        "https://search.google.com/test/rich-results?utm_source=support.google.com%2Fwebmasters%2F&utm_medium=referral&utm_campaign=7445569&url=" +
          encodeURIComponent(window.location.href),
        "_blank",
        "width=500,height=800,toolbar=no"
      );
    },
  });
}
function executeScriptDesignModeToggle(tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      let dn = document.designMode;
      document.designMode = dn === "off" ? "on" : "off";
    },
  });
}
function executeScriptDudaPages(tab) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["./Functions/DudaSitemap.js"],
    });
  });
}


function executeScriptcopyExpressionsSoprod() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        console.log(
          "executeScriptcopyExpressionsSoprod",
          window.location.origin.includes("soprod")
        );
        (() => {
          if (window.location.origin.includes("soprod")) {
            function e(e) {
              var o = document.createElement("textarea");
              (o.value = e),
                o.setAttribute("readonly", ""),
                (o.style = { position: "absolute", left: "-9999px" }),
                document.body.appendChild(o),
                o.select(),
                document.execCommand("copy"),
                document.body.removeChild(o);
            }
            var o = document.querySelectorAll(
                'div[id^="keywordsContainer"] > div > input'
              ),
              t = "",
              value = "";
            o.forEach(function (e) {
              value =
                e.className.includes("keyword") && e.value != ""
                  ? (value += e.value)
                  : value + " " + e.value + "\n\n";
            }),
              e(value),
              alert(value);
          }
        })();
      },
    });
  });
}


document.querySelector(".openSitemap").addEventListener("click", function () {
  console.log("btn sitemap : ", this);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function(){
        let sitemap = window.location.origin+"/page-sitemap.xml";
         window.open(sitemap,
          "_blank",
          "width=900,height=600,toolbar=no"
        );
      }
    });
  });
});

document
  .querySelector("#copyExpressionsSoprod")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      executeScriptcopyExpressionsSoprod(tabs[0]);
    });
  });

document
  .querySelector("#openGoogleSchemaValidator")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      executeScriptInTabGoogle(tabs[0]);
    });
  });
document
  .querySelector("#designModeToggle")
  .addEventListener("click", function () {
    !this.classList.contains("actif")
      ? this.classList.add("actif")
      : this.classList.remove("actif");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      executeScriptDesignModeToggle(tabs[0]);
    });
  });
document.querySelector("#linksDuda").addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    executeScriptDudaPages(tabs[0]);
  });
});

document
  .querySelector("#openHnValidity")
  .addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: ["./Functions/HnOutlineValidity.js"],
        });
    });
  });

document.querySelector("#analyserBtn").addEventListener("click", function () {
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
              "./Functions/dataCheckerSchema.js",

              "./Functions/initLighthouse.js",
              "./Functions/counterWords.js",
              "./Functions/checkMetas.js",
              "./Functions/checkAltImages.js",
              "./Functions/checkBold.js",
              "./Functions/checkOutlineHn.js",
              "./Functions/counterLettersHn.js",
              "./Functions/checkLinkAndImages.js",
              "./Functions/checkDataBindingDuda.js",
              "./Functions/initDataChecker.js",
            ],
          },
          function (results) {
           // window.close();
          }
        );
      }
    });
  });
});

//gestion du checkbox des cors à l'ouverture du popup
var toggleButton = document.getElementById("corsButton");
document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.set({ corsEnabled: true }, function () {
    // Mise à jour de l'état de la case à cocher
    let corsEnabled = true;
    toggleButton.checked = corsEnabled;
    toggleButton.textContent = corsEnabled ? "Désactiver" : "Activer";
    console.log("click toggle cors : ", { corsEnabled });
    // Envoi d'un message à l'arrière-plan pour mettre à jour l'état des règles
    chrome.runtime.sendMessage({ corsEnabled: true });
  });

  // Récupération de l'état actuel des règles lors du chargement de la page
  chrome.storage.sync.get("corsEnabled", function (result) {
    var corsEnabled = result.corsEnabled;
    console.log("état du corsEnabled : ", corsEnabled);
    toggleButton.checked = corsEnabled; // Met à jour l'état de la case à cocher
    toggleButton.textContent = corsEnabled ? "Désactiver" : "Activer";

    // Écouteur d'événement pour le clic sur le bouton
    toggleButton.addEventListener("click", function () {
      // Inversion de l'état et sauvegarde dans le stockage
      corsEnabled = !corsEnabled;
      chrome.storage.sync.set({ corsEnabled: corsEnabled }, function () {
        // Mise à jour de l'état de la case à cocher
        toggleButton.checked = corsEnabled;
        toggleButton.textContent = corsEnabled ? "Désactiver" : "Activer";
        console.log("click toggle cors : ", { corsEnabled });
        // Envoi d'un message à l'arrière-plan pour mettre à jour l'état des règles
        chrome.runtime.sendMessage({ corsEnabled: corsEnabled });
      });
    });
  });
});