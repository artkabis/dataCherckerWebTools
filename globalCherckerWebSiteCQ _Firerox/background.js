



// Événement d'installation du service worker
browser.runtime.onInstalled.addListener(() => {
  // Enregistrement du service worker
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service worker enregistré avec succès!', registration);
      })
      .catch(error => {
        console.error('Échec de l\'enregistrement du service worker:', error);
      });
  }
});



// Événement fetch pour permettre au service worker de gérer les requêtes réseau
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Vérifiez si le message provient de votre contenu ou de votre script d'arrière-plan
  // pour éviter de répondre à des messages non pertinents.
  if (message.from === 'content_script' && message.subject === 'fetch') {
    // Utilisez la méthode 'fetch()' ici pour effectuer vos requêtes réseau
    // et renvoyer la réponse via 'sendResponse'.
    fetch(message.url)
      .then(response => response.text())
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    // Indiquez que vous souhaitez conserver le canal de communication ouvert
    // jusqu'à ce que la réponse soit envoyée.
    return true;
  }
});

// Vérifiez si le service worker est actif
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    console.log('Service worker prêt!', registration);
  });
}





browser.runtime.onStartup.addListener( () => {
  console.log(`background onStartup`);
});


const core = {};
self.DEFAULT_METHODS = ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH', 'PROPFIND', 'PROPPATCH', 'MKCOL', 'COPY', 'MOVE', 'LOCK'];
self.DEFAULT_STATUS_METHODS = ['GET', 'POST', 'PUT', 'OPTIONS', 'PATCH', 'PROPFIND', 'PROPPATCH'];
let prefs, corsEnabled;



/*core['csp'] = () => toggle('remove-csp', 'csp', false);
core['allow-shared-array-buffer'] = () => toggle('allow-shared-array-buffer', 'allow-shared-array-buffer', false);
core['x-frame'] = () => toggle('remove-x-frame', 'x-frame', true);
core['allow-credentials'] = () => toggle('allow-credentials', 'allow-credentials', true);
core['allow-headers'] = () => toggle('allow-headers', 'allow-headers', false);
core['referer'] = () => toggle('remove-referer', 'referer', false);*/
core['overwrite-origin']=()=> toggle('remove-overwrite-origin', 'overwrite-origin', false);

const toggle = (name, rule, value) => {
  console.log('toggle arguments : ',{name}, {rule}, {value})
    console.log('rules updated:', {rule},{value},{corsEnabled});
    browser.declarativeNetRequest.updateEnabledRulesets(corsEnabled ? {
      enableRulesetIds: [rule]
    } : {
      disableRulesetIds: [rule]
    });
  //});
};
const toggleCorsEnabled = (corsEnabled) => {
  const value = corsEnabled;
  console.log('--- toggleCorsEnabled value :', value);
  const ruleNames = ['overwrite-origin'];//'csp', 'allow-shared-array-buffer', 'x-frame', 'allow-credentials', 'allow-headers', 'referer',
  ruleNames.forEach(ruleName => {
    const prefName = `remove-${ruleName}`;
    
    core[ruleName](prefName, ruleName, value);
    console.log({ prefName }, { ruleName }, { value });
  });
  setTimeout(()=>console.log(core),200);
};

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('message bg.js CorsEnable :', request.corsEnabled);
  if (request.corsEnabled !== undefined) {
    browser.storage.sync.set({ corsEnabled: request.corsEnabled }, () => {
      corsEnabled = request.corsEnabled;
      toggleCorsEnabled(corsEnabled);
    });
  }
});

const once = () => {
  browser.storage.sync.get('corsEnabled', result => {
    corsEnabled = result.corsEnabled;
    toggleCorsEnabled();
  });
};

browser.runtime.onInstalled.addListener(once);
browser.runtime.onStartup.addListener(once);


let n = 0;
browser.declarativeNetRequest.onRuleMatchedDebug.addListener(
  (e) => console.log(e, ++n)
);


browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'open_interface') {
    var dataCheckerJSON = JSON.parse(message.data);
    var interfacePopupUrl = browser.runtime.getURL('interface.html');

    browser.windows.create({
      url: `${interfacePopupUrl}?data=${encodeURIComponent(JSON.stringify(dataCheckerJSON))}`,
      type: "popup",
      width: 1000,
      height: 1000,
    });
  }
});
self.addEventListener("message", e=>{
  if(e.data && 'open_interface' === e.data.type ){
    var dataCheckerJSON = JSON.parse(message.data);
    var interfacePopupUrl = browser.runtime.getURL('interface.html');

    browser.windows.create({
      url: `${interfacePopupUrl}?data=${encodeURIComponent(JSON.stringify(dataCheckerJSON))}`,
      type: "popup",
      width: 1000,
      height: 1000,
    });
  }

}
),
self.addEventListener("install", function(e) {
  console.log("sw install event"),
  e.waitUntil(self.skipWaiting())
}),
self.addEventListener("activate", function(e) {
  console.log("sw activate event"),
  e.waitUntil(self.clients.claim())
});