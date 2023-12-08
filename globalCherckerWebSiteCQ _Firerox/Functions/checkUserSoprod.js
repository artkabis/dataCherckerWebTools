


 (async() =>{
  console.log('detecting soprod tab');
    const allTabs = await chrome.tabs.query({});
    let isSoprodTab = {};
    isSoprodTab.detected = false;
    allTabs.forEach(async (tab, i) => {
      console.log('tab scanned : ',tab);
      if (tab.url.includes("soprod")) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function(tab) {
            console.log(tab.url);
            let cmp = 0
            let dropUser = (document.querySelector(".dropdown-user .username").length) ? document.querySelector(".dropdown-user .username") : false;
            console.log('in Soprod tab : ',{dropUser},{cmp});
            if(tab.url.includes('soprod') && cmp === 0){
              const user = dropUser?.innerHTML;
              user_soprod = user;
              console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ user Soprod detecté : ' + user_soprod);
              (dropUser) ? chrome.storage.sync.set({ user: user_soprod }, function () {
                console.log("---------------------storage sync user : ", { user });
                chrome.runtime.sendMessage({ user: user_soprod });
              }) :         chrome.storage.sync.set({ user: 'Customer' }, function () {
              
                console.log("---------------------storage sync user not deteceted : ", { user });
                chrome.runtime.sendMessage({ user: 'Customer' });
              });
            }
          },
        });
      }
    });
})();