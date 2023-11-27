/****** check all tab */
(async () => {
    console.log('start check onother interface.html');
  const allTabs = await chrome.tabs.query({});
  console.log({allTabs});
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
})();
