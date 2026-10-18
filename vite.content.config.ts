import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const root = process.cwd()
const outDir = resolve(root, 'dist')

export default defineConfig({
	build: {
		outDir,
		emptyOutDir: true,
		sourcemap: false,
		lib: {
			entry: resolve(root, 'src/content/index.ts'),
			name: 'FilterSearch',
			formats: ['iife'],
			fileName: () => 'content.js',
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
			},
		},
	},
	plugins: [
		{
			name: 'copy-extension-manifest',
			closeBundle() {
				mkdirSync(outDir, { recursive: true })
				copyFileSync(
					resolve(root, 'src/manifest.json'),
					resolve(outDir, 'manifest.json'),
				)
			},
		},
	],
})
