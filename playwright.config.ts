import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: './test/extension',

	use: {
		headless: false,
	},
})
