/* -------------------------------------------------
 * CORE EXECUTION ENGINE
 * ------------------------------------------------- */

/**
 * Injects a function into a tab using Chrome scripting API.
 *
 * This is the ONLY way code should execute in pages.
 *
 * NOTE:
 * - fn must be serializable (no closures from background)
 * - args must be structured data only
 */
export function execOnTab(tabId, fn, args = []) {
  if (!tabId) return

  return chrome.scripting
    .executeScript({
      target: { tabId },
      func: fn,
      args,
    })
    .then(() => {
      console.log('✅ executeScript completed')
    })
    .catch((err) => {
      console.error('❌ executeScript failed:', err)
    })
}
