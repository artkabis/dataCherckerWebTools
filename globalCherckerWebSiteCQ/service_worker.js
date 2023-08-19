//import {openDb,getObjectStore} from './Functions/utils.js'

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
  // console.log("message service worker global :", request);
  // (request.action==='open_interface') && chrome.storage.sync.set({ dataChecker: request.data }, function(){
  //   datas_checker =  {datas:  JSON.parse(request.data)};
  //   console.log('----------------------- request data checker request !!!! ',datas_checker);

  //   /*chrome.runtime.sendMessage({
  //     action: "user",
  //     data: userSoprod,
  //   });*/
  // });
  // const userRequest  = (request.user) && chrome.storage.sync.set({ user: request.user }, function(){
  //   console.log('----------------------- request user soprod !!!! ',request.user);
  //   userSoprod =  request.user;
  //   /*chrome.runtime.sendMessage({
  //     action: "user",
  //     data: userSoprod,
  //   });*/
  // });
  // console.log('----------------- userRequest user Soprod', {userSoprod});
  // console.log('----------------- userRequest datas_checker', {datas_checker});
  if (request.corsEnabled !== undefined) {
    /* sendResponse({user: request.user});
    chrome.storage.sync.set({ user: request.user },()=>{
      userSoprod = request.user;
      console.log("user bg.js syncSet :", request.user);
      getUserMessage(userSoprod);
    });*/
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
// const getUserMessage=(user)=>{
//   chrome.storage.sync.get("user", (result) => {

//     console.log('function get user sync get : ',{user});
//   });
// }

chrome.runtime.onInstalled.addListener(once);
chrome.runtime.onStartup.addListener(once);
let user_soprod;
let interfacePageExist = false;
/****** check all tab */

const  detectOnotherInterface = async () => {
  const allTabs = await chrome.tabs.query({});
  allTabs.forEach((tab, i) => {
    //const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});

    console.log(
      "--------------------------------------------------------------------------------- tab & i ",
      { tab },
      { i },
      tab[i]
    );
    if (tab.url.includes("interface.html")) {
      console.log(
        "----------------------------- tab interface.html detected : ",
        { tab }
      );
      chrome.tabs.remove(tab.id);
      console.log(
        "after remove ----------------------------- tab interface.html detected : ",
        { tab }
      );
    } else {
      console.log(
        "----------------------------- tab interface.html non trouvé : ",
        { tab }
      );
    }

  });
};

const detectSoprod = async () =>{
  const allTabs = await chrome.tabs.query({});
  let isSoprodTab = {};
  allTabs.forEach(async (tab, i) => {
  if (tab.url.includes("soprod")) {
    isSoprodTab.detected = true;
    console.log({isSoprodTab})
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function() {
        const dropUser = document.querySelector(".dropdown-user .username");
        const user = dropUser?.innerHTML;
        user_soprod = user;
        chrome.storage.sync.set({ user: user_soprod }, function () {
          console.log("---------------------storage sync user : ", { user });
          chrome.runtime.sendMessage({ user: user_soprod });
        });
      },
    });
  }
});

}


detectSoprod();
detectOnotherInterface();
let cmp = 0;
let cmpInterval = 0;
let global_data = {};
const db_name = "db_datas_checker";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  
  //console.log("^^^^^^^^^^^^^^^^^^^^^^^request on message in service worker : ", { request });
  let user, data_checker;
  if(request.action === "open_interface"){
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
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><<< CMP : ',{cmp}, 'globale user : ', global_data.user);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> interval count : ',{cmpInterval});
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> open interface data : ',{data_checker});
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
    // }else if(global_data.user && !global_data.user){
    //   (cmp===1 && cmp <3) && cmp ++;
    //   global_data.user = 'Customer';
    // }
  };
  
  interCheck =  setInterval(checkDatas,500);
  (cmp>2)&& clearInterval(interCheck);
  
});


/****
 * * Index DB
 */

let mydb = null;
const creatDB = (user, db_name, datas) => {
  const DBOpenRequest = indexedDB.open(db_name, 4);
  console.log("---------------- CREATED DB ----------------");
  console.log('_______________________________ verification des donné passées à creatDB : ',{user},{db_name},{datas});

  DBOpenRequest.onsuccess = (event) => {
    mydb = DBOpenRequest?.result;
    console.log("db open succes : ", event?.target?.result);
    addData(user, mydb, db_name, datas); //Lancement de la création du store de la db
  };
  DBOpenRequest.onupgradeneeded = (event) => {
    mydb = event?.target?.result;
    console.log("db opened : onupgradeneeded :", { mydb });

    mydb.onerror = (event) => {
      console.log("Error loading database.", event);
    };

    mydb.onsuccess = (event) => {
      console.log("upgrade successful", event);
    };
    let objectStore = mydb.createObjectStore(db_name, {
      keyPath: "id",
    });
    console.log("____ service worker - onupgradeneeded : objectStore -> ", {
      objectStore,
    });
    console.log("data parse in creatDB: ", { datas });
  };
};
const addData = (user, mydb, db_name, datas) => {
  let userSoprod = user ? user : "Customer";
  const transaction = mydb
    ? mydb.transaction([db_name], "readwrite")
    : console.warn("Attention la bd d'indexDB n'est pas disponible");
  console.log("--------------------------- transaction readwrite : ", {
    transaction,
  });
  const objectStore = transaction.objectStore(db_name);
  let objectStoreRequest;
  const getObjectStore = objectStore?.get("dcw");
  const timeStamp = Date.now();
  console.log("timeStamp before on message userName : ", { timeStamp });


  console.log(
    "cccccccccccccccccccccccccccccccccccccccheck timestamp ",
    getObjectStore.timestamp,
    timeStamp
  );
  if (getObjectStore && objectStore.get("dcw")) {
    console.log("get  getObjectStore : ", { getObjectStore });
    objectStore.delete("dcw");
    objectStoreRequest = objectStore?.add({
      id: "dcw",
      title: "DataCheckerWebSite",
      data: datas,
      timestamp: timeStamp,
      user: userSoprod,
    });
  } else if (!getObjectStore) {
    objectStoreRequest = objectStore?.add({
      id: "dcw",
      title: "DataCheckerWebSite",
      data: datas,
      timestamp: timeStamp,
      user: userSoprod,
    });
  }
  transaction.oncomplete = (e) => {
    console.log("_____ transaction complete : ", e);
  };
  objectStoreRequest.onsuccess = function (event) {
    console.log("Nouvel objet ajouté dans la base de données >>>> ", {
      event,
    });
  };

  console.log("___________________ objectStore : ", { objectStore });
  const requestCursor = objectStore?.openCursor();
  requestCursor.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      if (cursor.value.title === "DataCheckerWebSite" && cursor.value.timeStamp !== timeStamp) {
        console.log("cursor value detected global_datas : ", cursor.value);
        const updateData = cursor.value;

        updateData.timestamp = Date.now();
        updateData.name = userSoprod;
        updateData.data = datas;
        const request = cursor?.update(updateData);
        request.onsuccess = () => {
          console.log("update timestamp : ", { updateData });
        };
        cursor?.continue();
      } else {
        console.log("Entries all displayed.   Cursor is false");
        return;
      }
    }
  };
};