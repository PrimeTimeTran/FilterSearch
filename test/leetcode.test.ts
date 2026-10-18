import { describe, expect, it, vi } from 'vitest'

import {
	convertChromeTab,
	extractProblemReference,
	initializeExtension,
	isLeetCodeProblem,
	isSuccessful,
	registerTabListeners,
} from '../src'
import { chrome } from './mocks'

describe('isLeetCodeProblem', () => {
	it('accepts a LeetCode problem URL', () => {
		expect(isLeetCodeProblem('https://leetcode.com/problems/two-sum')).toBe(
			true,
		)
	})

	it('accepts problem URLs with query parameters', () => {
		expect(
			isLeetCodeProblem('https://leetcode.com/problems/two-sum/?foo=bar'),
		).toBe(true)
	})

	it('rejects the LeetCode homepage', () => {
		expect(isLeetCodeProblem('https://leetcode.com/')).toBe(false)
	})

	it('rejects non-LeetCode URLs', () => {
		expect(isLeetCodeProblem('https://google.com/problems/two-sum')).toBe(false)
	})

	it('rejects a problem path without a slug', () => {
		expect(isLeetCodeProblem('https://leetcode.com/problems/')).toBe(false)
	})
})

describe('extractProblemReference', () => {
	it('extracts the problem slug', () => {
		expect(
			extractProblemReference('https://leetcode.com/problems/two-sum'),
		).toEqual({
			url: 'https://leetcode.com/problems/two-sum',
			slug: 'two-sum',
		})
	})

	it('returns null for non-problem URLs', () => {
		expect(extractProblemReference('https://leetcode.com/')).toBeNull()
	})
})

describe('convertChromeTab', () => {
	it('converts a complete Chrome tab', () => {
		expect(
			convertChromeTab(42, {
				id: 42,
				url: 'https://leetcode.com/problems/two-sum',
				title: 'Two Sum',
			} as chrome.tabs.Tab),
		).toEqual({
			id: 42,
			url: 'https://leetcode.com/problems/two-sum',
			title: 'Two Sum',
		})
	})

	it('normalizes missing URL', () => {
		expect(convertChromeTab(42, {} as chrome.tabs.Tab)).toEqual({
			id: 42,
			url: '',
			title: '',
		})
	})
})

describe('initializeExtension', () => {
	it('registers tab listeners', () => {
		const onActivated = {
			addListener: vi.fn(),
		}
		const onUpdated = {
			addListener: vi.fn(),
		}
		vi.stubGlobal('chrome', {
			tabs: {
				onActivated,
				onUpdated,
			},
		})
		registerTabListeners()
		expect(onActivated.addListener).toHaveBeenCalledOnce()
		expect(onUpdated.addListener).toHaveBeenCalledOnce()
	})
})

describe('isSuccessful', () => {
	it('accepts accepted submissions', () => {
		expect(isSuccessful({ status: 'accepted' })).toBe(true)
	})

	it('rejects non-accepted submissions', () => {
		expect(isSuccessful({ status: 'wrong-answer' })).toBe(false)
	})
})
