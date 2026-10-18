let scanTimer: ReturnType<typeof setInterval> | undefined

export interface SiteAdapter {
	readonly id: string
	matches(host: string): boolean
	findFeed(): Element | null
	findCandidates(feed: Element): Element[]
	isPromoted(post: Element): boolean
}

interface HiddenPost {
	placeholder: Comment
	parent: Node
	transition: string
	opacity: string
	pointerEvents: string
	timeout?: ReturnType<typeof setTimeout>
}

export interface FilterSearchController {
	setEnabled(enabled: boolean): void
	dispose(): void
}

const adapters: SiteAdapter[] = [
	{
		id: 'linkedin',

		matches: (host) =>
			host === 'linkedin.com' || host.endsWith('.linkedin.com'),

		findFeed: () => document.querySelector('[data-testid="mainFeed"]'),

		findCandidates: (feed) =>
			Array.from(feed.querySelectorAll('[data-lazy-mount-id]')),

		isPromoted: (post) =>
			Array.from(post.querySelectorAll('span')).some(
				(el) => el.textContent?.trim() === 'Promoted',
			),
	},
]

export function createFilterSearch(): FilterSearchController | null {
	const foundAdapter = adapters.find((item) => item.matches(location.hostname))
	if (!foundAdapter) return null

	const adapter: SiteAdapter = foundAdapter
	console.info('[Filter/Search] DOMAIN_MATCH', {
		host: location.hostname,
		adapter: adapter.id,
		url: location.href,
	})
	let enabled = true
	let disposed = false
	let feed: Element | null = null
	let feedObserver: MutationObserver | null = null
	let pageObserver: MutationObserver | null = null
	let navigationTimer: ReturnType<typeof setTimeout> | undefined

	const hidden = new Map<Element, HiddenPost>()

	const log = (event: string, details: Record<string, unknown> = {}) =>
		console.info(`[Filter/Search][${adapter.id}] ${event}`, details)

	function updateButton(): void {
		const button = document.getElementById('filter-search-toggle')
		if (!(button instanceof HTMLButtonElement)) return

		button.textContent = `Filter/Search: ${enabled ? 'ON' : 'OFF'} (${hidden.size} hidden)`

		button.style.background = enabled ? '#176b45' : '#555'
	}

	function restorePost(post: Element): void {
		const record = hidden.get(post)
		if (!record) return

		if (record.timeout !== undefined) {
			clearTimeout(record.timeout)
		}

		if (record.placeholder.parentNode) {
			record.placeholder.parentNode.insertBefore(post, record.placeholder)
			record.placeholder.remove()
		} else if (!post.isConnected && record.parent.isConnected) {
			record.parent.appendChild(post)
			log('RESTORE_POSITION_LOST', {})
		}

		post instanceof HTMLElement && (post.style.transition = record.transition)
		if (post instanceof HTMLElement) {
			post.style.opacity = record.opacity
			post.style.pointerEvents = record.pointerEvents
		}

		hidden.delete(post)
		updateButton()
	}

	function hidePost(post: Element): void {
		if (hidden.has(post) || !post.parentNode) return

		const parent = post.parentNode
		const placeholder = document.createComment('Filter/Search hidden post')

		parent.insertBefore(placeholder, post)

		const htmlPost = post instanceof HTMLElement ? post : null

		const record: HiddenPost = {
			placeholder,
			parent,
			transition: htmlPost?.style.transition ?? '',
			opacity: htmlPost?.style.opacity ?? '',
			pointerEvents: htmlPost?.style.pointerEvents ?? '',
		}

		hidden.set(post, record)

		if (htmlPost) {
			htmlPost.style.transition = 'opacity 220ms ease'
			htmlPost.style.opacity = '0'
			htmlPost.style.pointerEvents = 'none'
		}

		record.timeout = setTimeout(() => {
			if (!enabled || disposed) {
				restorePost(post)
				return
			}

			post.remove()
			log('POST_HIDDEN')
			updateButton()
		}, 240)

		updateButton()
	}

	function filterFeed(): void {
		if (!enabled || disposed || !feed?.isConnected) return

		const candidates = adapter.findCandidates(feed)

		console.info('[Filter/Search] SCAN', {
			feed: feed.tagName,
			candidates: candidates.length,
			promoted: candidates.filter((post) => adapter.isPromoted(post)).length,
		})

		for (const post of candidates) {
			if (adapter.isPromoted(post)) {
				hidePost(post)
			}
		}
	}

	function attachFeed(): boolean {
		const nextFeed = adapter.findFeed()
		if (!nextFeed) return false

		if (feed === nextFeed && feedObserver) {
			filterFeed()
			return true
		}

		feedObserver?.disconnect()
		feedObserver = null

		// Restore posts before abandoning an old feed.
		for (const post of [...hidden.keys()]) {
			restorePost(post)
		}

		feed = nextFeed
		feedObserver = new MutationObserver(filterFeed)

		feedObserver.observe(feed, {
			childList: true,
			subtree: true,
		})

		log('OBSERVER_ATTACHED')
		filterFeed()
		return true
	}

	function ensureButton(): void {
		if (document.getElementById('filter-search-toggle')) return

		const button = document.createElement('button')
		button.id = 'filter-search-toggle'
		button.type = 'button'

		button.style.cssText = [
			'position:fixed',
			'left:20px',
			'bottom:20px',
			'z-index:2147483647',
			'padding:10px 14px',
			'border:0',
			'border-radius:10px',
			'color:white',
			'font:600 13px system-ui',
			'cursor:pointer',
			'box-shadow:0 2px 12px #0004',
		].join(';')

		button.addEventListener('click', () => {
			controller.setEnabled(!enabled)
		})

		document.body.appendChild(button)
		updateButton()
	}

	const controller: FilterSearchController = {
		setEnabled(value) {
			if (disposed) return
			enabled = value

			if (enabled) {
				attachFeed()
				filterFeed()
			} else {
				for (const post of [...hidden.keys()]) {
					restorePost(post)
				}
			}

			updateButton()
			log('FILTER_TOGGLED', { enabled, hiddenCount: hidden.size })
		},

		dispose() {
			if (disposed) return
			disposed = true

			if (scanTimer !== undefined) {
				clearInterval(scanTimer)
				scanTimer = undefined
			}

			feedObserver?.disconnect()
			pageObserver?.disconnect()
			window.removeEventListener('popstate', scheduleRefresh)
			window.removeEventListener('hashchange', scheduleRefresh)

			if (navigationTimer !== undefined) {
				clearTimeout(navigationTimer)
			}

			for (const post of [...hidden.keys()]) {
				restorePost(post)
			}

			document.getElementById('filter-search-toggle')?.remove()
			feed = null
			log('DISPOSED')
		},
	}

	function scheduleRefresh(): void {
		if (navigationTimer !== undefined) {
			clearTimeout(navigationTimer)
		}

		navigationTimer = setTimeout(() => {
			if (disposed) return

			if (!attachFeed()) {
				log('FEED_NOT_FOUND')
			}
		}, 0)
	}
	function installNavigationListeners(): void {
		window.addEventListener('popstate', scheduleRefresh)
		window.addEventListener('hashchange', scheduleRefresh)

		for (const method of ['pushState', 'replaceState'] as const) {
			const original = history[method]

			history[method] = function (...args) {
				const result = original.apply(this, args)
				scheduleRefresh()
				return result
			}
		}
	}
	function startRescanTimer(): void {
		if (scanTimer !== undefined) {
			clearInterval(scanTimer)
		}

		scanTimer = setInterval(() => {
			if (disposed || !enabled) return

			// LinkedIn may replace the feed during client-side navigation.
			attachFeed()
		}, 1000)
	}
	function start(): void {
		ensureButton()
		startRescanTimer()
		if (!attachFeed()) {
			log('WAITING_FOR_FEED')
			pageObserver = new MutationObserver(() => {
				if (disposed) return
				ensureButton()
				if (attachFeed()) {
					pageObserver?.disconnect()
					pageObserver = null
				}
			})
			pageObserver.observe(document.documentElement, {
				childList: true,
				subtree: true,
			})
		}
		installNavigationListeners()
	}

	start()
	return controller
}
