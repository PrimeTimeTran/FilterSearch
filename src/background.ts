import { initializeExtension } from './extension'

initializeExtension().catch((error: unknown) => {
	console.error('[Filter/Search] Extension initialization failed', error)
})
