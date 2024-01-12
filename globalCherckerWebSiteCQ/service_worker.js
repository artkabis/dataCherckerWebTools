"use strict";
//import {openDb,getObjectStore} from './Functions/utils.js';
import { creatDB } from "./Functions/creatIndexDB.js";
//import {checkUserSoprod} from "./Functions/checkUserSoprod.js";
//import { checkUserIndexDB } from "./Functions/checkUserIndexDB.js";

// Définir le nom de votre cache
//const cacheName = "dataschecker-cache";
//const extensionBasePath = self.registration.scope;
// Liste des ressources à mettre en cache (URL complètes)
const resourcesToCache = [
  "./popup.html",
  "./popup.js",
  "./interface.html",
  "./service_worker.js",
  "./icons/github-mark-white.png",
  "./icons/hn-icon.png",
  "./icons/icon-soprod.JPG",
  "./icons/merciAppIcon.JPG",
  "./icons/sitemap.png",
  "./icons/SofixedMenu-128.png",
  "./icons/SofixedMenu-16.png",
  "./icons/SofixedMenu-48.png",
  "./icons/SofixedMenu-520.png",
  "./icons/soprod.png",
  "./icons/SofixedMenu-128.png",
  "./icons/SofixedMenu-16.png",
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
  "./Functions/wordsCloud.js",
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
// self.addEventListener('install', event => {
//   event.waitUntil(
//     caches.open(cacheName).then(cache => {
//       // Mettre en cache toutes les ressources
//       return cache.addAll(resourcesToCache);
//     })
//   );
// });

// // Événement de récupération (fetch) de ressources
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request).then(cachedResponse => {
//       // Retourner la ressource mise en cache si elle existe, sinon effectuer une requête réseau
//       return cachedResponse || fetch(event.request);
//     })
//   );
// });

// // Étape d'activation du service worker
// self.addEventListener('activate', (event) => {
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cacheName) => {
//           if (cacheName !== 'dataschecker-cache') {
//             return caches.delete(cacheName);
//           }
//         })
//       );
//     })
//   );
// });

// Gestion des requêtes avec fetch
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       // Si la ressource est présente dans le cache, renvoyez-la
//       if (response) {
//         return response;
//       }

//       // Sinon, effectuez une requête réseau et mettez en cache la réponse
//       return fetch(event.request).then((response) => {
//         // Assurez-vous que la réponse est valide
//         if (!response || response.status !== 200 || response.type !== 'basic') {
//           return response;
//         }

//         const responseToCache = response.clone();

//         caches.open('dataschecker-cache').then((cache) => {
//           cache.put(event.request, responseToCache);
//         });

//         return response;
//       });
//     })
//   );
// });

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

// Événement fetch pour permettre au service worker de gérer les requêtes réseau
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Vérifiez si le message provient de votre contenu ou de votre script d'arrière-plan
  // pour éviter de répondre à des messages non pertinents.
  if (message.from === "content_script" && message.subject === "fetch") {
    // Utilisez la méthode 'fetch()' ici pour effectuer vos requêtes réseau
    // et renvoyer la réponse via 'sendResponse'.
    fetch(message.url)
      .then((response) => response.text())
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    // Indiquez que vous souhaitez conserver le canal de communication ouvert
    // jusqu'à ce que la réponse soit envoyée.
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

// chrome.runtime.onInstalled.addListener(once);
// chrome.runtime.onStartup.addListener(once);
let user_soprod;
/****** check all tab and remove interface*/
let allTabs = [];

(async () => {
  try {
    const solocalmsTabs = await chrome.tabs.query({ url: "*://*.solocalms.fr/*" });

    if (solocalmsTabs.length > 0) {
      console.log("soprod tab detected...");
      // Des onglets avec solocalms.fr ont été détectés
      allTabs.push(...solocalmsTabs);
    } else {
      // Aucun onglet avec solocalms.fr détecté, ajouter uniquement l'onglet actif
      const activeTab = await chrome.tabs.query({ currentWindow: true, active: false });
      console.log("active tab car pas d'onglet soprod : ", activeTab);
      allTabs.push(activeTab[1]);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Votre code à exécuter après la récupération des onglets
    console.log('allTabs:', allTabs);
  }
})();




// const detectOnotherInterface = (allTabs) => {
//   chrome.tabs.query({}, tabs => {tabs.forEach((tab, i) => {
//     tab.url.includes("interface.html") && chrome.tabs.remove(tab.id);
//   });
// });
// };
// Fonction pour parcourir les onglets de la fenêtre active
// chrome.windows.getCurrent({ populate: true }, function (currentWindow) {
//   // Vérifier si la fenêtre est valide et si elle contient des onglets
//   if (currentWindow && currentWindow.tabs) {
//     for (const tab of currentWindow.tabs) {
//       // Vérifier si l'URL commence par "http" et n'est pas de type "chrome://"
//       if (tab.url && tab.url.startsWith("http") && !tab.url.startsWith("chrome://")) {
//         // Faites quelque chose avec l'onglet, par exemple, affichez l'URL dans la console
//         allTabs.push(tab)
//       } else {
//         console.log("URL non valide :", tab.url);
//       }
//     }
//   }
// });


let cmp = 0;
let cmpInterval = 0;
let global_data = {};
const db_name = "db_datas_checker";
const detecteSoprod = async () => {
  console.log("detecting soprod tab");
  const storageUser = await chrome.storage.sync.get("user");

  console.log('All tabs : ', { allTabs });
  let isSoprodTab = {};
  isSoprodTab.detected = false;
  let userSoprod = undefined;
  let soprodTabsDetected = 0;

  allTabs.map(async (tab, i) => {
    if ( tab && tab.url.includes("soprod")) {
      soprodTabsDetected++; // Incrémente le compteur de tabs "soprod" détectés
      console.log("soprod detecteSoprod");
      // Exécute le script dans le tab actuel s'il existe
      console.log("tab id soprod : ", tab.id);
      
      if (tab.id) {
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
          "includes SO : ",
          storageUser.user.includes("SO")
        );
        if (
          storageUser.user === undefined &&
          !storageUser.user.includes("SO")) {
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
        } else if (storageUser.user.includes("SO")) {
          console.log(
            "user detected and username includes SO : " +
            storageUser.user.includes("SO"),
            "     user : ",
            storageUser.user
          );

          chrome.windows.getCurrent({ populate: true }, async function (currentWindow) {
            // Vérifier si la fenêtre est valide et si elle contient des onglets
            if (currentWindow && currentWindow.tabs) {
              for (const tab of currentWindow.tabs) {
                // Vérifier si l'URL commence par "http" et n'est pas de type "chrome://"
                if (tab.url && tab.url.startsWith("http") && !tab.url.startsWith("chrome://")) {
                  // Faites quelque chose avec l'onglet, par exemple, affichez l'URL dans la console
                  await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    async function(tab) {
                      console.log('_____________');
                      const storageUser = await chrome.storage.sync.get("user");
                      console.log(
                        "++",
                        storageUser.user
                      );
                      chrome.storage.sync.set({ user: storageUser.user }, function () {
                        chrome.runtime.sendMessage({ user: storageUser.user });
                      });
                    },
                  });
                }
              }
            }
          });
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
      console.log(
        "Data de datachecker : ",
        request.data
      );
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
      console.log(
        " Data de user Soprod : ",
        request.user
      );
      cmp === 1 && cmp++;
      console.log(" cmp + 1 in user soprod : ", cmp);
      user = request.user;
      global_data.user = user;
    }
  }
  const checkDatas = () => {
    cmpInterval++;
    if (cmp === 2) {
      console.log(
        "Interval function ready : ",
        { interCheck }
      );
      //cleanInterval();
      console.log(
        "Data_checker -> ",
        global_data.dataChecker
      );
      if (global_data.dataChecker) {
        const user = global_data.user;
        console.log(
          "User pour envoi vers indexDB : ",
          global_data.user
        );
        global_data.user = global_data.user ? global_data.user : "Customer";//JSON.parse(global_data.user)
        console.log(
          "Les deux datas sont bien arrivées : ",
          { global_data }
        );
        const dataCheckerParse = JSON.parse(global_data.dataChecker);
        creatDB(user, db_name, dataCheckerParse);
        console.log(
          "CREATEDB -> lanuche with the datas :  user = ",
          user,
          { db_name },
          { dataCheckerParse }
        );

        cmp = 0;
        // Fonction pour récupérer l'ID de l'onglet depuis le stockage local
        const getPopupWindowId = (callback) => {
          chrome.storage.local.get(['popupWindowId'], (result) => {
            const storedPopupWindowId = result.popupWindowId;
            callback(storedPopupWindowId);
          });
        }

        // Fonction pour stocker l'ID de l'onglet dans le stockage local
        const setPopupWindowId = (id) => {
          chrome.storage.local.set({ 'popupWindowId': id });
        }

        // Fonction pour fermer la fenêtre si elle existe
        const closeWindowIfExists = (windowId, callback) => {
          if (windowId) {
            chrome.windows.get(windowId, {}, (windowInfo) => {
              if (chrome.runtime.lastError || !windowInfo) {
                // Fenêtre introuvable ou erreur, ne pas fermer
                console.log('Window not found or error:', chrome.runtime.lastError);
                callback();
              } else {
                // Fenêtre trouvée, la fermer
                chrome.windows.remove(windowId, () => {
                  console.log('Closed existing window with ID:', windowId);
                  callback();
                });
              }
            });
          } else {
            // Aucun ID de fenêtre, ne rien faire
            callback();
          }
        }

        // Fonction pour ouvrir ou remplacer la fenêtre
        const openOrReplaceWindow = () => {
          console.log('start open interface');
          const interfacePopupUrl = chrome.runtime.getURL("interface.html");

          // Récupérer l'ID de l'onglet depuis le stockage local
          getPopupWindowId((popupWindowId) => {
            console.log('Stored popup interface ID:', popupWindowId);

            // Fermer la fenêtre existante (si elle existe encore)
            closeWindowIfExists(popupWindowId, () => {
              // Ouvrir une nouvelle fenêtre
              chrome.windows.create({
                type: 'popup',
                url: interfacePopupUrl,
                width: 1000,
                height: 1000,
              }, (window) => {
                // Stocker le nouvel ID de fenêtre dans le stockage local
                setPopupWindowId(window.id);
                console.log('New popup interface ID:', window.id);
              });
            });
          });
        }

        // Appel de la fonction pour ouvrir ou remplacer la fenêtre
        openOrReplaceWindow();

        // chrome.windows.create({
        //   url: `${interfacePopupUrl}`, //?data=${encodeURIComponent(JSON.stringify(dataCheckerJSON))}
        //   type: "popup",
        //   width: 1000,
        //   height: 1000,
        // });
      }
    }
  };
  checkDatas();
});
