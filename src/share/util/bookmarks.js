// import { isWebTab } from './utils.js'

export async function handleBookmark(tab) {
  console.log('🧷 toggle bookmark:', tab.url)

  chrome.bookmarks.search(tab.url, (results) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError)
      return
    }

    const match = results.find((b) => b.url === tab.url)

    if (match) {
      chrome.bookmarks.remove(match.id, () => {
        console.log('removed bookmark')
      })
    } else {
      chrome.bookmarks.create(
        {
          title: tab.title,
          url: tab.url,
        },
        () => {
          console.log('added bookmark')
        },
      )
    }
  })
}
