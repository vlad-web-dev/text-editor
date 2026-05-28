import { afterEach, vi } from 'vitest'
import { config } from '@vue/test-utils'

// Suppress Tiptap "document is not defined" in happy-dom when editor extensions
// try to register keyboard shortcuts at module load time.
config.global.stubs = {}

// Reset localStorage between tests
afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
