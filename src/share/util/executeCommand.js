import { handleBookmark } from "./bookmarks.js";
import { commands } from "./commands.js";
import { handleSnippet } from "./snippets.js";

export function executeCommand(commandId, tab) {
  console.log("⚡ EXECUTE:", commandId);

  switch (commandId) {
    case "toggle-bookmark":
      return handleBookmark(tab);

    case "open-dashboard":
      return chrome.tabs.create({
        url: chrome.runtime.getURL("dashboard.html"),
      });

    default:
      return handleSnippet(commandId, tab);
  }
}
