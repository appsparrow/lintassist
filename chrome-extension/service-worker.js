// Handling the toolbar click explicitly grants activeTab for the tab the
// user invoked the extension on, then opens the side panel for that tab.
chrome.action.onClicked.addListener((tab) => {
  if (!tab.windowId || !tab.id) return;
  chrome.sidePanel.open({ windowId: tab.windowId });
});
