import {getActiveTabURL} from './Functions/utils.js';



//HnOutlineValidity()

  // Utilisez l'API chrome.runtime.getManifest() pour accéder aux informations du manifest
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;
  document.addEventListener("DOMContentLoaded", function () {

    // Utilisez la valeur récupérée comme bon vous semble
    console.log("Version de l'extension : " + version);

    // Faites ce que vous voulez avec la variable 'version', par exemple, l'afficher dans une div HTML
    var versionDiv = document.getElementById("version");

    console.log({versionDiv});
    versionDiv.innerText = "Version : " + version;
  });


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
            const links = [];
            const getAllPathValues = (obj) => {
              var values = [];

              const traverse = (obj) => {
                for (var key in obj) {
                  if (key === "path") {
                    const link = new URL(window.location.origin + obj[key]).href;
                    links.push(link)
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
            getAllPathValues(menuJson)
            const allLinksDom = ()=>{
              let finalLink = [];
              links.forEach((t,i)=>{
                link = t.includes("#") ? t.split('#')[0] : t;
              (link.includes('/site')) && finalLink.push(`<a href="${link}">${link}</a><br>`);
            });
            
            return [...new Set(finalLink)];
          }
          const newWindow = window.open("_blank","width=900,height=600,toolbar=no");
          newWindow.document.write(
            "<html><head><title>Sitemap Duda</title>"
          );
          newWindow.document.write(
            "<style>.missing {background-color: white!important;color: orange!important;}.noMissingHeading { background-color:green }.duplicate { background-color: orange }</style>"
          );
          newWindow.document.write(`</head><body>${allLinksDom()}<body></html>`);
          newWindow.document.close();
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

//  async function executeScriptHnValidity(tab) {
//     const activeTab = await getActiveTabURL();
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      
//     });
//   }

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
    document
    .querySelector(".openSitemap")
    .addEventListener("click", function () {
    console.log("btn sitemap : ", this);
    let sitemap = String(this.id).includes("sitemapWP")
      ? "/page-sitemap.xml"
      : "/sitemap.xml";
    if (window.location.origin.includes("responsivesiteeditor")) {
      const domainRoot =  document
      .querySelector('link[rel="alternate"]')
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
  // document
  //   .querySelector("#openConsole")
  //   .addEventListener("click", function () {
  //   console.log("clicked : ", this.id);
  //   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //     executeScriptOpenConsole(tabs[0]);
  //   });
  // });
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
            //function:CheckerImgFunc
            files: [
              "./Functions/HnOutlineValidity.js",
            ], 
          },
          function (results) {
            //DevToolsAPI.showPanel('console');
            // window.open('result.html','_blank');
            //CheckerImg();
            //window.close();
          }
        );
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
              //function:CheckerImgFunc
              files: [
                "./jquery-3.6.4.min.js",
                "./Functions/checkAndAddJquery.js",
                "./Functions/dataCheckerSchema.js",

                "./Functions/initLighthouse.js",
                "./Functions/counterWords.js",
                "./Functions/checkMetas.js",
                "./Functions/checkAltImages.js",
                "./Functions/checkOutlineHn.js",
                "./Functions/checkBold.js",
                "./Functions/counterLettersHn.js",
                "./Functions/initDataChecker.js",
                "./Functions/checkLinkAndImages.js",
              ], 
            },
            function (results) {
              window.close();
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


