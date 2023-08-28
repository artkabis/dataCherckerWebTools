


export const checkUserSoprod = (tab) =>{
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