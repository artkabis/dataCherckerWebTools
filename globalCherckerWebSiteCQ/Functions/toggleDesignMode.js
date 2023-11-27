export const toggleDesignMode = (tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: function () {
        let dn = document.designMode;
        document.designMode = dn === "off" ? "on" : "off";
      },
    });
  }