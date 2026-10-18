import { createFilterSearch } from '../features/filter-search'

const filterSearch = createFilterSearch()

chrome.runtime.onMessage.addListener((message: unknown) => {
	if (typeof message !== 'object' || message === null || !('type' in message)) {
		return
	}

	if (message.type === 'FILTER_SEARCH_ENABLE') {
		filterSearch?.setEnabled(true)
	} else if (message.type === 'FILTER_SEARCH_DISABLE') {
		filterSearch?.setEnabled(false)
	}
})
