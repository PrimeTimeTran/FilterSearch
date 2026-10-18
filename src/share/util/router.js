import { executeCommand } from "./executeCommand.js";
import { state } from "./state.js";

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "RUN") return;

  chrome.tabs.get(state.lastValidTabId, (tab) => {
    if (!tab?.id) return;

    executeCommand(msg.command, tab);
  });
});
