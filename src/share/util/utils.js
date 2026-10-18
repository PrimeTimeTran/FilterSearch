export function isWebTab(tab) {
  return Boolean(tab?.id && tab?.url && tab.url.startsWith('http'))
}
