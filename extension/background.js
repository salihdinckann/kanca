// Right-click a link -> "Scan link with Kanca" opens the popup UI in a small window.
// Nothing is scanned automatically: a URL only leaves the browser when the user asks.

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "kanca-scan-link",
    title: chrome.i18n.getMessage("contextMenu"),
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== "kanca-scan-link" || !info.linkUrl) return;
  chrome.windows.create({
    url: `popup.html?url=${encodeURIComponent(info.linkUrl)}`,
    type: "popup",
    width: 400,
    height: 600,
  });
});
