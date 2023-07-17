console.log('contenScript loaded successfully')
//DevToolsAPI.showPanel('console');
chrome.runtime.sendMessage({ action: 'openDevToolsTab', url: 'https://example.com' });


/******Dans la fin du manifest, ajouter ceci  
 * 
 * 
 * 
 * ,
    "background": {
      "service_worker": "devtools.js"
    },
    "content_scripts": [
      {
        "matches": ["<all_urls>"],
        "js": ["contentScript.js"]
      }
    ]
*/
