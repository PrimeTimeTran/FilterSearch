// import { execOnTab } from './executor.js'
// import { handleBookmark } from './bookmarks.js'

export const commands = [
  {
    id: 'run-snippet-1',
    title: 'Fill Fields Loi Tran tight maroon pushy olive stiff teal',
    category: 'Snippets',
    recent: true,
    run: () =>
      chrome.runtime.sendMessage({ type: 'RUN', command: 'run-snippet-1' }),
  },
  {
    id: 'run-snippet-5',
    title: 'Scrape Images',
    category: 'Snippets',
    recent: true,
    run: () =>
      chrome.runtime.sendMessage({ type: 'RUN', command: 'run-snippet-5' }),
  },

  {
    id: 'run-snippet-2',
    title: 'Focus Tab Group(1)',
    category: 'Snippets',
    recent: true,
    run: () =>
      chrome.runtime.sendMessage({ type: 'RUN', command: 'run-snippet-2' }),
  },
  {
    id: 'run-snippet-3',
    title: 'Focus Tab Group(2)',
    category: 'Snippets',
    recent: true,
    run: () =>
      chrome.runtime.sendMessage({ type: 'RUN', command: 'run-snippet-3' }),
  },
  {
    id: 'run-snippet-4',
    title: 'Next Tab To Right',
    category: 'Snippets',
    recent: true,
    run: () =>
      chrome.runtime.sendMessage({ type: 'RUN', command: 'run-snippet-4' }),
  },

  {
    id: 'toggle-bookmark',
    title: 'Toggle Bookmark',
    category: 'Browser',
    run: () =>
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.type !== 'RUN') return

        handleCommand(msg.command)

        sendResponse({ ok: true })
        return true
      }),
  },
]
