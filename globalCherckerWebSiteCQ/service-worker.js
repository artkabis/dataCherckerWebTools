




chrome.runtime.onStartup.addListener( () => {
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
      chrome.declarativeNetRequest.updateEnabledRulesets(corsEnabled ? {
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
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('message bg.js:', request.corsEnabled);
    if (request.corsEnabled !== undefined) {
      chrome.storage.sync.set({ corsEnabled: request.corsEnabled }, () => {
        corsEnabled = request.corsEnabled;
        toggleCorsEnabled(corsEnabled);
      });
    }
  });
  
  const once = () => {
    chrome.storage.sync.get('corsEnabled', result => {
      corsEnabled = result.corsEnabled;
      toggleCorsEnabled();
    });
  };
  
  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
  
  
  let n = 0;
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
    (e) => console.log(e, ++n)
  );