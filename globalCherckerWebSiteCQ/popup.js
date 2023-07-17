(function ($) {
  function executeScriptInTab(tab, sitemap) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: mainFunction,
      args: [sitemap],
    });
  }
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
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          if (document.querySelector("#dm")) {
            const menuJson = JSON.parse(
              atob(
                document.head.innerHTML
                  .split("NavItems: ")[1]
                  .split("',")[0]
                  .replaceAll("'", "")
              )
            );
            const subNavOk = menuJson.filter((t) => t.subNav.length > 0);
            const nv1OutNav = menuJson.filter((t) => t.inNavigation === false);
            const nv1InNav = menuJson.filter((t) => t.inNavigation === true);
            nv1OutNav.map((t) => (t.niveau1Out = true)),
              nv1InNav.map((t) => (t.niveau1In = true));
            const nv2OutNav =
              subNavOk && subNavOk.filter((s) => s.inNavigation == false);
            nv2OutNav.niveau2Out = true;
            const nv2InNav =
              subNavOk && subNavOk.filter((s) => s.inNavigation == true);
            nv2InNav.niveau2In = true;
            const finalNavOut =
              nv2OutNav > 0 ? { nv1OutNav, nv2OutNav } : nv1OutNav;
            const finalNavIn = nv2InNav > 0 ? { nv1InNav, nv2InNav } : nv1InNav;
            console.log(
              "---------------------------------- Visible en navigation (depuis le menu) --------------------------------------------"
            );
            console.table(finalNavIn);
            console.log(
              "---------------------------------- Non visible dans la navigation (depuis le menu) --------------------------------------------"
            );
            console.table(finalNavOut);
            finalNavOut.map((t) => {
              console.log(
                "links outer nav : ",
                window.location.origin + t.path
              );
            });
            // return all links page Duda website
            const getAllPathValues = (obj) => {
              var values = [];

              const traverse = (obj) => {
                for (var key in obj) {
                  if (key === "path") {
                    console.log(
                      new URL(window.location.origin + obj[key]).href
                    );
                  } else if (typeof obj[key] === "object") {
                    traverse(obj[key]);
                  }
                }
              };

              traverse(obj);
              return values;
            };
            console.log(
              "------------------------------------- All links Duda website ------------------------------"
            );
            getAllPathValues(menuJson);
          }
        },
      });
    });
  }
  function executeScriptOpenConsole(tab) {
    console.log("Execution de openConsole sur le tag : ", tab);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          const event = new KeyboardEvent("keydown", {
            key: "j",
            code: "KeyJ",
            ctrlKey: true,
            shiftKey: true,
          });
          console.log({ event });
          document.dispatchEvent(event);
        },
      });
    });
  }

  function executeScriptHnValidity(tab) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          const isHeadingValid = (currentHn, previousHn) => {
            const currentHnIndex = parseInt(currentHn.charAt(1));
            const previousHnIndex = parseInt(previousHn.charAt(1));

            if (currentHn === previousHn) {
              return false;
            }

            if (currentHnIndex !== previousHnIndex + 1) {
              return false;
            }

            return true;
          };
          const hasDuplicateH1 = () => {
            const h1Tags = document.querySelectorAll("h1");
            const h1Texts = Array.from(h1Tags).map((h1) =>
              h1.textContent.toLowerCase()
            );
            const uniqueH1Texts = new Set(h1Texts);

            return h1Texts.length !== uniqueH1Texts.size;
          };
          const getHeadingStyle = (isValid, currentHnIndex, parentStyle) => {
            const backgroundColor = isValid
              ? parentStyle.backgroundColor
              : "orange";
            const margin = currentHnIndex * 50;

            return `margin-left: ${margin}px; color: green; display: flex; align-items: center; background-color: ${backgroundColor};`;
          };

          const getSpanStyle = (parentStyle, isValid, isMissingHeading) => {
            let backgroundColor = isMissingHeading
              ? "orange"
              : isValid
              ? "green"
              : "green";
            return `color: white; background: ${backgroundColor}; text-transform: uppercase; padding: 5px 20px;`;
          };

          let hnTagArray = [],
            hnTagContentArray = [];
          document
            .querySelectorAll("h1, h2, h3, h4, h5, h6")
            .forEach(function (t, i) {
              hnTagArray.push(t.tagName.toLowerCase());
              hnTagContentArray.push(t.textContent);
            });

          let structure = "",
            previousHn = null;

          hnTagArray.forEach(function (currentHn, index) {
            const currentHnContent = hnTagContentArray[index];
            const currentHnIndex = parseInt(currentHn.charAt(1));
            const parentStyle = window.getComputedStyle(
              document.querySelector(currentHn)
            );

            if (index > 0) {
              const isValid = isHeadingValid(currentHn, previousHn);

              if (!isValid) {
                const missingHeadingsCount =
                  currentHnIndex - (parseInt(previousHn.charAt(1)) + 1);

                for (let i = 1; i <= missingHeadingsCount; i++) {
                  const missingHnIndex = parseInt(previousHn.charAt(1)) + i;
                  const missingHn = `h${missingHnIndex}`;
                  const missingHnContent = `Missing Heading - ${missingHn}`;
                  const missingHeadingStyle = getHeadingStyle(
                    false,
                    missingHnIndex,
                    parentStyle
                  );
                  structure += `<${missingHn} class="missing" style="${missingHeadingStyle}"><span style="${getSpanStyle(
                    parentStyle,
                    false,
                    true
                  )}">${missingHn}</span> - ${missingHnContent}</${missingHn}><br>`;
                }
              }
              if (currentHn === "h1" && hasDuplicateH1()) {
                structure += `<${currentHn} class="duplicate" style="${getHeadingStyle(
                  false,
                  currentHnIndex,
                  parentStyle
                )}"><span style="${getSpanStyle(
                  parentStyle,
                  false,
                  false
                )}">Warning: Duplicate H1</span> - ${currentHnContent}</${currentHn}><br>`;
              }
            }

            const headingStyle = getHeadingStyle(
              true,
              currentHnIndex,
              parentStyle
            );
            structure += `<${currentHn} style="${headingStyle}"><span style="${getSpanStyle(
              parentStyle,
              true,
              false
            )}">${currentHn}</span> - ${currentHnContent}</${currentHn}><br>`;
            previousHn = currentHn;
          });
          console.log({ structure });
          const newWindow = window.open("", "_blank");
          newWindow.document.write(
            "<html><head><title>Structure corrigée</title>"
          );
          newWindow.document.write(
            "<style>.missing {background-color: white!important;color: orange!important;}.noMissingHeading { background-color:green }.duplicate { background-color: orange }</style>"
          );
          newWindow.document.write(`</head><body>${structure}<body></html>`);
          newWindow.document.close();
        },
      });
    });
  }
  /*
    function executeScriptInTabConsole(tab) {
        console.log(' before executeScriptInTabConsole start',tab);
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: function(){
                console.log('executeScriptInTabConsole start');
                chrome.devtools.inspectedWindow.eval("DevToolsAPI.showPanel('console')");
            },
        });
    }
    */

  function mainFunction(sitemap) {
    console.log("open sitemap : ", window.location.origin + sitemap);
    window.open(
      window.location.origin + sitemap,
      "_blank",
      "width=500,height=800,toolbar=no"
    );
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
  $(".openSitemap").on("click", function () {
    console.log("btn sitemap : ", this);
    let sitemap = String(this.id).includes("sitemapWP")
      ? "/page-sitemap.xml"
      : "/sitemap.xml";
    if (window.location.origin.includes("responsivesiteeditor")) {
      const domainRoot = $('link[rel="alternate"]')
        .attr("href")
        .split("/site")[0];
      console.log("sitemap Duda prepup : ", domainRoot + "sitemap.xml");
      sitemap = domainRoot + "sitemap.xml";
    }
    console.log({ sitemap });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      executeScriptInTab(tabs[0], sitemap);
    });
  });
  $("#openConsole").on("click", function () {
    console.log("clicked : ", this.id);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      executeScriptOpenConsole(tabs[0]);
    });
  });
  $("#copyExpressionsSoprod").on("click", function (me) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      executeScriptcopyExpressionsSoprod(tabs[0]);
    });
  });

  /*
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.windows.getCurrent(function (currentWindow) {
      chrome.devtools.inspectedWindow.eval(
        'inspect(window)',
        function (result, isException) {
          chrome.windows.update(
            currentWindow.id,
            { focused: true },
            function (window) {
              chrome.devtools.panels.open(
                chrome.devtools.panels.elements,
                function () {
                  chrome.runtime.sendMessage({ action: 'executeScript' });
                }
              );
            }
          );
        }
      );
    });
  });
  */
  //Blocage du pop-up afin qu'il reste actif même si j'intérragie avec le tab focus
  /*document.addEventListener('DOMContentLoaded', function() {
    setTimeout(()=>{
        chrome.windows.getLastFocused(function(window) {
          chrome.windows.update(window.id, { focused: true });
        });
      },300);
    });
    */

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
        executeScriptHnValidity(tabs[0]);
      });
    });
  // Dans popup.js
  async function CheckerImgFunc() {
    const { CheckerImg } = await import("Functions/CheckerImg.js");
    CheckerImg();
  }
  document.querySelector("#analyserBtn").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      var tabId = activeTab.id;
      var tabUrl = activeTab.url;
      chrome.tabs.get(tabId, function (tab) {
        var tabContent = tab ? tab.content : null;
        console.log(tab, { tabContent });
        if (tab) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              //function:CheckerImgFunc
              files: [
                "./jquery-3.6.4.min.js",
                "./script.js",
                "./result.js",
              ], //,'./contentScript.js'],
            },
            function (results) {
              //DevToolsAPI.showPanel('console');
              // window.open('result.html','_blank');
              //CheckerImg();
              window.close();
            }
          );
        }
      });
    });
  });
  document.querySelector("#coffeeLink").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          window.open(
            "https://github.com/artkabis/toolsWP/tree/main/Solocal%20tools%2C%20tips%20%26%20fix/tools-cq-checker/Chrome-extension/globalCheckerWebsite",
            "_blank"
          );
        },
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
  /*
  document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const storageKey = 'toggleState';
  
    // Récupérer l'état précédent du stockage local
    chrome.storage.local.get([storageKey], (result) => {
      toggleSwitch.checked = result[storageKey] || false;
  
      // Établir une connexion avec le script de fond
      const backgroundPort = chrome.runtime.connect({ name: 'popup' });
  
      // Envoyer un message au script de fond avec l'état initial du bouton
      backgroundPort.postMessage({ isEnabled: toggleSwitch.checked });
  
      // Ajouter un écouteur d'événement pour les messages provenant du script de fond
      backgroundPort.onMessage.addListener((message) => {
        toggleSwitch.checked = message.isEnabled;
      });
    });
  
    // Ajouter une écoute d'événement au bouton de type toggle
    toggleSwitch.addEventListener('change', () => {
      // Obtenir l'état actuel du bouton toggle
      const isChecked = toggleSwitch.checked;
  
      // Enregistrer l'état dans le stockage local
      chrome.storage.local.set({ [storageKey]: isChecked });
  
      // Établir une connexion avec le script de fond
      const backgroundPort = chrome.runtime.connect({ name: 'popup' });
  
      // Envoyer un message au script de fond pour activer ou désactiver la règle
      backgroundPort.postMessage({ isEnabled: isChecked });
    });
  });
  */

  /*document.addEventListener('DOMContentLoaded', function() {
    var corsButton = document.getElementById('corsButton');

    corsButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'toggleCORS', enable: corsButton.checked, prefs: {} });
    });
  });
  */
})(jQuery);
