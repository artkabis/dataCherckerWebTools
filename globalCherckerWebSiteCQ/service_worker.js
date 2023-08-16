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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("message bg.js CorsEnable :", request.corsEnabled, request);
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


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("-------------------------message in interface: ", { request });
  if (request.action === "open_interface") {
    const dataCheckerJSON = JSON.parse(request.data);
    //Create indexDB for stock dataChecker
    const db_name = "db_datas_checker";
    creatDB(db_name, dataCheckerJSON);

    console.log("datachecker send message data : ", dataCheckerJSON);
    //chrome.runtime.sendMessage({ 'send_data_interface': JSON.stringify(dataCheckerJSON)});

    //  chrome.storage.local.set({ 'send_data_interface': dataCheckerJSON }).then((data) => {
    //   console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ send_data_interface",{data});
    // });





    /******* Method post data in getURL ****/
    var interfacePopupUrl = chrome.runtime.getURL("interface.html");
    chrome.windows.create({
      url: `${interfacePopupUrl}`, //?data=${encodeURIComponent(JSON.stringify(dataCheckerJSON))}
      type: "popup",
      width: 1000,
      height: 1000,
    });
     
  }
});

/****
 * * Index DB
 */

let mydb = null;
const creatDB = (db_name, datas) => {
  const DBOpenRequest = indexedDB.open(db_name, 4);

  DBOpenRequest.onsuccess = (event) => {
    // store the result of opening the database in the db variable.
    // This is used a lot below
    mydb = DBOpenRequest.result;

    // Run the addData() function to add the data to the database
    console.log("db open succes : ", event.target.result);
    addData(db_name, datas);
  };
  DBOpenRequest.onupgradeneeded = (event) => {
    mydb = event.target.result;
    console.log('db opened : onupgradeneeded :', {mydb});

    mydb.onerror = (event) => {
      console.log("Error loading database.", event);
    };

    mydb.onsuccess = (event) => {
      console.log("upgrade successful", event);

    };
    // Create an objectStore for this database
    let objectStore = mydb.createObjectStore(db_name, {
      keyPath: "id",
    });
    console.log("____ service worker - onupgradeneeded : objectStore -> ", { objectStore });
    console.log("data parse in creatDB: ", { datas });
  };
};
const addData = (db_name, datas) => {
  const transaction = mydb.transaction([db_name], "readwrite");

  console.log('--------------------------- transaction readwrite : ',{transaction});
  const objectStore = transaction.objectStore(db_name);
  let objectStoreRequest;
  const timeStamp = Date.now();
  const getObjectStore = objectStore.get('dcw');
    if(getObjectStore){
      console.log('get  getObjectStore : ',{getObjectStore});
      objectStore.delete('dcw');
      objectStoreRequest = objectStore.add({ 
        id: 'dcw',
        title: 'DataCheckerWebSite',
        data: datas,
        timestamp: timeStamp
        });
    }else{
      objectStoreRequest = objectStore.add({ 
        id: 'dcw',
        title: 'DataCheckerWebSite',
        data: datas,
        timestamp: timeStamp
        });
    }
    transaction.oncomplete = (e) => {
      console.log('_____ transaction complete : ',e);
    };
  objectStoreRequest.onsuccess = function (event) {
    // On indique la réussite de l'insertion
    console.log("Nouvel objet ajouté dans la base de données >>>> ",{event});
  };
 
  console.log("___________________ objectStore : ", { objectStore });
  const request = objectStore.openCursor();
  request.onsuccess = (event) => {
    const cursor = event.target.result;
    // Check if there are no (more) cursor items to iterate through
    if (cursor) {
      console.log('********************************value corsor : ',cursor.value);
      if (cursor.value.title === "DataCheckerWebSite") {
        console.log("cursor value detected global_datas : ", cursor.value);
        const updateData = cursor.value;

        updateData.timestamp = Date.now();
        updateData.data = datas;
        const request = cursor.update(updateData);
        request.onsuccess = () => {
          console.log("update timestamp : ",{updateData});
        };
        cursor.continue();
      } else {
        console.log("Entries all displayed.   Cursor is false");
        return;
      }
    }
  };
};
