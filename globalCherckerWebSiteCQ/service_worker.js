//import {openDb,getObjectStore} from './Functions/utils.js';
import {creatDB} from './Functions/creatIndexDB.js';
import {checkUserSoprod} from "./Functions/checkUserSoprod.js";
import { checkUserIndexDB } from './Functions/checkUserIndexDB.js';





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

chrome.runtime.onInstalled.addListener(once);
chrome.runtime.onStartup.addListener(once);
let user_soprod;
/****** check all tab and remove interface*/
const  detectOnotherInterface = async () => {
  const allTabs = await chrome.tabs.query({});
  allTabs.forEach((tab, i) => {
    (tab.url.includes("interface.html")) &&
      chrome.tabs.remove(tab.id);
  });
};

const detectSoprod = async () =>{
  const allTabs = await chrome.tabs.query({});
  let isSoprodTab = {};
  allTabs.forEach(async (tab, i) => {
  if (tab.url.includes("soprod")) {
    isSoprodTab.detected = true;
    console.log({isSoprodTab})
    checkUserSoprod(tab);
  }
});

}



let cmp = 0;
let cmpInterval = 0;
let global_data = {};
const db_name = "db_datas_checker";
// Utilisez la fonction checkUserIndexDB pour récupérer userName
let userDB;
checkUserIndexDB()
    .then((userName) => {
        console.log(`Nom d'utilisateur récupéré : ${userName}`);
        userDB = userName
        // Faites ce que vous voulez avec userName ici
    })
    .catch((error) => {
        console.error("Une erreur s'est produite : ", error);
    });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {  
  let user, data_checker;
  if(request.action === "open_interface"){
    console.log('launch detected antoned interface');
    detectOnotherInterface();
    console.log('launch detected soprod tab and snip username ');
    detectSoprod();
     console.log(' ???????????????????????????????????????????? data de datachecker : ',request.data);
     (cmp<2)&&cmp++;
     console.log(' cmp + 1 in datachecker interface : ',cmp);
     data_checker = request.data
     global_data.dataChecker = request.data;
  }
  if (request.user) {
    console.log(' ???????????????????????????????????????????? data de user Soprod : ',request.user);
    (cmp<1) && cmp++;
    console.log(' cmp + 1 in user soprod : ',cmp);
    user = request.user;
    global_data.user = user;
  }else{
    (cmp<1) && cmp++;
  }
  let interCheck;
  const checkDatas = () => {
    cmpInterval ++;
    // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><<< CMP : ',{cmp}, 'globale user : ', global_data.user);
    // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> interval count : ',{cmpInterval});
    // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> open interface data : ',{data_checker});
    if(cmp === 2){
      console.log('IIIIIIIIIIIIIIIIIIIISSSSSSSSSSSSSSSSSSSSSSSss interval function ready : ',{interCheck});
      clearInterval(interCheck);
      if(data_checker ){
      global_data.user = (global_data.user) ? global_data.user : 'Customer';
      console.log('OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO les deux datas sont bien arrivées : ',{global_data});
      const dataCheckerParse = JSON.parse(global_data.dataChecker);
    creatDB(global_data.user, db_name, dataCheckerParse);
    console.log('CREATEDB lanche with the datas :  user = ',global_data.user, {db_name}, {dataCheckerParse});

    
    const interfacePopupUrl = chrome.runtime.getURL("interface.html");
          chrome.windows.create({
            url: `${interfacePopupUrl}`, //?data=${encodeURIComponent(JSON.stringify(dataCheckerJSON))}
            type: "popup",
            width: 1000,
            height: 1000,
          });
        }
      }
  };
  
  interCheck =  setInterval(checkDatas,500);
  (cmp>2)&& clearInterval(interCheck);
  
});