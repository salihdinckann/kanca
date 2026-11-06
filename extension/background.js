// Right-click → "Scan … with Kanca" opens the popup UI in a small window.
// Nothing is scanned automatically: a URL only leaves the browser when the user asks.

const MENUS = [
  { id: "kanca-scan-link", contexts: ["link"], title: "contextMenu" },
  { id: "kanca-scan-selection", contexts: ["selection"], title: "contextMenuSelection" },
  { id: "kanca-scan-page", contexts: ["page"], title: "contextMenuPage" },
];

// Menus are rebuilt on every service-worker start, not only on install: if the
// install-time call failed once, the item would otherwise never come back.
function registerMenus() {
  chrome.contextMenus.removeAll(() => {
    for (const m of MENUS) {
      chrome.contextMenus.create({ id: m.id, contexts: m.contexts, title: chrome.i18n.getMessage(m.title) }, () => {
        if (chrome.runtime.lastError) console.warn("Kanca menu:", chrome.runtime.lastError.message);
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(registerMenus);
chrome.runtime.onStartup.addListener(registerMenus);
registerMenus();

chrome.contextMenus.onClicked.addListener((info) => {
  const target =
    info.menuItemId === "kanca-scan-link" ? info.linkUrl :
    info.menuItemId === "kanca-scan-selection" ? info.selectionText :
    info.menuItemId === "kanca-scan-page" ? info.pageUrl : null;
  if (!target) return;
  chrome.windows.create({
    url: `popup.html?url=${encodeURIComponent(target.trim())}`,
    type: "popup",
    width: 400,
    height: 600,
  });
});
