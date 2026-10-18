import { setLastValidTabId } from "./state.js";
import { isWebTab } from "./utils.js";

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (!isWebTab(tab)) return;
    setLastValidTabId(tab.id);

    console.log("✅ ACTIVE TAB:", tab.url);
  });
});

export function getActiveTab(cb) {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
    cb(tab);
  });
}
