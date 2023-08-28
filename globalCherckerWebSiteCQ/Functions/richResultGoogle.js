export const  richResultGoole = (tab) =>  {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: function () {
        window.open(
          "https://search.google.com/test/rich-results?utm_source=support.google.com%2Fwebmasters%2F&utm_medium=referral&utm_campaign=7445569&url=" +
            encodeURIComponent(window.location.href),
          "_blank",
          "width=500,height=800,toolbar=no"
        );
      },
    });
  }