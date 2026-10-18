import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, test, expect } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.resolve(__dirname, '../../dist')

test('loads the extension', async () => {
	const context = await chromium.launchPersistentContext('', {
		headless: false,
		args: [
			`--disable-extensions-except=${extensionPath}`,
			`--load-extension=${extensionPath}`,
		],
	})

	try {
		expect(context).toBeDefined()
	} finally {
		await context.close()
	}
})
