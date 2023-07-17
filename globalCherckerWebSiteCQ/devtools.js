chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ['0']
    });
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openDevToolsTab') {
      chrome.tabs.create({ url: message.url });
    }
  });
  
  chrome.runtime.onConnect.addListener(port => {
    port.onMessage.addListener(message => {
      if (message.action === 'fetch') {
        fetch(message.url)
          .then(response => response.text())
          .then(content => {
            port.postMessage({ action: 'fetchResponse', content });
          })
          .catch(error => {
            port.postMessage({ action: 'fetchError', error });
          });
      }
    });
  });