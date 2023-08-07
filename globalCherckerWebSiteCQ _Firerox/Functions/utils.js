export async function getActiveTabURL() {
    const tabs = await browser.tabs.query({
        currentWindow: true,
        active: true
    });
  
    return tabs[0];
}
