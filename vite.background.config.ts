import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const root = process.cwd()

export default defineConfig({
	build: {
		outDir: resolve(root, 'dist'),
		emptyOutDir: false,
		sourcemap: false,
		lib: {
			entry: resolve(root, 'src/background.ts'),
			formats: ['es'],
			fileName: () => 'background.js',
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
			},
		},
	},
})
