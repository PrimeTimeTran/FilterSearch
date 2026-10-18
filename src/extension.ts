import { BrowserTab } from './@types'

/* ============================================================================
 * 2. EXTENSION LIFECYCLE
 * ============================================================================
 *
 * This is the browser-facing portion.
 */

/**
 * Called when the extension starts.
 *
 * This is where we eventually register all Chrome listeners.
 */
export async function initializeExtension(): Promise<void> {
	await initializeStorage()
	registerTabListeners()
	registerCommandListeners()
	registerRuntimeListeners()
	await inspectCurrentTab()
}

export function registerTabListeners(): void {
	chrome.tabs.onActivated.addListener(async ({ tabId }) => {
		await handleActiveTabChanged(tabId)
	})

	chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
		if (changeInfo.status !== 'complete') {
			return
		}

		await handleTabUpdated(tabId, tab)
	})
}
/**
 * Commands will eventually provide the primary user interaction.
 */
// export function registerCommandListeners(): void {
// 	chrome.commands.onCommand.addListener(async (command) => {
// 		// if (command === 'open-agent') {
// 		// 	await handleAgentCommand()
// 		// }
// 	})
// }
export function registerCommandListeners(): void {
	// No keyboard commands are configured for Filter/Search yet.
}
/**
 * Runtime messages allow content.ts and background.ts to communicate.
 */
export function registerRuntimeListeners(): void {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		void handleRuntimeMessage(message, sender).then(sendResponse)

		return true
	})
}

/**
 * Inspect whichever tab is currently active when the extension starts.
 */
export async function inspectCurrentTab(): Promise<void> {
	const tab = await getActiveTab()

	if (!tab) {
		return
	}

	await inspectTab(tab)
}

/**
 * Called whenever the active tab changes.
 */
export async function handleActiveTabChanged(tabId: number): Promise<void> {
	const tab = await getTab(tabId)

	if (!tab) {
		return
	}

	await inspectTab(tab)
}

/**
 * Called whenever a page finishes loading.
 */
export async function handleTabUpdated(
	tabId: number,
	tab: chrome.tabs.Tab,
): Promise<void> {
	const browserTab = convertChromeTab(tabId, tab)

	await inspectTab(browserTab)
}
export async function handleRuntimeMessage(
	message: unknown,
	sender: chrome.runtime.MessageSender,
): Promise<unknown> {
	console.log('Runtime message:', message, sender)

	return null
}
export async function getActiveTab(): Promise<BrowserTab | null> {
	const [tab] = await chrome.tabs.query({
		active: true,
		currentWindow: true,
	})

	if (tab?.id === undefined || !tab.url) {
		return null
	}

	return convertChromeTab(tab.id, tab)
}
export async function getTab(tabId: number): Promise<BrowserTab | null> {
	const tab = await chrome.tabs.get(tabId)

	if (!tab.url) {
		return null
	}

	return convertChromeTab(tabId, tab)
}

export function convertChromeTab(
	tabId: number,
	tab: chrome.tabs.Tab,
): BrowserTab {
	return {
		id: tabId,
		url: tab.url ?? '',
		title: tab.title ?? '',
	}
}
/**
 * Determine whether the current page is something the agent understands.
 */
export async function inspectTab(tab: BrowserTab): Promise<void> {
	// 	if (!isLeetCodeProblem(tab.url)) {
	// 		await deactivateAgent(tab)
	// 		return
	// 	}
	//
	// 	await activateAgent(tab)
}

export async function initializeStorage(): Promise<void> {
	/*
	 * TODO:
	 *
	 * Initialize IndexedDB / chrome.storage / local filesystem
	 * / Estate connection.
	 */
}
