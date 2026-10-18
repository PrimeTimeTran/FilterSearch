// import { execOnTab } from './executor.js'
// import { getMp4Url } from './storage.js'

// function pageScript(snippetId) {
//   console.log(`🔥 Script/Snippet Invoked ${snippetId}:`, location.href)
// }

export async function runSnippet5(tab) {
  try {
    console.log('Triggering content script...')

    chrome.tabs.sendMessage(tab.id, {
      type: 'SCRAPE_IMAGES',
    })
  } catch (e) {
    console.error('runSnippet5 failed:', e)
  }
}
function runSnippet1(tab) {
  console.log(tab)
  return chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['snippets/app-submit/dist/bundle.js'],
  })
}

export async function runSnippet2() {
  try {
    console.log('🔥 runSnippet2 START')

    const groups = await chrome.tabGroups.query({})
    if (!groups.length) return

    const targetGroup = groups[0]

    const groupTabs = await chrome.tabs.query({
      groupId: targetGroup.id,
    })

    const firstTab = groupTabs[0]

    if (!firstTab) {
      console.warn('No tabs in group')
      return
    }

    await chrome.tabs.update(firstTab.id, {
      active: true,
    })

    console.log('✅ Focused first tab in group 0:', firstTab.id)
  } catch (e) {
    console.error('❌ runSnippet2 failed:', e)
  }
}

export async function runSnippet3() {
  try {
    console.log('🔥 runSnippet3 START')

    const groups = await chrome.tabGroups.query({})
    if (groups.length < 2) return

    const targetGroup = groups[1]

    const groupTabs = await chrome.tabs.query({
      groupId: targetGroup.id,
    })

    const firstTab = groupTabs[0]

    if (!firstTab) {
      console.warn('No tabs in group')
      return
    }

    await chrome.tabs.update(firstTab.id, {
      active: true,
    })

    console.log('✅ Focused tab:', firstTab.id)
  } catch (e) {
    console.error('❌ runSnippet3 failed:', e)
  }
}

export async function runSnippetNewTabRight(tab) {
  try {
    console.log('🔥 new tab to right')

    if (!tab) return

    // 1. Create tab to the right
    const newTab = await chrome.tabs.create({
      windowId: tab.windowId,
      index: tab.index + 1,
      active: true,
      openerTabId: tab.id,
    })

    // 2. Re-attach to same group (if exists)
    if (tab.groupId !== chrome.tabs.TAB_ID_NONE) {
      await chrome.tabs.group({
        tabIds: newTab.id,
        groupId: tab.groupId,
      })
    }

    console.log('Created tab:', newTab.id)
  } catch (e) {
    console.error('❌ failed new tab right:', e)
  }
}

export const snippets = {
  'run-snippet-1': runSnippet1,
  'run-snippet-2': runSnippet2,
  'run-snippet-3': runSnippet3,
  'run-snippet-4': runSnippetNewTabRight,
  'run-snippet-5': runSnippet5,
}

const runningSnippets = new Map()

export async function handleSnippet(command, tab) {
  const key = `${command}:${tab.id}`
  const now = Date.now()

  const lastRun = runningSnippets.get(key)

  // lock for 1.5s (adjust as needed)
  if (lastRun && now - lastRun < 1500) {
    console.warn('Blocked duplicate snippet:', key)
    return
  }

  runningSnippets.set(key, now)

  try {
    const fn = snippets[command]

    if (!fn) {
      console.error('Unknown snippet command:', command)
      return
    }

    return await fn(tab)
  } catch (err) {
    console.error('Snippet failed:', command, err)
  }
}
